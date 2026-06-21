"use client";

import Link from "next/link";

const CODE = {
  install:    `# macOS (Homebrew)\nbrew install ngrok\n\n# Or download directly:\n# https://ngrok.com/download`,
  auth:       `ngrok config add-authtoken <YOUR_NGROK_TOKEN>`,
  tunnel:     `ngrok http 3000`,
  tunnelOut:  `Session Status                online\nAccount                       you@example.com\nForwarding                    https://a1b2c3d4.ngrok-free.app -> http://localhost:3000\n\n# Your webhook URL:\nhttps://a1b2c3d4.ngrok-free.app/api/webhooks/whop`,
  env:        `# .env.development.local\nWHOP_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx`,
  staticDomain: `# If you have an ngrok paid plan, use a static domain:\nngrok http --domain=your-static-domain.ngrok-free.app 3000`,
};

function CodeBlock({ code, label }) {
  const copy = () => navigator.clipboard.writeText(code);
  return (
    <div style={{ position: "relative", marginTop: 10, marginBottom: 18 }}>
      {label && (
        <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginBottom: 4, letterSpacing: ".04em" }}>
          {label}
        </div>
      )}
      <pre style={{
        margin: 0, padding: "14px 16px",
        background: "#0a0a0f", border: "1px solid var(--border)",
        borderRadius: 8, overflowX: "auto",
        fontFamily: "var(--font-mono)", fontSize: "0.8rem",
        color: "#c4b5fd", lineHeight: 1.7,
      }}>
        {code}
      </pre>
      <button
        onClick={copy}
        style={{
          position: "absolute", top: label ? 24 : 8, right: 8,
          background: "var(--surface2)", border: "1px solid var(--border)",
          color: "var(--text-dim)", fontSize: "0.68rem", padding: "3px 8px",
          borderRadius: 4, cursor: "pointer",
        }}
      >
        Copy
      </button>
    </div>
  );
}

