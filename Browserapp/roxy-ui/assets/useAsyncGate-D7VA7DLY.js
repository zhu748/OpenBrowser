import {Ar as e,_t as t,a as n,cr as r,h as i,nn as a,or as o,xr as s} from "./utils-BIWenCnY.js";
import {C as c,D as l,Dt as u,E as d,Et as f,F as p,J as m,N as h,P as g,St as _,W as v,Z as te,_t as ne,b as y,bt as ie,d as b,en as x,f as S,g as C,h as w,i as T,in as E,jt as D,lt as O,m as k,nn as A,p as j,q as M,rn as N,rt as P,st as F,tt as I,ut as L,w as ae,x as R} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as z} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as B} from "./locales-BfKu2SD4.js";
import {a as V,s as H} from "./cookie-CqdL0VrU.js";
import {n as oe} from "./agent-BmSFI9WH.js";
import {m as se,n as ce} from "./proxy-D7e36h-l.js";
import {d as W,i as G} from "./dist-ufdnm93_.js";
import {b as ue} from "./rich-html-link-VdBpR3Cm.js";
import {t as de} from "./proxy-create-mode-BCcLAAf5.js";
import {i as fe} from "./ry-table-do6kugym.js";
import {Z as K} from "./basecomponent-ClhuVxJN.js";
import {t as q} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as pe} from "./tooltip-BYYKWrvu.js";
import {t as J} from "./rx-button-DyzuUt-V.js";
import {t as me} from "./m-input-select-C8pih1gY.js";
import {t as he} from "./rx-alert-A_y5uvgP.js";
import {t as ge} from "./inputnumber-BD6BwCgc.js";
import {t as _e} from "./inputtext-Crzvb5jQ.js";
import {n as Y,t as ve} from "./inputicon-Bn1KerIx.js";
import {n as ye} from "./motion-BwnyBP9B.js";
import {i as X} from "./contextmenu-BBjizTDn.js";
import {t as be} from "./useDialog-BC-nc8J-.js";
import {t as xe} from "./multiselect-DS9bwX-7.js";
import {t as Z} from "./rx-input-text-CytLc5Og.js";
import {t as Q} from "./message-SBZQdXpt.js";
import {t as Se} from "./password-CRxCSpUp.js";
import {t as Ce} from "./textarea-DvuriTzI.js";
import {E as we,t as Te} from "./hooks-Jw3GridD.js";
import {t as De} from "./simplePopup-D6H7ykCr.js";
import {t as Oe} from "./platform-icon-Cvcj894X.js";
import {o as ke,t as je} from "./useProxyFormDrawer-r-7UykRS.js";
import {n as Me,r as Ne,t as Pe} from "./quick-kroUOSn_.js";
import {r as Fe} from "./utils-CnUy4XUk.js";
import {t as Ie} from "./quick-CZrtqSCy.js";
import {t as Le} from "./account-2bDq0W_G.js";
import {t as Re} from "./rx-select-button-DQtmZ0kT.js";
import {t as Be} from "./rx-input-textarea-BWwP6OaO.js";
import {t as $} from "./input-label-qeCNGFwS.js";
import {t as Ve} from "./rx-input-number-aNUE_OpE.js";
import {i as He,n as Ue,r as We,t as Ge} from "./rx-accordion-BvZbJmSm.js";
import {t as Ke} from "./os-switch-BtW3PZYG.js";
import {t as qe} from "./simple-zBOi42-i.js";
import {t as Je} from "./rx-input-radio-BGeLgzak.js";
import {n as Ye,t as Xe} from "./inputgroupaddon-BbIAxQsK.js";
import {t as Ze} from "./rx-card-De8gGY1x.js";
var Qe = q(c({ inheritAttrs: !1, __name: "rx-input-multiselect", props: { size: { default: "sm" } }, emits: ["change"], setup(e2) {
  let t2 = C(e2, ["size"]), n2 = { filter: !0, optionLabel: "label", optionValue: "value" };
  return (r2, i2) => {
    let a2 = xe;
    return v(), j(a2, g({ ...n2, ...t2, ...r2.$attrs }, { pt: { root: e2.size, optionlabel: r2.classes.optionlabel, list: "text-3.25", emptymessage: "text-3.25" }, onChange: i2[0] ||= (e3) => r2.$emit("change") }), { dropdownicon: O(() => [R(D(K), { name: "base/rx_ic_chevron_down" })]), chipicon: O(({ removeCallback: e3, ...t3 }) => [R(D(K), g({ name: "base/rx_ic_delete" }, t3, { onClick: e3 }), null, 16, ["onClick"])]), _: 1 }, 16, ["pt"]);
  };
} }), [["__cssModules", { classes: { optionlabel: "_optionlabel_ex20s_2" } }], ["__scopeId", "data-v-6e8801f8"]]);
var $e = { class: "flex-1" };
var et = { key: 2, class: "rx-input-help" };
var tt = { key: 3, class: "rx-input-help" };
var nt = q(c({ inheritAttrs: !1, __name: "form-item", props: { name: {}, type: { default: "text" }, label: {}, tooltip: {}, labelPosition: { default: "top" } }, setup(e2) {
  let t2 = { multiSelect: Qe, select: X, radio: Je, date: fe, number: Ve, text: Z, textarea: Be };
  return (n2, r2) => (v(), w("div", { class: x(["rx-input", { "rx-label-left": e2.labelPosition === "left" }]) }, [m(n2.$slots, "label", {}, () => [R($, A(d({ name: e2.name, label: e2.label, tooltip: e2.tooltip })), null, 16)], !0), m(n2.$slots, "input", {}, () => [S("div", $e, [e2.type === "selectButton" ? (v(), j(Re, g({ key: 0, class: "w-full", "option-label": "label", "option-value": "value", "data-key": "value" }, n2.$attrs, { name: e2.name }), null, 16, ["name"])) : (v(), j(te(t2[e2.type]), g({ key: 1, class: "w-full" }, n2.$attrs, { name: e2.name }), null, 16, ["name"])), n2.$attrs.invalid ? (v(), w("small", et, E(n2.$attrs.errorMsg || n2.$attrs.placeholder), 1)) : k("", !0), n2.$attrs.help ? (v(), w("small", tt, E(n2.$attrs.help), 1)) : k("", !0)])], !0)], 2));
} }), [["__scopeId", "data-v-7648fa6c"]]);
var rt = { class: "flex-1" };
var it = { key: 2, class: "rx-input-help" };
var at = { key: 3, class: "rx-input-help" };
var ot = q(c({ inheritAttrs: !1, __name: "input-base", props: { name: String, type: { type: String, default: "text" }, labelPosition: { type: String, default: "top" }, icon: String, leftIcon: String }, emits: ["iconClick", "change"], setup(e2) {
  return (t2, n2) => {
    let r2 = ve, i2 = Ce, a2 = _e, o2 = ge, s2 = Y, c2 = Se;
    return v(), w("div", { class: x(["rx-input", { "rx-label-left": e2.labelPosition === "left" }]) }, [m(t2.$slots, "default", {}, () => [m(t2.$slots, "label", {}, () => [R($, g({ name: e2.name }, t2.$attrs), null, 16, ["name"])], !0), S("div", rt, [e2.type === "password" ? (v(), j(c2, g({ key: 1, id: e2.name, class: "w-full", feedback: !1, "toggle-mask": "" }, t2.$attrs, { onInput: n2[5] ||= (e3) => t2.$emit("change") }), null, 16, ["id"])) : (v(), j(s2, { key: 0, class: "w-full" }, { default: O(() => [e2.leftIcon ? (v(), j(r2, { key: 0 }, { default: O(() => [R(D(K), { name: e2.leftIcon, class: "rx-icon cursor-pointer", onClick: n2[0] ||= (e3) => t2.$emit("iconClick") }, null, 8, ["name"])]), _: 1 })) : k("", !0), e2.type === "textarea" ? (v(), j(i2, g({ key: 1, id: e2.name, class: "w-full", rows: "5", cols: "30", "auto-resize": "" }, t2.$attrs, { onInput: n2[1] ||= (e3) => t2.$emit("change") }), null, 16, ["id"])) : k("", !0), e2.type === "text" ? (v(), j(a2, g({ key: 2, id: e2.name, class: "w-full" }, t2.$attrs, { onInput: n2[2] ||= (e3) => t2.$emit("change") }), null, 16, ["id"])) : k("", !0), e2.type === "number" ? (v(), j(o2, g({ key: 3, id: e2.name, class: "w-full" }, t2.$attrs, { onInput: n2[3] ||= (e3) => t2.$emit("change") }), null, 16, ["id"])) : k("", !0), e2.icon ? (v(), j(r2, { key: 4, class: x({ "textarea-icon": e2.type === "textarea" }) }, { default: O(() => [R(D(K), { name: e2.icon, class: "rx-icon cursor-pointer", onClick: n2[4] ||= (e3) => t2.$emit("iconClick") }, null, 8, ["name"])]), _: 1 }, 8, ["class"])) : k("", !0)]), _: 1 })), t2.$attrs.invalid ? (v(), w("small", it, E(t2.$attrs.errorMsg ? t2.$attrs.errorMsg : t2.$attrs.placeholder), 1)) : k("", !0), t2.$attrs.help ? (v(), w("small", at, E(t2.$attrs.help), 1)) : k("", !0)])], !0)], 2);
  };
} }), [["__scopeId", "data-v-a999f5dc"]]);
var st = { key: 0, class: "w-full flex items-center gap-1.5" };
var ct = { key: 1, class: "shrink-0 separator-title" };
var lt = q(c({ __name: "index", props: { inputs: { tyep: Array, default: () => [] }, labelPosition: { type: String, default: "top" } }, setup(e2) {
  let t2 = e2, n2 = ae()?.uid, r2 = b(() => t2.inputs.filter((e3) => e3.visible !== !1)), i2 = ["password"];
  function a2(e3, t3) {
    e3.invalid &&= !1, e3.change?.(e3, t3);
  }
  function o2(e3) {
    e3.preventDefault();
  }
  return (t3, s2) => {
    let c2 = K;
    return v(), w("form", { class: "flex flex-col gap-4", onSubmit: z(o2, ["prevent"]) }, [(v(!0), w(T, null, M(D(r2), (r3, o3) => m(t3.$slots, r3.slot, { input: r3, labelPosition: e2.labelPosition }, () => [r3.separator ? (v(), w("div", st, [r3.separatorIcon ? (v(), j(c2, g({ key: 0, ref_for: !0 }, r3.separatorIcon, { class: "shrink-0", size: "16" }), null, 16)) : k("", !0), r3.separatorTitle ? (v(), w("div", ct, E(r3.separatorTitle), 1)) : k("", !0), s2[0] ||= S("div", { class: "flex-1 separator-line" }, null, -1)])) : i2.includes(r3.type) ? (v(), j(ot, g({ key: 1, modelValue: r3.value, "onUpdate:modelValue": (e3) => r3.value = e3 }, { ref_for: !0 }, r3, { "label-position": e2.labelPosition, onIconClick: () => r3.iconClick?.(r3, e2.inputs), onChange: (t4) => a2(r3, e2.inputs) }), null, 16, ["modelValue", "onUpdate:modelValue", "label-position", "onIconClick", "onChange"])) : (v(), j(nt, g({ key: 2, ref_for: !0 }, r3, { modelValue: r3.value, "onUpdate:modelValue": (e3) => r3.value = e3, "label-position": e2.labelPosition, onChange: (t4) => a2(r3, e2.inputs), onIconClick: () => r3.iconClick?.(r3, e2.inputs) }), null, 16, ["modelValue", "onUpdate:modelValue", "label-position", "onChange", "onIconClick"]))], !0, `${D(n2)}_${r3.name ?? ""}_${o3}`)), 128))], 32);
  };
} }), [["__scopeId", "data-v-fa71a3b7"]]);
var ut = "/images/mini_browser.svg";
var dt = ["onClick"];
var ft = 4;
var pt = 228;
var mt = 140;
var ht = q(c({ __name: "position", props: { modelValue: {}, modelModifiers: {} }, emits: ["update:modelValue"], setup(e2) {
  let t2 = P(e2, "modelValue"), n2 = _(ft), r2 = _(ft), i2 = _(0), a2 = { 3: "tr", 6: "tr", 7: "bl", 8: "bl", 9: "br" }, o2 = c2(3, 3, pt, mt).map((e3) => ({ ...e3, angle: a2[e3.pid] || "tl" }));
  F(t2, () => {
    s2();
  }, { immediate: !0 });
  function s2() {
    if (t2.value) {
      let [e3, n3] = t2.value?.split(","), r3 = o2.find((t3) => {
        let { ratioX: r4, ratioY: i3 } = l2(t3);
        return Math.abs(r4 - Number(e3)) < 1e-4 && Math.abs(i3 - Number(n3)) < 1e-4;
      });
      r3 && u2(r3);
    }
  }
  function c2(e3 = 3, t3 = 3, n3 = 200, r3 = 200) {
    let i3 = [], a3 = n3 / (t3 - 1), o3 = r3 / (e3 - 1), s3 = 0;
    for (let n4 = 0; n4 < e3; n4++) for (let e4 = 0; e4 < t3; e4++) s3++, i3.push({ x: e4 * a3, y: n4 * o3, pid: s3 });
    return i3;
  }
  function l2(e3) {
    return { x: Math.min(e3.x + ft, 154), y: Math.min(e3.y + ft, 96), ratioX: e3.x / pt, ratioY: e3.y / mt };
  }
  function u2(e3) {
    i2.value = e3.pid;
    let { x: a3, y: o3, ratioX: s3, ratioY: c3 } = l2(e3);
    n2.value = a3, r2.value = o3, t2.value = `${s3},${c3},${e3.angle}`;
  }
  return (e3, t3) => (v(), w("div", null, [S("div", { class: "box", style: N({ width: "228px", height: "140px" }) }, [(v(!0), w(T, null, M(D(o2), (e4) => (v(), w("div", { class: "point", key: e4.pid, style: N({ left: e4.x + "px", top: e4.y + "px" }), onClick: (t4) => u2(e4) }, [S("div", { class: x(["point-mark", { active: D(i2) === e4.pid }]) }, null, 2)], 12, dt))), 128)), R(D(ye).div, { class: "relative z-10", style: N({ width: "70px", height: "40px" }), animate: { x: D(n2), y: D(r2) }, transition: { duration: 0.35, ease: [0, 0.71, 0.2, 1.01] } }, { default: O(() => [S("img", { style: N({ width: "70px", height: "40px" }), src: ut }, null, 4)]), _: 1 }, 8, ["style", "animate"])], 4)]));
} }), [["__scopeId", "data-v-3c340f6d"]]);
function gt(e2) {
  let t2, n2, r2 = 0;
  F(() => e2.enabled() ? e2.getNameInput() : void 0, (e3, n3) => {
    e3 !== n3 && (t2 = void 0), i2();
  }, { immediate: !0 }), F(() => {
    if (e2.enabled() && !e2.serialOnly) return [e2.getProxyList(), e2.getAccounts()];
  }, () => {
    i2();
  }, { deep: !0 });
  async function i2() {
    if (!e2.enabled()) return;
    let i3 = e2.getNameInput();
    if (!i3 || i3.dirId) return;
    let a2 = ++r2;
    e2.serialOnly && (i3.suggestedWindowName = ""), t2 ??= Fe(), e2.serialOnly || (n2 ??= Ne());
    let [o2, s2] = await Promise.all([t2, n2 ?? Promise.resolve([])]);
    if (a2 !== r2 || e2.getNameInput() !== i3 || !e2.enabled() || i3.dirId || !o2) return;
    let c2 = e2.serialOnly ? o2 : Me(o2, { accounts: e2.getAccounts(), proxyList: e2.getProxyList() }, s2);
    i3.placeholder = c2, i3.suggestedWindowName = c2;
  }
}
var _t = /* @__PURE__ */ Symbol("dynamic-table");
function vt(e2) {
  W(_t, e2);
}
function yt() {
  return G(_t);
}
var bt = { class: "w-full flex flex-col gap-3" };
var xt = { class: "flex items-center self-stretch gap-2" };
var St = { class: "flex-1 items-center flex gap-2" };
var Ct = { class: "title" };
var wt = { key: 0, class: "flex items-center gap-2" };
var Tt = { key: 1 };
var Et = { key: 0, class: "mb-2 subtitle" };
var Dt = { class: "pl-27 grid gap-2 list" };
var Ot = { class: "mt-0.5" };
var kt = { class: "flex-1 flex flex-col gap-1 overflow-hidden" };
var At = { class: "ellipsis-1 region min-w-0" };
var jt = { class: "flex items-center gap-1.5 info" };
var Mt = { class: "mt-0.5 flex gap-2" };
var Nt = c({ inheritAttrs: !1, __name: "account", props: { modelValue: {}, modelModifiers: {}, type: { default: Le.Order }, typeModifiers: {} }, emits: ["update:modelValue", "update:type"], setup(e2) {
  let { isBatch: t2, createCount: n2 } = yt(), { check: i2 } = a(), o2 = I(), s2 = ke(), c2 = P(e2, "modelValue"), u2 = P(e2, "type"), d2 = _({ type: "select", name: "platformBindType", props: { placeholder: $t("\u8BF7\u8F93\u5165\u6216\u9009\u62E9\u5E73\u53F0\u7F51\u5740"), optionValue: "value", options: [{ label: $t("\u987A\u5E8F\u5206\u914D"), value: Le.Order }, { label: $t("\u5E94\u7528\u4E8E\u6240\u6709\u7A97\u53E3"), value: Le.MultiWindow }] } }), f2 = b(() => c2.value?.filter((e3) => e3.id)), p2 = b(() => c2.value?.length ?? 0);
  function m2(e3, i3) {
    let a2 = e3 === "list", o3 = a2 ? $t("\u5E73\u53F0\u8D26\u53F7\u5217\u8868") : $t("\u6DFB\u52A0\u5E73\u53F0\u8D26\u53F7"), d3 = a2 ? { windowPlatformList: f2.value } : r(i3), p3 = a2 ? Ie : Pe;
    s2.showDrawer({ title: o3, slots: { container: () => l(p3, { data: d3, isBatch: t2.value, createCount: n2.value, accountType: u2.value, showRemark: !1, onClose: () => s2.hideDrawer(), onConfirm: (e4) => {
      e4._tempId ? te2(e4) : !Array.isArray(e4) && !e4.id ? c2.value.push({ ...e4, _tempId: Date.now().toString(32) }) : c2.value = c2.value.filter((e5) => !e5.id).concat(e4);
    } }) } });
  }
  function h2(e3) {
    i2("Profiles_edit_platform_outside") && (e3.id ? m2("list") : m2("create", e3));
  }
  function ee2(e3) {
    c2.value = c2.value.filter((t3) => (t3._tempId || t3.id) !== (e3._tempId || e3.id));
  }
  function te2(e3) {
    let t3 = c2.value.findIndex((t4) => t4._tempId === e3._tempId);
    t3 > -1 && Reflect.set(c2.value, t3, e3);
  }
  return (e3, r2) => {
    let a2 = K, s3 = J, l2 = Ze, f3 = pe;
    return v(), w("div", bt, [S("div", xt, [S("div", St, [S("div", Ct, E(D(o2).label), 1), D(t2) ? (v(), w("div", wt, [R(me, g({ modelValue: u2.value, "onUpdate:modelValue": r2[0] ||= (e4) => u2.value = e4 }, D(d2).props, { "overlay-auto-width": "" }), null, 16, ["modelValue"]), L(R(a2, { name: "base/rx_ic_info", color: "var(--colors-icon-icon-note)" }, null, 512), [[f3, { value: e3.$t(`\u987A\u5E8F\u5206\u914D: \u8D26\u53F7\u987A\u5E8F\u5206\u914D\u7ED9\u7A97\u53E3\uFF0C\u4E00\u4E2A\u7A97\u53E3\u5E94\u7528\u4E00\u4E2A\u8D26\u53F7
\u5E94\u7528\u4E8E\u6240\u6709\u7A97\u53E3: \u5C06\u8D26\u53F7\u5E94\u7528\u5230\u6240\u6709\u7A97\u53E3`), showDelay: 300, pt: { root: "!max-w-65" } }]])])) : k("", !0)]), D(i2)("Profiles_select_platform") ? (v(), j(s3, { key: 0, text: "", size: "xxs", severity: "secondary", icon: "base/rx_ic_exchange", label: e3.$t("\u9009\u62E9"), onClick: r2[1] ||= (e4) => m2("list") }, null, 8, ["label"])) : k("", !0), D(i2)("Profiles_add_platform_outside") ? (v(), j(s3, { key: 1, text: "", size: "xxs", severity: "secondary", icon: "base/rx_ic_plus", label: e3.$t("\u6DFB\u52A0"), onClick: r2[2] ||= (e4) => m2("create") }, null, 8, ["label"])) : k("", !0)]), D(t2) && u2.value === D(Le).Order && D(p2) > D(n2) ? (v(), j(D(he), { key: 0, class: "w-full", type: "warn", title: e3.$t("{count} \u4E2A\u7A97\u53E3\u5C06\u4F1A\u7ED1\u5B9A\u8D26\u53F7\u3002\u60A8\u521B\u5EFA\u7684\u7A97\u53E3\u6570\u4E3A\uFF1A{max}\u3002{message}", { count: D(p2), max: D(n2), message: e3.$t("\u5F53\u524D\u9009\u62E9\u7ED1\u5B9A\u7684\u8D26\u53F7\u6570\u91CF\u5DF2\u8D85\u8FC7\u521B\u5EFA\u7A97\u53E3\u6570\u3002") }), closable: !1 }, null, 8, ["title"])) : k("", !0), c2.value?.length ? (v(), w("div", Tt, [D(t2) ? (v(), w("div", Et, E(e3.$t("\u8D26\u53F7\u5217\u8868 ({count})", { count: D(p2) })), 1)) : k("", !0), S("div", Dt, [(v(!0), w(T, null, M(c2.value, (e4, t3) => (v(), j(l2, { key: t3, class: "flex gap-2 items-start overflow-hidden", closable: !1, onClick: (t4) => h2(e4) }, { default: O(() => [S("div", Ot, [e4.platformIcon ? (v(), j(Oe, { key: 0, class: "icon", "platform-icon": e4.platformIcon, "platform-icon-dark": e4.platformIconDark }, null, 8, ["platform-icon", "platform-icon-dark"])) : (v(), j(a2, { key: 1, name: "base/rx_ic_user_key", color: "var(--colors-icon-icon-tertiary, #7C8387)" }))]), S("div", kt, [S("div", At, E(e4.platformUrl), 1), S("div", jt, E(e4.platformUserName || "--"), 1)]), S("div", Mt, [D(i2)("Profiles_edit_platform_outside") ? (v(), j(a2, { key: 0, class: "cursor-pointer", name: "base/rx_ic_delete", color: "var(--colors-icon-icon-tertiary)", onClick: z((t4) => ee2(e4), ["stop"]) }, null, 8, ["onClick"])) : k("", !0)])]), _: 2 }, 1032, ["onClick"]))), 128))])])) : k("", !0)]);
  };
} });
var Pt = q(Nt, [["__scopeId", "data-v-08a8bdac"]]);
var Ft = { class: "flex min-w-0 w-full" };
var It = { class: "min-w-0 flex-1" };
var Lt = c({ inheritAttrs: !1, __name: "cookies", props: h({ platformUrls: {} }, { modelValue: {}, modelModifiers: {}, invalid: { type: Boolean, default: !1 }, invalidModifiers: {} }), emits: ["update:modelValue", "update:invalid"], setup(e2) {
  let t2 = e2, n2 = I(), r2 = P(e2, "modelValue"), i2 = P(e2, "invalid"), a2 = _();
  async function o2() {
    let e3 = await V();
    e3 && (e3.data ? (r2.value = e3.data, i2.value = !1) : (i2.value = !0, a2.value = e3.message));
  }
  function s2(e3) {
    let n3 = H(e3?.trim() ?? "", { platformUrls: t2.platformUrls });
    return n3.valid ? (i2.value = !1, a2.value = void 0, !0) : (i2.value = !0, a2.value = n3.message, !1);
  }
  function c2(e3) {
    s2(e3.target.value);
  }
  return F(() => t2.platformUrls, () => {
    r2.value && s2(r2.value);
  }, { deep: !0 }), (e3, t3) => {
    let s3 = Q;
    return v(), w("div", Ft, [R($, { class: "shrink-0 max-w-25 !min-w-25 text-right", label: D(n2).label, tooltip: e3.$t("Cookies \u7528\u4E8E\u4FDD\u5B58\u7F51\u7AD9\u7684\u767B\u5F55\u72B6\u6001\u548C\u4F1A\u8BDD\u4FE1\u606F\u3002\u5BFC\u5165\u540E\u5C06\u5728\u6253\u5F00\u7A97\u53E3\u65F6\u81EA\u52A8\u5199\u5165\uFF0C\u53EF\u7528\u4E8E\u8FC1\u79FB\u6216\u6062\u590D\u7F51\u7AD9\u767B\u5F55\u72B6\u6001\u3002") }, null, 8, ["label", "tooltip"]), S("div", It, [R(Be, { modelValue: r2.value, "onUpdate:modelValue": t3[0] ||= (e4) => r2.value = e4, rows: "3", icon: "base/rx_ic_attachment", placeholder: D(n2).placeholder || e3.$t(`\u9009\u586B
\u652F\u6301\u683C\u5F0F: JSON\u3001Netscape\u3001Name=Value
Name=Value \u672A\u5199 domain \u65F6\uFF0C\u5C06\u6309\u884C\u4ECE\u5E73\u53F0\u8D26\u53F7\u7684\u7F51\u5740\u81EA\u52A8\u586B\u5145`), "auto-resize": !1, invalid: i2.value, onIconClick: o2, onBlur: c2 }, null, 8, ["modelValue", "placeholder", "invalid"]), i2.value ? (v(), j(s3, { key: 0, severity: "error", size: "small", variant: "simple" }, { default: O(() => [y(E(D(a2)), 1)]), _: 1 })) : k("", !0)])]);
  };
} });
var Jt = { render: () => null };
var an = { render: () => null };
var on = { class: "w-full flex flex-col gap-3" };
var sn = { class: "flex items-center self-stretch gap-2" };
var cn = { class: "flex-1 flex flex-col gap-1.5" };
var ln = { class: "title" };
var un = { key: 0, class: "flex items-center gap-1 tips" };
var dn = { key: 0, class: "flex items-center gap-2" };
var fn = { class: "pl-27 flex flex-col gap-3 empty:hidden" };
var pn = { key: 1, class: "grid gap-2 list" };
var mn = { class: "flex-1 flex flex-col gap-1 overflow-hidden" };
var hn = { class: "flex items-center gap-2 region" };
var gn = { key: 0, class: "flex items-center gap-1.5 info" };
var _n = { class: "text-[var(--colors-text-text-primary)] font-bold" };
var vn = ["onClick"];
var yn = { key: 1, class: "flex items-center gap-1.5 info" };
var bn = { class: "flex-1 ellipsis-1" };
var xn = { class: "mt-0.5 flex gap-2" };
var Sn = { key: 2, class: "flex items-center gap-2" };
var Cn = { class: "flex items-center gap-2" };
var wn = { class: "flex items-center gap-2" };
var Tn = { class: "tt-primary text-3 font-500 leading-5" };
var En = { class: "flex items-center gap-1.5 pl-7" };
var Dn = { class: "select-none preorder-desc" };
var On = { class: "flex-1 tt-inactive text-3 leading-4" };
var kn = q(c({ inheritAttrs: !1, __name: "proxy", props: { modelValue: {}, modelModifiers: {} }, emits: ["update:modelValue"], setup(n2) {
  let { isBatch: o2, createCount: c2, presetTemplate: u2 } = yt(), d2 = ue(), p2 = ke(), { showProxyFormDrawer: m2 } = je(p2), h2 = de("proxy"), g2 = we(), { testProxy: ee2, batchTestShowToast: te2 } = Te(), { getProxyVendors: re2 } = t(), { showSimpleDialog: y2 } = De(), { check: C2 } = a(), [A2, N2] = oe(), [F2] = be(), ae2 = I(), B2 = P(n2, "modelValue"), V2 = ie({}), H2 = b(() => B2.value.reduce((e2, t2) => e2 + (t2?._proxyCount || 0), 0)), le2 = b(() => B2.value.filter((e2) => e2.id)), U2 = _(), W2 = _(!1), G2 = _(!1), fe2 = b(() => H2.value > c2.value ? $t("\u4EC5 {count} \u4E2A\u7A97\u53E3\u5C06\u4F1A\u7ED1\u5B9A\u4EE3\u7406 IP\u3002\u8BF7\u79FB\u9664\u591A\u4F59\u7684 {beyond} \u6761\u4EE3\u7406 IP\u3002", { count: c2.value, beyond: H2.value - c2.value }) : $t("\u4EC5 {count} \u4E2A\u7A97\u53E3\u5C06\u4F1A\u7ED1\u5B9A\u4EE3\u7406 IP", { count: H2.value })), q2 = b(() => C2("Cost_Center_all")), me2 = b(() => (o2.value || !B2.value?.length) && !G2.value && C2("Profiles_add_proxy_outside")), ge2 = b(() => {
    if (U2.value) return { proxyProviderId: U2.value.id, proxyProviderWebsite: U2.value.vendorWebsite, proxyProviderIcon: U2.value.vendorIcon, proxyProviderName: U2.value.vendorName };
  });
  async function _e2() {
    if (q2.value && !U2.value) {
      let e2 = await re2();
      if (!e2) return;
      U2.value = e2.find((e3) => e3.isOfficial);
    }
    W2.value = !0;
  }
  function Y2() {
    W2.value = !1;
  }
  async function ve2(e2) {
    try {
      await X2(e2);
    } finally {
      Y2();
    }
  }
  function ye2(e2) {
    Se2(e2), Y2();
  }
  async function X2(e2) {
    if (!e2?.immediate) {
      d2.push({ name: "agent-list", query: { name: "shop", orderNo: e2?.orderNo } });
      return;
    }
    let { code: t2, data: n3 } = await i.proxy.userGetProxyModuleListList({ orderNo: e2?.orderNo, type: ce.UseDeploy });
    t2 !== 0 || !n3.rows?.[0] ? d2.push({ name: "agent-list", query: { name: "shop", orderNo: e2?.orderNo } }) : o2.value ? n3.rows.forEach((e3) => {
      Se2({ ...e3, _type: se.buy });
    }) : Ce2(n3.rows[0]);
  }
  function xe2(e2) {
    C2("Profiles_edit_proxy_outside") && (e2.isEncryptProxy ? A2(-1, $t("\u8BE5\u4EE3\u7406 IP \u5DF2\u52A0\u5BC6\u65E0\u6CD5\u7F16\u8F91\uFF0C\u5982\u9700\u66F4\u6362\uFF0C\u8BF7\u5148\u5220\u9664\u6B64\u4EE3\u7406 IP \u6216\u9009\u62E9\u5176\u4ED6\u4EE3\u7406 IP")) : e2.id ? Z2("list") : Z2("create", e2));
  }
  function Z2(e2, t2) {
    if (e2 === "create") {
      m2({ title: h2.pageTitle, data: r(t2), mode: "proxy", onConfirm: (e3) => {
        Se2(e3);
      } });
      return;
    }
    let n3 = o2.value ? le2.value : le2.value[0];
    p2.showDrawer({ title: $t("\u4EE3\u7406 IP \u5217\u8868"), slots: { container: () => l(qe, { data: n3, isBatch: o2.value, onConfirm: (e3) => {
      Ce2(e3), p2.hideDrawer();
    } }) } });
  }
  function Q2(e2) {
    B2.value.splice(e2, 1);
  }
  function Se2(e2) {
    if (Me2(), e2._tempId) {
      let t2 = B2.value.findIndex((t3) => t3._tempId === e2._tempId);
      if (t2 > -1) {
        let n3 = B2.value[t2];
        Reflect.set(B2.value, t2, { ...n3, ...e2 });
      }
    } else e2.id || (e2._tempId = Date.now().toString(32)), o2.value ? B2.value.push({ ...e2, _proxyCount: 1 }) : B2.value = [e2];
  }
  function Ce2(e2) {
    if (!s(e2))
      if (Me2(), o2.value) {
        let t2 = B2.value.filter((e3) => !e3.id);
        B2.value = t2.concat(e2).map(({ bindList: e3, ...t3 }) => f(t3));
      } else B2.value = [f(e2)];
  }
  async function Ee2(e2, t2) {
    let { _checkRes: n3, bindList: r2, ...i2 } = f(e2);
    V2[t2] = !0;
    let a2 = await ee2({ ...i2, apiCheck: !1 });
    V2[t2] = !1, te2({ ...a2, proxyType: e2.proxyType ?? e2.buyProxyType }, { reCheck: () => Ee2(e2, t2) }), Object.assign(e2, a2);
  }
  function Oe2(e2) {
    y2({ content: $t("\u8BBE\u7F6E\u7ED1\u5B9A\u7684\u7A97\u53E3\u6570\u91CF"), inputs: [{ type: "number", name: "proxyCount", value: e2._proxyCount, props: { placeholder: $t("\u8BF7\u8F93\u5165\u6570\u91CF") }, resolver: (e3) => e3.number({ invalid_type_error: $t("\u6570\u91CF\u5FC5\u987B\u5927\u4E8E{min}", { min: 1 }) }).min(1, $t("\u6570\u91CF\u5FC5\u987B\u5927\u4E8E{min}", { min: 1 })) }], onConfirm: (t2) => {
      e2._proxyCount = Number.parseInt(t2.proxyCount);
    } });
  }
  function Ae2(t2) {
    return { value: [$t("\u4EE3\u7406 IP \u4FE1\u606F"), t2.ipType, `${t2.protocol}${e("://", t2.host)}${e(":", t2.port)}`, `${$t("\u52A8\u6001\u4EE3\u7406 IP \u5237\u65B0 URL")}: ${t2.refreshUrl}`, `${$t("\u4F4D\u7F6E")}: ${t2.lastCountry}${e("/", t2.lastCity) || ""}`, `${$t("\u68C0\u6D4B\u65F6\u95F4")}: ${t2.checkTime}`].join(`
`).replace(/(\/|:)?undefined/g, "--"), showDelay: 300, pt: { root: "!max-w-80" } };
  }
  function Me2() {
    u2 && (u2.value = void 0);
  }
  function Ne2() {
    F2({ showHeader: !1, modal: !0, blockScroll: !0, slots: { container: ({ hideModal: e2 }) => l(an, { data: u2.value.proxyInfo, onClose: e2, onConfirm: (t2) => {
      e2(), Reflect.set(u2.value, "proxyInfo", t2);
    }, onMore: () => {
      e2(), G2.value = !0, _e2();
    } }) } });
  }
  return (t2, n3) => {
    let r2 = K, i2 = J, a2 = Ze, s2 = pe;
    return v(), w("div", on, [S("div", sn, [S("div", cn, [S("div", ln, E(D(ae2).label), 1), !D(u2) && !B2.value.length ? (v(), w("div", un, [S("span", null, E(t2.$t("\u672C\u673A\u7F51\u7EDC\u73AF\u5883: {value}({ip})", { value: D(e)(D(g2).info?.country_code, D(e)("/", D(g2).info?.city)), ip: D(g2).info?.ip })), 1), L(R(r2, { name: "base/rx_ic_info", size: "14", color: "var(--colors-icon-icon-note)" }, null, 512), [[s2, { value: t2.$t("\u65E0\u4EE3\u7406 IP \u7684\u60C5\u51B5\u4E0B\u8BE5\u7A97\u53E3\u5C06\u4F7F\u7528\u5F53\u524D IP \u4F5C\u4E3A\u51FA\u53E3 IP") }, void 0, { top: !0 }]])])) : k("", !0)]), D(q2) || D(me2) ? (v(), w("div", dn, [R(i2, { size: "xxs", text: "", severity: "secondary", icon: "base/rx_ic_cart", label: B2.value.length && !D(o2) ? t2.$t("\u8D2D\u4E70") : t2.$t("\u8D2D\u4E70 / \u6DFB\u52A0"), onClick: _e2 }, null, 8, ["label"])])) : k("", !0), D(C2)("Profiles_select_proxy") ? (v(), j(i2, { key: 1, size: "xxs", text: "", severity: "secondary", icon: "base/rx_ic_exchange", label: t2.$t("\u9009\u62E9"), onClick: n3[0] ||= (e2) => Z2("list") }, null, 8, ["label"])) : k("", !0)]), R(Jt, { visible: D(W2), "onUpdate:visible": n3[1] ||= (e2) => ne(W2) ? W2.value = e2 : null, "show-buy": D(q2), "show-add": D(me2), provider: D(ge2), onClose: n3[2] ||= (e2) => G2.value = !1, onBuySuccess: ve2, onAddConfirm: ye2 }, null, 8, ["visible", "show-buy", "show-add", "provider"]), S("div", fn, [D(o2) && D(H2) && D(H2) !== D(c2) ? (v(), j(D(he), { key: 0, class: "w-full whitespace-pre-line", type: D(H2) > D(c2) ? "warn" : "info", closable: !1, title: D(fe2) }, null, 8, ["type", "title"])) : k("", !0), !D(u2) && B2.value.length ? (v(), w("div", pn, [(v(!0), w(T, null, M(B2.value, (i3, c3) => (v(), j(a2, { key: c3, class: "flex gap-2 items-start overflow-hidden", closable: !1, onClick: (e2) => xe2(i3) }, { default: O(() => [R(r2, { class: "mt-0.5", name: `country-code/${i3.lastCountry}`, fallback: "base/rx_ic_earth", color: "var(--colors-icon-icon-tertiary)" }, null, 8, ["name"]), S("div", mn, [S("div", hn, [S("span", null, E(i3.lastCountry || "--") + E(D(e)("/", i3.lastCity)), 1), L(R(r2, { name: "base/rx_ic_info_fill", size: "12", color: "var(--colors-icon-icon-note)" }, null, 512), [[s2, Ae2(i3), void 0, { top: !0 }]])]), D(o2) ? (v(), w("div", gn, [S("span", null, E(t2.$t("\u7ED1\u5B9A\u7A97\u53E3\u6570:")), 1), S("span", _n, E(i3._proxyCount), 1), S("span", { class: "text-[var(--colors-text-text-link)] cursor-pointer", onClick: z((e2) => Oe2(i3), ["stop"]) }, E(t2.$t("\u4FEE\u6539")), 9, vn)])) : (v(), w("div", yn, [S("div", null, E(i3.ipType), 1), n3[3] ||= S("div", { class: "line" }, null, -1), S("div", bn, E(i3.proxyCategory || i3.protocol) + E(D(e)("://", i3.host)) + E(D(e)(":", i3.port)), 1)]))]), S("div", xn, [D(C2)("Profiles_speed_test_proxy") ? (v(), j(r2, { key: 0, class: x(["cursor-pointer", { "pi-spin": D(V2)[c3] }]), name: D(V2)[c3] ? "base/rx_ic_progress_bar" : "base/rx_ic_speed_test", color: "var(--colors-icon-icon-tertiary)", onClick: z((e2) => Ee2(i3, Number(c3)), ["stop"]) }, null, 8, ["class", "name", "onClick"])) : k("", !0), D(C2)("Profiles_delete_proxy_outside") ? (v(), j(r2, { key: 1, class: "cursor-pointer", name: "base/rx_ic_delete", color: "var(--colors-icon-icon-tertiary)", onClick: z((e2) => Q2(Number(c3)), ["stop"]) }, null, 8, ["onClick"])) : k("", !0)])]), _: 2 }, 1032, ["onClick"]))), 128))])) : k("", !0), D(u2) && !D(o2) ? (v(), w("div", Sn, [S("div", { class: "flex-1 flex flex-col gap-1 pa-2 rounded-1.5 cursor-pointer preorder", onClick: Ne2 }, [S("div", Cn, [R(r2, { name: `country-code/${D(u2).proxyInfo.purchaseCountry.value.toLocaleUpperCase()}`, size: "20" }, null, 8, ["name"]), S("div", wn, [S("span", Tn, E(D(u2).proxyInfo.purchaseCountry.label), 1), R(r2, { class: "cursor-pointer", name: "base/rx_ic_exchange", size: "14", color: "var(--colors-icon-icon-tertiary)" })]), R(r2, { class: "mx-auto mr-0 cursor-pointer", name: "base/rx_ic_delete", color: "var(--colors-icon-icon-tertiary)", onClick: z(Me2, ["stop"]) })]), S("div", En, [S("div", Dn, E(D(u2).description), 1), L(R(r2, { class: "cursor-pointer", name: "base/rx_ic_info", size: "12", color: "var(--colors-icon-icon-note)" }, null, 512), [[s2, { value: D(u2).hover, showDelay: 300 }, void 0, { top: !0 }]])])]), S("div", On, E(t2.$t("Roxy \u5B98\u65B9\u76F4\u8425 IP\uFF0C\u4E1A\u52A1\u7A33\u5B9A\u6027 99%+")), 1)])) : k("", !0)])]);
  };
} }), [["__scopeId", "data-v-bc5de22c"]]);
var An = { class: "min-w-0 flex-1" };
var jn = c({ inheritAttrs: !1, __name: "urls", props: { modelValue: { default: [] }, modelModifiers: {}, invalid: { default: !1 }, invalidModifiers: {} }, emits: ["update:modelValue", "update:invalid"], setup(e2) {
  let t2 = I(), n2 = P(e2, "modelValue"), r2 = P(e2, "invalid"), i2 = _("");
  F(n2, (e3) => {
    i2.value = e3.join(`
`);
  }, { immediate: !0 });
  function a2() {
    let e3 = i2.value.split(`
`).filter((e4) => !!e4);
    try {
      for (let t3 = 0; t3 < e3.length; t3++) new URL(e3[t3]);
      n2.value = e3, r2.value = !1;
    } catch (e4) {
      console.error(e4), r2.value = !0;
    }
  }
  return (e3, n3) => {
    let o2 = Q;
    return v(), w("div", { class: x(["flex min-w-0 w-full", D(t2).class]) }, [R($, { class: "shrink-0", label: D(t2).label, tooltip: D(t2).tooltip }, null, 8, ["label", "tooltip"]), S("div", An, [R(Be, { modelValue: D(i2), "onUpdate:modelValue": n3[0] ||= (e4) => ne(i2) ? i2.value = e4 : null, rows: "3", placeholder: e3.$t(`\u5FC5\u987B\u4EE5 http:// \u6216 https:// \u5F00\u5934
\u6BCF\u884C\u4E00\u4E2A URL\uFF0C\u6362\u884C\u4EE5\u6DFB\u52A0\u591A\u4E2A`), invalid: r2.value, onBlur: a2 }, null, 8, ["modelValue", "placeholder", "invalid"]), r2.value ? (v(), j(o2, { key: 0, severity: "error", size: "small", variant: "simple" }, { default: O(() => [y(E(e3.$t("URL\u683C\u5F0F\u6709\u8BEF\uFF0C\u5FC5\u987B\u4EE5 http:// \u6216 https:// \u5F00\u5934")), 1)]), _: 1 })) : k("", !0)])], 2);
  };
} });
var Mn = { class: "user-agent-field flex min-w-0 w-full" };
var Nn = { class: "mr-2 shrink-0 tt-primary text-3.25 leading-32px rx-label" };
var Pn = { class: "ua-field-slot min-w-0 flex-1 overflow-hidden" };
var Fn = q(c({ __name: "user-agent-field", props: { input: {}, inputsGroup: { default: () => [] } }, setup(e2) {
  let t2 = e2, n2 = u(t2.input, "value"), r2 = _(!1), i2 = _(null), a2 = _(null);
  function o2(e3) {
    return (typeof e3 == "string" ? e3.trim() : "") || "\xA0";
  }
  function s2(e3) {
    return !(typeof e3 == "string" && e3.trim());
  }
  function c2(e3) {
    e3.invalid &&= !1, e3.change?.(e3, t2.inputsGroup);
  }
  function l2(e3) {
    let t3 = e3.relatedTarget;
    t3 && a2.value?.contains(t3) || (r2.value = !1);
  }
  function d2() {
    i2.value?.$el?.querySelector?.("textarea")?.focus();
  }
  function f2() {
    r2.value = !0, p(() => d2());
  }
  async function m2(e3) {
    try {
      await e3.iconClick?.(e3, t2.inputsGroup);
    } catch {
      return;
    }
    r2.value = !0, await p(), d2();
  }
  return (t3, u2) => {
    let d3 = Y, p2 = J;
    return v(), w("div", Mn, [S("div", Nn, E(e2.input.label), 1), S("div", { ref_key: "uaControlRowRef", ref: a2, class: "ua-control-row flex min-w-0 flex-1 items-start gap-2" }, [S("div", Pn, [D(r2) ? (v(), j(Be, g({ key: 1, ref_key: "uaTextareaRef", ref: i2, modelValue: D(n2), "onUpdate:modelValue": u2[0] ||= (e3) => ne(n2) ? n2.value = e3 : null, class: "min-w-0 max-w-full" }, e2.input, { onBlur: l2, onChange: u2[1] ||= (t4) => c2(e2.input) }), null, 16, ["modelValue"])) : (v(), j(d3, { key: 0, class: "ua-collapsed-iconfield min-w-0 w-full max-w-full", pt: { root: "sm" } }, { default: O(() => [S("button", { type: "button", class: "ua-collapsed-trigger cursor-text text-left transition-[box-shadow]", onClick: f2 }, [S("span", { class: x(["ua-collapsed-text block min-w-0 max-w-full truncate font-[Inter] text-3 leading-5", { "ua-collapsed-trigger--empty": s2(D(n2)) }]) }, E(o2(D(n2))), 3)])]), _: 1 }))]), R(p2, { severity: "secondary", variant: "outlined", icon: "base/rx_ic_shuffle", label: t3.$t("\u968F\u673A"), class: "shrink-0", onClick: u2[2] ||= (t4) => m2(e2.input) }, null, 8, ["label"])], 512)]);
  };
} }), [["__scopeId", "data-v-0d737e8d"]]);
var In = { class: "flex min-w-0 w-full flex-col gap-2" };
var Ln = { key: 0, class: "flex items-center justify-end gap-2.5" };
var Rn = { class: "text-3 font-[JetBrains_Mono]" };
var zn = ["onClick"];
var Bn = { class: "flex min-w-0 w-full items-start" };
var Vn = { class: "min-w-0 flex-1 flex flex-col gap-1" };
var Hn = { key: 0, class: "text-2.75 tt-inactive" };
var Un = { class: "flex min-w-0 w-full items-center" };
var Wn = { class: "min-w-0 flex-1 flex gap-2 overflow-hidden" };
var Gn = { class: "flex min-w-0 w-full items-center" };
var Kn = { class: "min-w-0 flex-1 flex flex-col gap-2 overflow-hidden" };
var qn = { class: "min-w-0 flex flex-1 gap-2 overflow-hidden" };
var Jn = { class: "flex items-center gap-1.5" };
var Yn = { class: "-mt-5 px-4 py-6 w-full dashed-border" };
var Xn = { class: "-mt-5 px-4 py-6 w-full dashed-border" };
var Zn = { class: "flex" };
var Qn = { class: "flex gap-2" };
var $n = { class: "flex py-4" };
var er = { class: "flex" };
var tr = { class: "tip-text" };
var nr = { class: "w-[105px] mt-2" };
var rr = q(c({ __name: "window-form-renderer", props: { inputs: { default: () => [] }, inputsGroup: { default: () => [] }, variant: { default: "settings" }, excludedFields: { default: () => [] } }, setup(e2) {
  let t2 = e2, [r2] = oe(), i2 = b(() => {
    let e3 = t2.inputs.filter((e4) => !t2.excludedFields.includes(e4.name));
    for (; e3[0]?.separator; ) e3.shift();
    for (; e3.at(-1)?.separator; ) e3.pop();
    return e3;
  }), a2 = b(() => i2.value.find((e3) => e3?.name === "windowName"));
  gt({ serialOnly: !0, enabled: () => !(!a2.value || a2.value.dirId), getNameInput: () => a2.value, getAccounts: () => [], getProxyList: () => [] });
  let s2 = b(() => {
    let e3 = t2.inputsGroup[0] ?? [];
    return (n(e3, "windowPlatformList")?.value ?? []).map((e4) => e4.platformUrl).filter(Boolean);
  });
  function c2(e3) {
    o(e3), r2(0, B("\u590D\u5236\u6210\u529F"));
  }
  return (t3, n2) => {
    let r3 = K, a3 = Q, o2 = Xe, l2 = Ye, u2 = ge, f2 = ve, p2 = Y, m2 = lt;
    return D(i2).length ? (v(), j(m2, { key: 0, class: x(["min-w-0 w-full max-w-full", { "profile-info": e2.variant === "window" }]), "label-position": "left", inputs: D(i2) }, { name: O(({ input: e3 }) => [S("div", In, [e3.dirId ? (v(), w("div", Ln, [S("span", Rn, "ID:" + E(e3.dirId), 1), S("span", { class: "text-3 font-[JetBrains_Mono] color-blue cursor-pointer", onClick: (t4) => c2(e3.dirId) }, E(D(B)("\u590D\u5236")), 9, zn)])) : k("", !0), S("div", Bn, [R($, g({ class: "shrink-0" }, e3), null, 16), S("div", Vn, [R(Z, g({ modelValue: e3.value, "onUpdate:modelValue": (t4) => e3.value = t4, class: "min-w-0 flex-1" }, e3), null, 16, ["modelValue", "onUpdate:modelValue"]), e3.dirId ? k("", !0) : (v(), w("span", Hn, E(D(B)("* \u7CFB\u7EDF\u81EA\u52A8\u751F\u6210\u7A97\u53E3\u540D\u79F0\uFF0C\u4E5F\u53EF\u624B\u52A8\u4FEE\u6539\u3002")), 1))])])])]), system: O(({ input: e3 }) => [S("div", Un, [R($, g({ class: "shrink-0" }, e3), null, 16), S("div", Wn, [R(Ke, { modelValue: e3.items[0].value, "onUpdate:modelValue": (t4) => e3.items[0].value = t4, class: "min-w-0 flex-1", options: e3.items[0].options, onChange: (t4) => e3.items[0].change?.(e3.items[0], e3.items) }, { item: O(({ item: e4 }) => [R(r3, { name: e4.icon }, null, 8, ["name"])]), _: 1 }, 8, ["modelValue", "onUpdate:modelValue", "options", "onChange"]), R(X, g(e3.items[1], { modelValue: e3.items[1].value, "onUpdate:modelValue": (t4) => e3.items[1].value = t4, class: "min-w-0 flex-1", onChange: (t4) => e3.items[1].change?.(e3.items[1], e3.items) }), null, 16, ["modelValue", "onUpdate:modelValue", "onChange"])])])]), kernel: O(({ input: e3 }) => [S("div", Gn, [R($, g({ class: "shrink-0" }, e3), null, 16), S("div", Kn, [S("div", qn, [R(Ke, { modelValue: e3.items[0].value, "onUpdate:modelValue": (t4) => e3.items[0].value = t4, class: "min-w-0 flex-1", disabled: e3.items[0].disabled, "disabled-tooltip": e3.items[0].disabled ? D(B)("\u5185\u6838\u4E0D\u652F\u6301\u4FEE\u6539") : void 0, options: e3.items[0].options, onChange: (t4) => e3.items[0].change?.(e3.items[0], e3.items) }, { item: O(({ item: e4 }) => [S("div", Jn, [R(r3, { name: e4.icon }, null, 8, ["name"]), S("span", null, E(e4.label), 1)])]), _: 1 }, 8, ["modelValue", "onUpdate:modelValue", "disabled", "disabled-tooltip", "options", "onChange"]), R(X, g(e3.items[1], { modelValue: e3.items[1].value, "onUpdate:modelValue": (t4) => e3.items[1].value = t4, class: "min-w-0 flex-1", onChange: (t4) => e3.items[1].change?.(e3.items[1], e3.items) }), null, 16, ["modelValue", "onUpdate:modelValue", "onChange"])]), e3.items[1].help ? (v(), j(a3, { key: 0, severity: "error", size: "small", variant: "simple" }, { default: O(() => [y(E(e3.items[1].help), 1)]), _: 2 }, 1024)) : k("", !0)])])]), userAgent: O(({ input: t4 }) => [R(Fn, { input: t4, "inputs-group": e2.inputsGroup }, null, 8, ["input", "inputs-group"])]), cookies: O(({ input: e3 }) => [R(Lt, g({ modelValue: e3.value, "onUpdate:modelValue": (t4) => e3.value = t4, invalid: e3.invalid, "onUpdate:invalid": (t4) => e3.invalid = t4, "platform-urls": D(s2) }, e3), null, 16, ["modelValue", "onUpdate:modelValue", "invalid", "onUpdate:invalid", "platform-urls"])]), proxy: O(({ input: e3 }) => [S("div", Yn, [R(kn, g({ modelValue: e3.value, "onUpdate:modelValue": (t4) => e3.value = t4 }, e3), null, 16, ["modelValue", "onUpdate:modelValue"])])]), accounts: O(({ input: e3 }) => [S("div", Xn, [R(Pt, g({ modelValue: e3.value, "onUpdate:modelValue": (t4) => e3.value = t4, type: e3.platformBindType, "onUpdate:type": (t4) => e3.platformBindType = t4 }, e3), null, 16, ["modelValue", "onUpdate:modelValue", "type", "onUpdate:type"])])]), urls: O(({ input: e3 }) => [R(jn, g({ modelValue: e3.value, "onUpdate:modelValue": (t4) => e3.value = t4, invalid: e3.invalid, "onUpdate:invalid": (t4) => e3.invalid = t4 }, e3), null, 16, ["modelValue", "onUpdate:modelValue", "invalid", "onUpdate:invalid"])]), windowOpenSize: O(({ input: e3 }) => [S("div", Zn, [R($, A(d(e3)), null, 16), S("div", Qn, [(v(!0), w(T, null, M(e3.items, (e4, t4) => (v(), j(l2, { key: e4.name }, { default: O(() => [R(o2, { class: "text-3.5" }, { default: O(() => [y(E(t4 === 0 ? D(B)("\u5BBD") : D(B)("\u9AD8")), 1)]), _: 2 }, 1024), R(Z, g({ ref_for: !0 }, e4, { modelValue: e4.value, "onUpdate:modelValue": (t5) => e4.value = t5, class: "!w-25" }), null, 16, ["modelValue", "onUpdate:modelValue"])]), _: 2 }, 1024))), 128))])])]), windowRatioPosition: O(({ input: e3 }) => [S("div", $n, [R($, A(d(e3)), null, 16), R(ht, { modelValue: e3.value, "onUpdate:modelValue": (t4) => e3.value = t4 }, null, 8, ["modelValue", "onUpdate:modelValue"])])]), forbiddenPictureSize: O(({ input: e3 }) => [S("div", er, [R($, A(d(e3)), null, 16), S("div", null, [S("div", tr, E(D(B)("\u7981\u6B62\u52A0\u8F7D\u8D85\u8FC7\u4EE5\u4E0B\u5927\u5C0F\u7684\u56FE\u7247\uFF08\u5982\u679C\u8BBE\u7F6E\u4E3A0\u5219\u4E0D\u52A0\u8F7D\u4EFB\u4F55\u56FE\u7247\uFF0C\u4E3A\u907F\u514D\u65E0\u6CD5\u663E\u793A\u9A8C\u8BC1\u7801\uFF0C\u5EFA\u8BAE\u586B\u519910KB\uFF09")), 1), S("div", nr, [R(p2, null, { default: O(() => [R(u2, { modelValue: e3.value, "onUpdate:modelValue": (t4) => e3.value = t4, "input-class": "w-full !pr-[28px]", size: "small" }, null, 8, ["modelValue", "onUpdate:modelValue"]), R(f2, { class: "tip-text" }, { default: O(() => [...n2[0] ||= [y(" KB ", -1)]]), _: 1 })]), _: 2 }, 1024)])])])]), _: 1 }, 8, ["class", "inputs"])) : k("", !0);
  };
} }), [["__scopeId", "data-v-db7e1133"]]);
var ir = { class: "flex-ovh-1 min-h-0 min-w-0 w-full flex-col" };
var ar = { key: 0, class: "content min-h-0 min-w-0 flex-1 overflow-y-auto pb-4" };
var or = { class: "flex items-center gap-3 header" };
var sr = { class: "inline-flex items-center gap-1" };
var cr = { class: "flex flex-col gap-4" };
var lr = q(c({ __name: "accordion-inputs", props: { accordions: {}, inputsGroup: { default: () => [] } }, setup(e2) {
  let t2 = e2, n2 = b(() => t2.accordions?.panels.filter((e3) => e3.placement === "outside") ?? []), r2 = b(() => t2.accordions?.panels.filter((e3) => e3.placement === "accordion") ?? []);
  function i2(e3) {
    return [e3.groupIndex, ...e3.extraGroupIndexes ?? []];
  }
  return (e3, a2) => {
    let o2 = K, s2 = We, c2 = He, l2 = Ue, u2 = Ge, d2 = pe;
    return v(), w("div", ir, [t2.accordions ? (v(), w("div", ar, [m(e3.$slots, "before", {}, void 0, !0), (v(!0), w(T, null, M(D(n2), (e4) => (v(), j(rr, { key: e4.value, class: "px-4", inputs: t2.inputsGroup[e4.groupIndex], "inputs-group": t2.inputsGroup, variant: e4.variant, "excluded-fields": e4.excludedFields }, null, 8, ["inputs", "inputs-group", "variant", "excluded-fields"]))), 128)), R(u2, { value: t2.accordions.value, multiple: "" }, { default: O(() => [(v(!0), w(T, null, M(D(r2), (e4) => (v(), j(l2, { key: e4.value, value: e4.value, pt: { root: "!border-dashed" } }, { default: O(() => [R(s2, { as: "div" }, { default: O(({ active: t3 }) => [S("div", or, [R(o2, { class: "header-icon", name: t3 ? "base/rx_ic_minus" : "base/rx_ic_plus", size: "20" }, null, 8, ["name"]), S("span", sr, [S("span", null, E(e4.title), 1), e4.tooltip ? L((v(), j(o2, { key: 0, name: "base/rx_ic_info", size: "14", color: "var(--colors-icon-icon-note)" }, null, 512)), [[d2, { value: e4.tooltip, showDelay: 500 }, void 0, { top: !0 }]]) : k("", !0)])])]), _: 2 }, 1024), R(c2, null, { default: O(() => [S("div", cr, [(v(!0), w(T, null, M(i2(e4), (n3, r3) => (v(), j(rr, { key: `${e4.value}-${n3}`, inputs: t2.inputsGroup[n3], "inputs-group": t2.inputsGroup, variant: r3 === 0 ? e4.variant : "settings", "excluded-fields": r3 === 0 ? e4.excludedFields : void 0 }, null, 8, ["inputs", "inputs-group", "variant", "excluded-fields"]))), 128))])]), _: 2 }, 1024)]), _: 2 }, 1032, ["value"]))), 128))]), _: 1 }, 8, ["value"])])) : k("", !0)]);
  };
} }), [["__scopeId", "data-v-0bfa514c"]]);
function ur() {
  let e2 = _(0), t2 = b(() => e2.value === 0);
  async function n2(t3) {
    e2.value++;
    try {
      return await t3();
    } finally {
      e2.value--;
    }
  }
  function r2() {
    return t2.value ? Promise.resolve() : new Promise((e3) => {
      let n3 = F(t2, (t3) => {
        t3 && (n3(), e3());
      });
    });
  }
  return { pending: e2, isReady: t2, run: n2, waitUntilReady: r2 };
}
export {vt as a,Lt as i,lr as n,yt as o,Jt as r,gt as s,ur as t};