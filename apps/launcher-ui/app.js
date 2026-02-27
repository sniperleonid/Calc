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
      counterBattery: parsed.counterBattery ?? {},
      artilleryProfiles: parsed.artilleryProfiles ?? {},
      gunSettings: parsed.gunSettings ?? {},
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
      counterBattery: {},
      artilleryProfiles: {},
      gunSettings: {},
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
    tabHome: 'Главная', tabGlobal: 'Глобальные настройки', tabProfiles: 'Профили', tabFire: 'Огневые задачи', tabCounterBattery: 'Контрбатарейный огонь', tabMap: 'Карта', tabSafety: 'Безопасность и данные', tabSettings: 'Настройки',
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
    correctionTitle: 'Корректировка', correctionObserver: 'Наблюдатель корректировки', saveCorrection: 'Сохранить поправку', resetCorrection: 'Сбросить поправку',
    correctionAnchorObserver: 'Привязан к наблюдателю', correctionAnchorGun: 'Корректировка от орудия (наблюдатель не привязан)',
    observerTargetingTitle: 'Наведение наблюдателем', observerTargetingHint: 'Если координаты цели неизвестны, задайте дальность, азимут и угол.', applyObserverTargeting: 'Рассчитать цель от наблюдателя',
    correctionApplied: 'Поправка сохранена', correctionResetDone: 'Поправка сброшена', observerTargetingApplied: 'Координаты цели обновлены от наблюдателя', observerTargetingUnavailable: 'Нет координат наблюдателя для наведения',
    missionTitle: 'Калькулятор огневой задачи', missionName: 'Название задачи', missionBattery: 'Батарея', missionGun: 'Орудие (или все в батарее)', missionProjectileSelectionTitle: 'Выбор снарядов по типам орудий', missionProjectileSelectionHint: 'Снаряд выбирается отдельно для каждого типа орудия, участвующего в задаче.', targetX: 'Координата цели X', targetY: 'Координата цели Y',
    fireMode: 'Тип огня', fireModeLinear: 'Линейный сноп', fireModeParallel: 'Параллельный', fireModeConverging: 'Сходящийся', fireModeOpen: 'Открытый', fireModeCircular: 'Круговой',
    counterBatteryTitle: 'Контрбатарейное обнаружение', counterBatteryHint: 'Реальные методы: звукопеленгация, анализ воронок с обратным азимутом, триангуляция по азимутам и гипербола TDOA.', counterBatteryMethod: 'Метод определения', cbMethodSound: 'Звукопеленгация (sound ranging)', cbMethodCrater: 'Анализ воронок и обратный азимут', cbMethodTriangulation: 'Триангуляция по азимутам наблюдателей', cbMethodHyperbola: 'Гипербола по разности времени прихода (TDOA)', cbBearing: 'Азимут на источник (°)', cbEstimatedDistance: 'Оценочная дальность (м)', cbTdoaDelta: 'Разница времени прихода (мс)', cbImpactBearing: 'Обратный азимут от воронки (°)', counterBatteryObservers: 'Данные наблюдателей', counterBatteryObserversHint: 'Чем больше точек наблюдения, тем точнее координаты вражеского орудия.', cbAddPoint: 'Добавить точку', cbClearPoints: 'Очистить точки', cbLocateTarget: 'Найти вражеское орудие', cbCalculateResponse: 'Рассчитать ответный огонь', cbObserverPoint: 'Точка', cbObserver: 'Наблюдатель', cbObservationAzimuth: 'Азимут наблюдения (°)', cbObservationDelay: 'Задержка звука (с)', cbNeedTwoPoints: 'Нужно минимум две валидные точки наблюдения.', cbTargetLocated: 'Цель определена', cbTargetNotFound: 'Не удалось определить координаты цели по выбранному методу.', cbResponseHeader: 'Ответный огонь (доступные орудия в зоне досягаемости)', cbNoReachableGuns: 'Нет доступных орудий в зоне досягаемости.', cbMethodUsed: 'Метод', cbRecommendedGun: 'Рекомендуем:', cbGunFacing: 'направление ', cbNeedsReposition: '(понадобится разворот вне сектора)',
    mapPanelTitle: 'Тактическая карта (Leaflet)', mapLegendTitle: 'Легенда', mapLegendHint: 'Карта показывает орудия выбранной батареи и текущую цель из вкладки «Огневые задачи».',
    syncMap: 'Синхронизировать с координатами', centerTarget: 'Центр на цели',
    safeDataTitle: 'Контроль данных', safeDataDescription: 'Проверка журналов и экспорт служебных данных.', openLogs: 'Открыть логи', exportData: 'Экспорт данных', clearAllData: 'Очистить данные',
    serviceState: 'Состояние сервисов', generalSettings: 'Общие настройки', language: 'Язык', theme: 'Тема', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: запущен', ballisticsWarn: '⚠️ Ballistics Core: не отвечает. Проверьте Python и uvicorn.',
    dataCleared: 'Локальные данные очищены', battery: 'Батарея', batteryShort: 'Б', gun: 'Орудие', gunShort: 'О', observer: 'Наблюдатель', observerShort: 'Н', x: 'X', y: 'Y',
    observerHeight: 'Высота наблюдателя (м)', observerName: 'Имя наблюдателя',
    allGuns: 'Все орудия батареи', gunProfile: 'Профиль орудия', projectileProfile: 'Профиль снаряда', gunCritical: 'Критичное орудие', gunDirectionAzimuth: 'Азимут центрального направления (°)',
    calcDone: 'Расчёт выполнен', mtoHeader: 'MTO: расход по выбранным орудиям', missionSaved: 'Миссия сохранена', noMissions: 'Сохранённых миссий нет',
    logsError: 'Не удалось загрузить логи', exportReady: 'Экспорт данных подготовлен', noLogsYet: 'Логи пока не найдены',
    target: 'Цель', openedExternalMap: 'Открыта внешняя карта',
    invalidCoordinates: 'Ошибка координат: разрешены только цифры и допустимые пределы',
    mapToolsTitle: 'Инструменты карты и калибровки', mapImageUpload: 'Загрузить свою карту (PNG/JPG)', applyMapImage: 'Применить карту', clearMapImage: 'Убрать карту',
    calibrationHint: 'Калибровка: включите режим, двойным щелчком ставьте метки P0/P1/P2 циклично. Введите только координаты P0 и длину P1-P2 в метрах.', applyCalibration: 'Применить калибровку', resetCalibration: 'Сбросить калибровку', calibrationApplied: 'Калибровка обновлена', calibrationResetDone: 'Калибровка сброшена', mapImageApplied: 'Пользовательская карта применена', mapImageCleared: 'Пользовательская карта убрана', invalidCalibration: 'Заполните корректные точки калибровки',
    markerToolLabel: 'Тип метки', markerToolGun: 'Активное орудие', markerToolBattery: 'Активная батарея', markerToolObserver: 'Наблюдатель', markerToolRuler: 'Линейка', markerToolCoords: 'Снятие координат', markerPlaced: 'Метка добавлена', markerTargetLabel: 'Активная цель метки',
    rulerPointSet: 'Точка линейки установлена', rulerMeasurement: 'Линейка', rulerCleared: 'Линейка удалена', coordsCaptured: 'Координаты точки',
    calibrationMode: 'Режим калибровки', calibrationModeToggle: 'Калибровка: выкл', calibrationModeToggleActive: 'Калибровка: вкл', calibrationScaleLabel: 'Масштаб P1-P2 (м)', calibrationKnownP0X: 'Известные координаты P0 X', calibrationKnownP0Y: 'Известные координаты P0 Y', calibrationPointSet: 'Калибровочная точка установлена', calibrationNeedThreePoints: 'Поставьте P0, P1 и P2', clearManualMarkers: 'Очистить ручные метки', profilesTitle: 'Профили орудий и боеприпасов', profilesHint: 'Настройка сектора огня, зон минимальной/максимальной дальности и привязок к снарядам/таблицам.', profileTraverseDeg: 'Сектор наведения (°)', profileMinRange: 'Минимальная дальность (м)', profileMaxRange: 'Максимальная дальность (м)', profileProjectiles: 'Привязанные снаряды', profileTables: 'Баллистические таблицы', mapRotationHint: 'Shift + левая кнопка мыши: задать азимут орудия', mapWarningPrefix: 'Предупреждение'
  },
  en: {
    appVersion: 'Calc v1', appTitle: 'Ballistics Calculator', appSubtitle: 'Unified shell for fire mission planning and operational data.',
    tabHome: 'Home', tabGlobal: 'Global settings', tabProfiles: 'Profiles', tabFire: 'Fire Missions', tabMap: 'Map', tabSafety: 'Safety & Data', tabSettings: 'Settings',
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
    correctionTitle: 'Correction', correctionObserver: 'Correction observer', saveCorrection: 'Save correction', resetCorrection: 'Reset correction',
    correctionAnchorObserver: 'Anchored to observer', correctionAnchorGun: 'Correction from gun (observer not linked)',
    observerTargetingTitle: 'Observer targeting', observerTargetingHint: 'If target coordinates are unknown, enter distance, azimuth and slope angle.', applyObserverTargeting: 'Compute target from observer',
    correctionApplied: 'Correction saved', correctionResetDone: 'Correction reset', observerTargetingApplied: 'Target coordinates updated from observer', observerTargetingUnavailable: 'Observer coordinates are unavailable',
    missionTitle: 'Fire mission calculator', missionName: 'Mission name', missionBattery: 'Battery', missionGun: 'Gun (or full battery)', missionProjectileSelectionTitle: 'Projectile selection by gun type', missionProjectileSelectionHint: 'Pick a projectile separately for each gun type involved in the mission.', targetX: 'Target X coordinate', targetY: 'Target Y coordinate',
    fireMode: 'Fire mode', fireModeLinear: 'Linear sheaf', fireModeParallel: 'Parallel', fireModeConverging: 'Converging', fireModeOpen: 'Open', fireModeCircular: 'Circular',
    counterBatteryTitle: 'Counter-battery detection', counterBatteryHint: 'Real techniques: sound ranging, crater analysis with reverse azimuth, observer azimuth triangulation, and TDOA hyperbola.', counterBatteryMethod: 'Detection method', cbMethodSound: 'Sound ranging', cbMethodCrater: 'Crater analysis + reverse azimuth', cbMethodTriangulation: 'Observer azimuth triangulation', cbMethodHyperbola: 'TDOA hyperbola', cbBearing: 'Bearing to source (°)', cbEstimatedDistance: 'Estimated range (m)', cbTdoaDelta: 'Arrival time difference (ms)', cbImpactBearing: 'Reverse azimuth from crater (°)', counterBatteryObservers: 'Observer data', counterBatteryObserversHint: 'More observation points produce better enemy gun localization.', cbAddPoint: 'Add point', cbClearPoints: 'Clear points', cbLocateTarget: 'Locate enemy gun', cbCalculateResponse: 'Calculate counter-fire', cbObserverPoint: 'Point', cbObserver: 'Observer', cbObservationAzimuth: 'Observation azimuth (°)', cbObservationDelay: 'Sound delay (s)', cbNeedTwoPoints: 'At least two valid observation points are required.', cbTargetLocated: 'Target localized', cbTargetNotFound: 'Unable to compute target coordinates with selected method.', cbResponseHeader: 'Counter-fire (reachable friendly guns)', cbNoReachableGuns: 'No reachable guns in range.', cbMethodUsed: 'Method', cbRecommendedGun: 'Recommended:', cbGunFacing: 'facing ', cbNeedsReposition: '(requires reposition outside traverse)',
    mapPanelTitle: 'Tactical map (Leaflet)', mapLegendTitle: 'Legend', mapLegendHint: 'The map shows guns in selected battery and the current target from Fire Missions tab.',
    syncMap: 'Sync with coordinates', centerTarget: 'Center on target',
    safeDataTitle: 'Data control', safeDataDescription: 'Check logs and export service data.', openLogs: 'Open logs', exportData: 'Export data', clearAllData: 'Clear data',
    serviceState: 'Service status', generalSettings: 'General settings', language: 'Language', theme: 'Theme', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: online', ballisticsWarn: '⚠️ Ballistics Core: unavailable. Check Python and uvicorn.',
    dataCleared: 'Local data has been cleared', battery: 'Battery', batteryShort: 'B', gun: 'Gun', gunShort: 'G', observer: 'Observer', observerShort: 'O', x: 'X', y: 'Y',
    observerHeight: 'Observer altitude (m)', observerName: 'Observer name',
    allGuns: 'All guns in battery', gunProfile: 'Gun profile', projectileProfile: 'Projectile profile', gunCritical: 'Critical gun', gunDirectionAzimuth: 'Central azimuth (°)',
    calcDone: 'Calculation complete', mtoHeader: 'MTO: ammo usage for selected guns', missionSaved: 'Mission saved', noMissions: 'No saved missions',
    logsError: 'Failed to load logs', exportReady: 'Data export ready', noLogsYet: 'No logs found yet',
    target: 'Target', openedExternalMap: 'Opened external map',
    invalidCoordinates: 'Coordinate error: only digits and allowed limits are accepted',
    mapToolsTitle: 'Map upload & calibration tools', mapImageUpload: 'Upload your map (PNG/JPG)', applyMapImage: 'Apply map image', clearMapImage: 'Clear map image',
    calibrationHint: 'Calibration: enable mode, double-click to place P0/P1/P2 cyclically, then enter only P0 coordinates and P1-P2 distance in meters.', applyCalibration: 'Apply calibration', resetCalibration: 'Reset calibration', calibrationApplied: 'Calibration updated', calibrationResetDone: 'Calibration reset', mapImageApplied: 'Custom map image applied', mapImageCleared: 'Custom map image cleared', invalidCalibration: 'Fill valid calibration points',
    markerToolLabel: 'Marker type', markerToolGun: 'Active gun', markerToolBattery: 'Active battery', markerToolObserver: 'Observer', markerToolRuler: 'Ruler', markerToolCoords: 'Coordinate pick', markerPlaced: 'Marker added', markerTargetLabel: 'Active marker target',
    rulerPointSet: 'Ruler point set', rulerMeasurement: 'Ruler', rulerCleared: 'Ruler removed', coordsCaptured: 'Picked coordinates',
    calibrationMode: 'Calibration mode', calibrationModeToggle: 'Calibration: off', calibrationModeToggleActive: 'Calibration: on', calibrationScaleLabel: 'P1-P2 scale (m)', calibrationKnownP0X: 'Known P0 X', calibrationKnownP0Y: 'Known P0 Y', calibrationPointSet: 'Calibration point set', calibrationNeedThreePoints: 'Set P0, P1 and P2', clearManualMarkers: 'Clear manual markers', profilesTitle: 'Gun and ammo profiles', profilesHint: 'Configure fire sector, min/max range zones, and projectile/table bindings.', profileTraverseDeg: 'Traverse sector (°)', profileMinRange: 'Min range (m)', profileMaxRange: 'Max range (m)', profileProjectiles: 'Linked projectiles', profileTables: 'Ballistic tables', mapRotationHint: 'Shift + left mouse: point gun azimuth', mapWarningPrefix: 'Warning' 
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
const missionProjectileSelectors = document.querySelector('#mission-projectile-selectors');
const fireModeSelect = document.querySelector('#fire-mode');
const correctionObserverSelect = document.querySelector('#correction-observer');
const correctionAnchorInfo = document.querySelector('#correction-anchor-info');
const fireOutput = document.querySelector('#fire-output');
const cbMethodSelect = document.querySelector('#cb-method');
const cbObservationsContainer = document.querySelector('#cb-observations');
const cbOutput = document.querySelector('#cb-output');
const safetyOutput = document.querySelector('#safety-output');
const mapLegend = document.querySelector('#map-legend');
const mapToolsOutput = document.querySelector('#map-tools-output');
const mapImageUploadInput = document.querySelector('#map-image-upload');
const markerToolSelect = document.querySelector('#marker-tool');
const markerTargetSelect = document.querySelector('#marker-target');
const calibrationModeButton = document.querySelector('#toggle-calibration-mode');
const calibrationControls = document.querySelector('#calibration-controls');
const profilesEditor = document.querySelector('#profiles-editor');

const t = (key) => i18n[state.lang][key] ?? key;

const gunProfiles = ['mortar-120-standard', 'm777-howitzer', 'd30-standard'];
function getDefaultArtilleryProfiles() {
  return {
    'mortar-120-standard': { name: 'Mortar 120', traverseDeg: 360, minRange: 450, maxRange: 7100, projectiles: 'HE/Smoke', tables: 'STD' },
    'm777-howitzer': { name: 'M777', traverseDeg: 30, minRange: 3500, maxRange: 24500, projectiles: 'M107 HE', tables: 'M777/M107' },
    'd30-standard': { name: 'D-30', traverseDeg: 60, minRange: 1000, maxRange: 15300, projectiles: 'HE', tables: 'D30/STD' },
  };
}

function getArtilleryProfiles() {
  return { ...getDefaultArtilleryProfiles(), ...(state.settings.artilleryProfiles ?? {}) };
}

function getGunSetting(gunKey) {
  const settings = state.settings.gunSettings?.[gunKey] ?? {};
  const heading = Number(settings.heading);
  return {
    heading: Number.isFinite(heading) ? heading : 360,
    isCritical: settings.isCritical !== false,
    profileId: settings.profileId || null,
  };
}


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
    activeFirePattern: null,
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
let firePatternOverlays = [];
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

  state.settings.gunSettings = { ...(state.settings.gunSettings ?? {}) };
  document.querySelectorAll('[data-gun-profile]').forEach((select) => {
    const key = select.dataset.gunProfile;
    const prev = state.settings.gunSettings[key] ?? {};
    const headingInput = document.querySelector(`[data-gun-heading="${key}"]`);
    const criticalInput = document.querySelector(`[data-gun-critical="${key}"]`);
    state.settings.gunSettings[key] = {
      ...prev,
      profileId: select.value || gunProfiles[0],
      heading: headingInput && headingInput.value !== ''
        ? clamp(Number(headingInput.value) || 0, 0, 360)
        : (Number.isFinite(Number(prev.heading)) ? Number(prev.heading) : 360),
      isCritical: criticalInput ? criticalInput.checked : prev.isCritical !== false,
    };
  });

  const profileDraft = getArtilleryProfiles();
  document.querySelectorAll('[data-profile-traverse]').forEach((input) => {
    const profileId = input.dataset.profileTraverse;
    const existing = profileDraft[profileId] ?? { name: profileId };
    profileDraft[profileId] = {
      ...existing,
      traverseDeg: clamp(Number(input.value) || 360, 1, 360),
      minRange: Math.max(0, Number(document.querySelector(`[data-profile-min-range="${profileId}"]`)?.value || 0)),
      maxRange: Math.max(0, Number(document.querySelector(`[data-profile-max-range="${profileId}"]`)?.value || 0)),
      projectiles: document.querySelector(`[data-profile-projectiles="${profileId}"]`)?.value ?? '',
      tables: document.querySelector(`[data-profile-tables="${profileId}"]`)?.value ?? '',
    };
  });
  state.settings.artilleryProfiles = profileDraft;

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

  const fireModeSettings = {};
  document.querySelectorAll('[data-fire-setting]').forEach((input) => {
    fireModeSettings[input.dataset.fireSetting] = input.value ?? '';
  });

  state.settings.mission = {
    name: document.querySelector('#mission-name')?.value ?? '',
    targetX: document.querySelector('#target-x')?.value ?? '',
    targetY: document.querySelector('#target-y')?.value ?? '',
    battery: missionBatterySelect?.value ?? '1',
    gun: missionGunSelect?.value ?? 'all',
    fireMode: fireModeSelect?.value ?? 'linear',
    correction: {
      observerId: correctionObserverSelect?.value ?? '1',
      lateralMeters: Number(document.querySelector('#correction-lr')?.value ?? 0) || 0,
      rangeMeters: Number(document.querySelector('#correction-add-drop')?.value ?? 0) || 0,
    },
    projectileByProfile: Array.from(document.querySelectorAll('[data-mission-projectile-profile]')).reduce((acc, select) => {
      if (!select.dataset.missionProjectileProfile) return acc;
      acc[select.dataset.missionProjectileProfile] = select.value || '';
      return acc;
    }, {}),
    observerTargeting: {
      distance: document.querySelector('#observer-target-distance')?.value ?? '',
      azimuth: document.querySelector('#observer-target-azimuth')?.value ?? '',
      angle: document.querySelector('#observer-target-angle')?.value ?? '',
    },
    fireModeSettings,
  };


  const counterBatteryObservations = Array.from(document.querySelectorAll('[data-cb-point]')).map((row) => ({
    observerId: row.querySelector('[data-cb-observer]')?.value ?? '',
    azimuth: row.querySelector('[data-cb-azimuth]')?.value ?? '',
    soundDelaySec: row.querySelector('[data-cb-delay]')?.value ?? '',
  }));

  state.settings.counterBattery = {
    method: cbMethodSelect?.value ?? 'azimuth-triangulation',
    soundBearing: document.querySelector('#cb-sound-bearing')?.value ?? '',
    estimatedDistance: document.querySelector('#cb-est-distance')?.value ?? '',
    tdoaDeltaMs: document.querySelector('#cb-tdoa-delta')?.value ?? '',
    impactBearing: document.querySelector('#cb-impact-bearing')?.value ?? '',
    observations: counterBatteryObservations,
    target: state.settings.counterBattery?.target ?? null,
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
  renderProfilesEditor();
  renderObservers();
  renderMissionSelectors();
  renderCounterBatterySection();
  syncFireModeSettingsVisibility();
  hydrateMapToolsForm();
  syncMarkerTargetOptions();
  refreshMapOverlay();
}


function normalizeAzimuth(value) {
  return ((Number(value) % 360) + 360) % 360;
}

function bearingToDirection(azimuthDeg) {
  const rad = (normalizeAzimuth(azimuthDeg) * Math.PI) / 180;
  return { x: Math.sin(rad), y: Math.cos(rad) };
}

function getAzimuthDelta(fromAzimuth, toAzimuth) {
  return Math.abs(((toAzimuth - fromAzimuth + 540) % 360) - 180);
}

function intersectBearings(p1, az1, p2, az2) {
  const d1 = bearingToDirection(az1);
  const d2 = bearingToDirection(az2);
  const denom = (d1.x * d2.y) - (d1.y * d2.x);
  if (Math.abs(denom) < 1e-6) return null;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const t = ((dx * d2.y) - (dy * d2.x)) / denom;
  return { x: p1.x + d1.x * t, y: p1.y + d1.y * t };
}

function getBatteryGunMaxRange(profile) {
  const ranges = {
    'mortar-120-standard': 7200,
    'd30-standard': 15300,
    'm777-howitzer': 24000,
  };
  return ranges[profile] ?? 12000;
}

function renderCounterBatterySection() {
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

function collectCounterBatteryObservations() {
  const observations = Array.from(document.querySelectorAll('[data-cb-point]')).map((row) => {
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
  return observations;
}

function locateEnemyGun() {
  const method = cbMethodSelect?.value ?? 'azimuth-triangulation';
  const observations = collectCounterBatteryObservations();
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
    const d = bearingToDirection(bearing);
    estimated = {
      x: first.point.x + d.x * distance,
      y: first.point.y + d.y * distance,
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
  persistLauncherSettings();
  cbOutput.textContent = `${t('cbTargetLocated')}: X=${estimated.x.toFixed(1)} Y=${estimated.y.toFixed(1)}\n${t('cbMethodUsed')}: ${t(method === 'sound-ranging' ? 'cbMethodSound' : method === 'crater-analysis' ? 'cbMethodCrater' : method === 'hyperbola-tdoa' ? 'cbMethodHyperbola' : 'cbMethodTriangulation')}`;
  return estimated;
}

function calculateCounterBatteryResponse() {
  const target = state.settings.counterBattery?.target ?? locateEnemyGun();
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
      headingSet,
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
    const saved = state.settings.batteryConfig[String(b)] ?? {};
    row.innerHTML = `
      <h3>${saved.title ?? `${t('battery')} ${b}`}</h3>
      <div class="pair pair-5">
        <input type="text" inputmode="numeric" data-height data-battery-height="${b}" placeholder="${t('batteryHeight')}" value="${saved.height ?? 0}" />
        <input type="number" min="1" max="5" data-battery-guns-count="${b}" placeholder="${t('gunsPerBattery')}" value="${getGunCountForBattery(b)}" />
        <select data-battery-gun-profile="${b}">${gunProfileOptions}</select>
        <input data-battery-title="${b}" placeholder="${t('batteryName')}" value="${saved.title ?? `${t('battery')} ${b}`}" />
      </div>
      <p class="hint compact">${t('batteryName')} · ${t('batteryHeight')} · ${t('gunsPerBattery')} · ${t('gunProfile')}</p>`;
    container.append(row);
    row.querySelector(`[data-battery-gun-profile="${b}"]`).value = saved.gunProfile ?? gunProfiles[0];
  }
}

function renderGunsGrid() {
  const container = document.querySelector('#guns-coordinates');
  if (!container) return;
  const batteries = Number(batteryCountInput?.value || 1);
  const profiles = getArtilleryProfiles();
  const profileOptions = Object.entries(profiles).map(([id, profile]) => `<option value="${id}">${profile.name ?? id}</option>`).join('');
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
      const gunState = getGunSetting(key);
      const batteryDefaultProfile = state.settings.batteryConfig?.[String(b)]?.gunProfile ?? gunProfiles[0];
      const activeProfileId = gunState.profileId || batteryDefaultProfile;
      const activeProfile = profiles[activeProfileId] ?? profiles[gunProfiles[0]];
      const traverseDeg = clamp(Number(activeProfile?.traverseDeg) || 360, 1, 360);
      const row = document.createElement('div');
      row.className = 'pair';
      const headingValue = gunState.heading < 360 ? normalizeAzimuth(gunState.heading).toFixed(1) : '';
      row.innerHTML = `<label>${t('batteryShort')}${b}-${t('gunShort')}${g}</label><input data-gun-x="${key}" type="text" inputmode="numeric" data-coordinate placeholder="${t('x')}" value="${saved.x ?? 1000 + b * 100 + g * 10}" /><input data-gun-y="${key}" type="text" inputmode="numeric" data-coordinate placeholder="${t('y')}" value="${saved.y ?? 1000 + b * 120 + g * 10}" /><select data-gun-profile="${key}">${profileOptions}</select><label><input data-gun-critical="${key}" type="checkbox" ${gunState.isCritical ? 'checked' : ''} /> ${t('gunCritical')}</label><input data-gun-heading="${key}" type="number" min="0" max="360" step="0.1" placeholder="${t('gunDirectionAzimuth')}" value="${headingValue}" />`;
      container.append(row);
      const profileSelect = row.querySelector(`[data-gun-profile="${key}"]`);
      if (profileSelect) profileSelect.value = gunState.profileId || batteryDefaultProfile;
    }
  }
}

function renderProfilesEditor() {
  if (!profilesEditor) return;
  const profiles = getArtilleryProfiles();
  profilesEditor.innerHTML = '';
  Object.entries(profiles).forEach(([profileId, profile]) => {
    const row = document.createElement('div');
    row.className = 'profile-row';
    row.innerHTML = `<h3>${profile.name ?? profileId}</h3><div class="pair pair-5"><input data-profile-traverse="${profileId}" type="number" min="1" max="360" value="${profile.traverseDeg ?? 360}" placeholder="${t('profileTraverseDeg')}" /><input data-profile-min-range="${profileId}" type="number" min="0" value="${profile.minRange ?? 0}" placeholder="${t('profileMinRange')}" /><input data-profile-max-range="${profileId}" type="number" min="0" value="${profile.maxRange ?? 0}" placeholder="${t('profileMaxRange')}" /><input data-profile-projectiles="${profileId}" value="${profile.projectiles ?? ''}" placeholder="${t('profileProjectiles')}" /><input data-profile-tables="${profileId}" value="${profile.tables ?? ''}" placeholder="${t('profileTables')}" /></div>`;
    profilesEditor.append(row);
  });
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


function parseProjectileOptions(profile) {
  const raw = String(profile?.projectiles ?? '').trim();
  if (!raw) return ['default'];
  const parsed = raw.split(/[\/,;]/).map((item) => item.trim()).filter(Boolean);
  return parsed.length ? parsed : [raw];
}

function renderMissionProjectileSelectors() {
  if (!missionProjectileSelectors) return;
  const battery = Number(missionBatterySelect?.value || 1);
  const selectedGun = missionGunSelect?.value ?? 'all';
  const gunsPerBattery = getGunCountForBattery(battery);
  const gunIds = selectedGun === 'all' ? Array.from({ length: gunsPerBattery }, (_, idx) => idx + 1) : [Number(selectedGun)];
  const profiles = getArtilleryProfiles();
  const usedProfiles = new Set();
  gunIds.forEach((gunId) => {
    const profileId = getProfileForGun(battery, gunId).profileId;
    if (profileId) usedProfiles.add(profileId);
  });

  const saved = state.settings.mission?.projectileByProfile ?? {};
  missionProjectileSelectors.innerHTML = '';
  usedProfiles.forEach((profileId) => {
    const profile = profiles[profileId] ?? { name: profileId };
    const options = parseProjectileOptions(profile);
    const row = document.createElement('div');
    row.className = 'pair';
    row.innerHTML = `<label>${profile.name ?? profileId}</label><select data-mission-projectile-profile="${profileId}">${options.map((option) => `<option value="${option}">${option}</option>`).join('')}</select>`;
    missionProjectileSelectors.append(row);
    const select = row.querySelector(`[data-mission-projectile-profile="${profileId}"]`);
    if (select) select.value = options.includes(saved[profileId]) ? saved[profileId] : options[0];
  });
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
  renderMissionProjectileSelectors();

  document.querySelector('#mission-name').value = state.settings.mission.name ?? '';
  document.querySelector('#target-x').value = state.settings.mission.targetX ?? '';
  document.querySelector('#target-y').value = state.settings.mission.targetY ?? '';

  syncCorrectionObserverOptions();
  const correction = state.settings.mission.correction ?? {};
  const correctionLrInput = document.querySelector('#correction-lr');
  const correctionAddDropInput = document.querySelector('#correction-add-drop');
  if (correctionLrInput) correctionLrInput.value = correction.lateralMeters ?? 0;
  if (correctionAddDropInput) correctionAddDropInput.value = correction.rangeMeters ?? 0;

  document.querySelector('#observer-target-distance').value = state.settings.mission.observerTargeting?.distance ?? '';
  document.querySelector('#observer-target-azimuth').value = state.settings.mission.observerTargeting?.azimuth ?? '';
  document.querySelector('#observer-target-angle').value = state.settings.mission.observerTargeting?.angle ?? '';

  if (fireModeSelect) fireModeSelect.value = state.settings.mission.fireMode ?? 'linear';
  const fireModeSettings = state.settings.mission.fireModeSettings ?? {};
  document.querySelectorAll('[data-fire-setting]').forEach((input) => {
    input.value = fireModeSettings[input.dataset.fireSetting] ?? '';
  });
  syncFireModeSettingsVisibility();
}

function getBatteryHeight(batteryId) {
  const parsed = parseHeightValue(document.querySelector(`[data-battery-height="${batteryId}"]`)?.value);
  return parsed ?? Number.NaN;
}

function getObserverEntries() {
  const observers = Number(observerCountInput?.value || 1);
  return Array.from({ length: observers }, (_, idx) => String(idx + 1));
}

function getObserverAnchorForMission(observerId, batteryId, gunId) {
  const mode = document.querySelector(`[data-observer-mode="${observerId}"]`)?.value ?? 'gun';
  const batteryLink = document.querySelector(`[data-observer-battery="${observerId}"]`)?.value ?? '';
  const gunLink = document.querySelector(`[data-observer-gun="${observerId}"]`)?.value ?? '';
  const observerPoint = readXYFromInputs(
    document.querySelector(`[data-observer-x="${observerId}"]`),
    document.querySelector(`[data-observer-y="${observerId}"]`),
  );
  const hasObserverAnchor = observerPoint
    && ((mode === 'battery' && batteryLink === `battery-${batteryId}`)
      || (mode === 'gun' && gunLink === `gun-${batteryId}-${gunId}`));

  if (hasObserverAnchor) return { x: observerPoint.x, y: observerPoint.y, byObserver: true };

  const gunPoint = readXYFromInputs(
    document.querySelector(`[data-gun-x="${batteryId}-${gunId}"]`),
    document.querySelector(`[data-gun-y="${batteryId}-${gunId}"]`),
  );
  if (!gunPoint) return null;
  return { x: gunPoint.x, y: gunPoint.y, byObserver: false };
}

function syncCorrectionObserverOptions() {
  if (!correctionObserverSelect) return;
  const options = getObserverEntries().map((observerId) => `<option value="${observerId}">${getObserverDisplayName(observerId)}</option>`);
  correctionObserverSelect.innerHTML = options.join('');
  const savedObserver = state.settings.mission?.correction?.observerId;
  if (savedObserver && options.some((opt) => opt.includes(`value="${savedObserver}"`))) {
    correctionObserverSelect.value = String(savedObserver);
  }

  if (!correctionObserverSelect.value && options.length) correctionObserverSelect.value = '1';
  updateCorrectionAnchorHint();
}

function updateCorrectionAnchorHint() {
  if (!correctionAnchorInfo || !correctionObserverSelect) return;
  const battery = Number(missionBatterySelect?.value || 1);
  const gun = Number(missionGunSelect?.value === 'all' ? 1 : missionGunSelect?.value || 1);
  const anchor = getObserverAnchorForMission(correctionObserverSelect.value, battery, gun);
  correctionAnchorInfo.textContent = anchor?.byObserver ? t('correctionAnchorObserver') : t('correctionAnchorGun');
}

function getMissionCorrection() {
  const correction = state.settings.mission?.correction ?? {};
  return {
    observerId: correctionObserverSelect?.value || correction.observerId || '1',
    lateralMeters: Number(document.querySelector('#correction-lr')?.value ?? correction.lateralMeters ?? 0) || 0,
    rangeMeters: Number(document.querySelector('#correction-add-drop')?.value ?? correction.rangeMeters ?? 0) || 0,
  };
}

function applyCorrectionToTarget(target, anchor, correction) {
  const dx = target.x - anchor.x;
  const dy = target.y - anchor.y;
  const baseDistance = Math.hypot(dx, dy) || 1;
  const forwardX = dx / baseDistance;
  const forwardY = dy / baseDistance;
  const rightX = forwardY;
  const rightY = -forwardX;
  return {
    x: target.x + rightX * correction.lateralMeters + forwardX * correction.rangeMeters,
    y: target.y + rightY * correction.lateralMeters + forwardY * correction.rangeMeters,
  };
}

function saveCorrectionSettings() {
  const correction = {
    observerId: correctionObserverSelect?.value || '1',
    lateralMeters: Number(document.querySelector('#correction-lr')?.value || 0),
    rangeMeters: Number(document.querySelector('#correction-add-drop')?.value || 0),
  };
  state.settings.mission = { ...(state.settings.mission ?? {}), correction };
  persistLauncherSettings();
  fireOutput.textContent = t('correctionApplied');
}

function resetCorrectionSettings() {
  const lrInput = document.querySelector('#correction-lr');
  const addDropInput = document.querySelector('#correction-add-drop');
  if (lrInput) lrInput.value = '0';
  if (addDropInput) addDropInput.value = '0';
  state.settings.mission = { ...(state.settings.mission ?? {}), correction: { observerId: correctionObserverSelect?.value || '1', lateralMeters: 0, rangeMeters: 0 } };
  persistLauncherSettings();
  fireOutput.textContent = t('correctionResetDone');
}

function applyObserverTargeting() {
  const observerId = correctionObserverSelect?.value || '1';
  const observerPoint = readXYFromInputs(
    document.querySelector(`[data-observer-x="${observerId}"]`),
    document.querySelector(`[data-observer-y="${observerId}"]`),
  );
  if (!observerPoint) {
    fireOutput.textContent = t('observerTargetingUnavailable');
    return;
  }

  const distance = Number(document.querySelector('#observer-target-distance')?.value || 0);
  const azimuth = Number(document.querySelector('#observer-target-azimuth')?.value || 0);
  const angle = Number(document.querySelector('#observer-target-angle')?.value || 0);
  const horizontal = distance * Math.cos((angle * Math.PI) / 180);
  const targetX = observerPoint.x + Math.sin((azimuth * Math.PI) / 180) * horizontal;
  const targetY = observerPoint.y + Math.cos((azimuth * Math.PI) / 180) * horizontal;

  const targetXInput = document.querySelector('#target-x');
  const targetYInput = document.querySelector('#target-y');
  if (targetXInput) targetXInput.value = String(Math.round(targetX));
  if (targetYInput) targetYInput.value = String(Math.round(targetY));
  persistLauncherSettings();
  refreshMapOverlay();
  fireOutput.textContent = t('observerTargetingApplied');
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

function syncFireModeSettingsVisibility() {
  const mode = fireModeSelect?.value ?? 'linear';
  document.querySelectorAll('[data-fire-mode-panel]').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.fireModePanel !== mode);
  });
}

function toFiniteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function buildActiveFirePattern({ mode, targetX, targetY }) {
  const settings = state.settings.mission.fireModeSettings ?? {};
  if (mode === 'linear') {
    return {
      mode,
      geometry: {
        type: 'line',
        start: { x: toFiniteNumber(settings.linearStartX, targetX - 120), y: toFiniteNumber(settings.linearStartY, targetY - 120) },
        end: { x: toFiniteNumber(settings.linearEndX, targetX + 120), y: toFiniteNumber(settings.linearEndY, targetY + 120) },
      },
    };
  }

  if (mode === 'parallel') {
    const width = Math.max(10, toFiniteNumber(settings.parallelWidth, 180));
    const lanes = Math.max(2, Math.min(10, Math.round(toFiniteNumber(settings.parallelLanes, 3))));
    const spacing = width / (lanes - 1);
    const lines = Array.from({ length: lanes }, (_, index) => {
      const offset = -width / 2 + index * spacing;
      return { start: { x: targetX - 120, y: targetY + offset }, end: { x: targetX + 120, y: targetY + offset } };
    });
    return { mode, geometry: { type: 'parallel-lines', lines } };
  }

  if (mode === 'converging') {
    const radius = Math.max(10, toFiniteNumber(settings.convergingRadius, 160));
    const azimuthDeg = toFiniteNumber(settings.convergingAzimuth, 0);
    const angleRad = (azimuthDeg * Math.PI) / 180;
    const spread = Math.PI / 3;
    const lines = [-1, 0, 1].map((idx) => {
      const angle = angleRad + idx * (spread / 2);
      return {
        start: { x: targetX + Math.sin(angle) * radius, y: targetY + Math.cos(angle) * radius },
        end: { x: targetX, y: targetY },
      };
    });
    return { mode, geometry: { type: 'converging-lines', lines } };
  }

  if (mode === 'circular') {
    const radius = Math.max(10, toFiniteNumber(settings.circularRadius, 120));
    const count = Math.max(4, Math.min(24, Math.round(toFiniteNumber(settings.circularCount, 10))));
    const points = Array.from({ length: count }, (_, index) => {
      const angle = (Math.PI * 2 * index) / count;
      return { x: targetX + Math.sin(angle) * radius, y: targetY + Math.cos(angle) * radius };
    });
    return { mode, geometry: { type: 'ring', center: { x: targetX, y: targetY }, radius, points } };
  }

  const width = Math.max(10, toFiniteNumber(settings.openWidth, 220));
  const depth = Math.max(10, toFiniteNumber(settings.openDepth, 160));
  return {
    mode: 'open',
    geometry: {
      type: 'rectangle',
      vertices: [
        { x: targetX - width / 2, y: targetY - depth / 2 },
        { x: targetX + width / 2, y: targetY - depth / 2 },
        { x: targetX + width / 2, y: targetY + depth / 2 },
        { x: targetX - width / 2, y: targetY + depth / 2 },
      ],
    },
  };
}

function calculateFire() {
  const targetInput = readXYFromInputs(document.querySelector('#target-x'), document.querySelector('#target-y'));
  if (!targetInput) {
    fireOutput.textContent = t('invalidCoordinates');
    return;
  }
  const rawTargetX = targetInput.x;
  const rawTargetY = targetInput.y;
  const battery = Number(missionBatterySelect.value || 1);
  const selectedGun = missionGunSelect.value;
  const fireMode = fireModeSelect?.value ?? 'linear';
  const gunsPerBattery = getGunCountForBattery(battery);
  const gunIds = selectedGun === 'all' ? Array.from({ length: gunsPerBattery }, (_, idx) => idx + 1) : [Number(selectedGun)];
  const batteryHeight = getBatteryHeight(battery);
  if (!Number.isFinite(batteryHeight)) {
    fireOutput.textContent = t('invalidCoordinates');
    return;
  }

  const correction = getMissionCorrection();
  const anchorGunForCorrection = selectedGun === 'all' ? 1 : Number(selectedGun);
  const correctionAnchor = getObserverAnchorForMission(correction.observerId, battery, anchorGunForCorrection);
  const correctedTarget = correctionAnchor
    ? applyCorrectionToTarget({ x: rawTargetX, y: rawTargetY }, correctionAnchor, correction)
    : { x: rawTargetX, y: rawTargetY };
  const targetX = correctedTarget.x;
  const targetY = correctedTarget.y;

  const results = gunIds.map((gunId) => {
    const gunPoint = readXYFromInputs(
      document.querySelector(`[data-gun-x="${battery}-${gunId}"]`),
      document.querySelector(`[data-gun-y="${battery}-${gunId}"]`),
    );
    if (!gunPoint) return null;
    const { profileId, profile } = getProfileForGun(battery, gunId);
    const projectile = document.querySelector(`[data-mission-projectile-profile="${profileId}"]`)?.value || parseProjectileOptions(profile)[0];
    const gunX = gunPoint.x;
    const gunY = gunPoint.y;
    const dx = targetX - gunX;
    const dy = targetY - gunY;
    const distance = Math.hypot(dx, dy);
    const azimuth = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
    const azimuthMils = (azimuth * 6400) / 360;
    const elevationMils = ((Math.atan2(batteryHeight, distance || 1) * 1000) / Math.PI) * 17.7778;
    return { gunId, profileId, projectile, tableRef: profile?.tables ?? 'N/A', distance: distance.toFixed(1), azimuth: azimuth.toFixed(2), azimuthMils: azimuthMils.toFixed(1), elevation: elevationMils.toFixed(1) };
  });

  if (results.some((row) => row === null)) {
    fireOutput.textContent = t('invalidCoordinates');
    return;
  }

  const output = [`${t('calcDone')}: ${document.querySelector('#mission-name')?.value || 'Mission'}`,
    `${t('fireMode')}: ${t(`fireMode${fireMode[0].toUpperCase()}${fireMode.slice(1)}`)}`,
    `Target: X=${targetX.toFixed(1)} Y=${targetY.toFixed(1)}` ,
    ...results.map((row) => `${t('gun')} ${row.gunId} (${row.profileId}, ${row.projectile}): D=${row.distance}m Az=${row.azimuth}°/${row.azimuthMils} mil Elev=${row.elevation} mil · Tbl=${row.tableRef}`)].join('\n');

  const observerCorrections = getObserverCorrections(battery, gunIds, batteryHeight);
  const observerRows = observerCorrections.map((item) => `${getObserverDisplayName(item.observerId)}: ΔH=${item.heightDelta}m`);

  fireOutput.textContent = observerRows.length ? `${output}\n${observerRows.join('\n')}` : output;
  const tools = getMapToolsSettings();
  state.settings.mapTools = { ...tools, activeFirePattern: buildActiveFirePattern({ mode: fireMode, targetX, targetY }) };
  persistLauncherSettings();
  refreshMapOverlay();
  return { results, battery, selectedGun, targetX, targetY, rawTargetX, rawTargetY, batteryHeight, fireMode };
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

function getProfileForGun(batteryId, gunId) {
  const gunKey = `${batteryId}-${gunId}`;
  const profiles = getArtilleryProfiles();
  const gunSetting = getGunSetting(gunKey);
  const batteryDefault = state.settings.batteryConfig?.[String(batteryId)]?.gunProfile ?? gunProfiles[0];
  return {
    profileId: gunSetting.profileId || batteryDefault,
    profile: profiles[gunSetting.profileId || batteryDefault] ?? profiles[gunProfiles[0]],
    heading: clamp(Number((profiles[gunSetting.profileId || batteryDefault] ?? profiles[gunProfiles[0]])?.traverseDeg) || 360, 1, 360) < 360 && gunSetting.isCritical
      ? normalizeAzimuth(gunSetting.heading ?? 0)
      : 0,
  };
}

function buildSectorPolygonPoints({ x, y, heading, traverseDeg, radius }) {
  const half = Math.max(0.5, Number(traverseDeg) / 2);
  const segments = 20;
  const points = [{ x, y }];
  for (let idx = 0; idx <= segments; idx += 1) {
    const angle = normalizeAzimuth(heading - half + (idx / segments) * (half * 2));
    const rad = (angle * Math.PI) / 180;
    points.push({ x: x + Math.sin(rad) * radius, y: y + Math.cos(rad) * radius });
  }
  points.push({ x, y });
  return points;
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
    activeFirePattern: null,
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

function drawFirePatternOverlay(pattern, markerStyle) {
  if (!leafletMap || !pattern?.geometry) return [];
  const overlays = [];
  const color = markerStyle.firePattern;
  const toLatLng = (point) => gamePointToLatLng(point.x, point.y);
  const geometry = pattern.geometry;

  if (geometry.type === 'line') {
    overlays.push(window.L.polyline([toLatLng(geometry.start), toLatLng(geometry.end)], { color, weight: 3 }).addTo(leafletMap));
  }
  if (geometry.type === 'parallel-lines' || geometry.type === 'converging-lines') {
    (geometry.lines ?? []).forEach((line) => {
      overlays.push(window.L.polyline([toLatLng(line.start), toLatLng(line.end)], { color, weight: 2, dashArray: '6 6' }).addTo(leafletMap));
    });
  }
  if (geometry.type === 'rectangle') {
    overlays.push(window.L.polygon((geometry.vertices ?? []).map(toLatLng), { color, weight: 2, fillOpacity: 0.08 }).addTo(leafletMap));
  }
  if (geometry.type === 'ring') {
    overlays.push(window.L.circle(toLatLng(geometry.center), { color, radius: geometry.radius, weight: 2, fillOpacity: 0.05 }).addTo(leafletMap));
  }

  return overlays;
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
  firePatternOverlays.forEach((overlay) => overlay.remove());
  firePatternOverlays = [];
  if (calibrationLine) {
    calibrationLine.remove();
    calibrationLine = null;
  }
  if (rulerLine) {
    rulerLine.remove();
    rulerLine = null;
  }

  const battery = Number(missionBatterySelect?.value || 1);

  const legendRows = [`<p>${t('mapRotationHint')}</p>`];
  const markerStyle = {
    gun: '#00ff57',
    observer: '#00d4ff',
    battery: '#ffd84d',
    target: '#ff7a1a',
    firePattern: '#ff4df0',
  };
  const targetPoint = readXYFromInputs(document.querySelector('#target-x'), document.querySelector('#target-y')) ?? { x: 0, y: 0 };
  const targetX = targetPoint.x;
  const targetY = targetPoint.y;
  const warnings = [];
  const allGunPoints = getAllGunPoints();
  allGunPoints.forEach(({ batteryId, gunId, x: gunX, y: gunY }) => {
    const gunKey = `${batteryId}-${gunId}`;
    const { profile, heading } = getProfileForGun(batteryId, gunId);
    const traverseDeg = clamp(Number(profile?.traverseDeg) || 360, 1, 360);
    const minRange = Math.max(0, Number(profile?.minRange) || 0);
    const maxRange = Math.max(minRange, Number(profile?.maxRange) || 0);

    if (maxRange > 0) {
      const maxCircle = window.L.circle(gamePointToLatLng(gunX, gunY), {
        radius: maxRange,
        color: '#5fd1ff',
        fillColor: '#5fd1ff',
        fillOpacity: 0.05,
        weight: 1,
      }).addTo(leafletMap);
      gunMarkers.push(maxCircle);
    }
    if (minRange > 0) {
      const minCircle = window.L.circle(gamePointToLatLng(gunX, gunY), {
        radius: minRange,
        color: '#ff4d4d',
        fillColor: '#ff4d4d',
        fillOpacity: 0.08,
        weight: 1,
        dashArray: '4 6',
      }).addTo(leafletMap);
      gunMarkers.push(minCircle);
    }

    if (traverseDeg < 360 && maxRange > 0) {
      const sector = buildSectorPolygonPoints({ x: gunX, y: gunY, heading, traverseDeg, radius: maxRange });
      const sectorPolygon = window.L.polygon(sector.map((point) => gamePointToLatLng(point.x, point.y)), {
        color: '#ffe066',
        fillColor: '#ffe066',
        fillOpacity: 0.08,
        weight: 1,
      }).addTo(leafletMap);
      gunMarkers.push(sectorPolygon);
    }

    const marker = window.L.circleMarker(gamePointToLatLng(gunX, gunY), {
      radius: 8,
      color: markerStyle.gun,
      fillColor: markerStyle.gun,
      fillOpacity: 0.9,
      weight: 2,
    }).addTo(leafletMap);
    let headingLine = null;
    if (heading < 360) {
      const headingRad = (normalizeAzimuth(heading) * Math.PI) / 180;
      const stickLength = 140;
      headingLine = window.L.polyline([
        gamePointToLatLng(gunX, gunY),
        gamePointToLatLng(gunX + Math.sin(headingRad) * stickLength, gunY + Math.cos(headingRad) * stickLength),
      ], { color: '#ffffff', weight: 2 }).addTo(leafletMap);
    }

    const dx = targetX - gunX;
    const dy = targetY - gunY;
    const targetAz = normalizeAzimuth((Math.atan2(dx, dy) * 180) / Math.PI);
    const targetDistance = Math.hypot(dx, dy);
    const offset = heading < 360 ? getAzimuthDelta(heading, targetAz) : 0;
    const inSector = heading >= 360 || traverseDeg >= 360 || offset <= traverseDeg / 2;
    const inRange = targetDistance >= minRange && (maxRange <= 0 || targetDistance <= maxRange);
    if (!inSector || !inRange) {
      warnings.push(`${t('batteryShort')}${batteryId}-${t('gunShort')}${gunId}: Az ${targetAz.toFixed(1)}°${inSector ? '' : `, rotate to ${targetAz.toFixed(1)}°`}${inRange ? '' : `, D=${targetDistance.toFixed(0)}m`}`);
    }

    marker.on('mousedown', (event) => {
      if (event.originalEvent?.button !== 0 || !event.originalEvent?.shiftKey) return;
      const latlng = event.latlng;
      const mapPoint = latLngToMapPoint(latlng.lat, latlng.lng);
      const mousePoint = imagePointToGamePoint(mapPoint.x, mapPoint.y);
      const azimuthDeg = normalizeAzimuth((Math.atan2(mousePoint.x - gunX, mousePoint.y - gunY) * 180) / Math.PI);
      state.settings.gunSettings = { ...(state.settings.gunSettings ?? {}), [gunKey]: { ...getGunSetting(gunKey), heading: azimuthDeg, profileId: getGunSetting(gunKey).profileId || state.settings.batteryConfig?.[String(batteryId)]?.gunProfile || gunProfiles[0] } };
      persistLauncherSettings();
      refreshMapOverlay();
    });

    const gunLabel = `${t('batteryShort')}${batteryId}-${t('gunShort')}${gunId}`;
    marker.bindPopup(`${gunLabel}<br>X: ${gunX}, Y: ${gunY}<br>Az: ${heading.toFixed(1)}°<br>${profile?.name ?? ''}`);
    addPersistentLabel(marker, gunLabel);
    gunMarkers.push(marker);
    if (headingLine) gunMarkers.push(headingLine);
    legendRows.push(`<p><span class="legend-dot" style="--dot-color:${markerStyle.gun}"></span>${gunLabel}: X=${gunX}, Y=${gunY}, Az=${heading.toFixed(1)}°, ${profile?.name ?? ''}</p>`);
  });


  if (warnings.length && mapToolsOutput) {
    mapToolsOutput.textContent = `${t('mapWarningPrefix')}:\n${warnings.join('\n')}`;
  }

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
  firePatternOverlays = drawFirePatternOverlay(tools.activeFirePattern, markerStyle);
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
    const patternRow = tools.activeFirePattern ? `<p><span class="legend-dot" style="--dot-color:${markerStyle.firePattern}"></span>${t('fireMode')}: ${t(`fireMode${tools.activeFirePattern.mode[0].toUpperCase()}${tools.activeFirePattern.mode.slice(1)}`)}</p>` : '';
    mapLegend.innerHTML = [...legendRows, `<p><span class="legend-dot" style="--dot-color:${markerStyle.target}"></span>${t('target')}: X=${targetX}, Y=${targetY}</p>`, patternRow, ...markerLegendRows].filter(Boolean).join('');
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
document.querySelector('#save-correction')?.addEventListener('click', saveCorrectionSettings);
document.querySelector('#reset-correction')?.addEventListener('click', resetCorrectionSettings);
document.querySelector('#apply-observer-targeting')?.addEventListener('click', applyObserverTargeting);
document.querySelector('#cb-add-point')?.addEventListener('click', () => {
  const current = state.settings.counterBattery?.observations ?? [];
  state.settings.counterBattery = { ...(state.settings.counterBattery ?? {}), observations: [...current, { observerId: '1', azimuth: '', soundDelaySec: '' }] };
  renderCounterBatterySection();
});
document.querySelector('#cb-clear-points')?.addEventListener('click', () => {
  state.settings.counterBattery = { ...(state.settings.counterBattery ?? {}), observations: [] };
  renderCounterBatterySection();
  cbOutput.textContent = '';
});
document.querySelector('#cb-locate-target')?.addEventListener('click', locateEnemyGun);
document.querySelector('#cb-calculate-response')?.addEventListener('click', calculateCounterBatteryResponse);
batteryCountInput?.addEventListener('change', () => {
  state.settings.batteryCount = normalizeCount(batteryCountInput?.value, LIMITS.batteries);
  if (batteryCountInput) batteryCountInput.value = String(state.settings.batteryCount);
  renderGlobalConfig();
  renderGunsGrid();
  renderProfilesEditor();
  renderObservers();
  renderMissionSelectors();
  renderCounterBatterySection();
  syncMarkerTargetOptions();
  syncMapMarkersWithAvailableTargets();
  persistLauncherSettings();
  refreshMapOverlay();
});
observerCountInput?.addEventListener('change', () => {
  state.settings.observerCount = normalizeCount(observerCountInput?.value, LIMITS.observers);
  if (observerCountInput) observerCountInput.value = String(state.settings.observerCount);
  renderObservers();
  renderCounterBatterySection();
  syncCorrectionObserverOptions();
  syncMarkerTargetOptions();
  syncMapMarkersWithAvailableTargets();
  persistLauncherSettings();
});

document.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLSelectElement)) return;
  if (!event.target.matches('[data-observer-mode], [data-observer-gun], [data-observer-battery]')) return;
  syncObserverBindingVisibility();
  updateCorrectionAnchorHint();
  persistLauncherSettings();
});
document.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)) return;
  if (!event.target.matches('[data-gun-profile], [data-gun-critical], [data-gun-heading], [data-profile-traverse], [data-profile-min-range], [data-profile-max-range], [data-profile-projectiles], [data-profile-tables]')) return;
  persistLauncherSettings();
  renderProfilesEditor();
  renderGunsGrid();
  refreshMapOverlay();
});

