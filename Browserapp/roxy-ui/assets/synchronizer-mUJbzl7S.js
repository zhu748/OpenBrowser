import {C as e,W as t,f as n,h as r,in as i,m as a,x as o} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as s} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as c} from "./rx-button-DyzuUt-V.js";
import {t as l} from "./window-list-C-MAmr_C.js";
var u = { class: "header" };
var d = { class: "title" };
var f = { class: "production-name" };
var p = { class: "sub-title" };
var m = { class: "actions" };
var h = s(e({ __name: "header", setup(e2) {
  function s2() {
    globalThis.electronAPI.send("syncControl:close");
  }
  return (e3, l2) => {
    let h2 = c;
    return t(), r("div", u, [n("div", d, [n("span", f, i(e3.$t("Roxy\u6D4F\u89C8\u5668")), 1), n("span", p, i(e3.$t("\u7A97\u53E3\u540C\u6B65")), 1)]), n("div", m, [a("", !0), a("", !0), a("", !0), o(h2, { class: "close no-drag", text: "", severity: "secondary", icon: "base/rx_ic_delete", size: "xxs", onClick: s2 })])]);
  };
} }), [["__scopeId", "data-v-ce4adc08"]]);
var g = { class: "synchronizer" };
var _ = s(e({ __name: "index", setup(e2) {
  return (e3, n2) => (t(), r("div", g, [o(h), o(l, { selectionMode: "multiple" })]));
} }), [["__scopeId", "data-v-d8a4773f"]]);
export {_ as default};