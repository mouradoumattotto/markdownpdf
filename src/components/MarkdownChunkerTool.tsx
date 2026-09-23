"use client";

import { useEffect, useRef, useState } from "react";
import { countBucket, sizeBucket, track } from "@/lib/analytics";
import { TEXT_ACCEPT } from "@/lib/extract-text";
import { CancelledError, baseName, saveBlob } from "@/lib/files";
import type { Chunk, Encoding } from "@/lib/tokens";
import FileDropzone, { ErrorAlert, PrivacyNote, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "markdown-chunker";
const PRESETS = [256, 512, 1000, 2000, 4000];

export default function MarkdownChunkerTool() {
  const [text, setText] = useState("");
  const [maxTokens, setMaxTokens] = useState(512);
  const [overlap, setOverlap] = useState(50);
  const [headingContext, setHeadingContext] = useState(true);
  const [encoding, setEncoding] = useState<Encoding>("o200k_base");
  const [chunks, setChunks] = useState<Chunk[] | null>(null);
  const [working, setWorking] = useState(false);
  const [loading, setLoading] = useState<{ name: string; page: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("chunks");
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const reported = useRef<null | { input_format: string; file_size_bucket: string }>(null);

  const validMax = Number.isFinite(maxTokens) && maxTokens >= 32 && maxTokens <= 100_000;
  const validOverlap = Number.isFinite(overlap) && overlap >= 0 && overlap <= maxTokens / 2;

  useEffect(() => {
    const request = ++requestRef.current;
    if (!text.trim() || !validMax || !validOverlap) return;
    const handle = setTimeout(async () => {
      setWorking(true);
      try {
        const { chunkText } = await import("@/lib/tokens-client");
        const result = await chunkText(text, encoding, { maxTokens, overlapTokens: overlap, headingContext });
        if (request !== requestRef.current) return;
        setChunks(result);
        setError(null);
        if (reported.current) {
          track("conversion_success", {
            tool_name: TOOL,
            output_format: "chunks",
            file_count_bucket: countBucket(result.length),
            ...reported.current,
          });
          reported.current = null;
        }
      } catch (err) {
        console.error(err);
        if (request === requestRef.current) setError("The text could not be split. Try again, or with a smaller document.");
        track("conversion_error", { tool_name: TOOL, error_code: "unknown" });
      } finally {
        if (request === requestRef.current) setWorking(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [text, maxTokens, overlap, headingContext, encoding, validMax, validOverlap]);

  const loadFile = async ([file]: File[]) => {
    if (!file) return;
    const { extractText, sourceOf, UnsupportedFileError } = await import("@/lib/extract-text");
    const source = sourceOf(file);
    const params = { tool_name: TOOL, input_format: source, file_size_bucket: sizeBucket(file.size) };
    track("file_selected", params);
    if (file.size === 0) {
      setError("This file is empty.");
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading({ name: file.name, page: 0, total: 0 });
    setError(null);
    track("conversion_start", params);
    try {
      const { text: extracted } = await extractText(file, {
        signal: controller.signal,
        onProgress: (p) => setLoading({ name: file.name, page: p.page, total: p.totalPages }),
      });
      if (!extracted.trim()) {
        setError("No text was found in this file.");
        track("conversion_error", { ...params, error_code: "no_text_found" });
        return;
      }
      reported.current = { input_format: source, file_size_bucket: params.file_size_bucket };
      setName(baseName(file.name));
      setText(extracted);
    } catch (err) {
      if (err instanceof CancelledError || controller.signal.aborted) {
        track("conversion_cancel", params);
        return;
      }
      if (!(err instanceof UnsupportedFileError)) console.error(err);
      const { classifyPdfError } = await import("@/lib/files");
      const e = source === "pdf" ? classifyPdfError(err) : null;
      track("conversion_error", { ...params, error_code: e?.code ?? "not_supported_type" });
      setError(e?.message ?? "This file could not be read as text.");
    } finally {
      setLoading(null);
      abortRef.current = null;
    }
  };

  const shown = text.trim() ? chunks : null;
  const download = (kind: "jsonl" | "md" | "zip") => async () => {
    if (!shown) return;
    if (kind === "jsonl") {
      const lines = shown.map((c) =>
        JSON.stringify({ id: c.index + 1, text: c.text, tokens: c.tokens, headings: c.headings, encoding }),
      );
      saveBlob(new Blob([lines.join("\n") + "\n"], { type: "application/x-ndjson" }), `${name}.jsonl`);
    } else if (kind === "md") {
      const body = shown.map((c) => `<!-- chunk ${c.index + 1} · ${c.tokens} tokens -->\n\n${c.text}`).join("\n\n---\n\n");
      saveBlob(new Blob([body + "\n"], { type: "text/markdown;charset=utf-8" }), `${name}-chunks.md`);
    } else {
      const { zipParts } = await import("@/lib/pdf-split");
      const pad = String(shown.length).length;
      const enc = new TextEncoder();
      const files = shown.map((c) => ({ name: `${name}-${String(c.index + 1).padStart(pad, "0")}.md`, bytes: enc.encode(c.text + "\n") }));
      saveBlob(await zipParts(files), `${name}-chunks.zip`);
    }
    track("output_download", { tool_name: TOOL, output_format: kind, file_count_bucket: countBucket(shown.length) });
  };

  const total = shown?.reduce((s, c) => s + c.tokens, 0) ?? 0;
  const largest = shown?.reduce((m, c) => Math.max(m, c.tokens), 0) ?? 0;

  return (
    <div className={toolCard}>
      <label htmlFor="chunk-input" className="mb-2 block text-sm font-medium text-neutral-800">
        Markdown or plain text
      </label>
      <textarea
        id="chunk-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={(e) => {
          reported.current = { input_format: "clipboard", file_size_bucket: sizeBucket(e.clipboardData.getData("text/plain").length) };
        }}
        spellCheck={false}
        placeholder="Paste Markdown here — or drop a PDF, Word or text file below."
        className="h-48 w-full resize-y rounded-xl border border-neutral-200 bg-white p-4 font-mono text-sm text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />

      <div className="mt-3">
        <FileDropzone accept={TEXT_ACCEPT} onFiles={loadFile} disabled={Boolean(loading)} label="Drop a PDF, Word or text file" hint={<PrivacyNote />} compact>
          {loading ? (
            <div className="w-full max-w-sm space-y-2" aria-live="polite">
              <p className="truncate font-semibold text-neutral-900">Reading {loading.name}…</p>
              {loading.total > 0 && <ProgressBar value={loading.page / loading.total} label="Text extraction progress" />}
            </div>
          ) : undefined}
        </FileDropzone>
        {loading && (
          <button type="button" onClick={() => abortRef.current?.abort()} className={`${secondaryButton} mt-2`}>
            Cancel
          </button>
        )}
      </div>

      <fieldset className="mt-5 grid gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="chunk-size" className="mb-1 block text-sm font-medium text-neutral-800">
            Max tokens per chunk
          </label>
          <input
            id="chunk-size"
            type="number"
            min={32}
            max={100000}
            list="chunk-presets"
            value={Number.isFinite(maxTokens) ? maxTokens : ""}
            onChange={(e) => setMaxTokens(e.target.valueAsNumber)}
            aria-invalid={!validMax}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <datalist id="chunk-presets">
            {PRESETS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="chunk-overlap" className="mb-1 block text-sm font-medium text-neutral-800">
            Overlap (tokens)
          </label>
          <input
            id="chunk-overlap"
            type="number"
            min={0}
            value={Number.isFinite(overlap) ? overlap : ""}
            onChange={(e) => setOverlap(e.target.valueAsNumber)}
            aria-invalid={!validOverlap}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="chunk-encoding" className="mb-1 block text-sm font-medium text-neutral-800">
            Tokenizer
          </label>
          <select
            id="chunk-encoding"
            value={encoding}
            onChange={(e) => setEncoding(e.target.value as Encoding)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="o200k_base">o200k_base (GPT-4o and later)</option>
            <option value="cl100k_base">cl100k_base (GPT-4, embeddings)</option>
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-neutral-700">
          <input type="checkbox" checked={headingContext} onChange={(e) => setHeadingContext(e.target.checked)} className="mb-0.5 accent-indigo-600" />
          Repeat headings in each chunk
        </label>
      </fieldset>
      {(!validMax || !validOverlap) && (
        <p className="mt-2 text-sm text-red-700" role="status">
          {!validMax ? "Chunk size must be between 32 and 100,000 tokens." : "Overlap must be between 0 and half the chunk size."}
        </p>
      )}

      {error && <ErrorAlert message={error} />}

      {shown && (
        <div className="mt-6" data-testid="chunks-result" aria-busy={working}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className={`text-sm text-neutral-700 ${working ? "opacity-50" : ""}`} data-testid="chunks-summary">
              {shown.length} {shown.length === 1 ? "chunk" : "chunks"} · {total.toLocaleString()} tokens in total · largest {largest.toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={download("md")} className={secondaryButton}>
                .md
              </button>
              <button type="button" onClick={download("zip")} className={secondaryButton}>
                .zip
              </button>
              <button type="button" onClick={download("jsonl")} className={primaryButton}>
                Download .jsonl
              </button>
            </div>
          </div>
          <ol className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {shown.slice(0, 200).map((c) => (
              <li key={c.index} className="rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600">
                  <span className="font-medium text-neutral-800">Chunk {c.index + 1}</span>
                  <span>{c.tokens.toLocaleString()} tokens</span>
                </div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-xs text-neutral-800">{c.text}</pre>
              </li>
            ))}
          </ol>
          {shown.length > 200 && (
            <p className="mt-2 text-xs text-neutral-600">Showing the first 200 chunks; the downloads contain all {shown.length}.</p>
          )}
        </div>
      )}
    </div>
  );
}
