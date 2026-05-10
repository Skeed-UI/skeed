#!/usr/bin/env node
/**
 * Skeed CLI alias package
 * This is a thin wrapper that delegates to @skeed/cli
 */

import { spawn } from 'child_process';

// Find the @skeed/cli executable
const cliPath = process.env.npm_config_user_agent?.includes('pnpm')
  ? 'pnpm --filter @skeed/cli skeed'
  : 'skeed';

// Spawn the actual CLI
const args = process.argv.slice(2);
const proc = spawn('npx', ['@skeed/cli', ...args], {
  stdio: 'inherit',
  shell: true
});

proc.on('exit', (code) => {
  process.exit(code ?? 1);
});
