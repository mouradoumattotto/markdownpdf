---
title: Markdown Frontmatter Explained (YAML Guide)
description: What Markdown frontmatter is, how YAML metadata works, the fields Obsidian, Hugo, and Jekyll expect, common syntax errors, and how to avoid breaking your build.
date: 2026-06-16
---

If you have ever opened a Markdown file from a blog, a static site, or an Obsidian vault and found a block of `key: value` lines fenced between two rows of three dashes at the very top, you have met **frontmatter**. It looks like part of the document but never appears in the rendered output. Instead, it carries *metadata* — the title, date, tags, and settings that tools read to organize, sort, and publish your content. This guide explains exactly what frontmatter is, how the YAML syntax works, which fields the popular tools expect, and the small mistakes that quietly break builds.

## What is frontmatter?

Frontmatter is a metadata block placed at the top of a Markdown file, delimited by three hyphens (`---`) on the line above and below it:

```markdown
---
title: My First Post
date: 2026-06-16
tags: [markdown, writing]
draft: false
---

# My First Post

The actual content starts here.
```

The block must be the **very first thing** in the file — no blank lines, no stray characters before the opening `---`. Anything between the two fences is parsed as structured data; everything after the closing fence is normal Markdown.

The format inside is almost always **YAML** ("YAML Ain't Markup Language"), a human-readable way to write key-value pairs. A few tools also accept TOML frontmatter (fenced with `+++`) or JSON, but YAML is the de facto standard and what this guide focuses on.

## Why frontmatter exists

Markdown by itself has no place to store information *about* a document — only the content. Frontmatter fills that gap. Static site generators and note apps use it to:

- **Set the page title and URL** without parsing your first heading.
- **Sort and filter** posts by date, category, or tags.
- **Control publishing** with flags like `draft: true` or `published: false`.
- **Drive layouts** by naming a template the page should use.
- **Feed SEO and social cards** with descriptions, cover images, and canonical URLs.

This site does exactly that: every article you are reading begins with a `title`, `description`, and `date` in frontmatter, and the build reads those fields to generate page metadata and the blog index.

## YAML syntax basics

YAML is whitespace-sensitive and uses a handful of patterns. These cover 95% of real frontmatter:

```yaml
# A comment
title: A simple string
description: "Quote strings that contain a colon: like this"
date: 2026-06-16
draft: false
weight: 10

# A list (two equivalent styles)
tags: [markdown, yaml, metadata]
categories:
  - guides
  - reference

# Nested values
author:
  name: Jane Doe
  url: https://example.com
```

A few rules worth memorizing:

- **Indent with spaces, never tabs.** Two spaces per level is the convention. A single tab will throw a parse error.
- **Put a space after the colon.** `title:My Post` is invalid; `title: My Post` is correct.
- **Quote strings that contain special characters.** Colons, leading `#`, `@`, `&`, `*`, or `%` confuse the parser. Wrapping the value in `"double"` or `'single'` quotes fixes it.
- **Booleans are bare words.** Write `draft: true`, not `"true"` — quoting turns it into a string, which can defeat a `draft` check.
- **Dates use ISO format.** `2026-06-16` (YYYY-MM-DD) is understood everywhere.

## What the popular tools expect

Different tools read different field names. Here are the conventions for the most common ones.

| Tool | Common fields | Notes |
|---|---|---|
| **Jekyll** | `layout`, `title`, `date`, `categories`, `tags`, `permalink` | `layout` is required to pick a template |
| **Hugo** | `title`, `date`, `draft`, `tags`, `weight`, `slug` | Supports YAML, TOML (`+++`), and JSON |
| **Astro / Next.js** | `title`, `description`, `pubDate`, `tags` | Often validated against a schema (e.g. Astro content collections) |
| **Obsidian** | `tags`, `aliases`, `cssclasses` | Shown as "Properties"; powers search and Dataview queries |
| **Eleventy** | `title`, `date`, `tags`, `layout`, `permalink` | `tags` double as collection membership |

