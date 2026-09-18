// Client-side Markdown → PDF, "quick" engine.
//
// Parses Markdown with the shared lexer (src/lib/markdown-render.ts) and lays the
// tokens out with jsPDF, so body text is real vector text: selectable,
// searchable, small. Since 2026-09-18 it also embeds images, renders math and
// Mermaid diagrams (as high-resolution images), colours code, draws task-list
// checkboxes and strikethrough, and switches to an embedded Unicode font
// (DejaVu) when the text goes beyond Windows-1252 — the built-in PDF fonts
// printed Greek, Cyrillic or arrows as garbage.
//
// What it cannot do: scripts that need shaping or right-to-left layout
// (Arabic, Hebrew, Indic, Thai) and CJK. For those the UI routes users to the
// browser engine ("Save as PDF"), which handles every script.

import type { jsPDF } from "jspdf";
import type { Token, Tokens } from "marked";
import { detectFeatures, lexMarkdown, type MathToken } from "@/lib/markdown-render";
import type { ImageAssets, RasterImage } from "@/lib/markdown-rich";

const PAGE = { width: 595.28, height: 841.89 }; // A4 in points
const MARGIN = { top: 64, right: 60, bottom: 64, left: 60 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;
const USABLE_HEIGHT = PAGE.height - MARGIN.top - MARGIN.bottom;

const BODY_SIZE = 11;
const LINE_HEIGHT = 1.5;
const CODE_SIZE = 9.5;
const PX_TO_PT = 0.75;

const HEADING_SIZES: Record<number, number> = { 1: 24, 2: 18, 3: 14.5, 4: 12.5, 5: 11.5, 6: 11 };

interface StyledWord {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
  strike?: boolean;
  href?: string;
  /** Inline math rendered as an image; `text` is kept for measuring fallback. */
  image?: InlineImage;
}

interface InlineImage extends RasterImage {
  /** Baseline offset in pt (positive = below the baseline). */
  descent: number;
  widthPt: number;
  heightPt: number;
}

interface Fonts {
  sans: string;
  mono: string;
}

interface Prepared {
  images: Map<Token, RasterImage | null>;
  math: Map<Token, InlineImage | null>;
  diagrams: Map<Token, RasterImage | null>;
  highlight: ((code: string, lang: string) => string | null) | null;
}

interface LayoutState {
  doc: jsPDF;
  y: number;
  fonts: Fonts;
  prep: Prepared;
}

export interface MarkdownPdfResult {
  blob: Blob;
  pageCount: number;
  warnings: {
    missingImages: string[];
    failedDiagrams: number;
    failedMath: number;
    droppedSymbols: boolean;
  };
}

export class UnsupportedScriptError extends Error {
  constructor(public script: string) {
    super(`Quick export cannot lay out ${script} text`);
    this.name = "UnsupportedScriptError";
  }
}

export async function convertMarkdownToPdf(
  markdown: string,
  options: { title?: string; assets?: ImageAssets } = {},
): Promise<MarkdownPdfResult> {
  const features = detectFeatures(markdown);
  if (features.complexScript) throw new UnsupportedScriptError(features.complexScript);

  const { jsPDF: JsPDF } = await import("jspdf");
  const doc = new JsPDF({ unit: "pt", format: "a4", compress: true });
  doc.setProperties({ title: options.title || "Document", creator: "markdownpdf.app" });

  const tokens = lexMarkdown(markdown);
  const warnings: MarkdownPdfResult["warnings"] = {
    missingImages: [],
    failedDiagrams: 0,
    failedMath: 0,
    droppedSymbols: /[\u{10000}-\u{10FFFF}]/u.test(markdown),
  };
  const prep = await prepare(tokens, options.assets ?? new Map(), markdown, warnings);
  const fonts = features.needsUnicodeFont ? await embedUnicodeFonts(doc, tokens) : { sans: "helvetica", mono: "courier" };

  const state: LayoutState = { doc, y: MARGIN.top, fonts, prep };
  renderTokens(state, tokens, MARGIN.left, CONTENT_WIDTH);

  return { blob: doc.output("blob"), pageCount: doc.getNumberOfPages(), warnings };
}

// ---- Preparation (async): everything that needs loading or rendering ----------

function walkTokens(tokens: Token[] | undefined, visit: (t: Token) => void) {
  for (const t of tokens ?? []) {
    visit(t);
    const n = t as { tokens?: Token[]; items?: Tokens.ListItem[]; header?: Tokens.TableCell[]; rows?: Tokens.TableCell[][] };
    walkTokens(n.tokens, visit);
    n.items?.forEach((i) => walkTokens(i.tokens, visit));
    n.header?.forEach((c) => walkTokens(c.tokens, visit));
    n.rows?.forEach((r) => r.forEach((c) => walkTokens(c.tokens, visit)));
  }
}

async function prepare(
  tokens: Token[],
  assets: ImageAssets,
  markdown: string,
  warnings: MarkdownPdfResult["warnings"],
): Promise<Prepared> {
  const prep: Prepared = { images: new Map(), math: new Map(), diagrams: new Map(), highlight: null };
  const images: Tokens.Image[] = [];
  const maths: MathToken[] = [];
  const diagrams: Tokens.Code[] = [];
  let hasCode = false;
  walkTokens(tokens, (t) => {
    if (t.type === "image") images.push(t as Tokens.Image);
    else if (t.type === "inlineMath" || t.type === "blockMath") maths.push(t as MathToken);
    else if (t.type === "code") {
      const lang = ((t as Tokens.Code).lang ?? "").trim().toLowerCase();
      if (lang === "mermaid") diagrams.push(t as Tokens.Code);
      else if (lang) hasCode = true;
    }
  });
  if (!images.length && !maths.length && !diagrams.length && !hasCode) return prep;

  const rich = await import("@/lib/markdown-rich");
  if (hasCode) prep.highlight = await rich.loadHighlighter(rich.codeLanguages(markdown));

  for (const img of images) {
    const raster = await rich.rasterizeImage(img.href, assets);
    if (!raster) warnings.missingImages.push(img.href);
    prep.images.set(img, raster);
  }
  for (const m of maths) {
    const display = m.type === "blockMath";
    try {
      const svg = await rich.renderMath(m.text, display);
      const size = rich.svgSize(svg, BODY_SIZE / PX_TO_PT / 2);
      const raster = await rich.svgToPng(svg, size, 4);
      const valignEx = parseFloat(/vertical-align:\s*(-?[\d.]+)ex/.exec(svg)?.[1] ?? "0");
      prep.math.set(m, {
        ...raster,
        widthPt: size.width * PX_TO_PT,
        heightPt: size.height * PX_TO_PT,
        descent: -valignEx * (BODY_SIZE / 2),
      });
    } catch {
      warnings.failedMath++;
      prep.math.set(m, null);
    }
  }
  for (const d of diagrams) {
    try {
      const svg = await rich.renderMermaid(d.text);
      prep.diagrams.set(d, await rich.svgToPng(svg, rich.svgSize(svg), 2.5));
    } catch {
      warnings.failedDiagrams++;
      prep.diagrams.set(d, null);
    }
  }
  return prep;
}

/** Registers only the DejaVu styles the document actually uses. */
async function embedUnicodeFonts(doc: jsPDF, tokens: Token[]): Promise<Fonts> {
  const used = { normal: true, bold: false, italic: false, bolditalic: false, mono: false };
  const scan = (list: Token[] | undefined, bold: boolean, italic: boolean) => {
    for (const t of list ?? []) {
      const b = bold || t.type === "strong" || t.type === "heading" || t.type === "table";
      const i = italic || t.type === "em";
      if (t.type === "code" || t.type === "codespan") used.mono = true;
      if (b && i) used.bolditalic = true;
      else if (b) used.bold = true;
      else if (i) used.italic = true;
      const n = t as { tokens?: Token[]; items?: Tokens.ListItem[]; header?: Tokens.TableCell[]; rows?: Tokens.TableCell[][] };
      scan(n.tokens, b, i);
      n.items?.forEach((it) => scan(it.tokens, b, i));
      n.header?.forEach((c) => scan(c.tokens, true, i));
      n.rows?.forEach((r) => r.forEach((c) => scan(c.tokens, b, i)));
    }
  };
  scan(tokens, false, false);

  const base = `${window.location.origin}/fonts/dejavu-2.37`;
  const files: [keyof typeof used, string, string, string][] = [
    ["normal", "DejaVuSans.ttf", "DejaVuSans", "normal"],
    ["bold", "DejaVuSans-Bold.ttf", "DejaVuSans", "bold"],
    ["italic", "DejaVuSans-Oblique.ttf", "DejaVuSans", "italic"],
    ["bolditalic", "DejaVuSans-BoldOblique.ttf", "DejaVuSans", "bolditalic"],
    ["mono", "DejaVuSansMono.ttf", "DejaVuSansMono", "normal"],
  ];
  await Promise.all(
    files
      .filter(([key]) => used[key])
      .map(async ([, file, family, style]) => {
        const res = await fetch(`${base}/${file}`);
        if (!res.ok) throw new Error(`font ${file}: ${res.status}`);
        doc.addFileToVFS(file, toBase64(new Uint8Array(await res.arrayBuffer())));
        doc.addFont(file, family, style);
      }),
  );
  // Styles that are never used still need a mapping, or jsPDF throws on setFont.
  for (const [key, , family, style] of files) {
    if (!used[key] && family === "DejaVuSans") doc.addFont("DejaVuSans.ttf", family, style);
  }
  return { sans: "DejaVuSans", mono: used.mono ? "DejaVuSansMono" : "courier" };
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

// ---- Layout (sync) -------------------------------------------------------------

function ensureRoom(state: LayoutState, needed: number) {
  if (state.y + needed > PAGE.height - MARGIN.bottom) {
    state.doc.addPage();
    state.y = MARGIN.top;
  }
}

function setFont(state: LayoutState, w: Pick<StyledWord, "bold" | "italic" | "code">, size: number) {
  const { doc, fonts } = state;
  if (w.code) {
    doc.setFont(fonts.mono, "normal");
  } else {
    const style = w.bold && w.italic ? "bolditalic" : w.bold ? "bold" : w.italic ? "italic" : "normal";
    doc.setFont(fonts.sans, style);
  }
  doc.setFontSize(w.code ? size * 0.92 : size);
}

/** Symbols outside the Basic Multilingual Plane (emoji) exist in neither font. */
const stripAstral = (s: string) => s.replace(/[\u{10000}-\u{10FFFF}]\uFE0F?/gu, "");

// --- Inline tokens → styled words -----------------------------------------

function inlineToWords(
  state: LayoutState,
  tokens: Token[] | undefined,
  base: Partial<StyledWord> = {},
): StyledWord[] {
  if (!tokens) return [];
  const words: StyledWord[] = [];
  for (const t of tokens) {
    switch (t.type) {
      case "strong":
        words.push(...inlineToWords(state, (t as Tokens.Strong).tokens, { ...base, bold: true }));
        break;
      case "em":
        words.push(...inlineToWords(state, (t as Tokens.Em).tokens, { ...base, italic: true }));
        break;
      case "del":
        words.push(...inlineToWords(state, (t as Tokens.Del).tokens, { ...base, strike: true }));
        break;
      case "codespan":
        pushText(words, decodeEntities((t as Tokens.Codespan).text), { ...base, code: true });
        break;
      case "link": {
        const link = t as Tokens.Link;
        words.push(...inlineToWords(state, link.tokens, { ...base, href: link.href }));
        break;
      }
      case "image":
        // Images inside running text are rare; the alt text keeps the meaning.
        // Paragraphs made only of images are laid out as figures instead.
        pushText(words, (t as Tokens.Image).text || "[image]", { ...base, italic: true });
        break;
      case "inlineMath": {
        const img = state.prep.math.get(t);
        if (img) words.push({ text: "", bold: false, italic: false, code: false, ...base, image: img });
        else pushText(words, (t as MathToken).text, { ...base, code: true });
        break;
      }
      case "checkbox":
        break; // drawn by renderList
      case "br":
        words.push({ text: "\n", bold: false, italic: false, code: false });
        break;
      case "escape":
      case "text": {
        const tk = t as Tokens.Text;
        if (tk.tokens?.length) {
          words.push(...inlineToWords(state, tk.tokens, base));
        } else {
          pushText(words, decodeEntities(tk.text), base);
        }
        break;
      }
      default:
        if ("text" in t && typeof t.text === "string") pushText(words, decodeEntities(t.text), base);
    }
  }
  return words;
}

function pushText(words: StyledWord[], text: string, base: Partial<StyledWord>) {
  for (const part of stripAstral(text).split(/\s+/)) {
    if (!part) continue;
    words.push({ text: part, bold: false, italic: false, code: false, ...base });
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// --- Word-wrap layout -------------------------------------------------------

function layoutWords(
  state: LayoutState,
  words: StyledWord[],
  x: number,
  width: number,
  size: number,
  color: [number, number, number] = [23, 23, 23],
) {
  const { doc } = state;
  const baseLineHeight = size * LINE_HEIGHT;
  setFont(state, { bold: false, italic: false, code: false }, size);
  const sw = doc.getTextWidth(" ");

  // A line grows when it holds a tall inline formula.
  let lineHeight = baseLineHeight;
  let cursorX = x;
  ensureRoom(state, lineHeight);
  let baseline = state.y + size;

  const newline = (nextHeight = baseLineHeight) => {
    state.y += lineHeight;
    lineHeight = nextHeight;
    ensureRoom(state, lineHeight);
    baseline = state.y + size + (lineHeight - baseLineHeight);
    cursorX = x;
  };

  for (const w of words) {
    if (w.text === "\n" && !w.image) {
      newline();
      continue;
    }
    if (w.image) {
      const img = w.image;
      const imgWidth = Math.min(img.widthPt, width);
      const scale = imgWidth / img.widthPt;
      const h = img.heightPt * scale;
      const needed = Math.max(baseLineHeight, h + size * 0.4);
      if (cursorX > x && cursorX + imgWidth > x + width) newline(needed);
      else if (needed > lineHeight) {
        baseline += needed - lineHeight;
        lineHeight = needed;
      }
      const top = baseline - h + img.descent * scale;
      doc.addImage(img.dataUrl, img.format, cursorX, top, imgWidth, h);
      cursorX += imgWidth + sw;
      continue;
    }

    setFont(state, w, size);
    const wordWidth = doc.getTextWidth(w.text);
    if (cursorX > x && cursorX + wordWidth > x + width) newline();

    if (w.href) {
      doc.setTextColor(29, 78, 216);
      doc.textWithLink(w.text, cursorX, baseline, { url: w.href });
      doc.setDrawColor(29, 78, 216);
      doc.setLineWidth(0.5);
      doc.line(cursorX, baseline + 1.5, cursorX + wordWidth, baseline + 1.5);
    } else {
      doc.setTextColor(...color);
      doc.text(w.text, cursorX, baseline);
    }
    if (w.strike) {
      doc.setDrawColor(...color);
      doc.setLineWidth(0.6);
      const mid = baseline - size * 0.3;
      doc.line(cursorX, mid, cursorX + wordWidth, mid);
    }
    cursorX += wordWidth + sw;
  }
  state.y += lineHeight;
}

// --- Block tokens ------------------------------------------------------------

function renderTokens(state: LayoutState, tokens: Token[], x: number, width: number) {
  for (const token of tokens) {
    switch (token.type) {
      case "heading":
        renderHeading(state, token as Tokens.Heading, x, width);
        break;
      case "paragraph": {
        const para = token as Tokens.Paragraph;
        const onlyImages =
          para.tokens.some((t) => t.type === "image") &&
          para.tokens.every((t) => t.type === "image" || (t.type === "text" && !t.raw.trim()) || t.type === "br");
        if (onlyImages) {
          for (const t of para.tokens) if (t.type === "image") renderFigure(state, state.prep.images.get(t) ?? null, (t as Tokens.Image).text, x, width);
        } else {
          layoutWords(state, inlineToWords(state, para.tokens), x, width, BODY_SIZE);
          state.y += BODY_SIZE * 0.6;
        }
        break;
      }
      case "blockMath": {
        const img = state.prep.math.get(token);
        if (img) renderFigure(state, img, "", x, width, { maxWidthPt: img.widthPt, spacing: BODY_SIZE * 0.5 });
        else renderCodeBlock(state, { type: "code", raw: "", text: (token as MathToken).text, lang: "" } as Tokens.Code, x, width);
        break;
      }
      case "list":
        renderList(state, token as Tokens.List, x, width);
        state.y += BODY_SIZE * 0.6;
        break;
      case "code": {
        const code = token as Tokens.Code;
        if ((code.lang ?? "").trim().toLowerCase() === "mermaid") {
          const img = state.prep.diagrams.get(token);
          if (img) renderFigure(state, img, "", x, width);
          else renderCodeBlock(state, code, x, width);
        } else renderCodeBlock(state, code, x, width);
        break;
      }
      case "blockquote":
        renderBlockquote(state, token as Tokens.Blockquote, x, width);
        break;
      case "table":
        renderTable(state, token as Tokens.Table, x, width);
        break;
      case "hr": {
        ensureRoom(state, 20);
        state.doc.setDrawColor(212, 212, 212);
        state.doc.setLineWidth(0.75);
        state.doc.line(x, state.y + 8, x + width, state.y + 8);
        state.y += 22;
        break;
      }
      case "space":
        break;
      case "html":
        break; // raw HTML is not rendered
      case "text":
        layoutWords(state, inlineToWords(state, [token]), x, width, BODY_SIZE);
        break;
    }
  }
}

/** A block image (picture, diagram, display formula), centred and scaled to fit. */
function renderFigure(
  state: LayoutState,
  img: RasterImage | null,
  alt: string,
  x: number,
  width: number,
  opts: { maxWidthPt?: number; spacing?: number } = {},
) {
  const spacing = opts.spacing ?? BODY_SIZE * 0.8;
  if (!img) {
    layoutWords(state, [{ text: `[image: ${alt || "not available"}]`, bold: false, italic: true, code: false }], x, width, BODY_SIZE, [120, 113, 108]);
    state.y += spacing;
    return;
  }
  let w = Math.min(opts.maxWidthPt ?? img.width * PX_TO_PT, width);
  let h = (w * img.height) / img.width;
  if (h > USABLE_HEIGHT) {
    h = USABLE_HEIGHT;
    w = (h * img.width) / img.height;
  }
  ensureRoom(state, h + spacing);
  state.doc.addImage(img.dataUrl, img.format, x + (width - w) / 2, state.y, w, h);
  state.y += h + spacing;
}

function renderHeading(state: LayoutState, token: Tokens.Heading, x: number, width: number) {
  const size = HEADING_SIZES[token.depth] ?? BODY_SIZE;
  state.y += token.depth <= 2 ? size * 0.7 : size * 0.45;
  ensureRoom(state, size * 2.2);
  const words = inlineToWords(state, token.tokens).map((w) => ({ ...w, bold: true }));
  layoutWords(state, words, x, width, size);
  if (token.depth <= 2) {
    state.doc.setDrawColor(229, 229, 229);
    state.doc.setLineWidth(0.75);
    state.doc.line(x, state.y + 2, x + width, state.y + 2);
    state.y += 6;
  }
  state.y += size * 0.35;
}

function renderList(state: LayoutState, token: Tokens.List, x: number, width: number, depth = 0) {
  const indent = 18;
  const itemX = x + indent;
  let index = typeof token.start === "number" && token.start > 0 ? token.start : 1;

  for (const item of token.items) {
    ensureRoom(state, BODY_SIZE * LINE_HEIGHT);
    const { doc } = state;
    doc.setTextColor(23, 23, 23);
    if (item.task) {
      // Task list: a real checkbox, ticked when done.
      const box = BODY_SIZE * 0.72;
      const bx = x + 1;
      const by = state.y + BODY_SIZE - box + 1;
      doc.setDrawColor(87, 83, 78);
      doc.setLineWidth(0.8);
      doc.rect(bx, by, box, box);
      if (item.checked) {
        doc.setLineWidth(1.2);
        doc.lines([[box * 0.28, box * 0.3], [box * 0.5, -box * 0.62]], bx + box * 0.18, by + box * 0.5);
      }
    } else {
      setFont(state, { bold: false, italic: false, code: false }, BODY_SIZE);
      doc.text(token.ordered ? `${index}.` : "•", x + 2, state.y + BODY_SIZE);
    }
    index++;

    const blockTokens: Token[] = [];
    const inlineTokens: Token[] = [];
    for (const t of item.tokens) {
      if (t.type === "text" || t.type === "paragraph") {
        inlineTokens.push(...((t as Tokens.Text).tokens ?? [t]));
      } else if (t.type !== "checkbox") {
        blockTokens.push(t);
      }
    }

    if (inlineTokens.length) {
      layoutWords(state, inlineToWords(state, inlineTokens), itemX, width - indent, BODY_SIZE, item.checked ? [120, 113, 108] : [23, 23, 23]);
    }
    for (const block of blockTokens) {
      if (block.type === "list") {
        renderList(state, block as Tokens.List, itemX, width - indent, depth + 1);
      } else {
        renderTokens(state, [block], itemX, width - indent);
      }
    }
    state.y += BODY_SIZE * 0.25;
  }
}

// --- Code blocks, with syntax colours ------------------------------------------

type Segment = { text: string; color: [number, number, number] };

const DEFAULT_CODE: [number, number, number] = [41, 37, 36];
// GitHub-light palette, readable in print.
const HLJS_COLORS: Record<string, [number, number, number]> = {
  keyword: [207, 34, 46], "selector-tag": [207, 34, 46], "template-tag": [207, 34, 46],
  string: [10, 48, 105], regexp: [10, 48, 105], "template-variable": [10, 48, 105],
  comment: [110, 119, 129], quote: [110, 119, 129], meta: [110, 119, 129],
  number: [5, 80, 174], literal: [5, 80, 174], attr: [5, 80, 174], attribute: [5, 80, 174], symbol: [5, 80, 174], variable: [149, 56, 0],
  title: [130, 80, 223], "title.function": [130, 80, 223], "title.class": [149, 56, 0], function: [130, 80, 223],
  built_in: [149, 56, 0], type: [149, 56, 0], params: [41, 37, 36],
  tag: [17, 99, 41], name: [17, 99, 41], "selector-id": [17, 99, 41], "selector-class": [17, 99, 41],
  addition: [17, 99, 41], deletion: [130, 7, 30], section: [5, 80, 174], bullet: [149, 56, 0],
};

function colorFor(classes: string[]): [number, number, number] {
  for (let i = classes.length - 1; i >= 0; i--) {
    const c = classes[i].replace(/^hljs-/, "").replace(/_$/, "");
    if (HLJS_COLORS[c]) return HLJS_COLORS[c];
    const head = c.split(".")[0];
    if (HLJS_COLORS[head]) return HLJS_COLORS[head];
  }
  return DEFAULT_CODE;
}

/** highlight.js HTML -> coloured segments, split into source lines. */
function highlightedLines(state: LayoutState, code: string, lang: string): Segment[][] {
  const plain = () => code.split("\n").map((l) => [{ text: l, color: DEFAULT_CODE }]);
  const html = lang && state.prep.highlight ? state.prep.highlight(code, lang) : null;
  if (!html || typeof DOMParser === "undefined") return plain();
  const body = new DOMParser().parseFromString(`<pre>${html}</pre>`, "text/html").body;
  const segments: Segment[] = [];
  const walk = (node: Node, classes: string[]) => {
    if (node.nodeType === Node.TEXT_NODE) segments.push({ text: node.textContent ?? "", color: colorFor(classes) });
    else if (node instanceof HTMLElement) {
      const next = [...classes, ...Array.from(node.classList)];
      node.childNodes.forEach((c) => walk(c, next));
    }
  };
  body.childNodes.forEach((c) => walk(c, []));
  const lines: Segment[][] = [[]];
  for (const seg of segments) {
    seg.text.split("\n").forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, color: seg.color });
    });
  }
  return lines;
}

