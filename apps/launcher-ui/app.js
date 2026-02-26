const state = {
  lang: localStorage.getItem('calc.lang') || 'ru',
  theme: localStorage.getItem('calc.theme') || 'terminal',
};

const i18n = {
  ru: {
    appVersion: 'Calc v1', appTitle: 'Баллистический калькулятор', appSubtitle: 'Единая оболочка для планирования огневых задач и оперативных данных.',
    tabHome: 'Главная', tabConfiguration: 'Конфигурация', tabFire: 'Огневые задачи', tabSafety: 'Безопасность и данные', tabSettings: 'Настройки',
    homeConfiguration: 'Конфигурация', homeFire: 'Огневые задачи', homeSafety: 'Безопасность и данные', openApi: 'Открыть API', editGlobalData: 'Редактировать общие данные',
    openMissionPlanner: 'Открыть планировщик', checkServices: 'Проверить сервисы', openSecurity: 'Открыть раздел', clearAllData: 'Очистить данные',
    sectionConfigTitle: 'Общие орудийные расчёты', batteryCount: 'Количество батарей', batteryHeight: 'Высота батарей для поправок (м)',
    gunsPerBattery: 'Орудий в батарее', coordinatesTitle: 'Координаты орудий', gunsHint: 'Для каждого орудия укажите координаты карты.',
    observerTitle: 'Наблюдатели и привязки', observerCount: 'Количество наблюдателей (до 10)', observerBinding: 'Привязка наблюдателя',
    bindToGun: 'К орудию', bindToBattery: 'К батарее', gunnerMode: 'Режим наводчика', gunnerModeGuns: 'Привязка к орудиям', gunnerModeBattery: 'Командир батареи',
    gunnerHint: 'Командир батареи получает в HUD решения огня по всем орудиям батареи.',
    actionsTitle: 'Действия', calculate: 'Рассчитать', showMto: 'Показать MTO', logMission: 'Сохранить миссию',
    safeDataTitle: 'Контроль данных', safeDataDescription: 'Проверка журналов и экспорт служебных данных.', openLogs: 'Открыть логи', exportData: 'Экспорт данных',
    serviceState: 'Состояние сервисов', generalSettings: 'Общие настройки', language: 'Язык', theme: 'Тема', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: запущен', ballisticsWarn: '⚠️ Ballistics Core: не отвечает. Проверьте Python и uvicorn.', gatewayOk: '✅ Realtime Gateway: запущен', gatewayWarn: '⚠️ Realtime Gateway: не отвечает.',
    dataCleared: 'Локальные данные очищены', battery: 'Батарея', gun: 'Орудие', observer: 'Наблюдатель', x: 'X', y: 'Y'
  },
  en: {
    appVersion: 'Calc v1', appTitle: 'Ballistics Calculator', appSubtitle: 'Unified shell for fire mission planning and operational data.',
    tabHome: 'Home', tabConfiguration: 'Configuration', tabFire: 'Fire Missions', tabSafety: 'Safety & Data', tabSettings: 'Settings',
    homeConfiguration: 'Configuration', homeFire: 'Fire Missions', homeSafety: 'Safety & Data', openApi: 'Open API', editGlobalData: 'Edit global data',
    openMissionPlanner: 'Open planner', checkServices: 'Check services', openSecurity: 'Open section', clearAllData: 'Clear data',
    sectionConfigTitle: 'Shared gun calculations', batteryCount: 'Battery count', batteryHeight: 'Battery altitude for corrections (m)',
    gunsPerBattery: 'Guns per battery', coordinatesTitle: 'Gun coordinates', gunsHint: 'Set map coordinates for each gun.',
    observerTitle: 'Observers and bindings', observerCount: 'Observers count (up to 10)', observerBinding: 'Observer binding',
    bindToGun: 'To gun', bindToBattery: 'To battery', gunnerMode: 'Gunner mode', gunnerModeGuns: 'Pinned to guns', gunnerModeBattery: 'Battery commander',
    gunnerHint: 'Battery commander receives fire solutions for all battery guns in HUD.',
    actionsTitle: 'Actions', calculate: 'Calculate', showMto: 'Show MTO', logMission: 'Log mission',
    safeDataTitle: 'Data control', safeDataDescription: 'Check logs and export service data.', openLogs: 'Open logs', exportData: 'Export data',
    serviceState: 'Service status', generalSettings: 'General settings', language: 'Language', theme: 'Theme', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: online', ballisticsWarn: '⚠️ Ballistics Core: unavailable. Check Python and uvicorn.', gatewayOk: '✅ Realtime Gateway: online', gatewayWarn: '⚠️ Realtime Gateway: unavailable.',
    dataCleared: 'Local data has been cleared', battery: 'Battery', gun: 'Gun', observer: 'Observer', x: 'X', y: 'Y'
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

const t = (key) => i18n[state.lang][key] ?? key;

function applyI18n() {
  document.documentElement.lang = state.lang;
  document.title = state.lang === 'ru' ? 'Calc · Баллистический калькулятор' : 'Calc · Ballistics Calculator';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  languageSelect.value = state.lang;
  themeSelect.value = state.theme;
  renderGunsGrid();
  renderObservers();
}

function switchTab(tabName) {
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === tabName));
  panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === tabName));
}

async function checkService(url, okKey, warnKey, selector) {
  const targets = document.querySelectorAll(`[data-service="${selector}"]`);
  try {
    const response = await fetch(url, { mode: 'no-cors' });
    if (response || response.type === 'opaque') {
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
  localStorage.removeItem('calc.lang');
  localStorage.removeItem('calc.theme');
  alert(t('dataCleared'));
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
      row.innerHTML = `<label>${t('battery')} ${b}, ${t('gun')} ${g}</label><input placeholder="${t('x')}" /><input placeholder="${t('y')}" />`;
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

tabs.forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
document.querySelectorAll('[data-open-tab]').forEach((button) => button.addEventListener('click', () => switchTab(button.dataset.openTab)));
healthBtn?.addEventListener('click', runHealthCheck);
clearDataBtn?.addEventListener('click', clearLocalData);
[batteryCountInput, gunsPerBatteryInput].forEach((input) => input?.addEventListener('change', () => { renderGunsGrid(); renderObservers(); }));
observerCountInput?.addEventListener('change', renderObservers);

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
