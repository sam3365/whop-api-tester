# Whop API Tester

Node.js test harness for the [Whop](https://whop.com) payment and account management APIs. Covers checkouts, payments, memberships, companies/sub-merchants, transfers, and inbound webhooks.

---

## Setup

```bash
cd whop-api-tester
npm install
cp .env.local.bak.example .env.local.bak
# Edit .env.local.bak with your credentials
```

Get your API key and company ID from:  
**https://whop.com/dashboard/developer/**

---

## Run the API tests

| Command | What it tests |
|---|---|
| `npm run test:all` | Read-only smoke test (company, payments, memberships) |
| `npm run test:checkout` | Create one-time and recurring checkout configs |
| `npm run test:payments` | List and retrieve payments |
| `npm run test:memberships` | List and retrieve memberships |
| `npm run test:companies` | Retrieve company, generate KYC link |
| `npm run test:transfers` | Create a payout transfer (requires KYC + `WHOP_DESTINATION_COMPANY_ID`) |

---

## Run the webhook server

```bash
npm start
# or for auto-reload during development:
npm run dev
```

The server starts on `http://localhost:3000` with these endpoints:

| Endpoint | Purpose |
|---|---|
| `POST /webhooks/whop` | Receives and verifies Whop webhook events |
| `GET /health` | Health check |
| `GET /kyc/refresh` | KYC flow refresh stub |
| `GET /kyc/complete` | KYC flow completion stub |

---

## Exposing webhooks to the internet

Whop needs a public HTTPS URL to deliver webhook events. Pick any of these tunneling tools — all are zero-install via `npx`:

### Option 1 — Cloudflare Tunnel (recommended, no account required)

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Cloudflare prints a public URL like `https://random-words.trycloudflare.com`.  
Use `https://random-words.trycloudflare.com/webhooks/whop` as your Whop webhook URL.

### Option 2 — ngrok (stable URL, free tier available)

```bash
# Install once
npm install -g ngrok

# Run
ngrok http 3000
```

ngrok prints `https://xxxx.ngrok-free.app`. Register that URL + `/webhooks/whop` in Whop.

### Option 3 — localtunnel (simplest, no account)

```bash
npx localtunnel --port 3000
```

Prints a URL like `https://xxxx.loca.lt`.

---

## Registering the webhook URL in Whop

1. Go to **https://whop.com/dashboard/developer/** → **Webhooks**
2. Click **Add endpoint**
3. Paste your tunnel URL + `/webhooks/whop`, e.g.:  
   `https://random-words.trycloudflare.com/webhooks/whop`
4. Select the events you want (payment.succeeded, membership.created, etc.)
5. Copy the **Signing Secret** and add it to `.env` as `WHOP_WEBHOOK_SECRET`

The server will verify the `X-Whop-Signature-256` header on every request and reject anything that doesn't match.

---

## Webhook events handled

| Event | Description |
|---|---|
| `payment.succeeded` | Payment completed successfully |
| `payment.failed` | Payment attempt failed |
| `membership.created` | New membership after purchase |
| `membership.updated` | Membership status changed |
| `membership.cancelled` | Membership cancelled |

Add more handlers in `src/webhooks/handler.js`.

---

## Project structure

```
whop-api-tester/
├── src/
│   ├── index.js              # Express server + webhook endpoint
│   ├── api/
│   │   ├── checkout.js       # Checkout configuration tests
│   │   ├── companies.js      # Company + KYC link tests
│   │   ├── memberships.js    # Membership tests
│   │   ├── payments.js       # Payments tests
│   │   ├── transfers.js      # Payout transfer tests
│   │   └── run-all.js        # Full smoke test
│   ├── webhooks/
│   │   └── handler.js        # Webhook signature verification + event routing
│   └── utils/
│       └── client.js         # Shared Whop SDK client + helpers
├── .env.example
├── package.json
└── README.md
```
