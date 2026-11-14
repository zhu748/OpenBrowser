import {J as e,P as t,W as n,h as r} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as i} from "./basecomponent-ClhuVxJN.js";
import {n as a,t as o} from "./style-Cb9O3rwa.js";
var s = { name: "IconField", extends: { name: "BaseIconField", extends: i, style: a, provide: function() {
  return { $pcIconField: this, $parentInstance: this };
} }, inheritAttrs: !1 };
function c(i2, a2, o2, s2, c2, l2) {
  return n(), r("div", t({ class: i2.cx("root") }, i2.ptmi("root")), [e(i2.$slots, "default")], 16);
}
s.render = c;
var l = { name: "InputIcon", extends: { name: "BaseInputIcon", extends: i, style: o, props: { class: null }, provide: function() {
  return { $pcInputIcon: this, $parentInstance: this };
} }, inheritAttrs: !1, computed: { containerClass: function() {
  return [this.cx("root"), this.class];
} } };
function u(i2, a2, o2, s2, c2, l2) {
  return n(), r("span", t({ class: l2.containerClass }, i2.ptmi("root"), { "aria-hidden": "true" }), [e(i2.$slots, "default")], 16);
}
l.render = u;
export {s as n,l as t};