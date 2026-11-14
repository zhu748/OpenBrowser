import {ar as e,at as t,gr as n,h as r,nn as i} from "./utils-BIWenCnY.js";
import {C as a,Et as o,G as c,N as u,R as d,St as f,V as p,W as m,Y as h,_t as g,at as _,b as v,bt as y,d as b,en as x,f as S,h as C,i as w,in as T,jt as E,k as D,kt as O,lt as k,m as A,p as j,q as M,rt as ee,ut as N,x as P} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as F} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as te} from "./agent-BmSFI9WH.js";
import {n as L} from "./usetoast-DphSlejX.js";
import {Z as R} from "./basecomponent-ClhuVxJN.js";
import {t as z} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as B} from "./useconfirm-CV4GTWBW.js";
import {n as ne} from "./usedialog-Dh0xp3r7.js";
import {t as V} from "./tooltip-BYYKWrvu.js";
import {t as H} from "./rx-button-DyzuUt-V.js";
import {t as U} from "./rx-divider-Ci3C58Q3.js";
import {n as W} from "./useRouteContext-Cfh7KChG.js";
import {t as K} from "./rx-alert-A_y5uvgP.js";
import {t as q} from "./inputtext-Crzvb5jQ.js";
import {t as ie} from "./useDialog-BC-nc8J-.js";
import {t as ae} from "./usePopupMenu-BRw1zJ0m.js";
import {t as oe} from "./rx-toggle-switch-BI8eb18U.js";
import {t as J} from "./textarea-DvuriTzI.js";
import {t as Y} from "./rx-tabs-Dp-8mudX.js";
import {t as ce} from "./simplePopup-D6H7ykCr.js";
import {t as le} from "./rx-tag-BIY_xUFU.js";
import {t as ue} from "./related-info-VU3nxvtB.js";
import {t as de} from "./rx-select-button-DQtmZ0kT.js";
import {n as pe,t as me} from "./table-BJcS2I0Z.js";
import {t as he} from "./custom-new-empty-CLCRgYs2.js";
import {i as ge,n as X,r as _e,t as ve} from "./rx-accordion-BvZbJmSm.js";
var Z = (function(e2) {
  return e2[e2.none = 0] = "none", e2[e2.update = 1] = "update", e2;
})({});
var xe = (function(e2) {
  return e2[e2.all = 0] = "all", e2[e2.partial = 1] = "partial", e2[e2.none = 2] = "none", e2;
})({});
var Se = (function(e2) {
  return e2[e2.notInstalled = 0] = "notInstalled", e2[e2.installed = 1] = "installed", e2;
})({});
var Ce = (function(e2) {
  return e2.sys = "sys", e2.local = "local", e2.store = "store", e2;
})({});
function we(e2) {
  return { sys: $t("\u5185\u7F6E\u6269\u5C55"), local: $t("\u672C\u5730\u4E0A\u4F20"), store: "Chrome Web Store" }[e2];
}
var Q = { personal: 2 };
var Te = { installedTab: $t("\u5DF2\u5B89\u88C5\u6269\u5C55"), infoColumn: $t("\u6269\u5C55\u4FE1\u606F"), noUpdateNeeded: $t("\u6682\u65E0\u9700\u8981\u66F4\u65B0\u7684\u6269\u5C55"), addGoogle: $t("\u6DFB\u52A0 Google \u6269\u5C55"), googleStoreUrlPlaceholder: $t("\u8BF7\u8F93\u5165 Google Store \u4E2D\u6269\u5C55\u7684 URL"), deleteHeader: $t("\u5220\u9664\u6269\u5C55"), deleteMessage: $t("\u60A8\u786E\u8BA4\u8981\u5220\u9664\u6240\u9009\u6269\u5C55\u5417\uFF1F\u5220\u9664\u540E\uFF0C\u6240\u6709\u5DF2\u5173\u8054\u9879\u76EE\u4E2D\u7684\u7A97\u53E3\u6269\u5C55\u5C06\u88AB\u79FB\u9664\u3002"), securityCheck: $t("\u6269\u5C55\u5B89\u5168\u6027\u68C0\u67E5"), emptyTitle: $t("\u6682\u65E0\u6269\u5C55"), emptyDesc: $t("\u5728\u6B64\u6DFB\u52A0\u6269\u5C55\u4EE5\u7BA1\u7406\uFF0C\u5E76\u66F4\u65B9\u4FBF\u5730\u4E0E\u7A97\u53E3\u6216\u9879\u76EE\u8FDB\u884C\u7ED1\u5B9A\u3002"), searchButton: $t("\u641C\u7D22\u6269\u5C55"), searchPlaceholder: $t("\u641C\u7D22\u60A8\u7684\u5E38\u7528\u6269\u5C55"), notFoundMessageKeypath: $t("\u6682\u672A\u627E\u5230\u76F8\u5173\u6269\u5C55\uFF0C\u8BF7\u524D\u5F80 {link} \u67E5\u770B\u66F4\u591A\u6269\u5C55", { link: "{link}" }), installToWindow: $t("\u6269\u5C55\u5C06\u88AB\u5B89\u88C5\u81F3\u6240\u9009\u9879\u76EE\u4E2D\u7684 Chrome \u5185\u6838\u7A97\u53E3"), changeInList: $t("\u60A8\u53EF\u4EE5\u5728\u6269\u5C55\u5217\u8868\u4E2D\u66F4\u6539\u6B64\u9009\u9879"), securityAlertTitle: $t(`Roxy\u6D4F\u89C8\u5668\u9F13\u52B1\u60A8\u81EA\u884C\u901A\u8FC7\u6743\u5A01\u673A\u6784\u68C0\u67E5\u6269\u5C55\u7684\u5B89\u5168\u6027\uFF0C\u4EE5\u6B64\u6765\u51CF\u5C11\u56E0\u4F7F\u7528\u6076\u610F\u6269\u5C55\u800C\u5BFC\u81F4\u4E1A\u52A1\u8D44\u4EA7\u635F\u5931\u7684\u62C5\u5FE7\u3002

\u60A8\u53EF\u4EE5\u6839\u636E\u4EE5\u4E0B\u63A8\u8350\u6B65\u9AA4\u8FDB\u884C\u6269\u5C55\u5B89\u5168\u6027\u68C0\u67E5\u3002`), openFolderStep: $t("1. \u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u6253\u5F00\u8BE5\u6269\u5C55\u6240\u5728\u7684\u672C\u5730\u6587\u4EF6\u5939"), itemFolder: $t("\u6269\u5C55\u6587\u4EF6\u5939"), itemLoading: $t("\u6269\u5C55\u52A0\u8F7D\u4E2D..."), uploadFormat: $t("\u652F\u6301Zip, CRX \u683C\u5F0F\u7684\u6269\u5C55\uFF0C\u6700\u5927\u4E0D\u8D85\u8FC7 50MB"), googleOnly: $t("\u5F53\u524D\u4EC5\u652F\u6301 Google \u6269\u5C55\uFF0C\u6682\u4E0D\u652F\u6301 Firefox \u6269\u5C55\u3002"), nameLabel: $t("\u6269\u5C55\u540D\u79F0"), descLabel: $t("\u6269\u5C55\u63CF\u8FF0"), guideNoteKeypath: $t("\u8BF7\u6CE8\u610F\u60A8\u7684\u6269\u5C55\u9700\u8981\u6EE1\u8DB3{guide}\u4EE5\u786E\u4FDD\u80FD\u6B63\u5E38\u8FD0\u884C", { guide: "{guide}" }), googleProtocolLink: $t("Google \u6269\u5C55\u534F\u8BAE"), installedProjectsColumn: $t("\u5DF2\u5B89\u88C5\u9879\u76EE"), installToProject: $t("\u5B89\u88C5\u5230\u9879\u76EE"), installToProjectTitle: $t("\u5B89\u88C5\u5230\u9879\u76EE:"), projectNameColumn: $t("\u9879\u76EE\u540D\u79F0"), selectAtLeastOneProject: $t("\u8BF7\u9009\u62E9\u81F3\u5C11\u4E00\u4E2A\u9879\u76EE"), howToGetTitle: $t("Roxy\u6D4F\u89C8\u5668\u5982\u4F55\u83B7\u53D6\u6269\u5C55\uFF1F"), howToGetDesc1: $t("Roxy\u6D4F\u89C8\u5668\u901A\u8FC7\u9075\u5FAA Google Chrome \u5B98\u65B9\u5236\u5B9A\u7684\u6269\u5C55\u7A0B\u5E8F\u5206\u53D1\u4E0E\u66F4\u65B0\u89C4\u8303\u6765\u83B7\u53D6.crx \u5B89\u88C5\u6587\u4EF6\u3002"), howToGetDesc2: $t("\u6839\u636E Chrome \u6269\u5C55\u7684 Manifest \u6587\u4EF6\u683C\u5F0F\u5B98\u65B9\u6587\u6863(1)\uFF0C\u6240\u6709\u53D1\u5E03\u5728 Chrome \u5E94\u7528\u5546\u5E97\u7684\u6269\u5C55\u7A0B\u5E8F\uFF0C\u5176\u66F4\u65B0\u670D\u52A1\u5747\u7531 Google \u5B98\u65B9\u7684\u66F4\u65B0\u670D\u52A1\u5668(\u540E\u53F0\u5730\u5740\u4E3A https://clients2.google.com/service/update2/crx)\u7EDF\u4E00\u7BA1\u7406\u3002Roxy\u6D4F\u89C8\u5668\u901A\u8FC7\u5411\u6B64\u5B98\u65B9\u670D\u52A1\u53D1\u9001\u4E00\u4E2A\u6807\u51C6\u5316\u7684\u66F4\u65B0\u68C0\u67E5\u8BF7\u6C42(\u5305\u542B\u76EE\u6807\u6269\u5C55\u7A0B\u5E8F\u7684\u552F\u4E00ID)\uFF0C\u6A21\u62DF\u6D4F\u89C8\u5668\u83B7\u53D6\u6700\u65B0\u3001\u6700\u5B89\u5168\u5B98\u65B9\u6269\u5C55\u5305\u7684\u8FC7\u7A0B\u3002\u6B64\u64CD\u4F5C\u7B26\u5408 Chrome \u6269\u5C55\u5206\u53D1\u6307\u5357(2)\u4E2D\u7684\u66F4\u65B0\u673A\u5236\u3002"), howToGetPracticeNote: $t("\u6CE8\u610F\u4E8B\u9879\uFF1A\u90E8\u5206\u4E0D\u7B26\u5408 Chrome \u6700\u65B0\u5B9E\u8DF5\u7684\u6269\u5C55\u5373\u4FBF\u53EF\u4EE5\u901A\u8FC7\u6B64\u65B9\u5F0F\u83B7\u53D6\uFF0C\u4E5F\u53EF\u80FD\u65E0\u6CD5\u5728\u8F83\u9AD8\u7684\u5185\u6838\u7248\u672C\u4E2D\u542F\u7528\uFF0C\u4E0E\u5B98\u65B9\u89C4\u5219\u4FDD\u6301\u4E00\u81F4\u3002") };
var Ee = { installedTab: $t("\u5DF2\u5B89\u88C5\u63D2\u4EF6"), infoColumn: $t("\u63D2\u4EF6\u4FE1\u606F"), noUpdateNeeded: $t("\u6682\u65E0\u9700\u8981\u66F4\u65B0\u7684\u63D2\u4EF6"), addGoogle: $t("\u6DFB\u52A0 Google \u63D2\u4EF6"), googleStoreUrlPlaceholder: $t("\u8BF7\u8F93\u5165 Google Store \u4E2D\u63D2\u4EF6\u7684 URL"), deleteHeader: $t("\u5220\u9664\u63D2\u4EF6"), deleteMessage: $t("\u60A8\u786E\u8BA4\u8981\u5220\u9664\u6240\u9009\u63D2\u4EF6\u5417\uFF1F\u5220\u9664\u540E\uFF0C\u6240\u6709\u5DF2\u5173\u8054\u5206\u7EC4\u4E2D\u7684\u8D26\u53F7\u63D2\u4EF6\u5C06\u88AB\u79FB\u9664\u3002"), securityCheck: $t("\u63D2\u4EF6\u5B89\u5168\u6027\u68C0\u67E5"), emptyTitle: $t("\u6682\u65E0\u63D2\u4EF6"), emptyDesc: $t("\u5728\u6B64\u6DFB\u52A0\u63D2\u4EF6\u4EE5\u7BA1\u7406\uFF0C\u5E76\u66F4\u65B9\u4FBF\u5730\u4E0E\u8D26\u53F7\u6216\u5206\u7EC4\u8FDB\u884C\u7ED1\u5B9A\u3002"), searchButton: $t("\u641C\u7D22\u63D2\u4EF6"), searchPlaceholder: $t("\u641C\u7D22\u60A8\u7684\u5E38\u7528\u63D2\u4EF6"), notFoundMessageKeypath: $t("\u6682\u672A\u627E\u5230\u76F8\u5173\u63D2\u4EF6\uFF0C\u8BF7\u524D\u5F80 {link} \u67E5\u770B\u66F4\u591A\u63D2\u4EF6", { link: "{link}" }), installToWindow: $t("\u63D2\u4EF6\u5C06\u88AB\u5B89\u88C5\u81F3\u6240\u9009\u5206\u7EC4\u4E2D\u7684 Chrome \u5185\u6838\u8D26\u53F7"), changeInList: $t("\u60A8\u53EF\u4EE5\u5728\u63D2\u4EF6\u5217\u8868\u4E2D\u66F4\u6539\u6B64\u9009\u9879"), securityAlertTitle: $t(`Roxy\u6D4F\u89C8\u5668\u9F13\u52B1\u60A8\u81EA\u884C\u901A\u8FC7\u6743\u5A01\u673A\u6784\u68C0\u67E5\u63D2\u4EF6\u7684\u5B89\u5168\u6027\uFF0C\u4EE5\u6B64\u6765\u51CF\u5C11\u56E0\u4F7F\u7528\u6076\u610F\u63D2\u4EF6\u800C\u5BFC\u81F4\u4E1A\u52A1\u8D44\u4EA7\u635F\u5931\u7684\u62C5\u5FE7\u3002

\u60A8\u53EF\u4EE5\u6839\u636E\u4EE5\u4E0B\u63A8\u8350\u6B65\u9AA4\u8FDB\u884C\u63D2\u4EF6\u5B89\u5168\u6027\u68C0\u67E5\u3002`), openFolderStep: $t("1. \u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u6253\u5F00\u8BE5\u63D2\u4EF6\u6240\u5728\u7684\u672C\u5730\u6587\u4EF6\u5939"), itemFolder: $t("\u63D2\u4EF6\u6587\u4EF6\u5939"), itemLoading: $t("\u63D2\u4EF6\u52A0\u8F7D\u4E2D..."), uploadFormat: $t("\u652F\u6301Zip, CRX \u683C\u5F0F\u7684\u63D2\u4EF6\uFF0C\u6700\u5927\u4E0D\u8D85\u8FC7 50MB"), googleOnly: $t("\u5F53\u524D\u4EC5\u652F\u6301 Google \u63D2\u4EF6\uFF0C\u6682\u4E0D\u652F\u6301 Firefox \u63D2\u4EF6\u3002"), nameLabel: $t("\u63D2\u4EF6\u540D\u79F0"), descLabel: $t("\u63D2\u4EF6\u63CF\u8FF0"), guideNoteKeypath: $t("\u8BF7\u6CE8\u610F\u60A8\u7684\u63D2\u4EF6\u9700\u8981\u6EE1\u8DB3{guide}\u4EE5\u786E\u4FDD\u80FD\u6B63\u5E38\u8FD0\u884C", { guide: "{guide}" }), googleProtocolLink: $t("Google \u63D2\u4EF6\u534F\u8BAE"), installedProjectsColumn: $t("\u5DF2\u5B89\u88C5\u5206\u7EC4"), installToProject: $t("\u5B89\u88C5\u5230\u5206\u7EC4"), installToProjectTitle: $t("\u5B89\u88C5\u5230\u5206\u7EC4:"), projectNameColumn: $t("\u5206\u7EC4\u540D\u79F0"), selectAtLeastOneProject: $t("\u8BF7\u9009\u62E9\u81F3\u5C11\u4E00\u4E2A\u5206\u7EC4"), howToGetTitle: $t("Roxy\u6D4F\u89C8\u5668\u5982\u4F55\u83B7\u53D6\u63D2\u4EF6\uFF1F"), howToGetDesc1: $t("Roxy\u6D4F\u89C8\u5668\u901A\u8FC7\u9075\u5FAA Google Chrome \u5B98\u65B9\u5236\u5B9A\u7684\u63D2\u4EF6\u5206\u53D1\u4E0E\u66F4\u65B0\u89C4\u8303\u6765\u83B7\u53D6.crx \u5B89\u88C5\u6587\u4EF6\u3002"), howToGetDesc2: $t("\u6839\u636E Chrome \u63D2\u4EF6\u7684 Manifest \u6587\u4EF6\u683C\u5F0F\u5B98\u65B9\u6587\u6863(1)\uFF0C\u6240\u6709\u53D1\u5E03\u5728 Chrome \u5E94\u7528\u5546\u5E97\u7684\u63D2\u4EF6\uFF0C\u5176\u66F4\u65B0\u670D\u52A1\u5747\u7531 Google \u5B98\u65B9\u7684\u66F4\u65B0\u670D\u52A1\u5668(\u540E\u53F0\u5730\u5740\u4E3A https://clients2.google.com/service/update2/crx)\u7EDF\u4E00\u7BA1\u7406\u3002Roxy\u6D4F\u89C8\u5668\u901A\u8FC7\u5411\u6B64\u5B98\u65B9\u670D\u52A1\u53D1\u9001\u4E00\u4E2A\u6807\u51C6\u5316\u7684\u66F4\u65B0\u68C0\u67E5\u8BF7\u6C42(\u5305\u542B\u76EE\u6807\u63D2\u4EF6\u7684\u552F\u4E00ID)\uFF0C\u6A21\u62DF\u6D4F\u89C8\u5668\u83B7\u53D6\u6700\u65B0\u3001\u6700\u5B89\u5168\u5B98\u65B9\u63D2\u4EF6\u5305\u7684\u8FC7\u7A0B\u3002\u6B64\u64CD\u4F5C\u7B26\u5408 Chrome \u63D2\u4EF6\u5206\u53D1\u6307\u5357(2)\u4E2D\u7684\u66F4\u65B0\u673A\u5236\u3002"), howToGetPracticeNote: $t("\u6CE8\u610F\u4E8B\u9879\uFF1A\u90E8\u5206\u4E0D\u7B26\u5408 Chrome \u6700\u65B0\u5B9E\u8DF5\u7684\u63D2\u4EF6\u5373\u4FBF\u53EF\u4EE5\u901A\u8FC7\u6B64\u65B9\u5F0F\u83B7\u53D6\uFF0C\u4E5F\u53EF\u80FD\u65E0\u6CD5\u5728\u8F83\u9AD8\u7684\u5185\u6838\u7248\u672C\u4E2D\u542F\u7528\uFF0C\u4E0E\u5B98\u65B9\u89C4\u5219\u4FDD\u6301\u4E00\u81F4\u3002") };
function De(e2) {
  let t2 = e2 === "plugin";
  return { mode: e2, ...t2 ? Ee : Te, formatCheckUpdateWithCount: (e3) => t2 ? $t("\u68C0\u67E5\u66F4\u65B0\u5B8C\u6210\uFF0C{count}\u4E2A\u63D2\u4EF6\u6709\u66F4\u65B0", { count: e3 }) : $t("\u68C0\u67E5\u66F4\u65B0\u5B8C\u6210\uFF0C{count}\u4E2A\u6269\u5C55\u6709\u66F4\u65B0", { count: e3 }) };
}
var Oe = /* @__PURE__ */ Symbol("extensionLabels");
function $(e2) {
  if (e2 !== void 0) {
    let t3 = b(() => De(O(e2)));
    return c(Oe, t3), t3;
  }
  let { isEcommerce: t2 } = W();
  return D(Oe, () => b(() => De(t2.value ? "plugin" : "extension")), !0);
}
var ke = { class: "flex flex-col overflow-y-hidden popup" };
var Ae = { key: 0, class: "extension" };
var je = { class: "extension-icon" };
var Me = ["src"];
var Ne = { class: "extension-name" };
var Pe = { class: "extension-version" };
var Fe = { class: "title" };
var Ie = { class: "description" };
var Le = { class: "project-table mt-2.5 h-60" };
var Re = { class: "flex items-center gap-2" };
var ze = { class: "project-name" };
var Ue = { class: "flex justify-end items-center gap-3" };
var We = z(a({ __name: "install-extension", setup(e2) {
  let [t2, n2] = te(), { check: a2 } = i(), o2 = $(), s2 = Q.personal.toString(), c2 = "2", l2 = D("dialogRef"), u2 = f(), d2 = f(), h2 = f(), _2 = f(s2), y2 = b(() => [{ header: o2.value.projectNameColumn, field: "projectName", slot: "project" }]), x2 = f([]), w2 = f(!1), O2 = f();
  async function j2() {
    if (w2.value) return;
    let { data: e3 } = await r.limit.userGetProjectInfoByWorkspaceList({ default: 2 }), t3 = e3.rows ?? [];
    x2.value = t3, w2.value = !0, O2.value = t3.filter((e4) => u2.value.bindPluginId?.includes(e4.project_id));
  }
  function M2() {
    let e3 = new Map(O2.value?.map((e4) => [e4.project_id, e4.project_id])), t3 = x2.value.map((t4) => e3.get(t4.project_id) === t4.project_id ? Se.installed : Se.notInstalled);
    return { installStatus: t3, installType: t3.includes(Se.notInstalled) ? xe.partial : xe.all };
  }
  async function ee2() {
    if (u2.value.required && !O2.value?.length) n2(-1, o2.value.selectAtLeastOneProject);
    else try {
      let e3 = { pluginSwitchType: Number(_2.value), projectId: x2.value?.map((e4) => e4.project_id), ...M2() };
      await d2.value?.(e3), N2();
    } catch (e3) {
      console.log(e3);
    }
  }
  function N2() {
    l2.value.close(), h2.value?.();
  }
  return p(() => {
    let { props: e3, onConfirm: t3, onCancel: n3 } = l2.value.data;
    u2.value = e3, _2.value = e3.pluginSwitchType?.toString() || s2, d2.value = t3, h2.value = n3, j2();
  }), (e3, t3) => {
    let n3 = R, r2 = U, i2 = oe, l3 = H;
    return m(), C("div", ke, [E(u2) ? (m(), C("div", Ae, [S("div", je, [S("img", { class: "extension-icon-image", src: E(u2).pluginIcon }, null, 8, Me)]), S("div", Ne, T(E(u2).pluginName), 1), S("div", Pe, " v" + T(E(u2).pluginVersion), 1)])) : A("", !0), S("div", null, [S("div", Fe, T(E(o2).installToProjectTitle), 1), S("div", Ie, [P(n3, { name: "base/rx_ic_info_fill", size: 12, color: "#A3A9AD" }), v(" " + T(E(o2).installToWindow), 1)]), S("div", Le, [P(me, { selection: E(O2), "onUpdate:selection": t3[0] ||= (e4) => g(O2) ? O2.value = e4 : null, "data-key": "project_id", columns: E(y2), "data-list": E(x2), regions: { header: !1, paginator: !1, actions: !1, selectionBar: !1 }, "selection-mode": "multiple", size: "small" }, { project: k(({ data: e4 }) => [S("div", Re, [P(E(R), { name: "base/rx_ic_stack", color: "var(--colors-icon-icon-secondary, #575D61)" }), S("span", ze, T(e4.projectName), 1)])]), _: 1 }, 8, ["selection", "columns", "data-list"])]), A("", !0)]), S("div", Ue, [P(l3, { size: "sm", label: e3.$t("\u53D6\u6D88"), text: "", severity: "secondary", autofocus: "", onClick: F(N2, ["stop"]) }, null, 8, ["label"]), P(l3, { size: "sm", label: e3.$t("\u4FDD\u5B58"), autofocus: "", onClick: F(ee2, ["stop"]) }, null, 8, ["label"])])]);
  };
} }), [["__scopeId", "data-v-b6b19e28"]]);
var ot = { class: "flex flex-col popup" };
var st = { class: "popup-title" };
var ct = { class: "upload-title" };
var lt = { class: "flex items-center gap-4 mt-1" };
var ut = { class: "upload-or" };
var dt = { class: "flex items-center gap-1 mt-1" };
var ft = { class: "upload-tip" };
var ht = { class: "flex items-center gap-1 mt-1" };
var gt = { class: "upload-tip" };
var _t = { key: 0, class: "extension" };
var vt = { class: "extension-icon" };
var yt = ["src"];
var bt = { class: "flex justify-between items-center extension-name" };
var xt = { class: "extension-name-length" };
var St = { key: 1, class: "flex flex-col gap-1.5 description" };
var Ct = { class: "flex justify-between items-center" };
var wt = { class: "description-length" };
var Tt = { class: "guide" };
var Et = { href: "https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline#june_3_2024_the_manifest_v2_phase-out_begins", target: "_blank", rel: "noopener noreferrer", class: "text-blue decoration-underline cursor-pointer" };
var Dt = { class: "footer" };
var Ot = z(a({ __name: "upload-extension", setup(e2) {
  let t2 = D("dialogRef"), n2 = L(), r2 = $(), i2 = f(), a2 = f(), o2 = f(), s2 = f(), c2 = f();
  async function l2(e3) {
    try {
      const selected = await globalThis.electronAPI.send("extension:getSelectedExtensionInfo", e3);
      if (selected.type === "cancel") return;
      if (selected.type !== "success") throw Error(selected.message || "\u6269\u5C55\u8BFB\u53D6\u5931\u8D25");
      s2.value = { type: "success", isSuccess: !0, ...selected.data };
    } catch (error) {
      n2.add({ severity: "error", summary: error.message, life: 5e3 });
    }
  }
  async function u2() {
    let { pluginPath: e3, pluginIconPath: n3 } = s2.value, { localKey: r3, pluginDir: i3 } = t2.value.data;
    c2.value = await globalThis.electronAPI.send("extension:stageLocal", { pluginDir: i3, pluginPath: e3, pluginIconPath: n3, localKey: r3 });
  }
  async function d2() {
    try {
      await u2(), await a2.value?.({ source: Ce.local, ...s2.value, ...c2.value }), g2();
    } catch (e3) {
      n2.add({ severity: "error", summary: $t("\u53D1\u751F\u9519\u8BEF"), detail: e3, life: 2500 });
    }
  }
  function g2() {
    t2.value.close(), o2.value?.();
  }
  return p(() => {
    let { props: e3, onConfirm: n3, onCancel: r3 } = t2.value.data;
    i2.value = e3, a2.value = n3, o2.value = r3;
  }), (e3, t3) => {
    let n3 = H, i3 = q, a3 = J, o3 = h("i18n-t");
    return m(), C("div", ot, [S("div", st, T(e3.$t("\u672C\u5730\u4E0A\u4F20")), 1), S("div", null, [S("div", ct, T(e3.$t("\u8BF7\u9009\u62E9\u4E0A\u4F20\u65B9\u5F0F")), 1), S("div", lt, [P(n3, { outlined: "", icon: "base/rx_ic_export", label: e3.$t("\u9009\u62E9\u538B\u7F29\u5305"), onClick: t3[0] ||= (e4) => l2("file") }, null, 8, ["label"]), S("span", ut, T(e3.$t("\u6216")), 1), P(n3, { outlined: "", severity: "secondary", icon: "base/rx_ic_folder", label: e3.$t("\u9009\u62E9\u6587\u4EF6\u5939"), onClick: t3[1] ||= (e4) => l2("dir") }, null, 8, ["label"])]), S("div", dt, [P(E(R), { name: "base/rx_ic_info_fill", size: 12, color: "#A3A9AD" }), S("span", ft, T(E(r2).uploadFormat), 1)]), A("", !0), S("div", ht, [P(E(R), { name: "base/rx_ic_info_fill", size: 12, color: "#A3A9AD" }), S("span", gt, T(E(r2).googleOnly), 1)])]), E(s2)?.isSuccess ? (m(), C("div", _t, [S("div", vt, [S("img", { class: "extension-icon-image", src: E(s2).pluginIconPath }, null, 8, yt)]), S("div", bt, [S("span", null, T(E(r2).nameLabel), 1), S("span", xt, T(E(s2).pluginName.length) + "/50", 1)]), P(i3, { modelValue: E(s2).pluginName, "onUpdate:modelValue": t3[2] ||= (e4) => E(s2).pluginName = e4, class: "extension-input", maxlength: "50", type: "text" }, null, 8, ["modelValue"])])) : A("", !0), E(s2)?.isSuccess ? (m(), C("div", St, [S("div", Ct, [S("span", null, T(E(r2).descLabel), 1), S("span", wt, T(E(s2).pluginDesc?.length || 0) + "/500", 1)]), P(a3, { modelValue: E(s2).pluginDesc, "onUpdate:modelValue": t3[3] ||= (e4) => E(s2).pluginDesc = e4, class: "w-full description-input", maxlength: "500", rows: "3" }, null, 8, ["modelValue"])])) : A("", !0), S("div", Tt, [P(o3, { keypath: E(r2).guideNoteKeypath, scope: "global" }, { guide: k(() => [S("a", Et, T(E(r2).googleProtocolLink), 1)]), _: 1 }, 8, ["keypath"])]), S("div", Dt, [P(n3, { size: "sm", label: e3.$t("\u53D6\u6D88"), text: "", severity: "secondary", autofocus: "", onClick: g2 }, null, 8, ["label"]), P(n3, { size: "sm", label: e3.$t("\u4E0A\u4F20"), disabled: !E(s2)?.isSuccess, autofocus: "", onClick: d2 }, null, 8, ["label", "disabled"])])]);
  };
} }), [["__scopeId", "data-v-10e70494"]]);
var kt = { class: "shield-dialog" };
var At = { class: "extension-info" };
var jt = { class: "extension-info-icon" };
var Mt = ["src"];
var Nt = { class: "extension-info-content" };
var Pt = { class: "extension-info-name" };
var Ft = { class: "extension-info-version" };
var It = { class: "extension-info-step" };
var Lt = { class: "extension-info-step-title" };
var Rt = { class: "extension-info-step" };
var zt = { class: "extension-info-step-title" };
var Bt = { class: "extension-info-step-list" };
var Vt = { class: "extension-info-step-item-icon" };
var Ht = ["src"];
var Ut = { class: "extension-info-step-item-content" };
var Wt = { class: "extension-info-step-item-name" };
var Gt = ["href"];
var Kt = { class: "extension-info-step-item-desc" };
var qt = z(a({ __name: "shield-dialog", props: { extensionInfo: {} }, setup(e2) {
  let t2 = e2, r2 = $(), i2 = f(!1), a2 = L(), s2 = [{ name: "VirusTotal", icon: n("shield/virustotal.png"), link: "virustotal.com", desc: $t("\u7531\u8C37\u6B4C\u8FD0\u8425\u7684\u77E5\u540D\u5728\u7EBF\u75C5\u6BD2\u68C0\u6D4B\u5E73\u53F0\uFF0C\u88AB\u5168\u7403\u5B89\u5168\u4E13\u5BB6\u5E7F\u6CDB\u4FE1\u8D56\u3002") }, { name: "Metadefender", icon: n("shield/metadefender.png"), link: "metadefender.com", desc: $t("\u4EE5\u591A\u91CD\u626B\u63CF\u6280\u672F\u548C\u6076\u610F\u8F6F\u4EF6\u68C0\u6D4B\u80FD\u529B\u4EAB\u8A89\u4E1A\u754C\uFF0C\u83B7\u56FD\u9645\u5B89\u5168\u673A\u6784\u8BA4\u53EF\u3002") }, { name: "Kaspersky", icon: n("shield/kaspersky.png"), link: "opentip.kaspersky.com", desc: $t("\u4F9D\u6258\u5361\u5DF4\u65AF\u57FA\u5728\u7F51\u7EDC\u5B89\u5168\u9886\u57DF\u7684\u6DF1\u539A\u6280\u672F\uFF0C\u63D0\u4F9B\u5B9E\u65F6\u6076\u610F\u6587\u4EF6\u5206\u6790\u670D\u52A1\u3002") }];
  async function c2() {
    try {
      let e3 = await globalThis.electronAPI.send("extension:getExtensionInfo", t2.extensionInfo.pluginDir);
      console.log("checkExtensionInfo", e3), i2.value = !0;
    } catch (e3) {
      console.error(`checkExtensionInfo error: ${e3}`), i2.value = !1, globalThis.electronAPI.send("extension:download", [o(t2.extensionInfo)]);
    }
  }
  function l2() {
    globalThis.electronAPI.send("extension:showExtensionDir", t2.extensionInfo.pluginDir);
  }
  let u2 = globalThis.electronAPI.on("extension:download-progress", (e3) => {
    console.log("extension:download-progress", e3), e3.extID === t2.extensionInfo.pluginDir && (i2.value = e3.percent === 100), e3.errorTips && a2.add({ severity: "error", summary: e3.errorTips, life: 3e3 });
  });
  return d(() => {
    u2();
  }), c2(), (t3, n2) => {
    let a3 = H;
    return m(), C("div", kt, [S("div", At, [S("div", jt, [S("img", { src: e2.extensionInfo.pluginIcon, alt: "" }, null, 8, Mt)]), S("div", Nt, [S("div", Pt, T(e2.extensionInfo.pluginName), 1), S("div", Ft, " v" + T(e2.extensionInfo.pluginVersion), 1)])]), P(E(K), { class: "whitespace-pre-wrap w-full", closable: !1, type: "info", title: E(r2).securityAlertTitle }, null, 8, ["title"]), S("div", It, [S("div", Lt, T(E(r2).openFolderStep), 1), P(a3, { icon: "base/rx_ic_folder", outlined: "", label: E(i2) ? E(r2).itemFolder : E(r2).itemLoading, loading: !E(i2), onClick: l2 }, null, 8, ["label", "loading"])]), S("div", Rt, [S("div", zt, T(t3.$t("2. \u5C06\u6587\u4EF6\u4E0A\u4F20\u81F3\u4E0B\u5217\u4EFB\u610F\u6743\u5A01\u6E20\u9053\u8FDB\u884C\u5B89\u5168\u6027\u68C0\u67E5")), 1), S("div", Bt, [(m(), C(w, null, M(s2, (e3) => S("div", { key: e3.name, class: "extension-info-step-item" }, [S("div", Vt, [S("img", { src: e3.icon, alt: "" }, null, 8, Ht)]), S("div", Ut, [S("div", Wt, [v(T(e3.name) + " ", 1), S("a", { href: `https://${e3.link}`, target: "_blank", class: "extension-info-step-item-link" }, [P(E(R), { name: "base/rx_ic_link", size: "14px" }), v(" " + T(e3.link), 1)], 8, Gt)]), S("div", Kt, T(e3.desc), 1)])])), 64))])])]);
  };
} }), [["__scopeId", "data-v-a8922f30"]]);
var Jt = { class: "flex flex-col gap-2" };
var Yt = { class: "flex items-center gap-1" };
var Xt = { class: "tt-tertiary text-3" };
var Zt = { class: "flex items-center gap-2.5" };
var Qt = { class: "title" };
var en = { class: "w-full flex flex-col gap-2.5 pl-5" };
var tn = { class: "desc" };
var nn = z(a({ __name: "how-to-get", setup(e2) {
  let t2 = $(), n2 = b(() => [t2.value.howToGetDesc1, t2.value.howToGetDesc2]);
  return (e3, r2) => {
    let i2 = R, a2 = _e, o2 = ge, s2 = X, c2 = ve;
    return m(), C("div", Jt, [S("div", Yt, [P(i2, { name: "base/rx_ic_info_fill", size: 12, color: "#A3A9AD" }), S("span", Xt, T(E(t2).googleOnly), 1)]), P(c2, null, { default: k(() => [P(s2, { value: "111", pt: { root: e3.panel.root } }, { default: k(() => [P(a2, { as: "div", pt: { root: "!py-3 !px-4" } }, { default: k(({ active: e4 }) => [S("div", Zt, [P(i2, { class: x([{ "rotate-90": e4 }, "transition-transform duration-300"]), name: "base/rx_ic_play", size: "10" }, null, 8, ["class"]), S("span", Qt, T(E(t2).howToGetTitle), 1)])]), _: 1 }), P(o2, null, { default: k(() => [S("div", en, [(m(!0), C(w, null, M(E(n2), (e4) => (m(), C("div", { key: e4, class: "desc" }, T(e4), 1))), 128)), r2[0] ||= S("div", { class: "desc" }, [v(" (1) Manifest file format: "), S("a", { class: "link", target: "_blank", href: "https://developer.chrome.com/docs/extensions/reference/manifest/" }, "https://developer.chrome.com/docs/extensions/reference/manifest/"), v("(update_url) ")], -1), r2[1] ||= S("div", { class: "desc" }, [v(" (2) Distribute your extension: "), S("a", { class: "link", target: "_blank", href: "https://developer.chrome.com/docs/extensions/how-to/distribute/" }, "https://developer.chrome.com/docs/extensions/how-to/distribute/")], -1), S("div", tn, T(E(t2).howToGetPracticeNote), 1)])]), _: 1 })]), _: 1 }, 8, ["pt"])]), _: 1 })]);
  };
} }), [["__cssModules", { panel: { root: "_root_1ddg9_2" } }], ["__scopeId", "data-v-e80b049b"]]);
var rn = { class: "flex items-start justify-between w-full" };
var an = { class: "group-button" };
var on = { class: "flex gap-3" };
var sn = { class: "flex items-center gap-3 w-75" };
var cn = ["src"];
var ln = { class: "flex flex-col justify-center items-start w-full extension-info" };
var un = { class: "w-full ellipsis-1 extension-info-name" };
var dn = { class: "extension-info-version" };
var hn = ["onClick"];
var gn = { class: "flex items-center gap-1.5" };
var _n = { class: "not-installed" };
var vn = { key: 1 };
var yn = { key: 0, class: "flex items-end gap-1" };
var bn = { key: 0, class: "flex items-center gap-3" };
var xn = { key: 1, class: "update-info" };
var Sn = { class: "flex items-center" };
var Cn = z(a({ __name: "index", props: { needsync: {}, needsyncModifiers: {} }, emits: u(["search", "dataChange"], ["update:needsync"]), setup(n2, { expose: a2, emit: s2 }) {
  let c2 = s2, l2 = B(), u2 = ne(), d2 = t(), { check: p2 } = i(), { showSimpleDialog: h2 } = ce(), [g2, v2] = te(), [D2] = ie(), { showMenu: O2 } = ae(), M2 = ee(n2, "needsync"), I2 = _("extable"), L2 = $(), z2 = f({}), U2 = f({}), W2 = b(() => [{ header: L2.value.infoColumn, field: "extension", slot: "extension" }, { header: $t("\u6765\u6E90"), field: "source", getText: (e2) => we(e2.source) || $t("\u672A\u77E5") }, { header: L2.value.installedProjectsColumn, field: "related", slot: "related" }, { header: $t("\u66F4\u65B0\u4FE1\u606F"), field: "pluginUpdateState", slot: "update" }]), G2 = y({ value: void 0, options: [], onChange() {
    I2.value?.refresh(), M2.value = !0;
  }, resetFilters() {
    G2.value = void 0, G2.onChange();
  } });
  async function K2(e2) {
    let t2 = await r.plugins.userGetPluginListList(e2);
    return c2("dataChange", t2), t2;
  }
  async function q2(e2, t2) {
    O2(e2, { mode: { type: "single", value: t2.fixedPlugin, options: [{ label: $t("\u81EA\u5B9A\u4E49"), name: "customize" }, { label: $t("\u59CB\u7EC8\u56FA\u5B9A\u5230\u5DE5\u5177\u680F"), name: "pin" }, { label: $t("\u59CB\u7EC8\u4E0D\u56FA\u5B9A\u5230\u5DE5\u5177\u680F"), name: "unpin" }] }, menuProps: { onHide: async ({ value: e3 }) => {
      e3 !== t2.fixedPlugin && (await r.plugins.userFixedPluginToWindowCreate({ id: t2.id, fixedPlugin: e3 }), t2.fixedPlugin = e3);
    } }, slots: { start: () => P("div", { class: "pl-4 pt-2" }, [$t("\u56FA\u5B9A\u65B9\u5F0F")]) } });
  }
  function re2(e2) {
    return oe2(e2.rows ?? e2.row);
  }
  function oe2(e2) {
    let t2 = [].concat(e2), n3 = !t2.some((e3) => e3.pluginSwitchType !== Q.personal), r2 = t2.some((e3) => e3.pluginUpdateState === Z.update);
    return [{ key: "checkUpdate", label: $t("\u68C0\u67E5\u66F4\u65B0"), icon: "base/rx_ic_clock_rotate", power: n3 || p2("Plugin_Installed_check_update"), multiple: { name: "G1", showLabel: !0 }, visible: !1, tooltip: $t("\u68C0\u67E5\u66F4\u65B0"), quick: !0, command: ({ item: t3 }) => {
      J2(t3, e2);
    } }, { key: "update", label: $t("\u66F4\u65B0"), icon: "base/rx_ic_renew", power: n3 || p2("Plugin_Installed_check_update"), visible: r2, disabled: !r2, disabledTooltip: L2.value.noUpdateNeeded, multiple: { name: "G2", showLabel: !0 }, command: ({ item: t3 }) => {
      J2(t3, e2);
    } }, { key: "edit", label: $t("\u7F16\u8F91"), icon: "base/rx_ic_edit", power: n3 || d2.isOwner, visible: e2.source === "local", command: ({ item: t3 }) => {
      J2(t3, e2);
    } }, { key: "install", label: L2.value.installToProject, icon: "base/rx_ic_stack_install", power: n3 || p2("Plugin_Installed_modify_attribution"), command: ({ item: t3 }) => {
      J2(t3, e2);
    } }, { power: n3 || p2("Plugin_Installed_delete_plugin"), separator: !0 }, { key: "delete", label: $t("\u5220\u9664"), icon: "base/rx_ic_bin_1", disabled: t2.some((e3) => !e3.canDelete), disabledTooltip: $t("\u9009\u9879\u4E2D\u5305\u542B\u5176\u4ED6\u4EBA\u7684\u63D2\u4EF6"), power: n3 || p2("Plugin_Installed_delete_plugin"), multiple: { name: "G4", showLabel: !0 }, command: ({ item: t3 }) => {
      J2(t3, e2);
    } }];
  }
  async function J2(e2, t2) {
    let n3 = [].concat(o(t2));
    switch (e2.key ?? e2.name) {
      case "install":
        X2(t2);
        break;
      case "updateLocal":
        break;
      case "checkUpdate":
        return ve2(t2);
      case "update":
        ye2(t2);
        break;
      case "edit":
        ge2(t2);
        break;
      case "delete":
        await be2(n3);
    }
  }
  function se2() {
    h2({ title: L2.value.addGoogle, confirmText: $t("\u786E\u8BA4\u6DFB\u52A0"), inputs: [{ name: "url", type: "text", props: { placeholder: L2.value.googleStoreUrlPlaceholder, preIcon: "base/rx_ic_link" } }], onConfirm: async (e2) => {
      try {
        let { code: t2, data: n3, msg: i2 } = await r.plugins.userUploadChromePluginsV2Create(e2);
        if (t2 !== 0) {
          if (t2 === 421) {
            G2.resetFilters(), X2(n3);
            return;
          }
          v2(t2, i2);
          return;
        }
        G2.resetFilters(), X2(await _e2(n3.plugin_id));
      } catch (e3) {
        throw v2(-1, e3), e3;
      }
    }, afterRender: () => P(nn, null, null) });
  }
  function ge2(e2 = {}) {
    let { pluginDir: t2, localKey: n3 } = e2;
    u2.open(Ot, { props: { showHeader: !1, modal: !0, blockScroll: !0 }, data: { localKey: n3, pluginDir: t2, onConfirm: async (e3) => {
      try {
        e3.pluginDir = t2 || e3.pluginDir;
        let { code: n4, data: i2, msg: a3 } = await r.plugins.userUploadPluginInfoCreate(e3);
        if (v2(n4, a3), n4 === 0) {
          G2.resetFilters();
          let e4 = await _e2(i2.plugin_id);
          t2 || X2(e4);
        }
      } catch (e4) {
        throw v2(-1, e4), e4;
      }
    } } });
  }
  async function X2(e2) {
    e2 && u2.open(We, { props: { showHeader: !1, modal: !0, blockScroll: !0 }, data: { props: e2, onConfirm: async (t2) => {
      try {
        let { code: n3, msg: i2 } = await r.plugins.userAddPluginToWindowCreate({ ...t2, pluginId: e2.id });
        n3 === 0 && globalThis.electronAPI.send("extension:download", [o(e2)]), v2(n3, i2), I2.value?.refresh({ pluginSwitchType: G2.value });
      } catch (e3) {
        console.log(e3);
      }
    } } });
  }
  async function _e2(e2) {
    let { data: { rows: [t2] } } = await r.plugins.userGetPluginInfoByIdList({ pluginId: e2 });
    return t2;
  }
  async function ve2(t2) {
    let n3 = [].concat(t2).filter((e2) => e2.source !== Ce.local || !z2.value[e2.pluginDir]);
    n3.forEach((e2) => {
      z2.value[e2.pluginDir] = !0;
    });
    let i2 = (await e(n3.map((e2) => () => r.plugins.userCheckAllPluginsVersionList({ pluginDir: e2.pluginDir, pluginID: e2.id }).then((t3) => {
      if (t3.code === 0 && t3.data) {
        let n4 = t3.data.pluginUpdateStates[0];
        e2.pluginUpdateState = n4?.pluginUpdateState ?? e2.pluginUpdateState, e2.pluginNewVersion = n4?.pluginNewVersion ?? e2.pluginNewVersion, e2.pluginVersion = n4?.pluginVersion ?? e2.pluginVersion;
      }
      return t3;
    }).finally(() => {
      z2.value[e2.pluginDir] = !1;
    })), 2)).filter((e2) => e2.code === 0 && e2.data ? e2.data.pluginUpdateStates[0]?.pluginUpdateState === Z.update : !1).length, a3 = n3.length > 1 ? L2.value.formatCheckUpdateWithCount(i2) : $t("\u68C0\u67E5\u66F4\u65B0\u5B8C\u6210");
    g2(0, a3);
  }
  async function ye2(t2) {
    let n3 = [].concat(t2).filter((e2) => e2.pluginUpdateState === Z.update).map((e2) => (Reflect.set(U2.value, e2.pluginDir, !0), async () => {
      let { code: t3, msg: n4 } = await r.plugins.userUpgradePluginsCreate({ pluginDir: e2.pluginDir, pluginName: e2.pluginName, pluginID: e2.id });
      return v2(t3, `${e2.pluginName}: ${n4}`), Reflect.deleteProperty(U2.value, e2.pluginDir), { code: t3, msg: n4 };
    }));
    await e(n3, 2), G2.resetFilters();
  }
  async function be2(e2) {
    let { promise: t2, resolve: n3 } = Promise.withResolvers();
    return l2.require({ header: L2.value.deleteHeader, message: L2.value.deleteMessage, rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: async () => {
      try {
        let t3 = e2.map((e3) => e3.id), { code: n4, msg: i2 } = await r.plugins.userBatchDelPluginInfoCreate({ ids: t3 });
        v2(n4, i2), n4 === 0 && (G2.resetFilters(), globalThis.electronAPI.send("extension:remove", e2.map((e3) => e3.pluginDir)));
      } catch (e3) {
        throw v2(-1, e3), e3;
      } finally {
        n3();
      }
    }, reject: n3, onHide: n3 }), t2;
  }
  function xe2(e2) {
    D2({ header: L2.value.securityCheck, class: "w-480px", slots: { default: () => P(qt, { extensionInfo: e2 }, null), footer: void 0 } });
  }
  return a2({ refresh: () => {
    I2.value?.refresh({ pluginSwitchType: G2.value });
  } }), (e2, t2) => {
    let n3 = de, r2 = H, i2 = he, a3 = R, o2 = le, s3 = ue, c3 = V;
    return m(), j(me, { ref: "extable", "cache-key": "extension-list", remember: "extension-list", scrollable: "", "selection-mode": "multiple", model: re2, "table-request": K2, columns: E(W2), "virtual-scroller-options": { itemSize: 60 }, "show-gridlines": !1 }, { "filter-after": k(() => [S("div", rn, [A("", !0), S("div", an, [P(r2, { size: "xxs", icon: "base/rx_ic_download_cloud", label: E(L2).addGoogle, onClick: F(se2, ["stop"]) }, null, 8, ["label"]), P(r2, { outlined: "", severity: "secondary", size: "xxs", icon: "base/rx_ic_export", label: e2.$t("\u672C\u5730\u4E0A\u4F20"), onClick: t2[1] ||= F((e3) => ge2(), ["stop"]) }, null, 8, ["label"])])])]), empty: k(() => [P(i2, { icon: "base/rx_ic_extension_store", img: "empty-extensions.png", title: E(L2).emptyTitle, desc: E(L2).emptyDesc }, { extra: k(() => [S("div", on, [P(r2, { outlined: "", severity: "secondary", size: "md", icon: "base/rx_ic_magnify", label: E(L2).searchButton, onClick: t2[2] ||= F((t3) => ge2(), ["stop"]) }, null, 8, ["label"]), A("", !0)])]), _: 1 }, 8, ["title", "desc"])]), extension: k(({ data: e3 }) => [S("div", sn, [S("img", { class: "extension-image", src: e3.pluginIcon }, null, 8, cn), S("div", ln, [S("div", un, T(e3.pluginName), 1), S("div", dn, " v" + T(e3.pluginVersion), 1)])])]), related: k(({ data: t3 }) => [t3.pluginSwitchType === E(Q).personal || E(d2).isOwner || E(d2).isManager ? (m(), C("div", { key: 0, onClick: F((e3) => J2({ name: "install" }, t3), ["stop"]) }, [P(s3, { class: "cursor-pointer", icon: "base/rx_ic_stack", list: t3.bindPlugin }, { empty: k(() => [S("div", gn, [P(o2, { class: "cursor-pointer", icon: "base/rx_ic_stack" }), S("span", _n, T(e2.$t("\u5C1A\u672A\u5B89\u88C5")), 1)])]), _: 1 }, 8, ["list"])], 8, hn)) : (m(), C("div", vn, " -- "))]), update: k(({ data: n4 }) => [E(z2)[n4.pluginDir] ? (m(), C("span", yn, [S("span", null, T(e2.$t("\u68C0\u67E5\u4E2D")), 1), t2[3] ||= S("span", { class: "dots" }, null, -1)])) : (m(), C(w, { key: 1 }, [n4.pluginUpdateState === E(Z).update ? (m(), C("div", bn, [P(r2, { severity: "success", icon: "base/rx_ic_renew", loading: E(U2)[n4.pluginDir], label: e2.$t("\u66F4\u65B0"), size: "xxs", onClick: F((e3) => ye2(n4), ["stop"]) }, null, 8, ["loading", "label", "onClick"]), N(P(a3, { name: "base/rx_ic_info", color: "var(--colors-icon-icon-note)" }, null, 512), [[c3, { value: `latest: ${n4.pluginNewVersion}`, showDelay: 500 }, void 0, { top: !0 }]])])) : (m(), C("div", xn, " -- "))], 64))]), actions: k(({ data: t3, isPending: n4, model: i3, openMenu: o3 }) => [S("div", Sn, [t3.pluginSwitchType === E(Q).personal || E(p2)("Plugin_Installed_pin_to_toolbar") ? N((m(), j(r2, { key: 0, text: "", severity: "secondary", size: "xxs", onClick: F((e3) => q2(e3, t3), ["stop"]) }, { icon: k(() => [P(a3, { class: x(["block pointer-events-none", { pinned: t3.fixedPlugin === "pin" }]), name: t3.fixedPlugin === "pin" ? "base/rx_ic_pin_solid_02" : "base/rx_ic_pin_line_02", color: "var(--colors-icon-icon-secondary)" }, null, 8, ["class", "name"])]), _: 2 }, 1032, ["onClick"])), [[c3, { value: e2.$t("\u56FA\u5B9A"), showDelay: 500 }, void 0, { top: !0 }]]) : A("", !0), N(P(r2, { severity: "secondary", size: "xxs", icon: "base/rx_ic_shield", text: "", onClick: F((e3) => xe2(t3), ["stop"]) }, null, 8, ["onClick"]), [[c3, { value: e2.$t("\u5B89\u5168\u68C0\u67E5"), showDelay: 500 }, void 0, { top: !0 }]]), P(pe, { model: i3, data: t3, "is-pending": n4, onMore: o3 }, null, 8, ["model", "data", "is-pending", "onMore"])])]), _: 1 }, 8, ["columns"]);
  };
} }), [["__scopeId", "data-v-871f865f"]]);
var wn = { class: "flex flex-col h-full w-full extensions" };
var Tn = { class: "w-full flex flex-col" };
var En = { class: "flex-1 overflow-hidden" };
var kn = a({ __name: "index", props: { mode: {} }, setup(e2) {
  let t2 = $(b(() => e2.mode ?? "extension")), n2 = b(() => [{ title: t2.value.installedTab, value: "installed", slot: "installed" }]), r2 = !0, i2 = f("installed"), a2 = _("listref"), o2 = _("hubref"), s2 = f(!1), c2 = f(!1);
  function l2(e3) {
    r2 = !1, e3 === "installed" && s2.value && (a2.value?.refresh(), s2.value = !1);
  }
  function u2() {
    r2 = !1;
  }
  function d2(e3) {
    r2 = !1;
  }
  return (e3, t3) => {
    let r3 = Y;
    return m(), C("div", wn, [P(r3, { value: E(i2), "onUpdate:value": [t3[2] ||= (e4) => g(i2) ? i2.value = e4 : null, l2], class: "flex-1 overflow-hidden", tabs: E(n2), "head-tabs": "" }, { installed: k(() => [S("div", Tn, [S("div", En, [P(Cn, { ref: "listref", needsync: E(c2), "onUpdate:needsync": t3[0] ||= (e4) => g(c2) ? c2.value = e4 : null, onSearch: u2, onDataChange: d2 }, null, 8, ["needsync"])])])]), _: 1 }, 8, ["value", "tabs"])]);
  };
} });
export {kn as t};