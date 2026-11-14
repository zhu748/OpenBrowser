import {C as e,P as t,St as n,W as r,at as i,f as a,h as o,in as s,jt as c,m as l,p as u,st as d,ut as f} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {s as p} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as m} from "./dist-NctnpPRe.js";
import {Z as h} from "./basecomponent-ClhuVxJN.js";
import {t as g} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as _} from "./tooltip-BYYKWrvu.js";
var v = ["for"];
var y = g(e({ inheritAttrs: !1, __name: "input-label", props: { name: {}, label: {}, tooltip: {}, labelWidth: {} }, setup(e2) {
  p((e3) => ({ v93e37742: e3.labelWidth, v0bd29930: c(x) }));
  let g2 = i("label"), { height: y2, stop: b } = m(g2), x = n("32px"), S = d(y2, () => {
    y2.value > 50 && (x.value = "auto", b(), S());
  });
  return (n2, i2) => {
    let d2 = _;
    return e2.label ? (r(), o("label", t({ key: 0, ref: "label", class: "rx-label", for: e2.name }, n2.$attrs), [a("span", null, s(e2.label), 1), e2.tooltip ? f((r(), u(c(h), { key: 0, class: "align-middle ml-1", name: "base/rx_ic_info", size: 12, color: "var(--colors-icon-icon-note)" }, null, 512)), [[d2, { value: e2.tooltip, showDelay: 500 }, void 0, { top: !0 }]]) : l("", !0)], 16, v)) : l("", !0);
  };
} }), [["__scopeId", "data-v-e9675ce9"]]);
export {y as t};