import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const PORT = 18089;
const BASE = `http://127.0.0.1:${PORT}`;
const serverPath = resolve('services/ui-server/src/server.js');

let server;

async function startServer() {
  const child = spawn('node', [serverPath], {
    env: { ...process.env, UI_PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await new Promise((resolvePromise, reject) => {
    const timer = setTimeout(() => reject(new Error('ui-server start timeout')), 15000);
    const onData = (chunk) => {
      const text = String(chunk);
      if (text.includes('started at')) {
        clearTimeout(timer);
        child.stdout.off('data', onData);
        resolvePromise();
      }
    };

    child.stdout.on('data', onData);
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`ui-server exited before start with code ${code}`));
    });
  });

  return child;
}

async function stopServer(child) {
  if (!child || child.killed) return;
  child.kill('SIGTERM');
  await once(child, 'exit');
}

before(async () => {
  server = await startServer();
});

after(async () => {
  await stopServer(server);
});

test('ui-server exposes /api/ballistics/weapon with milSystem and table endpoint', async () => {
  const lowTablePath = resolve('tables/D30/122mm_HE/ballistic_low.json');
  writeFileSync(lowTablePath, JSON.stringify({ format: 'legacy-npz', charges: [], byCharge: {}, elevMil: [] }));
  try {
    const response = await fetch(`${BASE}/api/ballistics/weapon?weaponId=D30/122mm_HE`);
    assert.equal(response.ok, true);
    const weapon = await response.json();
    assert.equal(weapon.milSystem?.milsPerCircle, 6000);
    assert.equal(Number.isFinite(weapon.minElevMil), true);
    assert.equal(Number.isFinite(weapon.maxElevMil), true);
    assert.match(weapon.tables.low, /^\/api\/ballistics\/table\?path=/);
  } finally {
    if (existsSync(lowTablePath)) unlinkSync(lowTablePath);
  }
});

test('ui-server parses NPZ and local JSON tables via /api/ballistics/table', async () => {
  const jsonPath = resolve('tables/D30/122mm_HE/local_test_table.json');
  const payload = {
    format: 'legacy-npz',
    elevMil: [100, 200],
    charges: ['1'],
    byCharge: {
      '1': {
        range: [1000, 1100],
        elevationMil: [100, 200],
        tof: [10, 11],
        dElev: [5, 5],
        tofPer100m: [1, 1],
      },
    },
  };

  writeFileSync(jsonPath, JSON.stringify(payload));
  try {
    const npzResponse = await fetch(`${BASE}/api/ballistics/table?path=${encodeURIComponent('M777/M107_155MM_HE/ballistic_low.npz')}`);
    assert.equal(npzResponse.ok, true);
    const npz = await npzResponse.json();
    assert.equal(Array.isArray(npz.charges), true);

    const jsonResponse = await fetch(`${BASE}/api/ballistics/table?path=${encodeURIComponent('D30/122mm_HE/local_test_table.json')}`);
    assert.equal(jsonResponse.ok, true);
    const parsedJson = await jsonResponse.json();
    assert.deepEqual(parsedJson, payload);
  } finally {
    if (existsSync(jsonPath)) unlinkSync(jsonPath);
  }
});
