import {D as e,I as t,g as n,p as r,q as i,r as a} from "./basecomponent-ClhuVxJN.js";
import {M as o} from "./dist-DPswMdzV.js";
import {n as s} from "./baseicon-Z_5Hqu9u.js";
var c = a.extend({ name: "focustrap-directive" });
var l = s.extend({ style: c });
function u(e2) {
  "@babel/helpers - typeof";
  return u = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, u(e2);
}
function d(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function f(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? d(Object(n2), !0).forEach(function(t3) {
      p(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : d(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function p(e2, t2, n2) {
  return (t2 = m(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function m(e2) {
  var t2 = h(e2, "string");
  return u(t2) == "symbol" ? t2 : t2 + "";
}
function h(e2, t2) {
  if (u(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (u(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var g = l.extend("focustrap", { mounted: function(e2, t2) {
  (t2.value || {}).disabled || (this.createHiddenFocusableElements(e2, t2), this.bind(e2, t2), this.autoElementFocus(e2, t2)), e2.setAttribute("data-pd-focustrap", !0), this.$el = e2;
}, updated: function(e2, t2) {
  (t2.value || {}).disabled && this.unbind(e2);
}, unmounted: function(e2) {
  this.unbind(e2);
}, methods: { getComputedSelector: function(e2) {
  return `:not(.p-hidden-focusable):not([data-p-hidden-focusable="true"])${e2 ?? ""}`;
}, bind: function(e2, n2) {
  var a2 = this, s2 = n2.value || {}, c2 = s2.onFocusIn, l2 = s2.onFocusOut;
  e2.$_pfocustrap_mutationobserver = new MutationObserver(function(n3) {
    n3.forEach(function(n4) {
      if (n4.type === "childList" && !e2.contains(document.activeElement)) {
        var s3 = function(t2) {
          var n5 = r(t2) ? r(t2, a2.getComputedSelector(e2.$_pfocustrap_focusableselector)) ? t2 : i(e2, a2.getComputedSelector(e2.$_pfocustrap_focusableselector)) : i(t2);
          return o(n5) ? n5 : t2.nextSibling && s3(t2.nextSibling);
        };
        t(s3(n4.nextSibling));
      }
    });
  }), e2.$_pfocustrap_mutationobserver.disconnect(), e2.$_pfocustrap_mutationobserver.observe(e2, { childList: !0 }), e2.$_pfocustrap_focusinlistener = function(e3) {
    return c2 && c2(e3);
  }, e2.$_pfocustrap_focusoutlistener = function(e3) {
    return l2 && l2(e3);
  }, e2.addEventListener("focusin", e2.$_pfocustrap_focusinlistener), e2.addEventListener("focusout", e2.$_pfocustrap_focusoutlistener);
}, unbind: function(e2) {
  e2.$_pfocustrap_mutationobserver && e2.$_pfocustrap_mutationobserver.disconnect(), e2.$_pfocustrap_focusinlistener && e2.removeEventListener("focusin", e2.$_pfocustrap_focusinlistener) && (e2.$_pfocustrap_focusinlistener = null), e2.$_pfocustrap_focusoutlistener && e2.removeEventListener("focusout", e2.$_pfocustrap_focusoutlistener) && (e2.$_pfocustrap_focusoutlistener = null);
}, autoFocus: function(e2) {
  this.autoElementFocus(this.$el, { value: f(f({}, e2), {}, { autoFocus: !0 }) });
}, autoElementFocus: function(e2, n2) {
  var r2 = n2.value || {}, a2 = r2.autoFocusSelector, o2 = a2 === void 0 ? "" : a2, s2 = r2.firstFocusableSelector, c2 = s2 === void 0 ? "" : s2, l2 = r2.autoFocus, u2 = l2 !== void 0 && l2, d2 = i(e2, `[autofocus]${this.getComputedSelector(o2)}`);
  u2 && !d2 && (d2 = i(e2, this.getComputedSelector(c2))), t(d2);
}, onFirstHiddenElementFocus: function(e2) {
  var n2, r2 = e2.currentTarget, a2 = e2.relatedTarget, o2 = a2 === r2.$_pfocustrap_lasthiddenfocusableelement || !((n2 = this.$el) != null && n2.contains(a2)) ? i(r2.parentElement, this.getComputedSelector(r2.$_pfocustrap_focusableselector)) : r2.$_pfocustrap_lasthiddenfocusableelement;
  t(o2);
}, onLastHiddenElementFocus: function(e2) {
  var r2, i2 = e2.currentTarget, a2 = e2.relatedTarget, o2 = a2 === i2.$_pfocustrap_firsthiddenfocusableelement || !((r2 = this.$el) != null && r2.contains(a2)) ? n(i2.parentElement, this.getComputedSelector(i2.$_pfocustrap_focusableselector)) : i2.$_pfocustrap_firsthiddenfocusableelement;
  t(o2);
}, createHiddenFocusableElements: function(t2, n2) {
  var r2 = this, i2 = n2.value || {}, a2 = i2.tabIndex, o2 = a2 === void 0 ? 0 : a2, s2 = i2.firstFocusableSelector, c2 = s2 === void 0 ? "" : s2, l2 = i2.lastFocusableSelector, u2 = l2 === void 0 ? "" : l2, d2 = function(t3) {
    return e("span", { class: "p-hidden-accessible p-hidden-focusable", tabIndex: o2, role: "presentation", "aria-hidden": !0, "data-p-hidden-accessible": !0, "data-p-hidden-focusable": !0, onFocus: t3?.bind(r2) });
  }, f2 = d2(this.onFirstHiddenElementFocus), p2 = d2(this.onLastHiddenElementFocus);
  f2.$_pfocustrap_lasthiddenfocusableelement = p2, f2.$_pfocustrap_focusableselector = c2, f2.setAttribute("data-pc-section", "firstfocusableelement"), p2.$_pfocustrap_firsthiddenfocusableelement = f2, p2.$_pfocustrap_focusableselector = u2, p2.setAttribute("data-pc-section", "lastfocusableelement"), t2.prepend(f2), t2.append(p2);
} } });
export {c as n,g as t};