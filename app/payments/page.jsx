"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(cents, currency = "usd") {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: (currency ?? "usd").toUpperCase(),
  }).format(parseFloat(cents));
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function StatusBadge({ status }) {
  const map = {
    paid:     { bg: "#0d1a0d", border: "#16a34a", color: "#86efac", label: "paid" },
    open:     { bg: "#1c1505", border: "#d97706", color: "#fde68a", label: "open" },
    refunded: { bg: "#0d0d1a", border: "#6366f1", color: "#c7d2fe", label: "refunded" },
    voided:   { bg: "#1a1a1a", border: "#71717a", color: "#d4d4d8", label: "voided" },
    failed:   { bg: "#1c0a0a", border: "#dc2626", color: "#fca5a5", label: "failed" },
  };
  const s = map[status] ?? { bg: "var(--surface2)", border: "var(--border)", color: "var(--text-dim)", label: status ?? "—" };
  return (
    <span style={{
      fontSize: "0.68rem", fontWeight: 700, padding: "2px 10px", borderRadius: 999,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

function MetadataBlock({ metadata }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;
  return (
    <div style={{
      marginTop: 10, padding: "8px 12px",
      background: "var(--surface2)", border: "1px solid var(--ok)",
      borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: "0.72rem",
    }}>
      <div style={{ color: "var(--ok)", fontWeight: 700, marginBottom: 4 }}>metadata</div>
      {Object.entries(metadata).map(([k, v]) => (
        <div key={k}>
          <span style={{ color: "var(--text-dim)" }}>{k}: </span>
          <span style={{ color: k === "internal_member_id" ? "var(--ok)" : "var(--text)", fontWeight: k === "internal_member_id" ? 700 : 400 }}>
            {String(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

function JsonBlock({ data, label = "Raw JSON" }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(v => !v)} style={{
        background: "none", border: "none", padding: 0, cursor: "pointer",
        color: "var(--text-dim)", fontSize: "0.72rem",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        <span style={{ display: "inline-block", width: 10, transition: "transform .15s", transform: open ? "rotate(90deg)" : "none" }}>▶</span>
        {label}
      </button>
      {open && (
        <pre style={{
          marginTop: 6, padding: "10px 14px",
          background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 6, overflowX: "auto", maxHeight: 320, overflowY: "auto",
          fontFamily: "var(--font-mono)", fontSize: "0.7rem",
          color: "var(--text-dim)", lineHeight: 1.6,
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function PaymentCard({ payment, isNew }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderLeft: `3px solid ${payment.status === "paid" ? "var(--ok)" : payment.status === "open" ? "#d97706" : "var(--border)"}`,
      borderRadius: "var(--radius)", padding: "18px 20px", marginBottom: 12,
      animation: isNew ? "fadeIn .3s ease" : "none",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <code style={{ fontSize: "0.78rem", color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{payment.id}</code>
          <StatusBadge status={payment.status} />
          {payment.substatus && payment.substatus !== payment.status && (
            <span style={{ fontSize: "0.65rem", color: "var(--text-dim)", fontStyle: "italic" }}>{payment.substatus}</span>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
            {fmt(payment.total ?? payment.amount, payment.currency)}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
            {fmtDate(payment.paid_at ?? payment.created_at)}
          </div>
        </div>
      </div>

      {/* Detail grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "6px 24px", fontSize: "0.75rem",
      }}>
        {payment.user?.email && (
          <div><span style={{ color: "var(--text-dim)" }}>Email: </span>{payment.user.email}</div>
        )}
        {payment.plan?.id && (
          <div><span style={{ color: "var(--text-dim)" }}>Plan: </span>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>{payment.plan.id}</code>
          </div>
        )}
        {payment.product?.title && (
          <div><span style={{ color: "var(--text-dim)" }}>Product: </span>{payment.product.title}</div>
        )}
        {payment.membership?.id && (
          <div><span style={{ color: "var(--text-dim)" }}>Membership: </span>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>{payment.membership.id}</code>
          </div>
        )}
        {payment.checkout_configuration_id && (
          <div><span style={{ color: "var(--text-dim)" }}>Checkout Config: </span>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>{payment.checkout_configuration_id}</code>
          </div>
        )}
        {payment.billing_reason && (
          <div><span style={{ color: "var(--text-dim)" }}>Billing: </span>{payment.billing_reason}</div>
        )}
        {payment.payment_method_type && (
          <div><span style={{ color: "var(--text-dim)" }}>Method: </span>{payment.payment_method_type}
            {payment.card_brand && ` · ${payment.card_brand} ····${payment.card_last4}`}
          </div>
        )}
        {payment.billing_address?.name && (
          <div><span style={{ color: "var(--text-dim)" }}>Billing Name: </span>{payment.billing_address.name}</div>
        )}
      </div>

      {/* Metadata */}
      <MetadataBlock metadata={payment.metadata} />

      {/* Raw JSON */}
      <JsonBlock data={payment} label="Full payment record" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [memberId,   setMemberId]   = useState("");
  const [results,    setResults]    = useState(null);  // null = not searched yet
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [newIds,     setNewIds]     = useState(new Set());
  const inputRef = useRef(null);

  // Pre-fill from env on mount
  useEffect(() => {
    fetch("/api/checkout/prefill")
      .then(r => r.json())
      .then(d => { if (d.memberId) setMemberId(d.memberId); })
      .catch(() => {});
  }, []);

  const search = async (idOverride) => {
    const id = (idOverride ?? memberId).trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res  = await fetch(`/api/payments/lookup?internal_member_id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Animate new cards
      const ids = new Set((data.matches ?? []).map(p => p.id));
      setNewIds(ids);
      setTimeout(() => setNewIds(new Set()), 1500);

      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") search(); };

  const payments = results?.matches ?? [];

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)", color: "var(--text)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }`}</style>

      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 28px", borderBottom: "1px solid var(--border)",
        background: "var(--surface)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ color: "var(--text-dim)", textDecoration: "none", fontSize: "0.85rem" }}>← Dashboard</Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>💰 Payments Lookup</h1>
        </div>
        {results && (
          <span style={{
            fontSize: "0.78rem", color: "var(--text-dim)",
            background: "var(--surface2)", border: "1px solid var(--border)",
            padding: "4px 12px", borderRadius: 6,
          }}>
            {results.count} match{results.count !== 1 ? "es" : ""} · {results.scanned} scanned
            {results.truncated && " · truncated"}
          </span>
        )}
      </header>

      {/* Search bar */}
      <div style={{
        padding: "20px 28px", borderBottom: "1px solid var(--border)",
        background: "var(--surface)", display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: 6 }}>
            Internal Member ID
            <span style={{
              marginLeft: 8, fontSize: "0.62rem", padding: "1px 7px", borderRadius: 999,
              background: "#0d1a0d", border: "1px solid var(--ok)", color: "#86efac",
              fontFamily: "var(--font-mono)",
            }}>
              TEST_MEMBERSHIP_ID
            </span>
          </label>
          <input
            ref={inputRef}
            type="text"
            value={memberId}
            onChange={e => setMemberId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 6a31b370399b2834e89a84bb"
            style={{
              width: "100%", padding: "9px 14px",
              background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: 8, color: "var(--text)", fontSize: "0.9rem",
              outline: "none", fontFamily: "var(--font-mono)", boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={() => search()}
          disabled={loading || !memberId.trim()}
          style={{
            padding: "9px 28px", borderRadius: 8, border: "none",
            background: loading || !memberId.trim() ? "var(--surface2)" : "var(--accent)",
            color: loading || !memberId.trim() ? "var(--text-dim)" : "#fff",
            fontWeight: 700, fontSize: "0.9rem",
            cursor: loading || !memberId.trim() ? "not-allowed" : "pointer",
            transition: "background .15s", whiteSpace: "nowrap",
          }}
        >
          {loading ? "Searching…" : "Search"}
        </button>
        {results && (
          <button
            onClick={() => { setResults(null); setError(null); setMemberId(""); setTimeout(() => inputRef.current?.focus(), 50); }}
            style={{
              padding: "9px 16px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--surface2)",
              color: "var(--text-dim)", fontSize: "0.85rem", cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Info banner */}
      <div style={{
        padding: "8px 28px", background: "var(--surface2)",
        borderBottom: "1px solid var(--border)",
        fontSize: "0.75rem", color: "var(--text-dim)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span>🔍</span>
        <span>
          Scans up to 200 recent payments and returns those whose{" "}
          <code style={{ fontFamily: "var(--font-mono)", color: "var(--ok)" }}>metadata.internal_member_id</code>
          {" "}matches. Payments must have been created via a Checkout Configuration session.
        </span>
      </div>

      {/* Body */}
      <main style={{ flex: 1, padding: "24px 28px", maxWidth: 960, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

        {/* Initial state */}
        {!results && !loading && !error && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", paddingTop: 80, gap: 14,
            color: "var(--text-dim)", textAlign: "center",
          }}>
            <span style={{ fontSize: "3rem" }}>💰</span>
            <p style={{ fontSize: "1rem", fontWeight: 600 }}>Enter an Internal Member ID to look up payments</p>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.6, maxWidth: 480 }}>
              This searches payments whose <code style={{ fontFamily: "var(--font-mono)", color: "var(--ok)" }}>metadata.internal_member_id</code> matches
              the ID you specify — populated when you create a Checkout Configuration session.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ paddingTop: 60, textAlign: "center", color: "var(--text-dim)" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 12, animation: "spin 1s linear infinite" }}>⏳</div>
            <p>Scanning payments…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: "16px 20px", borderRadius: "var(--radius)",
            background: "#1c0a0a", border: "1px solid var(--err)",
            color: "#fca5a5", fontSize: "0.85rem", marginBottom: 16,
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <>
            {/* Summary */}
            <div style={{
              padding: "14px 18px", marginBottom: 20,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", display: "flex", gap: 24, flexWrap: "wrap",
              fontSize: "0.82rem",
            }}>
              <div>
                <span style={{ color: "var(--text-dim)" }}>Member ID: </span>
                <code style={{ fontFamily: "var(--font-mono)", color: "var(--ok)", fontWeight: 700 }}>{results.internal_member_id}</code>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)" }}>Payments found: </span>
                <strong style={{ color: payments.length > 0 ? "var(--ok)" : "var(--text-dim)" }}>{payments.length}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)" }}>Payments scanned: </span>
                <span>{results.scanned}</span>
                {results.truncated && <span style={{ color: "#d97706", marginLeft: 6 }}>(scan limit reached)</span>}
              </div>
              {payments.length > 0 && (
                <div>
                  <span style={{ color: "var(--text-dim)" }}>Total paid: </span>
                  <strong style={{ color: "var(--ok)" }}>
                    {fmt(
                      payments
                        .filter(p => p.status === "paid")
                        .reduce((sum, p) => sum + parseFloat(p.total ?? p.amount ?? 0), 0)
                        .toFixed(2),
                      payments[0]?.currency,
                    )}
                  </strong>
                </div>
              )}
            </div>

            {/* No results */}
            {payments.length === 0 && (
              <div style={{
                padding: "40px 20px", textAlign: "center",
                background: "var(--surface)", borderRadius: "var(--radius)",
                border: "1px solid var(--border)", color: "var(--text-dim)",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: 12 }}>🔍</div>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>No payments found</p>
                <p style={{ fontSize: "0.85rem" }}>
                  No payments in the last {results.scanned} scanned had{" "}
                  <code style={{ fontFamily: "var(--font-mono)" }}>metadata.internal_member_id = "{results.internal_member_id}"</code>.
                  <br />Make sure you created the checkout session with this ID set.
                </p>
              </div>
            )}

            {/* Payment cards */}
            {payments.map(payment => (
              <PaymentCard key={payment.id} payment={payment} isNew={newIds.has(payment.id)} />
            ))}

            {results.truncated && (
              <div style={{
                padding: "12px 16px", borderRadius: "var(--radius)",
                background: "#1c1505", border: "1px solid #d97706",
                color: "#fde68a", fontSize: "0.8rem", marginTop: 8,
              }}>
                ⚠ Scan limit of {results.scanned} payments reached. There may be more matches in older payments.
                Contact Whop support if you need metadata-based payment search without scanning.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
