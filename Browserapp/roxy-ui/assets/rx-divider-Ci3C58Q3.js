import {C as e,W as t,d as n,en as r,h as i,in as a,jt as o,m as s} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {s as c} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as l} from "./_plugin-vue_export-helper-BDNMzG2s.js";
var u = { key: 0, class: "text" };
var d = l(e({ __name: "rx-divider", props: { vertical: { type: Boolean, default: !1 }, lineOnly: { type: Boolean, default: !1 }, text: { default: () => $t("\u6216") }, color: { default: "var(--colors-text-text-primary)" }, lineWidth: { default: 1 }, lineStyle: { default: "solid" }, lineColor: { default: "var(--divider-border-color)" } }, setup(e2) {
  c((e3) => ({ a05b1bd4: e3.color, v05bed5e0: o(l2), v4643f160: e3.lineStyle, v480bcdfc: e3.lineColor }));
  let l2 = n(() => Number.isNaN(Number(e2.lineWidth)) ? e2.lineWidth : CSS.px(e2.lineWidth).toString());
  return (n2, o2) => (t(), i("div", { class: r([e2.vertical ? "vertical" : "horizontal"]) }, [e2.lineOnly ? s("", !0) : (t(), i("span", u, a(e2.text), 1))], 2));
} }), [["__scopeId", "data-v-8e072500"]]);
export {d as t};