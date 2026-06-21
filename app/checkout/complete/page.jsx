"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

// ── JSON viewer ───────────────────────────────────────────────────────────────
function JsonBlock({ data }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "var(--surface2)", border: "1px solid var(--border)",
          color: "var(--text-dim)", padding: "6px 14px", borderRadius: 6,
          fontSize: "0.8rem", cursor: "pointer", width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <span>Raw API Response</span>
        <span>{open ? "▲ Hide" : "▼ Show"}</span>
      </button>
      {open && (
        <pre style={{
          marginTop: 8, padding: "14px 16px",
          background: "#0a0a0f", border: "1px solid var(--border)",
          borderRadius: 8, overflowX: "auto",
          fontFamily: "var(--font-mono)", fontSize: "0.75rem",
          color: "var(--text-dim)", lineHeight: 1.7, maxHeight: 480,
          overflowY: "auto",
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────
function Field({ label, value, highlight }) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "10px 0", borderBottom: "1px solid var(--border)",
      gap: 16,
    }}>
      <span style={{ color: "var(--text-dim)", fontSize: "0.82rem", flexShrink: 0 }}>{label}</span>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: "0.8rem",
        color: highlight ? "var(--ok)" : "var(--text)",
        textAlign: "right", wordBreak: "break-all",
      }}>
        {value}
      </span>
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────
function CompleteContent() {
  const params    = useSearchParams();
  const status    = params.get("status");
  const receiptId = params.get("receipt_id");
  const planId    = params.get("plan_id");
  const memberId  = params.get("member_id"); // internal member ID from checkout config

  const isSuccess = status === "success";
  const isError   = status === "error";

  const [apiData, setApiData]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState(null);

  // Fetch full Whop API record on success
  useEffect(() => {
    if (!isSuccess || (!receiptId && !planId)) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (receiptId) qs.set("id",       receiptId);
    if (planId)    qs.set("planId",   planId);
    if (memberId)  qs.set("memberId", memberId);
    fetch(`/api/checkout/receipt?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => { setApiData(d); setLoading(false); })
      .catch((e) => { setApiError(e.message); setLoading(false); });
  }, [isSuccess, receiptId, planId]);

  // Extract the most useful payment record from the API response
  const payment    = apiData?.payment ?? apiData?.recentPayments?.[0] ?? null;
  const membership = apiData?.recentMemberships?.[0] ?? null;

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)", color: "var(--text)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 28px", borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/checkout" style={{ color: "var(--text-dim)", textDecoration: "none", fontSize: "0.85rem" }}>
            ← Back to Checkout
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <span style={{ fontWeight: 700 }}>Payment Confirmation</span>
        </div>
        <Link href="/" style={{
          fontSize: "0.8rem", color: "var(--text-dim)", textDecoration: "none",
          padding: "5px 12px", border: "1px solid var(--border)",
          borderRadius: 6, background: "var(--surface2)",
        }}>
          Dashboard
        </Link>
      </header>

      <div style={{
        maxWidth: 640, margin: "40px auto", padding: "0 24px 60px",
      }}>
        {/* Status card */}
        <div style={{
          background: "var(--surface)",
          border: `1px solid ${isSuccess ? "var(--ok)" : isError ? "var(--err)" : "var(--border)"}`,
          borderRadius: "var(--radius)", padding: "36px 32px",
          textAlign: "center", marginBottom: 24,
        }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>
            {isSuccess ? "🎉" : isError ? "❌" : "💳"}
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>
            {isSuccess ? "Payment Successful!" : isError ? "Payment Failed" : "Checkout Complete"}
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            {isSuccess
              ? "Your purchase was completed. Token details are confirmed below."
              : isError
              ? "Your payment did not go through. Please try again."
              : "Checkout flow finished."}
          </p>
          {isError && (
            <Link href="/checkout" style={{
              display: "inline-block", marginTop: 20,
              padding: "10px 24px", background: "var(--accent)", color: "#fff",
              borderRadius: 8, textDecoration: "none", fontWeight: 600,
            }}>
              Try Again
            </Link>
          )}
        </div>

        {/* Transaction summary */}
        {isSuccess && (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "24px 28px", marginBottom: 16,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: "0.9rem" }}>
              Transaction Summary
            </div>

            {/* IDs from onComplete */}
            <Field label="Plan ID"    value={planId}    />
            <Field label="Receipt ID" value={receiptId} highlight />
            {memberId && (
              <Field label="Internal Member ID" value={memberId} highlight />
            )}

            {/* Loading state */}
            {loading && (
              <div style={{ padding: "16px 0", color: "var(--text-dim)", fontSize: "0.85rem", textAlign: "center" }}>
                Fetching Whop API record…
              </div>
            )}

            {/* API error */}
            {apiError && (
              <div style={{ marginTop: 12, color: "var(--err)", fontSize: "0.82rem" }}>
                API lookup error: {apiError}
              </div>
            )}

            {/* Payment fields */}
            {payment && (
              <>
                <div style={{ marginTop: 12, marginBottom: 4, fontSize: "0.72rem", color: "var(--text-dim)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                  Payment
                </div>
                <Field label="Payment ID"          value={payment.id} />
                <Field label="Amount"              value={payment.amount != null ? `$${(payment.amount / 100).toFixed(2)} ${payment.currency?.toUpperCase() ?? ""}` : null} highlight />
                <Field label="Status"              value={payment.status} />
                <Field label="Created"             value={payment.created_at ? new Date(payment.created_at * 1000).toLocaleString() : null} />
                <Field label="User Email"          value={payment.user?.email ?? payment.email} />
                <Field label="internal_member_id"  value={payment.metadata?.internal_member_id} highlight />
                {payment.metadata && !payment.metadata.internal_member_id && Object.keys(payment.metadata).length > 0 && (
                  <Field label="metadata" value={JSON.stringify(payment.metadata)} />
                )}
              </>
            )}

            {/* Membership fields — from recent list */}
            {membership && (
              <>
                <div style={{ marginTop: 16, marginBottom: 4, fontSize: "0.72rem", color: "var(--text-dim)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                  Membership (recent match)
                </div>
                <Field label="Membership ID" value={membership.id} />
                <Field label="Status"        value={membership.status} highlight />
                <Field label="Valid Until"   value={membership.renewal_period_end ? new Date(membership.renewal_period_end * 1000).toLocaleString() : null} />
                <Field label="User ID"       value={membership.user_id} />
              </>
            )}

            {/* TEST_MEMBERSHIP_ID from .env.local */}
            {apiData?.envMembership && (
              <>
                <div style={{ marginTop: 16, marginBottom: 4, fontSize: "0.72rem", color: "var(--text-dim)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                  Membership (TEST_MEMBERSHIP_ID)
                </div>
                <Field label="Membership ID" value={apiData.envMembership.id} />
                <Field label="Status"        value={apiData.envMembership.status} highlight />
                <Field label="Plan ID"       value={apiData.envMembership.plan_id} />
                <Field label="Valid Until"   value={apiData.envMembership.renewal_period_end ? new Date(apiData.envMembership.renewal_period_end * 1000).toLocaleString() : null} />
                <Field label="User ID"       value={apiData.envMembership.user_id} />
                <Field label="User Email"    value={apiData.envMembership.user?.email} />
              </>
            )}

            {/* Raw API response */}
            {apiData && <JsonBlock data={apiData} />}
          </div>
        )}

        {/* Error details */}
        {isError && receiptId && (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "24px 28px",
          }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: "0.9rem" }}>Details</div>
            <Field label="Receipt ID" value={receiptId} />
            <Field label="Plan ID"    value={planId} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutComplete() {
  return (
    <Suspense fallback={
      <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)" }}>
        Loading…
      </div>
    }>
      <CompleteContent />
    </Suspense>
  );
}
