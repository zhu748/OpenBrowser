import {J as e,P as t,W as n,h as r,m as i} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {X as a,t as o} from "./basecomponent-ClhuVxJN.js";
import {t as s} from "./style-YB-2T3UA.js";
var c = { name: "BaseDivider", extends: o, props: { align: { type: String, default: null }, layout: { type: String, default: "horizontal" }, type: { type: String, default: "solid" } }, style: s, provide: function() {
  return { $pcDivider: this, $parentInstance: this };
} };
function l(e2) {
  "@babel/helpers - typeof";
  return l = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, l(e2);
}
function u(e2, t2, n2) {
  return (t2 = d(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function d(e2) {
  var t2 = f(e2, "string");
  return l(t2) == "symbol" ? t2 : t2 + "";
}
function f(e2, t2) {
  if (l(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (l(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var p = { name: "Divider", extends: c, inheritAttrs: !1, computed: { dataP: function() {
  return a(u(u(u({}, this.align, this.align), this.layout, this.layout), this.type, this.type));
} } };
var m = ["aria-orientation", "data-p"];
var h = ["data-p"];
function g(a2, o2, s2, c2, l2, u2) {
  return n(), r("div", t({ class: a2.cx("root"), style: a2.sx("root"), role: "separator", "aria-orientation": a2.layout, "data-p": u2.dataP }, a2.ptmi("root")), [a2.$slots.default ? (n(), r("div", t({ key: 0, class: a2.cx("content"), "data-p": u2.dataP }, a2.ptm("content")), [e(a2.$slots, "default")], 16, h)) : i("", !0)], 16, m);
}
p.render = g;
export {p as t};