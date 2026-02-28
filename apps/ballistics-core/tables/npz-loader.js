function derivePer100m(values, ranges, index) {
  const left = Math.max(0, index - 1);
  const right = Math.min(values.length - 1, index + 1);
  if (left === right) return undefined;
  const dv = Number(values[right]) - Number(values[left]);
  const dr = Number(ranges[right]) - Number(ranges[left]);
  if (!Number.isFinite(dv) || !Number.isFinite(dr) || dr === 0) return undefined;
  return (dv / dr) * 100;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildRows(range, elevationMil, tof, dElev, tofPer100m) {
  const size = Math.min(range.length, elevationMil.length);
  const rows = [];
  for (let i = 0; i < size; i += 1) {
    rows.push({
      range: Number(range[i]),
      elevation: Number(elevationMil[i]),
      tof: Number(tof[i]),
      dElev: Number.isFinite(Number(dElev[i])) ? Number(dElev[i]) : derivePer100m(elevationMil, range, i),
      tofPer100m: Number.isFinite(Number(tofPer100m[i])) ? Number(tofPer100m[i]) : derivePer100m(tof, range, i),
    });
  }
  return rows;
}

export function mapNpzToBallisticTable(npzArrays) {
  if (Array.isArray(npzArrays?.charges) && npzArrays?.byCharge) {
    const byCharge = {};
    for (const charge of npzArrays.charges) {
      const chargeId = String(charge);
      const source = npzArrays.byCharge[chargeId] ?? {};
      const range = ensureArray(source.range);
      const elevationMil = ensureArray(source.elevationMil ?? npzArrays.elevMil);
      const tof = ensureArray(source.tof);
      const dElev = ensureArray(source.dElev);
      const tofPer100m = ensureArray(source.tofPer100m);
      byCharge[chargeId] = {
        range,
        elevationMil,
        tof,
        dElev,
        tofPer100m,
        rangeTable: source.rangeTable?.length
          ? source.rangeTable
          : buildRows(range, elevationMil, tof, dElev, tofPer100m),
      };
    }
    return {
      format: npzArrays.format ?? 'legacy-npz',
      elevMil: ensureArray(npzArrays.elevMil),
      charges: npzArrays.charges.map((c) => String(c)),
      byCharge,
      meta: {
        dragCoeff: Number(npzArrays.meta?.dragCoeff),
        massKg: Number(npzArrays.meta?.massKg),
      },
    };
  }

  const elevMil = ensureArray(npzArrays.elev_mil ?? npzArrays.elevMil);
  const charges = ensureArray(npzArrays.charges_id ?? npzArrays.charges).map((c) => String(c));
  const byCharge = {};
  for (const charge of charges) {
    const range = ensureArray(npzArrays[`range_c${charge}`] ?? npzArrays.byCharge?.[charge]?.range);
    const elevationMil = ensureArray(npzArrays.byCharge?.[charge]?.elevationMil ?? elevMil);
    const tof = ensureArray(npzArrays[`tof_c${charge}`] ?? npzArrays.byCharge?.[charge]?.tof);
    const dElev = ensureArray(npzArrays[`delev_c${charge}`] ?? npzArrays.byCharge?.[charge]?.dElev);
    const tofPer100m = ensureArray(npzArrays[`tofPer100m_c${charge}`] ?? npzArrays.byCharge?.[charge]?.tofPer100m);
    byCharge[charge] = {
      range,
      elevationMil,
      tof,
      dElev,
      tofPer100m,
      rangeTable: buildRows(range, elevationMil, tof, dElev, tofPer100m),
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
