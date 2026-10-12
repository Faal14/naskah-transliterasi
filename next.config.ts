import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const authUrl = process.env.NEXTAUTH_URL;

const nextConfig: NextConfig = {
  output: "standalone",
  basePath,
  // klien next-auth membaca NEXTAUTH_URL (lengkap dengan path /oase1/api/auth)
  env: authUrl ? { NEXTAUTH_URL: authUrl } : {},
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;
