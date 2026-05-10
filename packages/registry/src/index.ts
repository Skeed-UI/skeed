import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '..');

export const registryDbPath = resolve(packageRoot, 'registry.db');
export const registryPackageName = '@skeed/registry';
export const registryEmbeddingModel = 'skeed-hash-embed-v1';
