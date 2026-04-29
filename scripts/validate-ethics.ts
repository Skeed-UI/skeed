/**
 * Ethics Validation Script
 *
 * Validates all archetypes for forbidden patterns in AAA-strict demographics.
 * Used in CI quality gates.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { formatEthicsReport, getAAAStrictDemographics, runEthicsGuard } from '@skeed/guards';

const ARCHETYPES_DIR = './data/archetypes';

async function main() {
  console.log('🛡️  Running Ethics Validation...\n');

  const aaaStrictDemographics = getAAAStrictDemographics();
  console.log(`AAA-Strict Demographics: ${aaaStrictDemographics.join(', ')}\n`);

  let totalErrors = 0;
  let totalWarnings = 0;
  let filesChecked = 0;

  // Get all archetype files
  const files = readdirSync(ARCHETYPES_DIR).filter((f) => f.endsWith('.archetype.tsx'));

  for (const file of files) {
    const path = join(ARCHETYPES_DIR, file);
    const source = readFileSync(path, 'utf-8');

    // Extract archetype ID from filename
    const archetypeId = file.replace('.archetype.tsx', '');

    // Test against all AAA-strict demographics
    for (const demographicId of aaaStrictDemographics) {
      const result = runEthicsGuard({
        source,
        componentId: archetypeId,
        demographicId,
        strict: false, // Only fail on forbidden patterns, not accessibility
      });

      filesChecked++;

      // Only count forbidden patterns as errors, accessibility as warnings
      const forbiddenViolations = result.violations.filter((v) => v.type === 'forbidden-pattern');
      const accessibilityViolations = result.violations.filter(
        (v) => v.type === 'missing-accessibility',
      );

      if (forbiddenViolations.length > 0 || accessibilityViolations.length > 0) {
        totalErrors += forbiddenViolations.length;
        totalWarnings += accessibilityViolations.length;

        if (forbiddenViolations.length > 0) {
          console.log(`❌ ${file} for ${demographicId}:`);
          console.log(
            formatEthicsReport({
              ...result,
              violations: forbiddenViolations,
            }),
          );
          console.log('');
        }
      }
    }
  }

  console.log('='.repeat(50));
  console.log(`Files checked: ${filesChecked}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log('\n❌ Ethics validation FAILED');
    process.exit(1);
  }

  console.log('\n✅ All archetypes pass ethics validation!');
}

main().catch((err) => {
  console.error('Ethics validation failed:', err);
  process.exit(1);
});
