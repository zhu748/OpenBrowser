import {Dr as e,En as t,a as n,br as r,c as i,d as a,en as o,f as s,h as c,i as l,l as u,ln as d,m as f,mt as p,qt as m,s as h,ti as g,tn as _,v as ee,xr as v} from "./utils-BIWenCnY.js";
import {bt as b} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {o as te,r as ne,s as re} from "./cookie-CqdL0VrU.js";
import {ut as x} from "./types-Cxql15JH.js";
import {t as ie} from "./proxy-shop-labels-nJaBS4W_.js";
import {t as ae} from "./useProfileEntityLabels-BfqbVpel.js";
import {t as oe} from "./account-2bDq0W_G.js";
var S = ["moduleId", "proxyMethod", "proxyCategory", "protocol", "ipType", "host", "port", "proxyUserName", "proxyPassword", "refreshUrl", "checkChannel", "extraChannel", "isExtraNewIp", "isRepectCheck", "extraUrl", "lastIp", "lastCountry", "lastCity", "isEncryptProxy", "proxyEncryptInfo"];
var C = { moduleId: 0, proxyMethod: "noproxy", proxyCategory: "noproxy", protocol: "noproxy", host: "", port: "", proxyUserName: "", proxyPassword: "", refreshUrl: "", lastCity: "", lastCountry: "", lastIp: "" };
var se = /* @__PURE__ */ new Set(["lastIp", "lastCountry", "lastCity"]);
function w(e2) {
  return e2 != null && e2 !== "";
}
function T(e2, t2) {
  if (e2 && Object.hasOwn(e2, t2)) return e2[t2] ?? "";
}
function E(...e2) {
  return e2.find(w);
}
function D(e2) {
  return String(e2?.proxyCategory || e2?.protocol || "");
}
function ce(e2) {
  return !e2 || D(e2).toLowerCase() === "noproxy" || e2.proxyMethod === "noproxy";
}
function O(e2, t2) {
  return e2.flatMap(({ _proxyCount: e3, ...n2 }) => {
    let r2 = Math.max(1, Number(e3) || 1), i2 = t2 === "api" ? "api" : n2.id ? "choose" : "custom";
    return Array.from({ length: r2 }, () => ({ ...n2, proxyMethod: i2 }));
  });
}
function le(...e2) {
  let t2 = E(...e2);
  return t2 === void 0 || t2 === 0 || t2 === "0" ? 0 : String(t2);
}
function k(e2 = {}) {
  let t2 = Array.isArray(e2.proxyInfoList) ? e2.proxyInfoList[0] : null, n2 = E(e2.proxyCategory, e2.protocol, t2?.proxyCategory, t2?.protocol), r2 = E(e2.protocol, t2?.protocol, n2), i2 = le(e2.moduleId, t2?.id), a2 = String(E(e2.proxyMethod, t2?.proxyMethod) || (i2 ? "choose" : n2 && String(n2).toLowerCase() !== "noproxy" ? "custom" : "noproxy")), o2 = !!i2 && a2 === "choose", s2 = { moduleId: a2 === "custom" || a2 === "api" || a2 === "noproxy" ? 0 : i2, proxyMethod: a2, proxyCategory: n2 || (o2 ? "" : "noproxy"), protocol: r2 || n2 || (o2 ? "" : "noproxy") };
  for (let n3 of S) {
    if (n3 in s2) continue;
    if (se.has(n3)) {
      let r4 = T(t2, n3);
      if (r4 !== void 0) {
        s2[n3] = r4;
        continue;
      }
      let i3 = T(e2, n3);
      i3 !== void 0 && (s2[n3] = i3);
      continue;
    }
    let r3 = E(t2?.[n3], e2[n3]);
    r3 !== void 0 && (s2[n3] = r3);
  }
  return s2;
}
function ue(e2 = {}) {
  let t2 = k(e2), n2 = String(t2.proxyCategory || "").toLowerCase(), r2 = t2.proxyMethod === "choose" && !!t2.moduleId;
  return t2.proxyMethod === "noproxy" || n2 === "noproxy" || !n2 && !r2 ? [] : [{ ...t2, id: r2 ? t2.moduleId : void 0, proxyMethod: r2 ? "choose" : t2.proxyMethod === "api" ? "api" : "custom", proxyCategory: t2.proxyCategory, protocol: t2.protocol || t2.proxyCategory }];
}
function de(e2) {
  let t2 = k(e2), n2 = { ...e2, ...t2 };
  return delete n2.proxyInfoList, (n2.proxyMethod === "custom" || n2.proxyMethod === "api" || n2.proxyMethod === "noproxy") && (n2.moduleId = 0), n2;
}
function fe(e2, t2) {
  let n2 = Array.isArray(e2.value) ? e2.value : [], r2 = n2[0];
  if (ce(r2)) return Object.assign(t2, C), n2.length ? n2 : [{ id: 0, ...C }];
  if (r2.id) {
    let e3 = D(r2), i3 = n2.map((e4) => ({ ...e4, lastCity: e4.lastCity ?? "", lastCountry: e4.lastCountry ?? "", lastIp: e4.lastIp ?? "" }));
    return Object.assign(t2, { moduleId: r2.id, proxyMethod: "choose", proxyCategory: e3, protocol: r2.protocol || r2.proxyCategory || e3, lastCity: r2.lastCity ?? "", lastCountry: r2.lastCountry ?? "", lastIp: r2.lastIp ?? "", host: "", port: "", proxyUserName: "", proxyPassword: "", refreshUrl: "", extraUrl: "", extraChannel: "" }), O(i3, "choose");
  }
  if (r2.proxyMethod === "api") {
    let e3 = D(r2) || "SOCKS5";
    return Object.assign(t2, { moduleId: 0, proxyMethod: "api", proxyCategory: e3, protocol: r2.protocol || r2.proxyCategory || "SOCKS5", host: r2.host ?? "", port: r2.port ?? "", proxyUserName: r2.proxyUserName ?? "", proxyPassword: r2.proxyPassword ?? "", ipType: r2.ipType, extraUrl: r2.extraUrl ?? "", extraChannel: r2.extraChannel, isExtraNewIp: r2.isExtraNewIp, isRepectCheck: r2.isRepectCheck, lastCity: r2.lastCity ?? "", lastCountry: r2.lastCountry ?? "", lastIp: r2.lastIp ?? "", refreshUrl: "" }), O(n2, "api");
  }
  let i2 = D(r2);
  return Object.assign(t2, { moduleId: 0, proxyMethod: "custom", proxyCategory: i2, protocol: r2.protocol || r2.proxyCategory || i2, lastCity: r2.lastCity ?? "", lastCountry: r2.lastCountry ?? "", lastIp: r2.lastIp ?? "", ipType: r2.ipType, host: r2.host ?? "", port: r2.port ?? "", proxyUserName: r2.proxyUserName ?? "", proxyPassword: r2.proxyPassword ?? "", refreshUrl: r2.refreshUrl ?? "", checkChannel: r2.checkChannel, isEncryptProxy: r2.isEncryptProxy, proxyEncryptInfo: r2.proxyEncryptInfo, extraUrl: "", extraChannel: "" }), O(n2, "custom");
}
function pe(e2) {
  return (n(e2, "windowPlatformList")?.value ?? []).map((e3) => e3.platformUrl).filter(Boolean);
}
var me = ee();
async function A(e2) {
  let { os: t2, osVersion: r2, coreVersion: i2, browserVersion: o2, coreType: s2 } = h(e2), { code: c2, data: l2 } = await ge({ os: t2, osVersion: r2, coreVersion: i2, coreType: s2, browserVersion: o2, count: 1 });
  if (c2 === 0) {
    a(e2, l2[0]);
    let t3 = n(e2[0], "userAgent");
    t3 && Reflect.set(t3, "_custom_ua", !1);
  }
}
async function he(e2) {
  let { os: t2 } = h(e2), { code: n2, data: r2 } = await j({ os: t2, count: 1 });
  n2 === 0 && a(e2, r2[0]);
}
async function ge(e2) {
  let t2 = await c.window.userGetUaWebglV2List(e2);
  if (t2.code !== 0) throw Error(t2.msg);
  return t2;
}
async function j(e2) {
  return await c.window.userGetDeviceNameV2List(e2);
}
async function M(e2) {
  let { data: t2 } = await c.window.userGetBrowserVersionInfoList(e2);
  return t2.map((e3) => ({ label: `Chrome ${e3.browserVersion}`, value: e3.browserVersion }));
}
var N = { count: 1, preview: !0 };
async function P(e2, t2) {
  let { fontType: r2, canvas: i2, webGL: o2, audioContext: s2, speechVoices: c2, clientRects: l2, macInfo: u2, os: d2, osVersion: f2, coreVersion: p2, coreType: m2, webGLInfo: g2 } = h(e2), { count: _2, preview: ee2 } = { ...N, ...t2 }, v2 = await globalThis.electronAPI.send("util:genRandomFingerprint", { fontType: r2, canvas: i2, webGL: o2, audioContext: s2, speechVoices: c2, clientRects: l2, macInfo: u2, os: d2, osVersion: f2, coreVersion: p2, coreType: m2 }, _2);
  if (console.debug("fingerDetail", v2), ee2) {
    let { userAgent: t3, webGLManufacturer: n2, webGLRender: r3, macAddr: i3, deviceName: o3 } = v2[0], s3 = { userAgent: t3, macAddr: i3, deviceName: o3 };
    g2 !== 2 && (s3.webGLManufacturer = n2, s3.webGLRender = r3), a(e2, s3);
  }
  let y2 = n(e2[0], "userAgent");
  return y2 && Reflect.set(y2, "_custom_ua", !1), v2;
}
function _e(e2, t2) {
  let n2 = ["ios", "android"].includes(e2.toLocaleLowerCase()), r2 = n2 ? t2.mobileResolution : t2.resolution;
  return { isMobile: n2, options: r2, defaultValue: n2 ? r2[0] : r2.find((e3) => e3.value === "1280 x 720") };
}
function ve(e2) {
  return e2.split(".")?.[0];
}
function F(e2) {
  return e2 === m.Firefox;
}
function ye(e2) {
  return e2?.toLocaleLowerCase() === "macos";
}
function I(e2) {
  return e2?.toLocaleLowerCase() === "all";
}
function L(e2, t2, n2) {
  return F(e2) && ye(t2) ? n2.filter((e3) => I(e3.value)) : n2;
}
function be(e2, t2, n2, r2) {
  let i2 = L(t2, n2, r2);
  e2.options = i2, !i2.find((t3) => t3.value === e2.value?.value) && i2.length && (e2.value = i2[0]);
}
function R(e2) {
  return n(e2, "coreType")?.value?.value ?? m.Chrome;
}
function xe(e2) {
  return e2 === m.Firefox ? m.Firefox : m.Chrome;
}
var z = "__useLatestCore__";
function B(e2) {
  return e2?.value === z;
}
function Se(e2, t2) {
  if (e2.some(B)) return e2;
  let n2 = t2 && e2[0] ? [{ ...e2[0], tooltip: t2 }, ...e2.slice(1)] : e2;
  return [{ label: $t("\u4FDD\u6301\u6700\u65B0"), value: z, ...t2 ? { tooltip: t2 } : {} }, ...n2];
}
function V(e2) {
  return e2.find((e3) => !B(e3))?.value ?? "";
}
function H(e2) {
  return e2.find((e3) => !B(e3)) ?? e2[0];
}
function Ce(e2) {
  let t2 = e2.value?.value, n2 = B(e2.value);
  return { useLatestCore: n2, coreVersion: n2 ? V(e2.options) : t2 };
}
function we(e2, t2) {
  if (t2.useLatestCore === !0) return e2.find(B) ?? H(e2);
  if (t2.coreVersion) {
    let n2 = e2.find((e3) => e3.value === t2.coreVersion);
    if (n2) return n2;
  }
  return H(e2);
}
async function U(a2 = {}, h2 = () => {
}, ee2) {
  let y2 = ee2?.run ?? ((e2) => e2()), S2 = p().currentWorkspace?.workspaceType === _.ECommerce, C2 = ae(S2), se2 = ie(S2), [w2, T2, E2, D2] = await y2(() => Promise.all([f(), me.getUserConfig(), c.platform.userGetSearchEnginesList(), globalThis.electronAPI.send("app:getCoreList")])), { osVersion: ce2, "R-OS": O2 } = await y2(() => d()), le2 = D2.filter((e2) => xe(e2.coreType) === m.Chrome).map((e2) => e2.coreVersion), de2 = D2.filter((e2) => xe(e2.coreType) === m.Firefox).map((e2) => e2.coreVersion), ge2 = { windows: "platforms/rx_os_windows", linux: "platforms/rx_os_linux", macos: "platforms/rx_os_macOS", android: "platforms/rx_os_android", ios: "platforms/rx_os_iOS" }, j2 = (e2, n2, r2) => {
    if (F(e2)) return Se((w2.firefoxCoreVersion ?? []).filter((e3) => de2.includes(e3.value)));
    let i2 = w2.coreVersion.filter((e3) => le2.includes(e3.value)), a3 = n2?.toLocaleLowerCase() === "windows" && ["7", "8"].includes(r2?.at(0) ?? "") ? i2.filter((e3) => e3.value === "109") : i2, o2 = w2.coreVersion?.[0]?.value, s2 = o2 ? $t("Roxy\u5185\u6838\u5DF2\u540C\u6B65\u81F3 Chrome {version}\uFF0C\u59CB\u7EC8\u4E0E\u8C37\u6B4C\u5B98\u65B9\u4FDD\u6301\u4E00\u81F4\uFF0C\u5B89\u5168\u6027\u9886\u5148\u540C\u884C\u3002", { version: o2 }) : void 0, c2 = a3.filter((n3) => !t(O2, ce2, e2, n3.value));
    return c2.length ? Se(c2, s2) : [];
  }, N2 = w2.os.map(({ label: e2, ...t2 }) => {
    let n2 = w2[`osversion_${e2.toLocaleLowerCase()}`].map((n3) => ({ ...n3, label: `${e2} ${n3.label}`, _osValue: t2.value }));
    return (e2.toLocaleLowerCase() === "macos" || e2.toLocaleLowerCase() === "ios") && (n2 = n2.filter((e3) => !e3.value?.includes("."))), { ...t2, label: e2, tooltip: e2, icon: ge2[e2.toLocaleLowerCase()], _versionOptions: n2 };
  });
  console.log("osOptions", N2);
  let P2 = N2.find((e2) => e2.value.toLocaleLowerCase() === (a2?.os || r()).toLocaleLowerCase()), ye2 = a2.os?.toLocaleLowerCase() === "macos" || a2.ios?.toLocaleLowerCase() ? ve(a2.osVersion || "") : a2.osVersion, I2 = a2.coreType ?? m.Chrome, z2 = L(I2, P2?.value, P2?._versionOptions ?? []), B2 = z2.find((e2) => e2.value === ye2) ?? z2[0], V2 = [{ label: m.Chrome, value: m.Chrome, icon: "base/rx_ic_chrome" }, { label: m.Firefox, value: m.Firefox, icon: "base/rx_ic_firefox", disabled: !g(), disabledTooltip: $t("\u8BE5\u529F\u80FD\u9700\u8981\u5347\u7EA7\u5230 v{version} \u53CA\u4EE5\u4E0A\u7248\u672C", { version: "3.8.8" }) }], U2 = j2(I2, P2?.value, B2?.value), G2 = E2.code === 0 ? (E2.data || []).map((e2) => ({ label: e2.code, value: e2.code, image: e2.icon })) : [], De = a2.searchEngine ?? T2?.searchEngine, Oe = T2?.uaModeSwitch === o.close && P2 && B2 && !F(I2) ? await y2(() => M({ os: P2.value, osVersion: B2.value })) : [], ke = a2.browserVersion?.split(",").filter(Boolean) ?? Oe.map((e2) => e2.value), Ae = ["isEncryptProxy", "proxyEncryptInfo"], je = k(a2), Me = ue(a2), { isMobile: Ne, options: Pe, defaultValue: Fe } = _e(P2?.value, w2), Ie = Pe.find((e2) => e2.value === `${a2.resolutionX} x ${a2.resolutionY}`) || Fe, K = i(P2.value, "Android", !1) || i(P2.value, "IOS", !1), q = [], J = F(I2), Y = b({ ...Ee(), searchEngine: De, ...Object.fromEntries(Object.entries(a2).filter(([e2]) => !Ae.includes(e2) && e2 !== "proxyInfoList")), ...je }), X = [], Z = b([{ type: "text", label: C2.entityName, name: "windowName", value: a2.windowName ?? "", dirId: a2.dirId ?? "", placeholder: C2.unnamedEntityPlaceholder, formatValue: (e2, t2, n2) => (Object.assign(n2, { windowNamePrefix: e2.value }), e2.value), slot: "name" }, { label: $t("\u7CFB\u7EDF"), items: [{ type: "select", name: "os", value: P2, options: N2, filter: !1, style: { width: "66px", flex: "none" }, overlayStyle: { width: "120px" }, class: "items-center", change: async (e2) => {
    if (e2.value) {
      let t2 = n(Z, "osVersion"), r2 = R(Z), i2 = L(r2, e2.value.value, e2.value._versionOptions);
      t2.options = i2, t2.value = i2[0], t2.change?.(t2);
      let { isMobile: a3, options: o2, defaultValue: s2 } = _e(e2.value.value, w2), [c2, u2] = l(X, ["resolution", "deviceName"]);
      c2._isMobile !== a3 && (c2._isMobile = a3, c2.value = s2, c2.options = o2), u2?.iconClick();
      let d2 = ["Android", "IOS"].includes(e2.value.value) && r2 !== m.Firefox;
      Te(X, d2);
    }
  }, preview: { label: $t("\u64CD\u4F5C\u7CFB\u7EDF") }, required: !0 }, { type: "select", name: "osVersion", value: B2, options: z2, filter: !1, change: async (e2) => {
    let t2 = n(Z, "coreVersion");
    if (e2.value) {
      let { _osValue: r2, value: i2 } = e2.value, a3 = R(Z), s2 = j2(a3, r2, i2);
      if (t2.options = s2, !s2.find((e3) => e3.value === t2.value?.value) && s2.length && (t2.value = H(s2)), !F(a3) && T2?.uaModeSwitch === o.close) {
        let e3 = await y2(() => M({ os: r2, osVersion: i2 })), t3 = n(Z, "browserVersion");
        t3.options = e3, t3.value = e3.map((e4) => e4.value);
      }
    }
    t2.change?.(t2);
  }, required: !0 }], slot: "system" }, { label: $t("\u5185\u6838"), items: [{ type: "select", name: "coreType", value: V2.find((e2) => e2.value === a2.coreType) ?? V2[0], options: V2, icon: J ? "base/rx_ic_firefox" : "base/rx_ic_chrome", filter: !1, iconColor: "var(--primary-color, #12a3fc)", style: { width: "66px", flex: "none" }, overlayStyle: { width: "120px" }, disabled: !!a2.id, class: "items-center", change: async (e2) => {
    if (e2.value) {
      let t2 = e2.value.value, [n2, r2, i2] = l(Z, ["os", "osVersion", "coreVersion"]), a3 = r2?.value?._osValue ?? n2?.value?.value ?? P2?.value;
      be(r2, t2, a3, n2?.value?._versionOptions ?? P2?._versionOptions ?? []);
      let o2 = r2?.value?.value ?? B2?.value, s2 = j2(t2, a3, o2);
      i2.options = s2, i2.value = H(s2) ?? null, await y2(() => Le(t2, a3, o2));
      let c2 = ["Android", "IOS"].includes(a3) && t2 !== m.Firefox;
      Te(X, c2);
      let [u2, d2] = l(X, ["webGL", "canvas"]);
      u2.change?.(u2), d2?.change?.(d2), i2.change?.(i2);
    }
  }, preview: { label: $t("\u5185\u6838\u7C7B\u578B") }, required: !0 }, { type: "select", name: "coreVersion", value: we(U2, a2), options: U2, required: !0, filter: !1, formatValue: (e2, t2, n2) => {
    let { useLatestCore: r2, coreVersion: i2 } = Ce(e2);
    return Reflect.set(n2, "useLatestCore", r2), i2;
  }, change: async (e2) => {
    if (e2.value && await y2(() => A(q)), a2.dirId) {
      let { coreVersion: t2 } = Ce(e2);
      e2.help = a2.coreVersion === t2 ? "" : $t("\u4FEE\u6539\u5185\u6838\u53EF\u80FD\u5BFC\u81F4\u7F13\u5B58\u4E0D\u517C\u5BB9\uFF0C\u4ECE\u800C\u4F7F\u8D26\u53F7\u767B\u5F55\u4FE1\u606F\u5931\u6548\uFF0C\u8BF7\u8C28\u614E\u64CD\u4F5C\u3002");
    }
  } }], slot: "kernel" }, { type: "multiSelect", label: $t("\u6D4F\u89C8\u5668\u7248\u672C"), placeholder: $t("\u65E0\u6307\u5B9A\u7248\u672C\uFF0C\u9ED8\u8BA4\u4F7F\u7528\u4E25\u683C\u6A21\u5F0F"), name: "browserVersion", value: ke, _oldValue: ke, options: Oe, maxSelectedLabels: 4, selectedItemsLabel: $t("\u5DF2\u9009\u62E9\u4E86 {count} \u4E2A\u6D4F\u89C8\u5668\u7248\u672C", { count: "{()}" }), visible: !J && i(T2?.uaModeSwitch, o.close, !1), formatValue: (e2) => e2.value.join(","), onHide: () => {
    let e2 = n(Z, "browserVersion");
    e2.value.slice().sort().join(",") !== e2._oldValue.slice().sort().join(",") && (e2._oldValue = e2.value.slice(), y2(() => A(q)));
  } }, { type: "textarea", label: $t("User-Agent"), name: "userAgent", value: a2.userAgent, rows: 3, iconClick: async () => {
    await y2(() => A(q)), h2(0, $t("UA\u5237\u65B0\u6210\u529F"));
  }, change: (e2) => {
    Reflect.set(e2, "_custom_ua", !0);
  }, formatValue: (e2, t2, n2) => (Reflect.set(n2, "_custom_ua", e2._custom_ua), e2.value?.trim()), slot: "userAgent", preview: { label: "User Agent" } }, { type: "textarea", label: "Cookies", placeholder: $t(`\u9009\u586B
\u652F\u6301\u683C\u5F0F: JSON\u3001Netscape\u3001Name=Value
Name=Value \u672A\u5199 domain \u65F6\uFF0C\u5C06\u6309\u884C\u4ECE\u5E73\u53F0\u8D26\u53F7\u7684\u7F51\u5740\u81EA\u52A8\u586B\u5145`), name: "cookie", value: v(a2?.cookie) ? "" : te(a2.cookie), validator(e2) {
    let t2 = re(e2.value?.trim() ?? "", { platformUrls: pe(Z) });
    return t2.valid ? (e2.errorMsg = void 0, !0) : (e2.errorMsg = t2.message, !1);
  }, formatValue: (e2, t2) => ne(e2.value?.trim() ?? "", { platformUrls: pe(t2) }) ?? [], slot: "cookies" }, { label: $t("\u542F\u52A8\u7F51\u9875"), name: "defaultOpenUrl", value: a2.defaultOpenUrl ?? [], tooltip: $t("\u6253\u5F00\u7A97\u53E3\u65F6\uFF0C\u5C06\u81EA\u52A8\u52A0\u8F7D\u6240\u586B\u5199\u7684\u7F51\u5740\u3002\u652F\u6301\u591A\u4E2A\u7F51\u5740\u5206\u522B\u5728\u72EC\u7ACB\u6807\u7B7E\u9875\u4E2D\u663E\u793A\u3002"), slot: "urls" }, { separator: !0 }, { label: se2.entity, name: "proxyInfoList", value: Me, formatValue: (e2, t2, n2) => fe(e2, n2), slot: "proxy" }, { label: $t("\u5E73\u53F0\u8D26\u53F7"), name: "windowPlatformList", value: a2.windowPlatformList ?? [], platformBindType: oe.Order, formatValue: (e2, t2, n2) => {
    let r2 = e2.value.map((e3) => e3.id).filter(Boolean);
    return Object.assign(n2, { platformUrlIds: r2, platformBindType: e2.platformBindType }), e2.value.filter((e3) => !e3.id);
  }, slot: "accounts" }]), Q = b([{ type: "selectButton", label: $t("\u8BED\u8A00"), name: "isDisplayLanguageBaseIp", value: a2.isDisplayLanguageBaseIp ?? !0, options: [{ label: $t("\u57FA\u4E8E IP \u5339\u914D"), value: !0 }, { label: $t("\u81EA\u5B9A\u4E49"), value: !1 }], tooltip: $t("\u6253\u5F00\u7F51\u7AD9\u9875\u9762\u4F18\u5148\u5C55\u793A\u7684\u8BED\u8A00\uFF0C\u9ED8\u8BA4\u4F7F\u7528 IP \u6240\u5728\u5730\u533A\u7684\u8BED\u8A00\uFF0C\u4E5F\u53EF\u81EA\u5B9A\u4E49\u9009\u62E9"), change(e2) {
    s(Q, "displayLanguage", e2.value === !1);
  }, preview: { label: $t("\u8BED\u8A00") } }, { type: "select", label: " ", name: "displayLanguage", value: w2.language.find((e2) => e2.value === a2.displayLanguage) ?? w2.language[0], options: w2.language, virtualScrollerOptions: { itemSize: 38 }, visible: i(a2.isDisplayLanguageBaseIp, !1, !1) }, { type: "selectButton", label: $t("\u754C\u9762\u8BED\u8A00"), name: "isLanguageBaseIp", value: a2.isLanguageBaseIp ?? !0, options: [{ label: $t("\u57FA\u4E8E IP \u5339\u914D"), value: !0 }, { label: $t("\u81EA\u5B9A\u4E49"), value: !1 }], tooltip: $t("Google \u754C\u9762\u6846\u67B6\u7684\u8BED\u8A00\uFF0C\u9ED8\u8BA4\u4F7F\u7528 IP \u6240\u5728\u5730\u533A\u7684\u8BED\u8A00\uFF0C\u4E5F\u53EF\u81EA\u5B9A\u4E49\u9009\u62E9"), change(e2) {
    s(Q, "language", e2.value === !1);
  } }, { type: "select", label: " ", name: "language", value: w2.language.find((e2) => e2.value === a2.language) ?? w2.language[0], options: w2.language, virtualScrollerOptions: { itemSize: 38 }, visible: i(a2.isLanguageBaseIp, !1, !1) }, { type: "selectButton", label: $t("\u65F6\u533A"), name: "isTimeZone", value: a2.isTimeZone ?? !0, options: [{ label: $t("\u57FA\u4E8E IP \u5339\u914D"), value: !0 }, { label: $t("\u81EA\u5B9A\u4E49"), value: !1 }], change(e2) {
    s(Q, "timeZone", e2.value === !1);
  }, preview: { label: $t("\u65F6\u533A") } }, { type: "select", label: " ", name: "timeZone", value: w2.timeZone.find((e2) => e2.value === a2.timeZone) ?? w2.timeZone[0], options: w2.timeZone, virtualScrollerOptions: { itemSize: 38 }, visible: i(a2.isTimeZone, !1, !1) }, { type: "selectButton", label: $t("\u5730\u7406\u4F4D\u7F6E\u63D0\u793A"), name: "position", value: a2.position ?? 1, options: [{ label: $t("\u8BE2\u95EE"), value: 0 }, { label: $t("\u5141\u8BB8"), value: 1 }, { label: $t("\u7981\u6B62"), value: 2 }], change(e2) {
    let t2 = n(Q, "isPositionBaseIp");
    t2 && (t2.visible = e2.value !== 2, t2.change(t2));
  }, preview: { label: $t("\u5730\u7406\u4F4D\u7F6E\u63D0\u793A") } }, { type: "selectButton", label: $t("\u5730\u7406\u4F4D\u7F6E"), name: "isPositionBaseIp", value: a2.isPositionBaseIp ?? !0, options: [{ label: $t("\u57FA\u4E8E IP \u5339\u914D"), value: !0 }, { label: $t("\u81EA\u5B9A\u4E49"), value: !1 }], visible: !i(a2.position, 2, !1), change(e2) {
    l(Q, ["longitude", "latitude", "precisionPos"]).forEach((t2) => {
      t2.visible = e2.visible && e2.value === !1, t2.required && !t2.value && (t2.invalid = !0, t2.errorMsg = $t('"{name}" \u662F\u5FC5\u586B\u9879', { name: t2.label }));
    });
  }, preview: { label: $t("\u5730\u7406\u4F4D\u7F6E") } }, { type: "text", label: $t("\u7ECF\u5EA6"), placeholder: $t("\u8BF7\u586B\u5199\u7ECF\u5EA6\uFF0C\u793A\u4F8B: -40.123"), name: "longitude", value: a2.longitude, required: !0, visible: i(a2.isPositionBaseIp, !1, !1), onBlur(e2) {
    let t2 = e2.target.value;
    x().safeParse(Number(t2)).success && t2 !== "" ? (t2 > 180 && (t2 = 180), t2 < -180 && (t2 = -180)) : (t2 = "", u(Q, "longitude", "invalid", !0)), u(Q, "longitude", "value", t2);
  } }, { type: "text", label: $t("\u7EAC\u5EA6"), placeholder: $t("\u8BF7\u586B\u5199\u7EAC\u5EA6\uFF0C\u793A\u4F8B: 30.123"), name: "latitude", value: a2.latitude, required: !0, visible: i(a2.isPositionBaseIp, !1, !1), onBlur(e2) {
    let t2 = e2.target.value;
    x().safeParse(Number(t2)).success && t2 !== "" ? (t2 > 90 && (t2 = 90), t2 < -90 && (t2 = -90)) : (t2 = "", u(Q, "latitude", "invalid", !0)), u(Q, "latitude", "value", t2);
  } }, { type: "text", label: $t("\u7CBE\u5EA6\uFF08\u7C73\uFF09"), placeholder: $t("\u8BF7\u586B\u5199\u7CBE\u5EA6\uFF08\u7C73\uFF09\uFF0C\u8303\u56F4: 10-5000"), name: "precisionPos", value: a2.precisionPos || "1000", visible: i(a2.isPositionBaseIp, !1, !1), onBlur(e2) {
    let t2 = e2.target.value;
    x().safeParse(Number(t2)).success && t2 !== "" ? (t2 < 10 && (t2 = 10), t2 > 5e3 && (t2 = 5e3)) : t2 = "", u(Q, "precisionPos", "value", t2);
  } }, { type: "selectButton", label: $t("\u58F0\u97F3"), name: "forbidAudio", value: a2.forbidAudio ?? !0, options: [{ label: $t("\u5F00\u542F"), value: !0 }, { label: $t("\u5173\u95ED"), value: !1 }] }, { type: "selectButton", label: $t("\u56FE\u7247"), name: "forbidImage", value: a2.forbidImage ?? !0, options: [{ label: $t("\u5F00\u542F"), value: !0 }, { label: $t("\u5173\u95ED"), value: !1 }], change(e2) {
    s(Q, "forbiddenPictureSize", e2.value === !1);
  } }, { label: " ", name: "forbiddenPictureSize", value: a2.forbiddenPictureSize ?? 0, visible: i(a2.forbidImage, !1, !1), slot: "forbiddenPictureSize" }, { type: "selectButton", label: $t("\u89C6\u9891"), name: "forbidMedia", value: a2.forbidMedia ?? !0, options: [{ label: $t("\u5F00\u542F"), value: !0 }, { label: $t("\u5173\u95ED"), value: !1 }] }, { type: "selectButton", label: $t("\u7A97\u53E3\u5927\u5C0F"), name: "positionSwitch", value: a2.positionSwitch ?? !0, options: [{ label: $t("\u81EA\u5B9A\u4E49"), value: !0 }, { label: $t("\u5168\u5C4F"), value: !1 }], change(e2) {
    s(Q, ["windowOpenSize", "windowRatioPosition"], e2.value === !0);
  } }, { label: " ", name: "windowOpenSize", items: [{ type: "text", placeholder: $t("\u8BF7\u8F93\u5165\u5BBD\u5EA6"), name: "openWidth", value: a2.openWidth ?? "1000" }, { type: "text", placeholder: $t("\u8BF7\u8F93\u5165\u9AD8\u5EA6"), name: "openHeight", value: a2.openHeight ?? "1000" }], visible: !J && i(a2.positionSwitch, !0, !0), slot: "windowOpenSize" }, { label: $t("\u7A97\u53E3\u4F4D\u7F6E"), name: "windowRatioPosition", value: a2.windowRatioPosition || "0,0", tooltip: $t("\u7A97\u53E3\u6253\u5F00\u65F6\u5728\u5C4F\u5E55\u4E2D\u7684\u521D\u59CB\u4F4D\u7F6E"), visible: !J && i(a2.positionSwitch, !0, !0), slot: "windowRatioPosition" }, { label: $t("\u641C\u7D22\u5F15\u64CE"), name: "searchEngine", type: "select", value: G2.find((e2) => e2.value === De) ?? G2[0], options: G2, filter: !1, required: !0, visible: !J }]);
  X = b([{ type: "selectButton", label: $t("\u5206\u8FA8\u7387"), name: "resolutionType", value: a2.resolutionType ?? !1, options: [{ label: $t("\u8DDF\u968F\u7CFB\u7EDF"), value: !1 }, { label: $t("\u81EA\u5B9A\u4E49"), value: !0 }], change(e2) {
    s(X, "resolution", e2.value === !0);
  }, preview: { label: $t("\u5206\u8FA8\u7387") } }, { type: "select", label: $t("\u5206\u8FA8\u7387\u503C"), placeholder: $t("\u8BF7\u9009\u62E9\u5206\u8FA8\u7387"), name: "resolution", value: Ie, options: Pe, virtualScrollerOptions: { itemSize: 38 }, filter: !1, _isMobile: Ne, formatValue: (e2, t2, n2) => {
    let [r2, i2] = e2.value.value.split("x");
    Object.assign(n2, { resolutionX: r2.trim(), resolutionY: i2.trim() });
  }, visible: i(a2.resolutionType, !0, !1) }, { type: "selectButton", label: $t("\u5B57\u4F53\u6307\u7EB9"), name: "fontType", value: a2.fontType ?? !1, options: [{ label: $t("\u8DDF\u968F\u7CFB\u7EDF"), value: !1 }, { label: $t("\u968F\u673A"), value: !0 }], preview: { label: $t("\u5B57\u4F53\u6307\u7EB9") }, change: async (e2) => {
    if (e2.value) {
      let { getAllowFontList: e3 } = await globalThis.electronAPI.send("util:callRandomFingerprintFunc", { getAllowFontList: [] }), t2 = await globalThis.electronAPI.send("util:genRandomFonts");
      Object.assign(Y, { font: t2.join(";"), allowFontList: e3 });
    } else Reflect.deleteProperty(Y, "font");
  } }, { type: "selectButton", label: "WebRTC", name: "webRTC", value: a2.webRTC ?? 2, options: [{ label: $t("\u66FF\u6362"), value: 0 }, { label: $t("\u771F\u5B9E"), value: 1 }, { label: $t("\u7981\u6B62"), value: 2 }], preview: { label: "WebRTC" } }, { type: "selectButton", label: $t("WebGL \u56FE\u50CF"), name: "webGL", value: a2.webGL ?? !0, options: [{ label: $t("\u968F\u673A"), value: !0 }, { label: $t("\u771F\u5B9E"), value: !1 }], preview: { label: $t("WebGL \u56FE\u50CF") }, change: async (e2) => {
    if (e2.value)
      if (n(Z, "coreType").value.value === "Firefox") Object.assign(Y, { webGLValue: Math.random() });
      else {
        let { getwebGLNoiseValue: e3 } = await globalThis.electronAPI.send("util:callRandomFingerprintFunc", { getwebGLNoiseValue: [] });
        Object.assign(Y, { webGLValue: e3 });
      }
    else Reflect.deleteProperty(Y, "webGLValue");
  } }, { type: "selectButton", label: $t("WebGL Info"), name: "webGLInfo", value: a2.webGLInfo ?? 1, options: [{ label: $t("\u771F\u5B9E"), value: 0 }, { label: $t("\u968F\u673A"), value: 1 }, { label: $t("\u81EA\u5B9A\u4E49"), value: 2 }], change(e2) {
    e2.value === 1 && y2(() => A(q)), l(X, ["webGLManufacturer", "webGLRender"]).forEach((t2) => {
      t2.visible = e2.value !== 0, t2.disabled = e2.value !== 2;
    });
  }, preview: { label: $t("WebGL Info") } }, { type: "text", label: $t("WebGL \u5382\u5546"), name: "webGLManufacturer", value: a2.webGLManufacturer, icon: "base/rx_ic_shuffle", disabled: a2.webGLInfo !== 2, visible: !i(a2.webGLInfo, 0, !1), iconClick: () => {
    y2(() => A(q));
  } }, { type: "textarea", label: $t("WebGL \u6E32\u67D3"), name: "webGLRender", value: a2.webGLRender, rows: 3, icon: "base/rx_ic_shuffle", disabled: a2.webGLInfo !== 2, visible: !i(a2.webGLInfo, 0, !1), iconClick: () => {
    y2(() => A(q));
  } }, { type: "selectButton", label: "WebGpu", name: "webGpu", value: a2.webGpu ?? "webgl", options: [{ label: $t("\u57FA\u4E8EWebGL\u5339\u914D"), value: "webgl" }, { label: $t("\u771F\u5B9E"), value: "real" }, { label: $t("\u7981\u6B62"), value: "block" }], visible: !J }, { type: "selectButton", label: "Canvas", name: "canvas", value: a2.canvas ?? !0, options: [{ label: $t("\u968F\u673A"), value: !0 }, { label: $t("\u771F\u5B9E"), value: !1 }], preview: { label: "Canvas" }, change: async (e2) => {
    let t2 = R(Z);
    if (e2.value)
      if (F(t2)) Object.assign(Y, { canvasValueV2: Math.random() }), Reflect.deleteProperty(Y, "canvasValue");
      else {
        let { getCanvasContextNoiseValue: e3 } = await globalThis.electronAPI.send("util:callRandomFingerprintFunc", { getCanvasContextNoiseValue: [] });
        Object.assign(Y, { canvasValue: e3 }), Reflect.deleteProperty(Y, "canvasValueV2");
      }
    else Reflect.deleteProperty(Y, "canvasValue"), Reflect.deleteProperty(Y, "canvasValueV2");
  } }, { type: "selectButton", label: "AudioContext", name: "audioContext", value: a2.audioContext ?? !0, options: [{ label: $t("\u968F\u673A"), value: !0 }, { label: $t("\u771F\u5B9E"), value: !1 }], preview: { label: "AudioContext" }, change: async (e2) => {
    e2.value ? Object.assign(Y, { audioContextValue: Math.random() }) : Reflect.deleteProperty(Y, "audioContextValue");
  } }, { type: "selectButton", label: "Speech Voices", name: "speechVoices", value: a2.speechVoices ?? !0, options: [{ label: $t("\u968F\u673A"), value: !0 }, { label: $t("\u771F\u5B9E"), value: !1 }], preview: { label: "Speech Voices" }, change: async (e2) => {
    if (e2.value) {
      let e3 = n(Z, "os"), { getSpeechSynthesis: t2 } = await globalThis.electronAPI.send("util:callRandomFingerprintFunc", { getSpeechSynthesis: [Y.os || e3?.value?.value, R(Z)] });
      Object.assign(Y, { speechVoicesValue: { enable: !0, voices: t2 } });
    } else Y.speechVoicesValue.enable = !1;
  } }, { type: "selectButton", label: "Do Not Track", name: "doNotTrack", value: a2.doNotTrack ?? !0, options: [{ label: $t("\u5F00\u542F"), value: !0 }, { label: $t("\u5173\u95ED"), value: !1 }], preview: { label: "Do Not Track" } }, { type: "selectButton", label: "Client Rects", name: "clientRects", value: a2.clientRects ?? !0, options: [{ label: $t("\u968F\u673A"), value: !0 }, { label: $t("\u771F\u5B9E"), value: !1 }], preview: { label: "Client Rects" }, change: async (e2) => {
    if (e2.value) {
      let { getClientRectsValue: e3 } = await globalThis.electronAPI.send("util:callRandomFingerprintFunc", { getClientRectsValue: [] });
      Object.assign(Y, { clientRectsValue: { enable: !0, ...e3 } });
    } else Reflect.deleteProperty(Y, "clientRectsValue");
  } }, { type: "selectButton", label: $t("\u5A92\u4F53\u8BBE\u5907"), name: "deviceInfo", value: a2.deviceInfo ?? !0, options: [{ label: $t("\u968F\u673A"), value: !0 }, { label: $t("\u771F\u5B9E"), value: !1 }], preview: { label: $t("\u5A92\u4F53\u8BBE\u5907") }, visible: !J }, { type: "selectButton", label: $t("\u8BBE\u5907\u540D\u79F0"), name: "deviceNameSwitch", value: a2.deviceNameSwitch ?? !0, options: [{ label: $t("\u968F\u673A"), value: !0 }, { label: $t("\u771F\u5B9E"), value: !1 }], change(e2) {
    s(X, "deviceName", e2.value === !0);
  }, preview: { label: $t("\u8BBE\u5907\u540D\u79F0") }, visible: !J }, { type: "text", label: " ", name: "deviceName", value: a2.deviceName, icon: "base/rx_ic_shuffle", visible: !J && i(a2.deviceNameSwitch, !0, !0), iconClick: () => {
    he(q);
  } }, { type: "selectButton", label: $t("MAC\u5730\u5740"), name: "macInfo", value: a2.macInfo ?? !0, options: [{ label: $t("\u771F\u5B9E"), value: !1 }, { label: $t("\u81EA\u5B9A\u4E49"), value: !0 }], visible: !J, change: async (e2) => {
    let t2 = n(X, "macAddr"), r2 = R(Z);
    if (t2.visible = e2.value === !0, t2.visible) t2.value = await c.window.userGetMacAddrV2List({ count: 1, coreType: r2 }).then(({ data: e3 }) => e3[0]?.macAddr);
    else {
      let e3 = await globalThis.electronAPI.send("app:getMacAddress");
      Reflect.set(Y, "macAddr", e3);
    }
  }, preview: { label: $t("MAC\u5730\u5740") } }, { type: "text", label: " ", name: "macAddr", value: a2.macAddr, icon: "base/rx_ic_shuffle", disabled: !0, visible: !J && i(a2.macInfo, !0, !0), iconClick: async () => {
    let e2 = n(X, "macAddr"), t2 = R(Z);
    e2.value = await c.window.userGetMacAddrV2List({ count: 1, coreType: t2 }).then(({ data: e3 }) => e3[0]?.macAddr);
  } }, { type: "select", label: $t("\u786C\u4EF6\u5E76\u53D1\u6570"), name: "hardwareConcurrent", value: w2.hardwareConcurrent.find((e2) => e2.value === (a2.hardwareConcurrent ?? "12")), options: w2.hardwareConcurrent, filter: !1, preview: { label: $t("\u786C\u4EF6\u5E76\u53D1\u6570") } }, { type: "select", label: $t("\u8BBE\u5907\u5185\u5B58"), name: "deviceMemory", value: w2.deviceMemory.find((e2) => e2.value === (a2.deviceMemory ?? "8")), options: w2.deviceMemory, filter: !1, preview: { label: $t("\u8BBE\u5907\u5185\u5B58") } }, { type: "selectButton", label: $t("SSL\u6307\u7EB9\u8BBE\u7F6E"), name: "disableSsl", value: a2.disableSsl ?? !1, options: [{ label: $t("\u5F00\u542F"), value: !0 }, { label: $t("\u5173\u95ED"), value: !1 }], change(e2) {
    s(X, "disableSslList", e2.value === !0);
  }, preview: { label: $t("SSL\u6307\u7EB9\u8BBE\u7F6E") }, visible: !J }, { type: "multiSelect", label: " ", placeholder: $t("\u8BF7\u9009\u62E9\u9700\u8981\u7981\u7528\u7684SSL\u7279\u6027"), name: "disableSslList", value: a2.disableSslList ?? [], options: w2.disableSslList, display: "chip", optionLabel: "label", optionValue: "value", filter: !0, maxSelectedLabels: 1, visible: !J && i(a2.disableSsl, !0, !1) }, { type: "selectButton", label: $t("\u7AEF\u53E3\u626B\u63CF\u4FDD\u62A4"), name: "portScanProtect", value: a2.portScanProtect ?? !0, options: [{ label: $t("\u5F00\u542F"), value: !0 }, { label: $t("\u5173\u95ED"), value: !1 }], change(e2) {
    s(X, "portScanList", e2.value === !0);
  }, preview: { label: $t("\u7AEF\u53E3\u626B\u63CF\u4FDD\u62A4") } }, { type: "text", label: $t("\u626B\u63CF\u767D\u540D\u5355"), name: "portScanList", value: a2.portScanList, placeholder: $t("\u5141\u8BB8\u88AB\u7F51\u7AD9\u626B\u63CF\u7684\u7AEF\u53E3\uFF0C\u591A\u4E2A\u7528\u82F1\u6587\u9017\u53F7\u9694\u5F00"), visible: i(a2.portScanProtect, !0, !0) }, { type: "selectButton", label: $t("\u786C\u4EF6\u52A0\u901F\u6A21\u5F0F"), name: "useGpu", value: a2.useGpu ?? !0, options: [{ label: $t("\u5F00\u542F"), value: !0 }, { label: $t("\u5173\u95ED"), value: !1 }], preview: { label: $t("\u786C\u4EF6\u52A0\u901F\u6A21\u5F0F") }, visible: !0 }, { type: "selectButton", label: $t("\u7981\u7528\u6C99\u76D2"), name: "sandboxPermission", value: a2.sandboxPermission ?? !1, visible: !J, options: [{ label: $t("\u5F00\u542F"), value: !0 }, { label: $t("\u5173\u95ED"), value: !1 }] }, { type: "text", label: $t("\u542F\u52A8\u53C2\u6570"), name: "startupParam", value: a2.startupParam, placeholder: $t("\u6D4F\u89C8\u5668\u542F\u52A8\u53C2\u6570,\u5982 --mute \u591A\u4E2A\u53C2\u6570\u4EE5\u82F1\u6587\u5206\u53F7\u5206\u9694") }, { name: "BatterySeparator", separatorTitle: $t("\u7535\u6C60"), separatorIcon: { name: "base/rx_ic_battery", color: "var(--colors-icon-icon-warning)" }, separator: !0, visible: K }, { type: "selectButton", label: $t("\u7535\u6C60\u6A21\u62DF"), name: "openBattery", value: a2.openBattery ?? !1, options: W(), visible: K, change(e2) {
    l(X, ["openCharging", "chargingTime", "dischargingTime", "level"]).forEach((t2) => {
      t2.visible = e2.visible && e2.value === !0;
    });
  } }, { type: "selectButton", label: $t("\u5145\u7535\u72B6\u6001"), name: "openCharging", value: a2.openCharging ?? !1, options: W(), visible: K && i(a2.openBattery, !0, !1) }, { type: "text", label: $t("\u5145\u7535\u65F6\u957F\uFF08\u79D2\uFF09"), placeholder: $t("\u8BF7\u586B\u5199\u5145\u7535\u65F6\u957F\uFF0C\u793A\u4F8B: {value}", { value: 100 }), name: "chargingTime", value: a2.chargingTime, visible: K && i(a2.openBattery, !0, !1) }, { type: "text", label: $t("\u653E\u7535\u65F6\u957F\uFF08\u79D2\uFF09"), placeholder: $t("\u8BF7\u586B\u5199\u653E\u7535\u65F6\u957F\uFF0C\u793A\u4F8B: {value}", { value: 100 }), name: "dischargingTime", value: a2.dischargingTime, visible: K && i(a2.openBattery, !0, !1) }, { type: "text", label: $t("\u7535\u91CF"), placeholder: $t("\u8BF7\u586B\u5199\u7535\u6C60\u7535\u91CF(0-1)\uFF0C\u793A\u4F8B: {value}", { value: 0.75 }), name: "level", value: a2.level, visible: K && i(a2.openBattery, !0, !1), onBlur(e2) {
    let t2 = e2.target.value;
    x().safeParse(Number(t2)).success && t2 !== "" ? (t2 > 1 && (t2 = 1), t2 < 0 && (t2 = 0)) : (t2 = "", u(X, "level", "invalid", !0)), u(X, "level", "value", t2);
  } }, { name: "NetworkSeparator", separatorTitle: $t("\u7F51\u7EDC"), separatorIcon: { name: "base/rx_ic_network_m", color: "var(--colors-icon-icon-success)" }, separator: !0, visible: K }, { type: "selectButton", label: $t("\u7F51\u7EDC\u6A21\u62DF"), name: "openNetwork", value: a2.openNetwork ?? !1, options: W(), visible: K, change(e2) {
    l(X, ["networkType", "networkSpeed", "downloadSpeed", "maxDownloadSpeed", "latency", "saveFlowMode"]).forEach((t2) => {
      t2.visible = e2.visible && e2.value === !0;
    });
  } }, { type: "select", label: $t("\u7F51\u7EDC\u7C7B\u578B"), name: "networkType", value: w2.nettype.find((e2) => e2.value === a2.networkType) ?? w2.nettype[0], options: w2.nettype, filter: !1, visible: K && i(a2.openNetwork, !0, !1) }, { type: "select", label: $t("\u7F51\u7EDC\u901F\u5EA6"), name: "networkSpeed", value: w2.effectiveType.find((e2) => e2.value === a2.networkSpeed) ?? w2.effectiveType[0], options: w2.effectiveType, filter: !1, visible: K && i(a2.openNetwork, !0, !1) }, { type: "text", label: $t("\u4E0B\u8F7D\u901F\u5EA6\uFF08Mbps\uFF09"), placeholder: $t("\u8BF7\u586B\u5199\u4E0B\u8F7D\u901F\u5EA6\uFF0C\u793A\u4F8B: {value}", { value: 3e3 }), name: "downloadSpeed", value: a2.downloadSpeed, visible: K && i(a2.openNetwork, !0, !1) }, { type: "text", label: $t("\u6700\u5927\u4E0B\u8F7D\u901F\u5EA6\uFF08Mbps\uFF09"), placeholder: $t("\u8BF7\u586B\u5199\u6700\u5927\u4E0B\u8F7D\u901F\u5EA6\uFF0C\u793A\u4F8B: {value}", { value: 3e3 }), name: "maxDownloadSpeed", value: a2.maxDownloadSpeed, visible: K && i(a2.openNetwork, !0, !1) }, { type: "text", label: $t("\u5EF6\u8FDF\uFF08ms\uFF09"), placeholder: $t("\u8BF7\u586B\u5199\u5EF6\u8FDF\uFF0C\u793A\u4F8B: {value}", { value: 200 }), name: "latency", value: a2.latency, visible: K && i(a2.openNetwork, !0, !1) }, { type: "selectButton", label: $t("\u7701\u6D41\u6A21\u5F0F"), name: "saveFlowMode", value: a2.saveFlowMode ?? !1, options: W(), visible: K && i(a2.openNetwork, !0, !1) }, { name: "bluetoothSeparator", separatorTitle: $t("\u84DD\u7259"), separatorIcon: { name: "base/rx_ic_bluetooth", color: "var(--colors-icon-icon-brand)" }, separator: !0, visible: K }, { type: "selectButton", label: $t("\u84DD\u7259\u6A21\u62DF"), name: "openBluetooth", value: a2.openBluetooth ?? !1, options: W(), visible: K, change(e2) {
    l(X, ["bluetoothAdapter"]).forEach((t2) => {
      t2.visible = e2.visible && e2.value === !0;
    });
  } }, { type: "selectButton", label: $t("\u84DD\u7259\u9002\u914D\u5668"), name: "bluetoothAdapter", value: a2.bluetoothAdapter ?? !1, options: W(), visible: K && i(a2.openBluetooth, !0, !1) }]);
  let $ = b([{ type: "selectButton", label: $t("\u81EA\u5B9A\u4E49\u4E66\u7B7E"), name: "openBookmarks", value: a2.openBookmarks ?? !1, options: W() }, { type: "selectButton", label: $t("\u540C\u6B65\u4E66\u7B7E"), name: "syncBookmark", value: a2.syncBookmark ?? !1, options: W() }, { type: "selectButton", label: $t("\u540C\u6B65\u5386\u53F2\u8BB0\u5F55"), name: "syncHistory", value: a2.syncHistory ?? !1, options: W() }, { type: "selectButton", label: $t("\u540C\u6B65\u6807\u7B7E\u9875"), name: "syncTab", value: a2.syncTab ?? !0, options: W() }, { type: "selectButton", label: $t("\u540C\u6B65Cookie"), name: "syncCookie", value: a2.syncCookie ?? !0, options: W() }, { type: "selectButton", label: C2.syncExtensionApps, name: "syncExtensions", value: a2.syncExtensions ?? !1, options: W(), visible: !J }, { type: "selectButton", label: $t("\u540C\u6B65\u5DF2\u4FDD\u5B58\u7684\u7528\u6237\u540D\u5BC6\u7801"), name: "syncPassword", value: a2.syncPassword ?? !0, options: W() }, { type: "selectButton", label: $t("\u540C\u6B65IndexedDB"), name: "syncIndexedDb", value: a2.syncIndexedDb ?? !1, options: W() }, { type: "selectButton", label: $t("\u540C\u6B65Local Storage"), name: "syncLocalStorage", value: a2.syncLocalStorage ?? !0, options: W() }, { type: "selectButton", label: $t("\u540C\u6B65Session Storage"), name: "syncSessionStorage", value: a2.syncSessionStorage ?? !1, options: W(), change(e2) {
    s($, "sessionStorages", e2.value === !0);
  } }, { type: "textarea", label: " ", name: "sessionStorages", placeholder: $t(`\u8BF7\u52A1\u5FC5\u6309\u4EE5\u4E0B\u683C\u5F0F\u586B\u5199\uFF0C\u4E0D\u8F93\u5165\u5219\u5168\u90E8\u5F00\u542F
{example}`, { example: `[
	{"domain": "www.example1.com", "key": ["key1", "key2"]}
	{"domain": "www.example2.com", "key": ["key1", "key2"]}
]` }), value: v(a2?.sessionStorages) ? "" : JSON.stringify(a2.sessionStorages, null, 2), rows: 5, formatValue: (t2) => e(t2.value, []), help: $t("\u5F00\u542F\u540C\u6B65 Session Storage \u53EF\u80FD\u5B58\u5728\u98CE\u9669\uFF0C\u8BF7\u8C28\u614E\u64CD\u4F5C!"), visible: i(a2.syncSessionStorage, !0, !1) }, { type: "selectButton", label: $t("\u542F\u52A8\u6D4F\u89C8\u5668\u524D\u5220\u9664\u7F13\u5B58\u6587\u4EF6"), name: "clearCacheFile", value: a2.clearCacheFile ?? !1, options: W() }, { type: "selectButton", label: $t("\u542F\u52A8\u6D4F\u89C8\u5668\u524D\u5220\u9664Cookie"), name: "clearCookie", value: a2.clearCookie ?? !1, options: W() }, { type: "selectButton", label: $t("\u542F\u52A8\u6D4F\u89C8\u5668\u524D\u5220\u9664Local Storage"), name: "clearLocalStorage", value: a2.clearLocalStorage ?? !1, options: W() }, { type: "selectButton", label: $t("\u542F\u52A8\u6D4F\u89C8\u5668\u65F6\u968F\u673A\u6307\u7EB9"), name: "randomFingerprint", value: a2.randomFingerprint ?? !1, options: W() }, { type: "selectButton", label: $t("\u5F39\u51FA\u4FDD\u5B58\u5BC6\u7801\u63D0\u793A"), name: "forbidSavePassword", value: a2.forbidSavePassword ?? !0, options: W() }, { type: "selectButton", label: $t("\u7F51\u7EDC\u4E0D\u901A\u505C\u6B62\u6253\u5F00"), name: "stopOpenNet", value: a2.stopOpenNet ?? !1, options: W() }, { type: "selectButton", label: $t("IP\u53D1\u751F\u53D8\u5316\u505C\u6B62\u6253\u5F00"), name: "stopOpenIP", value: a2.stopOpenIP ?? !1, options: W() }, { type: "selectButton", label: $t("IP\u5BF9\u5E94\u56FD\u5BB6/\u5730\u533A\u53D1\u751F\u6539\u53D8\u505C\u6B62\u6253\u5F00"), name: "stopOpenPosition", value: a2.stopOpenPosition ?? !1, options: W() }, { type: "selectButton", label: $t("\u6253\u5F00\u5DE5\u4F5C\u53F0"), name: "openWorkbench", value: a2.openWorkbench ?? 1, options: [{ label: $t("\u5F00\u542F"), value: 1 }, { label: $t("\u5173\u95ED"), value: 0 }, { label: $t("\u8DDF\u968F\u8F6F\u4EF6\u8BBE\u7F6E"), value: 2 }] }, { type: "selectButton", label: $t("IP \u53D8\u5316\u63D0\u9192"), name: "ipChangeRemind", value: a2.ipChangeRemind ?? 2, options: [{ label: $t("\u5F00\u542F"), value: 1 }, { label: $t("\u5173\u95ED"), value: 0 }, { label: $t("\u8DDF\u968F\u8F6F\u4EF6\u8BBE\u7F6E"), value: 2 }] }, { type: "selectButton", label: $t("\u662F\u5426\u5F00\u542F\u8C37\u6B4C\u767B\u5F55"), name: "enableGoogleLogin", value: a2.enableGoogleLogin ?? 2, visible: !J, options: [{ label: $t("\u5F00\u542F"), value: 1 }, { label: $t("\u5173\u95ED"), value: 0 }, { label: $t("\u8DDF\u968F\u8F6F\u4EF6\u8BBE\u7F6E"), value: 2 }] }, { type: "textarea", label: $t("\u7F51\u5740\u8BBF\u95EE\u9ED1\u540D\u5355"), name: "blockDomainList", value: a2.blockDomainList, placeholder: $t("\u6BCF\u884C\u4E00\u4E2A URL\uFF0C\u6362\u884C\u4EE5\u6DFB\u52A0\u591A\u4E2A"), tooltip: $t("\u963B\u6B62\u8BBF\u95EE\u5217\u8868\u4E2D\u6307\u5B9A\u7684\u7F51\u7AD9\u6216\u7F51\u7EDC\u670D\u52A1\u3002") }, { type: "textarea", label: $t("\u7F51\u5740\u8BBF\u95EE\u767D\u540D\u5355"), name: "allowDomainList", value: a2.allowDomainList, placeholder: $t("\u6BCF\u884C\u4E00\u4E2A URL\uFF0C\u6362\u884C\u4EE5\u6DFB\u52A0\u591A\u4E2A"), tooltip: $t("\u4EC5\u5141\u8BB8\u8BBF\u95EE\u5217\u8868\u4E2D\u6307\u5B9A\u7684\u7F51\u7AD9\u6216\u7F51\u7EDC\u670D\u52A1\u3002") }]);
  async function Le(e2, t2, r2) {
    let i2 = F(e2), a3 = n(Z, "browserVersion");
    l(X, ["webGpu", "deviceInfo", "deviceNameSwitch", "macInfo"]).forEach((e3) => {
      e3.visible = !i2;
    });
    let s2 = n(X, "deviceName");
    if (s2) {
      let e3 = n(X, "deviceNameSwitch");
      s2.visible = !i2 && e3?.value === !0;
    }
    let c2 = n(X, "macAddr");
    if (c2) {
      let e3 = n(X, "macInfo");
      c2.visible = !i2 && e3?.value === !0;
    }
    let u2 = n(Q, "searchEngine");
    u2 && (u2.visible = !i2);
    let d2 = n(X, "sandboxPermission");
    d2 && (d2.visible = !i2);
    let f2 = n($, "enableGoogleLogin");
    f2 && (f2.visible = !i2);
    let p2 = n(Q, "windowOpenSize");
    if (p2) {
      let e3 = n(Q, "positionSwitch");
      p2.visible = !i2 && e3?.value === !0;
    }
    let m2 = n(Q, "windowRatioPosition");
    if (m2) {
      let e3 = n(Q, "positionSwitch");
      m2.visible = !i2 && e3?.value === !0;
    }
    let h3 = n(X, "disableSsl");
    h3 && (h3.visible = !i2);
    let g2 = n(X, "disableSslList");
    g2 && (g2.visible = !i2 && h3?.value === !0);
    let _2 = n($, "syncExtensions");
    if (_2 && (_2.visible = !i2), a3) {
      let e3 = !i2 && T2?.uaModeSwitch === o.close;
      if (a3.visible = e3, i2) a3.value = [], a3._oldValue = [], a3.options = [];
      else if (e3 && t2 && r2) {
        let e4 = await M({ os: t2, osVersion: r2 });
        a3.options = e4, a3.value = e4.map((e5) => e5.value), a3._oldValue = a3.value.slice();
      }
    }
    if (n(X, "speechVoices")?.value === !0) {
      let t3 = n(Z, "os"), r3 = Y.os || t3?.value?.value, { getSpeechSynthesis: i3 } = await globalThis.electronAPI.send("util:callRandomFingerprintFunc", { getSpeechSynthesis: [r3, e2] });
      Object.assign(Y, { speechVoicesValue: { enable: !0, voices: i3 } });
    }
  }
  return q.push(Z, Q, X, $), await y2(() => Le(I2, P2?.value, B2?.value)), [q, Y];
}
function Te(e2, t2) {
  let n2 = l(e2, ["BatterySeparator", "NetworkSeparator", "bluetoothSeparator", "openBattery", "openNetwork", "openBluetooth"]);
  v(n2) || n2.forEach((e3) => {
    Reflect.set(e3, "visible", t2), e3.change?.(e3);
  });
}
function W(e2) {
  let { trueText: t2, falseText: n2, trueValue: r2, falseValue: i2 } = { trueText: $t("\u5F00\u542F"), falseText: $t("\u5173\u95ED"), trueValue: !0, falseValue: !1, ...e2 };
  return [{ label: t2, value: r2 }, { label: n2, value: i2 }];
}
function Ee() {
  return { openMult: !0, clearHistory: !1, allowRunApplication: !0, ignoreHttpsError: !1, webGLMeta: !0, enablePlugin: !1, enablePluginList: [], mediaDevice: !1, disableSsl: !1, disableSslList: [], isPositionBaseIp: !0, webGpu: "webgl", deviceInfo: !0, deviceNameSwitch: !0, macInfo: !0, syncExtensions: !1, enableGoogleLogin: 2 };
}
export {ue as a,Te as i,de as o,U as r,P as t};