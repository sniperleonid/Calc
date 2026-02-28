import { calcBearingDeg } from '../../ballistics-core/index.js';

function toFinite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeDeg(deg) {
  const wrapped = toFinite(deg, 0) % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

export function decomposeWind(windSettings, bearingFireDeg) {
  const speedMps = toFinite(windSettings?.speedMps, 0);
  const fromDeg = normalizeDeg(windSettings?.directionDeg ?? windSettings?.fromDeg ?? 0);
  const windToDirDeg = normalizeDeg(fromDeg + 180);
  const deltaRad = ((windToDirDeg - normalizeDeg(bearingFireDeg)) * Math.PI) / 180;
  return {
    speedMps,
    directionDeg: fromDeg,
    bearingFireDeg: normalizeDeg(bearingFireDeg),
    headwindMps: speedMps * Math.cos(deltaRad),
    crosswindMps: speedMps * Math.sin(deltaRad),
  };
}

export function createAdjustmentState(baseTarget, bracketSizeM = 200) {
  return {
    baseTarget: { x: toFinite(baseTarget?.x, 0), y: toFinite(baseTarget?.y, 0), z: toFinite(baseTarget?.z, 0) },
    currentTarget: { x: toFinite(baseTarget?.x, 0), y: toFinite(baseTarget?.y, 0), z: toFinite(baseTarget?.z, 0) },
    lastImpact: undefined,
    bracketSizeM: Math.max(1, toFinite(bracketSizeM, 200)),
    history: [],
  };
}

function getForwardRight(origin, target) {
  const bearing = calcBearingDeg(target.x - origin.x, target.y - origin.y);
  const rad = (bearing * Math.PI) / 180;
  return {
    forward: { x: Math.sin(rad), y: Math.cos(rad) },
    right: { x: Math.sin(rad + Math.PI / 2), y: Math.cos(rad + Math.PI / 2) },
    bearing,
  };
}

function withShift(state, origin, deltaRangeM, deltaDirectionM) {
  const basis = getForwardRight(origin, state.currentTarget);
  const dx = basis.forward.x * deltaRangeM + basis.right.x * deltaDirectionM;
  const dy = basis.forward.y * deltaRangeM + basis.right.y * deltaDirectionM;
  return {
    ...state,
    currentTarget: {
      ...state.currentTarget,
      x: state.currentTarget.x + dx,
      y: state.currentTarget.y + dy,
    },
    history: [...state.history, { dx, dy }],
  };
}

export function adjustRange(state, origin, deltaM) {
  return withShift(state, origin, toFinite(deltaM, 0), 0);
}

export function adjustDirection(state, origin, deltaM) {
  return withShift(state, origin, 0, toFinite(deltaM, 0));
}

export function autoBracket(state, origin, observation) {
  const obs = String(observation || '').toUpperCase();
  if (!obs.includes('OVER') && !obs.includes('SHORT') && !obs.includes('ПЕРЕЛ') && !obs.includes('НЕДОЛ')) return state;
  const direction = (obs.includes('OVER') || obs.includes('ПЕРЕЛ')) ? -1 : 1;
  const nextStep = Math.max(1, state.bracketSizeM / 2);
  const next = adjustRange({ ...state, bracketSizeM: nextStep }, origin, direction * nextStep);
  return next;
}

export function getAdjustmentOffset(state) {
  return {
    dx: toFinite(state?.currentTarget?.x, 0) - toFinite(state?.baseTarget?.x, 0),
    dy: toFinite(state?.currentTarget?.y, 0) - toFinite(state?.baseTarget?.y, 0),
  };
}

export function windForShot({ gunPos, targetPos, windSettings, fallbackBearingDeg }) {
  const dx = toFinite(targetPos?.x, 0) - toFinite(gunPos?.x, 0);
  const dy = toFinite(targetPos?.y, 0) - toFinite(gunPos?.y, 0);
  const bearingFireDeg = (Math.hypot(dx, dy) > 0.01) ? calcBearingDeg(dx, dy) : toFinite(fallbackBearingDeg, 0);
  const components = decomposeWind(windSettings, bearingFireDeg);
  return {
    speedMps: components.speedMps,
    fromDeg: components.directionDeg,
    directionDeg: components.directionDeg,
    headwindMps: components.headwindMps,
    crosswindMps: components.crosswindMps,
  };
}
