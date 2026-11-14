import {J as e,W as t,m as n,p as r,s as i} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {G as a} from "./basecomponent-ClhuVxJN.js";
var o = { name: "Portal", props: { appendTo: { type: [String, Object], default: "body" }, disabled: { type: Boolean, default: !1 } }, data: function() {
  return { mounted: !1 };
}, mounted: function() {
  this.mounted = a();
}, computed: { inline: function() {
  return this.disabled || this.appendTo === "self";
} } };
function s(a2, o2, s2, c, l, u) {
  return u.inline ? e(a2.$slots, "default", { key: 0 }) : l.mounted ? (t(), r(i, { key: 1, to: s2.appendTo }, [e(a2.$slots, "default")], 8, ["to"])) : n("", !0);
}
o.render = s;
export {o as t};