document.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLInputElement) || !event.target.matches('[data-battery-guns-count]')) return;
  event.target.value = String(getGunCountForBattery(event.target.dataset.batteryGunsCount));
  renderGunsGrid();
  renderProfilesEditor();
  renderObservers();
  renderMissionSelectors();
  renderCounterBatterySection();
  syncMarkerTargetOptions();
  syncMapMarkersWithAvailableTargets();
  persistLauncherSettings();
  refreshMapOverlay();
});
missionBatterySelect?.addEventListener('change', () => {
  renderMissionSelectors();
  updateCorrectionAnchorHint();
  syncMarkerTargetOptions();
  persistLauncherSettings();
  refreshMapOverlay();
});
missionGunSelect?.addEventListener('change', () => {
  renderMissionProjectileSelectors();
  updateCorrectionAnchorHint();
  syncMarkerTargetOptions();
  persistLauncherSettings();
  refreshMapOverlay();
});

correctionObserverSelect?.addEventListener('change', () => {
  updateCorrectionAnchorHint();
  persistLauncherSettings();
});

fireModeSelect?.addEventListener('change', () => {
  syncFireModeSettingsVisibility();
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
    if (event.target.matches('[data-gun-heading]')) shouldRefreshMap = true;
    if (event.target.matches('[data-battery-title], [data-observer-name]')) {
      shouldRefreshMap = true;
      renderMissionSelectors();
      syncMarkerTargetOptions();
    }
    if (event.target.matches('#cal-scale-meters')) {
      const tools = getMapToolsSettings();
      state.settings.mapTools = { ...tools, calibrationScaleMeters: event.target.value };
    }
    if (event.target.matches('[data-fire-setting]')) {
      syncFireModeSettingsVisibility();
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
