export function createCounterBatteryModule(deps) {
  const {
    state,
    t,
    cbMethodSelect,
    cbObservationsContainer,
    cbOutput,
    readXYFromInputs,
    getObserverEntries,
    getObserverDisplayName,
    getSelectedMissionTargetId,
    getMissionTargets,
    updateMissionTargetInputsFromState,
    persistLauncherSettings,
    storeCurrentMissionTargetInputs,
    getAllGunPoints,
    getArtilleryProfiles,
    gunProfiles,
    clamp,
    getGunSetting,
    getBatteryDisplayName,
    normalizeAzimuth,
    getAzimuthDelta,
  } = deps;

  function bearingToDirection(azimuthDeg) {
    const rad = (normalizeAzimuth(azimuthDeg) * Math.PI) / 180;
    return { x: Math.sin(rad), y: Math.cos(rad) };
  }

  function intersectBearings(p1, az1, p2, az2) {
    const d1 = bearingToDirection(az1);
    const d2 = bearingToDirection(az2);
    const denom = (d1.x * d2.y) - (d1.y * d2.x);
    if (Math.abs(denom) < 1e-6) return null;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const k = ((dx * d2.y) - (dy * d2.x)) / denom;
    return { x: p1.x + d1.x * k, y: p1.y + d1.y * k };
  }

  function getBatteryGunMaxRange(profile) {
    const ranges = {
      'mortar-120-standard': 7200,
      'd30-standard': 15300,
      'm777-howitzer': 24000,
    };
    return ranges[profile] ?? 12000;
  }

  function render() {
    if (!cbMethodSelect || !cbObservationsContainer) return;
    const cb = state.settings.counterBattery ?? {};
    cbMethodSelect.value = cb.method ?? 'azimuth-triangulation';
    document.querySelector('#cb-sound-bearing').value = cb.soundBearing ?? '';
    document.querySelector('#cb-est-distance').value = cb.estimatedDistance ?? '';
    document.querySelector('#cb-tdoa-delta').value = cb.tdoaDeltaMs ?? '';
    document.querySelector('#cb-impact-bearing').value = cb.impactBearing ?? '';

    const source = (cb.observations?.length ? cb.observations : [{ observerId: '1', azimuth: '', soundDelaySec: '' }, { observerId: '2', azimuth: '', soundDelaySec: '' }]);
    cbObservationsContainer.innerHTML = source.map((entry, index) => {
      const options = getObserverEntries().map((observerId) => `<option value="${observerId}">${getObserverDisplayName(observerId)}</option>`).join('');
      return `<div class="observer-row" data-cb-point="${index + 1}"><p class="hint">${t('cbObserverPoint')} ${index + 1}</p><div class="pair pair-3"><select data-cb-observer>${options}</select><input data-cb-azimuth type="number" min="0" max="359.9" step="0.1" placeholder="${t('cbObservationAzimuth')}" value="${entry.azimuth ?? ''}" /><input data-cb-delay type="number" min="0" step="0.01" placeholder="${t('cbObservationDelay')}" value="${entry.soundDelaySec ?? ''}" /></div></div>`;
    }).join('');

    Array.from(cbObservationsContainer.querySelectorAll('[data-cb-point]')).forEach((row, index) => {
      const entry = source[index] ?? {};
      const select = row.querySelector('[data-cb-observer]');
      if (select) select.value = entry.observerId ?? String(Math.min(index + 1, getObserverEntries().length || 1));
    });
  }

  function collectObservations() {
    return Array.from(document.querySelectorAll('[data-cb-point]')).map((row) => {
      const observerId = Number(row.querySelector('[data-cb-observer]')?.value || 0);
      const point = readXYFromInputs(
        document.querySelector(`[data-observer-x="${observerId}"]`),
        document.querySelector(`[data-observer-y="${observerId}"]`),
      );
      if (!point) return null;
      return {
        observerId,
        point,
        azimuth: Number(row.querySelector('[data-cb-azimuth]')?.value),
        soundDelaySec: Number(row.querySelector('[data-cb-delay]')?.value),
      };
    }).filter(Boolean);
  }

  function locateEnemyGun() {
    const method = cbMethodSelect?.value ?? 'azimuth-triangulation';
    const observations = collectObservations();
    if (observations.length < 2) {
      cbOutput.textContent = t('cbNeedTwoPoints');
      return null;
    }

    const first = observations[0];
    const second = observations[1];
    let estimated = null;

    if (method === 'azimuth-triangulation') {
      estimated = intersectBearings(first.point, first.azimuth, second.point, second.azimuth);
    } else if (method === 'crater-analysis') {
      const craterBearing = Number(document.querySelector('#cb-impact-bearing')?.value);
      const backAzimuth = normalizeAzimuth(craterBearing + 180);
      estimated = intersectBearings(first.point, first.azimuth, second.point, backAzimuth);
    } else if (method === 'sound-ranging') {
      const bearing = Number(document.querySelector('#cb-sound-bearing')?.value);
      const distance = Number(document.querySelector('#cb-est-distance')?.value || 0);
      const direction = bearingToDirection(bearing);
      estimated = {
        x: first.point.x + direction.x * distance,
        y: first.point.y + direction.y * distance,
      };
    } else {
      const deltaMs = Number(document.querySelector('#cb-tdoa-delta')?.value || 0);
      const distanceDiff = (deltaMs / 1000) * 343;
      const base = intersectBearings(first.point, first.azimuth, second.point, second.azimuth);
      if (base) {
        const mid = { x: (first.point.x + second.point.x) / 2, y: (first.point.y + second.point.y) / 2 };
        const p1Dist = Math.hypot(base.x - first.point.x, base.y - first.point.y);
        const correction = distanceDiff / 2;
        const scale = (p1Dist + correction) / (p1Dist || 1);
        estimated = { x: mid.x + (base.x - mid.x) * scale, y: mid.y + (base.y - mid.y) * scale };
      }
    }

    if (!estimated || !Number.isFinite(estimated.x) || !Number.isFinite(estimated.y)) {
      cbOutput.textContent = t('cbTargetNotFound');
      return null;
    }

    state.settings.counterBattery = {
      ...(state.settings.counterBattery ?? {}),
      method,
      target: estimated,
    };
    const selectedTargetId = getSelectedMissionTargetId();
    const missionTargets = getMissionTargets().map((target) => (target.id === selectedTargetId
      ? { ...target, x: String(Math.round(estimated.x)), y: String(Math.round(estimated.y)), active: true }
      : target));
    state.settings.mission = {
      ...(state.settings.mission ?? {}),
      targets: missionTargets,
      activeTargetId: selectedTargetId,
    };
    updateMissionTargetInputsFromState();
    persistLauncherSettings();
    cbOutput.textContent = `${t('cbTargetLocated')}: X=${estimated.x.toFixed(1)} Y=${estimated.y.toFixed(1)}\n${t('cbMethodUsed')}: ${t(method === 'sound-ranging' ? 'cbMethodSound' : method === 'crater-analysis' ? 'cbMethodCrater' : method === 'hyperbola-tdoa' ? 'cbMethodHyperbola' : 'cbMethodTriangulation')}`;
    return estimated;
  }

  function calculateResponse() {
    storeCurrentMissionTargetInputs(getSelectedMissionTargetId());
    const activeTarget = getMissionTargets().find((target) => target.id === getSelectedMissionTargetId());
    const target = readXYFromInputs({ value: activeTarget?.x ?? '' }, { value: activeTarget?.y ?? '' })
      ?? state.settings.counterBattery?.target
      ?? locateEnemyGun();
    if (!target) return;
    const rows = [];
    getAllGunPoints().forEach((gun) => {
      const profileId = state.settings.batteryConfig?.[String(gun.batteryId)]?.gunProfile ?? gunProfiles[0];
      const profile = getArtilleryProfiles()[profileId] ?? {};
      const maxRange = Math.max(0, Number(profile.maxRange) || getBatteryGunMaxRange(profileId));
      const minRange = Math.max(0, Number(profile.minRange) || 0);
      const traverseDeg = clamp(Number(profile.traverseDeg) || 360, 1, 360);
      const heading = getGunSetting(`${gun.batteryId}-${gun.gunId}`).heading;
      const dx = target.x - gun.x;
      const dy = target.y - gun.y;
      const distance = Math.hypot(dx, dy);
      if (distance > maxRange || distance < minRange) return;
      const azimuth = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
      const headingSet = heading < 360;
      const rotateDelta = headingSet ? getAzimuthDelta(heading, azimuth) : 180;
      const inTraverse = !headingSet || traverseDeg >= 360 || rotateDelta <= traverseDeg / 2;
      rows.push({
        distance,
        rotateDelta,
        inTraverse,
        text: `${getBatteryDisplayName(gun.batteryId)} ${t('gun')} ${gun.gunId}: D=${distance.toFixed(1)}m Az=${azimuth.toFixed(1)}°${headingSet ? ` ${t('cbGunFacing')}${heading.toFixed(1)}° Δ=${rotateDelta.toFixed(1)}°` : ''}${inTraverse ? '' : ` ${t('cbNeedsReposition')}`}`,
      });
    });

    if (!rows.length) {
      cbOutput.textContent = `${cbOutput.textContent}\n\n${t('cbNoReachableGuns')}`;
      return;
    }

    rows.sort((a, b) => {
      if (a.inTraverse !== b.inTraverse) return Number(b.inTraverse) - Number(a.inTraverse);
      if (a.rotateDelta !== b.rotateDelta) return a.rotateDelta - b.rotateDelta;
      return a.distance - b.distance;
    });

    const lines = rows.map((entry, index) => `${index === 0 ? `${t('cbRecommendedGun')} ` : ''}${entry.text}`);
    cbOutput.textContent = `${cbOutput.textContent}\n\n${t('cbResponseHeader')}:\n${lines.join('\n')}`;
  }

  function addObservationPoint() {
    const current = state.settings.counterBattery?.observations ?? [];
    state.settings.counterBattery = { ...(state.settings.counterBattery ?? {}), observations: [...current, { observerId: '1', azimuth: '', soundDelaySec: '' }] };
    render();
  }

  function clearObservationPoints() {
    state.settings.counterBattery = { ...(state.settings.counterBattery ?? {}), observations: [] };
    render();
    cbOutput.textContent = '';
  }

  return {
    render,
    locateEnemyGun,
    calculateResponse,
    addObservationPoint,
    clearObservationPoints,
  };
}
