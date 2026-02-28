export function normalizeWeaponProfile(raw) {
  return {
    weaponId: raw.weaponId,
    displayName: raw.displayName ?? raw.weaponId,
    massKg: Number(raw.massKg ?? 20),
    dragCoeff: Number(raw.dragCoeff ?? 0.002),
    charges: Array.isArray(raw.charges) ? raw.charges : [],
    minElevMil: Number(raw.minElevMil ?? 0),
    maxElevMil: Number(raw.maxElevMil ?? 1550),
    tables: raw.tables ?? {},
    milSystem: {
      milsPerCircle: Number(raw.milSystem?.milsPerCircle ?? raw.milsPerCircle ?? 6400),
    },
  };
}
