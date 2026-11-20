import {C as e,D as t,E as n,K as r,b as i,h as a,k as o,r as s,s as c,x as l} from "./basecomponent-ClhuVxJN.js";
import {n as u} from "./baseicon-Z_5Hqu9u.js";
var d = s.extend({ name: "ripple-directive", style: `
    .p-ink {
        display: block;
        position: absolute;
        background: dt('ripple.background');
        border-radius: 100%;
        transform: scale(0);
        pointer-events: none;
    }

    .p-ink-active {
        animation: ripple 0.4s linear;
    }

    @keyframes ripple {
        100% {
            opacity: 0;
            transform: scale(2.5);
        }
    }
`, classes: { root: "p-ink" } });
var f = u.extend({ style: d });
function p(e2) {
  "@babel/helpers - typeof";
  return p = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, p(e2);
}
function m(e2) {
  return v(e2) || _(e2) || g(e2) || h();
}
function h() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function g(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return y(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? y(e2, t2) : void 0;
  }
}
function _(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function v(e2) {
  if (Array.isArray(e2)) return y(e2);
}
function y(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function b(e2, t2, n2) {
  return (t2 = x(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function x(e2) {
  var t2 = S(e2, "string");
  return p(t2) == "symbol" ? t2 : t2 + "";
}
function S(e2, t2) {
  if (p(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (p(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var C = f.extend("ripple", { watch: { "config.ripple": function(e2) {
  e2 ? (this.createRipple(this.$host), this.bindEvents(this.$host), this.$host.setAttribute("data-pd-ripple", !0), this.$host.style.overflow = "hidden", this.$host.style.position = "relative") : (this.remove(this.$host), this.$host.removeAttribute("data-pd-ripple"));
} }, unmounted: function(e2) {
  this.remove(e2);
}, timeout: void 0, methods: { bindEvents: function(e2) {
  e2.addEventListener("mousedown", this.onMouseDown.bind(this));
}, unbindEvents: function(e2) {
  e2.removeEventListener("mousedown", this.onMouseDown.bind(this));
}, createRipple: function(e2) {
  var n2 = this.getInk(e2);
  n2 || (n2 = t("span", b(b({ role: "presentation", "aria-hidden": !0, "data-p-ink": !0, "data-p-ink-active": !1, class: !this.isUnstyled() && this.cx("root"), onAnimationEnd: this.onAnimationEnd.bind(this) }, this.$attrSelector, ""), "p-bind", this.ptm("root"))), e2.appendChild(n2), this.$el = n2);
}, remove: function(e2) {
  var t2 = this.getInk(e2);
  t2 && (this.$host.style.overflow = "", this.$host.style.position = "", this.unbindEvents(e2), t2.removeEventListener("animationend", this.onAnimationEnd), t2.remove());
}, onMouseDown: function(t2) {
  var s2 = this, l2 = t2.currentTarget, u2 = this.getInk(l2);
  if (u2 && getComputedStyle(u2, null).display !== "none") {
    if (!this.isUnstyled() && i(u2, "p-ink-active"), u2.setAttribute("data-p-ink-active", "false"), !n(u2) && !e(u2)) {
      var d2 = Math.max(r(l2), c(l2));
      u2.style.height = d2 + "px", u2.style.width = d2 + "px";
    }
    var f2 = a(l2), p2 = t2.pageX - f2.left + document.body.scrollTop - e(u2) / 2, m2 = t2.pageY - f2.top + document.body.scrollLeft - n(u2) / 2;
    u2.style.top = m2 + "px", u2.style.left = p2 + "px", !this.isUnstyled() && o(u2, "p-ink-active"), u2.setAttribute("data-p-ink-active", "true"), this.timeout = setTimeout(function() {
      u2 && (!s2.isUnstyled() && i(u2, "p-ink-active"), u2.setAttribute("data-p-ink-active", "false"));
    }, 401);
  }
}, onAnimationEnd: function(e2) {
  this.timeout && clearTimeout(this.timeout), !this.isUnstyled() && i(e2.currentTarget, "p-ink-active"), e2.currentTarget.setAttribute("data-p-ink-active", "false");
}, getInk: function(e2) {
  return e2 && e2.children ? m(e2.children).find(function(e3) {
    return l(e3, "data-pc-name") === "ripple";
  }) : void 0;
} } });
export {d as n,C as t};