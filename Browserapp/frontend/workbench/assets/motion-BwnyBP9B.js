import {B as e,C as t,D as n,F as r,G as i,H as a,I as o,P as s,R as c,St as l,U as u,V as d,d as f,k as p,r as m,st as h,tt as g,u as _,w as v,z as y} from "./runtime-core.esm-bundler-CBj16o9G.js";
function b(e2, t2) {
  let n2 = typeof e2 == "string" && !t2 ? `${e2}Context` : t2, r2 = Symbol(n2);
  return [(t3) => {
    let n3 = p(r2, t3);
    if (n3 === void 0) throw Error(`Injection \`${r2.toString()}\` not found. Component must be used within ${Array.isArray(e2) ? `one of the following components: ${e2.join(", ")}` : `\`${e2}\``}`);
    return n3;
  }, (e3) => (i(r2, e3), e3), r2];
}
function x(e2, t2) {
  let { layoutGroup: n2, presenceContext: r2, config: i2 } = t2, a2 = n2.id && e2.layoutId ? `${n2.id}-${e2.layoutId}` : e2.layoutId || void 0;
  return { ...e2, layoutId: a2, transition: e2.transition ?? i2.transition, layoutGroup: n2, motionConfig: i2, inViewOptions: e2.inViewOptions ?? i2.inViewOptions, presenceContext: r2, initial: r2.initial === !1 ? r2.initial : e2.initial === !0 ? void 0 : e2.initial };
}
function S(e2, t2) {
  e2.indexOf(t2) === -1 && e2.push(t2);
}
function C(e2, t2) {
  let n2 = e2.indexOf(t2);
  n2 > -1 && e2.splice(n2, 1);
}
var w = (e2, t2, n2) => n2 > t2 ? t2 : n2 < e2 ? e2 : n2;
var T = {};
var ee = (e2) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(e2);
var te = (e2) => typeof e2 == "object" && !!e2;
var ne = (e2) => /^0[^.\s]+$/u.test(e2);
function re(e2) {
  let t2;
  return () => (t2 === void 0 && (t2 = e2()), t2);
}
var E = (e2) => e2;
var ie = (...e2) => e2.reduce((e3, t2) => (n2) => t2(e3(n2)));
var ae = (e2, t2, n2) => {
  let r2 = t2 - e2;
  return r2 ? (n2 - e2) / r2 : 1;
};
var oe = class {
  constructor() {
    this.subscriptions = [];
  }
  add(e2) {
    return S(this.subscriptions, e2), () => C(this.subscriptions, e2);
  }
  notify(e2, t2, n2) {
    let r2 = this.subscriptions.length;
    if (r2)
      if (r2 === 1) this.subscriptions[0](e2, t2, n2);
      else for (let i2 = 0; i2 < r2; i2++) {
        let r3 = this.subscriptions[i2];
        r3 && r3(e2, t2, n2);
      }
  }
  getSize() {
    return this.subscriptions.length;
  }
  clear() {
    this.subscriptions.length = 0;
  }
};
var D = (e2) => e2 * 1e3;
var O = (e2) => e2 / 1e3;
var se = (e2, t2) => t2 ? 1e3 / t2 * e2 : 0;
var ce = (e2, t2, n2) => (((1 - 3 * n2 + 3 * t2) * e2 + (3 * n2 - 6 * t2)) * e2 + 3 * t2) * e2;
var le = 1e-7;
var ue = 12;
function de(e2, t2, n2, r2, i2) {
  let a2, o2, s2 = 0;
  do
    o2 = t2 + (n2 - t2) / 2, a2 = ce(o2, r2, i2) - e2, a2 > 0 ? n2 = o2 : t2 = o2;
  while (Math.abs(a2) > le && ++s2 < ue);
  return o2;
}
function fe(e2, t2, n2, r2) {
  if (e2 === t2 && n2 === r2) return E;
  let i2 = (t3) => de(t3, 0, 1, e2, n2);
  return (e3) => e3 === 0 || e3 === 1 ? e3 : ce(i2(e3), t2, r2);
}
var pe = (e2) => (t2) => t2 <= 0.5 ? e2(2 * t2) / 2 : (2 - e2(2 * (1 - t2))) / 2;
var me = (e2) => (t2) => 1 - e2(1 - t2);
var he = fe(0.33, 1.53, 0.69, 0.99);
var ge = me(he);
var _e = pe(ge);
var ve = (e2) => e2 >= 1 ? 1 : (e2 *= 2) < 1 ? 0.5 * ge(e2) : 0.5 * (2 - 2 ** (-10 * (e2 - 1)));
var ye = (e2) => 1 - Math.sin(Math.acos(e2));
var be = me(ye);
var xe = pe(ye);
var Se = fe(0.42, 0, 1, 1);
var Ce = fe(0, 0, 0.58, 1);
var we = fe(0.42, 0, 0.58, 1);
var Te = (e2) => Array.isArray(e2) && typeof e2[0] != "number";
var Ee = (e2) => Array.isArray(e2) && typeof e2[0] == "number";
var De = { linear: E, easeIn: Se, easeInOut: we, easeOut: Ce, circIn: ye, circInOut: xe, circOut: be, backIn: ge, backInOut: _e, backOut: he, anticipate: ve };
var Oe = (e2) => typeof e2 == "string";
var ke = (e2) => {
  if (Ee(e2)) {
    e2.length;
    let [t2, n2, r2, i2] = e2;
    return fe(t2, n2, r2, i2);
  }
  return Oe(e2) ? (De[e2], `${e2}`, De[e2]) : e2;
};
var Ae = ["setup", "read", "resolveKeyframes", "preUpdate", "update", "preRender", "render", "postRender"];
function je(e2) {
  let t2 = /* @__PURE__ */ new Set(), n2 = /* @__PURE__ */ new Set(), r2 = !1, i2 = !1, a2 = /* @__PURE__ */ new WeakSet(), o2 = { delta: 0, timestamp: 0, isProcessing: !1 };
  function s2(t3) {
    a2.has(t3) && (c2.schedule(t3), e2()), t3(o2);
  }
  let c2 = { schedule: (e3, i3 = !1, o3 = !1) => {
    let s3 = o3 && r2 ? t2 : n2;
    return i3 && a2.add(e3), s3.add(e3), e3;
  }, cancel: (e3) => {
    n2.delete(e3), a2.delete(e3);
  }, process: (e3) => {
    if (o2 = e3, r2) {
      i2 = !0;
      return;
    }
    r2 = !0;
    let a3 = t2;
    t2 = n2, n2 = a3, t2.forEach(s2), t2.clear(), r2 = !1, i2 && (i2 = !1, c2.process(e3));
  } };
  return c2;
}
var Me = 40;
function Ne(e2, t2) {
  let n2 = !1, r2 = !0, i2 = { delta: 0, timestamp: 0, isProcessing: !1 }, a2 = () => n2 = !0, o2 = Ae.reduce((e3, t3) => (e3[t3] = je(a2), e3), {}), { setup: s2, read: c2, resolveKeyframes: l2, preUpdate: u2, update: d2, preRender: f2, render: p2, postRender: m2 } = o2, h2 = () => {
    let a3 = T.useManualTiming, o3 = a3 ? i2.timestamp : performance.now();
    n2 = !1, a3 || (i2.delta = r2 ? 1e3 / 60 : Math.max(Math.min(o3 - i2.timestamp, Me), 1)), i2.timestamp = o3, i2.isProcessing = !0, s2.process(i2), c2.process(i2), l2.process(i2), u2.process(i2), d2.process(i2), f2.process(i2), p2.process(i2), m2.process(i2), i2.isProcessing = !1, n2 && t2 && (r2 = !1, e2(h2));
  }, g2 = () => {
    n2 = !0, r2 = !0, i2.isProcessing || e2(h2);
  };
  return { schedule: Ae.reduce((e3, t3) => {
    let r3 = o2[t3];
    return e3[t3] = (e4, t4 = !1, i3 = !1) => (n2 || g2(), r3.schedule(e4, t4, i3)), e3;
  }, {}), cancel: (e3) => {
    for (let t3 = 0; t3 < Ae.length; t3++) o2[Ae[t3]].cancel(e3);
  }, state: i2, steps: o2 };
}
var { schedule: k, cancel: A, state: j, steps: Pe } = Ne(typeof requestAnimationFrame < "u" ? requestAnimationFrame : E, !0);
var Fe;
function Ie() {
  Fe = void 0;
}
var M = { now: () => (Fe === void 0 && M.set(j.isProcessing || T.useManualTiming ? j.timestamp : performance.now()), Fe), set: (e2) => {
  Fe = e2, queueMicrotask(Ie);
} };
var Le = (e2) => (t2) => typeof t2 == "string" && t2.startsWith(e2);
var Re = Le("--");
var ze = Le("var(--");
var Be = (e2) => ze(e2) ? Ve.test(e2.split("/*")[0].trim()) : !1;
var Ve = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;
function He(e2) {
  return typeof e2 == "string" && e2.split("/*")[0].includes("var(--");
}
var Ue = { test: (e2) => typeof e2 == "number", parse: parseFloat, transform: (e2) => e2 };
var We = { ...Ue, transform: (e2) => w(0, 1, e2) };
var Ge = { ...Ue, default: 1 };
var Ke = (e2) => Math.round(e2 * 1e5) / 1e5;
var qe = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
function Je(e2) {
  return e2 == null;
}
var Ye = /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu;
var Xe = (e2, t2) => (n2) => !!(typeof n2 == "string" && Ye.test(n2) && n2.startsWith(e2) || t2 && !Je(n2) && Object.prototype.hasOwnProperty.call(n2, t2));
var Ze = (e2, t2, n2) => (r2) => {
  if (typeof r2 != "string") return r2;
  let [i2, a2, o2, s2] = r2.match(qe);
  return { [e2]: parseFloat(i2), [t2]: parseFloat(a2), [n2]: parseFloat(o2), alpha: s2 === void 0 ? 1 : parseFloat(s2) };
};
var Qe = (e2) => w(0, 255, e2);
var $e = { ...Ue, transform: (e2) => Math.round(Qe(e2)) };
var et = { test: Xe("rgb", "red"), parse: Ze("red", "green", "blue"), transform: ({ red: e2, green: t2, blue: n2, alpha: r2 = 1 }) => "rgba(" + $e.transform(e2) + ", " + $e.transform(t2) + ", " + $e.transform(n2) + ", " + Ke(We.transform(r2)) + ")" };
function tt(e2) {
  let t2 = "", n2 = "", r2 = "", i2 = "";
  return e2.length > 5 ? (t2 = e2.substring(1, 3), n2 = e2.substring(3, 5), r2 = e2.substring(5, 7), i2 = e2.substring(7, 9)) : (t2 = e2.substring(1, 2), n2 = e2.substring(2, 3), r2 = e2.substring(3, 4), i2 = e2.substring(4, 5), t2 += t2, n2 += n2, r2 += r2, i2 += i2), { red: parseInt(t2, 16), green: parseInt(n2, 16), blue: parseInt(r2, 16), alpha: i2 ? parseInt(i2, 16) / 255 : 1 };
}
var nt = { test: Xe("#"), parse: tt, transform: et.transform };
var rt = (e2) => ({ test: (t2) => typeof t2 == "string" && t2.endsWith(e2) && t2.split(" ").length === 1, parse: parseFloat, transform: (t2) => `${t2}${e2}` });
var N = rt("deg");
var P = rt("%");
var F = rt("px");
var it = rt("vh");
var at = rt("vw");
var ot = { ...P, parse: (e2) => P.parse(e2) / 100, transform: (e2) => P.transform(e2 * 100) };
var st = { test: Xe("hsl", "hue"), parse: Ze("hue", "saturation", "lightness"), transform: ({ hue: e2, saturation: t2, lightness: n2, alpha: r2 = 1 }) => "hsla(" + Math.round(e2) + ", " + P.transform(Ke(t2)) + ", " + P.transform(Ke(n2)) + ", " + Ke(We.transform(r2)) + ")" };
var I = { test: (e2) => et.test(e2) || nt.test(e2) || st.test(e2), parse: (e2) => et.test(e2) ? et.parse(e2) : st.test(e2) ? st.parse(e2) : nt.parse(e2), transform: (e2) => typeof e2 == "string" ? e2 : e2.hasOwnProperty("red") ? et.transform(e2) : st.transform(e2), getAnimatableNone: (e2) => {
  let t2 = I.parse(e2);
  return t2.alpha = 0, I.transform(t2);
} };
var ct = /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
function lt(e2) {
  return isNaN(e2) && typeof e2 == "string" && (e2.match(qe)?.length || 0) + (e2.match(ct)?.length || 0) > 0;
}
var ut = "number";
var dt = "color";
var ft = "var";
var pt = "var(";
var mt = "${}";
var ht = /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function gt(e2) {
  let t2 = e2.toString(), n2 = [], r2 = { color: [], number: [], var: [] }, i2 = [], a2 = 0;
  return { values: n2, split: t2.replace(ht, (e3) => (I.test(e3) ? (r2.color.push(a2), i2.push(dt), n2.push(I.parse(e3))) : e3.startsWith(pt) ? (r2.var.push(a2), i2.push(ft), n2.push(e3)) : (r2.number.push(a2), i2.push(ut), n2.push(parseFloat(e3))), ++a2, mt)).split(mt), indexes: r2, types: i2 };
}
function _t(e2) {
  return gt(e2).values;
}
function vt({ split: e2, types: t2 }) {
  let n2 = e2.length;
  return (r2) => {
    let i2 = "";
    for (let a2 = 0; a2 < n2; a2++) if (i2 += e2[a2], r2[a2] !== void 0) {
      let e3 = t2[a2];
      i2 += e3 === ut ? Ke(r2[a2]) : e3 === dt ? I.transform(r2[a2]) : r2[a2];
    }
    return i2;
  };
}
function yt(e2) {
  return vt(gt(e2));
}
var bt = (e2) => typeof e2 == "number" ? 0 : I.test(e2) ? I.getAnimatableNone(e2) : e2;
var xt = (e2, t2) => typeof e2 == "number" ? t2?.trim().endsWith("/") ? e2 : 0 : bt(e2);
function St(e2) {
  let t2 = gt(e2);
  return vt(t2)(t2.values.map((e3, n2) => xt(e3, t2.split[n2])));
}
var L = { test: lt, parse: _t, createTransformer: yt, getAnimatableNone: St };
function Ct(e2, t2, n2) {
  return n2 < 0 && (n2 += 1), n2 > 1 && --n2, n2 < 1 / 6 ? e2 + (t2 - e2) * 6 * n2 : n2 < 1 / 2 ? t2 : n2 < 2 / 3 ? e2 + (t2 - e2) * (2 / 3 - n2) * 6 : e2;
}
function wt({ hue: e2, saturation: t2, lightness: n2, alpha: r2 }) {
  e2 /= 360, t2 /= 100, n2 /= 100;
  let i2 = 0, a2 = 0, o2 = 0;
  if (!t2) i2 = a2 = o2 = n2;
  else {
    let r3 = n2 < 0.5 ? n2 * (1 + t2) : n2 + t2 - n2 * t2, s2 = 2 * n2 - r3;
    i2 = Ct(s2, r3, e2 + 1 / 3), a2 = Ct(s2, r3, e2), o2 = Ct(s2, r3, e2 - 1 / 3);
  }
  return { red: Math.round(i2 * 255), green: Math.round(a2 * 255), blue: Math.round(o2 * 255), alpha: r2 };
}
function Tt(e2, t2) {
  return (n2) => n2 > 0 ? t2 : e2;
}
var R = (e2, t2, n2) => e2 + (t2 - e2) * n2;
var Et = (e2, t2, n2) => {
  let r2 = e2 * e2, i2 = n2 * (t2 * t2 - r2) + r2;
  return i2 < 0 ? 0 : Math.sqrt(i2);
};
var Dt = [nt, et, st];
var Ot = (e2) => Dt.find((t2) => t2.test(e2));
function kt(e2) {
  let t2 = Ot(e2);
  if (`${e2}`, !t2) return !1;
  let n2 = t2.parse(e2);
  return t2 === st && (n2 = wt(n2)), n2;
}
var At = (e2, t2) => {
  let n2 = kt(e2), r2 = kt(t2);
  if (!n2 || !r2) return Tt(e2, t2);
  let i2 = { ...n2 };
  return (e3) => (i2.red = Et(n2.red, r2.red, e3), i2.green = Et(n2.green, r2.green, e3), i2.blue = Et(n2.blue, r2.blue, e3), i2.alpha = R(n2.alpha, r2.alpha, e3), et.transform(i2));
};
var jt = /* @__PURE__ */ new Set(["none", "hidden"]);
function Mt(e2, t2) {
  return jt.has(e2) ? (n2) => n2 <= 0 ? e2 : t2 : (n2) => n2 >= 1 ? t2 : e2;
}
function Nt(e2, t2) {
  return (n2) => R(e2, t2, n2);
}
function Pt(e2) {
  return typeof e2 == "number" ? Nt : typeof e2 == "string" ? Be(e2) ? Tt : I.test(e2) ? At : Rt : Array.isArray(e2) ? Ft : typeof e2 == "object" ? I.test(e2) ? At : It : Tt;
}
function Ft(e2, t2) {
  let n2 = [...e2], r2 = n2.length, i2 = e2.map((e3, n3) => Pt(e3)(e3, t2[n3]));
  return (e3) => {
    for (let t3 = 0; t3 < r2; t3++) n2[t3] = i2[t3](e3);
    return n2;
  };
}
function It(e2, t2) {
  let n2 = { ...e2, ...t2 }, r2 = {};
  for (let i2 in n2) e2[i2] !== void 0 && t2[i2] !== void 0 && (r2[i2] = Pt(e2[i2])(e2[i2], t2[i2]));
  return (e3) => {
    for (let t3 in r2) n2[t3] = r2[t3](e3);
    return n2;
  };
}
function Lt(e2, t2) {
  let n2 = [], r2 = { color: 0, var: 0, number: 0 };
  for (let i2 = 0; i2 < t2.values.length; i2++) {
    let a2 = t2.types[i2], o2 = e2.indexes[a2][r2[a2]], s2 = e2.values[o2] ?? 0;
    n2[i2] = s2, r2[a2]++;
  }
  return n2;
}
var Rt = (e2, t2) => {
  let n2 = L.createTransformer(t2), r2 = gt(e2), i2 = gt(t2);
  return r2.indexes.var.length === i2.indexes.var.length && r2.indexes.color.length === i2.indexes.color.length && r2.indexes.number.length >= i2.indexes.number.length ? jt.has(e2) && !i2.values.length || jt.has(t2) && !r2.values.length ? Mt(e2, t2) : ie(Ft(Lt(r2, i2), i2.values), n2) : (`${e2}${t2}`, Tt(e2, t2));
};
function zt(e2, t2, n2) {
  return typeof e2 == "number" && typeof t2 == "number" && typeof n2 == "number" ? R(e2, t2, n2) : Pt(e2)(e2, t2);
}
var Bt = (e2) => {
  let t2 = ({ timestamp: t3 }) => e2(t3);
  return { start: (e3 = !0) => k.update(t2, e3), stop: () => A(t2), now: () => j.isProcessing ? j.timestamp : M.now() };
};
var Vt = (e2, t2, n2 = 10) => {
  let r2 = "", i2 = Math.max(Math.round(t2 / n2), 2);
  for (let t3 = 0; t3 < i2; t3++) r2 += Math.round(e2(t3 / (i2 - 1)) * 1e4) / 1e4 + ", ";
  return `linear(${r2.substring(0, r2.length - 2)})`;
};
var Ht = 2e4;
function Ut(e2, t2 = 50, n2 = Ht, r2) {
  let i2 = 0, a2 = e2.next(i2);
  for (r2?.push(a2.value); !a2.done && i2 < n2; ) i2 += t2, a2 = e2.next(i2), r2?.push(a2.value);
  return i2 >= n2 ? 1 / 0 : i2;
}
function Wt(e2, t2 = 100, n2) {
  let r2 = n2({ ...e2, keyframes: [0, t2] }), i2 = Math.min(Ut(r2), Ht);
  return { type: "keyframes", ease: (e3) => r2.next(i2 * e3).value / t2, duration: O(i2) };
}
var z = { stiffness: 100, damping: 10, mass: 1, velocity: 0, duration: 800, bounce: 0.3, visualDuration: 0.3, restSpeed: { granular: 0.01, default: 2 }, restDelta: { granular: 5e-3, default: 0.5 }, minDuration: 0.01, maxDuration: 10, minDamping: 0.05, maxDamping: 1 };
function Gt(e2, t2) {
  return e2 * Math.sqrt(1 - t2 * t2);
}
var Kt = 12;
function qt(e2, t2, n2) {
  let r2 = n2;
  for (let n3 = 1; n3 < Kt; n3++) r2 -= e2(r2) / t2(r2);
  return r2;
}
var Jt = 1e-3;
function Yt({ duration: e2 = z.duration, bounce: t2 = z.bounce, velocity: n2 = z.velocity, mass: r2 = z.mass }) {
  let i2, a2;
  z.maxDuration;
  let o2 = 1 - t2;
  o2 = w(z.minDamping, z.maxDamping, o2), e2 = w(z.minDuration, z.maxDuration, O(e2)), o2 < 1 ? (i2 = (t3) => {
    let r3 = t3 * o2, i3 = r3 * e2, a3 = r3 - n2, s3 = Gt(t3, o2), c3 = Math.exp(-i3);
    return Jt - a3 / s3 * c3;
  }, a2 = (t3) => {
    let r3 = t3 * o2 * e2, a3 = r3 * n2 + n2, s3 = o2 * o2 * t3 * t3 * e2, c3 = Math.exp(-r3), l2 = Gt(t3 * t3, o2);
    return (-i2(t3) + Jt > 0 ? -1 : 1) * ((a3 - s3) * c3) / l2;
  }) : (i2 = (t3) => -1e-3 + Math.exp(-t3 * e2) * ((t3 - n2) * e2 + 1), a2 = (t3) => Math.exp(-t3 * e2) * ((n2 - t3) * (e2 * e2)));
  let s2 = 5 / e2, c2 = qt(i2, a2, s2);
  if (e2 = D(e2), isNaN(c2)) return { stiffness: z.stiffness, damping: z.damping, duration: e2 };
  {
    let t3 = c2 * c2 * r2;
    return { stiffness: t3, damping: o2 * 2 * Math.sqrt(r2 * t3), duration: e2 };
  }
}
var Xt = ["duration", "bounce"];
var Zt = ["stiffness", "damping", "mass"];
function Qt(e2, t2) {
  return t2.some((t3) => e2[t3] !== void 0);
}
function $t(e2) {
  let t2 = { velocity: z.velocity, stiffness: z.stiffness, damping: z.damping, mass: z.mass, isResolvedFromDuration: !1, ...e2 };
  if (!Qt(e2, Zt) && Qt(e2, Xt))
    if (t2.velocity = 0, e2.visualDuration) {
      let n2 = e2.visualDuration, r2 = 2 * Math.PI / (n2 * 1.2), i2 = r2 * r2, a2 = 2 * w(0.05, 1, 1 - (e2.bounce || 0)) * Math.sqrt(i2);
      t2 = { ...t2, mass: z.mass, stiffness: i2, damping: a2 };
    } else {
      let n2 = Yt({ ...e2, velocity: 0 });
      t2 = { ...t2, ...n2, mass: z.mass }, t2.isResolvedFromDuration = !0;
    }
  return t2;
}
function en(e2 = z.visualDuration, t2 = z.bounce) {
  let n2 = typeof e2 == "object" ? e2 : { visualDuration: e2, keyframes: [0, 1], bounce: t2 }, { restSpeed: r2, restDelta: i2 } = n2, a2 = n2.keyframes[0], o2 = n2.keyframes[n2.keyframes.length - 1], s2 = { done: !1, value: a2 }, { stiffness: c2, damping: l2, mass: u2, duration: d2, velocity: f2, isResolvedFromDuration: p2 } = $t({ ...n2, velocity: -O(n2.velocity || 0) }), m2 = f2 || 0, h2 = l2 / (2 * Math.sqrt(c2 * u2)), g2 = o2 - a2, _2 = O(Math.sqrt(c2 / u2)), v2 = h2 * _2, y2 = Math.abs(g2) < 5;
  r2 ||= y2 ? z.restSpeed.granular : z.restSpeed.default, i2 ||= y2 ? z.restDelta.granular : z.restDelta.default;
  let b2, x2;
  if (h2 < 1) {
    let e3 = Gt(_2, h2), t3 = (m2 + v2 * g2) / e3, n3 = v2 * t3 + g2 * e3, r3 = v2 * g2 - t3 * e3, i3 = -1, a3 = 0, s3 = 0, c3 = (c4) => {
      if (c4 !== i3) {
        i3 = c4;
        let l3 = Math.exp(-v2 * c4), u3 = Math.sin(e3 * c4), d3 = Math.cos(e3 * c4);
        a3 = o2 - l3 * (t3 * u3 + g2 * d3), s3 = l3 * (n3 * u3 + r3 * d3);
      }
    };
    b2 = (e4) => (c3(e4), a3), x2 = (e4) => (c3(e4), s3);
  } else if (h2 === 1) {
    b2 = (e4) => o2 - Math.exp(-_2 * e4) * (g2 + (m2 + _2 * g2) * e4);
    let e3 = m2 + _2 * g2;
    x2 = (t3) => Math.exp(-_2 * t3) * (_2 * e3 * t3 - m2);
  } else {
    let e3 = _2 * Math.sqrt(h2 * h2 - 1);
    b2 = (t4) => {
      let n4 = Math.exp(-v2 * t4), r4 = Math.min(e3 * t4, 300);
      return o2 - n4 * ((m2 + v2 * g2) * Math.sinh(r4) + e3 * g2 * Math.cosh(r4)) / e3;
    };
    let t3 = (m2 + v2 * g2) / e3, n3 = v2 * t3 - g2 * e3, r3 = v2 * g2 - t3 * e3;
    x2 = (t4) => {
      let i3 = Math.exp(-v2 * t4), a3 = Math.min(e3 * t4, 300);
      return i3 * (n3 * Math.sinh(a3) + r3 * Math.cosh(a3));
    };
  }
  let S2 = { calculatedDuration: p2 && d2 || null, velocity: (e3) => D(x2(e3)), next: (e3) => {
    let t3 = b2(e3);
    if (p2) s2.done = e3 >= d2;
    else {
      let n3 = D(x2(e3));
      s2.done = Math.abs(n3) <= r2 && Math.abs(o2 - t3) <= i2;
    }
    return s2.value = s2.done ? o2 : t3, s2;
  }, toString: () => {
    let e3 = Math.min(Ut(S2), Ht), t3 = Vt((t4) => S2.next(e3 * t4).value, e3, 30);
    return e3 + "ms " + t3;
  }, toTransition: () => {
  } };
  return S2;
}
en.applyToOptions = (e2) => {
  let t2 = Wt(e2, 100, en);
  return e2.ease = t2.ease, e2.duration = D(t2.duration), e2.type = "keyframes", e2;
};
function tn({ keyframes: e2, velocity: t2 = 0, power: n2 = 0.8, timeConstant: r2 = 325, bounceDamping: i2 = 10, bounceStiffness: a2 = 500, modifyTarget: o2, min: s2, max: c2, restDelta: l2 = 0.5, restSpeed: u2 }) {
  let d2 = e2[0], f2 = { done: !1, value: d2 }, p2 = (e3) => e3 < s2 || e3 > c2, m2 = (e3) => s2 === void 0 ? c2 : c2 === void 0 || Math.abs(s2 - e3) < Math.abs(c2 - e3) ? s2 : c2, h2 = n2 * t2, g2 = d2 + h2, _2 = o2 === void 0 ? g2 : o2(g2);
  _2 !== g2 && (h2 = _2 - d2);
  let v2 = (e3) => -h2 * Math.exp(-e3 / r2), y2 = (e3) => {
    let t3 = v2(e3);
    f2.done = Math.abs(t3) <= l2, f2.value = f2.done ? _2 : _2 + t3;
  }, b2, x2, S2 = (e3) => {
    p2(f2.value) && (b2 = e3, x2 = en({ keyframes: [f2.value, m2(f2.value)], velocity: -v2(e3) / r2 * 1e3, damping: i2, stiffness: a2, restDelta: l2, restSpeed: u2 }));
  };
  return S2(0), { calculatedDuration: null, next: (e3) => {
    let t3 = !1;
    return !x2 && b2 === void 0 && (t3 = !0, y2(e3), S2(e3)), b2 !== void 0 && e3 >= b2 ? x2.next(e3 - b2) : (!t3 && y2(e3), f2);
  } };
}
function nn(e2, t2, n2) {
  let r2 = [], i2 = n2 || T.mix || zt, a2 = e2.length - 1;
  for (let n3 = 0; n3 < a2; n3++) {
    let a3 = i2(e2[n3], e2[n3 + 1]);
    t2 && (a3 = ie(Array.isArray(t2) ? t2[n3] || E : t2, a3)), r2.push(a3);
  }
  return r2;
}
function rn(e2, t2, { clamp: n2 = !0, ease: r2, mixer: i2 } = {}) {
  let a2 = e2.length;
  if (t2.length, a2 === 1) return () => t2[0];
  if (a2 === 2 && t2[0] === t2[1]) return () => t2[1];
  let o2 = e2[0] === e2[1];
  e2[0] > e2[a2 - 1] && (e2 = [...e2].reverse(), t2 = [...t2].reverse());
  let s2 = nn(t2, r2, i2), c2 = s2.length, l2 = (n3) => {
    if (o2 && n3 < e2[0]) return t2[0];
    let r3 = 0;
    if (c2 > 1) for (; r3 < e2.length - 2 && !(n3 < e2[r3 + 1]); r3++) ;
    let i3 = ae(e2[r3], e2[r3 + 1], n3);
    return s2[r3](i3);
  };
  return n2 ? (t3) => l2(w(e2[0], e2[a2 - 1], t3)) : l2;
}
function an(e2, t2) {
  let n2 = e2[e2.length - 1];
  for (let r2 = 1; r2 <= t2; r2++) {
    let i2 = ae(0, t2, r2);
    e2.push(R(n2, 1, i2));
  }
}
function on(e2) {
  let t2 = [0];
  return an(t2, e2.length - 1), t2;
}
function sn(e2, t2) {
  return e2.map((e3) => e3 * t2);
}
function cn(e2, t2) {
  return e2.map(() => t2 || we).splice(0, e2.length - 1);
}
function ln({ duration: e2 = 300, keyframes: t2, times: n2, ease: r2 = "easeInOut" }) {
  let i2 = Te(r2) ? r2.map(ke) : ke(r2), a2 = { done: !1, value: t2[0] }, o2 = rn(sn(n2 && n2.length === t2.length ? n2 : on(t2), e2), t2, { ease: Array.isArray(i2) ? i2 : cn(t2, i2) });
  return { calculatedDuration: e2, next: (t3) => (a2.value = o2(t3), a2.done = t3 >= e2, a2) };
}
var un = 5;
function dn(e2, t2, n2) {
  let r2 = Math.max(t2 - un, 0);
  return se(n2 - e2(r2), t2 - r2);
}
var fn = (e2) => e2 !== null;
function pn(e2, { repeat: t2, repeatType: n2 = "loop" }, r2, i2 = 1) {
  let a2 = e2.filter(fn), o2 = i2 < 0 || t2 && n2 !== "loop" && t2 % 2 == 1 ? 0 : a2.length - 1;
  return !o2 || r2 === void 0 ? a2[o2] : r2;
}
var mn = { decay: tn, inertia: tn, tween: ln, keyframes: ln, spring: en };
function hn(e2) {
  typeof e2.type == "string" && (e2.type = mn[e2.type]);
}
var gn = class {
  constructor() {
    this.updateFinished();
  }
  get finished() {
    return this._finished;
  }
  updateFinished() {
    this._finished = new Promise((e2) => {
      this.resolve = e2;
    });
  }
  notifyFinished() {
    this.resolve();
  }
  then(e2, t2) {
    return this.finished.then(e2, t2);
  }
};
var _n = (e2) => e2 / 100;
var vn = class extends gn {
  constructor(e2) {
    super(), this.state = "idle", this.startTime = null, this.isStopped = !1, this.currentTime = 0, this.holdTime = null, this.playbackSpeed = 1, this.delayState = { done: !1, value: void 0 }, this.stop = () => {
      let { motionValue: e3 } = this.options;
      e3 && e3.updatedAt !== M.now() && this.tick(M.now()), this.isStopped = !0, this.state !== "idle" && (this.teardown(), this.options.onStop?.());
    }, this.options = e2, this.initAnimation(), this.play(), e2.autoplay === !1 && this.pause();
  }
  initAnimation() {
    let { options: e2 } = this;
    hn(e2);
    let { type: t2 = ln, repeat: n2 = 0, repeatDelay: r2 = 0, repeatType: i2, velocity: a2 = 0 } = e2, { keyframes: o2 } = e2, s2 = t2 || ln;
    s2 !== ln && typeof o2[0] != "number" && (this.mixKeyframes = ie(_n, zt(o2[0], o2[1])), o2 = [0, 100]);
    let c2 = s2({ ...e2, keyframes: o2 });
    i2 === "mirror" && (this.mirroredGenerator = s2({ ...e2, keyframes: [...o2].reverse(), velocity: -a2 })), c2.calculatedDuration === null && (c2.calculatedDuration = Ut(c2));
    let { calculatedDuration: l2 } = c2;
    this.calculatedDuration = l2, this.resolvedDuration = l2 + r2, this.totalDuration = this.resolvedDuration * (n2 + 1) - r2, this.generator = c2;
  }
  updateTime(e2) {
    let t2 = Math.round(e2 - this.startTime) * this.playbackSpeed;
    this.currentTime = this.holdTime === null ? t2 : this.holdTime;
  }
  tick(e2, t2 = !1) {
    let { generator: n2, totalDuration: r2, mixKeyframes: i2, mirroredGenerator: a2, resolvedDuration: o2, calculatedDuration: s2 } = this;
    if (this.startTime === null) return n2.next(0);
    let { delay: c2 = 0, keyframes: l2, repeat: u2, repeatType: d2, repeatDelay: f2, type: p2, onUpdate: m2, finalKeyframe: h2 } = this.options;
    this.speed > 0 ? this.startTime = Math.min(this.startTime, e2) : this.speed < 0 && (this.startTime = Math.min(e2 - r2 / this.speed, this.startTime)), t2 ? this.currentTime = e2 : this.updateTime(e2);
    let g2 = this.currentTime - c2 * (this.playbackSpeed >= 0 ? 1 : -1), _2 = this.playbackSpeed >= 0 ? g2 < 0 : g2 > r2;
    this.currentTime = Math.max(g2, 0), this.state === "finished" && this.holdTime === null && (this.currentTime = r2);
    let v2 = this.currentTime, y2 = n2;
    if (u2) {
      let e3 = Math.min(this.currentTime, r2) / o2, t3 = Math.floor(e3), n3 = e3 % 1;
      !n3 && e3 >= 1 && (n3 = 1), n3 === 1 && t3--, t3 = Math.min(t3, u2 + 1), t3 % 2 && (d2 === "reverse" ? (n3 = 1 - n3, f2 && (n3 -= f2 / o2)) : d2 === "mirror" && (y2 = a2)), v2 = w(0, 1, n3) * o2;
    }
    let b2;
    _2 ? (this.delayState.value = l2[0], b2 = this.delayState) : b2 = y2.next(v2), i2 && !_2 && (b2.value = i2(b2.value));
    let { done: x2 } = b2;
    !_2 && s2 !== null && (x2 = this.playbackSpeed >= 0 ? this.currentTime >= r2 : this.currentTime <= 0);
    let S2 = this.holdTime === null && (this.state === "finished" || this.state === "running" && x2);
    return S2 && p2 !== tn && (b2.value = pn(l2, this.options, h2, this.speed)), m2 && m2(b2.value), S2 && this.finish(), b2;
  }
  then(e2, t2) {
    return this.finished.then(e2, t2);
  }
  get duration() {
    return O(this.calculatedDuration);
  }
  get iterationDuration() {
    let { delay: e2 = 0 } = this.options || {};
    return this.duration + O(e2);
  }
  get time() {
    return O(this.currentTime);
  }
  set time(e2) {
    e2 = D(e2), this.currentTime = e2, this.startTime === null || this.holdTime !== null || this.playbackSpeed === 0 ? this.holdTime = e2 : this.driver && (this.startTime = this.driver.now() - e2 / this.playbackSpeed), this.driver ? this.driver.start(!1) : (this.startTime = 0, this.state = "paused", this.holdTime = e2, this.tick(e2));
  }
  getGeneratorVelocity() {
    let e2 = this.currentTime;
    if (e2 <= 0) return this.options.velocity || 0;
    if (this.generator.velocity) return this.generator.velocity(e2);
    let t2 = this.generator.next(e2).value;
    return dn((e3) => this.generator.next(e3).value, e2, t2);
  }
  get speed() {
    return this.playbackSpeed;
  }
  set speed(e2) {
    let t2 = this.playbackSpeed !== e2;
    t2 && this.driver && this.updateTime(M.now()), this.playbackSpeed = e2, t2 && this.driver && (this.time = O(this.currentTime));
  }
  play() {
    if (this.isStopped) return;
    let { driver: e2 = Bt, startTime: t2 } = this.options;
    this.driver ||= e2((e3) => this.tick(e3)), this.options.onPlay?.();
    let n2 = this.driver.now();
    this.state === "finished" ? (this.updateFinished(), this.startTime = n2) : this.holdTime === null ? this.startTime ||= t2 ?? n2 : this.startTime = n2 - this.holdTime, this.state === "finished" && this.speed < 0 && (this.startTime += this.calculatedDuration), this.holdTime = null, this.state = "running", this.driver.start();
  }
  pause() {
    this.state = "paused", this.updateTime(M.now()), this.holdTime = this.currentTime;
  }
  complete() {
    this.state !== "running" && this.play(), this.state = "finished", this.holdTime = null;
  }
  finish() {
    this.notifyFinished(), this.teardown(), this.state = "finished", this.options.onComplete?.();
  }
  cancel() {
    this.holdTime = null, this.startTime = 0, this.tick(0), this.teardown(), this.options.onCancel?.();
  }
  teardown() {
    this.state = "idle", this.stopDriver(), this.startTime = this.holdTime = null;
  }
  stopDriver() {
    this.driver &&= (this.driver.stop(), void 0);
  }
  sample(e2) {
    return this.startTime = 0, this.tick(e2, !0);
  }
  attachTimeline(e2) {
    return this.options.allowFlatten && (this.options.type = "keyframes", this.options.ease = "linear", this.initAnimation()), this.driver?.stop(), e2.observe(this);
  }
};
function yn(e2) {
  for (let t2 = 1; t2 < e2.length; t2++) e2[t2] ?? (e2[t2] = e2[t2 - 1]);
}
var B = (e2) => e2 * 180 / Math.PI;
var bn = (e2) => Sn(B(Math.atan2(e2[1], e2[0])));
var xn = { x: 4, y: 5, translateX: 4, translateY: 5, scaleX: 0, scaleY: 3, scale: (e2) => (Math.abs(e2[0]) + Math.abs(e2[3])) / 2, rotate: bn, rotateZ: bn, skewX: (e2) => B(Math.atan(e2[1])), skewY: (e2) => B(Math.atan(e2[2])), skew: (e2) => (Math.abs(e2[1]) + Math.abs(e2[2])) / 2 };
var Sn = (e2) => (e2 %= 360, e2 < 0 && (e2 += 360), e2);
var Cn = bn;
var wn = (e2) => Math.sqrt(e2[0] * e2[0] + e2[1] * e2[1]);
var Tn = (e2) => Math.sqrt(e2[4] * e2[4] + e2[5] * e2[5]);
var En = { x: 12, y: 13, z: 14, translateX: 12, translateY: 13, translateZ: 14, scaleX: wn, scaleY: Tn, scale: (e2) => (wn(e2) + Tn(e2)) / 2, rotateX: (e2) => Sn(B(Math.atan2(e2[6], e2[5]))), rotateY: (e2) => Sn(B(Math.atan2(-e2[2], e2[0]))), rotateZ: Cn, rotate: Cn, skewX: (e2) => B(Math.atan(e2[4])), skewY: (e2) => B(Math.atan(e2[1])), skew: (e2) => (Math.abs(e2[1]) + Math.abs(e2[4])) / 2 };
function Dn(e2) {
  return +!!e2.includes("scale");
}
function On(e2, t2) {
  if (!e2 || e2 === "none") return Dn(t2);
  let n2 = e2.match(/^matrix3d\(([-\d.e\s,]+)\)$/u), r2, i2;
  if (n2) r2 = En, i2 = n2;
  else {
    let t3 = e2.match(/^matrix\(([-\d.e\s,]+)\)$/u);
    r2 = xn, i2 = t3;
  }
  if (!i2) return Dn(t2);
  let a2 = r2[t2], o2 = i2[1].split(",").map(An);
  return typeof a2 == "function" ? a2(o2) : o2[a2];
}
var kn = (e2, t2) => {
  let { transform: n2 = "none" } = getComputedStyle(e2);
  return On(n2, t2);
};
function An(e2) {
  return parseFloat(e2.trim());
}
var jn = ["transformPerspective", "x", "y", "z", "translateX", "translateY", "translateZ", "scale", "scaleX", "scaleY", "rotate", "rotateX", "rotateY", "rotateZ", "skew", "skewX", "skewY"];
var Mn = /* @__PURE__ */ new Set([...jn, "pathRotation"]);
var Nn = (e2) => e2 === Ue || e2 === F;
var Pn = /* @__PURE__ */ new Set(["x", "y", "z"]);
var Fn = jn.filter((e2) => !Pn.has(e2));
function In(e2) {
  let t2 = [];
  return Fn.forEach((n2) => {
    let r2 = e2.getValue(n2);
    r2 !== void 0 && (t2.push([n2, r2.get()]), r2.set(+!!n2.startsWith("scale")));
  }), t2;
}
var V = { width: ({ x: e2 }, { paddingLeft: t2 = "0", paddingRight: n2 = "0", boxSizing: r2 }) => {
  let i2 = e2.max - e2.min;
  return r2 === "border-box" ? i2 : i2 - parseFloat(t2) - parseFloat(n2);
}, height: ({ y: e2 }, { paddingTop: t2 = "0", paddingBottom: n2 = "0", boxSizing: r2 }) => {
  let i2 = e2.max - e2.min;
  return r2 === "border-box" ? i2 : i2 - parseFloat(t2) - parseFloat(n2);
}, top: (e2, { top: t2 }) => parseFloat(t2), left: (e2, { left: t2 }) => parseFloat(t2), bottom: ({ y: e2 }, { top: t2 }) => parseFloat(t2) + (e2.max - e2.min), right: ({ x: e2 }, { left: t2 }) => parseFloat(t2) + (e2.max - e2.min), x: (e2, { transform: t2 }) => On(t2, "x"), y: (e2, { transform: t2 }) => On(t2, "y") };
(V.translateX = V.x);
(V.translateY = V.y);
var H = /* @__PURE__ */ new Set();
var Ln = !1;
var Rn = !1;
var zn = !1;
function Bn() {
  if (Rn) {
    let e2 = Array.from(H).filter((e3) => e3.needsMeasurement), t2 = new Set(e2.map((e3) => e3.element)), n2 = /* @__PURE__ */ new Map();
    t2.forEach((e3) => {
      let t3 = In(e3);
      t3.length && (n2.set(e3, t3), e3.render());
    }), e2.forEach((e3) => e3.measureInitialState()), t2.forEach((e3) => {
      e3.render();
      let t3 = n2.get(e3);
      t3 && t3.forEach(([t4, n3]) => {
        e3.getValue(t4)?.set(n3);
      });
    }), e2.forEach((e3) => e3.measureEndState()), e2.forEach((e3) => {
      e3.suspendedScrollY !== void 0 && window.scrollTo(0, e3.suspendedScrollY);
    });
  }
  Rn = !1, Ln = !1, H.forEach((e2) => e2.complete(zn)), H.clear();
}
function Vn() {
  H.forEach((e2) => {
    e2.readKeyframes(), e2.needsMeasurement && (Rn = !0);
  });
}
function Hn() {
  zn = !0, Vn(), Bn(), zn = !1;
}
var Un = class {
  constructor(e2, t2, n2, r2, i2, a2 = !1) {
    this.state = "pending", this.isAsync = !1, this.needsMeasurement = !1, this.unresolvedKeyframes = [...e2], this.onComplete = t2, this.name = n2, this.motionValue = r2, this.element = i2, this.isAsync = a2;
  }
  scheduleResolve() {
    this.state = "scheduled", this.isAsync ? (H.add(this), Ln || (Ln = !0, k.read(Vn), k.resolveKeyframes(Bn))) : (this.readKeyframes(), this.complete());
  }
  readKeyframes() {
    let { unresolvedKeyframes: e2, name: t2, element: n2, motionValue: r2 } = this;
    if (e2[0] === null) {
      let i2 = r2?.get(), a2 = e2[e2.length - 1];
      if (i2 !== void 0) e2[0] = i2;
      else if (n2 && t2) {
        let r3 = n2.readValue(t2, a2);
        r3 != null && (e2[0] = r3);
      }
      e2[0] === void 0 && (e2[0] = a2), r2 && i2 === void 0 && r2.set(e2[0]);
    }
    yn(e2);
  }
  setFinalKeyframe() {
  }
  measureInitialState() {
  }
  renderEndStyles() {
  }
  measureEndState() {
  }
  complete(e2 = !1) {
    this.state = "complete", this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, e2), H.delete(this);
  }
  cancel() {
    this.state === "scheduled" && (H.delete(this), this.state = "pending");
  }
  resume() {
    this.state === "pending" && this.scheduleResolve();
  }
};
var Wn = (e2) => e2.startsWith("--");
function Gn(e2, t2, n2) {
  Wn(t2) ? e2.style.setProperty(t2, n2) : e2.style[t2] = n2;
}
var Kn = {};
function qn(e2, t2) {
  let n2 = re(e2);
  return () => Kn[t2] ?? n2();
}
var Jn = qn(() => window.ScrollTimeline !== void 0, "scrollTimeline");
var Yn = qn(() => {
  try {
    document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
  } catch {
    return !1;
  }
  return !0;
}, "linearEasing");
var Xn = ([e2, t2, n2, r2]) => `cubic-bezier(${e2}, ${t2}, ${n2}, ${r2})`;
var Zn = { linear: "linear", ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", circIn: Xn([0, 0.65, 0.55, 1]), circOut: Xn([0.55, 0, 1, 0.45]), backIn: Xn([0.31, 0.01, 0.66, -0.59]), backOut: Xn([0.33, 1.53, 0.69, 0.99]) };
function Qn(e2, t2) {
  if (e2) return typeof e2 == "function" ? Yn() ? Vt(e2, t2) : "ease-out" : Ee(e2) ? Xn(e2) : Array.isArray(e2) ? e2.map((e3) => Qn(e3, t2) || Zn.easeOut) : Zn[e2];
}
function $n(e2, t2, n2, { delay: r2 = 0, duration: i2 = 300, repeat: a2 = 0, repeatType: o2 = "loop", ease: s2 = "easeOut", times: c2 } = {}, l2 = void 0) {
  let u2 = { [t2]: n2 };
  c2 && (u2.offset = c2);
  let d2 = Qn(s2, i2);
  Array.isArray(d2) && (u2.easing = d2);
  let f2 = { delay: r2, duration: i2, easing: Array.isArray(d2) ? "linear" : d2, fill: "both", iterations: a2 + 1, direction: o2 === "reverse" ? "alternate" : "normal" };
  return l2 && (f2.pseudoElement = l2), e2.animate(u2, f2);
}
function er(e2) {
  return typeof e2 == "function" && "applyToOptions" in e2;
}
function tr({ type: e2, ...t2 }) {
  return er(e2) && Yn() ? e2.applyToOptions(t2) : (t2.duration ??= 300, t2.ease ??= "easeOut", t2);
}
var nr = class extends gn {
  constructor(e2) {
    if (super(), this.finishedTime = null, this.isStopped = !1, this.manualStartTime = null, !e2) return;
    let { element: t2, name: n2, keyframes: r2, pseudoElement: i2, allowFlatten: a2 = !1, finalKeyframe: o2, onComplete: s2 } = e2;
    this.isPseudoElement = !!i2, this.allowFlatten = a2, this.options = e2, e2.type;
    let c2 = tr(e2);
    this.animation = $n(t2, n2, r2, c2, i2), c2.autoplay === !1 && this.animation.pause(), this.animation.onfinish = () => {
      if (this.finishedTime = this.time, !i2) {
        let e3 = pn(r2, this.options, o2, this.speed);
        this.updateMotionValue && this.updateMotionValue(e3), Gn(t2, n2, e3), this.animation.cancel();
      }
      s2?.(), this.notifyFinished();
    };
  }
  play() {
    this.isStopped || (this.manualStartTime = null, this.animation.play(), this.state === "finished" && this.updateFinished());
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.finish?.();
  }
  cancel() {
    try {
      this.animation.cancel();
    } catch {
    }
  }
  stop() {
    if (this.isStopped) return;
    this.isStopped = !0;
    let { state: e2 } = this;
    e2 !== "idle" && e2 !== "finished" && (this.updateMotionValue ? this.updateMotionValue() : this.commitStyles(), this.isPseudoElement || this.cancel());
  }
  commitStyles() {
    let e2 = this.options?.element;
    !this.isPseudoElement && e2?.isConnected && this.animation.commitStyles?.();
  }
  get duration() {
    let e2 = this.animation.effect?.getComputedTiming?.().duration || 0;
    return O(Number(e2));
  }
  get iterationDuration() {
    let { delay: e2 = 0 } = this.options || {};
    return this.duration + O(e2);
  }
  get time() {
    return O(Number(this.animation.currentTime) || 0);
  }
  set time(e2) {
    let t2 = this.finishedTime !== null;
    this.manualStartTime = null, this.finishedTime = null, this.animation.currentTime = D(e2), t2 && this.animation.pause();
  }
  get speed() {
    return this.animation.playbackRate;
  }
  set speed(e2) {
    e2 < 0 && (this.finishedTime = null), this.animation.playbackRate = e2;
  }
  get state() {
    return this.finishedTime === null ? this.animation.playState : "finished";
  }
  get startTime() {
    return this.manualStartTime ?? Number(this.animation.startTime);
  }
  set startTime(e2) {
    this.manualStartTime = this.animation.startTime = e2;
  }
  attachTimeline({ timeline: e2, rangeStart: t2, rangeEnd: n2, observe: r2 }) {
    return this.allowFlatten && this.animation.effect?.updateTiming({ easing: "linear" }), this.animation.onfinish = null, e2 && Jn() ? (this.animation.timeline = e2, t2 && (this.animation.rangeStart = t2), n2 && (this.animation.rangeEnd = n2), E) : r2(this);
  }
};
var rr = { anticipate: ve, backInOut: _e, circInOut: xe };
function ir(e2) {
  return e2 in rr;
}
function ar(e2) {
  typeof e2.ease == "string" && ir(e2.ease) && (e2.ease = rr[e2.ease]);
}
var or = 10;
var sr = class extends nr {
  constructor(e2) {
    ar(e2), hn(e2), super(e2), e2.startTime !== void 0 && e2.autoplay !== !1 && (this.startTime = e2.startTime), this.options = e2;
  }
  updateMotionValue(e2) {
    let { motionValue: t2, onUpdate: n2, onComplete: r2, element: i2, ...a2 } = this.options;
    if (!t2) return;
    if (e2 !== void 0) {
      t2.set(e2);
      return;
    }
    let o2 = new vn({ ...a2, autoplay: !1 }), s2 = Math.max(or, M.now() - this.startTime), c2 = w(0, or, s2 - or), l2 = o2.sample(s2).value, { name: u2 } = this.options;
    i2 && u2 && Gn(i2, u2, l2), t2.setWithVelocity(o2.sample(Math.max(0, s2 - c2)).value, l2, c2), o2.stop();
  }
};
var cr = (e2, t2) => t2 !== "zIndex" && !!(typeof e2 == "number" || Array.isArray(e2) || typeof e2 == "string" && (L.test(e2) || e2 === "0") && !e2.startsWith("url("));
function lr(e2) {
  let t2 = e2[0];
  if (e2.length === 1) return !0;
  for (let n2 = 0; n2 < e2.length; n2++) if (e2[n2] !== t2) return !0;
}
function ur(e2, t2, n2, r2) {
  let i2 = e2[0];
  if (i2 === null) return !1;
  if (t2 === "display" || t2 === "visibility") return !0;
  let a2 = e2[e2.length - 1], o2 = cr(i2, t2), s2 = cr(a2, t2);
  return `${t2}${i2}${a2}${o2 ? a2 : i2}`, !o2 || !s2 ? !1 : lr(e2) || (n2 === "spring" || er(n2)) && r2;
}
function dr(e2) {
  e2.duration = 0, e2.type = "keyframes";
}
var fr = /* @__PURE__ */ new Set(["opacity", "clipPath", "filter", "transform", "backgroundColor"]);
var pr = /^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;
function mr(e2) {
  for (let t2 = 0; t2 < e2.length; t2++) if (typeof e2[t2] == "string" && pr.test(e2[t2])) return !0;
  return !1;
}
var hr = /* @__PURE__ */ new Set(["color", "backgroundColor", "outlineColor", "fill", "stroke", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor"]);
var gr = re(() => Object.hasOwnProperty.call(Element.prototype, "animate"));
function _r(e2) {
  let { motionValue: t2, name: n2, repeatDelay: r2, repeatType: i2, damping: a2, type: o2, keyframes: s2 } = e2, c2 = t2?.owner?.current;
  if (!(c2 instanceof HTMLElement) && !(c2 instanceof SVGElement)) return !1;
  let { onUpdate: l2, transformTemplate: u2 } = t2.owner.getProps();
  return gr() && n2 && (fr.has(n2) || hr.has(n2) && mr(s2)) && (n2 !== "transform" || !u2) && !l2 && !r2 && i2 !== "mirror" && a2 !== 0 && o2 !== "inertia";
}
var vr = 40;
var yr = class extends gn {
  constructor({ autoplay: e2 = !0, delay: t2 = 0, type: n2 = "keyframes", repeat: r2 = 0, repeatDelay: i2 = 0, repeatType: a2 = "loop", keyframes: o2, name: s2, motionValue: c2, element: l2, ...u2 }) {
    super(), this.stop = () => {
      this._animation && (this._animation.stop(), this.stopTimeline?.()), this.keyframeResolver?.cancel();
    }, this.createdAt = M.now();
    let d2 = { autoplay: e2, delay: t2, type: n2, repeat: r2, repeatDelay: i2, repeatType: a2, name: s2, motionValue: c2, element: l2, ...u2 }, f2 = l2?.KeyframeResolver || Un;
    this.keyframeResolver = new f2(o2, (e3, t3, n3) => this.onKeyframesResolved(e3, t3, d2, !n3), s2, c2, l2), this.keyframeResolver?.scheduleResolve();
  }
  onKeyframesResolved(e2, t2, n2, r2) {
    this.keyframeResolver = void 0;
    let { name: i2, type: a2, velocity: o2, delay: s2, isHandoff: c2, onUpdate: l2 } = n2;
    this.resolvedAt = M.now();
    let u2 = !0;
    ur(e2, i2, a2, o2) || (u2 = !1, (T.instantAnimations || !s2) && l2?.(pn(e2, n2, t2)), e2[0] = e2[e2.length - 1], dr(n2), n2.repeat = 0);
    let d2 = { startTime: r2 ? this.resolvedAt && this.resolvedAt - this.createdAt > vr ? this.resolvedAt : this.createdAt : void 0, finalKeyframe: t2, ...n2, keyframes: e2 }, f2 = u2 && !c2 && _r(d2), p2 = d2.motionValue?.owner?.current, m2;
    if (f2) try {
      m2 = new sr({ ...d2, element: p2 });
    } catch {
      m2 = new vn(d2);
    }
    else m2 = new vn(d2);
    m2.finished.then(() => {
      this.notifyFinished();
    }).catch(E), this.pendingTimeline &&= (this.stopTimeline = m2.attachTimeline(this.pendingTimeline), void 0), this._animation = m2;
  }
  get finished() {
    return this._animation ? this.animation.finished : this._finished;
  }
  then(e2, t2) {
    return this.finished.finally(e2).then(() => {
    });
  }
  get animation() {
    return this._animation || (this.keyframeResolver?.resume(), Hn()), this._animation;
  }
  get duration() {
    return this.animation.duration;
  }
  get iterationDuration() {
    return this.animation.iterationDuration;
  }
  get time() {
    return this.animation.time;
  }
  set time(e2) {
    this.animation.time = e2;
  }
  get speed() {
    return this.animation.speed;
  }
  get state() {
    return this.animation.state;
  }
  set speed(e2) {
    this.animation.speed = e2;
  }
  get startTime() {
    return this.animation.startTime;
  }
  attachTimeline(e2) {
    return this._animation ? this.stopTimeline = this.animation.attachTimeline(e2) : this.pendingTimeline = e2, () => this.stop();
  }
  play() {
    this.animation.play();
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.complete();
  }
  cancel() {
    this._animation && this.animation.cancel(), this.keyframeResolver?.cancel();
  }
};
function br(e2, t2, n2, r2 = 0, i2 = 1) {
  let a2 = Array.from(e2).sort((e3, t3) => e3.sortNodePosition(t3)).indexOf(t2), o2 = e2.size, s2 = (o2 - 1) * r2;
  return typeof n2 == "function" ? n2(a2, o2) : i2 === 1 ? a2 * r2 : s2 - a2 * r2;
}
var xr = 30;
var Sr = (e2) => !isNaN(parseFloat(e2));
var Cr = { current: void 0 };
var wr = class {
  constructor(e2, t2 = {}) {
    this.canTrackVelocity = null, this.events = {}, this.updateAndNotify = (e3) => {
      let t3 = M.now();
      if (this.updatedAt !== t3 && this.setPrevFrameValue(), this.prev = this.current, this.setCurrent(e3), this.current !== this.prev && (this.events.change?.notify(this.current), this.dependents)) for (let e4 of this.dependents) e4.dirty();
    }, this.hasAnimated = !1, this.setCurrent(e2), this.owner = t2.owner;
  }
  setCurrent(e2) {
    this.current = e2, this.updatedAt = M.now(), this.canTrackVelocity === null && e2 !== void 0 && (this.canTrackVelocity = Sr(this.current));
  }
  setPrevFrameValue(e2 = this.current) {
    this.prevFrameValue = e2, this.prevUpdatedAt = this.updatedAt;
  }
  onChange(e2) {
    return this.on("change", e2);
  }
  on(e2, t2) {
    this.events[e2] || (this.events[e2] = new oe());
    let n2 = this.events[e2].add(t2);
    return e2 === "change" ? () => {
      n2(), k.read(() => {
        this.events.change.getSize() || this.stop();
      });
    } : n2;
  }
  clearListeners() {
    for (let e2 in this.events) this.events[e2].clear();
  }
  attach(e2, t2) {
    this.passiveEffect = e2, this.stopPassiveEffect = t2;
  }
  set(e2) {
    this.passiveEffect ? this.passiveEffect(e2, this.updateAndNotify) : this.updateAndNotify(e2);
  }
  setWithVelocity(e2, t2, n2) {
    this.set(t2), this.prev = void 0, this.prevFrameValue = e2, this.prevUpdatedAt = this.updatedAt - n2;
  }
  jump(e2, t2 = !0) {
    this.updateAndNotify(e2), this.prev = e2, this.prevUpdatedAt = this.prevFrameValue = void 0, t2 && this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
  }
  dirty() {
    this.events.change?.notify(this.current);
  }
  addDependent(e2) {
    this.dependents ||= /* @__PURE__ */ new Set(), this.dependents.add(e2);
  }
  removeDependent(e2) {
    this.dependents && this.dependents.delete(e2);
  }
  get() {
    return Cr.current && Cr.current.push(this), this.current;
  }
  getPrevious() {
    return this.prev;
  }
  getVelocity() {
    let e2 = M.now();
    if (!this.canTrackVelocity || this.prevFrameValue === void 0 || e2 - this.updatedAt > xr) return 0;
    let t2 = Math.min(this.updatedAt - this.prevUpdatedAt, xr);
    return se(parseFloat(this.current) - parseFloat(this.prevFrameValue), t2);
  }
  start(e2) {
    return this.stop(), new Promise((t2) => {
      this.hasAnimated = !0, this.animation = e2(t2), this.events.animationStart && this.events.animationStart.notify();
    }).then(() => {
      this.events.animationComplete && this.events.animationComplete.notify(), this.clearAnimation();
    });
  }
  stop() {
    this.animation && (this.animation.stop(), this.events.animationCancel && this.events.animationCancel.notify()), this.clearAnimation();
  }
  isAnimating() {
    return !!this.animation;
  }
  clearAnimation() {
    delete this.animation;
  }
  destroy() {
    this.dependents?.clear(), this.events.destroy?.notify(), this.clearListeners(), this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
  }
};
function U(e2, t2) {
  return new wr(e2, t2);
}
function Tr(e2, t2) {
  if (e2?.inherit && t2) {
    let { inherit: n2, ...r2 } = e2;
    return { ...t2, ...r2 };
  }
  return e2;
}
function Er(e2, t2) {
  let n2 = e2?.[t2] ?? e2?.default ?? e2;
  return n2 === e2 ? n2 : Tr(n2, e2);
}
var Dr = { type: "spring", stiffness: 500, damping: 25, restSpeed: 10 };
var Or = (e2) => ({ type: "spring", stiffness: 550, damping: e2 === 0 ? 2 * Math.sqrt(550) : 30, restSpeed: 10 });
var kr = { type: "keyframes", duration: 0.8 };
var Ar = { type: "keyframes", ease: [0.25, 0.1, 0.35, 1], duration: 0.3 };
var jr = (e2, { keyframes: t2 }) => t2.length > 2 ? kr : Mn.has(e2) ? e2.startsWith("scale") ? Or(t2[1]) : Dr : Ar;
var Mr = /* @__PURE__ */ new Set(["when", "delay", "delayChildren", "staggerChildren", "staggerDirection", "repeat", "repeatType", "repeatDelay", "from", "elapsed"]);
function Nr(e2) {
  for (let t2 in e2) if (!Mr.has(t2)) return !0;
  return !1;
}
var Pr = (e2, t2, n2, r2 = {}, i2, a2) => (o2) => {
  let s2 = Er(r2, e2) || {}, c2 = s2.delay || r2.delay || 0, { elapsed: l2 = 0 } = r2;
  l2 -= D(c2);
  let u2 = { keyframes: Array.isArray(n2) ? n2 : [null, n2], ease: "easeOut", velocity: t2.getVelocity(), ...s2, delay: -l2, onUpdate: (e3) => {
    t2.set(e3), s2.onUpdate && s2.onUpdate(e3);
  }, onComplete: () => {
    o2(), s2.onComplete && s2.onComplete();
  }, name: e2, motionValue: t2, element: a2 ? void 0 : i2 };
  Nr(s2) || Object.assign(u2, jr(e2, u2)), u2.duration &&= D(u2.duration), u2.repeatDelay &&= D(u2.repeatDelay), u2.from !== void 0 && (u2.keyframes[0] = u2.from);
  let d2 = !1;
  if ((u2.type === !1 || u2.duration === 0 && !u2.repeatDelay) && (dr(u2), u2.delay === 0 && (d2 = !0)), (T.instantAnimations || T.skipAnimations || i2?.shouldSkipAnimations || s2.skipAnimations) && (d2 = !0, dr(u2), u2.delay = 0), u2.allowFlatten = !s2.type && !s2.ease, d2 && !a2 && t2.get() !== void 0) {
    let e3 = pn(u2.keyframes, s2);
    if (e3 !== void 0) {
      k.update(() => {
        u2.onUpdate(e3), u2.onComplete();
      });
      return;
    }
  }
  return s2.isSync ? new vn(u2) : new yr(u2);
};
var Fr = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
function Ir(e2) {
  let t2 = Fr.exec(e2);
  if (!t2) return [,];
  let [, n2, r2, i2] = t2;
  return [`--${n2 ?? r2}`, i2];
}
function Lr(e2, t2, n2 = 1) {
  `${e2}`;
  let [r2, i2] = Ir(e2);
  if (!r2) return;
  let a2 = window.getComputedStyle(t2).getPropertyValue(r2);
  if (a2) {
    let e3 = a2.trim();
    return ee(e3) ? parseFloat(e3) : e3;
  }
  return Be(i2) ? Lr(i2, t2, n2 + 1) : i2;
}
function Rr(e2) {
  let t2 = [{}, {}];
  return e2?.values.forEach((e3, n2) => {
    t2[0][n2] = e3.get(), t2[1][n2] = e3.getVelocity();
  }), t2;
}
function zr(e2, t2, n2, r2) {
  if (typeof t2 == "function") {
    let [i2, a2] = Rr(r2);
    t2 = t2(n2 === void 0 ? e2.custom : n2, i2, a2);
  }
  if (typeof t2 == "string" && (t2 = e2.variants && e2.variants[t2]), typeof t2 == "function") {
    let [i2, a2] = Rr(r2);
    t2 = t2(n2 === void 0 ? e2.custom : n2, i2, a2);
  }
  return t2;
}
function Br(e2, t2, n2) {
  let r2 = e2.getProps();
  return zr(r2, t2, n2 === void 0 ? r2.custom : n2, e2);
}
var Vr = /* @__PURE__ */ new Set(["width", "height", "top", "left", "right", "bottom", ...jn]);
var Hr = (e2) => Array.isArray(e2);
function Ur(e2, t2, n2) {
  e2.hasValue(t2) ? e2.getValue(t2).set(n2) : e2.addValue(t2, U(n2));
}
function Wr(e2) {
  return Hr(e2) ? e2[e2.length - 1] || 0 : e2;
}
function Gr(e2, t2) {
  let { transitionEnd: n2 = {}, transition: r2 = {}, ...i2 } = Br(e2, t2) || {};
  i2 = { ...i2, ...n2 };
  for (let t3 in i2) Ur(e2, t3, Wr(i2[t3]));
}
var W = (e2) => !!(e2 && e2.getVelocity);
function Kr(e2) {
  return !!(W(e2) && e2.add);
}
function qr(e2, t2) {
  let n2 = e2.getValue("willChange");
  if (Kr(n2)) return n2.add(t2);
  if (!n2 && T.WillChange) {
    let n3 = new T.WillChange("auto");
    e2.addValue("willChange", n3), n3.add(t2);
  }
}
function Jr(e2) {
  return e2.replace(/([A-Z])/g, (e3) => `-${e3.toLowerCase()}`);
}
var Yr = "data-" + Jr("framerAppearId");
function Xr(e2) {
  return e2.props[Yr];
}
var Zr = typeof window < "u";
function Qr({ protectedKeys: e2, needsAnimating: t2 }, n2) {
  let r2 = e2.hasOwnProperty(n2) && t2[n2] !== !0;
  return t2[n2] = !1, r2;
}
function $r(e2, t2, { delay: n2 = 0, transitionOverride: r2, type: i2 } = {}) {
  let { transition: a2, transitionEnd: o2, ...s2 } = t2, c2 = e2.getDefaultTransition();
  a2 = a2 ? Tr(a2, c2) : c2;
  let l2 = a2?.reduceMotion, u2 = a2?.skipAnimations;
  r2 && (a2 = r2);
  let d2 = [], f2 = i2 && e2.animationState && e2.animationState.getState()[i2], p2 = a2?.path;
  p2 && p2.animateVisualElement(e2, s2, a2, n2, d2);
  for (let t3 in s2) {
    let r3 = e2.getValue(t3, e2.latestValues[t3] ?? null), i3 = s2[t3];
    if (i3 === void 0 || f2 && Qr(f2, t3)) continue;
    let o3 = { delay: n2, ...Er(a2 || {}, t3) };
    u2 && (o3.skipAnimations = !0);
    let c3 = r3.get();
    if (c3 !== void 0 && !r3.isAnimating() && !Array.isArray(i3) && i3 === c3 && !o3.velocity) {
      k.update(() => r3.set(i3));
      continue;
    }
    let p3 = !1;
    if (Zr && window.MotionHandoffAnimation) {
      let n3 = Xr(e2);
      if (n3) {
        let e3 = window.MotionHandoffAnimation(n3, t3, k);
        e3 !== null && (o3.startTime = e3, p3 = !0);
      }
    }
    qr(e2, t3);
    let m2 = l2 ?? e2.shouldReduceMotion;
    r3.start(Pr(t3, r3, i3, m2 && Vr.has(t3) ? { type: !1 } : o3, e2, p3));
    let h2 = r3.animation;
    h2 && d2.push(h2);
  }
  if (o2) {
    let t3 = () => k.update(() => {
      o2 && Gr(e2, o2);
    });
    d2.length ? Promise.all(d2).then(t3) : t3();
  }
  return d2;
}
function ei(e2, t2, n2 = {}) {
  let r2 = Br(e2, t2, n2.type === "exit" ? e2.presenceContext?.custom : void 0), { transition: i2 = e2.getDefaultTransition() || {} } = r2 || {};
  n2.transitionOverride && (i2 = n2.transitionOverride);
  let a2 = r2 ? () => Promise.all($r(e2, r2, n2)) : () => Promise.resolve(), o2 = e2.variantChildren && e2.variantChildren.size ? (r3 = 0) => {
    let { delayChildren: a3 = 0, staggerChildren: o3, staggerDirection: s3 } = i2;
    return ti(e2, t2, r3, a3, o3, s3, n2);
  } : () => Promise.resolve(), { when: s2 } = i2;
  if (s2) {
    let [e3, t3] = s2 === "beforeChildren" ? [a2, o2] : [o2, a2];
    return e3().then(() => t3());
  }
  return Promise.all([a2(), o2(n2.delay)]);
}
function ti(e2, t2, n2 = 0, r2 = 0, i2 = 0, a2 = 1, o2) {
  let s2 = [];
  for (let c2 of e2.variantChildren) c2.notify("AnimationStart", t2), s2.push(ei(c2, t2, { ...o2, delay: n2 + (typeof r2 == "function" ? 0 : r2) + br(e2.variantChildren, c2, r2, i2, a2) }).then(() => c2.notify("AnimationComplete", t2)));
  return Promise.all(s2);
}
function ni(e2, t2, n2 = {}) {
  e2.notify("AnimationStart", t2);
  let r2;
  if (Array.isArray(t2)) {
    let i2 = t2.map((t3) => ei(e2, t3, n2));
    r2 = Promise.all(i2);
  } else if (typeof t2 == "string") r2 = ei(e2, t2, n2);
  else {
    let i2 = typeof t2 == "function" ? Br(e2, t2, n2.custom) : t2;
    r2 = Promise.all($r(e2, i2, n2));
  }
  return r2.then(() => {
    e2.notify("AnimationComplete", t2);
  });
}
var ri = { test: (e2) => e2 === "auto", parse: (e2) => e2 };
var ii = (e2) => (t2) => t2.test(e2);
var ai = [Ue, F, P, N, at, it, ri];
var oi = (e2) => ai.find(ii(e2));
function si(e2) {
  return typeof e2 == "number" ? e2 === 0 : e2 === null || e2 === "none" || e2 === "0" || ne(e2);
}
var ci = /* @__PURE__ */ new Set(["brightness", "contrast", "saturate", "opacity"]);
function li(e2) {
  let [t2, n2] = e2.slice(0, -1).split("(");
  if (t2 === "drop-shadow") return e2;
  let [r2] = n2.match(qe) || [];
  if (!r2) return e2;
  let i2 = n2.replace(r2, ""), a2 = +!!ci.has(t2);
  return r2 !== n2 && (a2 *= 100), t2 + "(" + a2 + i2 + ")";
}
var ui = /\b([a-z-]*)\(.*?\)/gu;
var di = { ...L, getAnimatableNone: (e2) => {
  let t2 = e2.match(ui);
  return t2 ? t2.map(li).join(" ") : e2;
} };
var fi = { ...L, getAnimatableNone: (e2) => {
  let t2 = L.parse(e2);
  return L.createTransformer(e2)(t2.map((e3) => typeof e3 == "number" ? 0 : typeof e3 == "object" ? { ...e3, alpha: 1 } : e3));
} };
var pi = { ...Ue, transform: Math.round };
var mi = { borderWidth: F, borderTopWidth: F, borderRightWidth: F, borderBottomWidth: F, borderLeftWidth: F, borderRadius: F, borderTopLeftRadius: F, borderTopRightRadius: F, borderBottomRightRadius: F, borderBottomLeftRadius: F, width: F, maxWidth: F, height: F, maxHeight: F, top: F, right: F, bottom: F, left: F, inset: F, insetBlock: F, insetBlockStart: F, insetBlockEnd: F, insetInline: F, insetInlineStart: F, insetInlineEnd: F, padding: F, paddingTop: F, paddingRight: F, paddingBottom: F, paddingLeft: F, paddingBlock: F, paddingBlockStart: F, paddingBlockEnd: F, paddingInline: F, paddingInlineStart: F, paddingInlineEnd: F, margin: F, marginTop: F, marginRight: F, marginBottom: F, marginLeft: F, marginBlock: F, marginBlockStart: F, marginBlockEnd: F, marginInline: F, marginInlineStart: F, marginInlineEnd: F, fontSize: F, backgroundPositionX: F, backgroundPositionY: F, rotate: N, pathRotation: N, rotateX: N, rotateY: N, rotateZ: N, scale: Ge, scaleX: Ge, scaleY: Ge, scaleZ: Ge, skew: N, skewX: N, skewY: N, distance: F, translateX: F, translateY: F, translateZ: F, x: F, y: F, z: F, perspective: F, transformPerspective: F, opacity: We, originX: ot, originY: ot, originZ: F, zIndex: pi, fillOpacity: We, strokeOpacity: We, numOctaves: pi };
var hi = { ...mi, color: I, backgroundColor: I, outlineColor: I, fill: I, stroke: I, borderColor: I, borderTopColor: I, borderRightColor: I, borderBottomColor: I, borderLeftColor: I, filter: di, WebkitFilter: di, mask: fi, WebkitMask: fi };
var gi = (e2) => hi[e2];
var _i = /* @__PURE__ */ new Set([di, fi]);
function vi(e2, t2) {
  let n2 = gi(e2);
  return _i.has(n2) || (n2 = L), n2.getAnimatableNone ? n2.getAnimatableNone(t2) : void 0;
}
var yi = /* @__PURE__ */ new Set(["auto", "none", "0"]);
function bi(e2, t2, n2) {
  let r2 = 0, i2;
  for (; r2 < e2.length && !i2; ) {
    let t3 = e2[r2];
    typeof t3 == "string" && !yi.has(t3) && gt(t3).values.length && (i2 = e2[r2]), r2++;
  }
  if (i2 && n2) for (let r3 of t2) e2[r3] = vi(n2, i2);
}
var xi = class extends Un {
  constructor(e2, t2, n2, r2, i2) {
    super(e2, t2, n2, r2, i2, !0);
  }
  readKeyframes() {
    let { unresolvedKeyframes: e2, element: t2, name: n2 } = this;
    if (!t2 || !t2.current) return;
    super.readKeyframes();
    for (let n3 = 0; n3 < e2.length; n3++) {
      let r3 = e2[n3];
      if (typeof r3 == "string" && (r3 = r3.trim(), Be(r3))) {
        let i3 = Lr(r3, t2.current);
        i3 !== void 0 && (e2[n3] = i3), n3 === e2.length - 1 && (this.finalKeyframe = r3);
      }
    }
    if (this.resolveNoneKeyframes(), !Vr.has(n2) || e2.length !== 2) return;
    let [r2, i2] = e2, a2 = oi(r2), o2 = oi(i2);
    if (He(r2) !== He(i2) && V[n2]) this.needsMeasurement = !0;
    else if (a2 !== o2)
      if (Nn(a2) && Nn(o2)) for (let t3 = 0; t3 < e2.length; t3++) {
        let n3 = e2[t3];
        typeof n3 == "string" && (e2[t3] = parseFloat(n3));
      }
      else V[n2] && (this.needsMeasurement = !0);
  }
  resolveNoneKeyframes() {
    let { unresolvedKeyframes: e2, name: t2 } = this, n2 = [];
    for (let t3 = 0; t3 < e2.length; t3++) (e2[t3] === null || si(e2[t3])) && n2.push(t3);
    n2.length && bi(e2, n2, t2);
  }
  measureInitialState() {
    let { element: e2, unresolvedKeyframes: t2, name: n2 } = this;
    if (!e2 || !e2.current) return;
    n2 === "height" && (this.suspendedScrollY = window.pageYOffset), this.measuredOrigin = V[n2](e2.measureViewportBox(), window.getComputedStyle(e2.current)), t2[0] = this.measuredOrigin;
    let r2 = t2[t2.length - 1];
    r2 !== void 0 && e2.getValue(n2, r2).jump(r2, !1);
  }
  measureEndState() {
    let { element: e2, name: t2, unresolvedKeyframes: n2 } = this;
    if (!e2 || !e2.current) return;
    let r2 = e2.getValue(t2);
    r2 && r2.jump(this.measuredOrigin, !1);
    let i2 = n2.length - 1, a2 = n2[i2];
    n2[i2] = V[t2](e2.measureViewportBox(), window.getComputedStyle(e2.current)), a2 !== null && this.finalKeyframe === void 0 && (this.finalKeyframe = a2), this.removedTransforms?.length && this.removedTransforms.forEach(([t3, n3]) => {
      e2.getValue(t3).set(n3);
    }), this.resolveNoneKeyframes();
  }
};
var Si = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"];
function Ci(e2, t2, n2) {
  if (e2 == null) return [];
  if (e2 instanceof EventTarget) return [e2];
  if (typeof e2 == "string") {
    let r2 = document;
    t2 && (r2 = t2.current);
    let i2 = n2?.[e2] ?? r2.querySelectorAll(e2);
    return i2 ? Array.from(i2) : [];
  }
  return Array.from(e2).filter((e3) => e3 != null);
}
var wi = (e2, t2) => t2 && typeof e2 == "number" ? t2.transform(e2) : e2;
function Ti(e2) {
  return te(e2) && "offsetHeight" in e2 && !("ownerSVGElement" in e2);
}
var { schedule: Ei, cancel: Di } = Ne(queueMicrotask, !1);
var Oi = { x: !1, y: !1 };
function ki() {
  return Oi.x || Oi.y;
}
function Ai(e2, t2) {
  let n2 = Ci(e2), r2 = new AbortController();
  return [n2, { passive: !0, ...t2, signal: r2.signal }, () => r2.abort()];
}
function ji(e2) {
  return !(e2.pointerType === "touch" || ki());
}
function Mi(e2, t2, n2 = {}) {
  let [r2, i2, a2] = Ai(e2, n2);
  return r2.forEach((e3) => {
    let n3 = !1, r3 = !1, a3, o2 = () => {
      e3.removeEventListener("pointerleave", u2);
    }, s2 = (e4) => {
      a3 &&= (a3(e4), void 0), o2();
    }, c2 = (e4) => {
      n3 = !1, window.removeEventListener("pointerup", c2), window.removeEventListener("pointercancel", c2), r3 && (r3 = !1, s2(e4));
    }, l2 = () => {
      n3 = !0, window.addEventListener("pointerup", c2, i2), window.addEventListener("pointercancel", c2, i2);
    }, u2 = (e4) => {
      e4.pointerType !== "touch" && (n3 ? r3 = !0 : s2(e4));
    };
    e3.addEventListener("pointerenter", (n4) => {
      if (!ji(n4)) return;
      r3 = !1;
      let o3 = t2(e3, n4);
      typeof o3 == "function" && (a3 = o3, e3.addEventListener("pointerleave", u2, i2));
    }, i2), e3.addEventListener("pointerdown", l2, i2);
  }), a2;
}
var Ni = (e2, t2) => t2 ? e2 === t2 || Ni(e2, t2.parentElement) : !1;
var Pi = (e2) => e2.pointerType === "mouse" ? typeof e2.button != "number" || e2.button <= 0 : e2.isPrimary !== !1;
var Fi = /* @__PURE__ */ new Set(["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A"]);
function Ii(e2) {
  return Fi.has(e2.tagName) || e2.isContentEditable === !0;
}
var Li = /* @__PURE__ */ new WeakSet();
function Ri(e2) {
  return (t2) => {
    t2.key === "Enter" && e2(t2);
  };
}
function zi(e2, t2) {
  e2.dispatchEvent(new PointerEvent("pointer" + t2, { isPrimary: !0, bubbles: !0 }));
}
var Bi = (e2, t2) => {
  let n2 = e2.currentTarget;
  if (!n2) return;
  let r2 = Ri(() => {
    if (Li.has(n2)) return;
    zi(n2, "down");
    let e3 = Ri(() => {
      zi(n2, "up");
    });
    n2.addEventListener("keyup", e3, t2), n2.addEventListener("blur", () => zi(n2, "cancel"), t2);
  });
  n2.addEventListener("keydown", r2, t2), n2.addEventListener("blur", () => n2.removeEventListener("keydown", r2), t2);
};
function Vi(e2) {
  return Pi(e2) && !ki();
}
var Hi = /* @__PURE__ */ new WeakSet();
function Ui(e2, t2, n2 = {}) {
  let [r2, i2, a2] = Ai(e2, n2), o2 = (e3) => {
    let r3 = e3.currentTarget;
    if (!Vi(e3) || Hi.has(e3)) return;
    Li.add(r3), n2.stopPropagation && Hi.add(e3);
    let a3 = t2(r3, e3), o3 = { ...i2, capture: !0 }, s2 = (e4, t3) => {
      window.removeEventListener("pointerup", c2, o3), window.removeEventListener("pointercancel", l2, o3), Li.has(r3) && Li.delete(r3), Vi(e4) && typeof a3 == "function" && a3(e4, { success: t3 });
    }, c2 = (e4) => {
      s2(e4, r3 === window || r3 === document || n2.useGlobalTarget || Ni(r3, e4.target));
    }, l2 = (e4) => {
      s2(e4, !1);
    };
    window.addEventListener("pointerup", c2, o3), window.addEventListener("pointercancel", l2, o3);
  };
  return r2.forEach((e3) => {
    (n2.useGlobalTarget ? window : e3).addEventListener("pointerdown", o2, i2), Ti(e3) && (e3.addEventListener("focus", (e4) => Bi(e4, i2)), !Ii(e3) && !e3.hasAttribute("tabindex") && (e3.tabIndex = 0));
  }), a2;
}
function Wi(e2) {
  return te(e2) && "ownerSVGElement" in e2;
}
var Gi = { value: null, addProjectionMetrics: null };
function Ki(e2) {
  return Wi(e2) && e2.tagName === "svg";
}
var qi = [...ai, I, L];
var Ji = (e2) => qi.find(ii(e2));
var Yi = () => ({ translate: 0, scale: 1, origin: 0, originPoint: 0 });
var Xi = () => ({ x: Yi(), y: Yi() });
var Zi = () => ({ min: 0, max: 0 });
var G = () => ({ x: Zi(), y: Zi() });
var Qi = /* @__PURE__ */ new WeakMap();
function $i(e2) {
  return typeof e2 == "object" && !!e2 && typeof e2.start == "function";
}
function ea(e2) {
  return typeof e2 == "string" || Array.isArray(e2);
}
var ta = ["initial", "animate", "whileInView", "whileFocus", "whileHover", "whileTap", "whileDrag", "exit"];
function na(e2) {
  return $i(e2.animate) || ta.some((t2) => ea(e2[t2]));
}
function ra(e2) {
  return !!(na(e2) || e2.variants);
}
function ia(e2, t2, n2) {
  for (let r2 in t2) {
    let i2 = t2[r2], a2 = n2[r2];
    if (W(i2)) e2.addValue(r2, i2);
    else if (W(a2)) e2.addValue(r2, U(i2, { owner: e2 }));
    else if (a2 !== i2)
      if (e2.hasValue(r2)) {
        let t3 = e2.getValue(r2);
        t3.liveStyle === !0 ? t3.jump(i2) : t3.hasAnimated || t3.set(i2);
      } else {
        let t3 = e2.getStaticValue(r2);
        e2.addValue(r2, U(t3 === void 0 ? i2 : t3, { owner: e2 }));
      }
  }
  for (let r2 in n2) t2[r2] === void 0 && e2.removeValue(r2);
  return t2;
}
var aa = { current: null };
var oa = { current: !1 };
var sa = typeof window < "u";
function ca() {
  if (oa.current = !0, sa)
    if (window.matchMedia) {
      let e2 = window.matchMedia("(prefers-reduced-motion)"), t2 = () => aa.current = e2.matches;
      e2.addEventListener("change", t2), t2();
    } else aa.current = !1;
}
var la = ["AnimationStart", "AnimationComplete", "Update", "BeforeLayoutMeasure", "LayoutMeasure", "LayoutAnimationStart", "LayoutAnimationComplete"];
var ua = {};
var da = class {
  scrapeMotionValuesFromProps(e2, t2, n2) {
    return {};
  }
  constructor({ parent: e2, props: t2, presenceContext: n2, reducedMotionConfig: r2, skipAnimations: i2, blockInitialAnimation: a2, visualState: o2 }, s2 = {}) {
    this.current = null, this.children = /* @__PURE__ */ new Set(), this.isVariantNode = !1, this.isControllingVariants = !1, this.shouldReduceMotion = null, this.shouldSkipAnimations = !1, this.values = /* @__PURE__ */ new Map(), this.KeyframeResolver = Un, this.features = {}, this.valueSubscriptions = /* @__PURE__ */ new Map(), this.prevMotionValues = {}, this.hasBeenMounted = !1, this.events = {}, this.propEventSubscriptions = {}, this.notifyUpdate = () => this.notify("Update", this.latestValues), this.render = () => {
      this.current && (this.triggerBuild(), this.renderInstance(this.current, this.renderState, this.props.style, this.projection));
    }, this.renderScheduledAt = 0, this.scheduleRender = () => {
      let e3 = M.now();
      this.renderScheduledAt < e3 && (this.renderScheduledAt = e3, k.render(this.render, !1, !0));
    };
    let { latestValues: c2, renderState: l2 } = o2;
    this.latestValues = c2, this.baseTarget = { ...c2 }, this.initialValues = t2.initial ? { ...c2 } : {}, this.renderState = l2, this.parent = e2, this.props = t2, this.presenceContext = n2, this.depth = e2 ? e2.depth + 1 : 0, this.reducedMotionConfig = r2, this.skipAnimationsConfig = i2, this.options = s2, this.blockInitialAnimation = !!a2, this.isControllingVariants = na(t2), this.isVariantNode = ra(t2), this.isVariantNode && (this.variantChildren = /* @__PURE__ */ new Set()), this.manuallyAnimateOnMount = !!(e2 && e2.current);
    let { willChange: u2, ...d2 } = this.scrapeMotionValuesFromProps(t2, {}, this);
    for (let e3 in d2) {
      let t3 = d2[e3];
      c2[e3] !== void 0 && W(t3) && t3.set(c2[e3]);
    }
  }
  mount(e2) {
    if (this.hasBeenMounted) for (let e3 in this.initialValues) this.values.get(e3)?.jump(this.initialValues[e3]), this.latestValues[e3] = this.initialValues[e3];
    this.current = e2, Qi.set(e2, this), this.projection && !this.projection.instance && this.projection.mount(e2), this.parent && this.isVariantNode && !this.isControllingVariants && (this.removeFromVariantTree = this.parent.addVariantChild(this)), this.values.forEach((e3, t2) => this.bindToMotionValue(t2, e3)), this.reducedMotionConfig === "never" ? this.shouldReduceMotion = !1 : this.reducedMotionConfig === "always" ? this.shouldReduceMotion = !0 : (oa.current || ca(), this.shouldReduceMotion = aa.current), this.shouldSkipAnimations = this.skipAnimationsConfig ?? !1, this.parent?.addChild(this), this.update(this.props, this.presenceContext), this.hasBeenMounted = !0;
  }
  unmount() {
    this.projection && this.projection.unmount(), A(this.notifyUpdate), A(this.render), this.valueSubscriptions.forEach((e2) => e2()), this.valueSubscriptions.clear(), this.removeFromVariantTree && this.removeFromVariantTree(), this.parent?.removeChild(this);
    for (let e2 in this.events) this.events[e2].clear();
    for (let e2 in this.features) {
      let t2 = this.features[e2];
      t2 && (t2.unmount(), t2.isMounted = !1);
    }
    this.current = null;
  }
  addChild(e2) {
    this.children.add(e2), this.enteringChildren ??= /* @__PURE__ */ new Set(), this.enteringChildren.add(e2);
  }
  removeChild(e2) {
    this.children.delete(e2), this.enteringChildren && this.enteringChildren.delete(e2);
  }
  bindToMotionValue(e2, t2) {
    if (this.valueSubscriptions.has(e2) && this.valueSubscriptions.get(e2)(), t2.accelerate && fr.has(e2) && this.current instanceof HTMLElement) {
      let { factory: n3, keyframes: r3, times: i3, ease: a2, duration: o2 } = t2.accelerate, s2 = new nr({ element: this.current, name: e2, keyframes: r3, times: i3, ease: a2, duration: D(o2) }), c2 = n3(s2);
      this.valueSubscriptions.set(e2, () => {
        c2(), s2.cancel();
      });
      return;
    }
    let n2 = Mn.has(e2);
    n2 && this.onBindTransform && this.onBindTransform();
    let r2 = t2.on("change", (t3) => {
      this.latestValues[e2] = t3, this.props.onUpdate && k.preRender(this.notifyUpdate), n2 && this.projection && (this.projection.isTransformDirty = !0), this.scheduleRender();
    }), i2;
    typeof window < "u" && window.MotionCheckAppearSync && (i2 = window.MotionCheckAppearSync(this, e2, t2)), this.valueSubscriptions.set(e2, () => {
      r2(), i2 && i2();
    });
  }
  sortNodePosition(e2) {
    return !this.current || !this.sortInstanceNodePosition || this.type !== e2.type ? 0 : this.sortInstanceNodePosition(this.current, e2.current);
  }
  updateFeatures() {
    let e2 = "animation";
    for (e2 in ua) {
      let t2 = ua[e2];
      if (!t2) continue;
      let { isEnabled: n2, Feature: r2 } = t2;
      if (!this.features[e2] && r2 && n2(this.props) && (this.features[e2] = new r2(this)), this.features[e2]) {
        let t3 = this.features[e2];
        t3.isMounted ? t3.update() : (t3.mount(), t3.isMounted = !0);
      }
    }
  }
  triggerBuild() {
    this.build(this.renderState, this.latestValues, this.props);
  }
  measureViewportBox() {
    return this.current ? this.measureInstanceViewportBox(this.current, this.props) : G();
  }
  getStaticValue(e2) {
    return this.latestValues[e2];
  }
  setStaticValue(e2, t2) {
    this.latestValues[e2] = t2;
  }
  update(e2, t2) {
    (e2.transformTemplate || this.props.transformTemplate) && this.scheduleRender(), this.prevProps = this.props, this.props = e2, this.prevPresenceContext = this.presenceContext, this.presenceContext = t2;
    for (let t3 = 0; t3 < la.length; t3++) {
      let n2 = la[t3];
      this.propEventSubscriptions[n2] && (this.propEventSubscriptions[n2](), delete this.propEventSubscriptions[n2]);
      let r2 = e2["on" + n2];
      r2 && (this.propEventSubscriptions[n2] = this.on(n2, r2));
    }
    this.prevMotionValues = ia(this, this.scrapeMotionValuesFromProps(e2, this.prevProps || {}, this), this.prevMotionValues), this.handleChildMotionValue && this.handleChildMotionValue();
  }
  getProps() {
    return this.props;
  }
  getVariant(e2) {
    return this.props.variants ? this.props.variants[e2] : void 0;
  }
  getDefaultTransition() {
    return this.props.transition;
  }
  getTransformPagePoint() {
    return this.props.transformPagePoint;
  }
  getClosestVariantNode() {
    return this.isVariantNode ? this : this.parent ? this.parent.getClosestVariantNode() : void 0;
  }
  addVariantChild(e2) {
    let t2 = this.getClosestVariantNode();
    if (t2) return t2.variantChildren && t2.variantChildren.add(e2), () => t2.variantChildren.delete(e2);
  }
  addValue(e2, t2) {
    let n2 = this.values.get(e2);
    t2 !== n2 && (n2 && this.removeValue(e2), this.bindToMotionValue(e2, t2), this.values.set(e2, t2), this.latestValues[e2] = t2.get());
  }
  removeValue(e2) {
    this.values.delete(e2);
    let t2 = this.valueSubscriptions.get(e2);
    t2 && (t2(), this.valueSubscriptions.delete(e2)), delete this.latestValues[e2], this.removeValueFromRenderState(e2, this.renderState);
  }
  hasValue(e2) {
    return this.values.has(e2);
  }
  getValue(e2, t2) {
    if (this.props.values && this.props.values[e2]) return this.props.values[e2];
    let n2 = this.values.get(e2);
    return n2 === void 0 && t2 !== void 0 && (n2 = U(t2 === null ? void 0 : t2, { owner: this }), this.addValue(e2, n2)), n2;
  }
  readValue(e2, t2) {
    let n2 = this.latestValues[e2] !== void 0 || !this.current ? this.latestValues[e2] : this.getBaseTargetFromProps(this.props, e2) ?? this.readValueFromInstance(this.current, e2, this.options);
    return n2 != null && (typeof n2 == "string" && (ee(n2) || ne(n2)) ? n2 = parseFloat(n2) : !Ji(n2) && L.test(t2) && (n2 = vi(e2, t2)), this.setBaseTarget(e2, W(n2) ? n2.get() : n2)), W(n2) ? n2.get() : n2;
  }
  setBaseTarget(e2, t2) {
    this.baseTarget[e2] = t2;
  }
  getBaseTarget(e2) {
    let { initial: t2 } = this.props, n2;
    if (typeof t2 == "string" || typeof t2 == "object") {
      let r3 = zr(this.props, t2, this.presenceContext?.custom);
      r3 && (n2 = r3[e2]);
    }
    if (t2 && n2 !== void 0) return n2;
    let r2 = this.getBaseTargetFromProps(this.props, e2);
    return r2 !== void 0 && !W(r2) ? r2 : this.initialValues[e2] !== void 0 && n2 === void 0 ? void 0 : this.baseTarget[e2];
  }
  on(e2, t2) {
    return this.events[e2] || (this.events[e2] = new oe()), this.events[e2].add(t2);
  }
  notify(e2, ...t2) {
    this.events[e2] && this.events[e2].notify(...t2);
  }
  scheduleRenderMicrotask() {
    Ei.render(this.render);
  }
};
var fa = class extends da {
  constructor() {
    super(...arguments), this.KeyframeResolver = xi;
  }
  sortInstanceNodePosition(e2, t2) {
    return e2.compareDocumentPosition(t2) & 2 ? 1 : -1;
  }
  getBaseTargetFromProps(e2, t2) {
    let n2 = e2.style;
    return n2 ? n2[t2] : void 0;
  }
  removeValueFromRenderState(e2, { vars: t2, style: n2 }) {
    delete t2[e2], delete n2[e2];
  }
  handleChildMotionValue() {
    this.childSubscription && (this.childSubscription(), delete this.childSubscription);
    let { children: e2 } = this.props;
    W(e2) && (this.childSubscription = e2.on("change", (e3) => {
      this.current && (this.current.textContent = `${e3}`);
    }));
  }
};
function pa({ top: e2, left: t2, right: n2, bottom: r2 }) {
  return { x: { min: t2, max: n2 }, y: { min: e2, max: r2 } };
}
function ma({ x: e2, y: t2 }) {
  return { top: t2.min, right: e2.max, bottom: t2.max, left: e2.min };
}
function ha(e2, t2) {
  if (!t2) return e2;
  let n2 = t2({ x: e2.left, y: e2.top }), r2 = t2({ x: e2.right, y: e2.bottom });
  return { top: n2.y, left: n2.x, bottom: r2.y, right: r2.x };
}
function ga(e2) {
  return e2 === void 0 || e2 === 1;
}
function _a({ scale: e2, scaleX: t2, scaleY: n2 }) {
  return !ga(e2) || !ga(t2) || !ga(n2);
}
function K(e2) {
  return _a(e2) || va(e2) || e2.z || e2.rotate || e2.rotateX || e2.rotateY || e2.skewX || e2.skewY;
}
function va(e2) {
  return ya(e2.x) || ya(e2.y);
}
function ya(e2) {
  return e2 && e2 !== "0%";
}
function ba(e2, t2, n2) {
  return n2 + t2 * (e2 - n2);
}
function xa(e2, t2, n2, r2, i2) {
  return i2 !== void 0 && (e2 = ba(e2, i2, r2)), ba(e2, n2, r2) + t2;
}
function Sa(e2, t2 = 0, n2 = 1, r2, i2) {
  e2.min = xa(e2.min, t2, n2, r2, i2), e2.max = xa(e2.max, t2, n2, r2, i2);
}
function Ca(e2, { x: t2, y: n2 }) {
  Sa(e2.x, t2.translate, t2.scale, t2.originPoint), Sa(e2.y, n2.translate, n2.scale, n2.originPoint);
}
var wa = 0.999999999999;
var Ta = 1.0000000000001;
function Ea(e2, t2, n2, r2 = !1) {
  let i2 = n2.length;
  if (!i2) return;
  t2.x = t2.y = 1;
  let a2, o2;
  for (let s2 = 0; s2 < i2; s2++) {
    a2 = n2[s2], o2 = a2.projectionDelta;
    let { visualElement: i3 } = a2.options;
    i3 && i3.props.style && i3.props.style.display === "contents" || (r2 && a2.options.layoutScroll && a2.scroll && a2 !== a2.root && (q(e2.x, -a2.scroll.offset.x), q(e2.y, -a2.scroll.offset.y)), o2 && (t2.x *= o2.x.scale, t2.y *= o2.y.scale, Ca(e2, o2)), r2 && K(a2.latestValues) && ka(e2, a2.latestValues, a2.layout?.layoutBox));
  }
  t2.x < Ta && t2.x > wa && (t2.x = 1), t2.y < Ta && t2.y > wa && (t2.y = 1);
}
function q(e2, t2) {
  e2.min += t2, e2.max += t2;
}
function Da(e2, t2, n2, r2, i2 = 0.5) {
  Sa(e2, t2, n2, R(e2.min, e2.max, i2), r2);
}
function Oa(e2, t2) {
  return typeof e2 == "string" ? parseFloat(e2) / 100 * (t2.max - t2.min) : e2;
}
function ka(e2, t2, n2) {
  let r2 = n2 ?? e2;
  Da(e2.x, Oa(t2.x, r2.x), t2.scaleX, t2.scale, t2.originX), Da(e2.y, Oa(t2.y, r2.y), t2.scaleY, t2.scale, t2.originY);
}
function Aa(e2, t2) {
  return pa(ha(e2.getBoundingClientRect(), t2));
}
function ja(e2, t2, n2) {
  let r2 = Aa(e2, n2), { scroll: i2 } = t2;
  return i2 && (q(r2.x, i2.offset.x), q(r2.y, i2.offset.y)), r2;
}
var Ma = { x: "translateX", y: "translateY", z: "translateZ", transformPerspective: "perspective" };
var Na = jn.length;
function Pa(e2, t2, n2) {
  let r2 = "", i2 = !0;
  for (let a3 = 0; a3 < Na; a3++) {
    let o2 = jn[a3], s2 = e2[o2];
    if (s2 === void 0) continue;
    let c2 = !0;
    if (typeof s2 == "number") c2 = s2 === +!!o2.startsWith("scale");
    else {
      let e3 = parseFloat(s2);
      c2 = o2.startsWith("scale") ? e3 === 1 : e3 === 0;
    }
    if (!c2 || n2) {
      let e3 = wi(s2, mi[o2]);
      if (!c2) {
        i2 = !1;
        let t3 = Ma[o2] || o2;
        r2 += `${t3}(${e3}) `;
      }
      n2 && (t2[o2] = e3);
    }
  }
  let a2 = e2.pathRotation;
  return a2 && (i2 = !1, r2 += `rotate(${wi(a2, mi.pathRotation)}) `), r2 = r2.trim(), n2 ? r2 = n2(t2, i2 ? "" : r2) : i2 && (r2 = "none"), r2;
}
function Fa(e2, t2, n2) {
  let { style: r2, vars: i2, transformOrigin: a2 } = e2, o2 = !1, s2 = !1;
  for (let e3 in t2) {
    let n3 = t2[e3];
    if (Mn.has(e3)) o2 = !0;
    else if (Re(e3)) i2[e3] = n3;
    else {
      let t3 = wi(n3, mi[e3]);
      e3.startsWith("origin") ? (s2 = !0, a2[e3] = t3) : r2[e3] = t3;
    }
  }
  if (t2.transform || (o2 || n2 ? r2.transform = Pa(t2, e2.transform, n2) : r2.transform &&= "none"), s2) {
    let { originX: e3 = "50%", originY: t3 = "50%", originZ: n3 = 0 } = a2;
    r2.transformOrigin = `${e3} ${t3} ${n3}`;
  }
}
function Ia(e2, { style: t2, vars: n2 }, r2, i2) {
  let a2 = e2.style, o2;
  for (o2 in t2) a2[o2] = t2[o2];
  for (o2 in i2?.applyProjectionStyles(a2, r2), n2) a2.setProperty(o2, n2[o2]);
}
function La(e2, t2) {
  return t2.max === t2.min ? 0 : e2 / (t2.max - t2.min) * 100;
}
var J = { correct: (e2, t2) => {
  if (!t2.target) return e2;
  if (typeof e2 == "string")
    if (F.test(e2)) e2 = parseFloat(e2);
    else return e2;
  return `${La(e2, t2.target.x)}% ${La(e2, t2.target.y)}%`;
} };
var Ra = { correct: (e2, { treeScale: t2, projectionDelta: n2 }) => {
  let r2 = e2, i2 = L.parse(e2);
  if (i2.length > 5) return r2;
  let a2 = L.createTransformer(e2), o2 = typeof i2[0] == "number" ? 0 : 1, s2 = n2.x.scale * t2.x, c2 = n2.y.scale * t2.y;
  i2[0 + o2] /= s2, i2[1 + o2] /= c2;
  let l2 = R(s2, c2, 0.5);
  return typeof i2[2 + o2] == "number" && (i2[2 + o2] /= l2), typeof i2[3 + o2] == "number" && (i2[3 + o2] /= l2), a2(i2);
} };
var za = { borderRadius: { ...J, applyTo: [...Si] }, borderTopLeftRadius: J, borderTopRightRadius: J, borderBottomLeftRadius: J, borderBottomRightRadius: J, boxShadow: Ra };
function Ba(e2) {
  for (let t2 in e2) za[t2] = e2[t2], Re(t2) && (za[t2].isCSSVariable = !0);
}
function Va(e2, { layout: t2, layoutId: n2 }) {
  return Mn.has(e2) || e2.startsWith("origin") || (t2 || n2 !== void 0) && (!!za[e2] || e2 === "opacity");
}
function Ha(e2, t2, n2) {
  let r2 = e2.style, i2 = t2?.style, a2 = {};
  if (!r2) return a2;
  for (let t3 in r2) (W(r2[t3]) || i2 && W(i2[t3]) || Va(t3, e2) || n2?.getValue(t3)?.liveStyle !== void 0) && (a2[t3] = r2[t3]);
  return a2;
}
function Ua(e2) {
  return window.getComputedStyle(e2);
}
var Wa = class extends fa {
  constructor() {
    super(...arguments), this.type = "html", this.renderInstance = Ia;
  }
  mount(e2) {
    e2.style, super.mount(e2);
  }
  readValueFromInstance(e2, t2) {
    if (Mn.has(t2)) return this.projection?.isProjecting ? Dn(t2) : kn(e2, t2);
    {
      let n2 = Ua(e2), r2 = (Re(t2) ? n2.getPropertyValue(t2) : n2[t2]) || 0;
      return typeof r2 == "string" ? r2.trim() : r2;
    }
  }
  measureInstanceViewportBox(e2, { transformPagePoint: t2 }) {
    return Aa(e2, t2);
  }
  build(e2, t2, n2) {
    Fa(e2, t2, n2.transformTemplate);
  }
  scrapeMotionValuesFromProps(e2, t2, n2) {
    return Ha(e2, t2, n2);
  }
};
var Ga = { offset: "stroke-dashoffset", array: "stroke-dasharray" };
var Ka = { offset: "strokeDashoffset", array: "strokeDasharray" };
function qa(e2, t2, n2 = 1, r2 = 0, i2 = !0) {
  e2.pathLength = 1;
  let a2 = i2 ? Ga : Ka;
  e2[a2.offset] = `${-r2}`, e2[a2.array] = `${t2} ${n2}`;
}
var Ja = ["transform", "opacity", "offsetDistance", "offsetPath", "offsetRotate", "offsetAnchor"];
function Ya(e2, { attrX: t2, attrY: n2, attrScale: r2, pathLength: i2, pathSpacing: a2 = 1, pathOffset: o2 = 0, ...s2 }, c2, l2, u2) {
  if (Fa(e2, s2, l2), c2) {
    e2.style.viewBox && (e2.attrs.viewBox = e2.style.viewBox);
    return;
  }
  e2.attrs = e2.style, e2.style = {};
  let { attrs: d2, style: f2 } = e2;
  for (let e3 of Ja) d2[e3] !== void 0 && (f2[e3] = d2[e3], delete d2[e3]);
  (f2.transform || d2.transformOrigin) && (f2.transformOrigin = d2.transformOrigin ?? "50% 50%", delete d2.transformOrigin), f2.transform && (f2.transformBox = u2?.transformBox ?? "fill-box", delete d2.transformBox), t2 !== void 0 && (d2.x = t2), n2 !== void 0 && (d2.y = n2), r2 !== void 0 && (d2.scale = r2), i2 !== void 0 && qa(d2, i2, a2, o2, !1);
}
var Xa = /* @__PURE__ */ new Set(["baseFrequency", "diffuseConstant", "kernelMatrix", "kernelUnitLength", "keySplines", "keyTimes", "limitingConeAngle", "markerHeight", "markerWidth", "numOctaves", "targetX", "targetY", "surfaceScale", "specularConstant", "specularExponent", "stdDeviation", "tableValues", "viewBox", "gradientTransform", "pathLength", "startOffset", "textLength", "lengthAdjust"]);
var Za = (e2) => typeof e2 == "string" && e2.toLowerCase() === "svg";
function Qa(e2, t2, n2, r2) {
  Ia(e2, t2, void 0, r2);
  for (let n3 in t2.attrs) e2.setAttribute(Xa.has(n3) ? n3 : Jr(n3), t2.attrs[n3]);
}
function $a(e2, t2, n2) {
  let r2 = Ha(e2, t2, n2);
  for (let n3 in e2) if (W(e2[n3]) || W(t2[n3])) {
    let t3 = jn.indexOf(n3) === -1 ? n3 : "attr" + n3.charAt(0).toUpperCase() + n3.substring(1);
    r2[t3] = e2[n3];
  }
  return r2;
}
var eo = class extends fa {
  constructor() {
    super(...arguments), this.type = "svg", this.isSVGTag = !1, this.measureInstanceViewportBox = G;
  }
  getBaseTargetFromProps(e2, t2) {
    return e2[t2];
  }
  readValueFromInstance(e2, t2) {
    if (Mn.has(t2)) {
      let e3 = gi(t2);
      return e3 && e3.default || 0;
    }
    if (Ja.includes(t2)) {
      let n2 = getComputedStyle(e2)[t2];
      if (typeof n2 == "string" && n2) return n2.trim();
    }
    return t2 = Xa.has(t2) ? t2 : Jr(t2), e2.getAttribute(t2);
  }
  scrapeMotionValuesFromProps(e2, t2, n2) {
    return $a(e2, t2, n2);
  }
  build(e2, t2, n2) {
    Ya(e2, t2, this.isSVGTag, n2.transformTemplate, n2.style);
  }
  renderInstance(e2, t2, n2, r2) {
    Qa(e2, t2, n2, r2);
  }
  mount(e2) {
    this.isSVGTag = Za(e2.tagName), super.mount(e2);
  }
};
function to(e2, t2) {
  e2.min = t2.min, e2.max = t2.max;
}
function Y(e2, t2) {
  to(e2.x, t2.x), to(e2.y, t2.y);
}
function no(e2, t2) {
  e2.translate = t2.translate, e2.scale = t2.scale, e2.originPoint = t2.originPoint, e2.origin = t2.origin;
}
var ro = 0.9999;
var io = 1.0001;
var ao = -0.01;
var oo = 0.01;
function X(e2) {
  return e2.max - e2.min;
}
function so(e2, t2, n2) {
  return Math.abs(e2 - t2) <= n2;
}
function co(e2, t2, n2, r2 = 0.5) {
  e2.origin = r2, e2.originPoint = R(t2.min, t2.max, e2.origin), e2.scale = X(n2) / X(t2), e2.translate = R(n2.min, n2.max, e2.origin) - e2.originPoint, (e2.scale >= ro && e2.scale <= io || isNaN(e2.scale)) && (e2.scale = 1), (e2.translate >= ao && e2.translate <= oo || isNaN(e2.translate)) && (e2.translate = 0);
}
function lo(e2, t2, n2, r2) {
  co(e2.x, t2.x, n2.x, r2 ? r2.originX : void 0), co(e2.y, t2.y, n2.y, r2 ? r2.originY : void 0);
}
function uo(e2, t2, n2, r2 = 0) {
  e2.min = (r2 ? R(n2.min, n2.max, r2) : n2.min) + t2.min, e2.max = e2.min + X(t2);
}
function fo(e2, t2, n2, r2) {
  uo(e2.x, t2.x, n2.x, r2?.x), uo(e2.y, t2.y, n2.y, r2?.y);
}
function po(e2, t2, n2, r2 = 0) {
  let i2 = r2 ? R(n2.min, n2.max, r2) : n2.min;
  e2.min = t2.min - i2, e2.max = e2.min + X(t2);
}
function mo(e2, t2, n2, r2) {
  po(e2.x, t2.x, n2.x, r2?.x), po(e2.y, t2.y, n2.y, r2?.y);
}
function ho(e2, t2, n2, r2, i2) {
  return e2 -= t2, e2 = ba(e2, 1 / n2, r2), i2 !== void 0 && (e2 = ba(e2, 1 / i2, r2)), e2;
}
function go(e2, t2 = 0, n2 = 1, r2 = 0.5, i2, a2 = e2, o2 = e2) {
  if (P.test(t2) && (t2 = parseFloat(t2), t2 = R(o2.min, o2.max, t2 / 100) - o2.min), typeof t2 != "number") return;
  let s2 = R(a2.min, a2.max, r2);
  e2 === a2 && (s2 -= t2), e2.min = ho(e2.min, t2, n2, s2, i2), e2.max = ho(e2.max, t2, n2, s2, i2);
}
function _o(e2, t2, [n2, r2, i2], a2, o2) {
  go(e2, t2[n2], t2[r2], t2[i2], t2.scale, a2, o2);
}
var vo = ["x", "scaleX", "originX"];
var yo = ["y", "scaleY", "originY"];
function bo(e2, t2, n2, r2) {
  _o(e2.x, t2, vo, n2 ? n2.x : void 0, r2 ? r2.x : void 0), _o(e2.y, t2, yo, n2 ? n2.y : void 0, r2 ? r2.y : void 0);
}
function xo(e2) {
  return e2.translate === 0 && e2.scale === 1;
}
function So(e2) {
  return xo(e2.x) && xo(e2.y);
}
function Co(e2, t2) {
  return e2.min === t2.min && e2.max === t2.max;
}
function wo(e2, t2) {
  return Co(e2.x, t2.x) && Co(e2.y, t2.y);
}
function To(e2, t2) {
  return Math.round(e2.min) === Math.round(t2.min) && Math.round(e2.max) === Math.round(t2.max);
}
function Eo(e2, t2) {
  return To(e2.x, t2.x) && To(e2.y, t2.y);
}
function Do(e2) {
  return X(e2.x) / X(e2.y);
}
function Oo(e2, t2) {
  return e2.translate === t2.translate && e2.scale === t2.scale && e2.originPoint === t2.originPoint;
}
function Z(e2) {
  return [e2("x"), e2("y")];
}
function ko(e2, t2, n2) {
  let r2 = "", i2 = e2.x.translate / t2.x, a2 = e2.y.translate / t2.y, o2 = n2?.z || 0;
  if ((i2 || a2 || o2) && (r2 = `translate3d(${i2}px, ${a2}px, ${o2}px) `), (t2.x !== 1 || t2.y !== 1) && (r2 += `scale(${1 / t2.x}, ${1 / t2.y}) `), n2) {
    let { transformPerspective: e3, rotate: t3, pathRotation: i3, rotateX: a3, rotateY: o3, skewX: s3, skewY: c3 } = n2;
    e3 && (r2 = `perspective(${e3}px) ${r2}`), t3 && (r2 += `rotate(${t3}deg) `), i3 && (r2 += `rotate(${i3}deg) `), a3 && (r2 += `rotateX(${a3}deg) `), o3 && (r2 += `rotateY(${o3}deg) `), s3 && (r2 += `skewX(${s3}deg) `), c3 && (r2 += `skewY(${c3}deg) `);
  }
  let s2 = e2.x.scale * t2.x, c2 = e2.y.scale * t2.y;
  return (s2 !== 1 || c2 !== 1) && (r2 += `scale(${s2}, ${c2})`), r2 || "none";
}
var Ao = Si.length;
var jo = (e2) => typeof e2 == "string" ? parseFloat(e2) : e2;
var Mo = (e2) => typeof e2 == "number" || F.test(e2);
function No(e2, t2, n2, r2, i2, a2) {
  i2 ? (e2.opacity = R(0, n2.opacity ?? 1, Fo(r2)), e2.opacityExit = R(t2.opacity ?? 1, 0, Io(r2))) : a2 && (e2.opacity = R(t2.opacity ?? 1, n2.opacity ?? 1, r2));
  for (let i3 = 0; i3 < Ao; i3++) {
    let a3 = Si[i3], o2 = Po(t2, a3), s2 = Po(n2, a3);
    (o2 !== void 0 || s2 !== void 0) && (o2 ||= 0, s2 ||= 0, o2 === 0 || s2 === 0 || Mo(o2) === Mo(s2) ? (e2[a3] = Math.max(R(jo(o2), jo(s2), r2), 0), (P.test(s2) || P.test(o2)) && (e2[a3] += "%")) : e2[a3] = s2);
  }
  (t2.rotate || n2.rotate) && (e2.rotate = R(t2.rotate || 0, n2.rotate || 0, r2));
}
function Po(e2, t2) {
  return e2[t2] === void 0 ? e2.borderRadius : e2[t2];
}
var Fo = Lo(0, 0.5, be);
var Io = Lo(0.5, 0.95, E);
function Lo(e2, t2, n2) {
  return (r2) => r2 < e2 ? 0 : r2 > t2 ? 1 : n2(ae(e2, t2, r2));
}
function Ro(e2, t2, n2) {
  let r2 = W(e2) ? e2 : U(e2);
  return r2.start(Pr("", r2, t2, n2)), r2.animation;
}
function zo(e2, t2, n2, r2 = { passive: !0 }) {
  return e2.addEventListener(t2, n2, r2), () => e2.removeEventListener(t2, n2, r2);
}
var Bo = (e2, t2) => e2.depth - t2.depth;
var Vo = class {
  constructor() {
    this.children = [], this.isDirty = !1;
  }
  add(e2) {
    S(this.children, e2), this.isDirty = !0;
  }
  remove(e2) {
    C(this.children, e2), this.isDirty = !0;
  }
  forEach(e2) {
    this.isDirty && this.children.sort(Bo), this.isDirty = !1, this.children.forEach(e2);
  }
};
function Ho(e2, t2) {
  let n2 = M.now(), r2 = ({ timestamp: i2 }) => {
    let a2 = i2 - n2;
    a2 >= t2 && (A(r2), e2(a2 - t2));
  };
  return k.setup(r2, !0), () => A(r2);
}
function Uo(e2) {
  return W(e2) ? e2.get() : e2;
}
var Wo = class {
  constructor() {
    this.members = [];
  }
  add(e2) {
    S(this.members, e2);
    for (let t2 = this.members.length - 1; t2 >= 0; t2--) {
      let n2 = this.members[t2];
      if (n2 === e2 || n2 === this.lead || n2 === this.prevLead) continue;
      let r2 = n2.instance;
      r2 && r2.isConnected !== !1 || n2.snapshot || (C(this.members, n2), n2.unmount());
    }
    e2.scheduleRender();
  }
  remove(e2) {
    if (C(this.members, e2), e2 === this.prevLead && (this.prevLead = void 0), e2 === this.lead) {
      let e3 = this.members[this.members.length - 1];
      e3 && this.promote(e3);
    }
  }
  relegate(e2) {
    for (let t2 = this.members.indexOf(e2) - 1; t2 >= 0; t2--) {
      let e3 = this.members[t2];
      if (e3.isPresent !== !1 && e3.instance?.isConnected !== !1) return this.promote(e3), !0;
    }
    return !1;
  }
  promote(e2, t2) {
    let n2 = this.lead;
    if (e2 !== n2 && (this.prevLead = n2, this.lead = e2, e2.show(), n2)) {
      n2.updateSnapshot(), e2.scheduleRender();
      let { layoutDependency: r2 } = n2.options, { layoutDependency: i2 } = e2.options;
      (r2 === void 0 || r2 !== i2) && (e2.resumeFrom = n2, t2 && (n2.preserveOpacity = !0), n2.snapshot && (e2.snapshot = n2.snapshot, e2.snapshot.latestValues = n2.animationValues || n2.latestValues), e2.root?.isUpdating && (e2.isLayoutDirty = !0)), e2.options.crossfade === !1 && n2.hide();
    }
  }
  exitAnimationComplete() {
    this.members.forEach((e2) => {
      e2.options.onExitComplete?.(), e2.resumingFrom?.options.onExitComplete?.();
    });
  }
  scheduleRender() {
    this.members.forEach((e2) => e2.instance && e2.scheduleRender(!1));
  }
  removeLeadSnapshot() {
    this.lead?.snapshot && (this.lead.snapshot = void 0);
  }
};
var Go = { hasAnimatedSinceResize: !0, hasEverUpdated: !1 };
var Ko = { nodes: 0, calculatedTargetDeltas: 0, calculatedProjections: 0 };
var qo = ["", "X", "Y", "Z"];
var Jo = 1e3;
var Yo = 0;
function Xo(e2, t2, n2, r2) {
  let { latestValues: i2 } = t2;
  i2[e2] && (n2[e2] = i2[e2], t2.setStaticValue(e2, 0), r2 && (r2[e2] = 0));
}
function Zo(e2) {
  if (e2.hasCheckedOptimisedAppear = !0, e2.root === e2) return;
  let { visualElement: t2 } = e2.options;
  if (!t2) return;
  let n2 = Xr(t2);
  if (window.MotionHasOptimisedAnimation(n2, "transform")) {
    let { layout: t3, layoutId: r3 } = e2.options;
    window.MotionCancelOptimisedAnimation(n2, "transform", k, !(t3 || r3));
  }
  let { parent: r2 } = e2;
  r2 && !r2.hasCheckedOptimisedAppear && Zo(r2);
}
function Qo({ attachResizeListener: e2, defaultParent: t2, measureScroll: n2, checkIsScrollRoot: r2, resetTransform: i2 }) {
  return class {
    constructor(e3 = {}, n3 = t2?.()) {
      this.id = Yo++, this.animationId = 0, this.animationCommitId = 0, this.children = /* @__PURE__ */ new Set(), this.options = {}, this.isTreeAnimating = !1, this.isAnimationBlocked = !1, this.isLayoutDirty = !1, this.isProjectionDirty = !1, this.isSharedProjectionDirty = !1, this.isTransformDirty = !1, this.updateManuallyBlocked = !1, this.updateBlockedByResize = !1, this.isUpdating = !1, this.isSVG = !1, this.needsReset = !1, this.shouldResetTransform = !1, this.hasCheckedOptimisedAppear = !1, this.treeScale = { x: 1, y: 1 }, this.eventHandlers = /* @__PURE__ */ new Map(), this.hasTreeAnimated = !1, this.layoutVersion = 0, this.updateScheduled = !1, this.scheduleUpdate = () => this.update(), this.projectionUpdateScheduled = !1, this.checkUpdateFailed = () => {
        this.isUpdating && (this.isUpdating = !1, this.clearAllSnapshots());
      }, this.updateProjection = () => {
        this.projectionUpdateScheduled = !1, Gi.value && (Ko.nodes = Ko.calculatedTargetDeltas = Ko.calculatedProjections = 0), this.nodes.forEach(ts), this.nodes.forEach(us), this.nodes.forEach(ds), this.nodes.forEach(ns), Gi.addProjectionMetrics && Gi.addProjectionMetrics(Ko);
      }, this.resolvedRelativeTargetAt = 0, this.linkedParentVersion = 0, this.hasProjected = !1, this.isVisible = !0, this.animationProgress = 0, this.sharedNodes = /* @__PURE__ */ new Map(), this.latestValues = e3, this.root = n3 ? n3.root || n3 : this, this.path = n3 ? [...n3.path, n3] : [], this.parent = n3, this.depth = n3 ? n3.depth + 1 : 0;
      for (let e4 = 0; e4 < this.path.length; e4++) this.path[e4].shouldResetTransform = !0;
      this.root === this && (this.nodes = new Vo());
    }
    addEventListener(e3, t3) {
      return this.eventHandlers.has(e3) || this.eventHandlers.set(e3, new oe()), this.eventHandlers.get(e3).add(t3);
    }
    notifyListeners(e3, ...t3) {
      let n3 = this.eventHandlers.get(e3);
      n3 && n3.notify(...t3);
    }
    hasListeners(e3) {
      return this.eventHandlers.has(e3);
    }
    mount(t3) {
      if (this.instance) return;
      this.isSVG = Wi(t3) && !Ki(t3), this.instance = t3;
      let { layoutId: n3, layout: r3, visualElement: i3 } = this.options;
      if (i3 && !i3.current && i3.mount(t3), this.root.nodes.add(this), this.parent && this.parent.children.add(this), this.root.hasTreeAnimated && (r3 || n3) && (this.isLayoutDirty = !0), e2) {
        let n4, r4 = 0, i4 = () => this.root.updateBlockedByResize = !1;
        k.read(() => {
          r4 = window.innerWidth;
        }), e2(t3, () => {
          let e3 = window.innerWidth;
          e3 !== r4 && (r4 = e3, this.root.updateBlockedByResize = !0, n4 && n4(), n4 = Ho(i4, 250), Go.hasAnimatedSinceResize && (Go.hasAnimatedSinceResize = !1, this.nodes.forEach(ls)));
        });
      }
      n3 && this.root.registerSharedNode(n3, this), this.options.animate !== !1 && i3 && (n3 || r3) && this.addEventListener("didUpdate", ({ delta: e3, hasLayoutChanged: t4, hasRelativeLayoutChanged: n4, layout: r4 }) => {
        if (this.isTreeAnimationBlocked()) {
          this.target = void 0, this.relativeTarget = void 0;
          return;
        }
        let a2 = this.options.transition || i3.getDefaultTransition() || vs, { onLayoutAnimationStart: o2, onLayoutAnimationComplete: s2 } = i3.getProps(), c2 = !this.targetLayout || !Eo(this.targetLayout, r4), l2 = !t4 && n4;
        if (this.options.layoutRoot || this.resumeFrom || l2 || t4 && (c2 || !this.currentAnimation)) {
          this.resumeFrom && (this.resumingFrom = this.resumeFrom, this.resumingFrom.resumingFrom = void 0);
          let t5 = { ...Er(a2, "layout"), onPlay: o2, onComplete: s2 };
          (i3.shouldReduceMotion || this.options.layoutRoot) && (t5.delay = 0, t5.type = !1), this.startAnimation(t5), this.setAnimationOrigin(e3, l2, t5.path);
        } else t4 || ls(this), this.isLead() && this.options.onExitComplete && this.options.onExitComplete();
        this.targetLayout = r4;
      });
    }
    unmount() {
      this.options.layoutId && this.willUpdate(), this.root.nodes.remove(this);
      let e3 = this.getStack();
      e3 && e3.remove(this), this.parent && this.parent.children.delete(this), this.instance = void 0, this.eventHandlers.clear(), A(this.updateProjection);
    }
    blockUpdate() {
      this.updateManuallyBlocked = !0;
    }
    unblockUpdate() {
      this.updateManuallyBlocked = !1;
    }
    isUpdateBlocked() {
      return this.updateManuallyBlocked || this.updateBlockedByResize;
    }
    isTreeAnimationBlocked() {
      return this.isAnimationBlocked || this.parent && this.parent.isTreeAnimationBlocked() || !1;
    }
    startUpdate() {
      this.isUpdateBlocked() || (this.isUpdating = !0, this.nodes && this.nodes.forEach(fs), this.animationId++);
    }
    getTransformTemplate() {
      let { visualElement: e3 } = this.options;
      return e3 && e3.getProps().transformTemplate;
    }
    willUpdate(e3 = !0) {
      if (this.root.hasTreeAnimated = !0, this.root.isUpdateBlocked()) {
        this.options.onExitComplete && this.options.onExitComplete();
        return;
      }
      if (window.MotionCancelOptimisedAnimation && !this.hasCheckedOptimisedAppear && Zo(this), !this.root.isUpdating && this.root.startUpdate(), this.isLayoutDirty) return;
      this.isLayoutDirty = !0;
      for (let e4 = 0; e4 < this.path.length; e4++) {
        let t4 = this.path[e4];
        t4.shouldResetTransform = !0, (typeof t4.latestValues.x == "string" || typeof t4.latestValues.y == "string") && (t4.isLayoutDirty = !0), t4.updateScroll("snapshot"), t4.options.layoutRoot && t4.willUpdate(!1);
      }
      let { layoutId: t3, layout: n3 } = this.options;
      if (t3 === void 0 && !n3) return;
      let r3 = this.getTransformTemplate();
      this.prevTransformTemplateValue = r3 ? r3(this.latestValues, "") : void 0, this.updateSnapshot(), e3 && this.notifyListeners("willUpdate");
    }
    update() {
      if (this.updateScheduled = !1, this.isUpdateBlocked()) {
        let e4 = this.updateBlockedByResize;
        this.unblockUpdate(), this.updateBlockedByResize = !1, this.clearAllSnapshots(), e4 && this.nodes.forEach(as), this.nodes.forEach(is);
        return;
      }
      if (this.animationId <= this.animationCommitId) {
        this.nodes.forEach(os);
        return;
      }
      this.animationCommitId = this.animationId, this.isUpdating ? (this.isUpdating = !1, this.nodes.forEach(ss), this.nodes.forEach(cs), this.nodes.forEach($o), this.nodes.forEach(es)) : this.nodes.forEach(os), this.clearAllSnapshots();
      let e3 = M.now();
      j.delta = w(0, 1e3 / 60, e3 - j.timestamp), j.timestamp = e3, j.isProcessing = !0, Pe.update.process(j), Pe.preRender.process(j), Pe.render.process(j), j.isProcessing = !1;
    }
    didUpdate() {
      this.updateScheduled || (this.updateScheduled = !0, Ei.read(this.scheduleUpdate));
    }
    clearAllSnapshots() {
      this.nodes.forEach(rs), this.sharedNodes.forEach(ps);
    }
    scheduleUpdateProjection() {
      this.projectionUpdateScheduled || (this.projectionUpdateScheduled = !0, k.preRender(this.updateProjection, !1, !0));
    }
    scheduleCheckAfterUnmount() {
      k.postRender(() => {
        this.isLayoutDirty ? this.root.didUpdate() : this.root.checkUpdateFailed();
      });
    }
    updateSnapshot() {
      !this.snapshot && this.instance && (this.snapshot = this.measure(), this.snapshot && !X(this.snapshot.measuredBox.x) && !X(this.snapshot.measuredBox.y) && (this.snapshot = void 0));
    }
    updateLayout() {
      if (!this.instance || (this.updateScroll(), !(this.options.alwaysMeasureLayout && this.isLead()) && !this.isLayoutDirty)) return;
      if (this.resumeFrom && !this.resumeFrom.instance) for (let e4 = 0; e4 < this.path.length; e4++) this.path[e4].updateScroll();
      let e3 = this.layout;
      this.layout = this.measure(!1), this.layoutVersion++, this.layoutCorrected ||= G(), this.isLayoutDirty = !1, this.projectionDelta = void 0, this.notifyListeners("measure", this.layout.layoutBox);
      let { visualElement: t3 } = this.options;
      t3 && t3.notify("LayoutMeasure", this.layout.layoutBox, e3 ? e3.layoutBox : void 0);
    }
    updateScroll(e3 = "measure") {
      let t3 = !!(this.options.layoutScroll && this.instance);
      if (this.scroll && this.scroll.animationId === this.root.animationId && this.scroll.phase === e3 && (t3 = !1), t3 && this.instance) {
        let t4 = r2(this.instance);
        this.scroll = { animationId: this.root.animationId, phase: e3, isRoot: t4, offset: n2(this.instance), wasRoot: this.scroll ? this.scroll.isRoot : t4 };
      }
    }
    resetTransform() {
      if (!i2) return;
      let e3 = this.isLayoutDirty || this.shouldResetTransform || this.options.alwaysMeasureLayout, t3 = this.projectionDelta && !So(this.projectionDelta), n3 = this.getTransformTemplate(), r3 = n3 ? n3(this.latestValues, "") : void 0, a2 = r3 !== this.prevTransformTemplateValue;
      e3 && this.instance && (t3 || K(this.latestValues) || a2) && (i2(this.instance, r3), this.shouldResetTransform = !1, this.scheduleRender());
    }
    measure(e3 = !0) {
      let t3 = this.measurePageBox(), n3 = this.removeElementScroll(t3);
      return e3 && (n3 = this.removeTransform(n3)), Ss(n3), { animationId: this.root.animationId, measuredBox: t3, layoutBox: n3, latestValues: {}, source: this.id };
    }
    measurePageBox() {
      let { visualElement: e3 } = this.options;
      if (!e3) return G();
      let t3 = e3.measureViewportBox();
      if (!(this.scroll?.wasRoot || this.path.some(ws))) {
        let { scroll: e4 } = this.root;
        e4 && (q(t3.x, e4.offset.x), q(t3.y, e4.offset.y));
      }
      return t3;
    }
    removeElementScroll(e3) {
      let t3 = G();
      if (Y(t3, e3), this.scroll?.wasRoot) return t3;
      for (let n3 = 0; n3 < this.path.length; n3++) {
        let r3 = this.path[n3], { scroll: i3, options: a2 } = r3;
        r3 !== this.root && i3 && a2.layoutScroll && (i3.wasRoot && Y(t3, e3), q(t3.x, i3.offset.x), q(t3.y, i3.offset.y));
      }
      return t3;
    }
    applyTransform(e3, t3 = !1, n3) {
      let r3 = n3 || G();
      Y(r3, e3);
      for (let e4 = 0; e4 < this.path.length; e4++) {
        let n4 = this.path[e4];
        !t3 && n4.options.layoutScroll && n4.scroll && n4 !== n4.root && (q(r3.x, -n4.scroll.offset.x), q(r3.y, -n4.scroll.offset.y)), K(n4.latestValues) && ka(r3, n4.latestValues, n4.layout?.layoutBox);
      }
      return K(this.latestValues) && ka(r3, this.latestValues, this.layout?.layoutBox), r3;
    }
    removeTransform(e3) {
      let t3 = G();
      Y(t3, e3);
      for (let e4 = 0; e4 < this.path.length; e4++) {
        let n3 = this.path[e4];
        if (!K(n3.latestValues)) continue;
        let r3;
        n3.instance && (_a(n3.latestValues) && n3.updateSnapshot(), r3 = G(), Y(r3, n3.measurePageBox())), bo(t3, n3.latestValues, n3.snapshot?.layoutBox, r3);
      }
      return K(this.latestValues) && bo(t3, this.latestValues), t3;
    }
    setTargetDelta(e3) {
      this.targetDelta = e3, this.root.scheduleUpdateProjection(), this.isProjectionDirty = !0;
    }
    setOptions(e3) {
      this.options = { ...this.options, ...e3, crossfade: e3.crossfade === void 0 || e3.crossfade };
    }
    clearMeasurements() {
      this.scroll = void 0, this.layout = void 0, this.snapshot = void 0, this.prevTransformTemplateValue = void 0, this.targetDelta = void 0, this.target = void 0, this.isLayoutDirty = !1;
    }
    forceRelativeParentToResolveTarget() {
      this.relativeParent && this.relativeParent.resolvedRelativeTargetAt !== j.timestamp && this.relativeParent.resolveTargetDelta(!0);
    }
    resolveTargetDelta(e3 = !1) {
      let t3 = this.getLead();
      this.isProjectionDirty ||= t3.isProjectionDirty, this.isTransformDirty ||= t3.isTransformDirty, this.isSharedProjectionDirty ||= t3.isSharedProjectionDirty;
      let n3 = !!this.resumingFrom || this !== t3;
      if (!(e3 || n3 && this.isSharedProjectionDirty || this.isProjectionDirty || this.parent?.isProjectionDirty || this.attemptToResolveRelativeTarget || this.root.updateBlockedByResize)) return;
      let { layout: r3, layoutId: i3 } = this.options;
      if (!this.layout || !(r3 || i3)) return;
      this.resolvedRelativeTargetAt = j.timestamp;
      let a2 = this.getClosestProjectingParent();
      a2 && this.linkedParentVersion !== a2.layoutVersion && !a2.options.layoutRoot && this.removeRelativeTarget(), !this.targetDelta && !this.relativeTarget && (this.options.layoutAnchor !== !1 && a2 && a2.layout ? this.createRelativeTarget(a2, this.layout.layoutBox, a2.layout.layoutBox) : this.removeRelativeTarget()), (this.relativeTarget || this.targetDelta) && (this.target || (this.target = G(), this.targetWithTransforms = G()), this.relativeTarget && this.relativeTargetOrigin && this.relativeParent && this.relativeParent.target ? (this.forceRelativeParentToResolveTarget(), fo(this.target, this.relativeTarget, this.relativeParent.target, this.options.layoutAnchor || void 0)) : this.targetDelta ? (this.resumingFrom ? this.applyTransform(this.layout.layoutBox, !1, this.target) : Y(this.target, this.layout.layoutBox), Ca(this.target, this.targetDelta)) : Y(this.target, this.layout.layoutBox), this.attemptToResolveRelativeTarget && (this.attemptToResolveRelativeTarget = !1, this.options.layoutAnchor !== !1 && a2 && !!a2.resumingFrom == !!this.resumingFrom && !a2.options.layoutScroll && a2.target && this.animationProgress !== 1 ? this.createRelativeTarget(a2, this.target, a2.target) : this.relativeParent = this.relativeTarget = void 0), Gi.value && Ko.calculatedTargetDeltas++);
    }
    getClosestProjectingParent() {
      if (!(!this.parent || _a(this.parent.latestValues) || va(this.parent.latestValues))) return this.parent.isProjecting() ? this.parent : this.parent.getClosestProjectingParent();
    }
    isProjecting() {
      return !!((this.relativeTarget || this.targetDelta || this.options.layoutRoot) && this.layout);
    }
    createRelativeTarget(e3, t3, n3) {
      this.relativeParent = e3, this.linkedParentVersion = e3.layoutVersion, this.forceRelativeParentToResolveTarget(), this.relativeTarget = G(), this.relativeTargetOrigin = G(), mo(this.relativeTargetOrigin, t3, n3, this.options.layoutAnchor || void 0), Y(this.relativeTarget, this.relativeTargetOrigin);
    }
    removeRelativeTarget() {
      this.relativeParent = this.relativeTarget = void 0;
    }
    calcProjection() {
      let e3 = this.getLead(), t3 = !!this.resumingFrom || this !== e3, n3 = !0;
      if ((this.isProjectionDirty || this.parent?.isProjectionDirty) && (n3 = !1), t3 && (this.isSharedProjectionDirty || this.isTransformDirty) && (n3 = !1), this.resolvedRelativeTargetAt === j.timestamp && (n3 = !1), n3) return;
      let { layout: r3, layoutId: i3 } = this.options;
      if (this.isTreeAnimating = !!(this.parent && this.parent.isTreeAnimating || this.currentAnimation || this.pendingAnimation), this.isTreeAnimating || (this.targetDelta = this.relativeTarget = void 0), !this.layout || !(r3 || i3)) return;
      Y(this.layoutCorrected, this.layout.layoutBox);
      let a2 = this.treeScale.x, o2 = this.treeScale.y;
      Ea(this.layoutCorrected, this.treeScale, this.path, t3), e3.layout && !e3.target && (this.treeScale.x !== 1 || this.treeScale.y !== 1) && (e3.target = e3.layout.layoutBox, e3.targetWithTransforms = G());
      let { target: s2 } = e3;
      s2 ? (!this.projectionDelta || !this.prevProjectionDelta ? this.createProjectionDeltas() : (no(this.prevProjectionDelta.x, this.projectionDelta.x), no(this.prevProjectionDelta.y, this.projectionDelta.y)), lo(this.projectionDelta, this.layoutCorrected, s2, this.latestValues), this.treeScale.x === a2 && this.treeScale.y === o2 && Oo(this.projectionDelta.x, this.prevProjectionDelta.x) && Oo(this.projectionDelta.y, this.prevProjectionDelta.y) || (this.hasProjected = !0, this.scheduleRender(), this.notifyListeners("projectionUpdate", s2)), Gi.value && Ko.calculatedProjections++) : this.prevProjectionDelta && (this.createProjectionDeltas(), this.scheduleRender());
    }
    hide() {
      this.isVisible = !1;
    }
    show() {
      this.isVisible = !0;
    }
    scheduleRender(e3 = !0) {
      if (this.options.visualElement?.scheduleRender(), e3) {
        let e4 = this.getStack();
        e4 && e4.scheduleRender();
      }
      this.resumingFrom && !this.resumingFrom.instance && (this.resumingFrom = void 0);
    }
    createProjectionDeltas() {
      this.prevProjectionDelta = Xi(), this.projectionDelta = Xi(), this.projectionDeltaWithTransform = Xi();
    }
    setAnimationOrigin(e3, t3 = !1, n3) {
      let r3 = this.snapshot, i3 = r3 ? r3.latestValues : {}, a2 = { ...this.latestValues }, o2 = Xi();
      this.relativeParent && this.relativeParent.options.layoutRoot || (this.relativeTarget = this.relativeTargetOrigin = void 0), this.attemptToResolveRelativeTarget = !t3;
      let s2 = G(), c2 = (r3 ? r3.source : void 0) !== (this.layout ? this.layout.source : void 0), l2 = this.getStack(), u2 = !l2 || l2.members.length <= 1, d2 = !(!c2 || u2 || this.options.crossfade !== !0 || this.path.some(_s));
      this.animationProgress = 0;
      let f2, p2 = n3?.interpolateProjection(e3);
      this.mixTargetDelta = (t4) => {
        let n4 = t4 / 1e3, r4 = p2?.(n4);
        r4 ? (o2.x.translate = r4.x, o2.x.scale = R(e3.x.scale, 1, n4), o2.x.origin = e3.x.origin, o2.x.originPoint = e3.x.originPoint, o2.y.translate = r4.y, o2.y.scale = R(e3.y.scale, 1, n4), o2.y.origin = e3.y.origin, o2.y.originPoint = e3.y.originPoint) : (ms(o2.x, e3.x, n4), ms(o2.y, e3.y, n4)), this.setTargetDelta(o2), this.relativeTarget && this.relativeTargetOrigin && this.layout && this.relativeParent && this.relativeParent.layout && (mo(s2, this.layout.layoutBox, this.relativeParent.layout.layoutBox, this.options.layoutAnchor || void 0), gs(this.relativeTarget, this.relativeTargetOrigin, s2, n4), f2 && wo(this.relativeTarget, f2) && (this.isProjectionDirty = !1), f2 ||= G(), Y(f2, this.relativeTarget)), c2 && (this.animationValues = a2, No(a2, i3, this.latestValues, n4, d2, u2)), r4 && r4.rotate !== void 0 && (this.animationValues ||= a2, this.animationValues.pathRotation = r4.rotate), this.root.scheduleUpdateProjection(), this.scheduleRender(), this.animationProgress = n4;
      }, this.mixTargetDelta(this.options.layoutRoot ? 1e3 : 0);
    }
    startAnimation(e3) {
      this.notifyListeners("animationStart"), this.currentAnimation?.stop(), this.resumingFrom?.currentAnimation?.stop(), this.pendingAnimation &&= (A(this.pendingAnimation), void 0), this.pendingAnimation = k.update(() => {
        Go.hasAnimatedSinceResize = !0, this.motionValue ||= U(0), this.motionValue.jump(0, !1), this.currentAnimation = Ro(this.motionValue, [0, 1e3], { ...e3, velocity: 0, isSync: !0, onUpdate: (t3) => {
          this.mixTargetDelta(t3), e3.onUpdate && e3.onUpdate(t3);
        }, onComplete: () => {
          e3.onComplete && e3.onComplete(), this.completeAnimation();
        } }), this.resumingFrom && (this.resumingFrom.currentAnimation = this.currentAnimation), this.pendingAnimation = void 0;
      });
    }
    completeAnimation() {
      this.resumingFrom && (this.resumingFrom.currentAnimation = void 0, this.resumingFrom.preserveOpacity = void 0);
      let e3 = this.getStack();
      e3 && e3.exitAnimationComplete(), this.resumingFrom = this.currentAnimation = this.animationValues = void 0, this.notifyListeners("animationComplete");
    }
    finishAnimation() {
      this.currentAnimation && (this.mixTargetDelta && this.mixTargetDelta(Jo), this.currentAnimation.stop()), this.completeAnimation();
    }
    applyTransformsToTarget() {
      let e3 = this.getLead(), { targetWithTransforms: t3, target: n3, layout: r3, latestValues: i3 } = e3;
      if (t3 && n3 && r3) {
        if (this !== e3 && this.layout && r3 && Cs(this.options.animationType, this.layout.layoutBox, r3.layoutBox)) {
          n3 = this.target || G();
          let t4 = X(this.layout.layoutBox.x);
          n3.x.min = e3.target.x.min, n3.x.max = n3.x.min + t4;
          let r4 = X(this.layout.layoutBox.y);
          n3.y.min = e3.target.y.min, n3.y.max = n3.y.min + r4;
        }
        Y(t3, n3), ka(t3, i3), lo(this.projectionDeltaWithTransform, this.layoutCorrected, t3, i3);
      }
    }
    registerSharedNode(e3, t3) {
      this.sharedNodes.has(e3) || this.sharedNodes.set(e3, new Wo()), this.sharedNodes.get(e3).add(t3);
      let n3 = t3.options.initialPromotionConfig;
      t3.promote({ transition: n3 ? n3.transition : void 0, preserveFollowOpacity: n3 && n3.shouldPreserveFollowOpacity ? n3.shouldPreserveFollowOpacity(t3) : void 0 });
    }
    isLead() {
      let e3 = this.getStack();
      return !e3 || e3.lead === this;
    }
    getLead() {
      let { layoutId: e3 } = this.options;
      return e3 && this.getStack()?.lead || this;
    }
    getPrevLead() {
      let { layoutId: e3 } = this.options;
      return e3 ? this.getStack()?.prevLead : void 0;
    }
    getStack() {
      let { layoutId: e3 } = this.options;
      if (e3) return this.root.sharedNodes.get(e3);
    }
    promote({ needsReset: e3, transition: t3, preserveFollowOpacity: n3 } = {}) {
      let r3 = this.getStack();
      r3 && r3.promote(this, n3), e3 && (this.projectionDelta = void 0, this.needsReset = !0), t3 && this.setOptions({ transition: t3 });
    }
    relegate() {
      let e3 = this.getStack();
      return e3 ? e3.relegate(this) : !1;
    }
    resetSkewAndRotation() {
      let { visualElement: e3 } = this.options;
      if (!e3) return;
      let t3 = !1, { latestValues: n3 } = e3;
      if ((n3.z || n3.rotate || n3.rotateX || n3.rotateY || n3.rotateZ || n3.skewX || n3.skewY) && (t3 = !0), !t3) return;
      let r3 = {};
      n3.z && Xo("z", e3, r3, this.animationValues);
      for (let t4 = 0; t4 < qo.length; t4++) Xo(`rotate${qo[t4]}`, e3, r3, this.animationValues), Xo(`skew${qo[t4]}`, e3, r3, this.animationValues);
      e3.render();
      for (let t4 in r3) e3.setStaticValue(t4, r3[t4]), this.animationValues && (this.animationValues[t4] = r3[t4]);
      e3.scheduleRender();
    }
    applyProjectionStyles(e3, t3) {
      if (!this.instance || this.isSVG) return;
      if (!this.isVisible) {
        e3.visibility = "hidden";
        return;
      }
      let n3 = this.getTransformTemplate();
      if (this.needsReset) {
        this.needsReset = !1, e3.visibility = "", e3.opacity = "", e3.pointerEvents = Uo(t3?.pointerEvents) || "", e3.transform = n3 ? n3(this.latestValues, "") : "none";
        return;
      }
      let r3 = this.getLead();
      if (!this.projectionDelta || !this.layout || !r3.target) {
        this.options.layoutId && (e3.opacity = this.latestValues.opacity === void 0 ? 1 : this.latestValues.opacity, e3.pointerEvents = Uo(t3?.pointerEvents) || ""), this.hasProjected && !K(this.latestValues) && (e3.transform = n3 ? n3({}, "") : "none", this.hasProjected = !1);
        return;
      }
      e3.visibility = "";
      let i3 = r3.animationValues || r3.latestValues;
      this.applyTransformsToTarget();
      let a2 = ko(this.projectionDeltaWithTransform, this.treeScale, i3);
      n3 && (a2 = n3(i3, a2)), e3.transform = a2;
      let { x: o2, y: s2 } = this.projectionDelta;
      e3.transformOrigin = `${o2.origin * 100}% ${s2.origin * 100}% 0`, e3.opacity = r3.animationValues ? r3 === this ? i3.opacity ?? this.latestValues.opacity ?? 1 : this.preserveOpacity ? this.latestValues.opacity : i3.opacityExit : r3 === this ? i3.opacity === void 0 ? "" : i3.opacity : i3.opacityExit === void 0 ? 0 : i3.opacityExit;
      for (let t4 in za) {
        if (i3[t4] === void 0) continue;
        let { correct: n4, applyTo: o3, isCSSVariable: s3 } = za[t4], c2 = a2 === "none" ? i3[t4] : n4(i3[t4], r3);
        if (o3) {
          let t5 = o3.length;
          for (let n5 = 0; n5 < t5; n5++) e3[o3[n5]] = c2;
        } else s3 ? this.options.visualElement.renderState.vars[t4] = c2 : e3[t4] = c2;
      }
      this.options.layoutId && (e3.pointerEvents = r3 === this ? Uo(t3?.pointerEvents) || "" : "none");
    }
    clearSnapshot() {
      this.resumeFrom = this.snapshot = void 0;
    }
    resetTree() {
      this.root.nodes.forEach((e3) => e3.currentAnimation?.stop()), this.root.nodes.forEach(is), this.root.sharedNodes.clear();
    }
  };
}
function $o(e2) {
  e2.updateLayout();
}
function es(e2) {
  let t2 = e2.resumeFrom?.snapshot || e2.snapshot;
  if (e2.isLead() && e2.layout && t2 && e2.hasListeners("didUpdate")) {
    let { layoutBox: n2, measuredBox: r2 } = e2.layout, { animationType: i2 } = e2.options, a2 = t2.source !== e2.layout.source;
    if (i2 === "size") Z((e3) => {
      let r3 = a2 ? t2.measuredBox[e3] : t2.layoutBox[e3], i3 = X(r3);
      r3.min = n2[e3].min, r3.max = r3.min + i3;
    });
    else if (i2 === "x" || i2 === "y") {
      let e3 = i2 === "x" ? "y" : "x";
      to(a2 ? t2.measuredBox[e3] : t2.layoutBox[e3], n2[e3]);
    } else Cs(i2, t2.layoutBox, n2) && Z((r3) => {
      let i3 = a2 ? t2.measuredBox[r3] : t2.layoutBox[r3], o3 = X(n2[r3]);
      i3.max = i3.min + o3, e2.relativeTarget && !e2.currentAnimation && (e2.isProjectionDirty = !0, e2.relativeTarget[r3].max = e2.relativeTarget[r3].min + o3);
    });
    let o2 = Xi();
    lo(o2, n2, t2.layoutBox);
    let s2 = Xi();
    a2 ? lo(s2, e2.applyTransform(r2, !0), t2.measuredBox) : lo(s2, n2, t2.layoutBox);
    let c2 = !So(o2), l2 = !1;
    if (!e2.resumeFrom) {
      let r3 = e2.getClosestProjectingParent();
      if (r3 && !r3.resumeFrom) {
        let { snapshot: i3, layout: a3 } = r3;
        if (i3 && a3) {
          let o3 = e2.options.layoutAnchor || void 0, s3 = G();
          mo(s3, t2.layoutBox, i3.layoutBox, o3);
          let c3 = G();
          mo(c3, n2, a3.layoutBox, o3), Eo(s3, c3) || (l2 = !0), r3.options.layoutRoot && (e2.relativeTarget = c3, e2.relativeTargetOrigin = s3, e2.relativeParent = r3);
        }
      }
    }
    e2.notifyListeners("didUpdate", { layout: n2, snapshot: t2, delta: s2, layoutDelta: o2, hasLayoutChanged: c2, hasRelativeLayoutChanged: l2 });
  } else if (e2.isLead()) {
    let { onExitComplete: t3 } = e2.options;
    t3 && t3();
  }
  e2.options.transition = void 0;
}
function ts(e2) {
  Gi.value && Ko.nodes++, e2.parent && (e2.isProjecting() || (e2.isProjectionDirty = e2.parent.isProjectionDirty), e2.isSharedProjectionDirty ||= !!(e2.isProjectionDirty || e2.parent.isProjectionDirty || e2.parent.isSharedProjectionDirty), e2.isTransformDirty ||= e2.parent.isTransformDirty);
}
function ns(e2) {
  e2.isProjectionDirty = e2.isSharedProjectionDirty = e2.isTransformDirty = !1;
}
function rs(e2) {
  e2.clearSnapshot();
}
function is(e2) {
  e2.clearMeasurements();
}
function as(e2) {
  e2.isLayoutDirty = !0, e2.updateLayout();
}
function os(e2) {
  e2.isLayoutDirty = !1;
}
function ss(e2) {
  e2.isAnimationBlocked && e2.layout && !e2.isLayoutDirty && (e2.snapshot = e2.layout, e2.isLayoutDirty = !0);
}
function cs(e2) {
  let { visualElement: t2 } = e2.options;
  t2 && t2.getProps().onBeforeLayoutMeasure && t2.notify("BeforeLayoutMeasure"), e2.resetTransform();
}
function ls(e2) {
  e2.finishAnimation(), e2.targetDelta = e2.relativeTarget = e2.target = void 0, e2.isProjectionDirty = !0;
}
function us(e2) {
  e2.resolveTargetDelta();
}
function ds(e2) {
  e2.calcProjection();
}
function fs(e2) {
  e2.resetSkewAndRotation();
}
function ps(e2) {
  e2.removeLeadSnapshot();
}
function ms(e2, t2, n2) {
  e2.translate = R(t2.translate, 0, n2), e2.scale = R(t2.scale, 1, n2), e2.origin = t2.origin, e2.originPoint = t2.originPoint;
}
function hs(e2, t2, n2, r2) {
  e2.min = R(t2.min, n2.min, r2), e2.max = R(t2.max, n2.max, r2);
}
function gs(e2, t2, n2, r2) {
  hs(e2.x, t2.x, n2.x, r2), hs(e2.y, t2.y, n2.y, r2);
}
function _s(e2) {
  return e2.animationValues && e2.animationValues.opacityExit !== void 0;
}
var vs = { duration: 0.45, ease: [0.4, 0, 0.1, 1] };
var ys = (e2) => typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().includes(e2);
var bs = ys("applewebkit/") && !ys("chrome/") ? Math.round : E;
function xs(e2) {
  e2.min = bs(e2.min), e2.max = bs(e2.max);
}
function Ss(e2) {
  xs(e2.x), xs(e2.y);
}
function Cs(e2, t2, n2) {
  return e2 === "position" || e2 === "preserve-aspect" && !so(Do(t2), Do(n2), 0.2);
}
function ws(e2) {
  return e2 !== e2.root && e2.scroll?.wasRoot;
}
var Ts = Qo({ attachResizeListener: (e2, t2) => zo(e2, "resize", t2), measureScroll: () => ({ x: document.documentElement.scrollLeft || document.body?.scrollLeft || 0, y: document.documentElement.scrollTop || document.body?.scrollTop || 0 }), checkIsScrollRoot: () => !0 });
var Es = { current: void 0 };
var Ds = Qo({ measureScroll: (e2) => ({ x: e2.scrollLeft, y: e2.scrollTop }), defaultParent: () => {
  if (!Es.current) {
    let e2 = new Ts({});
    e2.mount(window), e2.setOptions({ layoutScroll: !0 }), Es.current = e2;
  }
  return Es.current;
}, resetTransform: (e2, t2) => {
  e2.style.transform = t2 === void 0 ? "none" : t2;
}, checkIsScrollRoot: (e2) => window.getComputedStyle(e2).position === "fixed" });
var Os = { some: 0, all: 1 };
function ks(e2, t2, { root: n2, margin: r2, amount: i2 = "some" } = {}) {
  let a2 = Ci(e2), o2 = /* @__PURE__ */ new WeakMap(), s2 = new IntersectionObserver((e3) => {
    e3.forEach((e4) => {
      let n3 = o2.get(e4.target);
      if (e4.isIntersecting !== !!n3)
        if (e4.isIntersecting) {
          let n4 = t2(e4.target, e4);
          typeof n4 == "function" ? o2.set(e4.target, n4) : s2.unobserve(e4.target);
        } else typeof n3 == "function" && (n3(e4), o2.delete(e4.target));
    });
  }, { root: n2, rootMargin: r2, threshold: typeof i2 == "number" ? i2 : Os[i2] });
  return a2.forEach((e3) => s2.observe(e3)), () => s2.disconnect();
}
var As = (e2, t2) => Math.abs(e2 - t2);
function js(e2, t2) {
  let n2 = As(e2.x, t2.x), r2 = As(e2.y, t2.y);
  return Math.sqrt(n2 ** 2 + r2 ** 2);
}
function Ms({ current: e2 }) {
  return e2 ? e2.ownerDocument.defaultView : null;
}
function Ns(e2) {
  if (e2) return e2.nodeType === 3 || e2.nodeType === 8 ? Ns(e2.nextSibling) : e2;
}
var [Ps, Fs, Is] = b("Motion");
var [Ls, Rs, zs] = b("LayoutGroup");
var Bs = { reducedMotion: "never", transition: void 0, nonce: void 0 };
var [Vs, Hs, Us] = b("MotionConfig");
function Ws() {
  return Vs(f(() => Bs));
}
function Gs(e2, t2, n2) {
  if (Array.isArray(e2)) return e2.reduce((e3, r2) => {
    let i2 = Gs(r2, t2, n2);
    return i2 ? { ...e3, ...i2 } : e3;
  }, {});
  if (typeof e2 == "object") return e2;
  if (e2 && t2) {
    let r2 = t2[e2];
    return typeof r2 == "function" ? r2(n2) : r2;
  }
}
function Ks(e2, t2, n2) {
  let r2 = Gs(e2, t2, n2);
  if (!r2) return;
  let { transition: i2, transitionEnd: a2, ...o2 } = r2;
  return { ...o2, ...a2 };
}
function qs(e2, t2) {
  let n2 = (e2.initial === void 0 && e2.variants ? t2?.initial : e2.initial) === !1 ? ["initial", "animate"] : ["initial"], r2 = e2.custom ?? e2.presenceContext?.custom;
  return n2.reduce((n3, i2) => ({ ...n3, ...Ks(e2[i2] || t2?.[i2], e2.variants, r2) }), {});
}
function Js(e2, t2) {
  let n2 = t2?.length;
  if (n2 !== e2.length) return !1;
  for (let r2 = 0; r2 < n2; r2++) if (t2[r2] !== e2[r2]) return !1;
  return !0;
}
var Ys = new Set("animate.circle.defs.desc.ellipse.g.image.line.filter.marker.mask.metadata.path.pattern.polygon.polyline.rect.stop.svg.switch.symbol.text.tspan.use.view.clipPath.feBlend.feColorMatrix.feComponentTransfer.feComposite.feConvolveMatrix.feDiffuseLighting.feDisplacementMap.feDistantLight.feDropShadow.feFlood.feFuncA.feFuncB.feFuncG.feFuncR.feGaussianBlur.feImage.feMerge.feMergeNode.feMorphology.feOffset.fePointLight.feSpecularLighting.feSpotLight.feTile.feTurbulence.foreignObject.linearGradient.radialGradient.textPath".split("."));
function Xs(e2) {
  return Ys.has(e2);
}
var Zs = /* @__PURE__ */ new WeakMap();
var Qs = class {
  constructor(e2, t2, n2 = {}) {
    this.element = null, this.isExiting = !1, this.children = /* @__PURE__ */ new Set(), this.features = /* @__PURE__ */ new Map(), this.featureCtors = [], this._context = null, this.options = e2, this.parent = t2, t2?.children?.add(this), this.latestValues = qs(e2, this.context), this.type = Xs(this.options.as) ? "svg" : "html", this.setBundle(n2);
  }
  get context() {
    return this._context ||= new Proxy({}, { get: (e2, t2) => {
      let n2 = this.options[t2];
      return ea(n2) || t2 === "initial" && n2 === !1 ? n2 : this.parent?.context[t2];
    } }), this._context;
  }
  setBundle(e2) {
    e2.renderer && this.initVisualElement(e2.renderer), e2.features?.length && (this.featureCtors = e2.features), this.updateFeatures();
  }
  updateFeatures() {
    if (this.visualElement) for (let e2 of this.featureCtors) {
      let t2 = this.features.get(e2.key);
      t2 || (t2 = new e2(this), this.features.set(e2.key, t2)), this.isMounted() && (t2.isMount ? t2.update() : (t2.mount(), t2.isMount = !0));
    }
  }
  updateOptions(e2) {
    this.options = e2, this.visualElement?.update({ ...this.options, whileTap: this.options.whilePress }, this.options.presenceContext ?? null);
  }
  mount(e2) {
    Zs.set(e2, this), this.element = e2, this.visualElement?.mount(e2), this.updateFeatures();
  }
  beforeUnmount() {
    this.getSnapshot(!1);
  }
  unmount() {
    this.parent?.children?.delete(this), this.element && Zs.delete(this.element), this.features.forEach((e2) => {
      e2.unmount(), e2.isMount = !1;
    }), this.visualElement?.unmount(), this.element = null;
  }
  beforeUpdate() {
    this.getSnapshot(!this.isExiting);
  }
  update() {
    this.updateFeatures(), this.didUpdate();
  }
  getFeature(e2) {
    return this.features.get(e2);
  }
  setActive(e2, t2) {
    e2 === "exit" && t2 && (this.isExiting = !0), this.visualElement?.animationState?.setActive(e2, t2).then(() => {
      e2 === "exit" && t2 && (this.isExiting = !1);
    });
  }
  isMounted() {
    return !!this.element;
  }
  initVisualElement(e2) {
    this.visualElement || (this.visualElement = e2(this.options.as, { presenceContext: this.options.presenceContext ?? null, parent: this.parent?.visualElement, props: { ...this.options, whileTap: this.options.whilePress }, visualState: { renderState: { transform: {}, transformOrigin: {}, style: {}, vars: {}, attrs: {} }, latestValues: { ...this.latestValues } }, reducedMotionConfig: this.options.motionConfig?.reducedMotion }), this.visualElement.parent?.addChild(this.visualElement), this.isMounted() && this.visualElement.mount(this.element));
  }
  getSnapshot(e2) {
    this.features.get("layout")?.getSnapshot(e2);
  }
  didUpdate() {
  }
};
var Q = class {
  constructor(e2) {
    this.isMount = !1, this.state = e2;
  }
  mount() {
  }
  beforeUnmount() {
  }
  unmount() {
  }
  update() {
  }
  getSnapshot(e2) {
  }
};
var $s = ["initial", "animate", "exit", "whileHover", "whileDrag", "whileFocus", "whilePress"];
var ec = $s.length;
function tc(e2) {
  if (!e2) return;
  if (!e2.isControllingVariants) {
    let t3 = e2.parent && tc(e2.parent) || {};
    return e2.props.initial !== void 0 && (t3.initial = e2.props.initial), t3;
  }
  let t2 = {};
  for (let n2 = 0; n2 < ec; n2++) {
    let r2 = $s[n2], i2 = e2.props[r2];
    (ea(i2) || i2 === !1) && (t2[r2] = i2);
  }
  return t2;
}
var nc = ["animate", "whileInView", "whileFocus", "whileHover", "whilePress", "whileDrag", "exit"];
var rc = [...nc].reverse();
var ic = nc.length;
function $(e2 = !1) {
  return { isActive: e2, protectedKeys: {}, needsAnimating: {}, prevResolvedValues: {} };
}
function ac() {
  return { animate: $(!0), whileInView: $(), whileHover: $(), whilePress: $(), whileDrag: $(), whileFocus: $(), exit: $() };
}
function oc(e2, t2) {
  return typeof t2 == "string" ? t2 !== e2 : Array.isArray(t2) ? !Js(t2, e2) : !1;
}
function sc(e2) {
  return Array.isArray(e2);
}
function cc(e2) {
  return (t2) => Promise.all(t2.map(({ animation: t3, options: n2 }) => ni(e2, t3, n2)));
}
function lc(e2) {
  let t2 = cc(e2), n2 = ac(), r2 = !0, i2 = (t3) => (n3, r3) => {
    let i3 = Br(e2, r3, t3 === "exit" ? e2.presenceContext?.custom : void 0);
    if (i3) {
      let { transition: e3, transitionEnd: t4, ...r4 } = i3;
      n3 = { ...n3, ...r4, ...t4 };
    }
    return n3;
  };
  function a2(n3) {
    t2 = n3(e2);
  }
  function o2(a3) {
    let o3 = e2.props, s3 = tc(e2.parent) || {}, c2 = [], l2 = /* @__PURE__ */ new Set(), u2 = {}, d2 = 1 / 0;
    for (let t3 = 0; t3 < ic; t3++) {
      let f3 = rc[t3], p2 = n2[f3], m2 = o3[f3] === void 0 ? s3[f3] : o3[f3], h2 = ea(m2), g2 = f3 === a3 ? p2.isActive : null;
      g2 === !1 && (d2 = t3);
      let _2 = m2 === s3[f3] && m2 !== o3[f3] && h2;
      if (_2 && r2 && e2.manuallyAnimateOnMount && (_2 = !1), p2.protectedKeys = { ...u2 }, !p2.isActive && g2 === null || !m2 && !p2.prevProp || $i(m2) || typeof m2 == "boolean") continue;
      let v2 = oc(p2.prevProp, m2), y2 = v2 || f3 === a3 && p2.isActive && !_2 && h2 || t3 > d2 && h2, b2 = !1, x2 = Array.isArray(m2) ? m2 : [m2], S2 = x2.reduce(i2(f3), {});
      g2 === !1 && (S2 = {});
      let { prevResolvedValues: C2 = {} } = p2, w2 = { ...C2, ...S2 }, T2 = (t4) => {
        y2 = !0, l2.has(t4) && (b2 = !0, l2.delete(t4)), p2.needsAnimating[t4] = !0;
        let n3 = e2.getValue(t4);
        n3 && (n3.liveStyle = !1);
      };
      for (let e3 in w2) {
        let t4 = S2[e3], n3 = C2[e3];
        if (Object.hasOwnProperty.call(u2, e3)) continue;
        let r3 = !1;
        r3 = sc(t4) && sc(n3) ? !Js(t4, n3) : t4 !== n3, r3 ? t4 == null ? l2.add(e3) : T2(e3) : t4 !== void 0 && l2.has(e3) ? T2(e3) : p2.protectedKeys[e3] = !0;
      }
      p2.prevProp = m2, p2.prevResolvedValues = S2, p2.isActive && (u2 = { ...u2, ...S2 }), r2 && e2.blockInitialAnimation && (y2 = !1);
      let ee2 = _2 && v2;
      y2 && (!ee2 || b2) && c2.push(...x2.map((t4) => {
        let n3 = { type: f3 };
        if (typeof t4 == "string" && r2 && !ee2 && e2.manuallyAnimateOnMount && e2.parent) {
          let { parent: r3 } = e2, i3 = Br(r3, t4);
          if (r3.enteringChildren && i3) {
            let { delayChildren: t5 } = i3.transition || {};
            n3.delay = br(r3.enteringChildren, e2, t5);
          }
        }
        return { animation: t4, options: n3 };
      }));
    }
    if (l2.size) {
      let t3 = {};
      if (typeof o3.initial != "boolean") {
        let n3 = Br(e2, Array.isArray(o3.initial) ? o3.initial[0] : o3.initial);
        n3 && n3.transition && (t3.transition = n3.transition);
      }
      l2.forEach((n3) => {
        let r3 = e2.getBaseTarget(n3), i3 = e2.getValue(n3);
        i3 && (i3.liveStyle = !0), t3[n3] = r3 ?? null;
      }), c2.push({ animation: t3 });
    }
    let f2 = !!c2.length;
    return r2 && (o3.initial === !1 || o3.initial === o3.animate) && !e2.manuallyAnimateOnMount && (f2 = !1), r2 = !1, f2 ? t2(c2) : Promise.resolve();
  }
  function s2(t3, r3) {
    if (n2[t3].isActive === r3) return Promise.resolve();
    e2.variantChildren?.forEach((e3) => {
      e3.animationState?.setActive(t3, r3);
    }), n2[t3].isActive = r3;
    let i3 = o2(t3);
    for (let e3 in n2) n2[e3].protectedKeys = {};
    return i3;
  }
  return { animateChanges: o2, setActive: s2, setAnimateFunction: a2, getState: () => n2, reset: () => {
    n2 = ac(), r2 = !0;
  } };
}
function uc(e2) {
  return e2.style.display === "none" || e2.offsetParent === null && window.getComputedStyle(e2).position !== "fixed";
}
var dc = class extends Q {
  static #e = this.key = "animation";
  constructor(e2) {
    super(e2);
    let t2 = e2.visualElement;
    t2.animationState ||= lc(t2);
  }
  updateAnimationControlsSubscription() {
    let { animate: e2 } = this.state.options;
    $i(e2) && (this.unmountControls = e2.subscribe(this.state.visualElement));
  }
  mount() {
    uc(this.state.element) ? this.state.setActive("exit", !0) : this.state.visualElement.animationState?.animateChanges(), this.updateAnimationControlsSubscription();
  }
  update() {
    this.state.visualElement.animationState?.animateChanges();
    let { animate: e2 } = this.state.visualElement.getProps(), { animate: t2 } = this.state.visualElement.prevProps || {};
    e2 !== t2 && this.updateAnimationControlsSubscription();
  }
  unmount() {
    this.state.visualElement.animationState.reset(), this.unmountControls?.();
  }
};
var fc = class extends Q {
  constructor(...e2) {
    super(...e2), this.exitGeneration = 0;
  }
  static #e = this.key = "exit";
  exit() {
    let e2 = ++this.exitGeneration, t2 = this.state;
    t2.isExiting = !0;
    let n2 = new Promise((e3) => {
      this.pendingExit = { resolve: e3 };
    }), r2 = t2.visualElement?.animationState?.setActive("exit", !0);
    return r2 ? r2.then(() => {
      e2 === this.exitGeneration && (t2.isExiting = !1, t2.options?.layoutId ? k.postRender(() => this.tryCompleteExit(e2)) : this.tryCompleteExit(e2));
    }) : (t2.isExiting = !1, this.tryCompleteExit(e2)), t2.getSnapshot(!1), n2;
  }
  reenter() {
    this.exitGeneration++, this.settleExit(), this.state.isExiting = !1, this.state.setActive("exit", !1), this.state.getSnapshot(!0);
  }
  completeExitFromProjection() {
    this.tryCompleteExit(this.exitGeneration);
  }
  tryCompleteExit(e2) {
    e2 !== this.exitGeneration || this.state.isExiting || this.state.options?.layoutId && this.state.visualElement.projection?.currentAnimation?.state === "running" || this.settleExit();
  }
  settleExit() {
    this.pendingExit?.resolve(), this.pendingExit = void 0;
  }
  mount() {
    this.state.options.presenceContext?.register?.(this.state);
  }
  unmount() {
    this.state.options.presenceContext?.unregister?.(this.state), this.settleExit();
  }
};
function pc(e2, t2) {
  return Xs(e2) ? new eo(t2) : new Wa(t2);
}
function mc(e2) {
  return { point: { x: e2.pageX, y: e2.pageY } };
}
var hc = class extends Q {
  static #e = this.key = "press";
  constructor(e2) {
    super(e2);
  }
  isActive() {
    let { whilePress: e2, onPress: t2, onPressCancel: n2, onPressStart: r2 } = this.state.options;
    return !!(e2 || t2 || n2 || r2);
  }
  register() {
    let e2 = this.state.element;
    e2 && this.isActive() && (this.removePress?.(), this.removePress = Ui(e2, (e3, t2) => {
      let n2 = this.state.options;
      return this.state.setActive("whilePress", !0), n2.onPressStart && k.postRender(() => n2.onPressStart(t2, mc(t2))), (e4, { success: t3 }) => {
        this.state.setActive("whilePress", !1);
        let n3 = t3 ? "onPress" : "onPressCancel", r2 = this.state.options[n3];
        r2 && k.postRender(() => r2(e4, mc(e4)));
      };
    }, { useGlobalTarget: this.state.options.globalPressTarget }));
  }
  mount() {
    this.register();
  }
  update() {
    let e2 = this.state.visualElement.prevProps;
    !(e2?.whilePress || e2?.whileTap || e2?.onPress || e2?.onPressCancel || e2?.onPressStart) && this.isActive() && this.register();
  }
  unmount() {
    this.removePress?.(), this.removePress = void 0;
  }
};
function gc(e2) {
  return e2.pointerType === "mouse" ? typeof e2.button != "number" || e2.button <= 0 : e2.isPrimary !== !1;
}
function _c(e2, t2 = "page") {
  return { point: { x: e2[`${t2}X`], y: e2[`${t2}Y`] } };
}
function vc(e2) {
  return (t2) => gc(t2) && e2(t2, _c(t2));
}
var yc = class extends Q {
  static #e = this.key = "hover";
  constructor(e2) {
    super(e2);
  }
  isActive() {
    let { whileHover: e2, onHoverStart: t2, onHoverEnd: n2 } = this.state.options;
    return !!(e2 || t2 || n2);
  }
  register() {
    let e2 = this.state.element;
    e2 && this.isActive() && (this.removeHover?.(), this.removeHover = Mi(e2, (e3, t2) => {
      let n2 = this.state.options;
      return this.state.setActive("whileHover", !0), n2.onHoverStart && k.postRender(() => n2.onHoverStart(t2, _c(t2))), (e4) => {
        this.state.setActive("whileHover", !1);
        let t3 = this.state.options.onHoverEnd;
        t3 && k.postRender(() => t3(e4, _c(e4)));
      };
    }));
  }
  mount() {
    this.register();
  }
  update() {
    let e2 = this.state.visualElement.prevProps;
    !(e2?.whileHover || e2?.onHoverStart || e2?.onHoverEnd) && this.isActive() && this.register();
  }
  unmount() {
    this.removeHover?.(), this.removeHover = void 0;
  }
};
var bc = class extends Q {
  static #e = this.key = "inView";
  constructor(e2) {
    super(e2);
  }
  isActive() {
    let { whileInView: e2, onViewportEnter: t2, onViewportLeave: n2 } = this.state.options;
    return !!(e2 || t2 || n2);
  }
  startObserver() {
    let e2 = this.state.element;
    if (!e2 || !this.isActive()) return;
    this.removeObserver?.();
    let { once: t2, ...n2 } = this.state.options.inViewOptions || {};
    this.removeObserver = ks(e2, (e3, n3) => {
      let r2 = this.state.options;
      if (this.state.setActive("whileInView", !0), r2.onViewportEnter && k.postRender(() => r2.onViewportEnter(n3)), !t2) return () => {
        this.state.setActive("whileInView", !1);
        let e4 = this.state.options.onViewportLeave;
        e4 && k.postRender(() => e4(n3));
      };
    }, n2);
  }
  mount() {
    this.startObserver();
  }
  update() {
    let { props: e2, prevProps: t2 } = this.state.visualElement;
    ["amount", "margin", "root"].some((n2) => e2.inViewOptions?.[n2] !== t2?.inViewOptions?.[n2]) && this.startObserver();
  }
  unmount() {
    this.removeObserver?.(), this.removeObserver = void 0;
  }
};
var xc = class extends Q {
  static #e = this.key = "focus";
  constructor(e2) {
    super(e2), this.isFocused = !1;
  }
  onFocus() {
    let e2 = !1;
    try {
      e2 = this.state.element.matches(":focus-visible");
    } catch {
      e2 = !0;
    }
    e2 && (this.state.setActive("whileFocus", !0), this.isFocused = !0);
  }
  onBlur() {
    this.isFocused &&= (this.state.setActive("whileFocus", !1), !1);
  }
  mount() {
    let e2 = this.state.element;
    this.removeFocus = ie(zo(e2, "focus", () => this.onFocus()), zo(e2, "blur", () => this.onBlur()));
  }
  unmount() {
    this.removeFocus?.(), this.removeFocus = void 0;
  }
};
function Sc(e2) {
  if (e2) return e2.options.allowProjection === !1 ? Sc(e2.parent) : e2.projection;
}
var Cc = { borderRadius: { ...J, applyTo: ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"] }, borderTopLeftRadius: J, borderTopRightRadius: J, borderBottomLeftRadius: J, borderBottomRightRadius: J, boxShadow: Ra };
function wc(e2) {
  return typeof e2 == "object" && !!e2 && "nodeType" in e2;
}
var Tc = typeof window > "u";
var Ec = class extends Q {
  static #e = this.key = "projection";
  constructor(e2) {
    super(e2), Ba(Cc), Tc || this.initProjection();
  }
  initProjection() {
    let e2 = this.state.options;
    this.state.visualElement.projection = new Ds(this.state.visualElement.latestValues, e2["data-framer-portal-id"] ? void 0 : Sc(this.state.visualElement.parent)), this.projection = this.state.visualElement.projection, this.projection.isPresent = !0, this.setOptions();
  }
  setOptions() {
    let e2 = this.state.options, { layoutId: t2, layout: n2, drag: r2 = !1, dragConstraints: i2 = !1 } = e2;
    this.projection?.setOptions({ layout: n2, layoutId: t2, alwaysMeasureLayout: !!t2 || !!r2 || i2 && wc(i2), visualElement: this.state.visualElement, animationType: typeof e2.layout == "string" ? e2.layout : "both", layoutRoot: e2.layoutRoot, layoutScroll: e2.layoutScroll, crossfade: e2.crossfade, onExitComplete: () => {
      !this.projection?.isPresent && this.state.options.layoutId && !this.state.isExiting && queueMicrotask(() => {
        this.state.getFeature("exit")?.completeExitFromProjection();
      });
    } });
  }
  update() {
    this.setOptions();
  }
  mount() {
    this.projection?.mount(this.state.element);
  }
};
function Dc(e2, t2, n2, r2) {
  return zo(e2, t2, vc(n2), r2);
}
var Oc = /* @__PURE__ */ new Set(["auto", "scroll"]);
var kc = class {
  constructor(e2, t2, { transformPagePoint: n2, contextWindow: r2, dragSnapToOrigin: i2 = !1, element: a2 } = {}) {
    if (this.startEvent = null, this.lastMoveEvent = null, this.lastMoveEventInfo = null, this.handlers = {}, this.contextWindow = window, this.scrollPositions = /* @__PURE__ */ new Map(), this.onElementScroll = (e3) => {
      this.handleScroll(e3.target);
    }, this.onWindowScroll = () => {
      this.handleScroll(window);
    }, this.updatePoint = () => {
      if (!(this.lastMoveEvent && this.lastMoveEventInfo)) return;
      let e3 = Mc(this.lastMoveEventInfo, this.history), t3 = this.startEvent !== null, n3 = js(e3.offset, { x: 0, y: 0 }) >= 3;
      if (!t3 && !n3) return;
      let { point: r3 } = e3, { timestamp: i3 } = j;
      this.history.push({ ...r3, timestamp: i3 });
      let { onStart: a3, onMove: o3 } = this.handlers;
      t3 || (a3 && a3(this.lastMoveEvent, e3), this.startEvent = this.lastMoveEvent), o3 && o3(this.lastMoveEvent, e3);
    }, this.handlePointerMove = (e3, t3) => {
      this.lastMoveEvent = e3, this.lastMoveEventInfo = Ac(t3, this.transformPagePoint), k.update(this.updatePoint, !0);
    }, this.handlePointerUp = (e3, t3) => {
      this.end();
      let { onEnd: n3, onSessionEnd: r3, resumeAnimation: i3 } = this.handlers;
      if ((this.dragSnapToOrigin || !this.startEvent) && i3 && i3(), !(this.lastMoveEvent && this.lastMoveEventInfo)) return;
      let a3 = Mc(e3.type === "pointercancel" ? this.lastMoveEventInfo : Ac(t3, this.transformPagePoint), this.history);
      this.startEvent && n3 && n3(e3, a3), r3 && r3(e3, a3);
    }, !gc(e2)) return;
    this.dragSnapToOrigin = i2, this.handlers = t2, this.transformPagePoint = n2, this.contextWindow = r2 || window;
    let o2 = Ac(_c(e2), this.transformPagePoint), { point: s2 } = o2, { timestamp: c2 } = j;
    this.history = [{ ...s2, timestamp: c2 }];
    let { onSessionStart: l2 } = t2;
    l2 && l2(e2, Mc(o2, this.history)), this.removeListeners = ie(Dc(this.contextWindow, "pointermove", this.handlePointerMove), Dc(this.contextWindow, "pointerup", this.handlePointerUp), Dc(this.contextWindow, "pointercancel", this.handlePointerUp)), a2 && this.startScrollTracking(a2);
  }
  isScrollable(e2) {
    let t2 = window.getComputedStyle(e2);
    return t2.overflow === "auto" || t2.overflow === "scroll" || t2.overflowX === "auto" || t2.overflowX === "scroll" || t2.overflowY === "auto" || t2.overflowY === "scroll";
  }
  startScrollTracking(e2) {
    let t2 = e2.parentElement;
    for (; t2; ) {
      let e3 = getComputedStyle(t2);
      (Oc.has(e3.overflowX) || Oc.has(e3.overflowY)) && this.scrollPositions.set(t2, { x: t2.scrollLeft, y: t2.scrollTop }), t2 = t2.parentElement;
    }
    this.scrollPositions.set(window, { x: window.scrollX, y: window.scrollY }), window.addEventListener("scroll", this.onElementScroll, { capture: !0, passive: !0 }), window.addEventListener("scroll", this.onWindowScroll, { passive: !0 }), this.removeScrollListeners = () => {
      window.removeEventListener("scroll", this.onElementScroll, { capture: !0 }), window.removeEventListener("scroll", this.onWindowScroll);
    };
  }
  handleScroll(e2) {
    let t2 = this.scrollPositions.get(e2);
    if (!t2) return;
    let n2 = e2 === window, r2 = n2 ? { x: window.scrollX, y: window.scrollY } : { x: e2.scrollLeft, y: e2.scrollTop }, i2 = { x: r2.x - t2.x, y: r2.y - t2.y };
    (i2.x !== 0 || i2.y !== 0) && (n2 ? this.lastMoveEventInfo && (this.lastMoveEventInfo.point.x += i2.x, this.lastMoveEventInfo.point.y += i2.y) : this.history.length > 0 && (this.history[0].x -= i2.x, this.history[0].y -= i2.y), this.scrollPositions.set(e2, r2), k.update(this.updatePoint, !0));
  }
  updateHandlers(e2) {
    this.handlers = e2;
  }
  end() {
    this.removeListeners && this.removeListeners(), this.removeScrollListeners?.(), this.scrollPositions.clear(), A(this.updatePoint);
  }
};
function Ac(e2, t2) {
  return t2 ? { point: t2(e2.point) } : e2;
}
function jc(e2, t2) {
  return { x: e2.x - t2.x, y: e2.y - t2.y };
}
function Mc({ point: e2 }, t2) {
  return { point: e2, delta: jc(e2, Pc(t2)), offset: jc(e2, Nc(t2)), velocity: Fc(t2, 0.1) };
}
function Nc(e2) {
  return e2[0];
}
function Pc(e2) {
  return e2[e2.length - 1];
}
function Fc(e2, t2) {
  if (e2.length < 2) return { x: 0, y: 0 };
  let n2 = e2.length - 1, r2 = null, i2 = Pc(e2);
  for (; n2 >= 0 && (r2 = e2[n2], !(i2.timestamp - r2.timestamp > D(t2))); ) n2--;
  if (!r2) return { x: 0, y: 0 };
  let a2 = O(i2.timestamp - r2.timestamp);
  if (a2 === 0) return { x: 0, y: 0 };
  let o2 = { x: (i2.x - r2.x) / a2, y: (i2.y - r2.y) / a2 };
  return o2.x === 1 / 0 && (o2.x = 0), o2.y === 1 / 0 && (o2.y = 0), o2;
}
function Ic(e2) {
  return (t2, n2) => {
    e2 && k.postRender(() => e2(t2, n2));
  };
}
var Lc = class extends Q {
  constructor(...e2) {
    super(...e2), this.removePointerDownListener = E;
  }
  static #e = this.key = "pan";
  onPointerDown(e2) {
    this.session = new kc(e2, this.createPanHandlers(), { transformPagePoint: this.state.visualElement.getTransformPagePoint(), contextWindow: Ms(this.state.visualElement) });
  }
  createPanHandlers() {
    return { onSessionStart: Ic((e2, t2) => {
      let { onPanSessionStart: n2 } = this.state.options;
      n2 && n2(e2, t2);
    }), onStart: Ic((e2, t2) => {
      let { onPanStart: n2 } = this.state.options;
      n2 && n2(e2, t2);
    }), onMove: (e2, t2) => {
      let { onPan: n2 } = this.state.options;
      n2 && n2(e2, t2);
    }, onEnd: (e2, t2) => {
      let { onPanEnd: n2 } = this.state.options;
      delete this.session, n2 && k.postRender(() => n2(e2, t2));
    } };
  }
  mount() {
    this.removePointerDownListener = Dc(this.state.element, "pointerdown", this.onPointerDown.bind(this));
  }
  update() {
  }
  unmount() {
    this.removePointerDownListener(), this.session && this.session.end();
  }
};
function Rc(e2) {
  let t2 = null;
  return () => t2 === null && (t2 = e2, () => {
    t2 = null;
  });
}
var zc = Rc("dragHorizontal");
var Bc = Rc("dragVertical");
function Vc(e2) {
  let t2 = !1;
  if (e2 === "y") t2 = Bc();
  else if (e2 === "x") t2 = zc();
  else {
    let e3 = zc(), n2 = Bc();
    e3 && n2 ? t2 = () => {
      e3(), n2();
    } : (e3 && e3(), n2 && n2());
  }
  return t2;
}
function Hc(e2, { min: t2, max: n2 }, r2) {
  return t2 !== void 0 && e2 < t2 ? e2 = r2 ? R(t2, e2, r2.min) : Math.max(e2, t2) : n2 !== void 0 && e2 > n2 && (e2 = r2 ? R(n2, e2, r2.max) : Math.min(e2, n2)), e2;
}
var Uc = 0.35;
function Wc(e2, { top: t2, left: n2, bottom: r2, right: i2 }) {
  return { x: Gc(e2.x, n2, i2), y: Gc(e2.y, t2, r2) };
}
function Gc(e2, t2, n2) {
  return { min: t2 === void 0 ? void 0 : e2.min + t2, max: n2 === void 0 ? void 0 : e2.max + n2 - (e2.max - e2.min) };
}
function Kc(e2 = Uc) {
  return e2 === !1 ? e2 = 0 : e2 === !0 && (e2 = Uc), { x: qc(e2, "left", "right"), y: qc(e2, "top", "bottom") };
}
function qc(e2, t2, n2) {
  return { min: Jc(e2, t2), max: Jc(e2, n2) };
}
function Jc(e2, t2) {
  return typeof e2 == "number" ? e2 : e2[t2] || 0;
}
function Yc(e2, t2) {
  let n2 = {};
  return t2.min !== void 0 && (n2.min = t2.min - e2.min), t2.max !== void 0 && (n2.max = t2.max - e2.min), n2;
}
function Xc(e2, t2) {
  return { x: Zc(e2.x, t2.x), y: Zc(e2.y, t2.y) };
}
function Zc(e2, t2) {
  let n2 = t2.min - e2.min, r2 = t2.max - e2.max;
  return t2.max - t2.min < e2.max - e2.min && ([n2, r2] = [r2, n2]), { min: n2, max: r2 };
}
function Qc(e2, t2) {
  let n2 = 0.5, r2 = X(e2), i2 = X(t2);
  return i2 > r2 ? n2 = ae(t2.min, t2.max - r2, e2.min) : r2 > i2 && (n2 = ae(e2.min, e2.max - i2, t2.min)), w(0, 1, n2);
}
var $c = /* @__PURE__ */ new WeakMap();
var el = class {
  constructor(e2) {
    this.openGlobalLock = null, this.isDragging = !1, this.currentDirection = null, this.originPoint = { x: 0, y: 0 }, this.constraints = !1, this.hasMutatedConstraints = !1, this.elastic = G(), this.state = e2;
  }
  get visualElement() {
    return this.state.visualElement;
  }
  start(e2, { snapToCursor: t2 = !1 } = {}) {
    let n2 = (e3) => {
      t2 ? this.stopAnimation() : this.pauseAnimation(), t2 && this.snapToCursor(_c(e3, "page").point);
    }, r2 = (e3, t3) => {
      this.stopAnimation();
      let { drag: n3, dragPropagation: r3, onDragStart: i3 } = this.getProps();
      n3 && !r3 && (this.openGlobalLock && this.openGlobalLock(), this.openGlobalLock = Vc(n3), !this.openGlobalLock) || (this.isDragging = !0, this.currentDirection = null, this.resolveConstraints(), this.visualElement.projection && (this.visualElement.projection.isAnimationBlocked = !0, this.visualElement.projection.target = void 0), Z((e4) => {
        let t4 = this.getAxisMotionValue(e4).get() || 0;
        if (P.test(t4)) {
          let { projection: n4 } = this.visualElement;
          if (n4 && n4.layout) {
            let r4 = n4.layout.layoutBox[e4];
            r4 && (t4 = X(r4) * (parseFloat(t4) / 100));
          }
        }
        this.originPoint[e4] = t4;
      }), i3 && k.postRender(() => i3(e3, t3)), qr(this.visualElement, "transform"), this.state.setActive("whileDrag", !0));
    }, i2 = (e3, t3) => {
      let { dragPropagation: n3, dragDirectionLock: r3, onDirectionLock: i3, onDrag: a3 } = this.getProps();
      if (!n3 && !this.openGlobalLock) return;
      let { offset: o3 } = t3;
      r3 && this.currentDirection === null ? (this.currentDirection = nl(o3), this.currentDirection !== null && i3 && i3(this.currentDirection)) : (this.updateAxis("x", t3.point, o3), this.updateAxis("y", t3.point, o3), this.visualElement.render(), a3 && a3(e3, t3));
    }, a2 = (e3, t3) => this.stop(e3, t3), o2 = () => Z((e3) => this.getAnimationState(e3) === "paused" && this.getAxisMotionValue(e3).animation?.play()), { dragSnapToOrigin: s2 } = this.getProps();
    this.panSession = new kc(e2, { onSessionStart: n2, onStart: r2, onMove: i2, onSessionEnd: a2, resumeAnimation: o2 }, { transformPagePoint: this.visualElement.getTransformPagePoint(), dragSnapToOrigin: s2, contextWindow: Ms(this.visualElement), element: this.state.element });
  }
  stop(e2, t2) {
    let n2 = this.isDragging;
    if (this.cancel(), !n2) return;
    let { velocity: r2 } = t2;
    this.startAnimation(r2);
    let { onDragEnd: i2 } = this.getProps();
    i2 && k.postRender(() => i2(e2, t2));
  }
  cancel() {
    this.isDragging = !1;
    let { projection: e2 } = this.visualElement;
    e2 && (e2.isAnimationBlocked = !1), this.panSession && this.panSession.end(), this.panSession = void 0;
    let { dragPropagation: t2 } = this.getProps();
    !t2 && this.openGlobalLock && (this.openGlobalLock(), this.openGlobalLock = null), this.state.setActive("whileDrag", !1);
  }
  updateAxis(e2, t2, n2) {
    let { drag: r2 } = this.getProps();
    if (!n2 || !tl(e2, r2, this.currentDirection)) return;
    let i2 = this.getAxisMotionValue(e2), a2 = this.originPoint[e2] + n2[e2];
    this.constraints && this.constraints[e2] && (a2 = Hc(a2, this.constraints[e2], this.elastic[e2])), i2.set(a2);
  }
  resolveConstraints() {
    let { dragConstraints: e2, dragElastic: t2 } = this.getProps(), n2 = this.visualElement.projection && !this.visualElement.projection.layout ? this.visualElement.projection.measure(!1) : this.visualElement.projection?.layout, r2 = this.constraints;
    e2 && wc(e2) ? this.constraints ||= this.resolveRefConstraints() : this.constraints = e2 && n2 ? Wc(n2.layoutBox, e2) : !1, this.elastic = Kc(t2), r2 !== this.constraints && n2 && this.constraints && !this.hasMutatedConstraints && Z((e3) => {
      this.constraints !== !1 && this.getAxisMotionValue(e3) && (this.constraints[e3] = Yc(n2.layoutBox[e3], this.constraints[e3]));
    });
  }
  resolveRefConstraints() {
    let { dragConstraints: e2, onMeasureDragConstraints: t2 } = this.getProps();
    if (!e2 || !wc(e2)) return !1;
    let n2 = e2, { projection: r2 } = this.visualElement;
    if (!r2 || !r2.layout) return !1;
    let i2 = ja(n2, r2.root, this.visualElement.getTransformPagePoint()), a2 = Xc(r2.layout.layoutBox, i2);
    if (t2) {
      let e3 = t2(ma(a2));
      this.hasMutatedConstraints = !!e3, e3 && (a2 = pa(e3));
    }
    return a2;
  }
  startAnimation(e2) {
    let { drag: t2, dragMomentum: n2, dragElastic: r2, dragTransition: i2, dragSnapToOrigin: a2, onDragTransitionEnd: o2 } = this.getProps(), s2 = this.constraints || {}, c2 = Z((o3) => {
      if (!tl(o3, t2, this.currentDirection)) return;
      let c3 = s2 && s2[o3] || {};
      a2 && (c3 = { min: 0, max: 0 });
      let l2 = r2 ? 200 : 1e6, u2 = r2 ? 40 : 1e7, d2 = { type: "inertia", velocity: n2 ? e2[o3] : 0, bounceStiffness: l2, bounceDamping: u2, timeConstant: 750, restDelta: 1, restSpeed: 10, ...i2, ...c3 };
      return this.startAxisValueAnimation(o3, d2);
    });
    return Promise.all(c2).then(o2);
  }
  startAxisValueAnimation(e2, t2) {
    let n2 = this.getAxisMotionValue(e2);
    return qr(this.visualElement, e2), n2.start(Pr(e2, n2, 0, t2, this.visualElement, !1));
  }
  stopAnimation() {
    this.visualElement.projection?.isPresent && Z((e2) => this.getAxisMotionValue(e2).stop());
  }
  pauseAnimation() {
    Z((e2) => this.getAxisMotionValue(e2).animation?.pause());
  }
  getAnimationState(e2) {
    return this.getAxisMotionValue(e2).animation?.state;
  }
  getAxisMotionValue(e2) {
    let t2 = `_drag${e2.toUpperCase()}`, n2 = this.visualElement.getProps();
    return n2[t2] || this.visualElement.getValue(e2, (n2.initial ? n2.initial[e2] : void 0) || 0);
  }
  snapToCursor(e2) {
    Z((t2) => {
      let { drag: n2 } = this.getProps();
      if (!tl(t2, n2, this.currentDirection)) return;
      let { projection: r2 } = this.visualElement, i2 = this.getAxisMotionValue(t2);
      if (r2 && r2.layout) {
        let { min: n3, max: a2 } = r2.layout.layoutBox[t2];
        i2.set(e2[t2] - R(n3, a2, 0.5));
      }
    });
  }
  scalePositionWithinConstraints() {
    if (!this.visualElement.current) return;
    let { drag: e2, dragConstraints: t2 } = this.getProps(), { projection: n2 } = this.visualElement;
    if (!wc(t2) || !n2 || !this.constraints) return;
    this.stopAnimation();
    let r2 = { x: 0, y: 0 };
    Z((e3) => {
      let t3 = this.getAxisMotionValue(e3);
      if (t3 && this.constraints !== !1) {
        let n3 = t3.get();
        r2[e3] = Qc({ min: n3, max: n3 }, this.constraints[e3]);
      }
    });
    let { transformTemplate: i2 } = this.visualElement.getProps();
    this.state.element.style.transform = i2 ? i2({}, "") : "none", n2.root && n2.root.updateScroll(), n2.updateLayout(), this.resolveConstraints(), Z((t3) => {
      if (!tl(t3, e2, null)) return;
      let n3 = this.getAxisMotionValue(t3), { min: i3, max: a2 } = this.constraints[t3];
      n3.set(R(i3, a2, r2[t3]));
    });
  }
  addListeners() {
    if (!this.state.element) return;
    $c.set(this.visualElement, this);
    let e2 = this.state.element, t2 = Dc(e2, "pointerdown", (e3) => {
      let { drag: t3, dragListener: n3 = !0 } = this.getProps();
      t3 && n3 && this.start(e3);
    }), n2 = () => {
      let { dragConstraints: e3 } = this.getProps();
      wc(e3) && (this.constraints = this.resolveRefConstraints());
    }, { projection: r2 } = this.visualElement, i2 = r2.addEventListener("measure", n2);
    r2 && !r2.layout && (r2.root && r2.root.updateScroll(), r2.updateLayout()), k.read(n2);
    let a2 = zo(window, "resize", () => this.scalePositionWithinConstraints()), o2 = r2.addEventListener("didUpdate", (({ delta: e3, hasLayoutChanged: t3 }) => {
      this.isDragging && t3 && (Z((t4) => {
        let n3 = this.getAxisMotionValue(t4);
        n3 && (this.originPoint[t4] += e3[t4].translate, n3.set(n3.get() + e3[t4].translate));
      }), this.visualElement.render());
    }));
    return () => {
      a2(), t2(), i2(), o2 && o2();
    };
  }
  getProps() {
    let e2 = this.visualElement.getProps(), { drag: t2 = !1, dragDirectionLock: n2 = !1, dragPropagation: r2 = !1, dragConstraints: i2 = !1, dragElastic: a2 = Uc, dragMomentum: o2 = !0 } = e2;
    return { ...e2, drag: t2, dragDirectionLock: n2, dragPropagation: r2, dragConstraints: i2, dragElastic: a2, dragMomentum: o2 };
  }
};
function tl(e2, t2, n2) {
  return (t2 === !0 || t2 === e2) && (n2 === null || n2 === e2);
}
function nl(e2, t2 = 10) {
  let n2 = null;
  return Math.abs(e2.y) > t2 ? n2 = "y" : Math.abs(e2.x) > t2 && (n2 = "x"), n2;
}
var rl = { renderer: pc, features: [dc, fc, hc, yc, bc, xc, Ec, Lc, class extends Q {
  static #e = this.key = "drag";
  constructor(e2) {
    super(e2), this.removeGroupControls = E, this.removeListeners = E, this.controls = new el(e2);
  }
  mount() {
    let { dragControls: e2 } = this.state.options;
    e2 && (this.removeGroupControls = e2.subscribe(this.controls)), this.removeListeners = this.controls.addListeners() || E;
  }
  unmount() {
    this.removeGroupControls(), this.removeListeners();
  }
}, class extends Q {
  static #e = this.key = "layout";
  constructor(e2) {
    super(e2), Ba(Cc);
  }
  updatePrevLead(e2) {
    let t2 = this.state.visualElement.projection;
    t2.isPresent !== e2 && (t2.isPresent = e2, e2 ? !t2.isLead() && t2?.promote() : t2.isLead() && t2?.relegate());
  }
  didUpdate() {
    (this.state.options.layout || this.state.options.layoutId || this.state.options.drag) && this.state.visualElement.projection?.root?.didUpdate();
  }
  mount() {
    let e2 = this.state.options, t2 = this.state.options.layoutGroup;
    if (e2.layout || e2.layoutId) {
      let n2 = this.state.visualElement.projection;
      if (e2.layoutId) {
        let e3 = !uc(this.state.element);
        n2.isPresent = e3, e3 ? n2?.promote() : n2?.relegate();
      }
      t2?.group?.add(n2), Go.hasEverUpdated = !0;
    }
    this.didUpdate();
  }
  unmount() {
    let e2 = this.state.options.layoutGroup, t2 = this.state.visualElement.projection;
    t2 && e2?.group && (this.state.options.layout || this.state.options.layoutId) && e2.group.remove(t2);
  }
  getSnapshot(e2) {
    let t2 = this.state.visualElement.projection, { layout: n2, layoutId: i2, drag: a2, layoutDependency: o2 } = this.state.visualElement.props, s2 = this.state.visualElement.prevProps;
    t2 && (n2 || i2 || a2) && ((a2 || s2.layoutDependency !== o2 || o2 === void 0 || e2 !== t2.isPresent) && t2.willUpdate(), i2 && this.updatePrevLead(e2), r(() => {
      this.didUpdate();
    }));
  }
}] };
var [il, al] = b("LazyMotionContext");
var [ol, sl, cl] = b("AnimatePresenceContext");
function ll(e2) {
  return e2.replace(/([A-Z])/g, (e3) => `-${e3.toLowerCase()}`);
}
function ul() {
  return { transform: {}, transformOrigin: {}, style: {}, vars: {} };
}
function dl() {
  return { ...ul(), attrs: {} };
}
function fl(e2) {
  let t2 = ul();
  Fa(t2, e2);
  let n2 = { ...t2.style };
  for (let e3 in t2.vars) n2[e3] = t2.vars[e3];
  return Object.keys(n2).length === 0 ? null : n2;
}
function pl(e2, t2, n2) {
  let r2 = dl();
  Ya(r2, e2, Za(t2), void 0, n2);
  let i2 = {};
  for (let e3 in r2.attrs) {
    let t3 = Xa.has(e3) ? e3 : ll(e3);
    i2[t3] = r2.attrs[e3];
  }
  return { attrs: i2, style: { ...r2.style, ...r2.vars } };
}
function ml(t2, n2 = {}) {
  let r2 = Ps(null), i2 = Ls({}), s2 = Ws(), f2 = ol({}), p2 = il({ features: l({}), strict: !1 }), m2 = g();
  function _2() {
    return x(t2, { layoutGroup: i2, presenceContext: f2, config: s2.value });
  }
  function b2() {
    return { ...m2, ..._2() };
  }
  let S2 = new Qs(b2(), r2, n2);
  Fs(S2), h(p2.features, (e2) => {
    S2.setBundle(e2);
  }, { immediate: !0, flush: "pre" });
  function C2() {
    let e2 = S2.type === "svg", n3 = { ...m2 };
    Object.keys(m2).forEach((e3) => {
      W(m2[e3]) && (n3[e3] = m2[e3].get());
    });
    let r3 = S2.visualElement?.latestValues || S2.latestValues, i3 = { ...t2.style, ...e2 ? {} : r3 };
    for (let e3 in i3) W(i3[e3]) && (i3[e3] = i3[e3].get());
    if (e2) {
      let { attrs: e3, style: a3 } = pl({ ...r3, ...i3 }, S2.options.as, t2.style);
      Object.assign(n3, e3), i3 = a3;
    }
    t2.drag && t2.dragListener !== !1 && Object.assign(i3, { userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none", touchAction: t2.drag === !0 ? "none" : `pan-${t2.drag === "x" ? "y" : "x"}` });
    let a2 = fl(i3);
    return a2 && (n3.style = a2), n3;
  }
  let w2 = v()?.proxy;
  function T2() {
    let e2 = Ns(w2?.$el);
    S2.mount(e2);
  }
  c(() => {
    S2.updateOptions(b2()), S2.beforeUnmount();
  }), d(T2);
  function ee2() {
    Ns(w2?.$el)?.isConnected || S2.unmount();
  }
  return a(ee2), e(ee2), o(() => {
    S2.isMounted() || T2();
  }), y(() => {
    S2.updateOptions(b2()), S2.beforeUpdate();
  }), u(() => {
    S2.update();
  }), { getProps: _2, getAttrs: C2, layoutGroup: i2, state: S2 };
}
var hl = { ignoreStrict: { type: Boolean }, forwardMotionProps: { type: Boolean, default: !1 }, asChild: { type: Boolean, default: !1 }, whileDrag: { type: [String, Array, Object] }, whileHover: { type: [String, Array, Object] }, whilePress: { type: [String, Array, Object] }, whileInView: { type: [String, Array, Object] }, whileFocus: { type: [String, Array, Object] }, custom: { type: [String, Number, Object, Array] }, initial: { type: [String, Array, Object, Boolean], default: void 0 }, animate: { type: [String, Array, Object], default: void 0 }, exit: { type: [String, Array, Object] }, variants: { type: Object }, inherit: { type: Boolean }, style: { type: Object }, transformTemplate: { type: Function }, transition: { type: Object }, onAnimationComplete: { type: Function }, onUpdate: { type: Function }, layout: { type: [Boolean, String], default: !1 }, layoutId: { type: String, default: void 0 }, layoutScroll: { type: Boolean, default: !1 }, layoutRoot: { type: Boolean, default: !1 }, "data-framer-portal-id": { type: String }, crossfade: { type: Boolean, default: !0 }, layoutDependency: { type: null, default: void 0 }, onBeforeLayoutMeasure: { type: Function }, onLayoutMeasure: { type: Function }, onLayoutAnimationStart: { type: Function }, onLayoutAnimationComplete: { type: Function }, globalPressTarget: { type: Boolean }, onPressStart: { type: Function }, onPress: { type: Function }, onPressCancel: { type: Function }, onHoverStart: { type: Function }, onHoverEnd: { type: Function }, inViewOptions: { type: Object }, onViewportEnter: { type: Function }, onViewportLeave: { type: Function }, drag: { type: [Boolean, String] }, dragSnapToOrigin: { type: Boolean }, dragDirectionLock: { type: Boolean }, dragPropagation: { type: Boolean }, dragConstraints: { type: [Boolean, Object] }, dragElastic: { type: [Boolean, Number, Object], default: 0.5 }, dragMomentum: { type: Boolean, default: !0 }, dragTransition: { type: Object }, dragListener: { type: Boolean, default: !0 }, dragControls: { type: Object }, onDragStart: { type: Function }, onDragEnd: { type: Function }, onDrag: { type: Function }, onDirectionLock: { type: Function }, onDragTransitionEnd: { type: Function }, onMeasureDragConstraints: { type: Function }, onPanSessionStart: { type: Function }, onPanStart: { type: Function }, onPan: { type: Function }, onPanEnd: { type: Function } };
var gl = /* @__PURE__ */ new Map();
var _l = /* @__PURE__ */ new Map();
function vl(e2) {
  if (!Array.isArray(e2)) return [e2];
  let t2 = [];
  for (let n2 of e2) Array.isArray(n2) ? t2.push(...n2) : t2.push(n2);
  return t2;
}
var yl = ["area", "img", "input"];
function bl(e2, t2, r2) {
  if (typeof e2 == "string" && yl.includes(e2)) return n(e2, t2);
  if (e2 === "template") {
    if (!r2.default) return null;
    let e3 = vl(r2.default()), n2 = e3.findIndex((e4) => e4.type !== m);
    if (n2 === -1) return e3;
    let i2 = e3[n2];
    delete i2.props?.ref;
    let a2 = i2.props ? s(t2, i2.props) : t2;
    t2.class && i2.props?.class && delete i2.props.class;
    let o2 = _(i2, a2);
    for (let e4 in a2) e4.startsWith("on") && (o2.props ||= {}, o2.props[e4] = a2[e4]);
    return e3.length === 1 ? o2 : (e3[n2] = o2, e3);
  }
  return null;
}
function xl(e2, r2 = {}) {
  let i2 = typeof e2 == "string", a2 = i2 ? e2 : e2.name || "", o2 = r2.renderer ? gl : _l;
  if (i2 && o2.has(e2)) return o2.get(e2);
  let s2 = t({ inheritAttrs: !1, props: { ...hl, as: { type: [String, Object], default: e2 || "div" } }, name: a2 ? `motion.${a2}` : "Motion", setup(e3, { slots: t2 }) {
    let { getProps: i3, getAttrs: a3, state: o3 } = ml(e3, r2);
    function s3() {
      let t3 = o3.element;
      if ((typeof e3.as != "object" || e3.asChild) && t3) {
        let { style: e4 } = a3();
        if (e4) for (let [n2, r3] of Object.entries(e4)) t3.style[n2] = r3;
      }
    }
    return () => {
      let r3 = i3(), o4 = a3(), c2 = e3.asChild ? "template" : e3.as, l2 = { ...e3.forwardMotionProps ? r3 : {}, ...o4, onVnodeUpdated: s3 }, u2 = bl(c2, l2, t2);
      return u2 === null ? n(c2, { ...l2 }, t2) : u2;
    };
  } });
  return i2 && o2.set(e2, s2), s2;
}
function Sl(e2) {
  return new Proxy({}, { get(t2, n2) {
    return n2 === "create" ? (t3, n3) => xl(t3, { ...n3, ...e2 }) : xl(n2, { ...e2 });
  } });
}
var Cl = Sl(rl);
export {Ws as i,Cl as n,k as o,sl as r};