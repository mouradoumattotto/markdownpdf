---
title: Convert a Research Paper PDF to Markdown (Full Guide)
description: Convert academic and research paper PDFs to clean Markdown - handle two-column layouts, equations, citations, and scans, then feed papers to AI or your notes.
date: 2026-06-23
author: Mourad Oumita
---

Academic PDFs are some of the hardest documents to convert cleanly. A journal article packs two columns, dense math, figures with captions, footnotes, and a long reference list onto every page — and PDF stores all of it as positioned glyphs, not structured text. Drop one into a generic extractor and you often get interleaved columns, broken equations, and references stitched into the middle of a paragraph.

Done right, though, a research paper becomes a clean Markdown file you can search, annotate, link in your notes, or hand to an AI without it choking on layout noise. This guide covers exactly where academic papers break during conversion and how to get usable output.

## Why convert a paper to Markdown at all?

If you only ever read papers on screen, the PDF is fine. Conversion earns its keep the moment you want to *do* something with the text:

- **Feed it to an AI tool.** ChatGPT, Claude, and NotebookLM all work better with clean Markdown than with raw PDF text, because headings and structure survive tokenization. This is the core reason [LLMs work better with Markdown than PDF](/blog/why-llms-prefer-markdown).
- **Take notes that link back.** In Obsidian, Logseq, or Zettlr you can quote a paper's Methods section as real text, link it to other notes, and find it later with full-text search — none of which works on a PDF attachment.
- **Build a literature review or RAG index.** Clean headings give you natural chunk boundaries when you're processing many papers at once.
- **Quote accurately.** Selectable, copy-pasteable text beats retyping from a PDF where copy often mangles ligatures and line breaks.

## The four things that break in academic PDFs

Generic PDF extraction handles a single-column memo well. Papers fail in specific, predictable ways. Knowing them tells you where to look when you check the output.

### 1. Two-column reading order

PDF text is positioned, not ordered. On a two-column page, a naive extractor reads left to right across the *whole* page, interleaving the two columns: line one of the left column, then line one of the right column, then line two of the left, and so on. The result is unreadable.

A good converter detects the column boundary and reads each column top to bottom before moving on. This is the single most important thing to verify in converted output — skim the first page and make sure sentences flow continuously instead of jumping between unrelated half-thoughts.

### 2. Equations and math

This is the genuine hard limit. PDF stores equations as positioned glyphs, sometimes as vector drawings or images, and there is no LaTeX source embedded to recover. So an inline term like *x²* may survive, but a displayed multi-line equation usually comes out as scrambled symbols, partial fragments, or nothing.

Set expectations accordingly: text-heavy papers (most of social science, biology, medicine, humanities) convert well. Math-heavy papers (theoretical physics, pure math) need you to re-key the important equations by hand, ideally as LaTeX between `$$` delimiters if your note app renders math. No browser or offline tool reliably reconstructs lost LaTeX.

### 3. References and citations

Reference lists are long, densely formatted, and full of line breaks, so they frequently extract as one run-on block or get spliced into nearby text. In-text citation markers like `[12]` or `(Smith et al., 2021)` usually survive as plain text but lose their link to the bibliography entry — Markdown has no native footnote-anchor system that a converter can reconstruct from a PDF.

The practical fix: once converted, move the whole reference list to the bottom under a `## References` heading and, if you only need a few sources, delete the rest. For AI workflows you can often drop the bibliography entirely — it rarely helps answers and burns tokens.

### 4. Figures, tables, and captions

Figures are images baked into the page, so the figure itself doesn't come across as Markdown — only its caption does, and captions can land detached from where they belong. Tables are their own challenge: PDF draws them as lines and positioned cells with no grid metadata, so reconstruction is hit or miss for complex multi-row-header tables. Our [guide to extracting tables from PDF to Markdown](/blog/extract-tables-from-pdf-to-markdown) covers the cleanup.

## The workflow, step by step

1. **Convert the PDF.** Open the [PDF to Markdown converter](/pdf-to-markdown) and drop in your paper. Everything runs locally in your browser — the file is never uploaded to a server, which matters when you're working with unpublished manuscripts, papers under review, or anything embargoed. Scanned pages are detected and OCR'd automatically.
2. **Check column order first.** Read the opening paragraphs. If text jumps between unrelated fragments, the columns were interleaved — flag that paper for closer cleanup or try converting a single-column version if the publisher offers one.
3. **Fix the structure.** Make sure the abstract, and each section (`## Introduction`, `## Methods`, `## Results`, `## Discussion`) is a real heading. This is what makes the file searchable and what AI tools key on.
4. **Handle the math.** Re-key any equations you actually need. Skip the ones you don't.
5. **Tidy the references.** Move them under one heading at the bottom, or delete them if you don't need citations.
6. **Save and use it.** Drop the `.md` into your vault, or paste it into your AI tool of choice.

## Scanned and older papers

Pre-2000 papers, photographed book chapters, and archived reports are often pure scans — images of pages with no text layer at all. Extraction recovers nothing from these because there is nothing to extract. They need OCR (optical character recognition) to turn the page images into real text first.

Academic scans are doubly hard: small fonts, two columns, equations, and sometimes faded print. OCR gets the running prose mostly right but struggles with symbols and tables, so always proofread. The converter runs OCR automatically when it detects a scan; the [guide to extracting text from a scanned PDF](/blog/extract-text-from-scanned-pdf) walks through improving accuracy.

## What converts well vs. what doesn't

| Paper type | Conversion quality | Notes |
|---|---|---|
| Single-column, text-heavy | Excellent | Reads almost cleanly |
| Two-column, prose-dominant | Good | Verify column order |
| Math-heavy (physics, pure math) | Mixed | Prose fine, equations need re-keying |
| Table-heavy (empirical results) | Mixed | Expect table cleanup |
| Born-digital from publisher | Good–Excellent | Real text layer to work with |
| Scanned / photographed | Fair | OCR required, proofread closely |

The pattern: the more a paper relies on *prose* to carry meaning, the better it converts. The more it relies on *layout* — equations, intricate tables, multi-panel figures — the more hands-on cleanup you'll do.

## FAQ

### Can I convert an arXiv paper to Markdown?

Yes. arXiv PDFs are born-digital with a real text layer, so the prose and headings convert well. The main thing to check is column order and any displayed equations, which you may need to re-key. If a paper offers an HTML version, that source is often even cleaner to work from than the PDF.

### Do equations survive the conversion?

Inline symbols often survive; displayed multi-line equations usually don't, because the PDF holds no LaTeX source to recover — only positioned glyphs. Plan to re-type the equations you actually need, ideally as LaTeX in `$$ ... $$` blocks if your editor renders math. Treat any tool promising perfect equation recovery from a PDF with suspicion.

### Is converting better than uploading the PDF straight to ChatGPT or Claude?

For a paper you'll query repeatedly, yes. Converting first lets you see and fix what the model will read, strip the reference list to save tokens, and keep real headings that help the model navigate sections. For a quick one-off question, uploading the PDF directly is fine. The same logic applies to [preparing PDFs for RAG pipelines](/blog/pdf-to-markdown-for-rag-pipelines).

### Will my paper be uploaded anywhere during conversion?

No. Conversion happens entirely in your browser and the file never leaves your device — which is the safe choice for unpublished manuscripts, papers under peer review, or anything under embargo.

### What about the references — can I keep them as proper citations?

Markdown can't reconstruct the link between an in-text `[12]` and its bibliography entry the way a PDF's internal anchors do. The references come across as text. Collect them under a `## References` heading at the bottom, keep the ones you cite, and delete the rest if you're feeding the paper to an AI tool.
