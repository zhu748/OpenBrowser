import {J as e,P as t,W as n,Y as r,h as i,x as a} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as o} from "./button-BKeo7L17.js";
import {t as s} from "./style-DSnaLsVx.js";
var c = { name: "OverlayBadge", extends: { name: "OverlayBadge", extends: o, style: s, provide: function() {
  return { $pcOverlayBadge: this, $parentInstance: this };
} }, inheritAttrs: !1, components: { Badge: o } };
function l(o2, s2, c2, l2, u, d) {
  var f = r("Badge");
  return n(), i("div", t({ class: o2.cx("root") }, o2.ptmi("root")), [e(o2.$slots, "default"), a(f, t(o2.$props, { pt: o2.ptm("pcBadge") }), null, 16, ["pt"])], 16);
}
c.render = l;
export {c as t};