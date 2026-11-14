import {C as e,W as t,d as n,f as r,h as i,in as a,jt as o,m as s,x as c} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as l} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {Z as u} from "./basecomponent-ClhuVxJN.js";
var d = ["href"];
var f = { class: "text-3 leading-none" };
var p = e({ __name: "check-channel-official-link", props: { option: {} }, setup(e2) {
  let p2 = n(() => {
    if (!e2.option?.external || !e2.option.value) return "";
    try {
      return new URL(e2.option.value).origin;
    } catch {
      return "";
    }
  });
  return (e3, n2) => o(p2) ? (t(), i("a", { key: 0, href: o(p2), target: "_blank", class: "mx-auto mr-0 flex items-center gap-1", onMousedown: n2[0] ||= l(() => {
  }, ["stop"]), onClick: n2[1] ||= l(() => {
  }, ["stop"]) }, [r("span", f, a(e3.$t("\u5B98\u7F51")), 1), c(o(u), { name: "base/rx_ic_outlink", size: "14" })], 40, d)) : s("", !0);
} });
function m(e2) {
  return (e2 ?? []).map((e3) => ({ ...e3, external: String(e3.label ?? "").toLocaleLowerCase().includes("ip123") }));
}
export {p as n,m as t};