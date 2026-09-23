"use client";

import { useRef, useState } from "react";
import { formatBytes } from "@/lib/ai-limits";
import { countBucket, durationBucket, pageBucket, sizeBucket, track } from "@/lib/analytics";
import { CancelledError, classifyPdfError, saveBlob, sniffPdf } from "@/lib/files";
import SortableList, { byName } from "@/components/SortableList";
import FileDropzone, { ErrorAlert, PrivacyNote, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "merge-pdf";
const MAX_FILES = 50;

interface Item {
  id: number;
  name: string;
  data: ArrayBuffer;
  pages: number;
}

type Phase =
  | { kind: "idle" }
  | { kind: "adding" }
  | { kind: "merging"; done: number; total: number }
  | { kind: "merged"; bytes: Uint8Array; pages: number }
  | { kind: "error"; message: string };

let nextId = 1;
/** Timing for the duration bucket; only ever called from event handlers. */
const now = () => performance.now();

export default function MergePdfTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [skipped, setSkipped] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const totalPages = items.reduce((s, i) => s + i.pages, 0);
  const totalBytes = items.reduce((s, i) => s + i.data.byteLength, 0);

  const params = () => ({
    tool_name: TOOL,
    input_format: "pdf",
    output_format: "pdf",
    file_count_bucket: countBucket(items.length),
    file_size_bucket: sizeBucket(totalBytes),
    page_count_bucket: pageBucket(totalPages),
  });

  const add = async (files: File[]) => {
    const room = MAX_FILES - items.length;
    const list = files.slice(0, Math.max(0, room));
    track("file_selected", { tool_name: TOOL, input_format: "pdf", file_count_bucket: countBucket(files.length) });
    setPhase({ kind: "adding" });
    const { countPages } = await import("@/lib/pdf-split");
    const added: Item[] = [];
    const rejected: string[] = [];
    for (const f of list) {
      if ((await sniffPdf(f)) !== "ok") {
        rejected.push(`${f.name}: not a PDF`);
        continue;
      }
      try {
        const data = await f.arrayBuffer();
        added.push({ id: nextId++, name: f.name, data, pages: await countPages(data) });
      } catch (err) {
        const e = classifyPdfError(err);
        rejected.push(`${f.name}: ${e.code === "encrypted" ? "password-protected" : "could not be read"}`);
        track("conversion_error", { tool_name: TOOL, input_format: "pdf", error_code: e.code });
      }
    }
    if (files.length > list.length) rejected.push(`Only ${MAX_FILES} files can be merged at once.`);
    setItems((prev) => [...prev, ...added]);
    setSkipped(rejected);
    setPhase({ kind: "idle" });
  };

  const update = (next: Item[]) => {
    setItems(next);
    if (phase.kind === "merged") setPhase({ kind: "idle" });
  };

  const merge = async () => {
    if (items.length < 2) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const started = now();
    track("conversion_start", params());
    setPhase({ kind: "merging", done: 0, total: items.length });
    try {
      const { mergePdfs } = await import("@/lib/pdf-merge");
      const bytes = await mergePdfs(
        items.map((i) => ({ data: i.data })),
        { signal: controller.signal, onProgress: (done, total) => setPhase({ kind: "merging", done, total }) },
      );
      track("conversion_success", { ...params(), duration_bucket: durationBucket(now() - started) });
      setPhase({ kind: "merged", bytes, pages: totalPages });
    } catch (err) {
      if (err instanceof CancelledError || controller.signal.aborted) {
        track("conversion_cancel", params());
        setPhase({ kind: "idle" });
        return;
      }
      const e = classifyPdfError(err);
      if (e.code === "unknown") console.error(err);
      track("conversion_error", { ...params(), error_code: e.code });
      setPhase({ kind: "error", message: e.message });
    } finally {
      abortRef.current = null;
    }
  };

  const busy = phase.kind === "adding" || phase.kind === "merging";

  return (
    <div className={toolCard}>
      <FileDropzone
        accept=".pdf,application/pdf"
        multiple
        disabled={busy || items.length >= MAX_FILES}
        onFiles={add}
        onDragIntent={() => void import("@/lib/pdf-merge")}
        label={items.length ? "Add more PDFs" : "Drop the PDFs to merge"}
        hint={<PrivacyNote />}
        compact={items.length > 0}
      >
        {phase.kind === "adding" ? <p className="font-semibold text-neutral-900">Reading files…</p> : undefined}
      </FileDropzone>

      {skipped.length > 0 && (
        <div role="alert" data-testid="merge-skipped" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Some files were not added:</p>
          <ul className="mt-1 list-disc pl-5">
            {skipped.map((s) => (
              <li key={s} className="break-all">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-neutral-600" data-testid="merge-summary">
              {items.length} {items.length === 1 ? "file" : "files"} · {totalPages} pages · {formatBytes(totalBytes)}
            </p>
            <button type="button" onClick={() => update(byName(items))} disabled={busy} className="text-sm font-medium text-indigo-600 hover:underline">
              Sort by name
            </button>
          </div>
          <SortableList
            items={items}
            label="Merge order"
            disabled={busy}
            onChange={update}
            renderItem={(item) => (
              <>
                <span className="block truncate font-medium text-neutral-900" title={item.name}>
                  {item.name}
                </span>
                <span className="text-xs text-neutral-500">
                  {item.pages} {item.pages === 1 ? "page" : "pages"} · {formatBytes(item.data.byteLength)}
                </span>
              </>
            )}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={merge} disabled={busy || items.length < 2} className={primaryButton}>
              Merge {items.length} PDFs
            </button>
            {phase.kind === "merging" && (
              <button type="button" onClick={() => abortRef.current?.abort()} className={secondaryButton}>
                Cancel
              </button>
            )}
            {items.length < 2 && <p className="text-sm text-neutral-500">Add at least one more PDF.</p>}
          </div>
        </div>
      )}

      {phase.kind === "merging" && (
        <div className="mt-4 max-w-md space-y-2" aria-live="polite">
          <ProgressBar value={phase.done / phase.total} label="Merge progress" />
          <p className="text-xs text-neutral-500">
            {phase.done} of {phase.total} files added
          </p>
        </div>
      )}

      {phase.kind === "error" && <ErrorAlert message={phase.message} />}

      {phase.kind === "merged" && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4" data-testid="merge-done">
          <p className="text-sm text-emerald-800">
            ✓ Merged: {phase.pages} pages · {formatBytes(phase.bytes.byteLength)}
          </p>
          <button
            type="button"
            onClick={() => {
              saveBlob(new Blob([phase.bytes as BlobPart], { type: "application/pdf" }), "merged.pdf");
              track("output_download", params());
            }}
            className={primaryButton}
          >
            Download merged.pdf
          </button>
        </div>
      )}
    </div>
  );
}
