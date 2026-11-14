import {C as e,W as t,en as n,h as r,in as i,m as a,ut as o,x as s} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as c} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as l} from "./tooltip-BYYKWrvu.js";
import {t as u} from "./rx-button-DyzuUt-V.js";
var d = ["title"];
var f = c(e({ __name: "remark-cell", props: { remark: {}, extend: { type: Boolean } }, setup(e2) {
  return (c2, f2) => {
    let p = u, m = l;
    return t(), r("div", { class: n(["inline-flex items-center gap-1 shrink-0", { "note-light": e2.remark }]) }, [o(s(p, { class: "shrink-0", text: "", severity: "secondary", size: "xxs", icon: e2.remark ? "base/rx_ic_doc_fill" : "base/rx_ic_doc_add" }, null, 8, ["icon"]), [[m, { value: e2.remark, showDelay: 0 }, void 0, { top: !0 }]]), e2.extend ? (t(), r("div", { key: 0, title: e2.remark, class: "whitespace-pre-wrap note-content" }, i(e2.remark), 9, d)) : a("", !0)], 2);
  };
} }), [["__scopeId", "data-v-cb424919"]]);
export {f as t};