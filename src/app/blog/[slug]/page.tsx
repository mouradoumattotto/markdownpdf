import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DownloadPostPdf from "@/components/DownloadPostPdf";
import JsonLd from "@/components/JsonLd";
import { getAllPosts, getPost, getRelatedPosts } from "@/lib/blog";
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
      modifiedTime: post.updated,
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

  const related = getRelatedPosts(slug);
  const postUrl = `${SITE.url}/blog/${post.slug}`;

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
          dateModified: post.updated,
          image: [`${postUrl}/opengraph-image`],
          inLanguage: "en",
          author: post.author
            ? { "@type": "Person", name: post.author, url: `${SITE.url}/about` }
            : { "@type": "Organization", name: SITE.name, url: SITE.url },
          publisher: { "@id": `${SITE.url}/#organization` },
          mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
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
        {post.author && (
          <>
            By <span className="font-medium text-neutral-700">{post.author}</span> ·{" "}
          </>
        )}
        <time dateTime={post.updated}>
          {post.updated !== post.date ? "Updated " : ""}
          {new Date(post.updated + "T00:00:00Z").toLocaleDateString("en-US", {
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
      {post.downloadPdf && (
        <DownloadPostPdf markdown={post.body} title={post.title} filename={post.slug} />
      )}
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

      {related.length > 0 && (
        <section className="mt-12 border-t border-neutral-200 pt-8">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Related articles
          </h2>
          <ul className="mt-5 space-y-4">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/blog/${r.slug}`}
                  className="group block rounded-xl border border-neutral-200 p-4 transition hover:border-indigo-300 hover:shadow-sm"
                >
                  <span className="font-semibold text-neutral-900 group-hover:text-indigo-600">
                    {r.title}
                  </span>
                  <span className="mt-1 block text-sm text-neutral-600">{r.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
