const CONFIG_STORAGE_KEY = 'calc.config.v2';

const state = {
  lang: localStorage.getItem('calc.lang') || 'ru',
  theme: localStorage.getItem('calc.theme') || 'terminal',
  config: loadConfig(),
};

const i18n = {
  ru: {
    appVersion: 'Calc v1', appTitle: 'Баллистический калькулятор', appSubtitle: 'Единая оболочка для планирования огневых задач и оперативных данных.',
    tabHome: 'Главная', tabConfiguration: 'Конфигурация', tabFire: 'Огневые задачи', tabSafety: 'Безопасность и данные', tabSettings: 'Настройки',
    homeConfiguration: 'Конфигурация', homeFire: 'Огневые задачи', homeSafety: 'Безопасность и данные', openApi: 'Открыть API', editGlobalData: 'Редактировать общие данные',
    openMissionPlanner: 'Открыть планировщик', checkServices: 'Проверить сервисы', openSecurity: 'Открыть раздел', clearAllData: 'Очистить данные',
    sectionConfigTitle: 'Конфигурация секций', batteryCount: 'Количество секций',
    gunsPerSection: 'Орудий в секции', sectionAltitude: 'Высота секции (м)', coordinatesTitle: 'Координаты орудий',
    gunsHint: 'Для каждого орудия укажите координаты карты.', observerTitle: 'Наблюдатели и привязки', observerCount: 'Количество наблюдателей (до 10)', observerBinding: 'Привязка наблюдателя',
    bindToGun: 'К орудию', bindToBattery: 'К секции', gunnerMode: 'Режим наводчика', gunnerModeGuns: 'Привязка к орудиям', gunnerModeBattery: 'Командир батареи',
    gunnerHint: 'Командир батареи получает в HUD решения огня по всем орудиям батареи.',
    actionsTitle: 'Действия', calculate: 'Рассчитать', showMto: 'Показать MTO', logMission: 'Сохранить миссию',
    safeDataTitle: 'Контроль данных', safeDataDescription: 'Проверка журналов и экспорт служебных данных.', openLogs: 'Открыть логи', exportData: 'Экспорт данных',
    serviceState: 'Состояние сервисов', generalSettings: 'Общие настройки', language: 'Язык', theme: 'Тема', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: запущен', ballisticsWarn: '⚠️ Ballistics Core: не отвечает. Проверьте Python и uvicorn.', gatewayOk: '✅ Realtime Gateway: запущен', gatewayWarn: '⚠️ Realtime Gateway: не отвечает.',
    dataCleared: 'Локальные данные очищены', battery: 'Секция', gun: 'Орудие', observer: 'Наблюдатель', x: 'X', y: 'Y',
    saveConfig: 'Сохранить', configSaved: 'Конфигурация сохранена', totalGuns: 'Всего орудий:', section: 'Секция'
  },
  en: {
    appVersion: 'Calc v1', appTitle: 'Ballistics Calculator', appSubtitle: 'Unified shell for fire mission planning and operational data.',
    tabHome: 'Home', tabConfiguration: 'Configuration', tabFire: 'Fire Missions', tabSafety: 'Safety & Data', tabSettings: 'Settings',
    homeConfiguration: 'Configuration', homeFire: 'Fire Missions', homeSafety: 'Safety & Data', openApi: 'Open API', editGlobalData: 'Edit global data',
    openMissionPlanner: 'Open planner', checkServices: 'Check services', openSecurity: 'Open section', clearAllData: 'Clear data',
    sectionConfigTitle: 'Section configuration', batteryCount: 'Number of sections',
    gunsPerSection: 'Guns in section', sectionAltitude: 'Section altitude (m)', coordinatesTitle: 'Gun coordinates',
    gunsHint: 'Set map coordinates for each gun.', observerTitle: 'Observers and bindings', observerCount: 'Observers count (up to 10)', observerBinding: 'Observer binding',
    bindToGun: 'To gun', bindToBattery: 'To section', gunnerMode: 'Gunner mode', gunnerModeGuns: 'Pinned to guns', gunnerModeBattery: 'Battery commander',
    gunnerHint: 'Battery commander receives fire solutions for all battery guns in HUD.',
    actionsTitle: 'Actions', calculate: 'Calculate', showMto: 'Show MTO', logMission: 'Log mission',
    safeDataTitle: 'Data control', safeDataDescription: 'Check logs and export service data.', openLogs: 'Open logs', exportData: 'Export data',
    serviceState: 'Service status', generalSettings: 'General settings', language: 'Language', theme: 'Theme', themeTerminal: 'Terminal Green', themeMidnight: 'Midnight Blue',
    ballisticsOk: '✅ Ballistics Core: online', ballisticsWarn: '⚠️ Ballistics Core: unavailable. Check Python and uvicorn.', gatewayOk: '✅ Realtime Gateway: online', gatewayWarn: '⚠️ Realtime Gateway: unavailable.',
    dataCleared: 'Local data has been cleared', battery: 'Section', gun: 'Gun', observer: 'Observer', x: 'X', y: 'Y',
    saveConfig: 'Save', configSaved: 'Configuration saved', totalGuns: 'Total guns:', section: 'Section'
  },
};

