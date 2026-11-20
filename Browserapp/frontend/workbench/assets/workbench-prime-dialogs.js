// PrimeVue DynamicDialog and ConfirmPopup extensions.
import { J as v, P as y, W as S, X as C, Y as w, Z as T, en as E, f as D, h as O, i as k, in as A, lt as N, m as P, p as F, q as I, ut as R, v as z, x as B } from "./runtime-core.esm-bundler-CBj16o9G.js";
import { t as ge } from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import { I as G, M as K, c as Ae, h as J, k as je, t as Y } from "./basecomponent-ClhuVxJN.js";
import { s as Me } from "./dist-DPswMdzV.js";
import { i as Ne } from "./baseicon-Z_5Hqu9u.js";
import { t as Z } from "./zindex-cO8iUN-n.js";
import { i as Q } from "./style-CuLi6QSy.js";
import { i as $, n as Ie, r as Le } from "./primevue-3KC3oRok.js";
import { t as ze } from "./utils-i4uei9-Y.js";
import { t as Ve } from "./focustrap-DJJkEqE8.js";
import { t as He } from "./button-BKeo7L17.js";
import { t as We } from "./dialog-CrBr3eoy.js";
import { t as Ge } from "./portal-Cm1Im7J-.js";
import { t as Qe } from "./overlayeventbus-B9Z9smtH.js";
var Ot = { name: "DynamicDialog", extends: { name: "BaseDynamicDialog", extends: Y, props: {}, style: Ie, provide: function() {
  return { $pcDynamicDialog: this, $parentInstance: this };
} }, inheritAttrs: !1, data: function() {
  return { instanceMap: {} };
}, openListener: null, closeListener: null, currentInstance: null, mounted: function() {
  var e2 = this;
  this.openListener = function(t2) {
    var n2 = t2.instance, r2 = Ne() + "_dynamic_dialog";
    n2.visible = !0, n2.key = r2, e2.instanceMap[r2] = n2;
  }, this.closeListener = function(t2) {
    var n2 = t2.instance, r2 = t2.params, i2 = n2.key, a2 = e2.instanceMap[i2];
    a2 && (a2.visible = !1, a2.options.onClose && a2.options.onClose({ data: r2, type: "config-close" }), e2.currentInstance = a2);
  }, $.on("open", this.openListener), $.on("close", this.closeListener);
}, beforeUnmount: function() {
  $.off("open", this.openListener), $.off("close", this.closeListener);
}, methods: { onDialogHide: function(e2) {
  !this.currentInstance && e2.options.onClose && e2.options.onClose({ type: "dialog-close" });
}, onDialogAfterHide: function(e2) {
  this.currentInstance && delete this.currentInstance, this.currentInstance = null, delete this.instanceMap[e2.key];
}, getTemplateItems: function(e2) {
  return Array.isArray(e2) ? e2 : [e2];
} }, components: { DDialog: We } };
function kt(e2, t2, n2, r2, i2, a2) {
  var o2 = w("DDialog");
  return S(!0), O(k, null, I(i2.instanceMap, function(e3, t3) {
    return S(), F(o2, y({ key: t3, visible: e3.visible, "onUpdate:visible": function(t4) {
      return e3.visible = t4;
    }, _instance: e3 }, { ref_for: !0 }, e3.options.props, { onHide: function(t4) {
      return a2.onDialogHide(e3);
    }, onAfterHide: function(t4) {
      return a2.onDialogAfterHide(e3);
    } }), z({ default: N(function() {
      return [(S(), F(T(e3.content), y({ ref_for: !0 }, e3.options.emits), null, 16))];
    }), _: 2 }, [e3.options.templates && e3.options.templates.header ? { name: "header", fn: N(function() {
      return [(S(!0), O(k, null, I(a2.getTemplateItems(e3.options.templates.header), function(t4, n3) {
        return S(), F(T(t4), y({ key: n3 + "_header" }, { ref_for: !0 }, e3.options.emits), null, 16);
      }), 128))];
    }), key: "0" } : void 0, e3.options.templates && e3.options.templates.footer ? { name: "footer", fn: N(function() {
      return [(S(!0), O(k, null, I(a2.getTemplateItems(e3.options.templates.footer), function(t4, n3) {
        return S(), F(T(t4), y({ key: n3 + "_footer" }, { ref_for: !0 }, e3.options.emits), null, 16);
      }), 128))];
    }), key: "1" } : void 0]), 1040, ["visible", "onUpdate:visible", "_instance", "onHide", "onAfterHide"]);
  }), 128);
}
Ot.render = kt;
var At = { name: "ConfirmPopup", extends: { name: "BaseConfirmPopup", extends: Y, props: { group: String }, style: Le, provide: function() {
  return { $pcConfirmPopup: this, $parentInstance: this };
} }, inheritAttrs: !1, data: function() {
  return { visible: !1, confirmation: null, autoFocusAccept: null, autoFocusReject: null, target: null };
}, target: null, outsideClickListener: null, scrollHandler: null, resizeListener: null, container: null, confirmListener: null, closeListener: null, mounted: function() {
  var e2 = this;
  this.confirmListener = function(t2) {
    t2 && t2.group === e2.group && (e2.confirmation = t2, e2.target = t2.target, e2.confirmation.onShow && e2.confirmation.onShow(), e2.visible = !0);
  }, this.closeListener = function() {
    e2.visible = !1, e2.confirmation = null;
  }, Q.on("confirm", this.confirmListener), Q.on("close", this.closeListener);
}, beforeUnmount: function() {
  Q.off("confirm", this.confirmListener), Q.off("close", this.closeListener), this.unbindOutsideClickListener(), this.scrollHandler &&= (this.scrollHandler.destroy(), null), this.unbindResizeListener(), this.container &&= (Z.clear(this.container), null), this.target = null, this.confirmation = null;
}, methods: { accept: function() {
  this.confirmation.accept && this.confirmation.accept(), this.visible = !1;
}, reject: function() {
  this.confirmation.reject && this.confirmation.reject(), this.visible = !1;
}, onHide: function() {
  this.confirmation.onHide && this.confirmation.onHide(), this.visible = !1;
}, onAcceptKeydown: function(e2) {
  (e2.code === "Space" || e2.code === "Enter" || e2.code === "NumpadEnter") && (this.accept(), G(this.target), e2.preventDefault());
}, onRejectKeydown: function(e2) {
  (e2.code === "Space" || e2.code === "Enter" || e2.code === "NumpadEnter") && (this.reject(), G(this.target), e2.preventDefault());
}, onEnter: function(e2) {
  this.autoFocusAccept = this.confirmation.defaultFocus === void 0 || this.confirmation.defaultFocus === "accept", this.autoFocusReject = this.confirmation.defaultFocus === "reject", this.target = this.target || document.activeElement, this.bindOutsideClickListener(), this.bindScrollListener(), this.bindResizeListener(), Z.set("overlay", e2, this.$primevue.config.zIndex.overlay);
}, onAfterEnter: function() {
  this.focus();
}, onLeave: function() {
  this.autoFocusAccept = null, this.autoFocusReject = null, G(this.target), this.target = null, this.unbindOutsideClickListener(), this.unbindScrollListener(), this.unbindResizeListener();
}, onAfterLeave: function(e2) {
  Z.clear(e2);
}, alignOverlay: function() {
  Ae(this.container, this.target, !1);
  var e2 = J(this.container), t2 = J(this.target), n2 = 0;
  e2.left < t2.left && (n2 = t2.left - e2.left), this.container.style.setProperty(Me("confirmpopup.arrow.left").name, `${n2}px`), e2.top < t2.top && (this.container.setAttribute("data-p-confirmpopup-flipped", "true"), !this.isUnstyled && je(this.container, "p-confirmpopup-flipped"));
}, bindOutsideClickListener: function() {
  var e2 = this;
  this.outsideClickListener || (this.outsideClickListener = function(t2) {
    e2.visible && e2.container && !e2.container.contains(t2.target) && !e2.isTargetClicked(t2) ? (e2.confirmation.onHide && e2.confirmation.onHide(), e2.visible = !1) : e2.alignOverlay();
  }, document.addEventListener("click", this.outsideClickListener));
}, unbindOutsideClickListener: function() {
  this.outsideClickListener &&= (document.removeEventListener("click", this.outsideClickListener), null);
}, bindScrollListener: function() {
  var e2 = this;
  this.scrollHandler ||= new ze(this.target, function() {
    e2.visible &&= !1;
  }), this.scrollHandler.bindScrollListener();
}, unbindScrollListener: function() {
  this.scrollHandler && this.scrollHandler.unbindScrollListener();
}, bindResizeListener: function() {
  var e2 = this;
  this.resizeListener || (this.resizeListener = function() {
    e2.visible && !K() && (e2.visible = !1);
  }, window.addEventListener("resize", this.resizeListener));
}, unbindResizeListener: function() {
  this.resizeListener &&= (window.removeEventListener("resize", this.resizeListener), null);
}, focus: function() {
  var e2 = this.container.querySelector("[autofocus]");
  e2 && e2.focus({ preventScroll: !0 });
}, isTargetClicked: function(e2) {
  return this.target && (this.target === e2.target || this.target.contains(e2.target));
}, containerRef: function(e2) {
  this.container = e2;
}, onOverlayClick: function(e2) {
  Qe.emit("overlay-click", { originalEvent: e2, target: this.target });
}, onOverlayKeydown: function(e2) {
  e2.code === "Escape" && (Q.emit("close", this.closeListener), G(this.target));
} }, computed: { message: function() {
  return this.confirmation ? this.confirmation.message : null;
}, acceptLabel: function() {
  if (this.confirmation) {
    var e2 = this.confirmation;
    return e2.acceptLabel || e2.acceptProps?.label || this.$primevue.config.locale.accept;
  }
  return this.$primevue.config.locale.accept;
}, rejectLabel: function() {
  if (this.confirmation) {
    var e2 = this.confirmation;
    return e2.rejectLabel || e2.rejectProps?.label || this.$primevue.config.locale.reject;
  }
  return this.$primevue.config.locale.reject;
}, acceptIcon: function() {
  var e2;
  return this.confirmation ? this.confirmation.acceptIcon : (e2 = this.confirmation) != null && e2.acceptProps ? this.confirmation.acceptProps.icon : null;
}, rejectIcon: function() {
  var e2;
  return this.confirmation ? this.confirmation.rejectIcon : (e2 = this.confirmation) != null && e2.rejectProps ? this.confirmation.rejectProps.icon : null;
} }, components: { Button: He, Portal: Ge }, directives: { focustrap: Ve } };
var jt = ["aria-modal"];
function Mt(e2, t2, n2, r2, i2, a2) {
  var o2 = w("Button"), s2 = w("Portal"), c2 = C("focustrap");
  return S(), F(s2, null, { default: N(function() {
    return [B(ge, y({ name: "p-anchored-overlay", onEnter: a2.onEnter, onAfterEnter: a2.onAfterEnter, onLeave: a2.onLeave, onAfterLeave: a2.onAfterLeave }, e2.ptm("transition")), { default: N(function() {
      return [i2.visible ? R((S(), O("div", y({ key: 0, ref: a2.containerRef, role: "alertdialog", class: e2.cx("root"), "aria-modal": i2.visible, onClick: t2[2] ||= function() {
        return a2.onOverlayClick && a2.onOverlayClick.apply(a2, arguments);
      }, onKeydown: t2[3] ||= function() {
        return a2.onOverlayKeydown && a2.onOverlayKeydown.apply(a2, arguments);
      } }, e2.ptmi("root")), [e2.$slots.container ? v(e2.$slots, "container", { key: 0, message: i2.confirmation, acceptCallback: a2.accept, rejectCallback: a2.reject }) : (S(), O(k, { key: 1 }, [e2.$slots.message ? (S(), F(T(e2.$slots.message), { key: 1, message: i2.confirmation }, null, 8, ["message"])) : (S(), O("div", y({ key: 0, class: e2.cx("content") }, e2.ptm("content")), [v(e2.$slots, "icon", {}, function() {
        return [e2.$slots.icon ? (S(), F(T(e2.$slots.icon), { key: 0, class: E(e2.cx("icon")) }, null, 8, ["class"])) : i2.confirmation.icon ? (S(), O("span", y({ key: 1, class: [i2.confirmation.icon, e2.cx("icon")] }, e2.ptm("icon")), null, 16)) : P("", !0)];
      }), D("span", y({ class: e2.cx("message") }, e2.ptm("message")), A(i2.confirmation.message), 17)], 16)), D("div", y({ class: e2.cx("footer") }, e2.ptm("footer")), [B(o2, y({ class: [e2.cx("pcRejectButton"), i2.confirmation.rejectClass], autofocus: i2.autoFocusReject, unstyled: e2.unstyled, size: i2.confirmation.rejectProps?.size || "small", text: i2.confirmation.rejectProps?.text || !1, onClick: t2[0] ||= function(e3) {
        return a2.reject();
      }, onKeydown: a2.onRejectKeydown }, i2.confirmation.rejectProps, { label: a2.rejectLabel, pt: e2.ptm("pcRejectButton") }), z({ _: 2 }, [a2.rejectIcon || e2.$slots.rejecticon ? { name: "icon", fn: N(function(t3) {
        return [v(e2.$slots, "rejecticon", {}, function() {
          return [D("span", y({ class: [a2.rejectIcon, t3.class] }, e2.ptm("pcRejectButton").icon, { "data-pc-section": "rejectbuttonicon" }), null, 16)];
        })];
      }), key: "0" } : void 0]), 1040, ["class", "autofocus", "unstyled", "size", "text", "onKeydown", "label", "pt"]), B(o2, y({ class: [e2.cx("pcAcceptButton"), i2.confirmation.acceptClass], autofocus: i2.autoFocusAccept, unstyled: e2.unstyled, size: i2.confirmation.acceptProps?.size || "small", onClick: t2[1] ||= function(e3) {
        return a2.accept();
      }, onKeydown: a2.onAcceptKeydown }, i2.confirmation.acceptProps, { label: a2.acceptLabel, pt: e2.ptm("pcAcceptButton") }), z({ _: 2 }, [a2.acceptIcon || e2.$slots.accepticon ? { name: "icon", fn: N(function(t3) {
        return [v(e2.$slots, "accepticon", {}, function() {
          return [D("span", y({ class: [a2.acceptIcon, t3.class] }, e2.ptm("pcAcceptButton").icon, { "data-pc-section": "acceptbuttonicon" }), null, 16)];
        })];
      }), key: "0" } : void 0]), 1040, ["class", "autofocus", "unstyled", "size", "onKeydown", "label", "pt"])], 16)], 64))], 16, jt)), [[c2]]) : P("", !0)];
    }), _: 3 }, 16, ["onEnter", "onAfterEnter", "onLeave", "onAfterLeave"])];
  }), _: 3 });
}
At.render = Mt;
export { Ot as DynamicDialog, At as ConfirmPopup };
