import {C as e,W as t,en as n,h as r,in as i,jt as a,m as o,p as s,ut as c} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as l} from "./basecomponent-ClhuVxJN.js";
import {t as u} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as d} from "./tooltip-BYYKWrvu.js";
var f = { key: 1, class: "select-none pointer-events-none rx-tag-label" };
var p = u(e({ __name: "rx-tag", props: { icon: {}, label: {}, disabled: { type: Boolean }, readonly: { type: Boolean }, tooltip: {} }, setup(e2) {
  return (u2, p2) => {
    let m = d;
    return c((t(), r("div", { class: n(["flex items-center rx-tag", { "icon-only": !e2.label, disabled: e2.disabled, readonly: e2.readonly }]) }, [e2.icon ? (t(), s(a(l), { key: 0, class: "pointer-events-none", name: e2.icon, size: 14 }, null, 8, ["name"])) : o("", !0), e2.label ? (t(), r("div", f, i(e2.label), 1)) : o("", !0)], 2)), [[m, e2.tooltip, void 0, { top: !0 }]]);
  };
} }), [["__scopeId", "data-v-11b4c1e2"]]);
export {p as t};