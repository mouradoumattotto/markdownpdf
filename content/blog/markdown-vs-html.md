---
title: "Markdown vs HTML: What Each Is For, and When to Convert"
seoTitle: Markdown vs HTML
description: Markdown and HTML describe the same structure for different jobs. What each is for, what Markdown cannot express, and how to convert safely.
date: 2026-09-23
updated: 2026-09-23
author: Mourad Oumita
---

Every Markdown document ends up as HTML. That is what Markdown was designed for: in 2004, John Gruber described it as a way to write for the web in plain text that is readable as it is, and converts to HTML. Twenty years later the two coexist everywhere — GitHub READMEs, documentation sites, CMS editors, chat apps, AI tools — and people regularly need to go from one to the other.

## The same document, twice

```markdown
## Release notes

Version 2 adds **OCR** in seven languages. See the [changelog](https://example.com).

- Faster exports
- Arabic support
```

```html
<h2>Release notes</h2>
<p>Version 2 adds <strong>OCR</strong> in seven languages.
See the <a href="https://example.com">changelog</a>.</p>
<ul>
  <li>Faster exports</li>
  <li>Arabic support</li>
</ul>
```

Same structure, same meaning. The Markdown version is what you would write; the HTML version is what a browser needs.

## What each is good at

**Markdown is for writing and keeping.**

- Readable as plain text, with no rendering needed.
- Fast to type: no closing tags, no attributes.
- Diffs cleanly in Git, so changes are easy to review.
- Portable: the same file renders on GitHub, in Obsidian, on a static site and in a PDF.
- Compact, which matters for AI: the same content costs far fewer tokens than its HTML. See [why LLMs prefer Markdown](/blog/why-llms-prefer-markdown).

**HTML is for displaying and controlling.**

- It is what browsers, email clients and most CMS editors take.
- It can express everything: layout, classes, IDs, forms, video, interactive elements, accessibility attributes.
- It can be styled precisely with CSS.

## What Markdown cannot express

Markdown deliberately covers a small subset of HTML. Things with no Markdown syntax include:

- Classes, IDs and inline styles.
- Tables with merged cells, or with lists and paragraphs inside cells.
- Forms, buttons, video and audio.
- Text colour, alignment and font size.
- Most accessibility attributes, apart from image alt text.

Most Markdown renderers let you drop raw HTML into a Markdown file for these cases. That works, but it gives up the readability that made Markdown worth using, and some platforms strip it for security.

## Flavours: why the same Markdown renders differently

The original Markdown left details open. **CommonMark** later specified the core precisely, and **GitHub-flavored Markdown (GFM)** added the extensions most people now expect: pipe tables, task lists (`- [ ]`), strikethrough (`~~text~~`) and automatic links. Other platforms add their own — math, diagrams, footnotes, callouts.

In practice, if you write GFM, your file will render correctly in most places. Converters on this site produce and read GFM.

## Converting Markdown to HTML

Useful when you write in Markdown and publish somewhere that wants HTML: a CMS without a Markdown mode, an email template, a page on a site you do not control.

The [Markdown to HTML converter](/markdown-to-html) produces plain, semantic HTML — no wrapper elements or inline styles — so it inherits the styling of wherever you paste it. It can also wrap the result in a complete page with basic styling for viewing on its own.

One thing to know: **Markdown allows raw HTML, and raw HTML can carry scripts.** A Markdown file from someone else can hide a `<script>` tag or an `onerror` attribute. Pasting unsanitised output into a CMS is a classic way to inject code into a site. The converter sanitises its output; if you use another tool, check that it does too.

## Converting HTML to Markdown

Useful for moving content out of a CMS, saving articles into a notes app, cleaning up a web page before giving it to an AI model, or pulling a table from a page into a README.

The [HTML to Markdown converter](/html-to-markdown) accepts HTML code, a saved `.html` file, or — often quickest — formatted text copied from a web page, Word or Google Docs and pasted in. It can strip menus, headers and footers to keep just the main content.

Expect to lose everything Markdown cannot express: styling disappears, complex tables may need attention, and embedded media is reduced to its text or a link.

## Which one to keep

A simple rule works for most people:

- **Keep the source in Markdown** when people write and maintain it — docs, notes, READMEs, knowledge bases, content you will feed to AI.
- **Keep HTML** when the output is the product: designed pages, emails, anything with layout.
- **Convert at the boundary**: write Markdown, generate HTML when publishing; import HTML into Markdown once, then maintain it as Markdown.

If you need a document rather than a web page, the same Markdown can also become a PDF with [Markdown to PDF](/md-to-pdf) — and the [Markdown cheat sheet](/blog/markdown-cheat-sheet) covers the syntax for all of it.
