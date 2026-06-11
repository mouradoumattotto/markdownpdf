import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow accessing the dev server through the VPS public IP.
  allowedDevOrigins: ["217.65.144.84"],
};

export default nextConfig;
