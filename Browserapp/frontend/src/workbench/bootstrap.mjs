import { installWorkspaceNavigation } from './workbench-navigation.js';
import { nativeDialogTab } from './workbench-dialog-tabs.js';
import './rich-html-link-VdBpR3Cm.js';
import { n as useNotifications } from './usetoast-DphSlejX.js';
import { n as useAppearance } from './theme-mq6SsndU.js';
import './local-api.js';
import './agent-channel.js';
import { i as loadLocale, r as i18n } from './locales-BfKu2SD4.js';
import { r as createApp } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { x as h, St as ref, Y as resolveComponent } from './runtime-core.esm-bundler-CBj16o9G.js';
import { t as installPrimeVue } from './primevue-3KC3oRok.js';
import { t as GlobalUi, r as installGlobalComponents } from './global-component-Hns640q-.js';
import { d as router, f as installRouter } from './hook-CnJE4hRq.js';
import { Ct as registerRouter, ci as finishLoading } from './utils-BIWenCnY.js';
import { syncDialogKinds } from './routes.js';

const retryableSettingsReads = new Set(['EIO', 'EAGAIN', 'EBUSY', 'EMFILE', 'ENFILE']);
// Startup may fail before the saved locale or the i18n runtime can be loaded.
const startupMessages = {
  'zh-CN': ['工作台无法启动', '暂时无法读取已保存的设置。', '重试', '正在重试…', '请重新打开此窗口。'],
  en: ['Could not start the workbench', 'Could not read saved settings.', 'Retry', 'Trying again…', 'Close and reopen this window.'],
  ru: ['Не удалось запустить рабочую область', 'Не удалось прочитать сохранённые настройки.', 'Повторить', 'Повторная попытка…',
    'Закройте и снова откройте это окно.'],
};

function startupLanguage() {
  try {
    const cached = JSON.parse(localStorage.getItem('locale'))?.currentLocale;
    if (Object.hasOwn(startupMessages, cached)) return cached;
  } catch { /* A missing or invalid local cache must not block recovery. */ }
  const language = navigator.language.toLowerCase().split('-')[0];
  return language === 'en' || language === 'ru' ? language : 'zh-CN';
}

function showStartupProblem(retryable = false) {
  finishLoading();
  const language = startupLanguage();
  const [title, unreadable, retry, retrying, reopen] = startupMessages[language];
  const panel = document.createElement('section');
  panel.className = 'ob-startup-status';
  panel.lang = language;
  const heading = document.createElement('h1');
  heading.id = 'ob-startup-heading';
  heading.textContent = title;
  panel.setAttribute('aria-labelledby', heading.id);
  const status = document.createElement('p');
  status.id = 'ob-startup-detail';
  status.setAttribute('role', 'status');
  status.textContent = retryable ? unreadable : reopen;
  panel.append(heading, status);
  (document.querySelector('#app') ?? document.body).replaceChildren(panel);
  if (!retryable) {
    panel.tabIndex = -1;
    panel.focus();
    return;
  }
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = retry;
  button.setAttribute('aria-describedby', status.id);
  panel.append(button);
  return new Promise(resolve => {
    button.addEventListener('click', () => {
      button.disabled = true;
      status.textContent = retrying;
      resolve();
    }, { once: true });
    button.focus();
  });
}

async function readStartupSettings() {
  // Retry only this read and only on request; do not replay app initialization.
  for (;;) {
    try {
      return await globalThis.__localRequest('settings:get');
    } catch (error) {
      if (!retryableSettingsReads.has(error?.code)) throw error;
      console.error('[OpenBrowser] Workbench settings read failed:', error.code);
      await showStartupProblem(true);
    }
  }
}

function setupWorkbenchRoot() {
  useAppearance();
  const notifications = useNotifications();
  globalThis.__localUiError = message => notifications.add({
    group: 'tr', severity: 'error', summary: String(message), life: 5000,
  });
  return () => [h(resolveComponent('RouterView')), h(GlobalUi)];
}

