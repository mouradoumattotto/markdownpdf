import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact MarkdownPDF: report a conversion bug, a mistake in a guide, or suggest a tool. Email or GitHub issues; replies within a couple of business days.",
  alternates: { canonical: "/contact" },
};

const EMAIL = "contact@markdownpdf.app";
const ISSUES = "https://github.com/mouradoumattotto/markdownpdf/issues";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-neutral-900">Contact</h1>
      <div className="prose prose-neutral mt-6 max-w-none prose-a:text-indigo-600">
        <p>
          MarkdownPDF is maintained by one developer, who reads every message. Email{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a> and you will usually get a reply within a couple of
          business days.
        </p>

        <h2>What to write about</h2>
        <ul>
          <li>
            <strong>A conversion went wrong.</strong> Headings lost, a table scrambled, OCR misreading
            a scan, a PDF that will not open: these reports are the most useful, because each one
            becomes a test case.
          </li>
          <li>
            <strong>A guide is wrong or out of date.</strong> Upload limits, plan names and app
            features change often. If something on the <Link href="/blog">blog</Link> no longer
            matches what you see, say which page and what changed; confirmed errors are corrected and
            the revision date updated.
          </li>
          <li>
            <strong>A tool you need.</strong> Suggestions for new conversions or options are welcome,
            especially when you describe the document and what you want to do with the result.
          </li>
          <li>
            <strong>Privacy, advertising or legal questions.</strong> See the{" "}
            <Link href="/privacy-policy">privacy policy</Link> and <Link href="/terms">terms</Link>{" "}
            first; anything they don&apos;t answer, ask by email.
          </li>
        </ul>

        <h2>Reporting a conversion problem</h2>
        <p>Because your files never reach our servers, we can only see what you describe. Please include:</p>
        <ol>
          <li>The tool you used, and your browser and device.</li>
          <li>What kind of document it is: digital or scanned, language, one or two columns, tables.</li>
          <li>What you expected and what you got — a screenshot of the result helps.</li>
        </ol>
        <p>
          <strong>Please don&apos;t email confidential documents.</strong> If the problem only shows up
          with a specific file, a public PDF with a similar layout is the best thing to send.
        </p>

        <h2>Public bug reports</h2>
        <p>
          The source code is public, and bugs and feature requests can also be filed as{" "}
          <a href={ISSUES} rel="noopener">GitHub issues</a>, where you can follow their progress.
        </p>
      </div>
    </div>
  );
}
