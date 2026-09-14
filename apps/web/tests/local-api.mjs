// Run against the local preview; does not sign messages or use credentials.
import assert from 'node:assert/strict';
const origin = 'http://127.0.0.1:3000';
const post = (path, body, headers={}) => fetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
assert.equal((await post('/api/submissions',{})).status,401);
assert.equal((await post('/api/scout',{action:'challenge',wallet:'0x'+'1'.repeat(40)},{Origin:'https://example.com'})).status,403);
const challenge = await post('/api/scout',{action:'challenge',wallet:'0x'+'1'.repeat(40)});
assert.equal(challenge.status,200);
assert.match((await challenge.json()).message,/Offchain identity verification only/);
const cookie = challenge.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
assert.equal((await post('/api/scout',{action:'verify',signature:'0x'+'0'.repeat(130)},{Cookie:cookie})).status,400);
assert.equal((await (await fetch(origin+'/api/scout')).json()).wallet,null);
const fixture = await post('/api/investigations',{mode:'fixture',investigationId:'local-security-fixture'});
assert.equal(fixture.status,200);
const events = (await fixture.text()).trim().split('\n').map(JSON.parse);
assert.equal(events.at(-1).stage,'HUMAN REVIEW REQUIRED');
for (const agent of ['STATIC','INVARIANT','FUZZ','ECONOMIC','SIMULATION','CRITIC','REPORTER']) assert.equal(events.filter(e=>e.agent===agent && e.eventType==='agent').at(-1).status,'COMPLETE');
console.log('PASS: unauthenticated submission rejected, cross-origin sign-in rejected, invalid signature rejected, local fixture independent of Supabase.');
