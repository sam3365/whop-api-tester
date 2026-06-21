/**
 * POST /api/webhooks/whop
 *
 * Receives Whop webhook events (Standard Webhooks spec).
 * Signature verification is implemented manually using HMAC-SHA256.
 *
 * Set WHOP_SKIP_WEBHOOK_VERIFICATION=true in Vercel env to bypass
 * signature checking (useful while diagnosing verification issues).
 */

import crypto       from "node:crypto";
import { addEvent } from "@/lib/webhooks/store.js";
import { handleEvent } from "@/lib/webhooks/handler.js";

export const dynamic = "force-dynamic";

/**
 * Standard Webhooks (https://www.standardwebhooks.com/) signature check.
 *
 * Whop secret format: "whsec_<base64>" — strip prefix, base64-decode to get key bytes.
 * Signing input: "${webhook-id}.${webhook-timestamp}.${rawBody}"
 * Expected sig:  "v1,${base64(hmac-sha256(signingInput, keyBytes))}"
 *
 * Returns { ok: boolean, reason: string }
 */
function verifyStandardWebhook(rawBody, headers, secret) {
  const msgId     = headers["webhook-id"];
  const timestamp = headers["webhook-timestamp"];
  const sigHeader = headers["webhook-signature"];

  // Log incoming headers for diagnostics (Vercel function logs)
  console.log("[webhook/verify] webhook-id:        ", msgId        ?? "(missing)");
  console.log("[webhook/verify] webhook-timestamp: ", timestamp    ?? "(missing)");
  console.log("[webhook/verify] webhook-signature: ", sigHeader    ?? "(missing)");
  console.log("[webhook/verify] secret prefix:     ", secret ? secret.slice(0, 10) + "…" : "(not set)");
  console.log("[webhook/verify] raw body length:   ", rawBody.length);

  if (!msgId)     return { ok: false, reason: "Missing webhook-id header" };
  if (!timestamp) return { ok: false, reason: "Missing webhook-timestamp header" };
  if (!sigHeader) return { ok: false, reason: "Missing webhook-signature header" };

  // Replay attack protection — allow 5 minute window
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return { ok: false, reason: `Invalid timestamp: ${timestamp}` };
  const ageSecs = Math.abs(Date.now() / 1000 - ts);
  if (ageSecs > 300) {
    return { ok: false, reason: `Timestamp too old (${Math.round(ageSecs)}s ago, max 300s)` };
  }

  // Strip known Whop/StandardWebhooks secret prefixes, then base64-decode.
  // Whop uses "ws_<base64>"  (not the Standard Webhooks "whsec_<base64>").
  let base64Secret = secret;
  if      (secret.startsWith("whsec_")) base64Secret = secret.slice(6);
  else if (secret.startsWith("ws_"))    base64Secret = secret.slice(3);

  let secretBytes;
  try {
    secretBytes = Buffer.from(base64Secret, "base64");
  } catch (e) {
    return { ok: false, reason: `Cannot base64-decode secret: ${e.message}` };
  }

  const signingInput = `${msgId}.${timestamp}.${rawBody}`;
  const hmac         = crypto.createHmac("sha256", secretBytes).update(signingInput).digest("base64");
  const expectedSig  = `v1,${hmac}`;

  console.log("[webhook/verify] signing input (first 80): ", signingInput.slice(0, 80));
  console.log("[webhook/verify] computed sig:             ", expectedSig);
  console.log("[webhook/verify] received sigs:            ", sigHeader);

  const signatures = sigHeader.split(" ");
  const match = signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig.trim()), Buffer.from(expectedSig));
    } catch {
      return false;
    }
  });

  return match
    ? { ok: true,  reason: "ok" }
    : { ok: false, reason: "No signature matched computed HMAC" };
}

export async function POST(request) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers);

  const secret      = process.env.WHOP_WEBHOOK_SECRET;
  const skipVerify  = process.env.WHOP_SKIP_WEBHOOK_VERIFICATION === "true";
  let verified      = false;

  if (skipVerify) {
    console.warn("⚠️  [webhook] Signature verification SKIPPED (WHOP_SKIP_WEBHOOK_VERIFICATION=true)");
    verified = false; // still mark as unverified in the store
  } else if (!secret) {
    console.warn("⚠️  [webhook] WHOP_WEBHOOK_SECRET not set — accepting without verification");
  } else {
    const result = verifyStandardWebhook(rawBody, headers, secret);
    console.log(`[webhook/verify] result: ${result.ok ? "✅ OK" : "❌ FAILED"} — ${result.reason}`);

    if (!result.ok) {
      return Response.json(
        { error: "Webhook signature verification failed", reason: result.reason },
        { status: 400 },
      );
    }
    verified = true;
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, data } = event ?? {};
  const stored = await addEvent(type ?? "unknown", data ?? event, verified, headers);

  console.log(`📨 [webhook] ${stored.type} (verified:${verified}) [${stored.id}]`);

  try { handleEvent(event); } catch (err) {
    console.error("⚠️  handleEvent threw:", err.message);
  }

  return Response.json({ received: true, id: stored.id });
}
