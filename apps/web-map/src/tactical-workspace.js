function makeIdGenerator(prefix = 'entity') {
  let counter = 1;
  return () => `${prefix}-${counter++}`;
}

function clampAngle(angle) {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function isAngleInsideSector(angle, sectorStart, sectorEnd) {
  const value = clampAngle(angle);
  const start = clampAngle(sectorStart);
  const end = clampAngle(sectorEnd);
  if (start <= end) {
    return value >= start && value <= end;
  }
  return value >= start || value <= end;
}

function interpolateByRange(rangeTable, distance) {
  if (!Array.isArray(rangeTable) || rangeTable.length === 0) {
    throw new Error('Ballistic range table is empty');
  }

  const sorted = [...rangeTable].sort((a, b) => a.range - b.range);
  if (distance <= sorted[0].range) {
    return { ...sorted[0], interpolation: 'clamped-min' };
  }

  const last = sorted[sorted.length - 1];
  if (distance >= last.range) {
    return { ...last, interpolation: 'clamped-max' };
  }

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const left = sorted[index];
    const right = sorted[index + 1];
    if (distance >= left.range && distance <= right.range) {
      const ratio = (distance - left.range) / (right.range - left.range);
      return {
        range: distance,
        elevation: left.elevation + (right.elevation - left.elevation) * ratio,
        tof: left.tof + (right.tof - left.tof) * ratio,
        dElev: left.dElev + ((right.dElev ?? left.dElev ?? 0) - (left.dElev ?? 0)) * ratio,
        tofPer100m:
          (left.tofPer100m ?? 0) + ((right.tofPer100m ?? left.tofPer100m ?? 0) - (left.tofPer100m ?? 0)) * ratio,
        interpolation: 'linear',
      };
    }
  }

  return { ...last, interpolation: 'fallback-max' };
}

function buildSectorEnvelope({ gun, charge, bearing }) {
  const minRange = charge.minRange ?? 0;
  const maxRange = charge.maxRange ?? 0;
  const step = 6;
  const points = [];
  for (let degree = 0; degree <= 360; degree += step) {
    const angle = clampAngle(gun.heading + degree);
    if (!isAngleInsideSector(angle, gun.sectorStart, gun.sectorEnd)) {
      continue;
    }

    const radians = (angle * Math.PI) / 180;
    const x1 = gun.position.x + Math.cos(radians) * minRange;
    const y1 = gun.position.y + Math.sin(radians) * minRange;
    const x2 = gun.position.x + Math.cos(radians) * maxRange;
    const y2 = gun.position.y + Math.sin(radians) * maxRange;
    points.push({ angle, min: { x: x1, y: y1 }, max: { x: x2, y: y2 } });
  }

  return {
    center: { ...gun.position },
    heading: gun.heading,
    targetBearing: clampAngle(bearing),
    inSector: isAngleInsideSector(bearing, gun.sectorStart, gun.sectorEnd),
    sectorStart: gun.sectorStart,
    sectorEnd: gun.sectorEnd,
    minRange,
    maxRange,
    points,
  };
}

function buildTrajectory({ distance, heightDifference, elevationMil, steps = 12 }) {
  const results = [];
  const peak = Math.max(0, distance * 0.23 + heightDifference * 0.5);

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const x = distance * t;
    const arc = 4 * peak * t * (1 - t);
    const linear = heightDifference * t;
    results.push({
      x,
      y: arc + linear,
      t,
      elevationMil,
    });
  }

  return results;
}

class UnitModule {
  constructor({ moduleId, createId }) {
    this.moduleId = moduleId;
    this.createId = createId;
    this.entities = new Map();
  }

  upsertManual(input) {
    const id = input.id ?? this.createId();
    const entity = {
      id,
      name: input.name ?? id,
      type: input.type ?? this.moduleId,
      position: input.position ?? null,
      notes: input.notes ?? '',
      source: 'manual',
      ...input,
    };

    this.entities.set(id, entity);
    return { ...entity };
  }

  placeOnMap(input) {
    if (!input.position) {
      throw new Error(`Map placement for ${this.moduleId} requires position`);
    }

    return this.upsertManual({
      ...input,
      source: 'map',
    });
  }

  remove(id) {
    return this.entities.delete(id);
  }

