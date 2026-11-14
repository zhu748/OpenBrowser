import {a as e,h as t,r as n,s as r,v as i,xr as a} from "./utils-BIWenCnY.js";
import {Et as o,St as s,d as c} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {a as l,n as u} from "./agent-BmSFI9WH.js";
import {t as d} from "./hooks-Jw3GridD.js";
import {i as f} from "./quick-kroUOSn_.js";
import {o as p} from "./utils-CnUy4XUk.js";
import {t as m} from "./useAsyncGate-D7VA7DLY.js";
import {t as h} from "./api-extract-BlmYcIz7.js";
import {a as g,i as _,o as v,r as y,t as b} from "./form-inputs-CnnG6T0O.js";
function x(x2 = {}) {
  let [S, C] = u(), { userConfig: w } = l(i()), { testProxy: E } = d(), D = s([]), O = s([]), k = s({}), A = s(!1), j = m(), M = c(() => [D.value, ...O.value]), N = c(() => j.isReady.value && !A.value && !!D.value.flatMap((field) => field.items ?? [field]).find((field) => field.name === "coreVersion")?.options?.some((option) => option.value && option.value !== "__useLatestCore__")), P = { mainSetting: D, extraSettings: O, original: k, inputsGroup: M };
  async function F(e2 = {}, t2 = {}) {
    await j.run(async () => {
      let [n2, r2] = await y(e2, S, j), [i2, a2, o2, s2] = n2;
      D.value = i2, O.value = [a2, o2, s2], k.value = r2, await x2.onInputsInitialized?.(P), I(), (t2.refreshFingerprint ?? !0) && D.value.flatMap((field) => field.items ?? [field]).find((field) => field.name === "coreVersion")?.options?.some((option) => option.value && option.value !== "__useLatestCore__") && await L(), await x2.onInitialized?.(P);
    });
  }
  function I(t2) {
    let n2 = t2 ?? x2.resolveMobileVisible?.(P), r2 = e(D.value, "os"), i2 = n2 ?? ["Android", "IOS"].includes(r2?.value?.value);
    _(O.value, i2);
  }
  async function L(e2) {
    let t2 = (Array.isArray(e2) ? e2 : void 0) ?? x2.getFingerprintInputs?.(P) ?? M.value, n2 = await j.run(() => b(t2));
    Object.assign(k.value, n2[0]);
  }
  async function R(e2) {
    await L(e2), S(0, $t("\u6307\u7EB9\u5237\u65B0\u6210\u529F"));
  }
  function z({ inputs: e2 = M.value, metadata: t2 = {}, createCount: i2 = 1, additionalParams: s2 = {} } = {}) {
    let c2 = n(o(t2), (e3) => !a(e3)), l2 = r(e2, c2);
    return { createCount: i2, ...k.value, ...l2, ...s2 };
  }
  function B(t2) {
    let n2 = e(D.value, "proxyInfoList");
    n2 && (n2.value = g(t2));
  }
  async function V(e2 = {}) {
    let t2 = z(e2), n2 = await h(t2, { checkChannel: w.value.ipChecker, isDirect: !1, testProxy: E });
    return n2 !== t2 && B(n2), n2;
  }
  async function H({ params: n2, buildParams: r2, beforeSubmit: i2, collectAdditionalParams: a2, onSuccess: o2, onFailure: s2 } = {}) {
    if (await j.waitUntilReady(), !A.value) {
      A.value = !0;
      try {
        if (await i2?.() === !1) return;
        let c2 = n2 ?? await r2?.() ?? z(), l2 = await a2?.(c2) ?? {}, u2 = { ...c2, ...l2 }, d2 = await h(u2, { checkChannel: w.value.ipChecker, isDirect: !1, testProxy: E });
        d2 !== u2 && B(d2);
        let m2 = v(d2);
        if (!p(m2.windowName)) {
          let t2 = f(e(D.value, "windowName"));
          t2 && (m2.windowName = t2);
        }
        let g2 = await t.window.userAddWindowInfoV2Create(m2);
        return C(g2.code, g2.msg), g2.code === 0 ? await o2?.(g2.data, m2) : await s2?.(g2, m2), g2;
      } finally {
        A.value = !1;
      }
    }
  }
  return { mainSetting: D, extraSettings: O, original: k, inputsGroup: M, loading: A, formGate: j, canSubmit: N, initialize: F, syncMobileVisibility: I, updateFingerprint: L, shuffleFingerprint: R, buildCreateParams: z, prepareCreateParams: V, executeSingleCreate: H };
}
export {x as t};