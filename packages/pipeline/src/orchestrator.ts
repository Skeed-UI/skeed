import { createHash } from 'node:crypto';
import type { Stage, StageContext } from '@skeed/contracts';

export interface OrchestratorEvent {
  stage: string;
  type: 'start' | 'token' | 'done' | 'error' | 'cached';
  data?: unknown;
}

export type OrchestratorListener = (e: OrchestratorEvent) => void;

export interface RunOptions {
  runId: string;
  registryVersion: string;
  cache: StageContext['cache'];
  signal?: AbortSignal;
}

/**
 * Tiny in-process DAG runner. Stages are registered in topological order.
 * Each stage hashes (version + canonical(input)) → cache key. Cache hit skips
 * the run; miss invokes `stage.run`, validates output, persists, and emits events.
 *
 * Listeners are how the Tauri/CLI host streams progress to the user.
 *
 * AGENTS: do not add stage-specific logic here. Add stages under `src/stages/`.
 */
export class Orchestrator {
  private readonly stages: Array<Stage<unknown, unknown>> = [];
  private readonly listeners = new Set<OrchestratorListener>();

  register<I, O>(stage: Stage<I, O>): this {
    this.stages.push(stage as Stage<unknown, unknown>);
    return this;
  }

  on(listener: OrchestratorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Run from `firstInput` through every registered stage in order.
   * Each stage's input is the previous stage's output (linear pipeline).
   * For branching, override this in a subclass — but keep it boring.
   */
  async run(firstInput: unknown, opts: RunOptions): Promise<unknown> {
    const ctx: StageContext = {
      runId: opts.runId,
      registryVersion: opts.registryVersion,
      cache: opts.cache,
      emit: (e) => {
        for (const l of this.listeners) l(e);
      },
      signal: opts.signal ?? new AbortController().signal,
    };

    let current = firstInput;
    for (const stage of this.stages) {
      const cacheKey = this.cacheKey(stage, current, opts.registryVersion);
      ctx.emit({ stage: stage.name, type: 'start' });

      if (stage.cacheable) {
        const cached = await opts.cache.get(cacheKey);
        if (cached !== undefined) {
          ctx.emit({ stage: stage.name, type: 'cached', data: cacheKey });
          current = stage.outputSchema.parse(cached);
          continue;
        }
      }

      try {
        const validated = stage.inputSchema.parse(current);
        const output = await stage.run(validated, ctx);
        const checked = stage.outputSchema.parse(output);
        if (stage.cacheable) {
          await opts.cache.set(cacheKey, checked);
        }
        current = checked;
        ctx.emit({ stage: stage.name, type: 'done', data: cacheKey });
      } catch (err) {
        ctx.emit({ stage: stage.name, type: 'error', data: err });
        throw err;
      }
    }
    return current;
  }

  private cacheKey(stage: Stage<unknown, unknown>, input: unknown, registryVersion: string): string {
    const canonical = JSON.stringify(input, Object.keys(input as object).sort());
    return createHash('sha256')
      .update(`${stage.name}@${stage.version}|${registryVersion}|${canonical}`)
      .digest('hex');
  }
}
