import { rk4Step } from './rk4.js';
import { hypot3 } from './units.js';

export function simulateTrajectory({
  muzzleVel,
  elevationRad,
  azimuthRad = 0,
  dragCoeff,
  massKg,
  wind = { x: 0, y: 0, z: 0 },
  dt = 0.02,
  ttl = 60,
  stopOnGround = true,
}) {
  const vx0 = muzzleVel * Math.cos(elevationRad) * Math.cos(azimuthRad);
  const vy0 = muzzleVel * Math.sin(elevationRad);
  const vz0 = muzzleVel * Math.cos(elevationRad) * Math.sin(azimuthRad);
  let state = [0, 0, 0, vx0, vy0, vz0];
  let t = 0;
  let prevVy = vy0;
  let maxHeight = 0;
  const points = [{ t, x: 0, y: 0, z: 0 }];
  const g = 9.81;

  const derivs = ([x, y, z, vx, vy, vz]) => {
    const rvx = vx - wind.x;
    const rvy = vy - wind.y;
    const rvz = vz - wind.z;
    const relSpeed = Math.hypot(rvx, rvy, rvz);
    const k = (dragCoeff || 0) / Math.max(0.001, massKg || 1);
    const axDrag = -k * relSpeed * rvx;
    const ayDrag = -k * relSpeed * rvy;
    const azDrag = -k * relSpeed * rvz;
    return [vx, vy, vz, axDrag, ayDrag - g, azDrag];
  };

  while (t < ttl) {
    const next = rk4Step(state, dt, derivs);
    t += dt;
    const [, y, , , vy] = next;
    if (y > maxHeight) maxHeight = y;
    points.push({ t, x: next[0], y: next[1], z: next[2] });

    const descending = vy <= 0 || prevVy <= 0;
    if (stopOnGround && descending && y < 0) break;
    prevVy = vy;
    state = next;
  }

  return { points, tofSec: points.at(-1)?.t ?? 0, maxHeight };
}

export function closestApproach(traj, targetX, targetY, targetZ) {
  let best = { distance: Infinity, t: 0, x: 0, y: 0, z: 0 };
  const pts = traj.points || [];
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    const d = hypot3(p.x - targetX, p.y - targetY, p.z - targetZ);
    if (d < best.distance) best = { distance: d, ...p };
    if (i === 0) continue;
    const a = pts[i - 1];
    const ab = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z, t: p.t - a.t };
    const at = { x: targetX - a.x, y: targetY - a.y, z: targetZ - a.z };
    const len2 = ab.x ** 2 + ab.y ** 2 + ab.z ** 2;
    if (!len2) continue;
    const u = Math.max(0, Math.min(1, (at.x * ab.x + at.y * ab.y + at.z * ab.z) / len2));
    const ip = { x: a.x + ab.x * u, y: a.y + ab.y * u, z: a.z + ab.z * u, t: a.t + ab.t * u };
    const id = hypot3(ip.x - targetX, ip.y - targetY, ip.z - targetZ);
    if (id < best.distance) best = { distance: id, ...ip };
  }
  return best;
}

export function impactAtGround(traj) {
  const pts = traj.points || [];
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    if (a.y >= 0 && b.y <= 0) {
      const u = (0 - a.y) / ((b.y - a.y) || 1);
      return {
        t: a.t + (b.t - a.t) * u,
        x: a.x + (b.x - a.x) * u,
        y: 0,
        z: a.z + (b.z - a.z) * u,
      };
    }
  }
  return null;
}
