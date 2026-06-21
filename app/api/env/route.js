export const dynamic = "force-dynamic";

export async function GET() {
  const storefrontUrl = (process.env.WHOP_STOREFRONT_URL ?? "https://whop.com").replace(/\/$/, "");
  const apiUrl        = process.env.WHOP_BASE_URL ?? "https://api.whop.com/api/v1";
  const isSandbox     = storefrontUrl.includes("sandbox") || apiUrl.includes("sandbox");

  return Response.json({
    storefrontUrl,
    apiUrl,
    isSandbox,
    label: isSandbox ? "Sandbox" : "Production",
  });
}
