import {C as e,H as t,St as n,V as r,W as i,b as a,bt as o,d as s,en as c,f as l,h as u,i as d,in as f,jt as p,m,q as h,st as ee,x as g,y as te} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as ne} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as re} from "./agent-BmSFI9WH.js";
import {Z as ie} from "./basecomponent-ClhuVxJN.js";
import {t as v} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as y} from "./AgentInput-CVahkFed.js";
function ae() {
  const call = (method, p2 = {}) => globalThis.__agentRequest("mcp:" + method, p2);
  return { listMcpServers: () => call("list"), upsertMcpServer: (name, config, oldName) => call("upsert", { name, config, oldName }), importMcpServers: (mcpServers) => call("import", { mcpServers }), deleteMcpServer: (name) => call("delete", { name }), enableMcpServer: (name) => call("enable", { name }), disableMcpServer: (name) => call("disable", { name }), testMcpServer: (name, config) => call("test", { name, config }) };
}
var b = { save: { http: () => $t("MCP \u670D\u52A1\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u540D\u79F0\u3001URL \u548C HTTP \u8BF7\u6C42\u5934\u540E\u91CD\u8BD5"), stdio: () => $t("MCP \u670D\u52A1\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u540D\u79F0\u3001\u547D\u4EE4\u548C\u73AF\u5883\u53D8\u91CF\u540E\u91CD\u8BD5") }, validate: { http: () => $t("MCP \u670D\u52A1\u9A8C\u8BC1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u540D\u79F0\u3001URL \u548C HTTP \u8BF7\u6C42\u5934\u540E\u91CD\u8BD5"), stdio: () => $t("MCP \u670D\u52A1\u9A8C\u8BC1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u540D\u79F0\u3001\u547D\u4EE4\u548C\u73AF\u5883\u53D8\u91CF\u540E\u91CD\u8BD5") } };
function x(e2) {
  if (typeof e2 == "string") return e2;
  if (e2 instanceof Error) return e2.message;
  if (e2 && typeof e2 == "object") {
    let t2 = e2, n2 = t2.error ?? t2.msg ?? t2.message;
    if (n2 !== void 0 && n2 !== e2) return x(n2);
    try {
      return JSON.stringify(e2);
    } catch {
      return "";
    }
  }
  return "";
}
function S(e2, t2 = () => $t("MCP \u670D\u52A1\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5")) {
  let n2 = x(e2).toLowerCase();
  return n2.includes('"validation":"url"') || n2.includes('"validation": "url"') || n2.includes("invalid url") || n2.includes("invalid_url") || n2.includes("url is invalid") ? $t("URL\u683C\u5F0F\u6709\u8BEF\uFF0C\u5FC5\u987B\u4EE5 http:// \u6216 https:// \u5F00\u5934") : n2.includes('requires "url"') || n2.includes("url is required") || n2.includes("missing url") ? $t("URL \u5FC5\u987B\u586B\u5199") : n2.includes('requires "command"') || n2.includes("command is required") || n2.includes("missing command") ? $t("\u547D\u4EE4\u5FC5\u987B\u586B\u5199") : /\b401\b/.test(n2) || n2.includes("unauthorized") || n2.includes("authentication failed") || n2.includes("invalid token") || n2.includes("invalid api key") ? $t("MCP \u8EAB\u4EFD\u9A8C\u8BC1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 HTTP \u8BF7\u6C42\u5934\u4E2D\u7684\u8BA4\u8BC1\u4FE1\u606F") : /\b403\b/.test(n2) || n2.includes("forbidden") || n2.includes("permission denied") ? $t("MCP \u670D\u52A1\u62D2\u7EDD\u8BBF\u95EE\uFF0C\u8BF7\u68C0\u67E5\u8BBF\u95EE\u6743\u9650") : /\b404\b/.test(n2) || n2.includes("not found") ? $t("MCP \u670D\u52A1\u5730\u5740\u4E0D\u5B58\u5728\uFF0C\u8BF7\u68C0\u67E5 URL \u662F\u5426\u6B63\u786E") : n2.includes("timeout") || n2.includes("timed out") || n2.includes("etimedout") || n2.includes("aborterror") ? $t("MCP \u670D\u52A1\u8FDE\u63A5\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5") : n2.includes("econnrefused") || n2.includes("connection refused") || n2.includes("enotfound") || n2.includes("getaddrinfo") || n2.includes("fetch failed") || n2.includes("failed to fetch") || n2.includes("network error") || n2.includes("certificate") || n2.includes("self signed") || n2.includes("tls") || n2.includes("ssl") ? $t("MCP \u670D\u52A1\u65E0\u6CD5\u8BBF\u95EE\uFF0C\u8BF7\u68C0\u67E5 URL \u548C\u7F51\u7EDC\u8FDE\u63A5") : /\b5\d{2}\b/.test(n2) || n2.includes("internal server error") || n2.includes("bad gateway") || n2.includes("service unavailable") ? $t("MCP \u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5") : n2.includes("unsupported protocol") || n2.includes("unsupported transport") || n2.includes("invalid response") || n2.includes("unexpected response") || n2.includes("content-type") || n2.includes("streamable") || n2.includes("protocol error") ? $t("MCP \u670D\u52A1\u54CD\u5E94\u683C\u5F0F\u4E0D\u652F\u6301\uFF0C\u8BF7\u786E\u8BA4\u670D\u52A1\u652F\u6301 Streamable HTTP") : t2();
}
function C(e2, t2, n2 = "validate") {
  return S(e2, b[n2][t2]);
}
function oe(e2) {
  try {
    let t2 = new URL(e2.trim());
    return t2.protocol === "http:" || t2.protocol === "https:";
  } catch {
    return !1;
  }
}
var se = { class: "agent-settings" };
var ce = { key: 0, class: "agent-settings__header" };
var le = ["aria-label"];
var ue = { key: 0, class: "mcp-server-row__actions" };
var de = ["aria-label", "onClick"];
var fe = ["aria-checked", "onClick"];
var pe = { key: 1, class: "mcp-server-menu", "data-mcp-server-menu": "" };
var me = ["onClick"];
var he = ["onClick"];
var ge = { key: 0, class: "mcp-server-state" };
var _e = { key: 1, class: "mcp-server-state" };
var ve = { key: 2, class: "mcp-create" };
var ye = { class: "mcp-create__intro" };
var be = { class: "mcp-create__copy" };
var w = ["aria-label"];
var xe = ["aria-selected", "onClick"];
var Se = { class: "mcp-create-card__fields" };
var Ce = { class: "mcp-field mcp-field--narrow" };
var we = { class: "mcp-field__label" };
var Te = { class: "mcp-field__label" };
var Ee = { class: "mcp-field mcp-field--wide" };
var De = { class: "mcp-field__label mcp-field__label--split" };
var Oe = ["aria-label", "onClick"];
var T = { class: "mcp-create-card__actions" };
var ke = { class: "agent-settings-button agent-settings-button--primary", type: "submit" };
var Ae = { key: 1, class: "mcp-json-import" };
var E = v(e({ __name: "AgentSettingsRoute", setup(e2) {
  let _2 = { stdio: { label: $t("\u901A\u8FC7\u547D\u4EE4\u884C\u521B\u5EFA MCP"), title: $t("\u901A\u8FC7\u547D\u4EE4\u884C\u521B\u5EFA MCP"), namePlaceholder: $t("\u8F93\u5165\u670D\u52A1\u540D\u79F0"), mainField: { key: "command", label: $t("\u547D\u4EE4"), placeholder: "node /path/to/server.js" }, pairLabel: $t("\u73AF\u5883\u53D8\u91CF") }, http: { label: $t("HTTP \u8BF7\u6C42"), title: $t("\u901A\u8FC7 HTTP \u8BF7\u6C42\u521B\u5EFA MCP"), namePlaceholder: $t("\u8F93\u5165\u670D\u52A1\u540D\u79F0"), mainField: { key: "url", label: $t("URL"), placeholder: "https://...", wide: !0 }, pairLabel: $t("HTTP \u8BF7\u6C42\u5934") }, json: { label: $t("JSON"), title: $t("\u4ECE\u526A\u8D34\u677F\u5BFC\u5165 JSON") } }, v2 = ["stdio", "http", "json"], { listMcpServers: b2, enableMcpServer: x2, disableMcpServer: S2, deleteMcpServer: E2, upsertMcpServer: je, testMcpServer: Me, importMcpServers: Ne } = ae(), [Pe, D] = re();
  function O(e3) {
    return e3.type === "http" || e3.url ? "http" : "stdio";
  }
  function k(e3, t2) {
    D(-1, C(e3, t2), { summary: $t("\u9A8C\u8BC1\u5931\u8D25") });
  }
  function A(e3, t2) {
    D(-1, C(e3, t2, "save"), { summary: $t("\u4FDD\u5B58\u5931\u8D25") });
  }
  let j = n([]), M = n(!1), N = n(!1), P = n("stdio"), F = n(null), I = n(!1), L = n(null), R = o({ name: "", command: "", url: "" }), z = n([{ id: 1, key: "", value: "" }]), B = n([{ id: 1, key: "", value: "" }]), V = 2, H = s(() => _2[P.value]), U = s({ get: () => P.value === "stdio" ? z.value : B.value, set: (e3) => {
    P.value === "stdio" ? z.value = e3 : B.value = e3;
  } }), W = s(() => P.value === "http" ? "http" : "stdio");
  function G() {
    return { id: V++, key: "", value: "" };
  }
  function K(e3) {
    let t2 = Object.entries(e3 || {});
    return t2.length > 0 ? t2.map(([e4, t3]) => ({ id: V++, key: e4, value: t3 })) : [G()];
  }
  function q(e3) {
    return Object.fromEntries(e3.filter((e4) => e4.key).map((e4) => [e4.key, e4.value]));
  }
  function J() {
    P.value = "stdio", R.name = "", R.command = "", R.url = "", z.value = [G()], B.value = [G()], I.value = !1, L.value = null;
  }
  async function Y() {
    M.value = !0;
    try {
      let e3 = await b2();
      e3.code === 0 ? (j.value = (e3.data || []).map((e4) => ({ id: e4.name, name: e4.name, enabled: e4.enabled, config: e4.config || {}, status: e4.status, builtin: e4.builtin })), F.value = null) : D(-1, $t("MCP \u670D\u52A1\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"));
    } catch (e3) {
      console.error("Failed to load MCP servers:", e3), D(-1, $t("MCP \u670D\u52A1\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"));
    } finally {
      M.value = !1;
    }
  }
  function Fe(e3 = "stdio") {
    J(), P.value = e3, N.value = !0;
  }
  function X() {
    N.value = !1, F.value = null, J();
  }
  function Ie(e3) {
    F.value = F.value === e3 ? null : e3;
  }
  function Z(e3) {
    let t2 = e3.target;
    t2 instanceof Element && (t2.closest("[data-mcp-server-menu]") || (F.value = null));
  }
  function Le() {
    U.value = [...U.value, G()];
  }
  function Re(e3) {
    U.value.length === 1 ? U.value = [G()] : U.value = U.value.filter((t2) => t2.id !== e3);
  }
  function Q() {
    let e3 = W.value, t2 = { type: e3 };
    return e3 === "stdio" ? (t2.command = R.command.trim(), t2.env = q(z.value)) : (t2.url = R.url.trim(), t2.headers = q(B.value)), t2;
  }
  function $() {
    return R.name.trim() ? P.value === "stdio" && !R.command.trim() ? (D(-1, $t("\u547D\u4EE4\u5FC5\u987B\u586B\u5199")), !1) : P.value === "http" && !R.url.trim() ? (D(-1, $t("URL \u5FC5\u987B\u586B\u5199")), !1) : P.value === "http" && !oe(R.url) ? (D(-1, $t("URL\u683C\u5F0F\u6709\u8BEF\uFF0C\u5FC5\u987B\u4EE5 http:// \u6216 https:// \u5F00\u5934")), !1) : !0 : (D(-1, $t("\u540D\u79F0\u5FC5\u987B\u586B\u5199")), !1);
  }
  function ze(e3) {
    if (I.value = !0, L.value = e3, R.name = e3.name, P.value = e3.config.type === "http" || e3.config.url ? "http" : "stdio", R.command = "", R.url = "", e3.config.command) {
      let t2 = e3.config.args ?? [];
      R.command = [e3.config.command, ...e3.config.args ?? []].map((value) => JSON.stringify(value)).join(" ");
    }
    e3.config.url && (R.url = e3.config.url), z.value = K(e3.config.env), B.value = K(e3.config.headers), N.value = !0, F.value = null;
  }
  async function Be() {
    if ($()) try {
      let e3 = await je(R.name.trim(), Q(), I.value ? L.value?.name : void 0);
      if (e3.code !== 0) return A(e3, W.value);
      await Y(), X();
    } catch (e3) {
      console.error("Failed to save server:", e3), A(e3, W.value);
    }
  }
  async function Ve() {
    if ($()) try {
      let e3 = await Me(R.name.trim(), Q());
      e3.code === 0 && e3.data?.success ? Pe(0, $t("\u9A8C\u8BC1\u6210\u529F")) : k(e3.data?.error || e3.msg || e3.message, W.value);
    } catch (e3) {
      console.error("Validation failed:", e3), k(e3, W.value);
    }
  }
  async function He(e3) {
    try {
      if (e3.enabled) {
        if ((await S2(e3.name)).code !== 0) return D(-1, $t("MCP \u670D\u52A1\u72B6\u6001\u66F4\u65B0\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"));
        e3.enabled = !1;
        return;
      }
      let t2 = await x2(e3.name);
      t2.code === 0 ? (e3.enabled = !!t2.data?.success, e3.status = t2.data, t2.data?.success || k(t2.data?.error, O(e3.config))) : k(t2, O(e3.config));
    } catch (e4) {
      console.error("Failed to toggle server:", e4), D(-1, $t("MCP \u670D\u52A1\u72B6\u6001\u66F4\u65B0\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"));
    }
  }
  async function Ue(e3) {
    try {
      if ((await E2(e3.name)).code !== 0) return D(-1, $t("MCP \u670D\u52A1\u5220\u9664\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"));
      await Y();
    } catch (e4) {
      console.error("Failed to delete server:", e4), D(-1, $t("MCP \u670D\u52A1\u5220\u9664\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"));
    }
  }
  async function We() {
    try {
      let e3 = await navigator.clipboard.readText(), t2 = JSON.parse(e3);
      if (!t2 || typeof t2 != "object") return D(-1, $t("\u526A\u8D34\u677F\u5185\u5BB9\u4E0D\u662F\u6709\u6548\u7684 JSON"));
      let n2 = t2.mcpServers || t2;
      if (!n2 || typeof n2 != "object") return D(-1, $t("\u526A\u8D34\u677F\u5185\u5BB9\u683C\u5F0F\u4E0D\u6B63\u786E"));
      let r2 = {};
      for (let [e4, t3] of Object.entries(n2)) {
        if (!e4 || typeof e4 != "string" || !t3 || typeof t3 != "object") continue;
        let n3 = t3, i2 = typeof n3.command == "string", a2 = typeof n3.url == "string";
        if (!i2 && !a2) continue;
        let o2 = {};
        if (n3.type === "stdio" || n3.type === "http" ? o2.type = n3.type : i2 ? o2.type = "stdio" : a2 && (o2.type = "http"), i2) {
          let e5 = Array.isArray(n3.args) ? n3.args.filter((e6) => typeof e6 == "string") : [];
          o2.command = [n3.command, ...e5].map((e6) => e6.includes(" ") ? `"${e6}"` : e6).join(" ");
        }
        if (n3.env && typeof n3.env == "object") {
          o2.env = {};
          for (let [e5, t4] of Object.entries(n3.env)) typeof e5 == "string" && typeof t4 == "string" && (o2.env[e5] = t4);
        }
        if (a2 && (o2.url = n3.url), n3.headers && typeof n3.headers == "object") {
          o2.headers = {};
          for (let [e5, t4] of Object.entries(n3.headers)) typeof e5 == "string" && typeof t4 == "string" && (o2.headers[e5] = t4);
        }
        r2[e4] = o2;
      }
      if (Object.keys(r2).length === 0) return D(-1, $t("\u526A\u8D34\u677F\u5185\u5BB9\u683C\u5F0F\u4E0D\u6B63\u786E"));
      if ((await Ne(r2)).code !== 0) return D(-1, $t("MCP \u670D\u52A1\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 JSON \u914D\u7F6E\u540E\u91CD\u8BD5"));
      await Y(), X();
    } catch (e3) {
      console.error("Failed to import MCP servers:", e3), D(-1, $t("MCP \u670D\u52A1\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 JSON \u914D\u7F6E\u540E\u91CD\u8BD5"));
    }
  }
  return ee(P, (e3) => {
    e3 !== "json" && U.value.length === 0 && (U.value = [G()]);
  }), r(() => {
    Y(), document.addEventListener("click", Z, !0);
  }), t(() => {
    document.removeEventListener("click", Z, !0);
  }), (e3, t2) => {
    let n2 = ie;
    return i(), u("div", se, [p(N) ? m("", !0) : (i(), u("header", ce, [l("h1", null, f(e3.$t("MCP \u670D\u52A1")), 1), l("button", { class: "agent-settings-button agent-settings-button--primary", type: "button", onClick: t2[0] ||= (e4) => Fe("stdio") }, [g(n2, { name: "base/rx_ic_plus", size: "18" }), l("span", null, f(e3.$t("\u65B0\u5EFA")), 1)])])), p(N) ? (i(), u("section", ve, [l("button", { class: "mcp-back-button", type: "button", onClick: X }, [g(n2, { name: "base/rx_ic_arrow_left", size: "18" }), l("span", null, f(e3.$t("\u8FD4\u56DE MCP \u5217\u8868")), 1)]), l("div", ye, [l("div", be, [l("h2", null, f(p(I) ? e3.$t("\u7F16\u8F91 MCP Server") : e3.$t("\u65B0\u5EFA")), 1), l("p", null, f(e3.$t("\u5173\u4E8E MCP \u7684\u4FE1\u606F\u4E0E\u914D\u7F6E\u65B9\u6CD5\uFF0C\u8BF7\u8BBF\u95EE {MCP}", { MCP: "MCP" })), 1)]), l("div", { class: "mcp-mode-tabs", role: "tablist", "aria-label": e3.$t("MCP \u670D\u52A1\u7C7B\u578B") }, [(i(), u(d, null, h(v2, (e4) => l("button", { key: e4, class: c(["mcp-mode-tabs__item", { active: p(P) === e4 }]), type: "button", role: "tab", "aria-selected": p(P) === e4, onClick: (t3) => P.value = e4 }, f(_2[e4].label), 11, xe)), 64))], 8, w)]), l("form", { class: "mcp-create-card", onSubmit: ne(Be, ["prevent"]) }, [l("h3", null, f(p(H).title), 1), p(P) === "json" ? (i(), u("div", Ae, [l("button", { class: "agent-settings-button agent-settings-button--primary", type: "button", onClick: We }, f(e3.$t("\u4ECE\u526A\u8D34\u677F\u5BFC\u5165 JSON")), 1)])) : (i(), u(d, { key: 0 }, [l("div", Se, [l("label", Ce, [l("span", we, [a(f(e3.$t("\u540D\u79F0\uFF08\u5E2E\u52A9\u4F60\u8BC6\u522B\u5DE5\u5177\uFF09")) + " ", 1), t2[4] ||= l("b", null, "*", -1)]), g(y, { modelValue: p(R).name, "onUpdate:modelValue": t2[1] ||= (e4) => p(R).name = e4, placeholder: p(H).namePlaceholder }, null, 8, ["modelValue", "placeholder"])]), p(H).mainField ? (i(), u("label", { key: 0, class: c(["mcp-field", { "mcp-field--narrow": !p(H).mainField.wide }]) }, [l("span", Te, [a(f(p(H).mainField.label), 1), t2[5] ||= l("b", null, "*", -1)]), g(y, { modelValue: p(R)[p(H).mainField.key], "onUpdate:modelValue": t2[2] ||= (e4) => p(R)[p(H).mainField.key] = e4, placeholder: p(H).mainField.placeholder }, null, 8, ["modelValue", "placeholder"])], 2)) : m("", !0), l("div", Ee, [l("div", De, [l("span", null, f(p(H).pairLabel), 1), l("button", { type: "button", onClick: Le }, f(e3.$t("+ \u6DFB\u52A0")), 1)]), (i(!0), u(d, null, h(p(U), (n3) => (i(), u("div", { key: n3.id, class: "mcp-pair-row" }, [g(y, { modelValue: n3.key, "onUpdate:modelValue": (e4) => n3.key = e4, placeholder: e3.$t("\u952E") }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder"]), g(y, { modelValue: n3.value, "onUpdate:modelValue": (e4) => n3.value = e4, placeholder: e3.$t("\u503C") }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder"]), l("button", { class: "mcp-delete-button", type: "button", "aria-label": e3.$t("\u79FB\u9664\u6B64\u884C"), onClick: (e4) => Re(n3.id) }, [...t2[6] ||= [te('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" data-v-5f4340fe><path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" data-v-5f4340fe></path><path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" data-v-5f4340fe></path><path d="M9.5 16.5V10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" data-v-5f4340fe></path><path d="M14.5 16.5V10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" data-v-5f4340fe></path></svg>', 1)]], 8, Oe)]))), 128))])]), l("div", T, [l("button", { class: "agent-settings-button agent-settings-button--secondary", type: "button", onClick: X }, f(e3.$t("\u53D6\u6D88")), 1), l("button", { class: "agent-settings-button agent-settings-button--secondary", type: "button", onClick: Ve }, f(e3.$t("\u9A8C\u8BC1")), 1), l("button", ke, f(e3.$t("\u4FDD\u5B58")), 1)])], 64))], 32)])) : (i(), u("section", { key: 1, class: "mcp-server-list", "aria-label": e3.$t("MCP \u670D\u52A1\u5217\u8868") }, [(i(!0), u(d, null, h(p(j), (r2) => (i(), u("article", { key: r2.id, class: "mcp-server-row" }, [l("span", null, f(r2.name), 1), r2.builtin ? m("", !0) : (i(), u("div", ue, [l("button", { class: "mcp-icon-button", type: "button", "aria-label": e3.$t("\u66F4\u591A\u64CD\u4F5C"), "data-mcp-server-menu": "", onClick: (e4) => Ie(r2.id) }, [g(n2, { name: "base/rx_ic_more-h", size: "18" })], 8, de), l("button", { class: c(["mcp-switch", { "mcp-switch--checked": r2.enabled }]), type: "button", role: "switch", "aria-checked": r2.enabled, onClick: (e4) => He(r2) }, [...t2[3] ||= [l("span", null, null, -1)]], 10, fe)])), !r2.builtin && p(F) === r2.id ? (i(), u("div", pe, [l("button", { type: "button", onClick: (e4) => ze(r2) }, [g(n2, { name: "base/rx_ic_agent_edit", size: "16", "aria-hidden": "true" }), l("span", null, f(e3.$t("\u7F16\u8F91")), 1)], 8, me), l("button", { class: "danger", type: "button", onClick: (e4) => Ue(r2) }, [g(n2, { name: "roxy-agent/rx-ic-mcp-delete", size: "16", "aria-hidden": "true" }), l("span", null, f(e3.$t("\u5220\u9664")), 1)], 8, he)])) : m("", !0)]))), 128)), p(M) ? (i(), u("div", ge, f(e3.$t("\u52A0\u8F7D\u4E2D...")), 1)) : p(j).length === 0 ? (i(), u("div", _e, f(e3.$t("\u6682\u65E0 MCP")), 1)) : m("", !0)], 8, le))]);
  };
} }), [["__scopeId", "data-v-5f4340fe"]]);
export {E as default};