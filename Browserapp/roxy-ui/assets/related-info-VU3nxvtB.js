import {C as e,J as t,P as n,W as r,d as i,f as a,h as o,i as s,jt as c,m as l,p as u,q as d,ut as f} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as p} from "./tooltip-BYYKWrvu.js";
import {t as m} from "./rx-tag-BIY_xUFU.js";
var h = e({ inheritAttrs: !1, __name: "related-info", props: { list: {}, icon: {}, field: {}, showMax: { default: 1 }, disabled: { type: Boolean, default: !0 } }, setup(e2) {
  let h2 = i(() => e2.list.length > 0), g = i(() => {
    let t2 = e2.field ? e2.list.map((t3) => t3[e2.field]) : e2.list, n2 = t2.slice(0, e2.showMax), r2 = t2.slice(e2.showMax);
    return { showList: n2, count: r2.length, tooltip: r2.join(", ") };
  });
  return (i2, _) => {
    let v = m, y = p;
    return c(h2) ? (r(), o("div", n({ key: 0, class: "flex gap-2" }, i2.$attrs), [(r(!0), o(s, null, d(c(g).showList, (t2) => (r(), u(v, { key: t2, icon: e2.icon, label: t2, readonly: e2.disabled }, null, 8, ["icon", "label", "readonly"]))), 128)), c(g).count ? f((r(), u(v, { key: 0, label: `+${c(g).count}`, readonly: e2.disabled }, null, 8, ["label", "readonly"])), [[y, { value: c(g).tooltip, showDelay: 500 }, void 0, { top: !0 }]]) : l("", !0)], 16)) : t(i2.$slots, "empty", {}, () => [a("div", n({ class: "select-none" }, i2.$attrs), " -- ", 16)], void 0, 1);
  };
} });
export {h as t};