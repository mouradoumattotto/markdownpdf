"use client";

import { useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/ai-limits";
import { countBucket, durationBucket, extensionOf, sizeBucket, track } from "@/lib/analytics";
import { CancelledError, saveBlob } from "@/lib/files";
import type { Orientation, PageSize } from "@/lib/pdf-images";
import FileDropzone, { ErrorAlert, PrivacyNote, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";
import SortableList, { byName } from "@/components/SortableList";
import ContinueWith from "@/components/ContinueWith";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/bmp";
const MAX_FILES = 100;

interface Item {
  id: number;
  name: string;
  file: File;
  url: string;
}

type Phase =
  | { kind: "idle" }
  | { kind: "building"; done: number; total: number }
  | { kind: "built"; bytes: Uint8Array }
  | { kind: "error"; message: string };

const MARGINS = [
  { value: 0, label: "None" },
  { value: 18, label: "Small" },
  { value: 36, label: "Large" },
];

let nextId = 1;
const now = () => performance.now();

export default function ImagesToPdfTool({
  tool: TOOL = "jpg-to-pdf",
  defaultPageSize = "a4",
}: {
  /** Analytics name: the same tool serves /jpg-to-pdf and /png-to-pdf. */
  tool?: string;
  defaultPageSize?: PageSize;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [skipped, setSkipped] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>(defaultPageSize);
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState(18);
  const abortRef = useRef<AbortController | null>(null);
  const itemsRef = useRef<Item[]>([]);

  // Preview URLs are released when an image is removed, and on unmount.
  useEffect(() => {
    const kept = new Set(items.map((i) => i.url));
    itemsRef.current.filter((i) => !kept.has(i.url)).forEach((i) => URL.revokeObjectURL(i.url));
    itemsRef.current = items;
  }, [items]);
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  const totalBytes = items.reduce((s, i) => s + i.file.size, 0);
  const params = () => ({
    tool_name: TOOL,
    input_format: items[0] ? extensionOf(items[0].name) : "jpg",
    output_format: "pdf",
    file_count_bucket: countBucket(items.length),
    file_size_bucket: sizeBucket(totalBytes),
    export_mode: pageSize,
  });

  const invalidate = () => {
    if (phase.kind === "built") setPhase({ kind: "idle" });
  };

  const add = (files: File[]) => {
    const images = files.filter((f) => ACCEPT.split(",").includes(f.type));
    const rejected = files.filter((f) => !images.includes(f)).map((f) => `${f.name}: not a supported image`);
    const room = MAX_FILES - items.length;
    if (images.length > room) rejected.push(`Only ${MAX_FILES} images can be combined at once.`);
    const added = images.slice(0, Math.max(0, room)).map((file) => ({
      id: nextId++,
      name: file.name,
      file,
      url: URL.createObjectURL(file),
    }));
    track("file_selected", {
      tool_name: TOOL,
      input_format: images[0] ? extensionOf(images[0].name) : "unknown",
      file_count_bucket: countBucket(files.length),
    });
    setItems((prev) => [...prev, ...added]);
    setSkipped(rejected);
    invalidate();
  };

  // Screenshots are usually in the clipboard: accept a paste.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      e.preventDefault();
      // Pasted images are all called "image.png"; number them so the list is readable.
      const stamp = new Date().toTimeString().slice(0, 8).replace(/:/g, "");
      add(files.map((f, i) => new File([f], `pasted-${stamp}-${i + 1}.${f.type.split("/")[1] ?? "png"}`, { type: f.type })));
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const build = async () => {
    if (!items.length) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const started = now();
    track("conversion_start", params());
    setPhase({ kind: "building", done: 0, total: items.length });
    try {
      const { imagesToPdf } = await import("@/lib/pdf-images");
      const bytes = await imagesToPdf(
        items.map((i) => i.file),
        {
          pageSize,
          orientation,
          margin,
          signal: controller.signal,
          onProgress: (done, total) => setPhase({ kind: "building", done, total }),
        },
      );
      track("conversion_success", { ...params(), duration_bucket: durationBucket(now() - started) });
      setPhase({ kind: "built", bytes });
    } catch (err) {
      if (err instanceof CancelledError || controller.signal.aborted) {
        track("conversion_cancel", params());
        setPhase({ kind: "idle" });
        return;
      }
      console.error(err);
      track("conversion_error", { ...params(), error_code: "render_failed" });
      setPhase({
        kind: "error",
        message: "One of the images could not be read. Remove it, or open it in an image editor and save it again as JPG or PNG.",
      });
    } finally {
      abortRef.current = null;
    }
  };

  const busy = phase.kind === "building";

  return (
    <div className={toolCard}>
      <FileDropzone
        accept={ACCEPT}
        multiple
        disabled={busy || items.length >= MAX_FILES}
        onFiles={add}
        onDragIntent={() => void import("@/lib/pdf-images")}
        label={items.length ? "Add more images" : "Drop JPG or PNG images here"}
        hint={
          <>
            <PrivacyNote /> <span className="block sm:inline">· or paste with Ctrl+V</span>
          </>
        }
        compact={items.length > 0}
      />

      {skipped.length > 0 && (
        <div role="alert" data-testid="images-skipped" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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
        <>
          <fieldset className="mt-5 grid gap-4 sm:grid-cols-3" disabled={busy}>
            <div>
              <label htmlFor="page-size" className="mb-1 block text-sm font-medium text-neutral-800">
                Page size
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value as PageSize);
                  invalidate();
                }}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                <option value="a4">A4</option>
                <option value="letter">US Letter</option>
                <option value="fit">Same as each image</option>
              </select>
            </div>
            <div>
              <label htmlFor="orientation" className="mb-1 block text-sm font-medium text-neutral-800">
                Orientation
              </label>
              <select
                id="orientation"
                value={orientation}
                disabled={pageSize === "fit"}
                onChange={(e) => {
                  setOrientation(e.target.value as Orientation);
                  invalidate();
                }}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="auto">Automatic (follows each image)</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div>
              <label htmlFor="margin" className="mb-1 block text-sm font-medium text-neutral-800">
                Margin
              </label>
              <select
                id="margin"
                value={margin}
                disabled={pageSize === "fit"}
                onChange={(e) => {
                  setMargin(Number(e.target.value));
                  invalidate();
                }}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                {MARGINS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <div className="mb-2 mt-5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-neutral-600" data-testid="jpg-summary">
              {items.length} {items.length === 1 ? "image" : "images"} · {formatBytes(totalBytes)} · one page each
            </p>
            <button
              type="button"
              onClick={() => {
                setItems(byName(items));
                invalidate();
              }}
              disabled={busy}
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Sort by name
            </button>
          </div>
          <SortableList
            items={items}
            label="Page order"
            disabled={busy}
            onChange={(next) => {
              setItems(next);
              invalidate();
            }}
            renderItem={(item) => (
              <span className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local blob: preview */}
                <img src={item.url} alt="" className="h-12 w-12 shrink-0 rounded border border-neutral-200 object-cover" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-neutral-900" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-xs text-neutral-500">{formatBytes(item.file.size)}</span>
                </span>
              </span>
            )}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={build} disabled={busy} className={primaryButton}>
              Create PDF
            </button>
            {busy && (
              <button type="button" onClick={() => abortRef.current?.abort()} className={secondaryButton}>
                Cancel
              </button>
            )}
          </div>
        </>
      )}

      {phase.kind === "building" && (
        <div className="mt-4 max-w-md space-y-2" aria-live="polite">
          <ProgressBar value={phase.done / phase.total} label="PDF progress" />
          <p className="text-xs text-neutral-600">
            {phase.done} of {phase.total} images placed
          </p>
        </div>
      )}

      {phase.kind === "error" && <ErrorAlert message={phase.message} />}

      {phase.kind === "built" && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4" data-testid="jpg-done">
          <p className="text-sm text-emerald-800">
            ✓ PDF ready: {items.length} {items.length === 1 ? "page" : "pages"} · {formatBytes(phase.bytes.byteLength)}
          </p>
          <button
            type="button"
            onClick={() => {
              saveBlob(new Blob([phase.bytes as BlobPart], { type: "application/pdf" }), "images.pdf");
              track("output_download", params());
            }}
            className={primaryButton}
          >
            Download images.pdf
          </button>
        </div>
      )}
      {phase.kind === "built" && (
        <ContinueWith
          className="mt-3"
          from={TOOL}
          targets={["ocr-pdf", "merge-pdf", "organize-pdf", "redact-pdf"]}
          file={() => new File([phase.bytes as BlobPart], "images.pdf", { type: "application/pdf" })}
        />
      )}
    </div>
  );
}
