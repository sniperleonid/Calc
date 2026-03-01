import { createCounterBatteryModule } from '/apps/counter-battery/module.js';
import { computeFireSolution, computeFireSolutionsMulti, getWeapon } from '/apps/ballistics-core/index.js';
import { FIRE_MODE_IDS } from './fire-modes.js';
import {
  buildAimPlanFromFdc,
  getNextFirePackage,
  advancePlanCursor,
  isPlanComplete,
  getFdcUiSchema,
  migrateOldMissionToFdc,
} from '/apps/fire-control/src/fire-mission.js';
import { adjustDirection, adjustRange, createAdjustmentState, decomposeWind, getAdjustmentOffset } from '/apps/fire-control/src/adjustment.js';

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
const MISSION_TARGET_IDS = ['mission-target-1', 'mission-target-2', 'mission-target-3', 'mission-target-4', 'mission-target-5'];

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
      gunSettings: {},
    };
  }
}

const DEFAULT_EXTERNAL_MAP_URL = 'http://localhost:4173';

const state = {
  lang: localStorage.getItem('calc.lang') || 'ru',
  theme: localStorage.getItem('calc.theme') || 'terminal',
  settings: loadLauncherSettings(),
};

const i18n = {
  ru: {
    appVersion: 'Calc v1', appTitle: 'Баллистический калькулятор', appSubtitle: 'Единая оболочка для планирования огневых задач и оперативных данных.',
    tabHome: 'Главная', tabGlobal: 'Глобальные настройки', tabProfiles: 'Профили', tabFire: 'Огневые задачи', tabCorrection: 'Корректировка', tabCounterBattery: 'Контрбатарейный огонь', tabMap: 'Карта', tabSafety: 'Безопасность и данные', tabSettings: 'Настройки',
    tipTabHome: 'Быстрый обзор состояния системы и ключевых переходов.', tipTabGlobal: 'Настройка состава батарей, орудий и наблюдателей перед расчётами.', tipTabFire: 'Подготовка и расчёт параметров для огневой задачи.', tipTabCorrection: 'Корректировка по активной цели и действия наблюдателя без перегрузки вкладки задач.', tipTabMap: 'Работа с тактической картой, метками и калибровкой.', tipTabSafety: 'Проверка логов, экспорт данных и служебные операции.', tipTabSettings: 'Переключение языка и визуальной темы интерфейса.',
    homeConfiguration: 'Глобальные настройки', homeFire: 'Огневые задачи', homeMap: 'Карта и интеграции', openApi: 'Открыть API', editGlobalData: 'Настроить орудия, батареи и наблюдателей',
    tipHomeGlobalCard: 'Карточка для первичной настройки структуры подразделения.', tipHomeFireCard: 'Карточка с быстрым переходом к расчётам и проверке доступности сервисов.', tipHomeMapCard: 'Карточка открытия внешней карты и интеграции с оболочкой.', tipMapCanvasCard: 'Основное рабочее окно карты: масштабирование, метки и позиционирование.', tipMapToolsCard: 'Панель вспомогательных инструментов карты и калибровки.',
    openMissionPlanner: 'Открыть вкладку задач', checkServices: 'Проверить сервисы', checkServicesHint: 'Проверяет доступность Ballistics Core на localhost:8000', openMap: 'Открыть карту', mapUrl: 'URL внешней карты (необязательно)',
    sectionConfigTitle: 'Параметры батарей и орудий', batterySectionTitle: 'Батареи', gunsSectionTitle: 'Орудия', observerSectionTitle: 'Наблюдатели',
    batteryCount: 'Количество батарей', batteryHeightHint: 'Высота задаётся отдельно для каждой батареи и применяется ко всем орудиям этой батареи.',
    batteryHeight: 'Высота (м)', gunsPerBattery: 'Кол-во орудий', batteryName: 'Название', coordinatesTitle: 'Координаты и наблюдатели', gunsHint: 'Для каждого орудия укажите координаты карты.',
    observerTitle: 'Наблюдатели и привязки', observerCount: 'Количество наблюдателей (до 5)', observerBinding: 'Привязка наблюдателя', observerMode: 'Режим',
    bindToGun: 'К орудию', bindToBattery: 'К батарее', gunnerHint: 'Все расчёты выполняются на основе глобальных настроек.',
    actionsTitle: 'Действия', calculate: 'Рассчитать', showMto: 'Показать MTO', logMission: 'Сохранить миссию',
    correctionTabTitle: 'Корректировка по активной цели', correctionTabHint: 'Используются активная цель и выбранные орудия из вкладки «Огневые задачи».', correctionTitle: 'Корректировка', correctionObserver: 'Наблюдатель корректировки', saveCorrection: 'Сохранить поправку', resetCorrection: 'Сбросить поправку',
    correctionAnchorObserver: 'Привязан к наблюдателю', correctionAnchorGun: 'Корректировка от орудия (наблюдатель не привязан)',
    observerTargetingTitle: 'Наведение наблюдателем', observerTargetingHint: 'Если координаты цели неизвестны, задайте дальность и азимут. Угол/высота — опционально.', applyObserverTargeting: 'Рассчитать цель от наблюдателя',
    correctionApplied: 'Поправка сохранена', correctionResetDone: 'Поправка сброшена', observerTargetingApplied: 'Координаты цели обновлены от наблюдателя', observerTargetingUnavailable: 'Нет координат наблюдателя для наведения',
    missionTitle: 'Калькулятор огневой задачи', missionName: 'Название задачи', missionBattery: 'Батарея', missionGun: 'Орудие (или все в батарее)', missionProjectileSelectionTitle: 'Выбор снарядов и зарядов по типам орудий', missionProjectileSelectionHint: 'Снаряд и пороховой заряд выбираются отдельно для каждого типа орудия, участвующего в задаче.', missionChargeMode: 'Режим заряда', missionChargeModeAuto: 'Авто', missionChargeModeManual: 'Ручной', missionChargeLabel: 'Пороховой заряд', missionChargeLoading: 'загрузка...', missionChargeUnavailable: 'нет зарядов', manualChargeErrorHeader: 'Не удалось рассчитать для выбранного ручного заряда активной цели.', manualChargeErrorChooseAnother: 'Выберите другой заряд из доступных вариантов:', trajectoryType: 'Тип траектории', trajectoryTypeIndirect: 'Навесная', trajectoryTypeDirect: 'Прямая', indirectArcType: 'Навесная траектория', indirectArcLow: 'Низкая', indirectArcHigh: 'Высокая', trajectorySupportHintDirectUnsupported: 'Прямая траектория недоступна: для выбранного орудия/снаряда нет таблицы direct.', trajectorySupportHintIndirectUnsupported: 'Навесная траектория недоступна: для выбранного орудия/снаряда нет таблиц low/high.', trajectorySupportHintArcHighOnly: 'Доступна только высокая навесная траектория.', trajectorySupportHintArcLowOnly: 'Доступна только низкая навесная траектория.', trajectorySupportHintArcUnavailable: 'Для навесной траектории нет таблиц low/high. Будет выбрана доступная траектория автоматически.', activeTargetLabel: 'Активная цель', targetX: 'Координата цели X', targetY: 'Координата цели Y', targetHeight: 'Высота цели (м)',
    fireMode: 'Тип огня', fireModePoint: 'Точка (1 точка)', fireModeConverged: 'Сходящийся', fireModeParallelSheaf: 'Параллельный веер', fireModeOpenSheaf: 'Открытый веер', fireModeCircularArea: 'Круговой', fireModeLinear: 'Линейный', fireModeRectArea: 'Прямоугольник', fireModePointHint: 'Все орудия стреляют в одну точку цели.', fireModeConvergedHint: 'Сведение огня в одну точку с возможными индивидуальными поправками.',
    counterBatteryTitle: 'Контрбатарейное обнаружение', counterBatteryHint: 'Реальные методы: звукопеленгация, анализ воронок с обратным азимутом, триангуляция по азимутам и гипербола TDOA.', counterBatteryMethod: 'Метод определения', cbMethodSound: 'Звукопеленгация (sound ranging)', cbMethodCrater: 'Анализ воронок и обратный азимут', cbMethodTriangulation: 'Триангуляция по азимутам наблюдателей', cbMethodHyperbola: 'Гипербола по разности времени прихода (TDOA)', cbBearing: 'Азимут на источник (°)', cbEstimatedDistance: 'Оценочная дальность (м)', cbTdoaDelta: 'Разница времени прихода (мс)', cbImpactBearing: 'Обратный азимут от воронки (°)', counterBatteryObservers: 'Данные наблюдателей', counterBatteryObserversHint: 'Чем больше точек наблюдения, тем точнее координаты вражеского орудия.', cbAddPoint: 'Добавить точку', cbClearPoints: 'Очистить точки', cbLocateTarget: 'Найти вражеское орудие', cbCalculateResponse: 'Рассчитать ответный огонь', cbObserverPoint: 'Точка', cbObserver: 'Наблюдатель', cbObservationAzimuth: 'Азимут наблюдения (°)', cbObservationDelay: 'Задержка звука (с)', cbNeedTwoPoints: 'Нужно минимум две валидные точки наблюдения.', cbTargetLocated: 'Цель определена', cbTargetNotFound: 'Не удалось определить координаты цели по выбранному методу.', cbResponseHeader: 'Ответный огонь (доступные орудия в зоне досягаемости)', cbNoReachableGuns: 'Нет доступных орудий в зоне досягаемости.', cbMethodUsed: 'Метод', cbRecommendedGun: 'Рекомендуем:', cbGunFacing: 'направление ', cbNeedsReposition: '(понадобится разворот вне сектора)',
    mapPanelTitle: 'Тактическая карта (Leaflet)', mapLegendTitle: 'Легенда', mapLegendHint: 'Карта показывает орудия выбранной батареи и текущую цель из вкладки «Огневые задачи».',
    syncMap: 'Синхронизировать с координатами', centerTarget: 'Центр на цели',
    safeDataTitle: 'Контроль данных', safeDataDescription: 'Проверка журналов и экспорт служебных данных.', openLogs: 'Открыть логи', exportData: 'Экспорт данных', clearAllData: 'Очистить данные', clearAllDataConfirm: 'Подтвердите очистку: будут удалены все координаты, маркеры, калибровки, задачи и данные карты. Профили орудий и привязки снарядов/таблиц останутся без изменений.',
    serviceState: 'Состояние сервисов', generalSettings: 'Общие настройки', language: 'Язык', theme: 'Тема', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue', themeCommander: 'Commander Light',
    ballisticsOk: '✅ Ballistics Core: запущен', ballisticsWarn: '⚠️ Ballistics Core: не отвечает. Проверьте Python и uvicorn.',
    dataCleared: 'Локальные данные очищены', clearBrowserCache: 'Очистить кэш браузера страницы', browserCacheCleared: 'Кэш браузера страницы очищен', battery: 'Батарея', batteryShort: 'Б', gun: 'Орудие', gunShort: 'О', observer: 'Наблюдатель', observerShort: 'Н', x: 'X', y: 'Y',
    observerHeight: 'Высота (м)', observerName: 'Имя наблюдателя',
    allGuns: 'Все орудия батареи', gunProfile: 'Профиль орудия', projectileProfile: 'Профиль снаряда', gunDirectionAzimuth: 'Азимут центрального направления (°)',
    calcDone: 'Расчёт выполнен', mtoHeader: 'MTO: расход по выбранным орудиям', missionSaved: 'Миссия сохранена', noMissions: 'Сохранённых миссий нет',
    logsError: 'Не удалось загрузить логи', logsOpenError: 'Не удалось открыть папку логов', logsOpened: 'Открываю папку логов', logsPath: 'Путь к логам', exportReady: 'Экспорт данных подготовлен', noLogsYet: 'Логи пока не найдены',
    target: 'Цель', openedExternalMap: 'Открыта внешняя карта',
    invalidCoordinates: 'Ошибка координат: разрешены только цифры и допустимые пределы',
    mapToolsTitle: 'Инструменты меток', mapImageUpload: 'Загрузить свою карту (PNG/JPG)', pasteMapImage: 'Вставить карту из буфера', applyMapImage: 'Применить карту', clearMapImage: 'Убрать карту', mapImageTooLarge: 'Файл карты больше 150 МБ. Уменьшите файл и попробуйте снова.', mapImageUploadFailed: 'Не удалось загрузить изображение карты на сервер.', mapImageClipboardUnsupported: 'Буфер обмена не поддерживается браузером или недоступен без HTTPS/localhost.', mapImageClipboardEmpty: 'В буфере обмена не найдено изображение.',
    calibrationHint: 'Калибровка: включите режим, двойным щелчком ставьте метки P0/P1/P2 циклично. Введите только координаты P0 и длину P1-P2 в метрах.', applyCalibration: 'Применить калибровку', resetCalibration: 'Сбросить калибровку', calibrationApplied: 'Калибровка обновлена', calibrationResetDone: 'Калибровка сброшена', mapImageApplied: 'Пользовательская карта применена', mapImageCleared: 'Пользовательская карта убрана', invalidCalibration: 'Заполните корректные точки калибровки', calibrationRequiredBeforeWork: 'Сначала выполните калибровку карты. Пока калибровка не завершена, расчёты и рабочие инструменты заблокированы.', lastCalibrationLabel: 'Последняя калибровка', lastCalibrationMissing: 'Последняя калибровка отсутствует',
    markerToolLabel: 'Тип метки', markerToolGun: 'Активное орудие', markerToolTarget: 'Цель', markerToolObserver: 'Наблюдатель', markerToolRuler: 'Линейка', markerToolCoords: 'Снятие координат', markerPlaced: 'Метка добавлена', markerTargetLabel: 'Активная цель метки', markerEditorTitle: 'Параметры метки', markerNameLabel: 'Название', markerAzimuthLabel: 'Азимут', markerEditorSaved: 'Параметры метки обновлены', markerDeleted: 'Метка удалена',
    rulerPointSet: 'Точка линейки установлена', rulerMeasurement: 'Линейка', rulerCleared: 'Линейка удалена', coordsCaptured: 'Координаты точки',
    calibrationMode: 'Режим калибровки', calibrationModeToggle: 'Калибровка: выкл', calibrationModeToggleActive: 'Калибровка: вкл', calibrationScaleLabel: 'Масштаб P1-P2 (м)', calibrationKnownP0X: 'Известные координаты P0 X', calibrationKnownP0Y: 'Известные координаты P0 Y', calibrationPointSet: 'Калибровочная точка установлена', calibrationNeedThreePoints: 'Поставьте P0, P1 и P2', applyManualMarkers: 'Применить ручные метки', mapSettingsTitle: 'Настройки карты', mapSettingsHint: 'Настройки карты скрыты и не мешают работе с метками.', markerLocked: 'Постоянную метку нельзя перемещать или менять', clearManualMarkers: 'Очистить ручные метки', profilesTitle: 'Профили орудий и боеприпасов', profilesHint: 'Профили загружаются из tables/<gun>/profile.json и редактируются вручную в файлах.', profileTraverseDeg: 'Сектор наведения (°)', profileMinRange: 'Минимальная дальность (м)', profileMaxRange: 'Максимальная дальность (м)', profileProjectiles: 'Привязанные снаряды', profileTables: 'Баллистические таблицы', mapRotationHint: 'Левая кнопка мыши по орудию: задать азимут', mapWarningPrefix: 'Предупреждение'
  },
  en: {
    appVersion: 'Calc v1', appTitle: 'Ballistics Calculator', appSubtitle: 'Unified shell for fire mission planning and operational data.',
    tabHome: 'Home', tabGlobal: 'Global settings', tabProfiles: 'Profiles', tabFire: 'Fire Missions', tabCorrection: 'Correction', tabMap: 'Map', tabSafety: 'Safety & Data', tabSettings: 'Settings',
    tipTabHome: 'Quick system overview and key navigation links.', tipTabGlobal: 'Configure batteries, guns, and observers before calculations.', tipTabFire: 'Prepare and calculate fire mission parameters.', tipTabCorrection: 'Apply active-target correction and observer-driven targeting in a dedicated workspace.', tipTabMap: 'Work with tactical map, markers, and calibration.', tipTabSafety: 'Check logs, export data, and run service actions.', tipTabSettings: 'Switch interface language and visual theme.',
    homeConfiguration: 'Global settings', homeFire: 'Fire Missions', homeMap: 'Map & integrations', openApi: 'Open API', editGlobalData: 'Configure guns, batteries and observers',
    tipHomeGlobalCard: 'Primary card for configuring your unit structure.', tipHomeFireCard: 'Quick access to mission calculations and service health check.', tipHomeMapCard: 'Open and bind an external map workspace.', tipMapCanvasCard: 'Main tactical canvas for zoom, markers, and position tracking.', tipMapToolsCard: 'Helper controls for map markers and calibration.',
    openMissionPlanner: 'Open missions tab', checkServices: 'Check services', checkServicesHint: 'Checks Ballistics Core availability on localhost:8000', openMap: 'Open map', mapUrl: 'External map URL (optional)',
    sectionConfigTitle: 'Battery and gun parameters', batterySectionTitle: 'Batteries', gunsSectionTitle: 'Guns', observerSectionTitle: 'Observers',
    batteryCount: 'Battery count', batteryHeightHint: 'Each battery has an independent altitude applied to every gun in that battery.',
    batteryHeight: 'Height (m)', gunsPerBattery: 'Guns count', batteryName: 'Name', coordinatesTitle: 'Coordinates and observers', gunsHint: 'Set map coordinates for each gun.',
    observerTitle: 'Observers and bindings', observerCount: 'Observers count (up to 5)', observerBinding: 'Observer binding', observerMode: 'Mode',
    bindToGun: 'To gun', bindToBattery: 'To battery', gunnerHint: 'All calculations use data from global settings.',
    actionsTitle: 'Actions', calculate: 'Calculate', showMto: 'Show MTO', logMission: 'Save mission',
    correctionTabTitle: 'Correction for active target', correctionTabHint: 'Uses active target and selected guns from the Fire Missions tab.', correctionTitle: 'Correction', correctionObserver: 'Correction observer', saveCorrection: 'Save correction', resetCorrection: 'Reset correction',
    correctionAnchorObserver: 'Anchored to observer', correctionAnchorGun: 'Correction from gun (observer not linked)',
    observerTargetingTitle: 'Observer targeting', observerTargetingHint: 'If target coordinates are unknown, enter distance and azimuth. Angle/height are optional.', applyObserverTargeting: 'Compute target from observer',
    correctionApplied: 'Correction saved', correctionResetDone: 'Correction reset', observerTargetingApplied: 'Target coordinates updated from observer', observerTargetingUnavailable: 'Observer coordinates are unavailable',
    missionTitle: 'Fire mission calculator', missionName: 'Mission name', missionBattery: 'Battery', missionGun: 'Gun (or full battery)', missionProjectileSelectionTitle: 'Projectile and charge selection by gun type', missionProjectileSelectionHint: 'Pick projectile and powder charge separately for each gun type involved in the mission.', missionChargeMode: 'Charge mode', missionChargeModeAuto: 'Auto', missionChargeModeManual: 'Manual', missionChargeLabel: 'Powder charge', missionChargeLoading: 'loading...', missionChargeUnavailable: 'no charges', manualChargeErrorHeader: 'Cannot compute active target for selected manual charge.', manualChargeErrorChooseAnother: 'Try another available charge:', trajectoryType: 'Trajectory type', trajectoryTypeIndirect: 'Indirect', trajectoryTypeDirect: 'Direct', indirectArcType: 'Indirect trajectory arc', indirectArcLow: 'Low', indirectArcHigh: 'High', trajectorySupportHintDirectUnsupported: 'Direct trajectory is not available: no direct table for selected gun/projectile.', trajectorySupportHintIndirectUnsupported: 'Indirect trajectory is not available: no low/high tables for selected gun/projectile.', trajectorySupportHintArcHighOnly: 'Only high indirect trajectory is available.', trajectorySupportHintArcLowOnly: 'Only low indirect trajectory is available.', trajectorySupportHintArcUnavailable: 'No low/high tables for indirect trajectory. Available trajectory will be selected automatically.', activeTargetLabel: 'Active target', targetX: 'Target X coordinate', targetY: 'Target Y coordinate', targetHeight: 'Target altitude (m)',
    fireMode: 'Fire mode', fireModePoint: 'Point (single aim)', fireModeConverged: 'Converged', fireModeParallelSheaf: 'Parallel sheaf', fireModeOpenSheaf: 'Open sheaf', fireModeCircularArea: 'Circular area', fireModeLinear: 'Linear', fireModeRectArea: 'Rectangle area', fireModePointHint: 'All guns fire at one point.', fireModeConvergedHint: 'All guns converge on one point with optional individual corrections.',
    counterBatteryTitle: 'Counter-battery detection', counterBatteryHint: 'Real techniques: sound ranging, crater analysis with reverse azimuth, observer azimuth triangulation, and TDOA hyperbola.', counterBatteryMethod: 'Detection method', cbMethodSound: 'Sound ranging', cbMethodCrater: 'Crater analysis + reverse azimuth', cbMethodTriangulation: 'Observer azimuth triangulation', cbMethodHyperbola: 'TDOA hyperbola', cbBearing: 'Bearing to source (°)', cbEstimatedDistance: 'Estimated range (m)', cbTdoaDelta: 'Arrival time difference (ms)', cbImpactBearing: 'Reverse azimuth from crater (°)', counterBatteryObservers: 'Observer data', counterBatteryObserversHint: 'More observation points produce better enemy gun localization.', cbAddPoint: 'Add point', cbClearPoints: 'Clear points', cbLocateTarget: 'Locate enemy gun', cbCalculateResponse: 'Calculate counter-fire', cbObserverPoint: 'Point', cbObserver: 'Observer', cbObservationAzimuth: 'Observation azimuth (°)', cbObservationDelay: 'Sound delay (s)', cbNeedTwoPoints: 'At least two valid observation points are required.', cbTargetLocated: 'Target localized', cbTargetNotFound: 'Unable to compute target coordinates with selected method.', cbResponseHeader: 'Counter-fire (reachable friendly guns)', cbNoReachableGuns: 'No reachable guns in range.', cbMethodUsed: 'Method', cbRecommendedGun: 'Recommended:', cbGunFacing: 'facing ', cbNeedsReposition: '(requires reposition outside traverse)',
    mapPanelTitle: 'Tactical map (Leaflet)', mapLegendTitle: 'Legend', mapLegendHint: 'The map shows guns in selected battery and the current target from Fire Missions tab.',
    syncMap: 'Sync with coordinates', centerTarget: 'Center on target',
    safeDataTitle: 'Data control', safeDataDescription: 'Check logs and export service data.', openLogs: 'Open logs', exportData: 'Export data', clearAllData: 'Clear data', clearAllDataConfirm: 'Confirm clearing: all coordinates, markers, calibrations, missions, and map data will be removed. Gun profiles and projectile/table bindings will remain unchanged.',
    serviceState: 'Service status', generalSettings: 'General settings', language: 'Language', theme: 'Theme', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue', themeCommander: 'Commander Light',
    ballisticsOk: '✅ Ballistics Core: online', ballisticsWarn: '⚠️ Ballistics Core: unavailable. Check Python and uvicorn.',
    dataCleared: 'Local data has been cleared', clearBrowserCache: 'Clear this page browser cache', browserCacheCleared: 'Browser cache for this page has been cleared', battery: 'Battery', batteryShort: 'B', gun: 'Gun', gunShort: 'G', observer: 'Observer', observerShort: 'O', x: 'X', y: 'Y',
    observerHeight: 'Height (m)', observerName: 'Observer name',
    allGuns: 'All guns in battery', gunProfile: 'Gun profile', projectileProfile: 'Projectile profile', gunDirectionAzimuth: 'Central azimuth (°)',
    calcDone: 'Calculation complete', mtoHeader: 'MTO: ammo usage for selected guns', missionSaved: 'Mission saved', noMissions: 'No saved missions',
    logsError: 'Failed to load logs', logsOpenError: 'Failed to open logs folder', logsOpened: 'Opening logs folder', logsPath: 'Logs path', exportReady: 'Data export ready', noLogsYet: 'No logs found yet',
    target: 'Target', openedExternalMap: 'Opened external map',
    invalidCoordinates: 'Coordinate error: only digits and allowed limits are accepted',
    mapToolsTitle: 'Marker tools', mapImageUpload: 'Upload your map (PNG/JPG)', pasteMapImage: 'Paste map from clipboard', applyMapImage: 'Apply map image', clearMapImage: 'Clear map image', mapImageTooLarge: 'Map image is larger than 150 MB. Reduce file size and try again.', mapImageUploadFailed: 'Failed to upload map image to server.', mapImageClipboardUnsupported: 'Clipboard image read is not available in this browser or without HTTPS/localhost.', mapImageClipboardEmpty: 'No image found in clipboard.',
    calibrationHint: 'Calibration: enable mode, double-click to place P0/P1/P2 cyclically, then enter only P0 coordinates and P1-P2 distance in meters.', applyCalibration: 'Apply calibration', resetCalibration: 'Reset calibration', calibrationApplied: 'Calibration updated', calibrationResetDone: 'Calibration reset', mapImageApplied: 'Custom map image applied', mapImageCleared: 'Custom map image cleared', invalidCalibration: 'Fill valid calibration points', calibrationRequiredBeforeWork: 'Complete map calibration first. Calculations and map tools are locked until calibration is applied.', lastCalibrationLabel: 'Last calibration', lastCalibrationMissing: 'No saved calibration yet',
    markerToolLabel: 'Marker type', markerToolGun: 'Active gun', markerToolTarget: 'Target', markerToolObserver: 'Observer', markerToolRuler: 'Ruler', markerToolCoords: 'Coordinate pick', markerPlaced: 'Marker added', markerTargetLabel: 'Active marker target', markerEditorTitle: 'Marker parameters', markerNameLabel: 'Name', markerAzimuthLabel: 'Azimuth', markerEditorSaved: 'Marker parameters updated', markerDeleted: 'Marker deleted',
    rulerPointSet: 'Ruler point set', rulerMeasurement: 'Ruler', rulerCleared: 'Ruler removed', coordsCaptured: 'Picked coordinates',
    calibrationMode: 'Calibration mode', calibrationModeToggle: 'Calibration: off', calibrationModeToggleActive: 'Calibration: on', calibrationScaleLabel: 'P1-P2 scale (m)', calibrationKnownP0X: 'Known P0 X', calibrationKnownP0Y: 'Known P0 Y', calibrationPointSet: 'Calibration point set', calibrationNeedThreePoints: 'Set P0, P1 and P2', applyManualMarkers: 'Apply manual markers', mapSettingsTitle: 'Map settings', mapSettingsHint: 'Map settings are collapsible so they do not interfere with marker work.', markerLocked: 'Permanent marker cannot be moved or edited', clearManualMarkers: 'Clear manual markers', profilesTitle: 'Gun and ammo profiles', profilesHint: 'Profiles are loaded from tables/<gun>/profile.json and should be edited manually in files.', profileTraverseDeg: 'Traverse sector (°)', profileMinRange: 'Min range (m)', profileMaxRange: 'Max range (m)', profileProjectiles: 'Linked projectiles', profileTables: 'Ballistic tables', mapRotationHint: 'Left mouse on gun: point gun azimuth', mapWarningPrefix: 'Warning' 
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
const missionBatterySelect = document.querySelector('#mission-battery');
const missionGunSelect = document.querySelector('#mission-gun');
const missionProjectileSelectors = document.querySelector('#mission-projectile-selectors');
const activeTargetSelect = document.querySelector('#active-target');
const trajectoryTypeSelect = document.querySelector('#trajectory-type');
const indirectArcSelect = document.querySelector('#indirect-arc');
const indirectArcSettings = document.querySelector('#indirect-arc-settings');
const trajectorySupportHint = document.querySelector('#trajectory-support-hint');
const correctionObserverSelect = document.querySelector('#correction-observer');
const correctionAnchorInfo = document.querySelector('#correction-anchor-info');
const adjustmentOffsetInfo = document.querySelector('#adjustment-offset-info');
const windComponentsInfo = document.querySelector('#wind-components-info');
const fireOutput = document.querySelector('#fire-output');
const fmTargetTypeSelect = document.querySelector('#fm-target-type');
const fmSheafTypeSelect = document.querySelector('#fm-sheaf-type');
const fmControlTypeSelect = document.querySelector('#fm-control-type');
const fmLengthInput = document.querySelector('#fm-length');
const fmWidthInput = document.querySelector('#fm-width');
const fmRadiusInput = document.querySelector('#fm-radius');
const fmAimPointCountInput = document.querySelector('#fm-aimpoint-count');
const fmConditionalFields = Array.from(document.querySelectorAll('[data-fm-field]'));
let activeAimPlan = null;
let adjustmentSession = null;
const missionChargeOptionsCache = new Map();
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

const t = (key) => i18n[state.lang][key] ?? key;

function getMissionTargetNameByIndex(index) {
  return `Ц-${index + 1}`;
}

function normalizeMissionTargets(mission = {}) {
  const legacyX = mission.targetX ?? '';
  const legacyY = mission.targetY ?? '';
  const legacyHeight = mission.targetHeight ?? '';
  const source = Array.isArray(mission.targets) ? mission.targets : [];
  const normalized = MISSION_TARGET_IDS.map((id, index) => {
    const fromId = source.find((item) => item?.id === id);
    const fromIndex = source[index];
    const item = fromId ?? fromIndex ?? {};
    return {
      id,
      name: getMissionTargetNameByIndex(index),
      active: true,
      x: String(item.x ?? (index === 0 ? legacyX : '') ?? ''),
      y: String(item.y ?? (index === 0 ? legacyY : '') ?? ''),
      height: String(item.height ?? (index === 0 ? legacyHeight : '') ?? ''),
    };
  });
  return normalized;
}

function getMissionTargets() {
  return normalizeMissionTargets(state.settings.mission ?? {});
}

function getMissionTargetLabel(targetId) {
  const index = MISSION_TARGET_IDS.indexOf(targetId);
  return getMissionTargetNameByIndex(index >= 0 ? index : 0);
}

let gunProfiles = [];
let serverArtilleryProfiles = null;
function getDefaultArtilleryProfiles() {
  return serverArtilleryProfiles ? { ...serverArtilleryProfiles } : {};
}

function getArtilleryProfiles() {
  return getDefaultArtilleryProfiles();
}

function buildProfilesFromCatalog(catalog) {
  const guns = Array.isArray(catalog?.guns) ? catalog.guns : [];
  const profiles = {};
  const ids = [];
  for (const gun of guns) {
    if (!gun?.id) continue;
    ids.push(gun.id);
    const projectileNames = (gun.projectiles ?? []).map((projectile) => projectile.id).filter(Boolean);
    const trajectoryCapabilities = Object.fromEntries((gun.projectiles ?? [])
      .filter((projectile) => projectile?.id)
      .map((projectile) => {
        const files = Array.isArray(projectile.ballisticTables) ? projectile.ballisticTables.map((name) => String(name).toLowerCase()) : [];
        return [projectile.id, {
          direct: files.some((name) => name.includes('direct')),
          low: files.some((name) => name.includes('low')),
          high: files.some((name) => name.includes('high')),
        }];
      }));
    const profile = gun.profile ?? {};
    profiles[gun.id] = {
      name: profile.name ?? gun.id,
      traverseDeg: Number(profile.traverse_sector_deg ?? profile.traverseDeg ?? 360),
      headingCenterDeg: Number(profile.heading_center_deg ?? profile.headingCenterDeg ?? 0),
      minElevationMil: Number(profile.min_elevation_mil ?? profile.minElevationMil ?? 0),
      maxElevationMil: Number(profile.max_elevation_mil ?? profile.maxElevationMil ?? 0),
      minRange: Number(profile.min_range_m ?? profile.minRange ?? 0),
      maxRange: Number(profile.max_range_m ?? profile.maxRange ?? 0),
      projectiles: profile.ammo_types?.join('/') ?? projectileNames.join('/'),
      tables: projectileNames.map((projectileId) => `${gun.id}/${projectileId}`).join(', '),
      trajectoryCapabilities,
    };
  }
  return { profiles, ids };
}

async function loadArtilleryCatalog() {
  try {
    const response = await fetch('/api/artillery-catalog', { cache: 'no-store' });
    if (!response.ok) return;
    const catalog = await response.json();
    const { profiles, ids } = buildProfilesFromCatalog(catalog);
    if (!ids.length) return;
    serverArtilleryProfiles = profiles;
    gunProfiles = ids;
  } catch {
    // keep local defaults when catalog cannot be loaded
  }
}

const counterBatteryModule = createCounterBatteryModule({
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
});

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
let mapImageOverlay;
const gunMarkers = [];
const manualMarkers = [];
const calibrationMarkers = [];
let calibrationLine;
let rulerLine;
let rulerEndpointMarkers = [];
let firePatternOverlays = [];
let selectedMapMarker = null;
let lastMissionTargetId = MISSION_TARGET_IDS[0];
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

function getSelectedMissionTargetId() {
  const mission = state.settings.mission ?? {};
  const fallback = mission.activeTargetId;
  const selected = activeTargetSelect?.value || fallback;
  return MISSION_TARGET_IDS.includes(selected) ? selected : MISSION_TARGET_IDS[0];
}

function updateMissionTargetInputsFromState() {
  const selectedTargetId = getSelectedMissionTargetId();
  const selectedTarget = getMissionTargets().find((item) => item.id === selectedTargetId) ?? getMissionTargets()[0];
  const targetXInput = document.querySelector('#target-x');
  const targetYInput = document.querySelector('#target-y');
  const targetHeightInput = document.querySelector('#target-height');
  if (targetXInput) targetXInput.value = selectedTarget?.x ?? '';
  if (targetYInput) targetYInput.value = selectedTarget?.y ?? '';
  if (targetHeightInput) targetHeightInput.value = selectedTarget?.height ?? '';
}


function storeCurrentMissionTargetInputs(targetId = lastMissionTargetId) {
  if (!MISSION_TARGET_IDS.includes(targetId)) return;
  const mission = state.settings.mission ?? {};
  const targetXInput = document.querySelector('#target-x');
  const targetYInput = document.querySelector('#target-y');
  const targetHeightInput = document.querySelector('#target-height');
  const targets = getMissionTargets().map((item) => (item.id === targetId
    ? { ...item, x: targetXInput?.value ?? '', y: targetYInput?.value ?? '', height: targetHeightInput?.value ?? '' }
    : item));
  state.settings.mission = { ...mission, targets };
}

function syncMissionTargetControls() {
  const targets = getMissionTargets();
  if (activeTargetSelect) {
    const previousValue = activeTargetSelect.value;
    activeTargetSelect.innerHTML = targets.map((target) => `<option value="${target.id}">${target.name}</option>`).join('');
    activeTargetSelect.value = targets.some((item) => item.id === previousValue) ? previousValue : getSelectedMissionTargetId();
    lastMissionTargetId = activeTargetSelect.value;
  }
  updateMissionTargetInputsFromState();
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
    const targetId = marker.targetId || getSelectedMissionTargetId();
    const mission = state.settings.mission ?? {};
    const targets = getMissionTargets().map((item) => (item.id === targetId ? { ...item, x: xValue, y: yValue } : item));
    state.settings.mission = { ...mission, targets, activeTargetId: targetId };
    syncMissionTargetControls();
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
    const targetId = marker.targetId || getSelectedMissionTargetId();
    const mission = state.settings.mission ?? {};
    const targets = getMissionTargets().map((item) => (item.id === targetId ? { ...item, x: '', y: '' } : item));
    state.settings.mission = { ...mission, targets };
    syncMissionTargetControls();
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
      const target = getMissionTargets().find((item) => item.id === (marker.targetId || ''));
      const point = target
        ? readXYFromInputs({ value: target.x }, { value: target.y })
        : readXYFromInputs(document.querySelector('#target-x'), document.querySelector('#target-y'));
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
    if (marker.type === 'target') return validTargetTargets.has(marker.targetId || getSelectedMissionTargetId());
    if (marker.type === 'observer') return validObserverTargets.has(marker.targetId);
    if (marker.type === 'battery') return false;
    return true;
  });

  if (filtered.length === source.length) return;
  const removed = source.filter((marker) => !filtered.some((entry) => entry.id === marker.id));
  if (selectedMapMarker?.type === 'manual' && !filtered.some((marker) => marker.id === selectedMapMarker.id)) selectedMapMarker = null;
  const shouldClearFirePattern = removed.some((marker) => marker.type === 'target');
  state.settings.mapTools = {
    ...tools,
    manualMarkers: filtered,
    activeFirePattern: shouldClearFirePattern ? null : tools.activeFirePattern,
  };
  persistLauncherSettings();
}

