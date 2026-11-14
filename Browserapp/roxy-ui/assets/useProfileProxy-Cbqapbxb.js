import {_t as e,h as t,nn as n,sr as r,xr as i} from "./utils-BIWenCnY.js";
import {Et as a,St as o,Tt as s,d as c} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as l} from "./agent-BmSFI9WH.js";
import {n as u} from "./permission-DOhNJfB3.js";
import {m as d,n as f,o as p,t as m} from "./proxy-D7e36h-l.js";
import {b as h} from "./rich-html-link-VdBpR3Cm.js";
import {s as g} from "./ry-table-do6kugym.js";
import {n as _} from "./useconfirm-CV4GTWBW.js";
import {t as v} from "./format-_cvrr_iF.js";
import {c as y,n as b,o as x,s as S,t as C} from "./hooks-Jw3GridD.js";
var w = (function(e2) {
  return e2[e2.opened = 1] = "opened", e2[e2.closed = 0] = "closed", e2;
})({});
var T = (function(e2) {
  return e2.ProxySelect = "proxy_select", e2.ProxyAdd = "proxy_add", e2.ProxyDelete = "proxy_delete", e2.PlatformAdd = "platform_add", e2.PlatformSelect = "platform_select", e2.PlatformEdit = "platform_edit", e2.CookieEdit = "cookie_edit", e2;
})({});
var E = [["lastIp", "beforeIp"], ["lastCity", "beforeCity"], ["lastCountry", "beforeCountry"], ["checkTime", "beforeTime"]];
var D = ["moduleId", "proxyMethod", "checkChannel", "checkStatus", "checkTime", "country", "host", "ipType", "lastCity", "lastCountry", "lastIp", "port", "protocol", "proxyCategory", "proxyPassword", "proxyUserName", "refreshUrl", "timezone", "proxyNetwork", "buyProxyType", "isDirect", "isEncryptProxy", "proxyEncryptInfo"];
var O = ["host", "ipType", "port", "proxyPassword", "proxyUserName", "refreshUrl"];
var k = ["isEncryptProxy", "proxyEncryptInfo"];
function A(e2) {
  return typeof e2 == "string" ? e2.trim().length > 0 : e2 != null && e2 !== "";
}
function j(e2) {
  if (e2._checkRes?.checkStatus !== p.failure) return;
  let t2 = e2.beforeProxyInfo?.beforeCountry;
  if (typeof t2 == "string") return t2.trim() || void 0;
}
function M(e2, t2, n2) {
  let { replaceProxy: r2 = !0 } = n2 ?? {}, i2 = e2.beforeProxyInfo && typeof e2.beforeProxyInfo == "object" ? e2.beforeProxyInfo : {}, a2 = !A(e2.lastIp) && !A(e2.lastCountry), o2 = A(i2.beforeCountry) || A(i2.beforeIp), s2 = {};
  for (let [n3, r3] of E) Object.hasOwn(t2, n3) && (s2[r3] = a2 && o2 && A(i2[r3]) ? i2[r3] : e2[n3]);
  e2.beforeProxyInfo = s2;
  for (let n3 of D) Object.hasOwn(t2, n3) && (e2[n3] = t2[n3]);
  if (r2 && !t2.isEncryptProxy) for (let t3 of k) delete e2[t3];
}
function N(e2, t2, n2 = "windowPlatformList") {
  Reflect.set(e2, n2, t2.map((e3) => ["id", "_tempId", "platformEfa", "platformName", "platformIcon", "platformIconDark", "platformPassword", "platformUrl", "platformUserName", "platformRemarks"].reduce((t3, n3) => (Object.hasOwn(e3, n3) && (t3[n3] = e3[n3]), t3), {})));
}
function P(e2) {
  return e2?.ip ? { lastIp: e2.ip ?? "", lastCity: e2.city ?? "", lastCountry: e2.country_code ?? "", timezone: e2.timezone ?? "", checkStatus: p.success, checkTime: v(/* @__PURE__ */ new Date(), "yyyy-MM-dd HH:mm:ss") } : null;
}
function F(e2) {
  return { checkStatus: e2.checkStatus, lastIp: e2.lastIp, lastCity: e2.lastCity, lastCountry: e2.lastCountry, timezone: e2.timezone, checkTime: e2.checkTime, host: e2.host, port: e2.port == null ? void 0 : String(e2.port), proxyUserName: e2.proxyUserName, proxyPassword: e2.proxyPassword, proxyRules: e2.proxyRules, ipType: e2.ipType, proxyCategory: e2.proxyCategory || e2.protocol, refreshUrl: e2.refreshUrl, checkChannel: e2.checkChannel, protocol: e2.protocol };
}
function I(e2) {
  return e2.map((e3) => ({ ...F(e3), moduleId: 0, proxyMethod: "custom" }));
}
function L(e2) {
  return e2.flatMap(({ _proxyCount: e3, bindList: t2, ...n2 }) => {
    let r2 = Math.max(1, Number(e3) || 1);
    return Array.from({ length: r2 }).fill(n2);
  });
}
function R(e2) {
  return L(e2).map((e3) => ({ ...F(e3), moduleId: e3.id ?? 0, proxyMethod: "choose" }));
}
function z(e2) {
  i(e2) || t.proxy.userMdfProxyModuleCreate({ proxyList: e2, requestType: u.SpeedTest });
}
async function B(e2, n2) {
  let r2 = e2.filter((e3) => e3.checkRes.checkStatus !== p.none);
  if (r2.length === 0) return;
  let i2 = r2.map((e3) => ({ id: e3.item.id, dirId: e3.item.dirId, ...e3.checkRes })), { code: a2, msg: o2 } = await t.window.userMdfWindowProxyCheckBatchCreate({ proxyList: i2, requestType: u.SpeedTest });
  n2.onlyErrorToast?.(a2, o2);
}
async function V(e2, n2) {
  if (!e2?.immediate) {
    n2.router.push({ name: "agent-list", query: { name: "shop", orderNo: e2?.orderNo } });
    return;
  }
  let { code: r2, data: i2 } = await t.proxy.userGetProxyModuleListList({ orderNo: e2?.orderNo, type: f.UseDeploy });
  if (r2 === 0 && i2.rows?.[0]) return i2.rows[0];
}
function H() {
  let e2 = _(), [, n2] = l();
  function i2(e3) {
    return { id: e3.moduleId, ...Object.fromEntries(["host", "ipType", "port", "protocol", "proxyCategory", "proxyPassword", "proxyUserName", "refreshUrl", "checkChannel", "lastCountry", "buyProxyType"].map((t2) => [t2, e3[t2]])) };
  }
  function a2(e3) {
    let t2 = { moduleId: 0, proxyCategory: "noproxy", proxyMethod: "custom", buyProxyType: d.resource, checkStatus: p.none, ...r(O, "") };
    return e3.openTime ? Reflect.deleteProperty(t2, "lastIp") : Reflect.set(t2, "lastIp", ""), t2;
  }
  function o2(r2) {
    let i3 = [].concat(r2), o3 = i3.map((e3) => e3.id), { promise: s2, resolve: c2, reject: l2 } = Promise.withResolvers();
    return e2.require({ header: $t("\u5220\u9664\u4EE3\u7406 IP"), message: $t("\u60A8\u786E\u8BA4\u8981\u5220\u9664\u4EE3\u7406 IP \u5417\uFF1F"), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: async () => {
      let { code: e3, msg: r3 } = await t.window.userMdfWindowDataBatchCreate({ ids: o3, type: T.ProxyDelete, requestType: u.DeleteProxy });
      n2(e3, r3), c2(), e3 === 0 && i3.forEach((e4) => {
        M(e4, a2(e4));
      });
    }, reject: l2, onHide: l2 }), s2;
  }
  return { buildProxyData: i2, confirmDeleteProxy: o2 };
}
function U() {
  let t2 = h(), { buyProxy: n2 } = b(), { getProxyVendors: r2 } = e(), i2 = o();
  async function a2(e2) {
    if (!i2.value) {
      let e3 = await r2();
      if (!e3) return;
      i2.value = e3.find((e4) => e4.isOfficial);
    }
    if (!i2.value) return;
    let a3 = { proxyProviderId: i2.value.id, proxyProviderWebsite: i2.value.vendorWebsite, proxyProviderIcon: i2.value.vendorIcon, proxyProviderName: i2.value.vendorName };
    try {
      return await V(await n2({ provider: a3, entryType: m.Immediate, ...e2 ? { preferredCountry: e2 } : {} }), { router: t2 });
    } catch {
    }
  }
  return { purchaseImmediateOfficialProxy: a2 };
}
function W() {
  let t2 = h(), { check: r2 } = n(), { getProxyVendors: i2 } = e(), a2 = o(!1), l2 = o(), u2 = s({}), d2 = c(() => r2("Cost_Center_all")), f2 = c(() => r2("Profiles_add_proxy_outside")), p2 = c(() => {
    if (l2.value) return { proxyProviderId: l2.value.id, proxyProviderWebsite: l2.value.vendorWebsite, proxyProviderIcon: l2.value.vendorIcon, proxyProviderName: l2.value.vendorName };
  });
  async function m2(e2 = {}) {
    if (d2.value && !l2.value) {
      let e3 = await i2();
      if (!e3) return;
      l2.value = e3.find((e4) => e4.isOfficial);
    }
    (d2.value || f2.value) && (u2.value = e2, a2.value = !0);
  }
  function g2() {
    a2.value = !1;
  }
  async function _2(e2) {
    try {
      let n2 = await V(e2, { router: t2 });
      n2 && await u2.value.onBuySuccess?.(n2);
    } finally {
      g2();
    }
  }
  async function v2(e2) {
    try {
      await u2.value.onAddConfirm?.(e2);
    } finally {
      g2();
    }
  }
  return { visible: a2, showBuy: d2, showAdd: f2, provider: p2, openProxyBuyAddDrawer: m2, closeProxyBuyAddDrawer: g2, onProxyBuyAddBuySuccess: _2, onProxyBuyAddAddConfirm: v2 };
}
var G = /* @__PURE__ */ Symbol("proxyBuyAddDrawer");
function K(e2) {
  return x(y(e2));
}
function q(e2, t2) {
  let n2 = {}, r2 = t2.protocol || t2.proxyCategory;
  r2 && (n2.protocol = r2, n2.proxyCategory = r2);
  for (let e3 of ["host", "port", "proxyUserName", "proxyPassword", "refreshUrl", "ipType", "checkChannel", "lastIp", "lastCountry", "lastCity"]) {
    let r3 = t2[e3];
    r3 != null && r3 !== "" && (n2[e3] = r3);
  }
  t2.proxyType != null && (n2.buyProxyType = t2.proxyType), t2.isDirect != null && (n2.isDirect = t2.isDirect), t2.isEncryptProxy != null && (n2.isEncryptProxy = t2.isEncryptProxy), t2.proxyEncryptInfo && (n2.proxyEncryptInfo = t2.proxyEncryptInfo), M(e2, n2, { replaceProxy: !1 }), e2.proxyOrderStatus = t2.orderStatus, t2.proxyExpireStatus != null && (e2.proxyExpireStatus = t2.proxyExpireStatus);
}
async function J(e2) {
  let n2 = /* @__PURE__ */ new Map();
  for (let t2 of e2) {
    if (!K(t2) || !t2.moduleId) continue;
    let e3 = String(t2.moduleId), r2 = n2.get(e3);
    r2 ? r2.push(t2) : n2.set(e3, [t2]);
  }
  n2.size && await Promise.all([...n2.entries()].map(async ([e3, n3]) => {
    try {
      let { code: r2, data: i2 } = await t.proxy.userGetProxyDetailMergedList({ id: e3 });
      if (r2 !== 0 || !i2 || x(i2.orderStatus)) return;
      for (let e4 of n3) q(e4, i2);
    } catch (e4) {
      console.error("[Profile:proxy] refresh deploying proxy failed", e4);
    }
  }));
}
function Y() {
  return { loading: !1, checkStatus: p.failure, error: $t(`\u60A8\u8D2D\u4E70\u7684\u4EE3\u7406 IP \u6B63\u5728\u914D\u7F6E\u4E2D\uFF0C\u6682\u65F6\u65E0\u6CD5\u4F7F\u7528\u3002
\u8BF7\u66F4\u6362\u5176\u5B83\u53EF\u7528\u7684\u4EE3\u7406 IP \u6216\u7A0D\u540E\u6D4B\u8BD5\u5F53\u524D\u4EE3\u7406 IP\u3002`), lastIp: "", lastCity: "", lastCountry: "", timezone: "" };
}
function X() {
  let { testProxy: e2, batchTestShowToast: t2, concurrentProxyTest: n2 } = C(), [, r2] = l();
  async function i2(o2, s2) {
    if (!o2.length) return;
    if (!globalThis.isElectron) return globalThis.electronAPI.send("proxy:detect", {});
    let { operationName: c2, showConcurrentTaskTopBar: l2, silent: u2 } = { operationName: "checkProxy", showConcurrentTaskTopBar: !1, silent: !1, ...s2 }, f2 = new Set(o2.filter((e3) => K(e3)));
    f2.forEach((e3) => g(e3, c2, !0)), await J(o2);
    let p2 = o2.map((t3) => (g(t3, c2, !0), async () => {
      try {
        if (Reflect.deleteProperty(t3, "_checkRes"), f2.has(t3) && !S(t3)) return { item: t3, checkRes: K(t3) ? Y() : void 0, skipPersist: !0 };
        if (K(t3)) return { item: t3, checkRes: Y(), skipPersist: !0 };
        let n3 = await e2(a(t3));
        return M(t3, n3, { replaceProxy: !1 }), Reflect.set(t3, "_checkRes", a(n3)), { item: t3, checkRes: n3 };
      } finally {
        g(t3, c2, !1);
      }
    }));
    await n2({ tasks: p2, showConcurrentTaskTopBar: l2, tasksCompleted: async (e3, n3) => {
      e3.forEach((e4, t3) => {
        e4 === void 0 && g(o2[t3], c2, !1);
      });
      let a2 = e3.filter(Boolean), l3 = a2.filter((e4) => !e4.skipPersist), f3 = a2.filter((e4) => e4.skipPersist && e4.checkRes);
      !n3 && !u2 && f3.length && r2(-1, f3[0].checkRes.error), !n3 && !u2 && l3.length && t2(l3.map((e4) => ({ ...e4.checkRes, proxyType: e4.item.buyProxyType })), { reCheck: () => i2(o2, s2) });
      let p3 = /* @__PURE__ */ new Map();
      for (let { item: e4, checkRes: t3 } of l3) e4.moduleId && e4.buyProxyType === d.resource && !p3.has(e4.moduleId) && p3.set(e4.moduleId, { id: e4.moduleId, ...t3 });
      z(Array.from(p3.values())), await B(l3, { onlyErrorToast: u2 ? void 0 : r2 });
    } }).catch((e3) => {
      r2(-1, e3.message), o2.forEach((e4) => {
        g(e4, c2, !1);
      });
    });
  }
  return { runProxySpeedTestForRows: i2 };
}
export {X as a,P as c,M as d,T as f,H as i,j as l,R as n,W as o,w as p,I as r,U as s,G as t,N as u};