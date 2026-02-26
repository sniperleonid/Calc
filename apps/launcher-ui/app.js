const SETTINGS_KEY = 'calc.launcherSettings';

function loadLauncherSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      batteryCount: Number(parsed.batteryCount) || 1,
      gunsPerBattery: Number(parsed.gunsPerBattery) || 1,
      observerCount: Number(parsed.observerCount) || 1,
      batteryConfig: parsed.batteryConfig ?? {},
      gunCoords: parsed.gunCoords ?? {},
      observerBindings: parsed.observerBindings ?? {},
      mission: parsed.mission ?? {},
    };
  } catch {
    return {
      batteryCount: 1,
      gunsPerBattery: 1,
      observerCount: 1,
      batteryConfig: {},
      gunCoords: {},
      observerBindings: {},
      mission: {},
    };
  }
}

const state = {
  lang: localStorage.getItem('calc.lang') || 'ru',
  theme: localStorage.getItem('calc.theme') || 'terminal',
  mapUrl: localStorage.getItem('calc.mapUrl') || '',
  settings: loadLauncherSettings(),
};

const i18n = {
  ru: {
    appVersion: 'Calc v1', appTitle: 'Баллистический калькулятор', appSubtitle: 'Единая оболочка для планирования огневых задач и оперативных данных.',
    tabHome: 'Главная', tabGlobal: 'Глобальные настройки', tabFire: 'Огневые задачи', tabMap: 'Карта', tabSafety: 'Безопасность и данные', tabSettings: 'Настройки',
    homeConfiguration: 'Глобальные настройки', homeFire: 'Огневые задачи', homeMap: 'Карта и интеграции', openApi: 'Открыть API', editGlobalData: 'Настроить орудия, батареи и наблюдателей',
    openMissionPlanner: 'Открыть вкладку задач', checkServices: 'Проверить сервисы', openMap: 'Открыть карту', mapUrl: 'URL внешней карты (необязательно)',
    sectionConfigTitle: 'Параметры батарей и орудий', batteryCount: 'Количество батарей', batteryHeightHint: 'Высота задаётся отдельно для каждой батареи и применяется ко всем орудиям этой батареи.',
    batteryHeight: 'Высота батареи (м)', gunsPerBattery: 'Орудий в батарее', coordinatesTitle: 'Координаты и наблюдатели', gunsHint: 'Для каждого орудия укажите координаты карты.',
    observerTitle: 'Наблюдатели и привязки', observerCount: 'Количество наблюдателей (до 10)', observerBinding: 'Привязка наблюдателя',
    bindToGun: 'К орудию', bindToBattery: 'К батарее', gunnerHint: 'Все расчёты выполняются на основе глобальных настроек.',
    actionsTitle: 'Действия', calculate: 'Рассчитать', showMto: 'Показать MTO', logMission: 'Сохранить миссию',
    missionTitle: 'Калькулятор огневой задачи', missionName: 'Название задачи', missionBattery: 'Батарея', missionGun: 'Орудие (или все в батарее)', targetX: 'Координата цели X', targetY: 'Координата цели Y',
    mapPanelTitle: 'Тактическая карта (Leaflet)', mapLegendTitle: 'Легенда', mapLegendHint: 'Карта показывает орудия выбранной батареи и текущую цель из вкладки «Огневые задачи».',
    syncMap: 'Синхронизировать с координатами', centerTarget: 'Центр на цели',
    safeDataTitle: 'Контроль данных', safeDataDescription: 'Проверка журналов и экспорт служебных данных.', openLogs: 'Открыть логи', exportData: 'Экспорт данных', clearAllData: 'Очистить данные',
    serviceState: 'Состояние сервисов', generalSettings: 'Общие настройки', language: 'Язык', theme: 'Тема', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: запущен', ballisticsWarn: '⚠️ Ballistics Core: не отвечает. Проверьте Python и uvicorn.', gatewayOk: '✅ Realtime Gateway: запущен', gatewayWarn: '⚠️ Realtime Gateway: не отвечает.',
    dataCleared: 'Локальные данные очищены', battery: 'Батарея', gun: 'Орудие', observer: 'Наблюдатель', x: 'X', y: 'Y',
    allGuns: 'Все орудия батареи', gunProfile: 'Профиль орудия', projectileProfile: 'Профиль снаряда',
    calcDone: 'Расчёт выполнен', mtoHeader: 'MTO: расход по выбранным орудиям', missionSaved: 'Миссия сохранена', noMissions: 'Сохранённых миссий нет',
    logsError: 'Не удалось загрузить логи', exportReady: 'Экспорт данных подготовлен', noLogsYet: 'Логи пока не найдены',
    target: 'Цель', openedExternalMap: 'Открыта внешняя карта'
  },
  en: {
    appVersion: 'Calc v1', appTitle: 'Ballistics Calculator', appSubtitle: 'Unified shell for fire mission planning and operational data.',
    tabHome: 'Home', tabGlobal: 'Global settings', tabFire: 'Fire Missions', tabMap: 'Map', tabSafety: 'Safety & Data', tabSettings: 'Settings',
    homeConfiguration: 'Global settings', homeFire: 'Fire Missions', homeMap: 'Map & integrations', openApi: 'Open API', editGlobalData: 'Configure guns, batteries and observers',
    openMissionPlanner: 'Open missions tab', checkServices: 'Check services', openMap: 'Open map', mapUrl: 'External map URL (optional)',
    sectionConfigTitle: 'Battery and gun parameters', batteryCount: 'Battery count', batteryHeightHint: 'Each battery has an independent altitude applied to every gun in that battery.',
    batteryHeight: 'Battery altitude (m)', gunsPerBattery: 'Guns per battery', coordinatesTitle: 'Coordinates and observers', gunsHint: 'Set map coordinates for each gun.',
    observerTitle: 'Observers and bindings', observerCount: 'Observers count (up to 10)', observerBinding: 'Observer binding',
    bindToGun: 'To gun', bindToBattery: 'To battery', gunnerHint: 'All calculations use data from global settings.',
    actionsTitle: 'Actions', calculate: 'Calculate', showMto: 'Show MTO', logMission: 'Save mission',
    missionTitle: 'Fire mission calculator', missionName: 'Mission name', missionBattery: 'Battery', missionGun: 'Gun (or full battery)', targetX: 'Target X coordinate', targetY: 'Target Y coordinate',
    mapPanelTitle: 'Tactical map (Leaflet)', mapLegendTitle: 'Legend', mapLegendHint: 'The map shows guns in selected battery and the current target from Fire Missions tab.',
    syncMap: 'Sync with coordinates', centerTarget: 'Center on target',
    safeDataTitle: 'Data control', safeDataDescription: 'Check logs and export service data.', openLogs: 'Open logs', exportData: 'Export data', clearAllData: 'Clear data',
    serviceState: 'Service status', generalSettings: 'General settings', language: 'Language', theme: 'Theme', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: online', ballisticsWarn: '⚠️ Ballistics Core: unavailable. Check Python and uvicorn.', gatewayOk: '✅ Realtime Gateway: online', gatewayWarn: '⚠️ Realtime Gateway: unavailable.',
    dataCleared: 'Local data has been cleared', battery: 'Battery', gun: 'Gun', observer: 'Observer', x: 'X', y: 'Y',
    allGuns: 'All guns in battery', gunProfile: 'Gun profile', projectileProfile: 'Projectile profile',
    calcDone: 'Calculation complete', mtoHeader: 'MTO: ammo usage for selected guns', missionSaved: 'Mission saved', noMissions: 'No saved missions',
    logsError: 'Failed to load logs', exportReady: 'Data export ready', noLogsYet: 'No logs found yet',
    target: 'Target', openedExternalMap: 'Opened external map'
  },
};