  list() {
    return [...this.entities.values()].map((item) => ({ ...item }));
  }

  restore(items = []) {
    this.entities.clear();
    for (const item of items) {
      this.entities.set(item.id, { ...item });
    }
  }
}

class BallisticsModule extends UnitModule {
  constructor(options) {
    super({ ...options, moduleId: 'ballistics' });
    this.projectiles = new Map();
    this.tableBindings = new Map();
    this.calibration = { defaultElevationOffsetMil: 0, byGunId: {} };
  }

  upsertManual(input) {
    const prepared = {
      heading: input.heading ?? 0,
      sectorStart: input.sectorStart ?? 0,
      sectorEnd: input.sectorEnd ?? 360,
      minElevationMil: input.minElevationMil ?? 600,
      maxElevationMil: input.maxElevationMil ?? 1600,
      projectiles: input.projectiles ?? [],
      ...input,
    };

    return super.upsertManual(prepared);
  }

  registerProjectile(projectile) {
    if (!projectile?.id) {
      throw new Error('Projectile id is required');
    }

    const profile = {
      id: projectile.id,
      label: projectile.label ?? projectile.id,
      shellType: projectile.shellType ?? 'HE',
      charges: projectile.charges ?? [],
      dragModel: projectile.dragModel ?? null,
      windDriftFactor: projectile.windDriftFactor ?? 0,
    };

    this.projectiles.set(profile.id, profile);
    return { ...profile, charges: profile.charges.map((charge) => ({ ...charge })) };
  }

  bindProjectileToGun({ gunId, projectileId }) {
    const gun = this.entities.get(gunId);
    if (!gun) {
      throw new Error(`Gun not found: ${gunId}`);
    }

    if (!this.projectiles.has(projectileId)) {
      throw new Error(`Projectile not found: ${projectileId}`);
    }

    const set = new Set(gun.projectiles ?? []);
    set.add(projectileId);
    gun.projectiles = [...set];
    this.entities.set(gunId, gun);
    return [...gun.projectiles];
  }

  bindTableToProjectile({ projectileId, chargeLevel, table }) {
    if (!this.projectiles.has(projectileId)) {
      throw new Error(`Projectile not found: ${projectileId}`);
    }

    const key = `${projectileId}:${chargeLevel}`;
    const storedTable = (table ?? []).map((row) => ({ ...row }));
    this.tableBindings.set(key, storedTable);

    const projectile = this.projectiles.get(projectileId);
    projectile.charges = projectile.charges.filter((charge) => charge.level !== chargeLevel);
    projectile.charges.push({
      level: chargeLevel,
      minRange: Math.min(...storedTable.map((row) => row.range)),
      maxRange: Math.max(...storedTable.map((row) => row.range)),
      rangeTable: storedTable,
    });

    return storedTable.length;
  }

  setCalibration({ defaultElevationOffsetMil = 0, byGunId = {} }) {
    this.calibration = {
      defaultElevationOffsetMil,
      byGunId: { ...byGunId },
      updatedAt: new Date().toISOString(),
    };
    return this.getCalibration();
  }

  getCalibration() {
    return {
      defaultElevationOffsetMil: this.calibration.defaultElevationOffsetMil ?? 0,
      byGunId: { ...(this.calibration.byGunId ?? {}) },
      updatedAt: this.calibration.updatedAt ?? null,
    };
  }

