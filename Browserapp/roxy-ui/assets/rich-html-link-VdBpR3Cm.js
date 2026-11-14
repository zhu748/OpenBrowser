import {k as e} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {g as t} from "./dist-ufdnm93_.js";
var n = (e2) => e2.startsWith("/");
function r(e2) {
  return typeof e2 == "object" || "displayName" in e2 || "props" in e2 || "__vccOpts" in e2;
}
function i(e2) {
  return e2.__esModule || e2[Symbol.toStringTag] === "Module" || e2.default && r(e2.default);
}
var a = Object.assign;
function o(e2, t2) {
  let n2 = {};
  for (let r2 in t2) {
    let i2 = t2[r2];
    n2[r2] = c(i2) ? i2.map(e2) : e2(i2);
  }
  return n2;
}
var s = () => {
};
var c = Array.isArray;
function l(e2, t2) {
  let n2 = {};
  for (let r2 in e2) n2[r2] = r2 in t2 ? t2[r2] : e2[r2];
  return n2;
}
var u = /* @__PURE__ */ Symbol("");
function d(e2, t2) {
  return a(Error(), { type: e2, [u]: !0 }, t2);
}
function f(e2, t2) {
  return e2 instanceof Error && u in e2 && (t2 == null || !!(e2.type & t2));
}
var p = /* @__PURE__ */ Symbol("");
var m = /* @__PURE__ */ Symbol("");
var h = /* @__PURE__ */ Symbol("");
var g = /* @__PURE__ */ Symbol("");
var _ = /* @__PURE__ */ Symbol("");
function v() {
  return e(h);
}
function y(t2) {
  return e(g);
}
function b(e2) {
  return { all: e2 ||= /* @__PURE__ */ new Map(), on: function(t2, n2) {
    var r2 = e2.get(t2);
    r2 ? r2.push(n2) : e2.set(t2, [n2]);
  }, off: function(t2, n2) {
    var r2 = e2.get(t2);
    r2 && (n2 ? r2.splice(r2.indexOf(n2) >>> 0, 1) : e2.set(t2, []));
  }, emit: function(t2, n2) {
    var r2 = e2.get(t2);
    r2 && r2.slice().map(function(e3) {
      e3(n2);
    }), (r2 = e2.get("*")) && r2.slice().map(function(e3) {
      e3(t2, n2);
    });
  } };
}
var x = b();
var S = x.on.bind(x);
var C = x.off.bind(x);
function w(e2, n2) {
  S(e2, n2), t(() => {
    C(e2, n2);
  });
}
export {h as _,o as a,v as b,n as c,f as d,r as f,g as g,s as h,w as i,c as l,l as m,a as o,p as p,x as r,d as s,i as u,_ as v,m as x,y as y};