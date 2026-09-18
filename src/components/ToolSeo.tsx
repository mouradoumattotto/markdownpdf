import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getPost } from "@/lib/blog";
import { SITE } from "@/lib/site";
import { getCategory, getTool, liveCategories, relatedTools, type CategoryId, type Tool } from "@/lib/tools";

export interface Crumb {
  name: string;
  path: string;
}

/** Home > <primary category hub, if live> > Tool */
export function toolCrumbs(tool: Tool): Crumb[] {
  const crumbs: Crumb[] = [{ name: "Home", path: "/" }];
  const primary = tool.categories[0];
  if (liveCategories().some((c) => c.id === primary)) {
    const cat = getCategory(primary);
    crumbs.push({ name: cat.name, path: cat.path });
  }
  if (tool.path !== "/") crumbs.push({ name: tool.name, path: tool.path });
  return crumbs;
}

export function BreadcrumbJsonLd({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length < 2) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          item: `${SITE.url}${c.path === "/" ? "" : c.path}`,
        })),
      }}
    />
  );
}

/** Visible breadcrumb trail — mirrors the BreadcrumbList exactly. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>›</span>}
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="text-neutral-700">
                {c.name}
              </span>
            ) : (
              <Link href={c.path} className="hover:text-neutral-900">
                {c.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * WebApplication + BreadcrumbList for a tool page, built from the registry so
 * every claim in the markup is one the page itself makes. No aggregateRating:
 * there are no reviews, and inventing them is a manual-action offence.
 */
export function ToolJsonLd({ slug, description }: { slug: string; description: string }) {
  const tool = getTool(slug);
  if (!tool) return null;
  const url = `${SITE.url}${tool.path === "/" ? "" : tool.path}`;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "@id": `${url}#app`,
          name: `${tool.name} — ${SITE.name}`,
          url,
          description,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires a modern browser with JavaScript enabled",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList: tool.features,
          publisher: { "@id": `${SITE.url}/#organization` },
        }}
      />
      <BreadcrumbJsonLd crumbs={toolCrumbs(tool)} />
    </>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={tool.path}
      className="group block h-full rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
    >
      <span className="font-semibold text-neutral-900 group-hover:text-indigo-600">{tool.name}</span>
      <span className="mt-1 block text-sm text-neutral-600">{tool.tagline}</span>
      <span className="mt-3 block text-xs text-neutral-500">
        {tool.input.join(", ")} → {tool.output.join(", ")}
      </span>
    </Link>
  );
}

export function ToolGrid({ tools, columns = 3 }: { tools: Tool[]; columns?: 2 | 3 }) {
  return (
    <ul className={`grid gap-4 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}>
      {tools.map((t) => (
        <li key={t.slug}>
          <ToolCard tool={t} />
        </li>
      ))}
    </ul>
  );
}

export function RelatedTools({ slug, heading = "Related tools" }: { slug: string; heading?: string }) {
  const tools = relatedTools(slug);
  if (tools.length === 0) return null;
  return (
    <section className="mx-auto max-w-5xl px-4 py-12" aria-labelledby="related-tools">
      <h2 id="related-tools" className="text-2xl font-bold tracking-tight text-neutral-900">
        {heading}
      </h2>
      <div className="mt-6">
        <ToolGrid tools={tools} />
      </div>
    </section>
  );
}

export function ToolGuides({ slug, heading = "Guides" }: { slug: string; heading?: string }) {
  const tool = getTool(slug);
  const posts = (tool?.guides ?? []).map(getPost).filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (posts.length === 0) return null;
  return (
    <section className="mx-auto max-w-5xl px-4 pb-12" aria-labelledby="tool-guides">
      <h2 id="tool-guides" className="text-2xl font-bold tracking-tight text-neutral-900">
        {heading}
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
  );
}

/** Links to every live hub — used by the header, footer and 404. */
export function hubLinks(): { href: string; label: string; id: CategoryId }[] {
  return liveCategories().map((c) => ({ href: c.path, label: c.name, id: c.id }));
}
