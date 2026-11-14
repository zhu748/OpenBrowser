import {C as e,J as t,W as n,Z as r,b as i,d as a,en as o,f as s,g as c,h as l,i as u,in as d,jt as f,lt as p,p as m,q as h,rn as g,ut as _} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {s as v} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as y} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as b} from "./tooltip-BYYKWrvu.js";
import {t as x} from "./rx-tooltip-CNCSEJGC.js";
var S = { class: "relative flex items-center cursor-default" };
var C = ["src"];
var w = ["src"];
var T = { class: "text-3 leading-4 text-white" };
var E = y(e({ __name: "index", props: { list: {}, max: {}, size: { default: 32 }, fontSize: { default: 16 }, radius: { default: "50%" }, gap: { default: () => -4 }, compact: { type: Boolean, default: !1 }, avatar: {}, name: {}, color: {}, more: { type: Boolean }, tooltip: {} }, setup(e2) {
  v((e3) => ({ v46d0db61: f(E2) }));
  let y2 = c(e2, ["list", "max", "size", "fontSize", "gap", "radius", "compact"]), E2 = a(() => CSS.px(e2.gap).toString()), D = a(() => {
    let t2 = (e2.list || [y2]).filter(Boolean).map((e3) => ({ ...e3, truncName: e3.name?.slice(0, 2).toLocaleUpperCase() }));
    return e2.max && t2.length > e2.max ? { icons: t2.slice(0, e2.max).concat({ truncName: `+${t2.length - e2.max}`, color: "#7ECCFC", more: !0 }), surplus: t2.slice(e2.max) } : { icons: t2, surplus: [] };
  }), O = a(() => {
    let t2 = CSS.px(e2.size).toString();
    return { width: t2, height: t2, lineHeight: t2, fontSize: CSS.px(e2.fontSize).toString(), borderRadius: e2.radius };
  });
  return (a2, c2) => {
    let v2 = b;
    return n(), l("div", S, [(n(!0), l(u, null, h(f(D).icons, (t2) => (n(), l(u, { key: t2.name }, [t2.avatar ? _((n(), l("img", { key: 0, draggable: "false", class: o(a2.classes.image), style: g(f(O)), src: t2.avatar }, null, 14, C)), [[v2, t2.tooltip, void 0, { top: !0 }]]) : (n(), m(r(t2.more ? f(x) : "div"), { key: 1, class: o([a2.classes.image, a2.classes.text, e2.compact && a2.classes.compact]), style: g({ ...f(O), backgroundColor: t2.color }), placement: "right" }, { default: p(() => [_((n(), l("div", null, [i(d(t2.truncName), 1)])), [[v2, t2.tooltip, void 0, { top: !0 }]])]), content: p(() => [s("div", { class: o(["flex flex-col gap-2 max-h-50 overflow-y-auto", a2.classes.scroll]) }, [(n(!0), l(u, null, h(f(D).surplus, (t3, r2) => (n(), l("div", { key: r2, class: "relative flex items-center gap-1.5 cursor-default" }, [t3.avatar ? (n(), l("img", { key: 0, class: o(a2.classes.image), style: g(f(O)), src: t3.avatar }, null, 14, w)) : (n(), l("div", { key: 1, class: o([a2.classes.image, a2.classes.text, e2.compact && a2.classes.compact]), style: g({ ...f(O), backgroundColor: t3.color }) }, d(t3.truncName), 7)), s("div", T, d(t3.name), 1)]))), 128))], 2)]), _: 2 }, 1032, ["class", "style"]))], 64))), 128)), t(a2.$slots, "default")]);
  };
} }), [["__cssModules", { classes: { scroll: "_scroll_omazr_1", image: "_image_omazr_5", text: "_text_omazr_13", compact: "_compact_omazr_21" } }]]);
export {E as t};