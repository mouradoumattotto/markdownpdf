---
title: PDF to Notion - Import PDFs as Editable Markdown
description: Import a PDF into Notion as real, editable content - not a dead attachment. Convert PDF to Markdown first, then use Notion's native import. Free guide.
date: 2026-06-11
author: Mourad Oumita
---

Drag a PDF into Notion and you get an embedded file viewer: you can read the document, but you can't edit a word of it, link to a section, or find its contents with Notion's search filters the way you can with real blocks. If you actually want to *work* with the document — annotate it, restructure it, connect it to a database — you need the PDF's content as native Notion blocks.

The reliable way to get there is a two-step workflow: **convert the PDF to Markdown, then import the Markdown into Notion**. Notion treats Markdown as a first-class import format, so headings, lists, tables, and code blocks all arrive as proper editable blocks. This guide walks through the whole process, including what to fix along the way.

## Why not just embed the PDF?

Embedding has its place — contracts, signed forms, and pixel-perfect documents you must preserve are fine as attachments. But for anything you want to use as living notes, embedded PDFs have real costs:

- **No editing.** You can't fix a typo, add a comment inline, or delete an irrelevant section.
- **Weak integration.** PDF contents can't be turned into toggles, callouts, synced blocks, or database entries.
- **No block-level linking.** Notion's killer feature — linking to a specific block from anywhere — doesn't work inside an embedded file.
- **Clunky reading experience.** The embedded viewer is slow on mobile and doesn't adapt to Notion's themes or page width.

Converting to Markdown first removes all of these limitations, because the content becomes ordinary Notion blocks you can manipulate like anything else you typed yourself.

## Why Markdown is the right bridge

You could copy and paste text straight from a PDF viewer into Notion, but anyone who has tried knows the result: hard line breaks in the middle of sentences, headings flattened into plain paragraphs, [tables collapsed into word soup](/blog/extract-tables-from-pdf-to-markdown), and stray page numbers everywhere.

Markdown solves the structure problem. When a converter outputs `## Section title`, a `-` bullet list, or a pipe table, Notion's importer maps each element to the matching block type:

| Markdown element | Notion block after import |
|---|---|
| `#`, `##`, `###` headings | Heading 1, 2, 3 blocks |
| `-` / `1.` lists | Bulleted and numbered list blocks |
| Pipe tables | Notion simple tables |
| Fenced code blocks | Code blocks |
| `>` blockquotes | Quote blocks |
| `**bold**`, `*italic*`, `` `code` `` | Inline formatting |

That mapping is what makes the imported document feel native instead of pasted-in.

## Step 1: Convert the PDF to Markdown

Use the free [PDF to Markdown converter](/) — open it, drop in your PDF, and download the resulting `.md` file. Two things make it a good fit for this workflow:

1. **It detects structure.** Headings, lists, and tables are reconstructed as Markdown syntax rather than flat text, which is exactly what Notion's importer needs.
2. **It runs OCR automatically.** If your PDF is a scan (a photographed book chapter, an old report), the text is recognized in your browser via Tesseract, so even image-only PDFs come out as usable Markdown.

The conversion happens locally in your browser — the file is never uploaded to a server — so it's safe to use even for internal company documents you wouldn't paste into a random web tool.

### Quick cleanup before importing

PDF is a print format, so even good conversions benefit from a one-minute pass in any text editor:

- **Delete repeated headers and footers** — running titles and page numbers that appeared on every page.
- **Check heading levels.** If the document's chapter titles came out as bold text instead of `##` headings, promote them; Notion's outline and table of contents depend on real headings.
- **Rejoin broken paragraphs** if any sentences are still split by mid-line breaks.
- **Verify tables.** Complex multi-row-span tables may need manual reshaping into simple pipe tables.

Doing this in a text editor before import is much faster than fixing blocks one at a time inside Notion afterward.

## Step 2: Import the Markdown into Notion

1. In Notion's sidebar, open **Settings** and find the **Import** option (on desktop it also appears at the bottom of the sidebar).
2. Choose **Text & Markdown**.
3. Select your `.md` file. Notion creates a new page with the file name as the title and the content converted to blocks.
4. Move the page wherever it belongs — into a teamspace, under a project, or into a database as a full-page entry.

### Alternative: paste the Markdown directly

For shorter documents you can skip the import dialog entirely. Open the `.md` file, copy the raw text, and paste it into an empty Notion page. Notion parses pasted Markdown syntax and converts it to blocks on the fly. This is handy when you only need one section of a long PDF — copy just that section.

One caveat: pasting very large documents (hundreds of blocks) can be slow or get truncated, so for anything book-chapter-sized, the file import route is more reliable.

## Step 3: Make the content work for you in Notion

Once the document is real blocks, the payoff starts:

- **Turn sections into toggles** to collapse reference material you rarely need.
- **Add it to a database.** Drag the page into a "Reading notes" or "Research" database and tag it with properties like source, topic, and status.
- **Link blocks elsewhere.** Reference a specific definition or table from your project pages with block links or synced blocks.
- **Use Notion AI on it.** Q&A and summarization work far better on native blocks than on embedded file attachments — the same reason [LLMs work better with Markdown than PDF](/blog/why-llms-prefer-markdown).

If you keep both, a common pattern is to import the Markdown as the working copy and attach the original PDF at the bottom of the same page as the archival reference.

## When this workflow isn't the right call

Be selective about what you convert. Skip the conversion and just embed when:

- The document is **signed or legally fixed** — you want zero risk of accidental edits.
- It's **layout-heavy** — slide decks, posters, and brochures lose their meaning as linear text.
- You'll **never edit or search it** — pure archives can stay as attachments.

For everything else — reports, papers, documentation, meeting handouts, book chapters — editable blocks beat a frozen file. And if you ever need to go the other direction and turn a polished Notion-exported Markdown doc back into a shareable file, the [Markdown to PDF converter](/markdown-to-pdf) closes the loop.

If you use Obsidian alongside Notion (or are choosing between them), the same conversion-first logic applies there too — see our guide to [importing PDFs into Obsidian](/blog/pdf-to-markdown-for-obsidian) for that workflow.

## FAQ

### Can Notion import a PDF directly as editable text?

No. Uploading a PDF to Notion embeds it as a file attachment with a built-in viewer. Notion's import dialog accepts Word documents, HTML, CSV, and Markdown, but not PDF — which is why converting the PDF to Markdown first is the standard workaround.

### Will tables from my PDF survive the import?

Usually, yes — if the converter outputs proper Markdown pipe tables, Notion turns them into simple tables. Very complex tables with merged cells may need manual cleanup, since neither Markdown nor Notion's simple tables support cell spanning.

### What about scanned PDFs with no selectable text?

Convert them with a tool that includes OCR. The [PDF to Markdown converter](/) detects scanned pages and runs OCR automatically in your browser, so the output is normal editable Markdown ready for Notion.

### Do images from the PDF come through?

Markdown import handles text and structure; images embedded in a PDF aren't extracted by text-focused converters. If specific figures matter, screenshot them from the original PDF and drop them into the Notion page after import.

### Is there a file size limit?

Notion handles typical documents (tens of pages) without trouble via file import. For very long documents, consider splitting the Markdown into one file per chapter — that also gives you a cleaner page structure in Notion.
