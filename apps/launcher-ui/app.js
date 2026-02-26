const state = {
  lang: localStorage.getItem('calc.lang') || 'ru',
  theme: localStorage.getItem('calc.theme') || 'terminal',
  mapUrl: localStorage.getItem('calc.mapUrl') || 'http://localhost:4173',
};

const i18n = {
  ru: {
    appVersion: 'Calc v1', appTitle: 'Баллистический калькулятор', appSubtitle: 'Единая оболочка для планирования огневых задач и оперативных данных.',
    tabHome: 'Главная', tabGlobal: 'Глобальные настройки', tabFire: 'Огневые задачи', tabSafety: 'Безопасность и данные', tabSettings: 'Настройки',
    homeConfiguration: 'Глобальные настройки', homeFire: 'Огневые задачи', homeMap: 'Карта и интеграции', openApi: 'Открыть API', editGlobalData: 'Настроить орудия, батареи и наблюдателей',
    openMissionPlanner: 'Открыть вкладку задач', checkServices: 'Проверить сервисы', openMap: 'Открыть карту', mapUrl: 'URL карты',
    sectionConfigTitle: 'Параметры батарей и орудий', batteryCount: 'Количество батарей', batteryHeightHint: 'Высота задаётся отдельно для каждой батареи и применяется ко всем орудиям этой батареи.',
    batteryHeight: 'Высота батареи (м)', gunsPerBattery: 'Орудий в батарее', coordinatesTitle: 'Координаты и наблюдатели', gunsHint: 'Для каждого орудия укажите координаты карты.',
    observerTitle: 'Наблюдатели и привязки', observerCount: 'Количество наблюдателей (до 10)', observerBinding: 'Привязка наблюдателя',
    bindToGun: 'К орудию', bindToBattery: 'К батарее', gunnerHint: 'Все расчёты выполняются на основе глобальных настроек.',
    actionsTitle: 'Действия', calculate: 'Рассчитать', showMto: 'Показать MTO', logMission: 'Сохранить миссию',
    missionTitle: 'Калькулятор огневой задачи', missionName: 'Название задачи', missionBattery: 'Батарея', missionGun: 'Орудие (или все в батарее)', targetX: 'Координата цели X', targetY: 'Координата цели Y',
    safeDataTitle: 'Контроль данных', safeDataDescription: 'Проверка журналов и экспорт служебных данных.', openLogs: 'Открыть логи', exportData: 'Экспорт данных', clearAllData: 'Очистить данные',
    serviceState: 'Состояние сервисов', generalSettings: 'Общие настройки', language: 'Язык', theme: 'Тема', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: запущен', ballisticsWarn: '⚠️ Ballistics Core: не отвечает. Проверьте Python и uvicorn.', gatewayOk: '✅ Realtime Gateway: запущен', gatewayWarn: '⚠️ Realtime Gateway: не отвечает.',
    dataCleared: 'Локальные данные очищены', battery: 'Батарея', gun: 'Орудие', observer: 'Наблюдатель', x: 'X', y: 'Y',
    allGuns: 'Все орудия батареи', gunProfile: 'Профиль орудия', projectileProfile: 'Профиль снаряда',
    calcDone: 'Расчёт выполнен', mtoHeader: 'MTO: расход по выбранным орудиям', missionSaved: 'Миссия сохранена', noMissions: 'Сохранённых миссий нет'
  },
  en: {
    appVersion: 'Calc v1', appTitle: 'Ballistics Calculator', appSubtitle: 'Unified shell for fire mission planning and operational data.',
    tabHome: 'Home', tabGlobal: 'Global settings', tabFire: 'Fire Missions', tabSafety: 'Safety & Data', tabSettings: 'Settings',
    homeConfiguration: 'Global settings', homeFire: 'Fire Missions', homeMap: 'Map & integrations', openApi: 'Open API', editGlobalData: 'Configure guns, batteries and observers',
    openMissionPlanner: 'Open missions tab', checkServices: 'Check services', openMap: 'Open map', mapUrl: 'Map URL',
    sectionConfigTitle: 'Battery and gun parameters', batteryCount: 'Battery count', batteryHeightHint: 'Each battery has an independent altitude applied to every gun in that battery.',
    batteryHeight: 'Battery altitude (m)', gunsPerBattery: 'Guns per battery', coordinatesTitle: 'Coordinates and observers', gunsHint: 'Set map coordinates for each gun.',
    observerTitle: 'Observers and bindings', observerCount: 'Observers count (up to 10)', observerBinding: 'Observer binding',
    bindToGun: 'To gun', bindToBattery: 'To battery', gunnerHint: 'All calculations use data from global settings.',
    actionsTitle: 'Actions', calculate: 'Calculate', showMto: 'Show MTO', logMission: 'Save mission',
    missionTitle: 'Fire mission calculator', missionName: 'Mission name', missionBattery: 'Battery', missionGun: 'Gun (or full battery)', targetX: 'Target X coordinate', targetY: 'Target Y coordinate',
    safeDataTitle: 'Data control', safeDataDescription: 'Check logs and export service data.', openLogs: 'Open logs', exportData: 'Export data', clearAllData: 'Clear data',
    serviceState: 'Service status', generalSettings: 'General settings', language: 'Language', theme: 'Theme', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: online', ballisticsWarn: '⚠️ Ballistics Core: unavailable. Check Python and uvicorn.', gatewayOk: '✅ Realtime Gateway: online', gatewayWarn: '⚠️ Realtime Gateway: unavailable.',
    dataCleared: 'Local data has been cleared', battery: 'Battery', gun: 'Gun', observer: 'Observer', x: 'X', y: 'Y',
    allGuns: 'All guns in battery', gunProfile: 'Gun profile', projectileProfile: 'Projectile profile',
    calcDone: 'Calculation complete', mtoHeader: 'MTO: ammo usage for selected guns', missionSaved: 'Mission saved', noMissions: 'No saved missions'
  },
};

