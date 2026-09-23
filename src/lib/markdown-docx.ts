/**
 * Markdown → Word (.docx), in the browser.
 *
 * Marked tokenises the Markdown; each token becomes a real Word construct —
 * Heading 1–6 styles, Word numbering for lists, Word tables with a repeating
 * header row, hyperlinks — so the result behaves like a document written in
 * Word (navigation pane, restyling, table of contents), not like pasted text.
 */

import type { Token, Tokens } from "marked";
import type { IParagraphOptions, ParagraphChild } from "docx";

export interface DocxExport {
  blob: Blob;
  /** Things that could not be carried over faithfully. */
  warnings: string[];
}

type Docx = typeof import("docx");

const CODE_FONT = "Consolas";
const MAX_IMAGE_WIDTH_PX = 600; // ≈ the text width of an A4 / Letter page at 96 dpi

interface InlineStyle {
  bold?: boolean;
  italics?: boolean;
  strike?: boolean;
  code?: boolean;
  /** Inside a hyperlink: Word's "Hyperlink" character style (blue, underlined). */
  link?: boolean;
}

/** Pixel size of a PNG, JPEG or GIF from its header, or null. */
export function imageDimensions(bytes: Uint8Array): { width: number; height: number; type: "png" | "jpg" | "gif" } | null {
  if (bytes.length < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) === 0x89504e47) return { type: "png", width: view.getUint32(16), height: view.getUint32(20) };
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return { type: "gif", width: view.getUint16(6, true), height: view.getUint16(8, true) };
  }
  if (view.getUint16(0) === 0xffd8) {
    let o = 2;
    while (o + 9 < bytes.length) {
      const marker = view.getUint16(o);
      // SOF0–SOF15 carry the frame size (C4, C8 and CC are other segments).
      if (marker >= 0xffc0 && marker <= 0xffcf && ![0xffc4, 0xffc8, 0xffcc].includes(marker)) {
        return { type: "jpg", height: view.getUint16(o + 5), width: view.getUint16(o + 7) };
      }
      o += 2 + view.getUint16(o + 2);
    }
  }
  return null;
}

