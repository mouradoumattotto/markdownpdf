import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";

// Last date each standalone page's own content actually changed. Hand-maintained:
// bump the entry when you meaningfully edit that page. Do NOT derive these from
// the blog's freshest post — re-stamping every URL on each publish teaches Google
// that our lastmod carries no information, and it stops trusting the field.
const PAGE_MODIFIED: Record<string, string> = {
  "/": "2026-09-17", // retargeted title/description, "PDF to MD" copy, 2 new FAQ entries
  "/markdown-to-pdf": "2026-09-17", // rebuilt: 672 -> ~1400 words, syntax support table, 5 new FAQ entries
};

// /pdf-to-markdown is gone (308 → `/`, see next.config.ts). /about, /contact,
// /privacy-policy and /terms are deliberately absent: measured 2026-08-21, only
// 12 of 35 sitemap URLs had ever been crawled, yet Googlebot spent August
// re-crawling /terms and /privacy-policy. They are linked from the footer, so
// they stay indexable and discoverable — we just refuse to spend a starved crawl
// budget advertising them.

export default function sitemap(): MetadataRoute.Sitemap {
  const allPosts = getAllPosts();
  // Freshest content edit across the blog. The hub pages (home, blog index)
  // genuinely change when a post ships — they render the post list.
  const latest = allPosts.reduce((max, p) => (p.updated > max ? p.updated : max), "");
  const homeModified = PAGE_MODIFIED["/"] > latest ? PAGE_MODIFIED["/"] : latest;

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: homeModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/markdown-to-pdf`, lastModified: PAGE_MODIFIED["/markdown-to-pdf"], changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.7 },
  ];

  const posts: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: post.updated,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...posts];
}
