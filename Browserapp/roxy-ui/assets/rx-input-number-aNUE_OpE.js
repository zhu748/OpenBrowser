import {C as e,P as t,W as n,g as r,p as i} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as a} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as o} from "./inputnumber-BD6BwCgc.js";
var s = a(e({ inheritAttrs: !1, __name: "rx-input-number", props: { size: { default: "sm" } }, emits: ["change"], setup(e2) {
  let a2 = r(e2, ["size"]);
  return (r2, s2) => {
    let c = o;
    return n(), i(c, t({ ...r2.$attrs, ...a2 }, { pt: { root: e2.size }, fluid: "", onInput: s2[0] ||= (e3) => r2.$emit("change") }), null, 16, ["pt"]);
  };
} }), [["__scopeId", "data-v-11f2b12d"]]);
export {s as t};