import { describe, expect, it } from "vitest";
import { chunkMarkdown, estimateRange, loadTokenizer, markdownBlocks, textStats } from "@/lib/tokens";

describe("tokenizers", () => {
  it("counts exactly with OpenAI's encodings", async () => {
    const o200k = await loadTokenizer("o200k_base");
    const cl100k = await loadTokenizer("cl100k_base");
    // Reference values from OpenAI's tiktoken.
    expect(o200k.count("hello world")).toBe(2);
    expect(cl100k.count("hello world")).toBe(2);
    expect(o200k.count("")).toBe(0);
    // Special-token text in a document is just text, not an error.
    expect(o200k.count("<|endoftext|>")).toBeGreaterThan(1);
  });

  it("gives an honest range for other models", () => {
    expect(estimateRange(1000)).toEqual([900, 1350]);
  });

  it("computes text stats", () => {
    expect(textStats("one two\nthree")).toEqual({ characters: 13, words: 3, lines: 2 });
    expect(textStats("")).toEqual({ characters: 0, words: 0, lines: 0 });
  });
});

describe("markdownBlocks", () => {
  it("keeps code fences whole and tracks the heading path", () => {
    const blocks = markdownBlocks("# A\n\nintro\n\n## B\n\n```js\nx\n\ny\n```\n\ntext");
    expect(blocks.map((b) => b.text)).toEqual(["# A", "intro", "## B", "```js\nx\n\ny\n```", "text"]);
    expect(blocks[3].headings).toEqual(["# A", "## B"]);
    expect(blocks[2].headings).toEqual(["# A"]);
  });
});

describe("chunkMarkdown", async () => {
  const tok = await loadTokenizer("o200k_base");
  const count = tok.count;
  const para = (n: number) => Array.from({ length: n }, (_, i) => `Sentence number ${i} is here.`).join(" ");
  const doc = `# Guide\n\n${para(20)}\n\n## Setup\n\n${para(20)}\n\n\`\`\`bash\nnpm install\nnpm run build\n\`\`\`\n\n## Usage\n\n${para(60)}\n`;

  it("never exceeds the budget and keeps every word", () => {
    const chunks = chunkMarkdown(doc, { maxTokens: 120, overlapTokens: 0, headingContext: false }, count);
    expect(chunks.length).toBeGreaterThan(3);
    for (const c of chunks) expect(c.tokens).toBeLessThanOrEqual(120);
    const joined = chunks.map((c) => c.text).join(" ");
    for (let i = 0; i < 60; i++) expect(joined).toContain(`Sentence number ${i} is here.`);
    expect(joined).toContain("npm install\nnpm run build");
  });

  it("starts a new chunk at each heading and can repeat the heading path", () => {
    const chunks = chunkMarkdown(doc, { maxTokens: 400, overlapTokens: 0, headingContext: true }, count);
    const usage = chunks.find((c) => c.text.includes("## Usage"))!;
    expect(usage.text.startsWith("# Guide\n\n## Usage")).toBe(true);
    const later = chunks.filter((c) => c.index > usage.index);
    for (const c of later) expect(c.text.startsWith("# Guide > ## Usage")).toBe(true);
  });

  it("carries overlap from one chunk into the next", () => {
    const chunks = chunkMarkdown(`${para(80)}`, { maxTokens: 100, overlapTokens: 20, headingContext: false }, count);
    expect(chunks.length).toBeGreaterThan(2);
    const tailWords = chunks[0].text.split(/\s+/).slice(-3).join(" ");
    expect(chunks[1].text).toContain(tailWords);
    for (const c of chunks) expect(c.tokens).toBeLessThanOrEqual(100);
  });

  it("handles empty input", () => {
    expect(chunkMarkdown("   ", { maxTokens: 100, overlapTokens: 0, headingContext: true }, count)).toEqual([]);
  });
});
