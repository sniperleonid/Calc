export function applyHeightCorrection({ baseElevationMil, heightDiff, distance, dElevPer100m }) {
  if (Number.isFinite(dElevPer100m)) {
    let correction = (heightDiff / 100) * dElevPer100m;
    if (heightDiff < -100) {
      correction *= 0.6;
    }
    return baseElevationMil - correction;
  }
  const k = 140;
  return baseElevationMil + (k * heightDiff) / Math.max(100, distance);
}

export function applyTofHeightCorrection({ baseTofSec, heightDiff, tofPer100m }) {
  if (!Number.isFinite(baseTofSec)) return null;
  if (!Number.isFinite(tofPer100m)) return baseTofSec;
  return baseTofSec + (heightDiff / 100) * tofPer100m;
}

export function applyWindCorrection({ crossWindMps = 0, tofSec = 0, distance = 1 }) {
  const driftMeters = crossWindMps * tofSec;
  const deltaAzimuthDeg = (Math.atan2(driftMeters, Math.max(1, distance)) * 180) / Math.PI;
  return { driftMeters, deltaAzimuthDeg };
}
