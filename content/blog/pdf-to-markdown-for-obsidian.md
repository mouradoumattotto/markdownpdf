---
title: PDF to Markdown for Obsidian - Import PDFs the Right Way
description: Turn PDFs into Markdown notes for your Obsidian vault. Why Markdown beats PDF attachments for linking and search, plus a full import workflow with OCR.
date: 2026-06-03
author: Mourad Oumita
---

Drag a PDF into Obsidian and it dutifully lands in your vault as an attachment. You can open it, read it, even annotate it — and yet it never quite becomes part of your notes. You cannot link to a paragraph inside it, its text does not show up in the graph, and most of what makes Obsidian powerful simply passes it by. The fix is to stop storing PDFs as PDFs and start importing them as Markdown. This guide explains why that matters and walks through a workflow for doing it well.

## Why Markdown notes beat PDF attachments in a vault

Obsidian is built around plain-text Markdown files. Every feature that makes a vault feel alive — backlinks, the graph view, block references, dataview-style queries, fast full-text search — operates on Markdown notes. A PDF attachment sits outside that system. Concretely, converting a PDF to a Markdown note gives you:

- **Real links.** You can `[[wikilink]]` to the note, link to specific headings with `[[note#Heading]]`, and reference individual blocks. A PDF only supports a link to the whole file.
- **Backlinks and the graph.** A converted paper or report becomes a node in your graph, connected to every note that mentions it. Attachments are dead ends.
- **Search that actually works.** Obsidian's search and quick switcher index Markdown content natively. Text inside PDFs is second-class at best, and text inside *scanned* PDFs is invisible.
- **Editable content.** You can highlight, annotate inline, delete the parts you do not need, and weave quotes directly into your own writing.
- **Longevity and sync.** Plain text is tiny, diffs cleanly, and syncs instantly. A vault full of multi-megabyte PDFs is slower everywhere.

If you want the deeper argument for plain text as a note-taking foundation, see our guide to [Markdown for note-taking](/blog/markdown-for-note-taking). The short version: the PDF is a snapshot of how a document *looks*; the Markdown note is the knowledge itself. (For a fuller comparison of the two formats, see [Markdown vs PDF](/blog/markdown-vs-pdf).)

## The conversion workflow

Here is the workflow from PDF on disk to a well-formed note in your vault.

### Step 1: Convert the PDF to Markdown

Open our free [PDF to Markdown converter](/) in your browser and drop the PDF in. The conversion runs entirely on your own machine — the file is never uploaded to a server — which matters when you are importing contracts, research drafts, or anything else you would not paste into a random website. You get back Markdown with headings, paragraphs, and lists reconstructed from the PDF layout.

Download the `.md` file or copy the output to your clipboard.

### Step 2: Bring it into the vault

Either save the downloaded file directly into your vault folder or create a new note in Obsidian and paste the Markdown in. Obsidian needs no import step — a `.md` file in the vault folder *is* a note.

A useful convention is a dedicated folder such as `Sources/` or `Imports/` for converted documents, keeping them distinct from your own thinking until you have processed them.

### Step 3: Clean up the conversion

No PDF conversion is perfect, because PDFs store appearance rather than structure (our [PDF to Markdown guide](/blog/how-to-convert-pdf-to-markdown) explains why). Budget a few minutes to:

- Fix heading levels so the outline reflects the document's real hierarchy
- Rejoin paragraphs that were split by page breaks
- Delete repeated headers, footers, and page numbers
- Check tables and re-format any that came through as loose text

This is also the moment to be ruthless: if you only care about one section of a fifty-page report, keep that section and link to the original PDF for the rest.

### Step 4: Add properties and tags

Top the note with YAML properties (a [frontmatter block](/blog/markdown-cheat-sheet)) so it slots into your vault's structure:

```yaml
---
title: Attention Is All You Need
author: Vaswani et al.
year: 2017
source: pdf
tags: [paper, machine-learning]
---
```

Properties make imported documents queryable — every paper by an author, everything imported this month, all sources you have not yet processed. Tags like `#to-process` or `#source/paper` work well if you prefer tagging over properties.

### Step 5: Link it into your knowledge

This is the step that justifies the whole exercise. Add `[[wikilinks]]` to related notes, pull key quotes into your own evergreen notes with block references, and write a few sentences in your own words about why the document matters. An imported note with zero links is barely better than the original attachment.

## Organizing imported content

A few patterns that hold up as the number of imports grows:

- **One note per document** for papers and reports, with the original filename or citation in the properties.
- **Split very long documents** into one note per chapter, joined by a small index note — easier to link to and faster to open.
- **Keep the original PDF** alongside the note if fidelity matters (figures, exact layout, signatures) and link to it from the note. The Markdown is for thinking; the PDF is the archival copy.
- **A literature-note template** (properties, a summary section, a quotes section, an open questions section) makes each import faster and more consistent than starting from a blank page.

## Handling scanned PDFs with OCR

Plenty of PDFs — older papers, book chapters, anything that has been printed and re-scanned — contain no text at all, just images of pages. A normal converter has nothing to extract from them.

Our [PDF to Markdown tool](/) includes OCR (optical character recognition), which reads the page images and reconstructs the text, again entirely in your browser. Expect OCR output to need more cleanup than a digital-native PDF: the recognition is good on clean scans but degrades with skewed pages, low resolution, or unusual fonts. Skim the result against the original before you rely on it. For a deeper look at how OCR works and how to get the best results, see our [OCR PDF to text guide](/blog/ocr-pdf-to-text-guide).

## FAQ

### Should I convert every PDF in my vault?

No. Convert documents you will actually think with — papers you cite, reports you reference, material you want to search and quote. A manual you open once a year is fine as an attachment.

### Does Obsidian have a built-in PDF importer?

Obsidian can embed and display PDFs, and its importer plugin handles formats like Evernote and [Notion exports](/blog/pdf-to-markdown-for-notion), but it does not convert PDF content into Markdown notes. You need a conversion step first, which is exactly what a [browser-based converter](/) provides.

### What about the formatting Markdown cannot express?

Multi-column layouts, precise figure placement, and typography do not survive — Markdown has no equivalent. For notes this is usually a feature: you want the content, not the page design. Keep the original PDF when the layout itself matters.

## The bottom line

A PDF attachment is storage; a Markdown note is knowledge you can link, search, and build on. Converting takes a couple of minutes with a [free browser-based converter](/) — including scanned documents, thanks to OCR — and turns inert files into working parts of your vault. Import the documents that matter, clean them up, link them in, and let the graph do the rest.
