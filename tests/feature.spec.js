import test from 'node:test';
import assert from 'node:assert/strict';

import { MissionJournal } from '../services/realtime-gateway/src/mission-journal.js';
import { CHANNELS, RealtimeGateway } from '../services/realtime-gateway/src/server.js';
import { createLayerState, WEB_MAP_LAYERS } from '../apps/web-map/src/layers.js';
import { PinnedGunnerPanel } from '../apps/fire-control/src/pinned-gunner-panel.js';
import { CorrectionPanel } from '../apps/observer-console/src/correction-panel.js';
import { HudOverlay } from '../apps/hud/src/hud-overlay.js';
import { LobbyService, MAX_BATTERIES, MAX_GUNS_PER_BATTERY, MAX_OBSERVERS, ROLES } from '../services/realtime-gateway/src/lobby-service.js';

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

test('observer correction panel binds to assigned gun', () => {
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
});

test('hud overlay exposes command buttons over game window', () => {
  const hud = new HudOverlay({ roomId: 'room-1', playerId: 'u-1' });

  const snapshot = hud.snapshot();
  assert.equal(snapshot.visible, true);
  assert.equal(snapshot.buttons.length >= 5, true);

  const click = hud.click('btn-drone');
  assert.equal(click.action, 'observer.drone.launch');

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

  lobby.assignRole({ roomId: 'alpha', actorUserId: 'cmd-1', userId: 'obs-1', role: ROLES.OBSERVER });
  lobby.assignRole({
    roomId: 'alpha',
    actorUserId: 'cmd-1',
    userId: 'gunner-1',
    role: ROLES.GUNNER,
    batteryId: 'battery-1',
    gunId: 'gun-1-1'
  });
  lobby.assignRole({ roomId: 'alpha', actorUserId: 'cmd-1', userId: 'log-1', role: ROLES.LOGISTICIAN });

  const state = lobby.getRoom('alpha');
  assert.equal(state.observers.length, 1);
  assert.equal(state.limits.observers, MAX_OBSERVERS);
  assert.equal(state.batteries[0].guns[0].operatorUserId, 'gunner-1');
});
