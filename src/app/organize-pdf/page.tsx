import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import OrganizePdfTool from "@/components/OrganizePdfTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Reorder, rotate, duplicate and delete PDF pages with a thumbnail of each, then save a new PDF. Free, no upload — it all happens in your browser.";

export const metadata: Metadata = {
  title: "Organize PDF Pages — Reorder, Rotate, Delete",
  description: DESCRIPTION,
  alternates: { canonical: "/organize-pdf" },
  openGraph: {
    title: "Organize PDF pages without uploading the file",
    description: "Reorder, rotate and delete pages with thumbnails, in your browser.",
    url: "/organize-pdf",
  },
};

const faqItems = [
  {
    question: "How do I move a page?",
    answer:
      "Drag its thumbnail to the new position, or use the ← and → buttons under it, which also work from the keyboard. The number under each page is its new position; “was 3” reminds you where it came from.",
  },
  {
    question: "Does rotating a page reduce quality?",
    answer:
      "No. Rotation is stored as a property of the page, the same way PDF viewers do it: the content itself is not re-drawn or re-compressed, and text stays selectable.",
  },
  {
    question: "Can I get deleted pages back?",
    answer:
      "Yes, until you download: “Undo all changes” restores the original order, rotation and every deleted page. Your original file is never modified — the organized PDF is a new file.",
  },
  {
    question: "Is my PDF uploaded?",
    answer:
      "No. The thumbnails are drawn and the new PDF is assembled in your browser, then saved directly to your device.",
  },
  {
    question: "What about very long documents?",
    answer:
      "The page grid is usable straight away; thumbnails fill in one by one in the background. Documents of a few hundred pages work; for fewer, bigger moves, Split PDF with page ranges can be quicker.",
  },
];

export default function OrganizePdfPage() {
  const tool = getTool("organize-pdf")!;
  return (
    <>
      <ToolJsonLd slug="organize-pdf" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            Organize{" "}
            PDF pages
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            See every page, then drag to reorder, rotate the sideways ones and delete the ones you do not need.
            Free, and the PDF never leaves your browser.
          </p>
          <div className="mt-10">
            <OrganizePdfTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">Fixing a PDF before you send it</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Scanners feed pages in the wrong order and upside down. Merged documents end up with a blank page in the
            middle. A report needs its summary moved to the front. This is the tool for those fixes: every page as
            a thumbnail, so you can see what you are doing.
          </p>
          <p>
            For bigger jobs, the other page tools are quicker: <Link href="/split-pdf">Split PDF</Link> extracts
            ranges of pages, <Link href="/merge-pdf">Merge PDF</Link> combines files, and{" "}
            <Link href="/ocr-pdf">OCR a PDF</Link> makes a scanned document searchable once it is in order.
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
        <h2 className="text-xl font-extrabold text-neutral-900">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-600">
          <li>Password-protected PDFs must be unlocked first.</li>
          <li>Bookmarks are not kept in the organized PDF; web links in the pages are.</li>
          <li>Drag and drop needs a mouse or trackpad; on touch screens, use the arrow buttons.</li>
        </ul>
      </section>

      <RelatedTools slug="organize-pdf" />
      <ToolGuides slug="organize-pdf" />
    </>
  );
}
