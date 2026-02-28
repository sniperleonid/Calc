import { calcBearingDeg } from '../../ballistics-core/index.js';

export const TARGET_TYPES = ['POINT', 'LINE', 'RECTANGLE', 'CIRCLE'];
export const SHEAF_TYPES = ['CONVERGED', 'PARALLEL', 'OPEN'];
export const CONTROL_TYPES = ['SIMULTANEOUS', 'SEQUENCE', 'CREEPING', 'TOT', 'MRSI'];

function toFinite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeBearing(deg) {
  const wrapped = toFinite(deg, 0) % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function forwardRight(bearingDeg) {
  const rad = (normalizeBearing(bearingDeg) * Math.PI) / 180;
  return {
    forward: { x: Math.sin(rad), y: Math.cos(rad) },
    right: { x: Math.sin(rad + Math.PI / 2), y: Math.cos(rad + Math.PI / 2) },
  };
}

function offsetPoint(point, vec, distance) {
  return { x: point.x + vec.x * distance, y: point.y + vec.y * distance, ...(Number.isFinite(point.z) ? { z: point.z } : {}) };
}

function clonePoint(point, meta = {}) {
  return { x: point.x, y: point.y, ...(Number.isFinite(point.z) ? { z: point.z } : {}), meta };
}

function linePoints(start, end, spacingM) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const spacing = Math.max(1, toFinite(spacingM, 40));
  const n = Math.max(1, Math.floor(length / spacing));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = n === 0 ? 0 : i / n;
    return {
      x: start.x + dx * t,
      y: start.y + dy * t,
      ...(Number.isFinite(start.z) ? { z: start.z } : {}),
      meta: { localIndex: i, role: 'LINE' },
    };
  });
}

function rectPoints(config) {
  const width = Math.max(1, toFinite(config.widthM, 200));
  const length = Math.max(1, toFinite(config.lengthM, 200));
  const spacing = Math.max(1, toFinite(config.spacingM, 40));
  const center = config.center;
  const { forward, right } = forwardRight(config.bearingDeg);
  const xCells = Math.max(1, Math.floor(width / spacing));
  const yCells = Math.max(1, Math.floor(length / spacing));
  const points = [];
  for (let yi = 0; yi <= yCells; yi += 1) {
    for (let xi = 0; xi <= xCells; xi += 1) {
      const lateral = -width / 2 + (width * xi) / xCells;
      const depth = -length / 2 + (length * yi) / yCells;
      points.push(clonePoint({
        x: center.x + right.x * lateral + forward.x * depth,
        y: center.y + right.y * lateral + forward.y * depth,
        z: center.z,
      }, { localIndex: points.length, role: 'GRID', offsetRightM: lateral, offsetForwardM: depth }));
    }
  }
  return points;
}

function circlePoints(config) {
  const center = config.center;
  const radius = Math.max(1, toFinite(config.radiusM, 100));
  const count = Math.max(3, Math.round(toFinite(config.aimpointCount, 10)));
  const points = [clonePoint(center, { localIndex: 0, role: 'CENTER' })];
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const dx = Math.sin(angle) * radius;
    const dy = Math.cos(angle) * radius;
    points.push(clonePoint({ x: center.x + dx, y: center.y + dy, z: center.z }, { localIndex: i + 1, role: 'RING', offsetRightM: dx, offsetForwardM: dy }));
  }
  return points;
}

function generateBaseAimPoints(config) {
  if (config.targetType === 'POINT') {
    if (!config.point) throw new Error('POINT requires point');
    return [clonePoint(config.point, { localIndex: 0, role: 'CENTER' })];
  }
  if (config.targetType === 'LINE') {
    let start = config.start;
    let end = config.end;
    if (!start || !end) {
      if (!config.center) throw new Error('LINE requires start/end or center');
      const length = Math.max(1, toFinite(config.lengthM, 200));
      const { forward } = forwardRight(config.bearingDeg);
      start = offsetPoint(config.center, forward, -length / 2);
      end = offsetPoint(config.center, forward, length / 2);
    }
    return linePoints(start, end, config.spacingM);
  }
  if (config.targetType === 'RECTANGLE') {
    if (!config.center) throw new Error('RECTANGLE requires center');
    return rectPoints(config);
  }
  if (config.targetType === 'CIRCLE') {
    if (!config.center) throw new Error('CIRCLE requires center');
    return circlePoints(config);
  }
  return [];
}

function resolveBearing(config, guns, phasePoints) {
  if (Number.isFinite(Number(config.bearingDeg))) return normalizeBearing(config.bearingDeg);
  if (config.targetType === 'POINT' && guns.length) {
    const gun = guns[0];
    const target = phasePoints[0] ?? config.point;
    if (gun?.pos && target) {
      return calcBearingDeg(target.x - gun.pos.x, target.y - gun.pos.y);
    }
  }
  return 0;
}

