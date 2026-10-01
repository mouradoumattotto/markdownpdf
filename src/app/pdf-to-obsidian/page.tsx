import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import ObsidianTool from "@/components/ObsidianTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Convert a PDF into an Obsidian note: YAML properties, images saved as attachments and embedded with wikilinks, optional page markers. Free, in your browser.";

export const metadata: Metadata = {
  title: "PDF to Obsidian — Convert a PDF into a Note",
  description: DESCRIPTION,
  alternates: { canonical: "/pdf-to-obsidian" },
  openGraph: {
    title: "PDF to Obsidian — a PDF as a searchable note",
    description: "Properties, attachments and page markers, ready to drop into your vault.",
    url: "/pdf-to-obsidian",
  },
};

const faqItems = [
  {
    question: "How do I import a PDF into Obsidian as a note?",
    answer:
      "Drop the PDF above. You get a Markdown note with properties at the top; if the PDF has images, download the ZIP and unzip it anywhere inside your vault — the note and its attachments folder go together. Obsidian picks the note up immediately.",
  },
  {
    question: "Why not just keep the PDF in the vault?",
    answer:
      "Obsidian can display a PDF, but it cannot link to a heading inside it, show it in the graph, or search it alongside your notes as reliably. As Markdown, the content becomes part of the vault: backlinks, headings in the outline, block references, and plugins like Dataview all work.",
  },
  {
    question: "What are the page markers?",
    answer:
      "Obsidian comments — %% page 12 %% — placed where each page of the PDF begins. They are hidden in reading view but searchable, so when you quote the note you can still cite the original page.",
  },
  {
    question: "How are images named?",
    answer:
      "Each image is prefixed with the note's name (my-paper-page-3-1.png) and embedded with ![[…]]. Obsidian resolves embeds by file name across the whole vault, so the prefix keeps two imported PDFs from fighting over “page-1-1.png”.",
  },
  {
    question: "Does it work with scanned PDFs?",
    answer: "Yes — scanned pages go through OCR in your browser, in the language you pick. Nothing is uploaded.",
  },
];

export default function PdfToObsidianPage() {
  const tool = getTool("pdf-to-obsidian")!;
  return (
    <>
      <ToolJsonLd slug="pdf-to-obsidian" description={DESCRIPTION} />
      <div className="mx-auto max-w-5xl px-4 pb-14 pt-8">
        <Breadcrumbs crumbs={toolCrumbs(tool)} />
        <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-5xl">PDF to Obsidian</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
          Turn a PDF into a real Obsidian note — properties, headings, attachments and page markers — so it can be
          searched, linked and quoted like the rest of your vault.
        </p>
        <div className="mt-10">
          <ObsidianTool />
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">What the note looks like</h2>
        <pre className="mt-5 overflow-x-auto rounded-xl border border-line bg-white p-5 font-mono text-[13px] leading-relaxed text-neutral-800">
{`---
title: "Why Most Published Research Findings Are False"
source: "research-paper.pdf"
pages: 6
created: 2026-10-01
tags:
  - pdf
---

%% page 1 %%

# Why Most Published Research Findings Are False

### Summary

There is increasing concern that most current published…

![[why-most-published-research-page-2-1.png]]`}
        </pre>
        <div className="prose prose-neutral mt-6 max-w-none prose-a:text-brand-700">
          <p>
            The properties show up in Obsidian&apos;s Properties panel and are queryable with Dataview —{" "}
            <code>source</code> keeps track of where a note came from, <code>pages</code> tells you how long the
            original was. Edit the tags before converting, or in the note afterwards.
          </p>
          <p>
            Converting a whole folder of PDFs for a vault? <Link href="/batch-pdf-to-markdown">Batch PDF to Markdown</Link>{" "}
            does them all in one go. The <Link href="/blog/pdf-to-markdown-for-obsidian">Obsidian guide</Link> covers
            how to organise imported notes once they are in.
          </p>
        </div>
      </section>

      <AdSlot placement="tool" />

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-xl font-extrabold text-ink">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-600">
          <li>Highlights and annotations made in a PDF reader are not carried over.</li>
          <li>The note title comes from the first heading found, or the file name — rename freely.</li>
          <li>Equations are kept as the text the PDF contains, not converted to LaTeX.</li>
        </ul>
      </section>

      <RelatedTools slug="pdf-to-obsidian" />
      <ToolGuides slug="pdf-to-obsidian" />
    </>
  );
}
