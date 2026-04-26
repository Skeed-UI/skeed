import { cac } from 'cac';
import kleur from 'kleur';
import { runInit } from './commands/init.js';

const cli = cac('skeed');

cli
  .command('init <prompt>', 'Scaffold a new project from a freeform idea')
  .option('-n, --name <name>', 'Override the inferred project name (slug)')
  .option('-d, --demographic <id>', 'Pin a specific demographic (skip classification)')
  .option('-o, --out <dir>', 'Output parent directory (default: cwd)')
  .option('-y, --yes', 'Skip all approval gates (CI mode)')
  .option('--preview', 'Open browser preview at approval gates (M3)')
  .action(async (prompt: string, opts) => {
    try {
      await runInit({
        prompt,
        ...(opts.name ? { name: opts.name as string } : {}),
        ...(opts.demographic ? { demographic: opts.demographic as string } : {}),
        ...(opts.out ? { outDir: opts.out as string } : {}),
        ...(opts.yes ? { yes: true } : {}),
        ...(opts.preview ? { preview: true } : {}),
      });
    } catch (err) {
      process.stderr.write(`${kleur.red('skeed init failed:')} ${formatErr(err)}\n`);
      process.exit(1);
    }
  });

cli.command('doctor', 'Diagnose Skeed installation').action(() => {
  process.stdout.write(`Skeed CLI 0.1.0 — node ${process.version}\n`);
});

cli.help();
cli.version('0.1.0');
cli.parse();

function formatErr(err: unknown): string {
  if (err instanceof Error) return err.stack ?? err.message;
  return String(err);
}
