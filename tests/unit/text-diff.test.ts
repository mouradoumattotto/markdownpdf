import { describe, expect, it } from "vitest";
import { collapse, diffTexts, unifiedPatch } from "@/lib/text-diff";

describe("diffTexts", () => {
  it("pairs edited lines and highlights the changed words", async () => {
    const { rows, stats } = await diffTexts("alpha\nThe fee is 30 days.\ngamma\n", "alpha\nThe fee is 45 days.\ngamma\nnew line\n");
    expect(stats).toEqual({ added: 1, removed: 0, changed: 1, unchanged: 2 });
    const changed = rows.find((r) => r.kind === "changed")!;
    if (changed.kind !== "changed") throw new Error();
    expect(changed.left.filter((s) => s.kind === "changed").map((s) => s.text).join("")).toBe("30");
    expect(changed.right.filter((s) => s.kind === "changed").map((s) => s.text).join("")).toBe("45");
    expect(changed.left.map((s) => s.text).join("")).toBe("The fee is 30 days.");
    expect(rows.at(-1)).toEqual({ kind: "added", rightNo: 4, text: "new line" });
  });

  it("reports identical texts, honouring case and whitespace options", async () => {
    expect((await diffTexts("a\nb", "a\nb\n")).identical).toBe(true);
    expect((await diffTexts("Hello World", "hello world")).identical).toBe(false);
    expect((await diffTexts("Hello World", "hello world", { ignoreCase: true })).identical).toBe(true);
    expect((await diffTexts("a  b", "a b", { ignoreWhitespace: true })).identical).toBe(true);
  });

  it("numbers lines on both sides", async () => {
    const { rows } = await diffTexts("x\ny\n", "y\nz\n");
    expect(rows).toEqual([
      { kind: "removed", leftNo: 1, text: "x" },
      { kind: "same", leftNo: 2, rightNo: 1, text: "y" },
      { kind: "added", rightNo: 2, text: "z" },
    ]);
  });
});

describe("collapse", () => {
  it("keeps context around changes and folds the rest", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ kind: "same" as const, leftNo: i + 1, rightNo: i + 1, text: `l${i}` }));
    const withChange = [...rows.slice(0, 10), { kind: "added" as const, rightNo: 11, text: "new" }, ...rows.slice(10)];
    const out = collapse(withChange, 2);
    expect(out[0]).toEqual({ kind: "skipped", count: 8 });
    expect(out.filter((r) => r.kind !== "skipped")).toHaveLength(5);
    expect(out.at(-1)).toEqual({ kind: "skipped", count: 8 });
  });
});

describe("unifiedPatch", () => {
  it("produces a standard unified diff", async () => {
    const patch = await unifiedPatch("a\nb\n", "a\nc\n", "old.txt", "new.txt");
    expect(patch).toContain("--- old.txt");
    expect(patch).toContain("+++ new.txt");
    expect(patch).toContain("-b\n+c");
  });
});
