/**
 * EPUB ↔ Markdown, in the browser.
 *
 * Reading: the container points at the package document (OPF), whose spine is
 * the reading order. Each XHTML file in the spine goes through the shared
 * HTML → Markdown pass, with images renamed to unique names and returned as
 * blobs, so the Markdown → PDF engine can embed them (ImageAssets).
 *
 * Writing: Markdown → sanitised HTML → chapters split at headings, serialised
 * as XHTML (XMLSerializer, so escaping and void elements are always
 * well-formed) and packed as EPUB 3, with an NCX table of contents for older
 * EPUB 2 readers. `mimetype` is the first entry and stored uncompressed, as
 * the OCF spec requires.
 *
 * Needs DOMParser / XMLSerializer: browser only (jsdom in tests).
 */

import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from "fflate";
import { htmlToMarkdown, markdownToHtml } from "@/lib/html-markdown";

const XHTML_NS = "http://www.w3.org/1999/xhtml";

/** Encryption algorithms used for font obfuscation only — not DRM. */
const FONT_OBFUSCATION = new Set(["http://www.idpf.org/2008/embedding", "http://ns.adobe.com/pdf/enc#RC"]);

export class EpubDrmError extends Error {
  constructor() {
    super("This EPUB is protected by DRM");
    this.name = "EpubDrmError";
  }
}

export class EpubFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EpubFormatError";
  }
}

// ---- Reading -----------------------------------------------------------------

export interface EpubContent {
  title: string;
  /** Book language from the OPF, if declared. */
  language: string | null;
  markdown: string;
  /** Images referenced from the Markdown by name (lower case), e.g. "epub-image-3.jpg". */
  images: Map<string, Blob>;
  chapters: number;
}

function elementsByLocalName(root: Document | Element, name: string): Element[] {
  return Array.from(root.getElementsByTagName("*")).filter((el) => el.localName === name);
}

