"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sizeBucket, track } from "@/lib/analytics";
import { TEXT_ACCEPT } from "@/lib/extract-text";
import { CancelledError } from "@/lib/files";
import { ESTIMATE_RANGE, estimateRange, textStats, type Encoding } from "@/lib/tokens";
import FileDropzone, { ErrorAlert, PrivacyNote, ProgressBar, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "token-counter";

type Counts = Partial<Record<Encoding, number>>;
type Loading = { name: string; page: number; total: number } | null;

export default function TokenCounterTool() {
  const [text, setText] = useState("");
  const [counts, setCounts] = useState<Counts | null>(null);
  const [counting, setCounting] = useState(false);
  const [loading, setLoading] = useState<Loading>(null);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const reported = useRef<null | { input_format: string; file_size_bucket: string }>(null);

  // Recount shortly after typing stops. The work runs in a Web Worker.
  useEffect(() => {
    const request = ++requestRef.current;
    if (!text) return;
    const handle = setTimeout(
      async () => {
        setCounting(true);
        try {
          const { countTokens } = await import("@/lib/tokens-client");
          const result = await countTokens(text, ["o200k_base", "cl100k_base"]);
          if (request !== requestRef.current) return;
          setCounts(result);
          setError(null);
          if (reported.current) {
            track("conversion_success", { tool_name: TOOL, output_format: "tokens", ...reported.current });
            reported.current = null;
          }
        } catch (err) {
          console.error(err);
          if (request === requestRef.current) setError("The tokenizer could not be loaded. Check your connection and try again.");
          track("conversion_error", { tool_name: TOOL, error_code: "unknown" });
        } finally {
          if (request === requestRef.current) setCounting(false);
        }
      },
      text.length > 200_000 ? 600 : 250,
    );
    return () => clearTimeout(handle);
  }, [text]);

  const loadFile = async ([file]: File[]) => {
    if (!file) return;
    const { extractText, sourceOf, UnsupportedFileError } = await import("@/lib/extract-text");
    const source = sourceOf(file);
    const params = { tool_name: TOOL, input_format: source, file_size_bucket: sizeBucket(file.size) };
    track("file_selected", params);
    if (file.size === 0) {
      setError("This file is empty.");
      track("conversion_error", { ...params, error_code: "empty_file" });
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
      setError(
        e?.message ??
          (err instanceof UnsupportedFileError
            ? "This file is not text. Use a PDF, Word, Markdown, HTML, CSV, JSON or plain-text file."
            : "This file could not be read."),
      );
    } finally {
      setLoading(null);
      abortRef.current = null;
    }
  };

  const stats = textStats(text);
  const o200k = text ? counts?.o200k_base : 0;
  const cl100k = text ? counts?.cl100k_base : 0;
  const range = o200k !== undefined ? estimateRange(o200k) : null;
  const stale = counting || (text !== "" && !counts);
  const fmt = (n: number | undefined) => (n === undefined ? "…" : n.toLocaleString());

  return (
    <div className={toolCard}>
      <label htmlFor="token-input" className="mb-2 block text-sm font-medium text-neutral-800">
        Text, a prompt, or a whole document
      </label>
      <textarea
        id="token-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={(e) => {
          reported.current = { input_format: "clipboard", file_size_bucket: sizeBucket(e.clipboardData.getData("text/plain").length) };
        }}
        spellCheck={false}
        placeholder="Paste or type text here — or drop a PDF, Word or text file below."
        className="h-56 w-full resize-y rounded-xl border border-neutral-200 bg-white p-4 font-mono text-sm text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-live="polite" aria-busy={stale}>
        <Stat label="Tokens — GPT-4o, GPT-4.1, o-series" value={fmt(o200k)} note="exact · o200k_base" strong testId="tokens-o200k" dim={stale} />
        <Stat label="Tokens — GPT-4, GPT-3.5" value={fmt(cl100k)} note="exact · cl100k_base" testId="tokens-cl100k" dim={stale} />
        <Stat
          label="Tokens — Claude, Gemini, others"
          value={range ? (range[1] === 0 ? "0" : `${range[0].toLocaleString()}–${range[1].toLocaleString()}`) : "…"}
          note="estimate, see below"
          testId="tokens-estimate"
          dim={stale}
        />
        <Stat label="Words · characters" value={`${stats.words.toLocaleString()} · ${stats.characters.toLocaleString()}`} note={`${stats.lines.toLocaleString()} lines`} testId="text-stats" />
      </dl>

      <div className="mt-4">
        <FileDropzone
          accept={TEXT_ACCEPT}
          onFiles={loadFile}
          disabled={Boolean(loading)}
          onDragIntent={() => void import("@/lib/tokens-client")}
          label="Drop a PDF, Word or text file"
          hint={<PrivacyNote />}
          compact
        >
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

      {error && <ErrorAlert message={error} />}

      <p className="mt-4 text-xs leading-relaxed text-neutral-600">
        OpenAI counts use OpenAI&apos;s own tokenizer, so they match how those models split this text (an API request adds a few tokens of message formatting). Anthropic and Google do not
        publish their tokenizers for use in a browser, so the third figure is a range ({ESTIMATE_RANGE[0]}× to{" "}
        {ESTIMATE_RANGE[1]}× the o200k count), not a measurement. Too long for your AI tool?{" "}
        <Link href="/markdown-chunker" className="font-medium text-indigo-600 hover:underline">
          Split it into chunks
        </Link>
        .
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  strong,
  testId,
  dim,
}: {
  label: string;
  value: string;
  note: string;
  strong?: boolean;
  testId: string;
  dim?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${strong ? "border-indigo-200 bg-indigo-50" : "border-neutral-200 bg-neutral-50"}`}>
      <dt className="text-xs text-neutral-600">{label}</dt>
      <dd data-testid={testId} className={`mt-1 text-xl font-bold tabular-nums text-neutral-900 transition-opacity ${dim ? "opacity-50" : ""}`}>
        {value}
      </dd>
      <dd className="text-xs text-neutral-600">{note}</dd>
    </div>
  );
}
