/**
 * Smoke Test Generation Script
 *
 * Runs a quick subset generation to validate the codegen pipeline works.
 * Tests a single archetype across multiple demographics and densities.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { emitComponent } from '@skeed/codegen';
import type { ArchetypeDefinition, DemographicPreset, Density } from '@skeed/contracts';
import { generateCSSVariables } from '@skeed/core/token-resolver';

const ARCHETYPES_DIR = './data/archetypes';
const DEMOGRAPHICS_DIR = './data/demographics';
const OUTPUT_DIR = './output/smoke-test';

async function loadArchetype(filename: string): Promise<ArchetypeDefinition> {
  // Load metadata from JSON file (e.g., accordion.archetype.json)
  const jsonFilename = filename.replace('.tsx', '.json');
  const jsonPath = join(ARCHETYPES_DIR, jsonFilename);
  const metadata = JSON.parse(readFileSync(jsonPath, 'utf-8'));

  // Load TSX source
  const tsxPath = join(ARCHETYPES_DIR, filename);
  const source = readFileSync(tsxPath, 'utf-8');

  // Map ArchetypeManifest to ArchetypeDefinition
  // tokensUsed -> tokens for component-emitter compatibility
  return {
    id: metadata.id,
    category: metadata.category,
    source,
    imports: [],
    tokens: metadata.tokensUsed || [],
    props: [],
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
    'kids', // AAA-strict
    'education', // AAA-strict
    'health', // AAA-strict
    'fintech', // Normal
    'classic', // Normal
  ];

  // Get a simple archetype to test
  const archetypeFiles = readdirSync(ARCHETYPES_DIR).filter((f) => f.endsWith('.archetype.tsx'));

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
              writeFileSync(outputPath, component.source, 'utf-8');

              // Write CSS variables
              const cssOutputPath = join(
                OUTPUT_DIR,
                `${archetype.id}-${demographicId}-${density}.css`,
              );
              const cssVars = generateCSSVariables(preset, density);
              const cssContent = cssVars.cssVariables
                .map((v) => `  ${v.name}: ${v.value};`)
                .join('\n');
              writeFileSync(cssOutputPath, `:root {\n${cssContent}\n}`, 'utf-8');

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
  const successCount = results.filter((r) => r.success).length;
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
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          total: totalCount,
          success: successCount,
          errors: totalErrors,
        },
        results,
      },
      null,
      2,
    ),
  );

  console.log(`📄 Report written to: ${reportPath}`);
}

runSmokeTest().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
