-- Apply after 001_backbone.sql. Server roles only; no browser table policies.
alter table targets add column eligibility text not null default 'PENDING_REVIEW' check (eligibility in ('PENDING_REVIEW','AUTHORIZED_BOUNTY','PROTOCOL_AUTHORIZED','PUBLIC_RESEARCH','OUT_OF_SCOPE'));
alter table targets add column scope_revision integer not null default 0;
alter table targets add column scope_notes text not null default '';
alter table targets add column allowed_contracts text[] not null default '{}';
alter table targets add column excluded_contracts text[] not null default '{}';
alter table targets add column restrictions text not null default '';
alter table targets add column disclosure_contact text not null default '';
alter table targets add column admin_notes text not null default '';
alter table targets add column local_analysis_allowed boolean not null default false;
alter table findings add column human_status text check (human_status in ('REJECTED','NEEDS_MORE_EVIDENCE','VALIDATED'));
alter table findings add column reviewer_wallet text;
alter table findings add column reviewed_at timestamptz;
alter table findings add column review_notes text;
create table beta_auth (token_hash text primary key, kind text not null check(kind in ('challenge','session')), wallet text not null, message text, origin text not null, expires timestamptz not null);
create table beta_limits (bucket text primary key, hits integer not null, expires timestamptz not null);
create table investigation_jobs (id uuid primary key default gen_random_uuid(), investigation_id uuid not null references investigations(id), kind text not null check(kind in ('RECON','ANALYZE')), status text not null default 'QUEUED', lease uuid, lease_until timestamptz, scope_revision integer not null, created_at timestamptz not null default now());
create unique index one_active_job on investigation_jobs(investigation_id) where status in ('QUEUED','RUNNING');
create table human_audit (id uuid primary key default gen_random_uuid(), wallet text not null, action text not null, subject uuid not null, notes jsonb not null, created_at timestamptz not null default now());
create table disclosures (id uuid primary key default gen_random_uuid(), finding_id uuid not null references findings(id), investigation_id uuid not null references investigations(id), target_id uuid not null references targets(id), status text not null default 'DRAFT' check(status in ('DRAFT','HUMAN_REVIEW','APPROVED_FOR_DISCLOSURE','DISCLOSED','ACKNOWLEDGED','BOUNTY_PENDING','BOUNTY_RECEIVED','RESOLVED')), package jsonb not null, created_by text not null, updated_at timestamptz not null default now());
create table bounties (id uuid primary key default gen_random_uuid(), disclosure_id uuid not null references disclosures(id), investigation_id uuid not null references investigations(id), target_id uuid not null references targets(id), finding_id uuid not null references findings(id), scout text not null, amount_units numeric(78,0) not null check(amount_units>0), decimals integer not null check(decimals between 0 and 18), asset text not null, status text not null check(status in ('PENDING','RECEIVED','DISTRIBUTED')), protocol_reference text not null, scout_units numeric(78,0) not null, buyback_units numeric(78,0) not null, distribution_tx text, buyback_tx text, testnet boolean not null default true, created_at timestamptz not null default now(), check(scout_units=floor(amount_units/2) and buyback_units=amount_units-scout_units));
create table economic_demos (id text primary key, label text not null check(label='TESTNET DEVELOPMENT DATA'), record jsonb not null);
create table worker_health (id text primary key, updated_at timestamptz not null default now());
do $$ declare t text; begin foreach t in array array['beta_auth','beta_limits','investigation_jobs','human_audit','disclosures','bounties','economic_demos','worker_health'] loop execute format('alter table %I enable row level security',t); execute format('revoke all on %I from public,anon,authenticated',t); execute format('grant all on %I to service_role',t); end loop; end $$;
create function beta_rate(p_bucket text,p_limit integer,p_seconds integer) returns boolean language plpgsql set search_path=public as $$ declare n integer; begin
 delete from beta_limits where expires<now();
 insert into beta_limits values(p_bucket,1,now()+make_interval(secs=>p_seconds)) on conflict(bucket) do update set hits=beta_limits.hits+1 returning hits into n; return n<=p_limit;
end $$;
create function beta_consume_challenge(p_hash text,p_origin text) returns setof beta_auth language sql set search_path=public as $$ delete from beta_auth where token_hash=p_hash and kind='challenge' and origin=p_origin and expires>now() returning * $$;
create function beta_enqueue_new() returns trigger language plpgsql set search_path=public as $$ begin insert into investigation_jobs(investigation_id,kind,scope_revision) values(new.id,'RECON',0); return new; end $$;
create trigger beta_new_investigation after insert on investigations for each row execute function beta_enqueue_new();
create function beta_claim() returns setof investigation_jobs language plpgsql set search_path=public as $$ declare j investigation_jobs; begin
 update investigations set status='INTERRUPTED',current_stage='FAILED' where id in (select investigation_id from investigation_jobs where status='RUNNING' and lease_until<now());
 update investigation_jobs set status='INTERRUPTED' where status='RUNNING' and lease_until<now();
 select * into j from investigation_jobs where status='QUEUED' order by created_at for update skip locked limit 1;
 if j.id is null then return; end if;
 update investigation_jobs set status='RUNNING',lease=gen_random_uuid(),lease_until=now()+interval '2 minutes' where id=j.id returning * into j;
 update investigations set status='RUNNING',started_at=coalesce(started_at,now()) where id=j.investigation_id;
 return next j;
