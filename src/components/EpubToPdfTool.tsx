"use client";

import { useState } from "react";
import { formatBytes } from "@/lib/ai-limits";
import { durationBucket, pageBucket, sizeBucket, track } from "@/lib/analytics";
import { baseName, saveBlob } from "@/lib/files";
import ContinueWith from "@/components/ContinueWith";
import FileDropzone, { ErrorAlert, PrivacyNote, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "epub-to-pdf";
const ACCEPT = ".epub,application/epub+zip";
const BASE = { tool_name: TOOL, input_format: "epub", output_format: "pdf" };

type State =
  | { kind: "idle" }
  | { kind: "working"; step: string }
  | {
      kind: "done";
      blob: Blob;
      name: string;
      title: string;
      pages: number;
      chapters: number;
      missingImages: number;
    }
  | { kind: "error"; message: string; markdown?: { text: string; name: string } };

const loadLibs = () => Promise.all([import("@/lib/epub"), import("@/lib/markdown-to-pdf")]);

export default function EpubToPdfTool() {
  const [state, setState] = useState<State>({ kind: "idle" });

  const run = async (file: File) => {
    const params = { ...BASE, file_size_bucket: sizeBucket(file.size) };
    track("file_selected", params);
    if (!/\.epub$/i.test(file.name) && file.type !== "application/epub+zip") {
      track("conversion_error", { ...params, error_code: "not_supported_type" });
      setState({ kind: "error", message: "This is not an EPUB file. Choose a file ending in .epub." });
      return;
    }
    setState({ kind: "working", step: "Reading the book…" });
    track("conversion_start", params);
    const started = performance.now();
    const urls: string[] = [];
    let book: Awaited<ReturnType<typeof import("@/lib/epub").readEpub>> | null = null;
    try {
      const [epub, pdf] = await loadLibs();
      book = await epub.readEpub(new Uint8Array(await file.arrayBuffer()));
      setState({ kind: "working", step: `Laying out ${book.chapters} ${book.chapters === 1 ? "chapter" : "chapters"}…` });
      const assets = new Map<string, string>();
      for (const [name, blob] of book.images) {
        const url = URL.createObjectURL(blob);
        urls.push(url);
        assets.set(name, url);
      }
      const result = await pdf.convertMarkdownToPdf(book.markdown, { title: book.title, assets });
      const done = {
        ...params,
        page_count_bucket: pageBucket(result.pageCount),
        duration_bucket: durationBucket(performance.now() - started),
      };
      track("conversion_success", done);
      setState({
        kind: "done",
        blob: result.blob,
        name: `${baseName(file.name)}.pdf`,
        title: book.title,
        pages: result.pageCount,
        chapters: book.chapters,
        missingImages: result.warnings.missingImages.length,
      });
    } catch (err) {
      const [epub, pdf] = await loadLibs();
      if (err instanceof epub.EpubDrmError) {
        track("conversion_error", { ...params, error_code: "encrypted" });
        setState({
          kind: "error",
          message:
            "This book is protected by DRM (copy protection from the store that sold it), so its text cannot be read. Only DRM-free EPUB files can be converted.",
        });
      } else if (err instanceof epub.EpubFormatError) {
        track("conversion_error", { ...params, error_code: "corrupted" });
        setState({ kind: "error", message: `${err.message}. Check that the file is a complete, unmodified EPUB.` });
      } else if (err instanceof pdf.UnsupportedScriptError && book) {
        track("conversion_error", { ...params, error_code: "unsupported_script" });
        setState({
          kind: "error",
          message: `This book contains ${err.script} text, which this PDF engine cannot lay out. Open its Markdown in Markdown to PDF and use “Save as PDF”, which uses your browser's own engine and supports every script (images are not carried over).`,
          markdown: { text: book.markdown, name: `${baseName(file.name)}.md` },
        });
      } else {
        console.error(err);
        track("conversion_error", { ...params, error_code: "unknown" });
        setState({ kind: "error", message: "This EPUB could not be converted. It may be damaged or use an unusual structure." });
      }
    } finally {
      urls.forEach((u) => URL.revokeObjectURL(u));
    }
  };

  const working = state.kind === "working";

  return (
    <div className={toolCard}>
      <FileDropzone
        accept={ACCEPT}
        disabled={working}
        onFiles={([f]) => f && run(f)}
        onDragIntent={() => void loadLibs()}
        label="Drop an EPUB e-book"
        hint={<PrivacyNote>Your book never leaves your device</PrivacyNote>}
      >
        {working ? (
          <p className="font-semibold text-neutral-900" aria-live="polite">
            {state.step}
          </p>
        ) : undefined}
      </FileDropzone>

      {state.kind === "error" && (
        <>
          <ErrorAlert message={state.message} />
          {state.markdown && (
            <div className="mt-3 flex flex-wrap items-start gap-3">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => saveBlob(new Blob([state.markdown!.text], { type: "text/markdown" }), state.markdown!.name)}
              >
                Download the Markdown
              </button>
              <ContinueWith
                from={TOOL}
                label="Continue with the Markdown"
                targets={["markdown-to-pdf"]}
                file={() => new File([state.markdown!.text], state.markdown!.name, { type: "text/markdown" })}
              />
            </div>
          )}
        </>
      )}

      {state.kind === "done" && (
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" data-testid="epub-pdf-done">
            <p className="font-semibold text-emerald-900">“{state.title}” is ready as a PDF</p>
            <p className="mt-1 text-sm text-emerald-800">
              {state.chapters} {state.chapters === 1 ? "chapter" : "chapters"} · {state.pages}{" "}
              {state.pages === 1 ? "page" : "pages"} · {formatBytes(state.blob.size)}
              {state.missingImages > 0 &&
                ` · ${state.missingImages} ${state.missingImages === 1 ? "image" : "images"} could not be embedded`}
            </p>
            <button
              type="button"
              onClick={() => {
                saveBlob(state.blob, state.name);
                track("output_download", BASE);
              }}
              className={`${primaryButton} mt-3`}
            >
              Download {state.name}
            </button>
          </div>
          <ContinueWith
            from={TOOL}
            targets={["split-pdf-for-ai", "split-pdf", "merge-pdf", "pdf-metadata"]}
            file={() => new File([state.blob], state.name, { type: "application/pdf" })}
          />
        </div>
      )}
    </div>
  );
}