  calculateGunSolution({ gunId, projectileId, distance, bearing, heightDifference = 0, wind = { speed: 0, direction: 0 } }) {
    const gun = this.entities.get(gunId);
    if (!gun) {
      throw new Error(`Gun not found: ${gunId}`);
    }

    if (!gun.projectiles?.includes(projectileId)) {
      throw new Error(`Projectile ${projectileId} is not linked to gun ${gunId}`);
    }

    const projectile = this.projectiles.get(projectileId);
    if (!projectile) {
      throw new Error(`Projectile not found: ${projectileId}`);
    }

    const availableCharge = projectile.charges
      .filter((charge) => distance >= charge.minRange && distance <= charge.maxRange)
      .sort((left, right) => left.maxRange - right.maxRange)[0];

    if (!availableCharge) {
      return {
        gunId,
        projectileId,
        inRange: false,
        reason: 'distance-out-of-range',
      };
    }

    const base = interpolateByRange(availableCharge.rangeTable, distance);
    const heightCorrectionMil = ((base.dElev ?? 0) * heightDifference) / 100;
    const tofCorrection = ((base.tofPer100m ?? 0) * heightDifference) / 100;
    const windRad = ((wind.direction ?? 0) * Math.PI) / 180;
    const fireRad = ((bearing ?? 0) * Math.PI) / 180;
    const crosswind = (wind.speed ?? 0) * Math.sin(windRad - fireRad);
    const windCorrectionMil = crosswind * (projectile.windDriftFactor ?? 0.2);
    const calibrationOffset = (this.calibration.byGunId?.[gunId] ?? this.calibration.defaultElevationOffsetMil ?? 0);

    const elevation = base.elevation + heightCorrectionMil + windCorrectionMil + calibrationOffset;
    const inElevationLimits = elevation >= gun.minElevationMil && elevation <= gun.maxElevationMil;
    const sectorEnvelope = buildSectorEnvelope({ gun, charge: availableCharge, bearing });
    const trajectory = buildTrajectory({ distance, heightDifference, elevationMil: elevation });

    return {
      gunId,
      projectileId,
      inRange: true,
      inSector: sectorEnvelope.inSector,
      inElevationLimits,
      chargeLevel: availableCharge.level,
      elevationMil: elevation,
      azimuth: clampAngle(bearing),
      timeOfFlight: base.tof + tofCorrection,
      corrections: {
        heightMil: heightCorrectionMil,
        windMil: windCorrectionMil,
        calibrationMil: calibrationOffset,
        tofSeconds: tofCorrection,
      },
      envelope: sectorEnvelope,
      trajectory,
    };
  }

  calculateBatterySolutions({ assignments, distance, bearing, heightDifference = 0, wind = { speed: 0, direction: 0 } }) {
    return assignments.map((assignment) => ({
      gunId: assignment.gunId,
      projectileId: assignment.projectileId,
      solution: this.calculateGunSolution({
        gunId: assignment.gunId,
        projectileId: assignment.projectileId,
        distance,
        bearing,
        heightDifference,
        wind,
      }),
    }));
  }

  listProjectiles() {
    return [...this.projectiles.values()].map((projectile) => ({
      ...projectile,
      charges: projectile.charges.map((charge) => ({
        ...charge,
        rangeTable: charge.rangeTable.map((row) => ({ ...row })),
      })),
    }));
  }

  toSnapshot() {
    return {
      guns: this.list(),
      projectiles: this.listProjectiles(),
      calibration: this.getCalibration(),
    };
  }

  restore(snapshot = {}) {
    super.restore(snapshot.guns ?? []);
    this.projectiles.clear();
    for (const projectile of snapshot.projectiles ?? []) {
      this.projectiles.set(projectile.id, {
        ...projectile,
        charges: (projectile.charges ?? []).map((charge) => ({
          ...charge,
          rangeTable: (charge.rangeTable ?? []).map((row) => ({ ...row })),
        })),
      });
    }
    this.calibration = snapshot.calibration
      ? {
          defaultElevationOffsetMil: snapshot.calibration.defaultElevationOffsetMil ?? 0,
          byGunId: { ...(snapshot.calibration.byGunId ?? {}) },
          updatedAt: snapshot.calibration.updatedAt ?? null,
        }
      : { defaultElevationOffsetMil: 0, byGunId: {} };
  }
}

class MapModule {
  constructor() {
    this.mapAsset = null;
    this.calibration = null;
    this.markers = [];
    this.tools = [];
  }

