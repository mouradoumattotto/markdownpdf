import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getAllPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  // Short enough that the " | MarkdownPDF" suffix survives truncation (43 chars
  // total). The longer, more descriptive wording stays on the Open Graph card,
  // which is not width-constrained.
  title: "Guides on PDF, Markdown & OCR",
  description:
    "Practical guides on Markdown syntax, PDF conversion, OCR, and document workflows from the MarkdownPDF team.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "Blog — Guides on PDF, Markdown & Document Conversion",
    description:
      "Practical guides on Markdown syntax, PDF conversion, OCR, and document workflows from the MarkdownPDF team.",
    url: "/blog",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "@id": `${SITE.url}/blog#blog`,
          name: "MarkdownPDF Blog",
          url: `${SITE.url}/blog`,
          inLanguage: "en",
          publisher: { "@id": `${SITE.url}/#organization` },
          blogPost: posts.map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            url: `${SITE.url}/blog/${post.slug}`,
            mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE.url}/blog/${post.slug}` },
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.url}/blog` },
          ],
        }}
      />
      <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-4xl">Blog</h1>
      <p className="mt-3 max-w-2xl text-neutral-600">
        Practical guides on Markdown, PDF, OCR, and document conversion workflows.
      </p>
      <div className="mt-10 space-y-8">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-xl border border-neutral-200 p-6 transition hover:border-indigo-300 hover:shadow-sm"
          >
            <h2 className="text-xl font-semibold text-neutral-900">
              <Link href={`/blog/${post.slug}`} className="hover:text-indigo-600">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-neutral-600">{post.description}</p>
            <p className="mt-3 text-sm text-neutral-500">
              <time dateTime={post.date}>
                {new Date(post.date + "T00:00:00Z").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </time>{" "}
              · {post.readingMinutes} min read
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
