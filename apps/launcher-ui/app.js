const state = {
  lang: localStorage.getItem('calc.lang') || 'ru',
  theme: localStorage.getItem('calc.theme') || 'terminal',
};

const i18n = {
  ru: {
    appVersion: 'Calc v1',
    appTitle: 'Баллистический калькулятор',
    appSubtitle: 'Единая оболочка для планирования огневых задач и оперативных данных.',
    tabHome: 'Главная',
    tabConfiguration: 'Конфигурация',
    tabFire: 'Огневые задачи',
    tabSafety: 'Безопасность и данные',
    tabSettings: 'Настройки',
    homeConfiguration: 'Конфигурация',
    homeFire: 'Огневые задачи',
    homeSafety: 'Безопасность и данные',
    openApi: 'Открыть API',
    editGlobalData: 'Редактировать общие данные',
    openMissionPlanner: 'Открыть планировщик',
    checkServices: 'Проверить сервисы',
    openSecurity: 'Открыть раздел',
    clearAllData: 'Очистить данные',
    sectionConfigTitle: 'Секционная конфигурация',
    sectionCount: 'Количество секций',
    gunsCount: 'Количество орудий',
    coordinatesTitle: 'Координаты миномётов',
    observerTitle: 'Данные наблюдателя',
    distanceToTarget: 'Дистанция до цели (м)',
    directionToTarget: 'Направление на цель (градусы)',
    targetAltitude: 'Высота цели (м)',
    actionsTitle: 'Действия',
    calculate: 'Рассчитать',
    showMto: 'Показать MTO',
    logMission: 'Сохранить миссию',
    safeDataTitle: 'Контроль данных',
    safeDataDescription: 'Проверка журналов и экспорт служебных данных.',
    openLogs: 'Открыть логи',
    exportData: 'Экспорт данных',
    serviceState: 'Состояние сервисов',
    generalSettings: 'Общие настройки',
    language: 'Язык',
    theme: 'Тема',
    themeTerminal: 'Terminal Green',
    themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: запущен',
    ballisticsWarn: '⚠️ Ballistics Core: не отвечает. Проверьте Python и uvicorn.',
    gatewayOk: '✅ Realtime Gateway: запущен',
    gatewayWarn: '⚠️ Realtime Gateway: не отвечает.',
    dataCleared: 'Локальные данные очищены',
  },
  en: {
    appVersion: 'Calc v1',
    appTitle: 'Ballistics Calculator',
    appSubtitle: 'Unified shell for fire mission planning and operational data.',
    tabHome: 'Home',
    tabConfiguration: 'Configuration',
    tabFire: 'Fire Missions',
    tabSafety: 'Safety & Data',
    tabSettings: 'Settings',
    homeConfiguration: 'Configuration',
    homeFire: 'Fire Missions',
    homeSafety: 'Safety & Data',
    openApi: 'Open API',
    editGlobalData: 'Edit global data',
    openMissionPlanner: 'Open planner',
    checkServices: 'Check services',
    openSecurity: 'Open section',
    clearAllData: 'Clear data',
    sectionConfigTitle: 'Section configuration',
    sectionCount: 'Amount of sections',
    gunsCount: 'Amount of guns',
    coordinatesTitle: 'Mortar coordinates',
    observerTitle: 'Observer data',
    distanceToTarget: 'Distance to target (m)',
    directionToTarget: 'Direction to target (degrees)',
    targetAltitude: 'Target altitude (m)',
    actionsTitle: 'Actions',
    calculate: 'Calculate',
    showMto: 'Show MTO',
    logMission: 'Log mission',
    safeDataTitle: 'Data control',
    safeDataDescription: 'Check logs and export service data.',
    openLogs: 'Open logs',
    exportData: 'Export data',
    serviceState: 'Service status',
    generalSettings: 'General settings',
    language: 'Language',
    theme: 'Theme',
    themeTerminal: 'Terminal Green',
    themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: online',
    ballisticsWarn: '⚠️ Ballistics Core: unavailable. Check Python and uvicorn.',
    gatewayOk: '✅ Realtime Gateway: online',
    gatewayWarn: '⚠️ Realtime Gateway: unavailable.',
    dataCleared: 'Local data has been cleared',
  },
};

const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = Array.from(document.querySelectorAll('.tab-panel'));
const healthBtn = document.querySelector('#health-check');
const clearDataBtn = document.querySelector('#clear-data');
const languageSelect = document.querySelector('#language');
const themeSelect = document.querySelector('#theme');

function t(key) {
  return i18n[state.lang][key] ?? key;
}

function applyI18n() {
  document.documentElement.lang = state.lang;
  document.title = state.lang === 'ru' ? 'Calc · Баллистический калькулятор' : 'Calc · Ballistics Calculator';

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });

  languageSelect.value = state.lang;
  themeSelect.value = state.theme;
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
      targets.forEach((target) => {
        target.textContent = t(okKey);
        target.classList.remove('warn');
      });
      return;
    }
  } catch {
    // noop
  }

  targets.forEach((target) => {
    target.textContent = t(warnKey);
    target.classList.add('warn');
  });
}

async function runHealthCheck() {
  await Promise.all([
    checkService('http://localhost:8000/docs', 'ballisticsOk', 'ballisticsWarn', 'ballistics'),
    checkService('http://localhost:3001/health', 'gatewayOk', 'gatewayWarn', 'gateway'),
  ]);

  const ballisticsMain = document.querySelector('[data-service="ballistics"]')?.textContent || '';
  const gatewayMain = document.querySelector('[data-service="gateway"]')?.textContent || '';
  document.querySelector('[data-service="ballistics-copy"]').textContent = ballisticsMain;
  document.querySelector('[data-service="gateway-copy"]').textContent = gatewayMain;
}

function clearLocalData() {
  localStorage.removeItem('calc.lang');
  localStorage.removeItem('calc.theme');
  alert(t('dataCleared'));
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

document.querySelectorAll('[data-open-tab]').forEach((button) => {
  button.addEventListener('click', () => switchTab(button.dataset.openTab));
});

healthBtn?.addEventListener('click', runHealthCheck);
clearDataBtn?.addEventListener('click', clearLocalData);

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
