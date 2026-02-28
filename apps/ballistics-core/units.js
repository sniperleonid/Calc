export const NATO_MILS_PER_CIRCLE = 6400;
export const SOVIET_MILS_PER_CIRCLE = 6000;

export function degToRad(deg) { return (deg * Math.PI) / 180; }
export function radToDeg(rad) { return (rad * 180) / Math.PI; }
export function milToRad(mil, milsPerCircle = NATO_MILS_PER_CIRCLE) {
  return (mil * 2 * Math.PI) / milsPerCircle;
}
export function radToMil(rad, milsPerCircle = NATO_MILS_PER_CIRCLE) {
  return (rad * milsPerCircle) / (2 * Math.PI);
}
export function wrapDeg(deg) { return ((deg % 360) + 360) % 360; }
export function hypot2(x, y) { return Math.hypot(x, y); }
export function hypot3(x, y, z) { return Math.hypot(x, y, z); }
