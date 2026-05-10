import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { Scaffold } from '@skeed/contracts';
import { resolveInside } from './cli-utils.js';

export interface WriteScaffoldOptions {
  outDir: string;
  scaffold: Scaffold;
}

export async function writeScaffold(
  opts: WriteScaffoldOptions,
): Promise<{ written: number; skipped: number }> {
  const root = resolve(opts.outDir);
  let written = 0;
  const skipped = 0;
  for (const file of opts.scaffold.files) {
    const target = resolveInside(root, file.path);
    await mkdir(dirname(target), { recursive: true });
    if (file.encoding === 'base64') {
      await writeFile(target, Buffer.from(file.contents, 'base64'));
    } else {
      await writeFile(target, file.contents, 'utf8');
    }
    written += 1;
  }
  return { written, skipped };
}
