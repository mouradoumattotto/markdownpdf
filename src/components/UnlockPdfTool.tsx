"use client";

import { useRef, useState } from "react";
import { formatBytes } from "@/lib/ai-limits";
import { sizeBucket, track } from "@/lib/analytics";
import { baseName, saveBlob, sniffMessage, sniffPdf } from "@/lib/files";
import type { LockInfo } from "@/lib/pdf-unlock";
import ContinueWith from "@/components/ContinueWith";
import FileDropzone, { ErrorAlert, PrivacyNote, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "unlock-pdf";
const NEXT = ["pdf-to-markdown", "organize-pdf", "merge-pdf", "split-pdf", "pdf-to-text"];

type State =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "password"; algorithm?: string; wrong: boolean }
  | { kind: "unlocking" }
  | { kind: "none" }
  | { kind: "done"; bytes: Uint8Array; name: string; info: LockInfo }
  | { kind: "error"; message: string };

const lib = () => import("@/lib/pdf-unlock");

export default function UnlockPdfTool() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const fileRef = useRef<{ name: string; data: Uint8Array } | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const algorithmRef = useRef<string | undefined>(undefined);

  const params = () => ({
    tool_name: TOOL,
    input_format: "pdf",
    output_format: "pdf",
    file_size_bucket: fileRef.current ? sizeBucket(fileRef.current.data.byteLength) : undefined,
  });

  const fail = (err: unknown) => {
    console.error(err);
    const unsupported = err instanceof Error && err.name === "UnsupportedEncryptionError";
    track("conversion_error", { ...params(), error_code: unsupported ? "encrypted" : "corrupted" });
    setState({
      kind: "error",
      message: unsupported
        ? "This PDF is protected with a certificate (digital ID), not a password. Only the person holding that certificate can open it."
        : "This file could not be read as a PDF. It may be damaged or not a real PDF.",
    });
  };

  const unlock = async (pw: string) => {
    const file = fileRef.current;
    if (!file) return;
    setState({ kind: "unlocking" });
    track("conversion_start", params());
    try {
      const { unlockPdf, WrongPasswordError } = await lib();
      try {
        const result = await unlockPdf(file.data, pw);
        track("conversion_success", { ...params(), export_mode: result.state });
        setState({ kind: "done", bytes: result.bytes, name: `${baseName(file.name)}-unlocked.pdf`, info: result });
        setPassword("");
      } catch (err) {
        if (!(err instanceof WrongPasswordError)) throw err;
        setState({ kind: "password", algorithm: algorithmRef.current, wrong: true });
        requestAnimationFrame(() => passwordRef.current?.select());
      }
    } catch (err) {
      fail(err);
    }
  };

  const load = async (f: File) => {
    const base = { tool_name: TOOL, input_format: "pdf", file_size_bucket: sizeBucket(f.size) };
    track("file_selected", base);
    const sniff = await sniffPdf(f);
    if (sniff !== "ok") {
      const e = sniffMessage(sniff);
      track("conversion_error", { ...base, error_code: e.code });
      setState({ kind: "error", message: e.message });
      return;
    }
    setState({ kind: "reading" });
    setPassword("");
    try {
      const data = new Uint8Array(await f.arrayBuffer());
      fileRef.current = { name: f.name, data };
      setFileInfo({ name: f.name, size: data.byteLength });
      const { inspectLock } = await lib();
      const info = await inspectLock(data);
      algorithmRef.current = info.algorithm;
      if (info.state === "none") {
        setState({ kind: "none" });
      } else if (info.state === "password") {
        setState({ kind: "password", algorithm: info.algorithm, wrong: false });
        requestAnimationFrame(() => passwordRef.current?.focus());
      } else {
        // Only permissions are restricted: nothing to ask, unlock straight away.
        await unlock("");
      }
    } catch (err) {
      fail(err);
    }
  };

  const download = () => {
    if (state.kind !== "done") return;
    saveBlob(new Blob([state.bytes as BlobPart], { type: "application/pdf" }), state.name);
    track("output_download", params());
  };

  const reset = () => {
    fileRef.current = null;
    setPassword("");
    setState({ kind: "idle" });
  };

  const fileLine = fileInfo && (
    <p className="font-semibold break-all text-neutral-900">
      {fileInfo.name} <span className="font-normal text-neutral-500">· {formatBytes(fileInfo.size)}</span>
    </p>
  );

  return (
    <div className={toolCard}>
      {state.kind === "idle" || state.kind === "reading" || state.kind === "error" ? (
        <>
          <FileDropzone
            accept=".pdf,application/pdf"
            disabled={state.kind === "reading"}
            onFiles={([f]) => f && load(f)}
            onDragIntent={() => void lib()}
            label="Drop a locked PDF"
            hint={<PrivacyNote>The PDF and its password never leave your device</PrivacyNote>}
            dropAnywhere
          >
            {state.kind === "reading" ? <p className="font-semibold text-neutral-900">Checking the protection…</p> : undefined}
          </FileDropzone>
          {state.kind === "error" && <ErrorAlert message={state.message} />}
        </>
      ) : state.kind === "password" || state.kind === "unlocking" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (password) void unlock(password);
          }}
        >
          <div className="rounded-2xl bg-neutral-50 p-4">
            {fileLine}
            <p className="mt-1 text-sm text-neutral-600">
              This PDF asks for a password before it opens
              {state.kind === "password" && state.algorithm ? ` (${state.algorithm} encryption)` : ""}.
            </p>
          </div>
          <div>
            <label htmlFor="pdf-password" className="mb-2 block text-sm font-medium text-neutral-800">
              Password
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                ref={passwordRef}
                id="pdf-password"
                type={show ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (state.kind === "password" && state.wrong) setState({ ...state, wrong: false });
                }}
                disabled={state.kind === "unlocking"}
                aria-invalid={state.kind === "password" && state.wrong ? true : undefined}
                aria-describedby={state.kind === "password" && state.wrong ? "pdf-password-error" : undefined}
                className="min-h-10 w-full max-w-sm flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none"
              />
              <button type="button" className={secondaryButton} onClick={() => setShow((v) => !v)}>
                {show ? "Hide" : "Show"}
              </button>
              <button type="submit" className={primaryButton} disabled={!password || state.kind === "unlocking"}>
                {state.kind === "unlocking" ? "Unlocking…" : "Unlock PDF"}
              </button>
            </div>
            {state.kind === "password" && state.wrong && (
              <p id="pdf-password-error" role="alert" className="mt-2 text-sm text-red-700">
                That password is not correct. Passwords are case-sensitive — check Caps Lock.
              </p>
            )}
            <p className="mt-2 text-xs text-neutral-500">
              The owner password works too. The password is used on this device only and is not stored.
            </p>
          </div>
          <button type="button" className={secondaryButton} onClick={reset}>
            Choose another PDF
          </button>
        </form>
      ) : state.kind === "none" ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-neutral-50 p-4">
            {fileLine}
            <p className="mt-1 text-sm text-neutral-600" role="status">
              This PDF is not encrypted: it has no password and no restrictions to remove. If a program still refuses
              to open it, the file may be damaged rather than locked.
            </p>
          </div>
          <button type="button" className={secondaryButton} onClick={reset}>
            Choose another PDF
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4" role="status">
            <p className="font-semibold text-emerald-900">PDF unlocked</p>
            <p className="mt-1 text-sm text-emerald-800">
              {state.info.state === "owner-only"
                ? "The printing, copying and editing restrictions were removed. No password was needed."
                : "The password was removed, along with any printing, copying or editing restrictions."}
              {state.info.algorithm ? ` It used ${state.info.algorithm} encryption.` : ""} {formatBytes(state.bytes.byteLength)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primaryButton} onClick={download}>
              Download unlocked PDF
            </button>
            <button type="button" className={secondaryButton} onClick={reset}>
              Unlock another PDF
            </button>
          </div>
          <ContinueWith
            from={TOOL}
            targets={NEXT}
            file={() => new File([state.bytes as BlobPart], state.name, { type: "application/pdf" })}
          />
        </div>
      )}
    </div>
  );
}
