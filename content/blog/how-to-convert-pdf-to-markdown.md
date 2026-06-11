---
title: How to Convert PDF to Markdown (Step-by-Step Guide)
description: Learn how to convert PDF to Markdown with online tools, Pandoc, or by hand. Covers tables, scanned PDFs, OCR, and tips for getting clean, usable output.
date: 2026-05-18
---

PDFs are everywhere — reports, papers, manuals, contracts — but they are a frustrating format to work with when you actually need the text. Markdown, on the other hand, is plain text you can edit anywhere, version with Git, and feed into static site generators, note apps, or AI tools. Converting PDF to Markdown bridges that gap, and this guide walks through every practical way to do it.

## Why convert PDF to Markdown at all?

A PDF is essentially a set of drawing instructions: place this glyph at these coordinates, draw this line here. That makes PDFs great for faithful printing and terrible for reuse. Converting to Markdown gives you:

- **Editable text** you can rework in any editor, on any platform
- **Version control** — Markdown diffs cleanly in Git; PDFs do not
- **Portability** — paste the content into wikis, READMEs, Notion, Obsidian, or a CMS
- **AI-friendliness** — language models and search indexes handle plain text far better than binary PDFs
- **Smaller files** — text is a fraction of the size of a formatted document

The catch is that PDF stores *appearance*, not *structure*. There is no "this is a heading" marker in most PDFs — just bigger, bolder text. Every conversion method has to reconstruct that structure, which is where the differences between approaches show up.

## Method 1: Use a browser-based converter (fastest)

The quickest route is an online converter. A tool like our [PDF to Markdown converter](/pdf-to-markdown) lets you drop in a file and get Markdown back in seconds, with no software to install.

One thing worth checking with any online tool: where does your file go? Many "free" converters upload your document to a server, which is a problem for contracts, medical records, or anything confidential. MarkdownPDF runs the entire conversion locally in your browser — the file never leaves your machine — so you can convert sensitive documents without worrying about who else might see them.

A typical workflow looks like this:

1. Open the converter in your browser.
2. Drag and drop your PDF (or click to select it).
3. Wait for the conversion — text-based PDFs take seconds; scanned PDFs go through OCR, which takes a bit longer.
4. Review the Markdown preview, then copy it or download the `.md` file.
5. Clean up anything the converter could not infer (more on that below).

This method is ideal when you need results now, you are not on your own machine, or you simply do not want to maintain a local toolchain.

## Method 2: Pandoc (best for automation)

