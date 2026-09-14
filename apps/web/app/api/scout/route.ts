import {
  rateLimit,
  requestBucket,
  createChallenge,
  sameOrigin,
  scoutWallet,
  signOut,
  verifyChallenge,
} from "../../../lib/scout-auth";
import { limitedJson } from "../../../lib/recon";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(
    { wallet: await scoutWallet() },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json(
      { error: "Use the configured Whitehat site." },
      { status: 403 }
    );
  }

  try {
    await rateLimit(`auth:${requestBucket(request)}`, 30, 300);

    const body = (await limitedJson(
      request.body,
      4000
    )) as Record<string, unknown>;

    if (body.action === "challenge" && typeof body.wallet === "string") {
      return Response.json({
        message: await createChallenge(
          body.wallet,
          request.headers.get("origin")!
        ),
      });
    }

    if (
      body.action === "verify" &&
      typeof body.signature === "string" &&
      /^0x[0-9a-fA-F]{130}$/.test(body.signature)
    ) {
      return Response.json({
        wallet: await verifyChallenge(
          body.signature as `0x${string}`,
          request.headers.get("origin")!
        ),
      });
    }

    if (body.action === "logout") {
      await signOut();
      return Response.json({ wallet: null });
    }

    return Response.json(
      { error: "Invalid sign-in request." },
      { status: 400 }
    );
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "AUTH_FAILED";

    const allowed = new Set([
      "ORIGIN_MISMATCH",
      "MISSING_CHALLENGE",
      "CHALLENGE_LOOKUP_FAILED",
      "CHALLENGE_EXPIRED",
      "INVALID_SIGNATURE",
      "CHALLENGE_CONSUME_FAILED",
      "SESSION_CREATION_FAILED",
    ]);

    return Response.json(
      { error: allowed.has(reason) ? reason : "AUTH_FAILED" },
      { status: 400 }
    );
  }
}