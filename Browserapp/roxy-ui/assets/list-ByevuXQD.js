import {Transfers as LocalTransfers} from "./local-pages.js";
import {Dr as e,at as n,bt as r,h as i,hn as a,kr as o,mt as s,nn as c,v as l,vt as u} from "./utils-BIWenCnY.js";
import {C as d,D as f,Et as m,F as ee,L as h,St as g,W as _,Z as y,_t as b,at as x,d as S,en as ne,f as C,h as w,i as T,in as E,jt as D,lt as O,m as k,p as j,q as M,st as ie,ut as ae,vt as oe,x as N} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {f as se,o as P} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as le} from "./agent-BmSFI9WH.js";
import {n as F} from "./permission-DOhNJfB3.js";
import {y as de} from "./rich-html-link-VdBpR3Cm.js";
import {r as L} from "./proxy-create-mode-BCcLAAf5.js";
import {t as R} from "./ry-table-do6kugym.js";
import {n as z} from "./workspace-CNvgSgaH.js";
import {Z as V} from "./basecomponent-ClhuVxJN.js";
import {t as H} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as fe} from "./useconfirm-CV4GTWBW.js";
import {t as pe} from "./tooltip-BYYKWrvu.js";
import {t as me} from "./rx-button-DyzuUt-V.js";
import {t as ge} from "./rx-divider-Ci3C58Q3.js";
import {n as ve,r as ye} from "./contextmenu-BBjizTDn.js";
import {t as W} from "./useDialog-BC-nc8J-.js";
import {t as G} from "./custom-empty-CChX4pJt.js";
import {a as be,n as xe,t as Se} from "./tab-6bJNMvq4.js";
import {t as Ce} from "./simplePopup-D6H7ykCr.js";
import {t as q} from "./profile-info-ExiJC1su.js";
import {a as J} from "./useProxyFormDrawer-r-7UykRS.js";
import {t as X} from "./tags-icon-CZSs72B-.js";
import {t as we} from "./tags-D13xnrA2.js";
import {n as Ee,t as De} from "./renewal-reminder-drawer-C9_4HaAB.js";
var { check: $ } = c();
function Ne() {
  return [{ name: "restore", label: $t("\u6062\u590D"), tooltip: $t("\u6062\u590D\u7A97\u53E3"), icon: "base/rx_ic_refresh", iconClass: "text-gray-500", power: $("Profiles_restore"), quick: !0, multiple: !0, multipleProps: { name: "G1" } }, { name: "delete", label: $t("\u5F7B\u5E95\u5220\u9664"), tooltip: $t("\u5F7B\u5E95\u5220\u9664"), icon: "base/rx_ic_shredder", iconClass: "text-red", power: $("Profiles_permanent_delete"), quick: !0, multiple: !0, multipleProps: { name: "G1" } }];
}
function Pe() {
  return [{ key: "name", label: $t("\u7A97\u53E3\u540D\u79F0"), icon: "base/rx_ic_browser", syntax: "name::" }, { key: "remark", label: $t("\u5907\u6CE8"), icon: "base/rx_ic_doc_article", syntax: "note::" }, { key: "tag", label: $t("\u6807\u7B7E"), icon: "base/rx_ic_tag", syntax: "tag::" }, { key: "sortNum", label: " ID", icon: "base/rx_ic_id", syntax: "id::" }];
}
var Fe = { class: "flex-1 flex flex-col overflow-hidden" };
var Ie = { class: "inline-flex items-center gap-2" };
var Le = ["title"];
var Re = { class: "email" };
var ze = { class: "time" };
var Be = H(d({ __name: "index", setup(e2) {
  let n2 = [{ title: $t("\u7A97\u53E3\u4FE1\u606F"), key: "profile", slot: "profile", style: { width: "0%", minWidth: "180px" } }, { title: $t("\u7A97\u53E3\u540D\u79F0"), key: "windowName", style: { width: "10%", minWidth: "200px" } }, { title: $t("\u5907\u6CE8"), key: "note", slot: "note", style: { minWidth: "120px" } }, { title: $t("\u6807\u7B7E"), slot: "tags", style: { minWidth: "95px" } }, { title: $t("\u5220\u9664\u8BB0\u5F55"), key: "group", slot: "log", style: { minWidth: "140px" } }, { title: $t("\u5269\u4F59\u65F6\u95F4"), key: "remaining", style: { minWidth: "140px" }, slot: "remaining" }], r2 = fe(), a2 = l(), [o2, c2] = le(), u2 = s(), [d2] = W(), f2 = P(), p2 = Ne(), ee2 = Pe(), h2 = x("recycleTable");
  async function g2(e3) {
    return i.window.userGetWindowInfoListList({ ...e3, isDelete: 1, requestType: F.Recycle });
  }
  function v2(e3, t2) {
    let n3 = [].concat(t2).map((e4) => m(e4));
    switch (e3.name) {
      case "restore":
        b2(n3);
        break;
      case "delete":
        te2(n3);
    }
  }
  function y2(e3) {
    let { key: t2, value: n3 } = e3 || {};
    h2.value?.refresh({ queryKey: n3 && (t2 || "name_remark"), queryValue: n3 }, !0);
  }
  async function b2(e3) {
    const result = await i.window.userMdfWindowInfoBatchV2Create({ ids: e3.map((row) => row.id), isDelete: !1 });
    c2(result.code, result.msg), result.code === 0 && h2.value?.refresh();
  }
  async function te2(e3) {
    r2.require({ header: $t("\u5F7B\u5E95\u5220\u9664\u6240\u9009\u7A97\u53E3"), message: $t("\u60A8\u786E\u8BA4\u8981\u5F7B\u5E95\u5220\u9664\u6240\u9009\u7A97\u53E3\u5417\uFF1F"), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: async () => {
      let t2 = e3.map((e4) => e4.id), { code: n3, msg: r3 } = await i.window.userDelWindowInfoRecycleCreate({ ids: t2 });
      c2(n3, r3), n3 === 0 && (h2.value?.refresh(), globalThis.electronAPI.send("browser:batchRemove", e3.map((e4) => e4.dirId)));
    } });
  }
  function S2(e3) {
    if (e3 < 3) return f2.error;
    if (e3 < 7) return f2.warning;
  }
  return (e3, t2) => {
    let r3 = G, i2 = L, a3 = R;
    return _(), w("div", Fe, [N(a3, { ref: "recycleTable", "cache-key": "browser-recycle-list", "selection-mode": "multiple", columns: n2, "table-request": g2, operation: D(p2), "operation-handler": v2, "virtual-scroller-options": { itemSize: 60 }, "show-gridlines": !1, "show-display": !1, "show-actions-menu": !1 }, { "filter-after": O(() => [N(J, { options: D(ee2), search: y2, clear: y2 }, null, 8, ["options"])]), "table-empty": O(() => [N(r3, { icon: "rx_illustration_bin.svg", title: e3.$t("\u56DE\u6536\u7AD9\u6682\u65E0\u6570\u636E"), desc: e3.$t("\u5220\u9664\u7684\u7A97\u53E3\u5C06\u5C55\u793A\u5728\u6B64\u5904\u3002\u5982\u5728\u56DE\u6536\u7AD9\u7EE7\u7EED\u6E05\u9664\uFF0C\u7A97\u53E3\u5C06\u65E0\u6CD5\u518D\u6062\u590D\u3002") }, null, 8, ["title", "desc"])]), profile: O(({ data: e4 }) => [N(q, { "workspace-name": D(z)(D(u2).currentWorkspace?.workspaceName), data: e4, disabled: "" }, null, 8, ["workspace-name", "data"])]), note: O(({ data: e4 }) => [C("div", Ie, [N(i2, { value: e4.windowRemark, disabled: "" }, null, 8, ["value"]), C("div", { title: e4.windowRemark, class: "min-w-30 whitespace-pre-wrap note-content" }, E(e4.windowRemark), 9, Le)])]), tags: O(({ data: e4 }) => [N(X, { labels: e4.labelInfo, "project-id": e4.projectId, disabled: "" }, null, 8, ["labels", "project-id"])]), log: O(({ data: e4 }) => [C("div", Re, E(e4.email), 1), C("div", ze, E(e4.updateTime), 1)]), remaining: O(({ data: e4 }) => [C("div", { class: ne(S2(e4.remaining)) }, E(e4.remaining), 3)]), _: 1 }, 8, ["operation"])]);
  };
} }), [["__cssModules", { $style: { error: "_error_mwda6_1", warning: "_warning_mwda6_5" } }], ["__scopeId", "data-v-641d312d"]]);
var Ke = { class: "flex flex-col h-full w-full relative" };
var qe = { class: "flex items-center justify-between tabs" };
var Je = { class: "flex items-center text-inherit font-[Inter]" };
var Ye = { class: "inline-flex justify-start flex-1 suffix" };
var Xe = ["onClick"];
var Ze = { class: "flex flex-1 overflow-hidden" };
var Qe = { class: "flex-1 overflow-hidden" };
var $e = { class: "flex-auto" };
var et = H(d({ __name: "index", setup(t2) {
  let l2 = fe(), [d2] = W(), p2 = de(), m2 = s(), v2 = n(), [te2, A2] = le(), { showSimpleDialog: re2 } = Ce(), { check: P2 } = c(), F2 = r(), I2 = [{ id: "rx_1000", label: $t("\u5168\u90E8\u7A97\u53E3"), name: "profiles" }], L2 = [{ id: "rx_1002", label: $t("\u6536\u85CF"), name: "favorite", _params: { isOften: !0 } }, { id: "rx_1003", label: $t("\u5DF2\u6253\u5F00"), name: "opened", _params: { openStatus: !0 } }], R2 = S(() => [{ id: "rx_1004", label: $t("\u8F6C\u79FB\u4E2D"), name: "transfer", component: oe(LocalTransfers), visible: !0 }, { id: "rx_1001", label: $t("\u56DE\u6536\u7AD9"), icon: "base/rx_ic_bin_2", name: "trash", component: oe(Be), visible: P2("Profiles_view_recycle_bin") }].filter((e2) => e2.visible !== !1)), z2 = { rx_1002: $t("\u6536\u85CF"), rx_1003: $t("\u5DF2\u6253\u5F00") }, B2 = `localTabs_${m2.currentWorkspace?.id}`, H2 = e(localStorage.getItem(B2)) || L2.map((e2) => ({ ...e2, sort: -1, isLocal: !0, disabledFilter: !0 }));
  H2.forEach((e2) => {
    z2[e2.id] && (e2.label = z2[e2.id]);
  });
  let U2 = x("tabList"), _e2 = x("config"), G2 = g(I2), K2 = S({ get() {
    return G2.value.length > I2.length ? G2.value.slice(I2.length) : [];
  }, set(e2) {
    G2.value.splice(I2.length, G2.value.length - I2.length, ...e2);
  } }), q2 = g(!1), J2 = g(G2.value[0].id), Y2 = S(() => {
    let e2 = R2.value.find((e3) => e3.id === J2.value)?.component;
    return { component: e2, visible: !!e2 };
  }), X2 = S(() => G2.value.find((e2) => e2.id === J2.value)), Te2 = a(() => {
    U2.value?.updateInkBar();
  }, 100);
  ie(G2, Te2);
  function Z2() {
    let e2 = m2.currentWorkspace?.id;
    if (!e2) return;
    let t3 = F2.get(u.BROWSER_LIST, String(e2), { projectId: "" })?.meta?.activeTabId;
    t3 && (G2.value.find((e3) => e3.id === t3) ?? R2.value.find((e3) => e3.id === t3)) && (J2.value = t3);
  }
  h(() => {
    Z2(), Oe2(R2.value), Z2(), ee(() => {
      Q2();
    });
  });
  async function Q2() {
    let { code: e2, data: t3, msg: n2 } = await i.window.userGetWindowFilterNameListList();
    if (e2 === 0) {
      let e3 = t3.map((e4, t4) => ({ ...e4, id: `${t4}`, name: e4.filter_name, label: e4.filter_name })).concat(H2).sort((e4, t4) => e4.sort - t4.sort);
      G2.value = [...I2, ...e3], Oe2(G2.value), Z2(), setTimeout(() => {
        U2.value?.updateInkBar();
      }, 1e3);
    }
    A2(e2, n2);
  }
  function Oe2(e2) {
    let t3 = e2.find((e3) => e3.id === p2.query.activeTabId);
    t3 && (J2.value = t3.id);
  }
  async function ke2(e2, t3) {
    J2.value = e2;
  }
  async function Ae2(e2 = !1) {
    await Q2(), e2 || (J2.value = G2.value.at(-1).id);
  }
  async function je2(e2) {
    re2({ title: $t("\u7F16\u8F91\u7B5B\u9009\u5668\u540D\u79F0"), inputs: [{ type: "text", name: "filter_name", value: e2.label, props: { placeholder: $t("\u8BF7\u8F93\u5165\u7B5B\u9009\u5668\u540D\u79F0") }, resolver: (e3) => e3.string({ invalid_type_error: $t("\u8BF7\u8F93\u5165\u7B5B\u9009\u5668\u540D\u79F0") }).min(1, $t("\u8BF7\u8F93\u5165\u7B5B\u9009\u5668\u540D\u79F0")) }], onConfirm: async (t3) => {
      let { code: n2, msg: r2 } = await i.window.userUpdateWindowFilterNameCreate({ ...e2, old_filter_name: e2.filter_name, new_filter_name: t3.filter_name });
      n2 === 0 && (e2.name = t3.filter_name, e2.label = t3.filter_name), A2(n2, r2);
    } });
  }
  async function Me2(e2) {
    l2.require({ header: $t("\u5220\u9664\u7B5B\u9009\u5668"), message: $t("\u60A8\u786E\u8BA4\u8981\u5220\u9664\u6240\u9009\u7B5B\u9009\u5668\u5417\uFF1F"), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: async () => {
      try {
        let { code: t3, msg: n2 } = await i.window.userDeleteWindowFilterNameCreate({ filter_name: e2.label });
        if (A2(t3, n2), t3 !== 0) return;
        X2.value?.label === e2.label && (J2.value = G2.value[G2.value.length - 2].id, await o(300)), G2.value = G2.value.filter((t4) => t4.label !== e2.label);
      } catch (e3) {
        A2(-1, e3);
      }
    } });
  }
  async function $2() {
    d2({ showHeader: !1, modal: !0, blockScroll: !0, pt: { content: "!pa-0" }, slots: { container: ({ hideModal: e2 }) => f(we, { onClose: e2 }) } });
  }
  function Ne2(e2) {
    _e2.value?.show(e2);
  }
  function Pe2() {
    q2.value = !0;
  }
  async function Fe2() {
    if (q2.value) {
      q2.value = !1;
      let { locals: e2, sort_data: t3 } = G2.value.slice(I2.length).reduce((e3, t4, n3) => (t4.isLocal ? e3.locals.push({ ...t4, sort: n3 }) : e3.sort_data.push({ name: t4.label, sort: n3 }), e3), { locals: [], sort_data: [] });
      localStorage.setItem(B2, JSON.stringify(e2));
      let { code: n2, msg: r2 } = await i.window.userUpdateWindowFilterSortCreate({ sort_data: t3 });
      A2(n2, r2);
    }
  }
  return (e2, t3) => {
    let n2 = Se, r2 = xe, i2 = be, a2 = me, o2 = ge, s2 = ye, c2 = pe;
    return _(), w(T, null, [C("div", Ke, [C("div", qe, [N(i2, { value: D(J2), "onUpdate:value": t3[0] ||= (e3) => b(J2) ? J2.value = e3 : null, class: "overflow-hidden", scrollable: "" }, { default: O(() => [N(r2, { ref: "tabList" }, { default: O(() => [(_(!0), w(T, null, M(D(G2), (e3) => (_(), j(n2, { key: e3.id || e3.label, value: e3.id }, { default: O(() => [C("div", Je, E(e3.label), 1)]), _: 2 }, 1032, ["value"]))), 128)), (_(!0), w(T, null, M(D(R2), (e3) => (_(), j(n2, { key: e3.id, class: "!pa-0 opacity-0", value: e3.id }, null, 8, ["value"]))), 128))]), _: 1 }, 512)]), _: 1 }, 8, ["value"]), C("div", Ye, [(_(!0), w(T, null, M(D(R2), (e3) => (_(), w("div", { key: e3.id, class: ne(["flex items-center cursor-pointer break-keep suffix-tab", { active: e3.id === D(J2) }]), onClick: (t4) => ke2(e3.id, t4) }, [N(D(V), { name: e3.icon, color: "var(--colors-icon-icon-note)" }, null, 8, ["name"]), C("span", null, E(e3.label), 1)], 10, Xe))), 128))]), N(a2, { text: "", severity: "secondary", size: "xs", icon: "base/rx_ic_gear", onClick: Ne2 }), D(P2)("Profiles_Label_view_page") ? (_(), w(T, { key: 0 }, [N(o2, { class: "mx-1 !h-4", vertical: "", "line-only": "" }), ae(N(a2, { text: "", severity: "secondary", size: "xs", icon: "base/rx_ic_tag", onClick: $2 }, null, 512), [[c2, { value: e2.$t("\u6807\u7B7E\u7BA1\u7406") }, void 0, { top: !0 }]])], 64)) : k("", !0)]), C("div", Ze, [D(Y2).visible ? (_(), j(y(D(Y2).component), { key: 0 })) : k("", !0), ae(C("div", Qe, [N(D(Ee), { "current-filter": D(X2), onUpdateFilterTabs: Ae2, onSwitchTab: ke2 }, null, 8, ["current-filter"])], 512), [[se, !D(Y2).visible]])]), N(De)]), N(s2, { ref: "config", onHide: Fe2 }, { default: O(() => [(_(), w(T, null, M(I2, (e3) => C("div", { key: e3.name, class: "sort-item" }, [N(D(V), { name: "base/rx_ic_dots_drag", class: "invisible" }), C("span", null, E(e3.label), 1)])), 64)), N(D(ve), { modelValue: D(K2), "onUpdate:modelValue": t3[1] ||= (e3) => b(K2) ? K2.value = e3 : null, animation: 150, onChange: Pe2 }, { default: O(() => [(_(!0), w(T, null, M(D(K2), (e3) => (_(), w("div", { key: e3.id, class: "sort-item" }, [N(D(V), { name: "base/rx_ic_dots_drag", class: "cursor-grab handle" }), C("span", $e, E(e3.label), 1), e3.isLocal ? k("", !0) : (_(), w(T, { key: 0 }, [N(D(V), { name: "base/rx_ic_edit", class: "cursor-pointer", onClick: (t4) => je2(e3) }, null, 8, ["onClick"]), N(D(V), { name: "base/rx_ic_bin_1", class: "cursor-pointer", onClick: (t4) => Me2(e3) }, null, 8, ["onClick"])], 64))]))), 128))]), _: 1 }, 8, ["modelValue"]), (_(!0), w(T, null, M(D(R2), (e3) => (_(), w("div", { key: e3.id, class: "sort-item" }, [N(D(V), { name: "base/rx_ic_dots_drag", class: "invisible" }), C("span", null, E(e3.label), 1)]))), 128))]), _: 1 }, 512)], 64);
  };
} }), [["__scopeId", "data-v-bf94cffb"]]);
export {et as default};