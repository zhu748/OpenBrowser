import {Dr as e,En as t,bt as r,cr as i,h as o,ln as s,m as c,mr as l,mt as u,nn as d,or as f,pr as p,qt as m,sn as h,v as ee,vt as _,yt as te} from "./utils-BIWenCnY.js";
import {C as v,D as ne,Dt as re,Et as ie,F as y,G as b,L as ae,R as x,St as S,W as C,Y as oe,_t as se,at as w,b as T,d as E,en as ce,f as D,h as O,i as k,in as A,jt as j,lt as M,m as N,p as P,q as le,st as ue,ut as F,v as de,x as I} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as L} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as me,n as he} from "./agent-BmSFI9WH.js";
import {n as z} from "./permission-DOhNJfB3.js";
import {a as ge,d as B,f as V,i as _e,l as ve,n as ye,o as be,r as xe,s as Se,t as Ce,u as we} from "./useProfileProxy-Cbqapbxb.js";
import {m as H,o as Te} from "./proxy-D7e36h-l.js";
import {b as De,i as Oe,r as U,y as ke} from "./rich-html-link-VdBpR3Cm.js";
import {n as Ae,o as je,t as Me} from "./ry-table-do6kugym.js";
import {n as Ne} from "./workspace-CNvgSgaH.js";
import {Z as Pe} from "./basecomponent-ClhuVxJN.js";
import {t as Fe} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as Ie} from "./useconfirm-CV4GTWBW.js";
import {n as Le} from "./usedialog-Dh0xp3r7.js";
import {t as Re} from "./tooltip-BYYKWrvu.js";
import {t as W} from "./rx-button-DyzuUt-V.js";
import {N as Be,u as Ue,w as We} from "./hook-CnJE4hRq.js";
import {i as Ge,t as Ke} from "./useDomSpotlight-CA279FOk.js";
import {t as Je} from "./rx-divider-Ci3C58Q3.js";
import {t as Ye} from "./format-_cvrr_iF.js";
import {n as Xe} from "./useRouteContext-Cfh7KChG.js";
import {t as Ze} from "./rx-alert-A_y5uvgP.js";
import {t as Qe} from "./rx-tooltip-BnCRxqlH.js";
import {t as $e} from "./rx-tooltip-CNCSEJGC.js";
import {a as et} from "./contextmenu-BBjizTDn.js";
import {t as tt} from "./useDialog-BC-nc8J-.js";
import {t as nt} from "./skeleton-CcmFVUhV.js";
import {t as rt} from "./custom-empty-CChX4pJt.js";
import {n as it,t as at} from "./hooks-BozaoB_u.js";
import {c as ot,l as st,o as ct,s as lt,t as ut,u as dt} from "./hooks-Jw3GridD.js";
import {n as ft} from "./proxy-shop-labels-nJaBS4W_.js";
import {t as pt} from "./simplePopup-D6H7ykCr.js";
import {n as mt,r as ht,t as gt} from "./profile-info-ExiJC1su.js";
import {a as _t,o as vt,r as yt,t as bt} from "./useProxyFormDrawer-r-7UykRS.js";
import {t as xt} from "./useOperationTrack-BXe8Vwhz.js";
import {t as St} from "./quick-kroUOSn_.js";
import {t as Ct} from "./quick-CZrtqSCy.js";
import {n as wt} from "./useProfileEntityLabels-BfqbVpel.js";
import {t as Tt} from "./custom-filters-D_902RzL.js";
import {t as Et} from "./tutorial-video-Cb-jkf_V.js";
import {t as Dt} from "./custom-new-empty-CLCRgYs2.js";
import {a as Ot,i as kt,n as At,o as jt,r as Mt,s as Nt,t as Pt} from "./useQuickCreate-DgAf1jWE.js";
import {i as Ft,n as It,o as Lt} from "./use-tag-menu-DZnIrtE9.js";
import {n as Rt,t as zt} from "./tags-icon-CZSs72B-.js";
import {r as Bt} from "./useAsyncGate-D7VA7DLY.js";
import {a as Vt,i as Ht} from "./useProfileOpenState-GCrr7PDa.js";
import {t as Ut} from "./batch-proxies-wPSH-NmI.js";
import {a as Wt,c as Gt,i as Kt,l as qt,n as Jt,r as Xt,t as Zt,u as Qt} from "./operationHandlers-Db52Gyo7.js";
var q = { key: 0, class: "flex items-center justify-center" };
var en = { class: "select-none" };
var on = ["onClick"];
var sn = Fe(v({ __name: "browser-control", props: { btnId: {}, disabled: { type: Boolean, default: !1 }, data: {}, openMessage: { default: () => ({}) }, text: {}, icon: { default: "base/rx_ic_chrome" }, driverObj: {}, driverNext: { type: Function }, sendFirstOpenRecord: { type: Function } }, emits: ["open"], setup(e2, { emit: n2 }) {
  let r2 = n2, i2 = De(), c2 = u(), { isPublicMember: l2 } = Xe(), f2 = wt(), p2 = ft(), { check: h2 } = d(), [, g2] = he(), _2 = vt(), { buildProxyData: te2 } = _e(), { saveLocalTrack: v2 } = xt(), ne2 = E(() => Ne(c2.currentWorkspace?.workspaceName)), { openProxyDrawer: ie2 } = mt({ data: re(() => e2.data), workspaceName: ne2, drawerInstance: _2, emit: () => {
  }, onlyErrorToast: g2 }), y2 = E(() => e2.text ?? f2.value.open), { browser: b2, coreInfo: ae2, isOpenLimitReached: x2, isCrossModeExpired: S2, crossModeExpiredTip: se2, isButtonDisabled: w2, usePeoples: k2, showErrorTooltip: le2, openBrowser: ue2 } = Qt({ data: e2.data, openMessage: e2.openMessage, text: y2, driverObj: e2.driverObj, driverNext: () => e2.driverNext?.(), sendFirstOpenRecord: () => e2.sendFirstOpenRecord?.(), onOpen: (e3) => r2("open", e3) });
  async function fe2() {
    let { osVersion: n3, "R-OS": r3 } = await s();
    t(r3, n3, e2.data.coreType, e2.data.coreVersion) ? g2(-1, $t("\u5F53\u524D\u7CFB\u7EDF\u4E0D\u652F\u6301\u4F7F\u7528{version}\u5185\u6838", { version: e2.data.coreVersion })) : ue2();
  }
  async function B2(t2) {
    h2("Profiles_select_proxy") && (t2?.(), v2("chooseProxy"), await ie2(te2(e2.data)));
  }
  return (t2, n3) => {
    let r3 = Pe, a2 = Vt, o2 = W, s2 = oe("i18n-t"), c3 = Re;
    return C(), O("div", { class: "flex items-center gap-2", onClick: n3[1] ||= L(() => {
    }, ["stop"]) }, [I(j($e), null, de({ default: M(() => [D("div", { class: ce(["control-group flex items-center gap-2", { "control-group--limited": j(x2) }]) }, [I(o2, { id: e2.btnId, class: ce(["control", j(b2).classes]), disabled: j(w2) || e2.disabled, size: "xxs", outlined: "", severity: "secondary", onClick: L(fe2, ["stop"]) }, { default: M(() => [!j(b2).percent || j(b2).completed ? F((C(), O("div", q, [j(x2) ? (C(), P(r3, { key: 0, class: "control-icon pointer-events-none", name: "base/rx_ic_lock" })) : (C(), P(r3, { key: 1, class: ce(["control-icon pointer-events-none", { firefox: e2.data.coreType === j(m).Firefox }]), name: e2.icon }, null, 8, ["name", "class"]))])), [[c3, { value: j(x2) ? void 0 : j(ae2), showDelay: 300 }, void 0, { top: !0 }]]) : N("", !0), j(b2).percent && !j(b2).completed ? (C(), P(a2, { key: 1, size: "16", value: j(b2).percent }, null, 8, ["value"])) : N("", !0), D("span", en, A(j(b2).completed && !j(b2).uploading ? t2.$t("\u67E5\u770B") : j(b2).msg), 1)]), _: 1 }, 8, ["id", "class", "disabled"])], 2)]), _: 2 }, [void 0]), 1024), j(le2) ? (C(), P(j($e), { key: 0 }, { default: M(() => [I(r3, { name: "base/rx_ic_info_fill", class: ce([j(b2).error ? "text-red" : "text-orange"]) }, null, 8, ["class"])]), content: M(({ hide: e3 }) => [I(s2, { class: "error", tag: "div", keypath: j(b2).error || j(b2).warning, scope: "global" }, de({ _: 2 }, [j(l2) ? void 0 : { name: "link", fn: M(() => [T(A(t2.$t("\u8981\u89E3\u51B3\u6B64\u95EE\u9898\uFF0C\u8BF7\u8BBF\u95EE")) + " ", 1), D("span", { class: "cursor-pointer error-link", onClick: n3[0] ||= (e4) => j(i2).push({ name: "agent-list", query: { name: "shop" } }) }, A(j(p2).resourcePageLink), 1)]), key: "0" }, j(l2) ? void 0 : { name: "replace", fn: M(() => [D("span", { class: "cursor-pointer error-link", onClick: L((t3) => B2(e3), ["stop"]) }, A(t2.$t("\u66FF\u6362\u4EE3\u7406 IP")), 9, on)]), key: "1" }]), 1032, ["keypath"])]), _: 1 })) : N("", !0), j(k2) ? F((C(), P(r3, { key: 1, name: "base/rx_ic_user_group", class: "text-orange" }, null, 512)), [[c3, j(k2), void 0, { top: !0 }]]) : N("", !0)]);
  };
} }), [["__scopeId", "data-v-05079936"]]);
function cn(e2) {
  let t2 = S();
  function n2() {
    t2.value && (t2.value = void 0, U.emit("asideMenuGuide"));
  }
  async function r2() {
    await e2.tableRef.value?.refresh({}, !0), y(() => {
      t2.value = p({ showProgress: !1, disableActiveInteraction: !1, allowClose: !0, overlayClickBehavior: "close", showButtons: ["close"], stagePadding: 0, popoverOffset: 20, onDestroyed: () => {
        Ke(), e2.onComplete?.();
      }, steps: [{ element: "#OPEN_0", popover: { description: $t("\u70B9\u51FB\u300C\u6253\u5F00\u300D\u4EE5\u542F\u52A8\u6D4F\u89C8\u5668\u3002"), side: "right", align: "center" }, onHighlightStarted: () => {
        y(() => {
          requestAnimationFrame(() => {
            Ge("#OPEN_0");
          });
        });
      }, onDeselected: () => {
        Ke();
      } }] }), t2.value.drive();
    });
  }
  return ae(() => {
    e2.enabled() && U.on("firstRegisterGuide", r2);
  }), x(() => {
    U.off("firstRegisterGuide", r2);
  }), { driverObj: t2, driverNext: n2 };
}
var ln = { class: "flex flex-col gap-3 w-120 px-6 pt-4 pb-6" };
var un = { class: "text-14px font-medium text-[var(--colors-text-text-primary)]" };
var dn = { class: "flex flex-col gap-1" };
var fn = { class: "flex justify-end items-center gap-3" };
var pn = v({ __name: "upgrade-core-dialog", props: { messages: {}, confirmUpgrade: { type: Function }, close: { type: Function } }, setup(e2) {
  let t2 = S(!1);
  async function n2() {
    if (!t2.value) {
      t2.value = !0;
      try {
        await e2.confirmUpgrade(), e2.close();
      } catch (e3) {
        console.warn("[upgradeCore] update failed", e3);
      } finally {
        t2.value = !1;
      }
    }
  }
  return (r2, i2) => {
    let a2 = W;
    return C(), O("div", ln, [D("div", un, A(r2.$t("\u5347\u7EA7\u5185\u6838")), 1), D("div", dn, [(C(!0), O(k, null, le(e2.messages, (e3, t3) => (C(), O("div", { key: t3, class: "text-12px leading-18px text-[var(--colors-text-text-secondary)] break-all" }, A(e3), 1))), 128))]), I(j(Ze), { class: "!w-full", type: "warn", closable: !1, content: r2.$t("\u4FEE\u6539\u5185\u6838\u53EF\u80FD\u5BFC\u81F4\u7F13\u5B58\u4E0D\u517C\u5BB9\uFF0C\u4ECE\u800C\u4F7F\u8D26\u53F7\u767B\u5F55\u4FE1\u606F\u5931\u6548\uFF0C\u8BF7\u8C28\u614E\u64CD\u4F5C\u3002") }, null, 8, ["content"]), D("div", fn, [I(a2, { size: "sm", text: "", severity: "secondary", label: r2.$t("\u53D6\u6D88"), disabled: j(t2), onClick: e2.close }, null, 8, ["label", "disabled", "onClick"]), I(a2, { size: "sm", label: r2.$t("\u786E\u8BA4"), loading: j(t2), onClick: n2 }, null, 8, ["label", "loading"])])]);
  };
} });
var mn = "109";
var hn = 10;
function gn(e2) {
  return e2 === m.Firefox ? m.Firefox : m.Chrome;
}
function _n(e2) {
  return [...e2].sort((e3, t2) => Number(t2) - Number(e3));
}
function vn(e2, t2) {
  return e2?.toLocaleLowerCase() === "windows" && ["7", "8"].includes(t2?.at(0) ?? "");
}
function yn(e2, n2) {
  let r2 = gn(e2.coreType), i2 = r2 === m.Firefox ? n2.firefox : n2.chrome;
  r2 === m.Chrome && vn(e2.os, e2.osVersion) && (i2 = i2.filter((e3) => e3 === mn)), r2 === m.Chrome && (i2 = i2.filter((e3) => !t(n2.systemOs, n2.systemOsVersion, r2, e3)));
  let [a2] = _n(i2.filter(Boolean));
  return a2;
}
function bn(e2, t2) {
  let n2 = Number.parseInt(t2, 10);
  if (!Number.isFinite(n2)) return !1;
  let r2 = Number.parseInt(e2 ?? "", 10);
  return !Number.isFinite(r2) || n2 > r2;
}
function xn(e2, t2) {
  let n2 = /* @__PURE__ */ new Map(), r2 = !1;
  for (let i2 of e2) {
    if (i2.id == null) continue;
    let e3 = yn(i2, t2);
    if (!e3 || (r2 = !0, !bn(i2.coreVersion, e3))) continue;
    let a2 = gn(i2.coreType), o2 = `${a2}:${e3}`, s2 = n2.get(o2) ?? { coreType: a2, coreVersion: e3, ids: [], rows: [] };
    s2.ids.push(i2.id), s2.rows.push(i2), n2.set(o2, s2);
  }
  return n2.size ? { status: "ready", groups: [...n2.values()] } : { status: r2 ? "latest" : "unavailable" };
}
function Sn(e2, t2) {
  let n2 = /* @__PURE__ */ new Map();
  for (let r2 = 0; r2 < e2.length; r2++) {
    let i2 = e2[r2];
    if (!i2.os) return;
    let a2 = gn(i2.coreType), o2 = i2.osVersion || void 0, s2 = i2.browserVersion || void 0, c2 = [a2, t2, i2.os, o2 ?? "", s2 ?? ""].join("\0"), l2 = n2.get(c2) ?? { os: i2.os, osVersion: o2, browserVersion: s2, coreType: a2, coreVersion: t2, indexes: [] };
    l2.indexes.push(r2), n2.set(c2, l2);
  }
  return [...n2.values()];
}
function Cn(e2, t2) {
  let n2 = Array.from({ length: e2 });
  for (let { indexes: e3, patches: r2 } of t2) {
    if (r2.length < e3.length) return;
    e3.forEach((e4, t3) => {
      let i2 = r2[t3];
      i2?.userAgent && (n2[e4] = { userAgent: i2.userAgent, webGLManufacturer: i2.webGLManufacturer, webGLRender: i2.webGLRender });
    });
  }
  if (!n2.some((e3) => !e3?.userAgent)) return n2;
}
function J(e2, t2) {
  return `${t2.slice(0, hn).map((t3) => t3.windowSortNum == null ? t3.windowName || "" : `${e2}-${t3.windowSortNum}`).filter(Boolean).join(", ")}${t2.length > hn ? "..." : ""}`;
}
async function wn() {
  let [e2, t2, n2] = await Promise.all([c(), globalThis.electronAPI.send("app:getCoreList"), s()]), r2 = t2 ?? [], i2 = new Set(r2.filter((e3) => gn(e3.coreType) === m.Chrome).map((e3) => e3.coreVersion).filter((e3) => !!e3)), a2 = new Set(r2.filter((e3) => gn(e3.coreType) === m.Firefox).map((e3) => e3.coreVersion).filter((e3) => !!e3)), o2 = (e2.coreVersion ?? []).map((e3) => e3.value).filter(Boolean), l2 = (e2.firefoxCoreVersion ?? []).map((e3) => e3.value).filter(Boolean);
  return { chrome: i2.size ? o2.filter((e3) => i2.has(e3)) : o2, firefox: a2.size ? l2.filter((e3) => a2.has(e3)) : l2, systemOs: n2["R-OS"], systemOsVersion: n2.osVersion };
}
var Y = 100;
async function Tn(e2, t2) {
  let n2 = [];
  for (let r2 = 0; r2 < e2.length; r2 += Y) {
    let i2 = e2.slice(r2, r2 + Y), a2 = await o.window.userGetWindowInfoV2List({ windowIds: i2.join(","), isDelete: 0, page_index: 1, page_size: i2.length });
    if (a2.code !== 0) throw t2(a2.code, a2.msg), Error(a2.msg);
    n2.push(...a2.data?.rows ?? []);
  }
  return n2;
}
async function X(e2, t2) {
  let n2 = await Tn(e2.ids, t2), r2 = new Map(n2.map((e3) => [e3.id, e3])), i2 = e2.rows.map((e3) => r2.get(e3.id)), a2 = i2.every(Boolean) ? Sn(i2, e2.coreVersion) : void 0;
  if (!a2) throw t2(-1, $t("\u65E0\u6CD5\u540C\u6B65\u5185\u6838\u5173\u8054\u7684\u6307\u7EB9\u4FE1\u606F\uFF0C\u5347\u7EA7\u5DF2\u53D6\u6D88")), Error("Missing profile fields required to refresh kernel fingerprint");
  let s2 = [];
  for (let e3 of a2) {
    let n3 = { os: e3.os, coreVersion: e3.coreVersion, coreType: e3.coreType, count: e3.indexes.length, ...e3.osVersion ? { osVersion: e3.osVersion } : {}, ...e3.browserVersion ? { browserVersion: e3.browserVersion } : {} }, r3 = await o.window.userGetUaWebglV2List(n3);
    if (r3.code !== 0) throw t2(r3.code, r3.msg), Error(r3.msg);
    s2.push({ indexes: e3.indexes, patches: r3.data ?? [] });
  }
  let c2 = Cn(e2.rows.length, s2);
  if (!c2) throw t2(-1, $t("\u65E0\u6CD5\u540C\u6B65\u5185\u6838\u5173\u8054\u7684\u6307\u7EB9\u4FE1\u606F\uFF0C\u5347\u7EA7\u5DF2\u53D6\u6D88")), Error("Kernel fingerprint refresh returned incomplete data");
  return c2;
}
function En(e2) {
  let [t2] = tt();
  async function n2(n3) {
    let r2 = xn(n3, await wn());
    if (r2.status === "unavailable") {
      e2.onlyErrorToast(-1, $t("\u5F53\u524D\u6CA1\u6709\u53EF\u5347\u7EA7\u7684\u5185\u6838\u7248\u672C"));
      return;
    }
    if (r2.status === "latest") {
      e2.onlyErrorToast(-1, $t("\u6240\u9009\u7A97\u53E3\u5DF2\u662F\u6700\u65B0\u5185\u6838"));
      return;
    }
    let i2 = e2.getWorkspaceName(), a2 = r2.groups.map((e3) => $t("[{names}]\u7A97\u53E3\u5C06\u5347\u7EA7\u5230 {version} \u5185\u6838\u7248\u672C", { names: J(i2, e3.rows), version: `${e3.coreType} ${e3.coreVersion}` }));
    t2({ uniqueKey: "upgrade-core", showHeader: !1, modal: !0, blockScroll: !0, pt: { content: "!pa-0" }, slots: { container: ({ hideModal: t3 }) => ne(pn, { messages: a2, close: t3, confirmUpgrade: async () => {
      for (let t4 of r2.groups) {
        let n4 = await X(t4, e2.onlyErrorToast);
        await e2.batchModifyWindow({ ids: t4.ids, coreVersion: t4.coreVersion, fingerDetail: n4 }, !0), t4.rows.forEach((e3) => {
          e3.coreVersion = t4.coreVersion;
        });
      }
      e2.showToast(0, $t("\u5347\u7EA7\u6210\u529F"));
    } }) } });
  }
  return { onUpgradeCore: n2 };
}
var Dn = { class: "w-full flex items-start gap-2" };
var On = { key: 0, class: "quick-create-entry flex shrink-0 items-stretch" };
var kn = { key: 1, class: "inline-flex" };
var An = { class: "flex gap-3" };
var jn = { class: "flex flex-col gap-1 w-50" };
var Mn = { class: "temporary-title" };
var Nn = { class: "temporary-desc" };
var Pn = { key: 1, class: "flex items-center gap-[16px]" };
var Fn = { class: "flex items-center gap-[1px]" };
var In = { key: 0, class: "dotted-line" };
var Ln = { class: "flex items-center gap-2 note-header" };
var Rn = ["onClick"];
var zn = ["title"];
var Bn = { class: "flex items-center gap-2" };
var Vn = Fe(v({ __name: "index", props: { currentFilter: {}, isProjectProfile: { type: Boolean, default: !1 } }, emits: ["updateFilterTabs", "switchTab"], setup(t2, { expose: a2, emit: s2 }) {
  let c2 = t2, p2 = s2, g2 = ke(), v2 = De(), re2 = Ie(), oe2 = Le(), T2 = vt(), { showProxyFormDrawer: fe2 } = bt(T2), { userInfo: R2, userConfig: Ee2 } = me(ee()), { handleBusinessCode: Ne2 } = We(), { updateOnboardingTaskStatus: Fe2 } = at(), { getProjects: ze2 } = Lt(), [He2] = tt(), [G2, K2] = he(), [Ge2] = It(), [Ke2] = Ae(), { showSimpleDialog: qe2 } = pt(), { buildProxyData: Xe2, confirmDeleteProxy: $e2 } = _e(), { runProxySpeedTestForRows: ft2 } = ge(), { batchTestShowToast: mt2 } = ut(), { editCookieByProfile: wt2, startCookieRobot: Vt2 } = Wt(), { saveLocalTrack: Qt2 } = xt(), { check: q2 } = d(), { opening: en2, openRoxyAIAgent: tn } = Ue(), { getVideoSource: nn } = h(), rn = u(), an = r(), { invalidateCache: on2 } = te(), { columns: ln2, updateColumns: un2, updateRemarkDisplayStatus: dn2 } = yt(jt(), c2.isProjectProfile ? ["project"] : void 0), { purchaseImmediateOfficialProxy: fn2 } = Se(), pn2 = be(), { visible: mn2, showBuy: hn2, showAdd: gn2, provider: _n2, onProxyBuyAddBuySuccess: vn2, onProxyBuyAddAddConfirm: yn2 } = pn2;
  b(Ce, pn2);
  let { canQuickCreate: bn2, onQuickCreateMainClick: xn2, onQuickCreateSettingsClick: Sn2 } = Pt(), Cn2 = E(() => bn2() && q2("Profiles_add")), J2 = w("windowTable"), wn2 = w("tagsIcon"), Y2 = E(() => J2.value?.selectionData ?? []), Tn2 = E(() => Y2.value.length ? $t("AI \u81EA\u52A8\u5316 ({count})", { count: Y2.value.length }) : $t("AI \u81EA\u52A8\u5316")), X2 = S(), Vn2 = S(!1), Hn = At(), Un = S(!1), { driverObj: Wn, driverNext: Gn } = cn({ tableRef: J2, enabled: () => R2.value.onboardingTaskStatus?.firstRegisterGuideStatus === !1 }), { openMessage: Kn, workspaceName: Z, listenOpenMessage: qn, listenCloseMessage: Jn, listenCloseSyncingDataMessage: Yn, listenWebWindowManager: Xn, openBrowserBefore: Zn, getNotUsedProfiles: Qn, syncOpenedBrowserState: $n, sendFirstOpenRecord: er } = Ht(), { dataList: tr, hasFiltered: nr, hasTempProfile: rr, clearPendingAutoOpen: ir, syncOpenedProxyToRow: ar, onRefreshTable: Q, tableRequest: or, syncFromCacheEntry: sr } = Kt({ tableRef: J2, filtersMenu: X2, getCurrentFilterParams: () => c2.currentFilter?._params, openBrowserBefore: Zn });
  function cr() {
    return c2.isProjectProfile ? { projectId: String(g2.params.id ?? "") } : { projectId: "" };
  }
  function lr(e2) {
    on2(_.BROWSER_LIST, { projectId: String(e2) });
  }
  function ur() {
    lr(cr().projectId);
  }
  function dr() {
    on2(_.ACCOUNT_LIST);
  }
  function fr(e2 = {}, t3 = !1) {
    ur(), Q(e2, t3);
  }
  function pr() {
    let e2 = rn.currentWorkspace?.id;
    return e2 ? an.get(_.BROWSER_LIST, String(e2), cr()) : null;
  }
  function mr() {
    let e2 = pr();
    if (!e2) return !1;
    if (c2.isProjectProfile) return !0;
    let t3 = e2.meta?.activeTabId, n2 = c2.currentFilter?.id ?? "rx_1000";
    return !!t3 && t3 === n2;
  }
  function hr() {
    if (c2.isProjectProfile) return !1;
    let e2 = pr()?.meta?.activeTabId;
    return e2 ? e2 !== (c2.currentFilter?.id ?? "rx_1000") : !1;
  }
  function gr() {
    let e2 = {};
    return c2.isProjectProfile || (e2.activeTabId = c2.currentFilter?.id ?? "rx_1000"), X2.value && (e2.filtersMenu = X2.value), e2;
  }
  function _r() {
    if (!mr()) return !1;
    let e2 = pr();
    return e2 ? (sr(e2), !0) : !1;
  }
  async function vr() {
    X2.value = await Mt(c2.currentFilter?.filter_condition || {});
  }
  async function $() {
    if (Vn2.value || hr()) return;
    if (Vn2.value = !0, await vr(), mr()) {
      J2.value?.restoreFromCache(), _r();
      return;
    }
    let t3 = e(g2.query.customFilterParams, {});
    Q({ ...t3, ...c2.currentFilter?._params ?? {} }, !1);
  }
  async function yr() {
    c2.currentFilter && (Vn2.value ? (await vr(), Q(c2.currentFilter._params ?? {}, !1)) : await $());
  }
  let { singleModifyWindow: br2, batchModifyWindow: xr, updateProfileMeta: Sr } = Xt({ onlyErrorToast: K2, onRefreshTable: Q, invalidateListCache: ur }), { onUpgradeCore: Cr } = En({ batchModifyWindow: xr, onlyErrorToast: K2, showToast: G2, getWorkspaceName: () => Z.value });
  ue(() => c2.currentFilter?.id, () => {
    yr();
  }), ue(() => g2.params.id, async () => {
    g2.params.id && (Vn2.value = !1, await y(), await $());
  });
  let wr, Tr, Er, Dr, Or = l({ intervalMs: 3e5, checkOnce: async () => !Ee2.value.autoDetectProxy || (await kr(!0), !1) });
  Oe("refreshProfileList", async (e2) => {
    e2 && v2.replace({ name: g2.name, query: { browser: JSON.stringify({ openBrowser: !0, windowId: e2 }) } }), fr();
  }), ae(() => {
    Or.check(), wr = qn({ onOpenSuccess: (e2) => {
      ar(e2), Gn();
    }, onOpenFailed: ir, onProxyDetectWarning: Ar }), Tr = Jn(), Er = Yn(), Dr = Xn(), un2((e2) => {
      let t3 = e2.find((e3) => e3.key === "note");
      t3 && Reflect.set(t3._cache, "extend", Ee2.value.remarkDisplayStatus);
    }), $n(), y(() => $());
  }), x(() => {
    Or.stop(), wr?.(), Tr?.(), Er?.(), Dr?.();
  });
  async function kr(e2 = !1) {
    if (!q2("Profiles_speed_test_proxy")) return;
    if (!tr.value?.length) {
      !e2 && K2(-1, $t("\u6682\u65E0\u7A97\u53E3"));
      return;
    }
    if (Un.value) return;
    let t3 = jr(tr.value);
    if (!t3.length) !e2 && K2(-1, $t("\u5F53\u524D\u6CA1\u6709\u5DF2\u7ED1\u5B9A\u4EE3\u7406 IP \u7684\u7A97\u53E3"));
    else {
      Un.value = !0;
      try {
        await ft2(t3, { showConcurrentTaskTopBar: !e2, silent: e2 });
      } finally {
        Un.value = !1;
      }
    }
  }
  function Ar(e2, t3) {
    if (t3.some(st)) return;
    let n2 = t3.find(dt);
    if (!n2) return;
    let r2 = tr.value?.find((t4) => String(t4.dirId) === String(e2));
    if (!r2) return;
    let i2 = typeof r2.lastCountry == "string" ? r2.lastCountry.trim() : "";
    mt2({ loading: !1, checkStatus: Te.failure, proxyType: r2.buyProxyType, error: n2, ...i2 ? { lastCountry: i2 } : {} });
  }
  function jr(e2) {
    return e2.filter((e3) => e3.proxyCategory !== "noproxy" && (ct(ot(e3)) || lt(e3)));
  }
  async function Mr(e2) {
    let t3 = jr([].concat(e2));
    t3.length ? await ft2(t3) : K2(-1, $t("\u5F53\u524D\u6CA1\u6709\u5DF2\u7ED1\u5B9A\u4EE3\u7406 IP \u7684\u7A97\u53E3"));
  }
  async function Nr(e2 = Y2.value) {
    let t3 = e2.flatMap((e3) => e3.dirId ? [e3.dirId] : []);
    t3.length && (globalThis.__localActionTrack("ui_action").catch(console.error), await tn(Be(t3)));
  }
  async function Pr(e2) {
    if (!X2.value.some((e3) => e3.value)) return;
    let { filter_name: t3, filter_rule: n2, sort: r2 } = e2, i2 = Jt(X2.value), a3 = !!r2, { code: s3, msg: c3 } = a3 ? await o.window.userUpdateWindowFilterNameCreate({ sort: r2, filter_rule: n2, filter_condition: i2, old_filter_name: t3, new_filter_name: t3 }) : await o.window.userAddWindowFilterNameCreate({ filter_name: t3, filter_condition: i2, filter_rule: ln2.value.map((e3) => ({ name: e3.key, sort: e3._sort, status: +!!e3._visible })) });
    s3 === 0 && p2("updateFilterTabs", a3), K2(s3, c3);
  }
  function Fr(e2) {
    let { key: t3, value: n2 } = e2 || {};
    Q({ queryKey: n2 && (t3 || "name_remark"), queryValue: n2 }, !0);
  }
  let Ir = Zt({ saveLocalTrack: Qt2, tableRef: J2, filtersMenu: X2, router: v2, route: g2, getCurrentFilter: () => c2.currentFilter, copyTextFn: f, showToast: G2, onTransfer: Br, onMoveToProject: Hr, openBrowserBefore: Zn, setAsDefaultBrowser: Lr, createDesktopShortcut: Rr, multipleProxyChange: Wr, editProfileProxy: Ur, multipleProxyDelete: $r, buyProxyForProfiles: ei, multipleAccountChange: ti, tagsIconRef: wn2, addTag: Ge2, updateProfileMeta: Sr, singleModifyWindow: br2, onRemark: ii, onEditCookies: ni, openCookieRobot: ri, onClearCache: oi, onUpgradeCore: Cr, exportProfile: si, deleteProfile: ci, onTestProxy: Mr, createAutomation: Nr });
  async function Lr(e2) {
    let t3 = `${e2.windowSortNum}`.padStart(`${e2.maxWindowSort || 0}`.length, "0");
    const result = await globalThis.electronAPI.send("browser:setAsDefaultBrowser", { ...ie(e2), __orderName: `${Z.value}-${t3}` });
    G2(result.applied ? 0 : -1, result.message);
  }
  async function Rr(e2) {
    let t3 = `${e2.windowSortNum}`.padStart(`${e2.maxWindowSort || 0}`.length, "0");
    await globalThis.electronAPI.send("browser:createDesktopShortcut", { ...ie(e2), __orderName: `${Z.value}-${t3}` }), G2(0, $t("\u521B\u5EFA\u684C\u9762\u5FEB\u6377\u65B9\u5F0F\u6210\u529F"));
  }
  function zr(e2, t3) {
    R2.value.onboardingTaskStatus?.contextMenuGuideStatus ? Ke2(e2.event, { operation: e2.operation, operationHandler: async (n2) => {
      try {
        let r2 = { ...i(ie(n2)), _event: e2.event };
        await Ir(r2, t3);
      } catch (e3) {
        console.error(e3);
      }
    } }) : He2({ showHeader: !1, modal: !0, blockScroll: !0, handleCancel: () => Fe2({ contextMenuGuideStatus: !0 }), slots: { container: ({ handleCancel: e3 }) => I(it, { title: $t("\u9F20\u6807\u53F3\u952E\u7F16\u8F91"), desc: ({ class: e4 }) => I("div", { class: e4 }, [$t('\u7EDD\u5927\u591A\u6570\u7684 Roxy\u6D4F\u89C8\u5668\u5217\u8868\u5141\u8BB8\u60A8\u4FBF\u6377\u5730\u901A\u8FC7\u9F20\u6807\u53F3\u952E\u76F4\u63A5\u7F16\u8F91\uFF0C\u800C\u65E0\u9700\u5BFB\u627E"\u66F4\u591A\u64CD\u4F5C"\u6309\u94AE\u3002')]), video: nn("right-click.mp4"), onClose: e3, onConfirm: e3 }, null) } });
  }
  async function Br(e2, t3) {
    return await globalThis.electronAPI.send("browser:exportProfiles", { ids: e2.map((row) => row.id) });
  }
  function Vr(e2, t3) {
    (g2.name !== "project-item" || String(g2.params.id) !== String(e2)) && v2.push({ name: "project-item", params: { id: String(e2) }, query: t3 ? { title: t3 } : void 0 });
  }
  async function Hr(e2) {
    let t3 = await ze2(), n2 = [].concat(e2), { promise: r2, resolve: i2, reject: a3 } = Promise.withResolvers(), o2 = `[${n2.slice(0, 10).map((e3) => `${Z.value}-${e3.windowSortNum}`).join(", ")}${n2.length > 10 ? "..." : ""}]`, s3 = !1;
    return qe2({ title: $t("\u79FB\u52A8\u9879\u76EE"), content: $t("\u5C06\u79FB\u52A8 {names} \u5230\u6240\u9009\u9879\u76EE", { names: o2 }), inputs: [{ type: "select", name: "projectId", props: { placeholder: $t("\u8BF7\u9009\u62E9\u9879\u76EE"), options: t3, optionValue: "value", filter: !0, filterFields: ["label"] }, resolver: (e3) => e3.string({ invalid_type_error: $t("\u8BF7\u9009\u62E9\u9879\u76EE") }).min(1, $t("\u8BF7\u9009\u62E9\u9879\u76EE")) }], slots: { footer: ({ close: e3, loading: t4, cancelText: n3, confirmText: r3, formId: i3 }) => I("div", { class: "flex justify-end items-center self-stretch gap-3" }, [I(W, { size: "sm", text: !0, severity: "secondary", label: n3, onClick: e3 }, null), I(W, { size: "sm", severity: "secondary", outlined: !0, type: "submit", form: i3, label: $t("\u4FDD\u5B58\u5E76\u8DF3\u8F6C"), loading: t4, onClick: () => {
      s3 = !0;
    } }, null), I(W, { size: "sm", type: "submit", form: i3, label: r3, loading: t4, onClick: () => {
      s3 = !1;
    } }, null)]) }, onConfirm: async (e3) => {
      if (e3.projectId) {
        let r3 = t3.find((t4) => t4.value === e3.projectId)?.label, a4 = n2.filter((t4) => String(t4.projectId) !== String(e3.projectId)).map((e4) => e4.id);
        if (!a4.length) {
          if (s3) {
            Vr(e3.projectId, r3), i2();
            return;
          }
          K2(-1, $t("\u6240\u9009\u7A97\u53E3 {names} \u5DF2\u5728\u8BE5\u9879\u76EE\u4E2D", { names: o2 }));
          return;
        }
        await xr({ ids: a4, projectId: e3.projectId, requestType: z.MoveProject }, !c2.isProjectProfile).then(() => {
          n2.forEach((t4) => {
            t4.projectName = r3, t4.projectId = e3.projectId, t4.labelInfo = t4.labelInfo.filter((e4) => !Ft(e4.labelId)), t4.labelIds = t4.labelInfo.map((e4) => e4.labelId);
          }), lr(e3.projectId), c2.isProjectProfile && ur(), s3 && Vr(e3.projectId, r3);
        });
      }
      i2();
    }, onCancel: a3 }), r2;
  }
  async function Ur(e2) {
    if (e2.proxyCategory === "noproxy") {
      G2(-1, $t("\u672A\u7ED1\u5B9A\u4EE3\u7406 IP"));
      return;
    }
    if (e2.buyProxyType !== H.resource || e2.isEncryptProxy) {
      G2(-1, $t("\u8BE5\u4EE3\u7406 IP \u5DF2\u52A0\u5BC6\u65E0\u6CD5\u7F16\u8F91\uFF0C\u5982\u9700\u66F4\u6362\uFF0C\u8BF7\u5148\u5220\u9664\u6B64\u4EE3\u7406 IP \u6216\u9009\u62E9\u5176\u4ED6\u4EE3\u7406 IP"));
      return;
    }
    let t3 = Xe2(e2);
    await fe2({ title: $t("\u4E3A[{workspaceName}-{uid}]\u7F16\u8F91\u4EE3\u7406 IP", { workspaceName: Z.value, uid: e2.windowSortNum }), data: t3, mode: "proxy", onConfirm: async (t4) => {
      let { id: n2, dirId: r2 } = e2, i2 = { ...t4, id: n2, dirId: r2, moduleId: 0, proxyMethod: "custom", requestType: z.EditProxy }, { code: a3, msg: s3 } = await o.window.userMdfWindowInfoSingleV2Create(i2);
      if (K2(a3, s3), a3 !== 0) return !1;
      Reflect.deleteProperty(e2, "_checkRes"), B(e2, i2);
    } });
  }
  function Wr(e2, { proxyMethod: t3 }) {
    let n2 = [].concat(e2);
    return t3 === "choose" ? n2.length > 1 ? Kr(n2) : Gr(n2) : n2.length > 1 ? Jr(n2) : qr(n2);
  }
  function Gr(e2) {
    let { promise: t3, resolve: n2 } = Promise.withResolvers(), r2 = Xe2(e2[0]);
    T2.showDrawer({ title: $t("\u9009\u62E9\u4EE3\u7406 IP"), pt: { root: { class: "overflow-hidden rounded-2 border-0.5 max-w-full", style: { width: "min(860px, calc(100vw - 24px))" } } }, slots: { container: () => I(ht, { windows: e2, workspaceName: Z.value, data: r2, onConfirm: i2 }, null) }, onHide: n2 });
    async function i2(t4) {
      await Xr(e2, t4) && T2.hideDrawer();
    }
    return t3;
  }
  function Kr(e2) {
    let { promise: t3, resolve: n2 } = Promise.withResolvers();
    T2.showDrawer({ title: $t("\u6279\u91CF\u914D\u7F6E\u4EE3\u7406 IP"), pt: { root: { class: "overflow-hidden rounded-2 border-0.5 max-w-full", style: { width: "min(1280px, calc(100vw - 24px))" } } }, slots: { container: () => I(ht, { windows: e2, workspaceName: Z.value, onConfirm: r2 }, null) }, onHide: n2 });
    async function r2(e3) {
      await Yr(e3) && T2.hideDrawer();
    }
    return t3;
  }
  async function qr(e2) {
    await pn2.openProxyBuyAddDrawer({ onBuySuccess: (t3) => Xr(e2, t3), onAddConfirm: (t3) => Zr(e2, t3) });
  }
  function Jr(e2) {
    let { promise: t3, resolve: n2 } = Promise.withResolvers();
    T2.showDrawer({ title: $t("\u6DFB\u52A0\u4EE3\u7406 IP"), pt: { root: { class: "overflow-hidden rounded-2 border-0.5 max-w-full", style: { width: "min(1080px, calc(100vw - 24px))" } } }, slots: { container: () => I("div", { class: "h-full flex flex-col min-h-0 overflow-hidden" }, [I(Ut, { class: "h-full min-h-0 flex", showAdvertise: !0, onConfirm: r2, onBuy: i2 }, null)]) }, onHide: n2 });
    async function r2(t4) {
      await Qr(e2, t4) && T2.hideDrawer();
    }
    async function i2() {
      await ei(e2);
    }
    return t3;
  }
  async function Yr(e2) {
    let t3 = e2.map((e3) => {
      let t4 = { ...e3.proxy };
      return delete t4._proxyCount, delete t4.bindList, t4;
    }), n2 = ye(t3), { code: r2, msg: i2 } = await o.window.userMdfWindowDataBatchCreate({ type: V.ProxySelect, requestType: z.SelectProxy, ids: e2.map((e3) => e3.window.id), proxyList: n2 });
    return K2(r2, i2), r2 === 0 && (e2.forEach((e3, t4) => {
      let r3 = n2[t4];
      r3 && B(e3.window, { ...r3, moduleId: r3.moduleId, proxyMethod: "choose", proxyCategory: r3.proxyCategory || r3.protocol, buyProxyType: e3.proxy.proxyType ?? H.resource });
    }), !0);
  }
  async function Xr(e2, t3) {
    let { id: n2, ...r2 } = t3, { code: i2, msg: a3 } = await o.window.userMdfWindowDataBatchCreate({ type: V.ProxySelect, requestType: z.SelectProxy, ids: e2.map((e3) => e3.id), paramList: { moduleId: n2 ?? 0, proxyMethod: "choose", ...r2 } });
    if (K2(i2, a3), i2 !== 0) return !1;
    let { protocol: s3, proxyCategory: c3, proxyType: l2, isDirect: u2, ...d2 } = r2, f2 = { ...d2, moduleId: n2 ?? 0, isDirect: u2, proxyMethod: "choose", protocol: s3, proxyCategory: c3 || s3, buyProxyType: l2 ?? H.resource };
    return e2.forEach((e3) => {
      B(e3, f2);
    }), !0;
  }
  async function Zr(e2, t3) {
    let { id: n2, ...r2 } = t3, { code: i2, msg: a3 } = await o.window.userMdfWindowDataBatchCreate({ type: V.ProxyAdd, requestType: z.AddProxy, ids: e2.map((e3) => e3.id), paramList: { moduleId: n2 ?? 0, proxyMethod: "custom", ...r2 } });
    if (K2(i2, a3), i2 !== 0) return;
    let { protocol: s3, proxyCategory: c3, proxyType: l2, isDirect: u2, ...d2 } = r2, f2 = { ...d2, moduleId: n2 ?? 0, isDirect: u2, proxyMethod: "custom", protocol: s3, proxyCategory: c3 || s3, buyProxyType: l2 ?? H.resource };
    e2.forEach((e3) => {
      B(e3, f2);
    });
  }
  async function Qr(e2, t3) {
    let n2 = xe(t3), { code: r2, msg: i2 } = await o.window.userMdfWindowDataBatchCreate({ type: V.ProxyAdd, requestType: z.AddProxy, ids: e2.map((e3) => e3.id), proxyList: n2 });
    return K2(r2, i2), r2 === 0 && (e2.forEach((e3, t4) => {
      let r3 = n2[t4];
      r3 && B(e3, { ...r3, moduleId: 0, proxyMethod: "custom", proxyCategory: r3.proxyCategory || r3.protocol, buyProxyType: H.resource });
    }), !0);
  }
  function $r(e2) {
    let t3 = [].concat(e2);
    return $e2(t3);
  }
  async function ei(e2) {
    let t3 = [].concat(e2), n2 = t3.length === 1 ? ve(t3[0]) : void 0, r2 = await fn2(n2);
    r2 && await Xr(t3, r2);
  }
  function ti(e2, { operationType: t3, isChoose: n2 = !1 }) {
    let { promise: r2, resolve: i2 } = Promise.withResolvers(), a3 = [].concat(e2), s3 = t3 === "batch", c3 = n2 ? $t("\u9009\u62E9\u5E73\u53F0\u8D26\u53F7") : $t("\u6DFB\u52A0\u5E73\u53F0\u8D26\u53F7"), l2 = n2 ? () => I("div", { class: "h-full flex flex-col" }, [s3 && I("div", { class: "px-4 pt-4" }, [I(Ze, { class: "min-w-full", type: "warn", closable: !1, title: $t("\u6B64\u64CD\u4F5C\u5C06\u6E05\u7A7A\u6240\u9009\u7A97\u53E3\u4E2D\u7684\u5E73\u53F0\u8D26\u53F7\uFF0C\u5E76\u5C06\u65B0\u9009\u62E9\u7684\u5E73\u53F0\u8D26\u53F7\u7ED1\u5B9A\u81F3\u7A97\u53E3\uFF0C\u8BF7\u8C28\u614E\u64CD\u4F5C\u3002") }, null)]), I(Ct, { class: "flex-1 overflow-hidden", data: s3 ? void 0 : a3[0], onConfirm: u2 }, null)]) : () => I(St, { showRemark: !1, showCreateMore: !1, onConfirm: u2 }, null);
    T2.showDrawer({ title: c3, slots: { container: l2 }, onHide: i2 });
    async function u2(e3) {
      let { code: t4, msg: n3 } = s3 ? await d2(e3) : await f2(e3);
      T2.hideDrawer(), K2(t4, n3);
    }
    async function d2(e3) {
      let t4 = [].concat(e3).map((e4) => e4.id), r3 = n2 ? { platformUrlIds: t4 } : { windowPlatformList: [e3] }, i3 = n2 ? V.PlatformSelect : V.PlatformAdd, s4 = n2 ? z.SelectPlatform : z.AddPlatform, c4 = a3.map((e4) => e4.id), { code: l3, msg: u3 } = await o.window.userMdfWindowDataBatchCreate({ paramList: r3, type: i3, requestType: s4, ids: c4 });
      return l3 === 0 && (a3.forEach((t5, r4) => {
        let i4 = n2 && Array.isArray(e3) ? e3 : t5.windowPlatformList.concat({ ...e3, _tempId: (Date.now() + r4 ** 2).toString(32) });
        we(t5, i4);
      }), dr()), { code: l3, msg: u3 };
    }
    async function f2(e3) {
      let { id: t4, dirId: r3, windowPlatformList: i3 } = a3[0], s4 = { id: t4, dirId: r3 };
      n2 ? (s4.platformUrlIds = e3.filter((e4) => e4.id).map((e4) => e4.id), s4.requestType = z.SelectPlatform) : (s4.windowPlatformList = i3.concat({ ...e3, _tempId: Date.now().toString(32) }), s4.requestType = z.AddPlatform);
      let { code: c4, msg: l3 } = await o.window.userMdfWindowInfoSingleV2Create(s4);
      if (c4 === 0) {
        let t5 = s4.windowPlatformList || i3.filter((e4) => !e4.id).concat(e3);
        we(a3[0], t5), dr();
      }
      return { code: c4, msg: l3 };
    }
    return r2;
  }
  async function ni(e2) {
    let t3 = [].concat(e2);
    wt2({ data: t3, onConfirm: async (e3) => {
      let { code: n2, msg: r2 } = await o.window.userMdfWindowDataBatchCreate({ type: V.CookieEdit, requestType: z.EditCookie, ids: t3.map((e4) => e4.id), paramList: { cookie: e3 } });
      T2.hideDrawer(), K2(n2, r2), n2 === 0 && t3.forEach((t4) => {
        Reflect.set(t4, "cookie", e3);
      });
    } });
  }
  async function ri(e2) {
    let t3 = [].concat(e2);
    Vt2(t3);
  }
  async function ii(e2) {
    if (!q2("Profiles_edit_remark")) return;
    let { promise: t3, resolve: n2 } = Promise.withResolvers(), r2 = [].concat(e2);
    return qe2({ title: $t("\u4E3A\u6240\u9009\u7A97\u53E3\u6DFB\u52A0\u5907\u6CE8"), inputs: [{ type: "textarea", name: "windowRemark", value: r2[0].windowRemark, props: { placeholder: $t("\u8BF7\u8F93\u5165\u5907\u6CE8"), rows: 6 } }], onConfirm: async (e3) => {
      let t4 = r2.map((e4) => e4.id);
      await xr({ ids: t4, windowRemark: e3.windowRemark, requestType: z.EditRemark }, !0), r2.forEach((t5) => {
        t5.windowRemark = e3.windowRemark;
      });
    }, onHide: n2 }), t3;
  }
  function ai(e2) {
    e2.extend = !e2.extend, Ee2.value.remarkDisplayStatus !== e2.extend && dn2(e2.extend);
  }
  async function oi(e2) {
    oe2.open(qt, { props: { showHeader: !1, modal: !0, blockScroll: !0 }, data: { props: { title: $t("\u6E05\u7A7A\u7A97\u53E3\u7F13\u5B58"), content: $t("\u5E38\u7528\u4E8E\u89E3\u51B3\u672A\u77E5\u539F\u56E0\u7684\u73AF\u5883\u6253\u5F00\u5F02\u5E38\u6216\u7F13\u6162\u7B49\u95EE\u9898\u3002") }, onConfirm: async (t3) => {
      let r2 = e2.map((e3) => e3.dirId);
      await globalThis.electronAPI.send("browser:clearCache", { clearType: t3, dirIds: r2 });
    } } });
  }
  async function si(e2) {
    oe2.open(Gt, { props: { showHeader: !1, modal: !0, blockScroll: !0 }, data: { props: { data: e2, workspaceName: Z.value } } });
  }
  async function ci(e2, t3) {
    if ((await Qn(e2)).length !== e2.length) {
      K2(-1, $t("\u8BF7\u5148\u5173\u95ED\u7A97\u53E3"));
      return;
    }
    let n2 = t3.map((e3) => ({ id: e3, openStatus: !1 }));
    if (await o.window.userMdfWindowSyncV2Create(n2), e2.some((e3) => e3.statusInfo.some((e4) => e4.openUserId !== R2.value.id))) {
      K2(-1, $t("\u65E0\u6CD5\u5220\u9664\u6B63\u5728\u88AB\u5176\u4ED6\u6210\u5458\u4F7F\u7528\u7684\u7A97\u53E3"));
      return;
    }
    let { promise: r2, resolve: i2, reject: a3 } = Promise.withResolvers();
    return re2.require({ group: "deleteConfirmDialog", header: $t("\u5220\u9664\u7A97\u53E3"), message: $t("\u60A8\u786E\u8BA4\u8981\u5C06\u6240\u9009\u7A97\u53E3\u79FB\u81F3\u56DE\u6536\u7AD9\u5417\uFF1F"), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, checkboxProps: q2("Profiles_permanent_delete") && { label: $t("\u5F7B\u5E95\u5220\u9664"), value: !1 }, async accept() {
      if (this.checkboxProps.value) {
        let { code: n3, msg: r3 } = await o.window.userDelWindowInfoCreate({ ids: t3 });
        if (K2(n3, r3), n3 !== 0) return a3(r3);
        fr(), globalThis.electronAPI.send("browser:batchRemove", e2.map((e3) => e3.dirId));
      } else await xr({ ids: t3, isDelete: !0, requestType: z.Delete });
      i2();
    }, reject: a3, onHide: a3 }), r2;
  }
  async function li() {
    let { code: e2, msg: t3 } = await o.window.userCheckWindowTotalCountList();
    e2 === 0 ? v2.push({ name: "browser-create", query: { projectId: g2.params.id } }) : Ne2(e2, () => {
      G2(e2, t3);
    });
  }
  return a2({ tableRef: J2 }), (e2, n2) => {
    let r2 = Je, i2 = rt, a3 = Dt, o2 = Pe, s3 = Qe, c3 = et, l2 = nt, u2 = je, d2 = Me, f2 = Re;
    return C(), O(k, null, [I(d2, { ref: "windowTable", columns: j(ln2), "onUpdate:columns": n2[2] ||= (e3) => se(ln2) ? ln2.value = e3 : null, "cache-key": "browser-list", "list-cache-key": j(_).BROWSER_LIST, "list-cache-scope": cr, "list-cache-meta": gr, "list-cache-should-restore": mr, immediate: !1, skeleton: "", "table-sort": j(Ot), "table-request": j(or), "table-operation": j(kt), "operation-handler": j(Ir), "selection-mode": "multiple", "show-actions": !1, "virtual-scroller-options": { itemSize: 60 }, class: "window-table", "removable-sort": "" }, de({ "filter-after": M(() => [D("div", Dn, [j(Cn2) ? (C(), O("div", On, [I(j(W), { class: "!h-6.5 quick-create-entry__main", size: "xxs", outlined: "", severity: "primary", icon: "base/rx_ic_browser_flash", label: e2.$t("\u5FEB\u901F\u521B\u5EFA"), onClick: L(j(xn2), ["stop"]) }, null, 8, ["label", "onClick"]), F(I(j(W), { class: "!h-6.5 quick-create-entry__gear", size: "xxs", outlined: "", severity: "primary", icon: "base/rx_ic_gear", onClick: L(j(Sn2), ["stop"]) }, null, 8, ["onClick"]), [[f2, { value: e2.$t("\u914D\u7F6E\u5FEB\u901F\u521B\u5EFA\u504F\u597D") }, void 0, { top: !0 }]])])) : N("", !0), I(_t, { options: j(Hn), search: Fr, clear: Fr }, null, 8, ["options"]), I(r2, { class: "py-1", vertical: "", "line-only": "" }), I(Tt, { "current-filter": t2.currentFilter, "filters-menu": j(X2), "enabled-filter-save": !t2.isProjectProfile, "video-url": j(nn)("profile-filter.mp4"), "save-filters": Pr, onFilterChange: j(Q) }, null, 8, ["current-filter", "filters-menu", "enabled-filter-save", "video-url", "onFilterChange"]), j(q2)("Roxy_AI_Agent_All") ? F((C(), O("span", kn, [I(j(W), { class: "create-automation-button", size: "xxs", outlined: "", icon: "roxy-agent/rx-ic-create-automation", label: j(Tn2), disabled: !j(Y2).length || j(en2), onClick: n2[0] ||= L((e3) => Nr(), ["stop"]) }, null, 8, ["label", "disabled"])])), [[f2, { value: j(Y2).length ? "" : e2.$t("\u8BF7\u5148\u52FE\u9009\u7A97\u53E3") }, void 0, { top: !0 }]]) : N("", !0), j(q2)("Profiles_speed_test_proxy") ? (C(), P(j(W), { key: 2, size: "xxs", outlined: "", severity: "secondary", icon: "base/rx_ic_speed_test", label: e2.$t("\u6D4B\u8BD5\u5168\u90E8\u4EE3\u7406 IP"), onClick: n2[1] ||= L((e3) => kr(), ["stop"]) }, null, 8, ["label"])) : N("", !0)])]), "table-empty": M(() => [j(nr) ? (C(), P(i2, { key: 0, icon: "rx_illustration_filter.svg", title: e2.$t("\u6682\u65E0\u67E5\u8BE2\u7ED3\u679C"), desc: e2.$t("\u5F53\u524D\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u7ED3\u679C\uFF0C\u8BF7\u5C1D\u8BD5\u66F4\u6362\u5176\u4ED6\u7B5B\u9009\u6761\u4EF6\u3002") }, null, 8, ["title", "desc"])) : (C(), P(a3, { key: 1, icon: "base/rx_ic_browser", img: "empty-profiles.png", title: e2.$t("\u6682\u65E0\u7A97\u53E3"), desc: e2.$t("\u7A97\u53E3\u662F Roxy\u6D4F\u89C8\u5668\u7684\u6838\u5FC3\u529F\u80FD\uFF0C\u53EF\u4EE5\u5E2E\u52A9\u60A8\u7BA1\u7406\u591A\u4E2A\u6D4F\u89C8\u5668\u7A97\u53E3\uFF0C\u5E76\u4E3A\u5B83\u4EEC\u8BBE\u7F6E\u4E0D\u540C\u7684\u9879\u76EE\u3001\u5E73\u53F0\u8D26\u53F7\u3001\u4EE3\u7406 IP \u7B49\uFF0C\u4EE5\u65B9\u4FBF\u60A8\u66F4\u597D\u5730\u6267\u884C\u4E1A\u52A1\u64CD\u4F5C\u3002") }, { extra: M(() => [D("div", An, [j(q2)("Profiles_add") ? (C(), P(j(W), { key: 0, severity: "secondary", size: "md", icon: "base/rx_ic_browser_add", variant: "outlined", label: e2.$t("\u521B\u5EFA\u7A97\u53E3"), onClick: L(li, ["stop"]) }, null, 8, ["label"])) : N("", !0), I(Et, { "video-type": "create_profile", autoplay: !1 })])]), _: 1 }, 8, ["title", "desc"]))]), profile: M(({ data: e3 }) => [e3.id ? (C(), P(gt, { key: 0, "workspace-name": j(Z), data: e3, "open-message": j(Kn), onRefresh: fr }, null, 8, ["workspace-name", "data", "open-message"])) : (C(), O("div", Pn, [I(l2, { width: "44px", height: "16px" }), D("div", Fn, [(C(), O(k, null, le(3, (e4) => (C(), O(k, { key: e4 }, [e4 > 1 ? (C(), O("div", In)) : N("", !0), I(l2, { width: "24px", height: "24px", "border-radius": "4px" })], 64))), 64))])]))]), profileName: M(({ data: e3 }) => [e3.id ? (C(), P(Nt, { key: 0, data: e3, readonly: !j(q2)("Profiles_edit"), onRefresh: fr }, null, 8, ["data", "readonly"])) : (C(), P(l2, { key: 1, width: "160px", height: "24px", "border-radius": "4px" }))]), open: M(({ data: e3, index: t3 }) => [e3.id ? (C(), P(sn, { key: 0, "btn-id": `OPEN_${t3}`, data: e3, "open-message": j(Kn), "driver-obj": j(Wn), "driver-next": j(Gn), "send-first-open-record": j(er), icon: e3.coreType === j(m).Firefox ? "base/rx_ic_firefox" : "base/rx_ic_chrome", onOpen: j(Zn) }, null, 8, ["btn-id", "data", "open-message", "driver-obj", "driver-next", "send-first-open-record", "icon", "onOpen"])) : (C(), P(l2, { key: 1, width: "70px", height: "24px", "border-radius": "4px" }))]), noteHeader: M(({ column: { title: t3, _cache: n3 } }) => [D("div", Ln, [D("span", null, A(t3), 1), F(I(o2, { class: "cursor-pointer color-[#989CA0]", name: n3.extend ? "base/rx_ic_hidden" : "base/rx_ic_eye", onClick: L((e3) => ai(n3), ["stop"]) }, null, 8, ["name", "onClick"]), [[f2, { value: n3.extend ? e2.$t("\u6536\u8D77") : e2.$t("\u5C55\u5F00"), showDelay: 0 }, void 0, { top: !0 }]])])]), note: M(({ data: e3, column: { _cache: t3 } }) => [e3.id ? (C(), O("div", { key: 0, class: "inline-flex items-center gap-1", onClick: L((t4) => j(Ir)({ name: "addNotes" }, e3), ["stop"]) }, [F(I(j(W), { class: ce(["shrink-0", { "note-light": e3.windowRemark }]), text: "", severity: "secondary", size: "xxs", icon: e3.windowRemark ? "base/rx_ic_doc_fill" : "base/rx_ic_doc_add" }, null, 8, ["class", "icon"]), [[f2, { value: e3.windowRemark, showDelay: 0 }, void 0, { top: !0 }]]), t3.extend ? (C(), O("div", { key: 0, title: e3.windowRemark, class: "min-w-50 whitespace-pre-wrap note-content" }, A(e3.windowRemark), 9, zn)) : N("", !0)], 8, Rn)) : (C(), P(l2, { key: 1, width: "24px", height: "24px", "border-radius": "4px" }))]), project: M(({ data: e3 }) => [e3.id ? (C(), P(Rt, { key: 0, disabled: !j(q2)("Profiles_move_project"), labels: e3.labelInfo, "project-id": e3.projectId, "project-name": e3.projectName, onUpdate: (t3) => j(Sr)(t3, e3) }, null, 8, ["disabled", "labels", "project-id", "project-name", "onUpdate"])) : (C(), P(l2, { key: 1, width: "100px", height: "20px", "border-radius": "4px" }))]), tags: M(({ data: e3 }) => [e3.id ? (C(), P(zt, { key: 0, labels: e3.labelInfo, "project-id": e3.projectId, "gen-tag": j(q2)("Profiles_Label_add"), disabled: !j(q2)("Profiles_select_label"), onUpdate: (t3) => j(Sr)(t3, e3, "single") }, null, 8, ["labels", "project-id", "gen-tag", "disabled", "onUpdate"])) : (C(), P(l2, { key: 1, width: "70px", height: "24px", "border-radius": "12px" }))]), actions: M(({ data: e3 }) => [D("div", Bn, [e3.id ? (C(), P(u2, { key: 1, operation: j(kt)(e3), "loading-operation-map": e3.loadingOperationMap, onQuickClick: (t3) => j(Ir)(t3, e3), onMore: (t3) => zr(t3, e3) }, null, 8, ["operation", "loading-operation-map", "onQuickClick", "onMore"])) : (C(), O(k, { key: 0 }, le(3, (e4) => I(l2, { key: e4, width: "24px", height: "24px", "border-radius": "4px" })), 64))])]), _: 2 }, [j(rr) ? { name: "column-before", fn: M(({ ptProps: t3 }) => [I(c3, { pt: { ...t3, bodycell: `${t3.bodycell} !pr-0` }, "header-style": "width:0%", "body-style": "width:0%" }, { body: M(({ data: t4 }) => [t4.isTemporary ? (C(), P(s3, { key: 0 }, { default: M(() => [I(o2, { class: "pointer-events-none", name: "base/rx_ic_sand_glass", color: "var(--colors-icon-icon-warning)" })]), content: M(() => [D("div", jn, [D("div", Mn, A(e2.$t("\u8FC7\u671F\u65F6\u95F4: {expires}", { expires: j(Ye)(t4.expireTime, "yyyy/MM/dd") })), 1), D("div", Nn, A(e2.$t("\u4E34\u65F6\u7A97\u53E3\u5728\u8FC7\u671F\u524D\u4E0D\u5360\u7528\u60A8\u7684\u7A97\u53E3\u7528\u91CF\uFF0C\u53EF\u4EE5\u6B63\u5E38\u4F7F\u7528\u3002\u8FC7\u671F\u540E\u5C06\u4F1A\u5360\u7528\u60A8\u7684\u7A97\u53E3\u7528\u91CF\u3002\u7528\u91CF\u4E0D\u8DB3\u5C06\u65E0\u6CD5\u6253\u5F00\u7A97\u53E3\u3002")), 1)])]), _: 2 }, 1024)) : N("", !0)]), _: 1 }, 8, ["pt"])]), key: "0" } : void 0]), 1032, ["columns", "list-cache-key", "table-sort", "table-request", "table-operation", "operation-handler"]), I(zt, { ref: "tagsIcon", labels: [], "show-create-tag": !1, onUpdate: n2[3] ||= (e3) => j(Sr)(e3, j(J2)?.selectionData) }, null, 512), I(Bt, { visible: j(mn2), "onUpdate:visible": n2[4] ||= (e3) => se(mn2) ? mn2.value = e3 : null, "show-buy": j(hn2), "show-add": j(gn2), provider: j(_n2), onBuySuccess: j(vn2), onAddConfirm: j(yn2) }, null, 8, ["visible", "show-buy", "show-add", "provider", "onBuySuccess", "onAddConfirm"])], 64);
  };
} }), [["__scopeId", "data-v-c7206253"]]);
var br = { render: () => null };
export {Vn as n,br as t};