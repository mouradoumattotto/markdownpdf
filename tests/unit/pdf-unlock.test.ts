import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, type EncryptionAlgorithm } from "@cantoo/pdf-lib";
import { describe, expect, it } from "vitest";
import { describeAlgorithm, inspectLock, unlockPdf, UnsupportedEncryptionError, WrongPasswordError } from "@/lib/pdf-unlock";

const root = join(__dirname, "..", "..");
const fixture = (name: string) => new Uint8Array(readFileSync(join(root, "tests/fixtures/generated", name)));
const latin1 = (bytes: Uint8Array) => Buffer.from(bytes).toString("latin1");

async function textOf(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // No password: the unlocked copy must open as a plain PDF.
  const task = pdfjs.getDocument({ data: bytes.slice(), verbosity: 0 });
  const doc = await task.promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    parts.push((await page.getTextContent()).items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  await task.destroy();
  return parts.join("\n");
}

async function encrypted(algorithm: EncryptionAlgorithm, userPassword: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage([300, 300]).drawText(`Confidential ${algorithm}`, { font, x: 20, y: 200, size: 14 });
  doc.addPage([300, 300]).drawText("Second page", { font, x: 20, y: 200, size: 14 });
  doc.setTitle("Locked report");
  doc.encrypt({
    userPassword,
    ownerPassword: "owner-pass",
    algorithm,
    allowWeakCryptography: true,
    permissions: { printing: false, copying: false, modifying: false },
  });
  return doc.save();
}

describe("describeAlgorithm", () => {
  it("names the cipher from /V, /Length and the crypt filter", () => {
    expect(describeAlgorithm(5, 256, "AESV3")).toBe("AES-256");
    expect(describeAlgorithm(4, 128, "AESV2")).toBe("AES-128");
    expect(describeAlgorithm(4, 128, "V2")).toBe("RC4 128-bit");
    expect(describeAlgorithm(2, 128, undefined)).toBe("RC4 128-bit");
    expect(describeAlgorithm(1, undefined, undefined)).toBe("RC4 40-bit");
  });
});

describe("unlocking with the open password", () => {
  const cases: [EncryptionAlgorithm, string][] = [
    ["AES-256", "AES-256"],
    ["AES-128", "AES-128"],
    ["RC4-128", "RC4 128-bit"],
    ["RC4-40", "RC4 40-bit"],
  ];
  it.each(cases)("%s: detects, refuses a wrong password, unlocks with the right one", async (alg, label) => {
    const locked = await encrypted(alg, "s3cret");
    expect(await inspectLock(locked)).toEqual({ state: "password", algorithm: label });

    await expect(unlockPdf(locked)).rejects.toBeInstanceOf(WrongPasswordError);
    await expect(unlockPdf(locked, "nope")).rejects.toBeInstanceOf(WrongPasswordError);

    const { bytes, state, algorithm } = await unlockPdf(locked, "s3cret");
    expect(state).toBe("password");
    expect(algorithm).toBe(label);
    expect(latin1(bytes)).not.toContain("/Encrypt");
    expect(await inspectLock(bytes)).toEqual({ state: "none" });
    const text = await textOf(bytes);
    expect(text).toContain(`Confidential ${alg}`);
    expect(text).toContain("Second page");
    expect((await PDFDocument.load(bytes)).getTitle()).toBe("Locked report");
  });

  it("unlocks a PDF encrypted by another library (jsPDF, RC4, classic xref table)", async () => {
    // A second, independent encryptor: catches errors that a round trip
    // through pdf-lib alone would hide.
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      encryption: { userPassword: "pw", ownerPassword: "owner", userPermissions: ["print"] },
    });
    doc.setProperties({ title: "From jsPDF (with parentheses)" });
    doc.text("Encrypted by jsPDF", 20, 20);
    doc.addPage();
    doc.text("Page two", 20, 20);
    const locked = new Uint8Array(doc.output("arraybuffer"));
    expect((await inspectLock(locked)).state).toBe("password");

    const { bytes } = await unlockPdf(locked, "pw");
    expect(latin1(bytes)).not.toContain("/Encrypt");
    const text = await textOf(bytes);
    expect(text).toContain("Encrypted by jsPDF");
    expect(text).toContain("Page two");
    expect((await PDFDocument.load(bytes)).getTitle()).toBe("From jsPDF (with parentheses)");
  });

  it("also accepts the owner password", async () => {
    const locked = await encrypted("AES-256", "s3cret");
    const { bytes } = await unlockPdf(locked, "owner-pass");
    expect(await textOf(bytes)).toContain("Confidential AES-256");
  });

  it("unlocks the shared encrypted fixture", async () => {
    const locked = fixture("encrypted.pdf");
    expect((await inspectLock(locked)).state).toBe("password");
    const { bytes } = await unlockPdf(locked, "secret");
    expect(latin1(bytes)).not.toContain("/Encrypt");
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });
});

describe("owner-password-only PDFs", () => {
  it("are unlocked without asking for a password", async () => {
    const locked = await encrypted("AES-128", "");
    expect(await inspectLock(locked)).toEqual({ state: "owner-only", algorithm: "AES-128" });
    const { bytes, state } = await unlockPdf(locked);
    expect(state).toBe("owner-only");
    expect(latin1(bytes)).not.toContain("/Encrypt");
    expect(await textOf(bytes)).toContain("Confidential AES-128");
  });
});

describe("real documents", () => {
  it("keeps bookmarks and text of an encrypted multi-page PDF", async () => {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const titles = async (bytes: Uint8Array, password?: string) => {
      const task = pdfjs.getDocument({ data: bytes.slice(), password, verbosity: 0 });
      const outline = (await (await task.promise).getOutline()) ?? [];
      await task.destroy();
      return outline.map((o) => o.title);
    };
    const source = await PDFDocument.load(fixture("outline.pdf"));
    source.encrypt({ userPassword: "pw", ownerPassword: "owner" });
    const locked = await source.save();
    const before = await titles(locked, "pw");
    expect(before.length).toBeGreaterThan(0);

    const { bytes } = await unlockPdf(locked, "pw");
    expect(await titles(bytes)).toEqual(before);
    expect((await textOf(bytes)).length).toBeGreaterThan(20);
  });
});

describe("unencrypted and unsupported files", () => {
  it("returns an unencrypted PDF unchanged", async () => {
    const plain = fixture("text-simple.pdf");
    expect(await inspectLock(plain)).toEqual({ state: "none" });
    const { bytes, state } = await unlockPdf(plain);
    expect(state).toBe("none");
    expect(bytes).toBe(plain);
  });

  it("rejects certificate security instead of pretending to unlock it", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    const dict = doc.context.obj({ Filter: "Adobe.PubSec", V: 4 });
    doc.context.trailerInfo.Encrypt = doc.context.register(dict);
    const bytes = await doc.save({ useObjectStreams: false });
    await expect(inspectLock(bytes)).rejects.toBeInstanceOf(UnsupportedEncryptionError);
  });
});
