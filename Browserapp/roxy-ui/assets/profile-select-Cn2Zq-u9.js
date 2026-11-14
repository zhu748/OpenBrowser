import {h as e,mt as t,nn as n,o as r,r as i,v as a,xr as o} from "./utils-BIWenCnY.js";
import {C as s,F as c,L as l,St as u,W as d,_t as f,at as ee,d as p,en as te,f as m,h,in as g,jt as _,lt as v,m as y,p as b,ut as x,x as S} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as C} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as ne} from "./agent-BmSFI9WH.js";
import {i as re} from "./rich-html-link-VdBpR3Cm.js";
import {r as ie,t as ae} from "./ry-table-do6kugym.js";
import {n as oe} from "./workspace-CNvgSgaH.js";
import {Z as se} from "./basecomponent-ClhuVxJN.js";
import {t as w} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as ce} from "./tooltip-BYYKWrvu.js";
import {t as le} from "./rx-button-DyzuUt-V.js";
import {t as ue} from "./rx-divider-Ci3C58Q3.js";
import {n as de} from "./useRouteContext-Cfh7KChG.js";
import {t as fe} from "./custom-empty-CChX4pJt.js";
import {t as pe} from "./profile-info-ExiJC1su.js";
import {a as me,r as T} from "./useProxyFormDrawer-r-7UykRS.js";
import {t as E} from "./custom-filters-D_902RzL.js";
import {t as D} from "./useTutorialEntityLabels-BJzywsZZ.js";
import {t as O} from "./custom-new-empty-CLCRgYs2.js";
import {a as k,n as A,o as j,r as M,s as N,t as P} from "./useQuickCreate-DgAf1jWE.js";
import {n as F,t as I} from "./tags-icon-CZSs72B-.js";
var L = { class: "profile-select" };
var R = { class: "profile-select__body" };
var z = { class: "flex shrink-0 items-start gap-2" };
var he = { class: "flex min-w-0 flex-1 items-start gap-2" };
var ge = { key: 0, class: "quick-create-entry flex shrink-0 items-stretch" };
var _e = { class: "profile-select__table" };
var ve = { class: "flex items-center gap-2 note-header" };
var ye = { class: "inline-flex items-center gap-1" };
var be = ["title"];
var xe = { class: "profile-select__footer" };
var B = w(s({ __name: "profile-select", props: { linkedWindowSortNums: { default: () => [] }, cacheKey: { default: "account-profile-select" }, emptyTitle: {}, emptyDesc: {} }, emits: ["confirm", "close"], setup(s2, { emit: w2 }) {
  let B2 = w2, Se = D(), { isEcommerce: Ce } = de(), V = p(() => s2.emptyTitle ?? (Ce.value ? $t("\u6682\u65E0\u8D26\u53F7") : $t("\u6682\u65E0\u7A97\u53E3"))), we = p(() => s2.emptyDesc ?? Se.value.profileSelectEmptyDesc), Te = t(), { check: Ee } = n(), { userConfig: H } = ne(a()), De = p(() => oe(Te.currentWorkspace?.workspaceName)), Oe = A(), { canQuickCreate: ke, onQuickCreateMainClick: Ae, onQuickCreateSettingsClick: je } = P(), Me = p(() => ke() && Ee("Profiles_add")), { columns: U, updateColumns: Ne, updateRemarkDisplayStatus: Pe } = T(j(), ["open", "actions", "createTime", "updateTime", "openTime", "transferUserName"]), W = ee("profileSelect"), G = u([]), K = u(), q = u({}), J = u(!1), Y = u(!1);
  l(() => {
    Ne((e2) => {
      let t2 = e2.find((e3) => e3.key === "note");
      t2?._cache && Reflect.set(t2._cache, "extend", H.value.remarkDisplayStatus);
    }), Re(), Le();
  });
  let Fe = /* @__PURE__ */ new Set(["isOften", "openStatus", "createTime", "modfiyTime"]);
  function Ie(e2) {
    let t2 = [];
    for (e2.forEach((e3) => {
      Fe.has(e3.name) || (!e3.separator || t2.length !== 0 && !t2.at(-1)?.separator) && t2.push(e3);
    }); t2.at(-1)?.separator; ) t2.pop();
    return t2;
  }
  async function Le() {
    try {
      K.value = Ie(await M());
    } catch (e2) {
      console.error("[Profile:select] load window filters failed", e2);
    }
  }
  function X(e2 = {}) {
    return i({ ...q.value, ...e2, ...r(K.value) });
  }
  function Z(e2 = {}, t2 = !1) {
    let n2 = X(e2);
    return Y.value = !o(n2), W.value?.refresh(n2, t2);
  }
  async function Q() {
    if (!J.value) {
      J.value = !0;
      try {
        await W.value?.refresh(X(), !1);
      } finally {
        J.value = !1;
      }
    }
  }
  re("refreshProfileList", () => {
    Q();
  });
  async function Re() {
    let t2 = s2.linkedWindowSortNums;
    if (!t2.length) return;
    let { code: n2, data: r2 } = await e.window.userGetWindowInfoListList({ page_index: 1, page_size: t2.length, sortNums: t2.join(","), isDelete: 0 });
    n2 === 0 && Array.isArray(r2?.rows) && (G.value = r2.rows);
  }
  function $(e2) {
    let { key: t2, value: n2 } = e2 || {};
    q.value = n2 ? { queryKey: t2 || "name_remark", queryValue: n2 } : {}, Z({}, !0);
  }
  function ze(e2) {
    if (!s2.linkedWindowSortNums.length) return;
    let t2 = Array.isArray(G.value) ? G.value : [], n2 = new Set(s2.linkedWindowSortNums), r2 = new Set(t2.map((e3) => e3?.id)), i2 = [...t2];
    e2?.forEach((e3) => {
      n2.has(e3.windowSortNum) && !r2.has(e3.id) && (i2.push(e3), r2.add(e3.id));
    }), Array.isArray(G.value) && i2.length === t2.length || (G.value = i2);
  }
  async function Be(t2) {
    let n2 = await e.window.userGetWindowInfoListList({ ...t2, isDelete: 0 });
    return n2.code === 0 && (await c(), ze(n2.data?.rows)), n2;
  }
  function Ve(e2) {
    e2.extend = !e2.extend, H.value.remarkDisplayStatus !== e2.extend && Pe(e2.extend);
  }
  function He() {
    B2("confirm", Array.isArray(G.value) ? G.value : []), B2("close");
  }
  return (e2, t2) => {
    let n2 = le, r2 = ue, i2 = ie, a2 = fe, o2 = O, c2 = se, l2 = ae, u2 = ce;
    return d(), h("div", L, [m("div", R, [m("div", z, [m("div", he, [_(Me) ? (d(), h("div", ge, [S(n2, { class: "!h-6.5 quick-create-entry__main", size: "xxs", outlined: "", severity: "primary", icon: "base/rx_ic_browser_flash", label: e2.$t("\u5FEB\u901F\u521B\u5EFA"), onClick: C(_(Ae), ["stop"]) }, null, 8, ["label", "onClick"]), x(S(n2, { class: "!h-6.5 quick-create-entry__gear", size: "xxs", outlined: "", severity: "primary", icon: "base/rx_ic_gear", onClick: C(_(je), ["stop"]) }, null, 8, ["onClick"]), [[u2, { value: e2.$t("\u914D\u7F6E\u5FEB\u901F\u521B\u5EFA\u504F\u597D") }, void 0, { top: !0 }]])])) : y("", !0), S(me, { class: "shrink-0", options: _(Oe), search: $, clear: $ }, null, 8, ["options"]), S(r2, { class: "shrink-0 py-1", vertical: "", "line-only": "" }), S(E, { "filters-menu": _(K), "enabled-filter-save": !1, onFilterChange: Z }, null, 8, ["filters-menu"])]), S(i2, { class: "shrink-0", loading: _(J), onClick: Q }, null, 8, ["loading"])]), m("div", _e, [S(l2, { ref: "profileSelect", columns: _(U), "onUpdate:columns": t2[0] ||= (e3) => f(U) ? U.value = e3 : null, selection: _(G), "onUpdate:selection": t2[1] ||= (e3) => f(G) ? G.value = e3 : null, "cache-key": s2.cacheKey, "selection-mode": "multiple", "multiple-operation": !1, "clear-selection-on-request": !1, "table-request": Be, "table-sort": _(k), "show-table-header": !1, "show-display": !1, "show-reload": !1, "show-actions": !1, "context-menu": !1, "virtual-scroller-options": { itemSize: 60 }, "removable-sort": "", class: "profile-select-table" }, { "table-empty": v(() => [_(Y) ? (d(), b(a2, { key: 0, icon: "rx_illustration_filter.svg", title: e2.$t("\u6682\u65E0\u67E5\u8BE2\u7ED3\u679C"), desc: e2.$t("\u5F53\u524D\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u7ED3\u679C\uFF0C\u8BF7\u5C1D\u8BD5\u66F4\u6362\u5176\u4ED6\u7B5B\u9009\u6761\u4EF6\u3002") }, null, 8, ["title", "desc"])) : (d(), b(o2, { key: 1, icon: "base/rx_ic_browser", img: "empty-profiles.png", title: _(V), desc: _(we) }, null, 8, ["title", "desc"]))]), profile: v(({ data: e3 }) => [S(pe, { "workspace-name": _(De), data: e3, readonly: "" }, null, 8, ["workspace-name", "data"])]), profileName: v(({ data: e3 }) => [S(N, { data: e3, readonly: "" }, null, 8, ["data"])]), noteHeader: v(({ column: { title: t3, _cache: n3 } }) => [m("div", ve, [m("span", null, g(t3), 1), x(S(c2, { class: "cursor-pointer color-[#989CA0]", name: n3.extend ? "base/rx_ic_hidden" : "base/rx_ic_eye", onClick: C((e3) => Ve(n3), ["stop"]) }, null, 8, ["name", "onClick"]), [[u2, { value: n3.extend ? e2.$t("\u6536\u8D77") : e2.$t("\u5C55\u5F00"), showDelay: 0 }, void 0, { top: !0 }]])])]), note: v(({ data: e3, column: { _cache: t3 } }) => [m("div", ye, [x(S(n2, { class: te(["shrink-0", { "note-light": e3.windowRemark }]), text: "", severity: "secondary", size: "xxs", icon: e3.windowRemark ? "base/rx_ic_doc_fill" : "base/rx_ic_doc_add" }, null, 8, ["class", "icon"]), [[u2, { value: e3.windowRemark, showDelay: 0 }, void 0, { top: !0 }]]), t3.extend ? (d(), h("div", { key: 0, title: e3.windowRemark, class: "min-w-50 whitespace-pre-wrap note-content" }, g(e3.windowRemark), 9, be)) : y("", !0)])]), project: v(({ data: e3 }) => [S(F, { disabled: "", labels: e3.labelInfo, "project-id": e3.projectId, "project-name": e3.projectName }, null, 8, ["labels", "project-id", "project-name"])]), tags: v(({ data: e3 }) => [S(I, { disabled: "", labels: e3.labelInfo, "project-id": e3.projectId, "gen-tag": !1 }, null, 8, ["labels", "project-id"])]), _: 1 }, 8, ["columns", "selection", "cache-key", "table-sort"])])]), m("div", xe, [S(n2, { size: "md", severity: "secondary", outlined: "", label: e2.$t("\u53D6\u6D88"), onClick: t2[2] ||= C((e3) => B2("close"), ["stop"]) }, null, 8, ["label"]), S(n2, { size: "md", label: e2.$t("\u786E\u8BA4\u5E76\u4FDD\u5B58"), onClick: C(He, ["stop"]) }, null, 8, ["label"])])]);
  };
} }), [["__scopeId", "data-v-b9acccff"]]);
export {B as t};