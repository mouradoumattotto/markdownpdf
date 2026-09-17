---
title: PDF to Markdown for Docs Sites (Docusaurus, MkDocs)
seoTitle: PDF to Markdown for Docs Sites
description: Migrate legacy PDF documentation into a docs-as-code site. Convert PDFs to Markdown, add frontmatter, and slot pages into Docusaurus, MkDocs, or Hugo.
date: 2026-06-26
author: Mourad Oumita
---

Plenty of teams still have their "real" documentation locked inside PDFs — onboarding manuals, API references exported from Word, compliance handbooks, product specs. The moment you decide to move to a modern documentation site, those PDFs become a problem. Static site generators like Docusaurus, MkDocs, and Hugo all run on Markdown, not PDF. This guide shows how to convert legacy PDFs into clean Markdown and slot them into a docs-as-code workflow without hand-retyping every page.

## Why docs sites need Markdown, not PDF

A PDF is a layout format: it remembers exactly how a page *looks*, but throws away the structure underneath. A documentation site is the opposite — it cares about structure (headings, links, code blocks) and generates the look for you. The two are fundamentally mismatched.

Converting to Markdown unlocks everything a docs site is good at:

- **Search.** Generators build a full-text index from Markdown. A PDF dropped into `/static` is invisible to that search.
- **Navigation and cross-links.** Sidebars, "next/previous" buttons, and internal links are generated from your Markdown tree. PDFs are dead ends.
- **Versioning and diffs.** Markdown lives in Git, so every edit is a reviewable diff. A binary PDF shows up as "file changed" and nothing more.
- **Reuse.** Once content is Markdown, you can syntax-highlight code, render tables, embed admonitions, and restyle the whole site from one theme.

The goal of the migration is simple: turn each PDF into one or more `.md` files with clean headings and the frontmatter your generator expects.

## Step 1: Convert the PDF to Markdown

Start by getting the raw text out of the PDF as structured Markdown rather than a wall of text.

Open our free [PDF to Markdown converter](/) and drop the file in. The conversion runs entirely in your browser — the file is never uploaded to a server — which matters when the documentation is internal, unreleased, or covered by an NDA. You get back Markdown with headings, paragraphs, lists, and tables reconstructed from the PDF's layout.

If your PDF is a scan (an image of pages, not selectable text), the converter runs OCR automatically so you still get real text out. Scanned manuals are common in older organizations, so this step matters more than you'd expect.

Download the `.md` file or copy the output, and save it into your docs folder — `docs/` for Docusaurus and MkDocs, `content/` for Hugo.

## Step 2: Add the frontmatter your generator expects

Every generator reads a small block of YAML at the top of each file to control titles, URLs, and sidebar position. This is the one part conversion can't do for you, because it's specific to your site. (If YAML frontmatter is new to you, see our [Markdown frontmatter guide](/blog/markdown-frontmatter-guide).)

Here's what a minimal page looks like in each generator:

```markdown
---
title: Getting Started
sidebar_position: 2
---
```

The exact fields differ by tool:

| Generator | Folder | Common frontmatter fields | Sidebar/nav source |
|-----------|--------|---------------------------|--------------------|
| Docusaurus | `docs/` | `title`, `sidebar_position`, `slug`, `id` | auto or `sidebars.js` |
| MkDocs | `docs/` | `title` (often just an H1) | `nav:` in `mkdocs.yml` |
| Hugo | `content/` | `title`, `date`, `weight`, `draft` | sections + `weight` |

A practical rule: set `title` explicitly on every page so it never depends on the first heading, and use a numeric ordering field (`sidebar_position` / `weight`) so pages appear in a sensible order rather than alphabetically.

## Step 3: Clean up the conversion

No PDF-to-Markdown conversion is flawless, because the source never stored real structure. Budget a little cleanup time per page. The usual fixes:

1. **Heading levels.** PDFs fake hierarchy with font size. Make sure your real H1/H2/H3 nesting is logical — most generators expect exactly one H1 per page (or none, if the title comes from frontmatter).
2. **Hard line breaks.** PDFs often break a sentence across visual lines. Join paragraphs back into single lines so they reflow properly.
3. **Code blocks.** Reach for fenced blocks with a language tag (` ```js `) so the site applies syntax highlighting. PDFs frequently mangle indentation, so check spacing.
4. **Tables.** Wide PDF tables sometimes collapse. Confirm the pipe alignment and that no columns were dropped.
5. **Links and cross-references.** "See page 42" means nothing on the web. Convert internal references into real Markdown links between your new pages.
6. **Images.** Diagrams embedded in a PDF won't extract as files. Re-export the ones you need and reference them with standard `![alt](path)` syntax.

## Step 4: Split long PDFs into multiple pages

A 60-page PDF should almost never become one giant Markdown file. Long single pages scroll forever, hurt search relevance, and overwhelm the sidebar. Split on the natural H2 boundaries — each major section becomes its own `.md` file in a logical folder structure.

A good target is one focused topic per page: "Installation," "Configuration," "Authentication," and so on. This is exactly the granularity docs-site search and navigation are designed around, and it makes future edits far easier to review.

## Step 5: Build, preview, and commit

Run your generator's local dev server (`npm run start` for Docusaurus, `mkdocs serve`, or `hugo server`) and click through the new pages. Watch for broken internal links and malformed tables — these are the two issues that survive cleanup most often. Once a section looks right, commit it. Because everything is now plain text in Git, the rest of your team can review the migration like any other pull request.

If you ever need to go the other direction — publishing a polished, branded PDF *from* your Markdown docs for an offline release — you can [convert Markdown back to PDF](/markdown-to-pdf) with selectable text and proper code blocks.

## A realistic migration plan

For a large documentation set, don't try to convert everything at once. A staged approach works better:

1. Convert and clean your **top five most-visited documents** first.
2. Get them building and searchable on the new site.
3. Use what you learn (recurring cleanup patterns, your frontmatter conventions) to move faster through the rest.
4. Redirect old PDF links to the new pages once each section is live.

The conversion itself is the fast part. The lasting value comes from the structure you add on top — and that structure is what turns a pile of PDFs into documentation people can actually navigate, search, and contribute to.

## FAQ

### Can I convert a whole folder of PDFs at once?

The browser converter handles one file at a time, which keeps everything local and private. For a large migration, convert your highest-value documents first and work through the rest in batches — most of the effort is structural cleanup, not the conversion itself.

### Which static site generator should I use?

All three handle Markdown well. Choose Docusaurus if you want a React-based, versioned docs site with strong defaults; MkDocs (especially the Material theme) for the simplest Python-based setup; and Hugo when you need maximum build speed across a very large site. The conversion workflow is identical regardless.

### Will my PDF tables survive the conversion?

Simple tables usually convert cleanly into Markdown pipe tables. Very wide or merged-cell tables may need manual fixing, because Markdown tables are deliberately basic. Always preview tables in your local build before committing.

### What about scanned PDFs with no selectable text?

The converter runs OCR automatically when it detects a scanned document, so you still get editable Markdown text. Proofread OCR output carefully — recognition errors are common in older or low-resolution scans.

### Do I have to add frontmatter manually?

Yes. Frontmatter is specific to your site's configuration, so it's the one step conversion can't guess. The good news is it's only a few lines per page, and you can standardize it with a simple template.
