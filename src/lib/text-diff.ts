/**
 * Line diff with word-level highlighting inside changed lines, built on
 * jsdiff. Pure (no DOM), unit-tested; the UI only renders the rows.
 */

export interface Segment {
  text: string;
  /** "same" text is shown plainly; "changed" is highlighted. */
  kind: "same" | "changed";
}

export type DiffRow =
  | { kind: "same"; leftNo: number; rightNo: number; text: string }
  | { kind: "removed"; leftNo: number; text: string }
  | { kind: "added"; rightNo: number; text: string }
  | { kind: "changed"; leftNo: number; rightNo: number; left: Segment[]; right: Segment[] }
  | { kind: "skipped"; count: number };

export interface DiffOptions {
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
  /** Unchanged lines kept around each change; longer unchanged runs are collapsed. */
  context?: number;
}

export interface DiffResult {
  rows: DiffRow[];
  stats: { added: number; removed: number; changed: number; unchanged: number };
  identical: boolean;
}

/** Diffing gives up after this long: two unrelated 50,000-line files are not worth freezing the page. */
const TIMEOUT_MS = 4000;

export class DiffTooComplexError extends Error {}

const splitLines = (value: string) => {
  const lines = value.split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
};

export async function diffTexts(a: string, b: string, options: DiffOptions = {}): Promise<DiffResult> {
  const { diffArrays, diffWordsWithSpace } = await import("diff");
  // Lines are compared through a normalising comparator, so "ignore case" and
  // "ignore whitespace" change what counts as equal without altering the text shown.
  const norm = (line: string) => {
    let s = options.ignoreWhitespace ? line.replace(/\s+/g, " ").trim() : line;
    if (options.ignoreCase) s = s.toLocaleLowerCase();
    return s;
  };
  const leftLines = splitLines(a.replace(/\r\n?/g, "\n"));
  const rightLines = splitLines(b.replace(/\r\n?/g, "\n"));
  const raw = diffArrays(leftLines, rightLines, {
    comparator: (x: string, y: string) => x === y || norm(x) === norm(y),
    timeout: TIMEOUT_MS,
  });
  if (!raw) throw new DiffTooComplexError();
  const changes = raw.map((c) => ({ added: c.added, removed: c.removed, lines: c.value }));

  const full: Exclude<DiffRow, { kind: "skipped" }>[] = [];
  const stats = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  let leftNo = 0;
  let rightNo = 0;

  for (let i = 0; i < changes.length; i++) {
    const c = changes[i];
    if (!c.added && !c.removed) {
      for (const text of c.lines) {
        full.push({ kind: "same", leftNo: ++leftNo, rightNo: ++rightNo, text });
        stats.unchanged++;
      }
      continue;
    }
    // A removal followed by an addition is an edit: pair the lines up and
    // show what changed inside them, word by word.
    const next = changes[i + 1];
    if (c.removed && next?.added) {
      const removed = c.lines;
      const added = next.lines;
      const pairs = Math.min(removed.length, added.length);
      for (let k = 0; k < pairs; k++) {
        const words = diffWordsWithSpace(removed[k], added[k], { ignoreCase: options.ignoreCase });
        const leftSegs: Segment[] = [];
        const rightSegs: Segment[] = [];
        for (const w of words) {
          if (!w.added) leftSegs.push({ text: w.value, kind: w.removed ? "changed" : "same" });
          if (!w.removed) rightSegs.push({ text: w.value, kind: w.added ? "changed" : "same" });
        }
        full.push({ kind: "changed", leftNo: ++leftNo, rightNo: ++rightNo, left: leftSegs, right: rightSegs });
        stats.changed++;
      }
      for (const text of removed.slice(pairs)) {
        full.push({ kind: "removed", leftNo: ++leftNo, text });
        stats.removed++;
      }
      for (const text of added.slice(pairs)) {
        full.push({ kind: "added", rightNo: ++rightNo, text });
        stats.added++;
      }
      i++;
      continue;
    }
    for (const text of c.lines) {
      if (c.removed) {
        full.push({ kind: "removed", leftNo: ++leftNo, text });
        stats.removed++;
      } else {
        full.push({ kind: "added", rightNo: ++rightNo, text });
        stats.added++;
      }
    }
  }

  const identical = stats.added + stats.removed + stats.changed === 0;
  return { rows: collapse(full, options.context ?? 3), stats, identical };
}

/** Replaces long runs of unchanged lines with a "skipped" row, keeping `context` lines around each change. */
export function collapse(rows: Exclude<DiffRow, { kind: "skipped" }>[], context: number): DiffRow[] {
  const keep = rows.map((r) => r.kind !== "same");
  const near = keep.map((_, i) => {
    for (let d = -context; d <= context; d++) if (keep[i + d]) return true;
    return false;
  });
  const out: DiffRow[] = [];
  let skipped = 0;
  rows.forEach((row, i) => {
    if (near[i]) {
      if (skipped) out.push({ kind: "skipped", count: skipped });
      skipped = 0;
      out.push(row);
    } else skipped++;
  });
  if (skipped) out.push({ kind: "skipped", count: skipped });
  return out;
}

/** A unified diff (the format of `diff -u` and Git), for download. */
export async function unifiedPatch(a: string, b: string, leftName: string, rightName: string): Promise<string> {
  const { createTwoFilesPatch } = await import("diff");
  return createTwoFilesPatch(leftName, rightName, a.replace(/\r\n?/g, "\n"), b.replace(/\r\n?/g, "\n"), "", "", { context: 3 });
}
