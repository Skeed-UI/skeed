import type { DemographicId, Density } from '@skeed/contracts';
import type { ArchetypeDefinition, GeneratedComponent, ComponentEmitterOptions } from './component-emitter.js';

/**
 * Generation options for the cross-product matrix
 */
export interface GenerateVariantsOptions {
  /** Archetypes to generate */
  archetypes: ArchetypeDefinition[];
  /** Demographics to generate for */
  demographics: DemographicId[];
  /** Densities to generate */
  densities?: Density[];
  /** Demographic presets loader function */
  loadPreset: (demographicId: DemographicId) => Promise<unknown> | unknown;
  /** Progress callback */
  onProgress?: (progress: GenerationProgress) => void;
  /** Concurrency limit */
  concurrency?: number;
  /** Enable caching */
  cacheEnabled?: boolean;
  /** Cache directory */
  cacheDir?: string;
}

/**
 * Generation progress update
 */
export interface GenerationProgress {
  /** Current item being processed */
  current: number;
  /** Total items to process */
  total: number;
  /** Percentage complete (0-100) */
  percentage: number;
  /** Current archetype being processed */
  currentArchetype?: string;
  /** Current demographic being processed */
  currentDemographic?: string;
  /** Current density being processed */
  currentDensity?: Density;
  /** Elapsed time in milliseconds */
  elapsedMs: number;
  /** Estimated time remaining in milliseconds */
  estimatedRemainingMs: number;
}

/**
 * Generation result
 */
export interface GenerationResult {
  /** All generated components */
  components: GeneratedComponent[];
  /** Generation statistics */
  stats: GenerationStats;
  /** Failed generations */
  failures: GenerationFailure[];
  /** Cache statistics */
  cacheStats: CacheStats;
}

/**
 * Generation statistics
 */
export interface GenerationStats {
  /** Total combinations attempted */
  total: number;
  /** Successfully generated */
  successful: number;
  /** Failed to generate */
  failed: number;
  /** Served from cache */
  cached: number;
  /** Time taken in milliseconds */
  durationMs: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Cache hits */
  hits: number;
  /** Cache misses */
  misses: number;
  /** New entries added to cache */
  additions: number;
}

/**
 * Generation failure record
 */
export interface GenerationFailure {
  /** Archetype ID */
  archetypeId: string;
  /** Demographic ID */
  demographicId: string;
  /** Density */
  density: Density;
  /** Error message */
  error: string;
  /** Stack trace */
  stack?: string | undefined;
}

/**
 * Worker pool for parallel generation
 */
interface WorkerPool {
  maxConcurrency: number;
  running: number;
  queue: Array<() => Promise<void>>;
}

/**
 * Generate the complete cross-product matrix of components
 * 
 * Total combinations: archetypes.length × demographics.length × densities.length
 * For 60 archetypes × 20 demographics × 3 densities = 3,600 components
 */
export async function generateVariants(
  options: GenerateVariantsOptions
): Promise<GenerationResult> {
  const {
    archetypes,
    demographics,
    densities = ['compact', 'cozy', 'comfy'],
    loadPreset,
    onProgress,
    concurrency = 4,
    cacheEnabled = true,
    cacheDir = '.skeed/cache',
  } = options;

  const startTime = Date.now();
  const components: GeneratedComponent[] = [];
  const failures: GenerationFailure[] = [];
  const stats: GenerationStats = {
    total: archetypes.length * demographics.length * densities.length,
    successful: 0,
    failed: 0,
    cached: 0,
    durationMs: 0,
  };
  const cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    additions: 0,
  };

  // Create worker pool for parallel generation
  const pool: WorkerPool = {
    maxConcurrency: concurrency,
    running: 0,
    queue: [],
  };

  let processed = 0;

  // Generate all combinations
  for (const archetype of archetypes) {
    for (const demographicId of demographics) {
      for (const density of densities) {
        const task = async () => {
          const taskStart = Date.now();
          
          try {
            // Load preset for this demographic
            const preset = await loadPreset(demographicId);
            if (!preset) {
              throw new Error(`Failed to load preset for demographic: ${demographicId}`);
            }

            // Check cache if enabled
            const cacheKey = generateCacheKey(archetype, demographicId, density);
            let component: GeneratedComponent;
            
            if (cacheEnabled) {
              const cached = await getCachedComponent(cacheKey, cacheDir);
              if (cached) {
                component = cached;
                cacheStats.hits++;
                stats.cached++;
              } else {
                cacheStats.misses++;
                // Generate the component
                const { emitComponent } = await import('./component-emitter.js');
                const emitterOptions: ComponentEmitterOptions = {
                  archetype,
                  preset: preset as unknown as import('@skeed/contracts').DemographicPreset,
                  density,
                };
                component = await emitComponent(emitterOptions);
                
                // Cache the result
                await cacheComponent(cacheKey, component, cacheDir);
                cacheStats.additions++;
              }
            } else {
              // Generate without caching
              const { emitComponent } = await import('./component-emitter.js');
              const emitterOptions: ComponentEmitterOptions = {
                archetype,
                preset: preset as unknown as import('@skeed/contracts').DemographicPreset,
                density,
              };
              component = await emitComponent(emitterOptions);
            }

            components.push(component);
            stats.successful++;
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            failures.push({
              archetypeId: archetype.id,
              demographicId,
              density,
              error: errorMessage,
              stack: error instanceof Error ? error.stack : undefined,
            });
            stats.failed++;
          }

          processed++;
          
          // Report progress
          if (onProgress) {
            const elapsedMs = Date.now() - startTime;
            const percentage = Math.round((processed / stats.total) * 100);
            const rate = processed / (elapsedMs / 1000); // items per second
            const estimatedRemainingMs = rate > 0 
              ? ((stats.total - processed) / rate) * 1000 
              : 0;
            
            onProgress({
              current: processed,
              total: stats.total,
              percentage,
              currentArchetype: archetype.id,
              currentDemographic: demographicId,
              currentDensity: density,
              elapsedMs,
              estimatedRemainingMs: Math.max(0, estimatedRemainingMs),
            });
          }
        };

        // Add to worker pool
        await runWithPool(pool, task);
      }
    }
  }

  // Wait for all workers to complete
  await waitForPool(pool);

  stats.durationMs = Date.now() - startTime;

  return {
    components,
    stats,
    failures,
    cacheStats,
  };
}

