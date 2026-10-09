"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatBytes } from "@/lib/ai-limits";
import { countBucket, durationBucket, pageBucket, sizeBucket, track } from "@/lib/analytics";
import { CancelledError, baseName, classifyPdfError, saveBlob, sniffMessage, sniffPdf } from "@/lib/files";
import type { ImageFormat } from "@/lib/pdf-images";
import FileDropzone, { ErrorAlert, PrivacyNote, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";

const RESOLUTIONS = [
  { dpi: 72, label: "72 dpi — screen, smallest files" },
  { dpi: 150, label: "150 dpi — sharp on screen (recommended)" },
  { dpi: 300, label: "300 dpi — print quality" },
];

interface Result {
  pageIndex: number;
  name: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  reduced: boolean;
}

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "converting"; done: number; total: number }
  | { kind: "done" }
  | { kind: "error"; message: string };

const now = () => performance.now();

export default function PdfToImagesTool({
  defaultFormat = "jpeg",
  tool: TOOL = "pdf-to-jpg",
}: {
  defaultFormat?: ImageFormat;
  /** Analytics name: the same tool serves /pdf-to-jpg and /pdf-to-png. */
  tool?: string;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [file, setFile] = useState<{ name: string; data: ArrayBuffer; pages: number } | null>(null);
  const [format, setFormat] = useState<ImageFormat>(defaultFormat);
  const [dpi, setDpi] = useState(150);
  const [allPages, setAllPages] = useState(true);
  const [rangeText, setRangeText] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [lib, setLib] = useState<typeof import("@/lib/pdf-split") | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const urlsRef = useRef<string[]>([]);

  // Object URLs for the previews are released when replaced and on unmount.
  useEffect(() => {
    const previous = urlsRef.current;
    urlsRef.current = results.map((r) => r.url);
    previous.filter((u) => !urlsRef.current.includes(u)).forEach((u) => URL.revokeObjectURL(u));
  }, [results]);
  useEffect(() => () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const selection = useMemo((): { pages: number[] } | { error: string } | null => {
    if (!file || !lib) return null;
    if (allPages) return { pages: Array.from({ length: file.pages }, (_, i) => i) };
    if (!rangeText.trim()) return { error: `Enter pages between 1 and ${file.pages}, e.g. 1-3, 5` };
    const parsed = lib.parseRanges(rangeText, file.pages);
    if ("error" in parsed) return parsed;
    return { pages: [...new Set(parsed.ranges.flatMap((r) => Array.from({ length: r.to - r.from + 1 }, (_, i) => r.from + i)))] };
  }, [file, lib, allPages, rangeText]);

  const ext = format === "jpeg" ? "jpg" : "png";
  const params = () => ({
    tool_name: TOOL,
    input_format: "pdf",
    output_format: ext,
    file_size_bucket: file ? sizeBucket(file.data.byteLength) : undefined,
    page_count_bucket: file ? pageBucket(file.pages) : undefined,
    export_mode: `${dpi}dpi`,
  });

  const load = async ([f]: File[]) => {
    if (!f) return;
    const base = { tool_name: TOOL, input_format: "pdf", file_size_bucket: sizeBucket(f.size) };
    track("file_selected", base);
    const sniff = await sniffPdf(f);
    if (sniff !== "ok") {
      const e = sniffMessage(sniff);
      track("conversion_error", { ...base, error_code: e.code });
      setPhase({ kind: "error", message: e.message });
      return;
    }
    setPhase({ kind: "loading" });
    try {
      const [data, split] = await Promise.all([f.arrayBuffer(), import("@/lib/pdf-split")]);
      const pages = await split.countPages(data);
      setLib(split);
      setFile({ name: f.name, data, pages });
      setResults([]);
      setPhase({ kind: "ready" });
    } catch (err) {
      const e = classifyPdfError(err);
      if (e.code === "unknown") console.error(err);
      track("conversion_error", { ...base, error_code: e.code });
      setPhase({ kind: "error", message: e.message });
    }
  };

  const convert = async () => {
    if (!file || !selection || "error" in selection) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const started = now();
    track("conversion_start", params());
    setResults([]);
    setPhase({ kind: "converting", done: 0, total: selection.pages.length });
    const base = baseName(file.name);
    const pad = Math.max(2, String(file.pages).length);
    const collected: Result[] = [];
    try {
      const { pdfToImages } = await import("@/lib/pdf-images");
      await pdfToImages(file.data, selection.pages, {
        dpi,
        format,
        quality: 0.9,
        signal: controller.signal,
        onImage: (img, done, total) => {
          collected.push({
            ...img,
            name: `${base}-page-${String(img.pageIndex + 1).padStart(pad, "0")}.${ext}`,
            url: URL.createObjectURL(img.blob),
          });
          setResults([...collected]);
          setPhase({ kind: "converting", done, total });
        },
      });
      track("conversion_success", {
        ...params(),
        file_count_bucket: countBucket(collected.length),
        duration_bucket: durationBucket(now() - started),
      });
      setPhase({ kind: "done" });
    } catch (err) {
      if (err instanceof CancelledError || controller.signal.aborted) {
        track("conversion_cancel", params());
        setPhase({ kind: collected.length ? "done" : "ready" });
        return;
      }
      const e = classifyPdfError(err);
      console.error(err);
      track("conversion_error", { ...params(), error_code: e.code === "unknown" ? "render_failed" : e.code });
      setPhase({
        kind: "error",
        message:
          e.code === "unknown"
            ? "A page could not be rendered. Try a lower resolution, or convert fewer pages at a time."
            : e.message,
      });
    } finally {
      abortRef.current = null;
    }
  };

  const downloadOne = (r: Result) => {
    saveBlob(r.blob, r.name);
    track("output_download", { ...params(), file_count_bucket: "1" });
  };

  const downloadAll = async () => {
    const { zipParts } = await import("@/lib/pdf-split");
    const files = await Promise.all(results.map(async (r) => ({ name: r.name, bytes: new Uint8Array(await r.blob.arrayBuffer()) })));
    const rendered = results[0].name.slice(results[0].name.lastIndexOf(".") + 1);
    saveBlob(await zipParts(files), `${baseName(file!.name)}-${rendered}.zip`);
    track("output_download", { ...params(), output_format: "zip", file_count_bucket: countBucket(results.length) });
  };

  const reset = () => {
    abortRef.current?.abort();
    setFile(null);
    setResults([]);
    setPhase({ kind: "idle" });
  };

  const busy = phase.kind === "loading" || phase.kind === "converting";
  const selectionError = selection && "error" in selection ? selection.error : null;
  const count = selection && "pages" in selection ? selection.pages.length : 0;
  const totalBytes = results.reduce((s, r) => s + r.blob.size, 0);

  if (!file) {
    return (
      <div className={toolCard}>
        <FileDropzone
          accept=".pdf,application/pdf"
          disabled={busy}
          onFiles={load}
          onDragIntent={() => void import("@/lib/pdf-images")}
          label="Drop a PDF to convert to images"
          hint={<PrivacyNote />}
        >
          {phase.kind === "loading" ? <p className="font-semibold text-neutral-900">Reading the PDF…</p> : undefined}
        </FileDropzone>
        {phase.kind === "error" && <ErrorAlert message={phase.message} />}
      </div>
    );
  }

  return (
    <div className={toolCard}>
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-neutral-50 p-4">
        <div>
          <p className="break-all font-semibold text-neutral-900">{file.name}</p>
          <p className="mt-1 text-sm text-neutral-600" data-testid="images-summary">
            {file.pages} {file.pages === 1 ? "page" : "pages"} · {formatBytes(file.data.byteLength)}
          </p>
        </div>
        <button type="button" onClick={reset} className={secondaryButton}>
          Choose another PDF
        </button>
      </div>

      <fieldset className="mt-5 grid gap-4 sm:grid-cols-3" disabled={busy}>
        <div>
          <p className="mb-1 text-sm font-medium text-neutral-800" id="format-label">
            Format
          </p>
          <div role="radiogroup" aria-labelledby="format-label" className="inline-flex rounded-lg border border-neutral-300 p-0.5 text-sm">
            {(["jpeg", "png"] as const).map((f) => (
              <label
                key={f}
                className={`cursor-pointer rounded-md px-4 py-1.5 ${format === f ? "bg-indigo-600 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
              >
                <input
                  type="radio"
                  name="image-format"
                  value={f}
                  checked={format === f}
                  onChange={() => setFormat(f)}
                  className="sr-only"
                />
                {f === "jpeg" ? "JPG" : "PNG"}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-neutral-600">
            {format === "jpeg" ? "Smaller files; best for scans and photos." : "Lossless; best for text, charts and line art."}
          </p>
        </div>
        <div>
          <label htmlFor="image-dpi" className="mb-1 block text-sm font-medium text-neutral-800">
            Resolution
          </label>
          <select
            id="image-dpi"
            value={dpi}
            onChange={(e) => setDpi(Number(e.target.value))}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            {RESOLUTIONS.map((r) => (
              <option key={r.dpi} value={r.dpi}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-neutral-800">Pages</p>
          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={allPages} onChange={(e) => setAllPages(e.target.checked)} className="accent-indigo-600" />
            All {file.pages} pages
          </label>
          {!allPages && (
            <input
              aria-label="Pages to convert"
              value={rangeText}
              onChange={(e) => setRangeText(e.target.value)}
              placeholder="1-3, 5"
              inputMode="numeric"
              autoComplete="off"
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm"
            />
          )}
        </div>
      </fieldset>

      {selectionError && !allPages && rangeText.trim() && (
        <p className="mt-3 text-sm text-red-700" data-testid="images-selection-error">
          {selectionError}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={convert} disabled={busy || count === 0} className={primaryButton}>
          Convert {count} {count === 1 ? "page" : "pages"} to {format === "jpeg" ? "JPG" : "PNG"}
        </button>
        {phase.kind === "converting" && (
          <button type="button" onClick={() => abortRef.current?.abort()} className={secondaryButton}>
            Cancel
          </button>
        )}
      </div>

      {phase.kind === "converting" && (
        <div className="mt-4 max-w-md space-y-2" aria-live="polite">
          <ProgressBar value={phase.done / phase.total} label="Conversion progress" />
          <p className="text-xs text-neutral-600">
            {phase.done} of {phase.total} pages rendered
          </p>
        </div>
      )}

      {phase.kind === "error" && <ErrorAlert message={phase.message} />}

      {results.length > 0 && (
        <div className="mt-6" data-testid="images-result">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-700">
              {phase.kind === "done" && "✓ "}
              {results.length} {results.length === 1 ? "image" : "images"} · {formatBytes(totalBytes)}
            </p>
            {phase.kind === "done" &&
              (results.length > 1 ? (
                <button type="button" onClick={downloadAll} className={primaryButton}>
                  Download all (.zip)
                </button>
              ) : (
                <button type="button" onClick={() => downloadOne(results[0])} className={primaryButton}>
                  Download {results[0].name}
                </button>
              ))}
          </div>
          {results.some((r) => r.reduced) && (
            <p className="mb-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Some pages are very large, so they were rendered at a lower resolution than requested to stay within
              what the browser can draw.
            </p>
          )}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {results.map((r) => (
              <li key={r.name} className="overflow-hidden rounded-xl border border-neutral-200">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local blob: preview, nothing to optimise */}
                <img src={r.url} alt={`Page ${r.pageIndex + 1}`} className="aspect-[3/4] w-full bg-neutral-100 object-contain" />
                <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
                  <span className="text-neutral-600">
                    p. {r.pageIndex + 1} · {r.width}×{r.height}
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadOne(r)}
                    className="font-medium text-indigo-600 hover:underline"
                    aria-label={`Download page ${r.pageIndex + 1}`}
                  >
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
