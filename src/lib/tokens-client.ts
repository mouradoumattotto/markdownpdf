/**
 * Page-side access to the token worker. Requests are matched to replies by
 * id; a newer request does not cancel an older one, callers simply ignore
 * stale answers. If a worker cannot be started, the work runs in the page.
 */
import type { Chunk, ChunkOptions, Encoding } from "@/lib/tokens";
import type { TokenRequest } from "@/lib/tokens.worker";

type Reply = { id: number; counts?: Partial<Record<Encoding, number>>; chunks?: Chunk[]; error?: string };

let worker: Worker | null | undefined;
let nextId = 1;
const pending = new Map<number, (reply: Reply) => void>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL("./tokens.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<Reply>) => {
      pending.get(e.data.id)?.(e.data);
      pending.delete(e.data.id);
    };
    worker.onerror = () => {
      // Fall back to the main thread for everything still waiting and after.
      worker?.terminate();
      worker = null;
      for (const [id, resolve] of pending) resolve({ id, error: "worker-failed" });
      pending.clear();
    };
  } catch {
    worker = null;
  }
  return worker;
}

async function inPage(req: TokenRequest): Promise<Reply> {
  const { chunkMarkdown, loadTokenizer } = await import("@/lib/tokens");
  if (req.kind === "count") {
    const counts: Partial<Record<Encoding, number>> = {};
    for (const enc of req.encodings) counts[enc] = (await loadTokenizer(enc)).count(req.text);
    return { id: req.id, counts };
  }
  const tok = await loadTokenizer(req.encoding);
  return { id: req.id, chunks: chunkMarkdown(req.text, req.options, tok.count) };
}

async function send(req: TokenRequest): Promise<Reply> {
  const w = getWorker();
  if (!w) return inPage(req);
  const reply = await new Promise<Reply>((resolve) => {
    pending.set(req.id, resolve);
    w.postMessage(req);
  });
  if (reply.error === "worker-failed") return inPage(req);
  if (reply.error) throw new Error(reply.error);
  return reply;
}

export async function countTokens(text: string, encodings: Encoding[]): Promise<Partial<Record<Encoding, number>>> {
  return (await send({ id: nextId++, kind: "count", text, encodings })).counts ?? {};
}

export async function chunkText(text: string, encoding: Encoding, options: ChunkOptions): Promise<Chunk[]> {
  return (await send({ id: nextId++, kind: "chunk", text, encoding, options })).chunks ?? [];
}