/** Hard-wraps segment lines at `maxChars` (monospace), keeping colours. */
function wrapSegments(lines: Segment[][], maxChars: number): Segment[][] {
  const out: Segment[][] = [];
  for (const line of lines) {
    let current: Segment[] = [];
    let used = 0;
    for (const seg of line) {
      let text = stripAstral(seg.text).replace(/\t/g, "    ");
      while (text.length) {
        const room = maxChars - used;
        if (room <= 0) {
          out.push(current);
          current = [];
          used = 0;
          continue;
        }
        const piece = text.slice(0, room);
        current.push({ text: piece, color: seg.color });
        used += piece.length;
        text = text.slice(room);
      }
    }
    out.push(current);
  }
  return out;
}

function renderCodeBlock(state: LayoutState, token: Tokens.Code, x: number, width: number) {
  const { doc } = state;
  doc.setFont(state.fonts.mono, "normal");
  doc.setFontSize(CODE_SIZE);
  const padding = 10;
  const charWidth = doc.getTextWidth("M");
  const maxChars = Math.max(20, Math.floor((width - padding * 2) / charWidth));
  const lang = (token.lang ?? "").trim().split(/\s+/)[0].toLowerCase();
  const lines = wrapSegments(highlightedLines(state, token.text, lang), maxChars);
  const lineHeight = CODE_SIZE * 1.45;

  // Draw in page-sized chunks so long blocks continue on the next page.
  let i = 0;
  while (i < lines.length) {
    ensureRoom(state, lineHeight + padding * 2);
    const available = PAGE.height - MARGIN.bottom - state.y - padding * 2;
    const count = Math.max(1, Math.min(lines.length - i, Math.floor(available / lineHeight)));
    const chunk = lines.slice(i, i + count);
    const boxHeight = chunk.length * lineHeight + padding * 2;

    doc.setFillColor(245, 245, 244);
    doc.roundedRect(x, state.y, width, boxHeight, 3, 3, "F");
    doc.setFont(state.fonts.mono, "normal");
    doc.setFontSize(CODE_SIZE);
    chunk.forEach((segs, j) => {
      let cx = x + padding;
      const cy = state.y + padding + (j + 1) * lineHeight - lineHeight * 0.3;
      for (const seg of segs) {
        doc.setTextColor(...seg.color);
        doc.text(seg.text, cx, cy);
        cx += seg.text.length * charWidth;
      }
    });
    state.y += boxHeight;
    i += count;
    if (i < lines.length) {
      doc.addPage();
      state.y = MARGIN.top;
    }
  }
  state.y += BODY_SIZE * 0.8;
}

