/**
 * HTML ↔ Markdown, and DOCX → Markdown.
 *
 * All three share one HTML→Markdown pass (Turndown + the GFM plugin), so a
 * table converted from a Word document and a table pasted from a web page come
 * out the same way.
 */

import type TurndownService from "turndown";

export interface HtmlToMarkdownOptions {
  /** Keep images as Markdown; otherwise only their alt text is kept. */
  keepImages?: boolean;
  /** Drop navigation, headers, footers and scripts before converting. */
  mainContentOnly?: boolean;
}

let turndown: Promise<TurndownService> | null = null;

async function getTurndown(): Promise<TurndownService> {
  turndown ??= (async () => {
    const [{ default: Turndown }, gfm] = await Promise.all([
      import("turndown"),
      import("@joplin/turndown-plugin-gfm"),
    ]);
    const service = new Turndown({
      headingStyle: "atx",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      strongDelimiter: "**",
      linkStyle: "inlined",
    });
    // Tables, strikethrough and task lists.
    service.use(gfm.gfm);
    // Turndown drops <pre> language hints; keep them so code stays highlighted.
    service.addRule("fencedCodeWithLanguage", {
      filter: (node) =>
        node.nodeName === "PRE" && node.firstChild?.nodeName === "CODE",
      replacement: (_content, node) => {
        const code = (node as HTMLElement).firstChild as HTMLElement;
        const className = code.getAttribute("class") ?? "";
        const language = /language-([\w+#.-]+)/.exec(className)?.[1] ?? "";
        const text = code.textContent ?? "";
        return `\n\n\`\`\`${language}\n${text.replace(/\n$/, "")}\n\`\`\`\n\n`;
      },
    });
    return service;
  })();
  return turndown;
}

/**
 * Elements that carry no document content. Removing them is what makes a
 * pasted web page readable instead of a wall of menu links.
 */
const CHROME_SELECTORS = "script, style, noscript, nav, aside, form, iframe, svg, [aria-hidden='true']";
/** Site header and footer — but not an article's own <header>, which often holds its title. */
const PAGE_FRAME = "header, footer";
const CONTENT_ROOTS = "main, article, [role='main']";

export async function htmlToMarkdown(html: string, options: HtmlToMarkdownOptions = {}): Promise<string> {
  const service = await getTurndown();
  // Parsed as an inert document: scripts do not run, and nothing is loaded.
  const doc = new DOMParser().parseFromString(html, "text/html");

  if (options.mainContentOnly) {
    doc.querySelectorAll(CHROME_SELECTORS).forEach((el) => el.remove());
    doc.querySelectorAll(PAGE_FRAME).forEach((el) => {
      if (!el.parentElement?.closest(CONTENT_ROOTS)) el.remove();
    });
    const main = doc.querySelector(CONTENT_ROOTS);
    if (main) {
      doc.body.replaceChildren(main);
    }
  } else {
    doc.querySelectorAll("script, style, noscript").forEach((el) => el.remove());
  }

  // A Markdown table must have a header row, and the GFM rule skips tables that
  // have none — which is exactly what Word documents produce. The first row is
  // the only sensible candidate, so promote it.
  doc.querySelectorAll("table").forEach((table) => {
    // A Markdown cell holds one line of inline content. Word wraps every cell
    // in <p>, and the GFM rule gives up on cells with block children, so the
    // paragraphs are flattened (several become lines joined by <br>).
    table.querySelectorAll("td, th").forEach((cell) => {
      const paragraphs = Array.from(cell.querySelectorAll(":scope > p"));
      if (paragraphs.length === 0) return;
      const html = paragraphs.map((p) => p.innerHTML).filter((s) => s.trim()).join("<br>");
      cell.innerHTML = html;
    });
    const firstRow = table.querySelector("tr");
    if (!firstRow) return;
    if (!table.querySelector("th")) {
      firstRow.querySelectorAll("td").forEach((td) => {
        const th = doc.createElement("th");
        th.innerHTML = td.innerHTML;
        td.replaceWith(th);
      });
    }
    // Word bolds header cells by hand; in a header row that is noise.
    table.querySelectorAll("th").forEach((th) => {
      const only = th.children.length === 1 ? th.firstElementChild : null;
      if (only && /^(STRONG|B)$/.test(only.nodeName) && only.textContent?.trim() === th.textContent?.trim()) {
        th.innerHTML = only.innerHTML;
      }
    });
    if (!table.querySelector("thead") && firstRow.querySelector("th")) {
      const thead = doc.createElement("thead");
      firstRow.parentNode?.insertBefore(thead, firstRow);
      thead.appendChild(firstRow);
    }
  });

  if (!options.keepImages) {
    doc.querySelectorAll("img").forEach((img) => {
      const alt = img.getAttribute("alt")?.trim();
      img.replaceWith(alt ? doc.createTextNode(alt) : doc.createTextNode(""));
    });
  }

  return tidy(service.turndown(doc.body.innerHTML));
}

export interface MarkdownToHtmlOptions {
  /** Wrap the fragment in a full HTML document with minimal styling. */
  fullDocument?: boolean;
  title?: string;
}

export async function markdownToHtml(markdown: string, options: MarkdownToHtmlOptions = {}): Promise<string> {
  const [{ Marked }, { default: DOMPurify }] = await Promise.all([import("marked"), import("dompurify")]);
  // Plain GFM, not the preview renderer: its Mermaid and math placeholders only
  // come alive inside this site. Exported, a diagram stays a ```mermaid block
  // and math stays $…$, which is what other renderers (GitHub, MkDocs) expect.
  // YAML front matter is metadata for a site generator, not content; left in,
  // it renders as a rule followed by a stray heading.
  const content = markdown.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/, "");
  const body = DOMPurify.sanitize(await new Marked({ gfm: true }).parse(content));
  if (!options.fullDocument) return body;
  const title = (options.title ?? "Document").replace(/[<>&]/g, "");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body { max-width: 46rem; margin: 2rem auto; padding: 0 1rem; font: 16px/1.6 system-ui, sans-serif; color: #1c1917; }
  pre { background: #f5f5f4; padding: 1rem; border-radius: 6px; overflow-x: auto; }
  code { font-family: ui-monospace, monospace; font-size: 0.9em; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #d6d3d1; padding: 0.4rem 0.6rem; text-align: left; }
  blockquote { border-left: 3px solid #a8a29e; margin: 0; padding-left: 1rem; color: #57534e; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>
${body}</body>
</html>
`;
}

export interface DocxResult {
  markdown: string;
  /** Conversion notes from the document (unsupported styles, dropped bits). */
  warnings: string[];
  /** Images found in the document, when they were extracted. */
  images: { name: string; blob: Blob }[];
}

export type DocxImageMode = "omit" | "embed" | "extract";

/**
 * DOCX → Markdown, via mammoth's semantic HTML (headings, lists, tables,
 * emphasis) and the same Turndown pass as the HTML converter.
 */
export async function docxToMarkdown(file: File, imageMode: DocxImageMode = "omit"): Promise<DocxResult> {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const images: { name: string; blob: Blob }[] = [];
  let index = 0;

  const convertImage =
    imageMode === "omit"
      ? undefined
      : mammoth.images.imgElement(async (image) => {
          index += 1;
          const extension = (image.contentType.split("/")[1] ?? "png").replace("jpeg", "jpg");
          const name = `image-${String(index).padStart(2, "0")}.${extension}`;
          if (imageMode === "embed") {
            const base64 = (await image.read("base64")) as string;
            return { src: `data:${image.contentType};base64,${base64}`, alt: name };
          }
          const buffer = (await image.read()) as ArrayBuffer;
          images.push({ name, blob: new Blob([buffer], { type: image.contentType }) });
          return { src: `images/${name}`, alt: name };
        });

  const result = await mammoth.convertToHtml(
    { arrayBuffer: await file.arrayBuffer() },
    convertImage ? { convertImage } : {},
  );
  const markdown = await htmlToMarkdown(result.value, { keepImages: imageMode !== "omit" });
  return {
    markdown,
    warnings: [...new Set(result.messages.map((m) => m.message))].slice(0, 20),
    images,
  };
}

/**
 * Tidies what Turndown emits: it pads list markers ("-   item", "1.  item")
 * and leaves trailing spaces and triple blank lines behind.
 */
function tidy(markdown: string): string {
  return markdown
    .replace(/^(\s*)([-*+])[ \t]{2,}/gm, "$1$2 ")
    .replace(/^(\s*)(\d+\.)[ \t]{2,}/gm, "$1$2 ")
    .replace(/ /g, " ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .concat("\n");
}