/** Resolves `href` (URL-encoded, relative) against the directory of `base`, inside the zip. */
export function resolvePath(base: string, href: string): string {
  const path = decodeURIComponent(href.split(/[?#]/)[0]);
  const parts = path.startsWith("/") ? [] : base.split("/").slice(0, -1);
  for (const seg of path.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/** Throws EpubDrmError when the book is encrypted beyond font obfuscation. */
export function assertNoDrm(files: Record<string, Uint8Array>): void {
  if (files["META-INF/rights.xml"] || files["META-INF/sinf.xml"]) throw new EpubDrmError();
  const encryption = files["META-INF/encryption.xml"];
  if (!encryption) return;
  const doc = new DOMParser().parseFromString(strFromU8(encryption), "application/xml");
  const algorithms = elementsByLocalName(doc, "EncryptionMethod").map((m) => m.getAttribute("Algorithm") ?? "");
  // A content key wrapped for a reader (Adobe ADEPT, Readium LCP) is DRM even if
  // the method list looks harmless.
  if (elementsByLocalName(doc, "RetrievalMethod").length > 0 || elementsByLocalName(doc, "KeyName").length > 0) {
    throw new EpubDrmError();
  }
  if (algorithms.some((a) => !FONT_OBFUSCATION.has(a))) throw new EpubDrmError();
}

function parseXml(text: string, what: string): Document {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) throw new EpubFormatError(`The ${what} is not valid XML`);
  return doc;
}

export async function readEpub(data: Uint8Array): Promise<EpubContent> {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(data);
  } catch {
    throw new EpubFormatError("This file is not an EPUB (it is not a ZIP archive)");
  }
  assertNoDrm(files);

  const container = files["META-INF/container.xml"];
  if (!container) throw new EpubFormatError("This file is not an EPUB (META-INF/container.xml is missing)");
  const rootfile = elementsByLocalName(parseXml(strFromU8(container), "container"), "rootfile")[0];
  const opfPath = rootfile?.getAttribute("full-path");
  if (!opfPath || !files[opfPath]) throw new EpubFormatError("The EPUB's package document is missing");
  const opf = parseXml(strFromU8(files[opfPath]), "package document");

  const manifest = new Map<string, { href: string; type: string }>();
  for (const item of elementsByLocalName(opf, "item")) {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    if (id && href) manifest.set(id, { href: resolvePath(opfPath, href), type: item.getAttribute("media-type") ?? "" });
  }
  const spine = elementsByLocalName(opf, "itemref")
    .filter((ref) => ref.getAttribute("linear") !== "no")
    .map((ref) => manifest.get(ref.getAttribute("idref") ?? ""))
    .filter((it): it is { href: string; type: string } => Boolean(it && files[it.href]) && /html/.test(it!.type));
  if (spine.length === 0) throw new EpubFormatError("The EPUB has no readable chapters");

  const title = elementsByLocalName(opf, "title")[0]?.textContent?.trim() || "Untitled book";
  const language = elementsByLocalName(opf, "language")[0]?.textContent?.trim() || null;

  const images = new Map<string, Blob>();
  const imageNames = new Map<string, string>();
  const imageName = (path: string): string | null => {
    const known = imageNames.get(path);
    if (known) return known;
    const bytes = files[path];
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    if (!bytes || !IMAGE_TYPES[ext]) return null;
    const name = `epub-image-${imageNames.size + 1}.${ext === "jpeg" ? "jpg" : ext}`;
    imageNames.set(path, name);
    images.set(name, new Blob([bytes as BlobPart], { type: IMAGE_TYPES[ext] }));
    return name;
  };

  const parts: string[] = [];
  for (const chapter of spine) {
    const doc = new DOMParser().parseFromString(strFromU8(files[chapter.href]), "text/html");
    // Covers are often an <svg> wrapping an <image>: make them plain images.
    doc.querySelectorAll("svg").forEach((svg) => {
      const image = svg.querySelector("image");
      const href = image?.getAttribute("href") ?? image?.getAttribute("xlink:href");
      if (!href) return;
      const img = doc.createElement("img");
      img.setAttribute("src", href);
      img.setAttribute("alt", "");
      svg.replaceWith(img);
    });
    doc.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      const name = src && !/^[a-z]+:/i.test(src) ? imageName(resolvePath(chapter.href, src)) : null;
      if (name) img.setAttribute("src", name);
      else img.replaceWith(doc.createTextNode(img.getAttribute("alt") ?? ""));
    });
    // Links between chapters point at files that will not exist in a PDF: keep their text.
    doc.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href") ?? "";
      if (!/^(https?:|mailto:)/i.test(href)) a.replaceWith(...Array.from(a.childNodes));
    });
    const md = await htmlToMarkdown(doc.body?.innerHTML ?? "", { keepImages: true });
    if (md.trim()) parts.push(md.trim());
  }
  if (parts.length === 0) throw new EpubFormatError("The EPUB's chapters contain no text");

  return { title, language, markdown: parts.join("\n\n---\n\n") + "\n", images, chapters: parts.length };
}

// ---- Writing -----------------------------------------------------------------

export interface EpubChapter {
  title: string;
  /** Well-formed XHTML body content. */
  xhtml: string;
}

export interface WriteEpubOptions {
  title: string;
  language?: string;
  /** Fixed values for reproducible output (tests). */
  identifier?: string;
  modified?: Date;
}

const escapeXml = (s: string) =>
  s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);

/** Characters XML 1.0 forbids — PDF text layers sometimes carry them. */
const stripInvalidXml = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "");

/**
 * Splits sanitised HTML into chapters: at every <h1> if there are two or
 * more, else at every <h2>, else one chapter. Content before the first
 * heading joins the first chapter.
 */
export function splitChapters(html: string, fallbackTitle: string): EpubChapter[] {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const body = doc.body;
  const level = body.querySelectorAll(":scope > h1").length >= 2 ? "H1" : body.querySelectorAll(":scope > h2").length >= 2 ? "H2" : null;

  const groups: Node[][] = [[]];
  for (const node of Array.from(body.childNodes)) {
    const isBreak = level && node.nodeName === level;
    if (isBreak && groups[groups.length - 1].some((n) => n.nodeType === 1)) groups.push([]);
    groups[groups.length - 1].push(node);
  }

  const serializer = new XMLSerializer();
  return groups
    .filter((g) => g.some((n) => n.nodeType === 1 || n.textContent?.trim()))
    .map((nodes, i) => {
      const section = doc.createElement("section");
      nodes.forEach((n) => section.appendChild(n));
      const heading = section.querySelector("h1, h2, h3");
      return {
        title: heading?.textContent?.trim() || (i === 0 ? fallbackTitle : `Chapter ${i + 1}`),
        xhtml: serializer.serializeToString(section),
      };
    });
}

