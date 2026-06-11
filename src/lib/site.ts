export const SITE = {
  name: "MarkdownPDF",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://markdownpdf.app",
  description:
    "Free online converter between PDF and Markdown. Convert PDF to Markdown with OCR support, or turn Markdown into a polished PDF — entirely in your browser.",
  twitter: "@markdownpdf",
} as const;
