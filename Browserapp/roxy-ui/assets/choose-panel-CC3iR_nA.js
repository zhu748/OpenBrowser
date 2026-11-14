import {m as localCommercialComment} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Tr as e,cr as t,h as n,m as r,v as i,xr as a} from "./utils-BIWenCnY.js";
import {C as o,Et as s,F as c,J as l,L as u,N as d,St as f,V as ee,W as p,_t as te,at as m,b as h,d as g,en as _,f as v,h as y,i as b,in as x,jt as S,lt as C,m as w,rt as T,st as E,ut as D,x as O} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {o as k} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as ne} from "./locales-BfKu2SD4.js";
import {n as re} from "./agent-BmSFI9WH.js";
import {i as ie} from "./permission-DOhNJfB3.js";
import {m as j,n as ae,r as M} from "./proxy-D7e36h-l.js";
import {a as N,i as P} from "./proxy-create-mode-BCcLAAf5.js";
import {Z as F} from "./basecomponent-ClhuVxJN.js";
import {t as I} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as L} from "./tooltip-BYYKWrvu.js";
import {t as R} from "./rx-button-DyzuUt-V.js";
import {a as z,n as B} from "./isValid-D6rH8LLp.js";
import {d as V} from "./format-_cvrr_iF.js";
import {t as oe} from "./m-input-select-C8pih1gY.js";
import {o as H,t as se} from "./hooks-Jw3GridD.js";
import {t as U} from "./form-BQBA_XzO.js";
import {n as ce,t as W} from "./check-channel-BUSbubqx.js";
import {t as G} from "./useProxyModuleCreate-DnWsQ0mq.js";
function le(e2) {
  return (t2) => {
    let n2 = (e2 ? Math[e2] : Math.trunc)(t2);
    return n2 === 0 ? 0 : n2;
  };
}
function ue(e2, t2, n2) {
  let [r2, i2] = V(n2?.in, e2, t2), a2 = (+r2 - i2) / z;
  return le(n2?.roundingMethod)(a2);
}
function de(e2) {
  return +B(e2) > Date.now();
}
var K = { class: "rx-preview-card__header flex flex-row-reverse items-center justify-between self-stretch select-none" };
var fe = { key: 0 };
var q = { key: 0, class: "w-full shrink-0" };
var J = { class: "rx-preview-card__infos w-full" };
var Y = { class: "rx-preview-card__list" };
var X = { key: 1, class: "w-full shrink-0" };
var Z = I(o({ __name: "index", props: d({ title: {}, fill: { type: Boolean } }, { collapsed: { type: Boolean, default: !1 }, collapsedModifiers: {} }), emits: ["update:collapsed"], setup(e2) {
  let t2 = T(e2, "collapsed");
  return (n2, r2) => {
    let i2 = F, a2 = L;
    return p(), y("div", { class: _(["rx-preview-card flex flex-col gap-2.5", { "is-fill": e2.fill, "is-collapsed": t2.value }]) }, [t2.value ? w("", !0) : l(n2.$slots, "before", {}, void 0, !0, 0), v("div", { class: _(["rx-preview-card__panel flex flex-col items-start justify-start gap-3 overflow-hidden rounded-xl pa-4", t2.value ? "" : "min-h-0 flex-1"]) }, [v("div", K, [D(O(i2, { class: "shrink-0 cursor-pointer", name: t2.value ? "base/rx_ic_show_preview" : "base/rx_ic_hide_preview", color: "var(--colors-icon-primary)", onClick: r2[0] ||= (e3) => t2.value = !t2.value }, null, 8, ["name"]), [[a2, t2.value ? n2.$t("\u5C55\u5F00") : n2.$t("\u6536\u8D77")]]), t2.value ? w("", !0) : (p(), y("div", fe, [l(n2.$slots, "title", {}, () => [h(x(e2.title), 1)], !0)]))]), t2.value ? w("", !0) : (p(), y(b, { key: 0 }, [n2.$slots.banner ? (p(), y("div", q, [l(n2.$slots, "banner", {}, void 0, !0)])) : w("", !0), v("div", J, [v("div", Y, [l(n2.$slots, "default", {}, void 0, !0), r2[1] ||= v("div", { class: "h-6 w-full invisible" }, null, -1)])]), n2.$slots.footer ? (p(), y("div", X, [l(n2.$slots, "footer", {}, void 0, !0)])) : w("", !0)], 64))], 2)], 2);
  };
} }), [["__scopeId", "data-v-4de31cf8"]]);
var Q = { ref: "root", class: "contents" };
var pe = I(o({ __name: "custom-panel", props: { modelValue: { default: null }, modelModifiers: {} }, emits: ["update:modelValue"], setup(n2, { expose: o2 }) {
  let l2 = T(n2, "modelValue"), [d2] = re(), { getUserConfig: ee2 } = i(), { testProxy: g2, batchTestShowToast: _2 } = se(), v2 = m("form"), b2 = m("root"), x2 = k(), S2 = f(!1), C2 = l2.value ?? {};
  function w2(e2) {
    let t2 = e2?.toString?.()?.split("/")[0]?.trim();
    return !t2 || t2.toLowerCase() === "noproxy" ? "" : t2.toLocaleUpperCase();
  }
  function E2() {
    c(() => G2());
  }
  function D2(e2) {
    let t2 = N(e2);
    if (!t2) return !1;
    v2.value?.setValues(P(t2));
    let n3 = v2.value?.getFieldState("checkChannel")?.value;
    return L2(t2.ipType, n3), E2(), !0;
  }
  function ne2(e2) {
    D2(e2.clipboardData?.getData("text") ?? "") && e2.preventDefault();
  }
  function ie2(e2) {
    D2(e2.target.value), E2();
  }
  function ae2(t2) {
    let n3 = e(t2.target.value);
    if (a(Object.values(n3).filter(Boolean))) return;
    let { protocol: r2, host: i2, port: o3, proxyUserName: s2, proxyPassword: c2, refreshUrl: l3 } = n3, u2 = i2?.startsWith("[") ? M.IPV6 : M.IPV4;
    v2.value?.setValues({ ipType: u2, host: i2?.replace(/\[|\]/g, ""), port: o3, proxyUserName: s2, proxyPassword: c2, ...r2 ? { proxyCategory: r2.toLocaleUpperCase() } : {}, refreshUrl: l3, proxyRules: "" }), L2(u2), E2();
  }
  async function F2(e2) {
    await L2(e2, v2.value?.getFieldState("checkChannel")?.value), E2();
  }
  async function I2(e2, t2) {
    let [n3, i2] = await Promise.all([ee2(), r()]), a2 = e2 === M.IPV6, o3 = W(i2[a2 ? "ipv6-query-channels" : "checkChannel"]), s2 = o3.find((e3) => e3.value === t2), c2 = s2 ? t2 : o3[0]?.value;
    return !a2 && !s2 && (c2 = n3?.ipChecker || c2), { checkChannel: c2, options: o3, dictMap: i2 };
  }
  async function L2(e2, t2) {
    let { checkChannel: n3, options: r2 } = await I2(e2, t2);
    v2.value?.setInputsProps({ checkChannel: { value: n3, options: r2 } });
  }
  let z2 = [{ type: "textarea", label: $t("\u667A\u80FD\u8BC6\u522B"), name: "proxyRules", props: { placeholder: $t(`192.168.0.1:8000:\u4EE3\u7406 IP \u7528\u6237\u540D:\u4EE3\u7406 IP \u5BC6\u7801[\u52A8\u6001\u4EE3\u7406 IP \u5237\u65B0 URL]
\u4EE3\u7406 IP \u7528\u6237\u540D:\u4EE3\u7406 IP \u5BC6\u7801{at}192.168.0.1:8000[\u52A8\u6001\u4EE3\u7406 IP \u5237\u65B0 URL]`, { at: "@", notes: `{${$t("\u5907\u6CE8")}}` }), rows: 3, onBlur: ae2 }, resolver: (t2) => t2.string().refine((t3) => a(t3) ? !0 : !a(Object.values(e(t3)).filter(Boolean)), { message: $t("\u89E3\u6790\u9519\u8BEF,\u8BF7\u68C0\u67E5\u683C\u5F0F") }) }, { type: "radio", label: $t("\u4EE3\u7406 IP \u7C7B\u578B"), name: "ipType", value: C2.ipType ?? null, props: { name: "ipType", onValueChange: F2 } }, { type: "group", label: $t("\u4EE3\u7406 IP \u4FE1\u606F"), items: [{ type: "select", name: "proxyCategory", itemClass: "w-26", value: w2(C2.proxyCategory || C2.protocol) || null, props: { optionValue: "value", onChange: E2 } }, { type: "text", name: "host", itemClass: `flex-1 ${x2.host}`, value: C2.host ?? null, required: !0, props: { placeholder: $t("\u4EE3\u7406 IP \u4E3B\u673A"), onInput: E2, onPaste: ne2, onBlur: ie2 } }, { type: "text", name: "port", itemClass: `flex-1 ${x2.port}`, value: C2.port?.toString?.()?.split?.("/")?.[0] ?? null, props: { placeholder: $t("\u4EE3\u7406 IP \u7AEF\u53E3"), useGrouping: !1, onInput: E2, onBlur: E2 }, slots: { preIcon: () => O("span", { class: "text-3 leading-none" }, [h(":")]) }, resolver: (e2) => e2.string().refine((e3) => a(e3) ? !1 : Number(e3) >= 1 || Number(e3) <= 65535, { message: $t("\u7AEF\u53E3\u8303\u56F4 1~65535") }) }] }, { type: "text", name: "proxyUserName", label: $t("\u4EE3\u7406 IP \u7528\u6237\u540D"), value: C2.proxyUserName ?? "", props: { placeholder: $t("\u8BF7\u8F93\u5165\u4EE3\u7406 IP \u8D26\u53F7"), onInput: E2, onBlur: E2 } }, { type: "text", name: "proxyPassword", label: $t("\u4EE3\u7406 IP \u5BC6\u7801"), value: C2.proxyPassword ?? "", props: { placeholder: $t("\u8BF7\u8F93\u5165\u4EE3\u7406 IP \u5BC6\u7801"), onInput: E2, onBlur: E2 } }, { type: "text", name: "refreshUrl", label: $t("\u5237\u65B0 URL"), tooltip: $t("\u5982\u4EE3\u7406 IP \u670D\u52A1\u5546\u672A\u63D0\u4F9B\u5237\u65B0 URL\uFF0C\u5219\u65E0\u9700\u914D\u7F6E\u3002\u586B\u5199\u540E\u53EF\u70B9\u51FB\u53F3\u4FA7\u5237\u65B0\u6309\u94AE\u8BF7\u6C42\u66F4\u6362\u5F53\u524D\u51FA\u53E3 IP\u3002"), value: C2.refreshUrl ?? "", props: { placeholder: $t("\u52A8\u6001\u4EE3\u7406 IP \u4E13\u7528\uFF0C\u9759\u6001\u4EE3\u7406 IP \u65E0\u9700\u586B\u5199"), icon: "base/rx_ic_refresh", onInput: E2, onBlur: E2, onIconClick: async () => {
    let e2 = v2.value?.getFieldState("refreshUrl")?.value;
    if (e2) {
      let t2 = await globalThis.electronAPI.send("proxy:refreshUrl", e2);
      d2(t2 ? 0 : -1, e2);
    }
  } } }, { label: $t("\u4EE3\u7406 IP \u68C0\u6D4B"), name: "checkChannel", tooltip: $t("\u7528\u4E8E\u67E5\u8BE2\u4EE3\u7406 IP \u7684\u51FA\u53E3\u4F4D\u7F6E\u53CA\u7F51\u7EDC\u4FE1\u606F\u3002\u5982\u68C0\u6D4B\u7ED3\u679C\u5F02\u5E38\u6216\u4E0D\u51C6\u786E\uFF0C\u53EF\u5207\u6362\u5176\u4ED6\u67E5\u8BE2\u6E20\u9053\u540E\u91CD\u65B0\u6D4B\u8BD5\u3002"), value: C2.checkChannel ?? null, props: { fluid: !0, optionValue: "value", onChange: E2 }, render: (e2) => O("div", { class: "w-full flex justify-between items-center gap-1.5 overflow-hidden" }, [O(oe, e2, { "option-extra": ({ option: e3 }) => O(ce, { option: e3 }, null) }), O(R, { class: "flex-shrink-0", severity: "secondary", variant: "outlined", icon: "base/rx_ic_speed_test", disabled: S2.value, label: $t("\u6D4B\u8BD5\u4EE3\u7406 IP"), onClick: K2 }, null)]) }];
  u(() => {
    B2();
  });
  async function B2() {
    await c(), await V2(l2.value ?? {}), G2();
  }
  async function V2(e2) {
    let { checkChannel: t2, options: n3, dictMap: r2 } = await I2(e2.ipType || M.IPV4, e2.checkChannel), i2 = w2(e2.proxyCategory || e2.protocol) || r2.protocol?.[0]?.value;
    v2.value?.setInputsProps({ ipType: { value: e2.ipType || r2.ipType?.[0]?.value, options: r2.ipType }, proxyCategory: { value: i2, options: r2.protocol }, checkChannel: { value: t2, options: n3 } }), v2.value?.setValues({ ipType: e2.ipType || r2.ipType?.[0]?.value, proxyCategory: i2, checkChannel: t2, host: e2.host ?? "", port: e2.port?.toString?.()?.split?.("/")?.[0] ?? "", proxyUserName: e2.proxyUserName ?? "", proxyPassword: e2.proxyPassword ?? "", refreshUrl: e2.refreshUrl ?? "", proxyRules: "" });
  }
  function H2() {
    let { host: e2, port: t2, proxyUserName: n3, proxyPassword: r2, proxyRules: i2, ...a2 } = v2.value?.getValues() ?? {};
    return { host: e2?.trim(), port: t2?.toString?.()?.trim(), proxyUserName: n3?.trim(), proxyPassword: r2?.trim(), ...a2 };
  }
  function G2() {
    if (!v2.value) return;
    let e2 = H2(), t2 = w2(e2.proxyCategory), { id: n3, moduleId: r2, ...i2 } = l2.value ?? {};
    l2.value = { ...i2, ...e2, _tempId: l2.value?._tempId ?? Date.now().toString(32), id: void 0, moduleId: 0, proxyCategory: t2, protocol: t2, proxyMethod: "custom" };
  }
  async function le2(e2) {
    l2.value = e2, await V2(e2), G2();
  }
  function ue2() {
    let e2 = v2.value?.getValues() ?? {}, t2 = !String(e2.host ?? "").trim(), n3 = !String(e2.port ?? "").trim();
    v2.value?.setInputsProps({ host: { invalid: t2 }, port: { invalid: n3 } }), c(() => {
      let e3 = !t2 && n3 ? x2.port : x2.host, r2 = b2.value?.querySelector(`.${e3} input`);
      r2 instanceof HTMLInputElement && (r2.scrollIntoView({ behavior: "smooth", block: "center" }), r2.focus({ preventScroll: !0 }));
    });
  }
  function de2() {
    v2.value?.setInputsProps({ host: { invalid: !1 }, port: { invalid: !1 } });
  }
  o2({ applyExternalItem: le2, checkProxy: K2, locateMissingProxy: ue2, clearMissingProxy: de2 });
  async function K2() {
    if (!globalThis.isElectron) return globalThis.electronAPI.send("proxy:detect", {});
    if (await v2.value?.instance.validate(), !v2.value?.instance.valid) return;
    G2(), S2.value = !0;
    let e2 = H2(), n3 = typeof l2.value?.lastCountry == "string" ? l2.value.lastCountry.trim() : "", r2 = await g2({ ...t(e2), apiCheck: !1, isDirect: !1, proxyType: l2.value?.proxyType ?? l2.value?.buyProxyType ?? j.resource, ...n3 ? { lastCountry: n3 } : {} });
    S2.value = !1, _2([{ ...r2, proxyType: j.resource }], { reCheck: () => K2() }), l2.value &&= { ...s(l2.value), ...r2 };
  }
  return (e2, t2) => (p(), y("div", Q, [O(U, { ref: "form", class: "!gap-3", position: "left", inputs: z2 }, null, 512)], 512));
} }), [["__cssModules", { $style: { host: "_host_1tjmp_1", port: "_port_1tjmp_5" } }]]);
var me = { class: "flex items-center gap-1.5" };
var he = { class: "tt-tertiary text-3" };
var ge = { class: "flex-1 min-w-0 flex items-center gap-1.5" };
var _e = { class: "w-90 min-w-0 flex flex-col gap-0.5" };
var ve = { class: "min-w-0 flex items-center gap-2" };
var ye = { class: "min-w-0 ellipsis-1 tt-tertiary text-3 leading-4" };
var be = { key: 0, class: "shrink-0 tt-success text-2.75 font-[DingTalk_JinBuTi]" };
var xe = { key: 0, class: "pl-5.5 ellipsis-1 tt-secondary text-3.5 leading-4.5 font-600" };
var Se = { key: 1, class: "pl-5.5 ellipsis-1 tt-tertiary text-3.25 leading-4.5 font-[JetBrains_Mono]" };
var Ce = { key: 2, class: "pl-5.5 ellipsis-1 tt-tertiary text-3 leading-4" };
var we = { class: "pa-1" };
var Te = I(o({ __name: "choose-panel", props: { modelValue: { default: null }, modelModifiers: {} }, emits: d(["buy"], ["update:modelValue"]), setup(e2, { expose: r2, emit: i2 }) {
  let a2 = i2, o2 = T(e2, "modelValue"), { testProxy: c2, batchTestShowToast: l2 } = se(), { updateProxyModules: u2 } = G(), [d2] = re(), m2 = f(!1), h2 = f(!1), b2 = f(!1), k2 = f([]), A2 = 0;
  function M2(e3) {
    return [e3.lastCountry, e3.lastCity].filter(Boolean).join(" / ") || "--";
  }
  function N2(e3) {
    return H(e3?.orderStatus);
  }
  function P2() {
    return $t("\u914D\u7F6E\u4E2D, \u9884\u8BA1 {time} \u5206\u949F\u5185\u5B8C\u6210", { time: 2 });
  }
  function I2(e3) {
    let t2 = M2(e3);
    return t2 === "--" && N2(e3) ? P2() : t2;
  }
  function z2(e3) {
    let t2 = String(e3.proxyCategory || e3.protocol || "").trim(), n2 = String(e3.host || "").trim(), r3 = String(e3.port ?? "").trim();
    if (!n2 && !r3 || e3.isEncryptProxy) return "";
    let i3 = [n2, r3].filter(Boolean).join(":");
    return t2 ? `${t2.toLocaleLowerCase()}://${i3}` : i3;
  }
  function B2(e3) {
    if (Array.isArray(e3)) return e3.length;
    if (e3 == null || e3 === "") return 0;
    try {
      let t2 = JSON.parse(String(e3));
      return Array.isArray(t2) ? t2.length : 0;
    } catch {
      return 0;
    }
  }
  let V2 = !!globalThis.isCloudPhoneApp;
  function U2(e3) {
    if (V2) {
      if (e3.phoneBindCount != null && e3.phoneBindCount !== "") {
        let t3 = Number(e3.phoneBindCount);
        if (Number.isFinite(t3)) return Math.max(0, Math.trunc(t3));
      }
      return B2(e3.phoneBindList);
    }
    let t2 = B2(e3.bindList), n2 = Number(e3.bindCount);
    return Math.max(t2, Number.isFinite(n2) ? n2 : 0);
  }
  function ce2() {
    return V2 ? $t("\u5DF2\u5173\u8054 {count} \u4E2A\u4E91\u624B\u673A", { count: "{count}" }) : $t("\u5DF2\u5173\u8054 {count} \u4E2A\u7A97\u53E3", { count: "{count}" });
  }
  function W2(e3) {
    let t2 = String(e3.remark ?? "").trim();
    return t2 ? $t("\u5907\u6CE8: {remark}", { remark: t2 }) : "";
  }
  function le2(e3) {
    if ((e3.proxyType ?? e3.buyProxyType) !== j.buy) return !1;
    let t2 = new Date(e3.createTime);
    return Number.isNaN(t2.getTime()) || de(t2) ? !1 : ue(/* @__PURE__ */ new Date(), t2) < 24;
  }
  function K2(e3) {
    let t2 = M2(e3), n2 = I2(e3), r3 = String(e3.lastIp || "").trim(), i3 = [n2 === "--" ? "" : n2, r3].filter(Boolean).join(" \u2022 ") || "--";
    return { ...e3, icon: e3.lastCountry ? `country-code/${e3.lastCountry}` : "base/rx_ic_earth", label: i3, searchText: [e3.lastCountry, e3.lastCity, t2, n2, r3, e3.protocol, e3.host, e3.port, e3.remark].filter(Boolean).join(" ") };
  }
  let fe2 = ["lastIp", "lastCountry", "lastCity", "lastState", "checkStatus", "checkTime"];
  function q2(e3, t2) {
    let n2 = {};
    for (let e4 of fe2) {
      let r3 = t2[e4];
      r3 != null && r3 !== "" && (n2[e4] = r3);
    }
    return K2({ ...e3, ...n2 });
  }
  function J2(e3) {
    return e3 ? e3.isEncryptProxy && e3.proxyEncryptInfo ? !0 : !!(String(e3.host || "").trim() && String(e3.port ?? "").trim()) : !1;
  }
  function Y2() {
    let e3 = o2.value;
    if (!e3?.id || J2(e3)) return;
    let t2 = k2.value.find((t3) => String(t3.id) === String(e3.id));
    t2 && (J2(t2) || N2(t2)) && (o2.value = { ...q2(t2, e3), proxyMethod: "choose" });
  }
  let X2 = g(() => {
    let e3 = k2.value, t2 = o2.value;
    if (!t2?.id) return e3;
    let n2 = e3.findIndex((e4) => String(e4.id) === String(t2.id));
    if (n2 < 0) return [K2(t2), ...e3];
    let r3 = e3.slice();
    return r3[n2] = q2(e3[n2], t2), r3;
  }), Z2 = g({ get: () => {
    let e3 = o2.value?.id;
    return e3 == null || e3 === "" ? null : X2.value.find((t2) => String(t2.id) === String(e3))?.id ?? e3;
  }, set: (e3) => {
    if (e3 == null || e3 === "") {
      o2.value = null;
      return;
    }
    let t2 = k2.value.find((t3) => String(t3.id) === String(e3)) ?? X2.value.find((t3) => String(t3.id) === String(e3));
    o2.value = t2 ? { ...t2, proxyMethod: "choose" } : null;
  } });
  ee(() => {
    Q2();
  });
  async function Q2() {
    let e3 = ++A2;
    b2.value = !0;
    try {
      let { code: t2, data: r3 } = await n.proxy.userGetProxyListMergedList({ type: ae.UseDeploy, page_index: "1", page_size: "200" });
      if (e3 !== A2 || t2 !== 0) return;
      k2.value = (r3?.rows ?? []).map((e4) => K2(e4)), Y2();
    } finally {
      e3 === A2 && (b2.value = !1);
    }
  }
  E(() => [o2.value?.id, k2.value], () => {
    Y2();
  });
  async function pe2() {
    h2.value = !0;
    try {
      let { code: e3, data: t2, msg: r3 } = await n.proxy.userGetRandomAvailableProxyMergedList();
      if (e3 !== 0 || !t2) {
        d2(e3 === 0 ? -1 : e3, r3 || $t("\u6682\u65E0\u53EF\u7528\u4EE3\u7406 IP"));
        return;
      }
      o2.value = { ...K2(t2), proxyMethod: "choose" };
    } finally {
      h2.value = !1;
    }
  }
  function Te2(e3) {
    e3(), a2("buy");
  }
  r2({ checkProxy: $ });
  function Ee(e3) {
    o2.value?.id && (o2.value = { ...s(o2.value), ...e3 });
  }
  async function De() {
    let e3 = o2.value, t2 = e3?.id;
    if (t2 == null || t2 === "") return e3;
    try {
      let { code: r3, data: i3 } = await n.proxy.userGetProxyDetailMergedList({ id: String(t2) });
      if (r3 !== 0 || !i3) return e3;
      let a3 = K2({ ...i3, id: t2, proxyMethod: "choose" }), s2 = k2.value.findIndex((e4) => String(e4.id) === String(t2));
      return s2 < 0 ? k2.value = [a3, ...k2.value] : k2.value[s2] = a3, o2.value = { ...a3, proxyMethod: "choose" }, o2.value;
    } catch (t3) {
      return console.error("[Proxy:choose-panel] refresh configuring proxy failed", t3), e3;
    }
  }
  async function Oe() {
    if (Y2(), J2(o2.value)) return o2.value;
    let e3 = o2.value?.id;
    if (e3 == null || e3 === "") return null;
    if (!k2.value.length && (await Q2(), J2(o2.value))) return o2.value;
    try {
      let { code: t2, data: r3 } = await n.proxy.userGetProxyDetailMergedList({ id: String(e3) });
      if (t2 !== 0 || !r3) return J2(o2.value) ? o2.value : null;
      let i3 = K2({ ...r3, id: e3, proxyMethod: "choose" }), a3 = k2.value.findIndex((t3) => String(t3.id) === String(e3));
      return a3 < 0 ? k2.value = [i3, ...k2.value] : k2.value[a3] = q2(i3, k2.value[a3]), o2.value = { ...q2(i3, o2.value || i3), proxyMethod: "choose" }, o2.value;
    } catch (e4) {
      return console.error("[Proxy:choose-panel] fetch proxy detail failed", e4), J2(o2.value) ? o2.value : null;
    }
  }
  async function $() {
    if (!o2.value?.id) {
      d2(-1, $t("\u8BF7\u5148\u9009\u62E9\u4EE3\u7406 IP"));
      return;
    }
    let e3 = X2.value.find((e4) => String(e4.id) === String(o2.value?.id));
    if ((N2(o2.value) || N2(e3)) && (m2.value = !0, N2(await De()))) {
      m2.value = !1, d2(-1, P2());
      return;
    }
    let n2 = await Oe();
    if (!n2 || !J2(n2)) {
      m2.value = !1, d2(-1, $t("\u672A\u627E\u5230\u5DF2\u7ED1\u5B9A\u7684\u4EE3\u7406 IP"));
      return;
    }
    if (!globalThis.isElectron) return m2.value = !1, globalThis.electronAPI.send("proxy:detect", {});
    let r3 = t(n2), i3 = r3.proxyType ?? r3.buyProxyType;
    m2.value = !0;
    let a3 = await c2({ ...r3, apiCheck: !1, proxyType: i3 });
    m2.value = !1, l2({ ...a3, proxyType: i3 }, { reCheck: () => $() }), Ee(a3), i3 === j.resource && await u2({ proxyList: [{ ...a3, id: r3.id, proxyType: i3 }], requestType: ie.SpeedTest });
  }
  return (e3, t2) => {
    let n2 = F, r3 = L;
    return p(), y("div", me, [v("div", he, x(e3.$t("\u5DF2\u6709\u4EE3\u7406 IP\uFF1A")), 1), v("div", ge, [O(oe, { modelValue: S(Z2), "onUpdate:modelValue": t2[0] ||= (e4) => te(Z2) ? Z2.value = e4 : null, class: "flex-1 min-w-0", options: S(X2), "option-value": "id", "option-label": "label", filter: "", "show-clear": "", "overlay-auto-width": "", "filter-fields": ["searchText", "label", "lastCountry", "lastCity", "lastIp", "remark", "host", "protocol"], "filter-placeholder": e3.$t("\u641C\u7D22\u5730\u533A / IP / \u5907\u6CE8"), placeholder: e3.$t("\u8BF7\u9009\u62E9\u5DF2\u6709\u4EE3\u7406 IP"), "empty-message": S(b2) ? e3.$t("\u52A0\u8F7D\u4E2D...") : e3.$t("\u6682\u65E0\u4EE3\u7406 IP"), "overlay-class": "proxy-picker-panel", "scroll-height": "20rem", onBeforeShow: Q2 }, { option: C(({ option: t3 }) => [v("div", _e, [v("div", ve, [O(n2, { class: "shrink-0", name: t3.icon, fallback: "base/rx_ic_earth", color: "var(--colors-icon-icon-inactive)", size: "14" }, null, 8, ["name"]), v("div", ye, x(I2(t3)), 1), le2(t3) ? (p(), y("div", be, x(e3.$t("\u6700\u8FD1\u8D2D\u4E70")), 1)) : w("", !0), O(S(ne), { tag: "div", class: "mx-auto mr-0 shrink-0 tt-tertiary text-3 leading-4", keypath: ce2(), scope: "global" }, { count: C(() => [v("span", { class: _(U2(t3) > 0 ? "tt-brand" : "") }, x(U2(t3)), 3)]), _: 2 }, 1032, ["keypath"])]), z2(t3) ? (p(), y("div", xe, x(z2(t3)), 1)) : w("", !0), String(t3.lastIp || "").trim() ? (p(), y("div", Se, x(t3.lastIp), 1)) : w("", !0), W2(t3) ? (p(), y("div", Ce, x(W2(t3)), 1)) : w("", !0)])]), footer: C(({ close: t3 }) => [v("div", we, [localCommercialComment("", !0)])]), _: 1 }, 8, ["modelValue", "options", "filter-placeholder", "placeholder", "empty-message"]), D(O(S(R), { severity: "secondary", variant: "text", icon: "base/rx_ic_shuffle", loading: S(h2), onClick: pe2 }, null, 8, ["loading"]), [[r3, e3.$t("\u4ECE\u5F53\u524D\u53EF\u9009\u7684\u4EE3\u7406 IP \u4E2D\u968F\u673A\u9009\u62E9 1 \u4E2A\u4EE3\u7406 IP"), void 0, { top: !0 }]]), O(S(R), { severity: "secondary", variant: "outlined", icon: "base/rx_ic_speed_test", label: e3.$t("\u6D4B\u8BD5\u4EE3\u7406 IP"), loading: S(m2), onClick: $ }, null, 8, ["label", "loading"])])]);
  };
} }), [["__scopeId", "data-v-1f4dc7bb"]]);
export {pe as n,Z as r,Te as t};