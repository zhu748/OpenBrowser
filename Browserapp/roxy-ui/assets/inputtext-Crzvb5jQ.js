import {P as e,W as t,h as n} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {X as r} from "./basecomponent-ClhuVxJN.js";
import {t as i} from "./style-Hbl83ARJ.js";
import {t as a} from "./baseinput-CQOYuWse.js";
var o = { name: "BaseInputText", extends: a, style: i, provide: function() {
  return { $pcInputText: this, $parentInstance: this };
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
var d = { name: "InputText", extends: o, inheritAttrs: !1, methods: { onInput: function(e2) {
  this.writeValue(e2.target.value, e2);
} }, computed: { attrs: function() {
  return e(this.ptmi("root", { context: { filled: this.$filled, disabled: this.disabled } }), this.formField);
}, dataP: function() {
  return r(c({ invalid: this.$invalid, fluid: this.$fluid, filled: this.$variant === "filled" }, this.size, this.size));
} } };
var f = ["value", "name", "disabled", "aria-invalid", "data-p"];
function p(r2, i2, a2, o2, s2, c2) {
  return t(), n("input", e({ type: "text", class: r2.cx("root"), value: r2.d_value, name: r2.name, disabled: r2.disabled, "aria-invalid": r2.$invalid || void 0, "data-p": c2.dataP, onInput: i2[0] ||= function() {
    return c2.onInput && c2.onInput.apply(c2, arguments);
  } }, c2.attrs), null, 16, f);
}
d.render = p;
export {d as t};