---
title: Convert a GitHub README to PDF (Free, Step-by-Step)
description: Turn any GitHub README.md into a polished PDF for sharing, documentation deliverables, or offline reading. Step-by-step guide, caveats, and alternatives.
date: 2026-06-10
author: Mourad Oumita
---

A README lives happily on GitHub right up until someone outside GitHub needs it. A client wants the setup guide as an attachment. A compliance process demands documentation as a file, not a link. You want to read a long README on a flight. In all of those cases, the answer is the same: convert the README to PDF. This guide shows you how to do it in under a minute, what renders well, and where to watch out.

## Why turn a README into a PDF at all?

### Sharing outside GitHub

Not everyone you work with has a GitHub account, and private repositories make "just send them the link" impossible without managing access. A PDF travels over email, Slack, and document portals with zero friction, and the recipient needs nothing but a PDF reader.

### Documentation deliverables

Agencies and contractors often have to hand over documentation as part of a deliverable. A statement of work rarely says "grant the client read access to the repo" — it says "provide documentation." Converting the README (and other Markdown docs in the repo) to PDF turns the docs you already maintain into the artifact the contract asks for, without writing anything twice.

### Offline reading and archiving

PDFs are self-contained and render identically everywhere, which makes them ideal for offline reading and long-term archiving. A README on GitHub depends on GitHub being reachable and the repo continuing to exist; a PDF in your records does not. The strengths of each format are covered in more depth in [Markdown vs PDF](/blog/markdown-vs-pdf), and if your documents also pass through office tools, [PDF vs Word vs Markdown](/blog/pdf-vs-word-vs-markdown) compares all three.

## Step-by-step: README to PDF in the browser

The fastest route uses our free [Markdown to PDF converter](/markdown-to-pdf), which runs entirely in your browser — the file is never uploaded anywhere, so this works for private and proprietary READMEs too.

### Step 1: Get the raw Markdown

On the README's GitHub page, click the **Raw** button (top right of the file view). You will see the plain Markdown source. Select all and copy it, or save the page as `README.md`.

Alternatively, if you have the repository cloned locally, the file is already on disk — skip straight to step 2.

### Step 2: Load it into the converter

Open the [Markdown to PDF tool](/markdown-to-pdf) and paste the Markdown or drop the `.md` file in.

### Step 3: Check the preview

Scan the rendered output before exporting. Pay attention to the elements READMEs use heavily — code blocks, tables, nested lists — and to anything image-based (more on that below).

### Step 4: Download the PDF

Export and you are done. The result is a clean, selectable-text PDF — searchable, printable, and ready to attach.

For repositories with multiple Markdown docs (`CONTRIBUTING.md`, files in a `docs/` folder), repeat the process per file, or concatenate them into one Markdown file first if you want a single PDF deliverable.

## What renders well — and what to watch

READMEs are written in GitHub Flavored Markdown (GFM), and the core of it converts cleanly to PDF.

### What converts well

- **Headings and structure.** The `#`/`##`/`###` hierarchy maps directly to a visual hierarchy in the PDF.
- **Fenced code blocks.** Installation commands and code samples come through as monospaced blocks — usually the most important part of a README.
- **GFM tables.** Option matrices, configuration references, and compatibility tables render as proper tables. If your tables are complex, our guide on [extracting tables from PDF to Markdown](/blog/extract-tables-from-pdf-to-markdown) covers what is and is not possible in the syntax.
- **Lists, links, and inline formatting.** Bold, italics, inline code, and nested lists all behave. Links remain clickable in most PDF readers.

### Caveats

- **Badges.** Those shield icons at the top of a README (build status, version, license) are remote images served by external services. In a PDF they are at best a frozen snapshot and at worst broken — a "build passing" badge in a PDF is meaningless anyway, since it stops updating the moment you export. Consider deleting the badge line before converting; READMEs almost always read better in PDF without it.
- **Relative images and links.** A README that embeds `![diagram](docs/architecture.png)` refers to a file inside the repo. Outside the repo that path resolves to nothing. Either switch such images to absolute URLs, or accept that they will not appear. The same applies to relative links like `[see CONTRIBUTING](CONTRIBUTING.md)` — they will render as text but point nowhere useful in a PDF.
- **GitHub-specific extras.** Features that only exist on github.com — issue references like `#42`, @mentions, task-list checkboxes wired to issues, automatically rendered Mermaid diagrams, collapsible `<details>` sections — are not part of portable Markdown. Expect them to degrade to plain text or be skipped.
- **Very wide content.** GitHub scrolls wide tables and long code lines horizontally; a PDF page cannot. Long lines wrap or shrink, so check the preview for anything that looks cramped.

A two-minute tidy of the source — drop badges, fix image URLs, shorten extreme lines — usually takes the output from "fine" to "looks intentional."

## Alternatives

### Pandoc

[Pandoc](https://pandoc.org/) is the command-line standard for document conversion. With a PDF engine installed (typically a LaTeX distribution or `wkhtmltopdf`):

```bash
pandoc README.md -o README.pdf
```

It is scriptable and powerful — the right choice if you need to convert documentation in CI on every release. The cost is setup: installing Pandoc plus a working PDF engine is a meaningful detour if you just need one file converted.

### VS Code

If you live in VS Code, extensions such as "Markdown PDF" add an export-to-PDF command to the editor. Quality is reasonable and it is convenient when the file is already open — though you are installing an extension and accepting its default styling.

### Print to PDF from GitHub

You can open the README on GitHub and use the browser's Print → Save as PDF. It works in a pinch, but you get GitHub's page furniture and whatever the print stylesheet decides, with little control over the result.

For one-off conversions with no installs and no upload, the [browser-based converter](/markdown-to-pdf) remains the shortest path; the general workflow is covered in [how to convert Markdown to PDF](/blog/convert-markdown-to-pdf). The same export-from-Markdown approach also works well for other documents — for example, [writing a resume in Markdown and exporting it to PDF](/blog/markdown-resume-to-pdf).

## Going the other direction

Sometimes the problem is reversed: documentation exists only as a PDF and you want it back in the repo as Markdown. That is a harder conversion — PDFs do not store document structure — but our [PDF to Markdown converter](/pdf-to-markdown) handles it in the browser, OCR included for scanned pages.

## Wrap-up

A README is often the best documentation a project has, and converting it to PDF makes that documentation portable: attachable, archivable, readable offline. Grab the raw Markdown, run it through the [Markdown to PDF converter](/markdown-to-pdf), tidy badges and image paths if you care about polish, and you have a deliverable in minutes — no toolchain required.
