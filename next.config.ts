import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow accessing the dev server through the VPS public IP.
  allowedDevOrigins: ["217.65.144.84"],
  async redirects() {
    return [
      // The PDF to Markdown converter lives on `/` since 2026-09-01. After three
      // months in the sitemap and in the header, /pdf-to-markdown was still
      // "URL is unknown to Google"; `/` is indexed. One URL, one signal.
      { source: "/pdf-to-markdown", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
