// ------------------------------------------------------------------
// tests/fixtures/generate.mjs — Builds every test document from code.
//
// Nothing binary is committed: fixtures are regenerated into
// tests/fixtures/generated/ (gitignored) before the test suites run.
// Scanned pages are real images of text, rendered by Chromium and embedded
// without any text layer — exactly what a scanner produces.
//
//   node tests/fixtures/generate.mjs
// ------------------------------------------------------------------

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, PDFName, PDFString, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument as CantooPDFDocument } from "@cantoo/pdf-lib";
import { chromium } from "@playwright/test";
import { AlignmentType, Document, HeadingLevel, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "generated");
mkdirSync(out, { recursive: true });
const save = (name, bytes) => writeFileSync(join(out, name), bytes);

const DEJAVU = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const A4 = [595.28, 841.89];

const SENTENCES = [
  "Portable documents preserve layout across devices and printers.",
  "Markdown keeps structure in plain text that any editor can open.",
  "Converting between the two formats is a common documentation task.",
  "Scanned pages need optical character recognition before text exists.",
  "Language models answer better when headings and lists survive extraction.",
];

function paragraph(seed, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(SENTENCES[(seed + i) % SENTENCES.length]);
  return out.join(" ");
}

/** Greedy word wrap for a standard font. */
function wrap(text, font, size, width) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// ---- 1. Structured text PDF ------------------------------------------------
async function textSimple() {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const page = doc.addPage(A4);
  let y = 780;
  page.drawText("Quarterly Report", { x: 56, y, size: 26, font: bold });
  y -= 44;
  page.drawText("Executive Summary", { x: 56, y, size: 18, font: bold });
  y -= 28;
  for (const line of wrap(paragraph(0, 3), regular, 11, 480)) {
    page.drawText(line, { x: 56, y, size: 11, font: regular });
    y -= 16;
  }
  y -= 14;
  page.drawText("This sentence has a", { x: 56, y, size: 11, font: regular });
  page.drawText("bold phrase", { x: 56 + regular.widthOfTextAtSize("This sentence has a ", 11), y, size: 11, font: bold });
  y -= 16;
  page.drawText("and this one is", { x: 56, y, size: 11, font: regular });
  page.drawText("in italics", { x: 56 + regular.widthOfTextAtSize("and this one is ", 11), y, size: 11, font: italic });
  y -= 30;
  for (const item of ["First bullet item", "Second bullet item", "Third bullet item"]) {
    page.drawText(`•  ${item}`, { x: 66, y, size: 11, font: regular });
    y -= 16;
  }
  y -= 14;
  for (const [i, item] of ["Open the file", "Check the output", "Download the result"].entries()) {
    page.drawText(`${i + 1}. ${item}`, { x: 66, y, size: 11, font: regular });
    y -= 16;
  }
  doc.setTitle("Quarterly Report");
  save("text-simple.pdf", await doc.save());
}

// ---- 2. Long documents -----------------------------------------------------
async function manyPages(n, wordsHeavy = false) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  for (let i = 1; i <= n; i++) {
    const page = doc.addPage(A4);
    let y = 790;
    page.drawText(`Section ${i}`, { x: 56, y, size: 20, font: bold });
    y -= 32;
    const text = `MARKER-PAGE-${i} ` + paragraph(i, wordsHeavy ? 40 : 6);
    for (const line of wrap(text, regular, 10, 480)) {
      if (y < 60) break;
      page.drawText(line, { x: 56, y, size: 10, font: regular });
      y -= 14;
    }
  }
  save(`pages-${n}${wordsHeavy ? "-dense" : ""}.pdf`, await doc.save());
}

// ---- 3. Two columns --------------------------------------------------------
async function columns() {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage(A4);
  page.drawText("Two Column Article", { x: 56, y: 790, size: 20, font: bold });
  const colText = [
    "LEFTCOL " + paragraph(0, 8),
    "RIGHTCOL " + paragraph(2, 8),
  ];
  colText.forEach((text, c) => {
    let y = 750;
    for (const line of wrap(text, regular, 10, 225)) {
      page.drawText(line, { x: 56 + c * 255, y, size: 10, font: regular });
      y -= 14;
    }
  });
  save("columns.pdf", await doc.save());
}

// ---- 4. Table --------------------------------------------------------------
async function table() {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage(A4);
  page.drawText("Pricing Table", { x: 56, y: 790, size: 20, font: bold });
  const rows = [
    ["Plan", "Price", "Pages"],
    ["Starter", "USD 0", "Unlimited"],
    ["Team", "USD 12", "Unlimited"],
  ];
  rows.forEach((row, r) =>
    row.forEach((cell, c) => {
      const x = 56 + c * 150;
      const y = 740 - r * 26;
      page.drawRectangle({ x: x - 6, y: y - 8, width: 150, height: 26, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 0.8 });
      page.drawText(cell, { x, y, size: 11, font: r === 0 ? bold : regular });
    }),
  );
  save("table.pdf", await doc.save());
}

