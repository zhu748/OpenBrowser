import {hn as e,qt as t,v as n} from "./utils-BIWenCnY.js";
import {C as r,F as i,P as a,St as o,V as s,W as c,Y as ee,_t as te,at as l,b as ne,d as u,en as d,f,h as p,i as m,in as h,jt as g,lt as _,m as v,p as y,q as re,st as ie,ut as ae,v as oe,x as b} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as x} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {u as se} from "./dist-NctnpPRe.js";
import {n as ce} from "./usetoast-DphSlejX.js";
import {t as le} from "./ry-table-do6kugym.js";
import {n as ue} from "./workspace-CNvgSgaH.js";
import {t as S} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as de} from "./tooltip-BYYKWrvu.js";
import {t as fe} from "./rx-button-DyzuUt-V.js";
import {t as pe} from "./rx-alert-A_y5uvgP.js";
import {t as me} from "./m-input-text-JVbCgVJP.js";
import {t as C} from "./custom-empty-CChX4pJt.js";
import {t as w} from "./m-input-multi-select-B7lX5Cnm.js";
import {t as T} from "./rx-avatar-h90aIpxl.js";
import {t as E} from "./profile-info-ExiJC1su.js";
import {t as D} from "./tutorial-video-Cb-jkf_V.js";
var O = { class: "w-full flex flex-col gap-2" };
var k = { class: "w-full flex gap-2.5" };
var A = { key: 0, class: "flex items-center gap-2" };
var j = { class: "text-3.25" };
var M = { key: 1, class: "flex items-center" };
var N = { class: "shrink-0", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" };
var P = ["fill"];
var F = { class: "text-3.25 ellipsis-1" };
var I = { key: 1, class: "flex items-center" };
var L = { class: "text-3.25" };
var R = { class: "whitespace-pre-wrap text-[var(--colors-text-text-tertiary)] text-3.5" };
var z = { class: "whitespace-pre-wrap tt-tertiary text-3.5" };
var he = { class: "ma-0 mt-1 pl-8 flex flex-col gap-1" };
var B = { class: "whitespace-pre-wrap tt-tertiary text-3.5" };
var ge = { class: "whitespace-pre-wrap tt-tertiary text-3.5" };
var _e = { class: "ellipsis-1 max-w-150px" };
var ve = { key: 0, class: "main-control-status select-none" };
var V = "sync-control:synchronizer:window-list:sort";
var H = S(r({ __name: "window-list", props: { selectionMode: {}, showType: { default: "opened" }, mainControlWindowDirId: { default: "" } }, setup(r2) {
  let S2 = r2, H2 = !1, ye = l("syncControlTable"), be = ce(), { mixpanelTrack: xe } = n(), U = o({ projectIds: [], labelIds: [], os: [], windowName: "" }), W = o([]), G = o(S2.mainControlWindowDirId), Se = { sortField: "windowSortNum", sortOrder: 1 }, K = o([{ title: $t("\u7A97\u53E3\u4FE1\u606F"), key: "windowSortNum", sortable: !0, slot: "profile", style: { width: "0%", minWidth: "125px" } }, { title: $t("\u7A97\u53E3\u540D\u79F0"), key: "windowName", sortable: !0, slot: "windowName", style: { width: "10%", minWidth: "120px" } }, { title: $t("\u72B6\u6001"), key: "status", slot: "status", style: { width: "25%" } }, { title: $t("\u64CD\u4F5C"), key: "actions", slot: "actions", style: { width: "10%" } }]);
  function q(e2) {
    return !!e2?.sortField && [1, -1].includes(e2.sortOrder) && K.value.some((t2) => t2.key === e2.sortField && t2.sortable);
  }
  function Ce() {
    try {
      let e2 = JSON.parse(localStorage.getItem(V) || "null");
      if (q(e2)) return { ...e2 };
    } catch (e2) {
      console.warn("Failed to parse synchronizer sort cache", e2);
    }
    return { ...Se };
  }
  function we(e2) {
    q(e2) ? localStorage.setItem(V, JSON.stringify(e2)) : localStorage.removeItem(V);
  }
  function Te() {
    return { data: Ce(), onChange: we };
  }
  let J = o(), Y = u(() => J.value?.filter((e2) => e2.$canUseSyncControl)), X = u(() => S2.showType === "syncing");
  se(() => ye.value?.rootElRef, (e2) => {
    e2[0] && setTimeout(() => {
      if (W.value.length > 1) {
        let e3 = document.querySelector(".p-datatable-table-container");
        console.log("tableContainer scrollWidth", e3?.scrollWidth);
      }
    }, 60);
  }, { childList: !0, subtree: !0 });
  let Ee = u(() => !Y.value?.length || Y.value?.length < 2 || !Y.value?.some((e2) => e2.dirId === G.value)), De = u(() => [{ name: "projectIds", placeholder: $t("\u5168\u90E8\u9879\u76EE"), options: W.value.reduce((e2, t2) => (e2.some((e3) => e3.value === t2.projectId) || e2.push({ label: t2.projectName, value: t2.projectId }), e2), []) }, { name: "labelIds", placeholder: $t("\u5168\u90E8\u6807\u7B7E"), options: W.value.flatMap((e2) => e2.labelInfo).reduce((e2, t2) => (e2.some((e3) => e3.value === t2.labelId) || e2.push({ ...t2, label: t2.labelName, value: t2.labelId }), e2), []) }, { name: "os", placeholder: $t("\u5168\u90E8\u7CFB\u7EDF"), options: W.value.reduce((e2, t2) => (e2.some((e3) => e3.value === t2.os) || e2.push({ label: t2.os === "IOS" ? "iOS" : t2.os, value: t2.os }), e2), []) }]), Z = u(() => W.value.filter((e2) => (!U.value.projectIds.length || U.value.projectIds.includes(e2.projectId)) && (!U.value.labelIds.length || e2.labelInfo.some((e3) => U.value.labelIds.includes(e3.labelId))) && (!U.value.os.length || U.value.os.includes(e2.os)) && (!U.value.windowName || e2.windowName.includes(U.value.windowName)))), Oe = e(() => {
    document.querySelectorAll(".p-datatable-selectable-row:not(:has(.can-use-sync-control))").forEach((e2) => {
      if (!e2.querySelector(".disable-mask")) {
        let t2 = document.createElement("div");
        t2.setAttribute("title", $t("\u514D\u8D39\u5957\u9910\u7684\u7A97\u53E3\uFF0C\u65E0\u6CD5\u8FDB\u884C\u540C\u6B65")), t2.onclick = (e3) => {
          e3.stopPropagation();
        }, t2.classList.add("disable-mask"), e2.appendChild(t2);
      }
    });
  }, 100);
  ie(Z, (e2) => {
    if (e2.length > 1 && (Oe(), !S2.mainControlWindowDirId)) {
      let t2 = e2.filter((e3) => e3.$canUseSyncControl);
      G.value = t2.some((e3) => e3.dirId === G.value) ? G.value : t2[0].dirId;
    }
  }), globalThis.electronAPI.on("browser:on-close", (e2) => {
    J.value = J.value?.filter((t2) => !e2.includes(t2.dirId)), Q();
  }), globalThis.electronAPI.on("browser:opened-browser-list-change", (e2) => {
    console.log("browser:opened-browser-list-change", e2), X.value || (W.value = e2.filter((e3) => e3.coreType !== t.Firefox));
  });
  async function Q() {
    let e2 = await globalThis.electronAPI.send(X.value ? "syncControl:getAllSyncingWindows" : "browser:getOpenedBrowser");
    W.value = e2.filter((e3) => e3.coreType !== t.Firefox), console.log("tableData.value", W.value);
  }
  function ke(e2) {
    globalThis.electronAPI.send("browser:batchLaunch", [e2]);
  }
  s(() => {
    Q();
  });
  async function $() {
    if (Y.value?.length < 2) {
      console.log("Please open at least two windows first", Y.value?.length);
      return;
    }
    let e2 = Y.value.find((e3) => ["Windows", "macOS", "Linux"].includes(e3.platform)), t2 = Y.value.find((e3) => ["Android", "IOS"].includes(e3.platform));
    if (e2 && t2) {
      be.add({ severity: "warn", summary: $t("\u540C\u6B65\u7A97\u53E3\u5931\u8D25"), detail: $t("\u684C\u9762\u7CFB\u7EDF\u7684\u7A97\u53E3\u6682\u65F6\u65E0\u6CD5\u548C\u624B\u673A\u7CFB\u7EDF\u7684\u7A97\u53E3\u8FDB\u884C\u540C\u6B65\u64CD\u4F5C") });
      return;
    }
    console.log("startSync", Y.value);
    let n2 = [.../* @__PURE__ */ new Set([G.value, ...Y.value?.map((e3) => e3.dirId)])];
    console.log("dirIds", n2), await globalThis.electronAPI.send("syncControl:start", n2), xe("synchronizer_success");
  }
  async function Ae() {
    await i(), document.querySelectorAll(".p-datatable-selectable-row:not(:has(.can-use-sync-control))").forEach((e2) => {
      let t2 = e2.querySelector(".p-checkbox-checked");
      if (t2) {
        t2.classList.remove("p-checkbox-checked");
        let e3 = t2.querySelector(".p-checkbox-icon");
        e3 && (e3.style.display = "none");
      }
    });
  }
  function je(e2) {
    X.value || (G.value = e2.dirId, H2 = !0);
  }
  globalThis.electronAPI.on("syncControl:start", $);
  function Me(e2) {
    W.value = e2.filter((e3) => e3.coreType !== t.Firefox), console.debug("handleValueChange", e2), e2.length && !H2 && !S2.mainControlWindowDirId && (G.value = e2[0].dirId);
  }
  return (e2, t2) => {
    let n2 = T, i2 = C;
    ee("i18n-t");
    let o2 = fe, s2 = le, l2 = de;
    return c(), p(m, null, [b(s2, a({ ref: "syncControlTable", selection: g(J), "onUpdate:selection": t2[1] ||= (e3) => te(J) ? J.value = e3 : null, "multiple-operation": !1, "data-list": g(Z), columns: g(K), "selection-mode": r2.selectionMode, paginator: !1, "show-actions": !1, "show-display": !1, "show-reload": !1, "context-menu": !1, "table-sort": Te, class: ["sync-control-table", { syncing: g(X), "no-data": g(Z).length === 0 }] }, e2.$attrs, { onRowSelectAll: Ae, onValueChange: Me }), oe({ "table-empty": _(() => [g(W).length && g(Z).length === 0 ? (c(), y(i2, { key: 0, icon: "rx_illustration_filter.svg", title: e2.$t("\u6682\u65E0\u67E5\u8BE2\u7ED3\u679C"), desc: e2.$t("\u5F53\u524D\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u7ED3\u679C\uFF0C\u8BF7\u5C1D\u8BD5\u66F4\u6362\u5176\u4ED6\u7B5B\u9009\u6761\u4EF6\u3002") }, null, 8, ["title", "desc"])) : (c(), y(i2, { key: 1, icon: "rx_illustration_roxybrowser.png", title: e2.$t("\u8BF7\u5148\u6253\u5F00\u81F3\u5C11\u4E24\u4E2A\u7A97\u53E3") }, { desc: _(() => [f("div", R, h(e2.$t("\u7A97\u53E3\u540C\u6B65\uFF1A\u5373\u7A97\u53E3\u7FA4\u63A7\uFF0C\u53EF\u540C\u65F6\u63A7\u5236\u591A\u4E2A\u7A97\u53E3\uFF0C\u5B9E\u73B0\u9F20\u6807\u540C\u6B65\uFF0C\u952E\u76D8\u540C\u6B65\uFF0C\u5927\u5E45\u63D0\u9AD8\u5DE5\u4F5C\u6548\u7387\u3002")), 1), f("div", null, [f("div", z, h(e2.$t("\u6CE8\u610F:")), 1), f("ol", he, [f("li", B, h(e2.$t("\u4E0D\u540C\u64CD\u4F5C\u7CFB\u7EDF\u7684\u7A97\u53E3\u65E0\u6CD5\u8FDB\u884C\u540C\u6B65\uFF0C\u76F8\u540C\u7CFB\u7EDF\u4F46\u5185\u6838\u4E0D\u4E00\u81F4\u7684\u7A97\u53E3\uFF0C\u6709\u6982\u7387\u51FA\u73B0\u540C\u6B65\u5931\u8D25\u7684\u60C5\u51B5\u3002")), 1), f("li", ge, h(e2.$t("Firefox \u5185\u6838\u7684\u7A97\u53E3\u6682\u4E0D\u652F\u6301\u7A97\u53E3\u540C\u6B65\u529F\u80FD")), 1)])]), v("", !0)]), extra: _(() => [b(D, { variant: "outlined", size: "xs", "video-type": "synchronizer", autoplay: !1 })]), _: 1 }, 8, ["title"]))]), profile: _(({ data: e3 }) => [b(E, { "workspace-name": g(ue)(e3?.workspaceName), data: e3, "filter-keys": ["os"], readonly: "", class: d({ "can-use-sync-control": e3.$canUseSyncControl }) }, null, 8, ["workspace-name", "data", "class"])]), windowName: _(({ data: e3 }) => [ae((c(), p("div", _e, [ne(h(e3.windowName), 1)])), [[l2, { value: e3.windowName }, void 0, { top: !0 }]])]), status: _(({ data: n3 }) => [n3.dirId === g(G) ? (c(), p("div", ve, h(e2.$t("\u4E3B\u63A7\u7A97\u53E3")), 1)) : (c(), p("div", { key: 1, class: d(["status", { action: !g(X) }]) }, [t2[2] ||= f("span", { class: "status-text" }, "--", -1), b(o2, { class: "status-btn", size: "xxs", severity: "secondary", icon: "base/rx_ic_cursor", label: e2.$t("\u8BBE\u4E3A\u4E3B\u63A7"), onClick: x((e3) => je(n3), ["stop"]) }, null, 8, ["label", "onClick"])], 2))]), actions: _(({ data: t3 }) => [b(o2, { size: "xxs", variant: "text", severity: "secondary", icon: "base/rx_ic_show_profile", label: e2.$t("\u67E5\u770B"), onClick: x((e3) => ke(t3.dirId), ["stop"]) }, null, 8, ["label", "onClick"])]), _: 2 }, [!g(X) && g(W).length ? { name: "table-header", fn: _(() => [f("div", O, [f("div", k, [(c(!0), p(m, null, re(g(De), ({ name: e3, ...t3 }) => (c(), y(w, a({ key: e3, modelValue: g(U)[e3], "onUpdate:modelValue": (t4) => g(U)[e3] = t4, class: "flex-1 min-w-0" }, { ref_for: !0 }, t3, { size: "xxs", "max-selected-labels": 1, "show-toggle-all": !1, filter: !1 }), { option: _((t4) => [e3 === "labelIds" ? (c(), p(m, { key: 0 }, [t4.option.value.startsWith?.("u_") ? (c(), p("div", A, [b(n2, { avatar: t4.option.avatar, name: t4.option.label?.slice(0, 2), color: t4.option.labelColor, size: 18, "font-size": 10 }, null, 8, ["avatar", "name", "color"]), f("span", j, h(t4.option.label), 1)])) : (c(), p("div", M, [(c(), p("svg", N, [f("path", { d: "M5 8C5 6.34315 6.34315 5 8 5C9.65685 5 11 6.34315 11 8C11 9.65685 9.65685 11 8 11C6.34315 11 5 9.65685 5 8Z", fill: t4.option.labelColor }, null, 8, P)])), f("div", F, h(t4.option.labelName), 1)]))], 64)) : (c(), p("div", I, [f("div", L, h(t4.option.label), 1)]))]), _: 2 }, 1040, ["modelValue", "onUpdate:modelValue"]))), 128)), b(me, { modelValue: g(U).windowName, "onUpdate:modelValue": t2[0] ||= (e3) => g(U).windowName = e3, "field-props": { class: "flex-1 min-w-0" }, "pre-icon": "base/rx_ic_magnify", size: "xxs", placeholder: e2.$t("\u641C\u7D22\u7A97\u53E3") }, null, 8, ["modelValue", "placeholder"])]), b(g(pe), { class: "!w-full", type: "info", title: e2.$t("Firefox \u5185\u6838\u7684\u7A97\u53E3\u6682\u4E0D\u652F\u6301\u7A97\u53E3\u540C\u6B65\u529F\u80FD"), closable: !1 }, null, 8, ["title"])])]), key: "0" } : void 0]), 1040, ["selection", "data-list", "columns", "selection-mode", "class"]), r2.showType === "opened" ? (c(), y(o2, { key: 0, disabled: g(Ee), label: g(Y)?.length ? e2.$t("\u5F00\u59CB\u540C\u6B65 {count} \u4E2A\u7A97\u53E3", { count: g(Y).length }) : e2.$t("\u5F00\u59CB\u540C\u6B65"), class: "start-sync-btn", onClick: x($, ["stop"]) }, null, 8, ["disabled", "label"])) : v("", !0)], 64);
  };
} }), [["__scopeId", "data-v-6736473a"]]);
export {H as t};