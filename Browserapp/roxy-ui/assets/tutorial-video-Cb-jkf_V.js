import {pt as e} from "./utils-BIWenCnY.js";
import {C as t,D as n,J as r,P as i,W as a,f as o,h as s,jt as c,m as l,tt as u,x as d} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as f} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {Z as p} from "./basecomponent-ClhuVxJN.js";
import {t as m} from "./rx-button-DyzuUt-V.js";
import {t as h} from "./useDialog-BC-nc8J-.js";
var g = { class: "relative max-w-80vw flex flex-col items-center gap-4 bg-transparent" };
var _ = ["src", "autoplay"];
var v = ["href"];
var y = t({ __name: "video-modal", props: { video: {}, external: {}, autoplay: { type: Boolean, default: !0 } }, emits: ["close"], setup(e2) {
  return (t2, n2) => {
    let r2 = p, i2 = m;
    return a(), s("div", g, [o("div", { class: "absolute top-4 right-4 flex items-center pa-1.5 rounded-full z-1 cursor-pointer bg-black bg-opacity-20 hover:bg-opacity-35 transition-all duration-300", onClick: n2[0] ||= f((e3) => t2.$emit("close"), ["stop"]) }, [d(r2, { class: "text-white", name: "base/rx_ic_delete" })]), o("roxy-video-player", { fullscreen: "", src: e2.video, autoplay: e2.autoplay }, null, 8, _), e2.external ? (a(), s("a", { key: 0, class: "self-end", href: e2.external, target: "_blank" }, [d(i2, { severity: "secondary", variant: "outlined", size: "lg", icon: "base/rx_ic_outlink", label: t2.$t("Youtube \u89C2\u770B") }, null, 8, ["label"])], 8, v)) : l("", !0)]);
  };
} });
var b = t({ inheritAttrs: !1, __name: "tutorial-video", props: { videoType: {}, videoUrl: {}, externalLink: {}, autoplay: { type: Boolean, default: !0 } }, setup(t2) {
  let a2 = u(), [o2] = h(), { getVideoMaps: s2 } = e();
  async function l2() {
    let { videoUrl: e2, externalLink: r2 } = t2.videoType ? await s2().then((e3) => e3[t2.videoType]) : { videoUrl: t2.videoUrl, externalLink: t2.externalLink };
    o2({ showHeader: !1, modal: !0, blockScroll: !0, pt: { root: "!bg-transparent !border-none !shadow-none", mask: "!z-3000" }, slots: { container: ({ hideModal: i2 }) => n(y, { video: e2, external: r2, autoplay: t2.autoplay, onClose: i2 }) } });
  }
  return (e2, t3) => r(e2.$slots, "default", { onPlay: l2 }, () => [d(m, i({ severity: "secondary", size: "md", icon: "base/rx_ic_video_play", variant: "text", label: e2.$t("\u89C2\u770B\u89C6\u9891") }, c(a2), { onClick: f(l2, ["stop"]) }), null, 16, ["label"])]);
} });
export {b as t};