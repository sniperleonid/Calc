import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAimPlan,
  migrateOldMissionToFdc,
  getNextFirePackage,
  getCurrentPhase,
  getPhaseAssignments,
  advancePlanCursor,
  isPlanComplete,
} from '../apps/fire-control/src/fire-mission.js';
import { createAdjustmentState, adjustRange, adjustDirection, decomposeWind } from '../apps/fire-control/src/adjustment.js';

const guns = [
  { id: '1', pos: { x: 0, y: 0, z: 0 } },
  { id: '2', pos: { x: 50, y: 0, z: 0 } },
];

test('generateAimPoints supports POINT/LINE/RECTANGLE/CIRCLE', () => {
  const pointPlan = buildAimPlan({ targetType: 'POINT', sheafType: 'CONVERGED', control: 'SIMULTANEOUS', guns: 'ALL', roundsPerGun: 1, point: { x: 100, y: 200 } }, guns);
  assert.equal(pointPlan.aimPoints.length, 1);

  const linePlan = buildAimPlan({ targetType: 'LINE', sheafType: 'CONVERGED', control: 'SIMULTANEOUS', guns: 'ALL', roundsPerGun: 1, start: { x: 0, y: 0 }, end: { x: 0, y: 100 }, spacingM: 25 }, guns);
  assert.equal(linePlan.aimPoints.length, 5);

  const rectPlan = buildAimPlan({ targetType: 'RECTANGLE', sheafType: 'CONVERGED', control: 'SIMULTANEOUS', guns: 'ALL', roundsPerGun: 1, center: { x: 0, y: 0 }, widthM: 100, lengthM: 100, spacingM: 50, bearingDeg: 0 }, guns);
  assert.equal(rectPlan.aimPoints.length, 9);

  const circlePlan = buildAimPlan({ targetType: 'CIRCLE', sheafType: 'CONVERGED', control: 'SIMULTANEOUS', guns: 'ALL', roundsPerGun: 1, center: { x: 0, y: 0 }, radiusM: 40, aimpointCount: 8 }, guns);
  assert.equal(circlePlan.aimPoints.length, 9);
});

test('PARALLEL offsets are applied along right vector sign', () => {
  const plan = buildAimPlan({ targetType: 'POINT', sheafType: 'PARALLEL', control: 'SIMULTANEOUS', guns: 'ALL', roundsPerGun: 1, point: { x: 0, y: 0 }, bearingDeg: 0, sheafWidthM: 100 }, guns);
  const phaseAssign = getPhaseAssignments(plan, 0);
  const p1 = plan.aimPoints[phaseAssign[0].commands[0].aimPointIndex];
  const p2 = plan.aimPoints[phaseAssign[1].commands[0].aimPointIndex];
  assert.equal(p1.x < p2.x, true);
});

test('CREEPING shifts each phase by forward*k*stepM', () => {
  const plan = buildAimPlan({ targetType: 'POINT', sheafType: 'CONVERGED', control: 'CREEPING', guns: 'ALL', roundsPerGun: 1, point: { x: 0, y: 0 }, bearingDeg: 90, stepM: 50, stepsCount: 3 }, guns);
  assert.equal(plan.phases.length, 3);
  const p0 = plan.aimPoints[plan.phases[0].aimPointIndices[0]];
  const p2 = plan.aimPoints[plan.phases[2].aimPointIndices[0]];
  assert.equal(Math.round(p2.x - p0.x), 100);
});

test('migrateOldMissionToFdc keeps nested FDC blocks for CREEPING/MRSI/TOT', () => {
  const fdc = migrateOldMissionToFdc({
    targetType: 'POINT',
    sheafType: 'CONVERGED',
    controlType: 'CREEPING',
    geometry: { point: { x: 0, y: 0 }, bearingDeg: 45 },
    creeping: { stepM: 60, stepsCount: 4, stepIntervalSec: 9, bearingDeg: 30 },
    tot: { desiredImpactSec: 25 },
    mrsi: { mrsiRounds: 3, mrsiMinSepSec: 2, mrsiAllowedArcs: ['LOW'] },
  });

  assert.equal(fdc.creeping.stepM, 60);
  assert.equal(fdc.creeping.stepsCount, 4);
  assert.equal(fdc.creeping.stepIntervalSec, 9);
  assert.equal(fdc.creeping.bearingDeg, 30);
  assert.equal(fdc.tot.desiredImpactSec, 25);
  assert.equal(fdc.mrsi.mrsiRounds, 3);
  assert.equal(fdc.mrsi.mrsiMinSepSec, 2);
  assert.deepEqual(fdc.mrsi.mrsiAllowedArcs, ['LOW']);
});

