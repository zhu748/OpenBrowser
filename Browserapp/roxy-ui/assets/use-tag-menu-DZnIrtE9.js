import {Cr as e,h as n,xr as i} from "./utils-BIWenCnY.js";
import {C as a,Ct as o,Et as s,F as c,St as l,W as u,at as d,en as f,f as p,h as m,in as h,jt as g,kt as _,m as v,x as y} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as b} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as S} from "./agent-BmSFI9WH.js";
import {n as C} from "./permission-DOhNJfB3.js";
import {Z as w} from "./basecomponent-ClhuVxJN.js";
import {n as T} from "./usedialog-Dh0xp3r7.js";
import {t as O} from "./m-input-text-JVbCgVJP.js";
import {t as k} from "./usePopupMenu-BRw1zJ0m.js";
import {o as j} from "./form-BQBA_XzO.js";
import {t as M} from "./edit-BQkIxl5s.js";
import {n as N} from "./useProjectEntityLabels-DdcfADRx.js";
import {t as P} from "./useProject-BHb2F7tC.js";
function F(e2) {
  return `${e2}`.startsWith("u_");
}
function I(e2) {
  return String(e2);
}
function L(e2) {
  return Array.isArray(e2) ? e2.map((e3) => I(e3)) : [];
}
function R() {
  async function e2() {
    let { data: e3 } = await n.window.userGetLabelInfoList({ page_index: "1", page_size: "999", requestType: C.SelectLabel });
    return e3.rows.map((e4) => ({ name: e4.name, label: e4.name, value: `${e4.id}`, _origin: e4, render: () => y("div", { class: "flex items-center flex-1 overflow-hidden" }, [y("svg", { class: "shrink-0", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" }, [y("path", { d: "M5 8C5 6.34315 6.34315 5 8 5C9.65685 5 11 6.34315 11 8C11 9.65685 9.65685 11 8 11C6.34315 11 5 9.65685 5 8Z", fill: e4.color }, null)]), y("span", { class: "ellipsis-1 text-3.25", title: e4.name }, [e4.name])]) }));
  }
  async function t2() {
    let { data: e3 } = await n.limit.userGetProjectInfoByWorkspaceList({ default: 2 });
    return e3.rows.map((e4) => ({ label: e4.projectName, value: `${e4.project_id}`, projectDefault: e4.projectDefault, _origin: e4 }));
  }
  async function r2(e3) {
    return [];
  }
  return { getTags: e2, getProjects: t2, getProjectMember: r2 };
}
var z = { key: 0, class: "px-3 py-6 text-center text-3 text-[var(--colors-text-text-secondary)]" };
var B = a({ __name: "tag-menu-search", props: { empty: { type: Boolean, default: !1 }, filterOptions: { type: Function }, placeholder: {} }, setup(e2, { expose: t2 }) {
  let n2 = l(""), r2 = l(e2.empty), i2 = d("input");
  function a2(t3) {
    n2.value = t3 ?? "", r2.value = e2.filterOptions(n2.value);
  }
  function o2() {
    i2.value?.focus();
  }
  return t2({ focus: o2 }), (t3, i3) => (u(), m("div", { class: "min-w-60", onClick: i3[0] ||= b(() => {
  }, ["stop"]), onKeydown: i3[1] ||= b(() => {
  }, ["stop"]) }, [p("div", { class: f(["px-2.5 pt-2.5 pb-2", g(r2) ? "" : "border-0 border-b-1 border-solid border-[var(--component-dropdown-divider)]"]) }, [y(O, { ref: "input", "model-value": g(n2), size: "xs", "pre-icon": "base/rx_ic_magnify", autocomplete: "off", placeholder: e2.placeholder || t3.$t("\u641C\u7D22\u6807\u7B7E\u6216\u6210\u5458"), "onUpdate:modelValue": a2 }, null, 8, ["model-value", "placeholder"])], 2), g(r2) ? (u(), m("div", z, h(t3.$t("\u6682\u65E0\u6570\u636E")), 1)) : v("", !0)], 32));
} });
function V(e2) {
  let { getProjects: n2 } = R(), { showMenu: a2 } = k(), [s2] = P(), u2 = N(), p2 = l(!1);
  async function m2(t2) {
    if (_(e2.disabled) || p2.value) return;
    p2.value = !0;
    let r2;
    try {
      r2 = await n2();
    } finally {
      p2.value = !1;
    }
    let s3 = _(e2.projectId)?.toString(), d2 = o(r2.slice()), f2 = l(null), m3 = new j(r2, { threshold: 0.3, ignoreLocation: !0, keys: ["label"] });
    function g2(e3) {
      let t3 = e3.trim(), n3 = t3 ? m3.search(t3).map((e4) => e4.item) : r2;
      return d2.splice(0, d2.length, ...n3), n3.length === 0;
    }
    a2(t2, { mode: { type: "single", value: s3, options: d2, field: "value" }, menuProps: { onShow: () => {
      c(() => {
        f2.value?.focus();
      });
    }, onHide: ({ value: t3 }) => {
      if (i(t3) || t3 === s3) return;
      let n3 = r2.find((e3) => e3.value === t3);
      e2.onChange({ projectId: String(t3), projectName: n3?.label || u2.value.unspecified, projectDefault: n3?.projectDefault || 0 });
    } }, slots: { start: () => y(B, { ref: f2, empty: !r2.length, placeholder: u2.value.searchPlaceholder, filterOptions: g2 }, null), end: _(e2.canCreate) ? () => y("div", { class: "flex items-center gap-1.5 py-3 px-3.5 cursor-pointer border-0 border-t-1 border-solid border-[var(--component-dropdown-divider)]", onClick: h2 }, [y(w, { name: "base/rx_ic_plus" }, null), y("div", { class: "text-3.25" }, [u2.value.createTitle])]) : void 0 } });
  }
  function h2() {
    return s2({ confirmNext: ({ params: t2, res: n3 }) => {
      let r2 = n3?.data?.projectId;
      r2 != null && e2.onChange({ projectId: String(r2), projectName: t2.projectName || u2.value.unspecified, projectDefault: 0 });
    } });
  }
  return { openMenu: m2 };
}
function H() {
  let t2 = T(), [r2, i2] = S();
  function a2(r3) {
    let { confirmNext: a3, ...o2 } = r3 || {};
    t2.open(M, { props: { showHeader: !1, modal: !0, blockScroll: !0 }, data: { props: o2, onConfirm: async (t3) => {
      let r4 = o2?.id ? await n.window.userMdfLabelInfoCreate({ ...t3, id: o2.id }) : await n.window.userAddLabelInfoCreate(t3);
      i2(r4.code, r4.msg), r4.code === 0 && e(a3) && await a3({ params: t3, res: r4 });
    }, onCancel: () => {
    } } });
  }
  return [a2];
}
function U(e2) {
  let t2 = l(!1), [n2] = H(), { getTags: r2, getProjectMember: i2 } = R(), { showMenu: a2 } = k();
  async function u2(n3) {
    if (_(e2.disabled) || t2.value) return;
    let u3 = _(e2.labels) || [], f2 = _(e2.projectId);
    t2.value = !0;
    let [p2, m2] = await Promise.all([r2(), f2 ? i2(f2) : []]), h2 = u3.map((e3) => I(e3.labelId)), g2 = W(m2.concat(p2), h2), v2 = o(g2.slice()), b2 = l(null), x2 = new j(g2, { threshold: 0.3, ignoreLocation: !0, keys: ["label", "name", "_origin.name", "_origin.userName"] });
    t2.value = !1;
    function S2(e3) {
      let t3 = e3.trim(), n4 = t3 ? x2.search(t3).map((e4) => e4.item) : g2;
      return v2.splice(0, v2.length, ...n4), n4.length === 0;
    }
    a2(n3, { mode: { type: "multiple", value: h2, options: v2, field: "value" }, menuProps: { onShow: () => {
      c(() => {
        b2.value?.focus();
      });
    }, onHide: ({ value: t3 }) => {
      let n4 = g2.reduce((e3, n5) => {
        if (t3.includes(n5.value)) {
          let { avatar: t4, avatarColor: r3, userId: i3, userName: a3, color: o2, id: s2, name: c2 } = n5._origin, l2 = i3 ? { avatar: t4, labelColor: r3, labelId: `u_${i3}`, labelName: a3 } : { labelColor: o2, labelId: I(s2), labelName: c2 };
          e3.push(l2);
        }
        return e3;
      }, []);
      G(h2, s(t3)) || e2.onUpdate({ labelInfo: n4, labelIds: L(t3), requestType: C.SelectLabel });
    } }, slots: { start: () => y(B, { ref: b2, empty: !g2.length, filterOptions: S2 }, null), end: _(e2.genTag) === !1 ? void 0 : () => y("div", { class: "flex items-center gap-1.5 py-3 px-3.5 cursor-pointer border-0 border-t-1 border-solid border-[var(--component-dropdown-divider)]", onClick: d2 }, [y(w, { name: "base/rx_ic_plus" }, null), y("div", { class: "text-3.25" }, [$t("\u65B0\u589E\u6807\u7B7E")])]) } });
  }
  function d2() {
    let t3 = (_(e2.labels) || []).map((e3) => I(e3.labelId));
    n2({ confirmNext: ({ params: n3, res: r3 }) => {
      let i3 = _(e2.labels) || [], a3 = I(r3.data.id);
      e2.onUpdate({ labelInfo: [...i3, { labelColor: n3.color, labelName: n3.name, labelId: a3 }], labelIds: [...t3, a3], requestType: C.SelectLabel });
    } });
  }
  return { openMenu: u2 };
}
function W(e2, t2) {
  let n2 = new Set(t2);
  return e2.slice().sort((e3, t3) => {
    let r2 = n2.has(I(e3.value)), i2 = n2.has(I(t3.value));
    return Number(i2) - Number(r2);
  });
}
function G(e2, t2) {
  return e2.slice().sort().join(",") === t2.slice().sort().join(",");
}
export {I as a,F as i,H as n,R as o,V as r,U as t};