import {v as e} from "./utils-BIWenCnY.js";
import {C as t,St as n,W as r,_t as i,b as a,d as o,f as s,h as c,i as l,in as u,jt as d,lt as f,p,q as m,ut as h,x as g} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {f as _} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as v} from "./preload-helper-BLdHbfdN.js";
import {n as y} from "./agent-BmSFI9WH.js";
import {b as x} from "./rich-html-link-VdBpR3Cm.js";
import {n as S} from "./proxy-create-mode-BCcLAAf5.js";
import {t as C} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {a as w,n as T,t as E} from "./tab-6bJNMvq4.js";
import {t as O} from "./single-proxies-C7CAMkyq.js";
import {t as k} from "./views-header-CcjwXPjG.js";
import {t as A} from "./useProxyModuleCreate-DnWsQ0mq.js";
import {t as j} from "./batch-proxies-wPSH-NmI.js";
var M = { class: "flex flex-col h-full w-full overflow-hidden" };
var N = { class: "proxies-tabs" };
var P = { class: "flex-ovh-1 w-full" };
var F = { class: "flex mx-auto h-full min-h-0" };
var I = C(t({ __name: "index", props: { mode: {} }, setup(t2) {
  let C2 = x(), { mixpanelTrack: I2 } = e(), { saveProxyModules: L } = A(), removedProxySales, [z] = y(), B = S(o(() => t2.mode ?? "proxy")), V = o(() => B.value.mode === "device"), H = n([{ title: $t("\u5355\u4E2A\u6DFB\u52A0"), value: "single" }, { title: $t("\u6279\u91CF\u6DFB\u52A0"), value: "batch" }]), U = n("single");
  async function W(e2) {
    await L(e2, { labels: B.value, onSuccess: async () => {
      if (globalThis.isCloudPhoneApp) {
        let { useProxyStore: e4 } = await v(async () => {
          let { useProxyStore: e5 } = await import("./proxy-BZs_g4bS.js");
          return { useProxyStore: e5 };
        }, []);
        await e4().fetchPickerList();
      }
      let e3 = B.value.successRouteName === "agent-list" ? { name: "list" } : void 0;
      C2.replace({ name: B.value.successRouteName, query: e3 });
    } });
  }
  async function G(e2) {
    await W([e2]);
  }
  function K(e2) {
    e2 === "batch" && I2("click_batch_add_proxy");
  }
  return (e2, n2) => {
    let o2 = k, v2 = E, y2 = T, b2 = w;
    return r(), c("div", M, [g(o2, { "show-back": "", divider: !1, title: d(B).pageTitle }, null, 8, ["title"]), s("div", N, [g(b2, { value: d(U), "onUpdate:value": [n2[0] ||= (e3) => i(U) ? U.value = e3 : null, K] }, { default: f(() => [g(y2, null, { default: f(() => [(r(!0), c(l, null, m(d(H), (e3) => (r(), p(v2, { key: e3.title, value: e3.value }, { default: f(() => [a(u(e3.title), 1)]), _: 2 }, 1032, ["value"]))), 128))]), _: 1 })]), _: 1 }, 8, ["value"])]), s("div", P, [s("div", F, [h(g(O, { mode: t2.mode ?? "proxy", "show-remark": "", "show-advertise": "", "on-confirm": G }, null, 8, ["mode"]), [[_, d(U) === "single"]])]), h(g(j, { "on-confirm": W }, null, 512), [[_, d(U) === "batch"]])])]);
  };
} }), [["__scopeId", "data-v-b30d5053"]]);
export {I as t};