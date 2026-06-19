import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

/**
 * Topic-cluster block linking a hub page (tool / home) to relevant blog posts.
 * Reinforces topical relevance and distributes link equity into the blog.
 */
export default function BlogCluster({
  posts,
  heading = "From the blog",
}: {
  posts: BlogPost[];
  heading?: string;
}) {
  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <h2 className="text-2xl font-bold tracking-tight text-neutral-900">{heading}</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group block h-full rounded-xl border border-neutral-200 p-5 transition hover:border-indigo-300 hover:shadow-sm"
            >
              <span className="font-semibold text-neutral-900 group-hover:text-indigo-600">
                {post.title}
              </span>
              <span className="mt-1 block text-sm text-neutral-600">{post.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
