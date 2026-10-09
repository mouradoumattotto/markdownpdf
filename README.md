# MarkdownPDF

**[markdownpdf.app](https://markdownpdf.app)**: free PDF ↔ Markdown converter with OCR, running entirely in your browser. Your files are never uploaded. There is no signup and no watermark.

## What it does

- **[PDF to Markdown](https://markdownpdf.app/)**: rebuilds headings, lists, tables, bold/italic and multi-column layouts from the PDF text layer. Scanned pages fall back to OCR automatically.
- **[Markdown to PDF](https://markdownpdf.app/md-to-pdf)**: produces a real vector PDF with selectable text, tables, code blocks and links.
- **Other converters**: [DOCX to Markdown](https://markdownpdf.app/docx-to-markdown), [Markdown to DOCX](https://markdownpdf.app/markdown-to-docx), [HTML ↔ Markdown](https://markdownpdf.app/html-to-markdown), [PDF tables to CSV](https://markdownpdf.app/pdf-tables-to-csv), [PDF to Obsidian](https://markdownpdf.app/pdf-to-obsidian), [batch conversion](https://markdownpdf.app/batch-pdf-to-markdown).
- **OCR**: [OCR PDF](https://markdownpdf.app/ocr-pdf), [image to text](https://markdownpdf.app/image-to-text), [PDF to text](https://markdownpdf.app/pdf-to-text).
- **For AI workflows**: [token counter](https://markdownpdf.app/token-counter), [Markdown chunker](https://markdownpdf.app/markdown-chunker), [split PDF for AI](https://markdownpdf.app/split-pdf-for-ai).
- **Markdown utilities**: [table generator](https://markdownpdf.app/markdown-table-generator), [editor](https://markdownpdf.app/markdown-editor), [text diff](https://markdownpdf.app/text-diff).
- **PDF utilities**: [merge](https://markdownpdf.app/merge-pdf), [split](https://markdownpdf.app/split-pdf), [organize](https://markdownpdf.app/organize-pdf), [metadata](https://markdownpdf.app/pdf-metadata), [redact](https://markdownpdf.app/redact-pdf), [unlock](https://markdownpdf.app/unlock-pdf), [JPG to PDF](https://markdownpdf.app/jpg-to-pdf), [PNG to PDF](https://markdownpdf.app/png-to-pdf), [PDF to JPG](https://markdownpdf.app/pdf-to-jpg), [PDF to PNG](https://markdownpdf.app/pdf-to-png).
- **Other formats**: [EPUB to PDF](https://markdownpdf.app/epub-to-pdf), [PDF to EPUB](https://markdownpdf.app/pdf-to-epub), [HTML to PDF](https://markdownpdf.app/html-to-pdf).
- **Continue with**: every result can be sent straight into the next tool (PDF → Markdown → chunker, images → PDF → OCR…). The file is handed over through the browser's IndexedDB, never a server.

## Why client-side

All conversion happens in the browser tab, using pdf.js for the text layer, tesseract.js for OCR, and marked plus jsPDF for Markdown to PDF. The OCR engine and fonts are self-hosted, so the PDFs never touch a server. That makes the tools usable for confidential documents, and it means they keep working once the page has loaded.

## Stack

- Next.js (App Router, Turbopack) and Tailwind CSS 4. Every page is statically prerendered.
- The conversion engines live in `src/lib/` and are lazy-loaded on the client.
- Blog posts are Markdown files in `content/blog/`, with `title`, `description`, `date` and an optional `seoTitle` in the frontmatter. `src/lib/blog.ts` parses them at build time.
- JSON-LD (`WebApplication`, `HowTo`, `FAQPage`, `BlogPosting`), plus a sitemap and robots.txt generated from `src/app/`.

## Development

```bash
npm install
npm run dev        # dev server (copies OCR/pdf.js assets into public/ first)
npm run build      # production build
npm test           # unit tests (Vitest)
npm run test:e2e   # end-to-end tests (Playwright)
```

Canonical URLs come from `NEXT_PUBLIC_SITE_URL`, which defaults to `https://markdownpdf.app`.

## Feedback

Found a PDF that converts badly? [Open an issue](https://github.com/mouradoumattotto/markdownpdf/issues) and attach the file if you can share it, or use the [contact page](https://markdownpdf.app/contact).
