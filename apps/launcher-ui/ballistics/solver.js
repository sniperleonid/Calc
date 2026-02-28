import { applyHeightCorrection, applyWindCorrection } from './atmosphere.js';
import { bearingFromNorthRad, distance2D, rotateWorldToFireFrame, windFromSpeedDir } from './geometry.js';
import { getTables } from './tables/table-cache.js';
import { closestApproach, simulateTrajectory } from './trajectory.js';
import { radToDeg, radToMil, milToRad, wrapDeg } from './units.js';
import { getWeapon } from './weapons/weapon-registry.js';

function inverseInterpolateElevation(rangeArray, elevArray, targetRange) {
  let best = elevArray[0] ?? 0;
  let err = Infinity;
  for (let i = 0; i < Math.min(rangeArray.length, elevArray.length); i += 1) {
    const e = Math.abs(rangeArray[i] - targetRange);
    if (e < err) {
      err = e;
      best = elevArray[i];
    }
  }
  return best;
}

function evaluateCandidate({ weapon, charge, elevMil, windFF, targetX, targetY, dt, ttl }) {
  const trajectory = simulateTrajectory({
    muzzleVel: charge.muzzleVel,
    elevationRad: milToRad(elevMil),
    dragCoeff: weapon.dragCoeff,
    massKg: weapon.massKg,
    wind: windFF,
    dt,
    ttl,
  });
  const miss = closestApproach(trajectory, targetX, targetY, 0);
  return { miss, trajectory };
}

function refineElevation(params) {
  let center = params.initialElevMil;
  let span = 50;
  let best = null;
  for (let iter = 0; iter < 4; iter += 1) {
    for (let i = -5; i <= 5; i += 1) {
      const elevMil = center + (span * i) / 5;
      const candidate = evaluateCandidate({ ...params, elevMil });
      if (!best || candidate.miss.distance < best.miss.distance) {
        best = { elevMil, ...candidate };
      }
    }
    center = best.elevMil;
    span /= 2;
  }
  return best;
}

function getArcOrder(arc) {
  if (arc === 'AUTO') return ['LOW', 'HIGH', 'DIRECT'];
  return [arc];
}

function guessFromTable(table, targetX) {
  const guesses = [];
  for (const chargeId of table.charges || []) {
    const range = table.byCharge?.[chargeId]?.range || [];
    const elev = table.byCharge?.[chargeId]?.elevationMil || table.elevMil || [];
    if (!range.length || !elev.length) continue;
    guesses.push({ chargeId: String(chargeId), elevMil: inverseInterpolateElevation(range, elev, targetX), tofSec: null });
  }
  return guesses;
}

export async function solveFiringSolution(input) {
  const req = {
    toleranceMeters: 10,
    dt: 0.02,
    ttl: 60,
    arc: 'AUTO',
    ...input,
  };
  const weapon = await getWeapon(req.weaponId);
  const dx = req.targetPos.x - req.gunPos.x;
  const dy = req.targetPos.y - req.gunPos.y;
  const dz = req.targetPos.z - req.gunPos.z;
  const range2D = distance2D(dx, dy);
  const bearingRad = bearingFromNorthRad(dx, dy);

  const windWorld = windFromSpeedDir(req.wind?.speedMps ?? 0, req.wind?.fromDeg ?? 0);
  const ff = rotateWorldToFireFrame(windWorld.wx, windWorld.wy, bearingRad);
  const windFF = { x: ff.along, y: 0, z: ff.cross };

  const tables = await getTables(req.weaponId, weapon.tables || {});
  let best = null;

  for (const arcType of getArcOrder(req.arc)) {
    const table = tables[arcType.toLowerCase()];
    const guesses = table
      ? guessFromTable(table, range2D)
      : (weapon.charges || []).map((charge) => ({ chargeId: String(charge.id), elevMil: arcType === 'HIGH' ? 900 : 300 }));

    for (const guess of guesses) {
      const charge = (weapon.charges || []).find((item) => String(item.id) === String(guess.chargeId));
      if (!charge) continue;
      let initial = guess.elevMil;
      initial = applyHeightCorrection({ baseElevationMil: initial, heightDiff: dz, distance: range2D });
      const refined = refineElevation({
        weapon,
        charge,
        initialElevMil: initial,
        windFF,
        targetX: range2D,
        targetY: dz,
        dt: req.dt,
        ttl: req.ttl,
      });
      if (!best || refined.miss.distance < best.miss.distance) {
        const windFix = applyWindCorrection({ crossWindMps: ff.cross, tofSec: refined.miss.t, distance: range2D });
        best = {
          chargeId: String(charge.id),
          elevMil: refined.elevMil,
          azimuthDeg: wrapDeg(radToDeg(bearingRad) + windFix.deltaAzimuthDeg),
          tofSec: refined.miss.t,
          muzzleVel: charge.muzzleVel,
          driftMeters: refined.miss.z,
          impactX: refined.miss.x,
          impactY: refined.miss.y,
          impactZ: refined.miss.z,
          missDistance: refined.miss.distance,
          arcType,
          deltaAzimuthDegFromNoWind: windFix.deltaAzimuthDeg,
          elevationDeg: radToDeg(milToRad(refined.elevMil)),
        };
      }
    }
  }

  return best;
}

export const computeFireSolution = solveFiringSolution;
export const calcDistance2D = distance2D;
export function calcBearingDeg(dx, dy) { return wrapDeg(radToDeg(bearingFromNorthRad(dx, dy))); }
export function degToMil(deg) { return radToMil((deg * Math.PI) / 180); }
export function milToDeg(mil) { return (mil * 360) / 6400; }
export function lerp(x, x0, x1, y0, y1) {
  if (x1 === x0) return y0;
  const t = (x - x0) / (x1 - x0);
  return y0 + (y1 - y0) * t;
}
export function interpolateTable(range, values, x) {
  if (!range?.length || !values?.length) return null;
  if (x <= range[0]) return values[0];
  for (let i = 1; i < range.length; i += 1) {
    if (x <= range[i]) return lerp(x, range[i - 1], range[i], values[i - 1], values[i]);
  }
  return values.at(-1);
}
