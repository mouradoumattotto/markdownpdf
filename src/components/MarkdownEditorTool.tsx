"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { baseName, saveBlob } from "@/lib/files";
import { insertBlock, insertLink, toggleLinePrefix, toggleWrap, type Edit } from "@/lib/markdown-edit";
import { detectFeatures } from "@/lib/markdown-render";
import type { ImageAssets } from "@/lib/markdown-rich";
import { ErrorAlert, secondaryButton, toolCard } from "@/components/FileDropzone";
import { useMarkdownPreview } from "@/components/useMarkdownPreview";

const TOOL = "markdown-editor";
const STORAGE_KEY = "mdpdf.editor.v1";
const NO_ASSETS: ImageAssets = new Map();

const WELCOME = `# Untitled document

Start writing here. The preview updates as you type, and everything is saved **in this browser** — nothing is sent anywhere.

## A few things you can do

- Format with the toolbar or **Ctrl+B**, *Ctrl+I* and Ctrl+K for links
- [ ] Tick tasks off like this
- Export to Markdown, HTML, PDF or Word from the menu above

| Shortcut | Action |
| --- | --- |
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+K | Link |
`;

type Action = { label: string; icon: string; shortcut?: string; edit: (value: string, start: number, end: number) => Edit };

const ACTIONS: Action[] = [
  { label: "Bold", icon: "B", shortcut: "Ctrl+B", edit: (v, s, e) => toggleWrap(v, s, e, "**", "bold text") },
  { label: "Italic", icon: "I", shortcut: "Ctrl+I", edit: (v, s, e) => toggleWrap(v, s, e, "*", "italic text") },
  { label: "Strikethrough", icon: "S", edit: (v, s, e) => toggleWrap(v, s, e, "~~", "text") },
  { label: "Heading", icon: "H", edit: (v, s, e) => toggleLinePrefix(v, s, e, "heading") },
  { label: "Link", icon: "🔗", shortcut: "Ctrl+K", edit: insertLink },
  { label: "Bulleted list", icon: "•", edit: (v, s, e) => toggleLinePrefix(v, s, e, "bullet") },
  { label: "Numbered list", icon: "1.", edit: (v, s, e) => toggleLinePrefix(v, s, e, "numbered") },
  { label: "Task list", icon: "☐", edit: (v, s, e) => toggleLinePrefix(v, s, e, "task") },
  { label: "Quote", icon: "❝", edit: (v, s, e) => toggleLinePrefix(v, s, e, "quote") },
  { label: "Inline code", icon: "`", edit: (v, s, e) => toggleWrap(v, s, e, "`", "code") },
  { label: "Code block", icon: "{ }", edit: (v, s, e) => insertBlock(v, s, e, "```\ncode\n```", 4, 4) },
  { label: "Table", icon: "▦", edit: (v, s, e) => insertBlock(v, s, e, "| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |", 2, 8) },
  { label: "Horizontal rule", icon: "—", edit: (v, s, e) => insertBlock(v, s, e, "---") },
];
const SHORTCUTS: Record<string, Action> = { b: ACTIONS[0], i: ACTIONS[1], k: ACTIONS[4] };

type View = "split" | "write" | "preview";

