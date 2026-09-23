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
    blurb: "Convert, split, merge and clean up PDFs — processed in your browser, never uploaded.",
    updated: "2026-09-23",
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
    blurb: "Convert to and from Markdown — Word, HTML and PDF — and preview it, in your browser.",
    updated: "2026-09-23",
  },
  {
    id: "ai",
    path: "/ai-document-tools",
    name: "AI document tools",
    blurb: "Prepare documents for ChatGPT, Claude, NotebookLM and RAG pipelines: clean text, sensible splits, token counts.",
    updated: "2026-09-23",
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
    guides: ["markdown-to-pdf-mermaid-math", "convert-markdown-to-pdf", "markdown-cheat-sheet", "markdown-resume-to-pdf", "convert-github-readme-to-pdf"],
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
    guides: ["how-to-remove-pdf-metadata"],
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
    guides: ["ocr-vs-text-extraction", "extract-text-from-scanned-pdf", "how-to-convert-pdf-to-markdown", "clean-up-markdown-after-pdf-conversion"],
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
    guides: ["ocr-vs-text-extraction", "extract-text-from-scanned-pdf", "how-to-convert-pdf-to-markdown"],
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
    guides: ["ocr-vs-text-extraction", "extract-text-from-scanned-pdf"],
    updated: "2026-09-22",
    features: [
      "OCR for photos, screenshots and scans in 7 languages",
      "Paste an image straight from the clipboard",
      "Up to 20 images in one go",
      "Runs entirely in the browser — the image is never uploaded",
    ],
  },
  {
    slug: "docx-to-markdown",
    path: "/docx-to-markdown",
    name: "Word to Markdown",
    tagline: "Turn a .docx into clean Markdown — headings, lists, tables, images.",
    categories: ["markdown"],
    input: ["Word (.docx)"],
    output: ["Markdown (.md)", "ZIP"],
    related: ["html-to-markdown", "pdf-to-markdown", "markdown-to-pdf", "markdown-to-html"],
    guides: ["convert-word-to-markdown", "pdf-vs-word-vs-markdown", "markdown-cheat-sheet", "why-llms-prefer-markdown"],
    updated: "2026-09-23",
    features: [
      "Converts Word .docx headings, lists, tables, links and emphasis to Markdown",
      "Images left out, saved to a folder in a ZIP, or embedded",
      "Editable result with copy and download",
      "Runs entirely in the browser — the document is never uploaded",
    ],
  },
  {
    slug: "html-to-markdown",
    path: "/html-to-markdown",
    name: "HTML to Markdown",
    tagline: "Paste HTML, a web page or a Google Doc — get Markdown.",
    categories: ["markdown"],
    input: ["HTML", "Clipboard"],
    output: ["Markdown (.md)"],
    related: ["markdown-to-html", "docx-to-markdown", "pdf-to-markdown", "markdown-to-pdf"],
    guides: ["markdown-vs-html", "markdown-cheat-sheet", "why-llms-prefer-markdown", "pdf-to-markdown-for-rag-pipelines"],
    updated: "2026-09-23",
    features: [
      "Converts HTML code or formatted text pasted from a web page, Word or Google Docs",
      "Strips menus, headers and footers to keep the main content",
      "GitHub-flavored tables, task lists, strikethrough and fenced code with language",
      "Live conversion in the browser — nothing is uploaded",
    ],
  },
  {
    slug: "markdown-to-html",
    path: "/markdown-to-html",
    name: "Markdown to HTML",
    tagline: "Clean, sanitised HTML from Markdown, with a live preview.",
    categories: ["markdown"],
    input: ["Markdown (.md)"],
    output: ["HTML"],
    related: ["html-to-markdown", "markdown-to-pdf", "docx-to-markdown", "pdf-to-markdown"],
    guides: ["markdown-vs-html", "markdown-cheat-sheet", "what-is-markdown-complete-guide", "markdown-frontmatter-guide"],
    updated: "2026-09-23",
    features: [
      "GitHub-flavored Markdown: tables, task lists, strikethrough, fenced code",
      "HTML fragment or complete standalone page",
      "Output sanitised against script injection",
      "Live preview, runs entirely in the browser",
    ],
  },
  {
    slug: "split-pdf",
    path: "/split-pdf",
    name: "Split PDF",
    tagline: "Split by page ranges, every N pages, or extract the pages you need.",
    categories: ["pdf"],
    input: ["PDF"],
    output: ["PDF", "ZIP"],
    related: ["merge-pdf", "split-pdf-for-ai", "pdf-metadata", "pdf-to-markdown"],
    guides: ["how-to-remove-pdf-metadata", "ai-file-upload-limits"],
    updated: "2026-09-23",
    features: [
      "Split by custom page ranges, every N pages, or into single pages",
      "Extract selected pages into one new PDF, in any order",
      "Pages are copied untouched — text stays selectable, quality unchanged",
      "Runs entirely in the browser — the file is never uploaded",
    ],
  },
  {
    slug: "merge-pdf",
    path: "/merge-pdf",
    name: "Merge PDF",
    tagline: "Combine PDFs into one, in the order you choose.",
    categories: ["pdf"],
    input: ["PDF"],
    output: ["PDF"],
    related: ["split-pdf", "pdf-metadata", "ocr-pdf", "markdown-to-pdf"],
    guides: ["how-to-remove-pdf-metadata"],
    updated: "2026-09-23",
    features: [
      "Merges up to 50 PDFs into one",
      "Reorder by drag and drop, arrow buttons or file name",
      "Pages are copied untouched — text stays selectable, quality unchanged",
      "Runs entirely in the browser — files are never uploaded",
    ],
  },
  {
    slug: "pdf-to-jpg",
    path: "/pdf-to-jpg",
    name: "PDF to JPG",
    tagline: "Every page of a PDF as a JPG or PNG image, at the resolution you choose.",
    categories: ["pdf"],
    input: ["PDF"],
    output: ["JPG", "PNG", "ZIP"],
    related: ["jpg-to-pdf", "split-pdf", "pdf-to-text", "ocr-pdf"],
    guides: [],
    updated: "2026-09-23",
    features: [
      "Converts PDF pages to JPG or PNG at 72, 150 or 300 dpi",
      "All pages or a selection, downloaded one by one or as a ZIP",
      "Previews each page as it is rendered",
      "Runs entirely in the browser — the PDF is never uploaded",
    ],
  },
  {
    slug: "jpg-to-pdf",
    path: "/jpg-to-pdf",
    name: "JPG to PDF",
    tagline: "Turn photos, scans and screenshots into one PDF, in your order.",
    categories: ["pdf"],
    input: ["JPG", "PNG", "WebP", "GIF", "BMP"],
    output: ["PDF"],
    related: ["pdf-to-jpg", "merge-pdf", "ocr-pdf", "image-to-text"],
    guides: [],
    updated: "2026-09-23",
    features: [
      "Combines up to 100 images into one PDF, one image per page",
      "A4, US Letter or page-per-image sizes, with automatic orientation",
      "JPEGs embedded without re-compression; phone photos turned upright",
      "Runs entirely in the browser — images are never uploaded",
    ],
  },
  {
    slug: "organize-pdf",
    path: "/organize-pdf",
    name: "Organize PDF",
    tagline: "Reorder, rotate, duplicate and delete pages, with a preview of each.",
    categories: ["pdf"],
    input: ["PDF"],
    output: ["PDF"],
    related: ["split-pdf", "merge-pdf", "pdf-to-jpg", "pdf-metadata"],
    guides: [],
    updated: "2026-09-23",
    features: [
      "Page thumbnails with drag-and-drop reordering",
      "Rotate, duplicate or delete individual pages, or rotate all",
      "Pages are copied untouched — text stays selectable, quality unchanged",
      "Runs entirely in the browser — the PDF is never uploaded",
    ],
  },
  {
    slug: "markdown-to-docx",
    path: "/markdown-to-docx",
    name: "Markdown to Word",
    tagline: "A real Word document from Markdown — headings, lists, tables, links.",
    categories: ["markdown"],
    input: ["Markdown (.md)"],
    output: ["Word (.docx)"],
    related: ["docx-to-markdown", "markdown-to-pdf", "markdown-to-html", "markdown-table-generator"],
    guides: ["pdf-vs-word-vs-markdown", "convert-word-to-markdown", "markdown-cheat-sheet"],
    updated: "2026-09-23",
    features: [
      "Headings become Word heading styles, lists use Word numbering",
      "Tables with a repeating header row, links, code, task lists",
      "Opens in Word, Google Docs, LibreOffice and Pages",
      "Runs entirely in the browser — nothing is uploaded",
    ],
  },
  {
    slug: "markdown-table-generator",
    path: "/markdown-table-generator",
    name: "Markdown Table Generator",
    tagline: "Build a Markdown table in a grid, or convert CSV and spreadsheet cells.",
    categories: ["markdown"],
    input: ["CSV", "TSV", "Spreadsheet cells", "Markdown table"],
    output: ["Markdown (.md)", "CSV"],
    related: ["markdown-to-html", "markdown-to-pdf", "markdown-to-docx", "html-to-markdown"],
    guides: ["markdown-cheat-sheet", "extract-tables-from-pdf-to-markdown"],
    updated: "2026-09-23",
    features: [
      "Edit tables in a spreadsheet-like grid with per-column alignment",
      "Import CSV, TSV, cells pasted from Excel or Google Sheets, or an existing Markdown table",
      "Pipes and line breaks escaped; wide characters aligned",
      "Runs entirely in the browser — nothing is uploaded",
    ],
  },
  {
    slug: "token-counter",
    path: "/token-counter",
    name: "Token Counter",
    tagline: "Exact OpenAI token counts for text, PDFs and Word files.",
    categories: ["ai"],
    input: ["Text", "PDF", "Word (.docx)", "Markdown", "HTML"],
    output: ["Token count"],
    related: ["markdown-chunker", "split-pdf-for-ai", "pdf-to-markdown", "docx-to-markdown"],
    guides: ["ai-file-upload-limits", "why-llms-prefer-markdown", "convert-pdf-to-markdown-for-chatgpt"],
    updated: "2026-09-23",
    features: [
      "Exact token counts with OpenAI's o200k_base and cl100k_base tokenizers",
      "Clearly labelled estimate range for Claude, Gemini and other models",
      "Counts PDFs (with OCR), Word documents and web pages, not just pasted text",
      "Runs entirely in the browser — the text is never uploaded",
    ],
  },
  {
    slug: "markdown-chunker",
    path: "/markdown-chunker",
    name: "Markdown Chunker for RAG",
    tagline: "Split documents into token-sized chunks that respect headings.",
    categories: ["ai", "markdown"],
    input: ["Markdown", "Text", "PDF", "Word (.docx)"],
    output: ["JSONL", "Markdown (.md)", "ZIP"],
    related: ["token-counter", "pdf-to-markdown", "split-pdf-for-ai", "html-to-markdown"],
    guides: ["pdf-to-markdown-for-rag-pipelines", "why-llms-prefer-markdown", "ai-file-upload-limits"],
    updated: "2026-09-23",
    features: [
      "Splits at headings, then paragraphs, then sentences — never inside code blocks or tables",
      "Chunk size and overlap in exact OpenAI tokens",
      "Optional heading path repeated at the top of every chunk",
      "Exports JSONL, one Markdown file, or a ZIP of chunks — all in the browser",
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
