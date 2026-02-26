import test from 'node:test';
import assert from 'node:assert/strict';

import { MissionJournal } from '../services/realtime-gateway/src/mission-journal.js';
import { CHANNELS, RealtimeGateway } from '../services/realtime-gateway/src/server.js';
import { createLayerState, WEB_MAP_LAYERS } from '../apps/web-map/src/layers.js';
import { PinnedGunnerPanel } from '../apps/fire-control/src/pinned-gunner-panel.js';
import { CorrectionPanel } from '../apps/observer-console/src/correction-panel.js';
import { HudOverlay } from '../apps/hud/src/hud-overlay.js';
import { LobbyService, MAX_BATTERIES, MAX_GUNS_PER_BATTERY, MAX_OBSERVERS, ROLES } from '../services/realtime-gateway/src/lobby-service.js';
import { TacticalWorkspace } from '../apps/web-map/src/tactical-workspace.js';
import { FileMapProfileStorage } from '../apps/web-map/src/map-profile-storage.js';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('mission journal stores events by mission', () => {
  const journal = new MissionJournal();
  journal.append('m-1', { type: 'mission.assigned' });
  journal.append('m-1', { type: 'observer.correction' });

  assert.equal(journal.get('m-1').length, 2);
});

test('gateway exposes requested channels and auto-delivers corrections', () => {
  assert.deepEqual(CHANNELS, ['mission.assign', 'gun.status', 'observer.correction', 'logistics.request']);

  const gateway = new RealtimeGateway();
  const relayed = [];
  gateway.subscribe('gun.status', (event) => relayed.push(event));

  gateway.publish('mission.assign', { missionId: 'm-1', gunId: 'gun-7', observerId: 'obs-2' });
  gateway.publish('observer.correction', {
    missionId: 'm-1',
    observerId: 'obs-2',
    correction: { range: 'short', direction: 'right', mode: 'repeat' }
  });

  assert.equal(relayed.length, 1);
  assert.equal(relayed[0].relay, 'auto-delivery');
  assert.equal(gateway.getMissionJournal('m-1').length, 2);
});

test('web map has required operational layers', () => {
  const ids = new Set(WEB_MAP_LAYERS.map((x) => x.id));
  for (const id of ['guns', 'observers-drones', 'targets', 'safe-zones', 'patterns', 'rulers', 'logistics-markers', 'mine-markers']) {
    assert.equal(ids.has(id), true);
  }

  const state = createLayerState();
  assert.equal(state.setVisibility('patterns', true), true);
  assert.equal(state.getAll().find((x) => x.id === 'patterns').visible, true);
});

test('pinned gunner panel emits ready and ammo actions', () => {
  const panel = new PinnedGunnerPanel({ gunId: 'gun-1' });
  panel.updateBallisticData({ azimuth: 182, elevation: 14, charge: 3 });

  const ready = panel.confirmReady();
  assert.equal(ready.channel, 'gun.status');

  const ammo = panel.requestAmmo({ missionId: 'm-1', type: 'HE', quantity: 8 });
  assert.equal(ammo.channel, 'logistics.request');
  assert.equal(ammo.payload.gunId, 'gun-1');
});

test('observer correction panel binds to gun or battery', () => {
  const panel = new CorrectionPanel({ observerId: 'obs-1' });
  panel.bindGun('gun-9');
  const correction = panel.createCorrection({
    missionId: 'm-1',
    range: 'over',
    direction: 'left',
    mode: 'salvo'
  });

  assert.equal(correction.channel, 'observer.correction');
  assert.equal(correction.payload.assignedGunId, 'gun-9');

  panel.bindBattery('battery-3');
  const batteryCorrection = panel.createCorrection({
    missionId: 'm-2',
    range: 'short',
    direction: 'right',
    mode: 'repeat'
  });

  assert.equal(batteryCorrection.payload.assignedBatteryId, 'battery-3');
  assert.equal(batteryCorrection.payload.assignedGunId, null);
});

