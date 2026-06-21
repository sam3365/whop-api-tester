import { whop, COMPANY_ID, createLogger } from "../whop-client.js";

export async function run(emit = null) {
  const log = createLogger(emit);
  log.info("Starting payments tests…");

  try {
    const payments = await whop.payments.list({ company_id: COMPANY_ID });
    const count = payments.data?.length ?? 0;
    log.ok(`Payments list retrieved (${count} results)`, payments.data?.slice(0, 3) ?? []);
  } catch (err) {
    log.error("List payments failed", { message: err.message });
  }

  const paymentId = process.env.TEST_PAYMENT_ID;
  if (paymentId) {
    try {
      const payment = await whop.payments.retrieve(paymentId);
      log.ok("Retrieved payment", payment);
    } catch (err) {
      log.error(`Retrieve payment ${paymentId} failed`, { message: err.message });
    }
  } else {
    log.info("Skipping single retrieval — set TEST_PAYMENT_ID in .env.local.bak.local to enable");
  }
}
