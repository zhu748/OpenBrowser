import {P as e,W as t,f as n,h as r} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {X as i} from "./basecomponent-ClhuVxJN.js";
import {E as a} from "./dist-DPswMdzV.js";
import {t as o} from "./style-D5noSJFr.js";
import {t as s} from "./baseinput-CQOYuWse.js";
var c = { name: "BaseRadioButton", extends: s, props: { value: null, binary: Boolean, readonly: { type: Boolean, default: !1 }, tabindex: { type: Number, default: null }, inputId: { type: String, default: null }, inputClass: { type: [String, Object], default: null }, inputStyle: { type: Object, default: null }, ariaLabelledby: { type: String, default: null }, ariaLabel: { type: String, default: null } }, style: o, provide: function() {
  return { $pcRadioButton: this, $parentInstance: this };
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
var p = { name: "RadioButton", extends: c, inheritAttrs: !1, emits: ["change", "focus", "blur"], inject: { $pcRadioButtonGroup: { default: void 0 } }, methods: { getPTOptions: function(e2) {
  return (e2 === "root" ? this.ptmi : this.ptm)(e2, { context: { checked: this.checked, disabled: this.disabled } });
}, onChange: function(e2) {
  if (!this.disabled && !this.readonly) {
    var t2 = this.binary ? !this.checked : this.value;
    this.$pcRadioButtonGroup ? this.$pcRadioButtonGroup.writeValue(t2, e2) : this.writeValue(t2, e2), this.$emit("change", e2);
  }
}, onFocus: function(e2) {
  this.$emit("focus", e2);
}, onBlur: function(e2) {
  var t2, n2;
  this.$emit("blur", e2), (t2 = (n2 = this.formField).onBlur) == null || t2.call(n2, e2);
} }, computed: { groupName: function() {
  return this.$pcRadioButtonGroup ? this.$pcRadioButtonGroup.groupName : this.$formName;
}, checked: function() {
  var e2 = this.$pcRadioButtonGroup ? this.$pcRadioButtonGroup.d_value : this.d_value;
  return e2 != null && (this.binary ? !!e2 : a(e2, this.value));
}, dataP: function() {
  return i(u({ invalid: this.$invalid, checked: this.checked, disabled: this.disabled, filled: this.$variant === "filled" }, this.size, this.size));
} } };
var m = ["data-p-checked", "data-p-disabled", "data-p"];
var h = ["id", "value", "name", "checked", "tabindex", "disabled", "readonly", "aria-labelledby", "aria-label", "aria-invalid"];
var g = ["data-p"];
var _ = ["data-p"];
function v(i2, a2, o2, s2, c2, l2) {
  return t(), r("div", e({ class: i2.cx("root") }, l2.getPTOptions("root"), { "data-p-checked": l2.checked, "data-p-disabled": i2.disabled, "data-p": l2.dataP }), [n("input", e({ id: i2.inputId, type: "radio", class: [i2.cx("input"), i2.inputClass], style: i2.inputStyle, value: i2.value, name: l2.groupName, checked: l2.checked, tabindex: i2.tabindex, disabled: i2.disabled, readonly: i2.readonly, "aria-labelledby": i2.ariaLabelledby, "aria-label": i2.ariaLabel, "aria-invalid": i2.invalid || void 0, onFocus: a2[0] ||= function() {
    return l2.onFocus && l2.onFocus.apply(l2, arguments);
  }, onBlur: a2[1] ||= function() {
    return l2.onBlur && l2.onBlur.apply(l2, arguments);
  }, onChange: a2[2] ||= function() {
    return l2.onChange && l2.onChange.apply(l2, arguments);
  } }, l2.getPTOptions("input")), null, 16, h), n("div", e({ class: i2.cx("box") }, l2.getPTOptions("box"), { "data-p": l2.dataP }), [n("div", e({ class: i2.cx("icon") }, l2.getPTOptions("icon"), { "data-p": l2.dataP }), null, 16, _)], 16, g)], 16, m);
}
p.render = v;
export {p as t};