"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function AdminAction({action,id,children,label}:{action:string;id:string;children?:React.ReactNode;label:string}){
 const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
 return <form className="space-y-3" onSubmit={async event=>{event.preventDefault();setBusy(true);setMessage("");const payload:Record<string,unknown>={...Object.fromEntries(new FormData(event.currentTarget)),id};
 if(action==="scope"){for(const key of ["allowed_contracts","excluded_contracts"])payload[key]=String(payload[key]??"").split(/[\s,]+/).filter(Boolean);payload.local_analysis_allowed=payload.local_analysis_allowed==="on";}
 if(action==="bounty")payload.testnet=payload.testnet==="on";
 try{const r=await fetch("/api/admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,payload})});const result=await r.json();if(!r.ok)throw new Error(result.error);setMessage("Saved privately. No external disclosure or transaction sent.");router.refresh();}catch(e){setMessage(e instanceof Error?e.message:"Could not save.");}finally{setBusy(false);}
 }}>{children}<button className="button button-primary disabled:opacity-50" disabled={busy}>{busy?"SAVING":label}</button>{message&&<p role="status" className="text-sm text-muted">{message}</p>}</form>;
}
export function AdminField({name,label,value="",area=false}:{name:string;label:string;value?:string;area?:boolean}){return <label className="block text-xs text-muted">{label}{area?<textarea className="intake-control" name={name} defaultValue={value} maxLength={8000}/>:<input className="intake-control" name={name} defaultValue={value} maxLength={8000}/>}</label>;}
