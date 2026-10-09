"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { formatBytes } from "@/lib/ai-limits";
import { durationBucket, pageBucket, sizeBucket, track } from "@/lib/analytics";
import { CancelledError, baseName, classifyPdfError, saveBlob, sniffMessage, sniffPdf, throwIfAborted } from "@/lib/files";
import type { ImageFormat } from "@/lib/pdf-images";
import { manualBox, type PageSize, type Rect, type RedactionBox, type SearchMode } from "@/lib/pdf-redact";
import ContinueWith from "@/components/ContinueWith";
import FileDropzone, { ErrorAlert, PrivacyNote, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "redact-pdf";
/** Preview width in CSS pixels; rendered at this size, shown at most this wide. */
const PREVIEW_WIDTH = 900;
/** Tall pages are shown narrower, so a whole page fits on a laptop screen. */
const MAX_PAGE_HEIGHT = 1000;

const QUALITIES = [
  { dpi: 150, label: "150 dpi — smaller file" },
  { dpi: 200, label: "200 dpi — sharp (recommended)" },
  { dpi: 300, label: "300 dpi — print quality" },
];

const MODES: { id: SearchMode; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "email", label: "Email addresses" },
  { id: "phone", label: "Phone numbers" },
  { id: "regex", label: "Regular expression" },
];

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "searching"; done: number; total: number }
  | { kind: "redacting"; done: number; total: number }
  | { kind: "done"; bytes: Uint8Array; pages: number }
  | { kind: "error"; message: string; encrypted?: boolean };

const now = () => performance.now();

