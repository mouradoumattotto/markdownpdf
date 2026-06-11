---
title: What Is Markdown? A Complete Beginner's Guide
description: What is Markdown? Learn the history, core syntax with examples, flavors like CommonMark and GFM, the best tools, and why writers and developers rely on it.
date: 2026-05-15
---

If you have ever written a README on GitHub, formatted a message in Discord, or taken notes in Obsidian, you have already used Markdown — possibly without knowing its name. Markdown is a lightweight way to format plain text, and over the past two decades it has quietly become the default writing format of the internet. This guide covers what it is, where it came from, how the syntax works, and why so many people refuse to write in anything else.

## What is Markdown, exactly?

Markdown is a **plain-text formatting syntax**: a small set of conventions — asterisks, hash marks, hyphens — that mark up text so software can render it as formatted HTML, while the raw text stays perfectly readable to humans. This double readability is the whole idea. Compare the same sentence in HTML and Markdown:

```html
<p>This is <strong>important</strong> and this is <em>emphasized</em>.</p>
```

```markdown
This is **important** and this is *emphasized*.
```

Both render identically in a browser, but only one is pleasant to write and read as-is.

Because Markdown files are just text (usually with a `.md` extension), they open in any editor on any operating system, weigh almost nothing, version-control beautifully, and will still be readable decades from now.

## A short history

Markdown was created in **2004 by John Gruber**, the writer behind the blog Daring Fireball, with feedback from programmer and activist **Aaron Swartz**. Gruber's stated goal was "to make it as readable as possible" — a format whose source you could publish as-is without it looking like it was marked up with tags. The conventions were borrowed largely from how people already formatted plain-text email: asterisks for emphasis, dashes for lists, angle-bracket quoting.

The original release was a Perl script that converted the syntax to HTML, plus an informal spec. That informality became both a blessing and a curse: Markdown spread everywhere, but every implementation interpreted edge cases differently — which is why standardized "flavors" emerged later.

## Core syntax: everything you need in five minutes

### Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
```

### Emphasis

```markdown
*italic*   or   _italic_
**bold**   or   __bold__
***bold and italic***
```

### Lists

```markdown
- An unordered item
- Another item
  - A nested item

1. First step
2. Second step
3. Third step
```

### Links and images

```markdown
[Link text](https://example.com)
![Alt text for an image](image.png)
```

### Code

Inline code uses backticks: `` `npm install` ``. For multi-line code, fence it with three backticks and an optional language for syntax highlighting:

````markdown
```python
def greet(name):
    return f"Hello, {name}!"
```
````

### Blockquotes and rules

```markdown
> A quoted passage.

---
```

### Tables (extended syntax)

```markdown
| Feature | Supported |
|---------|-----------|
| Tables  | Yes       |
| Math    | Sometimes |
```

That is genuinely most of it. You can learn the basics in minutes and be fluent within a day — a learning curve almost no other formatting system matches.

## Markdown flavors: CommonMark, GFM, and friends

Because Gruber's original spec left details ambiguous, several standardized dialects emerged. The differences matter when you move documents between tools.

| Flavor | What it adds | Where you meet it |
|---|---|---|
| **Original (Gruber)** | The baseline syntax | The 2004 spec; historical reference |
| **CommonMark** | A rigorous, unambiguous specification of the core | Many parsers and apps build on it |
| **GitHub Flavored Markdown (GFM)** | Tables, task lists, strikethrough, autolinks, fenced code blocks | GitHub, GitLab, much of the dev world |
| **MultiMarkdown / Pandoc Markdown** | Footnotes, citations, metadata, math | Academic and publishing workflows |

**CommonMark**, launched in 2014, finally gave Markdown a formal specification with a comprehensive test suite. **GFM** is formally an extension of CommonMark and is probably the dialect most people actually write today, thanks to GitHub's ubiquity. For everyday writing the flavors agree on all the basics; you only notice differences with tables, footnotes, and other extensions.

## Why developers and writers love it

- **Focus.** Formatting happens inline with ordinary characters, so you never leave the keyboard or break your train of thought to fiddle with a toolbar.
- **Portability.** A Markdown file is not locked to any application. Switch editors, switch operating systems, switch decades — the file still works.
- **Version control.** Git treats Markdown like code: every change is diffable, blame-able, and revertible line by line. This is why virtually all software documentation is Markdown.
- **One source, many outputs.** The same file can become a web page, documentation site, ebook, presentation, or — with a converter like [Markdown to PDF](/markdown-to-pdf) — a polished, printable document.
- **Longevity.** Plain text is the most durable file format ever invented. There is no vendor that can discontinue it.

## Tools to write Markdown

You can write Markdown in literally any text editor, but some tools make it nicer:

- **Code editors** — VS Code has built-in Markdown preview (`Ctrl+Shift+V`) and a deep extension ecosystem.
- **Note-taking apps** — Obsidian and Logseq store notes as local Markdown files; Notion and Bear use Markdown-style input. (See our guide to [Markdown for note-taking](/blog/markdown-for-note-taking).)
- **Dedicated editors** — Typora, MarkText, and iA Writer render formatting live as you type.
- **Online editors** — StackEdit and Dillinger run in the browser with live preview.
- **Converters** — Pandoc transforms Markdown to and from dozens of formats on the command line; browser tools like MarkdownPDF handle the PDF direction without installing anything, and process files locally so nothing is uploaded.

## Markdown and PDF: a natural pairing

Markdown is ideal for writing; PDF is ideal for delivering. The two formats complement each other so well that converting between them is one of the most common Markdown workflows. When a draft is ready to share with someone who expects a "real" document, convert it with the [Markdown to PDF tool](/markdown-to-pdf). When someone hands you a PDF whose content you need to edit or reuse, the [PDF to Markdown converter](/pdf-to-markdown) — with OCR for scanned files — brings it back into plain text. For a deeper comparison of the two formats, see [Markdown vs PDF](/blog/markdown-vs-pdf).

## FAQ

### Is Markdown hard to learn?

No — it is one of the easiest "languages" in computing. The core syntax (headings, bold, italics, lists, links) takes about ten minutes to learn, and because the raw text remains readable, mistakes are obvious and harmless. Most people are comfortable after writing one or two documents.

### What file extension does Markdown use?

`.md` is standard, with `.markdown` as a less common alternative. The file itself is plain text — you can rename a `.txt` file to `.md` and any Markdown editor will happily render it.

### What is the difference between Markdown and HTML?

HTML is a full markup language for building web pages; Markdown is a shorthand that compiles into a subset of HTML. Markdown is faster to write and easier to read, while HTML offers complete control. Conveniently, you can embed raw HTML inside Markdown when you need something the syntax does not cover.

### Can Markdown handle images, tables, and math?

Images and links are part of the core syntax. Tables, task lists, and strikethrough come with extended flavors like GFM. Mathematical notation (via LaTeX syntax) is supported by some tools — Obsidian, Typora, and Pandoc among them — but it is not universal, so check your target platform.

### Do I need special software to open a Markdown file?

No. Any text editor — Notepad, TextEdit, vim, VS Code — opens Markdown, because it is plain text. You only need Markdown-aware software if you want to see the rendered, formatted version.
