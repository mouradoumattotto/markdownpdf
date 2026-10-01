"use client";

import { useState } from "react";
import { durationBucket, pageBucket, sizeBucket, track, type ToolEventParams } from "@/lib/analytics";
import { CancelledError, classifyPdfError, saveBlob, sniffMessage, sniffPdf } from "@/lib/files";
import { DEFAULT_OCR_LANGUAGE, type OcrLanguage } from "@/lib/ocr";
import type { ObsidianNote } from "@/lib/obsidian";
import FileDropzone, { ErrorAlert, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";
import OcrLanguageSelect, { useStoredOcrLanguage } from "@/components/OcrLanguageSelect";

const TOOL = "pdf-to-obsidian";

type State =
  | { kind: "idle" }
  | { kind: "working"; name: string; page: number; total: number; ocr: boolean }
  | { kind: "done"; note: ObsidianNote; images: { name: string; blob: Blob }[] }
  | { kind: "error"; message: string };

const today = () => new Date().toISOString().slice(0, 10);

export default function ObsidianTool() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [abort, setAbort] = useState<AbortController | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<OcrLanguage>(DEFAULT_OCR_LANGUAGE);
  useStoredOcrLanguage(setOcrLanguage);
  const [withImages, setWithImages] = useState(true);
  const [pageMarkers, setPageMarkers] = useState(true);
  const [tags, setTags] = useState("pdf");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [params, setParams] = useState<ToolEventParams>({ tool_name: TOOL });

  const run = async (file: File) => {
    const p: ToolEventParams = { tool_name: TOOL, input_format: "pdf", output_format: "md", file_size_bucket: sizeBucket(file.size) };
    setParams(p);
    track("file_selected", p);
    const sniff = await sniffPdf(file);
    if (sniff !== "ok") {
      const e = sniffMessage(sniff);
      track("conversion_error", { ...p, error_code: e.code });
      setState({ kind: "error", message: e.message });
      return;
    }
    const controller = new AbortController();
    setAbort(controller);
    setState({ kind: "working", name: file.name, page: 0, total: 0, ocr: false });
    track("conversion_start", p);
    const started = performance.now();
    try {
      const [{ convertPdfToMarkdown }, { toObsidianNote }] = await Promise.all([
        import("@/lib/pdf-to-markdown"),
        import("@/lib/obsidian"),
      ]);
      const r = await convertPdfToMarkdown(file, {
        signal: controller.signal,
        ocrLanguage,
        extractImages: withImages,
        onProgress: (pr) =>
          setState({ kind: "working", name: file.name, page: pr.page, total: pr.totalPages, ocr: pr.stage !== "extracting" }),
      });
      if (!r.output.trim()) throw Object.assign(new Error("no text"), { code: "no_text_found" });
      const note = toObsidianNote({
        markdown: r.output,
        pageOutputs: r.pageOutputs,
        sourceName: file.name,
        pageCount: r.pageCount,
        imageNames: r.images.map((i) => i.name),
        pageMarkers,
        tags: tags.split(/[,\s]+/),
        date: today(),
      });
      const done = {
        ...p,
        page_count_bucket: pageBucket(r.pageCount),
        ocr_used: r.ocrPages > 0,
        duration_bucket: durationBucket(performance.now() - started),
      };
      setParams(done);
      track("conversion_success", done);
      setContent(note.content);
      setState({ kind: "done", note, images: r.images });
    } catch (err) {
      if (err instanceof CancelledError || controller.signal.aborted) {
        track("conversion_cancel", p);
        setState({ kind: "idle" });
        return;
      }
      if ((err as { code?: string }).code === "no_text_found") {
        track("conversion_error", { ...p, error_code: "no_text_found" });
        setState({ kind: "error", message: "No text could be found in this PDF, even with OCR." });
        return;
      }
      const e = classifyPdfError(err);
      track("conversion_error", { ...p, error_code: e.code });
      setState({ kind: "error", message: e.message });
    } finally {
      setAbort(null);
    }
  };

  const downloadNote = () => {
    if (state.kind !== "done") return;
    saveBlob(new Blob([content], { type: "text/markdown;charset=utf-8" }), state.note.fileName);
    track("output_download", params);
  };

  /** The note plus an attachments/ folder — unzip it anywhere inside the vault. */
  const downloadZip = async () => {
    if (state.kind !== "done") return;
    const { zipParts } = await import("@/lib/pdf-split");
    const files = [
      { name: state.note.fileName, bytes: new TextEncoder().encode(content) },
      ...(await Promise.all(
        state.images.map(async (i) => ({
          name: `attachments/${state.note.attachments.get(i.name) ?? i.name}`,
          bytes: new Uint8Array(await i.blob.arrayBuffer()),
        })),
      )),
    ];
    saveBlob(await zipParts(files), state.note.fileName.replace(/\.md$/, ".zip"));
    track("output_download", { ...params, output_format: "zip" });
  };

  const working = state.kind === "working";

  return (
    <div className={toolCard}>
      <div className={working || state.kind === "done" ? "hidden" : ""}>
        <FileDropzone
          accept=".pdf,application/pdf"
          onFiles={([f]) => f && run(f)}
          onDragIntent={() => void import("@/lib/pdf-to-markdown")}
          label="Drop a PDF to turn into a note"
          hint="Your file never leaves your device"
          dropAnywhere
        />
        <div className="mt-4 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
          <label className="flex min-h-10 items-center gap-2">
            <input type="checkbox" checked={withImages} onChange={(e) => setWithImages(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Save images as attachments
          </label>
          <label className="flex min-h-10 items-center gap-2">
            <input type="checkbox" checked={pageMarkers} onChange={(e) => setPageMarkers(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Mark page numbers <span className="text-neutral-500">(hidden %% comments %%)</span>
          </label>
          <label className="flex flex-wrap items-center gap-2">
            Tags
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="pdf, reading"
              className="min-h-10 min-w-0 flex-1 rounded-lg border border-[#d4d4d0] bg-white px-3 text-sm"
            />
          </label>
          <OcrLanguageSelect value={ocrLanguage} onChange={setOcrLanguage} />
        </div>
      </div>

      {state.kind === "working" && (
        <div className="mx-auto max-w-xl space-y-3 py-6" aria-live="polite">
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 truncate font-semibold text-ink">{state.name}</p>
            <button type="button" onClick={() => abort?.abort()} className={secondaryButton}>
              Cancel
            </button>
          </div>
          <ProgressBar value={state.total ? state.page / state.total : 0} label="Conversion progress" />
          <p className="text-sm text-neutral-600">
            {!state.total ? "Opening the PDF…" : `${state.ocr ? "Running OCR on" : "Reading"} page ${state.page} of ${state.total}`}
          </p>
        </div>
      )}

      {state.kind === "error" && <ErrorAlert message={state.message} />}

      {state.kind === "done" && (
        <div className="animate-fade-up">
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-semibold text-ink">{state.note.fileName}</h2>
              <p className="text-xs text-neutral-500">
                {state.images.length > 0
                  ? `${state.images.length} ${state.images.length === 1 ? "attachment" : "attachments"} · unzip into your vault`
                  : "Save it into your vault"}
              </p>
            </div>
            <button type="button" onClick={() => setState({ kind: "idle" })} className={secondaryButton}>
              New file
            </button>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(content).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                track("output_copy", params);
              }}
              className={secondaryButton}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
            {state.images.length > 0 ? (
              <button type="button" onClick={downloadZip} className={primaryButton}>
                Download note + attachments (.zip)
              </button>
            ) : (
              <button type="button" onClick={downloadNote} className={primaryButton}>
                Download .md
              </button>
            )}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            aria-label="Obsidian note"
            className="block h-[60vh] w-full resize-y rounded-xl border border-line bg-white p-4 font-mono text-[13px] leading-relaxed text-neutral-800 focus:outline-none sm:h-[28rem]"
          />
        </div>
      )}
    </div>
  );
}
