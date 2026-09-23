---
title: "How to Chunk Documents for RAG: Sizes, Overlap and Structure"
seoTitle: How to Chunk Documents for RAG
description: A practical guide to splitting documents for retrieval-augmented generation - chunk sizes, overlap, heading context, and why structure beats fixed-size splits.
date: 2026-09-23
updated: 2026-09-23
author: Mourad Oumita
---

Retrieval-augmented generation (RAG) answers questions from your own documents in three steps: cut the documents into chunks, store an embedding of each chunk, and at question time hand the most similar chunks to the model. The model never sees your documents — only the chunks retrieval picked. So the way you cut them decides what the model can know.

Most RAG problems that look like "the model is hallucinating" are chunking problems: the right passage was split in two, buried in a chunk about something else, or cut away from the heading that said what it was about.

## Start from structure, not from a PDF

A chunker can only respect structure that exists. Plain text extracted from a PDF has lost it: headings look like any other line, tables are flattened into runs of numbers, and every page carries its header and footer. Converting to Markdown first restores the signal a chunker needs — `#` headings, list items, tables as tables.

That is the first step of the pipeline described in [PDF to Markdown for RAG pipelines](/blog/pdf-to-markdown-for-rag-pipelines), and it is what the [Markdown chunker](/markdown-chunker) on this site does when you drop a PDF on it: the PDF is converted (with OCR for scanned pages) before it is split.

## The three ways to split

**Fixed-size.** Every N characters or tokens, wherever that falls. Simple and predictable, and the worst for retrieval: chunks start mid-sentence and end mid-table.

**Recursive.** Try to split on the largest separator (a blank line), fall back to smaller ones (a line break, a sentence, a word) only when a piece is still too big. This is the default in most frameworks and a good baseline.

**Structure-aware.** Use the document's own sections: a new heading always starts a new chunk, and blocks — paragraphs, lists, tables, code — are packed together without being cut, until the next one would not fit. Only a block larger than a whole chunk is split, at sentences. This keeps each chunk about one thing, which is what makes retrieval precise.

## Choosing a chunk size

There is no universal best size. The trade-off:

- **Smaller chunks (≈200–400 tokens)** are about one thing, so they match specific questions well — but they can lose the context needed to answer.
- **Larger chunks (≈800–1,500 tokens)** carry more context — but a chunk about three things is only a weak match for any one of them, and every retrieved chunk costs context window.

Most pipelines land between 256 and 1,000 tokens. Two practical constraints narrow it down:

1. **Your embedding model's input limit.** OpenAI's text-embedding-3 models accept up to 8,191 tokens; many open models accept 512. Text beyond the limit is truncated or rejected, silently in some libraries.
2. **How many chunks you retrieve.** Five chunks of 1,000 tokens is 5,000 tokens of context before the question and the answer.

Measure chunk sizes in tokens, not characters: the same number of characters is very different in tokens for prose, code, tables and non-Latin scripts. The [token counter](/token-counter) shows the difference on your own text.

## Overlap

Overlap repeats the end of one chunk at the start of the next, so a sentence that straddles a boundary can be found from either side. 10–15% of the chunk size is a common starting point — about 50 tokens on a 512-token chunk.

Overlap is a patch for boundaries in the wrong place. With structure-aware splitting, most boundaries are at headings and paragraph breaks, where nothing straddles; overlap then matters less. It should never cross a heading: the start of a new section has nothing to gain from the end of the previous one.

## Put the headings back into every chunk

A chunk that reads "Set it to 30 seconds and retry twice" is useless on its own. Retrieved for the question "what is the API timeout?", it may not even be found — the words *API* and *timeout* are in the heading, not in the chunk.

The fix is cheap: prefix each chunk with its heading path.

```
# API guide > ## Retries

Set it to 30 seconds and retry twice.
```

The chunk now carries its own context, for the embedding and for the model reading it. It costs a few tokens per chunk and is one of the most effective changes you can make.

## Keep code and tables whole

Half a function or half a table is worse than none: the model will confidently complete it. A structure-aware chunker treats a fenced code block or a table as a single block and moves it to the next chunk rather than cutting it. Only a block larger than a whole chunk has to be split — and if that happens often, the chunk size is too small for your content.

## Store what you will need later

For each chunk, keep more than the text:

- **An id** and the **source document**, so an answer can cite where it came from.
- **The heading path**, for display and for filtering ("only search the Security section").
- **The token count**, to budget the context window at query time.

JSONL — one JSON object per line — is the simplest interchange format; vector databases, LangChain and LlamaIndex all load it in a few lines. The [Markdown chunker](/markdown-chunker) exports exactly that:

```json
{"id": 12, "text": "# API guide > ## Retries\n\nSet it to 30 seconds…", "tokens": 186, "headings": ["# API guide", "## Retries"], "encoding": "o200k_base"}
```

## Test with real questions

Chunking is tuned, not calculated. Write twenty questions your users actually ask, run retrieval, and read what comes back for each. If the right passage is missing, look at how it was cut. If it is present but drowned in unrelated text, make chunks smaller or split more on structure. Change one setting at a time.

## A sensible default

If you need a starting point today:

1. Convert documents to Markdown.
2. Split at headings, then paragraphs, with a 512-token limit.
3. Overlap 50 tokens within a section, none across headings.
4. Prefix each chunk with its heading path.
5. Keep code blocks and tables whole.
6. Store id, source, headings and token count with each chunk.

Then measure, and adjust from there. Everything above runs in your browser with the [Markdown chunker](/markdown-chunker) — no upload, and no code to write for the first experiment.
