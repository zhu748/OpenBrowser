import {sn as t,v as n} from "./utils-BIWenCnY.js";
import {C as r,D as i,W as a,Z as o,d as s,en as c,f as l,h as u,in as d,jt as f,m as p,p as m,x as h} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {o as g} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as _} from "./isString-DgRFdIis.js";
import {Z as v} from "./basecomponent-ClhuVxJN.js";
import {t as y} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as b} from "./rx-button-DyzuUt-V.js";
import {t as x} from "./useDialog-BC-nc8J-.js";
var S = { class: "w-120 inline-flex flex-col pa-6 pt-4 gap-4" };
var C = { class: "flex justify-between items-center" };
var w = { class: "header" };
var T = { key: 0, class: "block w-full rounded-md", autoplay: "", muted: "", loop: "", playsinline: "" };
var E = ["src"];
var D = ["src"];
var O = { class: "flex flex-col gap-6" };
var k = y(r({ __name: "guide-modal", props: { title: {}, desc: { type: [String, Function] }, video: {}, image: {} }, emits: ["close", "confirm"], setup(e2) {
  let t2 = g("guide"), n2 = s(() => _(e2.desc) ? () => i("div", { class: t2.text }, e2.desc) : e2.desc);
  return (t3, r2) => {
    let i2 = v, s2 = b;
    return a(), u("div", S, [l("div", C, [l("span", w, d(e2.title), 1), h(i2, { class: "cursor-pointer", name: "base/rx_ic_delete", size: "20", color: "var(--colors-icon-icon-secondary)", onClick: r2[0] ||= (e3) => t3.$emit("close") })]), e2.video ? (a(), u("video", T, [l("source", { src: e2.video, type: "video/webm" }, null, 8, E)])) : p("", !0), e2.image ? (a(), u("img", { key: 1, class: "block w-full rounded-md", src: e2.image }, null, 8, D)) : p("", !0), l("div", O, [(a(), m(o(f(n2)), { class: c(t3.guide.text) }, null, 8, ["class"]))]), h(s2, { class: "self-end", size: "md", label: t3.$t("\u4E86\u89E3"), onClick: r2[1] ||= (e3) => t3.$emit("confirm") }, null, 8, ["label"])]);
  };
} }), [["__cssModules", { guide: { text: "_text_1futz_2" } }], ["__scopeId", "data-v-cc600978"]]);
function A() {
  let [r2] = x(), a2 = n(), { getVideoSource: o2 } = t(), c2 = s(() => a2.userInfo.onboardingTaskStatus);
  async function l2(t2) {const previous=await globalThis.__localRequest('settings:get');const onboardingTaskStatus={...previous.onboardingTaskStatus,...t};await globalThis.__localRequest('settings:set',{onboardingTaskStatus});Object.assign(a.userInfo,{onboardingTaskStatus});}
  function u2(e2) {
    r2({ showHeader: !1, modal: !0, blockScroll: !0, handleCancel: () => l2({ [e2]: !0 }), slots: { container: ({ handleCancel: e3 }) => i(k, { title: $t("\u6559\u7A0B\u63D0\u793A"), desc: $t('\u5F53\u60A8\u5BF9 Roxy\u6D4F\u89C8\u5668\u7684\u4EA7\u54C1\u529F\u80FD\u4E0D\u719F\u6089\u6216\u5E0C\u671B\u5B66\u4E60\u66F4\u591A\u6280\u5DE7\u65F6\uFF0C\u53EF\u4EE5\u968F\u65F6\u901A\u8FC7\u53F3\u4E0B\u65B9\u84DD\u8272\u6309\u94AE\u627E\u5230"\u6559\u7A0B"\u5165\u53E3\u3002'), video: o2("tour-hide-guide.mp4"), onClose: e3, onConfirm: e3 }) } });
  }
  return { onboardingTaskStatus: c2, updateOnboardingTaskStatus: l2, closeGuideTipsAndUpdateTaskStatus: u2 };
}
export {k as n,A as t};