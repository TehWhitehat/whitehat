import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as viem from 'viem';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite(), jar=new Map();const env={WHITEHAT_PUBLIC_ORIGIN:'https://beta.whitehat.test',VERCEL:'1',WHITEHAT_ADMIN_WALLETS:''};
try{
 await db.exec('create role anon;create role authenticated;create role service_role;');for(const n of ['001_backbone.sql','002_public_beta.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+n,'utf8'));
 function from(table){assert.equal(table,'beta_auth');let op='select',conditions=[],values=[],insert;
 const q={select(){return q;},delete(){op='delete';return q;},insert(value){op='insert';insert=value;return q;},eq(k,v){conditions.push(`${k}=$${values.push(v)}`);return q;},gt(k,v){conditions.push(`${k}>$${values.push(v)}`);return q;},lt(k,v){conditions.push(`${k}<$${values.push(v)}`);return q;},async maybeSingle(){const r=await q;return {...r,data:r.data?.[0]??null};},then(resolve,reject){let sql;if(op==='insert'){const keys=Object.keys(insert);values=Object.values(insert);sql=`insert into beta_auth(${keys}) values(${keys.map((_,i)=>'$'+(i+1))}) returning *`;}else sql=`${op==='select'?'select * from':'delete from'} beta_auth${conditions.length?' where '+conditions.join(' and '):''}${op==='delete'?' returning *':''}`;return db.query(sql,values).then(r=>({data:r.rows,error:null})).then(resolve,reject);}};return q;
 }
 const database=()=>({from,async rpc(name,p){assert.ok(['beta_rate','beta_consume_challenge'].includes(name));const r=await db.query(`select * from ${name}(${Object.keys(p).map((k,i)=>k+'=> $'+(i+1)).join(',')})`,Object.values(p));return {data:name==='beta_rate'?r.rows[0].beta_rate:r.rows,error:null};}});
 function load(){const exports={};const code=ts.transpileModule(fs.readFileSync('apps/web/lib/scout-auth.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;vm.runInNewContext(code,{exports,process:{env},URL,Date,require(name){if(name==='server-only')return {};if(name==='node:crypto')return crypto;if(name==='viem')return viem;if(name==='./database')return {database};if(name==='./investigation')return {addressPattern:/^0x[0-9a-fA-F]{40}$/};if(name==='next/headers')return {cookies:async()=>({get:k=>jar.has(k)?{value:jar.get(k)}:undefined,set:(k,v,options)=>{assert.equal(options.httpOnly,true);assert.equal(options.secure,true);jar.set(k,v);},delete:k=>jar.delete(k)})};throw new Error(name);}});return exports;}
 const auth=load(),account=privateKeyToAccount(generatePrivateKey()),other=privateKeyToAccount(generatePrivateKey());
 assert.equal(auth.permittedOrigin('https://evil.test'),false);assert.equal(auth.permittedOrigin('http://beta.whitehat.test'),false);
 const message=await auth.createChallenge(account.address,env.WHITEHAT_PUBLIC_ORIGIN);const sig=await account.signMessage({message});
 assert.equal(await auth.verifyChallenge(sig,env.WHITEHAT_PUBLIC_ORIGIN),account.address.toLowerCase());
 assert.equal(await load().scoutWallet(),account.address.toLowerCase());assert.equal(await auth.adminWallet(),null);
 env.WHITEHAT_ADMIN_WALLETS=other.address;assert.equal(await auth.adminWallet(),null);env.WHITEHAT_ADMIN_WALLETS=account.address;assert.equal(await auth.adminWallet(),account.address.toLowerCase());
 await assert.rejects(auth.verifyChallenge(sig,env.WHITEHAT_PUBLIC_ORIGIN));
 await auth.signOut();assert.equal(await load().scoutWallet(),null);
 const bad=await auth.createChallenge(account.address,env.WHITEHAT_PUBLIC_ORIGIN);await assert.rejects(auth.verifyChallenge(await other.signMessage({message:bad}),env.WHITEHAT_PUBLIC_ORIGIN));assert.equal(await auth.scoutWallet(),null);
 console.log('PASS: real wallet signature, forged signer rejected, replay rejected, HTTPS/origin binding, persistent session across module instances, logout revocation, default-deny/non-admin/admin wallet checks.');
}catch(e){console.error('Auth integration failure:',e.message);process.exitCode=1;}finally{await db.close();}
