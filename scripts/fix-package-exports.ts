/**
 * Script to update package.json files for npm publishing
 * Changes main/types from ./src/index.ts to ./dist/index.js
 * Adds files: ["dist"] for publishing
 * Updates exports to proper dist paths
 */

import { readFile, writeFile } from 'node:fs/promises';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const PACKAGES_DIR = './packages';

interface PackageJson {
  name?: string;
  main?: string;
  types?: string;
  files?: string[];
  exports?: Record<string, unknown>;
}

async function getPackageDirs(): Promise<string[]> {
  const entries = await readdir(PACKAGES_DIR);
  const dirs: string[] = [];

  for (const entry of entries) {
    const path = join(PACKAGES_DIR, entry);
    const stats = await stat(path);
    if (stats.isDirectory()) {
      dirs.push(path);
    }
  }

  return dirs;
}

async function updatePackageJson(pkgDir: string): Promise<void> {
  const pkgPath = join(pkgDir, 'package.json');

  let content: string;
  try {
    content = await readFile(pkgPath, 'utf-8');
  } catch {
    console.log(`No package.json in ${pkgDir}, skipping`);
    return;
  }

  const pkg: PackageJson = JSON.parse(content);

  // Skip if already updated
  if (pkg.main?.includes('/dist/')) {
    console.log(`Skipping ${pkg.name} (already has dist path)`);
    return;
  }

  // Skip if main doesn't point to src (already custom or different)
  if (!pkg.main?.includes('/src/')) {
    console.log(`Skipping ${pkg.name} (no src path to migrate)`);
    return;
  }

  // Build new exports structure
  const newExports: Record<string, { import: string; types: string }> = {};

  if (pkg.exports) {
    for (const [key, value] of Object.entries(pkg.exports)) {
      if (typeof value === 'string' && value.includes('/src/')) {
        // Convert src path to dist path
        const basePath = value.replace('./src/', '').replace(/\.ts$/, '');
        newExports[key] = {
          import: `./dist/${basePath}.js`,
          types: `./dist/${basePath}.d.ts`,
        };
      } else {
        // Keep non-string or non-src exports as-is (might need manual review)
        console.log(`  Note: ${key} export kept as-is (manual review needed)`);
        (newExports as Record<string, unknown>)[key] = value;
      }
    }
  }

  // If no exports defined, create default one
  if (Object.keys(newExports).length === 0) {
    newExports['.'] = {
      import: './dist/index.js',
      types: './dist/index.d.ts',
    };
  }

  // Update package.json
  pkg.main = './dist/index.js';
  pkg.types = './dist/index.d.ts';
  pkg.files = ['dist'];
  pkg.exports = newExports;

  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`Updated ${pkg.name} at ${pkgPath}`);
}

async function main(): Promise<void> {
  const dirs = await getPackageDirs();
  console.log(`Found ${dirs.length} packages\n`);

  for (const dir of dirs) {
    await updatePackageJson(dir);
  }

  console.log('\nDone! Review changes and run pnpm build to test.');
}

main().catch(console.error);
