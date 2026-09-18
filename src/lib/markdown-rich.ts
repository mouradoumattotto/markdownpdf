/**
 * Browser-only helpers for rich Markdown: math (MathJax -> SVG), diagrams
 * (Mermaid -> SVG), syntax highlighting (highlight.js), images, and SVG -> PNG
 * rasterization for the jsPDF export.
 *
 * Every library here is heavy and loaded only when a document actually uses
 * the feature: a plain Markdown file never downloads MathJax or Mermaid.
 */

import { decodeSource, type Highlighter } from "@/lib/markdown-render";

// ---- Syntax highlighting ----------------------------------------------------

const LANGUAGES: Record<string, () => Promise<{ default: unknown }>> = {
  javascript: () => import("highlight.js/lib/languages/javascript"),
  typescript: () => import("highlight.js/lib/languages/typescript"),
  python: () => import("highlight.js/lib/languages/python"),
  bash: () => import("highlight.js/lib/languages/bash"),
  shell: () => import("highlight.js/lib/languages/shell"),
  json: () => import("highlight.js/lib/languages/json"),
  xml: () => import("highlight.js/lib/languages/xml"),
  css: () => import("highlight.js/lib/languages/css"),
  java: () => import("highlight.js/lib/languages/java"),
  go: () => import("highlight.js/lib/languages/go"),
  rust: () => import("highlight.js/lib/languages/rust"),
  sql: () => import("highlight.js/lib/languages/sql"),
  yaml: () => import("highlight.js/lib/languages/yaml"),
  markdown: () => import("highlight.js/lib/languages/markdown"),
  c: () => import("highlight.js/lib/languages/c"),
  cpp: () => import("highlight.js/lib/languages/cpp"),
  csharp: () => import("highlight.js/lib/languages/csharp"),
  php: () => import("highlight.js/lib/languages/php"),
  ruby: () => import("highlight.js/lib/languages/ruby"),
  diff: () => import("highlight.js/lib/languages/diff"),
  kotlin: () => import("highlight.js/lib/languages/kotlin"),
  swift: () => import("highlight.js/lib/languages/swift"),
};
const ALIASES: Record<string, string> = {
  js: "javascript", jsx: "javascript", mjs: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", sh: "bash", zsh: "bash", console: "shell", html: "xml", svg: "xml", vue: "xml",
  yml: "yaml", md: "markdown", "c++": "cpp", cs: "csharp", rb: "ruby", kt: "kotlin",
};

type HljsCore = typeof import("highlight.js/lib/core").default;
let hljsCore: Promise<HljsCore> | null = null;

/** Returns a highlighter that knows every language used in `langs`. */
export async function loadHighlighter(langs: string[]): Promise<Highlighter> {
  hljsCore ??= import("highlight.js/lib/core").then((m) => m.default);
  const hljs = await hljsCore;
  const wanted = [...new Set(langs.map((l) => ALIASES[l] ?? l).filter((l) => l in LANGUAGES))];
  await Promise.all(
    wanted
      .filter((l) => !hljs.getLanguage(l))
      .map(async (l) => hljs.registerLanguage(l, (await LANGUAGES[l]()).default as Parameters<HljsCore["registerLanguage"]>[1])),
  );
  return (code, lang) => {
    const name = ALIASES[lang] ?? lang;
    if (!hljs.getLanguage(name)) return null;
    try {
      return hljs.highlight(code, { language: name, ignoreIllegals: true }).value;
    } catch {
      return null;
    }
  };
}

