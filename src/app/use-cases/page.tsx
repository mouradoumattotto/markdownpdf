import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, Breadcrumbs } from "@/components/ToolSeo";
import { USE_CASES } from "@/lib/use-cases";

export const metadata: Metadata = {
  title: "Use Cases — PDF to Markdown for Lawyers, Researchers, Finance, Students",
  description:
    "How lawyers, researchers, finance teams and students use browser-based PDF conversion: privileged files kept local, papers to notes, tables to spreadsheets.",
  alternates: { canonical: "/use-cases" },
};

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Use cases", path: "/use-cases" },
];

export default function UseCasesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <BreadcrumbJsonLd crumbs={crumbs} />
      <Breadcrumbs crumbs={crumbs} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-5xl">Use cases</h1>
      <p className="mt-4 max-w-2xl text-lg text-neutral-600">
        The same tools, put to work by people with very different documents — and very different reasons to keep
        them off other people&apos;s servers.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {USE_CASES.map((u) => (
          <li key={u.slug}>
            <Link
              href={`/use-cases/${u.slug}`}
              className="flex h-full gap-4 rounded-[14px] border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-neutral-300 sm:p-6"
            >
              <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink font-mono text-sm font-semibold text-white">
                {u.glyph}
              </span>
              <span>
                <span className="block text-lg font-bold text-ink">{u.name}</span>
                <span className="mt-1 block text-[15px] leading-relaxed text-neutral-600">{u.lead}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
