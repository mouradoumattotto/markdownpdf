---
title: AI File Upload Limits in 2026 — NotebookLM, ChatGPT, Claude, Gemini
seoTitle: AI File Upload Limits (2026)
description: What NotebookLM, ChatGPT, Claude and Gemini actually accept per file, what happens when you go over, and the two fixes that work - with sources and dates.
date: 2026-09-22
updated: 2026-09-22
author: Mourad Oumita
---

You drag a 600-page report into NotebookLM and it is refused. Or worse, it is accepted, and the answers are confidently wrong because only part of it was read. Every AI tool has a ceiling on what a single file may contain, the ceilings are expressed in different units — words, tokens, megabytes, pages — and none of them is displayed while you are uploading.

Here is what each one actually accepts, checked against the vendors' own documentation on **22 September 2026**, with the source for every number. These limits change without announcement; each link goes to the page to re-check.

## The numbers

| Tool | Per-file limit | The detail that catches people out |
|---|---|---|
| **NotebookLM** | 500,000 words or 200 MB per source | 50 sources per notebook on the free plan |
| **ChatGPT** | 512 MB per file, 2 million tokens per text or document file | The token cap bites long before the size cap |
| **Claude (chat)** | 500 MB per file, up to 20 files per chat, PDFs up to 1,000 pages | Charts and images are only analysed up to **100 pages** |
| **Claude Projects** | 30 MB per file | Much stricter than a chat upload |
| **Gemini** | 100 MB per file, up to 10 files per prompt | Context holds roughly 1,500 pages of text in total |

Sources: [NotebookLM Help](https://support.google.com/notebooklm/answer/16215270), [OpenAI Help Center](https://help.openai.com/en/articles/8555545-file-uploads-faq), [Claude Help Center](https://support.claude.com/en/articles/8241126-upload-files-to-claude), [Gemini Apps Help](https://support.google.com/gemini/answer/14903178).

## What each limit really means

### NotebookLM: counted in words, and in slots

500,000 words is a lot — roughly five to six full-length novels — so most single documents fit comfortably. A 300-page report is usually around 100,000 words. The constraint people hit first is not the word count but the **number of sources**: 50 on the free plan. Split a book into 30 chapters and you have spent most of your notebook on one document.

That changes the right strategy: split only when a source genuinely exceeds the limit, or when splitting buys you something — chapter-level citations you can follow — rather than by reflex.

### ChatGPT: counted in tokens, which you cannot see

512 MB per file sounds generous, and it is: you will hit the **2 million token** cap on text documents long before it. Tokens are not words. For ordinary English prose, a rough rule is about 1.3 tokens per word, so 2 million tokens is roughly 1.5 million words — still large, but a poorly converted PDF inflates that number badly. Layout noise, repeated headers and footers, page numbers and broken words all cost tokens while carrying no meaning.

This is the case where converting to clean Markdown before uploading does more than splitting: the same document, stripped of layout debris, can be a fraction of the token count.

### Claude: the page number that matters is 100, not 1,000

Claude accepts PDFs of up to 1,000 pages in a chat. But its own documentation draws a line at 100: **in PDFs of 100 pages or fewer, Claude analyses both the text and the visual elements** — charts, diagrams, figures. From 101 to 1,000 pages, it processes the text only.

So a 300-page PDF is accepted and answered, while every chart in it is silently invisible. If the figures matter — and in a scientific paper or a financial report they usually are the point — parts of 100 pages are the difference between an answer and a guess. Note also that Claude Projects are much stricter than chats: 30 MB per file.

### Gemini: counted in megabytes, and in files per prompt

100 MB per file, up to 10 files in the same prompt. The number that constrains real work is the context: Gemini's default window holds roughly 1,500 pages of text **in total**, not per file. Ten 300-page documents will not all be read closely, whatever the upload dialog allows.

## What happens when you go over

Three failure modes, in increasing order of how much they cost you:

1. **The upload is refused.** Annoying, but honest — you know immediately.
2. **The file is accepted and truncated.** You get answers built on the first part of the document, with no warning that the rest was dropped. This is the dangerous one: nothing in the response says it only read 40% of your file.
3. **The file is accepted and flattened.** Claude past 100 pages is the clearest example: everything is "read", but the figures are not looked at.

None of these are visible in the answer. The only defence is knowing the limit before you upload.

## The two fixes

### Convert to Markdown first

Limits are counted in words, tokens or bytes — and a PDF is an expensive way to carry text. A PDF stores positioned glyphs, embedded fonts and images; the same content as Markdown is plain text with a few symbols for structure.

Converting first usually does three things at once: the size drops sharply, the headings survive as real headings (which is what lets a model locate an answer inside the document), and the layout noise disappears. Our [PDF to Markdown converter](/) does it in the browser, with OCR for scanned pages, and nothing is uploaded. If you want the evidence behind "Markdown reads better", see [why LLMs read Markdown better than PDF](/blog/why-llms-prefer-markdown). It also works the other way round: ChatGPT, Claude and Gemini answer in Markdown, and [Markdown to PDF](/md-to-pdf) turns a long answer into a PDF you can share.

### Split what is still too large

When a document genuinely exceeds a limit, split it — preferably at chapter boundaries rather than every N pages, so each part is a coherent section and the citation you get back names something you recognise. Cutting a book every 80 pages puts the end of one argument and the start of the next in the same file.

The [Split PDF for AI tool](/split-pdf-for-ai) does this against each tool's real limits: it counts the words, reads the bookmarks, tells you when **no split is needed at all**, and produces parts that respect the ceiling you picked. Like everything here, it runs in your browser — the document is never uploaded, which matters when it is a contract, a medical file or unpublished research.

## A note on scanned documents

If your PDF is a scan, none of the limits above are your real problem. A scanned page contains no text — it is a picture of text. Some tools will run their own OCR on it, with quality you cannot inspect, and some will simply find nothing. Splitting a scan changes nothing about that.

Run OCR yourself first, check the output, and upload text you have seen. Our guide to [extracting text from a scanned PDF](/blog/extract-text-from-scanned-pdf) covers the whole routine, including how to tell a scan from a digital PDF in ten seconds.

## Keeping this page honest

Every number above was read from the vendor's own documentation on the date at the top of this article, and every row in the table links to its source. Vendors change these limits quietly and often — Claude's chat limit, for example, is frequently reported as 30 MB, which is the *Projects* limit, not the chat one.

If you hit a limit that does not match what is written here, the tools all accept custom limits, and we would rather hear about it than leave a wrong number up: [contact@markdownpdf.app](mailto:contact@markdownpdf.app).
