import {a as e,n as t,o as n,r,t as i} from "./rolldown-runtime-BCiCTKAo.js";
import {C as a,D as o,E as s,Et as c,F as l,G as u,H as d,J as f,L as p,N as m,P as h,R as g,St as _,V as v,W as y,Y as b,Z as x,at as S,b as C,bt as w,d as T,en as E,f as D,h as O,i as k,in as A,jt as j,k as M,lt as N,m as P,nn as F,nt as ee,p as I,q as L,rt as te,st as R,tt as ne,v as re,x as z} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as B} from "./locales-BfKu2SD4.js";
import {Z as ie} from "./basecomponent-ClhuVxJN.js";
import {t as ae} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as oe} from "./checkbox-DozTKB5Z.js";
import {t as se} from "./select-Cc8zLK4m.js";
var ce = i(((e2, t2) => {
  var n2 = Object.prototype;
  function r2(e3) {
    var t3 = e3 && e3.constructor;
    return e3 === (typeof t3 == "function" && t3.prototype || n2);
  }
  t2.exports = r2;
}));
var le = i(((e2, t2) => {
  function n2(e3, t3) {
    return function(n3) {
      return e3(t3(n3));
    };
  }
  t2.exports = n2;
}));
var ue = i(((e2, t2) => {
  t2.exports = le()(Object.keys, Object);
}));
var de = i(((e2, t2) => {
  var n2 = ce(), r2 = ue(), i2 = Object.prototype.hasOwnProperty;
  function a2(e3) {
    if (!n2(e3)) return r2(e3);
    var t3 = [];
    for (var a3 in Object(e3)) i2.call(e3, a3) && a3 != "constructor" && t3.push(a3);
    return t3;
  }
  t2.exports = a2;
}));
var V = i(((e2, t2) => {
  t2.exports = typeof global == "object" && global && global.Object === Object && global;
}));
var H = i(((e2, t2) => {
  var n2 = V(), r2 = typeof self == "object" && self && self.Object === Object && self;
  t2.exports = n2 || r2 || Function("return this")();
}));
var fe = i(((e2, t2) => {
  t2.exports = H().Symbol;
}));
var pe = i(((e2, t2) => {
  var n2 = fe(), r2 = Object.prototype, i2 = r2.hasOwnProperty, a2 = r2.toString, o2 = n2 ? n2.toStringTag : void 0;
  function s2(e3) {
    var t3 = i2.call(e3, o2), n3 = e3[o2];
    try {
      e3[o2] = void 0;
      var r3 = !0;
    } catch {
    }
    var s3 = a2.call(e3);
    return r3 && (t3 ? e3[o2] = n3 : delete e3[o2]), s3;
  }
  t2.exports = s2;
}));
var me = i(((e2, t2) => {
  var n2 = Object.prototype.toString;
  function r2(e3) {
    return n2.call(e3);
  }
  t2.exports = r2;
}));
var he = i(((e2, t2) => {
  var n2 = fe(), r2 = pe(), i2 = me(), a2 = "[object Null]", o2 = "[object Undefined]", s2 = n2 ? n2.toStringTag : void 0;
  function c2(e3) {
    return e3 == null ? e3 === void 0 ? o2 : a2 : s2 && s2 in Object(e3) ? r2(e3) : i2(e3);
  }
  t2.exports = c2;
}));
var ge = i(((e2, t2) => {
  function n2(e3) {
    var t3 = typeof e3;
    return e3 != null && (t3 == "object" || t3 == "function");
  }
  t2.exports = n2;
}));
var _e = i(((e2, t2) => {
  var n2 = he(), r2 = ge(), i2 = "[object AsyncFunction]", a2 = "[object Function]", o2 = "[object GeneratorFunction]", s2 = "[object Proxy]";
  function c2(e3) {
    if (!r2(e3)) return !1;
    var t3 = n2(e3);
    return t3 == a2 || t3 == o2 || t3 == i2 || t3 == s2;
  }
  t2.exports = c2;
}));
var ve = i(((e2, t2) => {
  t2.exports = H()["__core-js_shared__"];
}));
var ye = i(((e2, t2) => {
  var n2 = ve(), r2 = (function() {
    var e3 = /[^.]+$/.exec(n2 && n2.keys && n2.keys.IE_PROTO || "");
    return e3 ? "Symbol(src)_1." + e3 : "";
  })();
  function i2(e3) {
    return !!r2 && r2 in e3;
  }
  t2.exports = i2;
}));
var be = i(((e2, t2) => {
  var n2 = Function.prototype.toString;
  function r2(e3) {
    if (e3 != null) {
      try {
        return n2.call(e3);
      } catch {
      }
      try {
        return e3 + "";
      } catch {
      }
    }
    return "";
  }
  t2.exports = r2;
}));
var xe = i(((e2, t2) => {
  var n2 = _e(), r2 = ye(), i2 = ge(), a2 = be(), o2 = /[\\^$.*+?()[\]{}|]/g, s2 = /^\[object .+?Constructor\]$/, c2 = Function.prototype, l2 = Object.prototype, u2 = c2.toString, d2 = l2.hasOwnProperty, f2 = RegExp("^" + u2.call(d2).replace(o2, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
  function p2(e3) {
    return !i2(e3) || r2(e3) ? !1 : (n2(e3) ? f2 : s2).test(a2(e3));
  }
  t2.exports = p2;
}));
var Se = i(((e2, t2) => {
  function n2(e3, t3) {
    return e3?.[t3];
  }
  t2.exports = n2;
}));
var Ce = i(((e2, t2) => {
  var n2 = xe(), r2 = Se();
  function i2(e3, t3) {
    var i3 = r2(e3, t3);
    return n2(i3) ? i3 : void 0;
  }
  t2.exports = i2;
}));
var we = i(((e2, t2) => {
  t2.exports = Ce()(H(), "DataView");
}));
var Te = i(((e2, t2) => {
  t2.exports = Ce()(H(), "Map");
}));
var Ee = i(((e2, t2) => {
  t2.exports = Ce()(H(), "Promise");
}));
var De = i(((e2, t2) => {
  t2.exports = Ce()(H(), "Set");
}));
var Oe = i(((e2, t2) => {
  t2.exports = Ce()(H(), "WeakMap");
}));
var ke = i(((e2, t2) => {
  var n2 = we(), r2 = Te(), i2 = Ee(), a2 = De(), o2 = Oe(), s2 = he(), c2 = be(), l2 = "[object Map]", u2 = "[object Object]", d2 = "[object Promise]", f2 = "[object Set]", p2 = "[object WeakMap]", m2 = "[object DataView]", h2 = c2(n2), g2 = c2(r2), _2 = c2(i2), v2 = c2(a2), y2 = c2(o2), b2 = s2;
  (n2 && b2(new n2(new ArrayBuffer(1))) != m2 || r2 && b2(new r2()) != l2 || i2 && b2(i2.resolve()) != d2 || a2 && b2(new a2()) != f2 || o2 && b2(new o2()) != p2) && (b2 = function(e3) {
    var t3 = s2(e3), n3 = t3 == u2 ? e3.constructor : void 0, r3 = n3 ? c2(n3) : "";
    if (r3) switch (r3) {
      case h2:
        return m2;
      case g2:
        return l2;
      case _2:
        return d2;
      case v2:
        return f2;
      case y2:
        return p2;
    }
    return t3;
  }), t2.exports = b2;
}));
var Ae = i(((e2, t2) => {
  function n2(e3) {
    return typeof e3 == "object" && !!e3;
  }
  t2.exports = n2;
}));
var je = i(((e2, t2) => {
  var n2 = he(), r2 = Ae(), i2 = "[object Arguments]";
  function a2(e3) {
    return r2(e3) && n2(e3) == i2;
  }
  t2.exports = a2;
}));
var Me = i(((e2, t2) => {
  var n2 = je(), r2 = Ae(), i2 = Object.prototype, a2 = i2.hasOwnProperty, o2 = i2.propertyIsEnumerable;
  t2.exports = n2(/* @__PURE__ */ (function() {
    return arguments;
  })()) ? n2 : function(e3) {
    return r2(e3) && a2.call(e3, "callee") && !o2.call(e3, "callee");
  };
}));
var U = i(((e2, t2) => {
  t2.exports = Array.isArray;
}));
var Ne = i(((e2, t2) => {
  function n2(e3) {
    return typeof e3 == "number" && e3 > -1 && e3 % 1 == 0 && e3 <= 9007199254740991;
  }
  t2.exports = n2;
}));
var Pe = i(((e2, t2) => {
  var n2 = _e(), r2 = Ne();
  function i2(e3) {
    return e3 != null && r2(e3.length) && !n2(e3);
  }
  t2.exports = i2;
}));
var Fe = i(((e2, t2) => {
  function n2() {
    return !1;
  }
  t2.exports = n2;
}));
var Ie = i(((e2, t2) => {
  var n2 = H(), r2 = Fe(), i2 = typeof e2 == "object" && e2 && !e2.nodeType && e2, a2 = i2 && typeof t2 == "object" && t2 && !t2.nodeType && t2, o2 = a2 && a2.exports === i2 ? n2.Buffer : void 0;
  t2.exports = (o2 ? o2.isBuffer : void 0) || r2;
}));
var Le = i(((e2, t2) => {
  var n2 = he(), r2 = Ne(), i2 = Ae(), a2 = "[object Arguments]", o2 = "[object Array]", s2 = "[object Boolean]", c2 = "[object Date]", l2 = "[object Error]", u2 = "[object Function]", d2 = "[object Map]", f2 = "[object Number]", p2 = "[object Object]", m2 = "[object RegExp]", h2 = "[object Set]", g2 = "[object String]", _2 = "[object WeakMap]", v2 = "[object ArrayBuffer]", y2 = "[object DataView]", b2 = "[object Float32Array]", x2 = "[object Float64Array]", S2 = "[object Int8Array]", C2 = "[object Int16Array]", w2 = "[object Int32Array]", T2 = "[object Uint8Array]", E2 = "[object Uint8ClampedArray]", D2 = "[object Uint16Array]", O2 = "[object Uint32Array]", k2 = {};
  k2[b2] = k2[x2] = k2[S2] = k2[C2] = k2[w2] = k2[T2] = k2[E2] = k2[D2] = k2[O2] = !0, k2[a2] = k2[o2] = k2[v2] = k2[s2] = k2[y2] = k2[c2] = k2[l2] = k2[u2] = k2[d2] = k2[f2] = k2[p2] = k2[m2] = k2[h2] = k2[g2] = k2[_2] = !1;
  function A2(e3) {
    return i2(e3) && r2(e3.length) && !!k2[n2(e3)];
  }
  t2.exports = A2;
}));
var Re = i(((e2, t2) => {
  function n2(e3) {
    return function(t3) {
      return e3(t3);
    };
  }
  t2.exports = n2;
}));
var ze = i(((e2, t2) => {
  var n2 = V(), r2 = typeof e2 == "object" && e2 && !e2.nodeType && e2, i2 = r2 && typeof t2 == "object" && t2 && !t2.nodeType && t2, a2 = i2 && i2.exports === r2 && n2.process;
  t2.exports = (function() {
    try {
      return i2 && i2.require && i2.require("util").types || a2 && a2.binding && a2.binding("util");
    } catch {
    }
  })();
}));
var Be = i(((e2, t2) => {
  var n2 = Le(), r2 = Re(), i2 = ze(), a2 = i2 && i2.isTypedArray;
  t2.exports = a2 ? r2(a2) : n2;
}));
var Ve = i(((e2, t2) => {
  var n2 = de(), r2 = ke(), i2 = Me(), a2 = U(), o2 = Pe(), s2 = Ie(), c2 = ce(), l2 = Be(), u2 = "[object Map]", d2 = "[object Set]", f2 = Object.prototype.hasOwnProperty;
  function p2(e3) {
    if (e3 == null) return !0;
    if (o2(e3) && (a2(e3) || typeof e3 == "string" || typeof e3.splice == "function" || s2(e3) || l2(e3) || i2(e3))) return !e3.length;
    var t3 = r2(e3);
    if (t3 == u2 || t3 == d2) return !e3.size;
    if (c2(e3)) return !n2(e3).length;
    for (var p3 in e3) if (f2.call(e3, p3)) return !1;
    return !0;
  }
  t2.exports = p2;
}));
var He = i(((e2, t2) => {
  function n2(e3, t3, n3, r2) {
    var i2 = -1, a2 = e3 == null ? 0 : e3.length;
    for (r2 && a2 && (n3 = e3[++i2]); ++i2 < a2; ) n3 = t3(n3, e3[i2], i2, e3);
    return n3;
  }
  t2.exports = n2;
}));
var Ue = i(((e2, t2) => {
  function n2(e3) {
    return function(t3) {
      return e3?.[t3];
    };
  }
  t2.exports = n2;
}));
var We = i(((e2, t2) => {
  t2.exports = Ue()({ \u00C0: "A", \u00C1: "A", \u00C2: "A", \u00C3: "A", \u00C4: "A", \u00C5: "A", \u00E0: "a", \u00E1: "a", \u00E2: "a", \u00E3: "a", \u00E4: "a", \u00E5: "a", \u00C7: "C", \u00E7: "c", \u00D0: "D", \u00F0: "d", \u00C8: "E", \u00C9: "E", \u00CA: "E", \u00CB: "E", \u00E8: "e", \u00E9: "e", \u00EA: "e", \u00EB: "e", \u00CC: "I", \u00CD: "I", \u00CE: "I", \u00CF: "I", \u00EC: "i", \u00ED: "i", \u00EE: "i", \u00EF: "i", \u00D1: "N", \u00F1: "n", \u00D2: "O", \u00D3: "O", \u00D4: "O", \u00D5: "O", \u00D6: "O", \u00D8: "O", \u00F2: "o", \u00F3: "o", \u00F4: "o", \u00F5: "o", \u00F6: "o", \u00F8: "o", \u00D9: "U", \u00DA: "U", \u00DB: "U", \u00DC: "U", \u00F9: "u", \u00FA: "u", \u00FB: "u", \u00FC: "u", \u00DD: "Y", \u00FD: "y", \u00FF: "y", \u00C6: "Ae", \u00E6: "ae", \u00DE: "Th", \u00FE: "th", \u00DF: "ss", \u0100: "A", \u0102: "A", \u0104: "A", \u0101: "a", \u0103: "a", \u0105: "a", \u0106: "C", \u0108: "C", \u010A: "C", \u010C: "C", \u0107: "c", \u0109: "c", \u010B: "c", \u010D: "c", \u010E: "D", \u0110: "D", \u010F: "d", \u0111: "d", \u0112: "E", \u0114: "E", \u0116: "E", \u0118: "E", \u011A: "E", \u0113: "e", \u0115: "e", \u0117: "e", \u0119: "e", \u011B: "e", \u011C: "G", \u011E: "G", \u0120: "G", \u0122: "G", \u011D: "g", \u011F: "g", \u0121: "g", \u0123: "g", \u0124: "H", \u0126: "H", \u0125: "h", \u0127: "h", \u0128: "I", \u012A: "I", \u012C: "I", \u012E: "I", \u0130: "I", \u0129: "i", \u012B: "i", \u012D: "i", \u012F: "i", \u0131: "i", \u0134: "J", \u0135: "j", \u0136: "K", \u0137: "k", \u0138: "k", \u0139: "L", \u013B: "L", \u013D: "L", \u013F: "L", \u0141: "L", \u013A: "l", \u013C: "l", \u013E: "l", \u0140: "l", \u0142: "l", \u0143: "N", \u0145: "N", \u0147: "N", \u014A: "N", \u0144: "n", \u0146: "n", \u0148: "n", \u014B: "n", \u014C: "O", \u014E: "O", \u0150: "O", \u014D: "o", \u014F: "o", \u0151: "o", \u0154: "R", \u0156: "R", \u0158: "R", \u0155: "r", \u0157: "r", \u0159: "r", \u015A: "S", \u015C: "S", \u015E: "S", \u0160: "S", \u015B: "s", \u015D: "s", \u015F: "s", \u0161: "s", \u0162: "T", \u0164: "T", \u0166: "T", \u0163: "t", \u0165: "t", \u0167: "t", \u0168: "U", \u016A: "U", \u016C: "U", \u016E: "U", \u0170: "U", \u0172: "U", \u0169: "u", \u016B: "u", \u016D: "u", \u016F: "u", \u0171: "u", \u0173: "u", \u0174: "W", \u0175: "w", \u0176: "Y", \u0177: "y", \u0178: "Y", \u0179: "Z", \u017B: "Z", \u017D: "Z", \u017A: "z", \u017C: "z", \u017E: "z", \u0132: "IJ", \u0133: "ij", \u0152: "Oe", \u0153: "oe", \u0149: "'n", \u017F: "s" });
}));
var Ge = i(((e2, t2) => {
  function n2(e3, t3) {
    for (var n3 = -1, r2 = e3 == null ? 0 : e3.length, i2 = Array(r2); ++n3 < r2; ) i2[n3] = t3(e3[n3], n3, e3);
    return i2;
  }
  t2.exports = n2;
}));
var Ke = i(((e2, t2) => {
  var n2 = he(), r2 = Ae(), i2 = "[object Symbol]";
  function a2(e3) {
    return typeof e3 == "symbol" || r2(e3) && n2(e3) == i2;
  }
  t2.exports = a2;
}));
var qe = i(((e2, t2) => {
  var n2 = fe(), r2 = Ge(), i2 = U(), a2 = Ke(), o2 = 1 / 0, s2 = n2 ? n2.prototype : void 0, c2 = s2 ? s2.toString : void 0;
  function l2(e3) {
    if (typeof e3 == "string") return e3;
    if (i2(e3)) return r2(e3, l2) + "";
    if (a2(e3)) return c2 ? c2.call(e3) : "";
    var t3 = e3 + "";
    return t3 == "0" && 1 / e3 == -o2 ? "-0" : t3;
  }
  t2.exports = l2;
}));
var Je = i(((e2, t2) => {
  var n2 = qe();
  function r2(e3) {
    return e3 == null ? "" : n2(e3);
  }
  t2.exports = r2;
}));
var Ye = i(((e2, t2) => {
  var n2 = We(), r2 = Je(), i2 = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, a2 = RegExp("[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]", "g");
  function o2(e3) {
    return e3 = r2(e3), e3 && e3.replace(i2, n2).replace(a2, "");
  }
  t2.exports = o2;
}));
var Xe = i(((e2, t2) => {
  var n2 = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
  function r2(e3) {
    return e3.match(n2) || [];
  }
  t2.exports = r2;
}));
var Ze = i(((e2, t2) => {
  var n2 = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
  function r2(e3) {
    return n2.test(e3);
  }
  t2.exports = r2;
}));
var Qe = i(((e2, t2) => {
  var n2 = "\\ud800-\\udfff", r2 = "\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff", i2 = "\\u2700-\\u27bf", a2 = "a-z\\xdf-\\xf6\\xf8-\\xff", o2 = "\\xac\\xb1\\xd7\\xf7", s2 = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", c2 = "\\u2000-\\u206f", l2 = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", u2 = "A-Z\\xc0-\\xd6\\xd8-\\xde", d2 = "\\ufe0e\\ufe0f", f2 = o2 + s2 + c2 + l2, p2 = "['\u2019]", m2 = "[" + f2 + "]", h2 = "[" + r2 + "]", g2 = "\\d+", _2 = "[" + i2 + "]", v2 = "[" + a2 + "]", y2 = "[^" + n2 + f2 + g2 + i2 + a2 + u2 + "]", b2 = "(?:" + h2 + "|\\ud83c[\\udffb-\\udfff])", x2 = "[^" + n2 + "]", S2 = "(?:\\ud83c[\\udde6-\\uddff]){2}", C2 = "[\\ud800-\\udbff][\\udc00-\\udfff]", w2 = "[" + u2 + "]", T2 = "\\u200d", E2 = "(?:" + v2 + "|" + y2 + ")", D2 = "(?:" + w2 + "|" + y2 + ")", O2 = "(?:" + p2 + "(?:d|ll|m|re|s|t|ve))?", k2 = "(?:" + p2 + "(?:D|LL|M|RE|S|T|VE))?", A2 = b2 + "?", j2 = "[" + d2 + "]?", M2 = "(?:" + T2 + "(?:" + [x2, S2, C2].join("|") + ")" + j2 + A2 + ")*", N2 = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", P2 = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", F2 = j2 + A2 + M2, ee2 = "(?:" + [_2, S2, C2].join("|") + ")" + F2, I2 = RegExp([w2 + "?" + v2 + "+" + O2 + "(?=" + [m2, w2, "$"].join("|") + ")", D2 + "+" + k2 + "(?=" + [m2, w2 + E2, "$"].join("|") + ")", w2 + "?" + E2 + "+" + O2, w2 + "+" + k2, P2, N2, g2, ee2].join("|"), "g");
  function L2(e3) {
    return e3.match(I2) || [];
  }
  t2.exports = L2;
}));
var $e = i(((e2, t2) => {
  var n2 = Xe(), r2 = Ze(), i2 = Je(), a2 = Qe();
  function o2(e3, t3, o3) {
    return e3 = i2(e3), t3 = o3 ? void 0 : t3, t3 === void 0 ? r2(e3) ? a2(e3) : n2(e3) : e3.match(t3) || [];
  }
  t2.exports = o2;
}));
var et = i(((e2, t2) => {
  var n2 = He(), r2 = Ye(), i2 = $e(), a2 = RegExp("['\u2019]", "g");
  function o2(e3) {
    return function(t3) {
      return n2(i2(r2(t3).replace(a2, "")), e3, "");
    };
  }
  t2.exports = o2;
}));
var tt = i(((e2, t2) => {
  function n2(e3, t3, n3) {
    var r2 = -1, i2 = e3.length;
    t3 < 0 && (t3 = -t3 > i2 ? 0 : i2 + t3), n3 = n3 > i2 ? i2 : n3, n3 < 0 && (n3 += i2), i2 = t3 > n3 ? 0 : n3 - t3 >>> 0, t3 >>>= 0;
    for (var a2 = Array(i2); ++r2 < i2; ) a2[r2] = e3[r2 + t3];
    return a2;
  }
  t2.exports = n2;
}));
var nt = i(((e2, t2) => {
  var n2 = tt();
  function r2(e3, t3, r3) {
    var i2 = e3.length;
    return r3 = r3 === void 0 ? i2 : r3, !t3 && r3 >= i2 ? e3 : n2(e3, t3, r3);
  }
  t2.exports = r2;
}));
var rt = i(((e2, t2) => {
  var n2 = RegExp("[\\u200d\\ud800-\\udfff\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff\\ufe0e\\ufe0f]");
  function r2(e3) {
    return n2.test(e3);
  }
  t2.exports = r2;
}));
var it = i(((e2, t2) => {
  function n2(e3) {
    return e3.split("");
  }
  t2.exports = n2;
}));
var at = i(((e2, t2) => {
  var n2 = "\\ud800-\\udfff", r2 = "\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff", i2 = "\\ufe0e\\ufe0f", a2 = "[" + n2 + "]", o2 = "[" + r2 + "]", s2 = "\\ud83c[\\udffb-\\udfff]", c2 = "(?:" + o2 + "|" + s2 + ")", l2 = "[^" + n2 + "]", u2 = "(?:\\ud83c[\\udde6-\\uddff]){2}", d2 = "[\\ud800-\\udbff][\\udc00-\\udfff]", f2 = "\\u200d", p2 = c2 + "?", m2 = "[" + i2 + "]?", h2 = "(?:" + f2 + "(?:" + [l2, u2, d2].join("|") + ")" + m2 + p2 + ")*", g2 = m2 + p2 + h2, _2 = "(?:" + [l2 + o2 + "?", o2, u2, d2, a2].join("|") + ")", v2 = RegExp(s2 + "(?=" + s2 + ")|" + _2 + g2, "g");
  function y2(e3) {
    return e3.match(v2) || [];
  }
  t2.exports = y2;
}));
var ot = i(((e2, t2) => {
  var n2 = it(), r2 = rt(), i2 = at();
  function a2(e3) {
    return r2(e3) ? i2(e3) : n2(e3);
  }
  t2.exports = a2;
}));
var st = i(((e2, t2) => {
  var n2 = nt(), r2 = rt(), i2 = ot(), a2 = Je();
  function o2(e3) {
    return function(t3) {
      t3 = a2(t3);
      var o3 = r2(t3) ? i2(t3) : void 0, s2 = o3 ? o3[0] : t3.charAt(0), c2 = o3 ? n2(o3, 1).join("") : t3.slice(1);
      return s2[e3]() + c2;
    };
  }
  t2.exports = o2;
}));
var ct = i(((e2, t2) => {
  t2.exports = st()("toUpperCase");
}));
var lt = i(((e2, t2) => {
  var n2 = et(), r2 = ct();
  t2.exports = n2(function(e3, t3, n3) {
    return e3 + (n3 ? " " : "") + r2(t3);
  });
}));
var ut = i(((e2, t2) => {
  function n2(e3, t3) {
    for (var n3 = -1, r2 = Array(e3); ++n3 < e3; ) r2[n3] = t3(n3);
    return r2;
  }
  t2.exports = n2;
}));
var dt = i(((e2, t2) => {
  var n2 = /^(?:0|[1-9]\d*)$/;
  function r2(e3, t3) {
    var r3 = typeof e3;
    return t3 ??= 9007199254740991, !!t3 && (r3 == "number" || r3 != "symbol" && n2.test(e3)) && e3 > -1 && e3 % 1 == 0 && e3 < t3;
  }
  t2.exports = r2;
}));
var ft = i(((e2, t2) => {
  var n2 = ut(), r2 = Me(), i2 = U(), a2 = Ie(), o2 = dt(), s2 = Be(), c2 = Object.prototype.hasOwnProperty;
  function l2(e3, t3) {
    var l3 = i2(e3), u2 = !l3 && r2(e3), d2 = !l3 && !u2 && a2(e3), f2 = !l3 && !u2 && !d2 && s2(e3), p2 = l3 || u2 || d2 || f2, m2 = p2 ? n2(e3.length, String) : [], h2 = m2.length;
    for (var g2 in e3) (t3 || c2.call(e3, g2)) && !(p2 && (g2 == "length" || d2 && (g2 == "offset" || g2 == "parent") || f2 && (g2 == "buffer" || g2 == "byteLength" || g2 == "byteOffset") || o2(g2, h2))) && m2.push(g2);
    return m2;
  }
  t2.exports = l2;
}));
var pt = i(((e2, t2) => {
  var n2 = ft(), r2 = de(), i2 = Pe();
  function a2(e3) {
    return i2(e3) ? n2(e3) : r2(e3);
  }
  t2.exports = a2;
}));
var mt = i(((e2, t2) => {
  var n2 = Math.ceil, r2 = Math.max;
  function i2(e3, t3, i3, a2) {
    for (var o2 = -1, s2 = r2(n2((t3 - e3) / (i3 || 1)), 0), c2 = Array(s2); s2--; ) c2[a2 ? s2 : ++o2] = e3, e3 += i3;
    return c2;
  }
  t2.exports = i2;
}));
var ht = i(((e2, t2) => {
  function n2(e3, t3) {
    return e3 === t3 || e3 !== e3 && t3 !== t3;
  }
  t2.exports = n2;
}));
var gt = i(((e2, t2) => {
  var n2 = ht(), r2 = Pe(), i2 = dt(), a2 = ge();
  function o2(e3, t3, o3) {
    if (!a2(o3)) return !1;
    var s2 = typeof t3;
    return (s2 == "number" ? r2(o3) && i2(t3, o3.length) : s2 == "string" && t3 in o3) ? n2(o3[t3], e3) : !1;
  }
  t2.exports = o2;
}));
var _t = i(((e2, t2) => {
  var n2 = /\s/;
  function r2(e3) {
    for (var t3 = e3.length; t3-- && n2.test(e3.charAt(t3)); ) ;
    return t3;
  }
  t2.exports = r2;
}));
var vt = i(((e2, t2) => {
  var n2 = _t(), r2 = /^\s+/;
  function i2(e3) {
    return e3 && e3.slice(0, n2(e3) + 1).replace(r2, "");
  }
  t2.exports = i2;
}));
var yt = i(((e2, t2) => {
  var n2 = vt(), r2 = ge(), i2 = Ke(), a2 = NaN, o2 = /^[-+]0x[0-9a-f]+$/i, s2 = /^0b[01]+$/i, c2 = /^0o[0-7]+$/i, l2 = parseInt;
  function u2(e3) {
    if (typeof e3 == "number") return e3;
    if (i2(e3)) return a2;
    if (r2(e3)) {
      var t3 = typeof e3.valueOf == "function" ? e3.valueOf() : e3;
      e3 = r2(t3) ? t3 + "" : t3;
    }
    if (typeof e3 != "string") return e3 === 0 ? e3 : +e3;
    e3 = n2(e3);
    var u3 = s2.test(e3);
    return u3 || c2.test(e3) ? l2(e3.slice(2), u3 ? 2 : 8) : o2.test(e3) ? a2 : +e3;
  }
  t2.exports = u2;
}));
var bt = i(((e2, t2) => {
  var n2 = yt(), r2 = 1 / 0, i2 = 17976931348623157e292;
  function a2(e3) {
    return e3 ? (e3 = n2(e3), e3 === r2 || e3 === -r2 ? (e3 < 0 ? -1 : 1) * i2 : e3 === e3 ? e3 : 0) : e3 === 0 ? e3 : 0;
  }
  t2.exports = a2;
}));
var xt = i(((e2, t2) => {
  var n2 = mt(), r2 = gt(), i2 = bt();
  function a2(e3) {
    return function(t3, a3, o2) {
      return o2 && typeof o2 != "number" && r2(t3, a3, o2) && (a3 = o2 = void 0), t3 = i2(t3), a3 === void 0 ? (a3 = t3, t3 = 0) : a3 = i2(a3), o2 = o2 === void 0 ? t3 < a3 ? 1 : -1 : i2(o2), n2(t3, a3, o2, e3);
    };
  }
  t2.exports = a2;
}));
var St = i(((e2, t2) => {
  t2.exports = xt()();
}));
var Ct = i(((e2, t2) => {
  var n2 = U(), r2 = Ke(), i2 = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, a2 = /^\w*$/;
  function o2(e3, t3) {
    if (n2(e3)) return !1;
    var o3 = typeof e3;
    return o3 == "number" || o3 == "symbol" || o3 == "boolean" || e3 == null || r2(e3) ? !0 : a2.test(e3) || !i2.test(e3) || t3 != null && e3 in Object(t3);
  }
  t2.exports = o2;
}));
var wt = i(((e2, t2) => {
  t2.exports = Ce()(Object, "create");
}));
var Tt = i(((e2, t2) => {
  var n2 = wt();
  function r2() {
    this.__data__ = n2 ? n2(null) : {}, this.size = 0;
  }
  t2.exports = r2;
}));
var Et = i(((e2, t2) => {
  function n2(e3) {
    var t3 = this.has(e3) && delete this.__data__[e3];
    return this.size -= +!!t3, t3;
  }
  t2.exports = n2;
}));
var Dt = i(((e2, t2) => {
  var n2 = wt(), r2 = "__lodash_hash_undefined__", i2 = Object.prototype.hasOwnProperty;
  function a2(e3) {
    var t3 = this.__data__;
    if (n2) {
      var a3 = t3[e3];
      return a3 === r2 ? void 0 : a3;
    }
    return i2.call(t3, e3) ? t3[e3] : void 0;
  }
  t2.exports = a2;
}));
var Ot = i(((e2, t2) => {
  var n2 = wt(), r2 = Object.prototype.hasOwnProperty;
  function i2(e3) {
    var t3 = this.__data__;
    return n2 ? t3[e3] !== void 0 : r2.call(t3, e3);
  }
  t2.exports = i2;
}));
var kt = i(((e2, t2) => {
  var n2 = wt(), r2 = "__lodash_hash_undefined__";
  function i2(e3, t3) {
    var i3 = this.__data__;
    return this.size += +!this.has(e3), i3[e3] = n2 && t3 === void 0 ? r2 : t3, this;
  }
  t2.exports = i2;
}));
var At = i(((e2, t2) => {
  var n2 = Tt(), r2 = Et(), i2 = Dt(), a2 = Ot(), o2 = kt();
  function s2(e3) {
    var t3 = -1, n3 = e3 == null ? 0 : e3.length;
    for (this.clear(); ++t3 < n3; ) {
      var r3 = e3[t3];
      this.set(r3[0], r3[1]);
    }
  }
  s2.prototype.clear = n2, s2.prototype.delete = r2, s2.prototype.get = i2, s2.prototype.has = a2, s2.prototype.set = o2, t2.exports = s2;
}));
var jt = i(((e2, t2) => {
  function n2() {
    this.__data__ = [], this.size = 0;
  }
  t2.exports = n2;
}));
var Mt = i(((e2, t2) => {
  var n2 = ht();
  function r2(e3, t3) {
    for (var r3 = e3.length; r3--; ) if (n2(e3[r3][0], t3)) return r3;
    return -1;
  }
  t2.exports = r2;
}));
var Nt = i(((e2, t2) => {
  var n2 = Mt(), r2 = Array.prototype.splice;
  function i2(e3) {
    var t3 = this.__data__, i3 = n2(t3, e3);
    return i3 < 0 ? !1 : (i3 == t3.length - 1 ? t3.pop() : r2.call(t3, i3, 1), --this.size, !0);
  }
  t2.exports = i2;
}));
var Pt = i(((e2, t2) => {
  var n2 = Mt();
  function r2(e3) {
    var t3 = this.__data__, r3 = n2(t3, e3);
    return r3 < 0 ? void 0 : t3[r3][1];
  }
  t2.exports = r2;
}));
var Ft = i(((e2, t2) => {
  var n2 = Mt();
  function r2(e3) {
    return n2(this.__data__, e3) > -1;
  }
  t2.exports = r2;
}));
var It = i(((e2, t2) => {
  var n2 = Mt();
  function r2(e3, t3) {
    var r3 = this.__data__, i2 = n2(r3, e3);
    return i2 < 0 ? (++this.size, r3.push([e3, t3])) : r3[i2][1] = t3, this;
  }
  t2.exports = r2;
}));
var Lt = i(((e2, t2) => {
  var n2 = jt(), r2 = Nt(), i2 = Pt(), a2 = Ft(), o2 = It();
  function s2(e3) {
    var t3 = -1, n3 = e3 == null ? 0 : e3.length;
    for (this.clear(); ++t3 < n3; ) {
      var r3 = e3[t3];
      this.set(r3[0], r3[1]);
    }
  }
  s2.prototype.clear = n2, s2.prototype.delete = r2, s2.prototype.get = i2, s2.prototype.has = a2, s2.prototype.set = o2, t2.exports = s2;
}));
var Rt = i(((e2, t2) => {
  var n2 = At(), r2 = Lt(), i2 = Te();
  function a2() {
    this.size = 0, this.__data__ = { hash: new n2(), map: new (i2 || r2)(), string: new n2() };
  }
  t2.exports = a2;
}));
var zt = i(((e2, t2) => {
  function n2(e3) {
    var t3 = typeof e3;
    return t3 == "string" || t3 == "number" || t3 == "symbol" || t3 == "boolean" ? e3 !== "__proto__" : e3 === null;
  }
  t2.exports = n2;
}));
var Bt = i(((e2, t2) => {
  var n2 = zt();
  function r2(e3, t3) {
    var r3 = e3.__data__;
    return n2(t3) ? r3[typeof t3 == "string" ? "string" : "hash"] : r3.map;
  }
  t2.exports = r2;
}));
var Vt = i(((e2, t2) => {
  var n2 = Bt();
  function r2(e3) {
    var t3 = n2(this, e3).delete(e3);
    return this.size -= +!!t3, t3;
  }
  t2.exports = r2;
}));
var Ht = i(((e2, t2) => {
  var n2 = Bt();
  function r2(e3) {
    return n2(this, e3).get(e3);
  }
  t2.exports = r2;
}));
var Ut = i(((e2, t2) => {
  var n2 = Bt();
  function r2(e3) {
    return n2(this, e3).has(e3);
  }
  t2.exports = r2;
}));
var Wt = i(((e2, t2) => {
  var n2 = Bt();
  function r2(e3, t3) {
    var r3 = n2(this, e3), i2 = r3.size;
    return r3.set(e3, t3), this.size += r3.size == i2 ? 0 : 1, this;
  }
  t2.exports = r2;
}));
var Gt = i(((e2, t2) => {
  var n2 = Rt(), r2 = Vt(), i2 = Ht(), a2 = Ut(), o2 = Wt();
  function s2(e3) {
    var t3 = -1, n3 = e3 == null ? 0 : e3.length;
    for (this.clear(); ++t3 < n3; ) {
      var r3 = e3[t3];
      this.set(r3[0], r3[1]);
    }
  }
  s2.prototype.clear = n2, s2.prototype.delete = r2, s2.prototype.get = i2, s2.prototype.has = a2, s2.prototype.set = o2, t2.exports = s2;
}));
var Kt = i(((e2, t2) => {
  var n2 = Gt(), r2 = "Expected a function";
  function i2(e3, t3) {
    if (typeof e3 != "function" || t3 != null && typeof t3 != "function") throw TypeError(r2);
    var a2 = function() {
      var n3 = arguments, r3 = t3 ? t3.apply(this, n3) : n3[0], i3 = a2.cache;
      if (i3.has(r3)) return i3.get(r3);
      var o2 = e3.apply(this, n3);
      return a2.cache = i3.set(r3, o2) || i3, o2;
    };
    return a2.cache = new (i2.Cache || n2)(), a2;
  }
  i2.Cache = n2, t2.exports = i2;
}));
var qt = i(((e2, t2) => {
  var n2 = Kt(), r2 = 500;
  function i2(e3) {
    var t3 = n2(e3, function(e4) {
      return i3.size === r2 && i3.clear(), e4;
    }), i3 = t3.cache;
    return t3;
  }
  t2.exports = i2;
}));
var Jt = i(((e2, t2) => {
  var n2 = qt(), r2 = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, i2 = /\\(\\)?/g;
  t2.exports = n2(function(e3) {
    var t3 = [];
    return e3.charCodeAt(0) === 46 && t3.push(""), e3.replace(r2, function(e4, n3, r3, a2) {
      t3.push(r3 ? a2.replace(i2, "$1") : n3 || e4);
    }), t3;
  });
}));
var Yt = i(((e2, t2) => {
  var n2 = U(), r2 = Ct(), i2 = Jt(), a2 = Je();
  function o2(e3, t3) {
    return n2(e3) ? e3 : r2(e3, t3) ? [e3] : i2(a2(e3));
  }
  t2.exports = o2;
}));
var Xt = i(((e2, t2) => {
  var n2 = Ke(), r2 = 1 / 0;
  function i2(e3) {
    if (typeof e3 == "string" || n2(e3)) return e3;
    var t3 = e3 + "";
    return t3 == "0" && 1 / e3 == -r2 ? "-0" : t3;
  }
  t2.exports = i2;
}));
var Zt = i(((e2, t2) => {
  var n2 = Yt(), r2 = Xt();
  function i2(e3, t3) {
    t3 = n2(t3, e3);
    for (var i3 = 0, a2 = t3.length; e3 != null && i3 < a2; ) e3 = e3[r2(t3[i3++])];
    return i3 && i3 == a2 ? e3 : void 0;
  }
  t2.exports = i2;
}));
var Qt = i(((e2, t2) => {
  var n2 = Zt();
  function r2(e3, t3, r3) {
    var i2 = e3 == null ? void 0 : n2(e3, t3);
    return i2 === void 0 ? r3 : i2;
  }
  t2.exports = r2;
}));
var $t = i(((e2, t2) => {
  var n2 = Object.prototype.hasOwnProperty;
  function r2(e3, t3) {
    return e3 != null && n2.call(e3, t3);
  }
  t2.exports = r2;
}));
var en = i(((e2, t2) => {
  var n2 = Yt(), r2 = Me(), i2 = U(), a2 = dt(), o2 = Ne(), s2 = Xt();
  function c2(e3, t3, c3) {
    t3 = n2(t3, e3);
    for (var l2 = -1, u2 = t3.length, d2 = !1; ++l2 < u2; ) {
      var f2 = s2(t3[l2]);
      if (!(d2 = e3 != null && c3(e3, f2))) break;
      e3 = e3[f2];
    }
    return d2 || ++l2 != u2 ? d2 : (u2 = e3 == null ? 0 : e3.length, !!u2 && o2(u2) && a2(f2, u2) && (i2(e3) || r2(e3)));
  }
  t2.exports = c2;
}));
var tn = i(((e2, t2) => {
  var n2 = $t(), r2 = en();
  function i2(e3, t3) {
    return e3 != null && r2(e3, t3, n2);
  }
  t2.exports = i2;
}));
var nn = i(((e2, t2) => {
  var n2 = Lt();
  function r2() {
    this.__data__ = new n2(), this.size = 0;
  }
  t2.exports = r2;
}));
var rn = i(((e2, t2) => {
  function n2(e3) {
    var t3 = this.__data__, n3 = t3.delete(e3);
    return this.size = t3.size, n3;
  }
  t2.exports = n2;
}));
var an = i(((e2, t2) => {
  function n2(e3) {
    return this.__data__.get(e3);
  }
  t2.exports = n2;
}));
var on = i(((e2, t2) => {
  function n2(e3) {
    return this.__data__.has(e3);
  }
  t2.exports = n2;
}));
var sn = i(((e2, t2) => {
  var n2 = Lt(), r2 = Te(), i2 = Gt(), a2 = 200;
  function o2(e3, t3) {
    var o3 = this.__data__;
    if (o3 instanceof n2) {
      var s2 = o3.__data__;
      if (!r2 || s2.length < a2 - 1) return s2.push([e3, t3]), this.size = ++o3.size, this;
      o3 = this.__data__ = new i2(s2);
    }
    return o3.set(e3, t3), this.size = o3.size, this;
  }
  t2.exports = o2;
}));
var cn = i(((e2, t2) => {
  var n2 = Lt(), r2 = nn(), i2 = rn(), a2 = an(), o2 = on(), s2 = sn();
  function c2(e3) {
    var t3 = this.__data__ = new n2(e3);
    this.size = t3.size;
  }
  c2.prototype.clear = r2, c2.prototype.delete = i2, c2.prototype.get = a2, c2.prototype.has = o2, c2.prototype.set = s2, t2.exports = c2;
}));
var ln = i(((e2, t2) => {
  function n2(e3) {
    return this.__data__.set(e3, "__lodash_hash_undefined__"), this;
  }
  t2.exports = n2;
}));
var un = i(((e2, t2) => {
  function n2(e3) {
    return this.__data__.has(e3);
  }
  t2.exports = n2;
}));
var dn = i(((e2, t2) => {
  var n2 = Gt(), r2 = ln(), i2 = un();
  function a2(e3) {
    var t3 = -1, r3 = e3 == null ? 0 : e3.length;
    for (this.__data__ = new n2(); ++t3 < r3; ) this.add(e3[t3]);
  }
  a2.prototype.add = a2.prototype.push = r2, a2.prototype.has = i2, t2.exports = a2;
}));
var fn = i(((e2, t2) => {
  function n2(e3, t3) {
    for (var n3 = -1, r2 = e3 == null ? 0 : e3.length; ++n3 < r2; ) if (t3(e3[n3], n3, e3)) return !0;
    return !1;
  }
  t2.exports = n2;
}));
var pn = i(((e2, t2) => {
  function n2(e3, t3) {
    return e3.has(t3);
  }
  t2.exports = n2;
}));
var mn = i(((e2, t2) => {
  var n2 = dn(), r2 = fn(), i2 = pn(), a2 = 1, o2 = 2;
  function s2(e3, t3, s3, c2, l2, u2) {
    var d2 = s3 & a2, f2 = e3.length, p2 = t3.length;
    if (f2 != p2 && !(d2 && p2 > f2)) return !1;
    var m2 = u2.get(e3), h2 = u2.get(t3);
    if (m2 && h2) return m2 == t3 && h2 == e3;
    var g2 = -1, _2 = !0, v2 = s3 & o2 ? new n2() : void 0;
    for (u2.set(e3, t3), u2.set(t3, e3); ++g2 < f2; ) {
      var y2 = e3[g2], b2 = t3[g2];
      if (c2) var x2 = d2 ? c2(b2, y2, g2, t3, e3, u2) : c2(y2, b2, g2, e3, t3, u2);
      if (x2 !== void 0) {
        if (x2) continue;
        _2 = !1;
        break;
      }
      if (v2) {
        if (!r2(t3, function(e4, t4) {
          if (!i2(v2, t4) && (y2 === e4 || l2(y2, e4, s3, c2, u2))) return v2.push(t4);
        })) {
          _2 = !1;
          break;
        }
      } else if (!(y2 === b2 || l2(y2, b2, s3, c2, u2))) {
        _2 = !1;
        break;
      }
    }
    return u2.delete(e3), u2.delete(t3), _2;
  }
  t2.exports = s2;
}));
var hn = i(((e2, t2) => {
  t2.exports = H().Uint8Array;
}));
var gn = i(((e2, t2) => {
  function n2(e3) {
    var t3 = -1, n3 = Array(e3.size);
    return e3.forEach(function(e4, r2) {
      n3[++t3] = [r2, e4];
    }), n3;
  }
  t2.exports = n2;
}));
var _n = i(((e2, t2) => {
  function n2(e3) {
    var t3 = -1, n3 = Array(e3.size);
    return e3.forEach(function(e4) {
      n3[++t3] = e4;
    }), n3;
  }
  t2.exports = n2;
}));
var vn = i(((e2, t2) => {
  var n2 = fe(), r2 = hn(), i2 = ht(), a2 = mn(), o2 = gn(), s2 = _n(), c2 = 1, l2 = 2, u2 = "[object Boolean]", d2 = "[object Date]", f2 = "[object Error]", p2 = "[object Map]", m2 = "[object Number]", h2 = "[object RegExp]", g2 = "[object Set]", _2 = "[object String]", v2 = "[object Symbol]", y2 = "[object ArrayBuffer]", b2 = "[object DataView]", x2 = n2 ? n2.prototype : void 0, S2 = x2 ? x2.valueOf : void 0;
  function C2(e3, t3, n3, x3, C3, w2, T2) {
    switch (n3) {
      case b2:
        if (e3.byteLength != t3.byteLength || e3.byteOffset != t3.byteOffset) return !1;
        e3 = e3.buffer, t3 = t3.buffer;
      case y2:
        return !(e3.byteLength != t3.byteLength || !w2(new r2(e3), new r2(t3)));
      case u2:
      case d2:
      case m2:
        return i2(+e3, +t3);
      case f2:
        return e3.name == t3.name && e3.message == t3.message;
      case h2:
      case _2:
        return e3 == t3 + "";
      case p2:
        var E2 = o2;
      case g2:
        var D2 = x3 & c2;
        if (E2 ||= s2, e3.size != t3.size && !D2) return !1;
        var O2 = T2.get(e3);
        if (O2) return O2 == t3;
        x3 |= l2, T2.set(e3, t3);
        var k2 = a2(E2(e3), E2(t3), x3, C3, w2, T2);
        return T2.delete(e3), k2;
      case v2:
        if (S2) return S2.call(e3) == S2.call(t3);
    }
    return !1;
  }
  t2.exports = C2;
}));
var yn = i(((e2, t2) => {
  function n2(e3, t3) {
    for (var n3 = -1, r2 = t3.length, i2 = e3.length; ++n3 < r2; ) e3[i2 + n3] = t3[n3];
    return e3;
  }
  t2.exports = n2;
}));
var bn = i(((e2, t2) => {
  var n2 = yn(), r2 = U();
  function i2(e3, t3, i3) {
    var a2 = t3(e3);
    return r2(e3) ? a2 : n2(a2, i3(e3));
  }
  t2.exports = i2;
}));
var xn = i(((e2, t2) => {
  function n2(e3, t3) {
    for (var n3 = -1, r2 = e3 == null ? 0 : e3.length, i2 = 0, a2 = []; ++n3 < r2; ) {
      var o2 = e3[n3];
      t3(o2, n3, e3) && (a2[i2++] = o2);
    }
    return a2;
  }
  t2.exports = n2;
}));
var Sn = i(((e2, t2) => {
  function n2() {
    return [];
  }
  t2.exports = n2;
}));
var Cn = i(((e2, t2) => {
  var n2 = xn(), r2 = Sn(), i2 = Object.prototype.propertyIsEnumerable, a2 = Object.getOwnPropertySymbols;
  t2.exports = a2 ? function(e3) {
    return e3 == null ? [] : (e3 = Object(e3), n2(a2(e3), function(t3) {
      return i2.call(e3, t3);
    }));
  } : r2;
}));
var wn = i(((e2, t2) => {
  var n2 = bn(), r2 = Cn(), i2 = pt();
  function a2(e3) {
    return n2(e3, i2, r2);
  }
  t2.exports = a2;
}));
var Tn = i(((e2, t2) => {
  var n2 = wn(), r2 = 1, i2 = Object.prototype.hasOwnProperty;
  function a2(e3, t3, a3, o2, s2, c2) {
    var l2 = a3 & r2, u2 = n2(e3), d2 = u2.length;
    if (d2 != n2(t3).length && !l2) return !1;
    for (var f2 = d2; f2--; ) {
      var p2 = u2[f2];
      if (!(l2 ? p2 in t3 : i2.call(t3, p2))) return !1;
    }
    var m2 = c2.get(e3), h2 = c2.get(t3);
    if (m2 && h2) return m2 == t3 && h2 == e3;
    var g2 = !0;
    c2.set(e3, t3), c2.set(t3, e3);
    for (var _2 = l2; ++f2 < d2; ) {
      p2 = u2[f2];
      var v2 = e3[p2], y2 = t3[p2];
      if (o2) var b2 = l2 ? o2(y2, v2, p2, t3, e3, c2) : o2(v2, y2, p2, e3, t3, c2);
      if (!(b2 === void 0 ? v2 === y2 || s2(v2, y2, a3, o2, c2) : b2)) {
        g2 = !1;
        break;
      }
      _2 ||= p2 == "constructor";
    }
    if (g2 && !_2) {
      var x2 = e3.constructor, S2 = t3.constructor;
      x2 != S2 && "constructor" in e3 && "constructor" in t3 && !(typeof x2 == "function" && x2 instanceof x2 && typeof S2 == "function" && S2 instanceof S2) && (g2 = !1);
    }
    return c2.delete(e3), c2.delete(t3), g2;
  }
  t2.exports = a2;
}));
var En = i(((e2, t2) => {
  var n2 = cn(), r2 = mn(), i2 = vn(), a2 = Tn(), o2 = ke(), s2 = U(), c2 = Ie(), l2 = Be(), u2 = 1, d2 = "[object Arguments]", f2 = "[object Array]", p2 = "[object Object]", m2 = Object.prototype.hasOwnProperty;
  function h2(e3, t3, h3, g2, _2, v2) {
    var y2 = s2(e3), b2 = s2(t3), x2 = y2 ? f2 : o2(e3), S2 = b2 ? f2 : o2(t3);
    x2 = x2 == d2 ? p2 : x2, S2 = S2 == d2 ? p2 : S2;
    var C2 = x2 == p2, w2 = S2 == p2, T2 = x2 == S2;
    if (T2 && c2(e3)) {
      if (!c2(t3)) return !1;
      y2 = !0, C2 = !1;
    }
    if (T2 && !C2) return v2 ||= new n2(), y2 || l2(e3) ? r2(e3, t3, h3, g2, _2, v2) : i2(e3, t3, x2, h3, g2, _2, v2);
    if (!(h3 & u2)) {
      var E2 = C2 && m2.call(e3, "__wrapped__"), D2 = w2 && m2.call(t3, "__wrapped__");
      if (E2 || D2) {
        var O2 = E2 ? e3.value() : e3, k2 = D2 ? t3.value() : t3;
        return v2 ||= new n2(), _2(O2, k2, h3, g2, v2);
      }
    }
    return T2 ? (v2 ||= new n2(), a2(e3, t3, h3, g2, _2, v2)) : !1;
  }
  t2.exports = h2;
}));
var Dn = i(((e2, t2) => {
  var n2 = En(), r2 = Ae();
  function i2(e3, t3, a2, o2, s2) {
    return e3 === t3 ? !0 : e3 == null || t3 == null || !r2(e3) && !r2(t3) ? e3 !== e3 && t3 !== t3 : n2(e3, t3, a2, o2, i2, s2);
  }
  t2.exports = i2;
}));
var On = i(((e2, t2) => {
  var n2 = cn(), r2 = Dn(), i2 = 1, a2 = 2;
  function o2(e3, t3, o3, s2) {
    var c2 = o3.length, l2 = c2, u2 = !s2;
    if (e3 == null) return !l2;
    for (e3 = Object(e3); c2--; ) {
      var d2 = o3[c2];
      if (u2 && d2[2] ? d2[1] !== e3[d2[0]] : !(d2[0] in e3)) return !1;
    }
    for (; ++c2 < l2; ) {
      d2 = o3[c2];
      var f2 = d2[0], p2 = e3[f2], m2 = d2[1];
      if (u2 && d2[2]) {
        if (p2 === void 0 && !(f2 in e3)) return !1;
      } else {
        var h2 = new n2();
        if (s2) var g2 = s2(p2, m2, f2, e3, t3, h2);
        if (!(g2 === void 0 ? r2(m2, p2, i2 | a2, s2, h2) : g2)) return !1;
      }
    }
    return !0;
  }
  t2.exports = o2;
}));
var kn = i(((e2, t2) => {
  var n2 = ge();
  function r2(e3) {
    return e3 === e3 && !n2(e3);
  }
  t2.exports = r2;
}));
var An = i(((e2, t2) => {
  var n2 = kn(), r2 = pt();
  function i2(e3) {
    for (var t3 = r2(e3), i3 = t3.length; i3--; ) {
      var a2 = t3[i3], o2 = e3[a2];
      t3[i3] = [a2, o2, n2(o2)];
    }
    return t3;
  }
  t2.exports = i2;
}));
var jn = i(((e2, t2) => {
  function n2(e3, t3) {
    return function(n3) {
      return n3 != null && n3[e3] === t3 && (t3 !== void 0 || e3 in Object(n3));
    };
  }
  t2.exports = n2;
}));
var Mn = i(((e2, t2) => {
  var n2 = On(), r2 = An(), i2 = jn();
  function a2(e3) {
    var t3 = r2(e3);
    return t3.length == 1 && t3[0][2] ? i2(t3[0][0], t3[0][1]) : function(r3) {
      return r3 === e3 || n2(r3, e3, t3);
    };
  }
  t2.exports = a2;
}));
var Nn = i(((e2, t2) => {
  function n2(e3, t3) {
    return e3 != null && t3 in Object(e3);
  }
  t2.exports = n2;
}));
var Pn = i(((e2, t2) => {
  var n2 = Nn(), r2 = en();
  function i2(e3, t3) {
    return e3 != null && r2(e3, t3, n2);
  }
  t2.exports = i2;
}));
var Fn = i(((e2, t2) => {
  var n2 = Dn(), r2 = Qt(), i2 = Pn(), a2 = Ct(), o2 = kn(), s2 = jn(), c2 = Xt(), l2 = 1, u2 = 2;
  function d2(e3, t3) {
    return a2(e3) && o2(t3) ? s2(c2(e3), t3) : function(a3) {
      var o3 = r2(a3, e3);
      return o3 === void 0 && o3 === t3 ? i2(a3, e3) : n2(t3, o3, l2 | u2);
    };
  }
  t2.exports = d2;
}));
var In = i(((e2, t2) => {
  function n2(e3) {
    return e3;
  }
  t2.exports = n2;
}));
var Ln = i(((e2, t2) => {
  function n2(e3) {
    return function(t3) {
      return t3?.[e3];
    };
  }
  t2.exports = n2;
}));
var Rn = i(((e2, t2) => {
  var n2 = Zt();
  function r2(e3) {
    return function(t3) {
      return n2(t3, e3);
    };
  }
  t2.exports = r2;
}));
var zn = i(((e2, t2) => {
  var n2 = Ln(), r2 = Rn(), i2 = Ct(), a2 = Xt();
  function o2(e3) {
    return i2(e3) ? n2(a2(e3)) : r2(e3);
  }
  t2.exports = o2;
}));
var Bn = i(((e2, t2) => {
  var n2 = Mn(), r2 = Fn(), i2 = In(), a2 = U(), o2 = zn();
  function s2(e3) {
    return typeof e3 == "function" ? e3 : e3 == null ? i2 : typeof e3 == "object" ? a2(e3) ? r2(e3[0], e3[1]) : n2(e3) : o2(e3);
  }
  t2.exports = s2;
}));
var Vn = i(((e2, t2) => {
  var n2 = Bn(), r2 = Pe(), i2 = pt();
  function a2(e3) {
    return function(t3, a3, o2) {
      var s2 = Object(t3);
      if (!r2(t3)) {
        var c2 = n2(a3, 3);
        t3 = i2(t3), a3 = function(e4) {
          return c2(s2[e4], e4, s2);
        };
      }
      var l2 = e3(t3, a3, o2);
      return l2 > -1 ? s2[c2 ? t3[l2] : l2] : void 0;
    };
  }
  t2.exports = a2;
}));
var Hn = i(((e2, t2) => {
  function n2(e3, t3, n3, r2) {
    for (var i2 = e3.length, a2 = n3 + (r2 ? 1 : -1); r2 ? a2-- : ++a2 < i2; ) if (t3(e3[a2], a2, e3)) return a2;
    return -1;
  }
  t2.exports = n2;
}));
var Un = i(((e2, t2) => {
  var n2 = bt();
  function r2(e3) {
    var t3 = n2(e3), r3 = t3 % 1;
    return t3 === t3 ? r3 ? t3 - r3 : t3 : 0;
  }
  t2.exports = r2;
}));
var Wn = i(((e2, t2) => {
  var n2 = Hn(), r2 = Bn(), i2 = Un(), a2 = Math.max;
  function o2(e3, t3, o3) {
    var s2 = e3 == null ? 0 : e3.length;
    if (!s2) return -1;
    var c2 = o3 == null ? 0 : i2(o3);
    return c2 < 0 && (c2 = a2(s2 + c2, 0)), n2(e3, r2(t3, 3), c2);
  }
  t2.exports = o2;
}));
var Gn = i(((e2, t2) => {
  t2.exports = Vn()(Wn());
}));
var Kn = i(((e2, t2) => {
  function n2(e3) {
    return e3 !== e3;
  }
  t2.exports = n2;
}));
var qn = i(((e2, t2) => {
  function n2(e3, t3, n3) {
    for (var r2 = n3 - 1, i2 = e3.length; ++r2 < i2; ) if (e3[r2] === t3) return r2;
    return -1;
  }
  t2.exports = n2;
}));
var Jn = i(((e2, t2) => {
  var n2 = Hn(), r2 = Kn(), i2 = qn();
  function a2(e3, t3, a3) {
    return t3 === t3 ? i2(e3, t3, a3) : n2(e3, r2, a3);
  }
  t2.exports = a2;
}));
var Yn = i(((e2, t2) => {
  var n2 = he(), r2 = U(), i2 = Ae(), a2 = "[object String]";
  function o2(e3) {
    return typeof e3 == "string" || !r2(e3) && i2(e3) && n2(e3) == a2;
  }
  t2.exports = o2;
}));
var Xn = i(((e2, t2) => {
  var n2 = Ge();
  function r2(e3, t3) {
    return n2(t3, function(t4) {
      return e3[t4];
    });
  }
  t2.exports = r2;
}));
var Zn = i(((e2, t2) => {
  var n2 = Xn(), r2 = pt();
  function i2(e3) {
    return e3 == null ? [] : n2(e3, r2(e3));
  }
  t2.exports = i2;
}));
var Qn = i(((e2, t2) => {
  var n2 = Jn(), r2 = Pe(), i2 = Yn(), a2 = Un(), o2 = Zn(), s2 = Math.max;
  function c2(e3, t3, c3, l2) {
    e3 = r2(e3) ? e3 : o2(e3), c3 = c3 && !l2 ? a2(c3) : 0;
    var u2 = e3.length;
    return c3 < 0 && (c3 = s2(u2 + c3, 0)), i2(e3) ? c3 <= u2 && e3.indexOf(t3, c3) > -1 : !!u2 && n2(e3, t3, c3) > -1;
  }
  t2.exports = c2;
}));
var $n = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.regexpCode = e2.getEsmExportName = e2.getProperty = e2.safeStringify = e2.stringify = e2.strConcat = e2.addCodeArg = e2.str = e2._ = e2.nil = e2._Code = e2.Name = e2.IDENTIFIER = e2._CodeOrName = void 0;
  var t2 = class {
  };
  e2._CodeOrName = t2, e2.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  var n2 = class extends t2 {
    constructor(t3) {
      if (super(), !e2.IDENTIFIER.test(t3)) throw Error("CodeGen: name must be a valid identifier");
      this.str = t3;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return !1;
    }
    get names() {
      return { [this.str]: 1 };
    }
  };
  e2.Name = n2;
  var r2 = class extends t2 {
    constructor(e3) {
      super(), this._items = typeof e3 == "string" ? [e3] : e3;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1) return !1;
      let e3 = this._items[0];
      return e3 === "" || e3 === '""';
    }
    get str() {
      return this._str ??= this._items.reduce((e3, t3) => `${e3}${t3}`, "");
    }
    get names() {
      return this._names ??= this._items.reduce((e3, t3) => (t3 instanceof n2 && (e3[t3.str] = (e3[t3.str] || 0) + 1), e3), {});
    }
  };
  e2._Code = r2, e2.nil = new r2("");
  function i2(e3, ...t3) {
    let n3 = [e3[0]], i3 = 0;
    for (; i3 < t3.length; ) s2(n3, t3[i3]), n3.push(e3[++i3]);
    return new r2(n3);
  }
  e2._ = i2;
  var a2 = new r2("+");
  function o2(e3, ...t3) {
    let n3 = [p2(e3[0])], i3 = 0;
    for (; i3 < t3.length; ) n3.push(a2), s2(n3, t3[i3]), n3.push(a2, p2(e3[++i3]));
    return c2(n3), new r2(n3);
  }
  e2.str = o2;
  function s2(e3, t3) {
    t3 instanceof r2 ? e3.push(...t3._items) : t3 instanceof n2 ? e3.push(t3) : e3.push(d2(t3));
  }
  e2.addCodeArg = s2;
  function c2(e3) {
    let t3 = 1;
    for (; t3 < e3.length - 1; ) {
      if (e3[t3] === a2) {
        let n3 = l2(e3[t3 - 1], e3[t3 + 1]);
        if (n3 !== void 0) {
          e3.splice(t3 - 1, 3, n3);
          continue;
        }
        e3[t3++] = "+";
      }
      t3++;
    }
  }
  function l2(e3, t3) {
    if (t3 === '""') return e3;
    if (e3 === '""') return t3;
    if (typeof e3 == "string") return t3 instanceof n2 || e3[e3.length - 1] !== '"' ? void 0 : typeof t3 == "string" ? t3[0] === '"' ? e3.slice(0, -1) + t3.slice(1) : void 0 : `${e3.slice(0, -1)}${t3}"`;
    if (typeof t3 == "string" && t3[0] === '"' && !(e3 instanceof n2)) return `"${e3}${t3.slice(1)}`;
  }
  function u2(e3, t3) {
    return t3.emptyStr() ? e3 : e3.emptyStr() ? t3 : o2`${e3}${t3}`;
  }
  e2.strConcat = u2;
  function d2(e3) {
    return typeof e3 == "number" || typeof e3 == "boolean" || e3 === null ? e3 : p2(Array.isArray(e3) ? e3.join(",") : e3);
  }
  function f2(e3) {
    return new r2(p2(e3));
  }
  e2.stringify = f2;
  function p2(e3) {
    return JSON.stringify(e3).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  e2.safeStringify = p2;
  function m2(t3) {
    return typeof t3 == "string" && e2.IDENTIFIER.test(t3) ? new r2(`.${t3}`) : i2`[${t3}]`;
  }
  e2.getProperty = m2;
  function h2(t3) {
    if (typeof t3 == "string" && e2.IDENTIFIER.test(t3)) return new r2(`${t3}`);
    throw Error(`CodeGen: invalid export name: ${t3}, use explicit $id name mapping`);
  }
  e2.getEsmExportName = h2;
  function g2(e3) {
    return new r2(e3.toString());
  }
  e2.regexpCode = g2;
}));
var er = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.ValueScope = e2.ValueScopeName = e2.Scope = e2.varKinds = e2.UsedValueState = void 0;
  var t2 = $n(), n2 = class extends Error {
    constructor(e3) {
      super(`CodeGen: "code" for ${e3} not defined`), this.value = e3.value;
    }
  }, r2;
  (function(e3) {
    e3[e3.Started = 0] = "Started", e3[e3.Completed = 1] = "Completed";
  })(r2 || (e2.UsedValueState = r2 = {})), e2.varKinds = { const: new t2.Name("const"), let: new t2.Name("let"), var: new t2.Name("var") };
  var i2 = class {
    constructor({ prefixes: e3, parent: t3 } = {}) {
      this._names = {}, this._prefixes = e3, this._parent = t3;
    }
    toName(e3) {
      return e3 instanceof t2.Name ? e3 : this.name(e3);
    }
    name(e3) {
      return new t2.Name(this._newName(e3));
    }
    _newName(e3) {
      let t3 = this._names[e3] || this._nameGroup(e3);
      return `${e3}${t3.index++}`;
    }
    _nameGroup(e3) {
      if (this._parent?._prefixes?.has(e3) || this._prefixes && !this._prefixes.has(e3)) throw Error(`CodeGen: prefix "${e3}" is not allowed in this scope`);
      return this._names[e3] = { prefix: e3, index: 0 };
    }
  };
  e2.Scope = i2;
  var a2 = class extends t2.Name {
    constructor(e3, t3) {
      super(t3), this.prefix = e3;
    }
    setValue(e3, { property: n3, itemIndex: r3 }) {
      this.value = e3, this.scopePath = (0, t2._)`.${new t2.Name(n3)}[${r3}]`;
    }
  };
  e2.ValueScopeName = a2;
  var o2 = (0, t2._)`\n`;
  e2.ValueScope = class extends i2 {
    constructor(e3) {
      super(e3), this._values = {}, this._scope = e3.scope, this.opts = { ...e3, _n: e3.lines ? o2 : t2.nil };
    }
    get() {
      return this._scope;
    }
    name(e3) {
      return new a2(e3, this._newName(e3));
    }
    value(e3, t3) {
      if (t3.ref === void 0) throw Error("CodeGen: ref must be passed in value");
      let n3 = this.toName(e3), { prefix: r3 } = n3, i3 = t3.key ?? t3.ref, a3 = this._values[r3];
      if (a3) {
        let e4 = a3.get(i3);
        if (e4) return e4;
      } else a3 = this._values[r3] = /* @__PURE__ */ new Map();
      a3.set(i3, n3);
      let o3 = this._scope[r3] || (this._scope[r3] = []), s2 = o3.length;
      return o3[s2] = t3.ref, n3.setValue(t3, { property: r3, itemIndex: s2 }), n3;
    }
    getValue(e3, t3) {
      let n3 = this._values[e3];
      if (n3) return n3.get(t3);
    }
    scopeRefs(e3, n3 = this._values) {
      return this._reduceValues(n3, (n4) => {
        if (n4.scopePath === void 0) throw Error(`CodeGen: name "${n4}" has no value`);
        return (0, t2._)`${e3}${n4.scopePath}`;
      });
    }
    scopeCode(e3 = this._values, t3, n3) {
      return this._reduceValues(e3, (e4) => {
        if (e4.value === void 0) throw Error(`CodeGen: name "${e4}" has no value`);
        return e4.value.code;
      }, t3, n3);
    }
    _reduceValues(i3, a3, o3 = {}, s2) {
      let c2 = t2.nil;
      for (let l2 in i3) {
        let u2 = i3[l2];
        if (!u2) continue;
        let d2 = o3[l2] = o3[l2] || /* @__PURE__ */ new Map();
        u2.forEach((i4) => {
          if (d2.has(i4)) return;
          d2.set(i4, r2.Started);
          let o4 = a3(i4);
          if (o4) {
            let n3 = this.opts.es5 ? e2.varKinds.var : e2.varKinds.const;
            c2 = (0, t2._)`${c2}${n3} ${i4} = ${o4};${this.opts._n}`;
          } else if (o4 = s2?.(i4)) c2 = (0, t2._)`${c2}${o4}${this.opts._n}`;
          else throw new n2(i4);
          d2.set(i4, r2.Completed);
        });
      }
      return c2;
    }
  };
}));
var W = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.or = e2.and = e2.not = e2.CodeGen = e2.operators = e2.varKinds = e2.ValueScopeName = e2.ValueScope = e2.Scope = e2.Name = e2.regexpCode = e2.stringify = e2.getProperty = e2.nil = e2.strConcat = e2.str = e2._ = void 0;
  var t2 = $n(), n2 = er(), r2 = $n();
  Object.defineProperty(e2, "_", { enumerable: !0, get: function() {
    return r2._;
  } }), Object.defineProperty(e2, "str", { enumerable: !0, get: function() {
    return r2.str;
  } }), Object.defineProperty(e2, "strConcat", { enumerable: !0, get: function() {
    return r2.strConcat;
  } }), Object.defineProperty(e2, "nil", { enumerable: !0, get: function() {
    return r2.nil;
  } }), Object.defineProperty(e2, "getProperty", { enumerable: !0, get: function() {
    return r2.getProperty;
  } }), Object.defineProperty(e2, "stringify", { enumerable: !0, get: function() {
    return r2.stringify;
  } }), Object.defineProperty(e2, "regexpCode", { enumerable: !0, get: function() {
    return r2.regexpCode;
  } }), Object.defineProperty(e2, "Name", { enumerable: !0, get: function() {
    return r2.Name;
  } });
  var i2 = er();
  Object.defineProperty(e2, "Scope", { enumerable: !0, get: function() {
    return i2.Scope;
  } }), Object.defineProperty(e2, "ValueScope", { enumerable: !0, get: function() {
    return i2.ValueScope;
  } }), Object.defineProperty(e2, "ValueScopeName", { enumerable: !0, get: function() {
    return i2.ValueScopeName;
  } }), Object.defineProperty(e2, "varKinds", { enumerable: !0, get: function() {
    return i2.varKinds;
  } }), e2.operators = { GT: new t2._Code(">"), GTE: new t2._Code(">="), LT: new t2._Code("<"), LTE: new t2._Code("<="), EQ: new t2._Code("==="), NEQ: new t2._Code("!=="), NOT: new t2._Code("!"), OR: new t2._Code("||"), AND: new t2._Code("&&"), ADD: new t2._Code("+") };
  var a2 = class {
    optimizeNodes() {
      return this;
    }
    optimizeNames(e3, t3) {
      return this;
    }
  }, o2 = class extends a2 {
    constructor(e3, t3, n3) {
      super(), this.varKind = e3, this.name = t3, this.rhs = n3;
    }
    render({ es5: e3, _n: t3 }) {
      let r3 = e3 ? n2.varKinds.var : this.varKind, i3 = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
      return `${r3} ${this.name}${i3};` + t3;
    }
    optimizeNames(e3, t3) {
      if (e3[this.name.str]) return this.rhs &&= k2(this.rhs, e3, t3), this;
    }
    get names() {
      return this.rhs instanceof t2._CodeOrName ? this.rhs.names : {};
    }
  }, s2 = class extends a2 {
    constructor(e3, t3, n3) {
      super(), this.lhs = e3, this.rhs = t3, this.sideEffects = n3;
    }
    render({ _n: e3 }) {
      return `${this.lhs} = ${this.rhs};` + e3;
    }
    optimizeNames(e3, n3) {
      if (!(this.lhs instanceof t2.Name && !e3[this.lhs.str] && !this.sideEffects)) return this.rhs = k2(this.rhs, e3, n3), this;
    }
    get names() {
      return O2(this.lhs instanceof t2.Name ? {} : { ...this.lhs.names }, this.rhs);
    }
  }, c2 = class extends s2 {
    constructor(e3, t3, n3, r3) {
      super(e3, n3, r3), this.op = t3;
    }
    render({ _n: e3 }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + e3;
    }
  }, l2 = class extends a2 {
    constructor(e3) {
      super(), this.label = e3, this.names = {};
    }
    render({ _n: e3 }) {
      return `${this.label}:` + e3;
    }
  }, u2 = class extends a2 {
    constructor(e3) {
      super(), this.label = e3, this.names = {};
    }
    render({ _n: e3 }) {
      return `break${this.label ? ` ${this.label}` : ""};` + e3;
    }
  }, d2 = class extends a2 {
    constructor(e3) {
      super(), this.error = e3;
    }
    render({ _n: e3 }) {
      return `throw ${this.error};` + e3;
    }
    get names() {
      return this.error.names;
    }
  }, f2 = class extends a2 {
    constructor(e3) {
      super(), this.code = e3;
    }
    render({ _n: e3 }) {
      return `${this.code};` + e3;
    }
    optimizeNodes() {
      return `${this.code}` ? this : void 0;
    }
    optimizeNames(e3, t3) {
      return this.code = k2(this.code, e3, t3), this;
    }
    get names() {
      return this.code instanceof t2._CodeOrName ? this.code.names : {};
    }
  }, p2 = class extends a2 {
    constructor(e3 = []) {
      super(), this.nodes = e3;
    }
    render(e3) {
      return this.nodes.reduce((t3, n3) => t3 + n3.render(e3), "");
    }
    optimizeNodes() {
      let { nodes: e3 } = this, t3 = e3.length;
      for (; t3--; ) {
        let n3 = e3[t3].optimizeNodes();
        Array.isArray(n3) ? e3.splice(t3, 1, ...n3) : n3 ? e3[t3] = n3 : e3.splice(t3, 1);
      }
      return e3.length > 0 ? this : void 0;
    }
    optimizeNames(e3, t3) {
      let { nodes: n3 } = this, r3 = n3.length;
      for (; r3--; ) {
        let i3 = n3[r3];
        i3.optimizeNames(e3, t3) || (A2(e3, i3.names), n3.splice(r3, 1));
      }
      return n3.length > 0 ? this : void 0;
    }
    get names() {
      return this.nodes.reduce((e3, t3) => D2(e3, t3.names), {});
    }
  }, m2 = class extends p2 {
    render(e3) {
      return "{" + e3._n + super.render(e3) + "}" + e3._n;
    }
  }, h2 = class extends p2 {
  }, g2 = class extends m2 {
  };
  g2.kind = "else";
  var _2 = class e3 extends m2 {
    constructor(e4, t3) {
      super(t3), this.condition = e4;
    }
    render(e4) {
      let t3 = `if(${this.condition})` + super.render(e4);
      return this.else && (t3 += "else " + this.else.render(e4)), t3;
    }
    optimizeNodes() {
      super.optimizeNodes();
      let t3 = this.condition;
      if (t3 === !0) return this.nodes;
      let n3 = this.else;
      if (n3) {
        let e4 = n3.optimizeNodes();
        n3 = this.else = Array.isArray(e4) ? new g2(e4) : e4;
      }
      if (n3) return t3 === !1 ? n3 instanceof e3 ? n3 : n3.nodes : this.nodes.length ? this : new e3(j2(t3), n3 instanceof e3 ? [n3] : n3.nodes);
      if (t3 !== !1 && this.nodes.length) return this;
    }
    optimizeNames(e4, t3) {
      if (this.else = this.else?.optimizeNames(e4, t3), super.optimizeNames(e4, t3) || this.else) return this.condition = k2(this.condition, e4, t3), this;
    }
    get names() {
      let e4 = super.names;
      return O2(e4, this.condition), this.else && D2(e4, this.else.names), e4;
    }
  };
  _2.kind = "if";
  var v2 = class extends m2 {
  };
  v2.kind = "for";
  var y2 = class extends v2 {
    constructor(e3) {
      super(), this.iteration = e3;
    }
    render(e3) {
      return `for(${this.iteration})` + super.render(e3);
    }
    optimizeNames(e3, t3) {
      if (super.optimizeNames(e3, t3)) return this.iteration = k2(this.iteration, e3, t3), this;
    }
    get names() {
      return D2(super.names, this.iteration.names);
    }
  }, b2 = class extends v2 {
    constructor(e3, t3, n3, r3) {
      super(), this.varKind = e3, this.name = t3, this.from = n3, this.to = r3;
    }
    render(e3) {
      let t3 = e3.es5 ? n2.varKinds.var : this.varKind, { name: r3, from: i3, to: a3 } = this;
      return `for(${t3} ${r3}=${i3}; ${r3}<${a3}; ${r3}++)` + super.render(e3);
    }
    get names() {
      return O2(O2(super.names, this.from), this.to);
    }
  }, x2 = class extends v2 {
    constructor(e3, t3, n3, r3) {
      super(), this.loop = e3, this.varKind = t3, this.name = n3, this.iterable = r3;
    }
    render(e3) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(e3);
    }
    optimizeNames(e3, t3) {
      if (super.optimizeNames(e3, t3)) return this.iterable = k2(this.iterable, e3, t3), this;
    }
    get names() {
      return D2(super.names, this.iterable.names);
    }
  }, S2 = class extends m2 {
    constructor(e3, t3, n3) {
      super(), this.name = e3, this.args = t3, this.async = n3;
    }
    render(e3) {
      return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(e3);
    }
  };
  S2.kind = "func";
  var C2 = class extends p2 {
    render(e3) {
      return "return " + super.render(e3);
    }
  };
  C2.kind = "return";
  var w2 = class extends m2 {
    render(e3) {
      let t3 = "try" + super.render(e3);
      return this.catch && (t3 += this.catch.render(e3)), this.finally && (t3 += this.finally.render(e3)), t3;
    }
    optimizeNodes() {
      var e3, t3;
      return super.optimizeNodes(), (e3 = this.catch) == null || e3.optimizeNodes(), (t3 = this.finally) == null || t3.optimizeNodes(), this;
    }
    optimizeNames(e3, t3) {
      var n3, r3;
      return super.optimizeNames(e3, t3), (n3 = this.catch) == null || n3.optimizeNames(e3, t3), (r3 = this.finally) == null || r3.optimizeNames(e3, t3), this;
    }
    get names() {
      let e3 = super.names;
      return this.catch && D2(e3, this.catch.names), this.finally && D2(e3, this.finally.names), e3;
    }
  }, T2 = class extends m2 {
    constructor(e3) {
      super(), this.error = e3;
    }
    render(e3) {
      return `catch(${this.error})` + super.render(e3);
    }
  };
  T2.kind = "catch";
  var E2 = class extends m2 {
    render(e3) {
      return "finally" + super.render(e3);
    }
  };
  E2.kind = "finally", e2.CodeGen = class {
    constructor(e3, t3 = {}) {
      this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...t3, _n: t3.lines ? `
` : "" }, this._extScope = e3, this._scope = new n2.Scope({ parent: e3 }), this._nodes = [new h2()];
    }
    toString() {
      return this._root.render(this.opts);
    }
    name(e3) {
      return this._scope.name(e3);
    }
    scopeName(e3) {
      return this._extScope.name(e3);
    }
    scopeValue(e3, t3) {
      let n3 = this._extScope.value(e3, t3);
      return (this._values[n3.prefix] || (this._values[n3.prefix] = /* @__PURE__ */ new Set())).add(n3), n3;
    }
    getScopeValue(e3, t3) {
      return this._extScope.getValue(e3, t3);
    }
    scopeRefs(e3) {
      return this._extScope.scopeRefs(e3, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(e3, t3, n3, r3) {
      let i3 = this._scope.toName(t3);
      return n3 !== void 0 && r3 && (this._constants[i3.str] = n3), this._leafNode(new o2(e3, i3, n3)), i3;
    }
    const(e3, t3, r3) {
      return this._def(n2.varKinds.const, e3, t3, r3);
    }
    let(e3, t3, r3) {
      return this._def(n2.varKinds.let, e3, t3, r3);
    }
    var(e3, t3, r3) {
      return this._def(n2.varKinds.var, e3, t3, r3);
    }
    assign(e3, t3, n3) {
      return this._leafNode(new s2(e3, t3, n3));
    }
    add(t3, n3) {
      return this._leafNode(new c2(t3, e2.operators.ADD, n3));
    }
    code(e3) {
      return typeof e3 == "function" ? e3() : e3 !== t2.nil && this._leafNode(new f2(e3)), this;
    }
    object(...e3) {
      let n3 = ["{"];
      for (let [r3, i3] of e3) n3.length > 1 && n3.push(","), n3.push(r3), (r3 !== i3 || this.opts.es5) && (n3.push(":"), (0, t2.addCodeArg)(n3, i3));
      return n3.push("}"), new t2._Code(n3);
    }
    if(e3, t3, n3) {
      if (this._blockNode(new _2(e3)), t3 && n3) this.code(t3).else().code(n3).endIf();
      else if (t3) this.code(t3).endIf();
      else if (n3) throw Error('CodeGen: "else" body without "then" body');
      return this;
    }
    elseIf(e3) {
      return this._elseNode(new _2(e3));
    }
    else() {
      return this._elseNode(new g2());
    }
    endIf() {
      return this._endBlockNode(_2, g2);
    }
    _for(e3, t3) {
      return this._blockNode(e3), t3 && this.code(t3).endFor(), this;
    }
    for(e3, t3) {
      return this._for(new y2(e3), t3);
    }
    forRange(e3, t3, r3, i3, a3 = this.opts.es5 ? n2.varKinds.var : n2.varKinds.let) {
      let o3 = this._scope.toName(e3);
      return this._for(new b2(a3, o3, t3, r3), () => i3(o3));
    }
    forOf(e3, r3, i3, a3 = n2.varKinds.const) {
      let o3 = this._scope.toName(e3);
      if (this.opts.es5) {
        let e4 = r3 instanceof t2.Name ? r3 : this.var("_arr", r3);
        return this.forRange("_i", 0, (0, t2._)`${e4}.length`, (n3) => {
          this.var(o3, (0, t2._)`${e4}[${n3}]`), i3(o3);
        });
      }
      return this._for(new x2("of", a3, o3, r3), () => i3(o3));
    }
    forIn(e3, r3, i3, a3 = this.opts.es5 ? n2.varKinds.var : n2.varKinds.const) {
      if (this.opts.ownProperties) return this.forOf(e3, (0, t2._)`Object.keys(${r3})`, i3);
      let o3 = this._scope.toName(e3);
      return this._for(new x2("in", a3, o3, r3), () => i3(o3));
    }
    endFor() {
      return this._endBlockNode(v2);
    }
    label(e3) {
      return this._leafNode(new l2(e3));
    }
    break(e3) {
      return this._leafNode(new u2(e3));
    }
    return(e3) {
      let t3 = new C2();
      if (this._blockNode(t3), this.code(e3), t3.nodes.length !== 1) throw Error('CodeGen: "return" should have one node');
      return this._endBlockNode(C2);
    }
    try(e3, t3, n3) {
      if (!t3 && !n3) throw Error('CodeGen: "try" without "catch" and "finally"');
      let r3 = new w2();
      if (this._blockNode(r3), this.code(e3), t3) {
        let e4 = this.name("e");
        this._currNode = r3.catch = new T2(e4), t3(e4);
      }
      return n3 && (this._currNode = r3.finally = new E2(), this.code(n3)), this._endBlockNode(T2, E2);
    }
    throw(e3) {
      return this._leafNode(new d2(e3));
    }
    block(e3, t3) {
      return this._blockStarts.push(this._nodes.length), e3 && this.code(e3).endBlock(t3), this;
    }
    endBlock(e3) {
      let t3 = this._blockStarts.pop();
      if (t3 === void 0) throw Error("CodeGen: not in self-balancing block");
      let n3 = this._nodes.length - t3;
      if (n3 < 0 || e3 !== void 0 && n3 !== e3) throw Error(`CodeGen: wrong number of nodes: ${n3} vs ${e3} expected`);
      return this._nodes.length = t3, this;
    }
    func(e3, n3 = t2.nil, r3, i3) {
      return this._blockNode(new S2(e3, n3, r3)), i3 && this.code(i3).endFunc(), this;
    }
    endFunc() {
      return this._endBlockNode(S2);
    }
    optimize(e3 = 1) {
      for (; e3-- > 0; ) this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
    }
    _leafNode(e3) {
      return this._currNode.nodes.push(e3), this;
    }
    _blockNode(e3) {
      this._currNode.nodes.push(e3), this._nodes.push(e3);
    }
    _endBlockNode(e3, t3) {
      let n3 = this._currNode;
      if (n3 instanceof e3 || t3 && n3 instanceof t3) return this._nodes.pop(), this;
      throw Error(`CodeGen: not in block "${t3 ? `${e3.kind}/${t3.kind}` : e3.kind}"`);
    }
    _elseNode(e3) {
      let t3 = this._currNode;
      if (!(t3 instanceof _2)) throw Error('CodeGen: "else" without "if"');
      return this._currNode = t3.else = e3, this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      let e3 = this._nodes;
      return e3[e3.length - 1];
    }
    set _currNode(e3) {
      let t3 = this._nodes;
      t3[t3.length - 1] = e3;
    }
  };
  function D2(e3, t3) {
    for (let n3 in t3) e3[n3] = (e3[n3] || 0) + (t3[n3] || 0);
    return e3;
  }
  function O2(e3, n3) {
    return n3 instanceof t2._CodeOrName ? D2(e3, n3.names) : e3;
  }
  function k2(e3, n3, r3) {
    return e3 instanceof t2.Name ? i3(e3) : a3(e3) ? new t2._Code(e3._items.reduce((e4, n4) => (n4 instanceof t2.Name && (n4 = i3(n4)), n4 instanceof t2._Code ? e4.push(...n4._items) : e4.push(n4), e4), [])) : e3;
    function i3(e4) {
      let t3 = r3[e4.str];
      return t3 === void 0 || n3[e4.str] !== 1 ? e4 : (delete n3[e4.str], t3);
    }
    function a3(e4) {
      return e4 instanceof t2._Code && e4._items.some((e5) => e5 instanceof t2.Name && n3[e5.str] === 1 && r3[e5.str] !== void 0);
    }
  }
  function A2(e3, t3) {
    for (let n3 in t3) e3[n3] = (e3[n3] || 0) - (t3[n3] || 0);
  }
  function j2(e3) {
    return typeof e3 == "boolean" || typeof e3 == "number" || e3 === null ? !e3 : (0, t2._)`!${I2(e3)}`;
  }
  e2.not = j2;
  var M2 = ee2(e2.operators.AND);
  function N2(...e3) {
    return e3.reduce(M2);
  }
  e2.and = N2;
  var P2 = ee2(e2.operators.OR);
  function F2(...e3) {
    return e3.reduce(P2);
  }
  e2.or = F2;
  function ee2(e3) {
    return (n3, r3) => n3 === t2.nil ? r3 : r3 === t2.nil ? n3 : (0, t2._)`${I2(n3)} ${e3} ${I2(r3)}`;
  }
  function I2(e3) {
    return e3 instanceof t2.Name ? e3 : (0, t2._)`(${e3})`;
  }
}));
var G = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.checkStrictMode = e2.getErrorPath = e2.Type = e2.useFunc = e2.setEvaluated = e2.evaluatedPropsToName = e2.mergeEvaluated = e2.eachItem = e2.unescapeJsonPointer = e2.escapeJsonPointer = e2.escapeFragment = e2.unescapeFragment = e2.schemaRefOrVal = e2.schemaHasRulesButRef = e2.schemaHasRules = e2.checkUnknownRules = e2.alwaysValidSchema = e2.toHash = void 0;
  var t2 = W(), n2 = $n();
  function r2(e3) {
    let t3 = {};
    for (let n3 of e3) t3[n3] = !0;
    return t3;
  }
  e2.toHash = r2;
  function i2(e3, t3) {
    return typeof t3 == "boolean" ? t3 : Object.keys(t3).length === 0 || (a2(e3, t3), !o2(t3, e3.self.RULES.all));
  }
  e2.alwaysValidSchema = i2;
  function a2(e3, t3 = e3.schema) {
    let { opts: n3, self: r3 } = e3;
    if (!n3.strictSchema || typeof t3 == "boolean") return;
    let i3 = r3.RULES.keywords;
    for (let n4 in t3) i3[n4] || x2(e3, `unknown keyword: "${n4}"`);
  }
  e2.checkUnknownRules = a2;
  function o2(e3, t3) {
    if (typeof e3 == "boolean") return !e3;
    for (let n3 in e3) if (t3[n3]) return !0;
    return !1;
  }
  e2.schemaHasRules = o2;
  function s2(e3, t3) {
    if (typeof e3 == "boolean") return !e3;
    for (let n3 in e3) if (n3 !== "$ref" && t3.all[n3]) return !0;
    return !1;
  }
  e2.schemaHasRulesButRef = s2;
  function c2({ topSchemaRef: e3, schemaPath: n3 }, r3, i3, a3) {
    if (!a3) {
      if (typeof r3 == "number" || typeof r3 == "boolean") return r3;
      if (typeof r3 == "string") return (0, t2._)`${r3}`;
    }
    return (0, t2._)`${e3}${n3}${(0, t2.getProperty)(i3)}`;
  }
  e2.schemaRefOrVal = c2;
  function l2(e3) {
    return f2(decodeURIComponent(e3));
  }
  e2.unescapeFragment = l2;
  function u2(e3) {
    return encodeURIComponent(d2(e3));
  }
  e2.escapeFragment = u2;
  function d2(e3) {
    return typeof e3 == "number" ? `${e3}` : e3.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  e2.escapeJsonPointer = d2;
  function f2(e3) {
    return e3.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  e2.unescapeJsonPointer = f2;
  function p2(e3, t3) {
    if (Array.isArray(e3)) for (let n3 of e3) t3(n3);
    else t3(e3);
  }
  e2.eachItem = p2;
  function m2({ mergeNames: e3, mergeToName: n3, mergeValues: r3, resultToName: i3 }) {
    return (a3, o3, s3, c3) => {
      let l3 = s3 === void 0 ? o3 : s3 instanceof t2.Name ? (o3 instanceof t2.Name ? e3(a3, o3, s3) : n3(a3, o3, s3), s3) : o3 instanceof t2.Name ? (n3(a3, s3, o3), o3) : r3(o3, s3);
      return c3 === t2.Name && !(l3 instanceof t2.Name) ? i3(a3, l3) : l3;
    };
  }
  e2.mergeEvaluated = { props: m2({ mergeNames: (e3, n3, r3) => e3.if((0, t2._)`${r3} !== true && ${n3} !== undefined`, () => {
    e3.if((0, t2._)`${n3} === true`, () => e3.assign(r3, !0), () => e3.assign(r3, (0, t2._)`${r3} || {}`).code((0, t2._)`Object.assign(${r3}, ${n3})`));
  }), mergeToName: (e3, n3, r3) => e3.if((0, t2._)`${r3} !== true`, () => {
    n3 === !0 ? e3.assign(r3, !0) : (e3.assign(r3, (0, t2._)`${r3} || {}`), g2(e3, r3, n3));
  }), mergeValues: (e3, t3) => e3 === !0 || { ...e3, ...t3 }, resultToName: h2 }), items: m2({ mergeNames: (e3, n3, r3) => e3.if((0, t2._)`${r3} !== true && ${n3} !== undefined`, () => e3.assign(r3, (0, t2._)`${n3} === true ? true : ${r3} > ${n3} ? ${r3} : ${n3}`)), mergeToName: (e3, n3, r3) => e3.if((0, t2._)`${r3} !== true`, () => e3.assign(r3, n3 === !0 || (0, t2._)`${r3} > ${n3} ? ${r3} : ${n3}`)), mergeValues: (e3, t3) => e3 === !0 || Math.max(e3, t3), resultToName: (e3, t3) => e3.var("items", t3) }) };
  function h2(e3, n3) {
    if (n3 === !0) return e3.var("props", !0);
    let r3 = e3.var("props", (0, t2._)`{}`);
    return n3 !== void 0 && g2(e3, r3, n3), r3;
  }
  e2.evaluatedPropsToName = h2;
  function g2(e3, n3, r3) {
    Object.keys(r3).forEach((r4) => e3.assign((0, t2._)`${n3}${(0, t2.getProperty)(r4)}`, !0));
  }
  e2.setEvaluated = g2;
  var _2 = {};
  function v2(e3, t3) {
    return e3.scopeValue("func", { ref: t3, code: _2[t3.code] || (_2[t3.code] = new n2._Code(t3.code)) });
  }
  e2.useFunc = v2;
  var y2;
  (function(e3) {
    e3[e3.Num = 0] = "Num", e3[e3.Str = 1] = "Str";
  })(y2 || (e2.Type = y2 = {}));
  function b2(e3, n3, r3) {
    if (e3 instanceof t2.Name) {
      let i3 = n3 === y2.Num;
      return r3 ? i3 ? (0, t2._)`"[" + ${e3} + "]"` : (0, t2._)`"['" + ${e3} + "']"` : i3 ? (0, t2._)`"/" + ${e3}` : (0, t2._)`"/" + ${e3}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return r3 ? (0, t2.getProperty)(e3).toString() : "/" + d2(e3);
  }
  e2.getErrorPath = b2;
  function x2(e3, t3, n3 = e3.opts.strictSchema) {
    if (n3) {
      if (t3 = `strict mode: ${t3}`, n3 === !0) throw Error(t3);
      e3.self.logger.warn(t3);
    }
  }
  e2.checkStrictMode = x2;
}));
var tr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W();
  e2.default = { data: new t2.Name("data"), valCxt: new t2.Name("valCxt"), instancePath: new t2.Name("instancePath"), parentData: new t2.Name("parentData"), parentDataProperty: new t2.Name("parentDataProperty"), rootData: new t2.Name("rootData"), dynamicAnchors: new t2.Name("dynamicAnchors"), vErrors: new t2.Name("vErrors"), errors: new t2.Name("errors"), this: new t2.Name("this"), self: new t2.Name("self"), scope: new t2.Name("scope"), json: new t2.Name("json"), jsonPos: new t2.Name("jsonPos"), jsonLen: new t2.Name("jsonLen"), jsonPart: new t2.Name("jsonPart") };
}));
var nr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.extendErrors = e2.resetErrorsCount = e2.reportExtraError = e2.reportError = e2.keyword$DataError = e2.keywordError = void 0;
  var t2 = W(), n2 = G(), r2 = tr();
  e2.keywordError = { message: ({ keyword: e3 }) => (0, t2.str)`must pass "${e3}" keyword validation` }, e2.keyword$DataError = { message: ({ keyword: e3, schemaType: n3 }) => n3 ? (0, t2.str)`"${e3}" keyword must be ${n3} ($data)` : (0, t2.str)`"${e3}" keyword is invalid ($data)` };
  function i2(n3, r3 = e2.keywordError, i3, a3) {
    let { it: o3 } = n3, { gen: s3, compositeRule: u3, allErrors: f3 } = o3, p3 = d2(n3, r3, i3);
    a3 ?? (u3 || f3) ? c2(s3, p3) : l2(o3, (0, t2._)`[${p3}]`);
  }
  e2.reportError = i2;
  function a2(t3, n3 = e2.keywordError, i3) {
    let { it: a3 } = t3, { gen: o3, compositeRule: s3, allErrors: u3 } = a3;
    c2(o3, d2(t3, n3, i3)), s3 || u3 || l2(a3, r2.default.vErrors);
  }
  e2.reportExtraError = a2;
  function o2(e3, n3) {
    e3.assign(r2.default.errors, n3), e3.if((0, t2._)`${r2.default.vErrors} !== null`, () => e3.if(n3, () => e3.assign((0, t2._)`${r2.default.vErrors}.length`, n3), () => e3.assign(r2.default.vErrors, null)));
  }
  e2.resetErrorsCount = o2;
  function s2({ gen: e3, keyword: n3, schemaValue: i3, data: a3, errsCount: o3, it: s3 }) {
    if (o3 === void 0) throw Error("ajv implementation error");
    let c3 = e3.name("err");
    e3.forRange("i", o3, r2.default.errors, (o4) => {
      e3.const(c3, (0, t2._)`${r2.default.vErrors}[${o4}]`), e3.if((0, t2._)`${c3}.instancePath === undefined`, () => e3.assign((0, t2._)`${c3}.instancePath`, (0, t2.strConcat)(r2.default.instancePath, s3.errorPath))), e3.assign((0, t2._)`${c3}.schemaPath`, (0, t2.str)`${s3.errSchemaPath}/${n3}`), s3.opts.verbose && (e3.assign((0, t2._)`${c3}.schema`, i3), e3.assign((0, t2._)`${c3}.data`, a3));
    });
  }
  e2.extendErrors = s2;
  function c2(e3, n3) {
    let i3 = e3.const("err", n3);
    e3.if((0, t2._)`${r2.default.vErrors} === null`, () => e3.assign(r2.default.vErrors, (0, t2._)`[${i3}]`), (0, t2._)`${r2.default.vErrors}.push(${i3})`), e3.code((0, t2._)`${r2.default.errors}++`);
  }
  function l2(e3, n3) {
    let { gen: r3, validateName: i3, schemaEnv: a3 } = e3;
    a3.$async ? r3.throw((0, t2._)`new ${e3.ValidationError}(${n3})`) : (r3.assign((0, t2._)`${i3}.errors`, n3), r3.return(!1));
  }
  var u2 = { keyword: new t2.Name("keyword"), schemaPath: new t2.Name("schemaPath"), params: new t2.Name("params"), propertyName: new t2.Name("propertyName"), message: new t2.Name("message"), schema: new t2.Name("schema"), parentSchema: new t2.Name("parentSchema") };
  function d2(e3, n3, r3) {
    let { createErrors: i3 } = e3.it;
    return i3 === !1 ? (0, t2._)`{}` : f2(e3, n3, r3);
  }
  function f2(e3, t3, n3 = {}) {
    let { gen: r3, it: i3 } = e3, a3 = [p2(i3, n3), m2(e3, n3)];
    return h2(e3, t3, a3), r3.object(...a3);
  }
  function p2({ errorPath: e3 }, { instancePath: i3 }) {
    let a3 = i3 ? (0, t2.str)`${e3}${(0, n2.getErrorPath)(i3, n2.Type.Str)}` : e3;
    return [r2.default.instancePath, (0, t2.strConcat)(r2.default.instancePath, a3)];
  }
  function m2({ keyword: e3, it: { errSchemaPath: r3 } }, { schemaPath: i3, parentSchema: a3 }) {
    let o3 = a3 ? r3 : (0, t2.str)`${r3}/${e3}`;
    return i3 && (o3 = (0, t2.str)`${o3}${(0, n2.getErrorPath)(i3, n2.Type.Str)}`), [u2.schemaPath, o3];
  }
  function h2(e3, { params: n3, message: i3 }, a3) {
    let { keyword: o3, data: s3, schemaValue: c3, it: l3 } = e3, { opts: d3, propertyName: f3, topSchemaRef: p3, schemaPath: m3 } = l3;
    a3.push([u2.keyword, o3], [u2.params, typeof n3 == "function" ? n3(e3) : n3 || (0, t2._)`{}`]), d3.messages && a3.push([u2.message, typeof i3 == "function" ? i3(e3) : i3]), d3.verbose && a3.push([u2.schema, c3], [u2.parentSchema, (0, t2._)`${p3}${m3}`], [r2.default.data, s3]), f3 && a3.push([u2.propertyName, f3]);
  }
}));
var rr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.boolOrEmptySchema = e2.topBoolOrEmptySchema = void 0;
  var t2 = nr(), n2 = W(), r2 = tr(), i2 = { message: "boolean schema is false" };
  function a2(e3) {
    let { gen: t3, schema: i3, validateName: a3 } = e3;
    i3 === !1 ? s2(e3, !1) : typeof i3 == "object" && i3.$async === !0 ? t3.return(r2.default.data) : (t3.assign((0, n2._)`${a3}.errors`, null), t3.return(!0));
  }
  e2.topBoolOrEmptySchema = a2;
  function o2(e3, t3) {
    let { gen: n3, schema: r3 } = e3;
    r3 === !1 ? (n3.var(t3, !1), s2(e3)) : n3.var(t3, !0);
  }
  e2.boolOrEmptySchema = o2;
  function s2(e3, n3) {
    let { gen: r3, data: a3 } = e3, o3 = { gen: r3, keyword: "false schema", data: a3, schema: !1, schemaCode: !1, schemaValue: !1, params: {}, it: e3 };
    (0, t2.reportError)(o3, i2, void 0, n3);
  }
}));
var ir = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.getRules = e2.isJSONType = void 0;
  var t2 = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null", "object", "array"]);
  function n2(e3) {
    return typeof e3 == "string" && t2.has(e3);
  }
  e2.isJSONType = n2;
  function r2() {
    let e3 = { number: { type: "number", rules: [] }, string: { type: "string", rules: [] }, array: { type: "array", rules: [] }, object: { type: "object", rules: [] } };
    return { types: { ...e3, integer: !0, boolean: !0, null: !0 }, rules: [{ rules: [] }, e3.number, e3.string, e3.array, e3.object], post: { rules: [] }, all: {}, keywords: {} };
  }
  e2.getRules = r2;
}));
var ar = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.shouldUseRule = e2.shouldUseGroup = e2.schemaHasRulesForType = void 0;
  function t2({ schema: e3, self: t3 }, r3) {
    let i2 = t3.RULES.types[r3];
    return i2 && i2 !== !0 && n2(e3, i2);
  }
  e2.schemaHasRulesForType = t2;
  function n2(e3, t3) {
    return t3.rules.some((t4) => r2(e3, t4));
  }
  e2.shouldUseGroup = n2;
  function r2(e3, t3) {
    return e3[t3.keyword] !== void 0 || t3.definition.implements?.some((t4) => e3[t4] !== void 0);
  }
  e2.shouldUseRule = r2;
}));
var or = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.reportTypeError = e2.checkDataTypes = e2.checkDataType = e2.coerceAndCheckDataType = e2.getJSONTypes = e2.getSchemaTypes = e2.DataType = void 0;
  var t2 = ir(), n2 = ar(), r2 = nr(), i2 = W(), a2 = G(), o2;
  (function(e3) {
    e3[e3.Correct = 0] = "Correct", e3[e3.Wrong = 1] = "Wrong";
  })(o2 || (e2.DataType = o2 = {}));
  function s2(e3) {
    let t3 = c2(e3.type);
    if (t3.includes("null")) {
      if (e3.nullable === !1) throw Error("type: null contradicts nullable: false");
    } else {
      if (!t3.length && e3.nullable !== void 0) throw Error('"nullable" cannot be used without "type"');
      e3.nullable === !0 && t3.push("null");
    }
    return t3;
  }
  e2.getSchemaTypes = s2;
  function c2(e3) {
    let n3 = Array.isArray(e3) ? e3 : e3 ? [e3] : [];
    if (n3.every(t2.isJSONType)) return n3;
    throw Error("type must be JSONType or JSONType[]: " + n3.join(","));
  }
  e2.getJSONTypes = c2;
  function l2(e3, t3) {
    let { gen: r3, data: i3, opts: a3 } = e3, s3 = d2(t3, a3.coerceTypes), c3 = t3.length > 0 && !(s3.length === 0 && t3.length === 1 && (0, n2.schemaHasRulesForType)(e3, t3[0]));
    if (c3) {
      let n3 = h2(t3, i3, a3.strictNumbers, o2.Wrong);
      r3.if(n3, () => {
        s3.length ? f2(e3, t3, s3) : _2(e3);
      });
    }
    return c3;
  }
  e2.coerceAndCheckDataType = l2;
  var u2 = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function d2(e3, t3) {
    return t3 ? e3.filter((e4) => u2.has(e4) || t3 === "array" && e4 === "array") : [];
  }
  function f2(e3, t3, n3) {
    let { gen: r3, data: a3, opts: o3 } = e3, s3 = r3.let("dataType", (0, i2._)`typeof ${a3}`), c3 = r3.let("coerced", (0, i2._)`undefined`);
    o3.coerceTypes === "array" && r3.if((0, i2._)`${s3} == 'object' && Array.isArray(${a3}) && ${a3}.length == 1`, () => r3.assign(a3, (0, i2._)`${a3}[0]`).assign(s3, (0, i2._)`typeof ${a3}`).if(h2(t3, a3, o3.strictNumbers), () => r3.assign(c3, a3))), r3.if((0, i2._)`${c3} !== undefined`);
    for (let e4 of n3) (u2.has(e4) || e4 === "array" && o3.coerceTypes === "array") && l3(e4);
    r3.else(), _2(e3), r3.endIf(), r3.if((0, i2._)`${c3} !== undefined`, () => {
      r3.assign(a3, c3), p2(e3, c3);
    });
    function l3(e4) {
      switch (e4) {
        case "string":
          r3.elseIf((0, i2._)`${s3} == "number" || ${s3} == "boolean"`).assign(c3, (0, i2._)`"" + ${a3}`).elseIf((0, i2._)`${a3} === null`).assign(c3, (0, i2._)`""`);
          return;
        case "number":
          r3.elseIf((0, i2._)`${s3} == "boolean" || ${a3} === null
              || (${s3} == "string" && ${a3} && ${a3} == +${a3})`).assign(c3, (0, i2._)`+${a3}`);
          return;
        case "integer":
          r3.elseIf((0, i2._)`${s3} === "boolean" || ${a3} === null
              || (${s3} === "string" && ${a3} && ${a3} == +${a3} && !(${a3} % 1))`).assign(c3, (0, i2._)`+${a3}`);
          return;
        case "boolean":
          r3.elseIf((0, i2._)`${a3} === "false" || ${a3} === 0 || ${a3} === null`).assign(c3, !1).elseIf((0, i2._)`${a3} === "true" || ${a3} === 1`).assign(c3, !0);
          return;
        case "null":
          r3.elseIf((0, i2._)`${a3} === "" || ${a3} === 0 || ${a3} === false`), r3.assign(c3, null);
          return;
        case "array":
          r3.elseIf((0, i2._)`${s3} === "string" || ${s3} === "number"
              || ${s3} === "boolean" || ${a3} === null`).assign(c3, (0, i2._)`[${a3}]`);
      }
    }
  }
  function p2({ gen: e3, parentData: t3, parentDataProperty: n3 }, r3) {
    e3.if((0, i2._)`${t3} !== undefined`, () => e3.assign((0, i2._)`${t3}[${n3}]`, r3));
  }
  function m2(e3, t3, n3, r3 = o2.Correct) {
    let a3 = r3 === o2.Correct ? i2.operators.EQ : i2.operators.NEQ, s3;
    switch (e3) {
      case "null":
        return (0, i2._)`${t3} ${a3} null`;
      case "array":
        s3 = (0, i2._)`Array.isArray(${t3})`;
        break;
      case "object":
        s3 = (0, i2._)`${t3} && typeof ${t3} == "object" && !Array.isArray(${t3})`;
        break;
      case "integer":
        s3 = c3((0, i2._)`!(${t3} % 1) && !isNaN(${t3})`);
        break;
      case "number":
        s3 = c3();
        break;
      default:
        return (0, i2._)`typeof ${t3} ${a3} ${e3}`;
    }
    return r3 === o2.Correct ? s3 : (0, i2.not)(s3);
    function c3(e4 = i2.nil) {
      return (0, i2.and)((0, i2._)`typeof ${t3} == "number"`, e4, n3 ? (0, i2._)`isFinite(${t3})` : i2.nil);
    }
  }
  e2.checkDataType = m2;
  function h2(e3, t3, n3, r3) {
    if (e3.length === 1) return m2(e3[0], t3, n3, r3);
    let o3, s3 = (0, a2.toHash)(e3);
    if (s3.array && s3.object) {
      let e4 = (0, i2._)`typeof ${t3} != "object"`;
      o3 = s3.null ? e4 : (0, i2._)`!${t3} || ${e4}`, delete s3.null, delete s3.array, delete s3.object;
    } else o3 = i2.nil;
    s3.number && delete s3.integer;
    for (let e4 in s3) o3 = (0, i2.and)(o3, m2(e4, t3, n3, r3));
    return o3;
  }
  e2.checkDataTypes = h2;
  var g2 = { message: ({ schema: e3 }) => `must be ${e3}`, params: ({ schema: e3, schemaValue: t3 }) => typeof e3 == "string" ? (0, i2._)`{type: ${e3}}` : (0, i2._)`{type: ${t3}}` };
  function _2(e3) {
    let t3 = v2(e3);
    (0, r2.reportError)(t3, g2);
  }
  e2.reportTypeError = _2;
  function v2(e3) {
    let { gen: t3, data: n3, schema: r3 } = e3, i3 = (0, a2.schemaRefOrVal)(e3, r3, "type");
    return { gen: t3, keyword: "type", data: n3, schema: r3.type, schemaCode: i3, schemaValue: i3, parentSchema: r3, params: {}, it: e3 };
  }
}));
var sr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.assignDefaults = void 0;
  var t2 = W(), n2 = G();
  function r2(e3, t3) {
    let { properties: n3, items: r3 } = e3.schema;
    if (t3 === "object" && n3) for (let t4 in n3) i2(e3, t4, n3[t4].default);
    else t3 === "array" && Array.isArray(r3) && r3.forEach((t4, n4) => i2(e3, n4, t4.default));
  }
  e2.assignDefaults = r2;
  function i2(e3, r3, i3) {
    let { gen: a2, compositeRule: o2, data: s2, opts: c2 } = e3;
    if (i3 === void 0) return;
    let l2 = (0, t2._)`${s2}${(0, t2.getProperty)(r3)}`;
    if (o2) {
      (0, n2.checkStrictMode)(e3, `default is ignored for: ${l2}`);
      return;
    }
    let u2 = (0, t2._)`${l2} === undefined`;
    c2.useDefaults === "empty" && (u2 = (0, t2._)`${u2} || ${l2} === null || ${l2} === ""`), a2.if(u2, (0, t2._)`${l2} = ${(0, t2.stringify)(i3)}`);
  }
}));
var cr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.validateUnion = e2.validateArray = e2.usePattern = e2.callValidateCode = e2.schemaProperties = e2.allSchemaProperties = e2.noPropertyInData = e2.propertyInData = e2.isOwnProperty = e2.hasPropFunc = e2.reportMissingProp = e2.checkMissingProp = e2.checkReportMissingProp = void 0;
  var t2 = W(), n2 = G(), r2 = tr(), i2 = G();
  function a2(e3, n3) {
    let { gen: r3, data: i3, it: a3 } = e3;
    r3.if(d2(r3, i3, n3, a3.opts.ownProperties), () => {
      e3.setParams({ missingProperty: (0, t2._)`${n3}` }, !0), e3.error();
    });
  }
  e2.checkReportMissingProp = a2;
  function o2({ gen: e3, data: n3, it: { opts: r3 } }, i3, a3) {
    return (0, t2.or)(...i3.map((i4) => (0, t2.and)(d2(e3, n3, i4, r3.ownProperties), (0, t2._)`${a3} = ${i4}`)));
  }
  e2.checkMissingProp = o2;
  function s2(e3, t3) {
    e3.setParams({ missingProperty: t3 }, !0), e3.error();
  }
  e2.reportMissingProp = s2;
  function c2(e3) {
    return e3.scopeValue("func", { ref: Object.prototype.hasOwnProperty, code: (0, t2._)`Object.prototype.hasOwnProperty` });
  }
  e2.hasPropFunc = c2;
  function l2(e3, n3, r3) {
    return (0, t2._)`${c2(e3)}.call(${n3}, ${r3})`;
  }
  e2.isOwnProperty = l2;
  function u2(e3, n3, r3, i3) {
    let a3 = (0, t2._)`${n3}${(0, t2.getProperty)(r3)} !== undefined`;
    return i3 ? (0, t2._)`${a3} && ${l2(e3, n3, r3)}` : a3;
  }
  e2.propertyInData = u2;
  function d2(e3, n3, r3, i3) {
    let a3 = (0, t2._)`${n3}${(0, t2.getProperty)(r3)} === undefined`;
    return i3 ? (0, t2.or)(a3, (0, t2.not)(l2(e3, n3, r3))) : a3;
  }
  e2.noPropertyInData = d2;
  function f2(e3) {
    return e3 ? Object.keys(e3).filter((e4) => e4 !== "__proto__") : [];
  }
  e2.allSchemaProperties = f2;
  function p2(e3, t3) {
    return f2(t3).filter((r3) => !(0, n2.alwaysValidSchema)(e3, t3[r3]));
  }
  e2.schemaProperties = p2;
  function m2({ schemaCode: e3, data: n3, it: { gen: i3, topSchemaRef: a3, schemaPath: o3, errorPath: s3 }, it: c3 }, l3, u3, d3) {
    let f3 = d3 ? (0, t2._)`${e3}, ${n3}, ${a3}${o3}` : n3, p3 = [[r2.default.instancePath, (0, t2.strConcat)(r2.default.instancePath, s3)], [r2.default.parentData, c3.parentData], [r2.default.parentDataProperty, c3.parentDataProperty], [r2.default.rootData, r2.default.rootData]];
    c3.opts.dynamicRef && p3.push([r2.default.dynamicAnchors, r2.default.dynamicAnchors]);
    let m3 = (0, t2._)`${f3}, ${i3.object(...p3)}`;
    return u3 === t2.nil ? (0, t2._)`${l3}(${m3})` : (0, t2._)`${l3}.call(${u3}, ${m3})`;
  }
  e2.callValidateCode = m2;
  var h2 = (0, t2._)`new RegExp`;
  function g2({ gen: e3, it: { opts: n3 } }, r3) {
    let a3 = n3.unicodeRegExp ? "u" : "", { regExp: o3 } = n3.code, s3 = o3(r3, a3);
    return e3.scopeValue("pattern", { key: s3.toString(), ref: s3, code: (0, t2._)`${o3.code === "new RegExp" ? h2 : (0, i2.useFunc)(e3, o3)}(${r3}, ${a3})` });
  }
  e2.usePattern = g2;
  function _2(e3) {
    let { gen: r3, data: i3, keyword: a3, it: o3 } = e3, s3 = r3.name("valid");
    if (o3.allErrors) {
      let e4 = r3.let("valid", !0);
      return c3(() => r3.assign(e4, !1)), e4;
    }
    return r3.var(s3, !0), c3(() => r3.break()), s3;
    function c3(o4) {
      let c4 = r3.const("len", (0, t2._)`${i3}.length`);
      r3.forRange("i", 0, c4, (i4) => {
        e3.subschema({ keyword: a3, dataProp: i4, dataPropType: n2.Type.Num }, s3), r3.if((0, t2.not)(s3), o4);
      });
    }
  }
  e2.validateArray = _2;
  function v2(e3) {
    let { gen: r3, schema: i3, keyword: a3, it: o3 } = e3;
    if (!Array.isArray(i3)) throw Error("ajv implementation error");
    if (i3.some((e4) => (0, n2.alwaysValidSchema)(o3, e4)) && !o3.opts.unevaluated) return;
    let s3 = r3.let("valid", !1), c3 = r3.name("_valid");
    r3.block(() => i3.forEach((n3, i4) => {
      let o4 = e3.subschema({ keyword: a3, schemaProp: i4, compositeRule: !0 }, c3);
      r3.assign(s3, (0, t2._)`${s3} || ${c3}`), e3.mergeValidEvaluated(o4, c3) || r3.if((0, t2.not)(s3));
    })), e3.result(s3, () => e3.reset(), () => e3.error(!0));
  }
  e2.validateUnion = v2;
}));
var lr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.validateKeywordUsage = e2.validSchemaType = e2.funcKeywordCode = e2.macroKeywordCode = void 0;
  var t2 = W(), n2 = tr(), r2 = cr(), i2 = nr();
  function a2(e3, n3) {
    let { gen: r3, keyword: i3, schema: a3, parentSchema: o3, it: s3 } = e3, c3 = n3.macro.call(s3.self, a3, o3, s3), l3 = u2(r3, i3, c3);
    s3.opts.validateSchema !== !1 && s3.self.validateSchema(c3, !0);
    let d3 = r3.name("valid");
    e3.subschema({ schema: c3, schemaPath: t2.nil, errSchemaPath: `${s3.errSchemaPath}/${i3}`, topSchemaRef: l3, compositeRule: !0 }, d3), e3.pass(d3, () => e3.error(!0));
  }
  e2.macroKeywordCode = a2;
  function o2(e3, i3) {
    let { gen: a3, keyword: o3, schema: d3, parentSchema: f3, $data: p2, it: m2 } = e3;
    l2(m2, i3);
    let h2 = u2(a3, o3, !p2 && i3.compile ? i3.compile.call(m2.self, d3, f3, m2) : i3.validate), g2 = a3.let("valid");
    e3.block$data(g2, _2), e3.ok(i3.valid ?? g2);
    function _2() {
      if (i3.errors === !1) b2(), i3.modifying && s2(e3), x2(() => e3.error());
      else {
        let t3 = i3.async ? v2() : y2();
        i3.modifying && s2(e3), x2(() => c2(e3, t3));
      }
    }
    function v2() {
      let e4 = a3.let("ruleErrs", null);
      return a3.try(() => b2((0, t2._)`await `), (n3) => a3.assign(g2, !1).if((0, t2._)`${n3} instanceof ${m2.ValidationError}`, () => a3.assign(e4, (0, t2._)`${n3}.errors`), () => a3.throw(n3))), e4;
    }
    function y2() {
      let e4 = (0, t2._)`${h2}.errors`;
      return a3.assign(e4, null), b2(t2.nil), e4;
    }
    function b2(o4 = i3.async ? (0, t2._)`await ` : t2.nil) {
      let s3 = m2.opts.passContext ? n2.default.this : n2.default.self, c3 = !("compile" in i3 && !p2 || i3.schema === !1);
      a3.assign(g2, (0, t2._)`${o4}${(0, r2.callValidateCode)(e3, h2, s3, c3)}`, i3.modifying);
    }
    function x2(e4) {
      a3.if((0, t2.not)(i3.valid ?? g2), e4);
    }
  }
  e2.funcKeywordCode = o2;
  function s2(e3) {
    let { gen: n3, data: r3, it: i3 } = e3;
    n3.if(i3.parentData, () => n3.assign(r3, (0, t2._)`${i3.parentData}[${i3.parentDataProperty}]`));
  }
  function c2(e3, r3) {
    let { gen: a3 } = e3;
    a3.if((0, t2._)`Array.isArray(${r3})`, () => {
      a3.assign(n2.default.vErrors, (0, t2._)`${n2.default.vErrors} === null ? ${r3} : ${n2.default.vErrors}.concat(${r3})`).assign(n2.default.errors, (0, t2._)`${n2.default.vErrors}.length`), (0, i2.extendErrors)(e3);
    }, () => e3.error());
  }
  function l2({ schemaEnv: e3 }, t3) {
    if (t3.async && !e3.$async) throw Error("async keyword in sync schema");
  }
  function u2(e3, n3, r3) {
    if (r3 === void 0) throw Error(`keyword "${n3}" failed to compile`);
    return e3.scopeValue("keyword", typeof r3 == "function" ? { ref: r3 } : { ref: r3, code: (0, t2.stringify)(r3) });
  }
  function d2(e3, t3, n3 = !1) {
    return !t3.length || t3.some((t4) => t4 === "array" ? Array.isArray(e3) : t4 === "object" ? e3 && typeof e3 == "object" && !Array.isArray(e3) : typeof e3 == t4 || n3 && e3 === void 0);
  }
  e2.validSchemaType = d2;
  function f2({ schema: e3, opts: t3, self: n3, errSchemaPath: r3 }, i3, a3) {
    if (Array.isArray(i3.keyword) ? !i3.keyword.includes(a3) : i3.keyword !== a3) throw Error("ajv implementation error");
    let o3 = i3.dependencies;
    if (o3?.some((t4) => !Object.prototype.hasOwnProperty.call(e3, t4))) throw Error(`parent schema must have dependencies of ${a3}: ${o3.join(",")}`);
    if (i3.validateSchema && !i3.validateSchema(e3[a3])) {
      let e4 = `keyword "${a3}" value is invalid at path "${r3}": ` + n3.errorsText(i3.validateSchema.errors);
      if (t3.validateSchema === "log") n3.logger.error(e4);
      else throw Error(e4);
    }
  }
  e2.validateKeywordUsage = f2;
}));
var ur = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.extendSubschemaMode = e2.extendSubschemaData = e2.getSubschema = void 0;
  var t2 = W(), n2 = G();
  function r2(e3, { keyword: r3, schemaProp: i3, schema: a3, schemaPath: o2, errSchemaPath: s2, topSchemaRef: c2 }) {
    if (r3 !== void 0 && a3 !== void 0) throw Error('both "keyword" and "schema" passed, only one allowed');
    if (r3 !== void 0) {
      let a4 = e3.schema[r3];
      return i3 === void 0 ? { schema: a4, schemaPath: (0, t2._)`${e3.schemaPath}${(0, t2.getProperty)(r3)}`, errSchemaPath: `${e3.errSchemaPath}/${r3}` } : { schema: a4[i3], schemaPath: (0, t2._)`${e3.schemaPath}${(0, t2.getProperty)(r3)}${(0, t2.getProperty)(i3)}`, errSchemaPath: `${e3.errSchemaPath}/${r3}/${(0, n2.escapeFragment)(i3)}` };
    }
    if (a3 !== void 0) {
      if (o2 === void 0 || s2 === void 0 || c2 === void 0) throw Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      return { schema: a3, schemaPath: o2, topSchemaRef: c2, errSchemaPath: s2 };
    }
    throw Error('either "keyword" or "schema" must be passed');
  }
  e2.getSubschema = r2;
  function i2(e3, r3, { dataProp: i3, dataPropType: a3, data: o2, dataTypes: s2, propertyName: c2 }) {
    if (o2 !== void 0 && i3 !== void 0) throw Error('both "data" and "dataProp" passed, only one allowed');
    let { gen: l2 } = r3;
    if (i3 !== void 0) {
      let { errorPath: o3, dataPathArr: s3, opts: c3 } = r3;
      u2(l2.let("data", (0, t2._)`${r3.data}${(0, t2.getProperty)(i3)}`, !0)), e3.errorPath = (0, t2.str)`${o3}${(0, n2.getErrorPath)(i3, a3, c3.jsPropertySyntax)}`, e3.parentDataProperty = (0, t2._)`${i3}`, e3.dataPathArr = [...s3, e3.parentDataProperty];
    }
    o2 !== void 0 && (u2(o2 instanceof t2.Name ? o2 : l2.let("data", o2, !0)), c2 !== void 0 && (e3.propertyName = c2)), s2 && (e3.dataTypes = s2);
    function u2(t3) {
      e3.data = t3, e3.dataLevel = r3.dataLevel + 1, e3.dataTypes = [], r3.definedProperties = /* @__PURE__ */ new Set(), e3.parentData = r3.data, e3.dataNames = [...r3.dataNames, t3];
    }
  }
  e2.extendSubschemaData = i2;
  function a2(e3, { jtdDiscriminator: t3, jtdMetadata: n3, compositeRule: r3, createErrors: i3, allErrors: a3 }) {
    r3 !== void 0 && (e3.compositeRule = r3), i3 !== void 0 && (e3.createErrors = i3), a3 !== void 0 && (e3.allErrors = a3), e3.jtdDiscriminator = t3, e3.jtdMetadata = n3;
  }
  e2.extendSubschemaMode = a2;
}));
var dr = i(((e2, t2) => {
  t2.exports = function e3(t3, n2) {
    if (t3 === n2) return !0;
    if (t3 && n2 && typeof t3 == "object" && typeof n2 == "object") {
      if (t3.constructor !== n2.constructor) return !1;
      var r2, i2, a2;
      if (Array.isArray(t3)) {
        if (r2 = t3.length, r2 != n2.length) return !1;
        for (i2 = r2; i2-- !== 0; ) if (!e3(t3[i2], n2[i2])) return !1;
        return !0;
      }
      if (t3.constructor === RegExp) return t3.source === n2.source && t3.flags === n2.flags;
      if (t3.valueOf !== Object.prototype.valueOf) return t3.valueOf() === n2.valueOf();
      if (t3.toString !== Object.prototype.toString) return t3.toString() === n2.toString();
      if (a2 = Object.keys(t3), r2 = a2.length, r2 !== Object.keys(n2).length) return !1;
      for (i2 = r2; i2-- !== 0; ) if (!Object.prototype.hasOwnProperty.call(n2, a2[i2])) return !1;
      for (i2 = r2; i2-- !== 0; ) {
        var o2 = a2[i2];
        if (!e3(t3[o2], n2[o2])) return !1;
      }
      return !0;
    }
    return t3 !== t3 && n2 !== n2;
  };
}));
var fr = i(((e2, t2) => {
  var n2 = t2.exports = function(e3, t3, n3) {
    typeof t3 == "function" && (n3 = t3, t3 = {}), n3 = t3.cb || n3;
    var i3 = typeof n3 == "function" ? n3 : n3.pre || function() {
    }, a2 = n3.post || function() {
    };
    r2(t3, i3, a2, e3, "", e3);
  };
  n2.keywords = { additionalItems: !0, items: !0, contains: !0, additionalProperties: !0, propertyNames: !0, not: !0, if: !0, then: !0, else: !0 }, n2.arrayKeywords = { items: !0, allOf: !0, anyOf: !0, oneOf: !0 }, n2.propsKeywords = { $defs: !0, definitions: !0, properties: !0, patternProperties: !0, dependencies: !0 }, n2.skipKeywords = { default: !0, enum: !0, const: !0, required: !0, maximum: !0, minimum: !0, exclusiveMaximum: !0, exclusiveMinimum: !0, multipleOf: !0, maxLength: !0, minLength: !0, pattern: !0, format: !0, maxItems: !0, minItems: !0, uniqueItems: !0, maxProperties: !0, minProperties: !0 };
  function r2(e3, t3, a2, o2, s2, c2, l2, u2, d2, f2) {
    if (o2 && typeof o2 == "object" && !Array.isArray(o2)) {
      for (var p2 in t3(o2, s2, c2, l2, u2, d2, f2), o2) {
        var m2 = o2[p2];
        if (Array.isArray(m2)) {
          if (p2 in n2.arrayKeywords) for (var h2 = 0; h2 < m2.length; h2++) r2(e3, t3, a2, m2[h2], s2 + "/" + p2 + "/" + h2, c2, s2, p2, o2, h2);
        } else if (p2 in n2.propsKeywords) {
          if (m2 && typeof m2 == "object") for (var g2 in m2) r2(e3, t3, a2, m2[g2], s2 + "/" + p2 + "/" + i2(g2), c2, s2, p2, o2, g2);
        } else (p2 in n2.keywords || e3.allKeys && !(p2 in n2.skipKeywords)) && r2(e3, t3, a2, m2, s2 + "/" + p2, c2, s2, p2, o2);
      }
      a2(o2, s2, c2, l2, u2, d2, f2);
    }
  }
  function i2(e3) {
    return e3.replace(/~/g, "~0").replace(/\//g, "~1");
  }
}));
var pr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.getSchemaRefs = e2.resolveUrl = e2.normalizeId = e2._getFullPath = e2.getFullPath = e2.inlineRef = void 0;
  var t2 = G(), n2 = dr(), r2 = fr(), i2 = /* @__PURE__ */ new Set(["type", "format", "pattern", "maxLength", "minLength", "maxProperties", "minProperties", "maxItems", "minItems", "maximum", "minimum", "uniqueItems", "multipleOf", "required", "enum", "const"]);
  function a2(e3, t3 = !0) {
    return typeof e3 == "boolean" ? !0 : t3 === !0 ? !s2(e3) : t3 ? c2(e3) <= t3 : !1;
  }
  e2.inlineRef = a2;
  var o2 = /* @__PURE__ */ new Set(["$ref", "$recursiveRef", "$recursiveAnchor", "$dynamicRef", "$dynamicAnchor"]);
  function s2(e3) {
    for (let t3 in e3) {
      if (o2.has(t3)) return !0;
      let n3 = e3[t3];
      if (Array.isArray(n3) && n3.some(s2) || typeof n3 == "object" && s2(n3)) return !0;
    }
    return !1;
  }
  function c2(e3) {
    let n3 = 0;
    for (let r3 in e3) if (r3 === "$ref" || (n3++, !i2.has(r3) && (typeof e3[r3] == "object" && (0, t2.eachItem)(e3[r3], (e4) => n3 += c2(e4)), n3 === 1 / 0))) return 1 / 0;
    return n3;
  }
  function l2(e3, t3 = "", n3) {
    return n3 !== !1 && (t3 = f2(t3)), u2(e3, e3.parse(t3));
  }
  e2.getFullPath = l2;
  function u2(e3, t3) {
    return e3.serialize(t3).split("#")[0] + "#";
  }
  e2._getFullPath = u2;
  var d2 = /#\/?$/;
  function f2(e3) {
    return e3 ? e3.replace(d2, "") : "";
  }
  e2.normalizeId = f2;
  function p2(e3, t3, n3) {
    return n3 = f2(n3), e3.resolve(t3, n3);
  }
  e2.resolveUrl = p2;
  var m2 = /^[a-z_][-a-z0-9._]*$/i;
  function h2(e3, t3) {
    if (typeof e3 == "boolean") return {};
    let { schemaId: i3, uriResolver: a3 } = this.opts, o3 = f2(e3[i3] || t3), s3 = { "": o3 }, c3 = l2(a3, o3, !1), u3 = {}, d3 = /* @__PURE__ */ new Set();
    return r2(e3, { allKeys: !0 }, (e4, t4, n3, r3) => {
      if (r3 === void 0) return;
      let a4 = c3 + t4, o4 = s3[r3];
      typeof e4[i3] == "string" && (o4 = l3.call(this, e4[i3])), g2.call(this, e4.$anchor), g2.call(this, e4.$dynamicAnchor), s3[t4] = o4;
      function l3(t5) {
        let n4 = this.opts.uriResolver.resolve;
        if (t5 = f2(o4 ? n4(o4, t5) : t5), d3.has(t5)) throw h3(t5);
        d3.add(t5);
        let r4 = this.refs[t5];
        return typeof r4 == "string" && (r4 = this.refs[r4]), typeof r4 == "object" ? p3(e4, r4.schema, t5) : t5 !== f2(a4) && (t5[0] === "#" ? (p3(e4, u3[t5], t5), u3[t5] = e4) : this.refs[t5] = a4), t5;
      }
      function g2(e5) {
        if (typeof e5 == "string") {
          if (!m2.test(e5)) throw Error(`invalid anchor "${e5}"`);
          l3.call(this, `#${e5}`);
        }
      }
    }), u3;
    function p3(e4, t4, r3) {
      if (t4 !== void 0 && !n2(e4, t4)) throw h3(r3);
    }
    function h3(e4) {
      return Error(`reference "${e4}" resolves to more than one schema`);
    }
  }
  e2.getSchemaRefs = h2;
}));
var mr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.getData = e2.KeywordCxt = e2.validateFunctionCode = void 0;
  var t2 = rr(), n2 = or(), r2 = ar(), i2 = or(), a2 = sr(), o2 = lr(), s2 = ur(), c2 = W(), l2 = tr(), u2 = pr(), d2 = G(), f2 = nr();
  function p2(e3) {
    S2(e3) && (w2(e3), x2(e3)) ? _2(e3) : m2(e3, () => (0, t2.topBoolOrEmptySchema)(e3));
  }
  e2.validateFunctionCode = p2;
  function m2({ gen: e3, validateName: t3, schema: n3, schemaEnv: r3, opts: i3 }, a3) {
    i3.code.es5 ? e3.func(t3, (0, c2._)`${l2.default.data}, ${l2.default.valCxt}`, r3.$async, () => {
      e3.code((0, c2._)`"use strict"; ${y2(n3, i3)}`), g2(e3, i3), e3.code(a3);
    }) : e3.func(t3, (0, c2._)`${l2.default.data}, ${h2(i3)}`, r3.$async, () => e3.code(y2(n3, i3)).code(a3));
  }
  function h2(e3) {
    return (0, c2._)`{${l2.default.instancePath}="", ${l2.default.parentData}, ${l2.default.parentDataProperty}, ${l2.default.rootData}=${l2.default.data}${e3.dynamicRef ? (0, c2._)`, ${l2.default.dynamicAnchors}={}` : c2.nil}}={}`;
  }
  function g2(e3, t3) {
    e3.if(l2.default.valCxt, () => {
      e3.var(l2.default.instancePath, (0, c2._)`${l2.default.valCxt}.${l2.default.instancePath}`), e3.var(l2.default.parentData, (0, c2._)`${l2.default.valCxt}.${l2.default.parentData}`), e3.var(l2.default.parentDataProperty, (0, c2._)`${l2.default.valCxt}.${l2.default.parentDataProperty}`), e3.var(l2.default.rootData, (0, c2._)`${l2.default.valCxt}.${l2.default.rootData}`), t3.dynamicRef && e3.var(l2.default.dynamicAnchors, (0, c2._)`${l2.default.valCxt}.${l2.default.dynamicAnchors}`);
    }, () => {
      e3.var(l2.default.instancePath, (0, c2._)`""`), e3.var(l2.default.parentData, (0, c2._)`undefined`), e3.var(l2.default.parentDataProperty, (0, c2._)`undefined`), e3.var(l2.default.rootData, l2.default.data), t3.dynamicRef && e3.var(l2.default.dynamicAnchors, (0, c2._)`{}`);
    });
  }
  function _2(e3) {
    let { schema: t3, opts: n3, gen: r3 } = e3;
    m2(e3, () => {
      n3.$comment && t3.$comment && A2(e3), D2(e3), r3.let(l2.default.vErrors, null), r3.let(l2.default.errors, 0), n3.unevaluated && v2(e3), T2(e3), j2(e3);
    });
  }
  function v2(e3) {
    let { gen: t3, validateName: n3 } = e3;
    e3.evaluated = t3.const("evaluated", (0, c2._)`${n3}.evaluated`), t3.if((0, c2._)`${e3.evaluated}.dynamicProps`, () => t3.assign((0, c2._)`${e3.evaluated}.props`, (0, c2._)`undefined`)), t3.if((0, c2._)`${e3.evaluated}.dynamicItems`, () => t3.assign((0, c2._)`${e3.evaluated}.items`, (0, c2._)`undefined`));
  }
  function y2(e3, t3) {
    let n3 = typeof e3 == "object" && e3[t3.schemaId];
    return n3 && (t3.code.source || t3.code.process) ? (0, c2._)`/*# sourceURL=${n3} */` : c2.nil;
  }
  function b2(e3, n3) {
    S2(e3) && (w2(e3), x2(e3)) ? C2(e3, n3) : (0, t2.boolOrEmptySchema)(e3, n3);
  }
  function x2({ schema: e3, self: t3 }) {
    if (typeof e3 == "boolean") return !e3;
    for (let n3 in e3) if (t3.RULES.all[n3]) return !0;
    return !1;
  }
  function S2(e3) {
    return typeof e3.schema != "boolean";
  }
  function C2(e3, t3) {
    let { schema: n3, gen: r3, opts: i3 } = e3;
    i3.$comment && n3.$comment && A2(e3), O2(e3), k2(e3);
    let a3 = r3.const("_errs", l2.default.errors);
    T2(e3, a3), r3.var(t3, (0, c2._)`${a3} === ${l2.default.errors}`);
  }
  function w2(e3) {
    (0, d2.checkUnknownRules)(e3), E2(e3);
  }
  function T2(e3, t3) {
    if (e3.opts.jtd) return N2(e3, [], !1, t3);
    let r3 = (0, n2.getSchemaTypes)(e3.schema);
    N2(e3, r3, !(0, n2.coerceAndCheckDataType)(e3, r3), t3);
  }
  function E2(e3) {
    let { schema: t3, errSchemaPath: n3, opts: r3, self: i3 } = e3;
    t3.$ref && r3.ignoreKeywordsWithRef && (0, d2.schemaHasRulesButRef)(t3, i3.RULES) && i3.logger.warn(`$ref: keywords ignored in schema at path "${n3}"`);
  }
  function D2(e3) {
    let { schema: t3, opts: n3 } = e3;
    t3.default !== void 0 && n3.useDefaults && n3.strictSchema && (0, d2.checkStrictMode)(e3, "default is ignored in the schema root");
  }
  function O2(e3) {
    let t3 = e3.schema[e3.opts.schemaId];
    t3 && (e3.baseId = (0, u2.resolveUrl)(e3.opts.uriResolver, e3.baseId, t3));
  }
  function k2(e3) {
    if (e3.schema.$async && !e3.schemaEnv.$async) throw Error("async schema in sync schema");
  }
  function A2({ gen: e3, schemaEnv: t3, schema: n3, errSchemaPath: r3, opts: i3 }) {
    let a3 = n3.$comment;
    if (i3.$comment === !0) e3.code((0, c2._)`${l2.default.self}.logger.log(${a3})`);
    else if (typeof i3.$comment == "function") {
      let n4 = (0, c2.str)`${r3}/$comment`, i4 = e3.scopeValue("root", { ref: t3.root });
      e3.code((0, c2._)`${l2.default.self}.opts.$comment(${a3}, ${n4}, ${i4}.schema)`);
    }
  }
  function j2(e3) {
    let { gen: t3, schemaEnv: n3, validateName: r3, ValidationError: i3, opts: a3 } = e3;
    n3.$async ? t3.if((0, c2._)`${l2.default.errors} === 0`, () => t3.return(l2.default.data), () => t3.throw((0, c2._)`new ${i3}(${l2.default.vErrors})`)) : (t3.assign((0, c2._)`${r3}.errors`, l2.default.vErrors), a3.unevaluated && M2(e3), t3.return((0, c2._)`${l2.default.errors} === 0`));
  }
  function M2({ gen: e3, evaluated: t3, props: n3, items: r3 }) {
    n3 instanceof c2.Name && e3.assign((0, c2._)`${t3}.props`, n3), r3 instanceof c2.Name && e3.assign((0, c2._)`${t3}.items`, r3);
  }
  function N2(e3, t3, n3, a3) {
    let { gen: o3, schema: s3, data: u3, allErrors: f3, opts: p3, self: m3 } = e3, { RULES: h3 } = m3;
    if (s3.$ref && (p3.ignoreKeywordsWithRef || !(0, d2.schemaHasRulesButRef)(s3, h3))) {
      o3.block(() => B2(e3, "$ref", h3.all.$ref.definition));
      return;
    }
    p3.jtd || F2(e3, t3), o3.block(() => {
      for (let e4 of h3.rules) g3(e4);
      g3(h3.post);
    });
    function g3(d3) {
      (0, r2.shouldUseGroup)(s3, d3) && (d3.type ? (o3.if((0, i2.checkDataType)(d3.type, u3, p3.strictNumbers)), P2(e3, d3), t3.length === 1 && t3[0] === d3.type && n3 && (o3.else(), (0, i2.reportTypeError)(e3)), o3.endIf()) : P2(e3, d3), f3 || o3.if((0, c2._)`${l2.default.errors} === ${a3 || 0}`));
    }
  }
  function P2(e3, t3) {
    let { gen: n3, schema: i3, opts: { useDefaults: o3 } } = e3;
    o3 && (0, a2.assignDefaults)(e3, t3.type), n3.block(() => {
      for (let n4 of t3.rules) (0, r2.shouldUseRule)(i3, n4) && B2(e3, n4.keyword, n4.definition, t3.type);
    });
  }
  function F2(e3, t3) {
    !e3.schemaEnv.meta && e3.opts.strictTypes && (ee2(e3, t3), e3.opts.allowUnionTypes || I2(e3, t3), L2(e3, e3.dataTypes));
  }
  function ee2(e3, t3) {
    t3.length && (e3.dataTypes.length ? (t3.forEach((t4) => {
      R2(e3.dataTypes, t4) || re2(e3, `type "${t4}" not allowed by context "${e3.dataTypes.join(",")}"`);
    }), ne2(e3, t3)) : e3.dataTypes = t3);
  }
  function I2(e3, t3) {
    t3.length > 1 && !(t3.length === 2 && t3.includes("null")) && re2(e3, "use allowUnionTypes to allow union type keyword");
  }
  function L2(e3, t3) {
    let n3 = e3.self.RULES.all;
    for (let i3 in n3) {
      let a3 = n3[i3];
      if (typeof a3 == "object" && (0, r2.shouldUseRule)(e3.schema, a3)) {
        let { type: n4 } = a3.definition;
        n4.length && !n4.some((e4) => te2(t3, e4)) && re2(e3, `missing type "${n4.join(",")}" for keyword "${i3}"`);
      }
    }
  }
  function te2(e3, t3) {
    return e3.includes(t3) || t3 === "number" && e3.includes("integer");
  }
  function R2(e3, t3) {
    return e3.includes(t3) || t3 === "integer" && e3.includes("number");
  }
  function ne2(e3, t3) {
    let n3 = [];
    for (let r3 of e3.dataTypes) R2(t3, r3) ? n3.push(r3) : t3.includes("integer") && r3 === "number" && n3.push("integer");
    e3.dataTypes = n3;
  }
  function re2(e3, t3) {
    let n3 = e3.schemaEnv.baseId + e3.errSchemaPath;
    t3 += ` at "${n3}" (strictTypes)`, (0, d2.checkStrictMode)(e3, t3, e3.opts.strictTypes);
  }
  var z2 = class {
    constructor(e3, t3, n3) {
      if ((0, o2.validateKeywordUsage)(e3, t3, n3), this.gen = e3.gen, this.allErrors = e3.allErrors, this.keyword = n3, this.data = e3.data, this.schema = e3.schema[n3], this.$data = t3.$data && e3.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, d2.schemaRefOrVal)(e3, this.schema, n3, this.$data), this.schemaType = t3.schemaType, this.parentSchema = e3.schema, this.params = {}, this.it = e3, this.def = t3, this.$data) this.schemaCode = e3.gen.const("vSchema", oe2(this.$data, e3));
      else if (this.schemaCode = this.schemaValue, !(0, o2.validSchemaType)(this.schema, t3.schemaType, t3.allowUndefined)) throw Error(`${n3} value must be ${JSON.stringify(t3.schemaType)}`);
      ("code" in t3 ? t3.trackErrors : t3.errors !== !1) && (this.errsCount = e3.gen.const("_errs", l2.default.errors));
    }
    result(e3, t3, n3) {
      this.failResult((0, c2.not)(e3), t3, n3);
    }
    failResult(e3, t3, n3) {
      this.gen.if(e3), n3 ? n3() : this.error(), t3 ? (this.gen.else(), t3(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(e3, t3) {
      this.failResult((0, c2.not)(e3), void 0, t3);
    }
    fail(e3) {
      e3 === void 0 ? (this.error(), this.allErrors || this.gen.if(!1)) : (this.gen.if(e3), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else());
    }
    fail$data(e3) {
      if (!this.$data) return this.fail(e3);
      let { schemaCode: t3 } = this;
      this.fail((0, c2._)`${t3} !== undefined && (${(0, c2.or)(this.invalid$data(), e3)})`);
    }
    error(e3, t3, n3) {
      t3 ? (this.setParams(t3), this._error(e3, n3), this.setParams({})) : this._error(e3, n3);
    }
    _error(e3, t3) {
      (e3 ? f2.reportExtraError : f2.reportError)(this, this.def.error, t3);
    }
    $dataError() {
      (0, f2.reportError)(this, this.def.$dataError || f2.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0) throw Error('add "trackErrors" to keyword definition');
      (0, f2.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(e3) {
      this.allErrors || this.gen.if(e3);
    }
    setParams(e3, t3) {
      t3 ? Object.assign(this.params, e3) : this.params = e3;
    }
    block$data(e3, t3, n3 = c2.nil) {
      this.gen.block(() => {
        this.check$data(e3, n3), t3();
      });
    }
    check$data(e3 = c2.nil, t3 = c2.nil) {
      if (!this.$data) return;
      let { gen: n3, schemaCode: r3, schemaType: i3, def: a3 } = this;
      n3.if((0, c2.or)((0, c2._)`${r3} === undefined`, t3)), e3 !== c2.nil && n3.assign(e3, !0), (i3.length || a3.validateSchema) && (n3.elseIf(this.invalid$data()), this.$dataError(), e3 !== c2.nil && n3.assign(e3, !1)), n3.else();
    }
    invalid$data() {
      let { gen: e3, schemaCode: t3, schemaType: n3, def: r3, it: a3 } = this;
      return (0, c2.or)(o3(), s3());
      function o3() {
        if (n3.length) {
          if (!(t3 instanceof c2.Name)) throw Error("ajv implementation error");
          let e4 = Array.isArray(n3) ? n3 : [n3];
          return (0, c2._)`${(0, i2.checkDataTypes)(e4, t3, a3.opts.strictNumbers, i2.DataType.Wrong)}`;
        }
        return c2.nil;
      }
      function s3() {
        if (r3.validateSchema) {
          let n4 = e3.scopeValue("validate$data", { ref: r3.validateSchema });
          return (0, c2._)`!${n4}(${t3})`;
        }
        return c2.nil;
      }
    }
    subschema(e3, t3) {
      let n3 = (0, s2.getSubschema)(this.it, e3);
      (0, s2.extendSubschemaData)(n3, this.it, e3), (0, s2.extendSubschemaMode)(n3, e3);
      let r3 = { ...this.it, ...n3, items: void 0, props: void 0 };
      return b2(r3, t3), r3;
    }
    mergeEvaluated(e3, t3) {
      let { it: n3, gen: r3 } = this;
      n3.opts.unevaluated && (n3.props !== !0 && e3.props !== void 0 && (n3.props = d2.mergeEvaluated.props(r3, e3.props, n3.props, t3)), n3.items !== !0 && e3.items !== void 0 && (n3.items = d2.mergeEvaluated.items(r3, e3.items, n3.items, t3)));
    }
    mergeValidEvaluated(e3, t3) {
      let { it: n3, gen: r3 } = this;
      if (n3.opts.unevaluated && (n3.props !== !0 || n3.items !== !0)) return r3.if(t3, () => this.mergeEvaluated(e3, c2.Name)), !0;
    }
  };
  e2.KeywordCxt = z2;
  function B2(e3, t3, n3, r3) {
    let i3 = new z2(e3, n3, t3);
    "code" in n3 ? n3.code(i3, r3) : i3.$data && n3.validate ? (0, o2.funcKeywordCode)(i3, n3) : "macro" in n3 ? (0, o2.macroKeywordCode)(i3, n3) : (n3.compile || n3.validate) && (0, o2.funcKeywordCode)(i3, n3);
  }
  var ie2 = /^\/(?:[^~]|~0|~1)*$/, ae2 = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function oe2(e3, { dataLevel: t3, dataNames: n3, dataPathArr: r3 }) {
    let i3, a3;
    if (e3 === "") return l2.default.rootData;
    if (e3[0] === "/") {
      if (!ie2.test(e3)) throw Error(`Invalid JSON-pointer: ${e3}`);
      i3 = e3, a3 = l2.default.rootData;
    } else {
      let o4 = ae2.exec(e3);
      if (!o4) throw Error(`Invalid JSON-pointer: ${e3}`);
      let s4 = +o4[1];
      if (i3 = o4[2], i3 === "#") {
        if (s4 >= t3) throw Error(u3("property/index", s4));
        return r3[t3 - s4];
      }
      if (s4 > t3) throw Error(u3("data", s4));
      if (a3 = n3[t3 - s4], !i3) return a3;
    }
    let o3 = a3, s3 = i3.split("/");
    for (let e4 of s3) e4 && (a3 = (0, c2._)`${a3}${(0, c2.getProperty)((0, d2.unescapeJsonPointer)(e4))}`, o3 = (0, c2._)`${o3} && ${a3}`);
    return o3;
    function u3(e4, n4) {
      return `Cannot access ${e4} ${n4} levels up, current level is ${t3}`;
    }
  }
  e2.getData = oe2;
}));
var hr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.default = class extends Error {
    constructor(e3) {
      super("validation failed"), this.errors = e3, this.ajv = this.validation = !0;
    }
  };
}));
var gr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = pr();
  e2.default = class extends Error {
    constructor(e3, n2, r2, i2) {
      super(i2 || `can't resolve reference ${r2} from id ${n2}`), this.missingRef = (0, t2.resolveUrl)(e3, n2, r2), this.missingSchema = (0, t2.normalizeId)((0, t2.getFullPath)(e3, this.missingRef));
    }
  };
}));
var _r = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.resolveSchema = e2.getCompilingSchema = e2.resolveRef = e2.compileSchema = e2.SchemaEnv = void 0;
  var t2 = W(), n2 = hr(), r2 = tr(), i2 = pr(), a2 = G(), o2 = mr(), s2 = class {
    constructor(e3) {
      this.refs = {}, this.dynamicAnchors = {};
      let t3;
      typeof e3.schema == "object" && (t3 = e3.schema), this.schema = e3.schema, this.schemaId = e3.schemaId, this.root = e3.root || this, this.baseId = e3.baseId ?? (0, i2.normalizeId)(t3?.[e3.schemaId || "$id"]), this.schemaPath = e3.schemaPath, this.localRefs = e3.localRefs, this.meta = e3.meta, this.$async = t3?.$async, this.refs = {};
    }
  };
  e2.SchemaEnv = s2;
  function c2(e3) {
    let a3 = d2.call(this, e3);
    if (a3) return a3;
    let s3 = (0, i2.getFullPath)(this.opts.uriResolver, e3.root.baseId), { es5: c3, lines: l3 } = this.opts.code, { ownProperties: u3 } = this.opts, f3 = new t2.CodeGen(this.scope, { es5: c3, lines: l3, ownProperties: u3 }), p3;
    e3.$async && (p3 = f3.scopeValue("Error", { ref: n2.default, code: (0, t2._)`require("ajv/dist/runtime/validation_error").default` }));
    let m3 = f3.scopeName("validate");
    e3.validateName = m3;
    let h3 = { gen: f3, allErrors: this.opts.allErrors, data: r2.default.data, parentData: r2.default.parentData, parentDataProperty: r2.default.parentDataProperty, dataNames: [r2.default.data], dataPathArr: [t2.nil], dataLevel: 0, dataTypes: [], definedProperties: /* @__PURE__ */ new Set(), topSchemaRef: f3.scopeValue("schema", this.opts.code.source === !0 ? { ref: e3.schema, code: (0, t2.stringify)(e3.schema) } : { ref: e3.schema }), validateName: m3, ValidationError: p3, schema: e3.schema, schemaEnv: e3, rootId: s3, baseId: e3.baseId || s3, schemaPath: t2.nil, errSchemaPath: e3.schemaPath || (this.opts.jtd ? "" : "#"), errorPath: (0, t2._)`""`, opts: this.opts, self: this }, g3;
    try {
      this._compilations.add(e3), (0, o2.validateFunctionCode)(h3), f3.optimize(this.opts.code.optimize);
      let n3 = f3.toString();
      g3 = `${f3.scopeRefs(r2.default.scope)}return ${n3}`, this.opts.code.process && (g3 = this.opts.code.process(g3, e3));
      let i3 = Function(`${r2.default.self}`, `${r2.default.scope}`, g3)(this, this.scope.get());
      if (this.scope.value(m3, { ref: i3 }), i3.errors = null, i3.schema = e3.schema, i3.schemaEnv = e3, e3.$async && (i3.$async = !0), this.opts.code.source === !0 && (i3.source = { validateName: m3, validateCode: n3, scopeValues: f3._values }), this.opts.unevaluated) {
        let { props: e4, items: n4 } = h3;
        i3.evaluated = { props: e4 instanceof t2.Name ? void 0 : e4, items: n4 instanceof t2.Name ? void 0 : n4, dynamicProps: e4 instanceof t2.Name, dynamicItems: n4 instanceof t2.Name }, i3.source && (i3.source.evaluated = (0, t2.stringify)(i3.evaluated));
      }
      return e3.validate = i3, e3;
    } catch (t3) {
      throw delete e3.validate, delete e3.validateName, g3 && this.logger.error("Error compiling schema, function code:", g3), t3;
    } finally {
      this._compilations.delete(e3);
    }
  }
  e2.compileSchema = c2;
  function l2(e3, t3, n3) {
    n3 = (0, i2.resolveUrl)(this.opts.uriResolver, t3, n3);
    let r3 = e3.refs[n3];
    if (r3) return r3;
    let a3 = p2.call(this, e3, n3);
    if (a3 === void 0) {
      let r4 = e3.localRefs?.[n3], { schemaId: i3 } = this.opts;
      r4 && (a3 = new s2({ schema: r4, schemaId: i3, root: e3, baseId: t3 }));
    }
    if (a3 !== void 0) return e3.refs[n3] = u2.call(this, a3);
  }
  e2.resolveRef = l2;
  function u2(e3) {
    return (0, i2.inlineRef)(e3.schema, this.opts.inlineRefs) ? e3.schema : e3.validate ? e3 : c2.call(this, e3);
  }
  function d2(e3) {
    for (let t3 of this._compilations) if (f2(t3, e3)) return t3;
  }
  e2.getCompilingSchema = d2;
  function f2(e3, t3) {
    return e3.schema === t3.schema && e3.root === t3.root && e3.baseId === t3.baseId;
  }
  function p2(e3, t3) {
    let n3;
    for (; typeof (n3 = this.refs[t3]) == "string"; ) t3 = n3;
    return n3 || this.schemas[t3] || m2.call(this, e3, t3);
  }
  function m2(e3, t3) {
    let n3 = this.opts.uriResolver.parse(t3), r3 = (0, i2._getFullPath)(this.opts.uriResolver, n3), a3 = (0, i2.getFullPath)(this.opts.uriResolver, e3.baseId, void 0);
    if (Object.keys(e3.schema).length > 0 && r3 === a3) return g2.call(this, n3, e3);
    let o3 = (0, i2.normalizeId)(r3), l3 = this.refs[o3] || this.schemas[o3];
    if (typeof l3 == "string") {
      let t4 = m2.call(this, e3, l3);
      return typeof t4?.schema == "object" ? g2.call(this, n3, t4) : void 0;
    }
    if (typeof l3?.schema == "object") {
      if (l3.validate || c2.call(this, l3), o3 === (0, i2.normalizeId)(t3)) {
        let { schema: t4 } = l3, { schemaId: n4 } = this.opts, r4 = t4[n4];
        return r4 && (a3 = (0, i2.resolveUrl)(this.opts.uriResolver, a3, r4)), new s2({ schema: t4, schemaId: n4, root: e3, baseId: a3 });
      }
      return g2.call(this, n3, l3);
    }
  }
  e2.resolveSchema = m2;
  var h2 = /* @__PURE__ */ new Set(["properties", "patternProperties", "enum", "dependencies", "definitions"]);
  function g2(e3, { baseId: t3, schema: n3, root: r3 }) {
    if (e3.fragment?.[0] !== "/") return;
    for (let r4 of e3.fragment.slice(1).split("/")) {
      if (typeof n3 == "boolean") return;
      let e4 = n3[(0, a2.unescapeFragment)(r4)];
      if (e4 === void 0) return;
      n3 = e4;
      let o4 = typeof n3 == "object" && n3[this.opts.schemaId];
      !h2.has(r4) && o4 && (t3 = (0, i2.resolveUrl)(this.opts.uriResolver, t3, o4));
    }
    let o3;
    if (typeof n3 != "boolean" && n3.$ref && !(0, a2.schemaHasRulesButRef)(n3, this.RULES)) {
      let e4 = (0, i2.resolveUrl)(this.opts.uriResolver, t3, n3.$ref);
      o3 = m2.call(this, r3, e4);
    }
    let { schemaId: c3 } = this.opts;
    if (o3 ||= new s2({ schema: n3, schemaId: c3, root: r3, baseId: t3 }), o3.schema !== o3.root.schema) return o3;
  }
}));
var vr = r({ $id: () => yr, additionalProperties: () => !1, default: () => wr, description: () => br, properties: () => Cr, required: () => Sr, type: () => xr });
var yr;
var br;
var xr;
var Sr;
var Cr;
var wr;
var Tr = t((() => {
  yr = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", br = "Meta-schema for $data reference (JSON AnySchema extension proposal)", xr = "object", Sr = ["$data"], Cr = { $data: { type: "string", anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }] } }, wr = { $id: yr, description: br, type: xr, required: Sr, properties: Cr, additionalProperties: !1 };
}));
var Er = i(((e2, t2) => {
  var n2 = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu), r2 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u), i2 = RegExp.prototype.test.bind(/^[\da-f]{2}$/iu), a2 = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu), o2 = RegExp.prototype.test.bind(/^[\da-z\-._~!$&'()*+,;=:@/]$/iu);
  function s2(e3) {
    let t3 = "", n3 = 0, r3 = 0;
    for (r3 = 0; r3 < e3.length; r3++) if (n3 = e3[r3].charCodeAt(0), n3 !== 48) {
      if (!(n3 >= 48 && n3 <= 57 || n3 >= 65 && n3 <= 70 || n3 >= 97 && n3 <= 102)) return "";
      t3 += e3[r3];
      break;
    }
    for (r3 += 1; r3 < e3.length; r3++) {
      if (n3 = e3[r3].charCodeAt(0), !(n3 >= 48 && n3 <= 57 || n3 >= 65 && n3 <= 70 || n3 >= 97 && n3 <= 102)) return "";
      t3 += e3[r3];
    }
    return t3;
  }
  var c2 = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
  function l2(e3) {
    return e3.length = 0, !0;
  }
  function u2(e3, t3, n3) {
    if (e3.length) {
      let r3 = s2(e3);
      if (r3 !== "") t3.push(r3);
      else return n3.error = !0, !1;
      e3.length = 0;
    }
    return !0;
  }
  function d2(e3) {
    let t3 = 0, n3 = { error: !1, address: "", zone: "" }, r3 = [], i3 = [], a3 = !1, o3 = !1, c3 = u2;
    for (let s3 = 0; s3 < e3.length; s3++) {
      let u3 = e3[s3];
      if (u3 !== "[" && u3 !== "]")
        if (u3 === ":") {
          if (a3 === !0 && (o3 = !0), !c3(i3, r3, n3)) break;
          if (++t3 > 7) {
            n3.error = !0;
            break;
          }
          s3 > 0 && e3[s3 - 1] === ":" && (a3 = !0), r3.push(":");
        } else if (u3 === "%") {
          if (!c3(i3, r3, n3)) break;
          c3 = l2;
        } else {
          i3.push(u3);
          continue;
        }
    }
    return i3.length && (c3 === l2 ? n3.zone = i3.join("") : o3 ? r3.push(i3.join("")) : r3.push(s2(i3))), n3.address = r3.join(""), n3;
  }
  function f2(e3) {
    if (p2(e3, ":") < 2) return { host: e3, isIPV6: !1 };
    let t3 = d2(e3);
    if (t3.error) return { host: e3, isIPV6: !1 };
    {
      let e4 = t3.address, n3 = t3.address;
      return t3.zone && (e4 += "%" + t3.zone, n3 += "%25" + t3.zone), { host: e4, isIPV6: !0, escapedHost: n3 };
    }
  }
  function p2(e3, t3) {
    let n3 = 0;
    for (let r3 = 0; r3 < e3.length; r3++) e3[r3] === t3 && n3++;
    return n3;
  }
  function m2(e3) {
    let t3 = e3, n3 = [], r3 = -1, i3 = 0;
    for (; i3 = t3.length; ) {
      if (i3 === 1) {
        if (t3 === ".") break;
        if (t3 === "/") {
          n3.push("/");
          break;
        }
        n3.push(t3);
        break;
      }
      if (i3 === 2) {
        if (t3[0] === ".") {
          if (t3[1] === ".") break;
          if (t3[1] === "/") {
            t3 = t3.slice(2);
            continue;
          }
        } else if (t3[0] === "/" && (t3[1] === "." || t3[1] === "/")) {
          n3.push("/");
          break;
        }
      } else if (i3 === 3 && t3 === "/..") {
        n3.length !== 0 && n3.pop(), n3.push("/");
        break;
      }
      if (t3[0] === ".") {
        if (t3[1] === ".") {
          if (t3[2] === "/") {
            t3 = t3.slice(3);
            continue;
          }
        } else if (t3[1] === "/") {
          t3 = t3.slice(2);
          continue;
        }
      } else if (t3[0] === "/" && t3[1] === ".") {
        if (t3[2] === "/") {
          t3 = t3.slice(2);
          continue;
        }
        if (t3[2] === "." && t3[3] === "/") {
          t3 = t3.slice(3), n3.length !== 0 && n3.pop();
          continue;
        }
      }
      if ((r3 = t3.indexOf("/", 1)) === -1) {
        n3.push(t3);
        break;
      }
      n3.push(t3.slice(0, r3)), t3 = t3.slice(r3);
    }
    return n3.join("");
  }
  var h2 = { "@": "%40", "/": "%2F", "?": "%3F", "#": "%23", ":": "%3A" }, g2 = /[@/?#:]/g, _2 = /[@/?#]/g;
  function v2(e3, t3) {
    let n3 = t3 ? _2 : g2;
    return n3.lastIndex = 0, e3.replace(n3, (e4) => h2[e4]);
  }
  function y2(e3, t3 = !1) {
    if (e3.indexOf("%") === -1) return e3;
    let n3 = "";
    for (let r3 = 0; r3 < e3.length; r3++) {
      if (e3[r3] === "%" && r3 + 2 < e3.length) {
        let o3 = e3.slice(r3 + 1, r3 + 3);
        if (i2(o3)) {
          let e4 = o3.toUpperCase(), i3 = String.fromCharCode(parseInt(e4, 16));
          t3 && a2(i3) ? n3 += i3 : n3 += "%" + e4, r3 += 2;
          continue;
        }
      }
      n3 += e3[r3];
    }
    return n3;
  }
  function b2(e3) {
    let t3 = "";
    for (let n3 = 0; n3 < e3.length; n3++) {
      if (e3[n3] === "%" && n3 + 2 < e3.length) {
        let r3 = e3.slice(n3 + 1, n3 + 3);
        if (i2(r3)) {
          let e4 = r3.toUpperCase(), i3 = String.fromCharCode(parseInt(e4, 16));
          i3 !== "." && a2(i3) ? t3 += i3 : t3 += "%" + e4, n3 += 2;
          continue;
        }
      }
      o2(e3[n3]) ? t3 += e3[n3] : t3 += escape(e3[n3]);
    }
    return t3;
  }
  function x2(e3) {
    let t3 = "";
    for (let n3 = 0; n3 < e3.length; n3++) {
      if (e3[n3] === "%" && n3 + 2 < e3.length) {
        let r3 = e3.slice(n3 + 1, n3 + 3);
        if (i2(r3)) {
          t3 += "%" + r3.toUpperCase(), n3 += 2;
          continue;
        }
      }
      t3 += escape(e3[n3]);
    }
    return t3;
  }
  function S2(e3) {
    let t3 = [];
    if (e3.userinfo !== void 0 && (t3.push(e3.userinfo), t3.push("@")), e3.host !== void 0) {
      let n3 = unescape(e3.host);
      if (!r2(n3)) {
        let e4 = f2(n3);
        n3 = e4.isIPV6 === !0 ? `[${e4.escapedHost}]` : v2(n3, !1);
      }
      t3.push(n3);
    }
    return (typeof e3.port == "number" || typeof e3.port == "string") && (t3.push(":"), t3.push(String(e3.port))), t3.length ? t3.join("") : void 0;
  }
  t2.exports = { nonSimpleDomain: c2, recomposeAuthority: S2, reescapeHostDelimiters: v2, normalizePercentEncoding: y2, normalizePathEncoding: b2, escapePreservingEscapes: x2, removeDotSegments: m2, isIPv4: r2, isUUID: n2, normalizeIPv6: f2, stringArrayToHexStripped: s2 };
}));
var Dr = i(((e2, t2) => {
  var { isUUID: n2 } = Er(), r2 = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu, i2 = ["http", "https", "ws", "wss", "urn", "urn:uuid"];
  function a2(e3) {
    return i2.indexOf(e3) !== -1;
  }
  function o2(e3) {
    return e3.secure === !0 ? !0 : e3.secure === !1 ? !1 : e3.scheme ? e3.scheme.length === 3 && (e3.scheme[0] === "w" || e3.scheme[0] === "W") && (e3.scheme[1] === "s" || e3.scheme[1] === "S") && (e3.scheme[2] === "s" || e3.scheme[2] === "S") : !1;
  }
  function s2(e3) {
    return e3.host || (e3.error = e3.error || "HTTP URIs must have a host."), e3;
  }
  function c2(e3) {
    let t3 = String(e3.scheme).toLowerCase() === "https";
    return (e3.port === (t3 ? 443 : 80) || e3.port === "") && (e3.port = void 0), e3.path ||= "/", e3;
  }
  function l2(e3) {
    return e3.secure = o2(e3), e3.resourceName = (e3.path || "/") + (e3.query ? "?" + e3.query : ""), e3.path = void 0, e3.query = void 0, e3;
  }
  function u2(e3) {
    if ((e3.port === (o2(e3) ? 443 : 80) || e3.port === "") && (e3.port = void 0), typeof e3.secure == "boolean" && (e3.scheme = e3.secure ? "wss" : "ws", e3.secure = void 0), e3.resourceName) {
      let [t3, n3] = e3.resourceName.split("?");
      e3.path = t3 && t3 !== "/" ? t3 : void 0, e3.query = n3, e3.resourceName = void 0;
    }
    return e3.fragment = void 0, e3;
  }
  function d2(e3, t3) {
    if (!e3.path) return e3.error = "URN can not be parsed", e3;
    let n3 = e3.path.match(r2);
    if (n3) {
      let r3 = t3.scheme || e3.scheme || "urn";
      e3.nid = n3[1].toLowerCase(), e3.nss = n3[2];
      let i3 = y2(`${r3}:${t3.nid || e3.nid}`);
      e3.path = void 0, i3 && (e3 = i3.parse(e3, t3));
    } else e3.error = e3.error || "URN can not be parsed.";
    return e3;
  }
  function f2(e3, t3) {
    if (e3.nid === void 0) throw Error("URN without nid cannot be serialized");
    let n3 = t3.scheme || e3.scheme || "urn", r3 = e3.nid.toLowerCase(), i3 = y2(`${n3}:${t3.nid || r3}`);
    i3 && (e3 = i3.serialize(e3, t3));
    let a3 = e3, o3 = e3.nss;
    return a3.path = `${r3 || t3.nid}:${o3}`, t3.skipEscape = !0, a3;
  }
  function p2(e3, t3) {
    let r3 = e3;
    return r3.uuid = r3.nss, r3.nss = void 0, t3.tolerant || r3.uuid && n2(r3.uuid) || (r3.error = r3.error || "UUID is not valid."), r3;
  }
  function m2(e3) {
    let t3 = e3;
    return t3.nss = (e3.uuid || "").toLowerCase(), t3;
  }
  var h2 = { scheme: "http", domainHost: !0, parse: s2, serialize: c2 }, g2 = { scheme: "https", domainHost: h2.domainHost, parse: s2, serialize: c2 }, _2 = { scheme: "ws", domainHost: !0, parse: l2, serialize: u2 }, v2 = { http: h2, https: g2, ws: _2, wss: { scheme: "wss", domainHost: _2.domainHost, parse: _2.parse, serialize: _2.serialize }, urn: { scheme: "urn", parse: d2, serialize: f2, skipNormalize: !0 }, "urn:uuid": { scheme: "urn:uuid", parse: p2, serialize: m2, skipNormalize: !0 } };
  Object.setPrototypeOf(v2, null);
  function y2(e3) {
    return e3 && (v2[e3] || v2[e3.toLowerCase()]) || void 0;
  }
  t2.exports = { wsIsSecure: o2, SCHEMES: v2, isValidSchemeName: a2, getSchemeHandler: y2 };
}));
var Or = i(((e2, t2) => {
  var { normalizeIPv6: n2, removeDotSegments: r2, recomposeAuthority: i2, normalizePercentEncoding: a2, normalizePathEncoding: o2, escapePreservingEscapes: s2, reescapeHostDelimiters: c2, isIPv4: l2, nonSimpleDomain: u2 } = Er(), { SCHEMES: d2, getSchemeHandler: f2 } = Dr();
  function p2(e3, t3) {
    return typeof e3 == "string" ? e3 = S2(e3, t3) : typeof e3 == "object" && (e3 = x2(_2(e3, t3), t3)), e3;
  }
  function m2(e3, t3, n3) {
    let r3 = n3 ? Object.assign({ scheme: "null" }, n3) : { scheme: "null" }, i3 = h2(x2(e3, r3), x2(t3, r3), r3, !0);
    return r3.skipEscape = !0, _2(i3, r3);
  }
  function h2(e3, t3, n3, i3) {
    let a3 = {};
    return i3 || (e3 = x2(_2(e3, n3), n3), t3 = x2(_2(t3, n3), n3)), n3 ||= {}, !n3.tolerant && t3.scheme ? (a3.scheme = t3.scheme, a3.userinfo = t3.userinfo, a3.host = t3.host, a3.port = t3.port, a3.path = r2(t3.path || ""), a3.query = t3.query) : (t3.userinfo !== void 0 || t3.host !== void 0 || t3.port !== void 0 ? (a3.userinfo = t3.userinfo, a3.host = t3.host, a3.port = t3.port, a3.path = r2(t3.path || ""), a3.query = t3.query) : (t3.path ? (t3.path[0] === "/" ? a3.path = r2(t3.path) : (a3.path = (e3.userinfo !== void 0 || e3.host !== void 0 || e3.port !== void 0) && !e3.path ? "/" + t3.path : e3.path ? e3.path.slice(0, e3.path.lastIndexOf("/") + 1) + t3.path : t3.path, a3.path = r2(a3.path)), a3.query = t3.query) : (a3.path = e3.path, a3.query = t3.query === void 0 ? e3.query : t3.query), a3.userinfo = e3.userinfo, a3.host = e3.host, a3.port = e3.port), a3.scheme = e3.scheme), a3.fragment = t3.fragment, a3;
  }
  function g2(e3, t3, n3) {
    let r3 = w2(e3, n3), i3 = w2(t3, n3);
    return r3 !== void 0 && i3 !== void 0 && r3.toLowerCase() === i3.toLowerCase();
  }
  function _2(e3, t3) {
    let n3 = { host: e3.host, scheme: e3.scheme, userinfo: e3.userinfo, port: e3.port, path: e3.path, query: e3.query, nid: e3.nid, nss: e3.nss, uuid: e3.uuid, fragment: e3.fragment, reference: e3.reference, resourceName: e3.resourceName, secure: e3.secure, error: "" }, o3 = Object.assign({}, t3), c3 = [], l3 = f2(o3.scheme || n3.scheme);
    l3 && l3.serialize && l3.serialize(n3, o3), n3.path !== void 0 && (o3.skipEscape ? n3.path = a2(n3.path) : (n3.path = s2(n3.path), n3.scheme !== void 0 && (n3.path = n3.path.split("%3A").join(":")))), o3.reference !== "suffix" && n3.scheme && c3.push(n3.scheme, ":");
    let u3 = i2(n3);
    if (u3 !== void 0 && (o3.reference !== "suffix" && c3.push("//"), c3.push(u3), n3.path && n3.path[0] !== "/" && c3.push("/")), n3.path !== void 0) {
      let e4 = n3.path;
      o3.absolutePath || l3 && l3.absolutePath || (e4 = r2(e4)), u3 === void 0 && e4[0] === "/" && e4[1] === "/" && (e4 = "/%2F" + e4.slice(2)), c3.push(e4);
    }
    return n3.query !== void 0 && c3.push("?", n3.query), n3.fragment !== void 0 && c3.push("#", n3.fragment), c3.join("");
  }
  var v2 = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function y2(e3, t3) {
    if (t3[2] !== void 0 && e3.path && e3.path[0] !== "/") return 'URI path must start with "/" when authority is present.';
    if (typeof e3.port == "number" && (e3.port < 0 || e3.port > 65535)) return "URI port is malformed.";
  }
  function b2(e3, t3) {
    let r3 = Object.assign({}, t3), i3 = { scheme: void 0, userinfo: void 0, host: "", port: void 0, path: "", query: void 0, fragment: void 0 }, a3 = !1, s3 = !1;
    r3.reference === "suffix" && (e3 = r3.scheme ? r3.scheme + ":" + e3 : "//" + e3);
    let d3 = e3.match(v2);
    if (d3) {
      i3.scheme = d3[1], i3.userinfo = d3[3], i3.host = d3[4], i3.port = parseInt(d3[5], 10), i3.path = d3[6] || "", i3.query = d3[7], i3.fragment = d3[8], isNaN(i3.port) && (i3.port = d3[5]);
      let t4 = y2(i3, d3);
      if (t4 !== void 0 && (i3.error = i3.error || t4, a3 = !0), i3.host)
        if (l2(i3.host) === !1) {
          let e4 = n2(i3.host);
          i3.host = e4.host.toLowerCase(), s3 = e4.isIPV6;
        } else s3 = !0;
      i3.reference = i3.scheme === void 0 && i3.userinfo === void 0 && i3.host === void 0 && i3.port === void 0 && i3.query === void 0 && !i3.path ? "same-document" : i3.scheme === void 0 ? "relative" : i3.fragment === void 0 ? "absolute" : "uri", r3.reference && r3.reference !== "suffix" && r3.reference !== i3.reference && (i3.error = i3.error || "URI is not a " + r3.reference + " reference.");
      let p3 = f2(r3.scheme || i3.scheme);
      if (!r3.unicodeSupport && (!p3 || !p3.unicodeSupport) && i3.host && (r3.domainHost || p3 && p3.domainHost) && s3 === !1 && u2(i3.host)) try {
        i3.host = URL.domainToASCII(i3.host.toLowerCase());
      } catch (e4) {
        i3.error = i3.error || "Host's domain name can not be converted to ASCII: " + e4;
      }
      if ((!p3 || p3 && !p3.skipNormalize) && (e3.indexOf("%") !== -1 && (i3.scheme !== void 0 && (i3.scheme = unescape(i3.scheme)), i3.host !== void 0 && (i3.host = c2(unescape(i3.host), s3))), i3.path &&= o2(i3.path), i3.fragment)) try {
        i3.fragment = encodeURI(decodeURIComponent(i3.fragment));
      } catch {
        i3.error = i3.error || "URI malformed";
      }
      p3 && p3.parse && p3.parse(i3, r3);
    } else i3.error = i3.error || "URI can not be parsed.";
    return { parsed: i3, malformedAuthorityOrPort: a3 };
  }
  function x2(e3, t3) {
    return b2(e3, t3).parsed;
  }
  function S2(e3, t3) {
    return C2(e3, t3).normalized;
  }
  function C2(e3, t3) {
    let { parsed: n3, malformedAuthorityOrPort: r3 } = b2(e3, t3);
    return { normalized: r3 ? e3 : _2(n3, t3), malformedAuthorityOrPort: r3 };
  }
  function w2(e3, t3) {
    if (typeof e3 == "string") {
      let { normalized: n3, malformedAuthorityOrPort: r3 } = C2(e3, t3);
      return r3 ? void 0 : n3;
    }
    if (typeof e3 == "object") return _2(e3, t3);
  }
  var T2 = { SCHEMES: d2, normalize: p2, resolve: m2, resolveComponent: h2, equal: g2, serialize: _2, parse: x2 };
  t2.exports = T2, t2.exports.default = T2, t2.exports.fastUri = T2;
}));
var kr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = Or();
  t2.code = 'require("ajv/dist/runtime/uri").default', e2.default = t2;
}));
var Ar = i(((t2) => {
  Object.defineProperty(t2, "__esModule", { value: !0 }), t2.CodeGen = t2.Name = t2.nil = t2.stringify = t2.str = t2._ = t2.KeywordCxt = void 0;
  var n2 = mr();
  Object.defineProperty(t2, "KeywordCxt", { enumerable: !0, get: function() {
    return n2.KeywordCxt;
  } });
  var r2 = W();
  Object.defineProperty(t2, "_", { enumerable: !0, get: function() {
    return r2._;
  } }), Object.defineProperty(t2, "str", { enumerable: !0, get: function() {
    return r2.str;
  } }), Object.defineProperty(t2, "stringify", { enumerable: !0, get: function() {
    return r2.stringify;
  } }), Object.defineProperty(t2, "nil", { enumerable: !0, get: function() {
    return r2.nil;
  } }), Object.defineProperty(t2, "Name", { enumerable: !0, get: function() {
    return r2.Name;
  } }), Object.defineProperty(t2, "CodeGen", { enumerable: !0, get: function() {
    return r2.CodeGen;
  } });
  var i2 = hr(), a2 = gr(), o2 = ir(), s2 = _r(), c2 = W(), l2 = pr(), u2 = or(), d2 = G(), f2 = (Tr(), e(vr).default), p2 = kr(), m2 = (e2, t3) => new RegExp(e2, t3);
  m2.code = "new RegExp";
  var h2 = ["removeAdditional", "useDefaults", "coerceTypes"], g2 = /* @__PURE__ */ new Set(["validate", "serialize", "parse", "wrapper", "root", "schema", "keyword", "pattern", "formats", "validate$data", "func", "obj", "Error"]), _2 = { errorDataPath: "", format: "`validateFormats: false` can be used instead.", nullable: '"nullable" keyword is supported by default.', jsonPointers: "Deprecated jsPropertySyntax can be used instead.", extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.", missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.", processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`", sourceCode: "Use option `code: {source: true}`", strictDefaults: "It is default now, see option `strict`.", strictKeywords: "It is default now, see option `strict`.", uniqueItems: '"uniqueItems" keyword is always validated.', unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).", cache: "Map is used as cache, schema object as key.", serialize: "Map is used as cache, schema object as key.", ajvErrors: "It is default now." }, v2 = { ignoreKeywordsWithRef: "", jsPropertySyntax: "", unicode: '"minLength"/"maxLength" account for unicode characters by default.' }, y2 = 200;
  function b2(e2) {
    let t3 = e2.strict, n3 = e2.code?.optimize, r3 = n3 === !0 || n3 === void 0 ? 1 : n3 || 0, i3 = e2.code?.regExp ?? m2, a3 = e2.uriResolver ?? p2.default;
    return { strictSchema: e2.strictSchema ?? t3 ?? !0, strictNumbers: e2.strictNumbers ?? t3 ?? !0, strictTypes: e2.strictTypes ?? t3 ?? "log", strictTuples: e2.strictTuples ?? t3 ?? "log", strictRequired: e2.strictRequired ?? t3 ?? !1, code: e2.code ? { ...e2.code, optimize: r3, regExp: i3 } : { optimize: r3, regExp: i3 }, loopRequired: e2.loopRequired ?? y2, loopEnum: e2.loopEnum ?? y2, meta: e2.meta ?? !0, messages: e2.messages ?? !0, inlineRefs: e2.inlineRefs ?? !0, schemaId: e2.schemaId ?? "$id", addUsedSchema: e2.addUsedSchema ?? !0, validateSchema: e2.validateSchema ?? !0, validateFormats: e2.validateFormats ?? !0, unicodeRegExp: e2.unicodeRegExp ?? !0, int32range: e2.int32range ?? !0, uriResolver: a3 };
  }
  var x2 = class {
    constructor(e2 = {}) {
      this.schemas = {}, this.refs = {}, this.formats = /* @__PURE__ */ Object.create(null), this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), e2 = this.opts = { ...e2, ...b2(e2) };
      let { es5: t3, lines: n3 } = this.opts.code;
      this.scope = new c2.ValueScope({ scope: {}, prefixes: g2, es5: t3, lines: n3 }), this.logger = k2(e2.logger);
      let r3 = e2.validateFormats;
      e2.validateFormats = !1, this.RULES = (0, o2.getRules)(), S2.call(this, _2, e2, "NOT SUPPORTED"), S2.call(this, v2, e2, "DEPRECATED", "warn"), this._metaOpts = D2.call(this), e2.formats && T2.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), e2.keywords && E2.call(this, e2.keywords), typeof e2.meta == "object" && this.addMetaSchema(e2.meta), w2.call(this), e2.validateFormats = r3;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      let { $data: e2, meta: t3, schemaId: n3 } = this.opts, r3 = f2;
      n3 === "id" && (r3 = { ...f2 }, r3.id = r3.$id, delete r3.$id), t3 && e2 && this.addMetaSchema(r3, r3[n3], !1);
    }
    defaultMeta() {
      let { meta: e2, schemaId: t3 } = this.opts;
      return this.opts.defaultMeta = typeof e2 == "object" ? e2[t3] || e2 : void 0;
    }
    validate(e2, t3) {
      let n3;
      if (typeof e2 == "string") {
        if (n3 = this.getSchema(e2), !n3) throw Error(`no schema with key or ref "${e2}"`);
      } else n3 = this.compile(e2);
      let r3 = n3(t3);
      return "$async" in n3 || (this.errors = n3.errors), r3;
    }
    compile(e2, t3) {
      let n3 = this._addSchema(e2, t3);
      return n3.validate || this._compileSchemaEnv(n3);
    }
    compileAsync(e2, t3) {
      if (typeof this.opts.loadSchema != "function") throw Error("options.loadSchema should be a function");
      let { loadSchema: n3 } = this.opts;
      return r3.call(this, e2, t3);
      async function r3(e3, t4) {
        await i3.call(this, e3.$schema);
        let n4 = this._addSchema(e3, t4);
        return n4.validate || o3.call(this, n4);
      }
      async function i3(e3) {
        e3 && !this.getSchema(e3) && await r3.call(this, { $ref: e3 }, !0);
      }
      async function o3(e3) {
        try {
          return this._compileSchemaEnv(e3);
        } catch (t4) {
          if (!(t4 instanceof a2.default)) throw t4;
          return s3.call(this, t4), await c3.call(this, t4.missingSchema), o3.call(this, e3);
        }
      }
      function s3({ missingSchema: e3, missingRef: t4 }) {
        if (this.refs[e3]) throw Error(`AnySchema ${e3} is loaded but ${t4} cannot be resolved`);
      }
      async function c3(e3) {
        let n4 = await l3.call(this, e3);
        this.refs[e3] || await i3.call(this, n4.$schema), this.refs[e3] || this.addSchema(n4, e3, t3);
      }
      async function l3(e3) {
        let t4 = this._loading[e3];
        if (t4) return t4;
        try {
          return await (this._loading[e3] = n3(e3));
        } finally {
          delete this._loading[e3];
        }
      }
    }
    addSchema(e2, t3, n3, r3 = this.opts.validateSchema) {
      if (Array.isArray(e2)) {
        for (let t4 of e2) this.addSchema(t4, void 0, n3, r3);
        return this;
      }
      let i3;
      if (typeof e2 == "object") {
        let { schemaId: t4 } = this.opts;
        if (i3 = e2[t4], i3 !== void 0 && typeof i3 != "string") throw Error(`schema ${t4} must be string`);
      }
      return t3 = (0, l2.normalizeId)(t3 || i3), this._checkUnique(t3), this.schemas[t3] = this._addSchema(e2, n3, t3, r3, !0), this;
    }
    addMetaSchema(e2, t3, n3 = this.opts.validateSchema) {
      return this.addSchema(e2, t3, !0, n3), this;
    }
    validateSchema(e2, t3) {
      if (typeof e2 == "boolean") return !0;
      let n3;
      if (n3 = e2.$schema, n3 !== void 0 && typeof n3 != "string") throw Error("$schema must be a string");
      if (n3 = n3 || this.opts.defaultMeta || this.defaultMeta(), !n3) return this.logger.warn("meta-schema not available"), this.errors = null, !0;
      let r3 = this.validate(n3, e2);
      if (!r3 && t3) {
        let e3 = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log") this.logger.error(e3);
        else throw Error(e3);
      }
      return r3;
    }
    getSchema(e2) {
      let t3;
      for (; typeof (t3 = C2.call(this, e2)) == "string"; ) e2 = t3;
      if (t3 === void 0) {
        let { schemaId: n3 } = this.opts, r3 = new s2.SchemaEnv({ schema: {}, schemaId: n3 });
        if (t3 = s2.resolveSchema.call(this, r3, e2), !t3) return;
        this.refs[e2] = t3;
      }
      return t3.validate || this._compileSchemaEnv(t3);
    }
    removeSchema(e2) {
      if (e2 instanceof RegExp) return this._removeAllSchemas(this.schemas, e2), this._removeAllSchemas(this.refs, e2), this;
      switch (typeof e2) {
        case "undefined":
          return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
        case "string": {
          let t3 = C2.call(this, e2);
          return typeof t3 == "object" && this._cache.delete(t3.schema), delete this.schemas[e2], delete this.refs[e2], this;
        }
        case "object": {
          let t3 = e2;
          this._cache.delete(t3);
          let n3 = e2[this.opts.schemaId];
          return n3 && (n3 = (0, l2.normalizeId)(n3), delete this.schemas[n3], delete this.refs[n3]), this;
        }
        default:
          throw Error("ajv.removeSchema: invalid parameter");
      }
    }
    addVocabulary(e2) {
      for (let t3 of e2) this.addKeyword(t3);
      return this;
    }
    addKeyword(e2, t3) {
      let n3;
      if (typeof e2 == "string") n3 = e2, typeof t3 == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), t3.keyword = n3);
      else if (typeof e2 == "object" && t3 === void 0) {
        if (t3 = e2, n3 = t3.keyword, Array.isArray(n3) && !n3.length) throw Error("addKeywords: keyword must be string or non-empty array");
      } else throw Error("invalid addKeywords parameters");
      if (j2.call(this, n3, t3), !t3) return (0, d2.eachItem)(n3, (e3) => M2.call(this, e3)), this;
      P2.call(this, t3);
      let r3 = { ...t3, type: (0, u2.getJSONTypes)(t3.type), schemaType: (0, u2.getJSONTypes)(t3.schemaType) };
      return (0, d2.eachItem)(n3, r3.type.length === 0 ? (e3) => M2.call(this, e3, r3) : (e3) => r3.type.forEach((t4) => M2.call(this, e3, r3, t4))), this;
    }
    getKeyword(e2) {
      let t3 = this.RULES.all[e2];
      return typeof t3 == "object" ? t3.definition : !!t3;
    }
    removeKeyword(e2) {
      let { RULES: t3 } = this;
      delete t3.keywords[e2], delete t3.all[e2];
      for (let n3 of t3.rules) {
        let t4 = n3.rules.findIndex((t5) => t5.keyword === e2);
        t4 >= 0 && n3.rules.splice(t4, 1);
      }
      return this;
    }
    addFormat(e2, t3) {
      return typeof t3 == "string" && (t3 = new RegExp(t3)), this.formats[e2] = t3, this;
    }
    errorsText(e2 = this.errors, { separator: t3 = ", ", dataVar: n3 = "data" } = {}) {
      return !e2 || e2.length === 0 ? "No errors" : e2.map((e3) => `${n3}${e3.instancePath} ${e3.message}`).reduce((e3, n4) => e3 + t3 + n4);
    }
    $dataMetaSchema(e2, t3) {
      let n3 = this.RULES.all;
      e2 = JSON.parse(JSON.stringify(e2));
      for (let r3 of t3) {
        let t4 = r3.split("/").slice(1), i3 = e2;
        for (let e3 of t4) i3 = i3[e3];
        for (let e3 in n3) {
          let t5 = n3[e3];
          if (typeof t5 != "object") continue;
          let { $data: r4 } = t5.definition, a3 = i3[e3];
          r4 && a3 && (i3[e3] = ee2(a3));
        }
      }
      return e2;
    }
    _removeAllSchemas(e2, t3) {
      for (let n3 in e2) {
        let r3 = e2[n3];
        (!t3 || t3.test(n3)) && (typeof r3 == "string" ? delete e2[n3] : r3 && !r3.meta && (this._cache.delete(r3.schema), delete e2[n3]));
      }
    }
    _addSchema(e2, t3, n3, r3 = this.opts.validateSchema, i3 = this.opts.addUsedSchema) {
      let a3, { schemaId: o3 } = this.opts;
      if (typeof e2 == "object") a3 = e2[o3];
      else {
        if (this.opts.jtd) throw Error("schema must be object");
        if (typeof e2 != "boolean") throw Error("schema must be object or boolean");
      }
      let c3 = this._cache.get(e2);
      if (c3 !== void 0) return c3;
      n3 = (0, l2.normalizeId)(a3 || n3);
      let u3 = l2.getSchemaRefs.call(this, e2, n3);
      return c3 = new s2.SchemaEnv({ schema: e2, schemaId: o3, meta: t3, baseId: n3, localRefs: u3 }), this._cache.set(c3.schema, c3), i3 && !n3.startsWith("#") && (n3 && this._checkUnique(n3), this.refs[n3] = c3), r3 && this.validateSchema(e2, !0), c3;
    }
    _checkUnique(e2) {
      if (this.schemas[e2] || this.refs[e2]) throw Error(`schema with key or id "${e2}" already exists`);
    }
    _compileSchemaEnv(e2) {
      if (e2.meta ? this._compileMetaSchema(e2) : s2.compileSchema.call(this, e2), !e2.validate) throw Error("ajv implementation error");
      return e2.validate;
    }
    _compileMetaSchema(e2) {
      let t3 = this.opts;
      this.opts = this._metaOpts;
      try {
        s2.compileSchema.call(this, e2);
      } finally {
        this.opts = t3;
      }
    }
  };
  x2.ValidationError = i2.default, x2.MissingRefError = a2.default, t2.default = x2;
  function S2(e2, t3, n3, r3 = "error") {
    for (let i3 in e2) {
      let a3 = i3;
      a3 in t3 && this.logger[r3](`${n3}: option ${i3}. ${e2[a3]}`);
    }
  }
  function C2(e2) {
    return e2 = (0, l2.normalizeId)(e2), this.schemas[e2] || this.refs[e2];
  }
  function w2() {
    let e2 = this.opts.schemas;
    if (e2)
      if (Array.isArray(e2)) this.addSchema(e2);
      else for (let t3 in e2) this.addSchema(e2[t3], t3);
  }
  function T2() {
    for (let e2 in this.opts.formats) {
      let t3 = this.opts.formats[e2];
      t3 && this.addFormat(e2, t3);
    }
  }
  function E2(e2) {
    if (Array.isArray(e2)) this.addVocabulary(e2);
    else {
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (let t3 in e2) {
        let n3 = e2[t3];
        n3.keyword ||= t3, this.addKeyword(n3);
      }
    }
  }
  function D2() {
    let e2 = { ...this.opts };
    for (let t3 of h2) delete e2[t3];
    return e2;
  }
  var O2 = { log() {
  }, warn() {
  }, error() {
  } };
  function k2(e2) {
    if (e2 === !1) return O2;
    if (e2 === void 0) return console;
    if (e2.log && e2.warn && e2.error) return e2;
    throw Error("logger must implement log, warn and error methods");
  }
  var A2 = /^[a-z_$][a-z0-9_$:-]*$/i;
  function j2(e2, t3) {
    let { RULES: n3 } = this;
    if ((0, d2.eachItem)(e2, (e3) => {
      if (n3.keywords[e3]) throw Error(`Keyword ${e3} is already defined`);
      if (!A2.test(e3)) throw Error(`Keyword ${e3} has invalid name`);
    }), t3 && t3.$data && !("code" in t3 || "validate" in t3)) throw Error('$data keyword must have "code" or "validate" function');
  }
  function M2(e2, t3, n3) {
    var r3;
    let i3 = t3?.post;
    if (n3 && i3) throw Error('keyword with "post" flag cannot have "type"');
    let { RULES: a3 } = this, o3 = i3 ? a3.post : a3.rules.find(({ type: e3 }) => e3 === n3);
    if (o3 || (o3 = { type: n3, rules: [] }, a3.rules.push(o3)), a3.keywords[e2] = !0, !t3) return;
    let s3 = { keyword: e2, definition: { ...t3, type: (0, u2.getJSONTypes)(t3.type), schemaType: (0, u2.getJSONTypes)(t3.schemaType) } };
    t3.before ? N2.call(this, o3, s3, t3.before) : o3.rules.push(s3), a3.all[e2] = s3, (r3 = t3.implements) == null || r3.forEach((e3) => this.addKeyword(e3));
  }
  function N2(e2, t3, n3) {
    let r3 = e2.rules.findIndex((e3) => e3.keyword === n3);
    r3 >= 0 ? e2.rules.splice(r3, 0, t3) : (e2.rules.push(t3), this.logger.warn(`rule ${n3} is not defined`));
  }
  function P2(e2) {
    let { metaSchema: t3 } = e2;
    t3 !== void 0 && (e2.$data && this.opts.$data && (t3 = ee2(t3)), e2.validateSchema = this.compile(t3, !0));
  }
  var F2 = { $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#" };
  function ee2(e2) {
    return { anyOf: [e2, F2] };
  }
}));
var jr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.default = { keyword: "id", code() {
    throw Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
  } };
}));
var Mr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.callRef = e2.getValidate = void 0;
  var t2 = gr(), n2 = cr(), r2 = W(), i2 = tr(), a2 = _r(), o2 = G(), s2 = { keyword: "$ref", schemaType: "string", code(e3) {
    let { gen: n3, schema: i3, it: o3 } = e3, { baseId: s3, schemaEnv: u2, validateName: d2, opts: f2, self: p2 } = o3, { root: m2 } = u2;
    if ((i3 === "#" || i3 === "#/") && s3 === m2.baseId) return g2();
    let h2 = a2.resolveRef.call(p2, m2, s3, i3);
    if (h2 === void 0) throw new t2.default(o3.opts.uriResolver, s3, i3);
    return h2 instanceof a2.SchemaEnv ? _2(h2) : v2(h2);
    function g2() {
      if (u2 === m2) return l2(e3, d2, u2, u2.$async);
      let t3 = n3.scopeValue("root", { ref: m2 });
      return l2(e3, (0, r2._)`${t3}.validate`, m2, m2.$async);
    }
    function _2(t3) {
      l2(e3, c2(e3, t3), t3, t3.$async);
    }
    function v2(t3) {
      let a3 = n3.scopeValue("schema", f2.code.source === !0 ? { ref: t3, code: (0, r2.stringify)(t3) } : { ref: t3 }), o4 = n3.name("valid"), s4 = e3.subschema({ schema: t3, dataTypes: [], schemaPath: r2.nil, topSchemaRef: a3, errSchemaPath: i3 }, o4);
      e3.mergeEvaluated(s4), e3.ok(o4);
    }
  } };
  function c2(e3, t3) {
    let { gen: n3 } = e3;
    return t3.validate ? n3.scopeValue("validate", { ref: t3.validate }) : (0, r2._)`${n3.scopeValue("wrapper", { ref: t3 })}.validate`;
  }
  e2.getValidate = c2;
  function l2(e3, t3, a3, s3) {
    let { gen: c3, it: l3 } = e3, { allErrors: u2, schemaEnv: d2, opts: f2 } = l3, p2 = f2.passContext ? i2.default.this : r2.nil;
    s3 ? m2() : h2();
    function m2() {
      if (!d2.$async) throw Error("async schema referenced by sync schema");
      let i3 = c3.let("valid");
      c3.try(() => {
        c3.code((0, r2._)`await ${(0, n2.callValidateCode)(e3, t3, p2)}`), _2(t3), u2 || c3.assign(i3, !0);
      }, (e4) => {
        c3.if((0, r2._)`!(${e4} instanceof ${l3.ValidationError})`, () => c3.throw(e4)), g2(e4), u2 || c3.assign(i3, !1);
      }), e3.ok(i3);
    }
    function h2() {
      e3.result((0, n2.callValidateCode)(e3, t3, p2), () => _2(t3), () => g2(t3));
    }
    function g2(e4) {
      let t4 = (0, r2._)`${e4}.errors`;
      c3.assign(i2.default.vErrors, (0, r2._)`${i2.default.vErrors} === null ? ${t4} : ${i2.default.vErrors}.concat(${t4})`), c3.assign(i2.default.errors, (0, r2._)`${i2.default.vErrors}.length`);
    }
    function _2(e4) {
      if (!l3.opts.unevaluated) return;
      let t4 = a3?.validate?.evaluated;
      if (l3.props !== !0)
        if (t4 && !t4.dynamicProps) t4.props !== void 0 && (l3.props = o2.mergeEvaluated.props(c3, t4.props, l3.props));
        else {
          let t5 = c3.var("props", (0, r2._)`${e4}.evaluated.props`);
          l3.props = o2.mergeEvaluated.props(c3, t5, l3.props, r2.Name);
        }
      if (l3.items !== !0)
        if (t4 && !t4.dynamicItems) t4.items !== void 0 && (l3.items = o2.mergeEvaluated.items(c3, t4.items, l3.items));
        else {
          let t5 = c3.var("items", (0, r2._)`${e4}.evaluated.items`);
          l3.items = o2.mergeEvaluated.items(c3, t5, l3.items, r2.Name);
        }
    }
  }
  e2.callRef = l2, e2.default = s2;
}));
var Nr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = jr(), n2 = Mr();
  e2.default = ["$schema", "$id", "$defs", "$vocabulary", { keyword: "$comment" }, "definitions", t2.default, n2.default];
}));
var Pr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W(), n2 = t2.operators, r2 = { maximum: { okStr: "<=", ok: n2.LTE, fail: n2.GT }, minimum: { okStr: ">=", ok: n2.GTE, fail: n2.LT }, exclusiveMaximum: { okStr: "<", ok: n2.LT, fail: n2.GTE }, exclusiveMinimum: { okStr: ">", ok: n2.GT, fail: n2.LTE } };
  e2.default = { keyword: Object.keys(r2), type: "number", schemaType: "number", $data: !0, error: { message: ({ keyword: e3, schemaCode: n3 }) => (0, t2.str)`must be ${r2[e3].okStr} ${n3}`, params: ({ keyword: e3, schemaCode: n3 }) => (0, t2._)`{comparison: ${r2[e3].okStr}, limit: ${n3}}` }, code(e3) {
    let { keyword: n3, data: i2, schemaCode: a2 } = e3;
    e3.fail$data((0, t2._)`${i2} ${r2[n3].fail} ${a2} || isNaN(${i2})`);
  } };
}));
var Fr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W();
  e2.default = { keyword: "multipleOf", type: "number", schemaType: "number", $data: !0, error: { message: ({ schemaCode: e3 }) => (0, t2.str)`must be multiple of ${e3}`, params: ({ schemaCode: e3 }) => (0, t2._)`{multipleOf: ${e3}}` }, code(e3) {
    let { gen: n2, data: r2, schemaCode: i2, it: a2 } = e3, o2 = a2.opts.multipleOfPrecision, s2 = n2.let("res"), c2 = o2 ? (0, t2._)`Math.abs(Math.round(${s2}) - ${s2}) > 1e-${o2}` : (0, t2._)`${s2} !== parseInt(${s2})`;
    e3.fail$data((0, t2._)`(${i2} === 0 || (${s2} = ${r2}/${i2}, ${c2}))`);
  } };
}));
var Ir = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  function t2(e3) {
    let t3 = e3.length, n2 = 0, r2 = 0, i2;
    for (; r2 < t3; ) n2++, i2 = e3.charCodeAt(r2++), i2 >= 55296 && i2 <= 56319 && r2 < t3 && (i2 = e3.charCodeAt(r2), (i2 & 64512) == 56320 && r2++);
    return n2;
  }
  e2.default = t2, t2.code = 'require("ajv/dist/runtime/ucs2length").default';
}));
var Lr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W(), n2 = G(), r2 = Ir();
  e2.default = { keyword: ["maxLength", "minLength"], type: "string", schemaType: "number", $data: !0, error: { message({ keyword: e3, schemaCode: n3 }) {
    let r3 = e3 === "maxLength" ? "more" : "fewer";
    return (0, t2.str)`must NOT have ${r3} than ${n3} characters`;
  }, params: ({ schemaCode: e3 }) => (0, t2._)`{limit: ${e3}}` }, code(e3) {
    let { keyword: i2, data: a2, schemaCode: o2, it: s2 } = e3, c2 = i2 === "maxLength" ? t2.operators.GT : t2.operators.LT, l2 = s2.opts.unicode === !1 ? (0, t2._)`${a2}.length` : (0, t2._)`${(0, n2.useFunc)(e3.gen, r2.default)}(${a2})`;
    e3.fail$data((0, t2._)`${l2} ${c2} ${o2}`);
  } };
}));
var Rr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = cr(), n2 = G(), r2 = W();
  e2.default = { keyword: "pattern", type: "string", schemaType: "string", $data: !0, error: { message: ({ schemaCode: e3 }) => (0, r2.str)`must match pattern "${e3}"`, params: ({ schemaCode: e3 }) => (0, r2._)`{pattern: ${e3}}` }, code(e3) {
    let { gen: i2, data: a2, $data: o2, schema: s2, schemaCode: c2, it: l2 } = e3, u2 = l2.opts.unicodeRegExp ? "u" : "";
    if (o2) {
      let { regExp: t3 } = l2.opts.code, o3 = t3.code === "new RegExp" ? (0, r2._)`new RegExp` : (0, n2.useFunc)(i2, t3), s3 = i2.let("valid");
      i2.try(() => i2.assign(s3, (0, r2._)`${o3}(${c2}, ${u2}).test(${a2})`), () => i2.assign(s3, !1)), e3.fail$data((0, r2._)`!${s3}`);
    } else {
      let n3 = (0, t2.usePattern)(e3, s2);
      e3.fail$data((0, r2._)`!${n3}.test(${a2})`);
    }
  } };
}));
var zr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W();
  e2.default = { keyword: ["maxProperties", "minProperties"], type: "object", schemaType: "number", $data: !0, error: { message({ keyword: e3, schemaCode: n2 }) {
    let r2 = e3 === "maxProperties" ? "more" : "fewer";
    return (0, t2.str)`must NOT have ${r2} than ${n2} properties`;
  }, params: ({ schemaCode: e3 }) => (0, t2._)`{limit: ${e3}}` }, code(e3) {
    let { keyword: n2, data: r2, schemaCode: i2 } = e3, a2 = n2 === "maxProperties" ? t2.operators.GT : t2.operators.LT;
    e3.fail$data((0, t2._)`Object.keys(${r2}).length ${a2} ${i2}`);
  } };
}));
var Br = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = cr(), n2 = W(), r2 = G();
  e2.default = { keyword: "required", type: "object", schemaType: "array", $data: !0, error: { message: ({ params: { missingProperty: e3 } }) => (0, n2.str)`must have required property '${e3}'`, params: ({ params: { missingProperty: e3 } }) => (0, n2._)`{missingProperty: ${e3}}` }, code(e3) {
    let { gen: i2, schema: a2, schemaCode: o2, data: s2, $data: c2, it: l2 } = e3, { opts: u2 } = l2;
    if (!c2 && a2.length === 0) return;
    let d2 = a2.length >= u2.loopRequired;
    if (l2.allErrors ? f2() : p2(), u2.strictRequired) {
      let t3 = e3.parentSchema.properties, { definedProperties: n3 } = e3.it;
      for (let e4 of a2) if (t3?.[e4] === void 0 && !n3.has(e4)) {
        let t4 = `required property "${e4}" is not defined at "${l2.schemaEnv.baseId + l2.errSchemaPath}" (strictRequired)`;
        (0, r2.checkStrictMode)(l2, t4, l2.opts.strictRequired);
      }
    }
    function f2() {
      if (d2 || c2) e3.block$data(n2.nil, m2);
      else for (let n3 of a2) (0, t2.checkReportMissingProp)(e3, n3);
    }
    function p2() {
      let n3 = i2.let("missing");
      if (d2 || c2) {
        let t3 = i2.let("valid", !0);
        e3.block$data(t3, () => h2(n3, t3)), e3.ok(t3);
      } else i2.if((0, t2.checkMissingProp)(e3, a2, n3)), (0, t2.reportMissingProp)(e3, n3), i2.else();
    }
    function m2() {
      i2.forOf("prop", o2, (n3) => {
        e3.setParams({ missingProperty: n3 }), i2.if((0, t2.noPropertyInData)(i2, s2, n3, u2.ownProperties), () => e3.error());
      });
    }
    function h2(r3, a3) {
      e3.setParams({ missingProperty: r3 }), i2.forOf(r3, o2, () => {
        i2.assign(a3, (0, t2.propertyInData)(i2, s2, r3, u2.ownProperties)), i2.if((0, n2.not)(a3), () => {
          e3.error(), i2.break();
        });
      }, n2.nil);
    }
  } };
}));
var Vr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W();
  e2.default = { keyword: ["maxItems", "minItems"], type: "array", schemaType: "number", $data: !0, error: { message({ keyword: e3, schemaCode: n2 }) {
    let r2 = e3 === "maxItems" ? "more" : "fewer";
    return (0, t2.str)`must NOT have ${r2} than ${n2} items`;
  }, params: ({ schemaCode: e3 }) => (0, t2._)`{limit: ${e3}}` }, code(e3) {
    let { keyword: n2, data: r2, schemaCode: i2 } = e3, a2 = n2 === "maxItems" ? t2.operators.GT : t2.operators.LT;
    e3.fail$data((0, t2._)`${r2}.length ${a2} ${i2}`);
  } };
}));
var Hr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = dr();
  t2.code = 'require("ajv/dist/runtime/equal").default', e2.default = t2;
}));
var Ur = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = or(), n2 = W(), r2 = G(), i2 = Hr();
  e2.default = { keyword: "uniqueItems", type: "array", schemaType: "boolean", $data: !0, error: { message: ({ params: { i: e3, j: t3 } }) => (0, n2.str)`must NOT have duplicate items (items ## ${t3} and ${e3} are identical)`, params: ({ params: { i: e3, j: t3 } }) => (0, n2._)`{i: ${e3}, j: ${t3}}` }, code(e3) {
    let { gen: a2, data: o2, $data: s2, schema: c2, parentSchema: l2, schemaCode: u2, it: d2 } = e3;
    if (!s2 && !c2) return;
    let f2 = a2.let("valid"), p2 = l2.items ? (0, t2.getSchemaTypes)(l2.items) : [];
    e3.block$data(f2, m2, (0, n2._)`${u2} === false`), e3.ok(f2);
    function m2() {
      let t3 = a2.let("i", (0, n2._)`${o2}.length`), r3 = a2.let("j");
      e3.setParams({ i: t3, j: r3 }), a2.assign(f2, !0), a2.if((0, n2._)`${t3} > 1`, () => (h2() ? g2 : _2)(t3, r3));
    }
    function h2() {
      return p2.length > 0 && !p2.some((e4) => e4 === "object" || e4 === "array");
    }
    function g2(r3, i3) {
      let s3 = a2.name("item"), c3 = (0, t2.checkDataTypes)(p2, s3, d2.opts.strictNumbers, t2.DataType.Wrong), l3 = a2.const("indices", (0, n2._)`{}`);
      a2.for((0, n2._)`;${r3}--;`, () => {
        a2.let(s3, (0, n2._)`${o2}[${r3}]`), a2.if(c3, (0, n2._)`continue`), p2.length > 1 && a2.if((0, n2._)`typeof ${s3} == "string"`, (0, n2._)`${s3} += "_"`), a2.if((0, n2._)`typeof ${l3}[${s3}] == "number"`, () => {
          a2.assign(i3, (0, n2._)`${l3}[${s3}]`), e3.error(), a2.assign(f2, !1).break();
        }).code((0, n2._)`${l3}[${s3}] = ${r3}`);
      });
    }
    function _2(t3, s3) {
      let c3 = (0, r2.useFunc)(a2, i2.default), l3 = a2.name("outer");
      a2.label(l3).for((0, n2._)`;${t3}--;`, () => a2.for((0, n2._)`${s3} = ${t3}; ${s3}--;`, () => a2.if((0, n2._)`${c3}(${o2}[${t3}], ${o2}[${s3}])`, () => {
        e3.error(), a2.assign(f2, !1).break(l3);
      })));
    }
  } };
}));
var Wr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W(), n2 = G(), r2 = Hr();
  e2.default = { keyword: "const", $data: !0, error: { message: "must be equal to constant", params: ({ schemaCode: e3 }) => (0, t2._)`{allowedValue: ${e3}}` }, code(e3) {
    let { gen: i2, data: a2, $data: o2, schemaCode: s2, schema: c2 } = e3;
    o2 || c2 && typeof c2 == "object" ? e3.fail$data((0, t2._)`!${(0, n2.useFunc)(i2, r2.default)}(${a2}, ${s2})`) : e3.fail((0, t2._)`${c2} !== ${a2}`);
  } };
}));
var Gr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W(), n2 = G(), r2 = Hr();
  e2.default = { keyword: "enum", schemaType: "array", $data: !0, error: { message: "must be equal to one of the allowed values", params: ({ schemaCode: e3 }) => (0, t2._)`{allowedValues: ${e3}}` }, code(e3) {
    let { gen: i2, data: a2, $data: o2, schema: s2, schemaCode: c2, it: l2 } = e3;
    if (!o2 && s2.length === 0) throw Error("enum must have non-empty array");
    let u2 = s2.length >= l2.opts.loopEnum, d2, f2 = () => d2 ??= (0, n2.useFunc)(i2, r2.default), p2;
    if (u2 || o2) p2 = i2.let("valid"), e3.block$data(p2, m2);
    else {
      if (!Array.isArray(s2)) throw Error("ajv implementation error");
      let e4 = i2.const("vSchema", c2);
      p2 = (0, t2.or)(...s2.map((t3, n3) => h2(e4, n3)));
    }
    e3.pass(p2);
    function m2() {
      i2.assign(p2, !1), i2.forOf("v", c2, (e4) => i2.if((0, t2._)`${f2()}(${a2}, ${e4})`, () => i2.assign(p2, !0).break()));
    }
    function h2(e4, n3) {
      let r3 = s2[n3];
      return typeof r3 == "object" && r3 ? (0, t2._)`${f2()}(${a2}, ${e4}[${n3}])` : (0, t2._)`${a2} === ${r3}`;
    }
  } };
}));
var Kr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = Pr(), n2 = Fr(), r2 = Lr(), i2 = Rr(), a2 = zr(), o2 = Br(), s2 = Vr(), c2 = Ur(), l2 = Wr(), u2 = Gr();
  e2.default = [t2.default, n2.default, r2.default, i2.default, a2.default, o2.default, s2.default, c2.default, { keyword: "type", schemaType: ["string", "array"] }, { keyword: "nullable", schemaType: "boolean" }, l2.default, u2.default];
}));
var qr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.validateAdditionalItems = void 0;
  var t2 = W(), n2 = G(), r2 = { keyword: "additionalItems", type: "array", schemaType: ["boolean", "object"], before: "uniqueItems", error: { message: ({ params: { len: e3 } }) => (0, t2.str)`must NOT have more than ${e3} items`, params: ({ params: { len: e3 } }) => (0, t2._)`{limit: ${e3}}` }, code(e3) {
    let { parentSchema: t3, it: r3 } = e3, { items: a2 } = t3;
    Array.isArray(a2) ? i2(e3, a2) : (0, n2.checkStrictMode)(r3, '"additionalItems" is ignored when "items" is not an array of schemas');
  } };
  function i2(e3, r3) {
    let { gen: i3, schema: a2, data: o2, keyword: s2, it: c2 } = e3;
    c2.items = !0;
    let l2 = i3.const("len", (0, t2._)`${o2}.length`);
    if (a2 === !1) e3.setParams({ len: r3.length }), e3.pass((0, t2._)`${l2} <= ${r3.length}`);
    else if (typeof a2 == "object" && !(0, n2.alwaysValidSchema)(c2, a2)) {
      let n3 = i3.var("valid", (0, t2._)`${l2} <= ${r3.length}`);
      i3.if((0, t2.not)(n3), () => u2(n3)), e3.ok(n3);
    }
    function u2(a3) {
      i3.forRange("i", r3.length, l2, (r4) => {
        e3.subschema({ keyword: s2, dataProp: r4, dataPropType: n2.Type.Num }, a3), c2.allErrors || i3.if((0, t2.not)(a3), () => i3.break());
      });
    }
  }
  e2.validateAdditionalItems = i2, e2.default = r2;
}));
var Jr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.validateTuple = void 0;
  var t2 = W(), n2 = G(), r2 = cr(), i2 = { keyword: "items", type: "array", schemaType: ["object", "array", "boolean"], before: "uniqueItems", code(e3) {
    let { schema: t3, it: i3 } = e3;
    if (Array.isArray(t3)) return a2(e3, "additionalItems", t3);
    i3.items = !0, !(0, n2.alwaysValidSchema)(i3, t3) && e3.ok((0, r2.validateArray)(e3));
  } };
  function a2(e3, r3, i3 = e3.schema) {
    let { gen: a3, parentSchema: o2, data: s2, keyword: c2, it: l2 } = e3;
    f2(o2), l2.opts.unevaluated && i3.length && l2.items !== !0 && (l2.items = n2.mergeEvaluated.items(a3, i3.length, l2.items));
    let u2 = a3.name("valid"), d2 = a3.const("len", (0, t2._)`${s2}.length`);
    i3.forEach((r4, i4) => {
      (0, n2.alwaysValidSchema)(l2, r4) || (a3.if((0, t2._)`${d2} > ${i4}`, () => e3.subschema({ keyword: c2, schemaProp: i4, dataProp: i4 }, u2)), e3.ok(u2));
    });
    function f2(e4) {
      let { opts: t3, errSchemaPath: a4 } = l2, o3 = i3.length, s3 = o3 === e4.minItems && (o3 === e4.maxItems || e4[r3] === !1);
      if (t3.strictTuples && !s3) {
        let e5 = `"${c2}" is ${o3}-tuple, but minItems or maxItems/${r3} are not specified or different at path "${a4}"`;
        (0, n2.checkStrictMode)(l2, e5, t3.strictTuples);
      }
    }
  }
  e2.validateTuple = a2, e2.default = i2;
}));
var Yr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = Jr();
  e2.default = { keyword: "prefixItems", type: "array", schemaType: ["array"], before: "uniqueItems", code: (e3) => (0, t2.validateTuple)(e3, "items") };
}));
var Xr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W(), n2 = G(), r2 = cr(), i2 = qr();
  e2.default = { keyword: "items", type: "array", schemaType: ["object", "boolean"], before: "uniqueItems", error: { message: ({ params: { len: e3 } }) => (0, t2.str)`must NOT have more than ${e3} items`, params: ({ params: { len: e3 } }) => (0, t2._)`{limit: ${e3}}` }, code(e3) {
    let { schema: t3, parentSchema: a2, it: o2 } = e3, { prefixItems: s2 } = a2;
    o2.items = !0, !(0, n2.alwaysValidSchema)(o2, t3) && (s2 ? (0, i2.validateAdditionalItems)(e3, s2) : e3.ok((0, r2.validateArray)(e3)));
  } };
}));
var Zr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W(), n2 = G();
  e2.default = { keyword: "contains", type: "array", schemaType: ["object", "boolean"], before: "uniqueItems", trackErrors: !0, error: { message: ({ params: { min: e3, max: n3 } }) => n3 === void 0 ? (0, t2.str)`must contain at least ${e3} valid item(s)` : (0, t2.str)`must contain at least ${e3} and no more than ${n3} valid item(s)`, params: ({ params: { min: e3, max: n3 } }) => n3 === void 0 ? (0, t2._)`{minContains: ${e3}}` : (0, t2._)`{minContains: ${e3}, maxContains: ${n3}}` }, code(e3) {
    let { gen: r2, schema: i2, parentSchema: a2, data: o2, it: s2 } = e3, c2, l2, { minContains: u2, maxContains: d2 } = a2;
    s2.opts.next ? (c2 = u2 === void 0 ? 1 : u2, l2 = d2) : c2 = 1;
    let f2 = r2.const("len", (0, t2._)`${o2}.length`);
    if (e3.setParams({ min: c2, max: l2 }), l2 === void 0 && c2 === 0) {
      (0, n2.checkStrictMode)(s2, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
      return;
    }
    if (l2 !== void 0 && c2 > l2) {
      (0, n2.checkStrictMode)(s2, '"minContains" > "maxContains" is always invalid'), e3.fail();
      return;
    }
    if ((0, n2.alwaysValidSchema)(s2, i2)) {
      let n3 = (0, t2._)`${f2} >= ${c2}`;
      l2 !== void 0 && (n3 = (0, t2._)`${n3} && ${f2} <= ${l2}`), e3.pass(n3);
      return;
    }
    s2.items = !0;
    let p2 = r2.name("valid");
    l2 === void 0 && c2 === 1 ? h2(p2, () => r2.if(p2, () => r2.break())) : c2 === 0 ? (r2.let(p2, !0), l2 !== void 0 && r2.if((0, t2._)`${o2}.length > 0`, m2)) : (r2.let(p2, !1), m2()), e3.result(p2, () => e3.reset());
    function m2() {
      let e4 = r2.name("_valid"), t3 = r2.let("count", 0);
      h2(e4, () => r2.if(e4, () => g2(t3)));
    }
    function h2(t3, i3) {
      r2.forRange("i", 0, f2, (r3) => {
        e3.subschema({ keyword: "contains", dataProp: r3, dataPropType: n2.Type.Num, compositeRule: !0 }, t3), i3();
      });
    }
    function g2(e4) {
      r2.code((0, t2._)`${e4}++`), l2 === void 0 ? r2.if((0, t2._)`${e4} >= ${c2}`, () => r2.assign(p2, !0).break()) : (r2.if((0, t2._)`${e4} > ${l2}`, () => r2.assign(p2, !1).break()), c2 === 1 ? r2.assign(p2, !0) : r2.if((0, t2._)`${e4} >= ${c2}`, () => r2.assign(p2, !0)));
    }
  } };
}));
var Qr = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.validateSchemaDeps = e2.validatePropertyDeps = e2.error = void 0;
  var t2 = W(), n2 = G(), r2 = cr();
  e2.error = { message: ({ params: { property: e3, depsCount: n3, deps: r3 } }) => {
    let i3 = n3 === 1 ? "property" : "properties";
    return (0, t2.str)`must have ${i3} ${r3} when property ${e3} is present`;
  }, params: ({ params: { property: e3, depsCount: n3, deps: r3, missingProperty: i3 } }) => (0, t2._)`{property: ${e3},
    missingProperty: ${i3},
    depsCount: ${n3},
    deps: ${r3}}` };
  var i2 = { keyword: "dependencies", type: "object", schemaType: "object", error: e2.error, code(e3) {
    let [t3, n3] = a2(e3);
    o2(e3, t3), s2(e3, n3);
  } };
  function a2({ schema: e3 }) {
    let t3 = {}, n3 = {};
    for (let r3 in e3) {
      if (r3 === "__proto__") continue;
      let i3 = Array.isArray(e3[r3]) ? t3 : n3;
      i3[r3] = e3[r3];
    }
    return [t3, n3];
  }
  function o2(e3, n3 = e3.schema) {
    let { gen: i3, data: a3, it: o3 } = e3;
    if (Object.keys(n3).length === 0) return;
    let s3 = i3.let("missing");
    for (let c2 in n3) {
      let l2 = n3[c2];
      if (l2.length === 0) continue;
      let u2 = (0, r2.propertyInData)(i3, a3, c2, o3.opts.ownProperties);
      e3.setParams({ property: c2, depsCount: l2.length, deps: l2.join(", ") }), o3.allErrors ? i3.if(u2, () => {
        for (let t3 of l2) (0, r2.checkReportMissingProp)(e3, t3);
      }) : (i3.if((0, t2._)`${u2} && (${(0, r2.checkMissingProp)(e3, l2, s3)})`), (0, r2.reportMissingProp)(e3, s3), i3.else());
    }
  }
  e2.validatePropertyDeps = o2;
  function s2(e3, t3 = e3.schema) {
    let { gen: i3, data: a3, keyword: o3, it: s3 } = e3, c2 = i3.name("valid");
    for (let l2 in t3) (0, n2.alwaysValidSchema)(s3, t3[l2]) || (i3.if((0, r2.propertyInData)(i3, a3, l2, s3.opts.ownProperties), () => {
      let t4 = e3.subschema({ keyword: o3, schemaProp: l2 }, c2);
      e3.mergeValidEvaluated(t4, c2);
    }, () => i3.var(c2, !0)), e3.ok(c2));
  }
  e2.validateSchemaDeps = s2, e2.default = i2;
}));
var $r = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W(), n2 = G();
  e2.default = { keyword: "propertyNames", type: "object", schemaType: ["object", "boolean"], error: { message: "property name must be valid", params: ({ params: e3 }) => (0, t2._)`{propertyName: ${e3.propertyName}}` }, code(e3) {
    let { gen: r2, schema: i2, data: a2, it: o2 } = e3;
    if ((0, n2.alwaysValidSchema)(o2, i2)) return;
    let s2 = r2.name("valid");
    r2.forIn("key", a2, (n3) => {
      e3.setParams({ propertyName: n3 }), e3.subschema({ keyword: "propertyNames", data: n3, dataTypes: ["string"], propertyName: n3, compositeRule: !0 }, s2), r2.if((0, t2.not)(s2), () => {
        e3.error(!0), o2.allErrors || r2.break();
      });
    }), e3.ok(s2);
  } };
}));
var ei = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = cr(), n2 = W(), r2 = tr(), i2 = G();
  e2.default = { keyword: "additionalProperties", type: ["object"], schemaType: ["boolean", "object"], allowUndefined: !0, trackErrors: !0, error: { message: "must NOT have additional properties", params: ({ params: e3 }) => (0, n2._)`{additionalProperty: ${e3.additionalProperty}}` }, code(e3) {
    let { gen: a2, schema: o2, parentSchema: s2, data: c2, errsCount: l2, it: u2 } = e3;
    if (!l2) throw Error("ajv implementation error");
    let { allErrors: d2, opts: f2 } = u2;
    if (u2.props = !0, f2.removeAdditional !== "all" && (0, i2.alwaysValidSchema)(u2, o2)) return;
    let p2 = (0, t2.allSchemaProperties)(s2.properties), m2 = (0, t2.allSchemaProperties)(s2.patternProperties);
    h2(), e3.ok((0, n2._)`${l2} === ${r2.default.errors}`);
    function h2() {
      a2.forIn("key", c2, (e4) => {
        !p2.length && !m2.length ? v2(e4) : a2.if(g2(e4), () => v2(e4));
      });
    }
    function g2(r3) {
      let o3;
      if (p2.length > 8) {
        let e4 = (0, i2.schemaRefOrVal)(u2, s2.properties, "properties");
        o3 = (0, t2.isOwnProperty)(a2, e4, r3);
      } else o3 = p2.length ? (0, n2.or)(...p2.map((e4) => (0, n2._)`${r3} === ${e4}`)) : n2.nil;
      return m2.length && (o3 = (0, n2.or)(o3, ...m2.map((i3) => (0, n2._)`${(0, t2.usePattern)(e3, i3)}.test(${r3})`))), (0, n2.not)(o3);
    }
    function _2(e4) {
      a2.code((0, n2._)`delete ${c2}[${e4}]`);
    }
    function v2(t3) {
      if (f2.removeAdditional === "all" || f2.removeAdditional && o2 === !1) _2(t3);
      else if (o2 === !1) e3.setParams({ additionalProperty: t3 }), e3.error(), d2 || a2.break();
      else if (typeof o2 == "object" && !(0, i2.alwaysValidSchema)(u2, o2)) {
        let r3 = a2.name("valid");
        f2.removeAdditional === "failing" ? (y2(t3, r3, !1), a2.if((0, n2.not)(r3), () => {
          e3.reset(), _2(t3);
        })) : (y2(t3, r3), d2 || a2.if((0, n2.not)(r3), () => a2.break()));
      }
    }
    function y2(t3, n3, r3) {
      let a3 = { keyword: "additionalProperties", dataProp: t3, dataPropType: i2.Type.Str };
      r3 === !1 && Object.assign(a3, { compositeRule: !0, createErrors: !1, allErrors: !1 }), e3.subschema(a3, n3);
    }
  } };
}));
var ti = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = mr(), n2 = cr(), r2 = G(), i2 = ei();
  e2.default = { keyword: "properties", type: "object", schemaType: "object", code(e3) {
    let { gen: a2, schema: o2, parentSchema: s2, data: c2, it: l2 } = e3;
    l2.opts.removeAdditional === "all" && s2.additionalProperties === void 0 && i2.default.code(new t2.KeywordCxt(l2, i2.default, "additionalProperties"));
    let u2 = (0, n2.allSchemaProperties)(o2);
    for (let e4 of u2) l2.definedProperties.add(e4);
    l2.opts.unevaluated && u2.length && l2.props !== !0 && (l2.props = r2.mergeEvaluated.props(a2, (0, r2.toHash)(u2), l2.props));
    let d2 = u2.filter((e4) => !(0, r2.alwaysValidSchema)(l2, o2[e4]));
    if (d2.length === 0) return;
    let f2 = a2.name("valid");
    for (let t3 of d2) p2(t3) ? m2(t3) : (a2.if((0, n2.propertyInData)(a2, c2, t3, l2.opts.ownProperties)), m2(t3), l2.allErrors || a2.else().var(f2, !0), a2.endIf()), e3.it.definedProperties.add(t3), e3.ok(f2);
    function p2(e4) {
      return l2.opts.useDefaults && !l2.compositeRule && o2[e4].default !== void 0;
    }
    function m2(t3) {
      e3.subschema({ keyword: "properties", schemaProp: t3, dataProp: t3 }, f2);
    }
  } };
}));
var ni = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = cr(), n2 = W(), r2 = G(), i2 = G();
  e2.default = { keyword: "patternProperties", type: "object", schemaType: "object", code(e3) {
    let { gen: a2, schema: o2, data: s2, parentSchema: c2, it: l2 } = e3, { opts: u2 } = l2, d2 = (0, t2.allSchemaProperties)(o2), f2 = d2.filter((e4) => (0, r2.alwaysValidSchema)(l2, o2[e4]));
    if (d2.length === 0 || f2.length === d2.length && (!l2.opts.unevaluated || l2.props === !0)) return;
    let p2 = u2.strictSchema && !u2.allowMatchingProperties && c2.properties, m2 = a2.name("valid");
    l2.props !== !0 && !(l2.props instanceof n2.Name) && (l2.props = (0, i2.evaluatedPropsToName)(a2, l2.props));
    let { props: h2 } = l2;
    g2();
    function g2() {
      for (let e4 of d2) p2 && _2(e4), l2.allErrors ? v2(e4) : (a2.var(m2, !0), v2(e4), a2.if(m2));
    }
    function _2(e4) {
      for (let t3 in p2) new RegExp(e4).test(t3) && (0, r2.checkStrictMode)(l2, `property ${t3} matches pattern ${e4} (use allowMatchingProperties)`);
    }
    function v2(r3) {
      a2.forIn("key", s2, (o3) => {
        a2.if((0, n2._)`${(0, t2.usePattern)(e3, r3)}.test(${o3})`, () => {
          let t3 = f2.includes(r3);
          t3 || e3.subschema({ keyword: "patternProperties", schemaProp: r3, dataProp: o3, dataPropType: i2.Type.Str }, m2), l2.opts.unevaluated && h2 !== !0 ? a2.assign((0, n2._)`${h2}[${o3}]`, !0) : !t3 && !l2.allErrors && a2.if((0, n2.not)(m2), () => a2.break());
        });
      });
    }
  } };
}));
var ri = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = G();
  e2.default = { keyword: "not", schemaType: ["object", "boolean"], trackErrors: !0, code(e3) {
    let { gen: n2, schema: r2, it: i2 } = e3;
    if ((0, t2.alwaysValidSchema)(i2, r2)) {
      e3.fail();
      return;
    }
    let a2 = n2.name("valid");
    e3.subschema({ keyword: "not", compositeRule: !0, createErrors: !1, allErrors: !1 }, a2), e3.failResult(a2, () => e3.reset(), () => e3.error());
  }, error: { message: "must NOT be valid" } };
}));
var ii = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.default = { keyword: "anyOf", schemaType: "array", trackErrors: !0, code: cr().validateUnion, error: { message: "must match a schema in anyOf" } };
}));
var ai = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W(), n2 = G();
  e2.default = { keyword: "oneOf", schemaType: "array", trackErrors: !0, error: { message: "must match exactly one schema in oneOf", params: ({ params: e3 }) => (0, t2._)`{passingSchemas: ${e3.passing}}` }, code(e3) {
    let { gen: r2, schema: i2, parentSchema: a2, it: o2 } = e3;
    if (!Array.isArray(i2)) throw Error("ajv implementation error");
    if (o2.opts.discriminator && a2.discriminator) return;
    let s2 = i2, c2 = r2.let("valid", !1), l2 = r2.let("passing", null), u2 = r2.name("_valid");
    e3.setParams({ passing: l2 }), r2.block(d2), e3.result(c2, () => e3.reset(), () => e3.error(!0));
    function d2() {
      s2.forEach((i3, a3) => {
        let s3;
        (0, n2.alwaysValidSchema)(o2, i3) ? r2.var(u2, !0) : s3 = e3.subschema({ keyword: "oneOf", schemaProp: a3, compositeRule: !0 }, u2), a3 > 0 && r2.if((0, t2._)`${u2} && ${c2}`).assign(c2, !1).assign(l2, (0, t2._)`[${l2}, ${a3}]`).else(), r2.if(u2, () => {
          r2.assign(c2, !0), r2.assign(l2, a3), s3 && e3.mergeEvaluated(s3, t2.Name);
        });
      });
    }
  } };
}));
var oi = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = G();
  e2.default = { keyword: "allOf", schemaType: "array", code(e3) {
    let { gen: n2, schema: r2, it: i2 } = e3;
    if (!Array.isArray(r2)) throw Error("ajv implementation error");
    let a2 = n2.name("valid");
    r2.forEach((n3, r3) => {
      if ((0, t2.alwaysValidSchema)(i2, n3)) return;
      let o2 = e3.subschema({ keyword: "allOf", schemaProp: r3 }, a2);
      e3.ok(a2), e3.mergeEvaluated(o2);
    });
  } };
}));
var si = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W(), n2 = G(), r2 = { keyword: "if", schemaType: ["object", "boolean"], trackErrors: !0, error: { message: ({ params: e3 }) => (0, t2.str)`must match "${e3.ifClause}" schema`, params: ({ params: e3 }) => (0, t2._)`{failingKeyword: ${e3.ifClause}}` }, code(e3) {
    let { gen: r3, parentSchema: a2, it: o2 } = e3;
    a2.then === void 0 && a2.else === void 0 && (0, n2.checkStrictMode)(o2, '"if" without "then" and "else" is ignored');
    let s2 = i2(o2, "then"), c2 = i2(o2, "else");
    if (!s2 && !c2) return;
    let l2 = r3.let("valid", !0), u2 = r3.name("_valid");
    if (d2(), e3.reset(), s2 && c2) {
      let t3 = r3.let("ifClause");
      e3.setParams({ ifClause: t3 }), r3.if(u2, f2("then", t3), f2("else", t3));
    } else s2 ? r3.if(u2, f2("then")) : r3.if((0, t2.not)(u2), f2("else"));
    e3.pass(l2, () => e3.error(!0));
    function d2() {
      let t3 = e3.subschema({ keyword: "if", compositeRule: !0, createErrors: !1, allErrors: !1 }, u2);
      e3.mergeEvaluated(t3);
    }
    function f2(n3, i3) {
      return () => {
        let a3 = e3.subschema({ keyword: n3 }, u2);
        r3.assign(l2, u2), e3.mergeValidEvaluated(a3, l2), i3 ? r3.assign(i3, (0, t2._)`${n3}`) : e3.setParams({ ifClause: n3 });
      };
    }
  } };
  function i2(e3, t3) {
    let r3 = e3.schema[t3];
    return r3 !== void 0 && !(0, n2.alwaysValidSchema)(e3, r3);
  }
  e2.default = r2;
}));
var ci = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = G();
  e2.default = { keyword: ["then", "else"], schemaType: ["object", "boolean"], code({ keyword: e3, parentSchema: n2, it: r2 }) {
    n2.if === void 0 && (0, t2.checkStrictMode)(r2, `"${e3}" without "if" is ignored`);
  } };
}));
var li = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = qr(), n2 = Yr(), r2 = Jr(), i2 = Xr(), a2 = Zr(), o2 = Qr(), s2 = $r(), c2 = ei(), l2 = ti(), u2 = ni(), d2 = ri(), f2 = ii(), p2 = ai(), m2 = oi(), h2 = si(), g2 = ci();
  function _2(e3 = !1) {
    let _3 = [d2.default, f2.default, p2.default, m2.default, h2.default, g2.default, s2.default, c2.default, o2.default, l2.default, u2.default];
    return e3 ? _3.push(n2.default, i2.default) : _3.push(t2.default, r2.default), _3.push(a2.default), _3;
  }
  e2.default = _2;
}));
var ui = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W();
  e2.default = { keyword: "format", type: ["number", "string"], schemaType: "string", $data: !0, error: { message: ({ schemaCode: e3 }) => (0, t2.str)`must match format "${e3}"`, params: ({ schemaCode: e3 }) => (0, t2._)`{format: ${e3}}` }, code(e3, n2) {
    let { gen: r2, data: i2, $data: a2, schema: o2, schemaCode: s2, it: c2 } = e3, { opts: l2, errSchemaPath: u2, schemaEnv: d2, self: f2 } = c2;
    if (!l2.validateFormats) return;
    a2 ? p2() : m2();
    function p2() {
      let a3 = r2.scopeValue("formats", { ref: f2.formats, code: l2.code.formats }), o3 = r2.const("fDef", (0, t2._)`${a3}[${s2}]`), c3 = r2.let("fType"), u3 = r2.let("format");
      r2.if((0, t2._)`typeof ${o3} == "object" && !(${o3} instanceof RegExp)`, () => r2.assign(c3, (0, t2._)`${o3}.type || "string"`).assign(u3, (0, t2._)`${o3}.validate`), () => r2.assign(c3, (0, t2._)`"string"`).assign(u3, o3)), e3.fail$data((0, t2.or)(p3(), m3()));
      function p3() {
        return l2.strictSchema === !1 ? t2.nil : (0, t2._)`${s2} && !${u3}`;
      }
      function m3() {
        let e4 = d2.$async ? (0, t2._)`(${o3}.async ? await ${u3}(${i2}) : ${u3}(${i2}))` : (0, t2._)`${u3}(${i2})`, r3 = (0, t2._)`(typeof ${u3} == "function" ? ${e4} : ${u3}.test(${i2}))`;
        return (0, t2._)`${u3} && ${u3} !== true && ${c3} === ${n2} && !${r3}`;
      }
    }
    function m2() {
      let a3 = f2.formats[o2];
      if (!a3) {
        m3();
        return;
      }
      if (a3 === !0) return;
      let [s3, c3, p3] = h2(a3);
      s3 === n2 && e3.pass(g2());
      function m3() {
        if (l2.strictSchema === !1) {
          f2.logger.warn(e4());
          return;
        }
        throw Error(e4());
        function e4() {
          return `unknown format "${o2}" ignored in schema at path "${u2}"`;
        }
      }
      function h2(e4) {
        let n3 = e4 instanceof RegExp ? (0, t2.regexpCode)(e4) : l2.code.formats ? (0, t2._)`${l2.code.formats}${(0, t2.getProperty)(o2)}` : void 0, i3 = r2.scopeValue("formats", { key: o2, ref: e4, code: n3 });
        return typeof e4 == "object" && !(e4 instanceof RegExp) ? [e4.type || "string", e4.validate, (0, t2._)`${i3}.validate`] : ["string", e4, i3];
      }
      function g2() {
        if (typeof a3 == "object" && !(a3 instanceof RegExp) && a3.async) {
          if (!d2.$async) throw Error("async format in sync schema");
          return (0, t2._)`await ${p3}(${i2})`;
        }
        return typeof c3 == "function" ? (0, t2._)`${p3}(${i2})` : (0, t2._)`${p3}.test(${i2})`;
      }
    }
  } };
}));
var di = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.default = [ui().default];
}));
var fi = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.contentVocabulary = e2.metadataVocabulary = void 0, e2.metadataVocabulary = ["title", "description", "default", "deprecated", "readOnly", "writeOnly", "examples"], e2.contentVocabulary = ["contentMediaType", "contentEncoding", "contentSchema"];
}));
var pi = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = Nr(), n2 = Kr(), r2 = li(), i2 = di(), a2 = fi();
  e2.default = [t2.default, n2.default, (0, r2.default)(), i2.default, a2.metadataVocabulary, a2.contentVocabulary];
}));
var mi = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.DiscrError = void 0;
  var t2;
  (function(e3) {
    e3.Tag = "tag", e3.Mapping = "mapping";
  })(t2 || (e2.DiscrError = t2 = {}));
}));
var hi = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W(), n2 = mi(), r2 = _r(), i2 = gr(), a2 = G();
  e2.default = { keyword: "discriminator", type: "object", schemaType: "object", error: { message: ({ params: { discrError: e3, tagName: t3 } }) => e3 === n2.DiscrError.Tag ? `tag "${t3}" must be string` : `value of tag "${t3}" must be in oneOf`, params: ({ params: { discrError: e3, tag: n3, tagName: r3 } }) => (0, t2._)`{error: ${e3}, tag: ${r3}, tagValue: ${n3}}` }, code(e3) {
    let { gen: o2, data: s2, schema: c2, parentSchema: l2, it: u2 } = e3, { oneOf: d2 } = l2;
    if (!u2.opts.discriminator) throw Error("discriminator: requires discriminator option");
    let f2 = c2.propertyName;
    if (typeof f2 != "string") throw Error("discriminator: requires propertyName");
    if (c2.mapping) throw Error("discriminator: mapping is not supported");
    if (!d2) throw Error("discriminator: requires oneOf keyword");
    let p2 = o2.let("valid", !1), m2 = o2.const("tag", (0, t2._)`${s2}${(0, t2.getProperty)(f2)}`);
    o2.if((0, t2._)`typeof ${m2} == "string"`, () => h2(), () => e3.error(!1, { discrError: n2.DiscrError.Tag, tag: m2, tagName: f2 })), e3.ok(p2);
    function h2() {
      let r3 = _2();
      o2.if(!1);
      for (let e4 in r3) o2.elseIf((0, t2._)`${m2} === ${e4}`), o2.assign(p2, g2(r3[e4]));
      o2.else(), e3.error(!1, { discrError: n2.DiscrError.Mapping, tag: m2, tagName: f2 }), o2.endIf();
    }
    function g2(n3) {
      let r3 = o2.name("valid"), i3 = e3.subschema({ keyword: "oneOf", schemaProp: n3 }, r3);
      return e3.mergeEvaluated(i3, t2.Name), r3;
    }
    function _2() {
      let e4 = {}, t3 = o3(l2), n3 = !0;
      for (let e5 = 0; e5 < d2.length; e5++) {
        let c4 = d2[e5];
        if (c4?.$ref && !(0, a2.schemaHasRulesButRef)(c4, u2.self.RULES)) {
          let e6 = c4.$ref;
          if (c4 = r2.resolveRef.call(u2.self, u2.schemaEnv.root, u2.baseId, e6), c4 instanceof r2.SchemaEnv && (c4 = c4.schema), c4 === void 0) throw new i2.default(u2.opts.uriResolver, u2.baseId, e6);
        }
        let l3 = c4?.properties?.[f2];
        if (typeof l3 != "object") throw Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${f2}"`);
        n3 &&= t3 || o3(c4), s3(l3, e5);
      }
      if (!n3) throw Error(`discriminator: "${f2}" must be required`);
      return e4;
      function o3({ required: e5 }) {
        return Array.isArray(e5) && e5.includes(f2);
      }
      function s3(e5, t4) {
        if (e5.const) c3(e5.const, t4);
        else if (e5.enum) for (let n4 of e5.enum) c3(n4, t4);
        else throw Error(`discriminator: "properties/${f2}" must have "const" or "enum"`);
      }
      function c3(t4, n4) {
        if (typeof t4 != "string" || t4 in e4) throw Error(`discriminator: "${f2}" values must be unique strings`);
        e4[t4] = n4;
      }
    }
  } };
}));
var gi = r({ $id: () => vi, $schema: () => _i, default: () => Ci, definitions: () => bi, properties: () => Si, title: () => yi, type: () => xi });
var _i;
var vi;
var yi;
var bi;
var xi;
var Si;
var Ci;
var wi = t((() => {
  _i = "http://json-schema.org/draft-07/schema#", vi = "http://json-schema.org/draft-07/schema#", yi = "Core schema meta-schema", bi = { schemaArray: { type: "array", minItems: 1, items: { $ref: "#" } }, nonNegativeInteger: { type: "integer", minimum: 0 }, nonNegativeIntegerDefault0: { allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }] }, simpleTypes: { enum: ["array", "boolean", "integer", "null", "number", "object", "string"] }, stringArray: { type: "array", items: { type: "string" }, uniqueItems: !0, default: [] } }, xi = ["object", "boolean"], Si = { $id: { type: "string", format: "uri-reference" }, $schema: { type: "string", format: "uri" }, $ref: { type: "string", format: "uri-reference" }, $comment: { type: "string" }, title: { type: "string" }, description: { type: "string" }, default: !0, readOnly: { type: "boolean", default: !1 }, examples: { type: "array", items: !0 }, multipleOf: { type: "number", exclusiveMinimum: 0 }, maximum: { type: "number" }, exclusiveMaximum: { type: "number" }, minimum: { type: "number" }, exclusiveMinimum: { type: "number" }, maxLength: { $ref: "#/definitions/nonNegativeInteger" }, minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, pattern: { type: "string", format: "regex" }, additionalItems: { $ref: "#" }, items: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }], default: !0 }, maxItems: { $ref: "#/definitions/nonNegativeInteger" }, minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, uniqueItems: { type: "boolean", default: !1 }, contains: { $ref: "#" }, maxProperties: { $ref: "#/definitions/nonNegativeInteger" }, minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, required: { $ref: "#/definitions/stringArray" }, additionalProperties: { $ref: "#" }, definitions: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, properties: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, patternProperties: { type: "object", additionalProperties: { $ref: "#" }, propertyNames: { format: "regex" }, default: {} }, dependencies: { type: "object", additionalProperties: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }] } }, propertyNames: { $ref: "#" }, const: !0, enum: { type: "array", items: !0, minItems: 1, uniqueItems: !0 }, type: { anyOf: [{ $ref: "#/definitions/simpleTypes" }, { type: "array", items: { $ref: "#/definitions/simpleTypes" }, minItems: 1, uniqueItems: !0 }] }, format: { type: "string" }, contentMediaType: { type: "string" }, contentEncoding: { type: "string" }, if: { $ref: "#" }, then: { $ref: "#" }, else: { $ref: "#" }, allOf: { $ref: "#/definitions/schemaArray" }, anyOf: { $ref: "#/definitions/schemaArray" }, oneOf: { $ref: "#/definitions/schemaArray" }, not: { $ref: "#" } }, Ci = { $schema: _i, $id: vi, title: yi, definitions: bi, type: xi, properties: Si, default: !0 };
}));
var Ti = i(((t2, n2) => {
  Object.defineProperty(t2, "__esModule", { value: !0 }), t2.MissingRefError = t2.ValidationError = t2.CodeGen = t2.Name = t2.nil = t2.stringify = t2.str = t2._ = t2.KeywordCxt = t2.Ajv = void 0;
  var r2 = Ar(), i2 = pi(), a2 = hi(), o2 = (wi(), e(gi).default), s2 = ["/properties"], c2 = "http://json-schema.org/draft-07/schema", l2 = class extends r2.default {
    _addVocabularies() {
      super._addVocabularies(), i2.default.forEach((e2) => this.addVocabulary(e2)), this.opts.discriminator && this.addKeyword(a2.default);
    }
    _addDefaultMetaSchema() {
      if (super._addDefaultMetaSchema(), !this.opts.meta) return;
      let e2 = this.opts.$data ? this.$dataMetaSchema(o2, s2) : o2;
      this.addMetaSchema(e2, c2, !1), this.refs["http://json-schema.org/schema"] = c2;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(c2) ? c2 : void 0);
    }
  };
  t2.Ajv = l2, n2.exports = t2 = l2, n2.exports.Ajv = l2, Object.defineProperty(t2, "__esModule", { value: !0 }), t2.default = l2;
  var u2 = mr();
  Object.defineProperty(t2, "KeywordCxt", { enumerable: !0, get: function() {
    return u2.KeywordCxt;
  } });
  var d2 = W();
  Object.defineProperty(t2, "_", { enumerable: !0, get: function() {
    return d2._;
  } }), Object.defineProperty(t2, "str", { enumerable: !0, get: function() {
    return d2.str;
  } }), Object.defineProperty(t2, "stringify", { enumerable: !0, get: function() {
    return d2.stringify;
  } }), Object.defineProperty(t2, "nil", { enumerable: !0, get: function() {
    return d2.nil;
  } }), Object.defineProperty(t2, "Name", { enumerable: !0, get: function() {
    return d2.Name;
  } }), Object.defineProperty(t2, "CodeGen", { enumerable: !0, get: function() {
    return d2.CodeGen;
  } });
  var f2 = hr();
  Object.defineProperty(t2, "ValidationError", { enumerable: !0, get: function() {
    return f2.default;
  } });
  var p2 = gr();
  Object.defineProperty(t2, "MissingRefError", { enumerable: !0, get: function() {
    return p2.default;
  } });
}));
var Ei = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.formatNames = e2.fastFormats = e2.fullFormats = void 0;
  function t2(e3, t3) {
    return { validate: e3, compare: t3 };
  }
  e2.fullFormats = { date: t2(a2, o2), time: t2(c2, l2), "date-time": t2(d2, f2), duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/, uri: h2, "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i, "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i, url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu, email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i, ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/, ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i, regex: w2, uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i, "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/, "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i, "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/, byte: _2, int32: { type: "number", validate: b2 }, int64: { type: "number", validate: x2 }, float: { type: "number", validate: S2 }, double: { type: "number", validate: S2 }, password: !0, binary: !0 }, e2.fastFormats = { ...e2.fullFormats, date: t2(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, o2), time: t2(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, l2), "date-time": t2(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, f2), uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i, "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i, email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i }, e2.formatNames = Object.keys(e2.fullFormats);
  function n2(e3) {
    return e3 % 4 == 0 && (e3 % 100 != 0 || e3 % 400 == 0);
  }
  var r2 = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, i2 = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function a2(e3) {
    let t3 = r2.exec(e3);
    if (!t3) return !1;
    let a3 = +t3[1], o3 = +t3[2], s3 = +t3[3];
    return o3 >= 1 && o3 <= 12 && s3 >= 1 && s3 <= (o3 === 2 && n2(a3) ? 29 : i2[o3]);
  }
  function o2(e3, t3) {
    if (e3 && t3) return e3 > t3 ? 1 : e3 < t3 ? -1 : 0;
  }
  var s2 = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
  function c2(e3, t3) {
    let n3 = s2.exec(e3);
    if (!n3) return !1;
    let r3 = +n3[1], i3 = +n3[2], a3 = +n3[3], o3 = n3[5];
    return (r3 <= 23 && i3 <= 59 && a3 <= 59 || r3 === 23 && i3 === 59 && a3 === 60) && (!t3 || o3 !== "");
  }
  function l2(e3, t3) {
    if (!(e3 && t3)) return;
    let n3 = s2.exec(e3), r3 = s2.exec(t3);
    if (n3 && r3) return e3 = n3[1] + n3[2] + n3[3] + (n3[4] || ""), t3 = r3[1] + r3[2] + r3[3] + (r3[4] || ""), e3 > t3 ? 1 : e3 < t3 ? -1 : 0;
  }
  var u2 = /t|\s/i;
  function d2(e3) {
    let t3 = e3.split(u2);
    return t3.length === 2 && a2(t3[0]) && c2(t3[1], !0);
  }
  function f2(e3, t3) {
    if (!(e3 && t3)) return;
    let [n3, r3] = e3.split(u2), [i3, a3] = t3.split(u2), s3 = o2(n3, i3);
    if (s3 !== void 0) return s3 || l2(r3, a3);
  }
  var p2 = /\/|:/, m2 = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  function h2(e3) {
    return p2.test(e3) && m2.test(e3);
  }
  var g2 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  function _2(e3) {
    return g2.lastIndex = 0, g2.test(e3);
  }
  var v2 = -(2 ** 31), y2 = 2 ** 31 - 1;
  function b2(e3) {
    return Number.isInteger(e3) && e3 <= y2 && e3 >= v2;
  }
  function x2(e3) {
    return Number.isInteger(e3);
  }
  function S2() {
    return !0;
  }
  var C2 = /[^\\]\\Z/;
  function w2(e3) {
    if (C2.test(e3)) return !1;
    try {
      return new RegExp(e3), !0;
    } catch {
      return !1;
    }
  }
}));
var Di = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.formatLimitDefinition = void 0;
  var t2 = Ti(), n2 = W(), r2 = n2.operators, i2 = { formatMaximum: { okStr: "<=", ok: r2.LTE, fail: r2.GT }, formatMinimum: { okStr: ">=", ok: r2.GTE, fail: r2.LT }, formatExclusiveMaximum: { okStr: "<", ok: r2.LT, fail: r2.GTE }, formatExclusiveMinimum: { okStr: ">", ok: r2.GT, fail: r2.LTE } };
  e2.formatLimitDefinition = { keyword: Object.keys(i2), type: "string", schemaType: "string", $data: !0, error: { message: ({ keyword: e3, schemaCode: t3 }) => n2.str`should be ${i2[e3].okStr} ${t3}`, params: ({ keyword: e3, schemaCode: t3 }) => n2._`{comparison: ${i2[e3].okStr}, limit: ${t3}}` }, code(e3) {
    let { gen: r3, data: a2, schemaCode: o2, keyword: s2, it: c2 } = e3, { opts: l2, self: u2 } = c2;
    if (!l2.validateFormats) return;
    let d2 = new t2.KeywordCxt(c2, u2.RULES.all.format.definition, "format");
    d2.$data ? f2() : p2();
    function f2() {
      let t3 = r3.scopeValue("formats", { ref: u2.formats, code: l2.code.formats }), i3 = r3.const("fmt", n2._`${t3}[${d2.schemaCode}]`);
      e3.fail$data(n2.or(n2._`typeof ${i3} != "object"`, n2._`${i3} instanceof RegExp`, n2._`typeof ${i3}.compare != "function"`, m2(i3)));
    }
    function p2() {
      let t3 = d2.schema, i3 = u2.formats[t3];
      if (!i3 || i3 === !0) return;
      if (typeof i3 != "object" || i3 instanceof RegExp || typeof i3.compare != "function") throw Error(`"${s2}": format "${t3}" does not define "compare" function`);
      let a3 = r3.scopeValue("formats", { key: t3, ref: i3, code: l2.code.formats ? n2._`${l2.code.formats}${n2.getProperty(t3)}` : void 0 });
      e3.fail$data(m2(a3));
    }
    function m2(e4) {
      return n2._`${e4}.compare(${a2}, ${o2}) ${i2[s2].fail} 0`;
    }
  }, dependencies: ["format"] }, e2.default = (t3) => (t3.addKeyword(e2.formatLimitDefinition), t3);
}));
var Oi = i(((e2, t2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var n2 = Ei(), r2 = Di(), i2 = W(), a2 = new i2.Name("fullFormats"), o2 = new i2.Name("fastFormats"), s2 = (e3, t3 = { keywords: !0 }) => {
    if (Array.isArray(t3)) return c2(e3, t3, n2.fullFormats, a2), e3;
    let [i3, s3] = t3.mode === "fast" ? [n2.fastFormats, o2] : [n2.fullFormats, a2];
    return c2(e3, t3.formats || n2.formatNames, i3, s3), t3.keywords && r2.default(e3), e3;
  };
  s2.get = (e3, t3 = "full") => {
    let r3 = (t3 === "fast" ? n2.fastFormats : n2.fullFormats)[e3];
    if (!r3) throw Error(`Unknown format "${e3}"`);
    return r3;
  };
  function c2(e3, t3, n3, r3) {
    var a3;
    (a3 = e3.opts.code).formats ?? (a3.formats = i2._`require("ajv-formats/dist/formats").${r3}`);
    for (let r4 of t3) e3.addFormat(r4, n3[r4]);
  }
  t2.exports = e2 = s2, Object.defineProperty(e2, "__esModule", { value: !0 }), e2.default = s2;
}));
var ki = i(((e2, t2) => {
  function n2(e3) {
    return function(t3, n3, r2) {
      for (var i2 = -1, a2 = Object(t3), o2 = r2(t3), s2 = o2.length; s2--; ) {
        var c2 = o2[e3 ? s2 : ++i2];
        if (n3(a2[c2], c2, a2) === !1) break;
      }
      return t3;
    };
  }
  t2.exports = n2;
}));
var Ai = i(((e2, t2) => {
  t2.exports = ki()();
}));
var ji = i(((e2, t2) => {
  var n2 = Ai(), r2 = pt();
  function i2(e3, t3) {
    return e3 && n2(e3, t3, r2);
  }
  t2.exports = i2;
}));
var Mi = i(((e2, t2) => {
  var n2 = Pe();
  function r2(e3, t3) {
    return function(r3, i2) {
      if (r3 == null) return r3;
      if (!n2(r3)) return e3(r3, i2);
      for (var a2 = r3.length, o2 = t3 ? a2 : -1, s2 = Object(r3); (t3 ? o2-- : ++o2 < a2) && i2(s2[o2], o2, s2) !== !1; ) ;
      return r3;
    };
  }
  t2.exports = r2;
}));
var Ni = i(((e2, t2) => {
  var n2 = ji();
  t2.exports = Mi()(n2);
}));
var Pi = i(((e2, t2) => {
  var n2 = Ni();
  function r2(e3, t3) {
    var r3 = [];
    return n2(e3, function(e4, n3, i2) {
      t3(e4, n3, i2) && r3.push(e4);
    }), r3;
  }
  t2.exports = r2;
}));
var Fi = i(((e2, t2) => {
  var n2 = xn(), r2 = Pi(), i2 = Bn(), a2 = U();
  function o2(e3, t3) {
    return (a2(e3) ? n2 : r2)(e3, i2(t3, 3));
  }
  t2.exports = o2;
}));
var Ii = i(((e2, t2) => {
  var n2 = Dn();
  function r2(e3, t3) {
    return n2(e3, t3);
  }
  t2.exports = r2;
}));
var Li = i(((e2, t2) => {
  var n2 = Ce();
  t2.exports = (function() {
    try {
      var e3 = n2(Object, "defineProperty");
      return e3({}, "", {}), e3;
    } catch {
    }
  })();
}));
var Ri = i(((e2, t2) => {
  var n2 = Li();
  function r2(e3, t3, r3) {
    t3 == "__proto__" && n2 ? n2(e3, t3, { configurable: !0, enumerable: !0, value: r3, writable: !0 }) : e3[t3] = r3;
  }
  t2.exports = r2;
}));
var zi = i(((e2, t2) => {
  var n2 = Ri(), r2 = ht();
  function i2(e3, t3, i3) {
    (i3 !== void 0 && !r2(e3[t3], i3) || i3 === void 0 && !(t3 in e3)) && n2(e3, t3, i3);
  }
  t2.exports = i2;
}));
var Bi = i(((e2, t2) => {
  var n2 = H(), r2 = typeof e2 == "object" && e2 && !e2.nodeType && e2, i2 = r2 && typeof t2 == "object" && t2 && !t2.nodeType && t2, a2 = i2 && i2.exports === r2 ? n2.Buffer : void 0, o2 = a2 ? a2.allocUnsafe : void 0;
  function s2(e3, t3) {
    if (t3) return e3.slice();
    var n3 = e3.length, r3 = o2 ? o2(n3) : new e3.constructor(n3);
    return e3.copy(r3), r3;
  }
  t2.exports = s2;
}));
var Vi = i(((e2, t2) => {
  var n2 = hn();
  function r2(e3) {
    var t3 = new e3.constructor(e3.byteLength);
    return new n2(t3).set(new n2(e3)), t3;
  }
  t2.exports = r2;
}));
var Hi = i(((e2, t2) => {
  var n2 = Vi();
  function r2(e3, t3) {
    var r3 = t3 ? n2(e3.buffer) : e3.buffer;
    return new e3.constructor(r3, e3.byteOffset, e3.length);
  }
  t2.exports = r2;
}));
var Ui = i(((e2, t2) => {
  function n2(e3, t3) {
    var n3 = -1, r2 = e3.length;
    for (t3 ||= Array(r2); ++n3 < r2; ) t3[n3] = e3[n3];
    return t3;
  }
  t2.exports = n2;
}));
var Wi = i(((e2, t2) => {
  var n2 = ge(), r2 = Object.create;
  t2.exports = /* @__PURE__ */ (function() {
    function e3() {
    }
    return function(t3) {
      if (!n2(t3)) return {};
      if (r2) return r2(t3);
      e3.prototype = t3;
      var i2 = new e3();
      return e3.prototype = void 0, i2;
    };
  })();
}));
var Gi = i(((e2, t2) => {
  t2.exports = le()(Object.getPrototypeOf, Object);
}));
var Ki = i(((e2, t2) => {
  var n2 = Wi(), r2 = Gi(), i2 = ce();
  function a2(e3) {
    return typeof e3.constructor == "function" && !i2(e3) ? n2(r2(e3)) : {};
  }
  t2.exports = a2;
}));
var qi = i(((e2, t2) => {
  var n2 = Pe(), r2 = Ae();
  function i2(e3) {
    return r2(e3) && n2(e3);
  }
  t2.exports = i2;
}));
var Ji = i(((e2, t2) => {
  var n2 = he(), r2 = Gi(), i2 = Ae(), a2 = "[object Object]", o2 = Function.prototype, s2 = Object.prototype, c2 = o2.toString, l2 = s2.hasOwnProperty, u2 = c2.call(Object);
  function d2(e3) {
    if (!i2(e3) || n2(e3) != a2) return !1;
    var t3 = r2(e3);
    if (t3 === null) return !0;
    var o3 = l2.call(t3, "constructor") && t3.constructor;
    return typeof o3 == "function" && o3 instanceof o3 && c2.call(o3) == u2;
  }
  t2.exports = d2;
}));
var Yi = i(((e2, t2) => {
  function n2(e3, t3) {
    if ((t3 !== "constructor" || typeof e3[t3] != "function") && t3 != "__proto__") return e3[t3];
  }
  t2.exports = n2;
}));
var Xi = i(((e2, t2) => {
  var n2 = Ri(), r2 = ht(), i2 = Object.prototype.hasOwnProperty;
  function a2(e3, t3, a3) {
    var o2 = e3[t3];
    (!(i2.call(e3, t3) && r2(o2, a3)) || a3 === void 0 && !(t3 in e3)) && n2(e3, t3, a3);
  }
  t2.exports = a2;
}));
var Zi = i(((e2, t2) => {
  var n2 = Xi(), r2 = Ri();
  function i2(e3, t3, i3, a2) {
    var o2 = !i3;
    i3 ||= {};
    for (var s2 = -1, c2 = t3.length; ++s2 < c2; ) {
      var l2 = t3[s2], u2 = a2 ? a2(i3[l2], e3[l2], l2, i3, e3) : void 0;
      u2 === void 0 && (u2 = e3[l2]), o2 ? r2(i3, l2, u2) : n2(i3, l2, u2);
    }
    return i3;
  }
  t2.exports = i2;
}));
var Qi = i(((e2, t2) => {
  function n2(e3) {
    var t3 = [];
    if (e3 != null) for (var n3 in Object(e3)) t3.push(n3);
    return t3;
  }
  t2.exports = n2;
}));
var $i = i(((e2, t2) => {
  var n2 = ge(), r2 = ce(), i2 = Qi(), a2 = Object.prototype.hasOwnProperty;
  function o2(e3) {
    if (!n2(e3)) return i2(e3);
    var t3 = r2(e3), o3 = [];
    for (var s2 in e3) (s2 != "constructor" || !t3 && a2.call(e3, s2)) && o3.push(s2);
    return o3;
  }
  t2.exports = o2;
}));
var ea = i(((e2, t2) => {
  var n2 = ft(), r2 = $i(), i2 = Pe();
  function a2(e3) {
    return i2(e3) ? n2(e3, !0) : r2(e3);
  }
  t2.exports = a2;
}));
var ta = i(((e2, t2) => {
  var n2 = Zi(), r2 = ea();
  function i2(e3) {
    return n2(e3, r2(e3));
  }
  t2.exports = i2;
}));
var na = i(((e2, t2) => {
  var n2 = zi(), r2 = Bi(), i2 = Hi(), a2 = Ui(), o2 = Ki(), s2 = Me(), c2 = U(), l2 = qi(), u2 = Ie(), d2 = _e(), f2 = ge(), p2 = Ji(), m2 = Be(), h2 = Yi(), g2 = ta();
  function _2(e3, t3, _3, v2, y2, b2, x2) {
    var S2 = h2(e3, _3), C2 = h2(t3, _3), w2 = x2.get(C2);
    if (w2) n2(e3, _3, w2);
    else {
      var T2 = b2 ? b2(S2, C2, _3 + "", e3, t3, x2) : void 0, E2 = T2 === void 0;
      if (E2) {
        var D2 = c2(C2), O2 = !D2 && u2(C2), k2 = !D2 && !O2 && m2(C2);
        T2 = C2, D2 || O2 || k2 ? c2(S2) ? T2 = S2 : l2(S2) ? T2 = a2(S2) : O2 ? (E2 = !1, T2 = r2(C2, !0)) : k2 ? (E2 = !1, T2 = i2(C2, !0)) : T2 = [] : p2(C2) || s2(C2) ? (T2 = S2, s2(S2) ? T2 = g2(S2) : (!f2(S2) || d2(S2)) && (T2 = o2(C2))) : E2 = !1;
      }
      E2 && (x2.set(C2, T2), y2(T2, C2, v2, b2, x2), x2.delete(C2)), n2(e3, _3, T2);
    }
  }
  t2.exports = _2;
}));
var ra = i(((e2, t2) => {
  var n2 = cn(), r2 = zi(), i2 = Ai(), a2 = na(), o2 = ge(), s2 = ea(), c2 = Yi();
  function l2(e3, t3, u2, d2, f2) {
    e3 !== t3 && i2(t3, function(i3, s3) {
      if (f2 ||= new n2(), o2(i3)) a2(e3, t3, s3, u2, l2, d2, f2);
      else {
        var p2 = d2 ? d2(c2(e3, s3), i3, s3 + "", e3, t3, f2) : void 0;
        p2 === void 0 && (p2 = i3), r2(e3, s3, p2);
      }
    }, s2);
  }
  t2.exports = l2;
}));
var ia = i(((e2, t2) => {
  function n2(e3, t3, n3) {
    switch (n3.length) {
      case 0:
        return e3.call(t3);
      case 1:
        return e3.call(t3, n3[0]);
      case 2:
        return e3.call(t3, n3[0], n3[1]);
      case 3:
        return e3.call(t3, n3[0], n3[1], n3[2]);
    }
    return e3.apply(t3, n3);
  }
  t2.exports = n2;
}));
var aa = i(((e2, t2) => {
  var n2 = ia(), r2 = Math.max;
  function i2(e3, t3, i3) {
    return t3 = r2(t3 === void 0 ? e3.length - 1 : t3, 0), function() {
      for (var a2 = arguments, o2 = -1, s2 = r2(a2.length - t3, 0), c2 = Array(s2); ++o2 < s2; ) c2[o2] = a2[t3 + o2];
      o2 = -1;
      for (var l2 = Array(t3 + 1); ++o2 < t3; ) l2[o2] = a2[o2];
      return l2[t3] = i3(c2), n2(e3, this, l2);
    };
  }
  t2.exports = i2;
}));
var oa = i(((e2, t2) => {
  function n2(e3) {
    return function() {
      return e3;
    };
  }
  t2.exports = n2;
}));
var sa = i(((e2, t2) => {
  var n2 = oa(), r2 = Li(), i2 = In();
  t2.exports = r2 ? function(e3, t3) {
    return r2(e3, "toString", { configurable: !0, enumerable: !1, value: n2(t3), writable: !0 });
  } : i2;
}));
var ca = i(((e2, t2) => {
  var n2 = Date.now;
  function r2(e3) {
    var t3 = 0, r3 = 0;
    return function() {
      var i2 = n2(), a2 = 16 - (i2 - r3);
      if (r3 = i2, a2 > 0) {
        if (++t3 >= 800) return arguments[0];
      } else t3 = 0;
      return e3.apply(void 0, arguments);
    };
  }
  t2.exports = r2;
}));
var la = i(((e2, t2) => {
  var n2 = sa();
  t2.exports = ca()(n2);
}));
var ua = i(((e2, t2) => {
  var n2 = In(), r2 = aa(), i2 = la();
  function a2(e3, t3) {
    return i2(r2(e3, t3, n2), e3 + "");
  }
  t2.exports = a2;
}));
var da = i(((e2, t2) => {
  var n2 = ua(), r2 = gt();
  function i2(e3) {
    return n2(function(t3, n3) {
      var i3 = -1, a2 = n3.length, o2 = a2 > 1 ? n3[a2 - 1] : void 0, s2 = a2 > 2 ? n3[2] : void 0;
      for (o2 = e3.length > 3 && typeof o2 == "function" ? (a2--, o2) : void 0, s2 && r2(n3[0], n3[1], s2) && (o2 = a2 < 3 ? void 0 : o2, a2 = 1), t3 = Object(t3); ++i3 < a2; ) {
        var c2 = n3[i3];
        c2 && e3(t3, c2, i3, o2);
      }
      return t3;
    });
  }
  t2.exports = i2;
}));
var fa = i(((e2, t2) => {
  var n2 = ra();
  t2.exports = da()(function(e3, t3, r2) {
    n2(e3, t3, r2);
  });
}));
var pa = i(((e2, t2) => {
  function n2(e3, t3) {
    for (var n3 = -1, r2 = e3 == null ? 0 : e3.length; ++n3 < r2 && t3(e3[n3], n3, e3) !== !1; ) ;
    return e3;
  }
  t2.exports = n2;
}));
var ma = i(((e2, t2) => {
  var n2 = Zi(), r2 = pt();
  function i2(e3, t3) {
    return e3 && n2(t3, r2(t3), e3);
  }
  t2.exports = i2;
}));
var ha = i(((e2, t2) => {
  var n2 = Zi(), r2 = ea();
  function i2(e3, t3) {
    return e3 && n2(t3, r2(t3), e3);
  }
  t2.exports = i2;
}));
var ga = i(((e2, t2) => {
  var n2 = Zi(), r2 = Cn();
  function i2(e3, t3) {
    return n2(e3, r2(e3), t3);
  }
  t2.exports = i2;
}));
var _a = i(((e2, t2) => {
  var n2 = yn(), r2 = Gi(), i2 = Cn(), a2 = Sn();
  t2.exports = Object.getOwnPropertySymbols ? function(e3) {
    for (var t3 = []; e3; ) n2(t3, i2(e3)), e3 = r2(e3);
    return t3;
  } : a2;
}));
var va = i(((e2, t2) => {
  var n2 = Zi(), r2 = _a();
  function i2(e3, t3) {
    return n2(e3, r2(e3), t3);
  }
  t2.exports = i2;
}));
var ya = i(((e2, t2) => {
  var n2 = bn(), r2 = _a(), i2 = ea();
  function a2(e3) {
    return n2(e3, i2, r2);
  }
  t2.exports = a2;
}));
var ba = i(((e2, t2) => {
  var n2 = Object.prototype.hasOwnProperty;
  function r2(e3) {
    var t3 = e3.length, r3 = new e3.constructor(t3);
    return t3 && typeof e3[0] == "string" && n2.call(e3, "index") && (r3.index = e3.index, r3.input = e3.input), r3;
  }
  t2.exports = r2;
}));
var xa = i(((e2, t2) => {
  var n2 = Vi();
  function r2(e3, t3) {
    var r3 = t3 ? n2(e3.buffer) : e3.buffer;
    return new e3.constructor(r3, e3.byteOffset, e3.byteLength);
  }
  t2.exports = r2;
}));
var Sa = i(((e2, t2) => {
  var n2 = /\w*$/;
  function r2(e3) {
    var t3 = new e3.constructor(e3.source, n2.exec(e3));
    return t3.lastIndex = e3.lastIndex, t3;
  }
  t2.exports = r2;
}));
var Ca = i(((e2, t2) => {
  var n2 = fe(), r2 = n2 ? n2.prototype : void 0, i2 = r2 ? r2.valueOf : void 0;
  function a2(e3) {
    return i2 ? Object(i2.call(e3)) : {};
  }
  t2.exports = a2;
}));
var wa = i(((e2, t2) => {
  var n2 = Vi(), r2 = xa(), i2 = Sa(), a2 = Ca(), o2 = Hi(), s2 = "[object Boolean]", c2 = "[object Date]", l2 = "[object Map]", u2 = "[object Number]", d2 = "[object RegExp]", f2 = "[object Set]", p2 = "[object String]", m2 = "[object Symbol]", h2 = "[object ArrayBuffer]", g2 = "[object DataView]", _2 = "[object Float32Array]", v2 = "[object Float64Array]", y2 = "[object Int8Array]", b2 = "[object Int16Array]", x2 = "[object Int32Array]", S2 = "[object Uint8Array]", C2 = "[object Uint8ClampedArray]", w2 = "[object Uint16Array]", T2 = "[object Uint32Array]";
  function E2(e3, t3, E3) {
    var D2 = e3.constructor;
    switch (t3) {
      case h2:
        return n2(e3);
      case s2:
      case c2:
        return new D2(+e3);
      case g2:
        return r2(e3, E3);
      case _2:
      case v2:
      case y2:
      case b2:
      case x2:
      case S2:
      case C2:
      case w2:
      case T2:
        return o2(e3, E3);
      case l2:
        return new D2();
      case u2:
      case p2:
        return new D2(e3);
      case d2:
        return i2(e3);
      case f2:
        return new D2();
      case m2:
        return a2(e3);
    }
  }
  t2.exports = E2;
}));
var Ta = i(((e2, t2) => {
  var n2 = ke(), r2 = Ae(), i2 = "[object Map]";
  function a2(e3) {
    return r2(e3) && n2(e3) == i2;
  }
  t2.exports = a2;
}));
var Ea = i(((e2, t2) => {
  var n2 = Ta(), r2 = Re(), i2 = ze(), a2 = i2 && i2.isMap;
  t2.exports = a2 ? r2(a2) : n2;
}));
var Da = i(((e2, t2) => {
  var n2 = ke(), r2 = Ae(), i2 = "[object Set]";
  function a2(e3) {
    return r2(e3) && n2(e3) == i2;
  }
  t2.exports = a2;
}));
var Oa = i(((e2, t2) => {
  var n2 = Da(), r2 = Re(), i2 = ze(), a2 = i2 && i2.isSet;
  t2.exports = a2 ? r2(a2) : n2;
}));
var ka = i(((e2, t2) => {
  var n2 = cn(), r2 = pa(), i2 = Xi(), a2 = ma(), o2 = ha(), s2 = Bi(), c2 = Ui(), l2 = ga(), u2 = va(), d2 = wn(), f2 = ya(), p2 = ke(), m2 = ba(), h2 = wa(), g2 = Ki(), _2 = U(), v2 = Ie(), y2 = Ea(), b2 = ge(), x2 = Oa(), S2 = pt(), C2 = ea(), w2 = 1, T2 = 2, E2 = 4, D2 = "[object Arguments]", O2 = "[object Array]", k2 = "[object Boolean]", A2 = "[object Date]", j2 = "[object Error]", M2 = "[object Function]", N2 = "[object GeneratorFunction]", P2 = "[object Map]", F2 = "[object Number]", ee2 = "[object Object]", I2 = "[object RegExp]", L2 = "[object Set]", te2 = "[object String]", R2 = "[object Symbol]", ne2 = "[object WeakMap]", re2 = "[object ArrayBuffer]", z2 = "[object DataView]", B2 = "[object Float32Array]", ie2 = "[object Float64Array]", ae2 = "[object Int8Array]", oe2 = "[object Int16Array]", se2 = "[object Int32Array]", ce2 = "[object Uint8Array]", le2 = "[object Uint8ClampedArray]", ue2 = "[object Uint16Array]", de2 = "[object Uint32Array]", V2 = {};
  V2[D2] = V2[O2] = V2[re2] = V2[z2] = V2[k2] = V2[A2] = V2[B2] = V2[ie2] = V2[ae2] = V2[oe2] = V2[se2] = V2[P2] = V2[F2] = V2[ee2] = V2[I2] = V2[L2] = V2[te2] = V2[R2] = V2[ce2] = V2[le2] = V2[ue2] = V2[de2] = !0, V2[j2] = V2[M2] = V2[ne2] = !1;
  function H2(e3, t3, O3, k3, A3, j3) {
    var P3, F3 = t3 & w2, I3 = t3 & T2, L3 = t3 & E2;
    if (O3 && (P3 = A3 ? O3(e3, k3, A3, j3) : O3(e3)), P3 !== void 0) return P3;
    if (!b2(e3)) return e3;
    var te3 = _2(e3);
    if (te3) {
      if (P3 = m2(e3), !F3) return c2(e3, P3);
    } else {
      var R3 = p2(e3), ne3 = R3 == M2 || R3 == N2;
      if (v2(e3)) return s2(e3, F3);
      if (R3 == ee2 || R3 == D2 || ne3 && !A3) {
        if (P3 = I3 || ne3 ? {} : g2(e3), !F3) return I3 ? u2(e3, o2(P3, e3)) : l2(e3, a2(P3, e3));
      } else {
        if (!V2[R3]) return A3 ? e3 : {};
        P3 = h2(e3, R3, F3);
      }
    }
    j3 ||= new n2();
    var re3 = j3.get(e3);
    if (re3) return re3;
    j3.set(e3, P3), x2(e3) ? e3.forEach(function(n3) {
      P3.add(H2(n3, t3, O3, n3, e3, j3));
    }) : y2(e3) && e3.forEach(function(n3, r3) {
      P3.set(r3, H2(n3, t3, O3, r3, e3, j3));
    });
    var z3 = te3 ? void 0 : (L3 ? I3 ? f2 : d2 : I3 ? C2 : S2)(e3);
    return r2(z3 || e3, function(n3, r3) {
      z3 && (r3 = n3, n3 = e3[r3]), i2(P3, r3, H2(n3, t3, O3, r3, e3, j3));
    }), P3;
  }
  t2.exports = H2;
}));
var Aa = i(((e2, t2) => {
  var n2 = ka(), r2 = 1, i2 = 4;
  function a2(e3) {
    return n2(e3, r2 | i2);
  }
  t2.exports = a2;
}));
var ja = i(((e2) => {
  e2.aliasToReal = { each: "forEach", eachRight: "forEachRight", entries: "toPairs", entriesIn: "toPairsIn", extend: "assignIn", extendAll: "assignInAll", extendAllWith: "assignInAllWith", extendWith: "assignInWith", first: "head", conforms: "conformsTo", matches: "isMatch", property: "get", __: "placeholder", F: "stubFalse", T: "stubTrue", all: "every", allPass: "overEvery", always: "constant", any: "some", anyPass: "overSome", apply: "spread", assoc: "set", assocPath: "set", complement: "negate", compose: "flowRight", contains: "includes", dissoc: "unset", dissocPath: "unset", dropLast: "dropRight", dropLastWhile: "dropRightWhile", equals: "isEqual", identical: "eq", indexBy: "keyBy", init: "initial", invertObj: "invert", juxt: "over", omitAll: "omit", nAry: "ary", path: "get", pathEq: "matchesProperty", pathOr: "getOr", paths: "at", pickAll: "pick", pipe: "flow", pluck: "map", prop: "get", propEq: "matchesProperty", propOr: "getOr", props: "at", symmetricDifference: "xor", symmetricDifferenceBy: "xorBy", symmetricDifferenceWith: "xorWith", takeLast: "takeRight", takeLastWhile: "takeRightWhile", unapply: "rest", unnest: "flatten", useWith: "overArgs", where: "conformsTo", whereEq: "isMatch", zipObj: "zipObject" }, e2.aryMethod = { 1: "assignAll.assignInAll.attempt.castArray.ceil.create.curry.curryRight.defaultsAll.defaultsDeepAll.floor.flow.flowRight.fromPairs.invert.iteratee.memoize.method.mergeAll.methodOf.mixin.nthArg.over.overEvery.overSome.rest.reverse.round.runInContext.spread.template.trim.trimEnd.trimStart.uniqueId.words.zipAll".split("."), 2: "add.after.ary.assign.assignAllWith.assignIn.assignInAllWith.at.before.bind.bindAll.bindKey.chunk.cloneDeepWith.cloneWith.concat.conformsTo.countBy.curryN.curryRightN.debounce.defaults.defaultsDeep.defaultTo.delay.difference.divide.drop.dropRight.dropRightWhile.dropWhile.endsWith.eq.every.filter.find.findIndex.findKey.findLast.findLastIndex.findLastKey.flatMap.flatMapDeep.flattenDepth.forEach.forEachRight.forIn.forInRight.forOwn.forOwnRight.get.groupBy.gt.gte.has.hasIn.includes.indexOf.intersection.invertBy.invoke.invokeMap.isEqual.isMatch.join.keyBy.lastIndexOf.lt.lte.map.mapKeys.mapValues.matchesProperty.maxBy.meanBy.merge.mergeAllWith.minBy.multiply.nth.omit.omitBy.overArgs.pad.padEnd.padStart.parseInt.partial.partialRight.partition.pick.pickBy.propertyOf.pull.pullAll.pullAt.random.range.rangeRight.rearg.reject.remove.repeat.restFrom.result.sampleSize.some.sortBy.sortedIndex.sortedIndexOf.sortedLastIndex.sortedLastIndexOf.sortedUniqBy.split.spreadFrom.startsWith.subtract.sumBy.take.takeRight.takeRightWhile.takeWhile.tap.throttle.thru.times.trimChars.trimCharsEnd.trimCharsStart.truncate.union.uniqBy.uniqWith.unset.unzipWith.without.wrap.xor.zip.zipObject.zipObjectDeep".split("."), 3: "assignInWith.assignWith.clamp.differenceBy.differenceWith.findFrom.findIndexFrom.findLastFrom.findLastIndexFrom.getOr.includesFrom.indexOfFrom.inRange.intersectionBy.intersectionWith.invokeArgs.invokeArgsMap.isEqualWith.isMatchWith.flatMapDepth.lastIndexOfFrom.mergeWith.orderBy.padChars.padCharsEnd.padCharsStart.pullAllBy.pullAllWith.rangeStep.rangeStepRight.reduce.reduceRight.replace.set.slice.sortedIndexBy.sortedLastIndexBy.transform.unionBy.unionWith.update.xorBy.xorWith.zipWith".split("."), 4: ["fill", "setWith", "updateWith"] }, e2.aryRearg = { 2: [1, 0], 3: [2, 0, 1], 4: [3, 2, 0, 1] }, e2.iterateeAry = { dropRightWhile: 1, dropWhile: 1, every: 1, filter: 1, find: 1, findFrom: 1, findIndex: 1, findIndexFrom: 1, findKey: 1, findLast: 1, findLastFrom: 1, findLastIndex: 1, findLastIndexFrom: 1, findLastKey: 1, flatMap: 1, flatMapDeep: 1, flatMapDepth: 1, forEach: 1, forEachRight: 1, forIn: 1, forInRight: 1, forOwn: 1, forOwnRight: 1, map: 1, mapKeys: 1, mapValues: 1, partition: 1, reduce: 2, reduceRight: 2, reject: 1, remove: 1, some: 1, takeRightWhile: 1, takeWhile: 1, times: 1, transform: 2 }, e2.iterateeRearg = { mapKeys: [1], reduceRight: [1, 0] }, e2.methodRearg = { assignInAllWith: [1, 0], assignInWith: [1, 2, 0], assignAllWith: [1, 0], assignWith: [1, 2, 0], differenceBy: [1, 2, 0], differenceWith: [1, 2, 0], getOr: [2, 1, 0], intersectionBy: [1, 2, 0], intersectionWith: [1, 2, 0], isEqualWith: [1, 2, 0], isMatchWith: [2, 1, 0], mergeAllWith: [1, 0], mergeWith: [1, 2, 0], padChars: [2, 1, 0], padCharsEnd: [2, 1, 0], padCharsStart: [2, 1, 0], pullAllBy: [2, 1, 0], pullAllWith: [2, 1, 0], rangeStep: [1, 2, 0], rangeStepRight: [1, 2, 0], setWith: [3, 1, 2, 0], sortedIndexBy: [2, 1, 0], sortedLastIndexBy: [2, 1, 0], unionBy: [1, 2, 0], unionWith: [1, 2, 0], updateWith: [3, 1, 2, 0], xorBy: [1, 2, 0], xorWith: [1, 2, 0], zipWith: [1, 2, 0] }, e2.methodSpread = { assignAll: { start: 0 }, assignAllWith: { start: 0 }, assignInAll: { start: 0 }, assignInAllWith: { start: 0 }, defaultsAll: { start: 0 }, defaultsDeepAll: { start: 0 }, invokeArgs: { start: 2 }, invokeArgsMap: { start: 2 }, mergeAll: { start: 0 }, mergeAllWith: { start: 0 }, partial: { start: 1 }, partialRight: { start: 1 }, without: { start: 1 }, zipAll: { start: 0 } }, e2.mutate = { array: { fill: !0, pull: !0, pullAll: !0, pullAllBy: !0, pullAllWith: !0, pullAt: !0, remove: !0, reverse: !0 }, object: { assign: !0, assignAll: !0, assignAllWith: !0, assignIn: !0, assignInAll: !0, assignInAllWith: !0, assignInWith: !0, assignWith: !0, defaults: !0, defaultsAll: !0, defaultsDeep: !0, defaultsDeepAll: !0, merge: !0, mergeAll: !0, mergeAllWith: !0, mergeWith: !0 }, set: { set: !0, setWith: !0, unset: !0, update: !0, updateWith: !0 } }, e2.realToAlias = (function() {
    var t2 = Object.prototype.hasOwnProperty, n2 = e2.aliasToReal, r2 = {};
    for (var i2 in n2) {
      var a2 = n2[i2];
      t2.call(r2, a2) ? r2[a2].push(i2) : r2[a2] = [i2];
    }
    return r2;
  })(), e2.remap = { assignAll: "assign", assignAllWith: "assignWith", assignInAll: "assignIn", assignInAllWith: "assignInWith", curryN: "curry", curryRightN: "curryRight", defaultsAll: "defaults", defaultsDeepAll: "defaultsDeep", findFrom: "find", findIndexFrom: "findIndex", findLastFrom: "findLast", findLastIndexFrom: "findLastIndex", getOr: "get", includesFrom: "includes", indexOfFrom: "indexOf", invokeArgs: "invoke", invokeArgsMap: "invokeMap", lastIndexOfFrom: "lastIndexOf", mergeAll: "merge", mergeAllWith: "mergeWith", padChars: "pad", padCharsEnd: "padEnd", padCharsStart: "padStart", propertyOf: "get", rangeStep: "range", rangeStepRight: "rangeRight", restFrom: "rest", spreadFrom: "spread", trimChars: "trim", trimCharsEnd: "trimEnd", trimCharsStart: "trimStart", zipAll: "zip" }, e2.skipFixed = { castArray: !0, flow: !0, flowRight: !0, iteratee: !0, mixin: !0, rearg: !0, runInContext: !0 }, e2.skipRearg = { add: !0, assign: !0, assignIn: !0, bind: !0, bindKey: !0, concat: !0, difference: !0, divide: !0, eq: !0, gt: !0, gte: !0, isEqual: !0, lt: !0, lte: !0, matchesProperty: !0, merge: !0, multiply: !0, overArgs: !0, partial: !0, partialRight: !0, propertyOf: !0, random: !0, range: !0, rangeRight: !0, subtract: !0, zip: !0, zipObject: !0, zipObjectDeep: !0 };
}));
var Ma = i(((e2, t2) => {
  t2.exports = {};
}));
var Na = i(((e2, t2) => {
  var n2 = ja(), r2 = Ma(), i2 = Array.prototype.push;
  function a2(e3, t3) {
    return t3 == 2 ? function(t4, n3) {
      return e3.apply(void 0, arguments);
    } : function(t4) {
      return e3.apply(void 0, arguments);
    };
  }
  function o2(e3, t3) {
    return t3 == 2 ? function(t4, n3) {
      return e3(t4, n3);
    } : function(t4) {
      return e3(t4);
    };
  }
  function s2(e3) {
    for (var t3 = e3 ? e3.length : 0, n3 = Array(t3); t3--; ) n3[t3] = e3[t3];
    return n3;
  }
  function c2(e3) {
    return function(t3) {
      return e3({}, t3);
    };
  }
  function l2(e3, t3) {
    return function() {
      for (var n3 = arguments.length, r3 = n3 - 1, a3 = Array(n3); n3--; ) a3[n3] = arguments[n3];
      var o3 = a3[t3], s3 = a3.slice(0, t3);
      return o3 && i2.apply(s3, o3), t3 != r3 && i2.apply(s3, a3.slice(t3 + 1)), e3.apply(this, s3);
    };
  }
  function u2(e3, t3) {
    return function() {
      var n3 = arguments.length;
      if (n3) {
        for (var r3 = Array(n3); n3--; ) r3[n3] = arguments[n3];
        var i3 = r3[0] = t3.apply(void 0, r3);
        return e3.apply(void 0, r3), i3;
      }
    };
  }
  function d2(e3, t3, i3, f2) {
    var p2 = typeof t3 == "function", m2 = t3 === Object(t3);
    if (m2 && (f2 = i3, i3 = t3, t3 = void 0), i3 == null) throw TypeError();
    f2 ||= {};
    var h2 = { cap: "cap" in f2 ? f2.cap : !0, curry: "curry" in f2 ? f2.curry : !0, fixed: "fixed" in f2 ? f2.fixed : !0, immutable: "immutable" in f2 ? f2.immutable : !0, rearg: "rearg" in f2 ? f2.rearg : !0 }, g2 = p2 ? i3 : r2, _2 = "curry" in f2 && f2.curry, v2 = "fixed" in f2 && f2.fixed, y2 = "rearg" in f2 && f2.rearg, b2 = p2 ? i3.runInContext() : void 0, x2 = p2 ? i3 : { ary: e3.ary, assign: e3.assign, clone: e3.clone, curry: e3.curry, forEach: e3.forEach, isArray: e3.isArray, isError: e3.isError, isFunction: e3.isFunction, isWeakMap: e3.isWeakMap, iteratee: e3.iteratee, keys: e3.keys, rearg: e3.rearg, toInteger: e3.toInteger, toPath: e3.toPath }, S2 = x2.ary, C2 = x2.assign, w2 = x2.clone, T2 = x2.curry, E2 = x2.forEach, D2 = x2.isArray, O2 = x2.isError, k2 = x2.isFunction, A2 = x2.isWeakMap, j2 = x2.keys, M2 = x2.rearg, N2 = x2.toInteger, P2 = x2.toPath, F2 = j2(n2.aryMethod), ee2 = { castArray: function(e4) {
      return function() {
        var t4 = arguments[0];
        return D2(t4) ? e4(s2(t4)) : e4.apply(void 0, arguments);
      };
    }, iteratee: function(e4) {
      return function() {
        var t4 = arguments[0], n3 = arguments[1], r3 = e4(t4, n3), i4 = r3.length;
        return h2.cap && typeof n3 == "number" ? (n3 = n3 > 2 ? n3 - 2 : 1, i4 && i4 <= n3 ? r3 : o2(r3, n3)) : r3;
      };
    }, mixin: function(e4) {
      return function(t4) {
        var n3 = this;
        if (!k2(n3)) return e4(n3, Object(t4));
        var r3 = [];
        return E2(j2(t4), function(e5) {
          k2(t4[e5]) && r3.push([e5, n3.prototype[e5]]);
        }), e4(n3, Object(t4)), E2(r3, function(e5) {
          var t5 = e5[1];
          k2(t5) ? n3.prototype[e5[0]] = t5 : delete n3.prototype[e5[0]];
        }), n3;
      };
    }, nthArg: function(e4) {
      return function(t4) {
        var n3 = t4 < 0 ? 1 : N2(t4) + 1;
        return T2(e4(t4), n3);
      };
    }, rearg: function(e4) {
      return function(t4, n3) {
        var r3 = n3 ? n3.length : 0;
        return T2(e4(t4, n3), r3);
      };
    }, runInContext: function(t4) {
      return function(n3) {
        return d2(e3, t4(n3), f2);
      };
    } };
    function I2(e4, t4) {
      if (h2.cap) {
        var r3 = n2.iterateeRearg[e4];
        if (r3) return ie2(t4, r3);
        var i4 = !p2 && n2.iterateeAry[e4];
        if (i4) return B2(t4, i4);
      }
      return t4;
    }
    function L2(e4, t4, n3) {
      return _2 || h2.curry && n3 > 1 ? T2(t4, n3) : t4;
    }
    function te2(e4, t4, r3) {
      if (h2.fixed && (v2 || !n2.skipFixed[e4])) {
        var i4 = n2.methodSpread[e4], a3 = i4 && i4.start;
        return a3 === void 0 ? S2(t4, r3) : l2(t4, a3);
      }
      return t4;
    }
    function R2(e4, t4, r3) {
      return h2.rearg && r3 > 1 && (y2 || !n2.skipRearg[e4]) ? M2(t4, n2.methodRearg[e4] || n2.aryRearg[r3]) : t4;
    }
    function ne2(e4, t4) {
      t4 = P2(t4);
      for (var n3 = -1, r3 = t4.length, i4 = r3 - 1, a3 = w2(Object(e4)), o3 = a3; o3 != null && ++n3 < r3; ) {
        var s3 = t4[n3], c3 = o3[s3];
        c3 != null && !(k2(c3) || O2(c3) || A2(c3)) && (o3[s3] = w2(n3 == i4 ? c3 : Object(c3))), o3 = o3[s3];
      }
      return a3;
    }
    function re2(e4) {
      return se2.runInContext.convert(e4)(void 0);
    }
    function z2(e4, t4) {
      var r3 = n2.aliasToReal[e4] || e4, i4 = n2.remap[r3] || r3, a3 = f2;
      return function(e5) {
        return d2(p2 ? b2 : x2, r3, p2 ? b2[i4] : t4, C2(C2({}, a3), e5));
      };
    }
    function B2(e4, t4) {
      return ae2(e4, function(e5) {
        return typeof e5 == "function" ? o2(e5, t4) : e5;
      });
    }
    function ie2(e4, t4) {
      return ae2(e4, function(e5) {
        var n3 = t4.length;
        return a2(M2(o2(e5, n3), t4), n3);
      });
    }
    function ae2(e4, t4) {
      return function() {
        var n3 = arguments.length;
        if (!n3) return e4();
        for (var r3 = Array(n3); n3--; ) r3[n3] = arguments[n3];
        var i4 = h2.rearg ? 0 : n3 - 1;
        return r3[i4] = t4(r3[i4]), e4.apply(void 0, r3);
      };
    }
    function oe2(e4, t4, r3) {
      var i4, a3 = n2.aliasToReal[e4] || e4, o3 = t4, l3 = ee2[a3];
      return l3 ? o3 = l3(t4) : h2.immutable && (n2.mutate.array[a3] ? o3 = u2(t4, s2) : n2.mutate.object[a3] ? o3 = u2(t4, c2(t4)) : n2.mutate.set[a3] && (o3 = u2(t4, ne2))), E2(F2, function(e5) {
        return E2(n2.aryMethod[e5], function(t5) {
          if (a3 == t5) {
            var r4 = n2.methodSpread[a3];
            return i4 = r4 && r4.afterRearg ? te2(a3, R2(a3, o3, e5), e5) : R2(a3, te2(a3, o3, e5), e5), i4 = I2(a3, i4), i4 = L2(a3, i4, e5), !1;
          }
        }), !i4;
      }), i4 ||= o3, i4 == t4 && (i4 = _2 ? T2(i4, 1) : function() {
        return t4.apply(this, arguments);
      }), i4.convert = z2(a3, t4), i4.placeholder = t4.placeholder = r3, i4;
    }
    if (!m2) return oe2(t3, i3, g2);
    var se2 = i3, ce2 = [];
    return E2(F2, function(e4) {
      E2(n2.aryMethod[e4], function(e5) {
        var t4 = se2[n2.remap[e5] || e5];
        t4 && ce2.push([e5, oe2(e5, t4, se2)]);
      });
    }), E2(j2(se2), function(e4) {
      var t4 = se2[e4];
      if (typeof t4 == "function") {
        for (var n3 = ce2.length; n3--; ) if (ce2[n3][0] == e4) return;
        t4.convert = z2(e4, t4), ce2.push([e4, t4]);
      }
    }), E2(ce2, function(e4) {
      se2[e4[0]] = e4[1];
    }), se2.convert = re2, se2.placeholder = se2, E2(j2(se2), function(e4) {
      E2(n2.realToAlias[e4] || [], function(t4) {
        se2[t4] = se2[e4];
      });
    }), se2;
  }
  t2.exports = d2;
}));
var Pa = i(((e2, t2) => {
  var n2 = Oe();
  t2.exports = n2 && new n2();
}));
var Fa = i(((e2, t2) => {
  var n2 = In(), r2 = Pa();
  t2.exports = r2 ? function(e3, t3) {
    return r2.set(e3, t3), e3;
  } : n2;
}));
var Ia = i(((e2, t2) => {
  var n2 = Wi(), r2 = ge();
  function i2(e3) {
    return function() {
      var t3 = arguments;
      switch (t3.length) {
        case 0:
          return new e3();
        case 1:
          return new e3(t3[0]);
        case 2:
          return new e3(t3[0], t3[1]);
        case 3:
          return new e3(t3[0], t3[1], t3[2]);
        case 4:
          return new e3(t3[0], t3[1], t3[2], t3[3]);
        case 5:
          return new e3(t3[0], t3[1], t3[2], t3[3], t3[4]);
        case 6:
          return new e3(t3[0], t3[1], t3[2], t3[3], t3[4], t3[5]);
        case 7:
          return new e3(t3[0], t3[1], t3[2], t3[3], t3[4], t3[5], t3[6]);
      }
      var i3 = n2(e3.prototype), a2 = e3.apply(i3, t3);
      return r2(a2) ? a2 : i3;
    };
  }
  t2.exports = i2;
}));
var La = i(((e2, t2) => {
  var n2 = Ia(), r2 = H(), i2 = 1;
  function a2(e3, t3, a3) {
    var o2 = t3 & i2, s2 = n2(e3);
    function c2() {
      return (this && this !== r2 && this instanceof c2 ? s2 : e3).apply(o2 ? a3 : this, arguments);
    }
    return c2;
  }
  t2.exports = a2;
}));
var Ra = i(((e2, t2) => {
  var n2 = Math.max;
  function r2(e3, t3, r3, i2) {
    for (var a2 = -1, o2 = e3.length, s2 = r3.length, c2 = -1, l2 = t3.length, u2 = n2(o2 - s2, 0), d2 = Array(l2 + u2), f2 = !i2; ++c2 < l2; ) d2[c2] = t3[c2];
    for (; ++a2 < s2; ) (f2 || a2 < o2) && (d2[r3[a2]] = e3[a2]);
    for (; u2--; ) d2[c2++] = e3[a2++];
    return d2;
  }
  t2.exports = r2;
}));
var za = i(((e2, t2) => {
  var n2 = Math.max;
  function r2(e3, t3, r3, i2) {
    for (var a2 = -1, o2 = e3.length, s2 = -1, c2 = r3.length, l2 = -1, u2 = t3.length, d2 = n2(o2 - c2, 0), f2 = Array(d2 + u2), p2 = !i2; ++a2 < d2; ) f2[a2] = e3[a2];
    for (var m2 = a2; ++l2 < u2; ) f2[m2 + l2] = t3[l2];
    for (; ++s2 < c2; ) (p2 || a2 < o2) && (f2[m2 + r3[s2]] = e3[a2++]);
    return f2;
  }
  t2.exports = r2;
}));
var Ba = i(((e2, t2) => {
  function n2(e3, t3) {
    for (var n3 = e3.length, r2 = 0; n3--; ) e3[n3] === t3 && ++r2;
    return r2;
  }
  t2.exports = n2;
}));
var Va = i(((e2, t2) => {
  function n2() {
  }
  t2.exports = n2;
}));
var Ha = i(((e2, t2) => {
  var n2 = Wi(), r2 = Va(), i2 = 4294967295;
  function a2(e3) {
    this.__wrapped__ = e3, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = i2, this.__views__ = [];
  }
  a2.prototype = n2(r2.prototype), a2.prototype.constructor = a2, t2.exports = a2;
}));
var Ua = i(((e2, t2) => {
  function n2() {
  }
  t2.exports = n2;
}));
var Wa = i(((e2, t2) => {
  var n2 = Pa(), r2 = Ua();
  t2.exports = n2 ? function(e3) {
    return n2.get(e3);
  } : r2;
}));
var Ga = i(((e2, t2) => {
  t2.exports = {};
}));
var Ka = i(((e2, t2) => {
  var n2 = Ga(), r2 = Object.prototype.hasOwnProperty;
  function i2(e3) {
    for (var t3 = e3.name + "", i3 = n2[t3], a2 = r2.call(n2, t3) ? i3.length : 0; a2--; ) {
      var o2 = i3[a2], s2 = o2.func;
      if (s2 == null || s2 == e3) return o2.name;
    }
    return t3;
  }
  t2.exports = i2;
}));
var qa = i(((e2, t2) => {
  var n2 = Wi(), r2 = Va();
  function i2(e3, t3) {
    this.__wrapped__ = e3, this.__actions__ = [], this.__chain__ = !!t3, this.__index__ = 0, this.__values__ = void 0;
  }
  i2.prototype = n2(r2.prototype), i2.prototype.constructor = i2, t2.exports = i2;
}));
var Ja = i(((e2, t2) => {
  var n2 = Ha(), r2 = qa(), i2 = Ui();
  function a2(e3) {
    if (e3 instanceof n2) return e3.clone();
    var t3 = new r2(e3.__wrapped__, e3.__chain__);
    return t3.__actions__ = i2(e3.__actions__), t3.__index__ = e3.__index__, t3.__values__ = e3.__values__, t3;
  }
  t2.exports = a2;
}));
var Ya = i(((e2, t2) => {
  var n2 = Ha(), r2 = qa(), i2 = Va(), a2 = U(), o2 = Ae(), s2 = Ja(), c2 = Object.prototype.hasOwnProperty;
  function l2(e3) {
    if (o2(e3) && !a2(e3) && !(e3 instanceof n2)) {
      if (e3 instanceof r2) return e3;
      if (c2.call(e3, "__wrapped__")) return s2(e3);
    }
    return new r2(e3);
  }
  l2.prototype = i2.prototype, l2.prototype.constructor = l2, t2.exports = l2;
}));
var Xa = i(((e2, t2) => {
  var n2 = Ha(), r2 = Wa(), i2 = Ka(), a2 = Ya();
  function o2(e3) {
    var t3 = i2(e3), o3 = a2[t3];
    if (typeof o3 != "function" || !(t3 in n2.prototype)) return !1;
    if (e3 === o3) return !0;
    var s2 = r2(o3);
    return !!s2 && e3 === s2[0];
  }
  t2.exports = o2;
}));
var Za = i(((e2, t2) => {
  var n2 = Fa();
  t2.exports = ca()(n2);
}));
var Qa = i(((e2, t2) => {
  var n2 = /\{\n\/\* \[wrapped with (.+)\] \*/, r2 = /,? & /;
  function i2(e3) {
    var t3 = e3.match(n2);
    return t3 ? t3[1].split(r2) : [];
  }
  t2.exports = i2;
}));
var $a = i(((e2, t2) => {
  var n2 = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/;
  function r2(e3, t3) {
    var r3 = t3.length;
    if (!r3) return e3;
    var i2 = r3 - 1;
    return t3[i2] = (r3 > 1 ? "& " : "") + t3[i2], t3 = t3.join(r3 > 2 ? ", " : " "), e3.replace(n2, `{
/* [wrapped with ` + t3 + `] */
`);
  }
  t2.exports = r2;
}));
var eo = i(((e2, t2) => {
  var n2 = Jn();
  function r2(e3, t3) {
    return !!(e3 != null && e3.length) && n2(e3, t3, 0) > -1;
  }
  t2.exports = r2;
}));
var to = i(((e2, t2) => {
  var n2 = pa(), r2 = eo(), i2 = [["ary", 128], ["bind", 1], ["bindKey", 2], ["curry", 8], ["curryRight", 16], ["flip", 512], ["partial", 32], ["partialRight", 64], ["rearg", 256]];
  function a2(e3, t3) {
    return n2(i2, function(n3) {
      var i3 = "_." + n3[0];
      t3 & n3[1] && !r2(e3, i3) && e3.push(i3);
    }), e3.sort();
  }
  t2.exports = a2;
}));
var no = i(((e2, t2) => {
  var n2 = Qa(), r2 = $a(), i2 = la(), a2 = to();
  function o2(e3, t3, o3) {
    var s2 = t3 + "";
    return i2(e3, r2(s2, a2(n2(s2), o3)));
  }
  t2.exports = o2;
}));
var ro = i(((e2, t2) => {
  var n2 = Xa(), r2 = Za(), i2 = no(), a2 = 1, o2 = 2, s2 = 4, c2 = 8, l2 = 32, u2 = 64;
  function d2(e3, t3, d3, f2, p2, m2, h2, g2, _2, v2) {
    var y2 = t3 & c2, b2 = y2 ? h2 : void 0, x2 = y2 ? void 0 : h2, S2 = y2 ? m2 : void 0, C2 = y2 ? void 0 : m2;
    t3 |= y2 ? l2 : u2, t3 &= ~(y2 ? u2 : l2), t3 & s2 || (t3 &= ~(a2 | o2));
    var w2 = [e3, t3, p2, S2, b2, C2, x2, g2, _2, v2], T2 = d3.apply(void 0, w2);
    return n2(e3) && r2(T2, w2), T2.placeholder = f2, i2(T2, e3, t3);
  }
  t2.exports = d2;
}));
var io = i(((e2, t2) => {
  function n2(e3) {
    return e3.placeholder;
  }
  t2.exports = n2;
}));
var ao = i(((e2, t2) => {
  var n2 = Ui(), r2 = dt(), i2 = Math.min;
  function a2(e3, t3) {
    for (var a3 = e3.length, o2 = i2(t3.length, a3), s2 = n2(e3); o2--; ) {
      var c2 = t3[o2];
      e3[o2] = r2(c2, a3) ? s2[c2] : void 0;
    }
    return e3;
  }
  t2.exports = a2;
}));
var oo = i(((e2, t2) => {
  var n2 = "__lodash_placeholder__";
  function r2(e3, t3) {
    for (var r3 = -1, i2 = e3.length, a2 = 0, o2 = []; ++r3 < i2; ) {
      var s2 = e3[r3];
      (s2 === t3 || s2 === n2) && (e3[r3] = n2, o2[a2++] = r3);
    }
    return o2;
  }
  t2.exports = r2;
}));
var so = i(((e2, t2) => {
  var n2 = Ra(), r2 = za(), i2 = Ba(), a2 = Ia(), o2 = ro(), s2 = io(), c2 = ao(), l2 = oo(), u2 = H(), d2 = 1, f2 = 2, p2 = 8, m2 = 16, h2 = 128, g2 = 512;
  function _2(e3, t3, v2, y2, b2, x2, S2, C2, w2, T2) {
    var E2 = t3 & h2, D2 = t3 & d2, O2 = t3 & f2, k2 = t3 & (p2 | m2), A2 = t3 & g2, j2 = O2 ? void 0 : a2(e3);
    function M2() {
      for (var d3 = arguments.length, f3 = Array(d3), p3 = d3; p3--; ) f3[p3] = arguments[p3];
      if (k2) var m3 = s2(M2), h3 = i2(f3, m3);
      if (y2 && (f3 = n2(f3, y2, b2, k2)), x2 && (f3 = r2(f3, x2, S2, k2)), d3 -= h3, k2 && d3 < T2) {
        var g3 = l2(f3, m3);
        return o2(e3, t3, _2, M2.placeholder, v2, f3, g3, C2, w2, T2 - d3);
      }
      var N2 = D2 ? v2 : this, P2 = O2 ? N2[e3] : e3;
      return d3 = f3.length, C2 ? f3 = c2(f3, C2) : A2 && d3 > 1 && f3.reverse(), E2 && w2 < d3 && (f3.length = w2), this && this !== u2 && this instanceof M2 && (P2 = j2 || a2(P2)), P2.apply(N2, f3);
    }
    return M2;
  }
  t2.exports = _2;
}));
var co = i(((e2, t2) => {
  var n2 = ia(), r2 = Ia(), i2 = so(), a2 = ro(), o2 = io(), s2 = oo(), c2 = H();
  function l2(e3, t3, l3) {
    var u2 = r2(e3);
    function d2() {
      for (var r3 = arguments.length, f2 = Array(r3), p2 = r3, m2 = o2(d2); p2--; ) f2[p2] = arguments[p2];
      var h2 = r3 < 3 && f2[0] !== m2 && f2[r3 - 1] !== m2 ? [] : s2(f2, m2);
      return r3 -= h2.length, r3 < l3 ? a2(e3, t3, i2, d2.placeholder, void 0, f2, h2, void 0, void 0, l3 - r3) : n2(this && this !== c2 && this instanceof d2 ? u2 : e3, this, f2);
    }
    return d2;
  }
  t2.exports = l2;
}));
var lo = i(((e2, t2) => {
  var n2 = ia(), r2 = Ia(), i2 = H(), a2 = 1;
  function o2(e3, t3, o3, s2) {
    var c2 = t3 & a2, l2 = r2(e3);
    function u2() {
      for (var t4 = -1, r3 = arguments.length, a3 = -1, d2 = s2.length, f2 = Array(d2 + r3), p2 = this && this !== i2 && this instanceof u2 ? l2 : e3; ++a3 < d2; ) f2[a3] = s2[a3];
      for (; r3--; ) f2[a3++] = arguments[++t4];
      return n2(p2, c2 ? o3 : this, f2);
    }
    return u2;
  }
  t2.exports = o2;
}));
var uo = i(((e2, t2) => {
  var n2 = Ra(), r2 = za(), i2 = oo(), a2 = "__lodash_placeholder__", o2 = 1, s2 = 2, c2 = 4, l2 = 8, u2 = 128, d2 = 256, f2 = Math.min;
  function p2(e3, t3) {
    var p3 = e3[1], m2 = t3[1], h2 = p3 | m2, g2 = h2 < (o2 | s2 | u2), _2 = m2 == u2 && p3 == l2 || m2 == u2 && p3 == d2 && e3[7].length <= t3[8] || m2 == (u2 | d2) && t3[7].length <= t3[8] && p3 == l2;
    if (!(g2 || _2)) return e3;
    m2 & o2 && (e3[2] = t3[2], h2 |= p3 & o2 ? 0 : c2);
    var v2 = t3[3];
    if (v2) {
      var y2 = e3[3];
      e3[3] = y2 ? n2(y2, v2, t3[4]) : v2, e3[4] = y2 ? i2(e3[3], a2) : t3[4];
    }
    return v2 = t3[5], v2 && (y2 = e3[5], e3[5] = y2 ? r2(y2, v2, t3[6]) : v2, e3[6] = y2 ? i2(e3[5], a2) : t3[6]), v2 = t3[7], v2 && (e3[7] = v2), m2 & u2 && (e3[8] = e3[8] == null ? t3[8] : f2(e3[8], t3[8])), e3[9] ??= t3[9], e3[0] = t3[0], e3[1] = h2, e3;
  }
  t2.exports = p2;
}));
var fo = i(((e2, t2) => {
  var n2 = Fa(), r2 = La(), i2 = co(), a2 = so(), o2 = lo(), s2 = Wa(), c2 = uo(), l2 = Za(), u2 = no(), d2 = Un(), f2 = "Expected a function", p2 = 1, m2 = 2, h2 = 8, g2 = 16, _2 = 32, v2 = 64, y2 = Math.max;
  function b2(e3, t3, b3, x2, S2, C2, w2, T2) {
    var E2 = t3 & m2;
    if (!E2 && typeof e3 != "function") throw TypeError(f2);
    var D2 = x2 ? x2.length : 0;
    if (D2 || (t3 &= ~(_2 | v2), x2 = S2 = void 0), w2 = w2 === void 0 ? w2 : y2(d2(w2), 0), T2 = T2 === void 0 ? T2 : d2(T2), D2 -= S2 ? S2.length : 0, t3 & v2) {
      var O2 = x2, k2 = S2;
      x2 = S2 = void 0;
    }
    var A2 = E2 ? void 0 : s2(e3), j2 = [e3, t3, b3, x2, S2, O2, k2, C2, w2, T2];
    if (A2 && c2(j2, A2), e3 = j2[0], t3 = j2[1], b3 = j2[2], x2 = j2[3], S2 = j2[4], T2 = j2[9] = j2[9] === void 0 ? E2 ? 0 : e3.length : y2(j2[9] - D2, 0), !T2 && t3 & (h2 | g2) && (t3 &= ~(h2 | g2)), !t3 || t3 == p2) var M2 = r2(e3, t3, b3);
    else M2 = t3 == h2 || t3 == g2 ? i2(e3, t3, T2) : (t3 == _2 || t3 == (p2 | _2)) && !S2.length ? o2(e3, t3, b3, x2) : a2.apply(void 0, j2);
    return u2((A2 ? n2 : l2)(M2, j2), e3, t3);
  }
  t2.exports = b2;
}));
var po = i(((e2, t2) => {
  var n2 = fo(), r2 = 128;
  function i2(e3, t3, i3) {
    return t3 = i3 ? void 0 : t3, t3 = e3 && t3 == null ? e3.length : t3, n2(e3, r2, void 0, void 0, void 0, void 0, t3);
  }
  t2.exports = i2;
}));
var mo = i(((e2, t2) => {
  var n2 = ka(), r2 = 4;
  function i2(e3) {
    return n2(e3, r2);
  }
  t2.exports = i2;
}));
var ho = i(((e2, t2) => {
  var n2 = fo(), r2 = 8;
  function i2(e3, t3, a2) {
    t3 = a2 ? void 0 : t3;
    var o2 = n2(e3, r2, void 0, void 0, void 0, void 0, void 0, t3);
    return o2.placeholder = i2.placeholder, o2;
  }
  i2.placeholder = {}, t2.exports = i2;
}));
var go = i(((e2, t2) => {
  var n2 = he(), r2 = Ae(), i2 = Ji(), a2 = "[object DOMException]", o2 = "[object Error]";
  function s2(e3) {
    if (!r2(e3)) return !1;
    var t3 = n2(e3);
    return t3 == o2 || t3 == a2 || typeof e3.message == "string" && typeof e3.name == "string" && !i2(e3);
  }
  t2.exports = s2;
}));
var _o = i(((e2, t2) => {
  var n2 = ke(), r2 = Ae(), i2 = "[object WeakMap]";
  function a2(e3) {
    return r2(e3) && n2(e3) == i2;
  }
  t2.exports = a2;
}));
var vo = i(((e2, t2) => {
  var n2 = ka(), r2 = Bn(), i2 = 1;
  function a2(e3) {
    return r2(typeof e3 == "function" ? e3 : n2(e3, i2));
  }
  t2.exports = a2;
}));
var yo = i(((e2, t2) => {
  var n2 = fe(), r2 = Me(), i2 = U(), a2 = n2 ? n2.isConcatSpreadable : void 0;
  function o2(e3) {
    return i2(e3) || r2(e3) || !!(a2 && e3 && e3[a2]);
  }
  t2.exports = o2;
}));
var bo = i(((e2, t2) => {
  var n2 = yn(), r2 = yo();
  function i2(e3, t3, a2, o2, s2) {
    var c2 = -1, l2 = e3.length;
    for (a2 ||= r2, s2 ||= []; ++c2 < l2; ) {
      var u2 = e3[c2];
      t3 > 0 && a2(u2) ? t3 > 1 ? i2(u2, t3 - 1, a2, o2, s2) : n2(s2, u2) : o2 || (s2[s2.length] = u2);
    }
    return s2;
  }
  t2.exports = i2;
}));
var xo = i(((e2, t2) => {
  var n2 = bo();
  function r2(e3) {
    return e3 != null && e3.length ? n2(e3, 1) : [];
  }
  t2.exports = r2;
}));
var So = i(((e2, t2) => {
  var n2 = xo(), r2 = aa(), i2 = la();
  function a2(e3) {
    return i2(r2(e3, void 0, n2), e3 + "");
  }
  t2.exports = a2;
}));
var Co = i(((e2, t2) => {
  var n2 = fo(), r2 = So(), i2 = 256;
  t2.exports = r2(function(e3, t3) {
    return n2(e3, i2, void 0, void 0, void 0, t3);
  });
}));
var wo = i(((e2, t2) => {
  var n2 = Ge(), r2 = Ui(), i2 = U(), a2 = Ke(), o2 = Jt(), s2 = Xt(), c2 = Je();
  function l2(e3) {
    return i2(e3) ? n2(e3, s2) : a2(e3) ? [e3] : r2(o2(c2(e3)));
  }
  t2.exports = l2;
}));
var To = i(((e2, t2) => {
  t2.exports = { ary: po(), assign: ma(), clone: mo(), curry: ho(), forEach: pa(), isArray: U(), isError: go(), isFunction: _e(), isWeakMap: _o(), iteratee: vo(), keys: de(), rearg: Co(), toInteger: Un(), toPath: wo() };
}));
var Eo = i(((e2, t2) => {
  var n2 = Na(), r2 = To();
  function i2(e3, t3, i3) {
    return n2(r2, e3, t3, i3);
  }
  t2.exports = i2;
}));
var Do = i(((e2, t2) => {
  var n2 = Xi(), r2 = Yt(), i2 = dt(), a2 = ge(), o2 = Xt();
  function s2(e3, t3, s3, c2) {
    if (!a2(e3)) return e3;
    t3 = r2(t3, e3);
    for (var l2 = -1, u2 = t3.length, d2 = u2 - 1, f2 = e3; f2 != null && ++l2 < u2; ) {
      var p2 = o2(t3[l2]), m2 = s3;
      if (p2 === "__proto__" || p2 === "constructor" || p2 === "prototype") return e3;
      if (l2 != d2) {
        var h2 = f2[p2];
        m2 = c2 ? c2(h2, p2, f2) : void 0, m2 === void 0 && (m2 = a2(h2) ? h2 : i2(t3[l2 + 1]) ? [] : {});
      }
      n2(f2, p2, m2), f2 = f2[p2];
    }
    return e3;
  }
  t2.exports = s2;
}));
var Oo = i(((e2, t2) => {
  var n2 = Do();
  function r2(e3, t3, r3) {
    return e3 == null ? e3 : n2(e3, t3, r3);
  }
  t2.exports = r2;
}));
var ko = i(((e2, t2) => {
  var n2 = Eo()("set", Oo());
  n2.placeholder = Ma(), t2.exports = n2;
}));
var Ao = i(((e2, t2) => {
  function n2(e3) {
    var t3 = e3 == null ? 0 : e3.length;
    return t3 ? e3[t3 - 1] : void 0;
  }
  t2.exports = n2;
}));
var jo = i(((e2, t2) => {
  var n2 = Zt(), r2 = tt();
  function i2(e3, t3) {
    return t3.length < 2 ? e3 : n2(e3, r2(t3, 0, -1));
  }
  t2.exports = i2;
}));
var Mo = i(((e2, t2) => {
  var n2 = Yt(), r2 = Ao(), i2 = jo(), a2 = Xt(), o2 = Object.prototype.hasOwnProperty;
  function s2(e3, t3) {
    t3 = n2(t3, e3);
    var s3 = -1, c2 = t3.length;
    if (!c2) return !0;
    for (; ++s3 < c2; ) {
      var l2 = a2(t3[s3]);
      if (l2 === "__proto__" && !o2.call(e3, "__proto__") || (l2 === "constructor" || l2 === "prototype") && s3 < c2 - 1) return !1;
    }
    var u2 = i2(e3, t3);
    return u2 == null || delete u2[a2(r2(t3))];
  }
  t2.exports = s2;
}));
var No = i(((e2, t2) => {
  var n2 = Mo();
  function r2(e3, t3) {
    return e3 == null || n2(e3, t3);
  }
  t2.exports = r2;
}));
var Po = i(((e2, t2) => {
  var n2 = Eo()("unset", No());
  n2.placeholder = Ma(), t2.exports = n2;
}));
var Fo = i(((e2, t2) => {
  var n2 = Ke();
  function r2(e3, t3, r3) {
    for (var i2 = -1, a2 = e3.length; ++i2 < a2; ) {
      var o2 = e3[i2], s2 = t3(o2);
      if (s2 != null && (c2 === void 0 ? s2 === s2 && !n2(s2) : r3(s2, c2))) var c2 = s2, l2 = o2;
    }
    return l2;
  }
  t2.exports = r2;
}));
var Io = i(((e2, t2) => {
  function n2(e3, t3) {
    return e3 > t3;
  }
  t2.exports = n2;
}));
var Lo = i(((e2, t2) => {
  var n2 = Fo(), r2 = Io(), i2 = Bn();
  function a2(e3, t3) {
    return e3 && e3.length ? n2(e3, i2(t3, 2), r2) : void 0;
  }
  t2.exports = a2;
}));
var K = n(Ve());
var Yo = n(lt());
var Xo = n(pt());
var Zo = n(St());
var q = n(Qt());
var Qo = n(tn());
var $o = n(Gn());
var es = n(Qn());
var ts = n(Ti());
var ns = n(Oi());
var rs = n(Fi());
var is = n(Ii());
var as = n(fa());
var os = n(Aa());
var ss = n(ko());
var cs = n(Po());
var ls = n(_e());
var us = n(Lo());
(Ao());
var ds = "additionalProperties";
var fs = "required";
var ps = (e2, t2) => {
  let n2 = {};
  return e2.filter((e3) => {
    let r2 = t2(e3);
    return !Object.prototype.hasOwnProperty.call(n2, r2) && (n2[r2] = !0, !0);
  });
};
var ms = class {
  constructor(e2) {
    this.findOption = e2, this.schemaObject = (e3) => {
      let t2 = this.properties(e3), n2 = { type: "object", properties: t2, additionalProperties: this.findOption(t2)(ds) }, r2 = this.findOption(t2)(fs);
      return r2.length > 0 && (n2.required = r2), n2;
    }, this.properties = (e3) => Object.keys(e3).reduce((t2, n2) => (t2[n2] = this.property(e3[n2]), t2), {}), this.property = (e3) => {
      switch (typeof e3) {
        case "string":
          return { type: "string" };
        case "boolean":
          return { type: "boolean" };
        case "number":
          return Number.isInteger(e3) ? { type: "integer" } : { type: "number" };
        case "object":
          return e3 == null ? { type: "null" } : this.schemaObjectOrArray(e3);
        default:
          return {};
      }
    }, this.schemaObjectOrArray = (e3) => e3 instanceof Array ? this.schemaArray(e3) : this.schemaObject(e3), this.schemaArray = (e3) => {
      if (e3.length > 0) {
        let t2 = ps(e3.map(this.property), (e4) => JSON.stringify(e4));
        return t2.length === 1 ? { type: "array", items: t2[0] } : { type: "array", items: { oneOf: t2 } };
      }
      return { type: "array", items: {} };
    };
  }
};
var hs = (e2, t2 = {}) => new ms((e3) => (n2) => {
  switch (n2) {
    case ds:
      return !Object.prototype.hasOwnProperty.call(t2, ds) || t2[ds];
    case fs:
      return Object.prototype.hasOwnProperty.call(t2, fs) ? t2[fs](e3) : Object.keys(e3);
    default:
      return;
  }
}).schemaObject(e2);
var gs = /* @__PURE__ */ new Map();
var _s = /* @__PURE__ */ new Map();
var vs = (e2, t2) => t2 <= 1 ? e2 : e2 + t2.toString();
var ys = { createId: (e2) => {
  e2 === void 0 && (e2 = "undefined");
  let t2 = _s.get(e2);
  t2 === void 0 && (t2 = { used: /* @__PURE__ */ new Set(), next: 0 }, _s.set(e2, t2));
  let n2 = t2.next;
  for (; t2.used.has(n2) || gs.has(vs(e2, n2)); ) n2++;
  let r2 = vs(e2, n2);
  return t2.used.add(n2), t2.next = n2 + 1, gs.set(r2, { prefix: e2, index: n2 }), r2;
}, removeId: (e2) => {
  let t2 = gs.get(e2);
  if (t2 === void 0) return !1;
  gs.delete(e2);
  let n2 = _s.get(t2.prefix);
  return n2 !== void 0 && (n2.used.delete(t2.index), t2.index < n2.next && (n2.next = t2.index), n2.used.size === 0 && _s.delete(t2.prefix)), !0;
}, clearAllIds: () => {
  gs.clear(), _s.clear();
} };
var bs = (e2, t2) => {
  let n2 = e2;
  return (0, K.default)(e2) || (0, K.default)(t2) || t2.startsWith("[") || (n2 = e2 + "."), (0, K.default)(n2) ? t2 : (0, K.default)(t2) ? n2 : `${n2}${t2}`;
};
var xs = (e2) => {
  let t2 = e2.replace(/(anyOf|allOf|oneOf)\/[\d]+\//g, "").replace(/(then|else)\//g, "").split("/").map(Cs), n2 = t2[0] === "#" || t2[0] === "" ? 2 : 1;
  return (0, Zo.default)(n2, t2.length, 2).map((e3) => t2[e3]);
};
var Ss = (e2) => e2?.replace(/~/g, "~0").replace(/\//g, "~1");
var Cs = (e2) => e2?.replace(/~1/g, "/").replace(/~0/, "~");
var ws = (e2, t2) => {
  if (t2 && typeof t2.title == "string") return t2.title;
  if (typeof e2.scope == "string") {
    let t3 = e2.scope, n2 = Cs(t3.substr(t3.lastIndexOf("/") + 1));
    return (0, Yo.default)(n2);
  }
  return "";
};
var Ts = (e2, t2) => {
  let n2 = e2.label;
  return typeof n2 == "boolean" ? Es(ws(e2, t2), n2) : typeof n2 == "string" ? Es(n2, !0) : typeof n2 == "object" ? Es(typeof n2.text == "string" ? n2.text : ws(e2, t2), typeof n2.show != "boolean" || n2.show) : Es(ws(e2, t2), !0);
};
var Es = (e2, t2) => ({ text: e2, show: t2 });
var Ds = (e2, t2) => (0, K.default)(t2) ? e2 : t2.split(".").reduce((e3, t3) => {
  if (e3 && Object.prototype.hasOwnProperty.call(e3, t3)) return e3[t3];
}, e2);
var Os = (e2) => e2 === "#" || e2 === void 0 || e2 === "";
var ks = (e2, t2, n2) => As(e2, t2, { rootSchema: n2, resolutionMap: /* @__PURE__ */ new Map() });
var As = (e2, t2, n2) => {
  let r2;
  if (e2 && typeof e2.$ref == "string") {
    let i2 = js(n2.rootSchema, e2.$ref, n2);
    i2 !== void 0 && (r2 = js(i2, t2, n2));
  }
  return r2 === void 0 && (r2 = js(e2, t2, n2)), r2;
};
var js = (e2, t2, n2) => {
  let r2 = n2.resolutionMap.get(e2);
  if (r2 || (r2 = /* @__PURE__ */ new Set(), n2.resolutionMap.set(e2, r2)), r2.has(t2)) return;
  r2.add(t2);
  let i2 = Ms(e2, t2?.split("/").map(Cs), n2);
  return r2.delete(t2), i2;
};
var Ms = (e2, t2, n2) => {
  if (!t2 || t2.length === 0) return e2;
  if ((0, K.default)(e2)) return;
  let r2 = Ns(e2, t2, n2);
  if (r2 !== void 0) return r2;
  let i2 = [].concat(e2.oneOf ?? [], e2.allOf ?? [], e2.anyOf ?? [], e2.then ?? [], e2.else ?? []);
  for (let e3 of i2) {
    let r3 = e3;
    e3 && typeof e3.$ref == "string" && (r3 = As(n2.rootSchema, e3.$ref, n2));
    let i3 = Ms(r3, t2, n2);
    if (i3) return i3;
  }
};
var Ns = (e2, t2, n2) => {
  if (!t2 || t2.length === 0) return e2;
  if ((0, K.default)(e2)) return;
  let r2 = Ps(e2, t2);
  return r2.schema && typeof r2.schema.$ref == "string" && (r2.schema = As(n2.rootSchema, r2.schema.$ref, n2)), Ms(r2.schema, r2.remainingPathSegments, n2);
};
var Ps = (e2, t2) => {
  if (!t2 || t2.length === 0) return { schema: e2, remainingPathSegments: [] };
  if ((0, K.default)(e2)) return { schema: void 0, remainingPathSegments: t2 };
  let [n2, ...r2] = t2;
  return Os(n2) ? Ps(e2, r2) : { schema: (0, q.default)(e2, n2), remainingPathSegments: r2, resolvedSegment: n2 };
};
var Fs;
(function(e2) {
  e2.HIDE = "HIDE", e2.SHOW = "SHOW", e2.ENABLE = "ENABLE", e2.DISABLE = "DISABLE", e2.READONLY = "READONLY", e2.WRITABLE = "WRITABLE";
})(Fs ||= {});
var Is = (e2, t2) => {
  if (!Vs(e2)) return t2 ?? "";
  let n2 = xs(e2.scope);
  return (0, K.default)(n2) ? t2 ?? "" : bs(t2, n2.join("."));
};
var Ls = (e2) => typeof e2 == "object" && !!e2 && typeof e2.i18n == "string";
var Rs = (e2) => e2.type === "Group";
var zs = (e2) => e2.elements !== void 0;
var Bs = (e2) => !!e2 && typeof e2 == "object";
var Vs = (e2) => Bs(e2) && typeof e2.scope == "string";
var Hs = (e2) => !!e2 && typeof e2 == "object";
var Us = (e2) => e2.type === "OR";
var Ws = (e2) => e2.type === "AND";
var Gs = (e2) => e2.type === "LEAF";
var Ks = (e2) => (0, Qo.default)(e2, "schema");
var qs = (e2) => (0, Qo.default)(e2, "validate") && typeof e2.validate == "function";
var Js = (e2, t2) => Is(e2, t2);
var Ys = (e2, t2, n2, r2, i2, a2) => {
  if (Ws(n2)) return n2.conditions.reduce((n3, o2) => n3 && Ys(e2, t2, o2, r2, i2, a2), !0);
  if (Us(n2)) return n2.conditions.reduce((n3, o2) => n3 || Ys(e2, t2, o2, r2, i2, a2), !1);
  if (Gs(n2)) return Ds(e2, Js(n2, r2)) === n2.expectedValue;
  if (Ks(n2)) {
    let t3 = Ds(e2, Js(n2, r2));
    return n2.failWhenUndefined && t3 === void 0 ? !1 : i2.validate(n2.schema, t3);
  }
  if (qs(n2)) {
    let i3 = { data: Ds(e2, Js(n2, r2)), fullData: e2, path: r2, uischemaElement: t2, config: a2 };
    return n2.validate(i3);
  }
  return !0;
};
var Xs = (e2, t2, n2, r2, i2) => {
  let a2 = e2.rule.condition;
  return Ys(t2, e2, a2, n2, r2, i2);
};
var Zs = (e2, t2, n2 = void 0, r2, i2) => {
  let a2 = Xs(e2, t2, n2, r2, i2);
  switch (e2.rule.effect) {
    case Fs.HIDE:
      return !a2;
    case Fs.SHOW:
      return a2;
    default:
      return !0;
  }
};
var Qs = (e2, t2, n2 = void 0, r2, i2) => {
  let a2 = Xs(e2, t2, n2, r2, i2);
  switch (e2.rule.effect) {
    case Fs.DISABLE:
      return !a2;
    case Fs.ENABLE:
      return a2;
    default:
      return !0;
  }
};
var $s = (e2, t2, n2 = void 0, r2, i2) => {
  let a2 = Xs(e2, t2, n2, r2, i2);
  switch (e2.rule.effect) {
    case Fs.WRITABLE:
      return !a2;
    case Fs.READONLY:
      return a2;
    default:
      return !1;
  }
};
var ec = (e2) => !(!e2.rule || e2.rule.effect !== Fs.SHOW && e2.rule.effect !== Fs.HIDE);
var tc = (e2) => !(!e2.rule || e2.rule.effect !== Fs.ENABLE && e2.rule.effect !== Fs.DISABLE);
var nc = (e2) => !(!e2.rule || e2.rule.effect !== Fs.READONLY && e2.rule.effect !== Fs.WRITABLE);
var rc = (e2, t2, n2 = void 0, r2, i2) => !e2.rule || Zs(e2, t2, n2, r2, i2);
var ic = (e2, t2, n2 = void 0, r2, i2) => !e2.rule || Qs(e2, t2, n2, r2, i2);
var ac = (e2, t2, n2 = void 0, r2, i2) => e2.rule ? $s(e2, t2, n2, r2, i2) : !1;
var oc = (e2) => {
  if (e2 && typeof e2 == "object" && "properties" in e2 && e2.properties) return (0, $o.default)(Object.keys(e2.properties), (t2) => {
    let n2 = e2.properties[t2];
    return n2 && typeof n2 == "object" && "type" in n2 && (n2.type === "string" || n2.type === "number" || n2.type === "integer");
  });
};
var sc = (e2) => !!e2 && Object.prototype.hasOwnProperty.call(e2, "oneOf") && e2.oneOf && e2.oneOf.every((e3) => e3.const !== void 0);
var cc = (e2) => !!e2 && typeof e2 == "object" && (Object.prototype.hasOwnProperty.call(e2, "enum") || Object.prototype.hasOwnProperty.call(e2, "const"));
var lc = (e2, t2) => {
  let n2 = e2.toISOString();
  return t2 === "date-time" ? n2 : t2 === "date" ? n2.split("T")[0] : t2 === "time" ? n2.split("T")[1].split(".")[0] : n2;
};
var uc = (e2, t2) => (0, es.default)(dc(e2), t2);
var dc = (e2) => {
  if ((0, K.default)(e2)) return [];
  if (!(0, K.default)(e2.type) && typeof e2.type == "string") return [e2.type];
  if (Array.isArray(e2.type)) return e2.type;
  if (!(0, K.default)(e2.properties) || !(0, K.default)(e2.additionalProperties)) return ["object"];
  if (!(0, K.default)(e2.items)) return ["array"];
  if (!(0, K.default)(e2.enum)) {
    let t2 = /* @__PURE__ */ new Set();
    return e2.enum.forEach((e3) => {
      typeof e3 == "string" ? t2.add("string") : dc(e3).forEach((e4) => t2.add(e4));
    }), Array.from(t2);
  }
  if (!(0, K.default)(e2.allOf)) {
    let t2 = (0, $o.default)(e2.allOf, (e3) => dc(e3).length !== 0);
    if (t2) return dc(t2);
  }
  return [];
};
var fc = { schema: ks, data: Ds };
var pc = (e2) => {
  let t2 = new ts.default({ allErrors: !0, verbose: !0, strict: !1, addUsedSchema: !1, ...e2 });
  return (0, ns.default)(t2), t2;
};
var mc = (e2, t2) => e2 === void 0 || e2(t2) ? [] : e2.errors;
var hc = (e2) => {
  switch (e2.keyword) {
    case "required":
    case "dependencies":
      return e2.params.missingProperty;
    case "additionalProperties":
      return e2.params.additionalProperty;
    default:
      return;
  }
};
var gc = (e2) => {
  let t2 = e2.dataPath || e2.instancePath || "";
  t2 = t2.replace(/\//g, ".");
  let n2 = hc(e2);
  return n2 !== void 0 && (t2 = `${t2}.${n2}`), t2 = t2.replace(/^\./, ""), t2 = Cs(t2), t2;
};
var _c = (e2, t2, n2) => (r2) => {
  let i2 = (0, rs.default)(r2, (e3) => e3.keyword === "oneOf" || e3.keyword === "anyOf").map((e3) => gc(e3));
  return (0, rs.default)(r2, (r3) => {
    if (yc.indexOf(r3.keyword) !== -1 && !sc(r3.parentSchema)) return !1;
    let a2 = n2(gc(r3)), o2 = r3.parentSchema;
    return a2 && !vc(o2) && !sc(o2) && i2.findIndex((t3) => e2.startsWith(t3)) !== -1 && (a2 &&= (0, is.default)(o2, t2)), a2;
  });
};
var vc = (e2) => e2?.type === "object" || !!e2?.properties;
var yc = ["additionalProperties", "allOf", "anyOf", "oneOf"];
var bc = (e2) => e2 == null ? "" : e2.join(`
`);
var xc = (e2) => ({ type: e2, elements: [] });
var Sc = (e2) => ({ type: "Control", scope: e2 });
var Cc = (e2, t2) => {
  if (!(0, K.default)(e2) && !zs(e2)) {
    let n2 = xc(t2);
    return n2.elements.push(e2), n2;
  }
  return e2;
};
var wc = (e2, t2) => {
  if (!(0, K.default)(t2)) {
    let n2 = (0, Yo.default)(t2);
    if (Rs(e2)) e2.label = n2;
    else {
      let t3 = { type: "Label", text: n2 };
      e2.elements.push(t3);
    }
  }
};
var Tc = (e2) => !(0, K.default)(e2) && (!(0, K.default)(e2.oneOf) || !(0, K.default)(e2.anyOf) || !(0, K.default)(e2.allOf));
var Ec = (e2, t2, n2, r2, i2, a2) => {
  if (!(0, K.default)(e2) && e2.$ref !== void 0) return Ec(ks(a2, e2.$ref, a2), t2, n2, r2, i2, a2);
  if (Tc(e2)) {
    let e3 = Sc(n2);
    return t2.push(e3), e3;
  }
  let o2 = dc(e2);
  if (o2.length === 0) return null;
  let s2 = o2.filter((e3) => e3 !== "null"), c2 = s2.length > 0 ? s2 : o2;
  if (c2.length > 1) {
    let e3 = Sc(n2);
    return t2.push(e3), e3;
  }
  if (n2 === "#" && c2[0] === "object") {
    let o3 = xc(i2);
    if (t2.push(o3), e2.properties && (0, Xo.default)(e2.properties).length > 1 && wc(o3, r2), !(0, K.default)(e2.properties)) {
      let t3 = n2 + "/properties";
      Object.keys(e2.properties).map((n3) => {
        let r3 = e2.properties[n3], s3 = `${t3}/${Ss(n3)}`;
        r3.$ref !== void 0 && (r3 = ks(a2, r3.$ref, a2)), Ec(r3, o3.elements, s3, n3, i2, a2);
      });
    }
    return o3;
  }
  switch (c2[0]) {
    case "object":
    case "array":
    case "string":
    case "number":
    case "integer":
    case "null":
    case "boolean": {
      let e3 = Sc(n2);
      return t2.push(e3), e3;
    }
    default:
      throw Error("Unknown type: " + JSON.stringify(e2));
  }
};
var Dc = (e2, t2 = "VerticalLayout", n2 = "#", r2 = e2) => Cc(Ec(e2, [], n2, "", t2, r2), t2);
var Oc = { jsonSchema: hs, uiSchema: Dc, controlElement: Sc };
var kc = "jsonforms/INIT";
var Ac = "jsonforms/UPDATE_CORE";
var jc = "jsonforms/SET_AJV";
var Mc = "jsonforms/UPDATE";
var Nc = "jsonforms/UPDATE_ERRORS";
var Pc = "jsonforms/VALIDATE";
var Fc = "jsonforms/ADD_RENDERER";
var Ic = "jsonforms/REMOVE_RENDERER";
var Lc = "jsonforms/ADD_CELL";
var Rc = "jsonforms/REMOVE_CELL";
var zc = "jsonforms/SET_CONFIG";
var Bc = "jsonforms/ADD_UI_SCHEMA";
var Vc = "jsonforms/REMOVE_UI_SCHEMA";
var Hc = "jsonforms/SET_SCHEMA";
var Uc = "jsonforms/SET_UISCHEMA";
var Wc = "jsonforms/SET_VALIDATION_MODE";
var Gc = "jsonforms/SET_LOCALE";
var Kc = "jsonforms/SET_TRANSLATOR";
var qc = "jsonforms/UPDATE_I18N";
var Jc = "jsonforms/ADD_DEFAULT_DATA";
var Yc = "jsonforms/REMOVE_DEFAULT_DATA";
var Xc = (e2) => {
  if (!("type" in e2) || typeof e2.type != "string") return !1;
  switch (e2.type) {
    case "ADD":
      return "values" in e2 && Array.isArray(e2.values) && e2.values.length > 0;
    case "REMOVE":
      return "indices" in e2 && Array.isArray(e2.indices) && e2.indices.length > 0 && e2.indices.every((e3) => typeof e3 == "number");
    case "MOVE":
      return "moves" in e2 && Array.isArray(e2.moves) && e2.moves.length > 0 && e2.moves.every((e3) => typeof e3 == "object" && !!e3 && "from" in e3 && "to" in e3 && typeof e3.from == "number" && typeof e3.to == "number");
    default:
      return !1;
  }
};
var Zc = (e2, t2 = hs(e2), n2, r2) => ({ type: kc, data: e2, schema: t2, uischema: typeof n2 == "object" ? n2 : Dc(t2), options: r2 });
var Qc = (e2, t2, n2, r2) => ({ type: Ac, data: e2, schema: t2, uischema: n2, options: r2 });
var $c = (e2, t2) => ({ type: Jc, schemaPath: e2, data: t2 });
var el = (e2) => ({ type: Yc, schemaPath: e2 });
var tl = (e2) => ({ type: jc, ajv: e2 });
var nl = (e2, t2, n2) => ({ type: Mc, path: e2, updater: t2, context: n2 });
var rl = Object.freeze({ __proto__: null, INIT: kc, UPDATE_CORE: Ac, SET_AJV: jc, UPDATE_DATA: Mc, UPDATE_ERRORS: Nc, VALIDATE: Pc, ADD_RENDERER: Fc, REMOVE_RENDERER: Ic, ADD_CELL: Lc, REMOVE_CELL: Rc, SET_CONFIG: zc, ADD_UI_SCHEMA: Bc, REMOVE_UI_SCHEMA: Vc, SET_SCHEMA: Hc, SET_UISCHEMA: Uc, SET_VALIDATION_MODE: Wc, SET_LOCALE: Gc, SET_TRANSLATOR: Kc, UPDATE_I18N: qc, ADD_DEFAULT_DATA: Jc, REMOVE_DEFAULT_DATA: Yc, isUpdateArrayContext: Xc, init: Zc, updateCore: Qc, registerDefaultData: $c, unregisterDefaultData: el, setAjv: tl, update: nl, updateErrors: (e2) => ({ type: Nc, errors: e2 }), registerRenderer: (e2, t2) => ({ type: Fc, tester: e2, renderer: t2 }), registerCell: (e2, t2) => ({ type: Lc, tester: e2, cell: t2 }), unregisterCell: (e2, t2) => ({ type: Rc, tester: e2, cell: t2 }), unregisterRenderer: (e2, t2) => ({ type: Ic, tester: e2, renderer: t2 }), setConfig: (e2) => ({ type: zc, config: e2 }), setValidationMode: (e2) => ({ type: Wc, validationMode: e2 }), registerUISchema: (e2, t2) => ({ type: Bc, tester: e2, uischema: t2 }), unregisterUISchema: (e2) => ({ type: Vc, tester: e2 }), setLocale: (e2) => ({ type: Gc, locale: e2 }), setSchema: (e2) => ({ type: Hc, schema: e2 }), setTranslator: (e2, t2) => ({ type: Kc, translator: e2, errorTranslator: t2 }), updateI18n: (e2, t2, n2) => ({ type: qc, locale: e2, translator: t2, errorTranslator: n2 }), setUISchema: (e2) => ({ type: Uc, uischema: e2 }) });
var il = { restrict: !1, trim: !1, showUnfocusedDescription: !1, hideRequiredAsterisk: !1, separateReadonlyFromDisabled: !1 };
var al = (e2 = {}) => (0, as.default)({}, il, e2);
var ol = (e2 = al(), t2) => t2.type === zc ? al(t2.config) : e2;
var sl = { data: {}, schema: {}, uischema: void 0, errors: [], validator: void 0, ajv: void 0, validationMode: "ValidateAndShow", additionalErrors: [] };
var cl = (e2, t2) => t2 && ll(t2.options) ? t2.options.validationMode : e2.validationMode;
var ll = (e2) => e2 ? e2.validationMode !== void 0 : !1;
var ul = (e2) => e2 ? e2.additionalErrors !== void 0 : !1;
var dl = (e2, t2) => t2 && ul(t2.options) ? t2.options.additionalErrors : e2.additionalErrors;
var fl = (e2, t2) => {
  if (t2) {
    if (pl(t2.options)) return t2.options.ajv;
    if (t2.options !== void 0 && (0, ls.default)(t2.options.compile)) return t2.options;
  }
  return e2.ajv ? e2.ajv : pc();
};
var pl = (e2) => e2 ? e2.ajv !== void 0 : !1;
var ml = (e2 = sl, t2) => {
  switch (t2.type) {
    case kc: {
      let n2 = fl(e2, t2), r2 = cl(e2, t2), i2 = r2 === "NoValidation" ? void 0 : n2.compile(t2.schema), a2 = mc(i2, t2.data), o2 = dl(e2, t2);
      return { ...e2, data: t2.data, schema: t2.schema, uischema: t2.uischema, additionalErrors: o2, errors: a2, validator: i2, ajv: n2, validationMode: r2 };
    }
    case Ac: {
      let n2 = fl(e2, t2), r2 = cl(e2, t2), i2 = e2.validator, a2 = e2.errors;
      e2.schema !== t2.schema || e2.validationMode !== r2 || e2.ajv !== n2 ? (i2 = r2 === "NoValidation" ? void 0 : n2.compile(t2.schema), a2 = mc(i2, t2.data)) : e2.data !== t2.data && (a2 = mc(i2, t2.data));
      let o2 = dl(e2, t2);
      return e2.data !== t2.data || e2.schema !== t2.schema || e2.uischema !== t2.uischema || e2.ajv !== n2 || e2.errors !== a2 || e2.validator !== i2 || e2.validationMode !== r2 || e2.additionalErrors !== o2 ? { ...e2, data: t2.data, schema: t2.schema, uischema: t2.uischema, ajv: n2, errors: (0, is.default)(a2, e2.errors) ? e2.errors : a2, validator: i2, validationMode: r2, additionalErrors: o2 } : e2;
    }
    case jc: {
      let n2 = t2.ajv, r2 = e2.validationMode === "NoValidation" ? void 0 : n2.compile(e2.schema), i2 = mc(r2, e2.data);
      return { ...e2, validator: r2, errors: i2 };
    }
    case Hc: {
      let n2 = t2.schema && e2.ajv && e2.validationMode !== "NoValidation" ? e2.ajv.compile(t2.schema) : e2.validator, r2 = mc(n2, e2.data);
      return { ...e2, validator: n2, schema: t2.schema, errors: r2 };
    }
    case Uc:
      return { ...e2, uischema: t2.uischema };
    case Mc:
      if (t2.path === void 0 || t2.path === null) return e2;
      if (t2.path === "") {
        let n2 = t2.updater((0, os.default)(e2.data)), r2 = mc(e2.validator, n2);
        return { ...e2, data: n2, errors: r2 };
      }
      {
        let n2 = (0, q.default)(e2.data, t2.path), r2 = t2.updater((0, os.default)(n2)), i2;
        i2 = r2 === void 0 ? (0, cs.default)(t2.path, e2.data === void 0 ? {} : e2.data) : (0, ss.default)(t2.path, r2, e2.data === void 0 ? {} : e2.data);
        let a2 = mc(e2.validator, i2);
        return { ...e2, data: i2, errors: a2 };
      }
    case Nc:
      return { ...e2, errors: t2.errors };
    case Wc:
      if (e2.validationMode === t2.validationMode) return e2;
      if (t2.validationMode === "NoValidation") {
        let n2 = mc(void 0, e2.data);
        return { ...e2, errors: n2, validationMode: t2.validationMode };
      }
      if (e2.validationMode === "NoValidation") {
        let n2 = e2.ajv.compile(e2.schema), r2 = mc(n2, e2.data);
        return { ...e2, validator: n2, errors: r2, validationMode: t2.validationMode };
      }
      return { ...e2, validationMode: t2.validationMode };
    default:
      return e2;
  }
};
var J;
(function(e2) {
  e2.addTooltip = "addTooltip", e2.addAriaLabel = "addAriaLabel", e2.removeTooltip = "removeTooltip", e2.upAriaLabel = "upAriaLabel", e2.downAriaLabel = "downAriaLabel", e2.noSelection = "noSelection", e2.removeAriaLabel = "removeAriaLabel", e2.noDataMessage = "noDataMessage", e2.deleteDialogTitle = "deleteDialogTitle", e2.deleteDialogMessage = "deleteDialogMessage", e2.deleteDialogAccept = "deleteDialogAccept", e2.deleteDialogDecline = "deleteDialogDecline", e2.up = "up", e2.down = "down";
})(J ||= {});
var hl = [{ key: J.addTooltip, default: (e2) => e2 ? `Add to ${e2}` : "Add" }, { key: J.addAriaLabel, default: (e2) => e2 ? `Add to ${e2} button` : "Add button" }, { key: J.removeTooltip, default: () => "Delete" }, { key: J.removeAriaLabel, default: () => "Delete button" }, { key: J.upAriaLabel, default: () => "Move item up" }, { key: J.up, default: () => "Up" }, { key: J.down, default: () => "Down" }, { key: J.downAriaLabel, default: () => "Move item down" }, { key: J.noDataMessage, default: () => "No data" }, { key: J.noSelection, default: () => "No selection" }, { key: J.deleteDialogTitle, default: () => "Confirm Deletion" }, { key: J.deleteDialogMessage, default: () => "Are you sure you want to delete the selected entry?" }, { key: J.deleteDialogAccept, default: () => "Yes" }, { key: J.deleteDialogDecline, default: () => "No" }];
var gl;
(function(e2) {
  e2.clearDialogTitle = "clearDialogTitle", e2.clearDialogMessage = "clearDialogMessage", e2.clearDialogAccept = "clearDialogAccept", e2.clearDialogDecline = "clearDialogDecline";
})(gl ||= {});
var _l = [{ key: gl.clearDialogTitle, default: () => "Clear form?" }, { key: gl.clearDialogMessage, default: () => "Your data will be cleared. Do you want to proceed?" }, { key: gl.clearDialogAccept, default: () => "Yes" }, { key: gl.clearDialogDecline, default: () => "No" }];
var vl = (e2, t2) => Ls(t2) ? t2.i18n : e2?.i18n ?? void 0;
var yl = (e2) => e2?.split(".").filter((e3) => !/^\d+$/.test(e3)).join(".") || "root";
var bl = (e2, t2, n2) => vl(e2, t2) ?? yl(n2);
var xl = (e2, t2, n2, r2) => `${bl(e2, t2, n2)}.${r2}`;
var Sl = (e2, t2) => `${e2}.${t2}`;
var Cl = /* @__PURE__ */ ((e2) => (t2, n2, r2) => {
  let i2 = e2(t2, n2, r2);
  return i2 === void 0 ? n2 : i2;
})((e2, t2) => t2);
var wl = (e2, t2, n2) => {
  let r2 = t2(xl(e2.parentSchema, n2, gc(e2), `error.${e2.keyword}`), void 0, { error: e2 });
  if (r2 !== void 0) return r2;
  let i2 = t2(`error.${e2.keyword}`, void 0, { error: e2 });
  if (i2 !== void 0) return i2;
  let a2 = t2(e2.message, void 0, { error: e2 });
  return a2 === void 0 ? e2.keyword === "required" && e2.message?.startsWith("must have required property") ? t2("is a required property", "is a required property", { error: e2 }) : e2.message : a2;
};
var Tl = (e2, t2, n2, r2, i2, a2) => {
  if (e2.length > 0 && n2) {
    let t3 = n2(xl(r2, i2, a2, "error.custom"), void 0, { schema: r2, uischema: i2, path: a2, errors: e2 });
    if (t3 !== void 0) return t3;
  }
  return bc(e2.map((e3) => t2(e3, n2, i2)));
};
var El = (e2, t2) => {
  if (e2.label === !1 || (e2.label === void 0 || e2.label === null || e2.label === !0) && !Ls(e2)) return;
  let n2 = typeof e2.label == "string" ? e2.label : JSON.stringify(e2.label), r2 = vl(void 0, e2);
  return t2(typeof r2 == "string" ? `${r2}.label` : n2, n2, { uischema: e2 });
};
var Dl = (e2, t2, n2, r2) => {
  let i2 = {};
  return t2.forEach((t3) => {
    let a2 = Sl(n2, t3.key);
    i2[t3.key] = e2(a2, t3.default(r2));
  }), i2;
};
var Ol = (e2, t2, n2, r2) => {
  let i2 = {};
  return t2.forEach((t3) => {
    let a2 = Sl(n2, t3.key);
    i2[t3.key] = e2(a2, t3.default(r2));
  }), i2;
};
var kl = (e2) => e2 === void 0 ? Cl : e2.translate;
var Al = (e2) => e2 === void 0 ? wl : e2.translateError;
var jl = () => (e2) => kl((0, q.default)(e2, "jsonforms.i18n"));
var Ml = () => (e2) => Al((0, q.default)(e2, "jsonforms.i18n"));
var Nl = { locale: "en", translate: Cl, translateError: wl };
var Pl = (e2 = Nl, t2) => {
  switch (t2.type) {
    case qc: {
      let n2 = t2.locale ?? Nl.locale, r2 = t2.translator ?? Nl.translate, i2 = t2.errorTranslator ?? Nl.translateError;
      return n2 !== e2.locale || r2 !== e2.translate || i2 !== e2.translateError ? { ...e2, locale: n2, translate: r2, translateError: i2 } : e2;
    }
    case Kc:
      return { ...e2, translate: t2.translator ?? Cl, translateError: t2.errorTranslator ?? wl };
    case Gc:
      return { ...e2, locale: t2.locale ?? navigator.languages[0] };
    default:
      return e2;
  }
};
var Fl = (e2) => !(0, K.default)(e2) && e2.scope !== void 0;
var Il = (e2) => (t2, n2, r2) => {
  if ((0, K.default)(t2) || !Fl(t2) || (0, K.default)(n2)) return !1;
  let i2 = t2.scope;
  if ((0, K.default)(i2)) return !1;
  let a2 = n2;
  return uc(n2, "object") && (a2 = ks(n2, i2, r2?.rootSchema)), a2 !== void 0 && e2(a2, r2?.rootSchema);
};
var Ll = (e2, t2) => (n2, r2, i2) => {
  if ((0, K.default)(n2) || !Fl(n2)) return !1;
  let a2 = n2.scope, o2 = r2;
  return uc(r2, "object") && (o2 = ks(r2, a2, i2?.rootSchema)), o2 = (0, q.default)(o2, e2), o2 !== void 0 && t2(o2, i2?.rootSchema);
};
var Rl = (e2) => Il((t2) => !(0, K.default)(t2) && uc(t2, e2));
var zl = (e2) => Il((t2) => !(0, K.default)(t2) && t2.format === e2 && uc(t2, "string"));
var Bl = (e2) => (t2) => !(0, K.default)(t2) && t2.type === e2;
var Vl = (e2, t2) => (n2) => {
  if ((0, K.default)(n2)) return !1;
  let r2 = n2.options;
  return !(0, K.default)(r2) && r2[e2] === t2;
};
var Y = (...e2) => (t2, n2, r2) => e2.reduce((e3, i2) => e3 && i2(t2, n2, r2), !0);
var Hl = (...e2) => (t2, n2, r2) => e2.reduce((e3, i2) => e3 || i2(t2, n2, r2), !1);
var X = (e2, t2) => (n2, r2, i2) => t2(n2, r2, i2) ? e2 : -1;
var Ul = Y(Bl("Control"), Rl("boolean"));
var Wl = Y(Bl("Control"), Rl("object"));
var Gl = Y(Bl("Control"), Il((e2) => Object.prototype.hasOwnProperty.call(e2, "oneOf")));
var Kl = Y(Bl("Control"), Il((e2) => cc(e2)));
var ql = Y(Bl("Control"), Il((e2) => sc(e2)));
var Jl = Y(Bl("Control"), Rl("integer"));
var Yl = Y(Bl("Control"), Rl("number"));
var Xl = Y(Bl("Control"), Rl("string"));
var Zl = Y(Bl("Control"), Vl("multi", !0));
var Ql = Y(Bl("Control"), Hl(zl("date"), Vl("format", "date")));
var $l = Y(Bl("Control"), Hl(zl("time"), Vl("format", "time")));
var eu = Y(Bl("Control"), Hl(zl("date-time"), Vl("format", "date-time")));
(Rl("number"));
(Rl("integer"));
(Rl("integer"));
var tu = (e2) => e2.type === "Categorization";
var nu = (e2) => e2.type === "Category";
var ru = (e2) => !(0, K.default)(e2.elements) && e2.elements.map((e3) => tu(e3) ? ru(e3) : nu(e3)).reduce((e3, t2) => e3 && t2, !0);
var iu = (e2) => ru(e2);
var au = (e2) => (t2, n2, r2) => {
  let i2 = (0, us.default)(e2, (e3) => e3.tester(t2, n2, r2));
  if (i2 !== void 0 && i2.tester(t2, n2, r2) !== -1) return i2.uischema;
};
var ou = (e2, t2, n2, r2, i2 = "VerticalLayout", a2, o2) => {
  if (a2 && a2.options && a2.options.detail) {
    if (typeof a2.options.detail == "string") {
      if (a2.options.detail.toUpperCase() === "GENERATE") return typeof i2 == "function" ? i2() : Oc.uiSchema(t2, i2, void 0, o2);
    } else if (typeof a2.options.detail == "object" && a2.options.detail.type && typeof a2.options.detail.type == "string") return a2.options.detail;
  }
  let s2 = au(e2)(t2, n2, r2);
  return s2 === void 0 ? typeof i2 == "function" ? i2() : Oc.uiSchema(t2, i2, "#", o2) : s2;
};
var su = (e2, t2, n2) => n2(e2, t2);
var cu = (e2, t2, n2) => (r2) => {
  let i2 = r2.errors ?? [], a2 = r2.additionalErrors ?? [];
  return _c(e2, t2, n2)(r2.validationMode === "ValidateAndHide" ? a2 : [...i2, ...a2]);
};
var lu = (e2, t2) => cu(e2, t2, (t3) => t3 === e2);
var uu = (e2, t2) => cu(e2, t2, (t3) => t3.startsWith(e2 + "."));
var du = (e2, t2) => (n2) => lu(e2, t2)(n2.jsonforms.core);
var fu = (e2, t2) => (n2) => uu(e2, t2)(n2.jsonforms.core);
var pu = (e2) => bu((0, q.default)(e2, "jsonforms.core"));
var mu = (e2) => xu((0, q.default)(e2, "jsonforms.core"));
var hu = (e2) => Su((0, q.default)(e2, "jsonforms.core"));
var gu = (e2) => Cu((0, q.default)(e2, "jsonforms.core"));
var _u = (e2) => (0, q.default)(e2, "jsonforms.renderers");
var vu = (e2) => (0, q.default)(e2, "jsonforms.cells");
var yu = (e2) => (0, q.default)(e2, "jsonforms.uischemas");
var bu = (e2) => (0, q.default)(e2, "data");
var xu = (e2) => (0, q.default)(e2, "schema");
var Su = (e2) => (0, q.default)(e2, "uischema");
var Cu = (e2) => (0, q.default)(e2, "ajv");
var wu = (e2) => e2.jsonforms.config;
var Tu = (e2, t2, n2, r2, i2, a2) => {
  if (!a2?.separateReadonlyFromDisabled && e2?.jsonforms?.readonly) return !1;
  if (n2 && tc(n2)) return ic(n2, i2, t2?.path, gu(e2), a2);
  if (!a2?.separateReadonlyFromDisabled) {
    if (typeof n2?.options?.readonly == "boolean") return !n2.options.readonly;
    if (typeof n2?.options?.readOnly == "boolean") return !n2.options.readOnly;
    if (typeof a2?.readonly == "boolean") return !a2.readonly;
    if (typeof a2?.readOnly == "boolean") return !a2.readOnly;
    if (r2?.readOnly === !0) return !1;
  }
  return typeof t2?.enabled != "boolean" || t2.enabled;
};
var Eu = (e2, t2, n2, r2, i2, a2) => e2?.jsonforms?.readonly ? !0 : n2 && nc(n2) ? ac(n2, i2, t2?.path, gu(e2), a2) : typeof n2?.options?.readonly == "boolean" ? n2.options.readonly : typeof n2?.options?.readOnly == "boolean" ? n2.options.readOnly : typeof a2?.readonly == "boolean" ? a2.readonly : typeof a2?.readOnly == "boolean" ? a2.readOnly : r2?.readOnly === !0 || typeof t2?.readonly == "boolean" && t2.readonly;
var Du = (e2, t2, n2) => {
  let r2 = t2 + n2;
  if (r2 < 0 || r2 >= e2.length) return;
  let i2 = [t2, r2].sort((e3, t3) => e3 - t3);
  e2.splice(i2[0], 2, e2[i2[1]], e2[i2[0]]);
};
var Ou = (e2, t2) => {
  Du(e2, t2, -1);
};
var ku = (e2, t2) => {
  Du(e2, t2, 1);
};
var Au = (e2, t2, n2) => {
  let r2 = t2.split("/"), i2 = Cs(r2[r2.length - 1]), a2 = r2.slice(0, r2.length - 2).join("/"), o2 = fc.schema(e2, a2, n2);
  return o2 !== void 0 && o2.required !== void 0 && o2.required.indexOf(i2) !== -1;
};
var ju = (e2, t2) => {
  let n2 = Mu(e2, t2);
  return n2 === void 0 ? {} : n2;
};
var Mu = (e2, t2) => {
  let n2 = typeof e2.$ref == "string" ? fc.schema(t2, e2.$ref, t2) : e2;
  if (n2.default !== void 0) return Pu(n2, t2);
  if (uc(n2, "string")) return n2.format === "date-time" || n2.format === "date" || n2.format === "time" ? lc(/* @__PURE__ */ new Date(), n2.format) : "";
  if (uc(n2, "integer") || uc(n2, "number")) return 0;
  if (uc(n2, "boolean")) return !1;
  if (uc(n2, "array")) return [];
  if (uc(n2, "object")) return Pu(n2, t2);
  if (uc(n2, "null")) return null;
  for (let n3 of ["oneOf", "anyOf", "allOf"]) if (e2[n3] && Array.isArray(e2[n3])) {
    let r2 = Nu(e2[n3], t2);
    if (r2 !== void 0) return r2;
  }
};
var Nu = (e2, t2) => {
  if (e2.length > 0) for (let n2 of e2) {
    let e3 = Mu(n2, t2);
    if (e3 !== void 0) return e3;
  }
};
var Pu = (e2, t2) => {
  if (uc(e2, "object") && e2.default === void 0) {
    let n2 = {};
    for (let r2 in e2.properties) {
      let i2 = e2.properties[r2], a2 = i2.$ref ? fc.schema(t2, i2.$ref, t2) : i2;
      a2 && a2.default !== void 0 && (n2[r2] = (0, os.default)(a2.default));
    }
    return e2.allOf && Array.isArray(e2.allOf) && e2.allOf.forEach((e3) => {
      if (e3 && e3.properties) for (let r2 in e3.properties) {
        let i2 = e3.properties[r2], a2 = i2.$ref ? fc.schema(t2, i2.$ref, t2) : i2;
        a2 && a2.default !== void 0 && (n2[r2] = (0, os.default)(a2.default));
      }
    }), n2;
  }
  return (0, os.default)(e2.default);
};
var Fu = (e2, t2, n2, r2) => t2 === void 0 || t2 !== void 0 && !e2 || !r2 && !n2;
var Iu = (e2, t2, n2) => {
  let r2 = typeof e2 == "string" ? e2 : JSON.stringify(e2);
  return t2 && (r2 = t2(n2 ? `${n2}.${r2}` : r2, r2)), { label: r2, value: e2 };
};
var Lu = (e2, t2, n2) => {
  let r2 = e2.title ?? (typeof e2.const == "string" ? e2.const : JSON.stringify(e2.const));
  return t2 && (r2 = e2.i18n ? t2(e2.i18n, r2, { schema: e2 }) : t2(n2 ? `${n2}.${r2}` : r2, r2, { schema: e2 })), { label: r2, value: e2.const };
};
var Ru = (e2, t2) => {
  let { uischema: n2 } = t2, r2 = pu(e2), i2 = Is(n2, t2.path), a2 = wu(e2), o2 = t2.visible === void 0 || ec(n2) ? rc(n2, r2, t2.path, gu(e2), a2) : t2.visible, s2 = n2, c2 = t2.id, l2 = mu(e2), u2 = s2.scope !== void 0 && Au(t2.schema, s2.scope, l2), d2 = fc.schema(t2.schema || l2, s2.scope, l2), f2 = du(i2, d2)(e2), p2 = d2 === void 0 ? "" : d2.description, m2 = fc.data(r2, i2), h2 = Ts(n2, d2), g2 = h2.show ? h2.text : "", _2 = Tu(e2, t2, n2, d2 || l2, r2, a2), v2 = Eu(e2, t2, n2, d2 || l2, r2, a2), y2 = d2 ?? l2, b2 = jl()(e2), x2 = Ml()(e2), S2 = bl(y2, n2, i2), C2 = b2(xl(y2, n2, i2, "label"), g2, { schema: y2, uischema: n2, path: i2, errors: f2 });
  return { data: m2, description: b2(xl(y2, n2, i2, "description"), p2, { schema: y2, uischema: n2, path: i2, errors: f2 }), errors: Tl(f2, x2, b2, y2, n2, i2), label: C2, visible: o2, enabled: _2, readonly: v2, id: c2, path: i2, required: u2, uischema: n2, schema: y2, config: wu(e2), cells: t2.cells || e2.jsonforms.cells, rootSchema: l2, i18nKeyPrefix: S2 };
};
var zu = (e2) => ({ handleChange(t2, n2) {
  e2(nl(t2, () => n2));
} });
var Bu = (e2, t2) => {
  let n2 = Ru(e2, t2), r2 = t2.options || n2.schema.enum?.map((t3) => Iu(t3, jl()(e2), bl(n2.schema, n2.uischema, n2.path))) || n2.schema.const && [Iu(n2.schema.const, jl()(e2), bl(n2.schema, n2.uischema, n2.path))];
  return { ...n2, options: r2 };
};
var Vu = (e2, t2) => {
  let n2 = Ru(e2, t2), r2 = t2.options || n2.schema.oneOf?.map((t3) => Lu(t3, jl()(e2), bl(n2.schema, n2.uischema, n2.path)));
  return { ...n2, options: r2 };
};
var Hu = (e2, t2) => {
  let n2 = Ru(e2, t2), r2 = n2.schema.items;
  r2 = r2 && r2.$ref ? ks(n2.rootSchema, r2.$ref, n2.rootSchema) : r2;
  let i2 = t2.options || r2?.oneOf && r2.oneOf.map((t3) => Lu(t3, e2.jsonforms.i18n?.translate, bl(n2.schema, n2.uischema, n2.path))) || r2?.enum?.map((t3) => Iu(t3, e2.jsonforms.i18n?.translate, bl(n2.schema, n2.uischema, n2.path)));
  return { ...n2, options: i2 };
};
var Uu = (e2, t2) => {
  let { ...n2 } = Ru(e2, t2);
  return { ...n2, uischemas: e2.jsonforms.uischemas };
};
var Wu = (e2, t2) => {
  let { path: n2, schema: r2, uischema: i2, label: a2, ...o2 } = Uu(e2, t2), s2 = fc.schema(r2, "items", o2.rootSchema), c2 = fu(n2, s2)(e2);
  return { ...o2, label: a2, path: n2, uischema: i2, schema: s2, arraySchema: r2, childErrors: c2, renderers: t2.renderers || _u(e2), cells: t2.cells || vu(e2) };
};
var Gu = (e2) => ({ addItem: (t2, n2) => () => {
  e2(nl(t2, (e3) => e3 == null ? [n2] : (e3.push(n2), e3), { type: "ADD", values: [n2] }));
}, removeItems: (t2, n2) => () => {
  e2(nl(t2, (e3) => (n2.sort((e4, t3) => e4 - t3).reverse().forEach((t3) => e3.splice(t3, 1)), e3), { type: "REMOVE", indices: n2 }));
}, moveUp: (t2, n2) => () => {
  e2(nl(t2, (e3) => (Ou(e3, n2), e3), { type: "MOVE", moves: [{ from: n2, to: n2 - 1 }] }));
}, moveDown: (t2, n2) => () => {
  e2(nl(t2, (e3) => (ku(e3, n2), e3), { type: "MOVE", moves: [{ from: n2, to: n2 + 1 }] }));
} });
var Ku = (e2) => ({ addItem: (t2, n2) => {
  e2(nl(t2, (e3) => e3 == null ? [n2] : (e3.push(n2), e3)));
}, removeItem: (t2, n2) => {
  e2(nl(t2, (e3) => {
    let t3 = e3.indexOf(n2);
    return e3.splice(t3, 1), e3;
  }));
} });
var qu = { visible: !0, enabled: !0, path: "", direction: "column" };
var Ju = (e2) => e2.type === "HorizontalLayout" ? "row" : e2.type === "VerticalLayout" ? "column" : qu.direction;
var Yu = (e2, t2) => {
  let n2 = pu(e2), { uischema: r2 } = t2, i2 = t2.visible === void 0 || ec(r2) ? rc(t2.uischema, n2, t2.path, gu(e2), wu(e2)) : t2.visible, a2 = fc.data(n2, t2.path), o2 = wu(e2), s2 = Tu(e2, t2, r2, void 0, n2, o2), c2 = Eu(e2, t2, r2, void 0, n2, o2), l2 = jl()(e2), u2 = Hs(r2) ? El(r2, l2) : void 0;
  return { ...qu, renderers: t2.renderers || _u(e2), cells: t2.cells || vu(e2), visible: i2, enabled: s2, readonly: c2, path: t2.path, data: a2, uischema: t2.uischema, schema: t2.schema, direction: t2.direction ?? Ju(r2), config: o2, label: u2 };
};
var Xu = (e2, t2) => ({ renderers: t2.renderers || (0, q.default)(e2.jsonforms, "renderers"), cells: t2.cells || (0, q.default)(e2.jsonforms, "cells"), schema: t2.schema || mu(e2), rootSchema: mu(e2), uischema: t2.uischema || hu(e2), path: t2.path, enabled: t2.enabled, config: wu(e2) });
({ ...qu });
var Zu = (e2, t2, n2) => {
  let { data: r2, schema: i2, rootSchema: a2, i18nKeyPrefix: o2, label: s2, ...c2 } = Ru(e2, t2), l2 = e2.jsonforms.core.ajv, u2 = ["required", "additionalProperties", "type", "enum", "const"], d2 = (e3) => !e3 || e3.length === 0 || !e3.find((e4) => u2.indexOf(e4.keyword) !== -1), f2;
  for (let e3 = 0; e3 < i2[n2]?.length; e3++) try {
    let t3 = i2[n2][e3];
    t3.$ref && (t3 = fc.schema(a2, t3.$ref, a2));
    let o3 = l2.compile(t3);
    if (o3(r2), d2(o3.errors)) {
      f2 = e3;
      break;
    }
  } catch {
    console.debug("Combinator subschema is not self contained, can't hand it over to AJV");
  }
  return { data: r2, schema: i2, rootSchema: a2, ...c2, i18nKeyPrefix: o2, label: s2, indexOfFittingSchema: f2, uischemas: yu(e2) };
};
var Qu = (e2, t2) => Zu(e2, t2, "oneOf");
var $u = (e2, t2) => {
  let { uischema: n2 } = t2, r2 = t2.visible === void 0 || ec(n2) ? rc(t2.uischema, pu(e2), t2.path, gu(e2), wu(e2)) : t2.visible, i2 = n2.text, a2 = jl()(e2), o2 = vl(void 0, n2);
  return { text: a2(o2 ? `${o2}.text` : i2 ?? "", i2, { uischema: n2 }), visible: r2, config: wu(e2), renderers: t2.renderers || _u(e2), cells: t2.cells || vu(e2), uischema: n2 };
};
var nd = (e2, t2, n2, r2, i2, a2) => e2.map((e3, o2) => {
  let s2 = e3.$ref && fc.schema(t2, e3.$ref, t2), c2 = s2 ?? e3;
  return { schema: c2, uischema: ou(a2, c2, r2.scope, i2, void 0, r2, t2), label: e3.title ?? s2?.title ?? `${n2}-${o2}` };
});
var rd = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.dynamicAnchor = void 0;
  var t2 = W(), n2 = tr(), r2 = _r(), i2 = Mr(), a2 = { keyword: "$dynamicAnchor", schemaType: "string", code: (e3) => o2(e3, e3.schema) };
  function o2(e3, r3) {
    let { gen: i3, it: a3 } = e3;
    a3.schemaEnv.root.dynamicAnchors[r3] = !0;
    let o3 = (0, t2._)`${n2.default.dynamicAnchors}${(0, t2.getProperty)(r3)}`, c2 = a3.errSchemaPath === "#" ? a3.validateName : s2(e3);
    i3.if((0, t2._)`!${o3}`, () => i3.assign(o3, c2));
  }
  e2.dynamicAnchor = o2;
  function s2(e3) {
    let { schemaEnv: t3, schema: n3, self: a3 } = e3.it, { root: o3, baseId: s3, localRefs: c2, meta: l2 } = t3.root, { schemaId: u2 } = a3.opts, d2 = new r2.SchemaEnv({ schema: n3, schemaId: u2, root: o3, baseId: s3, localRefs: c2, meta: l2 });
    return r2.compileSchema.call(a3, d2), (0, i2.getValidate)(e3, d2);
  }
  e2.default = a2;
}));
var id = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.dynamicRef = void 0;
  var t2 = W(), n2 = tr(), r2 = Mr(), i2 = { keyword: "$dynamicRef", schemaType: "string", code: (e3) => a2(e3, e3.schema) };
  function a2(e3, i3) {
    let { gen: a3, keyword: o2, it: s2 } = e3;
    if (i3[0] !== "#") throw Error(`"${o2}" only supports hash fragment reference`);
    let c2 = i3.slice(1);
    if (s2.allErrors) l2();
    else {
      let t3 = a3.let("valid", !1);
      l2(t3), e3.ok(t3);
    }
    function l2(e4) {
      if (s2.schemaEnv.root.dynamicAnchors[c2]) {
        let r3 = a3.let("_v", (0, t2._)`${n2.default.dynamicAnchors}${(0, t2.getProperty)(c2)}`);
        a3.if(r3, u2(r3, e4), u2(s2.validateName, e4));
      } else u2(s2.validateName, e4)();
    }
    function u2(t3, n3) {
      return n3 ? () => a3.block(() => {
        (0, r2.callRef)(e3, t3), a3.let(n3, !0);
      }) : () => (0, r2.callRef)(e3, t3);
    }
  }
  e2.dynamicRef = a2, e2.default = i2;
}));
var ad = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = rd(), n2 = G();
  e2.default = { keyword: "$recursiveAnchor", schemaType: "boolean", code(e3) {
    e3.schema ? (0, t2.dynamicAnchor)(e3, "") : (0, n2.checkStrictMode)(e3.it, "$recursiveAnchor: false is ignored");
  } };
}));
var od = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = id();
  e2.default = { keyword: "$recursiveRef", schemaType: "string", code: (e3) => (0, t2.dynamicRef)(e3, e3.schema) };
}));
var sd = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = rd(), n2 = id(), r2 = ad(), i2 = od();
  e2.default = [t2.default, n2.default, r2.default, i2.default];
}));
var cd = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = Qr();
  e2.default = { keyword: "dependentRequired", type: "object", schemaType: "object", error: t2.error, code: (e3) => (0, t2.validatePropertyDeps)(e3) };
}));
var ld = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = Qr();
  e2.default = { keyword: "dependentSchemas", type: "object", schemaType: "object", code: (e3) => (0, t2.validateSchemaDeps)(e3) };
}));
var ud = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = G();
  e2.default = { keyword: ["maxContains", "minContains"], type: "array", schemaType: "number", code({ keyword: e3, parentSchema: n2, it: r2 }) {
    n2.contains === void 0 && (0, t2.checkStrictMode)(r2, `"${e3}" without "contains" is ignored`);
  } };
}));
var dd = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = cd(), n2 = ld(), r2 = ud();
  e2.default = [t2.default, n2.default, r2.default];
}));
var fd = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W(), n2 = G(), r2 = tr();
  e2.default = { keyword: "unevaluatedProperties", type: "object", schemaType: ["boolean", "object"], trackErrors: !0, error: { message: "must NOT have unevaluated properties", params: ({ params: e3 }) => (0, t2._)`{unevaluatedProperty: ${e3.unevaluatedProperty}}` }, code(e3) {
    let { gen: i2, schema: a2, data: o2, errsCount: s2, it: c2 } = e3;
    if (!s2) throw Error("ajv implementation error");
    let { allErrors: l2, props: u2 } = c2;
    u2 instanceof t2.Name ? i2.if((0, t2._)`${u2} !== true`, () => i2.forIn("key", o2, (e4) => i2.if(f2(u2, e4), () => d2(e4)))) : u2 !== !0 && i2.forIn("key", o2, (e4) => u2 === void 0 ? d2(e4) : i2.if(p2(u2, e4), () => d2(e4))), c2.props = !0, e3.ok((0, t2._)`${s2} === ${r2.default.errors}`);
    function d2(r3) {
      if (a2 === !1) e3.setParams({ unevaluatedProperty: r3 }), e3.error(), l2 || i2.break();
      else if (!(0, n2.alwaysValidSchema)(c2, a2)) {
        let a3 = i2.name("valid");
        e3.subschema({ keyword: "unevaluatedProperties", dataProp: r3, dataPropType: n2.Type.Str }, a3), l2 || i2.if((0, t2.not)(a3), () => i2.break());
      }
    }
    function f2(e4, n3) {
      return (0, t2._)`!${e4} || !${e4}[${n3}]`;
    }
    function p2(e4, n3) {
      let r3 = [];
      for (let i3 in e4) e4[i3] === !0 && r3.push((0, t2._)`${n3} !== ${i3}`);
      return (0, t2.and)(...r3);
    }
  } };
}));
var pd = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = W(), n2 = G();
  e2.default = { keyword: "unevaluatedItems", type: "array", schemaType: ["boolean", "object"], error: { message: ({ params: { len: e3 } }) => (0, t2.str)`must NOT have more than ${e3} items`, params: ({ params: { len: e3 } }) => (0, t2._)`{limit: ${e3}}` }, code(e3) {
    let { gen: r2, schema: i2, data: a2, it: o2 } = e3, s2 = o2.items || 0;
    if (s2 === !0) return;
    let c2 = r2.const("len", (0, t2._)`${a2}.length`);
    if (i2 === !1) e3.setParams({ len: s2 }), e3.fail((0, t2._)`${c2} > ${s2}`);
    else if (typeof i2 == "object" && !(0, n2.alwaysValidSchema)(o2, i2)) {
      let n3 = r2.var("valid", (0, t2._)`${c2} <= ${s2}`);
      r2.if((0, t2.not)(n3), () => l2(n3, s2)), e3.ok(n3);
    }
    o2.items = !0;
    function l2(i3, a3) {
      r2.forRange("i", a3, c2, (a4) => {
        e3.subschema({ keyword: "unevaluatedItems", dataProp: a4, dataPropType: n2.Type.Num }, i3), o2.allErrors || r2.if((0, t2.not)(i3), () => r2.break());
      });
    }
  } };
}));
var md = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = fd(), n2 = pd();
  e2.default = [t2.default, n2.default];
}));
var hd = r({ $id: () => _d, $recursiveAnchor: () => !0, $schema: () => gd, $vocabulary: () => vd, allOf: () => bd, default: () => Cd, properties: () => Sd, title: () => yd, type: () => xd });
var gd;
var _d;
var vd;
var yd;
var bd;
var xd;
var Sd;
var Cd;
var wd = t((() => {
  gd = "https://json-schema.org/draft/2019-09/schema", _d = "https://json-schema.org/draft/2019-09/schema", vd = { "https://json-schema.org/draft/2019-09/vocab/core": !0, "https://json-schema.org/draft/2019-09/vocab/applicator": !0, "https://json-schema.org/draft/2019-09/vocab/validation": !0, "https://json-schema.org/draft/2019-09/vocab/meta-data": !0, "https://json-schema.org/draft/2019-09/vocab/format": !1, "https://json-schema.org/draft/2019-09/vocab/content": !0 }, yd = "Core and Validation specifications meta-schema", bd = [{ $ref: "meta/core" }, { $ref: "meta/applicator" }, { $ref: "meta/validation" }, { $ref: "meta/meta-data" }, { $ref: "meta/format" }, { $ref: "meta/content" }], xd = ["object", "boolean"], Sd = { definitions: { $comment: "While no longer an official keyword as it is replaced by $defs, this keyword is retained in the meta-schema to prevent incompatible extensions as it remains in common use.", type: "object", additionalProperties: { $recursiveRef: "#" }, default: {} }, dependencies: { $comment: '"dependencies" is no longer a keyword, but schema authors should avoid redefining it to facilitate a smooth transition to "dependentSchemas" and "dependentRequired"', type: "object", additionalProperties: { anyOf: [{ $recursiveRef: "#" }, { $ref: "meta/validation#/$defs/stringArray" }] } } }, Cd = { $schema: gd, $id: _d, $vocabulary: vd, $recursiveAnchor: !0, title: yd, allOf: bd, type: xd, properties: Sd };
}));
var Td = r({ $defs: () => Md, $id: () => Dd, $recursiveAnchor: () => !0, $schema: () => Ed, $vocabulary: () => Od, default: () => Nd, properties: () => jd, title: () => kd, type: () => Ad });
var Ed;
var Dd;
var Od;
var kd;
var Ad;
var jd;
var Md;
var Nd;
var Pd = t((() => {
  Ed = "https://json-schema.org/draft/2019-09/schema", Dd = "https://json-schema.org/draft/2019-09/meta/applicator", Od = { "https://json-schema.org/draft/2019-09/vocab/applicator": !0 }, kd = "Applicator vocabulary meta-schema", Ad = ["object", "boolean"], jd = { additionalItems: { $recursiveRef: "#" }, unevaluatedItems: { $recursiveRef: "#" }, items: { anyOf: [{ $recursiveRef: "#" }, { $ref: "#/$defs/schemaArray" }] }, contains: { $recursiveRef: "#" }, additionalProperties: { $recursiveRef: "#" }, unevaluatedProperties: { $recursiveRef: "#" }, properties: { type: "object", additionalProperties: { $recursiveRef: "#" }, default: {} }, patternProperties: { type: "object", additionalProperties: { $recursiveRef: "#" }, propertyNames: { format: "regex" }, default: {} }, dependentSchemas: { type: "object", additionalProperties: { $recursiveRef: "#" } }, propertyNames: { $recursiveRef: "#" }, if: { $recursiveRef: "#" }, then: { $recursiveRef: "#" }, else: { $recursiveRef: "#" }, allOf: { $ref: "#/$defs/schemaArray" }, anyOf: { $ref: "#/$defs/schemaArray" }, oneOf: { $ref: "#/$defs/schemaArray" }, not: { $recursiveRef: "#" } }, Md = { schemaArray: { type: "array", minItems: 1, items: { $recursiveRef: "#" } } }, Nd = { $schema: Ed, $id: Dd, $vocabulary: Od, $recursiveAnchor: !0, title: kd, type: Ad, properties: jd, $defs: Md };
}));
var Fd = r({ $id: () => Ld, $recursiveAnchor: () => !0, $schema: () => Id, $vocabulary: () => Rd, default: () => Hd, properties: () => Vd, title: () => zd, type: () => Bd });
var Id;
var Ld;
var Rd;
var zd;
var Bd;
var Vd;
var Hd;
var Ud = t((() => {
  Id = "https://json-schema.org/draft/2019-09/schema", Ld = "https://json-schema.org/draft/2019-09/meta/content", Rd = { "https://json-schema.org/draft/2019-09/vocab/content": !0 }, zd = "Content vocabulary meta-schema", Bd = ["object", "boolean"], Vd = { contentMediaType: { type: "string" }, contentEncoding: { type: "string" }, contentSchema: { $recursiveRef: "#" } }, Hd = { $schema: Id, $id: Ld, $vocabulary: Rd, $recursiveAnchor: !0, title: zd, type: Bd, properties: Vd };
}));
var Wd = r({ $id: () => Kd, $recursiveAnchor: () => !0, $schema: () => Gd, $vocabulary: () => qd, default: () => Zd, properties: () => Xd, title: () => Jd, type: () => Yd });
var Gd;
var Kd;
var qd;
var Jd;
var Yd;
var Xd;
var Zd;
var Qd = t((() => {
  Gd = "https://json-schema.org/draft/2019-09/schema", Kd = "https://json-schema.org/draft/2019-09/meta/core", qd = { "https://json-schema.org/draft/2019-09/vocab/core": !0 }, Jd = "Core vocabulary meta-schema", Yd = ["object", "boolean"], Xd = { $id: { type: "string", format: "uri-reference", $comment: "Non-empty fragments not allowed.", pattern: "^[^#]*#?$" }, $schema: { type: "string", format: "uri" }, $anchor: { type: "string", pattern: "^[A-Za-z][-A-Za-z0-9.:_]*$" }, $ref: { type: "string", format: "uri-reference" }, $recursiveRef: { type: "string", format: "uri-reference" }, $recursiveAnchor: { type: "boolean", default: !1 }, $vocabulary: { type: "object", propertyNames: { type: "string", format: "uri" }, additionalProperties: { type: "boolean" } }, $comment: { type: "string" }, $defs: { type: "object", additionalProperties: { $recursiveRef: "#" }, default: {} } }, Zd = { $schema: Gd, $id: Kd, $vocabulary: qd, $recursiveAnchor: !0, title: Jd, type: Yd, properties: Xd };
}));
var $d = r({ $id: () => tf, $recursiveAnchor: () => !0, $schema: () => ef, $vocabulary: () => nf, default: () => sf, properties: () => of, title: () => rf, type: () => af });
var ef;
var tf;
var nf;
var rf;
var af;
var of;
var sf;
var cf = t((() => {
  ef = "https://json-schema.org/draft/2019-09/schema", tf = "https://json-schema.org/draft/2019-09/meta/format", nf = { "https://json-schema.org/draft/2019-09/vocab/format": !0 }, rf = "Format vocabulary meta-schema", af = ["object", "boolean"], of = { format: { type: "string" } }, sf = { $schema: ef, $id: tf, $vocabulary: nf, $recursiveAnchor: !0, title: rf, type: af, properties: of };
}));
var lf = r({ $id: () => df, $recursiveAnchor: () => !0, $schema: () => uf, $vocabulary: () => ff, default: () => gf, properties: () => hf, title: () => pf, type: () => mf });
var uf;
var df;
var ff;
var pf;
var mf;
var hf;
var gf;
var _f = t((() => {
  uf = "https://json-schema.org/draft/2019-09/schema", df = "https://json-schema.org/draft/2019-09/meta/meta-data", ff = { "https://json-schema.org/draft/2019-09/vocab/meta-data": !0 }, pf = "Meta-data vocabulary meta-schema", mf = ["object", "boolean"], hf = { title: { type: "string" }, description: { type: "string" }, default: !0, deprecated: { type: "boolean", default: !1 }, readOnly: { type: "boolean", default: !1 }, writeOnly: { type: "boolean", default: !1 }, examples: { type: "array", items: !0 } }, gf = { $schema: uf, $id: df, $vocabulary: ff, $recursiveAnchor: !0, title: pf, type: mf, properties: hf };
}));
var vf = r({ $defs: () => Tf, $id: () => bf, $recursiveAnchor: () => !0, $schema: () => yf, $vocabulary: () => xf, default: () => Ef, properties: () => wf, title: () => Sf, type: () => Cf });
var yf;
var bf;
var xf;
var Sf;
var Cf;
var wf;
var Tf;
var Ef;
var Df = t((() => {
  yf = "https://json-schema.org/draft/2019-09/schema", bf = "https://json-schema.org/draft/2019-09/meta/validation", xf = { "https://json-schema.org/draft/2019-09/vocab/validation": !0 }, Sf = "Validation vocabulary meta-schema", Cf = ["object", "boolean"], wf = { multipleOf: { type: "number", exclusiveMinimum: 0 }, maximum: { type: "number" }, exclusiveMaximum: { type: "number" }, minimum: { type: "number" }, exclusiveMinimum: { type: "number" }, maxLength: { $ref: "#/$defs/nonNegativeInteger" }, minLength: { $ref: "#/$defs/nonNegativeIntegerDefault0" }, pattern: { type: "string", format: "regex" }, maxItems: { $ref: "#/$defs/nonNegativeInteger" }, minItems: { $ref: "#/$defs/nonNegativeIntegerDefault0" }, uniqueItems: { type: "boolean", default: !1 }, maxContains: { $ref: "#/$defs/nonNegativeInteger" }, minContains: { $ref: "#/$defs/nonNegativeInteger", default: 1 }, maxProperties: { $ref: "#/$defs/nonNegativeInteger" }, minProperties: { $ref: "#/$defs/nonNegativeIntegerDefault0" }, required: { $ref: "#/$defs/stringArray" }, dependentRequired: { type: "object", additionalProperties: { $ref: "#/$defs/stringArray" } }, const: !0, enum: { type: "array", items: !0 }, type: { anyOf: [{ $ref: "#/$defs/simpleTypes" }, { type: "array", items: { $ref: "#/$defs/simpleTypes" }, minItems: 1, uniqueItems: !0 }] } }, Tf = { nonNegativeInteger: { type: "integer", minimum: 0 }, nonNegativeIntegerDefault0: { $ref: "#/$defs/nonNegativeInteger", default: 0 }, simpleTypes: { enum: ["array", "boolean", "integer", "null", "number", "object", "string"] }, stringArray: { type: "array", items: { type: "string" }, uniqueItems: !0, default: [] } }, Ef = { $schema: yf, $id: bf, $vocabulary: xf, $recursiveAnchor: !0, title: Sf, type: Cf, properties: wf, $defs: Tf };
}));
var Of = i(((t2) => {
  Object.defineProperty(t2, "__esModule", { value: !0 });
  var n2 = (wd(), e(hd).default), r2 = (Pd(), e(Td).default), i2 = (Ud(), e(Fd).default), a2 = (Qd(), e(Wd).default), o2 = (cf(), e($d).default), s2 = (_f(), e(lf).default), c2 = (Df(), e(vf).default), l2 = ["/properties"];
  function u2(e2) {
    return [n2, r2, i2, a2, t3(this, o2), s2, t3(this, c2)].forEach((e3) => this.addMetaSchema(e3, void 0, !1)), this;
    function t3(t4, n3) {
      return e2 ? t4.$dataMetaSchema(n3, l2) : n3;
    }
  }
  t2.default = u2;
}));
var kf = i(((e2, t2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.MissingRefError = e2.ValidationError = e2.CodeGen = e2.Name = e2.nil = e2.stringify = e2.str = e2._ = e2.KeywordCxt = e2.Ajv2019 = void 0;
  var n2 = Ar(), r2 = pi(), i2 = sd(), a2 = dd(), o2 = md(), s2 = hi(), c2 = Of(), l2 = "https://json-schema.org/draft/2019-09/schema", u2 = class extends n2.default {
    constructor(e3 = {}) {
      super({ ...e3, dynamicRef: !0, next: !0, unevaluated: !0 });
    }
    _addVocabularies() {
      super._addVocabularies(), this.addVocabulary(i2.default), r2.default.forEach((e3) => this.addVocabulary(e3)), this.addVocabulary(a2.default), this.addVocabulary(o2.default), this.opts.discriminator && this.addKeyword(s2.default);
    }
    _addDefaultMetaSchema() {
      super._addDefaultMetaSchema();
      let { $data: e3, meta: t3 } = this.opts;
      t3 && (c2.default.call(this, e3), this.refs["http://json-schema.org/schema"] = l2);
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(l2) ? l2 : void 0);
    }
  };
  e2.Ajv2019 = u2, t2.exports = e2 = u2, t2.exports.Ajv2019 = u2, Object.defineProperty(e2, "__esModule", { value: !0 }), e2.default = u2;
  var d2 = mr();
  Object.defineProperty(e2, "KeywordCxt", { enumerable: !0, get: function() {
    return d2.KeywordCxt;
  } });
  var f2 = W();
  Object.defineProperty(e2, "_", { enumerable: !0, get: function() {
    return f2._;
  } }), Object.defineProperty(e2, "str", { enumerable: !0, get: function() {
    return f2.str;
  } }), Object.defineProperty(e2, "stringify", { enumerable: !0, get: function() {
    return f2.stringify;
  } }), Object.defineProperty(e2, "nil", { enumerable: !0, get: function() {
    return f2.nil;
  } }), Object.defineProperty(e2, "Name", { enumerable: !0, get: function() {
    return f2.Name;
  } }), Object.defineProperty(e2, "CodeGen", { enumerable: !0, get: function() {
    return f2.CodeGen;
  } });
  var p2 = hr();
  Object.defineProperty(e2, "ValidationError", { enumerable: !0, get: function() {
    return p2.default;
  } });
  var m2 = gr();
  Object.defineProperty(e2, "MissingRefError", { enumerable: !0, get: function() {
    return m2.default;
  } });
}));
var Af = i(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 });
  var t2 = Nr(), n2 = Kr(), r2 = li(), i2 = sd(), a2 = dd(), o2 = md(), s2 = di(), c2 = fi();
  e2.default = [i2.default, t2.default, n2.default, (0, r2.default)(!0), s2.default, c2.metadataVocabulary, c2.contentVocabulary, a2.default, o2.default];
}));
var jf = r({ $comment: () => zf, $dynamicAnchor: () => Ff, $id: () => Nf, $schema: () => Mf, $vocabulary: () => Pf, allOf: () => Lf, default: () => Vf, properties: () => Bf, title: () => If, type: () => Rf });
var Mf;
var Nf;
var Pf;
var Ff;
var If;
var Lf;
var Rf;
var zf;
var Bf;
var Vf;
var Hf = t((() => {
  Mf = "https://json-schema.org/draft/2020-12/schema", Nf = "https://json-schema.org/draft/2020-12/schema", Pf = { "https://json-schema.org/draft/2020-12/vocab/core": !0, "https://json-schema.org/draft/2020-12/vocab/applicator": !0, "https://json-schema.org/draft/2020-12/vocab/unevaluated": !0, "https://json-schema.org/draft/2020-12/vocab/validation": !0, "https://json-schema.org/draft/2020-12/vocab/meta-data": !0, "https://json-schema.org/draft/2020-12/vocab/format-annotation": !0, "https://json-schema.org/draft/2020-12/vocab/content": !0 }, Ff = "meta", If = "Core and Validation specifications meta-schema", Lf = [{ $ref: "meta/core" }, { $ref: "meta/applicator" }, { $ref: "meta/unevaluated" }, { $ref: "meta/validation" }, { $ref: "meta/meta-data" }, { $ref: "meta/format-annotation" }, { $ref: "meta/content" }], Rf = ["object", "boolean"], zf = "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.", Bf = { definitions: { $comment: '"definitions" has been replaced by "$defs".', type: "object", additionalProperties: { $dynamicRef: "#meta" }, deprecated: !0, default: {} }, dependencies: { $comment: '"dependencies" has been split and replaced by "dependentSchemas" and "dependentRequired" in order to serve their differing semantics.', type: "object", additionalProperties: { anyOf: [{ $dynamicRef: "#meta" }, { $ref: "meta/validation#/$defs/stringArray" }] }, deprecated: !0, default: {} }, $recursiveAnchor: { $comment: '"$recursiveAnchor" has been replaced by "$dynamicAnchor".', $ref: "meta/core#/$defs/anchorString", deprecated: !0 }, $recursiveRef: { $comment: '"$recursiveRef" has been replaced by "$dynamicRef".', $ref: "meta/core#/$defs/uriReferenceString", deprecated: !0 } }, Vf = { $schema: Mf, $id: Nf, $vocabulary: Pf, $dynamicAnchor: Ff, title: If, allOf: Lf, type: Rf, $comment: zf, properties: Bf };
}));
var Uf = r({ $defs: () => Zf, $dynamicAnchor: () => qf, $id: () => Gf, $schema: () => Wf, $vocabulary: () => Kf, default: () => Qf, properties: () => Xf, title: () => Jf, type: () => Yf });
var Wf;
var Gf;
var Kf;
var qf;
var Jf;
var Yf;
var Xf;
var Zf;
var Qf;
var $f = t((() => {
  Wf = "https://json-schema.org/draft/2020-12/schema", Gf = "https://json-schema.org/draft/2020-12/meta/applicator", Kf = { "https://json-schema.org/draft/2020-12/vocab/applicator": !0 }, qf = "meta", Jf = "Applicator vocabulary meta-schema", Yf = ["object", "boolean"], Xf = { prefixItems: { $ref: "#/$defs/schemaArray" }, items: { $dynamicRef: "#meta" }, contains: { $dynamicRef: "#meta" }, additionalProperties: { $dynamicRef: "#meta" }, properties: { type: "object", additionalProperties: { $dynamicRef: "#meta" }, default: {} }, patternProperties: { type: "object", additionalProperties: { $dynamicRef: "#meta" }, propertyNames: { format: "regex" }, default: {} }, dependentSchemas: { type: "object", additionalProperties: { $dynamicRef: "#meta" }, default: {} }, propertyNames: { $dynamicRef: "#meta" }, if: { $dynamicRef: "#meta" }, then: { $dynamicRef: "#meta" }, else: { $dynamicRef: "#meta" }, allOf: { $ref: "#/$defs/schemaArray" }, anyOf: { $ref: "#/$defs/schemaArray" }, oneOf: { $ref: "#/$defs/schemaArray" }, not: { $dynamicRef: "#meta" } }, Zf = { schemaArray: { type: "array", minItems: 1, items: { $dynamicRef: "#meta" } } }, Qf = { $schema: Wf, $id: Gf, $vocabulary: Kf, $dynamicAnchor: qf, title: Jf, type: Yf, properties: Xf, $defs: Zf };
}));
var ep = r({ $dynamicAnchor: () => ip, $id: () => np, $schema: () => tp, $vocabulary: () => rp, default: () => cp, properties: () => sp, title: () => ap, type: () => op });
var tp;
var np;
var rp;
var ip;
var ap;
var op;
var sp;
var cp;
var lp = t((() => {
  tp = "https://json-schema.org/draft/2020-12/schema", np = "https://json-schema.org/draft/2020-12/meta/unevaluated", rp = { "https://json-schema.org/draft/2020-12/vocab/unevaluated": !0 }, ip = "meta", ap = "Unevaluated applicator vocabulary meta-schema", op = ["object", "boolean"], sp = { unevaluatedItems: { $dynamicRef: "#meta" }, unevaluatedProperties: { $dynamicRef: "#meta" } }, cp = { $schema: tp, $id: np, $vocabulary: rp, $dynamicAnchor: ip, title: ap, type: op, properties: sp };
}));
var up = r({ $dynamicAnchor: () => mp, $id: () => fp, $schema: () => dp, $vocabulary: () => pp, default: () => vp, properties: () => _p, title: () => hp, type: () => gp });
var dp;
var fp;
var pp;
var mp;
var hp;
var gp;
var _p;
var vp;
var yp = t((() => {
  dp = "https://json-schema.org/draft/2020-12/schema", fp = "https://json-schema.org/draft/2020-12/meta/content", pp = { "https://json-schema.org/draft/2020-12/vocab/content": !0 }, mp = "meta", hp = "Content vocabulary meta-schema", gp = ["object", "boolean"], _p = { contentEncoding: { type: "string" }, contentMediaType: { type: "string" }, contentSchema: { $dynamicRef: "#meta" } }, vp = { $schema: dp, $id: fp, $vocabulary: pp, $dynamicAnchor: mp, title: hp, type: gp, properties: _p };
}));
var bp = r({ $defs: () => Op, $dynamicAnchor: () => wp, $id: () => Sp, $schema: () => xp, $vocabulary: () => Cp, default: () => kp, properties: () => Dp, title: () => Tp, type: () => Ep });
var xp;
var Sp;
var Cp;
var wp;
var Tp;
var Ep;
var Dp;
var Op;
var kp;
var Ap = t((() => {
  xp = "https://json-schema.org/draft/2020-12/schema", Sp = "https://json-schema.org/draft/2020-12/meta/core", Cp = { "https://json-schema.org/draft/2020-12/vocab/core": !0 }, wp = "meta", Tp = "Core vocabulary meta-schema", Ep = ["object", "boolean"], Dp = { $id: { $ref: "#/$defs/uriReferenceString", $comment: "Non-empty fragments not allowed.", pattern: "^[^#]*#?$" }, $schema: { $ref: "#/$defs/uriString" }, $ref: { $ref: "#/$defs/uriReferenceString" }, $anchor: { $ref: "#/$defs/anchorString" }, $dynamicRef: { $ref: "#/$defs/uriReferenceString" }, $dynamicAnchor: { $ref: "#/$defs/anchorString" }, $vocabulary: { type: "object", propertyNames: { $ref: "#/$defs/uriString" }, additionalProperties: { type: "boolean" } }, $comment: { type: "string" }, $defs: { type: "object", additionalProperties: { $dynamicRef: "#meta" } } }, Op = { anchorString: { type: "string", pattern: "^[A-Za-z_][-A-Za-z0-9._]*$" }, uriString: { type: "string", format: "uri" }, uriReferenceString: { type: "string", format: "uri-reference" } }, kp = { $schema: xp, $id: Sp, $vocabulary: Cp, $dynamicAnchor: wp, title: Tp, type: Ep, properties: Dp, $defs: Op };
}));
var jp = r({ $dynamicAnchor: () => Fp, $id: () => Np, $schema: () => Mp, $vocabulary: () => Pp, default: () => zp, properties: () => Rp, title: () => Ip, type: () => Lp });
var Mp;
var Np;
var Pp;
var Fp;
var Ip;
var Lp;
var Rp;
var zp;
var Bp = t((() => {
  Mp = "https://json-schema.org/draft/2020-12/schema", Np = "https://json-schema.org/draft/2020-12/meta/format-annotation", Pp = { "https://json-schema.org/draft/2020-12/vocab/format-annotation": !0 }, Fp = "meta", Ip = "Format vocabulary meta-schema for annotation results", Lp = ["object", "boolean"], Rp = { format: { type: "string" } }, zp = { $schema: Mp, $id: Np, $vocabulary: Pp, $dynamicAnchor: Fp, title: Ip, type: Lp, properties: Rp };
}));
var Vp = r({ $dynamicAnchor: () => Gp, $id: () => Up, $schema: () => Hp, $vocabulary: () => Wp, default: () => Yp, properties: () => Jp, title: () => Kp, type: () => qp });
var Hp;
var Up;
var Wp;
var Gp;
var Kp;
var qp;
var Jp;
var Yp;
var Xp = t((() => {
  Hp = "https://json-schema.org/draft/2020-12/schema", Up = "https://json-schema.org/draft/2020-12/meta/meta-data", Wp = { "https://json-schema.org/draft/2020-12/vocab/meta-data": !0 }, Gp = "meta", Kp = "Meta-data vocabulary meta-schema", qp = ["object", "boolean"], Jp = { title: { type: "string" }, description: { type: "string" }, default: !0, deprecated: { type: "boolean", default: !1 }, readOnly: { type: "boolean", default: !1 }, writeOnly: { type: "boolean", default: !1 }, examples: { type: "array", items: !0 } }, Yp = { $schema: Hp, $id: Up, $vocabulary: Wp, $dynamicAnchor: Gp, title: Kp, type: qp, properties: Jp };
}));
var Zp = r({ $defs: () => am, $dynamicAnchor: () => tm, $id: () => $p, $schema: () => Qp, $vocabulary: () => em, default: () => om, properties: () => im, title: () => nm, type: () => rm });
var Qp;
var $p;
var em;
var tm;
var nm;
var rm;
var im;
var am;
var om;
var sm = t((() => {
  Qp = "https://json-schema.org/draft/2020-12/schema", $p = "https://json-schema.org/draft/2020-12/meta/validation", em = { "https://json-schema.org/draft/2020-12/vocab/validation": !0 }, tm = "meta", nm = "Validation vocabulary meta-schema", rm = ["object", "boolean"], im = { type: { anyOf: [{ $ref: "#/$defs/simpleTypes" }, { type: "array", items: { $ref: "#/$defs/simpleTypes" }, minItems: 1, uniqueItems: !0 }] }, const: !0, enum: { type: "array", items: !0 }, multipleOf: { type: "number", exclusiveMinimum: 0 }, maximum: { type: "number" }, exclusiveMaximum: { type: "number" }, minimum: { type: "number" }, exclusiveMinimum: { type: "number" }, maxLength: { $ref: "#/$defs/nonNegativeInteger" }, minLength: { $ref: "#/$defs/nonNegativeIntegerDefault0" }, pattern: { type: "string", format: "regex" }, maxItems: { $ref: "#/$defs/nonNegativeInteger" }, minItems: { $ref: "#/$defs/nonNegativeIntegerDefault0" }, uniqueItems: { type: "boolean", default: !1 }, maxContains: { $ref: "#/$defs/nonNegativeInteger" }, minContains: { $ref: "#/$defs/nonNegativeInteger", default: 1 }, maxProperties: { $ref: "#/$defs/nonNegativeInteger" }, minProperties: { $ref: "#/$defs/nonNegativeIntegerDefault0" }, required: { $ref: "#/$defs/stringArray" }, dependentRequired: { type: "object", additionalProperties: { $ref: "#/$defs/stringArray" } } }, am = { nonNegativeInteger: { type: "integer", minimum: 0 }, nonNegativeIntegerDefault0: { $ref: "#/$defs/nonNegativeInteger", default: 0 }, simpleTypes: { enum: ["array", "boolean", "integer", "null", "number", "object", "string"] }, stringArray: { type: "array", items: { type: "string" }, uniqueItems: !0, default: [] } }, om = { $schema: Qp, $id: $p, $vocabulary: em, $dynamicAnchor: tm, title: nm, type: rm, properties: im, $defs: am };
}));
var cm = i(((t2) => {
  Object.defineProperty(t2, "__esModule", { value: !0 });
  var n2 = (Hf(), e(jf).default), r2 = ($f(), e(Uf).default), i2 = (lp(), e(ep).default), a2 = (yp(), e(up).default), o2 = (Ap(), e(bp).default), s2 = (Bp(), e(jp).default), c2 = (Xp(), e(Vp).default), l2 = (sm(), e(Zp).default), u2 = ["/properties"];
  function d2(e2) {
    return [n2, r2, i2, a2, o2, t3(this, s2), c2, t3(this, l2)].forEach((e3) => this.addMetaSchema(e3, void 0, !1)), this;
    function t3(t4, n3) {
      return e2 ? t4.$dataMetaSchema(n3, u2) : n3;
    }
  }
  t2.default = d2;
}));
var lm = i(((e2, t2) => {
  Object.defineProperty(e2, "__esModule", { value: !0 }), e2.MissingRefError = e2.ValidationError = e2.CodeGen = e2.Name = e2.nil = e2.stringify = e2.str = e2._ = e2.KeywordCxt = e2.Ajv2020 = void 0;
  var n2 = Ar(), r2 = Af(), i2 = hi(), a2 = cm(), o2 = "https://json-schema.org/draft/2020-12/schema", s2 = class extends n2.default {
    constructor(e3 = {}) {
      super({ ...e3, dynamicRef: !0, next: !0, unevaluated: !0 });
    }
    _addVocabularies() {
      super._addVocabularies(), r2.default.forEach((e3) => this.addVocabulary(e3)), this.opts.discriminator && this.addKeyword(i2.default);
    }
    _addDefaultMetaSchema() {
      super._addDefaultMetaSchema();
      let { $data: e3, meta: t3 } = this.opts;
      t3 && (a2.default.call(this, e3), this.refs["http://json-schema.org/schema"] = o2);
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(o2) ? o2 : void 0);
    }
  };
  e2.Ajv2020 = s2, t2.exports = e2 = s2, t2.exports.Ajv2020 = s2, Object.defineProperty(e2, "__esModule", { value: !0 }), e2.default = s2;
  var c2 = mr();
  Object.defineProperty(e2, "KeywordCxt", { enumerable: !0, get: function() {
    return c2.KeywordCxt;
  } });
  var l2 = W();
  Object.defineProperty(e2, "_", { enumerable: !0, get: function() {
    return l2._;
  } }), Object.defineProperty(e2, "str", { enumerable: !0, get: function() {
    return l2.str;
  } }), Object.defineProperty(e2, "stringify", { enumerable: !0, get: function() {
    return l2.stringify;
  } }), Object.defineProperty(e2, "nil", { enumerable: !0, get: function() {
    return l2.nil;
  } }), Object.defineProperty(e2, "Name", { enumerable: !0, get: function() {
    return l2.Name;
  } }), Object.defineProperty(e2, "CodeGen", { enumerable: !0, get: function() {
    return l2.CodeGen;
  } });
  var u2 = hr();
  Object.defineProperty(e2, "ValidationError", { enumerable: !0, get: function() {
    return u2.default;
  } });
  var d2 = gr();
  Object.defineProperty(e2, "MissingRefError", { enumerable: !0, get: function() {
    return d2.default;
  } });
}));
var um = n(kf(), 1);
var dm = n(lm(), 1);
var fm = class extends Error {
};
var pm = ["$defs", "definitions", "dependentSchemas", "patternProperties", "properties"];
var mm = ["additionalItems", "additionalProperties", "allOf", "anyOf", "contains", "contentSchema", "dependencies", "else", "if", "items", "not", "oneOf", "prefixItems", "propertyNames", "then", "unevaluatedItems", "unevaluatedProperties"];
function Z(e2) {
  return !!e2 && typeof e2 == "object" && !Array.isArray(e2);
}
function hm(e2) {
  let t2 = c(e2);
  return Array.isArray(t2) ? t2.map(hm) : Z(t2) ? Object.fromEntries(Object.entries(t2).map(([e3, t3]) => [e3, hm(t3)])) : t2;
}
function gm(e2) {
  return hm(e2);
}
function _m(e2, t2) {
  if (typeof e2 == "string") return e2;
  if (Array.isArray(e2)) return e2.filter((e3) => typeof e3 == "string").join(`
`);
  if (!Z(e2)) return "";
  let n2 = (t2 || "en").toLowerCase(), r2 = n2.startsWith("zh") || n2.startsWith("cn") ? "zh" : n2.startsWith("ru") ? "ru" : "en", i2 = [...r2 === "zh" ? ["zh", "cn"] : r2 === "en" ? ["en", "us"] : [r2], "en", "us", "zh", "cn", "ru"];
  for (let t3 of i2) {
    let n3 = e2[t3];
    if (typeof n3 == "string" && n3.trim()) return n3;
    if (Array.isArray(n3)) {
      let e3 = n3.filter((e4) => typeof e4 == "string");
      if (e3.length) return e3.join(`
`);
    }
  }
  return "";
}
function vm(e2) {
  if (e2 == null || e2 === "") return null;
  let t2 = e2;
  if (typeof e2 == "string") try {
    t2 = JSON.parse(e2);
  } catch {
    throw new fm("\u811A\u672C\u5165\u53C2 Schema \u5FC5\u987B\u662F\u5408\u6CD5\u7684 JSON");
  }
  if (!Z(t2)) throw new fm("\u811A\u672C\u5165\u53C2 Schema \u5FC5\u987B\u662F JSON \u5BF9\u8C61");
  let n2 = t2.type;
  if (typeof n2 == "string" && n2 !== "object") throw new fm("\u811A\u672C\u5165\u53C2 Schema \u7684\u9876\u5C42 type \u5FC5\u987B\u662F 'object'");
  if (Array.isArray(n2) && !n2.includes("object")) throw new fm("\u811A\u672C\u5165\u53C2 Schema \u7684\u9876\u5C42 type \u5FC5\u987B\u5305\u542B 'object'");
  return t2;
}
function ym(e2, t2) {
  let n2 = structuredClone(e2), r2 = (e3) => {
    if (Array.isArray(e3)) e3.forEach(r2);
    else if (Z(e3)) {
      for (let n3 of ["title", "description"]) {
        let r3 = _m(e3[n3], t2);
        r3 && (e3[n3] = r3);
      }
      for (let t3 of pm) {
        let n3 = e3[t3];
        Z(n3) && Object.values(n3).forEach(r2);
      }
      for (let t3 of mm) r2(e3[t3]);
    }
  };
  return r2(n2), n2;
}
function bm(e2, t2) {
  let n2 = structuredClone(e2), r2 = (e3) => {
    if (Array.isArray(e3)) {
      e3.forEach(r2);
      return;
    }
    if (!Z(e3)) return;
    Array.isArray(e3.required) && (e3.required = e3.required.filter((e4) => e4 !== "debug"));
    let n3 = e3.properties;
    Z(n3) && "debug" in n3 && (t2 ? delete n3.debug : n3.debug = {});
    for (let t3 of pm) {
      let n4 = e3[t3];
      Z(n4) && Object.values(n4).forEach(r2);
    }
    for (let t3 of mm) r2(e3[t3]);
  };
  return r2(n2), n2;
}
function xm(e2) {
  return bm(e2, !1);
}
function Sm(e2) {
  return Dc(bm(e2, !0));
}
function Cm(e2) {
  return e2 == null || typeof e2 == "string" && !e2.trim() || Array.isArray(e2) && e2.length === 0;
}
function wm(e2, t2) {
  if (Z(e2) && Z(t2)) {
    let n2 = gm(t2);
    for (let [t3, r2] of Object.entries(e2)) {
      let e3 = n2[t3];
      n2[t3] = Cm(e3) ? hm(r2) : wm(r2, e3);
    }
    return n2;
  }
  return Cm(t2) ? hm(e2) : hm(t2);
}
function Tm(e2, t2) {
  let n2 = Pu(e2, t2), r2 = e2.default !== void 0, i2 = Z(n2) ? gm(n2) : n2;
  if (r2 && !Z(i2)) return { found: !0, value: hm(i2) };
  if (!Z(e2.properties)) return r2 ? { found: !0, value: hm(i2) } : { found: !1 };
  let a2 = Z(i2) ? i2 : {}, o2 = r2 || Object.keys(a2).length > 0;
  for (let [n3, r3] of Object.entries(e2.properties)) {
    if (!Z(r3)) continue;
    let e3 = Tm(r3, t2);
    e3.found && (a2[n3] = wm(e3.value, a2[n3]), o2 = !0);
  }
  return o2 ? { found: !0, value: a2 } : { found: !1 };
}
function Em(e2) {
  let t2 = Tm(e2, e2);
  return t2.found && Z(t2.value) ? t2.value : {};
}
function Dm(e2, t2 = {}) {
  return wm(Em(e2), t2);
}
function Om(e2) {
  let t2 = typeof e2.$schema == "string" ? e2.$schema : "", n2 = new (t2.includes("2020-12") ? dm.default : t2.includes("2019-09") ? um.default : ts.default)({ allErrors: !0, verbose: !0, strict: !1, addUsedSchema: !1 });
  return (0, ns.default)(n2), n2;
}
function km(e2, t2, n2) {
  let r2 = ym(e2, n2), i2 = Om(r2).compile(r2);
  return i2(t2) ? [] : [...i2.errors ?? []];
}
function Am(e2) {
  let t2 = e2.keyword === "required" ? String(e2.params.missingProperty ?? "") : "";
  return `${[e2.instancePath.replace(/^\//, "").replaceAll("/", "."), t2].filter(Boolean).join(".") || "$"} ${e2.message || "\u6821\u9A8C\u5931\u8D25"}`;
}
function jm(e2, t2 = []) {
  if (t2.length) throw new fm(Am(t2[0]));
  if (!Z(e2)) throw new fm("\u811A\u672C\u53C2\u6570\u5FC5\u987B\u662F JSON \u5BF9\u8C61");
  return gm(e2);
}
var Mm = { class: "agent-form-field" };
var Nm = { key: 0, class: "agent-form-field__label" };
var Pm = ae(a({ __name: "AgentFormField", props: { label: {} }, setup(e2) {
  return (t2, n2) => (y(), O("section", Mm, [e2.label ? (y(), O("label", Nm, A(e2.label), 1)) : P("", !0), f(t2.$slots, "label", {}, void 0, !0), f(t2.$slots, "default", {}, void 0, !0)]));
} }), [["__scopeId", "data-v-87792535"]]);
var Fm = ae(a({ inheritAttrs: !1, __name: "AgentSelect", props: m({ optionLabel: { default: "label" }, optionValue: { default: "value" }, options: { default: () => [] } }, { modelValue: {}, modelModifiers: {} }), emits: ["update:modelValue"], setup(e2) {
  let t2 = te(e2, "modelValue"), n2 = e2, r2 = ne();
  function i2(e3) {
    return e3 ? typeof e3 == "string" ? e3 : Array.isArray(e3) ? e3.map((e4) => i2(e4)).filter(Boolean).join(" ") : typeof e3 == "object" ? Object.entries(e3).filter(([, e4]) => e4).map(([e4]) => e4).join(" ") : "" : "";
  }
  let a2 = T(() => ["agent-select-overlay", i2(n2.overlayClass ?? r2.overlayClass ?? r2["overlay-class"])].filter(Boolean).join(" "));
  return (e3, i3) => {
    let o2 = ie;
    return y(), I(j(se), h({ modelValue: t2.value, "onUpdate:modelValue": i3[0] ||= (e4) => t2.value = e4 }, { ...j(r2), ...n2 }, { class: "agent-select", "overlay-class": j(a2), fluid: "" }), { dropdownicon: N(() => [z(o2, { name: "base/rx_ic_chevron_down", size: "12" })]), option: N(({ option: t3 }) => [f(e3.$slots, "option", { option: t3 }, () => [D("span", null, A(t3?.[n2.optionLabel] ?? t3), 1)], !0)]), _: 3 }, 16, ["modelValue", "overlay-class"]);
  };
} }), [["__scopeId", "data-v-e0ce96a7"]]);
var Im = ["type", "disabled", "aria-busy"];
var Lm = { key: 0, class: "agent-button__icon i-svg-spinners:180-ring-with-bg", "aria-hidden": "true" };
var Rm = { class: "agent-button__label" };
var zm = ae(a({ __name: "AgentButton", props: { disabled: { type: Boolean }, icon: { type: Boolean, default: "base/rx_ic_plus" }, iconSize: { default: 18 }, label: { default: "button" }, loading: { type: Boolean }, nativeType: { default: "button" }, variant: { default: "accent" } }, setup(e2) {
  let t2 = e2;
  return (e3, n2) => {
    let r2 = ie;
    return y(), O("button", { class: E(["agent-button", `agent-button--${t2.variant}`]), type: t2.nativeType, disabled: t2.disabled || t2.loading, "aria-busy": t2.loading || void 0 }, [f(e3.$slots, "icon", {}, () => [t2.loading ? (y(), O("i", Lm)) : t2.icon ? (y(), I(r2, { key: 1, class: "agent-button__icon", name: t2.icon, size: t2.iconSize, "aria-hidden": "true" }, null, 8, ["name", "size"])) : P("", !0)], !0), D("span", Rm, [f(e3.$slots, "default", {}, () => [C(A(t2.label), 1)], !0)])], 10, Im);
  };
} }), [["__scopeId", "data-v-8463baf4"]]);
var Bm = ["for"];
var Vm = { key: 0, class: "agent-checkbox__label" };
var Hm = ae(a({ inheritAttrs: !1, __name: "AgentCheckbox", props: m({ label: {} }, { modelValue: { type: Boolean, default: !1 }, modelModifiers: {} }), emits: ["update:modelValue"], setup(e2) {
  let t2 = te(e2, "modelValue"), n2 = e2, r2 = ne(), i2 = ee(), a2 = T(() => n2.inputId || `agent-checkbox-${i2}`), o2 = T(() => {
    let { label: e3, ...t3 } = n2;
    return t3;
  });
  return (i3, c2) => {
    let l2 = ie;
    return y(), O("label", h(j(r2), { class: ["agent-checkbox", { "agent-checkbox--disabled": n2.disabled }], for: j(a2) }), [z(j(oe), h({ modelValue: t2.value, "onUpdate:modelValue": c2[0] ||= (e3) => t2.value = e3, class: "agent-checkbox__control" }, j(o2), { binary: !0, "input-id": j(a2) }), { icon: N((e3) => [f(i3.$slots, "icon", F(s(e3)), () => [e3.checked ? (y(), I(l2, { key: 0, class: E(e3.class), name: "roxy-agent/rx-ic-check", color: "var(--color-text-primary-inverse)", size: "12" }, null, 8, ["class"])) : P("", !0)], !0)]), _: 3 }, 16, ["modelValue", "input-id"]), e2.label || i3.$slots.default ? (y(), O("span", Vm, [f(i3.$slots, "default", {}, () => [C(A(e2.label), 1)], !0)])) : P("", !0)], 16, Bm);
  };
} }), [["__scopeId", "data-v-15d88f09"]]);
var Um = { key: 0, class: "agent-badge__dot", "aria-hidden": "true" };
var Wm = { class: "agent-badge__label" };
var Gm = ae(a({ __name: "AgentBadge", props: { icon: {}, label: {}, type: { default: "default" } }, setup(e2) {
  let t2 = e2, n2 = T(() => ({ default: { className: "agent-badge--default", label: "badge" }, open: { className: "agent-badge--open", label: "badge" }, scheduled: { className: "agent-badge--scheduled", label: "badge" }, running: { className: "agent-badge--running", label: "badge" }, completed: { className: "agent-badge--completed", label: "badge" }, skill: { className: "agent-badge--skill", icon: "base/rx_ic_skills_store", label: "Skill" }, script: { className: "agent-badge--script", icon: "base/rx_ic_doc_code", label: "Script" }, prompt: { className: "agent-badge--prompt", icon: "base/rx_ic_template", label: "Prompt" }, window: { className: "agent-badge--window", icon: "base/rx_ic_browser", label: "Window" } })[t2.type]), r2 = T(() => ["completed", "default", "running", "scheduled"].includes(t2.type)), i2 = T(() => t2.icon ?? n2.value.icon), a2 = T(() => t2.label ?? n2.value.label);
  return (e3, t3) => {
    let o2 = ie;
    return y(), O("span", { class: E(["agent-badge", [j(n2).className, { "agent-badge--status": j(r2) }]]) }, [j(r2) ? (y(), O("span", Um)) : f(e3.$slots, "icon", {}, () => [j(i2) ? (y(), I(o2, { key: 0, class: "agent-badge__icon", name: j(i2), size: "16", "aria-hidden": "true" }, null, 8, ["name"])) : P("", !0)], !0, 1), D("span", Wm, [f(e3.$slots, "default", {}, () => [C(A(j(a2)), 1)], !0)])], 2);
  };
} }), [["__scopeId", "data-v-07e3df1c"]]);
function Km(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function qm(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? Km(Object(n2), !0).forEach(function(t3) {
      Zm(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : Km(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function Jm(e2, t2) {
  if (typeof e2 != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2 || "default");
    if (typeof r2 != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
function Ym(e2) {
  var t2 = Jm(e2, "string");
  return typeof t2 == "symbol" ? t2 : t2 + "";
}
function Xm(e2) {
  "@babel/helpers - typeof";
  return Xm = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, Xm(e2);
}
function Zm(e2, t2, n2) {
  return t2 = Ym(t2), t2 in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function Qm(e2, t2) {
  if (e2 == null) return {};
  var n2 = {};
  for (var r2 in e2) if (Object.prototype.hasOwnProperty.call(e2, r2)) {
    if (t2.indexOf(r2) >= 0) continue;
    n2[r2] = e2[r2];
  }
  return n2;
}
function $m(e2, t2) {
  if (e2 == null) return {};
  var n2 = Qm(e2, t2), r2, i2;
  if (Object.getOwnPropertySymbols) {
    var a2 = Object.getOwnPropertySymbols(e2);
    for (i2 = 0; i2 < a2.length; i2++) r2 = a2[i2], !(t2.indexOf(r2) >= 0) && Object.prototype.propertyIsEnumerable.call(e2, r2) && (n2[r2] = e2[r2]);
  }
  return n2;
}
var eh = a({ name: "UnknownRenderer" });
function th(e2, t2, n2, r2, i2, a2) {
  return y(), O("div", null, "No applicable renderer found.");
}
eh.render = th;
var nh = ["control"];
var rh = ["rootSchema"];
var ih = ["control"];
var oh = ["layout"];
var Q = function() {
  return { schema: { required: !0, type: [Object, Boolean] }, uischema: { required: !0, type: Object }, path: { required: !0, type: String }, enabled: { required: !1, type: Boolean, default: void 0 }, readonly: { required: !1, type: Boolean, default: void 0 }, renderers: { required: !1, type: Array, default: void 0 }, cells: { required: !1, type: Array, default: void 0 }, config: { required: !1, type: Object, default: void 0 } };
};
function sh(e2, t2, n2) {
  var r2 = bh(), i2 = xh(), a2 = _(void 0), o2 = T(function() {
    return qm(qm(qm({}, e2), t2({ jsonforms: r2 }, e2)), {}, { id: a2.value });
  }), s2 = n2?.(i2);
  return p(function() {
    o2.value.uischema.scope && (a2.value = ys.createId(o2.value.uischema.scope));
  }), R(function() {
    return e2.schema;
  }, function(e3, t3) {
    e3 !== t3 && Fl(o2.value.uischema) && (a2.value && ys.removeId(a2.value), a2.value = ys.createId(o2.value.uischema.scope));
  }), d(function() {
    a2.value &&= (ys.removeId(a2.value), void 0);
  }), qm({ control: o2 }, s2);
}
var ch = function(e2) {
  return sh(e2, Ru, zu);
};
var lh = function(e2) {
  return sh(e2, Uu, zu);
};
var uh = function(e2) {
  return sh(e2, Bu, zu);
};
var dh = function(e2) {
  return sh(e2, Vu, zu);
};
var fh = function(e2) {
  return sh(e2, Wu, Gu);
};
var ph = function(e2) {
  return sh(e2, Qu, zu);
};
var mh = function(e2) {
  return sh(e2, Hu, Ku);
};
var hh = function(e2) {
  var t2 = sh(e2, Yu), n2 = t2.control, r2 = $m(t2, nh);
  return qm({ layout: n2 }, r2);
};
var gh = function(e2) {
  var t2 = bh(), n2 = T(function() {
    return Xu({ jsonforms: t2 }, e2);
  }), r2 = T(function() {
    return n2.value.rootSchema;
  });
  return { renderer: T(function() {
    var e3 = n2.value;
    return e3.rootSchema, $m(e3, rh);
  }), rootSchema: r2 };
};
var _h = function(e2) {
  var t2 = sh(e2, $u), n2 = t2.control, r2 = $m(t2, ih);
  return qm({ label: n2 }, r2);
};
var yh = function(e2) {
  var t2 = hh(e2), n2 = t2.layout, r2 = $m(t2, oh);
  return qm({ layout: n2, categories: n2.value.uischema.elements.map(function(t3) {
    return hh(qm(qm({}, e2), {}, { uischema: t3 })).layout;
  }) }, r2);
};
function bh(e2) {
  var t2 = M("jsonforms");
  if (!t2 && !e2) throw Error("'jsonforms' couldn't be injected. Are you within JSON Forms?");
  return t2;
}
function xh(e2) {
  var t2 = M("dispatch");
  if (!t2 && !e2) throw Error("'dispatch' couldn't be injected. Are you within JSON Forms?");
  return t2;
}
var Sh = a({ name: "DispatchRenderer", props: qm({}, Q()), setup: function(e2) {
  return gh(e2);
}, computed: { determinedRenderer: function() {
  var e2 = this, t2 = { rootSchema: this.rootSchema, config: this.renderer.config }, n2 = (0, us.default)(this.renderer.renderers, function(n3) {
    return n3.tester(e2.renderer.uischema, e2.renderer.schema, t2);
  });
  return n2 === void 0 || n2.tester(this.renderer.uischema, this.renderer.schema, t2) === -1 ? eh : n2.renderer;
} } });
function Ch(e2, t2, n2, r2, i2, a2) {
  return y(), I(x(e2.determinedRenderer), F(s(e2.renderer)), re({ _: 2 }, [L(e2.$slots, function(t3, n3) {
    return { name: n3, fn: N(function() {
      return [f(e2.$slots, n3)];
    }) };
  })]), 1040);
}
Sh.render = Ch;
var Eh = function(e2) {
  return e2 && Xm(e2) === "object";
};
var Dh = w([]);
var Oh = a({ name: "JsonForms", components: { DispatchRenderer: Sh }, provide: function() {
  return { jsonforms: this.jsonforms, dispatch: this.dispatch };
}, props: { data: { required: !1, type: [String, Number, Boolean, Array, Object], default: void 0 }, schema: { required: !1, type: [Object, Boolean], default: void 0 }, uischema: { required: !1, type: Object, default: void 0 }, renderers: { required: !0, type: Array }, cells: { required: !1, type: Array, default: function() {
  return [];
} }, config: { required: !1, type: Object, default: void 0 }, readonly: { required: !1, type: Boolean, default: !1 }, uischemas: { required: !1, type: Array, default: function() {
  return [];
} }, validationMode: { required: !1, type: String, default: "ValidateAndShow" }, ajv: { required: !1, type: Object, default: void 0 }, i18n: { required: !1, type: Object, default: void 0 }, additionalErrors: { required: !1, type: Array, default: function() {
  return Dh;
} }, middleware: { required: !1, type: Function, default: su } }, emits: ["change"], data: function() {
  var e2 = this, t2 = this.data, n2 = Eh(t2) ? t2 : {}, r2 = this.schema ?? Oc.jsonSchema(n2), i2 = this.uischema ?? Oc.uiSchema(r2, void 0, void 0, r2);
  return { schemaToUse: r2, dataToUse: t2, uischemaToUse: i2, jsonforms: { core: (function() {
    var n3 = { data: t2, schema: r2, uischema: i2 };
    return e2.middleware(n3, rl.init(t2, r2, i2, { validationMode: e2.validationMode, ajv: e2.ajv, additionalErrors: e2.additionalErrors }), ml);
  })(), config: ol(void 0, rl.setConfig(this.config)), i18n: Pl(this.i18n, rl.updateI18n(this.i18n?.locale, this.i18n?.translate, this.i18n?.translateError)), renderers: this.renderers, cells: this.cells, uischemas: this.uischemas, readonly: this.readonly } };
}, computed: { coreDataToUpdate: function() {
  return [this.dataToUse, this.schemaToUse, this.uischemaToUse, this.validationMode, this.ajv, this.additionalErrors];
}, eventToEmit: function() {
  return { data: this.jsonforms.core.data, errors: this.jsonforms.core.errors };
} }, watch: { schema: function(e2) {
  var t2 = Eh(this.data) ? this.data : {};
  this.schemaToUse = e2 ?? Oc.jsonSchema(t2), this.uischema || (this.uischemaToUse = Oc.uiSchema(this.schemaToUse, void 0, void 0, this.schemaToUse));
}, uischema: function(e2) {
  this.uischemaToUse = e2 ?? Oc.uiSchema(this.schemaToUse, void 0, void 0, this.schemaToUse);
}, data: function(e2) {
  this.dataToUse = e2;
}, renderers: function(e2) {
  this.jsonforms.renderers = e2;
}, cells: function(e2) {
  this.jsonforms.cells = e2;
}, uischemas: function(e2) {
  this.jsonforms.uischemas = e2;
}, config: { handler: function(e2) {
  this.jsonforms.config = ol(void 0, rl.setConfig(e2));
}, deep: !0 }, readonly: function(e2) {
  this.jsonforms.readonly = e2;
}, coreDataToUpdate: function() {
  this.jsonforms.core = this.middleware(this.jsonforms.core, rl.updateCore(this.dataToUse, this.schemaToUse, this.uischemaToUse, { validationMode: this.validationMode, ajv: this.ajv, additionalErrors: this.additionalErrors }), ml);
}, eventToEmit: function(e2) {
  this.$emit("change", e2);
}, i18n: { handler: function(e2) {
  this.jsonforms.i18n = Pl(this.jsonforms.i18n, rl.updateI18n(e2?.locale, e2?.translate, e2?.translateError));
}, deep: !0 } }, mounted: function() {
  this.$emit("change", { data: this.jsonforms.core.data, errors: this.jsonforms.core.errors });
}, methods: { dispatch: function(e2) {
  this.jsonforms.core = this.middleware(this.jsonforms.core, e2, ml);
} } });
function kh(e2, t2, n2, r2, i2, a2) {
  var o2 = b("dispatch-renderer");
  return y(), I(o2, { schema: e2.jsonforms.core.schema, uischema: e2.jsonforms.core.uischema, path: "" }, null, 8, ["schema", "uischema"]);
}
Oh.render = kh;
var Ah = i(((e2, t2) => {
  var n2 = ra();
  t2.exports = da()(function(e3, t3, r2, i2) {
    n2(e3, t3, r2, i2);
  });
}));
var jh = i(((e2, t2) => {
  var n2 = Ji();
  function r2(e3) {
    return n2(e3) ? void 0 : e3;
  }
  t2.exports = r2;
}));
var Mh = i(((e2, t2) => {
  var n2 = Ge(), r2 = ka(), i2 = Mo(), a2 = Yt(), o2 = Zi(), s2 = jh(), c2 = So(), l2 = ya(), u2 = 1, d2 = 2, f2 = 4;
  t2.exports = c2(function(e3, t3) {
    var c3 = {};
    if (e3 == null) return c3;
    var p2 = !1;
    t3 = n2(t3, function(t4) {
      return t4 = a2(t4, e3), p2 ||= t4.length > 1, t4;
    }), o2(e3, l2(e3), c3), p2 && (c3 = r2(c3, u2 | d2 | f2, s2));
    for (var m2 = t3.length; m2--; ) i2(c3, t3[m2]);
    return c3;
  });
}));
var Nh = n(Ah());
var Ph = n(Mh());
function Fh(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function $(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? Fh(Object(n2), !0).forEach(function(t3) {
      Rh(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : Fh(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function Ih(e2, t2) {
  if (typeof e2 != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2 || "default");
    if (typeof r2 != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
function Lh(e2) {
  var t2 = Ih(e2, "string");
  return typeof t2 == "symbol" ? t2 : t2 + "";
}
function Rh(e2, t2, n2) {
  return t2 = Lh(t2), t2 in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function zh(e2, t2) {
  return t2 ||= e2.slice(0), Object.freeze(Object.defineProperties(e2, { raw: { value: Object.freeze(t2) } }));
}
function Bh(e2) {
  return Vh(e2) || Hh(e2) || Uh(e2) || Gh();
}
function Vh(e2) {
  if (Array.isArray(e2)) return Wh(e2);
}
function Hh(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function Uh(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return Wh(e2, t2);
    var n2 = Object.prototype.toString.call(e2).slice(8, -1);
    if (n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set") return Array.from(e2);
    if (n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2)) return Wh(e2, t2);
  }
}
function Wh(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function Gh() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
var Kh = { control: { root: "control", wrapper: "wrapper", label: "label", description: "description", input: "input", error: "error", textarea: "text-area", select: "select", option: "option", asterisk: "asterisk", required: "required" }, verticalLayout: { root: "vertical-layout", item: "vertical-layout-item" }, horizontalLayout: { root: "horizontal-layout", item: "horizontal-layout-item" }, group: { root: "group", label: "group-label", item: "group-item" }, arrayList: { root: "array-list", legend: "array-list-legend", addButton: "array-list-add", label: "array-list-label", itemWrapper: "array-list-item-wrapper", noData: "array-list-no-data", item: "array-list-item", itemToolbar: "array-list-item-toolbar", itemLabel: "array-list-item-label", itemContent: "array-list-item-content", itemExpanded: "expanded", itemMoveUp: "array-list-item-move-up", itemMoveDown: "array-list-item-move-down", itemDelete: "array-list-item-delete" }, label: { root: "label-element" }, dialog: { root: "dialog-root", title: "dialog-title", body: "dialog-body", actions: "dialog-actions", buttonPrimary: "dialog-button-primary", buttonSecondary: "dialog-button-secondary" }, oneOf: { root: "one-of" }, categorization: { root: "categorization", category: "categorization-category", selected: "categorization-selected", panel: "categorization-panel", stepper: "categorization-stepper", stepperBadge: "categorization-stepper-badge", stepperLine: "categorization-stepper-line", stepperFooter: "categorization-stepper-footer", stepperButtonBack: "categorization-stepper-button-back", stepperButtonNext: "categorization-stepper-button-next" } };
var qh = function() {
  return { control: {}, verticalLayout: {}, horizontalLayout: {}, group: {}, arrayList: {}, label: {}, dialog: {}, oneOf: {}, categorization: {} };
};
var Jh = function(e2) {
  var t2, n2, r2 = M("styles", Kh);
  if (!(e2 != null && (t2 = e2.options) != null && t2.styles)) return r2;
  var i2 = qh();
  return r2 ? (0, as.default)(i2, r2) : (0, as.default)(i2, Kh), e2 != null && (n2 = e2.options) != null && n2.styles && (0, as.default)(i2, e2.options.styles), i2;
};
var Yh = function(e2) {
  var t2 = [...arguments].slice(1);
  return e2.reduce(function(e3, n2, r2) {
    return `${e3}${n2}${t2[r2] || ""}`;
  }, "").trim();
};
var Xh = function(e2, t2) {
  var n2 = (0, os.default)(e2);
  return (0, Nh.default)(n2, t2, function(e3, t3) {
    if (typeof e3 == "string" && typeof t3 == "string") return `${e3} ${t3}`;
  }), n2;
};
var Zh = function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : function(e3) {
    return e3.value;
  }, n2 = T(function() {
    return (0, as.default)({}, (0, os.default)(e2.control.value.config), (0, os.default)(e2.control.value.uischema.options));
  }), r2 = _(!1), i2 = function(n3) {
    e2.handleChange(e2.control.value.path, t2(n3.target));
  }, a2 = T(function() {
    var t3 = e2.control.value;
    return { id: t3.id, description: t3.description, errors: t3.errors, label: t3.label, visible: t3.visible, required: t3.required };
  });
  return $($({}, e2), {}, { styles: Jh(e2.control.value.uischema), isFocused: r2, appliedOptions: n2, controlWrapper: a2, onChange: i2 });
};
var Qh = function(e2) {
  var t2 = T(function() {
    return (0, as.default)({}, (0, os.default)(e2.layout.value.config), (0, os.default)(e2.layout.value.uischema.options));
  });
  return $($({}, e2), {}, { styles: Jh(e2.layout.value.uischema), appliedOptions: t2 });
};
var $h = function(e2) {
  var t2 = T(function() {
    return (0, as.default)({}, (0, os.default)(e2.label.value.config), (0, os.default)(e2.label.value.uischema.options));
  });
  return $($({}, e2), {}, { styles: Jh(e2.label.value.uischema), appliedOptions: t2 });
};
var eg = function(e2) {
  var t2 = T(function() {
    return (0, as.default)({}, (0, os.default)(e2.control.value.config), (0, os.default)(e2.control.value.uischema.options));
  }), n2 = T(function() {
    return ou(e2.control.value.uischemas, e2.control.value.schema, e2.control.value.uischema.scope, e2.control.value.path, void 0, e2.control.value.uischema, e2.control.value.rootSchema);
  });
  return $($({}, e2), {}, { styles: Jh(e2.control.value.uischema), appliedOptions: t2, childUiSchema: n2, childLabelForIndex: function(t3) {
    var n3 = e2.control.value.uischema.options?.childLabelProp ?? oc(e2.control.value.schema);
    if (!n3) return `${t3}`;
    var r2 = fc.data(e2.control.value.data, bs(`${t3}`, n3));
    return r2 == null || Number.isNaN(r2) ? "" : `${r2}`;
  } });
};
var tg;
var ng;
var rg = a({ name: "ArrayListElement", props: { initiallyExpanded: { required: !1, type: Boolean, default: !1 }, label: { required: !1, type: String, default: "" }, moveUpEnabled: { required: !1, type: Boolean, default: !0 }, moveDownEnabled: { required: !1, type: Boolean, default: !0 }, moveUp: { required: !1, type: Function, default: void 0 }, moveDown: { required: !1, type: Function, default: void 0 }, deleteEnabled: { required: !1, type: Boolean, default: !0 }, delete: { required: !1, type: Function, default: void 0 }, styles: { required: !0, type: Object } }, data: function() {
  return { expanded: this.initiallyExpanded };
}, computed: { contentClasses: function() {
  return Yh(tg ||= zh(["", " ", ""]), this.styles.arrayList.itemContent, this.expanded && this.styles.arrayList.itemExpanded);
}, toolbarClasses: function() {
  return Yh(ng ||= zh(["", " ", ""]), this.styles.arrayList.itemToolbar, this.expanded && this.styles.arrayList.itemExpanded);
} }, methods: { expandClicked: function() {
  this.expanded = !this.expanded;
}, moveUpClicked: function(e2) {
  var t2;
  e2.stopPropagation(), (t2 = this.moveUp) == null || t2.call(this);
}, moveDownClicked: function(e2) {
  var t2;
  e2.stopPropagation(), (t2 = this.moveDown) == null || t2.call(this);
}, deleteClicked: function(e2) {
  var t2;
  e2.stopPropagation(), (t2 = this.delete) == null || t2.call(this);
} } });
var ig = ["disabled"];
var ag = ["disabled"];
var og = ["disabled"];
function sg(e2, t2, n2, r2, i2, a2) {
  return y(), O("div", { class: E(e2.styles.arrayList.item) }, [D("div", { class: E(e2.toolbarClasses), onClick: t2[3] ||= function() {
    return e2.expandClicked && e2.expandClicked.apply(e2, arguments);
  } }, [D("div", { class: E(e2.styles.arrayList.itemLabel) }, A(e2.label), 3), D("button", { disabled: !e2.moveUpEnabled, class: E(e2.styles.arrayList.itemMoveUp), type: "button", onClick: t2[0] ||= function() {
    return e2.moveUpClicked && e2.moveUpClicked.apply(e2, arguments);
  } }, " \u2191 ", 10, ig), D("button", { disabled: !e2.moveDownEnabled, class: E(e2.styles.arrayList.itemMoveDown), type: "button", onClick: t2[1] ||= function() {
    return e2.moveDownClicked && e2.moveDownClicked.apply(e2, arguments);
  } }, " \u2193 ", 10, ag), D("button", { disabled: !e2.deleteEnabled, class: E(e2.styles.arrayList.itemDelete), type: "button", onClick: t2[2] ||= function() {
    return e2.deleteClicked && e2.deleteClicked.apply(e2, arguments);
  } }, " \u{1F5D9} ", 10, og)], 2), D("div", { class: E(e2.contentClasses) }, [f(e2.$slots, "default")], 2)], 2);
}
rg.render = sg;
var cg = a({ name: "ArrayListRenderer", components: { ArrayListElement: rg, DispatchRenderer: Sh }, props: $({}, Q()), setup: function(e2) {
  return eg(fh(e2));
}, computed: { noData: function() {
  return !this.control.data || this.control.data.length === 0;
}, arraySchema: function() {
  return fc.schema(this.schema, this.control.uischema.scope, this.control.rootSchema);
}, maxItemsReached: function() {
  return this.arraySchema !== void 0 && this.arraySchema.maxItems !== void 0 && this.control.data !== void 0 && this.control.data.length >= this.arraySchema.maxItems;
}, minItemsReached: function() {
  return this.arraySchema !== void 0 && this.arraySchema.minItems !== void 0 && this.control.data !== void 0 && this.control.data.length <= this.arraySchema.minItems;
}, translations: function() {
  var e2, t2 = bh();
  return Dl((t2 == null || (e2 = t2.i18n) == null ? void 0 : e2.translate) ?? Nl.translate, hl, this.control.i18nKeyPrefix, this.control.label);
} }, methods: { composePaths: bs, createDefaultValue: ju, addButtonClick: function() {
  this.addItem(this.control.path, ju(this.control.schema, this.control.rootSchema))();
} } });
var lg = { renderer: cg, tester: X(2, Rl("array")) };
var ug = ["disabled"];
function dg(e2, t2, n2, r2, i2, a2) {
  var o2 = b("dispatch-renderer"), s2 = b("array-list-element");
  return e2.control.visible ? (y(), O("fieldset", { key: 0, class: E(e2.styles.arrayList.root) }, [D("legend", { class: E(e2.styles.arrayList.legend) }, [D("button", { class: E(e2.styles.arrayList.addButton), type: "button", disabled: !e2.control.enabled || e2.appliedOptions.restrict && e2.maxItemsReached, onClick: t2[0] ||= function() {
    return e2.addButtonClick && e2.addButtonClick.apply(e2, arguments);
  } }, " + ", 10, ug), D("label", { class: E(e2.styles.arrayList.label) }, A(e2.control.label), 3)], 2), (y(!0), O(k, null, L(e2.control.data, function(t3, n3) {
    return y(), O("div", { key: `${e2.control.path}-${n3}`, class: E(e2.styles.arrayList.itemWrapper) }, [z(s2, { "move-up": e2.moveUp(e2.control.path, n3), "move-up-enabled": e2.control.enabled && n3 > 0, "move-down": e2.moveDown(e2.control.path, n3), "move-down-enabled": e2.control.enabled && n3 < e2.control.data.length - 1, "delete-enabled": e2.control.enabled && !e2.minItemsReached, delete: e2.removeItems(e2.control.path, [n3]), label: e2.childLabelForIndex(n3), styles: e2.styles }, { default: N(function() {
      return [z(o2, { schema: e2.control.schema, uischema: e2.childUiSchema, path: e2.composePaths(e2.control.path, `${n3}`), enabled: e2.control.enabled, renderers: e2.control.renderers, cells: e2.control.cells }, null, 8, ["schema", "uischema", "path", "enabled", "renderers", "cells"])];
    }), _: 2 }, 1032, ["move-up", "move-up-enabled", "move-down", "move-down-enabled", "delete-enabled", "delete", "label", "styles"])], 2);
  }), 128)), e2.noData ? (y(), O("div", { key: 0, class: E(e2.styles.arrayList.noData) }, A(e2.translations.noDataMessage), 3)) : P("", !0)], 2)) : P("", !0);
}
cg.render = dg;
var fg = [lg];
var pg = a({ name: "ControlWrapper", props: { id: { required: !0, type: String }, description: { required: !1, type: String, default: void 0 }, errors: { required: !1, type: String, default: void 0 }, label: { required: !1, type: String, default: void 0 }, appliedOptions: { required: !1, type: Object, default: void 0 }, visible: { required: !1, type: Boolean, default: !0 }, required: { required: !1, type: Boolean, default: !1 }, isFocused: { required: !1, type: Boolean, default: !1 }, styles: { required: !0, type: Object } }, computed: { showDescription: function() {
  var e2;
  return !Fu(this.visible, this.description, this.isFocused, !!((e2 = this.appliedOptions) != null && e2.showUnfocusedDescription));
}, showAsterisk: function() {
  var e2;
  return this.required && !((e2 = this.appliedOptions) != null && e2.hideRequiredAsterisk);
} } });
var mg = ["id"];
var hg = ["for"];
function gg(e2, t2, n2, r2, i2, a2) {
  return e2.visible ? (y(), O("div", { key: 0, id: e2.id, class: E(e2.styles.control.root) }, [D("label", { for: e2.id + "-input", class: E([e2.styles.control.label, e2.required ? e2.styles.control.required : ""]) }, [C(A(e2.label) + " ", 1), e2.showAsterisk ? (y(), O("span", { key: 0, class: E(e2.styles.control.asterisk) }, "*", 2)) : P("", !0)], 10, hg), D("div", { class: E(e2.styles.control.wrapper) }, [f(e2.$slots, "default")], 2), D("div", { class: E(e2.errors ? e2.styles.control.error : e2.styles.control.description) }, A(e2.errors ? e2.errors : e2.showDescription ? e2.description : null), 3)], 10, mg)) : P("", !0);
}
pg.render = gg;
var _g = a({ name: "StringControlRenderer", components: { ControlWrapper: pg }, props: $({}, Q()), setup: function(e2) {
  return Zh(ch(e2), function(e3) {
    return e3.value || void 0;
  });
} });
var vg = { renderer: _g, tester: X(1, Xl) };
var yg = ["id", "value", "disabled", "autofocus", "placeholder"];
function bg(e2, t2, n2, r2, i2, a2) {
  var o2 = b("control-wrapper");
  return y(), I(o2, h(e2.controlWrapper, { styles: e2.styles, "is-focused": e2.isFocused, "applied-options": e2.appliedOptions }), { default: N(function() {
    return [D("input", { id: e2.control.id + "-input", class: E(e2.styles.control.input), value: e2.control.data, disabled: !e2.control.enabled, autofocus: e2.appliedOptions.focus, placeholder: e2.appliedOptions.placeholder, onChange: t2[0] ||= function() {
      return e2.onChange && e2.onChange.apply(e2, arguments);
    }, onFocus: t2[1] ||= function(t3) {
      return e2.isFocused = !0;
    }, onBlur: t2[2] ||= function(t3) {
      return e2.isFocused = !1;
    } }, null, 42, yg)];
  }), _: 1 }, 16, ["styles", "is-focused", "applied-options"]);
}
_g.render = bg;
var xg = a({ name: "MultiStringControlRenderer", components: { ControlWrapper: pg }, props: $({}, Q()), setup: function(e2) {
  return Zh(ch(e2), function(e3) {
    return e3.value || void 0;
  });
} });
var Sg = { renderer: xg, tester: X(2, Y(Xl, Zl)) };
var Cg = ["id", "value", "disabled", "autofocus", "placeholder"];
function wg(e2, t2, n2, r2, i2, a2) {
  var o2 = b("control-wrapper");
  return y(), I(o2, h(e2.controlWrapper, { styles: e2.styles, "is-focused": e2.isFocused, "applied-options": e2.appliedOptions }), { default: N(function() {
    return [D("textarea", { id: e2.control.id + "-input", class: E(e2.styles.control.textarea), value: e2.control.data, disabled: !e2.control.enabled, autofocus: e2.appliedOptions.focus, placeholder: e2.appliedOptions.placeholder, onChange: t2[0] ||= function() {
      return e2.onChange && e2.onChange.apply(e2, arguments);
    }, onFocus: t2[1] ||= function(t3) {
      return e2.isFocused = !0;
    }, onBlur: t2[2] ||= function(t3) {
      return e2.isFocused = !1;
    } }, null, 42, Cg)];
  }), _: 1 }, 16, ["styles", "is-focused", "applied-options"]);
}
xg.render = wg;
var Tg = a({ name: "NumberControlRenderer", components: { ControlWrapper: pg }, props: $({}, Q()), setup: function(e2) {
  return Zh(ch(e2), function(e3) {
    return e3.value === "" ? void 0 : Number(e3.value);
  });
}, computed: { step: function() {
  return this.appliedOptions.step ?? 0.1;
} } });
var Eg = { renderer: Tg, tester: X(1, Yl) };
var Dg = ["id", "step", "value", "disabled", "autofocus", "placeholder"];
function Og(e2, t2, n2, r2, i2, a2) {
  var o2 = b("control-wrapper");
  return y(), I(o2, h(e2.controlWrapper, { styles: e2.styles, "is-focused": e2.isFocused, "applied-options": e2.appliedOptions }), { default: N(function() {
    return [D("input", { id: e2.control.id + "-input", type: "number", step: e2.step, class: E(e2.styles.control.input), value: e2.control.data, disabled: !e2.control.enabled, autofocus: e2.appliedOptions.focus, placeholder: e2.appliedOptions.placeholder, onChange: t2[0] ||= function() {
      return e2.onChange && e2.onChange.apply(e2, arguments);
    }, onFocus: t2[1] ||= function(t3) {
      return e2.isFocused = !0;
    }, onBlur: t2[2] ||= function(t3) {
      return e2.isFocused = !1;
    } }, null, 42, Dg)];
  }), _: 1 }, 16, ["styles", "is-focused", "applied-options"]);
}
Tg.render = Og;
var kg = a({ name: "IntegerControlRenderer", components: { ControlWrapper: pg }, props: $({}, Q()), setup: function(e2) {
  return Zh(ch(e2), function(e3) {
    return e3.value === "" ? void 0 : parseInt(e3.value, 10);
  });
} });
var Ag = { renderer: kg, tester: X(1, Jl) };
var jg = ["id", "value", "disabled", "autofocus", "placeholder"];
function Mg(e2, t2, n2, r2, i2, a2) {
  var o2 = b("control-wrapper");
  return y(), I(o2, h(e2.controlWrapper, { styles: e2.styles, "is-focused": e2.isFocused, "applied-options": e2.appliedOptions }), { default: N(function() {
    return [D("input", { id: e2.control.id + "-input", type: "number", step: 1, class: E(e2.styles.control.input), value: e2.control.data, disabled: !e2.control.enabled, autofocus: e2.appliedOptions.focus, placeholder: e2.appliedOptions.placeholder, onChange: t2[0] ||= function() {
      return e2.onChange && e2.onChange.apply(e2, arguments);
    }, onFocus: t2[1] ||= function(t3) {
      return e2.isFocused = !0;
    }, onBlur: t2[2] ||= function(t3) {
      return e2.isFocused = !1;
    } }, null, 42, jg)];
  }), _: 1 }, 16, ["styles", "is-focused", "applied-options"]);
}
kg.render = Mg;
var Ng = a({ name: "EnumControlRenderer", components: { ControlWrapper: pg }, props: $({}, Q()), setup: function(e2) {
  return Zh(uh(e2), function(e3) {
    return e3.selectedIndex === 0 ? void 0 : e3.value;
  });
} });
var Pg = { renderer: Ng, tester: X(2, Kl) };
var Fg = ["id", "value", "disabled", "autofocus"];
var Ig = ["value", "label"];
function Lg(e2, t2, n2, r2, i2, a2) {
  var o2 = b("control-wrapper");
  return y(), I(o2, h(e2.controlWrapper, { styles: e2.styles, "is-focused": e2.isFocused, "applied-options": e2.appliedOptions }), { default: N(function() {
    return [D("select", { id: e2.control.id + "-input", class: E(e2.styles.control.select), value: e2.control.data, disabled: !e2.control.enabled, autofocus: e2.appliedOptions.focus, onChange: t2[0] ||= function() {
      return e2.onChange && e2.onChange.apply(e2, arguments);
    }, onFocus: t2[1] ||= function(t3) {
      return e2.isFocused = !0;
    }, onBlur: t2[2] ||= function(t3) {
      return e2.isFocused = !1;
    } }, [D("option", { key: "empty", value: "", class: E(e2.styles.control.option) }, null, 2), (y(!0), O(k, null, L(e2.control.options, function(t3) {
      return y(), O("option", { key: t3.value, value: t3.value, label: t3.label, class: E(e2.styles.control.option) }, null, 10, Ig);
    }), 128))], 42, Fg)];
  }), _: 1 }, 16, ["styles", "is-focused", "applied-options"]);
}
Ng.render = Lg;
var Rg = a({ name: "EnumOneofControlRenderer", components: { ControlWrapper: pg }, props: $({}, Q()), setup: function(e2) {
  return Zh(dh(e2), function(e3) {
    return e3.selectedIndex === 0 ? void 0 : e3.value;
  });
} });
var zg = { renderer: Rg, tester: X(5, ql) };
var Bg = ["id", "value", "disabled", "autofocus"];
var Vg = ["value", "label"];
function Hg(e2, t2, n2, r2, i2, a2) {
  var o2 = b("control-wrapper");
  return y(), I(o2, h(e2.controlWrapper, { styles: e2.styles, "is-focused": e2.isFocused, "applied-options": e2.appliedOptions }), { default: N(function() {
    return [D("select", { id: e2.control.id + "-input", class: E(e2.styles.control.select), value: e2.control.data, disabled: !e2.control.enabled, autofocus: e2.appliedOptions.focus, onChange: t2[0] ||= function() {
      return e2.onChange && e2.onChange.apply(e2, arguments);
    }, onFocus: t2[1] ||= function(t3) {
      return e2.isFocused = !0;
    }, onBlur: t2[2] ||= function(t3) {
      return e2.isFocused = !1;
    } }, [D("option", { key: "empty", value: "", class: E(e2.styles.control.option) }, null, 2), (y(!0), O(k, null, L(e2.control.options, function(t3) {
      return y(), O("option", { key: t3.value, value: t3.value, label: t3.label, class: E(e2.styles.control.option) }, null, 10, Vg);
    }), 128))], 42, Bg)];
  }), _: 1 }, 16, ["styles", "is-focused", "applied-options"]);
}
Rg.render = Hg;
var Ug = a({ name: "DateControlRenderer", components: { ControlWrapper: pg }, props: $({}, Q()), setup: function(e2) {
  return Zh(ch(e2), function(e3) {
    return e3.value || void 0;
  });
} });
var Wg = { renderer: Ug, tester: X(2, Ql) };
var Gg = ["id", "value", "disabled", "autofocus", "placeholder"];
function Kg(e2, t2, n2, r2, i2, a2) {
  var o2 = b("control-wrapper");
  return y(), I(o2, h(e2.controlWrapper, { styles: e2.styles, "is-focused": e2.isFocused, "applied-options": e2.appliedOptions }), { default: N(function() {
    return [D("input", { id: e2.control.id + "-input", type: "date", class: E(e2.styles.control.input), value: e2.control.data, disabled: !e2.control.enabled, autofocus: e2.appliedOptions.focus, placeholder: e2.appliedOptions.placeholder, onChange: t2[0] ||= function() {
      return e2.onChange && e2.onChange.apply(e2, arguments);
    }, onFocus: t2[1] ||= function(t3) {
      return e2.isFocused = !0;
    }, onBlur: t2[2] ||= function(t3) {
      return e2.isFocused = !1;
    } }, null, 42, Gg)];
  }), _: 1 }, 16, ["styles", "is-focused", "applied-options"]);
}
Ug.render = Kg;
var qg = function(e2) {
  return e2 === "" ? void 0 : e2 + ":00.000Z";
};
var Jg = a({ name: "DatetimeControlRenderer", components: { ControlWrapper: pg }, props: $({}, Q()), setup: function(e2) {
  return Zh(ch(e2), function(e3) {
    return qg(e3.value);
  });
}, computed: { dataTime: function() {
  return (this.control.data ?? "").substr(0, 16);
} } });
var Yg = { renderer: Jg, tester: X(2, eu) };
var Xg = ["id", "value", "disabled", "autofocus", "placeholder"];
function Zg(e2, t2, n2, r2, i2, a2) {
  var o2 = b("control-wrapper");
  return y(), I(o2, h(e2.controlWrapper, { styles: e2.styles, "is-focused": e2.isFocused, "applied-options": e2.appliedOptions }), { default: N(function() {
    return [D("input", { id: e2.control.id + "-input", type: "datetime-local", class: E(e2.styles.control.input), value: e2.dataTime, disabled: !e2.control.enabled, autofocus: e2.appliedOptions.focus, placeholder: e2.appliedOptions.placeholder, onChange: t2[0] ||= function() {
      return e2.onChange && e2.onChange.apply(e2, arguments);
    }, onFocus: t2[1] ||= function(t3) {
      return e2.isFocused = !0;
    }, onBlur: t2[2] ||= function(t3) {
      return e2.isFocused = !1;
    } }, null, 42, Xg)];
  }), _: 1 }, 16, ["styles", "is-focused", "applied-options"]);
}
Jg.render = Zg;
var Qg = a({ name: "TimeControlRenderer", components: { ControlWrapper: pg }, props: $({}, Q()), setup: function(e2) {
  return Zh(ch(e2), function(e3) {
    var t2 = e3.value || void 0;
    return t2 && /^\d{2}:\d{2}$/.test(t2) ? `${t2}:00` : t2;
  });
} });
var $g = { renderer: Qg, tester: X(2, $l) };
var e_ = ["id", "value", "disabled", "autofocus", "placeholder", "step"];
function t_(e2, t2, n2, r2, i2, a2) {
  var o2 = b("control-wrapper");
  return y(), I(o2, h(e2.controlWrapper, { styles: e2.styles, "is-focused": e2.isFocused, "applied-options": e2.appliedOptions }), { default: N(function() {
    return [D("input", { id: e2.control.id + "-input", type: "time", class: E(e2.styles.control.input), value: e2.control.data, disabled: !e2.control.enabled, autofocus: e2.appliedOptions.focus, placeholder: e2.appliedOptions.placeholder, step: typeof e2.appliedOptions.step == "number" ? e2.appliedOptions.step : 0, onChange: t2[0] ||= function() {
      return e2.onChange && e2.onChange.apply(e2, arguments);
    }, onFocus: t2[1] ||= function(t3) {
      return e2.isFocused = !0;
    }, onBlur: t2[2] ||= function(t3) {
      return e2.isFocused = !1;
    } }, null, 42, e_)];
  }), _: 1 }, 16, ["styles", "is-focused", "applied-options"]);
}
Qg.render = t_;
var n_ = a({ name: "BooleanControlRenderer", components: { ControlWrapper: pg }, props: $({}, Q()), setup: function(e2) {
  return Zh(ch(e2), function(e3) {
    return e3.checked;
  });
} });
var r_ = { renderer: n_, tester: X(1, Ul) };
var i_ = ["id", "checked", "disabled", "autofocus", "placeholder"];
function a_(e2, t2, n2, r2, i2, a2) {
  var o2 = b("control-wrapper");
  return y(), I(o2, h(e2.controlWrapper, { styles: e2.styles, "is-focused": e2.isFocused, "applied-options": e2.appliedOptions }), { default: N(function() {
    return [D("input", { id: e2.control.id + "-input", type: "checkbox", class: E(e2.styles.control.input), checked: !!e2.control.data, disabled: !e2.control.enabled, autofocus: e2.appliedOptions.focus, placeholder: e2.appliedOptions.placeholder, onChange: t2[0] ||= function() {
      return e2.onChange && e2.onChange.apply(e2, arguments);
    }, onFocus: t2[1] ||= function(t3) {
      return e2.isFocused = !0;
    }, onBlur: t2[2] ||= function(t3) {
      return e2.isFocused = !1;
    } }, null, 42, i_)];
  }), _: 1 }, 16, ["styles", "is-focused", "applied-options"]);
}
n_.render = a_;
var o_ = [vg, Sg, Eg, Ag, Pg, zg, Wg, Yg, $g, r_];
var s_ = a({ name: "LayoutRenderer", components: { DispatchRenderer: Sh }, props: $({}, Q()), setup: function(e2) {
  return Qh(hh(e2));
}, computed: { layoutClassObject: function() {
  return this.layout.direction === "row" ? this.styles.horizontalLayout : this.styles.verticalLayout;
} } });
var c_ = { renderer: s_, tester: X(1, zs) };
function l_(e2, t2, n2, r2, i2, a2) {
  var o2 = b("dispatch-renderer");
  return e2.layout.visible ? (y(), O("div", { key: 0, class: E(e2.layoutClassObject.root) }, [(y(!0), O(k, null, L(e2.layout.uischema.elements, function(t3, n3) {
    return y(), O("div", { key: `${e2.layout.path}-${n3}`, class: E(e2.layoutClassObject.item) }, [z(o2, { schema: e2.layout.schema, uischema: t3, path: e2.layout.path, enabled: e2.layout.enabled, renderers: e2.layout.renderers, cells: e2.layout.cells }, null, 8, ["schema", "uischema", "path", "enabled", "renderers", "cells"])], 2);
  }), 128))], 2)) : P("", !0);
}
s_.render = l_;
var u_ = a({ name: "GroupRenderer", components: { DispatchRenderer: Sh }, props: $({}, Q()), setup: function(e2) {
  return Qh(hh(e2));
} });
var d_ = { renderer: u_, tester: X(2, Y(zs, Bl("Group"))) };
function f_(e2, t2, n2, r2, i2, a2) {
  var o2 = b("dispatch-renderer");
  return e2.layout.visible ? (y(), O("fieldset", { key: 0, class: E(e2.styles.group.root) }, [e2.layout.label ? (y(), O("legend", { key: 0, class: E(e2.styles.group.label) }, A(e2.layout.label), 3)) : P("", !0), (y(!0), O(k, null, L(e2.layout.uischema.elements, function(t3, n3) {
    return y(), O("div", { key: `${e2.layout.path}-${n3}`, class: E(e2.styles.group.item) }, [z(o2, { schema: e2.layout.schema, uischema: t3, path: e2.layout.path, enabled: e2.layout.enabled, renderers: e2.layout.renderers, cells: e2.layout.cells }, null, 8, ["schema", "uischema", "path", "enabled", "renderers", "cells"])], 2);
  }), 128))], 2)) : P("", !0);
}
u_.render = f_;
var p_ = a({ name: "CategorizationRenderer", components: { DispatchRenderer: Sh }, props: $({}, Q()), setup: function(e2) {
  return Qh(yh(e2));
}, data: function() {
  return { selected: 0 };
} });
var m_ = { renderer: p_, tester: X(2, Y(tu, iu)) };
var h_ = ["onClick"];
var g_ = ["disabled"];
function __(e2, t2, n2, r2, i2, a2) {
  var o2 = b("DispatchRenderer");
  return y(), O("div", { class: E(e2.styles.categorization.root) }, [D("div", { class: E(e2.styles.categorization.category) }, [(y(!0), O(k, null, L(e2.categories, function(t3, n3) {
    return y(), O(k, { key: `category-${n3}` }, [t3.value.visible ? (y(), O("div", { key: 0, onClick: function(t4) {
      return e2.selected = n3;
    } }, [D("button", { class: E([e2.selected === n3 ? e2.styles.categorization.selected : ""]), disabled: !t3.value.enabled }, [D("label", null, A(t3.value.label), 1)], 10, g_)], 8, h_)) : P("", !0)], 64);
  }), 128))], 2), D("div", { class: E(e2.styles.categorization.panel) }, [e2.categories[e2.selected] ? (y(), I(o2, { key: 0, schema: e2.layout.schema, uischema: e2.categories[e2.selected].value.uischema, path: e2.layout.path, enabled: e2.layout.enabled, renderers: e2.layout.renderers, cells: e2.layout.cells }, null, 8, ["schema", "uischema", "path", "enabled", "renderers", "cells"])) : P("", !0)], 2)], 2);
}
p_.render = __;
var v_ = a({ name: "CategorizationStepperRenderer", components: { DispatchRenderer: Sh }, props: $({}, Q()), setup: function(e2) {
  return Qh(yh(e2));
}, data: function() {
  return { selected: 0 };
}, computed: { visibleCategories: function() {
  return this.categories.filter(function(e2) {
    return e2.value.visible;
  });
} } });
var y_ = { renderer: v_, tester: X(3, Y(tu, iu, Vl("variant", "stepper"))) };
var b_ = ["onClick"];
var x_ = ["disabled"];
var S_ = ["disabled"];
var C_ = ["disabled"];
function w_(e2, t2, n2, r2, i2, a2) {
  var o2, s2 = b("DispatchRenderer");
  return y(), O("div", { class: E(e2.styles.categorization.root) }, [D("div", { class: E(e2.styles.categorization.stepper) }, [(y(!0), O(k, null, L(e2.visibleCategories, function(t3, n3) {
    return y(), O(k, { key: `tab-${n3}` }, [t3.value.visible ? (y(), O("div", { key: 0, onClick: function(t4) {
      return e2.selected = n3;
    } }, [D("button", { class: E([e2.selected === n3 ? e2.styles.categorization.selected : ""]), disabled: !t3.value.enabled }, [D("span", { class: E(e2.styles.categorization.stepperBadge) }, A(n3 + 1), 3), D("label", null, A(t3.value.label), 1)], 10, x_)], 8, b_)) : P("", !0), n3 === e2.visibleCategories.length - 1 ? P("", !0) : (y(), O("hr", { key: 1, class: E(e2.styles.categorization.stepperLine) }, null, 2))], 64);
  }), 128))], 2), D("div", { class: E(e2.styles.categorization.panel) }, [e2.visibleCategories[e2.selected] ? (y(), I(s2, { key: 0, schema: e2.layout.schema, uischema: e2.visibleCategories[e2.selected].value.uischema, path: e2.layout.path, enabled: e2.layout.enabled, renderers: e2.layout.renderers, cells: e2.layout.cells }, null, 8, ["schema", "uischema", "path", "enabled", "renderers", "cells"])) : P("", !0)], 2), (o2 = e2.appliedOptions) != null && o2.showNavButtons ? (y(), O("footer", { key: 0, class: E(e2.styles.categorization.stepperFooter) }, [e2.selected > 0 ? (y(), O("div", { key: 0, class: E(e2.styles.categorization.stepperButtonBack), onClick: t2[0] ||= function(t3) {
    return --e2.selected;
  } }, [D("button", { disabled: !e2.visibleCategories[e2.selected - 1].value.enabled }, A("back"), 8, S_)], 2)) : P("", !0), e2.selected + 1 < e2.visibleCategories.length ? (y(), O("div", { key: 1, class: E(e2.styles.categorization.stepperButtonNext), onClick: t2[1] ||= function(t3) {
    return e2.selected += 1;
  } }, [D("button", { disabled: !e2.visibleCategories[e2.selected + 1].value.enabled }, A("next"), 8, C_)], 2)) : P("", !0)], 2)) : P("", !0)], 2);
}
v_.render = w_;
var T_ = [c_, d_, m_, y_];
var E_ = a({ name: "ObjectRenderer", components: { DispatchRenderer: Sh }, props: $({}, Q()), setup: function(e2) {
  var t2 = Zh(lh(e2));
  return $($({}, t2), {}, { input: t2 });
}, computed: { detailUiSchema: function() {
  var e2 = this;
  return ou(this.control.uischemas, this.control.schema, this.control.uischema.scope, this.control.path, function() {
    var t2 = Oc.uiSchema(e2.control.schema, "Group", void 0, e2.control.rootSchema);
    return (0, K.default)(e2.control.path) ? t2.type = "VerticalLayout" : t2.label = e2.control.label, t2;
  }, this.control.uischema, this.control.rootSchema);
} } });
var D_ = { renderer: E_, tester: X(2, Wl) };
var O_ = { key: 0 };
function k_(e2, t2, n2, r2, i2, a2) {
  var o2 = b("dispatch-renderer");
  return e2.control.visible ? (y(), O("div", O_, [z(o2, { visible: e2.control.visible, enabled: e2.control.enabled, schema: e2.control.schema, uischema: e2.detailUiSchema, path: e2.control.path, renderers: e2.control.renderers, cells: e2.control.cells }, null, 8, ["visible", "enabled", "schema", "uischema", "path", "renderers", "cells"])])) : P("", !0);
}
E_.render = k_;
var A_ = a({ name: "CombinatorProperties", components: { DispatchRenderer: Sh }, props: { schema: { type: Object, required: !0 }, combinatorKeyword: { type: String, required: !0 }, path: { type: String, required: !0 }, rootSchema: { type: Object, required: !0 } }, setup: function(e2) {
  var t2 = (0, Ph.default)(e2.schema, e2.combinatorKeyword), n2 = Oc.uiSchema(t2, "VerticalLayout", void 0, e2.rootSchema), r2 = function(e3) {
    return Object.prototype.hasOwnProperty.call(e3, "elements");
  }, i2 = !1;
  return n2 !== null && r2(n2) && (i2 = n2.elements.length > 0), { otherProps: t2, foundUISchema: n2, isLayoutWithElements: i2 };
} });
var j_ = { key: 0 };
function M_(e2, t2, n2, r2, i2, a2) {
  var o2 = b("dispatch-renderer");
  return e2.isLayoutWithElements ? (y(), O("div", j_, [z(o2, { schema: e2.otherProps, path: e2.path, uischema: e2.foundUISchema }, null, 8, ["schema", "path", "uischema"])])) : P("", !0);
}
A_.render = M_;
var N_ = a({ name: "OneOfRenderer", components: { ControlWrapper: pg, DispatchRenderer: Sh, CombinatorProperties: A_ }, props: $({}, Q()), setup: function(e2) {
  var t2 = ph(e2), n2 = t2.control.value, r2 = _(n2.indexOfFittingSchema), i2 = _(r2.value), a2 = _(0), o2 = _(), s2 = _();
  return $($({}, Zh(t2)), {}, { selectedIndex: r2, selectIndex: i2, newSelectedIndex: a2, dialog: o2, confirm: s2 });
}, computed: { indexedOneOfRenderInfos: function() {
  return nd(this.control.schema.oneOf, this.control.rootSchema, "oneOf", this.control.uischema, this.control.path, this.control.uischemas).filter(function(e2) {
    return e2.uischema;
  }).map(function(e2, t2) {
    return $($({}, e2), {}, { index: t2 });
  });
}, translations: function() {
  var e2, t2 = bh();
  return Ol((t2 == null || (e2 = t2.i18n) == null ? void 0 : e2.translate) ?? Nl.translate, _l, this.control.i18nKeyPrefix, this.control.label);
} }, methods: { handleSelectChange: function(e2) {
  var t2 = this, n2 = e2.target;
  this.selectIndex = n2.value, this.control.enabled && this.control.data !== void 0 ? (this.showDialog(), l(function() {
    var e3;
    t2.newSelectedIndex = t2.selectIndex, t2.selectIndex = t2.selectedIndex, (e3 = t2.confirm) == null || e3.focus();
  })) : l(function() {
    t2.selectedIndex = t2.selectIndex;
  });
}, showDialog: function() {
  var e2;
  (e2 = this.dialog) == null || e2.showModal();
}, closeDialog: function() {
  var e2;
  (e2 = this.dialog) == null || e2.close();
}, onConfirm: function() {
  this.newSelection(), this.closeDialog();
}, onCancel: function() {
  this.newSelectedIndex = this.selectedIndex, this.closeDialog();
}, newSelection: function() {
  this.handleChange(this.control.path, this.newSelectedIndex !== void 0 && this.newSelectedIndex !== null ? ju(this.indexedOneOfRenderInfos[this.newSelectedIndex].schema, this.control.rootSchema) : {}), this.selectIndex = this.newSelectedIndex, this.selectedIndex = this.newSelectedIndex;
} } });
var P_ = { renderer: N_, tester: X(3, Gl) };
var F_ = ["id", "value", "disabled", "autofocus"];
var I_ = ["value", "label"];
var L_ = ["onclick"];
var R_ = ["onclick"];
function z_(e2, t2, n2, r2, i2, a2) {
  var o2 = b("combinator-properties"), s2 = b("control-wrapper"), c2 = b("dispatch-renderer");
  return e2.control.visible ? (y(), O("div", { key: 0, class: E(e2.styles.oneOf.root) }, [z(o2, { schema: e2.control.schema, "combinator-keyword": "oneOf", path: e2.path, "root-schema": e2.control.rootSchema }, null, 8, ["schema", "path", "root-schema"]), z(s2, h(e2.controlWrapper, { styles: e2.styles, "is-focused": e2.isFocused, "applied-options": e2.appliedOptions }), { default: N(function() {
    return [D("select", { id: e2.control.id + "-input", class: E(e2.styles.control.select), value: e2.selectIndex, disabled: !e2.control.enabled, autofocus: e2.appliedOptions.focus, onChange: t2[0] ||= function() {
      return e2.handleSelectChange && e2.handleSelectChange.apply(e2, arguments);
    }, onFocus: t2[1] ||= function(t3) {
      return e2.isFocused = !0;
    }, onBlur: t2[2] ||= function(t3) {
      return e2.isFocused = !1;
    } }, [(y(!0), O(k, null, L(e2.indexedOneOfRenderInfos, function(t3) {
      return y(), O("option", { key: t3.index, value: t3.index, label: t3.label, class: E(e2.styles.control.option) }, null, 10, I_);
    }), 128))], 42, F_)];
  }), _: 1 }, 16, ["styles", "is-focused", "applied-options"]), e2.selectedIndex !== void 0 && e2.selectedIndex !== null ? (y(), I(c2, { key: 0, schema: e2.indexedOneOfRenderInfos[e2.selectedIndex].schema, uischema: e2.indexedOneOfRenderInfos[e2.selectedIndex].uischema, path: e2.control.path, renderers: e2.control.renderers, cells: e2.control.cells, enabled: e2.control.enabled }, null, 8, ["schema", "uischema", "path", "renderers", "cells", "enabled"])) : P("", !0), D("dialog", { ref: "dialog", class: E(e2.styles.dialog.root) }, [D("h1", { class: E(e2.styles.dialog.title) }, A(e2.translations.clearDialogTitle), 3), D("p", { class: E(e2.styles.dialog.body) }, A(e2.translations.clearDialogMessage), 3), D("div", { class: E(e2.styles.dialog.actions) }, [D("button", { onclick: e2.onCancel, class: E(e2.styles.dialog.buttonSecondary) }, A(e2.translations.clearDialogDecline), 11, L_), D("button", { ref: "confirm", onclick: e2.onConfirm, class: E(e2.styles.dialog.buttonPrimary) }, A(e2.translations.clearDialogAccept), 11, R_)], 2)], 2)], 2)) : P("", !0);
}
N_.render = z_;
var B_ = a({ name: "EnumArrayRenderer", props: $({}, Q()), setup: function(e2) {
  return eg(mh(e2));
}, methods: { dataHasEnum: function(e2) {
  var t2;
  return !!((t2 = this.control.data) != null && t2.includes(e2));
}, toggle: function(e2, t2) {
  if (t2) this.addItem(this.control.path, e2);
  else {
    var n2;
    (n2 = this.removeItem) == null || n2.call(this, this.control.path, e2);
  }
} } });
var V_ = function(e2) {
  return e2.oneOf !== void 0 && e2.oneOf.length > 0 && e2.oneOf.every(function(e3) {
    return e3.const !== void 0;
  });
};
var H_ = function(e2) {
  return e2.type === "string" && e2.enum !== void 0;
};
var U_ = { renderer: B_, tester: X(5, Y(Bl("Control"), Y(Il(function(e2) {
  return uc(e2, "array") && !Array.isArray(e2.items) && e2.uniqueItems === !0;
}), Ll("items", function(e2) {
  return V_(e2) || H_(e2);
})))) };
var W_ = ["id", "value", "checked", "disabled", "placeholder", "onChange"];
var G_ = ["for"];
function K_(e2, t2, n2, r2, i2, a2) {
  return y(!0), O(k, null, L(e2.control.options, function(t3, n3) {
    return y(), O("div", { key: n3 }, [D("input", { id: e2.control.id + `-input-${n3}`, type: "checkbox", class: E(e2.styles.control.input), value: t3.value, checked: e2.dataHasEnum(t3.value), disabled: !e2.control.enabled, placeholder: e2.appliedOptions?.placeholder, onChange: function(n4) {
      return e2.toggle(t3.value, n4.target.checked);
    } }, null, 42, W_), D("label", { for: e2.control.id + `-input-${n3}` }, A(t3.label), 9, G_)]);
  }), 128);
}
B_.render = K_;
var q_ = [D_, P_, U_];
var J_ = a({ name: "LabelRenderer", props: $({}, Q()), setup: function(e2) {
  return $h(_h(e2));
} });
var Y_ = { renderer: J_, tester: X(1, Bl("Label")) };
function X_(e2, t2, n2, r2, i2, a2) {
  return e2.label.visible ? (y(), O("label", { key: 0, class: E(e2.styles.label.root) }, A(e2.label.text), 3)) : P("", !0);
}
J_.render = X_;
var Z_ = [Y_];
var Q_ = [].concat(Bh(o_), Bh(T_), Bh(q_), Bh(fg), Bh(Z_));
var $_ = { key: 1, class: "script-jsonforms__schema-error", role: "alert" };
var ev = ae(a({ __name: "ScriptSchemaForm", props: { schema: {}, data: {}, locale: { default: "en" }, readonly: { type: Boolean, default: !1 }, showValidationErrors: { type: Boolean, default: !1 } }, emits: ["change", "schemaError"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, i2 = { renderer: a({ name: "ScriptSchemaEnumControlRenderer", props: Q(), setup(e3) {
    let t3 = Zh(uh(e3));
    return () => {
      let e4 = t3.control.value;
      return o(pg, { ...t3.controlWrapper.value, styles: t3.styles, isFocused: t3.isFocused.value, appliedOptions: t3.appliedOptions.value }, { default: () => o(Fm, { id: `${e4.id}-input`, modelValue: e4.data, options: e4.options, optionLabel: "label", optionValue: "value", disabled: !e4.enabled, autofocus: !!t3.appliedOptions.value.focus, "onUpdate:modelValue": (n3) => {
        t3.handleChange(e4.path, n3 ?? void 0);
      }, onFocus: () => {
        t3.isFocused.value = !0;
      }, onBlur: () => {
        t3.isFocused.value = !1;
      } }) });
    };
  } }), tester: X(3, Kl) }, s2 = { renderer: a({ name: "ScriptSchemaNumberControlRenderer", props: Q(), setup(e3) {
    let t3 = Zh(ch(e3), (e4) => e4.value === "" ? void 0 : Number(e4.value));
    return () => {
      let e4 = t3.control.value;
      return o(pg, { ...t3.controlWrapper.value, styles: t3.styles, isFocused: t3.isFocused.value, appliedOptions: t3.appliedOptions.value }, { default: () => o("input", { id: `${e4.id}-input`, type: "number", step: "any", class: t3.styles.control.input, value: e4.data, disabled: !e4.enabled, autofocus: !!t3.appliedOptions.value.focus, placeholder: t3.appliedOptions.value.placeholder, onChange: t3.onChange, onFocus: () => {
        t3.isFocused.value = !0;
      }, onBlur: () => {
        t3.isFocused.value = !1;
      } }) });
    };
  } }), tester: X(3, Yl) };
  function c2(e3) {
    let t3 = e3.renderer.name;
    if (!t3?.endsWith("ControlRenderer")) return e3;
    let n3 = e3.renderer;
    return { ...e3, renderer: a({ name: `${t3}WithPersistentDescription`, props: Q(), setup(e4) {
      return () => {
        let t4 = ks(e4.schema, e4.uischema.scope, e4.schema), r3 = typeof t4.description == "string" ? t4.description : "";
        return o("div", { class: "script-jsonforms__control-shell" }, [o(n3, { ...e4 }), r3 ? o("div", { class: "script-jsonforms__description" }, r3) : null]);
      };
    } }) };
  }
  let d2 = Object.freeze([i2, s2, ...Q_].map(c2)), f2 = Object.freeze({ showUnfocusedDescription: !0 }), p2 = Xh(Kh, { control: { root: "script-jsonforms__control", wrapper: "script-jsonforms__wrapper", label: "script-jsonforms__label", description: "script-jsonforms__description", error: "script-jsonforms__error", input: "script-jsonforms__input", textarea: "script-jsonforms__textarea", select: "script-jsonforms__select", option: "script-jsonforms__option", asterisk: "script-jsonforms__asterisk" }, verticalLayout: { root: "script-jsonforms__vertical-layout", item: "script-jsonforms__layout-item" }, horizontalLayout: { root: "script-jsonforms__horizontal-layout", item: "script-jsonforms__layout-item" }, group: { root: "script-jsonforms__group", label: "script-jsonforms__group-label", item: "script-jsonforms__group-item" }, arrayList: { root: "script-jsonforms__array", legend: "script-jsonforms__array-legend", addButton: "script-jsonforms__array-add", label: "script-jsonforms__array-label", itemWrapper: "script-jsonforms__array-item-wrapper", noData: "script-jsonforms__array-empty", item: "script-jsonforms__array-item", itemToolbar: "script-jsonforms__array-toolbar", itemLabel: "script-jsonforms__array-item-label", itemContent: "script-jsonforms__array-content", itemExpanded: "script-jsonforms__array-content--expanded", itemMoveUp: "script-jsonforms__array-action script-jsonforms__array-action--up", itemMoveDown: "script-jsonforms__array-action script-jsonforms__array-action--down", itemDelete: "script-jsonforms__array-action script-jsonforms__array-action--delete" }, oneOf: { root: "script-jsonforms__one-of" }, dialog: { root: "script-jsonforms__dialog", title: "script-jsonforms__dialog-title", body: "script-jsonforms__dialog-body", actions: "script-jsonforms__dialog-actions", buttonPrimary: "script-jsonforms__dialog-button script-jsonforms__dialog-button--primary", buttonSecondary: "script-jsonforms__dialog-button" } });
  u("styles", p2);
  let m2 = S("formRoot"), h2 = T(() => ym(n2.schema, n2.locale)), _2 = T(() => xm(h2.value)), b2 = T(() => Sm(h2.value)), x2, C2;
  function w2() {
    m2.value?.querySelectorAll(".script-jsonforms__description")?.forEach((e3) => {
      let t3 = e3.textContent?.trim() ?? "", n3 = e3.scrollWidth > e3.clientWidth + 1;
      t3 && n3 ? e3.title = t3 : e3.removeAttribute("title");
    });
  }
  function D2() {
    l(w2);
  }
  function k2(e3) {
    let t3 = e3.target;
    if (!(t3 instanceof HTMLElement)) return;
    let n3 = t3.closest(".script-jsonforms__control");
    if (!n3 || !m2.value?.contains(n3)) return;
    let r3 = e3.relatedTarget;
    r3 instanceof Node && n3.contains(r3) || n3.classList.add("script-jsonforms__control--touched");
  }
  function M2(e3) {
    let t3 = e3.target;
    if (!(t3 instanceof HTMLInputElement || t3 instanceof HTMLTextAreaElement) || e3 instanceof InputEvent && e3.isComposing) return;
    let n3 = t3.closest(".script-jsonforms__control");
    n3 && m2.value?.contains(n3) && (n3.classList.add("script-jsonforms__control--touched"), t3 instanceof HTMLInputElement && t3.type === "number" || t3 instanceof HTMLInputElement && t3.validity.badInput || t3.type !== "checkbox" && t3.type !== "radio" && t3.dispatchEvent(new Event("change", { bubbles: !0 })));
  }
  function N2(e3) {
    let t3 = e3.target;
    t3 instanceof HTMLInputElement && t3.type === "number" && document.activeElement === t3 && e3.preventDefault();
  }
  function P2() {
    m2.value?.querySelectorAll(".script-jsonforms__control--touched").forEach((e3) => e3.classList.remove("script-jsonforms__control--touched"));
  }
  v(() => {
    let e3 = m2.value;
    e3 && (x2 = new ResizeObserver(D2), x2.observe(e3), C2 = new MutationObserver(D2), C2.observe(e3, { childList: !0, characterData: !0, subtree: !0 }), D2());
  }), g(() => {
    x2?.disconnect(), C2?.disconnect();
  }), R(h2, D2, { flush: "post" }), R(() => n2.schema, () => {
    l(P2);
  });
  let F2 = T(() => {
    let e3 = Om(_2.value);
    try {
      return e3.compile(_2.value), { ajv: e3, error: "" };
    } catch (t3) {
      return { ajv: e3, error: t3 instanceof Error ? t3.message : "\u811A\u672C\u5165\u53C2 Schema \u65E0\u6548" };
    }
  });
  R(() => F2.value.error, (e3) => r2("schemaError", e3), { immediate: !0 });
  let ee2 = T(() => ({ addTooltip: B("\u6DFB\u52A0"), addAriaLabel: B("\u6DFB\u52A0\u53C2\u6570\u9879"), removeTooltip: B("\u5220\u9664"), removeAriaLabel: B("\u5220\u9664\u53C2\u6570\u9879"), upAriaLabel: B("\u4E0A\u79FB\u53C2\u6570\u9879"), downAriaLabel: B("\u4E0B\u79FB\u53C2\u6570\u9879"), noDataMessage: B("\u6682\u65E0\u6570\u636E"), clearDialogTitle: B("\u5207\u6362\u53C2\u6570\u7C7B\u578B"), clearDialogMessage: B("\u5207\u6362\u7C7B\u578B\u4F1A\u6E05\u7A7A\u5F53\u524D\u53C2\u6570\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F"), clearDialogAccept: B("\u7EE7\u7EED"), clearDialogDecline: B("\u53D6\u6D88") })), L2 = T(() => ({ required: B("\u6B64\u9879\u4E3A\u5FC5\u586B\u9879"), type: B("\u53C2\u6570\u7C7B\u578B\u4E0D\u6B63\u786E"), format: B("\u53C2\u6570\u683C\u5F0F\u4E0D\u6B63\u786E"), enum: B("\u8BF7\u9009\u62E9\u6709\u6548\u9009\u9879"), const: B("\u53C2\u6570\u503C\u4E0D\u6B63\u786E"), minimum: B("\u53C2\u6570\u503C\u4F4E\u4E8E\u5141\u8BB8\u8303\u56F4"), maximum: B("\u53C2\u6570\u503C\u8D85\u51FA\u5141\u8BB8\u8303\u56F4"), minLength: B("\u8F93\u5165\u5185\u5BB9\u8FC7\u77ED"), maxLength: B("\u8F93\u5165\u5185\u5BB9\u8FC7\u957F"), minItems: B("\u5217\u8868\u9879\u6570\u91CF\u4E0D\u8DB3"), maxItems: B("\u5217\u8868\u9879\u6570\u91CF\u8FC7\u591A"), pattern: B("\u8F93\u5165\u5185\u5BB9\u683C\u5F0F\u4E0D\u6B63\u786E"), additionalProperties: B("\u5305\u542B\u4E0D\u652F\u6301\u7684\u53C2\u6570") })), te2 = T(() => ({ locale: n2.locale, translate: (e3, t3) => {
    let n3 = e3.split(".").at(-1) || e3;
    return ee2.value[n3] || t3;
  }, translateError: (e3) => L2.value[e3.keyword] || e3.message || B("\u53C2\u6570\u6821\u9A8C\u5931\u8D25") }));
  function ne2(e3) {
    r2("change", { data: e3.data, errors: e3.errors ?? [] });
  }
  return (t3, n3) => (y(), O("div", { ref_key: "formRoot", ref: m2, class: E(["script-jsonforms", { "script-jsonforms--show-errors": e2.showValidationErrors }]), onInput: M2, onFocusout: k2, onWheel: N2 }, [j(F2).error ? (y(), O("p", $_, A(j(B)("\u811A\u672C\u5165\u53C2 Schema \u65E0\u6548")) + "\uFF1A" + A(j(F2).error), 1)) : (y(), I(j(Oh), { key: 0, data: e2.data, schema: j(_2), uischema: j(b2), renderers: j(d2), config: j(f2), readonly: e2.readonly, ajv: j(F2).ajv, i18n: j(te2), "validation-mode": "ValidateAndShow", onChange: ne2 }, null, 8, ["data", "schema", "uischema", "renderers", "config", "readonly", "ajv", "i18n"]))], 34));
} }), [["__scopeId", "data-v-2de6b2e7"]]);
export {Fm as a,jm as c,Em as d,Z as f,km as h,zm as i,Dm as l,vm as m,Gm as n,Pm as o,_m as p,Hm as r,fm as s,ev as t,xm as u};