function shouldClearFirePatternByMarker(marker) {
  return Boolean(marker?.type === 'target');
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
      gunProfile: document.querySelector(`[data-battery-gun-profile="${batteryId}"]`)?.value ?? gunProfiles[0] ?? 'default',
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

  const selectedTargetId = getSelectedMissionTargetId();
  const targetXValue = document.querySelector('#target-x')?.value ?? '';
  const targetYValue = document.querySelector('#target-y')?.value ?? '';
  const targetHeightValue = document.querySelector('#target-height')?.value ?? '';
  const missionTargets = getMissionTargets().map((target) => ({
    ...target,
    active: true,
    x: target.id === selectedTargetId ? targetXValue : target.x,
    y: target.id === selectedTargetId ? targetYValue : target.y,
    height: target.id === selectedTargetId ? targetHeightValue : target.height,
  }));

  state.settings.mission = {
    name: document.querySelector('#mission-name')?.value ?? '',
    targetX: targetXValue,
    targetY: targetYValue,
    targetHeight: targetHeightValue,
    targets: missionTargets,
    activeTargetId: selectedTargetId,
    battery: missionBatterySelect?.value ?? '1',
    gun: missionGunSelect?.value ?? 'all',
    trajectoryType: trajectoryTypeSelect?.value ?? 'indirect',
    indirectArc: indirectArcSelect?.value ?? 'low',
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
    chargeModeByProfile: Array.from(document.querySelectorAll('[data-mission-charge-profile]')).reduce((acc, select) => {
      if (!select.dataset.missionChargeProfile) return acc;
      acc[select.dataset.missionChargeProfile] = select.value && select.value !== 'auto' ? 'manual' : 'auto';
      return acc;
    }, {}),
    chargeByProfile: Array.from(document.querySelectorAll('[data-mission-charge-profile]')).reduce((acc, select) => {
      if (!select.dataset.missionChargeProfile) return acc;
      acc[select.dataset.missionChargeProfile] = select.value || '';
      return acc;
    }, {}),
    observerTargeting: {
      distance: document.querySelector('#observer-target-distance')?.value ?? '',
      horizontalDistance: document.querySelector('#observer-target-horizontal-distance')?.value ?? '',
      verticalDistance: document.querySelector('#observer-target-vertical-distance')?.value ?? '',
      azimuth: document.querySelector('#observer-target-azimuth')?.value ?? '',
      angle: document.querySelector('#observer-target-angle')?.value ?? '',
    },
    missionFdc: migrateOldMissionToFdc(getFireMissionConfigFromUI()),
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
  batteryCountInput.value = String(state.settings.batteryCount);
  observerCountInput.value = String(state.settings.observerCount);
  renderGlobalConfig();
  renderGunsGrid();
  renderObservers();
  renderMissionSelectors();
  renderCounterBatterySection();
  syncFdcSettingsVisibility();
  hydrateMapToolsForm();
  syncMarkerTargetOptions();
  refreshMapOverlay();
}


function normalizeAzimuth(value) {
  return ((Number(value) % 360) + 360) % 360;
}

function getAzimuthDelta(fromAzimuth, toAzimuth) {
  return Math.abs(((toAzimuth - fromAzimuth + 540) % 360) - 180);
}

function renderCounterBatterySection() {
  counterBatteryModule.render();
}

function locateEnemyGun() {
  return counterBatteryModule.locateEnemyGun();
}

function calculateCounterBatteryResponse() {
  counterBatteryModule.calculateResponse();
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
  if (!window.confirm(t('clearAllDataConfirm'))) return;

  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem('calc.missions');

  state.settings = loadLauncherSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
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
    row.querySelector(`[data-battery-gun-profile="${b}"]`).value = saved.gunProfile ?? gunProfiles[0] ?? '';
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


async function getChargeOptionsForWeapon(weaponId) {
  if (!weaponId) return [];
  if (missionChargeOptionsCache.has(weaponId)) return missionChargeOptionsCache.get(weaponId);
  try {
    const weapon = await getWeapon(weaponId);
    const options = (weapon?.charges ?? []).map((charge) => String(charge?.id ?? '')).filter(Boolean);
    missionChargeOptionsCache.set(weaponId, options);
    return options;
  } catch {
    missionChargeOptionsCache.set(weaponId, []);
    return [];
  }
}

function getManualChargeForProfile(profileId) {
  const selected = document.querySelector(`[data-mission-charge-profile="${profileId}"]`)?.value || '';
  return selected && selected !== 'auto' ? selected : '';
}

async function hydrateMissionChargeSelectors() {
  const selectors = Array.from(document.querySelectorAll('[data-mission-charge-profile]'));
  await Promise.all(selectors.map(async (select) => {
    const profileId = select.dataset.missionChargeProfile;
    const projectile = document.querySelector(`[data-mission-projectile-profile="${profileId}"]`)?.value || '';
    const weaponId = `${profileId}/${projectile}`;
    const charges = await getChargeOptionsForWeapon(weaponId);
    const savedCharge = state.settings.mission?.chargeByProfile?.[profileId] ?? '';
    const savedMode = state.settings.mission?.chargeModeByProfile?.[profileId] ?? 'auto';
    select.innerHTML = charges.length
      ? `<option value="auto">${t('missionChargeModeAuto')}</option>${charges.map((chargeId) => `<option value="${chargeId}">${chargeId}</option>`).join('')}`
      : `<option value="">${t('missionChargeUnavailable')}</option>`;
    if (charges.length) {
      if (savedMode === 'manual' && charges.includes(savedCharge)) {
        select.value = savedCharge;
      } else if (charges.includes(savedCharge)) {
        select.value = savedCharge;
      } else {
        select.value = 'auto';
      }
    } else {
      select.value = '';
    }
    select.disabled = !charges.length;
  }));
}

function getProjectileForProfile(profileId, profile) {
  return document.querySelector(`[data-mission-projectile-profile="${profileId}"]`)?.value || parseProjectileOptions(profile)[0];
}

function getTrajectoryCapabilities(profile, projectile) {
  const defaults = { direct: false, low: false, high: false };
  const fromCatalog = profile?.trajectoryCapabilities?.[projectile];
  if (fromCatalog) return { ...defaults, ...fromCatalog };
  return defaults;
}

function getTrajectorySelectionContext() {
  const battery = Number(missionBatterySelect?.value || 1);
  const selectedGun = missionGunSelect?.value ?? 'all';
  const gunsPerBattery = getGunCountForBattery(battery);
  const gunIds = selectedGun === 'all' ? Array.from({ length: gunsPerBattery }, (_, idx) => idx + 1) : [Number(selectedGun)];
  const weapons = gunIds.map((gunId) => {
    const { profileId, profile } = getProfileForGun(battery, gunId);
    const projectile = getProjectileForProfile(profileId, profile);
    const capability = getTrajectoryCapabilities(profile, projectile);
    return { profileId, profile, projectile, capability };
  });

  const directSupported = weapons.some((weapon) => weapon.capability.direct);
  const lowSupported = weapons.some((weapon) => weapon.capability.low);
  const highSupported = weapons.some((weapon) => weapon.capability.high);
  const indirectSupported = lowSupported || highSupported;

  return { weapons, directSupported, lowSupported, highSupported, indirectSupported };
}

function syncTrajectoryControls() {
  if (!trajectoryTypeSelect || !indirectArcSelect) return;
  const context = getTrajectorySelectionContext();
  const directOption = trajectoryTypeSelect.querySelector('option[value="direct"]');
  const indirectOption = trajectoryTypeSelect.querySelector('option[value="indirect"]');
  if (directOption) directOption.disabled = !context.directSupported;
  if (indirectOption) indirectOption.disabled = !context.indirectSupported;

  if (trajectoryTypeSelect.value === 'direct' && !context.directSupported) {
    trajectoryTypeSelect.value = context.indirectSupported ? 'indirect' : 'direct';
  }
  if (trajectoryTypeSelect.value === 'indirect' && !context.indirectSupported) {
    trajectoryTypeSelect.value = context.directSupported ? 'direct' : 'indirect';
  }

  const lowOption = indirectArcSelect.querySelector('option[value="low"]');
  const highOption = indirectArcSelect.querySelector('option[value="high"]');
  if (lowOption) lowOption.disabled = !context.lowSupported;
  if (highOption) highOption.disabled = !context.highSupported;
  if (indirectArcSelect.value === 'high' && !context.highSupported) indirectArcSelect.value = context.lowSupported ? 'low' : 'high';
  if (indirectArcSelect.value === 'low' && !context.lowSupported) indirectArcSelect.value = context.highSupported ? 'high' : 'low';

  if (indirectArcSettings) {
    indirectArcSettings.classList.toggle('hidden', trajectoryTypeSelect.value !== 'indirect');
  }

  if (trajectorySupportHint) {
    let hint = '';
    if (trajectoryTypeSelect.value === 'direct' && !context.directSupported) {
      hint = t('trajectorySupportHintDirectUnsupported');
    } else if (trajectoryTypeSelect.value === 'indirect' && !context.indirectSupported) {
      hint = t('trajectorySupportHintIndirectUnsupported');
    } else if (trajectoryTypeSelect.value === 'indirect' && context.highSupported && !context.lowSupported) {
      hint = t('trajectorySupportHintArcHighOnly');
    } else if (trajectoryTypeSelect.value === 'indirect' && context.lowSupported && !context.highSupported) {
      hint = t('trajectorySupportHintArcLowOnly');
    }
    trajectorySupportHint.textContent = hint;
  }
}

function resolveArcRequest(capability, trajectoryType, indirectArc) {
  if (trajectoryType === 'direct') {
    if (capability.direct) return 'DIRECT';
    if (capability.low) return 'LOW';
    if (capability.high) return 'HIGH';
    return 'AUTO';
  }

  if (trajectoryType === 'indirect') {
    const preferred = indirectArc === 'high' ? 'high' : 'low';
    if (capability[preferred]) return preferred.toUpperCase();
    const fallback = preferred === 'high' ? 'low' : 'high';
    if (capability[fallback]) return fallback.toUpperCase();
    if (capability.direct) return 'DIRECT';
    return 'AUTO';
  }

  return 'AUTO';
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

  const savedProjectiles = state.settings.mission?.projectileByProfile ?? {};
  missionProjectileSelectors.innerHTML = '';
  usedProfiles.forEach((profileId) => {
    const profile = profiles[profileId] ?? { name: profileId };
    const options = parseProjectileOptions(profile);
    const row = document.createElement('div');
    row.className = 'pair';
    row.innerHTML = `<label>${profile.name ?? profileId}</label><select data-mission-projectile-profile="${profileId}">${options.map((option) => `<option value="${option}">${option}</option>`).join('')}</select><select data-mission-charge-profile="${profileId}" disabled><option value="">${t('missionChargeLoading')}</option></select>`;
    missionProjectileSelectors.append(row);
    const projectileSelect = row.querySelector(`[data-mission-projectile-profile="${profileId}"]`);
    if (projectileSelect) projectileSelect.value = options.includes(savedProjectiles[profileId]) ? savedProjectiles[profileId] : options[0];
  });
  syncTrajectoryControls();
  hydrateMissionChargeSelectors();
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
  const missionTargets = getMissionTargets();
  const selectedTargetId = MISSION_TARGET_IDS.includes(state.settings.mission.activeTargetId)
    ? state.settings.mission.activeTargetId
    : MISSION_TARGET_IDS[0];
  state.settings.mission = { ...(state.settings.mission ?? {}), targets: missionTargets, activeTargetId: selectedTargetId };
  syncMissionTargetControls();

  syncCorrectionObserverOptions();
  const correction = state.settings.mission.correction ?? {};
  const wind = state.settings.mission.wind ?? {};
  const correctionLrInput = document.querySelector('#correction-lr');
  const correctionAddDropInput = document.querySelector('#correction-add-drop');
  const windSpeedInput = document.querySelector('#wind-speed');
  const windDirectionInput = document.querySelector('#wind-direction');
  if (correctionLrInput) correctionLrInput.value = correction.lateralMeters ?? 0;
  if (correctionAddDropInput) correctionAddDropInput.value = correction.rangeMeters ?? 0;
  if (windSpeedInput) windSpeedInput.value = wind.speedMps ?? 0;
  if (windDirectionInput) windDirectionInput.value = wind.directionDeg ?? 0;
  updateAdjustmentHud();

  document.querySelector('#observer-target-distance').value = state.settings.mission.observerTargeting?.distance ?? '';
  document.querySelector('#observer-target-horizontal-distance').value = state.settings.mission.observerTargeting?.horizontalDistance ?? '';
  document.querySelector('#observer-target-vertical-distance').value = state.settings.mission.observerTargeting?.verticalDistance ?? '';
  document.querySelector('#observer-target-azimuth').value = state.settings.mission.observerTargeting?.azimuth ?? '';
  document.querySelector('#observer-target-angle').value = state.settings.mission.observerTargeting?.angle ?? '';

  if (trajectoryTypeSelect) trajectoryTypeSelect.value = state.settings.mission.trajectoryType ?? 'indirect';
  if (indirectArcSelect) indirectArcSelect.value = state.settings.mission.indirectArc ?? 'low';
  const missionFdc = migrateOldMissionToFdc(state.settings.mission?.missionFdc ?? state.settings.mission ?? {});
  if (fmTargetTypeSelect) fmTargetTypeSelect.value = missionFdc.targetType;
  if (fmSheafTypeSelect) fmSheafTypeSelect.value = missionFdc.sheafType;
  if (fmControlTypeSelect) fmControlTypeSelect.value = missionFdc.controlType;
  syncTrajectoryControls();
  syncFdcSettingsVisibility();
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

function getMissionWindSettings() {
  const missionWind = state.settings.mission?.wind ?? {};
  return {
    speedMps: Number(document.querySelector('#wind-speed')?.value ?? missionWind.speedMps ?? 0) || 0,
    directionDeg: Number(document.querySelector('#wind-direction')?.value ?? missionWind.directionDeg ?? 0) || 0,
    model: 'CONSTANT',
  };
}

function updateAdjustmentHud() {
  if (!adjustmentOffsetInfo || !windComponentsInfo) return;
  const offset = getAdjustmentOffset(adjustmentSession);
  adjustmentOffsetInfo.textContent = `ΔTarget: ΔX ${offset.dx.toFixed(1)} m | ΔY ${offset.dy.toFixed(1)} m`;
  const firstGun = getGunsForMissionEnv()[0]?.pos;
  const target = adjustmentSession?.currentTarget ?? readXYFromInputs(document.querySelector('#target-x'), document.querySelector('#target-y'));
  if (!firstGun || !target) {
    windComponentsInfo.textContent = 'Headwind: 0 m/s | Crosswind: 0 m/s | Drift correction: 0 m';
    return;
  }
  const bearingFire = Math.atan2(target.x - firstGun.x, target.y - firstGun.y) * 180 / Math.PI;
  const windComp = decomposeWind(getMissionWindSettings(), bearingFire);
  const lastTof = Number(adjustmentSession?.lastTofSec ?? 0);
  const drift = windComp.crosswindMps * (Number.isFinite(lastTof) ? lastTof : 0);
  windComponentsInfo.textContent = `Headwind: ${windComp.headwindMps.toFixed(2)} m/s | Crosswind: ${windComp.crosswindMps.toFixed(2)} m/s | Drift correction: ${drift.toFixed(1)} m`;
}

function applyAdjustmentStep(kind) {
  if (!adjustmentSession?.currentTarget || !adjustmentSession.origin) return;
  if (kind === 'ADD_50') adjustmentSession = adjustRange(adjustmentSession, adjustmentSession.origin, 50);
  if (kind === 'DROP_50') adjustmentSession = adjustRange(adjustmentSession, adjustmentSession.origin, -50);
  if (kind === 'RIGHT_25') adjustmentSession = adjustDirection(adjustmentSession, adjustmentSession.origin, 25);
  if (kind === 'LEFT_25') adjustmentSession = adjustDirection(adjustmentSession, adjustmentSession.origin, -25);
  if (activeAimPlan) {
    activeAimPlan = { ...activeAimPlan, runtime: { ...(activeAimPlan.runtime ?? {}), adjustment: adjustmentSession } };
  }
  updateAdjustmentHud();
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
  const wind = getMissionWindSettings();
  state.settings.mission = { ...(state.settings.mission ?? {}), correction, wind };
  persistLauncherSettings();
  fireOutput.textContent = t('correctionApplied');
  updateAdjustmentHud();
}

function resetCorrectionSettings() {
  const lrInput = document.querySelector('#correction-lr');
  const addDropInput = document.querySelector('#correction-add-drop');
  if (lrInput) lrInput.value = '0';
  if (addDropInput) addDropInput.value = '0';
  state.settings.mission = { ...(state.settings.mission ?? {}), correction: { observerId: correctionObserverSelect?.value || '1', lateralMeters: 0, rangeMeters: 0 } };
  if (adjustmentSession?.baseTarget) {
    adjustmentSession = createAdjustmentState(adjustmentSession.baseTarget, adjustmentSession.bracketSizeM);
    if (activeAimPlan) activeAimPlan = { ...activeAimPlan, runtime: { ...(activeAimPlan.runtime ?? {}), adjustment: adjustmentSession } };
  }
  persistLauncherSettings();
  fireOutput.textContent = t('correctionResetDone');
  updateAdjustmentHud();
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

  const distance = Number(document.querySelector('#observer-target-distance')?.value || Number.NaN);
  const horizontalDistanceInput = Number(document.querySelector('#observer-target-horizontal-distance')?.value || Number.NaN);
  const verticalDistanceInput = Number(document.querySelector('#observer-target-vertical-distance')?.value || Number.NaN);
  const azimuth = Number(document.querySelector('#observer-target-azimuth')?.value || Number.NaN);
  const angle = Number(document.querySelector('#observer-target-angle')?.value || Number.NaN);
  const observerHeight = parseHeightValue(document.querySelector(`[data-observer-height="${observerId}"]`)?.value);
  if (!Number.isFinite(observerHeight) || !Number.isFinite(azimuth)) {
    fireOutput.textContent = t('observerTargetingUnavailable');
    return;
  }

  const angleRadians = (angle * Math.PI) / 180;
  const hasHorizontalDistance = Number.isFinite(horizontalDistanceInput) && horizontalDistanceInput >= 0;
  const hasVerticalDistance = Number.isFinite(verticalDistanceInput);
  const hasSlantDistance = Number.isFinite(distance) && distance >= 0;
  const hasAngle = Number.isFinite(angle);

  const horizontal = hasHorizontalDistance
    ? horizontalDistanceInput
    : hasSlantDistance && hasAngle
      ? Math.abs(distance * Math.cos(angleRadians))
      : hasSlantDistance
        ? distance
        : Number.NaN;

  const targetHeightDelta = hasVerticalDistance
    ? verticalDistanceInput
    : hasHorizontalDistance && hasAngle
      ? horizontalDistanceInput * Math.tan(angleRadians)
      : hasSlantDistance && hasAngle
        ? distance * Math.sin(angleRadians)
        : 0;

  if (!Number.isFinite(horizontal) || !Number.isFinite(targetHeightDelta)) {
    fireOutput.textContent = t('observerTargetingUnavailable');
    return;
  }

  const targetX = observerPoint.x + Math.sin((azimuth * Math.PI) / 180) * horizontal;
  const targetY = observerPoint.y + Math.cos((azimuth * Math.PI) / 180) * horizontal;
  const targetHeight = clamp(Math.round(observerHeight + targetHeightDelta), HEIGHT_LIMITS.min, HEIGHT_LIMITS.max);

  const targetXInput = document.querySelector('#target-x');
  const targetYInput = document.querySelector('#target-y');
  const targetHeightInput = document.querySelector('#target-height');
  if (targetXInput) targetXInput.value = String(Math.round(targetX));
  if (targetYInput) targetYInput.value = String(Math.round(targetY));
  if (targetHeightInput) targetHeightInput.value = String(targetHeight);
  storeCurrentMissionTargetInputs(getSelectedMissionTargetId());
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

function syncFdcSettingsVisibility() {
  const schema = getFdcUiSchema({
    targetType: fmTargetTypeSelect?.value,
    sheafType: fmSheafTypeSelect?.value,
    controlType: fmControlTypeSelect?.value,
  });
  fmConditionalFields.forEach((row) => {
    const field = row.dataset.fmField;
    if (!field) return;
    const visible = schema.visibleFields.has(field);
    row.classList.toggle('hidden', !visible);
    const input = row.querySelector('input, select');
    if (input) input.toggleAttribute('disabled', !visible);
  });
}

function toFiniteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function buildFireModeLabelKey(mode) {
  const map = {
    [FIRE_MODE_IDS.POINT]: 'fireModePoint',
    [FIRE_MODE_IDS.CONVERGED]: 'fireModeConverged',
    [FIRE_MODE_IDS.PARALLEL_SHEAF]: 'fireModeParallelSheaf',
    [FIRE_MODE_IDS.OPEN_SHEAF]: 'fireModeOpenSheaf',
    [FIRE_MODE_IDS.CIRCULAR_AREA]: 'fireModeCircularArea',
    [FIRE_MODE_IDS.LINEAR]: 'fireModeLinear',
    [FIRE_MODE_IDS.RECT_AREA]: 'fireModeRectArea',
  };
  return map[mode] ?? 'fireModePoint';
}

function buildActiveFirePattern({ mode, centerPoint, aimPoints }) {
  const points = (aimPoints ?? []).filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!points.length) return null;
  if (mode === FIRE_MODE_IDS.LINEAR && points.length > 1) {
    return { mode, geometry: { type: 'line', start: points[0], end: points[points.length - 1], points } };
  }
  if (mode === FIRE_MODE_IDS.CIRCULAR_AREA) {
    const safeCenter = (centerPoint && Number.isFinite(centerPoint.x) && Number.isFinite(centerPoint.y)) ? centerPoint : points[0];
    const ringPoints = points.slice(1);
    const firstRingPoint = ringPoints[0] ?? points[0];
    const radius = firstRingPoint ? Math.hypot(firstRingPoint.x - safeCenter.x, firstRingPoint.y - safeCenter.y) : 0;
    return { mode, geometry: { type: 'ring', center: safeCenter, radius, points: ringPoints } };
  }
  if (mode === FIRE_MODE_IDS.RECT_AREA) {
    return { mode, geometry: { type: 'point-cloud', points } };
  }
  if (mode === FIRE_MODE_IDS.PARALLEL_SHEAF || mode === FIRE_MODE_IDS.OPEN_SHEAF) {
    return { mode, geometry: { type: 'point-cloud', points } };
  }
  return { mode, geometry: { type: 'point-cloud', points } };
}

function deriveFireModeFromFdcConfig(config = {}) {
  if (config.targetType === 'LINE') return FIRE_MODE_IDS.LINEAR;
  if (config.targetType === 'RECTANGLE') return FIRE_MODE_IDS.RECT_AREA;
  if (config.targetType === 'CIRCLE') return FIRE_MODE_IDS.CIRCULAR_AREA;
  if (config.sheafType === 'PARALLEL') return FIRE_MODE_IDS.PARALLEL_SHEAF;
  if (config.sheafType === 'OPEN') return FIRE_MODE_IDS.OPEN_SHEAF;
  if (config.sheafType === 'CONVERGED') return FIRE_MODE_IDS.CONVERGED;
  return FIRE_MODE_IDS.POINT;
}

function updateActiveFirePatternOnMap(plan, config) {
  const tools = getMapToolsSettings();
  const mode = deriveFireModeFromFdcConfig(config);
  const centerPoint = config?.geometry?.center ?? config?.geometry?.point ?? plan?.aimPoints?.[0] ?? null;
  const pattern = buildActiveFirePattern({ mode, centerPoint, aimPoints: plan?.aimPoints ?? [] });
  state.settings.mapTools = {
    ...tools,
    activeFirePattern: pattern,
  };
  persistLauncherSettings();
  refreshMapOverlay();
}

async function calculateFire() {
  try {
    buildFireMissionPlan();
    return await showNextFirePackage();
  } catch (error) {
    fireOutput.textContent = error?.message || 'Выберите режим огня и заполните параметры';
    return null;
  }
}

async function showMto() {
  const calc = await calculateFire();
  if (!calc) return;
  const mtoRows = calc.assignments.map((row) => `${t('gun')} ${row.gunId}: HE x3, Smoke x1`).join('\n');
  fireOutput.textContent = `${fireOutput.textContent}\n\n${t('mtoHeader')}\n${mtoRows}`;
}

async function saveMission() {
  const calc = await calculateFire();
  if (!calc) return;
  const missions = JSON.parse(localStorage.getItem('calc.missions') || '[]');
  missions.push({
    name: document.querySelector('#mission-name')?.value || `Mission-${missions.length + 1}`,
    createdAt: new Date().toISOString(),
    package: calc,
  });
  localStorage.setItem('calc.missions', JSON.stringify(missions));
  fireOutput.textContent = `${fireOutput.textContent}\n\n${t('missionSaved')} (${missions.length})`;
}



function getFireMissionConfigFromUI() {
  const defaultPoint = readXYFromInputs(document.querySelector('#target-x'), document.querySelector('#target-y'));
  const point = readXYFromInputs(document.querySelector('#fm-point-x'), document.querySelector('#fm-point-y')) ?? defaultPoint;
  const center = readXYFromInputs(document.querySelector('#fm-center-x'), document.querySelector('#fm-center-y')) ?? point;
  const lineStart = readXYFromInputs(document.querySelector('#fm-line-start-x'), document.querySelector('#fm-line-start-y'));
  const lineEnd = readXYFromInputs(document.querySelector('#fm-line-end-x'), document.querySelector('#fm-line-end-y'));
  const targetHeight = parseHeightValue(document.querySelector('#target-height')?.value);
  const battery = Number(missionBatterySelect.value || 1);
  const selectedGun = missionGunSelect.value;
  const gunCount = getGunCountForBattery(battery);
  const gunIds = selectedGun === 'all' ? Array.from({ length: gunCount }, (_, idx) => String(idx + 1)) : [String(selectedGun)];
  const toNum = (selector, fallback = 0) => {
    const value = Number(document.querySelector(selector)?.value);
    return Number.isFinite(value) ? value : fallback;
  };
  return {
    missionName: document.querySelector('#mission-name')?.value || 'Mission',
    targetType: fmTargetTypeSelect?.value || 'POINT',
    sheafType: fmSheafTypeSelect?.value || 'CONVERGED',
    controlType: fmControlTypeSelect?.value || 'SIMULTANEOUS',
    guns: selectedGun === 'all' ? 'ALL' : gunIds,
    roundsPerGun: 1,
    geometry: {
      point: point ? { ...point, z: targetHeight } : undefined,
      start: lineStart ? { ...lineStart, z: targetHeight } : undefined,
      end: lineEnd ? { ...lineEnd, z: targetHeight } : undefined,
      center: center ? { ...center, z: targetHeight } : undefined,
      spacingM: toNum('#fm-spacing', 40),
      bearingDeg: toNum('#fm-bearing', 0),
      lengthM: toNum('#fm-length', 200),
      widthM: toNum('#fm-width', 200),
      radiusM: toNum('#fm-radius', 100),
      aimpointCount: Math.max(3, Math.round(toNum('#fm-aimpoint-count', 8))),
    },
    sheaf: {
      sheafWidthM: toNum('#fm-sheaf-width', 180),
      openFactor: toNum('#fm-open-factor', 2),
    },
    sequence: { phaseIntervalSec: toNum('#fm-phase-interval', 0) },
    creeping: {
      stepM: toNum('#fm-step-m', 50),
      stepsCount: toNum('#fm-steps-count', 3),
      stepIntervalSec: toNum('#fm-step-interval', 10),
      bearingDeg: toNum('#fm-bearing', 0),
    },
    tot: { desiredImpactSec: toNum('#fm-tot-time', 0) },
    mrsi: {
      mrsiRounds: toNum('#fm-mrsi-rounds', 3),
      mrsiMinSepSec: toNum('#fm-mrsi-min-sep', 2),
      mrsiAllowedArcs: Array.from(document.querySelectorAll('[data-fm-mrsi-arc]:checked')).map((input) => input.value),
    },
  };
}

function syncFireMissionFieldVisibility() {
  syncFdcSettingsVisibility();
}

function getGunsForMissionEnv() {
  const battery = Number(missionBatterySelect.value || 1);
  const selectedGun = missionGunSelect.value;
  const gunCount = getGunCountForBattery(battery);
  const gunIds = selectedGun === 'all' ? Array.from({ length: gunCount }, (_, idx) => idx + 1) : [Number(selectedGun)];
  return gunIds.map((gunId) => {
    const gunPos = readXYFromInputs(
      document.querySelector(`[data-gun-x="${battery}-${gunId}"]`),
      document.querySelector(`[data-gun-y="${battery}-${gunId}"]`),
    );
    const batteryHeight = getBatteryHeight(battery);
    const { profileId, profile } = getProfileForGun(battery, gunId);
    const projectile = document.querySelector(`[data-mission-projectile-profile="${profileId}"]`)?.value || parseProjectileOptions(profile)[0];
    return {
      id: String(gunId),
      profileId,
      profileName: profile?.name ?? profileId,
      projectile,
      pos: { x: gunPos?.x ?? 0, y: gunPos?.y ?? 0, z: batteryHeight },
      weaponId: `${profileId}/${projectile}`,
    };
  });
}


async function buildChargeContextForMission(guns) {
  const byGun = {};
  for (const gun of guns) {
    const manualChargeId = getManualChargeForProfile(gun.profileId);
    const availableCharges = await getChargeOptionsForWeapon(gun.weaponId);
    const mode = manualChargeId ? 'manual' : 'auto';
    byGun[gun.id] = {
      mode,
      selectedChargeId: mode === 'manual' && manualChargeId ? manualChargeId : null,
      availableCharges,
      profileName: gun.profileName,
      projectile: gun.projectile,
    };
  }
  return byGun;
}

function buildManualChargeErrorRows(solutionsByGun, chargeContextByGun) {
  const lines = [];
  Object.entries(solutionsByGun).forEach(([gunId, rows]) => {
    const context = chargeContextByGun[gunId];
    if (!context || context.mode !== 'manual') return;
    const hasMissing = (rows ?? []).some((row) => !row?.solution || !Number.isFinite(row.solution?.elevMil));
    if (!hasMissing) return;
    const alternatives = context.availableCharges.filter((chargeId) => chargeId !== context.selectedChargeId);
    const altText = alternatives.length ? alternatives.join(', ') : '—';
    lines.push(`Gun ${gunId} (${context.profileName}, ${context.projectile}): выбран ${context.selectedChargeId || '—'}, доступно ${altText}`);
  });
  return lines;
}

function evaluateGunEngagementConstraints({ batteryId, gunId, point }) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return { allowed: false, inSector: false, inRange: false, targetAz: null, distance: null };
  }

  const gunPoint = readXYFromInputs(
    document.querySelector(`[data-gun-x="${batteryId}-${gunId}"]`),
    document.querySelector(`[data-gun-y="${batteryId}-${gunId}"]`),
  );
  if (!gunPoint) {
    return { allowed: false, inSector: false, inRange: false, targetAz: null, distance: null };
  }

  const { profile, heading } = getProfileForGun(batteryId, Number(gunId));
  const traverseDeg = Math.max(0, Number(profile?.traverseDeg) || 360);
  const minRange = Math.max(0, Number(profile?.minRange) || 0);
  const maxRange = Math.max(minRange, Number(profile?.maxRange) || 0);
  const dx = point.x - gunPoint.x;
  const dy = point.y - gunPoint.y;
  const targetAz = normalizeAzimuth((Math.atan2(dx, dy) * 180) / Math.PI);
  const distance = Math.hypot(dx, dy);
  const hasHeading = Number.isFinite(heading) && heading < 360;
  const sectorHalf = traverseDeg / 2;
  const inSector = !hasHeading || traverseDeg >= 360 || getAzimuthDelta(heading, targetAz) <= sectorHalf;
  const inRange = distance >= minRange && (maxRange <= 0 || distance <= maxRange);

  return {
    allowed: inSector && inRange,
    inSector,
    inRange,
    targetAz,
    distance,
  };
}

function buildFireMissionPlan() {
  const config = migrateOldMissionToFdc(getFireMissionConfigFromUI());
  const guns = getGunsForMissionEnv();
  activeAimPlan = buildAimPlanFromFdc(config, guns);
  updateActiveFirePatternOnMap(activeAimPlan, config);
  if (adjustmentSession) {
    const correction = getMissionCorrection();
    const anchorGun = Number(missionGunSelect?.value === 'all' ? 1 : missionGunSelect?.value || 1);
    const anchor = getObserverAnchorForMission(correction.observerId, Number(missionBatterySelect?.value || 1), anchorGun);
    if (anchor) {
      adjustmentSession.origin = anchor;
      adjustmentSession = adjustRange(adjustDirection(adjustmentSession, anchor, correction.lateralMeters), anchor, correction.rangeMeters);
    }
    activeAimPlan = { ...activeAimPlan, runtime: { ...(activeAimPlan.runtime ?? {}), adjustment: adjustmentSession } };
  }
  updateAdjustmentHud();
  fireOutput.textContent = `Миссия ${config.missionName} сформирована. Фаз: ${activeAimPlan.summary.totalPhases}. Нажмите «Следующий расчёт».`;
}

async function showNextFirePackage() {
  if (!activeAimPlan) {
    fireOutput.textContent = 'Сначала нажмите «Сформировать миссию».';
    return;
  }
  if (isPlanComplete(activeAimPlan)) {
    fireOutput.textContent = 'Миссия завершена.';
    return;
  }
  const guns = getGunsForMissionEnv();
  const chargeContextByGun = await buildChargeContextForMission(guns);
  const env = {
    gunPositions: Object.fromEntries(guns.map((g) => [g.id, g.pos])),
    weaponByGunId: Object.fromEntries(guns.map((g) => [g.id, g.weaponId])),
    preferredChargeByGunId: Object.fromEntries(
      Object.entries(chargeContextByGun)
        .filter(([, ctx]) => ctx?.mode === 'manual' && ctx.selectedChargeId)
        .map(([gunId, ctx]) => [gunId, ctx.selectedChargeId]),
    ),
    computeFireSolution,
    computeFireSolutionsMulti,
    wind: getMissionWindSettings(),
    arc: 'AUTO',
  };
  const pkg = await getNextFirePackage(activeAimPlan, env);
  if (!pkg) {
    fireOutput.textContent = 'Нет доступных фаз.';
    return;
  }
  const rows = pkg.assignments.flatMap((assignment) => assignment.commands.map((command, idx) => {
    const solvedRows = pkg.solutions.perGunSolutions[assignment.gunId] ?? [];
    const solvedRow = solvedRows[idx] ?? solvedRows.find((row) => row.commandRef === command);
    const point = solvedRow?.aimPoint ?? activeAimPlan.aimPoints[command.aimPointIndex];
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return `Gun ${assignment.gunId}: недоступна точка прицеливания (индекс ${command.aimPointIndex ?? 'n/a'})`;
    }

    const constraints = evaluateGunEngagementConstraints({
      batteryId: Number(missionBatterySelect?.value || 1),
      gunId: assignment.gunId,
      point,
    });
    if (!constraints.allowed) {
      const azPart = Number.isFinite(constraints.targetAz) ? ` Az=${constraints.targetAz.toFixed(2)}°` : '';
      const distPart = Number.isFinite(constraints.distance) ? ` D=${constraints.distance.toFixed(1)}m` : '';
      const reasons = [constraints.inSector ? null : 'вне сектора', constraints.inRange ? null : 'вне дальности']
        .filter(Boolean)
        .join(', ');
      return `Gun ${assignment.gunId}: недоступно (${reasons || 'ограничение орудия'})${azPart}${distPart}`;
    }

    const solution = solvedRow?.solution;
    if (!solution || !Number.isFinite(solution.azimuthDeg) || !Number.isFinite(solution.elevMil)) {
      return `Gun ${assignment.gunId}: недоступно (нет баллистического решения в таблицах)`;
    }
    const chargePart = solution?.chargeId ? ` Charge=${solution.chargeId}` : '';
    const base = `Gun ${assignment.gunId}: Aim X=${point.x.toFixed(1)} Y=${point.y.toFixed(1)} Az=${Number(solution?.azimuthDeg || 0).toFixed(2)} Elev=${Number(solution?.elevMil || 0).toFixed(1)} TOF=${Number(solution?.tofSec || 0).toFixed(2)}${chargePart}`;
    if (command.mrsiShotPlan?.length) {
      return `${base} | MRSI ${command.mrsiShotPlan.map((shot) => `#${shot.shotIndex} d=${shot.fireDelaySec.toFixed(1)}s ch=${shot.chargeId}`).join(', ')}`;
    }
    if (Number.isFinite(command.fireDelaySec)) {
      const phaseStart = Number(command.phaseStartDelaySec || 0);
      if (phaseStart > 0) return `${base} | Delay=${command.fireDelaySec.toFixed(2)}s (fire at +${(phaseStart + command.fireDelaySec).toFixed(2)}s)`;
      return `${base} | Delay=${command.fireDelaySec.toFixed(2)}s`;
    }
    return base;
  }));
  const manualChargeErrors = buildManualChargeErrorRows(pkg.solutions.perGunSolutions, chargeContextByGun);
  adjustmentSession = activeAimPlan.runtime?.adjustment ?? adjustmentSession;
  const firstShot = Object.values(pkg.solutions.perGunSolutions).flat()[0];
  if (firstShot?.solution) adjustmentSession = { ...(adjustmentSession ?? {}), lastTofSec: Number(firstShot.solution.tofSec || 0) };
  updateAdjustmentHud();
  const manualChargeHint = manualChargeErrors.length
    ? `\n\n${t('manualChargeErrorHeader')}\n${t('manualChargeErrorChooseAnother')}\n${manualChargeErrors.join('\n')}`
    : '';
  fireOutput.textContent = `Фаза ${pkg.phase.phaseIndex + 1}/${activeAimPlan.phases.length} (${pkg.phase.label})\n${rows.join('\n')}${manualChargeHint}`;
  activeAimPlan = advancePlanCursor(activeAimPlan);
  return pkg;
}

