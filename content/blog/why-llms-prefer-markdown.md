---
title: Why LLMs Work Better With Markdown Than PDF
description: Why LLMs prefer Markdown over PDF text. How tokenization works, which structure signals survive, what PDF extraction loses, and before/after examples.
date: 2026-05-30
author: Mourad Oumita
---

Ask anyone who regularly feeds documents to ChatGPT, Claude, or a local model, and you will hear the same advice: convert it to Markdown first. It sounds like a community superstition, but there are concrete technical reasons behind it. This article explains what actually happens when a language model reads your document — and why Markdown consistently produces better results than raw PDF text.

## How LLMs actually read text

A language model never sees pages, fonts, or layout. It sees a sequence of tokens — small chunks of text, usually a few characters to a word long — produced by a tokenizer. Everything the model knows about your document's organization has to be encoded in that one-dimensional token stream.

This has two consequences:

1. **Structure must be in the text itself.** A human looking at a PDF infers structure visually: big bold text is a heading, indented lines are a list, a grid is a table. The model gets none of that. If the text stream just says `Results The treatment group showed...`, the model has to guess whether "Results" is a heading, the end of the previous sentence, or a stray word.
2. **Noise costs twice.** Every repeated page header, stray page number, and broken hyphen consumes tokens from the context window *and* dilutes the model's attention. The model dutifully processes "Annual Report 2025 | Page 14" forty times, and each occurrence is a token-level distraction sitting between the content you care about.

Markdown solves the first problem elegantly: it encodes structure *as text*. A `## Results` line tells the model unambiguously — in three or four tokens — that a new section called "Results" begins here. That is structure the tokenizer can carry and the model can use.

## The structure signals that survive in Markdown

Modern LLMs were trained on enormous amounts of Markdown: GitHub READMEs, documentation sites, forum posts, technical wikis. Markdown's conventions are deeply familiar patterns for these models, which is part of why their own output defaults to Markdown formatting.

The signals that matter most:

- **Headings.** `#`, `##`, `###` create an explicit hierarchy. The model can locate sections, respect their boundaries when summarizing, and understand that content under "Limitations" should be treated differently from content under "Results."
- **Lists.** `-` and `1.` markers tell the model that items are parallel, grouped, and (for numbered lists) ordered. Extracted PDF text often turns a bulleted list into an undifferentiated paragraph.
- **Tables.** Pipe tables keep the row/column relationships intact. The model can answer "what was the Q3 figure for EMEA?" because the alignment of cells is encoded in the text.
- **Code blocks.** Fenced blocks mark "this is literal code, not prose" — critical for technical documents.
- **Emphasis.** `**bold**` and `*italic*` survive as text, preserving the author's signals about key terms.

None of these survive a typical PDF copy-paste. They are visual conventions in the PDF, and the visual layer is exactly what gets discarded.

## What PDF text extraction loses

PDF is a print format: it records where glyphs are drawn on a page, optimized for faithful display, not for meaning. Extracting text from it is reverse-engineering, and the losses are predictable:

- **Heading information vanishes.** A heading in a PDF is just text in a larger font. Extraction yields the words with no marker, so headings melt into the surrounding paragraphs.
- **Reading order is fragile.** Multi-column pages, sidebars, and text boxes can come out interleaved or wildly out of order, because the extraction follows the internal storage order, not the visual reading order.
- **Line breaks become hard breaks.** Each printed line ends with a newline, fragmenting every sentence. Hyphenated words split across lines stay split.
- **Headers, footers, page numbers leak in.** They repeat on every page, scattered through the content stream.
- **Tables collapse.** Cell boundaries are visual; extraction yields the cell contents as a stream of words with no row or column information.
- **Scanned pages yield nothing.** If the PDF is a scan, there is no text layer at all — you need [OCR](/blog/ocr-pdf-to-text-guide) before any of this even applies.

For a fuller side-by-side of the two formats, see [Markdown vs PDF](/blog/markdown-vs-pdf).

## A before/after example

Here is what the same fragment of a report looks like in each form. First, typical raw extraction from the PDF:

```
Annual Report 2025 | Page 14
Regional Performance
Revenue grew across all regions in
the third quarter, with EMEA lead-
ing growth.
Region Q2 Q3 Change EMEA 3.6 4.2
+17% APAC 2.1 2.3 +10% Americas
5.0 5.1 +2%
15
```

The heading is indistinguishable from body text, the sentence is shredded across three lines with a broken word, the table is an unparseable number stream, and a page header plus a stray page number frame the whole thing.

Now the Markdown version:

```
## Regional Performance

Revenue grew across all regions in the third quarter,
with EMEA leading growth.

| Region   | Q2  | Q3  | Change |
|----------|-----|-----|--------|
| EMEA     | 3.6 | 4.2 | +17%   |
| APAC     | 2.1 | 2.3 | +10%   |
| Americas | 5.0 | 5.1 | +2%    |
```

Ask a model "which region grew fastest?" against the first version and it has to reconstruct a table from a jumble — sometimes it succeeds, sometimes it confidently pairs the wrong numbers. Against the second version, the answer is directly readable. The difference compounds over a 50-page document: every section boundary the model can see is a summarization error it will not make, and every intact table is a hallucinated figure avoided.

## Markdown as the lingua franca of AI tools

The case for Markdown goes beyond any single chat session. Look around the AI tooling landscape:

- Chat models *output* Markdown by default.
- System prompts and agent instructions are conventionally written in Markdown.
- RAG and document-ingestion frameworks use Markdown as their standard intermediate format — if you are building retrieval systems, see [preparing PDFs for RAG pipelines](/blog/pdf-to-markdown-for-rag-pipelines).
- Note tools like [Obsidian](/blog/pdf-to-markdown-for-obsidian), code editors with AI assistants, and dataset preparation pipelines all speak Markdown natively.

Convert a document once and it becomes portable across this entire ecosystem: [paste it into ChatGPT](/blog/convert-pdf-to-markdown-for-chatgpt) today, index it for retrieval tomorrow, drop it into your notes vault next week. PDF, by contrast, requires fresh (and lossy) extraction at every one of those steps. New to the format? The [complete guide to Markdown](/blog/what-is-markdown-complete-guide) covers the syntax in detail.

## The practical takeaway

You do not need to take any of this on faith — it is easy to test. Take a PDF you work with, ask your favorite model three specific questions about it using pasted raw text, then convert the same file with the free [PDF to Markdown converter](/pdf-to-markdown) (it runs locally in your browser; nothing is uploaded) and ask the same three questions again. Questions involving tables, section-specific content, or document structure are where you will see the gap.

The model was always capable of answering well. It just needed input it could actually read.
