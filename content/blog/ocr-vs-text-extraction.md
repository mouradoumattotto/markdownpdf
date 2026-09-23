---
title: "OCR vs Text Extraction: Which One Does Your PDF Need?"
seoTitle: OCR vs PDF Text Extraction
description: Some PDFs contain text, others only pictures of text. How to tell them apart in ten seconds, and which tool each one needs.
date: 2026-09-23
updated: 2026-09-23
author: Mourad Oumita
---

Two PDFs can look identical on screen and be completely different inside. One contains text: characters, with positions and fonts, that software can read directly. The other contains a photograph of a page — pixels that happen to form letters. Getting text out of the first is *extraction*. Getting text out of the second requires *OCR*, optical character recognition. Using the wrong approach is the most common reason a PDF converter "doesn't work".

## The difference, in one paragraph each

**Text extraction** reads the characters the PDF already stores. It is instant, exact — every character comes out as it was typed — and works in any language the fonts support. PDFs exported from Word, Google Docs, LaTeX, a browser or accounting software are like this.

**OCR** looks at an image of a page and guesses which characters it shows, using a model trained on printed text. It is slower (seconds per page instead of milliseconds), and its output is a best guess: usually very good on a clean scan, noticeably worse on a phone photo of a crumpled receipt. Scanned documents, faxes, and PDFs made from photos need it.

## How to tell which one you have

Three checks, from quickest to most thorough:

1. **Try to select text.** Open the PDF and drag across a sentence. If the words highlight one by one, there is a text layer. If you get a single blue rectangle — or nothing — the page is an image.
2. **Search for a word you can see.** Press Ctrl+F (Cmd+F on a Mac) and type a word from the page. No match means no text layer, or one that does not match the page.
3. **Copy and paste a paragraph.** Occasionally a PDF has text that is garbled when copied — a font that maps characters to the wrong codes. It looks fine and searches badly. For extraction purposes, treat it like a scan.

Many real documents are **mixed**: a typed report with a scanned signature page, or a contract whose annexes were scanned and appended. That is why good converters decide page by page rather than once per file.

## Why it matters for what you do next

**For AI tools.** ChatGPT, Claude and NotebookLM read the text layer of a PDF well. What they do with scanned pages varies by tool and plan, and when a scan is not read, the answer you get is often confidently incomplete rather than an error. Extracting or OCR-ing the text yourself removes the guesswork — see [AI file upload limits](/blog/ai-file-upload-limits) for how each tool handles large files.

**For search.** A folder of scanned PDFs is invisible to your computer's search, to your document-management system and to Ctrl+F. Adding an OCR text layer fixes that without changing how the pages look.

**For accuracy.** Extracted text is exact. OCR text needs proofreading where it matters — and numbers matter most, because a spellchecker will not flag a 3 read as an 8.

## What to use for each case

| You have… | You want… | Use |
|---|---|---|
| A typed PDF | The text, with headings and lists | [PDF to Markdown](/) |
| A typed PDF | Just the words | [PDF to Text](/pdf-to-text) |
| A scanned PDF | The text | [PDF to Text](/pdf-to-text) or [PDF to Markdown](/) — both OCR scanned pages automatically |
| A scanned PDF | The same PDF, but searchable | [OCR a PDF](/ocr-pdf) |
| A photo or screenshot | The text | [Image to Text](/image-to-text) |

All of these run in your browser, OCR included: the recognition engine and its language data are downloaded from this site, and the document itself stays on your device.

## What a "searchable PDF" actually is

When you OCR a PDF and keep it as a PDF, the page image is left exactly as it was, and an invisible layer of text is placed on top of it, word by word, at the positions where the OCR found them. You see the scan; your cursor, your search box and any AI tool see the text.

Two consequences:

- The document looks identical, so nothing is lost if the OCR made mistakes — the image is still the reference.
- Copying text from it gives you the OCR's reading, errors included.

A well-made searchable PDF only adds the layer to pages that need it. Running OCR over pages that already contain real text replaces exact text with a guess, which is why [OCR a PDF](/ocr-pdf) copies those pages untouched.

## Getting better OCR results

OCR quality is decided mostly by the input, not the software:

- **Resolution.** Around 300 dpi is the sweet spot for normal text. Below 200 dpi, small print starts to fail.
- **Straight and flat.** Skewed or curved lines (a thick book photographed open) cost accuracy.
- **Contrast.** Dark text on a light, even background. Shadows and coloured paper hurt.
- **The right language.** OCR engines use a language model to choose between similar shapes. Reading French with the English model loses accents; reading Arabic with it produces nothing useful.

The full list, including how to spot typical OCR errors, is in the [guide to extracting text from scanned PDFs](/blog/extract-text-from-scanned-pdf).

## In short

If you can select the text, extract it: it is instant and exact. If you cannot, it needs OCR: slower, and worth a proofread. If you are not sure, or the document is mixed, use a tool that checks every page and does the right thing for each.
