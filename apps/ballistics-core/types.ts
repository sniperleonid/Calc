export type ArcType = 'DIRECT' | 'LOW' | 'HIGH' | 'AUTO';

export interface WorldPos { x: number; y: number; z: number }

export interface SolveRequest {
  gunPos: WorldPos;
  targetPos: WorldPos;
  wind?: { speedMps: number; fromDeg: number };
  arc?: ArcType;
  toleranceMeters?: number;
  dt?: number;
  ttl?: number;
  weaponId: string;
}

export interface FireSolution {
  chargeId: string;
  elevMil: number;
  azimuthDeg: number;
  tofSec: number;
  muzzleVel: number;
  driftMeters: number;
  impactX: number;
  impactY: number;
  impactZ: number;
  missDistance: number;
  arcType: Exclude<ArcType, 'AUTO'>;
}
