const SETTINGS_KEY = 'calc.launcherSettings';
const LIMITS = {
  batteries: { min: 1, max: 5 },
  gunsPerBattery: { min: 1, max: 5 },
  observers: { min: 1, max: 5 },
};
const COORD_LIMITS = { min: 0, max: 999999 };
const HEIGHT_LIMITS = { min: 0, max: 10000 };
const MAP_IMAGE_UPLOAD_MAX_BYTES = 150 * 1024 * 1024;
const MAP_IMAGE_UPLOAD_MAX_DIMENSION = 4096;

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
    batteryHeight: 'Высота (м)', gunsPerBattery: 'Кол-во орудий', batteryName: 'Название', coordinatesTitle: 'Координаты и наблюдатели', gunsHint: 'Для каждого орудия укажите координаты карты.',
    observerTitle: 'Наблюдатели и привязки', observerCount: 'Количество наблюдателей (до 5)', observerBinding: 'Привязка наблюдателя', observerMode: 'Режим',
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
    dataCleared: 'Локальные данные очищены', clearBrowserCache: 'Очистить кэш браузера страницы', browserCacheCleared: 'Кэш браузера страницы очищен', battery: 'Батарея', batteryShort: 'Б', gun: 'Орудие', gunShort: 'О', observer: 'Наблюдатель', observerShort: 'Н', x: 'X', y: 'Y',
    observerHeight: 'Высота (м)', observerName: 'Имя наблюдателя',
    allGuns: 'Все орудия батареи', gunProfile: 'Профиль орудия', projectileProfile: 'Профиль снаряда', gunDirectionAzimuth: 'Азимут центрального направления (°)',
    calcDone: 'Расчёт выполнен', mtoHeader: 'MTO: расход по выбранным орудиям', missionSaved: 'Миссия сохранена', noMissions: 'Сохранённых миссий нет',
    logsError: 'Не удалось загрузить логи', exportReady: 'Экспорт данных подготовлен', noLogsYet: 'Логи пока не найдены',
    target: 'Цель', openedExternalMap: 'Открыта внешняя карта',
    invalidCoordinates: 'Ошибка координат: разрешены только цифры и допустимые пределы',
    mapToolsTitle: 'Инструменты меток', mapImageUpload: 'Загрузить свою карту (PNG/JPG)', pasteMapImage: 'Вставить карту из буфера', applyMapImage: 'Применить карту', clearMapImage: 'Убрать карту', mapImageTooLarge: 'Файл карты больше 150 МБ. Уменьшите файл и попробуйте снова.', mapImageUploadFailed: 'Не удалось загрузить изображение карты на сервер.', mapImageClipboardUnsupported: 'Буфер обмена не поддерживается браузером или недоступен без HTTPS/localhost.', mapImageClipboardEmpty: 'В буфере обмена не найдено изображение.',
    calibrationHint: 'Калибровка: включите режим, двойным щелчком ставьте метки P0/P1/P2 циклично. Введите только координаты P0 и длину P1-P2 в метрах.', applyCalibration: 'Применить калибровку', resetCalibration: 'Сбросить калибровку', calibrationApplied: 'Калибровка обновлена', calibrationResetDone: 'Калибровка сброшена', mapImageApplied: 'Пользовательская карта применена', mapImageCleared: 'Пользовательская карта убрана', invalidCalibration: 'Заполните корректные точки калибровки', calibrationRequiredBeforeWork: 'Сначала выполните калибровку карты. Пока калибровка не завершена, расчёты и рабочие инструменты заблокированы.', lastCalibrationLabel: 'Последняя калибровка', lastCalibrationMissing: 'Последняя калибровка отсутствует',
    markerToolLabel: 'Тип метки', markerToolGun: 'Активное орудие', markerToolTarget: 'Цель', markerToolObserver: 'Наблюдатель', markerToolRuler: 'Линейка', markerToolCoords: 'Снятие координат', markerPlaced: 'Метка добавлена', markerTargetLabel: 'Активная цель метки', markerEditorTitle: 'Параметры метки', markerNameLabel: 'Название', markerAzimuthLabel: 'Азимут', markerEditorSaved: 'Параметры метки обновлены', markerDeleted: 'Метка удалена',
    rulerPointSet: 'Точка линейки установлена', rulerMeasurement: 'Линейка', rulerCleared: 'Линейка удалена', coordsCaptured: 'Координаты точки',
    calibrationMode: 'Режим калибровки', calibrationModeToggle: 'Калибровка: выкл', calibrationModeToggleActive: 'Калибровка: вкл', calibrationScaleLabel: 'Масштаб P1-P2 (м)', calibrationKnownP0X: 'Известные координаты P0 X', calibrationKnownP0Y: 'Известные координаты P0 Y', calibrationPointSet: 'Калибровочная точка установлена', calibrationNeedThreePoints: 'Поставьте P0, P1 и P2', applyManualMarkers: 'Применить ручные метки', mapSettingsTitle: 'Настройки карты', mapSettingsHint: 'Настройки карты скрыты и не мешают работе с метками.', markerLocked: 'Постоянную метку нельзя перемещать или менять', clearManualMarkers: 'Очистить ручные метки', profilesTitle: 'Профили орудий и боеприпасов', profilesHint: 'Настройка сектора огня, зон минимальной/максимальной дальности и привязок к снарядам/таблицам.', profileTraverseDeg: 'Сектор наведения (°)', profileMinRange: 'Минимальная дальность (м)', profileMaxRange: 'Максимальная дальность (м)', profileProjectiles: 'Привязанные снаряды', profileTables: 'Баллистические таблицы', mapRotationHint: 'Левая кнопка мыши по орудию: задать азимут', mapWarningPrefix: 'Предупреждение'
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
    batteryHeight: 'Height (m)', gunsPerBattery: 'Guns count', batteryName: 'Name', coordinatesTitle: 'Coordinates and observers', gunsHint: 'Set map coordinates for each gun.',
    observerTitle: 'Observers and bindings', observerCount: 'Observers count (up to 5)', observerBinding: 'Observer binding', observerMode: 'Mode',
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
    dataCleared: 'Local data has been cleared', clearBrowserCache: 'Clear this page browser cache', browserCacheCleared: 'Browser cache for this page has been cleared', battery: 'Battery', batteryShort: 'B', gun: 'Gun', gunShort: 'G', observer: 'Observer', observerShort: 'O', x: 'X', y: 'Y',
    observerHeight: 'Height (m)', observerName: 'Observer name',
    allGuns: 'All guns in battery', gunProfile: 'Gun profile', projectileProfile: 'Projectile profile', gunDirectionAzimuth: 'Central azimuth (°)',
    calcDone: 'Calculation complete', mtoHeader: 'MTO: ammo usage for selected guns', missionSaved: 'Mission saved', noMissions: 'No saved missions',
    logsError: 'Failed to load logs', exportReady: 'Data export ready', noLogsYet: 'No logs found yet',
    target: 'Target', openedExternalMap: 'Opened external map',
    invalidCoordinates: 'Coordinate error: only digits and allowed limits are accepted',
    mapToolsTitle: 'Marker tools', mapImageUpload: 'Upload your map (PNG/JPG)', pasteMapImage: 'Paste map from clipboard', applyMapImage: 'Apply map image', clearMapImage: 'Clear map image', mapImageTooLarge: 'Map image is larger than 150 MB. Reduce file size and try again.', mapImageUploadFailed: 'Failed to upload map image to server.', mapImageClipboardUnsupported: 'Clipboard image read is not available in this browser or without HTTPS/localhost.', mapImageClipboardEmpty: 'No image found in clipboard.',
    calibrationHint: 'Calibration: enable mode, double-click to place P0/P1/P2 cyclically, then enter only P0 coordinates and P1-P2 distance in meters.', applyCalibration: 'Apply calibration', resetCalibration: 'Reset calibration', calibrationApplied: 'Calibration updated', calibrationResetDone: 'Calibration reset', mapImageApplied: 'Custom map image applied', mapImageCleared: 'Custom map image cleared', invalidCalibration: 'Fill valid calibration points', calibrationRequiredBeforeWork: 'Complete map calibration first. Calculations and map tools are locked until calibration is applied.', lastCalibrationLabel: 'Last calibration', lastCalibrationMissing: 'No saved calibration yet',
    markerToolLabel: 'Marker type', markerToolGun: 'Active gun', markerToolTarget: 'Target', markerToolObserver: 'Observer', markerToolRuler: 'Ruler', markerToolCoords: 'Coordinate pick', markerPlaced: 'Marker added', markerTargetLabel: 'Active marker target', markerEditorTitle: 'Marker parameters', markerNameLabel: 'Name', markerAzimuthLabel: 'Azimuth', markerEditorSaved: 'Marker parameters updated', markerDeleted: 'Marker deleted',
    rulerPointSet: 'Ruler point set', rulerMeasurement: 'Ruler', rulerCleared: 'Ruler removed', coordsCaptured: 'Picked coordinates',
    calibrationMode: 'Calibration mode', calibrationModeToggle: 'Calibration: off', calibrationModeToggleActive: 'Calibration: on', calibrationScaleLabel: 'P1-P2 scale (m)', calibrationKnownP0X: 'Known P0 X', calibrationKnownP0Y: 'Known P0 Y', calibrationPointSet: 'Calibration point set', calibrationNeedThreePoints: 'Set P0, P1 and P2', applyManualMarkers: 'Apply manual markers', mapSettingsTitle: 'Map settings', mapSettingsHint: 'Map settings are collapsible so they do not interfere with marker work.', markerLocked: 'Permanent marker cannot be moved or edited', clearManualMarkers: 'Clear manual markers', profilesTitle: 'Gun and ammo profiles', profilesHint: 'Configure fire sector, min/max range zones, and projectile/table bindings.', profileTraverseDeg: 'Traverse sector (°)', profileMinRange: 'Min range (m)', profileMaxRange: 'Max range (m)', profileProjectiles: 'Linked projectiles', profileTables: 'Ballistic tables', mapRotationHint: 'Left mouse on gun: point gun azimuth', mapWarningPrefix: 'Warning' 
  },
};

