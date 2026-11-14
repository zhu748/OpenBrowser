import {m as localCommercialComment} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {N as e,sn as t} from "./utils-BIWenCnY.js";
import {C as n,F as r,R as i,St as a,V as ee,W as o,at as s,bt as c,d as l,en as te,f as u,h as d,i as f,in as p,jt as m,lt as h,m as g,p as _,q as v,rn as ne,rt as re,st as y,x as b} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as x} from "./agent-BmSFI9WH.js";
import {b as ie,y as ae} from "./rich-html-link-VdBpR3Cm.js";
import {Z as oe} from "./basecomponent-ClhuVxJN.js";
import {t as S} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as C} from "./usedialog-Dh0xp3r7.js";
import {n as se} from "./theme-mq6SsndU.js";
import {t as w} from "./skeleton-CcmFVUhV.js";
import {C as ce,D as T,G as E,H as le,J as ue,K as D,O as de,T as O,U as k,W as A,b as j,k as fe,q as M,t as pe,x as me} from "./CreateTemplateDialog-Bpq9OLTG.js";
import {d as he,m as ge,u as _e} from "./ScriptSchemaForm-z_48GvPJ.js";
import {r as ve,t as ye} from "./AgentConsolePageLayout-CwKh-Fcw.js";
import {t as be} from "./rx-tag-BIY_xUFU.js";
import {t as xe} from "./rx-select-button-DQtmZ0kT.js";
import {t as N} from "./rx-card-De8gGY1x.js";
import {n as Se,t as Ce} from "./useTemplateTaskExecution-yGKXS9Rw.js";
import {n as we} from "./useCustomTemplateDialog-2nSs2D8n.js";
var P = { class: "template-store-card__header" };
var F = { class: "template-store-card__identity" };
var I = { class: "template-store-card__avatar" };
var L = ["src", "alt"];
var R = { class: "template-store-card__title-group" };
var z = { class: "template-store-card__title-row" };
var B = { key: 0, class: "template-store-card__version" };
var V = { class: "template-store-card__tags" };
var H = { class: "template-store-card__actions" };
var U = { key: 0, class: "template-store-card__points" };
var W = { class: "template-store-card__action-buttons" };
var Ee = ["disabled", "aria-busy"];
var De = ["disabled", "aria-busy"];
var Oe = S(n({ __name: "TemplateStoreCard", props: { item: {}, installed: { type: Boolean }, busyAction: {} }, emits: ["get", "run"], setup(e2, { emit: t2 }) {
  let n2 = e2, c2 = t2, te2 = se(), ne2 = l(() => ({ script: $t("\u811A\u672C"), skill: "Skill", prompt: $t("\u63D0\u793A\u8BCD") })[n2.item.kind]), re2 = { script: { name: "roxy-agent/rx-ic-scripts", background: "#d1e9ff", color: "#175cd3" }, skill: { name: "roxy-agent/rx-ic-skills", background: "#fce7f6", color: "#c11574" }, prompt: { name: "roxy-agent/rx-ic-prompts", background: "#fef0c7", color: "#b54708" } }, x2 = l(() => D(n2.item.iconInfo?.icon, te2.realTheme === "dark")), ie2 = l(() => x2.value && le(x2.value) ? x2.value : ""), ae2 = l(() => x2.value && !le(x2.value) ? x2.value : ""), S2 = l(() => re2[n2.item.kind]), C2 = l(() => n2.item.description || $t("\u6682\u65E0\u63CF\u8FF0")), w2 = l(() => {
    let e3 = n2.item.version?.trim();
    return e3 ? e3.startsWith("v") ? e3 : `v${e3}` : "";
  }), ce2 = l(() => {
    let e3 = n2.item.approxPoints;
    return typeof e3 == "number" && Number.isFinite(e3) ? $t("\u7EA6 {n} \u79EF\u5206/\u6B21", { n: e3 }) : "";
  }), T2 = s("titleRef"), E2 = s("descriptionRef"), ue2 = a(!1), de2 = a(!1), O2, k2;
  function A2() {
    let e3 = T2.value;
    ue2.value = !!(e3 && e3.scrollWidth > e3.clientWidth + 1);
  }
  function j2() {
    let e3 = E2.value;
    de2.value = !!(e3 && (e3.scrollHeight > e3.clientHeight + 1 || e3.scrollWidth > e3.clientWidth + 1));
  }
  function fe2() {
    n2.installed || c2("get", n2.item.id);
  }
  function M2() {
    c2("run", n2.item.id);
  }
  return y(() => n2.item.title, () => r(A2), { flush: "post" }), y(C2, () => r(j2), { flush: "post" }), ee(() => {
    O2 = new ResizeObserver(A2), T2.value && O2.observe(T2.value), k2 = new ResizeObserver(j2), E2.value && k2.observe(E2.value), A2(), j2();
  }), i(() => {
    O2?.disconnect(), k2?.disconnect();
  }), (t3, n3) => {
    let r2 = oe, i2 = be, a2 = N;
    return o(), _(a2, { closable: !1, class: "template-store-card" }, { default: h(() => [u("header", P, [u("div", F, [u("div", I, [m(ie2) ? (o(), d("img", { key: 0, src: m(ie2), alt: e2.item.title }, null, 8, L)) : m(ae2) ? (o(), _(r2, { key: 1, name: m(ae2), size: "44", color: "var(--color-text-primary)", "aria-hidden": "true" }, null, 8, ["name"])) : (o(), _(r2, { key: 2, name: m(S2).name, size: "32", color: m(S2).color, "aria-hidden": "true" }, null, 8, ["name", "color"]))]), u("div", R, [u("div", z, [b(ve, { content: e2.item.title, disabled: !m(ue2), "content-class": "template-store-card__title-tooltip", placement: "top", "trigger-class": "template-store-card__title-trigger" }, { default: h(() => [u("h2", { ref_key: "titleRef", ref: T2 }, p(e2.item.title), 513)]), _: 1 }, 8, ["content", "disabled"]), e2.item.isHot ? (o(), _(r2, { key: 0, class: "template-store-card__hot", name: "base/fire", size: "16" })) : g("", !0)]), m(w2) ? (o(), d("span", B, p(m(w2)), 1)) : g("", !0)])])]), n3[0] ||= u("div", { class: "template-store-card__divider" }, null, -1), u("div", V, [b(i2, { class: "template-store-card__kind", label: m(ne2), readonly: "" }, null, 8, ["label"]), (o(!0), d(f, null, v(e2.item.labels, (e3) => (o(), _(i2, { key: e3.id, label: e3.label, readonly: "" }, null, 8, ["label"]))), 128))]), b(ve, { content: m(C2), disabled: !m(de2), "content-class": "template-store-card__description-tooltip", placement: "top-start", "trigger-class": "template-store-card__description-trigger" }, { default: h(() => [u("p", { ref_key: "descriptionRef", ref: E2, class: "template-store-card__description" }, p(m(C2)), 513)]), _: 1 }, 8, ["content", "disabled"]), u("div", H, [m(ce2) ? (o(), d("span", U, p(m(ce2)), 1)) : g("", !0), u("div", W, [u("button", { class: "template-store-card__get-button", type: "button", disabled: e2.installed || !!e2.busyAction, "aria-busy": e2.busyAction === "get", onClick: fe2 }, p(e2.installed ? t3.$t("\u5DF2\u83B7\u53D6") : e2.busyAction === "get" ? t3.$t("\u83B7\u53D6\u4E2D...") : t3.$t("\u83B7\u53D6")), 9, Ee), u("button", { class: "template-store-card__run-button", type: "button", disabled: !!e2.busyAction, "aria-busy": e2.busyAction === "run", onClick: M2 }, p(e2.busyAction === "run" ? t3.$t("\u51C6\u5907\u4E2D...") : e2.installed ? t3.$t("\u8FD0\u884C") : t3.$t("\u83B7\u53D6\u5E76\u8FD0\u884C")), 9, De)])])]), _: 1 });
  };
} }), [["__scopeId", "data-v-6c926f68"]]);
var G = { class: "sr-only" };
var K = { class: "template-store-card-skeleton__header", "aria-hidden": "true" };
var q = { class: "template-store-card-skeleton__identity" };
var ke = { class: "template-store-card-skeleton__tags", "aria-hidden": "true" };
var Ae = { class: "template-store-card-skeleton__description", "aria-hidden": "true" };
var je = { class: "template-store-card-skeleton__actions", "aria-hidden": "true" };
var Me = { class: "template-store-card-skeleton__action-buttons" };
var Ne = S(n({ __name: "TemplateStoreCardSkeleton", props: { count: { default: 6 } }, setup(e2) {
  return (t2, n2) => {
    let r2 = w;
    return o(!0), d(f, null, v(e2.count, (e3) => (o(), d("div", { key: e3, class: "template-store-card-skeleton", role: "status", "aria-busy": "true" }, [u("span", G, p(t2.$t("\u52A0\u8F7D\u4E2D...")), 1), u("div", K, [u("div", q, [b(r2, { width: "44px", height: "44px", "border-radius": "10px" }), b(r2, { width: "60%", height: "20px", "border-radius": "6px" })]), b(r2, { width: "42px", height: "20px", "border-radius": "4px" })]), n2[0] ||= u("div", { class: "template-store-card-skeleton__divider", "aria-hidden": "true" }, null, -1), u("div", ke, [b(r2, { width: "52px", height: "24px", "border-radius": "8px" }), b(r2, { width: "68px", height: "24px", "border-radius": "8px" }), b(r2, { width: "44px", height: "24px", "border-radius": "8px" })]), u("div", Ae, [b(r2, { width: "100%", height: "14px", "border-radius": "4px" }), b(r2, { width: "100%", height: "14px", "border-radius": "4px" })]), u("div", je, [b(r2, { width: "86px", height: "20px", "border-radius": "4px" }), u("div", Me, [b(r2, { height: "32px", "border-radius": "10px" }), b(r2, { height: "32px", "border-radius": "10px" })])])]))), 128);
  };
} }), [["__scopeId", "data-v-c953c65c"]]);
var J = { class: "template-filter-skeleton", role: "status", "aria-busy": "true" };
var Pe = { class: "sr-only" };
var Fe = { class: "template-filter-skeleton__pills" };
var Ie = S(n({ __name: "TemplateFilterSkeleton", setup(e2) {
  let t2 = [{ titleWidth: "56px", pillWidths: ["48px", "72px", "60px", "84px", "56px"] }, { titleWidth: "72px", pillWidths: ["48px", "64px", "80px", "56px"] }];
  return (e3, n2) => {
    let r2 = w;
    return o(), d("div", J, [u("span", Pe, p(e3.$t("\u52A0\u8F7D\u4E2D...")), 1), (o(), d(f, null, v(t2, (e4, t3) => u("section", { key: t3, class: "template-filter-skeleton__group", "aria-hidden": "true" }, [b(r2, { class: "template-filter-skeleton__title", width: e4.titleWidth, height: "14px", "border-radius": "4px" }, null, 8, ["width"]), u("div", Fe, [(o(!0), d(f, null, v(e4.pillWidths, (e5, t4) => (o(), _(r2, { key: t4, width: e5, height: "28px", "border-radius": "999px" }, null, 8, ["width"]))), 128))])])), 64))]);
  };
} }), [["__scopeId", "data-v-abeeb535"]]);
function Y(e2) {
  return !!e2 && typeof e2 == "object" && !Array.isArray(e2);
}
function X(e2) {
  return e2 == null || typeof e2 == "string" && !e2.trim() || Array.isArray(e2) && e2.length === 0;
}
function Z(e2, t2) {
  return Y(e2) ? (Array.isArray(e2.required) ? e2.required.filter((e3) => typeof e3 == "string" && e3 !== "debug") : []).some((e3) => !Y(t2) || X(t2[e3])) ? !0 : !Y(t2) || !Y(e2.properties) ? !1 : Object.entries(e2.properties).some(([e3, n2]) => e3 !== "debug" && e3 in t2 && Z(n2, t2[e3])) : !1;
}
function ze(e2, t2) {
  let n2 = { official_template_id: e2.id };
  if (e2.templateType === "prompt") return { requiresConfirmation: !E(e2, t2).trim(), request: n2 };
  if (e2.templateType !== "script") return { requiresConfirmation: !1, request: n2 };
  try {
    let t3 = ge(e2.metadata.optionsSchema);
    if (!t3) return { requiresConfirmation: !1, request: { ...n2, metadata: { params: {} } } };
    let r2 = he(t3);
    return { requiresConfirmation: Z(_e(t3), r2), request: { ...n2, metadata: { params: r2 } } };
  } catch {
    return { requiresConfirmation: !0, request: n2 };
  }
}
var Be = "agent-console:template-label-catalog:v1";
var Ve = 1;
function Q(e2) {
  return typeof e2 == "object" && !!e2 && !Array.isArray(e2);
}
function $(e2) {
  return typeof e2 == "number" && Number.isFinite(e2);
}
function He(e2) {
  return Q(e2) && $(e2.id) && typeof e2.slug == "string" && "name" in e2 && $(e2.sortOrder) && $(e2.enabled);
}
function Ue(e2) {
  return Q(e2) && $(e2.id) && $(e2.categoryId) && He(e2.category) && typeof e2.slug == "string" && "name" in e2 && (typeof e2.color == "string" || e2.color === null) && $(e2.sortOrder) && $(e2.enabled);
}
function We(e2) {
  return Q(e2) && e2.version === Ve && $(e2.updatedAt) && e2.updatedAt >= 0 && Array.isArray(e2.categories) && e2.categories.every(He) && Array.isArray(e2.labels) && e2.labels.every(Ue);
}
function Ge(e2) {
  if (e2 !== void 0) return e2 ?? void 0;
  if (typeof window < "u") try {
    return window.localStorage;
  } catch {
    return;
  }
}
function Ke(e2) {
  let t2 = Ge(e2);
  if (t2) try {
    let e3 = t2.getItem(Be);
    if (!e3) return;
    let n2 = JSON.parse(e3);
    return We(n2) ? { categories: n2.categories, labels: n2.labels, updatedAt: n2.updatedAt } : void 0;
  } catch {
    return;
  }
}
function qe(e2, t2, n2, r2 = Date.now()) {
  let i2 = Ge(n2);
  if (!i2) return;
  let a2 = { version: Ve, categories: e2, labels: t2, updatedAt: r2 };
  try {
    i2.setItem(Be, JSON.stringify(a2));
  } catch {
  }
}
var Je = { class: "template-store-panel" };
var Ye = { class: "template-store-content" };
var Xe = { class: "template-store-grid" };
var Ze = { key: 1, class: "template-store-state" };
var Qe = { key: 0, class: "template-store-filters" };
var $e = ["aria-labelledby"];
var et = ["id"];
var tt = { key: 0, class: "template-store-grid" };
var nt = { key: 2, class: "template-store-state template-store-state--compact" };
var rt = { key: 3, class: "template-store-grid" };
var it = { key: 4, class: "template-store-state template-store-state--compact" };
var at = { key: 0 };
var ot = ["aria-hidden"];
var st = 200;
var ct = S(n({ __name: "TemplateStoreRoute", props: { prompt: { required: !0 }, promptModifiers: {} }, emits: ["update:prompt"], setup(n2) {
  let r2 = re(n2, "prompt"), i2 = t(), s2 = se(), y2 = e(), S2 = C(), w2 = ae(), E2 = ie(), [le2, D2] = x(), { openCreateTaskDialog: he2 } = we(), { executeTemplateTask: _e2, findTaskByUserTemplateId: ve2 } = Ce(r2), be2 = l(() => s2.realTheme === "dark" ? "/images/agent-console/template-store-bg-dark.png" : "/images/agent-console/template-store-bg-light.svg"), N2 = Ke(), P2 = a(N2?.categories ?? []), F2 = a(N2?.labels ?? []), I2 = a([]), L2 = a([]), R2 = a([]), z2 = c({}), B2 = c({}), V2 = a(!N2), H2 = a(!0), U2 = a(!1), W2 = a(!1), Ee2 = l(() => V2.value || H2.value), De2 = Se(Ee2), G2 = a(!1), K2 = !!N2, q2 = 0, ke2 = 0;
  function Ae2(e2, t2) {
    let n3 = new Set(e2.map((e3) => e3.id)), r3 = !1;
    return Object.keys(z2).forEach((e3) => {
      let t3 = Number(e3);
      n3.has(t3) || (typeof z2[t3] == "number" && (r3 = !0), delete z2[t3]);
    }), e2.forEach((e3) => {
      let n4 = z2[e3.id];
      n4 === void 0 ? z2[e3.id] = "all" : typeof n4 == "number" && !t2.some((t3) => t3.categoryId === e3.id && t3.id === n4) && (z2[e3.id] = "all", r3 = !0);
    }), r3;
  }
  function je2(e2, t2) {
    return P2.value = e2, F2.value = t2, Ae2(e2, t2);
  }
  Ae2(P2.value, F2.value);
  let Me2 = l(() => P2.value.map((e2) => {
    let t2 = A(e2.name, i2.currentLocale) || e2.slug;
    return { id: e2.id, label: e2.slug === "platform" || t2 === $t("\u5E73\u53F0") ? $t("\u8D26\u53F7\u5E73\u53F0") : t2, options: [{ label: $t("\u5168\u90E8"), value: "all" }, ...F2.value.filter((t3) => t3.categoryId === e2.id).map((e3) => ({ label: A(e3.name, i2.currentLocale) || e3.slug, value: e3.id }))] };
  })), J2 = l(() => P2.value.flatMap((e2) => {
    let t2 = z2[e2.id];
    return typeof t2 == "number" ? [t2] : [];
  })), Pe2 = l(() => J2.value.length > 0), Fe2 = l(() => O(R2.value)), Le = l(() => Math.min(9, Math.max(3, I2.value.length)));
  function Y2(e2) {
    return e2.map((e3) => k(e3, i2.currentLocale));
  }
  async function X2() {
    let e2 = ++q2;
    H2.value = !0, W2.value = !1;
    try {
      let t2 = { ...J2.value.length ? { labelIds: J2.value } : {}, prioritizeTopped: !1 }, n3 = await y2.templates.listOfficialTemplates(t2, { paramsSerializer: ue }), r3 = M(n3, $t("\u52A0\u8F7D\u5B98\u65B9\u6A21\u677F\u5931\u8D25"));
      e2 === q2 && (L2.value = r3, I2.value = Y2(r3));
    } catch (t2) {
      if (e2 !== q2) return;
      console.error("Failed to load official templates", t2), W2.value = !0, L2.value = [], I2.value = [];
    } finally {
      e2 === q2 && (H2.value = !1);
    }
  }
  async function Z2() {
    K2 || (V2.value = !0), U2.value = !1;
    try {
      let [e2, t2] = await Promise.all([y2.templates.listTemplateLabelCategories(), y2.templates.listTemplateLabels({})]), n3 = M(e2, $t("\u52A0\u8F7D\u6807\u7B7E\u5206\u7C7B\u5931\u8D25")), r3 = M(t2, $t("\u52A0\u8F7D\u6A21\u677F\u6807\u7B7E\u5931\u8D25")), i3 = je2(n3, r3);
      K2 = !0, qe(n3, r3), i3 && X2();
    } catch (e2) {
      console.error("Failed to load template label catalog", e2), K2 || (U2.value = !0, P2.value = [], F2.value = []);
    } finally {
      V2.value = !1;
    }
  }
  async function Be2() {
    let e2 = [], t2 = 0, n3 = 0;
    try {
      do {
        let r3 = await y2.userTemplates.listUserTemplates({ limit: st, offset: t2, sortBy: "updated_at", sortOrder: "desc" }), i3 = fe(r3, $t("\u52A0\u8F7D\u5DF2\u83B7\u53D6\u6A21\u677F\u5931\u8D25"));
        if (e2.push(...i3.items), n3 = i3.total, t2 += i3.items.length, !i3.items.length) break;
      } while (t2 < n3);
      R2.value = e2;
    } catch (e3) {
      console.error("Failed to load installed templates", e3);
    }
  }
  function Ve2(e2, t2) {
    z2[e2] = typeof t2 == "number" ? t2 : "all", X2();
  }
  async function Q2(e2) {
    await he2({ id: e2.id, kind: T(e2.templateType), name: e2.name }, { onCreated: (t2) => _e2(t2, e2) });
  }
  async function $2(e2, t2, n3) {
    B2[e2] = n3 ? "run" : "get";
    try {
      let e3 = await y2.userTemplates.createUserTemplate(t2), r3 = de(e3, $t("\u83B7\u53D6\u6A21\u677F\u5931\u8D25"));
      return me(r3), R2.value = [r3, ...R2.value], le2(0, $t("\u6A21\u677F\u5DF2\u6DFB\u52A0\uFF0C\u70B9\u51FB\u67E5\u770B\u8BE6\u60C5"), { onClick: () => {
        E2.push({ name: "agent-console-my-templates", query: { ...w2.query, editTemplateId: String(r3.id) } });
      } }), n3 && (j(r3), window.setTimeout(() => {
        Q2(r3);
      })), !0;
    } catch (e3) {
      return console.error("Failed to create official user template", e3), D2(-1, e3 instanceof Error ? e3.message : $t("\u83B7\u53D6\u6A21\u677F\u5931\u8D25")), !1;
    } finally {
      delete B2[e2];
    }
  }
  async function He2(e2, t2) {
    return $2(e2, ce(t2), t2.saveAndRun);
  }
  function Ue2(e2, t2) {
    if (B2[e2]) return;
    let n3 = L2.value.find((t3) => t3.id === e2);
    if (!n3) {
      D2(-1, $t("\u5B98\u65B9\u6A21\u677F\u4E0D\u5B58\u5728\u6216\u5DF2\u4E0B\u67B6"));
      return;
    }
    B2[e2] = t2 === "run" ? "run" : "get";
    let r3 = () => {
      delete B2[e2];
    };
    S2.open(pe, { props: { modal: !0, blockScroll: !0, dismissableMask: !1, draggable: !1, showHeader: !1, style: { width: "min(540px, calc(100vw - 32px))" }, pt: { root: "agent-console-dialog agent-console-create-template-dialog", content: "!p-0 !overflow-hidden" } }, data: { officialTemplate: n3, lockSource: !0, submitMode: t2, onCancel: r3, onSave: (t3) => He2(e2, t3) }, onClose: r3 });
  }
  async function We2(e2, t2) {
    if (B2[e2]) return;
    let n3 = L2.value.find((t3) => t3.id === e2);
    if (!n3) {
      D2(-1, $t("\u5B98\u65B9\u6A21\u677F\u4E0D\u5B58\u5728\u6216\u5DF2\u4E0B\u67B6"));
      return;
    }
    let r3 = ze(n3, i2.currentLocale);
    r3.requiresConfirmation ? Ue2(e2, t2 ? "run" : "save") : await $2(e2, r3.request, t2);
  }
  function Ge2(e2) {
    We2(e2, !1);
  }
  async function ct2(e2, t2) {
    if (!B2[e2]) {
      B2[e2] = "run";
      try {
        let e3 = await ve2(t2.id);
        if (e3) {
          await _e2(e3, t2);
          return;
        }
        await Q2(t2);
      } catch (e3) {
        console.error("Failed to prepare installed template task", e3), D2(-1, e3 instanceof Error ? e3.message : $t("\u52A0\u8F7D\u4EFB\u52A1\u5931\u8D25"));
      } finally {
        delete B2[e2];
      }
    }
  }
  function lt(e2) {
    let t2 = Fe2.value.get(e2);
    t2 ? ct2(e2, t2) : We2(e2, !0);
  }
  function ut(e2) {
    let t2 = e2.target;
    if (!(t2 instanceof HTMLElement) || !t2.matches("[data-agent-page-scroll]")) return;
    let n3 = t2.scrollTop, r3 = n3 - ke2;
    n3 <= 0 ? G2.value = !1 : Math.abs(r3) >= 4 && (G2.value = r3 > 0), ke2 = n3;
  }
  return ee(() => {
    Promise.all([Z2(), X2(), Be2()]);
  }), (e2, t2) => {
    let n3 = oe, r3 = xe;
    return o(), _(ye, { class: te(["template-store-workspace", { "template-store-workspace--dark": m(s2).realTheme === "dark" }]), overflow: "auto", padding: "0", "mobile-padding": "0", style: ne({ backgroundImage: `url(${m(be2)})` }), title: e2.$t("\u6A21\u677F\u5546\u57CE"), onScroll: ut }, { overlay: h(() => [!m(V2) && !m(U2) ? (o(), d("div", { key: 0, class: te(["template-store-floating-banner", { "template-store-floating-banner--hidden": m(G2) }]), "aria-hidden": m(G2) }, [localCommercialComment("", !0)], 10, ot)) : g("", !0)]), default: h(() => [u("section", Je, [u("div", Ye, [u("h1", null, p(e2.$t("\u6A21\u677F\u5546\u57CE")), 1), m(V2) ? (o(), d(f, { key: 0 }, [m(De2) ? (o(), d(f, { key: 0 }, [b(Ie), u("div", Xe, [b(Ne, { count: 6 })])], 64)) : g("", !0)], 64)) : m(U2) ? (o(), d("div", Ze, [b(n3, { name: "roxy-agent/rx-ic-templates", size: "32" }), u("strong", null, p(e2.$t("\u6A21\u677F\u5546\u57CE\u52A0\u8F7D\u5931\u8D25")), 1), u("span", null, p(e2.$t("\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u540E\u91CD\u8BD5\u3002")), 1), u("button", { class: "template-store-state__retry", type: "button", onClick: Z2 }, p(e2.$t("\u91CD\u8BD5")), 1)])) : (o(), d(f, { key: 2 }, [m(Me2).length ? (o(), d("div", Qe, [(o(!0), d(f, null, v(m(Me2), (e3) => (o(), d("section", { key: e3.id, class: "template-store-filter", "aria-labelledby": `template-filter-${e3.id}` }, [u("h2", { id: `template-filter-${e3.id}` }, p(e3.label), 9, et), b(r3, { "model-value": m(z2)[e3.id] ?? "all", class: "template-store-filter__control", options: e3.options, "option-label": "label", "option-value": "value", "data-key": "value", size: "lg", disabled: m(H2), "aria-labelledby": `template-filter-${e3.id}`, "onUpdate:modelValue": (t3) => Ve2(e3.id, t3) }, null, 8, ["model-value", "options", "disabled", "aria-labelledby", "onUpdate:modelValue"])], 8, $e))), 128))])) : g("", !0), m(H2) ? (o(), d(f, { key: 1 }, [m(De2) ? (o(), d("div", tt, [b(Ne, { count: m(Le) }, null, 8, ["count"])])) : g("", !0)], 64)) : m(W2) ? (o(), d("div", nt, [b(n3, { name: "roxy-agent/rx-ic-templates", size: "32" }), u("strong", null, p(e2.$t("\u5B98\u65B9\u6A21\u677F\u52A0\u8F7D\u5931\u8D25")), 1), u("span", null, p(e2.$t("\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002")), 1), u("button", { class: "template-store-state__retry", type: "button", onClick: X2 }, p(e2.$t("\u91CD\u8BD5")), 1)])) : m(I2).length ? (o(), d("div", rt, [(o(!0), d(f, null, v(m(I2), (e3) => (o(), _(Oe, { key: e3.id, item: e3, installed: m(Fe2).has(e3.id), "busy-action": m(B2)[e3.id], onGet: Ge2, onRun: lt }, null, 8, ["item", "installed", "busy-action"]))), 128))])) : (o(), d("div", it, [b(n3, { name: "roxy-agent/rx-ic-templates", size: "32" }), u("strong", null, p(m(Pe2) ? e2.$t("\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684\u6A21\u677F") : e2.$t("\u6682\u65E0\u5B98\u65B9\u6A21\u677F")), 1), m(Pe2) ? (o(), d("span", at, p(e2.$t("\u8BF7\u5C1D\u8BD5\u9009\u62E9\u5176\u4ED6\u6807\u7B7E\u3002")), 1)) : g("", !0)]))], 64))])])]), _: 1 }, 8, ["class", "style", "title"]);
  };
} }), [["__scopeId", "data-v-f28a0d2f"]]);
export {ct as default};