import {C as e,J as t,N as n,P as r,W as i,at as a,d as o,it as s,jt as c,lt as l,m as u,p as d,rt as f,tt as p,x as m} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as h} from "./basecomponent-ClhuVxJN.js";
import {t as g} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as _} from "./inputtext-Crzvb5jQ.js";
import {n as v,t as y} from "./inputicon-Bn1KerIx.js";
var b = g(e({ inheritAttrs: !1, __name: "AgentInput", props: n({ icon: {}, iconSize: { default: 14 }, preIcon: {}, preIconSize: { default: 16 } }, { modelValue: {}, modelModifiers: {} }), emits: ["update:modelValue"], setup(e2, { expose: n2 }) {
  let g2 = f(e2, "modelValue"), b2 = e2, x = p(), S = s(), C = a("input"), w = o(() => {
    let { icon: e3, iconSize: t2, preIcon: n3, preIconSize: r2, ...i2 } = b2;
    return i2;
  });
  return n2({ focus: () => C.value?.$el.focus(), blur: () => C.value?.$el.blur() }), (e3, n3) => {
    let a2 = h;
    return i(), d(c(v), { class: "agent-input" }, { default: l(() => [b2.preIcon || c(S).preIcon ? (i(), d(c(y), { key: 0, class: "agent-input__icon agent-input__icon--left" }, { default: l(() => [t(e3.$slots, "preIcon", {}, () => [m(a2, { name: b2.preIcon, size: b2.preIconSize }, null, 8, ["name", "size"])], !0)]), _: 3 })) : u("", !0), m(c(_), r({ ref: "input", modelValue: g2.value, "onUpdate:modelValue": n3[0] ||= (e4) => g2.value = e4 }, { ...c(x), ...c(w) }, { fluid: "" }), null, 16, ["modelValue"]), b2.icon || c(S).icon ? (i(), d(c(y), { key: 1, class: "agent-input__icon agent-input__icon--right" }, { default: l(() => [t(e3.$slots, "icon", {}, () => [m(a2, { name: b2.icon, size: b2.iconSize }, null, 8, ["name", "size"])], !0)]), _: 3 })) : u("", !0)]), _: 3 });
  };
} }), [["__scopeId", "data-v-44539316"]]);
export {b as t};