end $$;
create function beta_heartbeat(p_job uuid,p_lease uuid) returns boolean language plpgsql set search_path=public as $$ begin
 update investigation_jobs j set lease_until=now()+interval '2 minutes' from investigations i,targets t where j.id=p_job and j.lease=p_lease and j.status='RUNNING' and j.lease_until>now() and i.id=j.investigation_id and t.id=i.target_id and t.scope_revision=j.scope_revision and t.eligibility!='OUT_OF_SCOPE'; return found;
end $$;
create function beta_save_event(p_job uuid,p_lease uuid,p_event jsonb) returns void language plpgsql set search_path=public as $$ declare j investigation_jobs; begin
 select * into j from investigation_jobs where id=p_job and lease=p_lease and status='RUNNING' and lease_until>now() for update;
 if j.id is null or not exists(select 1 from investigations i join targets t on t.id=i.target_id where i.id=j.investigation_id and t.scope_revision=j.scope_revision and t.eligibility!='OUT_OF_SCOPE') then raise exception 'Job revoked'; end if;
 perform save_investigation_event(j.investigation_id,p_event);
end $$;
create function beta_finish(p_job uuid,p_lease uuid,p_status text,p_stage text) returns void language plpgsql set search_path=public as $$ declare i uuid; begin
 update investigation_jobs set status=p_status where id=p_job and lease=p_lease and status='RUNNING' returning investigation_id into i;
 if i is not null then update investigations set status=p_status,current_stage=p_stage,completed_at=now() where id=i; end if;
