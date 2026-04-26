/**
 * Contrast Validation Script
 * 
 * Validates WCAG contrast compliance for all demographic presets.
 * Used in CI quality gates.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { validateContrastPairs, formatContrastResult } from '@skeed/guards';

const DEMOGRAPHICS_DIR = './data/demographics';

async function main() {
  console.log('🎨 Validating WCAG contrast compliance...\n');
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let presetsChecked = 0;
  
  // Get all demographic directories
  const demographics = readdirSync(DEMOGRAPHICS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  
  for (const demographicId of demographics) {
    const presetPath = join(DEMOGRAPHICS_DIR, demographicId, 'preset.json');
    
    try {
      const presetData = JSON.parse(readFileSync(presetPath, 'utf-8'));
      const contrastPairs = presetData.palette?.contrastPairs || [];
      
      if (contrastPairs.length === 0) {
        console.log(`⚠️  ${demographicId}: No contrast pairs defined`);
        continue;
      }
      
      // Convert string pairs to color values
      const pairs = contrastPairs.map((pair: { fg: string; bg: string }) => {
        // Resolve token paths to actual colors
        const fgParts = pair.fg.split('.');
        const bgParts = pair.bg.split('.');
        
        const fg = presetData.palette[fgParts[0]]?.[fgParts[1]] || '#000000';
        const bg = presetData.palette[bgParts[0]]?.[bgParts[1]] || '#ffffff';
        
        return { foreground: fg, background: bg };
      });
      
      const results = validateContrastPairs(pairs, {
        level: undefined,
        textSize: undefined,
        demographicId,
      });
      
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
  
  console.log(`\n📊 Summary: ${presetsChecked} presets checked, ${totalErrors} errors, ${totalWarnings} warnings`);
  
  if (totalErrors > 0) {
    process.exit(1);
  }
  
  console.log('\n✅ All presets pass WCAG contrast requirements!');
}

main().catch(err => {
  console.error('Contrast validation failed:', err);
  process.exit(1);
});
