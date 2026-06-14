---
title: Extract Text From a Scanned PDF - Step-by-Step Guide
description: Learn how to extract text from a scanned PDF for free with browser-based OCR - identify scans, run recognition, improve accuracy, and fix common errors.
date: 2026-06-13
---

Someone hands you a scanned contract, an old report, or a photographed receipt as a PDF — and you need the text out of it. You try to copy a paragraph and nothing happens. The cursor will not even select a single word.

This is one of the most common document problems there is, and the fix takes a few minutes once you know the routine. This guide is a practical walkthrough: confirm what kind of PDF you have, run text extraction with OCR right in your browser, and clean up the output so it is actually usable. If you want the theory behind how OCR works under the hood, we cover that separately in our [OCR for PDFs explained](/blog/ocr-pdf-to-text-guide) guide — here we focus on doing it.

## Step 1: Confirm the PDF is actually scanned

Before reaching for OCR, check whether you need it at all. PDFs come in two flavors:

- **Digital (text-based) PDFs** were exported from software like Word or a browser. The text is stored inside the file and can be copied directly.
- **Scanned (image-based) PDFs** are pictures of pages. There is no text layer to copy — only pixels.

Three quick checks tell you which one you have:

1. **The selection test.** Try dragging your cursor across a sentence. If individual words highlight, it is a digital PDF. If you get a blue box around the whole page (or nothing), it is a scan.
2. **The search test.** Press `Ctrl+F` (or `Cmd+F`) and search for a word you can clearly see on the page. Zero results on a visible word means there is no text layer.
3. **The zoom test.** Zoom in to 400%. Digital text stays razor sharp at any zoom level; scanned text gets blurry or pixelated.

If the PDF is digital, you do not need OCR at all — a converter can read the text layer directly, which is faster and perfectly accurate. Either way, the next step is the same.

## Step 2: Run the extraction

You do not need to install desktop software or pay for a subscription for most scanned documents. Here is the workflow with our free [PDF to Markdown converter](/pdf-to-markdown), which has OCR built in:

1. **Open the converter** in any modern browser — it works on Windows, Mac, Linux, and even tablets.
2. **Drop your PDF** onto the page. The file is processed locally in your browser using OCR that runs on your own machine — it is never uploaded to a server, which matters when the scan is a contract, a medical record, or anything else you would not email to a stranger.
3. **Wait for recognition.** Digital text is read directly; scanned pages go through OCR. A few pages take seconds; a long scan takes a bit longer because every page is analyzed image by image.
4. **Review the output** in the preview pane next to the original.
5. **Copy or download** the result as Markdown — plain text you can paste anywhere, edit in any editor, or keep in your notes app.

Why Markdown instead of a `.txt` file? Because Markdown preserves *structure*: headings stay headings, lists stay lists. That structure is exactly what you lose with basic copy-paste, and it makes the extracted text far more useful. New to the format? See our [complete guide to Markdown](/blog/what-is-markdown-complete-guide).

## Step 3: Improve the results before you blame the OCR

OCR accuracy depends heavily on the input. If your output has lots of errors, the scan is usually the culprit, not the engine. Work through these in order:

### Fix the orientation

Pages scanned sideways or upside down produce garbage. Rotate them in any PDF viewer and re-run the conversion. Slightly *skewed* pages (tilted a few degrees) also hurt accuracy — if you control the scanner, align the paper carefully.

### Rescan at a higher resolution if you can

300 DPI is the standard sweet spot for OCR. Low-resolution scans and compressed phone photos lose the fine detail that distinguishes an `e` from a `c` or an `l` from a `1`. If the original document is still available, a rescan is the single biggest accuracy upgrade you can make.

### Improve contrast and lighting

Faded ink, gray backgrounds, coffee stains, and shadows from photographing a curled page all confuse recognition. Scanning in black-and-white (not grayscale) at high contrast often helps with clean printed text. For phone captures, use a scanning app that flattens and de-shadows the page rather than the plain camera.

### Mind the layout

Multi-column layouts, tables, handwriting, and decorative fonts are the hardest cases for any OCR engine. Printed body text in a single column is the easy case. Expect to do more manual cleanup on complex layouts — and treat handwriting recognition as a bonus when it works, not a guarantee.

## Step 4: Clean up common OCR errors

Even a good OCR pass on a decent scan needs a proofreading pass. The errors are predictable, which makes them fast to fix:

- **Character confusion:** `rn` read as `m`, `l` / `1` / `I` swapped, `0` / `O` swapped, `5` / `S` in part numbers. Numbers, codes, and names deserve a careful manual check because spellcheck will not catch a wrong digit.
- **Broken words at line ends:** hyphenated words split across lines may come through as `docu- ment`. A find-and-replace for `- ` fixes most of these.
- **Lost or merged paragraphs:** OCR sometimes joins paragraphs or breaks them mid-sentence. Skim the structure against the original.
- **Stray artifacts:** specks of dust become periods or quote marks; page numbers and headers get mixed into body text. Delete them as you read.

A practical proofreading trick: read the extracted text side by side with the original PDF, paying extra attention to anything numeric. For a typical clean office scan, expect cleanup to take a few minutes per page at most; for a rough fax-quality scan, budget more.

## Free vs paid: what you actually need

The text-extraction landscape sorts into three tiers:

- **Free browser-based tools** (like ours) handle the common case: printed documents, reasonable scan quality, output as editable text. They are free because they run on your hardware instead of expensive servers — which is also why your files stay private. For most people, this tier is all that is ever needed.
- **Paid desktop suites** such as Adobe Acrobat Pro or ABBYY FineReader add batch processing of thousands of pages, advanced layout reconstruction, and the ability to write a searchable text layer back into the original PDF. Worth it if OCR is part of your daily job.
- **Cloud OCR APIs** from Google, Amazon, and Microsoft are aimed at developers processing documents programmatically at scale, priced per page.

The honest advice: start free. If you hit a real wall — enormous volume, very degraded sources, strict layout-reconstruction needs — you will know exactly which paid feature you are buying.

## Wrapping up

Extracting text from a scanned PDF comes down to four steps: confirm it is really a scan, run it through an [OCR-enabled converter](/pdf-to-markdown), improve the source if accuracy disappoints, and proofread the predictable error patterns. Once your text is out and cleaned up, it is yours to edit, search, and reuse — and if you later need a polished document again, you can [convert the Markdown back to PDF](/markdown-to-pdf) in the same browser.
