/**
 * Multi-column reading order.
 *
 * pdf.js returns text by position, so on a two- or three-column page every
 * "line" at a given height holds a fragment of each column, and reading them in
 * order interleaves the columns sentence by sentence. This finds the gutters —
 * vertical bands that almost no line crosses — and re-emits the page column by
 * column. Lines that do cross a gutter (a title, a full-width figure caption, a
 * wide table) cut the page into bands, and each band is read column by column.
 *
 * A wide data table also has vertical gaps between its columns, so a gutter is
 * only accepted when the text on each side of it reads as prose: long single
 * runs of text, not a row of short cells.
 */

import { splitCells, type PositionedLine, type PositionedRun } from "@/lib/pdf-tables";

const BIN = 2; // pt
const MIN_GUTTER = 8; // pt — narrower than this is a word gap, not a gutter
const MAX_CROSSING = 0.12; // share of lines allowed to cross a gutter (titles, captions)
const MIN_PROSE_SEGMENT = 18; // median characters per column segment

interface Band {
  from: number;
  to: number;
}

function findGutters<R extends PositionedRun>(lines: PositionedLine<R>[]): number[] {
  const runs = lines.flatMap((l) => l.runs).filter((r) => r.text.trim());
  if (lines.length < 6 || runs.length === 0) return [];
  const minX = Math.min(...runs.map((r) => r.x));
  const maxX = Math.max(...runs.map((r) => r.x + r.width));
  const width = maxX - minX;
  if (width < 200) return [];
  const bins = Math.ceil(width / BIN);
  const cover = new Array<number>(bins).fill(0);
  for (const line of lines) {
    const hit = new Uint8Array(bins);
    for (const r of line.runs) {
      if (!r.text.trim()) continue;
      const a = Math.max(0, Math.floor((r.x - minX) / BIN));
      const b = Math.min(bins - 1, Math.floor((r.x + r.width - minX) / BIN));
      for (let i = a; i <= b; i++) hit[i] = 1;
    }
    for (let i = 0; i < bins; i++) cover[i] += hit[i];
  }
  // Candidate bands: runs of near-empty bins away from the page edges.
  const limit = Math.max(1, Math.floor(lines.length * MAX_CROSSING));
  const bands: Band[] = [];
  let start = -1;
  for (let i = 0; i <= bins; i++) {
    const low = i < bins && cover[i] <= limit;
    if (low && start < 0) start = i;
    if (!low && start >= 0) {
      const from = minX + start * BIN;
      const to = minX + i * BIN;
      const mid = (from + to) / 2;
      if (to - from >= MIN_GUTTER && mid > minX + width * 0.2 && mid < maxX - width * 0.2) bands.push({ from, to });
      start = -1;
    }
  }
  return bands.map((b) => (b.from + b.to) / 2);
}

function segmentOf(run: PositionedRun, gutters: number[]): number {
  const mid = run.x + run.width / 2;
  let k = 0;
  while (k < gutters.length && mid > gutters[k]) k++;
  return k;
}

function crosses(line: PositionedLine, gutters: number[]): boolean {
  return line.runs.some((r) => r.text.trim() && gutters.some((g) => r.x < g - 1 && r.x + r.width > g + 1));
}

/** Gutters are real only if the columns they separate are prose, not table cells. */
function columnsAreProse(lines: PositionedLine[], gutters: number[]): boolean {
  const lengths: number[] = [];
  let segments = 0;
  let singleCell = 0;
  for (const line of lines) {
    if (crosses(line, gutters)) continue;
    const parts = new Map<number, PositionedRun[]>();
    for (const r of line.runs) {
      if (!r.text.trim()) continue;
      const k = segmentOf(r, gutters);
      parts.set(k, [...(parts.get(k) ?? []), r]);
    }
    if (parts.size < 2) continue;
    for (const runs of parts.values()) {
      const cells = splitCells({ y: line.y, size: line.size, runs });
      segments++;
      if (cells.length === 1) singleCell++;
      lengths.push(cells.reduce((s, c) => s + c.text.length, 0));
    }
  }
  if (segments < 6) return false;
  lengths.sort((a, b) => a - b);
  const median = lengths[Math.floor(lengths.length / 2)];
  return median >= MIN_PROSE_SEGMENT && singleCell / segments >= 0.8;
}

/**
 * Returns the page's lines in reading order: column by column within each band
 * between full-width lines. Pages without a credible gutter come back as-is.
 */
export function reorderColumns<R extends PositionedRun, L extends PositionedLine<R>>(
  lines: L[],
  makeLine: (runs: R[], template: L) => L,
): L[] {
  const gutters = findGutters(lines);
  if (gutters.length === 0 || !columnsAreProse(lines, gutters)) return lines;

  const out: L[] = [];
  let columns: L[][] = gutters.map(() => []).concat([[]]);
  const flush = () => {
    for (const col of columns) out.push(...col);
    columns = columns.map(() => []);
  };
  for (const line of lines) {
    if (line.runs.length === 0 || crosses(line, gutters)) {
      flush();
      out.push(line);
      continue;
    }
    const parts = new Map<number, R[]>();
    for (const r of line.runs) {
      const k = segmentOf(r, gutters);
      parts.set(k, [...(parts.get(k) ?? []), r]);
    }
    for (const [k, runs] of parts) columns[k].push(parts.size === 1 ? line : makeLine(runs, line));
  }
  flush();
  return out;
}
