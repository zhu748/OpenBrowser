// PrimeVue drawer used by the workbench renderer.
import { J as u, P as d, W as m, X as h, Y as g, Z as _, en as x, f as S, h as C, i as w, in as T, lt as D, m as O, p as k, ut as M, x as F } from "./runtime-core.esm-bundler-CBj16o9G.js";
import { t as z } from "./runtime-dom.esm-bundler-_WxS4Zar.js";




import { I as ne, X as re, k as ae, t as oe } from "./basecomponent-ClhuVxJN.js";

import { t as W } from "./zindex-cO8iUN-n.js";

import { t as K } from "./focustrap-DJJkEqE8.js";
import { t as q } from "./button-BKeo7L17.js";
import { t as se } from "./style-DXn2Xqzj.js";
import { t as ce } from "./times-NAtDB1bj.js";
import { n as le, r as ue } from "./dialog-CrBr3eoy.js";
import { t as de } from "./portal-Cm1Im7J-.js";






var _e = { name: "BaseDrawer", extends: oe, props: { visible: { type: Boolean, default: !1 }, position: { type: String, default: "left" }, header: { type: null, default: null }, baseZIndex: { type: Number, default: 0 }, autoZIndex: { type: Boolean, default: !0 }, dismissable: { type: Boolean, default: !0 }, showCloseIcon: { type: Boolean, default: !0 }, closeButtonProps: { type: Object, default: function() {
  return { severity: "secondary", text: !0, rounded: !0 };
} }, closeIcon: { type: String, default: void 0 }, modal: { type: Boolean, default: !0 }, blockScroll: { type: Boolean, default: !1 }, closeOnEscape: { type: Boolean, default: !0 } }, style: se, provide: function() {
  return { $pcDrawer: this, $parentInstance: this };
} };
function Y(e2) {
  "@babel/helpers - typeof";
  return Y = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, Y(e2);
}
function X(e2, t2, n2) {
  return (t2 = ve(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function ve(e2) {
  var t2 = ye(e2, "string");
  return Y(t2) == "symbol" ? t2 : t2 + "";
}
function ye(e2, t2) {
  if (Y(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (Y(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var Z = { name: "Drawer", extends: _e, inheritAttrs: !1, emits: ["update:visible", "show", "after-show", "hide", "after-hide", "before-hide"], data: function() {
  return { containerVisible: this.visible };
}, container: null, mask: null, content: null, headerContainer: null, footerContainer: null, closeButton: null, outsideClickListener: null, documentKeydownListener: null, watch: { dismissable: function(e2) {
  e2 && !this.modal ? this.bindOutsideClickListener() : this.unbindOutsideClickListener();
} }, updated: function() {
  this.visible && (this.containerVisible = this.visible);
}, beforeUnmount: function() {
  this.disableDocumentSettings(), this.mask && this.autoZIndex && W.clear(this.mask), this.container = null, this.mask = null;
}, methods: { hide: function() {
  this.$emit("update:visible", !1);
}, onEnter: function() {
  this.$emit("show"), this.focus(), this.bindDocumentKeyDownListener(), this.autoZIndex && W.set("modal", this.mask, this.baseZIndex || this.$primevue.config.zIndex.modal);
}, onAfterEnter: function() {
  this.enableDocumentSettings(), this.$emit("after-show");
}, onBeforeLeave: function() {
  this.modal && !this.isUnstyled && ae(this.mask, "p-overlay-mask-leave-active"), this.$emit("before-hide");
}, onLeave: function() {
  this.$emit("hide");
}, onAfterLeave: function() {
  this.autoZIndex && W.clear(this.mask), this.unbindDocumentKeyDownListener(), this.containerVisible = !1, this.disableDocumentSettings(), this.$emit("after-hide");
}, onMaskClick: function(e2) {
  this.dismissable && this.modal && this.mask === e2.target && this.hide();
}, focus: function() {
  var e2 = function(e3) {
    return e3 && e3.querySelector("[autofocus]");
  }, t2 = this.$slots.header && e2(this.headerContainer);
  t2 || (t2 = this.$slots.default && e2(this.container), t2 || (t2 = this.$slots.footer && e2(this.footerContainer), t2 ||= this.closeButton)), t2 && ne(t2);
}, enableDocumentSettings: function() {
  this.dismissable && !this.modal && this.bindOutsideClickListener(), this.blockScroll && le();
}, disableDocumentSettings: function() {
  this.unbindOutsideClickListener(), this.blockScroll && ue();
}, onKeydown: function(e2) {
  e2.code === "Escape" && this.closeOnEscape && this.hide();
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
}, closeButtonRef: function(e2) {
  this.closeButton = e2 ? e2.$el : void 0;
}, bindDocumentKeyDownListener: function() {
  this.documentKeydownListener || (this.documentKeydownListener = this.onKeydown, document.addEventListener("keydown", this.documentKeydownListener));
}, unbindDocumentKeyDownListener: function() {
  this.documentKeydownListener &&= (document.removeEventListener("keydown", this.documentKeydownListener), null);
}, bindOutsideClickListener: function() {
  var e2 = this;
  this.outsideClickListener || (this.outsideClickListener = function(t2) {
    e2.isOutsideClicked(t2) && e2.hide();
  }, document.addEventListener("click", this.outsideClickListener, !0));
}, unbindOutsideClickListener: function() {
  this.outsideClickListener &&= (document.removeEventListener("click", this.outsideClickListener, !0), null);
}, isOutsideClicked: function(e2) {
  return this.container && !this.container.contains(e2.target);
} }, computed: { fullScreen: function() {
  return this.position === "full";
}, closeAriaLabel: function() {
  return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria.close : void 0;
}, dataP: function() {
  return re(X(X(X({ "full-screen": this.position === "full" }, this.position, this.position), "open", this.containerVisible), "modal", this.modal));
} }, directives: { focustrap: K }, components: { Button: q, Portal: de, TimesIcon: ce } };
var be = ["data-p"];
var xe = ["role", "aria-modal", "data-p"];
function Se(e2, t2, n2, r2, i2, a2) {
  var o2 = g("Button"), s2 = g("Portal"), c2 = h("focustrap");
  return m(), k(s2, null, { default: D(function() {
    return [i2.containerVisible ? (m(), C("div", d({ key: 0, ref: a2.maskRef, onMousedown: t2[0] ||= function() {
      return a2.onMaskClick && a2.onMaskClick.apply(a2, arguments);
    }, class: e2.cx("mask"), style: e2.sx("mask", !0, { position: e2.position, modal: e2.modal }), "data-p": a2.dataP }, e2.ptm("mask")), [F(z, d({ name: "p-drawer", onEnter: a2.onEnter, onAfterEnter: a2.onAfterEnter, onBeforeLeave: a2.onBeforeLeave, onLeave: a2.onLeave, onAfterLeave: a2.onAfterLeave, appear: "" }, e2.ptm("transition")), { default: D(function() {
      return [e2.visible ? M((m(), C("div", d({ key: 0, ref: a2.containerRef, class: e2.cx("root"), style: e2.sx("root"), role: e2.modal ? "dialog" : "complementary", "aria-modal": e2.modal ? !0 : void 0, "data-p": a2.dataP }, e2.ptmi("root")), [e2.$slots.container ? u(e2.$slots, "container", { key: 0, closeCallback: a2.hide }) : (m(), C(w, { key: 1 }, [S("div", d({ ref: a2.headerContainerRef, class: e2.cx("header") }, e2.ptm("header")), [u(e2.$slots, "header", { class: x(e2.cx("title")) }, function() {
        return [e2.header ? (m(), C("div", d({ key: 0, class: e2.cx("title") }, e2.ptm("title")), T(e2.header), 17)) : O("", !0)];
      }), e2.showCloseIcon ? u(e2.$slots, "closebutton", { key: 0, closeCallback: a2.hide }, function() {
        return [F(o2, d({ ref: a2.closeButtonRef, type: "button", class: e2.cx("pcCloseButton"), "aria-label": a2.closeAriaLabel, unstyled: e2.unstyled, onClick: a2.hide }, e2.closeButtonProps, { pt: e2.ptm("pcCloseButton"), "data-pc-group-section": "iconcontainer" }), { icon: D(function(t3) {
          return [u(e2.$slots, "closeicon", {}, function() {
            return [(m(), k(_(e2.closeIcon ? "span" : "TimesIcon"), d({ class: [e2.closeIcon, t3.class] }, e2.ptm("pcCloseButton").icon), null, 16, ["class"]))];
          })];
        }), _: 3 }, 16, ["class", "aria-label", "unstyled", "onClick", "pt"])];
      }) : O("", !0)], 16), S("div", d({ ref: a2.contentRef, class: e2.cx("content") }, e2.ptm("content")), [u(e2.$slots, "default")], 16), e2.$slots.footer ? (m(), C("div", d({ key: 0, ref: a2.footerContainerRef, class: e2.cx("footer") }, e2.ptm("footer")), [u(e2.$slots, "footer")], 16)) : O("", !0)], 64))], 16, xe)), [[c2]]) : O("", !0)];
    }), _: 3 }, 16, ["onEnter", "onAfterEnter", "onBeforeLeave", "onLeave", "onAfterLeave"])], 16, be)) : O("", !0)];
  }), _: 3 });
}
Z.render = Se;
export { Z as Drawer };
