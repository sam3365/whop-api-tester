import { whop, COMPANY_ID, createLogger } from "../whop-client.js";

export async function run(emit = null) {
  const log = createLogger(emit);
  log.info("Starting memberships tests…");

  try {
    const memberships = await whop.memberships.list({ company_id: COMPANY_ID });
    const count = memberships.data?.length ?? 0;
    log.ok(`Memberships list retrieved (${count} results)`, memberships.data?.slice(0, 3) ?? []);

    const firstId = memberships.data?.[0]?.id;
    if (firstId) {
      const detail = await whop.memberships.retrieve(firstId);
      log.ok("Retrieved first membership detail", detail);
    } else {
      log.info("No memberships found to retrieve detail for");
    }
  } catch (err) {
    log.error("Memberships test failed", { message: err.message });
  }

  const membershipId = process.env.TEST_MEMBERSHIP_ID;
  if (membershipId) {
    try {
      const membership = await whop.memberships.retrieve(membershipId);
      log.ok("Retrieved specific membership", membership);
    } catch (err) {
      log.error(`Retrieve membership ${membershipId} failed`, { message: err.message });
    }
  }
}
