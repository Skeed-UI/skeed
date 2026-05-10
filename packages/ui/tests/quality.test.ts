import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testDir = fileURLToPath(new URL('.', import.meta.url));
const packageRoot = join(testDir, '..');
const sourceRoot = join(packageRoot, 'src');

function sourceFiles(dir = sourceRoot): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(fullPath);
    }

    return entry.isFile() && fullPath.endsWith('.tsx') ? [fullPath] : [];
  });
}

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('@skeed/ui production quality gates', () => {
  it('keeps authored component sources free of risky generated-code patterns', () => {
    const forbidden = [
      /TODO|FIXME/,
      /\bas any\b/,
      /dangerouslySetInnerHTML/,
      /requestAnimationFrame/,
      /setInterval/,
      /Date\.now/,
      /Math\.random/,
    ];

    const failures = sourceFiles().flatMap((file) => {
      const source = read(file);
      const patternFailures = forbidden
        .filter((pattern) => pattern.test(source))
        .map((pattern) => `${basename(file)} matched ${pattern}`);
      const nonAsciiFailure = [...source].some((char) => char.charCodeAt(0) > 127)
        ? [`${basename(file)} contains non-ASCII text`]
        : [];

      return [...patternFailures, ...nonAsciiFailure];
    });

    expect(failures).toEqual([]);
  });

  it('keeps native disclosure controls free of custom button-role shims', () => {
    const failures = sourceFiles().filter((file) =>
      /<summary\b[^>]*(role=|tabIndex=)/.test(read(file)),
    );

    expect(failures.map((file) => basename(file))).toEqual([]);
  });

  it('does not claim complex ARIA patterns without matching item semantics', () => {
    const failures = sourceFiles().flatMap((file) => {
      const source = read(file);
      const issues: string[] = [];

      if (/role="tree"/.test(source)) {
        issues.push(`${basename(file)} uses role="tree"`);
      }

      if (/role="menu"/.test(source) && !/(role="menuitem"|role: 'menuitem')/.test(source)) {
        issues.push(`${basename(file)} uses role="menu" without menuitem semantics`);
      }

      return issues;
    });

    expect(failures).toEqual([]);
  });

  it('keeps npm package output tree-shakeable and dist-only', () => {
    const packageJson = JSON.parse(read(join(packageRoot, 'package.json'))) as {
      files?: string[];
      sideEffects?: boolean;
    };

    expect(packageJson.files).toEqual(['dist']);
    expect(packageJson.sideEffects).toBe(false);
  });
});
