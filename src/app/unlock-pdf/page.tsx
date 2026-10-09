import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import UnlockPdfTool from "@/components/UnlockPdfTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Remove the password and the print, copy and edit restrictions from a PDF you can open. Free, and the PDF and its password never leave your browser.";

export const metadata: Metadata = {
  title: "Unlock PDF — Remove a PDF Password, No Upload",
  description: DESCRIPTION,
  alternates: { canonical: "/unlock-pdf" },
  openGraph: {
    title: "Unlock PDF, without uploading it",
    description: "Remove a PDF's password and restrictions, in your browser.",
    url: "/unlock-pdf",
  },
};

const faqItems = [
  {
    question: "Can it open a PDF if I don't know the password?",
    answer:
      "No. If a PDF asks for a password before it opens, you need that password (or the owner password) to unlock it. The tool does not guess or crack passwords. PDFs that only block printing, copying or editing open without one, so those restrictions are removed straight away.",
  },
  {
    question: "Is my password sent anywhere?",
    answer:
      "No. The PDF is decrypted in your browser tab, and the password is only used there and then forgotten. Neither the file nor the password is uploaded or stored.",
  },
  {
    question: "Which kinds of PDF protection are supported?",
    answer:
      "The standard password security used by Acrobat, Word, Preview and most other software: AES-256, AES-128 and the older RC4 encryption (40 and 128-bit). PDFs protected with a certificate (a digital ID) rather than a password cannot be unlocked, and the tool says so.",
  },
  {
    question: "Does unlocking change the document?",
    answer:
      "Only the protection is removed. Text, fonts, images, bookmarks, links and form fields are decrypted and written back as they were. Nothing is turned into an image, so the text stays selectable and searchable.",
  },
  {
    question: "What happens to digital signatures?",
    answer:
      "A digital signature covers the exact bytes of the signed file. Removing the encryption rewrites the file, so viewers will report the signature as no longer valid. Keep the original if you need to prove the signature.",
  },
  {
    question: "Is it legal to remove a PDF password?",
    answer:
      "Removing the password from your own documents, or from a file you were given the password for, is the normal use. Do not use it to get around restrictions on documents you are not entitled to edit or copy.",
  },
];

export default function UnlockPdfPage() {
  const tool = getTool("unlock-pdf")!;
  return (
    <>
      <ToolJsonLd slug="unlock-pdf" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            Unlock PDF
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Remove the password from a PDF you can open, along with its printing, copying and editing restrictions.
            Free, and the file and its password never leave your browser.
          </p>
          <div className="mt-10">
            <UnlockPdfTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">Two kinds of locked PDF</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            <strong>An open password</strong> — the PDF asks for it before showing anything. Bank statements, payslips
            and documents sent by email are often protected this way. Type the password once here and you get a copy
            that opens without it, which is what you want before archiving it, merging it with other files or giving
            it to a program that cannot ask for passwords.
          </p>
          <p>
            <strong>Restrictions only</strong> — the PDF opens normally but will not let you print, copy text or fill
            in fields. Those limits come from an owner password the reader never needs to type, so the tool removes
            them without asking.
          </p>
          <h3>Then do something with it</h3>
          <p>
            Locked files are why many PDF tools fail. Once unlocked, the PDF can go straight to{" "}
            <Link href="/">PDF to Markdown</Link>, <Link href="/merge-pdf">Merge PDF</Link>,{" "}
            <Link href="/split-pdf">Split PDF</Link> or <Link href="/organize-pdf">Organize PDF</Link> — use the
            buttons under the result, no need to download and pick the file again.
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
          <li>A PDF that asks for a password on opening can only be unlocked with that password or the owner password.</li>
          <li>Certificate-protected PDFs (digital ID) and DRM systems such as FileOpen or LockLizard are not supported.</li>
          <li>Digital signatures stop validating once the file is rewritten.</li>
          <li>Very large files are limited by your device&apos;s memory, since everything happens in the browser.</li>
        </ul>
      </section>

      <RelatedTools slug="unlock-pdf" />
      <ToolGuides slug="unlock-pdf" />
    </>
  );
}
