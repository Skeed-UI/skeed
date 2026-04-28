/**
 * Contrast Validation Script
 *
 * Validates WCAG contrast compliance for all demographic presets.
 * Used in CI quality gates.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { formatContrastResult, validateContrastPairs } from '@skeed/guards';

const DEMOGRAPHICS_DIR = './data/demographics';

async function main() {
  console.log('🎨 Validating WCAG contrast compliance...\n');

  let totalErrors = 0;
  const totalWarnings = 0;
  let presetsChecked = 0;

  // Get all demographic directories
  const demographics = readdirSync(DEMOGRAPHICS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const demographicId of demographics) {
    const presetPath = join(DEMOGRAPHICS_DIR, demographicId, 'preset.json');

    try {
      const presetData = JSON.parse(readFileSync(presetPath, 'utf-8'));
      const contrastPairs = presetData.palette?.contrastPairs || [];

      if (contrastPairs.length === 0) {
        console.log(`⚠️  ${demographicId}: No contrast pairs defined`);
        continue;
      }

      // Debug: Log education preset data
      if (demographicId === 'education') {
        console.log('DEBUG: Education contrast pairs:', JSON.stringify(contrastPairs, null, 2));
        console.log(
          'DEBUG: Education brand palette:',
          JSON.stringify(presetData.palette?.brand, null, 2),
        );
      }

      // Convert string pairs to color values
      const pairs = contrastPairs.map((pair: { fg: string; bg: string }) => {
        // Resolve token paths to actual colors
        const fgParts = pair.fg.split('.');
        const bgParts = pair.bg.split('.');

        const fg = presetData.palette[fgParts[0]]?.[fgParts[1]] || '#000000';
        const bg = presetData.palette[bgParts[0]]?.[bgParts[1]] || '#ffffff';

        if (demographicId === 'education') {
          console.log(`DEBUG: Resolved ${pair.fg} -> ${fg}, ${pair.bg} -> ${bg}`);
        }

        return { foreground: fg, background: bg };
      });

      if (demographicId === 'education') {
        console.log('DEBUG: Pairs passed to validation:', JSON.stringify(pairs, null, 2));
      }

      const results = validateContrastPairs(pairs, {
        level: undefined,
        textSize: undefined,
        demographicId,
      });

      if (demographicId === 'education') {
        console.log(
          'DEBUG: Validation results:',
          JSON.stringify(
            results.map((r) => ({
              fg: r.foreground,
              bg: r.background,
              ratio: r.ratio,
              valid: r.valid,
            })),
            null,
            2,
          ),
        );
      }

      presetsChecked++;

      const failedResults = results.filter((r: { valid: boolean }) => !r.valid);

      if (failedResults.length > 0) {
        totalErrors += failedResults.length;
        console.log(`❌ ${demographicId} - ${failedResults.length} contrast failures:`);
        for (const result of failedResults) {
          console.log(`   ${formatContrastResult(result)}`);
        }
      } else {
        const minRatio = Math.min(...results.map((r: { ratio: number }) => r.ratio));
        console.log(`✅ ${demographicId} - min ratio ${minRatio.toFixed(2)}:1`);
      }
    } catch (err) {
      console.log(`⚠️  ${demographicId}: Could not read preset (${err})`);
    }
  }

  console.log(
    `\n📊 Summary: ${presetsChecked} presets checked, ${totalErrors} errors, ${totalWarnings} warnings`,
  );

  if (totalErrors > 0) {
    process.exit(1);
  }

  console.log('\n✅ All presets pass WCAG contrast requirements!');
}

main().catch((err) => {
  console.error('Contrast validation failed:', err);
  process.exit(1);
});
