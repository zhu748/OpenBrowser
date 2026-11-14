import {Ar as e,cr as t,gr as n,h as r,i,or as o,v as s,xr as c} from "./utils-BIWenCnY.js";
import {C as l,Et as u,F as d,L as f,N as p,P as m,St as h,V as g,W as _,_t as v,a as y,at as b,bt as x,d as S,en as C,f as w,h as T,i as E,in as D,jt as O,lt as k,m as A,p as j,q as M,rt as N,st as P,ut as F,x as I} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as L} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as R,n as z} from "./agent-BmSFI9WH.js";
import {d as V,o as H} from "./proxy-D7e36h-l.js";
import {Z as U} from "./basecomponent-ClhuVxJN.js";
import {t as W} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as ee} from "./useconfirm-CV4GTWBW.js";
import {t as te} from "./tooltip-BYYKWrvu.js";
import {n as ne} from "./theme-mq6SsndU.js";
import {t as G} from "./rx-button-DyzuUt-V.js";
import {n as K,r as q,t as J} from "./choose-panel-CC3iR_nA.js";
import {t as re} from "./m-input-select-C8pih1gY.js";
import {t as Y} from "./rx-alert-A_y5uvgP.js";
import {t as ie} from "./m-input-text-JVbCgVJP.js";
import {n as X} from "./motion-BwnyBP9B.js";
import {t as Z} from "./AnimatePresence-d-29l3Fb.js";
import {t as ae} from "./hooks-BozaoB_u.js";
import {t as oe} from "./rx-input-text-CytLc5Og.js";
import {t as se} from "./m-input-password-IOnajQ90.js";
import {E as ce,t as Q} from "./hooks-Jw3GridD.js";
import {t as le} from "./form-BQBA_XzO.js";
import {t as ue} from "./platform-icon-Cvcj894X.js";
import {l as de,o as fe,s as pe,u as me} from "./quick-kroUOSn_.js";
import {t as he} from "./rx-select-button-DQtmZ0kT.js";
import {t as ge} from "./tutorial-video-Cb-jkf_V.js";
import {t as $} from "./input-label-qeCNGFwS.js";
import {i as _e,o as ve,s as ye} from "./useAsyncGate-D7VA7DLY.js";
import {n as be} from "./api-extract-BlmYcIz7.js";
var xe = { class: "flex flex-col gap-1 tt-tertiary text-3" };
var Se = { class: "flex items-center gap-2" };
var Ce = { class: "font-500" };
var we = { class: "font-500" };
var Te = { class: "tt-warning" };
var Ee = { class: "tt-warning" };
var De = l({ __name: "noproxy-panel", setup(t2) {
  let n2 = ce(), [r2] = z(), i2 = h(!1);
  async function a2() {
    i2.value = !0;
    try {
      let e2 = await globalThis.electronAPI.send("app:getSoftConfig"), t3 = await globalThis.electronAPI.send("proxy:detectNetwork", e2.networkMode);
      n2.setNetworkInfo(t3);
    } catch {
      r2(-1, $t("\u7F51\u7EDC\u68C0\u6D4B\u5931\u8D25"));
    } finally {
      i2.value = !1;
    }
  }
  return (t3, r3) => {
    let o2 = U;
    return _(), T("div", xe, [w("div", Se, [w("span", null, D(t3.$t("\u5F53\u524D\u73AF\u5883\u4F7F\u7528\u672C\u673A\u7F51\u7EDC\uFF1A")), 1), I(o2, { name: `country-code/${O(n2).info?.country_code}`, fallback: "base/rx_ic_earth" }, null, 8, ["name"]), w("span", Ce, D(O(e)(O(n2).info?.country_code, O(e)("\xB7", O(n2).info?.city)) || "--"), 1), w("span", we, D(O(n2).info?.ip || "--"), 1), I(o2, { class: C(["cursor-pointer", { "pi-spin": O(i2) }]), name: O(i2) ? "base/rx_ic_progress_bar" : "base/rx_ic_refresh", size: "14", color: "var(--colors-icon-icon-tertiary)", onClick: a2 }, null, 8, ["class", "name"])]), w("div", Te, D(t3.$t("* \u591A\u4E2A\u7A97\u53E3\u6216\u4E1A\u52A1\u8D26\u53F7\u5171\u7528\u540C\u4E00\u51FA\u53E3 IP\uFF0C\u53EF\u80FD\u589E\u52A0\u8D26\u53F7\u5173\u8054\u6216\u5E73\u53F0\u98CE\u63A7\u98CE\u9669\u3002")), 1), w("div", Ee, D(t3.$t("* \u5EFA\u8BAE\u4E3A\u6BCF\u4E2A\u7A97\u53E3\u914D\u7F6E\u72EC\u7ACB\u4EE3\u7406 IP\u3002")), 1)]);
  };
} });
var Oe = l({ __name: "api-panel", props: { modelValue: { default: null }, modelModifiers: {} }, emits: ["update:modelValue"], setup(t2) {
  let n2 = N(t2, "modelValue"), [r2] = z(), { userConfig: i2 } = R(s()), { testProxy: l2 } = Q(), u2 = b("form"), p2 = h(!1), g2 = h(!1), v2 = h("success"), y2 = h(""), x2 = h(""), C2 = h(null), w2 = [{ label: $t("\u6BCF\u6B21\u6253\u5F00\u7A97\u53E3\u65F6\u63D0\u53D6\u65B0 IP"), value: !0 }, { label: $t("IP \u5931\u6548\u65F6\u91CD\u65B0\u63D0\u53D6\u65B0 IP"), value: !1 }], T2 = S(() => n2.value ?? {}), E2 = S(() => $t(`\u4F4D\u7F6E: {location}
IP: {ip}
\u65F6\u533A: {timezone}`, { location: `${C2.value?.lastCountry ?? ""}${e("/", C2.value?.lastCity)}`, ip: C2.value?.lastIp, timezone: C2.value?.timezone })), D2 = S(() => (g2.value, v2.value, y2.value, x2.value, E2.value, [{ type: "radio", label: $t("\u4EE3\u7406 IP \u7C7B\u578B"), name: "proxyCategory", props: { name: "proxyCategory" } }, { type: "select", label: $t("\u63D0\u53D6\u65B9\u5F0F"), name: "isExtraNewIp", value: T2.value.isExtraNewIp ?? !0, props: { optionValue: "value", options: w2 } }, { type: "text", label: $t("\u63D0\u53D6\u94FE\u63A5"), name: "extraUrl", value: T2.value.extraUrl ?? "", props: { placeholder: $t("\u8BF7\u8F93\u5165\u63D0\u53D6\u94FE\u63A5") } }, { name: "testExtract", label: " ", render: () => I("div", { class: "flex flex-col gap-2 w-full" }, [I(Y, m({ class: "!w-full", type: v2.value, title: y2.value, visible: g2.value }, { "onUpdate:visible": (e2) => {
    g2.value = e2;
  } }), { content: () => I("div", { class: "whitespace-pre-wrap" }, [v2.value === "success" ? E2.value : x2.value]) }), I("div", null, [I(G, { severity: "secondary", variant: "outlined", label: $t("\u6D4B\u8BD5\u63D0\u53D6"), onClick: ee2 }, null)])]) }]));
  f(() => {
    k2();
  }), P(() => u2.value?.instance?.states, () => {
    !p2.value && u2.value && B2();
  }, { deep: !0 });
  async function k2() {
    await d(), await F(T2.value), B2();
  }
  function M2(e2 = []) {
    return e2.filter((e3) => String(e3.value ?? "").toUpperCase() !== V.SSH);
  }
  function L2() {
    let { testExtract: e2, ...t3 } = u2.value?.getValues() ?? {};
    return t3;
  }
  function B2(e2) {
    let t3 = L2();
    n2.value = { ...n2.value, ...t3, ...e2, proxyMethod: "api", protocol: t3.proxyCategory, proxyCategory: t3.proxyCategory };
  }
  function U2() {
    g2.value = !1, C2.value = null, y2.value = "", x2.value = "";
  }
  function W2(e2, t3 = $t("\u63D0\u53D6\u5931\u8D25")) {
    v2.value = "error", y2.value = t3, x2.value = e2, C2.value = null, g2.value = !0;
  }
  async function ee2() {
    let e2 = String(u2.value?.getFieldState("extraUrl")?.value ?? "").trim();
    if (c(e2)) {
      r2(-1, $t("\u8BF7\u8F93\u5165\u63D0\u53D6\u94FE\u63A5"));
      return;
    }
    if (!globalThis.isElectron) return globalThis.electronAPI.send("proxy:detect", {});
    U2();
    let t3 = L2(), n3 = await be({ extraUrl: e2, proxyCategory: t3.proxyCategory || "SOCKS5", checkChannel: i2.value.ipChecker, isDirect: !1, testProxy: l2 });
    if (!n3.ok) {
      W2(n3.message);
      return;
    }
    let { connection: a2, checkResult: s2 } = n3;
    C2.value = s2, B2({ ...a2, lastIp: s2.lastIp, lastCity: s2.lastCity, lastCountry: s2.lastCountry, timezone: s2.timezone, checkStatus: s2.checkStatus, checkTime: s2.checkTime }), s2.checkStatus === H.success && !s2.error ? (v2.value = "success", y2.value = $t("\u6D4B\u8BD5\u6210\u529F"), g2.value = !0) : W2(typeof s2.error == "string" && s2.error || $t("\u4EE3\u7406 IP \u6D4B\u8BD5\u5931\u8D25"), $t("\u6D4B\u8BD5\u5931\u8D25"));
  }
  return (e2, t3) => O(D2) ? (_(), j(le, { key: 0, ref: "form", position: "left", inputs: O(D2) }, null, 8, ["inputs"])) : A("", !0);
} });
var Ae = { class: "w-full flex items-start proxy-info" };
var je = { class: "min-w-0 flex-1 flex flex-col gap-4" };
var Me = { class: "flex flex-col items-start gap-4 w-full" };
var Re = { class: "pa-4 rounded-2 panel" };
var ze = W(l({ inheritAttrs: !1, __name: "index", props: { modelValue: { default: () => [] }, modelModifiers: {} }, emits: ["update:modelValue"], setup(e2) {
  let t2 = N(e2, "modelValue"), { presetTemplate: n2, pauseCreateGuide: r2, continueCreateGuideAfterBuy: i2 } = ve(), removedCommerce, o2 = h("noproxy"), s2 = h(!1), c2 = x({ custom: null, choose: null, api: null }), l2 = S(() => [{ label: $t("\u4E0D\u4F7F\u7528"), value: "noproxy" }, { label: $t("\u6DFB\u52A0\u4EE3\u7406 IP"), value: "custom" }, { label: $t("\u9009\u62E9\u4EE3\u7406 IP"), value: "choose" }]), d2 = g2("custom"), f2 = g2("choose"), p2 = g2("api");
  P(() => t2.value?.[0], (e3) => {
    s2.value || (e3 || o2.value !== "noproxy") && k2();
  }, { immediate: !0, deep: !0 });
  function m2() {
    if (b2(), o2.value === "noproxy") {
      t2.value = [];
      return;
    }
    let e3 = c2[o2.value];
    t2.value = e3 ? [e3] : [];
  }
  function g2(e3) {
    return S({ get: () => c2[e3], set: (t3) => {
      c2[e3] = t3, o2.value === e3 && m2();
    } });
  }
  function b2() {
    n2 && (n2.value = void 0);
  }
  function C2(e3) {
    let t3 = e3?.id;
    return t3 != null && t3 !== "" && t3 !== 0 && String(t3) !== "0";
  }
  function E2(e3) {
    return !e3 || String(e3.proxyCategory || e3.protocol || "").toLowerCase() === "noproxy" ? "noproxy" : e3.proxyMethod === "api" ? e3.host || e3.extraUrl ? "custom" : "noproxy" : e3.proxyMethod === "choose" || C2(e3) ? "choose" : e3.proxyMethod === "custom" || e3.host ? "custom" : "noproxy";
  }
  function k2() {
    let e3 = t2.value?.[0] ?? null, n3 = E2(e3);
    o2.value = n3, n3 !== "noproxy" && e3 && (c2[n3] = { ...u(e3) }), s2.value = !0;
  }
  function M2() {
    s2.value = !0, m2();
  }
  return (e3, t3) => (_(), T("div", Ae, [I($, { class: "shrink-0 max-w-25 !min-w-25 text-right", label: e3.$t("\u4EE3\u7406 IP"), tooltip: e3.$t("\u4EE3\u7406 IP \u662F\u4F7F\u7528\u7279\u5B9A IP \u5730\u5740\u8FDB\u884C\u7F51\u7EDC\u8BBF\u95EE\u7684\u65B9\u5F0F\uFF0C\u5E73\u53F0\u4F1A\u83B7\u53D6\u60A8\u7684 IP \u5730\u5740\u6765\u8FFD\u8E2A\u60A8\uFF0C\u5F3A\u70C8\u5EFA\u8BAE\u914D\u7F6E\u6B64\u9879\uFF01") }, null, 8, ["label", "tooltip"]), w("div", je, [w("div", Me, [A("", !0), I(O(he), { modelValue: O(o2), "onUpdate:modelValue": t3[0] ||= (e4) => v(o2) ? o2.value = e4 : null, options: O(l2), size: "lg", "option-label": "label", "option-value": "value", "data-key": "value", onChange: M2 }, null, 8, ["modelValue", "options"])]), w("div", Re, [(_(), j(y, null, [O(o2) === "noproxy" ? (_(), j(De, { key: "noproxy" })) : O(o2) === "custom" ? (_(), j(K, { key: "custom", modelValue: O(d2), "onUpdate:modelValue": t3[1] ||= (e4) => v(d2) ? d2.value = e4 : null }, null, 8, ["modelValue"])) : O(o2) === "choose" ? (_(), j(J, { key: "choose", modelValue: O(f2), "onUpdate:modelValue": t3[2] ||= (e4) => v(f2) ? f2.value = e4 : null }, null, 8, ["modelValue"])) : O(o2) === "api" ? (_(), j(Oe, { key: "api", modelValue: O(p2), "onUpdate:modelValue": t3[3] ||= (e4) => v(p2) ? p2.value = e4 : null }, null, 8, ["modelValue"])) : A("", !0)], 1024))])])]));
} }), [["__scopeId", "data-v-b9ec4a5a"]]);
var Be = { class: "w-full flex items-start account-platform" };
var Ve = { class: "min-w-0 flex-1 flex flex-col gap-3" };
var He = { class: "flex-1 min-w-0 grid gap-x-3 gap-y-3 items-center account-fields" };
var Ue = { class: "tt-tertiary text-3 text-right" };
var We = { class: "tt-tertiary text-3 text-right" };
var Ge = { class: "tt-tertiary text-3 text-right" };
var Ke = { class: "flex items-center justify-end gap-1" };
var qe = { class: "tt-tertiary text-3 text-right" };
var Je = { class: "flex items-center gap-2" };
var Ye = { class: "account-option" };
var Xe = { class: "account-option__body" };
var Ze = { class: "account-option__title" };
var Qe = { key: 0, class: "account-option__meta" };
var $e = { class: "pa-1" };
var et = W(l({ inheritAttrs: !1, __name: "account-platform", props: { modelValue: { default: () => [] }, modelModifiers: {} }, emits: ["update:modelValue"], setup(e2) {
  let n2 = N(e2, "modelValue"), i2 = ee(), { realTheme: a2 } = R(ne()), o2 = h([]), s2 = h([]), c2 = h([]), l2 = h(!1), d2 = 0;
  g(() => {
    f2(), x2();
  });
  async function f2() {
    let { data: { rows: e3 } } = await r.platform.userGetPlatformInfoList({});
    o2.value = me(e3), s2.value = fe(e3);
  }
  let p2 = S(() => {
    let e3 = /* @__PURE__ */ new Set();
    for (let t2 of n2.value ?? []) t2?.id != null && t2.id !== "" && t2.id !== 0 && String(t2.id) !== "0" && e3.add(String(t2.id));
    return e3;
  }), m2 = S(() => c2.value.filter((e3) => !p2.value.has(String(e3.id))));
  function v2(e3) {
    return e3 ? e3.replace(/^https?:\/\//, "").replace(/\/.*$/, "") : "";
  }
  function y2(e3) {
    let t2 = String(e3.platformRemarks ?? "").trim(), n3 = e3.platformName || v2(e3.platformUrl), r2 = e3.platformUrl || n3 || "--";
    return { ...e3, image: e3.platformIcon, darkImage: e3.platformIconDark, label: r2, searchText: [e3.platformUserName, e3.platformName, e3.platformUrl, t2, n3, r2].filter(Boolean).join(" ") };
  }
  function b2(e3) {
    return [String(e3.platformUserName ?? "").trim(), String(e3.platformRemarks ?? "").trim()].filter(Boolean).join(" \xB7 ");
  }
  async function x2() {
    let e3 = ++d2;
    l2.value = !0;
    try {
      let { code: t2, data: n3 } = await r.platform.userGetPlatformInfoV2List({ page_index: 1, page_size: 200 });
      if (e3 !== d2 || t2 !== 0) return;
      c2.value = (n3?.rows ?? []).map((e4) => y2(e4));
    } finally {
      e3 === d2 && (l2.value = !1);
    }
  }
  function C2(e3) {
    if (e3 == null || e3 === "") return;
    let t2 = m2.value.find((t3) => String(t3.id) === String(e3));
    t2 && (n2.value = [...n2.value ?? [], K2(t2)]);
  }
  function L2(e3) {
    e3(), H2();
  }
  function z2() {
    return Date.now().toString(32) + Math.random().toString(16).slice(2, 6);
  }
  function B2(e3) {
    return { platformUrl: e3.platformUrl ?? "", platformUserName: e3.platformUserName ?? "", platformPassword: e3.platformPassword ?? "", platformEfa: e3.platformEfa ?? "", platformIcon: e3.platformIcon ?? "", platformIconDark: e3.platformIconDark ?? "" };
  }
  function V2() {
    return { _tempId: z2(), platformUrl: "", platformUserName: "", platformPassword: "", platformEfa: "", platformIcon: "", platformIconDark: "" };
  }
  function H2() {
    n2.value = [...n2.value ?? [], V2()];
  }
  function W2(e3) {
    if (Array.isArray(e3)) for (let t2 of e3) t2?.id && !t2._linkedSnapshot && (t2._tempId ??= z2(), t2._linkedSnapshot = B2(t2));
  }
  function K2(e3) {
    return { ...t(u(e3)), _tempId: z2(), _linkedSnapshot: B2(e3) };
  }
  function q2(e3) {
    if (!e3?.id || !e3._linkedSnapshot) return;
    let t2 = e3._linkedSnapshot;
    (e3.platformUrl !== t2.platformUrl || e3.platformUserName !== t2.platformUserName || e3.platformPassword !== t2.platformPassword || e3.platformEfa !== t2.platformEfa || e3.platformIcon !== t2.platformIcon || e3.platformIconDark !== t2.platformIconDark) && (delete e3.id, delete e3._linkedSnapshot);
  }
  P(n2, (e3) => {
    W2(e3);
  }, { immediate: !0 });
  function J2(e3, t2) {
    e3.platformUrl = t2, q2(e3);
  }
  function Y2(e3, t2) {
    e3.platformIcon = t2.platformIcon, e3.platformIconDark = t2.platformIconDark, t2.fromUser ? q2(e3) : e3._linkedSnapshot && (e3._linkedSnapshot.platformIcon = t2.platformIcon, e3._linkedSnapshot.platformIconDark = t2.platformIconDark);
  }
  function X2(e3, t2, n3) {
    e3[t2] = n3, q2(e3);
  }
  function Z2(e3) {
    let t2 = e3._tempId || e3.id;
    n2.value = (n2.value ?? []).filter((e4) => (e4._tempId || e4.id) !== t2);
  }
  function ae2(e3) {
    return !e3.platformUrl && !e3.platformUserName && !e3.platformPassword && !e3.platformEfa;
  }
  function oe2(e3) {
    ae2(e3) ? Z2(e3) : i2.require({ header: $t("\u5220\u9664\u8D26\u53F7"), message: $t("\u60A8\u786E\u8BA4\u8981\u5220\u9664\u8BE5\u8D26\u53F7\u5417\uFF1F"), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: () => Z2(e3) });
  }
  function ce2(e3, t2) {
    return e3._tempId || e3.id || t2;
  }
  function Q2(e3) {
    return pe(e3, s2.value);
  }
  return (e3, t2) => {
    let r2 = U, i3 = te;
    return _(), T("div", Be, [I($, { class: "shrink-0 max-w-25 !min-w-25 text-right", label: e3.$t("\u5E73\u53F0\u8D26\u53F7"), tooltip: e3.$t("\u7528\u4E8E\u5C06\u5E73\u53F0\u767B\u5F55\u8D26\u53F7\u4E0E\u5F53\u524D\u7A97\u53E3\u5173\u8054\uFF0C\u65B9\u4FBF\u533A\u5206\u548C\u7BA1\u7406\u4E0D\u540C\u4E1A\u52A1\u8D26\u53F7\u3002\u4E0D\u7ED1\u5B9A\u5E73\u53F0\u8D26\u53F7\u4E5F\u53EF\u4EE5\u6B63\u5E38\u521B\u5EFA\u7A97\u53E3\u3002") }, null, 8, ["label", "tooltip"]), w("div", Ve, [(_(!0), T(E, null, M(n2.value, (t3, n3) => (_(), T("div", { key: ce2(t3, n3), class: "flex items-center pa-4 gap-4 rounded-2 panel" }, [w("div", He, [w("div", Ue, D(e3.$t("\u5F85\u7ED1\u5B9A\u5E73\u53F0")), 1), I(de, { class: "min-w-0", url: t3.platformUrl, icon: t3.platformIcon, "icon-dark": t3.platformIconDark, options: O(o2), "dark-mode": O(a2) === "dark", placeholder: e3.$t("\u8BF7\u9009\u62E9\u6216\u8F93\u5165\u5E73\u53F0\u7F51\u5740"), "onUpdate:url": (e4) => J2(t3, e4), onIcons: (e4) => Y2(t3, e4) }, null, 8, ["url", "icon", "icon-dark", "options", "dark-mode", "placeholder", "onUpdate:url", "onIcons"]), w("div", We, D(Q2(t3).account), 1), I(ie, { "model-value": t3.platformUserName, class: "min-w-0", placeholder: e3.$t("\u8BF7\u8F93\u5165\u8D26\u53F7"), "onUpdate:modelValue": (e4) => X2(t3, "platformUserName", e4) }, null, 8, ["model-value", "placeholder", "onUpdate:modelValue"]), w("div", Ge, D(Q2(t3).password), 1), I(se, { "model-value": t3.platformPassword, class: "min-w-0", placeholder: e3.$t("\u8BF7\u8F93\u5165\u5BC6\u7801"), "onUpdate:modelValue": (e4) => X2(t3, "platformPassword", e4) }, null, 8, ["model-value", "placeholder", "onUpdate:modelValue"]), w("div", Ke, [w("span", qe, D(e3.$t("2FA \u5BC6\u94A5")), 1), F(I(r2, { name: "base/rx_ic_info", size: "12", color: "var(--colors-icon-icon-note)" }, null, 512), [[i3, e3.$t("\u4EC5\u5F53\u5E73\u53F0\u8D26\u53F7\u5DF2\u5F00\u542F\u53CC\u91CD\u9A8C\u8BC1\u65F6\u586B\u5199\uFF0C\u586B\u5199\u540E\u53EF\u7528\u4E8E\u81EA\u52A8\u751F\u6210\u9A8C\u8BC1\u7801\u3002")]])]), I(ie, { "model-value": t3.platformEfa, class: "min-w-0", placeholder: e3.$t("\u8BF7\u8F93\u5165 2FA \u5BC6\u94A5 \uFF08\u9009\u586B\uFF09"), "onUpdate:modelValue": (e4) => X2(t3, "platformEfa", e4) }, null, 8, ["model-value", "placeholder", "onUpdate:modelValue"])]), I(r2, { class: "mt-2 shrink-0 cursor-pointer", name: "base/rx_ic_bin_1", color: "var(--colors-icon-icon-tertiary)", onClick: (e4) => oe2(t3) }, null, 8, ["onClick"])]))), 128)), w("div", Je, [I(O(G), { severity: "secondary", outlined: "", icon: "base/rx_ic_add_keys", label: e3.$t("\u6DFB\u52A0\u8D26\u53F7"), onClick: H2 }, null, 8, ["label"]), I(re, { "model-value": null, class: "flex-1 min-w-0", options: O(m2), "option-value": "id", "option-label": "label", filter: "", "highlight-on-select": !1, "dark-mode": O(a2) === "dark", "filter-fields": ["searchText", "label", "platformUserName", "platformName", "platformUrl", "platformRemarks"], "filter-placeholder": e3.$t("\u641C\u7D22\u8D26\u53F7 / \u5E73\u53F0 / \u5907\u6CE8"), placeholder: e3.$t("\u9009\u62E9\u5DF2\u6709\u8D26\u53F7"), "empty-message": O(l2) ? e3.$t("\u52A0\u8F7D\u4E2D...") : e3.$t("\u6682\u65E0\u5E73\u53F0\u8D26\u53F7"), "overlay-class": "account-picker-panel", "scroll-height": "20rem", onBeforeShow: x2, "onUpdate:modelValue": C2 }, { option: k(({ option: e4 }) => [w("div", Ye, [e4.platformIcon ? (_(), j(ue, { key: 0, class: "account-option__icon", "platform-icon": e4.platformIcon, "platform-icon-dark": e4.platformIconDark }, null, 8, ["platform-icon", "platform-icon-dark"])) : (_(), j(r2, { key: 1, class: "account-option__icon", name: "base/rx_ic_user_key", size: 16, color: "var(--colors-icon-icon-tertiary)" })), w("div", Xe, [w("div", Ze, D(e4.label), 1), b2(e4) ? (_(), T("div", Qe, D(b2(e4)), 1)) : A("", !0)])])]), footer: k(({ close: t3 }) => [w("div", $e, [I(O(G), { class: "w-full", text: "", icon: "base/rx_ic_add_keys", label: e3.$t("\u6DFB\u52A0\u8D26\u53F7"), onClick: (e4) => L2(t3) }, null, 8, ["label", "onClick"])])]), _: 1 }, 8, ["options", "dark-mode", "filter-placeholder", "placeholder", "empty-message"])])])]);
  };
} }), [["__scopeId", "data-v-aaedf38f"]]);
var tt = { class: "mx-4 mb-2 p-4 basic-info" };
var nt = { class: "mb-4 flex items-center justify-between" };
var rt = { class: "subtitle" };
var it = { class: "flex flex-col gap-4" };
var at = { key: 0, class: "flex min-w-0 w-full flex-col gap-2" };
var ot = { key: 0, class: "flex items-center justify-end gap-2.5" };
var st = { class: "text-3 font-[JetBrains_Mono]" };
var ct = { class: "flex min-w-0 w-full items-start" };
var lt = { class: "min-w-0 flex-1 flex flex-col gap-1" };
var ut = { class: "text-2.75 tt-inactive" };
var dt = W(l({ __name: "basic-info", props: { windowInputs: { default: () => [] }, templateLabel: { default: "" }, showTemplate: { type: Boolean, default: !1 }, autofillWindowName: { type: Boolean, default: !0 } }, emits: ["showTemplates"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, [a2] = z(), { isBatch: s2 } = ve(), c2 = S(() => i(n2.windowInputs, ["windowName", "proxyInfoList", "windowPlatformList", "cookie"])), l2 = S(() => c2.value[0]), u2 = S(() => c2.value[1]), d2 = S(() => c2.value[2]), f2 = S(() => c2.value[3]), p2 = S(() => (d2.value?.value ?? []).map((e3) => e3.platformUrl).filter(Boolean));
  ye({ enabled: () => n2.autofillWindowName && !s2.value, getNameInput: () => l2.value, getAccounts: () => d2.value?.value, getProxyList: () => u2.value?.value });
  function h2(e3) {
    o(e3), a2(0, $t("\u590D\u5236\u6210\u529F"));
  }
  return (t3, n3) => (_(), T("section", tt, [w("div", nt, [w("h2", rt, D(t3.$t("\u7A97\u53E3\u57FA\u7840\u4FE1\u606F")), 1), e2.showTemplate ? (_(), j(O(G), { key: 0, text: "", severity: "secondary", icon: "base/rx_ic_template", label: e2.templateLabel, onClick: n3[0] ||= L((e3) => r2("showTemplates", e3), ["stop"]) }, null, 8, ["label"])) : A("", !0)]), w("div", it, [O(l2) ? (_(), T("div", at, [O(l2).dirId ? (_(), T("div", ot, [w("span", st, "ID:" + D(O(l2).dirId), 1), w("span", { class: "text-3 font-[JetBrains_Mono] color-blue cursor-pointer", onClick: n3[1] ||= (e3) => h2(O(l2).dirId) }, D(t3.$t("\u590D\u5236")), 1)])) : A("", !0), w("div", ct, [I($, { class: "shrink-0", label: O(l2).label }, null, 8, ["label"]), w("div", lt, [I(oe, { modelValue: O(l2).value, "onUpdate:modelValue": n3[2] ||= (e3) => O(l2).value = e3, placeholder: O(l2).placeholder }, null, 8, ["modelValue", "placeholder"]), w("span", ut, D(t3.$t("* \u7CFB\u7EDF\u81EA\u52A8\u751F\u6210\u7A97\u53E3\u540D\u79F0\uFF0C\u4E5F\u53EF\u624B\u52A8\u4FEE\u6539\u3002")), 1)])])])) : A("", !0), O(u2) ? (_(), j(ze, { key: 1, modelValue: O(u2).value, "onUpdate:modelValue": n3[3] ||= (e3) => O(u2).value = e3 }, null, 8, ["modelValue"])) : A("", !0), O(d2) ? (_(), j(et, { key: 2, modelValue: O(d2).value, "onUpdate:modelValue": n3[4] ||= (e3) => O(d2).value = e3 }, null, 8, ["modelValue"])) : A("", !0), O(f2) ? (_(), j(_e, m({ key: 3, modelValue: O(f2).value, "onUpdate:modelValue": n3[5] ||= (e3) => O(f2).value = e3, invalid: O(f2).invalid, "onUpdate:invalid": n3[6] ||= (e3) => O(f2).invalid = e3, "platform-urls": O(p2) }, O(f2)), null, 16, ["modelValue", "invalid", "platform-urls"])) : A("", !0)])]));
} }), [["__scopeId", "data-v-4e0b1f5d"]]);
var ft = ["onClick"];
var pt = { class: "flex items-center pa-2 rounded-md video-icon" };
var mt = { class: "flex-1 cursor-pointer" };
var ht = { class: "flex justify-between items-center" };
var gt = { class: "video-title" };
var _t = { class: "video-desc" };
var vt = { key: 0, class: "relative flex flex-col mb-2 pt-6 items-center overflow-hidden pointer-events-none select-none overview" };
var yt = { class: "flex items-center gap-3" };
var bt = { class: "w-34 flex items-center justify-between relative" };
var xt = { key: 0, class: "relative icon" };
var St = ["src"];
var Ct = { key: 2, class: "absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 scale-70 icon" };
var wt = ["src"];
var Tt = { key: 0, class: "absolute top-20 left-1/2 -translate-x-1/2 flex gap-6" };
var Et = ["src"];
var Dt = ["src"];
var Ot = ["src"];
var kt = { class: "label" };
var At = { class: "value" };
var jt = W(l({ __name: "preview-card", props: p({ inputsGroup: { default: () => [] }, createCount: {}, isBatch: { type: Boolean, default: !1 }, isImport: { type: Boolean, default: !1 }, isEdit: { type: Boolean }, choosePreset: { type: Function }, onShuffle: { type: Function } }, { collapsed: { type: Boolean, default: !1 }, collapsedModifiers: {} }), emits: ["update:collapsed"], setup(e2) {
  let { onboardingTaskStatus: t2, closeGuideTipsAndUpdateTaskStatus: r2 } = ae(), a2 = { visible: { opacity: 0.4, x: 0, transition: { duration: 0.5, ease: [0, 0.71, 0.2, 1.01] } }, hidden: { opacity: 0, x: -60, transition: { duration: 0.5, ease: [0, 0.71, 0.2, 1.01] } } }, o2 = { visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.5, ease: [0, 0.71, 0.2, 1.01] } }, hidden: { opacity: 0, x: 0, y: 40, transition: { duration: 0.5, ease: [0, 0.71, 0.2, 1.01] } } }, s2 = { visible: { opacity: 0.4, x: 0, transition: { duration: 0.5, ease: [0, 0.71, 0.2, 1.01] } }, hidden: { opacity: 0, x: 60, transition: { duration: 0.5, ease: [0, 0.71, 0.2, 1.01] } } }, c2 = { macos: n("systeam/mac.webp"), ios: n("systeam/ios.webp"), android: n("systeam/android.webp"), windows: n("systeam/windows.webp"), linux: n("systeam/linux.webp") }, l2 = N(e2, "collapsed"), u2 = S(() => f2(e2.inputsGroup.flat())), d2 = S(() => {
    let [t3, n2, r3] = i(e2.inputsGroup[0], ["os", "proxyInfoList", "windowPlatformList"]), [a3, o3] = (r3?.value || []).map((e3) => ({ image: e3.platformIcon, icon: "base/rx_ic_user_key" })), s3 = t3?.value?.value.toLowerCase();
    return { os: s3, banner: c2[s3], icons: [{ icon: t3?.value?.icon || "base/rx_ic_plus" }, { icon: n2?.value?.length && `country-code/${n2.value[0].lastCountry}`, fallback: "base/rx_ic_earth" }, { icon: a3?.icon || "base/rx_ic_plus", image: a3?.image, subIcon: r3?.value?.length > 2 ? "base/rx_ic_more-h" : o3?.icon, subImage: r3?.value?.length > 2 ? "" : o3?.image }] };
  });
  function f2(e3) {
    return e3.flatMap((e4) => e4.preview ? [e4] : e4.items?.length ? e4.items.filter((e5) => e5.preview) : []).map(({ options: e4, value: t3, preview: n2 }) => {
      let r3 = t3?.value ?? t3, i2 = e4?.find((e5) => e5.value === r3)?.label ?? r3;
      return { ...n2, value: i2 };
    });
  }
  return (n2, i2) => {
    let c3 = U, f3 = G, p2 = q;
    return _(), j(p2, { collapsed: l2.value, "onUpdate:collapsed": i2[2] ||= (e3) => l2.value = e3, title: n2.$t("\u6982\u8981") }, { before: k(() => [O(t2)?.createProfileVideoEntryStatus ? A("", !0) : (_(), j(ge, { key: 0, "video-type": "create_profile", autoplay: !1 }, { default: k(({ onPlay: e3 }) => [w("div", { class: "flex items-center justify-start pa-3 gap-2.5 rounded-xl video", onClick: e3 }, [w("div", pt, [I(c3, { name: "base/rx_ic_play", color: "var(--pattern-tutorial-video-bg-icon)" })]), w("div", mt, [w("div", ht, [w("span", gt, D(n2.$t("\u7A97\u53E3\u6559\u7A0B")), 1), I(c3, { class: "cursor-pointer", name: "base/rx_ic_delete", color: "var(--colors-icon-icon-tertiary)", onClick: i2[0] ||= L((e4) => O(r2)("createProfileVideoEntryStatus"), ["stop"]) })]), w("div", _t, D(n2.$t("\u4E86\u89E3\u7A97\u53E3\u548C\u7A97\u53E3\u6307\u7EB9")), 1)])], 8, ft)]), _: 1 }))]), footer: k(() => [I(f3, { class: "w-full", size: "lg", label: n2.$t("\u4E00\u952E\u968F\u673A\u6307\u7EB9"), icon: "base/rx_ic_shuffle", outlined: "", onClick: i2[1] ||= (t3) => e2.onShuffle() }, null, 8, ["label"])]), default: k(() => [e2.isImport ? A("", !0) : (_(), T("div", vt, [w("div", yt, [w("div", bt, [i2[3] ||= w("div", { class: "line" }, null, -1), (_(!0), T(E, null, M(O(d2).icons, (e3) => (_(), T(E, { key: e3.icon }, [e3.icon ? (_(), T("div", xt, [e3.image ? (_(), T("img", { key: 0, class: "w-full h-full", src: e3.image }, null, 8, St)) : (_(), j(c3, { key: 1, class: "shrink-0", name: e3.icon, color: "#7d8387", fallback: e3.fallback }, null, 8, ["name", "fallback"])), e3.subIcon || e3.subImage ? (_(), T("div", Ct, [e3.subImage ? (_(), T("img", { key: 0, class: "w-full h-full", src: e3.subImage }, null, 8, wt)) : (_(), j(c3, { key: 1, class: "shrink-0", name: e3.subIcon, color: "#7d8387" }, null, 8, ["name"]))])) : A("", !0)])) : A("", !0)], 64))), 128))])]), O(d2).os ? (_(), T("div", Tt, [e2.isBatch ? (_(), j(O(Z), { key: 0, initial: !1, mode: "wait" }, { default: k(() => [(_(), j(O(X).div, { key: O(d2).os, class: "flex justify-end opacity-40 overview-banner", variants: a2, initial: "hidden", animate: "visible", exit: "hidden" }, { default: k(() => [w("img", { src: O(d2).banner, class: "block h-full object-contain" }, null, 8, Et)]), _: 1 }, 8, ["variants"]))]), _: 1 })) : A("", !0), I(O(Z), { initial: !1, mode: "wait" }, { default: k(() => [(_(), j(O(X).div, { key: O(d2).os, class: "overview-banner", variants: o2, initial: "hidden", animate: "visible", exit: "hidden" }, { default: k(() => [w("img", { src: O(d2).banner, class: "block h-full w-full object-contain" }, null, 8, Dt)]), _: 1 }, 8, ["variants"]))]), _: 1 }), e2.isBatch ? (_(), j(O(Z), { key: 1, initial: !1, mode: "wait" }, { default: k(() => [(_(), j(O(X).div, { key: O(d2).os, class: "flex justify-start opacity-40 overview-banner", variants: s2, initial: "hidden", animate: "visible", exit: "hidden" }, { default: k(() => [w("img", { src: O(d2).banner, class: "block h-full object-contain" }, null, 8, Ot)]), _: 1 }, 8, ["variants"]))]), _: 1 })) : A("", !0)])) : A("", !0)])), (_(!0), T(E, null, M(O(u2), (e3, t3) => (_(), T("div", { key: t3, class: "flex items-start self-stretch py-1 px-3 gap-1 select-none" }, [w("div", kt, D(e3.label), 1), w("div", At, D(e3.value), 1)]))), 128))]), _: 1 }, 8, ["collapsed", "title"]);
  };
} }), [["__scopeId", "data-v-0fba030b"]]);
var Mt = ["windowName", "proxyInfoList", "windowPlatformList", "cookie"];
function Nt() {
  return { value: [], panels: [{ value: "window", groupIndex: 0, placement: "outside", variant: "window" }, { title: $t("\u57FA\u7840\u8BBE\u7F6E"), tooltip: $t("\u7CFB\u7EDF\u5DF2\u63D0\u4F9B\u9ED8\u8BA4\u914D\u7F6E\uFF0C\u65E0\u9700\u4FEE\u6539\u5373\u53EF\u521B\u5EFA\uFF1B\u5982\u9700\u8C03\u6574\u7CFB\u7EDF\u3001\u5185\u6838\u3001\u8BED\u8A00\u3001\u65F6\u533A\u3001\u7A97\u53E3\u5927\u5C0F\u7B49\uFF0C\u53EF\u5C55\u5F00\u4FEE\u6539\u3002"), value: "0", groupIndex: 1, placement: "accordion" }, { title: $t("\u9AD8\u7EA7\u6307\u7EB9\u8BBE\u7F6E"), tooltip: $t("\u7CFB\u7EDF\u5DF2\u81EA\u52A8\u914D\u7F6E\uFF0C\u4E00\u822C\u65E0\u9700\u4FEE\u6539\uFF1B\u5982\u9700\u8C03\u6574\u5206\u8FA8\u7387\u3001WebRTC\u3001WebGL\u3001Canvas\u3001\u8BBE\u5907\u7B49\u6307\u7EB9\u53C2\u6570\uFF0C\u53EF\u5C55\u5F00\u4FEE\u6539\u3002"), value: "1", groupIndex: 2, placement: "accordion" }, { title: $t("\u504F\u597D\u8BBE\u7F6E"), tooltip: $t("\u7CFB\u7EDF\u5DF2\u63D0\u4F9B\u9ED8\u8BA4\u914D\u7F6E\uFF1B\u5982\u9700\u8C03\u6574\u4E66\u7B7E\u4E0E\u6570\u636E\u540C\u6B65\u3001\u542F\u52A8\u884C\u4E3A\u3001\u7F51\u7EDC\u89C4\u5219\u7B49\uFF0C\u53EF\u5C55\u5F00\u4FEE\u6539,"), value: "2", groupIndex: 3, placement: "accordion" }] };
}
function Pt() {
  return { value: [], panels: [{ title: $t("\u57FA\u7840\u8BBE\u7F6E"), tooltip: $t("\u7CFB\u7EDF\u5DF2\u63D0\u4F9B\u9ED8\u8BA4\u914D\u7F6E\uFF0C\u65E0\u9700\u4FEE\u6539\u5373\u53EF\u521B\u5EFA\uFF1B\u5982\u9700\u8C03\u6574\u7CFB\u7EDF\u3001\u5185\u6838\u3001\u8BED\u8A00\u3001\u65F6\u533A\u3001\u7A97\u53E3\u5927\u5C0F\u7B49\uFF0C\u53EF\u5C55\u5F00\u4FEE\u6539\u3002"), value: "basic", groupIndex: 0, extraGroupIndexes: [1], placement: "accordion", variant: "window", excludedFields: [...Mt] }, { title: $t("\u9AD8\u7EA7\u6307\u7EB9\u8BBE\u7F6E"), tooltip: $t("\u7CFB\u7EDF\u5DF2\u81EA\u52A8\u914D\u7F6E\uFF0C\u4E00\u822C\u65E0\u9700\u4FEE\u6539\uFF1B\u5982\u9700\u8C03\u6574\u5206\u8FA8\u7387\u3001WebRTC\u3001WebGL\u3001Canvas\u3001\u8BBE\u5907\u7B49\u6307\u7EB9\u53C2\u6570\uFF0C\u53EF\u5C55\u5F00\u4FEE\u6539\u3002"), value: "high", groupIndex: 2, placement: "accordion" }, { title: $t("\u504F\u597D\u8BBE\u7F6E"), tooltip: $t("\u7CFB\u7EDF\u5DF2\u63D0\u4F9B\u9ED8\u8BA4\u914D\u7F6E\uFF1B\u5982\u9700\u8C03\u6574\u4E66\u7B7E\u4E0E\u6570\u636E\u540C\u6B65\u3001\u542F\u52A8\u884C\u4E3A\u3001\u7F51\u7EDC\u89C4\u5219\u7B49\uFF0C\u53EF\u5C55\u5F00\u4FEE\u6539,"), value: "other", groupIndex: 3, placement: "accordion" }] };
}
export {dt as i,Pt as n,jt as r,Nt as t};