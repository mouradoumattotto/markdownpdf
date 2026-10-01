import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getPost } from "@/lib/blog";
import { SITE } from "@/lib/site";
import {
  CATEGORIES,
  TOOLS,
  getCategory,
  getTool,
  liveCategories,
  relatedTools,
  type CategoryId,
  type Tool,
} from "@/lib/tools";

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

/** Short mono glyph on each card tile, as in the "Hub rouge" design. */
const GLYPHS: Record<string, string> = {
  "pdf-to-markdown": "MD",
  "markdown-to-pdf": "PDF",
  "split-pdf-for-ai": "AI",
  "pdf-metadata": "META",
  "pdf-to-text": "TXT",
  "ocr-pdf": "OCR",
  "image-to-text": "IMG",
  "docx-to-markdown": "DOC",
  "html-to-markdown": "HTML",
  "markdown-to-html": "</>",
  "split-pdf": "SPLT",
  "merge-pdf": "+",
  "pdf-to-jpg": "JPG",
  "jpg-to-pdf": "PDF",
  "organize-pdf": "ORG",
  "markdown-to-docx": "DOCX",
  "markdown-table-generator": "TBL",
  "token-counter": "TOK",
  "markdown-chunker": "RAG",
  "text-diff": "DIFF",
  "markdown-editor": "EDIT",
};

/** Tile colour per primary category: the brand red for PDF tools, then fixed hues. */
const TILE: Record<CategoryId, string> = {
  pdf: "oklch(0.58 0.21 27)",
  ocr: "oklch(0.6 0.15 150)",
  markdown: "oklch(0.55 0.17 262)",
  ai: "oklch(0.6 0.13 200)",
};

/** The coloured tile shown beside a tool everywhere: cards, menu, related links. */
export function toolBadge(tool: Tool): { glyph: string; tile: string } {
  return { glyph: GLYPHS[tool.slug] ?? tool.output[0].slice(0, 3).toUpperCase(), tile: TILE[tool.categories[0]] };
}

/** Tools grouped under their primary category, for the header menus. */
export function toolMenuGroups() {
  return CATEGORIES.map((c) => ({
    title: c.name,
    href: liveCategories().some((l) => l.id === c.id) ? c.path : null,
    items: TOOLS.filter((t) => t.categories[0] === c.id).map((t) => ({
      href: t.path,
      name: t.name,
      tagline: t.tagline,
      ...toolBadge(t),
    })),
  })).filter((g) => g.items.length > 0);
}

function ToolCard({ tool }: { tool: Tool }) {
  const { glyph } = toolBadge(tool);
  return (
    <Link
      href={tool.path}
      className="group flex h-full gap-4 rounded-[14px] border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_12px_30px_-18px_rgba(0,0,0,0.3)] sm:flex-col sm:gap-3.5 sm:p-[22px]"
    >
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-semibold text-white sm:h-12 sm:w-12"
        style={{ background: TILE[tool.categories[0]] }}
      >
        {glyph}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-bold tracking-[-0.01em] text-ink sm:text-lg">{tool.name}</span>
        <span className="mt-1 block text-sm leading-normal text-neutral-600">{tool.tagline}</span>
      </span>
    </Link>
  );
}

export function ToolGrid({ tools, columns = 4 }: { tools: Tool[]; columns?: 2 | 3 | 4 }) {
  const cols = { 2: "", 3: "lg:grid-cols-3", 4: "lg:grid-cols-3 xl:grid-cols-4" }[columns];
  return (
    <ul className={`grid gap-3 sm:grid-cols-2 sm:gap-4 ${cols}`}>
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
      <h2 id="related-tools" className="text-base font-bold text-ink">
        {heading}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2.5 sm:gap-3">
        {tools.map((t) => {
          const { glyph, tile } = toolBadge(t);
          return (
            <li key={t.slug} className="w-full sm:w-auto">
              <Link
                href={t.path}
                title={t.tagline}
                className="flex min-h-12 items-center gap-2.5 rounded-[10px] border border-line bg-white py-2 pl-2 pr-4 text-sm font-semibold text-ink transition hover:border-neutral-300 hover:shadow-sm"
              >
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-semibold text-white"
                  style={{ background: tile }}
                >
                  {glyph}
                </span>
                {t.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ToolGuides({ slug, heading = "Guides" }: { slug: string; heading?: string }) {
  const tool = getTool(slug);
  const posts = (tool?.guides ?? []).map(getPost).filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (posts.length === 0) return null;
  return (
    <section className="mx-auto max-w-5xl px-4 pb-12" aria-labelledby="tool-guides">
      <h2 id="tool-guides" className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">
        {heading}
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group block h-full rounded-[14px] border border-line bg-white p-5 transition hover:border-neutral-300 hover:shadow-sm"
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
