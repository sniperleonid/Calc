function makeIdGenerator(prefix = 'entity') {
  let counter = 1;
  return () => `${prefix}-${counter++}`;
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

class MapModule {
  constructor() {
    this.mapAsset = null;
    this.calibration = null;
    this.markers = [];
    this.tools = [];
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
  constructor({ missionId, idGenerator = makeIdGenerator('unit') }) {
    this.missionId = missionId;
    this.modules = {
      ballistics: new UnitModule({ moduleId: 'ballistics', createId: idGenerator }),
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
        ballistics: this.modules.ballistics.list(),
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

  buildUiSchema() {
    return {
      missionId: this.missionId,
      panels: [
        { id: 'ballistics-input', title: 'Орудия и баллистика', module: 'ballistics', supports: ['manual', 'map-placement'] },
        { id: 'observer-input', title: 'Наблюдатели', module: 'observers', supports: ['manual', 'map-placement'] },
        { id: 'logistics-input', title: 'Логистика', module: 'logistics', supports: ['manual', 'map-placement'] },
        { id: 'infantry-input', title: 'Пехота', module: 'infantry', supports: ['manual', 'map-placement'] },
        { id: 'map-controls', title: 'Карта и калибровка', module: 'map', supports: ['map-upload', 'calibration-save-load', 'mission-save-load'] },
      ],
    };
  }
}