  calibrateByThreePoints({ p0, p1, p2, knownP0, scaleMeters }) {
    if (!p0 || !p1 || !p2 || !knownP0 || !Number.isFinite(scaleMeters) || scaleMeters <= 0) {
      throw new Error('Three-point calibration requires p0, p1, p2, knownP0 and scaleMeters');
    }

    const rulerDx = p2.mapX - p1.mapX;
    const rulerDy = p2.mapY - p1.mapY;
    const rulerPixels = Math.hypot(rulerDx, rulerDy);
    if (!Number.isFinite(rulerPixels) || rulerPixels === 0) {
      throw new Error('P1/P2 ruler points must have non-zero distance');
    }

    const metersPerPixel = scaleMeters / rulerPixels;
    const angleRad = Math.atan2(rulerDy, rulerDx);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const model = {
      metersPerPixel,
      angleRad,
      originMapX: p0.mapX,
      originMapY: p0.mapY,
      originWorldX: knownP0.gameX,
      originWorldY: knownP0.gameY,
      transform: {
        a: cos * metersPerPixel,
        b: -sin * metersPerPixel,
        c: sin * metersPerPixel,
        d: cos * metersPerPixel,
      },
    };

    return this.setCalibration({
      controlPoints: [
        { id: 'P0', ...p0, gameX: knownP0.gameX, gameY: knownP0.gameY },
        { id: 'P1', ...p1 },
        { id: 'P2', ...p2 },
      ],
      model,
    });
  }

  loadMap({ assetId, fileName, width, height }) {
    this.mapAsset = {
      assetId,
      fileName,
      width,
      height,
      loadedAt: new Date().toISOString(),
    };
    return { ...this.mapAsset };
  }

  setCalibration({ controlPoints, model }) {
    if (!controlPoints?.length || !model) {
      throw new Error('Calibration requires control points and model');
    }

    this.calibration = {
      controlPoints: controlPoints.map((point) => ({ ...point })),
      model: { ...model },
      calibratedAt: new Date().toISOString(),
    };
    return this.getCalibration();
  }

  getCalibration() {
    return this.calibration
      ? {
          controlPoints: this.calibration.controlPoints.map((point) => ({ ...point })),
          model: { ...this.calibration.model },
          calibratedAt: this.calibration.calibratedAt,
        }
      : null;
  }

  addMarker(marker) {
    if (!marker.position) {
      throw new Error('Marker requires position');
    }

    const entity = {
      id: marker.id ?? `marker-${this.markers.length + 1}`,
      title: marker.title ?? 'Метка',
      category: marker.category ?? 'general',
      position: { ...marker.position },
      payload: marker.payload ?? {},
    };

    this.markers.push(entity);
    return { ...entity, position: { ...entity.position }, payload: { ...entity.payload } };
  }

  enableTool(tool) {
    const state = {
      id: tool.id,
      label: tool.label,
      enabled: tool.enabled ?? true,
    };

    this.tools = this.tools.filter((item) => item.id !== tool.id);
    this.tools.push(state);
    return { ...state };
  }

  toSnapshot() {
    return {
      mapAsset: this.mapAsset ? { ...this.mapAsset } : null,
      calibration: this.getCalibration(),
      markers: this.markers.map((item) => ({
        ...item,
        position: { ...item.position },
        payload: { ...item.payload },
      })),
      tools: this.tools.map((item) => ({ ...item })),
    };
  }

  restore(snapshot = {}) {
    this.mapAsset = snapshot.mapAsset ? { ...snapshot.mapAsset } : null;
    this.calibration = snapshot.calibration
      ? {
          calibratedAt: snapshot.calibration.calibratedAt,
          model: { ...snapshot.calibration.model },
          controlPoints: snapshot.calibration.controlPoints.map((point) => ({ ...point })),
        }
      : null;
    this.markers = (snapshot.markers ?? []).map((item) => ({
      ...item,
      position: { ...item.position },
      payload: { ...(item.payload ?? {}) },
    }));
    this.tools = (snapshot.tools ?? []).map((item) => ({ ...item }));
  }
}

export class TacticalWorkspace {
  constructor({ missionId, idGenerator = makeIdGenerator('unit'), profileStorage = null }) {
    this.missionId = missionId;
    this.profileStorage = profileStorage;
    this.modules = {
      ballistics: new BallisticsModule({ createId: idGenerator }),
      batteries: new UnitModule({ moduleId: 'batteries', createId: idGenerator }),
      targets: new UnitModule({ moduleId: 'targets', createId: idGenerator }),
      observers: new UnitModule({ moduleId: 'observers', createId: idGenerator }),
      logistics: new UnitModule({ moduleId: 'logistics', createId: idGenerator }),
      infantry: new UnitModule({ moduleId: 'infantry', createId: idGenerator }),
      map: new MapModule(),
    };
  }