const CSS = `body { font-family: serif; line-height: 1.5; margin: 0 5%; }
h1, h2, h3, h4 { font-family: sans-serif; line-height: 1.25; page-break-after: avoid; }
pre { white-space: pre-wrap; font-size: 0.85em; }
code { font-family: monospace; }
table { border-collapse: collapse; margin: 1em 0; }
th, td { border: 1px solid #999; padding: 0.25em 0.5em; text-align: left; }
blockquote { margin: 1em 2em; font-style: italic; }
img { max-width: 100%; }
`;

function chapterDocument(chapter: EpubChapter, language: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="${XHTML_NS}" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escapeXml(language)}" xml:lang="${escapeXml(language)}">
<head>
<meta charset="utf-8"/>
<title>${escapeXml(chapter.title)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
${chapter.xhtml}
</body>
</html>
`;
}

export function writeEpub(chapters: EpubChapter[], options: WriteEpubOptions): Uint8Array {
  if (chapters.length === 0) throw new EpubFormatError("There is no text to put in the EPUB");
  const title = stripInvalidXml(options.title).trim() || "Untitled";
  const language = options.language || "en";
  const id = options.identifier ?? `urn:uuid:${crypto.randomUUID()}`;
  const modified = (options.modified ?? new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");
  const t = escapeXml(title);
  const names = chapters.map((_, i) => `chapter-${String(i + 1).padStart(3, "0")}.xhtml`);

  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${escapeXml(language)}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="book-id">${escapeXml(id)}</dc:identifier>
<dc:title>${t}</dc:title>
<dc:language>${escapeXml(language)}</dc:language>
<meta property="dcterms:modified">${modified}</meta>
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
<item id="css" href="style.css" media-type="text/css"/>
${names.map((n, i) => `<item id="c${i + 1}" href="${n}" media-type="application/xhtml+xml"/>`).join("\n")}
</manifest>
<spine toc="ncx">
${names.map((_, i) => `<itemref idref="c${i + 1}"/>`).join("\n")}
</spine>
</package>
`;

  const nav = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="${XHTML_NS}" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escapeXml(language)}" xml:lang="${escapeXml(language)}">
<head><meta charset="utf-8"/><title>${t}</title></head>
<body>
<nav epub:type="toc" id="toc"><h1>Contents</h1>
<ol>
${chapters.map((c, i) => `<li><a href="${names[i]}">${escapeXml(stripInvalidXml(c.title))}</a></li>`).join("\n")}
</ol>
</nav>
</body>
</html>
`;

  const ncx = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
<head><meta name="dtb:uid" content="${escapeXml(id)}"/></head>
<docTitle><text>${t}</text></docTitle>
<navMap>
${chapters
  .map(
    (c, i) =>
      `<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${escapeXml(stripInvalidXml(c.title))}</text></navLabel><content src="${names[i]}"/></navPoint>`,
  )
  .join("\n")}
</navMap>
</ncx>
`;

  const container = `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>
`;

  // Insertion order is archive order: mimetype must come first, stored.
  const zip: Zippable = {
    mimetype: [strToU8("application/epub+zip"), { level: 0 }],
    "META-INF/container.xml": strToU8(container),
    "OEBPS/content.opf": strToU8(opf),
    "OEBPS/nav.xhtml": strToU8(nav),
    "OEBPS/toc.ncx": strToU8(ncx),
    "OEBPS/style.css": strToU8(CSS),
  };
  chapters.forEach((c, i) => {
    zip[`OEBPS/${names[i]}`] = strToU8(chapterDocument({ ...c, title: stripInvalidXml(c.title) }, language));
  });
  return zipSync(zip, { level: 6 });
}

/** Markdown → EPUB bytes. The title defaults to the first H1. */
export async function markdownToEpub(
  markdown: string,
  options: Partial<WriteEpubOptions> & { fallbackTitle: string },
): Promise<{ bytes: Uint8Array; chapters: number; title: string }> {
  const html = await markdownToHtml(stripInvalidXml(markdown));
  const firstH1 = /^#\s+(.+)$/m.exec(markdown)?.[1]?.replace(/[*_`]/g, "").trim();
  const title = options.title || firstH1 || options.fallbackTitle;
  const chapters = splitChapters(html, title);
  return { bytes: writeEpub(chapters, { ...options, title }), chapters: chapters.length, title };
}
