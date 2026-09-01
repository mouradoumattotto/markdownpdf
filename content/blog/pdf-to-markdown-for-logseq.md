---
title: PDF to Markdown for Logseq - Import PDFs as Blocks
description: Import PDFs into Logseq as real Markdown blocks, not dead attachments. Why the outliner needs plain text, a full conversion workflow, OCR, and cleanup tips.
author: Mourad Oumita
date: 2026-06-19
---

Logseq can open a PDF and even let you highlight it, but those highlights live in a sidecar file and the document itself stays outside your graph. You cannot reference a sentence as a block, the text barely surfaces in search, and none of Logseq's outliner power touches it. The way to actually *think* with a PDF in Logseq is to convert it to Markdown first, so every paragraph becomes a block you can reference, tag, and nest. This guide explains why that matters and walks through the workflow end to end.

## Why blocks beat PDF attachments in Logseq

Logseq is an outliner: every page is a tree of bullets, and each bullet is a *block* with its own identity. That block model is the whole point of the app — and a PDF attachment opts out of all of it. Converting a PDF to Markdown blocks gives you:

- **Block references.** Every block has an ID, so you can embed or reference a single quote with `((block-ref))` anywhere in your graph. A PDF only supports a link to the whole file.
- **Page and tag links.** A converted document becomes a real page you can `[[link]]` to and reach through `#tags`, wiring it into the rest of your knowledge. Attachments are dead ends.
- **Search that works.** Logseq indexes block text natively. Text inside a PDF is second-class, and text inside a *scanned* PDF is invisible to search entirely.
- **Queries.** Logseq's `{{query}}` blocks and properties let you pull "every source tagged #paper" or "everything imported this month" — but only if the content lives in blocks with properties.
- **Local plain text.** Logseq stores each page as a Markdown file on your disk. A converted note is a few kilobytes of text that syncs and diffs cleanly, instead of a multi-megabyte binary.

The PDF is a snapshot of how a document *looks*; the Markdown blocks are the knowledge itself. If you want the broader case for plain text as a note-taking foundation, see our guide to [Markdown for note-taking](/blog/markdown-for-note-taking).

## How Logseq's Markdown differs from Obsidian's

If you have read our [Obsidian import guide](/blog/pdf-to-markdown-for-obsidian), the workflow will feel familiar, but two Logseq-specific details matter when you bring in converted text.

| Detail | Obsidian | Logseq |
| --- | --- | --- |
| Document model | Free-form Markdown document | Outliner — every line is a block (bullet) |
| Metadata syntax | YAML frontmatter (`---` block) | Page properties as `key:: value` |
| Linking granularity | Headings and blocks | Blocks by ID, plus pages and tags |
| File location | Anywhere in the vault | `pages/` and `journals/` folders |

The big one is structure. A converted PDF is *flat* Markdown — a stack of headings and paragraphs. Logseq treats each of those as a top-level block sitting side by side. You get all the content immediately, but the indentation that makes an outline feel like an outline is something you add afterward by nesting blocks under their headings.

## The conversion workflow

### Step 1: Convert the PDF to Markdown

Open our free [PDF to Markdown converter](/) in your browser and drop the file in. The conversion runs entirely on your own machine — the file is never uploaded to a server — which matters when the PDF is a contract, a research draft, or anything else you would not paste into a random website. You get back Markdown with headings, paragraphs, and lists reconstructed from the PDF's layout. Download the `.md` file or copy the output.

### Step 2: Bring it into the graph

You have two options:

1. **Drop the file into `pages/`.** Save the converted `.md` directly into your graph's `pages/` folder. Logseq picks it up as a new page on the next re-index. The page name comes from the filename, so name it something linkable like `Attention Is All You Need.md`.
2. **Paste into a new page.** Create a page in Logseq and paste the Markdown into the first block. Logseq parses headings and splits the content into blocks as you paste.

A dedicated namespace such as `Sources/` (for example a page named `Sources/Attention Is All You Need`) keeps imported documents separate from your own thinking until you have processed them.

### Step 3: Clean up and outline

No PDF conversion is perfect, because PDFs store appearance rather than structure (our [how to convert PDF to Markdown](/blog/how-to-convert-pdf-to-markdown) guide explains why). Budget a few minutes to:

- **Nest blocks under their headings.** Indent the body blocks beneath the heading they belong to with `Tab`. This is what turns a flat import into a real Logseq outline.
- Fix heading levels so the hierarchy matches the document.
- Delete repeated page headers, footers, and page numbers.
- Rejoin paragraphs split across page breaks, and re-check any tables that came through as loose text.

Be ruthless here: if you only care about one section of a long report, keep that section as blocks and discard the rest.

### Step 4: Add properties

Logseq uses `key:: value` properties on the first block of a page rather than YAML frontmatter. Add them so the import becomes queryable:

```
title:: Attention Is All You Need
author:: Vaswani et al.
year:: 2017
source:: pdf
tags:: paper, machine-learning
```

Now a query for `{{query (property tags paper)}}` surfaces every imported paper, and `#machine-learning` ties the page into that tag's linked references.

### Step 5: Link it into your knowledge

This is the step that justifies the whole exercise. Reference key sentences into your daily journal or evergreen pages with `((block-ref))`, add `[[links]]` to related pages, and write a few blocks in your own words about why the document matters. An imported page with zero references is barely better than the original attachment.

## Handling scanned PDFs with OCR

Plenty of PDFs — older papers, scanned book chapters, anything printed and re-digitized — contain no text at all, only images of pages. A normal converter has nothing to extract.

Our [PDF to Markdown tool](/) includes OCR (optical character recognition), which reads the page images and reconstructs the text, again entirely in your browser. Expect OCR output to need more cleanup than a digital-native PDF: recognition is strong on clean scans but degrades with skewed pages, low resolution, or unusual fonts. Skim the result against the original before relying on it. For more on getting good results, see our [OCR PDF to text guide](/blog/ocr-pdf-to-text-guide).

## FAQ

### Should I convert every PDF into my graph?

No. Convert documents you will actually think with — papers you cite, reports you reference, material you want to query and quote. A manual you open once a year is fine left as an attachment or an external file link.

### Does Logseq have a built-in PDF-to-Markdown importer?

Logseq can display PDFs and store highlights as area references, but it does not convert PDF *content* into Markdown blocks. You need a conversion step first, which is exactly what a browser-based converter provides.

### Why did my import arrive as one giant block?

That usually happens when the Markdown lands in a single block instead of being parsed. Paste into an empty block (or save the file into `pages/` and re-index) so Logseq splits it on headings and blank lines, then nest the pieces with `Tab`.

### Can I keep the original PDF too?

Yes — keep it when figures, exact layout, or signatures matter, and link to it from the page. The Markdown blocks are for thinking and linking; the PDF is the archival copy.

## The bottom line

In Logseq, a PDF attachment is storage and a set of blocks is knowledge you can reference, tag, and query. Converting takes a couple of minutes with a [free browser-based converter](/) — including scanned documents, thanks to OCR — and turns an inert file into working parts of your graph. Import the documents that matter, outline them, add properties, link them in, and let the references do the rest.
