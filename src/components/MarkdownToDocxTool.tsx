"use client";

import { useRef, useState } from "react";
import { durationBucket, sizeBucket, track } from "@/lib/analytics";
import { baseName, saveBlob } from "@/lib/files";
import FileDropzone, { ErrorAlert, PrivacyNote, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";
import { wordCount } from "@/components/TextOutput";

const TOOL = "markdown-to-docx";
const ACCEPT = ".md,.markdown,.mdown,.txt,text/markdown,text/plain";

const SAMPLE = `# Meeting notes

**Date:** 23 September · **Attendees:** Ana, Sam, Lee

## Decisions

1. Ship the beta on *Monday*
2. Move the review to Thursday

## Action items

- [x] Draft the announcement
- [ ] Update the [changelog](https://example.com/changelog)

| Owner | Task | Due |
| --- | --- | ---: |
| Ana | Release notes | Fri |
| Sam | QA pass | Thu |

> Next meeting: same time next week.
`;

const now = () => performance.now();

export default function MarkdownToDocxTool() {
  const [markdown, setMarkdown] = useState("");
  const [fileName, setFileName] = useState("document");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ warnings: string[]; size: number } | null>(null);
  const source = useRef<"file" | "clipboard" | "typed">("typed");

  const loadFile = async ([file]: File[]) => {
    if (!file) return;
    track("file_selected", { tool_name: TOOL, input_format: "md", file_size_bucket: sizeBucket(file.size) });
    if (file.size === 0) {
      setError("This file is empty.");
      track("conversion_error", { tool_name: TOOL, input_format: "md", error_code: "empty_file" });
      return;
    }
    source.current = "file";
    setFileName(baseName(file.name));
    setMarkdown(await file.text());
    setResult(null);
    setError(null);
  };

  const convert = async () => {
    if (!markdown.trim()) return;
    const params = {
      tool_name: TOOL,
      input_format: source.current === "file" ? "md" : source.current,
      output_format: "docx",
      file_size_bucket: sizeBucket(markdown.length),
    };
    track("conversion_start", params);
    setBusy(true);
    setError(null);
    const started = now();
    try {
      const { markdownToDocx } = await import("@/lib/markdown-docx");
      const title = /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim().slice(0, 200);
      const { blob, warnings } = await markdownToDocx(markdown, { title });
      saveBlob(blob, `${fileName}.docx`);
      track("conversion_success", { ...params, duration_bucket: durationBucket(now() - started) });
      track("output_download", params);
      setResult({ warnings, size: blob.size });
    } catch (err) {
      console.error(err);
      track("conversion_error", { ...params, error_code: "unknown" });
      setError("The Word document could not be created. Try removing unusual content (raw HTML, very large images) and convert again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={toolCard}>
      <label htmlFor="docx-md-input" className="mb-2 block text-sm font-medium text-neutral-800">
        Markdown
      </label>
      <textarea
        id="docx-md-input"
        value={markdown}
        onChange={(e) => {
          setMarkdown(e.target.value);
          setResult(null);
          if (source.current !== "file") source.current = "typed";
        }}
        onPaste={() => {
          source.current = "clipboard";
        }}
        spellCheck={false}
        placeholder={"# Title\n\nWrite or paste Markdown here…"}
        className="h-80 w-full resize-y rounded-xl border border-neutral-200 bg-white p-4 font-mono text-sm text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={convert} disabled={busy || !markdown.trim()} className={primaryButton}>
          {busy ? "Creating…" : "Download .docx"}
        </button>
        <button
          type="button"
          className={secondaryButton}
          onClick={() => {
            setMarkdown(SAMPLE);
            setFileName("meeting-notes");
            source.current = "typed";
            setResult(null);
          }}
        >
          Try an example
        </button>
        {markdown && (
          <span className="text-sm text-neutral-600">{wordCount(markdown).toLocaleString()} words</span>
        )}
      </div>

      <div className="mt-4">
        <FileDropzone
          accept={ACCEPT}
          onFiles={loadFile}
          onDragIntent={() => void import("@/lib/markdown-docx")}
          label="Or drop a .md file"
          hint={<PrivacyNote />}
          compact
        />
      </div>

      {error && <ErrorAlert message={error} />}

      {result && (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800" data-testid="docx-done">
          <p>✓ {fileName}.docx downloaded — open it in Word, Google Docs, LibreOffice or Pages.</p>
          {result.warnings.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-800" data-testid="docx-warnings">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
