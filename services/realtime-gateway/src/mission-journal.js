export class MissionJournal {
  constructor() {
    this.entries = new Map();
  }

  append(missionId, event) {
    if (!missionId) return;
    if (!this.entries.has(missionId)) {
      this.entries.set(missionId, []);
    }

    this.entries.get(missionId).push(event);
  }

  get(missionId) {
    return this.entries.get(missionId) ?? [];
  }
}
