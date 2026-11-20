import {B as e,D as t,J as n,K as r,M as i,S as a,T as o,V as s,b as c,i as l,k as u,r as d,s as f,x as p,z as m} from "./basecomponent-ClhuVxJN.js";
import {D as h} from "./dist-DPswMdzV.js";
import {i as g,n as _} from "./baseicon-Z_5Hqu9u.js";
import {t as v} from "./zindex-cO8iUN-n.js";
import {t as y} from "./utils-i4uei9-Y.js";
var b = d.extend({ name: "tooltip-directive", style: `
    .p-tooltip {
        position: absolute;
        display: none;
        max-width: dt('tooltip.max.width');
    }

    .p-tooltip-right,
    .p-tooltip-left {
        padding: 0 dt('tooltip.gutter');
    }

    .p-tooltip-top,
    .p-tooltip-bottom {
        padding: dt('tooltip.gutter') 0;
    }

    .p-tooltip-text {
        white-space: pre-line;
        word-break: break-word;
        background: dt('tooltip.background');
        color: dt('tooltip.color');
        padding: dt('tooltip.padding');
        box-shadow: dt('tooltip.shadow');
        border-radius: dt('tooltip.border.radius');
    }

    .p-tooltip-arrow {
        position: absolute;
        width: 0;
        height: 0;
        border-color: transparent;
        border-style: solid;
    }

    .p-tooltip-right .p-tooltip-arrow {
        margin-top: calc(-1 * dt('tooltip.gutter'));
        border-width: dt('tooltip.gutter') dt('tooltip.gutter') dt('tooltip.gutter') 0;
        border-right-color: dt('tooltip.background');
    }

    .p-tooltip-left .p-tooltip-arrow {
        margin-top: calc(-1 * dt('tooltip.gutter'));
        border-width: dt('tooltip.gutter') 0 dt('tooltip.gutter') dt('tooltip.gutter');
        border-left-color: dt('tooltip.background');
    }

    .p-tooltip-top .p-tooltip-arrow {
        margin-left: calc(-1 * dt('tooltip.gutter'));
        border-width: dt('tooltip.gutter') dt('tooltip.gutter') 0 dt('tooltip.gutter');
        border-top-color: dt('tooltip.background');
        border-bottom-color: dt('tooltip.background');
    }

    .p-tooltip-bottom .p-tooltip-arrow {
        margin-left: calc(-1 * dt('tooltip.gutter'));
        border-width: 0 dt('tooltip.gutter') dt('tooltip.gutter') dt('tooltip.gutter');
        border-top-color: dt('tooltip.background');
        border-bottom-color: dt('tooltip.background');
    }
`, classes: { root: "p-tooltip p-component", arrow: "p-tooltip-arrow", text: "p-tooltip-text" } });
var x = _.extend({ style: b });
function S(e2, t2) {
  return D(e2) || E(e2, t2) || w(e2, t2) || C();
}
function C() {
  throw TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function w(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return T(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? T(e2, t2) : void 0;
  }
}
function T(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function E(e2, t2) {
  var n2 = e2 == null ? null : typeof Symbol < "u" && e2[Symbol.iterator] || e2["@@iterator"];
  if (n2 != null) {
    var r2, i2, a2, o2, s2 = [], c2 = !0, l2 = !1;
    try {
      if (a2 = (n2 = n2.call(e2)).next, t2 !== 0) for (; !(c2 = (r2 = a2.call(n2)).done) && (s2.push(r2.value), s2.length !== t2); c2 = !0) ;
    } catch (e3) {
      l2 = !0, i2 = e3;
    } finally {
      try {
        if (!c2 && n2.return != null && (o2 = n2.return(), Object(o2) !== o2)) return;
      } finally {
        if (l2) throw i2;
      }
    }
    return s2;
  }
}
function D(e2) {
  if (Array.isArray(e2)) return e2;
}
function O(e2, t2, n2) {
  return (t2 = k(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function k(e2) {
  var t2 = A(e2, "string");
  return j(t2) == "symbol" ? t2 : t2 + "";
}
function A(e2, t2) {
  if (j(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (j(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
function j(e2) {
  "@babel/helpers - typeof";
  return j = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, j(e2);
}
var M = x.extend("tooltip", { beforeMount: function(e2, t2) {
  var n2, r2 = this.getTarget(e2);
  if (r2.$_ptooltipModifiers = this.getModifiers(t2), t2.value) {
    if (typeof t2.value == "string") r2.$_ptooltipValue = t2.value, r2.$_ptooltipDisabled = !1, r2.$_ptooltipEscape = !0, r2.$_ptooltipClass = null, r2.$_ptooltipFitContent = !0, r2.$_ptooltipIdAttr = g("pv_id") + "_tooltip", r2.$_ptooltipShowDelay = 0, r2.$_ptooltipHideDelay = 0, r2.$_ptooltipAutoHide = !0;
    else if (j(t2.value) === "object" && t2.value) {
      if (h(t2.value.value) || t2.value.value.trim() === "") return;
      r2.$_ptooltipValue = t2.value.value, r2.$_ptooltipDisabled = !!t2.value.disabled === t2.value.disabled && t2.value.disabled, r2.$_ptooltipEscape = !!t2.value.escape !== t2.value.escape || t2.value.escape, r2.$_ptooltipClass = t2.value.class || "", r2.$_ptooltipFitContent = !!t2.value.fitContent !== t2.value.fitContent || t2.value.fitContent, r2.$_ptooltipIdAttr = t2.value.id || g("pv_id") + "_tooltip", r2.$_ptooltipShowDelay = t2.value.showDelay || 0, r2.$_ptooltipHideDelay = t2.value.hideDelay || 0, r2.$_ptooltipAutoHide = !!t2.value.autoHide !== t2.value.autoHide || t2.value.autoHide;
    }
    r2.$_ptooltipZIndex = (n2 = t2.instance.$primevue) == null || (n2 = n2.config) == null || (n2 = n2.zIndex) == null ? void 0 : n2.tooltip, this.bindEvents(r2, t2), e2.setAttribute("data-pd-tooltip", !0);
  }
}, updated: function(e2, t2) {
  var n2 = this.getTarget(e2);
  if (n2.$_ptooltipModifiers = this.getModifiers(t2), this.unbindEvents(n2), t2.value) {
    if (typeof t2.value == "string") n2.$_ptooltipValue = t2.value, n2.$_ptooltipDisabled = !1, n2.$_ptooltipEscape = !0, n2.$_ptooltipClass = null, n2.$_ptooltipIdAttr = n2.$_ptooltipIdAttr || g("pv_id") + "_tooltip", n2.$_ptooltipShowDelay = 0, n2.$_ptooltipHideDelay = 0, n2.$_ptooltipAutoHide = !0, this.bindEvents(n2, t2);
    else if (j(t2.value) === "object" && t2.value) {
      if (h(t2.value.value) || t2.value.value.trim() === "") {
        this.unbindEvents(n2, t2);
        return;
      }
      n2.$_ptooltipValue = t2.value.value, n2.$_ptooltipDisabled = !!t2.value.disabled === t2.value.disabled && t2.value.disabled, n2.$_ptooltipEscape = !!t2.value.escape !== t2.value.escape || t2.value.escape, n2.$_ptooltipClass = t2.value.class || "", n2.$_ptooltipFitContent = !!t2.value.fitContent !== t2.value.fitContent || t2.value.fitContent, n2.$_ptooltipIdAttr = t2.value.id || n2.$_ptooltipIdAttr || g("pv_id") + "_tooltip", n2.$_ptooltipShowDelay = t2.value.showDelay || 0, n2.$_ptooltipHideDelay = t2.value.hideDelay || 0, n2.$_ptooltipAutoHide = !!t2.value.autoHide !== t2.value.autoHide || t2.value.autoHide, this.bindEvents(n2, t2);
    }
  }
}, unmounted: function(e2, t2) {
  var n2 = this.getTarget(e2);
  this.hide(e2, 0), this.remove(n2), this.unbindEvents(n2, t2), n2.$_ptooltipScrollHandler &&= (n2.$_ptooltipScrollHandler.destroy(), null);
}, methods: { bindEvents: function(e2, t2) {
  var n2 = this;
  e2.$_ptooltipModifiers.focus ? (e2.$_ptooltipFocusEvent = function(e3) {
    return n2.onFocus(e3, t2);
  }, e2.$_ptooltipBlurEvent = this.onBlur.bind(this), e2.addEventListener("focus", e2.$_ptooltipFocusEvent), e2.addEventListener("blur", e2.$_ptooltipBlurEvent)) : (e2.$_ptooltipMouseEnterEvent = function(e3) {
    return n2.onMouseEnter(e3, t2);
  }, e2.$_ptooltipMouseLeaveEvent = this.onMouseLeave.bind(this), e2.$_ptooltipClickEvent = this.onClick.bind(this), e2.addEventListener("mouseenter", e2.$_ptooltipMouseEnterEvent), e2.addEventListener("mouseleave", e2.$_ptooltipMouseLeaveEvent), e2.addEventListener("click", e2.$_ptooltipClickEvent)), e2.$_ptooltipKeydownEvent = this.onKeydown.bind(this), e2.addEventListener("keydown", e2.$_ptooltipKeydownEvent), e2.$_pWindowResizeEvent = this.onWindowResize.bind(this, e2);
}, unbindEvents: function(e2) {
  e2.$_ptooltipModifiers.focus ? (e2.removeEventListener("focus", e2.$_ptooltipFocusEvent), e2.$_ptooltipFocusEvent = null, e2.removeEventListener("blur", e2.$_ptooltipBlurEvent), e2.$_ptooltipBlurEvent = null) : (e2.removeEventListener("mouseenter", e2.$_ptooltipMouseEnterEvent), e2.$_ptooltipMouseEnterEvent = null, e2.removeEventListener("mouseleave", e2.$_ptooltipMouseLeaveEvent), e2.$_ptooltipMouseLeaveEvent = null, e2.removeEventListener("click", e2.$_ptooltipClickEvent), e2.$_ptooltipClickEvent = null), e2.removeEventListener("keydown", e2.$_ptooltipKeydownEvent), window.removeEventListener("resize", e2.$_pWindowResizeEvent), e2.$_ptooltipId && this.remove(e2);
}, bindScrollListener: function(e2) {
  var t2 = this;
  e2.$_ptooltipScrollHandler ||= new y(e2, function() {
    t2.hide(e2);
  }), e2.$_ptooltipScrollHandler.bindScrollListener();
}, unbindScrollListener: function(e2) {
  e2.$_ptooltipScrollHandler && e2.$_ptooltipScrollHandler.unbindScrollListener();
}, onMouseEnter: function(e2, t2) {
  var n2 = e2.currentTarget, r2 = n2.$_ptooltipShowDelay;
  this.show(n2, t2, r2);
}, onMouseLeave: function(e2) {
  var t2 = e2.currentTarget, n2 = t2.$_ptooltipHideDelay;
  (t2.$_ptooltipAutoHide || p(e2.target, "data-pc-name") !== "tooltip" && p(e2.target, "data-pc-section") !== "arrow" && p(e2.target, "data-pc-section") !== "text" && p(e2.relatedTarget, "data-pc-name") !== "tooltip" && p(e2.relatedTarget, "data-pc-section") !== "arrow" && p(e2.relatedTarget, "data-pc-section") !== "text") && this.hide(t2, n2);
}, onFocus: function(e2, t2) {
  var n2 = e2.currentTarget, r2 = n2.$_ptooltipShowDelay;
  this.show(n2, t2, r2);
}, onBlur: function(e2) {
  var t2 = e2.currentTarget, n2 = t2.$_ptooltipHideDelay;
  this.hide(t2, n2);
}, onClick: function(e2) {
  var t2 = e2.currentTarget, n2 = t2.$_ptooltipHideDelay;
  this.hide(t2, n2);
}, onKeydown: function(e2) {
  var t2 = e2.currentTarget.$_ptooltipHideDelay;
  e2.code === "Escape" && this.hide(e2.currentTarget, t2);
}, onWindowResize: function(e2) {
  i() || this.hide(e2), window.removeEventListener("resize", e2.$_pWindowResizeEvent);
}, tooltipActions: function(t2, n2) {
  if (!t2.$_ptooltipDisabled && o(t2) && t2.$_ptooltipPendingShow) {
    t2.$_ptooltipPendingShow = !1, this.remove(t2);
    var r2 = this.create(t2, n2);
    this.align(t2), !this.isUnstyled() && e(r2, 250);
    var i2 = this;
    window.addEventListener("resize", t2.$_pWindowResizeEvent), r2.addEventListener("mouseleave", function e2() {
      i2.hide(t2), r2.removeEventListener("mouseleave", e2), t2.removeEventListener("mouseenter", t2.$_ptooltipMouseEnterEvent), setTimeout(function() {
        return t2.addEventListener("mouseenter", t2.$_ptooltipMouseEnterEvent);
      }, 50);
    }), this.bindScrollListener(t2), v.set("tooltip", r2, t2.$_ptooltipZIndex);
  }
}, show: function(e2, t2, n2) {
  var r2 = this;
  clearTimeout(e2.$_ptooltipShowTimer), clearTimeout(e2.$_ptooltipHideTimer), n2 === void 0 ? (this.tooltipActions(e2, t2), e2.$_ptooltipPendingShow = !1) : (e2.$_ptooltipShowTimer = setTimeout(function() {
    return r2.tooltipActions(e2, t2);
  }, n2), e2.$_ptooltipPendingShow = !0);
}, tooltipRemoval: function(e2) {
  this.remove(e2), this.unbindScrollListener(e2), window.removeEventListener("resize", e2.$_pWindowResizeEvent);
}, hide: function(e2, t2) {
  var n2 = this;
  clearTimeout(e2.$_ptooltipShowTimer), clearTimeout(e2.$_ptooltipHideTimer), e2.$_ptooltipPendingShow = !1, t2 === void 0 ? this.tooltipRemoval(e2) : e2.$_ptooltipHideTimer = setTimeout(function() {
    return n2.tooltipRemoval(e2);
  }, t2);
}, getTooltipElement: function(e2) {
  return document.getElementById(e2.$_ptooltipId);
}, getArrowElement: function(e2) {
  var t2 = this.getTooltipElement(e2);
  return n(t2, '[data-pc-section="arrow"]');
}, create: function(e2) {
  var n2 = e2.$_ptooltipModifiers, r2 = t("div", { class: !this.isUnstyled() && this.cx("arrow"), "p-bind": this.ptm("arrow", { context: n2 }) }), i2 = t("div", { class: !this.isUnstyled() && this.cx("text"), "p-bind": this.ptm("text", { context: n2 }) });
  e2.$_ptooltipEscape ? (i2.innerHTML = "", i2.appendChild(document.createTextNode(e2.$_ptooltipValue))) : i2.innerHTML = e2.$_ptooltipValue;
  var a2 = t("div", O(O({ id: e2.$_ptooltipIdAttr, role: "tooltip", style: { display: "inline-block", width: e2.$_ptooltipFitContent ? "fit-content" : void 0, pointerEvents: !this.isUnstyled() && e2.$_ptooltipAutoHide && "none" }, class: [!this.isUnstyled() && this.cx("root"), e2.$_ptooltipClass] }, this.$attrSelector, ""), "p-bind", this.ptm("root", { context: n2 })), r2, i2);
  return document.body.appendChild(a2), e2.$_ptooltipId = a2.id, this.$el = a2, a2;
}, remove: function(e2) {
  if (e2) {
    var t2 = this.getTooltipElement(e2);
    t2 && t2.parentElement && (v.clear(t2), document.body.removeChild(t2)), e2.$_ptooltipId = null;
  }
}, align: function(e2) {
  var t2 = e2.$_ptooltipModifiers;
  t2.top ? (this.alignTop(e2), this.isOutOfBounds(e2) && (this.alignBottom(e2), this.isOutOfBounds(e2) && this.alignTop(e2))) : t2.left ? (this.alignLeft(e2), this.isOutOfBounds(e2) && (this.alignRight(e2), this.isOutOfBounds(e2) && (this.alignTop(e2), this.isOutOfBounds(e2) && (this.alignBottom(e2), this.isOutOfBounds(e2) && this.alignLeft(e2))))) : t2.bottom ? (this.alignBottom(e2), this.isOutOfBounds(e2) && (this.alignTop(e2), this.isOutOfBounds(e2) && this.alignBottom(e2))) : (this.alignRight(e2), this.isOutOfBounds(e2) && (this.alignLeft(e2), this.isOutOfBounds(e2) && (this.alignTop(e2), this.isOutOfBounds(e2) && (this.alignBottom(e2), this.isOutOfBounds(e2) && this.alignRight(e2)))));
}, getHostOffset: function(e2) {
  var t2 = e2.getBoundingClientRect();
  return { left: t2.left + s(), top: t2.top + l() };
}, alignRight: function(e2) {
  this.preAlign(e2, "right");
  var t2 = this.getTooltipElement(e2), n2 = this.getArrowElement(e2), i2 = this.getHostOffset(e2), a2 = i2.left + r(e2), o2 = i2.top + (f(e2) - f(t2)) / 2;
  t2.style.left = a2 + "px", t2.style.top = o2 + "px", n2.style.top = "50%", n2.style.right = null, n2.style.bottom = null, n2.style.left = "0";
}, alignLeft: function(e2) {
  this.preAlign(e2, "left");
  var t2 = this.getTooltipElement(e2), n2 = this.getArrowElement(e2), i2 = this.getHostOffset(e2), a2 = i2.left - r(t2), o2 = i2.top + (f(e2) - f(t2)) / 2;
  t2.style.left = a2 + "px", t2.style.top = o2 + "px", n2.style.top = "50%", n2.style.right = "0", n2.style.bottom = null, n2.style.left = null;
}, alignTop: function(e2) {
  this.preAlign(e2, "top");
  var t2 = this.getTooltipElement(e2), n2 = this.getArrowElement(e2), i2 = r(t2), a2 = r(e2), o2 = m().width, s2 = this.getHostOffset(e2), c2 = s2.left + (a2 - i2) / 2, l2 = s2.top - f(t2);
  c2 < 0 ? c2 = 0 : c2 + i2 > o2 && (c2 = Math.floor(s2.left + a2 - i2)), t2.style.left = c2 + "px", t2.style.top = l2 + "px";
  var u2 = s2.left - this.getHostOffset(t2).left + a2 / 2;
  n2.style.top = null, n2.style.right = null, n2.style.bottom = "0", n2.style.left = u2 + "px";
}, alignBottom: function(e2) {
  this.preAlign(e2, "bottom");
  var t2 = this.getTooltipElement(e2), n2 = this.getArrowElement(e2), i2 = r(t2), a2 = r(e2), o2 = m().width, s2 = this.getHostOffset(e2), c2 = s2.left + (a2 - i2) / 2, l2 = s2.top + f(e2);
  c2 < 0 ? c2 = 0 : c2 + i2 > o2 && (c2 = Math.floor(s2.left + a2 - i2)), t2.style.left = c2 + "px", t2.style.top = l2 + "px";
  var u2 = s2.left - this.getHostOffset(t2).left + a2 / 2;
  n2.style.top = "0", n2.style.right = null, n2.style.bottom = null, n2.style.left = u2 + "px";
}, preAlign: function(e2, t2) {
  var n2 = this.getTooltipElement(e2);
  n2.style.left = "-999px", n2.style.top = "-999px", c(n2, `p-tooltip-${n2.$_ptooltipPosition}`), !this.isUnstyled() && u(n2, `p-tooltip-${t2}`), n2.$_ptooltipPosition = t2, n2.setAttribute("data-p-position", t2);
}, isOutOfBounds: function(e2) {
  var t2 = this.getTooltipElement(e2), n2 = t2.getBoundingClientRect(), i2 = n2.top, a2 = n2.left, o2 = r(t2), s2 = f(t2), c2 = m();
  return a2 + o2 > c2.width || a2 < 0 || i2 < 0 || i2 + s2 > c2.height;
}, getTarget: function(e2) {
  return a(e2, "p-inputwrapper") ? n(e2, "input") ?? e2 : e2;
}, getModifiers: function(e2) {
  return e2.modifiers && Object.keys(e2.modifiers).length ? e2.modifiers : e2.arg && j(e2.arg) === "object" ? Object.entries(e2.arg).reduce(function(e3, t2) {
    var n2 = S(t2, 2), r2 = n2[0], i2 = n2[1];
    return (r2 === "event" || r2 === "position") && (e3[i2] = !0), e3;
  }, {}) : {};
} } });
export {b as n,M as t};