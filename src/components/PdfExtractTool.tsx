"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  ProgressBar,
  primaryButton,
  secondaryButton,
  toolCard,
} from "@/components/FileDropzone";
import OcrLanguageSelect, { useStoredOcrLanguage } from "@/components/OcrLanguageSelect";
import PdfPagesView from "@/components/PdfPagesView";

export type ExtractMode = "markdown" | "text";

type Status =
  | { kind: "idle" }
  | { kind: "working"; source: Source; progress: ConversionProgress | null; eta: number | null; sawOcr: boolean }
  | {
      kind: "done";
      file: File;
      ocrPageNumbers: number[];
      fileName: string;
      sourceName: string;
      seconds: number;
      pageCount: number;
      ocrPages: number;
      images: { name: string; blob: Blob }[];
      imagesRequested: boolean;
    }
  | { kind: "error"; message: string };

type Source = { name: string; size: number };

/** Sample PDFs (public/samples) for visitors with no file at hand. */
const SAMPLES = [
  { label: "Two-column article", file: "columns.pdf" },
  { label: "Scanned · OCR", file: "scanned-en.pdf" },
  { label: "Table", file: "table.pdf" },
  { label: "With images", file: "with-images.pdf", images: true, markdownOnly: true },
] as const;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

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
  // Below lg the original and the output share one pane; this picks which.
  const [showOriginal, setShowOriginal] = useState(false);
  const [sampleLoading, setSampleLoading] = useState<string | null>(null);
  const pickerRef = useRef<(() => void) | null>(null);
  const originalScrollRef = useRef<HTMLDivElement>(null);
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
    async (file: File, opts: { extractImages?: boolean } = {}) => {
      const withImages = mode === "markdown" && (opts.extractImages ?? extractImages);
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
      const source = { name: file.name, size: file.size };
      let sawOcr = false;
      setStatus({ kind: "working", source, progress: null, eta: null, sawOcr });
      setOutput("");
      setCopyFailed(false);
      setView("source");
      setShowOriginal(false);
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
          extractImages: withImages,
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
            if (progress.stage !== "extracting") sawOcr = true;
            setStatus({ kind: "working", source, progress, eta, sawOcr });
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
          file,
          ocrPageNumbers: result.ocrPageNumbers,
          fileName: `${baseName(file.name)}.${cfg.ext}`,
          sourceName: file.name,
          seconds: (performance.now() - started) / 1000,
          pageCount: result.pageCount,
          ocrPages: result.ocrPages,
          images: result.images,
          imagesRequested: withImages,
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

  // The header's "Convert a PDF" button opens this picker when we are on the page.
  useEffect(() => {
    const pick = () => {
      if (status.kind === "working") return;
      pickerRef.current?.();
    };
    window.addEventListener("mdpdf:pick", pick);
    return () => window.removeEventListener("mdpdf:pick", pick);
  }, [status.kind]);

  const runSample = async (sample: (typeof SAMPLES)[number]) => {
    setSampleLoading(sample.file);
    try {
      const res = await fetch(`/samples/${sample.file}`);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      await convert(new File([blob], sample.file, { type: "application/pdf" }), {
        extractImages: "images" in sample ? sample.images : undefined,
      });
    } catch {
      setStatus({ kind: "error", message: "The sample could not be loaded. Check your connection and try again." });
    } finally {
      setSampleLoading(null);
    }
  };

  const review = () => {
    if (status.kind !== "done" || status.ocrPageNumbers.length === 0) return;
    setShowOriginal(true);
    // Wait a frame so the pane is displayed (it is hidden on small screens).
    requestAnimationFrame(() => {
      const pane = originalScrollRef.current;
      const target = document.getElementById(`orig-page-${status.ocrPageNumbers[0]}`);
      if (pane && target) pane.scrollTo({ top: target.offsetTop - pane.offsetTop - 12, behavior: "smooth" });
    });
  };

  const working = status.kind === "working";
  const words = output ? output.trim().split(/\s+/).length : 0;
  const progressValue =
    status.kind === "working" && status.progress
      ? (status.progress.page - (status.progress.stage === "extracting" ? 1 : 0.5)) / status.progress.totalPages
      : 0;

  const actions =
    status.kind === "done" ? (
      <>
        <button type="button" onClick={copy} className={`${secondaryButton} flex-1 lg:flex-none`}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
        {status.images.length > 0 ? (
          <>
            <button type="button" onClick={download} className={`${secondaryButton} flex-1 lg:flex-none`}>
              {cfg.download}
            </button>
            <button type="button" onClick={downloadZip} className={`${primaryButton} flex-[1.4] lg:flex-none`}>
              Download .zip (with images)
            </button>
          </>
        ) : (
          <button type="button" onClick={download} className={`${primaryButton} flex-[1.4] lg:flex-none`}>
            {cfg.download}
          </button>
        )}
      </>
    ) : null;

  return (
    <div className={toolCard}>
      <div className={working || done ? "hidden" : ""}>
        <FileDropzone
          accept=".pdf,application/pdf"
          disabled={working}
          onFiles={([f]) => f && convert(f)}
          onDragIntent={prefetch}
          label="Drop your PDF here"
          hint="Free, no page limit · scanned PDFs work too"
          dropAnywhere
          pickerRef={pickerRef}
        />

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <OcrLanguageSelect value={ocrLanguage} onChange={setOcrLanguage} disabled={working} />
          {mode === "markdown" && (
            <label className="inline-flex min-h-10 items-center gap-2 text-sm text-neutral-700">
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

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-sm text-neutral-600">
          <span className="mr-1">No file handy?</span>
          {SAMPLES.filter((x) => mode === "markdown" || !("markdownOnly" in x)).map((x) => (
            <button
              key={x.file}
              type="button"
              onClick={() => runSample(x)}
              onMouseEnter={prefetch}
              disabled={Boolean(sampleLoading)}
              className="min-h-9 rounded-full border border-[#d4d4d0] bg-white px-3 py-1.5 font-medium text-ink transition-colors hover:border-brand-400 hover:text-brand-700 disabled:opacity-60"
            >
              {sampleLoading === x.file ? "Loading…" : x.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-[13px] font-semibold text-[oklch(0.45_0.12_150)]">
          ● Processed in your browser — your file never leaves your device.
        </p>
      </div>

      {status.kind === "working" && (
        <div className="mx-auto max-w-xl py-2 sm:py-6" aria-live="polite">
          <div className="flex items-center gap-3.5">
            <span className="flex h-[52px] w-11 shrink-0 items-center justify-center rounded-md bg-brand-50 font-mono text-[11px] font-semibold text-brand-700">
              PDF
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-ink">{status.source.name}</p>
              <p className="text-[13px] text-neutral-500">
                {formatSize(status.source.size)}
                {status.progress && ` · ${status.progress.totalPages.toLocaleString()} ${status.progress.totalPages === 1 ? "page" : "pages"}`}
              </p>
            </div>
            <button type="button" onClick={() => abortRef.current?.abort()} className={secondaryButton}>
              Cancel
            </button>
          </div>
          <div className="mt-5 space-y-2">
            <ProgressBar value={progressValue} label="Conversion progress" />
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold text-ink">{stageLabel(status.progress, ocrLanguage)}</span>
              {status.eta !== null && <span className="text-neutral-500">{formatEta(status.eta)}</span>}
            </div>
          </div>
          <ul className="mt-5 space-y-2.5 text-sm">
            <Step state={status.progress ? "done" : "active"}>Opening the PDF</Step>
            <Step state={!status.progress ? "todo" : status.progress.stage === "extracting" ? "active" : "done"}>
              Text, headings and lists
            </Step>
            {status.sawOcr && (
              <Step state={status.progress?.stage === "extracting" ? "done" : "active"}>
                Scanned pages, read with OCR — a few seconds each
              </Step>
            )}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-[13px] font-medium text-[oklch(0.45_0.12_150)]">
            ● Running on your device — your file is never uploaded.
          </p>
        </div>
      )}

      {status.kind === "error" && <ErrorAlert message={status.message} />}

      {status.kind === "done" && (
        <div ref={resultRef} className="scroll-mt-20 animate-fade-up">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pb-3">
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatus({ kind: "idle" });
                  setOutput("");
                  pickerRef.current?.();
                }}
                className={secondaryButton}
              >
                New file
              </button>
              <div className="hidden gap-2 lg:flex">{actions}</div>
            </div>
          </div>

          {status.ocrPageNumbers.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-amber-50 px-4 py-2.5 text-sm">
              <span className="font-bold text-amber-800">
                {status.ocrPageNumbers.length} {status.ocrPageNumbers.length === 1 ? "page" : "pages"} to check
              </span>
              <span className="text-neutral-600">
                {status.ocrPageNumbers.length === 1 ? "Page" : "Pages"} {listPages(status.ocrPageNumbers)}{" "}
                {status.ocrPageNumbers.length === 1 ? "was" : "were"} scanned and read with OCR.
              </span>
              <button type="button" onClick={review} className="ml-auto font-semibold text-ink hover:text-brand-700">
                Review →
              </button>
            </div>
          )}

          {copyFailed && (
            <p role="status" className="mb-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
              Your browser blocked clipboard access. Use Download, or select the text below and copy it.
            </p>
          )}

          {/* Small screens: one pane at a time. */}
          <div
            role="tablist"
            aria-label="Result view"
            className={`mb-3 grid rounded-[10px] bg-[#ececea] p-[3px] text-sm font-semibold lg:hidden ${mode === "markdown" ? "grid-cols-3" : "grid-cols-2"}`}
          >
            {(
              [
                ["original", "Original"],
                ["source", cfg.label],
                ...(mode === "markdown" ? [["preview", "Preview"]] : []),
              ] as [string, string][]
            ).map(([key, name]) => {
              const selected = key === "original" ? showOriginal : !showOriginal && view === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setShowOriginal(key === "original");
                    if (key !== "original") setView(key as "source" | "preview");
                  }}
                  className={`min-h-10 rounded-lg px-2 ${selected ? "bg-white text-ink shadow-sm" : "text-neutral-600"}`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <section
              aria-label="Original PDF"
              className={`${showOriginal ? "flex" : "hidden"} flex-col overflow-hidden rounded-xl border border-line lg:flex`}
            >
              <div className="hidden items-center border-b border-line bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500 lg:flex">
                Original
                <span className="ml-auto font-medium normal-case tracking-normal">
                  {status.pageCount.toLocaleString()} {status.pageCount === 1 ? "page" : "pages"}
                </span>
              </div>
              <PdfPagesView
                file={status.file}
                flagged={status.ocrPageNumbers}
                scrollRef={originalScrollRef}
                className="h-[60vh] lg:h-[34rem]"
              />
            </section>

            <section
              aria-label={`Converted ${cfg.label}`}
              className={`${showOriginal ? "hidden" : "flex"} flex-col overflow-hidden rounded-xl border border-line bg-white lg:flex`}
            >
              <div className="flex flex-wrap items-center gap-1 border-b border-line px-2.5 py-2 text-[13px] font-semibold">
                <div className="hidden gap-1 lg:flex">
                  {mode === "markdown" ? (
                    (["source", "preview"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={view === v}
                        onClick={() => setView(v)}
                        className={`rounded-md px-3 py-1.5 ${view === v ? "bg-ink text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
                      >
                        {v === "source" ? "Markdown" : "Preview"}
                      </button>
                    ))
                  ) : (
                    <span className="rounded-md bg-ink px-3 py-1.5 text-white">Text</span>
                  )}
                </div>
                <span className="px-1.5 py-1.5 text-xs font-medium text-emerald-700">✓ Conversion complete</span>
                <span className="ml-auto px-1.5 py-1.5 text-xs font-medium text-neutral-500" title="Rough estimate: 4 characters per token">
                  ~{Math.max(1, Math.round(output.length / 4)).toLocaleString()} tokens
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
                  className="block h-[60vh] w-full resize-none bg-white px-4 py-4 font-mono text-[13px] leading-[1.75] text-neutral-800 focus:outline-none sm:px-6 lg:h-[34rem]"
                />
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-[13px] text-neutral-500">
                <span>Edit the text above before you copy or download.</span>
                <Link href="/contact" className="ml-auto font-semibold text-ink hover:text-brand-700">
                  Something off? Tell us
                </Link>
              </div>
            </section>
          </div>

          {/* Phones: the two actions stay under the thumb. */}
          <div className="sticky bottom-0 z-10 -mx-3 mt-3 flex gap-2 border-t border-line bg-white/95 px-3 py-3 backdrop-blur lg:hidden">
            {actions}
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ state, children }: { state: "done" | "active" | "todo"; children: React.ReactNode }) {
  return (
    <li
      className={`flex gap-2.5 ${state === "active" ? "font-semibold text-ink" : state === "done" ? "text-neutral-600" : "text-neutral-400"}`}
    >
      <span
        aria-hidden
        className={state === "done" ? "font-bold text-[oklch(0.48_0.13_150)]" : state === "active" ? "text-brand-600" : ""}
      >
        {state === "done" ? "✓" : state === "active" ? "●" : "○"}
      </span>
      {children}
    </li>
  );
}

/** "3", "3 and 7", "3, 7 and 9" — capped so a scanned book does not print 300 numbers. */
function listPages(pages: number[]): string {
  if (pages.length > 6) return `${pages.slice(0, 5).join(", ")} and ${pages.length - 5} more`;
  if (pages.length === 1) return String(pages[0]);
  return `${pages.slice(0, -1).join(", ")} and ${pages[pages.length - 1]}`;
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
