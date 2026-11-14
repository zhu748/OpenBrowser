import {C as e,W as t,d as n,en as r,f as i,h as a,i as o,in as s,m as c,q as l,rn as u,x as d} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Z as f} from "./basecomponent-ClhuVxJN.js";
import {t as p} from "./_plugin-vue_export-helper-BDNMzG2s.js";
var m = { class: "w-216px flex flex-col gap-12px" };
var h = { class: "flex flex-col gap-4px" };
var g = { class: "flex gap-8px items-center" };
var _ = { class: "flex-1 text-12px text-[var(--component-tooltip-text-secondary)] font-600 ellipsis-1" };
var v = { class: "text-12px text-[var(--component-tooltip-text-secondary)] font-400" };
var y = { class: "pl-24px text-12px text-[var(--component-tooltip-text-secondary)] font-600 ellipsis-1" };
var b = { class: "flex flex-col gap-4px" };
var x = { class: "flex gap-8px items-center" };
var S = { class: "flex-1 text-12px text-[var(--component-tooltip-text-primary)] font-600 ellipsis-1" };
var C = { class: "text-12px text-[var(--component-tooltip-text-secondary)] font-400" };
var w = { class: "pl-24px text-12px text-[var(--component-tooltip-text-primary)] font-600 ellipsis-1" };
var T = e({ __name: "proxy-tooltip", props: { lastCountry: {}, lastCity: {}, lastIp: {}, checkTime: {}, beforeCountry: {}, beforeCity: {}, beforeIp: {}, beforeTime: {} }, setup(e2) {
  return (n2, r2) => {
    let l2 = f;
    return t(), a("div", m, [e2.beforeCountry !== "--" && e2.beforeIp !== e2.lastIp ? (t(), a(o, { key: 0 }, [i("div", h, [i("div", g, [d(l2, { class: "size-16px", fallback: "base/rx_ic_earth", name: `country-code/${e2.beforeCountry}` }, null, 8, ["name"]), i("div", _, s(e2.beforeCountry) + s(e2.beforeCity), 1), i("div", v, s(e2.beforeTime), 1)]), i("div", y, " IP: " + s(e2.beforeIp), 1)]), r2[0] ||= i("div", { class: "border-0 border-t-0.5 border-dashed border-[var(--component-tooltip-divider)]" }, null, -1)], 64)) : c("", !0), i("div", b, [i("div", x, [d(l2, { class: "size-16px", fallback: "base/rx_ic_earth", name: `country-code/${e2.lastCountry}` }, null, 8, ["name"]), i("div", S, s(e2.lastCountry) + s(e2.lastCity), 1), i("div", C, s(e2.checkTime), 1)]), i("div", w, " IP: " + s(e2.lastIp), 1)])]);
  };
} });
var E = { class: "erh-track" };
var D = 7;
var O = p(e({ __name: "earth", props: { duration: { default: 3.5 }, size: { default: 24 }, autoplay: { type: Boolean, default: !0 }, hoverPause: { type: Boolean, default: !1 }, color: {} }, setup(e2) {
  let s2 = e2, c2 = n(() => ({ "--erh-size": typeof s2.size == "number" ? `${s2.size}px` : s2.size, "--erh-frames": D, "--erh-duration": `${s2.duration}s` }));
  return (n2, s3) => {
    let p2 = f;
    return t(), a("div", { class: r(["erh", { "is-paused": !e2.autoplay, "is-hover-pause": e2.hoverPause }]), style: u(c2.value) }, [i("div", E, [(t(), a(o, null, l(D, (t2) => d(p2, { key: t2, name: `other/earth${t2}`, size: e2.size, color: e2.color }, null, 8, ["name", "size", "color"])), 64))])], 6);
  };
} }), [["__scopeId", "data-v-374be9fd"]]);
export {T as n,O as t};