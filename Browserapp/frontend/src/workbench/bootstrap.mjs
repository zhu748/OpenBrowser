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
  globalThis.$appVersion = (await globalThis.ops.getInfo()).appVersion;
  globalThis.$rendererAbiVersion = '4.1.0';
  globalThis.mixpanel = { track() {} };
  await globalThis.__loadLocalDictionary();

  const settings = await globalThis.__localRequest('settings:get');
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
  finishLoading();
  document.querySelector('#page-loading')?.remove();
  globalThis.__router = router;
}

// Document loading must finish before native requests can finish starting up.
startWorkbench().catch(error => {
  finishLoading();
  console.error(error);
  document.body.textContent = error.message;
});
