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

      // Two near-duplicate pairs merged on 2026-09-17. Neither source URL was
      // ever indexed (URL Inspection API: /blog/markdown-vs-pdf "unknown to
      // Google", /blog/ocr-pdf-to-text-guide "discovered, not indexed"), and
      // with only 8 of 30 URLs indexed, spending crawl budget on two versions
      // of the same subject buys nothing. Their content was merged into the
      // surviving pages, not discarded.
      {
        source: "/blog/ocr-pdf-to-text-guide",
        destination: "/blog/extract-text-from-scanned-pdf",
        permanent: true,
      },
      {
        source: "/blog/markdown-vs-pdf",
        destination: "/blog/pdf-vs-word-vs-markdown",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
