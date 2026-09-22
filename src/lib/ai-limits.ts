/**
 * Upload limits of AI tools, as published by their vendors.
 *
 * Checked on CHECKED_ON against the pages in `source`. These change often:
 * re-verify before editing, keep the date honest, and never state a limit
 * here that the vendor page does not state. Where a limit is expressed in
 * tokens, the word equivalent is an estimate and is labelled as such.
 */

export const CHECKED_ON = "2026-09-18";

const MB = 1024 * 1024;

export interface AiTarget {
  id: string;
  name: string;
  /** Hard per-file limits the split must respect. */
  maxBytes?: number;
  maxWords?: number;
  maxPages?: number;
  /** Shown next to the limits: what they mean in practice. */
  summary: string;
  /** Extra context worth knowing (plan differences, soft limits). */
  note?: string;
  source: { label: string; url: string };
  /** True when a limit is derived rather than stated (e.g. tokens -> words). */
  estimated?: boolean;
}

// ChatGPT states 2M tokens per text/document file. English prose averages
// ~1.3 tokens per word; 1.5M words keeps a safety margin under 2M tokens.
const CHATGPT_WORDS = 1_500_000;

export const AI_TARGETS: AiTarget[] = [
  {
    id: "notebooklm",
    name: "NotebookLM",
    maxWords: 500_000,
    maxBytes: 200 * MB,
    summary: "500,000 words or 200 MB per source",
    note: "Up to 50 sources per notebook on the free plan; paid plans allow more.",
    source: {
      label: "NotebookLM Help: Add or discover new sources",
      url: "https://support.google.com/notebooklm/answer/16215270",
    },
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    maxBytes: 512 * MB,
    maxWords: CHATGPT_WORDS,
    estimated: true,
    summary: "512 MB and 2 million tokens per file",
    note: "The token cap is converted to about 1.5 million words, an estimate for English text.",
    source: { label: "OpenAI Help Center: File Uploads FAQ", url: "https://help.openai.com/en/articles/8555545-file-uploads-faq" },
  },
  {
    id: "claude",
    name: "Claude (chat)",
    maxPages: 100,
    maxBytes: 500 * MB,
    summary: "Charts and images are read only in PDFs of 100 pages or fewer",
    note: "Claude accepts PDFs up to 1,000 pages and 500 MB in a chat, but beyond 100 pages it reads the text only. Parts of 100 pages keep every chart and figure visible to it.",
    source: { label: "Claude Help Center: Upload files to Claude", url: "https://support.claude.com/en/articles/8241126-upload-files-to-claude" },
  },
  {
    id: "claude-projects",
    name: "Claude Projects",
    maxBytes: 30 * MB,
    maxPages: 1000,
    summary: "30 MB per file in a Project",
    source: { label: "Claude Help Center: Upload files to Claude", url: "https://support.claude.com/en/articles/8241126-upload-files-to-claude" },
  },
  {
    id: "gemini",
    name: "Gemini",
    maxBytes: 100 * MB,
    summary: "100 MB per file, up to 10 files per prompt",
    note: "Gemini's default context holds roughly 1,500 pages of text in total.",
    source: { label: "Gemini Apps Help: Upload & analyze files", url: "https://support.google.com/gemini/answer/14903178" },
  },
];

export function getTarget(id: string): AiTarget | undefined {
  return AI_TARGETS.find((t) => t.id === id);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`;
}