The takeaway: field names are **conventions, not universal standards**. A `description` field only does something if your tool or theme is coded to read it. When in doubt, check your generator's documentation for the exact keys it consumes.

### Frontmatter in Obsidian

Obsidian deserves a special mention because it surfaces frontmatter as editable "Properties" at the top of each note. Tags and aliases declared there feed search, graph view, and Dataview queries. If you are pulling source material into a vault — say, converting a PDF report into a note — adding a few frontmatter fields (source, date, tags) makes it instantly findable. See our guide on [importing PDFs into Obsidian](/blog/pdf-to-markdown-for-obsidian) for that workflow.

## Common mistakes that break builds

Frontmatter errors are among the most common reasons a static site build fails. Watch for these:

1. **A colon inside an unquoted value.** `title: Markdown: A Guide` parses the second colon as a new key and fails. Quote it: `title: "Markdown: A Guide"`.
2. **Tabs instead of spaces.** Editors that insert tabs on indent will silently corrupt nested values.
3. **A blank line or BOM before the opening `---`.** The fence must be line one, byte one. A byte-order mark from a Windows editor counts as a character.
4. **Misaligned list indentation.** Items under a key must indent consistently. Mixing two and four spaces breaks the list.
5. **Forgetting the closing fence.** Without the second `---`, the parser reads your whole article as metadata.
6. **Unquoted `yes`/`no`/`on`/`off`.** Older YAML parsers coerce these to booleans. If you mean the literal word, quote it.

A quick way to catch these before publishing is to paste your frontmatter into any YAML linter, or simply run your build locally and read the error — it usually names the offending line.

## A reusable template

Here is a sensible starting block for a blog post that works with most generators. Delete the fields your tool ignores:

```yaml
---
title: "Your Post Title"
description: "A 140-160 character summary for search engines and social cards."
date: 2026-06-16
draft: false
tags: [tag-one, tag-two]
slug: your-post-title
---
```

## Frontmatter and PDF conversion

Frontmatter is metadata, not content, so it should not appear in a finished PDF. When you convert Markdown to a document, the metadata block is typically stripped (or used to set the PDF title) rather than printed. If you are exporting notes or articles, our [Markdown to PDF converter](/markdown-to-pdf) handles the document body and leaves the YAML block out of the visible output — and like everything on this site, the conversion runs locally in your browser, so your files are never uploaded anywhere.

Going the other direction, when you convert a PDF *into* Markdown, you start with no frontmatter at all — the extracted text is pure content. Adding a small metadata block afterward (title, source, date) is what turns a raw conversion into an organized, searchable note. For the syntax of everything that goes *below* the frontmatter, keep our [Markdown cheat sheet](/blog/markdown-cheat-sheet) handy.

## FAQ

### Is frontmatter part of the Markdown standard?

No. The CommonMark and GitHub Flavored Markdown specifications do not define frontmatter. It is a convention popularized by Jekyll and adopted by nearly every static site generator and note app. Renderers that do not understand it will display the `---` block as content (or, in the case of GitHub, often hide it as a table).

### YAML, TOML, or JSON — which should I use?

YAML is the safest default because every tool supports it. Use TOML (`+++` fences) only if your generator specifically recommends it, such as some Hugo setups, and JSON only when a tool requires machine-generated metadata. For hand-written posts, stick with YAML.

### Why does my site show the `---` block as text?

The most common cause is that the frontmatter is not the first thing in the file — a blank line, space, or invisible byte-order mark sits above the opening fence. The other cause is using a renderer (like a plain Markdown preview) that does not parse frontmatter at all.

### Do I need frontmatter for every Markdown file?

Only if a tool reads it. A README, a quick note, or a document you are exporting to PDF needs no frontmatter. It earns its place when a generator or app uses the metadata to title, sort, tag, or publish the file.

### Can I add custom fields?

Yes. You can put any key you like in the block, and your tool ignores the ones it does not recognize. Themes and plugins often expose extra fields — `cover`, `canonical`, `featured` — that you can use once you confirm your setup reads them.
