/**
 * GET    /api/webhooks/events  — return all stored events (newest first)
 * DELETE /api/webhooks/events  — clear all stored events
 *
 * Works with both Vercel KV (production) and in-memory (local dev).
 */

import { getEvents, clearEvents } from "@/lib/webhooks/store.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await getEvents();
  return Response.json({
    events,
    count:  events.length,
    source: process.env.KV_REST_API_URL ? "kv" : "memory",
  });
}

export async function DELETE() {
  await clearEvents();
  return Response.json({ cleared: true });
}
