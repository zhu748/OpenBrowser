import {C as e,E as t,J as n,P as r,W as i,X as a,Y as o,en as s,f as c,g as l,h as u,i as d,in as f,jt as p,lt as m,m as h,nn as g,p as _,q as v,ut as y,v as b} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {X as x} from "./basecomponent-ClhuVxJN.js";
import {t as S} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {A as C,E as w,M as T} from "./dist-DPswMdzV.js";
import {t as E} from "./ripple-DKjDc6yC.js";
import {n as D,t as O} from "./style-DVUKTuRI.js";
import {t as k} from "./baseeditableholder-DHdW4ii2.js";
var A = { name: "BaseToggleButton", extends: k, props: { onIcon: String, offIcon: String, onLabel: { type: String, default: "Yes" }, offLabel: { type: String, default: "No" }, readonly: { type: Boolean, default: !1 }, tabindex: { type: Number, default: null }, ariaLabelledby: { type: String, default: null }, ariaLabel: { type: String, default: null }, size: { type: String, default: null }, fluid: { type: Boolean, default: null } }, style: O, provide: function() {
  return { $pcToggleButton: this, $parentInstance: this };
} };
function j(e2) {
  "@babel/helpers - typeof";
  return j = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, j(e2);
}
function M(e2, t2, n2) {
  return (t2 = N(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function N(e2) {
  var t2 = P(e2, "string");
  return j(t2) == "symbol" ? t2 : t2 + "";
}
function P(e2, t2) {
  if (j(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (j(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var F = { name: "ToggleButton", extends: A, inheritAttrs: !1, emits: ["change"], methods: { getPTOptions: function(e2) {
  return (e2 === "root" ? this.ptmi : this.ptm)(e2, { context: { active: this.active, disabled: this.disabled } });
}, onChange: function(e2) {
  !this.disabled && !this.readonly && (this.writeValue(!this.d_value, e2), this.$emit("change", e2));
}, onBlur: function(e2) {
  var t2, n2;
  (t2 = (n2 = this.formField).onBlur) == null || t2.call(n2, e2);
} }, computed: { active: function() {
  return this.d_value === !0;
}, hasLabel: function() {
  return T(this.onLabel) && T(this.offLabel);
}, label: function() {
  return this.hasLabel ? this.d_value ? this.onLabel : this.offLabel : "\xA0";
}, dataP: function() {
  return x(M({ checked: this.active, invalid: this.$invalid }, this.size, this.size));
} }, directives: { ripple: E } };
var I = ["tabindex", "disabled", "aria-pressed", "aria-label", "aria-labelledby", "data-p-checked", "data-p-disabled", "data-p"];
var L = ["data-p"];
function R(e2, t2, o2, l2, d2, p2) {
  var m2 = a("ripple");
  return y((i(), u("button", r({ type: "button", class: e2.cx("root"), tabindex: e2.tabindex, disabled: e2.disabled, "aria-pressed": e2.d_value, onClick: t2[0] ||= function() {
    return p2.onChange && p2.onChange.apply(p2, arguments);
  }, onBlur: t2[1] ||= function() {
    return p2.onBlur && p2.onBlur.apply(p2, arguments);
  } }, p2.getPTOptions("root"), { "aria-label": e2.ariaLabel, "aria-labelledby": e2.ariaLabelledby, "data-p-checked": p2.active, "data-p-disabled": e2.disabled, "data-p": p2.dataP }), [c("span", r({ class: e2.cx("content") }, p2.getPTOptions("content"), { "data-p": p2.dataP }), [n(e2.$slots, "default", {}, function() {
    return [n(e2.$slots, "icon", { value: e2.d_value, class: s(e2.cx("icon")) }, function() {
      return [e2.onIcon || e2.offIcon ? (i(), u("span", r({ key: 0, class: [e2.cx("icon"), e2.d_value ? e2.onIcon : e2.offIcon] }, p2.getPTOptions("icon")), null, 16)) : h("", !0)];
    }), c("span", r({ class: e2.cx("label") }, p2.getPTOptions("label")), f(p2.label), 17)];
  })], 16, L)], 16, I)), [[m2]]);
}
F.render = R;
var z = { name: "BaseSelectButton", extends: k, props: { options: Array, optionLabel: null, optionValue: null, optionDisabled: null, multiple: Boolean, allowEmpty: { type: Boolean, default: !0 }, dataKey: null, ariaLabelledby: { type: String, default: null }, size: { type: String, default: null }, fluid: { type: Boolean, default: null } }, style: D, provide: function() {
  return { $pcSelectButton: this, $parentInstance: this };
} };
function B(e2, t2) {
  var n2 = typeof Symbol < "u" && e2[Symbol.iterator] || e2["@@iterator"];
  if (!n2) {
    if (Array.isArray(e2) || (n2 = U(e2)) || t2) {
      n2 && (e2 = n2);
      var r2 = 0, i2 = function() {
      };
      return { s: i2, n: function() {
        return r2 >= e2.length ? { done: !0 } : { done: !1, value: e2[r2++] };
      }, e: function(e3) {
        throw e3;
      }, f: i2 };
    }
    throw TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
  }
  var a2, o2 = !0, s2 = !1;
  return { s: function() {
    n2 = n2.call(e2);
  }, n: function() {
    var e3 = n2.next();
    return o2 = e3.done, e3;
  }, e: function(e3) {
    s2 = !0, a2 = e3;
  }, f: function() {
    try {
      o2 || n2.return == null || n2.return();
    } finally {
      if (s2) throw a2;
    }
  } };
}
function V(e2) {
  return G(e2) || W(e2) || U(e2) || H();
}
function H() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function U(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return K(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? K(e2, t2) : void 0;
  }
}
function W(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function G(e2) {
  if (Array.isArray(e2)) return K(e2);
}
function K(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
var q = { name: "SelectButton", extends: z, inheritAttrs: !1, emits: ["change"], methods: { getOptionLabel: function(e2) {
  return this.optionLabel ? C(e2, this.optionLabel) : e2;
}, getOptionValue: function(e2) {
  return this.optionValue ? C(e2, this.optionValue) : e2;
}, getOptionRenderKey: function(e2) {
  return this.dataKey ? C(e2, this.dataKey) : this.getOptionLabel(e2);
}, isOptionDisabled: function(e2) {
  return this.optionDisabled ? C(e2, this.optionDisabled) : !1;
}, isOptionReadonly: function(e2) {
  if (this.allowEmpty) return !1;
  var t2 = this.isSelected(e2);
  return this.multiple ? t2 && this.d_value.length === 1 : t2;
}, onOptionSelect: function(e2, t2, n2) {
  var r2 = this;
  if (!(this.disabled || this.isOptionDisabled(t2) || this.isOptionReadonly(t2))) {
    var i2 = this.isSelected(t2), a2 = this.getOptionValue(t2), o2;
    if (this.multiple)
      if (i2) {
        if (o2 = this.d_value.filter(function(e3) {
          return !w(e3, a2, r2.equalityKey);
        }), !this.allowEmpty && o2.length === 0) return;
      } else o2 = this.d_value ? [].concat(V(this.d_value), [a2]) : [a2];
    else {
      if (i2 && !this.allowEmpty) return;
      o2 = i2 ? null : a2;
    }
    this.writeValue(o2, e2), this.$emit("change", { originalEvent: e2, value: o2 });
  }
}, isSelected: function(e2) {
  var t2 = !1, n2 = this.getOptionValue(e2);
  if (this.multiple) {
    if (this.d_value) {
      var r2 = B(this.d_value), i2;
      try {
        for (r2.s(); !(i2 = r2.n()).done; ) {
          var a2 = i2.value;
          if (w(a2, n2, this.equalityKey)) {
            t2 = !0;
            break;
          }
        }
      } catch (e3) {
        r2.e(e3);
      } finally {
        r2.f();
      }
    }
  } else t2 = w(this.d_value, n2, this.equalityKey);
  return t2;
} }, computed: { equalityKey: function() {
  return this.optionValue ? null : this.dataKey;
}, dataP: function() {
  return x({ invalid: this.$invalid });
} }, directives: { ripple: E }, components: { ToggleButton: F } };
var J = ["aria-labelledby", "data-p"];
function Y(e2, t2, a2, s2, l2, p2) {
  var h2 = o("ToggleButton");
  return i(), u("div", r({ class: e2.cx("root"), role: "group", "aria-labelledby": e2.ariaLabelledby }, e2.ptmi("root"), { "data-p": p2.dataP }), [(i(!0), u(d, null, v(e2.options, function(t3, a3) {
    return i(), _(h2, { key: p2.getOptionRenderKey(t3), modelValue: p2.isSelected(t3), onLabel: p2.getOptionLabel(t3), offLabel: p2.getOptionLabel(t3), disabled: e2.disabled || p2.isOptionDisabled(t3), unstyled: e2.unstyled, size: e2.size, readonly: p2.isOptionReadonly(t3), onChange: function(e3) {
      return p2.onOptionSelect(e3, t3, a3);
    }, pt: e2.ptm("pcToggleButton") }, b({ _: 2 }, [e2.$slots.option ? { name: "default", fn: m(function() {
      return [n(e2.$slots, "option", { option: t3, index: a3 }, function() {
        return [c("span", r({ ref_for: !0 }, e2.ptm("pcToggleButton").label), f(p2.getOptionLabel(t3)), 17)];
      })];
    }), key: "0" } : void 0]), 1032, ["modelValue", "onLabel", "offLabel", "disabled", "unstyled", "size", "readonly", "onChange", "pt"]);
  }), 128))], 16, J);
}
q.render = Y;
var X = S(e({ __name: "index", props: { size: { default: "sm" }, allowEmpty: { type: Boolean, default: !1 } }, setup(e2) {
  let a2 = l(e2, ["size", "allowEmpty"]);
  return (o2, s2) => (i(), _(p(q), r(a2, { class: e2.size, "allow-empty": e2.allowEmpty }), b({ _: 2 }, [v(o2.$slots, (e3, r2) => ({ name: r2, fn: m((e4) => [n(o2.$slots, r2, g(t(e4 ?? {})), void 0, !0)]) }))]), 1040, ["class", "allow-empty"]));
} }), [["__scopeId", "data-v-eeda56a5"]]);
export {X as t};