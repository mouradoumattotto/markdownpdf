"use client";

import { useRef, useState } from "react";
import { formatBytes } from "@/lib/ai-limits";
import { durationBucket, pageBucket, sizeBucket, track } from "@/lib/analytics";
import { CancelledError, baseName, classifyPdfError, saveBlob, sniffMessage, sniffPdf } from "@/lib/files";
import { DEFAULT_OCR_LANGUAGE, OCR_LANGUAGES, type OcrLanguage } from "@/lib/ocr";
import type { OcrPdfProgress } from "@/lib/pdf-ocr";
import FileDropzone, { ErrorAlert, PrivacyNote, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";
import OcrLanguageSelect, { useStoredOcrLanguage } from "@/components/OcrLanguageSelect";

const TOOL = "ocr-pdf";

type State =
  | { kind: "idle" }
  | { kind: "working"; progress: OcrPdfProgress | null }
  | { kind: "done"; bytes: Uint8Array; name: string; pages: number; ocrPages: number; words: number; size: number }
  | { kind: "error"; message: string };

function label(p: OcrPdfProgress | null, language: OcrLanguage): string {
  if (!p) return "Reading the PDF…";
  if (p.stage === "loading_ocr") {
    const name = OCR_LANGUAGES.find((l) => l.code === language)?.label ?? "OCR";
    return `Loading the ${name} OCR engine…`;
  }
  if (p.stage === "ocr") return `Recognising page ${p.page} of ${p.totalPages}…`;
  if (p.stage === "assembling") return "Writing the searchable PDF…";
  return `Checking page ${p.page} of ${p.totalPages}…`;
}

export default function OcrPdfTool() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [language, setLanguage] = useState<OcrLanguage>(DEFAULT_OCR_LANGUAGE);
  useStoredOcrLanguage(setLanguage);
  const abortRef = useRef<AbortController | null>(null);

  const run = async (file: File) => {
    const params = { tool_name: TOOL, input_format: "pdf", output_format: "pdf", file_size_bucket: sizeBucket(file.size) };
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
    track("ocr_start", { ...params, ocr_language: language });
    const started = performance.now();
    try {
      const { makeSearchablePdf } = await import("@/lib/pdf-ocr");
      const result = await makeSearchablePdf(file, {
        language,
        signal: controller.signal,
        onProgress: (progress) => setState({ kind: "working", progress }),
      });
      const done = {
        ...params,
        page_count_bucket: pageBucket(result.pageCount),
        ocr_used: result.ocrPages > 0,
        ocr_language: language,
        duration_bucket: durationBucket(performance.now() - started),
      };
      track("ocr_complete", done);
      if (result.ocrPages === 0) {
        track("conversion_error", { ...done, error_code: "no_text_found" });
        setState({
          kind: "error",
          message:
            "Every page of this PDF already contains real text — it is searchable as it is. Use PDF to Text or PDF to Markdown if you want the text out of it.",
        });
        return;
      }
      track("conversion_success", done);
      setState({
        kind: "done",
        bytes: result.bytes,
        name: `${baseName(file.name)}-searchable.pdf`,
        pages: result.pageCount,
        ocrPages: result.ocrPages,
        words: result.wordsAdded,
        size: result.bytes.byteLength,
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
    working && state.progress ? state.progress.page / Math.max(1, state.progress.totalPages) : 0;

  return (
    <div className={toolCard}>
      <FileDropzone
        accept=".pdf,application/pdf"
        disabled={working}
        onFiles={([f]) => f && run(f)}
        onDragIntent={() => void import("@/lib/pdf-ocr")}
        label="Drop a scanned PDF"
        hint={<PrivacyNote />}
      >
        {working ? (
          <div className="w-full max-w-sm space-y-4" aria-live="polite">
            <p className="font-semibold text-neutral-900">{label(state.progress, language)}</p>
            {state.progress && <ProgressBar value={progressValue} label="OCR progress" />}
            <p className="text-xs text-neutral-500">Pages that already contain text are kept exactly as they are.</p>
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
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4" data-testid="ocr-done">
          <p className="font-semibold text-emerald-900">Your searchable PDF is ready</p>
          <p className="mt-1 text-sm text-emerald-800">
            {state.ocrPages} of {state.pages} {state.pages === 1 ? "page" : "pages"} recognised ·{" "}
            {state.words.toLocaleString()} words added · {formatBytes(state.size)}. The pages look exactly the same;
            the text sits invisibly on top.
          </p>
          <button
            type="button"
            onClick={() => {
              saveBlob(new Blob([state.bytes as BlobPart], { type: "application/pdf" }), state.name);
              track("output_download", { tool_name: TOOL, input_format: "pdf", output_format: "pdf" });
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
