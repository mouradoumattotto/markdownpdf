/**
 * Unlock PDF: removes the standard password security from a PDF the visitor
 * can open — either because it only carries an owner ("permissions") password,
 * or because they typed the open password.
 *
 * Decryption is @cantoo/pdf-lib's (RC4 40/128-bit, AES-128, AES-256). The
 * document is decrypted object by object and written back unencrypted, so text,
 * fonts, bookmarks, links and form fields come through as they were; nothing
 * is rasterised. There is no guessing: a PDF that needs a password stays locked
 * until the right one is given.
 */

import type { PDFDocument as CantooDocument, PDFDict as CantooDict, PDFRef } from "@cantoo/pdf-lib";

export type LockState =
  /** Not encrypted: nothing to remove. */
  | "none"
  /** Encrypted with an empty open password: opens anywhere, but restricts printing, copying or editing. */
  | "owner-only"
  /** Asks for a password before it opens. */
  | "password";

export interface LockInfo {
  state: LockState;
  /** "AES-256", "AES-128", "RC4 128-bit", "RC4 40-bit" — for display. */
  algorithm?: string;
}

export interface UnlockResult extends LockInfo {
  bytes: Uint8Array;
}

export class WrongPasswordError extends Error {
  constructor() {
    super("The password is not correct");
    this.name = "WrongPasswordError";
  }
}

/** Certificate (public-key) security, or a security handler other than the standard one. */
export class UnsupportedEncryptionError extends Error {
  constructor(public handler: string) {
    super(`Unsupported PDF security handler: ${handler}`);
    this.name = "UnsupportedEncryptionError";
  }
}

const lib = () => import("@cantoo/pdf-lib");

/** Pure, exported for tests: names the cipher from the /Encrypt dictionary's entries. */
export function describeAlgorithm(v: number | undefined, length: number | undefined, cfm: string | undefined): string {
  if (v === 5 || cfm === "AESV3") return "AES-256";
  if (v === 4 && cfm === "AESV2") return "AES-128";
  if (v === 1 || (length ?? 40) <= 40) return "RC4 40-bit";
  return "RC4 128-bit";
}

interface Parsed {
  doc: CantooDocument;
  /** The /Encrypt dictionary and the file's own cross-reference streams. */
  structural: PDFRef[];
  info: Omit<LockInfo, "state"> & { encrypted: boolean };
}

/** Parses without decrypting, to read the /Encrypt dictionary itself. */
async function parseRaw(data: Uint8Array): Promise<Parsed> {
  const { PDFDocument, PDFDict, PDFName, PDFNumber, PDFRawStream, PDFRef } = await lib();
  const doc = await PDFDocument.load(data, { ignoreEncryption: true, updateMetadata: false });
  const raw = doc.context.trailerInfo.Encrypt;
  const dict = raw ? doc.context.lookup(raw) : undefined;
  if (!(dict instanceof PDFDict)) return { doc, structural: [], info: { encrypted: false } };

  // Cross-reference streams are never encrypted, so they read fine here;
  // after decryption pdf-lib would see them as garbage.
  const structural = doc.context
    .enumerateIndirectObjects()
    .filter(([, obj]) => obj instanceof PDFRawStream && obj.dict.lookup(PDFName.of("Type")) === PDFName.of("XRef"))
    .map(([ref]) => ref);
  if (raw instanceof PDFRef) structural.push(raw);

  const name = (d: CantooDict, key: string) => {
    const v = d.lookup(PDFName.of(key));
    return v instanceof PDFName ? v.decodeText() : undefined;
  };
  const num = (d: CantooDict, key: string) => {
    const v = d.lookup(PDFName.of(key));
    return v instanceof PDFNumber ? v.asNumber() : undefined;
  };

  const handler = name(dict, "Filter") ?? "Standard";
  if (handler !== "Standard") throw new UnsupportedEncryptionError(handler);

  const cf = dict.lookup(PDFName.of("CF"));
  const stmf = name(dict, "StmF") ?? "StdCF";
  const filter = cf instanceof PDFDict ? cf.lookup(PDFName.of(stmf)) : undefined;
  const cfm = filter instanceof PDFDict ? name(filter, "CFM") : undefined;
  return {
    doc,
    structural,
    info: { encrypted: true, algorithm: describeAlgorithm(num(dict, "V"), num(dict, "Length"), cfm) },
  };
}

const isWrongPassword = (err: unknown) => err instanceof Error && /password incorrect|needs password/i.test(err.message);

async function decrypt(data: Uint8Array, password: string): Promise<CantooDocument> {
  const { PDFDocument } = await lib();
  try {
    return await PDFDocument.load(data, { password, updateMetadata: false });
  } catch (err) {
    if (isWrongPassword(err)) throw new WrongPasswordError();
    throw err;
  }
}

/** Whether a PDF is encrypted, and whether it needs a password to open. */
export async function inspectLock(data: ArrayBuffer | Uint8Array): Promise<LockInfo> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const { info } = await parseRaw(bytes);
  if (!info.encrypted) return { state: "none" };
  try {
    // Owner-password-only files have an empty open password.
    await decrypt(bytes, "");
    return { state: "owner-only", algorithm: info.algorithm };
  } catch (err) {
    if (err instanceof WrongPasswordError) return { state: "password", algorithm: info.algorithm };
    throw err;
  }
}

/**
 * Returns an unencrypted copy. `password` is the open password, or the owner
 * password; leave it empty for files that only restrict permissions.
 */
export async function unlockPdf(data: ArrayBuffer | Uint8Array, password = ""): Promise<UnlockResult> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const { doc: raw, info, structural } = await parseRaw(bytes);
  if (!info.encrypted) return { state: "none", bytes };

  // An empty password that works means the file only had permission restrictions.
  let state: LockState = "owner-only";
  let doc: CantooDocument;
  try {
    doc = await decrypt(bytes, "");
  } catch (err) {
    if (!(err instanceof WrongPasswordError)) throw err;
    state = "password";
    if (!password) throw err;
    doc = await decrypt(bytes, password);
  }

  // pdf-lib drops /Encrypt from the trailer, but the encryption dictionary,
  // the file's cross-reference streams (which still name it) and its object
  // streams (already unpacked) would be copied over as orphans. pdf-lib writes
  // its own, so remove them: no reader can mistake the copy for an encrypted file.
  const { PDFName, PDFRawStream } = await lib();
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream && obj.dict.lookup(PDFName.of("Type")) === PDFName.of("ObjStm")) {
      doc.context.delete(ref);
    }
  }
  for (const ref of structural) doc.context.delete(ref);
  // A cross-reference stream run through the decryption comes out unreadable,
  // and the trailer entries it carried with it: restore the document info.
  doc.context.trailerInfo.Info ??= raw.context.trailerInfo.Info;
  doc.context.trailerInfo.ID ??= raw.context.trailerInfo.ID;

  return { state, algorithm: info.algorithm, bytes: await doc.save() };
}
