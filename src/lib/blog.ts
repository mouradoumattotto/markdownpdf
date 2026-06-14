import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date
  readingMinutes: number;
  html: string;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { meta, body: raw.slice(match[0].length) };
}

export function getAllPosts(): BlogPost[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { meta, body } = parseFrontmatter(raw);
      const words = body.split(/\s+/).length;
      return {
        slug: file.replace(/\.md$/, ""),
        title: meta.title ?? file,
        description: meta.description ?? "",
        date: meta.date ?? "2026-01-01",
        readingMinutes: Math.max(1, Math.round(words / 220)),
        html: marked.parse(body, { async: false }),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

const STOP_WORDS = new Set([
  "the", "a", "an", "to", "of", "for", "and", "or", "in", "on", "with", "your",
  "you", "is", "are", "how", "what", "why", "vs", "into", "from", "guide",
  "step", "by", "free", "online", "complete", "every", "best", "easy",
]);

function keywords(post: BlogPost): Set<string> {
  return new Set(
    `${post.title} ${post.description} ${post.slug.replace(/-/g, " ")}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const all = getAllPosts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];
  const currentWords = keywords(current);
  return all
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const words = keywords(p);
      let score = 0;
      for (const w of words) if (currentWords.has(w)) score += 1;
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
    .slice(0, limit)
    .map((x) => x.post);
}