const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = Array.from(document.querySelectorAll('.tab-panel'));
const healthBtn = document.querySelector('#health-check');
const clearDataBtn = document.querySelector('#clear-data');
const languageSelect = document.querySelector('#language');
const themeSelect = document.querySelector('#theme');
const batteryCountInput = document.querySelector('#battery-count');
const gunsPerBatteryInput = document.querySelector('#guns-per-battery');
const observerCountInput = document.querySelector('#observer-count');
const mapUrlInput = document.querySelector('#map-url');
const missionBatterySelect = document.querySelector('#mission-battery');
const missionGunSelect = document.querySelector('#mission-gun');
const fireOutput = document.querySelector('#fire-output');

const t = (key) => i18n[state.lang][key] ?? key;

const gunProfiles = ['mortar-120-standard', 'm777-howitzer', 'd30-standard'];
const projectileProfiles = ['he-charge-3', 'smoke-charge-2', 'illum'];

function applyI18n() {
  document.documentElement.lang = state.lang;
  document.title = state.lang === 'ru' ? 'Calc · Баллистический калькулятор' : 'Calc · Ballistics Calculator';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  languageSelect.value = state.lang;
  themeSelect.value = state.theme;
  mapUrlInput.value = state.mapUrl;
  renderGlobalConfig();
  renderGunsGrid();
  renderObservers();
  renderMissionSelectors();
}

function switchTab(tabName) {
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === tabName));
  panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === tabName));
}

async function checkService(url, okKey, warnKey, selector) {
  const targets = document.querySelectorAll(`[data-service="${selector}"]`);
  try {
    const response = await fetch(url, { method: 'GET' });
    if (response.ok || response.type === 'opaque') {
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
    row.innerHTML = `
      <h3>${t('battery')} ${b}</h3>
      <div class="pair pair-4">
        <input type="number" data-battery-height="${b}" placeholder="${t('batteryHeight')}" value="0" />
        <select data-battery-gun-profile="${b}">${gunProfileOptions}</select>
        <select data-battery-projectile-profile="${b}">${projectileOptions}</select>
        <input value="${t('battery')} ${b}" />
      </div>
      <p class="hint compact">${t('batteryHeight')} · ${t('gunProfile')} · ${t('projectileProfile')}</p>`;
    container.append(row);
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
      const row = document.createElement('div');
      row.className = 'pair';
      row.innerHTML = `<label>${t('battery')} ${b}, ${t('gun')} ${g}</label><input data-gun-x="${b}-${g}" type="number" placeholder="${t('x')}" value="${1000 + b * 100 + g * 10}" /><input data-gun-y="${b}-${g}" type="number" placeholder="${t('y')}" value="${1000 + b * 120 + g * 10}" />`;
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
    const row = document.createElement('div');
    const batteryOptions = Array.from({ length: batteries }, (_, n) => `<option value="battery-${n + 1}">${t('battery')} ${n + 1}</option>`).join('');
    const gunOptionMarkup = gunOptions.map((id) => `<option value="${id}">${id}</option>`).join('');
    row.className = 'observer-row';
    row.innerHTML = `<label>${t('observer')} ${i}: ${t('observerBinding')}</label><div class="pair"><select><option value="gun">${t('bindToGun')}</option><option value="battery">${t('bindToBattery')}</option></select><select>${gunOptionMarkup}</select><select>${batteryOptions}</select></div>`;
    container.append(row);
  }
}

function renderMissionSelectors() {
  const batteries = Number(batteryCountInput?.value || 1);
  const gunsPerBattery = Number(gunsPerBatteryInput?.value || 1);
  missionBatterySelect.innerHTML = Array.from({ length: batteries }, (_, index) => `<option value="${index + 1}">${t('battery')} ${index + 1}</option>`).join('');
  const battery = Number(missionBatterySelect.value || 1);
  const gunOptions = ['all', ...Array.from({ length: gunsPerBattery }, (_, idx) => `${idx + 1}`)];
  missionGunSelect.innerHTML = gunOptions.map((value) => `<option value="${value}">${value === 'all' ? t('allGuns') : `${t('gun')} ${value}`}</option>`).join('');
  missionBatterySelect.value = String(Math.min(Math.max(1, battery), batteries));
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

function openMap() {
  state.mapUrl = mapUrlInput.value || state.mapUrl;
  localStorage.setItem('calc.mapUrl', state.mapUrl);
  window.open(state.mapUrl, '_blank', 'noopener,noreferrer');
}

tabs.forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
document.querySelectorAll('[data-open-tab]').forEach((button) => button.addEventListener('click', () => switchTab(button.dataset.openTab)));
healthBtn?.addEventListener('click', runHealthCheck);
clearDataBtn?.addEventListener('click', clearLocalData);
document.querySelector('#open-map')?.addEventListener('click', openMap);
document.querySelector('#calculate-btn')?.addEventListener('click', calculateFire);
document.querySelector('#show-mto')?.addEventListener('click', showMto);
document.querySelector('#save-mission')?.addEventListener('click', saveMission);
[batteryCountInput, gunsPerBatteryInput].forEach((input) => input?.addEventListener('change', () => { renderGlobalConfig(); renderGunsGrid(); renderObservers(); renderMissionSelectors(); }));
observerCountInput?.addEventListener('change', renderObservers);
missionBatterySelect?.addEventListener('change', renderMissionSelectors);

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
runHealthCheck();
