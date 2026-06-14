---
title: OCR for PDFs Explained - Turn Scans Into Text
description: How OCR converts scanned PDFs into editable text - how the technology works, when you need it, accuracy factors, engines like Tesseract, and practical tips.
date: 2026-05-27
---

You open a PDF, try to copy a paragraph, and nothing selects. The document looks like text, but as far as your computer is concerned it is just a photograph. This is the defining problem of scanned PDFs, and the technology that solves it is **OCR — optical character recognition**. This guide explains how OCR works, when you actually need it, what determines whether the results are excellent or garbage, and how to get the best possible output from your scans.

## What is OCR?

Optical character recognition is the process of analyzing an **image** of text and converting it into actual, machine-readable **characters**. The idea is old — reading machines for the blind were built in the early 20th century, and Ray Kurzweil's reading machine in the 1970s was a famous milestone — but modern OCR, powered by machine learning, is dramatically more accurate than its predecessors.

The distinction that matters in practice:

- A **text-based (native) PDF** was exported from software — Word, LaTeX, a browser. The characters are stored in the file. You can select, search, and copy them directly. No OCR needed.
- An **image-based (scanned) PDF** came from a scanner or phone camera. Each page is a picture. There are no characters to copy until OCR creates them.

**The 10-second test:** open the PDF and try to select a word, or press `Ctrl+F` and search for a word you can see on the page. If selection fails or search finds nothing, you have a scanned PDF and OCR is required.

## How OCR works, step by step

Modern OCR engines run a pipeline that looks roughly like this:

1. **Preprocessing.** The image is cleaned up: rotated to be level (deskewing), filtered to remove specks and noise, and usually converted to high-contrast black and white (binarization). Good preprocessing is half the battle.
2. **Layout analysis.** The engine segments the page into zones — text blocks, columns, images, tables — and determines reading order. This is where multi-column documents succeed or fail.
3. **Text detection and recognition.** Lines are split into words and characters, and a recognition model identifies each one. Classical engines compared shapes against stored patterns; modern engines (including Tesseract since version 4) use neural networks — typically LSTM models — that read whole lines in context, which handles varied fonts far better.
4. **Language post-processing.** Raw recognition output is checked against language models and dictionaries. This is how an engine decides that "tbe" should be "the" and that an ambiguous shape is the letter `O` in "Oslo" but the digit `0` in "10".

The result is text — which can then be structured into something useful like Markdown.

## When do you need OCR?

| Situation | OCR needed? |
|---|---|
| PDF exported from Word, Google Docs, LaTeX | No — text is already embedded |
| Document scanned on a copier or scanner | Yes |
| Photo of a page taken with a phone | Yes |
| Old fax, archive document, or microfilm scan | Yes |
| PDF where some pages select and others do not | Partially — mixed documents exist |
| "Flattened" PDF saved as images for security | Yes |

Typical real-world cases: digitizing old paper records, extracting data from received invoices, making a scanned book searchable, quoting from archived reports, and converting legacy documentation into an editable format. For a hands-on walkthrough of the whole routine, see our guide to [extracting text from a scanned PDF](/blog/extract-text-from-scanned-pdf). If you want the end result as clean Markdown rather than raw text, a tool like our [PDF to Markdown converter](/pdf-to-markdown) runs OCR and structural formatting in one step — and because MarkdownPDF processes everything locally in your browser, scanned contracts and medical records never leave your machine.

## What determines OCR accuracy

OCR quality on a clean, modern printed page is excellent. On a crooked photocopy of a fax, it is not. The main factors:

- **Resolution.** Around 300 DPI is the sweet spot for scanning text. Below 200 DPI, characters lose the detail engines need; far above 300 mostly adds file size.
- **Contrast and lighting.** Dark, even text on a clean light background recognizes best. Shadows across phone photos and grey, faded toner hurt badly.
- **Skew and distortion.** Tilted scans and curved book pages distort character shapes. Engines deskew small angles, but flat, straight originals always win.
- **Font and print quality.** Standard printed fonts recognize at very high accuracy. Decorative fonts, dot-matrix output, and stamps do worse. Handwriting is a different, much harder problem that standard OCR engines handle poorly.
- **Language settings.** Engines use language models to resolve ambiguity, so telling the engine the document's language measurably improves results — especially for accented characters.
- **Noise and artifacts.** Coffee stains, hole punches, handwritten margin notes, and watermarks all generate recognition errors in their vicinity.

