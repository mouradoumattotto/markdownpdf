"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatBytes } from "@/lib/ai-limits";
import { pageBucket, sizeBucket, track } from "@/lib/analytics";
import { baseName, saveBlob } from "@/lib/files";
import ContinueWith from "@/components/ContinueWith";
import FileDropzone, { ErrorAlert, PrivacyNote, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "html-to-pdf";
const ACCEPT = ".html,.htm,.xhtml,text/html";
const NEXT = ["pdf-to-markdown", "merge-pdf", "split-pdf", "pdf-metadata"];

const SAMPLE = `<!doctype html>
<html><head><title>Quarterly update</title></head>
<body>
<nav><a href="/">Home</a> · <a href="/blog">Blog</a></nav>
<main>
<h1>Quarterly update</h1>
<p>Revenue grew <strong>12%</strong>, driven by <em>new markets</em>. See the <a href="https://example.com/report">full report</a>.</p>
<h2>Highlights</h2>
<ul><li>Launched in Spain</li><li>Hired 4 engineers</li></ul>
<table><tr><th>Region</th><th>Growth</th></tr><tr><td>EU</td><td>15%</td></tr><tr><td>US</td><td>9%</td></tr></table>
<pre><code class="language-python">print("hello")</code></pre>
</main>
<footer>© Example Inc.</footer>
</body></html>`;

type Result = { blob: Blob; name: string; pages: number; words: number; notes: string[]; missing: string[] };

type State =
  | { kind: "idle" }
  | { kind: "converting" }
  | { kind: "done"; result: Result }
  | { kind: "script"; markdown: string }
  | { kind: "error"; message: string };

const lib = () => import("@/lib/html-to-pdf");

export default function HtmlToPdfTool() {
  const [html, setHtml] = useState("");
  const [mainOnly, setMainOnly] = useState(true);
  const [keepImages, setKeepImages] = useState(true);
  const [pastedRich, setPastedRich] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const inputFormat = useRef("html");
  const imageRef = useRef<HTMLInputElement>(null);

  // Revoke attached image URLs when they are replaced and on unmount.
  const imagesRef = useRef(images);
  useEffect(() => {
    const previous = imagesRef.current;
    imagesRef.current = images;
    previous.filter((p) => !images.includes(p)).forEach((p) => URL.revokeObjectURL(p.url));
  }, [images]);
  useEffect(() => () => imagesRef.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  const changeInput = (value: string) => {
    setHtml(value);
    if (state.kind !== "idle" && state.kind !== "converting") setState({ kind: "idle" });
  };

  const loadFile = async ([file]: File[]) => {
    if (!file) return;
    const params = { tool_name: TOOL, input_format: "html", output_format: "pdf", file_size_bucket: sizeBucket(file.size) };
    track("file_selected", params);
    if (file.size === 0) {
      setState({ kind: "error", message: "This file is empty." });
      track("conversion_error", { ...params, error_code: "empty_file" });
      return;
    }
    const text = await file.text();
    if (!/<[a-z!][\s\S]*>/i.test(text)) {
      setState({ kind: "error", message: "This file does not contain HTML." });
      track("conversion_error", { ...params, error_code: "not_supported_type" });
      return;
    }
    inputFormat.current = "html";
    setFileName(baseName(file.name));
    setPastedRich(false);
    setHtml(text);
    setState({ kind: "idle" });
  };

  const convert = async () => {
    if (!html.trim()) return;
    const params = {
      tool_name: TOOL,
      input_format: inputFormat.current,
      output_format: "pdf",
      file_size_bucket: sizeBucket(html.length),
    };
    setState({ kind: "converting" });
    setCopied(false);
    track("conversion_start", params);
    try {
      const { htmlToPdf, pdfFileName } = await lib();
      const assets = new Map(images.map((i) => [i.name.toLowerCase(), i.url]));
      const r = await htmlToPdf(html, { mainContentOnly: mainOnly, keepImages, assets });
      const notes: string[] = [];
      if (r.warnings.failedMath) notes.push(`${r.warnings.failedMath} formula(s) were kept as text.`);
      if (r.warnings.droppedSymbols) notes.push("Emoji cannot be drawn in this PDF and were left out.");
      track("conversion_success", { ...params, page_count_bucket: pageBucket(r.pageCount) });
      setState({
        kind: "done",
        result: {
          blob: r.blob,
          name: pdfFileName(r.title, fileName ?? "page"),
          pages: r.pageCount,
          words: r.markdown.split(/\s+/).filter(Boolean).length,
          notes,
          missing: r.warnings.missingImages,
        },
      });
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "UnsupportedScriptError") {
        track("conversion_error", { ...params, error_code: "unsupported_script" });
        const { prepareHtml } = await lib();
        const prepared = await prepareHtml(html, { mainContentOnly: mainOnly, keepImages }).catch(() => null);
        setState({ kind: "script", markdown: prepared?.markdown ?? "" });
      } else if (name === "EmptyHtmlError") {
        track("conversion_error", { ...params, error_code: "no_text_found" });
        setState({
          kind: "error",
          message: mainOnly
            ? "No readable text was found. Untick “Main content only” if the text sits outside the page's main area."
            : "No readable text was found in this HTML.",
        });
      } else {
        console.error(err);
        track("conversion_error", { ...params, error_code: "render_failed" });
        setState({ kind: "error", message: "This HTML could not be converted to PDF." });
      }
    }
  };

  const download = (r: Result) => {
    saveBlob(r.blob, r.name);
    track("output_download", { tool_name: TOOL, input_format: inputFormat.current, output_format: "pdf" });
  };

  const addImages = (files: FileList | null) => {
    if (!files?.length) return;
    const added = Array.from(files).map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setImages((prev) => [...prev.filter((p) => !added.some((a) => a.name.toLowerCase() === p.name.toLowerCase())), ...added]);
    if (state.kind === "done") setState({ kind: "idle" });
  };

  return (
    <div className={toolCard}>
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div>
          <label htmlFor="html-pdf-input" className="mb-2 block text-sm font-medium text-neutral-800">
            HTML — paste code, or copy from a web page and paste here
          </label>
          <textarea
            id="html-pdf-input"
            value={html}
            onChange={(e) => {
              changeInput(e.target.value);
              setPastedRich(false);
            }}
            onPaste={(e) => {
              // A copy from a web page carries the formatted version as text/html
              // next to the plain text: that is where the headings and tables are.
              const rich = e.clipboardData.getData("text/html");
              if (rich && !e.clipboardData.getData("text/plain").trim().startsWith("<")) {
                e.preventDefault();
                changeInput(rich);
                setPastedRich(true);
                inputFormat.current = "clipboard";
              } else {
                inputFormat.current = "html";
              }
              setFileName(null);
            }}
            spellCheck={false}
            placeholder="<h1>Title</h1>&#10;<p>Some <strong>bold</strong> text…</p>"
            className="h-72 w-full resize-y rounded-xl border border-neutral-200 bg-white p-4 font-mono text-sm text-neutral-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
          />
          {pastedRich && (
            <p className="mt-1 text-xs text-emerald-700">Formatted content pasted — shown here as its HTML source.</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={mainOnly}
                onChange={(e) => {
                  setMainOnly(e.target.checked);
                  if (state.kind !== "converting") setState({ kind: "idle" });
                }}
                className="accent-indigo-600"
              />
              Main content only (drop menus, headers, footers)
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={keepImages}
                onChange={(e) => {
                  setKeepImages(e.target.checked);
                  if (state.kind !== "converting") setState({ kind: "idle" });
                }}
                className="accent-indigo-600"
              />
              Include images
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={secondaryButton}
              onClick={() => {
                changeInput(SAMPLE);
                setPastedRich(false);
                setFileName("quarterly-update");
                inputFormat.current = "html";
              }}
            >
              Try an example
            </button>
            {html && (
              <button
                type="button"
                className={secondaryButton}
                onClick={() => {
                  changeInput("");
                  setFileName(null);
                }}
              >
                Clear
              </button>
            )}
          </div>
          <div className="mt-4">
            <FileDropzone
              accept={ACCEPT}
              onFiles={loadFile}
              onDragIntent={() => void lib()}
              label="Or drop an .html file"
              hint={<PrivacyNote />}
              compact
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">PDF</p>
            <p className="mt-1 text-sm text-neutral-600">
              {html.trim()
                ? `${fileName ? `${fileName}.html · ` : ""}${formatBytes(new Blob([html]).size)} of HTML, ready to convert.`
                : "Paste HTML or drop a file on the left."}
            </p>
            <button
              type="button"
              className={`${primaryButton} mt-3 w-full`}
              disabled={!html.trim() || state.kind === "converting"}
              onClick={convert}
            >
              {state.kind === "converting" ? "Creating PDF…" : "Convert to PDF"}
            </button>
            {keepImages && (
              <div className="mt-3 text-xs text-neutral-500">
                Images with a relative path (like <span className="font-mono">img/photo.jpg</span>) need the files:{" "}
                <button type="button" className="font-semibold text-indigo-600 underline underline-offset-2" onClick={() => imageRef.current?.click()}>
                  add images
                </button>
                {images.length > 0 && ` (${images.length} attached)`}.
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addImages(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
            )}
          </div>

          {state.kind === "done" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4" role="status">
                <p className="font-semibold text-emerald-900">PDF ready</p>
                <p className="mt-1 text-sm text-emerald-800">
                  {state.result.pages} {state.result.pages === 1 ? "page" : "pages"} · {state.result.words.toLocaleString()} words ·{" "}
                  {formatBytes(state.result.blob.size)}
                </p>
              </div>
              {state.result.missing.length > 0 && (
                <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {state.result.missing.length} image(s) could not be loaded and were replaced by their description:{" "}
                  <span className="font-mono break-all">{state.result.missing.slice(0, 3).join(", ")}</span>
                  {state.result.missing.length > 3 && "…"}. Attach local files with <strong>add images</strong>; remote
                  images only load when their server allows it.
                </p>
              )}
              {state.result.notes.length > 0 && <p className="text-sm text-neutral-600">{state.result.notes.join(" ")}</p>}
              <button type="button" className={`${primaryButton} w-full`} onClick={() => download(state.result)}>
                Download PDF
              </button>
              <ContinueWith
                from={TOOL}
                targets={NEXT}
                file={() => new File([state.result.blob], state.result.name, { type: "application/pdf" })}
              />
            </div>
          )}

          {state.kind === "script" && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
              <p>
                This page contains a script (such as Arabic, Hindi, Thai or Chinese) that this converter cannot lay out. Paste the
                Markdown below into <Link href="/md-to-pdf" className="font-semibold underline">Markdown to PDF</Link>{" "}
                and use its <strong>Save as PDF</strong> button: it uses your browser&apos;s own engine, which handles every
                language.
              </p>
              {state.markdown && (
                <button
                  type="button"
                  className={`${secondaryButton} mt-3`}
                  onClick={async () => {
                    await navigator.clipboard.writeText(state.markdown);
                    setCopied(true);
                    track("output_copy", { tool_name: TOOL, output_format: "md" });
                  }}
                >
                  {copied ? "Markdown copied" : "Copy the Markdown"}
                </button>
              )}
            </div>
          )}

          {state.kind === "error" && <ErrorAlert message={state.message} />}
        </div>
      </div>
    </div>
  );
}