const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = Array.from(document.querySelectorAll('.tab-panel'));
const healthBtn = document.querySelector('#health-check');
const clearDataBtn = document.querySelector('#clear-data');
const openLogsBtn = document.querySelector('#open-logs');
const exportDataBtn = document.querySelector('#export-data');
const clearBrowserCacheBtn = document.querySelector('#clear-browser-cache');
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
const pasteMapImageButton = document.querySelector('#paste-map-image');
const markerToolSelect = document.querySelector('#marker-tool');
const markerTargetSelect = document.querySelector('#marker-target');
const calibrationModeButton = document.querySelector('#toggle-calibration-mode');
const calibrationControls = document.querySelector('#calibration-controls');
const calibrationLastInfo = document.querySelector('#calibration-last-info');
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
    heading: Number.isFinite(heading) ? normalizeAzimuth(heading) : null,
  };
}


function getMapToolsSettings() {
  const defaults = {
    calibration: { scale: 1, originMapX: 0, originMapY: 0, originWorldX: 0, originWorldY: 0 },
    imageUrl: '',
    manualMarkers: [],
    ruler: { p1: null, p2: null },
    calibrationPoints: [],
    calibrationMode: false,
    nextCalibrationPointIndex: 0,
    calibrationScaleMeters: '',
    activeFirePattern: null,
  };
  return { ...defaults, ...state.settings.mapTools, calibration: { ...defaults.calibration, ...(state.settings.mapTools?.calibration ?? {}) } };
}

function hasCalibrationConfigured(tools = getMapToolsSettings()) {
  const calibration = tools.calibration ?? {};
  const hasLastCalibration = Boolean(tools.lastCalibration?.appliedAt);
  if (hasLastCalibration) return true;
  const hasNonDefaultCalibration = Number(calibration.scale) > 0
    && (Number(calibration.originMapX) !== 0
      || Number(calibration.originMapY) !== 0
      || Number(calibration.originWorldX) !== 0
      || Number(calibration.originWorldY) !== 0
      || Number(tools.calibrationScaleMeters) > 0);
  return hasNonDefaultCalibration;
}

function formatCalibrationTimestamp(rawDate) {
  if (!rawDate) return '';
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString(state.lang === 'ru' ? 'ru-RU' : 'en-US');
}

function ensureCalibrationOrWarn(outputElement = fireOutput) {
  const tools = getMapToolsSettings();
  if (hasCalibrationConfigured(tools)) return true;
  const warning = t('calibrationRequiredBeforeWork');
  if (outputElement) outputElement.textContent = warning;
  if (mapToolsOutput) mapToolsOutput.textContent = warning;
  if (!tools.calibrationMode) setCalibrationMode(true);
  switchTab('map');
  return false;
}

