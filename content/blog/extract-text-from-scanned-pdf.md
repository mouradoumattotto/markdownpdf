---
title: Extract Text From a Scanned PDF - Step-by-Step Guide
seoTitle: Extract Text From a Scanned PDF (OCR)
description: Extract text from a scanned PDF free with browser-based OCR - identify scans, run recognition, understand how OCR works, and fix the predictable errors.
date: 2026-06-13
updated: 2026-09-17
author: Mourad Oumita
---

Someone hands you a scanned contract, an old report, or a photographed receipt as a PDF — and you need the text out of it. You try to copy a paragraph and nothing happens. The cursor will not even select a single word.

This is one of the most common document problems there is, and the fix takes a few minutes once you know the routine. This guide is the complete version: confirm what kind of PDF you have, run text extraction with OCR right in your browser, understand enough about how OCR works to know when to blame the scan instead of the software, and clean up the output so it is actually usable.

## Step 1: Confirm the PDF is actually scanned

Before reaching for OCR, check whether you need it at all. PDFs come in two flavors:

- **Digital (text-based) PDFs** were exported from software like Word, LaTeX, or a browser. The characters are stored inside the file and can be copied directly. No OCR needed.
- **Scanned (image-based) PDFs** came from a scanner or a phone camera. Each page is a picture. There is no text layer to copy — only pixels.

Three quick checks tell you which one you have:

1. **The selection test.** Try dragging your cursor across a sentence. If individual words highlight, it is a digital PDF. If you get a blue box around the whole page (or nothing), it is a scan.
2. **The search test.** Press `Ctrl+F` (or `Cmd+F`) and search for a word you can clearly see on the page. Zero results on a visible word means there is no text layer.
3. **The zoom test.** Zoom in to 400%. Digital text stays razor sharp at any zoom level; scanned text gets blurry or pixelated.

If the PDF is digital, you do not need OCR at all — a converter can read the text layer directly, which is faster and perfectly accurate. Either way, the next step is the same. (For a closer look at the difference, see [OCR vs text extraction](/blog/ocr-vs-text-extraction).)

### When is OCR actually required?

| Situation | OCR needed? |
|---|---|
| PDF exported from Word, Google Docs, LaTeX | No — text is already embedded |
| Document scanned on a copier or scanner | Yes |
| Photo of a page taken with a phone | Yes |
| Old fax, archive document, or microfilm scan | Yes |
| PDF where some pages select and others do not | Partially — mixed documents exist |
| "Flattened" PDF saved as images for security | Yes |

Typical real-world cases: digitizing old paper records, extracting data from received invoices, making a scanned book searchable, quoting from archived reports, and converting legacy documentation into an editable format.

## Step 2: Run the extraction

You do not need to install desktop software or pay for a subscription for most scanned documents. Here is the workflow with our free [PDF to Markdown converter](/), which has OCR built in:

1. **Open the converter** in any modern browser — it works on Windows, Mac, Linux, and even tablets.
2. **Drop your PDF** onto the page. The file is processed locally in your browser using OCR that runs on your own machine — it is never uploaded to a server, which matters when the scan is a contract, a medical record, or anything else you would not email to a stranger.
3. **Wait for recognition.** Digital text is read directly; scanned pages go through OCR. A few pages take seconds; a long scan takes a bit longer because every page is analyzed image by image.
4. **Review the output** in the preview pane next to the original.
5. **Copy or download** the result as Markdown — plain text you can paste anywhere, edit in any editor, or keep in your notes app.

Why Markdown instead of a `.txt` file? Because Markdown preserves *structure*: headings stay headings, lists stay lists. That structure is exactly what you lose with basic copy-paste, and it makes the extracted text far more useful. New to the format? See our [complete guide to Markdown](/blog/what-is-markdown-complete-guide).

## How OCR works, and why that matters to you

**Optical character recognition** is the process of analyzing an *image* of text and converting it into actual, machine-readable *characters*. Knowing roughly what happens inside helps you diagnose bad output, because every stage has a failure mode you can see in the result.

