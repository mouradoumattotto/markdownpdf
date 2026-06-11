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
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tab !== "preview") return;
    let cancelled = false;
    (async () => {
      const [{ marked }, { default: DOMPurify }] = await Promise.all([
        import("marked"),
        import("dompurify"),
      ]);
      const html = DOMPurify.sanitize(await marked.parse(markdown));
      if (!cancelled) setPreviewHtml(html);
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, markdown]);

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
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-lg border border-neutral-200 p-0.5" role="tablist">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize ${
                tab === t ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
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
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Open .md file
          </button>
          <button
            onClick={generate}
            disabled={generating || !markdown.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          spellCheck={false}
          aria-label="Markdown input"
          placeholder="Type or paste your Markdown here…"
          className="h-[28rem] w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm text-neutral-800 focus:border-blue-400 focus:outline-none"
        />
      ) : (
        <div
          className="prose prose-neutral h-[28rem] max-w-none overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs text-neutral-500">
        The PDF is generated locally in your browser — nothing is uploaded to a server.
      </p>
    </div>
  );
}
