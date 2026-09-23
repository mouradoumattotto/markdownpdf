"use client";

import { useState, type ReactNode } from "react";

/**
 * An ordered list the user can rearrange: drag and drop with a mouse, or the
 * ↑ / ↓ buttons, which also work from the keyboard and with screen readers.
 * Used wherever order is the output — merging PDFs, building a PDF from images.
 */
export default function SortableList<T extends { id: number; name: string }>({
  items,
  label,
  disabled = false,
  onChange,
  renderItem,
}: {
  items: T[];
  /** Accessible name of the list, e.g. "Merge order". */
  label: string;
  disabled?: boolean;
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
}) {
  const [dragging, setDragging] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };

  return (
    <ol className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 text-sm" aria-label={label}>
      {items.map((item, index) => (
        <li
          key={item.id}
          draggable={!disabled}
          onDragStart={() => setDragging(index)}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragging !== null && dragging !== index) {
              move(dragging, index);
              setDragging(index);
            }
          }}
          // A file dragged onto the list must not make the browser open it.
          onDrop={(e) => e.preventDefault()}
          onDragEnd={() => setDragging(null)}
          className={`flex items-center gap-3 px-3 py-2 ${dragging === index ? "bg-indigo-50" : "bg-white"}`}
        >
          <span className="cursor-grab select-none text-neutral-400" aria-hidden>
            ⠿
          </span>
          <span className="w-6 text-right font-mono text-xs text-neutral-500">{index + 1}</span>
          <span className="min-w-0 flex-1">{renderItem(item, index)}</span>
          <span className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => move(index, index - 1)}
              disabled={disabled || index === 0}
              aria-label={`Move ${item.name} up`}
              className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(index, index + 1)}
              disabled={disabled || index === items.length - 1}
              aria-label={`Move ${item.name} down`}
              className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              disabled={disabled}
              aria-label={`Remove ${item.name}`}
              className="rounded-md p-1.5 text-neutral-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
            >
              ✕
            </button>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Natural sort by file name, so "scan-2" comes before "scan-10". */
export function byName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
