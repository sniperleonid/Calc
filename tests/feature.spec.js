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

  const ignoredWindow = hud.receiveFireSolution({ missionId: 'm-1', gunId: 'gun-2-1', azimuth: 123, elevation: 456 });
  assert.equal(ignoredWindow, null);

  const fireSolutionWindow = hud.receiveFireSolution({ missionId: 'm-1', gunId: 'gun-1-2', azimuth: 123, elevation: 456, charge: 3 });
  assert.equal(fireSolutionWindow.open, true);
  assert.equal(fireSolutionWindow.azimuth, 123);
  assert.equal(fireSolutionWindow.elevation, 456);
  assert.equal(fireSolutionWindow.pinned, false);

  hud.pinFireSolutionWindow(true);
  assert.equal(hud.getFireSolutionWindow().pinned, true);
  hud.closeFireSolutionWindow();
  assert.equal(hud.getFireSolutionWindow().open, false);

  hud.assignBatteryCommander('battery-1');
  assert.equal(hud.shouldReceiveMission({ batteryId: 'battery-1' }), true);

  const batterySolution = hud.receiveFireSolution({ missionId: 'm-1', batteryId: 'battery-1', azimuth: 78, elevation: 901 });
  assert.equal(batterySolution.open, true);
  assert.equal(batterySolution.azimuth, 78);

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
  assert.equal(uiSchema.panels.length, 10);
  assert.equal(uiSchema.panels.find((panel) => panel.module === 'map').supports.includes('mission-save-load'), true);
  assert.equal(uiSchema.panels.find((panel) => panel.module === 'safetyData').supports.includes('nfa-management'), true);
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
  workspace.getModule('fireMissions').upsertMission({
    id: 'fm-profile-1',
    title: 'Map profile mission',
    spreadMode: 'linear',
    cffSettings: { missionType: 'observer', observerMode: 'ground' },
  });
  workspace.getModule('fireMissions').recordDecision({ missionId: 'fm-profile-1', summary: 'Shot #1' });

  await workspace.saveMapProfile('mission-profile');
  const list = await profileStorage.listProfiles();
  assert.equal(list.includes('mission-profile'), true);

  const clean = new TacticalWorkspace({ missionId: 'm-clean', profileStorage });
  await clean.loadMapProfile('mission-profile');
  assert.equal(clean.getModule('map').getCalibration().controlPoints.length, 3);
  assert.equal(clean.getModule('targets').list().length, 1);
  assert.equal(clean.getModule('batteries').list().length, 1);
  assert.equal(clean.getModule('fireMissions').listMissions().length, 1);
  assert.equal(clean.getModule('fireMissions').listHistory().length, 1);
});

test('safety data module supports NFA checks, settings and reset', () => {
  const workspace = new TacticalWorkspace({ missionId: 'm-safety' });
  const safety = workspace.getModule('safetyData');

  safety.addNoFireArea({
    id: 'nfa-1',
    name: 'Village',
    center: { x: 100, y: 100 },
    radius: 30,
  });
  safety.configure({ cancelFireOnNfaHit: false, skipNfaInLinearPattern: true });

  const decision = safety.assessTrajectory({
    start: { x: 50, y: 100 },
    end: { x: 150, y: 100 },
    patternMode: 'linear',
  });

  assert.equal(decision.hasViolation, true);
  assert.equal(decision.action, 'skip-nfa-segment');
  assert.equal(decision.impactedZones[0].id, 'nfa-1');

  const reset = safety.resetAllData({ keepBallisticTables: true });
  assert.equal(reset.keepBallisticTables, true);
  assert.equal(safety.listNoFireAreas().length, 0);
});

test('safety data supports polygon zones and can skip linear pattern segments', () => {
  const workspace = new TacticalWorkspace({ missionId: 'm-safety-poly' });
  const safety = workspace.getModule('safetyData');

  safety.addNoFireArea({
    id: 'nfa-poly-1',
    name: 'School',
    vertices: [
      { x: 90, y: 90 },
      { x: 130, y: 90 },
      { x: 130, y: 130 },
      { x: 90, y: 130 },
    ],
  });
  safety.configure({ cancelFireOnNfaHit: false, skipNfaInLinearPattern: true });

  const decision = safety.assessTrajectory({
    start: { x: 80, y: 100 },
    end: { x: 160, y: 100 },
    patternMode: 'single',
  });
  assert.equal(decision.hasViolation, true);
  assert.equal(decision.canOverride, true);
  assert.equal(decision.action, 'warn-only');

  const filtered = safety.filterLinearPatternSegments([
    { id: 'seg-1', start: { x: 80, y: 100 }, end: { x: 160, y: 100 } },
    { id: 'seg-2', start: { x: 10, y: 10 }, end: { x: 20, y: 20 } },
  ]);
  assert.equal(filtered[0].skipped, true);
  assert.equal(filtered[1].skipped, false);
});

