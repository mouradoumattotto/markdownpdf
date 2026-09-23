"use client";

import { useRef, useState } from "react";
import { formatBytes } from "@/lib/ai-limits";
import { pageBucket, sizeBucket, track } from "@/lib/analytics";
import { baseName, classifyPdfError, saveBlob, sniffMessage, sniffPdf } from "@/lib/files";
import { METADATA_FIELDS, type MetadataField, type MetadataReport, type MetadataValues } from "@/lib/pdf-metadata";
import FileDropzone, { ErrorAlert, PrivacyNote, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";

const TOOL = "pdf-metadata";

const LABELS: Record<MetadataField, string> = {
  title: "Title",
  author: "Author",
  subject: "Subject",
  keywords: "Keywords",
  creator: "Creator (the app that wrote the document)",
  producer: "Producer (the app that wrote the PDF)",
};

type State =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "ready" }
  | { kind: "saved"; removed: string[]; bytes: Uint8Array; name: string }
  | { kind: "error"; message: string };

export default function PdfMetadataTool() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [report, setReport] = useState<MetadataReport | null>(null);
  const [values, setValues] = useState<MetadataValues>({});
  const [keepDates, setKeepDates] = useState(false);
  const fileRef = useRef<{ name: string; data: ArrayBuffer } | null>(null);
  const [fileName, setFileName] = useState("");

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
    setReport(null);
    try {
      const data = await f.arrayBuffer();
      const { readPdfMetadata } = await import("@/lib/pdf-metadata");
      const result = await readPdfMetadata(data);
      fileRef.current = { name: f.name, data };
      setFileName(f.name);
      setReport(result);
      setValues(Object.fromEntries(METADATA_FIELDS.map((k) => [k, result.metadata[k] ?? ""])) as MetadataValues);
      setState({ kind: "ready" });
    } catch (err) {
      console.error(err);
      const e = classifyPdfError(err);
      track("conversion_error", { ...base, error_code: e.code });
      setState({ kind: "error", message: e.message });
    }
  };

  const write = async (mode: "clean" | "save") => {
    const file = fileRef.current;
    if (!file || !report) return;
    const params = {
      tool_name: TOOL,
      input_format: "pdf",
      output_format: "pdf",
      export_mode: mode,
      file_size_bucket: sizeBucket(file.data.byteLength),
      page_count_bucket: pageBucket(report.overview.pages),
    };
    track("conversion_start", params);
    try {
      const { writePdfMetadata } = await import("@/lib/pdf-metadata");
      const result = await writePdfMetadata(file.data, {
        clearAll: true,
        keepDates: mode === "clean" ? keepDates : true,
        values: mode === "save" ? values : undefined,
      });
      track("conversion_success", params);
      setState({
        kind: "saved",
        removed: result.removed,
        bytes: result.bytes,
        name: `${baseName(file.name)}${mode === "clean" ? "-no-metadata" : "-updated"}.pdf`,
      });
    } catch (err) {
      console.error(err);
      const e = classifyPdfError(err);
      track("conversion_error", { ...params, error_code: e.code });
      setState({ kind: "error", message: e.message });
    }
  };

  const download = (bytes: Uint8Array, name: string) => {
    saveBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), name);
    track("output_download", { tool_name: TOOL, input_format: "pdf", output_format: "pdf" });
  };

  const reset = () => {
    fileRef.current = null;
    setReport(null);
    setValues({});
    setState({ kind: "idle" });
  };

  const found = report
    ? [
        ...METADATA_FIELDS.filter((f) => report.metadata[f]).map((f) => LABELS[f].split(" (")[0]),
        ...(report.metadata.createdAt || report.metadata.modifiedAt ? ["dates"] : []),
        ...(report.metadata.xmp ? ["XMP packet"] : []),
        ...Object.keys(report.metadata.custom),
      ]
    : [];

  return (
    <div className={toolCard}>
      {!report ? (
        <FileDropzone
          accept=".pdf,application/pdf"
          disabled={state.kind === "reading"}
          onFiles={([f]) => f && load(f)}
          onDragIntent={() => void import("@/lib/pdf-metadata")}
          label="Drop a PDF to inspect"
          hint={<PrivacyNote>Read on your device — the PDF is never uploaded</PrivacyNote>}
        >
          {state.kind === "reading" ? <p className="font-semibold text-neutral-900">Reading the document…</p> : undefined}
        </FileDropzone>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-neutral-50 p-4">
            <div>
              <p className="font-semibold text-neutral-900 break-all">{fileName}</p>
              <p className="mt-1 text-sm text-neutral-600" data-testid="overview">
                {report.overview.pages} {report.overview.pages === 1 ? "page" : "pages"} · {formatBytes(report.overview.bytes)}
                {report.overview.pdfVersion && ` · PDF ${report.overview.pdfVersion}`}
                {report.overview.pageSize && ` · ${report.overview.pageSize.width}×${report.overview.pageSize.height} mm`}
                {report.overview.hasForm && " · contains a form"}
                {report.overview.scannedSample?.withoutText ? " · scanned pages detected" : ""}
              </p>
            </div>
            <button type="button" onClick={reset} className={secondaryButton}>
              Choose another PDF
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-neutral-900">What this PDF reveals</h2>
            {found.length === 0 ? (
              <p className="mt-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" data-testid="metadata-empty">
                Nothing. This PDF carries no title, author, dates or producer information.
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-600" data-testid="metadata-found">
                Found: {found.join(", ")}.
              </p>
            )}

            <dl className="mt-4 divide-y divide-neutral-100 rounded-xl border border-neutral-200 text-sm">
              {METADATA_FIELDS.map((field) => (
                <div key={field} className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:items-center sm:gap-4">
                  <dt className="font-medium text-neutral-700">
                    <label htmlFor={`meta-${field}`}>{LABELS[field]}</label>
                  </dt>
                  <dd className="sm:col-span-2">
                    <input
                      id={`meta-${field}`}
                      value={values[field] ?? ""}
                      placeholder={report.metadata[field] ? "" : "— empty —"}
                      onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </dd>
                </div>
              ))}
              {(report.metadata.createdAt || report.metadata.modifiedAt) && (
                <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-neutral-700">Dates</dt>
                  <dd className="text-neutral-600 sm:col-span-2">
                    {report.metadata.createdAt && `created ${report.metadata.createdAt}`}
                    {report.metadata.createdAt && report.metadata.modifiedAt && " · "}
                    {report.metadata.modifiedAt && `modified ${report.metadata.modifiedAt}`}
                  </dd>
                </div>
              )}
              {Object.entries(report.metadata.custom).map(([key, value]) => (
                <div key={key} className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-neutral-700">{key}</dt>
                  <dd className="break-all text-neutral-600 sm:col-span-2">{value}</dd>
                </div>
              ))}
            </dl>

            {report.metadata.xmp && (
              <details className="mt-4 rounded-xl border border-neutral-200 p-4">
                <summary className="cursor-pointer text-sm font-medium text-neutral-800">
                  XMP metadata packet ({report.metadata.xmp.length.toLocaleString()} characters)
                </summary>
                <p className="mt-2 text-sm text-neutral-600">
                  A second copy of the document&apos;s metadata, in XML. Tools that only clear the fields above leave
                  this behind.
                </p>
                <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700">
                  {report.metadata.xmp.slice(0, 4000)}
                </pre>
              </details>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={keepDates} onChange={(e) => setKeepDates(e.target.checked)} />
              Keep the creation and modification dates
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => write("save")} className={secondaryButton}>
                Save my changes
              </button>
              <button type="button" onClick={() => write("clean")} className={primaryButton}>
                Remove all metadata
              </button>
            </div>
          </div>

          {state.kind === "saved" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" data-testid="saved">
              <p className="font-semibold text-emerald-900">Your cleaned PDF is ready</p>
              <p className="mt-1 text-sm text-emerald-800">
                {state.removed.length ? `Removed: ${state.removed.join(", ")}.` : "No metadata was present to remove."} The
                pages themselves are untouched.
              </p>
              <button type="button" onClick={() => download(state.bytes, state.name)} className={`${primaryButton} mt-3`}>
                Download {state.name}
              </button>
            </div>
          )}
        </div>
      )}

      {state.kind === "error" && <ErrorAlert message={state.message} />}
    </div>
  );
}