test('hud overlay exposes command buttons over game window', () => {
  const hud = new HudOverlay({ roomId: 'room-1', playerId: 'u-1' });

  const snapshot = hud.snapshot();
  assert.equal(snapshot.visible, true);
  assert.equal(snapshot.buttons.length >= 5, true);

  const click = hud.click('btn-drone');
  assert.equal(click.action, 'observer.drone.launch');

  hud.applyRole('observer');
  assert.equal(hud.snapshot().buttons.find((button) => button.id === 'btn-fire').enabled, false);

  hud.assignGuns(['gun-1-2', 'gun-1-4']);
  assert.equal(hud.shouldReceiveMission({ gunId: 'gun-1-2' }), true);
  assert.equal(hud.shouldReceiveMission({ gunId: 'gun-2-1' }), false);

  hud.assignBatteryCommander('battery-1');
  assert.equal(hud.shouldReceiveMission({ batteryId: 'battery-1' }), true);

  assert.equal(hud.toggleVisibility(), false);
});

test('lobby service supports password protected online room and role assignments', () => {
  const lobby = new LobbyService();
  const created = lobby.createRoom({ roomId: 'alpha', password: 'p@ss', commanderUserId: 'cmd-1' });

  assert.equal(created.limits.batteries, MAX_BATTERIES);
  assert.equal(created.batteries.length, MAX_BATTERIES);
  assert.equal(created.batteries[0].guns.length, MAX_GUNS_PER_BATTERY);

  lobby.joinRoom({ roomId: 'alpha', password: 'p@ss', userId: 'obs-1' });
  lobby.joinRoom({ roomId: 'alpha', password: 'p@ss', userId: 'gunner-1' });
  lobby.joinRoom({ roomId: 'alpha', password: 'p@ss', userId: 'log-1' });

  lobby.assignRole({
    roomId: 'alpha',
    actorUserId: 'cmd-1',
    userId: 'obs-1',
    role: ROLES.OBSERVER,
    observerBinding: { batteryId: 'battery-1' }
  });
  lobby.assignRole({
    roomId: 'alpha',
    actorUserId: 'cmd-1',
    userId: 'gunner-1',
    role: ROLES.GUNNER,
    batteryId: 'battery-1',
    gunIds: ['gun-1-1', 'gun-1-2']
  });
  lobby.assignRole({ roomId: 'alpha', actorUserId: 'cmd-1', userId: 'log-1', role: ROLES.LOGISTICIAN });

  lobby.joinRoom({ roomId: 'alpha', password: 'p@ss', userId: 'bat-cmd-1' });
  lobby.assignRole({
    roomId: 'alpha',
    actorUserId: 'cmd-1',
    userId: 'bat-cmd-1',
    role: ROLES.BATTERY_COMMANDER,
    batteryId: 'battery-2'
  });

  lobby.setMissionSnapshot({ roomId: 'alpha', actorUserId: 'cmd-1', snapshot: { missionId: 'm-alpha', modules: { map: { markers: [] } } } });
  const missionForObserver = lobby.getMissionForUser({ roomId: 'alpha', userId: 'obs-1' });
  const missionForBatteryCommander = lobby.getMissionForUser({ roomId: 'alpha', userId: 'bat-cmd-1' });

  const state = lobby.getRoom('alpha');
  assert.equal(state.observers.length, 1);
  assert.equal(state.limits.observers, MAX_OBSERVERS);
  assert.equal(state.batteries[0].guns[0].operatorUserId, 'gunner-1');
  assert.equal(state.batteries[0].guns[1].operatorUserId, 'gunner-1');
  assert.equal(state.members.find((member) => member.userId === 'obs-1').assignment.observerBinding.batteryId, 'battery-1');
  assert.equal(missionForObserver.permissions.canEditMissions, false);
  assert.equal(missionForBatteryCommander.permissions.canEditMissions, true);
  assert.equal(missionForObserver.missionSnapshot.missionId, 'm-alpha');
});

