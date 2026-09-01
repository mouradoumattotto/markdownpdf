import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Answer engines (ChatGPT search, Claude, Perplexity, Google AI Overviews) are a
// distribution channel for a tool like this one, so their crawlers are named
// explicitly rather than left to inherit the wildcard. Some of them only honour
// a rule addressed to them by name.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api" },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: "/api" },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
