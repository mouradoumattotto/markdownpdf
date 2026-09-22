/**
 * Single source of truth for every tool and category hub.
 *
 * Navigation, hub grids, "Related tools", JSON-LD (WebApplication +
 * BreadcrumbList), the sitemap and llms.txt are all generated from this file.
 * What is NOT generated: each tool page's title, description, H1 and body copy
 * — those are written by hand in the page itself, because generating them is
 * exactly how sites end up with hundreds of interchangeable thin pages.
 *
 * Add a tool here only when its page is live. An entry pointing at a route that
 * does not exist would put a 404 in the nav, the hubs and the sitemap at once.
 */

export type CategoryId = "pdf" | "ocr" | "markdown" | "ai";

export interface Category {
  id: CategoryId;
  path: string;
  name: string;
  /** One sentence, shown on cards and used as the hub's lead. */
  blurb: string;
  /** Last meaningful edit of the hub page itself (sitemap lastmod). */
  updated: string;
}

export interface Tool {
  slug: string;
  path: string;
  name: string;
  /** Short card copy — what it does, in one line. */
  tagline: string;
  categories: CategoryId[];
  input: string[];
  output: string[];
  /** Slugs of other tools, most relevant first. */
  related: string[];
  /** Blog post slugs that go deeper on this tool's job. */
  guides: string[];
  /** Last meaningful edit of the page (sitemap lastmod). */
  updated: string;
  /** Features for the WebApplication JSON-LD. Must be true of the page. */
  features: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "pdf",
    path: "/pdf-tools",
    name: "PDF tools",
    blurb: "Convert, split, merge, organize and clean up PDFs — processed in your browser, never uploaded.",
    updated: "2026-09-18",
  },
  {
    id: "ocr",
    path: "/ocr-tools",
    name: "OCR tools",
    blurb: "Turn scans and images into real text in seven languages, with OCR that runs on your own device.",
    updated: "2026-09-18",
  },
  {
    id: "markdown",
    path: "/markdown-tools",
    name: "Markdown tools",
    blurb: "Convert to and from Markdown, preview it, and export it — Word, HTML, PDF and tables.",
    updated: "2026-09-18",
  },
  {
    id: "ai",
    path: "/ai-document-tools",
    name: "AI document tools",
    blurb: "Prepare documents for ChatGPT, Claude, NotebookLM and RAG pipelines: clean text, sensible splits, token counts.",
    updated: "2026-09-18",
  },
];