export default function MarkdownEditorTool() {
  const [markdown, setMarkdown] = useState(WELCOME);
  const [name, setName] = useState("document");
  const [view, setView] = useState<View>("split");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [storageOk, setStorageOk] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const restored = useRef(false);

  const features = useMemo(() => detectFeatures(markdown), [markdown]);
  const hydrate = useMarkdownPreview(markdown, features, NO_ASSETS, previewRef, 200);
  const words = useMemo(() => (markdown.trim() ? markdown.trim().split(/\s+/).length : 0), [markdown]);
  const title = useMemo(() => /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() ?? "", [markdown]);

  // Restore the last document after hydration (the server-rendered page must
  // not depend on this visitor's storage), then autosave on every change.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const doc = JSON.parse(saved) as { markdown?: string; name?: string };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (typeof doc.markdown === "string") setMarkdown(doc.markdown);
        if (typeof doc.name === "string") setName(doc.name);
      }
    } catch {
      setStorageOk(false);
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    const handle = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ markdown, name }));
        setSavedAt(new Date());
        setStorageOk(true);
      } catch {
        setStorageOk(false);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [markdown, name]);

  /** Applies a toolbar edit through the browser's own editing, so Ctrl+Z undoes it. */
  const apply = (fn: (value: string, start: number, end: number) => Edit) => {
    const ta = textRef.current;
    if (!ta) return;
    const edit = fn(ta.value, ta.selectionStart, ta.selectionEnd);
    ta.focus();
    ta.setSelectionRange(0, ta.value.length);
    const native = document.execCommand?.("insertText", false, edit.value);
    if (!native || ta.value !== edit.value) setMarkdown(edit.value);
    requestAnimationFrame(() => ta.setSelectionRange(edit.start, edit.end));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const action = SHORTCUTS[e.key.toLowerCase()];
    if (action) {
      e.preventDefault();
      apply(action.edit);
    }
  };

  const exportAs = (format: "md" | "html" | "pdf" | "docx") => async () => {
    const fileBase = name === "document" && title ? title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase().slice(0, 60) || name : name;
    const params = { tool_name: TOOL, input_format: "md", output_format: format };
    setError(null);
    setBusy(format);
    track("conversion_start", params);
    try {
      if (format === "md") {
        saveBlob(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), `${fileBase}.md`);
      } else if (format === "html") {
        const { markdownToHtml } = await import("@/lib/html-markdown");
        const html = await markdownToHtml(markdown, { fullDocument: true, title: title || "Document" });
        saveBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${fileBase}.html`);
      } else if (format === "pdf") {
        const { convertMarkdownToPdf } = await import("@/lib/markdown-to-pdf");
        const { blob } = await convertMarkdownToPdf(markdown, { title });
        saveBlob(blob, `${fileBase}.pdf`);
      } else {
        const { markdownToDocx } = await import("@/lib/markdown-docx");
        const { blob } = await markdownToDocx(markdown, { title });
        saveBlob(blob, `${fileBase}.docx`);
      }
      track("conversion_success", params);
      track("output_download", params);
    } catch (err) {
      const { UnsupportedScriptError } = await import("@/lib/markdown-to-pdf");
      if (err instanceof UnsupportedScriptError) {
        track("conversion_error", { ...params, error_code: "unsupported_script" });
        setError("This document uses a script the quick PDF export cannot shape. Open it in Markdown to PDF and use “Save as PDF”, which supports every language.");
      } else {
        console.error(err);
        track("conversion_error", { ...params, error_code: "unknown" });
        setError("The export failed. Try again, or export as Markdown.");
      }
    } finally {
      setBusy(null);
    }
  };

  const openFile = async (file: File) => {
    if (file.size > 5_000_000) {
      setError("This file is too large to edit comfortably in the browser (over 5 MB).");
      return;
    }
    track("file_selected", { tool_name: TOOL, input_format: "md" });
    setName(baseName(file.name));
    setMarkdown(await file.text());
    setError(null);
  };

  const newDocument = () => {
    if (markdown.trim() && markdown !== WELCOME && !window.confirm("Start a new document? The current one will be replaced (download it first to keep a copy).")) return;
    setMarkdown("");
    setName("document");
    textRef.current?.focus();
  };

  const showEditor = view !== "preview";
  const showPreview = view !== "write";

  return (
    <div className={`${toolCard} !p-0 overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
        <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5">
          {ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => apply(a.edit)}
              disabled={view === "preview"}
              title={a.shortcut ? `${a.label} (${a.shortcut})` : a.label}
              className={`h-8 min-w-8 rounded-md px-1.5 text-sm text-neutral-700 hover:bg-white hover:shadow-sm disabled:opacity-40 ${
                a.icon === "B" ? "font-bold" : a.icon === "I" ? "italic" : a.icon === "S" ? "line-through" : ""
              }`}
            >
              {/* The icon is decoration; the name is real text, so voice control and screen readers agree. */}
              <span aria-hidden>{a.icon}</span>
              <span className="sr-only">{a.label}</span>
            </button>
          ))}
        </div>
        <div role="tablist" aria-label="Editor view" className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5 text-sm">
          {(["write", "split", "preview"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1 capitalize ${view === v ? "bg-indigo-600 text-white" : "text-neutral-600 hover:bg-neutral-100"} ${v === "split" ? "hidden md:block" : ""}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid ${view === "split" ? "md:grid-cols-2" : ""}`}>
        {showEditor && (
          <textarea
            ref={textRef}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck
            aria-label="Markdown editor"
            placeholder="Write Markdown here…"
            className={`h-[32rem] w-full resize-none bg-white p-4 font-mono text-sm leading-relaxed text-neutral-800 focus:outline-none ${
              view === "split" ? "md:border-r md:border-neutral-200" : ""
            } ${view === "split" ? "block" : ""}`}
          />
        )}
        <div
          ref={previewRef}
          data-testid="editor-preview"
          aria-label="Preview"
          className={`md-preview prose prose-neutral h-[32rem] max-w-none overflow-auto bg-white p-5 prose-a:text-indigo-600 ${
            showPreview ? (view === "split" ? "hidden md:block" : "block") : "hidden"
          }`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
        <p className="text-neutral-600" data-testid="editor-status">
          {words.toLocaleString()} words · {Math.max(1, Math.round(words / 230))} min read ·{" "}
          {storageOk ? (savedAt ? "Saved in this browser" : "Autosaves in this browser") : "Autosave unavailable (private window?) — download to keep your work"}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={newDocument} className={secondaryButton}>
            New
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={secondaryButton}>
            Open…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            aria-label="Open a Markdown file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void openFile(f);
              e.target.value = "";
            }}
          />
          {(["md", "html", "pdf", "docx"] as const).map((f) => (
            <button key={f} type="button" onClick={exportAs(f)} disabled={Boolean(busy)} className={secondaryButton}>
              {busy === f ? "…" : `.${f}`}
            </button>
          ))}
        </div>
      </div>

      {(error || (hydrate && (hydrate.diagramErrors.length > 0 || hydrate.mathErrors > 0))) && (
        <div className="px-3 pb-3">
          {error && <ErrorAlert message={error} />}
          {hydrate && hydrate.diagramErrors.length > 0 && (
            <p className="mt-2 text-sm text-amber-800">A Mermaid diagram has a syntax error — see the preview.</p>
          )}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {busy ? `Exporting ${busy}` : ""}
      </p>
      <p className="px-3 pb-3 text-xs text-neutral-600">
        Need page themes or right-to-left languages in the PDF? Use{" "}
        <Link href="/markdown-to-pdf" className="font-medium text-indigo-600 hover:underline">
          Markdown to PDF
        </Link>
        .
      </p>
    </div>
  );
}
