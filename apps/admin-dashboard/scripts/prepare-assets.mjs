// Copies placeholder images and the MSW service worker into public/. Runs before dev and build.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, '../public');
mkdirSync(pub, { recursive: true });

cpSync(resolve(here, '../../../packages/data/assets'), resolve(pub, 'placeholders'), {
  recursive: true,
});

const require = createRequire(import.meta.url);
const worker = resolve(dirname(require.resolve('msw/package.json')), 'lib/mockServiceWorker.js');
if (existsSync(worker)) cpSync(worker, resolve(pub, 'mockServiceWorker.js'));
else console.warn('MSW worker not found. Run `npx msw init public`.');
console.log('Prepared public assets');
