import {J as e,P as t,W as n,h as r} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {p as i} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as a} from "./basecomponent-ClhuVxJN.js";
import {t as o} from "./style-BsQYnaeX.js";
var s = { name: "Inplace", extends: { name: "BaseInplace", extends: a, props: { active: { type: Boolean, default: !1 }, disabled: { type: Boolean, default: !1 }, displayProps: { type: null, default: null } }, style: o, provide: function() {
  return { $pcInplace: this, $parentInstance: this };
} }, inheritAttrs: !1, emits: ["open", "close", "update:active"], data: function() {
  return { d_active: this.active };
}, watch: { active: function(e2) {
  this.d_active = e2;
} }, methods: { open: function(e2) {
  this.disabled || (this.d_active = !0, this.$emit("open", e2), this.$emit("update:active", !0));
}, close: function(e2) {
  var t2 = this;
  this.d_active = !1, this.$emit("close", e2), this.$emit("update:active", !1), setTimeout(function() {
    t2.$refs.display.focus();
  }, 0);
} } };
function c(e2) {
  "@babel/helpers - typeof";
  return c = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, c(e2);
}
function l(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function u(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? l(Object(n2), !0).forEach(function(t3) {
      d(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : l(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function d(e2, t2, n2) {
  return (t2 = f(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function f(e2) {
  var t2 = p(e2, "string");
  return c(t2) == "symbol" ? t2 : t2 + "";
}
function p(e2, t2) {
  if (c(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (c(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var m = ["tabindex", "data-p-disabled"];
function h(a2, o2, s2, c2, l2, d2) {
  return n(), r("div", t({ class: a2.cx("root"), "aria-live": "polite" }, a2.ptmi("root")), [l2.d_active ? (n(), r("div", t({ key: 1, class: a2.cx("content") }, a2.ptm("content")), [e(a2.$slots, "content", { closeCallback: d2.close })], 16)) : (n(), r("div", t({ key: 0, ref: "display", class: a2.cx("display"), tabindex: a2.$attrs.tabindex || "0", role: "button", onClick: o2[0] ||= function() {
    return d2.open && d2.open.apply(d2, arguments);
  }, onKeydown: o2[1] ||= i(function() {
    return d2.open && d2.open.apply(d2, arguments);
  }, ["enter"]), "data-p-disabled": a2.disabled }, u(u({}, a2.displayProps), a2.ptm("display"))), [e(a2.$slots, "display")], 16, m))], 16);
}
s.render = h;
export {s as t};