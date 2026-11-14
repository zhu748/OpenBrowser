import {C as e,N as t,W as n,h as r,i,p as a,q as o,rn as s,rt as c} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as l} from "./basecomponent-ClhuVxJN.js";
var u = { class: "flex items-center gap-5" };
var d = ["onClick"];
var f = e({ __name: "colors-select", props: t({ colors: {} }, { modelValue: {}, modelModifiers: {} }), emits: ["update:modelValue"], setup(e2) {
  let t2 = c(e2, "modelValue");
  return (c2, f2) => {
    let p = l;
    return n(), r("div", u, [(n(!0), r(i, null, o(e2.colors, (e3) => (n(), r(i, { key: e3 }, [e3 === t2.value ? (n(), a(p, { key: 0, name: "base/rx_ic_check_line", size: 20, color: e3 }, null, 8, ["color"])) : (n(), r("div", { key: 1, class: "w-5 h-5 rounded-full cursor-pointer", style: s({ backgroundColor: e3 }), onClick: (n2) => t2.value = e3 }, null, 12, d))], 64))), 128))]);
  };
} });
export {f as t};