"use client";

import { useEffect, useRef, useState } from "react";

const SAMPLE = `# Project Proposal

## Overview

This document outlines the plan for the **Q3 launch**. It covers scope, timeline, and *open questions*.

## Goals

1. Ship the new onboarding flow
2. Reduce page load time by 30%
3. Publish updated documentation

### Key features

- Single sign-on support
- Offline mode with sync
- \`/export\` API endpoint

> Note: dates below are tentative and subject to review.

| Milestone | Owner | Date |
| --- | --- | --- |
| Design freeze | Dana | July 4 |
| Beta release | Sam | August 1 |
| Launch | Team | September 12 |

\`\`\`js
// Example usage
const result = await convert("document.md");
console.log(result.pages);
\`\`\`

Questions? See the [documentation](https://example.com/docs) or contact the team.
`;

export default function MarkdownToPdfTool() {
  const [markdown, setMarkdown] = useState(SAMPLE);
  const [previewHtml, setPreviewHtml] = useState("");
  const [mobileTab, setMobileTab] = useState<"write" | "preview">("write");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Live preview, debounced so typing stays smooth.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const [{ marked }, { default: DOMPurify }] = await Promise.all([
        import("marked"),
        import("dompurify"),
      ]);
      const html = DOMPurify.sanitize(await marked.parse(markdown));
      if (!cancelled) setPreviewHtml(html);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [markdown]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const { convertMarkdownToPdf } = await import("@/lib/markdown-to-pdf");
      const titleMatch = markdown.match(/^#\s+(.+)$/m);
      const blob = await convertMarkdownToPdf(markdown, titleMatch?.[1]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (titleMatch?.[1]?.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "document") + ".pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("PDF generation failed. Please check your Markdown and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setMarkdown(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-lg shadow-neutral-900/5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Mobile-only tab switcher; desktop shows both panes side by side */}
        <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 lg:invisible" role="tablist">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={mobileTab === t}
              onClick={() => setMobileTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                mobileTab === t
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadFile(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Open .md file
          </button>
          <button
            onClick={generate}
            disabled={generating || !markdown.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/30 transition-all hover:shadow-md hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
          >
            {generating ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={mobileTab === "write" ? "block" : "hidden lg:block"}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Markdown
          </p>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            aria-label="Markdown input"
            placeholder="Type or paste your Markdown here…"
            className="h-[30rem] w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm leading-relaxed text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className={mobileTab === "preview" ? "block" : "hidden lg:block"}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Preview
          </p>
          <div
            className="prose prose-neutral h-[30rem] max-w-none overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-inner prose-a:text-indigo-600"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mt-0.5 h-4 w-4 shrink-0" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </p>
      )}

      <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-neutral-500">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 text-emerald-500" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        The PDF is generated locally in your browser — nothing is uploaded to a server.
      </p>
    </div>
  );
}
