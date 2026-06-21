/**
 * POST /api/webhooks/whop
 *
 * Receives Whop webhook events.
 * Whop follows Standard Webhooks spec (https://www.standardwebhooks.com/).
 * Verification uses the `standardwebhooks` package (already a dependency of
 * @whop/sdk) with key = btoa(WHOP_WEBHOOK_SECRET), exactly per Whop's docs:
 * https://docs.whop.com/developer/guides/webhooks
 *
 * Set WHOP_SKIP_WEBHOOK_VERIFICATION=true in Vercel env to bypass
 * signature checking while diagnosing issues.
 */

import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { addEvent }    from "@/lib/webhooks/store.js";
import { handleEvent } from "@/lib/webhooks/handler.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const rawBody  = await request.text();
  const headers  = Object.fromEntries(request.headers);

  const secret     = (process.env.WHOP_WEBHOOK_SECRET ?? "").trim();
  const skipVerify = process.env.WHOP_SKIP_WEBHOOK_VERIFICATION === "true";
  let verified     = false;

  if (skipVerify) {
    console.warn("⚠️  [webhook] Signature verification SKIPPED (WHOP_SKIP_WEBHOOK_VERIFICATION=true)");

  } else if (!secret) {
    console.warn("⚠️  [webhook] WHOP_WEBHOOK_SECRET not set — accepting without verification");

  } else {
    // Whop docs: webhookKey = btoa(WHOP_WEBHOOK_SECRET)
    // standardwebhooks then base64-decodes that to get the raw key bytes.
    const webhookKey = Buffer.from(secret).toString("base64"); // equiv. to btoa(secret)

    console.log("[webhook/verify] webhook-id:       ", headers["webhook-id"]        ?? "(missing)");
    console.log("[webhook/verify] webhook-timestamp:", headers["webhook-timestamp"]  ?? "(missing)");
    console.log("[webhook/verify] webhook-signature:", headers["webhook-signature"]  ?? "(missing)");
    console.log("[webhook/verify] secret prefix:    ", secret.slice(0, 10) + "…");
    console.log("[webhook/verify] webhookKey prefix:", webhookKey.slice(0, 10) + "…");
    console.log("[webhook/verify] raw body length:  ", rawBody.length);

    try {
      const wh = new Webhook(webhookKey);
      wh.verify(rawBody, headers);
      verified = true;
      console.log("[webhook/verify] result: ✅ OK");
    } catch (err) {
      const isVerifyError = err instanceof WebhookVerificationError;
      console.error(`[webhook/verify] result: ❌ FAILED — ${err.message}`);

      if (isVerifyError) {
        return Response.json(
          { error: "Webhook signature verification failed", reason: err.message },
          { status: 400 },
        );
      }
      // Non-verification errors (e.g. JSON parse) — still reject
      return Response.json({ error: err.message }, { status: 400 });
    }
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
