import { calcBearingDeg } from '../../ballistics-core/index.js';
import { getAdjustmentOffset, windForShot } from './adjustment.js';

export const TARGET_TYPES = ['POINT', 'LINE', 'RECTANGLE', 'CIRCLE'];
export const SHEAF_TYPES = ['CONVERGED', 'PARALLEL', 'OPEN'];
export const CONTROL_TYPES = ['SIMULTANEOUS', 'SEQUENCE', 'CREEPING', 'TOT', 'MRSI'];

const LEGACY_TARGET_MAP = {
  POINT: 'POINT',
  CONVERGED: 'POINT',
  LINEAR: 'LINE',
  RECT_AREA: 'RECTANGLE',
  CIRCULAR_AREA: 'CIRCLE',
  'Точечная цель': 'POINT',
  'Линия': 'LINE',
  'Прямоугольник': 'RECTANGLE',
  'Круг': 'CIRCLE',
  'Линейный': 'LINE',
  'Круговой': 'CIRCLE',
};

const LEGACY_SHEAF_MAP = {
  CONVERGED: 'CONVERGED',
  PARALLEL_SHEAF: 'PARALLEL',
  OPEN_SHEAF: 'OPEN',
  'Сходящийся': 'CONVERGED',
  'Параллельный': 'PARALLEL',
  'Открытый': 'OPEN',
};

const LEGACY_CONTROL_MAP = {
  SIMULTANEOUS: 'SIMULTANEOUS',
  SEQUENCE: 'SEQUENCE',
  CREEPING: 'CREEPING',
  TOT: 'TOT',
  MRSI: 'MRSI',
  'Одновременный': 'SIMULTANEOUS',
  'Поочерёдный': 'SEQUENCE',
  'Ползущий огонь': 'CREEPING',
  'Время поражения (TOT)': 'TOT',
};

function normalizeModeValue(value, knownValues, legacyMap, fallback) {
  const normalized = String(value ?? '').trim();
  if (knownValues.includes(normalized)) return normalized;
  const mapped = legacyMap[normalized];
  if (knownValues.includes(mapped)) return mapped;
  return fallback;
}

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
  const count = Math.max(1, Math.round(toFinite(config.aimpointCount, 10)));
  const goldenAngleRad = Math.PI * (3 - Math.sqrt(5));

  return Array.from({ length: count }, (_, i) => {
    if (i === 0) return clonePoint(center, { localIndex: 0, role: 'CENTER' });

    const normalized = i / (count - 1);
    const pointRadius = radius * Math.sqrt(normalized);
    const angle = i * goldenAngleRad;
    const dx = Math.cos(angle) * pointRadius;
    const dy = Math.sin(angle) * pointRadius;
    return clonePoint(
      { x: center.x + dx, y: center.y + dy, z: center.z },
      { localIndex: i, role: 'AREA', offsetRightM: dx, offsetForwardM: dy },
    );
  });
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

function spreadOffsets(count, width) {
  if (count <= 1) return [0];
  return Array.from({ length: count }, (_, i) => -width / 2 + (width * i) / (count - 1));
}

function lineIndicesFromEdges(indices) {
  const ordered = [];
  let left = 0;
  let right = indices.length - 1;
  while (left <= right) {
    ordered.push(indices[left]);
    if (left !== right) ordered.push(indices[right]);
    left += 1;
    right -= 1;
  }
  return ordered;
}

function distributeAimPointsByGun(aimPointIndices, gunCount, targetType) {
  const perGun = Array.from({ length: gunCount }, () => []);
  if (!aimPointIndices.length || gunCount <= 0) return perGun;
  const orderedIndices = targetType === 'LINE'
    ? lineIndicesFromEdges(aimPointIndices)
    : aimPointIndices;
  orderedIndices.forEach((aimPointIndex, sequenceIndex) => {
    perGun[sequenceIndex % gunCount].push(aimPointIndex);
  });
  return perGun;
}

