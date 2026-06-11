import Link from "next/link";

const links = [
  { href: "/pdf-to-markdown", label: "PDF → Markdown" },
  { href: "/markdown-to-pdf", label: "Markdown → PDF" },
  { href: "/blog", label: "Blog" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/60 bg-white/75 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5 font-semibold text-neutral-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 transition-transform group-hover:scale-105">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h7l5 5v11a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 13l2.5 2.5L14.5 13M12 9.5v6" />
            </svg>
          </span>
          <span className="text-lg tracking-tight">
            Markdown<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">PDF</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 sm:block"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/pdf-to-markdown"
            className="ml-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/30 transition-all hover:shadow-md hover:shadow-indigo-500/40 hover:brightness-110"
          >
            Convert now
          </Link>
        </nav>
      </div>
    </header>
  );
}