const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = Array.from(document.querySelectorAll('.tab-panel'));
const healthBtn = document.querySelector('#health-check');
const clearDataBtn = document.querySelector('#clear-data');
const languageSelect = document.querySelector('#language');
const themeSelect = document.querySelector('#theme');
const sectionCountSelect = document.querySelector('#battery-count');
const sectionConfigContainer = document.querySelector('#section-config');
const gunsCoordinatesContainer = document.querySelector('#guns-coordinates');
const totalGunsLabel = document.querySelector('#total-guns');
const observerCountInput = document.querySelector('#observer-count');
const saveConfigButton = document.querySelector('#save-config');

const t = (key) => i18n[state.lang][key] ?? key;

function createDefaultConfig() {
  return {
    sections: [
      { guns: 2, altitude: '', coordinates: [{ x: '', y: '' }, { x: '', y: '' }] },
      { guns: 2, altitude: '', coordinates: [{ x: '', y: '' }, { x: '', y: '' }] },
    ],
    observerCount: 2,
  };
}

function normalizeSection(section) {
  const guns = Math.min(6, Math.max(1, Number(section?.guns) || 1));
  const coordinates = Array.from({ length: guns }, (_, idx) => ({
    x: String(section?.coordinates?.[idx]?.x ?? ''),
    y: String(section?.coordinates?.[idx]?.y ?? ''),
  }));
  return { guns, altitude: String(section?.altitude ?? ''), coordinates };
}

function loadConfig() {
  const fallback = createDefaultConfig();
  try {
    const raw = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || 'null');
    if (!raw || !Array.isArray(raw.sections) || raw.sections.length === 0) return fallback;
    const sections = raw.sections.slice(0, 6).map(normalizeSection);
    return {
      sections,
      observerCount: Math.min(10, Math.max(1, Number(raw.observerCount) || fallback.observerCount)),
    };
  } catch {
    return fallback;
  }
}

function persistConfig() {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(state.config));
}

function getTotalGuns() {
  return state.config.sections.reduce((sum, section) => sum + section.guns, 0);
}

function applyI18n() {
  document.documentElement.lang = state.lang;
  document.title = state.lang === 'ru' ? 'Calc · Баллистический калькулятор' : 'Calc · Ballistics Calculator';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  languageSelect.value = state.lang;
  themeSelect.value = state.theme;
  observerCountInput.value = String(state.config.observerCount);
  renderSectionCount();
  renderSectionConfig();
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
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  state.lang = 'ru';
  state.theme = 'terminal';
  state.config = createDefaultConfig();
  document.body.dataset.theme = state.theme;
  applyI18n();
  alert(t('dataCleared'));
}

function renderSectionCount() {
  sectionCountSelect.innerHTML = '';
  for (let count = 1; count <= 6; count += 1) {
    const option = document.createElement('option');
    option.value = String(count);
    option.textContent = String(count);
    sectionCountSelect.append(option);
  }
  sectionCountSelect.value = String(state.config.sections.length);
}

function renderSectionConfig() {
  if (!sectionConfigContainer) return;
  sectionConfigContainer.innerHTML = '';

  state.config.sections.forEach((section, idx) => {
    const row = document.createElement('div');
    row.className = 'section-row';
    row.innerHTML = `
      <h3>${t('section')} ${idx + 1}</h3>
      <div class="pair">
        <label>${t('gunsPerSection')}</label>
        <input type="number" min="1" max="6" data-role="section-guns" data-section-index="${idx}" value="${section.guns}" />
      </div>
      <label>${t('sectionAltitude')}</label>
      <input type="number" data-role="section-altitude" data-section-index="${idx}" value="${section.altitude}" />
    `;
    sectionConfigContainer.append(row);
  });

  sectionConfigContainer.querySelectorAll('[data-role="section-guns"]').forEach((input) => {
    input.addEventListener('input', (event) => {
      const sectionIndex = Number(event.target.dataset.sectionIndex);
      const guns = Math.min(6, Math.max(1, Number(event.target.value) || 1));
      state.config.sections[sectionIndex].guns = guns;
      state.config.sections[sectionIndex].coordinates = Array.from({ length: guns }, (_, idx) => ({
        x: state.config.sections[sectionIndex].coordinates[idx]?.x ?? '',
        y: state.config.sections[sectionIndex].coordinates[idx]?.y ?? '',
      }));
      persistConfig();
      renderGunsGrid();
      renderObservers();
    });
  });

  sectionConfigContainer.querySelectorAll('[data-role="section-altitude"]').forEach((input) => {
    input.addEventListener('input', (event) => {
      const sectionIndex = Number(event.target.dataset.sectionIndex);
      state.config.sections[sectionIndex].altitude = event.target.value;
      persistConfig();
    });
  });
}

