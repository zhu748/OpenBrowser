import {C as e,J as t,P as n,W as r,X as i,Y as a,Z as o,en as s,f as c,h as l,i as u,in as d,jt as f,lt as p,m,p as h,q as g,ut as _,x as v} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {f as y,t as b} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {I as x,J as S,X as C,t as w,x as T} from "./basecomponent-ClhuVxJN.js";
import {t as E} from "./ripple-DKjDc6yC.js";
import {i as D,n as O,r as k,t as A} from "./style-_2G9QRmx.js";
import {i as j} from "./select-Cc8zLK4m.js";
import {n as M} from "./chevronleft-DZQ3hEk2.js";
import {n as N} from "./datepicker-Bd-h5Ks4.js";
var P = { name: "AccordionContent", extends: { name: "BaseAccordionContent", extends: w, props: { as: { type: [String, Object], default: "DIV" }, asChild: { type: Boolean, default: !1 } }, style: k, provide: function() {
  return { $pcAccordionContent: this, $parentInstance: this };
} }, inheritAttrs: !1, inject: ["$pcAccordion", "$pcAccordionPanel"], computed: { id: function() {
  return `${this.$pcAccordion.$id}_accordioncontent_${this.$pcAccordionPanel.value}`;
}, ariaLabelledby: function() {
  return `${this.$pcAccordion.$id}_accordionheader_${this.$pcAccordionPanel.value}`;
}, attrs: function() {
  return n(this.a11yAttrs, this.ptmi("root", this.ptParams));
}, a11yAttrs: function() {
  return { id: this.id, role: "region", "aria-labelledby": this.ariaLabelledby, "data-pc-name": "accordioncontent", "data-p-active": this.$pcAccordionPanel.active };
}, ptParams: function() {
  return { context: { active: this.$pcAccordionPanel.active } };
} } };
function F(e2, i2, a2, l2, u2, d2) {
  return e2.asChild ? t(e2.$slots, "default", { key: 1, class: s(e2.cx("root")), active: d2.$pcAccordionPanel.active, a11yAttrs: d2.a11yAttrs }) : (r(), h(b, n({ key: 0, name: "p-collapsible" }, e2.ptm("transition", d2.ptParams)), { default: p(function() {
    return [!d2.$pcAccordion.lazy || d2.$pcAccordionPanel.active ? _((r(), h(o(e2.as), n({ key: 0, class: e2.cx("root") }, d2.attrs), { default: p(function() {
      return [c("div", n({ class: e2.cx("contentWrapper") }, e2.ptm("contentWrapper", d2.ptParams)), [c("div", n({ class: e2.cx("content") }, e2.ptm("content", d2.ptParams)), [t(e2.$slots, "default")], 16)], 16)];
    }), _: 3 }, 16, ["class"])), [[y, d2.$pcAccordion.lazy ? !0 : d2.$pcAccordionPanel.active]]) : m("", !0)];
  }), _: 3 }, 16));
}
P.render = F;
var I = { name: "AccordionHeader", extends: { name: "BaseAccordionHeader", extends: w, props: { as: { type: [String, Object], default: "BUTTON" }, asChild: { type: Boolean, default: !1 } }, style: O, provide: function() {
  return { $pcAccordionHeader: this, $parentInstance: this };
} }, inheritAttrs: !1, inject: ["$pcAccordion", "$pcAccordionPanel"], methods: { onFocus: function() {
  this.$pcAccordion.selectOnFocus && this.changeActiveValue();
}, onClick: function() {
  !this.$pcAccordion.selectOnFocus && this.changeActiveValue();
}, onKeydown: function(e2) {
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
    case "Space":
      this.onEnterKey(e2);
  }
}, onArrowDownKey: function(e2) {
  var t2 = this.findNextPanel(this.findPanel(e2.currentTarget));
  t2 ? this.changeFocusedPanel(e2, t2) : this.onHomeKey(e2), e2.preventDefault();
}, onArrowUpKey: function(e2) {
  var t2 = this.findPrevPanel(this.findPanel(e2.currentTarget));
  t2 ? this.changeFocusedPanel(e2, t2) : this.onEndKey(e2), e2.preventDefault();
}, onHomeKey: function(e2) {
  var t2 = this.findFirstPanel();
  this.changeFocusedPanel(e2, t2), e2.preventDefault();
}, onEndKey: function(e2) {
  var t2 = this.findLastPanel();
  this.changeFocusedPanel(e2, t2), e2.preventDefault();
}, onEnterKey: function(e2) {
  this.changeActiveValue(), e2.preventDefault();
}, findPanel: function(e2) {
  return e2?.closest('[data-pc-name="accordionpanel"]');
}, findHeader: function(e2) {
  return S(e2, '[data-pc-name="accordionheader"]');
}, findNextPanel: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 && arguments[1] ? e2 : e2.nextElementSibling;
  return t2 ? T(t2, "data-p-disabled") ? this.findNextPanel(t2) : this.findHeader(t2) : null;
}, findPrevPanel: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 && arguments[1] ? e2 : e2.previousElementSibling;
  return t2 ? T(t2, "data-p-disabled") ? this.findPrevPanel(t2) : this.findHeader(t2) : null;
}, findFirstPanel: function() {
  return this.findNextPanel(this.$pcAccordion.$el.firstElementChild, !0);
}, findLastPanel: function() {
  return this.findPrevPanel(this.$pcAccordion.$el.lastElementChild, !0);
}, changeActiveValue: function() {
  this.$pcAccordion.updateValue(this.$pcAccordionPanel.value);
}, changeFocusedPanel: function(e2, t2) {
  x(this.findHeader(t2));
} }, computed: { id: function() {
  return `${this.$pcAccordion.$id}_accordionheader_${this.$pcAccordionPanel.value}`;
}, ariaControls: function() {
  return `${this.$pcAccordion.$id}_accordioncontent_${this.$pcAccordionPanel.value}`;
}, attrs: function() {
  return n(this.asAttrs, this.a11yAttrs, this.ptmi("root", this.ptParams));
}, asAttrs: function() {
  return this.as === "BUTTON" ? { type: "button", disabled: this.$pcAccordionPanel.disabled } : void 0;
}, a11yAttrs: function() {
  return { id: this.id, tabindex: this.$pcAccordion.tabindex, "aria-expanded": this.$pcAccordionPanel.active, "aria-controls": this.ariaControls, "data-pc-name": "accordionheader", "data-p-disabled": this.$pcAccordionPanel.disabled, "data-p-active": this.$pcAccordionPanel.active, onFocus: this.onFocus, onKeydown: this.onKeydown };
}, ptParams: function() {
  return { context: { active: this.$pcAccordionPanel.active } };
}, dataP: function() {
  return C({ active: this.$pcAccordionPanel.active });
} }, components: { ChevronUpIcon: N, ChevronDownIcon: j }, directives: { ripple: E } };
function L(e2, a2, c2, l2, u2, d2) {
  var f2 = i("ripple");
  return e2.asChild ? t(e2.$slots, "default", { key: 1, class: s(e2.cx("root")), active: d2.$pcAccordionPanel.active, a11yAttrs: d2.a11yAttrs, onClick: d2.onClick }) : _((r(), h(o(e2.as), n({ key: 0, "data-p": d2.dataP, class: e2.cx("root"), onClick: d2.onClick }, d2.attrs), { default: p(function() {
    return [t(e2.$slots, "default", { active: d2.$pcAccordionPanel.active }), t(e2.$slots, "toggleicon", { active: d2.$pcAccordionPanel.active, class: s(e2.cx("toggleicon")) }, function() {
      return [d2.$pcAccordionPanel.active ? (r(), h(o(d2.$pcAccordion.$slots.collapseicon ? d2.$pcAccordion.$slots.collapseicon : d2.$pcAccordion.collapseIcon ? "span" : "ChevronUpIcon"), n({ key: 0, class: [d2.$pcAccordion.collapseIcon, e2.cx("toggleicon")], "aria-hidden": "true" }, e2.ptm("toggleicon", d2.ptParams)), null, 16, ["class"])) : (r(), h(o(d2.$pcAccordion.$slots.expandicon ? d2.$pcAccordion.$slots.expandicon : d2.$pcAccordion.expandIcon ? "span" : "ChevronDownIcon"), n({ key: 1, class: [d2.$pcAccordion.expandIcon, e2.cx("toggleicon")], "aria-hidden": "true" }, e2.ptm("toggleicon", d2.ptParams)), null, 16, ["class"]))];
    })];
  }), _: 3 }, 16, ["data-p", "class", "onClick"])), [[f2]]);
}
I.render = L;
var R = { name: "AccordionPanel", extends: { name: "BaseAccordionPanel", extends: w, props: { value: { type: [String, Number], default: void 0 }, disabled: { type: Boolean, default: !1 }, as: { type: [String, Object], default: "DIV" }, asChild: { type: Boolean, default: !1 } }, style: A, provide: function() {
  return { $pcAccordionPanel: this, $parentInstance: this };
} }, inheritAttrs: !1, inject: ["$pcAccordion"], computed: { active: function() {
  return this.$pcAccordion.isItemActive(this.value);
}, attrs: function() {
  return n(this.a11yAttrs, this.ptmi("root", this.ptParams));
}, a11yAttrs: function() {
  return { "data-pc-name": "accordionpanel", "data-p-disabled": this.disabled, "data-p-active": this.active };
}, ptParams: function() {
  return { context: { active: this.active } };
} } };
function z(e2, i2, a2, c2, l2, u2) {
  return e2.asChild ? t(e2.$slots, "default", { key: 1, class: s(e2.cx("root")), active: u2.active, a11yAttrs: u2.a11yAttrs }) : (r(), h(o(e2.as), n({ key: 0, class: e2.cx("root") }, u2.attrs), { default: p(function() {
    return [t(e2.$slots, "default")];
  }), _: 3 }, 16, ["class"]));
}
R.render = z;
var B = { name: "Accordion", extends: { name: "BaseAccordion", extends: w, props: { value: { type: [String, Number, Array], default: void 0 }, multiple: { type: Boolean, default: !1 }, lazy: { type: Boolean, default: !1 }, tabindex: { type: Number, default: 0 }, selectOnFocus: { type: Boolean, default: !1 }, expandIcon: { type: String, default: void 0 }, collapseIcon: { type: String, default: void 0 }, activeIndex: { type: [Number, Array], default: null } }, style: D, provide: function() {
  return { $pcAccordion: this, $parentInstance: this };
} }, inheritAttrs: !1, emits: ["update:value", "update:activeIndex", "tab-open", "tab-close", "tab-click"], data: function() {
  return { d_value: this.value };
}, watch: { value: function(e2) {
  this.d_value = e2;
}, activeIndex: { immediate: !0, handler: function(e2) {
  this.hasAccordionTab && (this.d_value = this.multiple ? e2?.map(String) : e2?.toString());
} } }, methods: { isItemActive: function(e2) {
  return this.multiple ? this.d_value?.includes(e2) : this.d_value === e2;
}, updateValue: function(e2) {
  var t2 = this.isItemActive(e2);
  this.multiple ? t2 ? this.d_value = this.d_value.filter(function(t3) {
    return t3 !== e2;
  }) : this.d_value ? this.d_value.push(e2) : this.d_value = [e2] : this.d_value = t2 ? null : e2, this.$emit("update:value", this.d_value), this.$emit("update:activeIndex", this.multiple ? this.d_value?.map(Number) : Number(this.d_value)), this.$emit(t2 ? "tab-close" : "tab-open", { originalEvent: void 0, index: Number(e2) });
}, isAccordionTab: function(e2) {
  return e2.type.name === "AccordionTab";
}, getTabProp: function(e2, t2) {
  return e2.props ? e2.props[t2] : void 0;
}, getKey: function(e2, t2) {
  return this.getTabProp(e2, "header") || t2;
}, getHeaderPT: function(e2, t2) {
  var r2 = this;
  return { root: n({ onClick: function(e3) {
    return r2.onTabClick(e3, t2);
  } }, this.getTabProp(e2, "headerProps"), this.getTabPT(e2, "header", t2)), toggleicon: n(this.getTabProp(e2, "headeractionprops"), this.getTabPT(e2, "headeraction", t2)) };
}, getContentPT: function(e2, t2) {
  return { root: n(this.getTabProp(e2, "contentProps"), this.getTabPT(e2, "toggleablecontent", t2)), transition: this.getTabPT(e2, "transition", t2), content: this.getTabPT(e2, "content", t2) };
}, getTabPT: function(e2, t2, r2) {
  var i2 = this.tabs.length, a2 = { props: e2.props || {}, parent: { instance: this, props: this.$props, state: this.$data }, context: { index: r2, count: i2, first: r2 === 0, last: r2 === i2 - 1, active: this.isItemActive(`${r2}`) } };
  return n(this.ptm(`accordiontab.${t2}`, a2), this.ptmo(this.getTabProp(e2, "pt"), t2, a2));
}, onTabClick: function(e2, t2) {
  this.$emit("tab-click", { originalEvent: e2, index: t2 });
} }, computed: { tabs: function() {
  var e2 = this;
  return this.$slots.default().reduce(function(t2, n2) {
    return e2.isAccordionTab(n2) ? t2.push(n2) : n2.children && n2.children instanceof Array && n2.children.forEach(function(n3) {
      e2.isAccordionTab(n3) && t2.push(n3);
    }), t2;
  }, []);
}, hasAccordionTab: function() {
  return this.tabs.length;
} }, components: { AccordionPanel: R, AccordionHeader: I, AccordionContent: P, ChevronUpIcon: N, ChevronRightIcon: M } };
function V(e2, i2, c2, f2, _2, y2) {
  var b2 = a("AccordionHeader"), x2 = a("AccordionContent"), S2 = a("AccordionPanel");
  return r(), l("div", n({ class: e2.cx("root") }, e2.ptmi("root")), [y2.hasAccordionTab ? (r(!0), l(u, { key: 0 }, g(y2.tabs, function(t2, i3) {
    return r(), h(S2, { key: y2.getKey(t2, i3), value: `${i3}`, pt: { root: y2.getTabPT(t2, "root", i3) }, disabled: y2.getTabProp(t2, "disabled") }, { default: p(function() {
      return [v(b2, { class: s(y2.getTabProp(t2, "headerClass")), pt: y2.getHeaderPT(t2, i3) }, { toggleicon: p(function(a2) {
        return [a2.active ? (r(), h(o(e2.$slots.collapseicon ? e2.$slots.collapseicon : e2.collapseIcon ? "span" : "ChevronDownIcon"), n({ key: 0, class: [e2.collapseIcon, a2.class], "aria-hidden": "true" }, { ref_for: !0 }, y2.getTabPT(t2, "headericon", i3)), null, 16, ["class"])) : (r(), h(o(e2.$slots.expandicon ? e2.$slots.expandicon : e2.expandIcon ? "span" : "ChevronUpIcon"), n({ key: 1, class: [e2.expandIcon, a2.class], "aria-hidden": "true" }, { ref_for: !0 }, y2.getTabPT(t2, "headericon", i3)), null, 16, ["class"]))];
      }), default: p(function() {
        return [t2.children && t2.children.headericon ? (r(), h(o(t2.children.headericon), { key: 0, isTabActive: y2.isItemActive(`${i3}`), active: y2.isItemActive(`${i3}`), index: i3 }, null, 8, ["isTabActive", "active", "index"])) : m("", !0), t2.props && t2.props.header ? (r(), l("span", n({ key: 1, ref_for: !0 }, y2.getTabPT(t2, "headertitle", i3)), d(t2.props.header), 17)) : m("", !0), t2.children && t2.children.header ? (r(), h(o(t2.children.header), { key: 2 })) : m("", !0)];
      }), _: 2 }, 1032, ["class", "pt"]), v(x2, { pt: y2.getContentPT(t2, i3) }, { default: p(function() {
        return [(r(), h(o(t2)))];
      }), _: 2 }, 1032, ["pt"])];
    }), _: 2 }, 1032, ["value", "pt", "disabled"]);
  }), 128)) : t(e2.$slots, "default", { key: 1 })], 16);
}
B.render = V;
var H = e({ __name: "index", setup(e2) {
  return (e3, n2) => (r(), h(f(B), null, { collapseicon: p(() => [...n2[0] ||= []]), expandicon: p(() => [...n2[1] ||= []]), default: p(() => [t(e3.$slots, "default")]), _: 3 }));
} });
export {P as i,R as n,I as r,H as t};