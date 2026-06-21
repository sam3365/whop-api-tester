/**
 * GET /api/webhooks/stream
 *
 * Server-Sent Events — used only in local dev (in-memory store mode).
 * When Vercel KV is configured the webhook viewer uses polling instead,
 * so this endpoint is never called in production.
 *
 * Returns a 503 immediately when KV is active so the client knows to fall
 * back to polling without waiting for a timeout.
 */

import { getEvents, subscribe } from "@/lib/webhooks/store.js";

export const dynamic = "force-dynamic";

export async function GET() {
  // On Vercel (KV mode) SSE doesn't survive serverless cold starts —
  // tell the client to use polling instead.
  if (process.env.KV_REST_API_URL) {
    return Response.json({ error: "use-polling" }, { status: 503 });
  }

  // ── Local dev: in-memory + SSE ────────────────────────────────────────────
  const clientId = `sse_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const encoder  = new TextEncoder();
  let unsubscribe;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          unsubscribe?.();
        }
      };

      unsubscribe = subscribe(clientId, send);

      // Send current events immediately on connect
      const events = await getEvents();
      send({ action: "init", events });

      // Keep-alive ping every 25 s
      const pingTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ action: "ping" })}\n\n`));
        } catch {
          clearInterval(pingTimer);
          unsubscribe?.();
        }
      }, 25_000);

      controller._pingTimer = pingTimer;
    },
    cancel(controller) {
      clearInterval(controller._pingTimer);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