test('fire mission can bind known point for quick target selection', () => {
  const workspace = new TacticalWorkspace({ missionId: 'm-known-point' });
  const knownPoints = workspace.getModule('knownPoints');
  const fireMissions = workspace.getModule('fireMissions');

  knownPoints.placeOnMap({ id: 'kp-1', name: 'Bridge A', position: { x: 250, y: 700 } });
  fireMissions.upsertMission({ id: 'fm-kp-1', title: 'Quick mission' });
  const mission = fireMissions.bindKnownPoint({ missionId: 'fm-kp-1', knownPointId: 'kp-1' });

  assert.equal(mission.knownPointId, 'kp-1');
});

test('fire missions keep only last 10 history entries', () => {
  const workspace = new TacticalWorkspace({ missionId: 'm-fire' });
  const fireMissions = workspace.getModule('fireMissions');

  fireMissions.upsertMission({
    id: 'fm-1',
    title: 'Suppression',
    spreadMode: 'linear',
    cffSettings: { missionType: 'observer', observerMode: 'drone' },
  });

  for (let i = 0; i < 12; i += 1) {
    fireMissions.recordDecision({ missionId: 'fm-1', summary: `Decision ${i}` });
  }

  assert.equal(fireMissions.listHistory().length, 10);
  fireMissions.clearHistory();
  assert.equal(fireMissions.listHistory().length, 0);
});

test('observer polar-plot and gun drag azimuth helpers are available', () => {
  const workspace = new TacticalWorkspace({ missionId: 'm-tools' });
  const observers = workspace.getModule('observers');
  const ballistics = workspace.getModule('ballistics');

  observers.placeOnMap({ id: 'obs-1', position: { x: 500, y: 500 } });
  const los = observers.setLineOfSight({ observerId: 'obs-1', azimuth: 70, maxDistance: 4000 });
  assert.equal(los.azimuth, 70);

  const polar = observers.solvePolarPlotMission({
    observer: { x: 500, y: 500 },
    azimuth: 90,
    distance: 1000,
    observerAltitude: 140,
    verticalAngle: 12,
  });
  assert.equal(polar.target.x > 1400, true);
  assert.equal(polar.mode, 'polar-plot');
  assert.equal(Math.round(polar.targetAltitude), 348);
  assert.equal(Math.round(polar.heightDifference), 208);
  assert.equal(Math.round(polar.horizontalRange), 978);

  const descendingPolar = observers.solvePolarPlotMission({
    observer: { x: 500, y: 500 },
    azimuth: 90,
    distance: 1000,
    observerAltitude: 140,
    verticalAngle: -20,
  });
  assert.equal(Math.round(descendingPolar.targetAltitude), -202);
  assert.equal(Math.round(descendingPolar.heightDifference), -342);

  const northFlat = observers.solvePolarPlotMission({
    observer: { x: 500, y: 500 },
    azimuth: 0,
    distance: 1000,
    observerAltitude: 140,
    verticalAngle: 0,
  });
  assert.equal(Math.round(northFlat.target.x), 500);
  assert.equal(Math.round(northFlat.target.y), 1500);
  assert.equal(Math.round(northFlat.targetAltitude), 140);

  const eastFlat = observers.solvePolarPlotMission({
    observer: { x: 500, y: 500 },
    azimuth: 90,
    distance: 1000,
    observerAltitude: 140,
    verticalAngle: 0,
  });
  assert.equal(Math.round(eastFlat.target.x), 1500);
  assert.equal(Math.round(eastFlat.target.y), 500);

  const horizontalVerticalInput = observers.solvePolarPlotMission({
    observer: { x: 500, y: 500 },
    azimuth: 0,
    horizontalRange: 300,
    verticalDelta: 60,
    observerAltitude: 140,
  });
  assert.equal(Math.round(horizontalVerticalInput.target.y), 800);
  assert.equal(Math.round(horizontalVerticalInput.targetAltitude), 200);
  assert.equal(Math.round(horizontalVerticalInput.distance), 306);

  ballistics.upsertManual({ id: 'gun-1', position: { x: 0, y: 0 } });
  const drag = ballistics.rotateGunByDrag({ gunId: 'gun-1', marker: { x: 0, y: 0 }, mousePoint: { x: 100, y: 0 } });
  assert.equal(Math.round(drag.azimuthDeg), 90);
  assert.equal(Math.round(drag.azimuthMilNato), 1600);
});