1. **Preprocessing.** The image is cleaned up: rotated to be level (deskewing), filtered to remove specks and noise, and usually converted to high-contrast black and white (binarization). Good preprocessing is half the battle — which is why a straight, high-contrast scan beats a better engine on a crooked one.
2. **Layout analysis.** The engine segments the page into zones — text blocks, columns, images, tables — and determines reading order. This is where multi-column documents succeed or fail. Paragraphs arriving in the wrong order is a layout-analysis failure, not a recognition failure.
3. **Text detection and recognition.** Lines are split into words and characters, and a recognition model identifies each one. Classical engines compared shapes against stored patterns; modern engines (including Tesseract since version 4) use neural networks — typically LSTM models — that read whole lines in context, which handles varied fonts far better.
4. **Language post-processing.** Raw output is checked against language models and dictionaries. This is how an engine decides that "tbe" should be "the", and that an ambiguous shape is the letter `O` in "Oslo" but the digit `0` in "10". It is also why setting the right language measurably improves results.

The result is text — which then gets structured into something useful like Markdown.

### OCR engines worth knowing

- **Tesseract** — the dominant open-source engine. Originally developed at Hewlett-Packard in the 1980s, open-sourced in 2005, later sponsored by Google. Version 4 introduced the LSTM recognizer that substantially improved accuracy. Supports 100+ languages.
- **Tesseract.js** — a port of Tesseract to JavaScript/WebAssembly, which is what makes fully in-browser OCR possible: recognition runs on your own device, with no server upload at all. It is the engine behind this site's converter.
- **Cloud OCR services** — Google Cloud Vision, AWS Textract, and Azure Document Intelligence offer strong accuracy and extras like table extraction, but they require sending your documents to a third-party server, and they are paid.
- **Commercial desktop software** — ABBYY FineReader remains the benchmark for heavy-duty, high-volume document digitization.

For occasional conversions, a free browser-based tool is usually the right call: no installation, no upload, no cost.

## Step 3: Improve the results before you blame the OCR

OCR accuracy depends heavily on the input. If your output has lots of errors, the scan is usually the culprit, not the engine. Work through these in order:

### Fix the orientation

Pages scanned sideways or upside down produce garbage. Rotate them in any PDF viewer and re-run the conversion. Slightly *skewed* pages (tilted a few degrees) also hurt accuracy — if you control the scanner, align the paper carefully.

### Rescan at a higher resolution if you can

300 DPI is the standard sweet spot for OCR. Below 200 DPI, characters lose the fine detail that distinguishes an `e` from a `c` or an `l` from a `1`; far above 300 mostly adds file size without adding accuracy. If the original document is still available, a rescan is the single biggest accuracy upgrade you can make.

### Improve contrast and lighting

Faded ink, gray backgrounds, coffee stains, and shadows from photographing a curled page all confuse recognition. Scanning in black-and-white (not grayscale) at high contrast often helps with clean printed text. For phone captures, use a scanning app that flattens and de-shadows the page rather than the plain camera: hold the phone parallel to the page, fill the frame, use even daylight, and keep your own shadow off the paper.

### Set the language, and start from the cleanest copy

Language matters: the post-processing step above relies on a language model, so an engine configured for the wrong language makes more mistakes, especially on accented characters. Our converter's OCR is set up for English; for scans in other languages, a desktop tool where you pick the language will do better. And prefer a first-generation original over a photocopy of a photocopy, every time.

### Mind the layout

Multi-column layouts, tables, handwriting, and decorative fonts are the hardest cases for any OCR engine. Printed body text in a single column is the easy case. Tables in particular often need a dedicated approach — see how to [extract tables from a PDF to Markdown](/blog/extract-tables-from-pdf-to-markdown) cleanly. Expect to do more manual cleanup on complex layouts — and treat handwriting recognition as a bonus when it works, not a guarantee.

## Step 4: Clean up common OCR errors

