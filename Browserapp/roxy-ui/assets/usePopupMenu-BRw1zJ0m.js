import {C as e,E as t,Et as n,F as r,H as i,J as a,M as o,N as s,P as c,St as l,W as u,Z as d,_t as f,at as p,d as m,f as h,h as g,in as _,it as v,jt as y,lt as b,m as x,nn as S,p as C,q as w,rt as T,ut as E,v as D,w as O,x as k} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {a as A,m as j} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {Z as M} from "./basecomponent-ClhuVxJN.js";
import {t as N} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as P} from "./ripple-DKjDc6yC.js";
import {t as F} from "./rx-button-DyzuUt-V.js";
import {t as I} from "./rx-checkbox-BrC0MzoD.js";
import {t as L} from "./menu-WG3IuJIC.js";
import {t as R} from "./radiobutton-B3i1EP5M.js";
import {t as z} from "./usePreventMask-Cud6gNnu.js";
var B = { class: "max-w-80 !pa-0" };
var V = ["for"];
var H = ["title"];
var U = e({ __name: "menu-selection-item", props: s({ item: {}, type: {}, field: {} }, { modelValue: {}, modelModifiers: {} }), emits: ["update:modelValue"], setup(e2) {
  let t2 = T(e2, "modelValue"), n2 = e2.item[e2.field ?? "name"];
  return (r2, i2) => {
    let o2 = I;
    return u(), g("a", B, [h("label", { class: "flex items-center py-2 pl-2.5 pr-2.5 gap-2 cursor-pointer w-full", for: y(n2) }, [e2.type === "single" ? (u(), C(y(R), { key: 0, modelValue: t2.value, "onUpdate:modelValue": i2[0] ||= (e3) => t2.value = e3, name: "radio", "input-id": y(n2), value: y(n2) }, null, 8, ["modelValue", "input-id", "value"])) : x("", !0), e2.type === "multiple" ? (u(), C(o2, { key: 1, modelValue: t2.value, "onUpdate:modelValue": i2[1] ||= (e3) => t2.value = e3, name: "checkbox", "input-id": y(n2), value: y(n2) }, null, 8, ["modelValue", "input-id", "value"])) : x("", !0), a(r2.$slots, "default", {}, () => [e2.item.icon ? (u(), C(y(M), { key: 0, name: e2.item.icon }, null, 8, ["name"])) : x("", !0), h("span", { class: "ellipsis-1 text-3.25", title: e2.item.label }, _(e2.item.label), 9, H)])], 8, V)]);
  };
} });
var W = N(e({ __name: "menu", props: o({ mode: { type: Object, required: !1 }, model: { type: Array, required: !1 }, menuProps: { type: Object, required: !1 } }, { menuProps: () => ({}) }), setup(e2, { expose: r2 }) {
  let i2 = v(), { showPreventMask: o2, hidePreventMask: s2 } = z(), h2 = p("menu"), _2 = m(() => {
    let t2 = e2.mode?.options || e2.model;
    return t2 && [...t2];
  }), T2 = l(e2.mode?.value), { onHide: O2, ...k2 } = e2.menuProps;
  function A2() {
    O2?.({ type: e2.mode.type, value: n(T2.value) }), s2();
  }
  async function M2(e3, t2) {
    await t2.command?.({ originalEvent: e3, item: t2 }), h2.value?.hide();
  }
  return r2({ toggle(e3) {
    h2.value?.toggle(e3);
  } }), (n2, r3) => {
    let s3 = F, l2 = P;
    return u(), C(y(L), c({ ref: "menu" }, k2, { model: y(_2), popup: "", pt: { root: n2.menuClass.root, item: n2.menuClass.item, list: "overflow-y-auto max-h-80" }, onHide: A2, onShow: y(o2) }), D({ item: b(({ item: { render: t2, ...i3 }, props: a2 }) => [e2.mode ? E((u(), C(U, c({ key: 1 }, a2.action, { modelValue: y(T2), "onUpdate:modelValue": r3[0] ||= (e3) => f(T2) ? T2.value = e3 : null, type: e2.mode.type, field: e2.mode.field, item: i3, onClick: r3[1] ||= j(() => {
    }, ["stop"]) }), { default: b(() => [t2 ? (u(), C(d(t2), { key: 0, item: i3, props: a2 }, null, 8, ["item", "props"])) : x("", !0)]), _: 2 }, 1040, ["modelValue", "type", "field", "item"])), [[l2]]) : (u(), g("a", c({ key: 0 }, a2.action, { class: "max-w-80 !pa-0" }), [t2 ? (u(), C(d(t2), { key: 0, item: i3, props: a2, "btn-pt": { root: n2.menuClass.button }, onClick: j((e3) => M2(e3, i3), ["stop"]) }, null, 8, ["item", "props", "btn-pt", "onClick"])) : (u(), C(s3, { key: 1, class: "w-full !justify-start", disabled: i3.disabled, icon: i3.icon, label: i3.label, severity: "secondary", text: "", pt: { root: n2.menuClass.button }, onClick: j((e3) => M2(e3, i3), ["stop"]) }, null, 8, ["disabled", "icon", "label", "pt", "onClick"]))], 16))]), _: 2 }, [w(y(i2), (e3, r4) => ({ name: r4, fn: b((e4) => [a(n2.$slots, r4, S(t(e4)))]) }))]), 1040, ["model", "pt", "onShow"]);
  };
} }), [["__cssModules", { menuClass: { root: "_root_7j351_1", item: "_item_7j351_6", button: "_button_7j351_13" } }]]);
function G() {
  let e2 = O()?.appContext;
  if (!e2) throw Error("usePopoverMenu must be used within a component setup");
  let t2 = l(), n2 = l({}), a2 = null, o2 = null, s2 = () => {
    let { slots: e3, ...r2 } = n2.value;
    return k(W, c({ ref: t2 }, r2), e3);
  }, u2 = async () => {
    try {
      f2(), o2 = document.createElement("div"), document.body.appendChild(o2);
      let t3 = k(s2);
      t3.appContext = e2, a2 = t3, A(t3, o2), await r();
    } catch (e3) {
      console.error("Failed to render popup menu:", e3), f2();
    }
  };
  async function d2(e3, r2) {
    try {
      if (n2.value = r2, await u2(), !t2.value) throw Error("Menu component reference is not available");
      let i2 = new Proxy(e3, { get(e4, t3) {
        return t3 === "currentTarget" && !Reflect.get(e4, "currentTarget") ? Reflect.get(e4, "target") : Reflect.get(e4, t3);
      } });
      t2.value?.toggle(i2);
    } catch (e4) {
      console.error("Failed to show popup menu:", e4), f2();
    }
  }
  function f2() {
    a2 && o2 && (A(null, o2), a2 = null), o2 &&= (document.body.removeChild(o2), null);
  }
  return i(() => {
    f2();
  }), { showMenu: d2, destroy: f2 };
}
export {G as t};