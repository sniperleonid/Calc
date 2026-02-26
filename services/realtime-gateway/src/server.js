import { EventEmitter } from 'node:events';
import { MissionJournal } from './mission-journal.js';

export const CHANNELS = [
  'mission.assign',
  'gun.status',
  'observer.correction',
  'logistics.request'
];

export class RealtimeGateway {
  constructor() {
    this.bus = new EventEmitter();
    this.journal = new MissionJournal();
    this.assignments = new Map();
  }

  subscribe(channel, listener) {
    if (!CHANNELS.includes(channel)) {
      throw new Error(`Unsupported channel: ${channel}`);
    }
    this.bus.on(channel, listener);
    return () => this.bus.off(channel, listener);
  }

  publish(channel, payload) {
    if (!CHANNELS.includes(channel)) {
      throw new Error(`Unsupported channel: ${channel}`);
    }

    switch (channel) {
      case 'mission.assign':
        this.#handleMissionAssign(payload);
        break;
      case 'gun.status':
        this.#handleGunStatus(payload);
        break;
      case 'observer.correction':
        this.#handleObserverCorrection(payload);
        break;
      case 'logistics.request':
        this.#handleLogisticsRequest(payload);
        break;
      default:
        break;
    }

    this.bus.emit(channel, payload);
  }

  getMissionJournal(missionId) {
    return this.journal.get(missionId);
  }

  #handleMissionAssign(payload) {
    const { missionId, gunId, observerId } = payload;
    if (!missionId || !gunId || !observerId) return;

    this.assignments.set(missionId, { gunId, observerId });
    this.journal.append(missionId, {
      type: 'mission.assigned',
      gunId,
      observerId,
      at: new Date().toISOString()
    });
  }

  #handleGunStatus(payload) {
    if (!payload?.missionId) return;
    this.journal.append(payload.missionId, {
      type: 'gun.status',
      ...payload,
      at: new Date().toISOString()
    });
  }

  #handleLogisticsRequest(payload) {
    if (!payload?.missionId) return;
    this.journal.append(payload.missionId, {
      type: 'logistics.request',
      ...payload,
      at: new Date().toISOString()
    });
  }

  #handleObserverCorrection(payload) {
    const { missionId } = payload;
    if (!missionId) return;

    const assignment = this.assignments.get(missionId);
    const delivery = {
      ...payload,
      assignedGunId: assignment?.gunId ?? null,
      autoDelivered: Boolean(assignment?.gunId)
    };

    this.journal.append(missionId, {
      type: 'observer.correction',
      ...delivery,
      at: new Date().toISOString()
    });

    if (assignment?.gunId) {
      this.bus.emit('gun.status', {
        missionId,
        gunId: assignment.gunId,
        requestedCorrection: payload.correction,
        sourceObserverId: payload.observerId,
        relay: 'auto-delivery'
      });
    }
  }
}