test('tactical workspace keeps modules isolated and supports map workflows', () => {
  const workspace = new TacticalWorkspace({ missionId: 'm-21' });

  workspace.getModule('ballistics').upsertManual({
    name: 'Gun Alpha',
    type: 'howitzer',
    position: { x: 110, y: 420 },
  });
  workspace.getModule('observers').placeOnMap({
    id: 'obs-2',
    name: 'Observer East',
    position: { x: 300, y: 80 },
  });
  workspace.getModule('map').loadMap({
    assetId: 'field-01',
    fileName: 'field.png',
    width: 4096,
    height: 4096,
  });

  workspace.getModule('map').setCalibration({
    controlPoints: [
      { mapX: 100, mapY: 100, gameX: 1200, gameY: 5400 },
      { mapX: 3500, mapY: 3500, gameX: 8800, gameY: 1200 },
    ],
    model: { scaleX: 2.235, scaleY: -1.235, offsetX: 300, offsetY: 5520 },
  });

  workspace.getModule('map').addMarker({
    id: 'target-1',
    title: 'Основная цель',
    category: 'target',
    position: { x: 500, y: 620 },
  });

  const missionSnapshot = workspace.saveMission();
  assert.equal(missionSnapshot.modules.ballistics.guns.length, 1);
  assert.equal(missionSnapshot.modules.observers.length, 1);
  assert.equal(missionSnapshot.modules.map.markers.length, 1);

  const calibrationPreset = workspace.saveCalibrationPreset();
  const cleanWorkspace = new TacticalWorkspace({ missionId: 'm-clean' });
  cleanWorkspace.loadMission(missionSnapshot);
  cleanWorkspace.loadCalibrationPreset(calibrationPreset);

  assert.equal(cleanWorkspace.getModule('observers').list()[0].id, 'obs-2');
  assert.equal(cleanWorkspace.getModule('map').getCalibration().model.offsetY, 5520);

  const uiSchema = cleanWorkspace.buildUiSchema();
  assert.equal(uiSchema.panels.length, 7);
  assert.equal(uiSchema.panels.find((panel) => panel.module === 'map').supports.includes('mission-save-load'), true);
});

test('map module supports three-point calibration and map profile save/load in maps folder', async () => {
  const mapsRoot = await mkdtemp(join(tmpdir(), 'calc-maps-'));
  const profileStorage = new FileMapProfileStorage({ mapsDir: mapsRoot });
  const workspace = new TacticalWorkspace({ missionId: 'm-profile', profileStorage });

  workspace.getModule('map').loadMap({ assetId: 'field-2', fileName: 'field-2.png', width: 2048, height: 2048 });
  workspace.getModule('map').calibrateByThreePoints({
    p0: { mapX: 100, mapY: 100 },
    p1: { mapX: 200, mapY: 100 },
    p2: { mapX: 500, mapY: 100 },
    knownP0: { gameX: 1000, gameY: 2000 },
    scaleMeters: 900,
  });
  workspace.getModule('ballistics').placeOnMap({ id: 'gun-active-1', name: 'Gun', position: { x: 230, y: 100 } });
  workspace.getModule('batteries').placeOnMap({ id: 'battery-1', name: 'Battery 1', position: { x: 260, y: 140 } });
  workspace.getModule('targets').placeOnMap({ id: 'target-1', name: 'Target 1', position: { x: 500, y: 500 } });
  workspace.getModule('observers').placeOnMap({ id: 'observer-1', name: 'Observer 1', position: { x: 450, y: 300 } });

  await workspace.saveMapProfile('mission-profile');
  const list = await profileStorage.listProfiles();
  assert.equal(list.includes('mission-profile'), true);

  const clean = new TacticalWorkspace({ missionId: 'm-clean', profileStorage });
  await clean.loadMapProfile('mission-profile');
  assert.equal(clean.getModule('map').getCalibration().controlPoints.length, 3);
  assert.equal(clean.getModule('targets').list().length, 1);
  assert.equal(clean.getModule('batteries').list().length, 1);
});


