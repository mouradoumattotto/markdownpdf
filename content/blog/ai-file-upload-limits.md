---
title: ChatGPT, Claude, NotebookLM & Gemini File Upload Limits (2026)
seoTitle: ChatGPT, Claude & NotebookLM Upload Limits
description: ChatGPT, Claude, NotebookLM and Gemini upload limits by plan - file size, files per chat, per 3 hours and per project. Checked against vendor docs.
date: 2026-09-22
updated: 2026-11-21
author: Mourad Oumita
---

You drag a 600-page report into ChatGPT and it is refused. Or worse, it is accepted, and the answers are confidently wrong because only part of it was read. Every AI tool has a ceiling on what you can upload, the ceilings are expressed in different units — tokens, words, megabytes, pages, files per hour — and none of them is displayed while you are uploading.

Here is what each one actually accepts, checked against the vendors' own help pages on **21 November 2026**, with the source for every number. Where a vendor does not publish a figure, this page says so rather than guessing. These limits change without announcement; each link goes to the page to re-check.

## The numbers at a glance

| Tool | Per-file limit | How many files | The detail that catches people out |
|---|---|---|---|
| **ChatGPT** | 512 MB; 2 million tokens per text or document file | 80 files every 3 hours (Free: 3 per day) | The token cap bites long before the size cap |
| **Claude (chat)** | 500 MB; PDFs up to 1,000 pages | 20 files per chat | Charts and images are only analysed up to **100 pages** |
| **Claude Projects** | 30 MB per file | Unlimited, but it must fit the context window | Much stricter per file than a chat upload |
| **NotebookLM** | 500,000 words or 200 MB per source | 50 sources per notebook (free plan) | Splitting a book spends your source slots |
| **Gemini** | 100 MB per file (video: 2 GB) | 10 files per prompt | Without a plan, the context is only 32k tokens |

