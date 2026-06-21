import { whop, COMPANY_ID, createLogger } from "../whop-client.js";

export async function run(emit = null) {
  const log = createLogger(emit);
  log.info("Starting transfers tests…");

  const destinationId = process.env.WHOP_DESTINATION_COMPANY_ID;
  if (!destinationId) {
    log.info("Skipping — set WHOP_DESTINATION_COMPANY_ID in .env.local.bak.local to enable transfer tests");
    return;
  }

  try {
    const transfer = await whop.transfers.create({
      amount: 1.0,
      currency: "usd",
      origin_id: COMPANY_ID,
      destination_id: destinationId,
      metadata: { reason: "test_payout", test: true },
    });
    log.ok("Transfer created", transfer);
  } catch (err) {
    log.error("Create transfer failed", { message: err.message });
  }
}
