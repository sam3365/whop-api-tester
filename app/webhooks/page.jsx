"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

// ── Event type metadata ───────────────────────────────────────────────────────
const EVENT_META = {
  "payment.created":         { color: "#2563eb", bg: "#0a0f1c", label: "Payment Created",         icon: "🆕" },
  "payment.succeeded":       { color: "#16a34a", bg: "#0d1a0d", label: "Payment Succeeded",      icon: "✅" },
  "payment.failed":          { color: "#dc2626", bg: "#1c0a0a", label: "Payment Failed",          icon: "❌" },
  "payment.refunded":        { color: "#d97706", bg: "#1c1505", label: "Payment Refunded",        icon: "↩️" },
  "membership.created":      { color: "#2563eb", bg: "#0a0f1c", label: "Membership Created",      icon: "🆕" },
  "membership.activated":    { color: "#16a34a", bg: "#0d1a0d", label: "Membership Activated",    icon: "✓" },
  "membership.updated":      { color: "#7c3aed", bg: "#110d1c", label: "Membership Updated",      icon: "🔄" },
  "membership.cancelled":    { color: "#dc2626", bg: "#1c0a0a", label: "Membership Cancelled",    icon: "🚫" },
  "membership.deactivated":  { color: "#dc2626", bg: "#1c0a0a", label: "Membership Deactivated",  icon: "⛔" },
  "membership.went_invalid": { color: "#dc2626", bg: "#1c0a0a", label: "Membership Went Invalid", icon: "⛔" },
};

function getEventMeta(type) {
  return EVENT_META[type] ?? { color: "var(--text-dim)", bg: "var(--surface2)", label: type, icon: "📨" };
}

function extractKeyFields(type, data) {
  if (!data) return [];
  const fields = [];
  if (data.id)                              fields.push({ k: "ID",                  v: data.id });
  if (data.amount != null && data.currency) fields.push({ k: "Amount",              v: `$${(data.amount / 100).toFixed(2)} ${data.currency.toUpperCase()}` });
  if (data.status)                          fields.push({ k: "Status",              v: data.status });
  if (data.user?.email ?? data.email)       fields.push({ k: "Email",               v: data.user?.email ?? data.email });
  if (data.user_id)                         fields.push({ k: "User ID",             v: data.user_id });
  if (data.plan_id)                         fields.push({ k: "Plan ID",             v: data.plan_id });
  if (data.failure_reason)                  fields.push({ k: "Failure Reason",      v: data.failure_reason });
  if (data.metadata?.internal_member_id)    fields.push({ k: "internal_member_id",  v: data.metadata.internal_member_id, highlight: true });
  return fields;
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 5_000)    return "just now";
  if (diff < 60_000)   return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return new Date(iso).toLocaleTimeString();
}

