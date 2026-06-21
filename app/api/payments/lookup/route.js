/**
 * GET /api/payments/lookup?internal_member_id=xxx&limit=50
 *
 * Lists payments from the Whop API and filters server-side by
 * metadata.internal_member_id. The Whop payments list API does not support
 * direct metadata filtering, so we paginate through recent payments and
 * return only those whose metadata contains a matching internal_member_id.
 *
 * Query params:
 *   internal_member_id  — required, the ID to search for
 *   limit               — max payments to scan (default 200, max 500)
 */

import { whop, COMPANY_ID } from "@/lib/whop-client.js";

export const dynamic = "force-dynamic";

const DEFAULT_SCAN_LIMIT = 200;
const MAX_SCAN_LIMIT     = 500;
const PAGE_SIZE          = 50;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const memberId = (searchParams.get("internal_member_id") ?? "").trim();

  if (!memberId) {
    return Response.json({ error: "internal_member_id is required" }, { status: 400 });
  }

  const scanLimit = Math.min(
    parseInt(searchParams.get("limit") ?? String(DEFAULT_SCAN_LIMIT), 10) || DEFAULT_SCAN_LIMIT,
    MAX_SCAN_LIMIT,
  );

  const matches  = [];
  let   scanned  = 0;
  let   cursor   = undefined;

  try {
    // Paginate through payments until we've scanned enough or run out
    outer: while (scanned < scanLimit) {
      const page = await whop.payments.list({
        ...(COMPANY_ID ? { company_id: COMPANY_ID } : {}),
        limit:  PAGE_SIZE,
        ...(cursor ? { after: cursor } : {}),
      });

      const items = page.data ?? [];
      if (items.length === 0) break;

      for (const payment of items) {
        scanned++;
        const meta = payment.metadata ?? {};
        if (meta.internal_member_id === memberId) {
          matches.push(payment);
        }
        if (scanned >= scanLimit) break outer;
      }

      // Advance cursor
      if (page.has_more && page.data?.length) {
        cursor = page.data[page.data.length - 1].id;
      } else {
        break;
      }
    }

    return Response.json({
      internal_member_id: memberId,
      matches,
      count:    matches.length,
      scanned,
      truncated: scanned >= scanLimit,
    });

  } catch (err) {
    console.error("[payments/lookup] error:", err.message);
    return Response.json(
      { error: err.message ?? "Failed to fetch payments" },
      { status: 500 },
    );
  }
}
