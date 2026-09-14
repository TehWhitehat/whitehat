-- Apply once in the Whitehat Supabase project's SQL Editor.
create table public.users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique check (wallet_address ~ '^0x[0-9a-f]{40}$'),
  created_at timestamptz not null default now()
);
create table public.targets (
  id uuid primary key default gen_random_uuid(), chain_id integer not null check (chain_id in (4663,46630)),
  contract_address text not null check (contract_address ~ '^0x[0-9a-f]{40}$'),
  protocol_name text not null default '', protocol_url text not null default '', bounty_url text not null default '',
  originating_user_id uuid not null references public.users(id), created_at timestamptz not null default now(),
  unique(chain_id, contract_address)
);
create table public.submissions (
  id uuid primary key default gen_random_uuid(), target_id uuid not null references public.targets(id),
  user_id uuid not null references public.users(id), notes text not null default '', created_at timestamptz not null default now(),
  unique(target_id,user_id)
);
create table public.investigations (
  id uuid primary key default gen_random_uuid(), target_id uuid not null unique references public.targets(id),
  status text not null default 'QUEUED', current_stage text not null default 'INITIALIZING',
  started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(),
  last_sequence integer not null default 0
);
create table public.investigation_events (
  id uuid primary key default gen_random_uuid(), investigation_id uuid not null references public.investigations(id),
  sequence integer not null, timestamp timestamptz not null, agent text not null, stage text not null, status text not null,
  message text not null, data jsonb not null default '{}', event_type text not null,
  unique(investigation_id,sequence)
);
create table public.findings (
  id uuid primary key default gen_random_uuid(), investigation_id uuid not null references public.investigations(id),
  source_id text not null, title text not null, source_agent text not null, severity text not null, confidence text not null,
  status text not null, affected_component text not null, public_summary text not null default 'Evidence requires human review.',
  private_detail jsonb not null, created_at timestamptz not null default now(), unique(investigation_id,source_id)
);
create table public.reports (
  id uuid primary key default gen_random_uuid(), investigation_id uuid not null unique references public.investigations(id),
  public_report jsonb not null, private_report jsonb not null, created_at timestamptz not null default now()
);
create index submissions_user_idx on public.submissions(user_id,created_at desc);
create index investigations_created_idx on public.investigations(created_at desc);
create index findings_status_idx on public.findings(investigation_id,status);
create index targets_scout_idx on public.targets(originating_user_id);

-- Browser roles have no access. All public responses use explicit server allowlists.
alter table public.users enable row level security;
alter table public.targets enable row level security;
alter table public.submissions enable row level security;
alter table public.investigations enable row level security;
alter table public.investigation_events enable row level security;
alter table public.findings enable row level security;
alter table public.reports enable row level security;
revoke all on public.users, public.targets, public.submissions, public.investigations, public.investigation_events, public.findings, public.reports from anon, authenticated;
grant all on public.users, public.targets, public.submissions, public.investigations, public.investigation_events, public.findings, public.reports to service_role;

create function public.register_target(p_wallet text, p_chain integer, p_address text, p_protocol text, p_website text, p_bounty text, p_notes text)
returns jsonb language plpgsql set search_path = public as $$
declare u uuid; t public.targets; i uuid; original text; fresh boolean;
begin
  insert into users(wallet_address) values(lower(p_wallet)) on conflict do nothing;
  select id into u from users where wallet_address=lower(p_wallet);
  insert into targets(chain_id,contract_address,protocol_name,protocol_url,bounty_url,originating_user_id)
    values(p_chain,lower(p_address),p_protocol,p_website,p_bounty,u) on conflict do nothing;
  fresh := found;
  select * into t from targets where chain_id=p_chain and contract_address=lower(p_address) for update;
  insert into submissions(target_id,user_id,notes) values(t.id,u,p_notes) on conflict do nothing;
  insert into investigations(target_id) values(t.id) on conflict do nothing;
  select id into i from investigations where target_id=t.id;
  select wallet_address into original from users where id=t.originating_user_id;
  return jsonb_build_object('investigationId',i,'duplicate',not fresh,'originatingScout',original);
end $$;

create function public.save_investigation_event(p_id uuid, p_event jsonb)
returns void language plpgsql set search_path = public as $$
declare prior integer; f jsonb;
begin
  select last_sequence into prior from investigations where id=p_id for update;
  if prior is null or (p_event->>'sequence')::integer != prior+1 then raise exception 'Invalid event sequence'; end if;
  insert into investigation_events(investigation_id,sequence,timestamp,agent,stage,status,message,data,event_type)
  values(p_id,(p_event->>'sequence')::integer,(p_event->>'timestamp')::timestamptz,p_event->>'agent',p_event->>'stage',p_event->>'status',p_event->>'message',p_event->'data',p_event->>'eventType');
  update investigations set current_stage=p_event->>'stage',last_sequence=prior+1 where id=p_id;
  if jsonb_typeof(p_event->'data'->'findings')='array' then
    for f in select * from jsonb_array_elements(p_event->'data'->'findings') loop
      insert into findings(investigation_id,source_id,title,source_agent,severity,confidence,status,affected_component,private_detail)
      values(p_id,f->>'id',f->>'title',f->>'agent',f->>'severity',f->>'confidence',f->>'status',f->>'component',f)
      on conflict(investigation_id,source_id) do update set status=excluded.status,private_detail=excluded.private_detail;
    end loop;
  end if;
  if p_event->'data'->'reports' is not null then
    insert into reports(investigation_id,public_report,private_report)
    values(p_id,p_event->'data'->'reports'->'public',p_event->'data'->'reports'->'private')
    on conflict(investigation_id) do update set public_report=excluded.public_report,private_report=excluded.private_report;
  end if;
end $$;
revoke all on function public.register_target(text,integer,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.save_investigation_event(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.register_target(text,integer,text,text,text,text,text) to service_role;
grant execute on function public.save_investigation_event(uuid,jsonb) to service_role;

create function public.scout_counts(p_wallet text)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'submissions', (select count(*) from submissions s join users u on u.id=s.user_id where u.wallet_address=lower(p_wallet)),
    'investigations', (select count(*) from investigations i where exists(select 1 from submissions s join users u on u.id=s.user_id where s.target_id=i.target_id and u.wallet_address=lower(p_wallet))),
    'validated', (select count(*) from findings f join investigations i on i.id=f.investigation_id where f.status='VALIDATED' and exists(select 1 from submissions s join users u on u.id=s.user_id where s.target_id=i.target_id and u.wallet_address=lower(p_wallet)))
  );
$$;
revoke all on function public.scout_counts(text) from public, anon, authenticated;
grant execute on function public.scout_counts(text) to service_role;