export function getFdcUiSchema(missionFdc = {}) {
  const targetType = TARGET_TYPES.includes(missionFdc.targetType) ? missionFdc.targetType : null;
  const sheafType = SHEAF_TYPES.includes(missionFdc.sheafType) ? missionFdc.sheafType : null;
  const controlType = CONTROL_TYPES.includes(missionFdc.controlType) ? missionFdc.controlType : null;
  const visibleFields = new Set();
  const requiredFields = new Set(['targetType', 'sheafType', 'controlType']);

  if (targetType === 'LINE') {
    ['bearingDeg', 'lengthM', 'spacingM'].forEach((name) => visibleFields.add(name));
    ['bearingDeg', 'lengthM', 'spacingM'].forEach((name) => requiredFields.add(name));
  }
  if (targetType === 'RECTANGLE') {
    ['bearingDeg', 'lengthM', 'widthM', 'spacingM'].forEach((name) => visibleFields.add(name));
    ['bearingDeg', 'lengthM', 'widthM', 'spacingM'].forEach((name) => requiredFields.add(name));
  }
  if (targetType === 'CIRCLE') {
    ['radiusM', 'aimpointCount'].forEach((name) => visibleFields.add(name));
    ['radiusM', 'aimpointCount'].forEach((name) => requiredFields.add(name));
  }

  if (sheafType === 'PARALLEL') {
    visibleFields.add('sheafWidthM');
    requiredFields.add('sheafWidthM');
  }
  if (sheafType === 'OPEN') {
    visibleFields.add('sheafWidthM');
    visibleFields.add('openFactor');
    requiredFields.add('sheafWidthM');
  }

  if (controlType === 'SEQUENCE') visibleFields.add('phaseIntervalSec');
  if (controlType === 'CREEPING') {
    ['stepM', 'stepsCount', 'stepIntervalSec', 'bearingDeg'].forEach((name) => visibleFields.add(name));
    ['stepM', 'stepsCount'].forEach((name) => requiredFields.add(name));
  }
  if (controlType === 'TOT') visibleFields.add('desiredImpactSec');
  if (controlType === 'MRSI') {
    ['mrsiRounds', 'mrsiMinSepSec', 'mrsiAllowedArcs'].forEach((name) => visibleFields.add(name));
    ['mrsiRounds', 'mrsiMinSepSec'].forEach((name) => requiredFields.add(name));
  }

  return { visibleFields, requiredFields };
}

