import {J as e,P as t,W as n,X as r,Y as i,Z as a,b as o,d as s,en as c,f as l,h as u,i as d,in as f,lt as p,m,p as h,ut as g,x as _} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as v} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {I as y,K as ee,L as b,N as x,W as S,X as C,k as w,s as T,t as te,w as E,z as D} from "./basecomponent-ClhuVxJN.js";
import {s as O} from "./dist-DPswMdzV.js";
import {t as k} from "./baseicon-Z_5Hqu9u.js";
import {t as A} from "./zindex-cO8iUN-n.js";
import {t as j} from "./ripple-DKjDc6yC.js";
import {t as ne} from "./focustrap-DJJkEqE8.js";
import {t as re} from "./button-BKeo7L17.js";
import {t as ie} from "./style-wQ8fEiAg.js";
import {t as ae} from "./times-NAtDB1bj.js";
import {t as M} from "./portal-Cm1Im7J-.js";
var N = { name: "WindowMaximizeIcon", extends: k };
function P(e2) {
  return R(e2) || L(e2) || I(e2) || F();
}
function F() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function I(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return z(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? z(e2, t2) : void 0;
  }
}
function L(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function R(e2) {
  if (Array.isArray(e2)) return z(e2);
}
function z(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function B(e2, r2, i2, a2, o2, s2) {
  return n(), u("svg", t({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, e2.pti()), P(r2[0] ||= [l("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M7 14H11.8C12.3835 14 12.9431 13.7682 13.3556 13.3556C13.7682 12.9431 14 12.3835 14 11.8V2.2C14 1.61652 13.7682 1.05694 13.3556 0.644365C12.9431 0.231785 12.3835 0 11.8 0H2.2C1.61652 0 1.05694 0.231785 0.644365 0.644365C0.231785 1.05694 0 1.61652 0 2.2V7C0 7.15913 0.063214 7.31174 0.175736 7.42426C0.288258 7.53679 0.44087 7.6 0.6 7.6C0.75913 7.6 0.911742 7.53679 1.02426 7.42426C1.13679 7.31174 1.2 7.15913 1.2 7V2.2C1.2 1.93478 1.30536 1.68043 1.49289 1.49289C1.68043 1.30536 1.93478 1.2 2.2 1.2H11.8C12.0652 1.2 12.3196 1.30536 12.5071 1.49289C12.6946 1.68043 12.8 1.93478 12.8 2.2V11.8C12.8 12.0652 12.6946 12.3196 12.5071 12.5071C12.3196 12.6946 12.0652 12.8 11.8 12.8H7C6.84087 12.8 6.68826 12.8632 6.57574 12.9757C6.46321 13.0883 6.4 13.2409 6.4 13.4C6.4 13.5591 6.46321 13.7117 6.57574 13.8243C6.68826 13.9368 6.84087 14 7 14ZM9.77805 7.42192C9.89013 7.534 10.0415 7.59788 10.2 7.59995C10.3585 7.59788 10.5099 7.534 10.622 7.42192C10.7341 7.30985 10.798 7.15844 10.8 6.99995V3.94242C10.8066 3.90505 10.8096 3.86689 10.8089 3.82843C10.8079 3.77159 10.7988 3.7157 10.7824 3.6623C10.756 3.55552 10.701 3.45698 10.622 3.37798C10.5099 3.2659 10.3585 3.20202 10.2 3.19995H7.00002C6.84089 3.19995 6.68828 3.26317 6.57576 3.37569C6.46324 3.48821 6.40002 3.64082 6.40002 3.79995C6.40002 3.95908 6.46324 4.11169 6.57576 4.22422C6.68828 4.33674 6.84089 4.39995 7.00002 4.39995H8.80006L6.19997 7.00005C6.10158 7.11005 6.04718 7.25246 6.04718 7.40005C6.04718 7.54763 6.10158 7.69004 6.19997 7.80005C6.30202 7.91645 6.44561 7.98824 6.59997 8.00005C6.75432 7.98824 6.89791 7.91645 6.99997 7.80005L9.60002 5.26841V6.99995C9.6021 7.15844 9.66598 7.30985 9.77805 7.42192ZM1.4 14H3.8C4.17066 13.9979 4.52553 13.8498 4.78763 13.5877C5.04973 13.3256 5.1979 12.9707 5.2 12.6V10.2C5.1979 9.82939 5.04973 9.47452 4.78763 9.21242C4.52553 8.95032 4.17066 8.80215 3.8 8.80005H1.4C1.02934 8.80215 0.674468 8.95032 0.412371 9.21242C0.150274 9.47452 0.00210008 9.82939 0 10.2V12.6C0.00210008 12.9707 0.150274 13.3256 0.412371 13.5877C0.674468 13.8498 1.02934 13.9979 1.4 14ZM1.25858 10.0586C1.29609 10.0211 1.34696 10 1.4 10H3.8C3.85304 10 3.90391 10.0211 3.94142 10.0586C3.97893 10.0961 4 10.147 4 10.2V12.6C4 12.6531 3.97893 12.704 3.94142 12.7415C3.90391 12.779 3.85304 12.8 3.8 12.8H1.4C1.34696 12.8 1.29609 12.779 1.25858 12.7415C1.22107 12.704 1.2 12.6531 1.2 12.6V10.2C1.2 10.147 1.22107 10.0961 1.25858 10.0586Z", fill: "currentColor" }, null, -1)]), 16);
}
N.render = B;
var V = { name: "WindowMinimizeIcon", extends: k };
function H(e2) {
  return K(e2) || G(e2) || W(e2) || U();
}
function U() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function W(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return q(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? q(e2, t2) : void 0;
  }
}
function G(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function K(e2) {
  if (Array.isArray(e2)) return q(e2);
}
function q(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function oe(e2, r2, i2, a2, o2, s2) {
  return n(), u("svg", t({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, e2.pti()), H(r2[0] ||= [l("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M11.8 0H2.2C1.61652 0 1.05694 0.231785 0.644365 0.644365C0.231785 1.05694 0 1.61652 0 2.2V7C0 7.15913 0.063214 7.31174 0.175736 7.42426C0.288258 7.53679 0.44087 7.6 0.6 7.6C0.75913 7.6 0.911742 7.53679 1.02426 7.42426C1.13679 7.31174 1.2 7.15913 1.2 7V2.2C1.2 1.93478 1.30536 1.68043 1.49289 1.49289C1.68043 1.30536 1.93478 1.2 2.2 1.2H11.8C12.0652 1.2 12.3196 1.30536 12.5071 1.49289C12.6946 1.68043 12.8 1.93478 12.8 2.2V11.8C12.8 12.0652 12.6946 12.3196 12.5071 12.5071C12.3196 12.6946 12.0652 12.8 11.8 12.8H7C6.84087 12.8 6.68826 12.8632 6.57574 12.9757C6.46321 13.0883 6.4 13.2409 6.4 13.4C6.4 13.5591 6.46321 13.7117 6.57574 13.8243C6.68826 13.9368 6.84087 14 7 14H11.8C12.3835 14 12.9431 13.7682 13.3556 13.3556C13.7682 12.9431 14 12.3835 14 11.8V2.2C14 1.61652 13.7682 1.05694 13.3556 0.644365C12.9431 0.231785 12.3835 0 11.8 0ZM6.368 7.952C6.44137 7.98326 6.52025 7.99958 6.6 8H9.8C9.95913 8 10.1117 7.93678 10.2243 7.82426C10.3368 7.71174 10.4 7.55913 10.4 7.4C10.4 7.24087 10.3368 7.08826 10.2243 6.97574C10.1117 6.86321 9.95913 6.8 9.8 6.8H8.048L10.624 4.224C10.73 4.11026 10.7877 3.95982 10.7849 3.80438C10.7822 3.64894 10.7192 3.50063 10.6093 3.3907C10.4994 3.28077 10.3511 3.2178 10.1956 3.21506C10.0402 3.21232 9.88974 3.27002 9.776 3.376L7.2 5.952V4.2C7.2 4.04087 7.13679 3.88826 7.02426 3.77574C6.91174 3.66321 6.75913 3.6 6.6 3.6C6.44087 3.6 6.28826 3.66321 6.17574 3.77574C6.06321 3.88826 6 4.04087 6 4.2V7.4C6.00042 7.47975 6.01674 7.55862 6.048 7.632C6.07656 7.70442 6.11971 7.7702 6.17475 7.82524C6.2298 7.88029 6.29558 7.92344 6.368 7.952ZM1.4 8.80005H3.8C4.17066 8.80215 4.52553 8.95032 4.78763 9.21242C5.04973 9.47452 5.1979 9.82939 5.2 10.2V12.6C5.1979 12.9707 5.04973 13.3256 4.78763 13.5877C4.52553 13.8498 4.17066 13.9979 3.8 14H1.4C1.02934 13.9979 0.674468 13.8498 0.412371 13.5877C0.150274 13.3256 0.00210008 12.9707 0 12.6V10.2C0.00210008 9.82939 0.150274 9.47452 0.412371 9.21242C0.674468 8.95032 1.02934 8.80215 1.4 8.80005ZM3.94142 12.7415C3.97893 12.704 4 12.6531 4 12.6V10.2C4 10.147 3.97893 10.0961 3.94142 10.0586C3.90391 10.0211 3.85304 10 3.8 10H1.4C1.34696 10 1.29609 10.0211 1.25858 10.0586C1.22107 10.0961 1.2 10.147 1.2 10.2V12.6C1.2 12.6531 1.22107 12.704 1.25858 12.7415C1.29609 12.779 1.34696 12.8 1.4 12.8H3.8C3.85304 12.8 3.90391 12.779 3.94142 12.7415Z", fill: "currentColor" }, null, -1)]), 16);
}
V.render = oe;
function J() {
  S({ variableName: O("scrollbar.width").name });
}
function Y() {
  b({ variableName: O("scrollbar.width").name });
}
var X = { name: "Dialog", extends: { name: "BaseDialog", extends: te, props: { header: { type: null, default: null }, footer: { type: null, default: null }, visible: { type: Boolean, default: !1 }, modal: { type: Boolean, default: null }, contentStyle: { type: null, default: null }, contentClass: { type: String, default: null }, contentProps: { type: null, default: null }, maximizable: { type: Boolean, default: !1 }, dismissableMask: { type: Boolean, default: !1 }, closable: { type: Boolean, default: !0 }, closeOnEscape: { type: Boolean, default: !0 }, showHeader: { type: Boolean, default: !0 }, blockScroll: { type: Boolean, default: !1 }, baseZIndex: { type: Number, default: 0 }, autoZIndex: { type: Boolean, default: !0 }, position: { type: String, default: "center" }, breakpoints: { type: Object, default: null }, draggable: { type: Boolean, default: !0 }, keepInViewport: { type: Boolean, default: !0 }, minX: { type: Number, default: 0 }, minY: { type: Number, default: 0 }, appendTo: { type: [String, Object], default: "body" }, closeIcon: { type: String, default: void 0 }, maximizeIcon: { type: String, default: void 0 }, minimizeIcon: { type: String, default: void 0 }, closeButtonProps: { type: Object, default: function() {
  return { severity: "secondary", text: !0, rounded: !0 };
} }, maximizeButtonProps: { type: Object, default: function() {
  return { severity: "secondary", text: !0, rounded: !0 };
} }, _instance: null }, style: ie, provide: function() {
  return { $pcDialog: this, $parentInstance: this };
} }, inheritAttrs: !1, emits: ["update:visible", "show", "hide", "after-hide", "maximize", "unmaximize", "dragstart", "dragend"], provide: function() {
  var e2 = this;
  return { dialogRef: s(function() {
    return e2._instance;
  }) };
}, data: function() {
  return { containerVisible: this.visible, maximized: !1, focusableMax: null, focusableClose: null, target: null };
}, documentKeydownListener: null, container: null, mask: null, content: null, headerContainer: null, footerContainer: null, maximizableButton: null, closeButton: null, styleElement: null, dragging: null, documentDragListener: null, documentDragEndListener: null, lastPageX: null, lastPageY: null, maskMouseDownTarget: null, updated: function() {
  this.visible && (this.containerVisible = this.visible);
}, beforeUnmount: function() {
  this.unbindDocumentState(), this.unbindGlobalListeners(), this.destroyStyle(), this.mask && this.autoZIndex && A.clear(this.mask), this.container = null, this.mask = null;
}, mounted: function() {
  this.breakpoints && this.createStyle();
}, methods: { close: function() {
  this.$emit("update:visible", !1);
}, onEnter: function() {
  this.$emit("show"), this.target = document.activeElement, this.enableDocumentSettings(), this.bindGlobalListeners(), this.autoZIndex && A.set("modal", this.mask, this.baseZIndex || this.$primevue.config.zIndex.modal);
}, onAfterEnter: function() {
  this.focus();
}, onBeforeLeave: function() {
  this.modal && !this.isUnstyled && w(this.mask, "p-overlay-mask-leave-active"), this.dragging && this.documentDragEndListener && this.documentDragEndListener();
}, onLeave: function() {
  this.$emit("hide"), y(this.target), this.target = null, this.focusableClose = null, this.focusableMax = null;
}, onAfterLeave: function() {
  this.autoZIndex && A.clear(this.mask), this.containerVisible = !1, this.unbindDocumentState(), this.unbindGlobalListeners(), this.$emit("after-hide");
}, onMaskMouseDown: function(e2) {
  this.maskMouseDownTarget = e2.target;
}, onMaskMouseUp: function() {
  this.dismissableMask && this.modal && this.mask === this.maskMouseDownTarget && this.close();
}, focus: function() {
  var e2 = function(e3) {
    return e3 && e3.querySelector("[autofocus]");
  }, t2 = this.$slots.footer && e2(this.footerContainer);
  t2 || (t2 = this.$slots.header && e2(this.headerContainer), t2 || (t2 = this.$slots.default && e2(this.content), t2 || (this.maximizable ? (this.focusableMax = !0, t2 = this.maximizableButton) : (this.focusableClose = !0, t2 = this.closeButton)))), t2 && y(t2, { focusVisible: !0 });
}, maximize: function(e2) {
  this.maximized ? (this.maximized = !1, this.$emit("unmaximize", e2)) : (this.maximized = !0, this.$emit("maximize", e2)), this.modal || (this.maximized ? J() : Y());
}, enableDocumentSettings: function() {
  (this.modal || !this.modal && this.blockScroll || this.maximizable && this.maximized) && J();
}, unbindDocumentState: function() {
  (this.modal || !this.modal && this.blockScroll || this.maximizable && this.maximized) && Y();
}, onKeyDown: function(e2) {
  e2.code === "Escape" && this.closeOnEscape && !e2.isComposing && this.close();
}, bindDocumentKeyDownListener: function() {
  this.documentKeydownListener || (this.documentKeydownListener = this.onKeyDown.bind(this), window.document.addEventListener("keydown", this.documentKeydownListener));
}, unbindDocumentKeyDownListener: function() {
  this.documentKeydownListener &&= (window.document.removeEventListener("keydown", this.documentKeydownListener), null);
}, containerRef: function(e2) {
  this.container = e2;
}, maskRef: function(e2) {
  this.mask = e2;
}, contentRef: function(e2) {
  this.content = e2;
}, headerContainerRef: function(e2) {
  this.headerContainer = e2;
}, footerContainerRef: function(e2) {
  this.footerContainer = e2;
}, maximizableRef: function(e2) {
  this.maximizableButton = e2 ? e2.$el : void 0;
}, closeButtonRef: function(e2) {
  this.closeButton = e2 ? e2.$el : void 0;
}, createStyle: function() {
  if (!this.styleElement && !this.isUnstyled) {
    var e2;
    this.styleElement = document.createElement("style"), this.styleElement.type = "text/css", x(this.styleElement, "nonce", (e2 = this.$primevue) == null || (e2 = e2.config) == null || (e2 = e2.csp) == null ? void 0 : e2.nonce), document.head.appendChild(this.styleElement);
    var t2 = "";
    for (var n2 in this.breakpoints) t2 += `
                        @media screen and (max-width: ${n2}) {
                            .p-dialog[${this.$attrSelector}] {
                                width: ${this.breakpoints[n2]} !important;
                            }
                        }
                    `;
    this.styleElement.innerHTML = t2;
  }
}, destroyStyle: function() {
  this.styleElement &&= (document.head.removeChild(this.styleElement), null);
}, initDrag: function(e2) {
  e2.target.closest("div").getAttribute("data-pc-section") !== "headeractions" && this.draggable && (this.dragging = !0, this.lastPageX = e2.pageX, this.lastPageY = e2.pageY, this.container.style.margin = "0", document.body.setAttribute("data-p-unselectable-text", "true"), !this.isUnstyled && E(document.body, { "user-select": "none" }), this.$emit("dragstart", e2));
}, bindGlobalListeners: function() {
  this.draggable && (this.bindDocumentDragListener(), this.bindDocumentDragEndListener()), this.closeOnEscape && this.bindDocumentKeyDownListener();
}, unbindGlobalListeners: function() {
  this.unbindDocumentDragListener(), this.unbindDocumentDragEndListener(), this.unbindDocumentKeyDownListener();
}, bindDocumentDragListener: function() {
  var e2 = this;
  this.documentDragListener = function(t2) {
    if (e2.dragging) {
      var n2 = ee(e2.container), r2 = T(e2.container), i2 = t2.pageX - e2.lastPageX, a2 = t2.pageY - e2.lastPageY, o2 = e2.container.getBoundingClientRect(), s2 = o2.left + i2, c2 = o2.top + a2, l2 = D(), u2 = getComputedStyle(e2.container), d2 = parseFloat(u2.marginLeft), f2 = parseFloat(u2.marginTop);
      e2.container.style.position = "fixed", e2.keepInViewport ? (s2 >= e2.minX && s2 + n2 < l2.width && (e2.lastPageX = t2.pageX, e2.container.style.left = s2 - d2 + "px"), c2 >= e2.minY && c2 + r2 < l2.height && (e2.lastPageY = t2.pageY, e2.container.style.top = c2 - f2 + "px")) : (e2.lastPageX = t2.pageX, e2.container.style.left = s2 - d2 + "px", e2.lastPageY = t2.pageY, e2.container.style.top = c2 - f2 + "px");
    }
  }, window.document.addEventListener("mousemove", this.documentDragListener);
}, unbindDocumentDragListener: function() {
  this.documentDragListener &&= (window.document.removeEventListener("mousemove", this.documentDragListener), null);
}, bindDocumentDragEndListener: function() {
  var e2 = this;
  this.documentDragEndListener = function(t2) {
    e2.dragging && (e2.dragging = !1, document.body.removeAttribute("data-p-unselectable-text"), !e2.isUnstyled && (document.body.style["user-select"] = ""), e2.$emit("dragend", t2));
  }, window.document.addEventListener("mouseup", this.documentDragEndListener);
}, unbindDocumentDragEndListener: function() {
  this.documentDragEndListener &&= (window.document.removeEventListener("mouseup", this.documentDragEndListener), null);
} }, computed: { maximizeIconComponent: function() {
  return this.maximized ? this.minimizeIcon ? "span" : "WindowMinimizeIcon" : this.maximizeIcon ? "span" : "WindowMaximizeIcon";
}, ariaLabelledById: function() {
  return this.header != null || this.$attrs["aria-labelledby"] !== null ? this.$id + "_header" : null;
}, closeAriaLabel: function() {
  return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria.close : void 0;
}, dataP: function() {
  return C({ maximized: this.maximized, modal: this.modal });
} }, directives: { ripple: j, focustrap: ne }, components: { Button: re, Portal: M, WindowMinimizeIcon: V, WindowMaximizeIcon: N, TimesIcon: ae } };
function Z(e2) {
  "@babel/helpers - typeof";
  return Z = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, Z(e2);
}
function Q(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function $(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? Q(Object(n2), !0).forEach(function(t3) {
      se(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : Q(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function se(e2, t2, n2) {
  return (t2 = ce(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function ce(e2) {
  var t2 = le(e2, "string");
  return Z(t2) == "symbol" ? t2 : t2 + "";
}
function le(e2, t2) {
  if (Z(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (Z(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var ue = ["data-p"];
var de = ["aria-labelledby", "aria-modal", "data-p"];
var fe = ["id"];
var pe = ["data-p"];
function me(s2, y2, ee2, b2, x2, S2) {
  var C2 = i("Button"), w2 = i("Portal"), T2 = r("focustrap");
  return n(), h(w2, { appendTo: s2.appendTo }, { default: p(function() {
    return [x2.containerVisible ? (n(), u("div", t({ key: 0, ref: S2.maskRef, class: s2.cx("mask"), style: s2.sx("mask", !0, { position: s2.position, modal: s2.modal }), onMousedown: y2[1] ||= function() {
      return S2.onMaskMouseDown && S2.onMaskMouseDown.apply(S2, arguments);
    }, onMouseup: y2[2] ||= function() {
      return S2.onMaskMouseUp && S2.onMaskMouseUp.apply(S2, arguments);
    }, "data-p": S2.dataP }, s2.ptm("mask")), [_(v, t({ name: "p-dialog", onEnter: S2.onEnter, onAfterEnter: S2.onAfterEnter, onBeforeLeave: S2.onBeforeLeave, onLeave: S2.onLeave, onAfterLeave: S2.onAfterLeave, appear: "" }, s2.ptm("transition")), { default: p(function() {
      return [s2.visible ? g((n(), u("div", t({ key: 0, ref: S2.containerRef, class: s2.cx("root"), style: s2.sx("root"), role: "dialog", "aria-labelledby": S2.ariaLabelledById, "aria-modal": s2.modal, "data-p": S2.dataP }, s2.ptmi("root")), [s2.$slots.container ? e(s2.$slots, "container", { key: 0, closeCallback: S2.close, maximizeCallback: function(e2) {
        return S2.maximize(e2);
      }, initDragCallback: S2.initDrag }) : (n(), u(d, { key: 1 }, [s2.showHeader ? (n(), u("div", t({ key: 0, ref: S2.headerContainerRef, class: s2.cx("header"), onMousedown: y2[0] ||= function() {
        return S2.initDrag && S2.initDrag.apply(S2, arguments);
      } }, s2.ptm("header")), [e(s2.$slots, "header", { class: c(s2.cx("title")) }, function() {
        return [s2.header ? (n(), u("span", t({ key: 0, id: S2.ariaLabelledById, class: s2.cx("title") }, s2.ptm("title")), f(s2.header), 17, fe)) : m("", !0)];
      }), l("div", t({ class: s2.cx("headerActions") }, s2.ptm("headerActions")), [s2.maximizable ? e(s2.$slots, "maximizebutton", { key: 0, maximized: x2.maximized, maximizeCallback: function(e2) {
        return S2.maximize(e2);
      } }, function() {
        return [_(C2, t({ ref: S2.maximizableRef, autofocus: x2.focusableMax, class: s2.cx("pcMaximizeButton"), onClick: S2.maximize, tabindex: s2.maximizable ? "0" : "-1", unstyled: s2.unstyled }, s2.maximizeButtonProps, { pt: s2.ptm("pcMaximizeButton"), "data-pc-group-section": "headericon" }), { icon: p(function(r2) {
          return [e(s2.$slots, "maximizeicon", { maximized: x2.maximized }, function() {
            return [(n(), h(a(S2.maximizeIconComponent), t({ class: [r2.class, x2.maximized ? s2.minimizeIcon : s2.maximizeIcon] }, s2.ptm("pcMaximizeButton").icon), null, 16, ["class"]))];
          })];
        }), _: 3 }, 16, ["autofocus", "class", "onClick", "tabindex", "unstyled", "pt"])];
      }) : m("", !0), s2.closable ? e(s2.$slots, "closebutton", { key: 1, closeCallback: S2.close }, function() {
        return [_(C2, t({ ref: S2.closeButtonRef, autofocus: x2.focusableClose, class: s2.cx("pcCloseButton"), onClick: S2.close, "aria-label": S2.closeAriaLabel, unstyled: s2.unstyled }, s2.closeButtonProps, { pt: s2.ptm("pcCloseButton"), "data-pc-group-section": "headericon" }), { icon: p(function(r2) {
          return [e(s2.$slots, "closeicon", {}, function() {
            return [(n(), h(a(s2.closeIcon ? "span" : "TimesIcon"), t({ class: [s2.closeIcon, r2.class] }, s2.ptm("pcCloseButton").icon), null, 16, ["class"]))];
          })];
        }), _: 3 }, 16, ["autofocus", "class", "onClick", "aria-label", "unstyled", "pt"])];
      }) : m("", !0)], 16)], 16)) : m("", !0), l("div", t({ ref: S2.contentRef, class: [s2.cx("content"), s2.contentClass], style: s2.contentStyle, "data-p": S2.dataP }, $($({}, s2.contentProps), s2.ptm("content"))), [e(s2.$slots, "default")], 16, pe), s2.footer || s2.$slots.footer ? (n(), u("div", t({ key: 1, ref: S2.footerContainerRef, class: s2.cx("footer") }, s2.ptm("footer")), [e(s2.$slots, "footer", {}, function() {
        return [o(f(s2.footer), 1)];
      })], 16)) : m("", !0)], 64))], 16, de)), [[T2, { disabled: !s2.modal }]]) : m("", !0)];
    }), _: 3 }, 16, ["onEnter", "onAfterEnter", "onBeforeLeave", "onLeave", "onAfterLeave"])], 16, ue)) : m("", !0)];
  }), _: 3 }, 8, ["appendTo"]);
}
X.render = me;
export {J as n,Y as r,X as t};