// ---- 5. Multilingual text layer (embedded Unicode font) --------------------
async function multilingualText() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(readFileSync(DEJAVU), { subset: true });
  const page = doc.addPage(A4);
  const lines = [
    ["Rapport multilingue", 20],
    ["Le cœur déçu mais l'âme plutôt naïve, Louÿs rêva de crapaüter.", 11],
    ["El pingüino Wenceslao hizo kilómetros bajo exhaustiva lluvia.", 11],
    ["Falsches Üben von Xylophonmusik quält jeden größeren Zwerg.", 11],
    ["مرحبا بالعالم", 14],
  ];
  let y = 780;
  for (const [text, size] of lines) {
    page.drawText(text, { x: 56, y, size, font });
    y -= size * 2;
  }
  save("multilingual-text.pdf", await doc.save());
}

// ---- 6. Scanned pages (image only, no text layer) --------------------------
async function renderPng(browser, html, { width = 1240, height = 1754 } = {}) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(
    `<html><body style="margin:0;background:#fff;"><div style="padding:110px;font-family:'DejaVu Sans';color:#111;font-size:34px;line-height:1.55;">${html}</div></body></html>`,
  );
  const png = await page.screenshot({ type: "png" });
  await page.close();
  return png;
}

async function imagePdf(pngs, name, { prependTextPage = false } = {}) {
  const doc = await PDFDocument.create();
  if (prependTextPage) {
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const p = doc.addPage(A4);
    p.drawText("TEXTPAGE This first page has a real text layer.", { x: 56, y: 780, size: 12, font });
    p.drawText(paragraph(1, 3).slice(0, 90), { x: 56, y: 760, size: 12, font });
  }
  for (const png of pngs) {
    const img = await doc.embedPng(png);
    const page = doc.addPage(A4);
    page.drawImage(img, { x: 0, y: 0, width: A4[0], height: A4[1] });
  }
  save(name, await doc.save());
}

async function scanned(browser) {
  const en = await renderPng(
    browser,
    "<h1 style='font-size:56px'>Scanned Invoice</h1><p>The quick brown fox jumps over the lazy dog.</p><p>Please pay the amount due within thirty days of receipt.</p>",
  );
  const fr = await renderPng(
    browser,
    "<h1 style='font-size:56px'>Facture numérisée</h1><p>Le cœur déçu mais l'âme plutôt naïve.</p><p>Merci de régler le montant dû sous trente jours.</p>",
  );
  const ar = await renderPng(
    browser,
    "<div dir='rtl' style='font-size:44px'><h1 style='font-size:60px'>فاتورة</h1><p>مرحبا بالعالم</p><p>شكرا لكم على ثقتكم</p></div>",
  );
  await imagePdf([en], "scanned-en.pdf");
  await imagePdf([fr], "scanned-fr.pdf");
  await imagePdf([ar], "scanned-ar.pdf");
  await imagePdf([en], "mixed-text-and-scan.pdf", { prependTextPage: true });
  // Standalone images for the image-to-text / image-to-pdf tools.
  save("image-en.png", en);
  save("image-fr.png", fr);
  save("image-ar.png", ar);
  const small = await renderPng(browser, "<h1>Photo page</h1><p>JPEG sample</p>", { width: 800, height: 600 });
  save("image-small.png", small);
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.setContent("<body style='margin:0;background:linear-gradient(#4f46e5,#a78bfa)'><h1 style='color:#fff;font:64px sans-serif;padding:80px'>JPEG sample</h1></body>");
  save("image-sample.jpg", await page.screenshot({ type: "jpeg", quality: 85 }));
  await page.close();
}

// ---- 7. Metadata -------------------------------------------------------------
async function metadata() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage(A4).drawText("Metadata test document.", { x: 56, y: 780, size: 12, font });
  doc.setTitle("ALICE_SECRET quarterly title");
  doc.setAuthor("ALICE_SECRET");
  doc.setSubject("ALICE_SECRET subject");
  doc.setKeywords(["ALICE_SECRET", "confidential"]);
  doc.setCreator("ALICE_SECRET Word Processor");
  doc.setProducer("ALICE_SECRET Producer 1.0");
  doc.setCreationDate(new Date("2024-01-02T03:04:05Z"));
  doc.setModificationDate(new Date("2024-02-03T04:05:06Z"));
  const xmp = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator><rdf:Seq><rdf:li>ALICE_SECRET_XMP</rdf:li></rdf:Seq></dc:creator></rdf:Description>
</rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
  const stream = doc.context.stream(xmp, { Type: "Metadata", Subtype: "XML" });
  doc.catalog.set(PDFName.of("Metadata"), doc.context.register(stream));
  save("metadata.pdf", await doc.save({ useObjectStreams: false, updateFieldAppearances: false }));
}

