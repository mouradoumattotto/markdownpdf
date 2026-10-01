"use client";

import { useRef, useState, type ReactNode } from "react";

interface Props {
  /** Passed to <input accept>, e.g. ".pdf,application/pdf". */
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  /** Main line, e.g. "Drop your PDF here". Followed by ", or browse". */
  label: string;
  hint?: ReactNode;
  /** Replaces the idle content (e.g. a progress display) while working. */
  children?: ReactNode;
  /** Optional: fired while a file is dragged over, before it is dropped. */
  onDragIntent?: () => void;
  compact?: boolean;
}

function UploadIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

/** "Select PDF file", "Select images"… — named after what the input accepts. */
function buttonLabel(accept: string, multiple: boolean): string {
  const a = accept.toLowerCase();
  const plural = multiple ? "s" : "";
  if (a === ".pdf,application/pdf") return `Select PDF file${plural}`;
  if (a.includes("image/") && !a.includes("pdf")) return multiple ? "Select images" : "Select image";
  if (a.includes(".docx") && !a.includes("pdf")) return `Select Word file${plural}`;
  return `Select file${plural}`;
}

/**
 * Shared file picker used by every tool: drag and drop, click, or keyboard
 * (Enter / Space). The accessible name is computed from the visible text, so
 * what a voice-control user reads out is exactly what they can say.
 */
export default function FileDropzone({
  accept,
  multiple = false,
  disabled = false,
  onFiles,
  label,
  hint,
  children,
  onDragIntent,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const open = () => {
    if (!disabled) inputRef.current?.click();
  };

  const emit = (list: FileList | null) => {
    if (!list || list.length === 0 || disabled) return;
    const files = Array.from(list);
    onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragOver) {
          setDragOver(true);
          onDragIntent?.();
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        emit(e.dataTransfer.files);
      }}
      onMouseEnter={onDragIntent}
      onFocus={onDragIntent}
      className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 sm:px-6 ${
        compact ? "py-7" : "py-10 sm:py-14"
      } ${
        dragOver
          ? "scale-[1.01] border-brand-500 bg-brand-50"
          : "border-neutral-300 bg-paper/60 hover:border-brand-400 hover:bg-brand-50/40"
      } ${disabled ? "pointer-events-none opacity-70" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        tabIndex={-1}
        onChange={(e) => {
          emit(e.target.files);
          e.target.value = "";
        }}
      />
      {children ??
        (compact ? (
          <>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
              <UploadIcon className="h-5 w-5" />
            </span>
            <p className="mt-3 font-semibold text-ink">
              {label}, or{" "}
              <span className="text-brand-600 underline decoration-brand-300 underline-offset-4">browse</span>
            </p>
            {hint && <div className="mt-1.5 text-sm text-neutral-500">{hint}</div>}
          </>
        ) : (
          <>
            <span className="inline-flex w-full max-w-xs items-center justify-center gap-2.5 rounded-xl bg-brand-600 px-8 py-4 text-lg font-bold text-white shadow-[0_12px_24px_-12px_var(--color-brand-600)] transition group-hover:bg-brand-700 sm:w-auto sm:max-w-none sm:px-16 sm:py-[22px] sm:text-xl">
              <UploadIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              {buttonLabel(accept, multiple)}
            </span>
            <p className="mt-3.5 text-[15px] text-neutral-600">{label}</p>
            {hint && <div className="mt-2 text-sm text-neutral-500">{hint}</div>}
          </>
        ))}
    </div>
  );
}

/** Small reusable pieces shared by the tool UIs. */
export function PrivacyNote({ children }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-emerald-500" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
      {children ?? "Processed on your device — never uploaded"}
    </span>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mt-0.5 h-4 w-4 shrink-0" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      {message}
    </p>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-neutral-200"
    >
      <div
        className="h-full rounded-full bg-brand-600 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand-600";

export const secondaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d4d4d0] bg-white px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50";

export const toolCard =
  "rounded-2xl border border-line bg-white p-3 text-left shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)] sm:p-6";
