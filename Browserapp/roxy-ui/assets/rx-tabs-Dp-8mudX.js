import {C as e,E as t,F as n,J as r,P as i,W as a,Z as o,at as s,b as c,f as l,g as u,h as d,i as f,in as p,it as m,lt as h,m as g,nn as _,p as v,q as y,v as b,x} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as S} from "./basecomponent-ClhuVxJN.js";
import {t as C} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {a as w,i as T,n as E,r as D,t as O} from "./tab-6bJNMvq4.js";
var k = { class: "flex items-center justify-center gap-1.5" };
var A = ["src"];
var j = C(e({ __name: "index", props: { tabs: {}, onlyTabs: { type: Boolean, default: !1 }, headTabs: { type: Boolean, default: !1 } }, setup(e2, { expose: C2 }) {
  let j2 = u(e2, ["tabs", "onlyTabs", "headTabs"]), { tablist: M, tabpanels: N, ...P } = m(), F = s("list");
  return C2({ updateInkBar: () => {
    n(() => {
      F.value?.updateInkBar();
    });
  } }), (n2, s2) => {
    let u2 = S, m2 = O, C3 = E, M2 = D, N2 = T, F2 = w;
    return a(), v(F2, i({ class: { "head-tabs": e2.headTabs } }, j2), b({ default: h(() => [r(n2.$slots, "tablist", {}, () => [x(C3, { ref: "list", pt: { tablist: "px-6 py-0 gap-4" } }, { default: h(() => [(a(!0), d(f, null, y(e2.tabs, (e3) => (a(), v(m2, { key: e3.title, value: e3.value }, { default: h(() => [r(n2.$slots, "tab", { data: e3 }, () => [l("div", k, [e3.icon ? (a(), v(u2, { key: 0, name: e3.icon, size: 16 }, null, 8, ["name"])) : g("", !0), e3.image ? (a(), d("img", { key: 1, class: "w-4 object-contain", src: e3.image }, null, 8, A)) : g("", !0), l("span", null, p(e3.title), 1)])], !0)]), _: 2 }, 1032, ["value"]))), 128))]), _: 3 }, 512)], !0), e2.onlyTabs ? g("", !0) : r(n2.$slots, "tabpanels", {}, () => [x(N2, { class: "flex flex-1 !pa-0 overflow-hidden" }, { default: h(() => [(a(!0), d(f, null, y(e2.tabs, ({ slot: e3, render: t2, panelProps: s3, ...l2 }) => (a(), v(M2, i({ class: "flex flex-1 overflow-hidden", key: l2.title, value: l2.value }, { ref_for: !0 }, s3), { default: h(() => [r(n2.$slots, e3 || "content", { tab: l2 }, () => [t2 ? (a(), v(o(t2), { key: 0 })) : (a(), d(f, { key: 1 }, [c(p(l2.content), 1)], 64))], !0)]), _: 2 }, 1040, ["value"]))), 128))]), _: 3 })], !0, 0)]), _: 2 }, [y(P, (e3, i2) => ({ name: i2, fn: h((e4) => [r(n2.$slots, i2, _(t(e4)), void 0, !0)]) }))]), 1040, ["class"]);
  };
} }), [["__scopeId", "data-v-2a7ea933"]]);
export {j as t};