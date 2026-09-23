/**
 * Text transformations behind the Markdown editor's toolbar. Pure: they take
 * the text and the selection and return the new text and selection, so they
 * are unit-tested without a DOM, and every action is undoable as one edit.
 */

export interface Edit {
  value: string;
  start: number;
  end: number;
}

/**
 * Wraps the selection in markers (**bold**, *italic*, `code`), or unwraps it
 * when it is already wrapped. With no selection, inserts a placeholder and
 * selects it so the user can type over it.
 */
export function toggleWrap(value: string, start: number, end: number, marker: string, placeholder: string): Edit {
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);
  const m = marker.length;
  if (before.endsWith(marker) && after.startsWith(marker)) {
    return { value: before.slice(0, -m) + selected + after.slice(m), start: start - m, end: end - m };
  }
  if (selected.length > 2 * m && selected.startsWith(marker) && selected.endsWith(marker)) {
    const inner = selected.slice(m, -m);
    return { value: before + inner + after, start, end: start + inner.length };
  }
  const text = selected || placeholder;
  return { value: before + marker + text + marker + after, start: start + m, end: start + m + text.length };
}

/** The start and end offsets of the full lines touched by a selection. */
function lineRange(value: string, start: number, end: number): [number, number] {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  let to = value.indexOf("\n", end > start && value[end - 1] === "\n" ? end - 1 : end);
  if (to === -1) to = value.length;
  return [from, to];
}

export type LinePrefix = "heading" | "bullet" | "numbered" | "task" | "quote";

const PATTERNS: Record<LinePrefix, RegExp> = {
  heading: /^#{1,6} /,
  bullet: /^[-*+] (?!\[[ xX]\] )/,
  numbered: /^\d+[.)] /,
  task: /^[-*+] \[[ xX]\] /,
  quote: /^> ?/,
};

/**
 * Adds or removes a line prefix on every selected line. Headings cycle
 * # → ## → ### → plain; lists and quotes toggle; numbered lists renumber.
 */
export function toggleLinePrefix(value: string, start: number, end: number, kind: LinePrefix): Edit {
  const [from, to] = lineRange(value, start, end);
  const lines = value.slice(from, to).split("\n");
  let next: string[];
  if (kind === "heading") {
    next = lines.map((l) => {
      const h = /^(#{1,6}) /.exec(l);
      if (!h) return `# ${l}`;
      return h[1].length >= 3 ? l.slice(h[0].length) : `#${l}`;
    });
  } else {
    const all = lines.filter((l) => l.trim()).every((l) => PATTERNS[kind].test(l));
    let n = 0;
    next = lines.map((l) => {
      if (!l.trim()) return l;
      if (all) return l.replace(PATTERNS[kind], "");
      // Replace another list marker rather than stacking two.
      const bare = l.replace(PATTERNS.task, "").replace(PATTERNS.bullet, "").replace(PATTERNS.numbered, "");
      if (kind === "bullet") return `- ${bare}`;
      if (kind === "numbered") return `${++n}. ${bare}`;
      if (kind === "task") return `- [ ] ${bare}`;
      return `> ${l}`;
    });
  }
  const block = next.join("\n");
  return { value: value.slice(0, from) + block + value.slice(to), start: from, end: from + block.length };
}

/** Inserts a block (table, code fence, rule) on its own lines at the cursor. */
export function insertBlock(value: string, start: number, end: number, block: string, selectFrom = 0, selectLength = 0): Edit {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const lead = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const trail = after.startsWith("\n") ? "\n" : "\n\n";
  const at = before.length + lead.length;
  return { value: before + lead + block + trail + after, start: at + selectFrom, end: at + selectFrom + selectLength };
}

/** [text](url): the selection becomes the link text, and "url" is selected for typing. */
export function insertLink(value: string, start: number, end: number): Edit {
  const text = value.slice(start, end) || "link text";
  const isUrl = /^https?:\/\/\S+$/.test(text);
  const md = isUrl ? `[link text](${text})` : `[${text}](url)`;
  const value2 = value.slice(0, start) + md + value.slice(end);
  if (isUrl) return { value: value2, start: start + 1, end: start + 10 };
  const urlAt = start + text.length + 3;
  return { value: value2, start: urlAt, end: urlAt + 3 };
}