// ── JSON Viewer ───────────────────────────────────────────────────────────────
function JsonBlock({ data, label = "Raw Payload" }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setOpen((v) => !v)} style={{
        background: "none", border: "none", padding: 0, cursor: "pointer",
        color: "var(--text-dim)", fontSize: "0.75rem",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        <span style={{ display: "inline-block", width: 12, textAlign: "center", transition: "transform .15s", transform: open ? "rotate(90deg)" : "none" }}>▶</span>
        {label}
      </button>
      {open && (
        <pre style={{
          marginTop: 6, padding: "10px 14px",
          background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 6, overflowX: "auto", overflowY: "auto",
          fontFamily: "var(--font-mono)", fontSize: "0.72rem",
          color: "var(--text-dim)", lineHeight: 1.6, maxHeight: 360,
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────
function EventCard({ record, isNew }) {
  const [expanded, setExpanded] = useState(false);
  const meta   = getEventMeta(record.type);
  const fields = extractKeyFields(record.type, record.data);

  return (
    <div style={{
      background:   "var(--surface)",
      border:       `1px solid ${expanded ? meta.color : "var(--border)"}`,
      borderLeft:   `3px solid ${meta.color}`,
      borderRadius: "var(--radius)",
      marginBottom: 10,
      transition:   "border-color .2s",
      animation:    isNew ? "fadeSlideIn .3s ease" : "none",
      overflow:     "hidden",
    }}>
      {/* Header row */}
      <div
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer", gap: 12 }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              background: meta.bg, border: `1px solid ${meta.color}`, color: meta.color, whiteSpace: "nowrap",
            }}>
              {meta.icon} {meta.label}
            </span>
            {record.verified ? (
              <span style={{ fontSize: "0.62rem", padding: "1px 6px", borderRadius: 999, background: "#0d1a0d", border: "1px solid #16a34a", color: "#86efac" }}>
                ✓ verified
              </span>
            ) : (
              <span style={{ fontSize: "0.62rem", padding: "1px 6px", borderRadius: 999, background: "#1c1505", border: "1px solid #d97706", color: "#fde68a" }}>
                ⚠ unverified
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
            {fields.map(({ k, v, highlight }) => (
              <span key={k} style={{ fontSize: "0.75rem" }}>
                <span style={{ color: "var(--text-dim)" }}>{k}: </span>
                <span style={{ fontFamily: "var(--font-mono)", color: highlight ? "var(--ok)" : "var(--text)", fontWeight: highlight ? 700 : 400 }}>
                  {v}
                </span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", whiteSpace: "nowrap" }}>{relativeTime(record.receivedAt)}</span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{new Date(record.receivedAt).toLocaleTimeString()}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", transition: "transform .15s", transform: expanded ? "rotate(180deg)" : "none" }}>▾</span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "14px 16px", background: "var(--surface2)" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>ID: {record.id}</div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginBottom: 10, fontFamily: "var(--font-mono)" }}>
            Received: {new Date(record.receivedAt).toLocaleString()}
          </div>

          {record.data?.metadata && Object.keys(record.data.metadata).length > 0 && (
            <div style={{ marginBottom: 10, padding: "8px 12px", background: "#0d1a0d", border: "1px solid #16a34a", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
              <div style={{ color: "#86efac", marginBottom: 4, fontWeight: 600 }}>metadata</div>
              {Object.entries(record.data.metadata).map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: "var(--text-dim)" }}>{k}: </span>
                  <span style={{ color: "#4ade80" }}>{String(v)}</span>
                </div>
              ))}
            </div>
          )}

          <JsonBlock data={record.data}      label="Event Data" />
          <JsonBlock data={record.rawHeaders} label="Webhook Headers" />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const POLL_INTERVAL = 2000; // ms

export default function WebhooksPage() {
  const [events,    setEvents]    = useState([]);
  const [mode,      setMode]      = useState("connecting"); // connecting | sse | polling | error
  const [lastPoll,  setLastPoll]  = useState(null);
  const [newIds,    setNewIds]    = useState(new Set());
  const [filter,    setFilter]    = useState("all");

  const knownIdsRef  = useRef(new Set());
  const pollTimerRef = useRef(null);
  const esRef        = useRef(null);

  // ── Mark incoming events as "new" for animation ───────────────────────────
  const applyEvents = useCallback((incoming) => {
    const freshIds = incoming
      .map((e) => e.id)
      .filter((id) => !knownIdsRef.current.has(id));

    if (freshIds.length > 0) {
      freshIds.forEach((id) => knownIdsRef.current.add(id));
      setNewIds((prev) => {
        const next = new Set([...prev, ...freshIds]);
        freshIds.forEach((id) =>
          setTimeout(() => setNewIds((s) => { const n = new Set(s); n.delete(id); return n; }), 2000),
        );
        return next;
      });
    }

    setEvents(incoming);
    setLastPoll(Date.now());
  }, []);

  // ── Polling (used on Vercel / KV mode) ───────────────────────────────────
  const startPolling = useCallback(() => {
    setMode("polling");

    const poll = async () => {
      try {
        const res  = await fetch("/api/webhooks/events");
        const data = await res.json();
        applyEvents(data.events ?? []);
      } catch {
        /* network blip — try again next interval */
      }
    };

    poll(); // immediate first fetch
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL);
  }, [applyEvents]);

  // ── SSE (used in local dev / in-memory mode) ──────────────────────────────
  const startSSE = useCallback(() => {
    esRef.current?.close();
    setMode("connecting");

    const es = new EventSource("/api/webhooks/stream");
    esRef.current = es;

    es.onopen = () => setMode("sse");

    es.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      if (payload.action === "init" || payload.action === "new") {
        if (payload.action === "init") applyEvents(payload.events ?? []);
        else applyEvents((prev) => [payload.record, ...prev]);
      } else if (payload.action === "clear") {
        setEvents([]);
        knownIdsRef.current.clear();
      }
    };

    es.onerror = () => {
      es.close();
      setMode("error");
      // If KV is active the stream returns 503 — fall back to polling
      setTimeout(startPolling, 500);
    };
  }, [applyEvents, startPolling]);

  // ── On mount: try SSE first; if it returns 503 switch to polling ──────────
  useEffect(() => {
    // Quick probe: if the stream endpoint says "use-polling", skip SSE
    fetch("/api/webhooks/stream")
      .then((r) => {
        if (r.status === 503) {
          startPolling();
        } else {
          startSSE();
        }
      })
      .catch(startPolling);

    return () => {
      esRef.current?.close();
      clearInterval(pollTimerRef.current);
    };
  }, [startPolling, startSSE]);

  // ── Clear ─────────────────────────────────────────────────────────────────
  const clearAll = async () => {
    await fetch("/api/webhooks/events", { method: "DELETE" });
    setEvents([]);
    knownIdsRef.current.clear();
    setLastPoll(Date.now());
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const filteredEvents = filter === "all"
    ? events
    : events.filter((e) => e.type?.startsWith(filter));

  const counts = events.reduce((acc, e) => {
    const g = e.type?.split(".")[0] ?? "other";
    acc[g] = (acc[g] ?? 0) + 1;
    return acc;
  }, {});

  const isLive     = mode === "sse" || mode === "polling";
  const modeLabel  = mode === "sse" ? "Live · SSE" : mode === "polling" ? "Live · polling" : mode === "connecting" ? "Connecting…" : "Disconnected";
  const modeColor  = isLive ? "var(--ok)" : mode === "connecting" ? "var(--suite)" : "var(--err)";

  const secondsAgo = lastPoll ? Math.round((Date.now() - lastPoll) / 1000) : null;

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)", color: "var(--text)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
      `}</style>

      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 28px", borderBottom: "1px solid var(--border)",
        background: "var(--surface)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ color: "var(--text-dim)", textDecoration: "none", fontSize: "0.85rem" }}>← Dashboard</Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            🔔 Webhook Events
          </h1>
          {/* Mode indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", background: modeColor, display: "inline-block",
              animation: isLive ? "pulse 2s infinite" : "none",
            }} />
            <span style={{ color: modeColor, fontWeight: 600 }}>{modeLabel}</span>
            {mode === "polling" && secondsAgo !== null && (
              <span style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>
                · updated {secondsAgo}s ago
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: "0.78rem", color: "var(--text-dim)",
            background: "var(--surface2)", border: "1px solid var(--border)",
            padding: "4px 10px", borderRadius: 6,
          }}>
            {events.length} event{events.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={clearAll}
            style={{
              fontSize: "0.8rem", color: "#fca5a5", background: "#1c0a0a",
              border: "1px solid #7f1d1d", borderRadius: 6,
              padding: "6px 14px", cursor: "pointer",
            }}
          >
            Clear All
          </button>
        </div>
      </header>

      {/* Endpoint info bar */}
      <div style={{
        padding: "10px 28px", background: "#0d1a0d", borderBottom: "1px solid #16a34a",
        fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <span style={{ color: "#86efac", fontWeight: 600 }}>Webhook URL:</span>
        <code style={{ color: "#4ade80", fontFamily: "var(--font-mono)", background: "#052e16", padding: "2px 10px", borderRadius: 4 }}>
          POST /api/webhooks/whop
        </code>
        <span style={{ color: "var(--text-dim)" }}>
          Vercel: <code style={{ color: "#86efac" }}>https://&lt;your-app&gt;.vercel.app/api/webhooks/whop</code>
        </span>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <aside style={{
          width: 200, borderRight: "1px solid var(--border)",
          background: "var(--surface)", padding: "16px 12px",
          display: "flex", flexDirection: "column", gap: 4, flexShrink: 0,
        }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>
            Filter
          </div>
          {[
            { key: "all",        label: "All Events",  count: events.length },
            { key: "payment",    label: "Payments",    count: counts.payment    ?? 0 },
            { key: "membership", label: "Memberships", count: counts.membership ?? 0 },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                background: filter === key ? "#1c1727" : "transparent",
                color: filter === key ? "var(--accent)" : "var(--text-dim)",
                fontSize: "0.82rem", fontWeight: filter === key ? 600 : 400,
                textAlign: "left", width: "100%",
                outline: filter === key ? "1px solid var(--accent)" : "none",
              }}
            >
              <span>{label}</span>
              {count > 0 && (
                <span style={{
                  fontSize: "0.68rem", fontWeight: 700, minWidth: 18,
                  textAlign: "center", padding: "1px 5px", borderRadius: 999,
                  background: filter === key ? "var(--accent)" : "var(--surface2)",
                  color: filter === key ? "#fff" : "var(--text-dim)",
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}

          {/* Storage mode badge */}
          <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: 6, letterSpacing: ".04em", textTransform: "uppercase" }}>
              Storage
            </div>
            <span style={{
              fontSize: "0.68rem", padding: "3px 8px", borderRadius: 999,
              background: mode === "polling" ? "#0d1a0d" : "var(--surface2)",
              border: `1px solid ${mode === "polling" ? "var(--ok)" : "var(--border)"}`,
              color: mode === "polling" ? "var(--ok)" : "var(--text-dim)",
            }}>
              {mode === "polling" ? "Vercel KV" : "In-memory"}
            </span>
          </div>
        </aside>

        {/* Event list */}
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {filteredEvents.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: 16,
              color: "var(--text-dim)", textAlign: "center",
            }}>
              <span style={{ fontSize: "3rem" }}>🔔</span>
              <div>
                <p style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 6 }}>No webhook events yet</p>
                <p style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                  Trigger a payment from the Checkout page and the event will appear here
                  {mode === "polling" ? " within 2 seconds." : " in real-time."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16, fontSize: "0.78rem", color: "var(--text-dim)" }}>
                {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                {filter !== "all" ? ` · filter: ${filter}` : ""}
                {" · "}{mode === "polling" ? "polling every 2s" : "live SSE"}{" · newest first"}
              </div>
              {filteredEvents.map((record) => (
                <EventCard key={record.id} record={record} isNew={newIds.has(record.id)} />
              ))}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
