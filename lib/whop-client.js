import Whop from "@whop/sdk";

if (!process.env.WHOP_API_KEY) {
  throw new Error("WHOP_API_KEY is not set. Copy .env.local.example to .env.local.local and fill in your credentials.");
}

/**
 * Storefront base URL — used to build checkout links, KYC URLs, etc.
 * Switch between production and sandbox via WHOP_STOREFRONT_URL in .env.local.local.
 *
 * Production: https://whop.com         (default)
 * Sandbox:    https://sandbox.whop.com
 */
export const STOREFRONT_URL =
  (process.env.WHOP_STOREFRONT_URL ?? "https://whop.com").replace(/\/$/, "");

/**
 * Whop SDK client.
 * The SDK reads WHOP_BASE_URL automatically to target production or sandbox:
 *   Production: https://api.whop.com/api/v1        (default)
 *   Sandbox:    https://api.sandbox.whop.com/api/v1
 */
// webhookKey must be base64-encoded for the Standard Webhooks spec verification
const _webhookSecret = process.env.WHOP_WEBHOOK_SECRET ?? "";
const _webhookKey    = _webhookSecret
  ? Buffer.from(_webhookSecret).toString("base64")
  : "";

export const whop = new Whop({
  apiKey:  process.env.WHOP_API_KEY,
  ...(process.env.WHOP_BASE_URL ? { baseURL: process.env.WHOP_BASE_URL } : {}),
  ...(_webhookKey ? { webhookKey: _webhookKey } : {}),
});

export const COMPANY_ID = process.env.WHOP_COMPANY_ID;

/**
 * Returns a logger that calls emit(entry) and also console.logs.
 * @param {Function|null} emit  (entry: {level, message, data}) => void
 */
export function createLogger(emit = null) {
  const send = (level, message, data = null) => {
    const entry = { level, message, data, ts: Date.now() };
    if (emit) emit(entry);
    const icon = level === "ok" ? "✅" : level === "error" ? "❌" : "ℹ️ ";
    console.log(`${icon} [${level}] ${message}`, data ? JSON.stringify(data) : "");
  };
  return {
    ok:    (msg, data) => send("ok",    msg, data),
    error: (msg, data) => send("error", msg, data),
    info:  (msg, data) => send("info",  msg, data),
  };
}
