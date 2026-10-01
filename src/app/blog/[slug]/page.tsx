import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import DownloadPostPdf from "@/components/DownloadPostPdf";
import JsonLd from "@/components/JsonLd";
import { getAllPosts, getPost, getRelatedPosts } from "@/lib/blog";
import { splitAtMiddleSection } from "@/lib/article-split";
import { SITE } from "@/lib/site";
import { TOOLS, getTool } from "@/lib/tools";

export const dynamicParams = false;

/** Posts shorter than this get one ad, after the article; longer ones get a second, mid-article. */
const MID_ARTICLE_AD_MIN_MINUTES = 6;


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
    // `seoTitle` keeps the <title> under Google's truncation width; the full
    // editorial `title` stays the H1, the OG title and the BlogPosting headline.
    title: post.seoTitle ?? post.title,
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
  // The tools this guide is written for, from the registry; the two core
  // converters when no tool cites it.
  const citing = TOOLS.filter((t) => t.guides.includes(slug)).slice(0, 4);
  const ctaTools = citing.length ? citing : [getTool("pdf-to-markdown")!, getTool("markdown-to-pdf")!];
  const halves = post.readingMinutes >= MID_ARTICLE_AD_MIN_MINUTES ? splitAtMiddleSection(post.html) : null;
  const prose = "prose prose-neutral max-w-none prose-a:text-indigo-600";
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
            ? { "@type": "Person", "@id": `${SITE.url}/about#author`, name: post.author, url: `${SITE.url}/about` }
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
      <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-4xl">
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
      {halves ? (
        <>
          <div className={`${prose} mt-8`} dangerouslySetInnerHTML={{ __html: halves[0] }} />
          <AdSlot placement="article" />
          <div className={prose} dangerouslySetInnerHTML={{ __html: halves[1] }} />
        </>
      ) : (
        <div className={`${prose} mt-8`} dangerouslySetInnerHTML={{ __html: post.html }} />
      )}
      {post.downloadPdf && (
        <DownloadPostPdf markdown={post.body} title={post.title} filename={post.slug} />
      )}
      <aside className="mt-12 rounded-xl border border-indigo-100 bg-indigo-50 p-6">
        <p className="font-semibold text-neutral-900">Try it yourself</p>
        <p className="mt-1 text-neutral-600">
          Free, and your files stay in your browser:{" "}
          {ctaTools.map((t, i) => (
            <span key={t.slug}>
              {i > 0 && " · "}
              <Link href={t.path} className="font-medium text-indigo-600 hover:underline">
                {t.name}
              </Link>
            </span>
          ))}
        </p>
      </aside>

      <AdSlot placement="article" />

      {related.length > 0 && (
        <section className="mt-12 border-t border-neutral-200 pt-8">
          <h2 className="text-xl font-extrabold tracking-[-0.03em] text-neutral-900">
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
