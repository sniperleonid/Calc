export type Role = 'Commander' | 'Gunner' | 'Observer' | 'Logistics';

export interface GunType {
  id: string;
  name: string;
  caliberMm: number;
  maxRangeM: number;
  minElevationMil?: number;
  maxElevationMil?: number;
}

export interface Target {
  id: string;
  latitude: number;
  longitude: number;
  altitudeM?: number;
  priority: 'low' | 'medium' | 'high';
  description?: string;
}

export interface SalvoRequest {
  salvoId: string;
  gunId: string;
  targetId: string;
  rounds: number;
  charge: number;
  requestedAt: string; // ISO-8601
  requestedBy: Role;
}

export interface Correction {
  correctionId: string;
  salvoId: string;
  observerId: string;
  deltaRangeM: number;
  deltaAzimuthMil: number;
  note?: string;
  createdAt: string; // ISO-8601
}

export interface CrewStatus {
  gunId: string;
  crewReady: boolean;
  ammoAvailable: number;
  health: 'ok' | 'degraded' | 'offline';
  lastUpdateAt: string; // ISO-8601
}
