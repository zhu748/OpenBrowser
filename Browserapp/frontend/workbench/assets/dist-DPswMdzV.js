var e = Object.defineProperty;
var t = Object.getOwnPropertySymbols;
var n = Object.prototype.hasOwnProperty;
var r = Object.prototype.propertyIsEnumerable;
var i = (t2, n2, r2) => n2 in t2 ? e(t2, n2, { enumerable: !0, configurable: !0, writable: !0, value: r2 }) : t2[n2] = r2;
var a = (e2, a2) => {
  for (var o2 in a2 ||= {}) n.call(a2, o2) && i(e2, o2, a2[o2]);
  if (t) for (var o2 of t(a2)) r.call(a2, o2) && i(e2, o2, a2[o2]);
  return e2;
};
function o(e2) {
  return e2 == null || e2 === "" || Array.isArray(e2) && e2.length === 0 || !(e2 instanceof Date) && typeof e2 == "object" && Object.keys(e2).length === 0;
}
function s(e2, t2, n2, r2 = 1) {
  let i2 = -1, a2 = o(e2), s2 = o(t2);
  return i2 = a2 && s2 ? 0 : a2 ? r2 : s2 ? -r2 : typeof e2 == "string" && typeof t2 == "string" ? n2(e2, t2) : e2 < t2 ? -1 : +(e2 > t2), i2;
}
function c(e2, t2, n2 = /* @__PURE__ */ new WeakSet()) {
  if (e2 === t2) return !0;
  if (!e2 || !t2 || typeof e2 != "object" || typeof t2 != "object" || n2.has(e2) || n2.has(t2)) return !1;
  n2.add(e2).add(t2);
  let r2 = Array.isArray(e2), i2 = Array.isArray(t2), a2, o2, s2;
  if (r2 && i2) {
    if (o2 = e2.length, o2 != t2.length) return !1;
    for (a2 = o2; a2-- !== 0; ) if (!c(e2[a2], t2[a2], n2)) return !1;
    return !0;
  }
  if (r2 != i2) return !1;
  let l2 = e2 instanceof Date, u2 = t2 instanceof Date;
  if (l2 != u2) return !1;
  if (l2 && u2) return e2.getTime() == t2.getTime();
  let d2 = e2 instanceof RegExp, f2 = t2 instanceof RegExp;
  if (d2 != f2) return !1;
  if (d2 && f2) return e2.toString() == t2.toString();
  let p2 = Object.keys(e2);
  if (o2 = p2.length, o2 !== Object.keys(t2).length) return !1;
  for (a2 = o2; a2-- !== 0; ) if (!Object.prototype.hasOwnProperty.call(t2, p2[a2])) return !1;
  for (a2 = o2; a2-- !== 0; ) if (s2 = p2[a2], !c(e2[s2], t2[s2], n2)) return !1;
  return !0;
}
function l(e2, t2) {
  return c(e2, t2);
}
function u(e2) {
  return typeof e2 == "function" && "call" in e2 && "apply" in e2;
}
function d(e2) {
  return !o(e2);
}
function f(e2, t2) {
  if (!e2 || !t2) return null;
  try {
    let n2 = e2[t2];
    if (d(n2)) return n2;
  } catch {
  }
  if (Object.keys(e2).length) {
    if (u(t2)) return t2(e2);
    if (t2.indexOf(".") === -1) return e2[t2];
    {
      let n2 = t2.split("."), r2 = e2;
      for (let e3 = 0, t3 = n2.length; e3 < t3; ++e3) {
        if (r2 == null) return null;
        r2 = r2[n2[e3]];
      }
      return r2;
    }
  }
  return null;
}
function p(e2, t2, n2) {
  return n2 ? f(e2, n2) === f(t2, n2) : l(e2, t2);
}
function m(e2, t2) {
  if (e2 != null && t2 && t2.length) {
    for (let n2 of t2) if (p(e2, n2)) return !0;
  }
  return !1;
}
function h(e2, t2 = !0) {
  return e2 instanceof Object && e2.constructor === Object && (t2 || Object.keys(e2).length !== 0);
}
function g(e2 = {}, t2 = {}) {
  let n2 = a({}, e2);
  return Object.keys(t2).forEach((r2) => {
    let i2 = r2;
    h(t2[i2]) && i2 in e2 && h(e2[i2]) ? n2[i2] = g(e2[i2], t2[i2]) : n2[i2] = t2[i2];
  }), n2;
}
function _(...e2) {
  return e2.reduce((e3, t2, n2) => n2 === 0 ? t2 : g(e3, t2), {});
}
function v(e2, t2) {
  let n2 = -1;
  if (t2) {
    for (let r2 = 0; r2 < t2.length; r2++) if (t2[r2] === e2) {
      n2 = r2;
      break;
    }
  }
  return n2;
}
function y(e2, t2) {
  let n2 = -1;
  if (d(e2)) try {
    n2 = e2.findLastIndex(t2);
  } catch {
    n2 = e2.lastIndexOf([...e2].reverse().find(t2));
  }
  return n2;
}
function b(e2, ...t2) {
  return u(e2) ? e2(...t2) : e2;
}
function x(e2, t2 = !0) {
  return typeof e2 == "string" && (t2 || e2 !== "");
}
function S(e2) {
  return x(e2) ? e2.replace(/(-|_)/g, "").toLowerCase() : e2;
}
function C(e2, t2 = "", n2 = {}) {
  let r2 = S(t2).split("."), i2 = r2.shift();
  return i2 ? h(e2) ? C(b(e2[Object.keys(e2).find((e3) => S(e3) === i2) || ""], n2), r2.join("."), n2) : void 0 : b(e2, n2);
}
function w(e2, t2 = !0) {
  return Array.isArray(e2) && (t2 || e2.length !== 0);
}
function T(e2) {
  return e2 instanceof Date;
}
function E(e2) {
  return d(e2) && !isNaN(e2);
}
function D(e2 = "") {
  return d(e2) && e2.length === 1 && !!e2.match(/\S| /);
}
function O() {
  return new Intl.Collator(void 0, { numeric: !0 }).compare;
}
function k(e2, t2) {
  if (t2) {
    let n2 = t2.test(e2);
    return t2.lastIndex = 0, n2;
  }
  return !1;
}
function A(...e2) {
  return _(...e2);
}
function j(e2) {
  return e2 && e2.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, "").replace(/ {2,}/g, " ").replace(/ ([{:}]) /g, "$1").replace(/([;,]) /g, "$1").replace(/ !/g, "!").replace(/: /g, ":").trim();
}
function M(e2, ...t2) {
  if (!h(e2)) return e2;
  let n2 = a({}, e2);
  return t2?.flat().forEach((e3) => delete n2[e3]), n2;
}
function N(e2) {
  if (e2 && /[\xC0-\xFF\u0100-\u017E]/.test(e2)) {
    let t2 = { A: /[\xC0-\xC5\u0100\u0102\u0104]/g, AE: /[\xC6]/g, C: /[\xC7\u0106\u0108\u010A\u010C]/g, D: /[\xD0\u010E\u0110]/g, E: /[\xC8-\xCB\u0112\u0114\u0116\u0118\u011A]/g, G: /[\u011C\u011E\u0120\u0122]/g, H: /[\u0124\u0126]/g, I: /[\xCC-\xCF\u0128\u012A\u012C\u012E\u0130]/g, IJ: /[\u0132]/g, J: /[\u0134]/g, K: /[\u0136]/g, L: /[\u0139\u013B\u013D\u013F\u0141]/g, N: /[\xD1\u0143\u0145\u0147\u014A]/g, O: /[\xD2-\xD6\xD8\u014C\u014E\u0150]/g, OE: /[\u0152]/g, R: /[\u0154\u0156\u0158]/g, S: /[\u015A\u015C\u015E\u0160]/g, T: /[\u0162\u0164\u0166]/g, U: /[\xD9-\xDC\u0168\u016A\u016C\u016E\u0170\u0172]/g, W: /[\u0174]/g, Y: /[\xDD\u0176\u0178]/g, Z: /[\u0179\u017B\u017D]/g, a: /[\xE0-\xE5\u0101\u0103\u0105]/g, ae: /[\xE6]/g, c: /[\xE7\u0107\u0109\u010B\u010D]/g, d: /[\u010F\u0111]/g, e: /[\xE8-\xEB\u0113\u0115\u0117\u0119\u011B]/g, g: /[\u011D\u011F\u0121\u0123]/g, i: /[\xEC-\xEF\u0129\u012B\u012D\u012F\u0131]/g, ij: /[\u0133]/g, j: /[\u0135]/g, k: /[\u0137,\u0138]/g, l: /[\u013A\u013C\u013E\u0140\u0142]/g, n: /[\xF1\u0144\u0146\u0148\u014B]/g, p: /[\xFE]/g, o: /[\xF2-\xF6\xF8\u014D\u014F\u0151]/g, oe: /[\u0153]/g, r: /[\u0155\u0157\u0159]/g, s: /[\u015B\u015D\u015F\u0161]/g, t: /[\u0163\u0165\u0167]/g, u: /[\xF9-\xFC\u0169\u016B\u016D\u016F\u0171\u0173]/g, w: /[\u0175]/g, y: /[\xFD\xFF\u0177]/g, z: /[\u017A\u017C\u017E]/g };
    for (let n2 in t2) e2 = e2.replace(t2[n2], n2);
  }
  return e2;
}
function P(e2, t2, n2) {
  e2 && t2 !== n2 && (n2 >= e2.length && (n2 %= e2.length, t2 %= e2.length), e2.splice(n2, 0, e2.splice(t2, 1)[0]));
}
function F(e2, t2, n2 = 1, r2, i2 = 1) {
  let a2 = s(e2, t2, r2, n2), c2 = n2;
  return (o(e2) || o(t2)) && (c2 = i2 === 1 ? n2 : i2), c2 * a2;
}
function ee(e2) {
  return x(e2, !1) ? e2[0].toUpperCase() + e2.slice(1) : e2;
}
function I(e2) {
  return x(e2) ? e2.replace(/(_)/g, "-").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() : e2;
}
function L() {
  let e2 = /* @__PURE__ */ new Map();
  return { on(t2, n2) {
    let r2 = e2.get(t2);
    return r2 ? r2.push(n2) : r2 = [n2], e2.set(t2, r2), this;
  }, off(t2, n2) {
    let r2 = e2.get(t2);
    return r2 && r2.splice(r2.indexOf(n2) >>> 0, 1), this;
  }, emit(t2, n2) {
    let r2 = e2.get(t2);
    r2 && r2.forEach((e3) => {
      e3(n2);
    });
  }, clear() {
    e2.clear();
  } };
}
var te = Object.defineProperty;
var ne = Object.defineProperties;
var re = Object.getOwnPropertyDescriptors;
var R = Object.getOwnPropertySymbols;
var z = Object.prototype.hasOwnProperty;
var B = Object.prototype.propertyIsEnumerable;
var V = (e2, t2, n2) => t2 in e2 ? te(e2, t2, { enumerable: !0, configurable: !0, writable: !0, value: n2 }) : e2[t2] = n2;
var H = (e2, t2) => {
  for (var n2 in t2 ||= {}) z.call(t2, n2) && V(e2, n2, t2[n2]);
  if (R) for (var n2 of R(t2)) B.call(t2, n2) && V(e2, n2, t2[n2]);
  return e2;
};
var U = (e2, t2) => ne(e2, re(t2));
var W = (e2, t2) => {
  var n2 = {};
  for (var r2 in e2) z.call(e2, r2) && t2.indexOf(r2) < 0 && (n2[r2] = e2[r2]);
  if (e2 != null && R) for (var r2 of R(e2)) t2.indexOf(r2) < 0 && B.call(e2, r2) && (n2[r2] = e2[r2]);
  return n2;
};
function ie(...e2) {
  return _(...e2);
}
var G = L();
var K = /{([^}]*)}/g;
var ae = /(\d+\s+[\+\-\*\/]\s+\d+)/g;
var oe = /var\([^)]+\)/g;
function se(e2) {
  return x(e2) ? e2.replace(/[A-Z]/g, (e3, t2) => t2 === 0 ? e3 : "." + e3.toLowerCase()).toLowerCase() : e2;
}
function ce(e2) {
  return h(e2) && e2.hasOwnProperty("$value") && e2.hasOwnProperty("$type") ? e2.$value : e2;
}
function le(e2) {
  return e2.replaceAll(/ /g, "").replace(/[^\w]/g, "-");
}
function q(e2 = "", t2 = "") {
  return le(`${x(e2, !1) && x(t2, !1) ? `${e2}-` : e2}${t2}`);
}
function ue(e2 = "", t2 = "") {
  return `--${q(e2, t2)}`;
}
function de(e2 = "") {
  return ((e2.match(/{/g) || []).length + (e2.match(/}/g) || []).length) % 2 != 0;
}
function fe(e2, t2 = "", n2 = "", r2 = [], i2) {
  if (x(e2)) {
    let t3 = e2.trim();
    if (de(t3)) return;
    if (k(t3, K)) {
      let e3 = t3.replaceAll(K, (e4) => `var(${ue(n2, I(e4.replace(/{|}/g, "").split(".").filter((e5) => !r2.some((t4) => k(e5, t4))).join("-")))}${d(i2) ? `, ${i2}` : ""})`);
      return k(e3.replace(oe, "0"), ae) ? `calc(${e3})` : e3;
    }
    return t3;
  }
  if (E(e2)) return e2;
}
function pe(e2, t2, n2) {
  x(t2, !1) && e2.push(`${t2}:${n2};`);
}
function J(e2, t2) {
  return e2 ? `${e2}{${t2}}` : "";
}
function Y(e2, t2) {
  if (e2.indexOf("dt(") === -1) return e2;
  function n2(e3, t3) {
    let n3 = [], i3 = 0, a3 = "", o2 = null, s2 = 0;
    for (; i3 <= e3.length; ) {
      let c2 = e3[i3];
      if ((c2 === '"' || c2 === "'" || c2 === "`") && e3[i3 - 1] !== "\\" && (o2 = o2 === c2 ? null : c2), !o2 && (c2 === "(" && s2++, c2 === ")" && s2--, (c2 === "," || i3 === e3.length) && s2 === 0)) {
        let e4 = a3.trim();
        e4.startsWith("dt(") ? n3.push(Y(e4, t3)) : n3.push(r2(e4)), a3 = "", i3++;
      } else c2 !== void 0 && (a3 += c2), i3++;
    }
    return n3;
  }
  function r2(e3) {
    let t3 = e3[0];
    if ((t3 === '"' || t3 === "'" || t3 === "`") && e3[e3.length - 1] === t3) return e3.slice(1, -1);
    let n3 = Number(e3);
    return isNaN(n3) ? e3 : n3;
  }
  let i2 = [], a2 = [];
  for (let t3 = 0; t3 < e2.length; t3++) if (e2[t3] === "d" && e2.slice(t3, t3 + 3) === "dt(") a2.push(t3), t3 += 2;
  else if (e2[t3] === ")" && a2.length > 0) {
    let e3 = a2.pop();
    a2.length === 0 && i2.push([e3, t3]);
  }
  if (!i2.length) return e2;
  for (let r3 = i2.length - 1; r3 >= 0; r3--) {
    let [a3, o2] = i2[r3], s2 = t2(...n2(e2.slice(a3 + 3, o2), t2));
    e2 = e2.slice(0, a3) + s2 + e2.slice(o2 + 1);
  }
  return e2;
}
var me = (e2) => {
  let t2 = $.getTheme(), n2 = Z(t2, e2, void 0, "variable");
  return { name: n2?.match(/--[\w-]+/g)?.[0], variable: n2, value: Z(t2, e2, void 0, "value") };
};
var X = (...e2) => Z($.getTheme(), ...e2);
var Z = (e2 = {}, t2, n2, r2) => {
  if (t2) {
    let { variable: i2, options: a2 } = $.defaults || {}, { prefix: s2, transform: c2 } = e2?.options || a2 || {}, l2 = k(t2, K) ? t2 : `{${t2}}`;
    return r2 === "value" || o(r2) && c2 === "strict" ? $.getTokenValue(t2) : fe(l2, void 0, s2, [i2.excludedKeyRegex], n2);
  }
  return "";
};
function he(e2, ...t2) {
  return e2 instanceof Array ? Y(e2.reduce((e3, n2, r2) => e3 + n2 + (b(t2[r2], { dt: X }) ?? ""), ""), X) : b(e2, { dt: X });
}
function ge(e2, t2 = {}) {
  let n2 = $.defaults.variable, { prefix: r2 = n2.prefix, selector: i2 = n2.selector, excludedKeyRegex: a2 = n2.excludedKeyRegex } = t2, o2 = [], s2 = [], c2 = [{ node: e2, path: r2 }];
  for (; c2.length; ) {
    let { node: e3, path: t3 } = c2.pop();
    for (let n3 in e3) {
      let i3 = e3[n3], l3 = ce(i3), u2 = k(n3, a2) ? q(t3) : q(t3, I(n3));
      if (h(l3)) c2.push({ node: l3, path: u2 });
      else {
        pe(s2, ue(u2), fe(l3, u2, r2, [a2]));
        let e4 = u2;
        r2 && e4.startsWith(r2 + "-") && (e4 = e4.slice(r2.length + 1)), o2.push(e4.replace(/-/g, "."));
      }
    }
  }
  let l2 = s2.join("");
  return { value: s2, tokens: o2, declarations: l2, css: J(i2, l2) };
}
var Q = { regex: { rules: { class: { pattern: /^\.([a-zA-Z][\w-]*)$/, resolve(e2) {
  return { type: "class", selector: e2, matched: this.pattern.test(e2.trim()) };
} }, attr: { pattern: /^\[(.*)\]$/, resolve(e2) {
  return { type: "attr", selector: `:root${e2},:host${e2}`, matched: this.pattern.test(e2.trim()) };
} }, media: { pattern: /^@media (.*)$/, resolve(e2) {
  return { type: "media", selector: e2, matched: this.pattern.test(e2.trim()) };
} }, system: { pattern: /^system$/, resolve(e2) {
  return { type: "system", selector: "@media (prefers-color-scheme: dark)", matched: this.pattern.test(e2.trim()) };
} }, custom: { resolve(e2) {
  return { type: "custom", selector: e2, matched: !0 };
} } }, resolve(e2) {
  let t2 = Object.keys(this.rules).filter((e3) => e3 !== "custom").map((e3) => this.rules[e3]);
  return [e2].flat().map((e3) => t2.map((t3) => t3.resolve(e3)).find((e4) => e4.matched) ?? this.rules.custom.resolve(e3));
} }, _toVariables(e2, t2) {
  return ge(e2, { prefix: t2?.prefix });
}, getCommon({ name: e2 = "", theme: t2 = {}, params: n2, set: r2, defaults: i2 }) {
  let { preset: a2, options: o2 } = t2, s2, c2, l2, u2, f2, p2, m2;
  if (d(a2) && o2.transform !== "strict") {
    let { primitive: t3, semantic: n3, extend: h2 } = a2, g2 = n3 || {}, { colorScheme: _2 } = g2, v2 = W(g2, ["colorScheme"]), y2 = h2 || {}, { colorScheme: x2 } = y2, S2 = W(y2, ["colorScheme"]), C2 = _2 || {}, { dark: w2 } = C2, T2 = W(C2, ["dark"]), E2 = x2 || {}, { dark: D2 } = E2, O2 = W(E2, ["dark"]), k2 = d(t3) ? this._toVariables({ primitive: t3 }, o2) : {}, A2 = d(v2) ? this._toVariables({ semantic: v2 }, o2) : {}, j2 = d(T2) ? this._toVariables({ light: T2 }, o2) : {}, M2 = d(w2) ? this._toVariables({ dark: w2 }, o2) : {}, N2 = d(S2) ? this._toVariables({ semantic: S2 }, o2) : {}, P2 = d(O2) ? this._toVariables({ light: O2 }, o2) : {}, F2 = d(D2) ? this._toVariables({ dark: D2 }, o2) : {}, [ee2, I2] = [k2.declarations ?? "", k2.tokens], [L2, te2] = [A2.declarations ?? "", A2.tokens || []], [ne2, re2] = [j2.declarations ?? "", j2.tokens || []], [R2, z2] = [M2.declarations ?? "", M2.tokens || []], [B2, V2] = [N2.declarations ?? "", N2.tokens || []], [H2, U2] = [P2.declarations ?? "", P2.tokens || []], [ie2, G2] = [F2.declarations ?? "", F2.tokens || []];
    s2 = this.transformCSS(e2, ee2, "light", "variable", o2, r2, i2), c2 = I2, l2 = `${this.transformCSS(e2, `${L2}${ne2}`, "light", "variable", o2, r2, i2)}${this.transformCSS(e2, `${R2}`, "dark", "variable", o2, r2, i2)}`, u2 = [.../* @__PURE__ */ new Set([...te2, ...re2, ...z2])], f2 = `${this.transformCSS(e2, `${B2}${H2}color-scheme:light`, "light", "variable", o2, r2, i2)}${this.transformCSS(e2, `${ie2}color-scheme:dark`, "dark", "variable", o2, r2, i2)}`, p2 = [.../* @__PURE__ */ new Set([...V2, ...U2, ...G2])], m2 = b(a2.css, { dt: X });
  }
  return { primitive: { css: s2, tokens: c2 }, semantic: { css: l2, tokens: u2 }, global: { css: f2, tokens: p2 }, style: m2 };
}, getPreset({ name: e2 = "", preset: t2 = {}, options: n2, params: r2, set: i2, defaults: a2, selector: o2 }) {
  let s2, c2, l2;
  if (d(t2) && n2.transform !== "strict") {
    let r3 = e2.replace("-directive", ""), u2 = t2, { colorScheme: f2, extend: p2, css: m2 } = u2, h2 = W(u2, ["colorScheme", "extend", "css"]), g2 = p2 || {}, { colorScheme: _2 } = g2, v2 = W(g2, ["colorScheme"]), y2 = f2 || {}, { dark: x2 } = y2, S2 = W(y2, ["dark"]), C2 = _2 || {}, { dark: w2 } = C2, T2 = W(C2, ["dark"]), E2 = d(h2) ? this._toVariables({ [r3]: H(H({}, h2), v2) }, n2) : {}, D2 = d(S2) ? this._toVariables({ [r3]: H(H({}, S2), T2) }, n2) : {}, O2 = d(x2) ? this._toVariables({ [r3]: H(H({}, x2), w2) }, n2) : {}, [k2, A2] = [E2.declarations ?? "", E2.tokens || []], [j2, M2] = [D2.declarations ?? "", D2.tokens || []], [N2, P2] = [O2.declarations ?? "", O2.tokens || []];
    s2 = `${this.transformCSS(r3, `${k2}${j2}`, "light", "variable", n2, i2, a2, o2)}${this.transformCSS(r3, N2, "dark", "variable", n2, i2, a2, o2)}`, c2 = [.../* @__PURE__ */ new Set([...A2, ...M2, ...P2])], l2 = b(m2, { dt: X });
  }
  return { css: s2, tokens: c2, style: l2 };
}, getPresetC({ name: e2 = "", theme: t2 = {}, params: n2, set: r2, defaults: i2 }) {
  let { preset: a2, options: o2 } = t2, s2 = a2?.components?.[e2];
  return this.getPreset({ name: e2, preset: s2, options: o2, params: n2, set: r2, defaults: i2 });
}, getPresetD({ name: e2 = "", theme: t2 = {}, params: n2, set: r2, defaults: i2 }) {
  let a2 = e2.replace("-directive", ""), { preset: o2, options: s2 } = t2, c2 = o2?.components?.[a2] || o2?.directives?.[a2];
  return this.getPreset({ name: a2, preset: c2, options: s2, params: n2, set: r2, defaults: i2 });
}, applyDarkColorScheme(e2) {
  return e2.darkModeSelector !== "none" && e2.darkModeSelector !== !1;
}, getColorSchemeOption(e2, t2) {
  return this.applyDarkColorScheme(e2) ? this.regex.resolve(e2.darkModeSelector === !0 ? t2.options.darkModeSelector : e2.darkModeSelector ?? t2.options.darkModeSelector) : [];
}, getLayerOrder(e2, t2 = {}, n2, r2) {
  let { cssLayer: i2 } = t2;
  return i2 ? `@layer ${b(i2.order || i2.name || "primeui", n2)}` : "";
}, getCommonStyleSheet({ name: e2 = "", theme: t2 = {}, params: n2, props: r2 = {}, set: i2, defaults: a2 }) {
  let o2 = this.getCommon({ name: e2, theme: t2, params: n2, set: i2, defaults: a2 }), s2 = Object.entries(r2).reduce((e3, [t3, n3]) => e3.push(`${t3}="${n3}"`) && e3, []).join(" ");
  return Object.entries(o2 || {}).reduce((e3, [t3, n3]) => {
    if (h(n3) && Object.hasOwn(n3, "css")) {
      let r3 = j(n3.css), i3 = `${t3}-variables`;
      e3.push(`<style type="text/css" data-primevue-style-id="${i3}" ${s2}>${r3}</style>`);
    }
    return e3;
  }, []).join("");
}, getStyleSheet({ name: e2 = "", theme: t2 = {}, params: n2, props: r2 = {}, set: i2, defaults: a2 }) {
  let o2 = { name: e2, theme: t2, params: n2, set: i2, defaults: a2 }, s2 = (e2.includes("-directive") ? this.getPresetD(o2) : this.getPresetC(o2))?.css, c2 = Object.entries(r2).reduce((e3, [t3, n3]) => e3.push(`${t3}="${n3}"`) && e3, []).join(" ");
  return s2 ? `<style type="text/css" data-primevue-style-id="${e2}-variables" ${c2}>${j(s2)}</style>` : "";
}, createTokens(e2 = {}, t2, n2 = "", r2 = "", i2 = {}) {
  let a2 = function(e3, t3 = {}, n3 = []) {
    if (n3.includes(this.path)) return console.warn(`Circular reference detected at ${this.path}`), { colorScheme: e3, path: this.path, paths: t3, value: void 0 };
    n3.push(this.path), t3.name = this.path, t3.binding ||= {};
    let r3 = this.value;
    if (typeof this.value == "string" && K.test(this.value)) {
      let i3 = this.value.trim().replace(K, (r4) => {
        let i4 = r4.slice(1, -1), a3 = this.tokens[i4];
        if (!a3) return console.warn(`Token not found for path: ${i4}`), "__UNRESOLVED__";
        let o2 = a3.computed(e3, t3, n3);
        return Array.isArray(o2) && o2.length === 2 ? `light-dark(${o2[0].value},${o2[1].value})` : o2?.value ?? "__UNRESOLVED__";
      });
      r3 = ae.test(i3.replace(oe, "0")) ? `calc(${i3})` : i3;
    }
    return o(t3.binding) && delete t3.binding, n3.pop(), { colorScheme: e3, path: this.path, paths: t3, value: r3.includes("__UNRESOLVED__") ? void 0 : r3 };
  }, s2 = (e3, n3, r3) => {
    Object.entries(e3).forEach(([e4, o2]) => {
      let c2 = k(e4, t2.variable.excludedKeyRegex) ? n3 : n3 ? `${n3}.${se(e4)}` : se(e4), l2 = r3 ? `${r3}.${e4}` : e4;
      h(o2) ? s2(o2, c2, l2) : (i2[c2] || (i2[c2] = { paths: [], computed: (e5, t3 = {}, n4 = []) => {
        if (i2[c2].paths.length === 1) return i2[c2].paths[0].computed(i2[c2].paths[0].scheme, t3.binding, n4);
        if (e5 && e5 !== "none") for (let r4 = 0; r4 < i2[c2].paths.length; r4++) {
          let a3 = i2[c2].paths[r4];
          if (a3.scheme === e5) return a3.computed(e5, t3.binding, n4);
        }
        return i2[c2].paths.map((e6) => e6.computed(e6.scheme, t3[e6.scheme], n4));
      } }), i2[c2].paths.push({ path: l2, value: o2, scheme: l2.includes("colorScheme.light") ? "light" : l2.includes("colorScheme.dark") ? "dark" : "none", computed: a2, tokens: i2 }));
    });
  };
  return s2(e2, n2, r2), i2;
}, getTokenValue(e2, t2, n2) {
  let r2 = ((e3) => e3.split(".").filter((e4) => !k(e4.toLowerCase(), n2.variable.excludedKeyRegex)).join("."))(t2), i2 = t2.includes("colorScheme.light") ? "light" : t2.includes("colorScheme.dark") ? "dark" : void 0, a2 = [e2[r2]?.computed(i2)].flat().filter((e3) => e3);
  return a2.length === 1 ? a2[0].value : a2.reduce((e3 = {}, t3) => {
    let n3 = t3, { colorScheme: r3 } = n3;
    return e3[r3] = W(n3, ["colorScheme"]), e3;
  }, void 0);
}, getSelectorRule(e2, t2, n2, r2) {
  return n2 === "class" || n2 === "attr" ? J(d(t2) ? `${e2}${t2},${e2} ${t2}` : e2, r2) : J(e2, J(t2 ?? ":root,:host", r2));
}, transformCSS(e2, t2, n2, r2, i2 = {}, a2, o2, s2) {
  if (d(t2)) {
    let { cssLayer: c2 } = i2;
    if (r2 !== "style") {
      let e3 = this.getColorSchemeOption(i2, o2);
      t2 = n2 === "dark" ? e3.reduce((e4, { type: n3, selector: r3 }) => (d(r3) && (e4 += r3.includes("[CSS]") ? r3.replace("[CSS]", t2) : this.getSelectorRule(r3, s2, n3, t2)), e4), "") : J(s2 ?? ":root,:host", t2);
    }
    if (c2) {
      let n3 = { name: "primeui", order: "primeui" };
      h(c2) && (n3.name = b(c2.name, { name: e2, type: r2 })), d(n3.name) && (t2 = J(`@layer ${n3.name}`, t2), a2?.layerNames(n3.name));
    }
    return t2;
  }
  return "";
} };
var $ = { defaults: { variable: { prefix: "p", selector: ":root,:host", excludedKeyRegex: /^(primitive|semantic|components|directives|variables|colorscheme|light|dark|common|root|states|extend|css)$/gi }, options: { prefix: "p", darkModeSelector: "system", cssLayer: !1 } }, _theme: void 0, _layerNames: /* @__PURE__ */ new Set(), _loadedStyleNames: /* @__PURE__ */ new Set(), _loadingStyles: /* @__PURE__ */ new Set(), _tokens: {}, update(e2 = {}) {
  let { theme: t2 } = e2;
  t2 && (this._theme = U(H({}, t2), { options: H(H({}, this.defaults.options), t2.options) }), this._tokens = Q.createTokens(this.preset, this.defaults), this.clearLoadedStyleNames());
}, get theme() {
  return this._theme;
}, get preset() {
  return this.theme?.preset || {};
}, get options() {
  return this.theme?.options || {};
}, get tokens() {
  return this._tokens;
}, getTheme() {
  return this.theme;
}, setTheme(e2) {
  this.update({ theme: e2 }), G.emit("theme:change", e2);
}, getPreset() {
  return this.preset;
}, setPreset(e2) {
  this._theme = U(H({}, this.theme), { preset: e2 }), this._tokens = Q.createTokens(e2, this.defaults), this.clearLoadedStyleNames(), G.emit("preset:change", e2), G.emit("theme:change", this.theme);
}, getOptions() {
  return this.options;
}, setOptions(e2) {
  this._theme = U(H({}, this.theme), { options: e2 }), this.clearLoadedStyleNames(), G.emit("options:change", e2), G.emit("theme:change", this.theme);
}, getLayerNames() {
  return [...this._layerNames];
}, setLayerNames(e2) {
  this._layerNames.add(e2);
}, getLoadedStyleNames() {
  return this._loadedStyleNames;
}, isStyleNameLoaded(e2) {
  return this._loadedStyleNames.has(e2);
}, setLoadedStyleName(e2) {
  this._loadedStyleNames.add(e2);
}, deleteLoadedStyleName(e2) {
  this._loadedStyleNames.delete(e2);
}, clearLoadedStyleNames() {
  this._loadedStyleNames.clear();
}, getTokenValue(e2) {
  return Q.getTokenValue(this.tokens, e2, this.defaults);
}, getCommon(e2 = "", t2) {
  return Q.getCommon({ name: e2, theme: this.theme, params: t2, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } });
}, getComponent(e2 = "", t2) {
  let n2 = { name: e2, theme: this.theme, params: t2, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } };
  return Q.getPresetC(n2);
}, getDirective(e2 = "", t2) {
  let n2 = { name: e2, theme: this.theme, params: t2, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } };
  return Q.getPresetD(n2);
}, getCustomPreset(e2 = "", t2, n2, r2) {
  let i2 = { name: e2, preset: t2, options: this.options, selector: n2, params: r2, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } };
  return Q.getPreset(i2);
}, getLayerOrderCSS(e2 = "") {
  return Q.getLayerOrder(e2, this.options, { names: this.getLayerNames() }, this.defaults);
}, transformCSS(e2 = "", t2, n2 = "style", r2) {
  return Q.transformCSS(e2, t2, r2, n2, this.options, { layerNames: this.setLayerNames.bind(this) }, this.defaults);
}, getCommonStyleSheet(e2 = "", t2, n2 = {}) {
  return Q.getCommonStyleSheet({ name: e2, theme: this.theme, params: t2, props: n2, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } });
}, getStyleSheet(e2, t2, n2 = {}) {
  return Q.getStyleSheet({ name: e2, theme: this.theme, params: t2, props: n2, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } });
}, onStyleMounted(e2) {
  this._loadingStyles.add(e2);
}, onStyleUpdated(e2) {
  this._loadingStyles.add(e2);
}, onStyleLoaded(e2, { name: t2 }) {
  this._loadingStyles.size && (this._loadingStyles.delete(t2), G.emit(`theme:${t2}:load`, e2), !this._loadingStyles.size && G.emit("theme:load"));
} };
function _e(...e2) {
  let t2 = _($.getPreset(), ...e2);
  return $.setPreset(t2), t2;
}
export {f as A,S as C,o as D,p as E,d as M,b as O,F as S,h as T,O as _,he as a,x as b,L as c,C as d,A as f,M as g,T as h,_e as i,m as j,ee as k,P as l,y as m,G as n,ie as o,D as p,$ as r,me as s,X as t,w as u,N as v,v as w,u as x,j as y};