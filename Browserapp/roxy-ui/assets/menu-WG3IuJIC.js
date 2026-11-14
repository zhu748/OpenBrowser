import {J as e,P as t,W as n,X as r,Y as i,Z as a,b as o,en as s,f as c,h as l,i as u,in as d,lt as f,m as p,p as m,q as h,ut as g,x as _} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as v} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {I as y,J as b,K as x,M as S,X as C,c as w,j as T,t as E,w as D} from "./basecomponent-ClhuVxJN.js";
import {O} from "./dist-DPswMdzV.js";
import {t as k} from "./zindex-cO8iUN-n.js";
import {t as A} from "./ripple-DKjDc6yC.js";
import {t as j} from "./utils-i4uei9-Y.js";
import {t as M} from "./style-Dh_I5WGt.js";
import {t as N} from "./portal-Cm1Im7J-.js";
import {t as P} from "./overlayeventbus-B9Z9smtH.js";
var F = { name: "BaseMenu", extends: E, props: { popup: { type: Boolean, default: !1 }, model: { type: Array, default: null }, appendTo: { type: [String, Object], default: "body" }, autoZIndex: { type: Boolean, default: !0 }, baseZIndex: { type: Number, default: 0 }, tabindex: { type: Number, default: 0 }, ariaLabel: { type: String, default: null }, ariaLabelledby: { type: String, default: null } }, style: M, provide: function() {
  return { $pcMenu: this, $parentInstance: this };
} };
var I = { name: "Menuitem", hostName: "Menu", extends: E, inheritAttrs: !1, emits: ["item-click", "item-mousemove"], props: { item: null, templates: null, id: null, focusedOptionId: null, index: null }, methods: { getItemProp: function(e2, t2) {
  return e2 && e2.item ? O(e2.item[t2]) : void 0;
}, getPTOptions: function(e2) {
  return this.ptm(e2, { context: { item: this.item, index: this.index, focused: this.isItemFocused(), disabled: this.disabled() } });
}, isItemFocused: function() {
  return this.focusedOptionId === this.id;
}, onItemClick: function(e2) {
  var t2 = this.getItemProp(this.item, "command");
  t2 && t2({ originalEvent: e2, item: this.item.item }), this.$emit("item-click", { originalEvent: e2, item: this.item, id: this.id });
}, onItemMouseMove: function(e2) {
  this.$emit("item-mousemove", { originalEvent: e2, item: this.item, id: this.id });
}, visible: function() {
  return typeof this.item.visible == "function" ? this.item.visible() : this.item.visible !== !1;
}, disabled: function() {
  return typeof this.item.disabled == "function" ? this.item.disabled() : this.item.disabled;
}, label: function() {
  return typeof this.item.label == "function" ? this.item.label() : this.item.label;
}, getMenuItemProps: function(e2) {
  return { action: t({ class: this.cx("itemLink"), tabindex: "-1" }, this.getPTOptions("itemLink")), icon: t({ class: [this.cx("itemIcon"), e2.icon] }, this.getPTOptions("itemIcon")), label: t({ class: this.cx("itemLabel") }, this.getPTOptions("itemLabel")) };
} }, computed: { dataP: function() {
  return C({ focus: this.isItemFocused(), disabled: this.disabled() });
} }, directives: { ripple: A } };
var L = ["id", "aria-label", "aria-disabled", "data-p-focused", "data-p-disabled", "data-p"];
var R = ["data-p"];
var z = ["href", "target"];
var B = ["data-p"];
var V = ["data-p"];
function H(e2, i2, o2, u2, f2, h2) {
  var _2 = r("ripple");
  return h2.visible() ? (n(), l("li", t({ key: 0, id: o2.id, class: [e2.cx("item"), o2.item.class], role: "menuitem", style: o2.item.style, "aria-label": h2.label(), "aria-disabled": h2.disabled(), "data-p-focused": h2.isItemFocused(), "data-p-disabled": h2.disabled() || !1, "data-p": h2.dataP }, h2.getPTOptions("item")), [c("div", t({ class: e2.cx("itemContent"), onClick: i2[0] ||= function(e3) {
    return h2.onItemClick(e3);
  }, onMousemove: i2[1] ||= function(e3) {
    return h2.onItemMouseMove(e3);
  }, "data-p": h2.dataP }, h2.getPTOptions("itemContent")), [o2.templates.item ? o2.templates.item ? (n(), m(a(o2.templates.item), { key: 1, item: o2.item, label: h2.label(), props: h2.getMenuItemProps(o2.item) }, null, 8, ["item", "label", "props"])) : p("", !0) : g((n(), l("a", t({ key: 0, href: o2.item.url, class: e2.cx("itemLink"), target: o2.item.target, tabindex: "-1" }, h2.getPTOptions("itemLink")), [o2.templates.itemicon ? (n(), m(a(o2.templates.itemicon), { key: 0, item: o2.item, class: s(e2.cx("itemIcon")) }, null, 8, ["item", "class"])) : o2.item.icon ? (n(), l("span", t({ key: 1, class: [e2.cx("itemIcon"), o2.item.icon], "data-p": h2.dataP }, h2.getPTOptions("itemIcon")), null, 16, B)) : p("", !0), c("span", t({ class: e2.cx("itemLabel"), "data-p": h2.dataP }, h2.getPTOptions("itemLabel")), d(h2.label()), 17, V)], 16, z)), [[_2]])], 16, R)], 16, L)) : p("", !0);
}
I.render = H;
function U(e2) {
  return q(e2) || K(e2) || G(e2) || W();
}
function W() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function G(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return J(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? J(e2, t2) : void 0;
  }
}
function K(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function q(e2) {
  if (Array.isArray(e2)) return J(e2);
}
function J(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
var Y = { name: "Menu", extends: F, inheritAttrs: !1, emits: ["show", "hide", "focus", "blur"], data: function() {
  return { overlayVisible: !1, focused: !1, focusedOptionIndex: -1, selectedOptionIndex: -1 };
}, target: null, outsideClickListener: null, scrollHandler: null, resizeListener: null, container: null, list: null, mounted: function() {
  this.popup || (this.bindResizeListener(), this.bindOutsideClickListener());
}, beforeUnmount: function() {
  this.unbindResizeListener(), this.unbindOutsideClickListener(), this.scrollHandler &&= (this.scrollHandler.destroy(), null), this.target = null, this.container && this.autoZIndex && k.clear(this.container), this.container = null;
}, methods: { itemClick: function(e2) {
  var t2 = e2.item;
  this.disabled(t2) || (t2.command && t2.command(e2), this.overlayVisible && this.hide(), !this.popup && this.focusedOptionIndex !== e2.id && (this.focusedOptionIndex = e2.id));
}, itemMouseMove: function(e2) {
  this.focused && (this.focusedOptionIndex = e2.id);
}, onListFocus: function(e2) {
  this.focused = !0, !this.popup && this.changeFocusedOptionIndex(0), this.$emit("focus", e2);
}, onListBlur: function(e2) {
  this.focused = !1, this.focusedOptionIndex = -1, this.$emit("blur", e2);
}, onListKeyDown: function(e2) {
  switch (e2.code) {
    case "ArrowDown":
      this.onArrowDownKey(e2);
      break;
    case "ArrowUp":
      this.onArrowUpKey(e2);
      break;
    case "Home":
      this.onHomeKey(e2);
      break;
    case "End":
      this.onEndKey(e2);
      break;
    case "Enter":
    case "NumpadEnter":
      this.onEnterKey(e2);
      break;
    case "Space":
      this.onSpaceKey(e2);
      break;
    case "Escape":
      this.popup && (y(this.target), this.hide());
    case "Tab":
      this.overlayVisible && this.hide();
  }
}, onArrowDownKey: function(e2) {
  var t2 = this.findNextOptionIndex(this.focusedOptionIndex);
  this.changeFocusedOptionIndex(t2), e2.preventDefault();
}, onArrowUpKey: function(e2) {
  if (e2.altKey && this.popup) y(this.target), this.hide(), e2.preventDefault();
  else {
    var t2 = this.findPrevOptionIndex(this.focusedOptionIndex);
    this.changeFocusedOptionIndex(t2), e2.preventDefault();
  }
}, onHomeKey: function(e2) {
  this.changeFocusedOptionIndex(0), e2.preventDefault();
}, onEndKey: function(e2) {
  this.changeFocusedOptionIndex(T(this.container, 'li[data-pc-section="item"][data-p-disabled="false"]').length - 1), e2.preventDefault();
}, onEnterKey: function(e2) {
  var t2 = b(this.list, `li[id="${`${this.focusedOptionIndex}`}"]`), n2 = t2 && b(t2, 'a[data-pc-section="itemlink"]');
  this.popup && y(this.target), n2 ? n2.click() : t2 && t2.click(), e2.preventDefault();
}, onSpaceKey: function(e2) {
  this.onEnterKey(e2);
}, findNextOptionIndex: function(e2) {
  var t2 = U(T(this.container, 'li[data-pc-section="item"][data-p-disabled="false"]')).findIndex(function(t3) {
    return t3.id === e2;
  });
  return t2 > -1 ? t2 + 1 : 0;
}, findPrevOptionIndex: function(e2) {
  var t2 = U(T(this.container, 'li[data-pc-section="item"][data-p-disabled="false"]')).findIndex(function(t3) {
    return t3.id === e2;
  });
  return t2 > -1 ? t2 - 1 : 0;
}, changeFocusedOptionIndex: function(e2) {
  var t2 = T(this.container, 'li[data-pc-section="item"][data-p-disabled="false"]'), n2 = e2 >= t2.length ? t2.length - 1 : e2 < 0 ? 0 : e2;
  n2 > -1 && (this.focusedOptionIndex = t2[n2].getAttribute("id"));
}, toggle: function(e2, t2) {
  this.overlayVisible ? this.hide() : this.show(e2, t2);
}, show: function(e2, t2) {
  this.overlayVisible = !0, this.target = t2 ?? e2.currentTarget;
}, hide: function() {
  this.overlayVisible = !1, this.target = null;
}, onEnter: function(e2) {
  D(e2, { position: "absolute", top: "0" }), this.alignOverlay(), this.bindOutsideClickListener(), this.bindResizeListener(), this.bindScrollListener(), this.autoZIndex && k.set("menu", e2, this.baseZIndex || this.$primevue.config.zIndex.menu), this.popup && y(this.list), this.$emit("show");
}, onLeave: function() {
  this.unbindOutsideClickListener(), this.unbindResizeListener(), this.unbindScrollListener(), this.$emit("hide");
}, onAfterLeave: function(e2) {
  this.autoZIndex && k.clear(e2);
}, alignOverlay: function() {
  w(this.container, this.target), x(this.target) > x(this.container) && (this.container.style.minWidth = x(this.target) + "px");
}, bindOutsideClickListener: function() {
  var e2 = this;
  this.outsideClickListener || (this.outsideClickListener = function(t2) {
    var n2 = e2.container && !e2.container.contains(t2.target), r2 = !e2.target || e2.target !== t2.target && !e2.target.contains(t2.target);
    e2.overlayVisible && n2 && r2 ? e2.hide() : !e2.popup && n2 && r2 && (e2.focusedOptionIndex = -1);
  }, document.addEventListener("click", this.outsideClickListener, !0));
}, unbindOutsideClickListener: function() {
  this.outsideClickListener &&= (document.removeEventListener("click", this.outsideClickListener, !0), null);
}, bindScrollListener: function() {
  var e2 = this;
  this.scrollHandler ||= new j(this.target, function() {
    e2.overlayVisible && e2.hide();
  }), this.scrollHandler.bindScrollListener();
}, unbindScrollListener: function() {
  this.scrollHandler && this.scrollHandler.unbindScrollListener();
}, bindResizeListener: function() {
  var e2 = this;
  this.resizeListener || (this.resizeListener = function() {
    e2.overlayVisible && !S() && e2.hide();
  }, window.addEventListener("resize", this.resizeListener));
}, unbindResizeListener: function() {
  this.resizeListener &&= (window.removeEventListener("resize", this.resizeListener), null);
}, visible: function(e2) {
  return typeof e2.visible == "function" ? e2.visible() : e2.visible !== !1;
}, disabled: function(e2) {
  return typeof e2.disabled == "function" ? e2.disabled() : e2.disabled;
}, label: function(e2) {
  return typeof e2.label == "function" ? e2.label() : e2.label;
}, onOverlayClick: function(e2) {
  P.emit("overlay-click", { originalEvent: e2, target: this.target });
}, containerRef: function(e2) {
  this.container = e2;
}, listRef: function(e2) {
  this.list = e2;
} }, computed: { focusedOptionId: function() {
  return this.focusedOptionIndex === -1 ? null : this.focusedOptionIndex;
}, dataP: function() {
  return C({ popup: this.popup });
} }, components: { PVMenuitem: I, Portal: N } };
var X = ["id", "data-p"];
var Z = ["id", "tabindex", "aria-activedescendant", "aria-label", "aria-labelledby"];
var Q = ["id"];
function $(r2, a2, s2, g2, y2, b2) {
  var x2 = i("PVMenuitem"), S2 = i("Portal");
  return n(), m(S2, { appendTo: r2.appendTo, disabled: !r2.popup }, { default: f(function() {
    return [_(v, t({ name: "p-anchored-overlay", onEnter: b2.onEnter, onLeave: b2.onLeave, onAfterLeave: b2.onAfterLeave }, r2.ptm("transition")), { default: f(function() {
      return [!r2.popup || y2.overlayVisible ? (n(), l("div", t({ key: 0, ref: b2.containerRef, id: r2.$id, class: r2.cx("root"), onClick: a2[3] ||= function() {
        return b2.onOverlayClick && b2.onOverlayClick.apply(b2, arguments);
      }, "data-p": b2.dataP }, r2.ptmi("root")), [r2.$slots.start ? (n(), l("div", t({ key: 0, class: r2.cx("start") }, r2.ptm("start")), [e(r2.$slots, "start")], 16)) : p("", !0), c("ul", t({ ref: b2.listRef, id: r2.$id + "_list", class: r2.cx("list"), role: "menu", tabindex: r2.tabindex, "aria-activedescendant": y2.focused ? b2.focusedOptionId : void 0, "aria-label": r2.ariaLabel, "aria-labelledby": r2.ariaLabelledby, onFocus: a2[0] ||= function() {
        return b2.onListFocus && b2.onListFocus.apply(b2, arguments);
      }, onBlur: a2[1] ||= function() {
        return b2.onListBlur && b2.onListBlur.apply(b2, arguments);
      }, onKeydown: a2[2] ||= function() {
        return b2.onListKeyDown && b2.onListKeyDown.apply(b2, arguments);
      } }, r2.ptm("list")), [(n(!0), l(u, null, h(r2.model, function(i2, a3) {
        return n(), l(u, { key: b2.label(i2) + a3.toString() }, [i2.items && b2.visible(i2) && !i2.separator ? (n(), l(u, { key: 0 }, [i2.items ? (n(), l("li", t({ key: 0, id: r2.$id + "_" + a3, class: [r2.cx("submenuLabel"), i2.class], role: "none" }, { ref_for: !0 }, r2.ptm("submenuLabel")), [e(r2.$slots, r2.$slots.submenulabel ? "submenulabel" : "submenuheader", { item: i2 }, function() {
          return [o(d(b2.label(i2)), 1)];
        })], 16, Q)) : p("", !0), (n(!0), l(u, null, h(i2.items, function(e2, o2) {
          return n(), l(u, { key: e2.label + a3 + "_" + o2 }, [b2.visible(e2) && !e2.separator ? (n(), m(x2, { key: 0, id: r2.$id + "_" + a3 + "_" + o2, item: e2, templates: r2.$slots, focusedOptionId: b2.focusedOptionId, unstyled: r2.unstyled, onItemClick: b2.itemClick, onItemMousemove: b2.itemMouseMove, pt: r2.pt }, null, 8, ["id", "item", "templates", "focusedOptionId", "unstyled", "onItemClick", "onItemMousemove", "pt"])) : b2.visible(e2) && e2.separator ? (n(), l("li", t({ key: "separator" + a3 + o2, class: [r2.cx("separator"), i2.class], style: e2.style, role: "separator" }, { ref_for: !0 }, r2.ptm("separator")), null, 16)) : p("", !0)], 64);
        }), 128))], 64)) : b2.visible(i2) && i2.separator ? (n(), l("li", t({ key: "separator" + a3.toString(), class: [r2.cx("separator"), i2.class], style: i2.style, role: "separator" }, { ref_for: !0 }, r2.ptm("separator")), null, 16)) : (n(), m(x2, { key: b2.label(i2) + a3.toString(), id: r2.$id + "_" + a3, item: i2, index: a3, templates: r2.$slots, focusedOptionId: b2.focusedOptionId, unstyled: r2.unstyled, onItemClick: b2.itemClick, onItemMousemove: b2.itemMouseMove, pt: r2.pt }, null, 8, ["id", "item", "index", "templates", "focusedOptionId", "unstyled", "onItemClick", "onItemMousemove", "pt"]))], 64);
      }), 128))], 16, Z), r2.$slots.end ? (n(), l("div", t({ key: 1, class: r2.cx("end") }, r2.ptm("end")), [e(r2.$slots, "end")], 16)) : p("", !0)], 16, X)) : p("", !0)];
    }), _: 3 }, 16, ["onEnter", "onLeave", "onAfterLeave"])];
  }), _: 3 }, 8, ["appendTo", "disabled"]);
}
Y.render = $;
export {Y as t};