Sources: [OpenAI Help Center](https://help.openai.com/en/articles/8555545-file-uploads-faq), [Claude Help Center](https://support.claude.com/en/articles/8241126-upload-files-to-claude), [NotebookLM Help](https://support.google.com/notebooklm/answer/16215270), [Gemini Apps Help](https://support.google.com/gemini/answer/14903178).

## ChatGPT file upload limits

| Limit | Value |
|---|---|
| Documents and presentations | 512 MB per file |
| Text and document files | 2 million tokens per file (not applied to spreadsheets) |
| Images | 20 MB per image |
| CSV files and spreadsheets | About 50 MB, depending on row size |
| Upload rate, paid plans | Up to 80 files every 3 hours |
| Upload rate, Free | 3 file uploads per day |
| Storage | 25 GB per user, 100 GB per organization |
| Files per custom GPT | 20 files as knowledge |

Source: [OpenAI File Uploads FAQ](https://help.openai.com/en/articles/8555545-file-uploads-faq).

### ChatGPT Project file limits by plan

| Plan | Files per Project |
|---|---|
| Free | 5 |
| Go and Plus | 25 |
| Edu, Pro, Business and Enterprise | 40 |

Only 10 files can be uploaded at the same time, on any plan. Source: [Projects in ChatGPT](https://help.openai.com/en/articles/10169521-projects-in-chatgpt).

### What the ChatGPT limits mean in practice

- **Free vs Plus.** The difference that matters is the rate, not the size: Free is limited to 3 uploads a day, while paid plans get 80 files every 3 hours. OpenAI publishes no plan-specific per-file caps, so 512 MB and 2 million tokens apply across plans.
- **The 3-hour window is invisible.** OpenAI says ChatGPT does not show how much of the rolling quota you have used, and that it may lower the limit during peak hours. If uploads suddenly stop, that is usually why.
- **Tokens, not megabytes.** A rough rule for English prose is about 1.3 tokens per word, so 2 million tokens is roughly 1.5 million words. A poorly converted PDF inflates that badly: repeated headers, page numbers and broken words all cost tokens while carrying no meaning.
- **Files per message.** OpenAI does not publish a per-message cap on its help pages; the limits it does publish are the rate (80 per 3 hours), the batch size in Projects (10 at once) and the per-Project counts above.

## Claude file upload limits

| Limit | Chat | Projects |
|---|---|---|
| File size | 500 MB per file | 30 MB per file |
| Number of files | Up to 20 per chat | Unlimited, but total content must fit the context window |
| PDF pages | Up to 1,000 | Text extraction only, except multimodal PDFs |
| Images | Up to 8000 × 8000 pixels | — |

Source: [Claude Help Center: Upload files to Claude](https://support.claude.com/en/articles/8241126-upload-files-to-claude).

### What the Claude limits mean in practice

- **The page number that matters is 100, not 1,000.** In PDFs of 100 pages or fewer, Claude analyses the text *and* the charts, diagrams and figures. From 101 to 1,000 pages, it processes the text only. A 300-page report is accepted and answered while every chart in it is silently invisible.
- **Over 1,000 pages is refused** with an "Uploaded file is too large" error.
- **Projects are stricter per file.** 30 MB per file, against 500 MB in a chat — the 30 MB figure that is often quoted as "Claude's limit" is the Projects one.
- **Paid plans stretch Project knowledge.** On paid plans (Pro, Max, Ultra, Team and Enterprise), when project knowledge approaches the context limit Claude switches to retrieval (RAG), which Anthropic says expands capacity by up to 10×. Free accounts can create up to five projects. Source: [What are projects?](https://support.claude.com/en/articles/9517075-what-are-projects)
- **Plan differences.** The help center does not publish different chat upload limits per plan.

## NotebookLM source limits

| Limit | Value |
|---|---|
| Per source | 500,000 words, or 200 MB for an uploaded file |
| Sources per notebook | 50 on the free plan |
| Google Sheets | 100k tokens |
| Google Slides | 100 slides |
| File types | PDF, Markdown (.md), Word (.docx), text, CSV, PowerPoint (.pptx), ePub, images, audio |

Source: [NotebookLM Help: Add or discover new sources](https://support.google.com/notebooklm/answer/16215270).

500,000 words is a lot — roughly five to six full-length novels — so most single documents fit. A 300-page report is usually around 100,000 words. The constraint people hit first is the **number of sources**: split a book into 30 chapters and you have spent most of a free notebook on one document. Split only when a source genuinely exceeds the limit, or when splitting buys you chapter-level citations you can follow.

Paid Google AI plans raise NotebookLM's *usage* limits (two to four times the standard limits, more on Ultra), but the help page does not publish a source count for paid plans.

## Gemini file upload limits

| Limit | Value |
|---|---|
| File size | 100 MB per file; 2 GB per video |
| Files per prompt | Up to 10 |
| Video length | 5 minutes in total; 1 hour on Google AI Pro or Ultra |
| Audio length | 10 minutes in total; 3 hours on Google AI Pro or Ultra |
| ZIP files | Up to 10 files and 100 MB, no audio or video |
| Code folder or GitHub repo | Up to 5,000 files and 100 MB |

Source: [Gemini Apps Help: Attach & analyze files](https://support.google.com/gemini/answer/14903178).

The number that constrains real work is the **context window**, and it depends on the plan: 32k tokens without a plan, 128k on AI Plus, and 1 million on AI Pro and Ultra ([Gemini Apps limits](https://support.google.com/gemini/answer/16275805)). Google's own illustration is that 1 million tokens holds about 1,500 pages of text — in total, not per file. Ten 300-page documents will not all be read closely, whatever the upload dialog allows, and without a plan the window is a small fraction of that.

## What happens when you go over

Three failure modes, in increasing order of how much they cost you:

1. **The upload is refused.** Annoying, but honest — you know immediately.
2. **The file is accepted and truncated.** You get answers built on the first part of the document, with no warning that the rest was dropped. This is the dangerous one: nothing in the response says it only read 40% of your file.
3. **The file is accepted and flattened.** Claude past 100 pages is the clearest example: everything is "read", but the figures are not looked at.

None of these are visible in the answer. The only defence is knowing the limit before you upload.

## The two fixes

### Convert to Markdown first

Limits are counted in words, tokens or bytes — and a PDF is an expensive way to carry text. A PDF stores positioned glyphs, embedded fonts and images; the same content as Markdown is plain text with a few symbols for structure.

Converting first usually does three things at once: the size drops sharply, the headings survive as real headings (which is what lets a model locate an answer inside the document), and the layout noise disappears. Our [PDF to Markdown converter](/) does it in the browser, with OCR for scanned pages, and nothing is uploaded. If you want the evidence behind "Markdown reads better", see [why LLMs read Markdown better than PDF](/blog/why-llms-prefer-markdown), and for a Claude-specific walkthrough, [convert a PDF to Markdown for Claude](/blog/convert-pdf-to-markdown-for-claude). It also works the other way round: ChatGPT, Claude and Gemini answer in Markdown, and [Markdown to PDF](/md-to-pdf) turns a long answer into a PDF you can share.

### Split what is still too large

When a document genuinely exceeds a limit, split it — preferably at chapter boundaries rather than every N pages, so each part is a coherent section and the citation you get back names something you recognise. Cutting a book every 80 pages puts the end of one argument and the start of the next in the same file.

The [Split PDF for AI tool](/split-pdf-for-ai) does this against each tool's real limits: it counts the words, reads the bookmarks, tells you when **no split is needed at all**, and produces parts that respect the ceiling you picked. Like everything here, it runs in your browser — the document is never uploaded, which matters when it is a contract, a medical file or unpublished research.

## A note on scanned documents

If your PDF is a scan, none of the limits above are your real problem. A scanned page contains no text — it is a picture of text. Some tools will run their own OCR on it, with quality you cannot inspect, and some will simply find nothing. Splitting a scan changes nothing about that.

Run OCR yourself first, check the output, and upload text you have seen. The [OCR PDF tool](/ocr-pdf) does it in your browser, and our guide to [extracting text from a scanned PDF](/blog/extract-text-from-scanned-pdf) covers the whole routine, including how to tell a scan from a digital PDF in ten seconds.

## Quick answers

### What is the ChatGPT file upload limit?

512 MB per document and 2 million tokens per text or document file; 20 MB per image; about 50 MB for spreadsheets. Paid plans can upload up to 80 files every 3 hours; Free accounts get 3 uploads per day.

### How many files can I upload to ChatGPT Plus?

Up to 80 files every 3 hours, and up to 25 files in each Project (40 on Pro, Business and Enterprise). A custom GPT holds up to 20 knowledge files.

### What is Claude's file upload limit?

500 MB per file and up to 20 files per chat, with PDFs capped at 1,000 pages. Files added to a Project are limited to 30 MB each.

### How many sources can a NotebookLM notebook hold?

50 sources on the free plan, each up to 500,000 words or 200 MB.

### How big a file can Gemini read?

100 MB per file (2 GB for video), up to 10 files per prompt — but how much it reads closely depends on your plan's context window, from 32k tokens without a plan to 1 million on AI Pro and Ultra.

## Keeping this page honest

Every number above was read from the vendor's own help pages on the date at the top of this article, and every table links to its source. Vendors change these limits quietly and often. If you hit a limit that does not match what is written here, we would rather hear about it than leave a wrong number up: [contact@markdownpdf.app](mailto:contact@markdownpdf.app).
