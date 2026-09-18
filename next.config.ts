import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const adsEnabled = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);

/**
 * Content-Security-Policy. The directive that matters for the privacy promise
 * is `connect-src`: it is the complete list of places this page is allowed to
 * send data to with fetch/XHR/WebSocket/beacon. Anyone can read it in the
 * response headers and check that no file-processing endpoint exists — the
 * only destinations are our own origin (static assets, no upload route) and
 * Google Analytics. The OCR engine is served from our own origin too, so no
 * third-party CDN is involved.
 *
 * Static rendering is kept, so inline scripts need 'unsafe-inline' (Next's
 * documented "without nonces" setup). 'wasm-unsafe-eval' lets the OCR engine
 * instantiate its WebAssembly core; it does not allow JavaScript eval.
 *
 * AdSense needs a much wider allowlist (ad iframes, Google's CMP, ad-quality
 * checks); it is only added when an AdSense client ID is configured, and must
 * be re-verified in the browser console the day ads are switched on.
 */
const GA = {
  script: ["https://www.googletagmanager.com"],
  connect: ["https://*.google-analytics.com", "https://*.analytics.google.com", "https://www.googletagmanager.com"],
  img: ["https://*.google-analytics.com", "https://www.googletagmanager.com"],
};
const ADS = {
  script: [
    "https://pagead2.googlesyndication.com",
    "https://*.googlesyndication.com",
    "https://*.google.com",
    "https://*.gstatic.com",
    "https://*.adtrafficquality.google",
    "https://fundingchoicesmessages.google.com",
  ],
  connect: [
    "https://*.googlesyndication.com",
    "https://*.doubleclick.net",
    "https://*.google.com",
    "https://*.adtrafficquality.google",
    "https://fundingchoicesmessages.google.com",
  ],
  frame: [
    "https://*.googlesyndication.com",
    "https://*.doubleclick.net",
    "https://*.google.com",
    "https://*.adtrafficquality.google",
  ],
};

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""} ${[...GA.script, ...(adsEnabled ? ADS.script : [])].join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  // Markdown can reference remote images (preview + PDF export); ads serve
  // images from many hosts. Images cannot carry a document out: connect-src does.
  `img-src 'self' data: blob: https:`,
  "font-src 'self' data:",
  `connect-src 'self' ${[...GA.connect, ...(adsEnabled ? ADS.connect : [])].join(" ")}`,
  "worker-src 'self' blob:",
  `frame-src ${adsEnabled ? ADS.frame.join(" ") : "'none'"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Only APIs no tool here will ever use. Ad-related features are left alone.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  // Allow accessing the dev server through the VPS public IP.
  allowedDevOrigins: ["217.65.144.84"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Versioned paths (/ocr/<tesseract version>/..., /pdfjs/<pdf.js version>/...,
        // /vendor/<lib>-<version>/...), so they never change in place and can be
        // cached for good.
        source: "/ocr/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/pdfjs/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/vendor/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
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
