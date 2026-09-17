import Link from "next/link";

const columns = [
  {
    title: "Tools",
    links: [
      { href: "/", label: "PDF to Markdown" },
      { href: "/markdown-to-pdf", label: "Markdown to PDF" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/blog/what-is-markdown-complete-guide", label: "What is Markdown?" },
      { href: "/blog/extract-text-from-scanned-pdf", label: "Scanned PDF & OCR" },
      { href: "/blog/pdf-vs-word-vs-markdown", label: "PDF vs Word vs Markdown" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-950 text-neutral-300">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="flex items-center gap-2 font-semibold text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-xs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h7l5 5v11a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z" />
                </svg>
              </span>
              MarkdownPDF
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Free, private conversion between PDF and Markdown. Your files never leave your
              browser.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.96 11.96 0 013.6 6c-.27.797-.413 1.65-.413 2.54 0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-.89-.143-1.743-.413-2.54a11.96 11.96 0 01-8.4-3.286z" />
              </svg>
              No file uploads, ever
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-neutral-400 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-neutral-800 pt-6 text-xs text-neutral-400">
          © {new Date().getFullYear()} MarkdownPDF · markdownpdf.app — All rights reserved.
        </p>
      </div>
    </footer>
  );
}
