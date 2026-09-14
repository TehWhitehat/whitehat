import { database, databaseError } from "../../../lib/database";
import { rateLimit, requestBucket, sameOrigin, scoutWallet } from "../../../lib/scout-auth";
import { addressPattern, chains, isChain } from "../../../lib/investigation";
import { limitedJson } from "../../../lib/recon";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Use the configured Whitehat site." }, { status: 403 });
  const wallet = await scoutWallet();
  if (!wallet) return Response.json({ error: "Connect your wallet and sign in to Whitehat first." }, { status: 401 });
  let input: Record<string, unknown>;
  try {
    input = await limitedJson(request.body, 15000) as Record<string, unknown>;
    if (!input || !isChain(input.chain) || typeof input.address !== "string" || !addressPattern.test(input.address)) throw new Error();
    for (const [field, limit] of Object.entries({ protocol: 160, website: 2048, bounty: 2048, notes: 4000 })) if (typeof input[field] !== "string" || input[field].length > limit) throw new Error();
    for (const field of ["website", "bounty"]) if (input[field] && !["https:", "http:"].includes(new URL(input[field] as string).protocol)) throw new Error();
  } catch { return Response.json({ error: "Check the chain, contract address and optional fields." }, { status: 400 }); }
  try {
    await rateLimit(`submit:${wallet}`, 5, 3600);
    await rateLimit(`submit-ip:${requestBucket(request)}`, 20, 3600);
    const { data, error } = await database().rpc("register_target", { p_wallet: wallet, p_chain: chains[input.chain as keyof typeof chains].id, p_address: (input.address as string).toLowerCase(), p_protocol: input.protocol, p_website: input.website, p_bounty: input.bounty, p_notes: input.notes });
    if (error) throw error;
    return Response.json(data);
  } catch { return Response.json({ error: databaseError() }, { status: 503 }); }
}

