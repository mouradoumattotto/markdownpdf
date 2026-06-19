import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const allPosts = getAllPosts();
  // Freshest content edit across the blog — used as the lastmod hint for hub pages.
  const latest = allPosts.reduce((max, p) => (p.updated > max ? p.updated : max), "");

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/pdf-to-markdown`, lastModified: latest, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/markdown-to-pdf`, lastModified: latest, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE.url}/about`, lastModified: latest, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE.url}/contact`, lastModified: latest, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/privacy-policy`, lastModified: latest, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/terms`, lastModified: latest, changeFrequency: "yearly", priority: 0.2 },
  ];

  const posts: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: post.updated,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...posts];
}
