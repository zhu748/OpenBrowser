import {o as e} from "./proxy-D7e36h-l.js";
import {t} from "./isValid-D6rH8LLp.js";
import {n} from "./api-BToUsmQq.js";
import {i as r} from "./apiError-BDM3pKoT.js";
var i = 500;
var a = /* @__PURE__ */ new Set(["socks5", "http", "https"]);
function o(t2, n2) {
  return t2 === !0 || t2 === e.success ? !0 : t2 === !1 || t2 === e.failure ? !1 : typeof n2 == "string" && n2.trim() ? !0 : null;
}
function s(e2) {
  if (!e2) return Date.now();
  if (/^\d{10,13}$/.test(e2)) {
    let t2 = Number(e2);
    return e2.length <= 10 ? t2 * 1e3 : t2;
  }
  let n2 = new Date(e2);
  return t(n2) ? n2.getTime() : Date.now();
}
function c(e2) {
  let t2 = String(e2 || "").trim().toLowerCase();
  return a.has(t2) ? t2 : void 0;
}
function l(e2) {
  let t2 = Number(e2);
  return Number.isFinite(t2) && t2 > 0 ? t2 : void 0;
}
function u(e2, t2) {
  let n2 = e2?.trim() || "";
  if (/^[a-z]{2}$/i.test(n2)) return n2.toUpperCase();
  let r2 = t2?.trim() || "";
  return /^[a-z]{2}$/i.test(r2) ? r2.toUpperCase() : "";
}
function d(e2) {
  let t2 = e2.phoneId.trim(), n2 = o(e2.checkStatus, e2.lastIp);
  if (!t2 || n2 == null) return null;
  let r2 = e2.lastIp?.trim() || "", i2 = e2.lastCountry?.trim() || "", a2 = u(e2.countryCode, i2), d2 = c(e2.proxyType), f2 = l(e2.proxyPort), p2 = e2.proxyServer?.trim();
  return { phoneId: t2, ...d2 ? { proxyType: d2 } : {}, ...p2 ? { proxyServer: p2 } : {}, ...f2 == null ? {} : { proxyPort: f2 }, lastIp: r2, lastCountry: i2, ...a2 ? { countryCode: a2 } : {}, ...e2.lastCity?.trim() ? { lastCity: e2.lastCity.trim() } : {}, checkStatus: n2, checkAt: s(e2.checkTime), ...e2.timezone?.trim() ? { timezone: e2.timezone.trim() } : {}, ...e2.isp?.trim() ? { isp: e2.isp.trim() } : {} };
}
async function f(e2) {
  let t2 = /* @__PURE__ */ new Map();
  for (let n2 of e2) {
    let e3 = d(n2);
    e3 && t2.set(e3.phoneId, e3);
  }
  let a2 = [...t2.values()];
  if (!a2.length) return !0;
  try {
    for (let e3 = 0; e3 < a2.length; e3 += i) {
      let t3 = await n.phone.v1CloudphonesPhoneBatchProxyCheckCreate({ proxyList: a2.slice(e3, e3 + i) });
      if (!r(t3)) return console.error("[CloudPhone] batch proxy check failed", t3.msg), !1;
    }
    return !0;
  } catch (e3) {
    return console.error("[CloudPhone] batch proxy check failed", e3), !1;
  }
}
async function p(e2) {
  let t2 = [];
  for (let n2 of e2) {
    let { phoneIds: e3, ...r2 } = n2;
    for (let n3 of e3) {
      let e4 = n3.trim();
      e4 && t2.push({ ...r2, phoneId: e4 });
    }
  }
  return f(t2);
}
export {p as t};