import {C as e,J as t,N as n,W as r,b as i,en as a,h as o,i as s,in as c,q as l,rt as u,ut as d} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as f} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as p} from "./tooltip-BYYKWrvu.js";
var m = { class: "flex overflow-hidden rounded-1.5 switch-group" };
var h = ["onClick"];
var g = f(e({ __name: "os-switch", props: n({ disabled: { type: Boolean }, disabledTooltip: {}, options: {} }, { modelValue: {}, modelModifiers: {} }), emits: n(["change"], ["update:modelValue"]), setup(e2, { emit: n2 }) {
  let f2 = e2;
  function g2(e3) {
    return f2.disabled ? f2.disabledTooltip : e3.disabled ? e3.disabledTooltip : e3.tooltip;
  }
  let _ = n2, v = u(e2, "modelValue");
  function y(e3) {
    e3.disabled || f2.disabled || (v.value = e3, _("change", e3));
  }
  return (n3, u2) => {
    let f3 = p;
    return r(), o("div", m, [(r(!0), o(s, null, l(e2.options, (s2) => d((r(), o("div", { key: s2.value, class: a(["flex-1 min-w-0 flex items-center justify-center cursor-pointer select-none transition-all duration-200 switch-group-item", { active: v.value === s2, disabled: s2.disabled || e2.disabled }]), onClick: (e3) => y(s2) }, [t(n3.$slots, "item", { item: s2 }, () => [i(c(s2.label), 1)], !0)], 10, h)), [[f3, { value: g2(s2), showDelay: 500 }, void 0, { top: !0 }]])), 128))]);
  };
} }), [["__scopeId", "data-v-4bdf6bc4"]]);
export {g as t};