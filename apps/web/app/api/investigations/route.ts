import { sameOrigin, rateLimit, scoutWallet } from "../../../lib/scout-auth";
import { limitedJson } from "../../../lib/recon";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"Use the configured Whitehat site."},{status:403});
  // Local fixture remains available only on the local install, never on public hosting.
  if (!process.env.WHITEHAT_PUBLIC_ORIGIN && !process.env.VERCEL) {
    const copy=request.clone();
    try { const body=await limitedJson(copy.body,2000) as Record<string,unknown>; if(body.mode==="fixture" && body.investigationId==="local-security-fixture") { const {POST}=await import("../../../lib/local-investigation-stream");return POST(request); } } catch { return Response.json({error:"Invalid request"},{status:400}); }
  }
  const wallet=await scoutWallet();if(!wallet)return Response.json({error:"Sign in first."},{status:401});
  try { await rateLimit(`start:${wallet}`,10,3600); } catch { return Response.json({error:"Request limit reached."},{status:429}); }
  return Response.json({message:"Submission is queued persistently. Approved operators control scope and reruns."},{status:202});
}
