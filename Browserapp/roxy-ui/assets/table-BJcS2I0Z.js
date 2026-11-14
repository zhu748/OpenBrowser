import {Cr as e,Dr as t,fr as n,jr as r,o as i,wr as a,yr as o} from "./utils-BIWenCnY.js";
import {C as s,Et as c,F as l,J as u,L as d,N as f,P as p,R as ee,St as m,V as te,W as h,Y as ne,Z as g,_t as _,at as re,b as ie,bt as ae,d as v,en as y,f as b,h as x,i as S,in as C,jt as w,lt as T,m as E,p as D,q as O,rt as oe,st as se,tt as ce,ut as k,v as le,w as ue,x as A} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {f as de,m as fe} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {y as pe} from "./dist-ufdnm93_.js";
import {y as me} from "./rich-html-link-VdBpR3Cm.js";
import {Z as j} from "./basecomponent-ClhuVxJN.js";
import {t as M} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as he} from "./tooltip-BYYKWrvu.js";
import {t as ge} from "./rx-button-DyzuUt-V.js";
import {t as _e} from "./rx-divider-Ci3C58Q3.js";
import {n as ve,t as N} from "./m-input-select-C8pih1gY.js";
import {a as ye,n as P,o as be,r as F,t as xe} from "./contextmenu-BBjizTDn.js";
import {t as Se} from "./usePreventMask-Cud6gNnu.js";
import {t as Ce} from "./skeleton-CcmFVUhV.js";
import {t as I} from "./rx-toggle-switch-BI8eb18U.js";
import {t as L} from "./m-input-multi-select-B7lX5Cnm.js";
import {t as R} from "./m-input-date-picker-CPwsZFnI.js";
import {t as we} from "./table-paginator-DmCNA2td.js";
var Te = { class: "flex" };
var Ee = { class: "relative inline-flex" };
var z = { key: 0, class: "pointer-events-none absolute top-0 right-0 size-8px translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--colors-background-bg-brand)]" };
var De = { class: "py-1.5 px-1" };
var Oe = M(s({ __name: "display", props: f({ sortField: { default: "" }, sortOrder: { default: 0 } }, { modelValue: { default: [] }, modelModifiers: {} }), emits: ["update:modelValue"], setup(e2) {
  let t2 = oe(e2, "modelValue"), n2 = m([]), r2 = m(!1);
  se(t2, (e3) => {
    r2.value || (n2.value = (e3 ?? []).map((e4) => ({ ...e4 })));
  }, { immediate: !0 });
  function i2() {
    r2.value = !0;
  }
  function a2() {
    r2.value = !1, t2.value = n2.value;
  }
  function s2(e3, n3) {
    e3._visible = n3, t2.value = (t2.value ?? []).map((t3) => t3.field === e3.field ? { ...t3, _visible: n3 } : t3);
  }
  let c2 = re("popover");
  function l2(e3) {
    c2.value?.instance?.toggle(e3);
  }
  let d2 = v(() => {
    if (!e2.sortField || !t2.value?.length) return !1;
    let n3 = t2.value.find((t3) => t3.field === e2.sortField);
    return !n3 || n3._visible === !1;
  });
  return (t3, r3) => {
    let c3 = ge, f2 = I, p2 = F;
    return h(), x("div", Te, [b("div", Ee, [A(c3, { severity: "secondary", size: "xxs", outlined: "", icon: "base/rx_ic_slider_v", label: t3.$t("\u81EA\u5B9A\u4E49\u6392\u7248"), onClick: l2 }, null, 8, ["label"]), w(d2) ? (h(), x("div", z)) : E("", !0)]), A(p2, { ref: "popover" }, le({ default: T(() => [b("div", De, [A(w(P), { modelValue: w(n2), "onUpdate:modelValue": r3[0] ||= (e3) => _(n2) ? n2.value = e3 : null, animation: 150, handle: ".handle", onStart: i2, onEnd: a2 }, { default: T(() => [(h(!0), x(S, null, O(w(n2), (n3) => (h(), x("div", { key: n3.field, class: y(["flex items-center", t3.display.item]) }, [A(w(j), { name: "base/rx_ic_dots_drag", class: "handle cursor-grab" }), b("span", { class: y(["flex-auto font-500", [e2.sortField === n3.field ? "text-[var(--colors-text-text-brand)]" : ""]]) }, [ie(C(n3.header) + " ", 1), e2.sortField === n3.field ? (h(), D(w(j), { key: 0, name: w(o)(e2.sortOrder ?? 0), size: "12px", color: "var(--colors-icon-icon-note)" }, null, 8, ["name"])) : E("", !0)], 2), n3.disabledToggle ? E("", !0) : (h(), D(f2, { key: 0, "model-value": n3._visible, "onUpdate:modelValue": (e3) => s2(n3, e3) }, null, 8, ["model-value", "onUpdate:modelValue"]))], 2))), 128))]), _: 1 }, 8, ["modelValue"])])]), _: 2 }, [t3.$slots.footer ? { name: "footer", fn: T(() => [u(t3.$slots, "footer")]), key: "0" } : void 0]), 1536)]);
  };
} }), [["__cssModules", { display: { item: "_item_1ror2_1" } }]]);
function ke(e2) {
  return `ts-table:${e2}`;
}
function Ae(e2, n2) {
  if (!e2) return n2;
  let r2 = t(localStorage.getItem(ke(e2))), i2 = (Array.isArray(r2) ? r2 : []).reduce((e3, [t2, n3]) => (e3[t2] = n3, e3), {});
  return n2.map((e3, t2) => {
    let { sort: n3, visible: r3, cache: a2 } = i2[e3.field] ?? {};
    return { ...e3, _sort: n3 ?? e3._sort ?? t2, _visible: r3 ?? e3._visible ?? !0, _cache: a2 ?? e3._cache };
  }).toSorted((e3, t2) => e3._sort - t2._sort);
}
function je(e2, t2) {
  if (!e2) return;
  let n2 = t2.map((e3, t3) => [e3.field, { sort: t3, visible: e3._visible, cache: e3._cache }]);
  localStorage.setItem(ke(e2), JSON.stringify(n2));
}
var Me = { class: "flex items-center gap-1" };
var Ne = s({ __name: "actions", props: { model: {}, data: {}, showMenu: { type: Boolean, default: !0 }, isPending: { type: Function, default: () => !1 } }, emits: ["more"], setup(e2, { emit: t2 }) {
  let n2 = t2, r2 = v(() => e2.model.filter((e3) => e3.quick && e3.icon && !e3.onlyMultiple));
  return (t3, i2) => {
    let a2 = ge, o2 = he;
    return h(), x("div", Me, [(h(!0), x(S, null, O(w(r2), (t4) => k((h(), x("div", { key: t4.key ?? t4.icon }, [A(a2, { icon: t4.icon, disabled: t4.disabled || e2.isPending(t4), loading: e2.isPending(t4), text: "", size: "xxs", severity: "secondary", "on-click": (n3) => t4.command?.({ originalEvent: n3, item: t4, data: e2.data }) }, null, 8, ["icon", "disabled", "loading", "on-click"])])), [[o2, { value: t4.disabled && t4.disabledTooltip ? t4.disabledTooltip : t4.label, showDelay: 500 }, void 0, { top: !0 }]])), 128)), e2.showMenu ? (h(), D(a2, { key: 0, text: "", size: "xxs", severity: "secondary", icon: "base/rx_ic_more-v", "on-click": (e3) => n2("more", e3) }, null, 8, ["on-click"])) : E("", !0)]);
  };
} });
var Pe = { class: "absolute bottom-3/20 left-1/2 -translate-x-1/2 flex items-center z-100 actionbar" };
var Fe = { class: "flex items-center baritem" };
var B = { class: "baritem-light" };
var Ie = { class: "baritem-light" };
var Le = ["onClick"];
var Re = { key: 0, class: "icon-label" };
var ze = { key: 1, class: "discount-badge" };
var Be = M(s({ __name: "selection-actions", props: f({ total: {}, model: {}, isPending: { type: Function, default: () => !1 } }, { selection: {}, selectionModifiers: {} }), emits: f(["more"], ["update:selection"]), setup(e2, { emit: t2 }) {
  let n2 = t2, r2 = oe(e2, "selection"), i2 = m({});
  function o2(e3) {
    return !e3.onlyQuick && !!e3.multiple;
  }
  let s2 = v(() => Object.entries(e2.model.reduce((e3, t3) => {
    if (!o2(t3) || !a(t3.multiple) || t3.separator) return e3;
    let { name: n3 = "default", render: r3, showLabel: i3, iconProps: s3, discountBadge: c3, ...l3 } = t3.multiple;
    return e3[n3] ??= [], e3[n3].push({ ...t3, render: r3, showLabel: i3, iconProps: s3, discountBadge: c3, props: l3 }), e3;
  }, {})).toSorted((e3, t3) => e3[0].localeCompare(t3[0])).map(([, e3]) => e3)), c2 = v(() => e2.model.filter(o2).length > s2.value.reduce((e3, t3) => e3 + t3.length, 0));
  function l2(e3) {
    return String(e3.key ?? e3.icon ?? e3.label ?? "");
  }
  function d2(t3) {
    return !!i2.value[l2(t3)] || e2.isPending(t3);
  }
  async function f2(e3, t3) {
    if (t3.disabled || d2(t3)) return;
    let n3 = l2(t3);
    i2.value[n3] = !0;
    try {
      await t3.command?.({ originalEvent: e3, item: t3, data: r2.value }) !== !1 && (r2.value = []);
    } finally {
      i2.value[n3] = !1;
    }
  }
  function ee2(e3) {
    n2("more", e3);
  }
  function te2() {
    r2.value = [];
  }
  return (t3, n3) => {
    let i3 = ne("i18n-t"), a2 = he;
    return h(), x("div", Pe, [b("div", Fe, [A(i3, { tag: "div", keypath: t3.$t("{selected} / {total} \u5DF2\u9009\u4E2D", { selected: "{selected}", total: "{total}" }), scope: "global" }, { selected: T(() => [b("span", B, C(r2.value?.length), 1)]), total: T(() => [b("span", Ie, C(e2.total), 1)]), _: 1 }, 8, ["keypath"]), A(w(j), { class: "cursor-pointer", name: "base/rx_ic_delete", color: "#FAFAFA", onClick: te2 })]), (h(!0), x(S, null, O(w(s2), (e3, t4) => (h(), x("div", { key: t4, class: y(["icons", { "has-label": e3.some((e4) => e4.showLabel) }]) }, [(h(!0), x(S, null, O(e3, (e4) => (h(), x(S, { key: e4.key ?? e4.icon }, [e4.render ? (h(), D(g(e4.render), { key: 0, item: e4 }, null, 8, ["item"])) : k((h(), x("div", { key: 1, class: y(["icon-item", { disabled: e4.disabled || d2(e4) }]), onClick: (t5) => f2(t5, e4) }, [A(w(j), p({ class: ["pointer-events-none", { "animate-spin": d2(e4) }], name: d2(e4) ? "base/rx_ic_progress_bar" : e4.icon, color: "#FAFAFA" }, { ref_for: !0 }, d2(e4) ? {} : e4.iconProps), null, 16, ["name", "class"]), e4.showLabel ? (h(), x("span", Re, C(e4.label), 1)) : E("", !0), e4.discountBadge ? (h(), x("span", ze, C(e4.discountBadge), 1)) : E("", !0)], 10, Le)), [[a2, { value: e4.disabled ? e4.disabledTooltip : "", showDelay: 500 }, void 0, { top: !0 }]])], 64))), 128))], 2))), 128)), b("div", null, [u(t3.$slots, "default", {}, void 0, !0)]), w(c2) ? (h(), x("div", { key: 0, class: "icons cursor-pointer", onClick: n3[0] ||= fe((e3) => ee2(e3), ["stop"]) }, [A(w(j), { name: "base/rx_ic_more-v", class: "pointer-events-none", color: "#FAFAFA" })])) : E("", !0)]);
  };
} }), [["__scopeId", "data-v-6d43d0fd"]]);
function Ve(e2) {
  return typeof e2.power == "function" ? e2.power() !== !1 : e2.power !== !1;
}
function He(e2) {
  return typeof e2.visible == "function" ? e2.visible() !== !1 : e2.visible !== !1;
}
function Ue(e2) {
  return V(e2.flatMap((e3) => {
    if (!Ve(e3)) return [];
    if (!e3.items?.length) return [e3];
    let t2 = Ue(e3.items);
    return !t2.length && !e3.command ? [] : [{ ...e3, items: t2 }];
  }));
}
function V(e2) {
  let t2 = [];
  for (let n2 of e2) (!n2.separator || t2.length && !t2[t2.length - 1]?.separator) && t2.push(n2);
  for (; t2.at(-1)?.separator; ) t2.pop();
  return t2;
}
function We() {
  let e2 = ae(/* @__PURE__ */ new Set());
  function t2(t3) {
    return e2.has(t3);
  }
  async function n2(t3, n3) {
    if (e2.has(t3)) return !1;
    e2.add(t3);
    try {
      return await n3();
    } finally {
      e2.delete(t3);
    }
  }
  return { isBusy: t2, run: n2 };
}
var Ge = 24;
var H = /* @__PURE__ */ new Map();
function U(e2, t2) {
  for (H.delete(e2), H.set(e2, t2); H.size > Ge; ) {
    let e3 = H.keys().next().value;
    if (e3 === void 0) return;
    H.delete(e3);
  }
}
function Ke(e2) {
  if (!e2) return null;
  let t2 = H.get(e2);
  return t2 ? (U(e2, t2), t2) : null;
}
function qe(e2, t2) {
  if (!e2) return;
  let n2 = H.get(e2);
  U(e2, { ...t2, scrollTop: n2?.scrollTop ?? 0 });
}
function Je(e2, t2) {
  if (!e2) return;
  let n2 = H.get(e2);
  n2 && U(e2, { ...n2, scrollTop: t2 });
}
function Ye(e2) {
  return e2 ? H.get(e2)?.scrollTop ?? 0 : 0;
}
function Xe(e2) {
  let t2 = e2 ? H.get(e2) : void 0;
  t2 && (t2.scrollTop = 0);
}
function Ze(e2) {
  e2 && H.delete(e2);
}
var W = { class: "flex items-center gap-2" };
var Qe = s({ __name: "table-filter", props: { filters: {} }, emits: ["change"], setup(e2, { emit: t2 }) {
  let n2 = t2, r2 = { select: N, mselect: L, date: R }, i2 = { select: { size: "xxs" }, mselect: { size: "xxs", filter: !1, showToggleAll: !1, maxSelectedLabels: 1 }, date: { size: "xxs" } }, a2 = m(!1);
  function o2() {
    a2.value = !0;
  }
  function s2() {
    a2.value && (a2.value = !1, n2("change"));
  }
  return (t3, n3) => (h(), x("div", W, [(h(!0), x(S, null, O(e2.filters, (e3) => (h(), D(g(r2[e3.type]), p({ key: e3.name, ref_for: !0 }, { ...i2[e3.type], ...e3.props }, { modelValue: e3.value, "onUpdate:modelValue": [(t4) => e3.value = t4, o2], onHide: s2 }), null, 16, ["modelValue", "onUpdate:modelValue"]))), 128))]));
} });
var G = { class: "position-relative flex" };
var $e = s({ __name: "table-reload", props: { loading: { type: Boolean } }, setup(e2) {
  let t2 = e2, r2 = Date.now(), i2 = m("");
  se(() => t2.loading, (e3) => {
    e3 || (r2 = Date.now(), a2());
  });
  function a2() {
    i2.value = n(String(r2));
  }
  return pe(a2, 6e4), (t3, n2) => {
    let r3 = ge, a3 = he;
    return h(), x("div", G, [k(A(r3, { severity: "secondary", size: "xxs", outlined: "", icon: "base/rx_ic_refresh", label: t3.$t("\u5237\u65B0"), disabled: e2.loading }, null, 8, ["label", "disabled"]), [[a3, { value: t3.$t("\u6700\u540E\u5237\u65B0: {time}", { time: w(i2) }), pt: { text: "" } }, void 0, { left: !0 }]])]);
  };
} });
var et = { key: 0, class: "w-full px-6 py-2 flex flex-wrap items-start justify-between gap-2" };
var tt = { class: "flex flex-1 flex-wrap items-center gap-2 min-w-0 basis-64" };
var nt = { class: "ml-auto flex shrink-0 items-center gap-2" };
var rt = { class: "relative flex-1 overflow-hidden" };
var it = { key: 0, class: "w-full h-px bg-[var(--colors-border-border-subtle,#e6e8ea)] my-1" };
var at = { class: "flex items-center w-full gap-1.5 px-2.5 py-2 text-13px" };
var ot = { class: "flex-1" };
var st = ["onClick"];
var ct = { class: "flex-1" };
var lt = { key: 1, class: "flex items-center gap-1 shrink-0" };
var ut = "batch";
var dt = 6;
var ft = "__labSkeleton";
var pt = M(s({ inheritAttrs: !1, __name: "table", props: f({ dataKey: { default: "id" }, cacheKey: { default: "" }, displayKey: {}, model: { default: () => [] }, columns: { default: () => [] }, dataList: {}, selectionMode: {}, tableParams: {}, immediate: { type: Boolean, default: !0 }, pageSize: { default: 10 }, loading: { default: "mask" }, regions: {}, actionsPinned: { type: Boolean, default: !0 }, isRowDisabled: { type: Function }, remember: {}, tableRequest: { type: Function, default: () => ({}) }, tableFilters: { type: Function, default: () => [] }, tableSort: { type: Function }, beforeRefresh: { type: Function }, afterRefresh: { type: Function } }, { selection: {}, selectionModifiers: {} }), emits: ["update:selection"], setup(t2, { expose: n2 }) {
  let { isBusy: a2, run: s2 } = We(), f2 = ne2(ue()?.vnode.props);
  function ne2(e2) {
    return e2 ? Object.keys(e2).some((e3) => e3 === "selection" || e3.toLowerCase() === "onupdate:selection") : !1;
  }
  let { class: pe2, ...M2 } = ce(), ge2 = { dataKey: t2.dataKey, scrollable: !0, scrollHeight: "flex", contextMenu: !0, showGridlines: !1, resizableColumns: !0, columnResizeMode: "expand", selectionMode: t2.selectionMode, onRowContextmenu: Tt, ...M2 }, N2 = m(!1), P2 = ae({ sortField: "", sortOrder: 0, onChange: void 0 }), F2 = v(() => ({ header: !0, reload: !0, paginator: !0, actions: !0, selectionBar: !0, ...t2.regions })), I2 = m([]), L2 = ae({}), R2 = ae({});
  function Te2() {
    let e2 = Ae(t2.displayKey, t2.columns.map((e3) => ({ ...e3 })));
    I2.value = e2.map((e3) => e3.field), e2.forEach((e3) => {
      L2[e3.field] = e3._visible ?? !0, e3._cache !== void 0 && (R2[e3.field] = e3._cache);
    });
  }
  Te2();
  function Ee2(e2) {
    let t3 = I2.value;
    return e2.length === t3.length && e2.every((e3, n3) => e3 === t3[n3]);
  }
  let z2 = v({ get() {
    let e2 = new Map(t2.columns.map((e3, t3) => [e3.field, { column: e3, index: t3 }])), n3 = I2.value.filter((t3) => e2.has(t3));
    return e2.forEach((e3, t3) => {
      n3.includes(t3) || n3.push(t3);
    }), n3.map((t3, n4) => {
      let r2 = e2.get(t3);
      return { ...r2.column, _sort: n4, _visible: L2[t3] ?? r2.column._visible ?? !0, _cache: t3 in R2 ? R2[t3] : r2.column._cache };
    });
  }, set(e2) {
    let t3 = e2.map((e3) => e3.field);
    Ee2(t3) || (I2.value = t3), e2.forEach((e3) => {
      let t4 = e3._visible ?? !0;
      L2[e3.field] !== t4 && (L2[e3.field] = t4), e3._cache !== void 0 && R2[e3.field] !== e3._cache && (R2[e3.field] = e3._cache);
    });
  } }), De2 = v(() => z2.value.filter((e2) => e2._visible ?? !0)), ke2 = v(() => F2.value.actions !== !1 && !z2.value.some((e2) => e2.field === "actions"));
  ee(() => {
    je(t2.displayKey, z2.value);
  });
  let { showPreventMask: Me2, hidePreventMask: Pe2 } = Se(), Fe2 = oe(t2, "selection"), B2 = m(t2.selectionMode === "multiple" ? [] : null), Ie2 = re("rootEl"), Le2 = re("ctxmenu"), Re2 = m(), ze2 = m([]);
  function Ve2() {
    return t2.selectionMode === "multiple" ? [] : null;
  }
  function V2(e2) {
    return !!e2 && !tn(e2) && !t2.isRowDisabled?.(e2);
  }
  function Ge2(e2) {
    return (t2.selectionMode === "multiple" ? Array.isArray(e2) ? e2 : [] : e2 ? [e2] : []).map((e3) => String(e3?.[t2.dataKey] ?? "")).join("\0");
  }
  function H2(e2) {
    return t2.selectionMode === "multiple" ? (Array.isArray(e2) ? e2 : []).filter(V2) : e2 && !V2(e2) ? null : e2 ?? null;
  }
  function U2(e2) {
    f2 ? Fe2.value = e2 : B2.value = e2;
  }
  let W2 = v({ get() {
    let e2 = f2 ? Fe2.value : B2.value;
    return t2.selectionMode === "multiple" ? Array.isArray(e2) ? e2 : [] : e2 ?? null;
  }, set(e2) {
    U2(H2(e2));
  } }), G2 = v(() => {
    let e2 = H2(W2.value);
    return Array.isArray(e2) ? e2 : e2 ? [e2] : [];
  }), pt2 = v(() => {
    let e2 = ($.value ?? []).filter(V2);
    if (!e2.length) return !1;
    let n3 = new Set(G2.value.map((e3) => String(e3?.[t2.dataKey] ?? "")));
    return e2.every((e3) => n3.has(String(e3?.[t2.dataKey] ?? "")));
  });
  function mt(e2) {
    e2.checked ? U2(($.value ?? []).filter(V2)) : K();
  }
  se(() => f2 ? Fe2.value : B2.value, (e2) => {
    let t3 = H2(e2);
    Ge2(e2) !== Ge2(t3) && U2(t3);
  });
  function K() {
    W2.value = Ve2();
  }
  function ht(e2) {
    return `row:${String(e2?.[t2.dataKey] ?? "")}`;
  }
  function gt(e2) {
    return String(e2.key ?? e2.icon ?? e2.label ?? "");
  }
  function _t(e2, t3) {
    return `${e2}:${gt(t3)}`;
  }
  function q(e2) {
    return !!e2.pendingKey && a2(e2.pendingKey);
  }
  function vt(e2) {
    let n3 = typeof t2.model == "function" ? t2.model(e2) : t2.model, r2 = c(e2.row ?? e2.rows), i2 = e2.row ? ht(e2.row) : ut;
    return Ue(n3 ?? []).map((e3) => yt(e3, r2, i2));
  }
  function yt(t3, n3, r2) {
    let i2 = { ...t3, pendingKey: _t(r2, t3) };
    if (t3.items?.length && (i2.items = t3.items.map((e2) => yt(e2, n3, r2))), e(t3.command)) {
      let e2 = t3.command;
      i2.command = async (t4) => s2(i2.pendingKey, () => e2({ ...t4, data: t4?.data ?? n3 }));
    }
    return i2;
  }
  function bt(e2) {
    return !!e2.multiple && !e2.onlyQuick;
  }
  function xt(e2) {
    let t3 = vt(e2);
    return (e2.rows ? t3.filter(bt) : t3.filter((e3) => !(e3.onlyQuick || e3.onlyMultiple))).filter(He);
  }
  function St(e2) {
    return e2.some((e3) => !e3.separator);
  }
  function Ct(t3, n3, r2) {
    let i2 = { ...t3 };
    if (t3.items?.length && (i2.items = t3.items.filter((e2) => He(e2) && (!n3 || e2.multiple !== !1)).map((e2) => Ct(e2, n3, r2))), e(t3.command)) {
      let e2 = c(r2);
      i2.command = async (r3) => {
        let i3 = await t3.command?.({ ...r3, data: e2 });
        return n3 && i3 !== !1 && K(), i3;
      };
    }
    return i2;
  }
  async function wt(e2, n3, r2) {
    let i2 = xt(n3).map((e3) => Ct(e3, !!n3.rows, r2));
    St(i2) ? (n3.row && t2.selectionMode === "multiple" && G2.value.length && K(), Re2.value = r2, ze2.value = i2, await l(), Le2.value?.show(e2)) : Le2.value?.hide();
  }
  function Tt(e2) {
    let { data: n3, originalEvent: r2 } = e2;
    tn(n3) || t2.isRowDisabled?.(n3) || wt(r2, { row: n3 }, n3);
  }
  function Et(e2) {
    wt(e2.originalEvent, { rows: e2.data }, e2.data);
  }
  function Dt(e2 = ze2.value) {
    return e2.some((e3) => q(e3) || (e3.items?.length ? Dt(e3.items) : !1));
  }
  async function Ot(e2, t3) {
    t3.items?.length || t3.separator || t3.disabled || q(t3) || await t3.command?.({ originalEvent: e2, item: t3 }) !== !1 && !Dt() && Le2.value?.hide();
  }
  let kt = me(), At = Number(localStorage.getItem(`table:${t2.cacheKey}`)) || t2.pageSize, J = m(At), Y = m(At * ((Number(kt.query.page_index) || 1) - 1)), jt = m(0);
  function Mt() {
    $t();
  }
  let Nt = m(!1), X = m(!1), Pt = m(), Z = m(), Q = m(), Ft = v(() => t2.loading === "skeleton" && X.value), It = v(() => t2.dataList === void 0 ? Z.value : t2.dataList), $ = v(() => Ft.value ? Array.from({ length: dt }, () => ({ [ft]: !0 })) : It.value), Lt = v(() => {
    let e2 = M2.virtualScrollerOptions ?? M2["virtual-scroller-options"];
    if (e2) return e2;
    if (!(($.value?.length ?? 0) <= 40)) return { itemSize: M2.size === "small" ? 40 : 60 };
  }), Rt = v(() => vt({ rows: G2.value })), zt;
  d(async () => {
    zt = Vt(), await zt, Jt() || t2.immediate && t2.dataList === void 0 && await $t(), Nt.value = !0;
  }), te(() => {
    Qt();
  }), se(It, () => {
    Qt();
  }), ee(() => {
    let e2 = Xt();
    e2 != null && Je(t2.remember, e2);
  });
  function Bt() {
    Y.value = 0, $t();
  }
  async function Vt() {
    let [e2, n3] = await Promise.all([t2.tableFilters(), t2.tableSort ? t2.tableSort() : Promise.resolve(null)]);
    Q.value = e2, n3 && (P2.sortField = n3.data?.sortField ?? "", P2.sortOrder = n3.data?.sortOrder ?? 0, P2.onChange = n3.onChange, N2.value = !0);
  }
  function Ht() {
    let e2 = { page_index: Math.ceil(Y.value / J.value) + 1, page_size: J.value, ...i(Q.value), ...t2.tableParams, ...Pt.value };
    if (N2.value && P2.sortField) {
      e2.orderName = P2.sortField;
      let t3 = r(P2.sortOrder);
      t3 && (e2.orderType = t3);
    }
    return e2;
  }
  async function Ut(e2) {
    N2.value && (P2.sortField = e2.sortField ?? "", P2.sortOrder = e2.sortOrder ?? 0, Y.value = 0, await P2.onChange?.({ sortField: P2.sortField, sortOrder: P2.sortOrder }), await $t());
  }
  function Wt() {
    let e2 = {};
    for (let t3 of Q.value ?? []) t3?.name && (e2[t3.name] = t3.value);
    return e2;
  }
  function Gt(e2) {
    if (e2) for (let t3 of Q.value ?? []) t3?.name && Object.hasOwn(e2, t3.name) && (t3.value = e2[t3.name]);
  }
  function Kt() {
    return { rows: Z.value ?? [], total: jt.value, page: { first: Y.value, size: J.value }, params: { ...Pt.value ?? {} }, filters: Wt(), sort: { field: P2.sortField, order: P2.sortOrder } };
  }
  function qt(e2) {
    Pt.value = { ...e2.params }, Y.value = e2.page.first, e2.page.size && (J.value = e2.page.size), jt.value = e2.total, Z.value = e2.rows, e2.sort?.field && (P2.sortField = e2.sort.field, P2.sortOrder = e2.sort.order, N2.value = !0), Gt(e2.filters);
  }
  function Jt() {
    if (t2.dataList !== void 0) return !1;
    let e2 = Ke(t2.remember);
    return e2 ? (qt(e2), !0) : !1;
  }
  function Yt() {
    let e2 = Ie2.value;
    return e2 ? e2.querySelector(".p-virtualscroller") ?? e2.querySelector(".p-datatable-table-container") : null;
  }
  function Xt() {
    return Yt()?.scrollTop;
  }
  let Zt = 0;
  async function Qt() {
    let e2 = Ye(t2.remember);
    if (!e2) return;
    let n3 = ++Zt, r2 = performance.now() + 480;
    for (; performance.now() < r2; ) {
      if (n3 !== Zt) return;
      await l();
      let r3 = Yt();
      if (r3 && r3.scrollHeight - r3.clientHeight >= e2 && (r3.scrollTop = e2, r3.scrollTop > 0)) {
        Xe(t2.remember);
        return;
      }
      await new Promise((e3) => requestAnimationFrame(() => e3()));
    }
  }
  async function $t() {
    X.value = !0;
    try {
      await zt;
      let e2 = await t2.tableRequest(Ht()), n3 = typeof e2?.code == "number" && e2.code !== 0, r2 = e2?.data ?? e2;
      Z.value = r2?.rows || [], jt.value = r2?.total ?? 0, f2 || (B2.value = Ve2()), !n3 && t2.dataList === void 0 && qe(t2.remember, Kt());
    } finally {
      X.value = !1;
    }
  }
  async function en(e2 = !1) {
    e2 && Ze(t2.remember), await t2.beforeRefresh?.(), await $t(), await t2.afterRefresh?.();
  }
  function tn(e2) {
    return e2?.[ft] === !0;
  }
  return n2({ getParams: Ht, getColumns: () => z2.value, getRows: () => It.value ?? [], clearSelection: K, refresh: async (e2 = {}, t3 = !0) => {
    t3 && (Y.value = 0), Pt.value = e2, await en();
  }, update: (e2) => {
    Z.value = e2 || [];
  } }), (e2, n3) => {
    let r2 = _e, i2 = j, a3 = ye, s3 = Ce, c2 = be, l2 = ve, d2 = xe, f3 = he;
    return h(), x("div", { ref_key: "rootEl", ref: Ie2, class: y(["w-full h-full flex flex-col", w(pe2)]) }, [w(F2).header ? (h(), x("div", et, [u(e2.$slots, "header", {}, () => [b("div", tt, [u(e2.$slots, "filter-before"), w(Q)?.length ? (h(), D(Qe, { key: 0, filters: w(Q), onChange: Bt }, null, 8, ["filters"])) : E("", !0), u(e2.$slots, "filter-after")]), b("div", nt, [u(e2.$slots, "toolbar"), t2.displayKey ? (h(), D(Oe, { key: 0, modelValue: w(z2), "onUpdate:modelValue": n3[0] ||= (e3) => _(z2) ? z2.value = e3 : null, "sort-field": w(N2) ? w(P2).sortField : "", "sort-order": w(N2) ? w(P2).sortOrder : 0 }, null, 8, ["modelValue", "sort-field", "sort-order"])) : E("", !0), t2.displayKey && w(F2).reload ? (h(), D(r2, { key: 1, class: "!h-5", vertical: "", "line-only": "" })) : E("", !0), w(F2).reload ? (h(), D($e, { key: 2, loading: w(X), onClick: n3[1] ||= (e3) => en(!0) }, null, 8, ["loading"])) : E("", !0)])])])) : E("", !0), b("div", rt, [A(c2, p(ge2, { "virtual-scroller-options": w(Lt), selection: w(W2), "onUpdate:selection": n3[2] ||= (e3) => _(W2) ? W2.value = e3 : null, "selection-mode": w(Ft) ? void 0 : t2.selectionMode, "select-all": w(pt2), value: w($), "context-menu-selection": w(Re2), "sort-field": w(N2) ? w(P2).sortField : void 0, "sort-order": w(N2) ? w(P2).sortOrder : void 0, pt: { root: e2.$style.tableroot, table: [e2.$style.table, { "flex-1 !h-full": !w($)?.length }], emptymessagecell: "!whitespace-normal !text-center", tbody: e2.$style.tbody, headerrow: e2.$style.headerrow, bodyrow: (n4) => {
      let r3 = n4.props.rowData, i3 = tn(r3) || !!t2.isRowDisabled?.(r3);
      return { class: [e2.$style.bodyrow, i3 && "row-disabled"], dataRowId: r3?.[t2.dataKey] };
    } }, onSort: Ut, onSelectAllChange: mt }), le({ default: T(() => [u(e2.$slots, "column-before", { ptProps: { headercell: e2.$style.headercell, bodycell: e2.$style.bodycell } }), t2.selectionMode && !w(Ft) ? (h(), D(a3, { key: 0, "selection-mode": t2.selectionMode, "header-style": "width:0%", "body-style": "width:0%", pt: { headercell: e2.$style.headercell, bodycell: e2.$style.bodycell } }, { headercheckboxicon: T(({ checked: e3 }) => [k(A(i2, { name: "base/rx_ic_checkmark", color: "#ffffff" }, null, 512), [[de, e3]])]), rowcheckboxicon: T(({ checked: e3 }) => [k(A(i2, { name: "base/rx_ic_checkmark", color: "#ffffff" }, null, 512), [[de, e3]])]), _: 1 }, 8, ["selection-mode", "pt"])) : E("", !0), (h(!0), x(S, null, O(w(De2), ({ headerRender: t3, headerSlot: n4, render: r3, slot: i3, ...c3 }) => (h(), D(a3, p({ key: c3.field }, { ref_for: !0 }, c3.props, { field: c3.field, pt: { headercell: e2.$style.headercell, columnheadercontent: e2.$style.header_text, bodycell: { class: [e2.$style.bodycell, e2.$style.body_text], ...c3.cellProps } } }), le({ header: T(() => [t3 ? (h(), D(g(t3), { key: 0, column: c3 }, null, 8, ["column"])) : u(e2.$slots, n4, { column: c3 }, () => [ie(C(c3.header), 1)], void 0, 1)]), body: T(({ data: t4, index: n5 }) => [tn(t4) ? (h(), x(S, { key: 0 }, [c3.skeleton ? (h(), D(s3, p({ key: 0, ref_for: !0 }, c3.skeleton), null, 16)) : (h(), D(s3, { key: 1, width: "60%", height: "1rem" }))], 64)) : (h(), x(S, { key: 1 }, [r3 ? (h(), D(g(r3), { key: 0, column: c3, data: t4, index: n5 }, null, 8, ["column", "data", "index"])) : u(e2.$slots, i3, { column: c3, data: t4, index: n5 }, () => [ie(C(c3.getText?.(t4) || t4[c3.field]), 1)], void 0, 1)], 64))]), _: 2 }, [w(N2) && c3.props?.sortable ? { name: "sorticon", fn: T(({ sorted: e3, sortOrder: t4, ...n5 }) => [b("div", { class: y(n5.class) }, [A(w(j), { name: w(o)(e3 ? t4 : 0), size: "12px", color: "var(--colors-icon-icon-note)" }, null, 8, ["name"])], 2)]), key: "0" } : void 0]), 1040, ["field", "pt"]))), 128)), w(ke2) ? (h(), D(a3, { key: 1, field: "actions", header: e2.$t("\u64CD\u4F5C"), frozen: t2.actionsPinned, "align-frozen": t2.actionsPinned ? "right" : void 0, "header-style": "width: 0; min-width: max-content; white-space: nowrap", "body-style": "width: 0; min-width: max-content; white-space: nowrap", pt: { headercell: e2.$style.headercell, columnheadercontent: e2.$style.header_text, bodycell: { class: [e2.$style.bodycell, e2.$style.body_text] } } }, { body: T(({ data: t3, index: n4 }) => [tn(t3) ? (h(), D(s3, { key: 0, width: "4rem", height: "1rem" })) : u(e2.$slots, "actions", { data: t3, index: n4, isPending: q, model: vt({ row: t3 }), openMenu: (e3) => Tt({ originalEvent: e3, data: t3, index: n4 }) }, () => [A(Ne, { model: vt({ row: t3 }), data: t3, "is-pending": q, "show-menu": w(F2).actions !== "quick", onMore: (e3) => Tt({ originalEvent: e3, data: t3, index: n4 }) }, null, 8, ["model", "data", "show-menu", "onMore"])], void 0, 1)]), _: 3 }, 8, ["header", "frozen", "align-frozen", "pt"])) : E("", !0)]), _: 2 }, [w(Nt) && !w(Ft) ? { name: "empty", fn: T(() => [u(e2.$slots, "empty")]), key: "0" } : void 0]), 1040, ["virtual-scroller-options", "selection", "selection-mode", "select-all", "value", "context-menu-selection", "sort-field", "sort-order", "pt"]), w(F2).selectionBar && t2.selectionMode === "multiple" && w(G2).length > 0 ? (h(), D(Be, { key: 0, selection: w(W2), "onUpdate:selection": n3[3] ||= (e3) => _(W2) ? W2.value = e3 : null, total: w(It)?.length ?? 0, model: w(Rt), "is-pending": q, onMore: n3[4] ||= (e3) => Et({ originalEvent: e3, data: w(G2) }) }, { default: T(() => [u(e2.$slots, "selection-actions", { selection: w(G2), clear: K })]), _: 3 }, 8, ["selection", "total", "model"])) : E("", !0), t2.loading === "skeleton" ? E("", !0) : (h(), D(l2, { key: 1, modelValue: w(X), "onUpdate:modelValue": n3[5] ||= (e3) => _(X) ? X.value = e3 : null, opacity: 0.9 }, null, 8, ["modelValue"]))]), w(F2).paginator ? (h(), D(we, { key: 1, first: w(Y), "onUpdate:first": n3[6] ||= (e3) => _(Y) ? Y.value = e3 : null, rows: w(J), "onUpdate:rows": n3[7] ||= (e3) => _(J) ? J.value = e3 : null, "cache-key": t2.cacheKey, "total-records": w(jt), onUpdate: Mt }, null, 8, ["first", "rows", "cache-key", "total-records"])) : E("", !0), A(d2, { ref: "ctxmenu", model: w(ze2), pt: { root: "!border-0.5" }, onShow: w(Me2), onBeforeHide: w(Pe2), onHide: n3[9] ||= (e3) => Re2.value = null }, { item: T(({ item: e3, props: t3 }) => [e3.separator ? (h(), x("div", it)) : e3.render ? (h(), x("div", { key: 1, class: "w-full", onClick: n3[8] ||= fe(() => {
    }, ["stop"]) }, [(h(), D(g(e3.render), { item: e3 }, null, 8, ["item"]))])) : e3.items?.length ? (h(), x("a", p({ key: 2 }, t3.action, { class: "!pa-0" }), [b("div", at, [e3.icon ? (h(), D(w(j), { key: 0, name: e3.icon, class: y(e3.iconClass) }, null, 8, ["name", "class"])) : E("", !0), b("span", ot, C(e3.label), 1), A(w(j), { name: "base/rx_ic_chevron_right" })])], 16)) : k((h(), x("div", { key: 3, class: y(["flex items-center w-full gap-1.5 px-2.5 py-2 text-13px cursor-pointer", { "opacity-40 pointer-events-none": e3.disabled || q(e3) }]), onClick: fe((t4) => Ot(t4, e3), ["stop"]) }, [e3.icon || q(e3) ? (h(), D(w(j), { key: 0, name: q(e3) ? "base/rx_ic_progress_bar" : e3.icon, class: y([e3.iconClass, q(e3) && "animate-spin"]) }, null, 8, ["name", "class"])) : E("", !0), b("span", ct, C(e3.label), 1), e3.suffixLabel || e3.suffixIcon ? (h(), x("div", lt, [e3.suffixIcon ? (h(), D(w(j), { key: 0, name: e3.suffixIcon, class: y(e3.iconClass) }, null, 8, ["name", "class"])) : E("", !0), e3.suffixLabel ? (h(), x("span", { key: 1, class: y(e3.suffixLabelClass) }, C(e3.suffixLabel), 3)) : E("", !0)])) : E("", !0)], 10, st)), [[f3, { value: e3.menuTooltip, delay: 300 }]])]), _: 1 }, 8, ["model", "onShow", "onBeforeHide"])], 2);
  };
} }), [["__cssModules", { $style: { header_text: "_header_text_yncx7_1", body_text: "_body_text_yncx7_8", tableroot: "_tableroot_yncx7_15", bodycell: "_bodycell_yncx7_15", table: "_table_yncx7_15", tbody: "_tbody_yncx7_25", bodyrow: "_bodyrow_yncx7_25", headerrow: "_headerrow_yncx7_54", headercell: "_headercell_yncx7_54", "p-datatable-column-sorted": "_p-datatable-column-sorted_yncx7_67" } }]]);
export {Ne as n,pt as t};