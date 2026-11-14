import {a as e,h as t,s as n,v as r,vt as i,wt as a,yt as o} from "./utils-BIWenCnY.js";
import {C as s,Et as ee,L as c,St as l,W as u,_t as d,d as f,en as te,f as p,h as m,jt as h,lt as g,ut as _,x as v} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {a as ne,n as re} from "./agent-BmSFI9WH.js";
import {b as ie,y as ae} from "./rich-html-link-VdBpR3Cm.js";
import {t as y} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as oe} from "./tooltip-BYYKWrvu.js";
import {t as se} from "./rx-button-DyzuUt-V.js";
import {t as ce} from "./hooks-Jw3GridD.js";
import {t as le} from "./views-header-CcjwXPjG.js";
import {a as ue} from "./use-tag-menu-DZnIrtE9.js";
import {a as b,n as x,t as S} from "./useAsyncGate-D7VA7DLY.js";
import {i as C,n as w,r as T} from "./createDefaultAccordions-CO1KkbkO.js";
import {t as E} from "./api-extract-BlmYcIz7.js";
import {a as D,o as O,r as k,t as A} from "./form-inputs-CnnG6T0O.js";
import {t as j} from "./mate-group-CBm6kY0g.js";
var M = { class: "relative flex min-h-0 flex-col h-full" };
var N = { class: "px-16 flex flex-1 min-h-0 overflow-hidden overflow-x-auto" };
var P = { class: "flex min-h-0 min-w-0 flex-1 flex-col" };
var F = { class: "footer flex shrink-0 items-center justify-end gap-2 px-4 py-4 min-h-16" };
var I = y(s({ __name: "edit", setup(s2) {
  let y2 = ie(), I2 = ae(), { mixpanelTrack: L } = r(), { userConfig: R } = ne(r()), { testProxy: de } = ce(), [B, V] = re(), { path: H, query: fe } = a(), { invalidateCache: U } = o();
  b({ isBatch: l(!1), createCount: l(0) });
  let pe = l(w()), W = l(), G = l(), K = l(), q = l(!1), J = l(!1), Y = S(), X = l(!1), Z = l({}), Q = f(() => X.value && Y.isReady.value && !J.value), me = f(() => W.value?.[0] ?? []);
  c(async () => {
    X.value = !1;
    let { code: e2, data: { rows: [n2] }, msg: r2 } = await t.window.userGetWindowInfoV2List({ windowIds: I2.query.id, isDelete: 0, page_index: 1, page_size: 1 });
    if (e2 !== 0) {
      V(e2, r2);
      return;
    }
    Z.value = n2;
    let [i2, a2] = await k(n2, B, Y);
    W.value = i2, G.value = a2, _e(), K.value = { projectName: n2.projectName, projectId: n2.projectId == null || n2.projectId === "" ? void 0 : String(n2.projectId), labelIds: (n2.labelIds || []).map((e3) => ue(e3)), windowRemark: n2.windowRemark }, X.value = !0;
  });
  async function he() {
    let e2 = await Y.run(() => A(W.value));
    Object.assign(G.value, e2[0]), B(0, $t("\u6307\u7EB9\u5237\u65B0\u6210\u529F"));
  }
  function ge() {
    U(i.BROWSER_LIST, { projectId: "" });
    let e2 = new Set([K.value?.projectId, Z.value?.projectId].filter((e3) => e3 != null && String(e3) !== "").map(String));
    for (let t2 of e2) U(i.BROWSER_LIST, { projectId: t2 });
  }
  async function $() {
    if (!X.value || !W.value) return;
    await Y.waitUntilReady();
    let r2 = n(W.value, ee(K.value)), a2 = { ...G.value, ...r2 }, o2 = await E(a2, { checkChannel: R.value.ipChecker, isDirect: !1, testProxy: de });
    if (o2 !== a2) {
      let t2 = e(W.value[0] ?? [], "proxyInfoList");
      t2 && (t2.value = D(o2));
    }
    let s3 = O(o2);
    J.value = !0;
    let { code: c2, msg: l2 } = await t.window.userMdfWindowInfoSingleV2Create(s3);
    J.value = !1, V(c2, l2), c2 === 0 && (L("profile_edit"), ge(), U(i.ACCOUNT_LIST), H === "/browser/edit" ? y2.replace({ path: "/browser" }) : y2.replace({ path: H, query: fe }));
  }
  function _e() {
    ["platformUrl", "platformUserName", "platformPassword"].forEach((e2) => {
      Reflect.set(G.value, e2, "");
    });
  }
  return (e2, t2) => {
    let n2 = le, r2 = se, i2 = oe;
    return u(), m("div", M, [v(n2, { "show-back": "", title: e2.$t("\u7F16\u8F91\u7A97\u53E3") }, null, 8, ["title"]), p("div", N, [p("div", { class: te(["w-full h-full flex min-h-0 gap-8 ma-auto", [h(q) ? "min-w-192 max-w-192" : "min-w-240 max-w-285"]]) }, [p("div", P, [v(x, { class: "min-h-0 min-w-0 flex-1", accordions: h(pe), "inputs-group": h(W) }, { before: g(() => [v(C, { "window-inputs": h(me) }, null, 8, ["window-inputs"])]), _: 1 }, 8, ["accordions", "inputs-group"]), p("div", F, [v(j, { modelValue: h(K), "onUpdate:modelValue": t2[0] ||= (e3) => d(K) ? K.value = e3 : null, class: "flex-1", "is-edit": "" }, null, 8, ["modelValue"]), _(v(r2, { severity: "primary", label: e2.$t("\u4FDD\u5B58"), disabled: !h(Q), loading: h(J), onClick: $ }, null, 8, ["label", "disabled", "loading"]), [[i2, h(Q) ? "" : e2.$t("\u6B63\u5728\u540C\u6B65\u6307\u7EB9\uFF0C\u8BF7\u7A0D\u540E"), void 0, { top: !0 }]])])]), v(T, { collapsed: h(q), "onUpdate:collapsed": t2[1] ||= (e3) => d(q) ? q.value = e3 : null, "inputs-group": h(W), "is-edit": "", "on-shuffle": he }, null, 8, ["collapsed", "inputs-group"])], 2)])]);
  };
} }), [["__scopeId", "data-v-261a7b66"]]);
export {I as default};