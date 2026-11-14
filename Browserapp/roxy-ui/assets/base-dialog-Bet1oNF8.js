import {C as e,J as t,P as n,St as r,W as i,_t as a,jt as o,lt as s,p as c} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as l} from "./dialog-CrBr3eoy.js";
var u = e({ __name: "base-dialog", setup(e2) {
  let u2 = r(!0);
  return globalThis.electronAPI.send("app:showCurrentWebviewWindow"), (e3, r2) => {
    let d = l;
    return i(), c(d, n({ visible: o(u2), "onUpdate:visible": r2[0] ||= (e4) => a(u2) ? u2.value = e4 : null }, e3.$attrs, { style: { width: "100vw", height: "100vh", "max-height": "100vh", border: "none" }, onHide: r2[1] ||= (t2) => e3.$emit("hide") }), { default: s(() => [t(e3.$slots, "default")]), _: 3 }, 16, ["visible"]);
  };
} });
export {u as t};