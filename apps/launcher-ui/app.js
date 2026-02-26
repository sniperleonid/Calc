const SETTINGS_KEY = 'calc.launcherSettings';
const LIMITS = {
  batteries: { min: 1, max: 5 },
  gunsPerBattery: { min: 1, max: 5 },
  observers: { min: 1, max: 5 },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeCount(value, limits) {
  return clamp(Number(value) || limits.min, limits.min, limits.max);
}

function loadLauncherSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      batteryCount: normalizeCount(parsed.batteryCount, LIMITS.batteries),
      gunsPerBattery: normalizeCount(parsed.gunsPerBattery, LIMITS.gunsPerBattery),
      observerCount: normalizeCount(parsed.observerCount, LIMITS.observers),
      batteryConfig: parsed.batteryConfig ?? {},
      gunCoords: parsed.gunCoords ?? {},
      observerBindings: parsed.observerBindings ?? {},
      observerCoords: parsed.observerCoords ?? {},
      mission: parsed.mission ?? {},
      mapTools: parsed.mapTools ?? {},
    };
  } catch {
    return {
      batteryCount: 1,
      gunsPerBattery: 1,
      observerCount: 1,
      batteryConfig: {},
      gunCoords: {},
      observerBindings: {},
      observerCoords: {},
      mission: {},
      mapTools: {},
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
    observerTitle: 'Наблюдатели и привязки', observerCount: 'Количество наблюдателей (до 5)', observerBinding: 'Привязка наблюдателя',
    bindToGun: 'К орудию', bindToBattery: 'К батарее', gunnerHint: 'Все расчёты выполняются на основе глобальных настроек.',
    actionsTitle: 'Действия', calculate: 'Рассчитать', showMto: 'Показать MTO', logMission: 'Сохранить миссию',
    missionTitle: 'Калькулятор огневой задачи', missionName: 'Название задачи', missionBattery: 'Батарея', missionGun: 'Орудие (или все в батарее)', targetX: 'Координата цели X', targetY: 'Координата цели Y',
    mapPanelTitle: 'Тактическая карта (Leaflet)', mapLegendTitle: 'Легенда', mapLegendHint: 'Карта показывает орудия выбранной батареи и текущую цель из вкладки «Огневые задачи».',
    syncMap: 'Синхронизировать с координатами', centerTarget: 'Центр на цели',
    safeDataTitle: 'Контроль данных', safeDataDescription: 'Проверка журналов и экспорт служебных данных.', openLogs: 'Открыть логи', exportData: 'Экспорт данных', clearAllData: 'Очистить данные',
    serviceState: 'Состояние сервисов', generalSettings: 'Общие настройки', language: 'Язык', theme: 'Тема', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: запущен', ballisticsWarn: '⚠️ Ballistics Core: не отвечает. Проверьте Python и uvicorn.', gatewayOk: '✅ Realtime Gateway: запущен', gatewayWarn: '⚠️ Realtime Gateway: не отвечает.',
    dataCleared: 'Локальные данные очищены', battery: 'Батарея', batteryShort: 'Б', gun: 'Орудие', gunShort: 'О', observer: 'Наблюдатель', x: 'X', y: 'Y',
    observerHeight: 'Высота наблюдателя (м)',
    allGuns: 'Все орудия батареи', gunProfile: 'Профиль орудия', projectileProfile: 'Профиль снаряда',
    calcDone: 'Расчёт выполнен', mtoHeader: 'MTO: расход по выбранным орудиям', missionSaved: 'Миссия сохранена', noMissions: 'Сохранённых миссий нет',
    logsError: 'Не удалось загрузить логи', exportReady: 'Экспорт данных подготовлен', noLogsYet: 'Логи пока не найдены',
    target: 'Цель', openedExternalMap: 'Открыта внешняя карта',
    rolesTitle: 'Роли и рабочие места', rolesHint: 'Быстрые переходы к интерфейсам по ролям.', roleCommander: 'Командир (Карта)', roleGunner: 'Наводчик (Огневые задачи)', roleObserver: 'Наблюдатель (Корректировки)', roleLogistics: 'Логистика и данные',
    mapToolsTitle: 'Инструменты карты и калибровки', mapImageUpload: 'Загрузить свою карту (PNG/JPG)', applyMapImage: 'Применить карту', clearMapImage: 'Убрать карту',
    calibrationHint: 'Калибровка: включите режим, двойным щелчком ставьте метки P0/P1/P2 циклично. Введите только координаты P0 и длину P1-P2 в метрах.', applyCalibration: 'Применить калибровку', resetCalibration: 'Сбросить калибровку', calibrationApplied: 'Калибровка обновлена', calibrationResetDone: 'Калибровка сброшена', mapImageApplied: 'Пользовательская карта применена', mapImageCleared: 'Пользовательская карта убрана', invalidCalibration: 'Заполните корректные точки калибровки',
    markerToolLabel: 'Тип метки', markerToolGun: 'Активное орудие', markerToolObserver: 'Наблюдатель', markerPlaced: 'Метка добавлена', markerTargetLabel: 'Активная цель метки',
    calibrationMode: 'Режим калибровки', calibrationModeToggle: 'Калибровка: выкл', calibrationModeToggleActive: 'Калибровка: вкл', calibrationScaleLabel: 'Масштаб P1-P2 (м)', calibrationKnownP0X: 'Известные координаты P0 X', calibrationKnownP0Y: 'Известные координаты P0 Y', calibrationPointSet: 'Калибровочная точка установлена', calibrationNeedThreePoints: 'Поставьте P0, P1 и P2', clearManualMarkers: 'Очистить ручные метки'
  },
  en: {
    appVersion: 'Calc v1', appTitle: 'Ballistics Calculator', appSubtitle: 'Unified shell for fire mission planning and operational data.',
    tabHome: 'Home', tabGlobal: 'Global settings', tabFire: 'Fire Missions', tabMap: 'Map', tabSafety: 'Safety & Data', tabSettings: 'Settings',
    homeConfiguration: 'Global settings', homeFire: 'Fire Missions', homeMap: 'Map & integrations', openApi: 'Open API', editGlobalData: 'Configure guns, batteries and observers',
    openMissionPlanner: 'Open missions tab', checkServices: 'Check services', openMap: 'Open map', mapUrl: 'External map URL (optional)',
    sectionConfigTitle: 'Battery and gun parameters', batteryCount: 'Battery count', batteryHeightHint: 'Each battery has an independent altitude applied to every gun in that battery.',
    batteryHeight: 'Battery altitude (m)', gunsPerBattery: 'Guns per battery', coordinatesTitle: 'Coordinates and observers', gunsHint: 'Set map coordinates for each gun.',
    observerTitle: 'Observers and bindings', observerCount: 'Observers count (up to 5)', observerBinding: 'Observer binding',
    bindToGun: 'To gun', bindToBattery: 'To battery', gunnerHint: 'All calculations use data from global settings.',
    actionsTitle: 'Actions', calculate: 'Calculate', showMto: 'Show MTO', logMission: 'Save mission',
    missionTitle: 'Fire mission calculator', missionName: 'Mission name', missionBattery: 'Battery', missionGun: 'Gun (or full battery)', targetX: 'Target X coordinate', targetY: 'Target Y coordinate',
    mapPanelTitle: 'Tactical map (Leaflet)', mapLegendTitle: 'Legend', mapLegendHint: 'The map shows guns in selected battery and the current target from Fire Missions tab.',
    syncMap: 'Sync with coordinates', centerTarget: 'Center on target',
    safeDataTitle: 'Data control', safeDataDescription: 'Check logs and export service data.', openLogs: 'Open logs', exportData: 'Export data', clearAllData: 'Clear data',
    serviceState: 'Service status', generalSettings: 'General settings', language: 'Language', theme: 'Theme', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: online', ballisticsWarn: '⚠️ Ballistics Core: unavailable. Check Python and uvicorn.', gatewayOk: '✅ Realtime Gateway: online', gatewayWarn: '⚠️ Realtime Gateway: unavailable.',
    dataCleared: 'Local data has been cleared', battery: 'Battery', batteryShort: 'B', gun: 'Gun', gunShort: 'G', observer: 'Observer', x: 'X', y: 'Y',
    observerHeight: 'Observer altitude (m)',
    allGuns: 'All guns in battery', gunProfile: 'Gun profile', projectileProfile: 'Projectile profile',
    calcDone: 'Calculation complete', mtoHeader: 'MTO: ammo usage for selected guns', missionSaved: 'Mission saved', noMissions: 'No saved missions',
    logsError: 'Failed to load logs', exportReady: 'Data export ready', noLogsYet: 'No logs found yet',
    target: 'Target', openedExternalMap: 'Opened external map',
    rolesTitle: 'Roles & workspaces', rolesHint: 'Quick jump to interfaces by role.', roleCommander: 'Commander (Map)', roleGunner: 'Gunner (Fire missions)', roleObserver: 'Observer (Corrections)', roleLogistics: 'Logistics & data',
    mapToolsTitle: 'Map upload & calibration tools', mapImageUpload: 'Upload your map (PNG/JPG)', applyMapImage: 'Apply map image', clearMapImage: 'Clear map image',
    calibrationHint: 'Calibration: enable mode, double-click to place P0/P1/P2 cyclically, then enter only P0 coordinates and P1-P2 distance in meters.', applyCalibration: 'Apply calibration', resetCalibration: 'Reset calibration', calibrationApplied: 'Calibration updated', calibrationResetDone: 'Calibration reset', mapImageApplied: 'Custom map image applied', mapImageCleared: 'Custom map image cleared', invalidCalibration: 'Fill valid calibration points',
    markerToolLabel: 'Marker type', markerToolGun: 'Active gun', markerToolObserver: 'Observer', markerPlaced: 'Marker added', markerTargetLabel: 'Active marker target',
    calibrationMode: 'Calibration mode', calibrationModeToggle: 'Calibration: off', calibrationModeToggleActive: 'Calibration: on', calibrationScaleLabel: 'P1-P2 scale (m)', calibrationKnownP0X: 'Known P0 X', calibrationKnownP0Y: 'Known P0 Y', calibrationPointSet: 'Calibration point set', calibrationNeedThreePoints: 'Set P0, P1 and P2', clearManualMarkers: 'Clear manual markers'
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
const mapToolsOutput = document.querySelector('#map-tools-output');
const mapImageUploadInput = document.querySelector('#map-image-upload');
const markerToolSelect = document.querySelector('#marker-tool');
const markerTargetSelect = document.querySelector('#marker-target');
const calibrationModeButton = document.querySelector('#toggle-calibration-mode');
const calibrationControls = document.querySelector('#calibration-controls');

const t = (key) => i18n[state.lang][key] ?? key;

const gunProfiles = ['mortar-120-standard', 'm777-howitzer', 'd30-standard'];
const projectileProfiles = ['he-charge-3', 'smoke-charge-2', 'illum'];

function getMapToolsSettings() {
  const defaults = {
    calibration: { scale: 1, originMapX: 0, originMapY: 0, originWorldX: 0, originWorldY: 0 },
    imageBounds: { minX: 0, minY: 0, maxX: 4000, maxY: 4000 },
    imageDataUrl: '',
    manualMarkers: [],
    calibrationPoints: [],
    calibrationMode: false,
    nextCalibrationPointIndex: 0,
  };
  return { ...defaults, ...state.settings.mapTools, calibration: { ...defaults.calibration, ...(state.settings.mapTools?.calibration ?? {}) }, imageBounds: { ...defaults.imageBounds, ...(state.settings.mapTools?.imageBounds ?? {}) } };
}

let leafletMap;
let targetMarker;
let mapImageOverlay;
const gunMarkers = [];
const manualMarkers = [];
const calibrationMarkers = [];
let calibrationLine;
let selectedManualMarkerId = null;
let rightMousePanState = null;
let lastOverlayBoundsKey = '';

function persistLauncherSettings() {
  state.settings.batteryCount = normalizeCount(batteryCountInput?.value, LIMITS.batteries);
  state.settings.gunsPerBattery = normalizeCount(gunsPerBatteryInput?.value, LIMITS.gunsPerBattery);
  state.settings.observerCount = normalizeCount(observerCountInput?.value, LIMITS.observers);
  if (batteryCountInput) batteryCountInput.value = String(state.settings.batteryCount);
  if (gunsPerBatteryInput) gunsPerBatteryInput.value = String(state.settings.gunsPerBattery);
  if (observerCountInput) observerCountInput.value = String(state.settings.observerCount);

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

  state.settings.observerCoords = {};
  document.querySelectorAll('[data-observer-x]').forEach((input) => {
    const key = input.dataset.observerX;
    state.settings.observerCoords[key] = {
      x: input.value,
      y: document.querySelector(`[data-observer-y="${key}"]`)?.value ?? '',
      height: document.querySelector(`[data-observer-height="${key}"]`)?.value ?? 0,
    };
  });

  state.settings.mapTools = {
    ...getMapToolsSettings(),
  };

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
  hydrateMapToolsForm();
  syncMarkerTargetOptions();
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
    const batteryTitle = document.createElement('h3');
    batteryTitle.className = 'battery-group-title';
    batteryTitle.textContent = `${t('batteryShort')}${b}`;
    container.append(batteryTitle);
    for (let g = 1; g <= gunsPerBattery; g += 1) {
      const key = `${b}-${g}`;
      const saved = state.settings.gunCoords[key] ?? {};
      const row = document.createElement('div');
      row.className = 'pair';
      row.innerHTML = `<label>${t('batteryShort')}${b}-${t('gunShort')}${g}</label><input data-gun-x="${key}" type="number" placeholder="${t('x')}" value="${saved.x ?? 1000 + b * 100 + g * 10}" /><input data-gun-y="${key}" type="number" placeholder="${t('y')}" value="${saved.y ?? 1000 + b * 120 + g * 10}" />`;
      container.append(row);
    }
  }
}

function syncObserverBindingVisibility(scope) {
  const root = scope instanceof HTMLElement ? scope : document;
  root.querySelectorAll('[data-observer-mode]').forEach((modeSelect) => {
    const observerId = modeSelect.dataset.observerMode;
    const gunSelect = root.querySelector(`[data-observer-gun="${observerId}"]`);
    const batterySelect = root.querySelector(`[data-observer-battery="${observerId}"]`);
    const isGunMode = modeSelect.value === 'gun';
    if (gunSelect) gunSelect.classList.toggle('hidden', !isGunMode);
    if (batterySelect) batterySelect.classList.toggle('hidden', isGunMode);
  });
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
    const savedCoords = state.settings.observerCoords?.[String(i)] ?? {};
    const row = document.createElement('div');
    const batteryOptions = Array.from({ length: batteries }, (_, n) => `<option value="battery-${n + 1}">${t('batteryShort')}${n + 1}</option>`).join('');
    const gunOptionMarkup = gunOptions.map((id) => {
      const [, batteryId, gunId] = id.split('-');
      return `<option value="${id}">${t('batteryShort')}${batteryId}-${t('gunShort')}${gunId}</option>`;
    }).join('');
    row.className = 'observer-row';
    row.innerHTML = `<label data-observer-index="${i}">${t('observer')} ${i}: ${t('observerBinding')}</label><div class="pair"><select data-observer-mode="${i}"><option value="gun">${t('bindToGun')}</option><option value="battery">${t('bindToBattery')}</option></select><select data-observer-gun="${i}">${gunOptionMarkup}</select><select data-observer-battery="${i}">${batteryOptions}</select></div><div class="pair"><input data-observer-x="${i}" type="number" placeholder="${t('x')}" value="${savedCoords.x ?? ''}" /><input data-observer-y="${i}" type="number" placeholder="${t('y')}" value="${savedCoords.y ?? ''}" /><input data-observer-height="${i}" type="number" placeholder="${t('observerHeight')}" value="${savedCoords.height ?? 0}" /></div>`;
    container.append(row);
    row.querySelector(`[data-observer-mode="${i}"]`).value = saved.mode ?? 'gun';
    row.querySelector(`[data-observer-gun="${i}"]`).value = saved.gunId ?? gunOptions[0];
    row.querySelector(`[data-observer-battery="${i}"]`).value = saved.batteryId ?? 'battery-1';
    syncObserverBindingVisibility(row);
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

function getObserverCorrections(batteryId, gunIds, batteryHeight) {
  const corrections = [];
  document.querySelectorAll('[data-observer-index]').forEach((label) => {
    const observerId = label.dataset.observerIndex;
    const mode = document.querySelector(`[data-observer-mode="${observerId}"]`)?.value ?? 'gun';
    const linkedGun = document.querySelector(`[data-observer-gun="${observerId}"]`)?.value ?? '';
    const linkedBattery = document.querySelector(`[data-observer-battery="${observerId}"]`)?.value ?? '';
    const observerHeight = Number(document.querySelector(`[data-observer-height="${observerId}"]`)?.value || 0);
    const batteryLinkMatch = mode === 'battery' && linkedBattery === `battery-${batteryId}`;
    const gunLinkMatch = mode === 'gun' && gunIds.some((gunId) => linkedGun === `gun-${batteryId}-${gunId}`);
    if (!batteryLinkMatch && !gunLinkMatch) return;
    corrections.push({ observerId, heightDelta: (observerHeight - batteryHeight).toFixed(1) });
  });
  return corrections;
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

  const observerCorrections = getObserverCorrections(battery, gunIds, batteryHeight);
  const observerRows = observerCorrections.map((item) => `${t('observer')} ${item.observerId}: ΔH=${item.heightDelta}m`);

  fireOutput.textContent = observerRows.length ? `${output}\n${observerRows.join('\n')}` : output;
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
  leafletMap = window.L.map('leaflet-map', { zoomControl: true, doubleClickZoom: false, crs: window.L.CRS.Simple, minZoom: -6 }).setView([0, 0], 0);
  leafletMap.dragging.disable();
  leafletMap.on('dblclick', (event) => {
    window.L.DomEvent.stop(event);
    onMapDoubleClick(event);
  });

  const container = leafletMap.getContainer();
  container.addEventListener('contextmenu', (event) => event.preventDefault());
  container.addEventListener('mousedown', (event) => {
    if (event.button !== 2) return;
    rightMousePanState = { x: event.clientX, y: event.clientY };
  });
  container.addEventListener('mousemove', (event) => {
    if (!rightMousePanState) return;
    const dx = event.clientX - rightMousePanState.x;
    const dy = event.clientY - rightMousePanState.y;
    rightMousePanState = { x: event.clientX, y: event.clientY };
    leafletMap.panBy([-dx, -dy], { animate: false });
  });
  window.addEventListener('mouseup', () => {
    rightMousePanState = null;
  });

  setTimeout(() => leafletMap.invalidateSize(), 0);
}

function getActiveMarkerTargets(type) {
  if (type === 'observer') {
    const observers = Number(observerCountInput?.value || 1);
    return Array.from({ length: observers }, (_, idx) => ({ id: String(idx + 1), label: `${t('observer')} ${idx + 1}` }));
  }

  const batteries = Number(batteryCountInput?.value || 1);
  const gunsPerBattery = Number(gunsPerBatteryInput?.value || 1);
  const targets = [];
  for (let b = 1; b <= batteries; b += 1) {
    for (let g = 1; g <= gunsPerBattery; g += 1) {
      const key = `${b}-${g}`;
      targets.push({ id: key, label: `${t('batteryShort')}${b}-${t('gunShort')}${g}` });
    }
  }
  return targets;
}

function syncMarkerTargetOptions() {
  if (!markerTargetSelect || !markerToolSelect) return;
  const targets = getActiveMarkerTargets(markerToolSelect.value || 'gun');
  markerTargetSelect.innerHTML = targets.map((target) => `<option value="${target.id}">${target.label}</option>`).join('');
}

function getNextCalibrationPointLabel() {
  const nextIndex = Number(getMapToolsSettings().nextCalibrationPointIndex ?? 0) % 3;
  return ['P0', 'P1', 'P2'][nextIndex];
}

function setCalibrationMode(isEnabled) {
  const tools = getMapToolsSettings();
  state.settings.mapTools = { ...tools, calibrationMode: Boolean(isEnabled) };
  if (calibrationControls) calibrationControls.classList.toggle('hidden', !isEnabled);
  if (calibrationModeButton) {
    calibrationModeButton.textContent = isEnabled ? t('calibrationModeToggleActive') : t('calibrationModeToggle');
    calibrationModeButton.classList.toggle('active', isEnabled);
  }
  persistLauncherSettings();
  refreshMapOverlay();
}

function addManualMarker(type, latlng) {
  const point = latLngToMapPoint(latlng.lat, latlng.lng);
  const targetId = markerTargetSelect?.value || '';

  if (type === 'gun' && targetId) {
    const gunXInput = document.querySelector(`[data-gun-x="${targetId}"]`);
    const gunYInput = document.querySelector(`[data-gun-y="${targetId}"]`);
    if (gunXInput) gunXInput.value = point.x.toFixed(2);
    if (gunYInput) gunYInput.value = point.y.toFixed(2);
  }

  if (type === 'observer' && targetId) {
    const observerXInput = document.querySelector(`[data-observer-x="${targetId}"]`);
    const observerYInput = document.querySelector(`[data-observer-y="${targetId}"]`);
    if (observerXInput) observerXInput.value = point.x.toFixed(2);
    if (observerYInput) observerYInput.value = point.y.toFixed(2);
  }

  const tools = getMapToolsSettings();
  const marker = { id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, type, targetId, x: point.x, y: point.y };
  state.settings.mapTools = { ...tools, manualMarkers: [...(tools.manualMarkers ?? []).filter((item) => !(item.type === type && item.targetId === targetId)), marker] };
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = `${t('markerPlaced')}: ${type} (${marker.x.toFixed(1)}, ${marker.y.toFixed(1)})`;
}

function onMapDoubleClick(event) {
  event.originalEvent?.preventDefault?.();
  event.originalEvent?.stopPropagation?.();
  const tools = getMapToolsSettings();
  if (!tools.calibrationMode) {
    addManualMarker(markerToolSelect?.value || 'gun', event.latlng);
    return;
  }

  const point = latLngToMapPoint(event.latlng.lat, event.latlng.lng);
  const label = getNextCalibrationPointLabel();
  const current = [...(tools.calibrationPoints ?? [])].filter((item) => item.label !== label);
  current.push({ label, mapX: point.x, mapY: point.y });
  state.settings.mapTools = { ...tools, calibrationPoints: current, nextCalibrationPointIndex: (Number(tools.nextCalibrationPointIndex ?? 0) + 1) % 3 };
  if (label === 'P0') {
    const xInput = document.querySelector('#cal-p0-x');
    const yInput = document.querySelector('#cal-p0-y');
    if (xInput) xInput.value = point.x.toFixed(2);
    if (yInput) yInput.value = point.y.toFixed(2);
  }
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = `${t('calibrationPointSet')}: ${label}`;
}

function hydrateMapToolsForm() {
  const { imageBounds, calibration, calibrationMode } = getMapToolsSettings();
  const fill = (id, val) => { const el = document.querySelector(id); if (el) el.value = String(val ?? ''); };
  fill('#map-min-x', imageBounds.minX);
  fill('#map-min-y', imageBounds.minY);
  fill('#map-max-x', imageBounds.maxX);
  fill('#map-max-y', imageBounds.maxY);
  fill('#cal-p0-x', calibration.originWorldX);
  fill('#cal-p0-y', calibration.originWorldY);
  fill('#cal-scale-meters', '');
  if (calibrationControls) calibrationControls.classList.toggle('hidden', !calibrationMode);
  if (calibrationModeButton) calibrationModeButton.textContent = calibrationMode ? t('calibrationModeToggleActive') : t('calibrationModeToggle');
}

function upsertMapOverlay() {
  if (!leafletMap) return;
  const tools = getMapToolsSettings();
  if (mapImageOverlay) {
    mapImageOverlay.remove();
    mapImageOverlay = null;
  }
  if (!tools.imageDataUrl) {
    leafletMap.setMaxBounds(null);
    lastOverlayBoundsKey = '';
    return;
  }
  const { minX, minY, maxX, maxY } = tools.imageBounds;
  const southWest = mapPointToLatLng(Number(minX), Number(minY));
  const northEast = mapPointToLatLng(Number(maxX), Number(maxY));
  const bounds = window.L.latLngBounds(southWest, northEast);
  mapImageOverlay = window.L.imageOverlay(tools.imageDataUrl, bounds, { opacity: 0.85 });
  mapImageOverlay.addTo(leafletMap);
  leafletMap.setMaxBounds(bounds.pad(0.05));
  const boundsKey = `${tools.imageDataUrl.length}:${minX}:${minY}:${maxX}:${maxY}`;
  if (lastOverlayBoundsKey !== boundsKey) {
    leafletMap.fitBounds(bounds);
    lastOverlayBoundsKey = boundsKey;
  }
}

function applyCalibration() {
  const p0x = Number(document.querySelector('#cal-p0-x')?.value);
  const p0y = Number(document.querySelector('#cal-p0-y')?.value);
  const tools = getMapToolsSettings();
  const p1 = (tools.calibrationPoints ?? []).find((point) => point.label === 'P1');
  const p2 = (tools.calibrationPoints ?? []).find((point) => point.label === 'P2');
  const scaleMeters = Number(document.querySelector('#cal-scale-meters')?.value);

  if (![p0x, p0y, scaleMeters].every(Number.isFinite) || !p1 || !p2) {
    if (mapToolsOutput) mapToolsOutput.textContent = t('invalidCalibration');
    return;
  }

  const mapDistance = Math.hypot(p2.mapX - p1.mapX, p2.mapY - p1.mapY);
  if (mapDistance <= 0 || scaleMeters <= 0) {
    if (mapToolsOutput) mapToolsOutput.textContent = t('invalidCalibration');
    return;
  }

  const scale = scaleMeters / mapDistance;
  state.settings.mapTools = {
    ...tools,
    calibration: { scale, originMapX: p0x, originMapY: p0y, originWorldX: p0x, originWorldY: p0y },
  };
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = t('calibrationApplied');
}

function resetCalibration() {
  state.settings.mapTools = {
    ...getMapToolsSettings(),
    calibration: { scale: 1, originMapX: 0, originMapY: 0, originWorldX: 0, originWorldY: 0 },
    calibrationPoints: [],
    nextCalibrationPointIndex: 0,
  };
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = t('calibrationResetDone');
}

function applyMapImage() {
  const tools = getMapToolsSettings();
  const minX = Number(document.querySelector('#map-min-x')?.value || 0);
  const minY = Number(document.querySelector('#map-min-y')?.value || 0);
  const maxX = Number(document.querySelector('#map-max-x')?.value || 0);
  const maxY = Number(document.querySelector('#map-max-y')?.value || 0);
  state.settings.mapTools = { ...tools, imageBounds: { minX, minY, maxX, maxY } };
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = t('mapImageApplied');
}

function clearMapImage() {
  state.settings.mapTools = { ...getMapToolsSettings(), imageDataUrl: '' };
  if (mapImageUploadInput) mapImageUploadInput.value = '';
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = t('mapImageCleared');
}

function clearManualMarkers() {
  selectedManualMarkerId = null;
  state.settings.mapTools = { ...getMapToolsSettings(), manualMarkers: [], calibrationPoints: [], nextCalibrationPointIndex: 0 };
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = t('clearManualMarkers');
}

function openRoleWorkspace(role) {
  const actionMap = { commander: () => switchTab('map'), gunner: () => switchTab('fire'), observer: () => switchTab('global'), logistics: () => switchTab('safety') };
  actionMap[role]?.();
}

function mapPointToLatLng(x, y) {
  const { calibration } = getMapToolsSettings();
  const lat = (y - Number(calibration.originMapY)) * Number(calibration.scale) + Number(calibration.originWorldY);
  const lng = (x - Number(calibration.originMapX)) * Number(calibration.scale) + Number(calibration.originWorldX);
  return [lat, lng];
}

function latLngToMapPoint(lat, lng) {
  const { calibration } = getMapToolsSettings();
  const scale = Number(calibration.scale) || 1;
  return {
    x: (Number(lng) - Number(calibration.originWorldX)) / scale + Number(calibration.originMapX),
    y: (Number(lat) - Number(calibration.originWorldY)) / scale + Number(calibration.originMapY),
  };
}

function refreshMapOverlay() {
  if (!leafletMap) return;
  upsertMapOverlay();

  gunMarkers.forEach((marker) => marker.remove());
  gunMarkers.length = 0;
  manualMarkers.forEach((marker) => marker.remove());
  manualMarkers.length = 0;
  calibrationMarkers.forEach((marker) => marker.remove());
  calibrationMarkers.length = 0;
  if (calibrationLine) {
    calibrationLine.remove();
    calibrationLine = null;
  }

  const battery = Number(missionBatterySelect?.value || 1);
  const selectedGun = missionGunSelect?.value || 'all';
  const gunsPerBattery = Number(gunsPerBatteryInput?.value || 1);
  const gunIds = selectedGun === 'all' ? Array.from({ length: gunsPerBattery }, (_, idx) => idx + 1) : [Number(selectedGun)];

  const legendRows = [];
  gunIds.forEach((gunId) => {
    const gunX = Number(document.querySelector(`[data-gun-x="${battery}-${gunId}"]`)?.value || 0);
    const gunY = Number(document.querySelector(`[data-gun-y="${battery}-${gunId}"]`)?.value || 0);
    const marker = window.L.circleMarker(mapPointToLatLng(gunX, gunY), {
      radius: 8,
      color: '#00ff57',
      fillColor: '#00ff57',
      fillOpacity: 0.9,
      weight: 2,
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

  const markerStyle = {
    gun: '#ff4f4f',
    observer: '#00d4ff',
  };

  const tools = getMapToolsSettings();
  (tools.manualMarkers ?? []).forEach((item) => {
    const color = markerStyle[item.type] ?? '#ffffff';
    const isSelected = selectedManualMarkerId === item.id;
    const marker = window.L.circleMarker(mapPointToLatLng(Number(item.x), Number(item.y)), {
      radius: isSelected ? 10 : 8,
      color,
      fillColor: color,
      fillOpacity: 0.9,
      weight: isSelected ? 4 : 2,
    }).addTo(leafletMap);
    marker.bindPopup(`${item.type}${item.targetId ? ` ${item.targetId}` : ''}<br>X: ${Number(item.x).toFixed(1)}, Y: ${Number(item.y).toFixed(1)}`);
    marker.on('click', () => {
      selectedManualMarkerId = item.id;
      refreshMapOverlay();
    });
    marker.on('mousedown', (event) => {
      if (event.originalEvent?.button !== 0) return;
      selectedManualMarkerId = item.id;
      refreshMapOverlay();
    });
    marker.on('mousemove', (event) => {
      if (selectedManualMarkerId !== item.id || !event.originalEvent?.buttons || (event.originalEvent.buttons & 1) !== 1) return;
      const point = latLngToMapPoint(event.latlng.lat, event.latlng.lng);
      const nextMarkers = (tools.manualMarkers ?? []).map((entry) => (entry.id === item.id ? { ...entry, x: point.x, y: point.y } : entry));
      state.settings.mapTools = { ...tools, manualMarkers: nextMarkers };
      if (item.type === 'gun' && item.targetId) {
        const gunXInput = document.querySelector(`[data-gun-x="${item.targetId}"]`);
        const gunYInput = document.querySelector(`[data-gun-y="${item.targetId}"]`);
        if (gunXInput) gunXInput.value = point.x.toFixed(2);
        if (gunYInput) gunYInput.value = point.y.toFixed(2);
      }
      if (item.type === 'observer' && item.targetId) {
        const observerXInput = document.querySelector(`[data-observer-x="${item.targetId}"]`);
        const observerYInput = document.querySelector(`[data-observer-y="${item.targetId}"]`);
        if (observerXInput) observerXInput.value = point.x.toFixed(2);
        if (observerYInput) observerYInput.value = point.y.toFixed(2);
      }
      persistLauncherSettings();
      refreshMapOverlay();
    });
    manualMarkers.push(marker);
  });

  const showCalibration = Boolean(getMapToolsSettings().calibrationMode);
  if (showCalibration) {
    const calPoints = getMapToolsSettings().calibrationPoints ?? [];
    calPoints.forEach((point) => {
      const marker = window.L.marker(mapPointToLatLng(point.mapX, point.mapY), {
        icon: window.L.divIcon({ className: 'calibration-cross', html: `<span>✚ ${point.label}</span>` }),
      }).addTo(leafletMap);
      calibrationMarkers.push(marker);
    });

    const p1 = calPoints.find((point) => point.label === 'P1');
    const p2 = calPoints.find((point) => point.label === 'P2');
    if (p1 && p2) {
      calibrationLine = window.L.polyline([mapPointToLatLng(p1.mapX, p1.mapY), mapPointToLatLng(p2.mapX, p2.mapY)], { color: '#ff66ff', dashArray: '10 8' }).addTo(leafletMap);
    }
  }

  if (mapLegend) {
    const markerLegendRows = (getMapToolsSettings().manualMarkers ?? []).map((item) => `<p>${item.type}: X=${Number(item.x).toFixed(1)}, Y=${Number(item.y).toFixed(1)}</p>`);
    mapLegend.innerHTML = [...legendRows, `<p>${t('target')}: X=${targetX}, Y=${targetY}</p>`, ...markerLegendRows].join('');
  }
}

function deleteSelectedManualMarker() {
  if (!selectedManualMarkerId) return;
  const tools = getMapToolsSettings();
  state.settings.mapTools = {
    ...tools,
    manualMarkers: (tools.manualMarkers ?? []).filter((marker) => marker.id !== selectedManualMarkerId),
  };
  selectedManualMarkerId = null;
  persistLauncherSettings();
  refreshMapOverlay();
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
document.querySelector('#calculate-btn')?.addEventListener('click', calculateFire);
document.querySelector('#show-mto')?.addEventListener('click', showMto);
document.querySelector('#save-mission')?.addEventListener('click', saveMission);
[batteryCountInput, gunsPerBatteryInput].forEach((input) => input?.addEventListener('change', () => {
  state.settings.batteryCount = normalizeCount(batteryCountInput?.value, LIMITS.batteries);
  state.settings.gunsPerBattery = normalizeCount(gunsPerBatteryInput?.value, LIMITS.gunsPerBattery);
  if (batteryCountInput) batteryCountInput.value = String(state.settings.batteryCount);
  if (gunsPerBatteryInput) gunsPerBatteryInput.value = String(state.settings.gunsPerBattery);
  renderGlobalConfig();
  renderGunsGrid();
  renderObservers();
  renderMissionSelectors();
  syncMarkerTargetOptions();
  persistLauncherSettings();
  refreshMapOverlay();
}));
observerCountInput?.addEventListener('change', () => {
  state.settings.observerCount = normalizeCount(observerCountInput?.value, LIMITS.observers);
  if (observerCountInput) observerCountInput.value = String(state.settings.observerCount);
  renderObservers();
  syncMarkerTargetOptions();
  persistLauncherSettings();
});

document.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLSelectElement) || !event.target.matches('[data-observer-mode]')) return;
  syncObserverBindingVisibility();
});
missionBatterySelect?.addEventListener('change', () => {
  persistLauncherSettings();
  refreshMapOverlay();
});
missionGunSelect?.addEventListener('change', () => {
  persistLauncherSettings();
  refreshMapOverlay();
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Delete') return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
  deleteSelectedManualMarker();
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


document.querySelectorAll('[data-role-link]').forEach((button) => button.addEventListener('click', () => openRoleWorkspace(button.dataset.roleLink)));
calibrationModeButton?.addEventListener('click', () => {
  const tools = getMapToolsSettings();
  setCalibrationMode(!tools.calibrationMode);
});
document.querySelector('#apply-calibration')?.addEventListener('click', applyCalibration);
document.querySelector('#reset-calibration')?.addEventListener('click', resetCalibration);
document.querySelector('#apply-map-image')?.addEventListener('click', applyMapImage);
document.querySelector('#clear-map-image')?.addEventListener('click', clearMapImage);
document.querySelector('#clear-manual-markers')?.addEventListener('click', clearManualMarkers);
markerToolSelect?.addEventListener('change', () => {
  syncMarkerTargetOptions();
});
mapImageUploadInput?.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('file-read-failed'));
    reader.readAsDataURL(file);
  });
  state.settings.mapTools = { ...getMapToolsSettings(), imageDataUrl: String(dataUrl) };
  persistLauncherSettings();
  refreshMapOverlay();
});

document.body.dataset.theme = state.theme;
applyI18n();
persistLauncherSettings();
runHealthCheck();
