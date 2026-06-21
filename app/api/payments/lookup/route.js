/**
 * GET /api/payments/lookup?email=user@example.com
 *
 * Searches payments using the Whop API's built-in query parameter, which
 * supports filtering by user email (requires member:email:read scope).
 * Results are paginated and returned in full.
 *
 * Query params:
 *   email  — required, the user's email address to search
 */

import { whop } from "@/lib/whop-client.js";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") ?? "").trim();

  if (!email) {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  const matches = [];
  let   cursor  = undefined;

  try {
    // The Whop payments list `query` param searches by user email natively.
    // Paginate until all results are collected.
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
      email,
      matches,
      count: matches.length,
    });

  } catch (err) {
    console.error("[payments/lookup] error:", err.message);
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
}
