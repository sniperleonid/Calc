import { normalizeWeaponProfile } from './weapon-schema.js';

const cache = new Map();

function estimateVelocityByCharge(table, charge) {
  const elev = table.elevMil || table.byCharge?.[charge]?.elevationMil || [];
  const range = table.byCharge?.[charge]?.range || [];
  const valid = [];
  for (let i = 0; i < Math.min(elev.length, range.length); i += 1) {
    const r = range[i];
    const theta = (elev[i] * 2 * Math.PI) / 6400;
    const s = Math.sin(2 * theta);
    if (r > 100 && Math.abs(s) > 0.05) {
      valid.push(Math.sqrt((r * 9.81) / s));
    }
  }
  if (!valid.length) return 200;
  valid.sort((a, b) => a - b);
  return valid[Math.floor(valid.length / 2)];
}

export async function getWeapon(weaponId) {
  if (cache.has(weaponId)) return cache.get(weaponId);
  const response = await fetch(`/api/ballistics/weapon?weaponId=${encodeURIComponent(weaponId)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Weapon not found in tables catalog: ${weaponId}`);
  const payload = await response.json();
  const normalized = normalizeWeaponProfile(payload);

  if ((!normalized.charges || !normalized.charges.length) && payload.primaryTable) {
    const charges = payload.primaryTable.charges || [];
    normalized.charges = charges.map((chargeId) => ({
      id: String(chargeId),
      muzzleVel: estimateVelocityByCharge(payload.primaryTable, String(chargeId)),
    }));
    normalized.massKg = payload.primaryTable.meta?.massKg || normalized.massKg;
    normalized.dragCoeff = payload.primaryTable.meta?.dragCoeff || normalized.dragCoeff;
  }

  cache.set(weaponId, normalized);
  return normalized;
}
