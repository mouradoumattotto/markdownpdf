import Link from "next/link";
import { Wordmark } from "@/components/Header";
import { hubLinks } from "@/components/ToolSeo";
import { TOOLS } from "@/lib/tools";

// Tool and hub links come from the registry, so a new tool or a hub that goes
// live appears here without anyone remembering to edit the footer.
const toolLinks = TOOLS.slice(0, 6).map((t) => ({ href: t.path, label: t.name }));

const columns = [
  { title: "Tools", links: [...toolLinks, { href: "/#all-tools", label: "All tools" }] },
  {
    title: "Product",
    links: [
      { href: "/examples", label: "Examples" },
      { href: "/compare", label: "Compare" },
      { href: "/use-cases", label: "Use cases" },
      { href: "/how-it-works", label: "How it works" },
      ...hubLinks().map((h) => ({ href: h.href, label: h.label })),
    ],
  },
  {
    title: "More",
    links: [
      { href: "/blog", label: "Guides" },
      { href: "/blog/what-is-markdown-complete-guide", label: "What is Markdown?" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-ink text-sm text-neutral-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Wordmark className="text-lg text-white [&>span]:text-brand-400" />
            <p className="mt-3 max-w-xs leading-relaxed">
              Clean Markdown from any PDF, in your browser. Your files never leave your device.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-semibold text-white">{col.title}</p>
              <ul className="mt-3 space-y-0.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="block py-1 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 border-t border-white/10 pt-6 text-xs">
          © {new Date().getFullYear()} MarkdownPDF · markdownpdf.app — free, no upload, no account.
        </p>
      </div>
    </footer>
  );
}