function reportComponentError(error) {
  console.error(error);
  if (!error.localUiNotified) globalThis.__localUiError?.(error.message || error);
  (globalThis.__uiErrors ??= []).push(String(error));
}

function updateSyncScreen({ path }) {
  document.documentElement.toggleAttribute('data-ob-synchronizer', path === '/synchronizer/active');
  document.documentElement.toggleAttribute('data-ob-sync-screen', path.startsWith('/synchronizer'));
}

async function showNativeDialog(app) {
  const selection = ref({ tab: null });
  const unsubscribe = globalThis.rebuild.onEvent(({ channel, payload }) => {
    if (channel === 'dialog:tab') selection.value = { tab: payload };
  });
  window.addEventListener('pagehide', unsubscribe, { once: true });
  const pending = selection.value;
  const requestedTab = await globalThis.__localRequest('ui:dialog:requested-tab');
  if (selection.value === pending) selection.value = { tab: requestedTab };
  app.provide(nativeDialogTab, selection);
  await globalThis.__localRequest('ui:dialog:show');
  await new Promise((resolve, reject) => {
    const deadline = Date.now() + 10_000;
    function waitForLayout() {
      if (innerWidth >= 200 && innerHeight >= 200) resolve();
      else if (Date.now() > deadline) reject(new Error('弹窗尚未完成布局'));
      else requestAnimationFrame(waitForLayout);
    }
    waitForLayout();
  });
  return selection.value.tab;
}

async function startWorkbench() {
  globalThis.isElectron = true;
  const { appVersion, profileStartupFailures } = await globalThis.ops.getInfo();
  globalThis.$appVersion = appVersion;
  globalThis.$rendererAbiVersion = '4.1.0';
  globalThis.mixpanel = { track() {} };
  // Both calls depend on the same local store. Put the settings read and its
  // recovery before dictionary loading, locale setup and all mount side effects.
  const settings = await readStartupSettings();
  await globalThis.__loadLocalDictionary();
  globalThis.__localSettings = settings;
  await loadLocale({ defaultLocale: settings.language || 'zh-CN' });
  const app = createApp({ setup: setupWorkbenchRoot });
  app.use(i18n);
  installPrimeVue(app);
  installGlobalComponents(app);
  await installRouter(app);
  app.config.errorHandler = reportComponentError;
  router.afterEach(updateSyncScreen);
  registerRouter(router);

  const url = new URL(location.href);
  const kind = url.searchParams.get('dialog');
  if (kind && !syncDialogKinds.includes(kind)) throw new Error('未知本地弹窗');
  document.documentElement.toggleAttribute('data-ob-local-dialog', Boolean(kind));
  const dialogTab = kind ? await showNativeDialog(app) : null;

  const { initialPath, activate } = await installWorkspaceNavigation(router, {
    url: url.href,
    dialogKind: kind,
    request: (...args) => globalThis.__localRequest(...args),
    events: callback => globalThis.rebuild.onEvent(callback),
  });
  if (kind) {
    await router.replace({ path: '/synchronizer/dialog/' + kind, query: { tab: dialogTab || undefined } });
  } else {
    await router.replace(router.resolve(initialPath).matched.length ? initialPath : '/browser/list');
    if (!router.currentRoute.value.matched.length) await router.replace('/browser/list');
  }
  await activate();
  app.mount('#app');
  if (profileStartupFailures) {
    const language = startupLanguage();
    const messages = {
      'zh-CN': `${profileStartupFailures} 个环境无法读取，原始记录已保留。`,
      en: `${profileStartupFailures} profiles could not be loaded. The original records were preserved.`,
      ru: `Не удалось загрузить профили (${profileStartupFailures}). Исходные данные сохранены.`,
    };
    globalThis.__localUiError?.(messages[language]);
  }
  finishLoading();
  document.querySelector('#page-loading')?.remove();
  globalThis.__router = router;
}

// Document loading must finish before native requests can finish starting up.
startWorkbench().catch(() => {
  console.error('[OpenBrowser] Workbench initialization failed.');
  showStartupProblem();
});