const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = Array.from(document.querySelectorAll('.tab-panel'));
const healthBtn = document.querySelector('#health-check');
const clearDataBtn = document.querySelector('#clear-data');
const openLogsBtn = document.querySelector('#open-logs');
const exportDataBtn = document.querySelector('#export-data');
const languageSelect = document.querySelector('#language');
const themeSelect = document.querySelector('#theme');
const batteryCountInput = document.querySelector('#battery-count');
const gunsPerBatteryInput = document.querySelector('#guns-per-battery');
const observerCountInput = document.querySelector('#observer-count');
const mapUrlInput = document.querySelector('#map-url');
const missionBatterySelect = document.querySelector('#mission-battery');
const missionGunSelect = document.querySelector('#mission-gun');
const fireOutput = document.querySelector('#fire-output');
const safetyOutput = document.querySelector('#safety-output');
const mapLegend = document.querySelector('#map-legend');

const t = (key) => i18n[state.lang][key] ?? key;

const gunProfiles = ['mortar-120-standard', 'm777-howitzer', 'd30-standard'];
const projectileProfiles = ['he-charge-3', 'smoke-charge-2', 'illum'];

let leafletMap;
let targetMarker;
const gunMarkers = [];

function persistLauncherSettings() {
  state.settings.batteryCount = Number(batteryCountInput?.value || 1);
  state.settings.gunsPerBattery = Number(gunsPerBatteryInput?.value || 1);
  state.settings.observerCount = Number(observerCountInput?.value || 1);

  state.settings.batteryConfig = {};
  document.querySelectorAll('[data-battery-height]').forEach((input) => {
    const batteryId = input.dataset.batteryHeight;
    state.settings.batteryConfig[batteryId] = {
      height: input.value,
      gunProfile: document.querySelector(`[data-battery-gun-profile="${batteryId}"]`)?.value ?? gunProfiles[0],
      projectileProfile: document.querySelector(`[data-battery-projectile-profile="${batteryId}"]`)?.value ?? projectileProfiles[0],
      title: document.querySelector(`[data-battery-title="${batteryId}"]`)?.value ?? `${t('battery')} ${batteryId}`,
    };
  });

  state.settings.gunCoords = {};
  document.querySelectorAll('[data-gun-x]').forEach((input) => {
    const key = input.dataset.gunX;
    state.settings.gunCoords[key] = {
      x: input.value,
      y: document.querySelector(`[data-gun-y="${key}"]`)?.value ?? '',
    };
  });

  state.settings.observerBindings = {};
  document.querySelectorAll('[data-observer-index]').forEach((input) => {
    const observerId = input.dataset.observerIndex;
    state.settings.observerBindings[observerId] = {
      mode: document.querySelector(`[data-observer-mode="${observerId}"]`)?.value ?? 'gun',
      gunId: document.querySelector(`[data-observer-gun="${observerId}"]`)?.value ?? 'gun-1-1',
      batteryId: document.querySelector(`[data-observer-battery="${observerId}"]`)?.value ?? 'battery-1',
    };
  });

  state.settings.mission = {
    name: document.querySelector('#mission-name')?.value ?? '',
    targetX: document.querySelector('#target-x')?.value ?? '',
    targetY: document.querySelector('#target-y')?.value ?? '',
    battery: missionBatterySelect?.value ?? '1',
    gun: missionGunSelect?.value ?? 'all',
  };

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function applyI18n() {
  document.documentElement.lang = state.lang;
  document.title = state.lang === 'ru' ? 'Calc · Баллистический калькулятор' : 'Calc · Ballistics Calculator';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  languageSelect.value = state.lang;
  themeSelect.value = state.theme;
  mapUrlInput.value = state.mapUrl;
  batteryCountInput.value = String(state.settings.batteryCount);
  gunsPerBatteryInput.value = String(state.settings.gunsPerBattery);
  observerCountInput.value = String(state.settings.observerCount);
  renderGlobalConfig();
  renderGunsGrid();
  renderObservers();
  renderMissionSelectors();
  refreshMapOverlay();
}

function switchTab(tabName) {
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === tabName));
  panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === tabName));
  if (tabName === 'map') {
    initializeMap();
    refreshMapOverlay();
  }
}

