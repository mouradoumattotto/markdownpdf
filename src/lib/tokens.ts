/**
 * Token counting and chunking for AI tools, in the browser.
 *
 * OpenAI counts are exact: they use OpenAI's own published encodings
 * (o200k_base, cl100k_base) through js-tiktoken, loaded only when needed
 * (~2 MB, cached by the browser). Anthropic and Google do not publish their
 * tokenizers for offline use, so for Claude and Gemini the numbers are
 * estimates and are labelled as such everywhere they appear.
 */

export type Encoding = "o200k_base" | "cl100k_base";

export interface Tokenizer {
  encoding: Encoding;
  count(text: string): number;
}

const cache = new Map<Encoding, Promise<Tokenizer>>();

export function loadTokenizer(encoding: Encoding): Promise<Tokenizer> {
  let t = cache.get(encoding);
  if (!t) {
    t = (async () => {
      const [{ Tiktoken }, ranks] = await Promise.all([
        import("js-tiktoken/lite"),
        encoding === "o200k_base" ? import("js-tiktoken/ranks/o200k_base") : import("js-tiktoken/ranks/cl100k_base"),
      ]);
      const enc = new Tiktoken(ranks.default);
      // Special-token strings such as "<|endoftext|>" are counted as the plain
      // text they are in a document, not rejected.
      return { encoding, count: (text: string) => enc.encode(text, [], []).length };
    })();
    cache.set(encoding, t);
    t.catch(() => cache.delete(encoding));
  }
  return t;
}

/**
 * Estimated range for models without a public tokenizer (Claude, Gemini,
 * open models). Their tokenizers are different BPE vocabularies; on typical
 * English they land in the same neighbourhood as OpenAI's o200k_base, and can
 * be noticeably higher on code, numbers and non-Latin scripts. A range scaled
 * from the exact o200k_base count says that honestly; a single number would
 * suggest a precision nobody outside those companies has.
 */
export const ESTIMATE_RANGE = [0.9, 1.35] as const;

export function estimateRange(o200kTokens: number): [number, number] {
  return [Math.floor(o200kTokens * ESTIMATE_RANGE[0]), Math.ceil(o200kTokens * ESTIMATE_RANGE[1])];
}

export interface TextStats {
  characters: number;
  words: number;
  lines: number;
}

export function textStats(text: string): TextStats {
  const trimmed = text.trim();
  return {
    characters: [...text].length,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    lines: text ? text.split(/\r\n|\r|\n/).length : 0,
  };
}

// ---------------------------------------------------------------------------
// Chunking

export interface ChunkOptions {
  /** Maximum tokens per chunk (target, never exceeded unless one sentence alone is longer). */
  maxTokens: number;
  /** Tokens of overlap carried from the end of one chunk into the next. */
  overlapTokens: number;
  /** Repeat the chunk's heading path ("# A > ## B") at its top, so each chunk is self-describing. */
  headingContext: boolean;
}

export interface Chunk {
  index: number;
  text: string;
  tokens: number;
  /** The headings this chunk sits under, outermost first. */
  headings: string[];
}

interface Block {
  text: string;
  headings: string[];
  /** True for a heading line itself. */
  heading: boolean;
}

/**
 * Splits Markdown into blocks — headings, paragraphs, lists, tables, fenced
 * code — never cutting inside a code fence or a table, and records the heading
 * path each block lives under.
 */
export function markdownBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  const path: { level: number; text: string }[] = [];
  let buf: string[] = [];
  let fence: string | null = null;

  const flush = () => {
    const text = buf.join("\n").trim();
    if (text) blocks.push({ text, headings: path.map((h) => h.text), heading: false });
    buf = [];
  };

  for (const line of lines) {
    if (fence) {
      buf.push(line);
      if (line.trimStart().startsWith(fence)) {
        fence = null;
        flush();
      }
      continue;
    }
    const open = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (open) {
      flush();
      fence = open[1];
      buf.push(line);
      continue;
    }
    const h = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) {
      flush();
      const level = h[1].length;
      while (path.length && path[path.length - 1].level >= level) path.pop();
      path.push({ level, text: `${h[1]} ${h[2]}` });
      blocks.push({ text: line.trim(), headings: path.slice(0, -1).map((p) => p.text), heading: true });
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    buf.push(line);
  }
  flush();
  return blocks;
}

/** Sentence-ish pieces, for blocks too long to fit in one chunk. */
function splitLong(text: string, maxTokens: number, count: (s: string) => number): string[] {
  const sentences = text.match(/[^.!?。！？\n]+(?:[.!?。！？]+|\n|$)\s*/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && count(cur + s) > maxTokens) {
      out.push(cur.trim());
      cur = "";
    }
    if (count(s) > maxTokens) {
      // A single enormous "sentence" (minified code, a table row): cut by words.
      const words = s.split(/(\s+)/);
      for (const w of words) {
        if (cur && count(cur + w) > maxTokens) {
          out.push(cur.trim());
          cur = "";
        }
        cur += w;
      }
    } else cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** The last ~n tokens of a text, cut at a word boundary. */
function tail(text: string, n: number, count: (s: string) => number): string {
  if (n <= 0) return "";
  const words = text.split(/(\s+)/);
  let out = "";
  for (let i = words.length - 1; i >= 0; i--) {
    const next = words[i] + out;
    if (count(next) > n) break;
    out = next;
  }
  return out.trim();
}

export function chunkMarkdown(markdown: string, options: ChunkOptions, count: (s: string) => number): Chunk[] {
  const max = Math.max(16, Math.floor(options.maxTokens));
  const overlap = Math.max(0, Math.min(Math.floor(options.overlapTokens), Math.floor(max / 2)));
  const chunks: Chunk[] = [];
  let parts: string[] = [];
  let headings: string[] = [];
  let carry = "";

  const header = (hs: string[]) => (options.headingContext && hs.length ? hs.join(" > ") + "\n\n" : "");
  const emit = () => {
    const body = parts.join("\n\n").trim();
    if (!body) return;
    const text = (header(headings) + (carry ? carry + "\n\n" : "") + body).trim();
    chunks.push({ index: chunks.length, text, tokens: count(text), headings });
    carry = tail(body, overlap, count);
    parts = [];
  };
  const room = (extra: string) =>
    count(header(headings) + (carry ? carry + "\n\n" : "") + [...parts, extra].join("\n\n")) <= max;

  for (const block of markdownBlocks(markdown)) {
    // A heading starts a new section: close the current chunk first, so no
    // chunk ends with a heading whose content is in the next one.
    const context = block.headings;
    if (block.heading && parts.length) {
      emit();
      carry = "";
    }
    if (!parts.length) headings = context;
    if (room(block.text)) {
      parts.push(block.text);
      continue;
    }
    if (parts.length) emit();
    headings = context;
    if (room(block.text)) {
      parts.push(block.text);
      continue;
    }
    // Still too long on its own: split it into sentence-sized pieces.
    // The budget reserves room for the overlap that each following chunk will carry.
    const budget = Math.max(8, max - count(header(headings)) - overlap - 4);
    for (const piece of splitLong(block.text, budget, count)) {
      if (!room(piece) && parts.length) emit();
      parts.push(piece);
    }
  }
  emit();
  return chunks;
}
