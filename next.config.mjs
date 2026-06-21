/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the Whop SDK (which uses Node built-ins) to run in route handlers
  serverExternalPackages: ["@whop/sdk"],
};

export default nextConfig;
