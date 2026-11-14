import {o as e} from "./rolldown-runtime-BCiCTKAo.js";
import {En as t,at as n,h as r,kr as i,ln as a,mt as o,nn as s,or as c,qt as l,rn as u,v as ee,vt as d,yt as te} from "./utils-BIWenCnY.js";
import {C as f,D as ne,F as re,L as ie,R as ae,St as p,V as oe,W as m,_t as h,at as se,bt as ce,d as g,en as _,f as v,h as y,in as b,jt as x,k as le,lt as S,m as C,p as w,st as ue,ut as T,x as E} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as D} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as de,n as fe} from "./agent-BmSFI9WH.js";
import {t as pe} from "./permission-DOhNJfB3.js";
import {b as me} from "./rich-html-link-VdBpR3Cm.js";
import {t as he} from "./ry-table-do6kugym.js";
import {n as ge} from "./workspace-CNvgSgaH.js";
import {Z as _e} from "./basecomponent-ClhuVxJN.js";
import {t as O} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as ve} from "./useconfirm-CV4GTWBW.js";
import {n as ye} from "./usedialog-Dh0xp3r7.js";
import {t as be} from "./tooltip-BYYKWrvu.js";
import {t as xe} from "./rx-button-DyzuUt-V.js";
import {t as k} from "./format-_cvrr_iF.js";
import {t as Se} from "./simplePopup-D6H7ykCr.js";
import {a as Ce,i as we,o as Te} from "./useProxyFormDrawer-r-7UykRS.js";
import {o as Ee,s as De,t as Oe} from "./quick-kroUOSn_.js";
import {t as A} from "./exceljs.min-DfecxsXL.js";
import {a as j,i as ke,n as Ae,o as je,r as Me,s as Ne} from "./quick-CZrtqSCy.js";
import {n as Pe} from "./useProfileEntityLabels-BfqbVpel.js";
import {t as Fe} from "./tutorial-video-Cb-jkf_V.js";
import {t as Ie} from "./custom-new-empty-CLCRgYs2.js";
import {t as Le} from "./views-header-CcjwXPjG.js";
import {t as M} from "./rx-input-radio-BGeLgzak.js";
import {t as Re} from "./profile-select-Cn2Zq-u9.js";
import {a as ze,i as Be} from "./useProfileOpenState-GCrr7PDa.js";
var N = e(A(), 1);
var P = { class: "flex flex-col gap-5 pt-6 export-accounts" };
var Ve = { class: "flex justify-between items-center" };
var F = { class: "title" };
var I = { class: "desc" };
var He = { class: "flex justify-end gap-2" };
var Ue = O(f({ __name: "export-accounts", setup(e2) {
  let t2 = le("dialogRef"), n2 = p(!0), r2 = p({});
  oe(() => {
    r2.value = t2?.value?.data?.props ?? {};
  });
  function i2() {
    let e3 = [{ key: "platformUrl", name: $t("\u5E73\u53F0") }, { key: "platformUserName", name: $t("\u8D26\u53F7") }];
    return r2.value.canViewPassword && e3.push({ key: "platformPassword", name: $t("\u5BC6\u7801") }), e3.push({ key: "platformEfa", name: "2FA" }, { key: "platformRemarks", name: $t("\u5907\u6CE8") }, { key: "window_info", name: $t("\u5DF2\u5173\u8054\u7A97\u53E3"), getText: (e4) => j(e4.window_info).map((e5) => `${r2.value.workspaceName}-${e5}`).join(", ") }), e3;
  }
  function a2() {
    let e3 = i2();
    return (r2.value.data ?? []).map((t3) => e3.reduce((e4, n3) => (e4[n3.key] = n3.getText?.(t3) ?? t3[n3.key] ?? "", e4), {}));
  }
  async function o2() {
    let e3 = i2(), t3 = new N.default.Workbook(), n3 = t3.addWorksheet("Accounts");
    n3.columns = e3.map(({ key: e4, name: t4 }) => ({ key: e4, header: t4, width: 24 })), n3.addRows(a2());
    let r3 = await t3.xlsx.writeBuffer(), o3 = new Blob([r3], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), s3 = document.createElement("a");
    s3.href = URL.createObjectURL(o3), s3.download = `accounts_${k(/* @__PURE__ */ new Date(), "yyyy-MM-dd HH_mm_ss")}.xlsx`, s3.click(), URL.revokeObjectURL(s3.href);
  }
  async function s2() {
    let e3 = (r2.value.data ?? []).map((e4) => ke(e4, r2.value.canViewPassword)), t3 = new Blob([e3.join(`
`)], { type: "text/plain;charset=utf-8" }), n3 = document.createElement("a");
    n3.href = URL.createObjectURL(t3), n3.download = `accounts_${k(/* @__PURE__ */ new Date(), "yyyy-MM-dd HH_mm_ss")}.txt`, n3.click(), URL.revokeObjectURL(n3.href);
  }
  async function c2() {
    n2.value ? await o2() : await s2(), t2?.value?.close();
  }
  return (e3, r3) => {
    let i3 = _e, a3 = M, o3 = xe;
    return m(), y("div", P, [v("div", Ve, [v("span", F, b(e3.$t("\u5BFC\u51FA\u6570\u636E")), 1), E(i3, { class: "cursor-pointer", name: "base/rx_ic_delete", size: "20", color: "#575D60", onClick: r3[0] ||= (e4) => x(t2)?.close() })]), v("div", I, b(e3.$t("\u8BF7\u9009\u62E9\u60A8\u8981\u5BFC\u51FA\u7684\u6570\u636E:")), 1), E(a3, { modelValue: x(n2), "onUpdate:modelValue": r3[1] ||= (e4) => h(n2) ? n2.value = e4 : null, options: [{ label: "Excel (.xlsx)", value: !0 }, { label: "Text (.txt)", value: !1 }] }, null, 8, ["modelValue"]), v("div", He, [E(o3, { severity: "secondary", outlined: "", label: e3.$t("\u53D6\u6D88"), onClick: r3[2] ||= (e4) => x(t2)?.close() }, null, 8, ["label"]), E(o3, { label: e3.$t("\u5BFC\u51FA\u6570\u636E"), onClick: c2 }, null, 8, ["label"])])]);
  };
} }), [["__scopeId", "data-v-51de0ca6"]]);
var We = { class: "flex flex-col w-full h-full" };
var Ge = { class: "flex flex-1 overflow-hidden" };
var Ke = { class: "flex gap-3" };
var qe = { class: "flex items-center gap-2 note-header w-full" };
var Je = ["onClick"];
var Ye = ["title"];
var Xe = { class: "select-none" };
var L = O(f({ __name: "index", setup(e2) {
  let f2 = me(), le2 = ve(), O2 = ye(), k2 = Te(), { userConfig: A2 } = de(ee()), [M2, N2] = fe(), { columns: P2, updateRemarkDisplayStatus: Ve2 } = Me(), { showSimpleDialog: F2 } = Se(), { check: I2 } = s(), He2 = o(), { invalidateCache: L2 } = te(), { isViewer: R } = de(n()), z = g(() => !R.value), Ze = g(() => ge(He2.currentWorkspace?.workspaceName)), B = g(() => I2(u.ViewPassword)), Qe = g(() => I2(u.BatchExport)), $e = Pe(), { openMessage: et, listenOpenMessage: tt, listenCloseMessage: nt, listenCloseSyncingDataMessage: rt, openBrowserBefore: it, syncOpenedBrowserState: at } = Be(), V = ce({}), H = ce({}), ot = 0, st = !1, U = p([]), W;
  function ct() {
    return U.value.length ? Promise.resolve() : (W ??= r.platform.userGetPlatformInfoList({}).then(({ code: e3, data: t2 }) => {
      e3 === 0 ? U.value = Ee(t2?.rows) : W = void 0;
    }).catch((e3) => {
      W = void 0, console.error("[account-list] failed to load platform catalog", e3);
    }), W);
  }
  ue(R, (e3) => {
    let t2 = P2.value.find((e4) => e4.key === "actions");
    t2 && (t2._visible = !e3);
  }, { immediate: !0 });
  let G = se("account"), K = p([]), q = p([]), lt = p([{ name: "copy", label: $t("\u590D\u5236"), icon: "base/rx_ic_copy", tooltip: $t("\u590D\u5236"), quick: !0 }, { name: "edit", label: $t("\u7F16\u8F91"), icon: "base/rx_ic_edit", power: I2(u.Edit), tooltip: $t("\u7F16\u8F91"), quick: !0 }, { name: "remark", label: $t("\u6DFB\u52A0\u5907\u6CE8"), icon: "base/rx_ic_doc_add", multiple: !0, multipleProps: { name: "G1", showLabel: !0 } }, { separator: !0 }, { name: "delete", label: $t("\u5220\u9664"), icon: "base/rx_ic_bin_1", power: I2(u.Delete), quick: !0, tooltip: $t("\u5220\u9664"), multiple: !0, multipleProps: { name: "G2", showLabel: !0 } }]), ut = [{ key: "platform", label: $t("\u5E73\u53F0\u540D\u79F0"), icon: "base/rx_ic_keys", syntax: "platform::" }, { key: "account", label: $t("\u8D26\u53F7\u540D\u79F0"), icon: "base/rx_ic_user_key", syntax: "account::" }, { key: "remark", label: $t("\u5907\u6CE8"), icon: "base/rx_ic_doc_article", syntax: "note::" }];
  function dt(e3) {
    let t2 = Array.isArray(e3) ? void 0 : e3, n2 = t2 ? [{ name: "openWindow", label: $t("\u6253\u5F00\u7A97\u53E3"), icon: (t2.id ? V[t2.id]?.coreType : void 0) === l.Firefox ? "base/rx_ic_firefox" : "base/rx_ic_chrome" }] : [];
    return z.value ? n2.concat(lt.value) : n2;
  }
  async function J(e3, t2) {
    switch (e3.name) {
      case "openWindow":
        await gt(t2);
        break;
      case "copy":
        wt(t2);
        break;
      case "edit":
        St(t2);
        break;
      case "remark":
        await Tt(t2);
        break;
      case "delete":
        await kt(t2);
        break;
      case "create":
        xt();
    }
  }
  function ft(e3) {
    let { key: t2, value: n2 } = e3 || {};
    G.value?.refresh({ queryKey: n2 && (t2 || "name_remark"), queryValue: n2 }, !0);
  }
  async function pt(e3) {
    let t2 = await r.platform.userGetPlatformInfoV2List(e3);
    return t2.code === 0 && (q.value = t2.data.rows, ht(t2.data.rows)), t2;
  }
  function Y(e3) {
    return j(e3.window_info)[0];
  }
  function mt(e3, t2) {
    if (e3 && H[e3]) return !0;
    if (!t2) return !1;
    if (t2.pending || t2.uploading) return !0;
    let n2 = t2.code === 1 || !!t2.error, r2 = t2.data?.percent === 100;
    return !(n2 || r2);
  }
  function X(e3) {
    let t2 = $e.value.open, n2 = e3.id;
    if (n2 && H[n2]) return { msg: $t("\u542F\u52A8\u4E2D..."), percent: 0, completed: !1, uploading: !1, disabled: !0, failed: !1, notice: "" };
    let r2 = n2 ? V[n2] : void 0, i2 = r2?.dirId ? et[r2.dirId] : void 0, a2 = i2?.data, o2 = i2?.code === 1 || !!i2?.error, s2 = a2?.percent === 100, c2 = [o2 ? i2?.message || i2?.error?.message : void 0, a2?.warningMessages?.filter(Boolean).join(`
`)].filter(Boolean).join(`
`);
    return { msg: !i2 || o2 ? t2 : a2?.message ?? t2, percent: a2?.percent || 0, completed: !!s2, uploading: !!i2?.uploading, disabled: mt(n2, i2), failed: !!o2, notice: c2 };
  }
  async function ht(e3) {
    let t2 = ++ot;
    e3.forEach((e4) => {
      e4.id && !Y(e4) && delete V[e4.id];
    });
    let n2 = e3.flatMap((e4) => {
      let t3 = Y(e4);
      if (!e4.id || !t3) return [];
      let n3 = V[e4.id];
      return n3?.windowSortNum === t3 && n3.dirId ? [] : [{ accountId: e4.id, sortNum: t3 }];
    });
    if (!n2.length) return;
    let i2 = [...new Set(n2.map((e4) => e4.sortNum))], { code: a2, data: o2 } = await r.window.userGetWindowInfoListList({ page_index: 1, page_size: i2.length, sortNums: i2.join(","), isDelete: 0 }).catch((e4) => (console.error("[account-list] failed to resolve related windows", e4), { code: -1, data: void 0 }));
    if (st || t2 !== ot || a2 !== 0 || !o2) return;
    let s2 = new Map(o2.rows.map((e4) => [e4.windowSortNum, e4]));
    n2.forEach(({ accountId: e4, sortNum: t3 }) => {
      let n3 = s2.get(t3);
      n3?.dirId ? V[e4] = n3 : delete V[e4];
    });
  }
  async function gt(e3) {
    let n2 = Y(e3), o2 = e3.id;
    if (!n2) z.value && I2("Profiles_select_platform") ? ($(e3), await i(200), M2(0, "", { severity: "warn", summary: $t("\u8BF7\u5148\u5173\u8054\u7A97\u53E3\uFF0C\u518D\u8FDB\u884C\u64CD\u4F5C") })) : M2(0, "", { severity: "warn", summary: $t("\u8BE5\u8D26\u53F7\u5C1A\u672A\u5173\u8054\u7A97\u53E3\uFF0C\u60A8\u6682\u65E0\u5173\u8054\u6743\u9650\uFF0C\u8BF7\u8054\u7CFB\u56E2\u961F\u62E5\u6709\u8005\u5904\u7406") });
    else if (o2 && !X(e3).disabled) {
      H[o2] = !0;
      try {
        let { code: i2, data: s2, msg: c2 } = await r.window.userGetWindowInfoListList({ page_index: 1, page_size: 1, sortNums: String(n2), isDelete: 0 });
        if (i2 !== 0) {
          N2(i2, c2);
          return;
        }
        let l2 = s2.rows.find((e4) => e4.windowSortNum === n2);
        if (!l2?.dirId) {
          delete V[o2], N2(-1, $t("\u7A97\u53E3/\u6570\u636E\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5"));
          return;
        }
        V[o2] = l2;
        let { osVersion: u2, "R-OS": ee2 } = await a();
        if (t(ee2, u2, l2.coreType, l2.coreVersion)) {
          N2(-1, $t("\u5F53\u524D\u7CFB\u7EDF\u4E0D\u652F\u6301\u4F7F\u7528{version}\u5185\u6838", { version: l2.coreVersion }));
          return;
        }
        if (!l2.openLimitStatus) {
          N2(-1, $t("\u901A\u7528\u7A97\u53E3\u989D\u5EA6\u4E0D\u8DB3\uFF0C\u65E0\u6CD5\u6253\u5F00"));
          return;
        }
        let d2 = e3.platformUrl?.trim();
        await it(l2, d2 ? { focusUrlByDirId: { [l2.dirId]: d2 } } : void 0);
      } catch (e4) {
        console.error("[account-list] failed to open related window", e4), N2(-1, $t("\u83B7\u53D6\u7A97\u53E3\u4FE1\u606F\u5931\u8D25"));
      } finally {
        delete H[o2];
      }
    }
  }
  function _t() {
    let e3 = G.value?.getCachedEntry?.();
    e3?.rows && (q.value = e3.rows, ht(e3.rows));
  }
  function Z() {
    L2(d.ACCOUNT_LIST), G.value?.refresh();
  }
  function vt() {
    L2(d.BROWSER_LIST);
  }
  let yt, bt, Q;
  ie(() => {
    yt = tt(), bt = nt(), Q = rt(), at();
  }), oe(() => {
    re(_t);
  }), ae(() => {
    st = !0, yt?.(), bt?.(), Q?.();
  });
  function xt() {
    f2.push({ name: "account-create" });
  }
  async function St(e3) {
    const fresh = await globalThis.__localRequest("accounts:list", { id: e3.id });
    e3 = { ...e3, ...fresh.rows[0] }, k2.showDrawer({ title: $t("\u7F16\u8F91\u5E73\u53F0\u8D26\u53F7"), slots: { container: () => ne(Oe, { data: e3, onClose: () => {
      k2.hideDrawer();
    }, onConfirm: async (e4) => {
      let { code: t2, msg: n2 } = await r.platform.userMdfPlatformInfoCreate({ platformList: [e4] });
      N2(t2, n2), t2 === 0 && Z();
    } }) } });
  }
  async function Ct(e3, t2, n2, i2 = "text") {
    let a2 = t2 === "platformPassword" && !I2(u.ViewPassword);
    (t2 === "platformUserName" || t2 === "platformPassword") && await ct();
    let o2 = De({ platformUrl: e3.platformUrl }, U.value), s2 = t2 === "platformUserName" ? o2.account : t2 === "platformPassword" ? o2.password : void 0;
    F2({ title: n2, inputs: [{ type: i2, name: t2, label: s2, value: a2 ? "" : e3?.[t2], props: { placeholder: n2, rows: i2 === "textarea" ? 6 : void 0 } }], onConfirm: async (n3) => {
      let i3 = { ...e3, [t2]: n3[t2]?.trim?.() ?? n3[t2] }, { code: a3, msg: o3 } = await r.platform.userMdfPlatformInfoCreate({ platformList: [i3] });
      N2(a3, o3), a3 === 0 && Z();
    } });
  }
  async function wt(e3) {
    I2(u.ViewPassword) && (e3 = (await globalThis.__localRequest("accounts:list", { id: e3.id })).rows[0]), c(ke(e3, I2(u.ViewPassword))), M2(0, $t("\u5DF2\u590D\u5236"));
  }
  function Tt(e3) {
    let { promise: t2, resolve: n2 } = Promise.withResolvers();
    return F2({ title: $t("\u4E3A\u6240\u9009\u8D26\u53F7\u6DFB\u52A0\u5907\u6CE8"), inputs: [{ type: "textarea", name: "platformRemarks", value: e3?.platformRemarks, props: { placeholder: $t("\u8BF7\u8F93\u5165\u5907\u6CE8"), rows: 6 } }], onConfirm: async (t3) => {
      let n3 = [].concat(e3).map((e4) => ({ ...e4, platformRemarks: t3.platformRemarks })), { code: i2, msg: a2 } = await r.platform.userMdfPlatformInfoCreate({ platformList: n3, requestType: pe.EditRemark });
      N2(i2, a2), i2 === 0 && Z();
    }, onHide: n2 }), t2;
  }
  function Et(e3) {
    e3.extend = !e3.extend, A2.value.remarkDisplayStatus !== e3.extend && Ve2(e3.extend);
  }
  async function Dt(e3, t2) {
    if (!t2.visible[e3]) {
      const fresh = await globalThis.__localRequest("accounts:list", { id: e3 }), row = q.value.find((row2) => String(row2.id) === String(e3));
      row && Object.assign(row, fresh.rows[0]);
    }
    Reflect.has(t2.visible, e3) ? Reflect.deleteProperty(t2.visible, e3) : Reflect.set(t2.visible, e3, !0);
  }
  function $(e3) {
    k2.showDrawer({ title: $t("\u9009\u62E9\u7A97\u53E3"), slots: { container: () => ne(Re, { linkedWindowSortNums: j(e3.window_info), onClose: () => k2.hideDrawer(), onConfirm: async (t2) => {
      if (!e3.id) return;
      let { code: n2, msg: i2 } = await r.window.userMdfPlatformBindWindowCreate({ platformId: e3.id, windowIds: t2.map((e4) => e4.id) });
      N2(n2, i2), n2 === 0 && (Z(), vt());
    } }) } });
  }
  async function Ot() {
    let e3 = K.value.length ? K.value : q.value;
    B.value && (e3 = await Promise.all(e3.map(async (row) => (await globalThis.__localRequest("accounts:list", { id: row.id })).rows[0]))), O2.open(Ue, { props: { showHeader: !1, modal: !0, blockScroll: !0 }, data: { props: { data: e3, workspaceName: Ze.value, canViewPassword: B.value } } });
  }
  function kt(e3) {
    let { promise: t2, resolve: n2 } = Promise.withResolvers(), i2 = [].concat(e3);
    return le2.require({ header: $t("\u5220\u9664\u5E73\u53F0\u8D26\u53F7"), message: $t("\u60A8\u786E\u8BA4\u8981\u5220\u9664\u6240\u9009\u5E73\u53F0\u8D26\u53F7\u5417\uFF1F\u5220\u9664\u540E\uFF0C\u5C06\u4F1A\u4E0E\u6240\u6709\u7ED1\u5B9A\u7684\u7A97\u53E3\u89E3\u7ED1\uFF0C\u4F46\u5DF2\u6709\u7684\u767B\u9646\u72B6\u6001\u4E0D\u4F1A\u4E22\u5931"), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: async () => {
      let e4 = i2.map((e5) => e5.id), { code: t3, msg: a2 } = await r.platform.userDelPlatformInfoCreate({ ids: e4 });
      N2(t3, a2), t3 === 0 && (Z(), vt()), n2();
    }, reject: n2, onHide: n2 }), t2;
  }
  return (e3, t2) => {
    let n2 = xe, r2 = Le, i2 = Ie, a2 = _e, o2 = ze, s2 = he, c2 = be;
    return m(), y("div", We, [E(r2, { title: e3.$route.meta.title }, { default: S(() => [x(z) && x(I2)(x(u).Add) ? (m(), w(n2, { key: 0, size: "xxs", icon: "base/rx_ic_add_keys", label: e3.$t("\u6DFB\u52A0\u8D26\u53F7"), onClick: D(xt, ["stop"]) }, null, 8, ["label"])) : C("", !0)]), _: 1 }, 8, ["title"]), v("div", Ge, [E(s2, { ref: "account", columns: x(P2), "onUpdate:columns": t2[2] ||= (e4) => h(P2) ? P2.value = e4 : null, selection: x(K), "onUpdate:selection": t2[3] ||= (e4) => h(K) ? K.value = e4 : null, "cache-key": "account-list", "list-cache-key": "account-list", "selection-mode": "multiple", class: "account-table", "table-request": pt, "table-operation": dt, "operation-handler": J, "virtual-scroller-options": { itemSize: 60 }, "show-gridlines": !1, "context-menu": "", "show-actions": x(z), "show-actions-menu": !1 }, { "display-before": S(() => [x(Qe) ? (m(), w(n2, { key: 0, severity: "secondary", outlined: "", size: "xxs", icon: "base/rx_ic_export", label: e3.$t("\u5BFC\u51FA\u6570\u636E"), onClick: D(Ot, ["stop"]) }, null, 8, ["label"])) : C("", !0)]), "filter-after": S(() => [E(Ce, { options: ut, search: ft, clear: ft })]), "table-empty": S(() => [E(i2, { icon: "base/rx_ic_keys", img: "empty-accounts.png", title: e3.$t("\u6682\u65E0\u5E73\u53F0\u8D26\u53F7"), desc: e3.$t("\u5728\u6B64\u6DFB\u52A0\u5E73\u53F0\u8D26\u53F7\u4EE5\u7BA1\u7406\uFF0C\u5E76\u66F4\u65B9\u4FBF\u5730\u4E0E\u7A97\u53E3\u8FDB\u884C\u7ED1\u5B9A\u3002") }, { extra: S(() => [v("div", Ke, [x(z) && x(I2)(x(u).Add) ? (m(), w(n2, { key: 0, outlined: "", severity: "secondary", size: "md", icon: "base/rx_ic_add_keys", label: e3.$t("\u6DFB\u52A0\u8D26\u53F7"), onClick: t2[0] ||= D((e4) => J({ name: "create" }), ["stop"]) }, null, 8, ["label"])) : C("", !0), E(Fe, { "video-type": "account_management", autoplay: !1 })])]), _: 1 }, 8, ["title", "desc"])]), platformInfo: S(({ data: e4 }) => [E(je, { data: e4, readonly: x(R), onClick: D(() => !x(R) && St(e4), ["stop"]) }, null, 8, ["data", "readonly", "onClick"])]), userName: S(({ data: t3 }) => [E(Ne, { value: t3.platformUserName, "show-copy": "", "show-edit": x(z), onEdit: (n3) => Ct(t3, "platformUserName", e3.$t("\u4FEE\u6539\u8D26\u53F7"), "textarea") }, null, 8, ["value", "show-edit", "onEdit"])]), password: S(({ data: t3, column: { _cache: n3 } }) => [E(Ne, { value: t3.platformPassword ?? (t3.hasPassword ? "********" : ""), masked: !x(B) || !n3.visible[t3.id], "show-masked": "", "show-copy": x(B), "show-edit": x(z) && x(I2)(x(u).Edit), onEdit: (n4) => Ct(t3, "platformPassword", e3.$t("\u4FEE\u6539\u5BC6\u7801"), "textarea"), onToggleMasked: (e4) => Dt(t3.id, n3) }, null, 8, ["value", "masked", "show-copy", "show-edit", "onEdit", "onToggleMasked"])]), remarkHeader: S(({ column: { title: t3, _cache: n3 } }) => [v("div", qe, [v("span", null, b(t3), 1), T(E(a2, { class: "cursor-pointer color-[#989CA0]", name: n3.extend ? "base/rx_ic_hidden" : "base/rx_ic_eye", onClick: D((e4) => Et(n3), ["stop"]) }, null, 8, ["name", "onClick"]), [[c2, { value: n3.extend ? e3.$t("\u6536\u8D77") : e3.$t("\u5C55\u5F00"), showDelay: 0 }, void 0, { top: !0 }]])])]), remark: S(({ data: e4, column: { _cache: t3 } }) => [v("div", { class: _(["inline-flex items-center gap-1", { "cursor-pointer": x(z) }]), onClick: D((t4) => x(z) && J({ name: "remark" }, e4), ["stop"]) }, [T(E(n2, { class: _(["shrink-0", { "note-light": e4.platformRemarks }]), text: "", severity: "secondary", size: "xxs", icon: e4.platformRemarks ? "base/rx_ic_doc_fill" : "base/rx_ic_doc_add" }, null, 8, ["class", "icon"]), [[c2, { value: e4.platformRemarks, showDelay: 0 }, void 0, { top: !0 }]]), t3.extend ? (m(), y("div", { key: 0, title: e4.platformRemarks, class: "min-w-50 whitespace-pre-wrap note-content" }, b(e4.platformRemarks), 9, Ye)) : C("", !0)], 10, Je)]), related: S(({ data: e4 }) => [E(we, { list: x(Ae)(e4), "show-add": x(z) && x(I2)("Profiles_select_platform"), onAdd: (t3) => $(e4) }, null, 8, ["list", "show-add", "onAdd"])]), open: S(({ data: r3 }) => [v("div", { class: "flex items-center gap-1", onClick: t2[1] ||= D(() => {
    }, ["stop"]) }, [E(n2, { class: "related-open", size: "xxs", outlined: "", severity: "secondary", disabled: !!Y(r3) && X(r3).disabled, onClick: D((e4) => gt(r3), ["stop"]) }, { default: S(() => [X(r3).percent && !X(r3).completed ? (m(), w(o2, { key: 0, size: "16", value: X(r3).percent }, null, 8, ["value"])) : C("", !0), v("span", Xe, b(X(r3).completed && !X(r3).uploading ? e3.$t("\u67E5\u770B") : X(r3).msg), 1)]), _: 2 }, 1032, ["disabled", "onClick"]), X(r3).notice ? T((m(), w(a2, { key: 0, name: "base/rx_ic_info_fill", class: _(X(r3).failed ? "text-red" : "text-orange") }, null, 8, ["class"])), [[c2, X(r3).notice, void 0, { top: !0 }]]) : C("", !0)])]), _: 1 }, 8, ["columns", "selection", "show-actions"])])]);
  };
} }), [["__scopeId", "data-v-8ad5ed8a"]]);
export {L as default};