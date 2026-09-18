import type { ErrorCode } from "@/lib/analytics";

/** Triggers a browser download of a Blob without any network round trip. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick: some browsers (Safari) start the download
  // asynchronously and fail if the URL is already gone.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "My Report (final).pdf" -> "My Report (final)" */
export function baseName(fileName: string): string {
  return fileName.replace(/\.[^./\\]+$/, "") || "document";
}

export type PdfSniff = "ok" | "empty" | "not_pdf";

/**
 * Checks the actual bytes, not the extension or the MIME type (both are set by
 * the OS and are routinely wrong). The spec allows junk before the header, and
 * real-world files do have some, so the first 1024 bytes are searched.
 */
export async function sniffPdf(file: Blob): Promise<PdfSniff> {
  if (file.size === 0) return "empty";
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const text = String.fromCharCode(...head);
  return text.includes("%PDF-") ? "ok" : "not_pdf";
}

export interface ClassifiedError {
  code: ErrorCode;
  message: string;
}

/**
 * Maps pdf.js / pdf-lib / generic failures to one of our error codes and a
 * message the user can act on. The raw error is never shown (or tracked).
 */
export function classifyPdfError(err: unknown): ClassifiedError {
  const name = err instanceof Error ? err.name : "";
  const msg = err instanceof Error ? err.message : String(err);
  if (name === "PasswordException" || /password|encrypt/i.test(msg)) {
    return {
      code: "encrypted",
      message: "This PDF is password-protected or encrypted. Open it with its password and save an unprotected copy first.",
    };
  }
  if (name === "InvalidPDFException" || /invalid pdf|no pdf header|failed to parse/i.test(msg)) {
    return {
      code: "corrupted",
      message: "This file could not be read as a PDF. It may be damaged or not a real PDF.",
    };
  }
  return {
    code: "unknown",
    message: "Something went wrong while processing this file. Try again, or try another file.",
  };
}

export function sniffMessage(result: Exclude<PdfSniff, "ok">): ClassifiedError {
  return result === "empty"
    ? { code: "empty_file", message: "This file is empty (0 bytes)." }
    : { code: "not_supported_type", message: "This file is not a PDF. Please choose a .pdf file." };
}

/** Thrown when the user cancels; callers treat it as a non-error exit. */
export class CancelledError extends Error {
  constructor() {
    super("Cancelled");
    this.name = "CancelledError";
  }
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new CancelledError();
}
