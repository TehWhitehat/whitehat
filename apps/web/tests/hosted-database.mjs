// Disposable integration rows only. Credentials are read from the local environment.
import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
const wallets = [0,1].map(()=>'0x'+randomBytes(20).toString('hex'));
const address = '0x'+randomBytes(20).toString('hex');
const label = 'WHITEHAT DISPOSABLE INTEGRATION '+randomUUID();
const secretMarker = 'PRIVATE_TEST_EVIDENCE_'+randomUUID();
const origin = 'http://127.0.0.1:3000';
let phase = 'initial isolation check';
async function checked(query) { const result = await query; if(result.error) throw new Error('Database check failed'); return result.data; }
try {
  assert.equal((await checked(db.from('users').select('id').in('wallet_address',wallets))).length,0);
  phase = 'persistent registration and duplicates';
  const submit = wallet => checked(db.rpc('register_target',{p_wallet:wallet,p_chain:46630,p_address:address,p_protocol:label,p_website:'',p_bounty:'',p_notes:secretMarker}));
  const first = await submit(wallets[0]);
  const duplicate = await submit(wallets[1]);
  assert.equal(first.duplicate,false); assert.equal(duplicate.duplicate,true);
  assert.equal(first.investigationId,duplicate.investigationId);
  assert.equal(duplicate.originatingScout,wallets[0]);
  assert.match(first.investigationId,/^[0-9a-f-]{36}$/);
  phase = 'atomic claim';
  const claim = () => checked(db.from('investigations').update({status:'RUNNING',started_at:new Date().toISOString()}).eq('id',first.investigationId).eq('status','QUEUED').select('id'));
  assert.equal((await claim()).length,1); assert.equal((await claim()).length,0);
  phase = 'events, findings and reports';
  const event = {investigationId:first.investigationId,sequence:1,timestamp:new Date().toISOString(),agent:'REPORTER',stage:'HUMAN REVIEW REQUIRED',status:'COMPLETE',eventType:'agent',message:secretMarker,data:{findings:[{id:'integration-only',title:secretMarker,agent:'REPORTER',tool:'Integration test',severity:'Informational',confidence:'Test only',status:'CANDIDATE',component:'Disposable test data',description:secretMarker,fixture:true}],reports:{private:{detail:secretMarker},public:{riskSummary:'Disposable integration test; not a security result.'}}}};
  await checked(db.rpc('save_investigation_event',{p_id:first.investigationId,p_event:event}));
  assert.ok((await db.rpc('save_investigation_event',{p_id:first.investigationId,p_event:event})).error);
  for(const table of ['investigation_events','findings','reports']) assert.equal((await checked(db.from(table).select('id').eq('investigation_id',first.investigationId))).length,1);
  await checked(db.from('investigations').update({status:'COMPLETE',completed_at:new Date().toISOString()}).eq('id',first.investigationId));
  phase = 'public API redaction';
  const response = await fetch(origin+'/api/investigations/'+first.investigationId);
  assert.equal(response.status,200);
  const publicRecord = await response.json();
  assert.equal(publicRecord.privateAccess,false); assert.deepEqual(publicRecord.events,[]);
  assert.equal(publicRecord.status,'COMPLETE'); assert.equal(publicRecord.originatingScout,wallets[0]);
  assert.ok(!JSON.stringify(publicRecord).includes(secretMarker));
  phase = 'Explore and Scout history';
  for(const path of ['/investigations','/scouts/'+wallets[0],'/scouts/'+wallets[1]]) {
    const page = await fetch(origin+path); assert.equal(page.status,200);
    const html = await page.text(); assert.ok(html.includes(label)); assert.ok(!html.includes(secretMarker));
  }
  for(const wallet of wallets) { const counts = await checked(db.rpc('scout_counts',{p_wallet:wallet})); assert.deepEqual(counts,{submissions:1,investigations:1,validated:0}); }
  console.log('PASS: hosted registration, immutable original Scout, atomic claim, saved events/findings/reports, public redaction, Explore and Scout history.');
} catch { console.error('FAIL: '+phase); process.exitCode=1; }
finally {
  try {
    const targets = await checked(db.from('targets').select('id').eq('contract_address',address).eq('chain_id',46630).eq('protocol_name',label));
    for(const target of targets) {
      const runs = await checked(db.from('investigations').select('id').eq('target_id',target.id));
      for(const run of runs) {
        for(const table of ['reports','findings','investigation_events']) await checked(db.from(table).delete().eq('investigation_id',run.id));
        await checked(db.from('investigations').delete().eq('id',run.id));
      }
      await checked(db.from('submissions').delete().eq('target_id',target.id));
      await checked(db.from('targets').delete().eq('id',target.id));
    }
    await checked(db.from('users').delete().in('wallet_address',wallets));
    console.log('Disposable integration records removed.');
  } catch { console.error('FAIL: disposable record cleanup'); process.exitCode=1; }
}
