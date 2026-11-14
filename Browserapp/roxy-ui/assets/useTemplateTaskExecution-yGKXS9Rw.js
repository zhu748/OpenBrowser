import {F as e,N as t,P as n,h as r,yn as i} from "./utils-BIWenCnY.js";
import {C as a,N as o,P as s,R as c,St as l,V as ee,W as u,_t as d,b as f,d as p,en as te,f as m,h,i as ne,in as g,jt as _,k as re,lt as v,m as y,p as b,q as ie,rt as ae,st as oe,tt as x,x as S} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as se} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as C} from "./agent-BmSFI9WH.js";
import {b as ce,y as le} from "./rich-html-link-VdBpR3Cm.js";
import {Z as ue} from "./basecomponent-ClhuVxJN.js";
import {t as w} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as de} from "./datepicker-Bd-h5Ks4.js";
import {D as T,a as E,c as D,g as fe,r as O,v as k} from "./CreateTemplateDialog-Bpq9OLTG.js";
import {a as A,n as pe,o as j,r as me} from "./ScriptSchemaForm-z_48GvPJ.js";
import {t as he} from "./AgentInput-CVahkFed.js";
function M(e2) {
  return e2 instanceof Date && !Number.isNaN(e2.getTime());
}
function N() {
  let e2 = /* @__PURE__ */ new Date();
  return e2.setSeconds(0, 0), e2;
}
function P(e2, t2, n2) {
  if (!/^\d+$/.test(e2)) return;
  let r2 = Number(e2);
  return r2 >= t2 && r2 <= n2 ? r2 : void 0;
}
function F(e2, t2, n2) {
  if (!t2) return;
  let r2 = t2.trim().split(/\s+/);
  if (r2.length !== 5) return;
  let [i2, a2, o2, s2, c2] = r2, l2 = P(i2, 0, 59);
  if (l2 === void 0) return;
  if (a2 === "*" && o2 === "*" && s2 === "*" && c2 === "*") {
    e2.frequency = "hourly", e2.hourlyMinute = l2;
    return;
  }
  let ee2 = P(a2, 0, 23);
  if (ee2 === void 0) return;
  let u2 = new Date(n2 ?? e2.scheduleTime ?? N());
  if (n2 || u2.setHours(ee2, l2, 0, 0), e2.scheduleTime = u2, o2 === "*" && s2 === "*" && c2 === "*") {
    e2.frequency = "daily";
    return;
  }
  let d2 = P(c2, 0, 6);
  if (o2 === "*" && s2 === "*" && d2 !== void 0) {
    e2.frequency = "weekly", e2.weekday = n2?.getDay() ?? d2;
    return;
  }
  let f2 = P(o2, 1, 31);
  f2 !== void 0 && s2 === "*" && c2 === "*" && (e2.frequency = "monthly", e2.monthlyDay = n2?.getDate() ?? f2);
}
function I() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
function ge(e2 = {}, t2 = "daily") {
  let n2 = N(), r2 = { frequency: t2, hourlyMinute: n2.getMinutes(), scheduleDate: new Date(n2), scheduleTime: new Date(n2), monthlyDay: 1, weekday: 1, enabled: e2.enabled ?? !0 };
  if (e2.planType === "once") {
    let t3 = new Date(e2.nextExecuteAt ?? e2.executeAt ?? "");
    r2.frequency = "once", M(t3) && (r2.scheduleDate = new Date(t3), r2.scheduleTime = new Date(t3));
  } else if (e2.planType === "cron") {
    let t3 = new Date(e2.nextExecuteAt ?? "");
    F(r2, e2.cron, M(t3) ? t3 : void 0);
  }
  return r2;
}
function L(e2) {
  if (e2.frequency === "hourly") return !Number.isInteger(e2.hourlyMinute) || e2.hourlyMinute < 0 || e2.hourlyMinute > 59 ? null : `${e2.hourlyMinute} * * * *`;
  if (!M(e2.scheduleTime)) return null;
  let t2 = e2.scheduleTime.getMinutes(), n2 = e2.scheduleTime.getHours();
  return e2.frequency === "weekly" ? `${t2} ${n2} * * ${e2.weekday}` : e2.frequency === "monthly" ? `${t2} ${n2} ${e2.monthlyDay} * *` : `${t2} ${n2} * * *`;
}
function R(e2) {
  if (!M(e2.scheduleDate) || !M(e2.scheduleTime)) return null;
  let t2 = new Date(e2.scheduleDate);
  return t2.setHours(e2.scheduleTime.getHours(), e2.scheduleTime.getMinutes(), 0, 0), t2.toISOString();
}
function _e(e2, t2 = !0) {
  return t2 ? e2.frequency === "once" ? { planType: "once", cron: null, timezone: null, executeAt: R(e2), enabled: e2.enabled } : { planType: "cron", cron: L(e2), timezone: I(), executeAt: null, enabled: e2.enabled } : { planType: "manual", cron: null, timezone: null, executeAt: null, enabled: !0 };
}
function ve(e2) {
  let t2 = e2.trim().split(/\s+/);
  if (t2.length !== 5) return !1;
  let [n2, r2, i2, a2, o2] = t2;
  if (P(n2, 0, 59) === void 0) return !1;
  if (r2 === "*" && i2 === "*" && a2 === "*" && o2 === "*") return !0;
  if (P(r2, 0, 23) === void 0) return !1;
  let s2 = i2 === "*" && a2 === "*" && o2 === "*", c2 = i2 === "*" && a2 === "*" && P(o2, 0, 6) !== void 0, l2 = P(i2, 1, 31) !== void 0 && a2 === "*" && o2 === "*";
  return s2 || c2 || l2;
}
var z = 4;
var B = 256;
var V = { cron: e.Cron, manual: e.Manual, once: e.Once };
var H = { cron: n.Cron, manual: n.Manual, once: n.Once };
var U = { TASK_INTERRUPTED: () => $t("\u4EFB\u52A1\u6267\u884C\u5DF2\u4E2D\u65AD"), TASK_WORKSPACE_MISMATCH: () => $t("\u4EFB\u52A1\u6216\u6A21\u677F\u4E0D\u5C5E\u4E8E\u5F53\u524D\u5DE5\u4F5C\u533A"), TASK_TEMPLATE_MISMATCH: () => $t("\u4EFB\u52A1\u5F15\u7528\u7684\u6A21\u677F\u4E0D\u5339\u914D"), TASK_ALREADY_RUNNING: () => $t("\u8BE5\u4EFB\u52A1\u6B63\u5728\u8FD0\u884C"), MISSED_TRIGGER: () => $t("\u8BA1\u5212\u89E6\u53D1\u5EF6\u8FDF\u8D85\u8FC7\u4E94\u5206\u949F\uFF0C\u672C\u6B21\u6267\u884C\u5DF2\u8DF3\u8FC7"), AGENT_SHUTDOWN: () => $t("Agent \u5173\u95ED\u671F\u95F4\u4EFB\u52A1\u6267\u884C\u88AB\u4E2D\u65AD"), AGENT_RESTARTED: () => $t("Agent \u91CD\u542F\u5BFC\u81F4\u4EFB\u52A1\u6267\u884C\u4E2D\u65AD"), TASK_ASSET_INVALID: () => $t("\u4EFB\u52A1\u8D44\u6E90\u65E0\u6548\u6216\u5DF2\u635F\u574F"), WINDOW_STATE_UNAVAILABLE: () => $t("\u65E0\u6CD5\u8BFB\u53D6\u4EFB\u52A1\u7A97\u53E3\u72B6\u6001"), NO_AVAILABLE_WINDOWS: () => $t("\u914D\u7F6E\u7684\u6D4F\u89C8\u5668\u7A97\u53E3\u5747\u4E0D\u53EF\u7528"), LEASE_SERVICE_UNAVAILABLE: () => $t("\u4EFB\u52A1\u6267\u884C\u534F\u8C03\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528"), TASK_DISABLED: () => $t("\u4EFB\u52A1\u5DF2\u88AB\u7981\u7528"), TASK_EXECUTED_BY_OTHER_USER: () => $t("\u4EFB\u52A1\u5DF2\u88AB\u5176\u4ED6\u5BA2\u6237\u7AEF\u62A2\u5360"), TASK_SCHEDULE_FORBIDDEN: () => $t("\u8BA1\u5212\u4EFB\u52A1\u4EC5\u5141\u8BB8\u521B\u5EFA\u8005\u8D26\u53F7\u6267\u884C"), TASK_OCCURRENCE_CLAIMED: () => $t("\u672C\u6B21\u8BA1\u5212\u5DF2\u88AB\u6267\u884C\uFF0C\u8BF7\u52FF\u91CD\u590D\u89E6\u53D1"), TASK_EXECUTION_FAILED: () => $t("\u4EFB\u52A1\u6267\u884C\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"), AGENT_EXECUTION_FAILED: () => $t("\u4EFB\u52A1\u6267\u884C\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"), SCRIPT_EXECUTION_FAILED: () => $t("\u6240\u6709\u811A\u672C\u6267\u884C\u5747\u5931\u8D25"), PARTIAL_WINDOW_FAILURE: () => $t("\u90E8\u5206\u7A97\u53E3\u7684\u811A\u672C\u6267\u884C\u5931\u8D25"), ARTIFACT_UPLOAD_PARTIAL_FAILURE: () => $t("\u90E8\u5206\u4EFB\u52A1\u4EA7\u7269\u4E0A\u4F20\u5931\u8D25"), LEASE_LOST: () => $t("\u4EFB\u52A1\u6267\u884C\u79DF\u7EA6\u5DF2\u5931\u6548"), HEARTBEAT_REJECTED: () => $t("\u4EFB\u52A1\u5FC3\u8DF3\u8BF7\u6C42\u88AB\u62D2\u7EDD"), HEARTBEAT_FAILED: () => $t("\u4EFB\u52A1\u5FC3\u8DF3\u8FDE\u7EED\u5931\u8D25") };
function W(e2, t2, n2) {
  return n2 ? !0 : t2 != null && String(t2) !== "" && e2.creatorUserId !== void 0 && e2.creatorUserId !== null && String(e2.creatorUserId) === String(t2);
}
function ye() {
  let e2 = navigator.hardwareConcurrency;
  if (typeof e2 != "number" || !Number.isSafeInteger(e2) || e2 < 1) return z;
  let t2 = e2 + 2;
  return Math.min(Number.isSafeInteger(t2) ? t2 : z, B);
}
function G(e2) {
  let t2 = e2.concurrency;
  if (!(typeof t2 != "number" || !Number.isSafeInteger(t2) || t2 < 1)) return t2;
}
function K(e2) {
  return e2 === null ? null : { concurrency: e2 };
}
function be(e2, t2) {
  return e2 !== "script" || t2 > 0;
}
function q(e2, t2) {
  return e2.reduce((e3, n2) => n2.taskId === t2 ? e3 ? Date.parse(n2.startedAt) > Date.parse(e3.startedAt) ? n2 : e3 : n2 : e3, void 0);
}
function xe(e2, t2) {
  return t2?.id ?? e2.runtimeTaskLogId ?? void 0;
}
function J(e2) {
  return typeof e2 == "object" && !!e2 && !Array.isArray(e2);
}
function Y(e2) {
  return e2 ? Object.hasOwn(U, e2) ? U[e2]() : $t("\u4EFB\u52A1\u6267\u884C\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5") : "";
}
function X(e2) {
  if (!e2) return "-";
  let t2 = new Date(e2);
  if (Number.isNaN(t2.getTime())) return e2;
  let n2 = (e3) => String(e3).padStart(2, "0");
  return [`${t2.getFullYear()}-${n2(t2.getMonth() + 1)}-${n2(t2.getDate())}`, `${n2(t2.getHours())}:${n2(t2.getMinutes())}:${n2(t2.getSeconds())}`].join(" ");
}
function Se(e2, t2 = Date.now()) {
  if (e2.status === "preparing" || e2.status === "running") {
    let n2 = Date.parse(e2.startedAt);
    return Number.isFinite(n2) ? Math.max(0, t2 - n2) : null;
  }
  return typeof e2.durationMs == "number" && Number.isFinite(e2.durationMs) ? Math.max(0, e2.durationMs) : null;
}
function Ce(e2, t2) {
  if (!J(e2) || e2.code !== 0 || !J(e2.data)) throw Error(J(e2) && typeof e2.message == "string" ? e2.message : t2);
  let { items: n2, total: r2, limit: i2, offset: a2 } = e2.data;
  if (!Array.isArray(n2) || typeof r2 != "number" || typeof i2 != "number" || typeof a2 != "number") throw TypeError(t2);
  return e2.data;
}
function we(e2, t2) {
  if (!J(e2) || e2.code !== 0) throw Error(J(e2) && typeof e2.message == "string" ? e2.message : t2);
  return e2.data;
}
function Te(e2, t2 = Date.now()) {
  return e2.planType === "manual" ? "manual" : e2.enabled ? e2.planType === "once" && e2.executeAt && Date.parse(e2.executeAt) <= t2 ? "expired" : "scheduled" : "paused";
}
function Ee(e2) {
  return V[e2];
}
function De(e2) {
  return H[e2];
}
function Oe(e2, t2, n2) {
  return t2 === "preparing" || t2 === "running" ? t2 : n2 === "running" ? "running" : e2;
}
function Z(e2) {
  return e2.map((e3) => ({ kind: T(e3.templateType), label: e3.name, value: e3.id }));
}
function ke(e2, t2) {
  return e2.map((e3) => t2.get(e3)).filter((e3) => !!e3).join(", ");
}
function Ae(e2, t2, n2, r2) {
  let i2 = t2.get(e2.userTemplateId);
  return { ...e2, templateKind: T(i2?.templateType), templateName: i2?.name || r2, windowNumbers: ke(e2.windowIds, n2), status: Te(e2) };
}
var je = { class: "agent-minute-picker__value", "aria-hidden": "true" };
var Me = w(a({ inheritAttrs: !1, __name: "AgentMinutePicker", props: o({ disabled: { type: Boolean } }, { modelValue: { required: !0 }, modelModifiers: {} }), emits: ["update:modelValue"], setup(e2) {
  let t2 = e2, n2 = ae(e2, "modelValue"), r2 = x(), i2 = p({ get() {
    let e3 = Number.isInteger(n2.value) && n2.value >= 0 && n2.value <= 59 ? n2.value : 0;
    return new Date(2e3, 0, 1, 0, e3, 0, 0);
  }, set(e3) {
    let t3 = e3.getMinutes();
    n2.value = Number.isInteger(t3) && t3 >= 0 && t3 <= 59 ? t3 : 0;
  } }), a2 = p(() => String(i2.value.getMinutes()).padStart(2, "0"));
  return (e3, n3) => {
    let o2 = ue;
    return u(), h("span", s(_(r2), { class: ["agent-minute-picker", { disabled: t2.disabled }] }), [S(_(de), { modelValue: _(i2), "onUpdate:modelValue": n3[0] ||= (e4) => d(i2) ? i2.value = e4 : null, class: "agent-minute-picker__datepicker", "panel-class": "agent-schedule-datepicker-panel agent-minute-datepicker-panel", "time-only": "", "hour-format": "24", "show-icon": "", "icon-display": "input", fluid: "", "aria-label": e3.$t("\u6BCF\u5C0F\u65F6\u6267\u884C\u5206\u949F"), disabled: t2.disabled, "manual-input": !1, pt: { hourPicker: { style: "display: none" }, separatorContainer: { style: "display: none" } } }, { inputicon: v((e4) => [S(o2, { name: "base/rx_ic_chevron_down", size: "12", class: te(e4.class), onClick: se(e4.clickCallback, ["stop"]) }, null, 8, ["class", "onClick"])]), _: 1 }, 8, ["modelValue", "aria-label", "disabled"]), m("span", je, g(_(a2)), 1)], 16);
  };
} }), [["__scopeId", "data-v-622ab0fc"]]);
var Ne = { class: "agent-console-dialog__shell create-task-dialog" };
var Pe = { class: "agent-console-dialog__header" };
var Fe = { class: "agent-console-dialog__title" };
var Ie = ["aria-label"];
var Le = { class: "agent-console-dialog__body create-task-dialog__body" };
var Re = { class: "template-picker-row" };
var ze = { key: 0, class: "field-hint" };
var Be = { key: 1, class: "field-hint" };
var Ve = { class: "window-picker" };
var He = { class: "window-filter-row" };
var Ue = ["aria-busy"];
var We = { key: 0, class: "window-loading", role: "status" };
var Ge = { key: 1, class: "window-load-error", role: "alert" };
var Ke = ["disabled"];
var qe = { key: 0, class: "window-code" };
var Je = { key: 1, class: "window-display-name" };
var Ye = { key: 2, class: "window-remark" };
var Xe = { key: 0, class: "window-empty" };
var Ze = { key: 1, class: "window-loading window-loading--more", role: "status" };
var Qe = { key: 2, class: "window-load-error window-load-error--more", role: "alert" };
var $e = ["disabled"];
var et = { class: "concurrency-control" };
var tt = { key: 0, class: "schedule-controls" };
var nt = { class: "m-0 text-3 leading-5 text-[var(--color-text-tertiary)]" };
var rt = { class: "schedule-control-row" };
var it = { key: 1, class: "form-error", role: "alert" };
var at = { class: "agent-console-dialog__footer" };
var ot = { class: "agent-console-dialog__actions" };
var st = ["disabled"];
var ct = ["disabled"];
var Q = "__all__";
var $ = w(a({ __name: "CreateTaskDialog", setup(e2) {
  let t2 = re("dialogRef"), n2 = ce();
  function i2() {
    return t2?.value.data ?? {};
  }
  let a2 = i2(), o2 = a2.initialValues ?? {}, s2 = a2.templateOptions ?? [], ae2 = a2.windowOptions ?? [], x2 = l([]), C2 = !!o2.id, le2 = C2 || !!a2.lockTemplate, w2 = ge(o2, "daily"), T2 = l(o2.name ?? ""), E2 = l(o2.userTemplateId), D2 = l(new Set(o2.windowIds ?? [])), O2 = l(""), k2 = l(o2.concurrency !== null), M2 = l(o2.concurrency ?? ye()), N2 = l([{ label: $t("\u5168\u90E8\u9879\u76EE"), value: Q }]), P2 = l(Q), F2 = l(!0), I2 = l(o2.planType === "once" || o2.planType === "cron"), L2 = l(w2.enabled), R2 = l(w2.frequency), z2 = l(w2.scheduleTime ?? /* @__PURE__ */ new Date()), B2 = l(w2.hourlyMinute), V2 = l(w2.monthlyDay), H2 = l(w2.weekday), U2 = l(!1), W2 = l(!!a2.loadWindowOptions), G2 = l(!1), K2 = l(""), q2 = l(0), xe2 = l(!!a2.loadWindowOptions), J2 = l(""), Y2 = 0, X2, Se2 = p(() => s2.find((e3) => e3.value === E2.value)?.kind), Ce2 = p(() => [{ label: $t("\u5355\u6B21\u6267\u884C"), value: "once" }, { label: $t("\u6BCF\u5C0F\u65F6"), value: "hourly" }, { label: $t("\u6BCF\u5929"), value: "daily" }, { label: $t("\u6BCF\u5468"), value: "weekly" }, { label: $t("\u6BCF\u6708"), value: "monthly" }]), we2 = p(() => Array.from({ length: 31 }, (e3, t3) => ({ label: $t("\u6BCF\u6708 {day} \u65E5", { day: t3 + 1 }), value: t3 + 1 }))), Te2 = p(() => [{ label: $t("\u5468\u4E00"), value: 1 }, { label: $t("\u5468\u4E8C"), value: 2 }, { label: $t("\u5468\u4E09"), value: 3 }, { label: $t("\u5468\u56DB"), value: 4 }, { label: $t("\u5468\u4E94"), value: 5 }, { label: $t("\u5468\u516D"), value: 6 }, { label: $t("\u5468\u65E5"), value: 0 }]);
  function Ee2(e3) {
    return [e3.code, e3.name, e3.remark].filter(Boolean).join(" \xB7 ");
  }
  let De2 = p(() => {
    let e3 = O2.value.trim().toLocaleLowerCase(), t3 = P2.value === Q ? "" : P2.value, n3 = t3 ? ae2.filter((e4) => e4.projectId === t3) : ae2, r2 = e3 ? n3.filter((t4) => `${t4.code} ${t4.name} ${t4.remark}`.toLocaleLowerCase().includes(e3)) : n3, i3 = new Map(r2.map((e4) => [e4.id, e4]));
    return x2.value.forEach((e4) => i3.set(e4.id, e4)), Array.from(i3.values());
  });
  async function Oe2() {
    F2.value = !0;
    try {
      let e3 = await r.limit.userGetProjectInfoByWorkspaceList({ default: 2 });
      if (e3.code !== 0) throw Error(e3.msg || "Failed to load projects");
      let t3 = /* @__PURE__ */ new Set();
      N2.value = [{ label: $t("\u5168\u90E8\u9879\u76EE"), value: Q }, ...(e3.data?.rows ?? []).flatMap((e4) => {
        let n3 = e4.project_id?.toString();
        return !n3 || t3.has(n3) ? [] : (t3.add(n3), [{ label: e4.projectName || (e4.projectDefault ? $t("\u9ED8\u8BA4\u9879\u76EE") : n3), value: n3 }]);
      })];
    } catch (e3) {
      console.error("Failed to load task projects", e3), N2.value = [{ label: $t("\u5168\u90E8\u9879\u76EE"), value: Q }];
    } finally {
      F2.value = !1;
    }
  }
  async function Z2(e3 = !1) {
    if (!a2.loadWindowOptions || !e3 && (W2.value || G2.value || !xe2.value)) return;
    let t3 = e3 ? ++Y2 : Y2, n3 = e3 ? 1 : q2.value + 1;
    e3 ? (W2.value = !0, G2.value = !1, K2.value = "", q2.value = 0, x2.value = [], xe2.value = !0) : (G2.value = !0, K2.value = "");
    try {
      let r2 = P2.value === Q ? "" : P2.value, i3 = await a2.loadWindowOptions(n3, O2.value.trim(), r2);
      if (t3 !== Y2) return;
      if (e3) x2.value = i3.items;
      else {
        let e4 = new Map(x2.value.map((e5) => [e5.id, e5]));
        i3.items.forEach((t4) => e4.set(t4.id, t4)), x2.value = Array.from(e4.values());
      }
      q2.value = n3, xe2.value = i3.hasMore;
    } catch (e4) {
      if (t3 !== Y2) return;
      console.error("Failed to load task window options", e4), K2.value = e4 instanceof Error ? e4.message : $t("\u83B7\u53D6\u7A97\u53E3\u4FE1\u606F\u5931\u8D25");
    } finally {
      t3 === Y2 && (W2.value = !1, G2.value = !1);
    }
  }
  function ke2() {
    Z2(q2.value === 0);
  }
  function Ae2(e3) {
    let t3 = e3.currentTarget;
    t3.scrollHeight - t3.scrollTop - t3.clientHeight <= 24 && Z2();
  }
  function je2(e3, t3) {
    let n3 = new Set(D2.value);
    t3 ? n3.add(e3) : n3.delete(e3), D2.value = n3;
  }
  async function $2() {
    await a2.onCancel?.(), t2?.value.close();
  }
  async function lt2() {
    await $2(), await n2.push({ name: "agent-console-template-store" });
  }
  async function ut2() {
    if (W2.value) return;
    J2.value = "";
    let e3 = T2.value.trim(), n3 = E2.value, r2 = _e({ frequency: R2.value, hourlyMinute: B2.value, scheduleDate: z2.value, scheduleTime: z2.value, monthlyDay: V2.value, weekday: H2.value, enabled: L2.value }, I2.value);
    if (!e3) {
      J2.value = $t("\u8BF7\u8F93\u5165\u4EFB\u52A1\u540D\u79F0");
      return;
    }
    if (!n3) {
      J2.value = $t("\u8BF7\u9009\u62E9\u4EFB\u52A1\u6A21\u677F");
      return;
    }
    if (!be(Se2.value, D2.value.size)) {
      J2.value = $t("\u811A\u672C\u4EFB\u52A1\u81F3\u5C11\u9700\u8981\u9009\u62E9\u4E00\u4E2A\u6D4F\u89C8\u5668\u7A97\u53E3");
      return;
    }
    let i3 = null;
    if (Se2.value === "script" && k2.value && (i3 = Number(M2.value), !Number.isSafeInteger(i3) || i3 < 1)) J2.value = $t("\u8BF7\u8F93\u5165\u6709\u6548\u7684\u5E76\u53D1\u6570\u91CF");
    else if (r2.planType === "once" && !r2.executeAt) J2.value = $t("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u5355\u6B21\u6267\u884C\u65F6\u95F4");
    else if (r2.planType === "cron" && (!r2.cron || !ve(r2.cron))) J2.value = $t("\u8BF7\u8F93\u5165\u6709\u6548\u7684\u4E94\u6BB5 cron \u8868\u8FBE\u5F0F");
    else {
      U2.value = !0;
      try {
        await a2.onSave?.({ name: e3, userTemplateId: n3, windowIds: [...D2.value], concurrency: i3, ...r2 }) !== !1 && t2?.value.close();
      } finally {
        U2.value = !1;
      }
    }
  }
  return oe(O2, () => {
    a2.loadWindowOptions && (X2 && clearTimeout(X2), X2 = setTimeout(() => {
      Z2(!0);
    }, 300));
  }), oe(P2, () => {
    X2 &&= (clearTimeout(X2), void 0), Z2(!0);
  }), ee(() => {
    Oe2(), Z2(!0);
  }), c(() => {
    X2 && clearTimeout(X2), Y2++;
  }), (e3, t3) => {
    let n3 = ue;
    return u(), h("div", Ne, [m("header", Pe, [m("h2", Fe, g(_(C2) ? e3.$t("\u7F16\u8F91\u4EFB\u52A1") : e3.$t("\u521B\u5EFA\u4EFB\u52A1")), 1), m("button", { class: "agent-console-dialog__close", type: "button", "aria-label": e3.$t("\u5173\u95ED\u4EFB\u52A1\u5F39\u7A97"), onClick: $2 }, null, 8, Ie)]), m("main", Le, [S(j, { label: e3.$t("\u4EFB\u52A1\u540D\u79F0") }, { default: v(() => [S(he, { modelValue: _(T2), "onUpdate:modelValue": t3[0] ||= (e4) => d(T2) ? T2.value = e4 : null, type: "text", placeholder: e3.$t("\u8BF7\u8F93\u5165\u4EFB\u52A1\u540D\u79F0"), disabled: _(U2) }, null, 8, ["modelValue", "placeholder", "disabled"])]), _: 1 }, 8, ["label"]), S(j, { label: e3.$t("\u4EFB\u52A1\u6A21\u677F") }, { default: v(() => [m("div", Re, [S(A, { modelValue: _(E2), "onUpdate:modelValue": t3[1] ||= (e4) => d(E2) ? E2.value = e4 : null, class: "template-select", options: _(s2), placeholder: e3.$t("\u8BF7\u9009\u62E9\u4EFB\u52A1\u6A21\u677F"), disabled: _(le2) || _(U2) }, null, 8, ["modelValue", "options", "placeholder", "disabled"]), _(C2) ? y("", !0) : (u(), h("button", { key: 0, class: "template-more-button", type: "button", onClick: lt2 }, [S(n3, { name: "roxy-agent/rx-ic-templates-store", size: "18" }), m("span", null, g(e3.$t("\u66F4\u591A\u6A21\u677F")), 1)]))]), _(C2) ? (u(), h("p", ze, g(e3.$t("\u4EFB\u52A1\u521B\u5EFA\u540E\u4E0D\u53EF\u66F4\u6362\u6765\u6E90\u6A21\u677F\u3002")), 1)) : _(le2) ? (u(), h("p", Be, g(e3.$t("\u6B64\u4EFB\u52A1\u5C06\u4F7F\u7528\u5DF2\u9009\u62E9\u7684\u6A21\u677F\u3002")), 1)) : y("", !0)]), _: 1 }, 8, ["label"]), S(j, { label: e3.$t("\u5173\u8054\u7A97\u53E3") }, { default: v(() => [m("div", Ve, [m("div", He, [S(A, { modelValue: _(P2), "onUpdate:modelValue": t3[2] ||= (e4) => d(P2) ? P2.value = e4 : null, class: "window-project-select", options: _(N2), "aria-label": e3.$t("\u9879\u76EE"), disabled: _(U2) || _(F2) }, null, 8, ["modelValue", "options", "aria-label", "disabled"]), S(he, { modelValue: _(O2), "onUpdate:modelValue": t3[3] ||= (e4) => d(O2) ? O2.value = e4 : null, class: "window-search", type: "search", "pre-icon": "base/rx_ic_magnify", placeholder: e3.$t("\u641C\u7D22\u7A97\u53E3"), disabled: _(U2) }, null, 8, ["modelValue", "placeholder", "disabled"])]), m("div", { class: "window-list", "aria-busy": _(W2) || _(G2), onScrollPassive: Ae2 }, [_(W2) ? (u(), h("div", We, [t3[13] ||= m("i", { class: "pi pi-spin pi-spinner", "aria-hidden": "true" }, null, -1), m("span", null, g(e3.$t("\u52A0\u8F7D\u4E2D...")), 1)])) : _(K2) && _(q2) === 0 ? (u(), h("div", Ge, [m("span", null, g(_(K2)), 1), m("button", { type: "button", disabled: _(U2), onClick: ke2 }, g(e3.$t("\u91CD\u8BD5")), 9, Ke)])) : (u(), h(ne, { key: 2 }, [(u(!0), h(ne, null, ie(_(De2), (t4) => (u(), b(me, { key: t4.id, "model-value": _(D2).has(t4.id), class: te(["window-row", { selected: _(D2).has(t4.id) }]), "input-id": `create-task-window-${t4.id}`, disabled: _(U2), "onUpdate:modelValue": (e4) => je2(t4.id, e4) }, { default: v(() => [S(n3, { class: "window-flag", name: t4.iconName || "base/rx_ic_route2", fallback: "base/rx_ic_route2", size: "16", color: "var(--colors-icon-icon-tertiary)", "aria-hidden": "true" }, null, 8, ["name"]), S(fe, { class: "window-info", content: Ee2(t4), "z-index": 1300 }, { default: v(() => [t4.code ? (u(), h("span", qe, g(t4.code), 1)) : y("", !0), t4.name ? (u(), h("span", Je, g(t4.code ? " \xB7 " : "") + g(t4.name), 1)) : y("", !0), t4.remark ? (u(), h("span", Ye, g(t4.code || t4.name ? " \xB7 " : "") + g(t4.remark), 1)) : y("", !0)]), _: 2 }, 1032, ["content"]), t4.isOpen ? (u(), b(pe, { key: 0, class: "window-open-badge", type: "open", label: e3.$t("\u7A97\u53E3\u5DF2\u6253\u5F00") }, null, 8, ["label"])) : y("", !0)]), _: 2 }, 1032, ["model-value", "class", "input-id", "disabled", "onUpdate:modelValue"]))), 128)), _(De2).length ? y("", !0) : (u(), h("p", Xe, g(e3.$t("\u6682\u65E0\u5339\u914D\u7A97\u53E3")), 1)), _(G2) ? (u(), h("div", Ze, [t3[14] ||= m("i", { class: "pi pi-spin pi-spinner", "aria-hidden": "true" }, null, -1), m("span", null, g(e3.$t("\u52A0\u8F7D\u4E2D...")), 1)])) : _(K2) ? (u(), h("div", Qe, [m("span", null, g(_(K2)), 1), m("button", { type: "button", disabled: _(U2), onClick: ke2 }, g(e3.$t("\u91CD\u8BD5")), 9, $e)])) : y("", !0)], 64))], 40, Ue)])]), _: 1 }, 8, ["label"]), _(Se2) === "script" ? (u(), b(j, { key: 0 }, { default: v(() => [m("div", et, [S(me, { modelValue: _(k2), "onUpdate:modelValue": t3[4] ||= (e4) => d(k2) ? k2.value = e4 : null, class: "concurrency-toggle", disabled: _(U2) }, { default: v(() => [f(g(e3.$t("\u5E76\u53D1\u6570\u91CF")), 1)]), _: 1 }, 8, ["modelValue", "disabled"]), _(k2) ? (u(), b(he, { key: 0, modelValue: _(M2), "onUpdate:modelValue": t3[5] ||= (e4) => d(M2) ? M2.value = e4 : null, class: "concurrency-input", type: "number", min: "1", max: "256", step: "1", "aria-label": e3.$t("\u5E76\u53D1\u6570\u91CF"), placeholder: e3.$t("\u8BF7\u8F93\u5165\u5E76\u53D1\u6570\u91CF"), disabled: _(U2) }, null, 8, ["modelValue", "aria-label", "placeholder", "disabled"])) : y("", !0)])]), _: 1 })) : y("", !0), S(j, null, { default: v(() => [S(me, { modelValue: _(I2), "onUpdate:modelValue": t3[6] ||= (e4) => d(I2) ? I2.value = e4 : null, class: "schedule-toggle", disabled: _(U2) }, { default: v(() => [m("span", null, [f(g(e3.$t("\u8BA1\u5212\u6267\u884C")) + " ", 1), m("em", null, g(e3.$t("\uFF08\u53EF\u9009\uFF09")), 1)])]), _: 1 }, 8, ["modelValue", "disabled"]), _(I2) ? (u(), h("div", tt, [m("p", nt, g(e3.$t("\u8BA1\u5212\u4EFB\u52A1\u4EC5\u7531\u521B\u5EFA\u8005\u8D26\u53F7\u767B\u5F55\u7684\u5BA2\u6237\u7AEF\u6267\u884C\uFF0C\u8BF7\u4FDD\u6301\u5BA2\u6237\u7AEF\u5728\u7EBF\u3002")), 1), m("div", rt, [S(A, { modelValue: _(R2), "onUpdate:modelValue": t3[7] ||= (e4) => d(R2) ? R2.value = e4 : null, class: "schedule-frequency-select", options: _(Ce2), disabled: _(U2) }, null, 8, ["modelValue", "options", "disabled"]), _(R2) === "hourly" ? (u(), b(Me, { key: 0, modelValue: _(B2), "onUpdate:modelValue": t3[8] ||= (e4) => d(B2) ? B2.value = e4 : null, class: "schedule-datepicker", disabled: _(U2) }, null, 8, ["modelValue", "disabled"])) : _(R2) === "weekly" ? (u(), b(A, { key: 1, modelValue: _(H2), "onUpdate:modelValue": t3[9] ||= (e4) => d(H2) ? H2.value = e4 : null, class: "schedule-detail-select", "overlay-class": "agent-schedule-select-overlay", options: _(Te2), disabled: _(U2) }, null, 8, ["modelValue", "options", "disabled"])) : _(R2) === "monthly" ? (u(), b(A, { key: 2, modelValue: _(V2), "onUpdate:modelValue": t3[10] ||= (e4) => d(V2) ? V2.value = e4 : null, class: "schedule-detail-select", "overlay-class": "agent-schedule-select-overlay", options: _(we2), disabled: _(U2) }, null, 8, ["modelValue", "options", "disabled"])) : y("", !0), _(R2) === "hourly" ? y("", !0) : (u(), b(_(de), { key: 3, modelValue: _(z2), "onUpdate:modelValue": t3[11] ||= (e4) => d(z2) ? z2.value = e4 : null, class: "schedule-datepicker", "panel-class": "agent-schedule-datepicker-panel", "date-format": "yy/mm/dd", "time-only": _(R2) !== "once", "show-time": _(R2) === "once", "hour-format": "24", "show-icon": "", "icon-display": "input", fluid: "", disabled: _(U2), "manual-input": !1 }, { inputicon: v((e4) => [S(n3, { name: "base/rx_ic_chevron_down", size: "12", class: te(e4.class), onClick: se(e4.clickCallback, ["stop"]) }, null, 8, ["class", "onClick"])]), _: 1 }, 8, ["modelValue", "time-only", "show-time", "disabled"]))]), S(me, { modelValue: _(L2), "onUpdate:modelValue": t3[12] ||= (e4) => d(L2) ? L2.value = e4 : null, class: "plan-enabled", disabled: _(U2) }, { default: v(() => [f(g(e3.$t("\u542F\u7528\u6B64\u8BA1\u5212")), 1)]), _: 1 }, 8, ["modelValue", "disabled"])])) : y("", !0)]), _: 1 }), _(J2) ? (u(), h("p", it, g(_(J2)), 1)) : y("", !0)]), m("footer", at, [m("div", ot, [m("button", { class: "agent-console-dialog__button", type: "button", disabled: _(U2), onClick: $2 }, g(e3.$t("\u53D6\u6D88")), 9, st), m("button", { class: "agent-console-dialog__button dark", type: "button", disabled: _(U2) || _(W2), onClick: ut2 }, g(_(U2) ? e3.$t("\u4FDD\u5B58\u4E2D...") : e3.$t("\u4FDD\u5B58")), 9, ct)])])]);
  };
} }), [["__scopeId", "data-v-3be49ec4"]]);
var lt = 200;
function ut(e2, t2 = lt) {
  let n2 = l(!1), r2;
  function i2() {
    r2 !== void 0 && (clearTimeout(r2), r2 = void 0);
  }
  return oe(e2, (e3) => {
    i2(), e3 ? r2 = setTimeout(() => {
      n2.value = !0, r2 = void 0;
    }, t2) : n2.value = !1;
  }, { immediate: !0 }), c(i2), n2;
}
function dt(e2) {
  return "kind" in e2 ? e2.kind : T(e2.templateType);
}
function ft(e2, t2) {
  let n2 = typeof t2.metadata?.prompt == "string" ? t2.metadata.prompt.trim() : typeof e2.metadata?.prompt == "string" ? e2.metadata.prompt.trim() : "", r2 = { ...e2, metadata: { ...e2.metadata ?? {}, prompt: n2 } };
  return [k(E(r2)), t2.windowIds.length ? i(t2.windowIds) : ""].filter(Boolean).join(" ").trim();
}
var pt = 200;
function mt(e2) {
  let n2 = t(), r2 = le(), i2 = ce(), [a2, o2] = C();
  async function s2(e3) {
    let t2 = 0, r3 = 0;
    do {
      let i3 = Ce(await n2.userTasks.listUserTasks({ limit: pt, offset: t2, sortBy: "created_at", sortOrder: "desc" }), $t("\u52A0\u8F7D\u4EFB\u52A1\u5931\u8D25")), a3 = i3.items.find((t3) => t3.userTemplateId === e3);
      if (a3) return a3;
      if (r3 = i3.total, t2 += i3.items.length, !i3.items.length) break;
    } while (t2 < r3);
  }
  async function c2(t2, s3) {
    try {
      let o3 = dt(s3);
      if (!o3) throw Error($t("\u4EFB\u52A1\u6A21\u677F\u7C7B\u578B\u4E0D\u53D7\u652F\u6301"));
      if (o3 === "script") return await n2.runTask(t2.id), a2(0, $t("\u4EFB\u52A1\u5DF2\u5F00\u59CB")), await i2.push({ name: "agent-console-task-manager", query: r2.query }), !0;
      if (o3 === "skill" && !O()) try {
        let e3 = await n2.skillPathInfo();
        D(e3.installedRoot);
      } catch (e3) {
        console.error("Failed to load Skill installed root", e3);
      }
      let c3 = ft(s3, t2);
      if (!c3) throw Error($t("\u4EFB\u52A1\u63D0\u793A\u8BCD\u4E3A\u7A7A"));
      return e2.value = c3, await i2.push({ name: "agent-console-chat", query: r2.query }), !0;
    } catch (e3) {
      return console.error("Failed to execute template task", e3), o2(-1, e3 instanceof Error ? e3.message : $t("\u542F\u52A8\u4EFB\u52A1\u5931\u8D25")), !1;
    }
  }
  return { executeTemplateTask: c2, findTaskByUserTemplateId: s2 };
}
export {ve as S,xe as _,K as a,_e as b,q as c,Se as d,Y as f,Ce as g,we as h,Me as i,X as l,G as m,ut as n,Z as o,Ae as p,$ as r,W as s,mt as t,Oe as u,Ee as v,ge as x,De as y};