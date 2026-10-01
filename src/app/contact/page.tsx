import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the MarkdownPDF team with questions, bug reports, or feedback.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-neutral-900">Contact</h1>
      <div className="prose prose-neutral mt-6 max-w-none">
        <p>
          Found a bug, have a feature request, or just want to say hello? We&apos;d love to hear
          from you.
        </p>
        <p>
          Email us at{" "}
          <a href="mailto:contact@markdownpdf.app" className="text-indigo-600">
            contact@markdownpdf.app
          </a>{" "}
          and we&apos;ll get back to you as soon as we can — usually within a couple of business
          days.
        </p>
        <p>
          When reporting a conversion problem, describing the document type (scanned or digital,
          language, layout) helps us reproduce the issue. Please don&apos;t send confidential
          documents by email.
        </p>
      </div>
    </div>
  );
}
