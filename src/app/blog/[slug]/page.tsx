import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { getAllPosts, getPost } from "@/lib/blog";
import { SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.url}/blog` },
            { "@type": "ListItem", position: 3, name: post.title },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: { "@type": "Organization", name: SITE.name, url: SITE.url },
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
          mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
        }}
      />
      <nav className="text-sm text-neutral-500" aria-label="Breadcrumb">
        <Link href="/blog" className="hover:text-neutral-900">
          ← All articles
        </Link>
      </nav>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        {post.title}
      </h1>
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
      <div
        className="prose prose-neutral mt-8 max-w-none prose-a:text-indigo-600"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
      <aside className="mt-12 rounded-xl border border-indigo-100 bg-indigo-50 p-6">
        <p className="font-semibold text-neutral-900">Try it yourself</p>
        <p className="mt-1 text-neutral-600">
          Convert files free and privately in your browser:{" "}
          <Link href="/pdf-to-markdown" className="font-medium text-indigo-600 hover:underline">
            PDF to Markdown
          </Link>{" "}
          ·{" "}
          <Link href="/markdown-to-pdf" className="font-medium text-indigo-600 hover:underline">
            Markdown to PDF
          </Link>
        </p>
      </aside>
    </article>
  );
}
