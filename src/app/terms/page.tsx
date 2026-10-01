import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for MarkdownPDF: free, browser-based PDF, Markdown and OCR tools. Your files stay on your device; the tools are provided as is.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-neutral-900">Terms of Service</h1>
      <div className="prose prose-neutral mt-6 max-w-none">
        <p>
          <em>Last updated: June 10, 2026</em>
        </p>
        <p>
          By using markdownpdf.app (the &quot;Site&quot;), you agree to these Terms of Service. If
          you do not agree, please do not use the Site.
        </p>

        <h2>1. The service</h2>
        <p>
          MarkdownPDF provides free, browser-based tools to convert documents between PDF and
          Markdown. Conversion runs locally on your device; we do not receive or store your files.
        </p>

        <h2>2. Acceptable use</h2>
        <p>
          You agree to use the Site only for lawful purposes and only with documents you have the
          right to process. You must not attempt to disrupt the Site, scrape it abusively, or use
          it to infringe the rights of others.
        </p>

        <h2>3. No warranty</h2>
        <p>
          The Site is provided <strong>&quot;as is&quot; and &quot;as available&quot;</strong>,
          without warranties of any kind, express or implied. Automated conversion — especially
          OCR of scanned documents — is inherently imperfect. You are responsible for reviewing
          converted output before relying on it.
        </p>

        <h2>4. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, MarkdownPDF shall not be liable for any
          indirect, incidental, or consequential damages arising from your use of the Site,
          including loss of data or inaccuracies in converted documents.
        </p>

        <h2>5. Intellectual property</h2>
        <p>
          You retain all rights to the documents you convert. The Site&apos;s design, content, and
          code are the property of MarkdownPDF and its licensors.
        </p>

        <h2>6. Advertising</h2>
        <p>
          The Site is supported by third-party advertising. Advertisers are solely responsible for
          the content of their ads.
        </p>

        <h2>7. Changes</h2>
        <p>
          We may modify these terms or discontinue the Site at any time. Continued use after
          changes constitutes acceptance of the updated terms.
        </p>

        <h2>8. Contact</h2>
        <p>
          Questions? Email <a href="mailto:contact@markdownpdf.app">contact@markdownpdf.app</a>.
        </p>
      </div>
    </div>
  );
}
