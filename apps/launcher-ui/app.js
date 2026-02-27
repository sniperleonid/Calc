const SETTINGS_KEY = 'calc.launcherSettings';
const LIMITS = {
  batteries: { min: 1, max: 5 },
  gunsPerBattery: { min: 1, max: 5 },
  observers: { min: 1, max: 5 },
};
const COORD_LIMITS = { min: 0, max: 999999 };
const HEIGHT_LIMITS = { min: 0, max: 10000 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeCount(value, limits) {
  return clamp(Number(value) || limits.min, limits.min, limits.max);
}

function getGunCountForBattery(batteryId) {
  const key = String(batteryId);
  const raw = document.querySelector(`[data-battery-guns-count="${key}"]`)?.value
    ?? state.settings.batteryGunCounts?.[key]
    ?? LIMITS.gunsPerBattery.min;
  return normalizeCount(raw, LIMITS.gunsPerBattery);
}

function loadLauncherSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      batteryCount: normalizeCount(parsed.batteryCount, LIMITS.batteries),
      observerCount: normalizeCount(parsed.observerCount, LIMITS.observers),
      batteryConfig: parsed.batteryConfig ?? {},
      batteryGunCounts: parsed.batteryGunCounts ?? {},
      gunCoords: parsed.gunCoords ?? {},
      observerBindings: parsed.observerBindings ?? {},
      observerCoords: parsed.observerCoords ?? {},
      observerNames: parsed.observerNames ?? {},
      mission: parsed.mission ?? {},
      mapTools: parsed.mapTools ?? {},
    };
  } catch {
    return {
      batteryCount: 1,
      observerCount: 1,
      batteryConfig: {},
      batteryGunCounts: {},
      gunCoords: {},
      observerBindings: {},
      observerCoords: {},
      observerNames: {},
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
    tipTabHome: 'Быстрый обзор состояния системы и ключевых переходов.', tipTabGlobal: 'Настройка состава батарей, орудий и наблюдателей перед расчётами.', tipTabFire: 'Подготовка и расчёт параметров для огневой задачи.', tipTabMap: 'Работа с тактической картой, метками и калибровкой.', tipTabSafety: 'Проверка логов, экспорт данных и служебные операции.', tipTabSettings: 'Переключение языка и визуальной темы интерфейса.',
    homeConfiguration: 'Глобальные настройки', homeFire: 'Огневые задачи', homeMap: 'Карта и интеграции', openApi: 'Открыть API', editGlobalData: 'Настроить орудия, батареи и наблюдателей',
    tipHomeGlobalCard: 'Карточка для первичной настройки структуры подразделения.', tipHomeFireCard: 'Карточка с быстрым переходом к расчётам и проверке доступности сервисов.', tipHomeMapCard: 'Карточка открытия внешней карты и интеграции с оболочкой.', tipMapCanvasCard: 'Основное рабочее окно карты: масштабирование, метки и позиционирование.', tipMapToolsCard: 'Панель вспомогательных инструментов карты и калибровки.',
    openMissionPlanner: 'Открыть вкладку задач', checkServices: 'Проверить сервисы', openMap: 'Открыть карту', mapUrl: 'URL внешней карты (необязательно)',
    sectionConfigTitle: 'Параметры батарей и орудий', batterySectionTitle: 'Батареи', gunsSectionTitle: 'Орудия', observerSectionTitle: 'Наблюдатели',
    batteryCount: 'Количество батарей', batteryHeightHint: 'Высота задаётся отдельно для каждой батареи и применяется ко всем орудиям этой батареи.',
    batteryHeight: 'Высота батареи (м)', gunsPerBattery: 'Орудий в батарее', batteryName: 'Название батареи', coordinatesTitle: 'Координаты и наблюдатели', gunsHint: 'Для каждого орудия укажите координаты карты.',
    observerTitle: 'Наблюдатели и привязки', observerCount: 'Количество наблюдателей (до 5)', observerBinding: 'Привязка наблюдателя',
    bindToGun: 'К орудию', bindToBattery: 'К батарее', gunnerHint: 'Все расчёты выполняются на основе глобальных настроек.',
    actionsTitle: 'Действия', calculate: 'Рассчитать', showMto: 'Показать MTO', logMission: 'Сохранить миссию',
    missionTitle: 'Калькулятор огневой задачи', missionName: 'Название задачи', missionBattery: 'Батарея', missionGun: 'Орудие (или все в батарее)', targetX: 'Координата цели X', targetY: 'Координата цели Y',
    mapPanelTitle: 'Тактическая карта (Leaflet)', mapLegendTitle: 'Легенда', mapLegendHint: 'Карта показывает орудия выбранной батареи и текущую цель из вкладки «Огневые задачи».',
    syncMap: 'Синхронизировать с координатами', centerTarget: 'Центр на цели',
    safeDataTitle: 'Контроль данных', safeDataDescription: 'Проверка журналов и экспорт служебных данных.', openLogs: 'Открыть логи', exportData: 'Экспорт данных', clearAllData: 'Очистить данные',
    serviceState: 'Состояние сервисов', generalSettings: 'Общие настройки', language: 'Язык', theme: 'Тема', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: запущен', ballisticsWarn: '⚠️ Ballistics Core: не отвечает. Проверьте Python и uvicorn.',
    dataCleared: 'Локальные данные очищены', battery: 'Батарея', batteryShort: 'Б', gun: 'Орудие', gunShort: 'О', observer: 'Наблюдатель', observerShort: 'Н', x: 'X', y: 'Y',
    observerHeight: 'Высота наблюдателя (м)', observerName: 'Имя наблюдателя',
    allGuns: 'Все орудия батареи', gunProfile: 'Профиль орудия', projectileProfile: 'Профиль снаряда',
    calcDone: 'Расчёт выполнен', mtoHeader: 'MTO: расход по выбранным орудиям', missionSaved: 'Миссия сохранена', noMissions: 'Сохранённых миссий нет',
    logsError: 'Не удалось загрузить логи', exportReady: 'Экспорт данных подготовлен', noLogsYet: 'Логи пока не найдены',
    target: 'Цель', openedExternalMap: 'Открыта внешняя карта',
    invalidCoordinates: 'Ошибка координат: разрешены только цифры и допустимые пределы',
    mapToolsTitle: 'Инструменты карты и калибровки', mapImageUpload: 'Загрузить свою карту (PNG/JPG)', applyMapImage: 'Применить карту', clearMapImage: 'Убрать карту',
    calibrationHint: 'Калибровка: включите режим, двойным щелчком ставьте метки P0/P1/P2 циклично. Введите только координаты P0 и длину P1-P2 в метрах.', applyCalibration: 'Применить калибровку', resetCalibration: 'Сбросить калибровку', calibrationApplied: 'Калибровка обновлена', calibrationResetDone: 'Калибровка сброшена', mapImageApplied: 'Пользовательская карта применена', mapImageCleared: 'Пользовательская карта убрана', invalidCalibration: 'Заполните корректные точки калибровки',
    markerToolLabel: 'Тип метки', markerToolGun: 'Активное орудие', markerToolBattery: 'Активная батарея', markerToolObserver: 'Наблюдатель', markerToolRuler: 'Линейка', markerToolCoords: 'Снятие координат', markerPlaced: 'Метка добавлена', markerTargetLabel: 'Активная цель метки',
    rulerPointSet: 'Точка линейки установлена', rulerMeasurement: 'Линейка', rulerCleared: 'Линейка удалена', coordsCaptured: 'Координаты точки',
    calibrationMode: 'Режим калибровки', calibrationModeToggle: 'Калибровка: выкл', calibrationModeToggleActive: 'Калибровка: вкл', calibrationScaleLabel: 'Масштаб P1-P2 (м)', calibrationKnownP0X: 'Известные координаты P0 X', calibrationKnownP0Y: 'Известные координаты P0 Y', calibrationPointSet: 'Калибровочная точка установлена', calibrationNeedThreePoints: 'Поставьте P0, P1 и P2', clearManualMarkers: 'Очистить ручные метки'
  },
  en: {
    appVersion: 'Calc v1', appTitle: 'Ballistics Calculator', appSubtitle: 'Unified shell for fire mission planning and operational data.',
    tabHome: 'Home', tabGlobal: 'Global settings', tabFire: 'Fire Missions', tabMap: 'Map', tabSafety: 'Safety & Data', tabSettings: 'Settings',
    tipTabHome: 'Quick system overview and key navigation links.', tipTabGlobal: 'Configure batteries, guns, and observers before calculations.', tipTabFire: 'Prepare and calculate fire mission parameters.', tipTabMap: 'Work with tactical map, markers, and calibration.', tipTabSafety: 'Check logs, export data, and run service actions.', tipTabSettings: 'Switch interface language and visual theme.',
    homeConfiguration: 'Global settings', homeFire: 'Fire Missions', homeMap: 'Map & integrations', openApi: 'Open API', editGlobalData: 'Configure guns, batteries and observers',
    tipHomeGlobalCard: 'Primary card for configuring your unit structure.', tipHomeFireCard: 'Quick access to mission calculations and service health check.', tipHomeMapCard: 'Open and bind an external map workspace.', tipMapCanvasCard: 'Main tactical canvas for zoom, markers, and position tracking.', tipMapToolsCard: 'Helper controls for map markers and calibration.',
    openMissionPlanner: 'Open missions tab', checkServices: 'Check services', openMap: 'Open map', mapUrl: 'External map URL (optional)',
    sectionConfigTitle: 'Battery and gun parameters', batterySectionTitle: 'Batteries', gunsSectionTitle: 'Guns', observerSectionTitle: 'Observers',
    batteryCount: 'Battery count', batteryHeightHint: 'Each battery has an independent altitude applied to every gun in that battery.',
    batteryHeight: 'Battery altitude (m)', gunsPerBattery: 'Guns per battery', batteryName: 'Battery name', coordinatesTitle: 'Coordinates and observers', gunsHint: 'Set map coordinates for each gun.',
    observerTitle: 'Observers and bindings', observerCount: 'Observers count (up to 5)', observerBinding: 'Observer binding',
    bindToGun: 'To gun', bindToBattery: 'To battery', gunnerHint: 'All calculations use data from global settings.',
    actionsTitle: 'Actions', calculate: 'Calculate', showMto: 'Show MTO', logMission: 'Save mission',
    missionTitle: 'Fire mission calculator', missionName: 'Mission name', missionBattery: 'Battery', missionGun: 'Gun (or full battery)', targetX: 'Target X coordinate', targetY: 'Target Y coordinate',
    mapPanelTitle: 'Tactical map (Leaflet)', mapLegendTitle: 'Legend', mapLegendHint: 'The map shows guns in selected battery and the current target from Fire Missions tab.',
    syncMap: 'Sync with coordinates', centerTarget: 'Center on target',
    safeDataTitle: 'Data control', safeDataDescription: 'Check logs and export service data.', openLogs: 'Open logs', exportData: 'Export data', clearAllData: 'Clear data',
    serviceState: 'Service status', generalSettings: 'General settings', language: 'Language', theme: 'Theme', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: online', ballisticsWarn: '⚠️ Ballistics Core: unavailable. Check Python and uvicorn.',
    dataCleared: 'Local data has been cleared', battery: 'Battery', batteryShort: 'B', gun: 'Gun', gunShort: 'G', observer: 'Observer', observerShort: 'O', x: 'X', y: 'Y',
    observerHeight: 'Observer altitude (m)', observerName: 'Observer name',
    allGuns: 'All guns in battery', gunProfile: 'Gun profile', projectileProfile: 'Projectile profile',
    calcDone: 'Calculation complete', mtoHeader: 'MTO: ammo usage for selected guns', missionSaved: 'Mission saved', noMissions: 'No saved missions',
    logsError: 'Failed to load logs', exportReady: 'Data export ready', noLogsYet: 'No logs found yet',
    target: 'Target', openedExternalMap: 'Opened external map',
    invalidCoordinates: 'Coordinate error: only digits and allowed limits are accepted',
    mapToolsTitle: 'Map upload & calibration tools', mapImageUpload: 'Upload your map (PNG/JPG)', applyMapImage: 'Apply map image', clearMapImage: 'Clear map image',
    calibrationHint: 'Calibration: enable mode, double-click to place P0/P1/P2 cyclically, then enter only P0 coordinates and P1-P2 distance in meters.', applyCalibration: 'Apply calibration', resetCalibration: 'Reset calibration', calibrationApplied: 'Calibration updated', calibrationResetDone: 'Calibration reset', mapImageApplied: 'Custom map image applied', mapImageCleared: 'Custom map image cleared', invalidCalibration: 'Fill valid calibration points',
    markerToolLabel: 'Marker type', markerToolGun: 'Active gun', markerToolBattery: 'Active battery', markerToolObserver: 'Observer', markerToolRuler: 'Ruler', markerToolCoords: 'Coordinate pick', markerPlaced: 'Marker added', markerTargetLabel: 'Active marker target',
    rulerPointSet: 'Ruler point set', rulerMeasurement: 'Ruler', rulerCleared: 'Ruler removed', coordsCaptured: 'Picked coordinates',
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
    ruler: { p1: null, p2: null },
    calibrationPoints: [],
    calibrationMode: false,
    nextCalibrationPointIndex: 0,
    calibrationScaleMeters: '',
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
let rulerLine;
let rulerEndpointMarkers = [];
let selectedManualMarkerId = null;
let rightMousePanState = null;
let lastOverlayBoundsKey = '';
let lastCtrlPressAt = 0;
let mapImageSize = null;

function parseCoordinateValue(rawValue) {
  const text = String(rawValue ?? '').trim();
  if (!text) return null;
  if (!/^\d+$/.test(text)) return null;
  const numeric = Number(text);
  if (!Number.isInteger(numeric)) return null;
  if (numeric < COORD_LIMITS.min || numeric > COORD_LIMITS.max) return null;
  return numeric;
}

function readXYFromInputs(xInput, yInput) {
  if (!xInput || !yInput) return null;
  const xRaw = String(xInput.value ?? '').trim();
  const yRaw = String(yInput.value ?? '').trim();
  if (!xRaw && !yRaw) return null;

  const xParsed = parseCoordinateValue(xRaw);
  const yParsed = parseCoordinateValue(yRaw);
  if (!Number.isFinite(xParsed) || !Number.isFinite(yParsed)) return null;
  return { x: xParsed, y: yParsed };
}

function parseHeightValue(rawValue) {
  const text = String(rawValue ?? '').trim();
  if (!text) return 0;
  if (!/^\d+$/.test(text)) return null;
  const numeric = Number(text);
  if (!Number.isInteger(numeric)) return null;
  if (numeric < HEIGHT_LIMITS.min || numeric > HEIGHT_LIMITS.max) return null;
  return numeric;
}

function sanitizeIntegerInput(input, limits) {
  if (!input) return;
  const normalized = String(input.value ?? '').replace(/\D+/g, '');
  if (!normalized) {
    input.value = '';
    return;
  }
  input.value = normalized;
}

function parseCoordinatePairValue(rawValue) {
  const text = String(rawValue ?? '').trim();
  if (!text) return null;
  const match = text.match(/^(\d{3,5})\s*[-,;:\/\\|]\s*(\d{3,5})$/);
  if (!match) return null;
  const x = parseCoordinateValue(match[1]);
  const y = parseCoordinateValue(match[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function getCoordinatePairBinding(input) {
  if (!input) return null;
  if (input.id === 'target-x') return { axis: 'x', mate: document.querySelector('#target-y') };
  if (input.id === 'target-y') return { axis: 'y', mate: document.querySelector('#target-x') };
  if (input.dataset.gunX) return { axis: 'x', mate: document.querySelector(`[data-gun-y="${input.dataset.gunX}"]`) };
  if (input.dataset.gunY) return { axis: 'y', mate: document.querySelector(`[data-gun-x="${input.dataset.gunY}"]`) };
  if (input.dataset.observerX) return { axis: 'x', mate: document.querySelector(`[data-observer-y="${input.dataset.observerX}"]`) };
  if (input.dataset.observerY) return { axis: 'y', mate: document.querySelector(`[data-observer-x="${input.dataset.observerY}"]`) };
  return null;
}

function applyCoordinatePairInput(input) {
  if (!input) return false;
  const parsedPair = parseCoordinatePairValue(input.value);
  if (!parsedPair) return false;
  const binding = getCoordinatePairBinding(input);
  if (!binding?.mate) return false;
  if (binding.axis === 'x') {
    input.value = String(parsedPair.x);
    binding.mate.value = String(parsedPair.y);
  } else {
    binding.mate.value = String(parsedPair.x);
    input.value = String(parsedPair.y);
  }
  return true;
}

function clearBoundMarkerCoordinates(marker) {
  if (marker.type === 'gun' && marker.targetId) {
    const gunXInput = document.querySelector(`[data-gun-x="${marker.targetId}"]`);
    const gunYInput = document.querySelector(`[data-gun-y="${marker.targetId}"]`);
    if (gunXInput) gunXInput.value = '';
    if (gunYInput) gunYInput.value = '';
  }
  if (marker.type === 'observer' && marker.targetId) {
    const observerXInput = document.querySelector(`[data-observer-x="${marker.targetId}"]`);
    const observerYInput = document.querySelector(`[data-observer-y="${marker.targetId}"]`);
    if (observerXInput) observerXInput.value = '';
    if (observerYInput) observerYInput.value = '';
  }
}

function syncMapMarkersWithAvailableTargets() {
  const tools = getMapToolsSettings();
  const validGunTargets = new Set(getActiveMarkerTargets('gun').map((entry) => entry.id));
  const validBatteryTargets = new Set(getActiveMarkerTargets('battery').map((entry) => entry.id));
  const validObserverTargets = new Set(getActiveMarkerTargets('observer').map((entry) => entry.id));
  const source = tools.manualMarkers ?? [];
  const filtered = source.filter((marker) => {
    if (marker.type === 'gun') return validGunTargets.has(marker.targetId);
    if (marker.type === 'battery') return validBatteryTargets.has(marker.targetId);
    if (marker.type === 'observer') return validObserverTargets.has(marker.targetId);
    return true;
  });

  if (filtered.length === source.length) return;
  const removed = source.filter((marker) => !filtered.some((entry) => entry.id === marker.id));
  removed.forEach(clearBoundMarkerCoordinates);
  if (selectedManualMarkerId && !filtered.some((marker) => marker.id === selectedManualMarkerId)) selectedManualMarkerId = null;
  state.settings.mapTools = { ...tools, manualMarkers: filtered };
  persistLauncherSettings();
}

function persistLauncherSettings() {
  state.settings.batteryCount = normalizeCount(batteryCountInput?.value, LIMITS.batteries);
  state.settings.observerCount = normalizeCount(observerCountInput?.value, LIMITS.observers);
  if (batteryCountInput) batteryCountInput.value = String(state.settings.batteryCount);
  if (observerCountInput) observerCountInput.value = String(state.settings.observerCount);

  state.settings.batteryConfig = {};
  state.settings.batteryGunCounts = {};
  document.querySelectorAll('[data-battery-height]').forEach((input) => {
    const batteryId = input.dataset.batteryHeight;
    state.settings.batteryConfig[batteryId] = {
      height: input.value,
      gunProfile: document.querySelector(`[data-battery-gun-profile="${batteryId}"]`)?.value ?? gunProfiles[0],
      projectileProfile: document.querySelector(`[data-battery-projectile-profile="${batteryId}"]`)?.value ?? projectileProfiles[0],
      title: document.querySelector(`[data-battery-title="${batteryId}"]`)?.value ?? `${t('battery')} ${batteryId}`,
    };
    state.settings.batteryGunCounts[batteryId] = getGunCountForBattery(batteryId);
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

  state.settings.observerNames = {};
  document.querySelectorAll('[data-observer-name]').forEach((input) => {
    const observerId = input.dataset.observerName;
    state.settings.observerNames[observerId] = input.value ?? '';
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
  document.querySelectorAll('[data-i18n-title]').forEach((node) => { node.title = t(node.dataset.i18nTitle); });
  languageSelect.value = state.lang;
  themeSelect.value = state.theme;
  mapUrlInput.value = state.mapUrl;
  batteryCountInput.value = String(state.settings.batteryCount);
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
  ]);
  document.querySelector('[data-service="ballistics-copy"]').textContent = document.querySelector('[data-service="ballistics"]')?.textContent || '';
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
      <h3>${saved.title ?? `${t('battery')} ${b}`}</h3>
      <div class="pair pair-5">
        <input type="text" inputmode="numeric" data-height data-battery-height="${b}" placeholder="${t('batteryHeight')}" value="${saved.height ?? 0}" />
        <input type="number" min="1" max="5" data-battery-guns-count="${b}" placeholder="${t('gunsPerBattery')}" value="${getGunCountForBattery(b)}" />
        <select data-battery-gun-profile="${b}">${gunProfileOptions}</select>
        <select data-battery-projectile-profile="${b}">${projectileOptions}</select>
        <input data-battery-title="${b}" placeholder="${t('batteryName')}" value="${saved.title ?? `${t('battery')} ${b}`}" />
      </div>
      <p class="hint compact">${t('batteryName')} · ${t('batteryHeight')} · ${t('gunsPerBattery')} · ${t('gunProfile')} · ${t('projectileProfile')}</p>`;
    container.append(row);
    row.querySelector(`[data-battery-gun-profile="${b}"]`).value = saved.gunProfile ?? gunProfiles[0];
    row.querySelector(`[data-battery-projectile-profile="${b}"]`).value = saved.projectileProfile ?? projectileProfiles[0];
  }
}

function renderGunsGrid() {
  const container = document.querySelector('#guns-coordinates');
  if (!container) return;
  const batteries = Number(batteryCountInput?.value || 1);
  container.innerHTML = '';
  for (let b = 1; b <= batteries; b += 1) {
    const batteryTitle = document.createElement('h3');
    batteryTitle.className = 'battery-group-title';
    batteryTitle.textContent = getBatteryDisplayName(b);
    container.append(batteryTitle);
    const gunsPerBattery = getGunCountForBattery(b);
    for (let g = 1; g <= gunsPerBattery; g += 1) {
      const key = `${b}-${g}`;
      const saved = state.settings.gunCoords[key] ?? {};
      const row = document.createElement('div');
      row.className = 'pair';
      row.innerHTML = `<label>${t('batteryShort')}${b}-${t('gunShort')}${g}</label><input data-gun-x="${key}" type="text" inputmode="numeric" data-coordinate placeholder="${t('x')}" value="${saved.x ?? 1000 + b * 100 + g * 10}" /><input data-gun-y="${key}" type="text" inputmode="numeric" data-coordinate placeholder="${t('y')}" value="${saved.y ?? 1000 + b * 120 + g * 10}" />`;
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
  const gunOptions = [];
  for (let b = 1; b <= batteries; b += 1) {
    const gunsPerBattery = getGunCountForBattery(b);
    for (let g = 1; g <= gunsPerBattery; g += 1) gunOptions.push(`gun-${b}-${g}`);
  }
  container.innerHTML = '';
  for (let i = 1; i <= observers; i += 1) {
    const saved = state.settings.observerBindings[String(i)] ?? {};
    const savedCoords = state.settings.observerCoords?.[String(i)] ?? {};
    const row = document.createElement('div');
    const batteryOptions = Array.from({ length: batteries }, (_, n) => `<option value="battery-${n + 1}">${getBatteryDisplayName(n + 1)}</option>`).join('');
    const gunOptionMarkup = gunOptions.map((id) => {
      const [, batteryId, gunId] = id.split('-');
      return `<option value="${id}">${t('batteryShort')}${batteryId}-${t('gunShort')}${gunId}</option>`;
    }).join('');
    row.className = 'observer-row';
    row.innerHTML = `<label data-observer-index="${i}">${getObserverDisplayName(i)}: ${t('observerBinding')}</label><div class="pair"><input data-observer-name="${i}" placeholder="${t('observerName')}" value="${state.settings.observerNames?.[String(i)] ?? ''}" /><select data-observer-mode="${i}"><option value="gun">${t('bindToGun')}</option><option value="battery">${t('bindToBattery')}</option></select><select data-observer-gun="${i}">${gunOptionMarkup}</select><select data-observer-battery="${i}">${batteryOptions}</select></div><div class="pair"><input data-observer-x="${i}" type="text" inputmode="numeric" data-coordinate placeholder="${t('x')}" value="${savedCoords.x ?? ''}" /><input data-observer-y="${i}" type="text" inputmode="numeric" data-coordinate placeholder="${t('y')}" value="${savedCoords.y ?? ''}" /><input data-observer-height="${i}" type="text" inputmode="numeric" data-height placeholder="${t('observerHeight')}" value="${savedCoords.height ?? 0}" /></div>`;
    container.append(row);
    row.querySelector(`[data-observer-mode="${i}"]`).value = saved.mode ?? 'gun';
    row.querySelector(`[data-observer-gun="${i}"]`).value = saved.gunId ?? gunOptions[0];
    row.querySelector(`[data-observer-battery="${i}"]`).value = saved.batteryId ?? 'battery-1';
    syncObserverBindingVisibility(row);
  }
}

function renderMissionSelectors() {
  const batteries = Number(batteryCountInput?.value || 1);
  missionBatterySelect.innerHTML = Array.from({ length: batteries }, (_, index) => `<option value="${index + 1}">${getBatteryDisplayName(index + 1)}</option>`).join('');
  const savedMissionBattery = Number(state.settings.mission.battery || 1);
  const selectedBattery = Math.min(Math.max(1, savedMissionBattery), batteries);
  missionBatterySelect.value = String(selectedBattery);

  const gunsPerBattery = getGunCountForBattery(selectedBattery);
  const gunOptions = ['all', ...Array.from({ length: gunsPerBattery }, (_, idx) => `${idx + 1}`)];
  missionGunSelect.innerHTML = gunOptions.map((value) => `<option value="${value}">${value === 'all' ? t('allGuns') : `${t('gun')} ${value}`}</option>`).join('');
  missionGunSelect.value = gunOptions.includes(state.settings.mission.gun) ? state.settings.mission.gun : 'all';

  document.querySelector('#mission-name').value = state.settings.mission.name ?? '';
  document.querySelector('#target-x').value = state.settings.mission.targetX ?? '';
  document.querySelector('#target-y').value = state.settings.mission.targetY ?? '';
}

function getBatteryHeight(batteryId) {
  const parsed = parseHeightValue(document.querySelector(`[data-battery-height="${batteryId}"]`)?.value);
  return parsed ?? Number.NaN;
}

function getObserverCorrections(batteryId, gunIds, batteryHeight) {
  const corrections = [];
  document.querySelectorAll('[data-observer-index]').forEach((label) => {
    const observerId = label.dataset.observerIndex;
    const mode = document.querySelector(`[data-observer-mode="${observerId}"]`)?.value ?? 'gun';
    const linkedGun = document.querySelector(`[data-observer-gun="${observerId}"]`)?.value ?? '';
    const linkedBattery = document.querySelector(`[data-observer-battery="${observerId}"]`)?.value ?? '';
    const observerHeight = parseHeightValue(document.querySelector(`[data-observer-height="${observerId}"]`)?.value);
    if (!Number.isFinite(observerHeight)) return;
    const batteryLinkMatch = mode === 'battery' && linkedBattery === `battery-${batteryId}`;
    const gunLinkMatch = mode === 'gun' && gunIds.some((gunId) => linkedGun === `gun-${batteryId}-${gunId}`);
    if (!batteryLinkMatch && !gunLinkMatch) return;
    corrections.push({ observerId, heightDelta: (observerHeight - batteryHeight).toFixed(1) });
  });
  return corrections;
}

function calculateFire() {
  const targetInput = readXYFromInputs(document.querySelector('#target-x'), document.querySelector('#target-y'));
  if (!targetInput) {
    fireOutput.textContent = t('invalidCoordinates');
    return;
  }
  const targetX = targetInput.x;
  const targetY = targetInput.y;
  const battery = Number(missionBatterySelect.value || 1);
  const selectedGun = missionGunSelect.value;
  const gunsPerBattery = getGunCountForBattery(battery);
  const gunIds = selectedGun === 'all' ? Array.from({ length: gunsPerBattery }, (_, idx) => idx + 1) : [Number(selectedGun)];
  const batteryHeight = getBatteryHeight(battery);
  if (!Number.isFinite(batteryHeight)) {
    fireOutput.textContent = t('invalidCoordinates');
    return;
  }

  const results = gunIds.map((gunId) => {
    const gunPoint = readXYFromInputs(
      document.querySelector(`[data-gun-x="${battery}-${gunId}"]`),
      document.querySelector(`[data-gun-y="${battery}-${gunId}"]`),
    );
    if (!gunPoint) return null;
    const gunX = gunPoint.x;
    const gunY = gunPoint.y;
    const dx = targetX - gunX;
    const dy = targetY - gunY;
    const distance = Math.hypot(dx, dy);
    const azimuth = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
    const azimuthMils = (azimuth * 6400) / 360;
    const elevationMils = ((Math.atan2(batteryHeight, distance || 1) * 1000) / Math.PI) * 17.7778;
    return { gunId, distance: distance.toFixed(1), azimuth: azimuth.toFixed(2), azimuthMils: azimuthMils.toFixed(1), elevation: elevationMils.toFixed(1) };
  });

  if (results.some((row) => row === null)) {
    fireOutput.textContent = t('invalidCoordinates');
    return;
  }

  const output = [`${t('calcDone')}: ${document.querySelector('#mission-name')?.value || 'Mission'}`,
    ...results.map((row) => `${t('gun')} ${row.gunId}: D=${row.distance}m Az=${row.azimuth}°/${row.azimuthMils} mil Elev=${row.elevation} mil`)].join('\n');

  const observerCorrections = getObserverCorrections(battery, gunIds, batteryHeight);
  const observerRows = observerCorrections.map((item) => `${getObserverDisplayName(item.observerId)}: ΔH=${item.heightDelta}m`);

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
  leafletMap = window.L.map('leaflet-map', {
    zoomControl: true,
    doubleClickZoom: false,
    zoomSnap: 0.25,
    zoomDelta: 0.25,
    wheelPxPerZoomLevel: 80,
    crs: window.L.CRS.Simple,
    minZoom: -6,
    maxZoom: 6,
  }).setView([0, 0], 0);
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
  if (type === 'ruler' || type === 'coords') return [];
  if (type === 'observer') {
    const observers = Number(observerCountInput?.value || 1);
    return Array.from({ length: observers }, (_, idx) => {
      const observerId = idx + 1;
      return { id: String(observerId), label: getObserverDisplayName(observerId) };
    });
  }

  const batteries = Number(batteryCountInput?.value || 1);
  if (type === 'battery') {
    return Array.from({ length: batteries }, (_, idx) => {
      const batteryId = idx + 1;
      return { id: String(batteryId), label: getBatteryDisplayName(batteryId) };
    });
  }

  const targets = [];
  for (let b = 1; b <= batteries; b += 1) {
    const gunsPerBattery = getGunCountForBattery(b);
    for (let g = 1; g <= gunsPerBattery; g += 1) {
      const key = `${b}-${g}`;
      targets.push({ id: key, label: `${t('batteryShort')}${b}-${t('gunShort')}${g}` });
    }
  }
  return targets;
}

function syncMarkerTargetOptions() {
  if (!markerTargetSelect || !markerToolSelect) return;
  const type = markerToolSelect.value || 'gun';
  const targets = getActiveMarkerTargets(type);
  const previousValue = markerTargetSelect.value;
  markerTargetSelect.innerHTML = targets.map((target) => `<option value="${target.id}">${target.label}</option>`).join('');
  markerTargetSelect.disabled = targets.length === 0;
  if (!targets.length) return;
  if (targets.some((target) => target.id === previousValue)) {
    markerTargetSelect.value = previousValue;
    return;
  }
  if (type === 'battery') {
    markerTargetSelect.value = missionBatterySelect?.value || targets[0].id;
    return;
  }
  if (type === 'gun') {
    const batteryId = missionBatterySelect?.value || '1';
    const gunId = missionGunSelect?.value || 'all';
    const activeGunTarget = gunId !== 'all' ? `${batteryId}-${gunId}` : '';
    markerTargetSelect.value = targets.some((target) => target.id === activeGunTarget) ? activeGunTarget : targets[0].id;
    return;
  }
  markerTargetSelect.value = targets[0].id;
}

function formatRulerMeasurement(p1, p2) {
  const dx = Number(p2.x) - Number(p1.x);
  const dy = Number(p2.y) - Number(p1.y);
  const distance = Math.hypot(dx, dy);
  const azimuthDeg = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
  const azimuthMils = (azimuthDeg * 6400) / 360;
  return `${t('rulerMeasurement')}: D=${distance.toFixed(2)}m Az=${azimuthDeg.toFixed(2)}°/${azimuthMils.toFixed(1)} mil`;
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
  const imagePoint = latLngToMapPoint(latlng.lat, latlng.lng);
  const point = imagePointToGamePoint(imagePoint.x, imagePoint.y);
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

  if (type === 'battery' && targetId) {
    const batteryGunCount = getGunCountForBattery(targetId);
    for (let gunId = 1; gunId <= batteryGunCount; gunId += 1) {
      const gunXInput = document.querySelector(`[data-gun-x="${targetId}-${gunId}"]`);
      const gunYInput = document.querySelector(`[data-gun-y="${targetId}-${gunId}"]`);
      if (gunXInput) gunXInput.value = point.x.toFixed(2);
      if (gunYInput) gunYInput.value = point.y.toFixed(2);
    }
  }

  const tools = getMapToolsSettings();
  const marker = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    targetId,
    x: point.x,
    y: point.y,
    mapX: imagePoint.x,
    mapY: imagePoint.y,
  };
  state.settings.mapTools = { ...tools, manualMarkers: [...(tools.manualMarkers ?? []).filter((item) => !(item.type === type && item.targetId === targetId)), marker] };
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = `${t('markerPlaced')}: ${type} (${marker.x.toFixed(1)}, ${marker.y.toFixed(1)})`;
}

function onMapDoubleClick(event) {
  event.originalEvent?.preventDefault?.();
  event.originalEvent?.stopPropagation?.();
  const tools = getMapToolsSettings();
  const imagePoint = latLngToMapPoint(event.latlng.lat, event.latlng.lng);
  logMapClickDiagnostics(event.latlng, imagePoint);
  if (!tools.calibrationMode) {
    const toolType = markerToolSelect?.value || 'gun';
    if (toolType === 'coords') {
      const gamePoint = imagePointToGamePoint(imagePoint.x, imagePoint.y);
      if (mapToolsOutput) mapToolsOutput.textContent = `${t('coordsCaptured')}: X=${gamePoint.x.toFixed(2)}, Y=${gamePoint.y.toFixed(2)}`;
      return;
    }
    if (toolType === 'ruler') {
      const nextRuler = tools.ruler?.p1 && tools.ruler?.p2
        ? { p1: imagePoint, p2: null }
        : tools.ruler?.p1
          ? { p1: tools.ruler.p1, p2: imagePoint }
          : { p1: imagePoint, p2: null };
      state.settings.mapTools = { ...tools, ruler: nextRuler };
      persistLauncherSettings();
      refreshMapOverlay();
      if (mapToolsOutput) {
        mapToolsOutput.textContent = nextRuler.p1 && nextRuler.p2
          ? formatRulerMeasurement(nextRuler.p1, nextRuler.p2)
          : `${t('rulerPointSet')}: P1 (${imagePoint.x.toFixed(2)}, ${imagePoint.y.toFixed(2)})`;
      }
      return;
    }
    addManualMarker(toolType, event.latlng);
    return;
  }

  const label = getNextCalibrationPointLabel();
  const current = [...(tools.calibrationPoints ?? [])].filter((item) => item.label !== label);
  current.push({ label, mapX: imagePoint.x, mapY: imagePoint.y });
  state.settings.mapTools = { ...tools, calibrationPoints: current, nextCalibrationPointIndex: (Number(tools.nextCalibrationPointIndex ?? 0) + 1) % 3 };
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = `${t('calibrationPointSet')}: ${label}`;
}

function hydrateMapToolsForm() {
  const { imageBounds, calibration, calibrationMode, calibrationScaleMeters } = getMapToolsSettings();
  const fill = (id, val) => { const el = document.querySelector(id); if (el) el.value = String(val ?? ''); };
  fill('#map-min-x', imageBounds.minX);
  fill('#map-min-y', imageBounds.minY);
  fill('#map-max-x', imageBounds.maxX);
  fill('#map-max-y', imageBounds.maxY);
  fill('#cal-p0-x', calibration.originWorldX);
  fill('#cal-p0-y', calibration.originWorldY);
  fill('#cal-scale-meters', calibrationScaleMeters);
  if (calibrationControls) calibrationControls.classList.toggle('hidden', !calibrationMode);
  if (calibrationModeButton) calibrationModeButton.textContent = calibrationMode ? t('calibrationModeToggleActive') : t('calibrationModeToggle');
}

function upsertMapOverlay() {
  if (!leafletMap) return;
  const tools = getMapToolsSettings();
  const overlayKey = tools.imageDataUrl ? `${tools.imageDataUrl.length}:${tools.imageDataUrl.slice(0, 64)}` : '';

  if (!tools.imageDataUrl) {
    if (mapImageOverlay) {
      mapImageOverlay.remove();
      mapImageOverlay = null;
    }
    leafletMap.setMaxBounds(null);
    mapImageSize = null;
    lastOverlayBoundsKey = '';
    return;
  }

  if (mapImageOverlay && overlayKey === lastOverlayBoundsKey) {
    return;
  }

  if (mapImageOverlay) {
    mapImageOverlay.remove();
    mapImageOverlay = null;
  }

  const image = new Image();
  image.onload = () => {
    if (!leafletMap) return;
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    mapImageSize = { naturalWidth, naturalHeight };

    const bounds = window.L.latLngBounds([[0, 0], [naturalHeight, naturalWidth]]);
    mapImageOverlay = window.L.imageOverlay(tools.imageDataUrl, bounds, { opacity: 0.85 }).addTo(leafletMap);

    state.settings.mapTools = {
      ...tools,
      imageBounds: { minX: 0, minY: 0, maxX: naturalWidth, maxY: naturalHeight },
    };
    persistLauncherSettings();
    hydrateMapToolsForm();
    leafletMap.fitBounds(bounds);
    leafletMap.setMaxBounds(bounds);
    lastOverlayBoundsKey = overlayKey;
  };
  image.src = tools.imageDataUrl;
}

function applyCalibration() {
  const p0x = Number(document.querySelector('#cal-p0-x')?.value);
  const p0y = Number(document.querySelector('#cal-p0-y')?.value);
  const tools = getMapToolsSettings();
  const p0 = (tools.calibrationPoints ?? []).find((point) => point.label === 'P0');
  const p1 = (tools.calibrationPoints ?? []).find((point) => point.label === 'P1');
  const p2 = (tools.calibrationPoints ?? []).find((point) => point.label === 'P2');
  const scaleMeters = Number(document.querySelector('#cal-scale-meters')?.value);

  if (![p0x, p0y, scaleMeters].every(Number.isFinite) || !p0 || !p1 || !p2 || scaleMeters <= 0) {
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
    calibrationScaleMeters: scaleMeters,
    calibration: {
      scale,
      originMapX: p0.mapX,
      originMapY: p0.mapY,
      originWorldX: p0x,
      originWorldY: p0y,
    },
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
    calibrationScaleMeters: '',
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
  state.settings.mapTools = { ...getMapToolsSettings(), manualMarkers: [], calibrationPoints: [], nextCalibrationPointIndex: 0, ruler: { p1: null, p2: null } };
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = t('clearManualMarkers');
}

function getFixedProjectionZoom() {
  return 0;
}

function imagePointToGamePoint(x, y) {
  const { calibration } = getMapToolsSettings();
  return {
    x: (Number(x) - Number(calibration.originMapX)) * Number(calibration.scale) + Number(calibration.originWorldX),
    y: (Number(y) - Number(calibration.originMapY)) * Number(calibration.scale) + Number(calibration.originWorldY),
  };
}

function gamePointToImagePoint(x, y) {
  const { calibration } = getMapToolsSettings();
  const scale = Number(calibration.scale) || 1;
  return {
    x: (Number(x) - Number(calibration.originWorldX)) / scale + Number(calibration.originMapX),
    y: (Number(y) - Number(calibration.originWorldY)) / scale + Number(calibration.originMapY),
  };
}

function mapPointToLatLng(x, y) {
  if (!leafletMap) return [0, 0];
  return leafletMap.unproject([Number(x), Number(y)], getFixedProjectionZoom());
}

function gamePointToLatLng(x, y) {
  const point = gamePointToImagePoint(x, y);
  return mapPointToLatLng(point.x, point.y);
}

function getAllGunPoints() {
  const batteries = Number(batteryCountInput?.value || 1);
  const points = [];
  for (let batteryId = 1; batteryId <= batteries; batteryId += 1) {
    const gunsPerBattery = getGunCountForBattery(batteryId);
    for (let gunId = 1; gunId <= gunsPerBattery; gunId += 1) {
      const point = readXYFromInputs(
        document.querySelector(`[data-gun-x="${batteryId}-${gunId}"]`),
        document.querySelector(`[data-gun-y="${batteryId}-${gunId}"]`),
      );
      if (!point) continue;
      points.push({ batteryId, gunId, ...point });
    }
  }
  return points;
}

function getObserverPoints() {
  const observers = Number(observerCountInput?.value || 1);
  const points = [];
  for (let observerId = 1; observerId <= observers; observerId += 1) {
    const point = readXYFromInputs(
      document.querySelector(`[data-observer-x="${observerId}"]`),
      document.querySelector(`[data-observer-y="${observerId}"]`),
    );
    if (!point) continue;
    points.push({ observerId, ...point });
  }
  return points;
}

function latLngToMapPoint(lat, lng) {
  if (!leafletMap) return { x: Number(lng), y: Number(lat) };
  const projected = leafletMap.project(window.L.latLng(lat, lng), getFixedProjectionZoom());
  return {
    x: projected.x,
    y: projected.y,
  };
}

function logMapClickDiagnostics(latlng, imagePoint) {
  if (!leafletMap) return;
  const container = leafletMap.getContainer();
  const bounds = mapImageOverlay?.getBounds?.();
  console.info('[map-click-diagnostics]', {
    mapX: Number(imagePoint.x.toFixed(2)),
    mapY: Number(imagePoint.y.toFixed(2)),
    zoom: leafletMap.getZoom(),
    fixedZoom: getFixedProjectionZoom(),
    containerSize: {
      width: container?.clientWidth ?? null,
      height: container?.clientHeight ?? null,
    },
    naturalSize: mapImageSize,
    latlng,
    bounds: bounds
      ? {
          southWest: {
            lat: bounds.getSouthWest().lat,
            lng: bounds.getSouthWest().lng,
          },
          northEast: {
            lat: bounds.getNorthEast().lat,
            lng: bounds.getNorthEast().lng,
          },
        }
      : null,
  });
}

function getBatteryCustomName(batteryId) {
  const fallback = `${t('battery')} ${batteryId}`;
  const fallbackShort = `${t('batteryShort')}-${batteryId}`;
  const rawName = String(
    document.querySelector(`[data-battery-title="${batteryId}"]`)?.value
    || state.settings.batteryConfig?.[String(batteryId)]?.title
    || '',
  ).trim();
  if (!rawName || rawName === fallback || rawName === fallbackShort) return '';
  return rawName;
}

function getBatteryDisplayName(batteryId) {
  const customName = getBatteryCustomName(batteryId);
  return `${t('batteryShort')}-${batteryId}${customName ? ` ${customName}` : ''}`;
}

function getObserverDisplayName(observerId) {
  const rawName = String(
    document.querySelector(`[data-observer-name="${observerId}"]`)?.value
    || state.settings.observerNames?.[String(observerId)]
    || '',
  ).trim();
  return `${t('observerShort')}-${observerId}${rawName ? ` ${rawName}` : ''}`;
}

function getMarkerTypeName(type) {
  if (type === 'gun') return t('gun');
  if (type === 'battery') return t('battery');
  if (type === 'observer') return t('observer');
  if (type === 'ruler') return t('markerToolRuler');
  if (type === 'coords') return t('markerToolCoords');
  return type;
}

function buildMarkerLabel(type, markerId) {
  if (type === 'gun' && markerId?.includes('-')) {
    const [batteryId, gunId] = markerId.split('-');
    return `${t('batteryShort')}${batteryId}-${t('gunShort')}${gunId}`;
  }
  if (type === 'battery' && markerId) return getBatteryDisplayName(markerId);
  if (type === 'observer' && markerId) return getObserverDisplayName(markerId);
  return getMarkerTypeName(type);
}

function addPersistentLabel(marker, labelText) {
  marker.bindTooltip(labelText, {
    permanent: true,
    direction: 'top',
    offset: [0, -10],
    className: 'map-label-tooltip',
  });
}

function refreshMapOverlay() {
  if (!leafletMap) return;
  syncMapMarkersWithAvailableTargets();
  upsertMapOverlay();

  gunMarkers.forEach((marker) => marker.remove());
  gunMarkers.length = 0;
  manualMarkers.forEach((marker) => marker.remove());
  manualMarkers.length = 0;
  rulerEndpointMarkers.forEach((marker) => marker.remove());
  rulerEndpointMarkers = [];
  calibrationMarkers.forEach((marker) => marker.remove());
  calibrationMarkers.length = 0;
  if (calibrationLine) {
    calibrationLine.remove();
    calibrationLine = null;
  }
  if (rulerLine) {
    rulerLine.remove();
    rulerLine = null;
  }

  const battery = Number(missionBatterySelect?.value || 1);

  const legendRows = [];
  const markerStyle = {
    gun: '#00ff57',
    observer: '#00d4ff',
    battery: '#ffd84d',
    target: '#ff7a1a',
  };
  const allGunPoints = getAllGunPoints();
  allGunPoints.forEach(({ batteryId, gunId, x: gunX, y: gunY }) => {
    const marker = window.L.circleMarker(gamePointToLatLng(gunX, gunY), {
      radius: 8,
      color: markerStyle.gun,
      fillColor: markerStyle.gun,
      fillOpacity: 0.9,
      weight: 2,
    }).addTo(leafletMap);
    const gunLabel = `${t('batteryShort')}${batteryId}-${t('gunShort')}${gunId}`;
    marker.bindPopup(`${gunLabel}<br>X: ${gunX}, Y: ${gunY}`);
    addPersistentLabel(marker, gunLabel);
    gunMarkers.push(marker);
    legendRows.push(`<p><span class="legend-dot" style="--dot-color:${markerStyle.gun}"></span>${gunLabel}: X=${gunX}, Y=${gunY}</p>`);
  });

  const batteries = Number(batteryCountInput?.value || 1);
  for (let batteryId = 1; batteryId <= batteries; batteryId += 1) {
    const batteryGunPoints = allGunPoints.filter((point) => point.batteryId === batteryId);
    if (!batteryGunPoints.length) continue;
    const center = batteryGunPoints.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
    center.x /= batteryGunPoints.length;
    center.y /= batteryGunPoints.length;
    const isSelectedBattery = batteryId === battery;
    const batteryMarker = window.L.circleMarker(gamePointToLatLng(center.x, center.y), {
      radius: 11,
      color: markerStyle.battery,
      fillColor: markerStyle.battery,
      fillOpacity: isSelectedBattery ? 0.3 : 0.15,
      weight: isSelectedBattery ? 3 : 2,
    }).addTo(leafletMap);
    const batteryName = getBatteryDisplayName(batteryId);
    batteryMarker.bindPopup(`${batteryName}<br>X: ${center.x.toFixed(1)}, Y: ${center.y.toFixed(1)}`);
    addPersistentLabel(batteryMarker, batteryName);
    gunMarkers.push(batteryMarker);
    legendRows.push(`<p><span class="legend-dot" style="--dot-color:${markerStyle.battery}"></span>${batteryName}: X=${center.x.toFixed(1)}, Y=${center.y.toFixed(1)}</p>`);
  }

  getObserverPoints().forEach(({ observerId, x, y }) => {
    const observerMarker = window.L.circleMarker(gamePointToLatLng(x, y), {
      radius: 7,
      color: markerStyle.observer,
      fillColor: markerStyle.observer,
      fillOpacity: 0.85,
      weight: 2,
    }).addTo(leafletMap);
    const observerLabel = getObserverDisplayName(observerId);
    observerMarker.bindPopup(`${observerLabel}<br>X: ${x}, Y: ${y}`);
    addPersistentLabel(observerMarker, observerLabel);
    gunMarkers.push(observerMarker);
    legendRows.push(`<p><span class="legend-dot" style="--dot-color:${markerStyle.observer}"></span>${observerLabel}: X=${x}, Y=${y}</p>`);
  });

  const targetPoint = readXYFromInputs(document.querySelector('#target-x'), document.querySelector('#target-y')) ?? { x: 0, y: 0 };
  const targetX = targetPoint.x;
  const targetY = targetPoint.y;
  if (!targetMarker) {
    targetMarker = window.L.circleMarker(gamePointToLatLng(targetX, targetY), {
      radius: 9,
      color: markerStyle.target,
      fillColor: markerStyle.target,
      fillOpacity: 0.8,
      weight: 3,
    }).addTo(leafletMap);
  } else {
    targetMarker.setLatLng(gamePointToLatLng(targetX, targetY));
  }
  targetMarker.bindPopup(`${t('target')}: X=${targetX}, Y=${targetY}`);
  addPersistentLabel(targetMarker, t('target'));

  const tools = getMapToolsSettings();
  if (tools.ruler?.p1) {
    const p1Marker = window.L.marker(mapPointToLatLng(tools.ruler.p1.x, tools.ruler.p1.y), {
      icon: window.L.divIcon({ className: 'calibration-cross', html: '<span>R1</span>' }),
    }).addTo(leafletMap);
    rulerEndpointMarkers.push(p1Marker);
  }
  if (tools.ruler?.p2) {
    const p2Marker = window.L.marker(mapPointToLatLng(tools.ruler.p2.x, tools.ruler.p2.y), {
      icon: window.L.divIcon({ className: 'calibration-cross', html: '<span>R2</span>' }),
    }).addTo(leafletMap);
    rulerEndpointMarkers.push(p2Marker);
    rulerLine = window.L.polyline([
      mapPointToLatLng(tools.ruler.p1.x, tools.ruler.p1.y),
      mapPointToLatLng(tools.ruler.p2.x, tools.ruler.p2.y),
    ], { color: '#ffe066', dashArray: '7 7' }).addTo(leafletMap);
    const rulerText = formatRulerMeasurement(tools.ruler.p1, tools.ruler.p2);
    rulerLine.bindTooltip(rulerText, { permanent: true, direction: 'center', className: 'map-label-tooltip' });
  }
  (tools.manualMarkers ?? []).forEach((item) => {
    const color = markerStyle[item.type] ?? '#ffffff';
    const isSelected = selectedManualMarkerId === item.id;
    const marker = window.L.circleMarker(gamePointToLatLng(Number(item.x), Number(item.y)), {
      radius: isSelected ? 10 : 8,
      color,
      fillColor: color,
      fillOpacity: 0.9,
      weight: isSelected ? 4 : 2,
    }).addTo(leafletMap);
    const markerTitle = buildMarkerLabel(item.type, item.targetId);
    marker.bindPopup(`${markerTitle}<br>${getMarkerTypeName(item.type)}<br>X: ${Number(item.x).toFixed(1)}, Y: ${Number(item.y).toFixed(1)}`);
    addPersistentLabel(marker, markerTitle);
    marker.on('click', () => {
      selectedManualMarkerId = item.id;
      refreshMapOverlay();
    });
    marker.on('mousedown', (event) => {
      if (event.originalEvent?.button !== 0) return;
      selectedManualMarkerId = item.id;
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
    const markerLegendRows = (getMapToolsSettings().manualMarkers ?? []).map((item) => {
      const color = markerStyle[item.type] ?? '#ffffff';
      const label = buildMarkerLabel(item.type, item.targetId);
      return `<p><span class="legend-dot" style="--dot-color:${color}"></span>${label}: X=${Number(item.x).toFixed(1)}, Y=${Number(item.y).toFixed(1)}</p>`;
    });
    mapLegend.innerHTML = [...legendRows, `<p><span class="legend-dot" style="--dot-color:${markerStyle.target}"></span>${t('target')}: X=${targetX}, Y=${targetY}</p>`, ...markerLegendRows].join('');
  }
}

function deleteSelectedManualMarker() {
  if (!selectedManualMarkerId) return;
  const tools = getMapToolsSettings();
  const markerToDelete = (tools.manualMarkers ?? []).find((marker) => marker.id === selectedManualMarkerId);
  state.settings.mapTools = {
    ...tools,
    manualMarkers: (tools.manualMarkers ?? []).filter((marker) => marker.id !== selectedManualMarkerId),
  };
  if (markerToDelete) clearBoundMarkerCoordinates(markerToDelete);
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
batteryCountInput?.addEventListener('change', () => {
  state.settings.batteryCount = normalizeCount(batteryCountInput?.value, LIMITS.batteries);
  if (batteryCountInput) batteryCountInput.value = String(state.settings.batteryCount);
  renderGlobalConfig();
  renderGunsGrid();
  renderObservers();
  renderMissionSelectors();
  syncMarkerTargetOptions();
  syncMapMarkersWithAvailableTargets();
  persistLauncherSettings();
  refreshMapOverlay();
});
observerCountInput?.addEventListener('change', () => {
  state.settings.observerCount = normalizeCount(observerCountInput?.value, LIMITS.observers);
  if (observerCountInput) observerCountInput.value = String(state.settings.observerCount);
  renderObservers();
  syncMarkerTargetOptions();
  syncMapMarkersWithAvailableTargets();
  persistLauncherSettings();
});

document.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLSelectElement) || !event.target.matches('[data-observer-mode]')) return;
  syncObserverBindingVisibility();
});
document.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLInputElement) || !event.target.matches('[data-battery-guns-count]')) return;
  event.target.value = String(getGunCountForBattery(event.target.dataset.batteryGunsCount));
  renderGunsGrid();
  renderObservers();
  renderMissionSelectors();
  syncMarkerTargetOptions();
  syncMapMarkersWithAvailableTargets();
  persistLauncherSettings();
  refreshMapOverlay();
});
missionBatterySelect?.addEventListener('change', () => {
  renderMissionSelectors();
  syncMarkerTargetOptions();
  persistLauncherSettings();
  refreshMapOverlay();
});
missionGunSelect?.addEventListener('change', () => {
  syncMarkerTargetOptions();
  persistLauncherSettings();
  refreshMapOverlay();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Control') {
    const now = Date.now();
    if (now - lastCtrlPressAt <= 400) {
      const tools = getMapToolsSettings();
      if (tools.ruler?.p1 || tools.ruler?.p2) {
        state.settings.mapTools = { ...tools, ruler: { p1: null, p2: null } };
        persistLauncherSettings();
        refreshMapOverlay();
        if (mapToolsOutput) mapToolsOutput.textContent = t('rulerCleared');
      }
    }
    lastCtrlPressAt = now;
    return;
  }
  if (event.key !== 'Delete') return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
  deleteSelectedManualMarker();
});


document.addEventListener('input', (event) => {
  let shouldRefreshMap = false;
  if (event.target instanceof HTMLInputElement) {
    if (event.target.matches('[data-coordinate]')) {
      applyCoordinatePairInput(event.target);
      sanitizeIntegerInput(event.target, COORD_LIMITS);
      shouldRefreshMap = true;
    }
    if (event.target.matches('[data-height]')) sanitizeIntegerInput(event.target, HEIGHT_LIMITS);
    if (event.target.matches('[data-battery-title], [data-observer-name]')) {
      shouldRefreshMap = true;
      renderMissionSelectors();
      syncMarkerTargetOptions();
    }
    if (event.target.matches('#cal-scale-meters')) {
      const tools = getMapToolsSettings();
      state.settings.mapTools = { ...tools, calibrationScaleMeters: event.target.value };
    }
  }
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) {
    persistLauncherSettings();
  }
  if (shouldRefreshMap) refreshMapOverlay();
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
