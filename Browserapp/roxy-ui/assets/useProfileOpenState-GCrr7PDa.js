import {ai as e,gi as t,h as n,mt as r,oi as i,v as a} from "./utils-BIWenCnY.js";
import {C as o,D as s,St as c,W as l,Y as u,_t as d,bt as f,d as p,en as m,f as h,h as g,i as _,in as v,jt as y,lt as b,nt as x,q as S,st as C,x as w} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {a as T,n as E} from "./agent-BmSFI9WH.js";
import {p as ee} from "./useProfileProxy-Cbqapbxb.js";
import {r as D} from "./rich-html-link-VdBpR3Cm.js";
import {n as te} from "./workspace-CNvgSgaH.js";
import {Z as O} from "./basecomponent-ClhuVxJN.js";
import {t as k} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as ne} from "./useconfirm-CV4GTWBW.js";
import {t as A} from "./rx-button-DyzuUt-V.js";
import {t as j} from "./rx-checkbox-BrC0MzoD.js";
import {n as re} from "./useRouteContext-Cfh7KChG.js";
import {t as M} from "./useDialog-BC-nc8J-.js";
import {I as N} from "./CreateTemplateDialog-Bpq9OLTG.js";
import {t as P} from "./hooks-BozaoB_u.js";
import {n as F,t as ie} from "./useProfileEntityLabels-BfqbVpel.js";
import {t as I} from "./useCommonUtil-C7F4fHRj.js";
var L = ["viewBox", "width"];
var R = ["stroke-width", "d"];
var z = ["stroke-width", "stroke-dasharray", "stroke-linecap", "d"];
var B = k(o({ __name: "circle-progress", props: { value: { default: 0 }, size: { default: 32 }, strokeWidth: { default: 2 } }, setup(e2) {
  let t2 = p(() => Number(e2.size) + Number(e2.strokeWidth)), n2 = p(() => `0 0 ${t2.value} ${t2.value}`), r2 = p(() => t2.value / 2), i2 = p(() => {
    let n3 = Math.max(1, t2.value * 0.03);
    return r2.value - n3 - Number(e2.strokeWidth) / 2;
  }), a2 = p(() => {
    let e3 = i2.value, t3 = r2.value;
    return `M${t3} ${t3 - e3}
           a ${e3} ${e3} 0 0 1 0 ${2 * e3}
           a ${e3} ${e3} 0 0 1 0 ${-2 * e3}`;
  }), o2 = p(() => {
    let t3 = 2 * Math.PI * i2.value;
    return `${Number(e2.value) / 100 * t3}, ${t3}`;
  }), s2 = p(() => Number(e2.value) <= 2 ? "butt" : "round");
  return (t3, r3) => (l(), g("div", null, [(l(), g("svg", { viewBox: y(n2), width: e2.size, class: "block" }, [h("path", { class: "circle-bg", "stroke-width": e2.strokeWidth, d: y(a2) }, null, 8, R), h("path", { class: "circle-val", "stroke-width": e2.strokeWidth, "stroke-dasharray": y(o2), "stroke-linecap": y(s2), d: y(a2) }, null, 8, z)], 8, L))]));
} }), [["__scopeId", "data-v-9dc6d3aa"]]);
var V = { class: "flex flex-col pa-6 pt-4 gap-4 select-none popup" };
var H = { class: "relative flex items-center h-9" };
var U = { class: "header" };
var W = { class: "help-bold" };
var G = { class: "flex justify-end gap-2" };
var K = k(o({ __name: "disk-Insufficient", emits: ["close"], setup(e2, { emit: t2 }) {
  let { userConfig: n2 } = T(a()), r2 = F(), i2 = t2;
  async function o2() {
    D.emit("openSettings", { settingsKey: "preferences", anchorPoint: "diskSettings" }), s2();
  }
  function s2() {
    i2("close");
  }
  return (e3, t3) => {
    let i3 = O, a2 = u("i18n-t"), c2 = A;
    return l(), g("div", V, [h("div", H, [h("span", U, v(e3.$t("\u78C1\u76D8\u7A7A\u95F4\u4E0D\u8DB3")), 1), w(i3, { class: "absolute right-0 cursor-pointer", size: "20", name: "base/rx_ic_delete", color: "var(--colors-icon-icon-secondary)", onClick: s2 })]), w(a2, { class: "help", tag: "div", keypath: y(r2).cannotOpenDisk, scope: "global" }, { bold: b(() => [h("span", W, v(y(n2).diskLimit) + "GB", 1)]), _: 1 }, 8, ["keypath"]), h("div", G, [w(c2, { outlined: "", severity: "secondary", size: "md", label: e3.$t("\u53D6\u6D88"), onClick: s2 }, null, 8, ["label"]), w(c2, { size: "md", label: e3.$t("\u6253\u5F00\u8BBE\u7F6E"), onClick: o2 }, null, 8, ["label"])])]);
  };
} }), [["__scopeId", "data-v-0c275d6d"]]);
var q = { class: "w-160 flex flex-col gap-4 pa-6 pt-4 rounded-2" };
var J = { class: "h-9 flex items-center justify-between" };
var ae = { class: "tt-primary text-4 font-600 leading-normal" };
var oe = { class: "flex flex-col self-stretch gap-4" };
var se = { class: "tt-primary text-3.5 leading-4" };
var ce = { class: "grid grid-cols-3 gap-4" };
var le = ["onClick"];
var ue = { class: "text text-center" };
var de = { class: "mt-4 flex gap-3 items-center" };
var fe = { class: "flex-1 flex items-center gap-2" };
var pe = ["for"];
var me = k(o({ __name: "opened-layout-model", props: { count: {} }, emits: ["close", "confirm"], setup(e2, { emit: t2 }) {
  let n2 = t2, r2 = F(), { saveUserConfig: i2 } = I(), { updateOnboardingTaskStatus: a2 } = P(), o2 = x(), s2 = c(!1), u2 = [{ label: $t("\u7F51\u683C"), img: "other/grid", value: "grid" }, { label: $t("\u5C42\u53E0"), img: "other/cascade", value: "cascade" }, { label: $t("\u91CD\u53E0"), img: "other/stack", value: "stack" }, { label: $t("\u8DDF\u968F\u4E0A\u6B21"), img: "other/restore", value: "lastClosed" }], f2 = c(u2[0].value);
  function p2() {
    s2.value && (a2({ batchOpenWindowNoPromptStatus: !0 }), i2({ name: "batchOpenLayout", value: f2.value }));
  }
  function b2() {
    p2(), n2("close");
  }
  function C2() {
    p2(), n2("confirm", f2.value);
  }
  return (t3, n3) => {
    let i3 = O, a3 = j, c2 = A;
    return l(), g("div", q, [h("div", J, [h("div", ae, v(y(r2).batchOpenAndArrange(e2.count)), 1), w(i3, { class: "cursor-pointer", name: "base/rx_ic_delete", size: "20", color: "var(--colors-icon-icon-secondary)", onClick: b2 })]), h("div", oe, [h("div", se, v(t3.$t("\u8BF7\u9009\u62E9\u60A8\u7684\u7A97\u53E3\u5E03\u5C40")), 1), h("div", ce, [(l(), g(_, null, S(u2, (e3) => h("div", { key: e3.value, class: m(["flex flex-col gap-3 items-center justify-center", { active: y(f2) === e3.value }]) }, [h("div", { class: "self-stretch flex items-center justify-center py-3.5 rounded-2 cursor-pointer radio", onClick: (t4) => f2.value = e3.value }, [w(i3, { name: e3.img, class: "block icon", width: "100", height: "62" }, null, 8, ["name"])], 8, le), h("div", ue, v(e3.label), 1)], 2)), 64))]), h("div", de, [h("div", fe, [w(a3, { modelValue: y(s2), "onUpdate:modelValue": n3[0] ||= (e3) => d(s2) ? s2.value = e3 : null, "input-id": y(o2), name: "pizza", value: "Cheese" }, null, 8, ["modelValue", "input-id"]), h("label", { class: "tt-secondary text-3", for: y(o2) }, v(t3.$t("\u4E0D\u518D\u63D0\u9192")), 9, pe)]), w(c2, { label: t3.$t("\u53D6\u6D88"), size: "md", outlined: "", severity: "secondary", onClick: b2 }, null, 8, ["label"]), w(c2, { label: t3.$t("\u786E\u8BA4"), size: "md", onClick: C2 }, null, 8, ["label"])])])]);
  };
} }), [["__scopeId", "data-v-a2e9620a"]]);
function he(e2) {
  return e2?.focusUrlByDirId ? { focusUrlByDirId: e2.focusUrlByDirId } : void 0;
}
function Y(t2, n2) {
  n2 === "grid" ? globalThis.electronAPI.send("browser:chunkBrowsersByScreen", t2) : i() && n2 === "minimize" ? globalThis.electronAPI.send("browser:openBatchLayout", { dirIds: t2, layout: "minimize" }) : e() && (n2 === "cascade" || n2 === "lastClosed") ? globalThis.electronAPI.send("browser:openBatchLayout", { dirIds: t2, layout: n2 }) : globalThis.electronAPI.send("browser:batchLaunch", t2);
}
function X(e2) {
  return { code: 0, pending: !1, uploading: !1, data: { dirId: e2, percent: 100, message: $t("\u6253\u5F00\u6210\u529F"), warningMessages: [] } };
}
function Q(e2, t2, n2) {
  Reflect.set(e2, t2, n2);
}
function $(e2, t2) {
  Reflect.deleteProperty(e2, t2);
}
function ge(e2) {
  return e2 ? !!(e2.pending || e2.uploading || e2.code === 0 && e2.data?.percent != null && e2.data.percent < 100) : !1;
}
function _e() {
  let [e2] = M(), i2 = ne();
  function o2() {
    e2({ header: $t("\u78C1\u76D8\u7A7A\u95F4\u4E0D\u8DB3"), showHeader: !1, modal: !0, blockScroll: !0, pt: { content: "!pa-0" }, slots: { container: ({ hideModal: e3 }) => s(K, { onClose: e3 }) } });
  }
  let c2 = r(), l2 = a(), { userInfo: u2, userConfig: d2 } = T(a()), { updateOnboardingTaskStatus: m2 } = P(), { mixpanelTrack: h2 } = a(), [g2, _2] = E(), { isEcommerce: v2 } = re(), y2 = p(() => ie(v2.value)), b2 = p(() => te(c2.currentWorkspace?.workspaceName)), x2 = f({});
  function S2() {
    let e3 = N.winMap.value;
    e3.forEach((e4, t2) => {
      e4 && !e4.closed && Q(x2, String(t2), X(String(t2)));
    });
    for (let t2 of Object.keys(x2)) {
      let n2 = e3.get(t2);
      n2 && !n2.closed || ge(x2[t2]) || $(x2, t2);
    }
  }
  function w2() {
    return globalThis.isElectron ? () => {
    } : C(N.winMap, S2, { immediate: !0 });
  }
  function D2() {
    u2.value.onboardingTaskStatus?.firstOpenWindowStatus === !1 && (m2({ firstOpenWindowStatus: !0 }), h2("open_profile_first", { profile_open_host: globalThis.isElectron ? "user_client" : "cloud_host" }));
  }
  function O2(e3) {
    return globalThis.electronAPI.on("browser:launch-process-message", (t2) => {
      t2.code === 1 && t2.message.includes("ERR101") && o2();
      let n2 = typeof t2.data == "object" && t2.data?.dirId != null ? t2.data.dirId : typeof t2.data == "string" || typeof t2.data == "number" ? t2.data : null;
      if (n2 != null) {
        if (Reflect.set(x2, String(n2), t2), t2.code !== 0) e3?.onOpenFailed?.(n2);
        else if (typeof t2.data == "object" && t2.data.percent === 100) {
          D2(), e3?.onOpenSuccess?.(n2);
          let r2 = t2.data.warningMessages?.filter(Boolean) ?? [];
          r2.length && e3?.onProxyDetectWarning?.(n2, r2);
        }
      }
    });
  }
  function k2() {
    return globalThis.electronAPI.on("browser:on-close", (e3) => {
      e3.forEach((e4) => {
        Reflect.deleteProperty(x2, e4);
      });
    });
  }
  function A2() {
    return globalThis.electronAPI.on("browser:on-close-syncing-data", (e3) => {
      e3.forEach((e4) => {
        let t2 = Reflect.get(x2, e4);
        t2?.data && (t2.uploading = !0, t2.data.message = $t("\u540C\u6B65\u4E2D\u2026"));
      });
    });
  }
  function j2(e3) {
    e3.forEach((e4) => {
      $(x2, e4.dirId);
    });
  }
  async function F2(e3) {
    let t2 = e3.map((e4) => e4.id), { code: r2, data: i3, msg: a2 } = await n.window.userGetWindowStatusInfoCreate({ ids: t2 }).catch((e4) => (console.error(e4), { code: -1, data: [], msg: y2.value.getStatusFailed }));
    return r2 === 0 ? i3.filter((e4) => e4.openStatus === ee.opened) : (_2(r2, a2), []);
  }
  async function I2(n2, r2) {
    let i3 = n2.map((e3) => e3.dirId);
    if (i3.length) {
      if (i3.length === 1 || t(l2.appVersion, "3.8.7", "<")) {
        globalThis.electronAPI.send("browser:batchLaunch", i3, he(r2));
        return;
      }
      if (u2.value.onboardingTaskStatus?.batchOpenWindowNoPromptStatus !== !1) {
        Y(i3, d2.value.batchOpenLayout);
        return;
      }
      e2({ showHeader: !1, modal: !0, blockScroll: !0, closeOnEscape: !1, slots: { container: ({ hideModal: e3 }) => s(me, { count: i3.length, onClose: () => {
        j2(n2), e3();
      }, onConfirm: (t2) => {
        Y(i3, t2), e3();
      } }) } });
    }
  }
  async function L2(e3, t2) {
    if (!globalThis.isElectron) {
      globalThis.electronAPI.send("browser:batchRelaunch", []);
      return;
    }
    let n2 = [].concat(e3).filter((e4) => e4.openLimitStatus).toSorted((e4, t3) => e4.windowSortNum - t3.windowSortNum);
    if (!n2.length) return;
    n2.forEach((e4, t3) => {
      Q(x2, e4.dirId, { pending: !0, data: { message: `${t3 === 0 ? $t("\u542F\u52A8\u4E2D...") : $t("\u7B49\u5F85\u4E2D...")}` } });
    });
    let r2 = (await F2(n2)).filter((e4) => !e4.statusInfo.some((e5) => e5.openUserId === u2.value.id));
    r2.length ? i2.require({ header: $t("\u8B66\u544A"), message: $t("[{names}] \u5DF2\u88AB\u5176\u4ED6\u6210\u5458\u6253\u5F00\uFF0C\u662F\u5426\u7EE7\u7EED\u6253\u5F00\uFF1F", { names: r2.map((e4) => `${b2.value}-${e4.sortNum}`).join(", ") }), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "info" }, accept: () => {
      I2(n2, t2);
    }, reject: () => j2(n2), onHide: () => j2(n2) }) : I2(n2, t2);
  }
  async function R2(e3) {
    if (!e3.some((e4) => Reflect.has(x2, e4.dirId))) return e3;
    let t2 = await globalThis.electronAPI.send("browser:isProcessExists", e3.map((e4) => e4.dirId));
    return e3.filter((e4, n2) => !t2[n2]);
  }
  function z2() {
    return globalThis.electronAPI.send("browser:getOpenedBrowserMessage").then((e3) => {
      e3.forEach((e4) => {
        Reflect.set(x2, e4.dirId, { data: e4 });
      });
    });
  }
  return { openMessage: x2, workspaceName: b2, listenOpenMessage: O2, listenCloseMessage: k2, listenCloseSyncingDataMessage: A2, listenWebWindowManager: w2, openBrowserBefore: L2, clearMessage: j2, checkProfileStatus: F2, onOpenBrowser: I2, getNotUsedProfiles: R2, syncOpenedBrowserState: z2, sendFirstOpenRecord: D2 };
}
export {B as a,_e as i};