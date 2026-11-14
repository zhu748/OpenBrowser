import {J as e,P as t,W as n,X as r,Y as i,Z as a,b as o,en as s,f as c,h as l,i as u,in as d,lt as f,m as p,nn as m,p as h,q as g,ut as ee,v as _,x as v} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as y} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {F as b,I as x,J as S,K as te,M as C,X as w,c as T,f as E,g as D,q as O,t as k,w as A} from "./basecomponent-ClhuVxJN.js";
import {A as j,D as M,E as N,M as P,m as F,p as ne} from "./dist-DPswMdzV.js";
import {t as I} from "./zindex-cO8iUN-n.js";
import {r as re} from "./api-B4Wso50O.js";
import {t as ie} from "./ripple-DKjDc6yC.js";
import {t as ae} from "./utils-i4uei9-Y.js";
import {r as oe} from "./button-BKeo7L17.js";
import {n as se,t as ce} from "./style-BGlNZW5c.js";
import {t as le} from "./times-NAtDB1bj.js";
import {t as ue} from "./portal-Cm1Im7J-.js";
import {t as de} from "./check-vKsww1YC.js";
import {t as L} from "./checkbox-DozTKB5Z.js";
import {t as R} from "./baseinput-CQOYuWse.js";
import {t as z} from "./overlayeventbus-B9Z9smtH.js";
import {t as B} from "./timescircle-BWZQMX3z.js";
import {t as V} from "./inputtext-Crzvb5jQ.js";
import {n as H,t as fe} from "./inputicon-Bn1KerIx.js";
import {i as pe,n as me,r as he} from "./select-Cc8zLK4m.js";
var U = { name: "Chip", extends: { name: "BaseChip", extends: k, props: { label: { type: [String, Number], default: null }, icon: { type: String, default: null }, image: { type: String, default: null }, removable: { type: Boolean, default: !1 }, removeIcon: { type: String, default: void 0 } }, style: se, provide: function() {
  return { $pcChip: this, $parentInstance: this };
} }, inheritAttrs: !1, emits: ["remove"], data: function() {
  return { visible: !0 };
}, methods: { onKeydown: function(e2) {
  (e2.key === "Enter" || e2.key === "Backspace") && this.close(e2);
}, close: function(e2) {
  this.visible = !1, this.$emit("remove", e2);
} }, computed: { dataP: function() {
  return w({ removable: this.removable });
} }, components: { TimesCircleIcon: B } };
var ge = ["aria-label", "data-p"];
var _e = ["src"];
function ve(r2, i2, o2, s2, c2, u2) {
  return c2.visible ? (n(), l("div", t({ key: 0, class: r2.cx("root"), "aria-label": r2.label }, r2.ptmi("root"), { "data-p": u2.dataP }), [e(r2.$slots, "default", {}, function() {
    return [r2.image ? (n(), l("img", t({ key: 0, src: r2.image }, r2.ptm("image"), { class: r2.cx("image") }), null, 16, _e)) : r2.$slots.icon ? (n(), h(a(r2.$slots.icon), t({ key: 1, class: r2.cx("icon") }, r2.ptm("icon")), null, 16, ["class"])) : r2.icon ? (n(), l("span", t({ key: 2, class: [r2.cx("icon"), r2.icon] }, r2.ptm("icon")), null, 16)) : p("", !0), r2.label === null ? p("", !0) : (n(), l("div", t({ key: 3, class: r2.cx("label") }, r2.ptm("label")), d(r2.label), 17))];
  }), r2.removable ? e(r2.$slots, "removeicon", { key: 0, removeCallback: u2.close, keydownCallback: u2.onKeydown }, function() {
    return [(n(), h(a(r2.removeIcon ? "span" : "TimesCircleIcon"), t({ class: [r2.cx("removeIcon"), r2.removeIcon], onClick: u2.close, onKeydown: u2.onKeydown }, r2.ptm("removeIcon")), null, 16, ["class", "onClick", "onKeydown"]))];
  }) : p("", !0)], 16, ge)) : p("", !0);
}
U.render = ve;
var ye = { name: "BaseMultiSelect", extends: R, props: { options: Array, optionLabel: null, optionValue: null, optionDisabled: null, optionGroupLabel: null, optionGroupChildren: null, scrollHeight: { type: String, default: "14rem" }, placeholder: String, inputId: { type: String, default: null }, panelClass: { type: String, default: null }, panelStyle: { type: null, default: null }, overlayClass: { type: String, default: null }, overlayStyle: { type: null, default: null }, dataKey: null, showClear: { type: Boolean, default: !1 }, clearIcon: { type: String, default: void 0 }, resetFilterOnClear: { type: Boolean, default: !1 }, filter: Boolean, filterPlaceholder: String, filterLocale: String, filterMatchMode: { type: String, default: "contains" }, filterFields: { type: Array, default: null }, appendTo: { type: [String, Object], default: "body" }, display: { type: String, default: "comma" }, selectedItemsLabel: { type: String, default: null }, maxSelectedLabels: { type: Number, default: null }, selectionLimit: { type: Number, default: null }, showToggleAll: { type: Boolean, default: !0 }, loading: { type: Boolean, default: !1 }, checkboxIcon: { type: String, default: void 0 }, dropdownIcon: { type: String, default: void 0 }, filterIcon: { type: String, default: void 0 }, loadingIcon: { type: String, default: void 0 }, removeTokenIcon: { type: String, default: void 0 }, chipIcon: { type: String, default: void 0 }, selectAll: { type: Boolean, default: null }, resetFilterOnHide: { type: Boolean, default: !1 }, virtualScrollerOptions: { type: Object, default: null }, autoOptionFocus: { type: Boolean, default: !1 }, autoFilterFocus: { type: Boolean, default: !1 }, focusOnHover: { type: Boolean, default: !0 }, highlightOnSelect: { type: Boolean, default: !1 }, filterMessage: { type: String, default: null }, selectionMessage: { type: String, default: null }, emptySelectionMessage: { type: String, default: null }, emptyFilterMessage: { type: String, default: null }, emptyMessage: { type: String, default: null }, tabindex: { type: Number, default: 0 }, ariaLabel: { type: String, default: null }, ariaLabelledby: { type: String, default: null } }, style: ce, provide: function() {
  return { $pcMultiSelect: this, $parentInstance: this };
} };
function W(e2) {
  "@babel/helpers - typeof";
  return W = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, W(e2);
}
function G(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function K(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? G(Object(n2), !0).forEach(function(t3) {
      q(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : G(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function q(e2, t2, n2) {
  return (t2 = be(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function be(e2) {
  var t2 = xe(e2, "string");
  return W(t2) == "symbol" ? t2 : t2 + "";
}
function xe(e2, t2) {
  if (W(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (W(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
function J(e2) {
  return Te(e2) || we(e2) || Ce(e2) || Se();
}
function Se() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Ce(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return Y(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? Y(e2, t2) : void 0;
  }
}
function we(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function Te(e2) {
  if (Array.isArray(e2)) return Y(e2);
}
function Y(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
var X = { name: "MultiSelect", extends: ye, inheritAttrs: !1, emits: ["change", "focus", "blur", "before-show", "before-hide", "show", "hide", "filter", "selectall-change"], inject: { $pcFluid: { default: null } }, outsideClickListener: null, scrollHandler: null, resizeListener: null, overlay: null, list: null, virtualScroller: null, startRangeIndex: -1, searchTimeout: null, searchValue: "", selectOnFocus: !1, data: function() {
  return { clicked: !1, focused: !1, focusedOptionIndex: -1, filterValue: null, overlayVisible: !1 };
}, watch: { options: function() {
  this.autoUpdateModel();
} }, mounted: function() {
  this.autoUpdateModel();
}, beforeUnmount: function() {
  this.unbindOutsideClickListener(), this.unbindResizeListener(), this.scrollHandler &&= (this.scrollHandler.destroy(), null), this.overlay &&= (I.clear(this.overlay), null);
}, methods: { getOptionIndex: function(e2, t2) {
  return this.virtualScrollerDisabled ? e2 : t2 && t2(e2).index;
}, getOptionLabel: function(e2) {
  return this.optionLabel ? j(e2, this.optionLabel) : e2;
}, getOptionValue: function(e2) {
  return this.optionValue ? j(e2, this.optionValue) : e2;
}, getOptionRenderKey: function(e2, t2) {
  return this.dataKey ? j(e2, this.dataKey) : this.getOptionLabel(e2) + `_${t2}`;
}, getHeaderCheckboxPTOptions: function(e2) {
  return this.ptm(e2, { context: { selected: this.allSelected } });
}, getCheckboxPTOptions: function(e2, t2, n2, r2) {
  return this.ptm(r2, { context: { selected: this.isSelected(e2), focused: this.focusedOptionIndex === this.getOptionIndex(n2, t2), disabled: this.isOptionDisabled(e2) } });
}, isOptionDisabled: function(e2) {
  return this.maxSelectionLimitReached && !this.isSelected(e2) ? !0 : this.optionDisabled ? j(e2, this.optionDisabled) : !1;
}, isOptionGroup: function(e2) {
  return !!(this.optionGroupLabel && e2.optionGroup && e2.group);
}, getOptionGroupLabel: function(e2) {
  return j(e2, this.optionGroupLabel);
}, getOptionGroupChildren: function(e2) {
  return j(e2, this.optionGroupChildren);
}, getAriaPosInset: function(e2) {
  var t2 = this;
  return (this.optionGroupLabel ? e2 - this.visibleOptions.slice(0, e2).filter(function(e3) {
    return t2.isOptionGroup(e3);
  }).length : e2) + 1;
}, show: function(e2) {
  this.$emit("before-show"), this.overlayVisible = !0, this.focusedOptionIndex = this.focusedOptionIndex === -1 ? this.autoOptionFocus ? this.findFirstFocusedOptionIndex() : this.findSelectedOptionIndex() : this.focusedOptionIndex, e2 && x(this.$refs.focusInput);
}, hide: function(e2) {
  var t2 = this, n2 = function() {
    t2.$emit("before-hide"), t2.overlayVisible = !1, t2.clicked = !1, t2.focusedOptionIndex = -1, t2.searchValue = "", t2.resetFilterOnHide && (t2.filterValue = null), e2 && x(t2.$refs.focusInput);
  };
  setTimeout(function() {
    n2();
  }, 0);
}, onFocus: function(e2) {
  this.disabled || (this.focused = !0, this.overlayVisible && (this.focusedOptionIndex = this.focusedOptionIndex === -1 ? this.autoOptionFocus ? this.findFirstFocusedOptionIndex() : this.findSelectedOptionIndex() : this.focusedOptionIndex, !this.autoFilterFocus && this.scrollInView(this.focusedOptionIndex)), this.$emit("focus", e2));
}, onBlur: function(e2) {
  var t2, n2;
  this.clicked = !1, this.focused = !1, this.focusedOptionIndex = -1, this.searchValue = "", this.$emit("blur", e2), (t2 = (n2 = this.formField).onBlur) == null || t2.call(n2);
}, onKeyDown: function(e2) {
  var t2 = this;
  if (this.disabled) e2.preventDefault();
  else {
    var n2 = e2.metaKey || e2.ctrlKey;
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
      case "PageDown":
        this.onPageDownKey(e2);
        break;
      case "PageUp":
        this.onPageUpKey(e2);
        break;
      case "Enter":
      case "NumpadEnter":
      case "Space":
        this.onEnterKey(e2);
        break;
      case "Escape":
        this.onEscapeKey(e2);
        break;
      case "Tab":
        this.onTabKey(e2);
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.onShiftKey(e2);
        break;
      default:
        if (e2.code === "KeyA" && n2) {
          var r2 = this.visibleOptions.filter(function(e3) {
            return t2.isValidOption(e3);
          }).map(function(e3) {
            return t2.getOptionValue(e3);
          });
          this.updateModel(e2, r2), e2.preventDefault();
          break;
        }
        !n2 && ne(e2.key) && (!this.overlayVisible && this.show(), this.searchOptions(e2), e2.preventDefault());
    }
    this.clicked = !1;
  }
}, onContainerClick: function(e2) {
  this.disabled || this.loading || e2.target.tagName === "INPUT" || e2.target.getAttribute("data-pc-section") === "clearicon" || e2.target.closest('[data-pc-section="clearicon"]') || (this.overlay && this.overlay.contains(e2.target) || (this.overlayVisible ? this.hide(!0) : this.show(!0)), this.clicked = !0);
}, onClearClick: function(e2) {
  this.updateModel(e2, []), this.resetFilterOnClear && (this.filterValue = null);
}, onFirstHiddenFocus: function(e2) {
  var t2 = e2.relatedTarget === this.$refs.focusInput ? O(this.overlay, ':not([data-p-hidden-focusable="true"])') : this.$refs.focusInput;
  x(t2);
}, onLastHiddenFocus: function(e2) {
  var t2 = e2.relatedTarget === this.$refs.focusInput ? D(this.overlay, ':not([data-p-hidden-focusable="true"])') : this.$refs.focusInput;
  x(t2);
}, onOptionSelect: function(e2, t2) {
  var n2 = this, r2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : -1, i2 = arguments.length > 3 && arguments[3] !== void 0 && arguments[3];
  if (!(this.disabled || this.isOptionDisabled(t2))) {
    var a2 = this.isSelected(t2), o2 = null;
    o2 = a2 ? this.d_value.filter(function(e3) {
      return !N(e3, n2.getOptionValue(t2), n2.equalityKey);
    }) : [].concat(J(this.d_value || []), [this.getOptionValue(t2)]), this.updateModel(e2, o2), r2 !== -1 && (this.focusedOptionIndex = r2), i2 && x(this.$refs.focusInput);
  }
}, onOptionMouseMove: function(e2, t2) {
  this.focusOnHover && this.changeFocusedOptionIndex(e2, t2);
}, onOptionSelectRange: function(e2) {
  var t2 = this, n2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : -1, r2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : -1;
  if (n2 === -1 && (n2 = this.findNearestSelectedOptionIndex(r2, !0)), r2 === -1 && (r2 = this.findNearestSelectedOptionIndex(n2)), n2 !== -1 && r2 !== -1) {
    var i2 = Math.min(n2, r2), a2 = Math.max(n2, r2), o2 = this.visibleOptions.slice(i2, a2 + 1).filter(function(e3) {
      return t2.isValidOption(e3);
    }).map(function(e3) {
      return t2.getOptionValue(e3);
    });
    this.updateModel(e2, o2);
  }
}, onFilterChange: function(e2) {
  var t2 = e2.target.value;
  this.filterValue = t2, this.focusedOptionIndex = -1, this.$emit("filter", { originalEvent: e2, value: t2 }), !this.virtualScrollerDisabled && this.virtualScroller.scrollToIndex(0);
}, onFilterKeyDown: function(e2) {
  switch (e2.code) {
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
      this.onTabKey(e2, !0);
  }
}, onFilterBlur: function() {
  this.focusedOptionIndex = -1;
}, onFilterUpdated: function() {
  this.overlayVisible && this.alignOverlay();
}, onOverlayClick: function(e2) {
  z.emit("overlay-click", { originalEvent: e2, target: this.$el });
}, onOverlayKeyDown: function(e2) {
  e2.code === "Escape" && this.onEscapeKey(e2);
}, onArrowDownKey: function(e2) {
  if (!this.overlayVisible) this.show();
  else {
    var t2 = this.focusedOptionIndex === -1 ? this.clicked ? this.findFirstOptionIndex() : this.findFirstFocusedOptionIndex() : this.findNextOptionIndex(this.focusedOptionIndex);
    e2.shiftKey && this.onOptionSelectRange(e2, this.startRangeIndex, t2), this.changeFocusedOptionIndex(e2, t2);
  }
  e2.preventDefault();
}, onArrowUpKey: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 && arguments[1];
  if (e2.altKey && !t2) this.focusedOptionIndex !== -1 && this.onOptionSelect(e2, this.visibleOptions[this.focusedOptionIndex]), this.overlayVisible && this.hide(), e2.preventDefault();
  else {
    var n2 = this.focusedOptionIndex === -1 ? this.clicked ? this.findLastOptionIndex() : this.findLastFocusedOptionIndex() : this.findPrevOptionIndex(this.focusedOptionIndex);
    e2.shiftKey && this.onOptionSelectRange(e2, n2, this.startRangeIndex), this.changeFocusedOptionIndex(e2, n2), !this.overlayVisible && this.show(), e2.preventDefault();
  }
}, onArrowLeftKey: function(e2) {
  arguments.length > 1 && arguments[1] !== void 0 && arguments[1] && (this.focusedOptionIndex = -1);
}, onHomeKey: function(e2) {
  if (arguments.length > 1 && arguments[1] !== void 0 && arguments[1]) {
    var t2 = e2.currentTarget;
    e2.shiftKey ? t2.setSelectionRange(0, e2.target.selectionStart) : (t2.setSelectionRange(0, 0), this.focusedOptionIndex = -1);
  } else {
    var n2 = e2.metaKey || e2.ctrlKey, r2 = this.findFirstOptionIndex();
    e2.shiftKey && n2 && this.onOptionSelectRange(e2, r2, this.startRangeIndex), this.changeFocusedOptionIndex(e2, r2), !this.overlayVisible && this.show();
  }
  e2.preventDefault();
}, onEndKey: function(e2) {
  if (arguments.length > 1 && arguments[1] !== void 0 && arguments[1]) {
    var t2 = e2.currentTarget;
    if (e2.shiftKey) t2.setSelectionRange(e2.target.selectionStart, t2.value.length);
    else {
      var n2 = t2.value.length;
      t2.setSelectionRange(n2, n2), this.focusedOptionIndex = -1;
    }
  } else {
    var r2 = e2.metaKey || e2.ctrlKey, i2 = this.findLastOptionIndex();
    e2.shiftKey && r2 && this.onOptionSelectRange(e2, this.startRangeIndex, i2), this.changeFocusedOptionIndex(e2, i2), !this.overlayVisible && this.show();
  }
  e2.preventDefault();
}, onPageUpKey: function(e2) {
  this.scrollInView(0), e2.preventDefault();
}, onPageDownKey: function(e2) {
  this.scrollInView(this.visibleOptions.length - 1), e2.preventDefault();
}, onEnterKey: function(e2) {
  this.overlayVisible ? this.focusedOptionIndex !== -1 && (e2.shiftKey ? this.onOptionSelectRange(e2, this.focusedOptionIndex) : this.onOptionSelect(e2, this.visibleOptions[this.focusedOptionIndex])) : (this.focusedOptionIndex = -1, this.onArrowDownKey(e2)), e2.preventDefault();
}, onEscapeKey: function(e2) {
  this.overlayVisible && (this.hide(!0), e2.stopPropagation()), e2.preventDefault();
}, onTabKey: function(e2) {
  arguments.length > 1 && arguments[1] !== void 0 && arguments[1] || (this.overlayVisible && this.hasFocusableElements() ? (x(e2.shiftKey ? this.$refs.lastHiddenFocusableElementOnOverlay : this.$refs.firstHiddenFocusableElementOnOverlay), e2.preventDefault()) : (this.focusedOptionIndex !== -1 && this.onOptionSelect(e2, this.visibleOptions[this.focusedOptionIndex]), this.overlayVisible && this.hide(this.filter)));
}, onShiftKey: function() {
  this.startRangeIndex = this.focusedOptionIndex;
}, onOverlayEnter: function(e2) {
  I.set("overlay", e2, this.$primevue.config.zIndex.overlay), A(e2, { position: "absolute", top: "0" }), this.alignOverlay(), this.scrollInView(), this.autoFilterFocus && x(this.$refs.filterInput.$el), this.autoUpdateModel(), this.$attrSelector && e2.setAttribute(this.$attrSelector, "");
}, onOverlayAfterEnter: function() {
  this.bindOutsideClickListener(), this.bindScrollListener(), this.bindResizeListener(), this.$emit("show");
}, onOverlayLeave: function(e2) {
  e2.style.pointerEvents = "none", this.unbindOutsideClickListener(), this.unbindScrollListener(), this.unbindResizeListener(), this.$emit("hide"), this.overlay = null;
}, onOverlayAfterLeave: function(e2) {
  I.clear(e2);
}, alignOverlay: function() {
  this.appendTo === "self" ? E(this.overlay, this.$el) : (this.overlay.style.minWidth = te(this.$el) + "px", T(this.overlay, this.$el));
}, bindOutsideClickListener: function() {
  var e2 = this;
  this.outsideClickListener || (this.outsideClickListener = function(t2) {
    e2.overlayVisible && e2.isOutsideClicked(t2) && e2.hide();
  }, document.addEventListener("click", this.outsideClickListener, !0));
}, unbindOutsideClickListener: function() {
  this.outsideClickListener &&= (document.removeEventListener("click", this.outsideClickListener, !0), null);
}, bindScrollListener: function() {
  var e2 = this;
  this.scrollHandler ||= new ae(this.$refs.container, function() {
    e2.overlayVisible && e2.hide();
  }), this.scrollHandler.bindScrollListener();
}, unbindScrollListener: function() {
  this.scrollHandler && this.scrollHandler.unbindScrollListener();
}, bindResizeListener: function() {
  var e2 = this;
  this.resizeListener || (this.resizeListener = function() {
    e2.overlayVisible && !C() && e2.hide();
  }, window.addEventListener("resize", this.resizeListener));
}, unbindResizeListener: function() {
  this.resizeListener &&= (window.removeEventListener("resize", this.resizeListener), null);
}, isOutsideClicked: function(e2) {
  return !(this.$el.isSameNode(e2.target) || this.$el.contains(e2.target) || this.overlay && this.overlay.contains(e2.target));
}, getLabelByValue: function(e2) {
  var t2 = this, n2 = (this.optionGroupLabel ? this.flatOptions(this.options) : this.options || []).find(function(n3) {
    return !t2.isOptionGroup(n3) && N(t2.getOptionValue(n3), e2, t2.equalityKey);
  });
  return this.getOptionLabel(n2);
}, getSelectedItemsLabel: function() {
  var e2 = /{(.*?)}/, t2 = this.selectedItemsLabel || this.$primevue.config.locale.selectionMessage;
  return e2.test(t2) ? t2.replace(t2.match(e2)[0], this.d_value.length + "") : t2;
}, onToggleAll: function(e2) {
  var t2 = this;
  if (this.selectAll !== null) this.$emit("selectall-change", { originalEvent: e2, checked: !this.allSelected });
  else {
    var n2 = this.allSelected ? [] : this.visibleOptions.filter(function(e3) {
      return t2.isValidOption(e3);
    }).map(function(e3) {
      return t2.getOptionValue(e3);
    });
    this.updateModel(e2, n2);
  }
}, removeOption: function(e2, t2) {
  var n2 = this;
  e2.stopPropagation();
  var r2 = this.d_value.filter(function(e3) {
    return !N(e3, t2, n2.equalityKey);
  });
  this.updateModel(e2, r2);
}, clearFilter: function() {
  this.filterValue = null;
}, hasFocusableElements: function() {
  return b(this.overlay, ':not([data-p-hidden-focusable="true"])').length > 0;
}, isOptionMatched: function(e2) {
  return this.isValidOption(e2) && typeof this.getOptionLabel(e2) == "string" && this.getOptionLabel(e2)?.toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale));
}, isValidOption: function(e2) {
  return P(e2) && !(this.isOptionDisabled(e2) || this.isOptionGroup(e2));
}, isValidSelectedOption: function(e2) {
  return this.isValidOption(e2) && this.isSelected(e2);
}, isEquals: function(e2, t2) {
  return N(e2, t2, this.equalityKey);
}, isSelected: function(e2) {
  var t2 = this, n2 = this.getOptionValue(e2);
  return (this.d_value || []).some(function(e3) {
    return t2.isEquals(e3, n2);
  });
}, findFirstOptionIndex: function() {
  var e2 = this;
  return this.visibleOptions.findIndex(function(t2) {
    return e2.isValidOption(t2);
  });
}, findLastOptionIndex: function() {
  var e2 = this;
  return F(this.visibleOptions, function(t2) {
    return e2.isValidOption(t2);
  });
}, findNextOptionIndex: function(e2) {
  var t2 = this, n2 = e2 < this.visibleOptions.length - 1 ? this.visibleOptions.slice(e2 + 1).findIndex(function(e3) {
    return t2.isValidOption(e3);
  }) : -1;
  return n2 > -1 ? n2 + e2 + 1 : e2;
}, findPrevOptionIndex: function(e2) {
  var t2 = this, n2 = e2 > 0 ? F(this.visibleOptions.slice(0, e2), function(e3) {
    return t2.isValidOption(e3);
  }) : -1;
  return n2 > -1 ? n2 : e2;
}, findSelectedOptionIndex: function() {
  var e2 = this;
  if (this.$filled) {
    for (var t2 = function() {
      var t3 = e2.d_value[r2], n3 = e2.visibleOptions.findIndex(function(n4) {
        return e2.isValidSelectedOption(n4) && e2.isEquals(t3, e2.getOptionValue(n4));
      });
      if (n3 > -1) return { v: n3 };
    }, n2, r2 = this.d_value.length - 1; r2 >= 0; r2--) if (n2 = t2(), n2) return n2.v;
  }
  return -1;
}, findFirstSelectedOptionIndex: function() {
  var e2 = this;
  return this.$filled ? this.visibleOptions.findIndex(function(t2) {
    return e2.isValidSelectedOption(t2);
  }) : -1;
}, findLastSelectedOptionIndex: function() {
  var e2 = this;
  return this.$filled ? F(this.visibleOptions, function(t2) {
    return e2.isValidSelectedOption(t2);
  }) : -1;
}, findNextSelectedOptionIndex: function(e2) {
  var t2 = this, n2 = this.$filled && e2 < this.visibleOptions.length - 1 ? this.visibleOptions.slice(e2 + 1).findIndex(function(e3) {
    return t2.isValidSelectedOption(e3);
  }) : -1;
  return n2 > -1 ? n2 + e2 + 1 : -1;
}, findPrevSelectedOptionIndex: function(e2) {
  var t2 = this, n2 = this.$filled && e2 > 0 ? F(this.visibleOptions.slice(0, e2), function(e3) {
    return t2.isValidSelectedOption(e3);
  }) : -1;
  return n2 > -1 ? n2 : -1;
}, findNearestSelectedOptionIndex: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 && arguments[1], n2 = -1;
  return this.$filled && (t2 ? (n2 = this.findPrevSelectedOptionIndex(e2), n2 = n2 === -1 ? this.findNextSelectedOptionIndex(e2) : n2) : (n2 = this.findNextSelectedOptionIndex(e2), n2 = n2 === -1 ? this.findPrevSelectedOptionIndex(e2) : n2)), n2 > -1 ? n2 : e2;
}, findFirstFocusedOptionIndex: function() {
  var e2 = this.findFirstSelectedOptionIndex();
  return e2 < 0 ? this.findFirstOptionIndex() : e2;
}, findLastFocusedOptionIndex: function() {
  var e2 = this.findSelectedOptionIndex();
  return e2 < 0 ? this.findLastOptionIndex() : e2;
}, searchOptions: function(e2) {
  var t2 = this;
  this.searchValue = (this.searchValue || "") + e2.key;
  var n2 = -1;
  P(this.searchValue) && (this.focusedOptionIndex === -1 ? n2 = this.visibleOptions.findIndex(function(e3) {
    return t2.isOptionMatched(e3);
  }) : (n2 = this.visibleOptions.slice(this.focusedOptionIndex).findIndex(function(e3) {
    return t2.isOptionMatched(e3);
  }), n2 = n2 === -1 ? this.visibleOptions.slice(0, this.focusedOptionIndex).findIndex(function(e3) {
    return t2.isOptionMatched(e3);
  }) : n2 + this.focusedOptionIndex), n2 === -1 && this.focusedOptionIndex === -1 && (n2 = this.findFirstFocusedOptionIndex()), n2 !== -1 && this.changeFocusedOptionIndex(e2, n2)), this.searchTimeout && clearTimeout(this.searchTimeout), this.searchTimeout = setTimeout(function() {
    t2.searchValue = "", t2.searchTimeout = null;
  }, 500);
}, changeFocusedOptionIndex: function(e2, t2) {
  this.focusedOptionIndex !== t2 && (this.focusedOptionIndex = t2, this.scrollInView(), this.selectOnFocus && this.onOptionSelect(e2, this.visibleOptions[t2]));
}, scrollInView: function() {
  var e2 = this, t2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : -1;
  this.$nextTick(function() {
    var n2 = t2 === -1 ? e2.focusedOptionId : `${e2.$id}_${t2}`, r2 = S(e2.list, `li[id="${n2}"]`);
    r2 ? r2.scrollIntoView && r2.scrollIntoView({ block: "nearest", inline: "nearest" }) : e2.virtualScrollerDisabled || e2.virtualScroller && e2.virtualScroller.scrollToIndex(t2 === -1 ? e2.focusedOptionIndex : t2);
  });
}, autoUpdateModel: function() {
  if (this.autoOptionFocus && (this.focusedOptionIndex = this.findFirstFocusedOptionIndex()), this.selectOnFocus && this.autoOptionFocus && !this.$filled) {
    var e2 = this.getOptionValue(this.visibleOptions[this.focusedOptionIndex]);
    this.updateModel(null, [e2]);
  }
}, updateModel: function(e2, t2) {
  this.writeValue(t2, e2), this.$emit("change", { originalEvent: e2, value: t2 });
}, flatOptions: function(e2) {
  var t2 = this;
  return (e2 || []).reduce(function(e3, n2, r2) {
    var i2 = t2.getOptionGroupChildren(n2);
    return i2 && Array.isArray(i2) ? (e3.push({ optionGroup: n2, group: !0, index: r2 }), i2.forEach(function(t3) {
      return e3.push(t3);
    })) : e3.push(n2), e3;
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
    var n2 = re.filter(t2, this.searchFields, this.filterValue, this.filterMatchMode, this.filterLocale);
    if (this.optionGroupLabel) {
      var r2 = this.options || [], i2 = [];
      return r2.forEach(function(t3) {
        var r3 = e2.getOptionGroupChildren(t3).filter(function(e3) {
          return n2.includes(e3);
        });
        r3.length > 0 && i2.push(K(K({}, t3), {}, q({}, typeof e2.optionGroupChildren == "string" ? e2.optionGroupChildren : "items", J(r3))));
      }), this.flatOptions(i2);
    }
    return n2;
  }
  return t2;
}, label: function() {
  var e2;
  if (this.d_value && this.d_value.length)
    if (this.loading && (!this.options || this.options.length === 0)) e2 = this.placeholder;
    else {
      if (P(this.maxSelectedLabels) && this.d_value.length > this.maxSelectedLabels) return this.getSelectedItemsLabel();
      e2 = "";
      for (var t2 = 0; t2 < this.d_value.length; t2++) t2 !== 0 && (e2 += ", "), e2 += this.getLabelByValue(this.d_value[t2]);
    }
  else e2 = this.placeholder;
  return e2;
}, chipSelectedItems: function() {
  return P(this.maxSelectedLabels) && this.d_value && this.d_value.length > this.maxSelectedLabels;
}, allSelected: function() {
  var e2 = this;
  return this.selectAll === null ? P(this.visibleOptions) && this.visibleOptions.every(function(t2) {
    return e2.isOptionGroup(t2) || e2.isOptionDisabled(t2) || e2.isSelected(t2);
  }) : this.selectAll;
}, hasSelectedOption: function() {
  return this.$filled;
}, equalityKey: function() {
  return this.optionValue ? null : this.dataKey;
}, searchFields: function() {
  return this.filterFields || [this.optionLabel];
}, maxSelectionLimitReached: function() {
  return this.selectionLimit && this.d_value && this.d_value.length === this.selectionLimit;
}, filterResultMessageText: function() {
  return P(this.visibleOptions) ? this.filterMessageText.replaceAll("{0}", this.visibleOptions.length) : this.emptyFilterMessageText;
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
  return this.$filled ? this.selectionMessageText.replaceAll("{0}", this.d_value.length) : this.emptySelectionMessageText;
}, focusedOptionId: function() {
  return this.focusedOptionIndex === -1 ? null : `${this.$id}_${this.focusedOptionIndex}`;
}, ariaSetSize: function() {
  var e2 = this;
  return this.visibleOptions.filter(function(t2) {
    return !e2.isOptionGroup(t2);
  }).length;
}, toggleAllAriaLabel: function() {
  return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria[this.allSelected ? "selectAll" : "unselectAll"] : void 0;
}, listAriaLabel: function() {
  return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria.listLabel : void 0;
}, virtualScrollerDisabled: function() {
  return !this.virtualScrollerOptions;
}, hasFluid: function() {
  return M(this.fluid) ? !!this.$pcFluid : this.fluid;
}, isClearIconVisible: function() {
  return this.showClear && this.d_value && this.d_value.length && this.d_value != null && P(this.options) && !this.disabled && !this.loading;
}, containerDataP: function() {
  return w(q({ invalid: this.$invalid, disabled: this.disabled, focus: this.focused, fluid: this.$fluid, filled: this.$variant === "filled" }, this.size, this.size));
}, labelDataP: function() {
  return w(q(q(q({ placeholder: this.label === this.placeholder, clearable: this.showClear, disabled: this.disabled }, this.size, this.size), "has-chip", this.display === "chip" && this.d_value && this.d_value.length && (!this.maxSelectedLabels || this.d_value.length <= this.maxSelectedLabels)), "empty", !this.placeholder && !this.$filled));
}, dropdownIconDataP: function() {
  return w(q({}, this.size, this.size));
}, overlayDataP: function() {
  return w(q({}, "portal-" + this.appendTo, "portal-" + this.appendTo));
} }, directives: { ripple: ie }, components: { InputText: V, Checkbox: L, VirtualScroller: me, Portal: ue, Chip: U, IconField: H, InputIcon: fe, TimesIcon: le, SearchIcon: he, ChevronDownIcon: pe, SpinnerIcon: oe, CheckIcon: de } };
function Z(e2) {
  "@babel/helpers - typeof";
  return Z = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, Z(e2);
}
function Q(e2, t2, n2) {
  return (t2 = Ee(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function Ee(e2) {
  var t2 = De(e2, "string");
  return Z(t2) == "symbol" ? t2 : t2 + "";
}
function De(e2, t2) {
  if (Z(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (Z(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var Oe = ["data-p"];
var ke = ["id", "disabled", "placeholder", "tabindex", "aria-label", "aria-labelledby", "aria-expanded", "aria-controls", "aria-activedescendant", "aria-invalid"];
var Ae = ["data-p"];
var $ = { key: 1 };
var je = ["data-p"];
var Me = ["id", "aria-label"];
var Ne = ["id"];
var Pe = ["id", "aria-label", "aria-selected", "aria-disabled", "aria-setsize", "aria-posinset", "onClick", "onMousemove", "data-p-selected", "data-p-focused", "data-p-disabled"];
function Fe(b2, x2, S2, te2, C2, w2) {
  var T2 = i("Chip"), E2 = i("SpinnerIcon"), D2 = i("Checkbox"), O2 = i("InputText"), k2 = i("SearchIcon"), A2 = i("InputIcon"), j2 = i("IconField"), M2 = i("VirtualScroller"), N2 = i("Portal"), P2 = r("ripple");
  return n(), l("div", t({ ref: "container", class: b2.cx("root"), style: b2.sx("root"), onClick: x2[7] ||= function() {
    return w2.onContainerClick && w2.onContainerClick.apply(w2, arguments);
  }, "data-p": w2.containerDataP }, b2.ptmi("root")), [c("div", t({ class: "p-hidden-accessible" }, b2.ptm("hiddenInputContainer"), { "data-p-hidden-accessible": !0 }), [c("input", t({ ref: "focusInput", id: b2.inputId, type: "text", readonly: "", disabled: b2.disabled, placeholder: b2.placeholder, tabindex: b2.disabled ? -1 : b2.tabindex, role: "combobox", "aria-label": b2.ariaLabel, "aria-labelledby": b2.ariaLabelledby, "aria-haspopup": "listbox", "aria-expanded": C2.overlayVisible, "aria-controls": C2.overlayVisible ? b2.$id + "_list" : void 0, "aria-activedescendant": C2.focused ? w2.focusedOptionId : void 0, "aria-invalid": b2.invalid || void 0, onFocus: x2[0] ||= function() {
    return w2.onFocus && w2.onFocus.apply(w2, arguments);
  }, onBlur: x2[1] ||= function() {
    return w2.onBlur && w2.onBlur.apply(w2, arguments);
  }, onKeydown: x2[2] ||= function() {
    return w2.onKeyDown && w2.onKeyDown.apply(w2, arguments);
  } }, b2.ptm("hiddenInput")), null, 16, ke)], 16), c("div", t({ class: b2.cx("labelContainer") }, b2.ptm("labelContainer")), [c("div", t({ class: b2.cx("label"), "data-p": w2.labelDataP }, b2.ptm("label")), [e(b2.$slots, "value", { value: b2.d_value, placeholder: b2.placeholder }, function() {
    return [b2.display === "comma" ? (n(), l(u, { key: 0 }, [o(d(w2.label || "empty"), 1)], 64)) : b2.display === "chip" ? (n(), l(u, { key: 1 }, [b2.loading && (!b2.options || b2.options.length === 0) ? (n(), l(u, { key: 0 }, [o(d(b2.placeholder || "empty"), 1)], 64)) : w2.chipSelectedItems ? (n(), l("span", $, d(w2.label), 1)) : (n(!0), l(u, { key: 2 }, g(b2.d_value, function(r2, i2) {
      return n(), l("span", t({ key: `chip-${w2.getLabelByValue(r2)}_${i2}`, class: b2.cx("chipItem") }, { ref_for: !0 }, b2.ptm("chipItem")), [e(b2.$slots, "chip", { value: r2, removeCallback: function(e2) {
        return w2.removeOption(e2, r2);
      } }, function() {
        return [v(T2, { class: s(b2.cx("pcChip")), label: w2.getLabelByValue(r2), removeIcon: b2.chipIcon || b2.removeTokenIcon, removable: "", unstyled: b2.unstyled, onRemove: function(e2) {
          return w2.removeOption(e2, r2);
        }, pt: b2.ptm("pcChip") }, { removeicon: f(function() {
          return [e(b2.$slots, b2.$slots.chipicon ? "chipicon" : "removetokenicon", { class: s(b2.cx("chipIcon")), item: r2, removeCallback: function(e2) {
            return w2.removeOption(e2, r2);
          } })];
        }), _: 2 }, 1032, ["class", "label", "removeIcon", "unstyled", "onRemove", "pt"])];
      })], 16);
    }), 128)), !b2.d_value || b2.d_value.length === 0 ? (n(), l(u, { key: 3 }, [o(d(b2.placeholder || "empty"), 1)], 64)) : p("", !0)], 64)) : p("", !0)];
  })], 16, Ae)], 16), w2.isClearIconVisible ? e(b2.$slots, "clearicon", { key: 0, class: s(b2.cx("clearIcon")), clearCallback: w2.onClearClick }, function() {
    return [(n(), h(a(b2.clearIcon ? "i" : "TimesIcon"), t({ ref: "clearIcon", class: [b2.cx("clearIcon"), b2.clearIcon], onClick: w2.onClearClick }, b2.ptm("clearIcon"), { "data-pc-section": "clearicon" }), null, 16, ["class", "onClick"]))];
  }) : p("", !0), c("div", t({ class: b2.cx("dropdown") }, b2.ptm("dropdown")), [b2.loading ? e(b2.$slots, "loadingicon", { key: 0, class: s(b2.cx("loadingIcon")) }, function() {
    return [b2.loadingIcon ? (n(), l("span", t({ key: 0, class: [b2.cx("loadingIcon"), "pi-spin", b2.loadingIcon], "aria-hidden": "true" }, b2.ptm("loadingIcon")), null, 16)) : (n(), h(E2, t({ key: 1, class: b2.cx("loadingIcon"), spin: "", "aria-hidden": "true" }, b2.ptm("loadingIcon")), null, 16, ["class"]))];
  }) : e(b2.$slots, "dropdownicon", { key: 1, class: s(b2.cx("dropdownIcon")) }, function() {
    return [(n(), h(a(b2.dropdownIcon ? "span" : "ChevronDownIcon"), t({ class: [b2.cx("dropdownIcon"), b2.dropdownIcon], "aria-hidden": "true", "data-p": w2.dropdownIconDataP }, b2.ptm("dropdownIcon")), null, 16, ["class", "data-p"]))];
  })], 16), v(N2, { appendTo: b2.appendTo }, { default: f(function() {
    return [v(y, t({ name: "p-anchored-overlay", onEnter: w2.onOverlayEnter, onAfterEnter: w2.onOverlayAfterEnter, onLeave: w2.onOverlayLeave, onAfterLeave: w2.onOverlayAfterLeave }, b2.ptm("transition")), { default: f(function() {
      return [C2.overlayVisible ? (n(), l("div", t({ key: 0, ref: w2.overlayRef, style: [b2.panelStyle, b2.overlayStyle], class: [b2.cx("overlay"), b2.panelClass, b2.overlayClass], onClick: x2[5] ||= function() {
        return w2.onOverlayClick && w2.onOverlayClick.apply(w2, arguments);
      }, onKeydown: x2[6] ||= function() {
        return w2.onOverlayKeyDown && w2.onOverlayKeyDown.apply(w2, arguments);
      }, "data-p": w2.overlayDataP }, b2.ptm("overlay")), [c("span", t({ ref: "firstHiddenFocusableElementOnOverlay", role: "presentation", "aria-hidden": "true", class: "p-hidden-accessible p-hidden-focusable", tabindex: 0, onFocus: x2[3] ||= function() {
        return w2.onFirstHiddenFocus && w2.onFirstHiddenFocus.apply(w2, arguments);
      } }, b2.ptm("hiddenFirstFocusableEl"), { "data-p-hidden-accessible": !0, "data-p-hidden-focusable": !0 }), null, 16), e(b2.$slots, "header", { value: b2.d_value, options: w2.visibleOptions }), b2.showToggleAll && b2.selectionLimit == null || b2.filter ? (n(), l("div", t({ key: 0, class: b2.cx("header") }, b2.ptm("header")), [b2.showToggleAll && b2.selectionLimit == null ? (n(), h(D2, { key: 0, modelValue: w2.allSelected, binary: !0, disabled: b2.disabled, variant: b2.variant, "aria-label": w2.toggleAllAriaLabel, onChange: w2.onToggleAll, unstyled: b2.unstyled, pt: w2.getHeaderCheckboxPTOptions("pcHeaderCheckbox"), formControl: { novalidate: !0 } }, { icon: f(function(e2) {
        return [b2.$slots.headercheckboxicon ? (n(), h(a(b2.$slots.headercheckboxicon), { key: 0, checked: e2.checked, class: s(e2.class) }, null, 8, ["checked", "class"])) : e2.checked ? (n(), h(a(b2.checkboxIcon ? "span" : "CheckIcon"), t({ key: 1, class: [e2.class, Q({}, b2.checkboxIcon, e2.checked)] }, w2.getHeaderCheckboxPTOptions("pcHeaderCheckbox.icon")), null, 16, ["class"])) : p("", !0)];
      }), _: 1 }, 8, ["modelValue", "disabled", "variant", "aria-label", "onChange", "unstyled", "pt"])) : p("", !0), b2.filter ? (n(), h(j2, { key: 1, class: s(b2.cx("pcFilterContainer")), unstyled: b2.unstyled, pt: b2.ptm("pcFilterContainer") }, { default: f(function() {
        return [v(O2, { ref: "filterInput", value: C2.filterValue, onVnodeMounted: w2.onFilterUpdated, onVnodeUpdated: w2.onFilterUpdated, class: s(b2.cx("pcFilter")), placeholder: b2.filterPlaceholder, disabled: b2.disabled, variant: b2.variant, unstyled: b2.unstyled, role: "searchbox", autocomplete: "off", "aria-owns": b2.$id + "_list", "aria-activedescendant": w2.focusedOptionId, onKeydown: w2.onFilterKeyDown, onBlur: w2.onFilterBlur, onInput: w2.onFilterChange, pt: b2.ptm("pcFilter"), formControl: { novalidate: !0 } }, null, 8, ["value", "onVnodeMounted", "onVnodeUpdated", "class", "placeholder", "disabled", "variant", "unstyled", "aria-owns", "aria-activedescendant", "onKeydown", "onBlur", "onInput", "pt"]), v(A2, { unstyled: b2.unstyled, pt: b2.ptm("pcFilterIconContainer") }, { default: f(function() {
          return [e(b2.$slots, "filtericon", {}, function() {
            return [b2.filterIcon ? (n(), l("span", t({ key: 0, class: b2.filterIcon }, b2.ptm("filterIcon")), null, 16)) : (n(), h(k2, m(t({ key: 1 }, b2.ptm("filterIcon"))), null, 16))];
          })];
        }), _: 3 }, 8, ["unstyled", "pt"])];
      }), _: 3 }, 8, ["class", "unstyled", "pt"])) : p("", !0), b2.filter ? (n(), l("span", t({ key: 2, role: "status", "aria-live": "polite", class: "p-hidden-accessible" }, b2.ptm("hiddenFilterResult"), { "data-p-hidden-accessible": !0 }), d(w2.filterResultMessageText), 17)) : p("", !0)], 16)) : p("", !0), c("div", t({ class: b2.cx("listContainer"), style: { "max-height": w2.virtualScrollerDisabled ? b2.scrollHeight : "" } }, b2.ptm("listContainer")), [v(M2, t({ ref: w2.virtualScrollerRef }, b2.virtualScrollerOptions, { items: w2.visibleOptions, style: { height: b2.scrollHeight }, tabindex: -1, disabled: w2.virtualScrollerDisabled, pt: b2.ptm("virtualScroller") }), _({ content: f(function(r2) {
        var i2 = r2.styleClass, m2 = r2.contentRef, _2 = r2.items, y2 = r2.getItemOptions, x3 = r2.contentStyle, S3 = r2.itemSize;
        return [c("ul", t({ ref: function(e2) {
          return w2.listRef(e2, m2);
        }, id: b2.$id + "_list", class: [b2.cx("list"), i2], style: x3, role: "listbox", "aria-multiselectable": "true", "aria-label": w2.listAriaLabel }, b2.ptm("list")), [(n(!0), l(u, null, g(_2, function(r3, i3) {
          return n(), l(u, { key: w2.getOptionRenderKey(r3, w2.getOptionIndex(i3, y2)) }, [w2.isOptionGroup(r3) ? (n(), l("li", t({ key: 0, id: b2.$id + "_" + w2.getOptionIndex(i3, y2), style: { height: S3 ? S3 + "px" : void 0 }, class: b2.cx("optionGroup"), role: "option" }, { ref_for: !0 }, b2.ptm("optionGroup")), [e(b2.$slots, "optiongroup", { option: r3.optionGroup, index: w2.getOptionIndex(i3, y2) }, function() {
            return [o(d(w2.getOptionGroupLabel(r3.optionGroup)), 1)];
          })], 16, Ne)) : ee((n(), l("li", t({ key: 1, id: b2.$id + "_" + w2.getOptionIndex(i3, y2), style: { height: S3 ? S3 + "px" : void 0 }, class: b2.cx("option", { option: r3, index: i3, getItemOptions: y2 }), role: "option", "aria-label": w2.getOptionLabel(r3), "aria-selected": w2.isSelected(r3), "aria-disabled": w2.isOptionDisabled(r3), "aria-setsize": w2.ariaSetSize, "aria-posinset": w2.getAriaPosInset(w2.getOptionIndex(i3, y2)), onClick: function(e2) {
            return w2.onOptionSelect(e2, r3, w2.getOptionIndex(i3, y2), !0);
          }, onMousemove: function(e2) {
            return w2.onOptionMouseMove(e2, w2.getOptionIndex(i3, y2));
          } }, { ref_for: !0 }, w2.getCheckboxPTOptions(r3, y2, i3, "option"), { "data-p-selected": w2.isSelected(r3), "data-p-focused": C2.focusedOptionIndex === w2.getOptionIndex(i3, y2), "data-p-disabled": w2.isOptionDisabled(r3) }), [v(D2, { defaultValue: w2.isSelected(r3), binary: !0, tabindex: -1, variant: b2.variant, unstyled: b2.unstyled, pt: w2.getCheckboxPTOptions(r3, y2, i3, "pcOptionCheckbox"), formControl: { novalidate: !0 } }, { icon: f(function(e2) {
            return [b2.$slots.optioncheckboxicon || b2.$slots.itemcheckboxicon ? (n(), h(a(b2.$slots.optioncheckboxicon || b2.$slots.itemcheckboxicon), { key: 0, checked: e2.checked, class: s(e2.class) }, null, 8, ["checked", "class"])) : e2.checked ? (n(), h(a(b2.checkboxIcon ? "span" : "CheckIcon"), t({ key: 1, class: [e2.class, Q({}, b2.checkboxIcon, e2.checked)] }, { ref_for: !0 }, w2.getCheckboxPTOptions(r3, y2, i3, "pcOptionCheckbox.icon")), null, 16, ["class"])) : p("", !0)];
          }), _: 2 }, 1032, ["defaultValue", "variant", "unstyled", "pt"]), e(b2.$slots, "option", { option: r3, selected: w2.isSelected(r3), index: w2.getOptionIndex(i3, y2) }, function() {
            return [c("span", t({ ref_for: !0 }, b2.ptm("optionLabel")), d(w2.getOptionLabel(r3)), 17)];
          })], 16, Pe)), [[P2]])], 64);
        }), 128)), C2.filterValue && (!_2 || _2 && _2.length === 0) ? (n(), l("li", t({ key: 0, class: b2.cx("emptyMessage"), role: "option" }, b2.ptm("emptyMessage")), [e(b2.$slots, "emptyfilter", {}, function() {
          return [o(d(w2.emptyFilterMessageText), 1)];
        })], 16)) : !b2.options || b2.options && b2.options.length === 0 ? (n(), l("li", t({ key: 1, class: b2.cx("emptyMessage"), role: "option" }, b2.ptm("emptyMessage")), [e(b2.$slots, "empty", {}, function() {
          return [o(d(w2.emptyMessageText), 1)];
        })], 16)) : p("", !0)], 16, Me)];
      }), _: 2 }, [b2.$slots.loader ? { name: "loader", fn: f(function(t2) {
        var n2 = t2.options;
        return [e(b2.$slots, "loader", { options: n2 })];
      }), key: "0" } : void 0]), 1040, ["items", "style", "disabled", "pt"])], 16), e(b2.$slots, "footer", { value: b2.d_value, options: w2.visibleOptions }), !b2.options || b2.options && b2.options.length === 0 ? (n(), l("span", t({ key: 1, role: "status", "aria-live": "polite", class: "p-hidden-accessible" }, b2.ptm("hiddenEmptyMessage"), { "data-p-hidden-accessible": !0 }), d(w2.emptyMessageText), 17)) : p("", !0), c("span", t({ role: "status", "aria-live": "polite", class: "p-hidden-accessible" }, b2.ptm("hiddenSelectedMessage"), { "data-p-hidden-accessible": !0 }), d(w2.selectedMessageText), 17), c("span", t({ ref: "lastHiddenFocusableElementOnOverlay", role: "presentation", "aria-hidden": "true", class: "p-hidden-accessible p-hidden-focusable", tabindex: 0, onFocus: x2[4] ||= function() {
        return w2.onLastHiddenFocus && w2.onLastHiddenFocus.apply(w2, arguments);
      } }, b2.ptm("hiddenLastFocusableEl"), { "data-p-hidden-accessible": !0, "data-p-hidden-focusable": !0 }), null, 16)], 16, je)) : p("", !0)];
    }), _: 3 }, 16, ["onEnter", "onAfterEnter", "onLeave", "onAfterLeave"])];
  }), _: 3 }, 8, ["appendTo"])], 16, Oe);
}
X.render = Fe;
export {X as t};