// ---- 8. Outline (bookmarks) for split-by-chapter -----------------------------
async function outline() {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const chapters = [
    { title: "Chapter One", pages: 3 },
    { title: "Chapter Two", pages: 5 },
    { title: "Chapter Three", pages: 4 },
  ];
  const starts = [];
  for (const [ci, ch] of chapters.entries()) {
    for (let p = 0; p < ch.pages; p++) {
      const page = doc.addPage(A4);
      if (p === 0) starts.push(page);
      page.drawText(p === 0 ? ch.title : `${ch.title} continued`, { x: 56, y: 790, size: 18, font: bold });
      page.drawText(`CH${ci + 1}-P${p + 1} ` + paragraph(ci + p, 2).slice(0, 80), { x: 56, y: 760, size: 10, font: regular });
    }
  }
  // Build /Outlines by hand (pdf-lib has no high-level outline API).
  const ctx = doc.context;
  const outlinesRef = ctx.nextRef();
  const itemRefs = chapters.map(() => ctx.nextRef());
  chapters.forEach((ch, i) => {
    const dict = ctx.obj({
      Title: PDFString.of(ch.title),
      Parent: outlinesRef,
      Dest: [starts[i].ref, PDFName.of("XYZ"), null, null, null],
    });
    if (i > 0) dict.set(PDFName.of("Prev"), itemRefs[i - 1]);
    if (i < chapters.length - 1) dict.set(PDFName.of("Next"), itemRefs[i + 1]);
    ctx.assign(itemRefs[i], dict);
  });
  ctx.assign(outlinesRef, ctx.obj({ Type: "Outlines", First: itemRefs[0], Last: itemRefs.at(-1), Count: chapters.length }));
  doc.catalog.set(PDFName.of("Outlines"), outlinesRef);
  save("outline.pdf", await doc.save());
}

// ---- 9. Broken inputs -------------------------------------------------------
async function broken() {
  save("empty.pdf", new Uint8Array());
  save("not-a-pdf.pdf", new TextEncoder().encode("This is a plain text file with a .pdf extension.\n"));
  const junk = new Uint8Array(4096);
  for (let i = 0; i < junk.length; i++) junk[i] = (i * 7919) % 251;
  save("corrupted.pdf", new Uint8Array([...new TextEncoder().encode("%PDF-1.7\n"), ...junk]));

  const doc = await CantooPDFDocument.create();
  doc.addPage([400, 400]);
  doc.encrypt({ userPassword: "secret", ownerPassword: "owner-secret" });
  save("encrypted.pdf", await doc.save());
}

// ---- 10. Text inputs for the Markdown / HTML tools ---------------------------
function textInputs() {
  save(
    "sample.html",
    new TextEncoder().encode(
      `<!doctype html><html><head><title>Sample</title><style>p{color:red}</style><script>alert("x")</script></head><body>
<h1>Release Notes</h1><p>This release adds <strong>OCR</strong> and <em>faster</em> exports. See <a href="https://example.com/docs">the docs</a>.</p>
<ul><li>First change</li><li>Second change</li></ul>
<table><thead><tr><th>Tool</th><th>Status</th></tr></thead><tbody><tr><td>Split</td><td>Done</td></tr></tbody></table>
<pre><code class="language-js">const x = 1;</code></pre></body></html>`,
    ),
  );
  save("sample.csv", new TextEncoder().encode(`Name,Role,City\nAda,Engineer,London\n"Grace, Jr",Admiral,"New York"\n`));
}

// ---- 11. A Word document for the DOCX converter ----------------------------
async function docx(pngBytes) {
  const doc = new Document({
    creator: "ALICE_SECRET",
    title: "Release Notes",
    sections: [
      {
        children: [
          new Paragraph({ text: "Release Notes", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            children: [
              new TextRun("This release adds "),
              new TextRun({ text: "OCR", bold: true }),
              new TextRun(" and "),
              new TextRun({ text: "faster", italics: true }),
              new TextRun(" exports."),
            ],
          }),
          new Paragraph({ text: "First change", bullet: { level: 0 } }),
          new Paragraph({ text: "Second change", bullet: { level: 0 } }),
          new Paragraph({ text: "Step one", numbering: { reference: "numbers", level: 0 } }),
          new Paragraph({ text: "Quoted remark", style: "IntenseQuote" }),
          new Table({
            rows: [
              new TableRow({ children: [headerCell("Tool"), headerCell("Status")] }),
              new TableRow({ children: [cell("Split"), cell("Done")] }),
            ],
          }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: pngBytes, transformation: { width: 240, height: 180 } })] }),
        ],
      },
    ],
    numbering: {
      config: [{ reference: "numbers", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START }] }],
    },
  });
  save("sample.docx", await Packer.toBuffer(doc));
}
const cell = (text) => new TableCell({ children: [new Paragraph(text)] });
const headerCell = (text) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })] });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
});
try {
  await textSimple();
  await Promise.all([manyPages(10), manyPages(50), manyPages(100), manyPages(300), manyPages(30, true)]);
  await columns();
  await table();
  await multilingualText();
  await scanned(browser);
  await metadata();
  await outline();
  await broken();
  textInputs();
  await docx(readFileSync(join(out, "image-small.png")));
} finally {
  await browser.close();
}
console.log(`fixtures -> ${out}`);
