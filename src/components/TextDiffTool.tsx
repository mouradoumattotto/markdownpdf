"use client";

import { useEffect, useRef, useState } from "react";
import { sizeBucket, track } from "@/lib/analytics";
import { TEXT_ACCEPT } from "@/lib/extract-text";
import { baseName, saveBlob } from "@/lib/files";
import type { DiffResult, DiffRow, Segment } from "@/lib/text-diff";
import { ErrorAlert, PrivacyNote, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "text-diff";

interface Side {
  text: string;
  name: string;
  loading: boolean;
}

const emptySide = (name: string): Side => ({ text: "", name, loading: false });

export default function TextDiffTool() {
  const [left, setLeft] = useState<Side>(emptySide("original"));
  const [right, setRight] = useState<Side>(emptySide("changed"));
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [view, setView] = useState<"split" | "unified">("split");
  const [result, setResult] = useState<DiffResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);
  const reported = useRef(false);

  useEffect(() => {
    const request = ++requestRef.current;
    if (!left.text && !right.text) return;
    const handle = setTimeout(async () => {
      try {
        const { diffTexts } = await import("@/lib/text-diff");
        const r = await diffTexts(left.text, right.text, { ignoreCase, ignoreWhitespace });
        if (request !== requestRef.current) return;
        setResult(r);
        setError(null);
        if (!reported.current && left.text && right.text) {
          reported.current = true;
          track("conversion_success", {
            tool_name: TOOL,
            output_format: "diff",
            file_size_bucket: sizeBucket(left.text.length + right.text.length),
          });
        }
      } catch (err) {
        if (request !== requestRef.current) return;
        const { DiffTooComplexError } = await import("@/lib/text-diff");
        if (!(err instanceof DiffTooComplexError)) console.error(err);
        setError(
          err instanceof DiffTooComplexError
            ? "These texts are too different, or too long, to compare line by line in the browser. Try comparing smaller sections."
            : "The texts could not be compared.",
        );
        track("conversion_error", { tool_name: TOOL, error_code: "unknown" });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [left.text, right.text, ignoreCase, ignoreWhitespace]);

  const loadInto = (set: (fn: (s: Side) => Side) => void) => async (file: File) => {
    const { extractText, sourceOf, UnsupportedFileError } = await import("@/lib/extract-text");
    const params = { tool_name: TOOL, input_format: sourceOf(file), file_size_bucket: sizeBucket(file.size) };
    track("file_selected", params);
    set((s) => ({ ...s, loading: true }));
    setError(null);
    try {
      const { text } = await extractText(file);
      set(() => ({ text, name: baseName(file.name), loading: false }));
    } catch (err) {
      set((s) => ({ ...s, loading: false }));
      if (!(err instanceof UnsupportedFileError)) console.error(err);
      const { classifyPdfError } = await import("@/lib/files");
      const e = params.input_format === "pdf" ? classifyPdfError(err) : null;
      track("conversion_error", { ...params, error_code: e?.code ?? "not_supported_type" });
      setError(e?.message ?? "This file could not be read as text. Use a PDF, Word, Markdown or text file.");
    }
  };

  const downloadPatch = async () => {
    const { unifiedPatch } = await import("@/lib/text-diff");
    const patch = await unifiedPatch(left.text, right.text, left.name, right.name);
    saveBlob(new Blob([patch], { type: "text/x-diff;charset=utf-8" }), `${left.name}-vs-${right.name}.diff`);
    track("output_download", { tool_name: TOOL, output_format: "diff" });
  };

  const shown = left.text || right.text ? result : null;

  return (
    <div className={toolCard}>
      <div className="grid gap-4 md:grid-cols-2">
        <SidePanel label="Original" side={left} onText={(text) => setLeft((s) => ({ ...s, text }))} onFile={loadInto(setLeft)} />
        <SidePanel label="Changed" side={right} onText={(text) => setRight((s) => ({ ...s, text }))} onFile={loadInto(setRight)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-700">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} className="accent-indigo-600" />
          Ignore case
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={ignoreWhitespace} onChange={(e) => setIgnoreWhitespace(e.target.checked)} className="accent-indigo-600" />
          Ignore spacing
        </label>
        <button
          type="button"
          onClick={() => {
            setLeft(right);
            setRight(left);
          }}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Swap sides ⇄
        </button>
        <span className="text-xs text-neutral-600">
          <PrivacyNote>Compared on your device — nothing is uploaded</PrivacyNote>
        </span>
      </div>

      {error && <ErrorAlert message={error} />}

      {shown && (
        <div className="mt-6" data-testid="diff-result">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-700" data-testid="diff-summary">
              {shown.identical ? (
                <span className="font-semibold text-emerald-700">✓ No differences{ignoreCase || ignoreWhitespace ? " (with the options above)" : ""}.</span>
              ) : (
                <>
                  <span className="font-semibold text-emerald-700">+{shown.stats.added} added</span> ·{" "}
                  <span className="font-semibold text-red-700">−{shown.stats.removed} removed</span> ·{" "}
                  <span className="font-semibold text-amber-700">{shown.stats.changed} changed</span> lines
                </>
              )}
            </p>
            {!shown.identical && (
              <div className="flex flex-wrap gap-2">
                <div role="tablist" aria-label="Diff view" className="inline-flex rounded-lg border border-neutral-200 p-0.5 text-sm">
                  {(["split", "unified"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="tab"
                      aria-selected={view === v}
                      onClick={() => setView(v)}
                      className={`rounded-md px-3 py-1 ${view === v ? "bg-indigo-600 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
                    >
                      {v === "split" ? "Side by side" : "Unified"}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={downloadPatch} className={secondaryButton}>
                  Download .diff
                </button>
              </div>
            )}
          </div>
          {!shown.identical && <DiffTable rows={shown.rows} view={view} />}
        </div>
      )}
    </div>
  );
}

function SidePanel({
  label,
  side,
  onText,
  onFile,
}: {
  label: string;
  side: Side;
  onText: (text: string) => void;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = `diff-${label.toLowerCase()}`;
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const file = e.dataTransfer.files[0];
        if (file) {
          e.preventDefault();
          onFile(file);
        }
      }}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-neutral-800">
          {label}
        </label>
        <button type="button" onClick={() => inputRef.current?.click()} className="text-sm font-medium text-indigo-600 hover:underline">
          {side.loading ? "Reading…" : "Open a file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={TEXT_ACCEPT}
          aria-label={`${label} file`}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
      <textarea
        id={id}
        value={side.text}
        onChange={(e) => onText(e.target.value)}
        spellCheck={false}
        dir="auto"
        placeholder="Paste text, or drop a PDF, Word or text file here"
        className="h-56 w-full resize-y rounded-xl border border-neutral-200 bg-white p-3 font-mono text-sm text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

const renderSegments = (segs: Segment[], tone: "del" | "ins") =>
  segs.map((s, i) =>
    s.kind === "changed" ? (
      tone === "del" ? (
        <del key={i} className="rounded-sm bg-red-200 text-red-900 no-underline">
          {s.text}
        </del>
      ) : (
        <ins key={i} className="rounded-sm bg-emerald-200 text-emerald-900 no-underline">
          {s.text}
        </ins>
      )
    ) : (
      <span key={i}>{s.text}</span>
    ),
  );

function DiffTable({ rows, view }: { rows: DiffRow[]; view: "split" | "unified" }) {
  const num = "w-10 select-none px-2 text-right align-top text-neutral-600";
  const cell = "whitespace-pre-wrap break-words px-2 align-top";
  return (
    <div className="max-h-[36rem] overflow-auto rounded-xl border border-neutral-200">
      <table className="w-full border-collapse font-mono text-xs leading-relaxed">
        <tbody>
          {rows.map((row, i) => {
            if (row.kind === "skipped") {
              return (
                <tr key={i} className="bg-neutral-50 text-neutral-500">
                  <td colSpan={view === "split" ? 4 : 3} className="px-3 py-1 text-center">
                    ⋯ {row.count} unchanged {row.count === 1 ? "line" : "lines"}
                  </td>
                </tr>
              );
            }
            if (view === "split") {
              const leftText =
                row.kind === "same" ? row.text : row.kind === "removed" ? row.text : row.kind === "changed" ? renderSegments(row.left, "del") : null;
              const rightText =
                row.kind === "same" ? row.text : row.kind === "added" ? row.text : row.kind === "changed" ? renderSegments(row.right, "ins") : null;
              const leftNo = row.kind === "added" ? "" : row.leftNo;
              const rightNo = row.kind === "removed" ? "" : row.rightNo;
              const leftBg = row.kind === "removed" || row.kind === "changed" ? "bg-red-50" : row.kind === "added" ? "bg-neutral-50" : "";
              const rightBg = row.kind === "added" || row.kind === "changed" ? "bg-emerald-50" : row.kind === "removed" ? "bg-neutral-50" : "";
              return (
                <tr key={i} className="border-b border-neutral-100">
                  <td className={`${num} ${leftBg}`}>{leftNo}</td>
                  <td className={`${cell} w-1/2 border-r border-neutral-200 ${leftBg}`}>{leftText}</td>
                  <td className={`${num} ${rightBg}`}>{rightNo}</td>
                  <td className={`${cell} w-1/2 ${rightBg}`}>{rightText}</td>
                </tr>
              );
            }
            const lines =
              row.kind === "changed"
                ? [
                    { sign: "−", bg: "bg-red-50", no: row.leftNo, content: renderSegments(row.left, "del") },
                    { sign: "+", bg: "bg-emerald-50", no: row.rightNo, content: renderSegments(row.right, "ins") },
                  ]
                : [
                    {
                      sign: row.kind === "added" ? "+" : row.kind === "removed" ? "−" : " ",
                      bg: row.kind === "added" ? "bg-emerald-50" : row.kind === "removed" ? "bg-red-50" : "",
                      no: row.kind === "added" ? row.rightNo : row.leftNo,
                      content: row.text,
                    },
                  ];
            return lines.map((l, k) => (
              <tr key={`${i}-${k}`} className={`border-b border-neutral-100 ${l.bg}`}>
                <td className={num}>{l.no}</td>
                <td className="w-4 select-none text-center align-top text-neutral-500" aria-hidden>
                  {l.sign}
                </td>
                <td className={cell}>{l.content}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}
