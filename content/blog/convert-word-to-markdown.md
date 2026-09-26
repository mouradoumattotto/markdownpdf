---
title: How to Convert Word to Markdown (DOCX to MD) Without Losing Structure
seoTitle: How to Convert Word to Markdown
description: Three reliable ways to turn a Word document into clean Markdown, and how to prepare the .docx so headings, lists and tables survive.
date: 2026-09-23
updated: 2026-09-23
author: Mourad Oumita
---

Word documents are where a lot of knowledge starts: specs, handbooks, meeting notes, policies. Markdown is where it becomes useful to a docs site, a Git repository, a wiki or an AI model. Converting between the two is easy to do badly — headings that come out as bold text, lists that turn into paragraphs, tables that vanish — and just as easy to do well, once you know what the converter is looking for.

## The one thing that decides the result: styles

A converter cannot see what a document *looks like*. It reads what the document *says it is*. In a .docx, that is the style applied to each paragraph.

- A line formatted with the **Heading 1** style becomes `# Heading`. The same line made big and bold by hand becomes `**Heading**` — a bold paragraph, because that is what it is.
- A list created with Word's list buttons becomes a Markdown list. Lines that start with a typed "-" or "1." and a tab may not.
- A real Word table becomes a Markdown table. Text aligned into columns with tabs does not.

So the most effective step happens before converting: open the document, click through the headings and check the style box shows *Heading 1*, *Heading 2* and so on. In Word, the navigation pane (*View → Navigation Pane*) lists exactly the headings a converter will find. If a section is missing there, it will be missing in the Markdown too.

Two more things to settle first:

- **Tracked changes.** Accept or reject them. Converters handle revisions differently, and you do not want deleted text reappearing.
- **Comments.** They do not have a Markdown equivalent. Resolve them or copy out anything worth keeping.

## Method 1: in your browser

The [Word to Markdown converter](/docx-to-markdown) on this site reads the .docx directly in your browser — the file is not uploaded — and produces GitHub-flavored Markdown: headings, bold, italic, links, lists, tables and footnotes.

You choose what happens to images:

- **Leave them out** for text-only destinations: ChatGPT, Claude, a wiki page, a knowledge base.
- **Save them to a folder**: you get a ZIP with the `.md` file and an `images/` folder, linked with relative paths — the layout static-site generators and Git repositories expect.
- **Embed them** in the Markdown as data URIs: one self-contained file, but a much bigger one, and not every editor displays them.

The result is editable on the page before you download it, and the converter lists anything it could not map — typically custom paragraph styles it did not recognise.

## Method 2: Google Docs

Google Docs can export Markdown directly: *File → Download → Markdown (.md)*. That makes it a convenient route when the document already lives in Google Drive, or when you can open the .docx there (*File → Open → Upload*).

The same rule about styles applies — Google Docs calls them *Heading 1*, *Heading 2* in the style menu. Check how images come out in the downloaded file before relying on it; if you need them as separate files, use one of the other two methods.

If you only need part of a document, select it in Google Docs, copy, and paste into the [HTML to Markdown converter](/html-to-markdown): the formatted text travels through the clipboard as HTML and comes out as Markdown.

## Method 3: Pandoc, for batches and scripts

For dozens of files, or as part of a build, Pandoc is the standard tool:

```bash
pandoc -f docx -t gfm --extract-media=. report.docx -o report.md
```

- `-t gfm` produces GitHub-flavored Markdown, with pipe tables.
- `--extract-media=.` writes the images to a `media/` folder next to the output and links them.

Pandoc handles a few things browser tools do not, such as converting Word equations to LaTeX math. Its catch is tables: a table with merged cells or several paragraphs in a cell cannot become a pipe table, so Pandoc falls back to an HTML table inside the Markdown. That is valid Markdown, but not pleasant to edit.

To convert a whole folder:

```bash
for f in *.docx; do pandoc -f docx -t gfm --extract-media="${f%.docx}" "$f" -o "${f%.docx}.md"; done
```

## What does not survive, whatever the method

Markdown describes structure, not layout, so some things have nowhere to go:

- **Fonts, colours, sizes and page layout** — dropped, and that is usually the point.
- **Headers, footers and page numbers** — dropped.
- **Text boxes and shapes** — their text may be lost or moved.
- **Merged table cells** — Markdown tables are simple grids.
- **Tables without a header row** — Markdown tables need one, so converters promote the first row.

## After converting: a two-minute clean-up

1. **Check the heading levels.** A document that starts with a *Heading 2* produces `##` everywhere; shift them if your destination expects a single `#` title.
2. **Scan the tables.** Look for merged cells that were split and cells whose content ran together.
3. **Fix image paths** if you moved the Markdown file away from its `images/` folder.
4. **Preview it.** The [Markdown to HTML converter](/markdown-to-html) shows the rendered result side by side, and [Markdown to PDF](/md-to-pdf) turns it back into a document if you need one.

If you are converting for an AI tool, Markdown is worth the effort: models read headings and lists as structure, and use far fewer tokens on Markdown than on the XML inside a .docx. [Why LLMs prefer Markdown](/blog/why-llms-prefer-markdown) explains the difference.
