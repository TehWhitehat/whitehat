import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { recoverMessageAddress, type Hex } from "viem";
import { database } from "./database";
import { addressPattern } from "./investigation";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function permittedOrigin(origin: string) {
  try { const url = new URL(origin); const configured = process.env.WHITEHAT_PUBLIC_ORIGIN; if(process.env.VERCEL && !configured) return false; return configured ? url.origin === configured && url.protocol === "https:" : ["localhost","127.0.0.1","[::1]"].includes(url.hostname) && url.protocol === "http:"; } catch { return false; }
}
export function sameOrigin(request: Request) { const origin = request.headers.get("origin") ?? ""; return permittedOrigin(origin) && new URL(origin).host === request.headers.get("host"); }
export async function rateLimit(bucket: string, limit: number, seconds: number) {
  const { data, error } = await database().rpc("beta_rate", { p_bucket: hash(bucket), p_limit: limit, p_seconds: seconds });
  if (error) throw new Error("AUTH_DATABASE_UNAVAILABLE");
  if (data !== true) throw new Error("RATE_LIMITED");
}
export function requestBucket(request: Request) { return process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "unknown" : "local"; }
export async function scoutWallet() {
  const token = (await cookies()).get("whitehat-session")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const { data, error } = await database().from("beta_auth").select("wallet,origin").eq("token_hash",hash(token)).eq("kind","session").gt("expires",new Date().toISOString()).maybeSingle();
  return !error && data && permittedOrigin(data.origin) ? data.wallet as string : null;
}
export function approvedAdmin(wallet: string | null): wallet is string { return !!wallet && (process.env.WHITEHAT_ADMIN_WALLETS ?? "").split(",").map(s=>s.trim().toLowerCase()).filter(s=>addressPattern.test(s)).includes(wallet.toLowerCase()); }
export async function adminWallet() { const wallet = await scoutWallet(); return approvedAdmin(wallet) ? wallet : null; }
export async function createChallenge(wallet: string, origin: string) {
  if (!addressPattern.test(wallet) || !permittedOrigin(origin)) throw new Error("Invalid challenge");
  await rateLimit(`challenge:${wallet.toLowerCase()}`,10,300);
  const token=randomBytes(32).toString("hex"), expires=new Date(Date.now()+300000).toISOString();
  const message=`Sign in to Whitehat\nSite: ${origin}\nWallet: ${wallet.toLowerCase()}\nNonce: ${token}\nExpires: ${expires}\nOffchain identity verification only. No transaction, approval, or fund transfer.`;
  await database().from("beta_auth").delete().lt("expires",new Date().toISOString());
  const {error}=await database().from("beta_auth").insert({token_hash:hash(token),kind:"challenge",wallet:wallet.toLowerCase(),message,origin,expires});if(error)throw new Error("Auth unavailable");
  (await cookies()).set("whitehat-challenge",token,{httpOnly:true,sameSite:"strict",path:"/",maxAge:300,secure:origin.startsWith("https:")}); return message;
}
export async function verifyChallenge(signature: Hex, origin: string) {
  if (!permittedOrigin(origin)) throw new Error("ORIGIN_MISMATCH");

  const jar = await cookies();
  const token = jar.get("whitehat-challenge")?.value;

  if (!token) throw new Error("MISSING_CHALLENGE");

  const { data: entry, error } = await database()
    .from("beta_auth")
    .select("wallet,message,origin,expires")
    .eq("token_hash", hash(token))
    .eq("kind", "challenge")
    .eq("origin", origin)
    .gt("expires", new Date().toISOString())
    .maybeSingle();

  if (error) throw new Error("CHALLENGE_LOOKUP_FAILED");

  if (!entry || !entry.message) {
    jar.delete("whitehat-challenge");
    throw new Error("CHALLENGE_EXPIRED");
  }

  let recovered: string;

  try {
    recovered = await recoverMessageAddress({
      message: entry.message,
      signature,
    });
  } catch {
    throw new Error("INVALID_SIGNATURE");
  }

  if (recovered.toLowerCase() !== entry.wallet.toLowerCase()) {
    throw new Error("INVALID_SIGNATURE");
  }

  // Consume the challenge only AFTER the signature has been verified.
  const consumed = await database()
    .from("beta_auth")
    .delete()
    .eq("token_hash", hash(token))
    .eq("kind", "challenge")
    .select("token_hash");

  if (consumed.error || !consumed.data?.length) {
    throw new Error("CHALLENGE_CONSUME_FAILED");
  }

  jar.delete("whitehat-challenge");

  const old = jar.get("whitehat-session")?.value;

  if (old) {
    await database()
      .from("beta_auth")
      .delete()
      .eq("token_hash", hash(old));
  }

  const session = randomBytes(32).toString("hex");

  const inserted = await database()
    .from("beta_auth")
    .insert({
      token_hash: hash(session),
      kind: "session",
      wallet: entry.wallet,
      origin,
      expires: new Date(Date.now() + 28800000).toISOString(),
    });

  if (inserted.error) throw new Error("SESSION_CREATION_FAILED");

  jar.set("whitehat-session", session, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 28800,
    secure: origin.startsWith("https:"),
  });

  return entry.wallet;
}
export async function signOut(){const jar=await cookies(),token=jar.get("whitehat-session")?.value;if(token)await database().from("beta_auth").delete().eq("token_hash",hash(token));jar.delete("whitehat-session");}

