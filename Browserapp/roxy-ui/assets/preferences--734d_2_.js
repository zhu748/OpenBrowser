import {pi as e,v as t} from "./utils-BIWenCnY.js";
import {C as n,Et as r,J as i,P as a,St as o,V as s,W as c,Z as l,_t as u,b as d,d as f,f as p,h as m,i as h,in as g,jt as _,lt as v,m as y,p as b,q as x,rt as S,st as C,ut as w,vt as T,x as E} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as D} from "./merge-B7DGYZqS.js";
import {t as O} from "./upperFirst-BFdaJQ3h.js";
import {n as k} from "./agent-BmSFI9WH.js";
import {y as A} from "./rich-html-link-VdBpR3Cm.js";
import {Z as j} from "./basecomponent-ClhuVxJN.js";
import {t as M} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {i as N} from "./baseicon-Z_5Hqu9u.js";
import {t as ee} from "./tooltip-BYYKWrvu.js";
import {t as P} from "./style-CSCMuhHp.js";
import {t as F} from "./rx-button-DyzuUt-V.js";
import {t as te} from "./baseeditableholder-DHdW4ii2.js";
import {t as ne} from "./rx-checkbox-BrC0MzoD.js";
import {t as I} from "./inputnumber-BD6BwCgc.js";
import {t as L} from "./inputtext-Crzvb5jQ.js";
import {n as R,t as z} from "./inputicon-Bn1KerIx.js";
import {t as B} from "./radiobutton-B3i1EP5M.js";
import {t as V} from "./toggleswitch-DKDK40Mk.js";
import {t as H} from "./message-SBZQdXpt.js";
import {a as U,i as W,n as G,r as K,t as q} from "./tab-6bJNMvq4.js";
import {t as J} from "./colors-select-CQM6_O2z.js";
import {r as Y} from "./main-types-DreniZN2.js";
import {t as X} from "./util-C5rl6Moc.js";
import {t as Z} from "./base-dialog-Bet1oNF8.js";
import {t as re} from "./custom-layout-C32t9VHy.js";
var Q = { name: "RadioButtonGroup", extends: { name: "BaseRadioButtonGroup", extends: te, style: P, provide: function() {
  return { $pcRadioButtonGroup: this, $parentInstance: this };
} }, inheritAttrs: !1, data: function() {
  return { groupName: this.name };
}, watch: { name: function(e2) {
  this.groupName = e2 || N("radiobutton-group-");
} }, mounted: function() {
  this.groupName = this.groupName || N("radiobutton-group-");
} };
function ie(e2, t2, n2, r2, o2, s2) {
  return c(), m("div", a({ class: e2.cx("root") }, e2.ptmi("root")), [i(e2.$slots, "default")], 16);
}
Q.render = ie;
var ae = { class: "base-settings" };
var oe = { class: "form-item" };
var se = { class: "form-item-label" };
var ce = { class: "form-item-content" };
var le = { class: "form-item" };
var ue = { class: "form-item-label" };
var de = { class: "form-item-content" };
var fe = { class: "form-item" };
var pe = { class: "form-item-label" };
var me = { class: "form-item-content" };
var he = { class: "checkbox-list" };
var ge = { class: "checkbox-item" };
var _e = { for: "enableSyncMouseClick" };
var ve = { class: "checkbox-item" };
var ye = { for: "enableSyncMouseScroll" };
var be = { class: "checkbox-item" };
var xe = { for: "enableSyncMouseMove" };
var Se = M(n({ __name: "base-settings", props: { modelValue: { required: !0 }, modelModifiers: {} }, emits: ["update:modelValue"], setup(e2) {
  let t2 = ["#FF12A3FC", "#FFEB5757", "#FFD17CFE", "#FFFBC26F", "#C7CDD1"].map((e3) => e3.at(0) + e3.slice(3) + e3.slice(1, 3)), n2 = S(e2, "modelValue");
  return (e3, r2) => {
    let i2 = J, a2 = V, o2 = ne;
    return c(), m("div", ae, [p("div", oe, [p("label", se, g(e3.$t("\u4E3B\u63A7\u7A97\u53E3\u989C\u8272")), 1), p("div", ce, [E(i2, { modelValue: n2.value.mainControlWindowColor, "onUpdate:modelValue": r2[0] ||= (e4) => n2.value.mainControlWindowColor = e4, colors: _(t2) }, null, 8, ["modelValue", "colors"])])]), p("div", le, [p("label", ue, g(e3.$t("\u540C\u6B65\u952E\u76D8\u8F93\u5165")), 1), p("div", de, [E(a2, { modelValue: n2.value.enableSyncKeybord, "onUpdate:modelValue": r2[1] ||= (e4) => n2.value.enableSyncKeybord = e4, size: "small" }, null, 8, ["modelValue"])])]), p("div", fe, [p("label", pe, g(e3.$t("\u540C\u6B65\u9F20\u6807\u8F93\u5165")), 1), p("div", me, [p("div", he, [p("div", ge, [E(o2, { modelValue: n2.value.enableSyncMouseClick, "onUpdate:modelValue": r2[2] ||= (e4) => n2.value.enableSyncMouseClick = e4, binary: "", size: "small", "input-id": "enableSyncMouseClick" }, null, 8, ["modelValue"]), p("label", _e, g(e3.$t("\u70B9\u51FB")), 1)]), p("div", ve, [E(o2, { modelValue: n2.value.enableSyncMouseScroll, "onUpdate:modelValue": r2[3] ||= (e4) => n2.value.enableSyncMouseScroll = e4, binary: "", size: "small", "input-id": "enableSyncMouseScroll" }, null, 8, ["modelValue"]), p("label", ye, g(e3.$t("\u6EDA\u52A8")), 1)]), p("div", be, [E(o2, { modelValue: n2.value.enableSyncMouseMove, "onUpdate:modelValue": r2[4] ||= (e4) => n2.value.enableSyncMouseMove = e4, binary: "", size: "small", "input-id": "enableSyncMouseMove" }, null, 8, ["modelValue"]), p("label", xe, g(e3.$t("\u8F68\u8FF9")), 1)])])])])]);
  };
} }), [["__scopeId", "data-v-704c2d0e"]]);
var Ce = { class: "simulate-settings" };
var we = { class: "form-item" };
var Te = { class: "form-item-label" };
var Ee = { class: "form-item-content" };
var De = { key: 0, class: "form-item" };
var Oe = { class: "form-item-label" };
var ke = { class: "form-item-content" };
var Ae = { class: "input-number-row" };
var je = { class: "form-item" };
var Me = { class: "form-item-label" };
var Ne = { class: "form-item-content" };
var Pe = { key: 1, class: "form-item" };
var Fe = { class: "form-item-label" };
var Ie = { class: "form-item-content" };
var Le = { class: "input-number-row" };
var Re = { class: "form-item" };
var ze = { class: "form-item-label" };
var Be = { class: "form-item-content" };
var Ve = { class: "flex items-center gap-2" };
var $ = { for: "parallel-delay" };
var He = { class: "flex items-center gap-2" };
var Ue = { for: "serialization-delay" };
var We = M(n({ __name: "simulate", props: { modelValue: { required: !0 }, modelModifiers: {} }, emits: ["update:modelValue"], setup(e2) {
  let t2 = S(e2, "modelValue");
  return C(() => t2.value.inputIntervalMinMs, () => {
    t2.value.inputIntervalMinMs >= t2.value.inputIntervalMaxMs && (t2.value.inputIntervalMaxMs = t2.value.inputIntervalMinMs + 1);
  }), C(() => t2.value.inputIntervalMaxMs, () => {
    t2.value.inputIntervalMaxMs <= t2.value.inputIntervalMinMs && (t2.value.inputIntervalMinMs = Math.max(0, t2.value.inputIntervalMaxMs - 1));
  }), C(() => t2.value.clickIntervalMinMs, () => {
    t2.value.clickIntervalMinMs >= t2.value.clickIntervalMaxMs && (t2.value.clickIntervalMaxMs = t2.value.clickIntervalMinMs + 1);
  }), C(() => t2.value.clickIntervalMaxMs, () => {
    t2.value.clickIntervalMaxMs <= t2.value.clickIntervalMinMs && (t2.value.clickIntervalMinMs = Math.max(0, t2.value.clickIntervalMaxMs - 1));
  }), (e3, n2) => {
    let r2 = V, i2 = I, a2 = z, o2 = R, s2 = B, l2 = Q, u2 = ee;
    return c(), m("div", Ce, [p("div", we, [p("label", Te, g(e3.$t("\u70B9\u51FB\u5EF6\u8FDF")), 1), p("div", Ee, [E(r2, { modelValue: t2.value.enableClickDelay, "onUpdate:modelValue": n2[0] ||= (e4) => t2.value.enableClickDelay = e4 }, null, 8, ["modelValue"])])]), t2.value.enableClickDelay ? (c(), m("div", De, [p("label", Oe, g(e3.$t("\u70B9\u51FB\u5EF6\u8FDF\u95F4\u9694")), 1), p("div", ke, [p("div", Ae, [E(o2, { class: "w-[92px]" }, { default: v(() => [E(i2, { modelValue: t2.value.clickIntervalMinMs, "onUpdate:modelValue": n2[1] ||= (e4) => t2.value.clickIntervalMinMs = e4, min: 0, useGrouping: !1, fluid: "", size: "small" }, null, 8, ["modelValue"]), E(a2, null, { default: v(() => [...n2[7] ||= [d(" ms ", -1)]]), _: 1 })]), _: 1 }), n2[9] ||= p("div", { class: "divider" }, null, -1), E(o2, { class: "w-[92px]" }, { default: v(() => [E(i2, { modelValue: t2.value.clickIntervalMaxMs, "onUpdate:modelValue": n2[2] ||= (e4) => t2.value.clickIntervalMaxMs = e4, min: 1, useGrouping: !1, fluid: "", size: "small" }, null, 8, ["modelValue"]), E(a2, null, { default: v(() => [...n2[8] ||= [d(" ms ", -1)]]), _: 1 })]), _: 1 })])])])) : y("", !0), p("div", je, [p("label", Me, g(e3.$t("\u8F93\u5165\u5EF6\u8FDF")), 1), p("div", Ne, [E(r2, { modelValue: t2.value.enableInputDelay, "onUpdate:modelValue": n2[3] ||= (e4) => t2.value.enableInputDelay = e4 }, null, 8, ["modelValue"])])]), t2.value.enableInputDelay ? (c(), m("div", Pe, [p("label", Fe, g(e3.$t("\u5B57\u7B26\u8F93\u5165\u95F4\u9694")), 1), p("div", Ie, [p("div", Le, [E(o2, { class: "w-[92px]" }, { default: v(() => [E(i2, { modelValue: t2.value.inputIntervalMinMs, "onUpdate:modelValue": n2[4] ||= (e4) => t2.value.inputIntervalMinMs = e4, min: 0, useGrouping: !1, fluid: "", size: "small" }, null, 8, ["modelValue"]), E(a2, null, { default: v(() => [...n2[10] ||= [d(" ms ", -1)]]), _: 1 })]), _: 1 }), n2[12] ||= p("div", { class: "divider" }, null, -1), E(o2, { class: "w-[92px]" }, { default: v(() => [E(i2, { modelValue: t2.value.inputIntervalMaxMs, "onUpdate:modelValue": n2[5] ||= (e4) => t2.value.inputIntervalMaxMs = e4, min: 1, useGrouping: !1, fluid: "", size: "small" }, null, 8, ["modelValue"]), E(a2, null, { default: v(() => [...n2[11] ||= [d(" ms ", -1)]]), _: 1 })]), _: 1 })])])])) : y("", !0), p("div", Re, [p("label", ze, g(e3.$t("\u5EF6\u8FDF\u6A21\u5F0F")), 1), p("div", Be, [E(l2, { modelValue: t2.value.clickDelayMode, "onUpdate:modelValue": n2[6] ||= (e4) => t2.value.clickDelayMode = e4, name: "ingredient", class: "flex flex-wrap gap-4" }, { default: v(() => [p("div", Ve, [E(s2, { "input-id": "parallel-delay", value: 1, size: "small" }), p("div", null, [p("label", $, g(e3.$t("\u5E76\u884C\u5EF6\u8FDF")), 1), w(E(_(j), { class: "align-middle ml-1", name: "base/rx_ic_info", size: 12, color: "#C7CDD1" }, null, 512), [[u2, e3.$t("\u5E76\u884C\u5EF6\u8FDF\u6A21\u5F0F\u4E0B\uFF0C\u6240\u6709\u7A97\u53E3\u540C\u6B65\u6267\u884C\u5EF6\u8FDF\u95F4\u9694"), void 0, { top: !0 }]])])]), p("div", He, [E(s2, { "input-id": "serialization-delay", value: 0, size: "small" }), p("div", null, [p("label", Ue, g(e3.$t("\u4E32\u884C\u5EF6\u8FDF")), 1), w(E(_(j), { class: "align-middle ml-1", name: "base/rx_ic_info", size: 12, color: "#C7CDD1" }, null, 512), [[u2, e3.$t("\u4E32\u884C\u5EF6\u8FDF\u6A21\u5F0F\u4E0B\uFF0C\u7A97\u53E3\u9010\u4E2A\u4F9D\u6B21\u6267\u884C\u5EF6\u8FDF\u95F4\u9694"), void 0, { top: !0 }]])])])]), _: 1 }, 8, ["modelValue"])])])]);
  };
} }), [["__scopeId", "data-v-3de51465"]]);
var Ge = { class: "keyboard-shortcut" };
var Ke = { class: "form-item-label" };
var qe = { class: "form-item-content" };
var Je = { class: "form-item-content-input" };
var Ye = M(n({ __name: "keyboard-shortcut", props: { modelValue: { required: !0 }, modelModifiers: {} }, emits: ["update:modelValue"], setup(t2, { expose: n2 }) {
  let i2 = ["Control", "Shift", "Alt", "Meta"], a2 = [...Array.from({ length: 24 }, (e2, t3) => `F${t3 + 1}`), "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ...Array.from({ length: 26 }, (e2, t3) => String.fromCharCode(65 + t3)), "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "=", "+", "[", "]", "{", "}", "\\", "|", ";", ":", "'", '"', ",", "<", ".", ">", "/", "?"], l2 = S(t2, "modelValue"), u2 = e ? "windows" : "mac", C2 = o(), w2 = f({ get: () => l2.value[u2], set: (e2) => {
    Object.assign(l2.value[u2], e2);
  } }), T2 = f(() => {
    let e2 = Object.values(w2.value);
    return e2.filter((t3, n3) => t3 && e2.indexOf(t3) !== n3);
  });
  function D2(e2) {
    w2.value[e2] = "", C2.value[e2] = void 0;
  }
  async function k2(e2, t3) {
    e2.preventDefault();
    let n3 = "";
    e2.metaKey && (n3 += "Cmd + "), e2.ctrlKey && (n3 += "Ctrl + "), e2.shiftKey && (n3 += "Shift + "), e2.altKey && (n3 += "Alt + ");
    let r2 = e2.key;
    if (console.log("keyName", r2), !i2.includes(r2) && a2.includes(O(r2)) && (n3 += r2 === " " ? "Space" : O(r2), w2.value[t3] = n3), console.log("keyCombination", n3), !n3.endsWith(" + ")) {
      let e3 = await globalThis.electronAPI.send("syncControl:checkShortcutKeysIsOccupied", { [u2]: { [t3]: n3 } });
      console.log("checkShortcutKeysIsOccupied", e3), C2.value = { ...C2.value, ...e3 };
    }
  }
  let A2 = o([{ label: $t("\u505C\u6B62\u540C\u6B65"), key: "stopSync" }, { label: $t("\u663E\u793A\u6240\u6709\u7A97\u53E3"), key: "showAllWindows" }, { label: $t("\u5BAB\u683C\u5E03\u5C40"), key: "gridLayout" }, { label: $t("\u5806\u53E0\u5E03\u5C40"), key: "stackLayout" }, { label: $t("\u6279\u91CF\u8F93\u5165"), key: "openBatchInputDialog" }, { label: $t("\u7EDF\u4E00\u6807\u7B7E\u9875"), key: "unifiedTabs" }, { label: $t("\u5173\u95ED\u5176\u4ED6\u6807\u7B7E\u9875"), key: "closeOtherTabs" }, { label: $t("\u5173\u95ED\u5F53\u524D\u6807\u7B7E\u9875"), key: "closeCurrentTab" }, { label: $t("\u5173\u95ED\u7A7A\u767D\u6807\u7B7E\u9875"), key: "closeBlankTabs" }, { label: $t("\u6253\u5F00\u7F51\u5740"), key: "openSites" }, { label: $t("\u540C\u6B65\u7A97\u53E3\u5217\u8868"), key: "openSyncWindowList" }, { label: $t("\u540C\u6B65\u504F\u597D\u8BBE\u7F6E"), key: "openPreferenceSettings" }].map((e2) => ({ ...e2, onClear: D2 })));
  function j2(e2) {
    let t3 = C2.value?.[e2.key];
    return console.debug("target", e2, t3), !!(t3 && t3?.accelerator && t3?.status === !1);
  }
  async function M2() {
    let e2 = Object.values(w2.value).every((e3) => !e3.endsWith(" + "));
    if (console.log("isValid", e2), e2) {
      let e3 = await globalThis.electronAPI.send("syncControl:checkShortcutKeysIsOccupied", r(l2.value));
      console.debug("checkShortcutKeysIsOccupied", e3), C2.value = { ...C2.value, ...e3 };
    }
  }
  return s(() => {
    M2();
  }), n2({ valid() {
    return console.log("tempFormData", w2.value), !T2.value.length && !Object.values(C2.value).some((e2) => e2.accelerator && e2.status === !1);
  } }), (e2, t3) => {
    let n3 = L, r2 = F, i3 = H;
    return c(), m("div", Ge, [(c(!0), m(h, null, x(_(A2), (t4) => (c(), m("div", { key: t4.key, class: "form-item" }, [p("label", Ke, g(t4.label), 1), p("div", qe, [p("div", Je, [E(n3, { modelValue: _(w2)[t4.key], "onUpdate:modelValue": (e3) => _(w2)[t4.key] = e3, type: "text", placeholder: e2.$t("\u8BBE\u7F6E\u5FEB\u6377\u952E"), size: "small", invalid: j2(t4), onKeydown: (e3) => k2(e3, t4.key) }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder", "invalid", "onKeydown"]), E(r2, { icon: "base/rx_ic_delete", severity: "secondary", size: "xxs", outlined: "", onClick: (e3) => D2(t4.key) }, null, 8, ["onClick"])]), j2(t4) ? (c(), b(i3, { key: 0, size: "small", severity: "error", variant: "simple", class: "error-message" }, { default: v(() => [d(g(e2.$t("\u548C\u7CFB\u7EDF\u5FEB\u6377\u952E\u51B2\u7A81\uFF0C\u8BF7\u8C03\u6574")), 1)]), _: 1 })) : _(T2).includes(_(w2)[t4.key]) ? (c(), b(i3, { key: 1, size: "small", severity: "error", variant: "simple", class: "error-message" }, { default: v(() => [d(g(e2.$t("\u548C\u5176\u4ED6\u5FEB\u6377\u952E\u51B2\u7A81\uFF0C\u8BF7\u8C03\u6574")), 1)]), _: 1 })) : y("", !0)])]))), 128))]);
  };
} }), [["__scopeId", "data-v-5b537c4c"]]);
var Xe = n({ __name: "preferences", setup(e2) {
  let n2 = A(), { getUserConfig: i2 } = t(), [a2, f2] = k(), p2 = o(!1), S2 = o({}), C2 = o(Y), w2 = o([{ id: "base", label: $t("\u57FA\u7840\u8BBE\u7F6E"), component: T(Se), onSave() {
    N2();
  } }, { id: "customLayout", label: $t("\u81EA\u5B9A\u4E49\u5E03\u5C40"), component: T(re), onSave: async () => {
    try {
      await globalThis.electronAPI.send("syncControl:doLayout", r(C2.value.customLayout)), await N2();
    } catch (error) {
      f2(-1, error.message);
    }
  } }, { id: "simulate", label: $t("\u4EFF\u771F\u53C2\u6570\u8BBE\u7F6E"), component: T(We), onSave: N2 }, { id: "shortcutKey", label: $t("\u5FEB\u6377\u952E\u8BBE\u7F6E"), component: T(Ye), onSave: async () => {
    if (!S2.value.shortcutKey?.valid()) {
      f2(-1, $t("\u5FEB\u6377\u952E\u8BBE\u7F6E\u51B2\u7A81"));
      return;
    }
    try {
      await globalThis.electronAPI.send("syncControl:registerShortcut", r(C2.value.shortcutKey)), await N2();
    } catch (error) {
      f2(-1, error.message);
    }
  } }]), O2 = w2.value.find((e3) => e3.id === n2.query.tab)?.id || w2.value[0].id, j2 = o(O2);
  function M2() {
    globalThis.electronAPI.send("syncControl:closePreferencesDialog");
  }
  function N2() {
    return (async () => {
      try {
        const { code: e3, msg: t2 } = await X(C2.value);
        a2(e3, t2, { life: 1200 }), await globalThis.electronAPI.send("syncControl:closePreferencesDialog");
      } catch (error) {
        f2(-1, error.message);
      }
    })();
  }
  return s(async () => {
    let e3 = await i2();
    e3?.preferenceSettings && Object.keys(C2.value).forEach((t2) => {
      Reflect.has(e3.preferenceSettings, t2) && D(C2.value[t2], e3.preferenceSettings[t2]);
    }), p2.value = !0, setTimeout(() => {
      let e4 = document.querySelector(".p-tablist");
      console.log("tablistEl scrollWidth", e4?.scrollWidth, "clientWidth", e4?.clientWidth), globalThis.electronAPI.send("app:resizeWindow", { width: window.innerWidth + e4?.scrollWidth - e4?.clientWidth, height: window.innerHeight });
    }, 60);
  }), (e3, t2) => {
    let n3 = q, r2 = G, i3 = F, a3 = K, o2 = W, s2 = U;
    return c(), b(Z, { header: e3.$t("\u504F\u597D\u8BBE\u7F6E"), onHide: M2 }, { default: v(() => [E(s2, { value: _(j2), "onUpdate:value": t2[0] ||= (e4) => u(j2) ? j2.value = e4 : null }, { default: v(() => [E(r2, { pt: { root: "flex-shrink-0" } }, { default: v(() => [(c(!0), m(h, null, x(_(w2), (e4) => (c(), b(n3, { key: e4.id, value: e4.id }, { default: v(() => [d(g(e4.label), 1)]), _: 2 }, 1032, ["value"]))), 128))]), _: 1 }), _(p2) ? (c(), b(o2, { key: 0 }, { default: v(() => [(c(!0), m(h, null, x(_(w2), (t3) => (c(), b(a3, { key: t3.id, value: t3.id }, { default: v(() => [(c(), b(l(t3.component), { modelValue: _(C2)[t3.id], "onUpdate:modelValue": (e4) => _(C2)[t3.id] = e4, ref_for: !0, ref: (e4) => _(S2)[t3.id] = e4, class: "form-container" }, null, 8, ["modelValue", "onUpdate:modelValue"])), E(i3, { class: "save-button", onClick: t3.onSave }, { default: v(() => [d(g(e3.$t("\u4FDD\u5B58\u5E76\u751F\u6548")), 1)]), _: 1 }, 8, ["onClick"])]), _: 2 }, 1032, ["value"]))), 128))]), _: 1 })) : y("", !0)]), _: 1 }, 8, ["value"])]), _: 1 }, 8, ["header"]);
  };
} });
export {Xe as default};