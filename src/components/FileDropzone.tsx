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
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 ${
        compact ? "py-8" : "py-14"
      } ${
        dragOver
          ? "scale-[1.01] border-indigo-500 bg-indigo-50"
          : "border-neutral-300 bg-neutral-50/80 hover:border-indigo-400 hover:bg-indigo-50/40"
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
      {children ?? (
        <>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-7 w-7" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </span>
          <p className="mt-5 text-lg font-semibold text-neutral-900">
            {label}, or{" "}
            <span className="text-indigo-600 underline decoration-indigo-300 underline-offset-4">browse</span>
          </p>
          {hint && <div className="mt-2 text-sm text-neutral-500">{hint}</div>}
        </>
      )}
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
        className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/30 transition-all hover:shadow-md hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50";

export const toolCard =
  "rounded-3xl border border-neutral-200 bg-white p-4 text-left shadow-lg shadow-neutral-900/5 sm:p-6";
