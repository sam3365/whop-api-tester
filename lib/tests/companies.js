import { whop, COMPANY_ID, createLogger } from "../whop-client.js";

export async function run(emit = null) {
  const log = createLogger(emit);
  log.info("Starting companies tests…");

  try {
    const company = await whop.companies.retrieve(COMPANY_ID);
    log.ok("Company retrieved", { id: company.id, title: company.title });
  } catch (err) {
    log.error("Retrieve company failed", { message: err.message });
  }

  try {
    const accountLink = await whop.accountLinks.create({
      company_id: COMPANY_ID,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/kyc/refresh`,
      return_url:  `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/kyc/complete`,
      use_case: "account_onboarding",
    });
    log.ok("KYC account link created", { url: accountLink.url });
  } catch (err) {
    log.error("Create account link failed", { message: err.message });
  }
}
