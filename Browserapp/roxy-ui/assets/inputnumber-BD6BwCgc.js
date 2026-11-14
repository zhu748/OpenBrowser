import {J as e,P as t,W as n,Y as r,Z as i,en as a,et as o,f as s,h as c,m as l,p as u,rn as d,x as f} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {U as p,X as m,_ as h} from "./basecomponent-ClhuVxJN.js";
import {D as g,M as _} from "./dist-DPswMdzV.js";
import {t as v} from "./baseicon-Z_5Hqu9u.js";
import {t as y} from "./style--P_2bLcB.js";
import {t as b} from "./times-NAtDB1bj.js";
import {t as x} from "./baseinput-CQOYuWse.js";
import {t as S} from "./angledown-D6F5yPzs.js";
import {t as C} from "./inputtext-Crzvb5jQ.js";
var w = { name: "AngleUpIcon", extends: v };
function T(e2) {
  return k(e2) || O(e2) || D(e2) || E();
}
function E() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function D(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return A(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? A(e2, t2) : void 0;
  }
}
function O(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function k(e2) {
  if (Array.isArray(e2)) return A(e2);
}
function A(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function j(e2, r2, i2, a2, o2, l2) {
  return n(), c("svg", t({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, e2.pti()), T(r2[0] ||= [s("path", { d: "M10.4134 9.49931C10.3148 9.49977 10.2172 9.48055 10.1262 9.44278C10.0352 9.405 9.95263 9.34942 9.88338 9.27931L6.88338 6.27931L3.88338 9.27931C3.73811 9.34946 3.57409 9.3709 3.41567 9.34044C3.25724 9.30999 3.11286 9.22926 3.00395 9.11025C2.89504 8.99124 2.82741 8.84028 2.8111 8.67978C2.79478 8.51928 2.83065 8.35781 2.91338 8.21931L6.41338 4.71931C6.55401 4.57886 6.74463 4.49997 6.94338 4.49997C7.14213 4.49997 7.33276 4.57886 7.47338 4.71931L10.9734 8.21931C11.1138 8.35994 11.1927 8.55056 11.1927 8.74931C11.1927 8.94806 11.1138 9.13868 10.9734 9.27931C10.9007 9.35315 10.8132 9.41089 10.7168 9.44879C10.6203 9.48669 10.5169 9.5039 10.4134 9.49931Z", fill: "currentColor" }, null, -1)]), 16);
}
w.render = j;
var M = { name: "BaseInputNumber", extends: x, props: { format: { type: Boolean, default: !0 }, showButtons: { type: Boolean, default: !1 }, buttonLayout: { type: String, default: "stacked" }, incrementButtonClass: { type: String, default: null }, decrementButtonClass: { type: String, default: null }, incrementButtonIcon: { type: String, default: void 0 }, incrementIcon: { type: String, default: void 0 }, decrementButtonIcon: { type: String, default: void 0 }, decrementIcon: { type: String, default: void 0 }, locale: { type: String, default: void 0 }, localeMatcher: { type: String, default: void 0 }, mode: { type: String, default: "decimal" }, prefix: { type: String, default: null }, suffix: { type: String, default: null }, currency: { type: String, default: void 0 }, currencyDisplay: { type: String, default: void 0 }, useGrouping: { type: Boolean, default: !0 }, minFractionDigits: { type: Number, default: void 0 }, maxFractionDigits: { type: Number, default: void 0 }, roundingMode: { type: String, default: "halfExpand", validator: function(e2) {
  return ["ceil", "floor", "expand", "trunc", "halfCeil", "halfFloor", "halfExpand", "halfTrunc", "halfEven"].includes(e2);
} }, min: { type: Number, default: null }, max: { type: Number, default: null }, step: { type: Number, default: 1 }, allowEmpty: { type: Boolean, default: !0 }, highlightOnFocus: { type: Boolean, default: !1 }, showClear: { type: Boolean, default: !1 }, readonly: { type: Boolean, default: !1 }, placeholder: { type: String, default: null }, inputId: { type: String, default: null }, inputClass: { type: [String, Object], default: null }, inputStyle: { type: Object, default: null }, ariaLabelledby: { type: String, default: null }, ariaLabel: { type: String, default: null }, required: { type: Boolean, default: !1 } }, style: y, provide: function() {
  return { $pcInputNumber: this, $parentInstance: this };
} };
function N(e2) {
  "@babel/helpers - typeof";
  return N = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, N(e2);
}
function P(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function F(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? P(Object(n2), !0).forEach(function(t3) {
      I(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : P(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function I(e2, t2, n2) {
  return (t2 = L(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function L(e2) {
  var t2 = R(e2, "string");
  return N(t2) == "symbol" ? t2 : t2 + "";
}
function R(e2, t2) {
  if (N(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (N(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
function z(e2) {
  return U(e2) || H(e2) || V(e2) || B();
}
function B() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function V(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return W(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? W(e2, t2) : void 0;
  }
}
function H(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function U(e2) {
  if (Array.isArray(e2)) return W(e2);
}
function W(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
var G = { name: "InputNumber", extends: M, inheritAttrs: !1, emits: ["input", "focus", "blur"], inject: { $pcFluid: { default: null } }, numberFormat: null, _numeral: null, _decimal: null, _group: null, _minusSign: null, _currency: null, _suffix: null, _prefix: null, _index: null, groupChar: "", isSpecialChar: null, prefixChar: null, suffixChar: null, timer: null, data: function() {
  return { d_modelValue: this.d_value, focused: !1 };
}, watch: { d_value: { immediate: !0, handler: function(e2) {
  var t2;
  this.d_modelValue = e2, (t2 = this.$refs.clearIcon) != null && (t2 = t2.$el) != null && t2.style && (this.$refs.clearIcon.$el.style.display = g(e2) ? "none" : "block");
} }, locale: function(e2, t2) {
  this.updateConstructParser(e2, t2);
}, localeMatcher: function(e2, t2) {
  this.updateConstructParser(e2, t2);
}, mode: function(e2, t2) {
  this.updateConstructParser(e2, t2);
}, currency: function(e2, t2) {
  this.updateConstructParser(e2, t2);
}, currencyDisplay: function(e2, t2) {
  this.updateConstructParser(e2, t2);
}, useGrouping: function(e2, t2) {
  this.updateConstructParser(e2, t2);
}, minFractionDigits: function(e2, t2) {
  this.updateConstructParser(e2, t2);
}, maxFractionDigits: function(e2, t2) {
  this.updateConstructParser(e2, t2);
}, suffix: function(e2, t2) {
  this.updateConstructParser(e2, t2);
}, prefix: function(e2, t2) {
  this.updateConstructParser(e2, t2);
} }, created: function() {
  this.constructParser();
}, mounted: function() {
  var e2;
  (e2 = this.$refs.clearIcon) != null && (e2 = e2.$el) != null && e2.style && (this.$refs.clearIcon.$el.style.display = this.$filled ? "block" : "none");
}, methods: { getOptions: function() {
  return { localeMatcher: this.localeMatcher, style: this.mode, currency: this.currency, currencyDisplay: this.currencyDisplay, useGrouping: this.useGrouping, minimumFractionDigits: this.minFractionDigits, maximumFractionDigits: this.maxFractionDigits, roundingMode: this.roundingMode };
}, constructParser: function() {
  this.numberFormat = new Intl.NumberFormat(this.locale, this.getOptions());
  var e2 = z(new Intl.NumberFormat(this.locale, { useGrouping: !1 }).format(9876543210)).reverse(), t2 = new Map(e2.map(function(e3, t3) {
    return [e3, t3];
  }));
  this._numeral = RegExp(`[${e2.join("")}]`, "g"), this._group = this.getGroupingExpression(), this._minusSign = this.getMinusSignExpression(), this._currency = this.getCurrencyExpression(), this._decimal = this.getDecimalExpression(), this._suffix = this.getSuffixExpression(), this._prefix = this.getPrefixExpression(), this._index = function(e3) {
    return t2.get(e3);
  };
}, updateConstructParser: function(e2, t2) {
  e2 !== t2 && this.constructParser();
}, escapeRegExp: function(e2) {
  return e2.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}, getDecimalExpression: function() {
  var e2 = new Intl.NumberFormat(this.locale, F(F({}, this.getOptions()), {}, { useGrouping: !1 })), t2 = e2.format(1.1);
  return t2 === e2.format(1) ? RegExp("[]", "g") : RegExp(`[${t2.replace(this._currency, "").trim().replace(this._numeral, "")}]`, "g");
}, getGroupingExpression: function() {
  var e2 = new Intl.NumberFormat(this.locale, { useGrouping: !0 });
  return this.groupChar = e2.format(1e6).trim().replace(this._numeral, "").charAt(0), RegExp(`[${this.groupChar}]`, "g");
}, getMinusSignExpression: function() {
  var e2 = new Intl.NumberFormat(this.locale, { useGrouping: !1 });
  return RegExp(`[${e2.format(-1).trim().replace(this._numeral, "")}]`, "g");
}, getCurrencyExpression: function() {
  if (this.currency) {
    var e2 = new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, currencyDisplay: this.currencyDisplay, minimumFractionDigits: 0, maximumFractionDigits: 0, roundingMode: this.roundingMode });
    return RegExp(`[${e2.format(1).replace(/\s/g, "").replace(this._numeral, "").replace(this._group, "")}]`, "g");
  }
  return RegExp("[]", "g");
}, getPrefixExpression: function() {
  if (this.prefix) this.prefixChar = this.prefix;
  else {
    var e2 = new Intl.NumberFormat(this.locale, { style: this.mode, currency: this.currency, currencyDisplay: this.currencyDisplay });
    this.prefixChar = e2.format(1).split("1")[0];
  }
  return RegExp(`${this.escapeRegExp(this.prefixChar || "")}`, "g");
}, getSuffixExpression: function() {
  if (this.suffix) this.suffixChar = this.suffix;
  else {
    var e2 = new Intl.NumberFormat(this.locale, { style: this.mode, currency: this.currency, currencyDisplay: this.currencyDisplay, minimumFractionDigits: 0, maximumFractionDigits: 0, roundingMode: this.roundingMode });
    this.suffixChar = e2.format(1).split("1")[1];
  }
  return RegExp(`${this.escapeRegExp(this.suffixChar || "")}`, "g");
}, formatValue: function(e2) {
  if (e2 != null) {
    if (e2 === "-") return e2;
    if (this.format) {
      var t2 = new Intl.NumberFormat(this.locale, this.getOptions()).format(e2);
      return this.prefix && (t2 = this.prefix + t2), this.suffix && (t2 += this.suffix), t2;
    }
    return e2.toString();
  }
  return "";
}, parseValue: function(e2) {
  var t2 = e2.replace(this._suffix, "").replace(this._prefix, "").trim().replace(/\s/g, "").replace(this._currency, "").replace(this._group, "").replace(this._minusSign, "-").replace(this._decimal, ".").replace(this._numeral, this._index);
  if (t2) {
    if (t2 === "-") return t2;
    var n2 = +t2;
    return isNaN(n2) ? null : n2;
  }
  return null;
}, repeat: function(e2, t2, n2) {
  var r2 = this;
  if (!this.readonly) {
    var i2 = t2 || 500;
    this.clearTimer(), this.timer = setTimeout(function() {
      r2.repeat(e2, 40, n2);
    }, i2), this.spin(e2, n2);
  }
}, addWithPrecision: function(e2, t2) {
  var n2 = e2.toString(), r2 = t2.toString(), i2 = n2.includes(".") ? n2.split(".")[1].length : 0, a2 = r2.includes(".") ? r2.split(".")[1].length : 0, o2 = 10 ** Math.max(i2, a2);
  return Math.round((e2 + t2) * o2) / o2;
}, spin: function(e2, t2) {
  if (this.$refs.input) {
    var n2 = this.step * t2, r2 = this.parseValue(this.$refs.input.$el.value) || 0, i2 = this.validateValue(this.addWithPrecision(r2, n2));
    this.updateInput(i2, null, "spin"), this.updateModel(e2, i2), this.handleOnInput(e2, r2, i2);
  }
}, onUpButtonMouseDown: function(e2) {
  this.disabled || (this.$refs.input.$el.focus(), this.repeat(e2, null, 1), e2.preventDefault());
}, onUpButtonMouseUp: function() {
  this.disabled || this.clearTimer();
}, onUpButtonMouseLeave: function() {
  this.disabled || this.clearTimer();
}, onUpButtonKeyUp: function() {
  this.disabled || this.clearTimer();
}, onUpButtonKeyDown: function(e2) {
  (e2.code === "Space" || e2.code === "Enter" || e2.code === "NumpadEnter") && this.repeat(e2, null, 1);
}, onDownButtonMouseDown: function(e2) {
  this.disabled || (this.$refs.input.$el.focus(), this.repeat(e2, null, -1), e2.preventDefault());
}, onDownButtonMouseUp: function() {
  this.disabled || this.clearTimer();
}, onDownButtonMouseLeave: function() {
  this.disabled || this.clearTimer();
}, onDownButtonKeyUp: function() {
  this.disabled || this.clearTimer();
}, onDownButtonKeyDown: function(e2) {
  (e2.code === "Space" || e2.code === "Enter" || e2.code === "NumpadEnter") && this.repeat(e2, null, -1);
}, onUserInput: function() {
  this.isSpecialChar && (this.$refs.input.$el.value = this.lastValue), this.isSpecialChar = !1;
}, onInputKeyDown: function(e2) {
  if (!this.readonly && !e2.isComposing)
    if (e2.altKey || e2.ctrlKey || e2.metaKey) this.isSpecialChar = !0, this.lastValue = this.$refs.input.$el.value;
    else {
      this.lastValue = e2.target.value;
      var t2 = e2.target.selectionStart, n2 = e2.target.selectionEnd, r2 = n2 - t2, i2 = e2.target.value, a2 = null;
      switch (e2.code || e2.key) {
        case "ArrowUp":
          this.spin(e2, 1), e2.preventDefault();
          break;
        case "ArrowDown":
          this.spin(e2, -1), e2.preventDefault();
          break;
        case "ArrowLeft":
          if (r2 > 1) {
            var o2 = this.isNumeralChar(i2.charAt(t2)) ? t2 + 1 : t2 + 2;
            this.$refs.input.$el.setSelectionRange(o2, o2);
          } else this.isNumeralChar(i2.charAt(t2 - 1)) || e2.preventDefault();
          break;
        case "ArrowRight":
          if (r2 > 1) {
            var s2 = n2 - 1;
            this.$refs.input.$el.setSelectionRange(s2, s2);
          } else this.isNumeralChar(i2.charAt(t2)) || e2.preventDefault();
          break;
        case "Tab":
        case "Enter":
        case "NumpadEnter":
          a2 = this.validateValue(this.parseValue(i2)), this.$refs.input.$el.value = this.formatValue(a2), this.$refs.input.$el.setAttribute("aria-valuenow", a2), this.updateModel(e2, a2);
          break;
        case "Backspace":
          if (e2.preventDefault(), t2 === n2) {
            t2 >= i2.length && this.suffixChar !== null && (t2 = i2.length - this.suffixChar.length, this.$refs.input.$el.setSelectionRange(t2, t2));
            var c2 = i2.charAt(t2 - 1), l2 = this.getDecimalCharIndexes(i2), u2 = l2.decimalCharIndex, d2 = l2.decimalCharIndexWithoutPrefix;
            if (this.isNumeralChar(c2)) {
              var f2 = this.getDecimalLength(i2);
              if (this._group.test(c2)) this._group.lastIndex = 0, a2 = i2.slice(0, t2 - 2) + i2.slice(t2 - 1);
              else if (this._decimal.test(c2)) this._decimal.lastIndex = 0, f2 ? this.$refs.input.$el.setSelectionRange(t2 - 1, t2 - 1) : a2 = i2.slice(0, t2 - 1) + i2.slice(t2);
              else if (u2 > 0 && t2 > u2) {
                var p2 = this.isDecimalMode() && (this.minFractionDigits || 0) < f2 ? "" : "0";
                a2 = i2.slice(0, t2 - 1) + p2 + i2.slice(t2);
              } else d2 === 1 ? (a2 = i2.slice(0, t2 - 1) + "0" + i2.slice(t2), a2 = this.parseValue(a2) > 0 ? a2 : "") : a2 = i2.slice(0, t2 - 1) + i2.slice(t2);
            }
            this.updateValue(e2, a2, null, "delete-single");
          } else a2 = this.deleteRange(i2, t2, n2), this.updateValue(e2, a2, null, "delete-range");
          break;
        case "Delete":
          if (e2.preventDefault(), t2 === n2) {
            var m2 = i2.charAt(t2), h2 = this.getDecimalCharIndexes(i2), g2 = h2.decimalCharIndex, v2 = h2.decimalCharIndexWithoutPrefix;
            if (this.isNumeralChar(m2)) {
              var y2 = this.getDecimalLength(i2);
              if (this._group.test(m2)) this._group.lastIndex = 0, a2 = i2.slice(0, t2) + i2.slice(t2 + 2);
              else if (this._decimal.test(m2)) this._decimal.lastIndex = 0, y2 ? this.$refs.input.$el.setSelectionRange(t2 + 1, t2 + 1) : a2 = i2.slice(0, t2) + i2.slice(t2 + 1);
              else if (g2 > 0 && t2 > g2) {
                var b2 = this.isDecimalMode() && (this.minFractionDigits || 0) < y2 ? "" : "0";
                a2 = i2.slice(0, t2) + b2 + i2.slice(t2 + 1);
              } else v2 === 1 ? (a2 = i2.slice(0, t2) + "0" + i2.slice(t2 + 1), a2 = this.parseValue(a2) > 0 ? a2 : "") : a2 = i2.slice(0, t2) + i2.slice(t2 + 1);
            }
            this.updateValue(e2, a2, null, "delete-back-single");
          } else a2 = this.deleteRange(i2, t2, n2), this.updateValue(e2, a2, null, "delete-range");
          break;
        case "Home":
          e2.preventDefault(), _(this.min) && this.updateModel(e2, this.min);
          break;
        case "End":
          e2.preventDefault(), _(this.max) && this.updateModel(e2, this.max);
      }
    }
}, onInputKeyPress: function(e2) {
  if (!this.readonly) {
    var t2 = e2.key, n2 = this.isDecimalSign(t2), r2 = this.isMinusSign(t2);
    e2.code !== "Enter" && e2.preventDefault(), (Number(t2) >= 0 && Number(t2) <= 9 || r2 || n2) && this.insert(e2, t2, { isDecimalSign: n2, isMinusSign: r2 });
  }
}, onPaste: function(e2) {
  if (!(this.readonly || this.disabled)) {
    e2.preventDefault();
    var t2 = (e2.clipboardData || window.clipboardData).getData("Text");
    if (!(this.inputId === "integeronly" && /[^\d-]/.test(t2)) && t2) {
      var n2 = this.parseValue(t2);
      n2 != null && this.insert(e2, n2.toString());
    }
  }
}, onClearClick: function(e2) {
  this.updateModel(e2, null), this.$refs.input.$el.focus();
}, allowMinusSign: function() {
  return this.min === null || this.min < 0;
}, isMinusSign: function(e2) {
  return this._minusSign.test(e2) || e2 === "-" ? (this._minusSign.lastIndex = 0, !0) : !1;
}, isDecimalSign: function(e2) {
  var t2;
  return (t2 = this.locale) != null && t2.includes("fr") && [".", ","].includes(e2) || this._decimal.test(e2) ? (this._decimal.lastIndex = 0, !0) : !1;
}, isDecimalMode: function() {
  return this.mode === "decimal";
}, getDecimalCharIndexes: function(e2) {
  var t2 = e2.search(this._decimal);
  this._decimal.lastIndex = 0;
  var n2 = e2.replace(this._prefix, "").trim().replace(/\s/g, "").replace(this._currency, "").search(this._decimal);
  return this._decimal.lastIndex = 0, { decimalCharIndex: t2, decimalCharIndexWithoutPrefix: n2 };
}, getCharIndexes: function(e2) {
  var t2 = e2.search(this._decimal);
  this._decimal.lastIndex = 0;
  var n2 = e2.search(this._minusSign);
  this._minusSign.lastIndex = 0;
  var r2 = e2.search(this._suffix);
  this._suffix.lastIndex = 0;
  var i2 = e2.search(this._currency);
  return this._currency.lastIndex = 0, { decimalCharIndex: t2, minusCharIndex: n2, suffixCharIndex: r2, currencyCharIndex: i2 };
}, insert: function(e2, t2) {
  var n2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : { isDecimalSign: !1, isMinusSign: !1 }, r2 = t2.search(this._minusSign);
  if (this._minusSign.lastIndex = 0, this.allowMinusSign() || r2 === -1) {
    var i2 = this.$refs.input.$el.selectionStart, a2 = this.$refs.input.$el.selectionEnd, o2 = this.$refs.input.$el.value.trim(), s2 = this.getCharIndexes(o2), c2 = s2.decimalCharIndex, l2 = s2.minusCharIndex, u2 = s2.suffixCharIndex, d2 = s2.currencyCharIndex, f2;
    if (n2.isMinusSign) {
      var p2 = l2 === -1;
      (i2 === 0 || i2 === d2 + 1) && (f2 = o2, (p2 || a2 !== 0) && (f2 = this.insertText(o2, t2, 0, a2)), this.updateValue(e2, f2, t2, "insert"));
    } else if (n2.isDecimalSign) c2 > 0 && i2 === c2 ? this.updateValue(e2, o2, t2, "insert") : (c2 > i2 && c2 < a2 || c2 === -1 && this.maxFractionDigits) && (f2 = this.insertText(o2, t2, i2, a2), this.updateValue(e2, f2, t2, "insert"));
    else {
      var m2 = this.numberFormat.resolvedOptions().maximumFractionDigits, h2 = i2 === a2 ? "insert" : "range-insert";
      if (c2 > 0 && i2 > c2) {
        if (i2 + t2.length - (c2 + 1) <= m2) {
          var g2 = d2 >= i2 ? d2 - 1 : u2 >= i2 ? u2 : o2.length;
          f2 = o2.slice(0, i2) + t2 + o2.slice(i2 + t2.length, g2) + o2.slice(g2), this.updateValue(e2, f2, t2, h2);
        }
      } else f2 = this.insertText(o2, t2, i2, a2), this.updateValue(e2, f2, t2, h2);
    }
  }
}, insertText: function(e2, t2, n2, r2) {
  if ((t2 === "." ? t2 : t2.split(".")).length === 2) {
    var i2 = e2.slice(n2, r2).search(this._decimal);
    return this._decimal.lastIndex = 0, i2 > 0 ? e2.slice(0, n2) + this.formatValue(t2) + e2.slice(r2) : this.formatValue(t2) || e2;
  }
  return r2 - n2 === e2.length ? this.formatValue(t2) : n2 === 0 ? t2 + e2.slice(r2) : r2 === e2.length ? e2.slice(0, n2) + t2 : e2.slice(0, n2) + t2 + e2.slice(r2);
}, deleteRange: function(e2, t2, n2) {
  return n2 - t2 === e2.length ? "" : t2 === 0 ? e2.slice(n2) : n2 === e2.length ? e2.slice(0, t2) : e2.slice(0, t2) + e2.slice(n2);
}, initCursor: function() {
  var e2 = this.$refs.input.$el.selectionStart, t2 = this.$refs.input.$el.value, n2 = t2.length, r2 = null, i2 = (this.prefixChar || "").length;
  t2 = t2.replace(this._prefix, ""), e2 -= i2;
  var a2 = t2.charAt(e2);
  if (this.isNumeralChar(a2)) return e2 + i2;
  for (var o2 = e2 - 1; o2 >= 0; ) {
    if (a2 = t2.charAt(o2), this.isNumeralChar(a2)) {
      r2 = o2 + i2;
      break;
    }
    o2--;
  }
  if (r2 !== null) this.$refs.input.$el.setSelectionRange(r2 + 1, r2 + 1);
  else {
    for (o2 = e2; o2 < n2; ) {
      if (a2 = t2.charAt(o2), this.isNumeralChar(a2)) {
        r2 = o2 + i2;
        break;
      }
      o2++;
    }
    r2 !== null && this.$refs.input.$el.setSelectionRange(r2, r2);
  }
  return r2 || 0;
}, onInputClick: function() {
  var e2 = this.$refs.input.$el.value;
  !this.readonly && e2 !== h() && this.initCursor();
}, isNumeralChar: function(e2) {
  return e2.length === 1 && (this._numeral.test(e2) || this._decimal.test(e2) || this._group.test(e2) || this._minusSign.test(e2)) ? (this.resetRegex(), !0) : !1;
}, resetRegex: function() {
  this._numeral.lastIndex = 0, this._decimal.lastIndex = 0, this._group.lastIndex = 0, this._minusSign.lastIndex = 0;
}, updateValue: function(e2, t2, n2, r2) {
  var i2 = this.$refs.input.$el.value, a2 = null;
  t2 != null && (a2 = this.parseValue(t2), a2 = !a2 && !this.allowEmpty ? 0 : a2, this.updateInput(a2, n2, r2, t2), this.handleOnInput(e2, i2, a2));
}, handleOnInput: function(e2, t2, n2) {
  if (this.isValueChanged(t2, n2)) {
    var r2, i2;
    this.$emit("input", { originalEvent: e2, value: n2, formattedValue: t2 }), (r2 = (i2 = this.formField).onInput) == null || r2.call(i2, { originalEvent: e2, value: n2 });
  }
}, isValueChanged: function(e2, t2) {
  return t2 === null && e2 !== null || t2 != null && t2 !== (typeof e2 == "string" ? this.parseValue(e2) : e2);
}, validateValue: function(e2) {
  return e2 === "-" || e2 == null ? null : this.min != null && e2 < this.min ? this.min : this.max != null && e2 > this.max ? this.max : e2;
}, updateInput: function(e2, t2, n2, r2) {
  var i2;
  t2 ||= "";
  var a2 = this.$refs.input.$el.value, o2 = this.formatValue(e2), s2 = a2.length;
  if (o2 !== r2 && (o2 = this.concatValues(o2, r2)), s2 === 0) {
    this.$refs.input.$el.value = o2, this.$refs.input.$el.setSelectionRange(0, 0);
    var c2 = this.initCursor() + t2.length;
    this.$refs.input.$el.setSelectionRange(c2, c2);
  } else {
    var l2 = this.$refs.input.$el.selectionStart, u2 = this.$refs.input.$el.selectionEnd;
    this.$refs.input.$el.value = o2;
    var d2 = o2.length;
    if (n2 === "range-insert") {
      var f2 = this.parseValue((a2 || "").slice(0, l2)), p2 = (f2 === null ? "" : f2.toString()).split("").join(`(${this.groupChar})?`), m2 = new RegExp(p2, "g");
      m2.test(o2);
      var h2 = t2.split("").join(`(${this.groupChar})?`), _2 = new RegExp(h2, "g");
      _2.test(o2.slice(m2.lastIndex)), u2 = m2.lastIndex + _2.lastIndex, this.$refs.input.$el.setSelectionRange(u2, u2);
    } else if (d2 === s2) n2 === "insert" || n2 === "delete-back-single" ? this.$refs.input.$el.setSelectionRange(u2 + 1, u2 + 1) : n2 === "delete-single" ? this.$refs.input.$el.setSelectionRange(u2 - 1, u2 - 1) : (n2 === "delete-range" || n2 === "spin") && this.$refs.input.$el.setSelectionRange(u2, u2);
    else if (n2 === "delete-back-single") {
      var v2 = a2.charAt(u2 - 1), y2 = a2.charAt(u2), b2 = s2 - d2, x2 = this._group.test(y2);
      x2 && b2 === 1 ? u2 += 1 : !x2 && this.isNumeralChar(v2) && (u2 += -1 * b2 + 1), this._group.lastIndex = 0, this.$refs.input.$el.setSelectionRange(u2, u2);
    } else if (a2 === "-" && n2 === "insert") {
      this.$refs.input.$el.setSelectionRange(0, 0);
      var S2 = this.initCursor() + t2.length + 1;
      this.$refs.input.$el.setSelectionRange(S2, S2);
    } else u2 += d2 - s2, this.$refs.input.$el.setSelectionRange(u2, u2);
  }
  this.$refs.input.$el.setAttribute("aria-valuenow", e2), (i2 = this.$refs.clearIcon) != null && (i2 = i2.$el) != null && i2.style && (this.$refs.clearIcon.$el.style.display = g(o2) ? "none" : "block");
}, concatValues: function(e2, t2) {
  if (e2 && t2) {
    var n2 = t2.search(this._decimal);
    return this._decimal.lastIndex = 0, this.suffixChar ? n2 === -1 ? e2 : e2.replace(this.suffixChar, "").split(this._decimal)[0] + t2.replace(this.suffixChar, "").slice(n2) + this.suffixChar : n2 === -1 ? e2 : e2.split(this._decimal)[0] + t2.slice(n2);
  }
  return e2;
}, getDecimalLength: function(e2) {
  if (e2) {
    var t2 = e2.split(this._decimal);
    if (t2.length === 2) return t2[1].replace(this._suffix, "").trim().replace(/\s/g, "").replace(this._currency, "").length;
  }
  return 0;
}, updateModel: function(e2, t2) {
  this.writeValue(t2, e2);
}, onInputFocus: function(e2) {
  this.focused = !0, !this.disabled && !this.readonly && this.$refs.input.$el.value !== h() && this.highlightOnFocus && e2.target.select(), this.$emit("focus", e2);
}, onInputBlur: function(e2) {
  var t2, n2;
  this.focused = !1;
  var r2 = e2.target, i2 = this.validateValue(this.parseValue(r2.value));
  this.$emit("blur", { originalEvent: e2, value: r2.value }), (t2 = (n2 = this.formField).onBlur) == null || t2.call(n2, e2), r2.value = this.formatValue(i2), r2.setAttribute("aria-valuenow", i2), this.updateModel(e2, i2), !this.disabled && !this.readonly && this.highlightOnFocus && p();
}, clearTimer: function() {
  this.timer && clearTimeout(this.timer);
}, maxBoundry: function() {
  return this.d_value >= this.max;
}, minBoundry: function() {
  return this.d_value <= this.min;
} }, computed: { upButtonListeners: function() {
  var e2 = this;
  return { mousedown: function(t2) {
    return e2.onUpButtonMouseDown(t2);
  }, mouseup: function(t2) {
    return e2.onUpButtonMouseUp(t2);
  }, mouseleave: function(t2) {
    return e2.onUpButtonMouseLeave(t2);
  }, keydown: function(t2) {
    return e2.onUpButtonKeyDown(t2);
  }, keyup: function(t2) {
    return e2.onUpButtonKeyUp(t2);
  } };
}, downButtonListeners: function() {
  var e2 = this;
  return { mousedown: function(t2) {
    return e2.onDownButtonMouseDown(t2);
  }, mouseup: function(t2) {
    return e2.onDownButtonMouseUp(t2);
  }, mouseleave: function(t2) {
    return e2.onDownButtonMouseLeave(t2);
  }, keydown: function(t2) {
    return e2.onDownButtonKeyDown(t2);
  }, keyup: function(t2) {
    return e2.onDownButtonKeyUp(t2);
  } };
}, formattedValue: function() {
  var e2 = !this.d_value && !this.allowEmpty ? 0 : this.d_value;
  return this.formatValue(e2);
}, getFormatter: function() {
  return this.numberFormat;
}, dataP: function() {
  return m(I(I({ invalid: this.$invalid, fluid: this.$fluid, filled: this.$variant === "filled" }, this.size, this.size), this.buttonLayout, this.showButtons && this.buttonLayout));
} }, components: { InputText: C, AngleUpIcon: w, AngleDownIcon: S, TimesIcon: b } };
var K = ["data-p"];
var q = ["data-p"];
var J = ["disabled", "data-p"];
var Y = ["disabled", "data-p"];
var X = ["disabled", "data-p"];
var Z = ["disabled", "data-p"];
function Q(p2, m2, h2, g2, _2, v2) {
  var y2 = r("InputText"), b2 = r("TimesIcon");
  return n(), c("span", t({ class: p2.cx("root") }, p2.ptmi("root"), { "data-p": v2.dataP }), [f(y2, { ref: "input", id: p2.inputId, name: p2.$formName, role: "spinbutton", class: a([p2.cx("pcInputText"), p2.inputClass]), style: d(p2.inputStyle), defaultValue: v2.formattedValue, "aria-valuemin": p2.min, "aria-valuemax": p2.max, "aria-valuenow": p2.d_value, inputmode: p2.mode === "decimal" && !p2.minFractionDigits ? "numeric" : "decimal", disabled: p2.disabled, readonly: p2.readonly, placeholder: p2.placeholder, "aria-labelledby": p2.ariaLabelledby, "aria-label": p2.ariaLabel, required: p2.required, size: p2.size, invalid: p2.invalid, variant: p2.variant, onInput: v2.onUserInput, onKeydown: v2.onInputKeyDown, onKeypress: v2.onInputKeyPress, onPaste: v2.onPaste, onClick: v2.onInputClick, onFocus: v2.onInputFocus, onBlur: v2.onInputBlur, pt: p2.ptm("pcInputText"), unstyled: p2.unstyled, "data-p": v2.dataP }, null, 8, "id.name.class.style.defaultValue.aria-valuemin.aria-valuemax.aria-valuenow.inputmode.disabled.readonly.placeholder.aria-labelledby.aria-label.required.size.invalid.variant.onInput.onKeydown.onKeypress.onPaste.onClick.onFocus.onBlur.pt.unstyled.data-p".split(".")), p2.showClear && p2.buttonLayout !== "vertical" ? e(p2.$slots, "clearicon", { key: 0, class: a(p2.cx("clearIcon")), clearCallback: v2.onClearClick }, function() {
    return [f(b2, t({ ref: "clearIcon", class: [p2.cx("clearIcon")], onClick: v2.onClearClick }, p2.ptm("clearIcon")), null, 16, ["class", "onClick"])];
  }) : l("", !0), p2.showButtons && p2.buttonLayout === "stacked" ? (n(), c("span", t({ key: 1, class: p2.cx("buttonGroup") }, p2.ptm("buttonGroup"), { "data-p": v2.dataP }), [e(p2.$slots, "incrementbutton", { listeners: v2.upButtonListeners }, function() {
    return [s("button", t({ class: [p2.cx("incrementButton"), p2.incrementButtonClass] }, o(v2.upButtonListeners, !0), { disabled: p2.disabled, tabindex: -1, "aria-hidden": "true", type: "button" }, p2.ptm("incrementButton"), { "data-p": v2.dataP }), [e(p2.$slots, p2.$slots.incrementicon ? "incrementicon" : "incrementbuttonicon", {}, function() {
      return [(n(), u(i(p2.incrementIcon || p2.incrementButtonIcon ? "span" : "AngleUpIcon"), t({ class: [p2.incrementIcon, p2.incrementButtonIcon] }, p2.ptm("incrementIcon"), { "data-pc-section": "incrementicon" }), null, 16, ["class"]))];
    })], 16, J)];
  }), e(p2.$slots, "decrementbutton", { listeners: v2.downButtonListeners }, function() {
    return [s("button", t({ class: [p2.cx("decrementButton"), p2.decrementButtonClass] }, o(v2.downButtonListeners, !0), { disabled: p2.disabled, tabindex: -1, "aria-hidden": "true", type: "button" }, p2.ptm("decrementButton"), { "data-p": v2.dataP }), [e(p2.$slots, p2.$slots.decrementicon ? "decrementicon" : "decrementbuttonicon", {}, function() {
      return [(n(), u(i(p2.decrementIcon || p2.decrementButtonIcon ? "span" : "AngleDownIcon"), t({ class: [p2.decrementIcon, p2.decrementButtonIcon] }, p2.ptm("decrementIcon"), { "data-pc-section": "decrementicon" }), null, 16, ["class"]))];
    })], 16, Y)];
  })], 16, q)) : l("", !0), e(p2.$slots, "incrementbutton", { listeners: v2.upButtonListeners }, function() {
    return [p2.showButtons && p2.buttonLayout !== "stacked" ? (n(), c("button", t({ key: 0, class: [p2.cx("incrementButton"), p2.incrementButtonClass] }, o(v2.upButtonListeners, !0), { disabled: p2.disabled, tabindex: -1, "aria-hidden": "true", type: "button" }, p2.ptm("incrementButton"), { "data-p": v2.dataP }), [e(p2.$slots, p2.$slots.incrementicon ? "incrementicon" : "incrementbuttonicon", {}, function() {
      return [(n(), u(i(p2.incrementIcon || p2.incrementButtonIcon ? "span" : "AngleUpIcon"), t({ class: [p2.incrementIcon, p2.incrementButtonIcon] }, p2.ptm("incrementIcon"), { "data-pc-section": "incrementicon" }), null, 16, ["class"]))];
    })], 16, X)) : l("", !0)];
  }), e(p2.$slots, "decrementbutton", { listeners: v2.downButtonListeners }, function() {
    return [p2.showButtons && p2.buttonLayout !== "stacked" ? (n(), c("button", t({ key: 0, class: [p2.cx("decrementButton"), p2.decrementButtonClass] }, o(v2.downButtonListeners, !0), { disabled: p2.disabled, tabindex: -1, "aria-hidden": "true", type: "button" }, p2.ptm("decrementButton"), { "data-p": v2.dataP }), [e(p2.$slots, p2.$slots.decrementicon ? "decrementicon" : "decrementbuttonicon", {}, function() {
      return [(n(), u(i(p2.decrementIcon || p2.decrementButtonIcon ? "span" : "AngleDownIcon"), t({ class: [p2.decrementIcon, p2.decrementButtonIcon] }, p2.ptm("decrementIcon"), { "data-pc-section": "decrementicon" }), null, 16, ["class"]))];
    })], 16, Z)) : l("", !0)];
  })], 16, K);
}
G.render = Q;
export {G as t};