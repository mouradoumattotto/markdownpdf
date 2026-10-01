import Link from "next/link";
import { Wordmark } from "@/components/Header";
import { hubLinks } from "@/components/ToolSeo";
import { TOOLS } from "@/lib/tools";

// Tool and hub links come from the registry, so a new tool or a hub that goes
// live appears here without anyone remembering to edit the footer.
const toolLinks = TOOLS.slice(0, 8).map((t) => ({ href: t.path, label: t.name }));

const columns = [
  { title: "Tools", links: toolLinks },
  {
    title: "Categories & guides",
    links: [
      ...hubLinks().map((h) => ({ href: h.href, label: h.label })),
      { href: "/blog", label: "All guides" },
      { href: "/blog/what-is-markdown-complete-guide", label: "What is Markdown?" },
      { href: "/blog/extract-text-from-scanned-pdf", label: "Scanned PDF & OCR" },
      { href: "/blog/pdf-vs-word-vs-markdown", label: "PDF vs Word vs Markdown" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-white text-neutral-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Wordmark className="text-ink" />
            <p className="mt-3 text-sm leading-relaxed">
              Free, private conversion between PDF and Markdown. Your files never leave your
              browser.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">{col.title}</p>
              <ul className="mt-4 space-y-1">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="block py-1 text-sm text-neutral-700 transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-x-7 gap-y-2 px-4 py-5 text-[13px] sm:px-6 lg:px-10">
          <span>✓ No upload</span>
          <span>✓ No account</span>
          <span>✓ Works on scanned PDFs</span>
          <span className="w-full sm:ml-auto sm:w-auto">
            © {new Date().getFullYear()} MarkdownPDF · markdownpdf.app
          </span>
        </div>
      </div>
    </footer>
  );
}
