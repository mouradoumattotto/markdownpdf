/**
 * Any supported document → Markdown text, for tools that work on text (token
 * counter, chunker). Each format goes through the same converter as its own
 * tool, so a PDF counted here is the PDF you would get from PDF to Markdown.
 */
import type { ConversionProgress } from "@/lib/pdf-to-markdown";

export const TEXT_ACCEPT =
  ".pdf,.docx,.md,.markdown,.txt,.csv,.tsv,.json,.html,.htm,.xml,.yaml,.yml,application/pdf,text/*,application/json,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type TextSource = "pdf" | "docx" | "html" | "text";

export function sourceOf(file: File): TextSource {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (/\.x?html?$/.test(name) || file.type === "text/html") return "html";
  return "text";
}

export class UnsupportedFileError extends Error {}

export async function extractText(
  file: File,
  { signal, onProgress }: { signal?: AbortSignal; onProgress?: (p: ConversionProgress) => void } = {},
): Promise<{ text: string; source: TextSource; pages?: number }> {
  const source = sourceOf(file);
  if (source === "pdf") {
    const { convertPdfToMarkdown } = await import("@/lib/pdf-to-markdown");
    const r = await convertPdfToMarkdown(file, { signal, onProgress });
    return { text: r.output, source, pages: r.pageCount };
  }
  if (source === "docx") {
    const { docxToMarkdown } = await import("@/lib/html-markdown");
    return { text: (await docxToMarkdown(file)).markdown, source };
  }
  if (source === "html") {
    const { htmlToMarkdown } = await import("@/lib/html-markdown");
    return { text: await htmlToMarkdown(await file.text(), { mainContentOnly: true }), source };
  }
  const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  // NUL bytes mean a binary file (an image, a zip) that is not text at all.
  if (head.includes(0)) throw new UnsupportedFileError("binary");
  return { text: await file.text(), source };
}
