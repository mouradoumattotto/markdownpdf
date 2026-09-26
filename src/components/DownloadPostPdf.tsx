"use client";

import Link from "next/link";
import { useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Renders the article itself as a PDF, in the browser, using the same converter
 * that powers /md-to-pdf. Serves the "<topic> pdf" search intent — the
 * reader wants the page as a file — and demonstrates the tool on real content.
 */
export default function DownloadPostPdf({
  markdown,
  title,
  filename,
}: {
  markdown: string;
  title: string;
  filename: string;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setGenerating(true);
    setError(null);
    try {
      const [{ convertMarkdownToPdf }, { saveBlob }] = await Promise.all([
        import("@/lib/markdown-to-pdf"),
        import("@/lib/files"),
      ]);
      const { blob } = await convertMarkdownToPdf(`# ${title}\n\n${markdown}`, { title });
      saveBlob(blob, `${filename}.pdf`);
      track("output_download", { tool_name: "blog-post-pdf", input_format: "md", output_format: "pdf" });
    } catch (err) {
      console.error(err);
      setError("PDF generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <aside className="mt-10 rounded-xl border border-indigo-100 bg-indigo-50 p-6">
      <p className="font-semibold text-neutral-900">Want this as a PDF?</p>
      <p className="mt-1 text-sm text-neutral-600">
        Generated in your browser — the page never leaves your device.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={download}
          disabled={generating}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {generating ? "Generating…" : "Download as PDF"}
        </button>
        <span className="text-sm text-neutral-600">
          Built with our free{" "}
          <Link href="/md-to-pdf" className="font-medium text-indigo-600 hover:underline">
            Markdown to PDF
          </Link>{" "}
          converter.
        </span>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </aside>
  );
}
