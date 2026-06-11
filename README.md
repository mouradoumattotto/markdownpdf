# MarkdownPDF

Free, privacy-first web converter between PDF and Markdown. All conversion runs client-side in the browser — files are never uploaded.

## Tools

- **/pdf-to-markdown** — extracts the PDF text layer with `pdfjs-dist` and rebuilds structure (headings, lists, bold/italic, paragraphs) as Markdown. Pages without a text layer (scanned PDFs) automatically fall back to OCR via `tesseract.js`.
- **/markdown-to-pdf** — parses Markdown with `marked` and lays it out as a real vector PDF (selectable text) with `jspdf`: headings, lists, tables, code blocks, blockquotes, links.

## Stack

- Next.js (App Router, Turbopack) + Tailwind CSS 4 — every page is statically prerendered.
- Conversion engines: `src/lib/pdf-to-markdown.ts` and `src/lib/markdown-to-pdf.ts` (client-side, lazy-loaded).
- Blog: markdown files in `content/blog/*.md` with simple frontmatter (`title`, `description`, `date`), parsed at build time by `src/lib/blog.ts`.

## SEO / AdSense

- Per-tool landing pages with rich content, FAQ, and JSON-LD (`WebApplication`, `HowTo`, `FAQPage`, `BlogPosting`).
- `sitemap.xml` and `robots.txt` generated from `src/app/sitemap.ts` / `robots.ts`.
- Required AdSense pages: `/privacy-policy`, `/terms`, `/about`, `/contact`.
- Canonical URLs derive from `NEXT_PUBLIC_SITE_URL` (defaults to `https://markdownpdf.app`) — set it in production.

### Activating AdSense (after approval)

1. Set `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX` in the Vercel production environment and redeploy. This automatically:
   - injects the AdSense script with **Consent Mode v2** (consent denied by default in EEA/UK/CH, granted elsewhere) via `src/components/GoogleAdSense.tsx`;
   - serves `/ads.txt` with the publisher ID.
2. In the AdSense dashboard, enable Google's **certified CMP** (Privacy & messaging → create a GDPR consent message). Google's script displays it automatically in the EEA — no custom banner needed.
3. Add ad units where desired (Auto ads work without code changes).

## Development

```bash
npm run dev    # dev server
npm run build  # production build (all pages static)
npm start      # serve the production build
```

## Adding a blog post

Create `content/blog/my-post.md`:

```markdown
---
title: My Post Title
description: Meta description between 140 and 160 characters.
date: 2026-06-10
---

Article body in markdown…
```

It is picked up automatically by the blog index, the article route, and the sitemap.
