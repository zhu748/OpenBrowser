import {C as i,D as a,W as s,b as c,en as u,f as d,h as f,i as p,in as m,lt as g,p as v,q as y,ut as b,x} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as S} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {Z as T} from "./basecomponent-ClhuVxJN.js";
import {t as E} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as D} from "./tooltip-BYYKWrvu.js";
import {t as O} from "./rx-button-DyzuUt-V.js";
import {t as k} from "./rx-checkbox-BrC0MzoD.js";
import {i as M} from "./form-BQBA_XzO.js";
import {o as N} from "./useProxyFormDrawer-r-7UykRS.js";
var q = { class: "proxy-filter-drawer flex flex-col h-full min-w-120" };
var J = { class: "proxy-filter-drawer__body flex-1 overflow-y-auto" };
var Y = { class: "proxy-filter-drawer__group-label" };
var X = { key: 1, class: "proxy-filter-drawer__checkbox-group md" };
var Z = ["for"];
var Q = { class: "proxy-filter-drawer__checkbox-text" };
var $ = { class: "proxy-filter-drawer__footer flex items-center justify-between gap-3 shrink-0" };
var te = E(i({ __name: "drawer-content", props: { filter: {} }, emits: ["apply"], setup(e2, { emit: t2 }) {
  let n2 = t2;
  function r2(t3, n3) {
    e2.filter.updateDraftField(t3, n3);
  }
  function i2(t3, n3) {
    e2.filter.toggleDraftFieldOption(t3, n3.value);
  }
  return (t3, a2) => {
    let o2 = k, c2 = O;
    return s(), f("div", q, [d("div", J, [(s(!0), f(p, null, y(e2.filter.filterGroups, (t4) => (s(), f("div", { key: t4.key, class: "proxy-filter-drawer__group" }, [d("div", Y, m(t4.label), 1), t4.multiple ? (s(), f("div", X, [(s(!0), f(p, null, y(t4.options, (n3) => (s(), f("label", { key: `${t4.key}_${n3.value}`, for: `${t4.key}_${n3.value}`, class: u(["proxy-filter-drawer__checkbox-item", { "is-checked": e2.filter.isDraftOptionSelected(t4.key, n3.value) }]) }, [x(o2, { "icon-class": "font-500 !size-4", "input-id": `${t4.key}_${n3.value}`, name: t4.key, binary: "", "model-value": e2.filter.isDraftOptionSelected(t4.key, n3.value), "onUpdate:modelValue": (e3) => i2(t4.key, n3) }, null, 8, ["input-id", "name", "model-value", "onUpdate:modelValue"]), d("div", Q, m(n3.label), 1)], 10, Z))), 128))])) : (s(), v(M, { key: 0, "model-value": e2.filter.draft.value[t4.key], name: t4.key, size: "md", options: t4.options, "onUpdate:modelValue": (e3) => r2(t4.key, e3) }, null, 8, ["model-value", "name", "options", "onUpdate:modelValue"]))]))), 128))]), d("div", $, [x(c2, { size: "sm", variant: "outlined", severity: "secondary", label: t3.$t("\u91CD\u7F6E"), onClick: a2[0] ||= (t4) => e2.filter.resetDraft() }, null, 8, ["label"]), x(c2, { size: "sm", label: t3.$t("\u5E94\u7528\u7B5B\u9009"), onClick: a2[1] ||= (e3) => n2("apply") }, null, 8, ["label"])])]);
  };
} }), [["__scopeId", "data-v-7f70b4af"]]);
var ne = { class: "proxy-filter" };
var re = { key: 0 };
var ie = { class: "proxy-filter__summary" };
var ae = ["aria-label"];
var oe = E(i({ __name: "index", props: { title: { default: () => $t("\u7B5B\u9009\u4EE3\u7406 IP") }, filter: {} }, setup(e2) {
  let { showDrawer: t2, hideDrawer: n2 } = N();
  function r2() {
    e2.filter.openDrawer(), t2({ title: e2.title, dismissable: !1, slots: { container: () => a(te, { filter: e2.filter, onApply: () => {
      e2.filter.apply(), n2();
    } }) } });
  }
  function i2() {
    e2.filter.clearApplied(), n2();
  }
  return (t3, n3) => {
    let a2 = T, o2 = O, l2 = D;
    return s(), f("div", ne, [x(o2, { size: "xxs", variant: "outlined", severity: e2.filter.hasActiveFilters.value ? "primary" : "secondary", onClick: S(r2, ["stop"]) }, { default: g(() => [x(a2, { name: "base/rx_ic_filter", size: 14 }), e2.filter.activeFilterSummary.value ? (s(), f(p, { key: 1 }, [b((s(), f("span", ie, [c(m(e2.filter.activeFilterSummary.value), 1)])), [[l2, { value: e2.filter.activeFilterTooltip.value, class: "proxy-filter-summary-tooltip" }, void 0, { top: !0 }]]), b((s(), f("span", { class: "proxy-filter__clear", "aria-label": t3.$t("\u91CD\u7F6E"), onMousedown: n3[0] ||= S(() => {
    }, ["stop"]), onClick: S(i2, ["stop"]) }, [x(a2, { name: "base/rx_ic_delete", size: 12 })], 40, ae)), [[l2, t3.$t("\u91CD\u7F6E"), void 0, { top: !0 }]])], 64)) : (s(), f("span", re, m(t3.$t("\u7B5B\u9009")), 1))]), _: 1 }, 8, ["severity"])]);
  };
} }), [["__scopeId", "data-v-0f58a0cb"]]);
export {oe as t};