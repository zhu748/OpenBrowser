import {h as t,mt as n,nn as r,v as i,vt as a,yt as o} from "./utils-BIWenCnY.js";
import {C as s,St as c,W as l,Y as u,_t as d,at as f,f as p,h as ee,in as te,jt as m,lt as h,m as g,p as _,x as v} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as y} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as b,n as ne} from "./agent-BmSFI9WH.js";
import {r as re} from "./permission-DOhNJfB3.js";
import {n as x,t as S} from "./project-zUGx3yhI.js";
import {o as ie,t as C} from "./ry-table-do6kugym.js";
import {Z as w} from "./basecomponent-ClhuVxJN.js";
import {t as T} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as ae} from "./useconfirm-CV4GTWBW.js";
import {t as oe} from "./rx-button-DyzuUt-V.js";
import {w as E} from "./hook-CnJE4hRq.js";
import {t as D} from "./rx-divider-Ci3C58Q3.js";
import {a as O} from "./contextmenu-BBjizTDn.js";
import {t as k} from "./useDialog-BC-nc8J-.js";
import {t as A} from "./usePopupMenu-BRw1zJ0m.js";
import {t as j} from "./custom-empty-CChX4pJt.js";
import {t as N} from "./views-header-CcjwXPjG.js";
import {t as P} from "./useProject-BHb2F7tC.js";
import {t as L} from "./gen-project-BYIY-yxb.js";
var R = { class: "flex flex-col h-full" };
var z = { class: "flex-1 flex overflow-hidden" };
var B = { class: "flex items-center gap-3" };
var V = T(s({ __name: "index", setup(s2) {
  let T2 = f("project"), V2 = ae(), [ce, H] = ne(), [U] = P({ toast: !1 }), [W] = k(), { getProjects: G } = S(), { currentWorkspace: K } = n(), { handleBusinessCode: le } = E(), { userInfo: q } = b(i()), { showMenu: de } = A(), { check: J } = r(), { invalidateCache: Y } = o(), X = c([{ title: $t("\u9879\u76EE\u4FE1\u606F"), key: "projectName", slot: "projectName" }, { title: $t("\u64CD\u4F5C"), key: "action", slot: "action" }, { title: $t("\u7A97\u53E3\u6570\u91CF"), render: ({ data: e2 }) => e2.windowCount ? e2.windowCount : "--" }, { title: $t("\u5176\u4ED6"), style: "width: 9rem", slot: "actions" }]);
  async function pe(e2) {
    return G(), t.limit.userGetProjectInfoByWorkspaceList({ ...e2, default: 2 });
  }
  function Z() {
    Y(a.PROJECT_LIST), T2.value?.refresh();
  }
  function Q(e2) {
    let t2 = e2.user_info.find((e3) => e3.userId === q.value.id)?.pinStatus === x.pinned;
    return [{ name: "edit", label: $t("\u7F16\u8F91"), icon: "base/rx_ic_edit", power: J("Projects_edit"), disabled: !!e2.projectDefault || !!e2.isTransfer, command: ({ item: t3 }) => {
      $(t3, e2);
    } }, { name: "pin", label: t2 ? $t("\u53D6\u6D88\u56FA\u5B9A\u5230\u4FA7\u8FB9\u680F") : $t("\u56FA\u5B9A\u5230\u4FA7\u8FB9\u680F"), icon: t2 ? "base/rx_ic_pin_solid" : "base/rx_ic_pin_line", iconClass: t2 ? "text-orange" : "", tooltip: t2 ? $t("\u53D6\u6D88\u56FA\u5B9A\u5230\u4FA7\u8FB9\u680F") : $t("\u56FA\u5B9A\u5230\u4FA7\u8FB9\u680F"), quick: !0, command: ({ item: t3 }) => {
      $(t3, e2);
    } }, { power: J("Projects_edit"), separator: !0 }, { name: "delete", label: $t("\u5220\u9664"), icon: "base/rx_ic_bin_1", power: J("Projects_delete"), disabled: !!e2.projectDefault || !!e2.isTransfer, command: ({ item: t3 }) => {
      $(t3, e2);
    } }];
  }
  function $(t2, n2) {
    switch (t2.name) {
      case "create":
        me();
        break;
      case "pin":
        ge(n2);
        break;
      case "edit":
        U({ ...n2, confirmNext: () => {
          Z();
        } });
        break;
      case "delete":
        _e(n2);
    }
  }
  function me() {
    W({ showHeader: !1, modal: !0, blockScroll: !0, slots: { container: ({ hideModal: e2 }) => v(L, { onSuccess: () => {
      e2(), Z();
    }, onClose: e2 }, null) } });
  }
  async function he({ value: e2 }) {
    let n2 = T2.value?.getParams(), { projectIds: r2, projectSortNumList: i2 } = e2.reduce((e3, t2, n3) => (e3.projectIds.push(t2.project_id), e3.projectSortNumList.push(n3 + 1), e3), { projectIds: [], projectSortNumList: [] }), { code: o2, msg: s3 } = await t.limit.userMdfProjectSortCreate({ projectIds: r2, projectSortNumList: i2, page_index: n2?.page_index ?? 1, page_size: n2?.page_size ?? 10 });
    H(o2, s3), o2 === 0 && (T2.value?.updateDataList(e2), G(), Y(a.PROJECT_LIST));
  }
  async function ge(e2) {
    let n2 = e2.user_info.find((e3) => e3.userId === q.value.id)?.pinStatus === x.pinned ? x.none : x.pinned, { code: r2, msg: i2 } = await t.limit.userMdfProjectInfoCreate({ id: e2.project_id, pinStatus: n2, requestType: re.PinProject });
    r2 === 0 ? Z() : H(r2, i2);
  }
  function _e(e2) {
    V2.require({ header: $t("\u5220\u9664\u9879\u76EE"), message: $t("\u60A8\u786E\u8BA4\u8981\u5220\u9664 {projectName} \u9879\u76EE\u5417\uFF1F\u8BE5\u64CD\u4F5C\u4F1A\u79FB\u9664\u6240\u6709\u9879\u76EE\u6210\u5458\uFF0C\u4E14\u6240\u6709\u7A97\u53E3\u5C06\u56DE\u5F52\u9ED8\u8BA4\u9879\u76EE\u3002", { projectName: e2.projectName }), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: async () => {
      await globalThis.electronAPI.send("util:removeProject", { workspaceId: K?.id, projectId: e2.project_id });
      let { code: n2, msg: r2 } = await t.limit.userDelProjectInfoCreate({ projectId: e2.project_id });
      H(n2, r2 || $t("\u5220\u9664\u5931\u8D25")), n2 === 0 && (Y(a.BROWSER_LIST, { projectId: String(e2.project_id) }), Y(a.BROWSER_LIST, { projectId: "" }), Z());
    } });
  }
  function ve({ event: e2, operation: t2 }) {
    de(e2, { model: t2 });
  }
  return (e2, t2) => {
    let n2 = oe, r2 = D, i2 = N, a2 = j, o2 = w, s3 = O, c2 = u("RouterLink"), f2 = ie, b2 = C;
    return l(), ee("div", R, [v(i2, { class: "items-center", divider: !1, title: e2.$t("\u9879\u76EE\u7BA1\u7406") }, { default: h(() => [m(J)("Projects_add") ? (l(), _(n2, { key: 0, size: "xxs", icon: "base/rx_ic_plus", label: e2.$t("\u521B\u5EFA\u9879\u76EE"), onClick: t2[0] ||= y((e3) => $({ name: "create" }), ["stop"]) }, null, 8, ["label"])) : g("", !0), v(r2, { vertical: "", "line-only": "", class: "!h-4" }), v(n2, { severity: "secondary", variant: "outlined", size: "xxs", icon: "base/rx_ic_refresh", onClick: y(Z, ["stop"]) })]), _: 1 }, 8, ["title"]), p("div", z, [v(b2, { ref: "project", columns: m(X), "onUpdate:columns": t2[4] ||= (e3) => d(X) ? X.value = e3 : null, "data-key": "project_id", "cache-key": "project-list", "list-cache-key": "project-list", "table-request": pe, "table-operation": Q, "show-table-header": !1, "show-gridlines": !1, "show-actions-menu": !1, "show-actions": !1, onRowReorder: he }, { "table-empty": h(() => [v(a2, { icon: "rx_illustration_stack.svg", title: e2.$t("\u6682\u65E0\u9879\u76EE"), desc: e2.$t("\u9879\u76EE\u529F\u80FD\u53EF\u4EE5\u5E2E\u52A9\u60A8\u5C06\u7A97\u53E3\u6216\u56E2\u961F\u6210\u5458\u8FDB\u884C\u5206\u914D\uFF0C\u5E76\u66F4\u9AD8\u6548\u5730\u7BA1\u7406\u3002") }, { extra: h(() => [p("div", B, [m(J)("Projects_add") ? (l(), _(n2, { key: 0, outlined: "", severity: "secondary", size: "xs", icon: "base/rx_ic_stack_add", label: e2.$t("\u521B\u5EFA\u9879\u76EE"), onClick: t2[1] ||= y((e3) => $({ name: "create" }), ["stop"]) }, null, 8, ["label"])) : g("", !0)])]), _: 1 }, 8, ["title", "desc"])]), "column-before": h(() => [v(s3, { "header-style": "width:44px", "row-reorder": "" }, { rowreordericon: h(() => [v(o2, { class: "cursor-grab drag-mark", "data-pc-section": "reorderablerowhandle", name: "base/rx_ic_dots_drag" })]), _: 1 })]), projectName: h(({ data: e3 }) => [v(c2, { class: "flex items-center gap-2 name text-[var(--colors-text-text-primary)]", to: { name: "project-item", params: { id: e3.project_id }, query: { title: e3.projectName } }, onClick: t2[2] ||= y(() => {
    }, ["stop", "prevent"]) }, { default: h(() => [v(m(w), { name: "base/rx_ic_stack" }), p("span", null, te(e3.projectName), 1)]), _: 2 }, 1032, ["to"])]), action: h(({ data: r3 }) => [v(c2, { class: "flex items-center gap-2 name", to: { name: "project-item", params: { id: r3.project_id }, query: { title: r3.projectName } }, onClick: t2[3] ||= y(() => {
    }, ["stop", "prevent"]) }, { default: h(() => [v(n2, { label: e2.$t("\u67E5\u770B\u8BE6\u60C5"), outlined: "", severity: "secondary", size: "xs" }, null, 8, ["label"])]), _: 1 }, 8, ["to"])]), actions: h(({ data: e3 }) => [v(f2, { operation: Q(e3), onQuickClick: (t3) => $(t3, e3), onMore: ve }, null, 8, ["operation", "onQuickClick"])]), _: 1 }, 8, ["columns"])])]);
  };
} }), [["__scopeId", "data-v-6527e252"]]);
export {V as default};