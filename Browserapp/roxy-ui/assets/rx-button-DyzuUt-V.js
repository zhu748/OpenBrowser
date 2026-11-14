import {C as e,J as t,N as n,P as r,St as i,W as a,at as o,en as s,g as c,jt as l,lt as u,m as d,p as f,rt as p,v as m,x as h} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as g} from "./basecomponent-ClhuVxJN.js";
import {t as _} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as v} from "./button-BKeo7L17.js";
var y = _(e({ inheritAttrs: !1, __name: "index", props: n({ size: { default: "sm" }, icon: {}, rotate: { type: Boolean }, disabled: { type: Boolean, default: !1 }, onClick: { type: Function } }, { loading: { default: !1 }, loadingModifiers: {} }), emits: ["update:loading"], setup(e2, { expose: n2 }) {
  let _2 = c(e2, ["size", "disabled"]), y2 = p(e2, "loading"), b = o("btnEl"), x = i(!1);
  async function S(t2) {
    if (!(e2.disabled || x.value || y2.value) && _2.onClick) {
      x.value = !0;
      try {
        await _2.onClick(t2);
      } finally {
        x.value = !1;
      }
    }
  }
  return n2({ get btnEl() {
    return b.value?.$el;
  } }), (n3, i2) => {
    let o2 = v;
    return a(), f(o2, r({ ref: "btnEl" }, { ...n3.$attrs, ..._2, onClick: S }, { disabled: e2.disabled || l(x) || y2.value, loading: l(x) || y2.value, class: ["rx_button", [e2.size]] }), m({ loadingicon: u(() => [t(n3.$slots, "loadingicon", {}, () => [h(l(g), { name: "base/rx_ic_spin", class: "loading-circle" })], !0)]), _: 2 }, [e2.icon || n3.$slots.icon ? { name: "icon", fn: u(() => [t(n3.$slots, "icon", {}, () => [h(l(g), { name: e2.icon, class: s([{ "animate-spin": e2.rotate }, "animate-duration-2500"]) }, null, 8, ["name", "class"])], !0)]), key: "0" } : void 0, n3.$slots.default ? { name: "default", fn: u(() => [l(x) || y2.value ? (a(), f(l(g), { key: 0, class: "loading-circle", name: "base/rx_ic_spin" })) : d("", !0), e2.icon ? (a(), f(l(g), { key: 1, name: e2.icon }, null, 8, ["name"])) : d("", !0), t(n3.$slots, "default", {}, void 0, !0)]), key: "1" } : void 0]), 1040, ["disabled", "loading", "class"]);
  };
} }), [["__scopeId", "data-v-5d1c6974"]]);
export {y as t};