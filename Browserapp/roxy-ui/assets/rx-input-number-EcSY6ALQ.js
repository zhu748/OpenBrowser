import {C as e,P as t,W as n,jt as r,lt as i,p as a,rt as o,x as s} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as c} from "./basecomponent-ClhuVxJN.js";
import {t as l} from "./inputnumber-BD6BwCgc.js";
var u = e({ __name: "index", props: { modelValue: {}, modelModifiers: {} }, emits: ["update:modelValue"], setup(e2) {
  let u2 = o(e2, "modelValue");
  return (e3, o2) => {
    let d = l;
    return n(), a(d, t({ modelValue: u2.value, "onUpdate:modelValue": o2[0] ||= (e4) => u2.value = e4, class: "rx-input-number", "button-layout": "horizontal", "show-buttons": "", fluid: "" }, e3.$attrs), { incrementicon: i(() => [s(r(c), { name: "base/rx_ic_plus" })]), decrementicon: i(() => [s(r(c), { name: "base/rx_ic_minus" })]), _: 1 }, 16, ["modelValue"]);
  };
} });
export {u as t};