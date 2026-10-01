import Link from "next/link";
import MobileMenu from "@/components/MobileMenu";
import { hubLinks } from "@/components/ToolSeo";

// "All tools" points at the full tool grid on the homepage rather than a separate
// "all tools" URL: one more thin listing page would compete with the hubs.
const links = [
  { href: "/#all-tools", label: "All tools" },
  { href: "/md-to-pdf", label: "Markdown to PDF" },
  { href: "/blog", label: "Guides" },
  { href: "/how-it-works", label: "How it works" },
];

/** "Markdown·PDF" wordmark — the brand name stays one word for search, the dot is decoration. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`text-xl font-extrabold tracking-[-0.02em] ${className}`}>
      Markdown<span className="text-brand-600" aria-hidden>·</span>PDF
    </span>
  );
}

export default function Header() {
  const menu = [
    ...links,
    ...hubLinks().map((h) => ({ href: h.href, label: h.label })),
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-10">
        <Link href="/" aria-label="MarkdownPDF home" className="shrink-0 text-ink hover:opacity-80">
          <Wordmark />
        </Link>
        <nav className="hidden flex-1 items-center gap-6 text-sm font-medium md:flex" aria-label="Main navigation">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-neutral-700 transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/#converter"
            className="rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 sm:px-4"
          >
            Convert a PDF
          </Link>
          <MobileMenu links={menu} />
        </div>
      </div>
    </header>
  );
}
