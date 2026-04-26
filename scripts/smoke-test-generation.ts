/**
 * Smoke Test Generation Script
 * 
 * Runs a quick subset generation to validate the codegen pipeline works.
 * Tests a single archetype across multiple demographics and densities.
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { ArchetypeDefinition, GeneratedComponent, DemographicPreset, Density } from '@skeed/contracts';
import { emitComponent, emitCSSVariables } from '@skeed/codegen';

const ARCHETYPES_DIR = './data/archetypes';
const DEMOGRAPHICS_DIR = './data/demographics';
const OUTPUT_DIR = './output/smoke-test';

async function loadArchetype(filename: string): Promise<ArchetypeDefinition> {
  const path = join(ARCHETYPES_DIR, filename);
  const content = readFileSync(path, 'utf-8');
  
  // Parse the archetype file to extract metadata and component
  const jsonMatch = content.match(/\/\*\*\s*@archetype\s*\*\/\s*({[\s\S]*?})/);
  if (!jsonMatch) {
    throw new Error(`No archetype metadata found in ${filename}`);
  }
  
  const metadata = JSON.parse(jsonMatch[1]!);
  return {
    ...metadata,
    filename,
  };
}

async function loadPreset(demographicId: string): Promise<DemographicPreset> {
  const path = join(DEMOGRAPHICS_DIR, demographicId, 'preset.json');
  return JSON.parse(readFileSync(path, 'utf-8')) as DemographicPreset;
}

async function runSmokeTest() {
  console.log('🧪 Running Smoke Test Generation...\n');
  
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const densities: Density[] = ['compact', 'cozy', 'comfy'];
  
  // Test demographics - mix of AAA-strict and normal
  const testDemographics = [
    'kids',          // AAA-strict
    'education',     // AAA-strict
    'health',        // AAA-strict
    'fintech',       // Normal
    'classic',       // Normal
  ];
  
  // Get a simple archetype to test
  const archetypeFiles = readdirSync(ARCHETYPES_DIR)
    .filter(f => f.endsWith('.archetype.tsx'));
  
  if (archetypeFiles.length === 0) {
    console.error('❌ No archetypes found');
    process.exit(1);
  }
  
  // Pick 3 simple archetypes for smoke test
  const testArchetypes = archetypeFiles.slice(0, 3);
  
  let totalGenerated = 0;
  let totalErrors = 0;
  const results: Array<{
    archetype: string;
    demographic: string;
    density: string;
    success: boolean;
    error?: string;
  }> = [];
  
  for (const archetypeFile of testArchetypes) {
    console.log(`📦 Testing archetype: ${archetypeFile}`);
    
    try {
      const archetype = await loadArchetype(archetypeFile);
      
      for (const demographicId of testDemographics) {
        try {
          const preset = await loadPreset(demographicId);
          
          for (const density of densities) {
            try {
              const component = await emitComponent({
                archetype,
                preset,
                density,
                variant: 'default',
              });
              
              // Write output for inspection
              const outputFile = `${archetype.id}-${demographicId}-${density}.tsx`;
              const outputPath = join(OUTPUT_DIR, outputFile);
              writeFileSync(outputPath, component.tsx, 'utf-8');
              
              // Write CSS variables
              const cssOutputPath = join(OUTPUT_DIR, `${archetype.id}-${demographicId}-${density}.css`);
              writeFileSync(cssOutputPath, emitCSSVariables(preset, density), 'utf-8');
              
              results.push({
                archetype: archetype.id,
                demographic: demographicId,
                density,
                success: true,
              });
              
              totalGenerated++;
              console.log(`  ✅ ${demographicId} / ${density}`);
              
            } catch (err) {
              const error = err instanceof Error ? err.message : String(err);
              results.push({
                archetype: archetype.id,
                demographic: demographicId,
                density,
                success: false,
                error,
              });
              totalErrors++;
              console.log(`  ❌ ${demographicId} / ${density}: ${error}`);
            }
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          console.log(`  ⚠️  Could not load preset for ${demographicId}: ${error}`);
          totalErrors++;
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.log(`  ❌ Could not load archetype: ${error}`);
      totalErrors++;
    }
    
    console.log('');
  }
  
  // Generate summary report
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('='.repeat(50));
  console.log('SMOKE TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total generated: ${successCount}/${totalCount}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
  
  // Fail if less than 50% success rate
  if (successCount < totalCount * 0.5) {
    console.log('\n❌ Smoke test FAILED - too many errors');
    process.exit(1);
  }
  
  console.log('\n✅ Smoke test PASSED');
  
  // Write detailed report
  const reportPath = join(OUTPUT_DIR, 'report.json');
  writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: totalCount,
      success: successCount,
      errors: totalErrors,
    },
    results,
  }, null, 2));
  
  console.log(`📄 Report written to: ${reportPath}`);
}

runSmokeTest().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
