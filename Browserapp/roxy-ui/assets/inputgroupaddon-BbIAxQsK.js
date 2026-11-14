import {J as e,P as t,W as n,h as r} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as i} from "./basecomponent-ClhuVxJN.js";
import {n as a,t as o} from "./style-DlMJcXuZ.js";
var s = { name: "InputGroup", extends: { name: "BaseInputGroup", extends: i, style: a, provide: function() {
  return { $pcInputGroup: this, $parentInstance: this };
} }, inheritAttrs: !1 };
function c(i2, a2, o2, s2, c2, l2) {
  return n(), r("div", t({ class: i2.cx("root") }, i2.ptmi("root")), [e(i2.$slots, "default")], 16);
}
s.render = c;
var l = { name: "InputGroupAddon", extends: { name: "BaseInputGroupAddon", extends: i, style: o, provide: function() {
  return { $pcInputGroupAddon: this, $parentInstance: this };
} }, inheritAttrs: !1 };
function u(i2, a2, o2, s2, c2, l2) {
  return n(), r("div", t({ class: i2.cx("root") }, i2.ptmi("root")), [e(i2.$slots, "default")], 16);
}
l.render = u;
export {s as n,l as t};