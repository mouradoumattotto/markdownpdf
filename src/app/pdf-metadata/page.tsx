import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import PdfMetadataTool from "@/components/PdfMetadataTool";
import { Breadcrumbs, RelatedTools, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "See every hidden field in a PDF — author, software, dates, XMP — and remove them for good. Runs in your browser: the file is never uploaded to be cleaned.";

export const metadata: Metadata = {
  title: "PDF Metadata Viewer & Remover",
  description: DESCRIPTION,
  alternates: { canonical: "/pdf-metadata" },
  openGraph: {
    title: "PDF metadata viewer and remover — without uploading the file",
    description: "See what a PDF reveals about you, then remove it. Info dictionary and XMP packet, cleaned locally.",
    url: "/pdf-metadata",
  },
};

const faqItems = [
  {
    question: "What metadata does a PDF contain?",
    answer:
      "Usually the title, the author (often your account name), the subject and keywords, the software that created the document and the software that wrote the PDF, and the creation and modification dates. Many files also carry an XMP packet: a second copy of the same information in XML, sometimes with more — editing history, device details, or the original file name.",
  },
  {
    question: "Why does it matter?",
    answer:
      "Because a document you send is a document someone else can inspect. A CV can reveal the template you started from, a contract can reveal who really drafted it, an anonymous submission can carry the author's name, and dates can contradict what a covering email says. None of it is visible on the page.",
  },
  {
    question: "Is the file uploaded to be cleaned?",
    answer:
      "No. Reading (pdf.js) and rewriting (pdf-lib) both happen in your browser. That is the point: sending a document to a stranger's server to remove private information from it would be an odd way to protect it.",
  },
  {
    question: "Does removing metadata change the pages?",
    answer:
      "No. The page content, fonts, images and page order are copied as they are; only the metadata objects are removed. The file size usually changes slightly because the document is rewritten.",
  },
  {
    question: "Do other tools really remove it?",
    answer:
      "Not always. Clearing the visible fields while leaving the XMP packet in the file is a common shortcut — the author's name is then still there for anyone who opens the PDF in a text editor. This tool deletes the XMP stream object itself, along with per-page metadata and the private scratch data some editors leave behind, and our tests check the bytes rather than the viewer.",
  },
  {
    question: "Can I edit metadata instead of removing it?",
    answer:
      "Yes. Change any field and use “Save my changes” — useful for setting a proper title, which is what appears in a reader's tab and in search results for a PDF, or for correcting an author name before publishing.",
  },
];

export default function PdfMetadataPage() {
  const tool = getTool("pdf-metadata")!;
  return (
    <>
      <ToolJsonLd slug="pdf-metadata" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            PDF Metadata{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Viewer &amp; Remover
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Every PDF carries hidden fields: who wrote it, with what software, and when. See exactly what yours
            reveals, edit it, or remove all of it — here in your browser, with nothing uploaded.
          </p>
          <div className="mt-10">
            <PdfMetadataTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">The two places a PDF hides your name</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            The first is the <strong>Info dictionary</strong>: title, author, subject, keywords, creator, producer and
            dates. It is what a reader shows under &ldquo;Document properties&rdquo;, and what most online cleaners
            clear.
          </p>
          <p>
            The second is the <strong>XMP packet</strong> — the same information again, as XML embedded in the file,
            often with more detail and usually stored uncompressed. A tool that clears the first and leaves the second
            produces a PDF that still answers the question &ldquo;who made this?&rdquo; to anyone who opens it in a
            text editor. This tool removes both, plus the per-page metadata and the private application data that
            layout software leaves behind.
          </p>
          <p>
            What it does not touch: the visible content. If a name appears in the text or on a signature image,
            removing metadata will not hide it — that is redaction, a different and much harder job, and one worth
            doing properly rather than by drawing a black rectangle over the words.
          </p>
          <h3>Where this fits</h3>
          <p>
            Cleaning metadata pairs well with the rest of the suite: if you are about to hand a document to an AI
            tool, <Link href="/split-pdf-for-ai">splitting it to fit the upload limits</Link> or{" "}
            <Link href="/">converting it to Markdown</Link> both strip the original file&apos;s metadata as a side
            effect, because the output is a new document built from the content alone.
          </p>
        </div>
      </section>

      <AdSlot placement="tool" />

      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-xl font-bold text-neutral-900">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-600">
          <li>Encrypted or password-protected PDFs cannot be rewritten. Save an unprotected copy first.</li>
          <li>
            Metadata only. Text, images and annotations are left exactly as they are — this is not a redaction tool.
          </li>
          <li>
            Digital signatures are invalidated by any rewrite of the file, including this one. A signed document
            should be cleaned before it is signed.
          </li>
          <li>
            Embedded attachments and their own metadata are preserved; remove attachments separately if you need to.
          </li>
        </ul>
      </section>

      <RelatedTools slug="pdf-metadata" />
    </>
  );
}
