"use client";

import { useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { saveBlob } from "@/lib/files";
import { primaryButton, secondaryButton } from "@/components/FileDropzone";

interface Props {
  value: string;
  onChange?: (value: string) => void;
  /** Accessible name of the text area. */
  label: string;
  fileName: string;
  mimeType: string;
  toolName: string;
  outputFormat: string;
  /** Left side of the toolbar (word count, notes). */
  summary?: ReactNode;
  /** Replaces the default download button, e.g. a ZIP with images. */
  download?: ReactNode;
  heightClass?: string;
}

/** Editable result with Copy and Download, shared by the text conversion tools. */
export default function TextOutput({
  value,
  onChange,
  label,
  fileName,
  mimeType,
  toolName,
  outputFormat,
  summary,
  download,
  heightClass = "h-80",
}: Props) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-neutral-600">{summary}</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                track("output_copy", { tool_name: toolName, output_format: outputFormat });
              } catch {
                setCopied(false);
              }
            }}
            className={secondaryButton}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          {download ?? (
            <button
              type="button"
              onClick={() => {
                saveBlob(new Blob([value], { type: `${mimeType};charset=utf-8` }), fileName);
                track("output_download", { tool_name: toolName, output_format: outputFormat });
              }}
              className={primaryButton}
            >
              Download {fileName.slice(fileName.lastIndexOf("."))}
            </button>
          )}
        </div>
      </div>
      <textarea
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        spellCheck={false}
        dir="auto"
        aria-label={label}
        className={`${heightClass} w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100`}
      />
    </div>
  );
}

export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}