export function migrateOldMissionToFdc(oldMission = {}) {
  const geometry = oldMission.geometry ?? {};
  const sheaf = oldMission.sheaf ?? {};
  const sequence = oldMission.sequence ?? oldMission.control ?? {};
  const creeping = oldMission.creeping ?? {};
  const tot = oldMission.tot ?? {};
  const mrsi = oldMission.mrsi ?? {};
  const targetFallback = LEGACY_TARGET_MAP[oldMission.fireMode] ?? LEGACY_TARGET_MAP[oldMission.fireType] ?? 'POINT';
  const sheafFallback = LEGACY_SHEAF_MAP[oldMission.fireMode] ?? LEGACY_SHEAF_MAP[oldMission.oldSheaf] ?? 'CONVERGED';
  const controlFallback = LEGACY_CONTROL_MAP[oldMission.control] ?? LEGACY_CONTROL_MAP[oldMission.oldFireMode] ?? 'SIMULTANEOUS';
  return {
    targetType: normalizeModeValue(oldMission.targetType, TARGET_TYPES, LEGACY_TARGET_MAP, targetFallback),
    sheafType: normalizeModeValue(oldMission.sheafType, SHEAF_TYPES, LEGACY_SHEAF_MAP, sheafFallback),
    controlType: normalizeModeValue(oldMission.controlType, CONTROL_TYPES, LEGACY_CONTROL_MAP, controlFallback),
    geometry: {
      point: geometry.point ?? oldMission.point,
      center: geometry.center ?? oldMission.center,
      start: geometry.start ?? oldMission.start,
      end: geometry.end ?? oldMission.end,
      bearingDeg: geometry.bearingDeg ?? oldMission.bearingDeg,
      lengthM: geometry.lengthM ?? oldMission.lengthM,
      widthM: geometry.widthM ?? oldMission.widthM,
      radiusM: geometry.radiusM ?? oldMission.radiusM,
      spacingM: geometry.spacingM ?? oldMission.spacingM,
      aimpointCount: geometry.aimpointCount ?? oldMission.aimpointCount,
    },
    sheaf: {
      sheafWidthM: sheaf.sheafWidthM ?? oldMission.sheafWidthM,
      openFactor: sheaf.openFactor ?? oldMission.openFactor,
    },
    sequence: { phaseIntervalSec: oldMission.phaseIntervalSec ?? sequence.phaseIntervalSec },
    creeping: {
      stepM: creeping.stepM ?? oldMission.stepM,
      stepsCount: creeping.stepsCount ?? oldMission.stepsCount,
      stepIntervalSec: creeping.stepIntervalSec ?? oldMission.stepIntervalSec,
      bearingDeg: creeping.bearingDeg ?? oldMission.bearingDeg,
    },
    tot: { desiredImpactSec: tot.desiredImpactSec ?? oldMission.desiredImpactSec ?? oldMission.desiredImpactTimeSec },
    mrsi: {
      mrsiRounds: mrsi.mrsiRounds ?? oldMission.mrsiRounds ?? oldMission.mrsiRoundsPerGun,
      mrsiMinSepSec: mrsi.mrsiMinSepSec ?? oldMission.mrsiMinSepSec ?? oldMission.mrsiMinSeparationSec,
      mrsiAllowedArcs: mrsi.mrsiAllowedArcs ?? oldMission.mrsiAllowedArcs,
    },
    guns: oldMission.guns ?? 'ALL',
    roundsPerGun: oldMission.roundsPerGun ?? 1,
    missionName: oldMission.missionName ?? 'Mission',
  };
}

function flattenFdcConfig(missionFdc) {
  return {
    ...missionFdc,
    ...missionFdc.geometry,
    ...missionFdc.sheaf,
    ...missionFdc.sequence,
    ...missionFdc.creeping,
    ...missionFdc.tot,
    ...missionFdc.mrsi,
  };
}

function validateMissionFdc(missionFdc, config) {
  const { requiredFields } = getFdcUiSchema(missionFdc);
  for (const field of requiredFields) {
    if (field.endsWith('Type')) {
      if (!missionFdc[field]) throw new Error('Выберите режим огня и заполните параметры');
      continue;
    }
    if (field === 'mrsiAllowedArcs') continue;
    if (missionFdc.targetType === 'LINE' && config.start && config.end && ['bearingDeg', 'lengthM', 'spacingM'].includes(field)) continue;
    if (!Number.isFinite(Number(config[field])) && field !== 'phaseIntervalSec' && field !== 'desiredImpactSec') {
      throw new Error('Не заполнены параметры режима огня');
    }
  }
  if (missionFdc.targetType === 'POINT' && !config.point) throw new Error('Выберите режим огня и заполните параметры');
  if (missionFdc.targetType === 'LINE' && !config.center && (!config.start || !config.end)) throw new Error('Выберите режим огня и заполните параметры');
  if ((missionFdc.targetType === 'RECTANGLE' || missionFdc.targetType === 'CIRCLE') && !config.center) throw new Error('Выберите режим огня и заполните параметры');
}

