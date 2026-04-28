/**
 * Bundle Size Check Script
 *
 * Monitors bundle size limits for generated components.
 * Ensures generated code stays within acceptable limits.
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const GENERATED_DIR = './output/generated';

// Size limits in bytes
const SIZE_LIMITS = {
  atom: 5 * 1024, // 5KB max for atoms
  molecule: 10 * 1024, // 10KB max for molecules
  organism: 20 * 1024, // 20KB max for organisms
  template: 50 * 1024, // 50KB max for templates
  page: 100 * 1024, // 100KB max for pages
  css: 15 * 1024, // 15KB max for CSS
};

interface SizeResult {
  file: string;
  size: number;
  limit: number;
  exceeded: boolean;
  category: string;
}

function getFileSize(filePath: string): number {
  try {
    return statSync(filePath).size;
  } catch {
    return 0;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function getCategoryFromPath(filePath: string): keyof typeof SIZE_LIMITS {
  const basename = filePath.toLowerCase();

  if (basename.includes('page')) return 'page';
  if (basename.includes('template')) return 'template';
  if (basename.includes('organism')) return 'organism';
  if (basename.includes('molecule')) return 'molecule';
  if (basename.includes('.css')) return 'css';

  return 'atom'; // Default to atom
}

async function checkBundleSizes() {
  console.log('📦 Checking Bundle Sizes...\n');

  const results: SizeResult[] = [];

  // Check if output directory exists
  try {
    readdirSync(GENERATED_DIR);
  } catch {
    console.log('⚠️  No generated directory found. Run generation first.');
    console.log(`   Expected: ${GENERATED_DIR}`);
    return;
  }

  // Scan all generated files
  const categories = readdirSync(GENERATED_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const category of categories) {
    const categoryPath = join(GENERATED_DIR, category);

    try {
      const files = readdirSync(categoryPath).filter(
        (f) => f.endsWith('.tsx') || f.endsWith('.css'),
      );

      for (const file of files) {
        const filePath = join(categoryPath, file);
        const size = getFileSize(filePath);
        const fileCategory = file.endsWith('.css') ? 'css' : getCategoryFromPath(category);
        const limit = SIZE_LIMITS[fileCategory];

        results.push({
          file: `${category}/${file}`,
          size,
          limit,
          exceeded: size > limit,
          category: fileCategory,
        });
      }
    } catch {
      // Skip directories we can't read
    }
  }

  if (results.length === 0) {
    console.log('⚠️  No generated files found to check');
    return;
  }

  // Print results
  let exceededCount = 0;
  let totalSize = 0;
  let limitSize = 0;

  console.log('Size Check Results:');
  console.log('-'.repeat(70));
  console.log(`${'File'.padEnd(40)} ${'Size'.padEnd(12)} ${'Limit'.padEnd(12)} Status`);
  console.log('-'.repeat(70));

  for (const result of results.sort((a, b) => b.size - a.size)) {
    totalSize += result.size;
    limitSize += result.limit;

    const icon = result.exceeded ? '❌' : '✅';
    const status = result.exceeded ? 'EXCEEDED' : 'OK';

    console.log(
      `${result.file.slice(0, 38).padEnd(40)} ` +
        `${formatBytes(result.size).padEnd(12)} ` +
        `${formatBytes(result.limit).padEnd(12)} ` +
        `${icon} ${status}`,
    );

    if (result.exceeded) {
      exceededCount++;
    }
  }

  console.log('-'.repeat(70));
  console.log(`Total: ${formatBytes(totalSize)} / ${formatBytes(limitSize)}`);
  console.log(`Exceeded: ${exceededCount}/${results.length}`);

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  if (exceededCount > 0) {
    console.log(`❌ Bundle size check FAILED: ${exceededCount} files exceed limits`);

    // Show top offenders
    const offenders = results
      .filter((r) => r.exceeded)
      .sort((a, b) => b.size - b.limit - (a.size - a.limit))
      .slice(0, 5);

    console.log('\nTop offenders:');
    for (const o of offenders) {
      const overage = o.size - o.limit;
      console.log(`  - ${o.file}: ${formatBytes(overage)} over limit`);
    }

    process.exit(1);
  } else {
    console.log('✅ All files within size limits');
  }

  // Size distribution
  console.log('\nSize Distribution:');
  const byCategory: Record<string, { count: number; total: number }> = {};
  for (const r of results) {
    if (!byCategory[r.category]) {
      byCategory[r.category] = { count: 0, total: 0 };
    }
    byCategory[r.category].count++;
    byCategory[r.category].total += r.size;
  }

  for (const [cat, data] of Object.entries(byCategory).sort()) {
    const avg = data.total / data.count;
    console.log(`  ${cat.padEnd(10)}: ${data.count} files, avg ${formatBytes(avg)}`);
  }
}

checkBundleSizes().catch((err) => {
  console.error('Bundle size check failed:', err);
  process.exit(1);
});
