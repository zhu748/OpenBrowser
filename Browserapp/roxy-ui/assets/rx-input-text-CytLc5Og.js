import {C as e,J as t,P as n,W as r,en as i,g as a,it as o,jt as s,lt as c,m as l,p as u,x as d} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as f} from "./basecomponent-ClhuVxJN.js";
import {t as p} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as m} from "./inputtext-Crzvb5jQ.js";
import {n as h,t as g} from "./inputicon-Bn1KerIx.js";
var _ = p(e({ inheritAttrs: !1, __name: "rx-input-text", props: { size: { default: "sm" }, leftIcon: {}, icon: {}, iconFieldClass: {} }, emits: ["leftIconClick", "iconClick", "change"], setup(e2) {
  let p2 = a(e2, ["size", "leftIcon", "icon", "iconFieldClass"]), _2 = o();
  return (a2, o2) => {
    let v = g, y = m, b = h;
    return r(), u(b, { class: i(["w-full", e2.iconFieldClass]), pt: { root: e2.size } }, { default: c(() => [e2.leftIcon ? (r(), u(v, { key: 0 }, { default: c(() => [d(s(f), { name: e2.leftIcon, class: "cursor-pointer", onClick: o2[0] ||= (e3) => a2.$emit("leftIconClick") }, null, 8, ["name"])]), _: 1 })) : l("", !0), d(y, n({ ...a2.$attrs, ...p2 }, { fluid: "", onInput: o2[1] ||= (e3) => a2.$emit("change") }), null, 16), e2.icon || s(_2).icon ? (r(), u(v, { key: 1 }, { default: c(() => [t(a2.$slots, "icon", {}, () => [d(s(f), { name: e2.icon, class: "cursor-pointer", onClick: o2[2] ||= (e3) => a2.$emit("iconClick") }, null, 8, ["name"])], !0)]), _: 3 })) : l("", !0)]), _: 3 }, 8, ["class", "pt"]);
  };
} }), [["__scopeId", "data-v-123bcdfb"]]);
export {_ as t};