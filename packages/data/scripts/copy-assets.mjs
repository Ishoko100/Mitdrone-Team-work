// Usage (from an app dir): node ../../packages/data/scripts/copy-assets.mjs ./public/placeholders
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(process.cwd(), process.argv[2] ?? './public/placeholders');
mkdirSync(target, { recursive: true });
cpSync(resolve(here, '../assets'), target, { recursive: true });
console.log(`Copied placeholder assets to ${target}`);
