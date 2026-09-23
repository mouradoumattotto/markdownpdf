"use client";

import { useMemo, useState } from "react";
import { sizeBucket, track } from "@/lib/analytics";
import { baseName, saveBlob } from "@/lib/files";
import { normalize, parseDelimited, parseMarkdownTable, toCsv, toMarkdownTable, type Align } from "@/lib/markdown-table";
import FileDropzone, { ErrorAlert, primaryButton, secondaryButton, toolCard } from "@/components/FileDropzone";
import TextOutput from "@/components/TextOutput";

const TOOL = "markdown-table-generator";
const MAX_CELLS = 20_000;

const blank = (rows: number, cols: number) =>
  Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (r === 0 ? `Column ${c + 1}` : "")));

const ALIGN_LABELS: Record<Align, string> = { none: "Default", left: "Left", center: "Center", right: "Right" };

export default function MarkdownTableTool() {
  const [rows, setRows] = useState<string[][]>(() => blank(3, 3));
  const [align, setAlign] = useState<Align[]>(["none", "none", "none"]);
  const [pretty, setPretty] = useState(true);
  const [importText, setImportText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("table");
  const [importOpen, setImportOpen] = useState(true);

  const cols = rows[0]?.length ?? 0;
  const markdown = useMemo(() => toMarkdownTable({ rows, align }, { pretty }), [rows, align, pretty]);

  const load = (grid: string[][], newAlign: Align[] | null, source: string) => {
    if (!grid.length) {
      setError("Nothing to import: the data is empty.");
      return;
    }
    if (grid.length * grid[0].length > MAX_CELLS) {
      setError(`That is more than ${MAX_CELLS.toLocaleString()} cells — too large for a table anyone could read in Markdown.`);
      track("conversion_error", { tool_name: TOOL, input_format: source, error_code: "too_many_files" });
      return;
    }
    setRows(grid);
    setAlign(newAlign ?? Array(grid[0].length).fill("none"));
    setError(null);
    setImportOpen(false);
    track("conversion_success", { tool_name: TOOL, input_format: source, output_format: "md", file_size_bucket: sizeBucket(grid.flat().join("").length) });
  };

  /** Import pasted CSV/TSV, spreadsheet cells, or an existing Markdown table. */
  const importData = (text: string, source: string) => {
    const table = parseMarkdownTable(text);
    if (table) return load(table.rows, table.align, "md");
    load(parseDelimited(text), null, source);
  };

  const loadFile = async ([file]: File[]) => {
    if (!file) return;
    track("file_selected", { tool_name: TOOL, input_format: file.name.split(".").pop()?.toLowerCase() ?? "csv", file_size_bucket: sizeBucket(file.size) });
    if (file.size === 0) {
      setError("This file is empty.");
      return;
    }
    setName(baseName(file.name));
    importData(await file.text(), file.name.toLowerCase().endsWith(".tsv") ? "tsv" : "csv");
  };

  const setCell = (r: number, c: number, value: string) =>
    setRows((prev) => prev.map((row, i) => (i === r ? row.map((cell, j) => (j === c ? value : cell)) : row)));

  /** Pasting several cells from a spreadsheet fills the grid from the focused cell. */
  const pasteInto = (r: number, c: number, text: string): boolean => {
    if (!/[\t\n]/.test(text.replace(/\n$/, ""))) return false;
    const block = parseDelimited(text, text.includes("\t") ? "\t" : undefined);
    setRows((prev) => {
      const height = Math.max(prev.length, r + block.length);
      const width = Math.max(prev[0].length, c + block[0].length);
      const next = normalize([...prev, ...Array(height - prev.length).fill([])]).map((row) => [
        ...row,
        ...Array(width - row.length).fill(""),
      ]);
      block.forEach((line, i) => line.forEach((cell, j) => (next[r + i][c + j] = cell)));
      return next;
    });
    setAlign((prev) => [...prev, ...Array(Math.max(0, c + block[0].length - prev.length)).fill("none")]);
    return true;
  };

  const addRow = () => setRows((prev) => [...prev, Array(cols).fill("")]);
  const addColumn = () => {
    setRows((prev) => prev.map((row, i) => [...row, i === 0 ? `Column ${cols + 1}` : ""]));
    setAlign((prev) => [...prev, "none"]);
  };
  const removeRow = (r: number) => setRows((prev) => prev.filter((_, i) => i !== r));
  const removeColumn = (c: number) => {
    setRows((prev) => prev.map((row) => row.filter((_, j) => j !== c)));
    setAlign((prev) => prev.filter((_, j) => j !== c));
  };

  return (
    <div className={toolCard}>
      <div className="overflow-x-auto rounded-xl border border-neutral-200" data-testid="table-grid">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-50">
              {Array.from({ length: cols }, (_, c) => (
                <th key={c} scope="col" className="border-b border-neutral-200 px-1.5 py-1.5 text-left font-normal">
                  <div className="flex items-center gap-1">
                    <select
                      aria-label={`Alignment of column ${c + 1}`}
                      value={align[c] ?? "none"}
                      onChange={(e) => setAlign((prev) => prev.map((a, j) => (j === c ? (e.target.value as Align) : a)))}
                      className="rounded border border-neutral-300 bg-white px-1 py-0.5 text-xs"
                    >
                      {(Object.keys(ALIGN_LABELS) as Align[]).map((a) => (
                        <option key={a} value={a}>
                          {ALIGN_LABELS[a]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeColumn(c)}
                      disabled={cols === 1}
                      aria-label={`Delete column ${c + 1}`}
                      className="rounded px-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-8 border-b border-neutral-200" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className={r === 0 ? "bg-indigo-50/60" : ""}>
                {row.map((cell, c) => (
                  <td key={c} className="border-b border-r border-neutral-100 p-0">
                    <input
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      onPaste={(e) => {
                        if (pasteInto(r, c, e.clipboardData.getData("text/plain"))) e.preventDefault();
                      }}
                      onKeyDown={(e) => {
                        // Enter moves down, like a spreadsheet; on the last row it adds one.
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        if (r === rows.length - 1) addRow();
                        requestAnimationFrame(() =>
                          (document.querySelector(`[data-cell="${r + 1}-${c}"]`) as HTMLInputElement | null)?.focus(),
                        );
                      }}
                      data-cell={`${r}-${c}`}
                      aria-label={r === 0 ? `Header, column ${c + 1}` : `Row ${r}, column ${c + 1}`}
                      className={`w-full min-w-28 bg-transparent px-2 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-300 ${r === 0 ? "font-semibold" : ""}`}
                    />
                  </td>
                ))}
                <td className="border-b border-neutral-100 px-1 text-center">
                  {r > 0 && (
                    <button
                      type="button"
                      onClick={() => removeRow(r)}
                      aria-label={`Delete row ${r}`}
                      className="rounded px-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={addRow} className={secondaryButton}>
          + Row
        </button>
        <button type="button" onClick={addColumn} className={secondaryButton}>
          + Column
        </button>
        <button
          type="button"
          onClick={() => {
            setRows(blank(3, 3));
            setAlign(["none", "none", "none"]);
            setName("table");
          }}
          className={secondaryButton}
        >
          Clear
        </button>
        <label className="ml-auto inline-flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" checked={pretty} onChange={(e) => setPretty(e.target.checked)} className="accent-indigo-600" />
          Align columns in the source
        </label>
      </div>

      <details
        className="mt-4 rounded-xl border border-neutral-200 p-3"
        open={importOpen}
        onToggle={(e) => setImportOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer text-sm font-medium text-neutral-800">
          Import from CSV, a spreadsheet or an existing Markdown table
        </summary>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          aria-label="Data to import"
          spellCheck={false}
          placeholder={"Paste cells copied from Excel or Google Sheets, CSV text, or a Markdown table"}
          className="mt-3 h-28 w-full resize-y rounded-lg border border-neutral-300 p-3 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => importData(importText, "clipboard")}
            disabled={!importText.trim()}
            className={secondaryButton}
          >
            Import
          </button>
          <span className="text-xs text-neutral-600">This replaces the table above.</span>
        </div>
        <div className="mt-3">
          <FileDropzone
            accept=".csv,.tsv,.txt,.md,text/csv,text/tab-separated-values,text/plain,text/markdown"
            onFiles={loadFile}
            label="Or drop a .csv, .tsv or .md file"
            compact
          />
        </div>
      </details>

      {error && <ErrorAlert message={error} />}

      <div className="mt-6">
        <TextOutput
          value={markdown}
          label="Markdown table"
          fileName={`${name}.md`}
          mimeType="text/markdown"
          toolName={TOOL}
          outputFormat="md"
          heightClass="h-48"
          summary={`${rows.length - 1} ${rows.length === 2 ? "row" : "rows"} × ${cols} ${cols === 1 ? "column" : "columns"}`}
          download={
            <>
              <button
                type="button"
                onClick={() => {
                  saveBlob(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
                  track("output_download", { tool_name: TOOL, output_format: "csv" });
                }}
                className={secondaryButton}
              >
                Download .csv
              </button>
              <button
                type="button"
                onClick={() => {
                  saveBlob(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), `${name}.md`);
                  track("output_download", { tool_name: TOOL, output_format: "md" });
                }}
                className={primaryButton}
              >
                Download .md
              </button>
            </>
          }
        />
      </div>
    </div>
  );
}
