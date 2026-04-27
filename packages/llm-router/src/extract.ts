import { jsonrepair } from 'jsonrepair';
import { type z } from 'zod';

export interface ExtractionAttempt {
  strategy: string;
  ok: boolean;
  detail?: string;
}

export interface ExtractionResult<T> {
  value: T | undefined;
  attempts: ExtractionAttempt[];
  schemaErrors?: string;
}

/**
 * Multi-strategy iterative extraction. Tries each strategy in order; the first
 * one that yields a value passing the schema wins.
 *
 * Strategies (in cascade):
 *   1. raw JSON.parse
 *   2. strip ``` fences (```json ... ``` or generic ``` ... ```)
 *   3. extract first balanced {...} or [...] block via brace counting
 *   4. jsonrepair on the candidate from (3) (or raw)
 *   5. coerce common LLM mistakes (single-quoted, trailing commas, // comments, BOM)
 *
 * If the schema rejects all parsed candidates, returns last schema-error message
 * so the caller can decide to re-prompt the model.
 */
export function extractStructured<T>(text: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>): ExtractionResult<T> {
  const attempts: ExtractionAttempt[] = [];
  const candidates: string[] = [];

  // 1. Raw
  candidates.push(text);
  // 2. Code fences
  const fenced = stripCodeFences(text);
  if (fenced && fenced !== text) candidates.push(fenced);
  // 3. Balanced block
  const balanced = extractBalancedBlock(fenced ?? text);
  if (balanced) candidates.push(balanced);
  // 5. Coerced variants
  for (const candidate of [...candidates]) {
    const coerced = coerceCommonMistakes(candidate);
    if (coerced !== candidate) candidates.push(coerced);
  }

  let schemaErr: string | undefined;
  for (const candidate of candidates) {
    // raw parse
    const raw = tryJsonParse(candidate);
    if (raw.ok) {
      attempts.push({ strategy: 'json-parse', ok: true });
      const v = schema.safeParse(raw.value);
      if (v.success) return { value: v.data, attempts };
      schemaErr = formatZodError(v.error);
      attempts.push({ strategy: 'schema-validate', ok: false, detail: schemaErr });
    } else {
      attempts.push({ strategy: 'json-parse', ok: false, detail: raw.error });
    }
    // jsonrepair
    const repaired = tryJsonRepair(candidate);
    if (repaired.ok) {
      attempts.push({ strategy: 'jsonrepair', ok: true });
      const v = schema.safeParse(repaired.value);
      if (v.success) return { value: v.data, attempts };
      schemaErr = formatZodError(v.error);
      attempts.push({ strategy: 'schema-validate', ok: false, detail: schemaErr });
    } else {
      attempts.push({ strategy: 'jsonrepair', ok: false, detail: repaired.error });
    }
  }

  return { value: undefined, attempts, ...(schemaErr ? { schemaErrors: schemaErr } : {}) };
}

/** Strip ```json ... ``` (or ``` ... ```) and return inner content. */
export function stripCodeFences(text: string): string {
  const m = text.match(/```(?:json|javascript|js|ts|typescript)?\s*\n?([\s\S]*?)\n?```/);
  if (m && m[1]) return m[1].trim();
  return text;
}

/**
 * Find the first balanced `{...}` or `[...]` block by counting braces while
 * respecting string literals (so braces inside `"..."` don't mis-balance).
 * Returns the substring or `null` if none found.
 */
export function extractBalancedBlock(text: string): string | null {
  // Find the first { or [
  let start = -1;
  let opener: '{' | '[' | null = null;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '{' || c === '[') {
      start = i;
      opener = c;
      break;
    }
  }
  if (start === -1 || !opener) return null;
  const closer = opener === '{' ? '}' : ']';

  let depth = 0;
  let inString = false;
  let stringQuote: '"' | "'" | null = null;
  let escape = false;

  for (let i = start; i < text.length; i += 1) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === stringQuote) {
        inString = false;
        stringQuote = null;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      stringQuote = c as '"' | "'";
      continue;
    }
    if (c === opener) depth += 1;
    else if (c === closer) {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/** Repair common LLM mistakes that jsonrepair sometimes misses. */
export function coerceCommonMistakes(text: string): string {
  let out = text.trim();
  // Strip BOM
  if (out.charCodeAt(0) === 0xfeff) out = out.slice(1);
  // Strip leading "JSON:" / "Output:" / "Result:" prefixes
  out = out.replace(/^(json|output|result|response)\s*:\s*/i, '');
  // Convert smart quotes to straight
  out = out.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  // Remove // line comments and /* block comments */ (best effort, not inside strings)
  out = out.replace(/\/\/[^\n\r]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  return out;
}

function tryJsonParse(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function tryJsonRepair(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    const repaired = jsonrepair(text);
    return { ok: true, value: JSON.parse(repaired) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
    .join('; ');
}