export default function RedactPdfTool() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [file, setFile] = useState<{ name: string; data: ArrayBuffer; sizes: PageSize[] } | null>(null);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [previewProgress, setPreviewProgress] = useState(0);
  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [mode, setMode] = useState<SearchMode>("text");
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(true);
  const [dpi, setDpi] = useState(200);
  const [format, setFormat] = useState<ImageFormat>("jpeg");
  const previewAbort = useRef<AbortController | null>(null);
  const workAbort = useRef<AbortController | null>(null);
  const previewsRef = useRef<Record<number, string>>({});

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);
  useEffect(
    () => () => {
      previewAbort.current?.abort();
      workAbort.current?.abort();
      Object.values(previewsRef.current).forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const params = () => ({
    tool_name: TOOL,
    input_format: "pdf",
    output_format: "pdf",
    file_size_bucket: file ? sizeBucket(file.data.byteLength) : undefined,
    page_count_bucket: file ? pageBucket(file.sizes.length) : undefined,
    export_mode: `${dpi}dpi`,
  });

  const clearPreviews = () => {
    previewAbort.current?.abort();
    Object.values(previewsRef.current).forEach((u) => URL.revokeObjectURL(u));
    previewsRef.current = {};
    setPreviews({});
  };

  /** Page previews render one by one in the background; boxes can be drawn as soon as a page appears. */
  const renderPreviews = async (data: ArrayBuffer, count: number) => {
    const controller = new AbortController();
    previewAbort.current = controller;
    const [{ openPdf }, { renderThumbnail }] = await Promise.all([import("@/lib/pdfjs"), import("@/lib/pdf-images")]);
    const task = await openPdf(data.slice(0));
    try {
      const doc = await task.promise;
      for (let i = 0; i < count; i++) {
        throwIfAborted(controller.signal);
        const page = await doc.getPage(i + 1);
        const { url } = await renderThumbnail(page, PREVIEW_WIDTH);
        page.cleanup();
        if (controller.signal.aborted) {
          URL.revokeObjectURL(url);
          break;
        }
        setPreviews((p) => ({ ...p, [i]: url }));
        setPreviewProgress(i + 1);
      }
    } catch (err) {
      if (!(err instanceof CancelledError)) console.error(err);
    } finally {
      await task.destroy();
    }
  };

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
      const data = await f.arrayBuffer();
      // pdf-lib refuses encrypted files, including ones pdf.js would display:
      // find out now rather than after the visitor has drawn twenty boxes.
      const [{ PDFDocument }, { readPageSizes }] = await Promise.all([import("pdf-lib"), import("@/lib/pdf-redact")]);
      await PDFDocument.load(data, { updateMetadata: false });
      const sizes = await readPageSizes(data);
      clearPreviews();
      setPreviewProgress(0);
      setBoxes([]);
      setSearchNote(null);
      setFile({ name: f.name, data, sizes });
      setPhase({ kind: "ready" });
      void renderPreviews(data, sizes.length);
    } catch (err) {
      const e = classifyPdfError(err);
      if (e.code === "unknown") console.error(err);
      track("conversion_error", { ...base, error_code: e.code });
      setPhase({ kind: "error", message: e.message, encrypted: e.code === "encrypted" });
    }
  };

  const edit = (next: RedactionBox[]) => {
    setBoxes(next);
    if (phase.kind === "done" || phase.kind === "error") setPhase({ kind: "ready" });
  };

  const search = async () => {
    if (!file) return;
    const controller = new AbortController();
    workAbort.current = controller;
    setSearchNote(null);
    setPhase({ kind: "searching", done: 0, total: file.sizes.length });
    try {
      const { searchPdf } = await import("@/lib/pdf-redact");
      const result = await searchPdf(
        file.data,
        { mode, query, caseSensitive, wholeWord },
        { signal: controller.signal, onPage: (done, total) => setPhase({ kind: "searching", done, total }) },
      );
      // A second search for the same thing must not stack duplicate boxes.
      const seen = new Set(boxes.map((b) => key(b.pageIndex, b.rect)));
      const fresh = result.boxes.filter((b) => !seen.has(key(b.pageIndex, b.rect)));
      setBoxes((prev) => [...prev, ...fresh]);
      const scanned = result.pagesWithoutText.length;
      setSearchNote(
        [
          result.matches === 0
            ? "No matches."
            : `${result.matches} ${result.matches === 1 ? "match" : "matches"} marked${fresh.length < result.boxes.length ? " (some were already marked)" : ""}.`,
          result.truncated ? "Stopped at 5,000 matches — narrow the search." : "",
          scanned
            ? `${scanned} ${scanned === 1 ? "page has" : "pages have"} no text layer (${scanned === file.sizes.length ? "a scan" : "probably scans"}): search cannot see ${scanned === 1 ? "it" : "them"}, so draw boxes there.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
      setPhase({ kind: "ready" });
    } catch (err) {
      if (err instanceof CancelledError) {
        setPhase({ kind: "ready" });
        return;
      }
      // An invalid pattern is reported by searchPdf as a plain message.
      setSearchNote((err as Error).message);
      setPhase({ kind: "ready" });
    }
  };

  const redact = async () => {
    if (!file || boxes.length === 0) return;
    const started = now();
    const controller = new AbortController();
    workAbort.current = controller;
    track("conversion_start", params());
    const pages = new Set(boxes.map((b) => b.pageIndex)).size;
    setPhase({ kind: "redacting", done: 0, total: pages });
    try {
      const { redactPdf } = await import("@/lib/pdf-redact");
      const bytes = await redactPdf(file.data, boxes, {
        dpi,
        format,
        signal: controller.signal,
        onPage: (done, total) => setPhase({ kind: "redacting", done, total }),
      });
      track("conversion_success", { ...params(), duration_bucket: durationBucket(now() - started) });
      setPhase({ kind: "done", bytes, pages });
    } catch (err) {
      if (err instanceof CancelledError) {
        track("conversion_cancel", params());
        setPhase({ kind: "ready" });
        return;
      }
      const e = classifyPdfError(err);
      console.error(err);
      track("conversion_error", { ...params(), error_code: e.code === "unknown" ? "render_failed" : e.code });
      setPhase({ kind: "error", message: e.message });
    }
  };

  const reset = () => {
    workAbort.current?.abort();
    clearPreviews();
    setFile(null);
    setBoxes([]);
    setSearchNote(null);
    setPhase({ kind: "idle" });
  };

  if (!file) {
    return (
      <div className={toolCard}>
        <FileDropzone
          accept=".pdf,application/pdf"
          disabled={phase.kind === "loading"}
          onFiles={load}
          onDragIntent={() => void import("@/lib/pdf-redact")}
          label="Drop a PDF to redact"
          hint={<PrivacyNote />}
          dropAnywhere
        >
          {phase.kind === "loading" ? <p className="font-semibold text-neutral-900">Reading the PDF…</p> : undefined}
        </FileDropzone>
        {phase.kind === "error" && <ErrorAlert message={phase.message} />}
        {phase.kind === "error" && phase.encrypted && (
          <p className="mt-2 text-sm text-neutral-700">
            Remove the protection with <Link href="/unlock-pdf" className="font-semibold text-brand-600 underline">Unlock PDF</Link>{" "}
            first — it continues straight back here.
          </p>
        )}
      </div>
    );
  }

  const busy = phase.kind === "searching" || phase.kind === "redacting";
  const pagesWithBoxes = new Set(boxes.map((b) => b.pageIndex));
  const outName = `${baseName(file.name)}-redacted.pdf`;

  return (
    <div className={toolCard}>
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-neutral-50 p-4">
        <div>
          <p className="break-all font-semibold text-neutral-900">{file.name}</p>
          <p className="mt-1 text-sm text-neutral-600" data-testid="redact-summary">
            {file.sizes.length} {file.sizes.length === 1 ? "page" : "pages"} · {formatBytes(file.data.byteLength)} ·{" "}
            {boxes.length} {boxes.length === 1 ? "box" : "boxes"} on {pagesWithBoxes.size}{" "}
            {pagesWithBoxes.size === 1 ? "page" : "pages"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => edit([])} disabled={busy || boxes.length === 0} className={secondaryButton}>
            Clear all boxes
          </button>
          <button type="button" onClick={reset} disabled={phase.kind === "redacting"} className={secondaryButton}>
            Choose another PDF
          </button>
        </div>
      </div>

      {/* Search */}
      <form
        className="mt-4 rounded-2xl border border-line p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <fieldset disabled={busy}>
          <legend className="text-sm font-semibold text-ink">Find and mark</legend>
          <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="What to find">
            {MODES.map((m) => (
              <label
                key={m.id}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-300 ${
                  mode === m.id ? "border-brand-500 bg-brand-50 text-ink" : "border-line bg-white text-neutral-700"
                }`}
              >
                <input type="radio" name="mode" value={m.id} checked={mode === m.id} onChange={() => setMode(m.id)} className="sr-only" />
                {m.label}
              </label>
            ))}
          </div>
          {(mode === "text" || mode === "regex") && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label htmlFor="redact-query" className="sr-only">
                {mode === "text" ? "Text to redact" : "Regular expression"}
              </label>
              <input
                id="redact-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mode === "text" ? "A name, an account number…" : String.raw`e.g. \b\d{4}-\d{4}\b`}
                className="min-h-10 min-w-0 flex-1 rounded-lg border border-[#d4d4d0] px-3 font-mono text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <label className="flex items-center gap-1.5 text-sm text-neutral-700">
                <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
                Match case
              </label>
              <label className="flex items-center gap-1.5 text-sm text-neutral-700">
                <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} />
                Whole words
              </label>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="submit" className={secondaryButton}>
              {phase.kind === "searching" ? `Searching… ${phase.done}/${phase.total}` : "Mark all matches"}
            </button>
            {phase.kind === "searching" && (
              <button type="button" onClick={() => workAbort.current?.abort()} className={secondaryButton}>
                Stop
              </button>
            )}
          </div>
        </fieldset>
        {searchNote && (
          <p className="mt-2 text-sm text-neutral-700" aria-live="polite" data-testid="search-note">
            {searchNote}
          </p>
        )}
      </form>

      {/* Pages */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-600">
          {drawMode ? "Drag on a page to draw a box. " : "Scrolling mode: drawing is off. "}
          Click a box to remove it.
        </p>
        <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
          <input type="checkbox" checked={drawMode} onChange={(e) => setDrawMode(e.target.checked)} />
          Draw boxes
        </label>
      </div>

      {previewProgress < file.sizes.length && (
        <div className="mt-3 max-w-xs" aria-live="polite">
          <ProgressBar value={previewProgress / file.sizes.length} label="Loading page previews" />
          <p className="mt-1 text-xs text-neutral-600">
            Loading pages… {previewProgress} / {file.sizes.length}
          </p>
        </div>
      )}

      <ol className="mt-3 space-y-5" aria-label="Pages">
        {file.sizes.map((size, i) => (
          <li key={i} className="mx-auto" style={{ maxWidth: Math.round(Math.min(PREVIEW_WIDTH, (MAX_PAGE_HEIGHT * size.width) / size.height)) }}>
            <p className="mb-1 text-xs font-medium text-neutral-600">
              Page {i + 1}
              {pagesWithBoxes.has(i) && <span className="text-red-700"> · will be redacted</span>}
            </p>
            <PageCanvas
              index={i}
              size={size}
              preview={previews[i]}
              boxes={boxes.filter((b) => b.pageIndex === i)}
              drawing={drawMode && !busy}
              onAdd={(rect) => edit([...boxes, manualBox(i, rect)])}
              onRemove={(id) => edit(boxes.filter((b) => b.id !== id))}
            />
          </li>
        ))}
      </ol>

      {/* Apply */}
      <div className="sticky bottom-0 z-10 -mx-3 mt-5 border-t border-line bg-white/95 px-3 py-3 sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={redact} disabled={busy || boxes.length === 0} className={primaryButton}>
            {phase.kind === "redacting" ? `Redacting… ${phase.done}/${phase.total}` : "Redact and save"}
          </button>
          {phase.kind === "redacting" && (
            <button type="button" onClick={() => workAbort.current?.abort()} className={secondaryButton}>
              Cancel
            </button>
          )}
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <span>Quality</span>
            <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))} disabled={busy} className="min-h-10 rounded-lg border border-[#d4d4d0] bg-white px-2 text-sm">
              {QUALITIES.map((q) => (
                <option key={q.dpi} value={q.dpi}>
                  {q.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-sm text-neutral-700">
            <input type="checkbox" checked={format === "png"} onChange={(e) => setFormat(e.target.checked ? "png" : "jpeg")} disabled={busy} />
            Lossless (PNG, larger file)
          </label>
        </div>
        {phase.kind === "redacting" && (
          <div className="mt-2 max-w-xs">
            <ProgressBar value={phase.done / Math.max(1, phase.total)} label="Redacting pages" />
          </div>
        )}
        {boxes.length === 0 && phase.kind === "ready" && (
          <p className="mt-2 text-sm text-neutral-600">Mark something to redact first: search above, or draw on a page.</p>
        )}
      </div>

      {phase.kind === "error" && <ErrorAlert message={phase.message} />}

      {phase.kind === "done" && (
        <div className="mt-5 space-y-3" data-testid="redact-done">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm text-emerald-800">
              ✓ {phase.pages} {phase.pages === 1 ? "page" : "pages"} redacted and flattened · metadata removed ·{" "}
              {formatBytes(phase.bytes.byteLength)}
            </p>
            <button
              type="button"
              onClick={() => {
                saveBlob(new Blob([phase.bytes as BlobPart], { type: "application/pdf" }), outName);
                track("output_download", params());
              }}
              className={primaryButton}
            >
              Download {outName}
            </button>
          </div>
          <p className="text-sm text-neutral-600">
            Redacted pages are now images, so their remaining text can no longer be selected or searched. Run the file through
            OCR to make it searchable again — the blacked-out parts stay unreadable, because they no longer exist.
          </p>
          <ContinueWith
            from={TOOL}
            targets={["ocr-pdf", "pdf-metadata", "merge-pdf", "organize-pdf"]}
            file={() => new File([phase.bytes as BlobPart], outName, { type: "application/pdf" })}
          />
        </div>
      )}
    </div>
  );
}

const key = (page: number, r: Rect) => `${page}:${r.x.toFixed(1)}:${r.y.toFixed(1)}:${r.width.toFixed(1)}:${r.height.toFixed(1)}`;

/**
 * One page: the preview image, the boxes on top (in % of the page, so they
 * follow any display size), and a pointer layer to draw new ones.
 */
function PageCanvas({
  index,
  size,
  preview,
  boxes,
  drawing,
  onAdd,
  onRemove,
}: {
  index: number;
  size: PageSize;
  preview?: string;
  boxes: RedactionBox[];
  drawing: boolean;
  onAdd: (rect: Rect) => void;
  onRemove: (id: string) => void;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  /** Pointer position in page points. */
  const toPage = (e: ReactPointerEvent) => {
    const box = layerRef.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    const y = Math.min(1, Math.max(0, (e.clientY - box.top) / box.height));
    return { x: x * size.width, y: y * size.height };
  };

  const pct = (r: Rect) => ({
    left: `${(r.x / size.width) * 100}%`,
    top: `${(r.y / size.height) * 100}%`,
    width: `${(r.width / size.width) * 100}%`,
    height: `${(r.height / size.height) * 100}%`,
  });

  const draftRect: Rect | null = draft
    ? {
        x: Math.min(draft.x0, draft.x1),
        y: Math.min(draft.y0, draft.y1),
        width: Math.abs(draft.x1 - draft.x0),
        height: Math.abs(draft.y1 - draft.y0),
      }
    : null;

  return (
    <div
      ref={layerRef}
      className={`relative select-none overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm ${drawing ? "cursor-crosshair touch-none" : ""}`}
      style={{ aspectRatio: `${size.width} / ${size.height}` }}
      data-testid="redact-page"
      onPointerDown={(e) => {
        if (!drawing || e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const p = toPage(e);
        setDraft({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
      }}
      onPointerMove={(e) => {
        if (!draft) return;
        const p = toPage(e);
        setDraft({ ...draft, x1: p.x, y1: p.y });
      }}
      onPointerUp={() => {
        // Ignore clicks and slips: a box needs a few points in both directions.
        if (draftRect && draftRect.width > 3 && draftRect.height > 3) onAdd(draftRect);
        setDraft(null);
      }}
      onPointerCancel={() => setDraft(null)}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local blob: preview
        <img src={preview} alt={`Page ${index + 1}`} draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">Loading page {index + 1}…</span>
      )}
      {boxes.map((b, k) => (
        <button
          key={b.id}
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onRemove(b.id)}
          aria-label={`Remove box ${k + 1} on page ${index + 1}${b.text ? ` (“${b.text}”)` : ""}`}
          title={b.text ? `“${b.text}” — click to remove` : "Click to remove"}
          className="absolute cursor-pointer bg-black/75 outline-none ring-red-500 hover:bg-red-900/70 focus-visible:ring-2"
          style={pct(b.rect)}
        />
      ))}
      {draftRect && <div className="pointer-events-none absolute border-2 border-red-500 bg-black/40" style={pct(draftRect)} />}
    </div>
  );
}
