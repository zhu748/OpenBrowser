import {C as e,J as t,W as n,h as r,jt as i,m as a,p as o} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as s} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {Z as c} from "./basecomponent-ClhuVxJN.js";
import {t as l} from "./_plugin-vue_export-helper-BDNMzG2s.js";
var u = { class: "rx-card" };
var d = l(e({ __name: "index", props: { closable: { type: Boolean, default: !0 } }, emits: ["close"], setup(e2) {
  return (l2, d2) => (n(), r("div", u, [e2.closable ? (n(), o(i(c), { key: 0, class: "cursor-pointer rx-card-close", name: "base/rx_ic_delete_fill", onClick: d2[0] ||= s((e3) => l2.$emit("close"), ["stop"]) })) : a("", !0), t(l2.$slots, "default", {}, void 0, !0)]));
} }), [["__scopeId", "data-v-aeb360a2"]]);
export {d as t};