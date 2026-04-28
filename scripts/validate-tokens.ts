/**
 * Token Validation Script
 *
 * Validates all archetypes for hardcoded token values.
 * Used in CI quality gates.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { formatValidationReport, validateTokens } from '@skeed/guards';

const ARCHETYPES_DIR = './data/archetypes';

async function main() {
  console.log('🔍 Validating archetype tokens...\n');

  let totalErrors = 0;
  const totalWarnings = 0;
  let filesChecked = 0;

  // Get all archetype files
  const files = readdirSync(ARCHETYPES_DIR).filter((f) => f.endsWith('.archetype.tsx'));

  for (const file of files) {
    const path = join(ARCHETYPES_DIR, file);
    const source = readFileSync(path, 'utf-8');

    const result = validateTokens({
      source,
      strict: true,
    });

    filesChecked++;

    if (!result.valid) {
      totalErrors += result.violations.length;
      console.log(`❌ ${file}:`);
      console.log(formatValidationReport(result));
      console.log('');
    } else {
      console.log(`✅ ${file} - ${result.stats.validTokens} tokens OK`);
    }
  }

  console.log(
    `\n📊 Summary: ${filesChecked} files checked, ${totalErrors} errors, ${totalWarnings} warnings`,
  );

  if (totalErrors > 0) {
    process.exit(1);
  }

  console.log('\n✅ All archetypes pass token validation!');
}

main().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
