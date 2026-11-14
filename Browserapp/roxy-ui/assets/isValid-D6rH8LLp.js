var e = 6048e5;
var t = 864e5;
var r = 36e5;
var a = /* @__PURE__ */ Symbol.for("constructDateFrom");
function o(e2, t2) {
  return typeof e2 == "function" ? e2(t2) : e2 && typeof e2 == "object" && a in e2 ? e2[a](t2) : e2 instanceof Date ? new e2.constructor(t2) : new Date(t2);
}
function s(e2, t2) {
  return o(t2 || e2, e2);
}
function c(e2) {
  return e2 instanceof Date || typeof e2 == "object" && Object.prototype.toString.call(e2) === "[object Date]";
}
function l(e2) {
  return !(!c(e2) && typeof e2 != "number" || isNaN(+s(e2)));
}
export {r as a,e as c,t as i,s as n,o as r,l as t};