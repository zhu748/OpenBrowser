import {mt as e} from "./utils-BIWenCnY.js";
import {C as t,St as n,V as r,W as i,Z as a,_t as o,b as s,d as c,f as l,h as u,i as d,in as f,jt as p,lt as m,m as h,p as g,q as _,rn as v,st as y,vt as b,x} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as S} from "./usetoast-DphSlejX.js";
import {y as C} from "./rich-html-link-VdBpR3Cm.js";
import {n as w} from "./workspace-CNvgSgaH.js";
import {t as T} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as E} from "./rx-button-DyzuUt-V.js";
import {t as D} from "./rx-checkbox-BrC0MzoD.js";
import {t as O} from "./inputnumber-BD6BwCgc.js";
import {t as k} from "./radiobutton-B3i1EP5M.js";
import {t as A} from "./textarea-DvuriTzI.js";
import {a as ee,i as j,n as M,r as N,t as P} from "./tab-6bJNMvq4.js";
import {t as F} from "./rx-input-number-EcSY6ALQ.js";
import {t as I} from "./base-dialog-Bet1oNF8.js";
var L = t({ __name: "same-text", setup(e2, { expose: t2 }) {
  let r2 = n("");
  return t2({ get formData() {
    return r2.value;
  } }), (e3, t3) => {
    let n2 = A;
    return i(), g(n2, { modelValue: p(r2), "onUpdate:modelValue": t3[0] ||= (e4) => o(r2) ? r2.value = e4 : null, rows: "7", placeholder: e3.$t("\u8BF7\u5728\u6B64\u8F93\u5165\u5185\u5BB9"), class: "w-full text-3.5 placeholder:text-3.5" }, null, 8, ["modelValue", "placeholder"]);
  };
} });
var R = { class: "diff-text" };
var z = { class: "form-item-label" };
var B = { class: "profile-name" };
var V = { class: "profile-num" };
var H = { class: "form-item-content" };
var U = T(t({ __name: "diff-text", props: { syncWindows: { type: Array, default: () => [] } }, setup(t2, { expose: a2 }) {
  let o2 = t2, s2 = e(), m2 = n({}), h2 = n([]), g2 = n(0), b2 = c(() => w(s2.currentWorkspace?.workspaceName));
  return y(() => o2.syncWindows, (e2) => {
    e2.forEach((e3) => {
      m2.value[e3.dirId] ||= "";
    });
  }, { immediate: !0 }), a2({ get formData() {
    return o2.syncWindows.reduce((e2, t3) => (m2.value[t3.dirId] && (e2[t3.$pId] = m2.value[t3.dirId]), e2), {});
  } }), r(() => {
    let e2 = 0;
    h2.value.forEach((t3) => {
      let n2 = t3.getBoundingClientRect();
      e2 < n2.width && (e2 = n2.width);
    }), g2.value = Math.ceil(e2);
  }), (e2, n2) => {
    let r2 = A;
    return i(), u("div", R, [(i(!0), u(d, null, _(t2.syncWindows, (t3) => (i(), u("div", { key: t3.dirId, class: "form-item" }, [l("div", z, [l("label", { for: "diff-text", ref_for: !0, ref_key: "labelList", ref: h2, style: v({ width: `${p(g2)}px` }) }, [l("span", B, f(p(b2)) + "-", 1), l("span", V, f(t3.windowSortNum), 1)], 4)]), l("div", H, [x(r2, { modelValue: p(m2)[t3.dirId], "onUpdate:modelValue": (e3) => p(m2)[t3.dirId] = e3, class: "textarea", rows: "1", autoResize: "", placeholder: e2.$t("\u8BF7\u5728\u6B64\u8F93\u5165\u5185\u5BB9\uFF0C\u652F\u6301\u6362\u884C") }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder"])])]))), 128))]);
  };
} }), [["__scopeId", "data-v-bd8c7b9a"]]);
var W = { class: "random-text" };
var G = { class: "form-item" };
var K = { class: "form-item-label" };
var te = { class: "form-item-content" };
var q = { class: "flex flex-wrap gap-4" };
var J = { class: "flex items-center gap-2" };
var Y = { for: "int" };
var X = { class: "flex items-center gap-2" };
var Z = { for: "float" };
var Q = { key: 0, class: "form-item" };
var ne = { class: "form-item-label" };
var $ = { class: "form-item-content" };
var re = { class: "form-item" };
var ie = { class: "form-item-label" };
var ae = { class: "form-item-content" };
var oe = { class: "input-number-row" };
var se = T(t({ __name: "random-text", setup(e2, { expose: t2 }) {
  let r2 = n({ min: 0, max: 10, data_type: "int", decimal_place_count: 1 });
  return y(() => r2.value.min, () => {
    r2.value.min >= r2.value.max && (r2.value.max = r2.value.min + 1);
  }), y(() => r2.value.max, () => {
    r2.value.max <= r2.value.min && (r2.value.max = r2.value.max + 1);
  }), t2({ get formData() {
    let e3 = { ...r2.value };
    return e3.min = String(e3.min), e3.max = String(e3.max), e3;
  } }), (e3, t3) => {
    let n2 = k, a2 = O;
    return i(), u("div", W, [l("div", G, [l("label", K, f(e3.$t("\u6570\u503C\u7C7B\u578B")), 1), l("div", te, [l("div", q, [l("div", J, [x(n2, { modelValue: p(r2).data_type, "onUpdate:modelValue": t3[0] ||= (e4) => p(r2).data_type = e4, "input-id": "int", name: "type", value: "int" }, null, 8, ["modelValue"]), l("label", Y, f(e3.$t("\u6574\u6570")), 1)]), l("div", X, [x(n2, { modelValue: p(r2).data_type, "onUpdate:modelValue": t3[1] ||= (e4) => p(r2).data_type = e4, "input-id": "float", name: "type", value: "float" }, null, 8, ["modelValue"]), l("label", Z, f(e3.$t("\u5C0F\u6570")), 1)])])])]), p(r2).data_type === "float" ? (i(), u("div", Q, [l("label", ne, f(e3.$t("\u5C0F\u6570\u70B9\u540E\u4F4D\u6570")), 1), l("div", $, [x(p(F), { modelValue: p(r2).decimal_place_count, "onUpdate:modelValue": t3[2] ||= (e4) => p(r2).decimal_place_count = e4, max: 10, min: 1, class: "!w-120px" }, null, 8, ["modelValue"])])])) : h("", !0), l("div", re, [l("label", ie, f(e3.$t("\u6570\u5B57\u8303\u56F4")), 1), l("div", ae, [l("div", oe, [x(a2, { modelValue: p(r2).min, "onUpdate:modelValue": t3[3] ||= (e4) => p(r2).min = e4, "use-grouping": !1, fluid: "", size: "small" }, null, 8, ["modelValue"]), t3[5] ||= l("div", { class: "gap-line" }, null, -1), x(a2, { modelValue: p(r2).max, "onUpdate:modelValue": t3[4] ||= (e4) => p(r2).max = e4, "use-grouping": !1, fluid: "", size: "small" }, null, 8, ["modelValue"])])])])]);
  };
} }), [["__scopeId", "data-v-75610312"]]);
var ce = { class: "footer" };
var le = { class: "flex items-center gap-2" };
var ue = { for: "append" };
var de = T(t({ __name: "batch-inputs", setup(e2) {
  let t2 = S(), c2 = C(), h2 = 0, v2 = n({}), w2 = n([]), T2 = n(!0), O2 = n([{ id: "same", label: $t("\u76F8\u540C\u6587\u672C"), component: b(L) }, { id: "diff", label: $t("\u5DEE\u5F02\u6587\u672C"), component: b(U) }, { id: "random", label: $t("\u968F\u673A\u6570\u5B57"), component: b(se) }]), k2 = O2.value.find((e3) => e3.id === c2.query.tab)?.id || O2.value[0].id, A2 = n(k2);
  y(A2, (e3) => {
    e3 === "diff" ? globalThis.electronAPI.send("syncControl:resizeBatchInputsDialog", { width: 480, height: Math.min(60 * h2 + 220, 660) }) : e3 === "random" ? globalThis.electronAPI.send("syncControl:resizeBatchInputsDialog", { width: 480, height: 340 }) : globalThis.electronAPI.send("syncControl:resizeBatchInputsDialog", { width: 480, height: 366 });
  }, { immediate: !0 });
  function F2() {
    globalThis.electronAPI.send("syncControl:closeBatchInputsDialog");
  }
  async function R2(e3) {
    console.log("startBatchInputs", e3, v2.value[e3.id]);
    let n2 = { mode: e3.id, data: v2.value[e3.id].formData, append: T2.value };
    if (n2.mode === "same" && n2.data?.trim() === "") {
      t2.add({ severity: "warn", summary: $t("\u64CD\u4F5C\u5931\u8D25"), detail: $t("\u8BF7\u8F93\u5165\u6587\u672C"), life: 1500 });
      return;
    }
    console.log("startBatchInputs params", n2);
    let r2;
    try {
      r2 = await globalThis.electronAPI.send("syncControl:batchInputText", n2);
    } catch (error) {
      t2.add({ severity: "error", summary: error.message, life: 5e3 });
      return;
    }
    console.log("startBatchInputs result", r2);
  }
  async function z2() {
    w2.value = await globalThis.electronAPI.send("syncControl:getAllSyncingWindows"), h2 = w2.value.length, console.log("syncWindows.value", w2.value);
  }
  return globalThis.electronAPI.on("browser:on-close", (e3) => {
    z2();
  }), r(() => {
    z2();
  }), (e3, t3) => {
    let n2 = P, r2 = M, c3 = D, h3 = E, y2 = N, b2 = j, S2 = ee;
    return i(), g(I, { header: e3.$t("\u6279\u91CF\u8F93\u5165"), onHide: F2 }, { default: m(() => [x(S2, { value: p(A2), "onUpdate:value": t3[1] ||= (e4) => o(A2) ? A2.value = e4 : null }, { default: m(() => [x(r2, { pt: { root: "overflow-visible!" } }, { default: m(() => [(i(!0), u(d, null, _(p(O2), (e4) => (i(), g(n2, { key: e4.id, value: e4.id }, { default: m(() => [s(f(e4.label), 1)]), _: 2 }, 1032, ["value"]))), 128))]), _: 1 }), x(b2, null, { default: m(() => [(i(!0), u(d, null, _(p(O2), (n3) => (i(), g(y2, { key: n3.id, value: n3.id }, { default: m(() => [(i(), g(a(n3.component), { ref_for: !0, ref: (e4) => p(v2)[n3.id] = e4, "sync-windows": p(w2) }, null, 8, ["sync-windows"])), l("div", ce, [l("div", le, [x(c3, { modelValue: p(T2), "onUpdate:modelValue": t3[0] ||= (e4) => o(T2) ? T2.value = e4 : null, "input-id": "append", binary: "", size: "small", "true-value": !1, "false-value": !0 }, null, 8, ["modelValue"]), l("label", ue, f(e3.$t("\u8F93\u5165\u524D\u6E05\u7A7A\u5185\u5BB9")), 1)]), x(h3, { class: "save-button", onClick: (e4) => R2(n3) }, { default: m(() => [s(f(e3.$t("\u8F93\u5165")), 1)]), _: 1 }, 8, ["onClick"])])]), _: 2 }, 1032, ["value"]))), 128))]), _: 1 })]), _: 1 }, 8, ["value"])]), _: 1 }, 8, ["header"]);
  };
} }), [["__scopeId", "data-v-8b8b3f9e"]]);
export {de as default};