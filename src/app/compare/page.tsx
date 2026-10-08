import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, Breadcrumbs } from "@/components/ToolSeo";

export const metadata: Metadata = {
  title: "PDF to Markdown Converters Compared",
  description:
    "How a browser-based PDF to Markdown converter compares with online converters, Marker, Docling, Mathpix and pandoc, and when another tool is the better pick.",
  alternates: { canonical: "/compare" },
};

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Compare", path: "/compare" },
];

const rows: { feature: string; us: string; online: string }[] = [
  { feature: "Where the file is processed", us: "In your browser, on your device", online: "Uploaded to the provider's servers" },
  { feature: "Price", us: "Free, no page limit", online: "Free tier with page or size caps" },
  { feature: "Account", us: "None", online: "Often required past a few files" },
  { feature: "Scanned PDFs (OCR)", us: "Included, 7 languages", online: "Often paid plans only" },
  { feature: "Multi-column reading order", us: "Gutters detected, columns read in order", online: "Varies" },
  { feature: "Tables", us: "Rebuilt from text positions; CSV export", online: "Varies" },
  { feature: "Check against the original", us: "Side by side, click a line to find it", online: "Rarely" },
  { feature: "Watermark", us: "Never", online: "Free tiers sometimes add one" },
];

const alternatives = [
  {
    name: "Marker",
    kind: "Open source · Python",
    strengths:
      "Deep-learning layout analysis and OCR; writes equations as LaTeX and copes well with complex scientific layouts. Runs on your own machine, so files stay private too.",
    tradeoff: "You install Python and its models; a GPU makes it much faster. Better for a pipeline than for one quick file.",
  },
  {
    name: "Docling",
    kind: "Open source · Python",
    strengths:
      "Layout and table-structure models that rebuild difficult tables well, with Markdown and JSON output designed for document pipelines.",
    tradeoff: "A developer tool: installation, models to download, and code to write around it.",
  },
  {
    name: "Mathpix",
    kind: "Commercial · cloud",
    strengths: "Excellent recognition of mathematics and scientific documents, with LaTeX and Markdown output.",
    tradeoff: "A paid service that processes documents on its servers.",
  },
  {
    name: "pandoc",
    kind: "Open source · command line",
    strengths: "The reference for converting between Markdown, Word, HTML, LaTeX and dozens of other formats.",
    tradeoff: "It does not read PDF as an input, so it is a complement for the next step rather than an alternative.",
  },
];

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <BreadcrumbJsonLd crumbs={crumbs} />
      <Breadcrumbs crumbs={crumbs} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.035em] text-ink [text-wrap:balance] sm:text-5xl">
        How MarkdownPDF compares
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-neutral-600">
        Where it is the right tool, where it is not, and what to use instead. Strengths of the alternatives are
        stated as plainly as ours.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">Against typical online converters</h2>
        <div className="mt-6 overflow-x-auto rounded-[14px] border border-line bg-white">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper">
                <th scope="col" className="px-4 py-3 font-semibold text-ink sm:px-5"></th>
                <th scope="col" className="px-4 py-3 font-semibold text-brand-700 sm:px-5">MarkdownPDF</th>
                <th scope="col" className="px-4 py-3 font-semibold text-neutral-500 sm:px-5">Typical online converter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.feature}>
                  <th scope="row" className="px-4 py-3.5 font-medium text-neutral-800 sm:px-5">{r.feature}</th>
                  <td className="px-4 py-3.5 text-ink sm:px-5">{r.us}</td>
                  <td className="px-4 py-3.5 text-neutral-500 sm:px-5">{r.online}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">Other tools worth knowing</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {alternatives.map((a) => (
            <li key={a.name} className="rounded-[14px] border border-line bg-white p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-neutral-500">{a.kind}</p>
              <h3 className="mt-1 text-lg font-bold text-ink">{a.name}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
                <span className="font-semibold text-ink">Better at: </span>
                {a.strengths}
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
                <span className="font-semibold text-ink">Trade-off: </span>
                {a.tradeoff}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <div className="rounded-[14px] bg-[oklch(0.97_0.02_150)] p-6">
          <h2 className="text-lg font-bold text-ink">Use MarkdownPDF when</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] text-neutral-700">
            <li>the document is confidential and must not be uploaded;</li>
            <li>you want a result in seconds, without installing anything;</li>
            <li>you are on a phone or a locked-down work computer;</li>
            <li>the PDF is mostly text: reports, contracts, papers, forms, scans of typed pages.</li>
          </ul>
        </div>
        <div className="rounded-[14px] bg-paper p-6">
          <h2 className="text-lg font-bold text-ink">Use something else when</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] text-neutral-700">
            <li>equations must come out as LaTeX — Marker or Mathpix;</li>
            <li>you process thousands of files in a pipeline — Marker or Docling;</li>
            <li>tables are irregular, nested or full of merged cells — Docling;</li>
            <li>the scan is handwritten — none of these will be reliable.</li>
          </ul>
        </div>
      </section>

      <p className="mt-12 text-[15px] text-neutral-600">
        The fairest test is your own document. Try the <Link href="/" className="font-semibold text-brand-700 hover:underline">converter</Link>,
        or run one of the <Link href="/examples" className="font-semibold text-brand-700 hover:underline">real examples</Link> first —
        each lists its rough edges.
      </p>
    </div>
  );
}
