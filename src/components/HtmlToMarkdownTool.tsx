"use client";

import { useEffect, useRef, useState } from "react";
import { sizeBucket, track } from "@/lib/analytics";
import { baseName } from "@/lib/files";
import FileDropzone, { ErrorAlert, PrivacyNote, secondaryButton, toolCard } from "@/components/FileDropzone";
import TextOutput, { wordCount } from "@/components/TextOutput";

const TOOL = "html-to-markdown";
const ACCEPT = ".html,.htm,.xhtml,text/html";
/** Beyond this, typing-speed reconversion gets sluggish; convert on demand instead. */
const LIVE_LIMIT = 400_000;

const SAMPLE = `<h1>Quarterly update</h1>
<p>Revenue grew <strong>12%</strong>, driven by <em>new markets</em>. See the <a href="https://example.com/report">full report</a>.</p>
<ul><li>Launched in Spain</li><li>Hired 4 engineers</li></ul>
<table><tr><th>Region</th><th>Growth</th></tr><tr><td>EU</td><td>15%</td></tr><tr><td>US</td><td>9%</td></tr></table>
<pre><code class="language-python">print("hello")</code></pre>`;

export default function HtmlToMarkdownTool() {
  const [html, setHtml] = useState("");
  const [converted, setMarkdown] = useState("");
  const [mainOnly, setMainOnly] = useState(true);
  const [keepImages, setKeepImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("converted");
  const [pastedRich, setPastedRich] = useState(false);
  /** Where the current input came from, so success is reported once per input, not per keystroke. */
  const pendingReport = useRef<null | { input_format: string; file_size_bucket: string }>(null);

  useEffect(() => {
    if (!html.trim()) return;
    let cancelled = false;
    const handle = setTimeout(
      async () => {
        try {
          const { htmlToMarkdown } = await import("@/lib/html-markdown");
          const md = await htmlToMarkdown(html, { mainContentOnly: mainOnly, keepImages });
          if (cancelled) return;
          setMarkdown(md);
          setError(null);
          if (pendingReport.current) {
            track("conversion_success", { tool_name: TOOL, output_format: "md", ...pendingReport.current });
            pendingReport.current = null;
          }
        } catch (err) {
          console.error(err);
          if (cancelled) return;
          setError("This HTML could not be converted.");
          track("conversion_error", { tool_name: TOOL, output_format: "md", error_code: "unknown" });
        }
      },
      html.length > LIVE_LIMIT ? 600 : 200,
    );
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [html, mainOnly, keepImages]);

  // Stale output from before the input was cleared is hidden, not reset.
  const markdown = html.trim() ? converted : "";

  const loadFile = async ([file]: File[]) => {
    if (!file) return;
    const params = { tool_name: TOOL, input_format: "html", output_format: "md", file_size_bucket: sizeBucket(file.size) };
    track("file_selected", params);
    if (file.size === 0) {
      setError("This file is empty.");
      track("conversion_error", { ...params, error_code: "empty_file" });
      return;
    }
    const text = await file.text();
    if (!/<[a-z!][\s\S]*>/i.test(text)) {
      setError("This file does not contain HTML.");
      track("conversion_error", { ...params, error_code: "not_supported_type" });
      return;
    }
    track("conversion_start", params);
    pendingReport.current = { input_format: "html", file_size_bucket: params.file_size_bucket };
    setFileName(baseName(file.name));
    setPastedRich(false);
    setHtml(text);
  };

  return (
    <div className={toolCard}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="html-input" className="mb-2 block text-sm font-medium text-neutral-800">
            HTML — paste code, or copy from a web page, Word or Google Docs and paste here
          </label>
          <textarea
            id="html-input"
            value={html}
            onChange={(e) => {
              setHtml(e.target.value);
              setPastedRich(false);
            }}
            onPaste={(e) => {
              // A copy from a web page or a word processor carries the formatted
              // version as text/html next to the plain text. Use it: that is
              // where the headings, links and tables are.
              const rich = e.clipboardData.getData("text/html");
              if (rich && !e.clipboardData.getData("text/plain").trim().startsWith("<")) {
                e.preventDefault();
                setHtml(rich);
                setPastedRich(true);
                pendingReport.current = { input_format: "clipboard", file_size_bucket: sizeBucket(rich.length) };
                track("conversion_start", { tool_name: TOOL, input_format: "clipboard", output_format: "md" });
              } else {
                pendingReport.current = { input_format: "html", file_size_bucket: sizeBucket(e.clipboardData.getData("text/plain").length) };
              }
            }}
            spellCheck={false}
            placeholder="<h1>Title</h1>&#10;<p>Some <strong>bold</strong> text…</p>"
            className="h-80 w-full resize-y rounded-xl border border-neutral-200 bg-white p-4 font-mono text-sm text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {pastedRich && (
            <p className="mt-1 text-xs text-emerald-700">Formatted content pasted — shown here as its HTML source.</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-700">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={mainOnly} onChange={(e) => setMainOnly(e.target.checked)} className="accent-indigo-600" />
              Main content only (drop menus, headers, footers)
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={keepImages} onChange={(e) => setKeepImages(e.target.checked)} className="accent-indigo-600" />
              Keep images
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={secondaryButton} onClick={() => { setHtml(SAMPLE); setPastedRich(false); }}>
              Try an example
            </button>
            {html && (
              <button type="button" className={secondaryButton} onClick={() => { setHtml(""); setError(null); }}>
                Clear
              </button>
            )}
          </div>
          <div className="mt-4">
            <FileDropzone
              accept={ACCEPT}
              onFiles={loadFile}
              onDragIntent={() => void import("@/lib/html-markdown")}
              label="Or drop an .html file"
              hint={<PrivacyNote />}
              compact
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-neutral-800">Markdown</p>
          {markdown ? (
            <TextOutput
              value={markdown}
              onChange={setMarkdown}
              label="Markdown output"
              fileName={`${fileName}.md`}
              mimeType="text/markdown"
              toolName={TOOL}
              outputFormat="md"
              summary={`${wordCount(markdown).toLocaleString()} words`}
            />
          ) : (
            <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
              The Markdown appears here as soon as there is HTML on the left.
            </div>
          )}
        </div>
      </div>
      {error && <ErrorAlert message={error} />}
    </div>
  );
}