function updateCalibrationSummary() {
  if (!calibrationLastInfo) return;
  const tools = getMapToolsSettings();
  const timestamp = formatCalibrationTimestamp(tools.lastCalibration?.appliedAt);
  calibrationLastInfo.textContent = timestamp
    ? `${t('lastCalibrationLabel')}: ${timestamp}`
    : t('lastCalibrationMissing');
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
let selectedMapMarker = null;
let manualMarkerDragState = null;
let gunHeadingDragState = null;
let pendingGunHeading = null;
let rightMousePanState = null;
let lastOverlayBoundsKey = '';
let lastCtrlPressAt = 0;
let mapImageSize = null;

const InvertedYCRS = window.L
  ? window.L.Util.extend({}, window.L.CRS.Simple, {
    transformation: new window.L.Transformation(1, 0, 1, 0),
  })
  : null;

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

function parseDecimalInput(rawValue) {
  const normalized = String(rawValue ?? '').trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
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

function applyMarkerCoordinatesToBoundInputs(marker, point) {
  if (!marker || !point) return;
  const xValue = String(Math.round(Number(point.x)));
  const yValue = String(Math.round(Number(point.y)));

  if (marker.type === 'gun' && marker.targetId) {
    const gunXInput = document.querySelector(`[data-gun-x="${marker.targetId}"]`);
    const gunYInput = document.querySelector(`[data-gun-y="${marker.targetId}"]`);
    if (gunXInput) gunXInput.value = xValue;
    if (gunYInput) gunYInput.value = yValue;
    return;
  }

  if (marker.type === 'observer' && marker.targetId) {
    const observerXInput = document.querySelector(`[data-observer-x="${marker.targetId}"]`);
    const observerYInput = document.querySelector(`[data-observer-y="${marker.targetId}"]`);
    if (observerXInput) observerXInput.value = xValue;
    if (observerYInput) observerYInput.value = yValue;
    return;
  }

  if (marker.type === 'target') {
    const targetXInput = document.querySelector('#target-x');
    const targetYInput = document.querySelector('#target-y');
    if (targetXInput) targetXInput.value = xValue;
    if (targetYInput) targetYInput.value = yValue;
  }
}

function clearMarkerCoordinatesAndAzimuth(marker) {
  if (!marker) return;

  if (marker.type === 'gun' && marker.targetId) {
    const gunXInput = document.querySelector(`[data-gun-x="${marker.targetId}"]`);
    const gunYInput = document.querySelector(`[data-gun-y="${marker.targetId}"]`);
    const gunHeadingInput = document.querySelector(`[data-gun-heading="${marker.targetId}"]`);
    if (gunXInput) gunXInput.value = '';
    if (gunYInput) gunYInput.value = '';
    if (gunHeadingInput) gunHeadingInput.value = '';
    state.settings.gunSettings = {
      ...(state.settings.gunSettings ?? {}),
      [marker.targetId]: { ...getGunSetting(marker.targetId), heading: null },
    };
    return;
  }

  if (marker.type === 'observer' && marker.targetId) {
    const observerXInput = document.querySelector(`[data-observer-x="${marker.targetId}"]`);
    const observerYInput = document.querySelector(`[data-observer-y="${marker.targetId}"]`);
    if (observerXInput) observerXInput.value = '';
    if (observerYInput) observerYInput.value = '';
    return;
  }

  if (marker.type === 'target') {
    const targetXInput = document.querySelector('#target-x');
    const targetYInput = document.querySelector('#target-y');
    if (targetXInput) targetXInput.value = '';
    if (targetYInput) targetYInput.value = '';
  }
}

function isSelectedMarker(type, id) {
  return selectedMapMarker?.type === type && selectedMapMarker?.id === id;
}

function selectMapMarker(marker) {
  if (!marker) return;
  selectedMapMarker = { type: marker.type, id: marker.id };
  writeMarkerInfo(marker);
  refreshMapOverlay();
}

function syncManualMarkersFromBoundInputs(markers) {
  return (markers ?? []).map((marker) => {
    if (marker.type === 'gun' && marker.targetId) {
      const point = readXYFromInputs(
        document.querySelector(`[data-gun-x="${marker.targetId}"]`),
        document.querySelector(`[data-gun-y="${marker.targetId}"]`),
      );
      return point ? { ...marker, x: point.x, y: point.y } : marker;
    }
    if (marker.type === 'observer' && marker.targetId) {
      const point = readXYFromInputs(
        document.querySelector(`[data-observer-x="${marker.targetId}"]`),
        document.querySelector(`[data-observer-y="${marker.targetId}"]`),
      );
      return point ? { ...marker, x: point.x, y: point.y } : marker;
    }
    if (marker.type === 'target') {
      const point = readXYFromInputs(document.querySelector('#target-x'), document.querySelector('#target-y'));
      return point ? { ...marker, x: point.x, y: point.y } : marker;
    }
    return marker;
  });
}

function syncMapMarkersWithAvailableTargets() {
  const tools = getMapToolsSettings();
  const validGunTargets = new Set(getActiveMarkerTargets('gun').map((entry) => entry.id));
  const validTargetTargets = new Set(getActiveMarkerTargets('target').map((entry) => entry.id));
  const validObserverTargets = new Set(getActiveMarkerTargets('observer').map((entry) => entry.id));
  const source = tools.manualMarkers ?? [];
  const filtered = source.filter((marker) => {
    if (marker.type === 'gun') return validGunTargets.has(marker.targetId);
    if (marker.type === 'target') return validTargetTargets.has(marker.targetId || 'mission-target');
    if (marker.type === 'observer') return validObserverTargets.has(marker.targetId);
    if (marker.type === 'battery') return false;
    return true;
  });

  if (filtered.length === source.length) return;
  const removed = source.filter((marker) => !filtered.some((entry) => entry.id === marker.id));
  if (selectedMapMarker?.type === 'manual' && !filtered.some((marker) => marker.id === selectedMapMarker.id)) selectedMapMarker = null;
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
  document.querySelectorAll('[data-gun-heading]').forEach((headingInput) => {
    const key = headingInput.dataset.gunHeading;
    const prev = state.settings.gunSettings[key] ?? {};
    const headingNumber = parseDecimalInput(headingInput?.value);
    state.settings.gunSettings[key] = {
      ...prev,
      heading: headingInput && headingInput.value !== '' && Number.isFinite(headingNumber)
        ? normalizeAzimuth(headingNumber)
        : null,
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

  const mapToolsSettings = getMapToolsSettings();
  state.settings.mapTools = {
    ...mapToolsSettings,
    manualMarkers: mapToolsSettings.manualMarkers ?? [],
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
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  } catch (error) {
    const tools = getMapToolsSettings();
    if (!tools.imageUrl) throw error;
    state.settings.mapTools = { ...tools, imageUrl: '' };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    if (mapImageUploadInput) mapImageUploadInput.value = '';
    if (mapToolsOutput) mapToolsOutput.textContent = t('mapImageTooLarge');
  }
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
  enhanceTabTiles();
  alert(t('dataCleared'));
}

async function clearBrowserPageCache() {
  try {
    if ('caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } finally {
    localStorage.removeItem('calc.mapUrl');
    state.mapUrl = '';
    alert(t('browserCacheCleared'));
    window.location.reload();
  }
}

function renderGlobalConfig() {
  const container = document.querySelector('#battery-config');
  if (!container) return;
  const batteries = Number(batteryCountInput?.value || 1);
  container.innerHTML = '';
  for (let b = 1; b <= batteries; b += 1) {
    const row = document.createElement('div');
    row.className = 'battery-config-row';
    row.style.setProperty('--battery-color', getBatteryColor(b));
    const gunProfileOptions = gunProfiles.map((profile) => `<option value="${profile}">${profile}</option>`).join('');
    const saved = state.settings.batteryConfig[String(b)] ?? {};
    row.innerHTML = `
      <h3>${getBatteryDisplayName(b)}</h3>
      <div class="pair pair-5">
        <div class="field"><input data-battery-title="${b}" placeholder="${t('batteryName')}" value="${saved.title ?? `${t('battery')} ${b}`}" /><label>${t('batteryName')}</label></div>
        <div class="field"><input type="text" inputmode="numeric" data-height data-battery-height="${b}" placeholder="${t('batteryHeight')}" value="${saved.height ?? 0}" /><label>${t('batteryHeight')}</label></div>
        <div class="field"><input type="number" min="1" max="5" data-battery-guns-count="${b}" placeholder="${t('gunsPerBattery')}" value="${getGunCountForBattery(b)}" /><label>${t('gunsPerBattery')}</label></div>
        <div class="field"><select data-battery-gun-profile="${b}">${gunProfileOptions}</select><label>${t('gunProfile')}</label></div>
      </div>`;
    container.append(row);
    row.querySelector(`[data-battery-gun-profile="${b}"]`).value = saved.gunProfile ?? gunProfiles[0];
  }
}

function renderGunsGrid() {
  const container = document.querySelector('#guns-coordinates');
  if (!container) return;
  const batteries = Number(batteryCountInput?.value || 1);
  container.innerHTML = '';
  for (let b = 1; b <= batteries; b += 1) {
    const batteryGroup = document.createElement('div');
    batteryGroup.className = 'battery-guns-group';
    batteryGroup.style.setProperty('--battery-color', getBatteryColor(b));

    const batteryTitle = document.createElement('h3');
    batteryTitle.className = 'battery-group-title';
    batteryTitle.textContent = getBatteryDisplayName(b);
    batteryGroup.append(batteryTitle);

    const gunsPerBattery = getGunCountForBattery(b);
    for (let g = 1; g <= gunsPerBattery; g += 1) {
      const key = `${b}-${g}`;
      const gunObserverSuffix = getObserverSuffixForGun(key);
      const saved = state.settings.gunCoords[key] ?? {};
      const gunState = getGunSetting(key);
      const row = document.createElement('div');
      const gunIndexLabel = document.createElement('div');
      gunIndexLabel.className = 'gun-index-label';
      gunIndexLabel.textContent = `${t('batteryShort')}${b}-${t('gunShort')}${g}${gunObserverSuffix}`;
      batteryGroup.append(gunIndexLabel);
      row.className = 'gun-row pair pair-3';
      const headingValue = Number.isFinite(gunState.heading) ? normalizeAzimuth(gunState.heading).toFixed(1) : '';
      row.innerHTML = `<div class="field"><input data-gun-x="${key}" type="text" inputmode="numeric" data-coordinate placeholder="${t('x')}" value="${saved.x ?? 1000 + b * 100 + g * 10}" /><label>${t('x')}</label></div><div class="field"><input data-gun-y="${key}" type="text" inputmode="numeric" data-coordinate placeholder="${t('y')}" value="${saved.y ?? 1000 + b * 120 + g * 10}" /><label>${t('y')}</label></div><div class="field"><input data-gun-heading="${key}" type="text" inputmode="decimal" placeholder="${t('gunDirectionAzimuth')}" value="${headingValue}" /><label>${t('gunDirectionAzimuth')}</label></div>`;
      batteryGroup.append(row);
    }
    container.append(batteryGroup);
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
    if (gunSelect) gunSelect.classList.remove('hidden');
    if (batterySelect) batterySelect.classList.remove('hidden');
  });
  applyObserverRowAccent(root);
}

function getObserverSuffixForGun(gunKey) {
  const observers = Number(observerCountInput?.value || 1);
  for (let observerId = 1; observerId <= observers; observerId += 1) {
    const mode = document.querySelector(`[data-observer-mode="${observerId}"]`)?.value
      ?? state.settings.observerBindings?.[String(observerId)]?.mode
      ?? 'gun';
    const linkedGun = document.querySelector(`[data-observer-gun="${observerId}"]`)?.value
      ?? state.settings.observerBindings?.[String(observerId)]?.gunId
      ?? '';
    if (mode === 'gun' && linkedGun === `gun-${gunKey}`) {
      return `-${t('observerShort')}${observerId}`;
    }
  }
  return '';
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
    row.innerHTML = `<label data-observer-index="${i}">${getObserverDisplayName(i)}</label><div class="pair pair-4"><div class="field"><input data-observer-name="${i}" placeholder="${t('observerName')}" value="${state.settings.observerNames?.[String(i)] ?? ''}" /><label>${t('observerName')}</label></div><div class="field"><select data-observer-mode="${i}"><option value="gun">${t('bindToGun')}</option><option value="battery">${t('bindToBattery')}</option></select><label>${t('observerMode')}</label></div><div class="field"><select data-observer-gun="${i}" aria-label="${t('bindToGun')}">${gunOptionMarkup}</select><label>${t('bindToGun')}</label></div><div class="field"><select data-observer-battery="${i}" aria-label="${t('bindToBattery')}">${batteryOptions}</select><label>${t('bindToBattery')}</label></div></div><div class="pair pair-3"><div class="field"><input data-observer-x="${i}" type="text" inputmode="numeric" data-coordinate placeholder="${t('x')}" value="${savedCoords.x ?? ''}" /><label>${t('x')}</label></div><div class="field"><input data-observer-y="${i}" type="text" inputmode="numeric" data-coordinate placeholder="${t('y')}" value="${savedCoords.y ?? ''}" /><label>${t('y')}</label></div><div class="field"><input data-observer-height="${i}" type="text" inputmode="numeric" data-height placeholder="${t('observerHeight')}" value="${savedCoords.height ?? 0}" /><label>${t('observerHeight')}</label></div></div>`;
    container.append(row);
    row.querySelector(`[data-observer-mode="${i}"]`).value = saved.mode ?? 'gun';
    row.querySelector(`[data-observer-gun="${i}"]`).value = saved.gunId ?? gunOptions[0];
    row.querySelector(`[data-observer-battery="${i}"]`).value = saved.batteryId ?? 'battery-1';
    syncObserverBindingVisibility(row);
  }
  applyObserverRowAccent(container);
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
  if (!ensureCalibrationOrWarn(fireOutput)) return null;
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
  if (!calc) return;
  const mtoRows = calc.results.map((row) => `${t('gun')} ${row.gunId}: HE x3, Smoke x1`).join('\n');
  fireOutput.textContent = `${fireOutput.textContent}\n\n${t('mtoHeader')}\n${mtoRows}`;
}

function saveMission() {
  const calc = calculateFire();
  if (!calc) return;
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
  const crs = InvertedYCRS
    ?? window.L.Util.extend({}, window.L.CRS.Simple, {
      transformation: new window.L.Transformation(1, 0, 1, 0),
    });
  leafletMap = window.L.map('leaflet-map', {
    zoomControl: true,
    doubleClickZoom: false,
    boxZoom: false,
    zoomSnap: 0.25,
    zoomDelta: 0.25,
    wheelPxPerZoomLevel: 80,
    crs,
    minZoom: -6,
    maxZoom: 6,
  }).setView([0, 0], 0);
  leafletMap.dragging.disable();
  leafletMap.on('dblclick', (event) => {
    window.L.DomEvent.stop(event);
    onMapDoubleClick(event);
  });
  leafletMap.on('click', onMapClick);
  leafletMap.on('mousedown', updateGunHeadingDrag);
  leafletMap.on('mousemove', updateGunHeadingDrag);
  leafletMap.on('mouseup', finishGunHeadingDrag);
  leafletMap.on('mousemove', handleManualMarkerDrag);
  leafletMap.on('mouseup', finishManualMarkerDrag);

  const container = leafletMap.getContainer();
  container.addEventListener('contextmenu', (event) => event.preventDefault());
  container.addEventListener('mousedown', (event) => {
    if (event.button !== 2) return;
    rightMousePanState = { x: event.clientX, y: event.clientY };
  });
  container.addEventListener('mousemove', (event) => {
    updateGunHeadingFromPointer(event);
    if (!rightMousePanState) return;
    const dx = event.clientX - rightMousePanState.x;
    const dy = event.clientY - rightMousePanState.y;
    rightMousePanState = { x: event.clientX, y: event.clientY };
    leafletMap.panBy([-dx, -dy], { animate: false });
  });
  window.addEventListener('mouseup', () => {
    rightMousePanState = null;
    manualMarkerDragState = null;
    finishGunHeadingDrag();
  });

  setTimeout(() => leafletMap.invalidateSize(), 0);
}

function getActiveMarkerTargets(type) {
  if (type === 'ruler' || type === 'coords') return [];
  if (type === 'target') return [{ id: 'mission-target', label: t('target') }];
  if (type === 'observer') {
    const observers = Number(observerCountInput?.value || 1);
    return Array.from({ length: observers }, (_, idx) => {
      const observerId = idx + 1;
      return { id: String(observerId), label: getObserverDisplayName(observerId) };
    });
  }

  const batteries = Number(batteryCountInput?.value || 1);

  const targets = [];
  for (let b = 1; b <= batteries; b += 1) {
    const gunsPerBattery = getGunCountForBattery(b);
    for (let g = 1; g <= gunsPerBattery; g += 1) {
      const key = `${b}-${g}`;
      targets.push({ id: key, label: `${t('batteryShort')}${b}-${t('gunShort')}${g}${getObserverSuffixForGun(key)}` });
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
  const activeProfile = profiles[batteryDefault] ?? profiles[gunProfiles[0]];
  return {
    profileId: batteryDefault,
    profile: activeProfile,
    heading: Number.isFinite(gunSetting.heading)
      ? normalizeAzimuth(gunSetting.heading)
      : 0,
  };
}

function buildSectorPolygonPoints({ x, y, heading, traverseDeg, radius, innerRadius = 0 }) {
  const half = Math.max(0.5, Number(traverseDeg) / 2);
  const segments = 20;
  const points = [];
  for (let idx = 0; idx <= segments; idx += 1) {
    const angle = normalizeAzimuth(heading - half + (idx / segments) * (half * 2));
    const rad = (angle * Math.PI) / 180;
    points.push({ x: x + Math.sin(rad) * radius, y: y + Math.cos(rad) * radius });
  }
  if (innerRadius > 0) {
    for (let idx = segments; idx >= 0; idx -= 1) {
      const angle = normalizeAzimuth(heading - half + (idx / segments) * (half * 2));
      const rad = (angle * Math.PI) / 180;
      points.push({ x: x + Math.sin(rad) * innerRadius, y: y + Math.cos(rad) * innerRadius });
    }
  } else {
    points.push({ x, y });
  }
  return points;
}

function buildSectorGuideLines({ x, y, heading, traverseDeg, minRadius = 0, maxRadius }) {
  const half = Math.max(0.5, Number(traverseDeg) / 2);
  const segments = 36;
  const outerArc = [];
  const innerArc = [];
  for (let idx = 0; idx <= segments; idx += 1) {
    const angle = normalizeAzimuth(heading - half + (idx / segments) * (half * 2));
    const rad = (angle * Math.PI) / 180;
    outerArc.push({ x: x + Math.sin(rad) * maxRadius, y: y + Math.cos(rad) * maxRadius });
    if (minRadius > 0) {
      innerArc.push({ x: x + Math.sin(rad) * minRadius, y: y + Math.cos(rad) * minRadius });
    }
  }

  const startAngle = normalizeAzimuth(heading - half);
  const endAngle = normalizeAzimuth(heading + half);
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const edgeStart = [
    { x: x + Math.sin(startRad) * minRadius, y: y + Math.cos(startRad) * minRadius },
    { x: x + Math.sin(startRad) * maxRadius, y: y + Math.cos(startRad) * maxRadius },
  ];
  const edgeEnd = [
    { x: x + Math.sin(endRad) * minRadius, y: y + Math.cos(endRad) * minRadius },
    { x: x + Math.sin(endRad) * maxRadius, y: y + Math.cos(endRad) * maxRadius },
  ];

  return { outerArc, innerArc, edgeStart, edgeEnd };
}

function buildCircularRingPolygonPoints({ x, y, radius, innerRadius = 0, segments = 64 }) {
  const outerRing = [];
  for (let idx = 0; idx <= segments; idx += 1) {
    const angle = (idx / segments) * 360;
    const rad = (angle * Math.PI) / 180;
    outerRing.push({ x: x + Math.sin(rad) * radius, y: y + Math.cos(rad) * radius });
  }

  if (innerRadius <= 0) {
    return [outerRing];
  }

  const innerRing = [];
  for (let idx = segments; idx >= 0; idx -= 1) {
    const angle = (idx / segments) * 360;
    const rad = (angle * Math.PI) / 180;
    innerRing.push({ x: x + Math.sin(rad) * innerRadius, y: y + Math.cos(rad) * innerRadius });
  }
  return [outerRing, innerRing];
}

function formatRulerMeasurement(p1, p2) {
  const pointA = normalizeRulerPoint(p1);
  const pointB = normalizeRulerPoint(p2);
  if (!pointA || !pointB) return `${t('rulerMeasurement')}: —`;
  const worldA = mapPointToWorldPoint(pointA);
  const worldB = mapPointToWorldPoint(pointB);
  const dx = worldB.x - worldA.x;
  const dy = worldB.y - worldA.y;
  const distance = Math.hypot(dx, dy);
  const azimuthDeg = normalizeAzimuth((Math.atan2(dx, dy) * 180) / Math.PI);
  const azimuthMils = (azimuthDeg * 6400) / 360;
  return `${t('rulerMeasurement')}: D=${distance.toFixed(2)}m Az=${azimuthDeg.toFixed(2)}°/${azimuthMils.toFixed(1)} mil`;
}

function normalizeRulerPoint(point) {
  if (!point) return null;
  const mapX = Number(point.mapX ?? point.x);
  const mapY = Number(point.mapY ?? point.y);
  if (!Number.isFinite(mapX) || !Number.isFinite(mapY)) return null;
  return { mapX, mapY };
}

function mapPointToWorldPoint(point) {
  const mapPoint = normalizeRulerPoint(point);
  if (!mapPoint) return { x: 0, y: 0 };
  const { calibration } = getMapToolsSettings();
  const scale = Number(calibration.scale) || 1;
  return {
    x: (mapPoint.mapX - Number(calibration.originMapX)) * scale + Number(calibration.originWorldX),
    y: (Number(calibration.originMapY) - mapPoint.mapY) * scale + Number(calibration.originWorldY),
  };
}

function updateRulerPoint(pointKey, latlng) {
  const tools = getMapToolsSettings();
  const lat = Number(latlng?.lat);
  const lng = Number(latlng?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const imagePoint = latLngToMapPoint(lat, lng);
  const point = { mapX: imagePoint.x, mapY: imagePoint.y };
  const currentA = normalizeRulerPoint(tools.ruler?.p1);
  const currentB = normalizeRulerPoint(tools.ruler?.p2);
  state.settings.mapTools = {
    ...tools,
    ruler: {
      p1: pointKey === 'p1' ? point : currentA,
      p2: pointKey === 'p2' ? point : currentB,
    },
  };
  persistLauncherSettings();
  refreshMapOverlay();
  const nextA = pointKey === 'p1' ? point : currentA;
  const nextB = pointKey === 'p2' ? point : currentB;
  if (mapToolsOutput) {
    mapToolsOutput.textContent = nextA && nextB
      ? formatRulerMeasurement(nextA, nextB)
      : `${t('rulerPointSet')}: ${pointKey === 'p1' ? 'A' : 'B'} (${point.mapX.toFixed(2)}, ${point.mapY.toFixed(2)})`;
  }
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
  const targetId = markerToolSelect?.value === 'target' ? 'mission-target' : (markerTargetSelect?.value || '');

  const tools = getMapToolsSettings();
  const marker = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    targetId,
    x: Math.round(point.x),
    y: Math.round(point.y),
    mapX: imagePoint.x,
    mapY: imagePoint.y,
    azimuth: null,
    name: '',
  };
  state.settings.mapTools = { ...tools, manualMarkers: [...(tools.manualMarkers ?? []).filter((item) => !(item.type === type && item.targetId === targetId)), marker] };
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = `${t('markerPlaced')}: ${type} (${marker.x}, ${marker.y})`;
}

function updateManualMarker(markerId, updater) {
  if (!markerId || typeof updater !== 'function') return null;
  const tools = getMapToolsSettings();
  let nextMarker = null;
  const updated = (tools.manualMarkers ?? []).map((marker) => {
    if (marker.id !== markerId) return marker;
    nextMarker = updater(marker);
    return nextMarker;
  });
  if (!nextMarker) return null;
  state.settings.mapTools = { ...tools, manualMarkers: updated };
  persistLauncherSettings();
  refreshMapOverlay();
  return nextMarker;
}


function writeMarkerInfo(marker) {
  if (!marker || !mapToolsOutput) return;
  const azimuthText = Number.isFinite(Number(marker.azimuth)) ? `, ${t('markerAzimuthLabel')}: ${normalizeAzimuth(Number(marker.azimuth)).toFixed(1)}°` : '';
  mapToolsOutput.textContent = `${buildManualMarkerDisplayLabel(marker)} · X=${Math.round(Number(marker.x))}, Y=${Math.round(Number(marker.y))}${azimuthText}`;
}

function openManualMarkerEditor(markerId, markerLayer) {
  const currentMarker = (getMapToolsSettings().manualMarkers ?? []).find((marker) => marker.id === markerId);
  if (!currentMarker || !markerLayer) return;
  const markerTitle = buildMarkerLabel(currentMarker.type, currentMarker.targetId);

  const wrapper = document.createElement('div');
  wrapper.className = 'stack';
  wrapper.innerHTML = `
    <strong>${t('markerEditorTitle')}</strong>
    <label>${t('markerNameLabel')}<input data-field="name" type="text" value="${String(currentMarker.name ?? '').replace(/"/g, '&quot;')}" /></label>
    <label>X<input data-field="x" type="number" step="1" value="${Math.round(Number(currentMarker.x))}" /></label>
    <label>Y<input data-field="y" type="number" step="1" value="${Math.round(Number(currentMarker.y))}" /></label>
    <label>${t('markerAzimuthLabel')}<input data-field="azimuth" type="number" min="0" max="359.9" step="0.1" value="${Number.isFinite(Number(currentMarker.azimuth)) ? Number(currentMarker.azimuth).toFixed(1) : ''}" /></label>
    <div class="row">
      <button class="btn" data-action="save" type="button">OK</button>
      <button class="btn ghost" data-action="delete" type="button">Delete</button>
    </div>
    <p class="hint">${markerTitle}</p>
  `;

  const popup = window.L.popup({ closeOnClick: false }).setLatLng(markerLayer.getLatLng()).setContent(wrapper);
  popup.on('remove', () => {
    if (isSelectedMarker('manual', markerId)) refreshMapOverlay();
  });
  markerLayer.bindPopup(popup).openPopup();

  wrapper.querySelector('[data-action="save"]')?.addEventListener('click', () => {
    const nextName = String(wrapper.querySelector('[data-field="name"]')?.value || '').trim();
    const x = Math.round(Number(wrapper.querySelector('[data-field="x"]')?.value));
    const y = Math.round(Number(wrapper.querySelector('[data-field="y"]')?.value));
    const azimuthRaw = String(wrapper.querySelector('[data-field="azimuth"]')?.value || '').trim();
    const azimuth = azimuthRaw ? normalizeAzimuth(Number(azimuthRaw)) : null;
    if ((!Number.isFinite(x) || !Number.isFinite(y)) || (azimuthRaw && !Number.isFinite(azimuth))) return;

    updateManualMarker(markerId, (marker) => {
      const mapPoint = gamePointToImagePoint(x, y);
      return {
        ...marker,
        name: nextName,
        x,
        y,
        mapX: mapPoint.x,
        mapY: mapPoint.y,
        azimuth,
      };
    });
    if (mapToolsOutput) mapToolsOutput.textContent = t('markerEditorSaved');
    markerLayer.closePopup();
  });

  wrapper.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
    const tools = getMapToolsSettings();
    const markerToDelete = (tools.manualMarkers ?? []).find((marker) => marker.id === markerId);
    if (markerToDelete) clearMarkerCoordinatesAndAzimuth(markerToDelete);
    state.settings.mapTools = {
      ...tools,
      manualMarkers: (tools.manualMarkers ?? []).filter((marker) => marker.id !== markerId),
    };
    if (isSelectedMarker('manual', markerId)) selectedMapMarker = null;
    persistLauncherSettings();
    refreshMapOverlay();
    if (mapToolsOutput) mapToolsOutput.textContent = t('markerDeleted');
  });
}

function startManualMarkerDrag(markerId, markerLayer) {
  if (!markerId || !markerLayer) return;
  manualMarkerDragState = { markerId, markerLayer };
}

function setGunHeading({ gunKey, heading }) {
  if (!gunKey || !Number.isFinite(heading)) return;
  const normalizedHeading = normalizeAzimuth(heading);
  state.settings.gunSettings = { ...(state.settings.gunSettings ?? {}), [gunKey]: { ...getGunSetting(gunKey), heading: normalizedHeading } };
  const headingInput = document.querySelector(`[data-gun-heading="${gunKey}"]`);
  if (headingInput) headingInput.value = normalizedHeading.toFixed(1);
  persistLauncherSettings();
  refreshMapOverlay();
}

function startGunHeadingDrag(event, { gunKey, gunX, gunY, batteryId, gunId }) {
  if (event.originalEvent?.button !== 0) return;
  window.L.DomEvent.stop(event);
  gunHeadingDragState = { gunKey, gunX, gunY, batteryId, gunId, heading: null };
  pendingGunHeading = { gunKey, heading: null };
}

function updateGunHeadingDrag(event) {
  if (!gunHeadingDragState || !event?.latlng) return;
  const mapPoint = latLngToMapPoint(event.latlng.lat, event.latlng.lng);
  applyGunHeadingFromMapPoint(mapPoint);
}

function applyGunHeadingFromMapPoint(mapPoint) {
  if (!gunHeadingDragState || !mapPoint) return;
  const mousePoint = imagePointToGamePoint(mapPoint.x, mapPoint.y);
  const azimuthDeg = normalizeAzimuth((Math.atan2(mousePoint.x - gunHeadingDragState.gunX, mousePoint.y - gunHeadingDragState.gunY) * 180) / Math.PI);
  gunHeadingDragState.heading = azimuthDeg;
  pendingGunHeading = { gunKey: gunHeadingDragState.gunKey, heading: azimuthDeg };
  refreshMapOverlay();
  if (mapToolsOutput) {
    mapToolsOutput.textContent = `${t('gunDirectionAzimuth')}: ${azimuthDeg.toFixed(1)}° (${t('batteryShort')}${gunHeadingDragState.batteryId}-${t('gunShort')}${gunHeadingDragState.gunId})`;
  }
}

function finishGunHeadingDrag() {
  if (gunHeadingDragState?.gunKey && Number.isFinite(gunHeadingDragState.heading)) {
    setGunHeading({ gunKey: gunHeadingDragState.gunKey, heading: gunHeadingDragState.heading });
  }
  pendingGunHeading = null;
  gunHeadingDragState = null;
}

function updateGunHeadingFromPointer(event) {
  if (!gunHeadingDragState || !leafletMap || !event) return;
  if (typeof event.buttons === 'number' && (event.buttons & 1) !== 1) return;
  const containerPoint = leafletMap.mouseEventToContainerPoint(event);
  const latlng = leafletMap.containerPointToLatLng(containerPoint);
  const mapPoint = latLngToMapPoint(latlng.lat, latlng.lng);
  applyGunHeadingFromMapPoint(mapPoint);
}

function handleManualMarkerDrag(event) {
  if (!manualMarkerDragState?.markerLayer || !event?.latlng) return;
  manualMarkerDragState.markerLayer.setLatLng(event.latlng);
}

function finishManualMarkerDrag(event) {
  if (!manualMarkerDragState?.markerId || !event?.latlng) return;
  const { markerId } = manualMarkerDragState;
  manualMarkerDragState = null;
  const imagePoint = latLngToMapPoint(event.latlng.lat, event.latlng.lng);
  const point = imagePointToGamePoint(imagePoint.x, imagePoint.y);
  const tools = getMapToolsSettings();
  const updated = (tools.manualMarkers ?? []).map((marker) => (marker.id === markerId
    ? {
      ...marker,
      x: Math.round(point.x),
      y: Math.round(point.y),
      mapX: imagePoint.x,
      mapY: imagePoint.y,
    }
    : marker));
  state.settings.mapTools = { ...tools, manualMarkers: updated };
  persistLauncherSettings();
  refreshMapOverlay();
}

function updateGunHeadingFromMapClick(latlng) {
  const targetKey = markerTargetSelect?.value || '';
  if (!targetKey || !targetKey.includes('-')) return false;
  const [batteryRaw, gunRaw] = targetKey.split('-');
  const batteryId = Number(batteryRaw);
  const gunId = Number(gunRaw);
  if (!Number.isFinite(batteryId) || !Number.isFinite(gunId)) return false;

  const gunPoint = readXYFromInputs(
    document.querySelector(`[data-gun-x="${targetKey}"]`),
    document.querySelector(`[data-gun-y="${targetKey}"]`),
  );
  if (!gunPoint) return false;

  const mapPoint = latLngToMapPoint(latlng.lat, latlng.lng);
  const clickedPoint = imagePointToGamePoint(mapPoint.x, mapPoint.y);
  const azimuthDeg = normalizeAzimuth((Math.atan2(clickedPoint.x - gunPoint.x, clickedPoint.y - gunPoint.y) * 180) / Math.PI);
  const gunKey = `${batteryId}-${gunId}`;
  setGunHeading({ gunKey, heading: azimuthDeg });
  if (mapToolsOutput) mapToolsOutput.textContent = `${t('gunDirectionAzimuth')}: ${azimuthDeg.toFixed(1)}° (${t('batteryShort')}${batteryId}-${t('gunShort')}${gunId})`;
  return true;
}

function onMapClick(event) {
  if (gunHeadingDragState) {
    window.L.DomEvent.stop(event);
    return;
  }

  if (selectedMapMarker) {
    selectedMapMarker = null;
    refreshMapOverlay();
  }
}

function onMapDoubleClick(event) {
  event.originalEvent?.preventDefault?.();
  event.originalEvent?.stopPropagation?.();
  const tools = getMapToolsSettings();
  const imagePoint = latLngToMapPoint(event.latlng.lat, event.latlng.lng);
  logMapClickDiagnostics(event.latlng, imagePoint);
  if (!tools.calibrationMode) {
    if (!hasCalibrationConfigured(tools)) {
      if (mapToolsOutput) mapToolsOutput.textContent = t('calibrationRequiredBeforeWork');
      return;
    }
    const toolType = markerToolSelect?.value || 'gun';
    if (toolType === 'coords') {
      const gamePoint = imagePointToGamePoint(imagePoint.x, imagePoint.y);
      if (mapToolsOutput) mapToolsOutput.textContent = `${t('coordsCaptured')}: X=${gamePoint.x.toFixed(2)}, Y=${gamePoint.y.toFixed(2)}`;
      return;
    }
    if (toolType === 'ruler') {
      const point = { mapX: imagePoint.x, mapY: imagePoint.y };
      const pointA = normalizeRulerPoint(tools.ruler?.p1);
      const nextRuler = pointA
        ? { p1: pointA, p2: point }
        : { p1: point, p2: null };
      state.settings.mapTools = { ...tools, ruler: nextRuler };
      persistLauncherSettings();
      refreshMapOverlay();
      if (mapToolsOutput) {
        mapToolsOutput.textContent = nextRuler.p1 && nextRuler.p2
          ? formatRulerMeasurement(nextRuler.p1, nextRuler.p2)
          : `${t('rulerPointSet')}: A (${point.mapX.toFixed(2)}, ${point.mapY.toFixed(2)})`;
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
  const { calibration, calibrationMode, calibrationScaleMeters } = getMapToolsSettings();
  const fill = (id, val) => { const el = document.querySelector(id); if (el) el.value = String(val ?? ''); };
  fill('#cal-p0-x', calibration.originWorldX);
  fill('#cal-p0-y', calibration.originWorldY);
  fill('#cal-scale-meters', calibrationScaleMeters);
  if (calibrationControls) calibrationControls.classList.toggle('hidden', !calibrationMode);
  if (calibrationModeButton) calibrationModeButton.textContent = calibrationMode ? t('calibrationModeToggleActive') : t('calibrationModeToggle');
  updateCalibrationSummary();
}

function upsertMapOverlay() {
  if (!leafletMap) return;
  const tools = getMapToolsSettings();
  const imageSource = String(tools.imageUrl || '');
  const overlayKey = imageSource.startsWith('data:')
    ? `${imageSource.length}:${imageSource.slice(0, 64)}`
    : imageSource;

  if (!imageSource) {
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
    mapImageOverlay = window.L.imageOverlay(imageSource, bounds, { opacity: 0.85 }).addTo(leafletMap);

    state.settings.mapTools = { ...tools };
    persistLauncherSettings();
    hydrateMapToolsForm();
    leafletMap.fitBounds(bounds);
    leafletMap.setMaxBounds(bounds);
    lastOverlayBoundsKey = overlayKey;
  };
  image.src = imageSource;
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
  const appliedAt = new Date().toISOString();
  state.settings.mapTools = {
    ...tools,
    calibrationMode: false,
    calibrationScaleMeters: scaleMeters,
    calibration: {
      scale,
      originMapX: p0.mapX,
      originMapY: p0.mapY,
      originWorldX: p0x,
      originWorldY: p0y,
    },
    lastCalibration: {
      appliedAt,
      calibrationScaleMeters: scaleMeters,
      originWorldX: p0x,
      originWorldY: p0y,
    },
  };
  setCalibrationMode(false);
  updateCalibrationSummary();
  if (mapToolsOutput) mapToolsOutput.textContent = `${t('calibrationApplied')} (${formatCalibrationTimestamp(appliedAt)})`;
}

function resetCalibration() {
  state.settings.mapTools = {
    ...getMapToolsSettings(),
    calibration: { scale: 1, originMapX: 0, originMapY: 0, originWorldX: 0, originWorldY: 0 },
    calibrationPoints: [],
    nextCalibrationPointIndex: 0,
    calibrationScaleMeters: '',
    activeFirePattern: null,
    lastCalibration: null,
  };
  persistLauncherSettings();
  refreshMapOverlay();
  updateCalibrationSummary();
  if (mapToolsOutput) mapToolsOutput.textContent = t('calibrationResetDone');
}

async function optimizeMapImageFile(file) {
  if (!(file instanceof File)) return file;
  if (!window.createImageBitmap) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const longestSide = Math.max(bitmap.width, bitmap.height);
    const scale = longestSide > MAP_IMAGE_UPLOAD_MAX_DIMENSION ? MAP_IMAGE_UPLOAD_MAX_DIMENSION / longestSide : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise((resolve) => {
      canvas.toBlob((encoded) => resolve(encoded), 'image/webp', 0.82);
    });
    if (!blob) return file;
    if (blob.size >= file.size && scale === 1) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'map-image'}.webp`, { type: 'image/webp' });
  } catch {
    return file;
  }
}

async function uploadMapImageFile(file) {
  if (!(file instanceof File)) return false;
  const optimizedFile = await optimizeMapImageFile(file);
  if (optimizedFile.size > MAP_IMAGE_UPLOAD_MAX_BYTES) {
    if (mapToolsOutput) mapToolsOutput.textContent = t('mapImageTooLarge');
    return false;
  }

  try {
    const response = await fetch('/api/map-image', {
      method: 'POST',
      headers: {
        'Content-Type': optimizedFile.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(optimizedFile.name || 'map-image'),
      },
      body: optimizedFile,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.url) {
      if (response.status === 413 && mapToolsOutput) {
        mapToolsOutput.textContent = t('mapImageTooLarge');
      } else if (mapToolsOutput) {
        mapToolsOutput.textContent = payload?.error || t('mapImageUploadFailed');
      }
      return false;
    }

    state.settings.mapTools = {
      ...getMapToolsSettings(),
      imageUrl: String(payload.url),
    };
    persistLauncherSettings();
    refreshMapOverlay();
    if (mapToolsOutput) mapToolsOutput.textContent = t('mapImageApplied');
    return true;
  } catch {
    if (mapToolsOutput) mapToolsOutput.textContent = t('mapImageUploadFailed');
    return false;
  }
}

async function pasteMapImageFromClipboard() {
  if (!navigator.clipboard?.read) {
    if (mapToolsOutput) mapToolsOutput.textContent = t('mapImageClipboardUnsupported');
    return;
  }

  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const imageType = item.types.find((type) => type.startsWith('image/'));
      if (!imageType) continue;
      const blob = await item.getType(imageType);
      const ext = imageType.split('/')[1] || 'png';
      const file = new File([blob], `clipboard-map.${ext}`, { type: imageType });
      await uploadMapImageFile(file);
      return;
    }
    if (mapToolsOutput) mapToolsOutput.textContent = t('mapImageClipboardEmpty');
  } catch {
    if (mapToolsOutput) mapToolsOutput.textContent = t('mapImageClipboardUnsupported');
  }
}

function clearMapImage() {
  state.settings.mapTools = { ...getMapToolsSettings(), imageUrl: '' };
  if (mapImageUploadInput) mapImageUploadInput.value = '';
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = t('mapImageCleared');
}

async function hydrateMapImageFromServer() {
  const tools = getMapToolsSettings();
  if (tools.imageUrl) return;
  try {
    const response = await fetch('/api/map-image/latest');
    if (!response.ok) return;
    const payload = await response.json().catch(() => ({}));
    if (!payload?.url) return;
    state.settings.mapTools = { ...tools, imageUrl: String(payload.url) };
    persistLauncherSettings();
    refreshMapOverlay();
  } catch {}
}


function applyManualMarkers() {
  const tools = getMapToolsSettings();
  const markers = tools.manualMarkers ?? [];
  if (!markers.length) {
    if (mapToolsOutput) mapToolsOutput.textContent = t('applyManualMarkers');
    return;
  }

  markers.forEach((item) => {
    applyMarkerCoordinatesToBoundInputs(item, { x: Number(item.x), y: Number(item.y) });
    if (item.type === 'gun' && item.targetId && Number.isFinite(Number(item.azimuth))) {
      setGunHeading({ gunKey: item.targetId, heading: Number(item.azimuth) });
    }
  });

  state.settings.mapTools = {
    ...tools,
    manualMarkers: [],
  };
  persistLauncherSettings();
  refreshMapOverlay();
  if (mapToolsOutput) mapToolsOutput.textContent = t('applyManualMarkers');
}

function clearManualMarkers() {
  selectedMapMarker = null;
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
  const imageHeight = Number(mapImageSize?.naturalHeight);
  const yMapFlipped = Number.isFinite(imageHeight) ? imageHeight - Number(y) : Number(y);
  const yOriginFlipped = Number.isFinite(imageHeight)
    ? imageHeight - Number(calibration.originMapY)
    : Number(calibration.originMapY);
  return {
    x: (Number(x) - Number(calibration.originMapX)) * Number(calibration.scale) + Number(calibration.originWorldX),
    y: (yMapFlipped - yOriginFlipped) * Number(calibration.scale) + Number(calibration.originWorldY),
  };
}

function gamePointToImagePoint(x, y) {
  const { calibration } = getMapToolsSettings();
  const scale = Number(calibration.scale) || 1;
  const imageHeight = Number(mapImageSize?.naturalHeight);
  const yOriginFlipped = Number.isFinite(imageHeight)
    ? imageHeight - Number(calibration.originMapY)
    : Number(calibration.originMapY);
  const yFlipped = (Number(y) - Number(calibration.originWorldY)) / scale + yOriginFlipped;
  return {
    x: (Number(x) - Number(calibration.originWorldX)) / scale + Number(calibration.originMapX),
    y: Number.isFinite(imageHeight) ? imageHeight - yFlipped : yFlipped,
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

function getBatteryColor(batteryId) {
  const palette = ['#00ff57', '#00d4ff', '#ff7a1a', '#ff4df0', '#ffd84d'];
  const idx = Math.max(0, Number(batteryId) - 1) % palette.length;
  return palette[idx];
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

function refreshLiveNameBindings() {
  document.querySelectorAll('#battery-config .battery-config-row').forEach((row, index) => {
    const title = row.querySelector('h3');
    if (title) title.textContent = getBatteryDisplayName(index + 1);
  });
  document.querySelectorAll('#guns-coordinates .battery-group-title').forEach((title, index) => {
    title.textContent = getBatteryDisplayName(index + 1);
  });
  document.querySelectorAll('[data-observer-index]').forEach((label) => {
    const observerId = Number(label.dataset.observerIndex || 0);
    if (observerId > 0) label.textContent = getObserverDisplayName(observerId);
  });
}

function getObserverBindingState(observerId, root = document) {
  const mode = root.querySelector(`[data-observer-mode="${observerId}"]`)?.value ?? 'gun';
  const gunLink = root.querySelector(`[data-observer-gun="${observerId}"]`)?.value ?? '';
  const batteryLink = root.querySelector(`[data-observer-battery="${observerId}"]`)?.value ?? '';
  return { mode, gunLink, batteryLink };
}

function getObserverBoundBatteryId(observerId, root = document) {
  const { mode, gunLink, batteryLink } = getObserverBindingState(observerId, root);
  if (mode === 'battery') {
    const parsed = Number(String(batteryLink).replace('battery-', ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (mode === 'gun') {
    const [, batteryId] = String(gunLink).split('-');
    const parsed = Number(batteryId);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function applyObserverRowAccent(root = document) {
  root.querySelectorAll('.observer-row').forEach((row) => {
    const modeSelect = row.querySelector('[data-observer-mode]');
    if (!modeSelect) return;
    const observerId = modeSelect.dataset.observerMode;
    const batteryId = getObserverBoundBatteryId(observerId, row);
    if (!batteryId) {
      row.style.removeProperty('--battery-color');
      return;
    }
    row.style.setProperty('--battery-color', getBatteryColor(batteryId));
  });
}

function getMarkerTypeName(type) {
  if (type === 'gun') return t('gun');
  if (type === 'observer') return t('observer');
  if (type === 'target') return t('target');
  if (type === 'ruler') return t('markerToolRuler');
  if (type === 'coords') return t('markerToolCoords');
  return type;
}

function buildMarkerLabel(type, markerId) {
  if (type === 'gun' && markerId?.includes('-')) {
    const [batteryId, gunId] = markerId.split('-');
    return `${t('batteryShort')}${batteryId}-${t('gunShort')}${gunId}${getObserverSuffixForGun(`${batteryId}-${gunId}`)}`;
  }
  if (type === 'observer' && markerId) return getObserverDisplayName(markerId);
  return getMarkerTypeName(type);
}

function buildManualMarkerDisplayLabel(marker) {
  const markerName = String(marker?.name ?? '').trim();
  const baseLabel = buildMarkerLabel(marker?.type, marker?.targetId);
  return markerName || baseLabel;
}

function addPersistentLabel(marker, labelText, options = {}) {
  const { direction = 'top', offset = [0, -10] } = options;
  marker.bindTooltip(labelText, {
    permanent: true,
    direction,
    offset,
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

  const legendRows = [`<p>${t('mapRotationHint')}</p>`];
  const markerStyle = {
    observer: '#00d4ff',
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
    const renderedHeading = pendingGunHeading?.gunKey === gunKey && Number.isFinite(pendingGunHeading?.heading)
      ? pendingGunHeading.heading
      : heading;
    const traverseDeg = clamp(Number(profile?.traverseDeg) || 360, 1, 360);
    const minRange = Math.max(0, Number(profile?.minRange) || 0);
    const maxRange = Math.max(minRange, Number(profile?.maxRange) || 0);
    const gunColor = getBatteryColor(batteryId);

    const impactZoneStroke = '#ff3b30';
    const impactZoneFill = '#ff3b30';
    const impactZoneStyle = {
      color: impactZoneStroke,
      weight: 1.5,
      fillColor: impactZoneFill,
      fillOpacity: 0.1,
      dashArray: '8 8',
      interactive: false,
    };
    if (maxRange > 0) {
      if (traverseDeg >= 360) {
        const fullTraverseRing = window.L.polygon(
          buildCircularRingPolygonPoints({
            x: gunX,
            y: gunY,
            radius: maxRange,
            innerRadius: minRange,
          }).map((ring) => ring.map((point) => gamePointToLatLng(point.x, point.y))),
          {
            ...impactZoneStyle,
            fillRule: 'evenodd',
          },
        ).addTo(leafletMap);
        gunMarkers.push(fullTraverseRing);
      } else {
        const sectorPolygon = buildSectorPolygonPoints({
          x: gunX,
          y: gunY,
          heading: renderedHeading,
          traverseDeg,
          radius: maxRange,
          innerRadius: minRange,
        }).map((point) => gamePointToLatLng(point.x, point.y));
        const fillSector = window.L.polygon(sectorPolygon, impactZoneStyle).addTo(leafletMap);
        gunMarkers.push(fillSector);
      }
    }

    const isGunSelected = isSelectedMarker('gun', gunKey);
    const marker = window.L.circleMarker(gamePointToLatLng(gunX, gunY), {
      radius: isGunSelected ? 10 : 8,
      color: isGunSelected ? '#ff3b30' : gunColor,
      fillColor: isGunSelected ? '#ff3b30' : gunColor,
      fillOpacity: 0.9,
      weight: isGunSelected ? 4 : 2,
    }).addTo(leafletMap);
    let headingLine = null;
    if (renderedHeading < 360) {
      const headingRad = (normalizeAzimuth(renderedHeading) * Math.PI) / 180;
      const stickLength = 140;
      headingLine = window.L.polyline([
        gamePointToLatLng(gunX, gunY),
        gamePointToLatLng(gunX + Math.sin(headingRad) * stickLength, gunY + Math.cos(headingRad) * stickLength),
      ], { color: '#ffffff', weight: 2 }).addTo(leafletMap);
      headingLine.on('mousedown', (event) => startGunHeadingDrag(event, { gunKey, gunX, gunY, batteryId, gunId }));
    }

    const dx = targetX - gunX;
    const dy = targetY - gunY;
    const targetAz = normalizeAzimuth((Math.atan2(dx, dy) * 180) / Math.PI);
    const targetDistance = Math.hypot(dx, dy);
    const offset = renderedHeading < 360 ? getAzimuthDelta(renderedHeading, targetAz) : 0;
    const inSector = renderedHeading >= 360 || traverseDeg >= 360 || offset <= traverseDeg / 2;
    const inRange = targetDistance >= minRange && (maxRange <= 0 || targetDistance <= maxRange);
    if (!inSector || !inRange) {
      warnings.push(`${t('batteryShort')}${batteryId}-${t('gunShort')}${gunId}: Az ${targetAz.toFixed(1)}°${inSector ? '' : `, rotate to ${targetAz.toFixed(1)}°`}${inRange ? '' : `, D=${targetDistance.toFixed(0)}m`}`);
    }

    marker.on('mousedown', (event) => {
      if (event.originalEvent?.button !== 0) return;
      if (!isSelectedMarker('gun', gunKey)) {
        window.L.DomEvent.stop(event);
        selectMapMarker({ id: gunKey, type: 'gun', targetId: gunKey, x: gunX, y: gunY, azimuth: renderedHeading });
        return;
      }
      startGunHeadingDrag(event, { gunKey, gunX, gunY, batteryId, gunId });
    });

    const gunLabel = `${t('batteryShort')}${batteryId}-${t('gunShort')}${gunId}${getObserverSuffixForGun(`${batteryId}-${gunId}`)}`;
    marker.on('click', (event) => {
      window.L.DomEvent.stop(event);
      selectMapMarker({ id: gunKey, type: 'gun', targetId: gunKey, x: gunX, y: gunY, azimuth: renderedHeading, name: gunLabel });
    });
    addPersistentLabel(marker, gunLabel);
    gunMarkers.push(marker);
    if (headingLine) gunMarkers.push(headingLine);
    legendRows.push(`<p><span class="legend-dot" style="--dot-color:${gunColor}"></span>${gunLabel}: X=${gunX}, Y=${gunY}, Az=${renderedHeading.toFixed(1)}°, ${profile?.name ?? ''}</p>`);
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
    const minX = Math.min(...batteryGunPoints.map((point) => point.x));
    const maxX = Math.max(...batteryGunPoints.map((point) => point.x));
    const minY = Math.min(...batteryGunPoints.map((point) => point.y));
    const maxY = Math.max(...batteryGunPoints.map((point) => point.y));
    const batteryPadding = 20;
    const batteryColor = getBatteryColor(batteryId);
    const batteryBox = window.L.rectangle([
      gamePointToLatLng(minX - batteryPadding, minY - batteryPadding),
      gamePointToLatLng(maxX + batteryPadding, maxY + batteryPadding),
    ], {
      color: batteryColor,
      fill: false,
      weight: 2,
    }).addTo(leafletMap);
    const batteryName = getBatteryDisplayName(batteryId);
    addPersistentLabel(batteryBox, batteryName, { direction: 'bottom', offset: [0, 10] });
    gunMarkers.push(batteryBox);
    legendRows.push(`<p><span class="legend-dot" style="--dot-color:${batteryColor}"></span>${batteryName}: X=${center.x.toFixed(1)}, Y=${center.y.toFixed(1)}</p>`);
  }

  getObserverPoints().forEach(({ observerId, x, y }) => {
    const observerBatteryId = getObserverBoundBatteryId(observerId);
    const observerAccentColor = observerBatteryId ? getBatteryColor(observerBatteryId) : null;
    const isObserverSelected = isSelectedMarker('observer', observerId);
    const observerMarker = window.L.circleMarker(gamePointToLatLng(x, y), {
      radius: isObserverSelected ? 9 : 7,
      color: isObserverSelected ? '#ff3b30' : (observerAccentColor || markerStyle.observer),
      fillColor: isObserverSelected ? '#ff3b30' : markerStyle.observer,
      fillOpacity: 0.85,
      weight: isObserverSelected ? 4 : 2,
    }).addTo(leafletMap);
    if (observerAccentColor) {
      const observerFrame = window.L.circleMarker(gamePointToLatLng(x, y), {
        radius: 11,
        color: observerAccentColor,
        fill: false,
        weight: 2,
      }).addTo(leafletMap);
      gunMarkers.push(observerFrame);
    }
    const observerLabel = getObserverDisplayName(observerId);
    observerMarker.on('click', (event) => {
      window.L.DomEvent.stop(event);
      selectMapMarker({ id: observerId, type: 'observer', targetId: observerId, x, y, azimuth: null, name: observerLabel });
    });
    addPersistentLabel(observerMarker, observerLabel);
    gunMarkers.push(observerMarker);
    legendRows.push(`<p><span class="legend-dot" style="--dot-color:${markerStyle.observer}"></span>${observerLabel}: X=${x}, Y=${y}</p>`);
  });

  const isTargetSelected = isSelectedMarker('target', 'mission-target');
  if (!targetMarker) {
    targetMarker = window.L.circleMarker(gamePointToLatLng(targetX, targetY), {
      radius: isTargetSelected ? 11 : 9,
      color: isTargetSelected ? '#ff3b30' : markerStyle.target,
      fillColor: isTargetSelected ? '#ff3b30' : markerStyle.target,
      fillOpacity: 0.8,
      weight: isTargetSelected ? 4 : 3,
    }).addTo(leafletMap);
  } else {
    targetMarker.setLatLng(gamePointToLatLng(targetX, targetY));
    targetMarker.setRadius(isTargetSelected ? 11 : 9);
    targetMarker.setStyle({
      color: isTargetSelected ? '#ff3b30' : markerStyle.target,
      fillColor: isTargetSelected ? '#ff3b30' : markerStyle.target,
      weight: isTargetSelected ? 4 : 3,
    });
  }
  targetMarker.off('click');
  targetMarker.on('click', (event) => {
    window.L.DomEvent.stop(event);
    selectMapMarker({ id: 'mission-target', type: 'target', targetId: 'mission-target', x: targetX, y: targetY, azimuth: null, name: t('target') });
  });
  addPersistentLabel(targetMarker, t('target'));

  const tools = getMapToolsSettings();
  firePatternOverlays = drawFirePatternOverlay(tools.activeFirePattern, markerStyle);
  const rulerA = normalizeRulerPoint(tools.ruler?.p1);
  const rulerB = normalizeRulerPoint(tools.ruler?.p2);
  if (rulerA) {
    const p1Marker = window.L.marker(mapPointToLatLng(rulerA.mapX, rulerA.mapY), {
      icon: window.L.divIcon({ className: 'calibration-cross', html: '<span>A</span>' }),
      draggable: true,
    }).addTo(leafletMap);
    p1Marker.on('dragend', (event) => updateRulerPoint('p1', event.target.getLatLng()));
    rulerEndpointMarkers.push(p1Marker);
  }
  if (rulerA && rulerB) {
    const p2Marker = window.L.marker(mapPointToLatLng(rulerB.mapX, rulerB.mapY), {
      icon: window.L.divIcon({ className: 'calibration-cross', html: '<span>B</span>' }),
      draggable: true,
    }).addTo(leafletMap);
    p2Marker.on('dragend', (event) => updateRulerPoint('p2', event.target.getLatLng()));
    rulerEndpointMarkers.push(p2Marker);
    rulerLine = window.L.polyline([
      mapPointToLatLng(rulerA.mapX, rulerA.mapY),
      mapPointToLatLng(rulerB.mapX, rulerB.mapY),
    ], { color: '#ffe066', dashArray: '7 7' }).addTo(leafletMap);
    const rulerText = formatRulerMeasurement(rulerA, rulerB);
    rulerLine.bindTooltip(rulerText, { permanent: true, direction: 'center', className: 'map-label-tooltip' });
  }
  (tools.manualMarkers ?? []).forEach((item) => {
    const color = markerStyle[item.type] ?? '#ffffff';
    const isSelected = isSelectedMarker('manual', item.id);
    const marker = window.L.circleMarker(gamePointToLatLng(Number(item.x), Number(item.y)), {
      radius: isSelected ? 10 : 8,
      color: isSelected ? '#ff3b30' : color,
      fillColor: isSelected ? '#ff3b30' : color,
      fillOpacity: 0.95,
      weight: isSelected ? 4 : 2,
      dashArray: '4 4',
    }).addTo(leafletMap);
    addPersistentLabel(marker, buildManualMarkerDisplayLabel(item));
    marker.on('click', (event) => {
      window.L.DomEvent.stop(event);
      selectMapMarker({ ...item, id: item.id, type: 'manual' });
    });
    marker.on('mousedown', (event) => {
      window.L.DomEvent.stop(event);
      if (event.originalEvent?.button !== 0) return;
      if (!isSelectedMarker('manual', item.id)) {
        selectMapMarker({ ...item, id: item.id, type: 'manual' });
        return;
      }
      startManualMarkerDrag(item.id, marker);
    });
    marker.on('dblclick', (event) => {
      window.L.DomEvent.stop(event);
      selectedMapMarker = { type: 'manual', id: item.id };
      openManualMarkerEditor(item.id, marker);
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
      const label = buildManualMarkerDisplayLabel(item);
      return `<p><span class="legend-dot" style="--dot-color:${color}"></span>${label}: X=${Math.round(Number(item.x))}, Y=${Math.round(Number(item.y))}</p>`;
    });
    const patternRow = tools.activeFirePattern ? `<p><span class="legend-dot" style="--dot-color:${markerStyle.firePattern}"></span>${t('fireMode')}: ${t(`fireMode${tools.activeFirePattern.mode[0].toUpperCase()}${tools.activeFirePattern.mode.slice(1)}`)}</p>` : '';
    mapLegend.innerHTML = [...legendRows, `<p><span class="legend-dot" style="--dot-color:${markerStyle.target}"></span>${t('target')}: X=${targetX}, Y=${targetY}</p>`, patternRow, ...markerLegendRows].filter(Boolean).join('');
  }
}

function deleteSelectedMapMarker() {
  if (!selectedMapMarker) return;
  const tools = getMapToolsSettings();
  if (selectedMapMarker.type === 'manual') {
    const markerToDelete = (tools.manualMarkers ?? []).find((marker) => marker.id === selectedMapMarker.id);
    if (markerToDelete) clearMarkerCoordinatesAndAzimuth(markerToDelete);
    state.settings.mapTools = {
      ...tools,
      manualMarkers: (tools.manualMarkers ?? []).filter((marker) => marker.id !== selectedMapMarker.id),
    };
  } else {
    clearMarkerCoordinatesAndAzimuth({ type: selectedMapMarker.type, targetId: selectedMapMarker.id });
  }
  selectedMapMarker = null;
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
clearBrowserCacheBtn?.addEventListener('click', () => {
  clearBrowserPageCache();
});
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
  if (!event.target.matches('[data-gun-heading], [data-profile-traverse], [data-profile-min-range], [data-profile-max-range], [data-profile-projectiles], [data-profile-tables]')) return;
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
  deleteSelectedMapMarker();
});


document.addEventListener('input', (event) => {
  let shouldRefreshMap = event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement;
  if (event.target instanceof HTMLInputElement) {
    if (event.target.matches('[data-coordinate]')) {
      applyCoordinatePairInput(event.target);
      sanitizeIntegerInput(event.target, COORD_LIMITS);
      shouldRefreshMap = true;
    }
    if (event.target.matches('[data-height]')) sanitizeIntegerInput(event.target, HEIGHT_LIMITS);
    if (event.target.matches('[data-gun-heading]')) {
      const heading = parseDecimalInput(event.target.value);
      if (heading !== null) event.target.value = String(event.target.value).replace(',', '.');
      shouldRefreshMap = true;
    }
    if (event.target.matches('[data-battery-title], [data-observer-name]')) {
      shouldRefreshMap = true;
      refreshLiveNameBindings();
      renderMissionSelectors();
      renderCounterBatterySection();
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
  enhanceTabTiles();
  updateCalibrationSummary();
  runHealthCheck();
});

themeSelect?.addEventListener('change', (event) => {
  state.theme = event.target.value;
  localStorage.setItem('calc.theme', state.theme);
  document.body.dataset.theme = state.theme;
});

function enhanceTabTiles() {
  tabs.forEach((tab) => {
    tab.textContent = tab.textContent?.trim() ?? '';
  });
}

calibrationModeButton?.addEventListener('click', () => {
  const tools = getMapToolsSettings();
  setCalibrationMode(!tools.calibrationMode);
});
document.querySelector('#apply-calibration')?.addEventListener('click', applyCalibration);
document.querySelector('#reset-calibration')?.addEventListener('click', resetCalibration);
document.querySelector('#clear-map-image')?.addEventListener('click', clearMapImage);
document.querySelector('#apply-manual-markers')?.addEventListener('click', applyManualMarkers);
document.querySelector('#clear-manual-markers')?.addEventListener('click', clearManualMarkers);
markerToolSelect?.addEventListener('change', () => {
  syncMarkerTargetOptions();
});
mapImageUploadInput?.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  await uploadMapImageFile(file);
});

pasteMapImageButton?.addEventListener('click', async () => {
  await pasteMapImageFromClipboard();
});

document.body.dataset.theme = state.theme;
applyI18n();
enhanceTabTiles();
updateCalibrationSummary();
persistLauncherSettings();
hydrateMapImageFromServer();
runHealthCheck();
