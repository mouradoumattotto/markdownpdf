---
title: Clean Up Messy Markdown After PDF Conversion
description: Fix the common problems in Markdown converted from PDF - broken line breaks, hyphenated words, page headers, ligatures, and bad lists - with a clear cleanup checklist.
author: Mourad Oumita
date: 2026-06-30
---

You converted a PDF to Markdown, opened the result, and it is a mess: sentences chopped into fragments, words split with stray hyphens, page numbers floating mid-paragraph, and lists that no longer look like lists. This is normal. A PDF stores how a document *looks* on the page, not what it *means*, so even a good converter has to reconstruct structure from visual cues — and some of those cues are misleading.

The good news: almost all of the mess falls into a handful of predictable categories, and each one has a quick fix. This guide walks through the most common problems and how to clean them up fast, whether you are doing it by hand, with find-and-replace, or with a quick script.

## Why PDF-to-Markdown output looks broken

PDFs position text as glyphs at x/y coordinates. There is often no real concept of a paragraph, a heading, or a list item baked into the file — those are things your eye infers from font size, spacing, and indentation. When a tool reads a PDF, it has to guess where one paragraph ends and the next begins, whether a large bold line is a heading or just emphasis, and what to do with the repeating text at the top and bottom of every page.

Most artifacts come from three sources:

- **Hard line breaks** baked into each visual line of the page.
- **Repeating page furniture** — running headers, footers, and page numbers.
- **Typographic substitutions** — hyphenation at line ends, ligatures, and "smart" quotes.

Once you know the categories, cleanup becomes mechanical. Here is the checklist.

## The cleanup checklist

### 1. Rejoin broken line breaks

The single most common problem: every visual line in the PDF becomes its own line in the Markdown, so a paragraph that wrapped over six lines on the page arrives as six short fragments. In Markdown, a single line break inside a paragraph is usually fine when rendered, but it makes the source ugly and breaks downstream tools that treat each line as a unit.

The fix is to join lines that belong to the same paragraph while preserving the *blank* lines between paragraphs. A reliable find-and-replace approach in an editor that supports regex:

- Find `(\S)\n(\S)` and replace with `$1 $2` to merge mid-paragraph breaks into spaces.
- Leave double newlines (`\n\n`) untouched so paragraph boundaries survive.

Run the paragraph-boundary-safe version first; never do a blanket "remove all newlines," or you will weld separate paragraphs together.

### 2. Fix hyphenated words split across lines

When a word was broken at the right margin — `conver-` at the end of one line and `sion` at the start of the next — naive extraction keeps the hyphen: `conver- sion` or `conver-\nsion`. Rejoin these before you merge line breaks, so you do not turn the hyphen into a permanent scar.

- Find `(\w)-\n(\w)` and replace with `$1$2` to stitch the word back together.
- Watch out for genuinely hyphenated terms like `state-of-the-art` — those should keep their hyphen. A line-end hyphen is almost always a soft hyphen; a mid-line one is real.

### 3. Remove headers, footers, and page numbers

Running heads ("CHAPTER 3 — METHODS"), footers, and bare page numbers repeat on every page and end up sprinkled through your text, often interrupting a sentence that spanned a page break. Because they repeat, they are easy to spot:

- Scan for a short line that appears many times (the document title, author, or section name) and delete the duplicates.
- Delete lines that are just a number, or a number surrounded by whitespace.
- Re-join the sentence that the page break split — this is where most "why is this paragraph cut in half" confusion comes from.

If you have dozens of pages, a script that strips lines matching the repeating header/footer text is far faster than manual deletion.

### 4. Repair headings

Converters often miss headings (a bold 16pt line becomes plain bold text) or over-promote them (a figure caption becomes an `##`). Skim the document outline and fix the hierarchy by hand:

- Add `#`, `##`, `###` where the original used larger or bolder type for section titles.
- Keep levels consistent — do not jump from `#` straight to `####`.
- Demote anything that became a heading but is really a caption or a label.

Good headings matter beyond looks: they are what note apps, static-site generators, and AI tools use to chunk and navigate a document. If you are feeding the file to an LLM, clean headings noticeably improve results — see [why LLMs work better with Markdown](/blog/why-llms-prefer-markdown).

