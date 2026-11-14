import {J as e,P as t,W as n,X as r,Y as i,Z as a,en as o,f as s,h as c,lt as l,m as u,p as d,ut as f} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as p} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {X as m,t as h} from "./basecomponent-ClhuVxJN.js";
import {t as g} from "./ripple-DKjDc6yC.js";
import {t as _} from "./style-uEttjQjV.js";
import {t as v} from "./times-NAtDB1bj.js";
var y = { name: "BaseMessage", extends: h, props: { severity: { type: String, default: "info" }, closable: { type: Boolean, default: !1 }, life: { type: Number, default: null }, icon: { type: String, default: void 0 }, closeIcon: { type: String, default: void 0 }, closeButtonProps: { type: null, default: null }, size: { type: String, default: null }, variant: { type: String, default: null } }, style: _, provide: function() {
  return { $pcMessage: this, $parentInstance: this };
} };
function b(e2) {
  "@babel/helpers - typeof";
  return b = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, b(e2);
}
function x(e2, t2, n2) {
  return (t2 = S(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function S(e2) {
  var t2 = C(e2, "string");
  return b(t2) == "symbol" ? t2 : t2 + "";
}
function C(e2, t2) {
  if (b(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (b(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var w = { name: "Message", extends: y, inheritAttrs: !1, emits: ["close", "life-end"], timeout: null, data: function() {
  return { visible: !0 };
}, mounted: function() {
  var e2 = this;
  this.life && setTimeout(function() {
    e2.visible = !1, e2.$emit("life-end");
  }, this.life);
}, methods: { close: function(e2) {
  this.visible = !1, this.$emit("close", e2);
} }, computed: { closeAriaLabel: function() {
  return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria.close : void 0;
}, dataP: function() {
  return m(x(x({ outlined: this.variant === "outlined", simple: this.variant === "simple" }, this.severity, this.severity), this.size, this.size));
} }, directives: { ripple: g }, components: { TimesIcon: v } };
function T(e2) {
  "@babel/helpers - typeof";
  return T = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, T(e2);
}
function E(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function D(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? E(Object(n2), !0).forEach(function(t3) {
      O(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : E(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function O(e2, t2, n2) {
  return (t2 = k(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function k(e2) {
  var t2 = A(e2, "string");
  return T(t2) == "symbol" ? t2 : t2 + "";
}
function A(e2, t2) {
  if (T(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (T(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var j = ["data-p"];
var M = ["data-p"];
var N = ["data-p"];
var P = ["aria-label", "data-p"];
var F = ["data-p"];
function I(m2, h2, g2, _2, v2, y2) {
  var b2 = i("TimesIcon"), x2 = r("ripple");
  return n(), d(p, t({ name: "p-message", appear: "" }, m2.ptmi("transition")), { default: l(function() {
    return [v2.visible ? (n(), c("div", t({ key: 0, class: m2.cx("root"), role: "alert", "aria-live": "assertive", "aria-atomic": "true", "data-p": y2.dataP }, m2.ptm("root")), [s("div", t({ class: m2.cx("contentWrapper") }, m2.ptm("contentWrapper")), [m2.$slots.container ? e(m2.$slots, "container", { key: 0, closeCallback: y2.close }) : (n(), c("div", t({ key: 1, class: m2.cx("content"), "data-p": y2.dataP }, m2.ptm("content")), [e(m2.$slots, "icon", { class: o(m2.cx("icon")) }, function() {
      return [(n(), d(a(m2.icon ? "span" : null), t({ class: [m2.cx("icon"), m2.icon], "data-p": y2.dataP }, m2.ptm("icon")), null, 16, ["class", "data-p"]))];
    }), m2.$slots.default ? (n(), c("div", t({ key: 0, class: m2.cx("text"), "data-p": y2.dataP }, m2.ptm("text")), [e(m2.$slots, "default")], 16, N)) : u("", !0), m2.closable ? f((n(), c("button", t({ key: 1, class: m2.cx("closeButton"), "aria-label": y2.closeAriaLabel, type: "button", onClick: h2[0] ||= function(e2) {
      return y2.close(e2);
    }, "data-p": y2.dataP }, D(D({}, m2.closeButtonProps), m2.ptm("closeButton"))), [e(m2.$slots, "closeicon", {}, function() {
      return [m2.closeIcon ? (n(), c("i", t({ key: 0, class: [m2.cx("closeIcon"), m2.closeIcon], "data-p": y2.dataP }, m2.ptm("closeIcon")), null, 16, F)) : (n(), d(b2, t({ key: 1, class: [m2.cx("closeIcon"), m2.closeIcon], "data-p": y2.dataP }, m2.ptm("closeIcon")), null, 16, ["class", "data-p"]))];
    })], 16, P)), [[x2]]) : u("", !0)], 16, M))], 16)], 16, j)) : u("", !0)];
  }), _: 3 }, 16);
}
w.render = I;
export {w as t};