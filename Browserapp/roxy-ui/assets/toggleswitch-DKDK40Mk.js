import {J as e,P as t,W as n,f as r,h as i} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {X as a} from "./basecomponent-ClhuVxJN.js";
import {t as o} from "./style-gUVCyWpA.js";
import {t as s} from "./baseeditableholder-DHdW4ii2.js";
var c = { name: "ToggleSwitch", extends: { name: "BaseToggleSwitch", extends: s, props: { trueValue: { type: null, default: !0 }, falseValue: { type: null, default: !1 }, readonly: { type: Boolean, default: !1 }, tabindex: { type: Number, default: null }, inputId: { type: String, default: null }, inputClass: { type: [String, Object], default: null }, inputStyle: { type: Object, default: null }, ariaLabelledby: { type: String, default: null }, ariaLabel: { type: String, default: null } }, style: o, provide: function() {
  return { $pcToggleSwitch: this, $parentInstance: this };
} }, inheritAttrs: !1, emits: ["change", "focus", "blur"], methods: { getPTOptions: function(e2) {
  return (e2 === "root" ? this.ptmi : this.ptm)(e2, { context: { checked: this.checked, disabled: this.disabled } });
}, onChange: function(e2) {
  if (!this.disabled && !this.readonly) {
    var t2 = this.checked ? this.falseValue : this.trueValue;
    this.writeValue(t2, e2), this.$emit("change", e2);
  }
}, onFocus: function(e2) {
  this.$emit("focus", e2);
}, onBlur: function(e2) {
  var t2, n2;
  this.$emit("blur", e2), (t2 = (n2 = this.formField).onBlur) == null || t2.call(n2, e2);
} }, computed: { checked: function() {
  return this.d_value === this.trueValue;
}, dataP: function() {
  return a({ checked: this.checked, disabled: this.disabled, invalid: this.$invalid });
} } };
var l = ["data-p-checked", "data-p-disabled", "data-p"];
var u = ["id", "checked", "tabindex", "disabled", "readonly", "aria-checked", "aria-labelledby", "aria-label", "aria-invalid"];
var d = ["data-p"];
var f = ["data-p"];
function p(a2, o2, s2, c2, p2, m) {
  return n(), i("div", t({ class: a2.cx("root"), style: a2.sx("root") }, m.getPTOptions("root"), { "data-p-checked": m.checked, "data-p-disabled": a2.disabled, "data-p": m.dataP }), [r("input", t({ id: a2.inputId, type: "checkbox", role: "switch", class: [a2.cx("input"), a2.inputClass], style: a2.inputStyle, checked: m.checked, tabindex: a2.tabindex, disabled: a2.disabled, readonly: a2.readonly, "aria-checked": m.checked, "aria-labelledby": a2.ariaLabelledby, "aria-label": a2.ariaLabel, "aria-invalid": a2.invalid || void 0, onFocus: o2[0] ||= function() {
    return m.onFocus && m.onFocus.apply(m, arguments);
  }, onBlur: o2[1] ||= function() {
    return m.onBlur && m.onBlur.apply(m, arguments);
  }, onChange: o2[2] ||= function() {
    return m.onChange && m.onChange.apply(m, arguments);
  } }, m.getPTOptions("input")), null, 16, u), r("div", t({ class: a2.cx("slider") }, m.getPTOptions("slider"), { "data-p": m.dataP }), [r("div", t({ class: a2.cx("handle") }, m.getPTOptions("handle"), { "data-p": m.dataP }), [e(a2.$slots, "handle", { checked: m.checked })], 16, f)], 16, d)], 16, l);
}
c.render = p;
export {c as t};