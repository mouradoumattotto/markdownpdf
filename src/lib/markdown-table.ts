/**
 * Markdown tables: build them from a grid, parse them back, import CSV/TSV.
 * Pure functions, unit-tested; the generator UI is a thin layer on top.
 */

export type Align = "none" | "left" | "center" | "right";

export interface TableData {
  /** First row is the header. Every row has the same number of cells. */
  rows: string[][];
  align: Align[];
}

/** Makes every row as long as the longest one, padding with empty cells. */
export function normalize(rows: string[][]): string[][] {
  const width = Math.max(1, ...rows.map((r) => r.length));
  return rows.map((r) => [...r, ...Array(width - r.length).fill("")]);
}

/**
 * Parses CSV or TSV. Spreadsheets put TSV on the clipboard, CSV files may use
 * "," or ";" (Excel in many European locales) — the delimiter is detected from
 * the first line, outside quotes. Quoted fields may contain delimiters,
 * doubled quotes and line breaks (RFC 4180).
 */
export function parseDelimited(text: string, delimiter?: string): string[][] {
  const src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n").replace(/\n+$/, "");
  if (!src.trim()) return [];
  const sep = delimiter ?? detectDelimiter(src);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === sep) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field);
  rows.push(row);
  return normalize(rows.map((r) => r.map((f) => f.trim())));
}

function detectDelimiter(src: string): string {
  // First line outside quotes.
  let line = "";
  let quoted = false;
  for (const c of src) {
    if (c === '"') quoted = !quoted;
    else if (c === "\n" && !quoted) break;
    if (!quoted) line += c;
  }
  const counts = ["\t", ";", ",", "|"].map((d) => [d, line.split(d).length - 1] as const);
  const best = counts.reduce((a, b) => (b[1] > a[1] ? b : a));
  return best[1] > 0 ? best[0] : ",";
}

/** A cell's text made safe for a pipe table: pipes escaped, line breaks as <br>. */
export function escapeCell(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>").trim();
}

/** Display width, counting wide (CJK, emoji) characters as two columns so padded tables line up in monospace. */
export function displayWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    w += (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0xa4cf) || (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe4f) || (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6) || (cp >= 0x1f300 && cp <= 0x1faff) || (cp >= 0x20000 && cp <= 0x3fffd)
      ? 2
      : 1;
  }
  return w;
}

export function toMarkdownTable({ rows, align }: TableData, { pretty = true }: { pretty?: boolean } = {}): string {
  const grid = normalize(rows.length ? rows : [[""]]).map((r) => r.map(escapeCell));
  const cols = grid[0].length;
  const aligns = Array.from({ length: cols }, (_, i) => align[i] ?? "none");
  // A header cell cannot be empty in some renderers; keep the column visible.
  const widths = Array.from({ length: cols }, (_, c) =>
    pretty ? Math.max(3, ...grid.map((r) => displayWidth(r[c]))) : 3,
  );
  const pad = (text: string, c: number) => {
    if (!pretty) return text;
    const space = widths[c] - displayWidth(text);
    if (aligns[c] === "right") return " ".repeat(space) + text;
    if (aligns[c] === "center") return " ".repeat(Math.floor(space / 2)) + text + " ".repeat(Math.ceil(space / 2));
    return text + " ".repeat(space);
  };
  const line = (r: string[]) => `| ${r.map((cell, c) => pad(cell, c)).join(" | ")} |`;
  const rule = aligns.map((a, c) => {
    const n = widths[c];
    if (a === "left") return ":" + "-".repeat(n - 1);
    if (a === "right") return "-".repeat(n - 1) + ":";
    if (a === "center") return ":" + "-".repeat(n - 2) + ":";
    return "-".repeat(n);
  });
  return [line(grid[0]), `| ${rule.join(" | ")} |`, ...grid.slice(1).map(line)].join("\n") + "\n";
}

/** Splits a pipe-table line into cells, honouring escaped pipes. */
function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const cells: string[] = [];
  let cell = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "|") {
      cell += "|";
      i++;
    } else if (s[i] === "|") {
      cells.push(cell);
      cell = "";
    } else cell += s[i];
  }
  cells.push(cell);
  return cells.map((c) => c.trim().replace(/<br\s*\/?>/gi, "\n"));
}

/** Parses the first pipe table found in some Markdown, or null. */
export function parseMarkdownTable(markdown: string): TableData | null {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  for (let i = 0; i + 1 < lines.length; i++) {
    const ruleCells = lines[i + 1].includes("|") || lines[i].includes("|") ? splitRow(lines[i + 1]) : [];
    if (!ruleCells.length || !ruleCells.every((c) => /^:?-+:?$/.test(c))) continue;
    const header = splitRow(lines[i]);
    if (header.length !== ruleCells.length) continue;
    const align = ruleCells.map((c): Align =>
      c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : c.startsWith(":") ? "left" : "none",
    );
    const body: string[][] = [];
    for (let j = i + 2; j < lines.length && lines[j].includes("|") && lines[j].trim(); j++) {
      body.push(splitRow(lines[j]).slice(0, header.length));
    }
    return { rows: normalize([header, ...body]).map((r) => r.slice(0, header.length)), align };
  }
  return null;
}

/** Back to CSV, quoting only where needed. */
export function toCsv(rows: string[][]): string {
  return (
    rows
      .map((r) => r.map((f) => (/[",\n]/.test(f) ? `"${f.replace(/"/g, '""')}"` : f)).join(","))
      .join("\n") + "\n"
  );
}
