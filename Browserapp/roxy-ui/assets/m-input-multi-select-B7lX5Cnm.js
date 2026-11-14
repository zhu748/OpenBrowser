import {Cr as e} from "./utils-BIWenCnY.js";
import {C as t,E as n,J as r,P as i,W as a,g as o,it as s,jt as c,lt as l,nn as u,p as d,q as f,ut as p,v as m,x as h} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {f as g} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {Z as _} from "./basecomponent-ClhuVxJN.js";
import {t as v} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as y} from "./multiselect-DS9bwX-7.js";
var b = v(t({ __name: "m-input-multi-select", props: { size: { default: "sm" }, filter: { type: Boolean, default: !0 }, optionLabel: { default: "label" }, optionValue: { default: "value" }, onChange: { type: Function } }, setup(t2) {
  let v2 = o(t2, ["size", "filter", "optionLabel", "optionValue", "onChange"]), b2 = s();
  function x(n2) {
    t2.onChange && e(t2.onChange) && t2.onChange({ ...n2, props: { filter: t2.filter, optionLabel: t2.optionLabel, optionValue: t2.optionValue, ...v2 } });
  }
  return (e2, o2) => (a(), d(c(y), i(v2, { filter: t2.filter, "option-label": t2.optionLabel, "option-value": t2.optionValue, pt: { root: t2.size, optionlabel: e2.classes.optionlabel, emptymessage: "text-3.25" }, onChange: x }), m({ dropdownicon: l((e3) => [h(c(_), i({ name: "base/rx_ic_chevron_down" }, e3), null, 16)]), chipicon: l(({ removeCallback: e3, ...t3 }) => [h(c(_), i({ name: "base/rx_ic_delete" }, t3, { onClick: e3 }), null, 16, ["onClick"])]), headercheckboxicon: l(({ checked: e3 }) => [p(h(c(_), { name: "base/rx_ic_checkmark", color: "#ffffff" }, null, 512), [[g, e3]])]), optioncheckboxicon: l(({ checked: e3 }) => [p(h(c(_), { name: "base/rx_ic_checkmark", color: "#ffffff" }, null, 512), [[g, e3]])]), _: 2 }, [f(c(b2), (t3, i2) => ({ name: i2, fn: l((t4) => [r(e2.$slots, i2, u(n(t4)), void 0, !0)]) }))]), 1040, ["filter", "option-label", "option-value", "pt"]));
} }), [["__cssModules", { classes: { optionlabel: "_optionlabel_1jjhn_2" } }], ["__scopeId", "data-v-894de770"]]);
export {b as t};