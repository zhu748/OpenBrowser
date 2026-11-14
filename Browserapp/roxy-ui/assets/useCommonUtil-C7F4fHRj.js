import {h as e,sn as t,v as n} from "./utils-BIWenCnY.js";
import {Et as r,ht as i,k as a} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as o} from "./locales-BfKu2SD4.js";
import {n as s} from "./agent-BmSFI9WH.js";
import {t as c} from "./useFormDialog-ChvKgFzE.js";
import {t as l} from "./hooks-Jw3GridD.js";
var u = "127.0.0.1";
function d(e2) {
  let t2 = e2.formatValue?.(e2) ?? e2.value;
  return e2.formatValue && t2 && typeof t2 == "object" && !Array.isArray(t2) ? t2 : { [e2.name]: i(t2) ? r(t2) : t2 };
}
function f(e2) {
  if (!Array.isArray(e2)) return { host: "", port: "" };
  let [t2, n2] = e2;
  return { host: (t2 ?? "").toString().trim(), port: n2 != null && n2 !== "" ? String(n2) : "" };
}
function p(e2, t2) {
  let n2 = e2.list.flatMap((e3) => e3.items), i2 = (e3) => n2.find((t3) => t3.name === e3), a2 = i2("proxyHostPort"), { host: o2, port: s2 } = f(r(a2?.value)), c2 = (o2 || t2?.proxyHost || u).toString().trim(), l2 = Number(s2 || t2?.proxyPort), d2 = Number.isFinite(l2) && l2 >= 1 && l2 <= 65535 ? String(l2) : "", p2 = i2("proxyProtocol")?.value ?? t2?.proxyProtocol;
  return p2 && typeof p2 == "object" && "value" in p2 && (p2 = p2.value), { host: c2, port: d2, proxyCategory: p2 || "SOCKS5", proxyUserName: i2("proxyUsername")?.value ?? t2?.proxyUsername ?? "", proxyPassword: i2("proxyPassword")?.value ?? t2?.proxyPassword ?? "", systemProxySwitch: !1, outerParamFirst: !0 };
}
function m(e2) {
  let t2 = e2.host?.toString().trim(), n2 = Number(e2.port);
  return !!t2 && Number.isFinite(n2) && n2 >= 1 && n2 <= 65535;
}
function h() {
  let [u2] = c(), [f2, h2] = s(), { testProxy: g, batchTestShowToast: _ } = l(), v = t(), y = n(), { fetchUserInfo: b, updateUserConfig: x } = y, S = a("dialogRef");
  async function C(t2) {
    if (t2.oldValue === t2.value) return;
    let { code: n2, msg: r2 } = await e.base.userChangeUsernameCreate({ userName: t2.value });
    h2(n2, r2), n2 === 0 && (b(), t2.oldValue = t2.value);
  }
  async function w(t2, n2 = null) {
    if (!t2.vaildator || t2.vaildator(t2)) {
      let n3 = t2.formatValue?.(t2) ?? t2.value, { code: a2, msg: o2 } = await e.base.userSetUserConfigCreate({ [t2.name]: n3 });
      h2(a2, o2), a2 === 0 && (globalThis.electronAPI.send("app:saveSoftConfig", { [t2.name]: i(n3) ? r(n3) : n3 }), console.log("saveUserConfig", t2.name, n3), x());
    }
  }
  async function T(e2) {
    if (e2.vaildator && !e2.vaildator(e2)) return;
    let t2 = d(e2);
    await globalThis.electronAPI.send("app:saveSoftConfig", t2), e2.oldValue = e2.name === "proxyHostPort" && Array.isArray(e2.value) ? [...e2.value] : e2.value;
  }
  async function E(e2) {
    let t2 = e2.list.flatMap((e3) => e3.items);
    for (let e3 of ["proxyHostPort", "proxyUsername", "proxyPassword", "proxyProtocol"]) {
      let n2 = t2.find((t3) => t3.name === e3);
      if (!n2) continue;
      let r2 = d(n2);
      await globalThis.electronAPI.send("app:saveSoftConfig", r2), n2.oldValue = n2.name === "proxyHostPort" && Array.isArray(n2.value) ? [...n2.value] : n2.value;
    }
  }
  async function D(e2) {
    try {
      e2.value = await globalThis.electronAPI.send("proxy:detectNetwork", "local");
    } catch (t2) {
      e2.value = null, h2(-1, t2);
    }
  }
  async function O(e2) {
    try {
      e2.value = await globalThis.electronAPI.send("proxy:detectNetwork", "system");
    } catch (t2) {
      e2.value = null, h2(-1, t2);
    }
  }
  async function k(e2, t2) {
    if (t2) try {
      let n2 = p(t2);
      if (!m(n2)) {
        h2(-1, o("\u8BF7\u5148\u586B\u5199\u5B8C\u6574\u7684\u4EE3\u7406 IP \u4FE1\u606F")), e2.value = null;
        return;
      }
      await E(t2);
      let r2 = await g(n2);
      e2.value = r2, _([r2], { reCheck: () => k(e2, t2) });
    } catch (t3) {
      e2.value = null, h2(-1, t3);
    }
  }
  return { dialogRef: S, showFormDialog: u2, showToast: f2, userStore: y, simpleLocale: v, updateUserName: C, saveUserConfig: w, saveLocalConfig: T, detectLocalNetwork: D, detectSystemNetwork: O, detectCustomAppNetwork: k, onlyErrorToast: h2 };
}
export {h as t};