[Pandoc](https://pandoc.org) is the swiss-army knife of document conversion, and it is the right choice when you need to convert many files or script the process. Note that Pandoc cannot read PDFs directly — you typically pair it with another tool, or extract text first. A common pipeline uses `pdftotext` (from Poppler) and then cleans up:

```bash
# Extract raw text, preserving layout
pdftotext -layout document.pdf document.txt

# Then convert/clean with pandoc
pandoc document.txt -f markdown -t gfm -o document.md
```

The honest truth: Pandoc shines going *into* PDF (from Markdown, via LaTeX), but going *out of* PDF it inherits all the limitations of text extraction. Headings, lists, and tables usually need manual reconstruction. It is still worth it for batch jobs, because you can write one cleanup script and apply it to hundreds of files.

## Method 3: Manual conversion (small documents)

For a one-page document, the simplest method is sometimes copy-paste:

1. Open the PDF in any viewer and copy the text.
2. Paste it into a text editor.
3. Add Markdown syntax by hand: `#` for headings, `-` for bullets, `**bold**` where needed.
4. Rebuild any tables using pipe syntax.

This gives you perfect output, because a human is doing the structural interpretation. It just does not scale past a few pages.

## Comparing the methods

| Method | Speed | Accuracy | Handles scans (OCR) | Best for |
|---|---|---|---|---|
| Browser-based converter | Seconds | Good | Often yes | Quick, one-off conversions |
| Pandoc + pdftotext | Fast, scriptable | Fair, needs cleanup | No (separate OCR step) | Batch jobs, automation |
| Manual copy-paste | Slow | Excellent | No | Short, high-stakes documents |

## The hard parts: what trips up every converter

### Multi-column layouts

PDF text is positioned, not ordered. A two-column academic paper can come out interleaved — line one of column A, line one of column B — producing nonsense. Good converters detect columns; even so, always read the output of multi-column documents carefully.

### Tables

Tables in PDFs are usually just text plus drawn lines, with no underlying table structure. Converters have to guess cell boundaries from positioning. Simple grids convert well; merged cells, nested headers, and tables that span pages frequently break. Expect to rebuild complex tables by hand using Markdown's pipe syntax.

### Scanned PDFs

If your PDF is a scan, there is no text in it at all — just pictures of text. You need **OCR (optical character recognition)** to read it. The [PDF to Markdown tool](/pdf-to-markdown) includes OCR support for exactly this case. Quick test: try to select text in your PDF viewer. If you cannot, it is a scan and OCR is required. (Our [OCR guide](/blog/ocr-pdf-to-text-guide) covers this in depth.)

### Headers, footers, and page numbers

Repeated page furniture — "Confidential", page numbers, running titles — gets extracted along with the body text and ends up scattered through your Markdown. A find-and-replace pass usually clears these quickly.

### Math, footnotes, and special characters

Equations rarely survive extraction intact, ligatures (fi, fl) sometimes come through as odd characters, and footnotes lose their anchors. Budget cleanup time for academic material.

## Tips for clean Markdown output

- **Start from the best source.** If you have the original Word or LaTeX file, convert from that instead — you will keep real structure.
- **Skim before you ship.** Check heading levels first; converters infer them from font size and get it wrong more often than anything else.
- **Fix headings top-down.** Ensure one `#` H1, then consistent `##`/`###` nesting.
- **Rejoin broken lines.** PDFs hard-wrap lines; many converters preserve those breaks mid-paragraph. A regex that joins lines not ending in punctuation helps.
- **Validate tables.** Render the Markdown in a previewer and confirm every table displays correctly.
- **Strip artifacts.** Search for page numbers, repeated headers, and stray hyphenation left over from line breaks.
- **Keep the PDF.** Markdown is your working copy; the PDF remains the formatted reference.

## Which method should you choose?

For most people, most of the time: use a browser-based converter and spend five minutes cleaning the output. It is the best effort-to-result ratio, and with a local-processing tool like MarkdownPDF there is no privacy trade-off. Reach for Pandoc when you are converting in bulk or wiring conversion into a pipeline, and convert by hand only when the document is short and accuracy matters more than time.

And if you later need to go the other way — turning your polished Markdown back into a shareable document — the companion [Markdown to PDF converter](/markdown-to-pdf) handles that side of the round trip.

## FAQ

### Can I convert a scanned PDF to Markdown?

Yes, but it requires OCR. A scanned PDF contains images rather than text, so the converter must recognize characters optically before it can produce Markdown. Tools with built-in OCR, including our [PDF to Markdown converter](/pdf-to-markdown), handle this automatically; expect to proofread the result, since OCR accuracy depends on scan quality.

### Will tables convert correctly?

Simple tables with clear rows and columns usually convert well to Markdown pipe tables. Complex tables — merged cells, multi-row headers, tables spanning several pages — often need manual fixing, because PDF stores no actual table structure for the converter to read.

### Is it safe to convert confidential PDFs online?

It depends on the tool. Many online converters upload your file to their servers. MarkdownPDF performs the conversion entirely in your browser, so the document never leaves your device — making it safe for contracts, financial documents, and other sensitive files.

### Why does my converted Markdown have weird line breaks?

PDFs store text line by line as it appears on the page, so extracted paragraphs often keep their hard wraps. Most editors can fix this with a find-and-replace, or you can use a "join lines" command to restore flowing paragraphs.
