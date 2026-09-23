/// <reference lib="webworker" />
/**
 * Token counting off the main thread: a long document can take a second or
 * more to encode, which would freeze typing and scrolling if done in the page.
 */
import { chunkMarkdown, loadTokenizer, type ChunkOptions, type Encoding } from "./tokens";

export type TokenRequest =
  | { id: number; kind: "count"; text: string; encodings: Encoding[] }
  | { id: number; kind: "chunk"; text: string; encoding: Encoding; options: ChunkOptions };

self.onmessage = async (event: MessageEvent<TokenRequest>) => {
  const req = event.data;
  try {
    if (req.kind === "count") {
      const counts: Partial<Record<Encoding, number>> = {};
      for (const enc of req.encodings) counts[enc] = (await loadTokenizer(enc)).count(req.text);
      self.postMessage({ id: req.id, counts });
    } else {
      const tok = await loadTokenizer(req.encoding);
      self.postMessage({ id: req.id, chunks: chunkMarkdown(req.text, req.options, tok.count) });
    }
  } catch (err) {
    self.postMessage({ id: req.id, error: err instanceof Error ? err.message : String(err) });
  }
};