function resetFireMissionPlan() {
  activeAimPlan = null;
  adjustmentSession = null;
  state.settings.mapTools = {
    ...getMapToolsSettings(),
    activeFirePattern: null,
  };
  persistLauncherSettings();
  refreshMapOverlay();
  updateAdjustmentHud();
  fireOutput.textContent = 'Миссия сброшена.';
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
  if (type === 'target') return getMissionTargets().map((target) => ({ id: target.id, label: target.name }));
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
  const batteryDefault = state.settings.batteryConfig?.[String(batteryId)]?.gunProfile ?? gunProfiles[0] ?? 'default';
  const activeProfile = profiles[batteryDefault] ?? profiles[gunProfiles[0]] ?? Object.values(profiles)[0];
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
  const targetId = markerToolSelect?.value === 'target' ? (markerTargetSelect?.value || getSelectedMissionTargetId()) : (markerTargetSelect?.value || '');

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
      activeFirePattern: shouldClearFirePatternByMarker(markerToDelete) ? null : tools.activeFirePattern,
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
  if (type === 'target' && markerId) return getMissionTargetLabel(markerId);
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
  const hasPoint = (point) => point && Number.isFinite(point.x) && Number.isFinite(point.y);
  const toLatLng = (point) => (hasPoint(point) ? gamePointToLatLng(point.x, point.y) : null);
  const geometry = pattern.geometry;

  if (geometry.type === 'line') {
    const start = toLatLng(geometry.start);
    const end = toLatLng(geometry.end);
    if (start && end) overlays.push(window.L.polyline([start, end], { color, weight: 3 }).addTo(leafletMap));
  }
  if (geometry.type === 'parallel-lines' || geometry.type === 'converging-lines') {
    (geometry.lines ?? []).forEach((line) => {
      const start = toLatLng(line?.start);
      const end = toLatLng(line?.end);
      if (start && end) overlays.push(window.L.polyline([start, end], { color, weight: 2, dashArray: '6 6' }).addTo(leafletMap));
    });
  }
  if (geometry.type === 'rectangle') {
    const vertices = (geometry.vertices ?? []).map(toLatLng).filter(Boolean);
    if (vertices.length >= 3) overlays.push(window.L.polygon(vertices, { color, weight: 2, fillOpacity: 0.08 }).addTo(leafletMap));
  }
  if (geometry.type === 'ring') {
    const center = toLatLng(geometry.center);
    if (center) overlays.push(window.L.circle(center, { color, radius: geometry.radius, weight: 2, fillOpacity: 0.05 }).addTo(leafletMap));
  }
  if (geometry.type === 'point-cloud') {
    (geometry.points ?? []).forEach((point) => {
      const latLng = toLatLng(point);
      if (latLng) overlays.push(window.L.circleMarker(latLng, { color, radius: 4, weight: 1, fillOpacity: 0.7 }).addTo(leafletMap));
    });
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
      fillOpacity: 0.05,
      opacity: 0.1,
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

  const missionTargets = getMissionTargets();
  const activeTargets = missionTargets;
  const createTargetIcon = (selected) => window.L.divIcon({
    className: `target-cross-icon${selected ? ' selected' : ''}`,
    html: '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="22" class="outline"/><line x1="2" y1="12" x2="22" y2="12" class="outline"/><line x1="12" y1="2" x2="12" y2="22" class="main"/><line x1="2" y1="12" x2="22" y2="12" class="main"/></svg>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
  activeTargets.forEach((target) => {
    const point = readXYFromInputs({ value: target.x }, { value: target.y });
    if (!point) return;
    const isTargetSelected = isSelectedMarker('target', target.id);
    const marker = window.L.marker(gamePointToLatLng(point.x, point.y), {
      icon: createTargetIcon(isTargetSelected),
    }).addTo(leafletMap);
    marker.on('click', (event) => {
      window.L.DomEvent.stop(event);
      selectMapMarker({ id: target.id, type: 'target', targetId: target.id, x: point.x, y: point.y, azimuth: null, name: target.name });
    });
    addPersistentLabel(marker, target.name);
    gunMarkers.push(marker);
    legendRows.push(`<p><span class="legend-dot" style="--dot-color:${markerStyle.target}"></span>${target.name}: X=${point.x}, Y=${point.y}</p>`);
  });

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
    const patternRow = tools.activeFirePattern ? `<p><span class="legend-dot" style="--dot-color:${markerStyle.firePattern}"></span>${t('fireMode')}: ${t(buildFireModeLabelKey(tools.activeFirePattern.mode))}</p>` : '';
    mapLegend.innerHTML = [...legendRows, patternRow, ...markerLegendRows].filter(Boolean).join('');
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
      activeFirePattern: shouldClearFirePatternByMarker(markerToDelete) ? null : tools.activeFirePattern,
    };
  } else {
    clearMarkerCoordinatesAndAzimuth({ type: selectedMapMarker.type, targetId: selectedMapMarker.id });
    if (selectedMapMarker.type === 'target') {
      state.settings.mapTools = {
        ...tools,
        activeFirePattern: null,
      };
    }
  }
  selectedMapMarker = null;
  persistLauncherSettings();
  refreshMapOverlay();
}


function openMap() {
  switchTab('map');
  initializeMap();
  refreshMapOverlay();
  window.open(DEFAULT_EXTERNAL_MAP_URL, '_blank', 'noopener,noreferrer');
  safetyOutput.textContent = t('openedExternalMap');
}

async function openLogs() {
  try {
    const openResponse = await fetch('/api/logs/open', { method: 'POST' });
    if (!openResponse.ok) throw new Error('failed-open');

    const response = await fetch('/api/logs');
    if (!response.ok) throw new Error('failed-list');

    const payload = await response.json();
    const pathLine = payload.logsDirectory ? `${t('logsPath')}: ${payload.logsDirectory}` : '';

    if (!payload.files.length) {
      safetyOutput.textContent = [t('logsOpened'), pathLine, t('noLogsYet')].filter(Boolean).join('\n');
      return;
    }

    const lines = payload.files.map((file) => `${file.name} (${file.size} B)`);
    safetyOutput.textContent = [t('logsOpened'), pathLine, ...lines].filter(Boolean).join('\n');
  } catch {
    safetyOutput.textContent = t('logsOpenError');
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
document.querySelector('#calculate-btn')?.addEventListener('click', () => { calculateFire(); });
document.querySelector('#show-mto')?.addEventListener('click', () => { showMto(); });
document.querySelector('#save-mission')?.addEventListener('click', () => { saveMission(); });
document.querySelector('#build-fire-mission')?.addEventListener('click', () => { buildFireMissionPlan(); });
document.querySelector('#next-fire-package')?.addEventListener('click', () => { showNextFirePackage(); });
document.querySelector('#reset-fire-mission')?.addEventListener('click', () => { resetFireMissionPlan(); });
document.querySelector('#save-correction')?.addEventListener('click', saveCorrectionSettings);
document.querySelector('#reset-correction')?.addEventListener('click', resetCorrectionSettings);
document.querySelector('#apply-observer-targeting')?.addEventListener('click', applyObserverTargeting);
document.querySelector('#adj-add-50')?.addEventListener('click', () => applyAdjustmentStep('ADD_50'));
document.querySelector('#adj-drop-50')?.addEventListener('click', () => applyAdjustmentStep('DROP_50'));
document.querySelector('#adj-right-25')?.addEventListener('click', () => applyAdjustmentStep('RIGHT_25'));
document.querySelector('#adj-left-25')?.addEventListener('click', () => applyAdjustmentStep('LEFT_25'));
document.querySelector('#wind-speed')?.addEventListener('input', updateAdjustmentHud);
document.querySelector('#wind-direction')?.addEventListener('input', updateAdjustmentHud);
document.querySelector('#cb-add-point')?.addEventListener('click', counterBatteryModule.addObservationPoint);
document.querySelector('#cb-clear-points')?.addEventListener('click', counterBatteryModule.clearObservationPoints);
document.querySelector('#cb-locate-target')?.addEventListener('click', locateEnemyGun);
document.querySelector('#cb-calculate-response')?.addEventListener('click', calculateCounterBatteryResponse);
batteryCountInput?.addEventListener('change', () => {
  state.settings.batteryCount = normalizeCount(batteryCountInput?.value, LIMITS.batteries);
  if (batteryCountInput) batteryCountInput.value = String(state.settings.batteryCount);
  renderGlobalConfig();
  renderGunsGrid();
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
  if (!event.target.matches('[data-gun-heading]')) return;
  persistLauncherSettings();
  renderGunsGrid();
  refreshMapOverlay();
});

document.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLInputElement) || !event.target.matches('[data-battery-guns-count]')) return;
  event.target.value = String(getGunCountForBattery(event.target.dataset.batteryGunsCount));
  renderGunsGrid();
  renderObservers();
  renderMissionSelectors();
  renderCounterBatterySection();
  syncMarkerTargetOptions();
  syncMapMarkersWithAvailableTargets();
  persistLauncherSettings();
  refreshMapOverlay();
});
document.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLSelectElement) || !event.target.matches('[data-battery-gun-profile]')) return;
  renderMissionProjectileSelectors();
  renderCounterBatterySection();
  updateCorrectionAnchorHint();
  syncMarkerTargetOptions();
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

