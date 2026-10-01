/**
 * Table detection from positioned text runs — no ruling lines needed.
 *
 * A PDF has no notion of a table: only text drawn at coordinates. A table shows
 * up as consecutive lines that break into several short cells separated by
 * wide gaps, with the cells of every row lining up under the same columns.
 *
 * What it deliberately does NOT treat as a table: two-column page layouts.
 * Their "cells" are full lines of prose, so rows whose cells average more than
 * MAX_AVG_CELL characters are rejected.
 */

export interface PositionedRun {
  text: string;
  x: number;
  width: number;
  size: number;
}

export interface PositionedLine<R extends PositionedRun = PositionedRun> {
  y: number;
  size: number;
  runs: R[];
}

export interface Cell {
  text: string;
  x: number;
  right: number;
}

export interface DetectedTable {
  /** Index of the first and last line (inclusive) the table replaces. */
  start: number;
  end: number;
  rows: string[][];
}

const MAX_AVG_CELL = 28;
const MIN_ROWS = 2;
const MIN_COLS = 2;

/** Splits a line into cells wherever the gap between two runs is wider than about two spaces. */
export function splitCells(line: PositionedLine): Cell[] {
  const cells: Cell[] = [];
  for (const run of line.runs) {
    const text = run.text;
    if (!text.trim()) continue;
    const last = cells[cells.length - 1];
    const gap = last ? run.x - last.right : Infinity;
    if (last && gap < run.size * 0.9) {
      last.text += (gap > run.size * 0.15 && !last.text.endsWith(" ") && !text.startsWith(" ") ? " " : "") + text;
      last.right = Math.max(last.right, run.x + run.width);
    } else {
      cells.push({ text, x: run.x, right: run.x + Math.max(run.width, 1) });
    }
  }
  for (const c of cells) c.text = c.text.replace(/\s+/g, " ").trim();
  return cells.filter((c) => c.text);
}

interface Column {
  x: number;
  right: number;
}

function overlaps(cell: Cell, col: Column, slack: number): boolean {
  return cell.x <= col.right + slack && cell.right >= col.x - slack;
}

/** Index of the column a cell belongs to, or -1 if it straddles none / several. */
function columnOf(cell: Cell, cols: Column[], slack: number): number {
  const hits = cols.map((c, i) => (overlaps(cell, c, slack) ? i : -1)).filter((i) => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}

/** Four words or more of running text — a sentence fragment, not a cell value. */
function isProse(text: string): boolean {
  const words = text.split(" ").filter((w) => /[a-z]{2,}/.test(w));
  return words.length >= 4;
}

function looksTabular(cells: Cell[]): boolean {
  if (cells.length < MIN_COLS) return false;
  const avg = cells.reduce((s, c) => s + c.text.length, 0) / cells.length;
  // Columns of prose cut by a gutter look like a row of long cells; a real row
  // has at most a minority of descriptive cells beside short values.
  const prose = cells.filter((c) => isProse(c.text)).length;
  return avg <= MAX_AVG_CELL || prose * 2 < cells.length;
}

/**
 * Charts often label their values in a symbol font whose characters map to
 * nothing readable ("©§¡ ¡"). Those labels line up like a table; a table whose
 * value cells hold no letter or digit is noise, not data.
 */
function readable(rows: Cell[][]): boolean {
  const values = rows.flatMap((r) => r.slice(1)).filter((c) => c.text);
  if (values.length === 0) return false;
  const ok = values.filter((c) => /[\p{L}\p{N}]/u.test(c.text)).length;
  return ok / values.length >= 0.6;
}

/** Finds tables among a page's lines (sorted top to bottom). */
export function findTables(lines: PositionedLine[]): DetectedTable[] {
  const cellsByLine = lines.map(splitCells);
  const tables: DetectedTable[] = [];
  let i = 0;
  while (i < lines.length) {
    if (!looksTabular(cellsByLine[i])) {
      i++;
      continue;
    }
    const size = lines[i].size || 10;
    const slack = size * 0.6;
    let cols: Column[] = cellsByLine[i].map((c) => ({ x: c.x, right: c.right }));
    const rows: Cell[][] = [cellsByLine[i]];
    let j = i + 1;
    while (j < lines.length) {
      const cells = cellsByLine[j];
      const gap = lines[j - 1].y - lines[j].y;
      if (cells.length === 0 || gap > size * 3.2) break;
      // A row with fewer cells is fine (empty cells), as long as each lands in one column.
      const idx = cells.map((c) => columnOf(c, cols, slack));
      const aligned = idx.every((k) => k >= 0) && new Set(idx).size === idx.length;
      if (!aligned) {
        // A row with MORE columns may define the grid better (header with merged cells above).
        if (cells.length > cols.length && looksTabular(cells)) {
          const back = rows.every((r) => r.every((c) => columnOf(c, cells, slack) >= 0));
          if (back) {
            cols = cells.map((c) => ({ x: c.x, right: c.right }));
            rows.push(cells);
            j++;
            continue;
          }
        }
        break;
      }
      if (cells.length >= MIN_COLS && !looksTabular(cells)) break;
      if (cells.length === 1 && isProse(cells[0].text)) break;
      idx.forEach((k, n) => {
        cols[k] = { x: Math.min(cols[k].x, cells[n].x), right: Math.max(cols[k].right, cells[n].right) };
      });
      rows.push(cells);
      j++;
    }
    const multi = rows.filter((r) => r.length >= MIN_COLS).length;
    if (rows.length >= MIN_ROWS && multi >= MIN_ROWS && cols.length >= MIN_COLS && readable(rows)) {
      const grid = rows.map((r) => {
        const out = cols.map(() => "");
        for (const c of r) {
          const k = columnOf(c, cols, slack);
          if (k >= 0) out[k] = out[k] ? `${out[k]} ${c.text}` : c.text;
        }
        return out;
      });
      tables.push({ start: i, end: j - 1, rows: grid });
      i = j;
    } else {
      i++;
    }
  }
  return tables;
}

const escapeCell = (s: string) => s.replace(/\|/g, "\\|");

/** GitHub-flavoured Markdown table; the first row is the header. */
export function tableToMarkdown(rows: string[][]): string {
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r: string[]) => [...r, ...Array(width - r.length).fill("")].map(escapeCell);
  const [head, ...body] = rows.map(pad);
  return [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...body.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");
}

/** RFC 4180 CSV. */
export function tableToCsv(rows: string[][]): string {
  const q = (s: string) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return rows.map((r) => r.map(q).join(",")).join("\r\n") + "\r\n";
}
