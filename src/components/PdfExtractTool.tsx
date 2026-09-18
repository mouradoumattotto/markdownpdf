"use client";

import { useCallback, useRef, useState } from "react";
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
  | { kind: "done"; fileName: string; pageCount: number; ocrPages: number }
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
  useStoredOcrLanguage(setOcrLanguage);
  const abortRef = useRef<AbortController | null>(null);
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
          pageCount: result.pageCount,
          ocrPages: result.ocrPages,
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
    [cfg, mode, ocrLanguage],
  );

  const download = () => {
    const name = status.kind === "done" ? status.fileName : `converted.${cfg.ext}`;
    saveBlob(new Blob([output], { type: cfg.mime }), name);
    track("output_download", baseParams.current);
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
            <span className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
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
        <OcrLanguageSelect value={ocrLanguage} onChange={setOcrLanguage} disabled={working} />
        {working && (
          <button type="button" onClick={() => abortRef.current?.abort()} className={secondaryButton}>
            Cancel
          </button>
        )}
      </div>

      {status.kind === "error" && <ErrorAlert message={status.message} />}

      {status.kind === "done" && (
        <div className="mt-6 animate-fade-up">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-emerald-500" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Conversion complete
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                {status.pageCount.toLocaleString()} {status.pageCount === 1 ? "page" : "pages"}
                {status.ocrPages > 0 && ` (${status.ocrPages} via OCR)`} · {words.toLocaleString()} words ·{" "}
                {output.length.toLocaleString()} characters
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={copy} className={secondaryButton}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button type="button" onClick={download} className={primaryButton}>
                {cfg.download}
              </button>
            </div>
          </div>
          {copyFailed && (
            <p role="status" className="mb-2 text-sm text-amber-700">
              Your browser blocked clipboard access. Use Download, or select the text below and copy it.
            </p>
          )}
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            spellCheck={false}
            aria-label={`Converted ${cfg.label}`}
            dir="auto"
            className="h-80 w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      )}
    </div>
  );
}
