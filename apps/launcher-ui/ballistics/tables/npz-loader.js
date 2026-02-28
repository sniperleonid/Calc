export function mapNpzToBallisticTable(npzArrays) {
  const elevMil = npzArrays.elev_mil ?? npzArrays.elevMil ?? [];
  const charges = (npzArrays.charges_id ?? npzArrays.charges ?? []).map((c) => String(c));
  const byCharge = {};
  for (const charge of charges) {
    byCharge[charge] = {
      range: npzArrays[`range_c${charge}`] ?? npzArrays.byCharge?.[charge]?.range ?? [],
      elevationMil: elevMil,
      tof: npzArrays[`tof_c${charge}`] ?? npzArrays.byCharge?.[charge]?.tof ?? null,
      dElev: npzArrays[`delev_c${charge}`] ?? null,
      tofPer100m: npzArrays[`tofPer100m_c${charge}`] ?? null,
    };
  }
  return {
    format: npzArrays.format ?? 'legacy-npz',
    elevMil,
    charges,
    byCharge,
    meta: {
      dragCoeff: Number(npzArrays.meta_air_drag?.[0] ?? npzArrays.meta?.dragCoeff),
      massKg: Number(npzArrays.meta_mass?.[0] ?? npzArrays.meta?.massKg),
    },
  };
}

export async function loadNpzFromArrayBuffer() {
  throw new Error('Direct NPZ decode is not available in browser runtime; use /api/ballistics/table endpoint.');
}