test('ballistics module supports gun/projectile binding, interpolation, wind and sector checks', () => {
  const workspace = new TacticalWorkspace({ missionId: 'm-ballistics' });
  const ballistics = workspace.getModule('ballistics');

  ballistics.upsertManual({
    id: 'gun-m777',
    name: 'M777 #1',
    type: 'M777',
    position: { x: 0, y: 0 },
    heading: 90,
    sectorStart: 75,
    sectorEnd: 105,
    minElevationMil: 250,
    maxElevationMil: 1300,
  });

  ballistics.registerProjectile({
    id: 'm777-he',
    label: 'M777 HE',
    shellType: 'HE',
    windDriftFactor: 0.45,
  });

  ballistics.bindProjectileToGun({ gunId: 'gun-m777', projectileId: 'm777-he' });
  ballistics.bindTableToProjectile({
    projectileId: 'm777-he',
    chargeLevel: 5,
    table: [
      { range: 4000, elevation: 980, tof: 12, dElev: 14, tofPer100m: 0.12 },
      { range: 6000, elevation: 870, tof: 17, dElev: 18, tofPer100m: 0.16 },
      { range: 8000, elevation: 760, tof: 23, dElev: 25, tofPer100m: 0.22 },
    ],
  });

  ballistics.setCalibration({
    defaultElevationOffsetMil: 3,
    byGunId: { 'gun-m777': 5 },
  });

  const solution = ballistics.calculateGunSolution({
    gunId: 'gun-m777',
    projectileId: 'm777-he',
    distance: 5000,
    bearing: 92,
    heightDifference: 60,
    wind: { speed: 6, direction: 130 },
  });

  assert.equal(solution.inRange, true);
  assert.equal(solution.inSector, true);
  assert.equal(solution.inElevationLimits, true);
  assert.equal(solution.chargeLevel, 5);
  assert.equal(solution.trajectory.length > 4, true);
  assert.equal(solution.envelope.maxRange, 8000);
  assert.equal(solution.elevationMil > 900 && solution.elevationMil < 1000, true);
});

test('battery can solve different weapons with own projectile tables', () => {
  const workspace = new TacticalWorkspace({ missionId: 'm-battery' });
  const ballistics = workspace.getModule('ballistics');

  ballistics.upsertManual({ id: 'gun-mortar', name: 'Mortar', type: '2B14', position: { x: 0, y: 0 }, heading: 180, sectorStart: 0, sectorEnd: 360, minElevationMil: 700, maxElevationMil: 1500 });
  ballistics.upsertManual({ id: 'gun-m777', name: 'M777', type: 'M777', position: { x: 10, y: 10 }, heading: 95, sectorStart: 70, sectorEnd: 120, minElevationMil: 250, maxElevationMil: 1300 });

  ballistics.registerProjectile({ id: 'mort-he', shellType: 'HE' });
  ballistics.registerProjectile({ id: 'm777-smoke', shellType: 'SMOKE' });

  ballistics.bindProjectileToGun({ gunId: 'gun-mortar', projectileId: 'mort-he' });
  ballistics.bindProjectileToGun({ gunId: 'gun-m777', projectileId: 'm777-smoke' });

  ballistics.bindTableToProjectile({ projectileId: 'mort-he', chargeLevel: 2, table: [
    { range: 1200, elevation: 1260, tof: 16, dElev: 30, tofPer100m: 0.2 },
    { range: 1800, elevation: 1120, tof: 21, dElev: 36, tofPer100m: 0.25 },
  ]});

  ballistics.bindTableToProjectile({ projectileId: 'm777-smoke', chargeLevel: 4, table: [
    { range: 5000, elevation: 920, tof: 14, dElev: 18, tofPer100m: 0.15 },
    { range: 7000, elevation: 810, tof: 20, dElev: 22, tofPer100m: 0.2 },
  ]});

  const results = ballistics.calculateBatterySolutions({
    assignments: [
      { gunId: 'gun-mortar', projectileId: 'mort-he' },
      { gunId: 'gun-m777', projectileId: 'm777-smoke' },
    ],
    distance: 1500,
    bearing: 100,
    heightDifference: -20,
    wind: { speed: 2, direction: 210 },
  });

  assert.equal(results.length, 2);
  assert.equal(results[0].solution.inRange, true);
  assert.equal(results[1].solution.inRange, false);
});
