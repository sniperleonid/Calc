import test from 'node:test';
import assert from 'node:assert/strict';

import { computeFireSolution } from '../apps/launcher-ui/ballistics-core-client.js';

test('computeFireSolution calls ballistics core proxy and maps response', async () => {
  const oldFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return Response.json({
      solution: {
        azimuth_deg: 45.5,
        elevation_mils: 612.2,
        flight_time_s: 9.3,
        drift_m: 4.1,
      },
    });
  };

  const result = await computeFireSolution({
    weaponId: 'D30/122mm_HE',
    gunPos: { x: 10, y: 20, z: 120 },
    targetPos: { x: 1010, y: 2020, z: 140 },
    wind: { speedMps: 3, fromDeg: 270 },
  });

  assert.equal(calls[0].url, '/api/ballistics-core/solve-fire-mission');
  const payload = JSON.parse(String(calls[0].init.body));
  assert.equal(payload.barrel_profile_id, 'D30');
  assert.equal(payload.ammo_type, '122mm_HE');
  assert.equal(payload.charge, 1);

  assert.equal(result.azimuthDeg, 45.5);
  assert.equal(result.elevMil, 612.2);
  assert.equal(result.tofSec, 9.3);
  assert.equal(result.driftMeters, 4.1);
  assert.equal(result.arcType, 'CORE');

  global.fetch = oldFetch;
});