### 5. Rebuild lists

Bulleted and numbered lists frequently lose their markers or get the indentation wrong, so they render as ordinary paragraphs. Restore them:

- Replace stray bullet glyphs (`•`, `◦`, `‣`) with `-` followed by a space.
- Make sure each list item starts on its own line with the marker at the correct indent.
- For numbered lists, `1.`, `2.`, `3.` works, but Markdown also renders a list where every item is `1.` — handy when reordering.

### 6. Normalize typographic characters

PDFs love "smart" typography that can confuse plain-text tools and search:

- **Ligatures**: `ﬁ`, `ﬂ`, `ﬀ` may come through as single glyphs or vanish entirely, turning "file" into "le". Search for missing letters near `fi`/`fl` combinations.
- **Curly quotes and dashes**: `"` `"` `'` `—` are valid but inconsistent; normalize to straight quotes and `-`/`--` if your pipeline expects ASCII.
- **Non-breaking spaces** (` `) hide between words and break alignment — replace them with regular spaces.

### 7. Check tables and code last

Tables are the hardest thing to recover from a PDF because the visual grid carries the structure. Expect to rebuild column alignment by hand or re-extract them carefully. We cover this in depth in [extract tables from PDF to Markdown](/blog/extract-tables-from-pdf-to-markdown). Code blocks similarly lose their fences and indentation — wrap them in triple backticks and restore leading whitespace.

## Quick reference: problem → fix

| Symptom | Cause | Fix |
| --- | --- | --- |
| Sentences chopped into short lines | Hard line breaks per visual line | Merge `\n` between non-blank lines into spaces |
| `conver- sion`, stray hyphens | Line-end hyphenation | Remove hyphen + newline between word parts |
| Repeating title/number in text | Page headers and footers | Delete repeated lines; rejoin split sentences |
| Bold line that should be a title | Heading not detected | Add `#`/`##`/`###` by hand |
| List renders as a paragraph | Lost bullet/number markers | Restore `-` or `1.` markers and indentation |
| "le" instead of "file" | Dropped `fi` ligature | Search and restore missing letters |
| Garbled table | Visual grid lost | Rebuild columns or re-extract |

## Start with a cleaner conversion

The fastest cleanup is the one you do not have to do. A converter that reconstructs paragraphs, headings, and lists well leaves you far less to fix. Our free [PDF to Markdown converter](/) runs entirely in your browser — the file is never uploaded to a server, which matters when the document is a contract, a draft, or anything you would not paste into a random website — and it rebuilds structure from the PDF's layout so the raw output already needs less work. For scanned documents it runs OCR locally too, though OCR output always deserves a closer proofread.

Whatever tool you use, do the cleanup in this order: rejoin hyphenated words, merge line breaks, strip page furniture, fix headings and lists, then normalize typography and tables. Working top-down means each step does not undo the last. If you want the broader picture of how conversion works and why these artifacts appear, the [how to convert PDF to Markdown](/blog/how-to-convert-pdf-to-markdown) guide is a good companion read.

## FAQ

### Why does my converted Markdown have a line break after every line?

Because the PDF stored the text as separate visual lines and the converter preserved them. Merge single newlines between non-blank lines into spaces while keeping the blank lines that separate paragraphs. Never strip *all* newlines, or paragraphs will run together.

### How do I remove page numbers and headers automatically?

They repeat on every page, so they are easy to target: delete lines that are just a number, and delete the repeated title or section text that appears many times. For long documents, a small find-and-replace pattern or script that matches the exact header/footer text is much faster than deleting by hand.

### Why are some words missing letters like "fi" or "fl"?

Those are ligatures — single glyphs the typesetter used for letter pairs. Some PDFs drop them during extraction, turning "file" into "le" or "flow" into "ow". Search the text for these gaps near `fi`, `fl`, and `ff` combinations and restore the missing letters.

### Can I avoid cleanup entirely?

Not entirely — PDFs simply do not carry the structure Markdown needs, so some reconstruction is unavoidable. But a converter that does a good job rebuilding headings, paragraphs, and lists dramatically reduces the work. Digital-native PDFs clean up in minutes; scanned documents that went through OCR always need a more careful pass.
