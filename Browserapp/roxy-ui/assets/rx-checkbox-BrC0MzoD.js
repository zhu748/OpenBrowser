import {C as e,E as t,J as n,W as r,en as i,g as a,jt as o,lt as s,m as c,nn as l,p as u,tt as d} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as f} from "./basecomponent-ClhuVxJN.js";
import {t as p} from "./checkbox-DozTKB5Z.js";
var m = e({ inheritAttrs: !1, __name: "index", props: { size: { default: "sm" }, iconClass: {} }, setup(e2) {
  let m2 = a(e2, ["size", "iconClass"]), h = d();
  return (a2, d2) => {
    let g = f, _ = p;
    return r(), u(_, l(t({ ...m2, ...o(h) })), { icon: s((o2) => [n(a2.$slots, "icon", l(t(o2)), () => [o2.checked ? (r(), u(g, { key: 0, class: i(e2.iconClass), name: "base/rx_ic_checkmark", color: "#ffffff" }, null, 8, ["class"])) : c("", !0)])]), _: 3 }, 16);
  };
} });
export {m as t};