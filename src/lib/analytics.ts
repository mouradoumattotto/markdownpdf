/**
 * Tool analytics — one small, fixed vocabulary shared by every tool.
 *
 * Privacy rule, enforced here rather than trusted to call sites: only the
 * parameters in ALLOWED_PARAMS are ever sent, and only as short enum-like
 * strings, numbers or booleans. File names, document text, titles and PDF
 * metadata can never reach Google Analytics, even by mistake, because they are
 * not on the list and long strings are dropped.
 *
 * Works with the deferred GA loader: ConsentMode defines window.gtag and
 * window.dataLayer at `beforeInteractive`, so events fired before gtag.js has
 * loaded are queued and sent once it arrives.
 *
 * The funnel, per tool_name:
 *   page_view → file_selected → conversion_start → conversion_success
 *   → output_download | output_copy
 * with conversion_error / conversion_cancel as the exits.
 */

export type ToolEvent =
  | "file_selected"
  | "conversion_start"
  | "conversion_success"
  | "conversion_error"
  | "conversion_cancel"
  | "ocr_start"
  | "ocr_complete"
  | "output_download"
  | "output_copy"
  | "continue_with";

export type ErrorCode =
  | "not_supported_type"
  | "empty_file"
  | "encrypted"
  | "corrupted"
  | "no_text_found"
  | "ocr_failed"
  | "too_many_files"
  | "unsupported_script"
  | "render_failed"
  | "unknown";

export interface ToolEventParams {
  tool_name: string;
  input_format?: string;
  output_format?: string;
  file_size_bucket?: string;
  page_count_bucket?: string;
  file_count_bucket?: string;
  ocr_used?: boolean;
  ocr_language?: string;
  duration_bucket?: string;
  error_code?: ErrorCode;
  /** Which exporter produced the file, when a tool has several ("quick" | "print"). */
  export_mode?: string;
  /** Destination a tool prepares a file for, e.g. "notebooklm". */
  target?: string;
}

const ALLOWED_PARAMS = new Set<string>([
  "tool_name",
  "input_format",
  "output_format",
  "file_size_bucket",
  "page_count_bucket",
  "file_count_bucket",
  "ocr_used",
  "ocr_language",
  "duration_bucket",
  "error_code",
  "export_mode",
  "target",
]);

// Every allowed value is a short identifier ("pdf", "1-10mb", "ara").
// Anything longer is not one of ours and is dropped.
const MAX_VALUE_LENGTH = 32;

/** Pure and exported for tests: what actually gets sent. */
export function sanitizeParams(params: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!ALLOWED_PARAMS.has(key)) continue;
    if (typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) {
      out[key] = value;
    } else if (typeof value === "string" && value.length > 0 && value.length <= MAX_VALUE_LENGTH) {
      out[key] = value;
    }
  }
  return out;
}

type Gtag = (command: "event", name: string, params: Record<string, unknown>) => void;

export function track(event: ToolEvent, params: ToolEventParams): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== "function") return;
  try {
    gtag("event", event, sanitizeParams(params as unknown as Record<string, unknown>));
  } catch {
    // Analytics must never break a conversion.
  }
}

// ---- Buckets: coarse on purpose, so no event can fingerprint a document ----

export function sizeBucket(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return "<1mb";
  if (mb < 10) return "1-10mb";
  if (mb < 50) return "10-50mb";
  return "50mb+";
}

export function pageBucket(pages: number): string {
  if (pages <= 1) return "1";
  if (pages <= 10) return "2-10";
  if (pages <= 50) return "11-50";
  if (pages <= 200) return "51-200";
  return "200+";
}

export function countBucket(n: number): string {
  if (n <= 1) return "1";
  if (n <= 5) return "2-5";
  if (n <= 20) return "6-20";
  return "20+";
}

export function durationBucket(ms: number): string {
  const s = ms / 1000;
  if (s < 2) return "<2s";
  if (s < 10) return "2-10s";
  if (s < 60) return "10-60s";
  return "60s+";
}

/** "report.PDF" -> "pdf". Only the extension, never the name. */
export function extensionOf(fileName: string): string {
  const m = /\.([a-z0-9]{1,8})$/i.exec(fileName);
  return m ? m[1].toLowerCase() : "unknown";
}
