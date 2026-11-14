import {Cr as e} from "./utils-BIWenCnY.js";
import {C as t,Dt as n,F as r,G as i,J as a,L as o,P as s,R as c,St as l,V as u,W as d,Z as f,_t as p,at as m,b as h,bt as g,d as _,en as v,f as y,g as b,h as x,i as S,in as C,it as ee,jt as w,k as te,kt as ne,lt as T,m as E,nn as re,nt as ie,p as D,q as O,rn as ae,s as oe,st as se,tt as ce,ut as le,v as k,x as A} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as j,t as ue} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {m as de,o as fe,t as M} from "./dist-NctnpPRe.js";
import {t as pe} from "./isFunction-BpPesgCd.js";
import {d as N,i as me} from "./dist-ufdnm93_.js";
import {Z as he} from "./basecomponent-ClhuVxJN.js";
import {t as P} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as ge} from "./tooltip-BYYKWrvu.js";
import {t as F} from "./rx-divider-Ci3C58Q3.js";
import {t as I} from "./m-input-select-C8pih1gY.js";
import {t as L} from "./m-input-number-BOH1hUUB.js";
import {t as _e} from "./m-input-text-JVbCgVJP.js";
import {t as R} from "./radiobutton-B3i1EP5M.js";
import {t as z} from "./m-input-multi-select-B7lX5Cnm.js";
import {t as ve} from "./message-SBZQdXpt.js";
import {V as ye,dt as B} from "./types-Cxql15JH.js";
import {t as be} from "./external-CdTk2m9u.js";
import {t as xe} from "./m-input-password-IOnajQ90.js";
import {n as V,r as Se,t as Ce} from "./zod-CkMKsh1h.js";
import {t as H} from "./m-input-textarea-33WQDaSq.js";
import {t as we} from "./m-input-date-picker-CPwsZFnI.js";
function U(e2) {
  return Array.isArray ? Array.isArray(e2) : je(e2) === "[object Array]";
}
function Te(e2) {
  if (typeof e2 == "string") return e2;
  if (typeof e2 == "bigint") return e2.toString();
  let t2 = e2 + "";
  return t2 == "0" && 1 / e2 == -1 / 0 ? "-0" : t2;
}
function Ee(e2) {
  return e2 == null ? "" : Te(e2);
}
function W(e2) {
  return typeof e2 == "string";
}
function De(e2) {
  return typeof e2 == "number";
}
function Oe(e2) {
  return e2 === !0 || e2 === !1 || ke(e2) && je(e2) == "[object Boolean]";
}
function G(e2) {
  return typeof e2 == "object";
}
function ke(e2) {
  return G(e2) && e2 !== null;
}
function K(e2) {
  return e2 != null;
}
function Ae(e2) {
  return !e2.trim().length;
}
function je(e2) {
  return e2 == null ? e2 === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(e2);
}
var Me = "Incorrect 'index' type";
var q = "Invalid doc index: must be a non-negative integer within the bounds of the docs array";
var Ne = (e2) => `Invalid value for key ${e2}`;
var Pe = (e2) => `Pattern length exceeds max of ${e2}.`;
var J = (e2) => `Missing ${e2} property in key`;
var Y = (e2) => `Property 'weight' in key '${e2}' must be a positive integer`;
var X = "Fuse.match does not support useTokenSearch: token search requires corpus-level statistics (df, fieldCount) that a one-off string comparison does not have. Use new Fuse(...).search(...) instead.";
var Fe = Object.prototype.hasOwnProperty;
var Ie = class {
  constructor(e2) {
    this._keys = [], this._keyMap = {};
    let t2 = 0;
    e2.forEach((e3) => {
      let n2 = Le(e3);
      this._keys.push(n2), this._keyMap[n2.id] = n2, t2 += n2.weight;
    }), this._keys.forEach((e3) => {
      e3.weight /= t2;
    });
  }
  get(e2) {
    return this._keyMap[e2];
  }
  keys() {
    return this._keys;
  }
  toJSON() {
    return JSON.stringify(this._keys);
  }
};
function Le(e2) {
  let t2 = null, n2 = null, r2 = null, i2 = 1, a2 = null;
  if (W(e2) || U(e2)) r2 = e2, t2 = Re(e2), n2 = ze(e2);
  else {
    if (!Fe.call(e2, "name")) throw Error(J("name"));
    let o2 = e2.name;
    if (r2 = o2, Fe.call(e2, "weight") && e2.weight !== void 0 && (i2 = e2.weight, i2 <= 0)) throw Error(Y(ze(o2)));
    t2 = Re(o2), n2 = ze(o2), a2 = e2.getFn ?? null;
  }
  return { path: t2, id: n2, weight: i2, src: r2, getFn: a2 };
}
function Re(e2) {
  return U(e2) ? e2 : e2.split(".");
}
function ze(e2) {
  return U(e2) ? e2.join(".") : e2;
}
function Be(e2, t2) {
  let n2 = [], r2 = !1, i2 = (e3, t3, a2, o2) => {
    if (K(e3))
      if (!t3[a2]) n2.push(o2 === void 0 ? e3 : { v: e3, i: o2 });
      else {
        let s2 = e3[t3[a2]];
        if (!K(s2)) return;
        if (a2 === t3.length - 1 && (W(s2) || De(s2) || Oe(s2) || typeof s2 == "bigint")) n2.push(o2 === void 0 ? Ee(s2) : { v: Ee(s2), i: o2 });
        else if (U(s2)) {
          r2 = !0;
          for (let e4 = 0, n3 = s2.length; e4 < n3; e4 += 1) i2(s2[e4], t3, a2 + 1, e4);
        } else t3.length && i2(s2, t3, a2 + 1, o2);
      }
  };
  return i2(e2, W(t2) ? t2.split(".") : t2, 0), r2 ? n2 : n2[0];
}
var Ve = { includeMatches: !1, findAllMatches: !1, minMatchCharLength: 1 };
var He = { isCaseSensitive: !1, ignoreDiacritics: !1, includeScore: !1, keys: [], shouldSort: !0, sortFn: (e2, t2) => e2.score === t2.score ? e2.idx < t2.idx ? -1 : 1 : e2.score < t2.score ? -1 : 1 };
var Ue = { location: 0, threshold: 0.6, distance: 100 };
var We = { useExtendedSearch: !1, useTokenSearch: !1, tokenize: void 0, tokenMatch: "any", getFn: Be, ignoreLocation: !1, ignoreFieldNorm: !1, fieldNormWeight: 1 };
var Z = Object.freeze({ ...He, ...Ve, ...Ue, ...We });
function Ge(e2 = 1, t2 = 3) {
  let n2 = /* @__PURE__ */ new Map(), r2 = 10 ** t2;
  return { get(t3) {
    let i2 = 1, a2 = !1;
    for (let e3 = 0; e3 < t3.length; e3++) t3.charCodeAt(e3) === 32 ? a2 ||= (i2++, !0) : a2 = !1;
    if (n2.has(i2)) return n2.get(i2);
    let o2 = Math.round(r2 / i2 ** (0.5 * e2)) / r2;
    return n2.set(i2, o2), o2;
  }, clear() {
    n2.clear();
  } };
}
var Ke = class {
  constructor({ getFn: e2 = Z.getFn, fieldNormWeight: t2 = Z.fieldNormWeight } = {}) {
    this.norm = Ge(t2, 3), this.getFn = e2, this.isCreated = !1, this.docs = [], this.keys = [], this._keysMap = {}, this.setIndexRecords();
  }
  setSources(e2 = []) {
    this.docs = e2;
  }
  setIndexRecords(e2 = []) {
    this.records = e2;
  }
  setKeys(e2 = []) {
    this.keys = e2, this._keysMap = {}, e2.forEach((e3, t2) => {
      this._keysMap[e3.id] = t2;
    });
  }
  create() {
    if (this.isCreated || !this.docs.length) return;
    this.isCreated = !0;
    let e2 = this.docs.length;
    this.records = Array(e2);
    let t2 = 0;
    if (W(this.docs[0])) for (let n2 = 0; n2 < e2; n2++) {
      let e3 = this._createStringRecord(this.docs[n2], n2);
      e3 && (this.records[t2++] = e3);
    }
    else for (let n2 = 0; n2 < e2; n2++) this.records[t2++] = this._createObjectRecord(this.docs[n2], n2);
    this.records.length = t2, this.norm.clear();
  }
  add(e2, t2) {
    if (!Number.isInteger(t2) || t2 < 0) throw Error(q);
    if (W(e2)) {
      let n3 = this._createStringRecord(e2, t2);
      return n3 && this.records.push(n3), n3;
    }
    let n2 = this._createObjectRecord(e2, t2);
    return this.records.push(n2), n2;
  }
  removeAt(e2) {
    if (!Number.isInteger(e2) || e2 < 0) throw Error(q);
    for (let t2 = 0, n2 = this.records.length; t2 < n2; t2 += 1) if (this.records[t2].i === e2) {
      this.records.splice(t2, 1);
      break;
    }
    for (let t2 = 0, n2 = this.records.length; t2 < n2; t2 += 1) this.records[t2].i > e2 && --this.records[t2].i;
  }
  removeAll(e2) {
    let t2 = /* @__PURE__ */ new Set();
    for (let n3 of e2) Number.isInteger(n3) && n3 >= 0 && t2.add(n3);
    if (t2.size === 0) return;
    this.records = this.records.filter((e3) => !t2.has(e3.i));
    let n2 = Array.from(t2).sort((e3, t3) => e3 - t3);
    for (let e3 of this.records) {
      let t3 = 0, r2 = n2.length;
      for (; t3 < r2; ) {
        let i2 = t3 + r2 >>> 1;
        n2[i2] < e3.i ? t3 = i2 + 1 : r2 = i2;
      }
      e3.i -= t3;
    }
  }
  getValueForItemAtKeyId(e2, t2) {
    return e2[this._keysMap[t2]];
  }
  size() {
    return this.records.length;
  }
  _createStringRecord(e2, t2) {
    return !K(e2) || Ae(e2) ? null : { v: e2, i: t2, n: this.norm.get(e2) };
  }
  _createObjectRecord(e2, t2) {
    let n2 = { i: t2, $: {} };
    for (let t3 = 0, r2 = this.keys.length; t3 < r2; t3++) {
      let r3 = this.keys[t3], i2 = r3.getFn ? r3.getFn(e2) : this.getFn(e2, r3.path);
      if (K(i2)) {
        if (U(i2)) {
          let e3 = [];
          for (let t4 = 0, n3 = i2.length; t4 < n3; t4 += 1) {
            let n4 = i2[t4];
            if (K(n4)) {
              if (W(n4)) {
                if (!Ae(n4)) {
                  let r4 = { v: n4, i: t4, n: this.norm.get(n4) };
                  e3.push(r4);
                }
              } else if (K(n4.v)) {
                let t5 = W(n4.v) ? n4.v : Ee(n4.v);
                if (!Ae(t5)) {
                  let r4 = { v: t5, i: n4.i, n: this.norm.get(t5) };
                  e3.push(r4);
                }
              }
            }
          }
          n2.$[t3] = e3;
        } else if (W(i2) && !Ae(i2)) {
          let e3 = { v: i2, n: this.norm.get(i2) };
          n2.$[t3] = e3;
        }
      }
    }
    return n2;
  }
  toJSON() {
    return { keys: this.keys.map(({ getFn: e2, ...t2 }) => t2), records: this.records };
  }
};
function qe(e2, t2, { getFn: n2 = Z.getFn, fieldNormWeight: r2 = Z.fieldNormWeight } = {}) {
  let i2 = new Ke({ getFn: n2, fieldNormWeight: r2 });
  return i2.setKeys(e2.map(Le)), i2.setSources(t2), i2.create(), i2;
}
function Je(e2, { getFn: t2 = Z.getFn, fieldNormWeight: n2 = Z.fieldNormWeight } = {}) {
  let { keys: r2, records: i2 } = e2, a2 = new Ke({ getFn: t2, fieldNormWeight: n2 });
  return a2.setKeys(r2), a2.setIndexRecords(i2), a2;
}
function Ye(e2 = [], t2 = Z.minMatchCharLength) {
  let n2 = [], r2 = -1, i2 = -1, a2 = 0;
  for (let o2 = e2.length; a2 < o2; a2 += 1) {
    let o3 = e2[a2];
    o3 && r2 === -1 ? r2 = a2 : !o3 && r2 !== -1 && (i2 = a2 - 1, i2 - r2 + 1 >= t2 && n2.push([r2, i2]), r2 = -1);
  }
  return e2[a2 - 1] && a2 - r2 >= t2 && n2.push([r2, a2 - 1]), n2;
}
var Q = 32;
function Xe(e2, t2, n2, { location: r2 = Z.location, distance: i2 = Z.distance, threshold: a2 = Z.threshold, findAllMatches: o2 = Z.findAllMatches, minMatchCharLength: s2 = Z.minMatchCharLength, includeMatches: c2 = Z.includeMatches, ignoreLocation: l2 = Z.ignoreLocation } = {}) {
  if (t2.length > Q) throw Error(Pe(Q));
  let u2 = t2.length, d2 = e2.length, f2 = Math.max(0, Math.min(r2, d2)), p2 = a2, m2 = f2, h2 = (e3, t3) => {
    let n3 = e3 / u2;
    if (l2) return n3;
    let r3 = Math.abs(f2 - t3);
    return i2 ? n3 + r3 / i2 : r3 ? 1 : n3;
  }, g2 = s2 > 1 || c2, _2 = g2 ? Array(d2) : [], v2;
  for (; (v2 = e2.indexOf(t2, m2)) > -1; ) {
    let e3 = h2(0, v2);
    if (p2 = Math.min(e3, p2), m2 = v2 + u2, g2) {
      let e4 = 0;
      for (; e4 < u2; ) _2[v2 + e4] = 1, e4 += 1;
    }
  }
  m2 = -1;
  let y2 = [], b2 = 1, x2 = 0, S2 = u2 + d2, C2 = 1 << u2 - 1;
  for (let t3 = 0; t3 < u2; t3 += 1) {
    let r3 = 0, i3 = S2;
    for (; r3 < i3; ) h2(t3, f2 + i3) <= p2 ? r3 = i3 : S2 = i3, i3 = Math.floor((S2 - r3) / 2 + r3);
    S2 = i3;
    let a3 = Math.max(1, f2 - i3 + 1), s3 = o2 ? d2 : Math.min(f2 + i3, d2) + u2, c3 = Array(s3 + 2);
    c3[s3 + 1] = (1 << t3) - 1;
    for (let r4 = s3; r4 >= a3; --r4) {
      let i4 = r4 - 1, o3 = n2[e2[i4]];
      if (c3[r4] = (c3[r4 + 1] << 1 | 1) & o3, t3 && (c3[r4] |= (y2[r4 + 1] | y2[r4]) << 1 | 1 | y2[r4 + 1]), c3[r4] & C2 && (b2 = h2(t3, i4), b2 <= p2)) {
        if (p2 = b2, m2 = i4, x2 = t3, m2 <= f2) break;
        a3 = Math.max(1, 2 * f2 - m2);
      }
    }
    if (h2(t3 + 1, f2) > p2) break;
    y2 = c3;
  }
  if (g2 && m2 >= 0) {
    let t3 = Math.min(d2 - 1, m2 + u2 - 1 + x2);
    for (let r3 = m2; r3 <= t3; r3 += 1) n2[e2[r3]] && (_2[r3] = 1);
  }
  let ee2 = { isMatch: m2 >= 0, score: Math.max(1e-3, b2) };
  if (g2) {
    let e3 = Ye(_2, s2);
    e3.length ? c2 && (ee2.indices = e3) : ee2.isMatch = !1;
  }
  return ee2;
}
function Ze(e2) {
  let t2 = {};
  for (let n2 = 0, r2 = e2.length; n2 < r2; n2 += 1) {
    let i2 = e2.charAt(n2);
    t2[i2] = (t2[i2] || 0) | 1 << r2 - n2 - 1;
  }
  return t2;
}
function Qe(e2) {
  if (e2.length <= 1) return e2;
  e2.sort((e3, t3) => e3[0] - t3[0] || e3[1] - t3[1]);
  let t2 = [e2[0]];
  for (let n2 = 1, r2 = e2.length; n2 < r2; n2 += 1) {
    let r3 = t2[t2.length - 1], i2 = e2[n2];
    i2[0] <= r3[1] + 1 ? r3[1] = Math.max(r3[1], i2[1]) : t2.push(i2);
  }
  return t2;
}
var $e = { \u0142: "l", \u0141: "L", \u0111: "d", \u0110: "D", \u00F8: "o", \u00D8: "O", \u0127: "h", \u0126: "H", \u0167: "t", \u0166: "T", \u0131: "i", \u00DF: "ss" };
var et = RegExp("[" + Object.keys($e).join("") + "]", "g");
var tt = typeof String.prototype.normalize == "function" ? (e2) => e2.normalize("NFD").replace(/[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]/g, "").replace(et, (e3) => $e[e3]) : (e2) => e2;
var nt = class {
  constructor(e2, { location: t2 = Z.location, threshold: n2 = Z.threshold, distance: r2 = Z.distance, includeMatches: i2 = Z.includeMatches, findAllMatches: a2 = Z.findAllMatches, minMatchCharLength: o2 = Z.minMatchCharLength, isCaseSensitive: s2 = Z.isCaseSensitive, ignoreDiacritics: c2 = Z.ignoreDiacritics, ignoreLocation: l2 = Z.ignoreLocation } = {}) {
    if (this.options = { location: t2, threshold: n2, distance: r2, includeMatches: i2, findAllMatches: a2, minMatchCharLength: o2, isCaseSensitive: s2, ignoreDiacritics: c2, ignoreLocation: l2 }, e2 = s2 ? e2 : e2.toLowerCase(), e2 = c2 ? tt(e2) : e2, this.pattern = e2, this.chunks = [], !this.pattern.length) return;
    let u2 = (e3, t3) => {
      this.chunks.push({ pattern: e3, alphabet: Ze(e3), startIndex: t3 });
    }, d2 = this.pattern.length;
    if (d2 > Q) {
      let e3 = 0, t3 = d2 % Q, n3 = d2 - t3;
      for (; e3 < n3; ) u2(this.pattern.substr(e3, Q), e3), e3 += Q;
      if (t3) {
        let e4 = d2 - Q;
        u2(this.pattern.substr(e4), e4);
      }
    } else u2(this.pattern, 0);
  }
  searchIn(e2) {
    let { isCaseSensitive: t2, ignoreDiacritics: n2, includeMatches: r2 } = this.options;
    if (e2 = t2 ? e2 : e2.toLowerCase(), e2 = n2 ? tt(e2) : e2, this.pattern === e2) {
      let t3 = { isMatch: !0, score: 0 };
      return r2 && (t3.indices = [[0, e2.length - 1]]), t3;
    }
    let { location: i2, distance: a2, threshold: o2, findAllMatches: s2, minMatchCharLength: c2, ignoreLocation: l2 } = this.options, u2 = [], d2 = 0, f2 = !1;
    this.chunks.forEach(({ pattern: t3, alphabet: n3, startIndex: p3 }) => {
      let { isMatch: m2, score: h2, indices: g2 } = Xe(e2, t3, n3, { location: i2 + p3, distance: a2, threshold: o2, findAllMatches: s2, minMatchCharLength: c2, includeMatches: r2, ignoreLocation: l2 });
      m2 && (f2 = !0), d2 += h2, m2 && g2 && u2.push(...g2);
    });
    let p2 = { isMatch: f2, score: f2 ? d2 / this.chunks.length : 1 };
    return f2 && r2 && (p2.indices = Qe(u2)), p2;
  }
};
var rt = /* @__PURE__ */ new Set(["fuzzy", "include"]);
function it(e2) {
  return e2.startsWith("inverse");
}
var at = [{ type: "exact", multiRegex: /^="(.*)"$/, singleRegex: /^=(.*)$/, create: (e2) => ({ type: "exact", search(t2) {
  let n2 = t2 === e2;
  return { isMatch: n2, score: +!n2, indices: [0, e2.length - 1] };
} }) }, { type: "include", multiRegex: /^'"(.*)"$/, singleRegex: /^'(.*)$/, create: (e2) => ({ type: "include", search(t2) {
  let n2 = 0, r2, i2 = [], a2 = e2.length;
  for (; (r2 = t2.indexOf(e2, n2)) > -1; ) n2 = r2 + a2, i2.push([r2, n2 - 1]);
  let o2 = !!i2.length;
  return { isMatch: o2, score: +!o2, indices: i2 };
} }) }, { type: "prefix-exact", multiRegex: /^\^"(.*)"$/, singleRegex: /^\^(.*)$/, create: (e2) => ({ type: "prefix-exact", search(t2) {
  let n2 = t2.startsWith(e2);
  return { isMatch: n2, score: +!n2, indices: [0, e2.length - 1] };
} }) }, { type: "inverse-prefix-exact", multiRegex: /^!\^"(.*)"$/, singleRegex: /^!\^(.*)$/, create: (e2) => ({ type: "inverse-prefix-exact", search(t2) {
  let n2 = !t2.startsWith(e2);
  return { isMatch: n2, score: +!n2, indices: [0, t2.length - 1] };
} }) }, { type: "inverse-suffix-exact", multiRegex: /^!"(.*)"\$$/, singleRegex: /^!(.*)\$$/, create: (e2) => ({ type: "inverse-suffix-exact", search(t2) {
  let n2 = !t2.endsWith(e2);
  return { isMatch: n2, score: +!n2, indices: [0, t2.length - 1] };
} }) }, { type: "suffix-exact", multiRegex: /^"(.*)"\$$/, singleRegex: /^(.*)\$$/, create: (e2) => ({ type: "suffix-exact", search(t2) {
  let n2 = t2.endsWith(e2);
  return { isMatch: n2, score: +!n2, indices: [t2.length - e2.length, t2.length - 1] };
} }) }, { type: "inverse-exact", multiRegex: /^!"(.*)"$/, singleRegex: /^!(.*)$/, create: (e2) => ({ type: "inverse-exact", search(t2) {
  let n2 = t2.indexOf(e2) === -1;
  return { isMatch: n2, score: +!n2, indices: [0, t2.length - 1] };
} }) }, { type: "fuzzy", multiRegex: /^"(.*)"$/, singleRegex: /^(.*)$/, create: (e2, t2 = {}) => {
  let n2 = new nt(e2, { location: t2.location ?? Z.location, threshold: t2.threshold ?? Z.threshold, distance: t2.distance ?? Z.distance, includeMatches: t2.includeMatches ?? Z.includeMatches, findAllMatches: t2.findAllMatches ?? Z.findAllMatches, minMatchCharLength: t2.minMatchCharLength ?? Z.minMatchCharLength, isCaseSensitive: t2.isCaseSensitive ?? Z.isCaseSensitive, ignoreDiacritics: t2.ignoreDiacritics ?? Z.ignoreDiacritics, ignoreLocation: t2.ignoreLocation ?? Z.ignoreLocation });
  return { type: "fuzzy", search(e3) {
    return n2.searchIn(e3);
  } };
} }];
var ot = at.length;
var st = "\0";
var ct = "|";
function lt(e2) {
  let t2 = [], n2 = e2.length, r2 = 0;
  for (; r2 < n2; ) {
    for (; r2 < n2 && e2[r2] === " "; ) r2++;
    if (r2 >= n2) break;
    let i2 = r2;
    for (; i2 < n2 && e2[i2] !== " " && e2[i2] !== '"'; ) i2++;
    if (i2 < n2 && e2[i2] === '"') {
      for (i2++; i2 < n2; ) {
        if (e2[i2] === '"') {
          let t3 = i2 + 1;
          if (t3 >= n2 || e2[t3] === " ") {
            i2++;
            break;
          }
          if (e2[t3] === "$" && (t3 + 1 >= n2 || e2[t3 + 1] === " ")) {
            i2 += 2;
            break;
          }
        }
        i2++;
      }
      t2.push(e2.substring(r2, i2)), r2 = i2;
    } else {
      for (; i2 < n2 && e2[i2] !== " "; ) i2++;
      t2.push(e2.substring(r2, i2)), r2 = i2;
    }
  }
  return t2;
}
function ut(e2, t2) {
  let n2 = e2.match(t2);
  return n2 ? n2[1] : null;
}
function dt(e2, t2 = {}) {
  return e2.replace(/\\\|/g, st).split(ct).map((e3) => {
    let n2 = lt(e3.replace(/\u0000/g, "|").trim()).filter((e4) => e4 && !!e4.trim()), r2 = [];
    for (let e4 = 0, i2 = n2.length; e4 < i2; e4 += 1) {
      let i3 = n2[e4], a2 = !1, o2 = -1;
      for (; !a2 && ++o2 < ot; ) {
        let e5 = at[o2], n3 = ut(i3, e5.multiRegex);
        n3 && (r2.push(e5.create(n3, t2)), a2 = !0);
      }
      if (!a2) for (o2 = -1; ++o2 < ot; ) {
        let e5 = at[o2], n3 = ut(i3, e5.singleRegex);
        if (n3) {
          r2.push(e5.create(n3, t2));
          break;
        }
      }
    }
    return r2;
  });
}
var ft = class {
  constructor(e2, { isCaseSensitive: t2 = Z.isCaseSensitive, ignoreDiacritics: n2 = Z.ignoreDiacritics, includeMatches: r2 = Z.includeMatches, minMatchCharLength: i2 = Z.minMatchCharLength, ignoreLocation: a2 = Z.ignoreLocation, findAllMatches: o2 = Z.findAllMatches, location: s2 = Z.location, threshold: c2 = Z.threshold, distance: l2 = Z.distance } = {}) {
    this.query = null, this.options = { isCaseSensitive: t2, ignoreDiacritics: n2, includeMatches: r2, minMatchCharLength: i2, findAllMatches: o2, ignoreLocation: a2, location: s2, threshold: c2, distance: l2 }, e2 = t2 ? e2 : e2.toLowerCase(), e2 = n2 ? tt(e2) : e2, this.pattern = e2, this.query = dt(this.pattern, this.options);
  }
  static condition(e2, t2) {
    return t2.useExtendedSearch;
  }
  searchIn(e2) {
    let t2 = this.query;
    if (!t2) return { isMatch: !1, score: 1 };
    let { includeMatches: n2, isCaseSensitive: r2, ignoreDiacritics: i2 } = this.options;
    e2 = r2 ? e2 : e2.toLowerCase(), e2 = i2 ? tt(e2) : e2;
    let a2 = 0, o2 = [], s2 = 0, c2 = !1;
    for (let r3 = 0, i3 = t2.length; r3 < i3; r3 += 1) {
      let i4 = t2[r3];
      o2.length = 0, a2 = 0, c2 = !1;
      for (let t3 = 0, r4 = i4.length; t3 < r4; t3 += 1) {
        let r5 = i4[t3], { isMatch: l2, indices: u2, score: d2 } = r5.search(e2);
        if (l2) a2 += 1, s2 += d2, it(r5.type) && (c2 = !0), n2 && (rt.has(r5.type) ? o2.push(...u2) : o2.push(u2));
        else {
          s2 = 0, a2 = 0, o2.length = 0, c2 = !1;
          break;
        }
      }
      if (a2) {
        let e3 = { isMatch: !0, score: s2 / a2 };
        return c2 && (e3.hasInverse = !0), n2 && (e3.indices = Qe(o2)), e3;
      }
    }
    return { isMatch: !1, score: 1 };
  }
};
var pt = [];
function mt(...e2) {
  pt.push(...e2);
}
function ht(e2, t2) {
  for (let n2 = 0, r2 = pt.length; n2 < r2; n2 += 1) {
    let r3 = pt[n2];
    if (r3.condition(e2, t2)) return new r3(e2, t2);
  }
  return new nt(e2, t2);
}
var gt = { AND: "$and", OR: "$or" };
var _t = { PATH: "$path", PATTERN: "$val" };
var vt = (e2) => !!(e2[gt.AND] || e2[gt.OR]);
var yt = (e2) => !!e2[_t.PATH];
var bt = (e2) => !U(e2) && G(e2) && !vt(e2);
var xt = (e2) => ({ [gt.AND]: Object.keys(e2).map((t2) => ({ [t2]: e2[t2] })) });
function St(e2, t2, { auto: n2 = !0 } = {}) {
  let r2 = (e3) => {
    if (W(e3)) {
      let r3 = { keyId: null, pattern: e3 };
      return n2 && (r3.searcher = ht(e3, t2)), r3;
    }
    let i2 = Object.keys(e3), a2 = yt(e3);
    if (!a2 && i2.length > 1 && !vt(e3)) return r2(xt(e3));
    if (bt(e3)) {
      let r3 = a2 ? e3[_t.PATH] : i2[0], o3 = a2 ? e3[_t.PATTERN] : e3[r3];
      if (!W(o3)) throw Error(Ne(r3));
      let s2 = { keyId: ze(r3), pattern: o3 };
      return n2 && (s2.searcher = ht(o3, t2)), s2;
    }
    let o2 = { children: [], operator: i2[0] };
    return i2.forEach((t3) => {
      let n3 = e3[t3];
      U(n3) && n3.forEach((e4) => {
        o2.children.push(r2(e4));
      });
    }), o2;
  };
  return vt(e2) || (e2 = xt(e2)), r2(e2);
}
function Ct(e2, { ignoreFieldNorm: t2 = Z.ignoreFieldNorm }) {
  let n2 = 1;
  return e2.forEach(({ key: e3, norm: r2, score: i2 }) => {
    let a2 = e3 ? e3.weight : null;
    n2 *= (i2 === 0 && a2 ? 2 ** -52 : i2) ** +((a2 || 1) * (t2 ? 1 : r2));
  }), n2;
}
function wt(e2, { ignoreFieldNorm: t2 = Z.ignoreFieldNorm }) {
  e2.forEach((e3) => {
    e3.score = Ct(e3.matches, { ignoreFieldNorm: t2 });
  });
}
var Tt = class {
  constructor(e2) {
    this.limit = e2, this.heap = [];
  }
  get size() {
    return this.heap.length;
  }
  shouldInsert(e2) {
    return this.size < this.limit || e2 < this.heap[0].score;
  }
  insert(e2) {
    this.size < this.limit ? (this.heap.push(e2), this._bubbleUp(this.size - 1)) : e2.score < this.heap[0].score && (this.heap[0] = e2, this._sinkDown(0));
  }
  extractSorted(e2) {
    return this.heap.sort(e2);
  }
  _bubbleUp(e2) {
    let t2 = this.heap;
    for (; e2 > 0; ) {
      let n2 = e2 - 1 >> 1;
      if (t2[e2].score <= t2[n2].score) break;
      let r2 = t2[e2];
      t2[e2] = t2[n2], t2[n2] = r2, e2 = n2;
    }
  }
  _sinkDown(e2) {
    let t2 = this.heap, n2 = t2.length, r2 = e2;
    do {
      e2 = r2;
      let i2 = 2 * e2 + 1, a2 = 2 * e2 + 2;
      if (i2 < n2 && t2[i2].score > t2[r2].score && (r2 = i2), a2 < n2 && t2[a2].score > t2[r2].score && (r2 = a2), r2 !== e2) {
        let n3 = t2[e2];
        t2[e2] = t2[r2], t2[r2] = n3;
      }
    } while (r2 !== e2);
  }
};
function Et(e2) {
  let t2 = [];
  return e2.matches.forEach((e3) => {
    if (!K(e3.indices) || !e3.indices.length) return;
    let n2 = { indices: e3.indices, value: e3.value };
    e3.key && (n2.key = e3.key.id), e3.idx > -1 && (n2.refIndex = e3.idx), t2.push(n2);
  }), t2;
}
function Dt(e2, t2, { includeMatches: n2 = Z.includeMatches, includeScore: r2 = Z.includeScore } = {}) {
  return e2.map((e3) => {
    let { idx: i2 } = e3, a2 = { item: t2[i2], refIndex: i2 };
    return n2 && (a2.matches = Et(e3)), r2 && (a2.score = e3.score), a2;
  });
}
var Ot = /[\p{L}\p{M}\p{N}_]+/gu;
var kt = /* @__PURE__ */ new WeakSet();
function At(e2) {
  kt.has(e2) || (kt.add(e2), console.warn(`[Fuse] tokenize regex ${e2} lacks the global flag; only the first match per text will be returned. Add the 'g' flag.`));
}
function jt(e2) {
  if (typeof e2 == "function") {
    let t2 = !1;
    return (n2) => {
      let r2 = e2(n2);
      if (!t2 && (t2 = !0, !Array.isArray(r2) || r2.some((e3) => typeof e3 != "string"))) throw Error(`[Fuse] tokenize function must return string[]; received ${Array.isArray(r2) ? "array containing non-strings" : typeof r2}.`);
      return r2;
    };
  }
  return e2 instanceof RegExp ? (e2.global || At(e2), (t2) => t2.match(e2) || []) : (e3) => e3.match(Ot) || [];
}
function Mt({ isCaseSensitive: e2 = !1, ignoreDiacritics: t2 = !1, tokenize: n2 } = {}) {
  let r2 = jt(n2);
  return { tokenize(n3) {
    return e2 || (n3 = n3.toLowerCase()), t2 && (n3 = tt(n3)), r2(n3);
  } };
}
var Nt = 31;
var Pt = class {
  static condition(e2, t2) {
    return t2.useTokenSearch;
  }
  constructor(e2, t2) {
    this.options = t2, this.analyzer = Mt({ isCaseSensitive: t2.isCaseSensitive, ignoreDiacritics: t2.ignoreDiacritics, tokenize: t2.tokenize });
    let n2 = this.analyzer.tokenize(e2), { df: r2, fieldCount: i2 } = t2._invertedIndex;
    this.termSearchers = [], this.idfWeights = [];
    for (let e3 of n2) {
      this.termSearchers.push(new nt(e3, { location: t2.location, threshold: t2.threshold, distance: t2.distance, includeMatches: t2.includeMatches, findAllMatches: t2.findAllMatches, minMatchCharLength: t2.minMatchCharLength, isCaseSensitive: t2.isCaseSensitive, ignoreDiacritics: t2.ignoreDiacritics, ignoreLocation: !0 }));
      let n3 = r2.get(e3) || 0, a2 = Math.log(1 + (i2 - n3 + 0.5) / (n3 + 0.5));
      this.idfWeights.push(a2);
    }
    this.combineAll = t2.tokenMatch === "all", this.numTerms = this.termSearchers.length, this.useMask = this.numTerms <= Nt;
  }
  searchIn(e2) {
    if (!this.termSearchers.length) return { isMatch: !1, score: 1 };
    let t2 = [], n2 = 0, r2 = 0, i2 = 0, a2 = 0, o2 = this.combineAll && !this.useMask ? /* @__PURE__ */ new Set() : null;
    for (let s3 = 0; s3 < this.termSearchers.length; s3++) {
      let c3 = this.termSearchers[s3].searchIn(e2), l2 = this.idfWeights[s3];
      r2 += l2, c3.isMatch && (i2++, n2 += l2 * (1 - c3.score), c3.indices && t2.push(...c3.indices), this.combineAll && (this.useMask ? a2 |= 1 << s3 : o2.add(s3)));
    }
    if (i2 === 0) return { isMatch: !1, score: 1 };
    let s2 = r2 > 0 ? 1 - n2 / r2 : 0, c2 = { isMatch: !0, score: Math.max(1e-3, s2) };
    return this.options.includeMatches && t2.length && (c2.indices = Qe(t2)), this.combineAll && (this.useMask ? c2.matchedMask = a2 : c2.matchedTerms = o2, c2.termCount = this.numTerms), c2;
  }
};
function Ft(e2, t2, n2, r2) {
  let i2 = r2.tokenize(t2);
  if (!i2.length) return;
  e2.fieldCount++, e2.docFieldCount.set(n2, (e2.docFieldCount.get(n2) || 0) + 1);
  let a2 = new Set(i2), o2 = e2.docTermFieldHits.get(n2);
  o2 || (o2 = /* @__PURE__ */ new Map(), e2.docTermFieldHits.set(n2, o2));
  for (let t3 of a2) o2.set(t3, (o2.get(t3) || 0) + 1), e2.df.set(t3, (e2.df.get(t3) || 0) + 1);
}
function It(e2, t2, n2, r2) {
  let { i: i2, v: a2, $: o2 } = t2;
  if (a2 !== void 0) Ft(e2, a2, i2, r2);
  else if (o2) for (let t3 = 0; t3 < n2; t3++) {
    let n3 = o2[t3];
    if (n3)
      if (Array.isArray(n3)) for (let t4 of n3) Ft(e2, t4.v, i2, r2);
      else Ft(e2, n3.v, i2, r2);
  }
}
function Lt(e2, t2, n2) {
  let r2 = { fieldCount: 0, df: /* @__PURE__ */ new Map(), docFieldCount: /* @__PURE__ */ new Map(), docTermFieldHits: /* @__PURE__ */ new Map() };
  for (let i2 of e2) It(r2, i2, t2, n2);
  return r2;
}
function Rt(e2, t2, n2, r2) {
  It(e2, t2, n2, r2);
}
function zt(e2, t2) {
  let n2 = e2.docFieldCount.get(t2);
  if (n2 === void 0) return;
  e2.fieldCount -= n2, e2.docFieldCount.delete(t2);
  let r2 = e2.docTermFieldHits.get(t2);
  if (r2) {
    for (let [t3, n3] of r2) {
      let r3 = (e2.df.get(t3) || 0) - n3;
      r3 <= 0 ? e2.df.delete(t3) : e2.df.set(t3, r3);
    }
    e2.docTermFieldHits.delete(t2);
  }
}
function Bt(e2, t2) {
  if (t2.length === 0) return;
  let n2 = Array.from(new Set(t2)).sort((e3, t3) => e3 - t3);
  for (let t3 of n2) zt(e2, t3);
  let r2 = (e3) => {
    let t3 = 0, r3 = n2.length;
    for (; t3 < r3; ) {
      let i3 = t3 + r3 >>> 1;
      n2[i3] < e3 ? t3 = i3 + 1 : r3 = i3;
    }
    return e3 - t3;
  }, i2 = n2[0], a2 = /* @__PURE__ */ new Map();
  for (let [t3, n3] of e2.docFieldCount) a2.set(t3 > i2 ? r2(t3) : t3, n3);
  e2.docFieldCount = a2;
  let o2 = /* @__PURE__ */ new Map();
  for (let [t3, n3] of e2.docTermFieldHits) o2.set(t3 > i2 ? r2(t3) : t3, n3);
  e2.docTermFieldHits = o2;
}
var $ = class {
  constructor(e2, t2, n2) {
    this.options = { ...Z, ...t2 }, this.options.useExtendedSearch, this.options.useTokenSearch, this._keyStore = new Ie(this.options.keys), this._docs = e2, this._myIndex = null, this._invertedIndex = null, this.setCollection(e2, n2), this._lastQuery = null, this._lastSearcher = null;
  }
  _getSearcher(e2) {
    if (this._lastQuery === e2) return this._lastSearcher;
    let t2 = ht(e2, this._invertedIndex ? { ...this.options, _invertedIndex: this._invertedIndex } : this.options);
    return this._lastQuery = e2, this._lastSearcher = t2, t2;
  }
  setCollection(e2, t2) {
    if (this._docs = e2, t2 && !(t2 instanceof Ke)) throw Error(Me);
    if (this._myIndex = t2 || qe(this.options.keys, this._docs, { getFn: this.options.getFn, fieldNormWeight: this.options.fieldNormWeight }), this.options.useTokenSearch) {
      let e3 = Mt({ isCaseSensitive: this.options.isCaseSensitive, ignoreDiacritics: this.options.ignoreDiacritics, tokenize: this.options.tokenize });
      this._invertedIndex = Lt(this._myIndex.records, this._myIndex.keys.length, e3);
    }
    this._invalidateSearcherCache();
  }
  add(e2) {
    if (!K(e2)) return;
    this._docs.push(e2);
    let t2 = this._myIndex.add(e2, this._docs.length - 1);
    if (this._invertedIndex && t2) {
      let e3 = Mt({ isCaseSensitive: this.options.isCaseSensitive, ignoreDiacritics: this.options.ignoreDiacritics, tokenize: this.options.tokenize });
      Rt(this._invertedIndex, t2, this._myIndex.keys.length, e3);
    }
    this._invalidateSearcherCache();
  }
  remove(e2 = () => !1) {
    let t2 = [], n2 = [];
    for (let r2 = 0, i2 = this._docs.length; r2 < i2; r2 += 1) e2(this._docs[r2], r2) && (t2.push(this._docs[r2]), n2.push(r2));
    if (n2.length) {
      this._invertedIndex && Bt(this._invertedIndex, n2);
      let e3 = new Set(n2);
      this._docs = this._docs.filter((t3, n3) => !e3.has(n3)), this._myIndex.removeAll(n2), this._invalidateSearcherCache();
    }
    return t2;
  }
  removeAt(e2) {
    if (!Number.isInteger(e2) || e2 < 0 || e2 >= this._docs.length) throw Error(q);
    this._invertedIndex && Bt(this._invertedIndex, [e2]);
    let t2 = this._docs.splice(e2, 1)[0];
    return this._myIndex.removeAt(e2), this._invalidateSearcherCache(), t2;
  }
  _invalidateSearcherCache() {
    this._lastQuery = null, this._lastSearcher = null;
  }
  getIndex() {
    return this._myIndex;
  }
  search(e2, t2) {
    let { limit: n2 = -1 } = t2 || {}, { includeMatches: r2, includeScore: i2, shouldSort: a2, sortFn: o2, ignoreFieldNorm: s2 } = this.options;
    if (W(e2) && !e2.trim()) {
      let e3 = this._docs.map((e4, t3) => ({ item: e4, refIndex: t3 }));
      return De(n2) && n2 > -1 && (e3 = e3.slice(0, n2)), e3;
    }
    let c2 = De(n2) && n2 > 0 && W(e2), l2;
    if (c2) {
      let t3 = new Tt(n2);
      W(this._docs[0]) ? this._searchStringList(e2, { heap: t3, ignoreFieldNorm: s2 }) : this._searchObjectList(e2, { heap: t3, ignoreFieldNorm: s2 }), l2 = t3.extractSorted(o2);
    } else l2 = W(e2) ? W(this._docs[0]) ? this._searchStringList(e2) : this._searchObjectList(e2) : this._searchLogical(e2), wt(l2, { ignoreFieldNorm: s2 }), a2 && l2.sort(o2), De(n2) && n2 > -1 && (l2 = l2.slice(0, n2));
    return Dt(l2, this._docs, { includeMatches: r2, includeScore: i2 });
  }
  _searchStringList(e2, { heap: t2, ignoreFieldNorm: n2 } = {}) {
    let r2 = this._getSearcher(e2), i2 = this.options.useTokenSearch && this.options.tokenMatch === "all", { records: a2 } = this._myIndex, o2 = t2 ? null : [];
    return a2.forEach(({ v: e3, i: a3, n: s2 }) => {
      if (!K(e3)) return;
      let c2 = r2.searchIn(e3);
      if (c2.isMatch) {
        let r3 = { score: c2.score, value: e3, norm: s2, indices: c2.indices };
        i2 && (r3.matchedMask = c2.matchedMask, r3.matchedTerms = c2.matchedTerms, r3.termCount = c2.termCount);
        let l2 = [r3];
        if (!i2 || this._coversAllTokens(l2)) {
          let r4 = { item: e3, idx: a3, matches: l2 };
          t2 ? (r4.score = Ct(r4.matches, { ignoreFieldNorm: n2 }), t2.shouldInsert(r4.score) && t2.insert(r4)) : o2.push(r4);
        }
      }
    }), o2;
  }
  _searchLogical(e2) {
    let t2 = St(e2, this.options), n2 = (e3, t3, r3) => {
      if (!("children" in e3)) {
        let { keyId: n3, searcher: i4 } = e3, a4;
        return n3 === null ? (a4 = [], this._myIndex.keys.forEach((e4, n4) => {
          a4.push(...this._findMatches({ key: e4, value: t3[n4], searcher: i4 }));
        })) : a4 = this._findMatches({ key: this._keyStore.get(n3), value: this._myIndex.getValueForItemAtKeyId(t3, n3), searcher: i4 }), a4 && a4.length ? [{ idx: r3, item: t3, matches: a4 }] : [];
      }
      let { children: i3, operator: a3 } = e3, o2 = [];
      for (let e4 = 0, s2 = i3.length; e4 < s2; e4 += 1) {
        let s3 = i3[e4], c2 = n2(s3, t3, r3);
        if (c2.length) o2.push(...c2);
        else if (a3 === gt.AND) return [];
      }
      return o2;
    }, r2 = this._myIndex.records, i2 = /* @__PURE__ */ new Map(), a2 = [];
    return r2.forEach(({ $: e3, i: r3 }) => {
      if (K(e3)) {
        let o2 = n2(t2, e3, r3);
        o2.length && (i2.has(r3) || (i2.set(r3, { idx: r3, item: e3, matches: [] }), a2.push(i2.get(r3))), o2.forEach(({ matches: e4 }) => {
          i2.get(r3).matches.push(...e4);
        }));
      }
    }), a2;
  }
  _searchObjectList(e2, { heap: t2, ignoreFieldNorm: n2 } = {}) {
    let r2 = this._getSearcher(e2), i2 = this.options.useTokenSearch && this.options.tokenMatch === "all", { keys: a2, records: o2 } = this._myIndex, s2 = t2 ? null : [];
    return o2.forEach(({ $: e3, i: o3 }) => {
      if (!K(e3)) return;
      let c2 = [], l2 = !1, u2 = !1;
      if (a2.forEach((t3, n3) => {
        let i3 = this._findMatches({ key: t3, value: e3[n3], searcher: r2 });
        i3.length ? (c2.push(...i3), i3[0].hasInverse && (u2 = !0)) : l2 = !0;
      }), !(u2 && l2) && c2.length && (!i2 || this._coversAllTokens(c2))) {
        let r3 = { idx: o3, item: e3, matches: c2 };
        t2 ? (r3.score = Ct(r3.matches, { ignoreFieldNorm: n2 }), t2.shouldInsert(r3.score) && t2.insert(r3)) : s2.push(r3);
      }
    }), s2;
  }
  _findMatches({ key: e2, value: t2, searcher: n2 }) {
    if (!K(t2)) return [];
    let r2 = [];
    if (U(t2)) t2.forEach(({ v: t3, i: i2, n: a2 }) => {
      if (!K(t3)) return;
      let o2 = n2.searchIn(t3);
      if (o2.isMatch) {
        let n3 = { score: o2.score, key: e2, value: t3, idx: i2, norm: a2, indices: o2.indices, hasInverse: o2.hasInverse };
        o2.termCount !== void 0 && (n3.matchedMask = o2.matchedMask, n3.matchedTerms = o2.matchedTerms, n3.termCount = o2.termCount), r2.push(n3);
      }
    });
    else {
      let { v: i2, n: a2 } = t2, o2 = n2.searchIn(i2);
      if (o2.isMatch) {
        let t3 = { score: o2.score, key: e2, value: i2, norm: a2, indices: o2.indices, hasInverse: o2.hasInverse };
        o2.termCount !== void 0 && (t3.matchedMask = o2.matchedMask, t3.matchedTerms = o2.matchedTerms, t3.termCount = o2.termCount), r2.push(t3);
      }
    }
    return r2;
  }
  _coversAllTokens(e2) {
    let t2 = e2.length ? e2[0].termCount : void 0;
    if (t2 === void 0) return !0;
    if (t2 <= Nt) {
      let n3 = 0;
      for (let t3 = 0; t3 < e2.length; t3++) n3 |= e2[t3].matchedMask || 0;
      return n3 === 2 ** t2 - 1;
    }
    let n2 = /* @__PURE__ */ new Set();
    for (let t3 = 0; t3 < e2.length; t3++) {
      let r2 = e2[t3].matchedTerms;
      if (r2) for (let e3 of r2) n2.add(e3);
    }
    return n2.size === t2;
  }
};
($.version = "7.4.1");
($.createIndex = qe);
($.parseIndex = Je);
($.config = Z);
($.match = function(e2, t2, n2) {
  if (n2 && n2.useTokenSearch) throw Error(X);
  return ht(e2, { ...Z, ...n2 }).searchIn(t2);
});
($.parseQuery = St);
(mt(ft));
(mt(Pt));
($.use = function(...e2) {
  e2.forEach((e3) => mt(e3));
});
var Vt = { class: "tt-primary text-3 font-500 leading-5 label" };
var Ht = P(t({ __name: "m-input-label", props: { label: {}, tooltip: {}, required: { type: Boolean } }, setup(e2) {
  return (t2, n2) => {
    let r2 = he, i2 = ge;
    return d(), x("label", { class: v(["inline-flex items-center", { "label--required": e2.required }]) }, [y("span", Vt, C(e2.label), 1), e2.tooltip ? le((d(), D(r2, { key: 0, class: "ml-1 align-middle", name: "base/rx_ic_info", color: "var(--colors-icon-icon-note, #AFB7BB)", size: "12" }, null, 512)), [[i2, { value: e2.tooltip, showDelay: 300, pt: { root: "!max-w-70" } }, void 0, { top: !0 }]]) : E("", !0)], 2);
  };
} }), [["__scopeId", "data-v-133e8c3c"]]);
var Ut = { content: "_content_p6yjw_1" };
var Wt = {};
function Gt(e2, t2) {
  return d(), x("div", { class: v(["flex items-start", e2.group.content]) }, [a(e2.$slots, "default")], 2);
}
var Kt = P(Wt, [["render", Gt], ["__cssModules", { group: Ut }]]);
var qt = ["id", "disabled", "tabindex", "name", "aria-expanded", "aria-label", "aria-labelledby", "aria-disabled"];
var Jt = { key: 0, class: "selectitem" };
var Yt = { key: 1, class: "tt-secondary opacity-54" };
var Xt = ["name", "value"];
var Zt = { class: "m-input-cascade-select-body" };
var Qt = { key: 0, class: "m-input-cascade-select-empty" };
var en = ["data-search-index", "disabled", "onMouseenter", "onClick"];
var tn = { class: "m-input-cascade-select-option-content" };
var nn = { class: "selectitem selectitem--path" };
var rn = { key: 0, class: "selectitem__separator", "aria-hidden": "true" };
var an = { class: "selectitem__segment" };
var on = ["src"];
var sn = { class: "selectitem__label" };
var cn = { key: 0, class: "selectitem__match" };
var ln = { key: 0, class: "m-input-cascade-select-empty" };
var un = ["data-level", "data-index", "disabled", "aria-haspopup", "aria-expanded", "onMouseenter", "onClick"];
var dn = { class: "m-input-cascade-select-option-content" };
var fn = { class: "selectitem" };
var pn = ["src"];
var mn = { key: 0, class: "m-input-cascade-select-group-icon" };
var hn = P(t({ inheritAttrs: !1, __name: "m-input-cascade-select", props: { modelValue: {}, defaultValue: {}, name: {}, options: {}, optionLabel: { type: [String, Function], default: "label" }, optionValue: {}, optionDisabled: {}, optionGroupLabel: { type: [String, Function], default: "label" }, optionGroupChildren: {}, optionLeaf: {}, dataKey: {}, placeholder: {}, breakpoint: {}, invalid: { type: Boolean }, disabled: { type: Boolean }, variant: {}, showClear: { type: Boolean, default: !1 }, clearIcon: {}, inputId: {}, inputStyle: {}, inputClass: {}, inputProps: {}, panelStyle: {}, panelClass: {}, panelProps: {}, overlayStyle: {}, overlayClass: {}, overlayProps: {}, appendTo: {}, loading: { type: Boolean }, dropdownIcon: {}, loadingIcon: {}, optionGroupIcon: {}, autoOptionFocus: { type: Boolean }, selectOnFocus: { type: Boolean }, focusOnHover: { type: Boolean, default: !0 }, searchLocale: {}, filter: { type: Boolean }, filterFields: {}, searchMessage: {}, selectionMessage: {}, emptySelectionMessage: {}, emptySearchMessage: {}, emptyMessage: {}, tabindex: {}, fluid: { type: Boolean }, ariaLabelledby: {}, ariaLabel: {}, formControl: {}, dt: {}, pt: {}, ptOptions: {}, unstyled: { type: Boolean }, icon: {}, iconColor: { default: "var(--colors-text-text-primary, #171c1f)" }, size: { default: "sm" }, darkMode: { type: Boolean, default: !1 }, getOptions: {}, onChange: {}, pathSeparator: {} }, emits: ["update:modelValue", "valueChange", "change", "groupChange", "beforeShow", "beforeHide", "show", "hide", "focus", "blur", "click"], setup(n2, { emit: f2 }) {
  let g2 = n2, b2 = f2, ne2 = t({ name: "FormFieldIsolate", setup(e2, { slots: t2 }) {
    return i("$pcFormField", null), () => t2.default?.();
  } }), re2 = ee(), ae2 = ce(), le2 = m("root"), k2 = m("trigger"), M2 = m("overlay"), pe2 = m("searchInput"), N2 = te("$pcFormField", null), me2 = de(document.body), P2 = l(g2.options), ge2 = l(g2.defaultValue), F2 = l(!1), I2 = l([]), L2 = l(""), R2 = l({ level: 0, index: -1 }), z2 = l(-1), ve2 = l({}), ye2 = `m-cascade-${ie()}`, B2 = _(() => g2.options ?? P2.value ?? []), be2 = _(() => N2?.field?.states), xe2 = _(() => N2?.field?.props ?? {}), V2 = _(() => g2.modelValue === void 0 ? be2.value?.value === void 0 ? ge2.value : be2.value.value : g2.modelValue), Se2 = _(() => Object.fromEntries(Object.entries(ae2).filter(([e2]) => e2 !== "class" && e2 !== "style" && !e2.startsWith("on")))), Ce2 = _(() => Object.keys(re2).filter((e2) => !["default", "dropdownicon", "clearicon", "loadingicon", "optiongroupicon", "option", "value", "value-extra", "option-extra", "header", "footer"].includes(e2))), H2 = _(() => Ie2(B2.value, V2.value, 0)), we2 = _(() => Le2(B2.value, V2.value, 0)?.parents ?? []), U2 = _(() => {
    let e2 = Le2(B2.value, V2.value, 0);
    return e2 ? [...e2.parents, e2.option] : [];
  }), Te2 = _(() => U2.value.map((e2, t2) => ({ option: e2, label: Ne2(e2, t2 < U2.value.length - 1), visual: ze2(e2) }))), Ee2 = _(() => H2.value ? g2.pathSeparator ? Te2.value.map((e2) => e2.label).filter(Boolean).join(g2.pathSeparator) : Ne2(H2.value) : ""), W2 = _(() => {
    let e2 = [{ options: B2.value, level: 0 }];
    return I2.value.forEach((t2, n3) => {
      let r2 = Pe2(t2, n3);
      r2.length && e2.push({ options: r2, parent: t2, level: n3 + 1 });
    }), e2;
  }), De2 = _(() => g2.filter && L2.value.trim().length > 0), Oe2 = _(() => Re2(B2.value, 0)), G2 = _(() => {
    let e2 = L2.value.trim();
    if (!e2 || !g2.filter) return [];
    let t2 = g2.filterFields?.length ? g2.filterFields : ["pathLabels"];
    return new $(Oe2.value, { threshold: 0.3, keys: t2, ignoreLocation: !0 }).search(e2).map((e3) => e3.item);
  }), ke2 = _(() => g2.appendTo && g2.appendTo !== "self" ? g2.appendTo : "body"), K2 = _(() => g2.appendTo !== "self"), Ae2 = _(() => ({ ...K2.value ? { position: "fixed", ...ve2.value } : {}, ...g2.overlayStyle ?? g2.panelStyle ?? {} })), je2 = _(() => ["m-input-cascade-select-panel", g2.overlayClass, g2.panelClass]), Me2 = _(() => V2.value !== null && V2.value !== void 0 && V2.value !== "");
  se(() => g2.options, (e2) => {
    e2 && (P2.value = e2);
  }), se(L2, (e2) => {
    z2.value = -1, e2.trim() || (I2.value = [...we2.value]);
  }), o(async () => {
    g2.getOptions && e(g2.getOptions) && (P2.value = await g2.getOptions());
  }), u(() => {
    fe(document, "pointerdown", ot2, !0), fe(window, "resize", st2), fe(window, "scroll", st2, { capture: !0, passive: !0 });
  }), c(() => {
    me2.value = !1;
  });
  function q2(e2, t2, n3 = e2) {
    return t2 ? typeof t2 == "function" ? t2(e2) : e2?.[t2] : n3;
  }
  function Ne2(e2, t2 = !1) {
    if (e2 == null) return "";
    let n3 = t2 ? g2.optionGroupLabel : g2.optionLabel;
    return String(q2(e2, n3, e2?.label ?? e2));
  }
  function Pe2(e2, t2) {
    let n3 = g2.optionGroupChildren, r2 = Array.isArray(n3) ? n3[t2] : n3, i2 = r2 ? typeof r2 == "function" ? r2(e2, t2) : e2?.[r2] : n3 === void 0 ? e2?.children : void 0;
    return Array.isArray(i2) ? i2 : [];
  }
  function J2(e2, t2) {
    let n3 = Pe2(e2, t2);
    if (!n3.length) return !0;
    let r2 = g2.optionLeaf;
    return r2 ? (typeof r2 == "function" ? r2(e2, { level: t2, children: n3 }) : e2?.[r2]) === !0 : !1;
  }
  function Y2(e2, t2) {
    return !J2(e2, t2);
  }
  function X2(e2) {
    return !!q2(e2, g2.optionDisabled, !1);
  }
  function Fe2(e2, t2) {
    return g2.dataKey && e2 && t2 && typeof t2 == "object" ? e2[g2.dataKey] === t2[g2.dataKey] : q2(e2, g2.optionValue) === t2;
  }
  function Ie2(e2, t2, n3) {
    for (let r2 of e2) {
      if (Fe2(r2, t2) && J2(r2, n3)) return r2;
      if (Y2(r2, n3)) {
        let e3 = Ie2(Pe2(r2, n3), t2, n3 + 1);
        if (e3) return e3;
      }
    }
  }
  function Le2(e2, t2, n3) {
    for (let r2 of e2) {
      if (Fe2(r2, t2) && J2(r2, n3)) return { parents: [], option: r2 };
      if (Y2(r2, n3)) {
        let e3 = Le2(Pe2(r2, n3), t2, n3 + 1);
        if (e3) return { parents: [r2, ...e3.parents], option: e3.option };
      }
    }
  }
  function Re2(e2, t2, n3 = []) {
    let r2 = [];
    for (let i2 of e2) {
      let e3 = [...n3, i2];
      if (J2(i2, t2)) {
        let n4 = e3.map((t3, n5) => ({ option: t3, label: Ne2(t3, n5 < e3.length - 1), visual: ze2(t3) }));
        r2.push({ option: i2, level: t2, path: e3, pathSegments: n4, pathLabels: n4.map((e4) => e4.label).filter(Boolean).join(g2.pathSeparator ?? " / ") });
      } else Y2(i2, t2) && r2.push(...Re2(Pe2(i2, t2), t2 + 1, e3));
    }
    return r2;
  }
  function ze2(e2) {
    return !e2 || typeof e2 != "object" ? {} : e2.image ? { image: e2.image, darkImage: e2.darkImage || e2.image } : e2.icon ? { icon: e2.icon } : {};
  }
  function Be2(e2, t2) {
    let n3 = String(e2 ?? ""), r2 = t2.trim();
    if (!n3 || !r2) return [{ text: n3, matched: !1 }];
    let i2 = n3.toLocaleLowerCase(g2.searchLocale), a2 = r2.toLocaleLowerCase(g2.searchLocale), o2 = [], s2 = 0;
    for (; s2 < n3.length; ) {
      let e3 = i2.indexOf(a2, s2);
      if (e3 === -1) {
        o2.push({ text: n3.slice(s2), matched: !1 });
        break;
      }
      e3 > s2 && o2.push({ text: n3.slice(s2, e3), matched: !1 }), o2.push({ text: n3.slice(e3, e3 + r2.length), matched: !0 }), s2 = e3 + r2.length;
    }
    return o2.length ? o2 : [{ text: n3, matched: !1 }];
  }
  function Ve2(e2, t2 = {}) {
    let n3 = g2.pt, r2 = typeof n3 == "function" ? n3({ props: g2, state: { overlayVisible: F2.value }, ...t2 })?.[e2] : n3?.[e2], i2 = typeof r2 == "function" ? r2({ props: g2, state: { overlayVisible: F2.value }, ...t2 }) : r2;
    return typeof i2 == "string" ? { class: i2 } : i2 ?? {};
  }
  function He2() {
    return { options: B2.value, optionLabel: g2.optionLabel, optionValue: g2.optionValue, optionGroupLabel: g2.optionGroupLabel, optionGroupChildren: g2.optionGroupChildren, optionLeaf: g2.optionLeaf, ...Object.fromEntries(Object.entries(ae2).filter(([t2, n3]) => !e(n3))) };
  }
  function Ue2(e2, t2) {
    ge2.value = e2, b2("update:modelValue", e2), b2("valueChange", e2);
    let n3 = { originalEvent: t2, value: e2, props: He2() };
    xe2.value.onChange?.(n3), g2.onChange?.(n3), be2.value?.invalid && N2?.$pcForm?.validate && N2?.name && N2.$pcForm.validate(N2.name);
  }
  function We2(e2) {
    g2.disabled || F2.value || (b2("beforeShow"), L2.value = "", z2.value = -1, I2.value = [...we2.value], F2.value = !0, me2.value = !0, r(() => {
      st2(), g2.filter ? pe2.value?.focus() : g2.autoOptionFocus && Ze2(), b2("show");
    }), e2 && b2("click", e2));
  }
  function Z2() {
    F2.value && (b2("beforeHide"), F2.value = !1, me2.value = !1, L2.value = "", R2.value = { level: 0, index: -1 }, z2.value = -1, b2("hide"));
  }
  function Ge2(e2) {
    F2.value ? Z2() : We2(e2);
  }
  function Ke2(e2, t2, n3) {
    if (X2(e2) || !Y2(e2, t2)) return;
    I2.value = [...I2.value.slice(0, t2), e2];
    let r2 = { originalEvent: n3, value: q2(e2, g2.optionValue), props: He2() };
    b2("groupChange", r2);
  }
  function qe2(e2, t2, n3) {
    g2.focusOnHover && (R2.value = { level: t2, index: n3 }), Y2(e2, t2) && Ke2(e2, t2);
  }
  function Je2(e2, t2, n3) {
    X2(e2) || Y2(e2, t2) || Ye2(e2, t2, n3);
  }
  function Ye2(e2, t2, n3) {
    X2(e2) || (Y2(e2, t2) ? (Ke2(e2, t2, n3), r(() => Ze2(t2 + 1))) : (Ue2(q2(e2, g2.optionValue), n3), Z2(), k2.value?.focus()));
  }
  function Q2(e2, t2) {
    X2(e2.option) || (Ue2(q2(e2.option, g2.optionValue), t2), Z2(), k2.value?.focus());
  }
  function Xe2(e2) {
    Ue2(null, e2), Z2(), k2.value?.focus();
  }
  function Ze2(e2 = 0) {
    let t2 = (W2.value[e2]?.options ?? []).findIndex((e3) => !X2(e3));
    R2.value = { level: e2, index: t2 }, r(() => Qe2());
  }
  function Qe2() {
    R2.value.index < 0 || M2.value?.querySelector(`[data-level="${R2.value.level}"][data-index="${R2.value.index}"]`)?.focus();
  }
  function $e2(e2) {
    let { level: t2, index: n3 } = R2.value, i2 = W2.value[t2]?.options ?? [];
    if (!i2.length) return;
    let a2 = n3;
    do
      a2 = (a2 + e2 + i2.length) % i2.length;
    while (X2(i2[a2]) && a2 !== n3);
    R2.value = { level: t2, index: a2 }, r(() => Qe2());
  }
  function et2(e2) {
    ["Enter", " ", "ArrowDown"].includes(e2.key) ? (e2.preventDefault(), F2.value || We2(e2)) : e2.key === "Escape" && F2.value && (e2.preventDefault(), Z2());
  }
  function tt2(e2) {
    ["ArrowDown", "ArrowUp", "Enter", " ", "Escape", "Tab"].includes(e2.key) && (e2.key === "ArrowDown" || e2.key === "ArrowUp" ? (e2.preventDefault(), z2.value < 0 ? nt2() : it2(e2.key === "ArrowDown" ? 1 : -1)) : at2(e2));
  }
  function nt2() {
    let e2 = G2.value.findIndex((e3) => !X2(e3.option));
    z2.value = e2, r(() => rt2());
  }
  function rt2() {
    z2.value < 0 || M2.value?.querySelector(`[data-search-index="${z2.value}"]`)?.focus();
  }
  function it2(e2) {
    let t2 = G2.value;
    if (!t2.length) return;
    let n3 = z2.value < 0 ? e2 > 0 ? 0 : t2.length - 1 : z2.value, i2 = n3;
    do
      n3 = (n3 + e2 + t2.length) % t2.length;
    while (X2(t2[n3].option) && n3 !== i2 && n3 !== z2.value);
    z2.value = n3, r(() => rt2());
  }
  function at2(e2) {
    if (De2.value)
      if (e2.key === "ArrowDown" || e2.key === "ArrowUp") e2.preventDefault(), it2(e2.key === "ArrowDown" ? 1 : -1);
      else if (e2.key === "Enter" || e2.key === " ") {
        let t2 = G2.value[z2.value];
        t2 && (e2.preventDefault(), Q2(t2, e2));
      } else (e2.key === "Escape" || e2.key === "Tab") && (Z2(), k2.value?.focus());
    else if (e2.key === "ArrowDown" || e2.key === "ArrowUp") e2.preventDefault(), $e2(e2.key === "ArrowDown" ? 1 : -1);
    else if (e2.key === "ArrowRight") {
      let e3 = W2.value[R2.value.level]?.options[R2.value.index];
      e3 && Y2(e3, R2.value.level) && (I2.value = [...I2.value.slice(0, R2.value.level), e3], r(() => Ze2(R2.value.level + 1)));
    } else if (e2.key === "ArrowLeft" && R2.value.level > 0) I2.value = I2.value.slice(0, -1), r(() => Ze2(R2.value.level - 1));
    else if (e2.key === "Enter" || e2.key === " ") {
      let { level: t2, index: n3 } = R2.value, r2 = W2.value[t2]?.options[n3];
      r2 && (e2.preventDefault(), Ye2(r2, t2, e2));
    } else (e2.key === "Escape" || e2.key === "Tab") && (Z2(), k2.value?.focus());
  }
  function ot2(e2) {
    if (!F2.value) return;
    let t2 = e2.target;
    !le2.value?.contains(t2) && !M2.value?.contains(t2) && Z2();
  }
  function st2() {
    if (!F2.value || !K2.value || !le2.value) return;
    let e2 = le2.value.getBoundingClientRect(), t2 = M2.value, n3 = t2?.offsetWidth ?? 224, r2 = t2?.offsetHeight ?? 400, i2 = e2.bottom + 4 + r2 > window.innerHeight && e2.top > r2 + 4 ? e2.top - r2 - 4 : e2.bottom + 4, a2 = Math.min(Math.max(8, e2.left), Math.max(8, window.innerWidth - n3 - 8));
    ve2.value = { top: `${Math.max(8, i2)}px`, left: `${a2}px` };
  }
  function ct2(e2) {
    return e2 ? !!(le2.value?.contains(e2) || M2.value?.contains(e2)) : !1;
  }
  function lt2(e2, t2 = document.activeElement) {
    return ct2(e2) || ct2(t2);
  }
  function ut2(e2) {
    b2("focus", e2);
  }
  function dt2(e2) {
    r(() => {
      F2.value || lt2(e2.relatedTarget) || xe2.value.onBlur?.(e2);
    }), b2("blur", e2);
  }
  function ft2(e2) {
    F2.value && lt2(e2.relatedTarget) && e2.stopPropagation();
  }
  function pt2(e2) {
    if (!F2.value) return;
    let t2 = e2.relatedTarget;
    lt2(t2) ? e2.stopPropagation() : t2 || e2.stopPropagation();
  }
  function mt2(e2, t2) {
    return ["m-input-cascade-select-option", "m-input-cascade-select-search-option", { "is-selected": H2.value === e2.option, "is-focused": z2.value === t2, "is-disabled": X2(e2.option) }];
  }
  function ht2(e2, t2, n3) {
    return ["m-input-cascade-select-option", { "is-selected": H2.value === e2, "is-focused": R2.value.level === t2 && R2.value.index === n3, "is-active": I2.value[t2] === e2, "is-disabled": X2(e2), "is-group": Y2(e2, t2) }, Ve2("option", { option: e2, context: { option: e2, index: n3, level: t2, optionGroup: Y2(e2, t2), leaf: J2(e2, t2), active: I2.value[t2] === e2, disabled: X2(e2) } }).class];
  }
  return (e2, t2) => {
    let n3 = he;
    return d(), x("div", s({ ref: "root" }, { ...w(Se2), ...Ve2("root") }, { class: ["m-input-cascade-select w-full", [g2.size, { "is-open": w(F2), "p-invalid": g2.invalid, "p-disabled": g2.disabled }, w(ae2).class]], style: w(ae2).style, onFocusout: ft2 }), [y("button", s({ id: g2.inputId, ref: "trigger", type: "button", class: ["m-input-cascade-select-trigger", g2.inputClass], style: g2.inputStyle, disabled: g2.disabled, tabindex: g2.tabindex ?? 0, name: g2.name, role: "combobox", "aria-expanded": w(F2), "aria-controls": ye2, "aria-label": g2.ariaLabel, "aria-labelledby": g2.ariaLabelledby, "aria-disabled": g2.disabled || void 0 }, { ...g2.inputProps, ...Ve2("input") }, { onClick: Ge2, onKeydown: et2, onFocus: ut2, onBlur: dt2 }), [y("span", { class: v(["m-input-cascade-select-value", { "tt-inactive opacity-80": !w(Me2) }]) }, [a(e2.$slots, "value", { value: w(H2), placeholder: g2.placeholder, path: w(U2), pathSegments: w(Te2) }, () => [w(H2) ? (d(), x("span", Jt, [y("span", null, C(w(Ee2)), 1), a(e2.$slots, "value-extra", { value: w(H2) }, void 0, !0)])) : (d(), x("span", Yt, C(g2.placeholder), 1))], !0)], 2), g2.showClear && w(Me2) ? (d(), x("span", { key: 0, class: "m-input-cascade-select-clear", role: "button", tabindex: "-1", onMousedown: t2[0] ||= j(() => {
    }, ["stop"]), onClick: j(Xe2, ["stop"]) }, [a(e2.$slots, "clearicon", { clearCallback: Xe2 }, () => [A(n3, { name: "base/rx_ic_delete", size: 16, color: "var(--cascadeselect-clear-icon-color, var(--colors-icon-icon-secondary))" })], !0)], 32)) : E("", !0), y("span", { class: v(["m-input-cascade-select-dropdown-icon", { "is-open": w(F2) }]) }, [g2.loading ? a(e2.$slots, "loadingicon", {}, () => [t2[10] ||= y("i", { class: "pi pi-spinner pi-spin", "aria-hidden": "true" }, null, -1)], !0, 0) : a(e2.$slots, "dropdownicon", {}, () => [A(n3, { name: "base/rx_ic_chevron_down", size: 16, color: "var(--cascadeselect-dropdown-color, var(--colors-icon-icon-secondary))" })], !0, 1)], 2)], 16, qt), g2.name ? (d(), x("input", { key: 0, type: "hidden", name: g2.name, value: typeof w(V2) == "object" ? "" : w(V2) ?? "" }, null, 8, Xt)) : E("", !0), (d(), D(oe, { to: w(ke2), disabled: !w(K2) }, [A(ue, { name: "m-cascade-fade" }, { default: T(() => [w(F2) ? (d(), x("div", s({ key: 0, id: ye2, ref: "overlay", class: ["m-input-cascade-select-panel", w(je2)], style: w(Ae2), role: "presentation" }, { ...g2.panelProps ?? {}, ...g2.overlayProps ?? {}, ...Ve2("overlay") }, { onWheel: t2[8] ||= j(() => {
    }, ["stop"]), onTouchmove: t2[9] ||= j(() => {
    }, ["stop"]), onFocusout: pt2 }), [a(e2.$slots, "header", { value: w(V2), options: w(B2) }, void 0, !0), y("div", Zt, [g2.filter ? (d(), x("div", { key: 0, class: "m-input-cascade-select-filter", onClick: t2[2] ||= j(() => {
    }, ["stop"]), onMousedown: t2[3] ||= j(() => {
    }, ["stop"]) }, [A(w(ne2), null, { default: T(() => [A(_e, { ref: "searchInput", modelValue: w(L2), "onUpdate:modelValue": t2[1] ||= (e3) => p(L2) ? L2.value = e3 : null, size: "xs", "pre-icon": "base/rx_ic_magnify", placeholder: g2.searchMessage ?? e2.$t("\u641C\u7D22\u5185\u5BB9"), "form-control": { novalidate: !0 }, onKeydown: tt2 }, null, 8, ["modelValue", "placeholder"])]), _: 1 })], 32)) : E("", !0), w(De2) ? (d(), x("div", { key: 1, class: "m-input-cascade-select-search-results", role: "listbox", onKeydown: at2 }, [w(G2).length ? E("", !0) : (d(), x("div", Qt, C(g2.emptySearchMessage ?? e2.$t("\u6682\u65E0\u67E5\u8BE2\u7ED3\u679C")), 1)), (d(!0), x(S, null, O(w(G2), (r2, i2) => (d(), x("button", { key: g2.dataKey ? r2.option?.[g2.dataKey] : `search-${i2}`, type: "button", "data-search-index": i2, class: v(mt2(r2, i2)), disabled: X2(r2.option), role: "option", tabindex: "-1", onMousedown: t2[4] ||= j(() => {
    }, ["prevent"]), onMouseenter: (e3) => z2.value = i2, onClick: (e3) => Q2(r2, e3) }, [y("span", tn, [a(e2.$slots, "option", { option: r2.option, selected: w(H2) === r2.option, level: r2.level, optionGroup: !1, leaf: !0, disabled: X2(r2.option), path: r2.path }, () => [y("span", nn, [(d(!0), x(S, null, O(r2.pathSegments, (e3, t3) => (d(), x(S, { key: g2.dataKey ? e3.option?.[g2.dataKey] ?? t3 : t3 }, [t3 > 0 ? (d(), x("span", rn, C(g2.pathSeparator ?? "/"), 1)) : E("", !0), y("span", an, [e3.visual.image ? (d(), x("img", { key: 0, class: "selectitem__image", src: g2.darkMode ? e3.visual.darkImage : e3.visual.image }, null, 8, on)) : e3.visual.icon ? (d(), D(n3, { key: 1, name: e3.visual.icon, color: g2.iconColor, fallback: "base/rx_ic_earth" }, null, 8, ["name", "color"])) : E("", !0), y("span", sn, [(d(!0), x(S, null, O(Be2(e3.label, w(L2)), (e4, t4) => (d(), x(S, { key: t4 }, [e4.matched ? (d(), x("mark", cn, C(e4.text), 1)) : (d(), x(S, { key: 1 }, [h(C(e4.text), 1)], 64))], 64))), 128))])])], 64))), 128)), a(e2.$slots, "option-extra", { option: r2.option }, void 0, !0)])], !0)])], 42, en))), 128))], 32)) : (d(), x("div", { key: 2, class: "m-input-cascade-select-columns", role: "menu", onKeydown: at2 }, [(d(!0), x(S, null, O(w(W2), (r2) => (d(), x("div", { key: r2.level, class: v(["m-input-cascade-select-column", Ve2("optionList", { level: r2.level })]), onWheel: t2[6] ||= j(() => {
    }, ["stop"]), onTouchmove: t2[7] ||= j(() => {
    }, ["stop"]) }, [r2.options.length ? E("", !0) : (d(), x("div", ln, C(g2.emptyMessage ?? "No available options"), 1)), (d(!0), x(S, null, O(r2.options, (i2, o2) => (d(), x("button", { key: g2.dataKey ? i2?.[g2.dataKey] : `${r2.level}-${o2}`, type: "button", "data-level": r2.level, "data-index": o2, class: v(ht2(i2, r2.level, o2)), disabled: X2(i2), role: "menuitem", "aria-haspopup": Y2(i2, r2.level) || void 0, "aria-expanded": Y2(i2, r2.level) ? w(I2)[r2.level] === i2 : void 0, tabindex: "-1", onMousedown: t2[5] ||= j(() => {
    }, ["prevent"]), onMouseenter: (e3) => qe2(i2, r2.level, o2), onClick: (e3) => Je2(i2, r2.level, e3) }, [y("span", dn, [a(e2.$slots, "option", { option: i2, selected: w(H2) === i2, level: r2.level, optionGroup: Y2(i2, r2.level), leaf: J2(i2, r2.level), disabled: X2(i2) }, () => [y("span", fn, [i2.icon || g2.icon ? (d(), D(n3, { key: 0, name: i2.icon || g2.icon, color: g2.iconColor, fallback: "base/rx_ic_earth" }, null, 8, ["name", "color"])) : E("", !0), i2.image ? (d(), x("img", { key: 1, class: "selectitem__image", src: g2.darkMode ? i2.darkImage : i2.image }, null, 8, pn)) : E("", !0), y("span", null, C(Ne2(i2, Y2(i2, r2.level))), 1), a(e2.$slots, "option-extra", { option: i2 }, void 0, !0)])], !0)]), Y2(i2, r2.level) ? (d(), x("span", mn, [a(e2.$slots, "optiongroupicon", {}, () => [A(n3, { name: "base/rx_ic_chevron_down", size: "var(--cascadeselect-option-icon-size, 0.875rem)", color: "var(--cascadeselect-option-icon-color, var(--colors-icon-icon-secondary))" })], !0)])) : E("", !0)], 42, un))), 128))], 34))), 128))], 32))]), a(e2.$slots, "footer", { value: w(V2), options: w(B2) }, void 0, !0)], 16)) : E("", !0)]), _: 3 })], 8, ["to", "disabled"])), (d(!0), x(S, null, O(w(Ce2), (t3) => a(e2.$slots, t3, {}, void 0, !0, t3)), 128))], 16);
  };
} }), [["__scopeId", "data-v-1a38cccd"]]);
var gn = ["for"];
var _n = { class: "select-none text" };
var vn = P(t({ inheritAttrs: !1, __name: "m-input-radio", props: { name: {}, size: { default: "sm" }, options: {} }, setup(e2) {
  let t2 = b(e2, ["name", "size", "options"]), n2 = ce();
  return (r2, i2) => {
    let a2 = R;
    return d(), x("div", { class: v(["flex items-start flex-wrap gap-2", e2.size]) }, [(d(!0), x(S, null, O(e2.options, ({ label: r3, value: i3, disabled: o2, ...c2 }) => (d(), x("label", { key: r3, for: `${e2.name}_${i3}`, class: v(["flex items-center cursor-pointer min-w-25 radio", { "cursor-not-allowed": o2 }]) }, [A(a2, s({ ref_for: !0 }, { ...w(n2), ...t2, ...c2 }, { "input-id": `${e2.name}_${i3}`, name: e2.name, value: i3, disabled: o2 }), null, 16, ["input-id", "name", "value", "disabled"]), y("div", _n, C(r3), 1)], 10, gn))), 128))], 2);
  };
} }), [["__scopeId", "data-v-a970bffb"]]);
var yn = /* @__PURE__ */ Symbol("wcis_form");
function bn(e2) {
  N(yn, e2);
}
function xn() {
  return me(yn);
}
function Sn() {
  let e2 = xn();
  return { position: _(() => ne(e2?.position) ?? "top"), labelProps: _(() => ne(e2?.labelProps) ?? {}) };
}
var Cn = ["value"];
var wn = t({ inheritAttrs: !1, __name: "m-custom", props: { field: {}, input: {} }, setup(e2) {
  let { setFieldValue: t2, setValues: n2 } = xn();
  function r2(n3) {
    t2(e2.input.name, n3);
  }
  function i2(e3) {
    n2(e3);
  }
  return (t3, n3) => (d(), x(S, null, [y("input", { value: e2.field.value, type: "hidden" }, null, 8, Cn), (d(), D(f(e2.input.render), s({ name: e2.input.name }, { ...e2.input.props, ...t3.$attrs }, { onUpdate: r2, onUpdates: i2 }), null, 16, ["name"]))], 64));
} });
var Tn = 20;
var En = P(t({ inheritAttrs: !1, __name: "item", props: { input: {} }, setup(e2) {
  let { position: t2, labelProps: n2 } = Sn(), [r2, i2] = M({ inheritAttrs: !1 }), a2 = _e, o2 = { text: _e, number: L, password: xe, textarea: H, select: I, mselect: z, cascade: hn, date: we, radio: vn }, c2 = { xxs: 24, xs: 28, sm: 32, md: 36, lg: 40 };
  function l2(e3) {
    return e3.type === "group" && Array.isArray(e3.items) ? e3.items.find((e4) => e4?.props?.size)?.props?.size ?? e3.props?.size ?? "sm" : e3.props?.size ?? "sm";
  }
  let u2 = _(() => e2.input.labelPosition ?? t2.value), p2 = _(() => ({ ...n2.value, ...e2.input.labelProps })), m2 = _(() => !!(e2.input.labelRender || e2.input.label)), g2 = _(() => {
    let { class: t3, width: n3, style: r3, ...i3 } = p2.value, a3 = `${((c2[l2(e2.input)] ?? c2.sm) - Tn) / 2}px`;
    return u2.value === "left" ? { "--form-label-padding-top": a3, ...r3, ...i3, ...n3 ? { "--form-label-width": n3 } : {} } : { ...r3, ...i3 };
  });
  function b2(e3) {
    return e3 && o2[e3] || a2;
  }
  return (t3, n3) => {
    let a3 = ve, o3 = V, c3 = F;
    return d(), x(S, null, [A(w(r2), null, { default: T(({ input: e3, class: t4 }) => [A(o3, { class: v(["flex flex-col gap-1", t4]), name: e3.name }, { default: T((t5) => [e3.render ? (d(), D(wn, { key: 0, field: t5, input: e3 }, null, 8, ["field", "input"])) : (d(), D(f(b2(e3.type)), re(s({ key: 1 }, e3.props)), k({ _: 2 }, [O(e3.slots ?? {}, (e4, t6) => ({ name: t6, fn: T((t7) => [(d(), D(f(e4(t7))))]) }))]), 1040)), e3.afterRender ? (d(), D(f(e3.afterRender), { key: 2, field: t5, input: e3 }, null, 8, ["field", "input"])) : E("", !0), t5?.invalid ? (d(), D(a3, { key: 3, severity: "error", size: "small", variant: "simple" }, { default: T(() => [h(C(t5.error?.message), 1)]), _: 2 }, 1024)) : E("", !0)]), _: 2 }, 1032, ["class", "name"])]), _: 1 }), e2.input.separator ? (d(), D(c3, s({ key: 0, "line-only": "" }, e2.input.separatorProps), null, 16)) : (d(), x("div", { key: 1, class: v(["item", w(u2) === "left" ? "item--left" : "item--top"]) }, [w(m2) ? (d(), x("div", { key: 0, class: v(["item__label", w(p2).class]), style: ae(w(g2)) }, [e2.input.labelRender ? (d(), D(f(e2.input.labelRender), { key: 0 })) : e2.input.label ? (d(), D(Ht, { key: 1, label: e2.input.label, tooltip: e2.input.tooltip, required: e2.input.required }, null, 8, ["label", "tooltip", "required"])) : E("", !0)], 6)) : E("", !0), y("div", { class: v(["item__content", { "item__content--full": !w(m2) }]) }, [e2.input.type === "group" ? (d(), D(Kt, { key: 0 }, { default: T(() => [(d(!0), x(S, null, O(e2.input.items, (e3) => (d(), D(w(i2), { key: e3.name, class: v(e3.itemClass), input: e3 }, null, 8, ["class", "input"]))), 128))]), _: 1 })) : (d(), D(w(i2), { key: 1, input: e2.input }, null, 8, ["input"]))], 2)], 2))], 64);
  };
} }), [["__scopeId", "data-v-35309b81"]]);
var Dn = t({ __name: "index", props: { id: { default: () => ie() }, position: { default: "top" }, labelProps: {}, inputs: {} }, emits: ["submit"], setup(e2, { expose: t2, emit: r2 }) {
  let i2 = r2, o2 = m("tsform");
  bn({ setValues: (e3) => {
    o2.value?.setValues(e3);
  }, setFieldValue: (e3, t3) => {
    o2.value?.setFieldValue(e3, t3);
  }, getFieldState: (e3) => o2.value?.getFieldState(e3), position: n(() => e2.position), labelProps: n(() => e2.labelProps) });
  let s2 = l(e2.inputs), c2 = p2(e2.inputs), u2 = g(Object.fromEntries(c2.values)), f2 = Ce(B(Object.fromEntries(c2.resolver)));
  function p2(e3) {
    return e3.reduce((e4, t3) => {
      let { name: n2, label: r3, props: i3, items: a2, required: o3, resolver: s3 } = t3;
      if (a2?.length) {
        let { resolver: t4, values: n3 } = p2(a2);
        e4.resolver.push(...t4), e4.values.push(...n3);
      } else if (n2) {
        let a3 = pe(s3) && s3(be) || o3 && ye().refine((e5) => !!e5, $t('"{name}" \u662F\u5FC5\u586B\u9879', { name: r3 || i3?.placeholder }));
        a3 && e4.resolver.push([n2, a3]), e4.values.push([n2, h2(t3)]);
      }
      return e4;
    }, { resolver: [], values: [] });
  }
  function h2(e3) {
    return e3.value ? e3.value : e3.type === "number" ? 0 : "";
  }
  function _2(e3) {
    if (e3.valid) {
      let t3 = Object.fromEntries(Object.entries(e3.states).map(([e4, t4]) => [e4, t4.value]));
      i2("submit", t3);
    }
  }
  function v2(e3, t3) {
    t3.forEach((t4) => {
      if (t4.items?.length) v2(e3, t4.items);
      else if (t4.name && Object.hasOwn(e3, t4.name)) {
        let { value: n2, label: r3, ...i3 } = e3[t4.name] ?? {};
        r3 !== void 0 && (t4.label = r3), Object.keys(i3).length > 0 && Reflect.set(t4, "props", { ...t4.props, ...i3 }), n2 !== void 0 && (Reflect.set(u2, t4.name, n2), o2.value?.setFieldValue(t4.name, n2));
      }
    });
  }
  return t2({ instance: o2, setInputsProps: (e3) => {
    v2(e3, s2.value);
  }, getFieldState: (e3) => o2.value?.getFieldState(e3), setValues: (e3) => {
    o2.value?.setValues(e3);
  }, getValues: () => Object.fromEntries(Object.entries(o2.value?.states ?? {}).map(([e3, t3]) => [e3, t3.value])), reset: () => {
    o2.value?.reset();
  }, submit: () => {
    o2.value?.submit();
  }, validateField: (e3) => o2.value?.validate(e3) }), (t3, n2) => {
    let r3 = Se;
    return d(), D(r3, { id: e2.id, ref: "tsform", "initial-values": w(u2), resolver: w(f2), class: "flex flex-col gap-4 self-stretch", onSubmit: _2 }, { default: T(() => [a(t3.$slots, "default", { inputs: w(s2), position: e2.position, labelProps: e2.labelProps }, () => [(d(!0), x(S, null, O(w(s2), (e3) => (d(), D(En, { key: e3.name, input: e3 }, null, 8, ["input"]))), 128))])]), _: 3 }, 8, ["id", "initial-values", "resolver"]);
  };
} });
export {vn as i,$ as o,xn as r,Dn as t};