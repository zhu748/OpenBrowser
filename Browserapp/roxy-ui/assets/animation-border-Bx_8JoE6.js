import {C as e,J as t,W as n,d as r,en as i,h as a,jt as o,rn as s} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {s as c} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as l} from "./_plugin-vue_export-helper-BDNMzG2s.js";
var u = l(e({ __name: "animation-border", props: { borderWidth: { default: 2 }, borderRadius: { default: 6 }, deg: { default: 0 }, animation: { type: Boolean, default: !0 }, animationDuration: { default: 8 }, bgColor: { default: "transparent" }, gradient: { default: () => ["#12a3fc", "#ec51f7", "#ec51f7"] } }, setup(e2) {
  c((e3) => ({ c78525da: o(l2), v3b11d236: o(u2), v7a3cc546: e3.bgColor }));
  let l2 = CSS.px(e2.borderWidth).toString(), u2 = CSS.px(e2.borderRadius).toString(), d = r(() => ({ "--angle": `${e2.deg}deg`, "--animation-duration": `${e2.animationDuration}s`, "--gradient-stops": e2.gradient.join(", ") }));
  return (r2, c2) => (n(), a("div", { style: s(o(d)), class: i(["gradient", { animation: e2.animation }]) }, [t(r2.$slots, "default", {}, void 0, !0)], 6));
} }), [["__scopeId", "data-v-30b6698f"]]);
export {u as t};