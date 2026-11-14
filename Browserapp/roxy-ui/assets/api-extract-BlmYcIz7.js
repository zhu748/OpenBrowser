import {Tr as e,xr as t} from "./utils-BIWenCnY.js";
import {r as n} from "./proxy-D7e36h-l.js";
function r(e2) {
  return !e2 || typeof e2 != "object" || Array.isArray(e2) ? !1 : "code" in e2 || "message" in e2 || "msg" in e2;
}
async function i(i2, a2 = "SOCKS5") {
  let o2 = i2.trim();
  if (t(o2)) return { ok: !1, message: $t("\u8BF7\u8F93\u5165\u63D0\u53D6\u94FE\u63A5") };
  try {
    let t2 = await globalThis.electronAPI.send("proxy:extract", o2).then((result) => ({ ok: result.status < 400, text: async () => result.body })), i3 = (await t2.text()).trim();
    if (!i3) return { ok: !1, message: $t("\u63D0\u53D6\u5931\u8D25") };
    if (i3.startsWith("{") || i3.startsWith("[")) try {
      let e2 = JSON.parse(i3);
      if (r(e2)) return { ok: !1, message: e2.message || e2.msg || $t("\u63D0\u53D6\u5931\u8D25") };
    } catch {
    }
    if (!t2.ok) return { ok: !1, message: i3 || $t("\u63D0\u53D6\u5931\u8D25") };
    let { host: s2, port: c2, proxyUserName: l, proxyPassword: u } = e(i3);
    return !s2 || !c2 ? { ok: !1, message: $t("\u63D0\u53D6\u7ED3\u679C\u683C\u5F0F\u9519\u8BEF") } : { ok: !0, connection: { host: s2.replace(/\[|\]/g, ""), port: String(c2), proxyUserName: l ?? "", proxyPassword: u ?? "", ipType: s2.startsWith("[") ? n.IPV6 : n.IPV4, protocol: a2, proxyCategory: a2, extraUrl: o2 } };
  } catch (e2) {
    return { ok: !1, message: (e2 instanceof Error ? e2.message : String(e2 ?? "")) || $t("\u63D0\u53D6\u5931\u8D25") };
  }
}
async function a(e2) {
  let t2 = e2.proxyCategory || "SOCKS5", n2 = await i(e2.extraUrl, t2);
  if (!n2.ok) return n2;
  let { connection: r2 } = n2, a2 = { ...r2, checkChannel: e2.checkChannel, isDirect: e2.isDirect, apiCheck: !1 };
  return { ok: !0, connection: r2, checkResult: await e2.testProxy(a2) };
}
function o(e2) {
  let n2 = e2.proxyMethod, r2 = String(e2.extraUrl || "").trim();
  return n2 !== "api" || t(r2) ? !1 : t(e2.host);
}
function s(e2, t2, n2) {
  return { ...e2, proxyMethod: "api", moduleId: 0, proxyCategory: t2.proxyCategory, protocol: t2.protocol, extraUrl: t2.extraUrl, host: t2.host, port: t2.port, proxyUserName: t2.proxyUserName, proxyPassword: t2.proxyPassword, ipType: t2.ipType, lastIp: n2.lastIp ?? "", lastCity: n2.lastCity ?? "", lastCountry: n2.lastCountry ?? "", timezone: n2.timezone, checkStatus: n2.checkStatus, checkTime: n2.checkTime };
}
async function c(e2, t2) {
  if (!o(e2) || !globalThis.isElectron) return e2;
  let n2 = await a({ extraUrl: String(e2.extraUrl || "").trim(), proxyCategory: String(e2.proxyCategory || e2.protocol || "SOCKS5"), checkChannel: t2.checkChannel, isDirect: t2.isDirect, testProxy: t2.testProxy });
  return n2.ok ? s(e2, n2.connection, n2.checkResult) : e2;
}
export {a as n,c as t};