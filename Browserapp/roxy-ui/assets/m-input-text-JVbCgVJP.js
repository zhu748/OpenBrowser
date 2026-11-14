import {C as e,J as t,P as n,W as r,at as i,en as a,g as o,it as s,jt as c,lt as l,m as u,p as d,tt as f,x as p} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as m} from "./basecomponent-ClhuVxJN.js";
import {t as h} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as g} from "./inputtext-Crzvb5jQ.js";
import {n as _,t as v} from "./inputicon-Bn1KerIx.js";
var y = h(e({ inheritAttrs: !1, __name: "m-input-text", props: { size: { default: "sm" }, icon: {}, iconClass: {}, preIcon: {}, fluid: { type: Boolean, default: !0 }, fieldProps: {} }, emits: ["preIconClick", "iconClick"], setup(e2, { expose: h2 }) {
  let y2 = o(e2, ["size", "icon", "preIcon", "fieldProps", "fluid"]), b = f(), x = s(), S = i("input");
  return h2({ focus: () => {
    S.value?.$el.focus();
  }, blur: () => {
    S.value?.$el.blur();
  } }), (i2, o2) => {
    let s2 = m, f2 = v, h3 = g, S2 = _;
    return r(), d(S2, n({ class: ["w-full", e2.size] }, e2.fieldProps), { default: l(() => [e2.preIcon || c(x).preIcon ? (r(), d(f2, { key: 0 }, { default: l(() => [t(i2.$slots, "preIcon", {}, () => [p(s2, { name: e2.preIcon, onClick: o2[0] ||= (e3) => i2.$emit("preIconClick") }, null, 8, ["name"])], !0)]), _: 3 })) : u("", !0), p(h3, n({ ref: "input" }, { ...c(b), ...y2 }, { fluid: e2.fluid }), null, 16, ["fluid"]), e2.icon || c(x).icon ? (r(), d(f2, { key: 1 }, { default: l(() => [t(i2.$slots, "icon", {}, () => [p(s2, { class: a(["cursor-pointer", e2.iconClass]), name: e2.icon, onClick: o2[1] ||= (e3) => i2.$emit("iconClick") }, null, 8, ["class", "name"])], !0)]), _: 3 })) : u("", !0)]), _: 3 }, 16, ["class"]);
  };
} }), [["__scopeId", "data-v-49860b4c"]]);
export {y as t};