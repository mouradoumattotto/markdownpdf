import { describe, expect, it } from "vitest";
import { MAX_AGE_MS, isDeliverable, matchesAccept } from "@/lib/handoff";

describe("handoff", () => {
  it("delivers only to its target, while fresh", () => {
    const at = 1_000_000;
    expect(isDeliverable({ target: "/token-counter", at }, "/token-counter", at + 500)).toBe(true);
    expect(isDeliverable({ target: "/token-counter", at }, "/markdown-chunker", at + 500)).toBe(false);
    expect(isDeliverable({ target: "/token-counter", at }, "/token-counter", at + MAX_AGE_MS + 1)).toBe(false);
    // A clock that went backwards must not resurrect an entry.
    expect(isDeliverable({ target: "/token-counter", at }, "/token-counter", at - 1)).toBe(false);
  });

  it("matches files against <input accept> strings", () => {
    const pdf = { name: "Report.PDF", type: "application/pdf" };
    const md = { name: "notes.md", type: "text/markdown" };
    const png = { name: "shot.png", type: "image/png" };
    expect(matchesAccept(pdf, ".pdf,application/pdf")).toBe(true);
    expect(matchesAccept({ ...pdf, type: "" }, ".pdf")).toBe(true);
    expect(matchesAccept(md, ".md,.markdown,.txt,text/markdown,text/plain")).toBe(true);
    expect(matchesAccept(md, ".pdf,application/pdf")).toBe(false);
    expect(matchesAccept(png, "image/*")).toBe(true);
    expect(matchesAccept(png, "image/jpeg,image/png")).toBe(true);
    expect(matchesAccept(pdf, "image/png,image/jpeg")).toBe(false);
  });
});
