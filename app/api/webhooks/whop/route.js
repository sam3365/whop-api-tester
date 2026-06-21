/**
 * POST /api/webhooks/whop
 *
 * Receives Whop webhook events (Standard Webhooks spec).
 * Verifies the signature manually using HMAC-SHA256 — bypasses the SDK's
 * webhookKey handling which has issues with the whsec_ prefix format.
 */

import crypto                           from "node:crypto";
import { addEvent }                     from "@/lib/webhooks/store.js";
import { handleEvent }                  from "@/lib/webhooks/handler.js";

export const dynamic = "force-dynamic";

/**
 * Standard Webhooks signature verification.
 *
 * Whop sends a secret in "whsec_<base64>" format.
 * The signing input is: `${webhook-id}.${webhook-timestamp}.${rawBody}`
 * The expected signature is: `v1,${base64(hmac-sha256(signingInput, secretBytes))}`
 * The header may contain multiple space-separated signatures.
 */
function verifyStandardWebhook(rawBody, headers, secret) {
  try {
    const msgId     = headers["webhook-id"];
    const timestamp = headers["webhook-timestamp"];
    const sigHeader = headers["webhook-signature"];

    if (!msgId || !timestamp || !sigHeader || !secret) return false;

    // Reject timestamps older than 5 minutes (replay attack protection)
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
      console.warn("⚠️  Webhook timestamp out of range:", timestamp);
      return false;
    }

    // Strip whsec_ prefix if present, then base64-decode to get raw key bytes
    const base64Secret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
    const secretBytes  = Buffer.from(base64Secret, "base64");

    const signingInput   = `${msgId}.${timestamp}.${rawBody}`;
    const expectedHmac   = crypto
      .createHmac("sha256", secretBytes)
      .update(signingInput)
      .digest("base64");
    const expectedSig    = `v1,${expectedHmac}`;

    // Header may contain multiple sigs like "v1,abc123 v1,def456"
    const signatures = sigHeader.split(" ");
    return signatures.some((sig) => {
      try {
        return crypto.timingSafeEqual(
          Buffer.from(sig.trim()),
          Buffer.from(expectedSig),
        );
      } catch {
        return false;
      }
    });
  } catch (err) {
    console.error("[webhook] verifyStandardWebhook error:", err.message);
    return false;
  }
}

export async function POST(request) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers);

  let event;
  let verified = false;

  const secret = process.env.WHOP_WEBHOOK_SECRET;

  if (secret) {
    verified = verifyStandardWebhook(rawBody, headers, secret);
    if (!verified) {
      console.error("❌ Webhook signature verification failed");
      console.error("   webhook-id:        ", headers["webhook-id"]);
      console.error("   webhook-timestamp: ", headers["webhook-timestamp"]);
      console.error("   webhook-signature: ", headers["webhook-signature"]);
      return Response.json(
        { error: "Webhook signature verification failed" },
        { status: 400 },
      );
    }
  } else {
    console.warn("⚠️  WHOP_WEBHOOK_SECRET not set — accepting webhook without verification");
  }

  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Store event (Upstash Redis on Vercel, in-memory locally)
  const { type, data } = event ?? {};
  const stored = await addEvent(type ?? "unknown", data ?? event, verified, headers);

  console.log(`\n📨 Webhook: ${stored.type} (verified: ${verified}) [${stored.id}]`);

  // Route to handler for logging / processing
  try {
    handleEvent(event);
  } catch (err) {
    console.error("⚠️  handleEvent threw:", err.message);
  }

  return Response.json({ received: true, id: stored.id });
}