async function checkService(url, okKey, warnKey, selector) {
  const targets = document.querySelectorAll(`[data-service="${selector}"]`);
  try {
    const response = await fetch(url, { method: 'GET', mode: 'no-cors' });
    if (response.type === 'opaque' || response.ok) {
      targets.forEach((target) => { target.textContent = t(okKey); target.classList.remove('warn'); });
      return;
    }
  } catch {}
  targets.forEach((target) => { target.textContent = t(warnKey); target.classList.add('warn'); });
}

async function runHealthCheck() {
  await Promise.all([
    checkService('http://localhost:8000/docs', 'ballisticsOk', 'ballisticsWarn', 'ballistics'),
    checkService('http://localhost:3001/health', 'gatewayOk', 'gatewayWarn', 'gateway'),
  ]);
  document.querySelector('[data-service="ballistics-copy"]').textContent = document.querySelector('[data-service="ballistics"]')?.textContent || '';
  document.querySelector('[data-service="gateway-copy"]').textContent = document.querySelector('[data-service="gateway"]')?.textContent || '';
}

function clearLocalData() {
  localStorage.clear();
  state.settings = loadLauncherSettings();
  state.mapUrl = '';
  applyI18n();
  alert(t('dataCleared'));
}

function renderGlobalConfig() {
  const container = document.querySelector('#battery-config');
  if (!container) return;
  const batteries = Number(batteryCountInput?.value || 1);
  container.innerHTML = '';
  for (let b = 1; b <= batteries; b += 1) {
    const row = document.createElement('div');
    row.className = 'battery-config-row';
    const gunProfileOptions = gunProfiles.map((profile) => `<option value="${profile}">${profile}</option>`).join('');
    const projectileOptions = projectileProfiles.map((profile) => `<option value="${profile}">${profile}</option>`).join('');
    const saved = state.settings.batteryConfig[String(b)] ?? {};
    row.innerHTML = `
      <h3>${t('battery')} ${b}</h3>
      <div class="pair pair-4">
        <input type="number" data-battery-height="${b}" placeholder="${t('batteryHeight')}" value="${saved.height ?? 0}" />
        <select data-battery-gun-profile="${b}">${gunProfileOptions}</select>
        <select data-battery-projectile-profile="${b}">${projectileOptions}</select>
        <input data-battery-title="${b}" value="${saved.title ?? `${t('battery')} ${b}`}" />
      </div>
      <p class="hint compact">${t('batteryHeight')} · ${t('gunProfile')} · ${t('projectileProfile')}</p>`;
    container.append(row);
    row.querySelector(`[data-battery-gun-profile="${b}"]`).value = saved.gunProfile ?? gunProfiles[0];
    row.querySelector(`[data-battery-projectile-profile="${b}"]`).value = saved.projectileProfile ?? projectileProfiles[0];
  }
}

