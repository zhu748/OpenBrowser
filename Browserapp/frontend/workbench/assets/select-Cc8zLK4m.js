import {J as e,P as t,W as n,X as r,Y as i,Z as a,b as o,en as s,f as c,h as l,i as u,in as d,lt as f,m as p,nn as m,p as h,q as g,ut as _,v,x as y} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as b,t as x} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {C as S,E as C,F as ee,I as w,J as T,K as E,M as te,R as D,X as O,a as k,c as A,f as j,g as M,q as N,t as ne,w as re} from "./basecomponent-ClhuVxJN.js";
import {A as P,E as ie,M as F,m as I,p as ae} from "./dist-DPswMdzV.js";
import {t as L} from "./baseicon-Z_5Hqu9u.js";
import {t as R} from "./zindex-cO8iUN-n.js";
import {r as oe} from "./api-B4Wso50O.js";
import {t as se} from "./ripple-DKjDc6yC.js";
import {t as ce} from "./utils-i4uei9-Y.js";
import {r as z} from "./button-BKeo7L17.js";
import {n as le,t as B} from "./style-DxhTHPhb.js";
import {t as ue} from "./times-NAtDB1bj.js";
import {t as de} from "./portal-Cm1Im7J-.js";
import {t as fe} from "./check-vKsww1YC.js";
import {t as pe} from "./baseinput-CQOYuWse.js";
import {t as me} from "./overlayeventbus-B9Z9smtH.js";
import {t as he} from "./inputtext-Crzvb5jQ.js";
import {n as ge,t as _e} from "./inputicon-Bn1KerIx.js";
var V = { name: "BlankIcon", extends: L };
function ve(e2) {
  return Se(e2) || xe(e2) || be(e2) || ye();
}
function ye() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function be(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return H(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? H(e2, t2) : void 0;
  }
}
function xe(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function Se(e2) {
  if (Array.isArray(e2)) return H(e2);
}
function H(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function Ce(e2, r2, i2, a2, o2, s2) {
  return n(), l("svg", t({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, e2.pti()), ve(r2[0] ||= [c("rect", { width: "1", height: "1", fill: "currentColor", "fill-opacity": "0" }, null, -1)]), 16);
}
V.render = Ce;
var U = { name: "ChevronDownIcon", extends: L };
function we(e2) {
  return Oe(e2) || De(e2) || Ee(e2) || Te();
}
function Te() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Ee(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return W(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? W(e2, t2) : void 0;
  }
}
function De(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function Oe(e2) {
  if (Array.isArray(e2)) return W(e2);
}
function W(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function ke(e2, r2, i2, a2, o2, s2) {
  return n(), l("svg", t({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, e2.pti()), we(r2[0] ||= [c("path", { d: "M7.01744 10.398C6.91269 10.3985 6.8089 10.378 6.71215 10.3379C6.61541 10.2977 6.52766 10.2386 6.45405 10.1641L1.13907 4.84913C1.03306 4.69404 0.985221 4.5065 1.00399 4.31958C1.02276 4.13266 1.10693 3.95838 1.24166 3.82747C1.37639 3.69655 1.55301 3.61742 1.74039 3.60402C1.92777 3.59062 2.11386 3.64382 2.26584 3.75424L7.01744 8.47394L11.769 3.75424C11.9189 3.65709 12.097 3.61306 12.2748 3.62921C12.4527 3.64535 12.6199 3.72073 12.7498 3.84328C12.8797 3.96582 12.9647 4.12842 12.9912 4.30502C13.0177 4.48162 12.9841 4.662 12.8958 4.81724L7.58083 10.1322C7.50996 10.2125 7.42344 10.2775 7.32656 10.3232C7.22968 10.3689 7.12449 10.3944 7.01744 10.398Z", fill: "currentColor" }, null, -1)]), 16);
}
U.render = ke;
var G = { name: "SearchIcon", extends: L };
function Ae(e2) {
  return Pe(e2) || Ne(e2) || Me(e2) || je();
}
function je() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Me(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return K(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? K(e2, t2) : void 0;
  }
}
function Ne(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function Pe(e2) {
  if (Array.isArray(e2)) return K(e2);
}
function K(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function Fe(e2, r2, i2, a2, o2, s2) {
  return n(), l("svg", t({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, e2.pti()), Ae(r2[0] ||= [c("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M2.67602 11.0265C3.6661 11.688 4.83011 12.0411 6.02086 12.0411C6.81149 12.0411 7.59438 11.8854 8.32483 11.5828C8.87005 11.357 9.37808 11.0526 9.83317 10.6803L12.9769 13.8241C13.0323 13.8801 13.0983 13.9245 13.171 13.9548C13.2438 13.985 13.3219 14.0003 13.4007 14C13.4795 14.0003 13.5575 13.985 13.6303 13.9548C13.7031 13.9245 13.7691 13.8801 13.8244 13.8241C13.9367 13.7116 13.9998 13.5592 13.9998 13.4003C13.9998 13.2414 13.9367 13.089 13.8244 12.9765L10.6807 9.8328C11.053 9.37773 11.3573 8.86972 11.5831 8.32452C11.8857 7.59408 12.0414 6.81119 12.0414 6.02056C12.0414 4.8298 11.6883 3.66579 11.0268 2.67572C10.3652 1.68564 9.42494 0.913972 8.32483 0.45829C7.22472 0.00260857 6.01418 -0.116618 4.84631 0.115686C3.67844 0.34799 2.60568 0.921393 1.76369 1.76338C0.921698 2.60537 0.348296 3.67813 0.115991 4.84601C-0.116313 6.01388 0.00291375 7.22441 0.458595 8.32452C0.914277 9.42464 1.68595 10.3649 2.67602 11.0265ZM3.35565 2.0158C4.14456 1.48867 5.07206 1.20731 6.02086 1.20731C7.29317 1.20731 8.51338 1.71274 9.41304 2.6124C10.3127 3.51206 10.8181 4.73226 10.8181 6.00457C10.8181 6.95337 10.5368 7.88088 10.0096 8.66978C9.48251 9.45868 8.73328 10.0736 7.85669 10.4367C6.98011 10.7997 6.01554 10.8947 5.08496 10.7096C4.15439 10.5245 3.2996 10.0676 2.62869 9.39674C1.95778 8.72583 1.50089 7.87104 1.31579 6.94046C1.13068 6.00989 1.22568 5.04532 1.58878 4.16874C1.95187 3.29215 2.56675 2.54292 3.35565 2.0158Z", fill: "currentColor" }, null, -1)]), 16);
}
G.render = Fe;
var Ie = { name: "BaseVirtualScroller", extends: ne, props: { id: { type: String, default: null }, style: null, class: null, items: { type: Array, default: null }, itemSize: { type: [Number, Array], default: 0 }, scrollHeight: null, scrollWidth: null, orientation: { type: String, default: "vertical" }, numToleratedItems: { type: Number, default: null }, delay: { type: Number, default: 0 }, resizeDelay: { type: Number, default: 10 }, lazy: { type: Boolean, default: !1 }, disabled: { type: Boolean, default: !1 }, loaderDisabled: { type: Boolean, default: !1 }, columns: { type: Array, default: null }, loading: { type: Boolean, default: !1 }, showSpacer: { type: Boolean, default: !0 }, showLoader: { type: Boolean, default: !1 }, tabindex: { type: Number, default: 0 }, inline: { type: Boolean, default: !1 }, step: { type: Number, default: 0 }, appendOnly: { type: Boolean, default: !1 }, autoSize: { type: Boolean, default: !1 } }, style: B, provide: function() {
  return { $pcVirtualScroller: this, $parentInstance: this };
}, beforeMount: function() {
  var e2;
  B.loadCSS({ nonce: (e2 = this.$primevueConfig) == null || (e2 = e2.csp) == null ? void 0 : e2.nonce });
} };
function q(e2) {
  "@babel/helpers - typeof";
  return q = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, q(e2);
}
function J(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function Y(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? J(Object(n2), !0).forEach(function(t3) {
      Le(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : J(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function Le(e2, t2, n2) {
  return (t2 = Re(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function Re(e2) {
  var t2 = ze(e2, "string");
  return q(t2) == "symbol" ? t2 : t2 + "";
}
function ze(e2, t2) {
  if (q(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (q(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var X = { name: "VirtualScroller", extends: Ie, inheritAttrs: !1, emits: ["update:numToleratedItems", "scroll", "scroll-index-change", "lazy-load"], data: function() {
  var e2 = this.isBoth();
  return { first: e2 ? { rows: 0, cols: 0 } : 0, last: e2 ? { rows: 0, cols: 0 } : 0, page: e2 ? { rows: 0, cols: 0 } : 0, numItemsInViewport: e2 ? { rows: 0, cols: 0 } : 0, lastScrollPos: e2 ? { top: 0, left: 0 } : 0, d_numToleratedItems: this.numToleratedItems, d_loading: this.loading, loaderArr: [], spacerStyle: {}, contentStyle: {} };
}, element: null, content: null, lastScrollPos: null, scrollTimeout: null, resizeTimeout: null, defaultWidth: 0, defaultHeight: 0, defaultContentWidth: 0, defaultContentHeight: 0, isRangeChanged: !1, lazyLoadState: {}, resizeListener: null, resizeObserver: null, initialized: !1, watch: { numToleratedItems: function(e2) {
  this.d_numToleratedItems = e2;
}, loading: function(e2, t2) {
  this.lazy && e2 !== t2 && e2 !== this.d_loading && (this.d_loading = e2);
}, items: { handler: function(e2, t2) {
  t2 && t2.length === (e2 || []).length || (this.init(), this.calculateAutoSize());
}, deep: !0 }, itemSize: function() {
  this.init(), this.calculateAutoSize();
}, orientation: function() {
  this.lastScrollPos = this.isBoth() ? { top: 0, left: 0 } : 0;
}, scrollHeight: function() {
  this.init(), this.calculateAutoSize();
}, scrollWidth: function() {
  this.init(), this.calculateAutoSize();
} }, mounted: function() {
  this.viewInit(), this.lastScrollPos = this.isBoth() ? { top: 0, left: 0 } : 0, this.lazyLoadState = this.lazyLoadState || {};
}, updated: function() {
  !this.initialized && this.viewInit();
}, unmounted: function() {
  this.unbindResizeListener(), this.initialized = !1;
}, methods: { viewInit: function() {
  D(this.element) && (this.setContentEl(this.content), this.init(), this.calculateAutoSize(), this.defaultWidth = S(this.element), this.defaultHeight = C(this.element), this.defaultContentWidth = S(this.content), this.defaultContentHeight = C(this.content), this.initialized = !0), this.element && this.bindResizeListener();
}, init: function() {
  this.disabled || (this.setSize(), this.calculateOptions(), this.setSpacerSize());
}, isVertical: function() {
  return this.orientation === "vertical";
}, isHorizontal: function() {
  return this.orientation === "horizontal";
}, isBoth: function() {
  return this.orientation === "both";
}, scrollTo: function(e2) {
  this.element && this.element.scrollTo(e2);
}, scrollToIndex: function(e2) {
  var t2 = this, n2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "auto", r2 = this.isBoth(), i2 = this.isHorizontal();
  if (r2 ? e2.every(function(e3) {
    return e3 > -1;
  }) : e2 > -1) {
    var a2 = this.first, o2 = this.element, s2 = o2.scrollTop, c2 = s2 === void 0 ? 0 : s2, l2 = o2.scrollLeft, u2 = l2 === void 0 ? 0 : l2, d2 = this.calculateNumItems().numToleratedItems, f2 = this.getContentPosition(), p2 = this.itemSize, m2 = function() {
      var e3 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0;
      return e3 <= (arguments.length > 1 ? arguments[1] : void 0) ? 0 : e3;
    }, h2 = function(e3, t3, n3) {
      return e3 * t3 + n3;
    }, g2 = function() {
      var e3 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0, r3 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
      return t2.scrollTo({ left: e3, top: r3, behavior: n2 });
    }, _2 = r2 ? { rows: 0, cols: 0 } : 0, v2 = !1, y2 = !1;
    r2 ? (_2 = { rows: m2(e2[0], d2[0]), cols: m2(e2[1], d2[1]) }, g2(h2(_2.cols, p2[1], f2.left), h2(_2.rows, p2[0], f2.top)), y2 = this.lastScrollPos.top !== c2 || this.lastScrollPos.left !== u2, v2 = _2.rows !== a2.rows || _2.cols !== a2.cols) : (_2 = m2(e2, d2), i2 ? g2(h2(_2, p2, f2.left), c2) : g2(u2, h2(_2, p2, f2.top)), y2 = this.lastScrollPos !== (i2 ? u2 : c2), v2 = _2 !== a2), this.isRangeChanged = v2, y2 && (this.first = _2);
  }
}, scrollInView: function(e2, t2) {
  var n2 = this, r2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "auto";
  if (t2) {
    var i2 = this.isBoth(), a2 = this.isHorizontal();
    if (i2 ? e2.every(function(e3) {
      return e3 > -1;
    }) : e2 > -1) {
      var o2 = this.getRenderedRange(), s2 = o2.first, c2 = o2.viewport, l2 = function() {
        var e3 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0, t3 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
        return n2.scrollTo({ left: e3, top: t3, behavior: r2 });
      }, u2 = t2 === "to-start", d2 = t2 === "to-end";
      if (u2) {
        if (i2) c2.first.rows - s2.rows > e2[0] ? l2(c2.first.cols * this.itemSize[1], (c2.first.rows - 1) * this.itemSize[0]) : c2.first.cols - s2.cols > e2[1] && l2((c2.first.cols - 1) * this.itemSize[1], c2.first.rows * this.itemSize[0]);
        else if (c2.first - s2 > e2) {
          var f2 = (c2.first - 1) * this.itemSize;
          a2 ? l2(f2, 0) : l2(0, f2);
        }
      } else if (d2) {
        if (i2) c2.last.rows - s2.rows <= e2[0] + 1 ? l2(c2.first.cols * this.itemSize[1], (c2.first.rows + 1) * this.itemSize[0]) : c2.last.cols - s2.cols <= e2[1] + 1 && l2((c2.first.cols + 1) * this.itemSize[1], c2.first.rows * this.itemSize[0]);
        else if (c2.last - s2 <= e2 + 1) {
          var p2 = (c2.first + 1) * this.itemSize;
          a2 ? l2(p2, 0) : l2(0, p2);
        }
      }
    }
  } else this.scrollToIndex(e2, r2);
}, getRenderedRange: function() {
  var e2 = function(e3, t3) {
    return Math.floor(e3 / (t3 || e3));
  }, t2 = this.first, n2 = 0;
  if (this.element) {
    var r2 = this.isBoth(), i2 = this.isHorizontal(), a2 = this.element, o2 = a2.scrollTop, s2 = a2.scrollLeft;
    r2 ? (t2 = { rows: e2(o2, this.itemSize[0]), cols: e2(s2, this.itemSize[1]) }, n2 = { rows: t2.rows + this.numItemsInViewport.rows, cols: t2.cols + this.numItemsInViewport.cols }) : (t2 = e2(i2 ? s2 : o2, this.itemSize), n2 = t2 + this.numItemsInViewport);
  }
  return { first: this.first, last: this.last, viewport: { first: t2, last: n2 } };
}, calculateNumItems: function() {
  var e2 = this.isBoth(), t2 = this.isHorizontal(), n2 = this.itemSize, r2 = this.getContentPosition(), i2 = this.element ? this.element.offsetWidth - r2.left : 0, a2 = this.element ? this.element.offsetHeight - r2.top : 0, o2 = function(e3, t3) {
    return Math.ceil(e3 / (t3 || e3));
  }, s2 = function(e3) {
    return Math.ceil(e3 / 2);
  }, c2 = e2 ? { rows: o2(a2, n2[0]), cols: o2(i2, n2[1]) } : o2(t2 ? i2 : a2, n2);
  return { numItemsInViewport: c2, numToleratedItems: this.d_numToleratedItems || (e2 ? [s2(c2.rows), s2(c2.cols)] : s2(c2)) };
}, calculateOptions: function() {
  var e2 = this, t2 = this.isBoth(), n2 = this.first, r2 = this.calculateNumItems(), i2 = r2.numItemsInViewport, a2 = r2.numToleratedItems, o2 = function(t3, n3, r3) {
    var i3 = arguments.length > 3 && arguments[3] !== void 0 && arguments[3];
    return e2.getLast(t3 + n3 + (t3 < r3 ? 2 : 3) * r3, i3);
  }, s2 = t2 ? { rows: o2(n2.rows, i2.rows, a2[0]), cols: o2(n2.cols, i2.cols, a2[1], !0) } : o2(n2, i2, a2);
  this.last = s2, this.numItemsInViewport = i2, this.d_numToleratedItems = a2, this.$emit("update:numToleratedItems", this.d_numToleratedItems), this.showLoader && (this.loaderArr = t2 ? Array.from({ length: i2.rows }).map(function() {
    return Array.from({ length: i2.cols });
  }) : Array.from({ length: i2 })), this.lazy && Promise.resolve().then(function() {
    e2.lazyLoadState = { first: e2.step ? t2 ? { rows: 0, cols: n2.cols } : 0 : n2, last: Math.min(e2.step ? e2.step : s2, e2.items?.length || 0) }, e2.$emit("lazy-load", e2.lazyLoadState);
  });
}, calculateAutoSize: function() {
  var e2 = this;
  this.autoSize && !this.d_loading && Promise.resolve().then(function() {
    if (e2.content) {
      var t2 = e2.isBoth(), n2 = e2.isHorizontal(), r2 = e2.isVertical();
      e2.content.style.minHeight = e2.content.style.minWidth = "auto", e2.content.style.position = "relative", e2.element.style.contain = "none";
      var i2 = [S(e2.element), C(e2.element)], a2 = i2[0], o2 = i2[1];
      (t2 || n2) && (e2.element.style.width = a2 < e2.defaultWidth ? a2 + "px" : e2.scrollWidth || e2.defaultWidth + "px"), (t2 || r2) && (e2.element.style.height = o2 < e2.defaultHeight ? o2 + "px" : e2.scrollHeight || e2.defaultHeight + "px"), e2.content.style.minHeight = e2.content.style.minWidth = "", e2.content.style.position = "", e2.element.style.contain = "";
    }
  });
}, getLast: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0, t2 = arguments.length > 1 ? arguments[1] : void 0;
  return this.items ? Math.min(t2 ? (this.columns || this.items[0])?.length || 0 : this.items?.length || 0, e2) : 0;
}, getContentPosition: function() {
  if (this.content) {
    var e2 = getComputedStyle(this.content), t2 = parseFloat(e2.paddingLeft) + Math.max(parseFloat(e2.left) || 0, 0), n2 = parseFloat(e2.paddingRight) + Math.max(parseFloat(e2.right) || 0, 0), r2 = parseFloat(e2.paddingTop) + Math.max(parseFloat(e2.top) || 0, 0), i2 = parseFloat(e2.paddingBottom) + Math.max(parseFloat(e2.bottom) || 0, 0);
    return { left: t2, right: n2, top: r2, bottom: i2, x: t2 + n2, y: r2 + i2 };
  }
  return { left: 0, right: 0, top: 0, bottom: 0, x: 0, y: 0 };
}, setSize: function() {
  var e2 = this;
  if (this.element) {
    var t2 = this.isBoth(), n2 = this.isHorizontal(), r2 = this.element.parentElement, i2 = this.scrollWidth || `${this.element.offsetWidth || r2.offsetWidth}px`, a2 = this.scrollHeight || `${this.element.offsetHeight || r2.offsetHeight}px`, o2 = function(t3, n3) {
      return e2.element.style[t3] = n3;
    };
    t2 || n2 ? (o2("height", a2), o2("width", i2)) : o2("height", a2);
  }
}, setSpacerSize: function() {
  var e2 = this, t2 = this.items;
  if (t2) {
    var n2 = this.isBoth(), r2 = this.isHorizontal(), i2 = this.getContentPosition(), a2 = function(t3, n3, r3) {
      var i3 = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
      return e2.spacerStyle = Y(Y({}, e2.spacerStyle), Le({}, `${t3}`, (n3 || []).length * r3 + i3 + "px"));
    };
    n2 ? (a2("height", t2, this.itemSize[0], i2.y), a2("width", this.columns || t2[1], this.itemSize[1], i2.x)) : r2 ? a2("width", this.columns || t2, this.itemSize, i2.x) : a2("height", t2, this.itemSize, i2.y);
  }
}, setContentPosition: function(e2) {
  var t2 = this;
  if (this.content && !this.appendOnly) {
    var n2 = this.isBoth(), r2 = this.isHorizontal(), i2 = e2 ? e2.first : this.first, a2 = function(e3, t3) {
      return e3 * t3;
    }, o2 = function() {
      var e3 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0, n3 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
      return t2.contentStyle = Y(Y({}, t2.contentStyle), { transform: `translate3d(${e3}px, ${n3}px, 0)` });
    };
    if (n2) o2(a2(i2.cols, this.itemSize[1]), a2(i2.rows, this.itemSize[0]));
    else {
      var s2 = a2(i2, this.itemSize);
      r2 ? o2(s2, 0) : o2(0, s2);
    }
  }
}, onScrollPositionChange: function(e2) {
  var t2 = this, n2 = e2.target, r2 = this.isBoth(), i2 = this.isHorizontal(), a2 = this.getContentPosition(), o2 = function(e3, t3) {
    return e3 ? e3 > t3 ? e3 - t3 : e3 : 0;
  }, s2 = function(e3, t3) {
    return Math.floor(e3 / (t3 || e3));
  }, c2 = function(e3, t3, n3, r3, i3, a3) {
    return e3 <= i3 ? i3 : a3 ? n3 - r3 - i3 : t3 + i3 - 1;
  }, l2 = function(e3, n3, r3, i3, a3, o3, s3, c3) {
    if (e3 <= o3) return 0;
    var l3 = Math.max(0, s3 ? e3 < n3 ? r3 : e3 - o3 : e3 > n3 ? r3 : e3 - 2 * o3), u3 = t2.getLast(l3, c3);
    return l3 > u3 ? u3 - a3 : l3;
  }, u2 = function(e3, n3, r3, i3, a3, o3) {
    var s3 = n3 + i3 + 2 * a3;
    return e3 >= a3 && (s3 += a3 + 1), t2.getLast(s3, o3);
  }, d2 = o2(n2.scrollTop, a2.top), f2 = o2(n2.scrollLeft, a2.left), p2 = r2 ? { rows: 0, cols: 0 } : 0, m2 = this.last, h2 = !1, g2 = this.lastScrollPos;
  if (r2) {
    var _2 = this.lastScrollPos.top <= d2, v2 = this.lastScrollPos.left <= f2;
    if (!this.appendOnly || this.appendOnly && (_2 || v2)) {
      var y2 = { rows: s2(d2, this.itemSize[0]), cols: s2(f2, this.itemSize[1]) }, b2 = { rows: c2(y2.rows, this.first.rows, this.last.rows, this.numItemsInViewport.rows, this.d_numToleratedItems[0], _2), cols: c2(y2.cols, this.first.cols, this.last.cols, this.numItemsInViewport.cols, this.d_numToleratedItems[1], v2) };
      p2 = { rows: l2(y2.rows, b2.rows, this.first.rows, this.last.rows, this.numItemsInViewport.rows, this.d_numToleratedItems[0], _2), cols: l2(y2.cols, b2.cols, this.first.cols, this.last.cols, this.numItemsInViewport.cols, this.d_numToleratedItems[1], v2, !0) }, m2 = { rows: u2(y2.rows, p2.rows, this.last.rows, this.numItemsInViewport.rows, this.d_numToleratedItems[0]), cols: u2(y2.cols, p2.cols, this.last.cols, this.numItemsInViewport.cols, this.d_numToleratedItems[1], !0) }, h2 = p2.rows !== this.first.rows || m2.rows !== this.last.rows || p2.cols !== this.first.cols || m2.cols !== this.last.cols || this.isRangeChanged, g2 = { top: d2, left: f2 };
    }
  } else {
    var x2 = i2 ? f2 : d2, S2 = this.lastScrollPos <= x2;
    if (!this.appendOnly || this.appendOnly && S2) {
      var C2 = s2(x2, this.itemSize);
      p2 = l2(C2, c2(C2, this.first, this.last, this.numItemsInViewport, this.d_numToleratedItems, S2), this.first, this.last, this.numItemsInViewport, this.d_numToleratedItems, S2), m2 = u2(C2, p2, this.last, this.numItemsInViewport, this.d_numToleratedItems), h2 = p2 !== this.first || m2 !== this.last || this.isRangeChanged, g2 = x2;
    }
  }
  return { first: p2, last: m2, isRangeChanged: h2, scrollPos: g2 };
}, onScrollChange: function(e2) {
  var t2 = this.onScrollPositionChange(e2), n2 = t2.first, r2 = t2.last, i2 = t2.isRangeChanged, a2 = t2.scrollPos;
  if (i2) {
    var o2 = { first: n2, last: r2 };
    if (this.setContentPosition(o2), this.first = n2, this.last = r2, this.lastScrollPos = a2, this.$emit("scroll-index-change", o2), this.lazy && this.isPageChanged(n2)) {
      var s2 = { first: this.step ? Math.min(this.getPageByFirst(n2) * this.step, (this.items?.length || 0) - this.step) : n2, last: Math.min(this.step ? (this.getPageByFirst(n2) + 1) * this.step : r2, this.items?.length || 0) };
      (this.lazyLoadState.first !== s2.first || this.lazyLoadState.last !== s2.last) && this.$emit("lazy-load", s2), this.lazyLoadState = s2;
    }
  }
}, onScroll: function(e2) {
  var t2 = this;
  this.$emit("scroll", e2), this.delay ? (this.scrollTimeout && clearTimeout(this.scrollTimeout), this.isPageChanged() && (!this.d_loading && this.showLoader && (this.onScrollPositionChange(e2).isRangeChanged || this.step && this.isPageChanged()) && (this.d_loading = !0), this.scrollTimeout = setTimeout(function() {
    t2.onScrollChange(e2), t2.d_loading && t2.showLoader && (!t2.lazy || t2.loading === void 0) && (t2.d_loading = !1, t2.page = t2.getPageByFirst());
  }, this.delay))) : this.onScrollChange(e2);
}, onResize: function() {
  var e2 = this;
  this.resizeTimeout && clearTimeout(this.resizeTimeout), this.resizeTimeout = setTimeout(function() {
    if (D(e2.element)) {
      var t2 = e2.isBoth(), n2 = e2.isVertical(), r2 = e2.isHorizontal(), i2 = [S(e2.element), C(e2.element)], a2 = i2[0], o2 = i2[1], s2 = a2 !== e2.defaultWidth, c2 = o2 !== e2.defaultHeight;
      (t2 ? s2 || c2 : r2 ? s2 : n2 && c2) && (e2.d_numToleratedItems = e2.numToleratedItems, e2.defaultWidth = a2, e2.defaultHeight = o2, e2.defaultContentWidth = S(e2.content), e2.defaultContentHeight = C(e2.content), e2.init());
    }
  }, this.resizeDelay);
}, bindResizeListener: function() {
  var e2 = this;
  this.resizeListener || (this.resizeListener = this.onResize.bind(this), window.addEventListener("resize", this.resizeListener), window.addEventListener("orientationchange", this.resizeListener), this.resizeObserver = new ResizeObserver(function() {
    e2.onResize();
  }), this.resizeObserver.observe(this.element));
}, unbindResizeListener: function() {
  this.resizeListener &&= (window.removeEventListener("resize", this.resizeListener), window.removeEventListener("orientationchange", this.resizeListener), null), this.resizeObserver &&= (this.resizeObserver.disconnect(), null);
}, getOptions: function(e2) {
  var t2 = (this.items || []).length, n2 = this.isBoth() ? this.first.rows + e2 : this.first + e2;
  return { index: n2, count: t2, first: n2 === 0, last: n2 === t2 - 1, even: n2 % 2 == 0, odd: n2 % 2 != 0 };
}, getLoaderOptions: function(e2, t2) {
  var n2 = this.loaderArr.length;
  return Y({ index: e2, count: n2, first: e2 === 0, last: e2 === n2 - 1, even: e2 % 2 == 0, odd: e2 % 2 != 0 }, t2);
}, getPageByFirst: function(e2) {
  return Math.floor(((e2 ?? this.first) + this.d_numToleratedItems * 4) / (this.step || 1));
}, isPageChanged: function(e2) {
  return this.step && !this.lazy ? this.page !== this.getPageByFirst(e2 ?? this.first) : !0;
}, setContentEl: function(e2) {
  this.content = e2 || this.content || T(this.element, '[data-pc-section="content"]');
}, elementRef: function(e2) {
  this.element = e2;
}, contentRef: function(e2) {
  this.content = e2;
} }, computed: { containerClass: function() {
  return ["p-virtualscroller", this.class, { "p-virtualscroller-inline": this.inline, "p-virtualscroller-both p-both-scroll": this.isBoth(), "p-virtualscroller-horizontal p-horizontal-scroll": this.isHorizontal() }];
}, contentClass: function() {
  return ["p-virtualscroller-content", { "p-virtualscroller-loading": this.d_loading }];
}, loaderClass: function() {
  return ["p-virtualscroller-loader", { "p-virtualscroller-loader-mask": !this.$slots.loader }];
}, loadedItems: function() {
  var e2 = this;
  return this.items && !this.d_loading ? this.isBoth() ? this.items.slice(this.appendOnly ? 0 : this.first.rows, this.last.rows).map(function(t2) {
    return e2.columns ? t2 : t2.slice(e2.appendOnly ? 0 : e2.first.cols, e2.last.cols);
  }) : this.isHorizontal() && this.columns ? this.items : this.items.slice(this.appendOnly ? 0 : this.first, this.last) : [];
}, loadedRows: function() {
  return this.d_loading ? this.loaderDisabled ? this.loaderArr : [] : this.loadedItems;
}, loadedColumns: function() {
  if (this.columns) {
    var e2 = this.isBoth(), t2 = this.isHorizontal();
    if (e2 || t2) return this.d_loading && this.loaderDisabled ? e2 ? this.loaderArr[0] : this.loaderArr : this.columns.slice(e2 ? this.first.cols : this.first, e2 ? this.last.cols : this.last);
  }
  return this.columns;
} }, components: { SpinnerIcon: z } };
var Be = ["tabindex"];
function Ve(r2, a2, o2, s2, d2, f2) {
  var m2 = i("SpinnerIcon");
  return r2.disabled ? (n(), l(u, { key: 1 }, [e(r2.$slots, "default"), e(r2.$slots, "content", { items: r2.items, rows: r2.items, columns: f2.loadedColumns })], 64)) : (n(), l("div", t({ key: 0, ref: f2.elementRef, class: f2.containerClass, tabindex: r2.tabindex, style: r2.style, onScroll: a2[0] ||= function() {
    return f2.onScroll && f2.onScroll.apply(f2, arguments);
  } }, r2.ptmi("root")), [e(r2.$slots, "content", { styleClass: f2.contentClass, items: f2.loadedItems, getItemOptions: f2.getOptions, loading: d2.d_loading, getLoaderOptions: f2.getLoaderOptions, itemSize: r2.itemSize, rows: f2.loadedRows, columns: f2.loadedColumns, contentRef: f2.contentRef, spacerStyle: d2.spacerStyle, contentStyle: d2.contentStyle, vertical: f2.isVertical(), horizontal: f2.isHorizontal(), both: f2.isBoth() }, function() {
    return [c("div", t({ ref: f2.contentRef, class: f2.contentClass, style: d2.contentStyle }, r2.ptm("content")), [(n(!0), l(u, null, g(f2.loadedItems, function(t2, n2) {
      return e(r2.$slots, "item", { key: n2, item: t2, options: f2.getOptions(n2) });
    }), 128))], 16)];
  }), r2.showSpacer ? (n(), l("div", t({ key: 0, class: "p-virtualscroller-spacer", style: d2.spacerStyle }, r2.ptm("spacer")), null, 16)) : p("", !0), !r2.loaderDisabled && r2.showLoader && d2.d_loading ? (n(), l("div", t({ key: 1, class: f2.loaderClass }, r2.ptm("loader")), [r2.$slots && r2.$slots.loader ? (n(!0), l(u, { key: 0 }, g(d2.loaderArr, function(t2, n2) {
    return e(r2.$slots, "loader", { key: n2, options: f2.getLoaderOptions(n2, f2.isBoth() && { numCols: r2.d_numItemsInViewport.cols }) });
  }), 128)) : p("", !0), e(r2.$slots, "loadingicon", {}, function() {
    return [y(m2, t({ spin: "", class: "p-virtualscroller-loading-icon" }, r2.ptm("loadingIcon")), null, 16)];
  })], 16)) : p("", !0)], 16, Be));
}
X.render = Ve;
var He = { name: "BaseSelect", extends: pe, props: { options: Array, optionLabel: [String, Function], optionValue: [String, Function], optionDisabled: [String, Function], optionGroupLabel: [String, Function], optionGroupChildren: [String, Function], scrollHeight: { type: String, default: "14rem" }, filter: Boolean, filterPlaceholder: String, filterLocale: String, filterMatchMode: { type: String, default: "contains" }, filterFields: { type: Array, default: null }, editable: Boolean, placeholder: { type: String, default: null }, dataKey: null, showClear: { type: Boolean, default: !1 }, inputId: { type: String, default: null }, inputClass: { type: [String, Object], default: null }, inputStyle: { type: Object, default: null }, labelId: { type: String, default: null }, labelClass: { type: [String, Object], default: null }, labelStyle: { type: Object, default: null }, panelClass: { type: [String, Object], default: null }, overlayStyle: { type: Object, default: null }, overlayClass: { type: [String, Object], default: null }, panelStyle: { type: Object, default: null }, appendTo: { type: [String, Object], default: "body" }, loading: { type: Boolean, default: !1 }, clearIcon: { type: String, default: void 0 }, dropdownIcon: { type: String, default: void 0 }, filterIcon: { type: String, default: void 0 }, loadingIcon: { type: String, default: void 0 }, resetFilterOnHide: { type: Boolean, default: !1 }, resetFilterOnClear: { type: Boolean, default: !1 }, virtualScrollerOptions: { type: Object, default: null }, autoOptionFocus: { type: Boolean, default: !1 }, autoFilterFocus: { type: Boolean, default: !1 }, selectOnFocus: { type: Boolean, default: !1 }, focusOnHover: { type: Boolean, default: !0 }, highlightOnSelect: { type: Boolean, default: !0 }, checkmark: { type: Boolean, default: !1 }, filterMessage: { type: String, default: null }, selectionMessage: { type: String, default: null }, emptySelectionMessage: { type: String, default: null }, emptyFilterMessage: { type: String, default: null }, emptyMessage: { type: String, default: null }, tabindex: { type: Number, default: 0 }, ariaLabel: { type: String, default: null }, ariaLabelledby: { type: String, default: null } }, style: le, provide: function() {
  return { $pcSelect: this, $parentInstance: this };
} };
function Z(e2) {
  "@babel/helpers - typeof";
  return Z = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, Z(e2);
}
function Ue(e2) {
  return qe(e2) || Ke(e2) || Ge(e2) || We();
}
function We() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Ge(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return Q(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? Q(e2, t2) : void 0;
  }
}
function Ke(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function qe(e2) {
  if (Array.isArray(e2)) return Q(e2);
}
function Q(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function Je(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function Ye(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? Je(Object(n2), !0).forEach(function(t3) {
      $(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : Je(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function $(e2, t2, n2) {
  return (t2 = Xe(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function Xe(e2) {
  var t2 = Ze(e2, "string");
  return Z(t2) == "symbol" ? t2 : t2 + "";
}
function Ze(e2, t2) {
  if (Z(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (Z(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var Qe = { name: "Select", extends: He, inheritAttrs: !1, emits: ["change", "focus", "blur", "before-show", "before-hide", "show", "hide", "filter"], outsideClickListener: null, scrollHandler: null, resizeListener: null, labelClickListener: null, matchMediaOrientationListener: null, overlay: null, list: null, virtualScroller: null, searchTimeout: null, searchValue: null, isModelValueChanged: !1, data: function() {
  return { clicked: !1, focused: !1, focusedOptionIndex: -1, filterValue: null, overlayVisible: !1, queryOrientation: null };
}, watch: { modelValue: function() {
  this.isModelValueChanged = !0;
}, options: function() {
  this.autoUpdateModel();
} }, mounted: function() {
  this.autoUpdateModel(), this.bindLabelClickListener(), this.bindMatchMediaOrientationListener();
}, updated: function() {
  this.overlayVisible && this.isModelValueChanged && this.scrollInView(this.findSelectedOptionIndex()), this.isModelValueChanged = !1;
}, beforeUnmount: function() {
  this.unbindOutsideClickListener(), this.unbindResizeListener(), this.unbindLabelClickListener(), this.unbindMatchMediaOrientationListener(), this.scrollHandler &&= (this.scrollHandler.destroy(), null), this.overlay &&= (R.clear(this.overlay), null);
}, methods: { getOptionIndex: function(e2, t2) {
  return this.virtualScrollerDisabled ? e2 : t2 && t2(e2).index;
}, getOptionLabel: function(e2) {
  return this.optionLabel ? P(e2, this.optionLabel) : e2;
}, getOptionValue: function(e2) {
  return this.optionValue ? P(e2, this.optionValue) : e2;
}, getOptionRenderKey: function(e2, t2) {
  return (this.dataKey ? P(e2, this.dataKey) : this.getOptionLabel(e2)) + "_" + t2;
}, getPTItemOptions: function(e2, t2, n2, r2) {
  return this.ptm(r2, { context: { option: e2, index: n2, selected: this.isSelected(e2), focused: this.focusedOptionIndex === this.getOptionIndex(n2, t2), disabled: this.isOptionDisabled(e2) } });
}, isOptionDisabled: function(e2) {
  return this.optionDisabled ? P(e2, this.optionDisabled) : !1;
}, isOptionGroup: function(e2) {
  return this.optionGroupLabel && e2.optionGroup && e2.group;
}, getOptionGroupLabel: function(e2) {
  return P(e2, this.optionGroupLabel);
}, getOptionGroupChildren: function(e2) {
  return P(e2, this.optionGroupChildren);
}, getAriaPosInset: function(e2) {
  var t2 = this;
  return (this.optionGroupLabel ? e2 - this.visibleOptions.slice(0, e2).filter(function(e3) {
    return t2.isOptionGroup(e3);
  }).length : e2) + 1;
}, show: function(e2) {
  this.$emit("before-show"), this.overlayVisible = !0, this.focusedOptionIndex = this.focusedOptionIndex === -1 ? this.autoOptionFocus ? this.findFirstFocusedOptionIndex() : this.editable ? -1 : this.findSelectedOptionIndex() : this.focusedOptionIndex, e2 && w(this.$refs.focusInput);
}, hide: function(e2) {
  var t2 = this, n2 = function() {
    t2.$emit("before-hide"), t2.overlayVisible = !1, t2.clicked = !1, t2.focusedOptionIndex = -1, t2.searchValue = "", t2.resetFilterOnHide && (t2.filterValue = null), e2 && w(t2.$refs.focusInput);
  };
  setTimeout(function() {
    n2();
  }, 0);
}, onFocus: function(e2) {
  this.disabled || (this.focused = !0, this.overlayVisible && (this.focusedOptionIndex = this.focusedOptionIndex === -1 ? this.autoOptionFocus ? this.findFirstFocusedOptionIndex() : this.editable ? -1 : this.findSelectedOptionIndex() : this.focusedOptionIndex, this.scrollInView(this.focusedOptionIndex)), this.$emit("focus", e2));
}, onBlur: function(e2) {
  var t2 = this;
  setTimeout(function() {
    var n2, r2;
    t2.focused = !1, t2.focusedOptionIndex = -1, t2.searchValue = "", t2.$emit("blur", e2), (n2 = (r2 = t2.formField).onBlur) == null || n2.call(r2, e2);
  }, 100);
}, onKeyDown: function(e2) {
  var t2 = this;
  if (this.disabled) e2.preventDefault();
  else {
    if (k()) switch (e2.code) {
      case "Backspace":
        this.onBackspaceKey(e2, this.editable);
        break;
      case "Enter":
      case "NumpadDecimal":
        this.onEnterKey(e2);
        break;
      default:
        e2.preventDefault();
        return;
    }
    var n2 = e2.metaKey || e2.ctrlKey;
    switch (e2.code) {
      case "ArrowDown":
        this.onArrowDownKey(e2);
        break;
      case "ArrowUp":
        this.onArrowUpKey(e2, this.editable);
        break;
      case "ArrowLeft":
      case "ArrowRight":
        this.onArrowLeftKey(e2, this.editable);
        break;
      case "Home":
        this.onHomeKey(e2, this.editable);
        break;
      case "End":
        this.onEndKey(e2, this.editable);
        break;
      case "PageDown":
        this.onPageDownKey(e2);
        break;
      case "PageUp":
        this.onPageUpKey(e2);
        break;
      case "Space":
        this.onSpaceKey(e2, this.editable);
        break;
      case "Enter":
      case "NumpadEnter":
        this.onEnterKey(e2);
        break;
      case "Escape":
        this.onEscapeKey(e2);
        break;
      case "Tab":
        this.onTabKey(e2);
        break;
      case "Backspace":
        this.onBackspaceKey(e2, this.editable);
        break;
      case "ShiftLeft":
      case "ShiftRight":
        break;
      default:
        !n2 && ae(e2.key) && (!this.overlayVisible && this.show(), !this.editable && this.searchOptions(e2, e2.key), this.filter && this.$nextTick(function() {
          t2.$refs.filterInput && w(t2.$refs.filterInput.$el);
        }));
    }
    this.clicked = !1;
  }
}, onEditableInput: function(e2) {
  var t2 = e2.target.value;
  this.searchValue = "", !this.searchOptions(e2, t2) && (this.focusedOptionIndex = -1), this.updateModel(e2, t2), !this.overlayVisible && F(t2) && this.show();
}, onContainerClick: function(e2) {
  this.disabled || this.loading || e2.target.tagName === "INPUT" || e2.target.getAttribute("data-pc-section") === "clearicon" || e2.target.closest('[data-pc-section="clearicon"]') || (this.overlay && this.overlay.contains(e2.target) || (this.overlayVisible ? this.hide(!0) : this.show(!0)), this.clicked = !0);
}, onClearClick: function(e2) {
  this.updateModel(e2, null), this.resetFilterOnClear && (this.filterValue = null);
}, onFirstHiddenFocus: function(e2) {
  var t2 = e2.relatedTarget === this.$refs.focusInput ? N(this.overlay, ':not([data-p-hidden-focusable="true"])') : this.$refs.focusInput;
  w(t2);
}, onLastHiddenFocus: function(e2) {
  var t2 = e2.relatedTarget === this.$refs.focusInput ? M(this.overlay, ':not([data-p-hidden-focusable="true"])') : this.$refs.focusInput;
  w(t2);
}, onOptionSelect: function(e2, t2) {
  var n2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !0;
  if (this.overlayVisible) {
    var r2 = this.getOptionValue(t2);
    this.updateModel(e2, r2), n2 && this.hide(!0);
  }
}, onOptionMouseMove: function(e2, t2) {
  this.focusOnHover && this.changeFocusedOptionIndex(e2, t2);
}, onFilterChange: function(e2) {
  var t2 = e2.target.value;
  this.filterValue = t2, this.focusedOptionIndex = -1, this.$emit("filter", { originalEvent: e2, value: t2 }), !this.virtualScrollerDisabled && this.virtualScroller.scrollToIndex(0);
}, onFilterKeyDown: function(e2) {
  if (!e2.isComposing) switch (e2.code) {
    case "ArrowDown":
      this.onArrowDownKey(e2);
      break;
    case "ArrowUp":
      this.onArrowUpKey(e2, !0);
      break;
    case "ArrowLeft":
    case "ArrowRight":
      this.onArrowLeftKey(e2, !0);
      break;
    case "Home":
      this.onHomeKey(e2, !0);
      break;
    case "End":
      this.onEndKey(e2, !0);
      break;
    case "Enter":
    case "NumpadEnter":
      this.onEnterKey(e2);
      break;
    case "Escape":
      this.onEscapeKey(e2);
      break;
    case "Tab":
      this.onTabKey(e2);
  }
}, onFilterBlur: function() {
  this.focusedOptionIndex = -1;
}, onFilterUpdated: function() {
  this.overlayVisible && this.alignOverlay();
}, onOverlayClick: function(e2) {
  me.emit("overlay-click", { originalEvent: e2, target: this.$el });
}, onOverlayKeyDown: function(e2) {
  e2.code === "Escape" && this.onEscapeKey(e2);
}, onArrowDownKey: function(e2) {
  if (!this.overlayVisible) this.show(), this.editable && this.changeFocusedOptionIndex(e2, this.findSelectedOptionIndex());
  else {
    var t2 = this.focusedOptionIndex === -1 ? this.clicked ? this.findFirstOptionIndex() : this.findFirstFocusedOptionIndex() : this.findNextOptionIndex(this.focusedOptionIndex);
    this.changeFocusedOptionIndex(e2, t2);
  }
  e2.preventDefault();
}, onArrowUpKey: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 && arguments[1];
  if (e2.altKey && !t2) this.focusedOptionIndex !== -1 && this.onOptionSelect(e2, this.visibleOptions[this.focusedOptionIndex]), this.overlayVisible && this.hide(), e2.preventDefault();
  else {
    var n2 = this.focusedOptionIndex === -1 ? this.clicked ? this.findLastOptionIndex() : this.findLastFocusedOptionIndex() : this.findPrevOptionIndex(this.focusedOptionIndex);
    this.changeFocusedOptionIndex(e2, n2), !this.overlayVisible && this.show(), e2.preventDefault();
  }
}, onArrowLeftKey: function(e2) {
  arguments.length > 1 && arguments[1] !== void 0 && arguments[1] && (this.focusedOptionIndex = -1);
}, onHomeKey: function(e2) {
  if (arguments.length > 1 && arguments[1] !== void 0 && arguments[1]) {
    var t2 = e2.currentTarget;
    e2.shiftKey ? t2.setSelectionRange(0, e2.target.selectionStart) : (t2.setSelectionRange(0, 0), this.focusedOptionIndex = -1);
  } else this.changeFocusedOptionIndex(e2, this.findFirstOptionIndex()), !this.overlayVisible && this.show();
  e2.preventDefault();
}, onEndKey: function(e2) {
  if (arguments.length > 1 && arguments[1] !== void 0 && arguments[1]) {
    var t2 = e2.currentTarget;
    if (e2.shiftKey) t2.setSelectionRange(e2.target.selectionStart, t2.value.length);
    else {
      var n2 = t2.value.length;
      t2.setSelectionRange(n2, n2), this.focusedOptionIndex = -1;
    }
  } else this.changeFocusedOptionIndex(e2, this.findLastOptionIndex()), !this.overlayVisible && this.show();
  e2.preventDefault();
}, onPageUpKey: function(e2) {
  this.scrollInView(0), e2.preventDefault();
}, onPageDownKey: function(e2) {
  this.scrollInView(this.visibleOptions.length - 1), e2.preventDefault();
}, onEnterKey: function(e2) {
  this.overlayVisible ? (this.focusedOptionIndex !== -1 && this.onOptionSelect(e2, this.visibleOptions[this.focusedOptionIndex]), this.hide(!0)) : (this.focusedOptionIndex = -1, this.onArrowDownKey(e2)), e2.preventDefault();
}, onSpaceKey: function(e2) {
  !(arguments.length > 1 && arguments[1] !== void 0 && arguments[1]) && this.onEnterKey(e2);
}, onEscapeKey: function(e2) {
  this.overlayVisible && this.hide(!0), e2.preventDefault(), e2.stopPropagation();
}, onTabKey: function(e2) {
  arguments.length > 1 && arguments[1] !== void 0 && arguments[1] || (this.overlayVisible && this.hasFocusableElements() ? (w(this.$refs.firstHiddenFocusableElementOnOverlay), e2.preventDefault()) : (this.focusedOptionIndex !== -1 && this.onOptionSelect(e2, this.visibleOptions[this.focusedOptionIndex]), this.overlayVisible && this.hide(this.filter)));
}, onBackspaceKey: function(e2) {
  arguments.length > 1 && arguments[1] !== void 0 && arguments[1] && !this.overlayVisible && this.show();
}, onOverlayEnter: function(e2) {
  var t2 = this;
  R.set("overlay", e2, this.$primevue.config.zIndex.overlay), re(e2, { position: "absolute", top: "0" }), this.alignOverlay(), this.scrollInView(), this.$attrSelector && e2.setAttribute(this.$attrSelector, ""), setTimeout(function() {
    t2.autoFilterFocus && t2.filter && w(t2.$refs.filterInput.$el), t2.autoUpdateModel();
  }, 1);
}, onOverlayAfterEnter: function() {
  this.bindOutsideClickListener(), this.bindScrollListener(), this.bindResizeListener(), this.$emit("show");
}, onOverlayLeave: function(e2) {
  var t2 = this;
  e2.style.pointerEvents = "none", this.unbindOutsideClickListener(), this.unbindScrollListener(), this.unbindResizeListener(), this.autoFilterFocus && this.filter && !this.editable && this.$nextTick(function() {
    t2.$refs.filterInput && w(t2.$refs.filterInput.$el);
  }), this.$emit("hide"), this.overlay = null;
}, onOverlayAfterLeave: function(e2) {
  R.clear(e2);
}, alignOverlay: function() {
  this.appendTo === "self" ? j(this.overlay, this.$el) : this.overlay && (this.overlay.style.minWidth = E(this.$el) + "px", A(this.overlay, this.$el));
}, bindOutsideClickListener: function() {
  var e2 = this;
  this.outsideClickListener || (this.outsideClickListener = function(t2) {
    var n2 = t2.composedPath();
    e2.overlayVisible && e2.overlay && !n2.includes(e2.$el) && !n2.includes(e2.overlay) && e2.hide();
  }, document.addEventListener("click", this.outsideClickListener, !0));
}, unbindOutsideClickListener: function() {
  this.outsideClickListener &&= (document.removeEventListener("click", this.outsideClickListener, !0), null);
}, bindScrollListener: function() {
  var e2 = this;
  this.scrollHandler ||= new ce(this.$refs.container, function() {
    e2.overlayVisible && e2.hide();
  }), this.scrollHandler.bindScrollListener();
}, unbindScrollListener: function() {
  this.scrollHandler && this.scrollHandler.unbindScrollListener();
}, bindResizeListener: function() {
  var e2 = this;
  this.resizeListener || (this.resizeListener = function() {
    e2.overlayVisible && !te() && e2.hide();
  }, window.addEventListener("resize", this.resizeListener));
}, unbindResizeListener: function() {
  this.resizeListener &&= (window.removeEventListener("resize", this.resizeListener), null);
}, bindLabelClickListener: function() {
  var e2 = this;
  if (!this.editable && !this.labelClickListener) {
    var t2 = document.querySelector(`label[for="${this.labelId}"]`);
    t2 && D(t2) && (this.labelClickListener = function() {
      w(e2.$refs.focusInput);
    }, t2.addEventListener("click", this.labelClickListener));
  }
}, unbindLabelClickListener: function() {
  if (this.labelClickListener) {
    var e2 = document.querySelector(`label[for="${this.labelId}"]`);
    e2 && D(e2) && e2.removeEventListener("click", this.labelClickListener);
  }
}, bindMatchMediaOrientationListener: function() {
  var e2 = this;
  if (!this.matchMediaOrientationListener) {
    var t2 = matchMedia("(orientation: portrait)");
    this.queryOrientation = t2, this.matchMediaOrientationListener = function() {
      e2.alignOverlay();
    }, this.queryOrientation.addEventListener("change", this.matchMediaOrientationListener);
  }
}, unbindMatchMediaOrientationListener: function() {
  this.matchMediaOrientationListener &&= (this.queryOrientation.removeEventListener("change", this.matchMediaOrientationListener), this.queryOrientation = null, null);
}, hasFocusableElements: function() {
  return ee(this.overlay, ':not([data-p-hidden-focusable="true"])').length > 0;
}, isOptionExactMatched: function(e2) {
  return this.isValidOption(e2) && typeof this.getOptionLabel(e2) == "string" && this.getOptionLabel(e2)?.toLocaleLowerCase(this.filterLocale) == this.searchValue.toLocaleLowerCase(this.filterLocale);
}, isOptionStartsWith: function(e2) {
  return this.isValidOption(e2) && typeof this.getOptionLabel(e2) == "string" && this.getOptionLabel(e2)?.toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale));
}, isValidOption: function(e2) {
  return F(e2) && !(this.isOptionDisabled(e2) || this.isOptionGroup(e2));
}, isValidSelectedOption: function(e2) {
  return this.isValidOption(e2) && this.isSelected(e2);
}, isSelected: function(e2) {
  return ie(this.d_value, this.getOptionValue(e2), this.equalityKey);
}, findFirstOptionIndex: function() {
  var e2 = this;
  return this.visibleOptions.findIndex(function(t2) {
    return e2.isValidOption(t2);
  });
}, findLastOptionIndex: function() {
  var e2 = this;
  return I(this.visibleOptions, function(t2) {
    return e2.isValidOption(t2);
  });
}, findNextOptionIndex: function(e2) {
  var t2 = this, n2 = e2 < this.visibleOptions.length - 1 ? this.visibleOptions.slice(e2 + 1).findIndex(function(e3) {
    return t2.isValidOption(e3);
  }) : -1;
  return n2 > -1 ? n2 + e2 + 1 : e2;
}, findPrevOptionIndex: function(e2) {
  var t2 = this, n2 = e2 > 0 ? I(this.visibleOptions.slice(0, e2), function(e3) {
    return t2.isValidOption(e3);
  }) : -1;
  return n2 > -1 ? n2 : e2;
}, findSelectedOptionIndex: function() {
  var e2 = this;
  return this.visibleOptions.findIndex(function(t2) {
    return e2.isValidSelectedOption(t2);
  });
}, findFirstFocusedOptionIndex: function() {
  var e2 = this.findSelectedOptionIndex();
  return e2 < 0 ? this.findFirstOptionIndex() : e2;
}, findLastFocusedOptionIndex: function() {
  var e2 = this.findSelectedOptionIndex();
  return e2 < 0 ? this.findLastOptionIndex() : e2;
}, searchOptions: function(e2, t2) {
  var n2 = this;
  this.searchValue = (this.searchValue || "") + t2;
  var r2 = -1, i2 = !1;
  return F(this.searchValue) && (r2 = this.visibleOptions.findIndex(function(e3) {
    return n2.isOptionExactMatched(e3);
  }), r2 === -1 && (r2 = this.visibleOptions.findIndex(function(e3) {
    return n2.isOptionStartsWith(e3);
  })), r2 !== -1 && (i2 = !0), r2 === -1 && this.focusedOptionIndex === -1 && (r2 = this.findFirstFocusedOptionIndex()), r2 !== -1 && this.changeFocusedOptionIndex(e2, r2)), this.searchTimeout && clearTimeout(this.searchTimeout), this.searchTimeout = setTimeout(function() {
    n2.searchValue = "", n2.searchTimeout = null;
  }, 500), i2;
}, changeFocusedOptionIndex: function(e2, t2) {
  this.focusedOptionIndex !== t2 && (this.focusedOptionIndex = t2, this.scrollInView(), this.selectOnFocus && this.onOptionSelect(e2, this.visibleOptions[t2], !1));
}, scrollInView: function() {
  var e2 = this, t2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : -1;
  this.$nextTick(function() {
    var n2 = t2 === -1 ? e2.focusedOptionId : `${e2.$id}_${t2}`, r2 = T(e2.list, `li[id="${n2}"]`);
    r2 ? r2.scrollIntoView && r2.scrollIntoView({ block: "nearest", inline: "nearest" }) : e2.virtualScrollerDisabled || e2.virtualScroller && e2.virtualScroller.scrollToIndex(t2 === -1 ? e2.focusedOptionIndex : t2);
  });
}, autoUpdateModel: function() {
  this.autoOptionFocus && (this.focusedOptionIndex = this.findFirstFocusedOptionIndex()), this.selectOnFocus && this.autoOptionFocus && !this.$filled && this.onOptionSelect(null, this.visibleOptions[this.focusedOptionIndex], !1);
}, updateModel: function(e2, t2) {
  this.writeValue(t2, e2), this.$emit("change", { originalEvent: e2, value: t2 });
}, flatOptions: function(e2) {
  var t2 = this;
  return (e2 || []).reduce(function(e3, n2, r2) {
    e3.push({ optionGroup: n2, group: !0, index: r2 });
    var i2 = t2.getOptionGroupChildren(n2);
    return i2 && i2.forEach(function(t3) {
      return e3.push(t3);
    }), e3;
  }, []);
}, overlayRef: function(e2) {
  this.overlay = e2;
}, listRef: function(e2, t2) {
  this.list = e2, t2 && t2(e2);
}, virtualScrollerRef: function(e2) {
  this.virtualScroller = e2;
} }, computed: { visibleOptions: function() {
  var e2 = this, t2 = this.optionGroupLabel ? this.flatOptions(this.options) : this.options || [];
  if (this.filterValue) {
    var n2 = oe.filter(t2, this.searchFields, this.filterValue, this.filterMatchMode, this.filterLocale);
    if (this.optionGroupLabel) {
      var r2 = this.options || [], i2 = [];
      return r2.forEach(function(t3) {
        var r3 = e2.getOptionGroupChildren(t3).filter(function(e3) {
          return n2.includes(e3);
        });
        r3.length > 0 && i2.push(Ye(Ye({}, t3), {}, $({}, typeof e2.optionGroupChildren == "string" ? e2.optionGroupChildren : "items", Ue(r3))));
      }), this.flatOptions(i2);
    }
    return n2;
  }
  return t2;
}, hasSelectedOption: function() {
  return this.$filled;
}, label: function() {
  var e2 = this.findSelectedOptionIndex();
  return e2 === -1 ? this.placeholder || "p-emptylabel" : this.getOptionLabel(this.visibleOptions[e2]);
}, editableInputValue: function() {
  var e2 = this.findSelectedOptionIndex();
  return e2 === -1 ? this.d_value || "" : this.getOptionLabel(this.visibleOptions[e2]);
}, equalityKey: function() {
  return this.optionValue ? null : this.dataKey;
}, searchFields: function() {
  return this.filterFields || [this.optionLabel];
}, filterResultMessageText: function() {
  return F(this.visibleOptions) ? this.filterMessageText.replaceAll("{0}", this.visibleOptions.length) : this.emptyFilterMessageText;
}, filterMessageText: function() {
  return this.filterMessage || this.$primevue.config.locale.searchMessage || "";
}, emptyFilterMessageText: function() {
  return this.emptyFilterMessage || this.$primevue.config.locale.emptySearchMessage || this.$primevue.config.locale.emptyFilterMessage || "";
}, emptyMessageText: function() {
  return this.emptyMessage || this.$primevue.config.locale.emptyMessage || "";
}, selectionMessageText: function() {
  return this.selectionMessage || this.$primevue.config.locale.selectionMessage || "";
}, emptySelectionMessageText: function() {
  return this.emptySelectionMessage || this.$primevue.config.locale.emptySelectionMessage || "";
}, selectedMessageText: function() {
  return this.$filled ? this.selectionMessageText.replaceAll("{0}", "1") : this.emptySelectionMessageText;
}, focusedOptionId: function() {
  return this.focusedOptionIndex === -1 ? null : `${this.$id}_${this.focusedOptionIndex}`;
}, ariaSetSize: function() {
  var e2 = this;
  return this.visibleOptions.filter(function(t2) {
    return !e2.isOptionGroup(t2);
  }).length;
}, isClearIconVisible: function() {
  return this.showClear && this.d_value != null && !this.disabled && !this.loading;
}, virtualScrollerDisabled: function() {
  return !this.virtualScrollerOptions;
}, containerDataP: function() {
  return O($({ invalid: this.$invalid, disabled: this.disabled, focus: this.focused, fluid: this.$fluid, filled: this.$variant === "filled" }, this.size, this.size));
}, labelDataP: function() {
  return O($($({ placeholder: !this.editable && this.label === this.placeholder, clearable: this.showClear, disabled: this.disabled, editable: this.editable }, this.size, this.size), "empty", !this.editable && !this.$slots.value && (this.label === "p-emptylabel" || this.label.length === 0)));
}, dropdownIconDataP: function() {
  return O($({}, this.size, this.size));
}, overlayDataP: function() {
  return O($({}, "portal-" + this.appendTo, "portal-" + this.appendTo));
} }, directives: { ripple: se }, components: { InputText: he, VirtualScroller: X, Portal: de, InputIcon: _e, IconField: ge, TimesIcon: ue, ChevronDownIcon: U, SpinnerIcon: z, SearchIcon: G, CheckIcon: fe, BlankIcon: V } };
var $e = ["id", "data-p"];
var et = ["name", "id", "value", "placeholder", "tabindex", "disabled", "aria-label", "aria-labelledby", "aria-expanded", "aria-controls", "aria-activedescendant", "aria-invalid", "data-p"];
var tt = ["name", "id", "tabindex", "aria-label", "aria-labelledby", "aria-expanded", "aria-controls", "aria-activedescendant", "aria-invalid", "aria-disabled", "data-p"];
var nt = ["data-p"];
var rt = ["id"];
var it = ["id"];
var at = ["id", "aria-label", "aria-selected", "aria-disabled", "aria-setsize", "aria-posinset", "onMousedown", "onMousemove", "data-p-selected", "data-p-focused", "data-p-disabled"];
function ot(S2, C2, ee2, w2, T2, E2) {
  var te2 = i("SpinnerIcon"), D2 = i("InputText"), O2 = i("SearchIcon"), k2 = i("InputIcon"), A2 = i("IconField"), j2 = i("CheckIcon"), M2 = i("BlankIcon"), N2 = i("VirtualScroller"), ne2 = i("Portal"), re2 = r("ripple");
  return n(), l("div", t({ ref: "container", id: S2.$id, class: S2.cx("root"), onClick: C2[12] ||= function() {
    return E2.onContainerClick && E2.onContainerClick.apply(E2, arguments);
  }, "data-p": E2.containerDataP }, S2.ptmi("root")), [S2.editable ? (n(), l("input", t({ key: 0, ref: "focusInput", name: S2.name, id: S2.labelId || S2.inputId, type: "text", class: [S2.cx("label"), S2.inputClass, S2.labelClass], style: [S2.inputStyle, S2.labelStyle], value: E2.editableInputValue, placeholder: S2.placeholder, tabindex: S2.disabled ? -1 : S2.tabindex, disabled: S2.disabled, autocomplete: "off", role: "combobox", "aria-label": S2.ariaLabel, "aria-labelledby": S2.ariaLabelledby, "aria-haspopup": "listbox", "aria-expanded": T2.overlayVisible, "aria-controls": T2.overlayVisible ? S2.$id + "_list" : void 0, "aria-activedescendant": T2.focused ? E2.focusedOptionId : void 0, "aria-invalid": S2.invalid || void 0, onFocus: C2[0] ||= function() {
    return E2.onFocus && E2.onFocus.apply(E2, arguments);
  }, onBlur: C2[1] ||= function() {
    return E2.onBlur && E2.onBlur.apply(E2, arguments);
  }, onKeydown: C2[2] ||= function() {
    return E2.onKeyDown && E2.onKeyDown.apply(E2, arguments);
  }, onInput: C2[3] ||= function() {
    return E2.onEditableInput && E2.onEditableInput.apply(E2, arguments);
  }, "data-p": E2.labelDataP }, S2.ptm("label")), null, 16, et)) : (n(), l("span", t({ key: 1, ref: "focusInput", name: S2.name, id: S2.labelId || S2.inputId, class: [S2.cx("label"), S2.inputClass, S2.labelClass], style: [S2.inputStyle, S2.labelStyle], tabindex: S2.disabled ? -1 : S2.tabindex, role: "combobox", "aria-label": S2.ariaLabel || (E2.label === "p-emptylabel" ? void 0 : E2.label), "aria-labelledby": S2.ariaLabelledby, "aria-haspopup": "listbox", "aria-expanded": T2.overlayVisible, "aria-controls": S2.$id + "_list", "aria-activedescendant": T2.focused ? E2.focusedOptionId : void 0, "aria-invalid": S2.invalid || void 0, "aria-disabled": S2.disabled, onFocus: C2[4] ||= function() {
    return E2.onFocus && E2.onFocus.apply(E2, arguments);
  }, onBlur: C2[5] ||= function() {
    return E2.onBlur && E2.onBlur.apply(E2, arguments);
  }, onKeydown: C2[6] ||= function() {
    return E2.onKeyDown && E2.onKeyDown.apply(E2, arguments);
  }, "data-p": E2.labelDataP }, S2.ptm("label")), [e(S2.$slots, "value", { value: S2.d_value, placeholder: S2.placeholder }, function() {
    return [o(d(E2.label === "p-emptylabel" ? "\xA0" : E2.label ?? "empty"), 1)];
  })], 16, tt)), E2.isClearIconVisible ? e(S2.$slots, "clearicon", { key: 2, class: s(S2.cx("clearIcon")), clearCallback: E2.onClearClick }, function() {
    return [(n(), h(a(S2.clearIcon ? "i" : "TimesIcon"), t({ ref: "clearIcon", class: [S2.cx("clearIcon"), S2.clearIcon], onClick: E2.onClearClick }, S2.ptm("clearIcon"), { "data-pc-section": "clearicon" }), null, 16, ["class", "onClick"]))];
  }) : p("", !0), c("div", t({ class: S2.cx("dropdown") }, S2.ptm("dropdown")), [S2.loading ? e(S2.$slots, "loadingicon", { key: 0, class: s(S2.cx("loadingIcon")) }, function() {
    return [S2.loadingIcon ? (n(), l("span", t({ key: 0, class: [S2.cx("loadingIcon"), "pi-spin", S2.loadingIcon], "aria-hidden": "true" }, S2.ptm("loadingIcon")), null, 16)) : (n(), h(te2, t({ key: 1, class: S2.cx("loadingIcon"), spin: "", "aria-hidden": "true" }, S2.ptm("loadingIcon")), null, 16, ["class"]))];
  }) : e(S2.$slots, "dropdownicon", { key: 1, class: s(S2.cx("dropdownIcon")) }, function() {
    return [(n(), h(a(S2.dropdownIcon ? "span" : "ChevronDownIcon"), t({ class: [S2.cx("dropdownIcon"), S2.dropdownIcon], "aria-hidden": "true", "data-p": E2.dropdownIconDataP }, S2.ptm("dropdownIcon")), null, 16, ["class", "data-p"]))];
  })], 16), y(ne2, { appendTo: S2.appendTo }, { default: f(function() {
    return [y(x, t({ name: "p-anchored-overlay", onEnter: E2.onOverlayEnter, onAfterEnter: E2.onOverlayAfterEnter, onLeave: E2.onOverlayLeave, onAfterLeave: E2.onOverlayAfterLeave }, S2.ptm("transition")), { default: f(function() {
      return [T2.overlayVisible ? (n(), l("div", t({ key: 0, ref: E2.overlayRef, class: [S2.cx("overlay"), S2.panelClass, S2.overlayClass], style: [S2.panelStyle, S2.overlayStyle], onClick: C2[10] ||= function() {
        return E2.onOverlayClick && E2.onOverlayClick.apply(E2, arguments);
      }, onKeydown: C2[11] ||= function() {
        return E2.onOverlayKeyDown && E2.onOverlayKeyDown.apply(E2, arguments);
      }, "data-p": E2.overlayDataP }, S2.ptm("overlay")), [c("span", t({ ref: "firstHiddenFocusableElementOnOverlay", role: "presentation", "aria-hidden": "true", class: "p-hidden-accessible p-hidden-focusable", tabindex: 0, onFocus: C2[7] ||= function() {
        return E2.onFirstHiddenFocus && E2.onFirstHiddenFocus.apply(E2, arguments);
      } }, S2.ptm("hiddenFirstFocusableEl"), { "data-p-hidden-accessible": !0, "data-p-hidden-focusable": !0 }), null, 16), e(S2.$slots, "header", { value: S2.d_value, options: E2.visibleOptions }), S2.filter ? (n(), l("div", t({ key: 0, class: S2.cx("header") }, S2.ptm("header")), [y(A2, { unstyled: S2.unstyled, pt: S2.ptm("pcFilterContainer") }, { default: f(function() {
        return [y(D2, { ref: "filterInput", type: "text", value: T2.filterValue, onVnodeMounted: E2.onFilterUpdated, onVnodeUpdated: E2.onFilterUpdated, class: s(S2.cx("pcFilter")), placeholder: S2.filterPlaceholder, variant: S2.variant, unstyled: S2.unstyled, role: "searchbox", autocomplete: "off", "aria-owns": S2.$id + "_list", "aria-activedescendant": E2.focusedOptionId, onKeydown: E2.onFilterKeyDown, onBlur: E2.onFilterBlur, onInput: E2.onFilterChange, pt: S2.ptm("pcFilter"), formControl: { novalidate: !0 } }, null, 8, ["value", "onVnodeMounted", "onVnodeUpdated", "class", "placeholder", "variant", "unstyled", "aria-owns", "aria-activedescendant", "onKeydown", "onBlur", "onInput", "pt"]), y(k2, { unstyled: S2.unstyled, pt: S2.ptm("pcFilterIconContainer") }, { default: f(function() {
          return [e(S2.$slots, "filtericon", {}, function() {
            return [S2.filterIcon ? (n(), l("span", t({ key: 0, class: S2.filterIcon }, S2.ptm("filterIcon")), null, 16)) : (n(), h(O2, m(t({ key: 1 }, S2.ptm("filterIcon"))), null, 16))];
          })];
        }), _: 3 }, 8, ["unstyled", "pt"])];
      }), _: 3 }, 8, ["unstyled", "pt"]), c("span", t({ role: "status", "aria-live": "polite", class: "p-hidden-accessible" }, S2.ptm("hiddenFilterResult"), { "data-p-hidden-accessible": !0 }), d(E2.filterResultMessageText), 17)], 16)) : p("", !0), c("div", t({ class: S2.cx("listContainer"), style: { "max-height": E2.virtualScrollerDisabled ? S2.scrollHeight : "" } }, S2.ptm("listContainer")), [y(N2, t({ ref: E2.virtualScrollerRef }, S2.virtualScrollerOptions, { items: E2.visibleOptions, style: { height: S2.scrollHeight }, tabindex: -1, disabled: E2.virtualScrollerDisabled, pt: S2.ptm("virtualScroller") }), v({ content: f(function(r2) {
        var i2 = r2.styleClass, a2 = r2.contentRef, s2 = r2.items, f2 = r2.getItemOptions, m2 = r2.contentStyle, v2 = r2.itemSize;
        return [c("ul", t({ ref: function(e2) {
          return E2.listRef(e2, a2);
        }, id: S2.$id + "_list", class: [S2.cx("list"), i2], style: m2, role: "listbox" }, S2.ptm("list")), [(n(!0), l(u, null, g(s2, function(r3, i3) {
          return n(), l(u, { key: E2.getOptionRenderKey(r3, E2.getOptionIndex(i3, f2)) }, [E2.isOptionGroup(r3) ? (n(), l("li", t({ key: 0, id: S2.$id + "_" + E2.getOptionIndex(i3, f2), style: { height: v2 ? v2 + "px" : void 0 }, class: S2.cx("optionGroup"), role: "option" }, { ref_for: !0 }, S2.ptm("optionGroup")), [e(S2.$slots, "optiongroup", { option: r3.optionGroup, index: E2.getOptionIndex(i3, f2) }, function() {
            return [c("span", t({ class: S2.cx("optionGroupLabel") }, { ref_for: !0 }, S2.ptm("optionGroupLabel")), d(E2.getOptionGroupLabel(r3.optionGroup)), 17)];
          })], 16, it)) : _((n(), l("li", t({ key: 1, id: S2.$id + "_" + E2.getOptionIndex(i3, f2), class: S2.cx("option", { option: r3, focusedOption: E2.getOptionIndex(i3, f2) }), style: { height: v2 ? v2 + "px" : void 0 }, role: "option", "aria-label": E2.getOptionLabel(r3), "aria-selected": E2.isSelected(r3), "aria-disabled": E2.isOptionDisabled(r3), "aria-setsize": E2.ariaSetSize, "aria-posinset": E2.getAriaPosInset(E2.getOptionIndex(i3, f2)), onMousedown: function(e2) {
            return E2.onOptionSelect(e2, r3);
          }, onMousemove: function(e2) {
            return E2.onOptionMouseMove(e2, E2.getOptionIndex(i3, f2));
          }, onClick: C2[8] ||= b(function() {
          }, ["stop"]), "data-p-selected": !S2.checkmark && E2.isSelected(r3), "data-p-focused": T2.focusedOptionIndex === E2.getOptionIndex(i3, f2), "data-p-disabled": E2.isOptionDisabled(r3) }, { ref_for: !0 }, E2.getPTItemOptions(r3, f2, i3, "option")), [S2.checkmark ? (n(), l(u, { key: 0 }, [E2.isSelected(r3) ? (n(), h(j2, t({ key: 0, class: S2.cx("optionCheckIcon") }, { ref_for: !0 }, S2.ptm("optionCheckIcon")), null, 16, ["class"])) : (n(), h(M2, t({ key: 1, class: S2.cx("optionBlankIcon") }, { ref_for: !0 }, S2.ptm("optionBlankIcon")), null, 16, ["class"]))], 64)) : p("", !0), e(S2.$slots, "option", { option: r3, selected: E2.isSelected(r3), index: E2.getOptionIndex(i3, f2) }, function() {
            return [c("span", t({ class: S2.cx("optionLabel") }, { ref_for: !0 }, S2.ptm("optionLabel")), d(E2.getOptionLabel(r3)), 17)];
          })], 16, at)), [[re2]])], 64);
        }), 128)), T2.filterValue && (!s2 || s2 && s2.length === 0) ? (n(), l("li", t({ key: 0, class: S2.cx("emptyMessage"), role: "option" }, S2.ptm("emptyMessage"), { "data-p-hidden-accessible": !0 }), [e(S2.$slots, "emptyfilter", {}, function() {
          return [o(d(E2.emptyFilterMessageText), 1)];
        })], 16)) : !S2.options || S2.options && S2.options.length === 0 ? (n(), l("li", t({ key: 1, class: S2.cx("emptyMessage"), role: "option" }, S2.ptm("emptyMessage"), { "data-p-hidden-accessible": !0 }), [e(S2.$slots, "empty", {}, function() {
          return [o(d(E2.emptyMessageText), 1)];
        })], 16)) : p("", !0)], 16, rt)];
      }), _: 2 }, [S2.$slots.loader ? { name: "loader", fn: f(function(t2) {
        var n2 = t2.options;
        return [e(S2.$slots, "loader", { options: n2 })];
      }), key: "0" } : void 0]), 1040, ["items", "style", "disabled", "pt"])], 16), e(S2.$slots, "footer", { value: S2.d_value, options: E2.visibleOptions }), !S2.options || S2.options && S2.options.length === 0 ? (n(), l("span", t({ key: 1, role: "status", "aria-live": "polite", class: "p-hidden-accessible" }, S2.ptm("hiddenEmptyMessage"), { "data-p-hidden-accessible": !0 }), d(E2.emptyMessageText), 17)) : p("", !0), c("span", t({ role: "status", "aria-live": "polite", class: "p-hidden-accessible" }, S2.ptm("hiddenSelectedMessage"), { "data-p-hidden-accessible": !0 }), d(E2.selectedMessageText), 17), c("span", t({ ref: "lastHiddenFocusableElementOnOverlay", role: "presentation", "aria-hidden": "true", class: "p-hidden-accessible p-hidden-focusable", tabindex: 0, onFocus: C2[9] ||= function() {
        return E2.onLastHiddenFocus && E2.onLastHiddenFocus.apply(E2, arguments);
      } }, S2.ptm("hiddenLastFocusableEl"), { "data-p-hidden-accessible": !0, "data-p-hidden-focusable": !0 }), null, 16)], 16, nt)) : p("", !0)];
    }), _: 3 }, 16, ["onEnter", "onAfterEnter", "onLeave", "onAfterLeave"])];
  }), _: 3 }, 8, ["appendTo"])], 16, $e);
}
Qe.render = ot;
export {U as i,X as n,G as r,Qe as t};