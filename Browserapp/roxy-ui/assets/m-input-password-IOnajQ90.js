import {C as e,P as t,W as n,g as r,jt as i,lt as a,m as o,p as s,tt as c,x as l} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as u} from "./basecomponent-ClhuVxJN.js";
import {t as d} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as f,t as p} from "./inputicon-Bn1KerIx.js";
import {t as m} from "./password-CRxCSpUp.js";
var h = d(e({ __name: "m-input-password", props: { size: { default: "sm" }, preIcon: {}, fluid: { type: Boolean, default: !0 }, fieldProps: {}, feedback: { type: Boolean, default: !1 }, toggleMask: { type: Boolean, default: !0 } }, emits: ["preIconClick"], setup(e2) {
  let d2 = r(e2, ["size", "preIcon", "fieldProps", "fluid", "toggleMask", "feedback"]), h2 = c();
  return (r2, c2) => {
    let g = p, _ = m, v = f;
    return n(), s(v, t({ class: ["w-full", e2.size] }, e2.fieldProps), { default: a(() => [e2.preIcon ? (n(), s(g, { key: 0 }, { default: a(() => [l(i(u), { class: "cursor-pointer", name: e2.preIcon, onClick: c2[0] ||= (e3) => r2.$emit("preIconClick") }, null, 8, ["name"])]), _: 1 })) : o("", !0), l(_, t({ fluid: e2.fluid, feedback: e2.feedback, "toggle-mask": e2.toggleMask }, { ...i(h2), ...d2 }), null, 16, ["fluid", "feedback", "toggle-mask"])]), _: 1 }, 16, ["class"]);
  };
} }), [["__scopeId", "data-v-61a53dc8"]]);
export {h as t};