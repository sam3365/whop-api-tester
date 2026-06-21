/**
 * POST /api/checkout/session
 *
 * Creates a Whop Checkout Configuration with metadata.internal_member_id
 * so the member ID flows through to payments and webhooks.
 *
 * Body: { planId: string, memberId: string }
 * Returns: { sessionId: string, metadata: object }
 */
import { whop } from "@/lib/whop-client.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { planId, memberId, metadata: extraMetadata } = body ?? {};

  if (!planId) {
    return Response.json({ error: "planId is required" }, { status: 400 });
  }
  if (!memberId) {
    return Response.json({ error: "memberId is required" }, { status: 400 });
  }

  // Merge caller-supplied metadata with the required internal_member_id field.
  // The checkout page passes cardholder name + address here so they flow
  // through to webhook payloads and the payment record.
  const metadata = {
    internal_member_id: String(memberId),
    ...(extraMetadata ?? {}),
  };

  try {
    const config = await whop.checkoutConfigurations.create({
      plan_id: planId,
      metadata,
    });

    return Response.json({
      sessionId: config.id,
      metadata: config.metadata,
      purchaseUrl: config.purchase_url ?? null,
    });
  } catch (err) {
    console.error("[checkout/session] checkoutConfigurations.create failed:", err);
    return Response.json(
      { error: err.message ?? "Failed to create checkout configuration" },
      { status: 502 },
    );
  }
}
