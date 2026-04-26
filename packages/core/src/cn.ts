/**
 * Tiny class-merge helper. Joins truthy class strings, dedupes, splits on
 * whitespace. Token-precedence-aware merge is the transformer's job; this
 * is the user-land helper component authors call inside archetype TSX.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    for (const cls of part.split(/\s+/)) {
      if (cls && !seen.has(cls)) {
        seen.add(cls);
        out.push(cls);
      }
    }
  }
  return out.join(' ');
}
