import {C as e,P as t,W as n,g as r,jt as i,lt as a,m as o,p as s,tt as c,x as l} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as u} from "./basecomponent-ClhuVxJN.js";
import {t as d} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as f,t as p} from "./inputicon-Bn1KerIx.js";
import {t as m} from "./textarea-DvuriTzI.js";
var h = d(e({ inheritAttrs: !1, __name: "m-input-textarea", props: { size: { default: "sm" }, rows: { default: 3 }, cols: { default: 30 }, fluid: { type: Boolean, default: !0 }, icon: {}, preIcon: {}, fieldProps: {} }, emits: ["preIconClick", "iconClick"], setup(e2) {
  let d2 = r(e2, ["size", "rows", "cols", "fluid", "icon", "preIcon", "fieldProps"]), h2 = c();
  return (r2, c2) => {
    let g = u, _ = p, v = m, y = f;
    return n(), s(y, t({ class: ["w-full", e2.size] }, e2.fieldProps), { default: a(() => [e2.preIcon ? (n(), s(_, { key: 0 }, { default: a(() => [l(g, { class: "cursor-pointer", name: e2.preIcon, onClick: c2[0] ||= (e3) => r2.$emit("preIconClick") }, null, 8, ["name"])]), _: 1 })) : o("", !0), l(v, t({ ...i(h2), ...d2 }, { fluid: e2.fluid, rows: e2.rows, cols: e2.cols }), null, 16, ["fluid", "rows", "cols"]), e2.icon ? (n(), s(_, { key: 1 }, { default: a(() => [l(g, { class: "cursor-pointer", name: e2.icon, onClick: c2[1] ||= (e3) => r2.$emit("iconClick") }, null, 8, ["name"])]), _: 1 })) : o("", !0)]), _: 1 }, 16, ["class"]);
  };
} }), [["__scopeId", "data-v-902bcf16"]]);
export {h as t};