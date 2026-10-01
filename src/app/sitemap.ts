import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";
import { TOOLS, liveCategories } from "@/lib/tools";
import { USE_CASES } from "@/lib/use-cases";

// Every entry is a canonical, indexable URL with a lastmod that only moves when
// that page's own content changed (Tool.updated / Category.updated in
// src/lib/tools.ts, `updated` in blog frontmatter). Re-stamping every URL on each
// deploy teaches Google that our lastmod carries no information.
//
// /about, /contact, /privacy-policy, /terms and /how-it-works are deliberately
// absent: measured 2026-08-21, Googlebot was spending a starved crawl budget
// re-crawling legal pages while product pages had never been fetched. They are
// linked from the footer on every page, so they stay discoverable and indexable.
//
// One file is enough: split sitemaps only pay off in the thousands of URLs.

const url = (path: string) => `${SITE.url}${path === "/" ? "" : path}`;
const max = (a: string, b: string) => (a > b ? a : b);

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const latestPost = posts.reduce((m, p) => max(m, p.updated), "");

  const tools: MetadataRoute.Sitemap = TOOLS.map((t) => ({
    url: url(t.path),
    // The homepage hosts the PDF → Markdown tool AND lists the latest guides.
    lastModified: t.path === "/" ? max(t.updated, latestPost) : t.updated,
    changeFrequency: t.path === "/" ? "weekly" : "monthly",
    priority: t.path === "/" ? 1 : 0.9,
  }));

  const hubs: MetadataRoute.Sitemap = liveCategories().map((c) => ({
    url: url(c.path),
    lastModified: c.updated,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const blog: MetadataRoute.Sitemap = [
    { url: url("/blog"), lastModified: latestPost, changeFrequency: "weekly", priority: 0.7 },
    ...posts.map((post) => ({
      url: url(`/blog/${post.slug}`),
      lastModified: post.updated,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  // Product pages: examples run live on real documents, the comparison, and one
  // page per profession. Dates move only when their own content changes.
  const product: MetadataRoute.Sitemap = [
    { url: url("/examples"), lastModified: "2026-10-01", changeFrequency: "monthly", priority: 0.8 },
    { url: url("/compare"), lastModified: "2026-10-01", changeFrequency: "monthly", priority: 0.7 },
    { url: url("/use-cases"), lastModified: "2026-10-01", changeFrequency: "monthly", priority: 0.6 },
    ...USE_CASES.map((u) => ({
      url: url(`/use-cases/${u.slug}`),
      lastModified: u.updated,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [...tools, ...hubs, ...product, ...blog];
}
