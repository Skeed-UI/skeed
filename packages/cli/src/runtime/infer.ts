/** Slugify a project name from a freeform prompt. M1: deterministic. */
export function inferProjectName(prompt: string, override?: string): string {
  if (override && override.trim().length > 0) return slugify(override);
  const seed = prompt
    .toLowerCase()
    .replace(/^(build|create|make|i\s+want)\s+(an?|the)?\s+/i, '')
    .replace(/\bapp\b|\bproduct\b|\bplatform\b/g, '')
    .trim();
  return slugify(seed) || 'skeed-app';
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
