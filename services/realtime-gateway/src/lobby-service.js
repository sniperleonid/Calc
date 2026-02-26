const MAX_BATTERIES = 5;
const MAX_GUNS_PER_BATTERY = 5;
const MAX_OBSERVERS = 5;

const ROLES = Object.freeze({
  COMMANDER: 'commander',
  GUNNER: 'gunner',
  OBSERVER: 'observer',
  LOGISTICIAN: 'logistician',
  INFANTRY: 'infantry'
});

export class LobbyService {
  constructor() {
    this.rooms = new Map();
  }

  createRoom({ roomId, password, commanderUserId, batteriesCount = MAX_BATTERIES }) {
    if (!roomId || !password || !commanderUserId) {
      throw new Error('roomId, password and commanderUserId are required');
    }

    if (this.rooms.has(roomId)) {
      throw new Error(`Room already exists: ${roomId}`);
    }

    if (batteriesCount < 1 || batteriesCount > MAX_BATTERIES) {
      throw new Error(`Batteries count must be between 1 and ${MAX_BATTERIES}`);
    }

    const room = {
      roomId,
      password,
      commanderUserId,
      members: new Map([[commanderUserId, { userId: commanderUserId, role: ROLES.COMMANDER }]]),
      roleAssignments: new Map([[commanderUserId, ROLES.COMMANDER]]),
      batteries: this.#createBatteries(batteriesCount),
      observers: new Set()
    };

    this.rooms.set(roomId, room);
    return this.getRoom(roomId);
  }

  joinRoom({ roomId, password, userId }) {
    const room = this.#requireRoom(roomId);
    if (room.password !== password) {
      throw new Error('Invalid room password');
    }

    if (!room.members.has(userId)) {
      room.members.set(userId, { userId, role: null });
    }

    return this.getRoom(roomId);
  }

  assignRole({ roomId, actorUserId, userId, role, batteryId = null, gunId = null }) {
    const room = this.#requireRoom(roomId);
    if (actorUserId !== room.commanderUserId) {
      throw new Error('Only commander can assign roles');
    }

    if (!Object.values(ROLES).includes(role)) {
      throw new Error(`Unsupported role: ${role}`);
    }

    const member = room.members.get(userId);
    if (!member) {
      throw new Error(`User is not in room: ${userId}`);
    }

    this.#clearRole(room, userId);

    if (role === ROLES.OBSERVER) {
      if (room.observers.size >= MAX_OBSERVERS) {
        throw new Error(`Room supports up to ${MAX_OBSERVERS} observers`);
      }
      room.observers.add(userId);
    }

    if (role === ROLES.GUNNER) {
      if (!batteryId || !gunId) {
        throw new Error('batteryId and gunId are required for gunner');
      }

      const battery = room.batteries.find((item) => item.batteryId === batteryId);
      if (!battery) throw new Error(`Unknown battery: ${batteryId}`);

      const gun = battery.guns.find((item) => item.gunId === gunId);
      if (!gun) throw new Error(`Unknown gun: ${gunId}`);
      if (gun.operatorUserId) {
        throw new Error(`Gun already assigned: ${gunId}`);
      }

      gun.operatorUserId = userId;
    }

    member.role = role;
    room.roleAssignments.set(userId, role);

    return this.getRoom(roomId);
  }

  getRoom(roomId) {
    const room = this.#requireRoom(roomId);

    return {
      roomId: room.roomId,
      commanderUserId: room.commanderUserId,
      members: Array.from(room.members.values()),
      batteries: room.batteries.map((battery) => ({
        batteryId: battery.batteryId,
        guns: battery.guns.map((gun) => ({ ...gun }))
      })),
      observers: Array.from(room.observers.values()),
      limits: {
        batteries: MAX_BATTERIES,
        gunsPerBattery: MAX_GUNS_PER_BATTERY,
        observers: MAX_OBSERVERS
      }
    };
  }

  #createBatteries(count) {
    return Array.from({ length: count }, (_, batteryIndex) => ({
      batteryId: `battery-${batteryIndex + 1}`,
      guns: Array.from({ length: MAX_GUNS_PER_BATTERY }, (_, gunIndex) => ({
        gunId: `gun-${batteryIndex + 1}-${gunIndex + 1}`,
        operatorUserId: null
      }))
    }));
  }

  #clearRole(room, userId) {
    room.observers.delete(userId);

    for (const battery of room.batteries) {
      for (const gun of battery.guns) {
        if (gun.operatorUserId === userId) {
          gun.operatorUserId = null;
        }
      }
    }
  }

  #requireRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room not found: ${roomId}`);
    return room;
  }
}

export { MAX_BATTERIES, MAX_GUNS_PER_BATTERY, MAX_OBSERVERS, ROLES };
