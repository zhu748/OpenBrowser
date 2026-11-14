var e = "\u7F3A\u5C11 domain \u4FE1\u606F\uFF0C\u8BF7\u5728\u4E0B\u9762\u5E73\u53F0\u8D26\u53F7\u4E2D\u9009\u62E9\u6216\u65B0\u589E\u5BF9\u5E94\u7684\u4E1A\u52A1\u5E73\u53F0";
var t = /* @__PURE__ */ new Set(["domain", "path", "expires", "expiry", "maxage", "secure", "httponly", "samesite"]);
function n(e2) {
  if (e2 == null || e2 === "") return -1;
  let t2 = Number(e2);
  return !Number.isFinite(t2) || t2 <= 0 ? -1 : Math.floor(t2 > 1e10 ? t2 / 1e3 : t2);
}
function r(e2) {
  if (typeof e2 != "string" || !e2.trim()) return "Lax";
  let t2 = e2.trim().toLowerCase();
  return t2 === "none" ? "None" : t2 === "strict" ? "Strict" : "Lax";
}
function i(e2) {
  let t2 = n(e2.expires ?? e2.expiry), i2 = r(e2.sameSite), a2 = i2 === "None" || !!e2.secure;
  return { ...e2, name: String(e2.name ?? ""), value: String(e2.value ?? ""), domain: String(e2.domain ?? ""), path: String(e2.path || "/"), expires: t2, httpOnly: !!e2.httpOnly, secure: a2, sameSite: i2, session: !!(e2.session ?? t2 === -1) };
}
function a(e2) {
  return e2.trim().toLowerCase().replace(/-/g, "");
}
function o(e2) {
  return t.has(a(e2));
}
function s(e2) {
  return e2 === void 0 || e2 === "" || /^(?:1|true|yes)$/i.test(e2.trim());
}
function c(e2, t2, n2) {
  switch (a(t2)) {
    case "domain":
      e2.domain = n2?.trim() ?? "";
      break;
    case "path":
      e2.path = n2?.trim() || "/";
      break;
    case "expires":
    case "expiry":
      e2.expires = n2?.trim();
      break;
    case "maxage":
      n2?.trim() && (e2.expires = Math.floor(Date.now() / 1e3) + Number.parseInt(n2.trim(), 10));
      break;
    case "secure":
      e2.secure = s(n2);
      break;
    case "httponly":
      e2.httpOnly = s(n2);
      break;
    case "samesite":
      e2.sameSite = n2?.trim();
  }
}
function l(e2) {
  let t2 = e2.trim();
  if (!t2) return null;
  let n2 = t2.indexOf("=");
  if (n2 === -1) return { name: t2, value: "" };
  if (n2 <= 0) return null;
  let r2 = t2.slice(0, n2).trim();
  return !r2 || o(r2) ? null : { name: r2, value: t2.slice(n2 + 1) };
}
function u(e2) {
  let t2 = { path: "/" }, n2 = e2.trim();
  for (; n2; ) {
    let e3 = n2.match(/^(domain|path|expires|expiry|max-age|maxage|secure|httponly|samesite)=([^;]*)\s*;\s*/i);
    if (!e3) break;
    c(t2, e3[1], e3[2]), n2 = n2.slice(e3[0].length).trim();
  }
  return { defaults: t2, rest: n2 };
}
function d(e2, t2 = {}) {
  let n2 = { httpOnly: !1, secure: !1, sameSite: "Lax", ...t2, ...e2 };
  return { ...n2, path: String(n2.path || "/") };
}
function f(e2) {
  let t2 = /* @__PURE__ */ new Set(), n2 = [];
  for (let r2 of e2) {
    let e3 = JSON.stringify({ name: r2.name, domain: r2.domain ?? "", path: r2.path || "/", value: r2.value ?? "" });
    t2.has(e3) || (t2.add(e3), n2.push(r2));
  }
  return n2;
}
function p(e2) {
  return f(e2).map((e3) => i(e3));
}
function m(e2) {
  return e2.split(";").map((e3) => e3.trim()).filter(Boolean);
}
function h(e2) {
  let { rest: t2 } = u(e2), n2 = m(t2);
  return n2.length ? n2.every((e3) => {
    let t3 = e3.indexOf("=");
    if (t3 === -1) return !!e3.trim();
    let n3 = e3.slice(0, t3).trim();
    return !!n3 && !o(n3);
  }) : !1;
}
function g(e2, t2 = {}) {
  let { defaults: n2, rest: r2 } = u(e2), i2 = d({}, { ...t2, ...n2 }), a2 = [];
  for (let e3 of m(r2)) {
    let t3 = l(e3);
    t3 && a2.push(d({ name: t3.name, value: t3.value }, i2));
  }
  return a2.length ? a2 : null;
}
function _(e2 = {}) {
  return d({}, e2);
}
function v(e2, t2 = {}) {
  let n2 = [], r2 = _(t2);
  for (let i2 of m(e2)) {
    let e3 = i2.indexOf("=");
    if (e3 <= 0) {
      if (!r2.name && !String(r2.domain ?? "").trim()) continue;
      c(r2, i2);
      continue;
    }
    let a2 = i2.slice(0, e3).trim(), s2 = i2.slice(e3 + 1);
    a2 && (o(a2) ? c(r2, a2, s2) : (r2.name && n2.push({ ...r2 }), r2 = _(t2), r2.name = a2, r2.value = s2));
  }
  return r2.name && n2.push({ ...r2 }), n2;
}
function y(e2, t2 = {}) {
  if (h(e2)) {
    let n3 = g(e2, t2);
    return n3 ? p(n3) : null;
  }
  let n2 = v(e2, t2);
  return n2.length ? p(n2) : null;
}
function b(e2) {
  return e2.includes(";") ? m(e2) : e2.split(/,(?=\s*(?:domain|path|expires|expiry|max-age|maxage|secure|httponly|http-only|samesite|same-site)\s*=)/i).map((e3) => e3.trim()).filter(Boolean);
}
function x(e2, t2 = {}) {
  let n2 = [], r2 = null;
  for (let i2 of b(e2)) {
    let e3 = i2.indexOf("=");
    if (e3 <= 0) {
      if (!r2?.name) return [];
      c(r2, i2);
      continue;
    }
    let a2 = i2.slice(0, e3).trim(), s2 = i2.slice(e3 + 1);
    if (!a2) return [];
    if (o(a2)) {
      if (!r2?.name) return [];
      c(r2, a2, s2);
    } else r2?.name && n2.push(r2), r2 = d({ name: a2, value: s2 }, t2);
  }
  return r2?.name && n2.push(r2), n2;
}
function S(e2) {
  let t2 = e2.split(",").map((e3) => e3.trim()).filter(Boolean);
  if (t2.length <= 1) return t2;
  let n2 = [], r2 = [];
  for (let e3 of t2) {
    let t3 = e3.indexOf("="), i2 = t3 > 0 ? e3.slice(0, t3).trim() : e3.trim();
    r2.length ? o(i2) ? r2.push(e3) : (n2.push(r2.join(", ")), r2 = [e3]) : r2.push(e3);
  }
  return r2.length && n2.push(r2.join(", ")), n2;
}
function C(e2) {
  let t2 = e2?.trim();
  if (!t2) return "";
  let n2 = t2.match(/^(https?:\/\/[^:\s{]+)/i)?.[1] ?? t2;
  try {
    return new URL(n2).hostname;
  } catch {
    return n2.replace(/^https?:\/\//i, "").split(/[/:?#]/)[0] ?? "";
  }
}
function w(e2) {
  let t2 = e2.trim();
  return t2 ? (t2.includes(`
`) ? t2.split(`
`).map((e3) => e3.trim()).filter(Boolean) : [t2]).filter((e3) => E(e3)).length : 0;
}
function T(e2, t2 = {}) {
  let n2 = e2.trim();
  if (!n2) return null;
  let { defaults: r2 } = u(n2), i2 = d(t2, r2);
  if (n2.includes(";")) return y(n2, i2);
  let a2 = (n2.includes(",") ? S(n2) : [n2]).flatMap((e3) => x(e3, i2)).filter((e3) => !!e3.name);
  return a2.length ? p(a2) : null;
}
function E(e2) {
  let t2 = e2.trim();
  if (!t2) return !1;
  let { defaults: n2 } = u(t2);
  return !String(n2.domain ?? "").trim() && !!T(t2)?.some((e3) => !e3.domain.trim());
}
function D(e2, t2 = {}, n2, r2 = { index: 0 }) {
  let i2 = e2.trim();
  if (!i2) return null;
  let { defaults: a2 } = u(i2), o2 = !!String(a2.domain ?? "").trim(), s2 = T(i2, t2);
  if (!s2?.length) return null;
  if (!o2 && s2.some((e3) => !e3.domain.trim())) {
    if (!n2?.length || r2.index >= n2.length) return "missing_domain";
    let e3 = C(n2[r2.index]);
    return r2.index += 1, s2.map((t3) => ({ ...t3, domain: t3.domain.trim() || e3 }));
  }
  return s2;
}
function O(e2, t2 = {}, n2) {
  let r2 = e2.trim();
  if (!r2) return null;
  let i2 = { index: 0 };
  if (r2.includes(`
`)) {
    let e3 = [];
    for (let a3 of r2.split(`
`)) {
      let r3 = a3.trim();
      if (!r3) continue;
      let o2 = D(r3, t2, n2, i2);
      if (o2 === "missing_domain") return null;
      o2 && e3.push(...o2);
    }
    return e3.length ? e3 : null;
  }
  let a2 = D(r2, t2, n2, i2);
  return a2 === "missing_domain" ? null : a2;
}
function k(e2) {
  return /^#\s*(?:Netscape\s+)?HTTP Cookie File/m.test(e2) ? !0 : e2.split(`
`).some((e3) => {
    let t2 = e3.trim();
    if (!t2 || t2.startsWith("#")) return !1;
    let n2 = t2.split("	");
    return n2.length < 7 ? !1 : /^(?:TRUE|FALSE)$/i.test(n2[1].trim()) && /^(?:TRUE|FALSE)$/i.test(n2[3].trim());
  });
}
function A(e2) {
  let t2 = [];
  for (let n2 of e2.split(`
`)) {
    let e3 = n2.trim();
    if (!e3 || e3.startsWith("#") && !e3.startsWith("#HttpOnly_")) continue;
    let r2 = e3.split("	");
    if (r2.length < 7) continue;
    let a2 = r2[0].trim(), o2 = !1;
    a2.startsWith("#HttpOnly_") && (o2 = !0, a2 = a2.slice(10));
    let [, , s2, c2, l2, u2, ...d2] = r2, f2 = u2?.trim();
    if (!a2 || !f2) continue;
    let p2 = Number.parseInt(l2?.trim() || "0", 10);
    t2.push(i({ domain: a2, path: s2?.trim() || "/", secure: c2?.trim().toUpperCase() === "TRUE", expires: p2 > 0 ? p2 : void 0, httpOnly: o2, name: f2, value: d2.join("	") }));
  }
  return t2.length ? t2 : null;
}
function j(e2) {
  return !!(e2 && typeof e2 == "object" && "name" in e2 && e2.name);
}
function M(e2) {
  try {
    let t2 = JSON.parse(e2), n2 = (Array.isArray(t2) ? t2 : [t2]).filter(j);
    return n2.length ? p(n2) : null;
  } catch {
    return null;
  }
}
function N(e2) {
  return Array.isArray(e2) ? e2.filter(j).map((e3) => i(e3)) : [];
}
function P(e2) {
  let t2 = N(e2);
  return t2.length ? JSON.stringify(t2, null, 2) : "";
}
function F(e2, t2 = {}) {
  let n2 = I(e2, t2);
  return n2.valid ? n2.cookies : null;
}
function I(t2, n2 = {}) {
  let r2 = t2?.trim() ?? "";
  if (!r2) return { valid: !0, cookies: [] };
  let i2 = n2.defaultAttributes ?? {}, a2 = n2.platformUrls ?? [];
  if (r2.startsWith("[") || r2.startsWith("{")) {
    let e2 = M(r2);
    return e2 ? { valid: !0, cookies: e2 } : { valid: !1, message: $t("Cookie \u683C\u5F0F\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u683C\u5F0F") };
  }
  if (k(r2)) {
    let e2 = A(r2);
    return e2 ? { valid: !0, cookies: e2 } : { valid: !1, message: $t("Cookie \u683C\u5F0F\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u683C\u5F0F") };
  }
  let o2 = w(r2);
  if (o2 > a2.length) return { valid: !1, message: $t("* {msg}", { msg: e }) };
  let s2 = O(r2, i2, a2);
  return s2 ? { valid: !0, cookies: s2 } : o2 > 0 && o2 > a2.length ? { valid: !1, message: $t("* {msg}", { msg: e }) } : { valid: !1, message: $t("Cookie \u683C\u5F0F\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u683C\u5F0F") };
}
function L(e2, t2 = []) {
  let n2 = t2.map((e3) => e3.platformUrl).filter((e3) => !!e3?.trim()), r2 = I(e2?.trim() ?? "", { platformUrls: n2 });
  return r2.valid ? r2.cookies : [];
}
function R(e2, t2) {
  return !e2 || typeof e2 != "string" || I(e2.trim(), t2).valid;
}
async function z() {
  try {
    let e2 = await window.showOpenFilePicker({ types: [{ description: "cookies Files", accept: { "application/json": [".json"], "text/plain": [".txt"] } }], excludeAcceptAllOption: !0, multiple: !1 }).then((e3) => e3[0].getFile()), t2 = new FileReader();
    return t2.readAsText(e2), new Promise((e3) => {
      t2.onload = function() {
        let n2 = typeof t2.result == "string" ? t2.result : null, r2 = n2 && R(n2);
        e3({ code: r2 ? 0 : -1, data: r2 ? n2 : null, message: r2 ? $t("\u5BFC\u5165\u6210\u529F") : $t("\u5BFC\u5165 Cookie \u683C\u5F0F\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u683C\u5F0F") });
      };
    });
  } catch (e2) {
    console.log(e2);
  }
}
export {z as a,L as i,N as n,P as o,F as r,I as s,R as t};