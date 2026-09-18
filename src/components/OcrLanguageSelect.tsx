"use client";

import { useEffect } from "react";
import { DEFAULT_OCR_LANGUAGE, OCR_LANGUAGES, isOcrLanguage, type OcrLanguage } from "@/lib/ocr";

const STORAGE_KEY = "mdpdf.ocrLanguage";

/** Remembers the visitor's last OCR language — a per-device convenience only. */
export function useStoredOcrLanguage(set: (lang: OcrLanguage) => void) {
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && isOcrLanguage(saved)) set(saved);
    } catch {
      // Private mode / blocked storage: the default is fine.
    }
  }, [set]);
}

export function storeOcrLanguage(lang: OcrLanguage) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

export default function OcrLanguageSelect({
  value,
  onChange,
  disabled,
  id = "ocr-language",
  label = "Language of scanned pages",
}: {
  value: OcrLanguage;
  onChange: (lang: OcrLanguage) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
      <label htmlFor={id}>{label}:</label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const lang = isOcrLanguage(e.target.value) ? e.target.value : DEFAULT_OCR_LANGUAGE;
          storeOcrLanguage(lang);
          onChange(lang);
        }}
        className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
      >
        {OCR_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
