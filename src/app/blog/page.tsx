import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Guides on PDF, Markdown & Document Conversion",
  description:
    "Practical guides on Markdown syntax, PDF conversion, OCR, and document workflows from the MarkdownPDF team.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">Blog</h1>
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