export const TOOLS: Tool[] = [
  {
    slug: "pdf-to-markdown",
    path: "/",
    name: "PDF to Markdown",
    tagline: "Clean Markdown from any PDF, with OCR for scanned pages.",
    categories: ["pdf", "markdown", "ocr", "ai"],
    input: ["PDF"],
    output: ["Markdown (.md)"],
    related: ["pdf-to-text", "markdown-to-pdf", "split-pdf-for-ai", "ocr-pdf", "docx-to-markdown"],
    guides: [
      "how-to-convert-pdf-to-markdown",
      "extract-text-from-scanned-pdf",
      "pdf-to-markdown-for-notebooklm",
      "convert-pdf-to-markdown-for-chatgpt",
    ],
    updated: "2026-09-18",
    features: [
      "PDF text extraction with structure detection (headings, lists, emphasis)",
      "Automatic OCR for scanned pages in 7 languages",
      "Runs entirely in the browser — files are never uploaded",
      "Cancel at any time; progress and time estimate for long documents",
    ],
  },
  {
    slug: "markdown-to-pdf",
    path: "/markdown-to-pdf",
    name: "Markdown to PDF",
    tagline: "A clean PDF from Markdown — with diagrams, math and images.",
    categories: ["markdown", "pdf"],
    input: ["Markdown (.md)"],
    output: ["PDF"],
    related: ["pdf-to-markdown", "markdown-to-html", "markdown-to-docx", "markdown-table-generator"],
    guides: ["convert-markdown-to-pdf", "markdown-cheat-sheet", "markdown-resume-to-pdf", "convert-github-readme-to-pdf"],
    updated: "2026-09-18",
    features: [
      "Markdown editor with live preview",
      "Vector PDF output with selectable, searchable text",
      "Mermaid diagrams and LaTeX math",
      "Images from the web or attached local files",
      "Syntax highlighting, tables, task lists",
      "Full-fidelity export for every language through the browser's print engine",
    ],
  },
  {
    slug: "split-pdf-for-ai",
    path: "/split-pdf-for-ai",
    name: "Split PDF for AI",
    tagline: "Cut a PDF into parts NotebookLM, ChatGPT or Claude will accept.",
    categories: ["pdf", "ai"],
    input: ["PDF"],
    output: ["PDF parts", "ZIP"],
    related: ["pdf-to-markdown", "pdf-to-text", "split-pdf", "merge-pdf", "markdown-to-pdf"],
    guides: [
      "ai-file-upload-limits",
      "pdf-to-markdown-for-notebooklm",
      "convert-pdf-to-markdown-for-chatgpt",
      "convert-pdf-to-markdown-for-claude",
    ],
    updated: "2026-09-22",
    features: [
      "Splits a PDF to fit NotebookLM, ChatGPT, Claude and Gemini upload limits",
      "Splits at chapter boundaries using the PDF's bookmarks",
      "Counts words per page and flags pages with no text layer",
      "Runs entirely in the browser — the file is never uploaded",
    ],
  },
  {
    slug: "pdf-metadata",
    path: "/pdf-metadata",
    name: "PDF Metadata Viewer & Remover",
    tagline: "See what a PDF reveals about you, then remove it for good.",
    categories: ["pdf"],
    input: ["PDF"],
    output: ["PDF"],
    related: ["split-pdf-for-ai", "pdf-to-markdown", "markdown-to-pdf", "pdf-to-text"],
    guides: [],
    updated: "2026-09-22",
    features: [
      "Shows the Info dictionary, the XMP packet, custom fields and dates",
      "Removes metadata from the file itself, not just from the viewer",
      "Edit any field and save a corrected copy",
      "Runs entirely in the browser — the file is never uploaded",
    ],
  },
  {
    slug: "pdf-to-text",
    path: "/pdf-to-text",
    name: "PDF to Text",
    tagline: "Plain text from any PDF, with OCR for scanned pages.",
    categories: ["pdf", "ocr"],
    input: ["PDF"],
    output: ["Text (.txt)"],
    related: ["pdf-to-markdown", "image-to-text", "ocr-pdf", "split-pdf-for-ai", "pdf-metadata"],
    guides: ["extract-text-from-scanned-pdf", "how-to-convert-pdf-to-markdown", "clean-up-markdown-after-pdf-conversion"],
    updated: "2026-09-22",
    features: [
      "Extracts the text layer of a PDF, page by page",
      "Automatic OCR for scanned pages in 7 languages",
      "Joins wrapped lines and de-hyphenates split words",
      "Runs entirely in the browser — the file is never uploaded",
    ],
  },
  {
    slug: "ocr-pdf",
    path: "/ocr-pdf",
    name: "OCR a PDF",
    tagline: "Make a scanned PDF searchable, without changing how it looks.",
    categories: ["ocr", "pdf"],
    input: ["PDF"],
    output: ["Searchable PDF"],
    related: ["image-to-text", "pdf-to-text", "pdf-to-markdown", "split-pdf-for-ai"],
    guides: ["extract-text-from-scanned-pdf", "how-to-convert-pdf-to-markdown"],
    updated: "2026-09-22",
    features: [
      "Adds an invisible OCR text layer to scanned pages",
      "Copies pages that already contain text untouched",
      "Seven OCR languages, including Arabic",
      "Runs entirely in the browser — the file is never uploaded",
    ],
  },
  {
    slug: "image-to-text",
    path: "/image-to-text",
    name: "Image to Text",
    tagline: "Read the text in a photo or screenshot, in seven languages.",
    categories: ["ocr"],
    input: ["PNG", "JPEG", "WebP", "GIF", "BMP", "TIFF"],
    output: ["Text (.txt)"],
    related: ["ocr-pdf", "pdf-to-text", "pdf-to-markdown"],
    guides: ["extract-text-from-scanned-pdf"],
    updated: "2026-09-22",
    features: [
      "OCR for photos, screenshots and scans in 7 languages",
      "Paste an image straight from the clipboard",
      "Up to 20 images in one go",
      "Runs entirely in the browser — the image is never uploaded",
    ],
  },
];

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function toolsIn(category: CategoryId): Tool[] {
  return TOOLS.filter((t) => t.categories.includes(category));
}

export function getCategory(id: CategoryId): Category {
  const c = CATEGORIES.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown category ${id}`);
  return c;
}

/**
 * A hub page with fewer than three tools is a thin page wrapped around a
 * link list. Hubs are only rendered, linked and listed in the sitemap once
 * their category has at least this many live tools.
 */
export const MIN_TOOLS_PER_HUB = 3;

export function liveCategories(): Category[] {
  return CATEGORIES.filter((c) => toolsIn(c.id).length >= MIN_TOOLS_PER_HUB);
}

/** Related tools for a slug, skipping any that are not live yet. */
export function relatedTools(slug: string, limit = 6): Tool[] {
  const tool = getTool(slug);
  if (!tool) return [];
  return tool.related.map(getTool).filter((t): t is Tool => Boolean(t)).slice(0, limit);
}
