import {C as e,P as t,W as n,Z as r,en as i,f as a,g as o,h as s,i as c,in as l,jt as u,m as d,p as f,q as p,tt as m,x as h} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as g} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as _} from "./radiobutton-B3i1EP5M.js";
var v = ["for"];
var y = { class: "select-none rx-radio-group-item__text" };
var b = g(e({ inheritAttrs: !1, __name: "rx-input-radio", props: { size: { default: "sm" }, options: {} }, emits: ["change"], setup(e2) {
  let g2 = o(e2, ["size", "options"]), b2 = m();
  return (o2, m2) => {
    let x = _;
    return n(), s("div", { class: i(["flex items-start flex-wrap gap-2 rx-radio-group", u(b2).class]) }, [(n(!0), s(c, null, p(e2.options, ({ label: u2, value: p2, afterRender: _2, disabled: b3, ...S }) => (n(), s(c, { key: u2 }, [a("label", { for: `${g2.name}_${p2}`, class: i(["flex items-center cursor-pointer rx-radio-group-item", [o2.styles[e2.size], { "cursor-not-allowed": b3 }]]) }, [h(x, t({ ref_for: !0 }, { ...o2.$attrs, ...g2, ...S }, { "input-id": `${g2.name}_${p2}`, disabled: b3, value: p2, onChange: m2[0] ||= (e3) => o2.$emit("change") }), null, 16, ["input-id", "disabled", "value"]), a("div", y, l(u2), 1)], 10, v), _2 ? (n(), f(r(_2), { key: 0 })) : d("", !0)], 64))), 128))], 2);
  };
} }), [["__cssModules", { styles: { xxs: "_xxs_1bi1f_1", xs: "_xs_1bi1f_10", sm: "_sm_1bi1f_19", md: "_md_1bi1f_28", lg: "_lg_1bi1f_37" } }], ["__scopeId", "data-v-5d1621c6"]]);
export {b as t};