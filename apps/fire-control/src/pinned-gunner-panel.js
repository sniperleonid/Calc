export class PinnedGunnerPanel {
  constructor({ gunId }) {
    this.state = {
      gunId,
      pinned: true,
      azimuth: null,
      elevation: null,
      charge: null,
      gunStatus: 'idle',
      readyConfirmed: false,
      ammoRequested: false
    };
  }

  updateBallisticData({ azimuth, elevation, charge }) {
    this.state.azimuth = azimuth;
    this.state.elevation = elevation;
    this.state.charge = charge;
  }

  setGunStatus(status) {
    this.state.gunStatus = status;
  }

  confirmReady() {
    this.state.readyConfirmed = true;
    this.state.gunStatus = 'ready';

    return {
      channel: 'gun.status',
      payload: {
        gunId: this.state.gunId,
        status: 'ready'
      }
    };
  }

  requestAmmo({ missionId, type, quantity }) {
    this.state.ammoRequested = true;

    return {
      channel: 'logistics.request',
      payload: {
        missionId,
        gunId: this.state.gunId,
        type,
        quantity
      }
    };
  }

  snapshot() {
    return { ...this.state };
  }
}
