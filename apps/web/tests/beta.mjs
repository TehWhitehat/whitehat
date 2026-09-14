import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();
try {
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to service_role;');
 for(const name of ['001_backbone.sql','002_public_beta.sql'])await db.exec(await readFile(new URL('../../../supabase/migrations/'+name,import.meta.url),'utf8'));
 const wallet='0x'+'a'.repeat(40), target='0x'+'b'.repeat(40);
 const row=(await db.query("select register_target($1,46630,$2,'beta test','','','private notes') r",[wallet,target])).rows[0].r;
 const id=row.investigationId;const t=(await db.query('select * from targets')).rows[0];assert.equal(t.eligibility,'PENDING_REVIEW');
 const claim=(await db.query('select * from beta_claim()')).rows[0];assert.equal(claim.kind,'RECON');
 const event={sequence:1,timestamp:new Date().toISOString(),agent:'STATIC',stage:'HUMAN REVIEW REQUIRED',status:'COMPLETE',eventType:'agent',message:'private evidence',data:{findings:[{id:'test',title:'private title',agent:'STATIC',severity:'High',confidence:'High',status:'VALIDATED',component:'private function',description:'secret evidence'}]}};
 await db.query('select beta_save_event($1,$2,$3)',[claim.id,claim.lease,JSON.stringify(event)]);
 const f=(await db.query('select * from findings')).rows[0];assert.equal(f.human_status,null);
 const admin=(action,payload)=>db.query('select beta_admin($1,$2,$3) id',[wallet,action,JSON.stringify(payload)]);
 await assert.rejects(admin('prepare',{id:f.id,summary:'s',impact:'i',reproduction:'r',remediation:'m'}),/Human validation required/);
 const scope={id:t.id,eligibility:'PUBLIC_RESEARCH',bounty_url:'',scope_notes:'Offline only',allowed_contracts:[target],excluded_contracts:[],restrictions:'No live calls',disclosure_contact:'private@example.test',admin_notes:'private',local_analysis_allowed:true};
 await admin('scope',scope);assert.equal((await db.query('select beta_heartbeat($1,$2) ok',[claim.id,claim.lease])).rows[0].ok,false);
 await assert.rejects(db.query('select beta_save_event($1,$2,$3)',[claim.id,claim.lease,JSON.stringify({...event,sequence:2})]),/Job revoked/);
 await admin('queue',{id});const next=(await db.query('select * from beta_claim()')).rows[0];assert.equal(next.kind,'ANALYZE');
 await admin('scope',{...scope,eligibility:'OUT_OF_SCOPE'});await assert.rejects(admin('queue',{id}),/Out of scope/);
 await admin('review',{id:f.id,status:'VALIDATED',notes:'Human reproduced fixture evidence only'});
 const d=(await admin('prepare',{id:f.id,summary:'Executive summary',impact:'Local defect',reproduction:'Offline only',remediation:'Check accounting'})).rows[0].id;
 await assert.rejects(admin('disclosure',{id:d,status:'DISCLOSED',notes:'skip approval'}),/Invalid transition/);
 for(const status of ['HUMAN_REVIEW','APPROVED_FOR_DISCLOSURE','DISCLOSED','ACKNOWLEDGED','BOUNTY_PENDING','BOUNTY_RECEIVED'])await admin('disclosure',{id:d,status,notes:'Human test record only'});
 await admin('bounty',{id:d,amount_units:'101',decimals:'6',asset:'TEST ONLY',status:'RECEIVED',protocol_reference:'TEST REFERENCE',distribution_tx:'',buyback_tx:'',testnet:true});
 const bounty=(await db.query('select * from bounties')).rows[0];assert.equal(Number(bounty.scout_units),50);assert.equal(Number(bounty.buyback_units),51);assert.equal(bounty.scout,wallet);assert.equal(bounty.finding_id,f.id);
 assert.equal((await db.query("select beta_rate('test',1,60) ok")).rows[0].ok,true);assert.equal((await db.query("select beta_rate('test',1,60) ok")).rows[0].ok,false);
 await db.query("insert into beta_auth values('hash','challenge',$1,'message','https://beta.test',now()+interval '1 minute')",[wallet]);
 assert.equal((await db.query("select * from beta_consume_challenge('hash','https://evil.test')")).rows.length,0);
 assert.equal((await db.query("select * from beta_consume_challenge('hash','https://beta.test')")).rows.length,1);assert.equal((await db.query("select * from beta_consume_challenge('hash','https://beta.test')")).rows.length,0);
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);for(const table of ['findings','reports','targets','disclosures','bounties','beta_auth','human_audit','investigation_jobs'])await assert.rejects(db.query('select * from '+table),/permission denied/);await assert.rejects(admin('queue',{id}),/permission denied/);await db.exec('reset role');}
 console.log('PASS: eligibility defaults, persistent queue, scope revocation, lease fencing, human-only validation/disclosure transitions, bounty lineage/rounding, durable rate limits, challenge replay/origin binding, browser role isolation.');
}finally{await db.close();}
