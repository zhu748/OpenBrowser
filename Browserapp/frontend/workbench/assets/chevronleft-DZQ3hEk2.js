import {P as e,W as t,f as n,h as r} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as i} from "./baseicon-Z_5Hqu9u.js";
var a = { name: "ChevronRightIcon", extends: i };
function o(e2) {
  return u(e2) || l(e2) || c(e2) || s();
}
function s() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function c(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return d(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? d(e2, t2) : void 0;
  }
}
function l(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function u(e2) {
  if (Array.isArray(e2)) return d(e2);
}
function d(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function f(i2, a2, s2, c2, l2, u2) {
  return t(), r("svg", e({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, i2.pti()), o(a2[0] ||= [n("path", { d: "M4.38708 13C4.28408 13.0005 4.18203 12.9804 4.08691 12.9409C3.99178 12.9014 3.9055 12.8433 3.83313 12.7701C3.68634 12.6231 3.60388 12.4238 3.60388 12.2161C3.60388 12.0084 3.68634 11.8091 3.83313 11.6622L8.50507 6.99022L3.83313 2.31827C3.69467 2.16968 3.61928 1.97313 3.62287 1.77005C3.62645 1.56698 3.70872 1.37322 3.85234 1.22959C3.99596 1.08597 4.18972 1.00371 4.3928 1.00012C4.59588 0.996539 4.79242 1.07192 4.94102 1.21039L10.1669 6.43628C10.3137 6.58325 10.3962 6.78249 10.3962 6.99022C10.3962 7.19795 10.3137 7.39718 10.1669 7.54416L4.94102 12.7701C4.86865 12.8433 4.78237 12.9014 4.68724 12.9409C4.59212 12.9804 4.49007 13.0005 4.38708 13Z", fill: "currentColor" }, null, -1)]), 16);
}
a.render = f;
var p = { name: "ChevronLeftIcon", extends: i };
function m(e2) {
  return v(e2) || _(e2) || g(e2) || h();
}
function h() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function g(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return y(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? y(e2, t2) : void 0;
  }
}
function _(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function v(e2) {
  if (Array.isArray(e2)) return y(e2);
}
function y(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function b(i2, a2, o2, s2, c2, l2) {
  return t(), r("svg", e({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, i2.pti()), m(a2[0] ||= [n("path", { d: "M9.61296 13C9.50997 13.0005 9.40792 12.9804 9.3128 12.9409C9.21767 12.9014 9.13139 12.8433 9.05902 12.7701L3.83313 7.54416C3.68634 7.39718 3.60388 7.19795 3.60388 6.99022C3.60388 6.78249 3.68634 6.58325 3.83313 6.43628L9.05902 1.21039C9.20762 1.07192 9.40416 0.996539 9.60724 1.00012C9.81032 1.00371 10.0041 1.08597 10.1477 1.22959C10.2913 1.37322 10.3736 1.56698 10.3772 1.77005C10.3808 1.97313 10.3054 2.16968 10.1669 2.31827L5.49496 6.99022L10.1669 11.6622C10.3137 11.8091 10.3962 12.0084 10.3962 12.2161C10.3962 12.4238 10.3137 12.6231 10.1669 12.7701C10.0945 12.8433 10.0083 12.9014 9.91313 12.9409C9.81801 12.9804 9.71596 13.0005 9.61296 13Z", fill: "currentColor" }, null, -1)]), 16);
}
p.render = b;
export {a as n,p as t};