function sheafWidth(config) {
  const base = Math.max(10, toFinite(config.sheafWidthM, 100));
  if (config.sheafType === 'OPEN') return base * Math.max(1, toFinite(config.openFactor, 2));
  return base;
}

function buildPhases(config, baseAimPoints) {
  if (config.control === 'SEQUENCE') {
    return { aimPoints: baseAimPoints, phases: baseAimPoints.map((_, i) => ({ phaseIndex: i, label: `#${i + 1}`, aimPointIndices: [i] })) };
  }
  if (config.control === 'CREEPING') {
    const stepM = Math.max(1, toFinite(config.stepM, 50));
    const stepsCount = Math.max(1, Math.round(toFinite(config.stepsCount, 1)));
    const interval = Math.max(0, toFinite(config.stepIntervalSec, 0));
    const points = [];
    const phases = [];
    const { forward } = forwardRight(config.bearingDeg);
    for (let k = 0; k < stepsCount; k += 1) {
      const phaseIndices = [];
      for (const point of baseAimPoints) {
        const shifted = clonePoint(offsetPoint(point, forward, k * stepM), { ...point.meta, phaseIndex: k });
        phaseIndices.push(points.length);
        points.push(shifted);
      }
      phases.push({ phaseIndex: k, label: `Step ${k + 1}`, aimPointIndices: phaseIndices, plannedStartDelaySec: k * interval });
    }
    return { aimPoints: points, phases };
  }
  return { aimPoints: baseAimPoints, phases: [{ phaseIndex: 0, label: 'Main', aimPointIndices: baseAimPoints.map((_, i) => i) }] };
}

function buildAssignments(plan, guns) {
  const assignments = guns.map((gun) => ({ gunId: gun.id, commands: [] }));
  for (const phase of plan.phases) {
    const phasePoints = phase.aimPointIndices.map((index) => plan.aimPoints[index]);
    const bearingDeg = resolveBearing(plan.config, guns, phasePoints);
    const { right } = forwardRight(bearingDeg);
    const width = sheafWidth(plan.config);
    const offsets = guns.length <= 1 ? [0] : guns.map((_, i) => -width / 2 + (width * i) / (guns.length - 1));

    assignments.forEach((assignment, gunIndex) => {
      if (plan.config.sheafType === 'CONVERGED') {
        for (const aimPointIndex of phase.aimPointIndices) {
          assignment.commands.push({ phaseIndex: phase.phaseIndex, aimPointIndex, rounds: plan.config.roundsPerGun });
        }
        return;
      }

      if (plan.config.targetType === 'CIRCLE') {
        phase.aimPointIndices.forEach((aimPointIndex, index) => {
          if (index % assignments.length === gunIndex) {
            assignment.commands.push({ phaseIndex: phase.phaseIndex, aimPointIndex, rounds: plan.config.roundsPerGun });
          }
        });
        return;
      }

      for (const aimPointIndex of phase.aimPointIndices) {
        const point = plan.aimPoints[aimPointIndex];
        const shifted = clonePoint(offsetPoint(point, right, offsets[gunIndex]), {
          ...point.meta,
          offsetRightM: offsets[gunIndex],
          role: 'LINE',
          phaseIndex: phase.phaseIndex,
        });
        const shiftedIndex = plan.aimPoints.push(shifted) - 1;
        assignment.commands.push({ phaseIndex: phase.phaseIndex, aimPointIndex: shiftedIndex, rounds: plan.config.roundsPerGun });
      }
    });
  }
  return assignments;
}

export function buildAimPlan(config, guns = [], context = {}) {
  const gunList = (config.guns === 'ALL' ? guns : guns.filter((gun) => config.guns.includes(gun.id))).map((gun) => ({ id: String(gun.id), pos: gun.pos }));
  const baseAimPoints = generateBaseAimPoints(config);
  const phaseData = buildPhases(config, baseAimPoints);
  const plan = {
    config,
    aimPoints: phaseData.aimPoints,
    phases: phaseData.phases,
    assignments: [],
    cursor: { phaseIndex: 0 },
    summary: {
      patternName: `${config.targetType}/${config.sheafType}/${config.control}`,
      totalPhases: phaseData.phases.length,
      totalAimPoints: phaseData.aimPoints.length,
    },
    context,
  };
  plan.assignments = buildAssignments(plan, gunList);
  return plan;
}

export function getCurrentPhase(plan) {
  return plan.phases[plan.cursor.phaseIndex] ?? null;
}

