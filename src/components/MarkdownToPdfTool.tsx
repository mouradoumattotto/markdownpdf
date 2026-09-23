"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { detectFeatures, type DocFeatures } from "@/lib/markdown-render";
import type { ImageAssets } from "@/lib/markdown-rich";
import { saveBlob } from "@/lib/files";
import { ErrorAlert, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";
import { useMarkdownPreview } from "@/components/useMarkdownPreview";

const SAMPLE = `# Project Proposal

## Overview

This document outlines the plan for the **Q3 launch**. It covers scope, timeline, and *open questions*.

## Goals

1. Ship the new onboarding flow
2. Reduce page load time by 30%
3. Publish updated documentation

### Key features

- [x] Single sign-on support
- [ ] Offline mode with sync
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

// Kept out of the default sample on purpose: diagrams and math pull in
// Mermaid and MathJax (~1.5 MB), which a plain document should never load.
const FEATURE_DEMO = `# Architecture Notes

The request flow, as a Mermaid diagram:

\`\`\`mermaid
flowchart LR
  A[Browser] -->|drops a PDF| B(pdf.js)
  B --> C{Text layer?}
  C -->|yes| D[Structure rebuild]
  C -->|no| E[OCR]
  D --> F[Markdown]
  E --> F
\`\`\`

## The maths

Inline math like $E = mc^2$ sits in the text, and display math gets its own line:

$$
\\int_0^1 x^2 \\, dx = \\frac{1}{3}
$$

## Code, highlighted

\`\`\`python
def tokens(text: str) -> int:
    """Rough estimate: four characters per token."""
    return max(1, len(text) // 4)
\`\`\`

~~Old approach~~ replaced by the new pipeline.
`;

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

type Busy = null | "quick" | "print";

function slugify(title: string | undefined): string {
  return (title?.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "document") + ".pdf";
}

const SCRIPT_NAMES: Record<NonNullable<DocFeatures["complexScript"]>, string> = {
  arabic: "Arabic",
  hebrew: "Hebrew",
  indic: "Indic-script",
  thai: "Thai",
  cjk: "Chinese, Japanese or Korean",
};

const BASE_PARAMS = { tool_name: "markdown-to-pdf", input_format: "md", output_format: "pdf" };

export default function MarkdownToPdfTool() {
  const [markdown, setMarkdown] = useState(SAMPLE);
  const [mobileTab, setMobileTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [theme, setTheme] = useState<"clean" | "serif">("clean");
  const previewRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const assets: ImageAssets = useMemo(() => new Map(images.map((i) => [i.name.toLowerCase(), i.url])), [images]);
  const features = useMemo(() => detectFeatures(markdown), [markdown]);
  const title = useMemo(() => markdown.match(/^#\s+(.+)$/m)?.[1]?.trim(), [markdown]);

  // Revoke local image URLs when the tool unmounts.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => () => imagesRef.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  const hydrate = useMarkdownPreview(markdown, features, assets, previewRef);


  const quickExport = async () => {
    setBusy("quick");
    setError(null);
    setNotice(null);
    track("conversion_start", { ...BASE_PARAMS, export_mode: "quick" });
    try {
      const { convertMarkdownToPdf } = await import("@/lib/markdown-to-pdf");
      const { blob, warnings } = await convertMarkdownToPdf(markdown, { title, assets });
      saveBlob(blob, slugify(title));
      track("conversion_success", { ...BASE_PARAMS, export_mode: "quick" });
      track("output_download", { ...BASE_PARAMS, export_mode: "quick" });
      const notes: string[] = [];
      if (warnings.missingImages.length)
        notes.push(`${warnings.missingImages.length} image(s) could not be embedded (see the preview) and were replaced by their description.`);
      if (warnings.failedDiagrams) notes.push(`${warnings.failedDiagrams} diagram(s) had errors and were kept as code.`);
      if (warnings.failedMath) notes.push(`${warnings.failedMath} formula(s) could not be rendered and were kept as text.`);
      if (warnings.droppedSymbols) notes.push("Emoji are not supported by the quick download and were left out — use Save as PDF to keep them.");
      if (notes.length) setNotice(notes.join(" "));
    } catch (err) {
      console.error(err);
      track("conversion_error", { ...BASE_PARAMS, export_mode: "quick", error_code: "render_failed" });
      setError("PDF generation failed. Try “Save as PDF” instead — it uses your browser's own engine.");
    } finally {
      setBusy(null);
    }
  };

  /**
   * Full-fidelity export through the browser's print engine: vector diagrams
   * and formulas, every script and language, real text. The rendered preview
   * is copied into a print-only container; print CSS hides everything else.
   */
  const printExport = useCallback(() => {
    if (!previewRef.current) return;
    setBusy("print");
    setError(null);
    track("conversion_start", { ...BASE_PARAMS, export_mode: "print" });
    const root = document.createElement("div");
    root.id = "md-print-root";
    const docEl = document.createElement("article");
    docEl.className = `md-doc theme-${theme}`;
    docEl.dir = "auto";
    docEl.innerHTML = previewRef.current.innerHTML;
    root.appendChild(docEl);
    document.body.appendChild(root);
    document.documentElement.classList.add("printing-md");
    const previousTitle = document.title;
    document.title = slugify(title).replace(/\.pdf$/, "");
    const cleanup = () => {
      root.remove();
      document.documentElement.classList.remove("printing-md");
      document.title = previousTitle;
      setBusy(null);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    track("conversion_success", { ...BASE_PARAMS, export_mode: "print" });
    // Let the browser lay out the print container before the dialog opens.
    requestAnimationFrame(() => {
      window.print();
      // Browsers without afterprint (rare) still get their page back.
      setTimeout(() => document.documentElement.classList.contains("printing-md") && cleanup(), 60_000);
    });
  }, [theme, title]);

  const loadFile = (file: File) => {
    track("file_selected", { tool_name: "markdown-to-pdf", input_format: "md" });
    const reader = new FileReader();
    reader.onload = () => setMarkdown(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  const addImages = (files: FileList | null) => {
    if (!files?.length) return;
    const added = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setImages((prev) => {
      const names = new Set(added.map((a) => a.name.toLowerCase()));
      prev.filter((p) => names.has(p.name.toLowerCase())).forEach((p) => URL.revokeObjectURL(p.url));
      return [...prev.filter((p) => !names.has(p.name.toLowerCase())), ...added];
    });
  };

  const removeImage = (name: string) =>
    setImages((prev) => {
      prev.filter((p) => p.name === name).forEach((p) => URL.revokeObjectURL(p.url));
      return prev.filter((p) => p.name !== name);
    });

  const quickBlocked = features.complexScript !== null;
  const summary = [
    features.mermaid && `${features.mermaid} diagram${features.mermaid > 1 ? "s" : ""}`,
    features.math && `${features.math} formula${features.math > 1 ? "s" : ""}`,
    features.images && `${features.images} image${features.images > 1 ? "s" : ""}`,
  ].filter(Boolean);

  return (
    <div className={toolCard}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Mobile-only tab switcher; desktop shows both panes side by side */}
        <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 lg:invisible" role="tablist" aria-label="Editor view">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={mobileTab === t}
              onClick={() => setMobileTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                mobileTab === t ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
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
          <input
            ref={imageRef}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            className="hidden"
            data-testid="image-input"
            onChange={(e) => {
              addImages(e.target.files);
              e.target.value = "";
            }}
          />
          <button type="button" onClick={() => fileRef.current?.click()} className={secondaryButton}>
            Open .md file
          </button>
          <button type="button" onClick={() => imageRef.current?.click()} className={secondaryButton}>
            Add images
          </button>
          <button type="button" onClick={() => setMarkdown(FEATURE_DEMO)} className={secondaryButton}>
            Try diagrams &amp; math
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={mobileTab === "write" ? "block" : "hidden lg:block"}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Markdown</p>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            dir="auto"
            aria-label="Markdown input"
            placeholder="Type or paste your Markdown here…"
            className="h-[30rem] w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm leading-relaxed text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className={mobileTab === "preview" ? "block" : "hidden lg:block"}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Preview</p>
          <div
            ref={previewRef}
            data-testid="md-preview"
            dir="auto"
            className="md-preview prose prose-neutral h-[30rem] max-w-none overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-inner prose-a:text-indigo-600 prose-pre:bg-neutral-100 prose-pre:text-neutral-800"
          />
        </div>
      </div>

      {images.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-neutral-600">Images available to your Markdown by file name:</span>
          {images.map((img) => (
            <span key={img.name} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 font-mono text-xs">
              {img.name}
              <button type="button" onClick={() => removeImage(img.name)} aria-label={`Remove ${img.name}`} className="text-neutral-500 hover:text-red-600">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {hydrate && hydrate.missingImages.length > 0 && (
        <p role="status" className="mt-3 text-sm text-amber-700">
          {hydrate.missingImages.length} image(s) not found:{" "}
          <span className="font-mono">{hydrate.missingImages.slice(0, 3).join(", ")}</span>
          {hydrate.missingImages.length > 3 && "…"}. Use <strong>Add images</strong> to attach local files by the same name.
        </p>
      )}
      {hydrate && hydrate.diagramErrors.length > 0 && (
        <p role="status" className="mt-3 text-sm text-amber-700">
          {hydrate.diagramErrors.length} diagram(s) contain a Mermaid syntax error — see the preview.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-4 border-t border-neutral-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-sm text-neutral-600">
          {summary.length > 0 && <p className="mb-2">This document has {summary.join(", ")}.</p>}
          <label className="inline-flex items-center gap-2">
            Style for “Save as PDF”:
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as "clean" | "serif")}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="clean">Clean (sans-serif)</option>
              <option value="serif">Academic (serif)</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={quickExport}
            disabled={busy !== null || !markdown.trim() || quickBlocked}
            className={quickBlocked ? secondaryButton : primaryButton}
          >
            {busy === "quick" ? "Generating…" : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={printExport}
            disabled={busy !== null || !markdown.trim()}
            className={quickBlocked ? primaryButton : secondaryButton}
          >
            Save as PDF (full fidelity)
          </button>
        </div>
      </div>

      {quickBlocked && (
        <p role="status" className="mt-3 text-sm text-neutral-600">
          {`This document contains ${SCRIPT_NAMES[features.complexScript!]} text, which needs your browser's text engine to lay out correctly. Use `}
          <strong>Save as PDF</strong>, then choose “Save as PDF” as the printer.
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-amber-700">
          {notice}
        </p>
      )}
      {error && <ErrorAlert message={error} />}

      <p className="mt-4 text-xs leading-relaxed text-neutral-500">
        <strong className="text-neutral-700">Download PDF</strong> builds the file instantly, with selectable text.{" "}
        <strong className="text-neutral-700">Save as PDF</strong> opens your browser&apos;s print dialog — pick “Save as
        PDF” — and keeps diagrams and formulas as sharp vector graphics, in any language. Both run entirely in your
        browser; nothing is uploaded.
      </p>
    </div>
  );
}
