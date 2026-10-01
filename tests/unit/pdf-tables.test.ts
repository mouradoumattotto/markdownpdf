import { describe, expect, it } from "vitest";
import { findTables, splitCells, tableToCsv, tableToMarkdown, type PositionedLine } from "@/lib/pdf-tables";

// Helper: one run per [text, x], 10pt, width ≈ 5pt per character.
const line = (y: number, ...cells: [string, number][]): PositionedLine => ({
  y,
  size: 10,
  runs: cells.map(([text, x]) => ({ text, x, width: text.length * 5, size: 10 })),
});

describe("pdf-tables", () => {
  it("merges runs separated by a normal word gap into one cell", () => {
    const cells = splitCells({
      y: 0,
      size: 10,
      runs: [
        { text: "USD", x: 100, width: 15, size: 10 },
        { text: "12", x: 118, width: 10, size: 10 },
        { text: "Unlimited", x: 200, width: 45, size: 10 },
      ],
    });
    expect(cells.map((c) => c.text)).toEqual(["USD 12", "Unlimited"]);
  });

  it("aligns right-aligned numbers and leaves empty cells empty", () => {
    const lines = [
      line(700, ["Item", 50], ["Q1", 200], ["Q2", 300]),
      line(686, ["Paper", 50], ["1,200", 190], ["980", 305]),
      line(672, ["Ink", 50], ["", 0], ["45", 310]),
    ];
    const [t] = findTables(lines);
    expect(t.rows).toEqual([
      ["Item", "Q1", "Q2"],
      ["Paper", "1,200", "980"],
      ["Ink", "", "45"],
    ]);
    expect([t.start, t.end]).toEqual([0, 2]);
  });

  it("ignores prose split in two columns", () => {
    const prose = "Markdown keeps structure in plain text that";
    const lines = [line(700, [prose, 50], [prose, 320]), line(686, [prose, 50], [prose, 320])];
    expect(findTables(lines)).toEqual([]);
  });

  it("ends the table at the first paragraph line", () => {
    const lines = [
      line(700, ["A", 50], ["B", 200]),
      line(686, ["1", 50], ["2", 200]),
      line(660, ["A closing sentence that is a normal paragraph.", 50]),
    ];
    const [t] = findTables(lines);
    expect(t.end).toBe(1);
  });

  it("ignores chart labels drawn in an unreadable symbol font", () => {
    const lines = [
      line(700, ["ALL HOUSEHOLDS", 50], ["©§¡ ¡", 250], ["£¡", 350]),
      line(686, ["Family households", 50], ["©§£", 250], ["¢", 350]),
    ];
    expect(findTables(lines)).toEqual([]);
  });

  it("writes Markdown and RFC 4180 CSV", () => {
    const rows = [["Name", "Note"], ["a|b", 'say "hi", ok']];
    expect(tableToMarkdown(rows)).toBe("| Name | Note |\n| --- | --- |\n| a\\|b | say \"hi\", ok |");
    expect(tableToCsv(rows)).toBe('Name,Note\r\na|b,"say ""hi"", ok"\r\n');
  });
});
