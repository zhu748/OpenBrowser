import {wt as e} from "./utils-BIWenCnY.js";
import {C as t,J as n,W as r,Y as i,en as a,f as o,h as s,jt as c,m as l,p as u,x as d} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {b as f} from "./rich-html-link-VdBpR3Cm.js";
import {Z as p} from "./basecomponent-ClhuVxJN.js";
import {t as m} from "./_plugin-vue_export-helper-BDNMzG2s.js";
var h = { class: "flex items-center flex-1 gap-2.5" };
var g = m(t({ __name: "views-header", props: { title: {}, showBack: { type: Boolean }, divider: { type: Boolean, default: !0 } }, setup(t2) {
  let m2 = f(), { path: g2, query: _ } = e();
  function v() {
    console.log("onBack", g2, _), m2.back(), m2.replace({ path: g2, query: _ });
  }
  return (e2, f2) => {
    let m3 = i("i18n-t");
    return r(), s("div", { class: a(["flex views-header", { divider: t2.divider }]) }, [o("div", h, [t2.showBack ? (r(), u(c(p), { key: 0, class: "cursor-pointer", name: "base/rx_ic_chevron_left", size: 24, onClick: v })) : l("", !0), n(e2.$slots, "title", {}, () => [d(m3, { keypath: t2.title || e2.$route.meta.title, scope: "global" }, null, 8, ["keypath"])], !0), n(e2.$slots, "title-after", {}, void 0, !0)]), n(e2.$slots, "default", {}, void 0, !0)], 2);
  };
} }), [["__scopeId", "data-v-f2b7568e"]]);
export {g as t};