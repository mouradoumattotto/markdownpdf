/**
 * Turns a converted PDF into an Obsidian note.
 *
 * - YAML properties Obsidian shows in its Properties panel (title, source,
 *   pages, created, tags).
 * - Images become attachments embedded with ![[wikilinks]]. Obsidian resolves
 *   a wikilink by file name anywhere in the vault, so names are prefixed with
 *   the note's slug: two PDFs can no longer both claim "page-1-1.png".
 * - Optional page markers as Obsidian comments (%% … %%): hidden in reading
 *   view, searchable, and they let you cite the original page.
 */

export interface ObsidianInput {
  markdown: string;
  pageOutputs: string[];
  sourceName: string;
  pageCount: number;
  imageNames: string[];
  pageMarkers: boolean;
  tags: string[];
  /** YYYY-MM-DD */
  date: string;
}

export interface ObsidianNote {
  /** File name of the note, without folder: "My Paper.md". */
  fileName: string;
  title: string;
  content: string;
  /** Original image name → attachment name. */
  attachments: Map<string, string>;
}

/** Characters Obsidian refuses in note names, plus the ones that break links. */
export function safeNoteName(title: string): string {
  return (
    title
      .replace(/[\\/:*?"<>|#^[\]]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "PDF note"
  );
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "pdf";

const yamlString = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

export function titleOf(markdown: string, sourceName: string): string {
  const h1 = /^#\s+(.+)$/m.exec(markdown)?.[1];
  return (h1 ?? sourceName.replace(/\.pdf$/i, "")).replace(/[*_`]/g, "").trim();
}

export function toObsidianNote(input: ObsidianInput): ObsidianNote {
  const title = titleOf(input.markdown, input.sourceName);
  const slug = slugify(title);
  const attachments = new Map(input.imageNames.map((n) => [n, `${slug}-${n}`]));
  const embed = (text: string) =>
    text.replace(/!\[[^\]]*\]\(images\/([^)\s]+)\)/g, (m, name: string) =>
      attachments.has(name) ? `![[${attachments.get(name)}]]` : m,
    );

  const body = input.pageMarkers
    ? input.pageOutputs
        .map((p, i) => ({ p: p.trim(), n: i + 1 }))
        .filter(({ p }) => p)
        .map(({ p, n }) => `%% page ${n} %%\n\n${embed(p)}`)
        .join("\n\n")
    : embed(input.markdown.trim());

  const tags = input.tags.map((t) => t.trim().replace(/^#/, "").replace(/\s+/g, "-")).filter(Boolean);
  const front = [
    "---",
    `title: ${yamlString(title)}`,
    `source: ${yamlString(input.sourceName)}`,
    `pages: ${input.pageCount}`,
    `created: ${input.date}`,
    ...(tags.length ? ["tags:", ...tags.map((t) => `  - ${t}`)] : []),
    "---",
  ].join("\n");

  return { fileName: `${safeNoteName(title)}.md`, title, content: `${front}\n\n${body}\n`, attachments };
}