/** Fenced-code languages used in a document, for loadHighlighter(). */
export function codeLanguages(markdown: string): string[] {
  return [...markdown.matchAll(/^\s*(?:```|~~~)\s*([\w+#.-]+)/gm)].map((m) => m[1].toLowerCase());
}

// ---- Math (MathJax, SVG output) --------------------------------------------
//
// MathJax and Mermaid are loaded from their official prebuilt browser bundles,
// copied to /vendor by scripts/copy-ocr-assets.mjs, rather than compiled into
// our bundle: their module graphs pushed `next build` past 8 GB of memory.
// The versions here must match the installed packages (asserted in tests).

export const MATHJAX_VERSION = "3.2.1";
export const MERMAID_VERSION = "12.0.0";

interface MathJaxGlobal {
  startup: { promise: Promise<void> };
  tex2svg(tex: string, options: { display: boolean }): HTMLElement;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded) return resolve();
    const el = existing ?? document.createElement("script");
    el.addEventListener("load", () => {
      el.dataset.loaded = "1";
      resolve();
    });
    el.addEventListener("error", () => reject(new Error(`failed to load ${src}`)));
    if (!existing) {
      el.src = src;
      el.async = true;
      document.head.appendChild(el);
    }
  });
}

let mathJax: Promise<MathJaxGlobal> | null = null;
const mathCache = new Map<string, string>();

function loadMathJax(): Promise<MathJaxGlobal> {
  mathJax ??= (async () => {
    const w = window as unknown as { MathJax?: unknown };
    // Configuration must exist before the script runs.
    w.MathJax = {
      startup: { typeset: false },
      // No shared glyph cache: every SVG must be self-contained to be
      // rasterized on its own for the PDF export.
      svg: { fontCache: "none" },
      options: { enableMenu: false },
      loader: { load: [] },
    };
    await loadScript(`/vendor/mathjax-${MATHJAX_VERSION}/tex-svg-full.js`);
    const mj = w.MathJax as MathJaxGlobal;
    await mj.startup.promise;
    return mj;
  })();
  mathJax.catch(() => {
    mathJax = null; // allow a retry after a network hiccup
  });
  return mathJax;
}

export async function renderMath(tex: string, display: boolean): Promise<string> {
  const key = `${display ? "D" : "I"}:${tex}`;
  const hit = mathCache.get(key);
  if (hit) return hit;
  const mj = await loadMathJax();
  const node = mj.tex2svg(tex, { display });
  const svg = node.querySelector("svg");
  if (!svg) throw new Error("MathJax produced no SVG");
  if (svg.querySelector("[data-mjx-error], merror")) throw new Error("TeX error");
  const out = svg.outerHTML;
  mathCache.set(key, out);
  return out;
}

// ---- Diagrams (Mermaid) -----------------------------------------------------

interface MermaidApi {
  initialize(config: Record<string, unknown>): void;
  render(id: string, text: string): Promise<{ svg: string }>;
}
let mermaidApi: Promise<MermaidApi> | null = null;
const mermaidCache = new Map<string, string>();
let mermaidSeq = 0;

function loadMermaid(): Promise<MermaidApi> {
  mermaidApi ??= (async () => {
    // Native ESM import of a static file: the bundler must leave it alone, and
    // the browser then fetches only the chunks the diagram type needs.
    const url = `/vendor/mermaid-${MERMAID_VERSION}/mermaid.esm.min.mjs`;
    const mod = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url)) as { default: MermaidApi };
    const mermaid = mod.default;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "neutral",
      // SVG <text> labels instead of HTML <foreignObject>: required to turn a
      // diagram into an image for the PDF (a canvas refuses foreignObject).
      htmlLabels: false,
      fontFamily: "Helvetica, Arial, sans-serif",
    });
    return mermaid;
  })();
  mermaidApi.catch(() => {
    mermaidApi = null;
  });
  return mermaidApi;
}

export async function renderMermaid(code: string): Promise<string> {
  const hit = mermaidCache.get(code);
  if (hit) return hit;
  const mermaid = await loadMermaid();
  const { svg } = await mermaid.render(`mmd-${Date.now()}-${mermaidSeq++}`, code);
  mermaidCache.set(code, svg);
  return svg;
}

// ---- SVG -> PNG --------------------------------------------------------------

export interface RasterImage {
  dataUrl: string;
  /** CSS pixels at 1x. */
  width: number;
  height: number;
  format: "PNG" | "JPEG";
}

/** Intrinsic size of an SVG: explicit px/ex width+height, else its viewBox. */
export function svgSize(svg: string, exPx = 8): { width: number; height: number } {
  const root = /<svg\b[^>]*>/.exec(svg)?.[0] ?? "";
  const attr = (n: string) => new RegExp(`\\s${n}="([^"]+)"`).exec(root)?.[1];
  const toPx = (v?: string) => {
    if (!v) return NaN;
    const m = /^([\d.]+)(px|ex|em|pt)?$/.exec(v.trim());
    if (!m) return NaN;
    const n = parseFloat(m[1]);
    return m[2] === "ex" ? n * exPx : m[2] === "em" ? n * exPx * 2 : m[2] === "pt" ? n * (4 / 3) : n;
  };
  let width = toPx(attr("width"));
  let height = toPx(attr("height"));
  const vb = attr("viewBox")?.split(/[\s,]+/).map(Number);
  const maxW = /max-width:\s*([\d.]+)px/.exec(root)?.[1];
  if ((!width || !height) && vb && vb.length === 4) {
    width = maxW ? parseFloat(maxW) : vb[2];
    height = (width * vb[3]) / vb[2];
  }
  return { width: width || 300, height: height || 150 };
}

export async function svgToPng(svg: string, size: { width: number; height: number }, scale = 3): Promise<RasterImage> {
  let src = svg;
  if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(src)) src = src.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  // Fixed pixel size and an explicit colour: an SVG drawn as an image has no
  // surrounding CSS, so percentages and currentColor would collapse.
  src = src
    .replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
      const cleaned = attrs.replace(/\s(width|height)="[^"]*"/g, "");
      return `<svg${cleaned} width="${size.width}" height="${size.height}">`;
    })
    .replace(/currentColor/g, "#111111");
  const url = URL.createObjectURL(new Blob([src], { type: "image/svg+xml" }));
  try {
    const img = await loadImageElement(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(size.width * scale);
    canvas.height = Math.ceil(size.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    canvas.width = canvas.height = 0;
    return { dataUrl, width: size.width, height: size.height, format: "PNG" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---- Images -----------------------------------------------------------------

function loadImageElement(src: string, timeoutMs = 15000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:/i.test(src)) img.crossOrigin = "anonymous";
    const timer = setTimeout(() => reject(new Error("image timeout")), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("image failed to load"));
    };
    img.src = src;
  });
}

