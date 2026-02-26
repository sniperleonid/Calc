export class HudOverlay {
  constructor({ roomId, playerId, batteryId = null, gunIds = [] }) {
    this.roomId = roomId;
    this.playerId = playerId;
    this.visible = true;
    this.roleScope = {
      batteryId,
      gunIds: [...gunIds],
      isBatteryCommander: false
    };
    this.buttons = [
      { id: 'btn-ready', label: 'Готов', action: 'mission.ready', enabled: true },
      { id: 'btn-fire', label: 'Огонь', action: 'mission.fire', enabled: true },
      { id: 'btn-correction', label: 'Корректировка', action: 'observer.correction', enabled: true },
      { id: 'btn-logistics', label: 'Логистика', action: 'logistics.request', enabled: true },
      { id: 'btn-drone', label: 'Запуск дрона', action: 'observer.drone.launch', enabled: true }
    ];
    this.applyRole('commander');
  }

  toggleVisibility() {
    this.visible = !this.visible;
    return this.visible;
  }

  click(buttonId) {
    if (!this.visible) {
      throw new Error('HUD is hidden');
    }
    const button = this.buttons.find((item) => item.id === buttonId);
    if (!button) throw new Error(`Unknown HUD button: ${buttonId}`);
    if (!button.enabled) throw new Error(`HUD button disabled: ${buttonId}`);

    return {
      roomId: this.roomId,
      playerId: this.playerId,
      action: button.action,
      label: button.label
    };
  }

  applyRole(role) {
    const permissions = {
      commander: ['btn-ready', 'btn-fire', 'btn-correction', 'btn-logistics', 'btn-drone'],
      'battery-commander': ['btn-ready', 'btn-fire', 'btn-logistics'],
      gunner: ['btn-ready', 'btn-fire'],
      observer: ['btn-correction', 'btn-drone'],
    };

    const enabledButtons = new Set(permissions[role] ?? []);
    this.buttons = this.buttons.map((button) => ({
      ...button,
      enabled: enabledButtons.has(button.id),
    }));
    return this.snapshot();
  }

  assignBatteryCommander(batteryId) {
    this.roleScope.batteryId = batteryId;
    this.roleScope.isBatteryCommander = true;
    return this.snapshot();
  }

  assignGuns(gunIds) {
    this.roleScope.gunIds = [...gunIds];
    this.roleScope.isBatteryCommander = false;
    return this.snapshot();
  }

  shouldReceiveMission(event) {
    if (!event) return false;

    if (this.roleScope.isBatteryCommander) {
      return event.batteryId === this.roleScope.batteryId;
    }

    const targets = Array.isArray(event.gunIds) ? event.gunIds : [event.gunId].filter(Boolean);
    return targets.some((gunId) => this.roleScope.gunIds.includes(gunId));
  }

  snapshot() {
    return {
      roomId: this.roomId,
      playerId: this.playerId,
      visible: this.visible,
      roleScope: {
        ...this.roleScope,
        gunIds: [...this.roleScope.gunIds]
      },
      buttons: this.buttons.map((button) => ({ ...button }))
    };
  }
}
