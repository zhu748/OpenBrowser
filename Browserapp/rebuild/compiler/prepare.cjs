const fs = require("fs"),
  path = require("path"),
  acorn = require("acorn"),
  walk = require("acorn-walk");
const src = path.join(require("./source.cjs").resolveBuildSource(), "web"),
  dst = path.resolve("work/rebuild/stage");
fs.cpSync(src, dst, { recursive: true });
function patch(name, vars = {}, funcs = {}) {
  const file = path.join(dst, "assets", name + ".js");
  let text = fs.readFileSync(file, "utf8"),
    ast = acorn.parse(text, { ecmaVersion: "latest", sourceType: "module" }),
    edits = [];
  walk.simple(ast, {
    VariableDeclarator(n) {
      if (n.id.type === "Identifier" && vars[n.id.name] !== undefined)
        edits.push([n.init.start, n.init.end, vars[n.id.name]]);
    },
    FunctionDeclaration(n) {
      if (funcs[n.id.name] !== undefined)
        edits.push([n.body.start, n.body.end, "{" + funcs[n.id.name] + "}"]);
    },
  });
  for (const [s, e, v] of edits.sort((a, b) => b[0] - a[0]))
    text = text.slice(0, s) + v + text.slice(e);
  fs.writeFileSync(file, text);
}
const localUser = `ve('user',()=>{const defaults={batchOpenLayout:'stack',ipChecker:'local'},userConfig=a({...defaults,...globalThis.__localSettings});globalThis.__applyLocalUserConfig=saved=>userConfig.value={...defaults,...saved};const userInfo=a({userId:'local',id:'local',userName:globalThis.__localSettings?.localUserName||'OpenBrowser',workspaceId:'local',workspaceType:0,onboardingTaskStatus:globalThis.__localSettings?.onboardingTaskStatus||{}});return {userInfo,fetchUserInfo:async()=>{const saved=await globalThis.__localRequest('settings:get');userInfo.value.userName=saved.localUserName||'OpenBrowser';userInfo.value.onboardingTaskStatus=saved.onboardingTaskStatus||{};},updateUserConfig:async p=>{await globalThis.__localApi.base.userSetUserConfigCreate(p);},token:a('local'),appVersion:a(globalThis.$appVersion),userConfig,getUserConfig:async()=>await globalThis.__localApi.base.userGetUserConfigList().then(r=>r.data),identityInfo:a({}),initUserInfo:async()=>{},setToken:()=>{},mixpanelTrack:()=>{},clearUserInfo:()=>{}}})`;
patch(
  "utils-BIWenCnY",
  {
    O$: "globalThis.__localApi",
    jQ: localUser,
    zY: `ve('workspace',()=>({currentWorkspace:a({id:'local',workspaceType:0,role:3,workspaceName:'OpenBrowser',workspaceDefault:1}),workspaceList:a([{id:'local',workspaceType:0,role:3,workspaceName:'OpenBrowser'}]),init:async()=>{},prepareWorkspace:async()=>{},enterWorkspace:async()=>{},setCurrentWorkspace:async()=>{},fetchWorkspaceList:async()=>[]}))`,
  },
  {
    hJ: "return {can:()=>true,cannot:()=>false,canAny:()=>true,canAll:()=>true,check:()=>true}",
    lp: "return;",
    cE: "return true;",
    st: "return !globalThis.isElectron || (!!e && Ue(globalThis.$rendererAbiVersion,e,'>='));",
  },
);
// Retain original route pages while replacing the account and network guards.
patch("hook-CnJE4hRq", {}, { cE: "return true;" });
// Pure render shell: keep actual product markup and original component CSS scope IDs.
patch(
  "layout-C916OUcf",
  {
    xi: "{render:()=>null}",
    Pi: "{render:()=>null}",
    fl: "{render:()=>null}",
    Pg: "{render:()=>null}",
  },
  { b_: "return;" },
);
// Replace startup: no login, cloud auto update, tracking, lock screen, or account initialization.
fs.writeFileSync(
  path.join(dst, "assets", "bootstrap.js"),
  `import './local-api.js';
import {i as locale,r as i18n} from './locales-BfKu2SD4.js';
import {r as createApp} from './runtime-dom.esm-bundler-_WxS4Zar.js';
import {x as h,Y as resolve} from './runtime-core.esm-bundler-CBj16o9G.js';
import {t as prime} from './primevue-3KC3oRok.js';
import {r as globals} from './global-component-Hns640q-.js';
import {d as router,f as installRouter} from './hook-CnJE4hRq.js';
import {a as pinia} from './utils-BIWenCnY.js';
globalThis.isElectron=true;globalThis.$appVersion=(await globalThis.ops.getInfo()).appVersion;globalThis.$rendererAbiVersion='4.1.0';globalThis.mixpanel={track(){}};
await globalThis.__loadLocalDictionary();
const settings=await globalThis.__localRequest('settings:get');globalThis.__localSettings=settings;await locale({defaultLocale:settings.language||'zh-CN'});
const app=createApp({render(){return h(resolve('RouterView'))}});app.use(i18n);prime(app);globals(app);await installRouter(app);app.config.errorHandler=(e)=>{console.error(e);globalThis.__uiErrors??=[];globalThis.__uiErrors.push(String(e))};
router.afterEach(to=>{document.documentElement.toggleAttribute('data-ob-synchronizer',to.path==='/synchronizer/active');document.documentElement.toggleAttribute('data-ob-sync-screen',to.path.startsWith('/synchronizer'));});
await router.replace('/browser/list');app.mount('#app');document.querySelector('#page-loading')?.remove();globalThis.__router=router;
`,
);
// Include source styles verbatim; safe CSS is pruned after runtime verification.
let html = fs
  .readFileSync(path.join(dst, "index.html"), "utf8")
  .replace(
    /<script type="module"[^>]*><\/script>/,
    '<script type="module" src="/assets/bootstrap.js"></script>',
  )
  .replace(/<link rel="modulepreload"[^>]*>/g, "");
html = html.replace(
  "</head>",
  fs
    .readdirSync(path.join(dst, "assets"))
    .filter((n) => n.endsWith(".css"))
    .map((n) => `<link rel="stylesheet" href="/assets/${n}">`)
    .join("\n") + "</head>",
);
fs.writeFileSync(path.join(dst, "index.html"), html);
