import kleur from 'kleur';
import type { OrchestratorEvent } from '@skeed/pipeline';

/** Single-line stage progress printer. */
export function attachProgress(): (e: OrchestratorEvent) => void {
  let count = 0;
  return (e: OrchestratorEvent) => {
    if (e.type === 'start') {
      count += 1;
      process.stdout.write(`${kleur.cyan(`[${pad(count)}]`)} ${e.stage}\n`);
    } else if (e.type === 'cached') {
      process.stdout.write(`       ${kleur.gray('(cached)')}\n`);
    } else if (e.type === 'error') {
      process.stdout.write(`${kleur.red('       error:')} ${formatErr(e.data)}\n`);
    }
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatErr(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
