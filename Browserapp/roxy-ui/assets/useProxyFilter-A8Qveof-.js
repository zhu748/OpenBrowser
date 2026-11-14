import {St as e,d as t} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {a as n,i as r,m as i,s as a} from "./proxy-D7e36h-l.js";
var o = "__all__";
function s(e2) {
  return { proxyExpireStatus: o, proxyBindStatus: o, proxyType: o, proxyAutoRenew: o, ...e2 };
}
function c() {
  return [{ key: "proxyExpireStatus", label: $t("\u72B6\u6001"), options: [{ label: $t("\u5168\u90E8"), value: o }, { label: $t("\u4F7F\u7528\u4E2D"), value: a.using }, { label: $t("\u5373\u5C06\u5230\u671F"), value: a.soon }, { label: $t("\u5DF2\u8FC7\u671F"), value: a.expired }] }, { key: "proxyBindStatus", label: $t("\u5DF2\u5173\u8054\u7A97\u53E3"), multiple: !1, options: [{ label: $t("\u5168\u90E8"), value: o }, { label: $t("\u5DF2\u5173\u8054"), value: n.Bound }, { label: $t("\u672A\u5173\u8054"), value: n.Unbound }] }, { key: "proxyType", label: $t("\u6765\u6E90"), multiple: !1, options: [{ label: $t("\u5168\u90E8"), value: o }, { label: $t("\u5DF2\u6DFB\u52A0"), value: i.resource.toString() }] }, { key: "proxyAutoRenew", label: $t("\u81EA\u52A8\u7EED\u8D39"), multiple: !1, options: [{ label: $t("\u5168\u90E8"), value: o }, { label: $t("\u5DF2\u5F00\u542F"), value: r.Enabled }, { label: $t("\u672A\u5F00\u542F"), value: r.Disabled }] }];
}
function l(e2, t2) {
  return e2 === t2 || String(e2) === String(t2);
}
function u(e2) {
  return e2 === void 0 || e2 === "__all__" ? [] : Array.isArray(e2) ? e2.filter((e3) => e3 !== o) : [e2];
}
function d(e2) {
  return e2 === void 0 || e2 === "__all__" ? !1 : !Array.isArray(e2) || e2.length > 0;
}
function f(e2) {
  return Array.isArray(e2) ? e2.join(",") : e2;
}
function p(e2) {
  let t2 = {};
  return d(e2.proxyExpireStatus) && (t2.proxyExpireStatus = f(e2.proxyExpireStatus)), d(e2.proxyBindStatus) && (t2.proxyBindStatus = f(e2.proxyBindStatus)), d(e2.proxyType) && (t2.proxyType = f(e2.proxyType)), d(e2.proxyAutoRenew) && (t2.proxyAutoRenew = f(e2.proxyAutoRenew)), t2;
}
function m(e2) {
  return Object.values(e2).some((e3) => d(e3));
}
function h(e2, t2) {
  return e2.flatMap((e3) => {
    let n2 = t2[e3.key];
    if (!d(n2)) return [];
    let r2 = u(n2).map((t3) => e3.options.find((e4) => e4.value !== "__all__" && l(e4.value, t3))?.label ?? String(t3)).join(", ");
    return [{ key: e3.key, label: e3.label, valueText: r2 }];
  });
}
function g(n2) {
  let r2 = e(!1), i2 = e(s(n2.initialValues)), a2 = e(s(i2.value)), f2 = (n2.filterGroups ?? c()).map((e2) => ({ ...e2, multiple: e2.multiple ?? n2.multiple ?? !1 })), g2 = t(() => m(i2.value)), _ = t(() => Object.values(i2.value).filter((e2) => d(e2)).length), v = t(() => h(f2, i2.value).map((e2) => `${e2.label}: ${e2.valueText}`)), y = t(() => v.value.join(", ")), b = t(() => v.value.join(`
`));
  function x(e2) {
    return { proxyExpireStatus: Array.isArray(e2.proxyExpireStatus) ? [...e2.proxyExpireStatus] : e2.proxyExpireStatus, proxyBindStatus: Array.isArray(e2.proxyBindStatus) ? [...e2.proxyBindStatus] : e2.proxyBindStatus, proxyType: Array.isArray(e2.proxyType) ? [...e2.proxyType] : e2.proxyType, proxyAutoRenew: Array.isArray(e2.proxyAutoRenew) ? [...e2.proxyAutoRenew] : e2.proxyAutoRenew };
  }
  function S() {
    a2.value = x(i2.value), r2.value = !0;
  }
  function C() {
    r2.value = !1;
  }
  function w() {
    a2.value = s();
  }
  function T() {
    if (!g2.value) return;
    let e2 = s();
    i2.value = e2, a2.value = x(e2), r2.value = !1, n2.onApply();
  }
  function E(e2, t2) {
    let n3 = a2.value[e2];
    return t2 === "__all__" ? !d(n3) : Array.isArray(n3) ? n3.some((e3) => l(e3, t2)) : l(n3, t2);
  }
  function D(e2, t2) {
    a2.value = { ...a2.value, [e2]: t2 };
  }
  function O(e2, t2) {
    if (!f2.find((t3) => t3.key === e2)?.multiple) {
      D(e2, t2);
      return;
    }
    if (t2 === "__all__") {
      D(e2, o);
      return;
    }
    let n3 = u(a2.value[e2]), r3 = n3.findIndex((e3) => l(e3, t2));
    r3 >= 0 ? n3.splice(r3, 1) : n3.push(t2), D(e2, n3.length === 0 ? o : n3);
  }
  function k() {
    i2.value = x(a2.value), r2.value = !1, n2.onApply();
  }
  function A(e2) {
    i2.value = x({ ...i2.value, ...e2 }), a2.value = x(i2.value);
  }
  function j() {
    return p(i2.value);
  }
  return { visible: r2, applied: i2, draft: a2, filterGroups: f2, hasActiveFilters: g2, activeFilterCount: _, activeFilterSummary: y, activeFilterTooltip: b, openDrawer: S, closeDrawer: C, resetDraft: w, clearApplied: T, isDraftOptionSelected: E, updateDraftField: D, toggleDraftFieldOption: O, apply: k, setApplied: A, getApiParams: j };
}
export {g as n,c as t};