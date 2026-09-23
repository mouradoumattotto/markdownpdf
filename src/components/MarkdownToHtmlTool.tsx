"use client";

import { useEffect, useRef, useState } from "react";
import { sizeBucket, track } from "@/lib/analytics";
import { baseName } from "@/lib/files";
import FileDropzone, { ErrorAlert, PrivacyNote, secondaryButton, toolCard } from "@/components/FileDropzone";
import TextOutput from "@/components/TextOutput";

const TOOL = "markdown-to-html";
const ACCEPT = ".md,.markdown,.mdown,.txt,text/markdown,text/plain";

const SAMPLE = `# Project notes

Some **bold**, some *italic*, and a [link](https://example.com).

- [x] Draft the spec
- [ ] Review it

| Step | Owner |
| --- | --- |
| Design | Ana |
| Build | Sam |

\`\`\`js
console.log("hello");
\`\`\`
`;

export default function MarkdownToHtmlTool() {
  const [markdown, setMarkdown] = useState("");
  const [fragment, setFragment] = useState("");
  const [fullDocument, setFullDocument] = useState(false);
  const [rendered, setOutput] = useState("");
  const [view, setView] = useState<"code" | "preview">("code");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("document");
  const pendingReport = useRef<null | { input_format: string; file_size_bucket: string }>(null);

  useEffect(() => {
    if (!markdown.trim()) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const { markdownToHtml } = await import("@/lib/html-markdown");
        const body = await markdownToHtml(markdown);
        const full = fullDocument ? await markdownToHtml(markdown, { fullDocument: true, title: titleOf(markdown) }) : body;
        if (cancelled) return;
        setFragment(body);
        setOutput(full);
        setError(null);
        if (pendingReport.current) {
          track("conversion_success", { tool_name: TOOL, output_format: "html", ...pendingReport.current });
          pendingReport.current = null;
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("This Markdown could not be converted.");
        track("conversion_error", { tool_name: TOOL, output_format: "html", error_code: "unknown" });
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [markdown, fullDocument]);

  // Stale output from before the input was cleared is hidden, not reset.
  const hasInput = Boolean(markdown.trim());
  const output = hasInput ? rendered : "";

  const loadFile = async ([file]: File[]) => {
    if (!file) return;
    const params = { tool_name: TOOL, input_format: "md", output_format: "html", file_size_bucket: sizeBucket(file.size) };
    track("file_selected", params);
    if (file.size === 0) {
      setError("This file is empty.");
      track("conversion_error", { ...params, error_code: "empty_file" });
      return;
    }
    track("conversion_start", params);
    pendingReport.current = { input_format: "md", file_size_bucket: params.file_size_bucket };
    setFileName(baseName(file.name));
    setMarkdown(await file.text());
  };

  return (
    <div className={toolCard}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="md-input" className="mb-2 block text-sm font-medium text-neutral-800">
            Markdown
          </label>
          <textarea
            id="md-input"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            onPaste={(e) => {
              pendingReport.current = {
                input_format: "clipboard",
                file_size_bucket: sizeBucket(e.clipboardData.getData("text/plain").length),
              };
            }}
            spellCheck={false}
            placeholder={"# Title\n\nWrite or paste Markdown here…"}
            className="h-80 w-full resize-y rounded-xl border border-neutral-200 bg-white p-4 font-mono text-sm text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={fullDocument}
                onChange={(e) => setFullDocument(e.target.checked)}
                className="accent-indigo-600"
              />
              Complete HTML page (with &lt;head&gt; and basic styling)
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={secondaryButton} onClick={() => setMarkdown(SAMPLE)}>
              Try an example
            </button>
            {markdown && (
              <button type="button" className={secondaryButton} onClick={() => setMarkdown("")}>
                Clear
              </button>
            )}
          </div>
          <div className="mt-4">
            <FileDropzone
              accept={ACCEPT}
              onFiles={loadFile}
              onDragIntent={() => void import("@/lib/html-markdown")}
              label="Or drop a .md file"
              hint={<PrivacyNote />}
              compact
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-neutral-800">HTML</p>
            <div role="tablist" aria-label="Output view" className="inline-flex rounded-lg border border-neutral-200 p-0.5 text-sm">
              {(["code", "preview"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1 ${view === v ? "bg-indigo-600 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
                >
                  {v === "code" ? "Code" : "Preview"}
                </button>
              ))}
            </div>
          </div>
          {!output ? (
            <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
              The HTML appears here as soon as there is Markdown on the left.
            </div>
          ) : view === "code" ? (
            <TextOutput
              value={output}
              label="HTML output"
              fileName={`${fileName}.html`}
              mimeType="text/html"
              toolName={TOOL}
              outputFormat="html"
              summary={`${output.length.toLocaleString()} characters`}
            />
          ) : (
            // Already sanitised by DOMPurify in markdownToHtml.
            <div
              data-testid="html-preview"
              className="prose prose-neutral h-80 max-w-none overflow-auto rounded-xl border border-neutral-200 bg-white p-4 prose-a:text-indigo-600"
              dangerouslySetInnerHTML={{ __html: fragment }}
            />
          )}
        </div>
      </div>
      {error && <ErrorAlert message={error} />}
    </div>
  );
}

/** The first heading makes a better <title> than "Document". */
function titleOf(markdown: string): string {
  return /^#{1,6}\s+(.+)$/m.exec(markdown)?.[1]?.trim().slice(0, 120) || "Document";
}
