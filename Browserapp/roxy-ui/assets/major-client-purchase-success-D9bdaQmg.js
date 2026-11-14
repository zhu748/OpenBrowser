import {C as i,J as o,P as s,St as c,W as u,at as p,f as _,h as v,jt as b,ut as C} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {f as T} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {o as D,p as re,u as ie} from "./dist-NctnpPRe.js";
import {t as k} from "./_plugin-vue_export-helper-BDNMzG2s.js";
var Jt = { class: "relative min-h-0 flex flex-col" };
var Yt = { class: "pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[var(--colors-background-bg-overlay)] to-transparent" };
var Xt = { class: "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-[var(--colors-background-bg-overlay)] to-transparent" };
var Zt = k(i({ inheritAttrs: !1, __name: "rx-mask-scroll", props: { showScrollbar: { type: Boolean, default: !1 } }, setup(e2, { expose: t2 }) {
  let n2 = p("scroll"), r2 = c(!1), i2 = c(!1);
  function a2() {
    let e3 = n2.value;
    if (!e3) return;
    let { scrollTop: t3, scrollHeight: a3, clientHeight: o2 } = e3, s2 = a3 > o2 + 1;
    r2.value = s2 && t3 > 0, i2.value = s2 && t3 + o2 < a3 - 1;
  }
  D(n2, "scroll", a2, { passive: !0 }), re(n2, a2), ie(n2, a2, { childList: !0, subtree: !0 });
  function l2() {
    let e3 = n2.value;
    e3 && e3.scrollTo({ top: e3.scrollHeight, behavior: "smooth" });
  }
  return t2({ updateMask: a2, scrollToBottom: l2 }), (t3, n3) => (u(), v("div", Jt, [_("div", s({ ref: "scroll", class: ["min-h-0 grow overflow-y-auto", { "hide-scrollbar": !e2.showScrollbar }] }, t3.$attrs), [o(t3.$slots, "default", {}, void 0, !0)], 16), C(_("div", Yt, null, 512), [[T, b(r2)]]), C(_("div", Xt, null, 512), [[T, b(i2)]])]));
} }), [["__scopeId", "data-v-8c6f4a01"]]);
export {Zt as r};