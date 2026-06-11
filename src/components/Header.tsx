import Link from "next/link";

const links = [
  { href: "/pdf-to-markdown", label: "PDF to Markdown" },
  { href: "/markdown-to-pdf", label: "Markdown to PDF" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

export default function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-neutral-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            M↓
          </span>
          <span className="text-lg tracking-tight">MarkdownPDF</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-2 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 sm:px-3"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
