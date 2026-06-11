import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "MarkdownPDF privacy policy: your files are processed locally in your browser and never uploaded. Details on cookies, analytics, and advertising.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Privacy Policy</h1>
      <div className="prose prose-neutral mt-6 max-w-none">
        <p>
          <em>Last updated: June 10, 2026</em>
        </p>
        <p>
          This Privacy Policy explains how MarkdownPDF (&quot;we&quot;, &quot;us&quot;) handles
          information when you use markdownpdf.app (the &quot;Site&quot;).
        </p>

        <h2>1. Your files never leave your device</h2>
        <p>
          All file conversion on this Site (PDF to Markdown, Markdown to PDF, including OCR) is
          performed locally in your web browser using JavaScript. The documents you convert are{" "}
          <strong>never uploaded to, transmitted through, or stored on our servers</strong>. We
          have no access to their contents at any time.
        </p>

        <h2>2. Information we collect</h2>
        <p>
          We do not require an account and do not collect names, email addresses, or other
          personal information to use the converters. Like most websites, our hosting provider may
          automatically log basic technical data (such as IP address, browser type, and pages
          visited) for security and operational purposes.
        </p>

        <h2>3. Analytics</h2>
        <p>
          We may use privacy-respecting analytics to understand aggregate site usage (page views,
          referrers, approximate location at country level). This data is aggregated and is not
          used to identify individual visitors.
        </p>

        <h2>4. Advertising and cookies</h2>
        <p>
          The Site is supported by advertising. We use Google AdSense to display ads. Google and
          its partners may use cookies and similar technologies to serve ads based on your prior
          visits to this and other websites. Google&apos;s use of advertising cookies enables it
          and its partners to serve ads based on your visits to this Site and/or other sites on
          the Internet.
        </p>
        <p>
          You may opt out of personalized advertising by visiting{" "}
          <a href="https://www.google.com/settings/ads" rel="nofollow noopener">
            Google Ads Settings
          </a>
          . You can also opt out of some third-party vendors&apos; use of cookies for personalized
          advertising at{" "}
          <a href="https://www.aboutads.info" rel="nofollow noopener">
            www.aboutads.info
          </a>
          . Visitors in the European Economic Area and the UK are shown a consent dialog before
          any advertising cookies are set, in accordance with the GDPR and ePrivacy rules.
        </p>

        <h2>5. Data retention</h2>
        <p>
          Because converted files never reach our servers, there is nothing for us to retain or
          delete. Server logs maintained by our hosting provider are kept for a limited period for
          security purposes.
        </p>

        <h2>6. Children&apos;s privacy</h2>
        <p>
          The Site is a general-audience tool and is not directed at children under 13. We do not
          knowingly collect personal information from children.
        </p>

        <h2>7. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. Changes will be posted on this page with an
          updated &quot;Last updated&quot; date.
        </p>

        <h2>8. Contact</h2>
        <p>
          Questions about this policy? Email us at{" "}
          <a href="mailto:contact@markdownpdf.app">contact@markdownpdf.app</a>.
        </p>
      </div>
    </div>
  );
}
