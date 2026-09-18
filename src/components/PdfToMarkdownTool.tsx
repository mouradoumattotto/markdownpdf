"use client";

import PdfExtractTool from "@/components/PdfExtractTool";

// The PDF → Markdown converter on `/`. The implementation is shared with the
// PDF → Text tool (same extraction, OCR, cancel and analytics); only the output
// renderer differs.
export default function PdfToMarkdownTool() {
  return <PdfExtractTool mode="markdown" />;
}
