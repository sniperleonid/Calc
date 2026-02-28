import test from 'node:test';
import assert from 'node:assert/strict';

import { FIRE_MODE_IDS, generateAimPoints, pickAimPointForGun } from '../apps/launcher-ui/fire-modes.js';

test('POINT returns single aim point', () => {
  const points = generateAimPoints({ mode: FIRE_MODE_IDS.POINT, centerPoint: { x: 1000, y: 2000, z: 12 } }, { gunCount: 4 });
  assert.equal(points.length, 1);
  assert.deepEqual(points[0], { x: 1000, y: 2000, z: 12, meta: { index: 0, role: 'center', offsetX: 0, offsetY: 0 } });
});

test('PARALLEL_SHEAF distributes guns across width', () => {
  const points = generateAimPoints({
    mode: FIRE_MODE_IDS.PARALLEL_SHEAF,
    centerPoint: { x: 500, y: 500 },
    sheafWidthM: 90,
    bearingDeg: 0,
  }, { gunCount: 4 });
  assert.equal(points.length, 4);
  assert.equal(points[0].x < points[1].x, true);
  assert.equal(points[3].x > points[2].x, true);
  assert.equal(points[0].y, 500);
});

test('CIRCULAR_AREA returns center plus ring points', () => {
  const points = generateAimPoints({
    mode: FIRE_MODE_IDS.CIRCULAR_AREA,
    centerPoint: { x: 250, y: 300 },
    radiusM: 50,
    aimpointCount: 6,
  });
  assert.equal(points.length, 7);
  assert.deepEqual(points[0].x, 250);
  assert.deepEqual(points[0].y, 300);
  assert.equal(Math.round(Math.hypot(points[1].x - 250, points[1].y - 300)), 50);
});

test('LINEAR builds points by spacing and pickAimPointForGun supports round-robin', () => {
  const points = generateAimPoints({
    mode: FIRE_MODE_IDS.LINEAR,
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 0, y: 100 },
    spacingM: 25,
    centerPoint: { x: 0, y: 0 },
  });
  assert.equal(points.length, 5);
  assert.equal(pickAimPointForGun({ aimPoints: points, gunIndex: 6, distribute: 'PATTERN' }).y, 25);
});