test('three-point calibration treats map Y axis as inverted versus world north axis', () => {
  const workspace = new TacticalWorkspace({ missionId: 'm-y-axis' });
  const map = workspace.getModule('map');

  map.calibrateByThreePoints({
    p0: { mapX: 0, mapY: 0 },
    p1: { mapX: 0, mapY: 0 },
    p2: { mapX: 0, mapY: 100 },
    knownP0: { gameX: 1000, gameY: 2000 },
    scaleMeters: 1000,
  });

  const calibration = map.getCalibration();
  const expected = -Math.PI / 2;
  assert.equal(Math.abs(calibration.model.angleRad - expected) < 1e-9, true);
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

test('ballistics selects direct/indirect trajectory by weapon capability and requested arc', () => {
  const workspace = new TacticalWorkspace({ missionId: 'm-trajectory-modes' });
  const ballistics = workspace.getModule('ballistics');

  ballistics.upsertManual({ id: 'gun-art', type: 'M777', position: { x: 0, y: 0 }, heading: 90, sectorStart: 0, sectorEnd: 360, minElevationMil: 200, maxElevationMil: 1500 });
  ballistics.upsertManual({ id: 'gun-mort', type: 'Mortar', position: { x: 0, y: 0 }, heading: 90, sectorStart: 0, sectorEnd: 360, minElevationMil: 600, maxElevationMil: 1600 });

  ballistics.registerProjectile({ id: 'he-art', shellType: 'HE', systemType: 'artillery' });
  ballistics.registerProjectile({ id: 'he-mort', shellType: 'HE', systemType: 'mortar' });

  ballistics.bindProjectileToGun({ gunId: 'gun-art', projectileId: 'he-art' });
  ballistics.bindProjectileToGun({ gunId: 'gun-mort', projectileId: 'he-mort' });

  ballistics.bindTableToProjectile({ projectileId: 'he-art', chargeLevel: 1, trajectoryVariant: 'direct', fireType: 'direct', table: [
    { range: 500, elevation: 420, tof: 3, dElev: 8, tofPer100m: 0.1 },
    { range: 1500, elevation: 380, tof: 5, dElev: 10, tofPer100m: 0.12 },
  ]});
  ballistics.bindTableToProjectile({ projectileId: 'he-art', chargeLevel: 1, trajectoryVariant: 'low', fireType: 'indirect', table: [
    { range: 1200, elevation: 700, tof: 8, dElev: 12, tofPer100m: 0.14 },
    { range: 2500, elevation: 640, tof: 11, dElev: 14, tofPer100m: 0.16 },
  ]});
  ballistics.bindTableToProjectile({ projectileId: 'he-art', chargeLevel: 1, trajectoryVariant: 'high', fireType: 'indirect', table: [
    { range: 1200, elevation: 960, tof: 10, dElev: 14, tofPer100m: 0.2 },
    { range: 2500, elevation: 900, tof: 14, dElev: 17, tofPer100m: 0.24 },
  ]});

  ballistics.bindTableToProjectile({ projectileId: 'he-mort', chargeLevel: 2, trajectoryVariant: 'high', fireType: 'indirect', table: [
    { range: 800, elevation: 1320, tof: 11, dElev: 24, tofPer100m: 0.18 },
    { range: 1800, elevation: 1180, tof: 19, dElev: 28, tofPer100m: 0.24 },
  ]});

  const highArc = ballistics.calculateGunSolution({ gunId: 'gun-art', projectileId: 'he-art', distance: 1400, bearing: 90, trajectoryType: 'indirect', arcPreference: 'high' });
  assert.equal(highArc.inRange, true);
  assert.equal(highArc.trajectoryVariant, 'high');

  const direct = ballistics.calculateGunSolution({ gunId: 'gun-art', projectileId: 'he-art', distance: 900, bearing: 90, trajectoryType: 'direct' });
  assert.equal(direct.inRange, true);
  assert.equal(direct.fireType, 'direct');

  const mortarDirect = ballistics.calculateGunSolution({ gunId: 'gun-mort', projectileId: 'he-mort', distance: 1200, bearing: 90, trajectoryType: 'direct' });
  assert.equal(mortarDirect.inRange, true);
  assert.equal(mortarDirect.trajectorySelection.effectiveType, 'indirect');

  const unsupportedDirect = ballistics.calculateGunSolution({ gunId: 'gun-mort', projectileId: 'he-mort', distance: 1200, bearing: 90, trajectoryType: 'direct', arcPreference: 'direct' });
  assert.equal(unsupportedDirect.inRange, false);
  assert.equal(unsupportedDirect.reason, 'trajectory-not-supported');
});

test('ballistics module supports toggleable environmental corrections (wind/temp/humidity/pressure/spin)', () => {
  const workspace = new TacticalWorkspace({ missionId: 'm-env-corrections' });
  const ballistics = workspace.getModule('ballistics');

  ballistics.upsertManual({
    id: 'gun-1',
    name: 'Gun #1',
    position: { x: 0, y: 0 },
    heading: 90,
    sectorStart: 0,
    sectorEnd: 360,
    minElevationMil: 250,
    maxElevationMil: 1300,
  });
  ballistics.registerProjectile({ id: 'proj-1', label: 'HE', windDriftFactor: 0.45 });
  ballistics.bindProjectileToGun({ gunId: 'gun-1', projectileId: 'proj-1' });
  ballistics.bindTableToProjectile({
    projectileId: 'proj-1',
    chargeLevel: 4,
    table: [
      { range: 4000, elevation: 940, tof: 12, dElev: 15, tofPer100m: 0.12 },
      { range: 6000, elevation: 860, tof: 18, dElev: 20, tofPer100m: 0.18 },
    ],
  });

  const baseline = ballistics.calculateGunSolution({
    gunId: 'gun-1',
    projectileId: 'proj-1',
    distance: 5000,
    bearing: 90,
    wind: { direction: 180, crosswind: 4, headwind: 2 },
    weather: { temperatureC: 35, humidityPct: 75, pressureHpa: 990 },
    spin: { driftDirection: 'right' },
  });

  ballistics.configureEnvironmentalCorrections({
    enabled: true,
    includeWind: true,
    includeTemperature: true,
    includeHumidity: true,
    includePressure: true,
    includeSpinDrift: true,
  });

  const withCorrections = ballistics.calculateGunSolution({
    gunId: 'gun-1',
    projectileId: 'proj-1',
    distance: 5000,
    bearing: 90,
    wind: { direction: 180, crosswind: 4, headwind: 2 },
    weather: { temperatureC: 35, humidityPct: 75, pressureHpa: 990 },
    spin: { driftDirection: 'right' },
  });

  assert.equal(withCorrections.corrections.windComponents.crosswindMs, 4);
  assert.equal(withCorrections.corrections.windComponents.headwindMs, 2);
  assert.equal(withCorrections.corrections.temperatureMil !== 0, true);
  assert.equal(withCorrections.corrections.humidityMil !== 0, true);
  assert.equal(withCorrections.corrections.pressureMil !== 0, true);
  assert.equal(withCorrections.corrections.spinMil !== 0, true);
  assert.equal(withCorrections.elevationMil !== baseline.elevationMil, true);

  ballistics.configureEnvironmentalCorrections({ enabled: false });
  const disabled = ballistics.calculateGunSolution({
    gunId: 'gun-1',
    projectileId: 'proj-1',
    distance: 5000,
    bearing: 90,
    wind: { direction: 180, crosswind: 4, headwind: 2 },
    weather: { temperatureC: 35, humidityPct: 75, pressureHpa: 990 },
    spin: { driftDirection: 'right' },
  });

  assert.equal(disabled.corrections.windMil, 0);
  assert.equal(disabled.corrections.temperatureMil, 0);
  assert.equal(disabled.corrections.humidityMil, 0);
  assert.equal(disabled.corrections.pressureMil, 0);
  assert.equal(disabled.corrections.spinMil, 0);
});