test('migrateOldMissionToFdc keeps nested geometry points from FDC UI config', () => {
  const point = { x: 1200, y: 3400, z: 55 };
  const start = { x: 1000, y: 3000, z: 55 };
  const end = { x: 1400, y: 3800, z: 55 };
  const center = { x: 1300, y: 3500, z: 55 };

  const fdc = migrateOldMissionToFdc({
    targetType: 'LINE',
    geometry: {
      point,
      start,
      end,
      center,
      spacingM: 50,
    },
  });

  assert.deepEqual(fdc.geometry.point, point);
  assert.deepEqual(fdc.geometry.start, start);
  assert.deepEqual(fdc.geometry.end, end);
  assert.deepEqual(fdc.geometry.center, center);
});



test('migrateOldMissionToFdc normalizes invalid or localized mode values', () => {
  const fdc = migrateOldMissionToFdc({
    targetType: '',
    sheafType: 'Сходящийся',
    controlType: 'Поочерёдный',
    fireMode: 'Линейный',
  });

  assert.equal(fdc.targetType, 'LINE');
  assert.equal(fdc.sheafType, 'CONVERGED');
  assert.equal(fdc.controlType, 'SEQUENCE');
});
test('SEQUENCE creates one phase per aim point', () => {
  const plan = buildAimPlan({ targetType: 'LINE', sheafType: 'CONVERGED', control: 'SEQUENCE', guns: 'ALL', roundsPerGun: 1, start: { x: 0, y: 0 }, end: { x: 0, y: 100 }, spacingM: 25 }, guns);
  assert.equal(plan.phases.length, plan.aimPoints.length);
});

test('TOT computes delay=maxTOF-tof', async () => {
  const plan = buildAimPlan({ targetType: 'POINT', sheafType: 'CONVERGED', control: 'TOT', guns: 'ALL', roundsPerGun: 1, point: { x: 100, y: 100 } }, guns);
  const env = {
    gunPositions: { '1': { x: 0, y: 0, z: 0 }, '2': { x: 0, y: 0, z: 0 } },
    weaponByGunId: { '1': 'w1', '2': 'w2' },
    computeFireSolution: async ({ weaponId }) => ({ azimuthDeg: 0, elevMil: 100, tofSec: weaponId === 'w1' ? 10 : 14 }),
    computeFireSolutionsMulti: async () => [],
  };
  const pkg = await getNextFirePackage(plan, env);
  const byGun = Object.fromEntries(pkg.assignments.map((a) => [a.gunId, a.commands[0].fireDelaySec]));
  assert.equal(byGun['2'], 0);
  assert.equal(byGun['1'], 4);
});

test('MRSI delays are ordered and impacts are simultaneous with min separation', async () => {
  const plan = buildAimPlan({
    targetType: 'POINT', sheafType: 'CONVERGED', control: 'MRSI', guns: ['1'], roundsPerGun: 1,
    point: { x: 100, y: 100 }, mrsiRoundsPerGun: 3, mrsiMinSeparationSec: 2,
  }, guns);
  const env = {
    gunPositions: { '1': { x: 0, y: 0, z: 0 } },
    weaponByGunId: { '1': 'w1' },
    computeFireSolution: async () => ({ azimuthDeg: 0, elevMil: 100, tofSec: 10 }),
    computeFireSolutionsMulti: async () => ([
      { azimuthDeg: 0, elevMil: 100, tofSec: 14, chargeId: '3', arcType: 'HIGH' },
      { azimuthDeg: 0, elevMil: 90, tofSec: 12, chargeId: '2', arcType: 'LOW' },
      { azimuthDeg: 0, elevMil: 80, tofSec: 10, chargeId: '1', arcType: 'LOW' },
    ]),
  };
  const pkg = await getNextFirePackage(plan, env);
  const shots = pkg.assignments[0].commands[0].mrsiShotPlan;
  assert.equal(shots.length, 3);
  for (let i = 1; i < shots.length; i += 1) {
    assert.equal(shots[i].fireDelaySec >= shots[i - 1].fireDelaySec, true);
    assert.equal(shots[i].fireDelaySec - shots[i - 1].fireDelaySec >= 2, true);
  }
  const impactTimes = shots.map((shot) => shot.fireDelaySec + shot.tofSec);
  assert.equal(Math.max(...impactTimes) - Math.min(...impactTimes) < 0.001, true);
  assert.equal(getCurrentPhase(plan).phaseIndex, 0);
});

