import { describe, expect, it } from "vitest";
import { insertBlock, insertLink, toggleLinePrefix, toggleWrap } from "@/lib/markdown-edit";

const sel = (v: string, s: number, e: number) => ({ text: v.slice(s, e) });

describe("toggleWrap", () => {
  it("wraps, and unwraps from either side", () => {
    const a = toggleWrap("make this bold", 5, 9, "**", "bold text");
    expect(a.value).toBe("make **this** bold");
    expect(sel(a.value, a.start, a.end).text).toBe("this");
    const b = toggleWrap(a.value, a.start, a.end, "**", "");
    expect(b.value).toBe("make this bold");
    const c = toggleWrap("make **this** bold", 5, 13, "**", "");
    expect(c.value).toBe("make this bold");
  });

  it("inserts a selected placeholder when nothing is selected", () => {
    const e = toggleWrap("ab", 1, 1, "`", "code");
    expect(e.value).toBe("a`code`b");
    expect(sel(e.value, e.start, e.end).text).toBe("code");
  });
});

describe("toggleLinePrefix", () => {
  it("cycles heading levels", () => {
    let e = toggleLinePrefix("Title", 0, 0, "heading");
    expect(e.value).toBe("# Title");
    e = toggleLinePrefix(e.value, 0, 0, "heading");
    expect(e.value).toBe("## Title");
    e = toggleLinePrefix(e.value, 0, 0, "heading");
    expect(e.value).toBe("### Title");
    expect(toggleLinePrefix(e.value, 0, 0, "heading").value).toBe("Title");
  });

  it("toggles lists across a multi-line selection and converts between list types", () => {
    const text = "intro\none\ntwo\nend";
    const e = toggleLinePrefix(text, 7, 12, "bullet");
    expect(e.value).toBe("intro\n- one\n- two\nend");
    const n = toggleLinePrefix(e.value, e.start, e.end, "numbered");
    expect(n.value).toBe("intro\n1. one\n2. two\nend");
    const off = toggleLinePrefix(n.value, n.start, n.end, "numbered");
    expect(off.value).toBe(text);
    expect(toggleLinePrefix("- a", 0, 3, "task").value).toBe("- [ ] a");
    expect(toggleLinePrefix("- [ ] a", 0, 7, "bullet").value).toBe("- a");
  });

  it("quotes and unquotes", () => {
    expect(toggleLinePrefix("a\nb", 0, 3, "quote").value).toBe("> a\n> b");
    expect(toggleLinePrefix("> a\n> b", 0, 7, "quote").value).toBe("a\nb");
  });
});

describe("insertBlock and insertLink", () => {
  it("puts a block on its own lines", () => {
    expect(insertBlock("para", 4, 4, "---").value).toBe("para\n\n---\n\n");
    expect(insertBlock("", 0, 0, "---").value).toBe("---\n\n");
  });

  it("turns the selection into link text and selects the url", () => {
    const e = insertLink("see docs here", 4, 8);
    expect(e.value).toBe("see [docs](url) here");
    expect(e.value.slice(e.start, e.end)).toBe("url");
    const u = insertLink("https://x.io", 0, 12);
    expect(u.value).toBe("[link text](https://x.io)");
    expect(u.value.slice(u.start, u.end)).toBe("link text");
  });
});