/**
 * Run a task with the worker pool
 */
async function runWithPool(pool: WorkerPool, task: () => Promise<void>): Promise<void> {
  return new Promise((resolve) => {
    const wrappedTask = async () => {
      pool.running++;
      try {
        await task();
      } finally {
        pool.running--;
        processQueue(pool);
      }
      resolve();
    };

    if (pool.running < pool.maxConcurrency) {
      // Run immediately
      wrappedTask();
    } else {
      // Queue for later
      pool.queue.push(wrappedTask);
    }
  });
}

/**
 * Process the worker pool queue
 */
function processQueue(pool: WorkerPool): void {
  while (pool.running < pool.maxConcurrency && pool.queue.length > 0) {
    const task = pool.queue.shift();
    if (task) {
      task();
    }
  }
}

/**
 * Wait for all pool workers to complete
 */
async function waitForPool(pool: WorkerPool): Promise<void> {
  while (pool.running > 0 || pool.queue.length > 0) {
    processQueue(pool);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Generate a cache key for a component
 */
function generateCacheKey(
  archetype: ArchetypeDefinition,
  demographicId: string,
  density: Density
): string {
  // Simple hash - in production use crypto.subtle
  const content = `${archetype.id}:${archetype.source}:${demographicId}:${density}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get a cached component (filesystem cache by content key).
 */
async function getCachedComponent(
  cacheKey: string,
  cacheDir: string,
): Promise<GeneratedComponent | null> {
  const { readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  try {
    const raw = await readFile(join(cacheDir, `${cacheKey}.json`), 'utf8');
    const data = JSON.parse(raw) as Omit<GeneratedComponent, 'cssVariables'> & {
      cssVariables: Array<[string, string]>;
    };
    return { ...data, cssVariables: new Map(data.cssVariables) } as GeneratedComponent;
  } catch {
    return null;
  }
}

/**
 * Cache a generated component (filesystem write).
 */
async function cacheComponent(
  cacheKey: string,
  component: GeneratedComponent,
  cacheDir: string,
): Promise<void> {
  const { mkdir, writeFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  await mkdir(cacheDir, { recursive: true });
  const serializable = {
    ...component,
    cssVariables: Array.from(component.cssVariables.entries()),
  };
  await writeFile(join(cacheDir, `${cacheKey}.json`), JSON.stringify(serializable), 'utf8');
}

/**
 * Generate a batch of components for a specific archetype
 * Useful for testing or focused regeneration
 */
export async function generateArchetypeVariants(
  archetype: ArchetypeDefinition,
  demographics: DemographicId[],
  densities: Density[],
  loadPreset: (demographicId: DemographicId) => Promise<unknown> | unknown
): Promise<GenerationResult> {
  return generateVariants({
    archetypes: [archetype],
    demographics,
    densities,
    loadPreset,
  });
}

/**
 * Generate components for a specific demographic
 * Useful for focused demographic testing
 */
export async function generateDemographicVariants(
  archetypes: ArchetypeDefinition[],
  demographicId: DemographicId,
  loadPreset: (demographicId: DemographicId) => Promise<unknown> | unknown
): Promise<GenerationResult> {
  return generateVariants({
    archetypes,
    demographics: [demographicId],
    loadPreset,
  });
}

/**
 * Validate generation options
 */
export function validateGenerationOptions(
  options: GenerateVariantsOptions
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!options.archetypes || options.archetypes.length === 0) {
    errors.push('At least one archetype is required');
  }

  if (!options.demographics || options.demographics.length === 0) {
    errors.push('At least one demographic is required');
  }

  if (options.concurrency !== undefined && options.concurrency < 1) {
    errors.push('Concurrency must be at least 1');
  }

  if (typeof options.loadPreset !== 'function') {
    errors.push('loadPreset must be a function');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
