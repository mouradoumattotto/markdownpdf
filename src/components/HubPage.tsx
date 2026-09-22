import type { ReactNode } from "react";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import JsonLd from "@/components/JsonLd";
import { BreadcrumbJsonLd, Breadcrumbs, ToolGrid } from "@/components/ToolSeo";
import { getPost } from "@/lib/blog";
import { SITE } from "@/lib/site";
import { getCategory, toolsIn, type CategoryId } from "@/lib/tools";

/**
 * Shared layout for a category hub. The grid, breadcrumbs and structured data
 * come from the registry; the headline, the lead and the "which tool do I need"
 * copy are written by hand on each hub page — a hub whose text is generated is
 * exactly the thin page this site avoids.
 */
export default function HubPage({
  category,
  heading,
  lead,
  children,
  guides = [],
}: {
  category: CategoryId;
  heading: string;
  lead: ReactNode;
  children?: ReactNode;
  /** Blog slugs to show under the grid. */
  guides?: string[];
}) {
  const cat = getCategory(category);
  const tools = toolsIn(category);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: cat.name, path: cat.path },
  ];
  const posts = guides.map(getPost).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <BreadcrumbJsonLd crumbs={crumbs} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: heading,
          itemListElement: tools.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: t.name,
            url: `${SITE.url}${t.path === "/" ? "" : t.path}`,
          })),
        }}
      />
      <Breadcrumbs crumbs={crumbs} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">{heading}</h1>
      <div className="mt-4 max-w-3xl text-lg leading-relaxed text-neutral-600">{lead}</div>

      <div className="mt-10">
        <ToolGrid tools={tools} />
      </div>

      <AdSlot placement="hub" minHeight={250} />

      {children && <div className="prose prose-neutral mt-4 max-w-3xl prose-a:text-indigo-600">{children}</div>}

      {posts.length > 0 && (
        <section className="mt-14" aria-labelledby="hub-guides">
          <h2 id="hub-guides" className="text-2xl font-bold tracking-tight text-neutral-900">
            Guides
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group block h-full rounded-xl border border-neutral-200 p-5 transition hover:border-indigo-300 hover:shadow-sm"
                >
                  <span className="font-semibold text-neutral-900 group-hover:text-indigo-600">{p.title}</span>
                  <span className="mt-1 block text-sm text-neutral-600">{p.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
