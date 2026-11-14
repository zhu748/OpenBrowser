import {nn as t,vt as n,yt as r} from "./utils-BIWenCnY.js";
import {C as i,St as a,V as o,W as s,at as l,f as u,h as d,in as f,jt as p,lt as m,m as h,p as g,st as _,x as v} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as y,t as b} from "./project-zUGx3yhI.js";
import {b as x,i as S,y as C} from "./rich-html-link-VdBpR3Cm.js";
import {Z as w} from "./basecomponent-ClhuVxJN.js";
import {t as T} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as E} from "./rx-button-DyzuUt-V.js";
import {t as D} from "./useDialog-BC-nc8J-.js";
import {t as O} from "./views-header-CcjwXPjG.js";
import {t as k} from "./useProject-BHb2F7tC.js";
import {n as j,t as M} from "./renewal-reminder-drawer-C9_4HaAB.js";
var F = { class: "flex flex-col h-full w-full relative" };
var I = { class: "subproject" };
var L = { class: "flex-1 overflow-hidden" };
var R = T(i({ __name: "project-item", setup(i2) {
  let T2 = C(), R2 = x(), [z] = D(), [B] = k(), { getProjects: V } = b(), { check: U } = t(), { invalidateCache: W } = r(), G = l("project");
  function K(e2) {
    let t2 = Array.isArray(e2) ? e2[0] : e2;
    return t2 == null || t2 === "" ? "" : String(t2);
  }
  let q = a(K(T2.params.id)), J = a(String(T2.query.title)), Y = a();
  function X() {
    W(n.BROWSER_LIST, { projectId: String(q.value) });
  }
  function Z() {
    X(), G.value?.tableRef?.refresh();
  }
  _(() => T2.params.id, (e2) => {
    q.value = K(e2), J.value = String(T2.query.title), Q().catch((error) => globalThis.__localUiError(error.message));
  }), S("updateProjectList", () => {
    Z();
  }), o(() => {
    Q().catch((error) => globalThis.__localUiError(error.message));
  });
  async function Q() {
    const id = q.value, rows = await globalThis.__localRequest("groups:list", { default: 2 });
    if (q.value !== id) return;
    const group = rows.find((row) => row.id === id);
    if (!group) throw Error("\u9879\u76EE\u4E0D\u5B58\u5728");
    J.value = group.projectName;
  }
  function ee() {
    B({ pinStatus: y.pinned, projectName: J.value, project_id: q.value, confirmNext: async ({ params: e2 }) => {
      await V(), J.value = e2.projectName;
    } });
  }
  return (e2, t2) => {
    let n2 = w, r2 = E, i3 = O;
    return s(), d("div", F, [v(i3, null, { title: m(() => [u("div", { class: "cursor-pointer title", onClick: t2[0] ||= () => p(R2).replace({ name: "projects" }) }, f(e2.$t("\u9879\u76EE\u7BA1\u7406")), 1)]), "title-after": m(() => [v(n2, { name: "base/rx_ic_play", size: 8 }), u("div", I, f(p(J)), 1), p(U)("Projects_edit") && p(q) !== "local-default" ? (s(), g(n2, { key: 0, class: "cursor-pointer", name: "base/rx_ic_edit", color: "var(--colors-text-text-secondary)", onClick: ee })) : h("", !0)]), default: m(() => [h("", !0), h("", !0)]), _: 1 }), u("div", L, [v(j, { ref: "project", "is-project-profile": "" }, null, 512)]), v(M)]);
  };
} }), [["__scopeId", "data-v-1275f50e"]]);
export {R as default};