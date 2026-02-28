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

function normalizeTrajectoryVariant(value) {
  const normalized = String(value ?? 'standard').toLowerCase();
  if (['direct', 'flat'].includes(normalized)) return 'direct';
  if (['low', 'low_angle', 'low-angle'].includes(normalized)) return 'low';
  if (['high', 'high_angle', 'high-angle'].includes(normalized)) return 'high';
  return 'standard';
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

    // Arma Reforger ground grid: x=EAST, y=NORTH, 0° points to NORTH.
    // Convert bearing to unit vector where ux=sin(a), uy=cos(a).
    const radians = (angle * Math.PI) / 180;
    const ux = Math.sin(radians);
    const uy = Math.cos(radians);
    const x1 = gun.position.x + ux * minRange;
    const y1 = gun.position.y + uy * minRange;
    const x2 = gun.position.x + ux * maxRange;
    const y2 = gun.position.y + uy * maxRange;
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

function segmentCircleIntersection({ start, end, center, radius }) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return Math.hypot(start.x - center.x, start.y - center.y) <= radius;
  }

  const t = Math.max(0, Math.min(1, ((center.x - start.x) * dx + (center.y - start.y) * dy) / lengthSquared));
  const closestX = start.x + dx * t;
  const closestY = start.y + dy * t;
  return Math.hypot(closestX - center.x, closestY - center.y) <= radius;
}