function renderGunsGrid() {
  if (!gunsCoordinatesContainer) return;
  gunsCoordinatesContainer.innerHTML = '';

  totalGunsLabel.textContent = `${t('totalGuns')} ${getTotalGuns()}`;
  totalGunsLabel.className = 'total-pill';

  state.config.sections.forEach((section, sectionIndex) => {
    const sectionBlock = document.createElement('div');
    sectionBlock.className = 'coordinates-section';
    sectionBlock.innerHTML = `<h3>${t('section')} ${sectionIndex + 1}</h3>`;

    for (let gunIndex = 0; gunIndex < section.guns; gunIndex += 1) {
      const row = document.createElement('div');
      row.className = 'pair';
      row.innerHTML = `
        <label>${t('gun')} ${gunIndex + 1}</label>
        <input data-role="gun-x" data-section-index="${sectionIndex}" data-gun-index="${gunIndex}" placeholder="${t('x')}" value="${section.coordinates[gunIndex]?.x ?? ''}" />
        <input data-role="gun-y" data-section-index="${sectionIndex}" data-gun-index="${gunIndex}" placeholder="${t('y')}" value="${section.coordinates[gunIndex]?.y ?? ''}" />
      `;
      sectionBlock.append(row);
    }

    gunsCoordinatesContainer.append(sectionBlock);
  });

  gunsCoordinatesContainer.querySelectorAll('[data-role="gun-x"], [data-role="gun-y"]').forEach((input) => {
    input.addEventListener('input', (event) => {
      const sectionIndex = Number(event.target.dataset.sectionIndex);
      const gunIndex = Number(event.target.dataset.gunIndex);
      const key = event.target.dataset.role === 'gun-x' ? 'x' : 'y';
      state.config.sections[sectionIndex].coordinates[gunIndex][key] = event.target.value;
      persistConfig();
    });
  });
}

function renderObservers() {
  const container = document.querySelector('#observer-bindings');
  if (!container) return;
  const observers = Number(observerCountInput?.value || state.config.observerCount || 1);

  const gunOptions = [];
  state.config.sections.forEach((section, sectionIndex) => {
    for (let gun = 1; gun <= section.guns; gun += 1) {
      gunOptions.push({ value: `gun-${sectionIndex + 1}-${gun}`, label: `${t('section')} ${sectionIndex + 1} • ${t('gun')} ${gun}` });
    }
  });

  container.innerHTML = '';
  for (let i = 1; i <= observers; i += 1) {
    const row = document.createElement('div');
    const batteryOptions = state.config.sections
      .map((_, index) => `<option value="section-${index + 1}">${t('section')} ${index + 1}</option>`)
      .join('');
    const gunOptionMarkup = gunOptions.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('');
    row.className = 'observer-row';
    row.innerHTML = `<label>${t('observer')} ${i}: ${t('observerBinding')}</label><div class="pair"><select><option value="gun">${t('bindToGun')}</option><option value="battery">${t('bindToBattery')}</option></select><select>${gunOptionMarkup}</select><select>${batteryOptions}</select></div>`;
    container.append(row);
  }
}

tabs.forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
document.querySelectorAll('[data-open-tab]').forEach((button) => button.addEventListener('click', () => switchTab(button.dataset.openTab)));
healthBtn?.addEventListener('click', runHealthCheck);
clearDataBtn?.addEventListener('click', clearLocalData);

sectionCountSelect?.addEventListener('change', (event) => {
  const nextCount = Math.min(6, Math.max(1, Number(event.target.value) || 1));
  state.config.sections = Array.from({ length: nextCount }, (_, idx) => normalizeSection(state.config.sections[idx]));
  persistConfig();
  renderSectionConfig();
  renderGunsGrid();
  renderObservers();
});

observerCountInput?.addEventListener('change', (event) => {
  state.config.observerCount = Math.min(10, Math.max(1, Number(event.target.value) || 1));
  observerCountInput.value = String(state.config.observerCount);
  persistConfig();
  renderObservers();
});

saveConfigButton?.addEventListener('click', () => {
  persistConfig();
  alert(t('configSaved'));
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
runHealthCheck();
