import {Dt as e,F as t,G as n,O as r,St as i,Tt as a,V as o,_t as s,ft as l,k as u,kt as d,mt as f,st as p,w as m,wt as h,xt as g,yt as _} from "./runtime-core.esm-bundler-CBj16o9G.js";
function v(e2, t2) {
  return f() ? (_(e2, t2), !0) : !1;
}
var b = /* @__PURE__ */ new WeakMap();
var x = (...e2) => {
  let t2 = e2[0], n2 = m()?.proxy ?? f();
  if (n2 == null && !r()) throw Error("injectLocal must be called in setup");
  return n2 && b.has(n2) && t2 in b.get(n2) ? b.get(n2)[t2] : u(...e2);
};
function S(e2, t2) {
  let r2 = m()?.proxy ?? f();
  if (r2 == null) throw Error("provideLocal must be called in setup");
  b.has(r2) || b.set(r2, /* @__PURE__ */ Object.create(null));
  let i2 = b.get(r2);
  return i2[e2] = t2, n(e2, t2);
}
var C = typeof window < "u" && typeof document < "u";
var w = (e2) => e2 !== void 0;
var T = (e2) => e2 != null;
var E = Object.prototype.toString;
var D = (e2) => E.call(e2) === "[object Object]";
var O = () => {
};
var A = j();
function j() {
  var e2, t2;
  return C && !!((e2 = window) != null && (e2 = e2.navigator) != null && e2.userAgent) && (/iP(?:ad|hone|od)/.test(window.navigator.userAgent) || ((t2 = window) == null || (t2 = t2.navigator) == null ? void 0 : t2.maxTouchPoints) > 2 && /iPad|Macintosh/.test(window?.navigator.userAgent));
}
function M(...t2) {
  if (t2.length !== 1) return e(...t2);
  let n2 = t2[0];
  return typeof n2 == "function" ? g(l(() => ({ get: n2, set: O }))) : i(n2);
}
function N(e2, t2) {
  function n2(...n3) {
    return new Promise((r2, i2) => {
      Promise.resolve(e2(() => t2.apply(this, n3), { fn: t2, thisArg: this, args: n3 })).then(r2).catch(i2);
    });
  }
  return n2;
}
var P = (e2) => e2();
function F(e2, t2 = {}) {
  let n2, r2, i2 = O, a2 = (e3) => {
    clearTimeout(e3), i2(), i2 = O;
  }, o2;
  return (s2) => {
    let c2 = d(e2), l2 = d(t2.maxWait);
    return n2 && a2(n2), c2 <= 0 || l2 !== void 0 && l2 <= 0 ? (r2 &&= (a2(r2), void 0), Promise.resolve(s2())) : new Promise((e3, u2) => {
      i2 = t2.rejectOnCancel ? u2 : e3, o2 = s2, l2 && !r2 && (r2 = setTimeout(() => {
        n2 && a2(n2), r2 = void 0, e3(o2());
      }, l2)), n2 = setTimeout(() => {
        r2 && a2(r2), r2 = void 0, e3(s2());
      }, c2);
    });
  };
}
function I(e2 = P, t2 = {}) {
  let { initialState: n2 = "active" } = t2, r2 = M(n2 === "active");
  function i2() {
    r2.value = !1;
  }
  function a2() {
    r2.value = !0;
  }
  return { isActive: h(r2), pause: i2, resume: a2, eventFilter: (...t3) => {
    r2.value && e2(...t3);
  } };
}
function R(e2) {
  return Array.isArray(e2) ? e2 : [e2];
}
function z(e2) {
  let t2 = /* @__PURE__ */ Object.create(null);
  return ((n2) => t2[n2] || (t2[n2] = e2(n2)));
}
var B = /-(\w)/g;
var ee = z((e2) => e2.replace(B, (e3, t2) => t2 ? t2.toUpperCase() : ""));
function V(e2) {
  return e2 || m();
}
function H(e2, t2) {
  if (typeof Symbol < "u") {
    let n2 = { ...e2 };
    return Object.defineProperty(n2, Symbol.iterator, { enumerable: !1, value() {
      let e3 = 0;
      return { next: () => ({ value: t2[e3++], done: e3 > t2.length }) };
    } }), n2;
  }
  return Object.assign([...t2], e2);
}
function U(e2, t2 = 200, n2 = {}) {
  return N(F(t2, n2), e2);
}
function W(e2, t2, n2 = {}) {
  let { eventFilter: r2 = P, ...i2 } = n2;
  return p(e2, N(r2, t2), i2);
}
function G(e2, t2, n2 = {}) {
  let { eventFilter: r2, initialState: i2 = "active", ...a2 } = n2, { eventFilter: o2, pause: s2, resume: c2, isActive: l2 } = I(r2, { initialState: i2 });
  return { stop: W(e2, t2, { ...a2, eventFilter: o2 }), pause: s2, resume: c2, isActive: l2 };
}
function K(e2, n2 = !0, r2) {
  V(r2) ? o(e2, r2) : n2 ? e2() : t(e2);
}
function te(e2, t2 = 1e3, n2 = {}) {
  let { immediate: r2 = !0, immediateCallback: i2 = !1 } = n2, o2 = null, c2 = a(!1);
  function l2() {
    o2 &&= (clearInterval(o2), null);
  }
  function u2() {
    c2.value = !1, l2();
  }
  function f2() {
    let n3 = d(t2);
    n3 <= 0 || (c2.value = !0, i2 && e2(), l2(), c2.value && (o2 = setInterval(e2, n3)));
  }
  return r2 && C && f2(), (s(t2) || typeof t2 == "function") && v(p(t2, () => {
    c2.value && C && f2();
  })), v(u2), { isActive: h(c2), pause: u2, resume: f2 };
}
function re(e2, t2, n2) {
  return p(e2, t2, { ...n2, immediate: !0 });
}
export {G as S,C as a,D as c,S as d,v as g,K as h,x as i,H as l,M as m,w as o,R as p,A as s,ee as t,T as u,U as v,re as x,te as y};