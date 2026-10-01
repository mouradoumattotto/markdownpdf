"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConversionProgress } from "@/lib/pdf-to-markdown";
import { DEFAULT_OCR_LANGUAGE, OCR_LANGUAGES, type OcrLanguage } from "@/lib/ocr";
import {
  durationBucket,
  pageBucket,
  sizeBucket,
  track,
  type ToolEventParams,
} from "@/lib/analytics";
import {
  CancelledError,
  baseName,
  classifyPdfError,
  saveBlob,
  sniffMessage,
  sniffPdf,
} from "@/lib/files";
import FileDropzone, {
  ErrorAlert,
  PrivacyNote,
  ProgressBar,
  primaryButton,
  secondaryButton,
  toolCard,
} from "@/components/FileDropzone";
import OcrLanguageSelect, { useStoredOcrLanguage } from "@/components/OcrLanguageSelect";

export type ExtractMode = "markdown" | "text";

type Status =
  | { kind: "idle" }
  | { kind: "working"; progress: ConversionProgress | null; eta: number | null }
  | {
      kind: "done";
      fileName: string;
      sourceName: string;
      seconds: number;
      pageCount: number;
      ocrPages: number;
      images: { name: string; blob: Blob }[];
      imagesRequested: boolean;
    }
  | { kind: "error"; message: string };

const MODE = {
  markdown: { tool: "pdf-to-markdown", ext: "md", mime: "text/markdown;charset=utf-8", label: "Markdown", download: "Download .md" },
  text: { tool: "pdf-to-text", ext: "txt", mime: "text/plain;charset=utf-8", label: "Text", download: "Download .txt" },
} as const;

function formatEta(seconds: number): string {
  if (seconds < 60) return `about ${Math.max(5, Math.round(seconds / 5) * 5)} s left`;
  return `about ${Math.round(seconds / 60)} min left`;
}

function stageLabel(p: ConversionProgress | null, language: OcrLanguage): string {
  if (!p) return "Reading PDF…";
  if (p.stage === "loading_ocr") {
    const name = OCR_LANGUAGES.find((l) => l.code === language)?.label ?? "OCR";
    return `Scanned page found — loading the ${name} OCR engine…`;
  }
  if (p.stage === "ocr") return `Running OCR on page ${p.page} of ${p.totalPages}…`;
  return `Extracting text — page ${p.page} of ${p.totalPages}`;
}

