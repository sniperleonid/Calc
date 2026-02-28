import { degToRad, wrapDeg } from './units.js';

export function bearingFromNorthRad(dx, dy) {
  return Math.atan2(dx, dy);
}

export function distance2D(dx, dy) {
  return Math.hypot(dx, dy);
}

export function rotateWorldToFireFrame(wx, wy, bearingRad) {
  return {
    along: wx * Math.sin(bearingRad) + wy * Math.cos(bearingRad),
    cross: wx * Math.cos(bearingRad) - wy * Math.sin(bearingRad),
  };
}

export function windFromSpeedDir(speedMps, fromDeg) {
  const toDeg = wrapDeg(fromDeg + 180);
  const toRad = degToRad(toDeg);
  return {
    wx: speedMps * Math.sin(toRad),
    wy: speedMps * Math.cos(toRad),
  };
}

export function targetFromObserver(observer, distance, bearingDeg) {
  const rad = degToRad(bearingDeg);
  return {
    x: observer.x + distance * Math.sin(rad),
    y: observer.y + distance * Math.cos(rad),
  };
}