document.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLSelectElement) || !event.target.matches('[data-mission-projectile-profile]')) return;
  hydrateMissionChargeSelectors();
  syncTrajectoryControls();
  persistLauncherSettings();
});

document.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLSelectElement) || !event.target.matches('[data-mission-charge-profile]')) return;
  persistLauncherSettings();
});

activeTargetSelect?.addEventListener('change', () => {
  const previousTargetId = lastMissionTargetId;
  storeCurrentMissionTargetInputs(previousTargetId);
  state.settings.mission = { ...(state.settings.mission ?? {}), activeTargetId: getSelectedMissionTargetId() };
  lastMissionTargetId = getSelectedMissionTargetId();
  updateMissionTargetInputsFromState();
  syncMarkerTargetOptions();
  persistLauncherSettings();
  refreshMapOverlay();
});

correctionObserverSelect?.addEventListener('change', () => {
  updateCorrectionAnchorHint();
  persistLauncherSettings();
});

fmTargetTypeSelect?.addEventListener('change', () => {
  syncFdcSettingsVisibility();
  persistLauncherSettings();
});
fmSheafTypeSelect?.addEventListener('change', () => {
  syncFdcSettingsVisibility();
  persistLauncherSettings();
});
fmControlTypeSelect?.addEventListener('change', () => {
  syncFdcSettingsVisibility();
  persistLauncherSettings();
});
trajectoryTypeSelect?.addEventListener('change', () => {
  syncTrajectoryControls();
  persistLauncherSettings();
});

indirectArcSelect?.addEventListener('change', () => {
  syncTrajectoryControls();
  persistLauncherSettings();
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

async function initializeLauncher() {
  document.body.dataset.theme = state.theme;
  await loadArtilleryCatalog();
  applyI18n();
  enhanceTabTiles();
  updateCalibrationSummary();
  persistLauncherSettings();
  hydrateMapImageFromServer();
  runHealthCheck();
}

initializeLauncher();
