---
title: Markdown Cheat Sheet - Every Syntax Element on One Page
description: A complete Markdown cheat sheet covering every syntax element - headings, lists, links, tables, code - plus GFM extras. Printable - export it to PDF free.
date: 2026-05-16
author: Mourad Oumita
downloadPdf: true
---

Markdown's whole promise is that you can learn it in an afternoon — but until the syntax is muscle memory, everyone needs a reference. This cheat sheet covers every element of standard Markdown plus the GitHub Flavored Markdown (GFM) extras you will meet in the wild, each with the exact syntax and what it renders as. Keep it open in a tab, or [export it to PDF](/markdown-to-pdf) and pin it next to your desk. New to Markdown entirely? Start with our [complete beginner's guide](/blog/what-is-markdown-complete-guide) first.

## Basic syntax

### Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

Renders as document headings from largest (`#`) to smallest (`######`). Put a space after the hashes, and keep one blank line before and after the heading. Most documents only ever need three levels.

### Emphasis

```markdown
*italic* or _italic_
**bold** or __bold__
***bold and italic***
```

Asterisks and underscores are interchangeable; asterisks are safer mid-word (`un*frigging*believable` works, underscores there may not).

### Paragraphs and line breaks

```markdown
First paragraph.

Second paragraph after a blank line.

A line ending with two trailing spaces··
forces a line break without a new paragraph.
```

A blank line starts a new paragraph. For a soft line break inside a paragraph, end the line with **two spaces** (shown as `··` above) or a backslash (`\`). A single newline alone is ignored by standard Markdown renderers.

### Blockquotes

```markdown
> A quoted line.
>
> A second quoted paragraph.
>> Nested quote.
```

Renders as an indented quotation block. Add `>` on the blank lines to keep multi-paragraph quotes together.

### Lists

```markdown
- Unordered item
- Another item
  - Nested item (indent two spaces)

1. Ordered item
2. Second item
1. The numbers need not be correct — renderers count for you
```

`-`, `*`, and `+` all start unordered items. Ordered lists render with sequential numbers regardless of what you type, so many writers use `1.` for every line to keep diffs clean.

### Code

```markdown
Inline `code` with backticks.

    A code block indented four spaces.
```

````markdown
```python
def fenced_block():
    return "with optional language for syntax highlighting"
```
````

Inline code renders in monospace; fenced blocks (three backticks) preserve whitespace exactly and can name a language for highlighting.

### Links

```markdown
[Link text](https://example.com)
[Link with tooltip](https://example.com "Title shown on hover")
[Reference-style link][ref]

[ref]: https://example.com
```

Renders as clickable text. Reference style keeps long URLs out of your prose — handy in documents with many links.

### Images

```markdown
![Alt text](image.png)
![Alt text](https://example.com/image.png "Optional title")
```

Identical to a link with a leading `!`. The alt text appears if the image cannot load and matters for accessibility.

### Horizontal rule

```markdown
---
```

Three or more hyphens, asterisks, or underscores alone on a line render as a horizontal divider. Leave a blank line above it, or the line before becomes a heading.

### Escaping characters

```markdown
\*not italic\* and a literal backslash: \\
```

A backslash before any Markdown punctuation (`\` `` ` `` `*` `_` `{}` `[]` `()` `#` `+` `-` `.` `!` `|`) renders the character literally instead of triggering formatting.

## Tables (GFM)

```markdown
| Column | Left | Center | Right |
|--------|:-----|:------:|------:|
| Row 1  | a    | b      | c     |
| Row 2  | d    | e      | f     |
```

Renders as a grid with a header row. Colons in the divider row control alignment: `:---` left, `:---:` center, `---:` right. The pipes do not need to line up visually — but your future self will thank you if they do.

## GFM extras

GitHub Flavored Markdown is the de facto standard dialect, supported by GitHub, most editors, and most note apps.

### Task lists

```markdown
- [ ] Open task
- [x] Completed task
```

Renders as checkboxes — interactive on GitHub and in apps like Obsidian, which is a favorite for [Markdown note-taking](/blog/markdown-for-note-taking).

### Strikethrough

```markdown
~~struck through~~
```

Renders with a line through the text. Two tildes on each side.

### Autolinks

```markdown
https://example.com
```

GFM turns bare URLs into clickable links automatically. In strict standard Markdown you would write `<https://example.com>` with angle brackets.

## Quick-reference table

| Element | Syntax |
|---|---|
| Heading | `# H1` … `###### H6` |
| Bold | `**text**` |
| Italic | `*text*` |
| Blockquote | `> text` |
| Unordered list | `- item` |
| Ordered list | `1. item` |
| Inline code | `` `code` `` |
| Code block | ` ```lang … ``` ` |
| Link | `[text](url)` |
| Image | `![alt](url)` |
| Table | `\| a \| b \|` |
| Horizontal rule | `---` |
| Line break | two trailing spaces |
| Escape | `\*` |
| Task list | `- [ ]` / `- [x]` |
| Strikethrough | `~~text~~` |

## Three mistakes that trip up beginners

1. **Missing blank lines.** Headings, lists, and code blocks need a blank line before them or many renderers will not recognize them.
2. **Invisible line breaks.** Pressing Enter once does nothing in rendered output. Use a blank line for a paragraph or two trailing spaces for a break.
3. **Unescaped characters.** A stray `*` or `_` in normal prose can italicize half a sentence. Escape with `\` when writing about code or math.

## Print this cheat sheet

A reference is most useful when it is in front of you. Copy this page's Markdown into our free [Markdown to PDF converter](/markdown-to-pdf) and you get a clean, printable PDF in seconds — converted entirely in your browser, nothing uploaded anywhere. The same tool turns any of your own Markdown — notes, READMEs, documentation — into shareable PDFs; see our [Markdown to PDF guide](/blog/convert-markdown-to-pdf) for styling tips.

And if you need the reverse trip — extracting Markdown *out of* a PDF — our [PDF to Markdown converter](/pdf-to-markdown) handles that too, [OCR](/blog/ocr-pdf-to-text-guide) included.
