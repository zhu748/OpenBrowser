import {m as localCommercialComment} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {N as e,v as t} from "./utils-BIWenCnY.js";
import {C as n,St as r,V as i,W as a,_t as o,b as s,d as c,en as l,f as u,h as d,i as f,in as p,jt as m,lt as h,m as ee,p as g,q as _,rt as v,x as y} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as b,n as x,p as S} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as C} from "./agent-BmSFI9WH.js";
import {b as w,y as te} from "./rich-html-link-VdBpR3Cm.js";
import {Z as ne} from "./basecomponent-ClhuVxJN.js";
import {t as T} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as re} from "./useconfirm-CV4GTWBW.js";
import {n as ie} from "./usedialog-Dh0xp3r7.js";
import {n as E} from "./theme-mq6SsndU.js";
import {t as D} from "./skeleton-CcmFVUhV.js";
import {A as O,C as ae,E as oe,H as k,K as A,O as j,S as se,b as ce,c as le,j as M,k as ue,l as de,r as P,t as fe,w as pe,x as me,y as he} from "./CreateTemplateDialog-Bpq9OLTG.js";
import {i as F} from "./ScriptSchemaForm-z_48GvPJ.js";
import {r as I,t as ge} from "./AgentConsolePageLayout-CwKh-Fcw.js";
import {t as _e} from "./AgentPopover-BDVkdMHH.js";
import {i as ve,n as ye,s as be} from "./template-guide-OgW15d11.js";
import {n as xe,t as Se} from "./useTemplateTaskExecution-yGKXS9Rw.js";
import {n as Ce} from "./useCustomTemplateDialog-2nSs2D8n.js";
var L = { class: "my-template-card" };
var R = { class: "my-template-card__header" };
var z = ["tabindex", "aria-disabled", "onKeydown"];
var B = { class: "my-template-card__avatar" };
var V = { key: 0, class: "my-template-card__unread", "aria-hidden": "true" };
var H = ["src", "alt"];
var U = { class: "my-template-card__copy" };
var W = ["title"];
var G = { class: "my-template-card__tags" };
var K = { class: "my-template-card__description" };
var q = { class: "my-template-card__actions" };
var Te = ["aria-label", "aria-expanded"];
var Ee = ["disabled"];
var De = ["disabled"];
var J = ["disabled"];
var Oe = { class: "my-template-card__primary-actions" };
var ke = T(n({ __name: "MyTemplateCard", props: { item: {}, unread: { type: Boolean }, creatingTask: { type: Boolean }, editDisabled: { type: Boolean }, deleting: { type: Boolean }, topping: { type: Boolean } }, emits: ["edit", "delete", "createTask", "runInChat", "toggleTop"], setup(e2, { emit: t2 }) {
  let n2 = e2, i2 = t2, l2 = E(), v2 = r(!1), x2 = c(() => ({ script: { label: $t("\u811A\u672C"), icon: "roxy-agent/rx-ic-scripts", background: "var(--color-bg-tertiary)", color: "var(--color-text-primary)" }, skill: { label: "Skill", icon: "roxy-agent/rx-ic-skills", background: "var(--color-bg-tertiary)", color: "var(--color-text-primary)" }, prompt: { label: $t("\u63D0\u793A\u8BCD"), icon: "roxy-agent/rx-ic-prompts", background: "var(--color-bg-tertiary)", color: "var(--color-text-primary)" } })), C2 = c(() => A(n2.item.iconInfo?.icon, l2.realTheme === "dark")), w2 = c(() => C2.value && k(C2.value) ? C2.value : ""), te2 = c(() => C2.value && !k(C2.value) ? C2.value : ""), T2 = c(() => A(n2.item.iconInfo?.primaryColor, l2.realTheme === "dark") || "var(--color-text-primary)");
  function re2(e3) {
    let t3 = e3.skillMetadata, n3 = e3.labels ?? e3.tags ?? (t3 && typeof t3 == "object" && !Array.isArray(t3) ? t3.tags : void 0);
    return Array.isArray(n3) ? n3.map((e4) => {
      if (typeof e4 == "string") return e4.trim();
      if (e4 && typeof e4 == "object" && !Array.isArray(e4)) {
        let t4 = e4, n4 = t4.label ?? t4.name ?? t4.slug;
        return typeof n4 == "string" ? n4.trim() : "";
      }
      return "";
    }).filter((e4, t4, n4) => !!e4 && n4.indexOf(e4) === t4) : [];
  }
  let ie2 = c(() => {
    let e3 = n2.item.metadata.version;
    return `v${(typeof e3 == "string" ? e3.trim().replace(/^v/i, "") : typeof e3 == "number" && Number.isFinite(e3) ? String(e3) : "") || "1.0.0"}`;
  }), D2 = c(() => [x2.value[n2.item.kind].label, ...re2(n2.item.metadata)].filter((e3, t3, n3) => n3.indexOf(e3) === t3).slice(0, 3));
  function O2() {
    n2.editDisabled || (v2.value = !1, i2("edit", n2.item));
  }
  function ae2() {
    v2.value = !1, i2("delete", n2.item);
  }
  function oe2() {
    i2("createTask", n2.item);
  }
  function j2() {
    i2("runInChat", n2.item);
  }
  function se2() {
    n2.topping || (v2.value = !1, i2("toggleTop", n2.item));
  }
  return (t3, n3) => {
    let r2 = ne;
    return a(), d("article", L, [u("header", R, [u("div", { class: "my-template-card__identity", role: "button", tabindex: e2.editDisabled ? -1 : 0, "aria-disabled": e2.editDisabled, onClick: O2, onKeydown: [S(b(O2, ["prevent"]), ["enter"]), S(b(O2, ["prevent"]), ["space"])] }, [u("div", B, [e2.unread ? (a(), d("span", V)) : ee("", !0), m(w2) ? (a(), d("img", { key: 1, src: m(w2), alt: e2.item.name }, null, 8, H)) : m(te2) ? (a(), g(r2, { key: 2, name: m(te2), size: "44", color: m(T2), "aria-hidden": "true" }, null, 8, ["name", "color"])) : (a(), g(r2, { key: 3, name: m(x2)[e2.item.kind].icon, size: "32", color: "var(--color-fg-tertiary)", "aria-hidden": "true" }, null, 8, ["name"]))]), u("div", U, [u("h2", { title: e2.item.name }, p(e2.item.name), 9, W), u("p", null, p(m(ie2)), 1)])], 40, z)]), n3[1] ||= u("div", { class: "my-template-card__divider" }, null, -1), u("div", G, [(a(!0), d(f, null, _(m(D2), (e3) => (a(), d("span", { key: e3, class: "my-template-card__tag" }, p(e3), 1))), 128))]), y(I, { content: e2.item.description || t3.$t("\u6682\u65E0\u63CF\u8FF0"), placement: "top-start", disabled: !e2.item.description, "trigger-class": "my-template-card__description-trigger" }, { default: h(() => [u("p", K, p(e2.item.description || t3.$t("\u6682\u65E0\u63CF\u8FF0")), 1)]), _: 1 }, 8, ["content", "disabled"]), u("footer", q, [y(_e, { open: m(v2), "onUpdate:open": n3[0] ||= (e3) => o(v2) ? v2.value = e3 : null, "content-class": "my-template-card-action-popover", placement: "bottom-start", offset: 6, "z-index": 90 }, { content: h(() => [u("button", { type: "button", disabled: e2.editDisabled, onClick: O2 }, [y(r2, { name: "base/rx_ic_agent_edit", size: "16", "aria-hidden": "true" }), u("span", null, p(t3.$t("\u7F16\u8F91")), 1)], 8, Ee), u("button", { type: "button", disabled: e2.topping, onClick: se2 }, [y(r2, { name: e2.item.isTopped ? "base/rx_ic_pin_solid" : "base/rx_ic_pin_line", size: "16", "aria-hidden": "true" }, null, 8, ["name"]), u("span", null, p(e2.item.isTopped ? t3.$t("\u53D6\u6D88\u7F6E\u9876") : t3.$t("\u7F6E\u9876")), 1)], 8, De), u("button", { class: "danger", type: "button", disabled: e2.deleting, onClick: ae2 }, [y(r2, { name: "base/rx_ic_bin_1", size: "16", "aria-hidden": "true" }), u("span", null, p(t3.$t("\u5220\u9664")), 1)], 8, J)]), default: h(() => [u("button", { class: "my-template-card__more-button", type: "button", "aria-label": t3.$t("\u66F4\u591A\u64CD\u4F5C"), "aria-expanded": m(v2) }, [y(r2, { name: "base/rx_ic_more-h", size: "18", "aria-hidden": "true" })], 8, Te)]), _: 1 }, 8, ["open"]), u("div", Oe, [y(F, { class: "my-template-card__create-task", variant: "secondary", icon: !1, disabled: e2.creatingTask, "aria-busy": e2.creatingTask, onClick: oe2 }, { default: h(() => [s(p(e2.creatingTask ? t3.$t("\u51C6\u5907\u4E2D...") : t3.$t("\u521B\u5EFA\u4EFB\u52A1")), 1)]), _: 1 }, 8, ["disabled", "aria-busy"]), y(F, { class: "my-template-card__run-in-chat", variant: "secondary", icon: !1, onClick: j2 }, { default: h(() => [s(p(t3.$t("\u53BB\u5BF9\u8BDD\u8FD0\u884C")), 1)]), _: 1 })])])]);
  };
} }), [["__scopeId", "data-v-41089d73"]]);
var Ae = { class: "sr-only" };
var je = { class: "my-template-card-skeleton__header", "aria-hidden": "true" };
var Me = { class: "my-template-card-skeleton__identity" };
var Y = { class: "my-template-card-skeleton__copy" };
var X = { class: "my-template-card-skeleton__tags", "aria-hidden": "true" };
var Ne = { class: "my-template-card-skeleton__description", "aria-hidden": "true" };
var Pe = { class: "my-template-card-skeleton__actions", "aria-hidden": "true" };
var Z = { class: "my-template-card-skeleton__primary-actions" };
var Fe = T(n({ __name: "MyTemplateCardSkeleton", props: { count: { default: 6 } }, setup(e2) {
  return (t2, n2) => {
    let r2 = D;
    return a(!0), d(f, null, _(e2.count, (e3) => (a(), d("div", { key: e3, class: "my-template-card-skeleton", role: "status", "aria-busy": "true" }, [u("span", Ae, p(t2.$t("\u52A0\u8F7D\u4E2D...")), 1), u("div", je, [u("div", Me, [y(r2, { width: "44px", height: "44px", "border-radius": "7px" }), u("div", Y, [y(r2, { width: "58%", height: "20px", "border-radius": "6px" }), y(r2, { width: "33px", height: "16px", "border-radius": "4px" })])])]), n2[0] ||= u("div", { class: "my-template-card-skeleton__divider", "aria-hidden": "true" }, null, -1), u("div", X, [y(r2, { width: "39px", height: "24px", "border-radius": "8px" }), y(r2, { width: "40px", height: "24px", "border-radius": "8px" }), y(r2, { width: "55px", height: "24px", "border-radius": "8px" })]), u("div", Ne, [y(r2, { width: "94%", height: "14px", "border-radius": "4px" }), y(r2, { width: "76%", height: "14px", "border-radius": "4px" })]), u("div", Pe, [y(r2, { width: "32px", height: "32px", "border-radius": "10px" }), u("div", Z, [y(r2, { height: "32px", "border-radius": "10px" }), y(r2, { height: "32px", "border-radius": "10px" })])])]))), 128);
  };
} }), [["__scopeId", "data-v-61d848fd"]]);
async function Ie(e2, t2) {
  await t2.deleteRemoteTemplate(e2.id);
}
var Le = { class: "my-templates-content" };
var Re = { class: "my-templates-toolbar" };
var ze = { key: 1 };
var Be = { class: "my-templates-toolbar__actions" };
var Ve = { key: 0, class: "my-templates-grid" };
var He = { key: 1, class: "my-templates-state" };
var Ue = { key: 3, class: "my-templates-state" };
var We = 200;
var Q = T(n({ __name: "MyTemplatesRoute", props: { prompt: { required: !0 }, promptModifiers: {} }, emits: ["update:prompt"], setup(n2) {
  let o2 = v(n2, "prompt"), c2 = e(), b2 = t(), S2 = ie(), T2 = re(), E2 = te(), k2 = w(), [A2, N2] = C(), { openCreateTaskDialog: F2 } = Ce(), { executeTemplateTask: _e2 } = Se(o2), L2 = r([]), R2 = r(0), z2 = r(!0), B2 = xe(z2), V2 = r(!1), H2 = r(), U2 = r(), W2 = r(/* @__PURE__ */ new Set()), G2 = r(/* @__PURE__ */ new Set()), K2 = r(se()), q2 = 0;
  function Te2(e2) {
    K2.value = me(e2);
  }
  function Ee2(e2) {
    K2.value = ce(e2);
  }
  function De2(e2) {
    return he(K2.value, e2);
  }
  async function J2(e2) {
    await F2({ id: e2.id, kind: je2(e2.templateType), name: e2.name }, { onCreated: (t2) => _e2(t2, e2) });
  }
  function Oe2(e2) {
    return e2.map(oe).filter((e3) => !!e3);
  }
  async function Ae2(e2) {
    try {
      let t2 = await c2.userTemplates.createUserTemplate(ae(e2)), n3 = j(t2, $t("\u521B\u5EFA\u6A21\u677F\u5931\u8D25"));
      Te2(n3);
      let r2 = ve(b2.userInfo);
      return r2 && (be(r2), ye()), A2(0, $t("\u6A21\u677F\u5DF2\u521B\u5EFA")), await $(), e2.saveAndRun && window.setTimeout(() => {
        J2(n3);
      }), !!n3.id;
    } catch (e3) {
      return console.error("Failed to create user template", e3), N2(-1, e3 instanceof Error ? e3.message : $t("\u521B\u5EFA\u6A21\u677F\u5931\u8D25")), !1;
    }
  }
  function je2(e2) {
    return e2 === "script" || e2 === "skill" ? e2 : "prompt";
  }
  async function Me2(e2, t2) {
    try {
      let n3 = await c2.userTemplates.updateUserTemplate({ templateId: e2.id }, pe(t2)), r2 = j(n3, $t("\u66F4\u65B0\u6A21\u677F\u5931\u8D25"));
      return A2(0, $t("\u6A21\u677F\u5DF2\u66F4\u65B0")), await $(), t2.saveAndRun && window.setTimeout(() => {
        J2(r2);
      }), !0;
    } catch (e3) {
      return console.error("Failed to update user template", e3), N2(-1, e3 instanceof Error ? e3.message : $t("\u66F4\u65B0\u6A21\u677F\u5931\u8D25")), !1;
    }
  }
  function Y2(e2, t2) {
    S2.open(fe, { props: { modal: !0, blockScroll: !0, dismissableMask: !1, draggable: !1, showHeader: !1, style: { width: "min(540px, calc(100vw - 32px))" }, pt: { root: "agent-console-dialog agent-console-create-template-dialog", content: "!p-0 !overflow-hidden" } }, data: { template: e2, loadDetail: t2?.loadDetail, onSave: e2 ? (t3) => Me2(e2, t3) : Ae2 }, onClose: () => {
      U2.value = void 0;
    } });
  }
  function X2(e2) {
    e2 ? U2.value === void 0 && (U2.value = e2.id, Ee2(e2), Y2(e2, { loadDetail: !0 })) : Y2();
  }
  async function Ne2(e2) {
    if (!H2.value) {
      H2.value = e2.id;
      try {
        await F2({ id: e2.id, kind: e2.kind, name: e2.name });
      } finally {
        H2.value = void 0;
      }
    }
  }
  async function Pe2(e2) {
    if (console.info("[skill-template-debug] run template in chat clicked", { id: e2.id, kind: e2.kind, name: e2.name, officialTemplateId: e2.officialTemplateId, metadataKeys: Object.keys(e2.metadata ?? {}), packageSlug: e2.metadata?.packageSlug, skillSlug: e2.metadata?.skillSlug, skillMdPath: e2.metadata?.skillMdPath, nestedSkillSlug: typeof e2.metadata?.skillMetadata == "object" && e2.metadata.skillMetadata !== null ? e2.metadata.skillMetadata.slug : void 0, installedRootReady: !!P(), installedRoot: P() }), !P()) try {
      let e3 = await c2.skillPathInfo();
      console.info("[skill-template-debug] loaded installed Skill root", e3), le(e3.installedRoot);
    } catch (e3) {
      console.error("Failed to load Skill installed root", e3);
    }
    o2.value = de(e2), console.info("[skill-template-debug] generated chat prompt from template", { id: e2.id, kind: e2.kind, prompt: o2.value }), k2.push({ name: "agent-console-chat", query: E2.query });
  }
  function Z2(e2, t2) {
    let n3 = new Set(W2.value);
    t2 ? n3.add(e2) : n3.delete(e2), W2.value = n3;
  }
  function Q2(e2, t2) {
    let n3 = new Set(G2.value);
    t2 ? n3.add(e2) : n3.delete(e2), G2.value = n3;
  }
  async function Ge(e2) {
    if (G2.value.has(e2.id)) return;
    let t2 = L2.value.slice(), n3 = !e2.isTopped, r2 = n3 ? (/* @__PURE__ */ new Date()).toISOString() : null;
    Q2(e2.id, !0), L2.value = M(L2.value.map((t3) => t3.id === e2.id ? { ...t3, isTopped: n3, toppedAt: r2 } : t3));
    try {
      let t3 = n3 ? await c2.userTemplates.topUserTemplate(e2.id) : await c2.userTemplates.untopUserTemplate(e2.id);
      L2.value = M(L2.value.map((n4) => n4.id === e2.id ? { ...n4, isTopped: t3.isTopped, toppedAt: t3.isTopped ? t3.toppedAt ?? r2 : null } : n4));
    } catch (e3) {
      console.error("Failed to update user template top state", e3), L2.value = t2, N2(-1, e3 instanceof Error ? e3.message : $t("\u6A21\u677F\u7F6E\u9876\u64CD\u4F5C\u5931\u8D25"));
    } finally {
      Q2(e2.id, !1);
    }
  }
  function Ke(e2) {
    T2.require({ group: "agentConsoleDeleteConfirmDialog", header: $t("\u5220\u9664\u6A21\u677F"), message: $t("\u5220\u9664\u540E\u65E0\u6CD5\u6062\u590D\uFF0C\u786E\u8BA4\u5220\u9664\u6A21\u677F\u201C{name}\u201D\u5417\uFF1F", { name: e2.name }), acceptLabel: $t("\u5220\u9664"), rejectLabel: $t("\u53D6\u6D88"), accept: async () => {
      Z2(e2.id, !0);
      try {
        await Ie(e2, { deleteRemoteTemplate: async (e3) => {
          let t2 = await c2.userTemplates.deleteUserTemplate({ templateId: e3 });
          O(t2, $t("\u5220\u9664\u6A21\u677F\u5931\u8D25"));
        } }), await $();
      } catch (e3) {
        console.error("Failed to delete user template", e3), N2(-1, e3 instanceof Error ? e3.message : $t("\u5220\u9664\u6A21\u677F\u5931\u8D25"));
      } finally {
        Z2(e2.id, !1);
      }
    } });
  }
  function qe() {
    let e2 = E2.query.editTemplateId, t2 = Array.isArray(e2) ? e2[0] : e2;
    if (typeof t2 != "string") return;
    let n3 = Number(t2);
    return Number.isSafeInteger(n3) && n3 > 0 ? n3 : void 0;
  }
  async function Je() {
    let e2 = qe();
    if (!e2) return;
    let t2 = L2.value.find((t3) => t3.id === e2);
    await k2.replace({ name: "agent-console-my-templates", query: { ...E2.query, editTemplateId: void 0 } }), t2 && X2(t2);
  }
  async function $() {
    let e2 = ++q2;
    z2.value = !0, V2.value = !1;
    try {
      let t2 = [], n3 = 0, r2 = 0;
      do {
        let i2 = await c2.userTemplates.listUserTemplates({ limit: We, offset: n3, sortBy: "updated_at", sortOrder: "desc" }), a2 = ue(i2, $t("\u52A0\u8F7D\u6211\u7684\u6A21\u677F\u5931\u8D25"));
        if (e2 !== q2) return;
        if (t2.push(...a2.items), r2 = a2.total, n3 += a2.items.length, a2.items.length === 0) break;
      } while (n3 < r2);
      e2 === q2 && (L2.value = M(Oe2(t2)), R2.value = r2);
    } catch (t2) {
      if (e2 !== q2) return;
      console.error("Failed to load user templates", t2), L2.value = [], R2.value = 0, V2.value = !0;
    } finally {
      e2 === q2 && (z2.value = !1);
    }
  }
  return i(() => {
    (async () => {
      try {
        let e2 = await c2.skillPathInfo();
        le(e2.installedRoot);
      } catch (e2) {
        console.error("Failed to load Skill installed root", e2);
      }
      await $(), await Je();
    })();
  }), (e2, t2) => {
    let n3 = D, r2 = ne;
    return a(), g(ge, { overflow: "auto", padding: "56px 20px 40px", "mobile-padding": "56px 16px 32px", title: e2.$t("\u6211\u7684\u6A21\u677F") }, { default: h(() => [u("div", Le, [u("h1", null, p(e2.$t("\u6211\u7684\u6A21\u677F")), 1), u("div", Re, [m(z2) ? (a(), g(n3, { key: 0, class: l(["my-templates-toolbar__count-skeleton", { "is-hidden": !m(B2) }]), width: "96px", height: "20px", "border-radius": "4px" }, null, 8, ["class"])) : (a(), d("span", ze, p(e2.$t("\u5171 {count} \u4E2A\u6A21\u677F", { count: m(R2) })), 1)), u("div", Be, [localCommercialComment("", !0), u("button", { class: "my-templates-create-button", type: "button", onClick: t2[1] ||= (e3) => X2() }, [y(r2, { name: "base/rx_ic_plus", size: "16", "aria-hidden": "true" }), s(" " + p(e2.$t("\u521B\u5EFA\u6A21\u677F")), 1)])])]), m(z2) ? (a(), d(f, { key: 0 }, [m(B2) ? (a(), d("div", Ve, [y(Fe, { count: 6 })])) : ee("", !0)], 64)) : m(V2) ? (a(), d("div", He, [y(r2, { name: "roxy-agent/rx-ic-templates", size: "32" }), u("strong", null, p(e2.$t("\u6211\u7684\u6A21\u677F\u52A0\u8F7D\u5931\u8D25")), 1), u("span", null, p(e2.$t("\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u540E\u91CD\u8BD5\u3002")), 1), u("button", { class: "my-templates-state__retry", type: "button", onClick: $ }, p(e2.$t("\u91CD\u8BD5")), 1)])) : m(L2).length ? (a(), g(x, { key: 2, class: "my-templates-grid", name: "my-template-card", tag: "div" }, { default: h(() => [(a(!0), d(f, null, _(m(L2), (e3) => (a(), g(ke, { key: e3.id, item: e3, unread: De2(e3), "creating-task": m(H2) === e3.id, "edit-disabled": m(U2) !== void 0, deleting: m(W2).has(e3.id), topping: m(G2).has(e3.id), onEdit: X2, onDelete: Ke, onCreateTask: Ne2, onRunInChat: Pe2, onToggleTop: Ge }, null, 8, ["item", "unread", "creating-task", "edit-disabled", "deleting", "topping"]))), 128))]), _: 1 })) : (a(), d("div", Ue, [y(r2, { name: "roxy-agent/rx-ic-templates", size: "32" }), u("strong", null, p(e2.$t("\u6682\u65E0\u6A21\u677F")), 1), u("span", null, p(e2.$t("\u56E2\u961F\u7A7A\u95F4\u4E2D\u8FD8\u6CA1\u6709\u6A21\u677F\u3002")), 1)]))])]), _: 1 }, 8, ["title"]);
  };
} }), [["__scopeId", "data-v-ce3300e3"]]);
export {Q as default};