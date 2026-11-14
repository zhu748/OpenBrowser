import {Kt as e,Pr as r,at as i,h as a,mt as c,o as l,r as d,ti as p,v as m,xr as h} from "./utils-BIWenCnY.js";
import {C as g,Et as v,L as b,P as S,St as w,V as T,W as E,Y as D,Z as O,_t as k,b as j,d as M,en as N,f as P,h as F,i as I,in as L,jt as R,k as ee,lt as z,m as B,p as V,q as H,st as ne,x as U} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as W,o as oe} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as ce,o as le,r as ue,t as de} from "./cookie-CqdL0VrU.js";
import {a as G,n as K} from "./agent-BmSFI9WH.js";
import {n as fe} from "./permission-DOhNJfB3.js";
import {c as pe,d as me} from "./useProfileProxy-Cbqapbxb.js";
import {s as ge} from "./proxy-D7e36h-l.js";
import {b as _e,r as ve,y as ye} from "./rich-html-link-VdBpR3Cm.js";
import {n as be} from "./workspace-CNvgSgaH.js";
import {Z as q} from "./basecomponent-ClhuVxJN.js";
import {t as J} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as Y} from "./rx-button-DyzuUt-V.js";
import {t as Te} from "./format-_cvrr_iF.js";
import {n as Ee} from "./useRouteContext-Cfh7KChG.js";
import {t as X} from "./rx-alert-A_y5uvgP.js";
import {t as Z} from "./m-input-number-BOH1hUUB.js";
import {n as Oe,t as ke} from "./inputicon-Bn1KerIx.js";
import {t as Me} from "./useDialog-BC-nc8J-.js";
import {t as Ne} from "./rx-toggle-switch-BI8eb18U.js";
import {t as Fe} from "./message-SBZQdXpt.js";
import {n as Re} from "./proxy-shop-labels-nJaBS4W_.js";
import {t as ze} from "./m-input-textarea-33WQDaSq.js";
import {o as Be} from "./useProxyFormDrawer-r-7UykRS.js";
import {t as Ve} from "./utils-CnUy4XUk.js";
import {n as Q,t as He} from "./useProfileEntityLabels-BfqbVpel.js";
import {t as Ue} from "./table-BJcS2I0Z.js";
import {a as We} from "./use-tag-menu-DZnIrtE9.js";
import {t as Ge} from "./rx-input-radio-BGeLgzak.js";
function ot(e2) {
  let { isEcommerce: c2 } = Ee(), l2 = M(() => He(c2.value)), u2 = M(() => {
    let t2 = R(e2.data);
    return `${t2.coreType} ${t2.coreVersion}`;
  }), d2 = M(() => !!R(e2.data).trashed), p2 = M(() => !1), h2 = M(() => ""), g2 = M(() => ""), v2 = M(() => {
    let t2 = R(e2.data), n2 = R(e2.openMessage), r2 = R(e2.text) ?? l2.value.open, i2 = n2[t2.dirId];
    if (!i2) return { msg: r2, classes: "cursor-pointer", error: t2.proxyExpireStatus === ge.expired ? l2.value.proxyExpiredBeforeOpen : void 0 };
    let { uploading: a2, pending: o2, code: s2, data: c3, error: u3 } = i2, d3 = s2 === 1 || !!u3, f2 = c3?.percent === 100, p3 = !(d3 || f2);
    return { code: s2, pending: o2, msg: d3 ? r2 : c3?.message ?? r2, percent: c3?.percent || 0, error: d3 ? i2.message || u3?.message : void 0, warning: c3?.warningMessages?.join(`
`), opening: p3, uploading: a2, completed: f2, classes: p3 || a2 ? "cursor-not-allowed" : "cursor-pointer" };
  }), y2 = M(() => {
    let e3 = v2.value;
    return d2.value || !!(e3.pending || e3.opening || e3.uploading);
  }), b2 = M(() => !!(v2.value.error || v2.value.warning));
  async function w2() {
    y2.value || (R(e2.driverObj) && e2.driverNext?.(), await e2.onOpen(R(e2.data)));
  }
  return { browser: v2, coreInfo: u2, isOpenLimitReached: d2, isCrossModeExpired: p2, crossModeExpiredTip: h2, isButtonDisabled: y2, usePeoples: g2, showErrorTooltip: b2, openBrowser: w2 };
}
var st = { key: 0, class: "flex flex-col cache" };
var ct = { key: 0, class: "cache-title" };
var lt = { key: 1, class: "cache-content" };
var ut = { class: "footer" };
var dt = J(g({ __name: "clear-cache", setup(t2) {
  let n2 = i(), r2 = Q(), a2 = ee("dialogRef"), o2 = w(), s2 = w(), c2 = w(), l2 = w(e.partial), u2 = M(() => [{ label: $t("\u6E05\u9664\u672C\u5730\u7F13\u5B58\uFF08\u4FDD\u7559\u63D2\u4EF6\uFF09"), value: e.partial, afterRender: () => l2.value === e.partial && U(X, { closable: !1, class: "!w-full", type: "warn", title: $t("\u8BF4\u660E") }, { content: () => U("div", { class: "whitespace-pre-wrap" }, [U(D("i18n-t"), { keypath: r2.value.clearCachePartialNote, scope: "global" }, { light: () => U("span", { class: "text-orange-400" }, [$t("\u767B\u5F55\u72B6\u6001\u4E0D\u4F1A\u5931\u6548")]) })]) }) }, { label: $t("\u6E05\u9664\u672C\u5730\u7F13\u5B58"), value: e.all, afterRender: () => l2.value === e.all && U(X, { closable: !1, class: "!w-full", type: "warn", title: $t("\u8BF4\u660E") }, { content: () => U("div", { class: "whitespace-pre-wrap" }, [U(D("i18n-t"), { keypath: r2.value.clearCacheAllNote, scope: "global" }, { light: () => U("span", { class: "text-orange-400" }, [$t("\u767B\u5F55\u72B6\u6001\u4E0D\u4F1A\u5931\u6548")]) })]) }) }].filter((e2) => e2.visible !== !1));
  function d2() {
    a2.value.close(), c2.value?.();
  }
  async function f2() {
    try {
      await s2.value?.(l2.value), d2();
    } catch (e2) {
      globalThis.__localUiError(e2.message);
    }
  }
  return T(() => {
    let { props: e2, onConfirm: t3, onCancel: n3 } = a2.value.data;
    o2.value = e2, s2.value = t3, c2.value = n3;
  }), (e2, t3) => {
    let n3 = Y;
    return R(o2) ? (E(), F("div", st, [R(o2).title ? (E(), F("div", ct, L(R(o2).title), 1)) : B("", !0), R(o2).content ? (E(), F("div", lt, L(R(o2).content), 1)) : B("", !0), U(Ge, { modelValue: R(l2), "onUpdate:modelValue": t3[0] ||= (e3) => k(l2) ? l2.value = e3 : null, name: "clearType", options: R(u2) }, null, 8, ["modelValue", "options"]), P("div", ut, [U(n3, { size: "sm", label: e2.$t("\u53D6\u6D88"), text: "", severity: "secondary", onClick: d2 }, null, 8, ["label"]), U(n3, { size: "sm", label: e2.$t("\u4FDD\u5B58"), onClick: f2 }, null, 8, ["label"])])])) : B("", !0);
  };
} }), [["__scopeId", "data-v-c30b136e"]]);
var ft = { class: "flex flex-col popup" };
var pt = { class: "flex flex-col popup-content" };
var mt = { class: "flex flex-col popup-block" };
var ht = { class: "popup-block__title" };
var gt = { class: "popup-block__description" };
var _t = { class: "flex flex-col popup-block" };
var vt = { class: "popup-block__title" };
var yt = { class: "popup-block__tip" };
var bt = { class: "h-80 flex flex-col popup-block" };
var xt = { class: "popup-block__title" };
var St = { class: "flex-ovh-1 table-container" };
var Ct = { class: "footer" };
var wt = 5;
var Tt = J(g({ __name: "export-profiles", setup(e2) {
  let t2 = ee("dialogRef"), [n2, r2] = K(), i2 = Q(), o2 = Re(), s2 = w(), c2 = w(), l2 = w(), u2 = w(), d2 = w(!0), f2 = [{ header: "All", field: "name" }], m2 = M(() => [{ key: "windowName", name: i2.value.entityName }, { key: "os", name: $t("\u64CD\u4F5C\u7CFB\u7EDF"), getText: (e3) => e3.os === "IOS" ? "iOS" : e3.os }, ...p() ? [{ key: "coreType", name: $t("\u6D4F\u89C8\u5668\u5185\u6838") }, { key: "coreVersion", name: $t("\u5185\u6838\u7248\u672C") }] : [], { key: "osVersion", name: $t("\u7CFB\u7EDF\u7248\u672C") }, { key: "proxyCategory", name: o2.value.entityTypeColumn, getText: (e3) => e3.proxyCategory === "noproxy" ? "\u76F4\u8FDE" : e3.proxyCategory?.toLocaleUpperCase() }, { key: "proxyInfo", name: o2.value.entityInfoColumn, getText: (e3) => {
    if (!e3.host) return "";
    let t3 = e3.ipType.toLocaleLowerCase() === "ipv4" ? "" : "ipv6:", n3 = e3.proxyUserName ? `:${e3.proxyUserName}:${e3.proxyPassword}` : "", r3 = e3.refreshUrl ? `[${e3.refreshUrl}]` : "";
    return `${t3}${e3.host}:${e3.port}${n3}${r3}`;
  } }, { key: "windowPlatformList", name: $t("\u5E73\u53F0\u8D26\u53F7"), getText: (e3) => {
    let t3 = e3.windowPlatformList?.map((e4) => [e4.platformUrl, e4.platformUserName, e4.platformPassword, e4.platformEfa].filter(Boolean).join(":"));
    return d2.value ? JSON.stringify(t3, null, 2) : JSON.stringify(t3);
  } }, { key: "defaultOpenUrl", name: $t("\u81EA\u5B9A\u4E49\u6253\u5F00 URL"), getText: (e3) => JSON.stringify(e3.defaultOpenUrl || "[]") }, { key: "cookie", name: "Cookie", getText: (e3) => {
    let t3 = ce(e3.cookie), n3 = t3.length ? JSON.stringify(t3) : "";
    if (d2.value && n3.length >= 32767) {
      let t4 = $t("[{name}] \u7684 cookies \u957F\u5EA6\u8D85\u8FC7 Excel \u6587\u6863\u9650\u5236\uFF0C\u8BF7\u4F7F\u7528 txt \u683C\u5F0F\u8FDB\u884C\u5BFC\u51FA\u3002", { name: `${s2.value.workspaceName}-${e3.windowSortNum}` });
      throw r2(-1, t4, { severity: "warn", life: 5e3 }), Error(t4);
    }
    return n3;
  } }, { key: "windowRemark", name: $t("\u5907\u6CE8") }, { key: "userAgent", name: "User-Agent" }, { key: "searchEngine", name: $t("\u641C\u7D22\u5F15\u64CE") }, { key: "dirId", name: i2.value.entityId }].map((e3, t3) => ({ ...e3, _index: t3 }))), h2 = w([]);
  async function g2() {
    let e3 = s2.value.data.map((e4) => e4.id), { data: { rows: t3 } } = await a.window.userGetWindowInfoV2List({ windowIds: e3.join(","), isDelete: 0, page_index: 1, page_size: e3.length }), n3 = h2.value.sort((e4, t4) => e4._index - t4._index);
    return t3.map((e4) => n3.reduce((t4, n4) => (t4[n4.key] || (t4[n4.key] = n4.getText?.(e4) ?? e4[n4.key] ?? ""), t4), {}));
  }
  async function _2() {
    let e3 = await g2(), t3 = e3.some((e4) => e4.dirId);
    Ve({ afterAddColumns: (e4) => t3 ? [...e4, { header: i2.value.entityIdExportOnly, key: "dirId" }] : e4, afterAddExplain: (t4) => {
      t4.addRows(e3);
    } });
  }
  async function v2() {
    let e3 = (await g2()).map((e4) => Object.entries(e4).map(([e5, t4]) => `${e5}=${t4}`).join(`
`)).join(`

${"#".repeat(40)}

`), t3 = new Blob([e3], { type: "text/plain" }), n3 = document.createElement("a");
    n3.href = URL.createObjectURL(t3), n3.download = `rx_profiles_${Te(/* @__PURE__ */ new Date(), "yyyy-MM-dd HH_mm_ss")}.txt`, document.body.appendChild(n3), n3.click(), document.body.removeChild(n3);
  }
  function y2() {
    t2.value.close(), l2.value?.();
  }
  async function b2() {
    try {
      d2.value ? await _2() : await v2(), y2();
    } catch (e3) {
      console.warn(e3);
    }
  }
  return T(() => {
    let { props: e3, onConfirm: n3, onCancel: r3 } = t2.value.data;
    s2.value = e3, c2.value = n3, l2.value = r3, u2.value = e3.data.slice(0, wt).map((e4) => `${s2.value.workspaceName}-${e4.windowSortNum}`).join(", ") + (e3.data.length > wt ? `, ...(${e3.data.length - wt} more)` : ""), h2.value = m2.value.slice(0, -1);
  }), (e3, t3) => {
    let n3 = Ge, r3 = Y;
    return E(), F("div", ft, [P("div", pt, [P("div", mt, [P("div", ht, L(R(i2).exportEntities), 1), P("div", gt, L(R(u2)), 1)]), P("div", _t, [P("div", vt, L(e3.$t("\u8BF7\u9009\u62E9\u60A8\u7684\u6587\u4EF6\u683C\u5F0F:")), 1), U(n3, { modelValue: R(d2), "onUpdate:modelValue": t3[0] ||= (e4) => k(d2) ? d2.value = e4 : null, size: "xs", name: "proxySwitch", options: [{ label: "Excel (.xls)", value: !0 }, { label: "Text (.txt)", value: !1 }] }, null, 8, ["modelValue"]), P("div", yt, L(R(i2).exportCookieTip), 1)]), P("div", bt, [P("div", xt, L(e3.$t("\u8BF7\u9009\u62E9\u60A8\u8981\u5BFC\u51FA\u7684\u6570\u636E:")), 1), P("div", St, [U(Ue, { selection: R(h2), "onUpdate:selection": t3[1] ||= (e4) => k(h2) ? h2.value = e4 : null, "data-key": "key", columns: f2, "data-list": R(m2), regions: { header: !1, paginator: !1, actions: !1, selectionBar: !1 }, "selection-mode": "multiple", size: "small" }, null, 8, ["selection", "data-list"])])])]), P("div", Ct, [U(r3, { size: "sm", label: e3.$t("\u53D6\u6D88"), text: "", severity: "secondary", onClick: W(y2, ["stop"]) }, null, 8, ["label"]), U(r3, { size: "sm", label: e3.$t("\u5BFC\u51FA\u6570\u636E"), onClick: W(b2, ["stop"]) }, null, 8, ["label"])])]);
  };
} }), [["__scopeId", "data-v-46023371"]]);
var rr = { class: "flex flex-col pt-4 px-4 min-w-124" };
var ir = { class: "flex-1" };
var ar = { class: "flex justify-end pt-4 pb-5" };
var or = g({ __name: "cookie-edit", props: { data: {} }, emits: ["confirm"], setup(e2, { emit: t2 }) {
  let n2 = t2, [r2, i2] = K(), o2 = w(""), s2 = w(!1), c2 = w(!1);
  b(() => {
    l2();
  });
  async function l2() {
    if (!e2.data?.id) return;
    let { data: { rows: [t3] } } = await a.window.userGetWindowInfoV2List({ windowIds: e2.data.id, isDelete: 0, page_index: 1, page_size: 1 });
    o2.value = h(t3.cookie) ? "" : le(t3.cookie);
  }
  function u2(e3) {
    let t3 = e3.target.value;
    de(t3) ? c2.value = !1 : c2.value = !0;
  }
  function d2() {
    let e3 = o2.value?.trim() || "";
    e3 ? de(e3) ? (s2.value = !0, n2("confirm", ue(e3) ?? [])) : (c2.value = !0, i2(-1, $t("Cookie \u683C\u5F0F\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u683C\u5F0F"))) : (s2.value = !0, n2("confirm", []));
  }
  return (e3, t3) => {
    let n3 = Fe, r3 = Y;
    return E(), F("div", rr, [P("div", ir, [U(ze, { modelValue: R(o2), "onUpdate:modelValue": t3[0] ||= (e4) => k(o2) ? o2.value = e4 : null, "field-props": { pt: { root: "h-full" } }, placeholder: e3.$t(`\u652F\u6301\u683C\u5F0F: JSON\u3001Netscape\u3001Name=Value
Name=Value \u683C\u5F0F\u884C\u9996\u5FC5\u987B\u6307\u5B9A domain=...; \u5B57\u6BB5\u503C\uFF0C\u5426\u5219\u65E0\u6548`), cols: "40", "auto-resize": !1, invalid: R(c2), pt: { root: "h-full" }, onBlur: u2 }, null, 8, ["modelValue", "placeholder", "invalid"]), R(c2) ? (E(), V(n3, { key: 0, severity: "error", size: "small", variant: "simple" }, { default: z(() => [j(L(e3.$t("Cookie \u683C\u5F0F\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u683C\u5F0F")), 1)]), _: 1 })) : B("", !0)]), P("div", ar, [U(r3, { label: e3.$t("\u4FDD\u5B58"), loading: R(s2), onClick: d2 }, null, 8, ["label", "loading"])])]);
  };
} });
var sr = { class: "relative w-140 flex flex-col gap-5 pa-6 rounded-2 overflow-hidden overflow-y-auto popup" };
var cr = { class: "flex flex-col gap-1 pb-2" };
var lr = { class: "flex justify-between items-center" };
var ur = { class: "title" };
var dr = { class: "desc" };
var fr = { class: "grid gap-4 items-center list" };
var pr = { key: 0, class: "subtitle" };
var mr = { class: "more" };
var hr = J(g({ __name: "cookie-robot", props: { data: {}, onConfirm: { type: Function } }, emits: ["close"], setup(e2) {
  let [t2, n2] = K(), i2 = Q(), a2 = oe("panel"), o2 = w(!1);
  function s2(t3) {
    return [{ id: 1, items: [{ label: $t("\u7F16\u53F7"), class: "!self-start pt-1", component: () => U("div", { class: "flex items-end gap-3 flex-wrap overflow-hidden" }, [e2.data.map((e3) => U("div", { class: `shrink-0 py-1 px-1.5 rounded-1 ${a2.tag}` }, [`${be(e3.workspaceName)}-${e3.windowSortNum}`]))]) }, { label: $t("\u76EE\u6807\u7F51\u7AD9"), name: "cookieRobotUrls", class: "!self-start pt-1", props: { size: "md", rows: 6, placeholder: `${$t("\u793A\u4F8B")}:
https://www.google.com
https://facebook.com` }, component: ({ item: e3, ...t4 }) => U("div", { class: "self-stretch flex flex-col gap-2" }, [U(ze, S(e3.props, t4), null), U("div", { class: a2.description }, [U("div", null, [$t("1\u3001\u8BF7\u8F93\u5165\u5B8C\u6574\u7684\u7F51\u5740, \u9700\u8981\u5305\u62EC https:// \u6216 http://")]), U("div", null, [$t("2\u3001\u5982\u9700\u8981\u6253\u5F00\u591A\u4E2A\u7F51\u5740, \u8BF7\u6309\u6BCF\u884C\u4E00\u4E2A\u7279\u5B9A\u7684\u7F51\u5740\u7684\u683C\u5F0F\u586B\u5199")])])]) }] }, { id: 2, subtitle: $t("\u6EDA\u52A8\u901F\u5EA6"), items: [{ label: $t("\u5355\u6B21\u6EDA\u52A8\u8303\u56F4"), name: "scrollRange", value: [], component: ({ item: e3 }) => U("div", { class: "flex items-center gap-3" }, [U(Oe, { class: "w-30" }, { default: () => [U(Z, { modelValue: e3.value[0], "onUpdate:modelValue": (t4) => e3.value[0] = t4, min: 100, placeholder: "100" }, null), U(ke, { class: "tip-text" }, { default: () => [j("px")] })] }), U("div", null, [j("~")]), U(Oe, { class: "w-30" }, { default: () => [U(Z, { modelValue: e3.value[1], "onUpdate:modelValue": (t4) => e3.value[1] = t4, min: 100, placeholder: "500" }, null), U(ke, { class: "tip-text" }, { default: () => [j("px")] })] })]) }, { label: $t("\u505C\u7559\u65F6\u957F"), name: "delayRange", value: [], component: ({ item: e3 }) => U("div", { class: "flex items-center gap-3" }, [U(Oe, { class: "w-30" }, { default: () => [U(Z, { modelValue: e3.value[0], "onUpdate:modelValue": (t4) => e3.value[0] = t4, min: 0, placeholder: "0" }, null), U(ke, { class: "tip-text" }, { default: () => [j("ms")] })] }), U("div", null, [j("~")]), U(Oe, { class: "w-30" }, { default: () => [U(Z, { modelValue: e3.value[1], "onUpdate:modelValue": (t4) => e3.value[1] = t4, min: 0, placeholder: "500" }, null), U(ke, { class: "tip-text" }, { default: () => [j("ms")] })] })]) }] }, { id: 3, subtitle: $t("\u66F4\u591A\u8BBE\u7F6E"), items: [{ label: $t("\u4E0D\u52A0\u8F7D\u56FE\u7247"), name: "forbidImage", value: !0, props: { trueValue: !1, falseValue: !0 }, component: ({ item: e3, ...t4 }) => U("div", { class: "flex items-center gap-3" }, [U(Ne, S(e3.props, t4), null), U("div", null, [$t("\u5F00\u542F")])]) }, { label: $t("\u4E0D\u52A0\u8F7D\u89C6\u9891"), name: "forbidMedia", value: !0, props: { trueValue: !1, falseValue: !0 }, component: ({ item: e3, ...t4 }) => U("div", { class: "flex items-center gap-3" }, [U(Ne, S(e3.props, t4), null), U("div", null, [$t("\u5F00\u542F")])]) }, { label: t3.closeEntity, name: "closeProfile", value: !1, component: ({ item: e3, ...n3 }) => U("div", { class: "flex items-center gap-3" }, [U(Ne, S(e3.props, n3), null), U("div", null, [t3.closeEntityAfterComplete])]) }, { label: $t("\u65E0\u5934\u6A21\u5F0F"), name: "startupParam", value: !1, props: { trueValue: "--headless=new", falseValue: "" }, component: ({ item: e3, ...t4 }) => U("div", { class: "flex items-center gap-3" }, [U(Ne, S(e3.props, t4), null), U("div", null, [$t("\u5F00\u542F\u540E\u4E0D\u663E\u793A\u6D4F\u89C8\u5668\u754C\u9762\uFF0C\u540E\u53F0\u81EA\u52A8\u64CD\u4F5C\u7F51\u9875")])]) }] }];
  }
  let { isEcommerce: c2 } = Ee(), l2 = w(s2(He(c2.value)));
  ne(c2, (e3) => {
    let t3 = Object.fromEntries(l2.value.flatMap((e4) => e4.items).filter((e4) => !!e4.name).map((e4) => [e4.name, v(e4.value)]));
    l2.value = s2(He(e3)), l2.value.flatMap((e4) => e4.items).filter((e4) => !!e4.name).forEach((e4) => {
      t3[e4.name] !== void 0 && (e4.value = t3[e4.name]);
    });
  });
  let u2 = M(() => o2.value ? l2.value : l2.value.slice(0, 1));
  async function d2() {
    let t3 = Object.fromEntries(l2.value.flatMap((e3) => e3.items).filter((e3) => !!e3.name).map((e3) => [e3.name, v(e3.value)])), { delayRange: i3, scrollRange: a3, closeProfile: o3, cookieRobotUrls: s3, ...c3 } = t3;
    h(t3.cookieRobotUrls) || s3.split(`
`).some((e3) => !r(e3)) ? n2(-1, $t("\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u7F51\u5740")) : await e2.onConfirm({ customParams: { $keepOriginOpenUrl: !0, openWorkbench: 0, ...c3 }, robotParams: { cookieRobotUrls: s3.split(`
`), delayRange: h(i3) ? void 0 : i3, scrollRange: h(a3) ? void 0 : a3, closeProfile: o3 } });
  }
  return (e3, t3) => {
    let n3 = q, r2 = Y;
    return E(), F("div", sr, [P("div", cr, [P("div", lr, [P("div", ur, L(e3.$t("Cookie \u673A\u5668\u4EBA")) + " \u{1F916} ", 1), U(n3, { class: "cursor-pointer", name: "base/rx_ic_delete", size: "20", onClick: t3[0] ||= (t4) => e3.$emit("close") })]), P("div", dr, L(R(i2).cookieRobotHelp), 1)]), P("div", fr, [(E(!0), F(I, null, H(R(u2), (e4) => (E(), F(I, { key: e4.id }, [e4.subtitle ? (E(), F("div", pr, L(e4.subtitle), 1)) : B("", !0), (E(!0), F(I, null, H(e4.items, (e5) => (E(), F(I, { key: e5.label }, [P("div", { class: N(["text", e5.class]) }, L(e5.label), 3), e5.component ? (E(), V(O(e5.component), { key: 0, modelValue: e5.value, "onUpdate:modelValue": (t4) => e5.value = t4, item: e5, class: "text" }, null, 8, ["modelValue", "onUpdate:modelValue", "item"])) : B("", !0)], 64))), 128))], 64))), 128))]), R(o2) ? B("", !0) : (E(), F("div", { key: 0, class: "flex items-center justify-center gap-1 cursor-pointer", onClick: t3[1] ||= (e4) => o2.value = !0 }, [P("div", mr, L(e3.$t("\u66F4\u591A\u8BBE\u7F6E")), 1), U(n3, { name: "base/rx_ic_chevron_down" })])), U(r2, { class: "shrink-0", size: "lg", label: e3.$t("\u5F00\u59CB\u751F\u6210 Cookie"), onClick: d2 }, null, 8, ["label"])]);
  };
} }), [["__cssModules", { panel: { tag: "_tag_bipxx_2", description: "_description_bipxx_12" } }], ["__scopeId", "data-v-a1dc008d"]]);
function gr() {
  let { currentWorkspace: e2 } = G(c()), { mixpanelTrack: t2 } = m(), { showDrawer: n2, hideDrawer: r2 } = Be(), [i2] = Me(), a2 = Q();
  function o2(t3) {
    let { data: i3, onConfirm: o3 } = t3, s3 = `[${i3.slice(0, 3).map((t4) => `${be(e2.value?.workspaceName)}-${t4.windowSortNum}`).join(", ")}${i3.length > 3 ? "..." : ""}]`;
    n2({ title: $t("\u4E3A {names} \u7F16\u8F91 Cookies", { names: s3 }), dismissable: !1, slots: { container: () => U("div", { class: "h-full flex flex-col" }, [i3.length > 1 && U("div", { class: "px-4 pt-4" }, [U(X, { class: "min-w-full", type: "warn", closable: !1, title: a2.value.selectedCookiesWarning }, null)]), U(or, { class: "flex-1", data: i3.length > 1 ? void 0 : i3[0], onConfirm: async (e3) => {
      await o3(e3), r2();
    } }, null)]) } });
  }
  function s2(e3) {
    t2("click_enter_cookie_bot"), i2({ showHeader: !1, modal: !0, blockScroll: !0, slots: { container: ({ hideModal: n3 }) => U(hr, { data: e3, onConfirm: async (r3) => {
      try {
        t2("click_run_cookie_bot");
        let i3 = e3.map((e4) => e4.dirId);
        await globalThis.electronAPI.send("browser:startCookieRobot", { dirIds: i3, ...r3 }), n3();
      } catch (error) {
        error.localUiNotified || globalThis.__localUiError(error.message);
      }
    }, onClose: n3 }, null) } });
  }
  return { editCookieByProfile: o2, startCookieRobot: s2 };
}
function _r(e2) {
  if (e2 == null || e2 === "") return null;
  let t2 = typeof e2 == "string" ? e2 : String(e2);
  try {
    return JSON.parse(t2);
  } catch {
    return null;
  }
}
function vr(e2) {
  let t2 = /* @__PURE__ */ new Set();
  function n2(e3) {
    t2.add(String(e3));
  }
  function r2(e3) {
    t2.delete(String(e3));
  }
  async function i2(n3) {
    let r3 = String(n3);
    if (!t2.delete(r3)) return;
    let i3 = await globalThis.electronAPI.send("browser:getOpenedBrowser"), a2 = pe(i3.find((e3) => String(e3.dirId) === r3)?.$proxyInfo);
    if (!a2) return;
    let o2 = e2.value.find((e3) => String(e3.dirId) === r3);
    o2 && me(o2, a2, { replaceProxy: !1 });
  }
  return { markRouteAutoOpen: n2, clearPendingAutoOpen: r2, syncOpenedProxyToRow: i2 };
}
function yr(e2) {
  let t2 = ye(), n2 = _e(), r2 = c(), i2 = w(!1), o2 = w(!1), s2 = w([]), { markRouteAutoOpen: u2, clearPendingAutoOpen: f2, syncOpenedProxyToRow: p2 } = vr(s2);
  ne(() => r2.currentWorkspace, (e3, t3) => {
    e3?.workspaceName !== t3?.workspaceName && m2();
  });
  function m2(t3 = {}, n3 = !1) {
    let r3 = { ...e2.getCurrentFilterParams(), ...t3, ...d(l(e2.filtersMenu.value)) };
    i2.value = !h(r3), e2.tableRef.value?.refresh(r3, n3);
  }
  function g2() {
    let r3 = _r(t2.query.browser);
    if (!r3?.openBrowser) return;
    let i3 = s2.value.find((e3) => e3.id === r3.windowId);
    n2.replace({ name: t2.name }), i3 && (u2(i3.dirId), e2.openBrowserBefore(i3));
  }
  async function _2(e3) {
    let n3 = await a.window.userGetWindowInfoListList({ projectIds: t2.params.id, ...e3, isDelete: 0 });
    if (n3.code === 0) {
      let e4 = n3.data.rows.map((e5) => ({ ...e5, projectName: e5.projectName === "\u65E0\u9879\u76EE" ? $t("\u9ED8\u8BA4\u9879\u76EE") : e5.projectName }));
      s2.value = e4, n3.data.rows = e4, o2.value = e4.some((e5) => e5.isTemporary), e4.length > 0 && g2();
    }
    return ve.emit("updateProfileList", n3.data.rows), n3;
  }
  function v2(t3) {
    let n3 = t3.rows;
    s2.value = n3, o2.value = n3.some((e3) => e3.isTemporary), t3.meta?.filtersMenu && (e2.filtersMenu.value = t3.meta.filtersMenu);
    let r3 = { ...t3.outerParams, ...d(l(e2.filtersMenu.value)) };
    i2.value = !h(r3), ve.emit("updateProfileList", n3);
  }
  return { dataList: s2, hasFiltered: i2, hasTempProfile: o2, clearPendingAutoOpen: f2, syncOpenedProxyToRow: p2, onRefreshTable: m2, tableRequest: _2, syncFromCacheEntry: v2 };
}
function br(e2) {
  let { onlyErrorToast: t2 } = e2;
  function n2(t3, n3) {
    e2.invalidateListCache?.(), e2.onRefreshTable(t3, n3);
  }
  async function r2(e3, r3 = !1) {
    let { code: i3, msg: o3 } = await a.window.userMdfWindowInfoSingleV2Create(e3);
    return t2(i3, o3), i3 === 0 ? (r3 || n2(), Promise.resolve()) : Promise.reject(o3);
  }
  async function i2(e3, r3 = !1) {
    let { code: i3, msg: o3 } = await a.window.userMdfWindowInfoBatchV2Create(e3);
    return t2(i3, o3), i3 === 0 ? (r3 || n2(), Promise.resolve()) : Promise.reject(o3);
  }
  async function o2(e3, t3, n3) {
    let { projectId: a2, labelIds: o3, requestType: s2 } = e3, c2 = [].concat(t3), l2 = c2.map((e4) => e4.id);
    (n3 === "single" ? r2({ id: l2[0], projectId: a2, labelIds: o3, requestType: s2 }, !0) : i2({ ids: l2, projectId: a2, labelIds: o3, requestType: s2 }, !0)).then(() => {
      let t4 = Object.entries(e3).filter(([e4, t5]) => !!t5);
      c2.forEach((e4) => {
        t4.forEach(([t5, n4]) => {
          e4[t5] = n4;
        });
      });
    });
  }
  return { singleModifyWindow: r2, batchModifyWindow: i2, updateProfileMeta: o2 };
}
function xr(e2) {
  return e2?.length ? e2.reduce((e3, t2) => (t2.value && (e3[t2.name] = v(t2.value)), e3), {}) : {};
}
async function Sr(e2) {
  let { page_index: t2 } = e2.tableRef.value.getParams(), n2 = xr(e2.filtersMenu.value);
  e2.router.push({ name: "browser-edit", query: { ...e2.route.query, id: e2.data.id, page_index: t2, activeTabId: e2.getCurrentFilter()?.id, customFilterParams: JSON.stringify(n2) } });
}
function Cr(e2) {
  e2.copyTextFn(e2.data.dirId), e2.showToast(0, $t("\u590D\u5236\u6210\u529F"));
}
async function wr(e2) {
  let t2 = e2.datas.filter((e3) => e3.openLimitStatus).toSorted((e3, t3) => e3.windowSortNum - t3.windowSortNum).map((e3) => e3.dirId);
  t2.length && globalThis.electronAPI.send("browser:batchRelaunch", t2);
}
function Tr(e2) {
  globalThis.electronAPI.send("browser:batchClose", e2.datas.map((e3) => e3.dirId));
}
async function Er(e2) {
  e2.operationType === "batch" ? e2.tagsIconRef.value?.openMenu(e2.operate._event) : e2.addTag({ confirmNext: ({ params: t2, res: n2 }) => {
    let r2 = We(n2.data.id);
    e2.updateProfileMeta({ labelInfo: [...e2.data.labelInfo, { labelColor: t2.color, labelName: t2.name, labelId: r2 }], labelIds: [...(e2.data.labelIds || []).map((e3) => We(e3)), r2], requestType: fe.SelectLabel }, e2.data);
  } });
}
function Dr(e2) {
  e2.singleModifyWindow({ id: e2.data.id, isOften: !e2.data.isOften }, !0).then(() => {
    e2.data.isOften = !e2.data.isOften;
  });
}
var Or = { edit: Sr, copyId: Cr, transfer: async (e2) => e2.onTransfer(e2.datas, e2.operate), moveToProject: async (e2) => e2.onMoveToProject(e2.data), open: async (e2) => e2.openBrowserBefore(e2.data), createAutomation: async (e2) => e2.createAutomation(e2.datas), view: async (e2) => e2.openBrowserBefore(e2.data), setAsDefaultBrowser: async (e2) => e2.setAsDefaultBrowser(e2.data), createDesktopShortcut: async (e2) => e2.createDesktopShortcut(e2.data), addProxy: async (e2) => e2.multipleProxyChange(e2.data, { operationType: e2.operationType, proxyMethod: "custom" }), chooseProxy: async (e2) => e2.multipleProxyChange(e2.data, { operationType: e2.operationType, proxyMethod: "choose" }), editProxy: async (e2) => e2.editProfileProxy?.(e2.data), buyProxy: async (e2) => e2.buyProxyForProfiles?.(e2.data), deleteProxy: async (e2) => e2.multipleProxyDelete(e2.data), checkProxy: async (e2) => e2.onTestProxy(e2.data), addPlatformAccount: async (e2) => e2.multipleAccountChange(e2.data, { operationType: e2.operationType, isChoose: !1 }), choosePlatformAccount: async (e2) => e2.multipleAccountChange(e2.data, { operationType: e2.operationType, isChoose: !0 }), restart: wr, close: Tr, addTag: Er, fav: Dr, addNotes: async (e2) => e2.onRemark(e2.data), editCookies: async (e2) => e2.onEditCookies(e2.data), cookieRobot: async (e2) => e2.openCookieRobot(e2.data), clearCache: async (e2) => e2.onClearCache(e2.datas), upgradeCore: async (e2) => e2.onUpgradeCore?.(e2.datas), exportProfile: async (e2) => e2.exportProfile(e2.datas), delete: async (e2) => e2.deleteProfile(e2.datas, e2.ids) };
function kr(e2) {
  return async function(t2, n2, r2 = "single") {
    let i2 = [].concat(n2).map((e3) => v(e3)), a2 = i2.map((e3) => e3.id);
    e2.saveLocalTrack(t2.name);
    let o2 = Or[t2.name];
    o2 && await o2({ ...e2, operate: t2, datas: i2, ids: a2, data: n2, operationType: r2 });
  };
}
export {gr as a,Tt as c,yr as i,dt as l,xr as n,br as r,kr as t,ot as u};