export function getPhaseAssignments(plan, phaseIndex) {
  return plan.assignments
    .map((assignment) => ({ ...assignment, commands: assignment.commands.filter((command) => command.phaseIndex === phaseIndex) }))
    .filter((assignment) => assignment.commands.length);
}

export async function computePhaseSolutions(plan, phaseIndex, env) {
  const assignments = getPhaseAssignments(plan, phaseIndex);
  const perGunSolutions = {};
  for (const assignment of assignments) {
    perGunSolutions[assignment.gunId] = [];
    for (const command of assignment.commands) {
      const gunPos = env.gunPositions?.[assignment.gunId];
      const point = plan.aimPoints[command.aimPointIndex];
      const solution = await env.computeFireSolution({
        gunPos,
        targetPos: { x: point.x, y: point.y, z: Number.isFinite(point.z) ? point.z : 0 },
        weaponId: env.weaponByGunId?.[assignment.gunId],
        wind: env.wind ?? { speedMps: 0, fromDeg: 0 },
        arc: env.arc ?? 'AUTO',
      });
      perGunSolutions[assignment.gunId].push({ commandRef: command, aimPoint: point, solution });
    }
  }
  return { perGunSolutions };
}

export function applyTOT(plan, phaseIndex, perGunSolutions) {
  const assignments = getPhaseAssignments(plan, phaseIndex);
  const all = Object.values(perGunSolutions).flat();
  const maxTOF = Math.max(...all.map((row) => Number(row.solution?.tofSec || 0)), 0);
  assignments.forEach((assignment) => {
    assignment.commands.forEach((command) => {
      const row = (perGunSolutions[assignment.gunId] || []).find((item) => item.commandRef === command);
      const tof = Number(row?.solution?.tofSec || 0);
      command.fireDelaySec = Math.max(0, maxTOF - tof);
    });
  });
  return assignments;
}

export async function applyMRSI(plan, phaseIndex, env) {
  const assignments = getPhaseAssignments(plan, phaseIndex);
  const rounds = Math.max(1, Math.round(toFinite(plan.config.mrsiRoundsPerGun, plan.config.roundsPerGun)));
  const minSep = Math.max(0, toFinite(plan.config.mrsiMinSeparationSec, 2));
  for (const assignment of assignments) {
    const command = assignment.commands[0];
    if (!command) continue;
    const point = plan.aimPoints[command.aimPointIndex];
    const solutions = await env.computeFireSolutionsMulti({
      gunPos: env.gunPositions?.[assignment.gunId],
      targetPos: { x: point.x, y: point.y, z: Number.isFinite(point.z) ? point.z : 0 },
      weaponId: env.weaponByGunId?.[assignment.gunId],
      wind: env.wind ?? { speedMps: 0, fromDeg: 0 },
    }, {
      allowedArcs: plan.config.mrsiAllowedArcs,
      maxSolutions: Math.max(rounds * 3, toFinite(plan.config.mrsiMaxRounds, rounds * 3)),
    });
    const sorted = [...solutions].sort((a, b) => a.tofSec - b.tofSec);
    const picked = [];
    for (const candidate of sorted) {
      if (picked.length >= rounds) break;
      if (!picked.length || Math.abs(candidate.tofSec - picked.at(-1).tofSec) >= minSep) picked.push(candidate);
    }
    const impactTime = Math.max(...picked.map((item) => item.tofSec), 0);
    command.mrsiShotPlan = picked.map((item, index) => ({
      shotIndex: index + 1,
      fireDelaySec: impactTime - item.tofSec,
      azimuthDeg: item.azimuthDeg,
      elevationMil: item.elevMil,
      chargeId: item.chargeId,
      tofSec: item.tofSec,
      note: `${item.arcType} arc`,
    })).sort((a, b) => a.fireDelaySec - b.fireDelaySec);
  }
  return assignments;
}

export async function getNextFirePackage(plan, env) {
  const phase = getCurrentPhase(plan);
  if (!phase) return null;
  let assignments = getPhaseAssignments(plan, phase.phaseIndex);
  const solutions = await computePhaseSolutions(plan, phase.phaseIndex, env);
  if (plan.config.control === 'TOT') assignments = applyTOT(plan, phase.phaseIndex, solutions.perGunSolutions);
  if (plan.config.control === 'MRSI') assignments = await applyMRSI(plan, phase.phaseIndex, env);
  return {
    phase,
    aimPoints: phase.aimPointIndices.map((index) => plan.aimPoints[index]),
    assignments,
    solutions,
  };
}

export function advancePlanCursor(plan) {
  return { ...plan, cursor: { phaseIndex: plan.cursor.phaseIndex + 1 } };
}

export function isPlanComplete(plan) {
  return plan.cursor.phaseIndex >= plan.phases.length;
}
