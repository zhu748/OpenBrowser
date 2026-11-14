import {C as e,St as t,W as n,b as r,f as i,in as a,jt as o,lt as s,p as c,x as l} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as u} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as d} from "./rx-button-DyzuUt-V.js";
import {t as f} from "./rx-checkbox-BrC0MzoD.js";
import {t as p} from "./textarea-DvuriTzI.js";
import {t as m} from "./base-dialog-Bet1oNF8.js";
var h = { class: "open-sites" };
var g = { class: "footer" };
var _ = { class: "flex items-center gap-2" };
var v = { for: "ingredient1" };
var y = u(e({ __name: "open-sites", setup(e2) {
  let u2 = t({ urls: "", replaceCurrentTab: !1 });
  function y2() {
    globalThis.electronAPI.send("syncControl:closeOpenSitesDialog");
  }
  function b() {
    const urls = u2.value.urls.split(`
`).map((value) => value.trim()).filter(Boolean).map((value) => {
      try {
        return new URL(value).href;
      } catch {
        return "http://" + value;
      }
    });
    return globalThis.electronAPI.send("syncControl:openSites", { urls, replaceCurrentTab: u2.value.replaceCurrentTab }).catch((error) => globalThis.__localUiError(error.message));
  }
  return (e3, t2) => {
    let x = p, S = f, C = d;
    return n(), c(m, { header: e3.$t("\u6253\u5F00\u7F51\u5740"), onHide: y2 }, { default: s(() => [i("div", h, [l(x, { modelValue: o(u2).urls, "onUpdate:modelValue": t2[0] ||= (e4) => o(u2).urls = e4, rows: "8", placeholder: e3.$t(`\u8F93\u5165\u7F51\u5740\uFF0C\u591A\u4E2A\u7F51\u5740\u901A\u8FC7\u6362\u884C\u533A\u5206: 
https://www.amazon.com 
https://www.facebook.com`), class: "w-full" }, null, 8, ["modelValue", "placeholder"])]), i("div", g, [i("div", _, [l(S, { modelValue: o(u2).replaceCurrentTab, "onUpdate:modelValue": t2[1] ||= (e4) => o(u2).replaceCurrentTab = e4, "input-id": "ingredient1", binary: "", size: "small" }, null, 8, ["modelValue"]), i("label", v, a(e3.$t("\u7F51\u5740\u4ECE\u5F53\u524D\u6807\u7B7E\u9875\u5F00\u59CB\u6253\u5F00")), 1)]), l(C, { class: "apply-button", onClick: b }, { default: s(() => [r(a(e3.$t("\u6253\u5F00")), 1)]), _: 1 })])]), _: 1 }, 8, ["header"]);
  };
} }), [["__scopeId", "data-v-e8a70b10"]]);
export {y as default};