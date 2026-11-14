import {C as e,P as t,W as n,g as r,jt as i,lt as a,m as o,p as s,x as c} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as l} from "./basecomponent-ClhuVxJN.js";
import {t as u} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as d,t as f} from "./inputicon-Bn1KerIx.js";
import {t as p} from "./textarea-DvuriTzI.js";
var m = u(e({ inheritAttrs: !1, __name: "rx-input-textarea", props: { size: { default: "sm" }, leftIcon: {}, icon: {}, rows: { default: 3 }, cols: { default: 30 } }, emits: ["iconClick", "change"], setup(e2) {
  let u2 = r(e2, ["size", "rows", "cols", "leftIcon", "icon"]);
  return (r2, m2) => {
    let h = f, g = p, _ = d;
    return n(), s(_, { class: "w-full", pt: { root: e2.size } }, { default: a(() => [e2.leftIcon ? (n(), s(h, { key: 0 }, { default: a(() => [c(i(l), { name: e2.leftIcon, class: "cursor-pointer", onClick: m2[0] ||= (e3) => r2.$emit("iconClick") }, null, 8, ["name"])]), _: 1 })) : o("", !0), c(g, t({ class: "block" }, { ...r2.$attrs, ...u2 }, { fluid: "", rows: e2.rows, cols: e2.cols, onInput: m2[1] ||= (e3) => r2.$emit("change") }), null, 16, ["rows", "cols"]), e2.icon ? (n(), s(h, { key: 1 }, { default: a(() => [c(i(l), { name: e2.icon, class: "cursor-pointer", onClick: m2[2] ||= (e3) => r2.$emit("iconClick") }, null, 8, ["name"])]), _: 1 })) : o("", !0)]), _: 1 }, 8, ["pt"]);
  };
} }), [["__scopeId", "data-v-ea4d3990"]]);
export {m as t};