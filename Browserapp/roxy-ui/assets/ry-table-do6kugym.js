import {Cr as e,Sr as t,bt as n,cr as r,fr as i,jr as a,mt as o,o as s,xr as c,yr as ee} from "./utils-BIWenCnY.js";
import {C as l,E as te,Et as u,F as ne,J as d,L as re,N as f,Ot as ie,P as p,R as ae,St as m,V as oe,W as h,Y as g,Z as _,_t as v,at as se,b as ce,bt as y,d as b,en as x,f as S,h as C,i as w,in as T,it as le,jt as E,lt as D,m as O,nn as ue,p as k,q as A,rn as de,rt as fe,st as pe,tt as me,ut as j,v as he,w as ge,x as M} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {a as N,m as P,o as _e} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {y as ve} from "./dist-ufdnm93_.js";
import {y as ye} from "./rich-html-link-VdBpR3Cm.js";
import {Z as F} from "./basecomponent-ClhuVxJN.js";
import {t as I} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as be} from "./ripple-DKjDc6yC.js";
import {t as L} from "./tooltip-BYYKWrvu.js";
import {t as R} from "./rx-button-DyzuUt-V.js";
import {t as z} from "./rx-checkbox-BrC0MzoD.js";
import {n as xe,t as Se} from "./m-input-select-C8pih1gY.js";
import {n as B} from "./motion-BwnyBP9B.js";
import {t as Ce} from "./AnimatePresence-d-29l3Fb.js";
import {a as we,i as Te,n as V,o as Ee,r as H,t as U} from "./contextmenu-BBjizTDn.js";
import {t as W} from "./radiobutton-B3i1EP5M.js";
import {t as G} from "./usePreventMask-Cud6gNnu.js";
import {t as De} from "./paginator-vnwyVxKC.js";
import {t as Oe} from "./skeleton-CcmFVUhV.js";
import {t as ke} from "./divider-BXJIHZjP.js";
import {t as Ae} from "./rx-toggle-switch-BI8eb18U.js";
import {t as je} from "./multiselect-DS9bwX-7.js";
import {t as Me} from "./datepicker-Bd-h5Ks4.js";
const localTableRequests = /* @__PURE__ */ new WeakMap();
function Ne(e2) {
  return e2.reduce((e3, t2) => (t2.power === !1 || (t2.items && Array.isArray(t2.items) && (t2.items = Ne(t2.items)), e3.push(t2)), e3), []);
}
function Pe(e2, t2, n2) {
  return (e2.loadingOperationMap ||= {})[t2] = !0, n2(e2).then((n3) => (e2.loadingOperationMap[t2] = !1, n3));
}
function Fe(e2, t2, n2) {
  (e2.loadingOperationMap ||= {})[t2] = n2;
}
var Ie = { class: "flex items-center" };
var K = { class: "flex items-center gap-2 quick" };
var q = ["onClick"];
var Le = I(l({ __name: "actions", props: { operation: {}, loadingOperationMap: {}, showMenu: { type: Boolean, default: !0 }, actionIcon: { default: "base/rx_ic_more-v" } }, emits: ["quickClick", "more"], setup(e2, { emit: t2 }) {
  let n2 = t2, i2 = b(() => Ne(e2.operation)), a2 = b(() => {
    let e3 = [], t3 = [...i2.value];
    for (; t3.length; ) {
      let n3 = t3.pop();
      n3.quick && e3.unshift(n3), n3.items?.length && t3.unshift(...n3.items);
    }
    return e3;
  }), o2 = b(() => i2.value.filter((e3) => e3.visible !== !1).length > 0);
  function s2(t3, i3) {
    i3.disabled || e2.loadingOperationMap?.[i3.name] || n2("quickClick", { ...r(u(i3)), _event: t3, _type: "quick" });
  }
  function c2(e3) {
    n2("more", { event: e3, operation: u(i2.value) });
  }
  return (t3, n3) => {
    let r2 = F, i3 = L;
    return h(), C("div", Ie, [S("div", K, [(h(!0), C(w, null, A(E(a2), (t4) => (h(), C("div", { key: t4.name, class: x(["quick-item", { disabled: t4.disabled || e2.loadingOperationMap?.[t4.name] }]) }, [t4.render ? (h(), k(_(t4.render), { key: 0 })) : j((h(), C("div", { key: 1, class: "flex items-center", onClick: P((e3) => s2(e3, t4), ["stop"]) }, [M(r2, { class: x(["pointer-events-none quick-icon", [t4.iconClass, { "pi-spin": e2.loadingOperationMap?.[t4.name] }]]), name: e2.loadingOperationMap?.[t4.name] ? "base/rx_ic_progress_bar" : t4.icon }, null, 8, ["name", "class"])], 8, q)), [[i3, { value: t4.disabled ? t4.disabledTooltip : t4.tooltip, showDelay: 500, pt: { root: "!max-w-sm" } }, void 0, { top: !0 }]])], 2))), 128)), e2.showMenu && E(o2) ? j((h(), C("div", { key: 0, class: "quick-item", onClick: P(c2, ["stop"]) }, [d(t3.$slots, "more-icon", {}, () => [M(r2, { name: e2.actionIcon, class: "pointer-events-none quick-icon" }, null, 8, ["name"])], !0)])), [[i3, { value: t3.$t("\u66F4\u591A\u64CD\u4F5C"), showDelay: 500, pt: { text: { class: "!whitespace-nowrap !break-keep" } } }, void 0, { top: !0 }]]) : O("", !0)])]);
  };
} }), [["__scopeId", "data-v-1c6fd86b"]]);
var Re = { class: "multiple-selected" };
var J = { class: "text-white font-semibold" };
var ze = { class: "text-white font-semibold" };
var Y = ["onClick"];
var Be = { key: 0, class: "icon-label" };
var Ve = { key: 1, class: "discount-badge" };
var He = I(l({ __name: "selection-operation", props: { selection: { type: Array, default: () => [] }, total: { type: Number, default: 0 }, operation: { type: Array, default: () => [] }, batchOperation: { type: Function, default: () => () => {
} } }, emits: ["clearSelection", "batchMore"], setup(e2, { emit: t2 }) {
  let n2 = e2, i2 = t2, a2 = m({}), o2 = b(() => {
    let { menu: e3, group: t3, count: r2 } = n2.operation.reduce((e4, t4) => {
      if (!t4.multiple) return e4;
      let { items: n3, ...r3 } = u(t4);
      return e4.menu.push({ ...r3, items: n3?.filter((e5) => e5.multiple !== !1) }), r3.multipleProps && (e4.group[r3.multipleProps.name] ??= [], e4.group[r3.multipleProps.name].push({ ...r3, ...r3.multipleProps, _rawItem: r3 }), e4.count += 1), e4;
    }, { menu: [], group: {}, count: 0 });
    return { menu: e3, showMore: e3.length > r2, group: Object.entries(t3).toSorted((e4, t4) => e4[0].localeCompare(t4[0])).map(([e4, t4]) => t4) };
  });
  async function s2(e3, t3) {
    t3.disabled || a2.value[t3.name] || (a2.value[t3.name] = !0, await n2.batchOperation({ ...r(u(t3)), _event: e3, _type: "batch_quick" }), a2.value[t3.name] = !1);
  }
  function c2(e3) {
    i2("batchMore", { event: e3, operation: o2.value.menu });
  }
  return (t3, n3) => {
    let r2 = g("i18n-t"), i3 = L;
    return h(), k(E(B).div, { class: "multiple", initial: { scale: 0.98, x: "-50%", opacity: 0 }, animate: { scale: 1, x: "-50%", opacity: 1 }, exit: { scale: 0.98, x: "-50%", opacity: 0 }, transition: { duration: 0.32, ease: [0, 0.71, 0.2, 1.01] } }, { default: D(() => [S("div", Re, [S("div", null, [M(r2, { keypath: t3.$t("{selected} / {total} \u5DF2\u9009\u4E2D", { selected: "{selected}", total: "{total}" }), scope: "global" }, { selected: D(() => [S("span", J, T(e2.selection.length), 1)]), total: D(() => [S("span", ze, T(e2.total), 1)]), _: 1 }, 8, ["keypath"])]), M(E(F), { class: "cursor-pointer", name: "base/rx_ic_delete", color: "#ffffff", onClick: n3[0] ||= (e3) => t3.$emit("clearSelection") })]), d(t3.$slots, "custom-operation", {}, () => [(h(!0), C(w, null, A(E(o2).group, (e3, t4) => (h(), C("div", { key: t4, class: "multiple-group" }, [(h(!0), C(w, null, A(e3, (e4) => j((h(), C("div", { key: e4.name, class: x([{ disabled: e4.disabled }, "multiple-group-item"]), onClick: (t5) => s2(t5, e4._rawItem), role: "button", tabindex: e4.disabled ? -1 : 0, "aria-disabled": e4.disabled, onKeydown: (event) => {
      !event.repeat && (event.key === "Enter" || event.key === " ") && (event.preventDefault(), event.stopPropagation(), e4.disabled || event.currentTarget.click());
    } }, [M(E(F), p({ class: "pointer-events-none", name: e4.icon }, { ref_for: !0 }, e4.iconProps), null, 16, ["name"]), e4.showLabel ? (h(), C("span", Be, T(typeof e4.label == "function" ? e4.label() : e4.label), 1)) : O("", !0), e4.discountBadge ? (h(), C("span", Ve, T(e4.discountBadge), 1)) : O("", !0)], 10, Y)), [[i3, { value: e4.disabled ? e4.disabledTooltip : "", showDelay: 500 }, void 0, { top: !0 }]])), 128))]))), 128)), E(o2).showMore ? (h(), C("div", { key: 0, class: "multiple-group cursor-pointer", onClick: n3[1] ||= P((e3) => c2(e3), ["stop"]), role: "button", tabindex: 0, "aria-disabled": !1, onKeydown: (event) => {
      !event.repeat && (event.key === "Enter" || event.key === " ") && (event.preventDefault(), event.stopPropagation(), event.currentTarget.click());
    } }, [M(E(F), { name: "base/rx_ic_more-v", class: "pointer-events-none" })])) : O("", !0)], !0)]), _: 3 });
  };
} }), [["__scopeId", "data-v-5c752966"]]);
var Ue = { class: "position-relative flex" };
var We = { key: 0, class: "absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 size-8px rounded-full bg-[var(--colors-background-bg-brand)]" };
var Ge = I(l({ __name: "table-display", props: f({ size: { default: "xxs" } }, { columns: { default: [] }, columnsModifiers: {}, sortField: {}, sortFieldModifiers: {}, sortOrder: {}, sortOrderModifiers: {} }), emits: ["update:columns", "update:sortField", "update:sortOrder"], setup(e2) {
  let t2 = fe(e2, "columns"), n2 = fe(e2, "sortField"), r2 = fe(e2, "sortOrder"), i2 = se("popover");
  function a2(e3) {
    i2.value?.instance?.toggle(e3);
  }
  let o2 = b(() => {
    if (n2.value && t2.value) {
      let e3 = t2.value.find((e4) => e4.key === n2.value);
      return !e3 || !e3._visible;
    }
    return !1;
  });
  return (i3, s2) => {
    let c2 = R, l2 = Ae, te2 = H, u2 = L;
    return h(), C(w, null, [d(i3.$slots, "before"), S("div", Ue, [j(M(c2, { severity: "secondary", size: e2.size, outlined: "", icon: "base/rx_ic_slider_v", onClick: a2 }, null, 8, ["size"]), [[u2, i3.$t("\u81EA\u5B9A\u4E49\u6392\u7248"), void 0, { top: !0 }]]), E(o2) ? (h(), C("div", We)) : O("", !0)]), M(te2, { ref: "popover" }, he({ default: D(() => [S("div", { class: x(i3.display.content) }, [M(E(V), { modelValue: t2.value, "onUpdate:modelValue": s2[0] ||= (e3) => t2.value = e3, animation: 150, handle: ".handle" }, { default: D(() => [(h(!0), C(w, null, A(t2.value, (e3) => (h(), C("div", { key: e3.key, class: x(["flex items-center", i3.display.column]) }, [M(E(F), { name: "base/rx_ic_dots_drag", class: "cursor-grab handle" }), S("span", { class: x(["flex-auto", [n2.value === e3.key ? "color-[var(--colors-text-text-brand)]" : "", i3.display.label]]) }, [ce(T(e3.title) + " ", 1), n2.value === e3.key ? (h(), k(E(F), { key: 0, name: E(ee)(r2.value), size: "12px", color: "var(--colors-icon-icon-note)" }, null, 8, ["name"])) : O("", !0)], 2), e3.disabledToggle ? O("", !0) : (h(), k(l2, { key: 0, modelValue: e3._visible, "onUpdate:modelValue": (t3) => e3._visible = t3 }, null, 8, ["modelValue", "onUpdate:modelValue"]))], 2))), 128))]), _: 1 }, 8, ["modelValue"])], 2)]), _: 2 }, [i3.$slots.footer ? { name: "footer", fn: D(() => [d(i3.$slots, "footer")]), key: "0" } : void 0]), 1536)], 64);
  };
} }), [["__cssModules", { display: { content: "_content_5less_1", label: "_label_5less_5", column: "_column_5less_9", changed: "_changed_5less_19" } }]]);
var Ke = {};
function qe(e2, t2) {
  let n2 = Me;
  return h(), k(n2, { pt: { dayview: "!text-3.5" } });
}
var Je = I(Ke, [["render", qe]]);
var Ye = I(l({ __name: "table-filter", props: { filters: { type: Array, default: () => [] } }, emits: ["change"], setup(e2, { emit: t2 }) {
  let n2 = t2, r2 = m(!1), i2 = m([]);
  function a2() {
    r2.value = !0;
  }
  function o2() {
    r2.value && (r2.value = !1, l2());
  }
  function s2() {
    l2();
  }
  function c2(e3) {
    i2.value = e3;
  }
  function ee2() {
    i2.value?.length && i2.value.some((e3) => !!e3) && (n2("change"), i2.value = []);
  }
  function l2() {
    n2("change");
  }
  return (t3, n3) => {
    let r3 = je;
    return h(!0), C(w, null, A(e2.filters, (e3) => (h(), C("div", { key: e3.name || e3.key, class: "flex items-start shrink-0" }, [e3.type === "multiple" ? (h(), k(r3, p({ key: 0, modelValue: e3.value, "onUpdate:modelValue": (t4) => e3.value = t4, class: "min-w-37.5 shrink-0", "option-label": "label", "option-value": "value", "max-selected-labels": 1, "show-toggle-all": !1, pt: { list: "text-3.25", emptymessage: "text-3.25" } }, { ref_for: !0 }, e3, { onChange: a2, onHide: o2 }), { dropdownicon: D(() => [M(E(F), { name: "base/rx_ic_chevron_down" })]), _: 1 }, 16, ["modelValue", "onUpdate:modelValue"])) : e3.type === "select" ? (h(), k(Se, p({ key: 1, class: "!min-w-37.5 shrink-0", modelValue: e3.value, "onUpdate:modelValue": (t4) => e3.value = t4, size: "xxs", "show-clear": "", "highlight-on-select": !1 }, { ref_for: !0 }, { filter: !1, optionValue: "value", ...e3 }, { onChange: l2 }), null, 16, ["modelValue", "onUpdate:modelValue"])) : e3.type === "date" ? (h(), k(Je, p({ key: 2, modelValue: e3.value, "onUpdate:modelValue": (t4) => e3.value = t4, class: "min-w-37.5 flex-row-reverse shrink-0", "selection-mode": "range", "manual-input": !1, "show-icon": "", "show-button-bar": "", "date-format": "yy/mm/dd", placeholder: e3.placeholder }, { ref_for: !0 }, e3, { onHide: ee2, "onUpdate:modelValue": c2, onClearClick: s2 }), null, 16, ["modelValue", "onUpdate:modelValue", "placeholder"])) : O("", !0)]))), 128);
  };
} }), [["__scopeId", "data-v-040e0086"]]);
var Xe = { class: "position-relative flex" };
var Ze = l({ __name: "table-reload", props: { loading: { type: Boolean } }, setup(e2) {
  let t2 = e2, n2 = Date.now(), r2 = m("");
  pe(() => t2.loading, (e3) => {
    e3 || (n2 = Date.now(), a2());
  });
  function a2() {
    r2.value = i(String(n2));
  }
  return ve(a2, 6e4), (t3, n3) => {
    let i2 = R, a3 = L;
    return h(), C("div", Xe, [j(M(i2, { severity: "secondary", size: "xxs", outlined: "", icon: "base/rx_ic_refresh", disabled: e2.loading }, null, 8, ["disabled"]), [[a3, { value: t3.$t("\u6700\u540E\u5237\u65B0: {time}", { time: E(r2) }), pt: { text: "" } }, void 0, { left: !0 }]])]);
  };
} });
var Qe = ["for"];
var $e = ["for"];
var et = ["onClick"];
var tt = { class: "flex-1" };
var nt = { key: 1, class: "flex items-center gap-1 shrink-0" };
var rt = I(l({ __name: "index", props: { type: { type: String, default: "default" }, operation: { type: Array, default: () => [] }, operationHandler: { type: Function, default: () => () => {
} }, selected: { type: Array, default: void 0 }, onHide: { type: Function, default: () => () => {
} }, onChange: { type: Function, default: () => () => {
} } }, setup(e2) {
  let t2 = e2, { showPreventMask: n2, hidePreventMask: r2 } = G(), i2 = m(t2.selected), a2 = m();
  function o2(e3) {
    return typeof e3 == "function" ? e3() : e3;
  }
  function s2() {
    t2.onHide?.(u(i2.value)), i2.value = void 0, r2();
  }
  function c2() {
    t2.onChange?.(u(i2.value));
  }
  function ee2(e3) {
    e3.disabled || t2.operationHandler(e3);
  }
  return (t3, r3) => {
    let l2 = W, te2 = z, u2 = F, ne2 = U, d2 = be, re2 = L;
    return h(), k(ne2, { ref_key: "ctxMenu", ref: a2, model: e2.operation, pt: { root: "!border-0.5" }, onBeforeHide: s2, onShow: E(n2) }, { item: D(({ item: n3, props: a3 }) => [n3.render ? (h(), C("div", { key: 0, class: x(t3.menu.renderItem), onClick: r3[0] ||= P(() => {
    }, ["stop"]) }, [(h(), k(_(n3.render)))], 2)) : j((h(), C("a", p({ key: 1, class: "!pa-0" }, a3.action), [e2.type === "radio" ? (h(), C("label", { key: 0, class: x(["cursor-pointer", t3.menu.item]), for: n3.value, onClick: r3[3] ||= P(() => {
    }, ["stop"]) }, [M(l2, { modelValue: E(i2), "onUpdate:modelValue": r3[1] ||= (e3) => v(i2) ? i2.value = e3 : null, name: "radio", "input-id": n3.value, value: n3.value, onClick: r3[2] ||= P(() => {
    }, ["stop"]), onChange: c2 }, null, 8, ["modelValue", "input-id", "value"]), S("span", null, T(o2(n3.label)), 1)], 10, Qe)) : O("", !0), e2.type === "checkbox" ? (h(), C("label", { key: 1, class: x(["cursor-pointer", t3.menu.item]), for: n3.value, onClick: r3[6] ||= P(() => {
    }, ["stop"]) }, [M(te2, { modelValue: E(i2), "onUpdate:modelValue": r3[4] ||= (e3) => v(i2) ? i2.value = e3 : null, name: "checkbox", "input-id": n3.value, value: n3.value, onClick: r3[5] ||= P(() => {
    }, ["stop"]) }, null, 8, ["modelValue", "input-id", "value"]), S("span", null, T(o2(n3.label)), 1)], 10, $e)) : O("", !0), e2.type === "default" ? (h(), C("div", { key: 2, class: x([t3.menu.item, n3.disabled && t3.menu.disabled]), onClick: (e3) => ee2(n3) }, [n3.icon ? (h(), k(u2, { key: 0, class: x(n3.iconClass), name: n3.icon }, null, 8, ["class", "name"])) : O("", !0), S("span", tt, T(o2(n3.label)), 1), n3.suffixLabel || n3.suffixIcon ? (h(), C("div", nt, [n3.suffixIcon ? (h(), k(u2, p({ key: 0, class: n3.iconClass, name: n3.suffixIcon }, n3.suffixIconSize ? { size: n3.suffixIconSize } : {}), null, 16, ["class", "name"])) : O("", !0), n3.suffixLabel ? (h(), C("span", { key: 1, class: x(n3.suffixLabelClass) }, T(n3.suffixLabel), 3)) : O("", !0)])) : O("", !0), n3.items && !n3.hideSubmenuIcon ? (h(), k(u2, { key: 2, class: x(n3.iconClass), name: "base/rx_ic_chevron_right" }, null, 8, ["class"])) : O("", !0)], 10, et)) : O("", !0)], 16)), [[d2], [re2, { value: n3.menuTooltip, delay: 300 }]])]), _: 1 }, 8, ["model", "onShow"]);
  };
} }), [["__cssModules", { menu: { item: "_item_jhtkl_1", renderItem: "_renderItem_jhtkl_10", disabled: "_disabled_jhtkl_15" } }]]);
function it() {
  let e2, t2 = ge();
  return [(n2, r2) => {
    e2 = M(rt, r2), e2.appContext = t2.appContext, N(e2, document.body), ne(() => {
      (e2.component?.refs.ctxMenu).show(n2);
    });
  }, () => {
    (e2.component?.refs.ctxMenu).hide();
  }];
}
var at = { key: 0, class: "flex items-start justify-between self-stretch gap-2 rx-header" };
var ot = { class: "flex flex-1 gap-2 flex-wrap" };
var st = { class: "flex gap-2 items-center" };
var ct = { class: "table-wrapper position-relative flex-1 overflow-hidden" };
var lt = ["title"];
var ut = { class: "flex items-center" };
var dt = { key: 1, class: "rx-paginator" };
var ft = { class: "flex flex-1 items-center rx-paginator-jump" };
var pt = { class: "flex flex-1 items-center gap-2 justify-end" };
var X = I(l({ inheritAttrs: !1, __name: "index", props: f({ dataKey: { default: "id" }, cacheKey: { default: "" }, dataList: {}, operation: {}, tableParams: {}, selectionMode: {}, immediate: { type: Boolean, default: !0 }, multipleOperation: { type: Boolean, default: !0 }, paginator: { type: Boolean, default: !0 }, showTableHeader: { type: Boolean, default: !0 }, showDisplay: { type: Boolean, default: !0 }, showReload: { type: Boolean, default: !0 }, showActions: { type: Boolean, default: !0 }, showActionsMenu: { type: Boolean, default: !0 }, skeleton: { type: Boolean }, pageRows: { default: 10 }, clearSelectionOnRequest: { type: Boolean, default: !0 }, tableSort: { type: Function, default: () => [] }, tableFilters: { type: Function, default: () => [] }, tableRequest: { type: Function, default: () => ({}) }, tableOperation: { type: Function, default: () => [] }, operationHandler: {}, beforeRefresh: {}, afterRefresh: {}, listCacheKey: {}, listCacheScope: {}, listCacheMeta: {}, listCacheShouldRestore: {}, prepareRowMenu: {} }, { columns: { required: !0 }, columnsModifiers: {} }), emits: ["update:columns"], setup(i2, { expose: l2 }) {
  globalThis.electronAPI.on("local:profiles-change", () => {
    f2.tableRequest && yt(!0).catch((error) => {
      console.error(error), globalThis.__localUiError?.(error.message);
    });
  });
  let f2 = i2, g2 = fe(i2, "columns"), j2 = ye(), ge2 = o(), N2 = n(), [P2] = it(), ve2 = _e("ColumnCss_Module"), I2 = se("rootEl"), be2 = se("dataTable"), L2, R2 = m(!1), z2 = m(!1), Se2 = b(() => g2.value.filter((e2) => e2._visible ?? !0)), B2 = m(), V2 = m(), H2 = m(), U2 = m([]), W2 = y({ sortField: "", sortOrder: 0, onChange: void 0 }), G2 = b(() => Array.isArray(f2.dataList) ? f2.dataList : B2.value), { selection: Ae2, "onUpdate:selection": je2, ...Me2 } = ie(y(me())), Pe2 = y({ dataKey: f2.dataKey, scrollable: !0, scrollHeight: "flex", contextMenu: !0, showGridlines: !1, resizableColumns: !0, columnResizeMode: "expand", selectionMode: f2.selectionMode, onRowSelectAll: async () => {
    await ne();
    let e2 = [];
    document.querySelectorAll(".p-datatable-selectable-row.row-disabled").forEach((t2) => {
      e2.push(t2.getAttribute("data-row-id"));
      let n2 = t2.querySelector(".p-checkbox-checked");
      if (n2) {
        n2.classList.remove("p-checkbox-checked");
        let e3 = n2.querySelector(".p-checkbox-icon");
        e3 && (e3.style.display = "none");
      }
    }), U2.value = e2;
  }, ...Me2 }), Fe2 = t(je2?.value), Ie2 = m(), K2 = b({ get() {
    return Fe2 ? Ae2?.value : Ie2.value;
  }, set(e2) {
    Fe2 ? (je2?.value)(e2) : Ie2.value = e2;
  } }), q2 = b(() => K2.value?.filter((e2) => !U2.value.includes(e2[f2.dataKey]?.toString()))), Re2 = Number(localStorage.getItem(`table:${f2.cacheKey}`)) || f2.pageRows, J2 = y({ rows: Re2, first: Re2 * ((Number(j2.query.page_index) || 1) - 1), totalRecords: 0, rowsPerPageOptions: [5, 10, 20, 50, 100, 500].map((e2) => ({ label: $t("{count} \u6761/\u9875", { count: e2 }), value: e2 })), onResetPage(e2 = 0, t2) {
    J2.first = e2, t2 && (J2.rows = t2);
  }, onPage(e2) {
    X2();
  }, onRowsChange(e2) {
    f2.cacheKey && e2.value && localStorage.setItem(`table:${f2.cacheKey}`, e2.value), J2.first = 0, X2();
  } }), ze2 = b(() => $t("\u603B\u8BA1 {total} \u4E2A", { total: J2.totalRecords }));
  function Y2() {
    if (!f2.listCacheKey) return null;
    let e2 = ge2.currentWorkspace?.id;
    return e2 ? { namespace: f2.listCacheKey, workspaceId: String(e2), scope: f2.listCacheScope?.() ?? {} } : null;
  }
  function Be2() {
    let e2 = be2.value?.getVirtualScrollerRef?.(), t2 = e2?.element ?? e2?.$el;
    return t2 instanceof HTMLElement ? t2 : I2.value?.querySelector(".p-virtualscroller") ?? null;
  }
  function Ve2() {
    let e2 = Y2();
    e2 && N2.setScrollOffset(e2.namespace, e2.workspaceId, e2.scope, Be2()?.scrollTop ?? 0);
  }
  function Ue2() {
    let e2 = Y2();
    e2 && N2.clearScrollOffset(e2.namespace, e2.workspaceId, e2.scope);
  }
  async function We2() {
    let e2 = Y2();
    if (!e2) return;
    let t2 = N2.peekScrollOffset(e2.namespace, e2.workspaceId, e2.scope);
    if (t2) for (let n2 = 0; n2 < 16; n2++) {
      await ne();
      let n3 = Be2();
      if (n3 && n3.scrollHeight - n3.clientHeight >= t2 && (be2.value?.getVirtualScrollerRef?.()?.scrollTo?.({ top: t2 }), n3.scrollTo({ top: t2 }), n3.scrollTop > 0)) {
        N2.clearScrollOffset(e2.namespace, e2.workspaceId, e2.scope);
        return;
      }
    }
  }
  function Ke2(e2) {
    H2.value = { ...e2.outerParams }, J2.first = e2.paginator.first, J2.rows = e2.paginator.rows, J2.totalRecords = e2.total, B2.value = e2.rows;
  }
  function qe2() {
    let e2 = Y2();
    e2 && N2.set(e2.namespace, e2.workspaceId, e2.scope, { rows: B2.value ?? [], total: J2.totalRecords, outerParams: { ...H2.value ?? {} }, paginator: { first: J2.first, rows: J2.rows }, meta: f2.listCacheMeta?.() ?? {}, lastAccessedAt: Date.now() });
  }
  function Je2() {
    let e2 = Y2();
    e2 && N2.invalidate(e2.namespace, e2.workspaceId, e2.scope);
  }
  function Xe2() {
    let e2 = Y2();
    if (!e2) return null;
    let t2 = N2.get(e2.namespace, e2.workspaceId, e2.scope);
    return t2 ? (N2.touch(e2.namespace, e2.workspaceId, e2.scope), Ke2(t2), t2) : null;
  }
  re(async () => {
    L2 = nt2(), await L2, f2.listCacheKey && (!f2.listCacheShouldRestore || f2.listCacheShouldRestore()) && Xe2() || f2.immediate && await X2(), R2.value = !0;
  }), oe(() => {
    We2();
  }), pe(G2, () => {
    We2();
  }), ae(() => {
    Ve2();
  });
  function Qe2(e2) {
    let { key: t2, style: n2, alignFrozen: r2, pt: i3, ...a2 } = e2;
    return { field: t2, headerStyle: n2, frozen: !!r2, alignFrozen: r2, pt: { headercell: ve2.headercell, bodycell: ve2.bodycell, ...i3 }, ...a2 };
  }
  async function $e2(e2) {
    try {
      await f2.operationHandler?.(e2, q2.value, "batch"), Q();
    } catch (e3) {
      console.log(e3);
    }
  }
  function et2() {
    J2.onResetPage(), X2();
  }
  async function tt2(e2) {
    let t2 = e2.sortOrder ?? 0;
    W2.sortOrder = t2, W2.sortField = t2 ? String(e2.sortField ?? "") : "", J2.onResetPage(), await W2.onChange?.({ sortField: W2.sortField, sortOrder: W2.sortOrder }), X2();
  }
  async function nt2() {
    let [{ data: e2, onChange: t2 }, n2] = await Promise.all([f2.tableSort(), f2.tableFilters()]);
    V2.value = n2, W2.sortField = e2?.sortField ?? "", W2.sortOrder = e2?.sortOrder ?? 0, W2.onChange = t2;
  }
  function rt2() {
    let e2 = { page_index: Math.ceil(J2.first / J2.rows) + 1, page_size: J2.rows, ...s(V2.value), ...f2.tableParams, ...H2.value };
    if (W2.sortField && W2.sortOrder) {
      e2.orderName = W2.sortField;
      let t2 = a(W2.sortOrder);
      t2 && (e2.orderType = t2);
    }
    return e2;
  }
  async function X2() {
    const ticket = (localTableRequests.get(f2) || 0) + 1;
    localTableRequests.set(f2, ticket), f2.skeleton && (B2.value = Array.from({ length: 6 }).fill({})), z2.value = !0;
    try {
      await L2;
      const response = await f2.tableRequest(rt2());
      if (localTableRequests.get(f2) !== ticket) return;
      const data = response?.data ?? response;
      J2.totalRecords = data?.total ?? 0, B2.value = data?.rows || [];
      const success = response?.code === 0 || response?.code === void 0;
      f2.listCacheKey && success && qe2(), f2.clearSelectionOnRequest && Q();
    } finally {
      localTableRequests.get(f2) === ticket && (z2.value = !1);
    }
  }
  function mt(e2) {
    return Ne(c(f2.operation) ? f2.tableOperation(e2) : f2.operation);
  }
  let Z = m();
  function Q() {
    Fe2 ? (je2?.value)(void 0) : (K2.value = void 0, U2.value = []);
  }
  function ht() {
    f2.selectionMode === "multiple" && q2.value?.length && Q();
  }
  async function gt(t2) {
    if (!Pe2.contextMenu) {
      Z.value = void 0;
      return;
    }
    if (e(f2.prepareRowMenu)) try {
      await f2.prepareRowMenu(t2.data);
    } catch (e2) {
      console.error("[Table] prepare row menu failed", e2);
    }
    let n2 = mt(t2.data);
    if (!n2.some((e2) => e2.visible !== !1)) {
      Z.value = void 0;
      return;
    }
    ht();
    let i3 = !1;
    P2(t2.originalEvent, { operation: e(f2.operationHandler) ? n2.map(({ command: e2, ...t3 }) => t3) : n2, operationHandler: async (e2) => {
      try {
        i3 = !0;
        let n3 = { ...r(u(e2)), _event: t2.originalEvent };
        await f2.operationHandler?.(n3, t2.data, "single");
      } catch (e3) {
        console.log(e3);
      } finally {
        i3 = !1, Z.value = void 0;
      }
    }, onHide: () => {
      i3 || (Z.value = void 0);
    } });
  }
  function _t({ event: t2, operation: n2 }, i3, a2) {
    P2(t2, { operation: e(f2.operationHandler) ? n2.map(({ command: e2, ...t3 }) => t3) : n2, operationHandler: async (e2) => {
      try {
        let n3 = { ...r(u(e2)), _event: t2 };
        await f2.operationHandler?.(n3, i3, a2);
      } catch (e3) {
        console.log(e3);
      }
    } });
  }
  function vt(e2) {
    B2.value = e2 || [];
  }
  async function yt(e2 = !1) {
    e2 && f2.listCacheKey && (Je2(), Ue2()), await f2.beforeRefresh?.(), await X2(), await f2.afterRefresh?.();
  }
  l2({ rootElRef: I2, selectionData: q2, refresh: async (e2 = {}, t2 = !0) => {
    H2.value = e2, t2 && (J2.first = 0), await yt();
  }, clearSelection: Q, updateDataList: vt, getDataList: () => G2.value, getParams: rt2, restoreFromCache: Xe2, getCachedEntry: () => {
    let e2 = Y2();
    return e2 ? N2.get(e2.namespace, e2.workspaceId, e2.scope) : null;
  } });
  let bt = le(), $ = _e("ColumnCss_Module");
  function xt(e2) {
    return { class: $.bodyrow, "data-row-id": e2.props.rowData[f2.dataKey] };
  }
  return (e2, t2) => {
    let n2 = ke, r2 = F, a2 = we, o2 = Oe, s2 = Le, c2 = Ee, l3 = xe, u2 = De;
    return h(), C("div", { ref: "rootEl", class: x(["relative w-full h-full flex flex-col", e2.$attrs.class]) }, [i2.showTableHeader ? (h(), C("div", at, [d(e2.$slots, "table-header", {}, () => [S("div", ot, [d(e2.$slots, "filter-before", {}, void 0, !0), M(Ye, { filters: E(V2), onChange: et2 }, null, 8, ["filters"]), d(e2.$slots, "filter-after", {}, void 0, !0)]), S("div", st, [i2.showDisplay ? (h(), C(w, { key: 0 }, [M(Ge, { columns: g2.value, "onUpdate:columns": t2[0] ||= (e3) => g2.value = e3, "sort-field": E(W2).sortField, "sort-order": E(W2).sortOrder }, { before: D(() => [d(e2.$slots, "display-before", {}, void 0, !0)]), _: 3 }, 8, ["columns", "sort-field", "sort-order"]), M(n2, { layout: "vertical", class: "!mx-0 h-4" })], 64)) : O("", !0), d(e2.$slots, "reload-before", {}, void 0, !0), i2.showReload ? (h(), k(Ze, { key: 1, loading: E(z2), onClick: t2[1] ||= (e3) => yt(!0) }, null, 8, ["loading"])) : O("", !0)])], !0)])) : O("", !0), S("div", ct, [M(c2, p({ ref: "dataTable", "context-menu-selection": E(Z), "onUpdate:contextMenuSelection": t2[2] ||= (e3) => v(Z) ? Z.value = e3 : null, selection: E(K2), "onUpdate:selection": t2[3] ||= (e3) => v(K2) ? K2.value = e3 : null, value: E(G2) }, E(Pe2), { "sort-order": E(W2).sortOrder, "sort-field": E(W2).sortField, pt: { root: E($).tableroot, table: [E($).table, E(G2)?.length ? "pb-15" : "flex-1 !h-full"], emptymessagecell: "!whitespace-normal !text-center", tbody: E($).tbody, headerrow: E($).headerrow, bodyrow: xt }, onSort: tt2, onRowContextmenu: gt }), he({ default: D(() => [d(e2.$slots, "column-before", { ptProps: { headercell: E($).headercell, bodycell: E($).bodycell } }, void 0, !0), i2.selectionMode ? (h(), k(a2, { key: 0, "header-style": "width:0%; ", "body-style": "width:0%; ", "selection-mode": i2.selectionMode, pt: { headercell: E($).headercell, bodycell: E($).bodycell } }, { headercheckboxicon: D(({ checked: e3 }) => [e3 ? (h(), k(r2, { key: 0, name: "base/rx_ic_checkmark", color: "#ffffff" })) : O("", !0)]), rowcheckboxicon: D(({ checked: e3 }) => [e3 ? (h(), k(r2, { key: 0, name: "base/rx_ic_checkmark", color: "#ffffff" })) : O("", !0)]), _: 1 }, 8, ["selection-mode", "pt"])) : O("", !0), (h(!0), C(w, null, A(E(Se2), ({ headerSlot: t3, slot: n3, render: i3, headerRender: s3, ...c3 }) => (h(), k(a2, p({ key: c3.key }, { ref_for: !0 }, Qe2(c3)), { header: D(() => [S("div", { class: x(E($).columntitle) }, [d(e2.$slots, t3, { column: c3 }, () => [s3 ? (h(), k(_(s3), { key: 0, column: c3 }, null, 8, ["column"])) : (h(), C(w, { key: 1 }, [ce(T(c3.title), 1)], 64))], !0)], 2)]), body: D(({ data: t4, index: r3 }) => [d(e2.$slots, n3, { data: t4, index: r3, column: c3 }, () => [c3.skeleton && !t4.id ? (h(), k(o2, p({ key: 0, ref_for: !0 }, c3.skeleton), null, 16)) : i3 ? (h(), k(_(i3), { key: 1, data: t4, index: r3, column: c3, class: x(c3.classes) }, null, 8, ["data", "index", "column", "class"])) : (h(), C("div", { key: 2, style: de({ width: `${c3.width}px` || "auto" }), class: x(c3.classes), title: c3.getText?.(t4) || t4[c3.key] }, T(c3.getText?.(t4) || t4[c3.key]), 15, lt))], !0)]), sorticon: D(({ sorted: e3, sortOrder: t4, ...n4 }) => [S("div", { class: x(n4.class) }, [M(r2, { name: E(ee)(e3 ? t4 : 0), size: "12px", color: "var(--colors-icon-icon-note)" }, null, 8, ["name"])], 2)]), _: 2 }, 1040))), 128)), i2.showActions ? (h(), k(a2, { key: 1, field: "actions", header: e2.$t("\u64CD\u4F5C"), "align-frozen": "right", frozen: "", "header-style": "width: 0px;", pt: { columntitle: E($).columntitle, headercell: E($).headercell, bodycell: E($).bodycell } }, { body: D(({ data: t3 }) => [S("div", ut, [d(e2.$slots, "actions-extra", { data: t3 }, void 0, !0), d(e2.$slots, "actions", { data: t3 }, () => [M(s2, { "show-menu": i2.showActionsMenu, "loading-operation-map": t3.loadingOperationMap, operation: mt(t3), onQuickClick: (e3) => i2.operationHandler?.(e3, t3, "single"), onMore: (e3) => _t(e3, t3, "single") }, null, 8, ["show-menu", "loading-operation-map", "operation", "onQuickClick", "onMore"])], !0)])]), _: 3 }, 8, ["header", "pt"])) : O("", !0)]), _: 2 }, [A(E(bt), (t3, n3) => ({ name: n3, fn: D((t4) => [d(e2.$slots, n3, ue(te(t4)), void 0, !0)]) })), E(R2) ? { name: "empty", fn: D(() => [d(e2.$slots, "table-empty", {}, void 0, !0)]), key: "0" } : void 0]), 1040, ["context-menu-selection", "selection", "value", "sort-order", "sort-field", "pt"]), i2.skeleton ? O("", !0) : (h(), k(l3, { key: 0, modelValue: E(z2), "onUpdate:modelValue": t2[4] ||= (e3) => v(z2) ? z2.value = e3 : null, opacity: 0.9 }, null, 8, ["modelValue"]))]), i2.paginator ? (h(), C("div", dt, [M(u2, { first: E(J2).first, "onUpdate:first": t2[6] ||= (e3) => E(J2).first = e3, template: "JumpToPageInput PrevPageLink PageLinks NextPageLink", "page-link-size": 5, rows: E(J2).rows, "total-records": E(J2).totalRecords, onPage: E(J2).onPage }, { start: D(() => [S("div", ft, [S("div", null, T(E(ze2)), 1), M(Te, p({ modelValue: E(J2).rows, "onUpdate:modelValue": t2[5] ||= (e3) => E(J2).rows = e3, name: "rowsPerPage", style: { width: "fit-content" } }, { size: "xxs", optionValue: "value", filter: !1 }, { "option-value": "value", options: E(J2).rowsPerPageOptions, onChange: E(J2).onRowsChange }), null, 16, ["modelValue", "options", "onChange"]), S("div", pt, [S("div", null, T(e2.$t("\u8DF3\u8F6C\u9875\u6570\u81F3")), 1)])])]), _: 1 }, 8, ["first", "rows", "total-records", "onPage"])])) : O("", !0), M(E(Ce), null, { default: D(() => [i2.multipleOperation && i2.selectionMode === "multiple" && E(q2)?.length > 0 ? (h(), k(He, { key: 0, selection: E(q2), total: E(G2).length, operation: mt(E(q2)), "batch-operation": $e2, onClearSelection: Q, onBatchMore: t2[7] ||= (e3) => _t(e3, E(q2), "batch") }, he({ _: 2 }, [e2.$slots["multiple-operation"] ? { name: "custom-operation", fn: D(() => [d(e2.$slots, "multiple-operation", { selection: E(q2), clearSelection: Q }, void 0, !0)]), key: "0" } : void 0]), 1032, ["selection", "total", "operation"])) : O("", !0)]), _: 3 })], 2);
  };
} }), [["__cssModules", { ColumnCss_Module: { columntitle: "_columntitle_1b0eh_1", headerrow: "_headerrow_1b0eh_8", headercell: "_headercell_1b0eh_8", "p-datatable-column-sorted": "_p-datatable-column-sorted_1b0eh_22", bodyrow: "_bodyrow_1b0eh_27", bodycell: "_bodycell_1b0eh_27", tableroot: "_tableroot_1b0eh_46", table: "_table_1b0eh_46", tbody: "_tbody_1b0eh_56" } }], ["__scopeId", "data-v-6bcccfc5"]]);
export {Pe as c,Je as i,it as n,Le as o,Ze as r,Fe as s,X as t};