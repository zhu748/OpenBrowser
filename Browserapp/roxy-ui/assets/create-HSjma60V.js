import {Or as e,a as n,cr as r,h as i,hr as a,i as o,kr as s,m as c,mt as l,nn as u,qt as f,s as p,sn as m,u as h,v as g,vt as _,wt as v,yt as y} from "./utils-BIWenCnY.js";
import {C as b,Et as S,F as C,L as w,N as T,St as E,W as D,Y as O,_t as k,b as A,bt as j,d as M,en as N,f as P,h as F,i as ee,in as I,jt as L,lt as R,m as z,p as B,q as te,rt as V,st as ne,ut as H,x as U} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as W} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as ie,n as ae} from "./agent-BmSFI9WH.js";
import {b as oe,y as ce} from "./rich-html-link-VdBpR3Cm.js";
import {Z as le} from "./basecomponent-ClhuVxJN.js";
import {t as G} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as ue} from "./useconfirm-CV4GTWBW.js";
import {t as de} from "./tooltip-BYYKWrvu.js";
import {t as K} from "./rx-button-DyzuUt-V.js";
import {P as fe,o as q,u as me,w as he} from "./hook-CnJE4hRq.js";
import {n as ge} from "./m-input-select-C8pih1gY.js";
import {t as _e} from "./rx-alert-A_y5uvgP.js";
import {t as J} from "./useDialog-BC-nc8J-.js";
import {t as ve} from "./usePopupMenu-BRw1zJ0m.js";
import {n as ye,t as be} from "./tab-6bJNMvq4.js";
import {t as xe} from "./rx-tabs-Dp-8mudX.js";
import {t as Se} from "./simplePopup-D6H7ykCr.js";
import {i as Ce} from "./quick-kroUOSn_.js";
import {c as we,i as Te,n as Ee,o as Y,s as De,t as X} from "./utils-CnUy4XUk.js";
import {t as Oe} from "./account-2bDq0W_G.js";
import {t as ke} from "./rx-input-number-EcSY6ALQ.js";
import {t as Ae} from "./views-header-CcjwXPjG.js";
import {n as je,t as Z} from "./constants-DLlGaEfk.js";
import {a as Me,n as Ne} from "./useAsyncGate-D7VA7DLY.js";
import {i as Pe,n as Fe,r as Q,t as Ie} from "./createDefaultAccordions-CO1KkbkO.js";
import {t as Re} from "./form-inputs-CnnG6T0O.js";
import {t as ze} from "./useWindowCreateCore-01alf0RN.js";
import {t as $} from "./mate-group-CBm6kY0g.js";
var Be = { class: "relative flex min-h-0 flex-1 flex-col overflow-hidden" };
var Ve = { class: "px-16 flex flex-1 min-h-0 overflow-hidden overflow-x-auto" };
var He = { class: "flex min-h-0 min-w-0 flex-1 flex-col" };
var Ue = { class: "footer flex shrink-0 items-center justify-end gap-2 px-4 py-4 min-h-16" };
var We = G(b({ __name: "single-create", props: { shared: {} }, setup(e2) {
  let t2 = e2, [n2] = J(), r2 = E(Fe()), { collapsed: i2, inputsGroup: a2, previewInputs: o2, isBatch: s2, createCount: c2, shuffleFingerprint: l2, choosePreset: u2, profileTemplate: d2, showTemplates: f2, metaData: p2, items: m2, saveTemplatePopup: h2, canSubmit: g2, loading: _2, formGate: v2, clearDriver: y2, buildCreateParams: b2, presetTemplate: C2, executeSingleCreate: w2, onBack: T2, workspaceStore: O2, userStore: A2 } = t2.shared, j2 = M(() => a2.value?.[0] ?? []);
  async function ee2(e3) {
    return await v2.waitUntilReady(), y2(), I2(b2({ inputs: a2.value, metadata: p2.value, createCount: c2.value }), e3);
  }
  function I2(e3, t3) {
    return z2(e3, t3);
  }
  async function z2(e3, t3) {
    return w2({ params: e3, onSuccess: (e4) => {
      T2(e4, t3);
    } });
  }
  return (e3, t3) => {
    let n3 = q, v3 = de;
    return D(), F("div", Be, [P("div", Ve, [P("div", { class: N(["w-full h-full flex min-h-0 gap-8 ma-auto", [L(i2) ? "min-w-192 max-w-192" : "min-w-240 max-w-285"]]) }, [P("div", He, [U(Ne, { class: "flex-1 min-h-0", accordions: L(r2), "inputs-group": L(a2) }, { before: R(() => [U(Pe, { "window-inputs": L(j2), "show-template": "", "template-label": L(d2).label, onShowTemplates: L(f2) }, null, 8, ["window-inputs", "template-label", "onShowTemplates"])]), _: 1 }, 8, ["accordions", "inputs-group"]), P("div", Ue, [U($, { modelValue: L(p2), "onUpdate:modelValue": t3[0] ||= (e4) => k(p2) ? p2.value = e4 : null, class: "flex-1" }, null, 8, ["modelValue"]), U(n3, { severity: "secondary", label: e3.$t("\u5B58\u4E3A\u65B0\u6A21\u677F"), model: L(m2), onClick: t3[1] ||= W((e4) => L(h2)(e4), ["stop"]) }, null, 8, ["label", "model"]), H(U(L(K), { class: "guide2", label: e3.$t("\u521B\u5EFA\u7A97\u53E3"), disabled: !L(g2), loading: L(_2), onClick: t3[2] ||= W((e4) => ee2(!1), ["stop"]) }, null, 8, ["label", "disabled", "loading"]), [[v3, L(g2) ? "" : e3.$t("\u6B63\u5728\u751F\u6210\u65B0\u6307\u7EB9\uFF0C\u8BF7\u7A0D\u540E"), void 0, { top: !0 }]])])]), U(Q, { collapsed: L(i2), "onUpdate:collapsed": t3[3] ||= (e4) => k(i2) ? i2.value = e4 : null, "inputs-group": L(o2), "is-batch": L(s2), "create-count": L(c2), "is-import": !1, "on-shuffle": L(l2), "choose-preset": L(u2) }, null, 8, ["collapsed", "inputs-group", "is-batch", "create-count", "on-shuffle", "choose-preset"])], 2)])]);
  };
} }), [["__scopeId", "data-v-80df20fe"]]);
var Ge = { class: "relative flex min-h-0 flex-1 flex-col overflow-hidden" };
var Ke = { class: "px-16 flex flex-1 min-h-0 overflow-hidden overflow-x-auto" };
var qe = { class: "flex min-h-0 min-w-0 flex-1 flex-col" };
var Je = { class: "mx-4 py-4 multiple" };
var Ye = { class: "flex items-start justify-between" };
var Xe = { class: "subtitle h-8 flex items-center" };
var Ze = { class: "batch-count" };
var Qe = { class: "select-none multiple-tip" };
var $e = { class: "flex items-center justify-between px-4 py-4" };
var et = { class: "subtitle" };
var tt = { class: "footer flex shrink-0 items-center justify-end gap-2 px-4 py-4 min-h-16" };
var nt = G(b({ __name: "batch-create", props: { shared: {} }, setup(e2) {
  let t2 = e2, [, r2] = ae(), a2 = E(Ie()), { collapsed: o2, inputsGroup: s2, previewInputs: c2, isBatch: l2, createCount: u2, maxWindowCount: d2, shuffleFingerprint: f2, choosePreset: p2, profileTemplate: m2, showTemplates: h2, metaData: g2, items: _2, saveTemplatePopup: v2, canSubmit: y2, loading: b2, formGate: x2, clearDriver: S2, prepareCreateParams: C2, onBack: w2, workspaceStore: T2, userStore: O2 } = t2.shared;
  async function A2() {
    return await x2.waitUntilReady(), S2(), j2(await C2({ inputs: s2.value, metadata: g2.value, createCount: u2.value }));
  }
  async function j2(e3) {
    let { createCount: t3, platformBindType: a3, _custom_ua: o3 } = e3, l3 = Array.isArray(e3.proxyInfoList) ? e3.proxyInfoList : [], u3 = Array.isArray(e3.windowPlatformList) ? e3.windowPlatformList : [], d3 = Array.isArray(e3.platformUrlIds) ? e3.platformUrlIds : [], f3 = t3 - l3.length;
    if (f3 < 0) {
      r2(-1, $t("\u4EE3\u7406 IP \u6570\u91CF\u4E0D\u80FD\u5927\u4E8E\u7A97\u53E3"));
      return;
    }
    let p3 = t3 - u3.length - d3.length;
    if (a3 === Oe.Order && p3 < 0) {
      r2(-1, $t("\u8D26\u53F7\u6570\u91CF\u4E0D\u80FD\u5927\u4E8E\u7A97\u53E3"));
      return;
    }
    let m3 = Ce(n(s2.value[0] ?? [], "windowName"));
    m3 && !Y(e3.windowName) && !Y(e3.windowNamePrefix) && (e3.windowNamePrefix = m3, e3.windowName = m3), b2.value = !0;
    let h3 = await Re(c2.value, { count: e3.createCount, preview: !1 });
    e3.proxyInfoList = l3.concat(Array.from({ length: f3 }).fill({ id: 0, proxyCategory: "noproxy" })), e3.fingerDetail = h3.map(({ userAgent: t4, webGLManufacturer: n2, webGLRender: r3, ...i2 }) => ({ ...i2, userAgent: o3 ? e3.userAgent : t4, webGLManufacturer: e3.webGLInfo === 2 ? e3.webGLManufacturer : n2, webGLRender: e3.webGLInfo === 2 ? e3.webGLRender : r3 }));
    let { code: g3, msg: _3 } = await i.window.userBatchWindowInfoV2Create(e3);
    b2.value = !1, r2(g3, _3), g3 === 0 && w2();
  }
  return (e3, t3) => {
    let n2 = q, r3 = de;
    return D(), F("div", Ge, [P("div", Ke, [P("div", { class: N(["w-full h-full flex min-h-0 gap-8 ma-auto", [L(o2) ? "min-w-192 max-w-192" : "min-w-240 max-w-285"]]) }, [P("div", qe, [P("div", Je, [P("div", Ye, [P("div", Xe, I(e3.$t("\u7A97\u53E3\u6570\u91CF")), 1), P("div", Ze, [U(L(ke), { modelValue: L(u2), "onUpdate:modelValue": t3[0] ||= (e4) => k(u2) ? u2.value = e4 : null, min: 1, step: 1, max: L(d2) }, null, 8, ["modelValue", "max"]), P("div", Qe, " * " + I(e3.$t("\u6700\u591A\u4E00\u6B21\u53EF\u6279\u91CF\u521B\u5EFA {maxWindowCount} \u4E2A", { maxWindowCount: L(d2) })), 1)])])]), U(Ne, { class: "flex-1 min-h-0", accordions: L(a2), "inputs-group": L(s2) }, { before: R(() => [P("div", $e, [P("div", et, I(e3.$t("\u7A97\u53E3\u4FE1\u606F")), 1), U(L(K), { text: "", severity: "secondary", icon: "base/rx_ic_template", label: L(m2).label, onClick: t3[1] ||= W((e4) => L(h2)(e4), ["stop"]) }, null, 8, ["label"])])]), _: 1 }, 8, ["accordions", "inputs-group"]), P("div", tt, [U($, { modelValue: L(g2), "onUpdate:modelValue": t3[2] ||= (e4) => k(g2) ? g2.value = e4 : null, class: "flex-1" }, null, 8, ["modelValue"]), U(n2, { severity: "secondary", label: e3.$t("\u5B58\u4E3A\u65B0\u6A21\u677F"), model: L(_2), onClick: t3[3] ||= W((e4) => L(v2)(e4), ["stop"]) }, null, 8, ["label", "model"]), H(U(L(K), { class: "guide2", label: e3.$t("\u521B\u5EFA\u7A97\u53E3"), disabled: !L(y2), loading: L(b2), onClick: t3[4] ||= W((e4) => A2(), ["stop"]) }, null, 8, ["label", "disabled", "loading"]), [[r3, L(y2) ? "" : e3.$t("\u6B63\u5728\u751F\u6210\u65B0\u6307\u7EB9\uFF0C\u8BF7\u7A0D\u540E"), void 0, { top: !0 }]])])]), U(Q, { collapsed: L(o2), "onUpdate:collapsed": t3[5] ||= (e4) => k(o2) ? o2.value = e4 : null, "inputs-group": L(c2), "is-batch": L(l2), "create-count": L(u2), "is-import": !1, "on-shuffle": L(f2), "choose-preset": L(p2) }, null, 8, ["collapsed", "inputs-group", "is-batch", "create-count", "on-shuffle", "choose-preset"])], 2)])]);
  };
} }), [["__scopeId", "data-v-e8821cb5"]]);
var rt = { class: "flex flex-col gap-3" };
var it = { class: "whitespace-pre-wrap" };
var at = { key: 2, class: "pa-4 rounded-xl file" };
var ot = { class: "flex items-center gap-3" };
var st = { class: "flex-1 file-name" };
var ct = { class: "px-9 file-size" };
var lt = { class: "pa-4 rounded-xl upload" };
var ut = { class: "text-center" };
var dt = { key: 0, class: "mb-1.5 upload-title" };
var ft = { class: "w-60 mx-auto upload-desc" };
var pt = { class: "help" };
var mt = 5242880;
var ht = G(b({ __name: "import-window", props: { error: {}, errorModifiers: {} }, emits: T(["importSuccess"], ["update:error"]), setup(e2, { emit: t2 }) {
  let n2 = t2, { showMenu: r2 } = ve(), [o2, s2] = ae(), c2 = g(), l2 = Object.freeze({ ...Z, ...je }), u2 = V(e2, "error"), d2 = { xlsx: "base/rx_ic_file_xls", txt: "base/rx_ic_file_txt" }, f2 = j({ status: !1, icon: "", name: "", size: "", successCount: 0 }), p2 = M(() => 200);
  function m2(e3) {
    e3.preventDefault();
  }
  function h2(e3) {
    e3.preventDefault();
    let t3 = e3.dataTransfer.files[0];
    !t3 || !Object.keys(l2).includes(t3.type) ? s2(-1, $t("\u4EC5\u652F\u6301Excel\u7C7B\u578B\u6587\u4EF6")) : v2(t3);
  }
  async function _2() {
    try {
      const selected = await globalThis.__localRequest("profiles:choose-import");
      selected && await v2(new File([selected.bytes], selected.name, { type: selected.type }));
    } catch (error) {
      s2(-1, error.message);
    }
  }
  async function v2(e3) {
    if (e3) {
      if (e3.size > mt) {
        s2(-1, $t("\u6587\u4EF6\u5927\u5C0F\u4E0D\u80FD\u8D85\u8FC7 5MB"));
        return;
      }
      u2.value = null;
      try {
        const name = e3.name, rows = a(name) === "txt" ? await we(e3) : await De(e3);
        if (!rows.length) throw Error($t("\u5BFC\u5165\u7684\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A"));
        const params = { fileName: name, excelData: rows }, { code, msg } = await i.window.userAnalysisWindowInfoCreate(params);
        if (code !== 0) throw Error(Array.isArray(msg) ? msg.join(`
`) : msg);
        Object.assign(f2, { status: !0, icon: d2[a(name)], name, size: (e3.size / 1024 / 1024).toFixed(2) + " MB", successCount: rows.length }), n2("importSuccess", params);
      } catch (error) {
        f2.status = !1, u2.value = error.message;
      }
    }
  }
  function y2(e3) {
    r2(e3, { model: [{ label: $t("{type} \u6A21\u677F", { type: "excel" }), command: () => {
      X();
    } }, { label: $t("{type} \u6A21\u677F", { type: "txt" }), command: () => {
      Ee();
    } }] });
  }
  return (e3, t3) => {
    let n3 = le, r3 = K, i2 = O("i18n-t");
    return D(), F("div", rt, [L(f2).status && !u2.value ? (D(), B(L(_e), { key: 0, class: "w-full", type: "success", title: e3.$t("{count} \u4E2A\u7A97\u53E3\u5DF2\u6210\u529F\u5BFC\u5165", { count: L(f2).successCount }), closable: !1 }, null, 8, ["title"])) : z("", !0), u2.value ? (D(), B(L(_e), { key: 1, class: "w-full", type: "error", onClose: t3[0] ||= (e4) => u2.value = null }, { content: R(() => [P("div", it, I(u2.value), 1)]), _: 1 })) : z("", !0), L(f2).name ? (D(), F("div", at, [P("div", ot, [U(n3, { class: "font-size-6", name: L(f2).icon, color: "var(--colors-icon-icon-success)" }, null, 8, ["name"]), P("span", st, I(L(f2).name), 1), U(n3, { class: "font-size-6", name: "base/rx_ic_check_fill", color: "var(--colors-icon-icon-success)" })]), P("div", ct, I(L(f2).size), 1)])) : z("", !0), P("div", lt, [P("div", { class: "flex flex-col items-center gap-4 py-8 rounded-lg upload-area", onDragover: m2, onDrop: h2 }, [L(f2).name ? z("", !0) : (D(), B(n3, { key: 0, name: "base/rx_ic_doc_fill", size: 48, color: "var(--colors-icon-icon-note)" })), P("div", ut, [L(f2).name ? z("", !0) : (D(), F("div", dt, I(e3.$t("\u8BF7\u62D6\u62FD\u5230\u6B64\u5904\u6216\u70B9\u51FB\u4E0A\u4F20")), 1)), P("div", ft, I(e3.$t("\u8BF7\u5C06\u7F16\u8F91\u597D\u7684\u6587\u4EF6\u5728\u6B64\u5904\u4E0A\u4F20\uFF0C\u4EC5\u652F\u6301 {type} \u7C7B\u578B\u6587\u4EF6, \u6700\u5927\u4E0D\u8D85\u8FC7 5MB.", { type: ".xlsx .txt" })), 1)]), U(r3, { icon: "base/rx_ic_export", label: L(f2).status ? e3.$t("\u91CD\u65B0\u4E0A\u4F20") : e3.$t("\u4E0A\u4F20\u6587\u4EF6"), outlined: "", severity: "secondary", onClick: _2 }, null, 8, ["label"])], 32)]), P("div", pt, [U(i2, { keypath: e3.$t("\u8BF7\u70B9\u51FB\u4E0B\u8F7D {templateFile}\uFF0C\u672C\u6B21\u6700\u591A\u53EF\u5BFC\u5165 {maxCreateWindowCount} \u4E2A\u7A97\u53E3\u3002", { templateFile: "{templateFile}", maxCreateWindowCount: "{maxCreateWindowCount}" }), scope: "global" }, { templateFile: R(() => [P("span", { class: "help-link", onClick: y2 }, I(e3.$t("\u7A97\u53E3\u5BFC\u5165\u6A21\u677F")), 1)]), maxCreateWindowCount: R(() => [A(I(L(p2)), 1)]), _: 1 }, 8, ["keypath"])])]);
  };
} }), [["__scopeId", "data-v-54c87b08"]]);
var gt = { class: "relative flex min-h-0 flex-1 flex-col overflow-hidden" };
var _t = { class: "px-16 flex flex-1 min-h-0 overflow-hidden overflow-x-auto" };
var vt = { class: "flex min-h-0 min-w-0 flex-1 flex-col" };
var yt = { class: "footer flex shrink-0 items-center justify-end gap-2 px-4 py-4 min-h-16" };
var bt = G(b({ __name: "import-create", props: { shared: {} }, setup(e2) {
  let t2 = e2, [n2] = J(), [r2, a2] = ae(), o2 = E(Ie()), s2 = E(), l2 = E(), { collapsed: u2, inputsGroup: d2, previewInputs: m2, isBatch: h2, createCount: g2, shuffleFingerprint: _2, choosePreset: v2, metaData: y2, canSubmit: b2, loading: x2, formGate: S2, clearDriver: C2, prepareCreateParams: w2, onBack: T2, workspaceStore: O2, userStore: A2 } = t2.shared, { currentWorkspace: j2 } = ie(O2);
  function M2(e3) {
    s2.value = e3;
  }
  async function ee2() {
    return await S2.waitUntilReady(), C2(), I2(await w2({ inputs: d2.value, metadata: y2.value, createCount: g2.value }));
  }
  async function I2(e3) {
    if (l2.value) {
      a2(-1, l2.value);
      return;
    }
    if (!s2.value) {
      a2(-1, $t("\u8BF7\u9009\u62E9\u8981\u5BFC\u5165\u7684\u6587\u4EF6\u3002"));
      return;
    }
    x2.value = !0;
    let t3 = z2(), { excelData: n3 } = s2.value, { fontType: o3, canvas: u3, webGL: d3, audioContext: h3, speechVoices: g3, clientRects: _3, macInfo: v3, os: y3, osVersion: b3 } = p(m2.value), S3 = await c(), C3 = S3.coreVersion?.[0]?.value ?? "", w3 = S3.firefoxCoreVersion?.[0]?.value ?? "", E2 = /* @__PURE__ */ new Map();
    n3.forEach((e4, t4) => {
      let n4 = e4.coreType || f.Chrome, r3 = n4 === f.Firefox ? w3 : C3, i2 = e4.coreVersion || r3, a3 = JSON.stringify([e4.os || y3, e4.osVersion || b3, n4, i2]);
      E2.has(a3) || E2.set(a3, { coreType: n4, coreVersion: i2, os: e4.os || y3, osVersion: e4.osVersion || b3, indices: [] }), E2.get(a3).indices.push(t4);
    });
    let D2 = Array.from({ length: n3.length });
    await Promise.all(Array.from(E2.values()).map(async ({ coreType: e4, coreVersion: t4, os: localImportOs, osVersion: localImportOsVersion, indices: n4 }) => {
      let r3 = await globalThis.electronAPI.send("util:genRandomFingerprint", { fontType: o3, canvas: u3, webGL: d3, audioContext: h3, speechVoices: g3, clientRects: _3, macInfo: v3, os: localImportOs, osVersion: localImportOsVersion, coreVersion: t4, coreType: e4 }, n4.length);
      n4.forEach((e5, t5) => {
        D2[e5] = r3[t5];
      });
    })).catch((e4) => (console.error("[ImportCreate] fingerprint generation failed:", e4), x2.value = !1, t3.hideModal(), a2(-1, $t("\u6307\u7EB9\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u8F93\u5165\u7684\u53C2\u6570\u662F\u5426\u6B63\u786E")), Promise.reject(Error("fingerprint generation failed"))));
    let k2 = D2.map(({ webGLManufacturer: t4, webGLRender: n4, ...r3 }) => ({ ...r3, webGLManufacturer: e3.webGLInfo === 2 ? e3.webGLManufacturer : t4, webGLRender: e3.webGLInfo === 2 ? e3.webGLRender : n4 })), { code: M3, msg: N2 } = await i.window.userImportWindowInfoV2Create({ ...e3, ...s2.value, workspaceId: j2.value?.id, fingerDetail: k2 }).catch((error) => ({ code: error.code || -1, msg: error.message }));
    x2.value = !1, t3.hideModal(), M3 === 0 ? (r2(0, N2), T2()) : l2.value = Array.isArray(N2) ? N2.join(`
`) : N2;
  }
  function z2() {
    return n2({ showHeader: !1, modal: !0, blockScroll: !0, closeOnEscape: !1, pt: { root: "!border-none !shadow-none rounded-lg" }, slots: { container: () => U("div", { class: "flex flex-col justify-center items-center gap-6 w-60 h-37" }, [U("div", { class: "relative w-8 h-8" }, [U(ge, { modelValue: !0, opacity: 0.9 }, null)]), U("div", null, [$t("\u521B\u5EFA\u4E2D...")])]) } });
  }
  return (e3, t3) => {
    let n3 = de;
    return D(), F("div", gt, [P("div", _t, [P("div", { class: N(["w-full h-full flex min-h-0 gap-8 ma-auto", [L(u2) ? "min-w-192 max-w-192" : "min-w-240 max-w-285"]]) }, [P("div", vt, [U(Ne, { class: "flex-1 min-h-0", accordions: L(o2), "inputs-group": L(d2) }, { before: R(() => [U(ht, { error: L(l2), "onUpdate:error": t3[0] ||= (e4) => k(l2) ? l2.value = e4 : null, class: "pt-4", onImportSuccess: M2 }, null, 8, ["error"])]), _: 1 }, 8, ["accordions", "inputs-group"]), P("div", yt, [U($, { modelValue: L(y2), "onUpdate:modelValue": t3[1] ||= (e4) => k(y2) ? y2.value = e4 : null, class: "flex-1", "show-remark": !1 }, null, 8, ["modelValue"]), H(U(L(K), { class: "guide2", label: e3.$t("\u521B\u5EFA\u7A97\u53E3"), disabled: !L(b2), loading: L(x2), onClick: t3[2] ||= W((e4) => ee2(), ["stop"]) }, null, 8, ["label", "disabled", "loading"]), [[n3, L(b2) ? "" : e3.$t("\u6B63\u5728\u751F\u6210\u65B0\u6307\u7EB9\uFF0C\u8BF7\u7A0D\u540E"), void 0, { top: !0 }]])])]), U(Q, { collapsed: L(u2), "onUpdate:collapsed": t3[3] ||= (e4) => k(u2) ? u2.value = e4 : null, "inputs-group": L(m2), "is-batch": L(h2), "create-count": L(g2), "is-import": !0, "on-shuffle": L(_2), "choose-preset": L(v2) }, null, 8, ["collapsed", "inputs-group", "is-batch", "create-count", "on-shuffle", "choose-preset"])], 2)])]);
  };
} }), [["__scopeId", "data-v-1f1aed2c"]]);
function xt() {
  let n2 = ce(), a2 = ue(), c2 = oe(), f2 = l(), m2 = g(), b2 = v(), { handleBusinessCode: T2 } = he(), { showSimpleDialog: D2 } = Se(), { showMenu: O2 } = ve(), [, k2] = ae(), { invalidateCache: A2 } = y(), { check: N2 } = u(), P2 = E(!1), F2 = E(1), I2 = E(), L2 = E(), R2 = E(), z2 = !1, B2 = { isBatch: P2, createCount: F2, driverObj: I2, presetTemplate: L2, oneClickSettings: R2, pauseCreateGuide: () => !1, continueCreateGuideAfterBuy: async () => {
  } };
  Me(B2);
  let te2 = [{ title: $t("\u5355\u4E2A\u521B\u5EFA"), value: "single" }, { title: $t("\u6279\u91CF\u521B\u5EFA"), value: "multiple" }, { title: $t("\u7A97\u53E3\u5BFC\u5165"), value: "import" }], V2 = E(te2[0].value), H2 = E([]), G2 = E({ projectName: $t("\u672A\u6307\u5B9A\u9879\u76EE"), projectId: void 0, labelIds: [], windowRemark: "" }), de2 = E(!1), { mainSetting: fe2, extraSettings: q2, loading: me2, formGate: ge2, canSubmit: _e2, initialize: J2, syncMobileVisibility: ye2, updateFingerprint: be2, shuffleFingerprint: xe2, buildCreateParams: Ce2, prepareCreateParams: we2, executeSingleCreate: Ee2 } = ze({ getFingerprintInputs: (e2) => V2.value === "import" ? [H2.value, ...e2.extraSettings.value] : e2.inputsGroup.value, resolveMobileVisible: () => V2.value === "import" || void 0, onInputsInitialized: (e2) => {
    H2.value = e2.mainSetting.value.map((e3) => r(e3));
  }, onInitialized: Fe2 }), Y2 = E(), De2 = E([]), X2 = j({ value: "default", oldValue: "default", label: $t("\u4E0D\u4F7F\u7528\u6A21\u677F"), select: () => {
    if (X2.value === X2.oldValue) return;
    X2.oldValue = X2.value;
    let e2 = S(Y2.value[X2.value] || Y2.value.default);
    J2(e2);
  } }), Oe2 = { proxyInfoList: [], windowPlatformList: [] }, ke2 = E({}), Ae2 = M(() => [{ label: $t("\u8986\u76D6\u5F53\u524D\u6A21\u677F"), disabled: !!X2.value && X2.value === "default", command: () => {
    let e2 = De2.value.find((e3) => e3.value === X2.value);
    Ue2({ templateName: e2.label, id: Number(e2.value) });
  } }]), je2 = M(() => 100), Z2 = M(() => V2.value === "import" ? [[], ...q2.value] : [fe2.value, ...q2.value]), Ne2 = M(() => V2.value === "import" ? [H2.value, ...q2.value] : [fe2.value, ...q2.value]);
  ne(() => V2.value, (e2, t2) => {
    if (P2.value = e2 === "multiple", t2 !== "import") {
      let e3 = o(Z2.value[0], Object.keys(Oe2)).map((e4) => [e4.name, r(e4.value)]);
      Reflect.set(ke2.value, t2, e3);
    }
    e2 !== "import" && (ke2.value[e2] ?? Object.entries(Oe2)).forEach(([e3, t3]) => {
      h(Z2.value[0], e3, t3);
    }), ye2(), be2();
  }), w(() => {
    Pe2(), J2();
  });
  async function Pe2() {
    let { data: e2 } = await i.window.userGetWindowTemplateListList(), t2 = { map: { default: await Te() }, options: [{ label: $t("\u4E0D\u4F7F\u7528\u6A21\u677F"), value: "default", action: !1 }] }, { map: n3, options: r2 } = e2.reduce((e3, t3) => {
      if (t3.id) {
        let n4 = t3.id.toString();
        e3.map[n4] = JSON.parse(t3.content), e3.options.push({ label: t3.templateName, value: n4, action: !0 });
      }
      return e3;
    }, t2);
    Y2.value = n3, De2.value = r2.map((e3) => ({ ...e3, command: () => {
      X2.value = e3.value, X2.label = e3.label, X2.select();
    }, render: ({ item: e4, btnPt: t3 }) => U(K, { text: !0, severity: "secondary", class: "w-full", pt: t3 }, { default: () => [U("div", { class: "w-full flex items-center gap-2" }, [U("div", { class: "flex-1 text-left" }, [e4.label]), e4.action && U(ee, null, [U("div", { onClick: W((t4) => He2(t4, e4), ["stop"]) }, [U(le, { name: "base/rx_ic_edit" }, null)]), U("div", { onClick: W(() => We2(e4), ["stop"]) }, [U(le, { name: "base/rx_ic_bin_1" }, null)])])])] }) }));
  }
  async function Fe2() {
    if (n2.query.templateId && X2.value === "default") {
      const row = (await globalThis.__localApi.window.userGetWindowTemplateListList()).data.find((v2) => String(v2.id) === String(n2.query.templateId));
      if (!row) throw Error("\u6A21\u677F\u4E0D\u5B58\u5728");
      X2.value = String(row.id), X2.oldValue = String(row.id), X2.label = row.templateName, await J2(JSON.parse(row.content));
    }
  }
  function Q2(t2 = 0) {
  }
  function Ie2() {
    return I2.value ? (z2 = !0, $2(), I2.value.destroy(), I2.value = void 0, !0) : !1;
  }
  async function Le2() {
    await s(300), await C(), z2 = !1, e("oneClick", !0);
  }
  B2.pauseCreateGuide = Ie2, B2.continueCreateGuideAfterBuy = Le2;
  function Re2() {
    z2 = !1, $2(), I2.value &&= (I2.value.destroy(), void 0);
  }
  function $2() {
    document.querySelectorAll(".guide1.guide1-pulse-active").forEach((e2) => e2.classList.remove("guide1-pulse-active"));
  }
  function Be2(e2) {
    L2.value = e2, J2(e2.preset);
  }
  function Ve2(e2) {
    O2(e2, { model: De2.value });
  }
  async function He2(e2, t2) {
    D2({ title: t2?.value ? $t("\u7F16\u8F91\u6A21\u677F") : $t("\u4FDD\u5B58\u6A21\u677F"), inputs: [{ type: "text", name: "templateName", value: t2?.label, required: !0, props: { placeholder: $t("\u6A21\u677F\u540D\u79F0") } }], onConfirm: async (value) => Ue2({ templateName: value.templateName, id: t2?.value }) });
  }
  async function Ue2({ templateName: e2, id: t2 }) {
    let n3 = JSON.stringify(p(Z2.value)), { code: r2, msg: a3 } = t2 ? await i.window.userMdfWindowTemplateInfoCreate({ id: t2, templateName: e2, content: n3 }) : await i.window.userAddWindowTemplateInfoCreate({ templateName: e2, content: n3 });
    r2 === 0 ? (t2 && Number(X2.value) === t2 && (X2.label = e2), Pe2()) : T2(r2, () => {
      k2(r2, a3);
    });
  }
  async function We2(e2) {
    a2.require({ header: $t("\u5220\u9664\u6A21\u677F"), message: $t("\u60A8\u786E\u8BA4\u8981\u5220\u9664 ({name}) \u6A21\u677F\u5417\uFF1F", { name: e2.label }), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: async () => {
      let { code: t2, msg: n3 } = await i.window.userDeleteWindowTemplateInfoCreate({ id: Number(e2.value) });
      k2(t2, n3), t2 === 0 && Pe2();
    } });
  }
  function Ge2() {
    A2(_.BROWSER_LIST, { projectId: "" }), G2.value.projectId && A2(_.BROWSER_LIST, { projectId: String(G2.value.projectId) });
  }
  function Ke2(e2, t2 = !1) {
    Ge2();
    let { path: n3, query: r2 } = b2, i2 = !["/browser", "/projects"].some((e3) => n3?.startsWith(e3)) || n3 === "/browser/edit" ? "/browser" : n3;
    c2.replace({ path: i2, query: { ...r2, title: G2.value.projectName, browser: JSON.stringify({ windowId: e2?.windowId, openBrowser: t2 }) } });
  }
  return { tabs: te2, tabsValue: V2, isBatch: P2, createCount: F2, driverObj: I2, presetTemplate: L2, oneClickSettings: R2, rawMainSetting: H2, metaData: G2, collapsed: de2, mainSetting: fe2, extraSettings: q2, loading: me2, formGate: ge2, canSubmit: _e2, initialize: J2, syncMobileVisibility: ye2, updateFingerprint: be2, shuffleFingerprint: xe2, buildCreateParams: Ce2, prepareCreateParams: we2, executeSingleCreate: Ee2, profileTemplate: X2, items: Ae2, maxWindowCount: je2, inputsGroup: Z2, previewInputs: Ne2, clearDriver: Re2, choosePreset: Be2, showTemplates: Ve2, saveTemplatePopup: He2, onBack: Ke2, workspaceStore: f2, userStore: m2 };
}
var St = { class: "relative flex min-h-0 flex-col h-full create-page" };
var Ct = { class: "flex items-center justify-center gap-2" };
var wt = ["aria-label", "disabled"];
var Tt = { class: "ai-batch-create-entry__text" };
var Et = G(b({ __name: "index", setup(e2) {
  let t2 = xt(), { tabs: n2, tabsValue: r2 } = t2, a2 = m(), { opening: o2, openRoxyAIAgent: s2 } = me(), c2 = M(() => /^(?:en|ru)(?:-|$)/i.test(a2.currentLocale));
  function l2() {
    return globalThis.__localActionTrack("ui_action").catch(console.error), s2(fe);
  }
  return (e3, i2) => {
    let a3 = Ae, s3 = be, u2 = ye, d2 = xe;
    return D(), F("div", St, [U(a3, { "show-back": "", divider: !1, title: e3.$t("\u521B\u5EFA\u7A97\u53E3") }, null, 8, ["title"]), U(d2, { value: L(r2), "onUpdate:value": i2[0] ||= (e4) => k(r2) ? r2.value = e4 : null, tabs: L(n2), "only-tabs": "" }, { tablist: R(() => [U(u2, { pt: { tablist: "px-6 py-0 gap-4" } }, { default: R(() => [(D(!0), F(ee, null, te(L(n2), (e4) => (D(), B(s3, { key: e4.title, value: e4.value }, { default: R(() => [P("div", Ct, [P("span", null, I(e4.title), 1)])]), _: 2 }, 1032, ["value"]))), 128)), P("button", { class: N(["ai-batch-create-entry", { "ai-batch-create-entry--wide-badge": L(c2) }]), type: "button", "aria-label": e3.$t("AI \u6279\u91CF\u521B\u5EFA"), disabled: L(o2), onClick: W(l2, ["stop"]) }, [P("span", Tt, I(e3.$t("AI \u6279\u91CF\u521B\u5EFA")), 1)], 10, wt)]), _: 1 })]), _: 1 }, 8, ["value", "tabs"]), L(r2) === "single" ? (D(), B(We, { key: 0, shared: L(t2) }, null, 8, ["shared"])) : L(r2) === "multiple" ? (D(), B(nt, { key: 1, shared: L(t2) }, null, 8, ["shared"])) : (D(), B(bt, { key: 2, shared: L(t2) }, null, 8, ["shared"]))]);
  };
} }), [["__scopeId", "data-v-12c289c8"]]);
export {Et as default};