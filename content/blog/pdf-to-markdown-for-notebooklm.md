---
title: PDF to Markdown for NotebookLM - Better Sources
description: Get better NotebookLM answers by converting PDFs to Markdown first - cleaner sources, headings that survive, OCR for scans, and a free local workflow.
date: 2026-06-11
author: Mourad Oumita
---

NotebookLM answers questions using only the sources you give it, which means the quality of every summary, study guide, and Audio Overview is capped by the quality of those sources. You can upload a PDF directly — NotebookLM accepts them — but what the model actually *sees* after extraction is often messier than what you see on the page. Converting the PDF to Markdown first gives you a source you can inspect, clean, and structure before it ever reaches your notebook.

This guide explains when the extra step is worth it, when it isn't, and the exact workflow to do it for free.

## Why convert at all if NotebookLM accepts PDFs?

When you upload a PDF, NotebookLM extracts the text itself, and that extraction is a black box. You never get to review what survived. Markdown flips that: you convert, you read the result, you fix problems, and only then do you add it as a source. Four things make the difference in practice.

### 1. You can see exactly what the model gets

PDF extraction routinely produces broken line wraps, repeated page headers and footers, page numbers stitched mid-sentence, and multi-column text read in the wrong order. Inside NotebookLM these defects are invisible — you only notice them when an answer comes back muddled or a citation points at garbled text. With a Markdown file, the source *is* the text. If it reads cleanly to you, it reads cleanly to the model.

### 2. Headings survive, so structure survives

NotebookLM interprets Markdown formatting: heading levels, bullet lists, and emphasis carry through to how the source is indexed. A `## Methodology` heading tells the model where a section starts and what it covers. Text extracted from a PDF usually flattens headings into ordinary lines — visually bold on the page, semantically nothing after extraction. Structure is a big part of [why LLMs work better with Markdown than PDF](/blog/why-llms-prefer-markdown), and NotebookLM is no exception.

### 3. You can edit before you upload

This is the underrated one. Before adding a source you can:

- Delete cover pages, tables of contents, legal boilerplate, and reference lists that add noise without adding answers;
- Strip repeated headers, footers, and page numbers;
- Split a 400-page manual into per-chapter files so citations point at the right chapter;
- Merge a dozen short PDFs into one tidy source to save slots.

That last point matters because of source limits: at the time of writing, free NotebookLM accounts get 50 sources per notebook (300 on Plus), with each source capped at 500,000 words or 200 MB. Merging small documents or splitting huge ones lets you spend those slots deliberately instead of however your PDFs happen to be packaged.

### 4. Scanned PDFs become usable

If the PDF is a scan — old course readers, photographed book chapters, archived reports — there may be no real text layer at all, just images of pages. Results from uploading these directly are hit-or-miss. Running OCR during conversion produces an actual text file you can verify and correct. Our converter detects scanned pages and runs OCR automatically; the [guide to extracting text from scanned PDFs](/blog/extract-text-from-scanned-pdf) covers that workflow in detail.

## The workflow, step by step

1. **Convert the PDF.** Open the [PDF to Markdown converter](/pdf-to-markdown) and drop your file in. Conversion happens locally in your browser — the file is never uploaded to a server, which matters if you're prepping confidential reports or unpublished research. Scanned pages are OCR'd automatically.
2. **Read the output.** Skim the whole result. Check that headings became `##` lines, lists became bullets, and nothing important vanished. Pay extra attention to tables and anything that was multi-column in the original.
3. **Clean it up.** Delete boilerplate, fix any broken paragraphs, and make sure every section has a real heading. Five minutes here pays off in every future answer.
4. **Split or merge if needed.** One file per chapter is a good default for long documents; one combined file works well for stacks of short memos on the same topic.
5. **Add it to NotebookLM.** Save as a `.md` file and upload it as a source (NotebookLM accepts Markdown and plain text directly), or paste the text using the copied-text source option.
6. **Spot-check with a question.** Ask something whose answer you know sits in a specific section, and confirm the citation lands where it should.

## Direct PDF upload vs. converting first

| | Upload PDF directly | Convert to Markdown first |
|---|---|---|
| Effort | None | A few minutes per document |
| Visibility into extracted text | None | Full — you read what the model reads |
| Headings and structure | Usually flattened | Preserved as real Markdown headings |
| Scanned/image-only PDFs | Unreliable | OCR produces verifiable text |
| Remove boilerplate and noise | Impossible | Easy |
| Split/merge to manage source slots | No | Yes |
| Best for | Clean, digital, throwaway docs | Sources you'll query repeatedly |

## When uploading the PDF directly is fine

Converting everything would be overkill. Skip the conversion when:

- The PDF is born-digital, single-column, and mostly prose — a typical article or e-book chapter extracts reasonably well;
- It's a one-off — you'll ask two questions and delete the notebook;
- You tested it and the answers and citations already look right.

The conversion step earns its keep on the documents you'll lean on for weeks: textbooks for a course, a pile of papers for a literature review, product documentation, or anything scanned.

## FAQ

### Does NotebookLM support Markdown files?

Yes. NotebookLM accepts `.md` files as sources alongside PDFs, `.txt`, Word documents, Google Docs, web URLs, YouTube links, and audio. Markdown formatting is interpreted, so heading levels and lists inform how the source is structured rather than arriving as flat text. The same converted file works just as well if you also [feed it to ChatGPT](/blog/convert-pdf-to-markdown-for-chatgpt).

### Can NotebookLM read scanned PDFs?

Sometimes, but unreliably — a scan with no text layer gives any tool very little to work with, and you can't see what was recovered. Running OCR yourself during a [PDF to Markdown conversion](/pdf-to-markdown) produces text you can verify before it becomes a source, which is the safer path for course readers and archived documents.

### What are NotebookLM's source limits?

At the time of writing: 50 sources per notebook on the free plan and 300 on NotebookLM Plus, with each source limited to 500,000 words or 200 MB per uploaded file. Converting to Markdown lets you merge small documents or split enormous ones so the limits work in your favor.

### My PDF is digital and clean — is converting still worth it?

If you'll query the document repeatedly, usually yes, because of structure: real Markdown headings give NotebookLM section boundaries that flat extracted text doesn't. For a quick one-off question, upload the PDF directly and only convert if the answers come back confused.
