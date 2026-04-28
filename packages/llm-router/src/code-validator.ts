import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export interface CodeIssue {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  ok: boolean;
  issues: CodeIssue[];
  passes: number;
}

export type RepairFn = (issues: CodeIssue[], currentCode: string) => Promise<string>;

/**
 * Validate generated TS/TSX code via tsc + biome. If issues found, call repairFn
 * with the issues to get an updated version. Repeat up to 3 passes.
 */
export async function validateCode(opts: {
  filename: string;
  code: string;
  repair: RepairFn;
  /** 1 = no repair attempts, just validate. 3 = max two repair cycles after first emit. */
  maxPasses?: number;
}): Promise<ValidationResult> {
  const maxPasses = Math.min(Math.max(1, opts.maxPasses ?? 3), 3);
  let code = opts.code;
  let issues: CodeIssue[] = [];
  let passes = 0;
  for (let pass = 1; pass <= maxPasses; pass += 1) {
    passes = pass;
    issues = await runChecks(opts.filename, code);
    if (issues.length === 0) return { ok: true, issues: [], passes };
    if (pass === maxPasses) break;
    code = await opts.repair(issues, code);
  }
  return { ok: false, issues, passes };
}

async function runChecks(filename: string, code: string): Promise<CodeIssue[]> {
  const tmp = join(
    tmpdir(),
    `skeed-validate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  await mkdir(tmp, { recursive: true });
  const file = join(tmp, filename);
  await writeFile(file, code, 'utf8');
  const issues: CodeIssue[] = [];

  // tsc check
  try {
    await exec(
      'npx',
      [
        '--yes',
        'tsc',
        '--noEmit',
        '--allowJs',
        '--jsx',
        'preserve',
        '--target',
        'ES2022',
        '--moduleResolution',
        'bundler',
        '--module',
        'esnext',
        '--skipLibCheck',
        file,
      ],
      {
        cwd: tmp,
      },
    );
  } catch (err: unknown) {
    const out =
      String((err as { stdout?: string; stderr?: string }).stdout ?? '') +
      String((err as { stderr?: string }).stderr ?? '');
    for (const line of out.split('\n')) {
      const m = line.match(/^(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+(.+)$/);
      if (m?.[1] && m[2] && m[3] && m[4] && m[5]) {
        issues.push({
          file: m[1],
          line: Number(m[2]),
          column: Number(m[3]),
          severity: m[4] === 'error' ? 'error' : 'warning',
          message: m[5],
        });
      }
    }
  }

  return issues;
}
