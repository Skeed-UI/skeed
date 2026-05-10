#!/usr/bin/env node
/**
 * Replace workspace:* dependencies with actual versions for NPM publishing
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const packagesDir = join(process.cwd(), 'packages');
const version = '^0.1.0';

function fixPackageJson(pkgPath) {
  const content = readFileSync(pkgPath, 'utf-8');
  const pkg = JSON.parse(content);

  let modified = false;

  // Fix dependencies
  if (pkg.dependencies) {
    for (const [key, value] of Object.entries(pkg.dependencies)) {
      if (value === 'workspace:*') {
        pkg.dependencies[key] = version;
        modified = true;
      }
    }
  }

  // Fix devDependencies
  if (pkg.devDependencies) {
    for (const [key, value] of Object.entries(pkg.devDependencies)) {
      if (value === 'workspace:*') {
        pkg.devDependencies[key] = version;
        modified = true;
      }
    }
  }

  // Fix peerDependencies
  if (pkg.peerDependencies) {
    for (const [key, value] of Object.entries(pkg.peerDependencies)) {
      if (value === 'workspace:*') {
        pkg.peerDependencies[key] = version;
        modified = true;
      }
    }
  }

  if (modified) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`✅ Fixed ${pkg.name}`);
    return true;
  }

  return false;
}

const packages = readdirSync(packagesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

console.log(`Fixing workspace:* dependencies in ${packages.length} packages...\n`);

let fixedCount = 0;
for (const pkgName of packages) {
  const pkgJsonPath = join(packagesDir, pkgName, 'package.json');
  if (fixPackageJson(pkgJsonPath)) {
    fixedCount++;
  }
}

console.log(`\n✨ Fixed ${fixedCount} packages`);
