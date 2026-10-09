/**
 * "Continue with…": carries a tool's output to the next tool without the
 * visitor downloading it and picking it again.
 *
 * The file is parked in this browser's IndexedDB under the destination path,
 * then the destination page picks it up on load (see useHandoff). Nothing is
 * uploaded: IndexedDB is local to the device, and the entry is deleted as soon
 * as it is delivered, or ignored once it is older than MAX_AGE_MS.
 */

import { useEffect, useRef } from "react";

const DB_NAME = "mdpdf-handoff";
const STORE = "pending";
const KEY = "next";
/** Long enough for a slow page load, short enough that a stale file never reappears. */
export const MAX_AGE_MS = 2 * 60 * 1000;

export interface Handoff {
  file: File;
  /** Path of the tool that should receive the file, e.g. "/token-counter". */
  target: string;
  /** Slug of the tool the file came from (analytics). */
  from: string;
  at: number;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Parks a file for the tool at `target`. Replaces any earlier pending file. */
export async function putHandoff(entry: Omit<Handoff, "at">): Promise<void> {
  await run("readwrite", (s) => s.put({ ...entry, at: Date.now() } satisfies Handoff, KEY));
}

/** The pending file for `target`, if there is a fresh one. Does not remove it. */
export async function peekHandoff(target: string, now = Date.now()): Promise<Handoff | null> {
  const entry = (await run("readonly", (s) => s.get(KEY))) as Handoff | undefined;
  return entry && isDeliverable(entry, target, now) ? entry : null;
}

export async function clearHandoff(): Promise<void> {
  await run("readwrite", (s) => s.delete(KEY));
}

/** Pure, exported for tests. */
export function isDeliverable(entry: Pick<Handoff, "target" | "at">, target: string, now: number): boolean {
  return entry.target === target && now - entry.at >= 0 && now - entry.at <= MAX_AGE_MS;
}

/**
 * Whether `file` matches an <input accept> string: extensions (".pdf"),
 * exact types ("application/pdf") and wildcards ("image/*").
 */
export function matchesAccept(file: { name: string; type: string }, accept: string): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .toLowerCase()
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .some((a) => {
      if (a.startsWith(".")) return name.endsWith(a);
      if (a.endsWith("/*")) return type.startsWith(a.slice(0, -1));
      return type === a;
    });
}

// A page can hold several pickers (Compare has two): only the first one that
// accepts the file receives it.
const delivered = new Set<number>();

/**
 * On the destination page: delivers a file handed over from another tool.
 *
 * Peek first and delete only after delivery, so React's development
 * double-mount (mount → cleanup → mount) cannot drop the file on the floor.
 */
export function useHandoff(accept: string, onFile: (file: File) => void, enabled = true): void {
  const onFileRef = useRef(onFile);
  useEffect(() => {
    onFileRef.current = onFile;
  });

  useEffect(() => {
    if (!enabled || typeof indexedDB === "undefined") return;
    let cancelled = false;
    peekHandoff(window.location.pathname)
      .then(async (entry) => {
        if (cancelled || !entry || delivered.has(entry.at) || !matchesAccept(entry.file, accept)) return;
        delivered.add(entry.at);
        // Firefox backs a Blob read from IndexedDB by the database's own storage:
        // once the entry is deleted, reading it fails with AbortError. Copy the
        // bytes into memory first.
        const { file: stored } = entry;
        const file = new File([await stored.arrayBuffer()], stored.name, { type: stored.type, lastModified: stored.lastModified });
        await clearHandoff();
        if (!cancelled) onFileRef.current(file);
      })
      // Private windows can refuse IndexedDB: the visitor just picks the file again.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accept, enabled]);
}
