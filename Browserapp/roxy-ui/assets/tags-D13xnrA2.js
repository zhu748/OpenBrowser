import {h as e,mt as t,nn as n} from "./utils-BIWenCnY.js";
import {C as r,St as i,W as a,at as o,d as s,f as c,h as l,in as u,jt as d,lt as f,m as p,p as m,x as h} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as g} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as _} from "./agent-BmSFI9WH.js";
import {n as v} from "./workspace-CNvgSgaH.js";
import {t as y} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as b} from "./useconfirm-CV4GTWBW.js";
import {t as x} from "./rx-button-DyzuUt-V.js";
import {t as S} from "./custom-empty-CChX4pJt.js";
import {t as C} from "./related-info-VU3nxvtB.js";
import {n as w} from "./useProfileEntityLabels-BfqbVpel.js";
import {t as T} from "./table-BJcS2I0Z.js";
import {n as E} from "./use-tag-menu-DZnIrtE9.js";
var D = { class: "w-180 h-50vh flex flex-col pa-6 pt-4" };
var O = { class: "h-9 flex justify-between items-center" };
var k = { class: "header" };
var A = { class: "flex justify-between items-center py-3 gap-2" };
var j = { class: "flex-1 total-tags" };
var M = { class: "flex-ovh-1" };
var N = { class: "flex items-center gap-2" };
var P = { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" };
var F = ["fill"];
var I = y(r({ __name: "index", emits: ["close"], setup(r2, { emit: y2 }) {
  let I2 = y2, L = b(), { check: R } = n(), z = v(t().currentWorkspace?.workspaceName), B = o("tagTable"), V = i(0), [H] = E(), [U, W] = _(), G = w(), K = { header: !1, reload: !1, paginator: !1, actions: "quick", selectionBar: !0 }, q = s(() => [{ header: $t("\u6807\u7B7E"), field: "name", slot: "tag" }, { header: G.value.relatedProfilesColumn, field: "relatedProfiles", slot: "related" }]);
  function J(e2) {
    let t2 = e2.rows ?? (e2.row ? [e2.row] : []);
    return [{ key: "edit", label: $t("\u7F16\u8F91"), icon: "base/rx_ic_edit", power: R("Profiles_Label_edit"), quick: !0, command: () => Z(e2.row) }, { key: "delete", label: $t("\u5220\u9664"), icon: "base/rx_ic_bin_1", power: R("Profiles_Label_delete"), quick: !0, multiple: { name: "G1" }, command: () => Q(t2) }];
  }
  function Y(e2) {
    return (e2.bindWindowIds ?? []).map((e3) => `${z}-${e3}`);
  }
  async function X() {
    let t2 = await e.window.userGetLabelInfoList({ page_index: "1", page_size: "999" });
    if (t2.code !== 0) W(t2.code, t2.msg), I2("close");
    else return V.value = t2.data.total, t2;
  }
  function Z(e2) {
    H({ ...e2 || {}, confirmNext: () => {
      B.value?.refresh();
    } });
  }
  async function Q(t2) {
    L.require({ header: $t("\u5220\u9664\u6807\u7B7E"), message: G.value.deleteTagConfirmMessage, rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: async () => {
      let n2 = t2.map((e2) => e2.id), { code: r3, msg: i2 } = await e.window.userDelLabelInfoCreate({ ids: n2 });
      W(r3, i2), r3 === 0 && B.value?.refresh();
    } });
  }
  return (e2, t2) => {
    let n2 = x, r3 = S;
    return a(), l("div", D, [c("div", O, [c("div", k, u(e2.$t("\u6807\u7B7E\u7BA1\u7406")), 1), h(n2, { class: "!rounded-full", text: "", size: "md", severity: "secondary", icon: "base/rx_ic_delete", onClick: t2[0] ||= (t3) => e2.$emit("close") })]), c("div", A, [c("div", j, u(e2.$t("\u65B0\u589E\u6807\u7B7E")) + " (" + u(d(V)) + ") ", 1), d(R)("Profiles_Label_add") ? (a(), m(n2, { key: 0, size: "xxs", outlined: "", severity: "secondary", icon: "base/rx_ic_plus", label: e2.$t("\u65B0\u589E\u6807\u7B7E"), onClick: t2[1] ||= g((e3) => Z(), ["stop"]) }, null, 8, ["label"])) : p("", !0)]), c("div", M, [h(T, { ref: "tagTable", class: "h-full", "data-key": "id", "selection-mode": "multiple", columns: d(q), model: J, regions: K, "table-request": X, "actions-pinned": !1 }, { empty: f(() => [h(r3, { title: e2.$t("\u6682\u65E0\u6807\u7B7E") }, null, 8, ["title"])]), tag: f(({ data: e3 }) => [c("div", N, [(a(), l("svg", P, [c("path", { fill: e3.color, d: "M5 8C5 6.34315 6.34315 5 8 5C9.65685 5 11 6.34315 11 8C11 9.65685 9.65685 11 8 11C6.34315 11 5 9.65685 5 8Z" }, null, 8, F)])), c("span", null, u(e3.name), 1)])]), related: f(({ data: e3 }) => [h(C, { list: Y(e3) }, null, 8, ["list"])]), _: 1 }, 8, ["columns"])])]);
  };
} }), [["__scopeId", "data-v-d50511a2"]]);
export {I as t};