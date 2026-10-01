import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { toolMenuGroups } from "@/components/ToolSeo";
import { USE_CASES } from "@/lib/use-cases";

// Every entry is a page, never a homepage anchor: an anchor breaks as soon as
// the visitor is anywhere other than `/`. Tools live in the "Tools" menu.
const links = [
  { href: "/examples", label: "Examples" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/compare", label: "Compare" },
  { href: "/blog", label: "Guides" },
];

const useCaseGroup = {
  title: "Use cases",
  href: "/use-cases",
  items: USE_CASES.map((u) => ({
    href: `/use-cases/${u.slug}`,
    name: `For ${u.name.toLowerCase()}`,
    tagline: u.lead.split(". ")[0] + ".",
    glyph: u.glyph,
    tile: "#52525b",
  })),
};

/** "Markdown·PDF" wordmark — the brand name stays one word for search, the dot is decoration. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`text-xl font-extrabold tracking-[-0.02em] ${className}`}>
      Markdown<span className="text-brand-600" aria-hidden>·</span>PDF
    </span>
  );
}

// Solid background, no backdrop-filter: a filter would become the containing
// block of the fixed-position menus inside and clip them to the header's 64px.
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-10">
        <Link href="/" aria-label="MarkdownPDF home" className="shrink-0 text-ink hover:opacity-80">
          <Wordmark />
        </Link>
        <SiteNav groups={[...toolMenuGroups(), useCaseGroup]} links={links} />
      </div>
    </header>
  );
}
