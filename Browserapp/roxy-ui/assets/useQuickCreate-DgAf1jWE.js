import {Cr as e,a as t,at as n,d as r,gr as i,h as a,jr as o,m as s,mt as c,nn as l,qt as u,r as d,s as f,v as p,xr as m} from "./utils-BIWenCnY.js";
import {C as h,D as g,Et as _,L as v,St as y,W as b,_t as x,b as S,d as C,en as w,f as T,h as E,in as D,jt as O,lt as k,m as ee,p as A,ut as j,x as M} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {p as N,s as te} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as P,n as F} from "./agent-BmSFI9WH.js";
import {m as I} from "./proxy-D7e36h-l.js";
import {r as L} from "./rich-html-link-VdBpR3Cm.js";
import {Z as ne} from "./basecomponent-ClhuVxJN.js";
import {t as R} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as z} from "./tooltip-BYYKWrvu.js";
import {t as B} from "./focustrap-DJJkEqE8.js";
import {n as re} from "./theme-mq6SsndU.js";
import {t as V} from "./rx-button-DyzuUt-V.js";
import {w as H} from "./hook-CnJE4hRq.js";
import {t as U} from "./format-_cvrr_iF.js";
import {t as W} from "./inputtext-Crzvb5jQ.js";
import {t as G} from "./useDialog-BC-nc8J-.js";
import {t as ie} from "./hooks-Jw3GridD.js";
import {a as ae} from "./quick-kroUOSn_.js";
import {a as K,o as q} from "./utils-CnUy4XUk.js";
import {t as J} from "./inplace-DdcGL3G8.js";
import {o as oe} from "./use-tag-menu-DZnIrtE9.js";
import {a as ce,n as le} from "./useAsyncGate-D7VA7DLY.js";
import {i as ue,n as de,r as fe} from "./createDefaultAccordions-CO1KkbkO.js";
import {t as pe} from "./api-extract-BlmYcIz7.js";
import {o as Y,r as he,t as ge} from "./form-inputs-CnnG6T0O.js";
import {t as _e} from "./useWindowCreateCore-01alf0RN.js";
var ve = { class: "profile-name-content" };
var ye = R(h({ __name: "profile-name", props: { workspaceName: {}, data: {}, openMessage: {}, showSort: { type: Boolean }, disabled: { type: Boolean, default: !1 }, readonly: { type: Boolean, default: !1 }, filterKeys: {} }, emits: ["refresh"], setup(t2, { emit: n2 }) {
  let r2 = n2, i2 = K(), o2 = y(t2.data.windowName), [s2, c2] = F();
  async function l2(t3, n3) {
    let { isRefresh: i3, fallback: o3, success: s3 } = { isRefresh: !1, success: () => {
    }, fallback: () => {
    }, ...n3 }, { code: l3, msg: u3 } = await a.window.userMdfWindowInfoSingleV2Create(t3);
    c2(l3, u3), l3 === 0 ? (e(s3) && s3(), i3 && r2("refresh")) : e(o3) && o3();
  }
  function u2(e2) {
    let n3 = o2.value.trim(), r3 = t2.data.windowName;
    n3 === r3 ? o2.value = t2.data.windowName : (Reflect.set(t2.data, "windowName", n3), l2({ id: t2.data.id, windowName: n3 }, { fallback: () => {
      o2.value = r3, Reflect.set(t2.data, "windowName", r3);
    } })), e2();
  }
  function d2() {
    o2.value = o2.value.startsWith(i2) ? "" : o2.value;
  }
  function f2(e2) {
    t2.disabled || t2.readonly || e2.stopPropagation();
  }
  return (e2, n3) => {
    let r3 = W, i3 = J, a2 = z, s3 = B;
    return b(), E("div", null, [j((b(), A(i3, { disabled: t2.disabled || t2.readonly, onClick: f2 }, { display: k(() => [j((b(), E("div", ve, [S(D(O(o2)), 1)])), [[a2, { value: O(o2), showDelay: 300, class: "profile-name-tooltip" }, void 0, { top: !0 }]])]), content: k(({ closeCallback: e3 }) => [M(r3, { modelValue: O(o2), "onUpdate:modelValue": n3[0] ||= (e4) => x(o2) ? o2.value = e4 : null, autofocus: "", size: "small", class: "window-name-input", onBlur: (t3) => u2(e3), onFocus: d2, onKeydown: N((t3) => u2(e3), ["enter"]) }, null, 8, ["modelValue", "onBlur", "onKeydown"])]), _: 1 }, 8, ["disabled"])), [[s3]])]);
  };
} }), [["__scopeId", "data-v-570a9730"]]);
var X = { width: "120px", height: "24px", borderRadius: "4px" };
function Z() {
  return { key: "browser.list", data: [{ title: $t("\u7F16\u53F7"), key: "windowSortNum", disabledToggle: !0, sortable: !0, slot: "profile", style: { width: "0%", minWidth: "180px" } }, { title: $t("\u7A97\u53E3\u540D\u79F0"), key: "name", disabledToggle: !0, sortable: !0, slot: "profileName", style: { width: "10%", minWidth: "160px" } }, { title: $t("\u64CD\u4F5C"), key: "open", disabledToggle: !0, slot: "open", style: { width: "12%", minWidth: "160px" } }, { title: $t("\u5907\u6CE8"), key: "note", headerSlot: "noteHeader", slot: "note", style: { minWidth: "75px" }, _cache: { extend: !1 } }, { title: $t("\u6807\u7B7E"), key: "tags", slot: "tags", style: { width: "10%", minWidth: "95px" } }, { title: $t("\u9879\u76EE"), key: "project", slot: "project", style: { width: "10%", minWidth: "95px" } }, { title: $t("\u521B\u5EFA\u65F6\u95F4"), key: "createTime", _visible: !1, skeleton: X, sortable: !0, getText: (e2) => e2.createTime ? U(new Date(e2.createTime), "yyyy/MM/dd HH:mm:ss") : "--", style: { width: "13%", minWidth: "140px" } }, { title: $t("\u66F4\u65B0\u65F6\u95F4"), key: "updateTime", _visible: !1, skeleton: X, sortable: !0, getText: (e2) => e2.updateTime ? U(new Date(e2.updateTime), "yyyy/MM/dd HH:mm:ss") : "--", style: { width: "13%", minWidth: "140px" } }, { title: $t("\u6700\u540E\u6253\u5F00"), key: "openTime", skeleton: X, sortable: !0, getText: (e2) => e2.openTime ? U(new Date(e2.openTime), "yyyy/MM/dd HH:mm:ss") : "--", style: { width: "13%", minWidth: "140px" } }, { title: $t("\u8F6C\u79FB\u65B9"), key: "transferUserName", getText: (e2) => e2.transferUserName || "--", _visible: !1, style: { width: "10%", minWidth: "120px" } }, { title: $t("\u5176\u4ED6"), key: "actions", alignFrozen: "right", slot: "actions", style: { width: "0%", minWidth: "80px", maxWidth: "80px" } }] };
}
var { check: Q } = l();
async function xe(e2 = {}) {
  let t2 = await s(), n2 = [{ type: "text", label: $t("\u7A97\u53E3\u540D\u79F0"), placeholder: $t("\u8BF7\u8F93\u5165\u7A97\u53E3\u540D\u79F0"), name: "windowName", icon: "base/rx_ic_browser" }, { type: "text", label: $t("\u7F16\u53F7"), placeholder: $t("\u8BF7\u8F93\u5165\u7F16\u53F7(\u591A\u4E2A\u7528\u82F1\u6587\u9017\u53F7\u5206\u9694)"), name: "sortNums", icon: "base/rx_ic_id" }, { separator: !0 }, { type: "Checkbox", label: $t("\u64CD\u4F5C\u7CFB\u7EDF"), name: "osList", icon: "base/rx_ic_laptop", getOptions: () => (t2.os || []).map((e3) => ({ parentName: "osList", value: e3.value, label: e3.label })), formatValue: (e3) => e3.value?.map((e4) => e4.value) }, { type: "Checkbox", name: "platformUrls", label: $t("\u4E1A\u52A1\u5E73\u53F0"), icon: "base/rx_ic_keys", search: !0, searchPlaceholder: $t("\u641C\u7D22\u4E1A\u52A1\u5E73\u53F0"), getOptions: async () => {
    let { data: e3 } = await a.window.userGetWindowPlatformAccountListList();
    return (e3?.rows || []).map((e4) => {
      let t3 = new URL(e4.platformUrl).hostname.replace(/.*\.(.*?)\..*/, "$1");
      return { parentName: "platformUrls", label: t3, value: t3 };
    });
  }, formatValue: (e3) => e3.value?.map((e4) => e4.value) }, { type: "Checkbox", name: "coreType", label: $t("\u5185\u6838"), icon: "base/rx_ic_chrome", getOptions: async () => [{ parentName: "coreType", label: "Chrome", value: u.Chrome }, { parentName: "coreType", label: "Firefox", value: u.Firefox }], formatValue: (e3) => e3.value?.map((e4) => e4.value) }, { separator: !0 }, { type: "Checkbox", name: "projectIds", label: $t("\u9879\u76EE"), icon: "base/rx_ic_stack", search: !0, searchPlaceholder: $t("\u641C\u7D22\u9879\u76EE"), getOptions: async () => {
    let { data: e3 } = await a.limit.userGetProjectInfoByWorkspaceList({ default: 2 });
    return (e3.rows || []).map((e4) => ({ parentName: "projectIds", value: `${e4.project_id}`, label: e4.projectName }));
  }, formatValue: (e3) => e3.value?.map((e4) => e4.value) }, { type: "Checkbox", name: "labelIds", label: $t("\u6807\u7B7E"), icon: "base/rx_ic_tag", search: !0, searchPlaceholder: $t("\u641C\u7D22\u6807\u7B7E\u6216\u6210\u5458"), getOptions: async () => {
    const { data } = await globalThis.__localApi.window.userGetLabelInfoList();
    return data.rows.map((row) => ({ parentName: "labelIds", value: String(row.id), label: row.name }));
  }, formatValue: (e3) => e3.value?.map((e4) => e4.value) }, { separator: !0 }, { type: "switch", name: "isOften", label: $t("\u6536\u85CF"), icon: "base/rx_ic_bookmark" }, { type: "textarea", label: $t("\u5907\u6CE8"), placeholder: $t("\u8BF7\u8F93\u5165\u5907\u6CE8"), name: "windowRemark", icon: "base/rx_ic_doc_article" }, { type: "switch", name: "openStatus", label: $t("\u5DF2\u6253\u5F00"), icon: "base/rx_ic_browsers_line" }, { separator: !0 }, { type: "date", name: "createTime", icon: "base/rx_ic_calendar", label: $t("\u521B\u5EFA\u65F6\u95F4"), placeholder: $t("\u8BF7\u9009\u62E9\u65F6\u95F4"), maxDate: /* @__PURE__ */ new Date(), selectionMode: "range", manualInput: !1, showButtonBar: !1, dateFormat: "yy/mm/dd", formatValue: (e3, t3, n3) => {
    let r2 = e3.value;
    if (r2) {
      r2[1] ??= r2[0];
      let [e4, t4] = r2.map((e5) => U(new Date(e5), "yyyy-MM-dd"));
      Object.assign(n3, { startDate: e4, endDate: t4 });
    }
    return r2;
  } }, { type: "date", name: "modfiyTime", icon: "base/rx_ic_calendar", label: $t("\u4FEE\u6539\u65F6\u95F4"), placeholder: $t("\u8BF7\u9009\u62E9\u65F6\u95F4"), maxDate: /* @__PURE__ */ new Date(), selectionMode: "range", manualInput: !1, showButtonBar: !1, dateFormat: "yy/mm/dd", formatValue: (e3, t3, n3) => {
    let r2 = e3.value;
    if (r2) {
      r2[1] ??= r2[0];
      let [e4, t4] = r2.map((e5) => U(new Date(e5), "yyyy-MM-dd"));
      Object.assign(n3, { startUpdateDate: e4, endUpdateDate: t4 });
    }
    return r2;
  } }];
  return r(n2, { ...e2, createTime: Array.isArray(e2.createTime) ? [new Date(e2.createTime[0]), new Date(e2.createTime[1])] : void 0, modfiyTime: Array.isArray(e2.modfiyTime) ? [new Date(e2.modfiyTime[0]), new Date(e2.modfiyTime[1])] : void 0 }), n2;
}
async function Se() {
  let e2 = Z(), { data: t2 } = await a.window.userGetWindowTableSortOrderList();
  return { data: { sortField: e2.data.find((e3) => e3.key === t2?.orderName && e3.sortable) ? t2?.orderName : void 0, sortOrder: o(t2?.orderType ?? "desc") }, onChange: (t3) => {
    let n2 = {};
    t3.sortField && e2.data.some((e3) => e3.key === t3.sortField && e3.sortable) && (n2.orderName = t3.sortField, n2.orderType = o(t3.sortOrder)), a.window.userSaveWindowTableSortOrderCreate(n2);
  } };
}
function Ce(e2 = {}) {
  let t2 = [].concat(e2), n2 = t2[0], r2 = t2.some((e3) => e3.proxyCategory !== "noproxy"), i2 = t2.length === 1 && n2?.proxyCategory === "noproxy", a2 = t2.length === 1 && n2?.proxyCategory !== "noproxy" && n2?.buyProxyType === I.resource;
  return [{ name: "edit", label: $t("\u7F16\u8F91\u7A97\u53E3"), icon: "base/rx_ic_edit", power: Q("Profiles_edit") }, { name: "addProxy", label: $t("\u6DFB\u52A0\u4EE3\u7406 IP"), icon: "base/rx_ic_plus", tooltip: $t("\u6DFB\u52A0\u4EE3\u7406 IP"), multiple: !0, multipleProps: { name: "G3", showLabel: !0 }, power: Q("Profiles_add_proxy_outside") }, { name: "transfer", label: $t("\u8F6C\u79FB\u7A97\u53E3"), icon: "base/rx_ic_transfer", tooltip: $t("\u8F6C\u79FB\u7A97\u53E3"), multiple: !0, power: Q("Profiles_transfer_window") }, { name: "moveToProject", label: $t("\u79FB\u52A8\u5230\u9879\u76EE"), icon: "base/rx_ic_stack_move", multiple: !0, power: Q("Profiles_move_project") }, { power: Q(["Profiles_edit", "Profiles_add_proxy_outside", "Profiles_transfer_window", "Profiles_move_project"], "any"), multiple: !0, separator: !0 }, { name: "open", label: $t("\u6253\u5F00\u7A97\u53E3"), icon: e2.coreType === u.Firefox ? "base/rx_ic_firefox" : "base/rx_ic_chrome", multiple: !0, multipleProps: { name: "G1", showLabel: !0, iconProps: { color: "var(--pattern-actionbar-icon-open)" } } }, { name: "createAutomation", label: $t("AI \u81EA\u52A8\u5316"), icon: "roxy-agent/rx-ic-logo", multiple: !0, multipleProps: { name: "G1.5", showLabel: !0 }, power: Q("Roxy_AI_Agent_All") }, { name: "close", label: $t("\u5173\u95ED\u7A97\u53E3"), icon: "base/rx_ic_shut_down", tooltip: $t("\u5173\u95ED\u7A97\u53E3"), multiple: !0, multipleProps: { name: "G2", showLabel: !0 } }, { separator: !0, multiple: !0 }, { name: "setAsDefaultBrowser", label: $t("\u8BBE\u4E3A\u9ED8\u8BA4\u6D4F\u89C8\u5668"), icon: "base/rx_ic_loptop_check" }, { name: "createDesktopShortcut", label: $t("\u521B\u5EFA\u684C\u9762\u5FEB\u6377\u65B9\u5F0F"), icon: "base/rx_ic_show_profile_2" }, { separator: !0 }, { name: "profileActions", label: $t("\u7A97\u53E3\u64CD\u4F5C"), icon: "base/rx_ic_browser", multiple: !0, power: Q(["Profiles_copy_window_id", "Profiles_export_window", "Profiles_edit"], "any"), items: [{ name: "view", label: $t("\u67E5\u770B\u7A97\u53E3"), icon: "base/rx_ic_browser", multiple: !1 }, { name: "restart", label: $t("\u91CD\u542F\u7A97\u53E3"), icon: "base/rx_ic_refresh", tooltip: $t("\u91CD\u542F\u7A97\u53E3") }, { name: "copyId", label: $t("\u590D\u5236\u7A97\u53E3 ID"), power: Q("Profiles_copy_window_id"), icon: "base/rx_ic_copy", multiple: !1 }, { name: "exportProfile", label: $t("\u5BFC\u51FA\u7A97\u53E3"), icon: "base/rx_ic_export", power: Q("Profiles_export_window") }, { name: "upgradeCore", label: $t("\u5347\u7EA7\u5185\u6838"), icon: "base/rx_ic_update", power: Q("Profiles_edit") }] }, { name: "proxyActions", label: $t("\u4EE3\u7406 IP \u64CD\u4F5C"), icon: "base/rx_ic_internet", multiple: !0, power: Q(["Profiles_select_proxy", "Profiles_add_proxy_outside", "Profiles_edit_proxy_outside", "Profiles_delete_proxy_outside", "Profiles_speed_test_proxy", "Cost_Center_all"], "any"), items: [{ separator: !0, power: Q("Cost_Center_all") }, { name: "chooseProxy", label: $t("\u9009\u62E9\u5DF2\u6709\u4EE3\u7406 IP"), icon: "base/rx_ic_exchange", power: Q("Profiles_select_proxy") }, ...i2 ? [{ name: "addProxy", label: $t("\u6DFB\u52A0\u4EE3\u7406 IP"), icon: "base/rx_ic_plus", power: Q("Profiles_add_proxy_outside"), multiple: !1 }] : [], ...a2 ? [{ name: "editProxy", label: $t("\u7F16\u8F91\u4EE3\u7406 IP"), icon: "base/rx_ic_edit", power: Q("Profiles_edit_proxy_outside"), multiple: !1 }] : [], { name: "checkProxy", label: $t("\u6D4B\u8BD5\u4EE3\u7406 IP"), icon: "base/rx_ic_speed_test", tooltip: r2 ? $t("\u6D4B\u8BD5\u4EE3\u7406 IP") : $t("\u672A\u7ED1\u5B9A\u4EE3\u7406 IP"), power: Q("Profiles_speed_test_proxy"), quick: !0, disabled: !r2 }, { name: "deleteProxy", label: $t("\u5220\u9664\u4EE3\u7406 IP"), icon: "base/rx_ic_bin_1", power: Q("Profiles_delete_proxy_outside"), disabled: !r2 }] }, { name: "platformAccountActions", label: $t("\u5E73\u53F0\u8D26\u53F7\u64CD\u4F5C"), icon: "base/rx_ic_keys", multiple: !0, power: Q(["Profiles_add_platform_outside", "Profiles_select_platform"], "any"), items: [{ name: "addPlatformAccount", label: $t("\u6DFB\u52A0\u5E73\u53F0\u8D26\u53F7"), icon: "base/rx_ic_plus", power: Q("Profiles_add_platform_outside") }, { name: "choosePlatformAccount", label: $t("\u9009\u62E9\u5DF2\u6709\u5E73\u53F0\u8D26\u53F7"), icon: "base/rx_ic_exchange", power: Q("Profiles_select_platform") }] }, { power: Q(["Profiles_copy_window_id", "Profiles_export_window", "Profiles_edit", "Profiles_select_proxy", "Profiles_add_proxy_outside", "Profiles_edit_proxy_outside", "Profiles_delete_proxy_outside", "Profiles_speed_test_proxy", "Profiles_add_platform_outside", "Profiles_select_platform", "Cost_Center_all"], "any"), separator: !0, multiple: !0 }, { name: "addNotes", label: $t("\u6DFB\u52A0\u5907\u6CE8"), icon: "base/rx_ic_doc_add", power: Q("Profiles_edit_remark"), multiple: !0 }, { name: "addTag", label: $t("\u6DFB\u52A0\u6807\u7B7E"), icon: "base/rx_ic_tag", power: Q(["Profiles_Label_add", "Profiles_select_label"]), multiple: !0 }, { name: "fav", label: e2.isOften ? $t("\u53D6\u6D88\u6536\u85CF") : $t("\u6536\u85CF"), icon: e2.isOften ? "base/rx_ic_bookmark_fill" : "base/rx_ic_bookmark", iconClass: e2.isOften ? "text-orange" : "", tooltip: e2.isOften ? $t("\u53D6\u6D88\u6536\u85CF") : $t("\u6536\u85CF") }, { separator: !0, multiple: !0 }, { name: "editCookies", label: $t("\u7F16\u8F91 Cookies"), icon: "base/rx_ic_cookies", power: Q("Profiles_edit_cookies"), multiple: !0 }, { name: "cookieRobot", label: $t("Cookie \u673A\u5668\u4EBA"), icon: "base/rx_ic_cookie_bot", suffixIcon: "base/fire", menuTooltip: $t("\u81EA\u52A8\u6A21\u62DF\u6D4F\u89C8\u884C\u4E3A\uFF0C\u751F\u6210\u771F\u5B9E Cookie\uFF0C\u9002\u7528\u4E8E\u517B\u53F7\u3001\u8D26\u53F7\u9884\u70ED\uFF0C\u964D\u4F4E\u8D26\u53F7\u98CE\u63A7\u98CE\u9669"), multiple: !0 }, { power: Q("Profiles_clear_cache"), separator: !0 }, { name: "clearCache", label: $t("\u6E05\u9664\u7F13\u5B58"), icon: "base/rx_ic_brush", power: Q("Profiles_clear_cache"), multiple: !0 }, { power: Q("Profiles_delete"), separator: !0, multiple: !0 }, { name: "delete", label: $t("\u5220\u9664\u7A97\u53E3"), icon: "base/rx_ic_bin_1", power: Q("Profiles_delete"), multiple: !0 }];
}
function $() {
  return [{ key: "name", label: $t("\u7A97\u53E3\u540D\u79F0"), icon: "base/rx_ic_browser", syntax: "name::" }, { key: "remark", label: $t("\u5907\u6CE8"), icon: "base/rx_ic_doc_article", syntax: "note::" }, { key: "account", label: $t("\u5E73\u53F0\u8D26\u53F7"), icon: "base/rx_ic_keys", syntax: "account::" }, { key: "proxy", label: $t("\u4EE3\u7406 IP"), icon: "base/rx_ic_internet", syntax: "proxy::" }, { key: "tag", label: $t("\u6807\u7B7E"), icon: "base/rx_ic_tag", syntax: "tag::" }, { key: "project_name", label: $t("\u9879\u76EE"), icon: "base/rx_ic_stack", syntax: "project::" }, { key: "sortNum", label: $t("\u7F16\u53F7"), icon: "base/rx_ic_id", syntax: "id::" }, { key: "os", label: $t("\u64CD\u4F5C\u7CFB\u7EDF"), icon: "base/rx_ic_laptop", syntax: "system::" }, { key: "coreVersion", label: $t("\u5185\u6838\u7248\u672C"), icon: "base/rx_ic_chrome", syntax: "kernel::" }];
}
var we = { class: "quick-create-editor flex flex-col overflow-hidden popup" };
var Te = { class: "flex shrink-0 items-start justify-between gap-4 px-6 pt-4 pb-2" };
var Ee = { class: "tt-primary text-5 font-600 leading-normal" };
var De = { class: "flex min-h-0 flex-1 overflow-hidden overflow-x-auto px-6" };
var Oe = { class: "flex min-h-0 min-w-0 flex-1 flex-col" };
var ke = { class: "footer flex shrink-0 items-center justify-end gap-2 px-4 py-4 min-h-16" };
var Ae = R(h({ __name: "quick", props: { template: {}, onClose: { type: Function }, onSaved: { type: Function } }, setup(e2) {
  te((e3) => ({ f9b7735c: O(H2) }));
  let t2 = e2, { realTheme: n2 } = P(re()), [, r2] = F(), [a2] = G(), o2 = y(), s2 = y();
  ce({ isBatch: y(!1), createCount: y(1), presetTemplate: o2, oneClickSettings: s2 });
  let c2 = y(de()), l2 = y(!0), u2 = y(!1), d2 = y(!1), { inputsGroup: f2, loading: p2, formGate: m2, canSubmit: h2, initialize: S2, shuffleFingerprint: N2, buildCreateParams: I2, prepareCreateParams: L2 } = _e(), R2 = C(() => f2.value?.[0] ?? []), B2 = C(() => u2.value && h2.value && !d2.value), H2 = C(() => n2.value === "light" ? `url('${i("browser/quick_create_bg_light.svg")}')` : `url('${i("browser/quick_create_bg_dark.svg")}')`);
  v(async () => {
    u2.value = !1;
    let e3 = t2.template ?? {};
    await S2(e3, { refreshFingerprint: Object.keys(e3).length === 0 }), u2.value = !0;
  });
  async function U2(e3) {
    if (B2.value) {
      await m2.waitUntilReady(), d2.value = !0;
      try {
        let n3 = e3 ? await L2() : I2();
        await t2.onSaved?.({ formData: n3, createAndRun: e3 });
      } catch (e4) {
        console.error("[QuickCreate] save template failed", e4), r2(-1, e4?.message || $t("\u4FDD\u5B58\u914D\u7F6E"));
      } finally {
        d2.value = !1;
      }
    }
  }
  async function W2() {
    return await U2(!0);
  }
  return (e3, n3) => {
    let r3 = ne, i2 = z;
    return b(), E("div", we, [T("div", Te, [T("div", Ee, D(e3.$t("\u5FEB\u901F\u521B\u5EFA")), 1), M(r3, { class: "mt-1 shrink-0 cursor-pointer", name: "base/rx_ic_delete", size: "20", color: "var(--colors-icon-icon-secondary)", onClick: n3[0] ||= (e4) => t2.onClose?.() })]), T("div", De, [T("div", { class: w(["ma-auto flex h-full min-h-0 w-full gap-8", [O(l2) ? "min-w-192 max-w-192" : "min-w-240 max-w-285"]]) }, [T("div", Oe, [M(le, { class: "min-h-0 min-w-0 flex-1", accordions: O(c2), "inputs-group": O(f2) }, { before: k(() => [O(u2) ? (b(), A(ue, { key: 0, "window-inputs": O(R2), "autofill-window-name": !1 }, null, 8, ["window-inputs"])) : ee("", !0)]), _: 1 }, 8, ["accordions", "inputs-group"]), T("div", ke, [j(M(O(V), { severity: "secondary", outlined: "", label: e3.$t("\u4FDD\u5B58\u5E76\u8FD0\u884C"), disabled: !O(B2), loading: O(d2) || O(p2), onClick: W2 }, null, 8, ["label", "disabled", "loading"]), [[i2, O(B2) ? "" : e3.$t("\u6B63\u5728\u751F\u6210\u65B0\u6307\u7EB9\uFF0C\u8BF7\u7A0D\u540E"), void 0, { top: !0 }]]), j(M(O(V), { label: e3.$t("\u4FDD\u5B58\u914D\u7F6E"), disabled: !O(B2), loading: O(d2) || O(p2), onClick: n3[1] ||= (e4) => U2(!1) }, null, 8, ["label", "disabled", "loading"]), [[i2, O(B2) ? "" : e3.$t("\u6B63\u5728\u751F\u6210\u65B0\u6307\u7EB9\uFF0C\u8BF7\u7A0D\u540E"), void 0, { top: !0 }]])])]), M(fe, { collapsed: O(l2), "onUpdate:collapsed": n3[2] ||= (e4) => x(l2) ? l2.value = e4 : null, "inputs-group": O(f2), "is-batch": !1, "create-count": 1, "is-import": !1, "on-shuffle": O(N2) }, null, 8, ["collapsed", "inputs-group", "on-shuffle"])], 2)])]);
  };
} }), [["__scopeId", "data-v-72ae8440"]]);
function je() {
  return !1;
}
function Me() {
  let { isOwner: e2 } = P(n()), r2 = p(), { fetchUserInfo: i2 } = r2, { userConfig: o2 } = P(r2), { getWorkspaceList: l2 } = c(), { getProjects: u2 } = oe(), { handleBusinessCode: h2 } = H(), { testProxy: v2 } = ie(), [, y2] = F(), [b2] = G();
  function x2() {
    return e2.value;
  }
  async function S2() {
    let { code: e3, data: t2, msg: n2 } = await a.window.userGetQuickCreateTemplateList();
    return y2(e3, n2), e3 !== 0 || !t2 ? null : { id: t2.id, templateInfo: Y(t2.templateInfo && typeof t2.templateInfo == "object" ? t2.templateInfo : {}) };
  }
  async function C2(e3, t2) {
    let n2 = Y(e3), { code: r3, msg: i3 } = t2 ? await a.window.userMdfQuickCreateTemplateCreate({ id: t2, ...n2 }) : await a.window.userAddQuickCreateTemplateCreate(n2);
    return y2(r3, i3), r3 === 0;
  }
  async function w2() {
    let e3 = await u2(), t2 = e3.find((e4) => e4.projectDefault) ?? e3[0];
    return { projectName: t2?.label || $t("\u672A\u6307\u5B9A\u9879\u76EE"), projectId: t2?.value, labelIds: [], windowRemark: "", projectDefault: +!!t2 };
  }
  async function T2() {
    let { code: e3, msg: t2 } = await a.window.userCheckWindowTotalCountList();
    return e3 === 0 || (h2(e3, () => y2(e3, t2)), !1);
  }
  async function E2(e3, n2) {
    if (!await T2()) return !1;
    let [r3, c2] = await he(e3), u3 = await ge(r3);
    Object.assign(c2, u3[0]);
    let p2 = await w2(), h3 = d(_(p2), (e4) => !m(e4)), g2 = f(r3, h3);
    if (!q(g2.windowName)) {
      let e4 = r3[0] ?? [], n3 = await ae({ accounts: t(e4, "windowPlatformList")?.value, proxyList: t(e4, "proxyInfoList")?.value });
      n3 && (g2.windowName = n3);
    }
    let b3 = Y({ createCount: 1, ..._(c2), ...g2 }), x3 = Y(await pe(b3, { checkChannel: o2.value.ipChecker, isDirect: !1, testProxy: v2 })), { code: S3, data: C3, msg: E3 } = await a.window.userAddWindowInfoV2Create(x3);
    if (y2(S3, E3), S3 !== 0) return !1;
    l2(), i2();
    let D3 = n2?.openAfterCreate ?? je();
    return L.emit("refreshProfileList", D3 ? C3?.windowId : void 0), !0;
  }
  async function D2() {
    let e3 = await S2();
    return b2({ showHeader: !1, modal: !0, blockScroll: !0, pt: { root: { class: "quick-create-dialog" }, content: { class: "!pa-0 !overflow-hidden" } }, slots: { container: ({ hideModal: t2 }) => g(Ae, { template: e3?.templateInfo ?? {}, onClose: t2, onSaved: async (n2) => {
      if (!await C2(n2.formData, e3?.id)) throw Error("Failed to save quick create template");
      t2(), n2.createAndRun && await E2(n2.formData);
    } }) } });
  }
  async function O2() {
    await T2() && await E2((await S2())?.templateInfo ?? {});
  }
  async function k2() {
    await D2();
  }
  return { canQuickCreate: x2, fetchQuickCreateTemplate: S2, saveQuickCreateTemplate: C2, createAndOpenFromFormData: E2, openQuickCreateEditor: D2, onQuickCreateMainClick: O2, onQuickCreateSettingsClick: k2 };
}
export {Se as a,Ce as i,$ as n,Z as o,xe as r,ye as s,Me as t};