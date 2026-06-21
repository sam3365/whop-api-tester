import { whop, COMPANY_ID, STOREFRONT_URL, createLogger } from "../whop-client.js";

export async function run(emit = null) {
  const log = createLogger(emit);
  log.info("Starting checkout tests…");

  // 1. One-time checkout
  try {
    const checkout = await whop.checkoutConfigurations.create({
      currency: "usd",
      plan: {
        initial_price: 5.0,
        plan_type: "one_time",
        company_id: COMPANY_ID,
        currency: "usd",
        payment_method_configuration: {
          enabled: ["apple_pay", "us_bank_transfer", "crypto"],
        },
      },
      metadata: { test_order_id: `test_${Date.now()}` },
    });
    log.ok("One-time checkout created", {
      plan_id: checkout.plan?.id,
      url: `${STOREFRONT_URL}/checkout/${checkout.plan?.id}`,
    });
  } catch (err) {
    log.error("Create one-time checkout failed", { message: err.message });
  }

  // 2. Recurring subscription
  try {
    const subscription = await whop.checkoutConfigurations.create({
      currency: "usd",
      plan: {
        initial_price: 9.99,
        plan_type: "recurring",
        billing_period: 30,
        company_id: COMPANY_ID,
        currency: "usd",
        payment_method_configuration: {
          enabled: ["apple_pay", "us_bank_transfer"],
        },
      },
      metadata: { test_subscription: "monthly_plan" },
    });
    log.ok("Recurring subscription checkout created", {
      plan_id: subscription.plan?.id,
      url: `${STOREFRONT_URL}/checkout/${subscription.plan?.id}`,
    });
  } catch (err) {
    log.error("Create subscription checkout failed", { message: err.message });
  }
}
