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

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
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
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-neutral-300 bg-neutral-50 hover:border-blue-400 hover:bg-blue-50/50"
        } ${working ? "pointer-events-none opacity-60" : ""}`}
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
        <svg
          className="mb-3 h-10 w-10 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        {working ? (
          <div className="space-y-2">
            <p className="font-medium text-neutral-900">
              {status.progress?.stage === "ocr"
                ? `Running OCR on page ${status.progress.page} of ${status.progress.totalPages}…`
                : status.progress
                  ? `Extracting text from page ${status.progress.page} of ${status.progress.totalPages}…`
                  : "Reading PDF…"}
            </p>
            {status.progress && (
              <div className="mx-auto h-2 w-56 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
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
            <p className="font-medium text-neutral-900">
              Drop your PDF here, or <span className="text-blue-600">browse</span>
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Processed entirely in your browser — your file is never uploaded.
            </p>
          </>
        )}
      </div>

      {status.kind === "error" && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.message}
        </p>
      )}

      {status.kind === "done" && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-neutral-900">Markdown result</h2>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={download}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
            className="h-80 w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm text-neutral-800 focus:border-blue-400 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
