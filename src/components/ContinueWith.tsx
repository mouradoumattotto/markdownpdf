"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { putHandoff } from "@/lib/handoff";
import { toolBadge } from "@/lib/tool-badge";
import { getTool, type Tool } from "@/lib/tools";

interface Props {
  /** Slug of the tool showing the result. */
  from: string;
  /** Slugs of the tools the result can go to next, most useful first. */
  targets: string[];
  /** The result, built only when a button is clicked. */
  file: () => File | Promise<File>;
  className?: string;
  /** Heading above the buttons, when the file sent is not the obvious one. */
  label?: string;
}

/**
 * "Continue with…" after a result: sends the output straight into the next
 * tool, which opens with the file already loaded. The file stays in this
 * browser (see lib/handoff), so the no-upload promise still holds.
 */
export default function ContinueWith({ from, targets, file, className = "", label = "Continue with this file" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const tools = targets.map(getTool).filter((t): t is Tool => Boolean(t));
  if (tools.length === 0) return null;

  const go = async (tool: Tool) => {
    setBusy(tool.slug);
    setFailed(false);
    try {
      await putHandoff({ file: await file(), target: tool.path, from });
      track("continue_with", { tool_name: from, target: tool.slug });
      router.push(tool.path);
    } catch {
      // IndexedDB refused (private window, storage full): say so, keep the result on screen.
      setFailed(true);
      setBusy(null);
    }
  };

  return (
    <div className={`rounded-xl border border-line bg-paper/60 px-3 py-3 sm:px-4 ${className}`}>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {tools.map((t) => {
          const { glyph, tile } = toolBadge(t);
          return (
            <li key={t.slug}>
              <button
                type="button"
                onClick={() => go(t)}
                disabled={busy !== null}
                title={t.tagline}
                className="flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white py-1.5 pl-1.5 pr-3 text-sm font-semibold text-ink transition hover:border-neutral-300 hover:shadow-sm disabled:cursor-wait disabled:opacity-60"
              >
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-[9px] font-semibold text-white"
                  style={{ background: tile }}
                >
                  {glyph}
                </span>
                {busy === t.slug ? "Opening…" : t.name}
              </button>
            </li>
          );
        })}
      </ul>
      {failed && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          This browser would not hold the file for the next tool. Download it and open it there instead.
        </p>
      )}
    </div>
  );
}
