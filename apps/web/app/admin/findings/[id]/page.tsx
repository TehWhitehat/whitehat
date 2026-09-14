import { notFound } from "next/navigation";
import { SiteHeader } from "../../../../components/site-header";
import { AdminAction,AdminField } from "../../../../components/admin-action";
import { adminWallet } from "../../../../lib/scout-auth";
import { database } from "../../../../lib/database";
import { uuidPattern } from "../../../../lib/persistent-investigations";
export const dynamic="force-dynamic";
export default async function Finding({params}:{params:Promise<{id:string}>}){
 if(!await adminWallet())notFound();const {id}=await params;if(!uuidPattern.test(id))notFound();
 const db=database();const {data:f,error}=await db.from("findings").select("*").eq("id",id).maybeSingle();if(error||!f)notFound();
 const [report,events]=await Promise.all([db.from("reports").select("private_report").eq("investigation_id",f.investigation_id).maybeSingle(),db.from("investigation_events").select("agent,data").eq("investigation_id",f.investigation_id).in("agent",["SIMULATION","CRITIC","REPORTER"]).order("sequence").limit(100)]);
 return <><SiteHeader/><main className="shell space-y-8 py-16"><p className="eyebrow">PRIVATE / HUMAN FINDING REVIEW</p><h1 className="text-3xl">{f.title}</h1><p>{f.source_agent} / {f.severity} / {f.confidence} / {f.affected_component}</p><p>{f.human_status??"NOT HUMAN VALIDATED"} / {f.reviewer_wallet} / {f.reviewed_at}</p><pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all border border-line p-5 text-xs">{JSON.stringify({evidence:f.private_detail,simulationCriticAndAI:events.data,privateReport:report.data?.private_report},null,2)}</pre><AdminAction action="review" id={id} label="SAVE HUMAN REVIEW"><select className="intake-control" name="status"><option>NEEDS_MORE_EVIDENCE</option><option>REJECTED</option><option>VALIDATED</option></select><AdminField name="notes" label="Human review notes / reproducible evidence" area/></AdminAction><h2 className="eyebrow">PREPARE DISCLOSURE / PRIVATE DRAFT ONLY</h2><p>Requires a human-validated finding. Stored evidence and the Reporter report are included automatically. Nothing is emailed, published or sent.</p><AdminAction action="prepare" id={id} label="PREPARE DISCLOSURE"><AdminField name="summary" label="Executive summary" area/><AdminField name="impact" label="Impact" area/><AdminField name="reproduction" label="Reproduction status / reference" area/><AdminField name="remediation" label="Recommended remediation" area/></AdminAction></main></>;
}