function renderGunsGrid() {
  const container = document.querySelector('#guns-coordinates');
  if (!container) return;
  const batteries = Number(batteryCountInput?.value || 1);
  const gunsPerBattery = Number(gunsPerBatteryInput?.value || 1);
  container.innerHTML = '';
  for (let b = 1; b <= batteries; b += 1) {
    for (let g = 1; g <= gunsPerBattery; g += 1) {
      const key = `${b}-${g}`;
      const saved = state.settings.gunCoords[key] ?? {};
      const row = document.createElement('div');
      row.className = 'pair';
      row.innerHTML = `<label>${t('battery')} ${b}, ${t('gun')} ${g}</label><input data-gun-x="${key}" type="number" placeholder="${t('x')}" value="${saved.x ?? 1000 + b * 100 + g * 10}" /><input data-gun-y="${key}" type="number" placeholder="${t('y')}" value="${saved.y ?? 1000 + b * 120 + g * 10}" />`;
      container.append(row);
    }
  }
}

function renderObservers() {
  const container = document.querySelector('#observer-bindings');
  if (!container) return;
  const observers = Number(observerCountInput?.value || 1);
  const batteries = Number(batteryCountInput?.value || 1);
  const gunsPerBattery = Number(gunsPerBatteryInput?.value || 1);
  const gunOptions = [];
  for (let b = 1; b <= batteries; b += 1) for (let g = 1; g <= gunsPerBattery; g += 1) gunOptions.push(`gun-${b}-${g}`);
  container.innerHTML = '';
  for (let i = 1; i <= observers; i += 1) {
    const saved = state.settings.observerBindings[String(i)] ?? {};
    const row = document.createElement('div');
    const batteryOptions = Array.from({ length: batteries }, (_, n) => `<option value="battery-${n + 1}">${t('battery')} ${n + 1}</option>`).join('');
    const gunOptionMarkup = gunOptions.map((id) => `<option value="${id}">${id}</option>`).join('');
    row.className = 'observer-row';
    row.innerHTML = `<label data-observer-index="${i}">${t('observer')} ${i}: ${t('observerBinding')}</label><div class="pair"><select data-observer-mode="${i}"><option value="gun">${t('bindToGun')}</option><option value="battery">${t('bindToBattery')}</option></select><select data-observer-gun="${i}">${gunOptionMarkup}</select><select data-observer-battery="${i}">${batteryOptions}</select></div>`;
    container.append(row);
    row.querySelector(`[data-observer-mode="${i}"]`).value = saved.mode ?? 'gun';
    row.querySelector(`[data-observer-gun="${i}"]`).value = saved.gunId ?? gunOptions[0];
    row.querySelector(`[data-observer-battery="${i}"]`).value = saved.batteryId ?? 'battery-1';
  }
}

