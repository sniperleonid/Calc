export function rk4Step(state, dt, derivs) {
  const k1 = derivs(state);
  const s2 = state.map((v, i) => v + (dt * k1[i]) / 2);
  const k2 = derivs(s2);
  const s3 = state.map((v, i) => v + (dt * k2[i]) / 2);
  const k3 = derivs(s3);
  const s4 = state.map((v, i) => v + dt * k3[i]);
  const k4 = derivs(s4);
  return state.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
