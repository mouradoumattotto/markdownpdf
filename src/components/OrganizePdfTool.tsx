"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatBytes } from "@/lib/ai-limits";
import { durationBucket, pageBucket, sizeBucket, track } from "@/lib/analytics";
import { CancelledError, baseName, classifyPdfError, saveBlob, sniffMessage, sniffPdf, throwIfAborted } from "@/lib/files";
import ContinueWith from "@/components/ContinueWith";
import FileDropzone, { ErrorAlert, PrivacyNote, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "organize-pdf";
const THUMB_WIDTH = 160;

interface PageCard {
  /** Stable key: the source index, plus a suffix for duplicates. */
  id: string;
  source: number;
  rotate: number;
}

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "saving" }
  | { kind: "saved"; bytes: Uint8Array }
  | { kind: "error"; message: string };

const now = () => performance.now();
let nextCopy = 1;
const initialCards = (n: number): PageCard[] => Array.from({ length: n }, (_, i) => ({ id: String(i), source: i, rotate: 0 }));

export default function OrganizePdfTool() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [file, setFile] = useState<{ name: string; data: ArrayBuffer; pages: number } | null>(null);
  const [cards, setCards] = useState<PageCard[]>([]);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [thumbProgress, setThumbProgress] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  const thumbAbort = useRef<AbortController | null>(null);
  const thumbsRef = useRef<Record<number, string>>({});

  useEffect(() => {
    thumbsRef.current = thumbs;
  }, [thumbs]);
  useEffect(
    () => () => {
      thumbAbort.current?.abort();
      Object.values(thumbsRef.current).forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const params = () => ({
    tool_name: TOOL,
    input_format: "pdf",
    output_format: "pdf",
    file_size_bucket: file ? sizeBucket(file.data.byteLength) : undefined,
    page_count_bucket: file ? pageBucket(file.pages) : undefined,
  });

  const clearThumbs = () => {
    thumbAbort.current?.abort();
    Object.values(thumbsRef.current).forEach((u) => URL.revokeObjectURL(u));
    thumbsRef.current = {};
    setThumbs({});
  };

  /** Thumbnails render one by one in the background; the grid is usable before they finish. */
  const renderThumbs = async (data: ArrayBuffer, count: number) => {
    const controller = new AbortController();
    thumbAbort.current = controller;
    const [{ openPdf }, { renderThumbnail }] = await Promise.all([import("@/lib/pdfjs"), import("@/lib/pdf-images")]);
    const task = await openPdf(data.slice(0));
    try {
      const doc = await task.promise;
      for (let i = 0; i < count; i++) {
        throwIfAborted(controller.signal);
        const page = await doc.getPage(i + 1);
        const { url } = await renderThumbnail(page, THUMB_WIDTH);
        page.cleanup();
        if (controller.signal.aborted) {
          URL.revokeObjectURL(url);
          break;
        }
        setThumbs((t) => ({ ...t, [i]: url }));
        setThumbProgress(i + 1);
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
      const { countPages } = await import("@/lib/pdf-split");
      const pages = await countPages(data);
      clearThumbs();
      setThumbProgress(0);
      setFile({ name: f.name, data, pages });
      setCards(initialCards(pages));
      setPhase({ kind: "ready" });
      void renderThumbs(data, pages);
    } catch (err) {
      const e = classifyPdfError(err);
      if (e.code === "unknown") console.error(err);
      track("conversion_error", { ...base, error_code: e.code });
      setPhase({ kind: "error", message: e.message });
    }
  };

  const edit = (next: PageCard[]) => {
    setCards(next);
    if (phase.kind === "saved" || phase.kind === "error") setPhase({ kind: "ready" });
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= cards.length || from === to) return;
    const next = [...cards];
    const [c] = next.splice(from, 1);
    next.splice(to, 0, c);
    edit(next);
  };
  const rotate = (index: number, by: number) => edit(cards.map((c, i) => (i === index ? { ...c, rotate: c.rotate + by } : c)));
  const remove = (index: number) => edit(cards.filter((_, i) => i !== index));
  const duplicate = (index: number) => {
    const c = cards[index];
    const next = [...cards];
    next.splice(index + 1, 0, { ...c, id: `${c.source}-copy-${nextCopy++}` });
    edit(next);
  };

  const save = async () => {
    if (!file || !cards.length) return;
    const started = now();
    track("conversion_start", params());
    setPhase({ kind: "saving" });
    try {
      const { organizePdf } = await import("@/lib/pdf-organize");
      const bytes = await organizePdf(file.data, cards.map((c) => ({ source: c.source, rotate: c.rotate })));
      track("conversion_success", { ...params(), duration_bucket: durationBucket(now() - started) });
      setPhase({ kind: "saved", bytes });
    } catch (err) {
      const e = classifyPdfError(err);
      console.error(err);
      track("conversion_error", { ...params(), error_code: e.code });
      setPhase({ kind: "error", message: e.message });
    }
  };

  const reset = () => {
    clearThumbs();
    setFile(null);
    setCards([]);
    setPhase({ kind: "idle" });
  };

  if (!file) {
    return (
      <div className={toolCard}>
        <FileDropzone
          accept=".pdf,application/pdf"
          disabled={phase.kind === "loading"}
          onFiles={load}
          onDragIntent={() => void import("@/lib/pdf-organize")}
          label="Drop a PDF to organize"
          hint={<PrivacyNote />}
        >
          {phase.kind === "loading" ? <p className="font-semibold text-neutral-900">Reading the PDF…</p> : undefined}
        </FileDropzone>
        {phase.kind === "error" && <ErrorAlert message={phase.message} />}
      </div>
    );
  }

  const changed =
    cards.length !== file.pages || cards.some((c, i) => c.source !== i || c.rotate % 360 !== 0);
  const saving = phase.kind === "saving";

  return (
    <div className={toolCard}>
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-neutral-50 p-4">
        <div>
          <p className="break-all font-semibold text-neutral-900">{file.name}</p>
          <p className="mt-1 text-sm text-neutral-600" data-testid="organize-summary">
            {cards.length} of {file.pages} pages · {formatBytes(file.data.byteLength)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => edit(cards.map((c) => ({ ...c, rotate: c.rotate + 90 })))} disabled={saving} className={secondaryButton}>
            Rotate all ↻
          </button>
          <button type="button" onClick={() => edit(initialCards(file.pages))} disabled={saving || !changed} className={secondaryButton}>
            Undo all changes
          </button>
          <button type="button" onClick={reset} disabled={saving} className={secondaryButton}>
            Choose another PDF
          </button>
        </div>
      </div>

      {thumbProgress < file.pages && (
        <div className="mt-3 max-w-xs" aria-live="polite">
          <ProgressBar value={thumbProgress / file.pages} label="Loading page previews" />
          <p className="mt-1 text-xs text-neutral-600">
            Loading previews… {thumbProgress} / {file.pages}
          </p>
        </div>
      )}

      <p className="mt-4 text-sm text-neutral-600">
        Drag pages to reorder them, or use the buttons under each page.
      </p>

      <ol className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5" aria-label="Pages">
        {cards.map((card, index) => (
          <li
            key={card.id}
            draggable={!saving}
            onDragStart={() => setDragging(index)}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragging !== null && dragging !== index) {
                move(dragging, index);
                setDragging(index);
              }
            }}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={() => setDragging(null)}
            data-testid="page-card"
            className={`flex flex-col rounded-xl border p-2 ${dragging === index ? "border-indigo-400 bg-indigo-50" : "border-neutral-200 bg-white"}`}
          >
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
              {thumbs[card.source] ? (
                // eslint-disable-next-line @next/next/no-img-element -- a local blob: preview
                <img
                  src={thumbs[card.source]}
                  alt={`Page ${card.source + 1}`}
                  draggable={false}
                  style={{ transform: `rotate(${card.rotate}deg)` }}
                  className="max-h-full max-w-full object-contain shadow-sm transition-transform"
                />
              ) : (
                <span className="text-xs text-neutral-500">Page {card.source + 1}</span>
              )}
            </div>
            <p className="mt-1.5 text-center text-xs text-neutral-700">
              <span className="font-medium">{index + 1}</span>
              {card.source !== index && <span className="text-neutral-500"> (was {card.source + 1})</span>}
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-0.5">
              <IconButton label={`Move page ${index + 1} earlier`} onClick={() => move(index, index - 1)} disabled={saving || index === 0}>
                ←
              </IconButton>
              <IconButton label={`Rotate page ${index + 1}`} onClick={() => rotate(index, 90)} disabled={saving}>
                ↻
              </IconButton>
              <IconButton label={`Duplicate page ${index + 1}`} onClick={() => duplicate(index)} disabled={saving}>
                ⧉
              </IconButton>
              <IconButton label={`Delete page ${index + 1}`} onClick={() => remove(index)} disabled={saving || cards.length === 1} danger>
                ✕
              </IconButton>
              <IconButton label={`Move page ${index + 1} later`} onClick={() => move(index, index + 1)} disabled={saving || index === cards.length - 1}>
                →
              </IconButton>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={save} disabled={saving || !changed} className={primaryButton}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        {!changed && <p className="text-sm text-neutral-600">Reorder, rotate or delete pages, then save.</p>}
      </div>

      {phase.kind === "error" && <ErrorAlert message={phase.message} />}

      {phase.kind === "saved" && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4" data-testid="organize-done">
          <p className="text-sm text-emerald-800">
            ✓ {cards.length} {cards.length === 1 ? "page" : "pages"} · {formatBytes(phase.bytes.byteLength)}
          </p>
          <button
            type="button"
            onClick={() => {
              saveBlob(new Blob([phase.bytes as BlobPart], { type: "application/pdf" }), `${baseName(file.name)}-organized.pdf`);
              track("output_download", params());
            }}
            className={primaryButton}
          >
            Download {baseName(file.name)}-organized.pdf
          </button>
        </div>
      )}
      {phase.kind === "saved" && (
        <ContinueWith
          className="mt-3"
          from={TOOL}
          targets={["pdf-to-markdown", "merge-pdf", "redact-pdf", "pdf-metadata", "split-pdf"]}
          file={() => new File([phase.bytes as BlobPart], `${baseName(file.name)}-organized.pdf`, { type: "application/pdf" })}
        />
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`h-8 w-8 rounded-md text-sm text-neutral-600 disabled:opacity-30 ${danger ? "hover:bg-red-50 hover:text-red-700" : "hover:bg-neutral-100"}`}
    >
      {children}
    </button>
  );
}
