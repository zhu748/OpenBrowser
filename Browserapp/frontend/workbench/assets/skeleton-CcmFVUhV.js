import {P as e,W as t,h as n} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {X as r,t as i} from "./basecomponent-ClhuVxJN.js";
import {t as a} from "./style-BVwKkpOq.js";
var o = { name: "BaseSkeleton", extends: i, props: { shape: { type: String, default: "rectangle" }, size: { type: String, default: null }, width: { type: String, default: "100%" }, height: { type: String, default: "1rem" }, borderRadius: { type: String, default: null }, animation: { type: String, default: "wave" } }, style: a, provide: function() {
  return { $pcSkeleton: this, $parentInstance: this };
} };
function s(e2) {
  "@babel/helpers - typeof";
  return s = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, s(e2);
}
function c(e2, t2, n2) {
  return (t2 = l(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function l(e2) {
  var t2 = u(e2, "string");
  return s(t2) == "symbol" ? t2 : t2 + "";
}
function u(e2, t2) {
  if (s(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (s(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var d = { name: "Skeleton", extends: o, inheritAttrs: !1, computed: { containerStyle: function() {
  return this.size ? { width: this.size, height: this.size, borderRadius: this.borderRadius } : { width: this.width, height: this.height, borderRadius: this.borderRadius };
}, dataP: function() {
  return r(c({}, this.shape, this.shape));
} } };
var f = ["data-p"];
function p(r2, i2, a2, o2, s2, c2) {
  return t(), n("div", e({ class: r2.cx("root"), style: [r2.sx("root"), c2.containerStyle], "aria-hidden": "true" }, r2.ptmi("root"), { "data-p": c2.dataP }), null, 16, f);
}
d.render = p;
export {d as t};