end $$;
create function beta_admin(p_wallet text,p_action text,p jsonb) returns uuid language plpgsql set search_path=public as $$
declare t targets; f findings; d disclosures; i investigations; new_id uuid; amount numeric; scout_wallet text; next_state text;
begin
 -- Called only after server-side wallet allowlist verification. No grants to browser roles.
 if p_action='scope' then
 select * into t from targets where id=(p->>'id')::uuid for update; if t.id is null then raise exception 'Missing target'; end if;
 if p->>'eligibility' not in ('PENDING_REVIEW','AUTHORIZED_BOUNTY','PROTOCOL_AUTHORIZED','PUBLIC_RESEARCH','OUT_OF_SCOPE') then raise exception 'Invalid eligibility'; end if;
 update targets set eligibility=p->>'eligibility',scope_revision=scope_revision+1,bounty_url=p->>'bounty_url',scope_notes=p->>'scope_notes',allowed_contracts=array(select lower(jsonb_array_elements_text(p->'allowed_contracts'))),excluded_contracts=array(select lower(jsonb_array_elements_text(p->'excluded_contracts'))),restrictions=p->>'restrictions',disclosure_contact=p->>'disclosure_contact',admin_notes=p->>'admin_notes',local_analysis_allowed=(p->>'local_analysis_allowed')::boolean where id=t.id;
 update investigation_jobs set status='CANCELLED' where investigation_id in(select id from investigations where target_id=t.id) and status in('QUEUED','RUNNING');
 update investigations set status='REVIEW',current_stage=case when p->>'eligibility'='OUT_OF_SCOPE' then 'BLOCKED' else 'REVIEW QUEUED' end where target_id=t.id;
 new_id=t.id;
 elsif p_action='queue' then
 select * into i from investigations where id=(p->>'id')::uuid for update; select * into t from targets where id=i.target_id;
 if t.id is null or t.eligibility='OUT_OF_SCOPE' then raise exception 'Out of scope'; end if;
 if t.eligibility!='PENDING_REVIEW' and (not t.local_analysis_allowed or not(t.contract_address=any(t.allowed_contracts)) or t.contract_address=any(t.excluded_contracts)) then raise exception 'Local scope not approved'; end if;
 insert into investigation_jobs(investigation_id,kind,scope_revision) values(i.id,case when t.eligibility='PENDING_REVIEW' then 'RECON' else 'ANALYZE' end,t.scope_revision);
 update investigations set status='QUEUED',current_stage='INITIALIZING' where id=i.id; new_id=i.id;
 elsif p_action='review' then
 if coalesce(p->>'status','') not in ('REJECTED','NEEDS_MORE_EVIDENCE','VALIDATED') or length(coalesce(p->>'notes',''))<3 then raise exception 'Review notes required'; end if;
 update findings set human_status=p->>'status',reviewer_wallet=p_wallet,reviewed_at=now(),review_notes=p->>'notes' where id=(p->>'id')::uuid returning id into new_id;
 elsif p_action='prepare' then
 select * into f from findings where id=(p->>'id')::uuid; select * into i from investigations where id=f.investigation_id; select * into t from targets where id=i.target_id;
 if f.human_status is distinct from 'VALIDATED' then raise exception 'Human validation required'; end if;
 select wallet_address into scout_wallet from users where id=t.originating_user_id;
 insert into disclosures(finding_id,investigation_id,target_id,created_by,package) values(f.id,i.id,t.id,p_wallet,jsonb_build_object('protocol',t.protocol_name,'affectedContract',t.contract_address,'executiveSummary',p->>'summary','finding',f.title,'severity',f.severity,'impact',p->>'impact','evidence',f.private_detail,'report',(select private_report from reports where investigation_id=i.id),'reproductionStatus',p->>'reproduction','recommendedRemediation',p->>'remediation','scout',scout_wallet,'investigationId',i.id,'reviewer',f.reviewer_wallet,'reviewNotes',f.review_notes,'disclosureContact',t.disclosure_contact)) returning id into new_id;
 elsif p_action='disclosure' then
 select * into d from disclosures where id=(p->>'id')::uuid for update;
 next_state=case d.status when 'DRAFT' then 'HUMAN_REVIEW' when 'HUMAN_REVIEW' then 'APPROVED_FOR_DISCLOSURE' when 'APPROVED_FOR_DISCLOSURE' then 'DISCLOSED' when 'DISCLOSED' then 'ACKNOWLEDGED' when 'ACKNOWLEDGED' then 'BOUNTY_PENDING' when 'BOUNTY_PENDING' then 'BOUNTY_RECEIVED' when 'BOUNTY_RECEIVED' then 'RESOLVED' end;
 if next_state is null or coalesce(p->>'status','')!=next_state or length(coalesce(p->>'notes',''))<3 then raise exception 'Invalid transition'; end if;
 if next_state in ('APPROVED_FOR_DISCLOSURE','DISCLOSED') and not exists(select 1 from findings where id=d.finding_id and human_status='VALIDATED') then raise exception 'Human validation revoked'; end if;
 update disclosures set status=next_state,updated_at=now() where id=d.id; new_id=d.id;
 elsif p_action='bounty' then
 select * into d from disclosures where id=(p->>'id')::uuid; if d.id is null or d.status not in ('BOUNTY_PENDING','BOUNTY_RECEIVED','RESOLVED') then raise exception 'Disclosure outcome required'; end if;
 if p->>'amount_units' !~ '^[1-9][0-9]{0,59}$' then raise exception 'Invalid amount'; end if; amount=(p->>'amount_units')::numeric;
 select u.wallet_address into scout_wallet from targets target_row join users u on u.id=target_row.originating_user_id where target_row.id=d.target_id;
 insert into bounties(disclosure_id,investigation_id,target_id,finding_id,scout,amount_units,decimals,asset,status,protocol_reference,scout_units,buyback_units,distribution_tx,buyback_tx,testnet) values(d.id,d.investigation_id,d.target_id,d.finding_id,scout_wallet,amount,(p->>'decimals')::integer,p->>'asset',p->>'status',p->>'protocol_reference',floor(amount/2),amount-floor(amount/2),nullif(p->>'distribution_tx',''),nullif(p->>'buyback_tx',''),(p->>'testnet')::boolean) on conflict(disclosure_id,protocol_reference) do update set amount_units=excluded.amount_units,scout_units=excluded.scout_units,buyback_units=excluded.buyback_units,decimals=excluded.decimals,asset=excluded.asset,status=excluded.status,distribution_tx=excluded.distribution_tx,buyback_tx=excluded.buyback_tx,testnet=excluded.testnet returning id into new_id;
 else raise exception 'Unknown action'; end if;
 if new_id is null then raise exception 'Missing record'; end if;
 insert into human_audit(wallet,action,subject,notes) values(p_wallet,p_action,new_id,p); return new_id;
end $$;
do $$ declare fn regprocedure; begin for fn in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname like 'beta_%' loop execute format('revoke all on function %s from public,anon,authenticated',fn); execute format('grant execute on function %s to service_role',fn); end loop; end $$;

create or replace function public.scout_counts(p_wallet text)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'submissions', (select count(*) from submissions s join users u on u.id=s.user_id where u.wallet_address=lower(p_wallet)),
    'investigations', (select count(*) from investigations i where exists(select 1 from submissions s join users u on u.id=s.user_id where s.target_id=i.target_id and u.wallet_address=lower(p_wallet))),
    'validated', (select count(*) from findings f join investigations i on i.id=f.investigation_id where f.human_status='VALIDATED' and exists(select 1 from submissions s join users u on u.id=s.user_id where s.target_id=i.target_id and u.wallet_address=lower(p_wallet)))
  );
$$;
revoke all on function public.scout_counts(text) from public, anon, authenticated;
grant execute on function public.scout_counts(text) to service_role;


create unique index bounty_reference_unique on bounties(disclosure_id,protocol_reference);


