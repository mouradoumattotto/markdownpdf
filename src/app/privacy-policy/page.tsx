import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "MarkdownPDF privacy policy: files are processed locally in your browser and never uploaded. Details on analytics, advertising, cookies and local storage.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-neutral-900">Privacy Policy</h1>
      <div className="prose prose-neutral mt-6 max-w-none">
        <p>
          <em>Last updated: September 23, 2026</em>
        </p>
        <p>
          This Privacy Policy explains how MarkdownPDF (&quot;we&quot;, &quot;us&quot;) handles
          information when you use markdownpdf.app (the &quot;Site&quot;).
        </p>

        <h2>1. Your files never leave your device</h2>
        <p>
          Every tool on this Site — converters, OCR, PDF splitting, merging and metadata tools —
          processes files locally in your web browser using JavaScript and WebAssembly. The
          documents you use them on are{" "}
          <strong>never uploaded to, transmitted through, or stored on our servers</strong>, or
          anyone else&apos;s. We have no access to their contents at any time.
        </p>
        <p>
          The code that does this work, including the OCR engine and its language files, is
          downloaded from markdownpdf.app itself, like any other part of a web page. No
          third-party service is involved in processing your files. Every page carries a
          Content-Security-Policy that limits where it can send data; see{" "}
          <a href="/how-it-works">how it works</a> for how to verify this yourself.
        </p>
        <p>
          If Markdown you open or paste references images by URL, your browser loads those images
          from their host in order to display or export them, as any Markdown preview would.
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
          We use Google Analytics 4 to understand aggregate site usage (page views, referrers,
          approximate location, device type) and how the tools perform: coarse events such as
          &ldquo;a conversion started&rdquo; or &ldquo;it succeeded&rdquo;, with the file format
          and a size range (for example &ldquo;1&ndash;10 MB&rdquo;). File names, document
          contents and document metadata are never sent. Google Analytics may set cookies to distinguish
          visitors. In the European Economic Area, the United Kingdom, and Switzerland, analytics
          cookies are disabled by default until you give consent (Google Consent Mode); in that
          case only anonymous, cookieless measurement signals are sent. Google Analytics 4 does
          not log or store IP addresses. You can also opt out globally with the{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" rel="nofollow noopener">
            Google Analytics opt-out browser add-on
          </a>
          .
        </p>

        <h2>4. Advertising and cookies</h2>
        <p>
          The Site may display advertising provided by Google AdSense. When ads are shown, Google
          and its partners may use cookies and similar technologies to serve ads based on your
          prior visits to this and other websites. Google&apos;s use of advertising cookies enables
          it and its partners to serve ads based on your visits to this Site and/or other sites on
          the Internet. Ads are displayed next to the tools, never inside them, and have no access
          to the files you process.
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
          . Before any advertising cookies are set for visitors in the European Economic Area, the
          United Kingdom and Switzerland, a consent choice is requested through a Google-certified
          consent management platform, in accordance with the GDPR and ePrivacy rules.
        </p>
        <h2>5. Storage on your device</h2>
        <p>
          A few things are kept in your browser&apos;s local storage so you do not have to set them
          again: the OCR language you last chose, the AI tool selected in Split PDF for AI, and the
          document you are writing in the Markdown editor, which is autosaved there so it survives a
          reload. They stay on your device, are never sent to us, and are removed when you clear
          your browser&apos;s site data.
        </p>
        <h2>6. Data retention</h2>
        <p>
          Because converted files never reach our servers, there is nothing for us to retain or
          delete. Server logs maintained by our hosting provider are kept for a limited period for
          security purposes.
        </p>

        <h2>7. Children&apos;s privacy</h2>
        <p>
          The Site is a general-audience tool and is not directed at children under 13. We do not
          knowingly collect personal information from children.
        </p>

        <h2>8. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. Changes will be posted on this page with an
          updated &quot;Last updated&quot; date.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions about this policy? Email us at{" "}
          <a href="mailto:contact@markdownpdf.app">contact@markdownpdf.app</a>.
        </p>
      </div>
    </div>
  );
}
