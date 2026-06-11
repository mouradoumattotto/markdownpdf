import Link from "next/link";

const columns = [
  {
    title: "Tools",
    links: [
      { href: "/pdf-to-markdown", label: "PDF to Markdown" },
      { href: "/markdown-to-pdf", label: "Markdown to PDF" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/blog/what-is-markdown-complete-guide", label: "What is Markdown?" },
      { href: "/blog/ocr-pdf-to-text-guide", label: "OCR Guide" },
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
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-semibold text-neutral-900">MarkdownPDF</p>
            <p className="mt-2 text-sm text-neutral-600">
              Free, private file conversion between PDF and Markdown. Your files never leave your
              browser.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-neutral-900">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-neutral-600 hover:text-neutral-900">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 text-xs text-neutral-500">
          © {new Date().getFullYear()} MarkdownPDF. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
