import { adminWallet, sameOrigin, rateLimit } from "../../../lib/scout-auth";
import { limitedJson } from "../../../lib/recon";
import { database } from "../../../lib/database";
import { uuidPattern } from "../../../lib/persistent-investigations";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:"Invalid origin"},{status:403});
 const wallet=await adminWallet();if(!wallet)return Response.json({error:"Admin access required"},{status:403});
 try{
  await rateLimit(`admin:${wallet}`,60,60);
  const {action,payload:p}=await limitedJson(request.body,30000) as {action:string;payload:Record<string,unknown>};
  if(!["scope","queue","review","prepare","disclosure","bounty"].includes(action)||!p||typeof p.id!=="string"||!uuidPattern.test(p.id))throw new Error();
  for(const value of Object.values(p))if(typeof value==="string"&&value.length>8000)throw new Error();
  if(["review","disclosure"].includes(action) && (typeof p.notes!=="string" || p.notes.trim().length<3 || typeof p.status!=="string"))throw new Error();
  if(action==="scope"){
   for(const key of ["bounty_url","scope_notes","restrictions","disclosure_contact","admin_notes"])if(typeof p[key]!=="string")throw new Error();
   if(p.bounty_url&&!/^https:\/\//.test(p.bounty_url as string))throw new Error();
   for(const key of ["allowed_contracts","excluded_contracts"])if(!Array.isArray(p[key])||p[key].length>50||p[key].some((a:unknown)=>typeof a!=="string"||!/^0x[0-9a-fA-F]{40}$/.test(a)))throw new Error();
   if(typeof p.local_analysis_allowed!=="boolean")throw new Error();
  }
  if(action==="prepare")for(const key of ["summary","impact","reproduction","remediation"])if(typeof p[key]!=="string"||(p[key] as string).trim().length<3)throw new Error();
  if(action==="bounty"){
   if(typeof p.testnet!=="boolean"||typeof p.asset!=="string"||!p.asset.trim()||typeof p.protocol_reference!=="string"||!p.protocol_reference.trim())throw new Error();
   for(const key of ["distribution_tx","buyback_tx"])if(p[key]&&!(typeof p[key]==="string"&&/^0x[0-9a-fA-F]{64}$/.test(p[key])))throw new Error();
  }
  const {data,error}=await database().rpc("beta_admin",{p_wallet:wallet,p_action:action,p});if(error)throw new Error();
  return Response.json({id:data},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Action refused. Check required fields, scope, review state and database migration. Nothing was sent externally."},{status:400});}
}