function decodeDataUri(uri: string): Uint8Array | null {
  const m = /^data:image\/(png|jpe?g|gif);base64,([A-Za-z0-9+/=\s]+)$/.exec(uri);
  if (!m) return null;
  const bin = atob(m[2].replace(/\s/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** HTML entities Marked leaves in text tokens ("&amp;", "&quot;", "&#39;"). */
function unescape(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

class Builder {
  readonly warnings = new Set<string>();
  private orderedInstance = 0;

  constructor(private readonly d: Docx) {}

  inline(tokens: Token[] | undefined, style: InlineStyle = {}): ParagraphChild[] {
    const d = this.d;
    const out: ParagraphChild[] = [];
    for (const t of tokens ?? []) {
      switch (t.type) {
        case "strong":
          out.push(...this.inline((t as Tokens.Strong).tokens, { ...style, bold: true }));
          break;
        case "em":
          out.push(...this.inline((t as Tokens.Em).tokens, { ...style, italics: true }));
          break;
        case "del":
          out.push(...this.inline((t as Tokens.Del).tokens, { ...style, strike: true }));
          break;
        case "codespan":
          out.push(this.run(unescape((t as Tokens.Codespan).text), { ...style, code: true }));
          break;
        case "br":
          out.push(new d.TextRun({ text: "", break: 1 }));
          break;
        case "link": {
          const link = t as Tokens.Link;
          if (/^(https?:|mailto:)/i.test(link.href)) {
            const runs = this.inline(link.tokens, { ...style, link: true });
            out.push(
              new d.ExternalHyperlink({
                link: link.href,
                children: runs.length ? runs : [this.run(link.href, { ...style, link: true })],
              }),
            );
          } else {
            // Relative links point at files the reader of a .docx does not have: keep the text.
            out.push(...this.inline(link.tokens, style));
          }
          break;
        }
        case "image": {
          const image = t as Tokens.Image;
          const run = this.image(image.href, image.text);
          if (run) out.push(run);
          else if (image.text) out.push(this.run(`[${image.text}]`, { ...style, italics: true }));
          break;
        }
        case "html":
          // Inline HTML (e.g. <kbd>, <br>) — keep its text, drop the tags.
          if (/^<br\s*\/?>$/i.test((t as Tokens.HTML).text.trim())) out.push(new d.TextRun({ text: "", break: 1 }));
          break;
        case "escape":
        case "text": {
          const tt = t as Tokens.Text;
          if (tt.tokens?.length) out.push(...this.inline(tt.tokens, style));
          else out.push(this.run(unescape(tt.text), style));
          break;
        }
        default:
          if ("text" in t && typeof t.text === "string") out.push(this.run(unescape(t.text), style));
      }
    }
    return out;
  }

  private run(text: string, style: InlineStyle) {
    return new this.d.TextRun({
      text,
      bold: style.bold,
      italics: style.italics,
      strike: style.strike,
      font: style.code ? CODE_FONT : undefined,
      shading: style.code ? { type: this.d.ShadingType.CLEAR, fill: "F1F1F1", color: "auto" } : undefined,
      style: style.link ? "Hyperlink" : undefined,
    });
  }

  private image(src: string, alt: string) {
    const bytes = decodeDataUri(src);
    if (!bytes) {
      this.warnings.add(
        "Images that are links (https://… or a file path) are not embedded — the browser cannot fetch them for the document. Their description is kept in [brackets]. Paste the image into Word, or use a data: URI.",
      );
      return null;
    }
    const size = imageDimensions(bytes);
    if (!size) {
      this.warnings.add("An embedded image was not a PNG, JPEG or GIF and was left out.");
      return null;
    }
    const scale = Math.min(1, MAX_IMAGE_WIDTH_PX / size.width);
    return new this.d.ImageRun({
      type: size.type,
      data: bytes,
      transformation: { width: Math.round(size.width * scale), height: Math.round(size.height * scale) },
      altText: alt ? { name: alt, description: alt, title: alt } : undefined,
    });
  }

  blocks(tokens: Token[], ctx: { quote?: boolean; listLevel?: number } = {}): (InstanceType<Docx["Paragraph"]> | InstanceType<Docx["Table"]>)[] {
    const d = this.d;
    const out: (InstanceType<Docx["Paragraph"]> | InstanceType<Docx["Table"]>)[] = [];
    const quoteProps: Partial<IParagraphOptions> = ctx.quote
      ? {
          indent: { left: 567 },
          border: { left: { style: d.BorderStyle.SINGLE, size: 12, color: "A8A29E", space: 8 } },
        }
      : {};

    for (const t of tokens) {
      switch (t.type) {
        case "heading": {
          const h = t as Tokens.Heading;
          const levels = [
            d.HeadingLevel.HEADING_1,
            d.HeadingLevel.HEADING_2,
            d.HeadingLevel.HEADING_3,
            d.HeadingLevel.HEADING_4,
            d.HeadingLevel.HEADING_5,
            d.HeadingLevel.HEADING_6,
          ];
          out.push(new d.Paragraph({ heading: levels[h.depth - 1], children: this.inline(h.tokens) }));
          break;
        }
        case "paragraph":
          out.push(new d.Paragraph({ ...quoteProps, children: this.inline((t as Tokens.Paragraph).tokens) }));
          break;
        case "text": {
          // Loose text at block level (inside tight list items).
          const tt = t as Tokens.Text;
          out.push(new d.Paragraph({ ...quoteProps, children: this.inline(tt.tokens ?? [tt]) }));
          break;
        }
        case "blockquote":
          out.push(...this.blocks((t as Tokens.Blockquote).tokens, { ...ctx, quote: true }));
          break;
        case "code": {
          const code = t as Tokens.Code;
          if (code.lang?.trim().startsWith("mermaid")) {
            this.warnings.add("Mermaid diagrams are kept as their source code; Word cannot draw them.");
          }
          const lines = code.text.split("\n");
          out.push(
            new d.Paragraph({
              shading: { type: d.ShadingType.CLEAR, fill: "F5F5F4", color: "auto" },
              spacing: { before: 120, after: 120 },
              children: lines.map(
                (line, i) => new d.TextRun({ text: line, font: CODE_FONT, size: 19, break: i > 0 ? 1 : undefined }),
              ),
            }),
          );
          break;
        }
        case "list":
          out.push(...this.list(t as Tokens.List, ctx.listLevel ?? 0, quoteProps));
          break;
        case "table":
          out.push(this.table(t as Tokens.Table));
          break;
        case "hr":
          out.push(
            new d.Paragraph({
              border: { bottom: { style: d.BorderStyle.SINGLE, size: 6, color: "D6D3D1", space: 1 } },
              children: [],
            }),
          );
          break;
        case "html": {
          const text = (t as Tokens.HTML).text.replace(/<[^>]+>/g, "").trim();
          if (text) out.push(new d.Paragraph({ ...quoteProps, children: [new d.TextRun(unescape(text))] }));
          if ((t as Tokens.HTML).text.trim()) this.warnings.add("Raw HTML in the Markdown is reduced to its text.");
          break;
        }
        case "space":
          break;
        default:
          if ("text" in t && typeof t.text === "string" && t.text.trim()) {
            out.push(new d.Paragraph({ children: [new d.TextRun(unescape(t.text))] }));
          }
      }
    }
    return out;
  }

  private list(list: Tokens.List, level: number, extra: Partial<IParagraphOptions>) {
    const d = this.d;
    const out: (InstanceType<Docx["Paragraph"]> | InstanceType<Docx["Table"]>)[] = [];
    // Each ordered list gets its own numbering instance, so it restarts at 1
    // instead of continuing the previous list's count.
    const instance = list.ordered ? ++this.orderedInstance : 0;
    const lvl = Math.min(level, 8);
    for (const item of list.items) {
      const [first, ...rest] = item.tokens;
      const lead: ParagraphChild[] = item.task ? [new d.TextRun(item.checked ? "☑ " : "☐ ")] : [];
      const firstInline =
        first && (first.type === "text" || first.type === "paragraph")
          ? this.inline((first as Tokens.Text).tokens ?? [first])
          : [];
      out.push(
        new d.Paragraph({
          ...extra,
          numbering: list.ordered
            ? { reference: "md-numbers", level: lvl, instance }
            : { reference: "md-bullets", level: lvl },
          children: [...lead, ...firstInline],
        }),
      );
      const remaining = firstInline.length || !first ? rest : item.tokens;
      for (const t of remaining) {
        if (t.type === "list") out.push(...this.list(t as Tokens.List, level + 1, extra));
        else {
          // Continuation paragraphs of an item are indented under it.
          const paras = this.blocks([t], { listLevel: level + 1 });
          out.push(...paras);
        }
      }
    }
    return out;
  }

  private table(table: Tokens.Table) {
    const d = this.d;
    const align = (a: "center" | "left" | "right" | null) =>
      a === "center" ? d.AlignmentType.CENTER : a === "right" ? d.AlignmentType.RIGHT : d.AlignmentType.LEFT;
    const cell = (tokens: Token[], a: "center" | "left" | "right" | null, header: boolean) =>
      new d.TableCell({
        shading: header ? { type: d.ShadingType.CLEAR, fill: "F5F5F4", color: "auto" } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new d.Paragraph({ alignment: align(a), children: this.inline(tokens, header ? { bold: true } : {}) })],
      });
    return new d.Table({
      width: { size: 100, type: d.WidthType.PERCENTAGE },
      rows: [
        new d.TableRow({
          tableHeader: true,
          children: table.header.map((h, i) => cell(h.tokens, table.align[i], true)),
        }),
        ...table.rows.map(
          (row) => new d.TableRow({ children: row.map((c, i) => cell(c.tokens, table.align[i], false)) }),
        ),
      ],
    });
  }
}

function numberingLevels(d: Docx, format: "bullet" | "decimal") {
  const bullets = ["•", "◦", "▪"];
  return Array.from({ length: 9 }, (_, level) => ({
    level,
    format: format === "bullet" ? d.LevelFormat.BULLET : d.LevelFormat.DECIMAL,
    text: format === "bullet" ? bullets[level % 3] : `%${level + 1}.`,
    alignment: d.AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
  }));
}

export async function markdownToDocx(markdown: string, { title }: { title?: string } = {}): Promise<DocxExport> {
  const [d, { Marked }] = await Promise.all([import("docx"), import("marked")]);
  // Front matter is metadata for site generators, not content.
  const content = markdown.replace(/^﻿?---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/, "");
  const tokens = new Marked({ gfm: true }).lexer(content);
  const builder = new Builder(d);
  const children = builder.blocks(tokens);
  if (/(^|[^\\])\$[^\s$][^$]*\$/.test(content)) {
    builder.warnings.add("LaTeX math is kept as its source text ($…$); Word cannot render it from Markdown.");
  }
  const doc = new d.Document({
    title,
    creator: "markdownpdf.app",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
        // Explicit outline levels: they are what Word's navigation pane and
        // automatic table of contents read.
        ...Object.fromEntries(
          [32, 28, 26, 24, 22, 22].map((size, level) => [
            `heading${level + 1}`,
            {
              run: { size, bold: true, color: "1F2937", italics: level === 5 },
              paragraph: { outlineLevel: level, spacing: { before: level < 2 ? 360 : 240, after: 120 }, keepNext: true },
            },
          ]),
        ),
      },
    },
    numbering: {
      config: [
        { reference: "md-bullets", levels: numberingLevels(d, "bullet") },
        { reference: "md-numbers", levels: numberingLevels(d, "decimal") },
      ],
    },
    sections: [{ children: children.length ? children : [new d.Paragraph("")] }],
  });
  const blob = await d.Packer.toBlob(doc);
  return { blob, warnings: [...builder.warnings] };
}
