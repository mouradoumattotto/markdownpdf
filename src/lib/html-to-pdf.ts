/**
 * HTML → PDF, as a clean reading-style document: the HTML goes through the
 * same Markdown pass as HTML to Markdown (headings, lists, tables, code, links,
 * images), then through the Markdown to PDF layout engine, which writes real
 * vector text. The page's own CSS is not reproduced — for a pixel copy of a
 * page, the browser's Print → Save as PDF is the right tool.
 *
 * Everything runs in the browser. Nothing is fetched except absolute image
 * URLs, which the browser loads like any web page would.
 */

import type { ImageAssets } from "@/lib/markdown-rich";
import type { MarkdownPdfResult } from "@/lib/markdown-to-pdf";

export interface HtmlToPdfOptions {
  /** Drop navigation, headers, footers and scripts first (default true). */
  mainContentOnly?: boolean;
  /** Embed images; otherwise only their alt text is kept (default true). */
  keepImages?: boolean;
  /** Local image files attached by the user, keyed by lower-case file name. */
  assets?: ImageAssets;
}

export interface PreparedHtml {
  markdown: string;
  title: string | undefined;
}

export interface HtmlPdfResult extends MarkdownPdfResult, PreparedHtml {}

export class EmptyHtmlError extends Error {
  constructor() {
    super("No readable content in this HTML");
    this.name = "EmptyHtmlError";
  }
}

/** The document's <title>, else its first heading. Pure DOM, exported for tests. */
export function htmlTitle(html: string): string | undefined {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const clean = (s: string | null | undefined) => s?.replace(/\s+/g, " ").trim() || undefined;
  return clean(doc.querySelector("title")?.textContent) ?? clean(doc.querySelector("h1")?.textContent);
}

/** HTML → the Markdown that will be laid out, plus a title for the PDF. */
export async function prepareHtml(html: string, options: HtmlToPdfOptions = {}): Promise<PreparedHtml> {
  const { htmlToMarkdown } = await import("@/lib/html-markdown");
  const markdown = await htmlToMarkdown(html, {
    mainContentOnly: options.mainContentOnly ?? true,
    keepImages: options.keepImages ?? true,
  });
  if (!markdown.replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim()) throw new EmptyHtmlError();
  return { markdown, title: htmlTitle(html) };
}

/** Throws UnsupportedScriptError (from markdown-to-pdf) for scripts the PDF fonts cannot shape. */
export async function htmlToPdf(html: string, options: HtmlToPdfOptions = {}): Promise<HtmlPdfResult> {
  const prepared = await prepareHtml(html, options);
  const { convertMarkdownToPdf } = await import("@/lib/markdown-to-pdf");
  const result = await convertMarkdownToPdf(prepared.markdown, { title: prepared.title, assets: options.assets });
  return { ...result, ...prepared };
}

/** A file name for the PDF from its title. Pure, exported for tests. */
export function pdfFileName(title: string | undefined, fallback: string): string {
  const slug = (title ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return `${slug || fallback}.pdf`;
}
