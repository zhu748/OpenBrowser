import {C as e,Ct as t,D as n,F as r,G as i,St as a,Tt as o,bt as s,d as c,jt as l,k as u,st as d} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {_ as f,a as p,c as m,d as h,f as g,g as ee,h as _,l as v,m as y,o as b,p as te,s as x,u as S,v as ne,x as C} from "./rich-html-link-VdBpR3Cm.js";
var w = typeof document < "u";
var re = /#/g;
var ie = /&/g;
var ae = /\//g;
var oe = /=/g;
var se = /\?/g;
var T = /\+/g;
var E = /%5B/g;
var D = /%5D/g;
var O = /%5E/g;
var ce = /%60/g;
var k = /%7B/g;
var A = /%7C/g;
var j = /%7D/g;
var M = /%20/g;
function N(e2) {
  return e2 == null ? "" : encodeURI("" + e2).replace(A, "|").replace(E, "[").replace(D, "]");
}
function le(e2) {
  return N(e2).replace(k, "{").replace(j, "}").replace(O, "^");
}
function P(e2) {
  return N(e2).replace(T, "%2B").replace(M, "+").replace(re, "%23").replace(ie, "%26").replace(ce, "`").replace(k, "{").replace(j, "}").replace(O, "^");
}
function F(e2) {
  return P(e2).replace(oe, "%3D");
}
function I(e2) {
  return N(e2).replace(re, "%23").replace(se, "%3F");
}
function ue(e2) {
  return I(e2).replace(ae, "%2F");
}
function L(e2) {
  if (e2 == null) return null;
  try {
    return decodeURIComponent("" + e2);
  } catch {
  }
  return "" + e2;
}
var de = /\/$/;
var R = (e2) => e2.replace(de, "");
function z(e2, t2, n2 = "/") {
  let r2, i2 = {}, a2 = "", o2 = "", s2 = t2.indexOf("#"), c2 = t2.indexOf("?");
  return c2 = s2 >= 0 && c2 > s2 ? -1 : c2, c2 >= 0 && (r2 = t2.slice(0, c2), a2 = t2.slice(c2, s2 > 0 ? s2 : t2.length), i2 = e2(a2.slice(1))), s2 >= 0 && (r2 ||= t2.slice(0, s2), o2 = t2.slice(s2, t2.length)), r2 = W(r2 ?? t2, n2), { fullPath: r2 + a2 + o2, path: r2, query: i2, hash: L(o2) };
}
function fe(e2, t2) {
  let n2 = t2.query ? e2(t2.query) : "";
  return t2.path + (n2 && "?") + n2 + (t2.hash || "");
}
function B(e2, t2) {
  return !t2 || !e2.toLowerCase().startsWith(t2.toLowerCase()) ? e2 : e2.slice(t2.length) || "/";
}
function pe(e2, t2, n2) {
  let r2 = t2.matched.length - 1, i2 = n2.matched.length - 1;
  return r2 > -1 && r2 === i2 && V(t2.matched[r2], n2.matched[i2]) && H(t2.params, n2.params) && e2(t2.query) === e2(n2.query) && t2.hash === n2.hash;
}
function V(e2, t2) {
  return (e2.aliasOf || e2) === (t2.aliasOf || t2);
}
function H(e2, t2) {
  if (Object.keys(e2).length !== Object.keys(t2).length) return !1;
  for (var n2 in e2) if (!me(e2[n2], t2[n2])) return !1;
  return !0;
}
function me(e2, t2) {
  return v(e2) ? U(e2, t2) : v(t2) ? U(t2, e2) : (e2 && e2.valueOf()) === (t2 && t2.valueOf());
}
function U(e2, t2) {
  return v(t2) ? e2.length === t2.length && e2.every((e3, n2) => e3 === t2[n2]) : e2.length === 1 && e2[0] === t2;
}
function W(e2, t2) {
  if (m(e2)) return e2;
  if (!e2) return t2;
  let n2 = t2.split("/"), r2 = e2.split("/"), i2 = r2[r2.length - 1];
  (i2 === ".." || i2 === ".") && r2.push("");
  let a2 = n2.length - 1, o2, s2;
  for (o2 = 0; o2 < r2.length; o2++) if (s2 = r2[o2], s2 !== ".")
    if (s2 === "..") a2 > 1 && a2--;
    else break;
  return n2.slice(0, a2).join("/") + "/" + r2.slice(o2).join("/");
}
var G = { path: "/", name: void 0, params: {}, query: {}, hash: "", fullPath: "/", matched: [], meta: {}, redirectedFrom: void 0 };
function K(e2) {
  if (!e2)
    if (w) {
      let t2 = document.querySelector("base");
      e2 = t2 && t2.getAttribute("href") || "/", e2 = e2.replace(/^\w+:\/\/[^/]+/, "");
    } else e2 = "/";
  return e2[0] !== "/" && e2[0] !== "#" && (e2 = "/" + e2), R(e2);
}
var q = /^[^#]+#/;
function J(e2, t2) {
  return e2.replace(q, "#") + t2;
}
function Y(e2, t2) {
  let n2 = document.documentElement.getBoundingClientRect(), r2 = e2.getBoundingClientRect();
  return { behavior: t2.behavior, left: r2.left - n2.left - (t2.left || 0), top: r2.top - n2.top - (t2.top || 0) };
}
var X = () => history.scrollRestoration === "manual" ? { left: window.scrollX, top: window.scrollY } : null;
function he(e2) {
  let t2;
  if ("el" in e2) {
    let n2 = e2.el, r2 = typeof n2 == "string" && n2.startsWith("#"), i2 = typeof n2 == "string" ? r2 ? document.getElementById(n2.slice(1)) : document.querySelector(n2) : n2;
    if (!i2) return;
    t2 = Y(i2, e2);
  } else t2 = e2;
  "scrollBehavior" in document.documentElement.style ? window.scrollTo(t2) : window.scrollTo(t2.left == null ? window.scrollX : t2.left, t2.top == null ? window.scrollY : t2.top);
}
function ge(e2, t2) {
  return (history.state ? history.state.position - t2 : -1) + e2;
}
var _e = /* @__PURE__ */ new Map();
function ve(e2) {
  _e.set(e2, X());
}
function ye(e2) {
  let t2 = _e.get(e2);
  return _e.delete(e2), t2;
}
function be(e2) {
  return typeof e2 == "string" || e2 && typeof e2 == "object";
}
function xe(e2) {
  return typeof e2 == "string" || typeof e2 == "symbol";
}
function Se(e2) {
  let t2 = {};
  if (e2 === "" || e2 === "?") return t2;
  let n2 = (e2[0] === "?" ? e2.slice(1) : e2).split("&");
  for (let e3 = 0; e3 < n2.length; ++e3) {
    let r2 = n2[e3].replace(T, " "), i2 = r2.indexOf("="), a2 = L(i2 < 0 ? r2 : r2.slice(0, i2)), o2 = i2 < 0 ? null : L(r2.slice(i2 + 1));
    if (a2 in t2) {
      let e4 = t2[a2];
      v(e4) || (e4 = t2[a2] = [e4]), e4.push(o2);
    } else t2[a2] = o2;
  }
  return t2;
}
function Ce(e2) {
  let t2 = "";
  for (let n2 in e2) {
    let r2 = e2[n2];
    n2 = F(n2), r2 == null ? r2 !== void 0 && (t2 += (t2.length ? "&" : "") + n2) : (v(r2) ? r2.map((e3) => e3 && P(e3)) : [r2 && P(r2)]).forEach((e3) => {
      e3 !== void 0 && (t2 += (t2.length ? "&" : "") + n2, e3 != null && (t2 += "=" + e3));
    });
  }
  return t2;
}
function we(e2) {
  let t2 = {};
  for (let n2 in e2) {
    let r2 = e2[n2];
    r2 !== void 0 && (t2[n2] = v(r2) ? r2.map((e3) => e3 == null ? null : "" + e3) : r2 == null ? r2 : "" + r2);
  }
  return t2;
}
function Z() {
  let e2 = [];
  function t2(t3) {
    return e2.push(t3), () => {
      let n3 = e2.indexOf(t3);
      n3 > -1 && e2.splice(n3, 1);
    };
  }
  function n2() {
    e2 = [];
  }
  return { add: t2, list: () => e2.slice(), reset: n2 };
}
function Q(e2, t2, n2, r2, i2, a2 = (e3) => e3()) {
  let o2 = r2 && (r2.enterCallbacks[i2] = r2.enterCallbacks[i2] || []);
  return () => new Promise((s2, c2) => {
    let l2 = (e3) => {
      e3 === !1 ? c2(x(4, { from: n2, to: t2 })) : e3 instanceof Error ? c2(e3) : be(e3) ? c2(x(2, { from: t2, to: e3 })) : (o2 && r2.enterCallbacks[i2] === o2 && typeof e3 == "function" && o2.push(e3), s2());
    }, u2 = a2(() => e2.call(r2 && r2.instances[i2], t2, n2, l2)), d2 = Promise.resolve(u2);
    e2.length < 3 && (d2 = d2.then(l2)), d2.catch((e3) => c2(e3));
  });
}
function $(e2, t2, n2, r2, i2 = (e3) => e3()) {
  let a2 = [];
  for (let o2 of e2) for (let e3 in o2.components) {
    let s2 = o2.components[e3];
    if (t2 === "beforeRouteEnter" || o2.instances[e3])
      if (g(s2)) {
        let c2 = (s2.__vccOpts || s2)[t2];
        c2 && a2.push(Q(c2, n2, r2, o2, e3, i2));
      } else {
        let c2 = s2();
        a2.push(() => c2.then((a3) => {
          if (!a3) throw Error(`Couldn't resolve component "${e3}" at "${o2.path}"`);
          let s3 = S(a3) ? a3.default : a3;
          o2.mods[e3] = a3, o2.components[e3] = s3;
          let c3 = (s3.__vccOpts || s3)[t2];
          return c3 && Q(c3, n2, r2, o2, e3, i2)();
        }));
      }
  }
  return a2;
}
function Te(e2, t2) {
  let n2 = [], r2 = [], i2 = [], a2 = Math.max(t2.matched.length, e2.matched.length);
  for (let o2 = 0; o2 < a2; o2++) {
    let a3 = t2.matched[o2];
    a3 && (e2.matched.find((e3) => V(e3, a3)) ? r2.push(a3) : n2.push(a3));
    let s2 = e2.matched[o2];
    s2 && (t2.matched.find((e3) => V(e3, s2)) || i2.push(s2));
  }
  return [n2, r2, i2];
}
var Ee = () => location.protocol + "//" + location.host;
function De(e2, t2) {
  let { pathname: n2, search: r2, hash: i2 } = t2, a2 = e2.indexOf("#");
  if (a2 > -1) {
    let t3 = i2.includes(e2.slice(a2)) ? e2.slice(a2).length : 1, n3 = i2.slice(t3);
    return n3[0] !== "/" && (n3 = "/" + n3), B(n3, "");
  }
  return B(n2, e2) + r2 + i2;
}
function Oe(e2, t2, n2, r2) {
  let i2 = [], a2 = [], o2 = null, s2 = ({ state: a3 }) => {
    let s3 = De(e2, location), c3 = n2.value, l3 = t2.value, u3 = 0;
    if (a3) {
      if (n2.value = s3, t2.value = a3, o2 && o2 === c3) {
        o2 = null;
        return;
      }
      u3 = l3 ? a3.position - l3.position : 0;
    } else r2(s3);
    i2.forEach((e3) => {
      e3(n2.value, c3, { delta: u3, type: "pop", direction: u3 ? u3 > 0 ? "forward" : "back" : "" });
    });
  };
  function c2() {
    o2 = n2.value;
  }
  function l2(e3) {
    i2.push(e3);
    let t3 = () => {
      let t4 = i2.indexOf(e3);
      t4 > -1 && i2.splice(t4, 1);
    };
    return a2.push(t3), t3;
  }
  function u2() {
    let { history: e3 } = window;
    e3.state && e3.replaceState(b({}, e3.state, { scroll: X() }), "");
  }
  function d2() {
    for (let e3 of a2) e3();
    a2 = [], window.removeEventListener("popstate", s2), window.removeEventListener("pagehide", u2);
  }
  return window.addEventListener("popstate", s2), window.addEventListener("pagehide", u2), { pauseListeners: c2, listen: l2, destroy: d2 };
}
function ke(e2, t2, n2, r2 = !1) {
  return { back: e2, current: t2, forward: n2, replaced: r2, position: window.history.length, scroll: null };
}
function Ae(e2) {
  let { history: t2, location: n2 } = window, r2 = { value: De(e2, n2) }, i2 = { value: t2.state };
  i2.value || a2(r2.value, { back: null, current: r2.value, forward: null, position: t2.length - 1, replaced: !0, scroll: null }, !0);
  function a2(r3, a3, o3) {
    let s3 = e2.indexOf("#"), c2 = s3 > -1 ? (n2.host && document.querySelector("base") ? e2 : e2.slice(s3)) + r3 : Ee() + e2 + r3;
    try {
      t2[o3 ? "replaceState" : "pushState"](a3, "", c2), i2.value = a3;
    } catch (e3) {
      console.error(e3), n2[o3 ? "replace" : "assign"](c2);
    }
  }
  function o2(e3, n3) {
    a2(e3, b({}, t2.state, ke(i2.value.back, e3, i2.value.forward, !0), n3, { position: i2.value.position }), !0), r2.value = e3;
  }
  function s2(e3, n3) {
    let o3 = b({}, i2.value, t2.state, { forward: e3, scroll: X() });
    a2(o3.current, o3, !0), a2(e3, b({}, ke(r2.value, e3, null), { position: o3.position + 1 }, n3), !1), r2.value = e3;
  }
  return { location: r2, state: i2, push: s2, replace: o2 };
}
function je(e2) {
  e2 = K(e2);
  let t2 = Ae(e2), n2 = Oe(e2, t2.state, t2.location, t2.replace);
  function r2(e3, t3 = !0) {
    t3 || n2.pauseListeners(), history.go(e3);
  }
  let i2 = b({ location: "", base: e2, go: r2, createHref: J.bind(null, e2) }, t2, n2);
  return Object.defineProperty(i2, "location", { enumerable: !0, get: () => t2.location.value }), Object.defineProperty(i2, "state", { enumerable: !0, get: () => t2.state.value }), i2;
}
function Me(e2) {
  return e2 = location.host ? e2 || location.pathname + location.search : "", e2.includes("#") || (e2 += "#"), je(e2);
}
var Ne = { type: 0, value: "" };
var Pe = /[a-zA-Z0-9_]/;
function Fe(e2) {
  if (!e2) return [[]];
  if (e2 === "/") return [[Ne]];
  if (!m(e2)) throw Error(`Invalid path "${e2}"`);
  function t2(e3) {
    throw Error(`ERR (${n2})/"${l2}": ${e3}`);
  }
  let n2 = 0, r2 = n2, i2 = [], a2;
  function o2() {
    a2 && i2.push(a2), a2 = [];
  }
  let s2 = 0, c2, l2 = "", u2 = "";
  function d2() {
    l2 &&= (n2 === 0 ? a2.push({ type: 0, value: l2 }) : n2 === 1 || n2 === 2 || n2 === 3 ? (a2.length > 1 && (c2 === "*" || c2 === "+") && t2(`A repeatable param (${l2}) must be alone in its segment. eg: '/:ids+.`), a2.push({ type: 1, value: l2, regexp: u2, repeatable: c2 === "*" || c2 === "+", optional: c2 === "*" || c2 === "?" })) : t2("Invalid state to consume buffer"), "");
  }
  function f2() {
    l2 += c2;
  }
  for (; s2 < e2.length; ) switch (c2 = e2[s2++], n2) {
    case 0:
      c2 === "\\" ? (r2 = n2, n2 = 4) : c2 === "/" ? (l2 && d2(), o2()) : c2 === ":" ? (d2(), n2 = 1) : f2();
      break;
    case 4:
      f2(), n2 = r2;
      break;
    case 1:
      c2 === "(" ? n2 = 2 : Pe.test(c2) ? f2() : (d2(), n2 = 0, c2 !== "*" && c2 !== "?" && c2 !== "+" && s2--);
      break;
    case 2:
      c2 === ")" ? u2[u2.length - 1] == "\\" ? u2 = u2.slice(0, -1) + c2 : n2 = 3 : u2 += c2;
      break;
    case 3:
      d2(), n2 = 0, c2 !== "*" && c2 !== "?" && c2 !== "+" && s2--, u2 = "";
      break;
    default:
      t2("Unknown state");
  }
  return n2 === 2 && t2(`Unfinished custom RegExp for param "${l2}"`), d2(), o2(), i2;
}
var Ie = "[^/]+?";
var Le = { sensitive: !1, strict: !1, start: !0, end: !0 };
var Re = /[.+*?^${}()[\]/\\]/g;
function ze(e2, t2) {
  let n2 = b({}, Le, t2), r2 = [], i2 = n2.start ? "^" : "", a2 = [];
  for (let t3 of e2) {
    let e3 = t3.length ? [] : [90];
    n2.strict && !t3.length && (i2 += "/");
    for (let r3 = 0; r3 < t3.length; r3++) {
      let o3 = t3[r3], s3 = 40 + (n2.sensitive ? 0.25 : 0);
      if (o3.type === 0) r3 || (i2 += "/"), i2 += o3.value.replace(Re, "\\$&"), s3 += 40;
      else if (o3.type === 1) {
        let { value: e4, repeatable: n3, optional: c3, regexp: l2 } = o3;
        a2.push({ name: e4, repeatable: n3, optional: c3 });
        let u2 = l2 || Ie;
        if (u2 !== Ie) {
          s3 += 10;
          try {
            RegExp(`(${u2})`);
          } catch (t4) {
            throw Error(`Invalid custom RegExp for param "${e4}" (${u2}): ` + t4.message);
          }
        }
        let d2 = n3 ? `((?:${u2})(?:/(?:${u2}))*)` : `(${u2})`;
        r3 || (d2 = c3 && t3.length < 2 ? `(?:/${d2})` : "/" + d2), c3 && (d2 += "?"), i2 += d2, s3 += 20, c3 && (s3 += -8), n3 && (s3 += -20), u2 === ".*" && (s3 += -50);
      }
      e3.push(s3);
    }
    r2.push(e3);
  }
  if (n2.strict && n2.end) {
    let e3 = r2.length - 1;
    r2[e3][r2[e3].length - 1] += 0.7000000000000001;
  }
  n2.strict || (i2 += "/?"), n2.end ? i2 += "$" : n2.strict && !i2.endsWith("/") && (i2 += "(?:/|$)");
  let o2 = new RegExp(i2, n2.sensitive ? "" : "i");
  function s2(e3) {
    let t3 = e3.match(o2), n3 = {};
    if (!t3) return null;
    for (let e4 = 1; e4 < t3.length; e4++) {
      let r3 = t3[e4] || "", i3 = a2[e4 - 1];
      n3[i3.name] = r3 && i3.repeatable ? r3.split("/") : r3;
    }
    return n3;
  }
  function c2(t3) {
    let n3 = "", r3 = !1;
    for (let i3 of e2) {
      r3 && n3.endsWith("/") || (n3 += "/"), r3 = !1;
      for (let e3 of i3) if (e3.type === 0) n3 += e3.value;
      else if (e3.type === 1) {
        let { value: a3, repeatable: o3, optional: s3 } = e3, c3 = a3 in t3 ? t3[a3] : "";
        if (v(c3) && !o3) throw Error(`Provided param "${a3}" is an array but it is not repeatable (* or + modifiers)`);
        let l2 = v(c3) ? c3.join("/") : c3;
        if (!l2)
          if (s3) i3.length < 2 && (n3.endsWith("/") ? n3 = n3.slice(0, -1) : r3 = !0);
          else throw Error(`Missing required param "${a3}"`);
        n3 += l2;
      }
    }
    return n3 || "/";
  }
  return { re: o2, score: r2, keys: a2, parse: s2, stringify: c2 };
}
function Be(e2, t2) {
  let n2 = 0;
  for (; n2 < e2.length && n2 < t2.length; ) {
    let r2 = t2[n2] - e2[n2];
    if (r2) return r2;
    n2++;
  }
  return e2.length < t2.length ? e2.length === 1 && e2[0] === 80 ? -1 : 1 : e2.length > t2.length ? t2.length === 1 && t2[0] === 80 ? 1 : -1 : 0;
}
function Ve(e2, t2) {
  let n2 = 0, r2 = e2.score, i2 = t2.score;
  for (; n2 < r2.length && n2 < i2.length; ) {
    let e3 = Be(r2[n2], i2[n2]);
    if (e3) return e3;
    n2++;
  }
  if (Math.abs(i2.length - r2.length) === 1) {
    if (He(r2)) return 1;
    if (He(i2)) return -1;
  }
  return i2.length - r2.length;
}
function He(e2) {
  let t2 = e2[e2.length - 1];
  return e2.length > 0 && t2[t2.length - 1] < 0;
}
var Ue = { strict: !1, end: !0, sensitive: !1 };
function We(e2, t2, n2) {
  let r2 = ze(Fe(e2.path), n2), i2 = b(r2, { record: e2, parent: t2, children: [], alias: [] });
  return t2 && !i2.record.aliasOf == !t2.record.aliasOf && t2.children.push(i2), i2;
}
function Ge(e2, t2) {
  let n2 = [], r2 = /* @__PURE__ */ new Map();
  t2 = y(Ue, t2);
  function i2(e3) {
    return r2.get(e3);
  }
  function a2(e3, n3, r3) {
    let i3 = !r3, s3 = qe(e3);
    s3.aliasOf = r3 && r3.record;
    let l3 = y(t2, e3), u3 = [s3];
    if ("alias" in e3) {
      let t3 = typeof e3.alias == "string" ? [e3.alias] : e3.alias;
      for (let e4 of t3) u3.push(qe(b({}, s3, { components: r3 ? r3.record.components : s3.components, path: e4, aliasOf: r3 ? r3.record : s3 })));
    }
    let d2, f2;
    for (let t3 of u3) {
      let { path: u4 } = t3;
      if (n3 && !m(u4)) {
        let e4 = n3.record.path, r4 = e4[e4.length - 1] === "/" ? "" : "/";
        t3.path = n3.record.path + (u4 && r4 + u4);
      }
      if (d2 = We(t3, n3, l3), r3 ? r3.alias.push(d2) : (f2 ||= d2, f2 !== d2 && f2.alias.push(d2), i3 && e3.name && !Ye(d2) && o2(e3.name)), $e(d2) && c2(d2), s3.children) {
        let e4 = s3.children;
        for (let t4 = 0; t4 < e4.length; t4++) a2(e4[t4], d2, r3 && r3.children[t4]);
      }
      r3 ||= d2;
    }
    return f2 ? () => {
      o2(f2);
    } : _;
  }
  function o2(e3) {
    if (xe(e3)) {
      let t3 = r2.get(e3);
      t3 && (r2.delete(e3), n2.splice(n2.indexOf(t3), 1), t3.children.forEach(o2), t3.alias.forEach(o2));
    } else {
      let t3 = n2.indexOf(e3);
      t3 > -1 && (n2.splice(t3, 1), e3.record.name && r2.delete(e3.record.name), e3.children.forEach(o2), e3.alias.forEach(o2));
    }
  }
  function s2() {
    return n2;
  }
  function c2(e3) {
    let t3 = Ze(e3, n2);
    n2.splice(t3, 0, e3), e3.record.name && !Ye(e3) && r2.set(e3.record.name, e3);
  }
  function l2(e3, t3) {
    let i3, a3 = {}, o3, s3;
    if ("name" in e3 && e3.name) {
      if (i3 = r2.get(e3.name), !i3) throw x(1, { location: e3 });
      s3 = i3.record.name, a3 = b(Ke(t3.params, i3.keys.filter((e4) => !e4.optional).concat(i3.parent ? i3.parent.keys.filter((e4) => e4.optional) : []).map((e4) => e4.name)), e3.params && Ke(e3.params, i3.keys.map((e4) => e4.name))), o3 = i3.stringify(a3);
    } else if (e3.path != null) o3 = e3.path, i3 = n2.find((e4) => e4.re.test(o3)), i3 && (a3 = i3.parse(o3), s3 = i3.record.name, i3.keys.forEach((e4) => {
      e4.optional && !a3[e4.name] && delete a3[e4.name];
    }));
    else {
      if (i3 = t3.name ? r2.get(t3.name) : n2.find((e4) => e4.re.test(t3.path)), !i3) throw x(1, { location: e3, currentLocation: t3 });
      s3 = i3.record.name, a3 = b({}, t3.params, e3.params), o3 = i3.stringify(a3);
    }
    let c3 = [], l3 = i3;
    for (; l3; ) c3.unshift(l3.record), l3 = l3.parent;
    return { name: s3, path: o3, params: a3, matched: c3, meta: Xe(c3) };
  }
  e2.forEach((e3) => a2(e3));
  function u2() {
    n2.length = 0, r2.clear();
  }
  return { addRoute: a2, resolve: l2, removeRoute: o2, clearRoutes: u2, getRoutes: s2, getRecordMatcher: i2 };
}
function Ke(e2, t2) {
  let n2 = {};
  for (let r2 of t2) r2 in e2 && (n2[r2] = e2[r2]);
  return n2;
}
function qe(e2) {
  let t2 = { path: e2.path, redirect: e2.redirect, name: e2.name, meta: e2.meta || {}, aliasOf: e2.aliasOf, beforeEnter: e2.beforeEnter, props: Je(e2), children: e2.children || [], instances: {}, leaveGuards: /* @__PURE__ */ new Set(), updateGuards: /* @__PURE__ */ new Set(), enterCallbacks: {}, components: "components" in e2 ? e2.components || null : e2.component && { default: e2.component } };
  return Object.defineProperty(t2, "mods", { value: {} }), t2;
}
function Je(e2) {
  let t2 = {}, n2 = e2.props || !1;
  if ("component" in e2) t2.default = n2;
  else for (let r2 in e2.components) t2[r2] = typeof n2 == "object" ? n2[r2] : n2;
  return t2;
}
function Ye(e2) {
  for (; e2; ) {
    if (e2.record.aliasOf) return !0;
    e2 = e2.parent;
  }
  return !1;
}
function Xe(e2) {
  return e2.reduce((e3, t2) => b(e3, t2.meta), {});
}
function Ze(e2, t2) {
  let n2 = 0, r2 = t2.length;
  for (; n2 !== r2; ) {
    let i3 = n2 + r2 >> 1;
    Ve(e2, t2[i3]) < 0 ? r2 = i3 : n2 = i3 + 1;
  }
  let i2 = Qe(e2);
  return i2 && (r2 = t2.lastIndexOf(i2, r2 - 1)), r2;
}
function Qe(e2) {
  let t2 = e2;
  for (; t2 = t2.parent; ) if ($e(t2) && Ve(e2, t2) === 0) return t2;
}
function $e({ record: e2 }) {
  return !!(e2.name || e2.components && Object.keys(e2.components).length || e2.redirect);
}
function et(e2) {
  let t2 = u(f), n2 = u(ee), r2 = c(() => {
    let n3 = l(e2.to);
    return t2.resolve(n3);
  }), i2 = c(() => {
    let { matched: e3 } = r2.value, { length: t3 } = e3, i3 = e3[t3 - 1], a3 = n2.matched;
    if (!i3 || !a3.length) return -1;
    let o3 = a3.findIndex(V.bind(null, i3));
    if (o3 > -1) return o3;
    let s3 = at(e3[t3 - 2]);
    return t3 > 1 && at(i3) === s3 && a3[a3.length - 1].path !== s3 ? a3.findIndex(V.bind(null, e3[t3 - 2])) : o3;
  }), a2 = c(() => i2.value > -1 && it(n2.params, r2.value.params)), o2 = c(() => i2.value > -1 && i2.value === n2.matched.length - 1 && H(n2.params, r2.value.params));
  function s2(n3 = {}) {
    if (rt(n3)) {
      let n4 = t2[l(e2.replace) ? "replace" : "push"](l(e2.to)).catch(_);
      return e2.viewTransition && typeof document < "u" && "startViewTransition" in document && document.startViewTransition(() => n4), n4;
    }
    return Promise.resolve();
  }
  return { route: r2, href: c(() => r2.value.href), isActive: a2, isExactActive: o2, navigate: s2 };
}
function tt(e2) {
  return e2.length === 1 ? e2[0] : e2;
}
var nt = e({ name: "RouterLink", compatConfig: { MODE: 3 }, props: { to: { type: [String, Object], required: !0 }, replace: Boolean, activeClass: String, exactActiveClass: String, custom: Boolean, ariaCurrentValue: { type: String, default: "page" }, viewTransition: Boolean }, useLink: et, setup(e2, { slots: t2 }) {
  let r2 = s(et(e2)), { options: i2 } = u(f), a2 = c(() => ({ [ot(e2.activeClass, i2.linkActiveClass, "router-link-active")]: r2.isActive, [ot(e2.exactActiveClass, i2.linkExactActiveClass, "router-link-exact-active")]: r2.isExactActive }));
  return () => {
    let i3 = t2.default && tt(t2.default(r2));
    return e2.custom ? i3 : n("a", { "aria-current": r2.isExactActive ? e2.ariaCurrentValue : null, href: r2.href, onClick: r2.navigate, class: a2.value }, i3);
  };
} });
function rt(e2) {
  if (!(e2.metaKey || e2.altKey || e2.ctrlKey || e2.shiftKey) && !e2.defaultPrevented && (e2.button === void 0 || e2.button === 0)) {
    if (e2.currentTarget && e2.currentTarget.getAttribute) {
      let t2 = e2.currentTarget.getAttribute("target");
      if (/\b_blank\b/i.test(t2)) return;
    }
    return e2.preventDefault && e2.preventDefault(), !0;
  }
}
function it(e2, t2) {
  for (let n2 in t2) {
    let r2 = t2[n2], i2 = e2[n2];
    if (v(r2)) {
      if (!v(i2) || i2.length !== r2.length || r2.some((e3, t3) => e3.valueOf() !== i2[t3].valueOf())) return !1;
    } else if (r2 !== i2) return !1;
  }
  return !0;
}
function at(e2) {
  return e2 ? e2.aliasOf ? e2.aliasOf.path : e2.path : "";
}
var ot = (e2, t2, n2) => e2 ?? t2 ?? n2;
var st = e({ name: "RouterView", inheritAttrs: !1, props: { name: { type: String, default: "default" }, route: Object }, compatConfig: { MODE: 3 }, setup(e2, { attrs: t2, slots: r2 }) {
  let o2 = u(ne), s2 = c(() => e2.route || o2.value), f2 = u(C, 0), p2 = c(() => {
    let e3 = l(f2), { matched: t3 } = s2.value, n2;
    for (; (n2 = t3[e3]) && !n2.components; ) e3++;
    return e3;
  }), m2 = c(() => s2.value.matched[p2.value]);
  i(C, c(() => p2.value + 1)), i(te, m2), i(ne, s2);
  let h2 = a();
  return d(() => [h2.value, m2.value, e2.name], ([e3, t3, n2], [r3, i2, a2]) => {
    t3 && (t3.instances[n2] = e3, i2 && i2 !== t3 && e3 && e3 === r3 && (t3.leaveGuards.size || (t3.leaveGuards = i2.leaveGuards), t3.updateGuards.size || (t3.updateGuards = i2.updateGuards))), !e3 || !t3 || i2 && V(t3, i2) && r3 || (t3.enterCallbacks[n2] || []).forEach((t4) => t4(e3));
  }, { flush: "post" }), () => {
    let i2 = s2.value, a2 = e2.name, o3 = m2.value, c2 = o3 && o3.components[a2];
    if (!c2) return ct(r2.default, { Component: c2, route: i2 });
    let l2 = o3.props[a2], u2 = l2 ? l2 === !0 ? i2.params : typeof l2 == "function" ? l2(i2) : l2 : null, d2 = n(c2, b({}, u2, t2, { onVnodeUnmounted: (e3) => {
      e3.component.isUnmounted && (o3.instances[a2] = null);
    }, ref: h2 }));
    return ct(r2.default, { Component: d2, route: i2 }) || d2;
  };
} });
function ct(e2, t2) {
  if (!e2) return null;
  let n2 = e2(t2);
  return n2.length === 1 ? n2[0] : n2;
}
var lt = st;
function ut(e2) {
  let n2 = Ge(e2.routes, e2), i2 = e2.parseQuery || Se, a2 = e2.stringifyQuery || Ce, s2 = e2.history, c2 = Z(), u2 = Z(), d2 = Z(), m2 = o(G), g2 = o(0), y2 = G;
  w && e2.scrollBehavior && "scrollRestoration" in history && (history.scrollRestoration = "manual");
  let te2 = p.bind(null, (e3) => "" + e3), S2 = p.bind(null, ue), C2 = p.bind(null, L);
  function re2(e3, t2) {
    let r2, i3;
    xe(e3) ? (r2 = n2.getRecordMatcher(e3), i3 = t2) : i3 = e3;
    let a3 = n2.addRoute(i3, r2);
    return g2.value++, () => {
      a3(), g2.value++;
    };
  }
  function ie2(e3) {
    let t2 = n2.getRecordMatcher(e3);
    t2 && (n2.removeRoute(t2), g2.value++);
  }
  function ae2() {
    n2.clearRoutes(), g2.value++;
  }
  function oe2() {
    return n2.getRoutes().map((e3) => e3.record);
  }
  function se2(e3) {
    return !!n2.getRecordMatcher(e3);
  }
  function T2(e3, t2) {
    if (g2.value, typeof e3 == "string") {
      t2 ||= e3.startsWith("/") ? G : m2.value;
      let r3 = z(i2, e3, t2.path), a3 = n2.resolve({ path: r3.path }, t2), o3 = s2.createHref(r3.fullPath);
      return b(r3, a3, { params: C2(a3.params), redirectedFrom: void 0, href: o3 });
    }
    t2 = b({}, t2 || (e3.path != null && e3.path.startsWith("/") && !("name" in e3 && e3.name) ? G : m2.value));
    let r2;
    if (e3.path != null) r2 = b({}, e3, { path: z(i2, e3.path, t2.path).path });
    else {
      let n3 = b({}, e3.params);
      for (let e4 in n3) n3[e4] ?? delete n3[e4];
      r2 = b({}, e3, { params: S2(n3) }), t2.params = S2(t2.params);
    }
    let o2 = n2.resolve(r2, t2), c3 = e3.hash || "";
    o2.params = te2(C2(o2.params));
    let l2 = fe(a2, b({}, e3, { hash: le(c3), path: o2.path })), u3 = s2.createHref(l2);
    return b({ fullPath: l2, hash: c3, query: a2 === Ce ? we(e3.query) : e3.query || {} }, o2, { redirectedFrom: void 0, href: u3 });
  }
  function E2(e3) {
    return typeof e3 == "string" ? z(i2, e3, m2.value.path) : b({}, e3);
  }
  function D2(e3, t2) {
    if (y2 !== e3) return x(8, { from: t2, to: e3 });
  }
  function O2(e3) {
    return A2(e3);
  }
  function ce2(e3) {
    return O2(b(E2(e3), { replace: !0 }));
  }
  function k2(e3, t2) {
    let n3 = e3.matched[e3.matched.length - 1];
    if (n3 && n3.redirect) {
      let { redirect: r2 } = n3, i3 = typeof r2 == "function" ? r2(e3, t2) : r2;
      return typeof i3 == "string" && (i3 = i3.includes("?") || i3.includes("#") ? i3 = E2(i3) : { path: i3 }, i3.params = {}), b({ query: e3.query, hash: e3.hash, params: i3.path == null ? e3.params : {} }, i3);
    }
  }
  function A2(e3, t2) {
    let n3 = y2 = T2(e3), r2 = m2.value, i3 = e3.state, o2 = e3.force, s3 = e3.replace === !0, c3 = k2(n3, r2);
    if (c3) return A2(b(E2(c3), { state: typeof c3 == "object" ? b({}, i3, c3.state) : i3, force: o2, replace: s3 }), t2 || n3);
    let l2 = n3;
    l2.redirectedFrom = t2;
    let u3;
    return !o2 && pe(a2, r2, n3) && (u3 = x(16, { to: l2, from: r2 }), W2(r2, r2, !0, !1)), (u3 ? Promise.resolve(u3) : N2(l2, r2)).catch((e4) => h(e4) ? h(e4, 2) ? e4 : U2(e4) : H2(e4, l2, r2)).then((e4) => {
      if (e4) {
        if (h(e4, 2)) return A2(b({ replace: s3 }, E2(e4.to), { state: typeof e4.to == "object" ? b({}, i3, e4.to.state) : i3, force: o2 }), t2 || l2);
      } else e4 = F2(l2, r2, !0, s3, i3);
      return P2(l2, r2, e4), e4;
    });
  }
  function j2(e3, t2) {
    let n3 = D2(e3, t2);
    return n3 ? Promise.reject(n3) : Promise.resolve();
  }
  function M2(e3) {
    let t2 = J2.values().next().value;
    return t2 && typeof t2.runWithContext == "function" ? t2.runWithContext(e3) : e3();
  }
  function N2(e3, t2) {
    let n3, [r2, i3, a3] = Te(e3, t2);
    n3 = $(r2.reverse(), "beforeRouteLeave", e3, t2);
    for (let i4 of r2) i4.leaveGuards.forEach((r3) => {
      n3.push(Q(r3, e3, t2));
    });
    let o2 = j2.bind(null, e3, t2);
    return n3.push(o2), X2(n3).then(() => {
      n3 = [];
      for (let r3 of c2.list()) n3.push(Q(r3, e3, t2));
      return n3.push(o2), X2(n3);
    }).then(() => {
      n3 = $(i3, "beforeRouteUpdate", e3, t2);
      for (let r3 of i3) r3.updateGuards.forEach((r4) => {
        n3.push(Q(r4, e3, t2));
      });
      return n3.push(o2), X2(n3);
    }).then(() => {
      n3 = [];
      for (let r3 of a3) if (r3.beforeEnter)
        if (v(r3.beforeEnter)) for (let i4 of r3.beforeEnter) n3.push(Q(i4, e3, t2));
        else n3.push(Q(r3.beforeEnter, e3, t2));
      return n3.push(o2), X2(n3);
    }).then(() => (e3.matched.forEach((e4) => e4.enterCallbacks = {}), n3 = $(a3, "beforeRouteEnter", e3, t2, M2), n3.push(o2), X2(n3))).then(() => {
      n3 = [];
      for (let r3 of u2.list()) n3.push(Q(r3, e3, t2));
      return n3.push(o2), X2(n3);
    }).catch((e4) => h(e4, 8) ? e4 : Promise.reject(e4));
  }
  function P2(e3, t2, n3) {
    d2.list().forEach((r2) => M2(() => r2(e3, t2, n3)));
  }
  function F2(e3, t2, n3, r2, i3) {
    let a3 = D2(e3, t2);
    if (a3) return a3;
    let o2 = t2 === G, c3 = w ? history.state : {};
    n3 && (r2 || o2 ? s2.replace(e3.fullPath, b({ scroll: o2 && c3 && c3.scroll }, i3)) : s2.push(e3.fullPath, i3)), m2.value = e3, W2(e3, t2, n3, o2), U2();
  }
  let I2;
  function de2() {
    I2 ||= s2.listen((e3, t2, n3) => {
      if (!Y2.listening) return;
      let r2 = T2(e3), i3 = k2(r2, Y2.currentRoute.value);
      if (i3) {
        A2(b(i3, { replace: !0, force: !0 }), r2).catch(_);
        return;
      }
      y2 = r2;
      let a3 = m2.value;
      w && n3.delta && ve(ge(a3.fullPath, n3.delta)), N2(r2, a3).catch((e4) => h(e4, 12) ? e4 : h(e4, 2) ? (A2(b(E2(e4.to), { force: !0 }), r2).then((e5) => {
        h(e5, 20) && !n3.delta && n3.type === "pop" && s2.go(-1, !1);
      }).catch(_), Promise.reject()) : (n3.delta && s2.go(-n3.delta, !1), H2(e4, r2, a3))).then((e4) => {
        e4 ||= F2(r2, a3, !1), e4 && (n3.delta && !h(e4, 8) ? s2.go(-n3.delta, !1) : n3.type === "pop" && h(e4, 20) && s2.go(-1, !1)), P2(r2, a3, e4);
      }).catch(_);
    });
  }
  let R2 = Z(), B2 = Z(), V2;
  function H2(e3, t2, n3) {
    U2(e3);
    let r2 = B2.list();
    return r2.length ? r2.forEach((r3) => r3(e3, t2, n3)) : console.error(e3), Promise.reject(e3);
  }
  function me2() {
    return V2 && m2.value !== G ? Promise.resolve() : new Promise((e3, t2) => {
      R2.add([e3, t2]);
    });
  }
  function U2(e3) {
    return V2 || (V2 = !e3, de2(), R2.list().forEach(([t2, n3]) => e3 ? n3(e3) : t2()), R2.reset()), e3;
  }
  function W2(t2, n3, i3, a3) {
    let { scrollBehavior: o2 } = e2;
    if (!w || !o2) return Promise.resolve();
    let s3 = !i3 && ye(ge(t2.fullPath, 0)) || (a3 || !i3) && history.state && history.state.scroll || null;
    return r().then(() => o2(t2, n3, s3)).then((e3) => t2 === m2.value && e3 && he(e3)).catch((e3) => t2 === m2.value && H2(e3, t2, n3));
  }
  let K2 = (e3) => s2.go(e3), q2, J2 = /* @__PURE__ */ new Set(), Y2 = { currentRoute: m2, listening: !0, addRoute: re2, removeRoute: ie2, clearRoutes: ae2, hasRoute: se2, getRoutes: oe2, resolve: T2, options: e2, push: O2, replace: ce2, go: K2, back: () => K2(-1), forward: () => K2(1), beforeEach: c2.add, beforeResolve: u2.add, afterEach: d2.add, onError: B2.add, isReady: me2, install(e3) {
    e3.component("RouterLink", nt), e3.component("RouterView", lt), e3.config.globalProperties.$router = Y2, Object.defineProperty(e3.config.globalProperties, "$route", { enumerable: !0, get: () => l(m2) }), w && !q2 && m2.value === G && (q2 = !0, O2(s2.location).catch((e4) => {
    }));
    let n3 = {};
    for (let e4 in G) Object.defineProperty(n3, e4, { get: () => m2.value[e4], enumerable: !0 });
    e3.provide(f, Y2), e3.provide(ee, t(n3)), e3.provide(ne, m2);
    let r2 = e3.unmount;
    J2.add(e3), e3.unmount = function() {
      J2.delete(e3), J2.size < 1 && (y2 = G, I2 && I2(), I2 = null, m2.value = G, q2 = !1, V2 = !1), r2();
    };
  } };
  function X2(e3) {
    return e3.reduce((e4, t2) => e4.then(() => M2(t2)), Promise.resolve());
  }
  return Y2;
}
export {Me as n,ut as t};