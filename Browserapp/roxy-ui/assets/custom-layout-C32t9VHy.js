import {C as e,St as t,W as n,b as r,f as i,h as a,i as o,in as s,jt as c,lt as l,m as u,rt as d,ut as f,x as p} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as m} from "./basecomponent-ClhuVxJN.js";
import {t as h} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as g} from "./tooltip-BYYKWrvu.js";
import {t as _} from "./inputnumber-BD6BwCgc.js";
import {n as v,t as y} from "./inputicon-Bn1KerIx.js";
var b = { class: "custom-layout" };
var x = { class: "form-item" };
var S = { class: "form-item-label" };
var C = { class: "form-item-content" };
var w = { class: "input-number-row" };
var T = { class: "form-item" };
var E = { class: "form-item-label" };
var D = { class: "form-item-content" };
var O = { class: "input-number-row" };
var k = { class: "form-item" };
var A = { class: "form-item-label" };
var j = { class: "form-item-content flex items-center gap-[12px]" };
var M = h(e({ __name: "custom-layout", props: { modelValue: { required: !0 }, modelModifiers: {} }, emits: ["update:modelValue"], setup(e2) {
  let h2 = d(e2, "modelValue");
  return t([{ label: $t("\u5BAB\u683C"), value: "grid" }, { label: $t("\u5806\u53E0"), value: "stack" }, { label: $t("\u81EA\u5B9A\u4E49"), value: "custom" }]), t([]), globalThis.electronAPI.send("syncControl:getMainControlBrowserSize").then((e3) => {
    h2.value.w ||= e3?.width || 0, h2.value.h ||= e3?.height || 0;
  }), (e3, t2) => {
    let d2 = y, M2 = _, N = v, P = g;
    return n(), a("div", b, [u("", !0), u("", !0), h2.value.type === "custom" ? (n(), a(o, { key: 2 }, [u("", !0), i("div", x, [i("label", S, s(e3.$t("\u7A97\u53E3\u5927\u5C0F")), 1), i("div", C, [i("div", w, [p(N, null, { default: l(() => [p(d2, { class: "prefix" }, { default: l(() => [...t2[7] ||= [r(" W ", -1)]]), _: 1 }), f(p(M2, { modelValue: h2.value.w, "onUpdate:modelValue": t2[2] ||= (e4) => h2.value.w = e4, fluid: "", size: "small", min: 0, useGrouping: !1 }, null, 8, ["modelValue"]), [[P, e3.$t("\u5BBD\u5EA6"), void 0, { top: !0 }]])]), _: 1 }), p(N, null, { default: l(() => [p(d2, { class: "prefix" }, { default: l(() => [...t2[8] ||= [r(" H ", -1)]]), _: 1 }), f(p(M2, { modelValue: h2.value.h, "onUpdate:modelValue": t2[3] ||= (e4) => h2.value.h = e4, fluid: "", size: "small", min: 0, useGrouping: !1 }, null, 8, ["modelValue"]), [[P, e3.$t("\u9AD8\u5EA6"), void 0, { top: !0 }]])]), _: 1 })])])]), i("div", T, [i("label", E, s(e3.$t("\u7A97\u53E3\u95F4\u8DDD")), 1), i("div", D, [i("div", O, [p(N, null, { default: l(() => [p(d2, { class: "prefix" }, { default: l(() => [p(c(m), { name: "base/rx_ic_gap_h", size: "14px" })]), _: 1 }), f(p(M2, { modelValue: h2.value.gap_horizontal, "onUpdate:modelValue": t2[4] ||= (e4) => h2.value.gap_horizontal = e4, min: 0, useGrouping: !1, fluid: "", size: "small" }, null, 8, ["modelValue"]), [[P, e3.$t("\u6C34\u5E73\u95F4\u8DDD"), void 0, { top: !0 }]])]), _: 1 }), p(N, null, { default: l(() => [p(d2, { class: "prefix" }, { default: l(() => [p(c(m), { name: "base/rx_ic_gap_v", size: "14px" })]), _: 1 }), f(p(M2, { modelValue: h2.value.gap_vertical, "onUpdate:modelValue": t2[5] ||= (e4) => h2.value.gap_vertical = e4, min: 0, useGrouping: !1, fluid: "", size: "small" }, null, 8, ["modelValue"]), [[P, e3.$t("\u5782\u76F4\u95F4\u8DDD"), void 0, { top: !0 }]])]), _: 1 })])])]), i("div", k, [i("label", A, s(e3.$t("\u6BCF\u884C\u6570\u91CF")), 1), i("div", j, [p(M2, { modelValue: h2.value.count_per_row, "onUpdate:modelValue": t2[6] ||= (e4) => h2.value.count_per_row = e4, class: "!w-[120px]", min: 1, max: 1e3, fluid: "", size: "small" }, null, 8, ["modelValue"]), i("span", null, s(e3.$t("\u4E2A/\u6BCF\u884C")), 1)])])], 64)) : u("", !0)]);
  };
} }), [["__scopeId", "data-v-ed2619d1"]]);
export {M as t};