// Client-side Markdown → PDF rendering.
// Parses markdown with marked's lexer and lays the tokens out manually with
// jsPDF so the result is real vector text (selectable, searchable, small),
// not a rasterized screenshot.

import type { jsPDF } from "jspdf";
import type { Token, Tokens } from "marked";

const PAGE = { width: 595.28, height: 841.89 }; // A4 in points
const MARGIN = { top: 64, right: 60, bottom: 64, left: 60 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

const BODY_SIZE = 11;
const LINE_HEIGHT = 1.5;
const CODE_SIZE = 9.5;

const HEADING_SIZES: Record<number, number> = { 1: 24, 2: 18, 3: 14.5, 4: 12.5, 5: 11.5, 6: 11 };

interface StyledWord {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
  href?: string;
}

interface LayoutState {
  doc: jsPDF;
  y: number;
}

export async function convertMarkdownToPdf(
  markdown: string,
  title?: string,
): Promise<Blob> {
  const { marked } = await import("marked");
  const { jsPDF: JsPDF } = await import("jspdf");

  const doc = new JsPDF({ unit: "pt", format: "a4" });
  doc.setProperties({ title: title || "Document", creator: "markdownpdf.app" });

  const state: LayoutState = { doc, y: MARGIN.top };
  const tokens = marked.lexer(markdown);
  renderTokens(state, tokens, MARGIN.left, CONTENT_WIDTH);

  return doc.output("blob");
}

function ensureRoom(state: LayoutState, needed: number) {
  if (state.y + needed > PAGE.height - MARGIN.bottom) {
    state.doc.addPage();
    state.y = MARGIN.top;
  }
}

function setFont(doc: jsPDF, w: StyledWord, size: number) {
  if (w.code) {
    doc.setFont("courier", "normal");
  } else {
    const style = w.bold && w.italic ? "bolditalic" : w.bold ? "bold" : w.italic ? "italic" : "normal";
    doc.setFont("helvetica", style);
  }
  doc.setFontSize(w.code ? size * 0.92 : size);
}

// --- Inline tokens → styled words -----------------------------------------

function inlineToWords(
  tokens: Token[] | undefined,
  base: Partial<StyledWord> = {},
): StyledWord[] {
  if (!tokens) return [];
  const words: StyledWord[] = [];
  for (const t of tokens) {
    switch (t.type) {
      case "strong":
        words.push(...inlineToWords((t as Tokens.Strong).tokens, { ...base, bold: true }));
        break;
      case "em":
        words.push(...inlineToWords((t as Tokens.Em).tokens, { ...base, italic: true }));
        break;
      case "del":
        words.push(...inlineToWords((t as Tokens.Del).tokens, base));
        break;
      case "codespan":
        pushText(words, (t as Tokens.Codespan).text, { ...base, code: true });
        break;
      case "link": {
        const link = t as Tokens.Link;
        words.push(...inlineToWords(link.tokens, { ...base, href: link.href }));
        break;
      }
      case "image":
        pushText(words, (t as Tokens.Image).text || "[image]", { ...base, italic: true });
        break;
      case "br":
        words.push({ text: "\n", bold: false, italic: false, code: false });
        break;
      case "escape":
      case "text": {
        const tk = t as Tokens.Text;
        if (tk.tokens?.length) {
          words.push(...inlineToWords(tk.tokens, base));
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
  for (const part of text.split(/\s+/)) {
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
  const lineHeight = size * LINE_HEIGHT;
  const spaceWidth = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    return doc.getTextWidth(" ");
  };
  const sw = spaceWidth();

  let cursorX = x;
  ensureRoom(state, lineHeight);
  let baseline = state.y + size;

  const newline = () => {
    state.y += lineHeight;
    ensureRoom(state, lineHeight);
    baseline = state.y + size;
    cursorX = x;
  };

  for (const w of words) {
    if (w.text === "\n") {
      newline();
      continue;
    }
    setFont(doc, w, size);
    const wordWidth = doc.getTextWidth(w.text);
    if (cursorX > x && cursorX + wordWidth > x + width) newline();

    if (w.href) {
      doc.setTextColor(29, 78, 216);
      doc.textWithLink(w.text, cursorX, baseline, { url: w.href });
      const underY = baseline + 1.5;
      doc.setDrawColor(29, 78, 216);
      doc.setLineWidth(0.5);
      doc.line(cursorX, underY, cursorX + wordWidth, underY);
    } else {
      doc.setTextColor(...color);
      doc.text(w.text, cursorX, baseline);
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
      case "paragraph":
        layoutWords(state, inlineToWords((token as Tokens.Paragraph).tokens), x, width, BODY_SIZE);
        state.y += BODY_SIZE * 0.6;
        break;
      case "list":
        renderList(state, token as Tokens.List, x, width);
        state.y += BODY_SIZE * 0.6;
        break;
      case "code":
        renderCodeBlock(state, token as Tokens.Code, x, width);
        break;
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
        layoutWords(state, inlineToWords([token]), x, width, BODY_SIZE);
        break;
    }
  }
}

function renderHeading(state: LayoutState, token: Tokens.Heading, x: number, width: number) {
  const size = HEADING_SIZES[token.depth] ?? BODY_SIZE;
  state.y += token.depth <= 2 ? size * 0.7 : size * 0.45;
  ensureRoom(state, size * 2.2);
  const words = inlineToWords(token.tokens).map((w) => ({ ...w, bold: true }));
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
    const marker = token.ordered ? `${index}.` : "•";
    index++;

    ensureRoom(state, BODY_SIZE * LINE_HEIGHT);
    state.doc.setFont("helvetica", "normal");
    state.doc.setFontSize(BODY_SIZE);
    state.doc.setTextColor(23, 23, 23);
    state.doc.text(marker, x + 2, state.y + BODY_SIZE);

    const blockTokens: Token[] = [];
    const inlineTokens: Token[] = [];
    for (const t of item.tokens) {
      if (t.type === "text" || t.type === "paragraph") {
        inlineTokens.push(...((t as Tokens.Text).tokens ?? [t]));
      } else {
        blockTokens.push(t);
      }
    }

    if (inlineTokens.length) {
      layoutWords(state, inlineToWords(inlineTokens), itemX, width - indent, BODY_SIZE);
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

function renderCodeBlock(state: LayoutState, token: Tokens.Code, x: number, width: number) {
  const { doc } = state;
  doc.setFont("courier", "normal");
  doc.setFontSize(CODE_SIZE);
  const lines = token.text.split("\n").flatMap((line) => {
    const wrapped = doc.splitTextToSize(line || " ", width - 20) as string[];
    return wrapped.length ? wrapped : [" "];
  });
  const lineHeight = CODE_SIZE * 1.45;
  const padding = 10;

  // Draw in page-sized chunks so long blocks break across pages.
  let i = 0;
  while (i < lines.length) {
    ensureRoom(state, lineHeight + padding * 2);
    const available = PAGE.height - MARGIN.bottom - state.y - padding * 2;
    const count = Math.max(1, Math.min(lines.length - i, Math.floor(available / lineHeight)));
    const chunk = lines.slice(i, i + count);
    const boxHeight = chunk.length * lineHeight + padding * 2;

    doc.setFillColor(245, 245, 244);
    doc.roundedRect(x, state.y, width, boxHeight, 3, 3, "F");
    doc.setFont("courier", "normal");
    doc.setFontSize(CODE_SIZE);
    doc.setTextColor(41, 37, 36);
    chunk.forEach((line, j) => {
      doc.text(line, x + padding, state.y + padding + (j + 1) * lineHeight - lineHeight * 0.3);
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
  const innerX = x + 16;

  const savedRender = state.y;
  void savedRender;
  for (const t of token.tokens) {
    if (t.type === "paragraph") {
      layoutWords(state, inlineToWords((t as Tokens.Paragraph).tokens), innerX, width - 16, BODY_SIZE, [87, 83, 78]);
      state.y += BODY_SIZE * 0.4;
    } else {
      renderTokens(state, [t], innerX, width - 16);
    }
  }
  state.doc.setDrawColor(168, 162, 158);
  state.doc.setLineWidth(2.5);
  state.doc.line(barX, startY + 2, barX, Math.min(state.y, PAGE.height - MARGIN.bottom));
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
    doc.setFont("helvetica", isHeader ? "bold" : "normal");
    doc.setFontSize(cellSize);
    const wrapped = cells.map((cell) => {
      const text = inlineToWords(cell.tokens).map((w) => w.text).join(" ");
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

    doc.setFont("helvetica", isHeader ? "bold" : "normal");
    doc.setFontSize(cellSize);
    doc.setTextColor(23, 23, 23);
    wrapped.forEach((lines, c) => {
      lines.forEach((line, li) => {
        doc.text(line, x + c * colWidth + cellPadding, state.y + cellPadding + (li + 1) * cellLineHeight - cellLineHeight * 0.3);
      });
    });
    state.y += rowHeight;
  };

  renderRow(token.header, true);
  for (const row of token.rows) renderRow(row, false);
  state.y += BODY_SIZE * 0.8;
}
