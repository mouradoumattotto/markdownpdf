"use client";

import { useState } from "react";
import { durationBucket, pageBucket, sizeBucket, track, type ToolEventParams } from "@/lib/analytics";
import { baseName, CancelledError, classifyPdfError, saveBlob, sniffMessage, sniffPdf } from "@/lib/files";
import FileDropzone, { ErrorAlert, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "pdf-tables-to-csv";

type Table = { page: number; rows: string[][] };
type State =
  | { kind: "idle" }
  | { kind: "working"; name: string; page: number; total: number }
  | { kind: "done"; name: string; pageCount: number; ocrPages: number; tables: Table[] }
  | { kind: "error"; message: string };

const csvName = (base: string, t: Table, i: number) => `${base}-p${t.page}-table${i + 1}.csv`;

export default function PdfTablesTool() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [abort, setAbort] = useState<AbortController | null>(null);
  const [params, setParams] = useState<ToolEventParams>({ tool_name: TOOL });

  const run = async (file: File) => {
    const p: ToolEventParams = { tool_name: TOOL, input_format: "pdf", output_format: "csv", file_size_bucket: sizeBucket(file.size) };
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
    setState({ kind: "working", name: file.name, page: 0, total: 0 });
    track("conversion_start", p);
    const started = performance.now();
    try {
      const { convertPdfToMarkdown } = await import("@/lib/pdf-to-markdown");
      const result = await convertPdfToMarkdown(file, {
        signal: controller.signal,
        ocr: false,
        onProgress: (pr) => setState({ kind: "working", name: file.name, page: pr.page, total: pr.totalPages }),
      });
      const done = { ...p, page_count_bucket: pageBucket(result.pageCount), duration_bucket: durationBucket(performance.now() - started) };
      setParams(done);
      track("conversion_success", done);
      setState({ kind: "done", name: file.name, pageCount: result.pageCount, ocrPages: result.ocrPages, tables: result.tables });
    } catch (err) {
      if (err instanceof CancelledError || controller.signal.aborted) {
        track("conversion_cancel", p);
        setState({ kind: "idle" });
        return;
      }
      const e = classifyPdfError(err);
      track("conversion_error", { ...p, error_code: e.code });
      setState({ kind: "error", message: e.message });
    } finally {
      setAbort(null);
    }
  };

  const downloadOne = async (t: Table, i: number) => {
    if (state.kind !== "done") return;
    const { tableToCsv } = await import("@/lib/pdf-tables");
    // A BOM so Excel opens UTF-8 accents correctly.
    saveBlob(new Blob(["﻿" + tableToCsv(t.rows)], { type: "text/csv;charset=utf-8" }), csvName(baseName(state.name), t, i));
    track("output_download", params);
  };

  const downloadAll = async () => {
    if (state.kind !== "done") return;
    const [{ tableToCsv }, { zipParts }] = await Promise.all([import("@/lib/pdf-tables"), import("@/lib/pdf-split")]);
    const enc = new TextEncoder();
    const base = baseName(state.name);
    const files = state.tables.map((t, i) => ({ name: csvName(base, t, i), bytes: enc.encode("﻿" + tableToCsv(t.rows)) }));
    saveBlob(await zipParts(files), `${base}-tables.zip`);
    track("output_download", { ...params, output_format: "zip" });
  };

  return (
    <div className={toolCard}>
      <div className={state.kind === "working" || state.kind === "done" ? "hidden" : ""}>
        <FileDropzone
          accept=".pdf,application/pdf"
          onFiles={([f]) => f && run(f)}
          onDragIntent={() => void import("@/lib/pdf-to-markdown")}
          label="Drop a PDF with tables"
          hint="Your file never leaves your device"
          dropAnywhere
        />
      </div>

      {state.kind === "working" && (
        <div className="mx-auto max-w-xl space-y-3 py-6" aria-live="polite">
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 truncate font-semibold text-ink">{state.name}</p>
            <button type="button" onClick={() => abort?.abort()} className={secondaryButton}>
              Cancel
            </button>
          </div>
          <ProgressBar value={state.total ? state.page / state.total : 0} label="Reading tables" />
          <p className="text-sm text-neutral-600">
            {state.total ? `Looking for tables — page ${state.page} of ${state.total}` : "Opening the PDF…"}
          </p>
        </div>
      )}

      {state.kind === "error" && <ErrorAlert message={state.message} />}

      {state.kind === "done" && (
        <div className="animate-fade-up">
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-ink">
                {state.tables.length === 0
                  ? "No table found"
                  : `${state.tables.length} ${state.tables.length === 1 ? "table" : "tables"} found`}
              </h2>
              <p className="truncate text-xs text-neutral-500">
                {state.name} · {state.pageCount} {state.pageCount === 1 ? "page" : "pages"}
              </p>
            </div>
            <button type="button" onClick={() => setState({ kind: "idle" })} className={secondaryButton}>
              New file
            </button>
            {state.tables.length > 1 && (
              <button type="button" onClick={downloadAll} className={primaryButton}>
                Download all (.zip)
              </button>
            )}
          </div>

          {state.tables.length === 0 && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {state.ocrPages > 0 && state.ocrPages === state.pageCount
                ? "This PDF is scanned: its pages are pictures, and tables are only detected on pages with real text. Make it searchable with “OCR a PDF” first, then try again."
                : "Nothing in this PDF lines up as rows and columns. Tables drawn as images, or laid out as prose, cannot be recovered as CSV."}
            </p>
          )}

          <ul className="space-y-4">
            {state.tables.map((t, i) => (
              <li key={i} className="overflow-hidden rounded-xl border border-line">
                <div className="flex flex-wrap items-center gap-2 border-b border-line bg-white px-4 py-2.5">
                  <span className="text-sm font-semibold text-ink">Table {i + 1}</span>
                  <span className="text-xs text-neutral-500">
                    page {t.page} · {t.rows.length} rows × {Math.max(...t.rows.map((r) => r.length))} columns
                  </span>
                  <button type="button" onClick={() => downloadOne(t, i)} className={`${state.tables.length === 1 ? primaryButton : secondaryButton} ml-auto`}>
                    Download .csv
                  </button>
                </div>
                <div className="max-h-72 overflow-auto bg-white">
                  <table className="w-full border-collapse text-left text-[13px]">
                    <tbody>
                      {t.rows.slice(0, 50).map((r, ri) => (
                        <tr key={ri} className={ri === 0 ? "bg-paper font-semibold" : "border-t border-line"}>
                          {r.map((c, ci) => (
                            <td key={ci} className="whitespace-nowrap px-3 py-1.5 text-neutral-800">
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {t.rows.length > 50 && (
                    <p className="border-t border-line px-3 py-2 text-xs text-neutral-500">
                      Showing 50 of {t.rows.length} rows — the CSV has them all.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
