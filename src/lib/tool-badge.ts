/**
 * The coloured tile shown beside a tool everywhere. Kept apart from ToolSeo
 * (which reads blog files from disk) so client components can use it too.
 */
import type { CategoryId, Tool } from "@/lib/tools";

/** Short mono glyph on each card tile, as in the "Hub rouge" design. */
const GLYPHS: Record<string, string> = {
  "pdf-to-markdown": "MD",
  "markdown-to-pdf": "PDF",
  "split-pdf-for-ai": "AI",
  "pdf-metadata": "META",
  "pdf-to-text": "TXT",
  "ocr-pdf": "OCR",
  "image-to-text": "IMG",
  "docx-to-markdown": "DOC",
  "html-to-markdown": "HTML",
  "markdown-to-html": "</>",
  "split-pdf": "SPLT",
  "merge-pdf": "+",
  "pdf-to-jpg": "JPG",
  "jpg-to-pdf": "PDF",
  "organize-pdf": "ORG",
  "markdown-to-docx": "DOCX",
  "markdown-table-generator": "TBL",
  "token-counter": "TOK",
  "markdown-chunker": "RAG",
  "text-diff": "DIFF",
  "markdown-editor": "EDIT",
  "pdf-tables-to-csv": "CSV",
  "batch-pdf-to-markdown": "×N",
  "pdf-to-obsidian": "OB",
  "pdf-to-png": "PNG",
  "png-to-pdf": "PDF",
  "unlock-pdf": "OPEN",
  "redact-pdf": "RDCT",
  "epub-to-pdf": "PDF",
  "pdf-to-epub": "EPUB",
  "html-to-pdf": "PDF",
};

/** Tile colour per primary category: the brand red for PDF tools, then fixed hues. */
export const TILE: Record<CategoryId, string> = {
  pdf: "oklch(0.58 0.21 27)",
  ocr: "oklch(0.6 0.15 150)",
  markdown: "oklch(0.55 0.17 262)",
  ai: "oklch(0.6 0.13 200)",
};

/** The coloured tile shown beside a tool everywhere: cards, menu, related links. */
export function toolBadge(tool: Tool): { glyph: string; tile: string } {
  return { glyph: GLYPHS[tool.slug] ?? tool.output[0].slice(0, 3).toUpperCase(), tile: TILE[tool.categories[0]] };
}

