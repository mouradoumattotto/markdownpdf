import { describe, expect, it } from "vitest";
import { Marked } from "marked";
import { displayWidth, parseDelimited, parseMarkdownTable, toCsv, toMarkdownTable } from "@/lib/markdown-table";

describe("parseDelimited", () => {
  it("parses CSV with quotes, doubled quotes and line breaks", () => {
    expect(parseDelimited('name,note\n"Smith, J","said ""hi""\nthen left"\n')).toEqual([
      ["name", "note"],
      ["Smith, J", 'said "hi"\nthen left'],
    ]);
  });

  it("detects TSV from a spreadsheet paste and semicolons from European Excel", () => {
    expect(parseDelimited("a\tb\n1\t2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parseDelimited("a;b\n1,5;2")).toEqual([["a", "b"], ["1,5", "2"]]);
  });

  it("pads ragged rows and ignores a BOM and trailing newlines", () => {
    expect(parseDelimited("﻿a,b,c\n1\n\n")).toEqual([["a", "b", "c"], ["1", "", ""]]);
    expect(parseDelimited("   ")).toEqual([]);
  });
});

describe("toMarkdownTable", () => {
  it("writes an aligned, padded GFM table", () => {
    const md = toMarkdownTable({ rows: [["Item", "Qty"], ["Apples", "3"]], align: ["left", "right"] });
    expect(md).toBe("| Item   | Qty |\n| :----- | --: |\n| Apples |   3 |\n");
  });

  it("escapes pipes and keeps line breaks as <br>", () => {
    const md = toMarkdownTable({ rows: [["a"], ["x | y\nz"]], align: [] }, { pretty: false });
    expect(md).toBe("| a |\n| --- |\n| x \\| y<br>z |\n");
  });

  it("renders as a real table in a GFM parser", async () => {
    const md = toMarkdownTable({ rows: [["H1", "H2"], ["a|b", "c"]], align: ["center", "none"] });
    const html = await new Marked({ gfm: true }).parse(md);
    expect(html).toContain('<th align="center">H1</th>');
    expect(html).toContain("<td align=\"center\">a|b</td>");
  });

  it("lines up wide characters", () => {
    expect(displayWidth("日本")).toBe(4);
    const md = toMarkdownTable({ rows: [["日本", "x"], ["ab", "y"]], align: [] });
    const [head, , row] = md.split("\n");
    expect(head.indexOf("| x") + 2).toBe(row.indexOf("| y"));
  });
});

describe("parseMarkdownTable", () => {
  it("round-trips with toMarkdownTable", () => {
    const data = { rows: [["A", "B"], ["1 | 2", "line\nbreak"]], align: ["center", "right"] as const };
    expect(parseMarkdownTable(toMarkdownTable({ rows: data.rows, align: [...data.align] }))).toEqual({
      rows: data.rows,
      align: ["center", "right"],
    });
  });

  it("finds a table inside other Markdown and tolerates missing outer pipes", () => {
    const parsed = parseMarkdownTable("Intro\n\nx | y\n--- | :-:\n1 | 2\n\nAfter");
    expect(parsed).toEqual({ rows: [["x", "y"], ["1", "2"]], align: ["none", "center"] });
    expect(parseMarkdownTable("no table here")).toBeNull();
  });
});

describe("toCsv", () => {
  it("quotes only where needed", () => {
    expect(toCsv([["a", "b,c"], ['say "x"', "line\nbreak"]])).toBe('a,"b,c"\n"say ""x""","line\nbreak"\n');
  });
});
