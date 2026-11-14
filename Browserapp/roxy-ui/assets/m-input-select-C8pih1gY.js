import {Cr as e} from "./utils-BIWenCnY.js";
import {C as t,F as n,G as r,J as i,L as a,N as ee,P as te,R as ne,St as o,V as re,W as s,_t as ie,at as c,b as ae,d as l,en as u,f as d,h as f,i as p,in as m,jt as h,k as oe,lt as se,m as g,nt as ce,p as _,q as le,rn as ue,rt as de,s as fe,st as pe,tt as me,x as v} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as y,s as he,t as ge} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {m as _e,o as ve} from "./dist-NctnpPRe.js";
import {Z as ye} from "./basecomponent-ClhuVxJN.js";
import {t as b} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as be} from "./m-input-text-JVbCgVJP.js";
var x = "/assets/loading-DReOWtmn.png";
var xe = { key: 0, class: "absolute inset-0 flex items-center justify-center z-10 select-none" };
var S = b(t({ __name: "rx-loading", props: ee({ opacity: { default: 0.7 }, size: { default: 32 } }, { modelValue: { type: Boolean, required: !0 }, modelModifiers: {} }), emits: ["update:modelValue"], setup(e2) {
  he((e3) => ({ ceca54c0: e3.opacity, v743c8125: h(n2) }));
  let t2 = de(e2, "modelValue"), n2 = l(() => Number.isNaN(Number(e2.size)) ? e2.size : CSS.px(e2.size).toString());
  return (e3, n3) => t2.value ? (s(), f("div", xe, [...n3[0] ||= [d("div", { class: "absolute inset-0 z-1 mask" }, null, -1), d("img", { class: "block mx-auto loading-circle z-2 loading-icon", src: x }, null, -1)]])) : g("", !0);
} }), [["__scopeId", "data-v-31a7eeef"]]);
var Se = { class: "selectitem m-input-select-editable" };
var Ce = ["src"];
var we = { class: "m-input-select-field" };
var Te = ["id", "value", "placeholder", "disabled", "tabindex", "aria-expanded", "aria-label", "aria-labelledby"];
var Ee = { key: 0, class: "m-input-select-placeholder m-input-select-placeholder--overlay" };
var De = ["id", "disabled", "tabindex", "name", "aria-expanded", "aria-label", "aria-labelledby"];
var Oe = { key: 0, class: "selectitem" };
var ke = ["src"];
var Ae = { key: 1, class: "m-input-select-placeholder" };
var je = { class: "m-input-select-placeholder-text" };
var Me = { key: 1, class: "m-input-select-dropdown-icon" };
var Ne = { class: "m-input-select-options", role: "listbox" };
var Pe = { key: 0, class: "m-input-select-empty" };
var Fe = ["data-option-index", "disabled", "aria-selected", "onMouseenter", "onClick"];
var Ie = { key: 1, class: "m-input-select-check-spacer" };
var Le = { class: "m-input-select-option-content" };
var Re = { class: "selectitem" };
var ze = ["src"];
var Be = 1100;
var C = b(t({ inheritAttrs: !1, __name: "m-input-select", props: { modelValue: {}, defaultValue: {}, name: {}, options: {}, optionLabel: { type: [String, Function], default: "label" }, optionValue: {}, optionDisabled: {}, placeholder: {}, disabled: { type: Boolean }, invalid: { type: Boolean }, showClear: { type: Boolean, default: !1 }, showDropdownIcon: { type: Boolean, default: !0 }, checkmark: { type: Boolean, default: !1 }, highlightOnSelect: { type: Boolean, default: !0 }, emptyMessage: {}, scrollHeight: { default: "14rem" }, appendTo: {}, inputId: {}, tabindex: {}, ariaLabel: {}, ariaLabelledby: {}, overlayStyle: {}, overlayClass: {}, panelStyle: {}, panelClass: {}, overlayAutoWidth: { type: Boolean, default: !1 }, editable: { type: Boolean, default: !1 }, filter: { type: Boolean, default: !1 }, filterPlaceholder: {}, filterMatchMode: { default: "contains" }, filterFields: {}, filterLocale: {}, icon: {}, iconColor: { default: "var(--colors-text-text-primary, #171c1f)" }, size: { default: "sm" }, fluid: { type: Boolean }, darkMode: { type: Boolean, default: !1 }, getOptions: {}, onChange: {} }, emits: ["update:modelValue", "focus", "blur", "beforeShow", "beforeHide", "show", "hide"], setup(ee2, { expose: de2, emit: he2 }) {
  let b2 = ee2, x2 = he2, xe2 = t({ name: "FormFieldIsolate", setup(e2, { slots: t2 }) {
    return r("$pcFormField", null), () => t2.default?.();
  } }), S2 = me(), C2 = c("root"), Ve = c("trigger"), He = c("input"), w = c("overlay"), Ue = c("searchInput"), T = oe("$pcFormField", null), We = oe("$pcFluid", null), Ge = _e(document.body), Ke = l(() => typeof b2.fluid == "boolean" ? b2.fluid : typeof We != "boolean" || We), qe = o(b2.options), Je = o(b2.defaultValue), E = o(!1), D = o(!1), O = o(""), k = o(""), A = o(-1), j = o(!1), Ye = o({}), M = o(), N = o(!1), P = o(), F = o(), Xe = `m-select-${ce()}`, I = l(() => !!b2.editable), L = l(() => !!b2.filter && !I.value), R = l(() => b2.options ?? qe.value ?? []), z = l(() => T?.field?.states), Ze = l(() => T?.field?.props ?? {}), B = l(() => b2.modelValue === void 0 ? z.value?.value === void 0 ? Je.value : z.value.value : b2.modelValue), V = l(() => B.value !== null && B.value !== void 0 && B.value !== ""), Qe = l(() => b2.showDropdownIcon && !(b2.showClear && V.value)), $e = l(() => Object.fromEntries(Object.entries(S2).filter(([e2]) => e2 !== "class" && e2 !== "style" && !e2.startsWith("on")))), et = l(() => b2.appendTo && b2.appendTo !== "self" ? b2.appendTo : "body"), tt = l(() => b2.appendTo !== "self"), nt = l(() => ({ maxHeight: b2.scrollHeight, ...tt.value ? { position: "fixed", ...Ye.value } : { width: "100%" }, ...M.value == null ? {} : { zIndex: M.value }, ...b2.overlayStyle ?? b2.panelStyle ?? {} }));
  function rt(e2, t2, n2 = e2) {
    return e2 == null || !t2 ? n2 : typeof t2 == "function" ? t2(e2) : e2?.[t2];
  }
  function H(e2) {
    return e2 == null ? "" : String(typeof e2 == "object" ? rt(e2, b2.optionLabel, e2?.label ?? e2) : e2);
  }
  function U(e2) {
    return e2 == null ? e2 : rt(e2, b2.optionValue, e2);
  }
  function W(e2) {
    return !!rt(e2, b2.optionDisabled, !1);
  }
  function it(e2, t2) {
    return e2 === t2 ? !0 : e2 && t2 && typeof e2 == "object" && typeof t2 == "object" && b2.optionValue ? U(e2) === U(t2) : !1;
  }
  let G = l(() => {
    let e2 = B.value;
    return e2 == null || e2 === "" ? null : R.value.find((t2) => b2.optionValue ? U(t2) === e2 : it(t2, e2)) ?? null;
  }), K = l(() => G.value ? H(G.value) : V.value ? typeof B.value == "object" ? H(B.value) : String(B.value) : ""), q = l(() => {
    let e2 = G.value;
    if (!e2 || typeof e2 != "object") return null;
    if (e2.image || e2.darkImage) return { type: "image", src: b2.darkMode && e2.darkImage || e2.image };
    let t2 = e2.icon || b2.icon;
    return t2 ? { type: "icon", name: t2 } : null;
  }), at = l(() => b2.filterFields?.length ? b2.filterFields : typeof b2.optionLabel == "string" ? [b2.optionLabel] : ["label"]);
  function ot(e2, t2) {
    let n2 = t2.toLocaleLowerCase(b2.filterLocale);
    return at.value.map((t3) => String(typeof e2 != "object" || !e2 ? e2 ?? "" : e2?.[t3] ?? H(e2))).some((e3) => {
      let t3 = e3.toLocaleLowerCase(b2.filterLocale);
      switch (b2.filterMatchMode) {
        case "startsWith":
          return t3.startsWith(n2);
        case "endsWith":
          return t3.endsWith(n2);
        default:
          return t3.includes(n2);
      }
    });
  }
  let st = l(() => L.value ? k.value.trim() : I.value && !D.value ? O.value.trim() : ""), J = l(() => {
    let e2 = R.value, t2 = st.value;
    return t2 ? e2.filter((e3) => ot(e3, t2)) : e2;
  });
  pe(R, () => {
    E.value && b2.overlayAutoWidth && (P.value = void 0, n(() => $()));
  }), pe(() => b2.options, (e2) => {
    e2 && (qe.value = e2);
  }), pe(k, () => {
    E.value && L.value && (A.value = J.value.findIndex((e2) => !W(e2)), n(() => $()));
  }), pe([B, G, I], () => {
    I.value && (!E.value || D.value) && (O.value = K.value);
  }, { immediate: !0 }), a(async () => {
    b2.getOptions && e(b2.getOptions) && (qe.value = await b2.getOptions());
  }), re(() => {
    ve(document, "pointerdown", wt, !0), ve(window, "resize", Dt), ve(window, "scroll", $, { capture: !0, passive: !0 });
  }), ne(() => {
    Ge.value = !1, M.value = void 0;
  });
  function ct() {
    return { options: R.value, optionLabel: b2.optionLabel, optionValue: b2.optionValue, editable: b2.editable, filter: b2.filter, ...Object.fromEntries(Object.entries(S2).filter(([t2, n2]) => !e(n2))) };
  }
  function Y(e2, t2) {
    Je.value = e2, x2("update:modelValue", e2);
    let n2 = { originalEvent: t2, value: e2, props: ct() };
    Ze.value.onChange?.(n2), b2.onChange?.(n2), z.value?.invalid && T?.$pcForm?.validate && T?.name && T.$pcForm.validate(T.name);
  }
  function X(e2) {
    b2.disabled || (e2?.showAll === !0 ? D.value = !0 : e2?.showAll === !1 && (D.value = !1), j.value = !0, E.value ? n(() => $()) : (x2("beforeShow"), E.value = !0, Ge.value = !0, k.value = "", A.value = ut(), n(() => {
      x2("show");
    })));
  }
  function Z() {
    E.value && (x2("beforeHide"), E.value = !1, Ge.value = !1, D.value = !1, A.value = -1, k.value = "", P.value = void 0, F.value = void 0, N.value = !1, x2("hide"), n(() => {
      jt() || (j.value = !1);
    }));
  }
  function lt(e2, t2 = !1) {
    E.value && !t2 ? Z() : E.value && t2 ? X({ showAll: !0, event: e2 }) : X({ showAll: t2, event: e2 });
  }
  function ut() {
    return G.value ? J.value.findIndex((e2) => e2 === G.value) : -1;
  }
  function dt(e2, t2) {
    if (W(e2)) return;
    let n2 = U(e2);
    O.value = H(e2), D.value = !1, Y(n2, t2), Z(), I.value ? He.value?.focus() : Ve.value?.focus();
  }
  function ft(e2) {
    e2?.stopPropagation(), O.value = "", D.value = !1, Y(null, e2), Z(), I.value ? He.value?.focus() : Ve.value?.focus();
  }
  function pt(e2) {
    ft(e2);
  }
  function mt(e2) {
    if (!I.value) return;
    let t2 = O.value.trim();
    if (!t2) {
      V.value && Y(null, e2);
      return;
    }
    let n2 = R.value.find((e3) => !!(H(e3) === t2 || b2.optionValue && String(U(e3)) === t2));
    n2 ? (Y(U(n2), e2), O.value = H(n2)) : Y(t2, e2);
  }
  function ht(e2) {
    let t2 = e2.target.value;
    O.value = t2, D.value = !1, X({ event: e2 }), Y(t2, e2), A.value = J.value.findIndex((e3) => !W(e3));
  }
  function gt(e2) {
    j.value = !0, x2("focus", e2);
  }
  function _t(e2) {
    e2.stopPropagation(), X({ showAll: !0, event: e2 });
  }
  function vt(e2) {
    j.value = !0, x2("focus", e2);
  }
  function yt(e2) {
    b2.disabled || (I.value ? (X({ showAll: !0, event: e2 }), He.value?.focus()) : lt(e2));
  }
  function bt(e2) {
    e2.preventDefault(), e2.stopPropagation(), !b2.disabled && (I.value ? (E.value && D.value ? Z() : X({ showAll: !0, event: e2 }), He.value?.focus()) : lt(e2));
  }
  function xt(e2) {
    let t2 = J.value;
    if (!t2.length) {
      A.value = -1;
      return;
    }
    let r2 = A.value, i2 = r2;
    do
      r2 = r2 < 0 ? e2 > 0 ? 0 : t2.length - 1 : (r2 + e2 + t2.length) % t2.length;
    while (W(t2[r2]) && r2 !== i2);
    A.value = r2, n(() => Q());
  }
  function Q() {
    A.value < 0 || w.value?.querySelector(`[data-option-index="${A.value}"]`)?.scrollIntoView({ block: "nearest" });
  }
  function St(e2) {
    if (!b2.disabled) switch (e2.key) {
      case "ArrowDown":
        e2.preventDefault(), E.value ? xt(1) : X({ showAll: I.value, event: e2 });
        break;
      case "ArrowUp":
        e2.preventDefault(), E.value ? xt(-1) : X({ showAll: I.value, event: e2 });
        break;
      case "Home":
        E.value && (e2.preventDefault(), A.value = J.value.findIndex((e3) => !W(e3)), n(() => Q()));
        break;
      case "End":
        if (E.value) {
          e2.preventDefault();
          for (let e3 = J.value.length - 1; e3 >= 0; e3--) if (!W(J.value[e3])) {
            A.value = e3;
            break;
          }
          n(() => Q());
        }
        break;
      case "Enter":
        e2.preventDefault(), E.value && A.value >= 0 ? dt(J.value[A.value], e2) : I.value ? (mt(e2), Z()) : E.value || X({ event: e2 });
        break;
      case "Escape":
        E.value && (e2.preventDefault(), Z(), I.value && (O.value = K.value));
        break;
      case "Tab":
        I.value && mt(e2), Z();
        break;
      case " ":
        !I.value && !Ct(e2.target) && (e2.preventDefault(), E.value && A.value >= 0 ? dt(J.value[A.value], e2) : X({ event: e2 }));
    }
  }
  function Ct(e2) {
    return e2 instanceof HTMLInputElement || e2 instanceof HTMLTextAreaElement;
  }
  function wt(e2) {
    if (!E.value) return;
    let t2 = e2.target;
    !C2.value?.contains(t2) && !w.value?.contains(t2) && (I.value && mt(e2), Z(), I.value && (O.value = K.value));
  }
  function Tt() {
    let e2 = Be, t2 = C2.value;
    for (; t2 && t2 !== document.documentElement; ) {
      let n2 = Number.parseInt(getComputedStyle(t2).zIndex, 10);
      Number.isNaN(n2) || (e2 = Math.max(e2, n2)), t2 = t2.parentElement;
    }
    return e2 + 1;
  }
  function Et() {
    M.value = Tt(), P.value = void 0, F.value = void 0, n(() => {
      $(), Q(), L.value && Ue.value?.focus();
    });
  }
  function Dt() {
    P.value = void 0, $();
  }
  function Ot() {
    let e2 = w.value, t2 = C2.value;
    if (!E.value || !e2 || !t2) {
      N.value = !1;
      return;
    }
    let n2 = t2.getBoundingClientRect().width, r2 = Math.max(n2, window.innerWidth - 16), i2 = Math.min(Math.max(e2.offsetWidth, 0), r2);
    F.value = Math.max(F.value ?? 0, i2), P.value = Math.min(F.value, r2), N.value = !1, $();
  }
  function kt() {
    M.value = void 0;
  }
  function $() {
    if (!E.value || !C2.value || !tt.value) return;
    let e2 = C2.value.getBoundingClientRect(), t2 = w.value, r2 = e2.width, i2 = b2.overlayAutoWidth;
    if (i2 && N.value) return;
    if (i2 && P.value == null) {
      N.value = !0, Ye.value = { top: `${e2.bottom + 4}px`, left: `${Math.max(8, e2.left)}px`, width: "max-content", maxWidth: "none" }, n(() => Ot());
      return;
    }
    let a2 = Math.max(r2, window.innerWidth - 16), ee3 = i2 ? P.value ?? r2 : r2, te2 = t2?.offsetHeight ?? 200, ne2 = e2.bottom + 4 + te2 > window.innerHeight && e2.top > te2 + 4 ? e2.top - te2 - 4 : e2.bottom + 4, o2 = Math.min(Math.max(8, e2.left), Math.max(8, window.innerWidth - ee3 - 8));
    Ye.value = { top: `${Math.max(8, ne2)}px`, left: `${o2}px`, ...i2 ? { width: `${ee3}px`, maxWidth: `${a2}px` } : { width: `${r2}px` } };
  }
  function At(e2) {
    return e2 ? !!(C2.value?.contains(e2) || w.value?.contains(e2)) : !1;
  }
  function jt(e2, t2 = document.activeElement) {
    return At(e2) || At(t2);
  }
  function Mt(e2) {
    n(() => {
      E.value || jt(e2.relatedTarget) || (j.value = !1, I.value && (mt(e2), O.value = K.value), Ze.value.onBlur?.(e2));
    }), x2("blur", e2);
  }
  function Nt(e2) {
    E.value && jt(e2.relatedTarget) && e2.stopPropagation();
  }
  function Pt(e2) {
    if (!E.value) return;
    let t2 = e2.relatedTarget;
    (jt(t2) || !t2) && e2.stopPropagation();
  }
  function Ft(e2) {
    return b2.highlightOnSelect ? G.value ? e2 === G.value : b2.optionValue ? U(e2) === B.value : it(e2, B.value) : !1;
  }
  function It(e2, t2) {
    return ["m-input-select-option", { "is-selected": Ft(e2), "is-focused": A.value === t2, "is-disabled": W(e2) }];
  }
  return de2({ open: X, close: Z }), (e2, t2) => {
    let n2 = ye;
    return s(), f("div", te({ ref: "root" }, h($e), { class: ["m-input-select", [b2.size, { "is-fluid": h(Ke), "is-open": h(E), "is-searchable": h(I), "p-invalid": b2.invalid || h(z)?.invalid, "p-disabled": b2.disabled }, h(S2).class]], style: h(S2).style, onFocusout: Nt }), [h(I) ? (s(), f("div", { key: 0, class: u(["m-input-select-trigger", { "p-focus": h(j) || h(E), "p-disabled": b2.disabled }]), onClick: yt }, [d("div", Se, [h(q) ? (s(), f(p, { key: 0 }, [h(q).type === "image" ? (s(), f("img", { key: 0, class: "selectitem__image", src: h(q).src, alt: "" }, null, 8, Ce)) : (s(), _(n2, { key: 1, name: h(q).name, color: b2.iconColor, fallback: "base/rx_ic_earth" }, null, 8, ["name", "color"]))], 64)) : g("", !0), d("div", we, [d("input", { id: b2.inputId, ref: "input", type: "text", class: u(["m-input-select-input", { "is-custom-placeholder": e2.$slots.placeholder && !h(O) }]), value: h(O), placeholder: b2.placeholder, disabled: b2.disabled, tabindex: b2.tabindex ?? 0, role: "combobox", "aria-expanded": h(E), "aria-controls": Xe, "aria-label": b2.ariaLabel, "aria-labelledby": b2.ariaLabelledby, autocomplete: "off", onFocus: gt, onBlur: Mt, onInput: ht, onKeydown: St, onClick: _t }, null, 42, Te), e2.$slots.placeholder && !h(O) ? (s(), f("span", Ee, [i(e2.$slots, "placeholder", {}, void 0, !0)])) : g("", !0)])]), b2.showClear && h(V) ? (s(), f("span", { key: 0, class: "m-input-select-clear", role: "button", tabindex: "-1", onMousedown: t2[0] ||= y(() => {
    }, ["prevent"]), onClick: ft }, [i(e2.$slots, "clearicon", { clearCallback: pt }, () => [v(n2, { name: "base/rx_ic_delete", size: 16, color: "var(--colors-icon-icon-secondary)" })], !0)], 32)) : g("", !0), h(Qe) ? (s(), f("span", { key: 1, class: "m-input-select-dropdown-icon", onMousedown: t2[1] ||= y(() => {
    }, ["prevent"]), onClick: bt }, [i(e2.$slots, "dropdownicon", {}, () => [v(n2, { name: "base/rx_ic_chevron_down", size: 16, color: "var(--colors-icon-icon-secondary)" })], !0)], 32)) : g("", !0)], 2)) : (s(), f("button", { key: 1, id: b2.inputId, ref: "trigger", type: "button", class: u(["m-input-select-trigger", { "p-focus": h(j) || h(E), "p-disabled": b2.disabled }]), disabled: b2.disabled, tabindex: b2.tabindex ?? 0, name: b2.name, role: "combobox", "aria-expanded": h(E), "aria-controls": Xe, "aria-label": b2.ariaLabel, "aria-labelledby": b2.ariaLabelledby, onClick: yt, onKeydown: St, onFocus: vt, onBlur: Mt }, [d("span", { class: u(["m-input-select-value", { "is-placeholder": !h(V), "is-custom-placeholder": !h(V) && !!e2.$slots.placeholder }]) }, [i(e2.$slots, "value", { value: h(G) ?? h(B), placeholder: b2.placeholder }, () => [h(V) ? (s(), f(p, { key: 0 }, [h(G) ? (s(), f("div", Oe, [h(G).icon || b2.icon ? (s(), _(n2, { key: 0, name: h(G).icon || b2.icon, color: b2.iconColor, fallback: "base/rx_ic_earth" }, null, 8, ["name", "color"])) : g("", !0), h(G).image ? (s(), f("img", { key: 1, class: "selectitem__image", src: b2.darkMode ? h(G).darkImage : h(G).image }, null, 8, ke)) : g("", !0), d("div", null, m(h(K)), 1), i(e2.$slots, "value-extra", { value: h(G) }, void 0, !0)])) : (s(), f(p, { key: 1 }, [ae(m(h(K)), 1)], 64))], 64)) : (s(), f("span", Ae, [i(e2.$slots, "placeholder", {}, () => [d("span", je, m(b2.placeholder), 1)], !0)]))], !0)], 2), b2.showClear && h(V) ? (s(), f("span", { key: 0, class: "m-input-select-clear", role: "button", tabindex: "-1", onMousedown: t2[2] ||= y(() => {
    }, ["prevent"]), onClick: ft }, [i(e2.$slots, "clearicon", { clearCallback: pt }, () => [v(n2, { name: "base/rx_ic_delete", size: 16, color: "var(--colors-icon-icon-secondary)" })], !0)], 32)) : g("", !0), h(Qe) ? (s(), f("span", Me, [i(e2.$slots, "dropdownicon", {}, () => [v(n2, { name: "base/rx_ic_chevron_down", size: 16, color: "var(--colors-icon-icon-secondary)" })], !0)])) : g("", !0)], 42, De)), (s(), _(fe, { to: h(et), disabled: !h(tt) }, [v(ge, { name: "m-select-fade", onEnter: Et, onAfterLeave: kt }, { default: se(() => [h(E) ? (s(), f("div", { key: 0, id: Xe, ref: "overlay", class: u(["m-input-select-panel", [b2.overlayClass, b2.panelClass, { "is-measuring": h(N) }]]), style: ue(h(nt)), role: "presentation", onFocusout: Pt, onKeydown: St }, [i(e2.$slots, "header", { value: h(B), options: h(R), close: Z }, void 0, !0), h(L) ? (s(), f("div", { key: 0, class: "m-input-select-filter", onClick: t2[4] ||= y(() => {
    }, ["stop"]), onMousedown: t2[5] ||= y(() => {
    }, ["stop"]) }, [v(h(xe2), null, { default: se(() => [v(be, { ref: "searchInput", modelValue: h(k), "onUpdate:modelValue": t2[3] ||= (e3) => ie(k) ? k.value = e3 : null, size: "xs", "pre-icon": "base/rx_ic_magnify", placeholder: b2.filterPlaceholder ?? e2.$t("\u641C\u7D22\u5185\u5BB9"), "form-control": { novalidate: !0 } }, null, 8, ["modelValue", "placeholder"])]), _: 1 })], 32)) : g("", !0), d("div", Ne, [h(J).length ? g("", !0) : (s(), f("div", Pe, [i(e2.$slots, "empty", {}, () => [ae(m(b2.emptyMessage ?? e2.$t("\u6682\u65E0\u6570\u636E")), 1)], !0)])), (s(!0), f(p, null, le(h(J), (r2, a2) => (s(), f("button", { key: b2.optionValue ? String(U(r2)) : a2, type: "button", "data-option-index": a2, class: u(It(r2, a2)), disabled: W(r2), role: "option", "aria-selected": Ft(r2), tabindex: "-1", onMousedown: t2[6] ||= y(() => {
    }, ["prevent"]), onMouseenter: (e3) => A.value = a2, onClick: (e3) => dt(r2, e3) }, [b2.checkmark && Ft(r2) ? (s(), _(n2, { key: 0, class: "m-input-select-check", name: "base/rx_ic_check", size: 14, color: "var(--colors-icon-icon-brand, var(--colors-text-text-brand))" })) : b2.checkmark ? (s(), f("span", Ie)) : g("", !0), d("span", Le, [i(e2.$slots, "option", { option: r2, selected: Ft(r2), index: a2 }, () => [d("div", Re, [r2.icon || b2.icon ? (s(), _(n2, { key: 0, name: r2.icon || b2.icon, color: b2.iconColor, fallback: "base/rx_ic_earth" }, null, 8, ["name", "color"])) : g("", !0), r2.image ? (s(), f("img", { key: 1, class: "selectitem__image", src: b2.darkMode ? r2.darkImage : r2.image }, null, 8, ze)) : g("", !0), d("div", null, m(H(r2)), 1), i(e2.$slots, "option-extra", { option: r2 }, void 0, !0)])], !0)])], 42, Fe))), 128))]), e2.$slots.footer ? (s(), f("div", { key: 1, class: "m-input-select-footer", onMousedown: t2[7] ||= y(() => {
    }, ["stop"]) }, [i(e2.$slots, "footer", { value: h(B), options: h(R), close: Z }, void 0, !0)], 32)) : g("", !0)], 38)) : g("", !0)]), _: 3 })], 8, ["to", "disabled"]))], 16);
  };
} }), [["__scopeId", "data-v-b5fc224b"]]);
export {S as n,C as t};