export default function PdfExtractTool({ mode = "markdown" }: { mode?: ExtractMode }) {
  const cfg = MODE[mode];
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [ocrLanguage, setOcrLanguage] = useState<OcrLanguage>(DEFAULT_OCR_LANGUAGE);
  const [extractImages, setExtractImages] = useState(false);
  const [view, setView] = useState<"source" | "preview">("source");
  useStoredOcrLanguage(setOcrLanguage);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const baseParams = useRef<ToolEventParams>({ tool_name: cfg.tool });

  // Warm the heavy modules the moment a file approaches the drop zone.
  const prefetch = useCallback(() => {
    void import("@/lib/pdf-to-markdown");
    void import("@/lib/pdfjs").then((m) => m.loadPdfjs());
  }, []);

  const convert = useCallback(
    async (file: File) => {
      const params: ToolEventParams = {
        tool_name: cfg.tool,
        input_format: "pdf",
        output_format: cfg.ext,
        file_size_bucket: sizeBucket(file.size),
      };
      baseParams.current = params;
      track("file_selected", params);

      const sniff = await sniffPdf(file);
      if (sniff !== "ok") {
        const e = sniffMessage(sniff);
        track("conversion_error", { ...params, error_code: e.code });
        setStatus({ kind: "error", message: e.message });
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setStatus({ kind: "working", progress: null, eta: null });
      setOutput("");
      setCopyFailed(false);
      setView("source");
      track("conversion_start", params);

      const started = performance.now();
      let firstPageAt = 0;
      let ocrTracked = false;

      try {
        const lib = await import("@/lib/pdf-to-markdown");
        const run = mode === "markdown" ? lib.convertPdfToMarkdown : lib.convertPdfToText;
        const result = await run(file, {
          signal: controller.signal,
          ocrLanguage,
          extractImages: mode === "markdown" && extractImages,
          onProgress: (progress) => {
            if (progress.stage === "loading_ocr" && !ocrTracked) {
              ocrTracked = true;
              track("ocr_start", { ...params, ocr_language: ocrLanguage });
            }
            const now = performance.now();
            if (progress.page === 1 && !firstPageAt) firstPageAt = now;
            let eta: number | null = null;
            const done = progress.page - 1;
            if (done >= 2 && firstPageAt) {
              const perPage = (now - firstPageAt) / done;
              const remaining = (perPage * (progress.totalPages - done)) / 1000;
              eta = remaining > 4 ? remaining : null;
            }
            setStatus({ kind: "working", progress, eta });
          },
        });

        const doneParams: ToolEventParams = {
          ...params,
          page_count_bucket: pageBucket(result.pageCount),
          ocr_used: result.ocrPages > 0,
          ocr_language: result.ocrPages > 0 ? ocrLanguage : undefined,
          duration_bucket: durationBucket(performance.now() - started),
        };
        baseParams.current = doneParams;
        if (result.ocrPages > 0) track("ocr_complete", doneParams);

        if (!result.output.trim()) {
          track("conversion_error", { ...doneParams, error_code: "no_text_found" });
          setStatus({
            kind: "error",
            message:
              "No text could be found in this PDF, even with OCR. It may contain only images or graphics, or text in a language other than the one selected.",
          });
          return;
        }
        track("conversion_success", doneParams);
        setOutput(result.output);
        setStatus({
          kind: "done",
          fileName: `${baseName(file.name)}.${cfg.ext}`,
          sourceName: file.name,
          seconds: (performance.now() - started) / 1000,
          pageCount: result.pageCount,
          ocrPages: result.ocrPages,
          images: result.images,
          imagesRequested: mode === "markdown" && extractImages,
        });
      } catch (err) {
        if (err instanceof CancelledError || controller.signal.aborted) {
          track("conversion_cancel", params);
          setStatus({ kind: "idle" });
          return;
        }
        console.error(err);
        const e = classifyPdfError(err);
        track("conversion_error", { ...params, error_code: e.code });
        setStatus({ kind: "error", message: e.message });
      } finally {
        abortRef.current = null;
      }
    },
    [cfg, mode, ocrLanguage, extractImages],
  );

  const download = () => {
    const name = status.kind === "done" ? status.fileName : `converted.${cfg.ext}`;
    saveBlob(new Blob([output], { type: cfg.mime }), name);
    track("output_download", baseParams.current);
  };

  /** Markdown plus an images/ folder, the layout static-site generators and Git repos expect. */
  const downloadZip = async () => {
    if (status.kind !== "done") return;
    const { zipParts } = await import("@/lib/pdf-split");
    const files = [
      { name: status.fileName, bytes: new TextEncoder().encode(output) },
      ...(await Promise.all(
        status.images.map(async (i) => ({ name: `images/${i.name}`, bytes: new Uint8Array(await i.blob.arrayBuffer()) })),
      )),
    ];
    saveBlob(await zipParts(files), status.fileName.replace(/\.md$/, ".zip"));
    track("output_download", { ...baseParams.current, output_format: "zip" });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track("output_copy", baseParams.current);
    } catch {
      // Keep the result on screen — only the copy shortcut failed.
      setCopyFailed(true);
    }
  };

  // On a phone the result lands below the fold, under the drop zone: bring it up.
  const done = status.kind === "done";
  useEffect(() => {
    const el = resultRef.current;
    if (!done || !el) return;
    if (el.getBoundingClientRect().top > window.innerHeight * 0.6) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [done]);

  const working = status.kind === "working";
  const words = output ? output.trim().split(/\s+/).length : 0;
  const progressValue =
    status.kind === "working" && status.progress
      ? (status.progress.page - (status.progress.stage === "extracting" ? 1 : 0.5)) / status.progress.totalPages
      : 0;

  return (
    <div className={toolCard}>
      <FileDropzone
        accept=".pdf,application/pdf"
        disabled={working}
        onFiles={([f]) => f && convert(f)}
        onDragIntent={prefetch}
        label="Drop your PDF here"
        hint={<PrivacyNote />}
      >
        {working ? (
          <div className="w-full max-w-sm space-y-4" aria-live="polite">
            <span className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-brand-600 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-7 w-7" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </span>
            <p className="font-semibold text-neutral-900">{stageLabel(status.progress, ocrLanguage)}</p>
            {status.progress && <ProgressBar value={progressValue} label="Conversion progress" />}
            {status.eta !== null && <p className="text-xs text-neutral-500">{formatEta(status.eta)}</p>}
            {status.progress?.stage !== "extracting" && status.progress && (
              <p className="text-xs text-neutral-500">Scanned pages take a few seconds each.</p>
            )}
          </div>
        ) : undefined}
      </FileDropzone>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <OcrLanguageSelect value={ocrLanguage} onChange={setOcrLanguage} disabled={working} />
          {mode === "markdown" && (
            <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={extractImages}
                onChange={(e) => setExtractImages(e.target.checked)}
                disabled={working}
                className="h-4 w-4 accent-brand-600"
              />
              Extract images
            </label>
          )}
        </div>
        {working && (
          <button type="button" onClick={() => abortRef.current?.abort()} className={secondaryButton}>
            Cancel
          </button>
        )}
      </div>

      {status.kind === "error" && <ErrorAlert message={status.message} />}

      {status.kind === "done" && (
        <div ref={resultRef} className="mt-4 scroll-mt-20 animate-fade-up overflow-hidden rounded-xl border border-line sm:mt-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line bg-white px-3 py-3 sm:px-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-ink" title={status.sourceName}>
                {status.sourceName}
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                {status.pageCount.toLocaleString()} {status.pageCount === 1 ? "page" : "pages"}
                {status.ocrPages > 0 && ` (${status.ocrPages} via OCR)`} · converted in{" "}
                {status.seconds.toFixed(1)} s · {words.toLocaleString()} words
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button type="button" onClick={copy} className={`${secondaryButton} flex-1 sm:flex-none`}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
              {status.images.length > 0 ? (
                <>
                  <button type="button" onClick={download} className={`${secondaryButton} flex-1 sm:flex-none`}>
                    {cfg.download}
                  </button>
                  <button type="button" onClick={downloadZip} className={`${primaryButton} flex-1 sm:flex-none`}>
                    Download .zip (with images)
                  </button>
                </>
              ) : (
                <button type="button" onClick={download} className={`${primaryButton} flex-1 sm:flex-none`}>
                  {cfg.download}
                </button>
              )}
            </div>
          </div>
          {copyFailed && (
            <p role="status" className="border-b border-line bg-amber-50 px-4 py-2 text-sm text-amber-700">
              Your browser blocked clipboard access. Use Download, or select the text below and copy it.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1 border-b border-line bg-white px-2.5 py-2 text-[13px] font-semibold">
            {mode === "markdown" ? (
              <div role="tablist" aria-label="Output view" className="flex gap-1">
                {(["source", "preview"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={view === v}
                    onClick={() => setView(v)}
                    className={`rounded-md px-3 py-1.5 ${view === v ? "bg-ink text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
                  >
                    {v === "source" ? "Markdown" : "Preview"}
                  </button>
                ))}
              </div>
            ) : (
              <span className="rounded-md bg-ink px-3 py-1.5 text-white">Text</span>
            )}
            <span className="ml-auto px-2 py-1.5 text-xs font-medium text-emerald-700">
              ✓ Conversion complete · {output.length.toLocaleString()} characters
              {status.images.length > 0 &&
                ` · ${status.images.length} ${status.images.length === 1 ? "image" : "images"}`}
              {status.imagesRequested && status.images.length === 0 && " · no images found"}
            </span>
          </div>
          {view === "preview" && mode === "markdown" ? (
            <MarkdownPreview markdown={output} images={status.images} />
          ) : (
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              spellCheck={false}
              aria-label={`Converted ${cfg.label}`}
              dir="auto"
              className="block h-80 w-full resize-y bg-white px-4 py-4 font-mono text-[13px] leading-[1.75] text-neutral-800 focus:outline-none sm:h-[28rem] sm:px-6"
            />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Rendered view of the result. Extracted images are referenced as images/<name>
 * in the Markdown; they only exist as blobs here, so point those src at object
 * URLs for the preview.
 */
function MarkdownPreview({ markdown, images }: { markdown: string; images: { name: string; blob: Blob }[] }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const urls = new Map(images.map((i) => [`images/${i.name}`, URL.createObjectURL(i.blob)]));
    void import("@/lib/html-markdown").then(async ({ markdownToHtml }) => {
      let body = await markdownToHtml(markdown);
      for (const [path, url] of urls) body = body.split(`src="${path}"`).join(`src="${url}"`);
      if (!cancelled) setHtml(body);
    });
    return () => {
      cancelled = true;
      for (const url of urls.values()) URL.revokeObjectURL(url);
    };
  }, [markdown, images]);

  return html === null ? (
    <p className="h-80 bg-white p-6 text-sm text-neutral-500 sm:h-[28rem]">Rendering preview…</p>
  ) : (
    // Already sanitised by DOMPurify in markdownToHtml.
    <div
      className="prose prose-neutral h-80 max-w-none overflow-auto bg-white px-4 py-4 prose-a:text-brand-600 prose-img:rounded-md sm:h-[28rem] sm:px-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
