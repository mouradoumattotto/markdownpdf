/**
 * Markdown -> HTML for the preview and the "Save as PDF" (browser) export, and
 * the token stream for the quick jsPDF export. One parser, so both exports see
 * exactly the same document.
 *
 * Adds to GFM:
 *   - math: `$inline$` and `$$display$$` (pandoc rules, so "$5 and $10" stays text)
 *   - ```mermaid fenced blocks -> diagrams
 *   - syntax highlighting of fenced code (highlight.js, loaded on demand)
 *
 * Uses its own Marked instance: the global `marked` also renders the blog at
 * build time and must not pick up these extensions.
 */

import { Marked, type MarkedExtension, type Token, type Tokens } from "marked";

export interface MathToken extends Tokens.Generic {
  type: "inlineMath" | "blockMath";
  raw: string;
  text: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Diagram and formula sources travel to the hydration step in data-*
 * attributes. They are URI-encoded, not HTML-escaped: DOMPurify drops any
 * attribute whose value contains "-->" (mXSS protection), which is exactly
 * how every Mermaid arrow is written — the diagrams silently vanished.
 */
export const encodeSource = (s: string) => encodeURIComponent(s);
export const decodeSource = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/**
 * Pandoc's rule for inline math: the opening $ must be followed by a non-space,
 * the closing $ preceded by a non-space and not followed by a digit. That keeps
 * prices ("costs $5 and $10") as plain text.
 */
const INLINE_MATH = /^\$(?!\s)((?:\\.|[^\\$\n])+?)(?<!\s)\$(?!\d)/;
const BLOCK_MATH = /^\$\$([\s\S]+?)\$\$[ \t]*(?:\n|$)/;

const mathExtension: MarkedExtension = {
  extensions: [
    {
      name: "blockMath",
      level: "block",
      start: (src) => src.match(/^\$\$/m)?.index,
      tokenizer(src) {
        const m = BLOCK_MATH.exec(src);
        if (m) return { type: "blockMath", raw: m[0], text: m[1].trim() };
      },
      renderer: (t) => `<div class="math-display" data-tex="${encodeSource(t.text)}"></div>\n`,
    },
    {
      name: "inlineMath",
      level: "inline",
      start: (src) => src.indexOf("$"),
      tokenizer(src) {
        const m = INLINE_MATH.exec(src);
        if (m) return { type: "inlineMath", raw: m[0], text: m[1] };
      },
      renderer: (t) => `<span class="math-inline" data-tex="${encodeSource(t.text)}"></span>`,
    },
  ],
};

export type Highlighter = (code: string, lang: string) => string | null;

function codeExtension(highlight: Highlighter | null): MarkedExtension {
  return {
    renderer: {
      code({ text, lang }) {
        const language = (lang ?? "").trim().split(/\s+/)[0].toLowerCase();
        if (language === "mermaid") {
          return `<div class="mermaid-block" data-code="${encodeSource(text)}"></div>\n`;
        }
        const highlighted = language && highlight ? highlight(text, language) : null;
        const cls = language ? ` class="hljs language-${escapeHtml(language)}"` : ' class="hljs"';
        return `<pre><code${cls}>${highlighted ?? escapeHtml(text)}</code></pre>\n`;
      },
    },
  };
}

export function createMarked(highlight: Highlighter | null = null): Marked {
  return new Marked({ gfm: true, breaks: false }, mathExtension, codeExtension(highlight));
}

/** Token stream for the jsPDF exporter (same parser as the HTML preview). */
export function lexMarkdown(markdown: string): Token[] {
  return createMarked().lexer(markdown);
}

// ---- What does this document need? -----------------------------------------

export interface DocFeatures {
  mermaid: number;
  math: number;
  images: number;
  code: number;
  /** Characters outside Windows-1252: the quick export must embed a Unicode font. */
  needsUnicodeFont: boolean;
  /** Scripts that need shaping or right-to-left layout, which jsPDF cannot do. */
  complexScript: "arabic" | "hebrew" | "indic" | "thai" | "cjk" | null;
}

// Windows-1252 = Latin-1 plus these; jsPDF's standard fonts cover exactly that.
const WIN1252_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const COMPLEX: [DocFeatures["complexScript"], RegExp][] = [
  ["arabic", /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE]/],
  ["hebrew", /[\u0590-\u05FF]/],
  ["indic", /[\u0900-\u0DFF]/],
  ["thai", /[\u0E00-\u0E7F]/],
  ["cjk", /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/],
];

export function needsUnicodeFont(text: string): boolean {
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c <= 0xff) continue;
    if (WIN1252_EXTRA.includes(ch)) continue;
    // Emoji and other astral symbols: dropped by the quick export (documented).
    if (c > 0xffff) continue;
    return true;
  }
  return false;
}

export function detectFeatures(markdown: string): DocFeatures {
  const tokens = lexMarkdown(markdown);
  const f: DocFeatures = { mermaid: 0, math: 0, images: 0, code: 0, needsUnicodeFont: false, complexScript: null };
  const walk = (list: Token[] | undefined) => {
    for (const t of list ?? []) {
      if (t.type === "code") (t as Tokens.Code).lang?.trim().startsWith("mermaid") ? f.mermaid++ : f.code++;
      else if (t.type === "inlineMath" || t.type === "blockMath") f.math++;
      else if (t.type === "image") f.images++;
      const nested = t as { tokens?: Token[]; items?: Tokens.ListItem[]; header?: Tokens.TableCell[]; rows?: Tokens.TableCell[][] };
      walk(nested.tokens);
      nested.items?.forEach((i) => walk(i.tokens));
      nested.header?.forEach((c) => walk(c.tokens));
      nested.rows?.forEach((r) => r.forEach((c) => walk(c.tokens)));
    }
  };
  walk(tokens);
  for (const [name, re] of COMPLEX) {
    if (re.test(markdown)) {
      f.complexScript = name;
      break;
    }
  }
  f.needsUnicodeFont = needsUnicodeFont(markdown);
  return f;
}
