import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import { BreadcrumbJsonLd, Breadcrumbs, ToolGrid } from "@/components/ToolSeo";
import { getTool, type Tool } from "@/lib/tools";
import { USE_CASES, getUseCase } from "@/lib/use-cases";

export const dynamicParams = false;

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const u = getUseCase(slug);
  if (!u) return {};
  return {
    title: { absolute: `${u.title} | MarkdownPDF` },
    description: u.description,
    alternates: { canonical: `/use-cases/${u.slug}` },
    openGraph: { title: u.h1, description: u.description, url: `/use-cases/${u.slug}` },
  };
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = getUseCase(slug);
  if (!u) notFound();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Use cases", path: "/use-cases" },
    { name: u.name, path: `/use-cases/${u.slug}` },
  ];
  const tools = u.tools.map(getTool).filter((t): t is Tool => Boolean(t));

  return (
    <>
      <BreadcrumbJsonLd crumbs={crumbs} />
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Breadcrumbs crumbs={crumbs} />
        <h1 className="mt-6 text-[2rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-ink [text-wrap:balance] sm:text-5xl">
          {u.h1}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600">{u.lead}</p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        {u.sections.map((s) => (
          <section key={s.heading} className="mt-8 first:mt-0">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">{s.heading}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} className="mt-4 leading-relaxed text-neutral-700">
                {p}
              </p>
            ))}
          </section>
        ))}

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">A typical workflow</h2>
          <ol className="mt-6 space-y-3">
            {u.steps.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-[14px] border border-line bg-white p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 font-mono text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-600">{s.text}</p>
                  {s.tool && (
                    <Link href={s.tool.href} className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:underline">
                      Open {s.tool.name} →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <AdSlot placement="tool" />

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Faq items={u.faq} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-extrabold text-ink">Tools for this job</h2>
        <div className="mt-6">
          <ToolGrid tools={tools} columns={3} />
        </div>
        <p className="mt-8 text-sm text-neutral-600">
          Other use cases:{" "}
          {USE_CASES.filter((x) => x.slug !== u.slug).map((x, i, all) => (
            <span key={x.slug}>
              <Link href={`/use-cases/${x.slug}`} className="font-semibold text-ink hover:text-brand-700">
                {x.name}
              </Link>
              {i < all.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
      </section>
    </>
  );
}
