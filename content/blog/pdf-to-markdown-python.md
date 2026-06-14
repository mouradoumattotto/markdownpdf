---
title: PDF to Markdown in Python — Libraries Compared
description: Convert PDF to Markdown in Python with PyMuPDF, pdfplumber, pymupdf4llm, marker, or docling. Real code examples, trade-offs, and when to skip the code.
date: 2026-06-09
---

If you search for "convert PDF to Markdown in Python," you will find a dozen libraries that all claim to do it. The honest picture is more nuanced: a few libraries extract text fast but leave structure to you, a few produce real Markdown out of the box, and a few use machine learning models that produce the best output at a real cost in setup and compute. This guide compares the main options with working code, so you can pick the right tool — or decide you do not need code at all.

## The core difficulty

PDF is a layout format, not a document format. It records where glyphs sit on a page, not "this is a heading" or "this is a table cell." Any PDF-to-Markdown converter has to infer structure from font sizes, positions, and spacing. That inference is what separates the libraries below — and it is why results vary so much between a clean digital report and a scanned two-column paper. For background on the format gap, see [Markdown vs PDF](/blog/markdown-vs-pdf).

## PyMuPDF — fast raw extraction

[PyMuPDF](https://pymupdf.readthedocs.io/) (imported as `pymupdf`, formerly `fitz`) is the workhorse: a fast binding to the MuPDF engine. It extracts text, images, and metadata very quickly, but its basic output is plain text, not Markdown — you get the words, and the structure is your problem.

```python
import pymupdf

doc = pymupdf.open("report.pdf")
text = ""
for page in doc:
    text += page.get_text()

print(text[:500])
```

This is the right tool when you need raw text at speed — feeding a search index, running keyword checks across thousands of files — and the wrong tool when you need headings, lists, and tables preserved. You can ask `get_text("dict")` for font sizes and positions and reconstruct headings yourself, but that is a project, not a snippet.

**Trade-off:** maximum speed and control, minimum structure.

## pdfplumber — when tables matter

[pdfplumber](https://github.com/jsvine/pdfplumber) is built on pdfminer.six and shines at one thing PyMuPDF's basic extraction does not: tables. It detects table boundaries from ruling lines and text alignment and gives you rows as Python lists, which you can then format as a Markdown table.

```python
import pdfplumber

with pdfplumber.open("invoice.pdf") as pdf:
    page = pdf.pages[0]
    table = page.extract_table()

# Convert the extracted rows to a Markdown table
header, *rows = table
md = "| " + " | ".join(header) + " |\n"
md += "|" + "---|" * len(header) + "\n"
for row in rows:
    md += "| " + " | ".join(cell or "" for cell in row) + " |\n"

print(md)
```

pdfplumber is noticeably slower than PyMuPDF and still does not produce Markdown by itself — you assemble it. But for invoices, financial statements, and data-heavy reports, its table extraction is often the difference between usable output and soup.

**Trade-off:** best-in-class table handling, slower, assembly required.

## pymupdf4llm — Markdown output in one call

[pymupdf4llm](https://pypi.org/project/pymupdf4llm/) is a layer on top of PyMuPDF built for exactly this job: it outputs GitHub-flavored Markdown directly, with headings inferred from font sizes, plus lists, code blocks, and basic tables. It was designed for preparing PDF content for LLM pipelines, where Markdown is the preferred input format.

```python
import pymupdf4llm

md_text = pymupdf4llm.to_markdown("paper.pdf")

with open("paper.md", "w", encoding="utf-8") as f:
    f.write(md_text)
```

That is genuinely the whole program. For clean, digitally created PDFs with a conventional layout, the output is good. Multi-column layouts, unusual typography, and complex tables will still trip it up, because the heading inference is heuristic, not learned.

**Trade-off:** the best effort-to-result ratio in pure Python; quality depends heavily on how conventional the PDF is.

## marker and docling — ML-based heavyweights

Two newer projects use machine learning models for layout analysis rather than heuristics:

- **[marker](https://github.com/datalab-to/marker)** runs a pipeline of deep-learning models for layout detection, reading order, and table recognition, and outputs Markdown, HTML, or JSON. Quality on difficult documents — academic papers, multi-column layouts — is substantially better than heuristic tools.
- **[docling](https://github.com/docling-project/docling)**, an IBM-initiated open-source project, takes a similar model-driven approach, handles many input formats beyond PDF, and exports Markdown among other formats.

```python
from docling.document_converter import DocumentConverter

converter = DocumentConverter()
result = converter.convert("scanned-paper.pdf")
print(result.document.export_to_markdown())
```

The cost is real: both pull in heavy ML dependencies (PyTorch among them), download model weights on first run, and are far slower than PyMuPDF — minutes instead of milliseconds for some documents, unless you have a GPU. They also handle scanned documents better because OCR is part of the pipeline, a topic covered in our [OCR PDF to text guide](/blog/ocr-pdf-to-text-guide).

**Trade-off:** best accuracy on hard documents, heaviest setup and runtime by a wide margin.

## Quick comparison

| Library | Markdown out of the box | Tables | Speed | Setup weight |
|---|---|---|---|---|
| PyMuPDF | No (plain text) | Basic | Very fast | Light |
| pdfplumber | No (you assemble) | Excellent | Moderate | Light |
| pymupdf4llm | Yes | Decent | Fast | Light |
| marker | Yes | Good (ML) | Slow without GPU | Heavy |
| docling | Yes | Good (ML) | Slow without GPU | Heavy |

A sensible decision path: start with **pymupdf4llm** for digital PDFs; reach for **pdfplumber** when tables are the whole point; escalate to **marker** or **docling** when documents are scanned, multi-column, or otherwise messy and quality justifies the compute.

Always check the licenses too — PyMuPDF and pymupdf4llm are AGPL-licensed (with commercial options), which matters if you are embedding them in a product.

## When a no-code browser tool is the better choice

All of the above assumes you should be writing code in the first place. That is true when you are processing PDFs in bulk, on a schedule, or inside a larger pipeline. It is overkill when you have one PDF — or a handful — and just want the Markdown.

For that case, our [PDF to Markdown converter](/pdf-to-markdown) does the conversion directly in your browser: drop the file in, get Markdown out, including OCR for scanned pages. Nothing to install, no virtual environments, no model downloads — and because the conversion runs locally on your machine, the file is never uploaded to a server, which matters for contracts and anything confidential.

A rule of thumb:

- **One-off or occasional conversions** → browser tool, done in seconds.
- **Hundreds of files, automation, or integration into a pipeline** → Python, using the decision path above.
- **Somewhere in between** → try the browser tool first; only write code once you know the output quality you can expect from the document type.

If you end up doing manual cleanup either way, the practical tips in [how to convert PDF to Markdown](/blog/how-to-convert-pdf-to-markdown) apply regardless of which tool produced the raw output.

## Closing thoughts

Python's PDF ecosystem is genuinely good, but no library makes the underlying problem disappear: PDFs do not contain the structure Markdown needs, so every converter is guessing, and the guesses improve with effort and compute. Match the tool to the stakes — a quick script for clean documents, ML pipelines for hard ones, and a [browser-based converter](/pdf-to-markdown) when writing code costs more time than it saves.
