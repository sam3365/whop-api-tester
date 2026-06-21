/**
 * GET /api/checkout/receipt?id=<receiptId>&planId=<planId>
 *
 * Fetches the full Whop API record for a completed checkout.
 * Tries payments first, then memberships, so it works regardless of
 * which ID format Whop returns in onComplete.
 */
import { whop, COMPANY_ID } from "@/lib/whop-client.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id       = searchParams.get("id");
  const planId   = searchParams.get("planId");
  const memberId = searchParams.get("memberId");

  if (!id) {
    return Response.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const result = { id, planId, memberId: memberId ?? null, sources: {} };

  // 0. Look up TEST_MEMBERSHIP_ID from .env.local if present
  const envMembershipId = process.env.TEST_MEMBERSHIP_ID;
  if (envMembershipId) {
    try {
      const envMembership = await whop.memberships.retrieve(envMembershipId);
      result.envMembership = envMembership;
      result.sources.envMembership = `ok (TEST_MEMBERSHIP_ID=${envMembershipId})`;
    } catch (err) {
      result.sources.envMembership = `failed for TEST_MEMBERSHIP_ID=${envMembershipId}: ${err.message}`;
    }
  } else {
    result.sources.envMembership = "TEST_MEMBERSHIP_ID not set in .env.local";
  }

  // 1. Try direct payment lookup (ID may start with pay_ or rec_)
  try {
    const payment = await whop.payments.retrieve(id);
    result.payment = payment;
    result.sources.payment = "ok";
  } catch (err) {
    result.sources.payment = err.message;
  }

  // 2. List recent payments and find a match by plan
  try {
    const payments = await whop.payments.list({ company_id: COMPANY_ID });
    const recent = payments.data?.slice(0, 10) ?? [];
    const matched = planId
      ? recent.filter((p) => p.plan_id === planId || p.id === id)
      : recent.filter((p) => p.id === id);
    if (matched.length > 0) result.recentPayments = matched;
    result.sources.paymentList = `found ${matched.length} match(es)`;
  } catch (err) {
    result.sources.paymentList = err.message;
  }

  // 3. List recent memberships and find a match by plan
  try {
    const memberships = await whop.memberships.list({ company_id: COMPANY_ID });
    const recent = memberships.data?.slice(0, 10) ?? [];
    const matched = planId
      ? recent.filter((m) => m.plan_id === planId)
      : recent;
    if (matched.length > 0) result.recentMemberships = matched.slice(0, 3);
    result.sources.memberships = `found ${matched.length} match(es)`;
  } catch (err) {
    result.sources.memberships = err.message;
  }

  return Response.json(result);
}
