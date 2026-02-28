import { applyHeightCorrection, applyTofHeightCorrection } from './atmosphere.js';
import { bearingFromNorthRad, distance2D, rotateWorldToFireFrame, windFromSpeedDir } from './geometry.js';
import { getTables } from './tables/table-cache.js';
import { closestApproach, simulateTrajectory } from './trajectory.js';
import { radToDeg, radToMil, milToRad, wrapDeg } from './units.js';
import { getWeapon } from './weapons/weapon-registry.js';

function evaluateCandidate({ weapon, charge, elevMil, windFF, targetX, targetY, dt, ttl, milsPerCircle }) {
  const trajectory = simulateTrajectory({
    muzzleVel: charge.muzzleVel,
    elevationRad: milToRad(elevMil, milsPerCircle),
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

function getRangeTableRows(table, chargeId) {
  const chargeData = table?.byCharge?.[chargeId];
  if (Array.isArray(chargeData?.rangeTable) && chargeData.rangeTable.length) {
    return chargeData.rangeTable;
  }
  const range = chargeData?.range ?? [];
  const elevation = chargeData?.elevationMil ?? table?.elevMil ?? [];
  const tof = chargeData?.tof ?? [];
  const dElev = chargeData?.dElev ?? [];
  const tofPer100m = chargeData?.tofPer100m ?? [];
  const size = Math.min(range.length, elevation.length);
  const rows = [];
  for (let i = 0; i < size; i += 1) {
    rows.push({
      range: range[i],
      elevation: elevation[i],
      tof: tof[i],
      dElev: dElev[i],
      tofPer100m: tofPer100m[i],
      dElevPerHeadwind: chargeData?.dElevPerHeadwind?.[i] ?? chargeData?.dElevPerHeadwindMs?.[i],
      driftPerCrosswind: chargeData?.driftPerCrosswind?.[i] ?? chargeData?.driftPerCrosswindMs?.[i],
    });
  }
  return rows;
}

function interpolateRows(rows, distance) {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => a.range - b.range);
  if (distance <= sorted[0].range) return sorted[0];
  for (let i = 1; i < sorted.length; i += 1) {
    if (distance <= sorted[i].range) {
      const left = sorted[i - 1];
      const right = sorted[i];
      if (right.range === left.range) return right;
      const t = (distance - left.range) / (right.range - left.range);
      const lerp = (a, b) => {
        if (!Number.isFinite(a) && !Number.isFinite(b)) return undefined;
        if (!Number.isFinite(a)) return b;
        if (!Number.isFinite(b)) return a;
        return a + (b - a) * t;
      };
      return {
        range: distance,
        elevation: lerp(left.elevation, right.elevation),
        tof: lerp(left.tof, right.tof),
        dElev: lerp(left.dElev, right.dElev),
        tofPer100m: lerp(left.tofPer100m, right.tofPer100m),
        dElevPerHeadwind: lerp(left.dElevPerHeadwind, right.dElevPerHeadwind),
        driftPerCrosswind: lerp(left.driftPerCrosswind, right.driftPerCrosswind),
      };
    }
  }
  return sorted.at(-1);
}

function pickChargeByDistance(table, distance, preferredChargeId) {
  const candidates = [];
  for (const chargeId of table?.charges || []) {
    const rows = getRangeTableRows(table, String(chargeId));
    if (!rows.length) continue;
    const ranges = rows.map((row) => Number(row.range)).filter((value) => Number.isFinite(value));
    if (!ranges.length) continue;
    const minRange = Math.min(...ranges);
    const maxRange = Math.max(...ranges);
    candidates.push({ chargeId: String(chargeId), minRange, maxRange, rows });
  }

  if (preferredChargeId) {
    const preferred = candidates.find((candidate) => candidate.chargeId === String(preferredChargeId));
    if (preferred) return preferred;
  }

  const inRange = candidates
    .filter((candidate) => distance >= candidate.minRange && distance <= candidate.maxRange)
    .sort((a, b) => a.maxRange - b.maxRange);
  if (inRange.length) return inRange[0];

  return candidates
    .sort((a, b) => Math.abs(distance - b.maxRange) - Math.abs(distance - a.maxRange))
    .at(-1) ?? null;
}

function solveFromTable({ table, arcType, weapon, bearingRad, range2D, dz, crossWindMps, headWindMps, preferredChargeId }) {
  const selected = pickChargeByDistance(table, range2D, preferredChargeId);
  if (!selected) return null;

  const base = interpolateRows(selected.rows, range2D);
  if (!base || !Number.isFinite(base.elevation)) return null;

  const baseElevationMil = applyHeightCorrection({
    baseElevationMil: base.elevation,
    heightDiff: dz,
    distance: range2D,
    dElevPer100m: base.dElev,
  });
  const tofSec = applyTofHeightCorrection({
    baseTofSec: base.tof,
    heightDiff: dz,
    tofPer100m: base.tofPer100m,
  });

  const driftMeters = Number.isFinite(base.driftPerCrosswind)
    ? crossWindMps * base.driftPerCrosswind
    : crossWindMps * (Number.isFinite(tofSec) ? tofSec : 0);
  const headwindElevMil = Number.isFinite(base.dElevPerHeadwind) ? headWindMps * base.dElevPerHeadwind : 0;
  const deltaAzimuthDeg = computeRk4AzimuthCorrectionDeg(driftMeters, range2D);

  const correctedElevationMil = baseElevationMil + headwindElevMil;

  return {
    chargeId: selected.chargeId,
    elevMil: correctedElevationMil,
    azimuthDeg: wrapDeg(radToDeg(bearingRad) + deltaAzimuthDeg),
    tofSec,
    muzzleVel: (weapon.charges || []).find((charge) => String(charge.id) === selected.chargeId)?.muzzleVel,
    driftMeters,
    impactX: range2D,
    impactY: dz,
    impactZ: driftMeters,
    missDistance: 0,
    arcType,
    deltaAzimuthDegFromNoWind: deltaAzimuthDeg,
    elevationDeg: radToDeg(milToRad(correctedElevationMil, weapon.milSystem?.milsPerCircle ?? 6400)),
    solverMode: 'table',
  };
}

function computeRk4AzimuthCorrectionDeg(missZ, distance) {
  const safeDistance = Math.max(1, distance);
  return radToDeg(Math.atan2(-missZ, safeDistance));
}

export async function solveFiringSolution(input) {
  const req = {
    toleranceMeters: 10,
    dt: 0.02,
    ttl: 60,
    arc: 'AUTO',
    simulate: false,
    ...input,
  };
  const weapon = await getWeapon(req.weaponId);
  const milsPerCircle = weapon.milSystem?.milsPerCircle ?? 6400;
  const dx = req.targetPos.x - req.gunPos.x;
  const dy = req.targetPos.y - req.gunPos.y;
  const dz = req.targetPos.z - req.gunPos.z;
  const range2D = distance2D(dx, dy);
  const bearingRad = bearingFromNorthRad(dx, dy);

  const windHeadInput = Number(req.wind?.headwindMps);
  const windCrossInput = Number(req.wind?.crosswindMps);
  const windWorld = windFromSpeedDir(req.wind?.speedMps ?? 0, req.wind?.fromDeg ?? req.wind?.directionDeg ?? 0);
  const ff = rotateWorldToFireFrame(windWorld.wx, windWorld.wy, bearingRad);
  const headWindMps = Number.isFinite(windHeadInput) ? windHeadInput : ff.along;
  const crossWindMps = Number.isFinite(windCrossInput) ? windCrossInput : ff.cross;
  const windFF = { x: headWindMps, y: 0, z: crossWindMps };

  const tables = await getTables(req.weaponId, weapon.tables || {});
  const allowTableMode = !req.simulate;

  if (allowTableMode) {
    for (const arcType of getArcOrder(req.arc)) {
      const table = tables[arcType.toLowerCase()];
      if (!table) continue;
      const solved = solveFromTable({
        table,
        arcType,
        weapon,
        bearingRad,
        range2D,
        dz,
        crossWindMps,
        headWindMps,
        preferredChargeId: req.preferredChargeId,
      });
      if (solved) return solved;
    }
  }

  let best = null;
  for (const arcType of getArcOrder(req.arc)) {
    const table = tables[arcType.toLowerCase()];
    const guesses = [];
    if (table?.charges?.length) {
      for (const chargeId of table.charges) {
      if (req.preferredChargeId && String(chargeId) !== String(req.preferredChargeId)) continue;
      const rows = getRangeTableRows(table, String(chargeId));
        const base = interpolateRows(rows, range2D);
        if (!base || !Number.isFinite(base.elevation)) continue;
        guesses.push({ chargeId: String(chargeId), elevMil: base.elevation, dElev: base.dElev });
      }
    } else {
      for (const charge of weapon.charges || []) {
        guesses.push({ chargeId: String(charge.id), elevMil: arcType === 'HIGH' ? 900 : 300 });
      }
    }

    for (const guess of guesses) {
      const charge = (weapon.charges || []).find((item) => String(item.id) === String(guess.chargeId));
      if (!charge) continue;
      const initial = applyHeightCorrection({
        baseElevationMil: guess.elevMil,
        heightDiff: dz,
        distance: range2D,
        dElevPer100m: guess.dElev,
      });
      const refined = refineElevation({
        weapon,
        charge,
        initialElevMil: initial,
        windFF,
        targetX: range2D,
        targetY: dz,
        dt: req.dt,
        ttl: req.ttl,
        milsPerCircle,
      });
      if (!best || refined.miss.distance < best.miss.distance) {
        const deltaAzimuthDeg = computeRk4AzimuthCorrectionDeg(refined.miss.z, range2D);
        best = {
          chargeId: String(charge.id),
          elevMil: refined.elevMil,
          azimuthDeg: wrapDeg(radToDeg(bearingRad) + deltaAzimuthDeg),
          tofSec: refined.miss.t,
          muzzleVel: charge.muzzleVel,
          driftMeters: refined.miss.z,
          impactX: refined.miss.x,
          impactY: refined.miss.y,
          impactZ: refined.miss.z,
          missDistance: refined.miss.distance,
          arcType,
          deltaAzimuthDegFromNoWind: deltaAzimuthDeg,
          elevationDeg: radToDeg(milToRad(refined.elevMil, milsPerCircle)),
          solverMode: 'rk4',
        };
      }
    }
  }

  return best;
}

export const computeFireSolution = solveFiringSolution;
export async function computeFireSolutionsMulti(input, options = {}) {
  const arcs = Array.isArray(options.allowedArcs) && options.allowedArcs.length ? options.allowedArcs : ['LOW', 'HIGH', 'DIRECT'];
  const weapon = await getWeapon(input.weaponId);
  const charges = options.chargesToTry?.length
    ? options.chargesToTry.map((item) => String(item))
    : (weapon.charges || []).map((charge) => String(charge.id));

  const results = [];
  for (const arc of arcs) {
    for (const chargeId of charges) {
      const solved = await solveFiringSolution({ ...input, arc, preferredChargeId: chargeId });
      if (!solved || !Number.isFinite(solved.tofSec)) continue;
      if (results.some((item) => Math.abs(item.tofSec - solved.tofSec) < 0.3 && item.arcType === solved.arcType)) continue;
      results.push(solved);
    }
  }

  const sorted = results.sort((a, b) => (a.missDistance - b.missDistance) || (a.tofSec - b.tofSec));
  const maxSolutions = Math.max(1, Number(options.maxSolutions) || sorted.length);
  return sorted.slice(0, maxSolutions);
}
export const calcDistance2D = distance2D;
export function calcBearingDeg(dx, dy) { return wrapDeg(radToDeg(bearingFromNorthRad(dx, dy))); }
export function degToMil(deg, milsPerCircle = 6400) { return radToMil((deg * Math.PI) / 180, milsPerCircle); }
export function milToDeg(mil, milsPerCircle = 6400) { return (mil * 360) / milsPerCircle; }
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
