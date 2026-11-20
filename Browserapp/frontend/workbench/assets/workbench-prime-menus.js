// PrimeVue ConfirmDialog, TieredMenu and SplitButton used by the workbench theme.
import { J as Fe, P as Re, W as P, X as Ue, Y as We, Z as Ge, en as I, f as L, h as R, i as z, in as B, lt as H, m as U, p as W, q as G, ut as rt, v as it, x as q } from "./runtime-core.esm-bundler-CBj16o9G.js";
import { t as mt } from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import { I as It, J as Lt, K as Rt, M as zt, Y as Bt, c as Vt, t as Ht, w as Ut } from "./basecomponent-ClhuVxJN.js";
import { D as Wt, M as Gt, O as Kt, m as qt, p as Jt } from "./dist-DPswMdzV.js";
import { t as Yt } from "./zindex-cO8iUN-n.js";
import { i as Xt, n as Zt, r as Qt, t as en } from "./style-CuLi6QSy.js";
import { t as rn } from "./ripple-DKjDc6yC.js";
import { t as an } from "./utils-i4uei9-Y.js";
import { t as sn } from "./button-BKeo7L17.js";
import { t as ln } from "./dialog-CrBr3eoy.js";
import { t as un } from "./portal-Cm1Im7J-.js";
import { t as pn } from "./overlayeventbus-B9Z9smtH.js";
import { i as Bn } from "./select-Cc8zLK4m.js";
import { t as Vn } from "./angleright-CRY6qWAP.js";
var $r = { name: "ConfirmDialog", extends: { name: "BaseConfirmDialog", extends: Ht, props: { group: String, breakpoints: { type: Object, default: null }, draggable: { type: Boolean, default: !0 } }, style: Qt, provide: function() {
  return { $pcConfirmDialog: this, $parentInstance: this };
} }, confirmListener: null, closeListener: null, data: function() {
  return { visible: !1, confirmation: null };
}, mounted: function() {
  var e2 = this;
  this.confirmListener = function(t2) {
    t2 && t2.group === e2.group && (e2.confirmation = t2, e2.confirmation.onShow && e2.confirmation.onShow(), e2.visible = !0);
  }, this.closeListener = function() {
    e2.visible = !1, e2.confirmation = null;
  }, Xt.on("confirm", this.confirmListener), Xt.on("close", this.closeListener);
}, beforeUnmount: function() {
  Xt.off("confirm", this.confirmListener), Xt.off("close", this.closeListener);
}, methods: { accept: function() {
  this.confirmation.accept && this.confirmation.accept(), this.visible = !1;
}, reject: function() {
  this.confirmation.reject && this.confirmation.reject(), this.visible = !1;
}, onHide: function() {
  this.confirmation.onHide && this.confirmation.onHide(), this.visible = !1;
} }, computed: { appendTo: function() {
  return this.confirmation ? this.confirmation.appendTo : "body";
}, target: function() {
  return this.confirmation ? this.confirmation.target : null;
}, modal: function() {
  return !this.confirmation || this.confirmation.modal == null || this.confirmation.modal;
}, header: function() {
  return this.confirmation ? this.confirmation.header : null;
}, message: function() {
  return this.confirmation ? this.confirmation.message : null;
}, blockScroll: function() {
  return !this.confirmation || this.confirmation.blockScroll;
}, position: function() {
  return this.confirmation ? this.confirmation.position : null;
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
}, autoFocusAccept: function() {
  return this.confirmation.defaultFocus === void 0 || this.confirmation.defaultFocus === "accept";
}, autoFocusReject: function() {
  return this.confirmation.defaultFocus === "reject";
}, closeOnEscape: function() {
  return !this.confirmation || this.confirmation.closeOnEscape;
} }, components: { Dialog: ln, Button: sn } };
function ei(e2, t2, n2, r2, i2, a2) {
  var o2 = We("Button"), s2 = We("Dialog");
  return P(), W(s2, { visible: i2.visible, "onUpdate:visible": [t2[2] ||= function(e3) {
    return i2.visible = e3;
  }, a2.onHide], role: "alertdialog", class: I(e2.cx("root")), modal: a2.modal, header: a2.header, blockScroll: a2.blockScroll, appendTo: a2.appendTo, position: a2.position, breakpoints: e2.breakpoints, closeOnEscape: a2.closeOnEscape, draggable: e2.draggable, pt: e2.pt, unstyled: e2.unstyled }, it({ default: H(function() {
    return [e2.$slots.container ? U("", !0) : (P(), R(z, { key: 0 }, [e2.$slots.message ? (P(), W(Ge(e2.$slots.message), { key: 1, message: i2.confirmation }, null, 8, ["message"])) : (P(), R(z, { key: 0 }, [Fe(e2.$slots, "icon", {}, function() {
      return [e2.$slots.icon ? (P(), W(Ge(e2.$slots.icon), { key: 0, class: I(e2.cx("icon")) }, null, 8, ["class"])) : i2.confirmation.icon ? (P(), R("span", Re({ key: 1, class: [i2.confirmation.icon, e2.cx("icon")] }, e2.ptm("icon")), null, 16)) : U("", !0)];
    }), L("span", Re({ class: e2.cx("message") }, e2.ptm("message")), B(a2.message), 17)], 64))], 64))];
  }), _: 2 }, [e2.$slots.container ? { name: "container", fn: H(function(t3) {
    return [Fe(e2.$slots, "container", { message: i2.confirmation, closeCallback: t3.closeCallback, acceptCallback: a2.accept, rejectCallback: a2.reject, initDragCallback: t3.initDragCallback })];
  }), key: "0" } : void 0, e2.$slots.container ? void 0 : { name: "footer", fn: H(function() {
    return [q(o2, Re({ class: [e2.cx("pcRejectButton"), i2.confirmation.rejectClass], autofocus: a2.autoFocusReject, unstyled: e2.unstyled, text: i2.confirmation.rejectProps?.text || !1, onClick: t2[0] ||= function(e3) {
      return a2.reject();
    } }, i2.confirmation.rejectProps, { label: a2.rejectLabel, pt: e2.ptm("pcRejectButton") }), it({ _: 2 }, [a2.rejectIcon || e2.$slots.rejecticon ? { name: "icon", fn: H(function(t3) {
      return [Fe(e2.$slots, "rejecticon", {}, function() {
        return [L("span", Re({ class: [a2.rejectIcon, t3.class] }, e2.ptm("pcRejectButton").icon, { "data-pc-section": "rejectbuttonicon" }), null, 16)];
      })];
    }), key: "0" } : void 0]), 1040, ["class", "autofocus", "unstyled", "text", "label", "pt"]), q(o2, Re({ label: a2.acceptLabel, class: [e2.cx("pcAcceptButton"), i2.confirmation.acceptClass], autofocus: a2.autoFocusAccept, unstyled: e2.unstyled, onClick: t2[1] ||= function(e3) {
      return a2.accept();
    } }, i2.confirmation.acceptProps, { pt: e2.ptm("pcAcceptButton") }), it({ _: 2 }, [a2.acceptIcon || e2.$slots.accepticon ? { name: "icon", fn: H(function(t3) {
      return [Fe(e2.$slots, "accepticon", {}, function() {
        return [L("span", Re({ class: [a2.acceptIcon, t3.class] }, e2.ptm("pcAcceptButton").icon, { "data-pc-section": "acceptbuttonicon" }), null, 16)];
      })];
    }), key: "0" } : void 0]), 1040, ["label", "class", "autofocus", "unstyled", "pt"])];
  }), key: "1" }]), 1032, ["visible", "class", "modal", "header", "blockScroll", "appendTo", "position", "breakpoints", "closeOnEscape", "draggable", "onUpdate:visible", "pt", "unstyled"]);
}
$r.render = ei;
var NE = { name: "BaseTieredMenu", extends: Ht, props: { popup: { type: Boolean, default: !1 }, model: { type: Array, default: null }, appendTo: { type: [String, Object], default: "body" }, breakpoint: { type: String, default: "960px" }, autoZIndex: { type: Boolean, default: !0 }, baseZIndex: { type: Number, default: 0 }, disabled: { type: Boolean, default: !1 }, tabindex: { type: Number, default: 0 }, ariaLabelledby: { type: String, default: null }, ariaLabel: { type: String, default: null } }, style: en, provide: function() {
  return { $pcTieredMenu: this, $parentInstance: this };
} };
var PE = { name: "TieredMenuSub", hostName: "TieredMenu", extends: Ht, emits: ["item-click", "item-mouseenter", "item-mousemove"], container: null, props: { menuId: { type: String, default: null }, focusedItemId: { type: String, default: null }, items: { type: Array, default: null }, visible: { type: Boolean, default: !1 }, level: { type: Number, default: 0 }, templates: { type: Object, default: null }, activeItemPath: { type: Object, default: null }, tabindex: { type: Number, default: 0 } }, methods: { getItemId: function(e2) {
  return `${this.menuId}_${e2.key}`;
}, getItemKey: function(e2) {
  return this.getItemId(e2);
}, getItemProp: function(e2, t2, n2) {
  return e2 && e2.item ? Kt(e2.item[t2], n2) : void 0;
}, getItemLabel: function(e2) {
  return this.getItemProp(e2, "label");
}, getItemLabelId: function(e2) {
  return `${this.menuId}_${e2.key}_label`;
}, getPTOptions: function(e2, t2, n2) {
  return this.ptm(n2, { context: { item: e2.item, index: t2, active: this.isItemActive(e2), focused: this.isItemFocused(e2), disabled: this.isItemDisabled(e2) } });
}, isItemActive: function(e2) {
  return this.activeItemPath.some(function(t2) {
    return t2.key === e2.key;
  });
}, isItemVisible: function(e2) {
  return this.getItemProp(e2, "visible") !== !1;
}, isItemDisabled: function(e2) {
  return this.getItemProp(e2, "disabled");
}, isItemFocused: function(e2) {
  return this.focusedItemId === this.getItemId(e2);
}, isItemGroup: function(e2) {
  return Gt(e2.items);
}, onEnter: function() {
  Bt(this.container, this.level);
}, onItemClick: function(e2, t2) {
  this.getItemProp(t2, "command", { originalEvent: e2, item: t2.item }), this.$emit("item-click", { originalEvent: e2, processedItem: t2, isFocus: !0 });
}, onItemMouseEnter: function(e2, t2) {
  this.$emit("item-mouseenter", { originalEvent: e2, processedItem: t2 });
}, onItemMouseMove: function(e2, t2) {
  this.$emit("item-mousemove", { originalEvent: e2, processedItem: t2 });
}, getAriaSetSize: function() {
  var e2 = this;
  return this.items.filter(function(t2) {
    return e2.isItemVisible(t2) && !e2.getItemProp(t2, "separator");
  }).length;
}, getAriaPosInset: function(e2) {
  var t2 = this;
  return e2 - this.items.slice(0, e2).filter(function(e3) {
    return t2.isItemVisible(e3) && t2.getItemProp(e3, "separator");
  }).length + 1;
}, getMenuItemProps: function(e2, t2) {
  return { action: Re({ class: this.cx("itemLink"), tabindex: -1 }, this.getPTOptions(e2, t2, "itemLink")), icon: Re({ class: [this.cx("itemIcon"), this.getItemProp(e2, "icon")] }, this.getPTOptions(e2, t2, "itemIcon")), label: Re({ class: this.cx("itemLabel") }, this.getPTOptions(e2, t2, "itemLabel")), submenuicon: Re({ class: this.cx("submenuIcon") }, this.getPTOptions(e2, t2, "submenuIcon")) };
}, containerRef: function(e2) {
  this.container = e2;
} }, components: { AngleRightIcon: Vn }, directives: { ripple: rn } };
var FE = ["tabindex"];
var IE = ["id", "aria-label", "aria-disabled", "aria-expanded", "aria-haspopup", "aria-level", "aria-setsize", "aria-posinset", "data-p-active", "data-p-focused", "data-p-disabled"];
var LE = ["onClick", "onMouseenter", "onMousemove"];
var RE = ["href", "target"];
var zE = ["id"];
var BE = ["id"];
function VE(e2, t2, n2, r2, i2, a2) {
  var o2 = We("AngleRightIcon"), s2 = We("TieredMenuSub", !0), c2 = Ue("ripple");
  return P(), W(mt, Re({ name: "p-anchored-overlay", onEnter: a2.onEnter }, e2.ptm("menu.transition")), { default: H(function() {
    return [n2.level === 0 || n2.visible ? (P(), R("ul", { key: 0, ref: a2.containerRef, tabindex: n2.tabindex }, [(P(!0), R(z, null, G(n2.items, function(r3, i3) {
      return P(), R(z, { key: a2.getItemKey(r3) }, [a2.isItemVisible(r3) && !a2.getItemProp(r3, "separator") ? (P(), R("li", Re({ key: 0, id: a2.getItemId(r3), style: a2.getItemProp(r3, "style"), class: [e2.cx("item", { processedItem: r3 }), a2.getItemProp(r3, "class")], role: "menuitem", "aria-label": a2.getItemLabel(r3), "aria-disabled": a2.isItemDisabled(r3) || void 0, "aria-expanded": a2.isItemGroup(r3) ? a2.isItemActive(r3) : void 0, "aria-haspopup": a2.isItemGroup(r3) && !a2.getItemProp(r3, "to") ? "menu" : void 0, "aria-level": n2.level + 1, "aria-setsize": a2.getAriaSetSize(), "aria-posinset": a2.getAriaPosInset(i3) }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "item"), { "data-p-active": a2.isItemActive(r3), "data-p-focused": a2.isItemFocused(r3), "data-p-disabled": a2.isItemDisabled(r3) }), [L("div", Re({ class: e2.cx("itemContent"), onClick: function(e3) {
        return a2.onItemClick(e3, r3);
      }, onMouseenter: function(e3) {
        return a2.onItemMouseEnter(e3, r3);
      }, onMousemove: function(e3) {
        return a2.onItemMouseMove(e3, r3);
      } }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "itemContent")), [n2.templates.item ? (P(), W(Ge(n2.templates.item), { key: 1, item: r3.item, hasSubmenu: !!a2.getItemProp(r3, "items"), label: a2.getItemLabel(r3), props: a2.getMenuItemProps(r3, i3) }, null, 8, ["item", "hasSubmenu", "label", "props"])) : rt((P(), R("a", Re({ key: 0, href: a2.getItemProp(r3, "url"), class: e2.cx("itemLink"), target: a2.getItemProp(r3, "target"), tabindex: "-1" }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "itemLink")), [n2.templates.itemicon ? (P(), W(Ge(n2.templates.itemicon), { key: 0, item: r3.item, class: I(e2.cx("itemIcon")) }, null, 8, ["item", "class"])) : a2.getItemProp(r3, "icon") ? (P(), R("span", Re({ key: 1, class: [e2.cx("itemIcon"), a2.getItemProp(r3, "icon")] }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "itemIcon")), null, 16)) : U("", !0), L("span", Re({ id: a2.getItemLabelId(r3), class: e2.cx("itemLabel") }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "itemLabel")), B(a2.getItemLabel(r3)), 17, zE), a2.getItemProp(r3, "items") ? (P(), R(z, { key: 2 }, [n2.templates.submenuicon ? (P(), W(Ge(n2.templates.submenuicon), Re({ key: 0, class: e2.cx("submenuIcon"), active: a2.isItemActive(r3) }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "submenuIcon")), null, 16, ["class", "active"])) : (P(), W(o2, Re({ key: 1, class: e2.cx("submenuIcon") }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "submenuIcon")), null, 16, ["class"]))], 64)) : U("", !0)], 16, RE)), [[c2]])], 16, LE), a2.isItemVisible(r3) && a2.isItemGroup(r3) ? (P(), W(s2, Re({ key: 0, id: a2.getItemId(r3) + "_list", class: e2.cx("submenu"), style: e2.sx("submenu", !0, { processedItem: r3 }), "aria-labelledby": a2.getItemLabelId(r3), role: "menu", menuId: n2.menuId, focusedItemId: n2.focusedItemId, items: r3.items, templates: n2.templates, activeItemPath: n2.activeItemPath, level: n2.level + 1, visible: a2.isItemActive(r3) && a2.isItemGroup(r3), pt: e2.pt, unstyled: e2.unstyled, onItemClick: t2[0] ||= function(t3) {
        return e2.$emit("item-click", t3);
      }, onItemMouseenter: t2[1] ||= function(t3) {
        return e2.$emit("item-mouseenter", t3);
      }, onItemMousemove: t2[2] ||= function(t3) {
        return e2.$emit("item-mousemove", t3);
      } }, { ref_for: !0 }, e2.ptm("submenu")), null, 16, ["id", "class", "style", "aria-labelledby", "menuId", "focusedItemId", "items", "templates", "activeItemPath", "level", "visible", "pt", "unstyled"])) : U("", !0)], 16, IE)) : U("", !0), a2.isItemVisible(r3) && a2.getItemProp(r3, "separator") ? (P(), R("li", Re({ key: 1, id: a2.getItemId(r3), style: a2.getItemProp(r3, "style"), class: [e2.cx("separator"), a2.getItemProp(r3, "class")], role: "separator" }, { ref_for: !0 }, e2.ptm("separator")), null, 16, BE)) : U("", !0)], 64);
    }), 128))], 8, FE)) : U("", !0)];
  }), _: 1 }, 16, ["onEnter"]);
}
PE.render = VE;
var HE = { name: "TieredMenu", extends: NE, inheritAttrs: !1, emits: ["focus", "blur", "before-show", "before-hide", "hide", "show"], outsideClickListener: null, matchMediaListener: null, scrollHandler: null, resizeListener: null, target: null, container: null, menubar: null, searchTimeout: null, searchValue: null, data: function() {
  return { focused: !1, focusedItemInfo: { index: -1, level: 0, parentKey: "" }, activeItemPath: [], visible: !this.popup, submenuVisible: !1, dirty: !1, query: null, queryMatches: !1 };
}, watch: { activeItemPath: function(e2) {
  this.popup || (Gt(e2) ? (this.bindOutsideClickListener(), this.bindResizeListener()) : (this.unbindOutsideClickListener(), this.unbindResizeListener()));
} }, mounted: function() {
  this.bindMatchMediaListener();
}, beforeUnmount: function() {
  this.unbindOutsideClickListener(), this.unbindResizeListener(), this.unbindMatchMediaListener(), this.scrollHandler &&= (this.scrollHandler.destroy(), null), this.container && this.autoZIndex && Yt.clear(this.container), this.target = null, this.container = null;
}, methods: { getItemProp: function(e2, t2) {
  return e2 ? Kt(e2[t2]) : void 0;
}, getItemLabel: function(e2) {
  return this.getItemProp(e2, "label");
}, isItemDisabled: function(e2) {
  return this.getItemProp(e2, "disabled");
}, isItemVisible: function(e2) {
  return this.getItemProp(e2, "visible") !== !1;
}, isItemGroup: function(e2) {
  return Gt(this.getItemProp(e2, "items"));
}, isItemSeparator: function(e2) {
  return this.getItemProp(e2, "separator");
}, getProccessedItemLabel: function(e2) {
  return e2 ? this.getItemLabel(e2.item) : void 0;
}, isProccessedItemGroup: function(e2) {
  return e2 && Gt(e2.items);
}, toggle: function(e2) {
  this.visible ? this.hide(e2, !0) : this.show(e2);
}, show: function(e2, t2) {
  this.popup && (this.$emit("before-show"), this.visible = !0, this.target = e2.currentTarget, this.relatedTarget = e2.relatedTarget || null), t2 && It(this.menubar);
}, hide: function(e2, t2) {
  this.popup && (this.$emit("before-hide"), this.visible = !1), this.activeItemPath = [], this.focusedItemInfo = { index: -1, level: 0, parentKey: "" }, t2 && It(this.relatedTarget || this.target || this.menubar), this.dirty = !1, this.target = null;
}, onFocus: function(e2) {
  this.focused = !0, this.popup || (this.focusedItemInfo = this.focusedItemInfo.index === -1 ? { index: this.findFirstFocusedItemIndex(), level: 0, parentKey: "" } : this.focusedItemInfo), this.$emit("focus", e2);
}, onBlur: function(e2) {
  this.focused = !1, this.focusedItemInfo = { index: -1, level: 0, parentKey: "" }, this.searchValue = "", this.dirty = !1, this.$emit("blur", e2);
}, onKeyDown: function(e2) {
  if (this.disabled) e2.preventDefault();
  else {
    var t2 = e2.metaKey || e2.ctrlKey;
    switch (e2.code) {
      case "ArrowDown":
        this.onArrowDownKey(e2);
        break;
      case "ArrowUp":
        this.onArrowUpKey(e2);
        break;
      case "ArrowLeft":
        this.onArrowLeftKey(e2);
        break;
      case "ArrowRight":
        this.onArrowRightKey(e2);
        break;
      case "Home":
        this.onHomeKey(e2);
        break;
      case "End":
        this.onEndKey(e2);
        break;
      case "Space":
        this.onSpaceKey(e2);
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
      case "PageDown":
      case "PageUp":
      case "Backspace":
      case "ShiftLeft":
      case "ShiftRight":
        break;
      default:
        !t2 && Jt(e2.key) && this.searchItems(e2, e2.key);
    }
  }
}, onItemChange: function(e2, t2) {
  var n2 = e2.processedItem, r2 = e2.isFocus;
  if (!Wt(n2)) {
    var i2 = n2.index, a2 = n2.key, o2 = n2.level, s2 = n2.parentKey, c2 = n2.items, l2 = Gt(c2), u2 = this.activeItemPath.filter(function(e3) {
      return e3.parentKey !== s2 && e3.parentKey !== a2;
    });
    l2 && (u2.push(n2), this.submenuVisible = !0), this.focusedItemInfo = { index: i2, level: o2, parentKey: s2 }, l2 && (this.dirty = !0), r2 && It(this.menubar), !(t2 === "hover" && this.queryMatches) && (this.activeItemPath = u2);
  }
}, onOverlayClick: function(e2) {
  pn.emit("overlay-click", { originalEvent: e2, target: this.target });
}, onItemClick: function(e2) {
  var t2 = e2.originalEvent, n2 = e2.processedItem, r2 = this.isProccessedItemGroup(n2), i2 = Wt(n2.parent);
  if (this.isSelected(n2)) {
    var a2 = n2.index, o2 = n2.key, s2 = n2.level, c2 = n2.parentKey;
    this.activeItemPath = this.activeItemPath.filter(function(e3) {
      return o2 !== e3.key && o2.startsWith(e3.key);
    }), this.focusedItemInfo = { index: a2, level: s2, parentKey: c2 }, this.dirty = !i2, It(this.menubar);
  } else if (r2) this.onItemChange(e2);
  else {
    var l2 = i2 ? n2 : this.activeItemPath.find(function(e3) {
      return e3.parentKey === "";
    });
    this.hide(t2), this.changeFocusedItemIndex(t2, l2 ? l2.index : -1), It(this.menubar);
  }
}, onItemMouseEnter: function(e2) {
  this.dirty && this.onItemChange(e2, "hover");
}, onItemMouseMove: function(e2) {
  this.focused && this.changeFocusedItemIndex(e2, e2.processedItem.index);
}, onArrowDownKey: function(e2) {
  var t2 = this.focusedItemInfo.index === -1 ? this.findFirstFocusedItemIndex() : this.findNextItemIndex(this.focusedItemInfo.index);
  this.changeFocusedItemIndex(e2, t2), e2.preventDefault();
}, onArrowUpKey: function(e2) {
  if (e2.altKey) {
    if (this.focusedItemInfo.index !== -1) {
      var t2 = this.visibleItems[this.focusedItemInfo.index];
      !this.isProccessedItemGroup(t2) && this.onItemChange({ originalEvent: e2, processedItem: t2 });
    }
    this.popup && this.hide(e2, !0), e2.preventDefault();
  } else {
    var n2 = this.focusedItemInfo.index === -1 ? this.findLastFocusedItemIndex() : this.findPrevItemIndex(this.focusedItemInfo.index);
    this.changeFocusedItemIndex(e2, n2), e2.preventDefault();
  }
}, onArrowLeftKey: function(e2) {
  var t2 = this, n2 = this.visibleItems[this.focusedItemInfo.index], r2 = this.activeItemPath.find(function(e3) {
    return e3.key === n2.parentKey;
  });
  Wt(n2.parent) || (this.focusedItemInfo = { index: -1, parentKey: r2 ? r2.parentKey : "" }, this.searchValue = "", this.onArrowDownKey(e2)), this.activeItemPath = this.activeItemPath.filter(function(e3) {
    return e3.parentKey !== t2.focusedItemInfo.parentKey;
  }), e2.preventDefault();
}, onArrowRightKey: function(e2) {
  var t2 = this.visibleItems[this.focusedItemInfo.index];
  this.isProccessedItemGroup(t2) && (this.onItemChange({ originalEvent: e2, processedItem: t2 }), this.focusedItemInfo = { index: -1, parentKey: t2.key }, this.searchValue = "", this.onArrowDownKey(e2)), e2.preventDefault();
}, onHomeKey: function(e2) {
  this.changeFocusedItemIndex(e2, this.findFirstItemIndex()), e2.preventDefault();
}, onEndKey: function(e2) {
  this.changeFocusedItemIndex(e2, this.findLastItemIndex()), e2.preventDefault();
}, onEnterKey: function(e2) {
  if (this.focusedItemInfo.index !== -1) {
    var t2 = Lt(this.menubar, `li[id="${`${this.focusedItemId}`}"]`), n2 = t2 && Lt(t2, '[data-pc-section="itemlink"]');
    if (n2 ? n2.click() : t2 && t2.click(), !this.popup) {
      var r2 = this.visibleItems[this.focusedItemInfo.index];
      !this.isProccessedItemGroup(r2) && (this.focusedItemInfo.index = this.findFirstFocusedItemIndex());
    }
  }
  e2.preventDefault();
}, onSpaceKey: function(e2) {
  this.onEnterKey(e2);
}, onEscapeKey: function(e2) {
  if (this.popup || this.focusedItemInfo.level !== 0) {
    var t2 = this.focusedItemInfo;
    this.hide(e2, !1), this.focusedItemInfo = { index: Number(t2.parentKey.split("_")[0]), level: 0, parentKey: "" }, this.popup && It(this.target);
  }
  e2.preventDefault();
}, onTabKey: function(e2) {
  if (this.focusedItemInfo.index !== -1) {
    var t2 = this.visibleItems[this.focusedItemInfo.index];
    !this.isProccessedItemGroup(t2) && this.onItemChange({ originalEvent: e2, processedItem: t2 });
  }
  this.hide();
}, onEnter: function(e2) {
  this.autoZIndex && Yt.set("menu", e2, this.baseZIndex || this.$primevue.config.zIndex.menu), Ut(e2, { position: "absolute", top: "0" }), this.alignOverlay(), It(this.menubar), this.scrollInView();
}, onAfterEnter: function() {
  this.bindOutsideClickListener(), this.bindScrollListener(), this.bindResizeListener(), this.$emit("show");
}, onLeave: function() {
  this.unbindOutsideClickListener(), this.unbindScrollListener(), this.unbindResizeListener(), this.$emit("hide"), this.container = null, this.dirty = !1;
}, onAfterLeave: function(e2) {
  this.autoZIndex && Yt.clear(e2);
}, alignOverlay: function() {
  Vt(this.container, this.target), Rt(this.target) > Rt(this.container) && (this.container.style.minWidth = Rt(this.target) + "px");
}, bindOutsideClickListener: function() {
  var e2 = this;
  this.outsideClickListener || (this.outsideClickListener = function(t2) {
    var n2 = e2.container && !e2.container.contains(t2.target), r2 = !e2.popup || !e2.target || e2.target !== t2.target && !e2.target.contains(t2.target);
    n2 && r2 && e2.hide();
  }, document.addEventListener("click", this.outsideClickListener, !0));
}, unbindOutsideClickListener: function() {
  this.outsideClickListener &&= (document.removeEventListener("click", this.outsideClickListener, !0), null);
}, bindScrollListener: function() {
  var e2 = this;
  this.scrollHandler ||= new an(this.target, function(t2) {
    e2.hide(t2, !0);
  }), this.scrollHandler.bindScrollListener();
}, unbindScrollListener: function() {
  this.scrollHandler && this.scrollHandler.unbindScrollListener();
}, bindResizeListener: function() {
  var e2 = this;
  this.resizeListener || (this.resizeListener = function(t2) {
    zt() || e2.hide(t2, !0);
  }, window.addEventListener("resize", this.resizeListener));
}, unbindResizeListener: function() {
  this.resizeListener &&= (window.removeEventListener("resize", this.resizeListener), null);
}, bindMatchMediaListener: function() {
  var e2 = this;
  if (!this.matchMediaListener) {
    var t2 = matchMedia(`(max-width: ${this.breakpoint})`);
    this.query = t2, this.queryMatches = t2.matches, this.matchMediaListener = function() {
      e2.queryMatches = t2.matches;
    }, this.query.addEventListener("change", this.matchMediaListener);
  }
}, unbindMatchMediaListener: function() {
  this.matchMediaListener &&= (this.query.removeEventListener("change", this.matchMediaListener), null);
}, isItemMatched: function(e2) {
  return this.isValidItem(e2) && this.getProccessedItemLabel(e2)?.toLocaleLowerCase().startsWith(this.searchValue.toLocaleLowerCase());
}, isValidItem: function(e2) {
  return !!e2 && !this.isItemDisabled(e2.item) && !this.isItemSeparator(e2.item) && this.isItemVisible(e2.item);
}, isValidSelectedItem: function(e2) {
  return this.isValidItem(e2) && this.isSelected(e2);
}, isSelected: function(e2) {
  return this.activeItemPath.some(function(t2) {
    return t2.key === e2.key;
  });
}, findFirstItemIndex: function() {
  var e2 = this;
  return this.visibleItems.findIndex(function(t2) {
    return e2.isValidItem(t2);
  });
}, findLastItemIndex: function() {
  var e2 = this;
  return qt(this.visibleItems, function(t2) {
    return e2.isValidItem(t2);
  });
}, findNextItemIndex: function(e2) {
  var t2 = this, n2 = e2 < this.visibleItems.length - 1 ? this.visibleItems.slice(e2 + 1).findIndex(function(e3) {
    return t2.isValidItem(e3);
  }) : -1;
  return n2 > -1 ? n2 + e2 + 1 : e2;
}, findPrevItemIndex: function(e2) {
  var t2 = this, n2 = e2 > 0 ? qt(this.visibleItems.slice(0, e2), function(e3) {
    return t2.isValidItem(e3);
  }) : -1;
  return n2 > -1 ? n2 : e2;
}, findSelectedItemIndex: function() {
  var e2 = this;
  return this.visibleItems.findIndex(function(t2) {
    return e2.isValidSelectedItem(t2);
  });
}, findFirstFocusedItemIndex: function() {
  var e2 = this.findSelectedItemIndex();
  return e2 < 0 ? this.findFirstItemIndex() : e2;
}, findLastFocusedItemIndex: function() {
  var e2 = this.findSelectedItemIndex();
  return e2 < 0 ? this.findLastItemIndex() : e2;
}, searchItems: function(e2, t2) {
  var n2 = this;
  this.searchValue = (this.searchValue || "") + t2;
  var r2 = -1, i2 = !1;
  return this.focusedItemInfo.index === -1 ? r2 = this.visibleItems.findIndex(function(e3) {
    return n2.isItemMatched(e3);
  }) : (r2 = this.visibleItems.slice(this.focusedItemInfo.index).findIndex(function(e3) {
    return n2.isItemMatched(e3);
  }), r2 = r2 === -1 ? this.visibleItems.slice(0, this.focusedItemInfo.index).findIndex(function(e3) {
    return n2.isItemMatched(e3);
  }) : r2 + this.focusedItemInfo.index), r2 !== -1 && (i2 = !0), r2 === -1 && this.focusedItemInfo.index === -1 && (r2 = this.findFirstFocusedItemIndex()), r2 !== -1 && this.changeFocusedItemIndex(e2, r2), this.searchTimeout && clearTimeout(this.searchTimeout), this.searchTimeout = setTimeout(function() {
    n2.searchValue = "", n2.searchTimeout = null;
  }, 500), i2;
}, changeFocusedItemIndex: function(e2, t2) {
  this.focusedItemInfo.index !== t2 && (this.focusedItemInfo.index = t2, this.scrollInView());
}, scrollInView: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : -1, t2 = e2 === -1 ? this.focusedItemId : `${this.$id}_${e2}`, n2 = Lt(this.menubar, `li[id="${t2}"]`);
  n2 && n2.scrollIntoView && n2.scrollIntoView({ block: "nearest", inline: "start" });
}, createProcessedItems: function(e2) {
  var t2 = this, n2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0, r2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, i2 = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "", a2 = [];
  return e2 && e2.forEach(function(e3, o2) {
    var s2 = (i2 === "" ? "" : i2 + "_") + o2, c2 = { item: e3, index: o2, level: n2, key: s2, parent: r2, parentKey: i2 };
    c2.items = t2.createProcessedItems(e3.items, n2 + 1, c2, s2), a2.push(c2);
  }), a2;
}, containerRef: function(e2) {
  this.container = e2;
}, menubarRef: function(e2) {
  this.menubar = e2 ? e2.$el : void 0;
} }, computed: { processedItems: function() {
  return this.createProcessedItems(this.model || []);
}, visibleItems: function() {
  var e2 = this, t2 = this.activeItemPath.find(function(t3) {
    return t3.key === e2.focusedItemInfo.parentKey;
  });
  return t2 ? t2.items : this.processedItems;
}, focusedItemId: function() {
  return this.focusedItemInfo.index === -1 ? null : `${this.$id}${Gt(this.focusedItemInfo.parentKey) ? "_" + this.focusedItemInfo.parentKey : ""}_${this.focusedItemInfo.index}`;
} }, components: { TieredMenuSub: PE, Portal: un } };
var UE = ["id"];
function WE(e2, t2, n2, r2, i2, a2) {
  var o2 = We("TieredMenuSub"), s2 = We("Portal");
  return P(), W(s2, { appendTo: e2.appendTo, disabled: !e2.popup }, { default: H(function() {
    return [q(mt, Re({ name: "p-anchored-overlay", onEnter: a2.onEnter, onAfterEnter: a2.onAfterEnter, onLeave: a2.onLeave, onAfterLeave: a2.onAfterLeave }, e2.ptm("transition")), { default: H(function() {
      return [i2.visible ? (P(), R("div", Re({ key: 0, ref: a2.containerRef, id: e2.$id, class: e2.cx("root"), onClick: t2[0] ||= function() {
        return a2.onOverlayClick && a2.onOverlayClick.apply(a2, arguments);
      } }, e2.ptmi("root")), [e2.$slots.start ? (P(), R("div", Re({ key: 0, class: e2.cx("start") }, e2.ptm("start")), [Fe(e2.$slots, "start")], 16)) : U("", !0), q(o2, Re({ ref: a2.menubarRef, id: e2.$id + "_list", class: e2.cx("rootList"), tabindex: e2.disabled ? -1 : e2.tabindex, role: "menubar", "aria-label": e2.ariaLabel, "aria-labelledby": e2.ariaLabelledby, "aria-disabled": e2.disabled || void 0, "aria-orientation": "vertical", "aria-activedescendant": i2.focused ? a2.focusedItemId : void 0, menuId: e2.$id, focusedItemId: i2.focused ? a2.focusedItemId : void 0, items: a2.processedItems, templates: e2.$slots, activeItemPath: i2.activeItemPath, level: 0, visible: i2.submenuVisible, pt: e2.pt, unstyled: e2.unstyled, onFocus: a2.onFocus, onBlur: a2.onBlur, onKeydown: a2.onKeyDown, onItemClick: a2.onItemClick, onItemMouseenter: a2.onItemMouseEnter, onItemMousemove: a2.onItemMouseMove }, e2.ptm("rootList")), null, 16, ["id", "class", "tabindex", "aria-label", "aria-labelledby", "aria-disabled", "aria-activedescendant", "menuId", "focusedItemId", "items", "templates", "activeItemPath", "visible", "pt", "unstyled", "onFocus", "onBlur", "onKeydown", "onItemClick", "onItemMouseenter", "onItemMousemove"]), e2.$slots.end ? (P(), R("div", Re({ key: 1, class: e2.cx("end") }, e2.ptm("end")), [Fe(e2.$slots, "end")], 16)) : U("", !0)], 16, UE)) : U("", !0)];
    }), _: 3 }, 16, ["onEnter", "onAfterEnter", "onLeave", "onAfterLeave"])];
  }), _: 3 }, 8, ["appendTo", "disabled"]);
}
HE.render = WE;
var GE = { name: "SplitButton", extends: { name: "BaseSplitButton", extends: Ht, props: { label: { type: String, default: null }, icon: { type: String, default: null }, model: { type: Array, default: null }, autoZIndex: { type: Boolean, default: !0 }, baseZIndex: { type: Number, default: 0 }, appendTo: { type: [String, Object], default: "body" }, disabled: { type: Boolean, default: !1 }, fluid: { type: Boolean, default: null }, class: { type: null, default: null }, style: { type: null, default: null }, buttonProps: { type: null, default: null }, menuButtonProps: { type: null, default: null }, menuButtonIcon: { type: String, default: void 0 }, dropdownIcon: { type: String, default: void 0 }, severity: { type: String, default: null }, raised: { type: Boolean, default: !1 }, rounded: { type: Boolean, default: !1 }, text: { type: Boolean, default: !1 }, outlined: { type: Boolean, default: !1 }, size: { type: String, default: null }, plain: { type: Boolean, default: !1 } }, style: Zt, provide: function() {
  return { $pcSplitButton: this, $parentInstance: this };
} }, inheritAttrs: !1, emits: ["click"], inject: { $pcFluid: { default: null } }, data: function() {
  return { isExpanded: !1 };
}, mounted: function() {
  var e2 = this;
  this.$watch("$refs.menu.visible", function(t2) {
    e2.isExpanded = t2;
  });
}, methods: { onDropdownButtonClick: function(e2) {
  e2 && e2.preventDefault(), this.$refs.menu.toggle({ currentTarget: this.$el, relatedTarget: this.$refs.button.$el }), this.isExpanded = this.$refs.menu.visible;
}, onDropdownKeydown: function(e2) {
  (e2.code === "ArrowDown" || e2.code === "ArrowUp") && (this.onDropdownButtonClick(), e2.preventDefault());
}, onDefaultButtonClick: function(e2) {
  this.isExpanded && this.$refs.menu.hide(e2), this.$emit("click", e2);
} }, computed: { containerClass: function() {
  return [this.cx("root"), this.class];
}, hasFluid: function() {
  return Wt(this.fluid) ? !!this.$pcFluid : this.fluid;
} }, components: { PVSButton: sn, PVSMenu: HE, ChevronDownIcon: Bn } };
var KE = ["data-p-severity"];
function qE(e2, t2, n2, r2, i2, a2) {
  var o2 = We("PVSButton"), s2 = We("PVSMenu");
  return P(), R("div", Re({ class: a2.containerClass, style: e2.style }, e2.ptmi("root"), { "data-p-severity": e2.severity }), [q(o2, Re({ type: "button", class: e2.cx("pcButton"), label: e2.label, disabled: e2.disabled, severity: e2.severity, text: e2.text, icon: e2.icon, outlined: e2.outlined, size: e2.size, fluid: e2.fluid, "aria-label": e2.label, onClick: a2.onDefaultButtonClick }, e2.buttonProps, { pt: e2.ptm("pcButton"), unstyled: e2.unstyled }), it({ default: H(function() {
    return [Fe(e2.$slots, "default")];
  }), _: 2 }, [e2.$slots.icon ? { name: "icon", fn: H(function(t3) {
    return [Fe(e2.$slots, "icon", { class: I(t3.class) }, function() {
      return [L("span", Re({ class: [e2.icon, t3.class] }, e2.ptm("pcButton").icon, { "data-pc-section": "buttonicon" }), null, 16)];
    })];
  }), key: "0" } : void 0]), 1040, ["class", "label", "disabled", "severity", "text", "icon", "outlined", "size", "fluid", "aria-label", "onClick", "pt", "unstyled"]), q(o2, Re({ ref: "button", type: "button", class: e2.cx("pcDropdown"), disabled: e2.disabled, "aria-haspopup": "true", "aria-expanded": i2.isExpanded, "aria-controls": i2.isExpanded ? e2.$id + "_overlay" : void 0, onClick: a2.onDropdownButtonClick, onKeydown: a2.onDropdownKeydown, severity: e2.severity, text: e2.text, outlined: e2.outlined, size: e2.size, unstyled: e2.unstyled }, e2.menuButtonProps, { pt: e2.ptm("pcDropdown") }), { icon: H(function(t3) {
    return [Fe(e2.$slots, e2.$slots.dropdownicon ? "dropdownicon" : "menubuttonicon", { class: I(t3.class) }, function() {
      return [(P(), W(Ge(e2.menuButtonIcon || e2.dropdownIcon ? "span" : "ChevronDownIcon"), Re({ class: [e2.dropdownIcon || e2.menuButtonIcon, t3.class] }, e2.ptm("pcDropdown").icon, { "data-pc-section": "menubuttonicon" }), null, 16, ["class"]))];
    })];
  }), _: 3 }, 16, ["class", "disabled", "aria-expanded", "aria-controls", "onClick", "onKeydown", "severity", "text", "outlined", "size", "unstyled", "pt"]), q(s2, { ref: "menu", id: e2.$id + "_overlay", model: e2.model, popup: !0, autoZIndex: e2.autoZIndex, baseZIndex: e2.baseZIndex, appendTo: e2.appendTo, unstyled: e2.unstyled, pt: e2.ptm("pcMenu") }, it({ _: 2 }, [e2.$slots.menuitemicon ? { name: "itemicon", fn: H(function(t3) {
    return [Fe(e2.$slots, "menuitemicon", { item: t3.item, class: I(t3.class) })];
  }), key: "0" } : void 0, e2.$slots.item ? { name: "item", fn: H(function(t3) {
    return [Fe(e2.$slots, "item", { item: t3.item, hasSubmenu: t3.hasSubmenu, label: t3.label, props: t3.props })];
  }), key: "1" } : void 0]), 1032, ["id", "model", "autoZIndex", "baseZIndex", "appendTo", "unstyled", "pt"])], 16, KE);
}
GE.render = qE;
export { $r as ConfirmDialog, HE as TieredMenu, GE as SplitButton };
