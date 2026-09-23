"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AI_TARGETS, formatBytes, getTarget } from "@/lib/ai-limits";
import { countBucket, pageBucket, sizeBucket, track } from "@/lib/analytics";
import { CancelledError, baseName, classifyPdfError, saveBlob, sniffMessage, sniffPdf } from "@/lib/files";
import type { BuiltPart, Limits, PdfAnalysis, Range } from "@/lib/pdf-split";
import FileDropzone, { ErrorAlert, PrivacyNote, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "split-pdf-for-ai";
const STORAGE_KEY = "mdpdf.aiTarget";
const MB = 1024 * 1024;

type Phase =
  | { kind: "idle" }
  | { kind: "analyzing"; done: number; total: number }
  | { kind: "ready" }
  | { kind: "building"; done: number; total: number }
  | { kind: "built"; parts: BuiltPart[] }
  | { kind: "error"; message: string };

export default function SplitForAiTool() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [file, setFile] = useState<{ name: string; data: ArrayBuffer } | null>(null);
  const [analysis, setAnalysis] = useState<PdfAnalysis | null>(null);
  const [targetId, setTargetId] = useState("notebooklm");
  const [byChapter, setByChapter] = useState(true);
  const [custom, setCustom] = useState({ pages: "", words: "", mb: "" });
  const abortRef = useRef<AbortController | null>(null);
  // Loaded with the first PDF. Kept in state (not a ref) because rendering the
  // plan reads from it.
  const [planner, setPlanner] = useState<typeof import("@/lib/pdf-split") | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // Read after hydration on purpose: the server-rendered HTML must not
      // depend on this visitor's storage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved && (saved === "custom" || getTarget(saved))) setTargetId(saved);
    } catch {
      // storage unavailable: keep the default
    }
  }, []);

  const limits: Limits = useMemo(() => {
    if (targetId === "custom") {
      const n = (v: string) => (Number(v) > 0 ? Number(v) : undefined);
      const mb = n(custom.mb);
      return { maxPages: n(custom.pages), maxWords: n(custom.words), maxBytes: mb ? mb * MB : undefined };
    }
    const t = getTarget(targetId)!;
    return { maxPages: t.maxPages, maxWords: t.maxWords, maxBytes: t.maxBytes };
  }, [targetId, custom]);

  // Re-plan whenever the target, the strategy or the document changes.
  const plan: Range[] = useMemo(() => {
    if (!analysis || !planner) return [];
    return byChapter && analysis.chapters.length
      ? planner.planByChapters(analysis.pages, analysis.chapters, limits)
      : planner.planByLimits(analysis.pages, limits);
  }, [analysis, limits, byChapter, planner]);

  const params = useCallback(
    () => ({
      tool_name: TOOL,
      input_format: "pdf",
      output_format: "pdf",
      target: targetId,
      file_size_bucket: file ? sizeBucket(file.data.byteLength) : undefined,
      page_count_bucket: analysis ? pageBucket(analysis.pages.length) : undefined,
    }),
    [targetId, file, analysis],
  );

  const load = async (f: File) => {
    setAnalysis(null);
    const base = { tool_name: TOOL, input_format: "pdf", file_size_bucket: sizeBucket(f.size) };
    track("file_selected", base);
    const sniff = await sniffPdf(f);
    if (sniff !== "ok") {
      const e = sniffMessage(sniff);
      track("conversion_error", { ...base, error_code: e.code });
      setPhase({ kind: "error", message: e.message });
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ kind: "analyzing", done: 0, total: 0 });
    try {
      const data = await f.arrayBuffer();
      const lib = await import("@/lib/pdf-split");
      setPlanner(lib);
      const result = await lib.analyzePdf(data, {
        signal: controller.signal,
        onProgress: (done, total) => setPhase({ kind: "analyzing", done, total }),
      });
      setFile({ name: f.name, data });
      setAnalysis(result);
      setByChapter(result.chapters.length > 1);
      setPhase({ kind: "ready" });
    } catch (err) {
      if (err instanceof CancelledError || controller.signal.aborted) {
        track("conversion_cancel", base);
        setPhase({ kind: "idle" });
        return;
      }
      console.error(err);
      const e = classifyPdfError(err);
      track("conversion_error", { ...base, error_code: e.code });
      setPhase({ kind: "error", message: e.message });
    } finally {
      abortRef.current = null;
    }
  };

  const build = async () => {
    if (!file || !plan.length || !planner) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ kind: "building", done: 0, total: plan.length });
    track("conversion_start", params());
    try {
      const parts = await planner.buildParts(file.data, plan, {
        maxBytes: limits.maxBytes,
        signal: controller.signal,
        onProgress: (done, total) => setPhase({ kind: "building", done, total }),
      });
      track("conversion_success", { ...params(), file_count_bucket: countBucket(parts.length) });
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

  const fileName = (i: number, parts: BuiltPart[]) =>
    planner!.partFileName(baseName(file!.name), i, parts.length, parts[i].range);

  const downloadOne = (i: number, parts: BuiltPart[]) => {
    saveBlob(new Blob([parts[i].bytes as BlobPart], { type: "application/pdf" }), fileName(i, parts));
    track("output_download", { ...params(), file_count_bucket: "1" });
  };

  const downloadAll = async (parts: BuiltPart[]) => {
    const zip = await planner!.zipParts(parts.map((p, i) => ({ name: fileName(i, parts), bytes: p.bytes })));
    saveBlob(zip, `${baseName(file!.name)}-parts.zip`);
    track("output_download", { ...params(), file_count_bucket: countBucket(parts.length) });
  };

  const selectTarget = (id: string) => {
    setTargetId(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
    if (phase.kind === "built") setPhase({ kind: "ready" });
  };

  const reset = () => {
    setFile(null);
    setAnalysis(null);
    setPhase({ kind: "idle" });
  };

  const target = getTarget(targetId);
  const totalWords = analysis?.pages.reduce((s, p) => s + p.words, 0) ?? 0;
  const noTextPages = analysis?.pages.filter((p) => !p.hasText).length ?? 0;
  const busy = phase.kind === "analyzing" || phase.kind === "building";

  return (
    <div className={toolCard}>
      {!analysis ? (
        <FileDropzone
          accept=".pdf,application/pdf"
          disabled={busy}
          onFiles={([f]) => f && load(f)}
          onDragIntent={() => void import("@/lib/pdf-split")}
          label="Drop the PDF to split"
          hint={<PrivacyNote />}
        >
          {phase.kind === "analyzing" ? (
            <div className="w-full max-w-sm space-y-4" aria-live="polite">
              <p className="font-semibold text-neutral-900">
                {phase.total ? `Counting words — page ${phase.done} of ${phase.total}` : "Reading PDF…"}
              </p>
              {phase.total > 0 && <ProgressBar value={phase.done / phase.total} label="Analysis progress" />}
            </div>
          ) : undefined}
        </FileDropzone>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-neutral-50 p-4">
            <div>
              <p className="font-semibold text-neutral-900 break-all">{file?.name}</p>
              <p className="mt-1 text-sm text-neutral-600" data-testid="pdf-summary">
                {analysis.pages.length.toLocaleString()} pages · {totalWords.toLocaleString()} words ·{" "}
                {formatBytes(analysis.bytes)}
                {analysis.chapters.length > 1 && ` · ${analysis.chapters.length} chapters`}
              </p>
            </div>
            <button type="button" onClick={reset} className={secondaryButton} disabled={busy}>
              Choose another PDF
            </button>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-neutral-900">Prepare it for</legend>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="AI tool">
              {[...AI_TARGETS.map((t) => ({ id: t.id, name: t.name })), { id: "custom", name: "Custom limits" }].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={targetId === t.id}
                  onClick={() => selectTarget(t.id)}
                  disabled={busy}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    targetId === t.id
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-indigo-400"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
            {target && (
              <p className="mt-2 text-sm text-neutral-600" data-testid="target-note">
                <strong className="text-neutral-800">{target.name}:</strong> {target.summary}.{" "}
                {target.note}{" "}
                <a href={target.source.url} target="_blank" rel="noopener nofollow" className="text-indigo-600 hover:underline">
                  Source
                </a>
              </p>
            )}
            {targetId === "custom" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["pages", "Max pages per part"],
                    ["words", "Max words per part"],
                    ["mb", "Max MB per part"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="text-sm text-neutral-700">
                    {label}
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={custom[key]}
                      onChange={(e) => setCustom((c) => ({ ...c, [key]: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          {analysis.chapters.length > 1 && (
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={byChapter} onChange={(e) => setByChapter(e.target.checked)} disabled={busy} />
              Split at chapter boundaries (from the PDF&apos;s bookmarks)
            </label>
          )}

          {noTextPages > 0 && (
            <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {noTextPages} of {analysis.pages.length} pages have no text layer (scanned). AI tools can only read them
              if they run OCR themselves — converting the PDF to Markdown with OCR first is more reliable.{" "}
              <Link href="/" className="font-medium underline">
                Convert with OCR
              </Link>
            </p>
          )}

          <div aria-live="polite">
            {plan.length === 1 && (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" data-testid="fits">
                No split needed — this PDF already fits {target ? target.name : "these limits"}
                {limits.maxBytes && analysis.bytes > limits.maxBytes ? ", except for its file size, which the next step checks" : ""}.
              </p>
            )}
            {plan.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-neutral-900" data-testid="plan-summary">
                  {plan.length} parts
                </p>
                <ol className="mt-2 max-h-64 divide-y divide-neutral-100 overflow-y-auto rounded-xl border border-neutral-200 text-sm">
                  {plan.map((r, i) => (
                    <li key={`${r.from}-${r.to}`} className="flex flex-wrap justify-between gap-2 px-4 py-2">
                      <span className="font-medium text-neutral-800">
                        Part {i + 1}
                        {r.label && <span className="font-normal text-neutral-500"> — {r.label}</span>}
                      </span>
                      <span className="text-neutral-600">
                        pages {r.from + 1}–{r.to + 1} · {planner?.rangeWords(analysis.pages, r).toLocaleString()} words
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {phase.kind === "building" && (
            <div className="space-y-2" aria-live="polite">
              <p className="text-sm font-medium text-neutral-800">
                Creating part {Math.min(phase.done + 1, phase.total)} of {phase.total}…
              </p>
              <ProgressBar value={phase.done / Math.max(1, phase.total)} label="Split progress" />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {phase.kind !== "built" && (
              <button type="button" onClick={build} disabled={busy || !plan.length} className={primaryButton}>
                {plan.length > 1 ? `Create ${plan.length} PDFs` : "Create the PDF"}
              </button>
            )}
            {busy && (
              <button type="button" onClick={() => abortRef.current?.abort()} className={secondaryButton}>
                Cancel
              </button>
            )}
          </div>

          {phase.kind === "built" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-neutral-900">
                  {phase.parts.length} {phase.parts.length === 1 ? "file" : "files"} ready
                </p>
                {phase.parts.length > 1 && (
                  <button type="button" onClick={() => downloadAll(phase.parts)} className={primaryButton}>
                    Download all (.zip)
                  </button>
                )}
              </div>
              <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 text-sm">
                {phase.parts.map((p, i) => {
                  const over = limits.maxBytes !== undefined && p.bytes.byteLength > limits.maxBytes;
                  return (
                    <li key={`${p.range.from}-${p.range.to}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                      <span className="break-all text-neutral-800">{fileName(i, phase.parts)}</span>
                      <span className="flex items-center gap-3">
                        <span className={over ? "text-red-600" : "text-neutral-500"}>
                          {formatBytes(p.bytes.byteLength)}
                          {over && " — a single page over the size limit"}
                        </span>
                        <button type="button" onClick={() => downloadOne(i, phase.parts)} className={secondaryButton}>
                          Download
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {phase.kind === "analyzing" && (
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => abortRef.current?.abort()} className={secondaryButton}>
            Cancel
          </button>
        </div>
      )}
      {phase.kind === "error" && <ErrorAlert message={phase.message} />}
    </div>
  );
}
