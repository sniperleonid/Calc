export class HudOverlay {
  constructor({ roomId, playerId }) {
    this.roomId = roomId;
    this.playerId = playerId;
    this.visible = true;
    this.buttons = [
      { id: 'btn-ready', label: 'Готов', action: 'mission.ready', enabled: true },
      { id: 'btn-fire', label: 'Огонь', action: 'mission.fire', enabled: true },
      { id: 'btn-correction', label: 'Корректировка', action: 'observer.correction', enabled: true },
      { id: 'btn-logistics', label: 'Логистика', action: 'logistics.request', enabled: true },
      { id: 'btn-drone', label: 'Запуск дрона', action: 'observer.drone.launch', enabled: true }
    ];
  }

  toggleVisibility() {
    this.visible = !this.visible;
    return this.visible;
  }

  click(buttonId) {
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

  snapshot() {
    return {
      roomId: this.roomId,
      playerId: this.playerId,
      visible: this.visible,
      buttons: this.buttons.map((button) => ({ ...button }))
    };
  }
}
