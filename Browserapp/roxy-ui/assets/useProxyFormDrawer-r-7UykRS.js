import {Dr as e,cr as t,h as n,hn as r,ui as i,v as a} from "./utils-BIWenCnY.js";
import {C as o,D as s,F as c,H as l,J as u,P as d,St as f,V as p,W as m,X as h,Y as g,Z as _,_t as v,at as y,d as b,en as x,f as S,h as C,i as w,in as T,jt as E,lt as D,m as O,p as k,q as A,st as j,ut as M,v as N,w as P,x as F} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {a as I,m as L,o as R,t as z} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {o as B} from "./dist-NctnpPRe.js";
import {n as V} from "./agent-BmSFI9WH.js";
import {t as H} from "./proxy-D7e36h-l.js";
import {b as ee,r as te} from "./rich-html-link-VdBpR3Cm.js";
import {I as ne,X as re,Z as ie,k as ae,t as oe} from "./basecomponent-ClhuVxJN.js";
import {t as U} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as W} from "./zindex-cO8iUN-n.js";
import {t as G} from "./tooltip-BYYKWrvu.js";
import {t as K} from "./focustrap-DJJkEqE8.js";
import {t as q} from "./button-BKeo7L17.js";
import {t as se} from "./style-DXn2Xqzj.js";
import {t as ce} from "./times-NAtDB1bj.js";
import {n as le,r as ue} from "./dialog-CrBr3eoy.js";
import {t as de} from "./portal-Cm1Im7J-.js";
import {t as J} from "./rx-button-DyzuUt-V.js";
import {t as fe} from "./m-input-text-JVbCgVJP.js";
import {n as pe} from "./hooks-Jw3GridD.js";
import {t as me} from "./related-info-VU3nxvtB.js";
import {n as he} from "./useProfileEntityLabels-BfqbVpel.js";
import {t as ge} from "./single-proxies-C7CAMkyq.js";
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
var Ce = { class: "flex flex-col h-full min-h-0 overflow-hidden" };
var we = { class: "tt-primary text-3.5 font-600 leading-4.5" };
var Te = { class: "flex-1 min-h-0 overflow-hidden" };
var Ee = U(o({ __name: "drawer", props: { title: {}, position: { default: "right" }, pt: {} }, setup(e2) {
  let t2 = R(), n2 = { mask: "pa-3", root: "overflow-hidden rounded-2 border-0.5 !w-auto max-w-full", ...e2.pt };
  return (r2, i2) => {
    let a2 = J;
    return m(), k(E(Z), d({ position: e2.position, pt: n2 }, r2.$attrs), { container: D(({ closeCallback: n3 }) => [S("div", Ce, [u(r2.$slots, "header", { closeCallback: n3 }, () => [S("div", { class: x(["flex justify-between items-center self-stretch gap-3 py-2 pl-4 pr-3 shrink-0", E(t2).header]) }, [S("div", we, T(e2.title), 1), F(a2, { text: "", severity: "secondary", size: "xxs", icon: "base/rx_ic_delete", onClick: n3 }, null, 8, ["onClick"])], 2)]), S("div", Te, [u(r2.$slots, "container")])])]), _: 3 }, 16, ["position"]);
  };
} }), [["__cssModules", { $style: { header: "_header_12u5y_1" } }]]);
function Q() {
  let e2 = P()?.appContext;
  if (!e2) throw Error("useDrawer must be used within a component setup");
  let t2 = f(!1), n2 = f({}), r2 = null, i2 = () => {
    let { slots: e3, ...r3 } = n2.value;
    return F(Ee, d(r3, { visible: t2.value, "onUpdate:visible": (e4) => t2.value = e4 }), e3);
  }, a2 = () => {
    r2 &&= (I(null, r2), r2.remove(), null);
  }, o2 = async () => {
    a2(), r2 = document.createElement("div"), document.body.appendChild(r2);
    let t3 = F(i2);
    t3.appContext = e2, I(t3, r2), await c();
  };
  return l(() => {
    a2();
  }), { showDrawer: async (e3) => {
    try {
      n2.value = e3, await o2(), t2.value = !0;
    } catch (e4) {
      console.error("Failed to show drawer:", e4);
    }
  }, hideDrawer: () => {
    t2.value = !1;
  } };
}
var De = { key: 0, class: "absolute z-50 min-w-100 w-full mt-2 overflow-hidden pa-1 dropdown" };
var $ = { class: "primary" };
var Oe = { class: "py-2 px-2.5 header" };
var ke = ["onMousedown", "onMouseenter"];
var Ae = { class: "flex items-center gap-2" };
var je = { class: "primary" };
var Me = { class: "syntax" };
var Ne = U(o({ __name: "advanced-search", props: { options: { default: () => [] }, search: { type: Function }, clear: { type: Function }, query: { default: "" } }, setup(e2) {
  let t2 = b(() => e2.options.map((e3) => ({ ...e3, text: $t("\u641C\u7D22{label} {value}", { value: "{value}", label: e3.label }) }))), n2 = y("input"), r2 = f(e2.query), a2 = f(null), o2 = f(!1), s2 = f(!1), c2 = f(!1), u2 = f(!!e2.query.trim()), d2 = f(0), h2 = b(() => L2(r2.value) || r2.value), _2 = b(() => i ? "\u2318 + F" : "Ctrl + F");
  j(r2, (e3) => {
    let n3 = M2(e3);
    if (n3) {
      let e4 = t2.value.findIndex((e5) => e5.syntax === n3.syntax);
      e4 !== -1 && (d2.value = e4 + 1);
    } else d2.value = 0;
  }), p(() => {
    document.addEventListener("keydown", k2), e2.query && (a2.value = M2(e2.query));
  }), l(() => {
    document.removeEventListener("keydown", k2);
  });
  function k2(e3) {
    (i ? e3.metaKey : e3.ctrlKey) && e3.key.toLowerCase() === "f" && (e3.preventDefault(), n2.value?.focus());
  }
  function M2(e3) {
    let n3 = e3.match(/^(\w+)::.*$/);
    if (n3) {
      let e4 = `${n3[1]}::`;
      return t2.value.find((t3) => t3.syntax === e4);
    }
    return null;
  }
  function P2() {
    r2.value = "", a2.value = void 0, o2.value = !1, u2.value && (u2.value = !1, e2.clear?.());
  }
  function I2() {
    let e3 = L2(r2.value);
    r2.value = e3, a2.value = void 0, o2.value = !1, z2();
  }
  function L2(e3) {
    let t3 = e3.match(/^(\w+::)(.*)$/);
    return t3 ? t3[2] : e3;
  }
  function R2(e3) {
    a2.value = e3;
    let t3 = L2(r2.value);
    r2.value = `${e3.syntax}${t3}`, o2.value = !1, z2();
  }
  async function z2() {
    n2.value?.blur(), s2.value = !0, u2.value = !0;
    let t3 = a2.value ? r2.value.replace(new RegExp(a2.value.syntax), "") : r2.value;
    await e2.search?.({ ...a2.value, value: t3 }), s2.value = !1;
  }
  function B2(e3) {
    let n3 = 1 + t2.value.length;
    if (e3.key === "ArrowDown") e3.preventDefault(), o2.value ||= !0, d2.value = (d2.value + 1) % n3;
    else if (e3.key === "ArrowUp") e3.preventDefault(), o2.value ||= !0, d2.value = (d2.value - 1 + n3) % n3;
    else if (e3.key === "Enter")
      if (e3.preventDefault(), o2.value = !1, d2.value === 0) {
        let e4 = L2(r2.value);
        r2.value = e4, a2.value = void 0, z2();
      } else {
        let e4 = t2.value[d2.value - 1];
        R2(e4);
      }
    else e3.key === "Escape" && (o2.value = !1);
  }
  function V2() {
    o2.value = !0, c2.value = !0;
  }
  function H2() {
    setTimeout(() => {
      o2.value = !1, c2.value = !1;
    }, 150);
  }
  return (e3, n3) => {
    let i2 = ie, l2 = g("i18n-t");
    return m(), C("div", { class: x(["relative transition-all duration-300 ease", [E(r2) || E(c2) ? "w-50" : "w-35"]]) }, [F(fe, { ref: "input", modelValue: E(r2), "onUpdate:modelValue": n3[0] ||= (e4) => v(r2) ? r2.value = e4 : null, class: "!h-6.5", size: "xxs", "pre-icon": "base/rx_ic_magnify", placeholder: e3.$t("\u641C\u7D22 {shortcut}", { shortcut: E(_2) }), disabled: E(s2), onFocus: V2, onBlur: H2, onKeydown: B2 }, N({ _: 2 }, [E(r2) ? { name: "icon", fn: D(() => [F(i2, { class: "cursor-pointer", name: "base/rx_ic_delete", size: "16", onClick: P2 })]), key: "0" } : void 0]), 1032, ["modelValue", "placeholder", "disabled"]), E(o2) && E(r2) ? (m(), C("div", De, [S("div", { class: x(["flex justify-between py-2 pl-2.5 pr-1.5 option", { hover: E(d2) === 0 }]), onMousedown: I2, onMouseenter: n3[1] ||= (e4) => d2.value = 0 }, [F(l2, { tag: "div", class: "text select-none", scope: "global", keypath: e3.$t("\u641C\u7D22 {value}", { value: "{value}" }) }, { value: D(() => [S("span", $, T(`'${E(h2)}'`), 1)]), _: 1 }, 8, ["keypath"])], 34), E(t2).length > 0 ? (m(), C(w, { key: 0 }, [S("div", Oe, T(e3.$t("\u9AD8\u7EA7\u641C\u7D22")), 1), (m(!0), C(w, null, A(E(t2), (e4, t3) => (m(), C("div", { key: e4.key, class: x(["flex justify-between py-2 pl-2.5 pr-1.5 option", [E(a2)?.key === e4.key ? "active" : E(d2) === t3 + 1 ? "hover" : ""]]), onMousedown: (t4) => R2(e4), onMouseenter: (e5) => d2.value = t3 + 1 }, [S("div", Ae, [F(i2, { name: e4.icon, color: "var(--colors-icon-icon-inactive)", size: "14" }, null, 8, ["name"]), F(l2, { tag: "div", class: "text select-none", scope: "global", keypath: e4.text }, { value: D(() => [S("span", je, T(`'${E(h2)}'`), 1)]), _: 1 }, 8, ["keypath"])]), S("div", Me, T(e4.syntax), 1)], 42, ke))), 128))], 64)) : O("", !0)])) : O("", !0)], 2);
  };
} }), [["__scopeId", "data-v-3ea763a6"]]);
var Pe = { class: "flex items-center gap-1.5 min-h-6" };
var Fe = U(o({ __name: "related-profiles-cell", props: { list: {}, showAdd: { type: Boolean }, addTooltip: {} }, emits: ["add"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, i2 = he(), a2 = b(() => n2.addTooltip ?? i2.value.selectEntityTooltip);
  return (t3, n3) => {
    let i3 = me, o2 = J, s2 = G;
    return m(), C("div", Pe, [F(i3, { list: e2.list, disabled: "" }, { empty: D(() => [...n3[1] ||= [S("span", { class: "row-hover-empty" }, "--", -1)]]), _: 1 }, 8, ["list"]), e2.showAdd ? M((m(), k(o2, { key: 0, class: "shrink-0 row-hover-action", text: "", severity: "secondary", size: "xxs", icon: "base/rx_ic_plus", onClick: n3[0] ||= L((e3) => r2("add"), ["stop"]) }, null, 512)), [[s2, { value: E(a2), showDelay: 500 }, void 0, { top: !0 }]]) : O("", !0)]);
  };
} }), [["__scopeId", "data-v-9ef9934f"]]);
function Ie({ key: t2, data: i2 }, o2) {
  let { fetchUserInfo: s2, updateUserConfig: c2 } = a(), [u2, d2] = V(), p2 = e(localStorage.getItem(t2)), m2 = (Array.isArray(p2) ? p2 : []).reduce((e2, t3) => {
    let [n2, r2] = t3;
    return e2[n2] = r2, e2;
  }, {}), h2 = f(g2());
  function g2() {
    return i2.filter((e2) => !o2 || !o2.includes(e2.key)).map((e2, t3) => {
      let { sort: n2, visible: r2, cache: i3 } = m2[e2.key] ?? {}, a2 = n2 ?? e2._sort ?? t3, o3 = r2 ?? e2._visible ?? !0, s3 = i3 ?? e2._cache ?? void 0, c3 = { ...e2, _sort: a2, _visible: o3 };
      return s3 && (c3._cache = s3), c3;
    }).toSorted((e2, t3) => e2._sort - t3._sort);
  }
  function _2(e2) {
    e2(h2.value);
  }
  function v2() {
    let e2 = h2.value.map((e3, t3) => [e3.key, { visible: e3._visible, sort: t3, cache: e3._cache }]);
    localStorage.setItem(t2, JSON.stringify(e2));
  }
  let y2;
  function b2() {
    clearTimeout(y2), y2 = setTimeout(v2, 200);
  }
  function x2() {
    clearTimeout(y2), y2 = void 0, v2();
  }
  j(h2, b2, { deep: !0 }), B(window, "pagehide", x2);
  let S2 = r(async (e2) => {
    let { code: t3, msg: r2 } = await n.base.userSetUserConfigCreate({ remarkDisplayStatus: e2 });
    d2(t3, r2), t3 === 0 && (s2(), c2());
  }, 500);
  return l(x2), { columns: h2, updateColumns: _2, updateRemarkDisplayStatus: S2 };
}
function Le(e2, n2) {
  let r2 = t(e2), { filters: i2, inserts: a2 } = Object.assign({ filters: [], inserts: [] }, n2);
  return Array.isArray(a2) && a2.forEach(([e3, t2]) => {
    r2.splice(e3, 0, t2);
  }), r2.filter((e3) => !i2 || !i2.includes(e3.key));
}
async function Re(e2, t2, n2) {
  let { title: r2, data: i2, showRemark: a2, mode: o2, dismissable: c2, closeOnEscape: l2, onHide: u2, onConfirm: d2 } = t2;
  async function f2(t3) {
    if (n2) try {
      let r3 = o2 === "device", i3 = await n2.buyProxy({ entryType: H.Immediate, ...r3 ? { mode: "device" } : {}, ...t3 ? { preferredCountry: t3 } : {} });
      r3 && n2.showToast(0, $t("\u8BBE\u5907\u5DF2\u8D2D\u4E70\u6210\u529F\uFF0C\u6B63\u5728\u4E3A\u60A8\u914D\u7F6E\u4E2D\uFF0C\u8BF7\u7A0D\u540E\u3002\u82E5\u957F\u65F6\u95F4\u672A\u52A0\u8F7D\u8BBE\u5907\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u6216\u8054\u7CFB\u6280\u672F\u652F\u6301\u3002")), e2.hideDrawer(), te.emit("updateShopList", i3?.orderNo);
      let a3 = r3 ? "ecommerce-device-list" : "agent-list";
      n2.router.replace({ name: a3, query: a3 === "agent-list" ? { name: "shop", orderNo: i3?.orderNo } : { orderNo: i3?.orderNo } });
    } catch {
    }
  }
  await e2.showDrawer({ title: r2, dismissable: c2, closeOnEscape: l2, onHide: u2, slots: { container: () => s(ge, { data: i2, showRemark: a2, mode: o2, showAdvertise: !0, onBuy: f2, onConfirm: async (t3) => {
    await d2(t3) !== !1 && e2.hideDrawer();
  } }) } });
}
function ze(e2) {
  let t2 = e2 ?? Q(), n2 = ee(), { buyProxy: r2 } = pe(), [i2] = V(), a2 = { buyProxy: r2, showToast: i2, router: n2 };
  return { drawerInstance: t2, hideDrawer: t2.hideDrawer, showProxyFormDrawer: (e3) => Re(t2, e3, a2) };
}
export {Ne as a,Fe as i,Le as n,Q as o,Ie as r,ze as t};