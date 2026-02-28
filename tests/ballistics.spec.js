import test from 'node:test';
import assert from 'node:assert/strict';

import { bearingFromNorthRad, windFromSpeedDir, targetFromObserver } from '../apps/ballistics-core/geometry.js';
import { solveFiringSolution, interpolateTable } from '../apps/ballistics-core/solver.js';

function almost(actual, expected, eps = 1e-3) {
  assert.equal(Math.abs(actual - expected) <= eps, true, `expected ${actual} ~= ${expected}`);
}

test('bearingFromNorthRad sanity', () => {
  almost((bearingFromNorthRad(0, 1) * 180) / Math.PI, 0);
  almost((bearingFromNorthRad(1, 0) * 180) / Math.PI, 90);
});

test('windFromSpeedDir from=0 blows to south', () => {
  const w = windFromSpeedDir(10, 0);
  almost(w.wx, 0, 1e-6);
  almost(w.wy, -10, 1e-6);
});

test('targetFromObserver sanity', () => {
  const p = targetFromObserver({ x: 100, y: 200 }, 1000, 90);
  almost(p.x, 1100, 1e-6);
  almost(p.y, 200, 1e-6);
});

test('interpolateTable linear interpolation', () => {
  const value = interpolateTable([1000, 2000], [300, 500], 1500);
  almost(value, 400);
});

test('solveFiringSolution uses table guess and simulation refine', async () => {
  const oldFetch = global.fetch;
  global.fetch = async (url) => {
    const u = String(url);
    if (u.startsWith('/api/ballistics/weapon')) {
      return Response.json({
        weaponId: 'TEST/HE',
        maxElevMil: 1500,
        tables: {
          low: '/api/ballistics/file?path=TEST/HE/ballistic_low.npz',
        },
        primaryTable: {
          format: 'legacy-npz',
          charges: ['1'],
          elevMil: [200, 250, 300],
          byCharge: { '1': { range: [900, 1200, 1500], elevationMil: [200, 250, 300], tof: [8, 10, 12] } },
          meta: { dragCoeff: 0.002, massKg: 20 },
        },
      });
    }
    if (u.startsWith('/api/ballistics/table')) {
      return Response.json({
        format: 'legacy-npz',
        charges: ['1'],
        elevMil: [200, 250, 300],
        byCharge: { '1': { range: [900, 1200, 1500], elevationMil: [200, 250, 300], tof: [8, 10, 12] } },
        meta: { dragCoeff: 0.002, massKg: 20 },
      });
    }
    throw new Error(`Unexpected url ${u}`);
  };

  const solution = await solveFiringSolution({
    weaponId: 'TEST/HE',
    gunPos: { x: 0, y: 0, z: 0 },
    targetPos: { x: 1200, y: 0, z: 0 },
    arc: 'LOW',
    wind: { speedMps: 0, fromDeg: 0 },
  });
  assert.equal(solution.chargeId, '1');
  assert.equal(Number.isFinite(solution.elevMil), true);

  global.fetch = oldFetch;
});

test('crosswind creates drift sign', async () => {
  const oldFetch = global.fetch;
  global.fetch = async (url) => {
    const u = String(url);
    if (u.startsWith('/api/ballistics/weapon')) {
      return Response.json({
        weaponId: 'TEST/HE',
        maxElevMil: 1500,
        tables: { low: '/api/ballistics/file?path=TEST/HE/ballistic_low.npz' },
        primaryTable: {
          format: 'legacy-npz',
          charges: ['1'],
          elevMil: [250],
          byCharge: { '1': { range: [1200], elevationMil: [250], tof: [10] } },
          meta: { dragCoeff: 0.002, massKg: 20 },
        },
      });
    }
    if (u.startsWith('/api/ballistics/table')) {
      return Response.json({
        format: 'legacy-npz',
        charges: ['1'],
        elevMil: [250],
        byCharge: { '1': { range: [1200], elevationMil: [250], tof: [10] } },
        meta: { dragCoeff: 0.002, massKg: 20 },
      });
    }
    throw new Error(`Unexpected url ${u}`);
  };

  const solution = await solveFiringSolution({
    weaponId: 'TEST/HE',
    gunPos: { x: 0, y: 0, z: 0 },
    targetPos: { x: 0, y: 1200, z: 0 },
    arc: 'LOW',
    wind: { speedMps: 8, fromDeg: 270 },
  });
  assert.equal(Math.abs(solution.driftMeters) > 0.01, true);
  global.fetch = oldFetch;
});


test('weapon registry loads from server tables catalog endpoint', async () => {
  const { getWeapon } = await import('../apps/ballistics-core/weapons/weapon-registry.js');
  const oldFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => {
    urls.push(String(url));
    if (String(url).startsWith('/api/ballistics/weapon')) {
      return Response.json({
        weaponId: 'D30/122mm_HE',
        tables: { low: '/api/ballistics/file?path=D30/122mm_HE/ballistic_low.npz' },
        maxElevMil: 1230,
        primaryTable: {
          charges: ['1'],
          elevMil: [200],
          byCharge: { '1': { range: [1000], elevationMil: [200], tof: [8] } },
          meta: { dragCoeff: 0.0024, massKg: 21 },
        },
      });
    }
    throw new Error('unexpected fetch url');
  };

  const weapon = await getWeapon('D30/122mm_HE');
  assert.equal(weapon.weaponId, 'D30/122mm_HE');
  assert.equal(urls.some((u) => u.startsWith('/api/ballistics/weapon?weaponId=')), true);
  global.fetch = oldFetch;
});

