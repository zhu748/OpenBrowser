import {nn as e} from "./utils-BIWenCnY.js";
import {C as t,W as n,d as r,en as i,f as a,h as o,i as s,in as c,jt as l,m as u,p as d,q as f} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as p} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as m} from "./permission-DOhNJfB3.js";
import {t as h} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as g} from "./rx-avatar-h90aIpxl.js";
import {t as _} from "./rx-tag-BIY_xUFU.js";
import {i as v,r as y,t as b} from "./use-tag-menu-DZnIrtE9.js";
var x = t({ __name: "index", props: { labels: {}, projectId: {}, projectName: {}, disabled: { type: Boolean } }, emits: ["update"], setup(t2, { emit: r2 }) {
  let i2 = t2, a2 = r2, { check: o2 } = e(), { openMenu: s2 } = y({ projectId: () => i2.projectId == null ? void 0 : String(i2.projectId), disabled: () => i2.disabled, canCreate: () => o2("Projects_add"), onChange: (e2) => {
    a2("update", { projectName: e2.projectName, projectId: e2.projectId, requestType: m.MoveProject, ...c2() });
  } });
  function c2() {
    let e2 = (i2.labels || []).filter((e3) => !v(e3.labelId));
    return { labelInfo: e2, labelIds: e2.map((e3) => e3.labelId) };
  }
  return (e2, r3) => {
    let i3 = _;
    return n(), d(i3, { class: "cursor-pointer", icon: "base/rx_ic_stack", label: t2.projectName, onClick: p(l(s2), ["stop"]) }, null, 8, ["label", "onClick"]);
  };
} });
var S = { class: "flex items-center gap-2" };
var C = ["title"];
var w = { class: "label pointer-events-none" };
var T = { class: "shrink-0", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" };
var E = ["fill"];
var D = { class: "ellipsis-1" };
var O = h(t({ __name: "index", props: { labels: {}, projectId: {}, disabled: { type: Boolean, default: !1 }, genTag: { type: Boolean, default: !0 } }, emits: ["update"], setup(e2, { expose: t2, emit: m2 }) {
  let h2 = m2, { openMenu: y2 } = b({ labels: () => e2.labels, projectId: () => e2.projectId, disabled: () => e2.disabled, genTag: () => e2.genTag, onUpdate: (e3) => h2("update", e3) }), x2 = r(() => (e2.labels || []).filter((e3) => v(e3.labelId)).map((e3) => ({ ...e3, color: e3.labelColor, name: e3.labelName, tooltip: e3.labelName }))), O2 = r(() => (e2.labels || []).filter((e3) => !v(e3.labelId)));
  return t2({ openMenu: y2 }), (t3, r2) => {
    let m3 = _, h3 = g;
    return n(), o("div", S, [e2.labels?.length ? (n(), o(s, { key: 1 }, [l(x2).length ? (n(), d(h3, { key: 0, class: "cursor-pointer", list: l(x2), size: 24, "font-size": 12, max: 3, onClick: p(l(y2), ["stop"]) }, null, 8, ["list", "onClick"])) : u("", !0), (n(!0), o(s, null, f(l(O2), (t4) => (n(), o("div", { key: t4.labelId, class: i(["flex items-center select-none", [e2.disabled ? "cursor-not-allowed" : "cursor-pointer"]]), title: t4.labelName, onClick: r2[0] ||= p((...e3) => l(y2) && l(y2)(...e3), ["stop"]) }, [a("div", w, [(n(), o("svg", T, [a("path", { d: "M5 8C5 6.34315 6.34315 5 8 5C9.65685 5 11 6.34315 11 8C11 9.65685 9.65685 11 8 11C6.34315 11 5 9.65685 5 8Z", fill: t4.labelColor }, null, 8, E)])), a("div", D, c(t4.labelName), 1)])], 10, C))), 128))], 64)) : (n(), d(m3, { key: 0, class: "cursor-pointer !rounded-full", icon: "base/rx_ic_tag", onClick: p(l(y2), ["stop"]) }, null, 8, ["onClick"]))]);
  };
} }), [["__scopeId", "data-v-1187bc0a"]]);
export {x as n,O as t};