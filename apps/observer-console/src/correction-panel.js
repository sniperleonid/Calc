export class CorrectionPanel {
  constructor({ observerId, assignedGunId = null, assignedBatteryId = null }) {
    this.observerId = observerId;
    this.assignedGunId = assignedGunId;
    this.assignedBatteryId = assignedBatteryId;
  }

  bindGun(gunId) {
    this.assignedGunId = gunId;
    this.assignedBatteryId = null;
  }

  bindBattery(batteryId) {
    this.assignedBatteryId = batteryId;
    this.assignedGunId = null;
  }

  createCorrection({ missionId, range, direction, mode }) {
    return {
      channel: 'observer.correction',
      payload: {
        missionId,
        observerId: this.observerId,
        assignedGunId: this.assignedGunId,
        assignedBatteryId: this.assignedBatteryId,
        correction: {
          range, // 'short' | 'over'
          direction, // 'left' | 'right'
          mode // 'repeat' | 'salvo'
        }
      }
    };
  }
}