Even a good OCR pass on a decent scan needs a proofreading pass. The errors are predictable, which makes them fast to fix:

- **Character confusion:** `rn` read as `m`, `l` / `1` / `I` swapped, `0` / `O` swapped, `5` / `S` in part numbers. Numbers, codes, and names deserve a careful manual check because spellcheck will not catch a wrong digit.
- **Broken words at line ends:** hyphenated words split across lines may come through as `docu- ment`. A find-and-replace for `- ` fixes most of these.
- **Lost or merged paragraphs:** OCR sometimes joins paragraphs or breaks them mid-sentence. Skim the structure against the original.
- **Stray artifacts:** specks of dust become periods or quote marks; page numbers and headers get mixed into body text. Delete them as you read.

A practical proofreading trick: read the extracted text side by side with the original PDF, paying extra attention to anything numeric. For a typical clean office scan, expect cleanup to take a few minutes per page at most; for a rough fax-quality scan, budget more. Our [clean-up checklist for converted Markdown](/blog/clean-up-markdown-after-pdf-conversion) walks through the rest of the fixes in order.

## Free vs paid: what you actually need

The text-extraction landscape sorts into three tiers:

- **Free browser-based tools** (like ours) handle the common case: printed documents, reasonable scan quality, output as editable text. They are free because they run on your hardware instead of expensive servers — which is also why your files stay private. For most people, this tier is all that is ever needed.
- **Paid desktop suites** such as Adobe Acrobat Pro or ABBYY FineReader add batch processing of thousands of pages, advanced layout reconstruction, and the ability to write a searchable text layer back into the original PDF. Worth it if OCR is part of your daily job.
- **Cloud OCR APIs** from Google, Amazon, and Microsoft are aimed at developers processing documents programmatically at scale, priced per page.

If you want to weigh specific tools against each other, our roundup of the [best PDF to Markdown converters](/blog/best-pdf-to-markdown-converters) compares the free and paid options side by side. The honest advice: start free. If you hit a real wall — enormous volume, very degraded sources, strict layout-reconstruction needs — you will know exactly which paid feature you are buying.

## Wrapping up

Extracting text from a scanned PDF comes down to four steps: confirm it is really a scan, run it through an [OCR-enabled converter](/), improve the source if accuracy disappoints, and proofread the predictable error patterns. Once your text is out and cleaned up, it is yours to edit, search, and reuse — and if you later need a polished document again, you can [convert the Markdown back to PDF](/md-to-pdf) in the same browser.

## FAQ

### How accurate is OCR?

On clean, well-lit scans of standard printed text, modern engines routinely recognize the overwhelming majority of characters correctly — good enough that a quick proofread catches the rest. Accuracy drops with low resolution, skew, poor contrast, unusual fonts, and degraded originals, which is why scan quality matters more than engine choice for most users.

### Can OCR read handwriting?

Mostly no. Standard OCR engines like Tesseract are built for printed text and perform poorly on handwriting. Recognizing handwriting is a separate field (often called HTR — handwritten text recognition) that requires specialized models, and even those struggle with cursive and individual writing styles.

### Is browser-based OCR private?

It can be — if the tool truly runs locally. Thanks to WebAssembly ports like Tesseract.js, OCR can execute entirely on your own device. MarkdownPDF's [PDF to Markdown converter](/) works this way: your scanned document is processed in your browser and never uploaded, unlike cloud OCR services that necessarily receive a copy of your file.

### Why does my scanned PDF search find nothing?

Because the PDF contains images of pages, not text. Search works on character data, and a scan has none until OCR adds it. Run the document through an OCR-capable converter and the resulting text becomes fully searchable.

### Does OCR work on tables?

OCR reads the characters in a table reliably, but reconstructing the table *structure* — which text belongs to which cell — is harder and depends on the tool. Simple grids usually survive; complex tables with merged cells often need manual cleanup afterward. Our guide to [extracting tables from a PDF to Markdown](/blog/extract-tables-from-pdf-to-markdown) digs into the table-specific tactics.
