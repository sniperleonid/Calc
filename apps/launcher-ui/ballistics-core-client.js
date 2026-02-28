function detectAmmoType(projectileId = '') {
  const normalized = String(projectileId).toUpperCase();
  if (normalized.includes('SMOKE')) return 'SMOKE';
  if (normalized.includes('ILLUM')) return 'ILLUM';
  return 'HE';
}

export async function computeFireSolution(input) {
  const [profileId, projectileId] = String(input.weaponId || '').split('/');
  if (!profileId || !projectileId) {
    throw new Error('Invalid weaponId, expected <gun>/<projectile>.');
  }

  const payload = {
    mission_id: `mission-${Date.now()}`,
    shooter: {
      x: Number(input.gunPos?.x ?? 0),
      y: Number(input.gunPos?.y ?? 0),
    },
    target: {
      x: Number(input.targetPos?.x ?? 0),
      y: Number(input.targetPos?.y ?? 0),
    },
    shooter_alt_m: Number(input.gunPos?.z ?? 0),
    target_alt_m: Number(input.targetPos?.z ?? 0),
    weather: {
      temperature_c: 15,
      pressure_hpa: 1013.25,
      humidity_pct: 50,
      wind_speed_ms: Number(input.wind?.speedMps ?? 0),
      wind_direction_deg: Number(input.wind?.fromDeg ?? 0),
    },
    ammo_type: projectileId,
    charge: 1,
    barrel_profile_id: profileId,
    ammo_category: detectAmmoType(projectileId),
  };

  const response = await fetch('/api/ballistics-core/solve-fire-mission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Ballistics core request failed: ${response.status}`);
  }

  const body = await response.json();
  const solution = body?.solution;
  if (!solution) {
    throw new Error('Ballistics core returned empty solution.');
  }

  return {
    chargeId: String(payload.charge),
    elevMil: Number(solution.elevation_mils),
    azimuthDeg: Number(solution.azimuth_deg),
    tofSec: Number(solution.flight_time_s),
    driftMeters: Number(solution.drift_m),
    missDistance: 0,
    arcType: 'CORE',
  };
}
