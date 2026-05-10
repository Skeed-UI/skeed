#!/usr/bin/env node
/**
 * Publish @skeed packages to npm in dependency order.
 *
 * Usage:
 *   node scripts/publish-packages.mjs
 *   node scripts/publish-packages.mjs --dry-run
 *
 * The script skips package versions that already exist on npm, which makes it
 * safe for CI to run on every push to the release branch.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const registry = process.env.NPM_CONFIG_REGISTRY || 'https://registry.npmjs.org/';
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('dry-run');
const useProvenance =
  process.env.GITHUB_ACTIONS === 'true' && process.env.SKEED_DISABLE_PROVENANCE !== 'true';
const publishUnscopedAlias = process.env.SKEED_PUBLISH_UNSCOPED_ALIAS === 'true';

const publishOrder = [
  '@skeed/contracts',
  '@skeed/core',
  '@skeed/motion',
  '@skeed/tailwind',
  '@skeed/asset-icon',
  '@skeed/archetypes-loader',
  '@skeed/demographics-loader',
  '@skeed/llm-cache',
  '@skeed/llm-provider-anthropic',
  '@skeed/llm-provider-google',
  '@skeed/llm-provider-local',
  '@skeed/llm-provider-ollama',
  '@skeed/llm-provider-openai',
  '@skeed/asset-source-fal',
  '@skeed/asset-source-gemini-image',
  '@skeed/asset-source-open-doodles',
  '@skeed/asset-source-openai-image',
  '@skeed/asset-source-pexels',
  '@skeed/asset-source-replicate',
  '@skeed/asset-source-undraw',
  '@skeed/asset-source-unsplash',
  '@skeed/assets-router',
  '@skeed/llm-router',
  '@skeed/research-bridge',
  '@skeed/landing-options',
  '@skeed/scoring',
  '@skeed/asset-logo-svg',
  '@skeed/guards',
  '@skeed/codegen',
  '@skeed/indexer',
  '@skeed/registry',
  '@skeed/ui',
  '@skeed/pipeline',
  '@skeed/cli',
  ...(publishUnscopedAlias ? ['skeed'] : []),
  '@skeed/mcp-server',
  '@skeed/eslint-plugin-skeed',
];

function packageDir(name) {
  return join(process.cwd(), 'packages', name.replace('@skeed/', ''));
}

function packageJson(name) {
  const path = join(packageDir(name), 'package.json');
  if (!existsSync(path)) {
    return undefined;
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: options.stdio ?? 'pipe',
  });

  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
    status: result.status,
  };
}

function npmViewVersion(name, version) {
  const result = run('npm', ['view', `${name}@${version}`, 'version', '--registry', registry]);
  if (!result.ok) {
    return undefined;
  }
  return result.output.split(/\s+/).at(-1);
}

function publishPackage(name) {
  const args = ['publish', '--access', 'public', '--registry', registry];
  if (useProvenance) {
    args.push('--provenance');
  }

  if (dryRun) {
    args.push('--dry-run');
  }

  return run('npm', args, { cwd: packageDir(name), stdio: 'inherit' });
}

function ensureAuth() {
  if (dryRun) {
    return;
  }

  const whoami = run('npm', ['whoami', '--registry', registry]);
  if (!whoami.ok) {
    console.error('npm authentication failed. Configure NPM_API_KEY/NODE_AUTH_TOKEN for npm.');
    console.error(whoami.output);
    process.exit(1);
  }

  console.log(`Authenticated to npm as ${whoami.output.split(/\s+/).at(-1)}`);
}

function ensureBuild() {
  if (process.env.SKEED_SKIP_BUILD === 'true') {
    console.log('Skipping build because SKEED_SKIP_BUILD=true.');
    return;
  }

  console.log('Building packages before publish...');
  execFileSync('pnpm', ['build'], { stdio: 'inherit', shell: process.platform === 'win32' });
}

function main() {
  console.log(`Publishing Skeed packages to ${registry}`);
  if (dryRun) {
    console.log('Dry run enabled: npm publish will not upload packages.');
  }

  ensureAuth();
  ensureBuild();

  const summary = {
    published: [],
    skipped: [],
    failed: [],
  };

  for (const name of publishOrder) {
    const pkg = packageJson(name);
    if (!pkg) {
      summary.skipped.push(`${name}: package.json not found`);
      continue;
    }

    if (pkg.private) {
      summary.skipped.push(`${name}@${pkg.version}: private package`);
      continue;
    }

    const version = pkg.version;
    if (dryRun) {
      console.log(`dry-run ${name}@${version}: publish eligibility would be checked`);
      summary.skipped.push(`${name}@${version}: dry run`);
      continue;
    }

    const existing = npmViewVersion(name, version);
    if (existing === version) {
      console.log(`skip ${name}@${version}: already published`);
      summary.skipped.push(`${name}@${version}: already published`);
      continue;
    }

    console.log(`publish ${name}@${version}`);
    const published = publishPackage(name, version);
    if (published.ok) {
      summary.published.push(`${name}@${version}`);
    } else {
      summary.failed.push(`${name}@${version}`);
    }
  }

  console.log('\nPublish summary');
  console.log(`published: ${summary.published.length}`);
  console.log(`skipped: ${summary.skipped.length}`);
  console.log(`failed: ${summary.failed.length}`);

  if (summary.failed.length > 0) {
    for (const failure of summary.failed) {
      console.error(`failed: ${failure}`);
    }
    process.exit(1);
  }
}

main();
