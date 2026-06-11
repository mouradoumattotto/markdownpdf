import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/pdf-to-markdown`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/markdown-to-pdf`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE.url}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE.url}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const posts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...posts];
}