function Step({ num, title, children }) {
  return (
    <div style={{ display: "flex", gap: 20, marginBottom: 36 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: "var(--accent)", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: "1rem", marginTop: 2,
      }}>
        {num}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 10, color: "var(--text)" }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

function Note({ children }) {
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 6,
      background: "#0d1a0d", border: "1px solid #16a34a",
      fontSize: "0.82rem", color: "#86efac", lineHeight: 1.6,
      marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

function Warn({ children }) {
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 6,
      background: "#1c1505", border: "1px solid #d97706",
      fontSize: "0.82rem", color: "#fde68a", lineHeight: 1.6,
      marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

export default function NgrokPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      color: "var(--text)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 28px", borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/webhooks" style={{ color: "var(--text-dim)", textDecoration: "none", fontSize: "0.85rem" }}>
            ← Webhook Events
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>🚇 ngrok Setup Guide</h1>
        </div>
        <Link href="/" style={{
          fontSize: "0.8rem", color: "var(--text-dim)", textDecoration: "none",
          padding: "5px 12px", border: "1px solid var(--border)",
          borderRadius: 6, background: "var(--surface2)",
        }}>
          Dashboard
        </Link>
      </header>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 28px 80px" }}>
        {/* Intro */}
        <div style={{
          padding: "20px 24px", marginBottom: 36,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", lineHeight: 1.7,
        }}>
          <p style={{ fontSize: "0.92rem", color: "var(--text)", marginBottom: 8 }}>
            <strong>Why ngrok?</strong> &nbsp;Whop sends webhook events via HTTPS POST to a public URL.
            Your local dev server (<code>localhost:3000</code>) is not reachable from the internet.
            ngrok creates a secure tunnel so Whop can reach your local handler at
            <code style={{ marginLeft: 6, color: "var(--ok)" }}>/api/webhooks/whop</code>.
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--text-dim)", margin: 0 }}>
            Cloudflare Tunnel (<code>cloudflared tunnel --url http://localhost:3000</code>) is a
            free alternative with no rate limits if you prefer it.
          </p>
        </div>

        <Step num="1" title="Install ngrok">
          <p style={{ color: "var(--text-dim)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 10 }}>
            Download ngrok from <a href="https://ngrok.com/download" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>ngrok.com/download</a> or install via Homebrew.
          </p>
          <CodeBlock code={CODE.install} />
        </Step>

        <Step num="2" title="Create a free ngrok account and add your auth token">
          <p style={{ color: "var(--text-dim)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 10 }}>
            Sign up at <a href="https://dashboard.ngrok.com" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>dashboard.ngrok.com</a>.
            Copy your <strong>Authtoken</strong> from the dashboard and run:
          </p>
          <CodeBlock code={CODE.auth} label="Replace <YOUR_NGROK_TOKEN> with your actual token" />
          <Note>The authtoken only needs to be run once — ngrok saves it to ~/.ngrok2/ngrok.yml</Note>
        </Step>

        <Step num="3" title="Start your Next.js dev server">
          <p style={{ color: "var(--text-dim)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 10 }}>
            In one terminal window, start the app:
          </p>
          <CodeBlock code="cd whop-api-tester\nnpm run dev" />
          <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
            The server runs at <code>http://localhost:3000</code>.
          </p>
        </Step>

        <Step num="4" title="Open the ngrok tunnel">
          <p style={{ color: "var(--text-dim)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 10 }}>
            In a <strong>second</strong> terminal window, run:
          </p>
          <CodeBlock code={CODE.tunnel} />
          <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginBottom: 10 }}>
            ngrok will print your public URL:
          </p>
          <CodeBlock code={CODE.tunnelOut} />
          <Note>
            🔑 &nbsp;Your webhook endpoint is: <strong>https://&lt;your-id&gt;.ngrok-free.app/api/webhooks/whop</strong><br />
            Copy this URL — you will paste it into the Whop Dashboard in the next step.
          </Note>
          <Warn>
            ⚠️ &nbsp;The free ngrok URL changes every time you restart ngrok. You&apos;ll need to update the Whop Dashboard URL each session.
            Consider a paid ngrok plan or Cloudflare Tunnel for a static URL.
          </Warn>
          <CodeBlock code={CODE.staticDomain} label="Optional: static domain (paid ngrok plan)" />
        </Step>

        <Step num="5" title="Register the webhook in the Whop Dashboard">
          <ol style={{ color: "var(--text-dim)", fontSize: "0.88rem", lineHeight: 2, paddingLeft: 20, margin: 0 }}>
            <li>Open <a href="https://whop.com/dashboard/developer" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>whop.com/dashboard/developer</a> (the base developer tab, <em>not</em> your app dashboard).</li>
            <li>Click <strong>"Create Webhook"</strong> in the top right corner.</li>
            <li>Paste your ngrok URL: <code style={{ color: "var(--ok)" }}>https://&lt;your-id&gt;.ngrok-free.app/api/webhooks/whop</code></li>
            <li>Select the events you want to receive. Recommended for payment testing:
              <ul style={{ marginTop: 4 }}>
                <li><code>payment.succeeded</code></li>
                <li><code>payment.failed</code></li>
                <li><code>membership.activated</code></li>
                <li><code>membership.deactivated</code></li>
              </ul>
            </li>
            <li>Ensure <strong>API version</strong> is set to <strong>v1</strong>.</li>
            <li>Click <strong>Save</strong>. Copy the <strong>Webhook Secret</strong> shown after creation.</li>
          </ol>
        </Step>

        <Step num="6" title="Add your webhook secret to .env.development.local">
          <p style={{ color: "var(--text-dim)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 10 }}>
            Open your <code>.env.development.local</code> file and set:
          </p>
          <CodeBlock code={CODE.env} />
          <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
            Then restart <code>npm run dev</code>. The Whop SDK will now verify all incoming webhook signatures.
          </p>
          <Note>
            ✓ &nbsp;Verification uses the Standard Webhooks spec via the Whop SDK&apos;s
            <code style={{ marginLeft: 4 }}>webhooks.unwrap()</code> method.
            Any tampered or replayed request will be rejected with HTTP 400.
          </Note>
        </Step>

        <Step num="7" title="Test it — trigger a payment and watch the event appear">
          <ol style={{ color: "var(--text-dim)", fontSize: "0.88rem", lineHeight: 2, paddingLeft: 20, margin: 0 }}>
            <li>Go to <Link href="/checkout" style={{ color: "var(--accent)" }}>/checkout</Link> and complete a test purchase.</li>
            <li>Whop sends a <code>payment.succeeded</code> event to your ngrok URL.</li>
            <li>Switch to the <Link href="/webhooks" style={{ color: "var(--accent)" }}>Webhook Events</Link> page — the event appears in real-time.</li>
            <li>The event card shows payment ID, amount, email, <code>internal_member_id</code> (if set via Checkout Configuration), and the full raw payload.</li>
          </ol>
          <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
            <Link href="/checkout" style={{
              display: "inline-block", padding: "10px 20px",
              background: "var(--accent)", color: "#fff",
              borderRadius: 8, textDecoration: "none", fontSize: "0.85rem", fontWeight: 600,
            }}>
              💳 Open Checkout
            </Link>
            <Link href="/webhooks" style={{
              display: "inline-block", padding: "10px 20px",
              background: "var(--surface2)", color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 8, textDecoration: "none", fontSize: "0.85rem",
            }}>
              🔔 Watch Webhook Events
            </Link>
          </div>
        </Step>

        {/* Alternative: Cloudflare Tunnel */}
        <div style={{
          marginTop: 8, padding: "20px 24px",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Alternative: Cloudflare Tunnel (free, no rate limits)</div>
          <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: 12 }}>
            Install <a href="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>cloudflared</a> and run:
          </p>
          <CodeBlock code="cloudflared tunnel --url http://localhost:3000" />
          <p style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
            Cloudflare prints a <code>trycloudflare.com</code> URL. Use it the same way as the ngrok URL above.
            Cloudflare tunnels are free with no request limits, but also regenerate on each run (unless you use a named tunnel with a Cloudflare account).
          </p>
        </div>
      </div>
    </div>
  );
}
