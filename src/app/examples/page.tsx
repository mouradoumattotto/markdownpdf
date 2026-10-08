import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SampleRunLink from "@/components/SampleRunLink";
import { BreadcrumbJsonLd, Breadcrumbs } from "@/components/ToolSeo";
import { SAMPLES, sampleThumb, sampleUrl } from "@/lib/samples";

export const metadata: Metadata = {
  title: "PDF to Markdown Examples on Real Documents",
  description:
    "Run the converter live on real documents: a two-column paper, a 1933 scanned report, Census and energy tables, an IRS form, a 32-page NIST standard.",
  alternates: { canonical: "/examples" },
};

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Examples", path: "/examples" },
];

export default function ExamplesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <BreadcrumbJsonLd crumbs={crumbs} />
      <Breadcrumbs crumbs={crumbs} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-5xl">Run a real PDF. Right here.</h1>
      <p className="mt-4 max-w-2xl text-lg text-neutral-600">
        Nothing pre-rendered: each example runs the converter in your browser on a real document. And each one says
        what does not come out well — you should know before you rely on it.
      </p>

      <ul className="mt-10 grid gap-5 md:grid-cols-2">
        {SAMPLES.map((s) => (
          <li key={s.slug} className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-white">
            <div className="flex gap-4 p-5 sm:p-6">
              <Image
                src={sampleThumb(s)}
                alt={`First page of ${s.title}`}
                width={96}
                height={124}
                className="h-[124px] w-24 shrink-0 rounded-md border border-line object-cover object-top"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-700">{s.kind}</p>
                <h2 className="mt-1 text-lg font-bold leading-snug text-ink">{s.title}</h2>
                <p className="mt-1 text-[13px] text-neutral-500">
                  {s.pages} {s.pages === 1 ? "page" : "pages"} · {s.source.org}
                </p>
              </div>
            </div>
            <dl className="flex-1 space-y-3 px-5 text-[14px] leading-relaxed sm:px-6">
              <div>
                <dt className="font-semibold text-ink">What to look for</dt>
                <dd className="text-neutral-600">{s.whatToLookFor}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Rough edges</dt>
                <dd className="text-neutral-600">{s.roughEdges}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line px-5 py-4 sm:px-6">
              <SampleRunLink slug={s.slug} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Run it live →
              </SampleRunLink>
              {s.tool.href !== "/" && (
                <Link href={s.tool.href} className="rounded-lg border border-[#d4d4d0] px-3.5 py-2 text-sm font-semibold text-ink hover:bg-neutral-50">
                  Try with {s.tool.name}
                </Link>
              )}
              <a href={sampleUrl(s)} download className="ml-auto text-sm font-medium text-neutral-600 hover:text-ink">
                Download PDF
              </a>
            </div>
            <p className="border-t border-line bg-paper px-5 py-2.5 text-xs text-neutral-500 sm:px-6">
              Source:{" "}
              <a href={s.source.url} rel="noopener" target="_blank" className="underline hover:text-ink">
                {s.source.credit ? `${s.source.credit}, ` : ""}
                {s.source.org}
              </a>{" "}
              · {s.source.license}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-10 max-w-2xl text-sm text-neutral-600">
        Long documents are cut to a few representative pages so the examples load quickly on a phone; the scanned
        NACA report was re-rendered as plain images, as a fresh scan would be. Have a PDF that converts badly?{" "}
        <Link href="/contact" className="font-semibold text-ink underline">
          Tell us
        </Link>{" "}
        — the hard cases are the useful ones.
      </p>
    </div>
  );
}
