"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { countBucket, durationBucket, extensionOf, sizeBucket, track } from "@/lib/analytics";
import { CancelledError, saveBlob, throwIfAborted } from "@/lib/files";
import { DEFAULT_OCR_LANGUAGE, OCR_LANGUAGES, type OcrLanguage } from "@/lib/ocr";
import FileDropzone, { ErrorAlert, PrivacyNote, ProgressBar, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";
import OcrLanguageSelect, { useStoredOcrLanguage } from "@/components/OcrLanguageSelect";

const TOOL = "image-to-text";
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff";
const MAX_FILES = 20;

type State =
  | { kind: "idle" }
  | { kind: "working"; file: number; total: number; ratio: number; name: string }
  | { kind: "done"; count: number }
  | { kind: "error"; message: string };

export default function ImageToTextTool() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState<OcrLanguage>(DEFAULT_OCR_LANGUAGE);
  useStoredOcrLanguage(setLanguage);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/")).slice(0, MAX_FILES);
      if (!images.length) {
        setState({ kind: "error", message: "Those files are not images. Use PNG, JPEG, WebP, GIF, BMP or TIFF." });
        return;
      }
      const params = {
        tool_name: TOOL,
        input_format: extensionOf(images[0].name),
        output_format: "txt",
        file_count_bucket: countBucket(images.length),
        file_size_bucket: sizeBucket(images.reduce((s, f) => s + f.size, 0)),
        ocr_language: language,
      };
      track("file_selected", params);
      track("conversion_start", params);
      track("ocr_start", params);

      const controller = new AbortController();
      abortRef.current = controller;
      setText("");
      setState({ kind: "working", file: 1, total: images.length, ratio: 0, name: images[0].name });
      const started = performance.now();
      let worker: Awaited<ReturnType<typeof import("@/lib/ocr").createOcrWorker>> | null = null;
      const stop = () => void worker?.terminate();
      controller.signal.addEventListener("abort", stop, { once: true });

      try {
        const { createOcrWorker } = await import("@/lib/ocr");
        let current = 0;
        worker = await createOcrWorker(language, (ratio) =>
          setState({ kind: "working", file: current + 1, total: images.length, ratio, name: images[current].name }),
        );
        const parts: string[] = [];
        for (const [index, image] of images.entries()) {
          throwIfAborted(controller.signal);
          current = index;
          setState({ kind: "working", file: index + 1, total: images.length, ratio: 0, name: image.name });
          const { data } = await worker.recognize(image);
          const body = data.text.trim();
          parts.push(images.length > 1 ? `--- ${image.name} ---\n\n${body}` : body);
          setText(parts.join("\n\n"));
        }
        const done = { ...params, duration_bucket: durationBucket(performance.now() - started), ocr_used: true };
        track("ocr_complete", done);
        if (!parts.join("").trim()) {
          track("conversion_error", { ...done, error_code: "no_text_found" });
          setState({
            kind: "error",
            message:
              "No text was found in this image. Check that the picture is sharp and upright, and that the language above matches the text.",
          });
          return;
        }
        track("conversion_success", done);
        setState({ kind: "done", count: images.length });
      } catch (err) {
        if (err instanceof CancelledError || controller.signal.aborted) {
          track("conversion_cancel", params);
          setState({ kind: "idle" });
          return;
        }
        console.error(err);
        track("conversion_error", { ...params, error_code: "ocr_failed" });
        setState({ kind: "error", message: "The image could not be read. Try another file or another format." });
      } finally {
        controller.signal.removeEventListener("abort", stop);
        await worker?.terminate().catch(() => {});
        abortRef.current = null;
      }
    },
    [language],
  );

  // Screenshots are usually in the clipboard, not in a file: accept a paste.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (files.length) {
        e.preventDefault();
        void run(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [run]);

  const working = state.kind === "working";

  return (
    <div className={toolCard}>
      <FileDropzone
        accept={ACCEPT}
        multiple
        disabled={working}
        onFiles={run}
        onDragIntent={() => void import("@/lib/ocr")}
        label="Drop images here"
        hint={
          <>
            <PrivacyNote /> <span className="block sm:inline">· or paste a screenshot with Ctrl+V</span>
          </>
        }
      >
        {working ? (
          <div className="w-full max-w-sm space-y-3" aria-live="polite">
            <p className="font-semibold text-neutral-900">
              Reading {state.total > 1 ? `image ${state.file} of ${state.total}` : "your image"}…
            </p>
            <ProgressBar value={(state.file - 1 + state.ratio) / state.total} label="OCR progress" />
            <p className="truncate text-xs text-neutral-500">{state.name}</p>
          </div>
        ) : undefined}
      </FileDropzone>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <OcrLanguageSelect value={language} onChange={setLanguage} disabled={working} label="Language in the image" />
        {working && (
          <button type="button" onClick={() => abortRef.current?.abort()} className={secondaryButton}>
            Cancel
          </button>
        )}
      </div>

      {state.kind === "error" && <ErrorAlert message={state.message} />}

      {text && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-600">
              {text.trim().split(/\s+/).length.toLocaleString()} words
              {state.kind === "done" && state.count > 1 && ` from ${state.count} images`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    track("output_copy", { tool_name: TOOL, output_format: "txt" });
                  } catch {
                    setCopied(false);
                  }
                }}
                className={secondaryButton}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={() => {
                  saveBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), "extracted-text.txt");
                  track("output_download", { tool_name: TOOL, output_format: "txt" });
                }}
                className={primaryButton}
              >
                Download .txt
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            dir="auto"
            aria-label="Recognised text"
            className="h-72 w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      )}
    </div>
  );
}
