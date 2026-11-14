import {at as e,nn as t,xr as n} from "./utils-BIWenCnY.js";
import {C as r,N as i,St as a,V as o,W as s,d as c,en as l,h as u,jt as d,m as f,p,rt as m,st as h,ut as g,x as _} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as v} from "./locales-BfKu2SD4.js";
import {a as y} from "./agent-BmSFI9WH.js";
import {y as b} from "./rich-html-link-VdBpR3Cm.js";
import {r as x} from "./proxy-create-mode-BCcLAAf5.js";
import {t as S} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as C} from "./tooltip-BYYKWrvu.js";
import {t as w} from "./rx-button-DyzuUt-V.js";
import {n as T} from "./useProfileEntityLabels-BfqbVpel.js";
import {a as E,o as D,r as O,t as k} from "./use-tag-menu-DZnIrtE9.js";
import {n as A} from "./useProjectEntityLabels-DdcfADRx.js";
var j = { class: "flex items-center gap-2" };
var M = { class: "flex items-center" };
var N = S(r({ __name: "mate-group", props: i({ isEdit: { type: Boolean, default: !1 }, showRemark: { type: Boolean, default: !0 } }, { modelValue: {}, modelModifiers: {} }), emits: ["update:modelValue"], setup(r2) {
  let i2 = b(), { isOwner: S2 } = y(e()), { check: N2 } = t(), { getTags: P, getProjects: F, getProjectMember: I } = D(), L = T(), R = A(), z = m(r2, "modelValue");
  z.value ??= { projectName: R.value.unspecified, projectId: void 0, labelIds: [], windowRemark: "", projectDefault: 0 }, o(async () => {
    if (!r2.isEdit && n(z.value.projectId)) {
      let e2 = await F(), t2 = i2.query.projectId || !S2.value && e2[0].value, n2 = e2.find((e3) => t2 ? e3.value === t2 : e3.projectDefault);
      n2 && (z.value.projectId = n2.value, z.value.projectName = n2.label, z.value.projectDefault = 1);
    }
  });
  let { openMenu: B } = O({ projectId: () => z.value?.projectId, canCreate: () => N2("Projects_add"), onChange: (e2) => {
    z.value.projectId = e2.projectId, z.value.projectName = e2.projectName, z.value.projectDefault = e2.projectDefault;
  } }), { openMenu: V } = k({ labels: () => (z.value?.labelIds ?? []).map((e2) => ({ labelId: E(e2) })), projectId: () => z.value?.projectId, disabled: () => !N2("Profiles_select_label"), genTag: () => N2("Profiles_Label_add"), onUpdate: (e2) => {
    K(e2.labelInfo), z.value.labelIds = e2.labelIds;
  } });
  function H(e2) {
    z.value.windowRemark = e2;
  }
  let U = a(/* @__PURE__ */ new Map());
  function W(e2) {
    return e2.label || e2.name || e2._origin?.userName || e2._origin?.name || "";
  }
  function G(e2) {
    let t2 = new Map(U.value);
    for (let n2 of e2) {
      let e3 = W(n2);
      n2.value && e3 && t2.set(String(n2.value), e3);
    }
    U.value = t2;
  }
  function K(e2) {
    let t2 = new Map(U.value);
    for (let n2 of e2) {
      let e3 = E(n2.labelId);
      e3 && n2.labelName && t2.set(e3, n2.labelName);
    }
    U.value = t2;
  }
  let q = 0;
  async function J() {
    let e2 = z.value?.labelIds ?? [];
    if (!e2.length || e2.every((e3) => U.value.has(E(e3)))) return;
    let t2 = ++q, [n2, r3] = await Promise.all([P(), z.value?.projectId ? I(z.value.projectId) : Promise.resolve([])]);
    t2 === q && G([...r3, ...n2]);
  }
  h(() => [z.value?.projectId, ...z.value?.labelIds ?? []], () => {
    J();
  }, { immediate: !0 });
  let Y = c(() => {
    let e2 = R.value, t2 = z.value?.projectName?.trim() || e2.unspecified;
    return e2.assignedTooltip(t2);
  }), X = c(() => {
    let e2 = z.value?.labelIds ?? [];
    if (!e2.length) return v("\u6807\u7B7E");
    let t2 = e2.map((e3) => U.value.get(E(e3))).filter(Boolean);
    return t2.length ? v("\u6807\u7B7E: {names}", { names: t2.join("\u3001") }) : v("\u6807\u7B7E");
  });
  return (e2, t2) => {
    let n2 = w, i3 = C;
    return s(), u("div", j, [g((s(), u("div", M, [_(n2, { disabled: !d(N2)("Profiles_move_project"), outlined: "", severity: "secondary", icon: "base/rx_ic_stack", label: z.value?.projectName, onClick: d(B) }, null, 8, ["disabled", "label", "onClick"])])), [[i3, d(Y), void 0, { top: !0 }]]), g((s(), u("div", { class: l(["flex items-center position-relative", { selected: z.value?.labelIds?.length }]) }, [_(n2, { class: "!min-w-auto", disabled: !d(N2)("Profiles_select_label"), outlined: "", severity: "secondary", icon: "base/rx_ic_tag", onClick: d(V) }, null, 8, ["disabled", "onClick"])], 2)), [[i3, d(X), void 0, { top: !0 }]]), r2.showRemark ? (s(), p(d(x), { key: 0, "hide-label": "", disabled: !d(N2)("Profiles_edit_remark"), title: d(L).addRemarkTitle, label: d(v)("\u5907\u6CE8"), mode: "button", value: z.value?.windowRemark, "on-confirm": H }, null, 8, ["disabled", "title", "label", "value"])) : f("", !0)]);
  };
} }), [["__scopeId", "data-v-13c71cae"]]);
export {N as t};