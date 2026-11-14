import {di as e,h as t,hn as n,v as r,zt as i} from "./utils-BIWenCnY.js";
import {St as a,d as o,st as s} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {i as c} from "./agent-BmSFI9WH.js";
import {r as l,t as u} from "./_Primitives_tokens-N0m8cQDB.js";
function d() {
  return [{ label: $t("\u8DDF\u968F\u7CFB\u7EDF"), value: "system", icon: "base/rx_ic_laptop" }, { label: $t("\u6D45\u8272\u6A21\u5F0F"), value: "light", icon: "base/rx_ic_sun" }, { label: $t("\u6DF1\u8272\u6A21\u5F0F"), value: "dark", icon: "base/rx_ic_moon" }];
}
var f = new BroadcastChannel(i);
var p = c("theme", () => {
  let i2 = r(), c2 = a("system"), d2 = a("light"), p2 = o(() => d2.value === "dark");
  async function m(e2) {
    i2.token && c2.value !== e2 && t.base.userSetUserConfigCreate({ colorScheme: e2 }), c2.value = e2;
  }
  s(() => i2.userConfig?.colorScheme, () => {
    let e2 = i2.userConfig?.colorScheme;
    e2 && m(e2);
  });
  let h = n(() => {
    if (c2.value === "system") {
      let e2 = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", e2), document.documentElement.classList.toggle("app-dark", e2 === "dark"), d2.value = e2;
    } else document.documentElement.setAttribute("data-theme", c2.value), d2.value = c2.value, document.documentElement.classList.toggle("app-dark", c2.value === "dark");
    l({ primitive: u[d2.value] }), f.postMessage({ theme: c2.value }), e && globalThis.electronAPI.send("app:setSystemTheme", c2.value);
  }, 0);
  return window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", h), s(c2, h, { immediate: !0 }), f.onmessage = n((e2) => {
    let t2 = e2.data?.theme;
    t2 && t2 !== c2.value && (c2.value = t2);
  }, 60), { theme: c2, realTheme: d2, isDarkTheme: p2, setTheme: m };
}, { persist: !0 });
export {p as n,d as t};