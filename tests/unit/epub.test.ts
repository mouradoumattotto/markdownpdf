// @vitest-environment jsdom
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { EpubDrmError, EpubFormatError, markdownToEpub, readEpub, resolvePath, splitChapters } from "@/lib/epub";

const MD = `# The Book

Intro paragraph with **bold** & <angle> text.

# Chapter One

First line<br>
- item a
- item b

| A | B |
| --- | --- |
| 1 | 2 |

# Chapter Two

Second chapter text.
`;

describe("EPUB writing", () => {
  it("puts mimetype first, stored uncompressed, with no extra field", async () => {
    const { bytes } = await markdownToEpub(MD, { fallbackTitle: "x" });
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint16(8, true)).toBe(0); // compression method: stored
    const nameLen = view.getUint16(26, true);
    const extraLen = view.getUint16(28, true);
    expect(strFromU8(bytes.subarray(30, 30 + nameLen))).toBe("mimetype");
    expect(extraLen).toBe(0);
    expect(strFromU8(bytes.subarray(30 + nameLen, 30 + nameLen + 20))).toBe("application/epub+zip");
  });

  it("splits chapters at H1 and writes well-formed XHTML, nav and NCX", async () => {
    const { bytes, chapters, title } = await markdownToEpub(MD, { fallbackTitle: "x" });
    expect(title).toBe("The Book");
    expect(chapters).toBe(3);
    const files = unzipSync(bytes);
    const opf = strFromU8(files["OEBPS/content.opf"]);
    expect(opf).toContain("<dc:title>The Book</dc:title>");
    expect(opf).toMatch(/<dc:identifier id="book-id">urn:uuid:[0-9a-f-]{36}<\/dc:identifier>/);
    expect(opf).toMatch(/dcterms:modified">\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ</);
    expect(strFromU8(files["OEBPS/nav.xhtml"])).toContain("Chapter Two");
    expect(strFromU8(files["OEBPS/toc.ncx"])).toContain('playOrder="3"');
    for (const name of Object.keys(files).filter((n) => /\.(xhtml|opf|ncx)$/.test(n))) {
      const doc = new DOMParser().parseFromString(strFromU8(files[name]), "application/xml");
      expect(doc.getElementsByTagName("parsererror"), name).toHaveLength(0);
    }
    const ch1 = strFromU8(files["OEBPS/chapter-001.xhtml"]);
    expect(ch1).toContain("&amp;");
    expect(ch1).not.toContain("<angle>"); // sanitised or escaped, never raw
  });

  it("falls back to one chapter without repeated headings", () => {
    const chapters = splitChapters("<p>Just text</p><h3>Small</h3><p>more</p>", "Fallback");
    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).toBe("Small");
  });

  it("drops characters XML forbids", async () => {
    const { bytes } = await markdownToEpub("Bad\u0001char", { fallbackTitle: "T" });
    const xhtml = strFromU8(unzipSync(bytes)["OEBPS/chapter-001.xhtml"]);
    expect(xhtml).toContain("Badchar");
  });
});

describe("EPUB reading", () => {
  it("round-trips: spine order, title, headings, tables", async () => {
    const { bytes } = await markdownToEpub(MD, { fallbackTitle: "x" });
    const book = await readEpub(bytes);
    expect(book.title).toBe("The Book");
    expect(book.language).toBe("en");
    expect(book.chapters).toBe(3);
    expect(book.markdown.indexOf("# Chapter One")).toBeLessThan(book.markdown.indexOf("# Chapter Two"));
    expect(book.markdown).toContain("- item a");
    expect(book.markdown.replace(/[ \t]+/g, " ")).toContain("| 1 | 2 |");
  });

  it("extracts images relative to the chapter and renames them", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const opf = `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Pics</dc:title></metadata>
<manifest><item id="a" href="text/a.xhtml" media-type="application/xhtml+xml"/><item id="i" href="img/p%20one.png" media-type="image/png"/></manifest>
<spine><itemref idref="a"/></spine></package>`;
    const bytes = zipSync({
      mimetype: [strToU8("application/epub+zip"), { level: 0 }],
      "META-INF/container.xml": strToU8(
        `<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OPS/book.opf"/></rootfiles></container>`,
      ),
      "OPS/book.opf": strToU8(opf),
      "OPS/text/a.xhtml": strToU8(
        `<html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Pics</h1><p><a href="b.xhtml#x">see</a></p><img src="../img/p%20one.png" alt="photo"/><img src="missing.png" alt="gone"/></body></html>`,
      ),
      "OPS/img/p one.png": png,
    });
    const book = await readEpub(bytes);
    expect(book.markdown).toContain("![photo](epub-image-1.png)");
    expect(book.markdown).toContain("gone");
    expect(book.markdown).not.toContain("b.xhtml");
    expect(book.images.get("epub-image-1.png")?.type).toBe("image/png");
  });

  it("rejects DRM-protected books but accepts font obfuscation", async () => {
    const { bytes } = await markdownToEpub(MD, { fallbackTitle: "x" });
    const files = unzipSync(bytes);
    const enc = (alg: string) =>
      strToU8(
        `<encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:enc="http://www.w3.org/2001/04/xmlenc#"><enc:EncryptedData><enc:EncryptionMethod Algorithm="${alg}"/><enc:CipherData><enc:CipherReference URI="OEBPS/font.otf"/></enc:CipherData></enc:EncryptedData></encryption>`,
      );
    const fonts = zipSync({ ...files, "META-INF/encryption.xml": enc("http://www.idpf.org/2008/embedding") });
    await expect(readEpub(fonts)).resolves.toMatchObject({ title: "The Book" });
    const drm = zipSync({ ...files, "META-INF/encryption.xml": enc("http://www.w3.org/2001/04/xmlenc#aes128-cbc") });
    await expect(readEpub(drm)).rejects.toBeInstanceOf(EpubDrmError);
    const adobe = zipSync({ ...files, "META-INF/rights.xml": strToU8("<rights/>") });
    await expect(readEpub(adobe)).rejects.toBeInstanceOf(EpubDrmError);
  });

  it("rejects files that are not EPUBs", async () => {
    await expect(readEpub(strToU8("not a zip"))).rejects.toBeInstanceOf(EpubFormatError);
    await expect(readEpub(zipSync({ "a.txt": strToU8("x") }))).rejects.toBeInstanceOf(EpubFormatError);
  });

  it("resolves relative and encoded paths", () => {
    expect(resolvePath("OPS/text/a.xhtml", "../img/p%20one.png#x")).toBe("OPS/img/p one.png");
    expect(resolvePath("content.opf", "ch1.xhtml")).toBe("ch1.xhtml");
  });
});
