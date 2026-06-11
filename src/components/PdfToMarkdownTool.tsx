"use client";

import { useCallback, useRef, useState } from "react";
import type { ConversionProgress } from "@/lib/pdf-to-markdown";

type Status =
  | { kind: "idle" }
  | { kind: "working"; progress: ConversionProgress | null }
  | { kind: "done"; fileName: string }
  | { kind: "error"; message: string };

export default function PdfToMarkdownTool() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [markdown, setMarkdown] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const convert = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setStatus({ kind: "error", message: "Please choose a PDF file." });
      return;
    }
    setStatus({ kind: "working", progress: null });
    setMarkdown("");
    try {
      const { convertPdfToMarkdown } = await import("@/lib/pdf-to-markdown");
      const result = await convertPdfToMarkdown(file, (progress) =>
        setStatus({ kind: "working", progress }),
      );
      setMarkdown(result);
      setStatus({ kind: "done", fileName: file.name.replace(/\.pdf$/i, ".md") });
    } catch (err) {
      console.error(err);
      setStatus({
        kind: "error",
        message:
          err instanceof Error && /password/i.test(err.message)
            ? "This PDF is password-protected. Please unlock it first."
            : "Could not read this PDF. The file may be corrupted or unsupported.",
      });
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) convert(file);
    },
    [convert],
  );

  const download = () => {
    const name = status.kind === "done" ? status.fileName : "converted.md";
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const working = status.kind === "working";
  const words = markdown ? markdown.trim().split(/\s+/).length : 0;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-lg shadow-neutral-900/5 sm:p-6">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a PDF file"
        onClick={() => !working && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !working && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-200 ${
          dragOver
            ? "scale-[1.01] border-indigo-500 bg-indigo-50"
            : "border-neutral-300 bg-neutral-50/80 hover:border-indigo-400 hover:bg-indigo-50/40"
        } ${working ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) convert(file);
            e.target.value = "";
          }}
        />
        {working ? (
          <div className="w-full max-w-sm space-y-4">
            <span className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-7 w-7" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </span>
            <p className="font-semibold text-neutral-900">
              {status.progress?.stage === "ocr"
                ? `Running OCR on page ${status.progress.page} of ${status.progress.totalPages}…`
                : status.progress
                  ? `Extracting text — page ${status.progress.page} of ${status.progress.totalPages}`
                  : "Reading PDF…"}
            </p>
            {status.progress && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-300"
                  style={{
                    width: `${(status.progress.page / status.progress.totalPages) * 100}%`,
                  }}
                />
              </div>
            )}
            {status.progress?.stage === "ocr" && (
              <p className="text-xs text-neutral-500">
                Scanned page detected — OCR takes a little longer.
              </p>
            )}
          </div>
        ) : (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 transition-transform duration-200 group-hover:scale-105">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-7 w-7" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </span>
            <p className="mt-5 text-lg font-semibold text-neutral-900">
              Drop your PDF here, or <span className="text-indigo-600 underline decoration-indigo-300 underline-offset-4">browse</span>
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-neutral-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-emerald-500" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Processed on your device — never uploaded
            </p>
          </>
        )}
      </div>

      {status.kind === "error" && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mt-0.5 h-4 w-4 shrink-0" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {status.message}
        </p>
      )}

      {status.kind === "done" && (
        <div className="mt-6 animate-fade-up">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-emerald-500" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Conversion complete
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                {words.toLocaleString()} words · {markdown.length.toLocaleString()} characters
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button
                onClick={download}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/30 transition-all hover:shadow-md hover:brightness-110"
              >
                Download .md
              </button>
            </div>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            aria-label="Converted Markdown"
            className="h-80 w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      )}
    </div>
  );
}