test('correction adjustment offset is applied without rebuilding plan', async () => {
  const plan = buildAimPlan({
    targetType: 'POINT', sheafType: 'CONVERGED', control: 'SIMULTANEOUS', guns: ['1'], roundsPerGun: 1,
    point: { x: 100, y: 100 },
  }, guns);
  const origin = { x: 0, y: 0 };
  let adjustment = createAdjustmentState({ x: 100, y: 100, z: 0 }, 200);
  adjustment.origin = origin;
  adjustment = adjustRange(adjustDirection(adjustment, origin, 25), origin, 50);
  const runtimePlan = { ...plan, runtime: { adjustment } };
  const env = {
    gunPositions: { '1': { x: 0, y: 0, z: 0 } },
    weaponByGunId: { '1': 'w1' },
    computeFireSolution: async ({ targetPos, wind }) => ({ azimuthDeg: 0, elevMil: 100, tofSec: 10, targetPos, wind }),
    computeFireSolutionsMulti: async () => [],
    wind: { speedMps: 8, directionDeg: 90 },
  };
  const pkg = await getNextFirePackage(runtimePlan, env);
  const solved = pkg.solutions.perGunSolutions['1'][0];
  assert.notEqual(solved.aimPoint.x, plan.aimPoints[0].x);
  assert.notEqual(solved.wind.crosswindMps, 0);
  const advanced = advancePlanCursor(runtimePlan);
  assert.equal(advanced.cursor.phaseIndex, 1);
});

test('next calculation completes plan phase by phase', async () => {
  let plan = buildAimPlan({
    targetType: 'LINE', sheafType: 'CONVERGED', control: 'SEQUENCE', guns: ['1'], roundsPerGun: 1,
    start: { x: 0, y: 0 }, end: { x: 0, y: 50 }, spacingM: 25,
  }, guns);
  const env = {
    gunPositions: { '1': { x: 0, y: 0, z: 0 } },
    weaponByGunId: { '1': 'w1' },
    computeFireSolution: async () => ({ azimuthDeg: 0, elevMil: 100, tofSec: 10 }),
    computeFireSolutionsMulti: async () => [],
  };
  assert.equal(isPlanComplete(plan), false);
  for (let i = 0; i < plan.phases.length; i += 1) {
    const pkg = await getNextFirePackage(plan, env);
    assert.equal(pkg.phase.phaseIndex, i);
    plan = advancePlanCursor(plan);
  }
  assert.equal(isPlanComplete(plan), true);
});

test('invalid aim point index returns a readable error instead of TypeError', async () => {
  const plan = buildAimPlan({
    targetType: 'POINT', sheafType: 'CONVERGED', control: 'SIMULTANEOUS', guns: ['1'], roundsPerGun: 1,
    point: { x: 100, y: 100 },
  }, guns);
  const broken = {
    ...plan,
    assignments: [{ gunId: '1', commands: [{ phaseIndex: 0, aimPointIndex: 999, rounds: 1 }] }],
  };
  const env = {
    gunPositions: { '1': { x: 0, y: 0, z: 0 } },
    weaponByGunId: { '1': 'w1' },
    computeFireSolution: async () => ({ azimuthDeg: 0, elevMil: 100, tofSec: 10 }),
    computeFireSolutionsMulti: async () => [],
  };
  await assert.rejects(() => getNextFirePackage(broken, env), /План огня повреждён/);
});

test('wind decomposition returns headwind/crosswind from meteorological direction', () => {
  const out = decomposeWind({ speedMps: 10, directionDeg: 0, model: 'CONSTANT' }, 90);
  assert.equal(Math.round(out.headwindMps), 0);
  assert.equal(Math.round(out.crosswindMps), 10);
});
