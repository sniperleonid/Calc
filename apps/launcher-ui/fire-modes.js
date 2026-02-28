export const FIRE_MODE_IDS = {
  POINT: 'POINT',
  CIRCULAR_AREA: 'CIRCULAR_AREA',
  RECT_AREA: 'RECT_AREA',
  LINEAR: 'LINEAR',
  CONVERGED: 'CONVERGED',
  PARALLEL_SHEAF: 'PARALLEL_SHEAF',
  OPEN_SHEAF: 'OPEN_SHEAF',
};

function toFinite(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toRad(deg) {
  return (toFinite(deg, 0) * Math.PI) / 180;
}

function normalizeBearing(deg) {
  const wrapped = toFinite(deg, 0) % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function buildAimPoint({ x, y, z }, index, role, offsetX = 0, offsetY = 0) {
  return {
    x,
    y,
    ...(Number.isFinite(z) ? { z } : {}),
    meta: { index, role, offsetX, offsetY },
  };
}

function evenlyDistributedOffsets(count, width) {
  if (count <= 1) return [0];
  const spacing = width / (count - 1);
  return Array.from({ length: count }, (_, index) => -width / 2 + index * spacing);
}

function getLineEndpoints(config, centerPoint) {
  if (config.startPoint && config.endPoint) {
    return [config.startPoint, config.endPoint];
  }

  const length = Math.max(1, toFinite(config.lengthM, 200));
  const bearing = toRad(normalizeBearing(config.bearingDeg));
  const half = length / 2;
  return [
    { x: centerPoint.x - Math.sin(bearing) * half, y: centerPoint.y - Math.cos(bearing) * half, z: centerPoint.z },
    { x: centerPoint.x + Math.sin(bearing) * half, y: centerPoint.y + Math.cos(bearing) * half, z: centerPoint.z },
  ];
}

export function buildFireModeConfig({ mode, settings = {}, centerPoint }) {
  return {
    mode,
    centerPoint,
    convergePoint: centerPoint,
    bearingDeg: toFinite(settings.bearingDeg, 0),
    radiusM: toFinite(settings.radiusM, 120),
    widthM: toFinite(settings.widthM, 200),
    lengthM: toFinite(settings.lengthM, 200),
    spacingM: toFinite(settings.spacingM, 40),
    sheafWidthM: toFinite(settings.sheafWidthM, 180),
    sheafDepthM: toFinite(settings.sheafDepthM, 0),
    aimpointCount: toFinite(settings.aimpointCount, 8),
    startPoint: settings.startPoint,
    endPoint: settings.endPoint,
    distribute: settings.distribute,
  };
}

export function generateAimPoints(modeConfig, context = {}) {
  const gunCount = Math.max(1, Math.round(toFinite(context.gunCount, 1)));
  const center = modeConfig.centerPoint ?? modeConfig.convergePoint ?? { x: 0, y: 0 };
  const mode = modeConfig.mode ?? FIRE_MODE_IDS.POINT;

  if (mode === FIRE_MODE_IDS.POINT || mode === FIRE_MODE_IDS.CONVERGED) {
    const point = mode === FIRE_MODE_IDS.CONVERGED ? (modeConfig.convergePoint ?? center) : center;
    return [buildAimPoint(point, 0, 'center')];
  }

  if (mode === FIRE_MODE_IDS.PARALLEL_SHEAF || mode === FIRE_MODE_IDS.OPEN_SHEAF) {
    const widthBase = Math.max(10, toFinite(modeConfig.sheafWidthM, toFinite(modeConfig.widthM, 180)));
    const rightBearing = toRad(normalizeBearing(modeConfig.bearingDeg) + 90);
    const offsets = evenlyDistributedOffsets(gunCount, widthBase);
    return offsets.map((offset, index) => buildAimPoint({
      x: center.x + Math.sin(rightBearing) * offset,
      y: center.y + Math.cos(rightBearing) * offset,
      z: center.z,
    }, index, 'sheaf-lane', Math.sin(rightBearing) * offset, Math.cos(rightBearing) * offset));
  }

  if (mode === FIRE_MODE_IDS.CIRCULAR_AREA) {
    const radius = Math.max(1, toFinite(modeConfig.radiusM, 100));
    const count = clamp(Math.round(toFinite(modeConfig.aimpointCount, 8)), 3, 36);
    const points = [buildAimPoint(center, 0, 'center')];
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const offsetX = Math.sin(angle) * radius;
      const offsetY = Math.cos(angle) * radius;
      points.push(buildAimPoint({ x: center.x + offsetX, y: center.y + offsetY, z: center.z }, index + 1, 'ring', offsetX, offsetY));
    }
    return points;
  }

  if (mode === FIRE_MODE_IDS.LINEAR) {
    const [startPoint, endPoint] = getLineEndpoints(modeConfig, center);
    const spacing = Math.max(1, toFinite(modeConfig.spacingM, 40));
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.floor(length / spacing));
    return Array.from({ length: steps + 1 }, (_, index) => {
      const t = steps === 0 ? 0 : index / steps;
      const x = startPoint.x + dx * t;
      const y = startPoint.y + dy * t;
      return buildAimPoint({ x, y, z: center.z }, index, 'line');
    });
  }

  if (mode === FIRE_MODE_IDS.RECT_AREA) {
    const width = Math.max(1, toFinite(modeConfig.widthM, 200));
    const length = Math.max(1, toFinite(modeConfig.lengthM, 200));
    const spacing = Math.max(1, toFinite(modeConfig.spacingM, 40));
    const bearing = toRad(normalizeBearing(modeConfig.bearingDeg));
    const right = { x: Math.sin(bearing + Math.PI / 2), y: Math.cos(bearing + Math.PI / 2) };
    const forward = { x: Math.sin(bearing), y: Math.cos(bearing) };
    const xCells = Math.max(1, Math.floor(width / spacing));
    const yCells = Math.max(1, Math.floor(length / spacing));
    const points = [];
    for (let yIndex = 0; yIndex <= yCells; yIndex += 1) {
      const row = [];
      for (let xIndex = 0; xIndex <= xCells; xIndex += 1) {
        const lateral = -width / 2 + (width * xIndex) / xCells;
        const depth = -length / 2 + (length * yIndex) / yCells;
        row.push(buildAimPoint({
          x: center.x + right.x * lateral + forward.x * depth,
          y: center.y + right.y * lateral + forward.y * depth,
          z: center.z,
        }, points.length + row.length, 'grid', right.x * lateral + forward.x * depth, right.y * lateral + forward.y * depth));
      }
      if (yIndex % 2 === 1) row.reverse();
      points.push(...row);
    }
    return points;
  }

  return [buildAimPoint(center, 0, 'center')];
}

export function pickAimPointForGun({ aimPoints, gunIndex, distribute = 'PATTERN' }) {
  if (!aimPoints?.length) return null;
  if (distribute === 'SAME_POINT' || aimPoints.length === 1) return aimPoints[0];
  return aimPoints[gunIndex % aimPoints.length];
}
