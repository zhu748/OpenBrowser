import {C as e,J as t,N as n,P as r,W as i,b as a,d as o,f as s,h as c,i as l,in as u,jt as d,lt as f,m as p,p as m,rt as h,x as g} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {s as _,t as v} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {Z as y} from "./basecomponent-ClhuVxJN.js";
import {t as b} from "./_plugin-vue_export-helper-BDNMzG2s.js";
var x = { class: "rx-alert-body" };
var S = { key: 0, class: "rx-alert__title" };
var C = { key: 1, class: "rx-alert__content" };
var w = b(e({ __name: "alert", props: n({ type: { default: "success" }, title: {}, content: {}, closable: { type: Boolean, default: !0 }, announcement: { type: Boolean, default: !1 }, breathing: { type: Boolean, default: !1 }, breathingDuration: { default: 2400 } }, { visible: { type: Boolean, default: !0 }, visibleModifiers: {} }), emits: n(["close"], ["update:visible"]), setup(e2, { emit: n2 }) {
  _((e3) => ({ v0360f984: d(D), v94fbd616: d(A), v407441ee: d(k), v50fe5c98: d(O) }));
  let b2 = n2, w2 = h(e2, "visible"), T = { success: ["var(--colors-icon-icon-success)", "status/rx_ic_check_fill"], error: ["var(--colors-icon-icon-error)", "base/rx_ic_delete_fill"], info: ["var(--colors-icon-icon-info)", "base/rx_ic_info_fill"], warn: ["var(--colors-icon-icon-warning)", "base/rx_ic_warn_fill"] }, E = o(() => {
    let [t2, n3, r2] = { success: ["var(--component-alert-announcement-text-success)", "var(--component-alert-announcement-border-success)", "var(--component-alert-bg-success)"], error: ["var(--component-alert-announcement-text-error)", "var(--component-alert-announcement-border-error)", "var(--component-alert-bg-error)"], info: ["var(--component-alert-announcement-text-info)", "var(--component-alert-announcement-border-info)", "var(--component-alert-bg-info)"], warn: ["var(--component-alert-announcement-text-warning)", "var(--component-alert-announcement-border-warning)", "var(--component-alert-bg-warn)"] }[e2.type];
    return { titleColor: e2.announcement ? t2 : "var(--colors-text-text-primary)", borderColor: e2.announcement ? n3 : r2, bgColor: r2 };
  }), D = o(() => e2.announcement ? "center" : "flex-start"), O = o(() => E.value.titleColor), k = o(() => E.value.borderColor), A = o(() => E.value.bgColor), j = o(() => {
    let [t2, n3] = T[e2.type];
    return { color: t2, name: n3 };
  }), M = o(() => {
    if (e2.breathing) return { "--rx-alert-breath-color": T[e2.type][0], "--rx-alert-breath-thickness": "1.5px", "--rx-alert-breath-glow": "14px", "--rx-alert-breath-duration": typeof e2.breathingDuration == "number" ? `${e2.breathingDuration}ms` : e2.breathingDuration };
  });
  function N() {
    w2.value = !1, b2("close");
  }
  return (n3, o2) => {
    let h2 = y;
    return i(), m(v, null, { default: f(() => [w2.value ? (i(), c("div", r({ key: 0, class: ["rx-alert", { "rx-alert--breathing": e2.breathing, "rx-alert--announcement": e2.announcement }], style: d(M) }, n3.$attrs), [t(n3.$slots, "tips-icon", {}, () => [g(h2, r({ class: "mt-0.25" }, d(j)), null, 16)], !0), s("div", x, [e2.title || n3.$slots.title ? (i(), c("div", S, [t(n3.$slots, "title", {}, () => [a(u(e2.title), 1)], !0)])) : p("", !0), e2.content || n3.$slots.content ? (i(), c("div", C, [t(n3.$slots, "content", {}, () => [a(u(e2.content), 1)], !0)])) : p("", !0)]), e2.closable ? (i(), c("div", { key: 0, class: "rx-alert-close", onClick: N }, [t(n3.$slots, "close-icon", {}, () => [g(h2, { name: "base/rx_ic_delete" })], !0)])) : p("", !0), e2.breathing ? (i(), c(l, { key: 1 }, [o2[0] ||= s("span", { class: "rx-alert__breath rx-alert__breath-ring", "aria-hidden": "true" }, null, -1), o2[1] ||= s("span", { class: "rx-alert__breath rx-alert__breath-glow", "aria-hidden": "true" }, null, -1)], 64)) : p("", !0)], 16)) : p("", !0)]), _: 3 });
  };
} }), [["__scopeId", "data-v-a84c3e94"]]);
export {w as t};