function renderBlockquote(state: LayoutState, token: Tokens.Blockquote, x: number, width: number) {
  const barX = x + 2;
  const startY = state.y;
  const startPage = state.doc.getCurrentPageInfo().pageNumber;
  const innerX = x + 16;

  for (const t of token.tokens) {
    if (t.type === "paragraph") {
      layoutWords(state, inlineToWords(state, (t as Tokens.Paragraph).tokens), innerX, width - 16, BODY_SIZE, [87, 83, 78]);
      state.y += BODY_SIZE * 0.4;
    } else {
      renderTokens(state, [t], innerX, width - 16);
    }
  }
  // Only draw the bar when the quote stayed on one page; across a page break
  // the old code drew a bar from the old page's y on the new page.
  if (state.doc.getCurrentPageInfo().pageNumber === startPage) {
    state.doc.setDrawColor(168, 162, 158);
    state.doc.setLineWidth(2.5);
    state.doc.line(barX, startY + 2, barX, Math.min(state.y, PAGE.height - MARGIN.bottom));
  }
  state.y += BODY_SIZE * 0.5;
}

function renderTable(state: LayoutState, token: Tokens.Table, x: number, width: number) {
  const { doc } = state;
  const cols = token.header.length;
  if (!cols) return;
  const colWidth = width / cols;
  const cellPadding = 6;
  const cellSize = BODY_SIZE * 0.92;
  const cellLineHeight = cellSize * 1.35;

  const renderRow = (cells: Tokens.TableCell[], isHeader: boolean) => {
    setFont(state, { bold: isHeader, italic: false, code: false }, cellSize);
    const wrapped = cells.map((cell) => {
      const text = inlineToWords(state, cell.tokens)
        .map((w) => w.text)
        .filter(Boolean)
        .join(" ");
      return doc.splitTextToSize(text || " ", colWidth - cellPadding * 2) as string[];
    });
    const rowLines = Math.max(1, ...wrapped.map((w) => w.length));
    const rowHeight = rowLines * cellLineHeight + cellPadding * 2;
    ensureRoom(state, rowHeight);

    if (isHeader) {
      doc.setFillColor(245, 245, 244);
      doc.rect(x, state.y, width, rowHeight, "F");
    }
    doc.setDrawColor(214, 211, 209);
    doc.setLineWidth(0.5);
    doc.rect(x, state.y, width, rowHeight);
    for (let c = 1; c < cols; c++) {
      doc.line(x + c * colWidth, state.y, x + c * colWidth, state.y + rowHeight);
    }

    setFont(state, { bold: isHeader, italic: false, code: false }, cellSize);
    doc.setTextColor(23, 23, 23);
    wrapped.forEach((lines, c) => {
      const align = token.align[c];
      lines.forEach((line, li) => {
        const lineY = state.y + cellPadding + (li + 1) * cellLineHeight - cellLineHeight * 0.3;
        const lineW = doc.getTextWidth(line);
        const cellX = x + c * colWidth;
        const tx =
          align === "right" ? cellX + colWidth - cellPadding - lineW : align === "center" ? cellX + (colWidth - lineW) / 2 : cellX + cellPadding;
        doc.text(line, tx, lineY);
      });
    });
    state.y += rowHeight;
  };

  renderRow(token.header, true);
  for (const row of token.rows) renderRow(row, false);
  state.y += BODY_SIZE * 0.8;
}
