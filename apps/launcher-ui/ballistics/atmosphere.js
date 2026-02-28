export function applyHeightCorrection({ baseElevationMil, heightDiff, distance, dElevPer100m }) {
  if (Number.isFinite(dElevPer100m)) {
    return baseElevationMil + (heightDiff / 100) * dElevPer100m;
  }
  const k = 140;
  return baseElevationMil + (k * heightDiff) / Math.max(100, distance);
}

export function applyWindCorrection({ crossWindMps = 0, tofSec = 0, distance = 1 }) {
  const driftMeters = crossWindMps * tofSec;
  const deltaAzimuthDeg = (Math.atan2(driftMeters, Math.max(1, distance)) * 180) / Math.PI;
  return { driftMeters, deltaAzimuthDeg };
}
