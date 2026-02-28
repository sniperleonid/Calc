export const NATO_MILS_PER_CIRCLE = 6400;

export function degToRad(deg) { return (deg * Math.PI) / 180; }
export function radToDeg(rad) { return (rad * 180) / Math.PI; }
export function milToRad(mil) { return (mil * 2 * Math.PI) / NATO_MILS_PER_CIRCLE; }
export function radToMil(rad) { return (rad * NATO_MILS_PER_CIRCLE) / (2 * Math.PI); }
export function wrapDeg(deg) { return ((deg % 360) + 360) % 360; }
export function hypot2(x, y) { return Math.hypot(x, y); }
export function hypot3(x, y, z) { return Math.hypot(x, y, z); }
