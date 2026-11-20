import {J as e,P as t,W as n,X as r,Z as i,en as a,f as o,h as s,i as c,lt as l,m as u,p as d,ut as f} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {f as p} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {C as m,E as h,I as g,J as _,K as v,O as y,X as b,h as x,s as S,t as C,x as w} from "./basecomponent-ClhuVxJN.js";
import {E as T} from "./dist-DPswMdzV.js";
import {t as E} from "./ripple-DKjDc6yC.js";
import {a as D,i as O,n as k,r as A,t as j} from "./style-CEf8x4sr.js";
import {n as M,t as N} from "./chevronleft-DZQ3hEk2.js";
var P = { name: "Tabs", extends: { name: "BaseTabs", extends: C, props: { value: { type: [String, Number], default: void 0 }, lazy: { type: Boolean, default: !1 }, scrollable: { type: Boolean, default: !1 }, showNavigators: { type: Boolean, default: !0 }, tabindex: { type: Number, default: 0 }, selectOnFocus: { type: Boolean, default: !1 } }, style: j, provide: function() {
  return { $pcTabs: this, $parentInstance: this };
} }, inheritAttrs: !1, emits: ["update:value"], data: function() {
  return { d_value: this.value };
}, watch: { value: function(e2) {
  this.d_value = e2;
} }, methods: { updateValue: function(e2) {
  this.d_value !== e2 && (this.d_value = e2, this.$emit("update:value", e2));
}, isVertical: function() {
  return this.orientation === "vertical";
} } };
function F(r2, i2, a2, o2, c2, l2) {
  return n(), s("div", t({ class: r2.cx("root") }, r2.ptmi("root")), [e(r2.$slots, "default")], 16);
}
P.render = F;
var I = { name: "TabPanels", extends: { name: "BaseTabPanels", extends: C, props: {}, style: k, provide: function() {
  return { $pcTabPanels: this, $parentInstance: this };
} }, inheritAttrs: !1 };
function L(r2, i2, a2, o2, c2, l2) {
  return n(), s("div", t({ class: r2.cx("root"), role: "presentation" }, r2.ptmi("root")), [e(r2.$slots, "default")], 16);
}
I.render = L;
var R = { name: "TabPanel", extends: { name: "BaseTabPanel", extends: C, props: { value: { type: [String, Number], default: void 0 }, as: { type: [String, Object], default: "DIV" }, asChild: { type: Boolean, default: !1 }, header: null, headerStyle: null, headerClass: null, headerProps: null, headerActionProps: null, contentStyle: null, contentClass: null, contentProps: null, disabled: Boolean }, style: A, provide: function() {
  return { $pcTabPanel: this, $parentInstance: this };
} }, inheritAttrs: !1, inject: ["$pcTabs"], computed: { active: function() {
  return T(this.$pcTabs?.d_value, this.value);
}, id: function() {
  return `${this.$pcTabs?.$id}_tabpanel_${this.value}`;
}, ariaLabelledby: function() {
  return `${this.$pcTabs?.$id}_tab_${this.value}`;
}, attrs: function() {
  return t(this.a11yAttrs, this.ptmi("root", this.ptParams));
}, a11yAttrs: function() {
  return { id: this.id, tabindex: this.$pcTabs?.tabindex, role: "tabpanel", "aria-labelledby": this.ariaLabelledby, "data-pc-name": "tabpanel", "data-p-active": this.active };
}, ptParams: function() {
  return { context: { active: this.active } };
} } };
function z(r2, o2, m2, h2, g2, _2) {
  var v2, y2;
  return _2.$pcTabs ? (n(), s(c, { key: 1 }, [r2.asChild ? e(r2.$slots, "default", { key: 1, class: a(r2.cx("root")), active: _2.active, a11yAttrs: _2.a11yAttrs }) : (n(), s(c, { key: 0 }, [!((v2 = _2.$pcTabs) != null && v2.lazy) || _2.active ? f((n(), d(i(r2.as), t({ key: 0, class: r2.cx("root") }, _2.attrs), { default: l(function() {
    return [e(r2.$slots, "default")];
  }), _: 3 }, 16, ["class"])), [[p, (y2 = _2.$pcTabs) != null && y2.lazy ? !0 : _2.active]]) : u("", !0)], 64))], 64)) : e(r2.$slots, "default", { key: 0 });
}
R.render = z;
var B = { name: "TabList", extends: { name: "BaseTabList", extends: C, props: {}, style: O, provide: function() {
  return { $pcTabList: this, $parentInstance: this };
} }, inheritAttrs: !1, inject: ["$pcTabs"], data: function() {
  return { isPrevButtonEnabled: !1, isNextButtonEnabled: !0 };
}, resizeObserver: void 0, inkBarObserver: void 0, watch: { showNavigators: function(e2) {
  e2 ? this.bindResizeObserver() : this.unbindResizeObserver();
}, activeValue: { flush: "post", handler: function() {
  this.updateInkBar(), this.bindInkBarObserver();
} } }, mounted: function() {
  var e2 = this;
  setTimeout(function() {
    e2.updateInkBar(), e2.bindInkBarObserver();
  }, 150), this.showNavigators && (this.updateButtonState(), this.bindResizeObserver());
}, updated: function() {
  this.showNavigators && this.updateButtonState();
}, beforeUnmount: function() {
  this.unbindResizeObserver(), this.unbindInkBarObserver();
}, methods: { onScroll: function(e2) {
  this.showNavigators && this.updateButtonState(), e2.preventDefault();
}, onPrevButtonClick: function() {
  var e2 = this.$refs.content, t2 = this.getVisibleButtonWidths(), n2 = m(e2) - t2, r2 = Math.abs(e2.scrollLeft) - n2 * 0.8, i2 = Math.max(r2, 0);
  e2.scrollLeft = y(e2) ? -1 * i2 : i2;
}, onNextButtonClick: function() {
  var e2 = this.$refs.content, t2 = this.getVisibleButtonWidths(), n2 = m(e2) - t2, r2 = Math.abs(e2.scrollLeft) + n2 * 0.8, i2 = e2.scrollWidth - n2, a2 = Math.min(r2, i2);
  e2.scrollLeft = y(e2) ? -1 * a2 : a2;
}, bindResizeObserver: function() {
  var e2 = this;
  this.resizeObserver = new ResizeObserver(function() {
    return e2.updateButtonState();
  }), this.resizeObserver.observe(this.$refs.list);
}, unbindResizeObserver: function() {
  var e2;
  (e2 = this.resizeObserver) == null || e2.unobserve(this.$refs.list), this.resizeObserver = void 0;
}, bindInkBarObserver: function() {
  var e2 = this;
  this.unbindInkBarObserver();
  var t2 = this.$refs.content, n2 = _(t2, '[data-pc-name="tab"][data-p-active="true"]');
  n2 && (this.inkBarObserver = new ResizeObserver(function() {
    return e2.updateInkBar();
  }), this.inkBarObserver.observe(n2));
}, unbindInkBarObserver: function() {
  var e2;
  (e2 = this.inkBarObserver) == null || e2.disconnect(), this.inkBarObserver = void 0;
}, updateInkBar: function() {
  var e2 = this.$refs, t2 = e2.content, n2 = e2.inkbar, r2 = e2.tabs;
  if (n2) {
    var i2 = _(t2, '[data-pc-name="tab"][data-p-active="true"]');
    this.$pcTabs.isVertical() ? (n2.style.height = S(i2) + "px", n2.style.top = x(i2).top - x(r2).top + "px") : (n2.style.width = v(i2) + "px", n2.style.left = x(i2).left - x(r2).left + "px");
  }
}, updateButtonState: function() {
  var e2 = this.$refs, t2 = e2.list, n2 = e2.content, r2 = n2.scrollTop, i2 = n2.scrollWidth, a2 = n2.scrollHeight, o2 = n2.offsetWidth, s2 = n2.offsetHeight, c2 = Math.abs(n2.scrollLeft), l2 = [m(n2), h(n2)], u2 = l2[0], d2 = l2[1];
  this.$pcTabs.isVertical() ? (this.isPrevButtonEnabled = r2 !== 0, this.isNextButtonEnabled = t2.offsetHeight >= s2 && parseInt(r2) !== a2 - d2) : (this.isPrevButtonEnabled = c2 !== 0, this.isNextButtonEnabled = t2.offsetWidth >= o2 && parseInt(c2) !== i2 - u2);
}, getVisibleButtonWidths: function() {
  var e2 = this.$refs, t2 = e2.prevButton, n2 = e2.nextButton, r2 = 0;
  return this.showNavigators && (r2 = (t2?.offsetWidth || 0) + (n2?.offsetWidth || 0)), r2;
} }, computed: { templates: function() {
  return this.$pcTabs.$slots;
}, activeValue: function() {
  return this.$pcTabs.d_value;
}, showNavigators: function() {
  return this.$pcTabs.showNavigators;
}, prevButtonAriaLabel: function() {
  return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria.previous : void 0;
}, nextButtonAriaLabel: function() {
  return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria.next : void 0;
}, dataP: function() {
  return b({ scrollable: this.$pcTabs.scrollable });
} }, components: { ChevronLeftIcon: N, ChevronRightIcon: M }, directives: { ripple: E } };
var V = ["data-p"];
var H = ["aria-label", "tabindex"];
var U = ["data-p"];
var W = ["aria-orientation"];
var G = ["aria-label", "tabindex"];
function K(a2, c2, l2, p2, m2, h2) {
  var g2 = r("ripple");
  return n(), s("div", t({ ref: "list", class: a2.cx("root"), "data-p": h2.dataP }, a2.ptmi("root")), [h2.showNavigators && m2.isPrevButtonEnabled ? f((n(), s("button", t({ key: 0, ref: "prevButton", type: "button", class: a2.cx("prevButton"), "aria-label": h2.prevButtonAriaLabel, tabindex: h2.$pcTabs.tabindex, onClick: c2[0] ||= function() {
    return h2.onPrevButtonClick && h2.onPrevButtonClick.apply(h2, arguments);
  } }, a2.ptm("prevButton"), { "data-pc-group-section": "navigator" }), [(n(), d(i(h2.templates.previcon || "ChevronLeftIcon"), t({ "aria-hidden": "true" }, a2.ptm("prevIcon")), null, 16))], 16, H)), [[g2]]) : u("", !0), o("div", t({ ref: "content", class: a2.cx("content"), onScroll: c2[1] ||= function() {
    return h2.onScroll && h2.onScroll.apply(h2, arguments);
  }, "data-p": h2.dataP }, a2.ptm("content")), [o("div", t({ ref: "tabs", class: a2.cx("tabList"), role: "tablist", "aria-orientation": h2.$pcTabs.orientation || "horizontal" }, a2.ptm("tabList")), [e(a2.$slots, "default"), o("span", t({ ref: "inkbar", class: a2.cx("activeBar"), role: "presentation", "aria-hidden": "true" }, a2.ptm("activeBar")), null, 16)], 16, W)], 16, U), h2.showNavigators && m2.isNextButtonEnabled ? f((n(), s("button", t({ key: 1, ref: "nextButton", type: "button", class: a2.cx("nextButton"), "aria-label": h2.nextButtonAriaLabel, tabindex: h2.$pcTabs.tabindex, onClick: c2[2] ||= function() {
    return h2.onNextButtonClick && h2.onNextButtonClick.apply(h2, arguments);
  } }, a2.ptm("nextButton"), { "data-pc-group-section": "navigator" }), [(n(), d(i(h2.templates.nexticon || "ChevronRightIcon"), t({ "aria-hidden": "true" }, a2.ptm("nextIcon")), null, 16))], 16, G)), [[g2]]) : u("", !0)], 16, V);
}
B.render = K;
var q = { name: "Tab", extends: { name: "BaseTab", extends: C, props: { value: { type: [String, Number], default: void 0 }, disabled: { type: Boolean, default: !1 }, as: { type: [String, Object], default: "BUTTON" }, asChild: { type: Boolean, default: !1 } }, style: D, provide: function() {
  return { $pcTab: this, $parentInstance: this };
} }, inheritAttrs: !1, inject: ["$pcTabs", "$pcTabList"], methods: { onFocus: function() {
  this.$pcTabs.selectOnFocus && this.changeActiveValue();
}, onClick: function() {
  this.changeActiveValue();
}, onKeydown: function(e2) {
  switch (e2.code) {
    case "ArrowRight":
      this.onArrowRightKey(e2);
      break;
    case "ArrowLeft":
      this.onArrowLeftKey(e2);
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
  }
}, onArrowRightKey: function(e2) {
  var t2 = this.findNextTab(e2.currentTarget);
  t2 ? this.changeFocusedTab(e2, t2) : this.onHomeKey(e2), e2.preventDefault();
}, onArrowLeftKey: function(e2) {
  var t2 = this.findPrevTab(e2.currentTarget);
  t2 ? this.changeFocusedTab(e2, t2) : this.onEndKey(e2), e2.preventDefault();
}, onHomeKey: function(e2) {
  var t2 = this.findFirstTab();
  this.changeFocusedTab(e2, t2), e2.preventDefault();
}, onEndKey: function(e2) {
  var t2 = this.findLastTab();
  this.changeFocusedTab(e2, t2), e2.preventDefault();
}, onPageDownKey: function(e2) {
  this.scrollInView(this.findLastTab()), e2.preventDefault();
}, onPageUpKey: function(e2) {
  this.scrollInView(this.findFirstTab()), e2.preventDefault();
}, onEnterKey: function(e2) {
  this.changeActiveValue();
}, findNextTab: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 && arguments[1] ? e2 : e2.nextElementSibling;
  return t2 ? w(t2, "data-p-disabled") || w(t2, "data-pc-section") === "activebar" ? this.findNextTab(t2) : _(t2, '[data-pc-name="tab"]') : null;
}, findPrevTab: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 && arguments[1] ? e2 : e2.previousElementSibling;
  return t2 ? w(t2, "data-p-disabled") || w(t2, "data-pc-section") === "activebar" ? this.findPrevTab(t2) : _(t2, '[data-pc-name="tab"]') : null;
}, findFirstTab: function() {
  return this.findNextTab(this.$pcTabList.$refs.tabs.firstElementChild, !0);
}, findLastTab: function() {
  return this.findPrevTab(this.$pcTabList.$refs.tabs.lastElementChild, !0);
}, changeActiveValue: function() {
  this.$pcTabs.updateValue(this.value);
}, changeFocusedTab: function(e2, t2) {
  g(t2), this.scrollInView(t2);
}, scrollInView: function(e2) {
  var t2;
  e2 == null || (t2 = e2.scrollIntoView) == null || t2.call(e2, { block: "nearest" });
} }, computed: { active: function() {
  return T(this.$pcTabs?.d_value, this.value);
}, id: function() {
  return `${this.$pcTabs?.$id}_tab_${this.value}`;
}, ariaControls: function() {
  return `${this.$pcTabs?.$id}_tabpanel_${this.value}`;
}, attrs: function() {
  return t(this.asAttrs, this.a11yAttrs, this.ptmi("root", this.ptParams));
}, asAttrs: function() {
  return this.as === "BUTTON" ? { type: "button", disabled: this.disabled } : void 0;
}, a11yAttrs: function() {
  return { id: this.id, tabindex: this.active ? this.$pcTabs.tabindex : -1, role: "tab", "aria-selected": this.active, "aria-controls": this.ariaControls, "data-pc-name": "tab", "data-p-disabled": this.disabled, "data-p-active": this.active, onFocus: this.onFocus, onKeydown: this.onKeydown };
}, ptParams: function() {
  return { context: { active: this.active } };
}, dataP: function() {
  return b({ active: this.active });
} }, directives: { ripple: E } };
function J(o2, s2, c2, u2, p2, m2) {
  var h2 = r("ripple");
  return o2.asChild ? e(o2.$slots, "default", { key: 1, dataP: m2.dataP, class: a(o2.cx("root")), active: m2.active, a11yAttrs: m2.a11yAttrs, onClick: m2.onClick }) : f((n(), d(i(o2.as), t({ key: 0, class: o2.cx("root"), "data-p": m2.dataP, onClick: m2.onClick }, m2.attrs), { default: l(function() {
    return [e(o2.$slots, "default")];
  }), _: 3 }, 16, ["class", "data-p", "onClick"])), [[h2]]);
}
q.render = J;
export {P as a,I as i,B as n,R as r,q as t};