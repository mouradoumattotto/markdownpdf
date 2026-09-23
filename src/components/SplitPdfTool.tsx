"use client";

import { useMemo, useRef, useState } from "react";
import { formatBytes } from "@/lib/ai-limits";
import { countBucket, durationBucket, pageBucket, sizeBucket, track } from "@/lib/analytics";
import { CancelledError, baseName, classifyPdfError, saveBlob, sniffMessage, sniffPdf } from "@/lib/files";
import type { BuiltPart, Range } from "@/lib/pdf-split";
import FileDropzone, { ErrorAlert, PrivacyNote, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "split-pdf";

type Mode = "ranges" | "extract" | "every" | "single";

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "ranges", label: "Split by ranges", hint: "One PDF per range" },
  { value: "extract", label: "Extract pages", hint: "Selected pages in one PDF" },
  { value: "every", label: "Every N pages", hint: "Equal-sized parts" },
  { value: "single", label: "Every page", hint: "One PDF per page" },
];

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "building"; done: number; total: number }
  | { kind: "built"; parts: { name: string; bytes: Uint8Array; pages: number }[] }
  | { kind: "error"; message: string };

export default function SplitPdfTool() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [file, setFile] = useState<{ name: string; data: ArrayBuffer; pages: number } | null>(null);
  const [mode, setMode] = useState<Mode>("ranges");
  const [rangeText, setRangeText] = useState("");
  const [every, setEvery] = useState("10");
  const [lib, setLib] = useState<typeof import("@/lib/pdf-split") | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /** The ranges the current settings describe, or a message explaining what is wrong. */
  const plan = useMemo((): { ranges: Range[] } | { error: string } | null => {
    if (!file || !lib) return null;
    if (mode === "single") return { ranges: lib.planEvery(file.pages, 1) };
    if (mode === "every") {
      const n = Number(every);
      if (!Number.isInteger(n) || n < 1) return { error: "Enter a whole number of pages, 1 or more." };
      return { ranges: lib.planEvery(file.pages, n) };
    }
    if (!rangeText.trim()) return { error: `Enter pages or ranges between 1 and ${file.pages}, e.g. 1-3, 5, 8-` };
    return lib.parseRanges(rangeText, file.pages);
  }, [file, lib, mode, every, rangeText]);

  const params = (extra: Record<string, string> = {}) => ({
    tool_name: TOOL,
    input_format: "pdf",
    output_format: "pdf",
    export_mode: mode,
    file_size_bucket: file ? sizeBucket(file.data.byteLength) : undefined,
    page_count_bucket: file ? pageBucket(file.pages) : undefined,
    ...extra,
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
      setPhase({ kind: "ready" });
    } catch (err) {
      const e = classifyPdfError(err);
      // Encrypted or damaged files are expected input, not bugs.
      if (e.code === "unknown") console.error(err);
      track("conversion_error", { ...base, error_code: e.code });
      setPhase({ kind: "error", message: e.message });
    }
  };

  const split = async () => {
    if (!file || !lib || !plan || "error" in plan) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const started = performance.now();
    track("conversion_start", params());
    const base = baseName(file.name);
    try {
      let parts: { name: string; bytes: Uint8Array; pages: number }[];
      if (mode === "extract") {
        setPhase({ kind: "building", done: 0, total: 1 });
        const bytes = await lib.extractPages(file.data, plan.ranges);
        const pages = plan.ranges.reduce((s, r) => s + r.to - r.from + 1, 0);
        parts = [{ name: `${base}-extracted.pdf`, bytes, pages }];
      } else {
        setPhase({ kind: "building", done: 0, total: plan.ranges.length });
        const built: BuiltPart[] = await lib.buildParts(file.data, plan.ranges, {
          signal: controller.signal,
          onProgress: (done, total) => setPhase({ kind: "building", done, total }),
        });
        parts = built.map((p, i) => ({
          name:
            mode === "single"
              ? `${base}-page-${String(p.range.from + 1).padStart(String(file.pages).length, "0")}.pdf`
              : lib.partFileName(base, i, built.length, p.range),
          bytes: p.bytes,
          pages: p.range.to - p.range.from + 1,
        }));
      }
      track("conversion_success", {
        ...params(),
        file_count_bucket: countBucket(parts.length),
        duration_bucket: durationBucket(performance.now() - started),
      });
      setPhase({ kind: "built", parts });
    } catch (err) {
      if (err instanceof CancelledError || controller.signal.aborted) {
        track("conversion_cancel", params());
        setPhase({ kind: "ready" });
        return;
      }
      console.error(err);
      const e = classifyPdfError(err);
      track("conversion_error", { ...params(), error_code: e.code });
      setPhase({ kind: "error", message: e.message });
    } finally {
      abortRef.current = null;
    }
  };

  const downloadOne = (p: { name: string; bytes: Uint8Array }) => {
    saveBlob(new Blob([p.bytes as BlobPart], { type: "application/pdf" }), p.name);
    track("output_download", { ...params(), file_count_bucket: "1" });
  };

  const downloadAll = async (parts: { name: string; bytes: Uint8Array }[]) => {
    const zip = await lib!.zipParts(parts);
    saveBlob(zip, `${baseName(file!.name)}-split.zip`);
    track("output_download", { ...params(), output_format: "zip", file_count_bucket: countBucket(parts.length) });
  };

  const reset = () => {
    setFile(null);
    setPhase({ kind: "idle" });
  };

  const changeSettings = (fn: () => void) => {
    fn();
    if (phase.kind === "built") setPhase({ kind: "ready" });
  };

  const busy = phase.kind === "loading" || phase.kind === "building";
  const planError = plan && "error" in plan ? plan.error : null;
  const planRanges = plan && "ranges" in plan ? plan.ranges : [];
  const outputCount = mode === "extract" ? (planRanges.length ? 1 : 0) : planRanges.length;

  if (!file) {
    return (
      <div className={toolCard}>
        <FileDropzone
          accept=".pdf,application/pdf"
          disabled={busy}
          onFiles={load}
          onDragIntent={() => void import("@/lib/pdf-split")}
          label="Drop a PDF to split"
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
          <p className="mt-1 text-sm text-neutral-600" data-testid="split-summary">
            {file.pages} {file.pages === 1 ? "page" : "pages"} · {formatBytes(file.data.byteLength)}
          </p>
        </div>
        <button type="button" onClick={reset} disabled={busy} className={secondaryButton}>
          Choose another PDF
        </button>
      </div>

      <fieldset className="mt-5" disabled={busy}>
        <legend className="mb-2 text-sm font-medium text-neutral-800">How to split</legend>
        <div className="grid gap-2 sm:grid-cols-4">
          {MODES.map((m) => (
            <label
              key={m.value}
              className={`flex cursor-pointer gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                mode === m.value ? "border-indigo-400 bg-indigo-50" : "border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                name="split-mode"
                value={m.value}
                checked={mode === m.value}
                onChange={() => changeSettings(() => setMode(m.value))}
                className="mt-1 accent-indigo-600"
              />
              <span>
                <span className="block font-medium text-neutral-900">{m.label}</span>
                <span className="block text-xs text-neutral-600">{m.hint}</span>
              </span>
            </label>
          ))}
        </div>

        {(mode === "ranges" || mode === "extract") && (
          <div className="mt-4">
            <label htmlFor="split-ranges" className="block text-sm font-medium text-neutral-800">
              Pages {mode === "ranges" ? "— each range becomes its own PDF" : "to keep, in this order"}
            </label>
            <input
              id="split-ranges"
              value={rangeText}
              onChange={(e) => changeSettings(() => setRangeText(e.target.value))}
              placeholder={mode === "ranges" ? "1-5, 6-12, 13-" : "1-3, 7, 10-12"}
              inputMode="numeric"
              autoComplete="off"
              aria-describedby="split-help"
              aria-invalid={Boolean(planError && rangeText.trim())}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:max-w-md"
            />
            <p id="split-help" className="mt-1 text-xs text-neutral-500">
              Separate with commas. “8-” means page 8 to the end.
            </p>
          </div>
        )}
        {mode === "every" && (
          <div className="mt-4">
            <label htmlFor="split-every" className="block text-sm font-medium text-neutral-800">
              Pages per part
            </label>
            <input
              id="split-every"
              type="number"
              min={1}
              max={file.pages}
              value={every}
              onChange={(e) => changeSettings(() => setEvery(e.target.value))}
              className="mt-1 w-32 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        )}
      </fieldset>

      <div className="mt-4 text-sm" aria-live="polite">
        {planError && (rangeText.trim() || mode === "every") ? (
          <p className="text-red-700" data-testid="split-plan-error">
            {planError}
          </p>
        ) : planRanges.length > 0 ? (
          <p className="text-neutral-700" data-testid="split-plan">
            {outputCount} {outputCount === 1 ? "PDF" : "PDFs"} will be created
            {mode === "extract" &&
              ` with ${planRanges.reduce((s, r) => s + r.to - r.from + 1, 0)} pages`}
            .
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={split} disabled={busy || !planRanges.length} className={primaryButton}>
          {mode === "extract" ? "Extract pages" : "Split PDF"}
        </button>
        {phase.kind === "building" && (
          <button type="button" onClick={() => abortRef.current?.abort()} className={secondaryButton}>
            Cancel
          </button>
        )}
      </div>

      {phase.kind === "building" && (
        <div className="mt-4 max-w-md space-y-2" aria-live="polite">
          <ProgressBar value={phase.total ? phase.done / phase.total : 0} label="Split progress" />
          <p className="text-xs text-neutral-500">
            {phase.done} of {phase.total} files written
          </p>
        </div>
      )}

      {phase.kind === "error" && <ErrorAlert message={phase.message} />}

      {phase.kind === "built" && (
        <div className="mt-6" data-testid="split-done">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold text-neutral-900">
              ✓ {phase.parts.length} {phase.parts.length === 1 ? "file" : "files"} ready
            </p>
            {phase.parts.length > 1 && (
              <button type="button" onClick={() => downloadAll(phase.parts)} className={primaryButton}>
                Download all (.zip)
              </button>
            )}
          </div>
          <ul className="max-h-80 divide-y divide-neutral-100 overflow-y-auto rounded-xl border border-neutral-200 text-sm">
            {phase.parts.map((p) => (
              <li key={p.name} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                <span className="break-all text-neutral-800">
                  {p.name}
                  <span className="ml-2 text-neutral-500">
                    {p.pages} {p.pages === 1 ? "page" : "pages"} · {formatBytes(p.bytes.byteLength)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => downloadOne(p)}
                  className="font-medium text-indigo-600 hover:underline"
                  aria-label={`Download ${p.name}`}
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
