import {J as e,P as t,W as n,Y as r,en as i,f as a,h as o,m as s,p as c} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {X as l} from "./basecomponent-ClhuVxJN.js";
import {E as u,j as d} from "./dist-DPswMdzV.js";
import {t as f} from "./baseicon-Z_5Hqu9u.js";
import {t as p} from "./style-DUXp9q6M.js";
import {t as m} from "./check-vKsww1YC.js";
import {t as h} from "./baseinput-CQOYuWse.js";
var g = { name: "MinusIcon", extends: f };
function _(e2) {
  return x(e2) || b(e2) || y(e2) || v();
}
function v() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function y(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return S(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? S(e2, t2) : void 0;
  }
}
function b(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function x(e2) {
  if (Array.isArray(e2)) return S(e2);
}
function S(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function C(e2, r2, i2, s2, c2, l2) {
  return n(), o("svg", t({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, e2.pti()), _(r2[0] ||= [a("path", { d: "M13.2222 7.77778H0.777778C0.571498 7.77778 0.373667 7.69584 0.227806 7.54998C0.0819442 7.40412 0 7.20629 0 7.00001C0 6.79373 0.0819442 6.5959 0.227806 6.45003C0.373667 6.30417 0.571498 6.22223 0.777778 6.22223H13.2222C13.4285 6.22223 13.6263 6.30417 13.7722 6.45003C13.9181 6.5959 14 6.79373 14 7.00001C14 7.20629 13.9181 7.40412 13.7722 7.54998C13.6263 7.69584 13.4285 7.77778 13.2222 7.77778Z", fill: "currentColor" }, null, -1)]), 16);
}
g.render = C;
var w = { name: "BaseCheckbox", extends: h, props: { value: null, binary: Boolean, indeterminate: { type: Boolean, default: !1 }, trueValue: { type: null, default: !0 }, falseValue: { type: null, default: !1 }, readonly: { type: Boolean, default: !1 }, required: { type: Boolean, default: !1 }, tabindex: { type: Number, default: null }, inputId: { type: String, default: null }, inputClass: { type: [String, Object], default: null }, inputStyle: { type: Object, default: null }, ariaLabelledby: { type: String, default: null }, ariaLabel: { type: String, default: null } }, style: p, provide: function() {
  return { $pcCheckbox: this, $parentInstance: this };
} };
function T(e2) {
  "@babel/helpers - typeof";
  return T = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, T(e2);
}
function E(e2, t2, n2) {
  return (t2 = D(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function D(e2) {
  var t2 = O(e2, "string");
  return T(t2) == "symbol" ? t2 : t2 + "";
}
function O(e2, t2) {
  if (T(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (T(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
function k(e2) {
  return N(e2) || M(e2) || j(e2) || A();
}
function A() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function j(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return P(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? P(e2, t2) : void 0;
  }
}
function M(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function N(e2) {
  if (Array.isArray(e2)) return P(e2);
}
function P(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
var F = { name: "Checkbox", extends: w, inheritAttrs: !1, emits: ["change", "focus", "blur", "update:indeterminate"], inject: { $pcCheckboxGroup: { default: void 0 } }, data: function() {
  return { d_indeterminate: this.indeterminate };
}, watch: { indeterminate: function(e2) {
  this.d_indeterminate = e2, this.updateIndeterminate();
} }, mounted: function() {
  this.updateIndeterminate();
}, updated: function() {
  this.updateIndeterminate();
}, methods: { getPTOptions: function(e2) {
  return (e2 === "root" ? this.ptmi : this.ptm)(e2, { context: { checked: this.checked, indeterminate: this.d_indeterminate, disabled: this.disabled } });
}, onChange: function(e2) {
  var t2 = this;
  if (!this.disabled && !this.readonly) {
    var n2 = this.$pcCheckboxGroup ? this.$pcCheckboxGroup.d_value : this.d_value, r2 = this.binary ? this.d_indeterminate ? this.trueValue : this.checked ? this.falseValue : this.trueValue : this.checked || this.d_indeterminate ? n2.filter(function(e3) {
      return !u(e3, t2.value);
    }) : n2 ? [].concat(k(n2), [this.value]) : [this.value];
    this.d_indeterminate && (this.d_indeterminate = !1, this.$emit("update:indeterminate", this.d_indeterminate)), this.$pcCheckboxGroup ? this.$pcCheckboxGroup.writeValue(r2, e2) : this.writeValue(r2, e2), this.$emit("change", e2);
  }
}, onFocus: function(e2) {
  this.$emit("focus", e2);
}, onBlur: function(e2) {
  var t2, n2;
  this.$emit("blur", e2), (t2 = (n2 = this.formField).onBlur) == null || t2.call(n2, e2);
}, updateIndeterminate: function() {
  this.$refs.input && (this.$refs.input.indeterminate = this.d_indeterminate);
} }, computed: { groupName: function() {
  return this.$pcCheckboxGroup ? this.$pcCheckboxGroup.groupName : this.$formName;
}, checked: function() {
  var e2 = this.$pcCheckboxGroup ? this.$pcCheckboxGroup.d_value : this.d_value;
  return this.d_indeterminate ? !1 : this.binary ? e2 === this.trueValue : d(this.value, e2);
}, dataP: function() {
  return l(E({ invalid: this.$invalid, checked: this.checked, disabled: this.disabled, filled: this.$variant === "filled" }, this.size, this.size));
} }, components: { CheckIcon: m, MinusIcon: g } };
var I = ["data-p-checked", "data-p-indeterminate", "data-p-disabled", "data-p"];
var L = ["id", "value", "name", "checked", "tabindex", "disabled", "readonly", "required", "aria-labelledby", "aria-label", "aria-invalid"];
var R = ["data-p"];
function z(l2, u2, d2, f2, p2, m2) {
  var h2 = r("CheckIcon"), g2 = r("MinusIcon");
  return n(), o("div", t({ class: l2.cx("root") }, m2.getPTOptions("root"), { "data-p-checked": m2.checked, "data-p-indeterminate": p2.d_indeterminate || void 0, "data-p-disabled": l2.disabled, "data-p": m2.dataP }), [a("input", t({ ref: "input", id: l2.inputId, type: "checkbox", class: [l2.cx("input"), l2.inputClass], style: l2.inputStyle, value: l2.value, name: m2.groupName, checked: m2.checked, tabindex: l2.tabindex, disabled: l2.disabled, readonly: l2.readonly, required: l2.required, "aria-labelledby": l2.ariaLabelledby, "aria-label": l2.ariaLabel, "aria-invalid": l2.invalid || void 0, onFocus: u2[0] ||= function() {
    return m2.onFocus && m2.onFocus.apply(m2, arguments);
  }, onBlur: u2[1] ||= function() {
    return m2.onBlur && m2.onBlur.apply(m2, arguments);
  }, onChange: u2[2] ||= function() {
    return m2.onChange && m2.onChange.apply(m2, arguments);
  } }, m2.getPTOptions("input")), null, 16, L), a("div", t({ class: l2.cx("box") }, m2.getPTOptions("box"), { "data-p": m2.dataP }), [e(l2.$slots, "icon", { checked: m2.checked, indeterminate: p2.d_indeterminate, class: i(l2.cx("icon")), dataP: m2.dataP }, function() {
    return [m2.checked ? (n(), c(h2, t({ key: 0, class: l2.cx("icon") }, m2.getPTOptions("icon"), { "data-p": m2.dataP }), null, 16, ["class", "data-p"])) : p2.d_indeterminate ? (n(), c(g2, t({ key: 1, class: l2.cx("icon") }, m2.getPTOptions("icon"), { "data-p": m2.dataP }), null, 16, ["class", "data-p"])) : s("", !0)];
  })], 16, R)], 16, I);
}
F.render = z;
export {F as t};