function renderMissionSelectors() {
  const batteries = Number(batteryCountInput?.value || 1);
  const gunsPerBattery = Number(gunsPerBatteryInput?.value || 1);
  missionBatterySelect.innerHTML = Array.from({ length: batteries }, (_, index) => `<option value="${index + 1}">${t('battery')} ${index + 1}</option>`).join('');
  const savedMissionBattery = Number(state.settings.mission.battery || 1);
  missionBatterySelect.value = String(Math.min(Math.max(1, savedMissionBattery), batteries));

  const gunOptions = ['all', ...Array.from({ length: gunsPerBattery }, (_, idx) => `${idx + 1}`)];
  missionGunSelect.innerHTML = gunOptions.map((value) => `<option value="${value}">${value === 'all' ? t('allGuns') : `${t('gun')} ${value}`}</option>`).join('');
  missionGunSelect.value = gunOptions.includes(state.settings.mission.gun) ? state.settings.mission.gun : 'all';

  document.querySelector('#mission-name').value = state.settings.mission.name ?? '';
  document.querySelector('#target-x').value = state.settings.mission.targetX ?? '';
  document.querySelector('#target-y').value = state.settings.mission.targetY ?? '';
}

function getBatteryHeight(batteryId) {
  return Number(document.querySelector(`[data-battery-height="${batteryId}"]`)?.value || 0);
}

function calculateFire() {
  const targetX = Number(document.querySelector('#target-x')?.value || 0);
  const targetY = Number(document.querySelector('#target-y')?.value || 0);
  const battery = Number(missionBatterySelect.value || 1);
  const selectedGun = missionGunSelect.value;
  const gunsPerBattery = Number(gunsPerBatteryInput?.value || 1);
  const gunIds = selectedGun === 'all' ? Array.from({ length: gunsPerBattery }, (_, idx) => idx + 1) : [Number(selectedGun)];
  const batteryHeight = getBatteryHeight(battery);

  const results = gunIds.map((gunId) => {
    const gunX = Number(document.querySelector(`[data-gun-x="${battery}-${gunId}"]`)?.value || 0);
    const gunY = Number(document.querySelector(`[data-gun-y="${battery}-${gunId}"]`)?.value || 0);
    const dx = targetX - gunX;
    const dy = targetY - gunY;
    const distance = Math.hypot(dx, dy);
    const azimuth = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const elevationMils = ((Math.atan2(batteryHeight, distance || 1) * 1000) / Math.PI) * 17.7778;
    return { gunId, distance: distance.toFixed(1), azimuth: azimuth.toFixed(2), elevation: elevationMils.toFixed(1) };
  });

  const output = [`${t('calcDone')}: ${document.querySelector('#mission-name')?.value || 'Mission'}`,
    ...results.map((row) => `${t('gun')} ${row.gunId}: D=${row.distance}m Az=${row.azimuth}° Elev=${row.elevation} mil`)].join('\n');

  fireOutput.textContent = output;
  persistLauncherSettings();
  refreshMapOverlay();
  return { results, battery, selectedGun, targetX, targetY, batteryHeight };
}

