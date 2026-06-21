/**
 * GET /api/checkout/prefill
 *
 * Returns test-mode prefill values sourced from server-side .env variables.
 * This keeps TEST_MEMBERSHIP_ID and other non-NEXT_PUBLIC_ vars off the client
 * while still making them available to the checkout page at runtime.
 *
 * NOTE: Next.js reads env files only at server startup.
 * If you update .env.local, restart the dev server (Ctrl+C → npm run dev)
 * for the new values to take effect here.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    email:          process.env.TEST_USER_EMAIL          ?? "",
    memberId:       process.env.TEST_MEMBERSHIP_ID       ?? "",
    cardholderName: process.env.TEST_CARDHOLDER_NAME     ?? "",
    addressLine1:   process.env.TEST_ADDRESS_LINE1       ?? "",
    addressLine2:   process.env.TEST_ADDRESS_LINE2       ?? "",
    addressCity:    process.env.TEST_ADDRESS_CITY        ?? "",
    addressState:   process.env.TEST_ADDRESS_STATE       ?? "",
    addressZip:     process.env.TEST_ADDRESS_ZIP         ?? "",
    addressCountry: process.env.TEST_ADDRESS_COUNTRY     ?? "US",
    // Include source file hint so you can verify which values loaded
    _loaded: new Date().toISOString(),
  });
}
