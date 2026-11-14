import {C as e,D as t,H as n,St as r,Tt as i,V as a,_t as o,c as s,d as c,i as l,jt as u,k as d,mt as f,pt as p,st as m,w as h,x as g,yt as _} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as v} from "./preload-helper-BLdHbfdN.js";
var y = typeof window < "u";
var b = (e2, t2 = !1) => t2 ? Symbol.for(e2) : Symbol(e2);
var ee = (e2, t2, n2) => x({ l: e2, k: t2, s: n2 });
var x = (e2) => JSON.stringify(e2).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029").replace(/\u0027/g, "\\u0027");
var S = (e2) => typeof e2 == "number" && isFinite(e2);
var C = (e2) => ie(e2) === "[object Date]";
var w = (e2) => ie(e2) === "[object RegExp]";
var T = (e2) => L(e2) && Object.keys(e2).length === 0;
var E = Object.assign;
var D = Object.create;
var O = (e2 = null) => D(e2);
var k;
var A = () => k ||= typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : O();
var te = Object.prototype.hasOwnProperty;
function j(e2, t2) {
  return te.call(e2, t2);
}
var M = Array.isArray;
var N = (e2) => typeof e2 == "function";
var P = (e2) => typeof e2 == "string";
var F = (e2) => typeof e2 == "boolean";
var I = (e2) => typeof e2 == "object" && !!e2;
var ne = (e2) => I(e2) && N(e2.then) && N(e2.catch);
var re = Object.prototype.toString;
var ie = (e2) => re.call(e2);
var L = (e2) => ie(e2) === "[object Object]";
var ae = (e2) => e2 == null ? "" : M(e2) || L(e2) && e2.toString === re ? JSON.stringify(e2, null, 2) : String(e2);
function oe(e2, t2 = "") {
  return e2.reduce((e3, n2, r2) => r2 === 0 ? e3 + n2 : e3 + t2 + n2, "");
}
function se(e2, t2) {
  typeof console < "u" && (console.warn("[intlify] " + e2), t2 && console.warn(t2.stack));
}
function ce(e2) {
  return e2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/\//g, "&#x2F;").replace(/=/g, "&#x3D;");
}
function le(e2) {
  return e2.replace(/&(?![a-z0-9#]{2,6};)/gi, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
var ue = /^javascript:/i;
var R = /^(?:href|src|action|formaction)$/i;
var de = /&#(?:x([0-9a-f]+)|(\d+));?/gi;
var fe = /&(?:Tab|NewLine);/g;
var pe = /&colon;?/gi;
var me = /[\u0000-\u0020\u007f-\u009f]/g;
var he = /(?:^|[\s"'<>/])on\w+\s*=\s*["']?[^"'>]+["']?/i;
var ge = /(^|[\s"'<>/])on(\w+\s*=)/gi;
var _e = /(^|[\s"'<>/])((?:href|src|action|formaction)\s*=\s*)([^\s"'=<>`]+)/gi;
function ve(e2, t2, n2) {
  let r2 = t2 || n2;
  if (!r2) return e2;
  let i2 = Number.parseInt(r2, t2 ? 16 : 10);
  return i2 <= 127 ? String.fromCharCode(i2) : e2;
}
function ye(e2) {
  let t2 = e2.replace(de, ve).replace(fe, "").replace(pe, ":").replace(me, "");
  return ue.test(t2);
}
function be(e2) {
  let t2 = /url\s*\(/gi, n2 = "", r2 = 0, i2;
  for (; (i2 = t2.exec(e2)) !== null; ) {
    let a2 = i2.index, o2 = t2.lastIndex - 1, s2 = o2 + 1, c2 = 1, l2 = null;
    for (; s2 < e2.length; s2++) {
      let t3 = e2[s2];
      if (l2) t3 === l2 && (l2 = null);
      else if (t3 === '"' || t3 === "'") l2 = t3;
      else if (t3 === "(") c2++;
      else if (t3 === ")" && (c2--, c2 === 0)) break;
    }
    if (c2 !== 0) break;
    let u2 = e2.slice(o2 + 1, s2).trim(), d2 = u2.startsWith('"') && u2.endsWith('"') || u2.startsWith("'") && u2.endsWith("'") ? u2.slice(1, -1).trim() : u2;
    n2 += e2.slice(r2, a2), n2 += ye(d2) ? "url(about:blank)" : e2.slice(a2, s2 + 1), r2 = s2 + 1;
  }
  return n2 + e2.slice(r2);
}
function xe(e2, t2) {
  return R.test(e2) && ye(t2) ? "about:blank" : le(e2.toLowerCase() === "style" ? be(t2) : t2);
}
function Se(e2) {
  return e2 = e2.replace(/([\w:-]+)\s*=\s*"([^"]*)"/g, (e3, t2, n2) => `${t2}="${xe(t2, n2)}"`), e2 = e2.replace(/([\w:-]+)\s*=\s*'([^']*)'/g, (e3, t2, n2) => `${t2}='${xe(t2, n2)}'`), he.test(e2) && (e2 = e2.replace(ge, "$1&#111;n$2")), e2 = e2.replace(_e, (e3, t2, n2, r2) => ye(r2) ? `${t2}${n2}about:blank` : e3), e2;
}
var Ce = (e2) => !I(e2) || M(e2);
function we(e2, t2) {
  if (Ce(e2) || Ce(t2)) throw Error("Invalid value");
  let n2 = [{ src: e2, des: t2 }];
  for (; n2.length; ) {
    let { src: e3, des: t3 } = n2.pop();
    Object.keys(e3).forEach((r2) => {
      if (r2 === "__proto__") return;
      let i2 = e3[r2];
      if (M(i2)) {
        let e4 = [];
        e4.length = i2.length, t3[r2] = e4, n2.push({ src: i2, des: e4 });
      } else I(i2) ? ((!I(t3[r2]) || M(t3[r2])) && (t3[r2] = O()), n2.push({ src: i2, des: t3[r2] })) : t3[r2] = i2;
    });
  }
}
function Te(e2, t2, n2) {
  return { line: e2, column: t2, offset: n2 };
}
function Ee(e2, t2, n2) {
  let r2 = { start: e2, end: t2 };
  return n2 != null && (r2.source = n2), r2;
}
var z = { EXPECTED_TOKEN: 1, INVALID_TOKEN_IN_PLACEHOLDER: 2, UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER: 3, UNKNOWN_ESCAPE_SEQUENCE: 4, INVALID_UNICODE_ESCAPE_SEQUENCE: 5, UNBALANCED_CLOSING_BRACE: 6, UNTERMINATED_CLOSING_BRACE: 7, EMPTY_PLACEHOLDER: 8, NOT_ALLOW_NEST_PLACEHOLDER: 9, INVALID_LINKED_FORMAT: 10, MUST_HAVE_MESSAGES_IN_PLURAL: 11, UNEXPECTED_EMPTY_LINKED_MODIFIER: 12, UNEXPECTED_EMPTY_LINKED_KEY: 13, UNEXPECTED_LEXICAL_ANALYSIS: 14, UNHANDLED_CODEGEN_NODE_TYPE: 15, UNHANDLED_MINIFIER_NODE_TYPE: 16 };
(z.EXPECTED_TOKEN);
(z.INVALID_TOKEN_IN_PLACEHOLDER);
(z.UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER);
(z.UNKNOWN_ESCAPE_SEQUENCE);
(z.INVALID_UNICODE_ESCAPE_SEQUENCE);
(z.UNBALANCED_CLOSING_BRACE);
(z.UNTERMINATED_CLOSING_BRACE);
(z.EMPTY_PLACEHOLDER);
(z.NOT_ALLOW_NEST_PLACEHOLDER);
(z.INVALID_LINKED_FORMAT);
(z.MUST_HAVE_MESSAGES_IN_PLURAL);
(z.UNEXPECTED_EMPTY_LINKED_MODIFIER);
(z.UNEXPECTED_EMPTY_LINKED_KEY);
(z.UNEXPECTED_LEXICAL_ANALYSIS);
(z.UNHANDLED_CODEGEN_NODE_TYPE);
(z.UNHANDLED_MINIFIER_NODE_TYPE);
function De(e2, t2, n2 = {}) {
  let { domain: r2, messages: i2, args: a2 } = n2, o2 = SyntaxError(String(e2));
  return o2.code = e2, t2 && (o2.location = t2), o2.domain = r2, o2;
}
function Oe(e2) {
  throw e2;
}
var B = " ";
var ke = "\r";
var V = `
`;
var Ae = "\u2028";
var H = "\u2029";
function je(e2) {
  let t2 = e2, n2 = 0, r2 = 1, i2 = 1, a2 = 0, o2 = (e3) => t2[e3] === ke && t2[e3 + 1] === V, s2 = (e3) => t2[e3] === V, c2 = (e3) => t2[e3] === H, l2 = (e3) => t2[e3] === Ae, u2 = (e3) => o2(e3) || s2(e3) || c2(e3) || l2(e3), d2 = () => n2, f2 = () => r2, p2 = () => i2, m2 = () => a2, h2 = (e3) => o2(e3) || c2(e3) || l2(e3) ? V : t2[e3], g2 = () => h2(n2), _2 = () => h2(n2 + a2);
  function v2() {
    return a2 = 0, u2(n2) && (r2++, i2 = 0), o2(n2) && n2++, n2++, i2++, t2[n2];
  }
  function y2() {
    return o2(n2 + a2) && a2++, a2++, t2[n2 + a2];
  }
  function b2() {
    n2 = 0, r2 = 1, i2 = 1, a2 = 0;
  }
  function ee2(e3 = 0) {
    a2 = e3;
  }
  function x2() {
    let e3 = n2 + a2;
    for (; e3 !== n2; ) v2();
    a2 = 0;
  }
  return { index: d2, line: f2, column: p2, peekOffset: m2, charAt: h2, currentChar: g2, currentPeek: _2, next: v2, peek: y2, reset: b2, resetPeek: ee2, skipToPeek: x2 };
}
var U = void 0;
var Me = "'";
var Ne = "tokenizer";
function Pe(e2, t2 = {}) {
  let n2 = t2.location !== !1, r2 = je(e2), i2 = () => r2.index(), a2 = () => Te(r2.line(), r2.column(), r2.index()), o2 = a2(), s2 = i2(), c2 = { currentType: 13, offset: s2, startLoc: o2, endLoc: o2, lastType: 13, lastOffset: s2, lastStartLoc: o2, lastEndLoc: o2, braceNest: 0, inLinked: !1, text: "" }, l2 = () => c2, { onError: u2 } = t2;
  function d2(e3, t3, r3, ...i3) {
    let a3 = l2();
    if (t3.column += r3, t3.offset += r3, u2) {
      let r4 = De(e3, n2 ? Ee(a3.startLoc, t3) : null, { domain: Ne, args: i3 });
      u2(r4);
    }
  }
  function f2(e3, t3, r3) {
    e3.endLoc = a2(), e3.currentType = t3;
    let i3 = { type: t3 };
    return n2 && (i3.loc = Ee(e3.startLoc, e3.endLoc)), r3 != null && (i3.value = r3), i3;
  }
  let p2 = (e3) => f2(e3, 13);
  function m2(e3, t3) {
    return e3.currentChar() === t3 ? (e3.next(), t3) : (d2(z.EXPECTED_TOKEN, a2(), 0, t3), "");
  }
  function h2(e3) {
    let t3 = "";
    for (; e3.currentPeek() === B || e3.currentPeek() === V; ) t3 += e3.currentPeek(), e3.peek();
    return t3;
  }
  function g2(e3) {
    let t3 = h2(e3);
    return e3.skipToPeek(), t3;
  }
  function _2(e3) {
    if (e3 === U) return !1;
    let t3 = e3.charCodeAt(0);
    return t3 >= 97 && t3 <= 122 || t3 >= 65 && t3 <= 90 || t3 === 95;
  }
  function v2(e3) {
    if (e3 === U) return !1;
    let t3 = e3.charCodeAt(0);
    return t3 >= 48 && t3 <= 57;
  }
  function y2(e3, t3) {
    let { currentType: n3 } = t3;
    if (n3 !== 2) return !1;
    h2(e3);
    let r3 = _2(e3.currentPeek());
    return e3.resetPeek(), r3;
  }
  function b2(e3, t3) {
    let { currentType: n3 } = t3;
    if (n3 !== 2) return !1;
    h2(e3);
    let r3 = v2(e3.currentPeek() === "-" ? e3.peek() : e3.currentPeek());
    return e3.resetPeek(), r3;
  }
  function ee2(e3, t3) {
    let { currentType: n3 } = t3;
    if (n3 !== 2) return !1;
    h2(e3);
    let r3 = e3.currentPeek() === Me;
    return e3.resetPeek(), r3;
  }
  function x2(e3, t3) {
    let { currentType: n3 } = t3;
    if (n3 !== 7) return !1;
    h2(e3);
    let r3 = e3.currentPeek() === ".";
    return e3.resetPeek(), r3;
  }
  function S2(e3, t3) {
    let { currentType: n3 } = t3;
    if (n3 !== 8) return !1;
    h2(e3);
    let r3 = _2(e3.currentPeek());
    return e3.resetPeek(), r3;
  }
  function C2(e3, t3) {
    let { currentType: n3 } = t3;
    if (n3 !== 7 && n3 !== 11) return !1;
    h2(e3);
    let r3 = e3.currentPeek() === ":";
    return e3.resetPeek(), r3;
  }
  function w2(e3, t3) {
    let { currentType: n3 } = t3;
    if (n3 !== 9) return !1;
    let r3 = () => {
      let t4 = e3.currentPeek();
      return t4 === "{" ? _2(e3.peek()) : t4 === "@" || t4 === "|" || t4 === ":" || t4 === "." || t4 === B || !t4 ? !1 : t4 === V ? (e3.peek(), r3()) : E2(e3, !1);
    }, i3 = r3();
    return e3.resetPeek(), i3;
  }
  function T2(e3) {
    h2(e3);
    let t3 = e3.currentPeek() === "|";
    return e3.resetPeek(), t3;
  }
  function E2(e3, t3 = !0) {
    let n3 = (t4 = !1, r4 = "") => {
      let i3 = e3.currentPeek();
      return i3 === "{" || i3 === "@" || !i3 ? t4 : i3 === "|" ? r4 !== B && r4 !== V : i3 === B ? (e3.peek(), n3(!0, B)) : i3 !== V || (e3.peek(), n3(!0, V));
    }, r3 = n3();
    return t3 && e3.resetPeek(), r3;
  }
  function D2(e3, t3) {
    let n3 = e3.currentChar();
    if (n3 !== U) return t3(n3) ? (e3.next(), n3) : null;
  }
  function O2(e3) {
    let t3 = e3.charCodeAt(0);
    return t3 >= 97 && t3 <= 122 || t3 >= 65 && t3 <= 90 || t3 >= 48 && t3 <= 57 || t3 === 95 || t3 === 36;
  }
  function k2(e3) {
    return D2(e3, O2);
  }
  function A2(e3) {
    let t3 = e3.charCodeAt(0);
    return t3 >= 97 && t3 <= 122 || t3 >= 65 && t3 <= 90 || t3 >= 48 && t3 <= 57 || t3 === 95 || t3 === 36 || t3 === 45;
  }
  function te2(e3) {
    return D2(e3, A2);
  }
  function j2(e3) {
    let t3 = e3.charCodeAt(0);
    return t3 >= 48 && t3 <= 57;
  }
  function M2(e3) {
    return D2(e3, j2);
  }
  function N2(e3) {
    let t3 = e3.charCodeAt(0);
    return t3 >= 48 && t3 <= 57 || t3 >= 65 && t3 <= 70 || t3 >= 97 && t3 <= 102;
  }
  function P2(e3) {
    return D2(e3, N2);
  }
  function F2(e3) {
    let t3 = "", n3 = "";
    for (; t3 = M2(e3); ) n3 += t3;
    return n3;
  }
  function I2(e3) {
    let t3 = "";
    for (; ; ) {
      let n3 = e3.currentChar();
      if (n3 === "\\") {
        let r3 = e3.peek();
        r3 === "{" || r3 === "}" || r3 === "@" || r3 === "|" || r3 === "\\" ? (t3 += n3 + r3, e3.next(), e3.next()) : (e3.resetPeek(), t3 += n3, e3.next());
      } else {
        if (n3 === "{" || n3 === "}" || n3 === "@" || n3 === "|" || !n3) break;
        if (n3 === B || n3 === V)
          if (E2(e3)) t3 += n3, e3.next();
          else {
            if (T2(e3)) break;
            t3 += n3, e3.next();
          }
        else t3 += n3, e3.next();
      }
    }
    return t3;
  }
  function ne2(e3) {
    g2(e3);
    let t3 = "", n3 = "";
    for (; t3 = te2(e3); ) n3 += t3;
    let r3 = e3.currentChar();
    if (r3 && r3 !== "}" && r3 !== U && r3 !== B && r3 !== V && r3 !== "\u3000") {
      let t4 = ce2(e3);
      return d2(z.INVALID_TOKEN_IN_PLACEHOLDER, a2(), 0, n3 + t4), n3 + t4;
    }
    return e3.currentChar() === U && d2(z.UNTERMINATED_CLOSING_BRACE, a2(), 0), n3;
  }
  function re2(e3) {
    g2(e3);
    let t3 = "";
    return e3.currentChar() === "-" ? (e3.next(), t3 += `-${F2(e3)}`) : t3 += F2(e3), e3.currentChar() === U && d2(z.UNTERMINATED_CLOSING_BRACE, a2(), 0), t3;
  }
  function ie2(e3) {
    return e3 !== Me && e3 !== V;
  }
  function L2(e3) {
    g2(e3), m2(e3, "'");
    let t3 = "", n3 = "";
    for (; t3 = D2(e3, ie2); ) n3 += t3 === "\\" ? ae2(e3) : t3;
    let r3 = e3.currentChar();
    return r3 === V || r3 === U ? (d2(z.UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER, a2(), 0), r3 === V && (e3.next(), m2(e3, "'")), n3) : (m2(e3, "'"), n3);
  }
  function ae2(e3) {
    let t3 = e3.currentChar();
    switch (t3) {
      case "\\":
      case "'":
        return e3.next(), `\\${t3}`;
      case "u":
        return oe2(e3, t3, 4);
      case "U":
        return oe2(e3, t3, 6);
      default:
        return d2(z.UNKNOWN_ESCAPE_SEQUENCE, a2(), 0, t3), "";
    }
  }
  function oe2(e3, t3, n3) {
    m2(e3, t3);
    let r3 = "";
    for (let i3 = 0; i3 < n3; i3++) {
      let n4 = P2(e3);
      if (!n4) {
        d2(z.INVALID_UNICODE_ESCAPE_SEQUENCE, a2(), 0, `\\${t3}${r3}${e3.currentChar()}`);
        break;
      }
      r3 += n4;
    }
    return `\\${t3}${r3}`;
  }
  function se2(e3) {
    return e3 !== "{" && e3 !== "}" && e3 !== B && e3 !== V;
  }
  function ce2(e3) {
    g2(e3);
    let t3 = "", n3 = "";
    for (; t3 = D2(e3, se2); ) n3 += t3;
    return n3;
  }
  function le2(e3) {
    let t3 = "", n3 = "";
    for (; t3 = k2(e3); ) n3 += t3;
    return n3;
  }
  function ue2(e3) {
    let t3 = (n3) => {
      let r3 = e3.currentChar();
      return r3 === "{" || r3 === "@" || r3 === "|" || r3 === "(" || r3 === ")" || !r3 || r3 === B ? n3 : (n3 += r3, e3.next(), t3(n3));
    };
    return t3("");
  }
  function R2(e3) {
    g2(e3);
    let t3 = m2(e3, "|");
    return g2(e3), t3;
  }
  function de2(e3, t3) {
    let n3 = null;
    switch (e3.currentChar()) {
      case "{":
        return t3.braceNest >= 1 && d2(z.NOT_ALLOW_NEST_PLACEHOLDER, a2(), 0), e3.next(), n3 = f2(t3, 2, "{"), g2(e3), t3.braceNest++, n3;
      case "}":
        return t3.braceNest > 0 && t3.currentType === 2 && d2(z.EMPTY_PLACEHOLDER, a2(), 0), e3.next(), n3 = f2(t3, 3, "}"), t3.braceNest--, t3.braceNest > 0 && g2(e3), t3.inLinked && t3.braceNest === 0 && (t3.inLinked = !1), n3;
      case "@":
        return t3.braceNest > 0 && d2(z.UNTERMINATED_CLOSING_BRACE, a2(), 0), n3 = fe2(e3, t3) || p2(t3), t3.braceNest = 0, n3;
      default: {
        let r3 = !0, i3 = !0, o3 = !0;
        if (T2(e3)) return t3.braceNest > 0 && d2(z.UNTERMINATED_CLOSING_BRACE, a2(), 0), n3 = f2(t3, 1, R2(e3)), t3.braceNest = 0, t3.inLinked = !1, n3;
        if (t3.braceNest > 0 && (t3.currentType === 4 || t3.currentType === 5 || t3.currentType === 6)) return d2(z.UNTERMINATED_CLOSING_BRACE, a2(), 0), t3.braceNest = 0, pe2(e3, t3);
        if (r3 = y2(e3, t3)) return n3 = f2(t3, 4, ne2(e3)), g2(e3), n3;
        if (i3 = b2(e3, t3)) return n3 = f2(t3, 5, re2(e3)), g2(e3), n3;
        if (o3 = ee2(e3, t3)) return n3 = f2(t3, 6, L2(e3)), g2(e3), n3;
        if (!r3 && !i3 && !o3) return n3 = f2(t3, 12, ce2(e3)), d2(z.INVALID_TOKEN_IN_PLACEHOLDER, a2(), 0, n3.value), g2(e3), n3;
        break;
      }
    }
    return n3;
  }
  function fe2(e3, t3) {
    let { currentType: n3 } = t3, r3 = null, i3 = e3.currentChar();
    switch (n3 !== 7 && n3 !== 8 && n3 !== 11 && n3 !== 9 || i3 !== V && i3 !== B || d2(z.INVALID_LINKED_FORMAT, a2(), 0), i3) {
      case "@":
        return e3.next(), r3 = f2(t3, 7, "@"), t3.inLinked = !0, r3;
      case ".":
        return g2(e3), e3.next(), f2(t3, 8, ".");
      case ":":
        return g2(e3), e3.next(), f2(t3, 9, ":");
      default:
        return T2(e3) ? (r3 = f2(t3, 1, R2(e3)), t3.braceNest = 0, t3.inLinked = !1, r3) : x2(e3, t3) || C2(e3, t3) ? (g2(e3), fe2(e3, t3)) : S2(e3, t3) ? (g2(e3), f2(t3, 11, le2(e3))) : w2(e3, t3) ? (g2(e3), i3 === "{" ? de2(e3, t3) || r3 : f2(t3, 10, ue2(e3))) : (n3 === 7 && d2(z.INVALID_LINKED_FORMAT, a2(), 0), t3.braceNest = 0, t3.inLinked = !1, pe2(e3, t3));
    }
  }
  function pe2(e3, t3) {
    let n3 = { type: 13 };
    if (t3.braceNest > 0) return de2(e3, t3) || p2(t3);
    if (t3.inLinked) return fe2(e3, t3) || p2(t3);
    switch (e3.currentChar()) {
      case "{":
        return de2(e3, t3) || p2(t3);
      case "}":
        return d2(z.UNBALANCED_CLOSING_BRACE, a2(), 0), e3.next(), f2(t3, 3, "}");
      case "@":
        return fe2(e3, t3) || p2(t3);
      default:
        if (T2(e3)) return n3 = f2(t3, 1, R2(e3)), t3.braceNest = 0, t3.inLinked = !1, n3;
        if (E2(e3)) return f2(t3, 0, I2(e3));
    }
    return n3;
  }
  function me2() {
    let { currentType: e3, offset: t3, startLoc: n3, endLoc: o3 } = c2;
    return c2.lastType = e3, c2.lastOffset = t3, c2.lastStartLoc = n3, c2.lastEndLoc = o3, c2.offset = i2(), c2.startLoc = a2(), r2.currentChar() === U ? f2(c2, 13) : pe2(r2, c2);
  }
  return { nextToken: me2, currentOffset: i2, currentPosition: a2, context: l2 };
}
var Fe = "parser";
var Ie = /(?:\\\\|\\'|\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{6}))/g;
var Le = /\\([\\@{}|])/g;
function Re(e2, t2) {
  return t2;
}
function ze(e2, t2, n2) {
  switch (e2) {
    case "\\\\":
      return "\\";
    case "\\'":
      return "'";
    default: {
      let e3 = parseInt(t2 || n2, 16);
      return e3 <= 55295 || e3 >= 57344 ? String.fromCodePoint(e3) : "\uFFFD";
    }
  }
}
function Be(e2 = {}) {
  let t2 = e2.location !== !1, { onError: n2 } = e2;
  function r2(e3, r3, i3, a3, ...o3) {
    let s3 = e3.currentPosition();
    if (s3.offset += a3, s3.column += a3, n2) {
      let e4 = De(r3, t2 ? Ee(i3, s3) : null, { domain: Fe, args: o3 });
      n2(e4);
    }
  }
  function i2(e3, n3, r3) {
    let i3 = { type: e3 };
    return t2 && (i3.start = n3, i3.end = n3, i3.loc = { start: r3, end: r3 }), i3;
  }
  function a2(e3, n3, r3, i3) {
    t2 && (e3.end = n3, e3.loc && (e3.loc.end = r3));
  }
  function o2(e3, t3) {
    let n3 = e3.context(), r3 = i2(3, n3.offset, n3.startLoc);
    return r3.value = t3.replace(Le, Re), a2(r3, e3.currentOffset(), e3.currentPosition()), r3;
  }
  function s2(e3, t3) {
    let { lastOffset: n3, lastStartLoc: r3 } = e3.context(), o3 = i2(5, n3, r3);
    return o3.index = parseInt(t3, 10), e3.nextToken(), a2(o3, e3.currentOffset(), e3.currentPosition()), o3;
  }
  function c2(e3, t3) {
    let { lastOffset: n3, lastStartLoc: r3 } = e3.context(), o3 = i2(4, n3, r3);
    return o3.key = t3, e3.nextToken(), a2(o3, e3.currentOffset(), e3.currentPosition()), o3;
  }
  function l2(e3, t3) {
    let { lastOffset: n3, lastStartLoc: r3 } = e3.context(), o3 = i2(9, n3, r3);
    return o3.value = t3.replace(Ie, ze), e3.nextToken(), a2(o3, e3.currentOffset(), e3.currentPosition()), o3;
  }
  function u2(e3) {
    let t3 = e3.nextToken(), n3 = e3.context(), { lastOffset: o3, lastStartLoc: s3 } = n3, c3 = i2(8, o3, s3);
    return t3.type === 11 ? (t3.value ?? r2(e3, z.UNEXPECTED_LEXICAL_ANALYSIS, n3.lastStartLoc, 0, W(t3)), c3.value = t3.value || "", a2(c3, e3.currentOffset(), e3.currentPosition()), { node: c3 }) : (r2(e3, z.UNEXPECTED_EMPTY_LINKED_MODIFIER, n3.lastStartLoc, 0), c3.value = "", a2(c3, o3, s3), { nextConsumeToken: t3, node: c3 });
  }
  function d2(e3, t3) {
    let n3 = e3.context(), r3 = i2(7, n3.offset, n3.startLoc);
    return r3.value = t3, a2(r3, e3.currentOffset(), e3.currentPosition()), r3;
  }
  function f2(e3) {
    let t3 = e3.context(), n3 = i2(6, t3.offset, t3.startLoc), o3 = e3.nextToken();
    if (o3.type === 8) {
      let t4 = u2(e3);
      n3.modifier = t4.node, o3 = t4.nextConsumeToken || e3.nextToken();
    }
    switch (o3.type !== 9 && r2(e3, z.UNEXPECTED_LEXICAL_ANALYSIS, t3.lastStartLoc, 0, W(o3)), o3 = e3.nextToken(), o3.type === 2 && (o3 = e3.nextToken()), o3.type) {
      case 10:
        o3.value ?? r2(e3, z.UNEXPECTED_LEXICAL_ANALYSIS, t3.lastStartLoc, 0, W(o3)), n3.key = d2(e3, o3.value || "");
        break;
      case 4:
        o3.value ?? r2(e3, z.UNEXPECTED_LEXICAL_ANALYSIS, t3.lastStartLoc, 0, W(o3)), n3.key = c2(e3, o3.value || "");
        break;
      case 5:
        o3.value ?? r2(e3, z.UNEXPECTED_LEXICAL_ANALYSIS, t3.lastStartLoc, 0, W(o3)), n3.key = s2(e3, o3.value || "");
        break;
      case 6:
        o3.value ?? r2(e3, z.UNEXPECTED_LEXICAL_ANALYSIS, t3.lastStartLoc, 0, W(o3)), n3.key = l2(e3, o3.value || "");
        break;
      default: {
        r2(e3, z.UNEXPECTED_EMPTY_LINKED_KEY, t3.lastStartLoc, 0);
        let s3 = e3.context(), c3 = i2(7, s3.offset, s3.startLoc);
        return c3.value = "", a2(c3, s3.offset, s3.startLoc), n3.key = c3, a2(n3, s3.offset, s3.startLoc), { nextConsumeToken: o3, node: n3 };
      }
    }
    return a2(n3, e3.currentOffset(), e3.currentPosition()), { node: n3 };
  }
  function p2(e3) {
    let t3 = e3.context(), n3 = i2(2, t3.currentType === 1 ? e3.currentOffset() : t3.offset, t3.currentType === 1 ? t3.endLoc : t3.startLoc);
    n3.items = [];
    let u3 = null;
    do {
      let i3 = u3 || e3.nextToken();
      switch (u3 = null, i3.type) {
        case 0:
          i3.value ?? r2(e3, z.UNEXPECTED_LEXICAL_ANALYSIS, t3.lastStartLoc, 0, W(i3)), n3.items.push(o2(e3, i3.value || ""));
          break;
        case 5:
          i3.value ?? r2(e3, z.UNEXPECTED_LEXICAL_ANALYSIS, t3.lastStartLoc, 0, W(i3)), n3.items.push(s2(e3, i3.value || ""));
          break;
        case 4:
          i3.value ?? r2(e3, z.UNEXPECTED_LEXICAL_ANALYSIS, t3.lastStartLoc, 0, W(i3)), n3.items.push(c2(e3, i3.value || ""));
          break;
        case 6:
          i3.value ?? r2(e3, z.UNEXPECTED_LEXICAL_ANALYSIS, t3.lastStartLoc, 0, W(i3)), n3.items.push(l2(e3, i3.value || ""));
          break;
        case 7: {
          let t4 = f2(e3);
          n3.items.push(t4.node), u3 = t4.nextConsumeToken || null;
          break;
        }
      }
    } while (t3.currentType !== 13 && t3.currentType !== 1);
    return a2(n3, t3.currentType === 1 ? t3.lastOffset : e3.currentOffset(), t3.currentType === 1 ? t3.lastEndLoc : e3.currentPosition()), n3;
  }
  function m2(e3, t3, n3, o3) {
    let s3 = e3.context(), c3 = o3.items.length === 0, l3 = i2(1, t3, n3);
    l3.cases = [], l3.cases.push(o3);
    do {
      let t4 = p2(e3);
      c3 ||= t4.items.length === 0, l3.cases.push(t4);
    } while (s3.currentType !== 13);
    return c3 && r2(e3, z.MUST_HAVE_MESSAGES_IN_PLURAL, n3, 0), a2(l3, e3.currentOffset(), e3.currentPosition()), l3;
  }
  function h2(e3) {
    let t3 = e3.context(), { offset: n3, startLoc: r3 } = t3, i3 = p2(e3);
    return t3.currentType === 13 ? i3 : m2(e3, n3, r3, i3);
  }
  function g2(n3) {
    let o3 = Pe(n3, E({}, e2)), s3 = o3.context(), c3 = i2(0, s3.offset, s3.startLoc);
    return t2 && c3.loc && (c3.loc.source = n3), c3.body = h2(o3), e2.onCacheKey && (c3.cacheKey = e2.onCacheKey(n3)), s3.currentType !== 13 && r2(o3, z.UNEXPECTED_LEXICAL_ANALYSIS, s3.lastStartLoc, 0, n3[s3.offset] || ""), a2(c3, o3.currentOffset(), o3.currentPosition()), c3;
  }
  return { parse: g2 };
}
function W(e2) {
  if (e2.type === 13) return "EOF";
  let t2 = (e2.value || "").replace(/\r?\n/gu, "\\n");
  return t2.length > 10 ? t2.slice(0, 9) + "\u2026" : t2;
}
function Ve(e2, t2 = {}) {
  let n2 = { ast: e2, helpers: /* @__PURE__ */ new Set() };
  return { context: () => n2, helper: (e3) => (n2.helpers.add(e3), e3) };
}
function He(e2, t2) {
  for (let n2 = 0; n2 < e2.length; n2++) Ue(e2[n2], t2);
}
function Ue(e2, t2) {
  switch (e2.type) {
    case 1:
      He(e2.cases, t2), t2.helper("plural");
      break;
    case 2:
      He(e2.items, t2);
      break;
    case 6:
      Ue(e2.key, t2), t2.helper("linked"), t2.helper("type");
      break;
    case 5:
      t2.helper("interpolate"), t2.helper("list");
      break;
    case 4:
      t2.helper("interpolate"), t2.helper("named");
  }
}
function We(e2, t2 = {}) {
  let n2 = Ve(e2);
  n2.helper("normalize"), e2.body && Ue(e2.body, n2);
  let r2 = n2.context();
  e2.helpers = Array.from(r2.helpers);
}
function Ge(e2) {
  let t2 = e2.body;
  return t2.type === 2 ? Ke(t2) : t2.cases.forEach((e3) => Ke(e3)), e2;
}
function Ke(e2) {
  if (e2.items.length === 1) {
    let t2 = e2.items[0];
    (t2.type === 3 || t2.type === 9) && (e2.static = t2.value, delete t2.value);
  } else {
    let t2 = [];
    for (let n2 = 0; n2 < e2.items.length; n2++) {
      let r2 = e2.items[n2];
      if (r2.type !== 3 && r2.type !== 9 || r2.value == null) break;
      t2.push(r2.value);
    }
    if (t2.length === e2.items.length) {
      e2.static = oe(t2);
      for (let t3 = 0; t3 < e2.items.length; t3++) {
        let n2 = e2.items[t3];
        (n2.type === 3 || n2.type === 9) && delete n2.value;
      }
    }
  }
}
function qe(e2) {
  switch (e2.t = e2.type, e2.type) {
    case 0: {
      let t2 = e2;
      qe(t2.body), t2.b = t2.body, delete t2.body;
      break;
    }
    case 1: {
      let t2 = e2, n2 = t2.cases;
      for (let e3 = 0; e3 < n2.length; e3++) qe(n2[e3]);
      t2.c = n2, delete t2.cases;
      break;
    }
    case 2: {
      let t2 = e2, n2 = t2.items;
      for (let e3 = 0; e3 < n2.length; e3++) qe(n2[e3]);
      t2.i = n2, delete t2.items, t2.static && (t2.s = t2.static, delete t2.static);
      break;
    }
    case 3:
    case 9:
    case 8:
    case 7: {
      let t2 = e2;
      t2.value && (t2.v = t2.value, delete t2.value);
      break;
    }
    case 6: {
      let t2 = e2;
      qe(t2.key), t2.k = t2.key, delete t2.key, t2.modifier && (qe(t2.modifier), t2.m = t2.modifier, delete t2.modifier);
      break;
    }
    case 5: {
      let t2 = e2;
      t2.i = t2.index, delete t2.index;
      break;
    }
    case 4: {
      let t2 = e2;
      t2.k = t2.key, delete t2.key;
      break;
    }
  }
  delete e2.type;
}
function Je(e2, t2) {
  let { filename: n2, breakLineCode: r2, needIndent: i2 } = t2, a2 = t2.location !== !1, o2 = { filename: n2, code: "", column: 1, line: 1, offset: 0, map: void 0, breakLineCode: r2, needIndent: i2, indentLevel: 0 };
  a2 && e2.loc && (o2.source = e2.loc.source);
  let s2 = () => o2;
  function c2(e3, t3) {
    o2.code += e3;
  }
  function l2(e3, t3 = !0) {
    let n3 = t3 ? r2 : "";
    c2(i2 ? n3 + "  ".repeat(e3) : n3);
  }
  function u2(e3 = !0) {
    let t3 = ++o2.indentLevel;
    e3 && l2(t3);
  }
  function d2(e3 = !0) {
    let t3 = --o2.indentLevel;
    e3 && l2(t3);
  }
  function f2() {
    l2(o2.indentLevel);
  }
  return { context: s2, push: c2, indent: u2, deindent: d2, newline: f2, helper: (e3) => `_${e3}`, needIndent: () => o2.needIndent };
}
function Ye(e2, t2) {
  let { helper: n2 } = e2;
  e2.push(`${n2("linked")}(`), $e(e2, t2.key), t2.modifier ? (e2.push(", "), $e(e2, t2.modifier), e2.push(", _type")) : e2.push(", undefined, _type"), e2.push(")");
}
function Xe(e2, t2) {
  let { helper: n2, needIndent: r2 } = e2;
  e2.push(`${n2("normalize")}([`), e2.indent(r2());
  let i2 = t2.items.length;
  for (let n3 = 0; n3 < i2 && ($e(e2, t2.items[n3]), n3 !== i2 - 1); n3++) e2.push(", ");
  e2.deindent(r2()), e2.push("])");
}
function Ze(e2, t2) {
  let { helper: n2, needIndent: r2 } = e2;
  if (t2.cases.length > 1) {
    e2.push(`${n2("plural")}([`), e2.indent(r2());
    let i2 = t2.cases.length;
    for (let n3 = 0; n3 < i2 && ($e(e2, t2.cases[n3]), n3 !== i2 - 1); n3++) e2.push(", ");
    e2.deindent(r2()), e2.push("])");
  }
}
function Qe(e2, t2) {
  t2.body ? $e(e2, t2.body) : e2.push("null");
}
function $e(e2, t2) {
  let { helper: n2 } = e2;
  switch (t2.type) {
    case 0:
      Qe(e2, t2);
      break;
    case 1:
      Ze(e2, t2);
      break;
    case 2:
      Xe(e2, t2);
      break;
    case 6:
      Ye(e2, t2);
      break;
    case 8:
      e2.push(JSON.stringify(t2.value), t2);
      break;
    case 7:
      e2.push(JSON.stringify(t2.value), t2);
      break;
    case 5:
      e2.push(`${n2("interpolate")}(${n2("list")}(${t2.index}))`, t2);
      break;
    case 4:
      e2.push(`${n2("interpolate")}(${n2("named")}(${JSON.stringify(t2.key)}))`, t2);
      break;
    case 9:
      e2.push(JSON.stringify(t2.value), t2);
      break;
    case 3:
      e2.push(JSON.stringify(t2.value), t2);
  }
}
var et = (e2, t2 = {}) => {
  let n2 = P(t2.mode) ? t2.mode : "normal", r2 = P(t2.filename) ? t2.filename : "message.intl";
  t2.sourceMap;
  let i2 = t2.breakLineCode == null ? n2 === "arrow" ? ";" : `
` : t2.breakLineCode, a2 = t2.needIndent ? t2.needIndent : n2 !== "arrow", o2 = e2.helpers || [], s2 = Je(e2, { filename: r2, breakLineCode: i2, needIndent: a2 });
  s2.push(n2 === "normal" ? "function __msg__ (ctx) {" : "(ctx) => {"), s2.indent(a2), o2.length > 0 && (s2.push(`const { ${oe(o2.map((e3) => `${e3}: _${e3}`), ", ")} } = ctx`), s2.newline()), s2.push("return "), $e(s2, e2), s2.deindent(a2), s2.push("}"), delete e2.helpers;
  let { code: c2, map: l2 } = s2.context();
  return { ast: e2, code: c2, map: l2 ? l2.toJSON() : void 0 };
};
function tt(e2, t2 = {}) {
  let n2 = E({}, t2), r2 = !!n2.jit, i2 = !!n2.minify, a2 = n2.optimize == null || n2.optimize, o2 = Be(n2).parse(e2);
  return r2 ? (a2 && Ge(o2), i2 && qe(o2), { ast: o2, code: "" }) : (We(o2, n2), et(o2, n2));
}
function nt() {
  typeof __INTLIFY_PROD_DEVTOOLS__ != "boolean" && (A().__INTLIFY_PROD_DEVTOOLS__ = !1), typeof __INTLIFY_DROP_MESSAGE_COMPILER__ != "boolean" && (A().__INTLIFY_DROP_MESSAGE_COMPILER__ = !1);
}
function G(e2) {
  return I(e2) && ft(e2) === 0 && (j(e2, "b") || j(e2, "body"));
}
var rt = ["b", "body"];
function it(e2) {
  return K(e2, rt);
}
var at = ["c", "cases"];
function ot(e2) {
  return K(e2, at, []);
}
var st = ["s", "static"];
function ct(e2) {
  return K(e2, st);
}
var lt = ["i", "items"];
function ut(e2) {
  return K(e2, lt, []);
}
var dt = ["t", "type"];
function ft(e2) {
  return K(e2, dt);
}
var pt = ["v", "value"];
function mt(e2, t2) {
  let n2 = K(e2, pt);
  if (n2 != null) return n2;
  throw bt(t2);
}
var ht = ["m", "modifier"];
function gt(e2) {
  return K(e2, ht);
}
var _t = ["k", "key"];
function vt(e2) {
  let t2 = K(e2, _t);
  if (t2) return t2;
  throw bt(6);
}
function K(e2, t2, n2) {
  for (let n3 = 0; n3 < t2.length; n3++) {
    let r2 = t2[n3];
    if (j(e2, r2) && e2[r2] != null) return e2[r2];
  }
  return n2;
}
var yt = [...rt, ...at, ...st, ...lt, ..._t, ...ht, ...pt, ...dt];
function bt(e2) {
  return Error(`unhandled node type: ${e2}`);
}
function xt(e2) {
  return (t2) => St(t2, e2);
}
function St(e2, t2) {
  let n2 = it(t2);
  if (n2 == null) throw bt(0);
  if (ft(n2) === 1) {
    let t3 = ot(n2);
    return e2.plural(t3.reduce((t4, n3) => [...t4, Ct(e2, n3)], []));
  }
  return Ct(e2, n2);
}
function Ct(e2, t2) {
  let n2 = ct(t2);
  if (n2 != null) return e2.type === "text" ? n2 : e2.normalize([n2]);
  {
    let n3 = ut(t2).reduce((t3, n4) => [...t3, wt(e2, n4)], []);
    return e2.normalize(n3);
  }
}
function wt(e2, t2) {
  let n2 = ft(t2);
  switch (n2) {
    case 3:
      return mt(t2, n2);
    case 9:
      return mt(t2, n2);
    case 4: {
      let r2 = t2;
      if (j(r2, "k") && r2.k) return e2.interpolate(e2.named(r2.k));
      if (j(r2, "key") && r2.key) return e2.interpolate(e2.named(r2.key));
      throw bt(n2);
    }
    case 5: {
      let r2 = t2;
      if (j(r2, "i") && S(r2.i)) return e2.interpolate(e2.list(r2.i));
      if (j(r2, "index") && S(r2.index)) return e2.interpolate(e2.list(r2.index));
      throw bt(n2);
    }
    case 6: {
      let n3 = t2, r2 = gt(n3), i2 = vt(n3);
      return e2.linked(wt(e2, i2), r2 ? wt(e2, r2) : void 0, e2.type);
    }
    case 7:
      return mt(t2, n2);
    case 8:
      return mt(t2, n2);
    default:
      throw Error(`unhandled node on format message part: ${n2}`);
  }
}
var Tt = (e2) => e2;
var Et = O();
function Dt(e2, t2 = {}) {
  let n2 = !1, r2 = t2.onError || Oe;
  return t2.onError = (e3) => {
    n2 = !0, r2(e3);
  }, { ...tt(e2, t2), detectError: n2 };
}
function Ot(e2, t2) {
  if (!__INTLIFY_DROP_MESSAGE_COMPILER__ && P(e2)) {
    F(t2.warnHtmlMessage) && t2.warnHtmlMessage;
    let n2 = (t2.onCacheKey || Tt)(e2), r2 = Et[n2];
    if (r2) return r2;
    let { ast: i2, detectError: a2 } = Dt(e2, { ...t2, location: !1, jit: !0 }), o2 = xt(i2);
    return a2 ? o2 : Et[n2] = o2;
  }
  {
    let t3 = e2.cacheKey;
    return t3 ? Et[t3] || (Et[t3] = xt(e2)) : xt(e2);
  }
}
var kt = null;
function At(e2) {
  kt = e2;
}
function jt(e2, t2, n2) {
  kt && kt.emit("i18n:init", { timestamp: Date.now(), i18n: e2, version: t2, meta: n2 });
}
var Mt = Nt("function:translate");
function Nt(e2) {
  return (t2) => kt && kt.emit(e2, t2);
}
var q = { INVALID_ARGUMENT: 17, INVALID_DATE_ARGUMENT: 18, INVALID_ISO_DATE_ARGUMENT: 19, NOT_SUPPORT_NON_STRING_MESSAGE: 20, NOT_SUPPORT_LOCALE_PROMISE_VALUE: 21, NOT_SUPPORT_LOCALE_ASYNC_FUNCTION: 22, NOT_SUPPORT_LOCALE_TYPE: 23 };
function J(e2) {
  return De(e2, null, void 0);
}
(q.INVALID_ARGUMENT);
(q.INVALID_DATE_ARGUMENT);
(q.INVALID_ISO_DATE_ARGUMENT);
(q.NOT_SUPPORT_NON_STRING_MESSAGE);
(q.NOT_SUPPORT_LOCALE_PROMISE_VALUE);
(q.NOT_SUPPORT_LOCALE_ASYNC_FUNCTION);
(q.NOT_SUPPORT_LOCALE_TYPE);
function Pt(e2, t2) {
  return t2.locale == null ? It(e2.locale) : It(t2.locale);
}
var Ft;
function It(e2) {
  if (P(e2)) return e2;
  if (N(e2)) {
    if (e2.resolvedOnce && Ft != null) return Ft;
    if (e2.constructor.name === "Function") {
      let t2 = e2();
      if (ne(t2)) throw J(q.NOT_SUPPORT_LOCALE_PROMISE_VALUE);
      return Ft = t2;
    }
    throw J(q.NOT_SUPPORT_LOCALE_ASYNC_FUNCTION);
  }
  throw J(q.NOT_SUPPORT_LOCALE_TYPE);
}
function Lt(e2, t2, n2) {
  return [.../* @__PURE__ */ new Set([n2, ...M(t2) ? t2 : I(t2) ? Object.keys(t2).filter((e3) => e3 !== "default") : P(t2) ? [t2] : [n2]])];
}
function Rt(e2, t2, n2) {
  let r2 = P(n2) ? n2 : Qt, i2 = e2;
  i2.__localeChainCache ||= /* @__PURE__ */ new Map();
  let a2 = x(t2), o2 = i2.__localeChainCache.get(r2);
  o2 || (o2 = /* @__PURE__ */ new Map(), i2.__localeChainCache.set(r2, o2));
  let s2 = o2.get(a2);
  if (s2) return s2;
  let c2 = [], l2 = [n2];
  for (; M(l2); ) l2 = zt(c2, l2, t2);
  let u2 = M(t2) || !L(t2) ? t2 : t2.default ? t2.default : null;
  return l2 = P(u2) ? [u2] : u2, M(l2) && zt(c2, l2, !1), o2.set(a2, c2), c2;
}
function zt(e2, t2, n2) {
  let r2 = !0;
  for (let i2 = 0; i2 < t2.length && F(r2); i2++) {
    let a2 = t2[i2];
    P(a2) && (r2 = Bt(e2, t2[i2], n2));
  }
  return r2;
}
function Bt(e2, t2, n2) {
  let r2, i2 = t2.split("-");
  do
    r2 = Vt(e2, i2.join("-"), n2), i2.splice(-1, 1);
  while (i2.length && r2 === !0);
  return r2;
}
function Vt(e2, t2, n2) {
  let r2 = !1;
  if (!e2.includes(t2) && (r2 = !0, t2)) {
    r2 = t2[t2.length - 1] !== "!";
    let i2 = t2.replace(/!/g, "");
    e2.push(i2), (M(n2) || L(n2)) && n2[i2] && (r2 = n2[i2]);
  }
  return r2;
}
var Y = [];
(Y[0] = { w: [0], i: [3, 0], "[": [4], o: [7] });
(Y[1] = { w: [1], ".": [2], "[": [4], o: [7] });
(Y[2] = { w: [2], i: [3, 0], 0: [3, 0] });
(Y[3] = { i: [3, 0], 0: [3, 0], w: [1, 1], ".": [2, 1], "[": [4, 1], o: [7, 1] });
(Y[4] = { "'": [5, 0], '"': [6, 0], "[": [4, 2], "]": [1, 3], o: 8, l: [4, 0] });
(Y[5] = { "'": [4, 0], o: 8, l: [5, 0] });
(Y[6] = { '"': [4, 0], o: 8, l: [6, 0] });
var Ht = /^\s?(?:true|false|-?[\d.]+|'[^']*'|"[^"]*")\s?$/;
function Ut(e2) {
  return Ht.test(e2);
}
function Wt(e2) {
  let t2 = e2.charCodeAt(0);
  return t2 === e2.charCodeAt(e2.length - 1) && (t2 === 34 || t2 === 39) ? e2.slice(1, -1) : e2;
}
function Gt(e2) {
  if (e2 == null) return "o";
  switch (e2.charCodeAt(0)) {
    case 91:
    case 93:
    case 46:
    case 34:
    case 39:
      return e2;
    case 95:
    case 36:
    case 45:
      return "i";
    case 9:
    case 10:
    case 13:
    case 160:
    case 65279:
    case 8232:
    case 8233:
      return "w";
  }
  return "i";
}
function Kt(e2) {
  let t2 = e2.trim();
  return e2.charAt(0) === "0" && isNaN(parseInt(e2)) ? !1 : Ut(t2) ? Wt(t2) : "*" + t2;
}
function qt(e2) {
  let t2 = [], n2 = -1, r2 = 0, i2 = 0, a2, o2, s2, c2, l2, u2, d2, f2 = [];
  f2[0] = () => {
    o2 === void 0 ? o2 = s2 : o2 += s2;
  }, f2[1] = () => {
    o2 !== void 0 && (t2.push(o2), o2 = void 0);
  }, f2[2] = () => {
    f2[0](), i2++;
  }, f2[3] = () => {
    if (i2 > 0) i2--, r2 = 4, f2[0]();
    else {
      if (i2 = 0, o2 === void 0 || (o2 = Kt(o2), o2 === !1)) return !1;
      f2[1]();
    }
  };
  function p2() {
    let t3 = e2[n2 + 1];
    if (r2 === 5 && t3 === "'" || r2 === 6 && t3 === '"') return n2++, s2 = "\\" + t3, f2[0](), !0;
  }
  for (; r2 !== null; ) if (n2++, a2 = e2[n2], !(a2 === "\\" && p2())) {
    if (c2 = Gt(a2), d2 = Y[r2], l2 = d2[c2] || d2.l || 8, l2 === 8 || (r2 = l2[0], l2[1] !== void 0 && (u2 = f2[l2[1]], u2 && (s2 = a2, u2() === !1)))) return;
    if (r2 === 7) return t2;
  }
}
var Jt = /* @__PURE__ */ new Map();
function Yt(e2, t2) {
  return I(e2) ? e2[t2] : null;
}
function Xt(e2, t2) {
  if (!I(e2)) return null;
  let n2 = Jt.get(t2);
  if (n2 || (n2 = qt(t2), n2 && Jt.set(t2, n2)), !n2) return null;
  let r2 = n2.length, i2 = e2, a2 = 0;
  for (; a2 < r2; ) {
    let e3 = n2[a2];
    if (yt.includes(e3) && G(i2) || !I(i2) || !j(i2, e3)) return null;
    let t3 = i2[e3];
    if (t3 === void 0 || N(i2)) return null;
    i2 = t3, a2++;
  }
  return i2;
}
var X = { NOT_FOUND_KEY: 1, FALLBACK_TO_TRANSLATE: 2, CANNOT_FORMAT_NUMBER: 3, FALLBACK_TO_NUMBER_FORMAT: 4, CANNOT_FORMAT_DATE: 5, FALLBACK_TO_DATE_FORMAT: 6, EXPERIMENTAL_CUSTOM_MESSAGE_COMPILER: 7, INVALID_NUMBER_ARGUMENT: 8, INVALID_DATE_ARGUMENT: 9 };
(X.NOT_FOUND_KEY);
(X.FALLBACK_TO_TRANSLATE);
(X.CANNOT_FORMAT_NUMBER);
(X.FALLBACK_TO_NUMBER_FORMAT);
(X.CANNOT_FORMAT_DATE);
(X.FALLBACK_TO_DATE_FORMAT);
(X.EXPERIMENTAL_CUSTOM_MESSAGE_COMPILER);
(X.INVALID_NUMBER_ARGUMENT);
(X.INVALID_DATE_ARGUMENT);
var Zt = "11.4.10";
var Qt = "en-US";
var $t = (e2) => `${e2.charAt(0).toLocaleUpperCase()}${e2.substr(1)}`;
function en() {
  return { upper: (e2, t2) => t2 === "text" && P(e2) ? e2.toUpperCase() : t2 === "vnode" && I(e2) && "__v_isVNode" in e2 ? e2.children.toUpperCase() : e2, lower: (e2, t2) => t2 === "text" && P(e2) ? e2.toLowerCase() : t2 === "vnode" && I(e2) && "__v_isVNode" in e2 ? e2.children.toLowerCase() : e2, capitalize: (e2, t2) => t2 === "text" && P(e2) ? $t(e2) : t2 === "vnode" && I(e2) && "__v_isVNode" in e2 ? $t(e2.children) : e2 };
}
var tn;
function nn(e2) {
  tn = e2;
}
var rn;
function an(e2) {
  rn = e2;
}
var on;
function sn(e2) {
  on = e2;
}
var cn = null;
var ln = () => cn;
var un = null;
var dn = (e2) => {
  un = e2;
};
var fn = () => un;
var pn = 0;
function mn(e2 = {}) {
  let t2 = N(e2.onWarn) ? e2.onWarn : se, n2 = P(e2.version) ? e2.version : Zt, r2 = P(e2.locale) || N(e2.locale) ? e2.locale : Qt, i2 = N(r2) ? Qt : r2, a2 = M(e2.fallbackLocale) || L(e2.fallbackLocale) || P(e2.fallbackLocale) || e2.fallbackLocale === !1 ? e2.fallbackLocale : i2, o2 = L(e2.messages) ? e2.messages : hn(i2), s2 = L(e2.datetimeFormats) ? e2.datetimeFormats : hn(i2), c2 = L(e2.numberFormats) ? e2.numberFormats : hn(i2), l2 = E(O(), e2.modifiers, en()), u2 = e2.pluralRules || O(), d2 = N(e2.missing) ? e2.missing : null, f2 = F(e2.missingWarn) || w(e2.missingWarn) ? e2.missingWarn : !0, p2 = F(e2.fallbackWarn) || w(e2.fallbackWarn) ? e2.fallbackWarn : !0, m2 = !!e2.fallbackFormat, h2 = !!e2.unresolving, g2 = N(e2.postTranslation) ? e2.postTranslation : null, _2 = L(e2.processor) ? e2.processor : null, v2 = !F(e2.warnHtmlMessage) || e2.warnHtmlMessage, y2 = !!e2.escapeParameter, b2 = N(e2.messageCompiler) ? e2.messageCompiler : tn, ee2 = N(e2.messageResolver) ? e2.messageResolver : rn || Yt, x2 = N(e2.localeFallbacker) ? e2.localeFallbacker : on || Lt, S2 = I(e2.fallbackContext) ? e2.fallbackContext : void 0, C2 = e2, T2 = I(C2.__datetimeFormatters) ? C2.__datetimeFormatters : /* @__PURE__ */ new Map(), D2 = I(C2.__numberFormatters) ? C2.__numberFormatters : /* @__PURE__ */ new Map(), k2 = I(C2.__meta) ? C2.__meta : {};
  pn++;
  let A2 = { version: n2, cid: pn, locale: r2, fallbackLocale: a2, messages: o2, modifiers: l2, pluralRules: u2, missing: d2, missingWarn: f2, fallbackWarn: p2, fallbackFormat: m2, unresolving: h2, postTranslation: g2, processor: _2, warnHtmlMessage: v2, escapeParameter: y2, messageCompiler: b2, messageResolver: ee2, localeFallbacker: x2, fallbackContext: S2, onWarn: t2, __meta: k2 };
  return A2.datetimeFormats = s2, A2.numberFormats = c2, A2.__datetimeFormatters = T2, A2.__numberFormatters = D2, __INTLIFY_PROD_DEVTOOLS__ && jt(A2, n2, k2), A2;
}
var hn = (e2) => ({ [e2]: O() });
function gn(e2, t2, n2, r2, i2) {
  let { missing: a2, onWarn: o2 } = e2;
  if (a2 !== null) {
    let r3 = a2(e2, n2, t2, i2);
    return P(r3) ? r3 : t2;
  }
  return t2;
}
function _n(e2, t2, n2) {
  let r2 = e2;
  r2.__localeChainCache = /* @__PURE__ */ new Map(), e2.localeFallbacker(e2, n2, t2);
}
function vn(e2, t2) {
  return e2 !== t2 && e2.split("-")[0] === t2.split("-")[0];
}
function yn(e2, t2) {
  let n2 = t2.indexOf(e2);
  if (n2 === -1) return !1;
  for (let r2 = n2 + 1; r2 < t2.length; r2++) if (vn(e2, t2[r2])) return !0;
  return !1;
}
function bn(e2, t2, n2, r2, i2, a2, o2) {
  let { fallbackLocale: s2, localeFallbacker: c2, onWarn: l2 } = e2, u2 = c2(e2, s2, n2);
  for (let n3 = 0; n3 < u2.length; n3++) {
    let a3 = u2[n3], s3 = (r2[a3] || {})[t2];
    if (L(s3) && P(a3)) return a3;
    gn(e2, t2, a3, i2, o2);
  }
  return null;
}
function xn(e2, t2, n2) {
  let r2 = `${e2}__${t2}`;
  return L(n2) && !T(n2) && (r2 = `${r2}__${JSON.stringify(n2)}`), r2;
}
function Sn(e2, t2, n2) {
  for (let r2 in n2) {
    let n3 = `${t2}__${r2}`;
    for (let t3 of e2.keys()) (t3 === n3 || t3.startsWith(`${n3}__`)) && e2.delete(t3);
  }
}
function Cn(e2, t2, n2, r2) {
  let [, i2, a2, o2] = e2, s2 = n2;
  return P(i2) ? t2.key = i2 : L(i2) && Object.keys(i2).forEach((e3) => {
    r2.includes(e3) ? s2[e3] = i2[e3] : t2[e3] = i2[e3];
  }), P(a2) ? t2.locale = a2 : L(a2) && (s2 = a2), L(o2) && (s2 = o2), s2;
}
var wn = typeof Intl < "u";
(wn && Intl.DateTimeFormat);
(wn && Intl.NumberFormat);
function Tn(e2, ...t2) {
  let { datetimeFormats: n2, unresolving: r2, onWarn: i2 } = e2, { __datetimeFormatters: a2 } = e2;
  if (!P(t2[0]) && !C(t2[0]) && !S(t2[0])) return "";
  let [o2, s2, c2, l2] = Dn(...t2), u2 = F(c2.missingWarn) ? c2.missingWarn : e2.missingWarn, d2 = F(c2.fallbackWarn) ? c2.fallbackWarn : e2.fallbackWarn, f2 = !!c2.part, p2 = Pt(e2, c2);
  if (!P(o2) || o2 === "") {
    let e3 = new Intl.DateTimeFormat(p2.replace(/!/g, ""), l2);
    return f2 ? e3.formatToParts(s2) : e3.format(s2);
  }
  let m2 = bn(e2, o2, p2, n2, u2, d2, "datetime format");
  if (!P(m2)) return r2 ? -1 : o2;
  let h2 = n2[m2][o2], g2 = xn(m2, o2, l2), _2 = a2.get(g2);
  return _2 || (_2 = new Intl.DateTimeFormat(m2, E({}, h2, l2)), a2.set(g2, _2)), f2 ? _2.formatToParts(s2) : _2.format(s2);
}
var En = ["localeMatcher", "weekday", "era", "year", "month", "day", "hour", "minute", "second", "timeZoneName", "formatMatcher", "hour12", "timeZone", "dateStyle", "timeStyle", "calendar", "dayPeriod", "numberingSystem", "hourCycle", "fractionalSecondDigits"];
function Dn(...e2) {
  let [t2] = e2, n2 = O(), r2 = O(), i2;
  if (P(t2)) {
    let e3 = t2.match(/(\d{4}-\d{2}-\d{2})(T|\s)?(.*)/);
    if (!e3) throw J(q.INVALID_ISO_DATE_ARGUMENT);
    let n3 = e3[3] ? e3[3].trim().startsWith("T") ? `${e3[1].trim()}${e3[3].trim()}` : `${e3[1].trim()}T${e3[3].trim()}` : e3[1].trim();
    i2 = new Date(n3);
    try {
      i2.toISOString();
    } catch {
      throw J(q.INVALID_ISO_DATE_ARGUMENT);
    }
  } else if (C(t2)) {
    if (isNaN(t2.getTime())) throw J(q.INVALID_DATE_ARGUMENT);
    i2 = t2;
  } else if (S(t2)) i2 = t2;
  else throw J(q.INVALID_ARGUMENT);
  let a2 = Cn(e2, n2, r2, En);
  return [n2.key || "", i2, n2, a2];
}
function On(e2, t2, n2) {
  Sn(e2.__datetimeFormatters, t2, n2);
}
function kn(e2, ...t2) {
  let { numberFormats: n2, unresolving: r2, onWarn: i2 } = e2, { __numberFormatters: a2 } = e2;
  if (!S(t2[0])) return "";
  let [o2, s2, c2, l2] = jn(...t2), u2 = F(c2.missingWarn) ? c2.missingWarn : e2.missingWarn, d2 = F(c2.fallbackWarn) ? c2.fallbackWarn : e2.fallbackWarn, f2 = !!c2.part, p2 = Pt(e2, c2);
  if (!P(o2) || o2 === "") {
    let e3 = new Intl.NumberFormat(p2.replace(/!/g, ""), l2);
    return f2 ? e3.formatToParts(s2) : e3.format(s2);
  }
  let m2 = bn(e2, o2, p2, n2, u2, d2, "number format");
  if (!P(m2)) return r2 ? -1 : o2;
  let h2 = n2[m2][o2], g2 = xn(m2, o2, l2), _2 = a2.get(g2);
  return _2 || (_2 = new Intl.NumberFormat(m2, E({}, h2, l2)), a2.set(g2, _2)), f2 ? _2.formatToParts(s2) : _2.format(s2);
}
var An = ["localeMatcher", "style", "currency", "currencyDisplay", "currencySign", "useGrouping", "minimumIntegerDigits", "minimumFractionDigits", "maximumFractionDigits", "minimumSignificantDigits", "maximumSignificantDigits", "compactDisplay", "notation", "signDisplay", "unit", "unitDisplay", "roundingMode", "roundingPriority", "roundingIncrement", "trailingZeroDisplay"];
function jn(...e2) {
  let [t2] = e2, n2 = O(), r2 = O();
  if (!S(t2)) throw J(q.INVALID_ARGUMENT);
  let i2 = t2, a2 = Cn(e2, n2, r2, An);
  return [n2.key || "", i2, n2, a2];
}
function Mn(e2, t2, n2) {
  Sn(e2.__numberFormatters, t2, n2);
}
var Nn = (e2) => e2;
var Pn = (e2) => "";
var Fn = "text";
var In = (e2) => e2.length === 0 ? "" : oe(e2);
var Ln = ae;
function Rn(e2, t2) {
  return e2 = Math.abs(e2), t2 === 2 ? e2 === 1 ? 0 : 1 : Math.min(e2, 2);
}
function zn(e2) {
  let t2 = S(e2.pluralIndex) ? e2.pluralIndex : -1;
  return S(e2.named?.count) ? e2.named.count : S(e2.named?.n) ? e2.named.n : t2;
}
function Bn(e2 = {}) {
  let t2 = e2.locale, n2 = zn(e2), r2 = P(t2) && N(e2.pluralRules?.[t2]) ? e2.pluralRules[t2] : Rn, i2 = r2 === Rn ? void 0 : Rn, a2 = (e3) => e3[r2(n2, e3.length, i2)], o2 = e2.list || [], s2 = (e3) => o2[e3], c2 = e2.named || O();
  S(e2.pluralIndex) && (c2.count ||= e2.pluralIndex, c2.n ||= e2.pluralIndex);
  let l2 = (e3) => c2[e3];
  function u2(t3, n3) {
    return (N(e2.messages) ? e2.messages(t3, !!n3) : I(e2.messages) ? e2.messages[t3] : !1) || (e2.parent ? e2.parent.message(t3) : Pn);
  }
  let d2 = (t3) => e2.modifiers ? e2.modifiers[t3] : Nn, f2 = N(e2.processor?.normalize) ? e2.processor.normalize : In, p2 = N(e2.processor?.interpolate) ? e2.processor.interpolate : Ln, m2 = { list: s2, named: l2, plural: a2, linked: (e3, ...t3) => {
    let [n3, r3] = t3, i3 = "text", a3 = "";
    t3.length === 1 ? I(n3) ? (a3 = n3.modifier || a3, i3 = n3.type || i3) : P(n3) && (a3 = n3 || a3) : t3.length === 2 && (P(n3) && (a3 = n3 || a3), P(r3) && (i3 = r3 || i3));
    let o3 = u2(e3, !0)(m2), s3 = o3 === "" || o3 === void 0 ? e3 : o3, c3 = i3 === "vnode" && M(s3) && a3 ? s3[0] : s3;
    return a3 ? d2(a3)(c3, i3) : c3;
  }, message: u2, type: P(e2.processor?.type) ? e2.processor.type : Fn, interpolate: p2, normalize: f2, values: E(O(), o2, c2) };
  return m2;
}
var Vn = () => "";
var Z = (e2) => N(e2);
function Hn(e2, ...t2) {
  let { fallbackFormat: n2, postTranslation: r2, unresolving: i2, messageCompiler: a2, fallbackLocale: o2, messages: s2 } = e2, [c2, l2] = qn(...t2), u2 = F(l2.missingWarn) ? l2.missingWarn : e2.missingWarn, d2 = F(l2.fallbackWarn) ? l2.fallbackWarn : e2.fallbackWarn, f2 = F(l2.escapeParameter) ? l2.escapeParameter : e2.escapeParameter, p2 = !!l2.resolvedMessage, m2 = P(l2.default) || F(l2.default) ? F(l2.default) ? a2 ? c2 : () => c2 : l2.default : n2 ? a2 ? c2 : () => c2 : null, h2 = n2 || m2 != null && (P(m2) || N(m2)), g2 = Pt(e2, l2);
  f2 && Un(l2);
  let [_2, v2, y2] = p2 ? [c2, g2, s2[g2] || O()] : Wn(e2, c2, g2, o2, d2, u2), b2 = _2, ee2 = c2;
  if (!p2 && !(P(b2) || G(b2) || Z(b2)) && h2 && (b2 = m2, ee2 = b2), !p2 && (!(P(b2) || G(b2) || Z(b2)) || !P(v2))) return i2 ? -1 : c2;
  let x2 = !1, S2 = Z(b2) ? b2 : Gn(e2, c2, v2, b2, ee2, () => {
    x2 = !0;
  });
  if (x2) return b2;
  let C2 = Kn(e2, S2, Bn(Yn(e2, v2, y2, l2))), w2 = r2 ? r2(C2, c2) : C2;
  if (f2 && P(w2) && (w2 = Se(w2)), __INTLIFY_PROD_DEVTOOLS__) {
    let t3 = { timestamp: Date.now(), key: P(c2) ? c2 : Z(b2) ? b2.key : "", locale: v2 || (Z(b2) ? b2.locale : ""), format: P(b2) ? b2 : Z(b2) ? b2.source : "", message: w2 };
    t3.meta = E({}, e2.__meta, ln() || {}), Mt(t3);
  }
  return w2;
}
function Un(e2) {
  M(e2.list) ? e2.list = e2.list.map((e3) => P(e3) ? ce(e3) : e3) : I(e2.named) && Object.keys(e2.named).forEach((t2) => {
    P(e2.named[t2]) && (e2.named[t2] = ce(e2.named[t2]));
  });
}
function Wn(e2, t2, n2, r2, i2, a2) {
  let { messages: o2, onWarn: s2, messageResolver: c2, localeFallbacker: l2 } = e2, u2 = l2(e2, r2, n2), d2 = O(), f2, p2 = null;
  for (let n3 = 0; n3 < u2.length && (f2 = u2[n3], d2 = o2[f2] || O(), (p2 = c2(d2, t2)) === null && (p2 = d2[t2]), !(P(p2) || G(p2) || Z(p2))); n3++) if (!yn(f2, u2)) {
    let n4 = gn(e2, t2, f2, a2, "translate");
    n4 !== t2 && (p2 = n4);
  }
  return [p2, f2, d2];
}
function Gn(e2, t2, n2, r2, i2, a2) {
  let { messageCompiler: o2, warnHtmlMessage: s2 } = e2;
  if (Z(r2)) {
    let e3 = r2;
    return e3.locale = e3.locale || n2, e3.key = e3.key || t2, e3;
  }
  if (o2 == null) {
    let e3 = (() => r2);
    return e3.locale = n2, e3.key = t2, e3;
  }
  let c2 = o2(r2, Jn(e2, n2, i2, r2, s2, a2));
  return c2.locale = n2, c2.key = t2, c2.source = r2, c2;
}
function Kn(e2, t2, n2) {
  return t2(n2);
}
function qn(...e2) {
  let [t2, n2, r2] = e2, i2 = O();
  if (!P(t2) && !S(t2) && !Z(t2) && !G(t2)) throw J(q.INVALID_ARGUMENT);
  let a2 = S(t2) ? String(t2) : (Z(t2), t2);
  return S(n2) ? i2.plural = n2 : P(n2) ? i2.default = n2 : L(n2) && !T(n2) ? i2.named = n2 : M(n2) && (i2.list = n2), S(r2) ? i2.plural = r2 : P(r2) ? i2.default = r2 : L(r2) && E(i2, r2), [a2, i2];
}
function Jn(e2, t2, n2, r2, i2, a2) {
  return { locale: t2, key: n2, warnHtmlMessage: i2, onError: (e3) => {
    throw a2 && a2(e3), e3;
  }, onCacheKey: (e3) => ee(t2, n2, e3) };
}
function Yn(e2, t2, n2, r2) {
  let { modifiers: i2, pluralRules: a2, messageResolver: o2, fallbackLocale: s2, fallbackWarn: c2, missingWarn: l2, fallbackContext: u2 } = e2, d2 = { locale: t2, modifiers: i2, pluralRules: a2, messages: (r3, i3) => {
    let a3 = o2(n2, r3);
    if (a3 == null && (u2 || i3)) {
      let [n3, , i4] = Wn(u2 || e2, r3, t2, s2, c2, l2);
      a3 = n3 ?? o2(i4, r3);
    }
    if (P(a3) || G(a3)) {
      let n3 = !1, i4 = Gn(e2, r3, t2, a3, r3, () => {
        n3 = !0;
      });
      return n3 ? Vn : i4;
    }
    return Z(a3) ? a3 : Vn;
  } };
  return e2.processor && (d2.processor = e2.processor), r2.list && (d2.list = r2.list), r2.named && (d2.named = r2.named), S(r2.plural) && (d2.pluralIndex = r2.plural), d2;
}
nt();
var Xn = "11.4.10";
function Zn() {
  typeof __VUE_I18N_FULL_INSTALL__ != "boolean" && (A().__VUE_I18N_FULL_INSTALL__ = !0), typeof __VUE_I18N_LEGACY_API__ != "boolean" && (A().__VUE_I18N_LEGACY_API__ = !0), typeof __INTLIFY_DROP_MESSAGE_COMPILER__ != "boolean" && (A().__INTLIFY_DROP_MESSAGE_COMPILER__ = !1), typeof __INTLIFY_PROD_DEVTOOLS__ != "boolean" && (A().__INTLIFY_PROD_DEVTOOLS__ = !1);
}
var Q = { UNEXPECTED_RETURN_TYPE: 24, INVALID_ARGUMENT: 25, MUST_BE_CALL_SETUP_TOP: 26, NOT_INSTALLED: 27, REQUIRED_VALUE: 28, INVALID_VALUE: 29, CANNOT_SETUP_VUE_DEVTOOLS_PLUGIN: 30, NOT_INSTALLED_WITH_PROVIDE: 31, UNEXPECTED_ERROR: 32, NOT_COMPATIBLE_LEGACY_VUE_I18N: 33, NOT_AVAILABLE_COMPOSITION_IN_LEGACY: 34 };
function $(e2, ...t2) {
  return De(e2, null, void 0);
}
(Q.UNEXPECTED_RETURN_TYPE);
(Q.INVALID_ARGUMENT);
(Q.MUST_BE_CALL_SETUP_TOP);
(Q.NOT_INSTALLED);
(Q.UNEXPECTED_ERROR);
(Q.REQUIRED_VALUE);
(Q.INVALID_VALUE);
(Q.CANNOT_SETUP_VUE_DEVTOOLS_PLUGIN);
(Q.NOT_INSTALLED_WITH_PROVIDE);
(Q.NOT_COMPATIBLE_LEGACY_VUE_I18N);
(Q.NOT_AVAILABLE_COMPOSITION_IN_LEGACY);
var Qn = b("__translateVNode");
var $n = b("__datetimeParts");
var er = b("__numberParts");
var tr = b("__setPluralRules");
b("__intlifyMeta");
var nr = b("__injectWithOption");
var rr = b("__dispose");
var ir = { FALLBACK_TO_ROOT: 10, NOT_FOUND_PARENT_SCOPE: 11, IGNORE_OBJ_FLATTEN: 12, DEPRECATE_LEGACY_MODE: 13, DEPRECATE_TRANSLATE_CUSTOME_DIRECTIVE: 14, DUPLICATE_USE_I18N_CALLING: 15 };
(ir.FALLBACK_TO_ROOT);
(ir.NOT_FOUND_PARENT_SCOPE);
(ir.IGNORE_OBJ_FLATTEN);
(ir.DEPRECATE_LEGACY_MODE);
(ir.DEPRECATE_TRANSLATE_CUSTOME_DIRECTIVE);
(ir.DUPLICATE_USE_I18N_CALLING);
var ar = null;
{
  let e2 = A().__VUE_INSTANCE_SETTERS__;
  M(e2) && e2.push((e3) => {
    ar = e3;
  });
}
function or(e2) {
  if (!I(e2) || G(e2)) return e2;
  for (let t2 in e2) if (j(e2, t2))
    if (!t2.includes(".")) I(e2[t2]) && or(e2[t2]);
    else {
      let n2 = t2.split("."), r2 = n2.length - 1, i2 = e2, a2 = !1;
      for (let e3 = 0; e3 < r2; e3++) {
        if (n2[e3] === "__proto__") throw Error(`unsafe key: ${n2[e3]}`);
        if (n2[e3] in i2 || (i2[n2[e3]] = O()), !I(i2[n2[e3]])) {
          a2 = !0;
          break;
        }
        i2 = i2[n2[e3]];
      }
      if (a2 || (G(i2) ? yt.includes(n2[r2]) || delete e2[t2] : (i2[n2[r2]] = e2[t2], delete e2[t2])), !G(i2)) {
        let e3 = i2[n2[r2]];
        I(e3) && or(e3);
      }
    }
  return e2;
}
function sr(e2, t2) {
  let { messages: n2, __i18n: r2, messageResolver: i2, flatJson: a2 } = t2, o2 = L(n2) ? n2 : M(r2) ? O() : { [e2]: O() };
  if (M(r2) && r2.forEach((e3) => {
    if ("locale" in e3 && "resource" in e3) {
      let { locale: t3, resource: n3 } = e3;
      t3 ? (o2[t3] = o2[t3] || O(), we(n3, o2[t3])) : we(n3, o2);
    } else P(e3) && we(JSON.parse(e3), o2);
  }), i2 == null && a2) for (let e3 in o2) j(o2, e3) && or(o2[e3]);
  return o2;
}
function cr(e2) {
  return e2.type;
}
function lr(e2, t2, n2) {
  let r2 = I(t2.messages) ? t2.messages : O();
  "__i18nGlobal" in n2 && (r2 = sr(e2.locale.value, { messages: r2, __i18n: n2.__i18nGlobal }));
  let i2 = Object.keys(r2);
  if (i2.length && i2.forEach((t3) => {
    e2.mergeLocaleMessage(t3, r2[t3]);
  }), I(t2.datetimeFormats)) {
    let n3 = Object.keys(t2.datetimeFormats);
    n3.length && n3.forEach((n4) => {
      e2.mergeDateTimeFormat(n4, t2.datetimeFormats[n4]);
    });
  }
  if (I(t2.numberFormats)) {
    let n3 = Object.keys(t2.numberFormats);
    n3.length && n3.forEach((n4) => {
      e2.mergeNumberFormat(n4, t2.numberFormats[n4]);
    });
  }
}
function ur(e2) {
  return g(s, null, e2, 0);
}
function dr() {
  return ar ?? h();
}
var fr = () => [];
var pr = () => !1;
var mr = 0;
function hr(e2) {
  return ((t2, n2, r2, i2) => e2(n2, r2, dr() || void 0, i2));
}
function gr(e2 = {}) {
  let { __root: t2, __injectWithOption: n2 } = e2, a2 = t2 === void 0, o2 = e2.flatJson, s2 = y ? r : i, l2 = !F(e2.inheritLocale) || e2.inheritLocale, u2 = s2(t2 && l2 ? t2.locale.value : P(e2.locale) ? e2.locale : Qt), d2 = s2(t2 && l2 ? t2.fallbackLocale.value : P(e2.fallbackLocale) || M(e2.fallbackLocale) || L(e2.fallbackLocale) || e2.fallbackLocale === !1 ? e2.fallbackLocale : u2.value), f2 = s2(sr(u2.value, e2)), p2 = s2(L(e2.datetimeFormats) ? e2.datetimeFormats : { [u2.value]: {} }), h2 = s2(L(e2.numberFormats) ? e2.numberFormats : { [u2.value]: {} }), g2 = t2 ? t2.missingWarn : F(e2.missingWarn) || w(e2.missingWarn) ? e2.missingWarn : !0, _2 = t2 ? t2.fallbackWarn : F(e2.fallbackWarn) || w(e2.fallbackWarn) ? e2.fallbackWarn : !0, v2 = t2 ? t2.fallbackRoot : !F(e2.fallbackRoot) || e2.fallbackRoot, b2 = !!e2.fallbackFormat, ee2 = N(e2.missing) ? e2.missing : null, x2 = N(e2.missing) ? hr(e2.missing) : null, C2 = N(e2.postTranslation) ? e2.postTranslation : null, T2 = t2 ? t2.warnHtmlMessage : !F(e2.warnHtmlMessage) || e2.warnHtmlMessage, D2 = !!e2.escapeParameter, O2 = t2 ? t2.modifiers : L(e2.modifiers) ? e2.modifiers : {}, k2 = e2.pluralRules || t2 && t2.pluralRules, A2;
  A2 = (() => {
    a2 && dn(null);
    let t3 = { version: Xn, locale: u2.value, fallbackLocale: d2.value, messages: f2.value, modifiers: O2, pluralRules: k2, missing: x2 === null ? void 0 : x2, missingWarn: g2, fallbackWarn: _2, fallbackFormat: b2, unresolving: !0, postTranslation: C2 === null ? void 0 : C2, warnHtmlMessage: T2, escapeParameter: D2, messageResolver: e2.messageResolver, messageCompiler: e2.messageCompiler, __meta: { framework: "vue" } };
    t3.datetimeFormats = p2.value, t3.numberFormats = h2.value, t3.__datetimeFormatters = L(A2) ? A2.__datetimeFormatters : void 0, t3.__numberFormatters = L(A2) ? A2.__numberFormatters : void 0;
    let n3 = mn(t3);
    return a2 && dn(n3), n3;
  })(), _n(A2, u2.value, d2.value);
  function te2() {
    return [u2.value, d2.value, f2.value, p2.value, h2.value];
  }
  let ne2 = c({ get: () => u2.value, set: (e3) => {
    A2.locale = e3, u2.value = e3;
  } }), re2 = c({ get: () => d2.value, set: (e3) => {
    A2.fallbackLocale = e3, d2.value = e3, _n(A2, u2.value, e3);
  } }), ie2 = c(() => f2.value), ae2 = c(() => p2.value), oe2 = c(() => h2.value);
  function se2() {
    return N(C2) ? C2 : null;
  }
  function ce2(e3) {
    C2 = e3, A2.postTranslation = e3;
  }
  function le2() {
    return ee2;
  }
  function ue2(e3) {
    e3 !== null && (x2 = hr(e3)), ee2 = e3, A2.missing = x2;
  }
  let R2 = (e3, n3, r2, i2, o3, s3) => {
    te2();
    let c2;
    try {
      __INTLIFY_PROD_DEVTOOLS__, a2 || (A2.fallbackContext = t2 ? fn() : void 0), c2 = e3(A2);
    } finally {
      __INTLIFY_PROD_DEVTOOLS__, a2 || (A2.fallbackContext = void 0);
    }
    if (r2 !== "translate exists" && S(c2) && c2 === -1 || r2 === "translate exists" && !c2) {
      let [e4, r3] = n3();
      return t2 && v2 ? i2(t2) : o3(e4);
    }
    if (s3(c2)) return c2;
    throw $(Q.UNEXPECTED_RETURN_TYPE);
  };
  function de2(...e3) {
    return R2((t3) => Reflect.apply(Hn, null, [t3, ...e3]), () => qn(...e3), "translate", (t3) => Reflect.apply(t3.t, t3, [...e3]), (e4) => e4, (e4) => P(e4));
  }
  function fe2(...e3) {
    let [t3, n3, r2] = e3;
    if (r2 && !I(r2)) throw $(Q.INVALID_ARGUMENT);
    return de2(t3, n3, E({ resolvedMessage: !0 }, r2 || {}));
  }
  function pe2(...e3) {
    return R2((t3) => Reflect.apply(Tn, null, [t3, ...e3]), () => Dn(...e3), "datetime format", (t3) => Reflect.apply(t3.d, t3, [...e3]), () => "", (e4) => P(e4) || M(e4));
  }
  function me2(...e3) {
    return R2((t3) => Reflect.apply(kn, null, [t3, ...e3]), () => jn(...e3), "number format", (t3) => Reflect.apply(t3.n, t3, [...e3]), () => "", (e4) => P(e4) || M(e4));
  }
  function he2(e3) {
    return e3.map((e4) => P(e4) || S(e4) || F(e4) ? ur(String(e4)) : e4);
  }
  let ge2 = { normalize: he2, interpolate: (e3) => e3, type: "vnode" };
  function _e2(...e3) {
    return R2((t3) => {
      let n3, r2 = t3;
      try {
        r2.processor = ge2, n3 = Reflect.apply(Hn, null, [r2, ...e3]);
      } finally {
        r2.processor = null;
      }
      return n3;
    }, () => qn(...e3), "translate", (t3) => t3[Qn](...e3), (e4) => [ur(e4)], (e4) => M(e4));
  }
  function ve2(...e3) {
    return R2((t3) => Reflect.apply(kn, null, [t3, ...e3]), () => jn(...e3), "number format", (t3) => t3[er](...e3), fr, (e4) => P(e4) || M(e4));
  }
  function ye2(...e3) {
    return R2((t3) => Reflect.apply(Tn, null, [t3, ...e3]), () => Dn(...e3), "datetime format", (t3) => t3[$n](...e3), fr, (e4) => P(e4) || M(e4));
  }
  function be2(e3) {
    k2 = e3, A2.pluralRules = k2;
  }
  function xe2(e3, t3) {
    return R2(() => {
      if (!e3) return !1;
      let n3 = P(t3) ? t3 : u2.value, r2 = P(t3) ? [n3] : Rt(A2, d2.value, n3);
      for (let t4 = 0; t4 < r2.length; t4++) {
        let n4 = Te2(r2[t4]), i2 = A2.messageResolver(n4, e3);
        if (i2 === null && (i2 = n4[e3]), G(i2) || Z(i2) || P(i2)) return !0;
      }
      return !1;
    }, () => [e3], "translate exists", (n3) => Reflect.apply(n3.te, n3, [e3, t3]), pr, (e4) => F(e4));
  }
  function Se2(e3) {
    let t3 = null, n3 = Rt(A2, d2.value, u2.value);
    for (let r2 = 0; r2 < n3.length; r2++) {
      let i2 = f2.value[n3[r2]] || {}, a3 = A2.messageResolver(i2, e3);
      if (a3 != null) {
        t3 = a3;
        break;
      }
    }
    return t3;
  }
  function Ce2(e3) {
    return Se2(e3) ?? (t2 && t2.tm(e3) || {});
  }
  function Te2(e3) {
    return f2.value[e3] || {};
  }
  function Ee2(e3, t3) {
    if (o2) {
      let n3 = { [e3]: t3 };
      for (let e4 in n3) j(n3, e4) && or(n3[e4]);
      t3 = n3[e3];
    }
    f2.value[e3] = t3, A2.messages = f2.value;
  }
  function z2(e3, t3) {
    f2.value[e3] = f2.value[e3] || {};
    let n3 = { [e3]: t3 };
    if (o2) for (let e4 in n3) j(n3, e4) && or(n3[e4]);
    t3 = n3[e3], we(t3, f2.value[e3]), A2.messages = f2.value;
  }
  function De2(e3) {
    return p2.value[e3] || {};
  }
  function Oe2(e3, t3) {
    p2.value[e3] = t3, A2.datetimeFormats = p2.value, On(A2, e3, t3);
  }
  function B2(e3, t3) {
    p2.value[e3] = E(p2.value[e3] || {}, t3), A2.datetimeFormats = p2.value, On(A2, e3, t3);
  }
  function ke2(e3) {
    return h2.value[e3] || {};
  }
  function V2(e3, t3) {
    h2.value[e3] = t3, A2.numberFormats = h2.value, Mn(A2, e3, t3);
  }
  function Ae2(e3, t3) {
    h2.value[e3] = E(h2.value[e3] || {}, t3), A2.numberFormats = h2.value, Mn(A2, e3, t3);
  }
  mr++, t2 && y && (m(t2.locale, (e3) => {
    l2 && (u2.value = e3, A2.locale = e3, _n(A2, u2.value, d2.value));
  }), m(t2.fallbackLocale, (e3) => {
    l2 && (d2.value = e3, A2.fallbackLocale = e3, _n(A2, u2.value, d2.value));
  }));
  let H2 = { id: mr, locale: ne2, fallbackLocale: re2, get inheritLocale() {
    return l2;
  }, set inheritLocale(e3) {
    l2 = e3, e3 && t2 && (u2.value = t2.locale.value, d2.value = t2.fallbackLocale.value, _n(A2, u2.value, d2.value));
  }, get availableLocales() {
    return Object.keys(f2.value).sort();
  }, messages: ie2, get modifiers() {
    return O2;
  }, get pluralRules() {
    return k2 || {};
  }, get isGlobal() {
    return a2;
  }, get missingWarn() {
    return g2;
  }, set missingWarn(e3) {
    g2 = e3, A2.missingWarn = g2;
  }, get fallbackWarn() {
    return _2;
  }, set fallbackWarn(e3) {
    _2 = e3, A2.fallbackWarn = _2;
  }, get fallbackRoot() {
    return v2;
  }, set fallbackRoot(e3) {
    v2 = e3;
  }, get fallbackFormat() {
    return b2;
  }, set fallbackFormat(e3) {
    b2 = e3, A2.fallbackFormat = b2;
  }, get warnHtmlMessage() {
    return T2;
  }, set warnHtmlMessage(e3) {
    T2 = e3, A2.warnHtmlMessage = e3;
  }, get escapeParameter() {
    return D2;
  }, set escapeParameter(e3) {
    D2 = e3, A2.escapeParameter = e3;
  }, t: de2, getLocaleMessage: Te2, setLocaleMessage: Ee2, mergeLocaleMessage: z2, getPostTranslationHandler: se2, setPostTranslationHandler: ce2, getMissingHandler: le2, setMissingHandler: ue2, [tr]: be2 };
  return H2.datetimeFormats = ae2, H2.numberFormats = oe2, H2.rt = fe2, H2.te = xe2, H2.tm = Ce2, H2.d = pe2, H2.n = me2, H2.getDateTimeFormat = De2, H2.setDateTimeFormat = Oe2, H2.mergeDateTimeFormat = B2, H2.getNumberFormat = ke2, H2.setNumberFormat = V2, H2.mergeNumberFormat = Ae2, H2[nr] = n2, H2[Qn] = _e2, H2[$n] = ye2, H2[er] = ve2, H2;
}
function _r(e2) {
  let t2 = P(e2.locale) ? e2.locale : Qt, n2 = P(e2.fallbackLocale) || M(e2.fallbackLocale) || L(e2.fallbackLocale) || e2.fallbackLocale === !1 ? e2.fallbackLocale : t2, r2 = N(e2.missing) ? e2.missing : void 0, i2 = F(e2.silentTranslationWarn) || w(e2.silentTranslationWarn) ? !e2.silentTranslationWarn : !0, a2 = F(e2.silentFallbackWarn) || w(e2.silentFallbackWarn) ? !e2.silentFallbackWarn : !0, o2 = !F(e2.fallbackRoot) || e2.fallbackRoot, s2 = !!e2.formatFallbackMessages, c2 = L(e2.modifiers) ? e2.modifiers : {}, l2 = e2.pluralizationRules, u2 = N(e2.postTranslation) ? e2.postTranslation : void 0, d2 = !P(e2.warnHtmlInMessage) || e2.warnHtmlInMessage !== "off", f2 = !!e2.escapeParameterHtml, p2 = !F(e2.sync) || e2.sync, m2 = e2.messages;
  if (L(e2.sharedMessages)) {
    let t3 = e2.sharedMessages;
    m2 = Object.keys(t3).reduce((e3, n3) => (E(e3[n3] || (e3[n3] = {}), t3[n3]), e3), m2 || {});
  }
  let { __i18n: h2, __root: g2, __injectWithOption: _2 } = e2, v2 = e2.datetimeFormats, y2 = e2.numberFormats, b2 = e2.flatJson;
  return { locale: t2, fallbackLocale: n2, messages: m2, flatJson: b2, datetimeFormats: v2, numberFormats: y2, missing: r2, missingWarn: i2, fallbackWarn: a2, fallbackRoot: o2, fallbackFormat: s2, modifiers: c2, pluralRules: l2, postTranslation: u2, warnHtmlMessage: d2, escapeParameter: f2, messageResolver: e2.messageResolver, inheritLocale: p2, __i18n: h2, __root: g2, __injectWithOption: _2 };
}
function vr(e2 = {}) {
  let t2 = gr(_r(e2)), { __extender: n2 } = e2, r2 = { id: t2.id, get locale() {
    return t2.locale.value;
  }, set locale(e3) {
    t2.locale.value = e3;
  }, get fallbackLocale() {
    return t2.fallbackLocale.value;
  }, set fallbackLocale(e3) {
    t2.fallbackLocale.value = e3;
  }, get messages() {
    return t2.messages.value;
  }, get datetimeFormats() {
    return t2.datetimeFormats.value;
  }, get numberFormats() {
    return t2.numberFormats.value;
  }, get availableLocales() {
    return t2.availableLocales;
  }, get missing() {
    return t2.getMissingHandler();
  }, set missing(e3) {
    t2.setMissingHandler(e3);
  }, get silentTranslationWarn() {
    return F(t2.missingWarn) ? !t2.missingWarn : t2.missingWarn;
  }, set silentTranslationWarn(e3) {
    t2.missingWarn = F(e3) ? !e3 : e3;
  }, get silentFallbackWarn() {
    return F(t2.fallbackWarn) ? !t2.fallbackWarn : t2.fallbackWarn;
  }, set silentFallbackWarn(e3) {
    t2.fallbackWarn = F(e3) ? !e3 : e3;
  }, get modifiers() {
    return t2.modifiers;
  }, get formatFallbackMessages() {
    return t2.fallbackFormat;
  }, set formatFallbackMessages(e3) {
    t2.fallbackFormat = e3;
  }, get postTranslation() {
    return t2.getPostTranslationHandler();
  }, set postTranslation(e3) {
    t2.setPostTranslationHandler(e3);
  }, get sync() {
    return t2.inheritLocale;
  }, set sync(e3) {
    t2.inheritLocale = e3;
  }, get warnHtmlInMessage() {
    return t2.warnHtmlMessage ? "warn" : "off";
  }, set warnHtmlInMessage(e3) {
    t2.warnHtmlMessage = e3 !== "off";
  }, get escapeParameterHtml() {
    return t2.escapeParameter;
  }, set escapeParameterHtml(e3) {
    t2.escapeParameter = e3;
  }, get pluralizationRules() {
    return t2.pluralRules || {};
  }, __composer: t2, t(...e3) {
    return Reflect.apply(t2.t, t2, [...e3]);
  }, rt(...e3) {
    return Reflect.apply(t2.rt, t2, [...e3]);
  }, te(e3, n3) {
    return t2.te(e3, n3);
  }, tm(e3) {
    return t2.tm(e3);
  }, getLocaleMessage(e3) {
    return t2.getLocaleMessage(e3);
  }, setLocaleMessage(e3, n3) {
    t2.setLocaleMessage(e3, n3);
  }, mergeLocaleMessage(e3, n3) {
    t2.mergeLocaleMessage(e3, n3);
  }, d(...e3) {
    return Reflect.apply(t2.d, t2, [...e3]);
  }, getDateTimeFormat(e3) {
    return t2.getDateTimeFormat(e3);
  }, setDateTimeFormat(e3, n3) {
    t2.setDateTimeFormat(e3, n3);
  }, mergeDateTimeFormat(e3, n3) {
    t2.mergeDateTimeFormat(e3, n3);
  }, n(...e3) {
    return Reflect.apply(t2.n, t2, [...e3]);
  }, getNumberFormat(e3) {
    return t2.getNumberFormat(e3);
  }, setNumberFormat(e3, n3) {
    t2.setNumberFormat(e3, n3);
  }, mergeNumberFormat(e3, n3) {
    t2.mergeNumberFormat(e3, n3);
  } };
  return r2.__extender = n2, r2;
}
function yr(e2, t2, n2) {
  return { beforeCreate() {
    let r2 = dr();
    if (!r2) throw $(Q.UNEXPECTED_ERROR);
    let i2 = this.$options;
    if (i2.i18n) {
      let r3 = i2.i18n;
      if (i2.__i18n && (r3.__i18n = i2.__i18n), r3.__root = t2, this === this.$root) this.$i18n = br(e2, r3);
      else {
        r3.__injectWithOption = !0, r3.__extender = n2.__vueI18nExtend, this.$i18n = vr(r3);
        let e3 = this.$i18n;
        e3.__extender && (e3.__disposer = e3.__extender(this.$i18n));
      }
    } else if (i2.__i18n)
      if (this === this.$root) this.$i18n = br(e2, i2);
      else {
        this.$i18n = vr({ __i18n: i2.__i18n, __injectWithOption: !0, __extender: n2.__vueI18nExtend, __root: t2 });
        let e3 = this.$i18n;
        e3.__extender && (e3.__disposer = e3.__extender(this.$i18n));
      }
    else this.$i18n = e2;
    i2.__i18nGlobal && lr(t2, i2, i2), this.$t = (...e3) => this.$i18n.t(...e3), this.$rt = (...e3) => this.$i18n.rt(...e3), this.$te = (e3, t3) => this.$i18n.te(e3, t3), this.$d = (...e3) => this.$i18n.d(...e3), this.$n = (...e3) => this.$i18n.n(...e3), this.$tm = (e3) => this.$i18n.tm(e3), n2.__setInstance(r2, this.$i18n);
  }, mounted() {
  }, unmounted() {
    let e3 = dr();
    if (!e3) throw $(Q.UNEXPECTED_ERROR);
    let t3 = this.$i18n;
    t3 && (delete this.$t, delete this.$rt, delete this.$te, delete this.$d, delete this.$n, delete this.$tm, t3?.__disposer && (t3.__disposer(), delete t3.__disposer, delete t3.__extender), n2.__deleteInstance(e3), delete this.$i18n);
  } };
}
function br(e2, t2) {
  e2.locale = t2.locale || e2.locale, e2.fallbackLocale = t2.fallbackLocale || e2.fallbackLocale, e2.missing = t2.missing || e2.missing, e2.silentTranslationWarn = t2.silentTranslationWarn || e2.silentFallbackWarn, e2.silentFallbackWarn = t2.silentFallbackWarn || e2.silentFallbackWarn, e2.formatFallbackMessages = t2.formatFallbackMessages || e2.formatFallbackMessages, e2.postTranslation = t2.postTranslation || e2.postTranslation, e2.warnHtmlInMessage = t2.warnHtmlInMessage || e2.warnHtmlInMessage, e2.escapeParameterHtml = t2.escapeParameterHtml || e2.escapeParameterHtml, e2.sync = t2.sync || e2.sync, e2.__composer[tr](t2.pluralizationRules || e2.pluralizationRules);
  let n2 = sr(e2.locale, { messages: t2.messages, __i18n: t2.__i18n });
  return Object.keys(n2).forEach((t3) => e2.mergeLocaleMessage(t3, n2[t3])), t2.datetimeFormats && Object.keys(t2.datetimeFormats).forEach((n3) => e2.mergeDateTimeFormat(n3, t2.datetimeFormats[n3])), t2.numberFormats && Object.keys(t2.numberFormats).forEach((n3) => e2.mergeNumberFormat(n3, t2.numberFormats[n3])), e2;
}
var xr = { tag: { type: [String, Object] }, locale: { type: String }, scope: { type: String, validator: (e2) => e2 === "parent" || e2 === "global", default: "parent" }, i18n: { type: Object } };
function Sr({ slots: e2 }, t2) {
  return t2.length === 1 && t2[0] === "default" ? (e2.default ? e2.default() : []).reduce((e3, t3) => [...e3, ...t3.type === l ? t3.children : [t3]], []) : t2.reduce((t3, n2) => {
    let r2 = e2[n2];
    return r2 && (t3[n2] = r2()), t3;
  }, O());
}
function Cr() {
  return l;
}
var wr = e({ name: "i18n-t", props: E({ keypath: { type: String, required: !0 }, plural: { type: [Number, String], validator: (e2) => S(e2) || !isNaN(e2) } }, xr), setup(e2, n2) {
  let { slots: r2, attrs: i2 } = n2, a2 = e2.i18n || Ir({ useScope: e2.scope, __useComponent: !0 });
  return () => {
    let o2 = () => {
      let t2 = Object.keys(r2).filter((e3) => e3[0] !== "_"), i3 = O();
      e2.locale && (i3.locale = e2.locale), e2.plural !== void 0 && (i3.plural = P(e2.plural) ? +e2.plural : e2.plural);
      let o3 = Sr(n2, t2);
      return a2[Qn](e2.keypath, o3, i3);
    }, s2 = E(O(), i2), c2 = P(e2.tag) || I(e2.tag) ? e2.tag : Cr();
    return I(c2) ? t(c2, s2, { default: o2 }) : t(c2, s2, o2());
  };
} });
var Tr = wr;
function Er(e2) {
  return M(e2) && !P(e2[0]);
}
function Dr(e2, n2, r2, i2) {
  let { slots: a2, attrs: o2 } = n2;
  return () => {
    let n3 = () => {
      let t2 = { part: !0 }, n4 = O();
      e2.locale && (t2.locale = e2.locale), P(e2.format) ? t2.key = e2.format : I(e2.format) && (P(e2.format.key) && (t2.key = e2.format.key), n4 = Object.keys(e2.format).reduce((t3, n5) => r2.includes(n5) ? E(O(), t3, { [n5]: e2.format[n5] }) : t3, O()));
      let o3 = i2(e2.value, t2, n4), s3 = [t2.key];
      return M(o3) ? s3 = o3.map((e3, t3) => {
        let n5 = a2[e3.type], r3 = n5 ? n5({ [e3.type]: e3.value, index: t3, parts: o3 }) : [e3.value];
        return Er(r3) && (r3[0].key = `${e3.type}-${t3}`), r3;
      }) : P(o3) && (s3 = [o3]), s3;
    }, s2 = E(O(), o2), c2 = P(e2.tag) || I(e2.tag) ? e2.tag : Cr();
    return I(c2) ? t(c2, s2, { default: n3 }) : t(c2, s2, n3());
  };
}
var Or = e({ name: "i18n-n", props: E({ value: { type: Number, required: !0 }, format: { type: [String, Object] } }, xr), setup(e2, t2) {
  let n2 = e2.i18n || Ir({ useScope: e2.scope, __useComponent: !0 });
  return Dr(e2, t2, An, (...e3) => n2[er](...e3));
} });
function kr(e2, t2) {
  let n2 = e2;
  if (e2.mode === "composition") return n2.__getInstance(t2) || e2.global;
  {
    let r2 = n2.__getInstance(t2);
    return r2 == null ? e2.global.__composer : r2.__composer;
  }
}
function Ar(e2) {
  let t2 = (t3) => {
    let { instance: n2, value: r2 } = t3;
    if (!n2 || !n2.$) throw $(Q.UNEXPECTED_ERROR);
    let i2 = kr(e2, n2.$), a2 = jr(r2);
    return [Reflect.apply(i2.t, i2, [...Mr(a2)]), i2];
  };
  return { created: (e3, n2) => {
    let [r2, i2] = t2(n2);
    y && (e3.__i18nWatcher = m(i2.locale, () => {
      n2.instance && n2.instance.$forceUpdate();
    })), e3.__composer = i2, e3.textContent = r2;
  }, unmounted: (e3) => {
    y && e3.__i18nWatcher && (e3.__i18nWatcher(), e3.__i18nWatcher = void 0, delete e3.__i18nWatcher), e3.__composer && (e3.__composer = void 0, delete e3.__composer);
  }, beforeUpdate: (e3, { value: t3 }) => {
    if (e3.__composer) {
      let n2 = e3.__composer, r2 = jr(t3);
      e3.textContent = Reflect.apply(n2.t, n2, [...Mr(r2)]);
    }
  }, getSSRProps: (e3) => {
    let [n2] = t2(e3);
    return { textContent: n2 };
  } };
}
function jr(e2) {
  if (P(e2)) return { path: e2 };
  if (L(e2)) {
    if (!("path" in e2)) throw $(Q.REQUIRED_VALUE, "path");
    return e2;
  }
  throw $(Q.INVALID_VALUE);
}
function Mr(e2) {
  let { path: t2, locale: n2, args: r2, choice: i2, plural: a2 } = e2, o2 = {}, s2 = r2 || {};
  return P(n2) && (o2.locale = n2), S(i2) && (o2.plural = i2), S(a2) && (o2.plural = a2), [t2, s2, o2];
}
function Nr(e2, t2, ...n2) {
  let r2 = L(n2[0]) ? n2[0] : {};
  (!F(r2.globalInstall) || r2.globalInstall) && ([wr.name, "I18nT"].forEach((t3) => e2.component(t3, wr)), [Or.name, "I18nN"].forEach((t3) => e2.component(t3, Or)), [qr.name, "I18nD"].forEach((t3) => e2.component(t3, qr))), e2.directive("t", Ar(t2));
}
var Pr = b("global-vue-i18n");
function Fr(e2 = {}) {
  let t2 = __VUE_I18N_LEGACY_API__ && F(e2.legacy) ? e2.legacy : __VUE_I18N_LEGACY_API__, n2 = !F(e2.globalInjection) || e2.globalInjection, r2 = /* @__PURE__ */ new Map(), [i2, a2] = Lr(e2, t2), o2 = b("");
  function s2(e3) {
    return r2.get(e3) || null;
  }
  function c2(e3, t3) {
    r2.set(e3, t3);
  }
  function l2(e3) {
    r2.delete(e3);
  }
  let u2 = { get mode() {
    return __VUE_I18N_LEGACY_API__ && t2 ? "legacy" : "composition";
  }, async install(e3, ...r3) {
    if (e3.__VUE_I18N_SYMBOL__ = o2, e3.provide(e3.__VUE_I18N_SYMBOL__, u2), L(r3[0])) {
      let e4 = r3[0];
      u2.__composerExtend = e4.__composerExtend, u2.__vueI18nExtend = e4.__vueI18nExtend;
    }
    let i3 = null;
    !t2 && n2 && (i3 = Kr(e3, u2.global)), __VUE_I18N_FULL_INSTALL__ && Nr(e3, u2, ...r3), __VUE_I18N_LEGACY_API__ && t2 && e3.mixin(yr(a2, a2.__composer, u2));
    let s3 = e3.unmount;
    e3.unmount = () => {
      i3 && i3(), u2.dispose(), s3();
    };
  }, get global() {
    return a2;
  }, dispose() {
    i2.stop();
  }, __instances: r2, __getInstance: s2, __setInstance: c2, __deleteInstance: l2 };
  return u2;
}
function Ir(e2 = {}) {
  let t2 = dr();
  if (t2 == null) throw $(Q.MUST_BE_CALL_SETUP_TOP);
  if (!t2.isCE && t2.appContext.app != null && !t2.appContext.app.__VUE_I18N_SYMBOL__) throw $(Q.NOT_INSTALLED);
  let n2 = Rr(t2), r2 = Br(n2), i2 = cr(t2), a2 = zr(e2, i2);
  if (a2 === "global") return lr(r2, e2, i2), r2;
  if (a2 === "parent") {
    let i3 = Vr(n2, t2, e2.__useComponent);
    return i3 ??= r2, i3;
  }
  if (a2 === "isolated") {
    if (n2.mode !== "composition") throw $(Q.NOT_AVAILABLE_COMPOSITION_IN_LEGACY);
    let i3 = n2, a3 = E({}, e2);
    a3.__root = Vr(n2, t2) || r2;
    let o3 = gr(a3);
    return i3.__composerExtend && (o3[rr] = i3.__composerExtend(o3)), f() && _(() => {
      let e3 = o3[rr];
      e3 && (e3(), delete o3[rr]);
    }), o3;
  }
  let o2 = n2, s2 = o2.__getInstance(t2);
  if (s2 == null) {
    let n3 = E({}, e2);
    "__i18n" in i2 && (n3.__i18n = i2.__i18n), r2 && (n3.__root = r2), s2 = gr(n3), o2.__composerExtend && (s2[rr] = o2.__composerExtend(s2)), Ur(o2, t2, s2), o2.__setInstance(t2, s2);
  }
  return s2;
}
function Lr(e2, t2) {
  let n2 = p(), r2 = __VUE_I18N_LEGACY_API__ && t2 ? n2.run(() => vr(e2)) : n2.run(() => gr(e2));
  if (r2 == null) throw $(Q.UNEXPECTED_ERROR);
  return [n2, r2];
}
function Rr(e2) {
  let t2 = d(e2.isCE ? Pr : e2.appContext.app.__VUE_I18N_SYMBOL__);
  if (!t2) throw $(e2.isCE ? Q.NOT_INSTALLED_WITH_PROVIDE : Q.UNEXPECTED_ERROR);
  return t2;
}
function zr(e2, t2) {
  return T(e2) ? "__i18n" in t2 ? "local" : "global" : e2.useScope ? e2.useScope : "local";
}
function Br(e2) {
  return e2.mode === "composition" ? e2.global : e2.global.__composer;
}
function Vr(e2, t2, n2 = !1) {
  let r2 = null, i2 = t2.root, a2 = Hr(t2, n2);
  for (; a2 != null; ) {
    let t3 = e2;
    if (e2.mode === "composition") r2 = t3.__getInstance(a2);
    else if (__VUE_I18N_LEGACY_API__) {
      let e3 = t3.__getInstance(a2);
      e3 != null && (r2 = e3.__composer, n2 && r2 && !r2[nr] && (r2 = null));
    }
    if (r2 != null || i2 === a2) break;
    a2 = a2.parent;
  }
  return r2;
}
function Hr(e2, t2 = !1) {
  return e2 == null ? null : t2 && e2.vnode.ctx || e2.parent;
}
function Ur(e2, t2, r2) {
  a(() => {
  }, t2), n(() => {
    let n2 = r2;
    e2.__deleteInstance(t2);
    let i2 = n2[rr];
    i2 && (i2(), delete n2[rr]);
  }, t2);
}
var Wr = ["locale", "fallbackLocale", "availableLocales"];
var Gr = ["t", "rt", "d", "n", "tm", "te"];
function Kr(e2, t2) {
  let n2 = /* @__PURE__ */ Object.create(null);
  return Wr.forEach((e3) => {
    let r2 = Object.getOwnPropertyDescriptor(t2, e3);
    if (!r2) throw $(Q.UNEXPECTED_ERROR);
    let i2 = o(r2.value) ? { get() {
      return r2.value.value;
    }, set(e4) {
      r2.value.value = e4;
    } } : { get() {
      return r2.get && r2.get();
    } };
    Object.defineProperty(n2, e3, i2);
  }), e2.config.globalProperties.$i18n = n2, Gr.forEach((n3) => {
    let r2 = Object.getOwnPropertyDescriptor(t2, n3);
    if (!r2 || !r2.value) throw $(Q.UNEXPECTED_ERROR);
    Object.defineProperty(e2.config.globalProperties, `$${n3}`, r2);
  }), () => {
    delete e2.config.globalProperties.$i18n, Gr.forEach((t3) => {
      delete e2.config.globalProperties[`$${t3}`];
    });
  };
}
var qr = e({ name: "i18n-d", props: E({ value: { type: [Number, Date], required: !0 }, format: { type: [String, Object] } }, xr), setup(e2, t2) {
  let n2 = e2.i18n || Ir({ useScope: e2.scope, __useComponent: !0 });
  return Dr(e2, t2, En, (...e3) => n2[$n](...e3));
} });
if (Zn(), nn(Ot), an(Xt), sn(Rt), __INTLIFY_PROD_DEVTOOLS__) {
  let e2 = A();
  e2.__INTLIFY__ = !0, At(e2.__INTLIFY_DEVTOOLS_GLOBAL_HOOK__);
}
var Jr = Fr({ globalInjection: !0, fallbackLocale: "en", legacy: !1, locale: "", messages: {}, missingWarn: !1, fallbackWarn: !1, messageResolver(e2, t2) {
  return e2[t2] || t2;
} });
var Yr = Zr(Object.assign({ "./langs/en.json": () => v(() => import("./en-D33DiJcZ.js"), []), "./langs/ru.json": () => v(() => import("./ru-Bo9bnzty.js"), []), "./langs/zh-CN.json": () => v(() => import("./zh-CN-CKEkLKpn.js"), []) }));
var Xr;
function Zr(e2) {
  let t2 = {};
  for (let [n2, r2] of Object.entries(e2)) {
    let e3 = n2.match(/([\w-]*)\.(yaml|yml|json)/)?.[1];
    e3 && (t2[e3] = r2);
  }
  return t2;
}
function Qr(e2) {
  Jr.global.locale.value = e2, document?.querySelector("html")?.setAttribute("lang", e2);
}
async function $r(e2 = {}) {
  let { defaultLocale: t2, missingWarn: n2 } = e2;
  Xr = e2.loadMessages || (async () => ({})), console.log("defaultLocale", t2), t2 && await ei(t2), Jr.global.setMissingHandler((e3, t3) => {
    n2 && t3.includes(".") && console.warn(`[intlify] Not found '${t3}' key in '${e3}' locale messages.`);
  });
}
async function ei(e2) {
  if (console.log("lang", e2), u(Jr.global.locale) === e2) return Qr(e2);
  let t2 = await Yr[e2]?.();
  t2?.default && Jr.global.setLocaleMessage(e2, t2.default);
  let n2 = await Xr(e2);
  return Jr.global.mergeLocaleMessage(e2, n2), Qr(e2);
}
var ti = Jr.global.t;
globalThis.$t = ti;
var ni = navigator.language === "zh-CN" ? navigator.language : navigator.language.split("-")[0];
export {Tr as a,$r as i,ni as n,Ir as o,Jr as r,ti as t};