function showMto() {
  const calc = calculateFire();
  const mtoRows = calc.results.map((row) => `${t('gun')} ${row.gunId}: HE x3, Smoke x1`).join('\n');
  fireOutput.textContent = `${fireOutput.textContent}\n\n${t('mtoHeader')}\n${mtoRows}`;
}

function saveMission() {
  const calc = calculateFire();
  const missions = JSON.parse(localStorage.getItem('calc.missions') || '[]');
  missions.push({
    name: document.querySelector('#mission-name')?.value || `Mission-${missions.length + 1}`,
    createdAt: new Date().toISOString(),
    ...calc,
  });
  localStorage.setItem('calc.missions', JSON.stringify(missions));
  fireOutput.textContent = `${fireOutput.textContent}\n\n${t('missionSaved')} (${missions.length})`;
}

function initializeMap() {
  if (leafletMap || !window.L) return;
  leafletMap = window.L.map('leaflet-map', { zoomControl: true }).setView([49.0, 32.0], 8);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(leafletMap);
  setTimeout(() => leafletMap.invalidateSize(), 0);
}

function mapPointToLatLng(x, y) {
  const lat = y / 100;
  const lng = x / 100;
  return [lat, lng];
}

function refreshMapOverlay() {
  if (!leafletMap) return;

  gunMarkers.forEach((marker) => marker.remove());
  gunMarkers.length = 0;

  const battery = Number(missionBatterySelect?.value || 1);
  const selectedGun = missionGunSelect?.value || 'all';
  const gunsPerBattery = Number(gunsPerBatteryInput?.value || 1);
  const gunIds = selectedGun === 'all' ? Array.from({ length: gunsPerBattery }, (_, idx) => idx + 1) : [Number(selectedGun)];

  const legendRows = [];
  gunIds.forEach((gunId) => {
    const gunX = Number(document.querySelector(`[data-gun-x="${battery}-${gunId}"]`)?.value || 0);
    const gunY = Number(document.querySelector(`[data-gun-y="${battery}-${gunId}"]`)?.value || 0);
    const marker = window.L.circleMarker(mapPointToLatLng(gunX, gunY), {
      radius: 6,
      color: '#00ff57',
      fillColor: '#00ff57',
      fillOpacity: 0.85,
    }).addTo(leafletMap);
    marker.bindPopup(`${t('gun')} ${gunId}<br>X: ${gunX}, Y: ${gunY}`);
    gunMarkers.push(marker);
    legendRows.push(`<p>${t('gun')} ${gunId}: X=${gunX}, Y=${gunY}</p>`);
  });

  const targetX = Number(document.querySelector('#target-x')?.value || 0);
  const targetY = Number(document.querySelector('#target-y')?.value || 0);
  if (!targetMarker) {
    targetMarker = window.L.marker(mapPointToLatLng(targetX, targetY)).addTo(leafletMap);
  } else {
    targetMarker.setLatLng(mapPointToLatLng(targetX, targetY));
  }
  targetMarker.bindPopup(`${t('target')}: X=${targetX}, Y=${targetY}`);

  if (mapLegend) {
    mapLegend.innerHTML = [...legendRows, `<p>${t('target')}: X=${targetX}, Y=${targetY}</p>`].join('');
  }
}

