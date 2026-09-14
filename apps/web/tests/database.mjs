import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
try {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to service_role;');
  await db.exec(await readFile(new URL('../../../supabase/migrations/001_backbone.sql', import.meta.url), 'utf8'));
  const a = '0x' + 'a'.repeat(40), b = '0x' + 'b'.repeat(40), address = '0x' + 'c'.repeat(40);
  const submit = async wallet => (await db.query('select public.register_target($1,46630,$2,$3,$4,$5,$6) as result', [wallet,address,'Test protocol','https://example.com','','private scout notes'])).rows[0].result;
  const first = await submit(a);
  const [duplicate, repeat] = await Promise.all([submit(b), submit(a)]);
  assert.equal(first.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(repeat.investigationId, first.investigationId);
  assert.equal(duplicate.originatingScout, a);
  assert.equal((await db.query('select count(*)::integer n from targets')).rows[0].n,1);
  assert.equal((await db.query('select count(*)::integer n from submissions')).rows[0].n,2);
  const finding = { id: 'slither-0', title: 'PRIVATE detector detail', agent: 'STATIC', severity: 'Medium', confidence: 'High', status: 'NEEDS EVIDENCE', component: 'PRIVATE function', description: 'PRIVATE reproduction' };
  const event = { sequence:1, timestamp:new Date().toISOString(), agent:'REPORTER', stage:'HUMAN REVIEW REQUIRED', status:'COMPLETE', message:'PRIVATE tool output', eventType:'agent', data:{ findings:[finding], reports:{public:{riskSummary:'Human review required'},private:{detail:'PRIVATE report'}} } };
  const save = ev => db.query('select public.save_investigation_event($1,$2)',[first.investigationId,JSON.stringify(ev)]);
  await save(event);
  await assert.rejects(save({...event,sequence:3}),/Invalid event sequence/);
  assert.equal((await db.query('select count(*)::integer n from investigation_events')).rows[0].n,1);
  assert.equal((await db.query('select last_sequence from investigations')).rows[0].last_sequence,1);
  assert.equal((await db.query('select private_detail from findings')).rows[0].private_detail.description,'PRIVATE reproduction');
  assert.equal((await db.query('select public_report from reports')).rows[0].public_report.riskSummary,'Human review required');
  const counts = (await db.query('select public.scout_counts($1) stats',[b])).rows[0].stats;
  assert.deepEqual(counts,{submissions:1,investigations:1,validated:0});
  for (const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}`);
    await assert.rejects(db.query('select private_report from reports'),/permission denied/);
    await assert.rejects(db.query('select * from investigation_events'),/permission denied/);
    await assert.rejects(submit(b),/permission denied/);
    await db.exec('reset role');
  }
  await db.exec('set role service_role');
  assert.equal((await db.query('select count(*)::integer n from targets')).rows[0].n,1);
  console.log('PASS: PostgreSQL migration, duplicate attribution, event ordering/rollback, finding/report persistence, Scout counts, private-data permissions.');
} finally { await db.close(); }
