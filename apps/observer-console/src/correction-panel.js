export class CorrectionPanel {
  constructor({ observerId, assignedGunId = null }) {
    this.observerId = observerId;
    this.assignedGunId = assignedGunId;
  }

  bindGun(gunId) {
    this.assignedGunId = gunId;
  }

  createCorrection({ missionId, range, direction, mode }) {
    return {
      channel: 'observer.correction',
      payload: {
        missionId,
        observerId: this.observerId,
        assignedGunId: this.assignedGunId,
        correction: {
          range, // 'short' | 'over'
          direction, // 'left' | 'right'
          mode // 'repeat' | 'salvo'
        }
      }
    };
  }
}