function pointInPolygon(point, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;

    const intersects = yi > point.y !== yj > point.y
      && point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function ccw(a, b, c) {
  return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

function segmentsIntersect(startA, endA, startB, endB) {
  return ccw(startA, startB, endB) !== ccw(endA, startB, endB)
    && ccw(startA, endA, startB) !== ccw(startA, endA, endB);
}

function segmentPolygonIntersection({ start, end, vertices }) {
  if (!Array.isArray(vertices) || vertices.length < 3) {
    return false;
  }

  if (pointInPolygon(start, vertices) || pointInPolygon(end, vertices)) {
    return true;
  }

  for (let i = 0; i < vertices.length; i += 1) {
    const edgeStart = vertices[i];
    const edgeEnd = vertices[(i + 1) % vertices.length];
    if (segmentsIntersect(start, end, edgeStart, edgeEnd)) {
      return true;
    }
  }

  return false;
}

class SafetyDataModule {
  constructor({ createId }) {
    this.createId = createId;
    this.noFireAreas = new Map();
    this.settings = {
      cancelFireOnNfaHit: true,
      skipNfaInLinearPattern: true,
    };
  }

  addNoFireArea(input) {
    const hasCircle = input?.center && Number.isFinite(input.radius) && input.radius > 0;
    const hasPolygon = Array.isArray(input?.vertices) && input.vertices.length >= 3;
    if (!hasCircle && !hasPolygon) {
      throw new Error('NFA requires either center/radius or polygon vertices');
    }

    const id = input.id ?? this.createId();
    const zone = {
      id,
      name: input.name ?? `NFA ${id}`,
      shape: hasPolygon ? 'polygon' : 'circle',
      center: hasCircle ? { ...input.center } : null,
      radius: hasCircle ? input.radius : null,
      vertices: hasPolygon ? input.vertices.map((point) => ({ ...point })) : [],
      notes: input.notes ?? '',
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    this.noFireAreas.set(id, zone);
    return { ...zone, center: { ...zone.center } };
  }

  removeNoFireArea(id) {
    return this.noFireAreas.delete(id);
  }

  listNoFireAreas() {
    return [...this.noFireAreas.values()].map((zone) => ({
      ...zone,
      center: zone.center ? { ...zone.center } : null,
      vertices: (zone.vertices ?? []).map((point) => ({ ...point })),
    }));
  }

  configure(settings = {}) {
    this.settings = {
      ...this.settings,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    return this.getSettings();
  }

  getSettings() {
    return { ...this.settings };
  }

  assessTrajectory({ start, end, patternMode = 'single' }) {
    const impacted = this.listNoFireAreas().filter((zone) => {
      if (zone.shape === 'polygon') {
        return segmentPolygonIntersection({ start, end, vertices: zone.vertices });
      }
      return segmentCircleIntersection({ start, end, center: zone.center, radius: zone.radius });
    });

    const hasViolation = impacted.length > 0;
    return {
      hasViolation,
      warning: hasViolation ? 'Trajectory intersects No Fire Area (NFA)' : null,
      action: !hasViolation
        ? 'allow'
        : this.settings.cancelFireOnNfaHit
          ? 'cancel-fire'
          : patternMode === 'linear' && this.settings.skipNfaInLinearPattern
            ? 'skip-nfa-segment'
            : 'warn-only',
      canOverride: hasViolation,
      impactedZones: impacted,
    };
  }

  filterLinearPatternSegments(segments = []) {
    return segments.map((segment) => {
      const decision = this.assessTrajectory({
        start: segment.start,
        end: segment.end,
        patternMode: 'linear',
      });
      return {
        ...segment,
        safety: decision,
        skipped: decision.action === 'skip-nfa-segment',
      };
    });
  }

  resetAllData({ keepBallisticTables = true }) {
    this.noFireAreas.clear();
    this.settings = {
      cancelFireOnNfaHit: true,
      skipNfaInLinearPattern: true,
      keepBallisticTables,
      resetAt: new Date().toISOString(),
    };
    return this.getSettings();
  }

  toSnapshot() {
    return {
      noFireAreas: this.listNoFireAreas(),
      settings: this.getSettings(),
    };
  }

  restore(snapshot = {}) {
    this.noFireAreas.clear();
    for (const zone of snapshot.noFireAreas ?? []) {
      this.noFireAreas.set(zone.id, {
        ...zone,
        shape: zone.shape ?? 'circle',
        center: zone.center ? { ...zone.center } : null,
        vertices: (zone.vertices ?? []).map((point) => ({ ...point })),
      });
    }
    this.settings = {
      cancelFireOnNfaHit: true,
      skipNfaInLinearPattern: true,
      ...(snapshot.settings ?? {}),
    };
  }
}

class FireMissionsModule {
  constructor() {
    this.missions = new Map();
    this.history = [];
  }

  upsertMission(input) {
    if (!input?.id) {
      throw new Error('Fire mission id is required');
    }
    const mission = {
      id: input.id,
      title: input.title ?? input.id,
      targetId: input.targetId ?? null,
      knownPointId: input.knownPointId ?? null,
      assignments: input.assignments ?? [],
      spreadMode: input.spreadMode ?? 'open',
      cffSettings: {
        missionType: input.cffSettings?.missionType ?? 'grid',
        observerMode: input.cffSettings?.observerMode ?? 'single-observer',
        useKnownPoints: input.cffSettings?.useKnownPoints ?? false,
        gridRef: input.cffSettings?.gridRef ?? null,
      },
      createdAt: input.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...input,
    };
    this.missions.set(mission.id, mission);
    return { ...mission, assignments: mission.assignments.map((item) => ({ ...item })) };
  }

  recordDecision(decision) {
    const entry = {
      id: decision.id ?? `decision-${Date.now()}`,
      missionId: decision.missionId,
      summary: decision.summary ?? '',
      solution: decision.solution ?? {},
      timestamp: new Date().toISOString(),
    };
    this.history.unshift(entry);
    this.history = this.history.slice(0, 10);
    return { ...entry, solution: { ...entry.solution } };
  }

  clearHistory() {
    this.history = [];
    return true;
  }

  listHistory() {
    return this.history.map((item) => ({ ...item, solution: { ...item.solution } }));
  }

  listMissions() {
    return [...this.missions.values()].map((mission) => ({ ...mission, assignments: mission.assignments.map((item) => ({ ...item })) }));
  }

  bindKnownPoint({ missionId, knownPointId, targetFallback = null }) {
    const mission = this.missions.get(missionId);
    if (!mission) {
      throw new Error(`Mission not found: ${missionId}`);
    }

    mission.knownPointId = knownPointId;
    mission.targetId = targetFallback ?? mission.targetId;
    mission.updatedAt = new Date().toISOString();
    this.missions.set(missionId, mission);
    return { ...mission, assignments: mission.assignments.map((item) => ({ ...item })) };
  }

  toSnapshot() {
    return {
      missions: this.listMissions(),
      history: this.listHistory(),
    };
  }

  restore(snapshot = {}) {
    this.missions.clear();
    for (const mission of snapshot.missions ?? []) {
      this.missions.set(mission.id, { ...mission, assignments: (mission.assignments ?? []).map((item) => ({ ...item })) });
    }
    this.history = (snapshot.history ?? []).map((item) => ({ ...item, solution: { ...(item.solution ?? {}) } })).slice(0, 10);
  }
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
    this.environmentalCorrections = {
      enabled: true,
      includeWind: true,
      includeTemperature: false,
      includeHumidity: false,
      includePressure: false,
      includeSpinDrift: false,
      temperatureFactorMilPerC: -0.12,
      humidityFactorMilPerPct: -0.02,
      pressureFactorMilPerHpa: 0.03,
      spinDriftFactorMilPerKm: 0.8,
      headwindFactorMilPerMs: 0.15,
      referenceTemperatureC: 15,
      referenceHumidityPct: 50,
      referencePressureHpa: 1013.25,
    };
  }

  configureEnvironmentalCorrections(settings = {}) {
    this.environmentalCorrections = {
      ...this.environmentalCorrections,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    return this.getEnvironmentalCorrections();
  }

  getEnvironmentalCorrections() {
    return { ...this.environmentalCorrections };
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
      systemType: projectile.systemType ?? null,
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

  bindTableToProjectile({ projectileId, chargeLevel, table, trajectoryVariant = 'standard', fireType = null }) {
    if (!this.projectiles.has(projectileId)) {
      throw new Error(`Projectile not found: ${projectileId}`);
    }

    const normalizedVariant = normalizeTrajectoryVariant(trajectoryVariant);
    const normalizedFireType = fireType ?? (normalizedVariant === 'direct' ? 'direct' : 'indirect');
    const key = `${projectileId}:${chargeLevel}:${normalizedVariant}`;
    const storedTable = (table ?? []).map((row) => ({ ...row }));
    this.tableBindings.set(key, storedTable);

    const projectile = this.projectiles.get(projectileId);
    projectile.charges = projectile.charges.filter((charge) => !(charge.level === chargeLevel && (charge.variant ?? 'standard') === normalizedVariant));
    projectile.charges.push({
      level: chargeLevel,
      variant: normalizedVariant,
      fireType: normalizedFireType,
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

  calculateGunSolution({
    gunId,
    projectileId,
    distance,
    bearing,
    heightDifference = 0,
    wind = { speed: 0, direction: 0, crosswind: null, headwind: null },
    weather = { temperatureC: 15, humidityPct: 50, pressureHpa: 1013.25 },
    spin = { driftDirection: 'right' },
    trajectoryType = 'auto',
    arcPreference = 'auto',
  }) {
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

    const isMortar = /mortar|мином/i.test(`${gun.type ?? ''} ${projectile.systemType ?? ''}`);
    const normalizedTrajectoryType = String(trajectoryType ?? 'auto').toLowerCase();
    const effectiveTrajectoryType = isMortar ? 'indirect' : normalizedTrajectoryType;
    const normalizedArcPreference = normalizeTrajectoryVariant(arcPreference);

    const inDistanceCharges = projectile.charges
      .filter((charge) => distance >= charge.minRange && distance <= charge.maxRange);

    const filteredByTrajectory = inDistanceCharges.filter((charge) => {
      if (effectiveTrajectoryType === 'auto') return true;
      if (effectiveTrajectoryType === 'direct') return (charge.fireType ?? 'indirect') === 'direct';
      if (effectiveTrajectoryType === 'indirect') return (charge.fireType ?? 'indirect') !== 'direct';
      return true;
    });

    const byArcPreference = filteredByTrajectory.filter((charge) => {
      const variant = charge.variant ?? 'standard';
      if (normalizedArcPreference === 'standard') return true;
      if (normalizedArcPreference === 'direct') return variant === 'direct';
      if (normalizedArcPreference === 'low') return variant === 'low';
      if (normalizedArcPreference === 'high') return variant === 'high';
      return true;
    });

    const strictArcSelection = normalizedArcPreference !== 'standard';
    const chargePool = strictArcSelection
      ? byArcPreference
      : (byArcPreference.length ? byArcPreference : filteredByTrajectory);
    const availableCharge = chargePool
      .sort((left, right) => left.maxRange - right.maxRange)[0];

    if (!availableCharge) {
      return {
        gunId,
        projectileId,
        inRange: false,
        reason: inDistanceCharges.length > 0 ? 'trajectory-not-supported' : 'distance-out-of-range',
      };
    }

    const base = interpolateByRange(availableCharge.rangeTable, distance);
    const heightCorrectionMil = ((base.dElev ?? 0) * heightDifference) / 100;
    const tofCorrection = ((base.tofPer100m ?? 0) * heightDifference) / 100;
    const fireRad = ((bearing ?? 0) * Math.PI) / 180;
    const windRad = ((wind.direction ?? 0) * Math.PI) / 180;
    const crosswind = Number.isFinite(wind.crosswind)
      ? wind.crosswind
      : (wind.speed ?? 0) * Math.sin(windRad - fireRad);
    const headwind = Number.isFinite(wind.headwind)
      ? wind.headwind
      : (wind.speed ?? 0) * Math.cos(windRad - fireRad);
    const env = this.environmentalCorrections;
    const windCorrectionMil = env.enabled && env.includeWind
      ? crosswind * (projectile.windDriftFactor ?? 0.2) + headwind * (env.headwindFactorMilPerMs ?? 0)
      : 0;
    const temperatureCorrectionMil = env.enabled && env.includeTemperature
      ? ((weather.temperatureC ?? env.referenceTemperatureC) - env.referenceTemperatureC) * (env.temperatureFactorMilPerC ?? 0)
      : 0;
    const humidityCorrectionMil = env.enabled && env.includeHumidity
      ? ((weather.humidityPct ?? env.referenceHumidityPct) - env.referenceHumidityPct) * (env.humidityFactorMilPerPct ?? 0)
      : 0;
    const pressureCorrectionMil = env.enabled && env.includePressure
      ? ((weather.pressureHpa ?? env.referencePressureHpa) - env.referencePressureHpa) * (env.pressureFactorMilPerHpa ?? 0)
      : 0;
    const spinSign = (spin.driftDirection ?? 'right') === 'left' ? -1 : 1;
    const spinCorrectionMil = env.enabled && env.includeSpinDrift
      ? spinSign * (distance / 1000) * (env.spinDriftFactorMilPerKm ?? 0)
      : 0;
    const calibrationOffset = (this.calibration.byGunId?.[gunId] ?? this.calibration.defaultElevationOffsetMil ?? 0);

    const elevation = base.elevation
      + heightCorrectionMil
      + windCorrectionMil
      + temperatureCorrectionMil
      + humidityCorrectionMil
      + pressureCorrectionMil
      + spinCorrectionMil
      + calibrationOffset;
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
      fireType: availableCharge.fireType ?? (availableCharge.variant === 'direct' ? 'direct' : 'indirect'),
      trajectoryVariant: availableCharge.variant ?? 'standard',
      trajectorySelection: {
        requestedType: normalizedTrajectoryType,
        effectiveType: effectiveTrajectoryType,
        requestedArc: arcPreference,
      },
      elevationMil: elevation,
      azimuth: clampAngle(bearing),
      timeOfFlight: base.tof + tofCorrection,
      corrections: {
        heightMil: heightCorrectionMil,
        windMil: windCorrectionMil,
        windComponents: { crosswindMs: crosswind, headwindMs: headwind },
        temperatureMil: temperatureCorrectionMil,
        humidityMil: humidityCorrectionMil,
        pressureMil: pressureCorrectionMil,
        spinMil: spinCorrectionMil,
        calibrationMil: calibrationOffset,
        tofSeconds: tofCorrection,
      },
      envelope: sectorEnvelope,
      trajectory,
    };
  }

  calculateBatterySolutions({
    assignments,
    distance,
    bearing,
    heightDifference = 0,
    wind = { speed: 0, direction: 0, crosswind: null, headwind: null },
    weather = { temperatureC: 15, humidityPct: 50, pressureHpa: 1013.25 },
    spin = { driftDirection: 'right' },
    trajectoryType = 'auto',
    arcPreference = 'auto',
  }) {
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
        weather,
        spin,
      }),
    }));
  }

  rotateGunByDrag({ gunId, marker, mousePoint }) {
    const gun = this.entities.get(gunId);
    if (!gun) {
      throw new Error(`Gun not found: ${gunId}`);
    }

    const dx = mousePoint.x - marker.x;
    const dy = mousePoint.y - marker.y;
    const azimuthDeg = clampAngle((Math.atan2(dx, dy) * 180) / Math.PI);
    const distance = Math.hypot(dx, dy);
    gun.heading = azimuthDeg;
    this.entities.set(gunId, gun);

    return {
      gunId,
      azimuthDeg,
      azimuthMilNato: azimuthDeg * (6400 / 360),
      distance,
    };
  }

  buildEngagementSector({ gunId, projectileId, chargeLevel }) {
    const gun = this.entities.get(gunId);
    const projectile = this.projectiles.get(projectileId);
    const charge = projectile?.charges?.find((item) => item.level === chargeLevel);
    if (!gun || !charge) {
      throw new Error('Gun or charge not found');
    }
    return buildSectorEnvelope({ gun, charge, bearing: gun.heading });
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
      environmentalCorrections: this.getEnvironmentalCorrections(),
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
    this.environmentalCorrections = {
      ...this.environmentalCorrections,
      ...(snapshot.environmentalCorrections ?? {}),
    };
  }
}

class ObserverModule extends UnitModule {
  constructor(options) {
    super({ ...options, moduleId: 'observers' });
  }

  setLineOfSight({ observerId, azimuth, maxDistance = 5000 }) {
    const observer = this.entities.get(observerId);
    if (!observer) {
      throw new Error(`Observer not found: ${observerId}`);
    }

    observer.lineOfSight = {
      azimuth: clampAngle(azimuth),
      maxDistance,
    };
    this.entities.set(observerId, observer);
    return { ...observer.lineOfSight };
  }

  solvePolarPlotMission({ observer, azimuth, distance, droneAltitude = 0, observerAltitude = 0, verticalAngle = 0 }) {
    const radians = (clampAngle(azimuth) * Math.PI) / 180;
    const groundDistance = Math.max(0, Math.sqrt(Math.max(0, distance * distance - droneAltitude * droneAltitude)));
    const rawHeightDifference = distance * Math.sin((verticalAngle * Math.PI) / 180);
    const heightDifference = verticalAngle < 0 ? -Math.abs(rawHeightDifference) : Math.abs(rawHeightDifference);
    const targetAltitude = observerAltitude + heightDifference;
    return {
      observer,
      target: {
        x: observer.x + Math.sin(radians) * groundDistance,
        y: observer.y + Math.cos(radians) * groundDistance,
      },
      azimuth: clampAngle(azimuth),
      distance,
      droneAltitude,
      observerAltitude,
      targetAltitude,
      heightDifference,
      verticalAngle,
      mode: 'polar-plot',
    };
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
    // Web maps typically use Y+ downward, while Reforger coordinates use Y+ northward.
    // Invert map Y delta to keep calibration angle in world-aligned (north-up) space.
    const rulerDy = -(p2.mapY - p1.mapY);
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
      observers: new ObserverModule({ createId: idGenerator }),
      logistics: new UnitModule({ moduleId: 'logistics', createId: idGenerator }),
      infantry: new UnitModule({ moduleId: 'infantry', createId: idGenerator }),
      knownPoints: new UnitModule({ moduleId: 'knownPoints', createId: idGenerator }),
      safetyData: new SafetyDataModule({ createId: idGenerator }),
      fireMissions: new FireMissionsModule(),
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
        knownPoints: this.modules.knownPoints.list(),
        safetyData: this.modules.safetyData.toSnapshot(),
        fireMissions: this.modules.fireMissions.toSnapshot(),
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
    this.modules.knownPoints.restore(snapshot.modules.knownPoints);
    this.modules.safetyData.restore(snapshot.modules.safetyData);
    this.modules.fireMissions.restore(snapshot.modules.fireMissions);
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
      knownPoints: this.modules.knownPoints.list(),
      safetyData: this.modules.safetyData.toSnapshot(),
      fireMissions: this.modules.fireMissions.toSnapshot(),
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
    this.modules.knownPoints.restore(payload.knownPoints ?? []);
    this.modules.safetyData.restore(payload.safetyData ?? {});
    this.modules.fireMissions.restore(payload.fireMissions ?? {});
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
            'environmental-corrections-settings',
          ],
        },
        { id: 'battery-input', title: 'Батареи', module: 'batteries', supports: ['manual', 'map-placement'] },
        { id: 'target-input', title: 'Цели', module: 'targets', supports: ['manual', 'map-placement'] },
        { id: 'observer-input', title: 'Наблюдатели', module: 'observers', supports: ['manual', 'map-placement'] },
        {
          id: 'known-points-input',
          title: 'Known Points',
          module: 'knownPoints',
          supports: ['manual', 'map-placement', 'mission-reference', 'save-load'],
        },
        {
          id: 'safety-data',
          title: 'Safety & Data',
          module: 'safetyData',
          supports: ['nfa-management', 'trajectory-warning', 'cancel-or-skip-fire', 'data-reset-with-confirmation', 'save-load'],
        },
        {
          id: 'fire-missions',
          title: 'Fire Missions',
          module: 'fireMissions',
          supports: ['cff-settings', 'observer-grid-known-points', 'spread-modes', 'history-save-last-10', 'history-clear', 'pinned-solution-window'],
        },
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