function buildPhases(config, baseAimPoints) {
  if (config.controlType === 'SEQUENCE') {
    return { aimPoints: baseAimPoints, phases: baseAimPoints.map((_, i) => ({ phaseIndex: i, label: `#${i + 1}`, aimPointIndices: [i] })) };
  }
  if (config.controlType === 'CREEPING') {
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
  if (!assignments.length) return assignments;
  for (const phase of plan.phases) {
    const phasePoints = phase.aimPointIndices.map((index) => plan.aimPoints[index]);
    const bearingDeg = resolveBearing(plan.config, guns, phasePoints);
    const { right } = forwardRight(bearingDeg);
    const width = sheafWidth(plan.config);
    const offsets = spreadOffsets(guns.length, width);
    const perGunAimPointIndices = plan.config.targetType === 'POINT'
      ? assignments.map(() => phase.aimPointIndices)
      : distributeAimPointsByGun(phase.aimPointIndices, assignments.length, plan.config.targetType);

    assignments.forEach((assignment, gunIndex) => {
      const assignedIndices = perGunAimPointIndices[gunIndex] ?? [];
      if (plan.config.sheafType === 'CONVERGED') {
        for (const aimPointIndex of assignedIndices) {
          assignment.commands.push({ phaseIndex: phase.phaseIndex, aimPointIndex, rounds: plan.config.roundsPerGun });
        }
        return;
      }

      for (const aimPointIndex of assignedIndices) {
        const point = plan.aimPoints[aimPointIndex];
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
          throw new Error('Не заполнены координаты цели');
        }
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

export function buildAimPlanFromFdc(rawMissionFdc, guns = [], context = {}) {
  const missionFdc = migrateOldMissionToFdc(rawMissionFdc?.missionFdc ?? rawMissionFdc ?? {});
  const config = flattenFdcConfig(missionFdc);
  validateMissionFdc(missionFdc, config);
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
      patternName: `${config.targetType}/${config.sheafType}/${config.controlType}`,
      totalPhases: phaseData.phases.length,
      totalAimPoints: phaseData.aimPoints.length,
    },
    context,
  };
  plan.assignments = buildAssignments(plan, gunList);
  return plan;
}

export const buildAimPlan = buildAimPlanFromFdc;

export function getCurrentPhase(plan) {
  return plan.phases[plan.cursor.phaseIndex] ?? null;
}

export function getPhaseAssignments(plan, phaseIndex) {
  return plan.assignments
    .map((assignment) => ({ ...assignment, commands: assignment.commands.filter((command) => command.phaseIndex === phaseIndex) }))
    .filter((assignment) => assignment.commands.length);
}

function getAimPointOrThrow(plan, aimPointIndex) {
  const point = plan.aimPoints[aimPointIndex];
  if (!point) throw new Error('План огня повреждён: не найдена точка прицеливания');
  return point;
}


function resolveAdjustedAimPoint(plan, command, gunPos) {
  const base = getAimPointOrThrow(plan, command.aimPointIndex);
  const offset = getAdjustmentOffset(plan.runtime?.adjustment);
  const hasOffset = Math.abs(offset.dx) > 0.001 || Math.abs(offset.dy) > 0.001;
  if (!hasOffset) return base;
  return { ...base, x: base.x + offset.dx, y: base.y + offset.dy, meta: { ...(base.meta || {}), adjusted: true } };
}

export async function computePhaseSolutions(plan, phaseIndex, env) {
  const assignments = getPhaseAssignments(plan, phaseIndex);
  const perGunSolutions = {};
  for (const assignment of assignments) {
    perGunSolutions[assignment.gunId] = [];
    for (const command of assignment.commands) {
      const gunPos = env.gunPositions?.[assignment.gunId];
      const point = resolveAdjustedAimPoint(plan, command, gunPos);
      const wind = windForShot({
        gunPos,
        targetPos: point,
        windSettings: env.wind ?? { speedMps: 0, directionDeg: 0, model: 'CONSTANT' },
        fallbackBearingDeg: plan.config.bearingDeg,
      });
      const solution = await env.computeFireSolution({
        gunPos,
        targetPos: { x: point.x, y: point.y, z: Number.isFinite(point.z) ? point.z : 0 },
        weaponId: env.weaponByGunId?.[assignment.gunId],
        wind,
        arc: env.arc ?? 'AUTO',
        preferredChargeId: env.preferredChargeByGunId?.[assignment.gunId],
      });
      perGunSolutions[assignment.gunId].push({ commandRef: command, aimPoint: point, wind, solution });
    }
  }
  return { perGunSolutions };
}

export function applyTOT(plan, phaseIndex, perGunSolutions) {
  const assignments = getPhaseAssignments(plan, phaseIndex);
  const all = Object.values(perGunSolutions).flat();
  const maxTOF = Math.max(...all.map((row) => Number(row.solution?.tofSec || 0)), 0);
  const totMode = plan.config.desiredImpactSec > 0 ? 'AT_TIME' : 'SYNC_NOW';
  const desiredImpactTimeSec = Math.max(0, toFinite(plan.config.desiredImpactSec, 0));
  const phaseStartDelaySec = totMode === 'AT_TIME' ? Math.max(0, desiredImpactTimeSec - maxTOF) : 0;
  assignments.forEach((assignment) => {
    assignment.commands.forEach((command) => {
      const row = (perGunSolutions[assignment.gunId] || []).find((item) => item.commandRef === command);
      const tof = Number(row?.solution?.tofSec || 0);
      command.fireDelaySec = Math.max(0, maxTOF - tof);
      if (phaseStartDelaySec > 0) command.phaseStartDelaySec = phaseStartDelaySec;
    });
  });
  return assignments;
}

function pickMrsiShots(candidates, desiredRounds, minSep) {
  const sorted = [...candidates].sort((a, b) => b.tofSec - a.tofSec);
  for (let count = Math.min(desiredRounds, sorted.length); count >= 1; count -= 1) {
    const picked = [sorted[0]];
    for (const candidate of sorted.slice(1)) {
      if (picked.length >= count) break;
      const last = picked[picked.length - 1];
      if (Math.abs(last.tofSec - candidate.tofSec) >= minSep) picked.push(candidate);
    }
    if (picked.length >= count) return picked;
  }
  return sorted.length ? [sorted[0]] : [];
}

export async function applyMRSI(plan, phaseIndex, env) {
  const assignments = getPhaseAssignments(plan, phaseIndex);
  const rounds = Math.max(1, Math.round(toFinite(plan.config.mrsiRounds, plan.config.roundsPerGun)));
  const minSep = Math.max(0, toFinite(plan.config.mrsiMinSepSec, 2));
  const maxRounds = Math.max(1, Math.round(toFinite(plan.config.mrsiMaxRounds, rounds)));
  for (const assignment of assignments) {
    const command = assignment.commands[0];
    if (!command) continue;
    const point = getAimPointOrThrow(plan, command.aimPointIndex);
    const solutions = await env.computeFireSolutionsMulti({
      gunPos: env.gunPositions?.[assignment.gunId],
      targetPos: { x: point.x, y: point.y, z: Number.isFinite(point.z) ? point.z : 0 },
      weaponId: env.weaponByGunId?.[assignment.gunId],
      wind: env.wind ?? { speedMps: 0, fromDeg: 0 },
    }, {
      allowedArcs: plan.config.mrsiAllowedArcs,
      chargesToTry: env.preferredChargeByGunId?.[assignment.gunId]
        ? [env.preferredChargeByGunId[assignment.gunId]]
        : undefined,
      maxSolutions: Math.max(rounds * 3, toFinite(plan.config.mrsiMaxRounds, rounds * 3)),
    });
    const desiredRounds = Math.min(rounds, maxRounds);
    const picked = pickMrsiShots(solutions, desiredRounds, minSep);
    const impactTime = Math.max(...picked.map((item) => item.tofSec), 0);
    const fireTimes = picked.map((item) => impactTime - item.tofSec);
    const base = Math.min(...fireTimes, 0);
    command.mrsiShotPlan = picked.map((item, index) => ({
      shotIndex: index + 1,
      fireDelaySec: (impactTime - item.tofSec) - base,
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
  if (plan.config.controlType === 'TOT') assignments = applyTOT(plan, phase.phaseIndex, solutions.perGunSolutions);
  if (plan.config.controlType === 'MRSI') assignments = await applyMRSI(plan, phase.phaseIndex, env);
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
