"use client";

import { useRef, useState } from "react";
import { formatBytes } from "@/lib/ai-limits";
import { durationBucket, pageBucket, sizeBucket, track } from "@/lib/analytics";
import { CancelledError, baseName, classifyPdfError, saveBlob, sniffMessage, sniffPdf } from "@/lib/files";
import { DEFAULT_OCR_LANGUAGE, OCR_LANGUAGES, type OcrLanguage } from "@/lib/ocr";
import type { ConversionProgress } from "@/lib/pdf-to-markdown";
import FileDropzone, { ErrorAlert, PrivacyNote, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";
import OcrLanguageSelect, { useStoredOcrLanguage } from "@/components/OcrLanguageSelect";

const TOOL = "pdf-to-epub";
const BASE = { tool_name: TOOL, input_format: "pdf", output_format: "epub" };

/** OCR language codes (ISO 639-2) to the BCP 47 tags an EPUB declares. */
const BCP47: Record<OcrLanguage, string> = { eng: "en", fra: "fr", spa: "es", deu: "de", por: "pt", ita: "it", ara: "ar" };

type State =
  | { kind: "idle" }
  | { kind: "working"; progress: ConversionProgress | null; building?: boolean }
  | { kind: "done"; bytes: Uint8Array; name: string; title: string; pages: number; chapters: number; ocrPages: number }
  | { kind: "error"; message: string };

function label(state: Extract<State, { kind: "working" }>, language: OcrLanguage): string {
  const p = state.progress;
  if (state.building) return "Building the e-book…";
  if (!p) return "Reading the PDF…";
  if (p.stage === "loading_ocr") {
    const name = OCR_LANGUAGES.find((l) => l.code === language)?.label ?? "OCR";
    return `Loading the ${name} OCR engine…`;
  }
  if (p.stage === "ocr") return `Recognising scanned page ${p.page} of ${p.totalPages}…`;
  return `Reading page ${p.page} of ${p.totalPages}…`;
}

const loadLibs = () => Promise.all([import("@/lib/pdf-to-markdown"), import("@/lib/epub")]);

export default function PdfToEpubTool() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [language, setLanguage] = useState<OcrLanguage>(DEFAULT_OCR_LANGUAGE);
  useStoredOcrLanguage(setLanguage);
  const abortRef = useRef<AbortController | null>(null);

  const run = async (file: File) => {
    const params = { ...BASE, file_size_bucket: sizeBucket(file.size) };
    track("file_selected", params);
    const sniff = await sniffPdf(file);
    if (sniff !== "ok") {
      const e = sniffMessage(sniff);
      track("conversion_error", { ...params, error_code: e.code });
      setState({ kind: "error", message: e.message });
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ kind: "working", progress: null });
    track("conversion_start", params);
    const started = performance.now();
    try {
      const [{ convertPdfToMarkdown }, { markdownToEpub }] = await loadLibs();
      const result = await convertPdfToMarkdown(file, {
        ocrLanguage: language,
        signal: controller.signal,
        onProgress: (progress) => setState({ kind: "working", progress }),
      });
      const done = {
        ...params,
        page_count_bucket: pageBucket(result.pageCount),
        ocr_used: result.ocrPages > 0,
        ocr_language: result.ocrPages > 0 ? language : undefined,
        duration_bucket: durationBucket(performance.now() - started),
      };
      if (!result.output.trim()) {
        track("conversion_error", { ...done, error_code: "no_text_found" });
        setState({ kind: "error", message: "No text could be found in this PDF, so there is nothing to put in an e-book." });
        return;
      }
      setState({ kind: "working", progress: null, building: true });
      const epub = await markdownToEpub(result.output, { fallbackTitle: baseName(file.name), language: BCP47[language] });
      track("conversion_success", done);
      setState({
        kind: "done",
        bytes: epub.bytes,
        name: `${baseName(file.name)}.epub`,
        title: epub.title,
        pages: result.pageCount,
        chapters: epub.chapters,
        ocrPages: result.ocrPages,
      });
    } catch (err) {
      if (err instanceof CancelledError || controller.signal.aborted) {
        track("conversion_cancel", params);
        setState({ kind: "idle" });
        return;
      }
      console.error(err);
      const e = classifyPdfError(err);
      track("conversion_error", { ...params, error_code: e.code });
      setState({ kind: "error", message: e.message });
    } finally {
      abortRef.current = null;
    }
  };

  const working = state.kind === "working";
  const progressValue =
    state.kind === "working" && state.progress ? state.progress.page / Math.max(1, state.progress.totalPages) : 0;

  return (
    <div className={toolCard}>
      <FileDropzone
        accept=".pdf,application/pdf"
        disabled={working}
        onFiles={([f]) => f && run(f)}
        onDragIntent={() => void loadLibs()}
        label="Drop a PDF to turn into an e-book"
        hint={<PrivacyNote />}
      >
        {state.kind === "working" ? (
          <div className="w-full max-w-sm space-y-4" aria-live="polite">
            <p className="font-semibold text-neutral-900">{label(state, language)}</p>
            {state.progress && <ProgressBar value={progressValue} label="Conversion progress" />}
          </div>
        ) : undefined}
      </FileDropzone>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <OcrLanguageSelect value={language} onChange={setLanguage} disabled={working} label="Language of the document" />
        {working && (
          <button type="button" onClick={() => abortRef.current?.abort()} className={secondaryButton}>
            Cancel
          </button>
        )}
      </div>

      {state.kind === "error" && <ErrorAlert message={state.message} />}

      {state.kind === "done" && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4" data-testid="pdf-epub-done">
          <p className="font-semibold text-emerald-900">“{state.title}” is ready as an EPUB</p>
          <p className="mt-1 text-sm text-emerald-800">
            {state.pages} {state.pages === 1 ? "page" : "pages"} → {state.chapters}{" "}
            {state.chapters === 1 ? "chapter" : "chapters"} · {formatBytes(state.bytes.byteLength)}
            {state.ocrPages > 0 && ` · ${state.ocrPages} scanned ${state.ocrPages === 1 ? "page" : "pages"} read with OCR`}
          </p>
          <button
            type="button"
            onClick={() => {
              saveBlob(new Blob([state.bytes as BlobPart], { type: "application/epub+zip" }), state.name);
              track("output_download", BASE);
            }}
            className={`${primaryButton} mt-3`}
          >
            Download {state.name}
          </button>
        </div>
      )}
    </div>
  );
}
