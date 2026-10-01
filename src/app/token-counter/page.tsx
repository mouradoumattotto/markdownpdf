import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import TokenCounterTool from "@/components/TokenCounterTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Count tokens exactly with OpenAI's tokenizers — for pasted text, PDFs and Word files — with an honest estimate for Claude and Gemini. Free, nothing uploaded.";

export const metadata: Metadata = {
  // DataForSEO 2026-09-26 (US): "token counter" 5,400/mo (KD 19), "openai token
  // counter" 590, "claude token counter" 320 (KD 7), "gemini token counter" 140.
  title: "Token Counter for OpenAI, Claude & Gemini",
  description: DESCRIPTION,
  alternates: { canonical: "/token-counter" },
  openGraph: {
    title: "Token counter for text, PDFs and Word files",
    description: "Exact OpenAI token counts, computed in your browser.",
    url: "/token-counter",
  },
};

const faqItems = [
  {
    question: "What is a token?",
    answer:
      "The unit language models read and bill by. A tokenizer cuts text into common fragments: a frequent English word is often one token, a rare word several, and punctuation, digits and spaces count too. On typical English prose, one token is about three quarters of a word; code, numbers and many non-Latin scripts use more tokens per word.",
  },
  {
    question: "How exact are the numbers?",
    answer:
      "The two OpenAI counts use OpenAI’s published tokenizers — o200k_base (GPT-4o, GPT-4.1 and the o-series) and cl100k_base (GPT-4, GPT-3.5 and the text-embedding-3 models) — so they are exact for the text itself. An API request adds a few tokens of message formatting on top.",
  },
  {
    question: "Why is Claude or Gemini only an estimate?",
    answer:
      "Anthropic and Google do not publish tokenizers that can run offline in a browser; exact counts come from their APIs, which would mean sending your text to them. The range shown (0.9× to 1.35× the o200k count) covers typical differences between modern tokenizers — treat it as a planning figure, not a bill.",
  },
  {
    question: "Can I count the tokens in a PDF?",
    answer:
      "Yes. Drop the PDF and its text is extracted exactly as PDF to Markdown would do it — with OCR for scanned pages — and then counted. Word, HTML, Markdown, CSV, JSON and plain-text files work too.",
  },
  {
    question: "Is my text sent anywhere?",
    answer:
      "No. The tokenizer is downloaded from this site once (about 2 MB, then cached) and runs in your browser, in a background thread so typing stays smooth. Your text never leaves your device.",
  },
  {
    question: "My document has too many tokens. What now?",
    answer:
      "Split it. The Markdown Chunker cuts text into pieces of a set token size at headings and paragraphs; Split PDF for AI cuts a PDF into parts that fit ChatGPT, Claude, NotebookLM or Gemini upload limits.",
  },
];

export default function TokenCounterPage() {
  const tool = getTool("token-counter")!;
  return (
    <>
      <ToolJsonLd slug="token-counter" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            Token{" "}
            Counter
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            How many tokens is this prompt, this PDF, this Word document? Exact counts with OpenAI&apos;s tokenizers,
            an honest estimate for other models, and nothing uploaded.
          </p>
          <div className="mt-10">
            <TokenCounterTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">Why count tokens?</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Context windows, rate limits and prices are all measured in tokens, and words are a poor proxy: the
            same 1,000 words can be 1,300 tokens of English prose or 3,000 tokens of JSON. Counting before you paste
            tells you whether a document will fit, how much of the context it leaves for the answer, and what an API
            call will cost.
          </p>
          <h3>OpenAI, Claude and Gemini count differently</h3>
          <p>
            Every model family has its own tokenizer, so the same text is a different number of tokens in each.
            OpenAI publishes its tokenizers, which is why this counter gives exact figures for GPT-4o, GPT-4.1 and
            the o-series (<code>o200k_base</code>) and for GPT-4 and GPT-3.5 (<code>cl100k_base</code>). Anthropic
            and Google do not ship tokenizers that run offline: an exact Claude token count comes from
            Anthropic&apos;s token-counting API endpoint, and an exact Gemini count from the Gemini API&apos;s{" "}
            <code>countTokens</code> method — both of which mean sending the text to them. Here, Claude and Gemini
            get a range derived from the OpenAI count instead, clearly marked as an estimate.
          </p>
          <h3>Rules of thumb</h3>
          <p>
            Useful for a first guess, never for a bill — the exact figure depends on the text and the tokenizer:
          </p>
          <table>
            <thead>
              <tr>
                <th>Content</th>
                <th>Typical tokens</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>English prose</td>
                <td>about 1.3 tokens per word (roughly 4 characters per token)</td>
              </tr>
              <tr>
                <td>1,000 words of English</td>
                <td>about 1,300 tokens</td>
              </tr>
              <tr>
                <td>A dense page of a PDF</td>
                <td>about 500 to 800 tokens of text</td>
              </tr>
              <tr>
                <td>Code, JSON, tables of numbers</td>
                <td>noticeably more per word than prose</td>
              </tr>
              <tr>
                <td>Non-Latin scripts (Arabic, Chinese, Hindi…)</td>
                <td>often several times more than English for the same meaning</td>
              </tr>
            </tbody>
          </table>
          <h3>How to count the tokens in a PDF or Word file</h3>
          <ol>
            <li>Drop the PDF, Word, Markdown, HTML, CSV or text file on the counter above.</li>
            <li>
              Its text is extracted in your browser — scanned PDF pages go through OCR — and placed in the text
              box, where you can trim what you do not need.
            </li>
            <li>
              Read the counts: exact for OpenAI models, a range for Claude and Gemini, plus words, characters and
              lines.
            </li>
          </ol>
          <p>
            Only the text is counted. When you upload a PDF to ChatGPT, Claude or Gemini, page images may be sent
            to the model as well and add their own tokens, so treat the figure as the minimum.
          </p>
          <h3>Make documents cheaper to read</h3>
          <p>
            Format matters as much as length. A PDF pasted as raw text carries broken lines, headers and footers on
            every page; the same document as clean Markdown is usually shorter and easier for a model to follow — see{" "}
            <Link href="/blog/why-llms-prefer-markdown">why LLMs prefer Markdown</Link>. Convert with{" "}
            <Link href="/">PDF to Markdown</Link> or <Link href="/docx-to-markdown">Word to Markdown</Link>, then
            count again.
          </p>
        </div>
      </section>

      <AdSlot placement="tool" />

      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-xl font-extrabold text-neutral-900">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-600">
          <li>Exact counts for OpenAI tokenizers only; Claude, Gemini and open models are estimated.</li>
          <li>Images inside documents are not counted — only their text.</li>
          <li>The tokenizer (about 2 MB) is downloaded the first time you use the tool.</li>
        </ul>
      </section>

      <RelatedTools slug="token-counter" />
      <ToolGuides slug="token-counter" />
    </>
  );
}
