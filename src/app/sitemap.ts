import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";

// Last date each standalone page's own content actually changed. Hand-maintained:
// bump the entry when you meaningfully edit that page. Do NOT derive these from
// the blog's freshest post — re-stamping every URL on each publish teaches Google
// that our lastmod carries no information, and it stops trusting the field.
const PAGE_MODIFIED: Record<string, string> = {
  "/pdf-to-markdown": "2026-06-19",
  "/markdown-to-pdf": "2026-06-19",
  "/about": "2026-06-11",
  "/contact": "2026-06-11",
  "/privacy-policy": "2026-06-11",
  "/terms": "2026-06-11",
};

export default function sitemap(): MetadataRoute.Sitemap {
  const allPosts = getAllPosts();
  // Freshest content edit across the blog. Only the hub pages (home, blog index)
  // genuinely change when a post ships — they render the post list.
  const latest = allPosts.reduce((max, p) => (p.updated > max ? p.updated : max), "");

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/pdf-to-markdown`, lastModified: PAGE_MODIFIED["/pdf-to-markdown"], changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/markdown-to-pdf`, lastModified: PAGE_MODIFIED["/markdown-to-pdf"], changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE.url}/about`, lastModified: PAGE_MODIFIED["/about"], changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE.url}/contact`, lastModified: PAGE_MODIFIED["/contact"], changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/privacy-policy`, lastModified: PAGE_MODIFIED["/privacy-policy"], changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/terms`, lastModified: PAGE_MODIFIED["/terms"], changeFrequency: "yearly", priority: 0.2 },
  ];

  const posts: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: post.updated,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...posts];
}
