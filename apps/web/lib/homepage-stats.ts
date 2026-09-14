import "server-only";
import { database } from "./database";
export async function homepageStats(): Promise<string[]> {
 try {
 const db=database();
 const results=await Promise.all([
 db.from("bounties").select("id",{count:"exact",head:true}).eq("testnet",false).in("status",["RECEIVED","DISTRIBUTED"]),
 db.from("investigations").select("id",{count:"exact",head:true}).eq("status","COMPLETE").not("started_at","is",null),
 db.from("findings").select("id",{count:"exact",head:true}).eq("human_status","VALIDATED").or("private_detail->>fixture.is.null,private_detail->>fixture.eq.false"),
 db.from("bounties").select("id",{count:"exact",head:true}).eq("testnet",false).eq("status","DISTRIBUTED").not("buyback_tx","is",null)
 ]);
 return results.map(r=>r.error?"UNAVAILABLE":String(r.count??0));
 } catch { return Array(4).fill("UNAVAILABLE"); }
}

