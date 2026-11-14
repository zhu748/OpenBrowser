import "./rich-html-link-VdBpR3Cm.js";
import {n as localNotifications} from "./usetoast-DphSlejX.js";
import {n as localAppearance} from "./theme-mq6SsndU.js";
import "./local-api.js";
import "./rich-html-link-VdBpR3Cm.js";
import "./agent-channel.js";
import {i as locale,r as i18n} from "./locales-BfKu2SD4.js";
import {r as createApp} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {x as h,Y as resolve} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as prime} from "./primevue-3KC3oRok.js";
import {t as GlobalUi,r as globals} from "./global-component-Hns640q-.js";
import {d as router,f as installRouter} from "./hook-CnJE4hRq.js";
import {Ct as registerRouter} from "./utils-BIWenCnY.js";
async function startLocalUi() {
  globalThis.isElectron = !0, globalThis.$appVersion = (await globalThis.ops.getInfo()).appVersion, globalThis.$rendererAbiVersion = "4.1.0", globalThis.mixpanel = { track() {
  } }, await globalThis.__loadLocalDictionary();
  const settings = await globalThis.__localRequest("settings:get");
  globalThis.__localSettings = settings, await locale({ defaultLocale: settings.language || "zh-CN" });
  const app = createApp({ setup() {
    localAppearance();
    const notices = localNotifications();
    return globalThis.__localUiError = (message) => notices.add({ group: "tr", severity: "error", summary: String(message), life: 5e3 }), () => [h(resolve("RouterView")), h(GlobalUi)];
  } });
  app.use(i18n), prime(app), globals(app), await installRouter(app), app.config.errorHandler = (e) => {
    console.error(e), e.localUiNotified || globalThis.__localUiError?.(e.message || e), globalThis.__uiErrors ??= [], globalThis.__uiErrors.push(String(e));
  }, router.afterEach((to) => {
    document.documentElement.toggleAttribute("data-ob-synchronizer", to.path === "/synchronizer/active"), document.documentElement.toggleAttribute("data-ob-sync-screen", to.path.startsWith("/synchronizer"));
  }), registerRouter(router);
  const dialogParams = new URL(location.href).searchParams, dialogKind = dialogParams.get("dialog");
  if (dialogKind && !["preferences", "batch-inputs", "open-sites", "syncing-window-list"].includes(dialogKind)) throw Error("\u672A\u77E5\u672C\u5730\u5F39\u7A97");
  document.documentElement.toggleAttribute("data-ob-local-dialog", !!dialogKind), dialogKind && (await globalThis.__localRequest("ui:dialog:show"), await new Promise((resolve2, reject) => {
    const deadline = Date.now() + 1e4, painted = () => {
      if (innerWidth >= 200 && innerHeight >= 200) return resolve2();
      if (Date.now() > deadline) return reject(Error("\u5F39\u7A97\u5C1A\u672A\u5B8C\u6210\u5E03\u5C40"));
      requestAnimationFrame(painted);
    };
    painted();
  }));
  const initialPath = location.hash.slice(1) || "/browser/list";
  await router.replace(dialogKind ? { path: "/synchronizer/dialog/" + dialogKind, query: { tab: dialogParams.get("tab") || void 0 } } : router.resolve(initialPath).matched.length ? initialPath : "/browser/list"), app.mount("#app"), document.querySelector("#page-loading")?.remove(), globalThis.__router = router;
}
startLocalUi().catch((error) => {
  console.error(error), document.body.textContent = error.message;
});