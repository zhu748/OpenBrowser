import {C as e,P as t,W as n,d as r,h as i,jt as a,m as o} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as s} from "./theme-mq6SsndU.js";
var c = ["src"];
var l = e({ __name: "platform-icon", props: { platformIconDark: {}, platformIcon: {} }, setup(e2) {
  let l2 = e2, u = s(), d = r(() => (u.realTheme === "dark" ? l2.platformIconDark : l2.platformIcon) || l2.platformIcon);
  return (e3, r2) => a(d) ? (n(), i("img", t({ key: 0, class: "block", draggable: "false", src: a(d) }, e3.$attrs), null, 16, c)) : o("", !0);
} });
export {l as t};