import { createClient } from "@supabase/supabase-js";
import { runRecon } from "../../apps/web/lib/recon";
import { runSecurityEngine } from "../../apps/web/lib/security-engine";
import { chains, type Chain, type InvestigationEvent, type Telemetry } from "../../apps/web/lib/investigation";
const db=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
async function rpc(name:string,args:Record<string,unknown>={}){const {data,error}=await db.rpc(name,args);if(error)throw new Error("Worker database operation failed");return data;}
let shuttingDown=false;process.on("SIGTERM",()=>{shuttingDown=true;});
async function work(job:{id:string;lease:string;investigation_id:string;kind:string;scope_revision:number}){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),360000);
 let pending=Promise.resolve();let saveFailed=false;let sequence=0;let finalStage="REVIEW QUEUED";let status="COMPLETE";
 const heartbeat=setInterval(()=>{void db.from("worker_health").upsert({id:"runner",updated_at:new Date().toISOString()}).then(()=>{});void rpc("beta_heartbeat",{p_job:job.id,p_lease:job.lease}).then(ok=>{if(!ok)controller.abort();}).catch(()=>controller.abort());},10000);
 try{
  const {data:i,error}=await db.from("investigations").select("last_sequence,targets!inner(*)").eq("id",job.investigation_id).single();if(error)throw new Error();
  const target=i.targets as unknown as {contract_address:string;chain_id:number;eligibility:string;scope_revision:number;allowed_contracts:string[];excluded_contracts:string[];local_analysis_allowed:boolean};
  if(target.scope_revision!==job.scope_revision||target.eligibility==="OUT_OF_SCOPE")throw new Error();
  const chain=Object.entries(chains).find(([,v])=>v.id===target.chain_id)?.[0] as Chain|undefined;if(!chain)throw new Error();
  sequence=i.last_sequence;const telemetry:Telemetry={};
  const emit=(event:InvestigationEvent)=>{Object.assign(telemetry,event.data);finalStage=event.stage;if(event.status==="FAILED")status="FAILED";const saved={...event,sequence:++sequence,investigationId:job.investigation_id};pending=pending.then(async()=>{if(controller.signal.aborted)throw new Error();await rpc("beta_save_event",{p_job:job.id,p_lease:job.lease,p_event:saved});}).catch(()=>{saveFailed=true;controller.abort();});};
  await runRecon({investigationId:job.investigation_id,chain,address:target.contract_address},emit,{signal:controller.signal});await pending;
  if(job.kind==="ANALYZE"&&!controller.signal.aborted&&telemetry.codeFound){
   if(!["PUBLIC_RESEARCH","AUTHORIZED_BOUNTY","PROTOCOL_AUTHORIZED"].includes(target.eligibility)||!target.local_analysis_allowed||!target.allowed_contracts.includes(target.contract_address)||target.excluded_contracts.includes(target.contract_address))throw new Error();
   if(!await rpc("beta_heartbeat",{p_job:job.id,p_lease:job.lease}))throw new Error();
   // Analyze only the approved submitted address; discovered proxy addresses are metadata, never added execution targets.
   await runSecurityEngine({chain,address:target.contract_address,context:{chainId:target.chain_id,codeBytes:telemetry.codeBytes,proxy:telemetry.proxy,implementation:telemetry.implementation,contracts:telemetry.contracts}},event=>emit({...event,sequence:0,investigationId:job.investigation_id,timestamp:new Date().toISOString(),stage:event.agent==="SYSTEM"?"HUMAN REVIEW REQUIRED":"STATIC ANALYSIS"}),controller.signal);
  }
  if(!controller.signal.aborted)emit({sequence:0,investigationId:job.investigation_id,timestamp:new Date().toISOString(),agent:"SYSTEM",eventType:"state",status:"LIMITED",stage:status==="FAILED"?"FAILED":"HUMAN REVIEW REQUIRED",message:job.kind==="RECON"?"Read-only Recon completed. Eligibility review required before local analysis.":"Permitted offline analysis ended. Human review required; no external action.",data:{}});
  await pending;if(controller.signal.aborted||saveFailed)throw new Error();
 }catch{status="INTERRUPTED";finalStage="FAILED";}
 finally{clearInterval(heartbeat);clearTimeout(timer);await pending;await rpc("beta_finish",{p_job:job.id,p_lease:job.lease,p_status:status,p_stage:finalStage});}
}
async function main(){
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SECRET_KEY||!process.env.WHITEHAT_ANALYZER_ROOT)throw new Error();
 while(!shuttingDown){try{const health=await db.from("worker_health").upsert({id:"runner",updated_at:new Date().toISOString()});if(health.error)throw new Error();const jobs=await rpc("beta_claim");if(jobs?.[0])await work(jobs[0]);else await sleep(3000);}catch{console.error("Worker unavailable; queued jobs retained. Check private host configuration.");await sleep(10000);}}
}
main().catch(()=>{console.error("Worker setup required.");process.exitCode=1;});

