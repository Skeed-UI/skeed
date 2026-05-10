import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

export function componentFileName(id: string): string {
  const normalized = id.trim().replace(/^@skeed[/-]/, '').replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  const raw = parts.join('-') || 'component';
  const safe = raw
    .replace(/\.[cm]?[tj]sx?$/i, '')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
  return `${safe || 'component'}.tsx`;
}

export function parsePositiveInt(
  value: unknown,
  label: string,
  fallback: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (value === undefined || value === null || value === false || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return Math.min(parsed, max);
}

export function resolveInside(rootInput: string, pathInput: string): string {
  if (isAbsolute(pathInput)) {
    throw new Error(`absolute scaffold paths are not allowed: ${pathInput}`);
  }
  const root = resolve(rootInput);
  const target = resolve(root, pathInput);
  const rel = relative(root, target);
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) return target;
  throw new Error(`scaffold path escapes output directory: ${pathInput}`);
}

export function formatCliError(err: unknown): string {
  if (err instanceof Error) {
    return process.env.SKEED_DEBUG === '1' ? (err.stack ?? err.message) : err.message;
  }
  return String(err);
}

export function readPackageVersion(packageJsonPath: string, fallback = '0.0.0'): string {
  try {
    const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: unknown };
    return typeof parsed.version === 'string' ? parsed.version : fallback;
  } catch {
    return fallback;
  }
}
