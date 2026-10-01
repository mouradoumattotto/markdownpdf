import { describe, expect, it } from "vitest";
import { safeNoteName, toObsidianNote } from "@/lib/obsidian";

const base = {
  markdown: "# Attention: All You Need?\n\nIntro.\n\n![](images/page-2-1.png)\n\nMore.\n",
  pageOutputs: ["# Attention: All You Need?\n\nIntro.", "![](images/page-2-1.png)\n\nMore."],
  sourceName: "paper.pdf",
  pageCount: 2,
  imageNames: ["page-2-1.png"],
  pageMarkers: false,
  tags: ["pdf", "#research paper"],
  date: "2026-10-01",
};

describe("toObsidianNote", () => {
  it("writes properties Obsidian understands", () => {
    const note = toObsidianNote(base);
    expect(note.content.startsWith('---\ntitle: "Attention: All You Need?"\nsource: "paper.pdf"\npages: 2\ncreated: 2026-10-01\ntags:\n  - pdf\n  - research-paper\n---\n\n')).toBe(true);
    expect(note.fileName).toBe("Attention All You Need.md");
  });

  it("embeds images as vault-unique wikilinks", () => {
    const note = toObsidianNote(base);
    expect(note.attachments.get("page-2-1.png")).toBe("attention-all-you-need-page-2-1.png");
    expect(note.content).toContain("![[attention-all-you-need-page-2-1.png]]");
    expect(note.content).not.toContain("images/");
  });

  it("adds hidden page markers on request", () => {
    const note = toObsidianNote({ ...base, pageMarkers: true });
    expect(note.content).toContain("%% page 1 %%\n\n# Attention");
    expect(note.content).toContain("%% page 2 %%\n\n![[attention-all-you-need-page-2-1.png]]");
  });

  it("falls back to the file name and strips characters Obsidian rejects", () => {
    const note = toObsidianNote({ ...base, markdown: "No heading", pageOutputs: ["No heading"], sourceName: "Q3: report [final].pdf" });
    expect(note.title).toBe("Q3: report [final]");
    expect(note.fileName).toBe("Q3 report final.md");
    expect(safeNoteName("a/b\\c")).toBe("a b c");
  });
});
