import {h as e,mt as t,or as n,v as r} from "./utils-BIWenCnY.js";
import {C as i,L as a,St as o,W as s,_t as c,at as l,d as u,en as d,f,h as p,in as m,jt as h,lt as g,m as _,p as v,ut as y,x as b} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as x} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as S,n as C} from "./agent-BmSFI9WH.js";
import {t as w} from "./ry-table-do6kugym.js";
import {n as T} from "./workspace-CNvgSgaH.js";
import {Z as E} from "./basecomponent-ClhuVxJN.js";
import {t as D} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as O} from "./tooltip-BYYKWrvu.js";
import {t as k} from "./rx-button-DyzuUt-V.js";
import {t as A} from "./rx-alert-A_y5uvgP.js";
import {t as j} from "./custom-empty-CChX4pJt.js";
import {t as M} from "./platform-icon-Cvcj894X.js";
import {a as N,i as P,n as F,r as I} from "./useProxyFormDrawer-r-7UykRS.js";
import {t as L} from "./account-2bDq0W_G.js";
var R = { class: "w-full h-full min-h-6 flex items-center gap-1 select-none" };
var z = ["title"];
var B = { key: 0, class: "cell_actions row-hover-action" };
var V = D(i({ __name: "account-field-cell", props: { value: {}, masked: { type: Boolean }, showCopy: { type: Boolean }, showEdit: { type: Boolean }, showMasked: { type: Boolean } }, emits: ["edit", "toggleMasked"], setup(e2, { emit: t2 }) {
  let r2 = t2, [i2] = C();
  function a2(e3, t3) {
    return e3 ? t3 ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : e3 : "--";
  }
  function o2() {
    e2.value && !e2.masked && (n(e2.value), i2(0, $t("\u5DF2\u590D\u5236")));
  }
  function c2() {
    e2.showMasked && r2("toggleMasked");
  }
  return (t3, n2) => {
    let i3 = k, l2 = O;
    return s(), p("div", R, [f("span", { class: "min-w-0 tt-primary text-3 leading-4 font-500 truncate", title: e2.masked ? void 0 : e2.value, onClick: x(c2, ["stop"]) }, m(a2(e2.value, e2.masked)), 9, z), e2.showCopy || e2.showEdit ? (s(), p("div", B, [e2.showCopy && e2.value && !e2.masked ? y((s(), v(i3, { key: 0, class: "shrink-0", text: "", severity: "secondary", size: "xxs", icon: "base/rx_ic_copy", onClick: x(o2, ["stop"]) }, null, 512)), [[l2, { value: t3.$t("\u590D\u5236"), showDelay: 500 }, void 0, { top: !0 }]]) : _("", !0), e2.showEdit && !e2.masked ? y((s(), v(i3, { key: 1, class: "shrink-0", text: "", severity: "secondary", size: "xxs", icon: "base/rx_ic_edit", onClick: n2[0] ||= x((e3) => r2("edit"), ["stop"]) }, null, 512)), [[l2, { value: t3.$t("\u7F16\u8F91"), showDelay: 500 }, void 0, { top: !0 }]]) : _("", !0), e2.showMasked ? y((s(), v(i3, { key: 2, class: "shrink-0", text: "", severity: "secondary", size: "xxs", icon: e2.masked ? "base/rx_ic_hidden" : "base/rx_ic_eye", onClick: x(c2, ["stop"]) }, null, 8, ["icon"])), [[l2, { value: e2.masked ? t3.$t("\u663E\u793A") : t3.$t("\u9690\u85CF"), showDelay: 500 }, void 0, { top: !0 }]]) : _("", !0)])) : _("", !0)]);
  };
} }), [["__scopeId", "data-v-27d7d4ce"]]);
var H = { class: "flex flex-col flex-1 gap-0.5 min-w-0" };
var U = ["title"];
var W = { class: "flex items-center gap-1.5 min-w-0" };
var G = ["title"];
var K = D(i({ __name: "platform-info-cell", props: { data: {}, readonly: { type: Boolean } }, setup(e2) {
  return (t2, n2) => {
    let r2 = E, i2 = O;
    return y((s(), p("div", { class: d(["platform-info-cell", { "platform-info-cell--readonly": e2.readonly }]) }, [e2.data.platformIcon ? (s(), v(M, { key: 0, "platform-icon": e2.data.platformIcon, "platform-icon-dark": e2.data.platformIconDark, class: "w-6 shrink-0" }, null, 8, ["platform-icon", "platform-icon-dark"])) : (s(), v(r2, { key: 1, name: "base/rx_ic_user_key", color: "var(--colors-icon-icon-tertiary, #7C8387)", size: "24" })), f("div", H, [f("div", { class: "platform-info-cell__title", title: e2.data.platformUrl }, m(e2.data.platformUrl || "--"), 9, U), f("div", W, [f("span", { class: "platform-info-cell__subtitle", title: e2.data.platformUserName }, m(e2.data.platformUserName || "--"), 9, G), e2.data.platformEfa ? (s(), v(r2, { key: 0, class: "text-blue shrink-0", name: "base/rx_ic_2fa", size: 16 })) : _("", !0)])])], 2)), [[i2, e2.readonly ? void 0 : { value: t2.$t("\u70B9\u51FB\u7F16\u8F91/\u67E5\u770B\u8BE6\u60C5"), showDelay: 500 }, void 0, { top: !0 }]]);
  };
} }), [["__scopeId", "data-v-1e72e3ee"]]);
function q(e2) {
  if (!e2) return [];
  if (Array.isArray(e2)) return e2.map(Number).filter(Boolean);
  try {
    let t2 = JSON.parse(String(e2));
    return Array.isArray(t2) ? t2.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}
function J(e2, t2 = !0) {
  let n2 = [e2.platformUrl, e2.platformUserName];
  return t2 && e2.platformPassword && n2.push(e2.platformPassword), e2.platformEfa && n2.push(e2.platformEfa), n2.filter(Boolean).join(":");
}
function Y(e2) {
  return F([{ title: $t("\u5E73\u53F0"), key: "status", disabledToggle: !0, slot: "platformInfo", style: { minWidth: "220px" } }, { title: $t("\u8D26\u53F7"), key: "platformUserName", slot: "userName", style: { minWidth: "130px" } }, { title: $t("\u5BC6\u7801"), key: "platformPassword", slot: "password", style: { minWidth: "130px" }, _cache: { visible: {} } }, { title: $t("\u5907\u6CE8"), key: "remark", headerSlot: "remarkHeader", slot: "remark", style: { minWidth: "75px" }, _cache: { extend: !1 } }, { title: $t("\u5DF2\u5173\u8054\u7A97\u53E3"), key: "related", slot: "related", style: { minWidth: "120px" } }, { title: $t("\u6253\u5F00\u7A97\u53E3"), key: "open", disabledToggle: !0, slot: "open", style: { minWidth: "120px" } }], e2);
}
function X(e2) {
  let { userConfig: t2 } = S(r()), { columns: n2, updateColumns: i2, updateRemarkDisplayStatus: o2 } = I({ key: "platform.list", data: Y(e2) });
  return a(() => {
    i2((e3) => {
      let n3 = e3.find((e4) => e4.key === "remark");
      n3?._cache && Reflect.set(n3._cache, "extend", t2.value.remarkDisplayStatus);
    });
  }), { columns: n2, updateRemarkDisplayStatus: o2 };
}
function Z(e2) {
  let n2 = T(t().currentWorkspace?.workspaceName);
  return q(e2.window_info).map((e3) => `${n2}-${e3}`);
}
var Q = { class: "flex flex-col gap-3 h-full account-content" };
var $ = { class: "flex-ovh-1" };
var ee = { class: "w-full flex justify-end gap-3 button-group" };
var te = D(i({ __name: "quick", props: { data: {}, isBatch: { type: Boolean, default: !1 }, createCount: { default: 1 }, accountType: { default: () => L.Order } }, emits: ["confirm", "close"], setup(t2, { emit: n2 }) {
  let r2 = n2, i2 = Y({ filters: ["actions", "open"] }), a2 = l("quick"), m2 = [{ key: "platform", label: $t("\u5E73\u53F0\u540D\u79F0"), icon: "base/rx_ic_keys", syntax: "platform::" }, { key: "account", label: $t("\u8D26\u53F7\u540D\u79F0"), icon: "base/rx_ic_user_key", syntax: "account::" }, { key: "remark", label: $t("\u5907\u6CE8"), icon: "base/rx_ic_doc_article", syntax: "note::" }], _2 = o(S2(t2.data?.windowPlatformList)), v2 = u(() => _2.value?.length ?? 0);
  function S2(e2) {
    let t3 = e2?.filter((e3) => e3?.id != null && e3.id !== 0) ?? [];
    return t3.length ? t3 : void 0;
  }
  function C2(e2) {
    let { key: t3, value: n3 } = e2 || {};
    a2.value?.refresh({ queryKey: n3 && (t3 || "name_remark"), queryValue: n3 }, !0);
  }
  async function T2(t3) {
    let n3 = await e.platform.userGetPlatformInfoV2List(t3);
    if (n3.code === 0 && _2.value?.length) {
      let e2 = n3.data?.rows ?? [];
      _2.value = _2.value.map((t4) => e2.find((e3) => e3.id === t4.id) ?? t4);
    }
    return n3;
  }
  function D2() {
    r2("confirm", _2.value ?? []), r2("close");
  }
  return (e2, n3) => {
    let r3 = j, a3 = w, o2 = k, l2 = O;
    return s(), p("div", Q, [b(h(A), { class: "w-full", visible: t2.isBatch && t2.accountType === h(L).Order, closable: !1, type: h(v2) > t2.createCount ? "warn" : "info", title: e2.$t("{count} \u4E2A\u7A97\u53E3\u5C06\u4F1A\u7ED1\u5B9A\u8D26\u53F7\u3002\u60A8\u521B\u5EFA\u7684\u7A97\u53E3\u6570\u4E3A\uFF1A{max}\u3002{message}", { count: h(v2), max: t2.createCount, message: h(v2) > t2.createCount ? e2.$t("\u5F53\u524D\u9009\u62E9\u7ED1\u5B9A\u7684\u8D26\u53F7\u6570\u91CF\u5DF2\u8D85\u8FC7\u521B\u5EFA\u7A97\u53E3\u6570\u3002") : "" }) }, null, 8, ["visible", "type", "title"]), b(N, { options: m2, search: C2, clear: C2 }), f("div", $, [b(a3, { ref: "quick", selection: h(_2), "onUpdate:selection": n3[0] ||= (e3) => c(_2) ? _2.value = e3 : null, "multiple-operation": !1, "selection-mode": "multiple", "table-request": T2, columns: h(i2), "clear-selection-on-request": !1, "virtual-scroller-options": { itemSize: 60 }, "show-table-header": !1, "show-display": !1, "context-menu": !1, "show-actions": !1 }, { "table-empty": g(() => [b(r3, { icon: "rx_illustration_lock.svg", title: e2.$t("\u6682\u65E0\u5E73\u53F0\u8D26\u53F7") }, null, 8, ["title"])]), platformInfo: g(({ data: e3 }) => [b(K, { data: e3 }, null, 8, ["data"])]), userName: g(({ data: e3 }) => [b(V, { value: e3.platformUserName }, null, 8, ["value"])]), password: g(({ data: e3, column: { _cache: t3 } }) => [b(V, { value: e3.platformPassword, masked: !t3.visible[e3.id] }, null, 8, ["value", "masked"])]), remark: g(({ data: e3 }) => [y(b(h(E), { name: e3.platformRemarks ? "base/rx_ic_doc_fill" : "base/rx_ic_doc_add", class: d({ "color-[#12A3FC]": e3.platformRemarks }) }, null, 8, ["name", "class"]), [[l2, { value: e3.platformRemarks, showDelay: 500 }, void 0, { top: !0 }]])]), related: g(({ data: e3 }) => [b(P, { list: h(Z)(e3) }, null, 8, ["list"])]), _: 1 }, 8, ["selection", "columns"])]), f("div", ee, [b(o2, { size: "sm", label: e2.$t("\u4FDD\u5B58"), onClick: x(D2, ["stop"]) }, null, 8, ["label"])])]);
  };
} }), [["__scopeId", "data-v-4bdd4926"]]);
export {q as a,J as i,Z as n,K as o,X as r,V as s,te as t};