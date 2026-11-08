import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const run = (command, args, options = {}) =>
  spawnSync(command, args, { cwd: root, stdio: 'inherit', ...options });

if (process.env.MITDRONE_E2E_SKIP_BUILD !== 'true') {
  const build = run(process.execPath, [
    resolve(root, 'node_modules/turbo/bin/turbo'),
    'run',
    'build',
    '--concurrency=1',
  ]);
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const apps = [
  { name: 'Marketplace', path: 'apps/marketplace-web', port: 3000 },
  { name: 'Vendor dashboard', path: 'apps/vendor-dashboard', port: 3001 },
  { name: 'Admin dashboard', path: 'apps/admin-dashboard', port: 3002 },
];
const portBase = Number(process.env.MITDRONE_E2E_PORT_BASE ?? 3000);
apps.forEach((app, index) => (app.port = portBase + index));
const selectedApps = process.env.MITDRONE_E2E_APP
  ? apps.filter((app) => app.path.endsWith(process.env.MITDRONE_E2E_APP))
  : apps;
if (process.env.MITDRONE_E2E_APP && selectedApps.length === 0)
  throw new Error(`Unknown app selector: ${process.env.MITDRONE_E2E_APP}`);

async function waitForServer(child, url) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Keep polling until Next.js reports ready or the startup deadline passes.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  const closed = once(child, 'close');
  child.kill('SIGTERM');
  const didClose = await Promise.race([closed.then(() => true), delay(5_000).then(() => false)]);
  if (!didClose) {
    const killed = once(child, 'close');
    child.kill('SIGKILL');
    await Promise.race([killed, delay(5_000)]);
  }
}

for (const app of selectedApps) {
  const cwd = resolve(root, app.path);
  console.log(`\nStarting ${app.name} server at http://127.0.0.1:${app.port}...`);
  const server = spawn(
    process.execPath,
    [resolve(root, 'node_modules/next/dist/bin/next'), 'start', '-p', String(app.port)],
    {
      cwd,
      env: { ...process.env, NEXT_PUBLIC_ENABLE_MOCKS: 'true' },
      stdio: 'inherit',
    },
  );
  server.on('error', (error) => console.error(`Could not start ${app.name}:`, error));

  try {
    await waitForServer(server, `http://127.0.0.1:${app.port}/`);
    console.log(`\nRunning ${app.name} browser tests...`);
    const result = run(
      process.execPath,
      [resolve(root, 'node_modules/@playwright/test/cli.js'), 'test'],
      {
        cwd,
        env: {
          ...process.env,
          MITDRONE_E2E_EXTERNAL_SERVER: 'true',
          MITDRONE_E2E_PORT: String(app.port),
        },
      },
    );
    if (result.status !== 0)
      throw new Error(`${app.name} E2E suite failed with code ${result.status}`);
  } finally {
    await stopServer(server);
  }
}

console.log('\nAll frontend E2E suites passed.');