  getModule(name) {
    const moduleRef = this.modules[name];
    if (!moduleRef) {
      throw new Error(`Unknown module: ${name}`);
    }

    return moduleRef;
  }

  saveMission() {
    return {
      missionId: this.missionId,
      savedAt: new Date().toISOString(),
      modules: {
        ballistics: this.modules.ballistics.toSnapshot(),
        batteries: this.modules.batteries.list(),
        targets: this.modules.targets.list(),
        observers: this.modules.observers.list(),
        logistics: this.modules.logistics.list(),
        infantry: this.modules.infantry.list(),
        map: this.modules.map.toSnapshot(),
      },
    };
  }

  loadMission(snapshot) {
    if (!snapshot?.modules) {
      throw new Error('Mission snapshot is invalid');
    }

    this.missionId = snapshot.missionId ?? this.missionId;
    this.modules.ballistics.restore(snapshot.modules.ballistics);
    this.modules.batteries.restore(snapshot.modules.batteries);
    this.modules.targets.restore(snapshot.modules.targets);
    this.modules.observers.restore(snapshot.modules.observers);
    this.modules.logistics.restore(snapshot.modules.logistics);
    this.modules.infantry.restore(snapshot.modules.infantry);
    this.modules.map.restore(snapshot.modules.map);
    return this.saveMission();
  }

  saveCalibrationPreset() {
    const calibration = this.modules.map.getCalibration();
    if (!calibration) {
      throw new Error('Calibration is not configured');
    }

    return {
      missionId: this.missionId,
      calibration,
      savedAt: new Date().toISOString(),
    };
  }

  loadCalibrationPreset(preset) {
    if (!preset?.calibration) {
      throw new Error('Calibration preset is invalid');
    }

    this.modules.map.restore({
      ...this.modules.map.toSnapshot(),
      calibration: preset.calibration,
    });
    return this.modules.map.getCalibration();
  }

  async saveMapProfile(profileName) {
    if (!this.profileStorage) {
      throw new Error('Map profile storage is not configured');
    }
    const payload = {
      missionId: this.missionId,
      map: this.modules.map.toSnapshot(),
      ballistics: {
        guns: this.modules.ballistics.list(),
      },
      batteries: this.modules.batteries.list(),
      targets: this.modules.targets.list(),
      observers: this.modules.observers.list(),
      savedAt: new Date().toISOString(),
    };
    return this.profileStorage.saveProfile(profileName, payload);
  }

  async loadMapProfile(profileName) {
    if (!this.profileStorage) {
      throw new Error('Map profile storage is not configured');
    }
    const payload = await this.profileStorage.loadProfile(profileName);
    this.modules.map.restore(payload.map ?? {});
    this.modules.ballistics.restore({ guns: payload.ballistics?.guns ?? [] });
    this.modules.batteries.restore(payload.batteries ?? []);
    this.modules.targets.restore(payload.targets ?? []);
    this.modules.observers.restore(payload.observers ?? []);
    return payload;
  }

  buildUiSchema() {
    return {
      missionId: this.missionId,
      panels: [
        {
          id: 'ballistics-input',
          title: 'Орудия и баллистика',
          module: 'ballistics',
          supports: [
            'manual',
            'map-placement',
            'projectile-binding',
            'charge-table-binding',
            'trajectory-visualization',
            'calibration-adjustment',
          ],
        },
        { id: 'battery-input', title: 'Батареи', module: 'batteries', supports: ['manual', 'map-placement'] },
        { id: 'target-input', title: 'Цели', module: 'targets', supports: ['manual', 'map-placement'] },
        { id: 'observer-input', title: 'Наблюдатели', module: 'observers', supports: ['manual', 'map-placement'] },
        { id: 'logistics-input', title: 'Логистика', module: 'logistics', supports: ['manual', 'map-placement'] },
        { id: 'infantry-input', title: 'Пехота', module: 'infantry', supports: ['manual', 'map-placement'] },
        {
          id: 'map-controls',
          title: 'Карта и калибровка',
          module: 'map',
          supports: ['map-upload', 'calibration-save-load', 'calibration-3-point', 'mission-save-load', 'map-profile-save-load'],
        },
      ],
    };
  }
}
