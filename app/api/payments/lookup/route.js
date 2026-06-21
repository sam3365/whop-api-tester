/**
 * GET /api/payments/lookup
 *
 * Two modes depending on query params:
 *
 *   ?email=user@example.com
 *     Uses the Whop payments list `query` param (native email search).
 *     Requires member:email:read scope. Returns all matching payments.
 *
 *   ?payment_id=pay_xxxxxx
 *     Retrieves a single payment by ID via payments.retrieve().
 *     Requires payment:basic:read scope.
 */

import { whop } from "@/lib/whop-client.js";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function authErrResponse(err) {
  const isAuthError =
    err.message?.includes("not authorized") ||
    err.message?.includes("unauthorized") ||
    err.status === 401 || err.status === 403 || err.status === 400;
  return Response.json(
    {
      error: isAuthError
        ? `API key missing required scopes. Enable in Whop Dashboard → Developer → API Keys: payment:basic:read, plan:basic:read, access_pass:basic:read, member:basic:read, member:email:read, member:phone:read, promo_code:basic:read. Raw: ${err.message}`
        : (err.message ?? "Failed to fetch payments"),
    },
    { status: isAuthError ? 403 : 500 },
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email     = (searchParams.get("email")      ?? "").trim();
  const paymentId = (searchParams.get("payment_id") ?? "").trim();

  // ── Mode 1: lookup by payment ID ──────────────────────────────────────────
  if (paymentId) {
    try {
      const payment = await whop.payments.retrieve(paymentId);
      return Response.json({
        mode:       "payment_id",
        payment_id: paymentId,
        matches:    [payment],
        count:      1,
      });
    } catch (err) {
      console.error("[payments/lookup] retrieve error:", err.message);
      if (err.status === 404 || err.message?.includes("not found")) {
        return Response.json(
          { error: `Payment "${paymentId}" not found.` },
          { status: 404 },
        );
      }
      return authErrResponse(err);
    }
  }

  // ── Mode 2: lookup by email ───────────────────────────────────────────────
  if (!email) {
    return Response.json({ error: "Provide either email or payment_id" }, { status: 400 });
  }

  const matches = [];
  let   cursor  = undefined;

  try {
    while (true) {
      const page = await whop.payments.list({
        query: email,
        limit: PAGE_SIZE,
        ...(cursor ? { after: cursor } : {}),
      });

      const items = page.data ?? [];
      matches.push(...items);

      if (page.has_more && items.length > 0) {
        cursor = items[items.length - 1].id;
      } else {
        break;
      }
    }

    return Response.json({
      mode:    "email",
      email,
      matches,
      count:   matches.length,
    });

  } catch (err) {
    console.error("[payments/lookup] list error:", err.message);
    return authErrResponse(err);
  }
}
