"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import Link from "next/link";

// ── Plan definitions ──────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "starter",
    label: "Starter Pack",
    tokens: 300,
    price: "$2.99",
    planId: process.env.NEXT_PUBLIC_PLAN_STARTER,
  },
  {
    id: "popular",
    label: "Popular Pack",
    tokens: 1500,
    price: "$14.99",
    badge: "Most Popular",
    planId: process.env.NEXT_PUBLIC_PLAN_POPULAR,
  },
  {
    id: "value",
    label: "Value Pack",
    tokens: 3500,
    price: "$29.99",
    planId: process.env.NEXT_PUBLIC_PLAN_VALUE,
  },
  {
    id: "best",
    label: "Best Deal Pack",
    tokens: 8000,
    price: "$59.99",
    badge: "Best Value",
    planId: process.env.NEXT_PUBLIC_PLAN_BEST_DEAL,
  },
];

const ENV = (process.env.NEXT_PUBLIC_WHOP_ENVIRONMENT ?? "production");

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 28px",
    borderBottom: "1px solid var(--border)",
    background: "var(--surface)",
    flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 16 },
  backLink: {
    color: "var(--text-dim)",
    textDecoration: "none",
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  h1: { fontSize: "1.2rem", fontWeight: 700 },
  envBadge: (isSandbox) => ({
    fontSize: "0.7rem",
    background: isSandbox ? "#92400e" : "#14532d",
    color: isSandbox ? "#fde68a" : "#bbf7d0",
    border: `1px solid ${isSandbox ? "#d97706" : "#16a34a"}`,
    padding: "2px 10px",
    borderRadius: 999,
    fontWeight: 600,
  }),
  body: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 0,
    overflow: "hidden",
    height: "calc(100vh - 62px)",
  },
  leftPanel: {
    borderRight: "1px solid var(--border)",
    background: "var(--surface)",
    overflowY: "auto",
    padding: "28px 24px",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    marginBottom: 16,
    color: "var(--text)",
  },
  planGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  planCard: (selected) => ({
    background: selected ? "#1c1727" : "var(--surface2)",
    border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`,
    borderRadius: "var(--radius)",
    padding: "16px 14px",
    cursor: "pointer",
    transition: "all .15s",
    position: "relative",
    textAlign: "center",
  }),
  planBadge: (color) => ({
    position: "absolute",
    top: -10,
    left: "50%",
    transform: "translateX(-50%)",
    background: color === "popular" ? "var(--accent)" : "#b45309",
    color: "#fff",
    fontSize: "0.65rem",
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
    letterSpacing: ".04em",
  }),
  planTokens: {
    fontSize: "1.6rem",
    fontWeight: 800,
    color: "var(--text)",
    lineHeight: 1.1,
    marginTop: 8,
  },
  planUnit:  { fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: 6 },
  planPrice: { fontSize: "1.1rem", fontWeight: 700, color: "var(--accent)", marginBottom: 4 },
  planLabel: { fontSize: "0.72rem", color: "var(--text-dim)" },
  missingId: { marginTop: 4, fontSize: "0.68rem", color: "var(--err)" },
  rightPanel: {
    background: "var(--bg)",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  checkoutHeader: {
    padding: "20px 28px 0",
    fontSize: "0.85rem",
    color: "var(--text-dim)",
    flexShrink: 0,
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    color: "var(--text-dim)",
    padding: 40,
    textAlign: "center",
  },
  missingEnvBox: {
    margin: "0 0 16px",
    padding: "12px 16px",
    background: "#1c1010",
    border: "1px solid var(--err)",
    borderRadius: "var(--radius)",
    fontSize: "0.82rem",
    color: "#fca5a5",
    lineHeight: 1.6,
  },
  // Shared config section box
  configBox: {
    marginTop: 16,
    padding: "18px 16px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
  },
  configTitle: {
    fontSize: "0.82rem",
    fontWeight: 600,
    marginBottom: 14,
    color: "var(--text)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  envTag: {
    fontSize: "0.62rem",
    fontWeight: 600,
    padding: "1px 7px",
    borderRadius: 999,
    background: "#0d1a0d",
    border: "1px solid var(--ok)",
    color: "#86efac",
    fontFamily: "var(--font-mono)",
  },
  inputLabel: {
    display: "block",
    fontSize: "0.75rem",
    color: "var(--text-dim)",
    marginBottom: 5,
    marginTop: 12,
  },
  input: {
    width: "100%",
    padding: "7px 10px",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text)",
    fontSize: "0.83rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color .15s",
  },
  inputRow: {
    display: "grid",
    gap: 8,
  },
  inputHint: {
    fontSize: "0.68rem",
    color: "var(--text-dim)",
    marginTop: 4,
    lineHeight: 1.5,
  },
  createBtn: (disabled) => ({
    marginTop: 14,
    width: "100%",
    padding: "8px 14px",
    background: disabled ? "var(--surface)" : "var(--accent)",
    color: disabled ? "var(--text-dim)" : "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background .15s",
  }),
  sessionOk: {
    marginTop: 10,
    padding: "8px 12px",
    borderRadius: 6,
    background: "#0d1a0d",
    border: "1px solid var(--ok)",
    fontSize: "0.72rem",
    color: "var(--ok)",
    fontFamily: "var(--font-mono)",
    lineHeight: 1.8,
    wordBreak: "break-all",
  },
  sessionErr: {
    marginTop: 10,
    padding: "8px 12px",
    borderRadius: 6,
    background: "#1c0a0a",
    border: "1px solid var(--err)",
    fontSize: "0.75rem",
    color: "#fca5a5",
  },
};

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, hint }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", userSelect: "none" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10, flexShrink: 0, marginTop: 2,
          background: checked ? "var(--accent)" : "var(--border)",
          position: "relative", transition: "background .2s", cursor: "pointer",
        }}
      >
        <div style={{
          position: "absolute", top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
        }} />
      </div>
      <div>
        <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text)" }}>{label}</div>
        {hint && <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
      </div>
    </label>
  );
}

// ── Labelled input ────────────────────────────────────────────────────────────
function Field({ label, type = "text", placeholder, value, onChange, hint, style }) {
  return (
    <div>
      <label style={S.inputLabel}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...S.input, ...style }}
      />
      {hint && <p style={S.inputHint}>{hint}</p>}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  // ── Prefill state ─────────────────────────────────────────────────────────
  const [prefillEmail,     setPrefillEmail]     = useState("");
  const [memberId,         setMemberId]         = useState("");
  const [cardholderName,   setCardholderName]   = useState("");
  const [addressLine1,     setAddressLine1]      = useState("");
  const [addressLine2,     setAddressLine2]      = useState("");
  const [addressCity,      setAddressCity]       = useState("");
  const [addressState,     setAddressState]      = useState("");
  const [addressZip,       setAddressZip]        = useState("");
  const [addressCountry,   setAddressCountry]    = useState("US");
  const [prefillLoading,   setPrefillLoading]    = useState(true);

  // ── Email options ──────────────────────────────────────────────────────────
  const [disableEmail, setDisableEmail] = useState(false);
  const [hideEmail,    setHideEmail]    = useState(false);

  // ── Session state ──────────────────────────────────────────────────────────
  const [sessionId,      setSessionId]      = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError,   setSessionError]   = useState(null);

  // ── Theme sync ────────────────────────────────────────────────────────────
  // Watch data-theme on <html> so the embed re-theming follows the toggle.
  const [appTheme, setAppTheme] = useState("dark");
  useEffect(() => {
    const read = () =>
      document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setAppTheme(read());
    const observer = new MutationObserver(() => setAppTheme(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const router    = useRouter();
  const isSandbox = ENV === "sandbox";

  const selected   = PLANS.find((p) => p.id === selectedPlan);
  const missingIds = PLANS.filter((p) => !p.planId || p.planId === "plan_xxxxxxxxxx");

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/checkout/complete`
      : "/checkout/complete";

  // ── Auto-populate from .env on mount ──────────────────────────────────────
  useEffect(() => {
    fetch("/api/checkout/prefill")
      .then((r) => r.json())
      .then((d) => {
        if (d.email)          setPrefillEmail(d.email);
        if (d.memberId)       setMemberId(d.memberId);
        if (d.cardholderName) setCardholderName(d.cardholderName);
        if (d.addressLine1)   setAddressLine1(d.addressLine1);
        if (d.addressLine2)   setAddressLine2(d.addressLine2);
        if (d.addressCity)    setAddressCity(d.addressCity);
        if (d.addressState)   setAddressState(d.addressState);
        if (d.addressZip)     setAddressZip(d.addressZip);
        if (d.addressCountry) setAddressCountry(d.addressCountry);
      })
      .catch(() => {/* silently ignore — fields just start empty */})
      .finally(() => setPrefillLoading(false));
  }, []);

  // Clear session when plan changes
  useEffect(() => {
    setSessionId(null);
    setSessionError(null);
  }, [selectedPlan]);

  // ── Create Checkout Configuration session ─────────────────────────────────
  const createSession = useCallback(async () => {
    if (!selected?.planId || !memberId.trim()) return;
    setSessionLoading(true);
    setSessionError(null);
    setSessionId(null);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId:   selected.planId,
          memberId: memberId.trim(),
          // Pass billing info into metadata so it flows through webhooks
          metadata: {
            internal_member_id: memberId.trim(),
            ...(cardholderName ? { cardholder_name: cardholderName } : {}),
            ...(addressLine1   ? { address_line1:   addressLine1   } : {}),
            ...(addressCity    ? { address_city:    addressCity    } : {}),
            ...(addressState   ? { address_state:   addressState   } : {}),
            ...(addressZip     ? { address_zip:     addressZip     } : {}),
            ...(addressCountry ? { address_country: addressCountry } : {}),
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSessionId(data.sessionId);
    } catch (e) {
      setSessionError(e.message);
    } finally {
      setSessionLoading(false);
    }
  }, [selected?.planId, memberId, cardholderName, addressLine1, addressCity, addressState, addressZip, addressCountry]);

  // Embed key forces remount when config changes (include address + theme so
  // the embed re-seeds / re-themes when any field or the toggle changes)
  const embedKey = sessionId
    ? `session-${sessionId}-${prefillEmail}-${disableEmail}-${hideEmail}-${appTheme}`
    : [
        selected?.planId,
        prefillEmail,
        cardholderName,
        addressLine1,
        addressLine2,
        addressCity,
        addressState,
        addressZip,
        addressCountry,
        disableEmail,
        hideEmail,
        appTheme,
      ].join("|");

  // Build prefill object for the embed.
  // WhopEmbeddedCheckoutPrefillOptions: { email?, address?, shippingAddress? }
  // WhopCheckoutAddress: { name, line1, line2?, city, state, postalCode, country }
  const addressPrefill = {};
  if (cardholderName) addressPrefill.name        = cardholderName;
  if (addressLine1)   addressPrefill.line1        = addressLine1;
  if (addressLine2)   addressPrefill.line2        = addressLine2;
  if (addressCity)    addressPrefill.city         = addressCity;
  if (addressState)   addressPrefill.state        = addressState;
  if (addressZip)     addressPrefill.postalCode   = addressZip;
  if (addressCountry) addressPrefill.country      = addressCountry;

  const embedPrefill = {
    ...(prefillEmail                      ? { email:   prefillEmail }   : {}),
    ...(Object.keys(addressPrefill).length ? { address: addressPrefill } : {}),
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <Link href="/" style={S.backLink}>← Dashboard</Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <h1 style={S.h1}>Embedded Checkout Tester</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {prefillLoading && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
              Loading test data…
            </span>
          )}
          <span style={S.envBadge(isSandbox)}>
            {isSandbox ? "⚠️ Sandbox" : "✓ Production"}
          </span>
        </div>
      </header>

      <div style={S.body}>
        {/* ── Left panel ── */}
        <div style={S.leftPanel}>

          {/* Plan picker */}
          <div style={S.sectionTitle}>Select a Plan</div>

          {missingIds.length > 0 && (
            <div style={S.missingEnvBox}>
              <strong>Missing plan IDs:</strong> Set{" "}
              {missingIds.map((p) => `NEXT_PUBLIC_PLAN_${p.id.toUpperCase()}`).join(", ")}{" "}
              in <code>.env.development.local</code>.
            </div>
          )}

          <div style={S.planGrid}>
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const hasBadge   = !!plan.badge;
              const badgeColor = plan.badge === "Most Popular" ? "popular" : "best";
              const hasPlanId  = plan.planId && plan.planId !== "plan_xxxxxxxxxx";
              return (
                <div
                  key={plan.id}
                  style={{ ...S.planCard(isSelected), paddingTop: hasBadge ? 22 : 16 }}
                  onClick={() => hasPlanId && setSelectedPlan(plan.id)}
                >
                  {hasBadge && <span style={S.planBadge(badgeColor)}>{plan.badge}</span>}
                  <div style={S.planTokens}>{plan.tokens.toLocaleString()}</div>
                  <div style={S.planUnit}>tokens</div>
                  <div style={S.planPrice}>{plan.price}</div>
                  <div style={S.planLabel}>{plan.label}</div>
                  {!hasPlanId && <div style={S.missingId}>⚠ Plan ID not set</div>}
                </div>
              );
            })}
          </div>

          {/* ── Customer Info ── */}
          <div style={S.configBox}>
            <div style={S.configTitle}>
              Customer Info
              <span style={S.envTag}>auto-filled from .env</span>
            </div>

            <Field
              label="Email"
              type="email"
              placeholder="customer@example.com"
              value={prefillEmail}
              onChange={setPrefillEmail}
              hint="Pre-populates the email field in the checkout embed."
            />

            <Field
              label="Cardholder Name"
              placeholder="John Doe"
              value={cardholderName}
              onChange={setCardholderName}
              hint="Passed to the embed prefill and captured in checkout session metadata."
            />
          </div>

          {/* ── Billing Address ── */}
          <div style={S.configBox}>
            <div style={S.configTitle}>
              Billing Address
              <span style={S.envTag}>auto-filled from .env</span>
            </div>

            <Field
              label="Address Line 1"
              placeholder="123 Main Street"
              value={addressLine1}
              onChange={setAddressLine1}
            />
            <Field
              label="Address Line 2"
              placeholder="Suite 100 (optional)"
              value={addressLine2}
              onChange={setAddressLine2}
            />

            <div style={{ ...S.inputRow, gridTemplateColumns: "1fr 80px" }}>
              <Field
                label="City"
                placeholder="Los Angeles"
                value={addressCity}
                onChange={setAddressCity}
              />
              <Field
                label="State"
                placeholder="CA"
                value={addressState}
                onChange={setAddressState}
              />
            </div>

            <div style={{ ...S.inputRow, gridTemplateColumns: "1fr 1fr" }}>
              <Field
                label="ZIP / Postal Code"
                placeholder="90024"
                value={addressZip}
                onChange={setAddressZip}
              />
              <Field
                label="Country"
                placeholder="US"
                value={addressCountry}
                onChange={setAddressCountry}
              />
            </div>
          </div>

          {/* ── Member ID / Checkout Configuration ── */}
          <div style={S.configBox}>
            <div style={S.configTitle}>
              Internal Member ID
              <span style={S.envTag}>TEST_MEMBERSHIP_ID</span>
            </div>

            <Field
              label="Member ID"
              placeholder="mem_xxxxxxxxxx or your internal ID"
              value={memberId}
              onChange={(v) => { setMemberId(v); setSessionId(null); setSessionError(null); }}
              hint="Attaches metadata.internal_member_id to the checkout session so it flows through to webhooks and the payment record."
            />

            <button
              style={S.createBtn(sessionLoading || !selected || !memberId.trim())}
              disabled={sessionLoading || !selected || !memberId.trim()}
              onClick={createSession}
            >
              {sessionLoading ? "Creating session…" : "Create Session"}
            </button>

            {sessionId && (
              <div style={S.sessionOk}>
                <div>✓ Session created</div>
                <div>sessionId = &quot;{sessionId}&quot;</div>
                <div style={{ marginTop: 4, fontSize: "0.68rem", color: "var(--text-dim)" }}>
                  Embed uses this session — cardholder name, address, and member ID are attached as metadata.
                </div>
              </div>
            )}
            {sessionError && (
              <div style={S.sessionErr}>✗ {sessionError}</div>
            )}
          </div>

          {/* ── Email Options ── */}
          <div style={S.configBox}>
            <div style={S.configTitle}>Email Options</div>

            <Toggle
              checked={disableEmail}
              onChange={(val) => { setDisableEmail(val); if (val) setHideEmail(false); }}
              label="disableEmail"
              hint="Makes the email field read-only — visible but cannot be changed by the customer."
            />
            <div style={{ margin: "10px 0", borderTop: "1px solid var(--border)" }} />
            <Toggle
              checked={hideEmail}
              onChange={(val) => { setHideEmail(val); if (val) setDisableEmail(false); }}
              label="hideEmail"
              hint="Completely hides the email field. Requires a prefill email so checkout can still submit."
            />

            {(disableEmail || hideEmail) && !prefillEmail && (
              <div style={{
                marginTop: 10, padding: "8px 12px", borderRadius: 6,
                background: "#1c1505", border: "1px solid #92400e",
                fontSize: "0.75rem", color: "#fde68a",
              }}>
                ⚠ Set an email above — {hideEmail ? "hiding" : "disabling"} without a value leaves it blank and {hideEmail ? "hidden" : "locked"}.
              </div>
            )}
          </div>

          {/* Token usage table */}
          <div style={{ marginTop: 24, marginBottom: 12 }}>
            <div style={{ ...S.sectionTitle, marginBottom: 10 }}>What can you do with tokens?</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "7px 0", textAlign: "left",   color: "var(--text-dim)", fontWeight: 500 }}>Action</th>
                  <th style={{ padding: "7px 0", textAlign: "center", color: "var(--text-dim)", fontWeight: 500 }}>Men</th>
                  <th style={{ padding: "7px 0", textAlign: "center", color: "var(--text-dim)", fontWeight: 500 }}>Women</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Browse 25 profiles",     "Free",                  "Free"],
                  ["Browse all profiles",    "100 tokens / 7-day",   "0 tokens / unlimited"],
                  ["Send a message",         "2 tokens",              "0 tokens"],
                  ["Send a photo",           "2 tokens",              "0 tokens"],
                  ["ID verification",        "300 tokens",            "300 tokens"],
                ].map(([action, men, women], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "9px 0" }}>{action}</td>
                    <td style={{ padding: "9px 0", textAlign: "center", color: men === "Free" ? "var(--ok)" : "var(--text-dim)" }}>{men}</td>
                    <td style={{ padding: "9px 0", textAlign: "center", color: women === "Free" ? "var(--ok)" : "var(--text-dim)" }}>{women}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: 8, fontSize: "0.7rem", color: "var(--text-dim)" }}>
              Women browse and message free during the launch period.
            </p>
          </div>
        </div>

        {/* ── Right panel — checkout embed ── */}
        <div style={S.rightPanel}>
          {!selected ? (
            <div style={S.emptyState}>
              <span style={{ fontSize: "2.5rem" }}>💳</span>
              <p style={{ fontSize: "0.9rem" }}>Select a plan on the left to open the checkout.</p>
            </div>
          ) : (
            <>
              <div style={S.checkoutHeader}>
                <div>Checkout — <strong>{selected.label}</strong> ({selected.price})</div>
                <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {sessionId && (
                    <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: 999, background: "#0d1a0d", border: "1px solid var(--ok)", color: "var(--ok)" }}>
                      session: {sessionId}
                    </span>
                  )}
                  {memberId && !sessionId && (
                    <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: 999, background: "#1c1505", border: "1px solid #d97706", color: "#fde68a" }}>
                      member ID set — click Create Session
                    </span>
                  )}
                  {prefillEmail && (
                    <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: 999, background: "#1c1727", border: "1px solid var(--accent)", color: "var(--accent)" }}>
                      email: {prefillEmail}
                    </span>
                  )}
                  {cardholderName && (
                    <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: 999, background: "#1c1727", border: "1px solid var(--accent)", color: "var(--accent)" }}>
                      name: {cardholderName}
                    </span>
                  )}
                  {disableEmail && (
                    <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: 999, background: "#0d1a0d", border: "1px solid var(--ok)", color: "var(--ok)" }}>
                      disableEmail
                    </span>
                  )}
                  {hideEmail && (
                    <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: 999, background: "#0d1a0d", border: "1px solid var(--ok)", color: "var(--ok)" }}>
                      hideEmail
                    </span>
                  )}
                </div>
              </div>

              <WhopCheckoutEmbed
                key={embedKey}
                {...(sessionId ? { sessionId } : { planId: selected.planId })}
                environment={ENV}
                returnUrl={returnUrl}
                theme={appTheme}
                themeOptions={{
                  backgroundColor: appTheme === "light" ? "#f4f6fb" : "#0f0f13",
                }}
                prefill={Object.keys(embedPrefill).length ? embedPrefill : undefined}
                disableEmail={disableEmail}
                hideEmail={hideEmail}
                onComplete={(planId, receiptId) => {
                  const params = new URLSearchParams({
                    status: "success",
                    ...(planId    ? { plan_id:    planId    } : {}),
                    ...(receiptId ? { receipt_id: receiptId } : {}),
                    ...(memberId  ? { member_id:  memberId  } : {}),
                  });
                  router.push(`/checkout/complete?${params.toString()}`);
                }}
                styles={{ container: { paddingX: 28, paddingY: 20 } }}
                fallback={
                  <div style={{ padding: 40, color: "var(--text-dim)", textAlign: "center" }}>
                    Loading checkout…
                  </div>
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
