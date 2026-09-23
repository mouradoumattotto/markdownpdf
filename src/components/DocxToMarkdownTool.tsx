"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { durationBucket, sizeBucket, track, type ErrorCode } from "@/lib/analytics";
import { baseName, saveBlob } from "@/lib/files";
import type { DocxImageMode, DocxResult } from "@/lib/html-markdown";
import FileDropzone, { ErrorAlert, PrivacyNote, primaryButton, toolCard } from "@/components/FileDropzone";
import TextOutput, { wordCount } from "@/components/TextOutput";

const TOOL = "docx-to-markdown";
const ACCEPT = ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const IMAGE_MODES: { value: DocxImageMode; label: string; hint: string }[] = [
  { value: "omit", label: "Leave images out", hint: "Text only — best for AI tools and wikis." },
  { value: "extract", label: "Save images to a folder", hint: "Download a ZIP: the .md file plus an images/ folder." },
  { value: "embed", label: "Embed images in the file", hint: "One self-contained .md file; much larger." },
];

type State =
  | { kind: "idle" }
  | { kind: "working"; name: string }
  | { kind: "done"; name: string; result: DocxResult }
  | { kind: "error"; message: string };

/** A .docx is a ZIP archive: it starts with "PK\x03\x04". The old binary .doc does not. */
async function sniffDocx(file: File): Promise<"ok" | "empty" | "legacy_doc" | "not_docx"> {
  if (file.size === 0) return "empty";
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04) return "ok";
  if (head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0) return "legacy_doc";
  return "not_docx";
}

const SNIFF_ERRORS: Record<"empty" | "legacy_doc" | "not_docx", { code: ErrorCode; message: string }> = {
  empty: { code: "empty_file", message: "This file is empty." },
  legacy_doc: {
    code: "not_supported_type",
    message:
      "This is an old Word 97–2003 .doc file. Open it in Word, LibreOffice or Google Docs, save it as .docx, then drop the new file here.",
  },
  not_docx: { code: "not_supported_type", message: "This is not a Word .docx file." },
};

export default function DocxToMarkdownTool() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [markdown, setMarkdown] = useState("");
  const [imageMode, setImageMode] = useState<DocxImageMode>("omit");
  const lastFile = useRef<File | null>(null);

  const run = useCallback(
    async ([file]: File[]) => {
      if (!file) return;
      lastFile.current = file;
      const params = {
        tool_name: TOOL,
        input_format: "docx",
        output_format: "md",
        file_size_bucket: sizeBucket(file.size),
        export_mode: imageMode,
      };
      track("file_selected", params);
      const sniff = await sniffDocx(file);
      if (sniff !== "ok") {
        track("conversion_error", { ...params, error_code: SNIFF_ERRORS[sniff].code });
        setState({ kind: "error", message: SNIFF_ERRORS[sniff].message });
        return;
      }
      track("conversion_start", params);
      setState({ kind: "working", name: file.name });
      setMarkdown("");
      const started = performance.now();
      try {
        const { docxToMarkdown } = await import("@/lib/html-markdown");
        const result = await docxToMarkdown(file, imageMode);
        const done = { ...params, duration_bucket: durationBucket(performance.now() - started) };
        if (!result.markdown.trim()) {
          track("conversion_error", { ...done, error_code: "no_text_found" });
          setState({
            kind: "error",
            message: "No text was found in this document. If it only contains scanned pages as pictures, export it to PDF and use OCR a PDF.",
          });
          return;
        }
        track("conversion_success", done);
        setMarkdown(result.markdown);
        setState({ kind: "done", name: file.name, result });
      } catch (err) {
        console.error(err);
        track("conversion_error", { ...params, error_code: "corrupted" });
        setState({
          kind: "error",
          message: "This document could not be read. It may be damaged or password-protected — open it in Word and save a new copy.",
        });
      }
    },
    [imageMode],
  );

  // Changing the image option re-converts the file already dropped.
  useEffect(() => {
    if (lastFile.current) void run([lastFile.current]);
  }, [run]);

  const working = state.kind === "working";
  const done = state.kind === "done" ? state : null;
  const mdName = done ? `${baseName(done.name)}.md` : "document.md";

  const downloadZip = async () => {
    if (!done) return;
    const { zipParts } = await import("@/lib/pdf-split");
    const encoder = new TextEncoder();
    const files = [
      { name: mdName, bytes: encoder.encode(markdown) },
      ...(await Promise.all(
        done.result.images.map(async (img) => ({
          name: `images/${img.name}`,
          bytes: new Uint8Array(await img.blob.arrayBuffer()),
        })),
      )),
    ];
    saveBlob(await zipParts(files), `${baseName(done.name)}.zip`);
    track("output_download", { tool_name: TOOL, output_format: "zip" });
  };

  return (
    <div className={toolCard}>
      <fieldset className="mb-4" disabled={working}>
        <legend className="mb-2 text-sm font-medium text-neutral-800">Images in the document</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {IMAGE_MODES.map((m) => (
            <label
              key={m.value}
              className={`flex cursor-pointer gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                imageMode === m.value ? "border-indigo-400 bg-indigo-50" : "border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                name="docx-image-mode"
                value={m.value}
                checked={imageMode === m.value}
                onChange={() => setImageMode(m.value)}
                className="mt-1 accent-indigo-600"
              />
              <span>
                <span className="block font-medium text-neutral-900">{m.label}</span>
                <span className="block text-xs text-neutral-600">{m.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <FileDropzone
        accept={ACCEPT}
        disabled={working}
        onFiles={run}
        onDragIntent={() => void import("@/lib/html-markdown")}
        label="Drop a Word .docx file here"
        hint={<PrivacyNote />}
        compact={Boolean(done)}
      >
        {working ? (
          <p className="font-semibold text-neutral-900" aria-live="polite">
            Converting {state.name}…
          </p>
        ) : undefined}
      </FileDropzone>

      {state.kind === "error" && <ErrorAlert message={state.message} />}

      {done && (
        <div className="mt-6" data-testid="docx-result">
          <TextOutput
            value={markdown}
            onChange={setMarkdown}
            label="Markdown output"
            fileName={mdName}
            mimeType="text/markdown"
            toolName={TOOL}
            outputFormat="md"
            summary={
              <>
                {wordCount(markdown).toLocaleString()} words
                {done.result.images.length > 0 && ` · ${done.result.images.length} images`}
              </>
            }
            download={
              imageMode === "extract" && done.result.images.length > 0 ? (
                <button type="button" onClick={downloadZip} className={primaryButton}>
                  Download .zip (Markdown + images)
                </button>
              ) : undefined
            }
          />
          {done.result.warnings.length > 0 && (
            <details className="mt-3 text-sm text-neutral-600">
              <summary className="cursor-pointer">
                {done.result.warnings.length} conversion note{done.result.warnings.length > 1 ? "s" : ""}
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {done.result.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