/** Local images the user attached, keyed by file name (case-insensitive). */
export type ImageAssets = Map<string, string>;

export function resolveImageSrc(src: string, assets: ImageAssets): string | null {
  if (/^(https?:|data:image\/)/i.test(src)) return src;
  const name = decodeURIComponent(src.split(/[?#]/)[0].split("/").pop() ?? "").toLowerCase();
  return assets.get(name) ?? null;
}

/**
 * Loads an image for embedding into a PDF. Remote images need CORS headers
 * (most CDNs and GitHub raw URLs send them); without them the browser forbids
 * reading the pixels, and the image is reported as missing rather than
 * silently dropped.
 */
export async function rasterizeImage(src: string, assets: ImageAssets, maxPixels = 2400): Promise<RasterImage | null> {
  const resolved = resolveImageSrc(src, assets);
  if (!resolved) return null;
  try {
    const img = await loadImageElement(resolved);
    const ratio = Math.min(1, maxPixels / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * ratio));
    const h = Math.max(1, Math.round(img.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    const photo = /\.jpe?g($|\?)|^data:image\/jpeg/i.test(resolved) || /jpe?g/i.test(src);
    if (photo) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = photo ? canvas.toDataURL("image/jpeg", 0.9) : canvas.toDataURL("image/png");
    canvas.width = canvas.height = 0;
    return { dataUrl, width: img.naturalWidth, height: img.naturalHeight, format: photo ? "JPEG" : "PNG" };
  } catch {
    return null;
  }
}

// ---- Preview hydration --------------------------------------------------------

export interface HydrateResult {
  missingImages: string[];
  mathErrors: number;
  diagramErrors: string[];
}

/**
 * Turns placeholders in rendered HTML into real math, diagrams and local
 * images. Safe to call repeatedly: results are cached by source.
 */
export async function hydrateRichContent(root: HTMLElement, assets: ImageAssets): Promise<HydrateResult> {
  const result: HydrateResult = { missingImages: [], mathErrors: 0, diagramErrors: [] };

  for (const img of Array.from(root.querySelectorAll("img"))) {
    const original = img.getAttribute("data-src") ?? img.getAttribute("src") ?? "";
    img.setAttribute("data-src", original);
    const resolved = resolveImageSrc(original, assets);
    if (resolved) img.src = resolved;
    else {
      img.removeAttribute("src");
      img.classList.add("img-missing");
      result.missingImages.push(original);
    }
  }

  const math = Array.from(root.querySelectorAll<HTMLElement>(".math-inline[data-tex], .math-display[data-tex]"));
  for (const el of math) {
    try {
      el.innerHTML = await renderMath(decodeSource(el.dataset.tex ?? ""), el.classList.contains("math-display"));
    } catch {
      result.mathErrors++;
      el.textContent = decodeSource(el.dataset.tex ?? "");
      el.classList.add("math-error");
    }
  }

  const diagrams = Array.from(root.querySelectorAll<HTMLElement>(".mermaid-block[data-code]"));
  for (const el of diagrams) {
    try {
      el.innerHTML = await renderMermaid(decodeSource(el.dataset.code ?? ""));
    } catch (e) {
      const msg = e instanceof Error ? e.message.split("\n")[0].slice(0, 160) : "Invalid diagram";
      result.diagramErrors.push(msg);
      el.innerHTML = "";
      const pre = document.createElement("pre");
      pre.className = "mermaid-error";
      pre.textContent = `Diagram error: ${msg}\n\n${decodeSource(el.dataset.code ?? "")}`;
      el.appendChild(pre);
    }
  }
  return result;
}
