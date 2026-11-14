import {o as e} from "./rolldown-runtime-BCiCTKAo.js";
import {Ar as t,at as n,h as r,jr as i,m as a,mt as o,nn as s,sn as c,v as u} from "./utils-BIWenCnY.js";
import {C as d,D as f,Et as p,L as m,St as h,V as g,W as _,_t as v,b as y,d as b,f as x,h as S,i as C,in as w,jt as T,lt as E,m as D,p as O,ut as k,x as A} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as j} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as M} from "./agent-BmSFI9WH.js";
import {l as N,m as P,s as F} from "./proxy-D7e36h-l.js";
import {n as te} from "./workspace-CNvgSgaH.js";
import {Z as I} from "./basecomponent-ClhuVxJN.js";
import {t as L} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as R} from "./tooltip-BYYKWrvu.js";
import {t as z} from "./rx-button-DyzuUt-V.js";
import {t as B} from "./format-_cvrr_iF.js";
import {t as ne} from "./browser-BfFdBauo.js";
import {t as re} from "./rx-tooltip-BnCRxqlH.js";
import {t as ie} from "./divider-BXJIHZjP.js";
import {C as ae,_ as oe,b as V,g as se,h as U,s as G,v as K,x as q,y as J} from "./hooks-Jw3GridD.js";
import {n as ce,r as le} from "./useProxyFormDrawer-r-7UykRS.js";
import {t as ue} from "./rx-tag-BIY_xUFU.js";
import {t as de} from "./rx-select-button-DQtmZ0kT.js";
import {t as fe} from "./useRemarkDisplay-C7h7k7ja.js";
var pe = e(ne(), 1);
var Y = { render: () => null };
var X = { render: () => null };
var xe = { class: "flex flex-col gap-1" };
var Se = { class: "proxy-host" };
var Ce = { class: "flex items-center gap-1.5 ip-type" };
var we = L(d({ __name: "basic-info", props: { data: {} }, setup(e2) {
  return (n2, r2) => {
    let i2 = ie;
    return _(), S("div", xe, [x("div", Se, [e2.data.isEncryptProxy ? (_(), S(C, { key: 0 }, [y(" -- ")], 64)) : (_(), S(C, { key: 1 }, [x("span", null, w(e2.data.host), 1), x("span", null, w(T(t)(":", e2.data.port)), 1), x("span", null, w(T(t)(":", e2.data.proxyUserName)), 1), x("span", null, w(T(t)(":", e2.data.proxyPassword)), 1)], 64))]), x("div", Ce, [x("span", null, w(e2.data.ipType), 1), e2.data.protocol ? (_(), S(C, { key: 0 }, [A(i2, { class: "!ma-0", layout: "vertical" }), x("span", null, w(e2.data.protocol.toLocaleLowerCase()), 1)], 64)) : D("", !0)])]);
  };
} }), [["__scopeId", "data-v-6804b2f9"]]);
var Te = { class: "flex items-center gap-2 text-3 font-600 leading-4 text-[var(--colors-text-text-primary)]" };
var Ee = d({ __name: "remark-header", props: { column: {} }, setup(e2) {
  let { toggleRemarkDisplayStatus: t2 } = fe();
  return (n2, r2) => {
    let i2 = I, a2 = R;
    return _(), S("div", Te, [x("span", null, w(e2.column.title), 1), k(A(i2, { class: "cursor-pointer color-[#989CA0]", name: e2.column._cache.extend ? "base/rx_ic_hidden" : "base/rx_ic_eye", onClick: r2[0] ||= j((n3) => T(t2)(e2.column._cache), ["stop"]) }, null, 8, ["name"]), [[a2, { value: e2.column._cache.extend ? n2.$t("\u6536\u8D77") : n2.$t("\u5C55\u5F00"), showDelay: 0 }, void 0, { top: !0 }]])]);
  };
} });
function De(e2) {
  let t2 = te(o().currentWorkspace?.workspaceName);
  return (e2.bindList ?? []).map((e3) => `${t2}-${e3}`);
}
function Oe(e2) {
  let { check: t2 } = s(), n2 = [{ title: $t("\u51FA\u53E3 IP"), key: "lastCountry", sortable: !0, slot: "outbound" }, { title: $t("\u4EE3\u7406 IP \u4FE1\u606F"), key: "proxy", render: ({ data: e3 }) => A(we, { data: e3 }, null) }, { title: $t("\u5907\u6CE8"), key: "proxyRemark", headerSlot: "remarkHeader", headerRender: ({ column: e3 }) => A(Ee, { column: e3 }, null), slot: "remark", _cache: { extend: !0 } }, { title: e2?.relatedColumnTitle ?? $t("\u5DF2\u5173\u8054\u7A97\u53E3"), key: "bindList", slot: "bindList", style: { minWidth: "120px" } }, { title: $t("IP \u7528\u9014"), key: "businessUse" }, { title: $t("IP \u67E5\u8BE2\u6E20\u9053"), key: "ipChecker", render: ({ data: e3 }) => A(ue, { tooltip: $t("\u4E3A\u4FDD\u969C\u6D4B\u8BD5\u7ED3\u679C\u7EDF\u4E00\uFF0C\u6682\u65F6\u4EC5\u652F\u6301\u5B98\u65B9\u6307\u5B9A\u7684\u67E5\u8BE2\u6E20\u9053\u3002"), icon: "base/rx_ic_network", label: e3.checkChannelValue, disabled: !0 }, null) }, { title: $t("\u6765\u6E90"), key: "proxyType", sortable: !0, getText: (e3) => e3.proxyType === P.buy ? $t("\u8D2D\u4E70") : $t("\u6DFB\u52A0") }, { title: $t("\u4EE3\u7406 IP \u7C7B\u578B"), key: "providerType", slot: "providerType", _visible: !1 }, { title: $t("\u521B\u5EFA\u65F6\u95F4"), key: "createTime", _visible: !1, sortable: !0, getText: (e3) => e3.createTime ? B(e3.createTime, "yyyy-MM-dd") : "--" }, { title: $t("\u670D\u52A1\u5546"), key: "proxyProviderName", getText: (e3) => e3.proxyType === P.buy ? e3.proxyProviderName || $t("\u5B98\u65B9\u8D60\u9001") : "--", _visible: !1, sortable: !0 }].filter((e3) => e3.power !== !1);
  return ce(n2, e2);
}
function Z(e2) {
  let { userConfig: t2 } = M(u()), { storageKey: n2 = "proxy_display_v1", ...r2 } = e2 ?? {}, { columns: i2, updateColumns: a2 } = le({ key: n2, data: Oe(r2) });
  return m(() => {
    a2((e3) => {
      let n3 = e3.find((e4) => e4.key === "proxyRemark");
      n3?._cache && Reflect.set(n3._cache, "extend", t2.value.remarkDisplayStatus);
    });
  }), { columns: i2 };
}
var ke = { key: 0, class: "proxy-kyc-panel__body" };
var Ae = { class: "proxy-kyc-panel__desc" };
var je = { key: 1, class: "proxy-kyc-panel__desc proxy-kyc-panel__desc--only" };
var Me = { key: 2, class: "proxy-qrcode-panel__loading" };
var Ne = { key: 3, class: "flex flex-col items-center gap-3" };
var Pe = { class: "py-4.5 rounded-1" };
var Fe = ["src"];
var Ie = { key: 0, class: "flex items-center" };
var Le = { class: "proxy-kyc-tooltip__body" };
var Re = { class: "proxy-kyc-tooltip__desc" };
var ze = { key: 2, class: "flex items-center kyc-blocked" };
var Be = { key: 3, class: "flex items-center" };
var Ve = { class: "flex flex-col items-center gap-3" };
var He = { class: "py-4.5 rounded-1" };
var Q = ["src"];
var Ue = L(d({ __name: "proxy-qrcode", props: { data: {}, mode: { default: "trigger" } }, setup(e2) {
  let t2 = n(), r2 = c(), i2 = h(), a2 = h(), o2 = h(null), s2 = b(() => oe(r2.currentLocale, t2.isOwner)), l2 = b(() => K(r2.currentLocale, t2.isOwner) === "owner"), u2 = b(() => ({ value: s2.value, showDelay: 500, hideDelay: 300, autoHide: !1, pt: { root: "!max-w-sm", text: { class: "!whitespace-pre-wrap" } } })), d2 = b(() => V(e2.data));
  g(async () => {
    if (d2.value) return;
    if (!J(e2.data)) {
      await f2();
      return;
    }
    o2.value = null;
    let t3 = await se();
    o2.value = !t3, t3 && await f2();
  });
  async function f2() {
    let { protocol: t3 } = e2.data;
    if (d2.value || !t3) return;
    let { host: n2, port: r3, username: o3, password: s3 } = await ae(e2.data);
    if (!n2 || !r3 || !o3 || !s3) return;
    let c2 = t3.split("/").map((e3) => e3.toLocaleLowerCase()), l3 = r3.toString().split("/");
    i2.value = await Promise.all(c2.map(async (e3, t4) => {
      let r4 = btoa(`${o3}:${s3}@${n2}:${l3[t4] || l3[0]}`);
      return { name: e3, value: await pe.toDataURL(`${e3}://${r4}`, { margin: 0 }) };
    })), a2.value = i2.value[0].value;
  }
  function p2() {
    l2.value && q();
  }
  function m2(e3) {
    q(), e3();
  }
  function y2() {
    q();
  }
  return (t3, n2) => {
    let r3 = z, c2 = I, f3 = de, h2 = re, g2 = R;
    return e2.mode === "panel" ? (_(), S("div", { key: 0, class: "proxy-qrcode-panel", onClick: n2[1] ||= j(() => {
    }, ["stop"]) }, [T(o2) && T(l2) ? (_(), S("div", ke, [x("p", Ae, w(T(s2)), 1), A(r3, { size: "sm", label: t3.$t("\u53BB\u8BA4\u8BC1"), onClick: y2 }, null, 8, ["label"])])) : T(o2) ? (_(), S("p", je, w(T(s2)), 1)) : T(o2) === null && T(J)(e2.data) ? (_(), S("div", Me, [A(c2, { name: "base/rx_ic_qrcode", color: "var(--colors-icon-icon-inactive)" })])) : T(a2) ? (_(), S("div", Ne, [T(i2) && T(i2).length > 1 ? (_(), O(f3, { key: 0, modelValue: T(a2), "onUpdate:modelValue": n2[0] ||= (e3) => v(a2) ? a2.value = e3 : null, options: T(i2), "option-label": "name", "option-value": "value", "data-key": "value" }, null, 8, ["modelValue", "options"])) : D("", !0), x("div", Pe, [x("img", { class: "block w-36 aspect-square", src: T(a2) }, null, 8, Fe)])])) : D("", !0)])) : (_(), S(C, { key: 1 }, [T(d2) ? (_(), S("div", Ie, [A(c2, { name: "base/rx_ic_qrcode", color: "var(--colors-icon-icon-inactive)" })])) : T(o2) && T(l2) ? (_(), O(h2, { key: 1, class: "flex items-center", placement: "top", delay: 500, "tooltip-content-class": "proxy-kyc-tooltip" }, { default: E(() => [x("div", { class: "flex items-center kyc-blocked kyc-blocked--owner", onClick: p2 }, [A(c2, { name: "base/rx_ic_qrcode", color: "var(--colors-icon-icon-inactive)" })])]), content: E(({ hide: e3 }) => [x("div", Le, [x("p", Re, w(T(s2)), 1), A(r3, { size: "sm", label: t3.$t("\u53BB\u8BA4\u8BC1"), onClick: (t4) => m2(e3) }, null, 8, ["label", "onClick"])])]), _: 1 })) : T(o2) ? k((_(), S("div", ze, [A(c2, { name: "base/rx_ic_qrcode", color: "var(--colors-icon-icon-inactive)" })])), [[g2, T(u2), void 0, { top: !0 }]]) : T(o2) === null && T(J)(e2.data) ? (_(), S("div", Be, [A(c2, { name: "base/rx_ic_qrcode", color: "var(--colors-icon-icon-inactive)" })])) : T(a2) ? (_(), O(h2, { key: 4, class: "flex items-center", "tooltip-content-class": "bg-white" }, { default: E(() => [A(c2, { name: "base/rx_ic_qrcode", color: "var(--colors-icon-icon-secondary)" })]), content: E(() => [x("div", Ve, [T(i2) && T(i2).length > 1 ? (_(), O(f3, { key: 0, modelValue: T(a2), "onUpdate:modelValue": n2[2] ||= (e3) => v(a2) ? a2.value = e3 : null, options: T(i2), "option-label": "name", "option-value": "value", "data-key": "value" }, null, 8, ["modelValue", "options"])) : D("", !0), x("div", He, [x("img", { class: "block w-36 aspect-square", src: T(a2) }, null, 8, Q)])])]), _: 1 })) : D("", !0)], 64));
  };
} }), [["__scopeId", "data-v-b2cc6131"]]);
var { check: $ } = s();
function We(e2) {
  let t2 = !1, n2 = !1, r2 = !1, i2 = !0, a2 = !0, o2 = !1, s2 = !0, c2 = !0, l2 = !0, u2 = !1, d2 = !1, f2 = !1;
  for (let p2 of e2) p2.proxyExpireStatus === F.expired && (t2 = !0), p2.orderStatus === N.pending && (n2 = !0), p2.orderStatus === N.refunded && (r2 = !0), p2.orderStatus !== N.done && (i2 = !1), p2.proxyType !== P.resource && (a2 = !1), !p2.proxyProviderId && !p2.renewalTime && p2.proxyType === P.buy && (o2 = !0), G(p2) || (s2 = !1), p2.canRenew || (c2 = !1), p2.refreshUrl || (l2 = !1), p2.isDirect && (u2 = !0), V(p2) && (d2 = !0), p2.canBandwidthUpgrade && (f2 = !0);
  return { hasExpired: t2, hasPending: n2, hasRefunded: r2, isDone: i2, isResource: a2, isGift: o2, canTest: s2, canRenew: c2, canRefresh: l2, isDirect: u2, blockDirectExport: d2, canUpgrade: f2 };
}
function Ge(e2) {
  let t2 = [].concat(e2), n2 = t2[0], { hasExpired: r2, hasPending: i2, hasRefunded: a2, isDone: o2, isResource: s2, isGift: c2, canTest: d2, canRenew: p2, canRefresh: m2, isDirect: h2, blockDirectExport: g2, canUpgrade: _2 } = We(t2), v2 = U(n2);
  return [{ name: "edit", label: $t("\u7F16\u8F91"), icon: "base/rx_ic_edit", power: $("Proxy_List_edit"), tooltip: $t("\u7F16\u8F91"), disabled: !s2 }, { name: "test", label: $t("\u6D4B\u8BD5\u4EE3\u7406 IP"), icon: "base/rx_ic_speed_test", tooltip: $t("\u6D4B\u8BD5\u4EE3\u7406 IP"), disabled: !d2, power: $("Proxy_List_speed_test"), quick: !0, multiple: !0, multipleProps: { name: "G1", showLabel: !0 } }, { name: "refresh", label: $t("\u5237\u65B0\u4EE3\u7406 IP"), icon: "base/rx_ic_refresh", power: $("Proxy_List_refresh_proxy"), tooltip: $t("\u5237\u65B0\u4EE3\u7406 IP"), disabled: r2 || i2 || a2 || c2 || h2 || !m2, disabledTooltip: m2 ? void 0 : $t("\u672A\u914D\u7F6E\u52A8\u6001\u4EE3\u7406 IP \u5237\u65B0 URL") }, { name: "download", label: $t("\u4E0B\u8F7D"), icon: "base/rx_ic_download", tooltip: $t("\u4E0B\u8F7D"), power: $("Proxy_Store_download_proxy_info"), disabled: h2 || r2 || i2 || a2 || c2 || g2, multiple: !0, multipleProps: { disabledTooltip: c2 ? $t("\u5B98\u65B9\u8D60\u9001\u7684\u4EE3\u7406 IP \u65E0\u6CD5\u4E0B\u8F7D") : void 0, name: "G2", showLabel: !0 } }, { name: "qrcode", label: $t("\u626B\u7801\u5BFC\u51FA"), icon: "base/rx_ic_qrcode", power: $("Proxy_Store_download_proxy_info"), disabled: h2 || r2 || i2 || a2 || c2 || g2, hideSubmenuIcon: !v2, ...v2 ? { items: [{ name: "qrcodePanel", render: () => f(Ue, { data: n2, mode: "panel" }) }] } : {} }, { name: "remark", label: $t("\u6DFB\u52A0\u5907\u6CE8"), icon: "base/rx_ic_doc_add", power: $("Proxy_List_notes") }, { separator: !0, power: $("Proxy_List_delete") }, { name: "delete", label: $t("\u5220\u9664"), icon: "base/rx_ic_bin_1", power: $("Proxy_List_delete"), tooltip: $t("\u5220\u9664"), disabled: !s2 && !r2, multiple: !0, multipleProps: { disabledTooltip: $t("\u5DF2\u8D2D\u4EE3\u7406 IP \u65E0\u6CD5\u8FDB\u884C\u6B64\u64CD\u4F5C"), name: "G4", showLabel: !0 } }];
}
async function Ke(e2) {
  return r.proxy.userGetProxyListMergedList(e2);
}
async function qe() {
  let [e2, { data: t2 }, { data: n2 }] = await Promise.all([a(), r.proxy.userGetProxyAllCountriesList({}), r.proxy.userGetProxyProvidersTypeList()]);
  return [{ type: "Checkbox", label: $t("\u56FD\u5BB6/\u5730\u533A"), name: "proxyLastCountry", search: !0, searchPlaceholder: $t("\u641C\u7D22\u56FD\u5BB6/\u5730\u533A"), searchKeys: ["alias"], getOptions: () => (t2 || []).map((e3) => ({ parentName: "proxyLastCountry", value: e3.value, label: e3.label, alias: `${e3.label}/${e3.value}` })), formatValue: (e3) => e3.value?.map((e4) => e4.value) }, { type: "Checkbox", label: $t("\u4EE3\u7406 IP \u7C7B\u578B"), name: "proxyProtocol", getOptions: () => (e2.protocol || []).map((e3) => ({ parentName: "proxyProtocol", value: e3.value, label: e3.label })), formatValue: (e3) => e3.value?.map((e4) => e4.value) }, { type: "text", label: $t("\u4EE3\u7406 IP \u4E3B\u673A"), name: "proxyHost" }, { type: "text", label: $t("\u5907\u6CE8"), name: "proxyRemark" }, { type: "Checkbox", label: $t("\u670D\u52A1\u5546"), name: "proxyProvider", getOptions: () => ["PrivateProxy", "RoxyBrowser"].map((e3) => ({ parentName: "proxyProvider", label: e3, value: e3 })), formatValue: (e3) => e3.value?.map((e4) => e4.value) }, { type: "switchGroup", name: "providerType", label: $t("\u4F9B\u5E94\u5546\u7C7B\u578B"), options: n2.map((e3) => ({ label: e3, value: e3, text: e3 })) }, { type: "switchGroup", name: "proxyAutoRenew", label: $t("\u81EA\u52A8\u7EED\u8D39"), options: [] }];
}
async function Je(e2) {
  let t2 = e2?.getColumnState ?? Z, n2 = p(t2().columns.value), { data: a2 } = await r.proxy.userGetProxyTableSortOrderList();
  return { data: { sortField: n2.find((e3) => e3.key === a2?.orderName && e3.sortable) ? a2?.orderName : void 0, sortOrder: i(a2?.orderType ?? "desc") }, onChange: (e3) => {
    let t3 = {};
    e3.sortField && n2.some((t4) => t4.key === e3.sortField && t4.sortable) && (t3.orderName = e3.sortField, t3.orderType = i(e3.sortOrder)), r.proxy.userSaveProxyTableSortOrderCreate(t3);
  } };
}
function Ye() {
  return [{ key: "proxyHost", label: $t("\u4EE3\u7406 IP"), icon: "base/rx_ic_internet", syntax: "host::" }, { key: "proxyLastCountry", label: $t("\u56FD\u5BB6/\u5730\u533A"), icon: "base/rx_ic_earth", syntax: "region::" }, { key: "username", label: $t("\u4EE3\u7406 IP \u7528\u6237\u540D"), icon: "base/rx_ic_user_sm", syntax: "name::" }, { key: "proxyRemark", label: $t("\u5907\u6CE8"), icon: "base/rx_ic_doc_article", syntax: "note::" }, { key: "proxyProvider", label: $t("\u670D\u52A1\u5546"), icon: "base/rx_ic_browser_proxy", syntax: "provider::" }];
}
export {Ke as a,X as c,Ge as i,Y as l,qe as n,De as o,Je as r,Z as s,Ye as t};