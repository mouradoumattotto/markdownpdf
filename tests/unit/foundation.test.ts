import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  countBucket,
  durationBucket,
  extensionOf,
  pageBucket,
  sanitizeParams,
  sizeBucket,
} from "@/lib/analytics";
import { classifyPdfError, baseName, sniffPdf } from "@/lib/files";
import { OCR_ASSET_VERSION, OCR_LANGUAGES } from "@/lib/ocr";
import { PDFJS_ASSET_VERSION } from "@/lib/pdfjs";
import { MATHJAX_VERSION, MERMAID_VERSION } from "@/lib/markdown-rich";
import { CATEGORIES, MIN_TOOLS_PER_HUB, TOOLS, liveCategories, relatedTools } from "@/lib/tools";
import { getAllPosts } from "@/lib/blog";

const root = join(__dirname, "..", "..");
const pkgVersion = (name: string) =>
  JSON.parse(readFileSync(join(root, "node_modules", name, "package.json"), "utf8")).version;

describe("analytics privacy guard", () => {
  it("drops parameters that are not on the allowlist", () => {
    const out = sanitizeParams({
      tool_name: "pdf-to-markdown",
      file_name: "salary-2026.pdf",
      text: "confidential",
      title: "Quarterly Report",
    });
    expect(out).toEqual({ tool_name: "pdf-to-markdown" });
  });

  it("drops long strings even on allowed keys", () => {
    const out = sanitizeParams({ tool_name: "x".repeat(33), input_format: "pdf" });
    expect(out).toEqual({ input_format: "pdf" });
  });

  it("keeps booleans and finite numbers, drops objects and NaN", () => {
    const out = sanitizeParams({ ocr_used: true, error_code: { nested: 1 }, page_count_bucket: NaN });
    expect(out).toEqual({ ocr_used: true });
  });

  it("buckets are coarse", () => {
    expect(sizeBucket(500_000)).toBe("<1mb");
    expect(sizeBucket(5 * 1024 * 1024)).toBe("1-10mb");
    expect(sizeBucket(80 * 1024 * 1024)).toBe("50mb+");
    expect(pageBucket(1)).toBe("1");
    expect(pageBucket(300)).toBe("200+");
    expect(durationBucket(1500)).toBe("<2s");
    expect(countBucket(3)).toBe("2-5");
    expect(extensionOf("My.Report.PDF")).toBe("pdf");
    expect(extensionOf("noext")).toBe("unknown");
  });
});

describe("file helpers", () => {
  it("sniffs real PDF bytes, not the extension", async () => {
    expect(await sniffPdf(new Blob([]))).toBe("empty");
    expect(await sniffPdf(new Blob(["hello"]))).toBe("not_pdf");
    expect(await sniffPdf(new Blob(["junk\n%PDF-1.7\n..."]))).toBe("ok");
  });

  it("classifies errors without leaking the raw message", () => {
    const pw = Object.assign(new Error("No password given"), { name: "PasswordException" });
    expect(classifyPdfError(pw).code).toBe("encrypted");
    const bad = Object.assign(new Error("Invalid PDF structure."), { name: "InvalidPDFException" });
    expect(classifyPdfError(bad).code).toBe("corrupted");
    expect(classifyPdfError(new Error("boom")).message).not.toContain("boom");
  });

  it("baseName strips only the extension", () => {
    expect(baseName("Report (final).v2.pdf")).toBe("Report (final).v2");
  });
});

describe("self-hosted assets stay in sync", () => {
  it("OCR asset version matches the installed tesseract.js", () => {
    expect(OCR_ASSET_VERSION).toBe(pkgVersion("tesseract.js"));
  });
  it("pdf.js asset version matches the installed pdfjs-dist", () => {
    expect(PDFJS_ASSET_VERSION).toBe(pkgVersion("pdfjs-dist"));
  });
  it("vendored MathJax and Mermaid versions match the installed packages", () => {
    expect(MATHJAX_VERSION).toBe(pkgVersion("mathjax-full"));
    expect(MERMAID_VERSION).toBe(pkgVersion("mermaid"));
  });
  it("every OCR language has its data copied by the asset script", () => {
    const script = readFileSync(join(root, "scripts", "copy-ocr-assets.mjs"), "utf8");
    const langs = JSON.parse(/const LANGS = (\[[^\]]+\])/.exec(script)![1].replace(/'/g, '"'));
    expect([...langs].sort()).toEqual(OCR_LANGUAGES.map((l) => l.code).sort());
  });
});

describe("tool registry integrity", () => {
  const posts = new Set(getAllPosts().map((p) => p.slug));

  it("slugs and paths are unique", () => {
    expect(new Set(TOOLS.map((t) => t.slug)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map((t) => t.path)).size).toBe(TOOLS.length);
  });

  it("every tool path has a page file", () => {
    for (const t of TOOLS) {
      const file = t.path === "/" ? "src/app/page.tsx" : `src/app${t.path}/page.tsx`;
      expect(existsSync(join(root, file)), `${t.slug} -> ${file}`).toBe(true);
    }
  });

  it("every live hub has a page file", () => {
    for (const c of liveCategories()) {
      expect(existsSync(join(root, `src/app${c.path}/page.tsx`)), c.path).toBe(true);
    }
  });

  it("guides point at real posts", () => {
    for (const t of TOOLS) for (const g of t.guides) expect(posts.has(g), `${t.slug} -> ${g}`).toBe(true);
  });

  it("related tools never include the tool itself", () => {
    for (const t of TOOLS) expect(relatedTools(t.slug).map((r) => r.slug)).not.toContain(t.slug);
  });

  it("every tool has at least one related tool once the suite has more than two tools", () => {
    if (TOOLS.length > 2) for (const t of TOOLS) expect(relatedTools(t.slug).length, t.slug).toBeGreaterThan(0);
  });

  it("categories are well formed", () => {
    expect(MIN_TOOLS_PER_HUB).toBeGreaterThanOrEqual(3);
    for (const c of CATEGORIES) expect(c.path.startsWith("/")).toBe(true);
  });
});
