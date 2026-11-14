import {Cr as e} from "./utils-BIWenCnY.js";
import {C as t,N as n,P as r,St as i,W as a,d as o,en as s,g as c,h as l,jt as u,lt as d,rt as f,v as p,x as m} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as h} from "./basecomponent-ClhuVxJN.js";
import {t as g} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as _} from "./toggleswitch-DKDK40Mk.js";
var v = g(t({ inheritAttrs: !1, __name: "index", props: n({ disabled: { type: Boolean, default: !1 }, readonly: { type: Boolean, default: !1 }, trueValue: { default: !0 }, falseValue: { default: !1 }, beforeChange: { type: Function } }, { modelValue: {}, modelModifiers: {} }), emits: n(["valueChange", "change"], ["update:modelValue"]), setup(t2, { emit: n2 }) {
  let g2 = c(t2, ["disabled", "readonly", "trueValue", "falseValue", "beforeChange"]), v2 = n2, y = f(t2, "modelValue"), b = i(!1), x = o(() => t2.disabled || t2.readonly || b.value);
  async function S() {
    if (x.value) return;
    let n3 = y.value === t2.trueValue ? t2.falseValue : t2.trueValue;
    if (e(t2.beforeChange)) {
      b.value = !0;
      let e2 = await t2.beforeChange(n3);
      if (b.value = !1, e2 === !1) return;
    }
    y.value = n3, v2("valueChange", n3), v2("change", n3);
  }
  return (e2, n3) => {
    let i2 = h, o2 = _;
    return a(), l("div", { class: s(["flex items-center", { "cursor-pointer": !u(x), "cursor-not-allowed": t2.disabled }]), onClick: S }, [m(o2, r({ class: "pointer-events-none" }, { ...g2, ...e2.$attrs, readonly: t2.readonly, trueValue: t2.trueValue, falseValue: t2.falseValue }, { "model-value": y.value, disabled: t2.disabled || u(b) }), p({ _: 2 }, [u(b) ? { name: "handle", fn: d(() => [m(i2, { name: "base/rx_ic_spin", class: "loading-circle" })]), key: "0" } : void 0]), 1040, ["model-value", "disabled"])], 2);
  };
} }), [["__scopeId", "data-v-c7ccdfac"]]);
export {v as t};