import {J as e,P as t,W as n,Y as r,Z as i,f as a,h as o,in as s,lt as c,m as l,p as u,x as d} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as f} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {K as p,M as m,X as h,c as g,f as _,w as v} from "./basecomponent-ClhuVxJN.js";
import {t as y} from "./baseicon-Z_5Hqu9u.js";
import {t as b} from "./zindex-cO8iUN-n.js";
import {t as x} from "./utils-i4uei9-Y.js";
import {t as S} from "./style-CvSzqefG.js";
import {t as C} from "./times-NAtDB1bj.js";
import {t as w} from "./portal-Cm1Im7J-.js";
import {t as T} from "./baseinput-CQOYuWse.js";
import {t as E} from "./overlayeventbus-B9Z9smtH.js";
import {t as D} from "./inputtext-Crzvb5jQ.js";
var O = { name: "EyeIcon", extends: y };
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
function F(e2, r2, i2, s2, c2, l2) {
  return n(), o("svg", t({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, e2.pti()), k(r2[0] ||= [a("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M0.0535499 7.25213C0.208567 7.59162 2.40413 12.4 7 12.4C11.5959 12.4 13.7914 7.59162 13.9465 7.25213C13.9487 7.2471 13.9506 7.24304 13.952 7.24001C13.9837 7.16396 14 7.08239 14 7.00001C14 6.91762 13.9837 6.83605 13.952 6.76001C13.9506 6.75697 13.9487 6.75292 13.9465 6.74788C13.7914 6.4084 11.5959 1.60001 7 1.60001C2.40413 1.60001 0.208567 6.40839 0.0535499 6.74788C0.0512519 6.75292 0.0494023 6.75697 0.048 6.76001C0.0163137 6.83605 0 6.91762 0 7.00001C0 7.08239 0.0163137 7.16396 0.048 7.24001C0.0494023 7.24304 0.0512519 7.2471 0.0535499 7.25213ZM7 11.2C3.664 11.2 1.736 7.92001 1.264 7.00001C1.736 6.08001 3.664 2.80001 7 2.80001C10.336 2.80001 12.264 6.08001 12.736 7.00001C12.264 7.92001 10.336 11.2 7 11.2ZM5.55551 9.16182C5.98308 9.44751 6.48576 9.6 7 9.6C7.68891 9.59789 8.349 9.32328 8.83614 8.83614C9.32328 8.349 9.59789 7.68891 9.59999 7C9.59999 6.48576 9.44751 5.98308 9.16182 5.55551C8.87612 5.12794 8.47006 4.7947 7.99497 4.59791C7.51988 4.40112 6.99711 4.34963 6.49276 4.44995C5.98841 4.55027 5.52513 4.7979 5.16152 5.16152C4.7979 5.52513 4.55027 5.98841 4.44995 6.49276C4.34963 6.99711 4.40112 7.51988 4.59791 7.99497C4.7947 8.47006 5.12794 8.87612 5.55551 9.16182ZM6.2222 5.83594C6.45243 5.6821 6.7231 5.6 7 5.6C7.37065 5.6021 7.72553 5.75027 7.98762 6.01237C8.24972 6.27446 8.39789 6.62934 8.4 7C8.4 7.27689 8.31789 7.54756 8.16405 7.77779C8.01022 8.00802 7.79157 8.18746 7.53575 8.29343C7.27994 8.39939 6.99844 8.42711 6.72687 8.37309C6.4553 8.31908 6.20584 8.18574 6.01005 7.98994C5.81425 7.79415 5.68091 7.54469 5.6269 7.27312C5.57288 7.00155 5.6006 6.72006 5.70656 6.46424C5.81253 6.20842 5.99197 5.98977 6.2222 5.83594Z", fill: "currentColor" }, null, -1)]), 16);
}
O.render = F;
var I = { name: "EyeSlashIcon", extends: y };
function L(e2) {
  return V(e2) || B(e2) || z(e2) || R();
}
function R() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function z(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return H(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? H(e2, t2) : void 0;
  }
}
function B(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function V(e2) {
  if (Array.isArray(e2)) return H(e2);
}
function H(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function U(e2, r2, i2, s2, c2, l2) {
  return n(), o("svg", t({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, e2.pti()), L(r2[0] ||= [a("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M13.9414 6.74792C13.9437 6.75295 13.9455 6.757 13.9469 6.76003C13.982 6.8394 14.0001 6.9252 14.0001 7.01195C14.0001 7.0987 13.982 7.1845 13.9469 7.26386C13.6004 8.00059 13.1711 8.69549 12.6674 9.33515C12.6115 9.4071 12.54 9.46538 12.4582 9.50556C12.3765 9.54574 12.2866 9.56678 12.1955 9.56707C12.0834 9.56671 11.9737 9.53496 11.8788 9.47541C11.7838 9.41586 11.7074 9.3309 11.6583 9.23015C11.6092 9.12941 11.5893 9.01691 11.6008 8.90543C11.6124 8.79394 11.6549 8.68793 11.7237 8.5994C12.1065 8.09726 12.4437 7.56199 12.7313 6.99995C12.2595 6.08027 10.3402 2.8014 6.99732 2.8014C6.63723 2.80218 6.27816 2.83969 5.92569 2.91336C5.77666 2.93304 5.62568 2.89606 5.50263 2.80972C5.37958 2.72337 5.29344 2.59398 5.26125 2.44714C5.22907 2.30031 5.2532 2.14674 5.32885 2.01685C5.40451 1.88696 5.52618 1.79021 5.66978 1.74576C6.10574 1.64961 6.55089 1.60134 6.99732 1.60181C11.5916 1.60181 13.7864 6.40856 13.9414 6.74792ZM2.20333 1.61685C2.35871 1.61411 2.5091 1.67179 2.6228 1.77774L12.2195 11.3744C12.3318 11.4869 12.3949 11.6393 12.3949 11.7983C12.3949 11.9572 12.3318 12.1097 12.2195 12.2221C12.107 12.3345 11.9546 12.3976 11.7956 12.3976C11.6367 12.3976 11.4842 12.3345 11.3718 12.2221L10.5081 11.3584C9.46549 12.0426 8.24432 12.4042 6.99729 12.3981C2.403 12.3981 0.208197 7.59135 0.0532336 7.25198C0.0509364 7.24694 0.0490875 7.2429 0.0476856 7.23986C0.0162332 7.16518 3.05176e-05 7.08497 3.05176e-05 7.00394C3.05176e-05 6.92291 0.0162332 6.8427 0.0476856 6.76802C0.631261 5.47831 1.46902 4.31959 2.51084 3.36119L1.77509 2.62545C1.66914 2.51175 1.61146 2.36136 1.61421 2.20597C1.61695 2.05059 1.6799 1.90233 1.78979 1.79244C1.89968 1.68254 2.04794 1.6196 2.20333 1.61685ZM7.45314 8.35147L5.68574 6.57609V6.5361C5.5872 6.78938 5.56498 7.06597 5.62183 7.33173C5.67868 7.59749 5.8121 7.84078 6.00563 8.03158C6.19567 8.21043 6.43052 8.33458 6.68533 8.39089C6.94014 8.44721 7.20543 8.43359 7.45314 8.35147ZM1.26327 6.99994C1.7351 7.91163 3.64645 11.1985 6.99729 11.1985C7.9267 11.2048 8.8408 10.9618 9.64438 10.4947L8.35682 9.20718C7.86027 9.51441 7.27449 9.64491 6.69448 9.57752C6.11446 9.51014 5.57421 9.24881 5.16131 8.83592C4.74842 8.42303 4.4871 7.88277 4.41971 7.30276C4.35232 6.72274 4.48282 6.13697 4.79005 5.64041L3.35855 4.2089C2.4954 5.00336 1.78523 5.94935 1.26327 6.99994Z", fill: "currentColor" }, null, -1)]), 16);
}
I.render = U;
var W = { name: "BasePassword", extends: T, props: { promptLabel: { type: String, default: null }, mediumRegex: { type: [String, RegExp], default: "^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})" }, strongRegex: { type: [String, RegExp], default: "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})" }, weakLabel: { type: String, default: null }, mediumLabel: { type: String, default: null }, strongLabel: { type: String, default: null }, feedback: { type: Boolean, default: !0 }, appendTo: { type: [String, Object], default: "body" }, toggleMask: { type: Boolean, default: !1 }, hideIcon: { type: String, default: void 0 }, maskIcon: { type: String, default: void 0 }, showIcon: { type: String, default: void 0 }, unmaskIcon: { type: String, default: void 0 }, showClear: { type: Boolean, default: !1 }, disabled: { type: Boolean, default: !1 }, placeholder: { type: String, default: null }, required: { type: Boolean, default: !1 }, inputId: { type: String, default: null }, inputClass: { type: [String, Object], default: null }, inputStyle: { type: Object, default: null }, inputProps: { type: null, default: null }, panelId: { type: String, default: null }, panelClass: { type: [String, Object], default: null }, panelStyle: { type: Object, default: null }, panelProps: { type: null, default: null }, overlayId: { type: String, default: null }, overlayClass: { type: [String, Object], default: null }, overlayStyle: { type: Object, default: null }, overlayProps: { type: null, default: null }, ariaLabelledby: { type: String, default: null }, ariaLabel: { type: String, default: null }, autofocus: { type: Boolean, default: null } }, style: S, provide: function() {
  return { $pcPassword: this, $parentInstance: this };
} };
function G(e2) {
  "@babel/helpers - typeof";
  return G = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, G(e2);
}
function K(e2, t2, n2) {
  return (t2 = q(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function q(e2) {
  var t2 = J(e2, "string");
  return G(t2) == "symbol" ? t2 : t2 + "";
}
function J(e2, t2) {
  if (G(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (G(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var Y = { name: "Password", extends: W, inheritAttrs: !1, emits: ["change", "focus", "blur", "invalid"], inject: { $pcFluid: { default: null } }, data: function() {
  return { overlayVisible: !1, meter: null, infoText: null, focused: !1, unmasked: !1 };
}, mediumCheckRegExp: null, strongCheckRegExp: null, resizeListener: null, scrollHandler: null, overlay: null, mounted: function() {
  this.infoText = this.promptText, this.mediumCheckRegExp = new RegExp(this.mediumRegex), this.strongCheckRegExp = new RegExp(this.strongRegex);
}, beforeUnmount: function() {
  this.unbindResizeListener(), this.scrollHandler &&= (this.scrollHandler.destroy(), null), this.overlay &&= (b.clear(this.overlay), null);
}, methods: { onOverlayEnter: function(e2) {
  b.set("overlay", e2, this.$primevue.config.zIndex.overlay), v(e2, { position: "absolute", top: "0" }), this.alignOverlay(), this.bindScrollListener(), this.bindResizeListener(), this.$attrSelector && e2.setAttribute(this.$attrSelector, "");
}, onOverlayLeave: function() {
  this.unbindScrollListener(), this.unbindResizeListener(), this.overlay = null;
}, onOverlayAfterLeave: function(e2) {
  b.clear(e2);
}, alignOverlay: function() {
  this.appendTo === "self" ? _(this.overlay, this.$refs.input.$el) : (this.overlay.style.minWidth = p(this.$refs.input.$el) + "px", g(this.overlay, this.$refs.input.$el));
}, testStrength: function(e2) {
  var t2 = 0;
  return this.strongCheckRegExp.test(e2) ? t2 = 3 : this.mediumCheckRegExp.test(e2) ? t2 = 2 : e2.length && (t2 = 1), t2;
}, onInput: function(e2) {
  this.writeValue(e2.target.value, e2), this.$emit("change", e2);
}, onFocus: function(e2) {
  this.focused = !0, this.feedback && (this.setPasswordMeter(this.d_value), this.overlayVisible = !0), this.$emit("focus", e2);
}, onBlur: function(e2) {
  this.focused = !1, this.feedback && (this.overlayVisible = !1), this.$emit("blur", e2);
}, onKeyUp: function(e2) {
  if (this.feedback) {
    var t2 = e2.target.value, n2 = this.checkPasswordStrength(t2), r2 = n2.meter, i2 = n2.label;
    if (this.meter = r2, this.infoText = i2, e2.code === "Escape") {
      this.overlayVisible &&= !1;
      return;
    }
    this.overlayVisible ||= !0;
  }
}, setPasswordMeter: function() {
  if (!this.d_value) this.meter = null, this.infoText = this.promptText;
  else {
    var e2 = this.checkPasswordStrength(this.d_value), t2 = e2.meter, n2 = e2.label;
    this.meter = t2, this.infoText = n2, this.overlayVisible ||= !0;
  }
}, checkPasswordStrength: function(e2) {
  var t2 = null, n2 = null;
  switch (this.testStrength(e2)) {
    case 1:
      t2 = this.weakText, n2 = { strength: "weak", width: "33.33%" };
      break;
    case 2:
      t2 = this.mediumText, n2 = { strength: "medium", width: "66.66%" };
      break;
    case 3:
      t2 = this.strongText, n2 = { strength: "strong", width: "100%" };
      break;
    default:
      t2 = this.promptText, n2 = null;
  }
  return { label: t2, meter: n2 };
}, onInvalid: function(e2) {
  this.$emit("invalid", e2);
}, bindScrollListener: function() {
  var e2 = this;
  this.scrollHandler ||= new x(this.$refs.input.$el, function() {
    e2.overlayVisible &&= !1;
  }), this.scrollHandler.bindScrollListener();
}, unbindScrollListener: function() {
  this.scrollHandler && this.scrollHandler.unbindScrollListener();
}, bindResizeListener: function() {
  var e2 = this;
  this.resizeListener || (this.resizeListener = function() {
    e2.overlayVisible && !m() && (e2.overlayVisible = !1);
  }, window.addEventListener("resize", this.resizeListener));
}, unbindResizeListener: function() {
  this.resizeListener &&= (window.removeEventListener("resize", this.resizeListener), null);
}, overlayRef: function(e2) {
  this.overlay = e2;
}, onMaskToggle: function() {
  this.unmasked = !this.unmasked;
}, onClearClick: function(e2) {
  this.writeValue(null, {});
}, onOverlayClick: function(e2) {
  E.emit("overlay-click", { originalEvent: e2, target: this.$el });
} }, computed: { inputType: function() {
  return this.unmasked ? "text" : "password";
}, weakText: function() {
  return this.weakLabel || this.$primevue.config.locale.weak;
}, mediumText: function() {
  return this.mediumLabel || this.$primevue.config.locale.medium;
}, strongText: function() {
  return this.strongLabel || this.$primevue.config.locale.strong;
}, promptText: function() {
  return this.promptLabel || this.$primevue.config.locale.passwordPrompt;
}, isClearIconVisible: function() {
  return this.showClear && this.$filled && !this.disabled;
}, overlayUniqueId: function() {
  return this.$id + "_overlay";
}, containerDataP: function() {
  return h({ fluid: this.$fluid });
}, meterDataP: function() {
  return h(K({}, this.meter?.strength, this.meter?.strength));
}, overlayDataP: function() {
  return h(K({}, "portal-" + this.appendTo, "portal-" + this.appendTo));
} }, components: { InputText: D, Portal: w, EyeSlashIcon: I, EyeIcon: O, TimesIcon: C } };
function X(e2) {
  "@babel/helpers - typeof";
  return X = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, X(e2);
}
function Z(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function Q(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? Z(Object(n2), !0).forEach(function(t3) {
      $(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : Z(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function $(e2, t2, n2) {
  return (t2 = ee(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function ee(e2) {
  var t2 = te(e2, "string");
  return X(t2) == "symbol" ? t2 : t2 + "";
}
function te(e2, t2) {
  if (X(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (X(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var ne = ["data-p"];
var re = ["id", "data-p"];
var ie = ["data-p"];
function ae(p2, m2, h2, g2, _2, v2) {
  var y2 = r("InputText"), b2 = r("TimesIcon"), x2 = r("Portal");
  return n(), o("div", t({ class: p2.cx("root"), style: p2.sx("root"), "data-p": v2.containerDataP }, p2.ptmi("root")), [d(y2, t({ ref: "input", id: p2.inputId, type: v2.inputType, class: [p2.cx("pcInputText"), p2.inputClass], style: p2.inputStyle, defaultValue: p2.d_value, name: p2.$formName, "aria-labelledby": p2.ariaLabelledby, "aria-label": p2.ariaLabel, "aria-expanded": _2.overlayVisible, "aria-controls": _2.overlayVisible ? p2.overlayProps && p2.overlayProps.id || p2.overlayId || p2.panelProps && p2.panelProps.id || p2.panelId || v2.overlayUniqueId : void 0, "aria-haspopup": p2.feedback, placeholder: p2.placeholder, required: p2.required, fluid: p2.fluid, disabled: p2.disabled, variant: p2.variant, invalid: p2.invalid, size: p2.size, autofocus: p2.autofocus, onInput: v2.onInput, onFocus: v2.onFocus, onBlur: v2.onBlur, onKeyup: v2.onKeyUp, onInvalid: v2.onInvalid }, p2.inputProps, { "data-p-has-e-icon": p2.toggleMask, pt: p2.ptm("pcInputText"), unstyled: p2.unstyled }), null, 16, "id.type.class.style.defaultValue.name.aria-labelledby.aria-label.aria-expanded.aria-controls.aria-haspopup.placeholder.required.fluid.disabled.variant.invalid.size.autofocus.onInput.onFocus.onBlur.onKeyup.onInvalid.data-p-has-e-icon.pt.unstyled".split(".")), p2.toggleMask && _2.unmasked ? e(p2.$slots, p2.$slots.maskicon ? "maskicon" : "hideicon", t({ key: 0, toggleCallback: v2.onMaskToggle, class: [p2.cx("maskIcon"), p2.maskIcon] }, p2.ptm("maskIcon")), function() {
    return [(n(), u(i(p2.maskIcon ? "i" : "EyeSlashIcon"), t({ class: [p2.cx("maskIcon"), p2.maskIcon], onClick: v2.onMaskToggle }, p2.ptm("maskIcon")), null, 16, ["class", "onClick"]))];
  }) : l("", !0), p2.toggleMask && !_2.unmasked ? e(p2.$slots, p2.$slots.unmaskicon ? "unmaskicon" : "showicon", t({ key: 1, toggleCallback: v2.onMaskToggle, class: [p2.cx("unmaskIcon")] }, p2.ptm("unmaskIcon")), function() {
    return [(n(), u(i(p2.unmaskIcon ? "i" : "EyeIcon"), t({ class: [p2.cx("unmaskIcon"), p2.unmaskIcon], onClick: v2.onMaskToggle }, p2.ptm("unmaskIcon")), null, 16, ["class", "onClick"]))];
  }) : l("", !0), v2.isClearIconVisible ? e(p2.$slots, "clearicon", t({ key: 2, class: p2.cx("clearIcon"), clearCallback: v2.onClearClick }, p2.ptm("clearIcon")), function() {
    return [d(b2, t({ class: [p2.cx("clearIcon")], onClick: v2.onClearClick }, p2.ptm("clearIcon")), null, 16, ["class", "onClick"])];
  }) : l("", !0), a("span", t({ class: "p-hidden-accessible", "aria-live": "polite" }, p2.ptm("hiddenAccesible"), { "data-p-hidden-accessible": !0 }), s(_2.infoText), 17), d(x2, { appendTo: p2.appendTo }, { default: c(function() {
    return [d(f, t({ name: "p-anchored-overlay", onEnter: v2.onOverlayEnter, onLeave: v2.onOverlayLeave, onAfterLeave: v2.onOverlayAfterLeave }, p2.ptm("transition")), { default: c(function() {
      return [_2.overlayVisible ? (n(), o("div", t({ key: 0, ref: v2.overlayRef, id: p2.overlayId || p2.panelId || v2.overlayUniqueId, class: [p2.cx("overlay"), p2.panelClass, p2.overlayClass], style: [p2.overlayStyle, p2.panelStyle], onClick: m2[0] ||= function() {
        return v2.onOverlayClick && v2.onOverlayClick.apply(v2, arguments);
      }, "data-p": v2.overlayDataP, role: "dialog", "aria-live": "polite" }, Q(Q(Q({}, p2.panelProps), p2.overlayProps), p2.ptm("overlay"))), [e(p2.$slots, "header"), e(p2.$slots, "content", {}, function() {
        return [a("div", t({ class: p2.cx("content") }, p2.ptm("content")), [a("div", t({ class: p2.cx("meter") }, p2.ptm("meter")), [a("div", t({ class: p2.cx("meterLabel"), style: { width: _2.meter ? _2.meter.width : "" }, "data-p": v2.meterDataP }, p2.ptm("meterLabel")), null, 16, ie)], 16), a("div", t({ class: p2.cx("meterText") }, p2.ptm("meterText")), s(_2.infoText), 17)], 16)];
      }), e(p2.$slots, "footer")], 16, re)) : l("", !0)];
    }), _: 3 }, 16, ["onEnter", "onLeave", "onAfterLeave"])];
  }), _: 3 }, 8, ["appendTo"])], 16, ne);
}
Y.render = ae;
export {Y as t};