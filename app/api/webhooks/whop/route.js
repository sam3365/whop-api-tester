/**
 * POST /api/webhooks/whop
 *
 * Receives Whop webhook events (Standard Webhooks spec).
 * Verifies the signature via the Whop SDK, stores the event in
 * Vercel KV (or in-memory for local dev), and routes to the
 * existing handleEvent() logger.
 */

import { whop }                         from "@/lib/whop-client.js";
import { addEvent }                     from "@/lib/webhooks/store.js";
import { handleEvent, verifySignature } from "@/lib/webhooks/handler.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers);

  let event;
  let verified = false;

  const hasWebhookKey = !!process.env.WHOP_WEBHOOK_SECRET;

  if (hasWebhookKey && whop.webhooks?.unwrap) {
    // ── Primary: Standard Webhooks via SDK ───────────────────────────────────
    try {
      event    = whop.webhooks.unwrap(rawBody, { headers });
      verified = true;
    } catch (err) {
      console.error("❌ Webhook SDK verification failed:", err.message);
      return Response.json(
        { error: "Webhook signature verification failed", detail: err.message },
        { status: 400 },
      );
    }
  } else {
    // ── Fallback: legacy HMAC-SHA256 ─────────────────────────────────────────
    const secret    = process.env.WHOP_WEBHOOK_SECRET;
    const sigHeader = request.headers.get("x-whop-signature-256");

    if (secret && sigHeader) {
      verified = verifySignature(Buffer.from(rawBody), sigHeader, secret);
      if (!verified) {
        console.error("❌ Webhook HMAC verification failed");
        return Response.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      console.warn("⚠️  WHOP_WEBHOOK_SECRET not set — skipping verification");
    }

    try {
      event = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  }

  // ── Store event (KV or in-memory) ────────────────────────────────────────
  const { type, data } = event ?? {};
  const stored = await addEvent(type ?? "unknown", data ?? event, verified, headers);

  console.log(`\n📨 Webhook: ${stored.type} (verified: ${verified}) [${stored.id}]`);

  // ── Route to existing handler for logging ────────────────────────────────
  try {
    handleEvent(event);
  } catch (err) {
    console.error("⚠️  handleEvent threw:", err.message);
  }

  // Return 2xx quickly — Whop retries on failure
  return Response.json({ received: true, id: stored.id });
}
