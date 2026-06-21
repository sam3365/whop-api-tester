import { run as checkout }    from "./checkout.js";
import { run as payments }    from "./payments.js";
import { run as memberships } from "./memberships.js";
import { run as companies }   from "./companies.js";
import { run as transfers }   from "./transfers.js";

export const SUITES = [
  {
    id: "checkout",
    label: "Checkout",
    description: "Create one-time and recurring checkout configurations",
    run: checkout,
  },
  {
    id: "payments",
    label: "Payments",
    description: "List and retrieve payment records",
    run: payments,
  },
  {
    id: "memberships",
    label: "Memberships",
    description: "List and retrieve membership records",
    run: memberships,
  },
  {
    id: "companies",
    label: "Companies",
    description: "Retrieve company info and generate KYC links",
    run: companies,
  },
  {
    id: "transfers",
    label: "Transfers",
    description: "Create payout transfers (requires KYC + destination company)",
    run: transfers,
  },
];

export async function runAll(emit = null) {
  for (const suite of SUITES) {
    if (emit) emit({ level: "suite", message: suite.label });
    await suite.run(emit);
  }
}
