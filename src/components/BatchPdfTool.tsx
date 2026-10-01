"use client";

import { useRef, useState } from "react";
import { durationBucket, sizeBucket, track, type ToolEventParams } from "@/lib/analytics";
import { baseName, CancelledError, classifyPdfError, saveBlob, sniffMessage, sniffPdf } from "@/lib/files";
import { DEFAULT_OCR_LANGUAGE, type OcrLanguage } from "@/lib/ocr";
import FileDropzone, { primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";
import OcrLanguageSelect, { useStoredOcrLanguage } from "@/components/OcrLanguageSelect";

const TOOL = "batch-pdf-to-markdown";

type Item = {
  id: number;
  file: File;
  status: "queued" | "working" | "done" | "error" | "cancelled";
  page?: number;
  total?: number;
  message?: string;
  markdown?: string;
  images?: { name: string; blob: Blob }[];
  pages?: number;
};

const fileCountBucket = (n: number) => (n <= 1 ? "1" : n <= 5 ? "2-5" : n <= 20 ? "6-20" : "21+");

/** "report.md", then "report (2).md" — two PDFs with the same name must not overwrite each other in the ZIP. */
function uniqueNames(items: Item[]): Map<number, string> {
  const used = new Map<string, number>();
  const names = new Map<number, string>();
  for (const it of items) {
    const base = baseName(it.file.name);
    const n = (used.get(base.toLowerCase()) ?? 0) + 1;
    used.set(base.toLowerCase(), n);
    names.set(it.id, n === 1 ? base : `${base} (${n})`);
  }
  return names;
}

export default function BatchPdfTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [ocrLanguage, setOcrLanguage] = useState<OcrLanguage>(DEFAULT_OCR_LANGUAGE);
  useStoredOcrLanguage(setOcrLanguage);
  const [withImages, setWithImages] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(1);

  const update = (id: number, patch: Partial<Item>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const add = (files: File[]) => {
    const fresh = files.map((file) => ({ id: nextId.current++, file, status: "queued" as const }));
    setItems((list) => [...list, ...fresh]);
  };

  /** One file at a time: OCR and pdf.js already use the CPU fully, parallel runs only fight each other. */
  const start = async () => {
    const queue = items.filter((i) => i.status === "queued" || i.status === "cancelled");
    if (queue.length === 0) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    const params: ToolEventParams = { tool_name: TOOL, input_format: "pdf", output_format: "md", file_count_bucket: fileCountBucket(queue.length) };
    track("conversion_start", params);
    const started = performance.now();
    const { convertPdfToMarkdown } = await import("@/lib/pdf-to-markdown");
    let ok = 0;
    for (const item of queue) {
      if (controller.signal.aborted) {
        update(item.id, { status: "cancelled" });
        continue;
      }
      track("file_selected", { ...params, file_size_bucket: sizeBucket(item.file.size) });
      const sniff = await sniffPdf(item.file);
      if (sniff !== "ok") {
        update(item.id, { status: "error", message: sniffMessage(sniff).message });
        continue;
      }
      update(item.id, { status: "working", page: 0, total: 0 });
      try {
        const r = await convertPdfToMarkdown(item.file, {
          signal: controller.signal,
          ocrLanguage,
          extractImages: withImages,
          onProgress: (p) => update(item.id, { page: p.page, total: p.totalPages }),
        });
        update(item.id, { status: "done", markdown: r.output, images: r.images, pages: r.pageCount });
        ok++;
      } catch (err) {
        if (err instanceof CancelledError || controller.signal.aborted) {
          update(item.id, { status: "cancelled" });
          continue;
        }
        update(item.id, { status: "error", message: classifyPdfError(err).message });
      }
    }
    if (controller.signal.aborted) track("conversion_cancel", params);
    else if (ok > 0) track("conversion_success", { ...params, duration_bucket: durationBucket(performance.now() - started) });
    abortRef.current = null;
    setRunning(false);
  };

  const downloadZip = async () => {
    const done = items.filter((i) => i.status === "done");
    const { zipParts } = await import("@/lib/pdf-split");
    const names = uniqueNames(done);
    const enc = new TextEncoder();
    const files: { name: string; bytes: Uint8Array }[] = [];
    for (const it of done) {
      const name = names.get(it.id)!;
      if (it.images?.length) {
        // Each document in its own folder, so images/ paths stay valid.
        files.push({ name: `${name}/${name}.md`, bytes: enc.encode(it.markdown ?? "") });
        for (const img of it.images) files.push({ name: `${name}/images/${img.name}`, bytes: new Uint8Array(await img.blob.arrayBuffer()) });
      } else {
        files.push({ name: `${name}.md`, bytes: enc.encode(it.markdown ?? "") });
      }
    }
    saveBlob(await zipParts(files), "markdown.zip");
    track("output_download", { tool_name: TOOL, output_format: "zip", file_count_bucket: fileCountBucket(done.length) });
  };

  const doneCount = items.filter((i) => i.status === "done").length;
  const pending = items.filter((i) => i.status === "queued" || i.status === "cancelled").length;

  return (
    <div className={toolCard}>
      <FileDropzone
        accept=".pdf,application/pdf"
        multiple
        disabled={running}
        onFiles={add}
        onDragIntent={() => void import("@/lib/pdf-to-markdown")}
        label="Drop your PDFs here"
        hint="As many as you like — nothing is uploaded"
        dropAnywhere
        compact={items.length > 0}
      />

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <OcrLanguageSelect value={ocrLanguage} onChange={setOcrLanguage} disabled={running} />
        <label className="inline-flex min-h-10 items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={withImages}
            onChange={(e) => setWithImages(e.target.checked)}
            disabled={running}
            className="h-4 w-4 accent-brand-600"
          />
          Extract images
        </label>
      </div>

      {items.length > 0 && (
        <>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white" aria-live="polite">
            {items.map((it) => (
              <li key={it.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{it.file.name}</span>
                <span
                  className={
                    it.status === "done"
                      ? "text-emerald-700"
                      : it.status === "error"
                        ? "text-red-700"
                        : it.status === "working"
                          ? "font-semibold text-brand-700"
                          : "text-neutral-500"
                  }
                >
                  {it.status === "queued" && "Waiting"}
                  {it.status === "cancelled" && "Not converted"}
                  {it.status === "working" && (it.total ? `Page ${it.page} of ${it.total}` : "Opening…")}
                  {it.status === "done" && `✓ ${it.pages} ${it.pages === 1 ? "page" : "pages"}`}
                  {it.status === "error" && it.message}
                </span>
                {it.status === "done" && (
                  <button
                    type="button"
                    onClick={() => {
                      saveBlob(new Blob([it.markdown ?? ""], { type: "text/markdown;charset=utf-8" }), `${baseName(it.file.name)}.md`);
                      track("output_download", { tool_name: TOOL, output_format: "md" });
                    }}
                    className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
                  >
                    .md
                  </button>
                )}
                {!running && it.status !== "done" && (
                  <button
                    type="button"
                    aria-label={`Remove ${it.file.name}`}
                    onClick={() => setItems((l) => l.filter((x) => x.id !== it.id))}
                    className="px-1 text-neutral-400 hover:text-ink"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            {running ? (
              <button type="button" onClick={() => abortRef.current?.abort()} className={secondaryButton}>
                Cancel
              </button>
            ) : (
              pending > 0 && (
                <button type="button" onClick={start} className={primaryButton}>
                  Convert {pending} {pending === 1 ? "PDF" : "PDFs"}
                </button>
              )
            )}
            {doneCount > 0 && !running && (
              <button type="button" onClick={downloadZip} className={pending > 0 ? secondaryButton : primaryButton}>
                Download all (.zip)
              </button>
            )}
            {!running && (
              <button type="button" onClick={() => setItems([])} className="ml-auto text-sm font-medium text-neutral-500 hover:text-ink">
                Clear list
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