## OCR engines worth knowing

- **Tesseract** — the dominant open-source engine. Originally developed at Hewlett-Packard in the 1980s, open-sourced in 2005, and later sponsored by Google. Version 4 introduced an LSTM neural-network recognizer that substantially improved accuracy. Supports 100+ languages.
- **Tesseract.js** — a port of Tesseract to JavaScript/WebAssembly, which is what makes fully in-browser OCR possible: recognition runs on your own device, with no server upload at all.
- **Cloud OCR services** — Google Cloud Vision, AWS Textract, and Azure Document Intelligence offer strong accuracy and extras like table extraction, but they require sending your documents to a third-party server and are paid services.
- **Commercial desktop software** — ABBYY FineReader is the long-standing benchmark for heavy-duty, high-volume document digitization.

For occasional conversions, a free browser-based tool is usually the right call: no installation, no upload, no cost.

## Tips for better OCR results

1. **Scan at 300 DPI** in black and white or grayscale rather than color, unless color carries meaning.
2. **Keep pages flat and straight.** Press books gently flat; align pages on the scanner glass.
3. **Photographing instead of scanning?** Use even daylight, hold the phone parallel to the page, fill the frame, and avoid your own shadow.
4. **Set the correct language** in whatever OCR tool you use.
5. **Prefer the cleanest copy available.** A first-generation original beats a photocopy of a photocopy every time.
6. **Proofread the output.** Watch for classic confusions: `l` / `1` / `I`, `O` / `0`, `rn` / `m`, `5` / `S`. Numbers deserve special attention because a wrong digit is invisible to spellcheck.
7. **Verify numbers against the source** in invoices and financial documents — this is where OCR errors are costliest.

## From OCR text to useful documents

Raw OCR output is just a stream of text. The step that makes it genuinely useful is structuring: detecting headings, rebuilding lists and paragraphs, and producing a clean editable document. That is exactly the pipeline behind converting a scanned PDF to Markdown — OCR first, structure second — described in our [step-by-step PDF to Markdown guide](/blog/how-to-convert-pdf-to-markdown). And once you have edited the recovered text, you can produce a fresh, shareable document again with the [Markdown to PDF converter](/markdown-to-pdf).

## FAQ

### How accurate is OCR?

On clean, well-lit scans of standard printed text, modern engines routinely recognize the overwhelming majority of characters correctly — good enough that a quick proofread catches the rest. Accuracy drops with low resolution, skew, poor contrast, unusual fonts, and degraded originals, which is why scan quality matters more than engine choice for most users.

### Can OCR read handwriting?

Mostly no. Standard OCR engines like Tesseract are built for printed text and perform poorly on handwriting. Recognizing handwriting is a separate field (often called HTR — handwritten text recognition) that requires specialized models, and even those struggle with cursive and individual writing styles.

### Is browser-based OCR private?

It can be — if the tool truly runs locally. Thanks to WebAssembly ports like Tesseract.js, OCR can execute entirely on your own device. MarkdownPDF's [PDF to Markdown converter](/pdf-to-markdown) works this way: your scanned document is processed in your browser and never uploaded, unlike cloud OCR services that necessarily receive a copy of your file.

### Why does my scanned PDF search find nothing?

Because the PDF contains images of pages, not text. Search works on character data, and a scan has none until OCR adds it. Run the document through an OCR-capable converter and the resulting text becomes fully searchable.

### Does OCR work on tables?

OCR reads the characters in a table reliably, but reconstructing the table *structure* — which text belongs to which cell — is harder and depends on the tool. Simple grids usually survive; complex tables with merged cells often need manual cleanup afterward. Our guide to [extracting tables from a PDF to Markdown](/blog/extract-tables-from-pdf-to-markdown) digs into the table-specific tactics.
