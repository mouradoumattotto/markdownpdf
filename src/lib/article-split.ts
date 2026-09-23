/**
 * Splits the article HTML before the <h2> closest to its middle, so a
 * mid-article ad sits between two sections instead of inside a paragraph,
 * list or code block. Returns null when there is no suitable heading.
 */
export function splitAtMiddleSection(html: string): [string, string] | null {
  const positions = [...html.matchAll(/<h2[\s>]/g)].map((m) => m.index!);
  // Never before the first section: right under the intro it would read as part of the header.
  const candidates = positions.slice(1);
  if (!candidates.length) return null;
  const middle = html.length / 2;
  const at = candidates.reduce((best, p) => (Math.abs(p - middle) < Math.abs(best - middle) ? p : best));
  return [html.slice(0, at), html.slice(at)];
}