function centerMapOnTarget() {
  if (!leafletMap) return;
  const targetX = Number(document.querySelector('#target-x')?.value || 0);
  const targetY = Number(document.querySelector('#target-y')?.value || 0);
  leafletMap.setView(mapPointToLatLng(targetX, targetY), 11);
}

function openMap() {
  state.mapUrl = mapUrlInput.value || '';
  localStorage.setItem('calc.mapUrl', state.mapUrl);
  switchTab('map');
  initializeMap();
  refreshMapOverlay();
  if (state.mapUrl) {
    window.open(state.mapUrl, '_blank', 'noopener,noreferrer');
    safetyOutput.textContent = t('openedExternalMap');
  }
}

async function openLogs() {
  try {
    const response = await fetch('/api/logs');
    if (!response.ok) throw new Error('failed');
    const payload = await response.json();
    if (!payload.files.length) {
      safetyOutput.textContent = t('noLogsYet');
      return;
    }
    const lines = payload.files.map((file) => `${file.name} (${file.size} B)`);
    safetyOutput.textContent = lines.join('\n');
  } catch {
    safetyOutput.textContent = t('logsError');
  }
}

async function exportData() {
  const local = {
    settings: JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'),
    missions: JSON.parse(localStorage.getItem('calc.missions') || '[]'),
    lang: localStorage.getItem('calc.lang') || 'ru',
    theme: localStorage.getItem('calc.theme') || 'terminal',
  };

  let logs = [];
  try {
    const response = await fetch('/api/logs');
    if (response.ok) {
      const payload = await response.json();
      logs = payload.files;
    }
  } catch {}

  const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), local, logs }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `calc-export-${Date.now()}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  safetyOutput.textContent = t('exportReady');
}

tabs.forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
document.querySelectorAll('[data-open-tab]').forEach((button) => button.addEventListener('click', () => switchTab(button.dataset.openTab)));
healthBtn?.addEventListener('click', runHealthCheck);
clearDataBtn?.addEventListener('click', clearLocalData);
openLogsBtn?.addEventListener('click', openLogs);
exportDataBtn?.addEventListener('click', exportData);
document.querySelector('#open-map')?.addEventListener('click', openMap);
document.querySelector('#map-sync')?.addEventListener('click', refreshMapOverlay);
document.querySelector('#map-center-target')?.addEventListener('click', centerMapOnTarget);
document.querySelector('#calculate-btn')?.addEventListener('click', calculateFire);
document.querySelector('#show-mto')?.addEventListener('click', showMto);
document.querySelector('#save-mission')?.addEventListener('click', saveMission);
[batteryCountInput, gunsPerBatteryInput].forEach((input) => input?.addEventListener('change', () => {
  state.settings.batteryCount = Number(batteryCountInput?.value || 1);
  state.settings.gunsPerBattery = Number(gunsPerBatteryInput?.value || 1);
  renderGlobalConfig();
  renderGunsGrid();
  renderObservers();
  renderMissionSelectors();
  persistLauncherSettings();
  refreshMapOverlay();
}));
observerCountInput?.addEventListener('change', () => {
  state.settings.observerCount = Number(observerCountInput?.value || 1);
  renderObservers();
  persistLauncherSettings();
});
missionBatterySelect?.addEventListener('change', () => {
  persistLauncherSettings();
  refreshMapOverlay();
});
missionGunSelect?.addEventListener('change', () => {
  persistLauncherSettings();
  refreshMapOverlay();
});
document.addEventListener('input', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) {
    persistLauncherSettings();
  }
});

languageSelect?.addEventListener('change', (event) => {
  state.lang = event.target.value;
  localStorage.setItem('calc.lang', state.lang);
  applyI18n();
  runHealthCheck();
});

themeSelect?.addEventListener('change', (event) => {
  state.theme = event.target.value;
  localStorage.setItem('calc.theme', state.theme);
  document.body.dataset.theme = state.theme;
});

document.body.dataset.theme = state.theme;
applyI18n();
persistLauncherSettings();
runHealthCheck();
