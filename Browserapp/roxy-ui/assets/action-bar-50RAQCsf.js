import {ci as e,pi as t,v as n} from "./utils-BIWenCnY.js";
import {C as r,E as i,Et as a,H as o,J as s,P as c,St as l,V as u,W as d,X as f,Y as p,Z as m,at as ee,b as h,d as g,en as _,f as v,h as y,i as b,in as x,jt as S,lt as te,m as C,nn as w,p as T,q as ne,rn as E,st as re,ut as D,x as O} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as ie} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as k} from "./locales-BfKu2SD4.js";
import {t as ae} from "./merge-B7DGYZqS.js";
import {n as oe} from "./usetoast-DphSlejX.js";
import {I as A,J as j,M,Z as N,t as P} from "./basecomponent-ClhuVxJN.js";
import {t as F} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {D as I,M as L,O as R,m as z,p as B} from "./dist-DPswMdzV.js";
import {t as V} from "./zindex-cO8iUN-n.js";
import {t as H} from "./ripple-DKjDc6yC.js";
import {t as se} from "./tooltip-BYYKWrvu.js";
import {t as U} from "./style-f2ODP_Xm.js";
import {t as W} from "./angledown-D6F5yPzs.js";
import {t as G} from "./angleright-CRY6qWAP.js";
import {t as K} from "./bars-B77qPS91.js";
import {t as q} from "./toggleswitch-DKDK40Mk.js";
import {r as ce} from "./main-types-DreniZN2.js";
import {t as J} from "./util-C5rl6Moc.js";
var le = { name: "BaseMenubar", extends: P, props: { model: { type: Array, default: null }, buttonProps: { type: null, default: null }, breakpoint: { type: String, default: "960px" }, ariaLabelledby: { type: String, default: null }, ariaLabel: { type: String, default: null } }, style: U, provide: function() {
  return { $pcMenubar: this, $parentInstance: this };
} };
var Y = { name: "MenubarSub", hostName: "Menubar", extends: P, emits: ["item-mouseenter", "item-click", "item-mousemove"], props: { items: { type: Array, default: null }, root: { type: Boolean, default: !1 }, popup: { type: Boolean, default: !1 }, mobileActive: { type: Boolean, default: !1 }, templates: { type: Object, default: null }, level: { type: Number, default: 0 }, menuId: { type: String, default: null }, focusedItemId: { type: String, default: null }, activeItemPath: { type: Object, default: null } }, list: null, methods: { getItemId: function(e2) {
  return `${this.menuId}_${e2.key}`;
}, getItemKey: function(e2) {
  return this.getItemId(e2);
}, getItemProp: function(e2, t2, n2) {
  return e2 && e2.item ? R(e2.item[t2], n2) : void 0;
}, getItemLabel: function(e2) {
  return this.getItemProp(e2, "label");
}, getItemLabelId: function(e2) {
  return `${this.menuId}_${e2.key}_label`;
}, getPTOptions: function(e2, t2, n2) {
  return this.ptm(n2, { context: { item: e2.item, index: t2, active: this.isItemActive(e2), focused: this.isItemFocused(e2), disabled: this.isItemDisabled(e2), level: this.level } });
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
  return L(e2.items);
}, onItemClick: function(e2, t2) {
  this.getItemProp(t2, "command", { originalEvent: e2, item: t2.item }), this.$emit("item-click", { originalEvent: e2, processedItem: t2, isFocus: !0 });
}, onItemMouseEnter: function(e2, t2) {
  this.$emit("item-mouseenter", { originalEvent: e2, processedItem: t2 });
}, onItemMouseMove: function(e2, t2) {
  this.$emit("item-mousemove", { originalEvent: e2, processedItem: t2 });
}, getAriaPosInset: function(e2) {
  return e2 - this.calculateAriaSetSize.slice(0, e2).length + 1;
}, getMenuItemProps: function(e2, t2) {
  return { action: c({ class: this.cx("itemLink"), tabindex: -1 }, this.getPTOptions(e2, t2, "itemLink")), icon: c({ class: [this.cx("itemIcon"), this.getItemProp(e2, "icon")] }, this.getPTOptions(e2, t2, "itemIcon")), label: c({ class: this.cx("itemLabel") }, this.getPTOptions(e2, t2, "itemLabel")), submenuicon: c({ class: this.cx("submenuIcon") }, this.getPTOptions(e2, t2, "submenuIcon")) };
} }, computed: { calculateAriaSetSize: function() {
  var e2 = this;
  return this.items.filter(function(t2) {
    return e2.isItemVisible(t2) && e2.getItemProp(t2, "separator");
  });
}, getAriaSetSize: function() {
  var e2 = this;
  return this.items.filter(function(t2) {
    return e2.isItemVisible(t2) && !e2.getItemProp(t2, "separator");
  }).length;
} }, components: { AngleRightIcon: G, AngleDownIcon: W }, directives: { ripple: H } };
var ue = ["id", "aria-label", "aria-disabled", "aria-expanded", "aria-haspopup", "aria-setsize", "aria-posinset", "data-p-active", "data-p-focused", "data-p-disabled"];
var de = ["onClick", "onMouseenter", "onMousemove"];
var X = ["href", "target"];
var Z = ["id"];
var Q = ["id"];
function fe(e2, t2, n2, r2, i2, a2) {
  var o2 = p("MenubarSub", !0), s2 = f("ripple");
  return d(), y("ul", c({ class: n2.level === 0 ? e2.cx("rootList") : e2.cx("submenu") }, n2.level === 0 ? e2.ptm("rootList") : e2.ptm("submenu")), [(d(!0), y(b, null, ne(n2.items, function(r3, i3) {
    return d(), y(b, { key: a2.getItemKey(r3) }, [a2.isItemVisible(r3) && !a2.getItemProp(r3, "separator") ? (d(), y("li", c({ key: 0, id: a2.getItemId(r3), style: a2.getItemProp(r3, "style"), class: [e2.cx("item", { processedItem: r3 }), a2.getItemProp(r3, "class")], role: "menuitem", "aria-label": a2.getItemLabel(r3), "aria-disabled": a2.isItemDisabled(r3) || void 0, "aria-expanded": a2.isItemGroup(r3) ? a2.isItemActive(r3) : void 0, "aria-haspopup": a2.isItemGroup(r3) && !a2.getItemProp(r3, "to") ? "menu" : void 0, "aria-setsize": a2.getAriaSetSize, "aria-posinset": a2.getAriaPosInset(i3) }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "item"), { "data-p-active": a2.isItemActive(r3), "data-p-focused": a2.isItemFocused(r3), "data-p-disabled": a2.isItemDisabled(r3) }), [v("div", c({ class: e2.cx("itemContent"), onClick: function(e3) {
      return a2.onItemClick(e3, r3);
    }, onMouseenter: function(e3) {
      return a2.onItemMouseEnter(e3, r3);
    }, onMousemove: function(e3) {
      return a2.onItemMouseMove(e3, r3);
    } }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "itemContent")), [n2.templates.item ? (d(), T(m(n2.templates.item), { key: 1, item: r3.item, root: n2.root, hasSubmenu: !!a2.getItemProp(r3, "items"), label: a2.getItemLabel(r3), props: a2.getMenuItemProps(r3, i3) }, null, 8, ["item", "root", "hasSubmenu", "label", "props"])) : D((d(), y("a", c({ key: 0, href: a2.getItemProp(r3, "url"), class: e2.cx("itemLink"), target: a2.getItemProp(r3, "target"), tabindex: "-1" }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "itemLink")), [n2.templates.itemicon ? (d(), T(m(n2.templates.itemicon), { key: 0, item: r3.item, class: _(e2.cx("itemIcon")) }, null, 8, ["item", "class"])) : a2.getItemProp(r3, "icon") ? (d(), y("span", c({ key: 1, class: [e2.cx("itemIcon"), a2.getItemProp(r3, "icon")] }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "itemIcon")), null, 16)) : C("", !0), v("span", c({ id: a2.getItemLabelId(r3), class: e2.cx("itemLabel") }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "itemLabel")), x(a2.getItemLabel(r3)), 17, Z), a2.getItemProp(r3, "items") ? (d(), y(b, { key: 2 }, [n2.templates.submenuicon ? (d(), T(m(n2.templates.submenuicon), { key: 0, root: n2.root, active: a2.isItemActive(r3), class: _(e2.cx("submenuIcon")) }, null, 8, ["root", "active", "class"])) : (d(), T(m(n2.root ? "AngleDownIcon" : "AngleRightIcon"), c({ key: 1, class: e2.cx("submenuIcon") }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "submenuIcon")), null, 16, ["class"]))], 64)) : C("", !0)], 16, X)), [[s2]])], 16, de), a2.isItemVisible(r3) && a2.isItemGroup(r3) ? (d(), T(o2, { key: 0, id: a2.getItemId(r3) + "_list", menuId: n2.menuId, role: "menu", style: E(e2.sx("submenu", !0, { processedItem: r3 })), focusedItemId: n2.focusedItemId, items: r3.items, mobileActive: n2.mobileActive, activeItemPath: n2.activeItemPath, templates: n2.templates, level: n2.level + 1, "aria-labelledby": a2.getItemLabelId(r3), pt: e2.pt, unstyled: e2.unstyled, onItemClick: t2[0] ||= function(t3) {
      return e2.$emit("item-click", t3);
    }, onItemMouseenter: t2[1] ||= function(t3) {
      return e2.$emit("item-mouseenter", t3);
    }, onItemMousemove: t2[2] ||= function(t3) {
      return e2.$emit("item-mousemove", t3);
    } }, null, 8, ["id", "menuId", "style", "focusedItemId", "items", "mobileActive", "activeItemPath", "templates", "level", "aria-labelledby", "pt", "unstyled"])) : C("", !0)], 16, ue)) : C("", !0), a2.isItemVisible(r3) && a2.getItemProp(r3, "separator") ? (d(), y("li", c({ key: 1, id: a2.getItemId(r3), class: [e2.cx("separator"), a2.getItemProp(r3, "class")], style: a2.getItemProp(r3, "style"), role: "separator" }, { ref_for: !0 }, e2.ptm("separator")), null, 16, Q)) : C("", !0)], 64);
  }), 128))], 16);
}
Y.render = fe;
var pe = { name: "Menubar", extends: le, inheritAttrs: !1, emits: ["focus", "blur"], matchMediaListener: null, data: function() {
  return { mobileActive: !1, focused: !1, focusedItemInfo: { index: -1, level: 0, parentKey: "" }, activeItemPath: [], dirty: !1, query: null, queryMatches: !1 };
}, watch: { activeItemPath: function(e2) {
  L(e2) ? (this.bindOutsideClickListener(), this.bindResizeListener()) : (this.unbindOutsideClickListener(), this.unbindResizeListener());
} }, outsideClickListener: null, container: null, menubar: null, mounted: function() {
  this.bindMatchMediaListener();
}, beforeUnmount: function() {
  this.mobileActive = !1, this.unbindOutsideClickListener(), this.unbindResizeListener(), this.unbindMatchMediaListener(), this.container && V.clear(this.container), this.container = null;
}, methods: { getItemProp: function(e2, t2) {
  return e2 ? R(e2[t2]) : void 0;
}, getItemLabel: function(e2) {
  return this.getItemProp(e2, "label");
}, isItemDisabled: function(e2) {
  return this.getItemProp(e2, "disabled");
}, isItemVisible: function(e2) {
  return this.getItemProp(e2, "visible") !== !1;
}, isItemGroup: function(e2) {
  return L(this.getItemProp(e2, "items"));
}, isItemSeparator: function(e2) {
  return this.getItemProp(e2, "separator");
}, getProccessedItemLabel: function(e2) {
  return e2 ? this.getItemLabel(e2.item) : void 0;
}, isProccessedItemGroup: function(e2) {
  return e2 && L(e2.items);
}, toggle: function(e2) {
  var t2 = this;
  this.mobileActive ? (this.mobileActive = !1, V.clear(this.menubar), this.hide()) : (this.mobileActive = !0, V.set("menu", this.menubar, this.$primevue.config.zIndex.menu), setTimeout(function() {
    t2.show();
  }, 1)), this.bindOutsideClickListener(), e2.preventDefault();
}, show: function() {
  A(this.menubar);
}, hide: function(e2, t2) {
  var n2 = this;
  this.mobileActive && (this.mobileActive = !1, setTimeout(function() {
    A(n2.$refs.menubutton);
  }, 0)), this.activeItemPath = [], this.focusedItemInfo = { index: -1, level: 0, parentKey: "" }, t2 && A(this.menubar), this.dirty = !1;
}, onFocus: function(e2) {
  this.focused = !0, this.focusedItemInfo = this.focusedItemInfo.index === -1 ? { index: this.findFirstFocusedItemIndex(), level: 0, parentKey: "" } : this.focusedItemInfo, this.$emit("focus", e2);
}, onBlur: function(e2) {
  this.focused = !1, this.focusedItemInfo = { index: -1, level: 0, parentKey: "" }, this.searchValue = "", this.dirty = !1, this.$emit("blur", e2);
}, onKeyDown: function(e2) {
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
      !t2 && B(e2.key) && this.searchItems(e2, e2.key);
  }
}, onItemChange: function(e2, t2) {
  var n2 = e2.processedItem, r2 = e2.isFocus;
  if (!I(n2)) {
    var i2 = n2.index, a2 = n2.key, o2 = n2.level, s2 = n2.parentKey, c2 = n2.items, l2 = L(c2), u2 = this.activeItemPath.filter(function(e3) {
      return e3.parentKey !== s2 && e3.parentKey !== a2;
    });
    l2 && u2.push(n2), this.focusedItemInfo = { index: i2, level: o2, parentKey: s2 }, l2 && (this.dirty = !0), r2 && A(this.menubar), !(t2 === "hover" && this.queryMatches) && (this.activeItemPath = u2);
  }
}, onItemClick: function(e2) {
  var t2 = e2.originalEvent, n2 = e2.processedItem, r2 = this.isProccessedItemGroup(n2), i2 = I(n2.parent);
  if (this.isSelected(n2)) {
    var a2 = n2.index, o2 = n2.key, s2 = n2.level, c2 = n2.parentKey;
    this.activeItemPath = this.activeItemPath.filter(function(e3) {
      return o2 !== e3.key && o2.startsWith(e3.key);
    }), this.focusedItemInfo = { index: a2, level: s2, parentKey: c2 }, this.dirty = !i2, A(this.menubar);
  } else if (r2) this.onItemChange(e2);
  else {
    var l2 = i2 ? n2 : this.activeItemPath.find(function(e3) {
      return e3.parentKey === "";
    });
    this.hide(t2), this.changeFocusedItemIndex(t2, l2 ? l2.index : -1), this.mobileActive = !1, A(this.menubar);
  }
}, onItemMouseEnter: function(e2) {
  this.dirty && this.onItemChange(e2, "hover");
}, onItemMouseMove: function(e2) {
  this.focused && this.changeFocusedItemIndex(e2, e2.processedItem.index);
}, menuButtonClick: function(e2) {
  this.toggle(e2);
}, menuButtonKeydown: function(e2) {
  (e2.code === "Enter" || e2.code === "NumpadEnter" || e2.code === "Space") && this.menuButtonClick(e2);
}, onArrowDownKey: function(e2) {
  var t2 = this.visibleItems[this.focusedItemInfo.index];
  if (t2 && I(t2.parent)) this.isProccessedItemGroup(t2) && (this.onItemChange({ originalEvent: e2, processedItem: t2 }), this.focusedItemInfo = { index: -1, parentKey: t2.key }, this.onArrowRightKey(e2));
  else {
    var n2 = this.focusedItemInfo.index === -1 ? this.findFirstFocusedItemIndex() : this.findNextItemIndex(this.focusedItemInfo.index);
    this.changeFocusedItemIndex(e2, n2);
  }
  e2.preventDefault();
}, onArrowUpKey: function(e2) {
  var t2 = this, n2 = this.visibleItems[this.focusedItemInfo.index];
  if (I(n2.parent)) {
    if (this.isProccessedItemGroup(n2)) {
      this.onItemChange({ originalEvent: e2, processedItem: n2 }), this.focusedItemInfo = { index: -1, parentKey: n2.key };
      var r2 = this.findLastItemIndex();
      this.changeFocusedItemIndex(e2, r2);
    }
  } else {
    var i2 = this.activeItemPath.find(function(e3) {
      return e3.key === n2.parentKey;
    });
    if (this.focusedItemInfo.index === 0) this.focusedItemInfo = { index: -1, parentKey: i2 ? i2.parentKey : "" }, this.searchValue = "", this.onArrowLeftKey(e2), this.activeItemPath = this.activeItemPath.filter(function(e3) {
      return e3.parentKey !== t2.focusedItemInfo.parentKey;
    });
    else {
      var a2 = this.focusedItemInfo.index === -1 ? this.findLastFocusedItemIndex() : this.findPrevItemIndex(this.focusedItemInfo.index);
      this.changeFocusedItemIndex(e2, a2);
    }
  }
  e2.preventDefault();
}, onArrowLeftKey: function(e2) {
  var t2 = this, n2 = this.visibleItems[this.focusedItemInfo.index], r2 = n2 ? this.activeItemPath.find(function(e3) {
    return e3.key === n2.parentKey;
  }) : null;
  if (r2) this.onItemChange({ originalEvent: e2, processedItem: r2 }), this.activeItemPath = this.activeItemPath.filter(function(e3) {
    return e3.parentKey !== t2.focusedItemInfo.parentKey;
  }), e2.preventDefault();
  else {
    var i2 = this.focusedItemInfo.index === -1 ? this.findLastFocusedItemIndex() : this.findPrevItemIndex(this.focusedItemInfo.index);
    this.changeFocusedItemIndex(e2, i2), e2.preventDefault();
  }
}, onArrowRightKey: function(e2) {
  var t2 = this.visibleItems[this.focusedItemInfo.index];
  if (t2 && this.activeItemPath.find(function(e3) {
    return e3.key === t2.parentKey;
  })) this.isProccessedItemGroup(t2) && (this.onItemChange({ originalEvent: e2, processedItem: t2 }), this.focusedItemInfo = { index: -1, parentKey: t2.key }, this.onArrowDownKey(e2));
  else {
    var n2 = this.focusedItemInfo.index === -1 ? this.findFirstFocusedItemIndex() : this.findNextItemIndex(this.focusedItemInfo.index);
    this.changeFocusedItemIndex(e2, n2), e2.preventDefault();
  }
}, onHomeKey: function(e2) {
  this.changeFocusedItemIndex(e2, this.findFirstItemIndex()), e2.preventDefault();
}, onEndKey: function(e2) {
  this.changeFocusedItemIndex(e2, this.findLastItemIndex()), e2.preventDefault();
}, onEnterKey: function(e2) {
  if (this.focusedItemInfo.index !== -1) {
    var t2 = j(this.menubar, `li[id="${`${this.focusedItemId}`}"]`), n2 = t2 && j(t2, 'a[data-pc-section="itemlink"]');
    n2 ? n2.click() : t2 && t2.click();
    var r2 = this.visibleItems[this.focusedItemInfo.index];
    !this.isProccessedItemGroup(r2) && (this.focusedItemInfo.index = this.findFirstFocusedItemIndex());
  }
  e2.preventDefault();
}, onSpaceKey: function(e2) {
  this.onEnterKey(e2);
}, onEscapeKey: function(e2) {
  if (this.focusedItemInfo.level !== 0) {
    var t2 = this.focusedItemInfo;
    this.hide(e2, !1), this.focusedItemInfo = { index: Number(t2.parentKey.split("_")[0]), level: 0, parentKey: "" };
  }
  e2.preventDefault();
}, onTabKey: function(e2) {
  if (this.focusedItemInfo.index !== -1) {
    var t2 = this.visibleItems[this.focusedItemInfo.index];
    !this.isProccessedItemGroup(t2) && this.onItemChange({ originalEvent: e2, processedItem: t2 });
  }
  this.hide();
}, bindOutsideClickListener: function() {
  var e2 = this;
  this.outsideClickListener || (this.outsideClickListener = function(t2) {
    var n2 = e2.container && !e2.container.contains(t2.target), r2 = !e2.target || e2.target !== t2.target && !e2.target.contains(t2.target);
    n2 && r2 && e2.hide();
  }, document.addEventListener("click", this.outsideClickListener, !0));
}, unbindOutsideClickListener: function() {
  this.outsideClickListener &&= (document.removeEventListener("click", this.outsideClickListener, !0), null);
}, bindResizeListener: function() {
  var e2 = this;
  this.resizeListener || (this.resizeListener = function(t2) {
    M() || e2.hide(t2, !0), e2.mobileActive = !1;
  }, globalThis.__localListenWindow("resize", this.resizeListener));
}, unbindResizeListener: function() {
  this.resizeListener &&= (window.removeEventListener("resize", this.resizeListener), null);
}, bindMatchMediaListener: function() {
  var e2 = this;
  if (!this.matchMediaListener) {
    var t2 = matchMedia(`(max-width: ${this.breakpoint})`);
    this.query = t2, this.queryMatches = t2.matches, this.matchMediaListener = function() {
      e2.queryMatches = t2.matches, e2.mobileActive = !1;
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
  return z(this.visibleItems, function(t2) {
    return e2.isValidItem(t2);
  });
}, findNextItemIndex: function(e2) {
  var t2 = this, n2 = e2 < this.visibleItems.length - 1 ? this.visibleItems.slice(e2 + 1).findIndex(function(e3) {
    return t2.isValidItem(e3);
  }) : -1;
  return n2 > -1 ? n2 + e2 + 1 : e2;
}, findPrevItemIndex: function(e2) {
  var t2 = this, n2 = e2 > 0 ? z(this.visibleItems.slice(0, e2), function(e3) {
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
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : -1, t2 = e2 === -1 ? this.focusedItemId : `${this.$id}_${e2}`, n2 = j(this.menubar, `li[id="${t2}"]`);
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
  return this.focusedItemInfo.index === -1 ? null : `${this.$id}${L(this.focusedItemInfo.parentKey) ? "_" + this.focusedItemInfo.parentKey : ""}_${this.focusedItemInfo.index}`;
} }, components: { MenubarSub: Y, BarsIcon: K } };
function $(e2) {
  "@babel/helpers - typeof";
  return $ = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, $(e2);
}
function me(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function he(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? me(Object(n2), !0).forEach(function(t3) {
      ge(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : me(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function ge(e2, t2, n2) {
  return (t2 = _e(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function _e(e2) {
  var t2 = ve(e2, "string");
  return $(t2) == "symbol" ? t2 : t2 + "";
}
function ve(e2, t2) {
  if ($(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if ($(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var ye = ["aria-haspopup", "aria-expanded", "aria-controls", "aria-label"];
function be(e2, t2, n2, r2, a2, o2) {
  var l2 = p("BarsIcon"), u2 = p("MenubarSub");
  return d(), y("div", c({ ref: o2.containerRef, class: e2.cx("root") }, e2.ptmi("root")), [e2.$slots.start ? (d(), y("div", c({ key: 0, class: e2.cx("start") }, e2.ptm("start")), [s(e2.$slots, "start")], 16)) : C("", !0), s(e2.$slots, e2.$slots.button ? "button" : "menubutton", { id: e2.$id, class: _(e2.cx("button")), toggleCallback: function(e3) {
    return o2.menuButtonClick(e3);
  } }, function() {
    return [e2.model && e2.model.length > 0 ? (d(), y("a", c({ key: 0, ref: "menubutton", role: "button", tabindex: "0", class: e2.cx("button"), "aria-haspopup": !!(e2.model.length && e2.model.length > 0), "aria-expanded": a2.mobileActive, "aria-controls": e2.$id, "aria-label": e2.$primevue.config.locale.aria?.navigation, onClick: t2[0] ||= function(e3) {
      return o2.menuButtonClick(e3);
    }, onKeydown: t2[1] ||= function(e3) {
      return o2.menuButtonKeydown(e3);
    } }, he(he({}, e2.buttonProps), e2.ptm("button"))), [s(e2.$slots, e2.$slots.buttonicon ? "buttonicon" : "menubuttonicon", {}, function() {
      return [O(l2, w(i(e2.ptm("buttonicon"))), null, 16)];
    })], 16, ye)) : C("", !0)];
  }), O(u2, { ref: o2.menubarRef, id: e2.$id + "_list", role: "menubar", items: o2.processedItems, templates: e2.$slots, root: !0, mobileActive: a2.mobileActive, tabindex: "0", "aria-activedescendant": a2.focused ? o2.focusedItemId : void 0, menuId: e2.$id, focusedItemId: a2.focused ? o2.focusedItemId : void 0, activeItemPath: a2.activeItemPath, level: 0, "aria-labelledby": e2.ariaLabelledby, "aria-label": e2.ariaLabel, pt: e2.pt, unstyled: e2.unstyled, onFocus: o2.onFocus, onBlur: o2.onBlur, onKeydown: o2.onKeyDown, onItemClick: o2.onItemClick, onItemMouseenter: o2.onItemMouseEnter, onItemMousemove: o2.onItemMouseMove }, null, 8, ["id", "items", "templates", "mobileActive", "aria-activedescendant", "menuId", "focusedItemId", "activeItemPath", "aria-labelledby", "aria-label", "pt", "unstyled", "onFocus", "onBlur", "onKeydown", "onItemClick", "onItemMouseenter", "onItemMousemove"]), e2.$slots.end ? (d(), y("div", c({ key: 1, class: e2.cx("end") }, e2.ptm("end")), [s(e2.$slots, "end")], 16)) : C("", !0)], 16);
}
pe.render = be;
var xe = t ? "windows" : "mac";
function Se(e2) {
  let t2 = e2.value.shortcutKey[xe];
  return [{ label: k("\u7A97\u53E3\u5E03\u5C40"), icon: "base/rx_ic_layout", items: [{ label: k("\u5BAB\u683C\u5E03\u5C40"), shortcutKey: t2.gridLayout, command: () => {
    globalThis.electronAPI.send("syncControl:doLayout", { type: "grid" });
  } }, { label: k("\u5806\u53E0\u5E03\u5C40"), shortcutKey: t2.stackLayout, command: () => {
    globalThis.electronAPI.send("syncControl:doLayout", { type: "stack" });
  } }, { separator: !0 }, { label: k("\u81EA\u5B9A\u4E49"), command: () => {
    globalThis.electronAPI.send("syncControl:openPreferencesDialog", { tab: "customLayout" });
  } }] }, { label: k("\u6279\u91CF\u8F93\u5165"), icon: "base/rx_ic_keyboard", command: () => {
    globalThis.electronAPI.send("syncControl:openBatchInputsDialog");
  } }, { label: k("\u6807\u7B7E\u63A7\u5236"), icon: "base/rx_ic_tabs", items: [{ id: "unifyTabs", label: k("\u7EDF\u4E00\u6807\u7B7E\u9875"), hidden: !0, shortcutKey: t2.unifiedTabs, command: () => {
    globalThis.electronAPI.send("syncControl:unifyTabs");
  } }, { label: k("\u5173\u95ED\u5176\u4ED6\u6807\u7B7E\u9875"), shortcutKey: t2.closeOtherTabs, command: () => {
    globalThis.electronAPI.send("syncControl:closeOtherTabs");
  } }, { label: k("\u5173\u95ED\u5F53\u524D\u6807\u7B7E\u9875"), shortcutKey: t2.closeCurrentTab, command: () => {
    globalThis.electronAPI.send("syncControl:closeCurrentTab");
  } }, { id: "closeBlankTabs", label: k("\u5173\u95ED\u7A7A\u767D\u9875\u7B7E"), shortcutKey: t2.closeBlankTabs, command: () => {
    globalThis.electronAPI.send("syncControl:closeBlankTabs");
  } }, { separator: !0 }, { id: "openOpenSitesDialog", label: k("\u6253\u5F00\u7F51\u5740"), shortcutKey: t2.openSites, command: () => {
    globalThis.electronAPI.send("syncControl:openOpenSitesDialog");
  } }] }, { label: k("\u4EFF\u771F\u64CD\u4F5C"), icon: "base/rx_ic_finger_tap", items: [{ label: k("\u70B9\u51FB\u5EF6\u8FDF"), labelTip: k("\u70B9\u51FB\u5EF6\u8FDF"), suffix: () => O(q, { modelValue: e2.value.simulate.enableClickDelay, "onUpdate:modelValue": (t3) => e2.value.simulate.enableClickDelay = t3 }, null) }, { label: k("\u8F93\u5165\u5EF6\u8FDF"), suffix: () => O(q, { modelValue: e2.value.simulate.enableInputDelay, "onUpdate:modelValue": (t3) => e2.value.simulate.enableInputDelay = t3 }, null) }, { separator: !0 }, { label: k("\u4EFF\u771F\u53C2\u6570\u8BBE\u7F6E"), command: () => {
    globalThis.electronAPI.send("syncControl:openPreferencesDialog", { tab: "simulate" });
  } }] }];
}
var Ce = { class: "top-bar" };
var we = { class: "actions" };
var Te = { ref: "bottomBar", class: "bottom-bar" };
var Ee = { class: "menubar-container" };
var De = ["href", "target"];
var Oe = { class: "operation-label" };
var ke = { key: 2, class: "shortcut-key" };
var Ae = { key: 3, class: "pi pi-fw pi-angle-down" };
var je = { key: 0, class: "tips" };
var Me = F(r({ __name: "index", setup(r2) {
  let i2 = t ? "windows" : "mac", s2 = l(!1), { getUserConfig: f2 } = n(), p2 = ee("actionBar"), _2 = ee("bottomBar"), w2 = l(!1), ne2 = l("auto"), k2 = l(0), A2 = l(ce), j2 = l(Se(A2)), M2 = null, P2 = null, F2 = l(!0), I2 = l(!1), L2 = oe(), R2 = g(() => I2.value ? "base/rx_ic_renew" : F2.value ? "base/rx_ic_pause2" : "base/rx_ic_play");
  e();
  let z2 = null;
  function B2() {
    e(), z2 = requestAnimationFrame(B2);
  }
  B2(), setTimeout(() => {
    cancelAnimationFrame(z2);
  }, 5e3);
  let V2 = g(() => {
    let e2 = A2.value.shortcutKey[i2].openSyncWindowList;
    return $t("\u540C\u6B65\u7A97\u53E3\u5217\u8868") + (e2 ? ` (${e2})` : "");
  }), U2 = g(() => {
    let e2 = A2.value.shortcutKey[i2].openPreferenceSettings;
    return $t("\u8BBE\u7F6E") + (e2 ? ` (${e2})` : "");
  });
  re(s2, (e2) => {
  });
  function W2() {
    clearTimeout(M2), console.log("handleMouseenter"), Q2();
  }
  function G2() {
    clearTimeout(M2), console.log("handleMouseleave"), M2 = setTimeout(() => {
      p2.value?.classList.remove("hover");
    }, 1900), _2.value?.click();
  }
  globalThis.__localListenWindow("blur", G2), globalThis.__localListenWindow("mouseup", () => {
    clearTimeout(P2), s2.value = !1;
  });
  function K2(e2) {
    P2 = setTimeout(() => {
      s2.value = !0;
    }, 100);
  }
  function q2() {
    F2.value && (console.log("handleMouseenterSyncText"), p2.value.classList.add("hover"));
  }
  function le2() {
    globalThis.electronAPI.send("syncControl:showAll"), setTimeout(() => {
    }, 100);
  }
  function Y2() {
    globalThis.electronAPI.send("syncControl:stop");
  }
  async function ue2() {
    if (!I2.value) {
      I2.value = !0;
      try {
        F2.value ? (await globalThis.electronAPI.send("syncControl:pause"), p2.value?.classList.remove("hover"), _2.value?.click()) : await globalThis.electronAPI.send("syncControl:resume"), F2.value = !F2.value;
      } catch {
        L2.add({ severity: "error", summary: $t("\u64CD\u4F5C\u5931\u8D25"), life: 3e3 });
      } finally {
        I2.value = !1;
      }
    }
  }
  function de2() {
    globalThis.electronAPI.send("syncControl:openPreferencesDialog");
  }
  function X2() {
    globalThis.electronAPI.send("syncControl:openSyncingWindowListDialog");
  }
  globalThis.electronAPI.on("browser:on-close", (e2) => {
    Z2();
  });
  async function Z2() {
    let e2 = await globalThis.electronAPI.send("syncControl:getAllSyncingWindows");
    console.log("windowList", e2), w2.value = e2.some((t2) => t2.coreVersion !== e2[0].coreVersion);
  }
  async function Q2() {
    let e2 = await f2(!0);
    e2?.preferenceSettings && (Object.keys(A2.value).forEach((t2) => {
      Reflect.has(e2.preferenceSettings, t2) && ae(A2.value[t2], e2.preferenceSettings[t2]);
    }), j2.value = Se(A2));
  }
  u(async () => {
    setTimeout(() => {
      ne2.value = p2.value ? getComputedStyle(p2.value).width : "auto", document.body.style.pointerEvents = "auto";
    }, 60), Z2(), await Q2(), re(A2, (e2) => {
      J(e2);
    }, { deep: !0 });
  }), globalThis.electronAPI.on("syncControl:toggleClickDelay", () => {
    A2.value.simulate.enableClickDelay = !A2.value.simulate.enableClickDelay, J(a(A2.value));
  }), globalThis.electronAPI.on("syncControl:toggleInputDelay", () => {
    A2.value.simulate.enableInputDelay = !A2.value.simulate.enableInputDelay, J(a(A2.value));
  }), globalThis.electronAPI.send("syncControl:getSyncWindowCount").then((e2) => {
    k2.value = e2;
  });
  let fe2 = globalThis.electronAPI.on("syncControl:syncWindowCountChange", (e2) => {
    k2.value = e2;
  });
  return o(() => {
    fe2(), cancelAnimationFrame(z2), clearTimeout(M2), clearTimeout(P2);
  }), (e2, t2) => {
    let n2 = pe, r3 = H, i3 = se;
    return d(), y("div", { ref: "actionBar", class: "action-bar", onMouseenter: W2, onMouseleave: G2, onMousedown: K2 }, [v("div", Ce, [v("div", { class: "sync-text", onMouseenter: q2, style: E({ color: S(F2) ? "#0cef4c" : "#898989" }) }, [S(F2) ? (d(), y(b, { key: 0 }, [h(x(e2.$t("{count} \u4E2A\u7A97\u53E3\u6B63\u5728\u540C\u6B65\u4E2D", { count: S(k2) })), 1)], 64)) : (d(), y(b, { key: 1 }, [h(x(e2.$t("\u5DF2\u6682\u505C\u540C\u6B65")), 1)], 64)), t2[1] ||= v("div", { class: "dots" }, null, -1)], 36), v("div", we, [v("div", { class: "action-item", onClick: le2 }, [O(S(N), { name: "base/rx_ic_show_profile" }), h(" " + x(e2.$t("\u663E\u793A\u6240\u6709\u7A97\u53E3")), 1)]), v("div", { class: "action-item", onClick: ue2 }, [O(S(N), { name: S(R2) }, null, 8, ["name"]), h(" " + x(S(F2) ? e2.$t("\u6682\u505C\u540C\u6B65") : e2.$t("\u6062\u590D\u540C\u6B65")), 1)]), v("div", { class: "action-item stop", onClick: Y2 }, [O(S(N), { name: "base/rx_ic_shut_down" }), h(" " + x(e2.$t("\u505C\u6B62\u540C\u6B65")), 1)])])]), v("div", Te, [v("div", Ee, [O(n2, { model: S(j2) }, { item: te(({ item: e3, props: n3, hasSubmenu: i4 }) => [D((d(), y("a", c({ href: e3.url, target: e3.target }, n3.action), [e3.icon ? (d(), T(S(N), { key: 0, name: e3.icon, size: "16px" }, null, 8, ["name"])) : C("", !0), v("span", Oe, x(e3.label), 1), e3.suffix ? (d(), y("span", { key: 1, onClick: t2[0] ||= ie(() => {
    }, ["stop"]) }, [(d(), T(m(e3.suffix)))])) : C("", !0), e3.shortcutKey ? (d(), y("span", ke, x(e3.shortcutKey), 1)) : C("", !0), i4 ? (d(), y("span", Ae)) : C("", !0)], 16, De)), [[r3]])]), _: 1 }, 8, ["model"]), t2[2] ||= v("div", { class: "split-line" }, null, -1), D((d(), y("div", { class: "other-item", onClick: X2 }, [O(S(N), { name: "base/rx_ic_list_2" })])), [[i3, { value: S(V2), pt: { text: "!whitespace-nowrap !break-keep" } }, void 0, { top: !0 }]]), D((d(), y("div", { class: "other-item", onClick: de2 }, [O(S(N), { name: "base/rx_ic_gear" })])), [[i3, S(U2), void 0, { top: !0 }]])]), S(w2) ? (d(), y("div", je, x(e2.$t("\u6CE8\u610F\uFF1A\u7A97\u53E3\u7684\u5185\u6838\u4E0D\u4E00\u81F4\u53EF\u80FD\u4F1A\u5F71\u54CD\u540C\u6B65\u64CD\u4F5C\u7684\u6548\u679C")), 1)) : C("", !0)], 512)], 544);
  };
} }), [["__scopeId", "data-v-fe4e5a5c"]]);
export {Me as default};