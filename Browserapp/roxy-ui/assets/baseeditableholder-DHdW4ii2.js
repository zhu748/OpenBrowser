import {t as e} from "./basecomponent-ClhuVxJN.js";
import {M as t} from "./dist-DPswMdzV.js";
var n = { name: "BaseEditableHolder", extends: e, emits: ["update:modelValue", "value-change"], props: { modelValue: { type: null, default: void 0 }, defaultValue: { type: null, default: void 0 }, name: { type: String, default: void 0 }, invalid: { type: Boolean, default: void 0 }, disabled: { type: Boolean, default: !1 }, formControl: { type: Object, default: void 0 } }, inject: { $parentInstance: { default: void 0 }, $pcForm: { default: void 0 }, $pcFormField: { default: void 0 } }, data: function() {
  return { d_value: this.defaultValue === void 0 ? this.modelValue : this.defaultValue };
}, watch: { modelValue: { deep: !0, handler: function(e2) {
  this.d_value = e2;
} }, defaultValue: function(e2) {
  this.d_value = e2;
}, $formName: { immediate: !0, handler: function(e2) {
  var t2, n2;
  this.formField = ((t2 = this.$pcForm) == null || (n2 = t2.register) == null ? void 0 : n2.call(t2, e2, this.$formControl)) || {};
} }, $formControl: { immediate: !0, handler: function(e2) {
  var t2, n2;
  this.formField = ((t2 = this.$pcForm) == null || (n2 = t2.register) == null ? void 0 : n2.call(t2, this.$formName, e2)) || {};
} }, $formDefaultValue: { immediate: !0, handler: function(e2) {
  this.d_value !== e2 && (this.d_value = e2);
} }, $formValue: { immediate: !1, handler: function(e2) {
  var t2;
  (t2 = this.$pcForm) != null && t2.getFieldState(this.$formName) && e2 !== this.d_value && (this.d_value = e2);
} } }, formField: {}, methods: { writeValue: function(e2, t2) {
  var n2, r;
  this.controlled && (this.d_value = e2, this.$emit("update:modelValue", e2)), this.$emit("value-change", e2), (n2 = (r = this.formField).onChange) == null || n2.call(r, { originalEvent: t2, value: e2 });
}, findNonEmpty: function() {
  return [...arguments].find(t);
} }, computed: { $filled: function() {
  return t(this.d_value);
}, $invalid: function() {
  var e2, t2;
  return !this.$formNovalidate && this.findNonEmpty(this.invalid, (e2 = this.$pcFormField) == null || (e2 = e2.$field) == null ? void 0 : e2.invalid, (t2 = this.$pcForm) == null || (t2 = t2.getFieldState(this.$formName)) == null ? void 0 : t2.invalid);
}, $formName: function() {
  return this.$formNovalidate ? void 0 : this.name || this.$formControl?.name;
}, $formControl: function() {
  return this.formControl || this.$pcFormField?.formControl;
}, $formNovalidate: function() {
  return this.$formControl?.novalidate;
}, $formDefaultValue: function() {
  var e2;
  return this.findNonEmpty(this.d_value, this.$pcFormField?.initialValue, (e2 = this.$pcForm) == null || (e2 = e2.initialValues) == null ? void 0 : e2[this.$formName]);
}, $formValue: function() {
  var e2, t2;
  return this.findNonEmpty((e2 = this.$pcFormField) == null || (e2 = e2.$field) == null ? void 0 : e2.value, (t2 = this.$pcForm) == null || (t2 = t2.getFieldState(this.$formName)) == null ? void 0 : t2.value);
}, controlled: function() {
  return this.$inProps.hasOwnProperty("modelValue") || !this.$inProps.hasOwnProperty("modelValue") && !this.$inProps.hasOwnProperty("defaultValue");
}, filled: function() {
  return this.$filled;
} } };
export {n as t};