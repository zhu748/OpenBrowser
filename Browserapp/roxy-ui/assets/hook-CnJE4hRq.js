import {Cn as a,H as h,N as x,Nn as S,On as E,di as ae,gr as k,gt as ce,h as A,ht as j,mt as ve,or as be,ri as xe,sn as Se,v as Ee,yn as Oe} from "./utils-BIWenCnY.js";
import {A as ke,C as M,D as Ae,Et as je,F as Me,H as Pe,J as Fe,N as Le,P as Re,R as ze,S as Be,St as N,Tt as Ve,V as He,W as P,X as Ue,Y as We,Z as Ge,_t as Ke,at as qe,b as Je,bt as Ye,d as F,dt as Xe,en as I,f as L,h as R,i as z,in as B,jt as V,k as Ze,lt as H,m as U,p as W,q as G,rn as $e,rt as et,s as tt,st as K,ut as rt,v as it,x as q} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as ut,p as ft,t as mt} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {o as gt} from "./locales-BfKu2SD4.js";
import {t as Y} from "./preload-helper-BLdHbfdN.js";
import {a as _t} from "./dist-NctnpPRe.js";
import {n as Ct,t as wt} from "./agent-BmSFI9WH.js";
import {b as kt,y as jt} from "./rich-html-link-VdBpR3Cm.js";
import {n as Mt,t as Nt} from "./vue-router-buZVHxQS.js";
import {n as Ft} from "./workspace-CNvgSgaH.js";
import {I as It,J as Lt,K as Rt,M as zt,Y as Bt,Z as X,c as Vt,t as Ht,w as Ut} from "./basecomponent-ClhuVxJN.js";
import {t as Z} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {D as Wt,M as Gt,O as Kt,m as qt,p as Jt} from "./dist-DPswMdzV.js";
import {t as Yt} from "./zindex-cO8iUN-n.js";
import {i as Xt,n as Zt,r as Qt,t as en} from "./style-CuLi6QSy.js";
import {n as tn} from "./useconfirm-CV4GTWBW.js";
import {n as nn} from "./usedialog-Dh0xp3r7.js";
import {t as rn} from "./ripple-DKjDc6yC.js";
import {t as an} from "./utils-i4uei9-Y.js";
import {t as on} from "./tooltip-BYYKWrvu.js";
import {t as sn} from "./button-BKeo7L17.js";
import {n as cn} from "./theme-mq6SsndU.js";
import {t as ln} from "./dialog-CrBr3eoy.js";
import {t as un} from "./portal-Cm1Im7J-.js";
import {t as fn} from "./rx-checkbox-BrC0MzoD.js";
import {t as pn} from "./overlayeventbus-B9Z9smtH.js";
import {t as Ln} from "./useDialog-BC-nc8J-.js";
import {i as Bn} from "./select-Cc8zLK4m.js";
import {t as Vn} from "./angleright-CRY6qWAP.js";
import {t as Hn} from "./skeleton-CcmFVUhV.js";
import {i as Kn,n as qn,r as Jn,t as Yn} from "./TaskStatusBadge-fl9VE7c_.js";
import {$ as Xn,B as Zn,C as Qn,G as $n,H as er,J as nr,K as rr,L as ir,M as ar,N as or,O as sr,Q as cr,R as lr,U as ur,V as dr,X as pr,Y as mr,Z as hr,_ as gr,a as _r,c as vr,d as yr,f as br,g as xr,h as Sr,i as Cr,k as wr,m as Tr,n as Er,p as Dr,q as Or,r as kr,s as Ar,t as jr,u as Mr,x as Nr,z as Pr} from "./CreateTemplateDialog-Bpq9OLTG.js";
import {p as Fr} from "./ScriptSchemaForm-z_48GvPJ.js";
import {i as Ir,n as Lr,r as Rr,t as zr} from "./AgentConsolePageLayout-CwKh-Fcw.js";
import {t as Br} from "./grid-loader-BbJvp9z6.js";
import {t as Vr} from "./AgentPopover-BDVkdMHH.js";
import {t as Hr} from "./AgentInput-CVahkFed.js";
import {a as Ur,c as Wr,i as Gr,n as Kr,o as qr,r as Jr,s as Yr,t as Xr} from "./template-guide-OgW15d11.js";
var $r = { name: "ConfirmDialog", extends: { name: "BaseConfirmDialog", extends: Ht, props: { group: String, breakpoints: { type: Object, default: null }, draggable: { type: Boolean, default: !0 } }, style: Qt, provide: function() {
  return { $pcConfirmDialog: this, $parentInstance: this };
} }, confirmListener: null, closeListener: null, data: function() {
  return { visible: !1, confirmation: null };
}, mounted: function() {
  var e2 = this;
  this.confirmListener = function(t2) {
    t2 && t2.group === e2.group && (e2.confirmation = t2, e2.confirmation.onShow && e2.confirmation.onShow(), e2.visible = !0);
  }, this.closeListener = function() {
    e2.visible = !1, e2.confirmation = null;
  }, Xt.on("confirm", this.confirmListener), Xt.on("close", this.closeListener);
}, beforeUnmount: function() {
  Xt.off("confirm", this.confirmListener), Xt.off("close", this.closeListener);
}, methods: { accept: function() {
  this.confirmation.accept && this.confirmation.accept(), this.visible = !1;
}, reject: function() {
  this.confirmation.reject && this.confirmation.reject(), this.visible = !1;
}, onHide: function() {
  this.confirmation.onHide && this.confirmation.onHide(), this.visible = !1;
} }, computed: { appendTo: function() {
  return this.confirmation ? this.confirmation.appendTo : "body";
}, target: function() {
  return this.confirmation ? this.confirmation.target : null;
}, modal: function() {
  return !this.confirmation || this.confirmation.modal == null || this.confirmation.modal;
}, header: function() {
  return this.confirmation ? this.confirmation.header : null;
}, message: function() {
  return this.confirmation ? this.confirmation.message : null;
}, blockScroll: function() {
  return !this.confirmation || this.confirmation.blockScroll;
}, position: function() {
  return this.confirmation ? this.confirmation.position : null;
}, acceptLabel: function() {
  if (this.confirmation) {
    var e2 = this.confirmation;
    return e2.acceptLabel || e2.acceptProps?.label || this.$primevue.config.locale.accept;
  }
  return this.$primevue.config.locale.accept;
}, rejectLabel: function() {
  if (this.confirmation) {
    var e2 = this.confirmation;
    return e2.rejectLabel || e2.rejectProps?.label || this.$primevue.config.locale.reject;
  }
  return this.$primevue.config.locale.reject;
}, acceptIcon: function() {
  var e2;
  return this.confirmation ? this.confirmation.acceptIcon : (e2 = this.confirmation) != null && e2.acceptProps ? this.confirmation.acceptProps.icon : null;
}, rejectIcon: function() {
  var e2;
  return this.confirmation ? this.confirmation.rejectIcon : (e2 = this.confirmation) != null && e2.rejectProps ? this.confirmation.rejectProps.icon : null;
}, autoFocusAccept: function() {
  return this.confirmation.defaultFocus === void 0 || this.confirmation.defaultFocus === "accept";
}, autoFocusReject: function() {
  return this.confirmation.defaultFocus === "reject";
}, closeOnEscape: function() {
  return !this.confirmation || this.confirmation.closeOnEscape;
} }, components: { Dialog: ln, Button: sn } };
function ei(e2, t2, n2, r2, i2, a2) {
  var o2 = We("Button"), s2 = We("Dialog");
  return P(), W(s2, { visible: i2.visible, "onUpdate:visible": [t2[2] ||= function(e3) {
    return i2.visible = e3;
  }, a2.onHide], role: "alertdialog", class: I(e2.cx("root")), modal: a2.modal, header: a2.header, blockScroll: a2.blockScroll, appendTo: a2.appendTo, position: a2.position, breakpoints: e2.breakpoints, closeOnEscape: a2.closeOnEscape, draggable: e2.draggable, pt: e2.pt, unstyled: e2.unstyled }, it({ default: H(function() {
    return [e2.$slots.container ? U("", !0) : (P(), R(z, { key: 0 }, [e2.$slots.message ? (P(), W(Ge(e2.$slots.message), { key: 1, message: i2.confirmation }, null, 8, ["message"])) : (P(), R(z, { key: 0 }, [Fe(e2.$slots, "icon", {}, function() {
      return [e2.$slots.icon ? (P(), W(Ge(e2.$slots.icon), { key: 0, class: I(e2.cx("icon")) }, null, 8, ["class"])) : i2.confirmation.icon ? (P(), R("span", Re({ key: 1, class: [i2.confirmation.icon, e2.cx("icon")] }, e2.ptm("icon")), null, 16)) : U("", !0)];
    }), L("span", Re({ class: e2.cx("message") }, e2.ptm("message")), B(a2.message), 17)], 64))], 64))];
  }), _: 2 }, [e2.$slots.container ? { name: "container", fn: H(function(t3) {
    return [Fe(e2.$slots, "container", { message: i2.confirmation, closeCallback: t3.closeCallback, acceptCallback: a2.accept, rejectCallback: a2.reject, initDragCallback: t3.initDragCallback })];
  }), key: "0" } : void 0, e2.$slots.container ? void 0 : { name: "footer", fn: H(function() {
    return [q(o2, Re({ class: [e2.cx("pcRejectButton"), i2.confirmation.rejectClass], autofocus: a2.autoFocusReject, unstyled: e2.unstyled, text: i2.confirmation.rejectProps?.text || !1, onClick: t2[0] ||= function(e3) {
      return a2.reject();
    } }, i2.confirmation.rejectProps, { label: a2.rejectLabel, pt: e2.ptm("pcRejectButton") }), it({ _: 2 }, [a2.rejectIcon || e2.$slots.rejecticon ? { name: "icon", fn: H(function(t3) {
      return [Fe(e2.$slots, "rejecticon", {}, function() {
        return [L("span", Re({ class: [a2.rejectIcon, t3.class] }, e2.ptm("pcRejectButton").icon, { "data-pc-section": "rejectbuttonicon" }), null, 16)];
      })];
    }), key: "0" } : void 0]), 1040, ["class", "autofocus", "unstyled", "text", "label", "pt"]), q(o2, Re({ label: a2.acceptLabel, class: [e2.cx("pcAcceptButton"), i2.confirmation.acceptClass], autofocus: a2.autoFocusAccept, unstyled: e2.unstyled, onClick: t2[1] ||= function(e3) {
      return a2.accept();
    } }, i2.confirmation.acceptProps, { pt: e2.ptm("pcAcceptButton") }), it({ _: 2 }, [a2.acceptIcon || e2.$slots.accepticon ? { name: "icon", fn: H(function(t3) {
      return [Fe(e2.$slots, "accepticon", {}, function() {
        return [L("span", Re({ class: [a2.acceptIcon, t3.class] }, e2.ptm("pcAcceptButton").icon, { "data-pc-section": "acceptbuttonicon" }), null, 16)];
      })];
    }), key: "0" } : void 0]), 1040, ["label", "class", "autofocus", "unstyled", "pt"])];
  }), key: "1" }]), 1032, ["visible", "class", "modal", "header", "blockScroll", "appendTo", "position", "breakpoints", "closeOnEscape", "draggable", "onUpdate:visible", "pt", "unstyled"]);
}
$r.render = ei;
var Tl = { class: "sr-only" };
var El = { class: "home-template-card-skeleton__main", "aria-hidden": "true" };
var Dl = { class: "home-template-card-skeleton__copy" };
var Ol = { class: "home-template-card-skeleton__footer", "aria-hidden": "true" };
var kl = { class: "home-template-card-skeleton__tags" };
var Al = Z(M({ __name: "HomeTemplateCardSkeleton", props: { count: { default: 8 } }, setup(e2) {
  return (t2, n2) => {
    let r2 = Hn;
    return P(!0), R(z, null, G(e2.count, (e3) => (P(), R("article", { key: e3, class: "home-template-card-skeleton", role: "status", "aria-busy": "true" }, [L("span", Tl, B(t2.$t("\u52A0\u8F7D\u4E2D...")), 1), L("div", El, [q(r2, { width: "44px", height: "44px", "border-radius": "10px" }), L("div", Dl, [q(r2, { width: "56%", height: "18px", "border-radius": "6px" }), q(r2, { width: "84%", height: "14px", "border-radius": "4px" })])]), L("div", Ol, [L("div", kl, [q(r2, { width: "44px", height: "24px", "border-radius": "8px" }), q(r2, { width: "58px", height: "24px", "border-radius": "8px" }), q(r2, { width: "52px", height: "24px", "border-radius": "8px" })]), q(r2, { width: "38px", height: "24px", "border-radius": "999px" })])]))), 128);
  };
} }), [["__scopeId", "data-v-a0db8e58"]]);
var jl = {};
var Ml = { class: "brand-header" };
var Nl = { class: "brand-mark", "aria-hidden": "true" };
function Pl(e2, t2) {
  let n2 = X;
  return P(), R("div", Ml, [L("span", Nl, [q(n2, { name: "roxy-agent/rx-ic-logo", size: "32" })]), t2[0] ||= L("div", { class: "brand-copy" }, [L("div", { class: "brand-title" }, "OpenBrowser AI Agent")], -1)]);
}
var Fl = Z(jl, [["render", Pl], ["__scopeId", "data-v-e677c5ff"]]);
var Il = /* @__PURE__ */ new Set(["completed", "failed", "cancelled"]);
function Ll(e2, t2) {
  if (e2 && e2.id === t2 && e2.unread && e2.latestRunId && e2.latestRunStatus && Il.has(e2.latestRunStatus)) return { conversationId: e2.id, runId: e2.latestRunId };
}
function Rl(e2) {
  return e2.isKnownConversation && !e2.isRunning && !e2.hasMessageCache;
}
function zl(e2) {
  return e2.hasActiveRun || e2.hasPendingRun || e2.hasPreparingRun || e2.hasRunningMessage || e2.hasStoppedPendingRun;
}
function Bl(e2) {
  let t2 = `pending-user-${e2.token}`, n2 = `pending-assistant-${e2.token}`;
  return { presentation: { assistantMessageId: n2, startedAt: e2.startedAt, userMessageId: t2 }, messages: [{ id: t2, conversationId: e2.conversationId, role: "user", author: "You", content: e2.content, attachments: e2.attachments, createdAt: e2.createdAt ?? "", status: "streaming" }, { id: n2, conversationId: e2.conversationId, role: "assistant", author: "OpenBrowser AI Agent", content: "", createdAt: "", status: "streaming", process: { id: `pending-process-${e2.token}`, completed: !1, durationState: "thinking", durationStartedAt: e2.startedAt, collapsed: !1, events: [] } }] };
}
function Vl(e2, t2, n2) {
  if (n2.event.type !== "run_started") return;
  let r2 = e2.find((e3) => e3.id === t2.userMessageId);
  r2 && (r2.runId = n2.runId, r2.status = "done");
  let i2 = e2.find((e3) => e3.id === t2.assistantMessageId);
  if (i2) {
    for (let t3 = e2.length - 1; t3 >= 0; t3--) {
      let r3 = e2[t3];
      r3 !== i2 && r3.role === "assistant" && (r3.id === n2.assistantMessageId || r3.runId === n2.runId) && e2.splice(t3, 1);
    }
    i2.id = n2.assistantMessageId, i2.runId = n2.runId, i2.process && (i2.process.id = `pending-process-${n2.assistantMessageId}`, i2.process.durationStartedAt = t2.startedAt);
  }
}
function Hl(e2) {
  let { event: t2 } = e2, n2 = "agentPath" in t2.data && t2.data.agentPath, r2 = "workerId" in t2.data && t2.data.workerId, i2 = n2 || r2 || "/root";
  if (t2.type === "thinking_delta") return `${i2}:thinking:${t2.data.id ?? t2.data.thinkingId}`;
  if (t2.type === "content_delta") return `${i2}:content:${t2.data.id ?? t2.data.contentId}:${t2.data.phase ?? ""}`;
}
function Ul(e2) {
  return e2.startSequence === void 0 ? void 0 : Hl(e2);
}
function Wl(e2, t2, n2) {
  let r2 = e2.length;
  for (let t3 = e2.length - 1; t3 >= 0; t3--) {
    let i2 = e2[t3];
    Hl(i2) === n2 && (r2 = t3, e2.splice(t3, 1));
  }
  e2.splice(r2, 0, t2);
}
function Gl(e2, t2) {
  if (t2.runId !== e2.runId) return "gap";
  let n2 = t2.startSequence ?? t2.sequence, r2 = Ul(t2);
  return t2.sequence <= e2.lastSequence ? r2 ? (Wl(e2.events, t2, r2), "accepted") : "duplicate" : n2 > e2.lastSequence + 1 || n2 > t2.sequence ? "gap" : (r2 ? Wl(e2.events, t2, r2) : e2.events.push(t2), e2.lastSequence = t2.sequence, "accepted");
}
function Kl(e2, t2, n2) {
  let r2 = /* @__PURE__ */ new Map();
  for (let e3 of [...t2, n2]) {
    let t3 = e3.startSequence ?? e3.sequence;
    r2.set(`${t3}:${e3.sequence}`, e3);
  }
  let i2 = [...r2.values()].sort((e3, t3) => (e3.startSequence ?? e3.sequence) - (t3.startSequence ?? t3.sequence) || e3.sequence - t3.sequence), a2 = [];
  for (let t3 = 0; t3 < i2.length; t3++) {
    let n3 = i2[t3], r3 = Gl(e2, n3);
    if (r3 === "gap") return { accepted: a2, buffered: i2.slice(t3) };
    r3 === "accepted" && a2.push(n3);
  }
  return { accepted: a2, buffered: [] };
}
function ql(e2, t2) {
  let n2 = e2.at(-1)?.sequence ?? 0;
  if (t2.every((e3) => {
    let t3 = e3.startSequence ?? e3.sequence;
    return Ul(e3) || t3 <= n2 ? !1 : (n2 = e3.sequence, !0);
  })) {
    e2.push(...t2);
    return;
  }
  let r2 = new Set(e2.map((e3) => `${e3.startSequence ?? e3.sequence}:${e3.sequence}`));
  for (let n3 of t2) {
    let t3 = Ul(n3);
    if (t3) {
      Wl(e2, n3, t3);
      continue;
    }
    let i2 = `${n3.startSequence ?? n3.sequence}:${n3.sequence}`;
    r2.has(i2) || (e2.push(n3), r2.add(i2));
  }
  e2.sort((e3, t3) => (e3.startSequence ?? e3.sequence) - (t3.startSequence ?? t3.sequence) || e3.sequence - t3.sequence);
}
function Jl(e2, t2) {
  let n2 = [...t2].filter((t3) => t3.runId === e2.runId).sort((e3, t3) => (e3.startSequence ?? e3.sequence) - (t3.startSequence ?? t3.sequence)), r2 = 0;
  for (let e3 of n2) {
    let t3 = e3.startSequence ?? e3.sequence;
    if (t3 !== r2 + 1 || t3 > e3.sequence) return !1;
    r2 = e3.sequence;
  }
  return e2.lastSequence > r2 || e2.lastSequence === r2 && e2.events.length >= n2.length || (e2.events = n2, e2.lastSequence = r2), !0;
}
function Yl(e2) {
  if (e2.event.type === "run_completed") return "completed";
  if (e2.event.type === "run_failed") return "failed";
  if (e2.event.type === "run_cancelled") return "cancelled";
}
function Xl(e2, t2, n2) {
  let r2 = t2.latestRunId ?? e2?.latestRunId, i2 = n2 ? "cancelled" : t2.latestRunStatus ?? e2?.latestRunStatus;
  return { latestRunId: r2, latestRunStatus: i2, runningRunIds: i2 === "queued" || i2 === "streaming" ? r2 ? [r2] : e2?.runningRunIds ?? [] : [] };
}
var Zl = class {
  runIds = /* @__PURE__ */ new Set();
  pendingByConversation = /* @__PURE__ */ new Map();
  addRun(e2) {
    this.runIds.add(e2);
  }
  addPending(e2, t2, n2) {
    this.pendingByConversation.set(e2, { requestId: t2, value: n2 });
  }
  resolve(e2) {
    if (e2.event.type !== "run_started") return;
    let t2 = this.pendingByConversation.get(e2.conversationId);
    if (t2 && (this.pendingByConversation.delete(e2.conversationId), t2.requestId === e2.event.data.requestId)) return this.runIds.add(e2.runId), t2.value;
  }
  hasRun(e2) {
    return this.runIds.has(e2);
  }
  hasPending(e2) {
    return this.pendingByConversation.has(e2);
  }
  removeConversation(e2, t2) {
    this.pendingByConversation.delete(e2);
    for (let e3 of t2) this.runIds.delete(e3);
  }
};
var Ql = class {
  entries = /* @__PURE__ */ new Map();
  begin(e2, t2, n2, r2, i2) {
    this.clear(e2);
    let a2 = setTimeout(() => {
      let n3 = this.entries.get(e2);
      n3 && n3.requestId === t2 && (this.entries.delete(e2), i2(n3.value));
    }, r2);
    this.entries.set(e2, { requestId: t2, value: n2, timer: a2 });
  }
  acknowledge(e2, t2) {
    let n2 = this.entries.get(e2);
    if (!(!n2 || t2 && n2.requestId !== t2)) return clearTimeout(n2.timer), this.entries.delete(e2), n2.value;
  }
  has(e2) {
    return this.entries.has(e2);
  }
  clear(e2) {
    let t2 = this.entries.get(e2);
    t2 && (clearTimeout(t2.timer), this.entries.delete(e2));
  }
};
function $l(e2) {
  return e2 && typeof e2 == "object" && !Array.isArray(e2) ? e2 : {};
}
function eu(e2) {
  return e2.split("__").at(-1) || e2;
}
function tu(e2, t2) {
  let n2 = $l(e2)[t2];
  return typeof n2 == "string" && n2 ? n2 : void 0;
}
function nu(e2) {
  let t2 = e2.trim().replace(/\\/g, "/").replace(/\/+/g, "/"), n2 = /(?:^|\/)\.roxy-agent(?:-dev)?\/memory(?:\/(.*))?$/.exec(t2);
  if (!n2) return;
  let r2 = n2[1];
  return r2 ? r2 === "MEMORY.md" ? "index" : !r2.includes("/") && r2.toLowerCase().endsWith(".md") ? "entry" : "internal" : "directory";
}
function ru(e2, t2) {
  let n2 = $l(e2), r2 = $l(n2.operation), i2 = r2.path, a2 = r2.type;
  if (typeof i2 == "string" && i2 && typeof a2 == "string") return [{ action: a2 === "create_file" ? "write" : "update", paths: [i2] }];
  let o2 = typeof e2 == "string" ? e2 : typeof n2.patch == "string" ? n2.patch : "", s2 = [], c2;
  for (let e3 of o2.split(/\r?\n/)) {
    let t3 = /^\*\*\* (Add File|Update File|Delete File): (.+)$/.exec(e3);
    if (t3) {
      c2 = { action: t3[1] === "Add File" ? "write" : "update", paths: [t3[2].trim()] }, s2.push(c2);
      continue;
    }
    let n3 = /^\*\*\* Move to: (.+)$/.exec(e3);
    n3 && c2 && c2.paths.push(n3[1].trim());
  }
  return s2.length === 0 && t2.target && s2.push({ action: t2.patchType === "create" ? "write" : "update", paths: [t2.target] }), s2;
}
function iu(e2, t2, n2) {
  let r2 = eu(e2);
  if (r2 === "apply_patch") return ru(t2, n2);
  let i2 = tu(t2, r2 === "glob" ? "cwd" : "path") ?? n2.target;
  return i2 ? r2 === "read_file" || r2 === "grep" ? [{ action: "read", paths: [i2] }] : r2 === "write_file" ? [{ action: "write", paths: [i2] }] : r2 === "edit_file" ? [{ action: "update", paths: [i2] }] : r2 === "ls" || r2 === "glob" ? [{ action: "discover", paths: [i2] }] : [] : [];
}
function au(e2, t2, n2 = {}) {
  let r2 = iu(e2, t2, n2);
  if (r2.length === 0) return;
  let i2 = r2.map((e3) => ({ operation: e3, pathKinds: e3.paths.map(nu) }));
  if (i2.some((e3) => e3.pathKinds.includes(void 0))) return;
  if (i2.some((e3) => e3.operation.action === "discover")) return { kind: "hidden" };
  let a2 = i2.filter((e3) => e3.pathKinds.includes("entry"));
  if (a2.length === 0) return { kind: "hidden" };
  let o2 = a2.map((e3) => e3.operation.action);
  return { kind: "entries", action: o2.every((e3) => e3 === "read") ? "read" : o2.every((e3) => e3 === "write") ? "write" : "update", count: a2.length };
}
function ou(e2) {
  if (e2.length === 0) return;
  let t2 = e2.map((e3) => au(e3.toolName, e3.input, { patchType: e3.patchType, target: e3.target }));
  if (t2.some((e3) => e3?.kind !== "entries")) return;
  let n2 = t2, r2 = n2[0].action;
  if (n2.every((e3) => e3.action === r2)) return { action: r2, count: n2.reduce((e3, t3) => e3 + t3.count, 0), completed: e2.every((e3) => e3.status === "success" && e3.finished !== !1) };
}
function su(e2) {
  return e2 && typeof e2 == "object" && !Array.isArray(e2) ? e2 : {};
}
function cu(e2) {
  let t2 = su(e2);
  return typeof t2.type == "string" ? t2 : su(t2.action);
}
function lu(e2) {
  return (Array.isArray(e2.queries) ? e2.queries : typeof e2.query == "string" ? [e2.query] : []).flatMap((e3) => {
    if (typeof e3 != "string") return [];
    let t2 = e3.trim();
    return t2 && !/^ws_call_id=/i.test(t2) ? [t2] : [];
  });
}
function uu(e2) {
  if (typeof e2 != "string" || !e2.trim()) return;
  let t2 = e2.trim();
  try {
    let e3 = new URL(t2);
    e3.searchParams.delete("ws_call_id"), /^#ws_call_id=/i.test(e3.hash) && (e3.hash = "");
    let n2 = { url: e3.toString() }, r2 = Xn(e3.toString());
    return r2 && (n2.faviconUrl = r2), n2;
  } catch {
    return { url: t2 };
  }
}
function du(e2) {
  let t2 = cu(e2);
  if (t2.type === "search") return { action: "search", queries: lu(t2) };
  if (t2.type === "open_page") {
    let e3 = uu(t2.url);
    return e3 ? { action: "open_page", ...e3 } : void 0;
  }
  if (t2.type === "find_in_page") {
    let e3 = typeof t2.pattern == "string" ? t2.pattern.trim() : "", n2 = uu(t2.url);
    return n2 && e3 ? { action: "find_in_page", ...n2, pattern: e3 } : void 0;
  }
}
function fu(e2) {
  return e2.split("__").at(-1) || e2;
}
function pu(e2) {
  if (!e2 || typeof e2 != "object" || Array.isArray(e2)) return;
  let t2 = e2.name;
  return typeof t2 == "string" && t2.trim() ? t2.trim() : void 0;
}
var mu = [["update_plan", $t("\u6B63\u5728\u66F4\u65B0\u8BA1\u5212"), $t("\u5DF2\u66F4\u65B0\u8BA1\u5212")], ["todo_read", $t("\u6B63\u5728\u8BFB\u53D6\u5F85\u529E\u4E8B\u9879"), $t("\u5DF2\u8BFB\u53D6\u5F85\u529E\u4E8B\u9879")], ["ask_user", $t("\u6B63\u5728\u8BE2\u95EE\u7528\u6237"), $t("\u5DF2\u8BE2\u95EE\u7528\u6237")], ["glob", $t("\u5339\u914D\u6587\u4EF6"), $t("\u5DF2\u5339\u914D\u6587\u4EF6")], ["grep", $t("\u641C\u7D22\u5185\u5BB9"), $t("\u5DF2\u641C\u7D22\u5185\u5BB9")], ["roxy_script_run", $t("\u8FD0\u884C\u811A\u672C"), $t("\u5DF2\u8FD0\u884C\u811A\u672C")], ["roxy_script_describe", $t("\u83B7\u53D6\u811A\u672C\u8BE6\u60C5\u4FE1\u606F"), $t("\u5DF2\u83B7\u53D6\u811A\u672C\u8BE6\u60C5\u4FE1\u606F")], ["roxy_workspace_list", $t("\u83B7\u53D6\u5DE5\u4F5C\u533A\u5217\u8868"), $t("\u5DF2\u83B7\u53D6\u5DE5\u4F5C\u533A\u5217\u8868")], ["roxy_project_list", $t("\u83B7\u53D6\u9879\u76EE\u5217\u8868"), $t("\u5DF2\u83B7\u53D6\u9879\u76EE\u5217\u8868")], ["roxy_label_list", $t("\u83B7\u53D6\u6807\u7B7E\u5217\u8868"), $t("\u5DF2\u83B7\u53D6\u6807\u7B7E\u5217\u8868")], ["roxy_profile_connection_info", $t("\u83B7\u53D6\u7A97\u53E3\u8FDE\u63A5\u4FE1\u606F"), $t("\u5DF2\u83B7\u53D6\u7A97\u53E3\u8FDE\u63A5\u4FE1\u606F")], ["roxy_profile_randomize_fingerprint", $t("\u968F\u673A\u751F\u6210\u7A97\u53E3\u6307\u7EB9"), $t("\u5DF2\u968F\u673A\u751F\u6210\u7A97\u53E3\u6307\u7EB9")], ["roxy_profile_clear_local_cache", $t("\u6E05\u7406\u7A97\u53E3\u672C\u5730\u7F13\u5B58"), $t("\u5DF2\u6E05\u7406\u7A97\u53E3\u672C\u5730\u7F13\u5B58")], ["roxy_profile_clear_server_cache", $t("\u6E05\u7406\u7A97\u53E3\u4E91\u7AEF\u7F13\u5B58"), $t("\u5DF2\u6E05\u7406\u7A97\u53E3\u4E91\u7AEF\u7F13\u5B58")], ["roxy_profile_list", $t("\u83B7\u53D6\u7A97\u53E3\u5217\u8868"), $t("\u5DF2\u83B7\u53D6\u7A97\u53E3\u5217\u8868")], ["roxy_profile_get", $t("\u83B7\u53D6\u7A97\u53E3\u8BE6\u60C5"), $t("\u5DF2\u83B7\u53D6\u7A97\u53E3\u8BE6\u60C5")], ["roxy_profile_create", $t("\u521B\u5EFA\u7A97\u53E3"), $t("\u5DF2\u521B\u5EFA\u7A97\u53E3")], ["roxy_profile_update", $t("\u4FEE\u6539\u7A97\u53E3"), $t("\u5DF2\u4FEE\u6539\u7A97\u53E3")], ["roxy_profile_open", $t("\u6253\u5F00\u7A97\u53E3"), $t("\u5DF2\u6253\u5F00\u7A97\u53E3")], ["roxy_profile_close", $t("\u5173\u95ED\u7A97\u53E3"), $t("\u5DF2\u5173\u95ED\u7A97\u53E3")], ["roxy_profile_delete", $t("\u5220\u9664\u7A97\u53E3"), $t("\u5DF2\u5220\u9664\u7A97\u53E3")], ["roxy_proxy_detect_channels", $t("\u83B7\u53D6\u4EE3\u7406 IP \u68C0\u6D4B\u901A\u9053"), $t("\u5DF2\u83B7\u53D6\u4EE3\u7406 IP \u68C0\u6D4B\u901A\u9053")], ["roxy_proxy_list", $t("\u83B7\u53D6\u4EE3\u7406 IP \u5217\u8868"), $t("\u5DF2\u83B7\u53D6\u4EE3\u7406 IP \u5217\u8868")], ["roxy_proxy_get", $t("\u83B7\u53D6\u4EE3\u7406 IP \u8BE6\u60C5"), $t("\u5DF2\u83B7\u53D6\u4EE3\u7406 IP \u8BE6\u60C5")], ["roxy_proxy_create", $t("\u521B\u5EFA\u4EE3\u7406 IP"), $t("\u5DF2\u521B\u5EFA\u4EE3\u7406 IP")], ["roxy_proxy_update", $t("\u4FEE\u6539\u4EE3\u7406 IP"), $t("\u5DF2\u4FEE\u6539\u4EE3\u7406 IP")], ["roxy_proxy_delete", $t("\u5220\u9664\u4EE3\u7406 IP"), $t("\u5DF2\u5220\u9664\u4EE3\u7406 IP")], ["roxy_proxy_detect", $t("\u68C0\u6D4B\u4EE3\u7406 IP"), $t("\u5DF2\u68C0\u6D4B\u4EE3\u7406 IP")], ["roxy_platform_account_list", $t("\u83B7\u53D6\u5E73\u53F0\u8D26\u53F7\u5217\u8868"), $t("\u5DF2\u83B7\u53D6\u5E73\u53F0\u8D26\u53F7\u5217\u8868")], ["roxy_platform_account_create", $t("\u521B\u5EFA\u5E73\u53F0\u8D26\u53F7"), $t("\u5DF2\u521B\u5EFA\u5E73\u53F0\u8D26\u53F7")], ["roxy_platform_account_update", $t("\u4FEE\u6539\u5E73\u53F0\u8D26\u53F7"), $t("\u5DF2\u4FEE\u6539\u5E73\u53F0\u8D26\u53F7")], ["roxy_platform_account_delete", $t("\u5220\u9664\u5E73\u53F0\u8D26\u53F7"), $t("\u5DF2\u5220\u9664\u5E73\u53F0\u8D26\u53F7")]];
var hu = { roxy_read_template_info: [$t("\u6B63\u5728\u83B7\u53D6\u6A21\u677F\u8BE6\u60C5"), $t("\u5DF2\u83B7\u53D6\u6A21\u677F\u8BE6\u60C5")], roxy_save_user_template: [$t("\u6B63\u5728\u4FDD\u5B58\u7528\u6237\u6A21\u677F"), $t("\u5DF2\u4FDD\u5B58\u7528\u6237\u6A21\u677F")], roxy_delete_user_template: [$t("\u6B63\u5728\u5220\u9664\u7528\u6237\u6A21\u677F"), $t("\u5DF2\u5220\u9664\u7528\u6237\u6A21\u677F")] };
var gu = { roxy_browser_connect: [$t("\u6B63\u5728\u8FDE\u63A5\u6D4F\u89C8\u5668\u7A97\u53E3"), $t("\u5DF2\u8FDE\u63A5\u6D4F\u89C8\u5668\u7A97\u53E3")], roxy_browser_launch: [$t("\u6B63\u5728\u542F\u52A8\u6D4F\u89C8\u5668\u7A97\u53E3"), $t("\u5DF2\u542F\u52A8\u6D4F\u89C8\u5668\u7A97\u53E3")], browser_get_config: [$t("\u6B63\u5728\u8BFB\u53D6\u6D4F\u89C8\u5668\u914D\u7F6E"), $t("\u5DF2\u8BFB\u53D6\u6D4F\u89C8\u5668\u914D\u7F6E")], browser_close: [$t("\u6B63\u5728\u5173\u95ED\u6D4F\u89C8\u5668"), $t("\u5DF2\u5173\u95ED\u6D4F\u89C8\u5668")], browser_resize: [$t("\u6B63\u5728\u8C03\u6574\u6D4F\u89C8\u5668\u7A97\u53E3\u5927\u5C0F"), $t("\u5DF2\u8C03\u6574\u6D4F\u89C8\u5668\u7A97\u53E3\u5927\u5C0F")], browser_navigate: [$t("\u6B63\u5728\u6253\u5F00\u7F51\u9875"), $t("\u5DF2\u6253\u5F00\u7F51\u9875")], browser_navigate_back: [$t("\u6B63\u5728\u8FD4\u56DE\u4E0A\u4E00\u9875"), $t("\u5DF2\u8FD4\u56DE\u4E0A\u4E00\u9875")], browser_navigate_forward: [$t("\u6B63\u5728\u524D\u5F80\u4E0B\u4E00\u9875"), $t("\u5DF2\u524D\u5F80\u4E0B\u4E00\u9875")], browser_reload: [$t("\u6B63\u5728\u5237\u65B0\u9875\u9762"), $t("\u5DF2\u5237\u65B0\u9875\u9762")], browser_wait_for: [$t("\u6B63\u5728\u7B49\u5F85\u9875\u9762\u54CD\u5E94"), $t("\u5DF2\u7B49\u5F85\u9875\u9762\u54CD\u5E94")], browser_snapshot: [$t("\u6B63\u5728\u8BFB\u53D6\u9875\u9762"), $t("\u5DF2\u8BFB\u53D6\u9875\u9762")], browser_find: [$t("\u6B63\u5728\u67E5\u627E\u9875\u9762\u5143\u7D20"), $t("\u5DF2\u67E5\u627E\u9875\u9762\u5143\u7D20")], browser_generate_locator: [$t("\u6B63\u5728\u5B9A\u4F4D\u9875\u9762\u5143\u7D20"), $t("\u5DF2\u5B9A\u4F4D\u9875\u9762\u5143\u7D20")], browser_click: [$t("\u6B63\u5728\u70B9\u51FB\u9875\u9762\u5143\u7D20"), $t("\u5DF2\u70B9\u51FB\u9875\u9762\u5143\u7D20")], browser_drag: [$t("\u6B63\u5728\u62D6\u52A8\u9875\u9762\u5143\u7D20"), $t("\u5DF2\u62D6\u52A8\u9875\u9762\u5143\u7D20")], browser_hover: [$t("\u6B63\u5728\u60AC\u505C\u9875\u9762\u5143\u7D20"), $t("\u5DF2\u60AC\u505C\u9875\u9762\u5143\u7D20")], browser_select_option: [$t("\u6B63\u5728\u9009\u62E9\u9875\u9762\u9009\u9879"), $t("\u5DF2\u9009\u62E9\u9875\u9762\u9009\u9879")], browser_type: [$t("\u6B63\u5728\u8F93\u5165\u5185\u5BB9"), $t("\u5DF2\u8F93\u5165\u5185\u5BB9")], browser_press_key: [$t("\u6B63\u5728\u6309\u4E0B\u952E\u76D8\u6309\u952E"), $t("\u5DF2\u6309\u4E0B\u952E\u76D8\u6309\u952E")], browser_press_sequentially: [$t("\u6B63\u5728\u9010\u5B57\u8F93\u5165\u5185\u5BB9"), $t("\u5DF2\u9010\u5B57\u8F93\u5165\u5185\u5BB9")], browser_keydown: [$t("\u6B63\u5728\u6309\u4F4F\u952E\u76D8\u6309\u952E"), $t("\u5DF2\u6309\u4F4F\u952E\u76D8\u6309\u952E")], browser_keyup: [$t("\u6B63\u5728\u677E\u5F00\u952E\u76D8\u6309\u952E"), $t("\u5DF2\u677E\u5F00\u952E\u76D8\u6309\u952E")], browser_fill_form: [$t("\u6B63\u5728\u586B\u5199\u9875\u9762\u8868\u5355"), $t("\u5DF2\u586B\u5199\u9875\u9762\u8868\u5355")], browser_check: [$t("\u6B63\u5728\u52FE\u9009\u9875\u9762\u9009\u9879"), $t("\u5DF2\u52FE\u9009\u9875\u9762\u9009\u9879")], browser_uncheck: [$t("\u6B63\u5728\u53D6\u6D88\u52FE\u9009\u9875\u9762\u9009\u9879"), $t("\u5DF2\u53D6\u6D88\u52FE\u9009\u9875\u9762\u9009\u9879")], browser_file_upload: [$t("\u6B63\u5728\u4E0A\u4F20\u6587\u4EF6"), $t("\u5DF2\u4E0A\u4F20\u6587\u4EF6")], browser_drop: [$t("\u6B63\u5728\u62D6\u653E\u6587\u4EF6"), $t("\u5DF2\u62D6\u653E\u6587\u4EF6")], browser_take_screenshot: [$t("\u6B63\u5728\u622A\u53D6\u9875\u9762"), $t("\u5DF2\u622A\u53D6\u9875\u9762")], browser_pdf_save: [$t("\u6B63\u5728\u4FDD\u5B58\u9875\u9762 PDF"), $t("\u5DF2\u4FDD\u5B58\u9875\u9762 PDF")], browser_tabs: [$t("\u6B63\u5728\u7BA1\u7406\u6807\u7B7E\u9875"), $t("\u5DF2\u7BA1\u7406\u6807\u7B7E\u9875")], browser_handle_dialog: [$t("\u6B63\u5728\u5904\u7406\u9875\u9762\u5F39\u7A97"), $t("\u5DF2\u5904\u7406\u9875\u9762\u5F39\u7A97")], browser_evaluate: [$t("\u6B63\u5728\u8BFB\u53D6\u9875\u9762\u6570\u636E"), $t("\u5DF2\u8BFB\u53D6\u9875\u9762\u6570\u636E")], browser_run_code_unsafe: [$t("\u6B63\u5728\u6267\u884C\u9875\u9762\u4EE3\u7801"), $t("\u5DF2\u6267\u884C\u9875\u9762\u4EE3\u7801")], browser_console_messages: [$t("\u6B63\u5728\u8BFB\u53D6\u6D4F\u89C8\u5668\u65E5\u5FD7"), $t("\u5DF2\u8BFB\u53D6\u6D4F\u89C8\u5668\u65E5\u5FD7")], browser_console_clear: [$t("\u6B63\u5728\u6E05\u7406\u6D4F\u89C8\u5668\u65E5\u5FD7"), $t("\u5DF2\u6E05\u7406\u6D4F\u89C8\u5668\u65E5\u5FD7")], browser_cookie_list: [$t("\u6B63\u5728\u8BFB\u53D6 Cookie"), $t("\u5DF2\u8BFB\u53D6 Cookie")], browser_cookie_get: [$t("\u6B63\u5728\u8BFB\u53D6 Cookie"), $t("\u5DF2\u8BFB\u53D6 Cookie")], browser_cookie_set: [$t("\u6B63\u5728\u4FEE\u6539 Cookie"), $t("\u5DF2\u4FEE\u6539 Cookie")], browser_cookie_delete: [$t("\u6B63\u5728\u4FEE\u6539 Cookie"), $t("\u5DF2\u4FEE\u6539 Cookie")], browser_cookie_clear: [$t("\u6B63\u5728\u4FEE\u6539 Cookie"), $t("\u5DF2\u4FEE\u6539 Cookie")], browser_storage_state: [$t("\u6B63\u5728\u8BFB\u53D6\u9875\u9762\u5B58\u50A8"), $t("\u5DF2\u8BFB\u53D6\u9875\u9762\u5B58\u50A8")], browser_set_storage_state: [$t("\u6B63\u5728\u4FEE\u6539\u9875\u9762\u5B58\u50A8"), $t("\u5DF2\u4FEE\u6539\u9875\u9762\u5B58\u50A8")], browser_localstorage_list: [$t("\u6B63\u5728\u8BFB\u53D6\u9875\u9762\u5B58\u50A8"), $t("\u5DF2\u8BFB\u53D6\u9875\u9762\u5B58\u50A8")], browser_localstorage_get: [$t("\u6B63\u5728\u8BFB\u53D6\u9875\u9762\u5B58\u50A8"), $t("\u5DF2\u8BFB\u53D6\u9875\u9762\u5B58\u50A8")], browser_localstorage_set: [$t("\u6B63\u5728\u4FEE\u6539\u9875\u9762\u5B58\u50A8"), $t("\u5DF2\u4FEE\u6539\u9875\u9762\u5B58\u50A8")], browser_localstorage_delete: [$t("\u6B63\u5728\u4FEE\u6539\u9875\u9762\u5B58\u50A8"), $t("\u5DF2\u4FEE\u6539\u9875\u9762\u5B58\u50A8")], browser_localstorage_clear: [$t("\u6B63\u5728\u4FEE\u6539\u9875\u9762\u5B58\u50A8"), $t("\u5DF2\u4FEE\u6539\u9875\u9762\u5B58\u50A8")], browser_sessionstorage_list: [$t("\u6B63\u5728\u8BFB\u53D6\u9875\u9762\u5B58\u50A8"), $t("\u5DF2\u8BFB\u53D6\u9875\u9762\u5B58\u50A8")], browser_sessionstorage_get: [$t("\u6B63\u5728\u8BFB\u53D6\u9875\u9762\u5B58\u50A8"), $t("\u5DF2\u8BFB\u53D6\u9875\u9762\u5B58\u50A8")], browser_sessionstorage_set: [$t("\u6B63\u5728\u4FEE\u6539\u9875\u9762\u5B58\u50A8"), $t("\u5DF2\u4FEE\u6539\u9875\u9762\u5B58\u50A8")], browser_sessionstorage_delete: [$t("\u6B63\u5728\u4FEE\u6539\u9875\u9762\u5B58\u50A8"), $t("\u5DF2\u4FEE\u6539\u9875\u9762\u5B58\u50A8")], browser_sessionstorage_clear: [$t("\u6B63\u5728\u4FEE\u6539\u9875\u9762\u5B58\u50A8"), $t("\u5DF2\u4FEE\u6539\u9875\u9762\u5B58\u50A8")], browser_network_requests: [$t("\u6B63\u5728\u8BFB\u53D6\u7F51\u7EDC\u8BF7\u6C42"), $t("\u5DF2\u8BFB\u53D6\u7F51\u7EDC\u8BF7\u6C42")], browser_network_request: [$t("\u6B63\u5728\u8BFB\u53D6\u7F51\u7EDC\u8BF7\u6C42"), $t("\u5DF2\u8BFB\u53D6\u7F51\u7EDC\u8BF7\u6C42")], browser_network_clear: [$t("\u6B63\u5728\u6E05\u7406\u7F51\u7EDC\u8BF7\u6C42\u8BB0\u5F55"), $t("\u5DF2\u6E05\u7406\u7F51\u7EDC\u8BF7\u6C42\u8BB0\u5F55")], browser_network_state_set: [$t("\u6B63\u5728\u4FEE\u6539\u6D4F\u89C8\u5668\u7F51\u7EDC\u72B6\u6001"), $t("\u5DF2\u4FEE\u6539\u6D4F\u89C8\u5668\u7F51\u7EDC\u72B6\u6001")], browser_route: [$t("\u6B63\u5728\u8BBE\u7F6E\u7F51\u7EDC\u8BF7\u6C42\u89C4\u5219"), $t("\u5DF2\u8BBE\u7F6E\u7F51\u7EDC\u8BF7\u6C42\u89C4\u5219")], browser_route_list: [$t("\u6B63\u5728\u8BFB\u53D6\u7F51\u7EDC\u8BF7\u6C42\u89C4\u5219"), $t("\u5DF2\u8BFB\u53D6\u7F51\u7EDC\u8BF7\u6C42\u89C4\u5219")], browser_unroute: [$t("\u6B63\u5728\u79FB\u9664\u7F51\u7EDC\u8BF7\u6C42\u89C4\u5219"), $t("\u5DF2\u79FB\u9664\u7F51\u7EDC\u8BF7\u6C42\u89C4\u5219")], browser_start_tracing: [$t("\u6B63\u5728\u5F00\u59CB\u8BB0\u5F55\u6D4F\u89C8\u5668\u64CD\u4F5C"), $t("\u5DF2\u5F00\u59CB\u8BB0\u5F55\u6D4F\u89C8\u5668\u64CD\u4F5C")], browser_stop_tracing: [$t("\u6B63\u5728\u505C\u6B62\u8BB0\u5F55\u6D4F\u89C8\u5668\u64CD\u4F5C"), $t("\u5DF2\u505C\u6B62\u8BB0\u5F55\u6D4F\u89C8\u5668\u64CD\u4F5C")], browser_mouse_move_xy: [$t("\u6B63\u5728\u79FB\u52A8\u9F20\u6807"), $t("\u5DF2\u79FB\u52A8\u9F20\u6807")], browser_mouse_click_xy: [$t("\u6B63\u5728\u70B9\u51FB\u9875\u9762\u5750\u6807"), $t("\u5DF2\u70B9\u51FB\u9875\u9762\u5750\u6807")], browser_mouse_drag_xy: [$t("\u6B63\u5728\u62D6\u52A8\u9875\u9762\u5750\u6807"), $t("\u5DF2\u62D6\u52A8\u9875\u9762\u5750\u6807")], browser_verify_element_visible: [$t("\u6B63\u5728\u68C0\u67E5\u9875\u9762\u5143\u7D20"), $t("\u5DF2\u68C0\u67E5\u9875\u9762\u5143\u7D20")], browser_verify_text_visible: [$t("\u6B63\u5728\u68C0\u67E5\u9875\u9762\u6587\u672C"), $t("\u5DF2\u68C0\u67E5\u9875\u9762\u6587\u672C")], browser_verify_list_visible: [$t("\u6B63\u5728\u68C0\u67E5\u9875\u9762\u5217\u8868"), $t("\u5DF2\u68C0\u67E5\u9875\u9762\u5217\u8868")], browser_verify_value: [$t("\u6B63\u5728\u68C0\u67E5\u9875\u9762\u503C"), $t("\u5DF2\u68C0\u67E5\u9875\u9762\u503C")] };
function _u(e2) {
  return e2 && typeof e2 == "object" && !Array.isArray(e2) ? e2 : {};
}
function vu(e2, t2) {
  let n2 = _u(e2)[t2];
  if (typeof n2 != "string") return;
  let r2 = n2.trim().replace(/\s+/g, " ");
  if (r2) return r2.length > 80 ? `${r2.slice(0, 79)}\u2026` : r2;
}
function yu(e2) {
  let t2 = vu(e2, "url");
  if (t2) try {
    let e3 = new URL(/^[a-z][a-z\d+.-]*:/i.test(t2) ? t2 : `https://${t2}`);
    return e3.host || (e3.protocol === "about:" ? t2 : void 0);
  } catch {
    return;
  }
}
function bu(e2, t2) {
  return t2 ? `${e2} ${t2}` : e2;
}
function xu(e2, t2, n2) {
  if (e2 === "roxy_list_templates") {
    let e3 = vu(n2, "scope");
    return e3 === "official" ? t2 ? $t("\u5DF2\u83B7\u53D6\u5B98\u65B9\u6A21\u677F\u5217\u8868") : $t("\u6B63\u5728\u83B7\u53D6\u5B98\u65B9\u6A21\u677F\u5217\u8868") : e3 === "user" ? t2 ? $t("\u5DF2\u83B7\u53D6\u7528\u6237\u6A21\u677F\u5217\u8868") : $t("\u6B63\u5728\u83B7\u53D6\u7528\u6237\u6A21\u677F\u5217\u8868") : void 0;
  }
  let r2 = hu[e2];
  return r2 ? r2[+!!t2] : void 0;
}
function Su(e2, t2) {
  let n2 = vu(t2, "action");
  return n2 === "list" ? e2 ? $t("\u5DF2\u83B7\u53D6\u6807\u7B7E\u9875\u5217\u8868") : $t("\u6B63\u5728\u83B7\u53D6\u6807\u7B7E\u9875\u5217\u8868") : n2 === "new" ? bu(e2 ? $t("\u5DF2\u6253\u5F00\u65B0\u6807\u7B7E\u9875") : $t("\u6B63\u5728\u6253\u5F00\u65B0\u6807\u7B7E\u9875"), yu(t2)) : n2 === "select" ? e2 ? $t("\u5DF2\u5207\u6362\u6807\u7B7E\u9875") : $t("\u6B63\u5728\u5207\u6362\u6807\u7B7E\u9875") : n2 === "close" ? e2 ? $t("\u5DF2\u5173\u95ED\u6807\u7B7E\u9875") : $t("\u6B63\u5728\u5173\u95ED\u6807\u7B7E\u9875") : e2 ? $t("\u5DF2\u7BA1\u7406\u6807\u7B7E\u9875") : $t("\u6B63\u5728\u7BA1\u7406\u6807\u7B7E\u9875");
}
function Cu(e2, t2) {
  let n2 = vu(t2, "textGone");
  if (n2) return bu(e2 ? $t("\u9875\u9762\u5185\u5BB9\u5DF2\u6D88\u5931") : $t("\u6B63\u5728\u7B49\u5F85\u9875\u9762\u5185\u5BB9\u6D88\u5931"), n2);
  let r2 = vu(t2, "text");
  return r2 ? bu(e2 ? $t("\u9875\u9762\u5185\u5BB9\u5DF2\u51FA\u73B0") : $t("\u6B63\u5728\u7B49\u5F85\u9875\u9762\u5185\u5BB9"), r2) : e2 ? $t("\u5DF2\u7B49\u5F85\u9875\u9762\u54CD\u5E94") : $t("\u6B63\u5728\u7B49\u5F85\u9875\u9762\u54CD\u5E94");
}
function wu(e2, t2, n2) {
  if (!e2.startsWith("browser_") && !e2.startsWith("roxy_browser_")) return;
  if (e2 === "browser_tabs") return Su(t2, n2);
  if (e2 === "browser_wait_for") return Cu(t2, n2);
  let r2 = gu[e2];
  if (r2) {
    let i2 = r2[+!!t2];
    return e2 === "browser_navigate" ? bu(i2, yu(n2)) : e2 === "browser_click" || e2 === "browser_hover" || e2 === "browser_select_option" || e2 === "browser_type" ? bu(i2, vu(n2, "element")) : i2;
  }
  return t2 ? $t("\u5DF2\u6267\u884C\u6D4F\u89C8\u5668\u64CD\u4F5C\uFF1A{name}", { name: e2 }) : $t("\u6B63\u5728\u6267\u884C\u6D4F\u89C8\u5668\u64CD\u4F5C\uFF1A{name}", { name: e2 });
}
function Tu(e2) {
  let t2 = _u(e2).path;
  return typeof t2 == "string" && t2 ? t2 : void 0;
}
function Eu(e2) {
  return e2.split(/[\\/]/).filter(Boolean).at(-1) || e2;
}
function Du(e2) {
  return e2.split(/[\\/]/).filter(Boolean);
}
function Ou(e2) {
  if (!e2) return;
  let t2 = Du(e2), n2 = t2.at(-1);
  if (!n2) return;
  let r2 = n2.lastIndexOf("."), i2 = r2 >= 0 ? n2.slice(0, r2) : n2, a2 = r2 >= 0 ? n2.slice(r2).toLowerCase() : "";
  if (i2.toUpperCase() !== "SKILL" || a2 !== ".md") return;
  let o2 = t2.at(-2);
  if (o2) return o2;
}
function ku(e2) {
  let t2 = _u(e2).cmd;
  if (typeof t2 == "string") return t2.trim().replace(/\s+/g, " ") || void 0;
}
function Au(e2) {
  let t2 = _u(e2), n2 = _u(t2.operation), r2 = n2.type, i2 = n2.path;
  if (typeof r2 == "string" && typeof i2 == "string" && i2) {
    let e3 = r2 === "create_file" ? "create" : r2 === "update_file" ? "update" : r2 === "delete_file" ? "delete" : void 0;
    return e3 ? { patchType: e3, target: i2 } : { patchType: "mixed" };
  }
  let a2 = typeof e2 == "string" ? e2 : typeof t2.patch == "string" ? t2.patch : "", o2 = [];
  for (let e3 of a2.split(/\r?\n/)) {
    let t3 = /^\*\*\* (Add File|Update File|Delete File): (.+)$/.exec(e3);
    if (!t3) continue;
    let n3 = t3[1] === "Add File" ? "create" : t3[1] === "Update File" ? "update" : "delete";
    o2.push({ patchType: n3, target: t3[2].trim() });
  }
  return o2.length === 1 ? o2[0] : { patchType: "mixed" };
}
function ju(e2, t2, n2) {
  let r2 = e2 === "success" && n2.finished !== !1, i2 = n2.patchType ? n2 : Au(t2);
  if (i2.patchType === "mixed") return r2 ? $t("\u5DF2\u66F4\u65B0\u591A\u4E2A\u6587\u4EF6") : $t("\u6B63\u5728\u66F4\u65B0\u591A\u4E2A\u6587\u4EF6");
  let a2 = { create: r2 ? $t("\u5DF2\u521B\u5EFA\u6587\u4EF6") : $t("\u6B63\u5728\u521B\u5EFA\u6587\u4EF6"), update: r2 ? $t("\u5DF2\u4FEE\u6539\u6587\u4EF6") : $t("\u6B63\u5728\u4FEE\u6539\u6587\u4EF6"), delete: r2 ? $t("\u5DF2\u5220\u9664\u6587\u4EF6") : $t("\u6B63\u5728\u5220\u9664\u6587\u4EF6") }[i2.patchType ?? "update"], o2 = n2.target || i2.target;
  return o2 ? `${a2} ${o2}` : a2;
}
function Mu(e2, t2, n2) {
  return e2 === "read" ? n2 ? $t("\u5DF2\u8BFB\u53D6 {n} \u6761\u8BB0\u5FC6", { n: t2 }) : $t("\u6B63\u5728\u8BFB\u53D6 {n} \u6761\u8BB0\u5FC6", { n: t2 }) : e2 === "write" ? n2 ? $t("\u5DF2\u5199\u5165 {n} \u6761\u8BB0\u5FC6", { n: t2 }) : $t("\u6B63\u5728\u5199\u5165 {n} \u6761\u8BB0\u5FC6", { n: t2 }) : n2 ? $t("\u5DF2\u66F4\u65B0 {n} \u6761\u8BB0\u5FC6", { n: t2 }) : $t("\u6B63\u5728\u66F4\u65B0 {n} \u6761\u8BB0\u5FC6", { n: t2 });
}
function Nu(e2, t2) {
  let n2 = du(t2);
  if (n2?.action === "search") {
    if (n2.queries.length === 0) return e2 ? $t("\u5DF2\u641C\u7D22") : $t("\u6B63\u5728\u641C\u7D22");
    let t3 = n2.queries.map((e3) => `\u201C${e3}\u201D`).join(" ");
    return e2 ? $t("\u5DF2\u641C\u7D22 {queries}", { queries: t3 }) : $t("\u6B63\u5728\u641C\u7D22 {queries}", { queries: t3 });
  }
  if (n2?.action === "open_page") return e2 ? $t("\u5DF2\u6253\u5F00\u9875\u9762 {url}", { url: n2.url }) : $t("\u6B63\u5728\u6253\u5F00\u9875\u9762 {url}", { url: n2.url });
  if (n2?.action === "find_in_page") return e2 ? $t('\u5DF2\u5728\u9875\u9762 {url} \u4E2D\u641C\u7D22 "{keyword}"', { url: n2.url, keyword: n2.pattern }) : $t('\u6B63\u5728\u9875\u9762 {url} \u4E2D\u641C\u7D22 "{keyword}"', { url: n2.url, keyword: n2.pattern });
}
function Pu(e2) {
  let t2 = ou(e2);
  return t2 ? Mu(t2.action, t2.count, t2.completed) : void 0;
}
function Fu(e2, t2, n2, r2 = {}) {
  let i2 = fu(e2), a2 = t2 === "success" && r2.finished !== !1, o2 = au(e2, n2, r2);
  if (o2?.kind === "entries") return Mu(o2.action, o2.count, a2);
  if (i2 === "apply_patch") return ju(t2, n2, r2);
  if (i2 === "spawn_agent") {
    let e3 = a2 ? $t("\u5DF2\u521B\u5EFA\u667A\u80FD\u4F53") : $t("\u6B63\u5728\u521B\u5EFA\u667A\u80FD\u4F53"), t3 = pu(n2);
    return t3 ? `${e3} ${t3}` : e3;
  }
  if (i2 === "list_agents") return a2 ? $t("\u5DF2\u5217\u51FA\u667A\u80FD\u4F53") : $t("\u6B63\u5728\u5217\u51FA\u667A\u80FD\u4F53");
  if (i2 === "wait_agent") return a2 ? $t("\u667A\u80FD\u4F53\u5DF2\u5B8C\u6210\u5DE5\u4F5C") : $t("\u6B63\u5728\u7B49\u5F85\u667A\u80FD\u4F53\u5B8C\u6210\u5DE5\u4F5C");
  if (i2 === "read_file") {
    let e3 = r2.target || Tu(n2), t3 = Ou(e3);
    if (t3) return `${$t("\u52A0\u8F7D skill")}\uFF1A${t3}`;
    let i3 = a2 ? $t("\u5DF2\u8BFB\u53D6\u6587\u4EF6") : $t("\u6B63\u5728\u8BFB\u53D6\u6587\u4EF6");
    return e3 ? `${i3} ${Eu(e3)}` : i3;
  }
  if (i2 === "exec_command") {
    let e3 = a2 ? $t("\u5DF2\u6267\u884C\u547D\u4EE4") : $t("\u6B63\u5728\u6267\u884C\u547D\u4EE4"), t3 = ku(n2);
    return t3 ? `${e3} ${t3}` : e3;
  }
  if (i2 === "web_search") {
    let e3 = Nu(a2, n2);
    if (e3) return e3;
  }
  let s2 = xu(i2, a2, n2);
  if (s2) return s2;
  let c2 = wu(i2, a2, n2);
  if (c2) return c2;
  if (i2 === "ls") return t2 === "success" ? $t("\u5DF2\u6D4F\u89C8\u76EE\u5F55") : $t("\u6D4F\u89C8\u76EE\u5F55");
  let l2 = mu.find(([e3]) => i2.includes(e3));
  return l2 ? a2 ? l2[2] : l2[1] : $t("\u4F7F\u7528\u5DE5\u5177\uFF1A{name}", { name: i2 });
}
function Iu(e2) {
  return !(!e2 || typeof e2 != "object" || Array.isArray(e2));
}
function Lu(e2) {
  return typeof e2 == "string" ? e2 : "";
}
function Ru(e2) {
  return Iu(e2) ? e2 : {};
}
function zu(e2) {
  let t2 = Ru(e2), n2 = Lu(t2.id), r2 = Lu(t2.kind);
  if (n2) {
    if (r2 === "choice") {
      let e3 = Array.isArray(t2.options) ? t2.options.map((e4) => {
        let t3 = Ru(e4), n3 = Lu(t3.id), r3 = Lu(t3.label);
        if (!n3 || !r3) return;
        let i2 = t3.variant === "primary" || t3.variant === "secondary" || t3.variant === "danger" ? t3.variant : void 0, a2 = t3.legacyDecisionType === "approve" || t3.legacyDecisionType === "reject" || t3.legacyDecisionType === "edit" ? t3.legacyDecisionType : void 0;
        return { id: n3, label: r3, value: Bu(t3.value), variant: i2, legacyDecisionType: a2 };
      }).filter((e4) => !!e4) : [];
      return e3.length ? { id: n2, kind: r2, label: Lu(t2.label) || void 0, required: t2.required === !0, options: e3 } : void 0;
    }
    if (r2 === "text" || r2 === "textarea") return { id: n2, kind: r2, label: Lu(t2.label) || void 0, required: t2.required === !0, placeholder: Lu(t2.placeholder) || void 0, defaultValue: Lu(t2.defaultValue) || void 0 };
  }
}
function Bu(e2) {
  return typeof e2 == "string" || typeof e2 == "boolean" || typeof e2 == "number" ? e2 : null;
}
function Vu(e2, t2) {
  let n2 = Ru(e2), r2 = Lu(n2.title);
  if (r2) return { id: Lu(n2.id) || `subject-${t2}`, title: r2, name: Lu(n2.name) || void 0, description: Lu(n2.description) || void 0, input: n2.input, diff: Lu(n2.diff) || void 0 };
}
function Hu(e2) {
  let t2 = Ru(e2), n2 = Lu(t2.header), r2 = Lu(t2.id), i2 = Lu(t2.question), a2 = Array.isArray(t2.options) ? t2.options.map((e3) => {
    let t3 = Ru(e3), n3 = Lu(t3.label), r3 = Lu(t3.description);
    return n3 && r3 ? { label: n3, description: r3 } : void 0;
  }).filter((e3) => !!e3) : [];
  if (!(!n2 || n2.length > 12 || !r2 || !i2 || a2.length < 2 || a2.length > 3)) return { header: n2, id: r2, question: i2, options: a2 };
}
function Uu(e2) {
  if (!Array.isArray(e2) || e2.length < 1 || e2.length > 3) return;
  let t2 = e2.map(Hu);
  return t2.every(Boolean) ? t2 : void 0;
}
function Wu(e2, t2, n2) {
  let r2 = Uu(n2.questions), i2 = Array.isArray(n2.controls) ? n2.controls.map(zu).filter((e3) => !!e3) : [];
  if (!i2.length && !r2?.length) return;
  let a2 = Lu(n2.id) || Lu(n2.requestId) || Lu(n2.interruptsId) || `hitl-${e2}-${Date.now()}`, o2 = Array.isArray(n2.subjects) ? n2.subjects.map(Vu).filter((e3) => !!e3) : [];
  return { id: a2, conversationId: e2, runId: t2, title: Lu(n2.title) || $t("\u8BF7\u6C42\u6279\u51C6"), prompt: r2?.[0]?.question || Lu(n2.prompt) || $t("RoxyAgent \u9700\u8981\u60A8\u7684\u8F93\u5165\u624D\u80FD\u7EE7\u7EED"), description: Lu(n2.description) || void 0, status: "pending", subjects: o2, controls: i2, values: Iu(n2.values) ? Object.fromEntries(Object.entries(n2.values).map(([e3, t3]) => [e3, Bu(t3)])) : {}, ...r2 ? { clarificationQuestions: r2 } : {}, source: { kind: "agent-hitl", payload: n2 } };
}
function Gu(e2) {
  return Array.isArray(e2) ? e2.map((e3, t2) => {
    let n2 = Ru(e3);
    return { name: Lu(n2.name) || `action_${t2 + 1}`, args: n2.args, diff: Lu(n2.diff) || void 0 };
  }) : [];
}
function Ku(e2) {
  return e2.split(/[\\/]/).filter(Boolean).at(-1) || e2;
}
function qu(e2) {
  let t2 = Ru(e2), n2 = Lu(Ru(t2.operation).path);
  if (n2) return [Ku(n2)];
  let r2 = typeof e2 == "string" ? e2 : Lu(t2.patch), i2 = [];
  for (let e3 of r2.split(/\r?\n/)) {
    let t3 = /^\*\*\* (?:Add File|Update File|Delete File|Move to): /.exec(e3)?.[0], n3 = t3 ? e3.slice(t3.length).trim() : "";
    n3 && i2.push(Ku(n3));
  }
  return [...new Set(i2)];
}
function Ju(e2) {
  if (typeof e2 == "string") return e2;
  try {
    return JSON.stringify(e2);
  } catch {
    return String(e2);
  }
}
function Yu(e2) {
  let t2 = fu(e2.name);
  if (t2 === "apply_patch") return qu(e2.args).join("\u3001");
  if (Array.isArray(e2.args)) {
    let t3 = e2.args.filter((e3) => typeof e3 == "string" && e3);
    if (t3.length) return t3.join("\u3001");
  }
  let n2 = Ru(e2.args), r2 = Array.isArray(n2.dirIds) ? n2.dirIds.filter((e3) => typeof e3 == "string" && e3) : typeof n2.dirId == "string" && n2.dirId ? [n2.dirId] : [];
  if (r2.length) return r2.join("\u3001");
  let i2 = Lu(n2.file_path) || Lu(n2.path);
  if (i2) return Ku(i2);
  let a2 = Lu(n2.cmd);
  if (a2) return a2;
  let o2 = Lu(n2.url);
  if (o2 && t2 !== "browser_navigate" && t2 !== "browser_tabs") return o2;
  let s2 = Object.values(n2).find((e3) => e3 != null);
  return s2 === void 0 ? "" : Ju(s2);
}
function Xu(e2) {
  for (let t2 of [$t("\u6B63\u5728"), "\u6B63\u5728"]) if (t2 && e2.startsWith(t2)) return e2.slice(t2.length);
  return e2;
}
function Zu(e2, t2) {
  let n2 = $t("\u4F7F\u7528\u5DE5\u5177\uFF1A{name}", { name: "" });
  return !!(n2 && e2.startsWith(n2)) || e2 === $t("\u4F7F\u7528\u5DE5\u5177\uFF1A{name}", { name: t2 });
}
function Qu(e2) {
  let t2 = fu(e2.name), n2 = Fu(e2.name, "running", e2.args);
  return Zu(n2, t2) ? t2.replaceAll("_", " ") : Xu(n2);
}
function $u(e2, t2) {
  return Qu({ ...e2, args: void 0 }) !== t2;
}
function ed(e2) {
  let t2 = Qu(e2);
  if ($u(e2, t2)) return t2;
  let n2 = Yu(e2);
  return n2 && !t2.includes(n2) ? `${t2} ${n2}` : t2;
}
function td(e2, t2, n2) {
  return n2.actionTitles?.[t2] || ed(e2);
}
function nd(e2, t2) {
  if (e2.length === 1) {
    let n2 = e2[0];
    return $t("\u5141\u8BB8 Roxy Agent {verb} \u5417\uFF1F", { verb: td(n2, 0, t2) });
  }
  return $t("\u5141\u8BB8 Roxy Agent \u6267\u884C {count} \u9879\u64CD\u4F5C\u5417\uFF1F", { count: e2.length });
}
function rd(e2, t2, n2, r2 = {}) {
  let i2 = Gu(n2.actionRequests);
  if (!i2.length) return;
  let a2 = Lu(n2.interruptsId) || `hitl-${e2}-${Date.now()}`;
  return { id: a2, conversationId: e2, runId: t2, title: $t("\u8BF7\u6C42\u6279\u51C6"), prompt: nd(i2, r2), description: i2.length > 1 ? i2.map((e3, t3) => td(e3, t3, r2)).join(", ") : void 0, status: "pending", subjects: i2.map((e3, t3) => ({ id: `${a2}-subject-${t3}`, title: td(e3, t3, r2), name: e3.name, input: e3.args, diff: e3.diff })), controls: [{ id: "approval", kind: "choice", required: !0, options: [{ id: "deny", label: $t("\u62D2\u7EDD"), value: "reject", variant: "secondary", legacyDecisionType: "reject" }, { id: "allow", label: $t("\u5141\u8BB8"), value: "approve", variant: "primary", legacyDecisionType: "approve" }, { id: "full-access", label: $t("\u5B8C\u5168\u8BBF\u95EE\u6743\u9650"), value: "full-access", variant: "primary", legacyDecisionType: "approve" }] }], values: { approval: null }, source: { kind: "legacy-agent-interrupt", payload: n2 } };
}
function id(e2, t2, n2, r2 = {}) {
  let i2 = Ru(n2);
  return Wu(e2, t2, i2) ?? rd(e2, t2, i2, r2);
}
function ad(e2, t2) {
  let n2 = t2.approval, r2 = e2.controls.find((e3) => e3.kind === "choice" && e3.id === "approval");
  if (r2?.kind === "choice") {
    let e3 = r2.options.find((e4) => e4.value === n2);
    if (e3?.legacyDecisionType) return e3.legacyDecisionType;
  }
  return n2 === "approve" ? "approve" : "reject";
}
function od(e2, t2) {
  let n2 = Ru(e2.source?.payload);
  if (e2.source?.kind === "agent-hitl" && n2.requestKind === "clarification") return [{ type: "answer", answer: Lu(t2.values.answer) }];
  let r2 = ad(e2, t2.values), i2 = Math.max(1, e2.subjects.length);
  return Array.from({ length: i2 }, () => ({ type: r2 }));
}
async function sd(e2, t2) {
  if (!E(e2)) return;
  let n2 = a(e2);
  if (n2.namespace === "official") {
    let e3 = await t2.templates.getOfficialTemplate({ templateIdOrSlug: String(n2.id) });
    return Fr(e3.data?.name, t2.locale).trim() || void 0;
  }
  let r2 = (await t2.userTemplates.getUserTemplate({ templateId: n2.id })).data?.name;
  return typeof r2 == "string" && r2.trim() || void 0;
}
function cd(e2) {
  return !(!e2 || typeof e2 != "object" || Array.isArray(e2));
}
function ld(e2) {
  return typeof e2 == "string" ? e2.trim() : "";
}
function ud(e2) {
  return Array.isArray(e2) ? e2.map((e3) => {
    let t2 = cd(e3) ? e3 : {};
    return { name: ld(t2.name), args: t2.args };
  }) : [];
}
function dd(e2) {
  return [...new Set(e2.filter(Boolean))];
}
function fd(e2) {
  return Array.isArray(e2) ? dd(e2.flatMap((e3) => typeof e3 == "string" && e3.trim() ? [e3.trim()] : typeof e3 == "number" && Number.isFinite(e3) ? [String(e3)] : [])) : [];
}
function pd(e2) {
  if (Array.isArray(e2.args)) return dd(e2.args.flatMap((e3) => cd(e3) ? fd(e3.dirIds) : typeof e3 == "string" ? [e3] : []));
  let t2 = cd(e2.args) ? e2.args : {};
  return Array.isArray(t2.scripts) ? dd(t2.scripts.flatMap((e3) => cd(e3) ? fd(e3.dirIds) : [])) : fd(t2.dirIds);
}
function md(e2) {
  return fd((cd(e2.args) ? e2.args : {}).ids);
}
function hd(e2) {
  if (Array.isArray(e2.args)) return e2.args.map((e3) => cd(e3) ? ld(e3.scriptPath) : "").filter(Boolean).join(", ");
  let t2 = cd(e2.args) ? e2.args : {};
  return Array.isArray(t2.scripts) ? t2.scripts.map((e3) => cd(e3) ? ld(e3.scriptPath) : "").filter(Boolean).join(", ") : ld(t2.scriptPath);
}
function gd(e2) {
  if (Array.isArray(e2.args)) return dd(e2.args.flatMap((e3) => cd(e3) ? [ld(e3.scriptPath)] : []));
  let t2 = cd(e2.args) ? e2.args : {};
  if (Array.isArray(t2.scripts)) return dd(t2.scripts.flatMap((e3) => cd(e3) ? [ld(e3.scriptPath)] : []));
  let n2 = hd(e2);
  return n2 ? [n2] : [];
}
function _d(e2) {
  return e2.split(/[\\/]/).filter(Boolean).at(-1) || e2;
}
function vd(e2) {
  return e2.startsWith("/") || e2.startsWith("\\\\") || /^[a-z]:[\\/]/i.test(e2);
}
function yd(e2, t2) {
  let n2 = Ft(t2);
  return n2 ? `${n2}-${e2}` : String(e2);
}
async function bd(e2, t2) {
  if (e2.length === 0) return /* @__PURE__ */ new Map();
  try {
    let n2 = await A.window.userGetWindowInfoV2List({ page_index: 1, page_size: e2.length, dirIds: e2.join(","), isDelete: 0 });
    if (n2.code !== 0) throw Error(n2.msg || "Failed to load windows");
    return new Map((n2.data?.rows ?? []).flatMap((e3) => !e3.dirId || typeof e3.windowSortNum != "number" ? [] : [[e3.dirId, yd(e3.windowSortNum, t2)]]));
  } catch (e3) {
    return console.warn("[agent-console] Failed to resolve HITL window names:", e3), /* @__PURE__ */ new Map();
  }
}
async function xd(e2) {
  if (e2.length === 0) return /* @__PURE__ */ new Map();
  try {
    let t2 = await A.proxy.userGetProxyModuleList({ page_index: 1, page_size: e2.length, id: e2.join(",") });
    if (t2.code !== 0) throw Error(t2.msg || "Failed to load proxies");
    return new Map((t2.data?.rows ?? []).flatMap((e3) => {
      let t3 = ld(e3.remark);
      return t3 ? [[String(e3.id), t3]] : [];
    }));
  } catch (e3) {
    return console.warn("[agent-console] Failed to resolve HITL proxy names:", e3), /* @__PURE__ */ new Map();
  }
}
async function Sd(e2) {
  let t2 = await Promise.all(e2.map(async (e3) => {
    if (e3) try {
      let t3 = { id: e3, page_index: 1, page_size: 1 }, n2 = await A.platform.userGetPlatformInfoV2List(t3);
      if (n2.code !== 0) throw Error(n2.msg || "Failed to load platform account");
      let r2 = ld((n2.data?.rows?.find((t4) => String(t4.id) === e3) ?? n2.data?.rows?.[0])?.platformUserName);
      return r2 ? [e3, r2] : void 0;
    } catch (t3) {
      console.warn(`[agent-console] Failed to resolve HITL platform account ${e3}:`, t3);
      return;
    }
  }));
  return new Map(t2.filter((e3) => !!e3));
}
async function Cd(e2, t2) {
  if (!e2) return "";
  if (vd(e2)) return _d(e2);
  try {
    if (E(e2)) return await sd(e2, t2) || e2;
    if (/^(?:official|user):/.test(e2)) return e2;
    let n2 = await t2.officialScripts.getOfficialScript({ scriptIdOrSlug: e2 });
    return Fr(n2.data?.name, t2.locale) || e2;
  } catch (t3) {
    return console.warn(`[agent-console] Failed to resolve HITL script ${e2}:`, t3), e2;
  }
}
function wd(e2, t2) {
  return e2.map((e3) => t2.get(e3) || e3).join("\u3001");
}
async function Td(e2, t2) {
  let n2 = ud(e2), r2 = dd(n2.flatMap((e3) => {
    let t3 = fu(e3.name);
    return t3 === "roxy_profile_delete" || t3 === "roxy_script_run" ? pd(e3) : [];
  })), i2 = dd(n2.flatMap((e3) => fu(e3.name) === "roxy_proxy_delete" ? md(e3) : [])), a2 = dd(n2.flatMap((e3) => fu(e3.name) === "roxy_platform_account_delete" ? md(e3) : [])), o2 = dd(n2.flatMap((e3) => fu(e3.name) === "roxy_script_run" ? gd(e3) : [])), [s2, c2, l2, u2] = await Promise.all([bd(r2, t2.workspaceName), xd(i2), Sd(a2), Promise.all(o2.map(async (e3) => [e3, await Cd(e3, t2)]))]), d2 = new Map(u2);
  return n2.map((e3) => {
    let t3 = fu(e3.name);
    if (t3 === "roxy_profile_delete") {
      let t4 = wd(pd(e3), s2);
      return t4 ? $t("\u5220\u9664\u7A97\u53E3 {names}", { names: t4 }) : void 0;
    }
    if (t3 === "roxy_proxy_delete") {
      let t4 = wd(md(e3), c2);
      return t4 ? $t("\u5220\u9664\u4EE3\u7406 IP {names}", { names: t4 }) : void 0;
    }
    if (t3 === "roxy_platform_account_delete") {
      let t4 = wd(md(e3), l2);
      return t4 ? $t("\u5220\u9664\u5E73\u53F0\u8D26\u53F7 {names}", { names: t4 }) : void 0;
    }
    if (t3 === "roxy_script_run") {
      let t4 = wd(pd(e3), s2), n3 = gd(e3).map((e4) => d2.get(e4) || e4).join(", ");
      if (t4 && n3) return $t("\u5728\u7A97\u53E3 {windows} \u4E2D\u8FD0\u884C\u811A\u672C {script}", { windows: t4, script: n3 });
      if (n3) return $t("\u8FD0\u884C\u811A\u672C {script}", { script: n3 });
    }
  });
}
function Ed() {
  return { model_not_configured: $t("\u6A21\u578B\u4E0D\u652F\u6301\u3002"), model_not_supported: $t("\u6A21\u578B\u4E0D\u652F\u6301\uFF0C\u8BF7\u5C1D\u8BD5\u5C06 APP \u66F4\u5230\u6700\u65B0\u7248\u672C\uFF0C\u6216\u8005\u91CD\u542F Roxy AI Agent \u7A97\u53E3"), upstream_invalid_request: $t("\u8BF7\u6C42\u53C2\u6570\u6709\u8BEF\uFF0C\u8BF7\u8C03\u6574\u540E\u91CD\u8BD5\u3002"), upstream_content_policy_violation: $t("\u5185\u5BB9\u6D89\u53CA\u654F\u611F\u4FE1\u606F\uFF0C\u8BF7\u4FEE\u6539\u63CF\u8FF0\u540E\u91CD\u8BD5\u3002"), insufficient_points: $t("\u60A8\u7684\u79EF\u5206\u4E0D\u8DB3\uFF0C\u8BF7\u5145\u503C\u79EF\u5206\u540E\u91CD\u8BD5\u3002"), forward_rate_limited: $t("\u60A8\u7684\u79EF\u5206\u4E0D\u8DB3\uFF0C\u8BF7\u5145\u503C\u79EF\u5206\u540E\u91CD\u8BD5\u3002"), upstream_rate_limited: $t("\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u8054\u7CFB\u6280\u672F\u652F\u6301"), provider_auth_failed: $t("\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u6216\u8054\u7CFB\u6280\u672F\u652F\u6301\u3002"), provider_quota_exceeded: $t("\u670D\u52A1\u989D\u5EA6\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u6216\u8054\u7CFB\u6280\u672F\u652F\u6301\u3002"), provider_not_found: $t("\u670D\u52A1\u914D\u7F6E\u5F02\u5E38\uFF0C\u8BF7\u8054\u7CFB\u6280\u672F\u652F\u6301\u3002"), provider_unavailable: $t("\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002"), provider_timeout: $t("\u670D\u52A1\u54CD\u5E94\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002"), network_interrupted: $t("\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002"), agent_internal_error: $t("\u672A\u77E5\u9519\u8BEF\uFF0C\u8BF7\u8054\u7CFB\u6280\u672F\u652F\u6301\u3002") };
}
function Dd() {
  return $t("\u672A\u77E5\u9519\u8BEF\uFF0C\u8BF7\u8054\u7CFB\u6280\u672F\u652F\u6301\u3002");
}
function Od(e2) {
  return typeof e2 == "object" && !!e2 && !Array.isArray(e2);
}
function kd(...e2) {
  for (let t2 of e2) if (typeof t2 == "string" && t2.trim()) return t2;
}
function Ad(e2, t2) {
  if (typeof e2 == "string" && e2.trim()) return /^\d+$/.test(e2.trim()) ? Ad(Number(e2), t2) : e2;
  let n2 = t2?.toLowerCase() ?? "";
  if (e2 === 402 || n2.includes("insufficient points") || n2.includes("points balance is insufficient") || t2?.includes("\u79EF\u5206\u4E0D\u8DB3")) return "insufficient_points";
  if (e2 === 429) return "upstream_rate_limited";
}
function jd(e2) {
  if (!Od(e2)) return {};
  let t2 = Od(e2.response) ? e2.response : void 0, n2 = t2 && Od(t2.data) ? t2.data : void 0, r2 = Od(e2.error) ? e2.error : void 0, i2 = n2 ?? r2 ?? e2, a2 = kd(i2.message, e2.message, t2?.message, n2?.message, r2?.message);
  return { code: Ad(i2.code ?? e2.code ?? t2?.status ?? n2?.status ?? r2?.code, a2), message: a2, requestId: kd(i2.requestId, i2.request_id, e2.requestId, e2.request_id, e2.requestID, t2?.requestID, t2?.requestId, n2?.requestId, n2?.request_id, r2?.requestID, r2?.requestId, r2?.request_id), retryable: typeof i2.retryable == "boolean" ? i2.retryable : typeof n2?.retryable == "boolean" ? n2.retryable : typeof e2.retryable == "boolean" ? e2.retryable : void 0 };
}
function Md(e2) {
  return jd(e2).code;
}
function Nd(e2) {
  return Md(e2) === "agent_cancelled" || e2 && typeof e2 == "object" && e2.message === "User cancelled";
}
function Pd(e2) {
  if (typeof e2 == "string") return { message: e2 || Dd(), retryable: !1 };
  let t2 = jd(e2), n2 = t2.code, r2 = t2.requestId, i2 = Ed();
  return { message: n2 && i2[n2] || t2.message || Dd(), code: n2, retryable: t2.retryable === !0, requestId: r2 };
}
function Fd(e2) {
  return e2 === "starting" || e2 === "running" ? "running" : e2 === "completed" ? "success" : "failed";
}
function Id(e2, t2) {
  return `${{ starting: "\u6B63\u5728\u521B\u5EFA", running: "\u6B63\u5728\u6267\u884C", completed: "\u5DF2\u5B8C\u6210", failed: "\u6267\u884C\u5931\u8D25", cancelled: "\u5DF2\u53D6\u6D88" }[t2]} ${e2}`;
}
function Ld(e2, t2, n2 = {}) {
  let r2 = `${e2.currentConversationId ?? e2.conversationId}:${e2.currentRunId ?? e2.runId}:${t2}`, i2 = e2.agentByPath.get(r2);
  if (i2) return i2;
  let a2 = $(n2.parentAgentPath) || t2.split("/").slice(0, -1).join("/") || void 0, o2 = $(n2.agentName) || t2.split("/").at(-1) || t2, s2 = $(n2.status) || "starting", c2 = { id: `agent-${t2}`, type: "agent_lifecycle", agentPath: t2, parentAgentPath: a2, agentName: o2, agentType: $(n2.agentType) || "agent", lifecycleStatus: s2, title: Id(o2, s2), status: Fd(s2), expanded: !1, startedAt: Gd(n2.startedAt), finishedAt: Gd(n2.finishedAt), report: $(n2.report) || void 0, error: $(n2.error) || void 0, events: [], children: [] };
  return e2.agentByPath.set(r2, c2), a2 && a2 !== "/root" ? Ld(e2, a2).children.push(c2) : t2 !== "/root" && e2.rootEvents.push(c2), c2;
}
function Rd(e2) {
  let t2 = $(e2.agentPath);
  return t2 === "/root" || !t2 ? "/root" : t2;
}
function zd(e2, t2) {
  return `${e2.currentConversationId ?? e2.conversationId}:${e2.currentRunId ?? e2.runId}:${Rd(t2)}`;
}
function Bd(e2, t2, n2, r2) {
  return Rd(t2) === "/root" ? `${n2}-${r2}` : `${n2}-${zd(e2, t2)}-${r2}`;
}
function Vd(e2, t2) {
  let n2 = Rd(t2);
  return n2 === "/root" ? e2.rootEvents : Ld(e2, n2, t2).events;
}
function Hd(e2, t2) {
  let n2 = $(t2.agentPath);
  if (!n2) return;
  let r2 = Ld(e2, n2, t2), i2 = $(t2.status);
  r2.parentAgentPath = $(t2.parentAgentPath) || r2.parentAgentPath, r2.agentName = $(t2.agentName) || r2.agentName, r2.agentType = $(t2.agentType) || r2.agentType, r2.lifecycleStatus = i2, r2.title = Id(r2.agentName, i2), r2.status = Fd(i2), r2.startedAt = Gd(t2.startedAt) ?? r2.startedAt, r2.finishedAt = Gd(t2.finishedAt) ?? r2.finishedAt, r2.report = $(t2.report) || r2.report, r2.error = $(t2.error) || r2.error;
}
function Ud(e2, t2, n2, r2) {
  if (t2 === "/root") return;
  let i2 = t2, a2 = n2;
  for (; i2 && i2 !== "/root"; ) {
    let t3 = Ld(e2, i2, a2);
    t3.renderRevision = Math.max(t3.renderRevision ?? 0, r2), i2 = t3.parentAgentPath, a2 = {};
  }
}
function Wd(e2, t2 = []) {
  let n2 = [...e2.filter((e3) => e3.type === "agent_lifecycle"), ...t2], r2 = [...n2], i2 = /* @__PURE__ */ new Map();
  for (let t3 of e2) {
    if (t3.type !== "tool_call" || t3.toolName !== "spawn_agent" && !t3.toolName.endsWith("__spawn_agent")) continue;
    let e3 = Kd(t3.input), n3 = $(e3.name) || $(e3.taskName), a3 = n3 ? r2.findIndex((e4) => e4.agentName === n3) : r2.length > 0 ? 0 : -1;
    a3 < 0 || i2.set(t3.id, r2.splice(a3, 1)[0]);
  }
  let a2 = new Set(i2.values()), o2 = e2.flatMap((e3) => {
    let t3 = i2.get(e3.id);
    return t3 ? [t3] : e3.type === "agent_lifecycle" && a2.has(e3) ? [] : [e3];
  });
  for (let e3 of n2) {
    let t3 = Wd(e3.events, e3.children);
    e3.events = t3.events, e3.children = t3.remainingChildren;
  }
  return { events: o2, remainingChildren: t2.filter((e3) => !a2.has(e3)) };
}
function $(e2) {
  return typeof e2 == "string" ? e2 : "";
}
function Gd(e2) {
  return typeof e2 == "number" && Number.isFinite(e2) ? e2 : void 0;
}
function Kd(e2) {
  return e2 && typeof e2 == "object" && !Array.isArray(e2) ? e2 : {};
}
function qd(e2) {
  if (typeof e2 != "string") return e2;
  try {
    return JSON.parse(e2);
  } catch {
    return e2;
  }
}
function Jd(e2) {
  let t2 = S.safeParse(qd(e2));
  return t2.success ? t2.data : void 0;
}
function Yd(e2) {
  if (!e2) return "";
  let t2 = new Date(typeof e2 == "number" && e2 < 1e10 ? e2 * 1e3 : e2);
  if (Number.isNaN(t2.getTime())) return `${e2}`;
  let n2 = (e3) => `${e3}`.padStart(2, "0"), r2 = /* @__PURE__ */ new Date();
  return `${t2.getFullYear() === r2.getFullYear() ? `${n2(t2.getMonth() + 1)}/${n2(t2.getDate())}` : `${t2.getFullYear()}/${n2(t2.getMonth() + 1)}/${n2(t2.getDate())}`} ${n2(t2.getHours())}:${n2(t2.getMinutes())}`;
}
function Xd(e2) {
  if (e2 < 1e3) return `${$t("\u4EFB\u52A1\u8017\u65F6")} 1s`;
  let t2 = Math.round(e2 / 1e3);
  if (t2 < 60) return `${$t("\u4EFB\u52A1\u8017\u65F6")} ${t2}s`;
  let n2 = Math.floor(t2 / 60), r2 = t2 % 60;
  return r2 > 0 ? `${$t("\u4EFB\u52A1\u8017\u65F6")} ${n2}m${r2}s` : `${$t("\u4EFB\u52A1\u8017\u65F6")} ${n2}m`;
}
function Zd(e2) {
  let t2 = Math.max(1, Math.round(e2 / 1e3));
  if (t2 < 60) return `${t2}s`;
  let n2 = Math.floor(t2 / 60), r2 = t2 % 60;
  return r2 > 0 ? `${n2}m${r2}s` : `${n2}m`;
}
function Qd(e2) {
  return e2 === "pending" || e2 === "running" || e2 === "success" || e2 === "failed" ? e2 : e2 === "error" || e2 === "cancelled" ? "failed" : "success";
}
function $d(e2, t2, n2, r2) {
  let i2 = t2.get(n2);
  if (i2?.type === "thinking") return i2;
  let a2 = { id: r2, type: "thinking", title: $t("\u6B63\u5728\u601D\u8003"), expanded: !1, status: "running", content: "" };
  return t2.set(n2, a2), e2.push(a2), a2;
}
function ef(e2, t2, n2, r2, i2 = !1) {
  let a2 = t2.get(n2);
  if (a2?.type === "content") return a2;
  let o2 = { id: r2, type: "content", content: "", emphasis: i2 };
  return t2.set(n2, o2), e2.push(o2), o2;
}
function tf(e2, t2, n2, r2, i2) {
  let a2 = t2.get(n2);
  if (a2?.type === "tool_call") return a2;
  let o2 = { id: r2, type: "tool_call", toolName: $(i2.toolName) || "tool", finished: !1, target: $(i2.target), patchType: i2.patchType === "create" || i2.patchType === "update" || i2.patchType === "delete" || i2.patchType === "mixed" ? i2.patchType : void 0, input: i2.input, status: "running" };
  return t2.set(n2, o2), e2.push(o2), o2;
}
function nf(e2, t2, n2, r2, i2, a2) {
  let o2 = t2.get(n2);
  if (o2?.type === "task_report") return o2;
  let s2 = { id: r2, type: "task_report", sourceReportId: i2, report: a2, status: "success" };
  return t2.set(n2, s2), e2.push(s2), s2;
}
function rf(e2) {
  return e2.startsWith("/") || /^[a-z]:[\\/]/i.test(e2) || e2.startsWith("\\\\");
}
function af(e2) {
  return e2.split(/[\\/]/).filter(Boolean).at(-1) || e2;
}
function of(e2) {
  return rf(e2) ? af(e2) : e2;
}
function sf(e2, t2, n2, r2, i2) {
  let a2 = e2.eventByKey.get(n2);
  if (a2?.type === "script_log") {
    let e3 = $(i2.scriptName);
    return e3 && a2.scriptName !== e3 && (a2.scriptName = e3, a2.title = `${$t("\u8FD0\u884C\u811A\u672C")} ${of(e3)}`), a2;
  }
  let o2 = $(i2.scriptName), s2 = $(i2.toolId) || void 0, c2 = $(i2.scriptRunId) || void 0, l2 = $(i2.dirId) || void 0, u2 = { id: r2, type: "script_log", title: o2 ? `${$t("\u8FD0\u884C\u811A\u672C")} ${of(o2)}` : $t("\u8FD0\u884C\u811A\u672C"), expanded: !1, status: "running", toolId: s2, scriptRunId: c2, dirId: l2, scriptName: o2, lines: [] };
  return e2.eventByKey.set(n2, u2), t2.push(u2), u2;
}
function cf(e2) {
  let t2 = "agent-files", n2 = e2.eventByKey.get(t2);
  if (n2?.type === "agent_file") return n2;
  let r2 = { id: t2, type: "agent_file", title: $t("\u4EA7\u7269\u6587\u4EF6"), status: "success", files: [] };
  return e2.eventByKey.set(t2, r2), e2.rootEvents.push(r2), r2;
}
function lf(e2) {
  return e2.requestKind === "clarification";
}
function uf(e2, t2 = !1) {
  if (lf(e2)) {
    let n2 = Array.isArray(e2.questions) && e2.questions.length > 0 ? e2.questions.length : 1;
    return t2 ? $t("\u5DF2\u8BE2\u95EE {n} \u4E2A\u95EE\u9898", { n: n2 }) : $t("\u6B63\u5728\u8BE2\u95EE {n} \u4E2A\u95EE\u9898", { n: n2 });
  }
  return t2 ? $(e2.title) || $t("\u5BA1\u6279\u5DF2\u5904\u7406") : $(e2.title) || $t("\u8BF7\u6C42\u6279\u51C6");
}
function df(e2) {
  let [t2, ...n2] = e2.split(/[:：]/);
  return { title: t2.trim() || e2, description: n2.join("\uFF1A").trim() };
}
function ff(e2) {
  if (!Array.isArray(e2)) return "";
  let t2 = e2.map(Kd).find((e3) => $(e3.kind) === "choice" && $(e3.id) === "answer") ?? e2.map(Kd).find((e3) => $(e3.kind) === "choice"), n2 = Array.isArray(t2?.options) ? t2.options.map(Kd) : [], r2 = n2.find((e3) => $(e3.label).includes("\u63A8\u8350")) ?? n2[0];
  return r2 ? df($(r2.label)).title : "";
}
function pf(e2) {
  let t2 = $(e2.description);
  if (t2) return t2;
  if (lf(e2)) return;
  let n2 = ff(e2.controls);
  if (n2) return n2;
}
function mf(e2) {
  if (!Array.isArray(e2.questions)) return;
  let t2 = e2.questions.map(Kd).map((e3) => {
    let t3 = $(e3.id), n2 = $(e3.header), r2 = $(e3.question), i2 = Array.isArray(e3.options) ? e3.options.map(Kd).map((e4) => {
      let t4 = $(e4.label), n3 = $(e4.description);
      return t4 ? { label: t4, description: n3 } : void 0;
    }).filter((e4) => !!e4) : [];
    return t3 && r2 ? { id: t3, header: n2, question: r2, options: i2 } : void 0;
  }).filter((e3) => !!e3);
  return t2.length > 0 ? t2 : void 0;
}
function hf(e2) {
  try {
    let t2 = JSON.parse(e2);
    return !t2 || typeof t2 != "object" || Array.isArray(t2) ? void 0 : Object.fromEntries(Object.entries(t2).filter(([, e3]) => typeof e3 == "string").map(([e3, t3]) => [e3, t3.trim()]));
  } catch {
    return;
  }
}
function gf(e2, t2) {
  let n2 = Array.isArray(e2.decisions) ? e2.decisions.map(Kd) : [];
  for (let e3 of n2) if ($(e3.type) === "answer") {
    let n3 = $(e3.answer).trim();
    if (!t2?.length) return { detail: n3 || $t("\u5DF2\u8DF3\u8FC7") };
    let r2 = hf(n3);
    return r2 ? { clarificationAnswers: t2.map((e4) => {
      let t3 = r2[e4.id] || "";
      return { id: e4.id, question: e4.question, answer: t3 || $t("\u672A\u63D0\u4F9B\u7B54\u6848"), recommended: !!(t3 && e4.options[0]?.label === t3) };
    }) } : { detail: n3 || $t("\u5DF2\u8DF3\u8FC7") };
  }
}
function _f(e2, t2, n2, r2, i2) {
  let a2 = e2.hitlByApprovalId.get(r2), o2 = mf(i2), s2 = o2?.length;
  if (a2) return a2.title = uf(i2), a2.prompt = $(i2.prompt) || a2.prompt, a2.description = $(i2.description) || a2.description, a2.detail = pf(i2) || a2.detail, a2.requestKind = lf(i2) ? "clarification" : "approval", a2.clarificationQuestionCount = s2 ?? a2.clarificationQuestionCount, a2.clarificationQuestions = o2 ?? a2.clarificationQuestions, a2.status = "running", a2;
  let c2 = { id: `hitl-${n2}-${r2}`, type: "hitl", title: uf(i2), prompt: $(i2.prompt) || $t("RoxyAgent \u9700\u8981\u60A8\u7684\u8F93\u5165\u624D\u80FD\u7EE7\u7EED"), description: $(i2.description) || void 0, detail: pf(i2), requestKind: lf(i2) ? "clarification" : "approval", clarificationQuestionCount: s2, clarificationQuestions: o2, approvalId: r2, status: "running", expanded: !0 };
  return e2.hitlByApprovalId.set(r2, c2), t2.push(c2), c2;
}
function vf(e2, t2, n2) {
  let r2 = $(t2.approvalId), i2 = r2 ? e2.hitlByApprovalId.get(r2) : void 0;
  if (!i2) return;
  let a2 = i2.requestKind === "clarification" ? gf(t2, i2.clarificationQuestions) : void 0;
  i2.status = "success", i2.title = i2.requestKind === "clarification" ? $t("\u5DF2\u8BE2\u95EE {n} \u4E2A\u95EE\u9898", { n: i2.clarificationQuestionCount ?? 1 }) : uf({ ...t2, requestKind: i2.requestKind }, !0), i2.detail = a2?.detail ?? i2.detail, i2.clarificationAnswers = a2?.clarificationAnswers ?? i2.clarificationAnswers, i2.timestamp = Yd(n2);
}
function yf(e2, t2 = "running") {
  if (t2 === "success") return $t("\u5DF2\u91CD\u65B0\u8FDE\u63A5");
  if (t2 === "failed") return $t("\u7F51\u7EDC\u91CD\u8BD5\u5931\u8D25");
  let n2 = Gd(e2.attempt) ?? 0, r2 = Gd(e2.maxAttempts) ?? 0;
  return $t("\u6B63\u5728\u91CD\u65B0\u8FDE\u63A5 {attempt}/{maxAttempts}", { attempt: n2, maxAttempts: r2 });
}
function bf(e2, t2, n2, r2, i2, a2) {
  let o2 = e2.activeRetriesByScope.get(n2);
  if (o2) return o2.attempt = Gd(a2.attempt) ?? o2.attempt, o2.maxAttempts = Gd(a2.maxAttempts) ?? o2.maxAttempts, o2.reason = $(a2.reason) || o2.reason, o2.status = "running", o2.title = yf(a2), o2;
  let s2 = e2.eventByKey.get(r2);
  if (s2?.type === "retrying") return s2.attempt = Gd(a2.attempt) ?? s2.attempt, s2.maxAttempts = Gd(a2.maxAttempts) ?? s2.maxAttempts, s2.reason = $(a2.reason) || s2.reason, s2.status = "running", s2.title = yf(a2), e2.activeRetriesByScope.set(n2, s2), s2;
  let c2 = { id: i2, type: "retrying", title: yf(a2), attempt: Gd(a2.attempt) ?? 0, maxAttempts: Gd(a2.maxAttempts) ?? 0, reason: $(a2.reason) || void 0, status: "running", timestamp: void 0 };
  return e2.eventByKey.set(r2, c2), e2.activeRetriesByScope.set(n2, c2), t2.push(c2), c2;
}
function xf(e2, t2, n2) {
  let r2 = e2.activeRetriesByScope.get(t2);
  r2 && (r2.status = n2, r2.title = yf(r2, n2), e2.activeRetriesByScope.delete(t2));
}
function Sf(e2, t2) {
  let n2 = zd(e2, t2), r2 = $(t2.toolId), i2 = $(t2.scriptRunId), a2 = $(t2.dirId), o2 = r2 || i2 || $(t2.scriptName) || "default", s2 = a2 || i2, c2 = Vd(e2, t2), l2 = `script:${n2}:${o2}`, u2 = s2 ? `${l2}:${s2}` : l2, d2 = e2.eventByKey.get(u2);
  if (d2?.type !== "script_log") {
    let f3 = e2.eventByKey.get(l2);
    f3?.type === "script_log" && !f3.dirId ? (f3.toolId = r2 || f3.toolId, f3.scriptRunId = i2 || f3.scriptRunId, f3.dirId = a2 || f3.dirId, e2.eventByKey.set(u2, f3), d2 = f3) : d2 = sf(e2, c2, u2, `script-log-${n2}-${o2}-${s2 || "default"}`, t2);
  }
  if (d2.type !== "script_log") return;
  let f2 = $(t2.scriptName);
  f2 && d2.scriptName !== f2 && (d2.scriptName = f2, d2.title = `${$t("\u8FD0\u884C\u811A\u672C")} ${of(f2)}`), d2.toolId = r2 || d2.toolId, d2.scriptRunId = i2 || d2.scriptRunId, d2.dirId = a2 || d2.dirId;
  let p2 = t2.unavailableReason === "file_missing" ? $t("\uFF08\u811A\u672C\u65E5\u5FD7\u6587\u4EF6\u4E0D\u5B58\u5728\uFF09") : $(t2.message) || $(t2.text);
  p2 && d2.lines.push({ level: $(t2.level) || "info", message: p2 });
}
function Cf(e2, t2) {
  let n2 = $(t2.fileId), r2 = $(t2.fileName);
  if (!n2 || !r2) return;
  let i2 = cf(e2), a2 = { fileId: n2, fileName: r2, size: Gd(t2.size) ?? 0, mimeType: $(t2.mimeType) || "application/octet-stream", op: t2.op === "update" ? "update" : "create" }, o2 = i2.files.findIndex((e3) => e3.fileId === a2.fileId);
  o2 >= 0 ? i2.files[o2] = a2 : i2.files.push(a2);
}
function wf(e2, t2) {
  e2.finalAnswer || (e2.finalAnswer = { id: "final-answer", type: "final_answer", content: "" }, e2.rootEvents.push(e2.finalAnswer)), e2.finalAnswer.content += t2;
}
function Tf(e2) {
  if (!e2.finalAnswer?.content.trim()) for (let t2 = e2.rootEvents.length - 1; t2 >= 0; t2--) {
    let n2 = e2.rootEvents[t2];
    if (n2.type === "content" && n2.content.trim()) {
      e2.finalAnswer = { id: "final-answer", type: "final_answer", content: n2.content }, e2.rootEvents.splice(t2, 1, e2.finalAnswer);
      return;
    }
  }
}
function Ef(e2, t2) {
  e2.finalAnswer || Tf(e2), e2.finalAnswer ? e2.finalAnswer.content = t2 : wf(e2, t2);
}
function Df(e2, t2, n2, r2, i2) {
  let a2 = `${n2}:thinking:${t2}`, o2 = e2.eventByKey.get(a2);
  if (o2?.type !== "thinking") return;
  let s2 = o2.durationStartedAt !== void 0 && i2 !== void 0 ? Math.max(0, i2 - o2.durationStartedAt) : void 0;
  o2.durationEndedAt = Gd(r2.endTimestamp) ?? i2, o2.durationMs = Gd(r2.durationMs) ?? s2, o2.title = `${$t("\u5DF2\u601D\u8003")} ${Zd(o2.durationMs ?? 0)}`, o2.status = "success";
}
function Of(e2, t2) {
  let n2 = $(t2.toolName) || "tool", r2 = $(t2.toolId) || `${n2}-${e2.eventByKey.size}`, i2 = zd(e2, t2), a2 = Vd(e2, t2);
  if (n2 === "roxy_task_report") {
    let n3 = Jd(t2.input ?? t2.args);
    if (!n3) return;
    e2.pendingTaskReports.set(`task-report:${i2}:${r2}`, { sourceReportId: r2, report: n3 });
  } else if (au(n2, t2.input ?? t2.args, { patchType: t2.patchType === "create" || t2.patchType === "update" || t2.patchType === "delete" || t2.patchType === "mixed" ? t2.patchType : void 0, target: $(t2.target) || void 0 })?.kind !== "hidden")
    if (n2 === "load_skill_file") {
      let n3 = $(t2.skillFilePath) || $(t2.skillName) || "skill", o2 = { id: `skill-${i2}-${r2}`, type: "skill_load", skillPath: n3, status: "running" };
      e2.eventByKey.set(`skill:${i2}:${r2}`, o2), a2.push(o2);
    } else if (n2 === "roxy_script_run") {
      let n3 = Kd(t2.input ?? t2.args), o2 = Array.isArray(n3.scripts) ? n3.scripts.filter((e3) => !(!e3 || typeof e3 != "object" || Array.isArray(e3))) : [n3], s2 = [...new Set(o2.flatMap((e3) => Array.isArray(e3.dirIds) ? e3.dirIds.map($).filter(Boolean) : []))];
      if (s2.length > 0) {
        for (let n4 of s2) sf(e2, a2, `script:${i2}:${r2}:${n4}`, `script-log-${i2}-${r2}-${n4}`, { ...t2, scriptName: $(t2.target), toolId: r2, dirId: n4 });
        return;
      }
      sf(e2, a2, `script:${i2}:${r2}`, `script-log-${i2}-${r2}`, { ...t2, scriptName: $(t2.target), toolId: r2 });
    } else tf(a2, e2.eventByKey, `tool:${i2}:${r2}`, `tool-${i2}-${r2}`, t2);
}
function kf(e2, t2) {
  let n2 = $(t2.toolName) || "tool", r2 = $(t2.toolId) || `${n2}-${e2.eventByKey.size}`, i2 = zd(e2, t2), a2 = `task-report:${i2}:${r2}`, o2 = e2.pendingTaskReports.get(a2);
  if (o2) {
    if (e2.pendingTaskReports.delete(a2), t2.status === "success") {
      let n3 = nf(Vd(e2, t2), e2.eventByKey, a2, `task-report-${i2}-${r2}`, o2.sourceReportId, o2.report);
      for (let r3 of Vd(e2, t2)) r3.type === "task_report" && r3 !== n3 && (r3.superseded = !0);
    }
    return;
  }
  let s2 = e2.eventByKey.get(`skill:${i2}:${r2}`);
  if (s2?.type === "skill_load") {
    s2.status = Qd(t2.status);
    return;
  }
  if (n2 === "roxy_script_run") {
    let n3 = Qd(t2.status), i3 = Vd(e2, t2);
    for (let t3 of new Set(e2.eventByKey.values())) t3.type === "script_log" && t3.toolId === r2 && i3.includes(t3) && (t3.status = n3);
    return;
  }
  let c2 = e2.eventByKey.get(`tool:${i2}:${r2}`);
  c2?.type === "tool_call" && (c2.finished = !0, c2.status = Qd(t2.status), c2.output = t2.output, c2.durationMs = Gd(t2.durationMs));
}
function Af(e2, t2) {
  t2 && (e2.firstTimestamp = e2.firstTimestamp === void 0 ? t2 : Math.min(e2.firstTimestamp, t2), e2.lastTimestamp = e2.lastTimestamp === void 0 ? t2 : Math.max(e2.lastTimestamp, t2));
}
function jf(e2, t2) {
  for (let n2 of e2) n2.status === "running" && (n2.status = t2 ? "failed" : "success"), n2.type === "agent_lifecycle" && (jf(n2.events, t2), n2.children.forEach((e3) => jf([e3], t2)));
}
function Mf(e2) {
  let t2 = Kd(e2.event.data);
  return `${e2.conversationId}:${e2.runId}:${Rd(t2)}`;
}
function Nf(e2) {
  let t2 = Mf(e2);
  if (e2.event.type === "thinking_delta") return `${t2}:thinking:${e2.event.data.id ?? e2.event.data.thinkingId}`;
  if (e2.event.type === "content_delta") return `${t2}:content:${e2.event.data.id ?? e2.event.data.contentId}:${e2.event.data.phase ?? ""}`;
}
function Pf(e2) {
  if (e2.event.type === "thinking_completed") return `${Mf(e2)}:thinking:${e2.event.data.id ?? e2.event.data.thinkingId}`;
}
function Ff(e2) {
  let t2 = [...e2].sort((e3, t3) => e3.sequence - t3.sequence), n2 = /* @__PURE__ */ new Map(), r2 = /* @__PURE__ */ new Map(), i2 = /* @__PURE__ */ new Set(), a2 = /* @__PURE__ */ new Set(), o2 = (e3, t3) => {
    let n3 = e3.get(t3);
    return n3 || (n3 = /* @__PURE__ */ new Map(), e3.set(t3, n3)), n3;
  }, s2 = (e3) => {
    if (e3) for (let t3 of e3.values()) for (let e4 of t3.sequences) a2.add(e4);
  }, c2 = (e3) => {
    s2(r2.get(e3)), r2.delete(e3);
  }, l2 = () => {
    for (let e3 of r2.values()) s2(e3);
    for (let e3 of n2.values()) s2(e3);
    r2.clear(), n2.clear();
  }, u2 = (e3) => {
    n2.delete(e3);
  }, d2 = () => {
    n2.clear();
  }, f2 = (e3) => {
    let t3 = n2.get(e3);
    if (!t3) return;
    let i3 = o2(r2, e3);
    for (let [e4, n3] of t3) {
      let t4 = i3.get(e4);
      if (t4) for (let e5 of n3.sequences) t4.sequences.add(e5);
      else i3.set(e4, n3);
    }
    n2.delete(e3);
  };
  for (let e3 of t2) {
    let t3 = e3.event, a3 = Mf(e3), s3 = Nf(e3);
    if (s3 && (t3.type === "thinking_delta" || t3.type === "content_delta")) {
      c2(a3);
      let r3 = o2(n2, a3), i3 = t3.type === "thinking_delta" ? "content_delta" : "thinking_delta";
      for (let [e4, t4] of r3) t4.type === i3 && r3.delete(e4);
      let l3 = r3.get(s3) ?? { sequences: /* @__PURE__ */ new Set(), type: t3.type };
      l3.sequences.add(e3.sequence), r3.set(s3, l3);
      continue;
    }
    if (t3.type === "run_retrying") {
      i2.add(a3), f2(a3);
      continue;
    }
    let p2 = Pf(e3);
    if (p2) {
      let t4 = n2.get(a3)?.get(p2);
      if (t4) {
        t4.sequences.add(e3.sequence);
        continue;
      }
      let i3 = r2.get(a3)?.get(p2);
      if (i3) {
        i3.sequences.add(e3.sequence);
        continue;
      }
    }
    if (t3.type === "run_completed") {
      for (let e4 of [...r2.keys()]) c2(e4);
      d2(), i2.clear();
    } else t3.type === "run_failed" ? (t3.data.code === "network_interrupted" ? l2() : d2(), i2.clear()) : t3.type === "run_cancelled" ? (t3.data.reason === "user" ? d2() : l2(), i2.clear()) : (c2(a3), u2(a3), i2.delete(a3));
  }
  return t2.filter((e3) => !a2.has(e3.sequence));
}
function If(e2, t2) {
  return { conversationId: t2[0]?.conversationId ?? e2, runId: t2[0]?.runId ?? e2, rootEvents: [], eventByKey: /* @__PURE__ */ new Map(), activeRetriesByScope: /* @__PURE__ */ new Map(), agentByPath: /* @__PURE__ */ new Map(), hitlByApprovalId: /* @__PURE__ */ new Map(), pendingTaskReports: /* @__PURE__ */ new Map() };
}
function Lf(e2, t2) {
  let n2 = t2.event, r2 = n2.data, i2 = Kd(r2);
  e2.currentConversationId = t2.conversationId, e2.currentRunId = t2.runId, Af(e2, t2.timestamp);
  let a2 = Rd(i2), o2 = zd(e2, i2);
  switch (Ud(e2, a2, i2, t2.sequence), n2.type) {
    case "agent_lifecycle":
      Hd(e2, i2);
      break;
    case "run_retrying": {
      let n3 = $(i2.retryId) || `sequence-${t2.sequence}`, r3 = Vd(e2, i2);
      bf(e2, r3, o2, `retry:${o2}:${n3}`, `retry-${o2}-${n3}`, i2).timestamp = Yd(t2.timestamp);
      break;
    }
    case "thinking_delta": {
      xf(e2, o2, "success");
      let n3 = $(i2.id) || $(i2.thinkingId) || "main", r3 = Vd(e2, i2), a3 = `${o2}:thinking:${n3}`, s2 = $d(r3, e2.eventByKey, a3, Bd(e2, i2, "thinking", n3));
      s2.durationStartedAt ??= t2.timestamp, s2.content += $(i2.text);
      break;
    }
    case "thinking_completed":
      Df(e2, $(i2.id) || $(i2.thinkingId), o2, i2, t2.timestamp);
      break;
    case "content_delta": {
      xf(e2, o2, "success");
      let t3 = $(i2.id) || $(i2.contentId) || `content-${e2.eventByKey.size}`;
      if (i2.phase === "synthesis" && a2 === "/root") {
        wf(e2, $(i2.text));
        break;
      }
      let n3 = Vd(e2, i2), r3 = `${o2}:content:${t3}:${$(i2.phase)}`, s2 = ef(n3, e2.eventByKey, r3, Bd(e2, i2, "content", t3), a2 !== "/root");
      s2.content += $(i2.text);
      break;
    }
    case "tool_started":
      xf(e2, o2, "success"), Of(e2, { ...i2, args: i2.input, agentPath: a2 });
      break;
    case "tool_finished":
      kf(e2, { ...i2, result: i2.output, et: i2.durationMs, agentPath: a2 });
      break;
    case "approval_requested": {
      let n3 = $(i2.approvalId) || $(i2.interruptsId) || `sequence-${t2.sequence}`, r3 = _f(e2, Vd(e2, i2), o2, n3, i2);
      r3.timestamp = Yd(t2.timestamp);
      break;
    }
    case "approval_resolved":
      vf(e2, i2, t2.timestamp);
      break;
    case "run_completed":
      xf(e2, `${e2.conversationId}:${e2.runId}:/root`, "success"), $(i2.finalAnswer) && Ef(e2, $(i2.finalAnswer)), e2.endStatus = "completed";
      break;
    case "run_failed": {
      xf(e2, o2, "failed");
      let t3 = i2;
      if (Nd(t3)) {
        e2.endStatus = "cancelled";
        break;
      }
      e2.endStatus = "failed";
      let n3 = Pd(t3);
      e2.errorData = typeof t3.code == "string" ? t3 : { ...n3.code ? { code: n3.code } : {}, message: $(t3.message), retryable: n3.retryable, ...n3.requestId ? { requestId: n3.requestId } : {} }, e2.errorMessage = n3.message;
      break;
    }
    case "run_cancelled":
      xf(e2, o2, "success"), e2.endStatus = "cancelled";
      break;
    case "script_output":
      Sf(e2, i2);
      break;
    case "artifact_created":
      Cf(e2, { ...i2, op: i2.operation });
      break;
    case "context_compacted": {
      let n3 = Gd(i2.compactedCount) ?? 0, r3 = i2.status !== "started", a3 = Vd(e2, i2), s2 = a3.find((e3) => e3.type === "context_compacted" && e3.status === "running");
      if (s2?.type === "context_compacted") {
        s2.title = r3 ? $t("\u4E0A\u4E0B\u6587\u5DF2\u81EA\u52A8\u538B\u7F29") : $t("\u6B63\u5728\u81EA\u52A8\u538B\u7F29\u4E0A\u4E0B\u6587"), s2.status = r3 ? "success" : "running", s2.compactedCount = n3, s2.summary = $(i2.summary) || void 0, s2.timestamp = Yd(t2.timestamp);
        break;
      }
      let c2 = { id: `context-compacted-${o2}-${t2.sequence}`, type: "context_compacted", title: r3 ? $t("\u4E0A\u4E0B\u6587\u5DF2\u81EA\u52A8\u538B\u7F29") : $t("\u6B63\u5728\u81EA\u52A8\u538B\u7F29\u4E0A\u4E0B\u6587"), compactedCount: n3, summary: $(i2.summary) || void 0, status: r3 ? "success" : "running", timestamp: Yd(t2.timestamp) };
      a3.push(c2);
      break;
    }
  }
}
function Rf(e2, t2, n2) {
  let r2 = /* @__PURE__ */ new Set();
  for (let i2 = 0; i2 < e2.length; i2++) {
    let a2 = e2[i2], o2 = i2, s2 = t2[o2];
    (!s2 || s2.id !== a2.id || s2.type !== a2.type || r2.has(o2)) && (o2 = t2.findIndex((e3, t3) => !r2.has(t3) && e3.id === a2.id && e3.type === a2.type), s2 = o2 >= 0 ? t2[o2] : void 0), s2 && (r2.add(o2), n2.set(je(a2), s2), a2.type === "agent_lifecycle" && s2.type === "agent_lifecycle" && (Rf(a2.events, s2.events, n2), Rf(a2.children, s2.children, n2)));
  }
}
function zf(e2, t2) {
  let n2 = /* @__PURE__ */ new Map();
  Rf(e2.rootEvents, t2.events, n2);
  let r2 = (e3) => n2.get(je(e3)) ?? e3;
  for (let [t3, n3] of e2.eventByKey) e2.eventByKey.set(t3, r2(n3));
  for (let [t3, n3] of e2.activeRetriesByScope) e2.activeRetriesByScope.set(t3, r2(n3));
  for (let [t3, n3] of e2.agentByPath) e2.agentByPath.set(t3, r2(n3));
  for (let [t3, n3] of e2.hitlByApprovalId) e2.hitlByApprovalId.set(t3, r2(n3));
  e2.finalAnswer &&= r2(e2.finalAnswer), e2.rootEvents = t2.events;
}
function Bf(e2, t2) {
  let n2;
  for (let e3 of t2) n2 = n2 === void 0 ? e3.sequence : Math.max(n2, e3.sequence);
  return { context: e2, eventCount: t2.length, lastEvent: t2.at(-1), lastSequence: n2, replayUnsafe: t2.some((e3) => e3.event.type === "run_retrying") };
}
function Vf(e2, t2, n2, r2, i2) {
  let a2 = n2.context;
  !a2.finalAnswer?.content.trim() && a2.errorMessage && wf(a2, a2.errorMessage);
  let o2 = a2.endStatus === "failed", s2 = a2.endStatus === "completed", c2 = a2.endStatus !== void 0;
  r2.finalize !== !1 && s2 && Tf(a2), r2.finalize !== !1 && c2 && jf(a2.rootEvents, o2), a2.rootEvents = Wd(a2.rootEvents).events;
  let l2 = a2.finalAnswer?.content || "", u2 = a2.firstTimestamp, d2 = i2?.durationStartedAt, f2 = u2 === void 0 ? d2 : d2 === void 0 ? u2 : Math.min(u2, d2), p2 = f2 !== void 0 && a2.lastTimestamp !== void 0 ? Math.max(0, a2.lastTimestamp - f2) : void 0, m2 = c2 ? Yd(a2.lastTimestamp) : "", h2 = i2 ?? { id: `history-process-${e2}`, events: a2.rootEvents };
  return h2.id = `history-process-${e2}`, h2.revision = t2.at(-1)?.sequence ?? n2.lastSequence ?? 0, h2.completed = s2, h2.durationLabel = p2 === void 0 ? void 0 : Xd(p2), h2.durationState = c2 ? void 0 : "thinking", h2.durationStartedAt = f2, h2.durationEndedAt = c2 ? a2.lastTimestamp : void 0, h2.collapsed = s2, h2.events = a2.rootEvents, { content: l2, completedAt: m2, process: h2, status: o2 ? "error" : c2 ? "done" : "streaming", errorData: a2.errorData, checkpoint: n2 };
}
function Hf(e2) {
  return e2.event.type === "run_retrying" ? !0 : e2.event.type === "run_failed" ? e2.event.data.code === "network_interrupted" : e2.event.type === "run_cancelled" && e2.event.data.reason !== "user";
}
function Uf(e2, t2, n2, r2, i2 = { finalize: !1 }) {
  if (r2.replayUnsafe || n2.length <= r2.eventCount || r2.eventCount > 0 && n2[r2.eventCount - 1] !== r2.lastEvent) return;
  let a2 = n2.slice(r2.eventCount);
  if (a2.some(Hf)) return;
  let o2 = r2.lastSequence;
  for (let e3 of a2) {
    if (o2 !== void 0 && e3.sequence <= o2) return;
    o2 = e3.sequence;
  }
  zf(r2.context, t2);
  for (let e3 of a2) Lf(r2.context, e3);
  return r2.eventCount = n2.length, r2.lastEvent = n2.at(-1), r2.lastSequence = o2, Vf(e2, n2, r2, i2, t2);
}
function Wf(e2, t2, n2 = {}) {
  let r2 = If(e2, t2);
  for (let e3 of Ff(t2)) Lf(r2, e3);
  return Vf(e2, t2, Bf(r2, t2), n2);
}
function Gf(e2, t2, n2) {
  let r2 = t2.id || `${e2}-assistant-${n2}`, i2 = t2.content ?? "", a2 = t2.events ?? [];
  if (a2.length > 0) {
    let n3 = Wf(r2, a2, { finalize: !0 });
    return { id: r2, conversationId: e2, runId: a2[0]?.runId ?? `history-run-${r2}`, role: "assistant", author: "OpenBrowser AI Agent", content: n3.content, createdAt: n3.completedAt || Yd(t2.createdAt), status: n3.status, process: n3.process, errorData: n3.errorData };
  }
  return { id: r2, conversationId: e2, runId: `history-run-${r2}`, role: "assistant", author: "OpenBrowser AI Agent", content: i2, createdAt: Yd(t2.createdAt), status: "done" };
}
function Kf(e2) {
  let t2 = e2.metadata?.attachments;
  if (Array.isArray(t2) && t2.length !== 0) return t2.map((e3) => ({ fileId: e3.fileId, kind: "file", fileName: e3.fileName, mimeType: e3.mimeType, size: e3.size, url: e3.url, localUrl: e3.localUrl, remoteUrl: e3.remoteUrl, fileUrl: e3.fileUrl, uploadStatus: "uploaded" }));
}
function qf(e2) {
  return { id: e2.id, title: e2.title?.trim() || "New conversation", updatedAt: Yd(e2.updatedAt || e2.createdAt), latestRunId: e2.latestRunId, latestRunStatus: e2.latestRunStatus, runningRunIds: [], unread: e2.unread };
}
function Jf(e2) {
  let t2 = e2.conversation.id;
  return (e2.messages ?? []).filter((e3) => e3.role !== "system").map((e3, n2) => e3.role === "assistant" ? Gf(t2, e3, n2) : { id: e3.id || `${t2}-user-${n2}`, conversationId: t2, role: "user", author: "You", content: e3.content ?? "", attachments: Kf(e3), createdAt: Yd(e3.createdAt), status: "done" });
}
var Yf = class {
  checkpoint;
  reset(e2, t2) {
    this.checkpoint = t2 ?? Wf("incremental-process", e2, { finalize: !1 }).checkpoint;
  }
  update(e2, t2, n2) {
    let r2 = typeof e2 != "string", i2 = r2 ? "incremental-process" : e2, a2 = r2 ? e2 : t2, o2 = r2 ? t2 : n2;
    if (!o2 || !this.checkpoint) return !1;
    let s2 = Uf(i2, a2, o2, this.checkpoint, { finalize: !1 });
    return s2 ? (this.checkpoint = s2.checkpoint, r2 ? !0 : s2) : !1;
  }
};
function Xf(e2) {
  return e2 === "running" ? "base/rx_ic_wifi2" : "base/rx_ic_wifi";
}
function Zf(e2) {
  for (let t2 of e2) (t2.status === "running" || t2.status === "pending") && (t2.status = "failed"), t2.type === "agent_lifecycle" && ((t2.lifecycleStatus === "starting" || t2.lifecycleStatus === "running") && (t2.lifecycleStatus = "cancelled"), Zf(t2.events), Zf(t2.children));
}
var Qf = /* @__PURE__ */ new Map();
var $f = /* @__PURE__ */ new Map();
function ep(e2) {
  return !(!e2 || typeof e2 != "object" || Array.isArray(e2));
}
function tp(e2) {
  if (e2.event.type === "tool_started" && e2.event.data.toolName === "roxy_script_run") {
    let t2 = ep(e2.event.data.input) ? e2.event.data.input : {};
    return [e2.event.data.target, t2.scriptPath].find(E);
  }
  if (e2.event.type === "script_output" && E(e2.event.data.scriptName)) return e2.event.data.scriptName;
}
function np(e2, t2) {
  return `${String(t2.workspaceId ?? "")}\0${t2.locale ?? ""}\0${e2}`;
}
async function rp(e2, t2) {
  let n2 = np(e2, t2), r2 = Qf.get(n2);
  if (r2) return r2;
  let i2 = $f.get(n2);
  if (i2) return i2;
  let a2 = sd(e2, t2).then((e3) => (e3 && Qf.set(n2, e3), e3)).catch((t3) => {
    console.warn(`[agent-console] Failed to resolve script template ${e2}:`, t3);
  }).finally(() => {
    $f.delete(n2);
  });
  return $f.set(n2, a2), a2;
}
function ip(e2, t2, n2) {
  return e2.event.type === "tool_started" ? { ...e2, event: { ...e2.event, data: { ...e2.event.data, target: n2 } } } : e2.event.type === "script_output" && e2.event.data.scriptName === t2 ? { ...e2, event: { ...e2.event, data: { ...e2.event.data, scriptName: n2 } } } : e2;
}
async function ap(e2, t2) {
  let n2 = [...new Set(e2.map(tp).filter(E))];
  if (n2.length === 0) return [...e2];
  let r2 = new Map(await Promise.all(n2.map(async (e3) => [e3, await rp(e3, t2)])));
  return e2.map((e3) => {
    let t3 = tp(e3);
    if (!t3) return e3;
    let n3 = r2.get(t3);
    return n3 ? ip(e3, t3, n3) : e3;
  });
}
function op(e2) {
  let { data: t2 } = e2.event, n2 = "agentPath" in t2 && typeof t2.agentPath == "string" ? t2.agentPath : void 0, r2 = "workerId" in t2 && typeof t2.workerId == "string" ? t2.workerId : void 0;
  return n2 || r2 || "/root";
}
function sp(e2) {
  return JSON.stringify([e2.conversationId, op(e2)]);
}
function cp(e2) {
  return e2.event.type === "content_delta" || e2.event.type === "thinking_delta";
}
function lp(e2) {
  return { schedule(t2, n2) {
    if (e2.requestIdleCallback && e2.cancelIdleCallback) {
      let r3 = e2.requestIdleCallback(t2, { timeout: n2 });
      return () => e2.cancelIdleCallback?.(r3);
    }
    let r2 = e2.setTimeout(t2, n2);
    return () => e2.clearTimeout(r2);
  } };
}
var up = class {
  options;
  entries = /* @__PURE__ */ new Map();
  inFlightByRunId = /* @__PURE__ */ new Map();
  constructor(e2) {
    this.options = e2;
  }
  enqueue(e2) {
    if (!cp(e2)) return !1;
    let t2 = sp(e2), n2 = this.entries.get(t2);
    if (n2?.runId === e2.runId) return n2.items.push(e2), !0;
    n2 && this.flushEntry(t2, n2).catch(this.options.onError);
    let r2 = { cancelTimer: () => {
    }, conversationId: e2.conversationId, items: [e2], runId: e2.runId };
    return r2.cancelTimer = this.options.scheduler.schedule(() => {
      this.flushEntry(t2, r2).catch(this.options.onError);
    }, this.options.ttlMs), this.entries.set(t2, r2), !0;
  }
  async flushRun(e2) {
    let t2 = [];
    for (let [n3, r2] of this.entries) r2.runId === e2 && t2.push(this.flushEntry(n3, r2));
    let n2 = this.inFlightByRunId.get(e2);
    n2 && t2.push(...n2), await Promise.all(t2);
  }
  discardRun(e2) {
    for (let [t2, n2] of this.entries) n2.runId === e2 && (n2.cancelTimer(), this.entries.delete(t2));
  }
  removeConversation(e2) {
    for (let [t2, n2] of this.entries) n2.conversationId === e2 && (n2.cancelTimer(), this.entries.delete(t2));
  }
  flushEntry(e2, t2) {
    if (this.entries.get(e2) !== t2) return Promise.resolve();
    t2.cancelTimer(), this.entries.delete(e2);
    let n2 = [...t2.items].sort((e3, t3) => e3.sequence - t3.sequence), r2;
    try {
      r2 = this.options.onFlush(n2);
    } catch (e3) {
      r2 = Promise.reject(e3);
    }
    let i2 = Promise.resolve(r2), a2 = this.inFlightByRunId.get(t2.runId) ?? /* @__PURE__ */ new Set();
    return a2.add(i2), this.inFlightByRunId.set(t2.runId, a2), i2.finally(() => {
      a2.delete(i2), a2.size === 0 && this.inFlightByRunId.delete(t2.runId);
    }).catch(() => {
    }), i2;
  }
};
function dp(e2) {
  return e2.flatMap((e3) => e3.localPath ? [{ kind: e3.kind, fileName: e3.fileName, mimeType: e3.mimeType, localPath: e3.localPath }] : []);
}
function fp(e2, t2) {
  let { localFile: n2, localFiles: r2, localPath: i2, ...a2 } = e2;
  return { ...a2, ...t2, kind: e2.kind, ...e2.preview ? { preview: e2.preview } : {}, uploadStatus: "uploaded" };
}
function pp(e2, t2) {
  let n2 = [...t2];
  return e2.map((e3) => {
    let t3 = n2.findIndex((t4) => t4.fileId === e3.fileId);
    if (t3 < 0 && e3.kind === "file" && e3.localPath && (t3 = n2.findIndex((t4) => t4.kind === "file" && t4.fileName === e3.fileName)), t3 < 0) return e3;
    let [r2] = n2.splice(t3, 1);
    return r2 ? fp(e3, r2) : e3;
  });
}
var mp = "prefill";
var hp = "batch-create-profiles";
var gp = hp;
var _p = `/agent-console?${mp}=${gp}`;
function vp(e2) {
  return (Array.isArray(e2) ? e2[0] : e2) === gp;
}
function yp(e2, t2) {
  let n2 = e2.find((e3) => e3.slug === hp);
  return $n(n2, t2).trim();
}
var bp = "agent-console:batch-create-guide-shown:";
var xp = "agent-console:batch-create-guide-requested";
var Sp = !1;
var Cp = !1;
function wp() {
  if (typeof window < "u") try {
    return window.localStorage;
  } catch {
    return;
  }
}
function Tp(e2) {
  return e2 == null || e2 === "" ? "" : `${bp}${encodeURIComponent(String(e2))}`;
}
function Ep(e2, t2 = wp()) {
  let n2 = Tp(e2);
  if (!n2 || !t2) return !1;
  try {
    return t2.getItem(n2) === "1";
  } catch {
    return !1;
  }
}
function Dp(e2, t2 = wp()) {
  let n2 = Tp(e2);
  if (n2 && t2) try {
    t2.setItem(n2, "1");
  } catch {
  }
}
function Op(e2 = !1) {
  Sp = !0, Cp ||= e2, typeof window < "u" && window.dispatchEvent(new Event(xp));
}
function kp() {
  return Sp;
}
function Ap() {
  return Cp;
}
function jp() {
  Sp = !1, Cp = !1;
}
var Mp = "prefill";
var Np = "create-automation";
var Pp = "windowIds";
function Fp(e2) {
  return Array.isArray(e2) ? e2[0] : e2;
}
function Ip(e2) {
  let t2 = Array.from(new Set(e2.filter(Boolean)));
  return `/agent-console?${new URLSearchParams({ [Mp]: Np, [Pp]: t2.join(",") })}`;
}
function Lp(e2) {
  return Fp(e2) === Np;
}
function Rp(e2) {
  let t2 = Fp(e2);
  return typeof t2 == "string" ? Array.from(new Set(t2.split(",").map((e3) => e3.trim()).filter(Boolean))) : [];
}
function zp(e2, t2) {
  return t2(Oe(Array.from(new Set(e2.filter(Boolean)))));
}
async function Bp(e2, t2, n2) {
  let r2 = Array.from(new Set(e2.filter(Boolean)));
  return await t2(r2), zp(r2, n2);
}
var Vp = "agent-console:create-automation-guide-shown:";
var Hp = "agent-console:create-automation-guide-requested";
var Up = !1;
function Wp() {
  if (typeof window < "u") try {
    return window.localStorage;
  } catch {
    return;
  }
}
function Gp(e2) {
  return e2 == null || e2 === "" ? "" : `${Vp}${encodeURIComponent(String(e2))}`;
}
function Kp(e2, t2 = Wp()) {
  let n2 = Gp(e2);
  if (!n2 || !t2) return !1;
  try {
    return t2.getItem(n2) === "1";
  } catch {
    return !1;
  }
}
function qp(e2, t2 = Wp()) {
  let n2 = Gp(e2);
  if (n2 && t2) try {
    t2.setItem(n2, "1");
  } catch {
  }
}
function Jp() {
  Up = !0, typeof window < "u" && window.dispatchEvent(new Event(Hp));
}
function Yp() {
  return Up;
}
function Xp() {
  Up = !1;
}
var Zp = Ye({ groups: [] });
var Qp = /* @__PURE__ */ new Map();
var $p = !1;
function em(e2) {
  return e2 && e2.charAt(0).toUpperCase() + e2.slice(1);
}
function tm(e2) {
  let t2 = e2.stage === "end" && e2.success ? "success" : "running", n2 = Fu(e2.toolName, t2, e2.input);
  return e2.stage === "error" && e2.errorMessage ? `${n2}\uFF1A${e2.errorMessage}` : n2;
}
function nm(e2) {
  let t2 = { id: e2.id, stage: e2.stage, toolName: e2.toolName, input: e2.input, result: e2.result, success: e2.success, errorMessage: e2.errorMessage, durationMs: e2.durationMs, timestamp: e2.timestamp, workerId: e2.workerId, conversationId: e2.conversationId };
  return t2.summary = tm(t2), t2;
}
function rm(e2, t2) {
  let n2 = t2.events.map(nm), r2 = n2.at(-1);
  return { id: t2.id, conversationId: e2.conversationId ?? e2.id, runId: e2.runId, name: t2.windowName || t2.label || t2.dirId || t2.id, subtitle: r2?.summary ?? t2.dirId ?? t2.ws ?? "Browser session", status: "running", dirId: t2.dirId, ws: t2.ws, browserType: t2.browserType, windowName: t2.windowName, windowSortNum: t2.windowSortNum, platformUrl: t2.platformUrl, platformUserName: t2.platformUserName, platformIcon: t2.platformIcon, countryCode: t2.countryCode, events: n2 };
}
function im(e2) {
  return e2.data.tasks.map((e3) => {
    let t2 = e3.browsers.map((t3) => rm(e3, t3)), n2 = e3.browsers.reduce((e4, t3) => Math.max(e4, t3.updatedAt), e3.updatedAt), r2 = Qp.get(e3.id) ?? (t2.length > 0 && Qp.size === 0);
    return Qp.set(e3.id, r2), { id: e3.id, conversationId: e3.conversationId ?? e3.id, runId: e3.runId, title: e3.title, description: `${em(e3.sourceType)} task`, expanded: r2, sourceType: e3.sourceType, browserCount: t2.length, lastActivityAt: n2, tasks: t2, kind: "running" };
  });
}
function am(e2) {
  let t2 = e2.events.map(nm), n2 = t2.at(-1);
  return { id: e2.dirId, conversationId: e2.owner?.conversationId ?? e2.dirId, runId: e2.owner?.runId, name: e2.windowName || e2.platformUserName || e2.dirId, subtitle: n2?.summary ?? e2.dirId ?? e2.endpoint ?? "Browser session", status: e2.status, dirId: e2.dirId, ws: e2.endpoint, browserType: e2.browserType, windowName: e2.windowName, windowSortNum: e2.windowSortNum, platformUrl: e2.platformUrl, platformUserName: e2.platformUserName, platformIcon: e2.platformIcon, countryCode: e2.countryCode, events: t2 };
}
function om(e2) {
  let t2 = /* @__PURE__ */ new Map(), n2 = [];
  for (let r3 of e2.data.profiles) {
    let e3 = am(r3);
    if (r3.status === "idle" || !r3.owner) {
      n2.push(e3);
      continue;
    }
    let i2 = r3.owner, a2 = t2.get(i2.taskId);
    if (!a2) {
      let e4 = Qp.get(i2.taskId) ?? !0;
      Qp.set(i2.taskId, e4), a2 = { id: i2.taskId, conversationId: i2.conversationId ?? i2.taskId, runId: i2.runId, title: i2.title, description: `${em(i2.sourceType)} task`, expanded: e4, sourceType: i2.sourceType, browserCount: 0, lastActivityAt: r3.updatedAt, tasks: [], kind: "running" }, t2.set(i2.taskId, a2);
    }
    a2.tasks.push(e3), a2.browserCount = a2.tasks.length, a2.lastActivityAt = Math.max(a2.lastActivityAt ?? 0, r3.updatedAt);
  }
  let r2 = [...t2.values()].sort((e3, t3) => (t3.lastActivityAt ?? 0) - (e3.lastActivityAt ?? 0));
  if (n2.length > 0) {
    let t3 = "profile-monitor-idle", i2 = Qp.get(t3) ?? !1;
    Qp.set(t3, i2), r2.push({ id: t3, conversationId: t3, title: "", description: "", expanded: i2, browserCount: n2.length, lastActivityAt: Math.max(...e2.data.profiles.filter((e3) => e3.status === "idle").map((e3) => e3.updatedAt)), tasks: n2.sort((e3, t4) => e3.name.localeCompare(t4.name)), kind: "idle" });
  }
  return r2;
}
function sm(e2) {
  let t2 = im(e2), n2 = new Set(t2.map((e3) => e3.id));
  for (let e3 of Array.from(Qp.keys())) n2.has(e3) || Qp.delete(e3);
  Zp.groups = t2, Zp.lastUpdatedAt = e2.data.generatedAt;
}
function cm(e2) {
  $p = !0, Zp.groups = om(e2), Zp.lastUpdatedAt = e2.data.generatedAt;
}
function lm() {
  let e2 = Jn(), t2 = F(() => Zp.groups), n2 = F(() => Zp.groups.reduce((e3, t3) => e3 + t3.tasks.filter((e4) => e4.status === "running").length, 0)), r2 = F(() => Zp.groups.reduce((e3, t3) => e3 + t3.tasks.length, 0));
  K(e2.profileMonitorSnapshot, (e3) => {
    $p = !!e3, e3 && cm(e3);
  }, { immediate: !0 }), K(e2.taskMonitorSnapshot, (e3) => {
    e3 && !$p && sm(e3);
  }, { immediate: !0 });
  function i2(e3) {
    let t3 = !(Qp.get(e3) ?? !1);
    Qp.set(e3, t3), Zp.groups = Zp.groups.map((n3) => n3.id === e3 ? { ...n3, expanded: t3 } : n3);
  }
  return { connected: e2.connected, lastError: e2.lastError, lastUpdatedAt: F(() => Zp.lastUpdatedAt), runningTaskCount: n2, profileCount: r2, taskGroupList: t2, toggleTaskGroup: i2 };
}
var um;
var dm = N("");
var fm = N([]);
var pm = N([]);
var mm = N([]);
var hm;
var gm = 10;
var _m = 5;
var vm = 50;
var ym = 50;
var bm = /* @__PURE__ */ new Set();
var xm = /* @__PURE__ */ new Set();
var Sm = /* @__PURE__ */ new Map();
var Cm;
var wm;
var Tm = [];
var Em = N(!0);
var Dm = N(!1);
var Om = !1;
var km = Ye({});
var Am = /* @__PURE__ */ new Map();
var jm = 2e4;
var Mm = new Ql();
var Nm = /* @__PURE__ */ new Map();
var Pm = /* @__PURE__ */ new Map();
var Fm = new Zl();
var Im = N(0);
function Lm() {
  return um ||= Ye(Rm()), um;
}
function Rm() {
  return { conversationIds: [], conversationsById: {}, draftsByConversationId: {}, queuedPromptsByConversationId: {}, messagesByConversationId: {}, runsById: {}, streamsByRunId: {}, todoProgressByRunId: {}, taskGroupsByConversationId: {}, pendingHitlByConversationId: {} };
}
function zm(e2) {
  return Array.isArray(e2) ? e2[0] : typeof e2 == "string" ? e2 : void 0;
}
function Bm(e2) {
  let t2 = e2?.trim();
  return t2 ? t2.length > 42 ? `${t2.slice(0, 42)}...` : t2 : "New conversation";
}
function Vm() {
  return Yd(Date.now());
}
function Hm(e2, t2 = "New conversation", n2, r2 = !0) {
  let i2 = n2 ?? `conv-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, a2 = { id: i2, title: t2, updatedAt: Vm(), runningRunIds: [], unread: !1 };
  return e2.conversationIds.unshift(i2), e2.conversationsById[i2] = a2, e2.draftsByConversationId[i2] = { conversationId: i2, prompt: "", attachments: [] }, e2.queuedPromptsByConversationId[i2] = [], r2 && (e2.messagesByConversationId[i2] = []), e2.taskGroupsByConversationId[i2] = [], a2;
}
function Um(e2, t2) {
  if (t2) return e2.conversationsById[t2] ?? Hm(e2, "Loading conversation...", t2, !1);
}
function Wm(e2, t2, n2, r2, i2 = {}) {
  let a2 = e2.runsById[t2], o2 = e2.streamsByRunId[t2];
  if (a2 && (a2.status = n2, a2.error = r2, (n2 === "completed" || n2 === "failed" || n2 === "cancelled") && (a2.completedAt = Vm())), o2 && (o2.status = n2, o2.error = r2), a2 && (n2 === "completed" || n2 === "failed" || n2 === "cancelled")) {
    let r3 = e2.conversationsById[a2.conversationId];
    r3 && (r3.latestRunStatus = n2, r3.runningRunIds = r3.runningRunIds.filter((e3) => e3 !== t2), r3.runningRunIds.length === 0 && $m(e2, a2.conversationId), i2.markUnread && (r3.unread = !0)), delete e2.todoProgressByRunId[t2], delete e2.pendingHitlByConversationId[a2.conversationId];
  }
}
function Gm(e2) {
  return e2 === "queued" || e2 === "streaming";
}
function Km(e2) {
  return e2 === "completed" || e2 === "failed" || e2 === "cancelled";
}
function qm(e2, t2) {
  let n2 = e2.conversationsById[t2];
  return n2 ? n2.runningRunIds.some((t3) => {
    let n3 = e2.runsById[t3];
    return !n3 || Gm(n3.status);
  }) : !1;
}
var Jm = 3;
var Ym = /* @__PURE__ */ new Map();
function Xm(e2, t2) {
  let n2 = e2.messagesByConversationId[t2]?.some((e3) => e3.role === "assistant" && (e3.status === "thinking" || e3.status === "streaming")) ?? !1;
  return zl({ hasActiveRun: qm(e2, t2), hasPendingRun: Mm.has(t2), hasPreparingRun: Pm.has(t2), hasRunningMessage: n2, hasStoppedPendingRun: Fm.hasPending(t2) });
}
function Zm(e2) {
  Ym.delete(e2);
}
function Qm(e2, t2) {
  Xm(e2, t2) ? Zm(t2) : (delete e2.messagesByConversationId[t2], delete km[t2]);
}
function $m(e2, t2) {
  if (Xm(e2, t2)) Zm(t2);
  else for (Ym.delete(t2), Ym.set(t2, !0); Ym.size > Jm; ) {
    let t3 = Ym.keys().next().value;
    if (t3 === void 0) break;
    Ym.delete(t3), Qm(e2, t3);
  }
}
function eh(e2) {
  return e2.startsWith("conv-");
}
function th(e2, t2) {
  Tm = Tm.filter((e3) => e3 !== t2), rh(e2.draftsByConversationId[t2]?.attachments), e2.conversationIds = e2.conversationIds.filter((e3) => e3 !== t2), delete e2.conversationsById[t2], delete e2.draftsByConversationId[t2], delete e2.queuedPromptsByConversationId[t2], delete e2.messagesByConversationId[t2], delete km[t2], delete e2.taskGroupsByConversationId[t2], delete e2.pendingHitlByConversationId[t2], bm.delete(t2), Ym.delete(t2);
  let n2 = Object.values(e2.runsById).filter((e3) => e3.conversationId === t2).map((e3) => e3.id);
  Fm.removeConversation(t2, n2);
  for (let n3 of Object.keys(e2.runsById)) e2.runsById[n3]?.conversationId === t2 && (delete e2.runsById[n3], delete e2.streamsByRunId[n3], delete e2.todoProgressByRunId[n3]);
}
function nh(e2) {
  return { conversationId: e2, prompt: "", attachments: [] };
}
function rh(e2) {
  for (let t2 of e2 ?? []) t2.preview && URL.revokeObjectURL(t2.preview);
}
function ih(e2, t2) {
  return t2.startsWith("image/") || /\.(?:png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(e2);
}
function ah(e2) {
  return oh(e2.name, e2.type);
}
function oh(e2, t2 = "application/octet-stream") {
  if (t2 && t2 !== "application/octet-stream") return t2;
  let n2 = e2.split(".").pop()?.toLowerCase();
  return n2 ? { avif: "image/avif", bmp: "image/bmp", gif: "image/gif", jpeg: "image/jpeg", jpg: "image/jpeg", png: "image/png", svg: "image/svg+xml", webp: "image/webp" }[n2] ?? "application/octet-stream" : "application/octet-stream";
}
function sh(e2) {
  return globalThis.__attachmentPreviewPath(e2);
}
function ch(e2) {
  let t2 = ah(e2), n2 = ih(e2.name, t2);
  return { fileId: `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, kind: "file", fileName: e2.name, mimeType: t2, size: e2.size, preview: n2 ? URL.createObjectURL(e2) : void 0, localFile: e2, uploadStatus: "uploading" };
}
function lh(e2) {
  let t2 = e2.files ?? [];
  return { fileId: `local-folder-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, kind: "folder", fileName: e2.name, mimeType: "inode/directory", size: t2.reduce((e3, t3) => e3 + t3.size, 0), localFiles: t2.length > 0 ? t2 : void 0, localPath: e2.path, uploadStatus: e2.path ? "uploaded" : "uploading" };
}
function uh(e2) {
  let t2 = e2.kind === "folder" ? "inode/directory" : oh(e2.name), n2 = e2.kind === "file" && ih(e2.name, t2);
  return { fileId: `local-path-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, kind: e2.kind, fileName: e2.name, mimeType: t2, localPath: e2.path, preview: n2 ? sh(e2.path) : void 0, uploadStatus: "uploaded" };
}
function dh(e2) {
  return e2 === "in_progress" || e2 === "completed" ? e2 : "pending";
}
function fh(e2) {
  if (Array.isArray(e2)) return e2;
  if (e2 && typeof e2 == "object") {
    let t2 = e2.todos;
    if (Array.isArray(t2)) return t2;
  }
  return [];
}
function ph(e2, t2, n2) {
  let r2 = fh(n2).map((e3, t3) => {
    let n3 = e3 && typeof e3 == "object" ? e3 : {}, r3 = typeof n3.content == "string" ? n3.content : typeof n3.title == "string" ? n3.title : typeof n3.text == "string" ? n3.text : "";
    return { id: typeof n3.id == "string" ? n3.id : `todo-${t3}`, content: r3, status: dh(n3.status) };
  }).filter((e3) => e3.content.trim());
  if (!r2.length) return;
  let i2 = r2.findIndex((e3) => e3.status === "in_progress"), a2 = r2.findIndex((e3) => e3.status === "pending"), o2 = r2.filter((e3) => e3.status === "completed").length, s2 = i2 >= 0 ? i2 : a2 >= 0 ? a2 : Math.max(0, o2 - 1);
  return { id: `todo-progress-${t2}`, conversationId: e2, runId: t2, current: Math.min(s2 + 1, r2.length), total: r2.length, content: r2[s2]?.content, todos: r2 };
}
function mh() {
  let e2 = Lm(), t2 = x(), n2 = Ee(), r2 = ve(), i2 = Se(), { fullAccess: a2 } = ar(), [o2, s2] = Ct(), c2 = Jn(), l2 = lm(), u2 = jt(), d2 = kt();
  ce("agent-console:useAgentConsole:start");
  let f2 = /* @__PURE__ */ new Map(), p2 = /* @__PURE__ */ new Map(), m2 = /* @__PURE__ */ new Map(), h2 = /* @__PURE__ */ new Map(), g2 = /* @__PURE__ */ new Set(), _2;
  ze(() => {
    _2 !== void 0 && window.clearTimeout(_2), f2.clear(), h2.clear();
  });
  let v2 = 0, y2 = 0;
  async function b2() {
    let e3 = ++v2;
    dm.value = "", rh(fm.value), fm.value = [];
    try {
      let n3 = await t2.templates.listOfficialTemplates({ limit: 20, search: hp, templateType: "prompt" }), r3 = yp(Or(n3, $t("\u52A0\u8F7D\u5B98\u65B9\u6A21\u677F\u5931\u8D25")), i2.currentLocale);
      if (!r3) throw Error($t("\u672A\u627E\u5230\u6279\u91CF\u521B\u5EFA\u7A97\u53E3\u6A21\u677F"));
      e3 === v2 && u2.name === "agent-console-chat" && (dm.value = r3);
    } catch (t3) {
      let n3 = yp(Zn()?.templates ?? [], i2.currentLocale);
      e3 === v2 && u2.name === "agent-console-chat" && (n3 ? dm.value = n3 : (console.error("[agent-console] Failed to load the batch profile creation template:", t3), s2(-1, t3 instanceof Error ? t3.message : $t("\u52A0\u8F7D\u5B98\u65B9\u6A21\u677F\u5931\u8D25"))));
    } finally {
      if (e3 === v2 && u2.name === "agent-console-chat") {
        let e4 = { ...u2.query };
        delete e4[mp], d2.replace({ name: "agent-console-chat", query: e4 });
      }
    }
  }
  async function S2() {
    let e3 = ++y2, t3 = Rp(u2.query[Pp]);
    dm.value = "", rh(fm.value), fm.value = [];
    try {
      let n3 = await Bp(t3, async (e4) => {
        let t4 = await or(e4, r2.currentWorkspace?.workspaceName);
        lr(t4.map((e5) => ({ id: e5.id, label: e5.code || e5.name || e5.id })));
      }, (e4) => $t("\u5728 {profile} \u7A97\u53E3\u4E2D\u8FD0\u884C", { profile: e4 }));
      e3 === y2 && u2.name === "agent-console-chat" && (dm.value = n3);
    } catch (t4) {
      e3 === y2 && u2.name === "agent-console-chat" && (console.error("[agent-console] Failed to load windows for automation prefill:", t4), s2(-1, t4 instanceof Error ? t4.message : $t("\u83B7\u53D6\u7A97\u53E3\u4FE1\u606F\u5931\u8D25")));
    } finally {
      if (e3 === y2 && u2.name === "agent-console-chat") {
        let e4 = { ...u2.query };
        delete e4[Mp], delete e4[Pp], d2.replace({ name: "agent-console-chat", query: e4 });
      }
    }
  }
  K(() => [u2.name, u2.query[mp], u2.query[Pp]], ([e3, t3]) => {
    e3 === "agent-console-chat" && (vp(t3) ? (Op(), b2()) : Lp(t3) && (Jp(), S2()));
  }, { immediate: !0 });
  function C2() {
  }
  let w2 = F(() => zm(u2.params.conversationId));
  K(() => [u2.name, w2.value], ([t3, n3]) => {
    t3 === "agent-console-conversation" && (Um(e2, n3), n3 && Pe2(n3));
  }, { immediate: !0 }), K(() => Kn({ taskLogs: c2.taskLogs.value, taskExecutionDetails: c2.taskExecutionDetails.value }), (t3) => {
    for (let n3 of t3) e2.conversationsById[n3] && e2.conversationIds.includes(n3) || M2();
  }, { flush: "post", immediate: !0 }), He(() => {
    ce("agent-console:onMounted"), M2();
  });
  let T2 = F(() => {
    let t3 = w2.value;
    if (t3 && e2.conversationsById[t3]) return t3;
  }), E2 = F(() => {
    let t3 = T2.value;
    return t3 ? e2.conversationsById[t3] : void 0;
  }), ee2 = /* @__PURE__ */ new Set();
  async function te2(e3) {
    let n3 = `${e3.conversationId}:${e3.runId}`;
    if (!ee2.has(n3)) {
      ee2.add(n3);
      try {
        ke2(qf(await t2.markConversationRead(e3.conversationId, e3.runId)));
      } catch (t3) {
        console.error(`[agent-console] Failed to mark conversation ${e3.conversationId} as read:`, t3);
      } finally {
        ee2.delete(n3);
      }
    }
  }
  K(() => Ll(E2.value, T2.value), (e3) => {
    e3 && te2(e3);
  }, { immediate: !0 });
  let D2 = F(() => e2.conversationIds.map((t3) => e2.conversationsById[t3]).filter(Boolean)), ne2 = F(() => {
    let t3 = T2.value;
    return t3 ? e2.messagesByConversationId[t3] ?? [] : pm.value;
  }), O2 = F(() => {
    let e3 = T2.value;
    return e3 ? km[e3]?.hasMore === !0 : !1;
  }), re2 = F(() => {
    let e3 = T2.value;
    return e3 ? km[e3]?.loading === !0 : !1;
  }), ie2 = l2.taskGroupList, ae2 = F(() => {
    let t3 = T2.value;
    return t3 ? e2.pendingHitlByConversationId[t3] : void 0;
  }), oe2 = F(() => Object.keys(e2.pendingHitlByConversationId)), se2 = F(() => {
    let t3 = E2.value;
    if (t3) for (let n3 = t3.runningRunIds.length - 1; n3 >= 0; n3--) {
      let r3 = t3.runningRunIds[n3], i3 = e2.runsById[r3], a3 = e2.todoProgressByRunId[r3];
      if (a3 && (i3?.status === "queued" || i3?.status === "streaming")) return a3;
    }
  }), k2 = F({ get() {
    let t3 = T2.value;
    return t3 ? e2.draftsByConversationId[t3]?.prompt ?? "" : dm.value;
  }, set(t3) {
    let n3 = T2.value;
    n3 ? (e2.draftsByConversationId[n3] ||= nh(n3), e2.draftsByConversationId[n3].prompt = t3) : dm.value = t3;
  } }), A2 = F(() => {
    let t3 = T2.value;
    return t3 ? e2.queuedPromptsByConversationId[t3] ||= [] : mm.value;
  }), le2 = /* @__PURE__ */ new Set();
  function ue2(t3) {
    return t3 ? e2.queuedPromptsByConversationId[t3] ||= [] : mm.value;
  }
  function de2(e3, t3, n3 = {}) {
    let r3 = t3.trim();
    (r3 || n3.attachments?.length) && ue2(e3).push(mr(e3 ?? "home", r3, Date.now(), n3));
  }
  function fe2(e3) {
    rh(pr(A2.value, e3)?.attachments);
  }
  function pe2(e3) {
    hr(A2.value, e3.promptId, e3.targetIndex);
  }
  function me2(t3) {
    let n3 = pr(A2.value, t3);
    if (n3 && (k2.value = n3.draftContent ?? n3.content, n3.attachments?.length)) {
      let t4 = T2.value;
      t4 ? (e2.draftsByConversationId[t4] ||= nh(t4)).attachments.push(...n3.attachments) : fm.value = [...fm.value, ...n3.attachments];
    }
  }
  function he2(t3) {
    return qm(e2, t3) || Mm.has(t3) || Pm.has(t3);
  }
  function ge2(e3) {
    let t3 = e3 ?? "home";
    queueMicrotask(() => {
      _e2(e3, t3);
    });
  }
  async function _e2(e3, t3) {
    if (le2.has(t3) || (e3 ? he2(e3) : hm)) return;
    let n3 = ue2(e3), r3 = n3[0];
    if (r3) {
      le2.add(t3);
      try {
        await ut2({ attachments: r3.attachments ?? [], content: r3.content, conversationId: e3, fromQueue: !0 }) && pr(n3, r3.id);
      } finally {
        le2.delete(t3);
      }
    }
  }
  let ye2 = F(() => {
    let t3 = T2.value;
    return t3 ? (e2.draftsByConversationId[t3] ||= nh(t3), e2.draftsByConversationId[t3].attachments) : fm.value;
  }), be2 = F(() => {
    let t3 = E2.value;
    return t3 ? Im.value >= 0 && Mm.has(t3.id) ? !0 : t3.runningRunIds.some((t4) => {
      let n3 = e2.runsById[t4];
      return n3?.status === "queued" || n3?.status === "streaming";
    }) : pm.value.some((e3) => e3.role === "assistant" && (e3.status === "thinking" || e3.status === "streaming"));
  }), xe2 = F(() => l2.runningTaskCount.value), Ce2 = F(() => l2.profileCount.value);
  function we2(e3) {
    return d2.push({ name: "agent-console-conversation", params: { conversationId: e3 }, query: u2.query });
  }
  function Te2(e3) {
    return we2(e3);
  }
  async function De2() {
    hm = void 0, pm.value = [], mm.value = [], dm.value = "", st2(), await d2.push({ name: "agent-console-chat", query: u2.query });
  }
  function Oe2(e3) {
    l2.toggleTaskGroup(e3);
  }
  function ke2(t3) {
    let n3 = e2.conversationsById[t3.id], r3 = n3?.latestRunId, i3 = r3 ? e2.runsById[r3] : void 0, a3 = !!(r3 && r3 === t3.latestRunId && (Gm(i3?.status) || n3?.runningRunIds.includes(r3))), o3 = Xl(n3, t3, !!(t3.latestRunId && Fm.hasRun(t3.latestRunId)));
    e2.conversationsById[t3.id] = { ...n3, ...t3, ...o3 }, e2.draftsByConversationId[t3.id] ||= nh(t3.id), e2.queuedPromptsByConversationId[t3.id] ||= [], e2.taskGroupsByConversationId[t3.id] ||= [], a3 && t3.latestRunId && Km(o3.latestRunStatus) && (Be2(t3.id, t3.latestRunId, o3.latestRunStatus), N2(t3.id, t3.latestRunId)), Xm(e2, t3.id) && (e2.messagesByConversationId[t3.id] ||= [], Zm(t3.id));
  }
  async function M2() {
    if (Cm) return Cm;
    let n3 = j("agent-console:loadConversationList");
    return Cm = (async () => {
      try {
        let n4 = new Set(Tm), r3 = Math.max(gm, Tm.length), i3 = await t2.conversationList({ limit: r3, offset: 0 }), a3 = [];
        for (let e3 of i3) {
          let t3 = qf(e3);
          a3.push(t3.id), ke2(t3);
        }
        let o3 = T2.value, s3 = e2.conversationIds.filter((t3) => !n4.has(t3) && !a3.includes(t3) && e2.conversationsById[t3] && (t3 === o3 || eh(t3) || qm(e2, t3)));
        Tm = a3, Em.value = i3.length === r3, e2.conversationIds = [...s3, ...Tm], o3 && await Pe2(o3);
      } catch (e3) {
        console.error("[agent-console] Failed to load conversation list:", e3);
      } finally {
        Cm = void 0, n3({ conversationCount: e2.conversationIds.length });
      }
    })(), Cm;
  }
  async function Ae2() {
    return Cm && await Cm, !Em.value || wm || (Dm.value = !0, wm = (async () => {
      try {
        let n3 = await t2.conversationList({ limit: gm, offset: Tm.length }), r3 = [];
        for (let e3 of n3) {
          let t3 = qf(e3);
          r3.push(t3.id), ke2(t3);
        }
        Tm = [...Tm, ...r3.filter((e3) => !Tm.includes(e3))], Em.value = n3.length === gm;
        let i3 = e2.conversationIds.filter((e3) => !Tm.includes(e3));
        e2.conversationIds = [...i3, ...Tm];
      } catch (e3) {
        console.error("[agent-console] Failed to load more conversations:", e3);
      } finally {
        wm = void 0, Dm.value = !1;
      }
    })()), wm;
  }
  function je2(t3) {
    let n3 = e2.conversationsById[t3], r3 = n3?.latestRunStatus === "completed" || n3?.latestRunStatus === "failed" || n3?.latestRunStatus === "cancelled", i3 = Tm.includes(t3) || r3;
    return Rl({ hasMessageCache: Object.hasOwn(e2.messagesByConversationId, t3), isKnownConversation: i3, isRunning: Xm(e2, t3) });
  }
  async function Ne2(e3) {
    let n3 = await Promise.all(e3.messages.map(async (e4) => e4.events?.length ? { ...e4, events: await ap(e4.events, { templates: t2.templates, userTemplates: t2.userTemplates, locale: i2.currentLocale, workspaceId: r2.currentWorkspace?.id }) } : e4));
    return { ...e3, messages: n3 };
  }
  async function Pe2(n3) {
    if (!je2(n3) || bm.has(n3)) return;
    $m(e2, n3);
    let r3 = j("agent-console:loadConversationDetail", { conversationId: n3 });
    bm.add(n3);
    try {
      let r4 = await t2.conversationDetail(n3, { limit: _m });
      if (!je2(n3) || (r4 = await Ne2(r4), !je2(n3))) return;
      let i3 = qf(r4.conversation);
      ke2(i3), e2.conversationIds.includes(i3.id) || e2.conversationIds.unshift(i3.id);
      let a3 = [];
      for (let e3 of r4.messages) {
        if (e3.role !== "assistant" || !e3.events?.length || Fm.hasRun(e3.events[0].runId)) continue;
        let t3 = Ie2(e3.events[0]);
        if (!Jl(t3, e3.events)) continue;
        let n4 = e3.events.map(Yl).findLast(Boolean);
        if (n4) {
          let r5 = e3.events.findLast((e4) => e4.event.type === "run_failed");
          a3.push({ runId: t3.runId, status: n4, error: r5?.event.type === "run_failed" ? r5.event.data.message : void 0 });
        }
      }
      e2.messagesByConversationId[n3] = Jf(r4), km[n3] = { hasMore: r4.hasMore === !0 && r4.nextCursor !== null, loading: !1, nextCursor: r4.nextCursor ?? null };
      for (let t3 of a3) Wm(e2, t3.runId, t3.status, t3.error), ge2(n3);
    } catch (e3) {
      console.error(`[agent-console] Failed to load conversation detail ${n3}:`, e3);
    } finally {
      bm.delete(n3), r3({ loaded: Object.hasOwn(e2.messagesByConversationId, n3) });
    }
  }
  async function Fe2() {
    let n3 = T2.value;
    if (!n3) return;
    let r3 = km[n3];
    if (r3?.hasMore && !r3.loading && r3.nextCursor) {
      r3.loading = !0;
      try {
        let i3 = await Ne2(await t2.conversationDetail(n3, { cursor: r3.nextCursor, limit: _m })), a3 = e2.messagesByConversationId[n3] ?? [], o3 = new Set(a3.map((e3) => e3.id)), s3 = Jf(i3).filter((e3) => !o3.has(e3.id));
        e2.messagesByConversationId[n3] = [...s3, ...a3], r3.hasMore = i3.hasMore === !0 && i3.nextCursor !== null, r3.nextCursor = i3.nextCursor ?? null, $m(e2, n3);
      } catch (e3) {
        console.error(`[agent-console] Failed to load earlier messages for ${n3}:`, e3);
      } finally {
        r3.loading = !1;
      }
    }
  }
  function Ie2(t3) {
    let { conversationId: n3, runId: r3, assistantMessageId: i3 } = t3, a3 = Um(e2, n3);
    e2.conversationIds.includes(n3) || e2.conversationIds.unshift(n3);
    let o3 = t3.event.type === "run_started" ? t3.event.data.startedAt : t3.timestamp, s3 = Yd(o3);
    return e2.runsById[r3] ||= { id: r3, conversationId: n3, status: "streaming", startedAt: s3 }, e2.streamsByRunId[r3] ||= { id: `stream-${r3}`, conversationId: n3, runId: r3, status: "streaming", events: [], lastSequence: 0 }, a3.updatedAt = s3, a3.latestRunId = r3, a3.latestRunStatus = "streaming", a3.runningRunIds.includes(r3) || a3.runningRunIds.push(r3), Zm(n3), e2.messagesByConversationId[n3] ||= [], Le2(n3, r3, i3) || e2.messagesByConversationId[n3].push({ id: i3, conversationId: n3, runId: r3, role: "assistant", author: "OpenBrowser AI Agent", content: "", createdAt: "", status: "streaming", process: { id: `pending-process-${i3}`, revision: 0, completed: !1, durationState: "thinking", durationStartedAt: o3, collapsed: !1, events: [] } }), e2.streamsByRunId[r3];
  }
  function Le2(t3, n3, r3) {
    let i3 = e2.messagesByConversationId[t3];
    if (!i3) return;
    let a3 = (e3) => e3.role === "assistant" && (e3.runId === n3 || !!(r3 && e3.id === r3)), o3 = i3.find(a3);
    if (o3) {
      for (let e3 = i3.length - 1; e3 >= 0; e3--) {
        let t4 = i3[e3];
        t4 !== o3 && a3(t4) && i3.splice(e3, 1);
      }
      return o3;
    }
  }
  function Re2(e3, t3) {
    for (let n3 of e3) (n3.status === "running" || n3.status === "pending") && (n3.status = t3 ? "failed" : "success");
  }
  function Be2(t3, n3, r3) {
    let i3 = Le2(t3, n3);
    if (i3?.process) {
      let e3 = Date.now(), t4 = i3.process.durationStartedAt ?? e3;
      i3.process.durationEndedAt = e3, i3.process.durationLabel ??= H2(r3, Math.max(0, e3 - t4)), i3.process.durationState = void 0, i3.process.completed = r3 === "completed", i3.process.collapsed = r3 === "completed", Re2(i3.process.events, r3 === "failed");
    }
    i3 && (i3.status = r3 === "failed" ? "error" : "done", i3.createdAt ||= Vm()), Wm(e2, n3, r3), ge2(t3);
  }
  function N2(e3, t3) {
    xm.has(t3) || (xm.add(t3), queueMicrotask(() => {
      Pe2(e3).finally(() => xm.delete(t3));
    }));
  }
  function Ve2(t3, n3, r3, i3 = !1) {
    let a3 = e2.streamsByRunId[n3];
    if (!a3) return;
    let o3 = p2.get(n3) ?? a3.events, s3 = Le2(t3, n3, r3), c3 = h2.get(n3), l3 = !i3 && s3?.process ? c3?.update(r3, s3.process, o3) : !1;
    if (l3) return s3.content = l3.content, s3.errorData = l3.errorData, s3.status = l3.status === "error" ? "error" : "streaming", { ...l3, status: s3.status };
    let u3 = Wf(r3, o3, { finalize: i3 }), d3 = c3 ?? new Yf();
    if (d3.reset(o3, u3.checkpoint), h2.set(n3, d3), s3) {
      let e3 = s3.process?.durationStartedAt;
      e3 !== void 0 && (u3.process.durationStartedAt === void 0 || e3 < u3.process.durationStartedAt) && (u3.process.durationStartedAt = e3, u3.process.durationEndedAt !== void 0 && (u3.process.durationLabel = Xd(Math.max(0, u3.process.durationEndedAt - e3)))), s3.content = u3.content, s3.process = u3.process, s3.errorData = u3.errorData, s3.status = i3 ? u3.status : u3.status === "error" ? "error" : "streaming", i3 && (s3.createdAt = u3.completedAt);
    }
    return u3;
  }
  function P2(e3, t3 = !1) {
    let n3 = f2.get(e3);
    if (!n3) return;
    f2.delete(e3);
    let r3 = Ve2(n3.conversationId, e3, n3.assistantMessageId, t3);
    return _2 !== void 0 && f2.size === 0 && (window.clearTimeout(_2), _2 = void 0), r3;
  }
  function Ue2(e3, t3, n3) {
    f2.set(t3, { assistantMessageId: n3, conversationId: e3 }), _2 === void 0 && (_2 = window.setTimeout(() => {
      _2 = void 0;
      let e4 = [...f2.keys()];
      for (let t4 of e4) P2(t4);
    }, ym));
  }
  async function We2(n3, a3, o3) {
    let s3 = id(n3, a3, o3, { actionTitles: await Td(o3?.actionRequests, { officialScripts: t2.officialScripts, templates: t2.templates, userTemplates: t2.userTemplates, locale: i2.currentLocale, workspaceName: r2.currentWorkspace?.workspaceName }) });
    s3 && (e2.pendingHitlByConversationId[n3] = s3);
  }
  function Ge2(t3, n3) {
    let r3 = e2.pendingHitlByConversationId[t3];
    r3 && (n3 && n3 !== r3.id || delete e2.pendingHitlByConversationId[t3]);
  }
  function Ke2(t3, n3, r3) {
    let i3 = ph(t3, n3, r3);
    i3 ? e2.todoProgressByRunId[n3] = i3 : delete e2.todoProgressByRunId[n3];
  }
  function qe2(e3) {
    return e3.event.type === "user_message" ? e3.event.data.attachments.map((e4) => ({ fileId: e4.fileId, kind: "file", fileName: e4.fileName ?? e4.fileId, mimeType: e4.mimeType ?? "application/octet-stream", size: e4.size, url: e4.url, localUrl: e4.localUrl, remoteUrl: e4.remoteUrl, fileUrl: e4.fileUrl, uploadStatus: "uploaded" })) : [];
  }
  function Je2(t3) {
    if (t3.event.type !== "user_message") return;
    let { conversationId: n3, runId: r3, assistantMessageId: i3 } = t3, a3 = Nm.get(r3), o3 = e2.messagesByConversationId[n3] ||= [], s3 = qe2(t3), c3 = { id: t3.event.data.messageId, conversationId: n3, runId: r3, role: "user", author: "You", content: t3.event.data.content, attachments: a3?.attachments.length ? pp(a3.attachments, s3) : s3, createdAt: Yd(t3.event.data.createdAt || t3.timestamp), status: "done" }, l3 = o3.findIndex((e3) => e3.id === c3.id || e3.id === a3?.userMessageId);
    if (l3 >= 0) o3[l3] = c3;
    else {
      let e3 = o3.findIndex((e4) => e4.id === i3);
      o3.splice(e3 >= 0 ? e3 : o3.length, 0, c3);
    }
    Nm.delete(r3);
  }
  async function Ye2(t3) {
    let n3 = t3.event, { conversationId: r3, runId: i3, assistantMessageId: a3 } = t3;
    if (n3.type === "user_message") Je2(t3);
    else if (n3.type === "title_changed") {
      let t4 = e2.conversationsById[r3];
      t4 && n3.data.title.trim() && (t4.title = n3.data.title.trim());
    } else n3.type === "plan_updated" ? Ke2(r3, i3, n3.data.todos) : n3.type === "approval_requested" ? await We2(r3, i3, { ...n3.data, interruptsId: n3.data.approvalId }) : n3.type === "approval_resolved" && Ge2(r3, n3.data.approvalId);
    let o3 = Yl(t3);
    if (f2.set(i3, { assistantMessageId: a3, conversationId: r3 }), !o3) {
      Ue2(r3, i3, a3);
      return;
    }
    let s3 = P2(i3, !0);
    if (o3 === "cancelled" && U2(r3, i3), Wm(e2, i3, o3, n3.type === "run_failed" ? n3.data.message : void 0, { markUnread: !0 }), ge2(r3), s3?.status === "error") {
      let e3 = Le2(r3, i3, a3);
      e3 && (e3.status = "error");
    }
    M2();
  }
  async function Xe2(e3) {
    let n3 = await ap(e3, { templates: t2.templates, userTemplates: t2.userTemplates, locale: i2.currentLocale, workspaceId: r2.currentWorkspace?.id }), a3 = /* @__PURE__ */ new Set(), o3 = /* @__PURE__ */ new Set();
    for (let e4 of n3) {
      e4.startSequence !== void 0 && h2.delete(e4.runId);
      let t3 = p2.get(e4.runId) ?? [];
      ql(t3, [e4]), p2.set(e4.runId, t3), a3.add(e4.runId), Yl(e4) && o3.add(e4.runId), await Ye2(e4);
    }
    for (let e4 of a3) P2(e4);
    await Me();
    for (let e4 of o3) p2.delete(e4), m2.delete(e4), h2.delete(e4);
  }
  let I2 = new up({ ttlMs: vm, scheduler: lp(window), onFlush: Xe2, onError(e3) {
    console.error("[agent-console] Failed to flush buffered stream text events:", e3);
  } });
  async function L2(e3) {
    if (!g2.has(e3)) {
      g2.add(e3);
      try {
        let t3 = m2.get(e3);
        for (; t3?.length; ) {
          let n3 = t3.shift();
          if (!I2.enqueue(n3)) {
            try {
              await I2.flushRun(e3);
            } catch (e4) {
              console.error("[agent-console] Failed to render buffered stream text before a run event:", e4);
            }
            await Xe2([n3]);
          }
        }
      } finally {
        g2.delete(e3), m2.get(e3)?.length && L2(e3);
      }
    }
  }
  function R2(e3) {
    let t3 = m2.get(e3.runId) ?? [];
    t3.push(e3), m2.set(e3.runId, t3), L2(e3.runId);
  }
  function z2(t3) {
    let n3 = Fm.resolve(t3);
    if (n3 && (Vl(e2.messagesByConversationId[t3.conversationId] ?? [], n3, t3), Gl(Ie2(t3), t3), Nm.set(t3.runId, n3), Je2({ ...t3, event: { type: "user_message", data: { messageId: t3.turnId, content: n3.content, attachments: [], createdAt: t3.timestamp } } }), U2(t3.conversationId, t3.runId), Wm(e2, t3.runId, "cancelled"), ge2(t3.conversationId)), Fm.hasRun(t3.runId)) {
      Yl(t3) && M2();
      return;
    }
    if (t3.event.type === "run_started") {
      let n4 = Mm.acknowledge(t3.conversationId, t3.event.data.requestId);
      n4 && (Nm.set(t3.runId, n4), Vl(e2.messagesByConversationId[t3.conversationId] ?? [], n4, t3), n4.onRunStarted?.({ conversationId: t3.conversationId, runId: t3.runId }));
      let r4 = e2.conversationsById[t3.conversationId];
      r4 && (r4.unread = !1, n4 && (r4.title === "New conversation" || r4.title === "New Chat" || r4.title === "Loading conversation...") && (r4.title = Bm(n4.content))), Im.value++;
    }
    let r3 = Kl(Ie2(t3), Sm.get(t3.runId) ?? [], t3);
    r3.buffered.length > 0 ? Sm.set(t3.runId, r3.buffered) : Sm.delete(t3.runId);
    for (let e3 of r3.accepted) R2(e3);
  }
  function B2() {
    Om || (Om = !0, c2.subscribe((e3) => {
      e3.type === "conversation.run.event" ? z2(e3.data) : e3.type === "channel.ready" && M2();
    }));
  }
  B2();
  function V2(t3, n3) {
    let r3 = e2.messagesByConversationId[t3]?.find((e3) => e3.runId === n3 && e3.role === "assistant");
    r3 && (r3.status = "done"), Wm(e2, n3, "completed", void 0, { markUnread: !0 }), ge2(t3);
  }
  function Ze2(t3, n3, r3) {
    let i3 = Le2(t3, n3);
    i3 && (i3.status = "error", i3.content = r3, i3.errorData = r3), Wm(e2, n3, "failed", r3, { markUnread: !0 }), ge2(t3);
  }
  function Qe2(e3) {
    if (e3 < 1e3) return `${$t("\u5DF2\u505C\u6B62")} 1s`;
    let t3 = Math.round(e3 / 1e3);
    if (t3 < 60) return `${$t("\u5DF2\u505C\u6B62")} ${t3}s`;
    let n3 = Math.floor(t3 / 60), r3 = t3 % 60;
    return r3 > 0 ? `${$t("\u5DF2\u505C\u6B62")} ${n3}m${r3}s` : `${$t("\u5DF2\u505C\u6B62")} ${n3}m`;
  }
  function H2(e3, t3) {
    if (e3 === "cancelled") return Qe2(t3);
    if (t3 < 1e3) return `${$t("\u4EFB\u52A1\u8017\u65F6")} 1s`;
    let n3 = Math.round(t3 / 1e3);
    if (n3 < 60) return `${$t("\u4EFB\u52A1\u8017\u65F6")} ${n3}s`;
    let r3 = Math.floor(n3 / 60), i3 = n3 % 60;
    return i3 > 0 ? `${$t("\u4EFB\u52A1\u8017\u65F6")} ${r3}m${i3}s` : `${$t("\u4EFB\u52A1\u8017\u65F6")} ${r3}m`;
  }
  function U2(e3, t3) {
    let n3 = Le2(e3, t3);
    if (!n3 || (n3.status = "done", n3.createdAt ||= Vm(), !n3.process)) return;
    let r3 = Date.now(), i3 = n3.process.durationStartedAt ?? r3;
    n3.process.durationEndedAt = r3, n3.process.durationLabel = Qe2(Math.max(0, r3 - i3)), n3.process.durationState = void 0, n3.process.completed = !1, n3.process.collapsed = !1, Zf(n3.process.events);
  }
  async function W2(t3) {
    let n3 = e2.runsById[t3];
    if (n3)
      if (!c2.send("conversation.run.stop", { conversationId: n3.conversationId })) s2(-1, $t("Agent \u8FDE\u63A5\u5C1A\u672A\u5C31\u7EEA"));
      else {
        Fm.addRun(t3);
        try {
          await I2.flushRun(t3);
        } catch (e3) {
          console.error("[agent-console] Failed to render buffered stream text before stopping a run:", e3);
        }
        m2.delete(t3), I2.discardRun(t3), P2(t3), Sm.delete(t3), f2.delete(t3), p2.delete(t3), h2.delete(t3), U2(n3.conversationId, t3), Wm(e2, t3, "cancelled"), ge2(n3.conversationId);
      }
  }
  function G2() {
    let t3 = E2.value;
    if (!t3 && hm) hm = void 0, pm.value = [], ge2();
    else if (t3)
      if (Mm.has(t3.id)) {
        if (!c2.send("conversation.run.stop", { conversationId: t3.id })) {
          s2(-1, $t("Agent \u8FDE\u63A5\u5C1A\u672A\u5C31\u7EEA"));
          return;
        }
        let n3 = Mm.acknowledge(t3.id);
        if (n3) {
          Fm.addPending(t3.id, n3.requestId, n3);
          let r3 = e2.messagesByConversationId[t3.id]?.find((e3) => e3.id === n3.assistantMessageId);
          if (r3 && (r3.status = "done", r3.createdAt = Vm(), r3.process)) {
            let e3 = Date.now();
            r3.process.durationEndedAt = e3, r3.process.durationLabel = Qe2(Math.max(0, e3 - n3.startedAt)), r3.process.durationState = void 0;
          }
        }
        Im.value++, ge2(t3.id);
      } else for (let n3 = t3.runningRunIds.length - 1; n3 >= 0; n3--) {
        let r3 = t3.runningRunIds[n3], i3 = e2.runsById[r3];
        if (!i3 || Gm(i3.status)) {
          W2(r3);
          return;
        }
      }
  }
  async function $e2(n3) {
    if (e2.conversationsById[n3])
      if (qm(e2, n3)) s2(-1, $t("\u4EFB\u52A1\u8FDB\u884C\u4E2D\uFF0C\u8BF7\u5148\u505C\u6B62\u518D\u5220\u9664"));
      else try {
        await t2.deleteConversation(n3), I2.removeConversation(n3);
        for (let t3 of Object.values(e2.streamsByRunId)) t3.conversationId === n3 && (m2.delete(t3.runId), p2.delete(t3.runId), h2.delete(t3.runId));
        if (th(e2, n3), o2(0, $t("\u5BF9\u8BDD\u5DF2\u5220\u9664")), T2.value === n3) {
          let t3 = e2.conversationIds[0];
          t3 ? await we2(t3) : await d2.push({ name: "agent-console-chat", query: u2.query });
        }
      } catch (e3) {
        console.error("[agent-console] Failed to delete conversation:", e3), s2(-1, e3 instanceof Error ? e3.message : $t("\u5220\u9664\u5BF9\u8BDD\u5931\u8D25"));
      }
  }
  async function et2(n3, r3) {
    let i3 = e2.conversationsById[n3], a3 = r3.trim();
    if (!i3 || !a3) return !1;
    if (a3 === i3.title) return !0;
    try {
      return ke2(qf(await t2.updateConversation(n3, a3))), !0;
    } catch (e3) {
      return console.error("[agent-console] Failed to rename conversation:", e3), s2(-1, e3 instanceof Error ? e3.message : $t("\u91CD\u547D\u540D\u5931\u8D25")), !1;
    }
  }
  async function tt2(t3) {
    let n3 = T2.value, r3 = n3 ? e2.pendingHitlByConversationId[n3] : void 0;
    if (n3 && r3 && r3.id === t3.requestId) {
      r3.status = "submitting";
      try {
        let e3 = od(r3, t3).map((e4) => t3.fullAccess && e4.type === "approve" ? { ...e4, fullAccess: !0 } : e4);
        if (!c2.send("conversation.approval.submit", { conversationId: n3, approvalId: r3.id, decisions: e3 })) throw Error("Agent WebSocket is not ready");
        t3.fullAccess && (a2.value = !0);
      } catch (e3) {
        r3.status = "error", console.error("[agent-console] Failed to submit HITL decision:", e3), s2(-1, e3 instanceof Error ? e3.message : $t("\u63D0\u4EA4\u5BA1\u6279\u5931\u8D25"));
      }
    }
  }
  function nt2(e3) {
    if (!e3.length || be2.value) return;
    let t3 = e3.map((e4) => ch(e4));
    if (!t3.length) return;
    let n3 = T2.value, r3 = at2(n3);
    r3.push(...t3);
    for (let e4 of r3.slice(-t3.length)) q2(n3, r3, e4);
  }
  function rt2(e3) {
    if (be2.value) return;
    let t3 = lh(e3), n3 = T2.value, r3 = at2(n3);
    r3.push(t3), q2(n3, r3, r3[r3.length - 1]);
  }
  function it2(t3) {
    let n3 = uh(t3), r3 = T2.value;
    r3 ? (e2.draftsByConversationId[r3] ||= nh(r3), e2.draftsByConversationId[r3].attachments.push(n3)) : fm.value = [...fm.value, n3];
  }
  function at2(t3) {
    return t3 ? (e2.draftsByConversationId[t3] ||= nh(t3), e2.draftsByConversationId[t3].attachments) : fm.value;
  }
  function q2(e3, t3, n3) {
    if (!n3 || n3.uploadStatus === "uploaded") return;
    let r3 = n3.fileId, i3 = lt2(e3, t3, [n3]);
    Am.set(r3, i3), i3.catch((e4) => {
      console.error("[agent-console] Failed to upload attachment:", e4), s2(-1, e4 instanceof Error ? e4.message : $t("\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25"));
    }).finally(() => {
      Am.get(r3) === i3 && Am.delete(r3);
    });
  }
  function ot2(e3) {
    let t3 = ye2.value, n3 = t3.findIndex((t4) => t4.fileId === e3);
    if (n3 < 0) return;
    let [r3] = t3.splice(n3, 1);
    rh(r3 ? [r3] : []);
  }
  function st2(t3) {
    if (!t3) {
      rh(fm.value), fm.value = [];
      return;
    }
    let n3 = e2.draftsByConversationId[t3];
    n3 && (rh(n3.attachments), n3.attachments = []);
  }
  function ct2(t3) {
    if (!t3) {
      fm.value = [];
      return;
    }
    let n3 = e2.draftsByConversationId[t3];
    n3 && (n3.attachments = []);
  }
  async function lt2(e3, n3, r3 = n3.slice()) {
    let i3 = [];
    for (let a3 of r3) {
      if (!n3.includes(a3)) continue;
      let r4 = Am.get(a3.fileId);
      if (r4) i3.push(...await r4);
      else if (a3.localPath) a3.uploadStatus = "uploaded", i3.push(a3);
      else if (a3.kind === "folder" && a3.localFiles?.length) {
        a3.uploadStatus = "uploading";
        try {
          let r5 = [];
          for (let o3 of a3.localFiles) {
            if (!n3.includes(a3)) return i3;
            let s3 = await t2.fileToBase64(o3), c3 = o3.webkitRelativePath, l3 = await t2.uploadFile(s3, o3.type || "application/octet-stream", c3 || o3.name, e3);
            r5.push({ fileId: l3.fileId, kind: "file", fileName: l3.fileName, mimeType: l3.mimeType, size: l3.size, url: t2.getFileUrl(l3.fileId, { fileName: l3.fileName }), localUrl: l3.localUrl || l3.url || t2.getFileUrl(l3.fileId), remoteUrl: l3.remoteUrl || l3.fileUrl, fileUrl: l3.fileUrl || l3.remoteUrl, uploadStatus: "uploaded" });
          }
          if (!n3.includes(a3)) continue;
          Object.assign(a3, { localFiles: void 0, uploadedFiles: r5, uploadStatus: "uploaded" }), i3.push(a3), i3.push(...r5);
        } catch (e4) {
          throw n3.includes(a3) && (a3.uploadStatus = "error"), e4;
        }
      } else if (a3.kind === "folder") i3.push(a3, ...a3.uploadedFiles ?? []);
      else if (!a3.localFile) i3.push(a3);
      else {
        a3.uploadStatus = "uploading";
        try {
          let r5 = await t2.fileToBase64(a3.localFile), o3 = await t2.uploadFile(r5, a3.mimeType, a3.fileName, e3), s3 = { ...a3, fileId: o3.fileId, fileName: o3.fileName, mimeType: o3.mimeType, size: o3.size, url: t2.getFileUrl(o3.fileId, { fileName: o3.fileName }), localUrl: o3.localUrl || o3.url || t2.getFileUrl(o3.fileId), remoteUrl: o3.remoteUrl || o3.fileUrl, fileUrl: o3.fileUrl || o3.remoteUrl, preview: void 0, localFile: void 0, uploadStatus: "uploaded" };
          if (!n3.includes(a3)) continue;
          rh([a3]), Object.assign(a3, s3), i3.push(a3);
        } catch (e4) {
          throw n3.includes(a3) && (a3.uploadStatus = "error"), e4;
        }
      }
    }
    return i3;
  }
  async function ut2(n3 = {}) {
    let r3 = Date.now(), i3 = n3.conversationId ?? T2.value, o3 = (n3.content ?? k2.value).trim(), l3 = n3.attachments ?? (n3.content === void 0 ? ye2.value : []);
    if (!o3 && l3.length === 0) return !1;
    if (i3 ? he2(i3) : hm) return n3.fromQueue || n3.templateContext !== void 0 || !o3 && l3.length === 0 || l3.some((e3) => !e3.localPath) ? !1 : (de2(i3, o3, { attachments: l3.slice(), draftContent: o3 }), ct2(i3), k2.value = "", !0);
    let u3 = `${r3}-${Math.random().toString(16).slice(2, 8)}`, d3 = !i3, f3 = Bl({ conversationId: i3 ?? `pending-home-${u3}`, content: o3, attachments: [...l3], createdAt: Yd(r3), startedAt: r3, token: u3 }), p3 = { ...f3.presentation, content: o3, draftContent: o3, attachments: f3.messages[0]?.attachments ?? [] };
    if (d3 ? (hm = u3, pm.value = f3.messages) : (e2.messagesByConversationId[i3] ||= [], e2.messagesByConversationId[i3].push(...f3.messages), Pm.set(i3, p3), Zm(i3)), d3) {
      let n4;
      try {
        n4 = qf(await t2.createConversation());
      } catch (e3) {
        return hm === u3 && (hm = void 0, pm.value = []), console.error("[agent-console] Failed to create conversation:", e3), s2(-1, e3 instanceof Error ? e3.message : $t("\u521B\u5EFA\u4F1A\u8BDD\u5931\u8D25")), !1;
      }
      if (hm !== u3) return !1;
      ke2(n4), e2.conversationIds.includes(n4.id) || e2.conversationIds.unshift(n4.id), i3 = n4.id;
      let r4 = mm.value;
      for (let e3 of r4) e3.conversationId = i3;
      e2.queuedPromptsByConversationId[i3] = r4, mm.value = [], e2.messagesByConversationId[i3] ||= [];
      for (let e3 of f3.messages) e3.conversationId = i3;
      e2.messagesByConversationId[i3].push(...f3.messages), e2.draftsByConversationId[i3].prompt = o3, e2.draftsByConversationId[i3].attachments = fm.value, Pm.set(i3, p3), Zm(i3), fm.value = [], dm.value = "", await we2(i3), hm === u3 && (hm = void 0, pm.value = []);
    }
    function m3() {
      let t3 = e2.messagesByConversationId[i3] ?? [];
      e2.messagesByConversationId[i3] = t3.filter((e3) => e3.id !== p3.userMessageId && e3.id !== p3.assistantMessageId), Pm.delete(i3), $m(e2, i3);
    }
    try {
      await c2.waitUntilConnected();
    } catch (e3) {
      return m3(), console.error("[agent-console] Agent channel is not ready:", e3), s2(-1, $t("Agent \u8FDE\u63A5\u5C1A\u672A\u5C31\u7EEA")), !1;
    }
    let h3 = l3.filter((e3) => e3.kind === "folder" || !e3.fileName.includes("/")), g3 = h3.map((e3) => ({ fileId: e3.fileId, fileName: e3.fileName, mimeType: e3.mimeType, ...e3.size === void 0 ? {} : { size: e3.size }, ...e3.url ? { url: e3.url } : {}, ...e3.localUrl ? { localUrl: e3.localUrl } : {}, ...e3.remoteUrl ? { remoteUrl: e3.remoteUrl } : {}, ...e3.fileUrl ? { fileUrl: e3.fileUrl } : {} })), _3 = c2.send("conversation.run.start", { conversationId: i3, turnId: p3.userMessageId, message: o3, ...l3.length > 0 ? { attachmentsPending: !0 } : {}, ...g3.length > 0 ? { pendingAttachments: g3 } : {}, ...n3.templateContext ? { templateContext: n3.templateContext } : {}, fullAccess: a2.value });
    if (!_3) return m3(), s2(-1, $t("Agent \u8FDE\u63A5\u5C1A\u672A\u5C31\u7EEA")), !1;
    let v3 = { ...p3, requestId: _3, content: o3, attachments: h3, onRunStarted: n3.onRunStarted }, y3 = e2.messagesByConversationId[i3]?.find((e3) => e3.id === p3.userMessageId);
    if (y3 && (y3.content = o3, y3.attachments = h3), Pm.delete(i3), Mm.begin(i3, _3, v3, jm, (t3) => {
      let n4 = e2.messagesByConversationId[i3] ?? [];
      e2.messagesByConversationId[i3] = n4.filter((e3) => e3.id !== t3.userMessageId && e3.id !== t3.assistantMessageId);
      let r4 = e2.draftsByConversationId[i3] ||= nh(i3);
      r4.prompt ||= t3.draftContent, r4.attachments.length === 0 && (r4.attachments = t3.attachments), s2(-1, $t("Agent \u54CD\u5E94\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5")), $m(e2, i3), Im.value++;
    }), Im.value++, !n3.fromQueue) {
      let t3 = e2.draftsByConversationId[i3] ||= nh(i3);
      t3.prompt = "", t3.attachments = [];
    }
    let b3 = [];
    try {
      b3 = await lt2(i3, l3);
    } catch (e3) {
      return console.error("[agent-console] Failed to upload attachments:", e3), s2(-1, e3 instanceof Error ? e3.message : $t("\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25")), c2.send("conversation.run.stop", { conversationId: i3 }), !0;
    }
    if (l3.length > 0) {
      let e3 = dp(b3), t3 = b3.filter((e4) => e4.kind === "file" && !e4.localPath);
      c2.send("conversation.run.attachments.ready", { conversationId: i3, turnId: p3.userMessageId, attachments: t3.map((e4) => ({ fileId: e4.fileId })), ...e3.length > 0 ? { localAttachments: e3 } : {} }) || (s2(-1, $t("Agent \u8FDE\u63A5\u5C1A\u672A\u5C31\u7EEA")), c2.send("conversation.run.stop", { conversationId: i3 }));
    }
    return !0;
  }
  return { activeConversation: E2, activeConversationId: T2, activeHitlRequest: ae2, activeTodoProgress: se2, addPendingAttachments: nt2, addPendingFolder: rt2, addPendingPathAttachment: it2, cancelActiveRun: G2, cancelRun: W2, completeRun: V2, conversationList: D2, conversationListHasMore: Em, conversationListLoadingMore: Dm, deleteConversation: $e2, failRun: Ze2, isThinking: be2, loadMoreConversations: Ae2, loadEarlierMessages: Fe2, messageList: ne2, messageHistoryHasMore: O2, messageHistoryLoading: re2, pendingAttachments: ye2, pendingApprovalConversationIds: oe2, prompt: k2, queuedPrompts: A2, removePendingAttachment: ot2, removeQueuedPrompt: fe2, renameConversation: et2, reorderQueuedPrompt: pe2, restoreQueuedPrompt: me2, runningTaskCount: xe2, profileCount: Ce2, selectConversation: Te2, sendPrompt: ut2, startNewChat: De2, submitHitl: tt2, state: e2, taskGroupList: ie2, profileMonitorConnected: l2.connected, toggleTaskGroup: Oe2 };
}
async function hh(e2, t2) {
  return await t2.startNewChat(), t2.sendPrompt({ content: e2, onRunStarted: t2.onRunStarted });
}
function gh(e2, t2) {
  if (!e2) return !1;
  let n2 = t2[e2]?.status;
  return n2 === "completed" || n2 === "failed" || n2 === "cancelled";
}
var _h = { class: "agent-console-delete-confirm-dialog__content" };
var vh = { class: "agent-console-delete-confirm-dialog__copy" };
var yh = { class: "agent-console-delete-confirm-dialog__footer" };
var bh = { key: 0, class: "agent-console-delete-confirm-dialog__checkbox" };
var xh = { for: "agent-console-delete-confirm-dialog-checkbox" };
var Sh = { class: "agent-console-delete-confirm-dialog__actions" };
var Ch = ["disabled", "onClick"];
var wh = ["disabled", "onClick"];
var Th = Z(M({ __name: "AgentDeleteConfirmDialog", setup(e2) {
  function t2(e3) {
    return e3.rejectLabel || e3.rejectProps?.label || $t("\u53D6\u6D88");
  }
  function n2(e3) {
    return e3.acceptLabel || e3.acceptProps?.label || $t("\u786E\u8BA4");
  }
  return (e3, r2) => {
    let i2 = fn, a2 = $r, o2 = on;
    return P(), W(a2, { group: "agentConsoleDeleteConfirmDialog", pt: { root: "agent-console-delete-confirm-dialog-root" } }, { container: H(({ message: e4, acceptCallback: r3, rejectCallback: a3 }) => [L("section", { class: I(["agent-console-delete-confirm-dialog", e4.class]) }, [L("div", _h, [L("div", vh, [L("h2", null, B(e4.header), 1), L("p", null, B(e4.message), 1)])]), L("footer", yh, [e4.checkboxProps ? (P(), R("div", bh, [q(i2, { modelValue: e4.checkboxProps.value, "onUpdate:modelValue": (t3) => e4.checkboxProps.value = t3, pt: { root: "items-center", box: "!w-4 !h-4" }, "input-id": "agent-console-delete-confirm-dialog-checkbox", binary: "" }, null, 8, ["modelValue", "onUpdate:modelValue"]), L("label", xh, B(e4.checkboxProps.label), 1), e4.checkboxProps.tooltip ? rt((P(), W(V(X), { key: 0, name: "base/rx_ic_info", size: 12 }, null, 512)), [[o2, { value: e4.checkboxProps.tooltip, showDelay: 500, hideDelay: 300 }]]) : U("", !0)])) : U("", !0), L("div", Sh, [L("button", { class: "agent-console-delete-confirm-dialog__button", type: "button", disabled: e4.rejectProps?.disabled, onClick: a3 }, B(t2(e4)), 9, Ch), L("button", { class: "agent-console-delete-confirm-dialog__button agent-console-delete-confirm-dialog__button--danger", type: "button", disabled: e4.acceptProps?.disabled, onClick: r3 }, B(n2(e4)), 9, wh)])])], 2)]), _: 1 });
  };
} }), [["__scopeId", "data-v-8f762b61"]]);
var Eh = [{ id: "new-chat", label: "New Chat", icon: "roxy-agent/rx-ic-new-chat", to: { name: "agent-console-chat" } }, { id: "task-manager", label: "\u4EFB\u52A1\u7BA1\u7406", icon: "roxy-agent/rx-ic-task-manager", to: { name: "agent-console-task-manager" } }];
var Dh = [{ id: "template-store", label: "\u6A21\u677F\u5546\u57CE", icon: "roxy-agent/rx-ic-templates-store", to: { name: "agent-console-template-store" } }];
var Oh = { class: "agent-nav" };
var kh = ["href", "onClick"];
var Ah = { class: "nav-label" };
var jh = { key: 0, class: "nav-status-dot", "aria-hidden": "true" };
var Mh = Z(M({ __name: "AgentNav", props: { items: {} }, emits: ["select"], setup(e2, { emit: t2 }) {
  let n2 = t2;
  function r2(e3, t3, r3) {
    n2("select", t3.id), t3.id === "new-chat" ? e3.preventDefault() : r3(e3);
  }
  return (t3, n3) => {
    let i2 = X, a2 = We("RouterLink");
    return P(), R("nav", Oh, [(P(!0), R(z, null, G(e2.items, (e3) => (P(), W(a2, { key: e3.id, custom: "", to: e3.to }, { default: H(({ href: n4, isExactActive: a3, navigate: o2 }) => [L("a", { href: n4, class: I(["nav-item", { active: a3 }]), onClick: (t4) => r2(t4, e3, o2) }, [q(i2, { name: e3.icon, size: "18" }, null, 8, ["name"]), L("span", Ah, B(t3.$t(e3.label)), 1), e3.statusActive ? (P(), R("span", jh)) : U("", !0)], 10, kh)]), _: 2 }, 1032, ["to"]))), 128))]);
  };
} }), [["__scopeId", "data-v-f21bd12f"]]);
var Nh = { class: "conversation-section" };
var Ph = { class: "section-title" };
var Fh = { class: "conversation-list" };
var Ih = ["href", "onMouseenter", "onMouseleave", "onClick"];
var Lh = { class: "conversation-content" };
var Rh = { class: "conversation-title" };
var zh = { key: 0, class: "conversation-approval-badge", role: "status" };
var Bh = ["aria-label"];
var Vh = ["title"];
var Hh = ["onClick"];
var Uh = ["onClick"];
var Wh = ["title"];
var Gh = { key: 0, class: "conversation-loading-more", role: "status" };
var Kh = Z(M({ __name: "ConversationList", props: { activeConversationId: {}, conversations: {}, loadingMore: { type: Boolean }, pendingApprovalConversationIds: {} }, emits: ["delete", "rename", "select"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, i2 = N(""), a2 = N(""), o2 = N("");
  function s2(e3, t3) {
    e3.preventDefault(), c2(), r2("select", t3.id);
  }
  function c2() {
    i2.value = "";
  }
  function l2(e3, t3) {
    i2.value = e3 ? t3 : "";
  }
  function u2(e3, t3) {
    e3.preventDefault(), e3.stopPropagation(), c2(), r2("delete", t3);
  }
  function d2(e3, t3) {
    e3.preventDefault(), e3.stopPropagation(), c2(), r2("rename", t3);
  }
  function f2(e3) {
    o2.value = e3;
  }
  function p2(e3) {
    o2.value === e3 && (o2.value = "");
  }
  function m2(e3) {
    a2.value = e3;
  }
  function h2(e3) {
    a2.value === e3 && (a2.value = "");
  }
  function g2(e3) {
    return e3.runningRunIds.length > 0 || e3.latestRunStatus === "queued" || e3.latestRunStatus === "streaming" ? "running" : e3.latestRunStatus === "completed" || e3.latestRunStatus === "failed" || e3.latestRunStatus === "cancelled" ? "ended" : "idle";
  }
  function _2(e3) {
    return e3.id === n2.activeConversationId;
  }
  function v2(e3) {
    return i2.value === e3.id;
  }
  function y2(e3) {
    return o2.value === e3.id || a2.value === e3.id || v2(e3);
  }
  function b2(e3) {
    let t3 = g2(e3), r3 = _2(e3), i3 = v2(e3), a3 = y2(e3), s3 = t3 === "running", c3 = t3 === "ended" && e3.unread && !r3 && !a3;
    return { actionOpen: i3, isAwaitingApproval: n2.pendingApprovalConversationIds.includes(e3.id), hovered: o2.value === e3.id, isActive: r3, showAction: !s3 && a3, showEndedHint: c3, showRunning: s3, taskState: t3, title: s3 ? $t("\u5BF9\u8BDD\u4E2D") : c3 ? $t("\u5BF9\u8BDD\u7ED3\u675F") : $t("\u5220\u9664") };
  }
  function x2(e3) {
    let t3 = b2(e3);
    return [{ active: t3.isActive }, `conversation-item--${t3.taskState}`, { "conversation-item--action-visible": t3.showAction, "delete-menu-open": t3.actionOpen }];
  }
  return (t3, n3) => {
    let r3 = X, i3 = We("RouterLink");
    return P(), R("section", Nh, [L("div", Ph, B(t3.$t("\u5BF9\u8BDD")), 1), L("div", Fh, [(P(!0), R(z, null, G(e2.conversations, (e3) => (P(), W(i3, { key: e3.id, custom: "", to: { name: "agent-console-conversation", params: { conversationId: e3.id } } }, { default: H(({ href: n4 }) => [L("a", { href: n4, class: I(["conversation-item", x2(e3)]), onMouseenter: (t4) => f2(e3.id), onMouseleave: (t4) => p2(e3.id), onClick: (t4) => s2(t4, e3), onFocus: (t4) => m2(e3.id), onBlur: (focusEvent) => {
      focusEvent.currentTarget.contains(focusEvent.relatedTarget) || ((t4) => h2(e3.id))(focusEvent);
    } }, [L("span", Lh, [L("span", Rh, B(e3.title), 1), b2(e3).isAwaitingApproval ? (P(), R("span", zh, B(t3.$t("\u7B49\u5F85\u6279\u51C6")), 1)) : U("", !0)]), L("span", { class: "conversation-meta", "aria-label": b2(e3).title }, [b2(e3).showRunning ? (P(), R("span", { key: 0, class: "conversation-status conversation-status--running", title: t3.$t("\u5BF9\u8BDD\u4E2D"), role: "status" }, [q(V(Br))], 8, Vh)) : U("", !0), b2(e3).showAction ? (P(), W(Vr, { key: 1, open: b2(e3).actionOpen, "trigger-class": "conversation-delete", "content-class": "conversation-action-menu", placement: "top-end", offset: 8, role: "button", tabindex: "0", title: t3.$t("\u5220\u9664"), "aria-label": t3.$t("\u5220\u9664"), "aria-expanded": b2(e3).actionOpen, "onUpdate:open": (t4) => l2(t4, e3.id), onFocus: (t4) => m2(e3.id), onBlur: (t4) => h2(e3.id) }, { content: H(({ close: n5 }) => [L("button", { type: "button", class: "conversation-action-menu__action", onClick: ut((t4) => {
      n5(), d2(t4, e3.id);
    }, ["stop"]) }, [q(r3, { name: "base/rx_ic_agent_edit", size: "16", "aria-hidden": "true" }), L("span", null, B(t3.$t("\u91CD\u547D\u540D\u5BF9\u8BDD")), 1)], 8, Hh), L("button", { type: "button", class: "conversation-action-menu__action conversation-action-menu__action--danger", onClick: ut((t4) => {
      n5(), u2(t4, e3.id);
    }, ["stop"]) }, [q(r3, { name: "base/rx_ic_bin_1", size: "16", "aria-hidden": "true" }), L("span", null, B(t3.$t("\u5220\u9664")), 1)], 8, Uh)]), default: H(() => [q(r3, { name: "base/rx_ic_more-h", size: "12" })]), _: 2 }, 1032, ["open", "title", "aria-label", "aria-expanded", "onUpdate:open", "onFocus", "onBlur"])) : U("", !0), b2(e3).showEndedHint ? (P(), R("span", { key: 2, class: "conversation-status conversation-status--ended", title: t3.$t("\u5BF9\u8BDD\u7ED3\u675F"), "aria-hidden": "true" }, null, 8, Wh)) : U("", !0)], 8, Bh)], 42, Ih)]), _: 2 }, 1032, ["to"]))), 128)), e2.loadingMore ? (P(), R("div", Gh, B(t3.$t("\u52A0\u8F7D\u4E2D...")), 1)) : U("", !0)])]);
  };
} }), [["__scopeId", "data-v-45a8424b"]]);
var T_ = { render: () => null };
var E_ = "autoRenewModalNotShowAgain";
function D_() {
  let [e2] = Ln();
  function t2() {
    return localStorage.getItem(E_) === "true";
  }
  function n2(e3) {
    return e3 === !0 || e3 === h.Open || e3 === String(h.Open);
  }
  function r2() {
    if (t2()) return Promise.resolve(!0);
    let { promise: n3, resolve: r3 } = Promise.withResolvers(), i3 = !1;
    function a2(e3) {
      i3 || (i3 = !0, r3(e3));
    }
    return e2({ showHeader: !1, modal: !0, blockScroll: !0, handleCancel: () => a2(!1), slots: { container: ({ hideModal: e3 }) => Ae(T_, { onClose: () => {
      e3(), a2(!1);
    }, onConfirm: () => {
      e3(), a2(!0);
    } }) } }), n3;
  }
  async function i2(e3) {
    return !n2(e3) || r2();
  }
  return { confirmEnableAutoRenew: r2, beforeToggleAutoRenew: i2 };
}
var dv = { __scopeId: "data-v-acbf514d", setup() {
  return () => q("div", { class: "sidebar-footer" }, [q("button", { class: "feedback-button", type: "button", onClick: () => globalThis.__router.push("/browser/list") }, [q(X, { name: "base/rx_ic_browser", size: 18 }), q("span", null, "\u7A97\u53E3\u7BA1\u7406")]), q("div", { class: "footer-actions" }, [q("button", { class: "settings-button", type: "button", onClick: () => globalThis.__router.push("/agent-console/settings") }, [q(X, { name: "roxy-agent/rx-ic-settings", size: 18 }), q("span", null, "\u8BBE\u7F6E")])])]);
} };
var fv = {};
var pv = ["href", "onClick"];
function mv(e2, t2) {
  let n2 = X, r2 = We("RouterLink");
  return P(), W(r2, { custom: "", to: { name: "agent-console-my-templates" } }, { default: H(({ href: t3, navigate: r3, isActive: i2 }) => [L("a", { href: t3, class: I(["template-menu", { active: i2 }]), onClick: r3 }, [q(n2, { name: "roxy-agent/rx-ic-templates", size: "18" }), L("span", null, B(e2.$t("\u6211\u7684\u6A21\u677F")), 1)], 10, pv)]), _: 1 });
}
var hv = Z(fv, [["render", mv], ["__scopeId", "data-v-a0b5c48f"]]);
var gv = { class: "agent-sidebar" };
var _v = { class: "sidebar-new-chat-wrap" };
var vv = ["href"];
var yv = { class: "sidebar-menu" };
var bv = ["aria-label", "aria-valuemax", "aria-valuemin", "aria-valuenow"];
var xv = Z(M({ __name: "AgentSidebar", props: { activeConversationId: {}, conversations: {}, hasMoreConversations: { type: Boolean }, loadingMoreConversations: { type: Boolean }, maxWidth: {}, minWidth: {}, pendingApprovalConversationIds: {}, sidebarWidth: {}, updateInfo: {} }, emits: ["openFeedback", "newChat", "deleteConversation", "renameConversation", "resizeStart", "resizeStep", "restartAgentForUpdate", "selectConversation", "loadMoreConversations"], setup(e2, { expose: t2, emit: n2 }) {
  let r2 = e2, i2 = n2, a2 = Se(), o2 = F(() => Eh.find((e3) => e3.id === "new-chat")), s2 = F(() => a2.currentLocale.startsWith("zh") ? "\u65B0\u5BF9\u8BDD" : $t("\u65B0\u5EFA\u5BF9\u8BDD")), c2 = F(() => Eh.filter((e3) => e3.id !== "new-chat")), l2 = F(() => r2.updateInfo?.type === "agent" && ["update", "downloaded", "downloading", "failed"].includes(r2.updateInfo.status)), u2 = F(() => {
    let e3 = r2.updateInfo?.version;
    return e3 ? $t("\u66F4\u65B0 AI Agent \u5230 v{version}", { version: e3 }) : $t("\u66F4\u65B0 AI Agent");
  }), d2 = F(() => {
    let e3 = r2.updateInfo;
    return e3?.type === "agent" ? e3.status === "downloading" ? `${$t("\u6B63\u5728\u4E0B\u8F7D")} ${Math.floor(e3.percent ?? 0)}%` : e3.status === "downloaded" ? $t("\u66F4\u65B0") : e3.status === "failed" ? $t("\u91CD\u8BD5") : $t("\u66F4\u65B0") : $t("\u66F4\u65B0");
  }), f2 = F(() => r2.updateInfo?.status === "downloading"), p2 = N(null), m2 = N(null), h2 = N(!1), g2 = N(!1), _2 = null;
  t2({ getNewChatElement: () => p2.value });
  function v2(e3) {
    e3 === "new-chat" && i2("newChat");
  }
  function y2() {
    let e3 = m2.value;
    if (!e3) {
      h2.value = !1, g2.value = !1;
      return;
    }
    let t3 = e3.scrollHeight - e3.clientHeight;
    t3 <= 1 ? (h2.value = !1, g2.value = !1, r2.hasMoreConversations && !r2.loadingMoreConversations && i2("loadMoreConversations")) : (h2.value = e3.scrollTop > 1, g2.value = e3.scrollTop < t3 - 1, r2.hasMoreConversations && !r2.loadingMoreConversations && e3.scrollTop >= t3 - 80 && i2("loadMoreConversations"));
  }
  return K(() => [r2.conversations.length, r2.conversations.map((e3) => `${e3.id}:${e3.title}`).join("|"), r2.hasMoreConversations, r2.loadingMoreConversations], () => {
    Me(() => y2());
  }, { immediate: !0 }), He(() => {
    Me(() => {
      y2();
      let e3 = m2.value;
      e3 && typeof ResizeObserver < "u" && (_2 = new ResizeObserver(() => y2()), _2.observe(e3), Array.from(e3.children).forEach((e4) => _2?.observe(e4)));
    });
  }), ze(() => {
    _2?.disconnect(), _2 = null;
  }), (t3, n3) => {
    let r3 = X, a3 = We("RouterLink");
    return P(), R("aside", gv, [q(Fl, { class: "sidebar-brand" }), L("div", _v, [V(o2) ? (P(), W(a3, { key: 0, custom: "", to: V(o2).to }, { default: H(({ href: e3, isExactActive: t4 }) => [L("a", { ref_key: "newChatElement", ref: p2, href: e3, class: I(["sidebar-new-chat", { active: t4 }]), onClick: n3[0] ||= ut((e4) => i2("newChat"), ["prevent"]) }, [q(r3, { name: V(o2).icon, size: "18" }, null, 8, ["name"]), L("span", null, B(V(s2)), 1)], 10, vv)]), _: 1 }, 8, ["to"])) : U("", !0)]), L("div", { ref_key: "sidebarScrollRef", ref: m2, class: I(["sidebar-scroll", { "sidebar-scroll--can-scroll-up": V(h2), "sidebar-scroll--can-scroll-down": V(g2) }]), onScrollPassive: y2 }, [L("div", yv, [q(Mh, { items: V(Dh), onSelect: v2 }, null, 8, ["items"]), q(Mh, { items: V(c2), onSelect: v2 }, null, 8, ["items"]), q(hv)]), q(Kh, { "active-conversation-id": e2.activeConversationId, "pending-approval-conversation-ids": e2.pendingApprovalConversationIds, conversations: e2.conversations, "loading-more": e2.loadingMoreConversations, onDelete: n3[1] ||= (e3) => i2("deleteConversation", e3), onRename: n3[2] ||= (e3) => i2("renameConversation", e3), onSelect: n3[3] ||= (e3) => i2("selectConversation", e3) }, null, 8, ["active-conversation-id", "pending-approval-conversation-ids", "conversations", "loading-more"])], 34), q(dv, { "update-available": V(l2), "update-disabled": V(f2), "update-label": V(d2), "update-title": V(u2), onFeedback: n3[4] ||= (e3) => i2("openFeedback"), onUpdate: n3[5] ||= (e3) => i2("restartAgentForUpdate") }, null, 8, ["update-available", "update-disabled", "update-label", "update-title"]), L("div", { class: "agent-sidebar-resize-handle", role: "separator", "aria-orientation": "vertical", "aria-label": t3.$t("\u8C03\u6574\u4F1A\u8BDD\u680F\u5BBD\u5EA6"), "aria-valuemax": e2.maxWidth, "aria-valuemin": e2.minWidth, "aria-valuenow": e2.sidebarWidth, tabindex: "0", onKeydown: [n3[6] ||= ft(ut((e3) => i2("resizeStep", -16), ["prevent"]), ["left"]), n3[7] ||= ft(ut((e3) => i2("resizeStep", 16), ["prevent"]), ["right"])], onPointerdown: n3[8] ||= (e3) => i2("resizeStart", e3) }, null, 40, bv)]);
  };
} }), [["__scopeId", "data-v-50ab874f"]]);
var Sv = ["aria-label"];
var Cv = ["width", "height", "viewBox"];
var wv = ["d"];
var Tv = { class: "select-window-guide__label" };
var Ev = ["aria-label"];
var Dv = 5;
var Ov = 37;
var kv = 32;
var Av = 12;
var jv = 82;
var Mv = 12;
var Nv = Z(M({ __name: "SelectWindowGuide", props: { calloutAboveContainer: { type: Boolean }, calloutBelowTarget: { type: Boolean }, interactiveTarget: { type: Boolean }, label: {}, zIndex: {}, target: {}, visible: { type: Boolean } }, emits: ["dismiss"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, i2 = N(), a2 = N(), o2 = N(0), s2 = N(0), c2 = N(0), l2 = 0, u2, d2 = null, f2 = null, p2 = F(() => {
    let e3 = i2.value;
    if (!e3) return;
    let t3 = Math.max(0, e3.left - Dv), n3 = Math.max(0, e3.top - Dv), r3 = Math.min(s2.value, e3.right + Dv), a3 = Math.min(c2.value, e3.bottom + Dv);
    return { left: t3, top: n3, right: r3, bottom: a3, width: Math.max(0, r3 - t3), height: Math.max(0, a3 - n3) };
  }), m2 = F(() => {
    let e3 = p2.value;
    return e3 ? Math.min(o2.value, e3.width / 2, e3.height / 2) : 0;
  }), h2 = F(() => {
    let e3 = p2.value;
    if (!e3) return "";
    let { left: t3, top: n3, right: r3, bottom: i3 } = e3, a3 = m2.value;
    return [`M 0 0 H ${s2.value} V ${c2.value} H 0 Z`, `M ${t3 + a3} ${n3}`, `H ${r3 - a3}`, `A ${a3} ${a3} 0 0 1 ${r3} ${n3 + a3}`, `V ${i3 - a3}`, `A ${a3} ${a3} 0 0 1 ${r3 - a3} ${i3}`, `H ${t3 + a3}`, `A ${a3} ${a3} 0 0 1 ${t3} ${i3 - a3}`, `V ${n3 + a3}`, `A ${a3} ${a3} 0 0 1 ${t3 + a3} ${n3}`, "Z"].join(" ");
  }), g2 = F(() => {
    let e3 = p2.value;
    return n2.visible && !!(e3?.width && e3.height);
  }), _2 = F(() => {
    let e3 = i2.value;
    return e3 ? e3.left + e3.width / 2 : 0;
  }), v2 = F(() => {
    let e3 = p2.value;
    if (n2.calloutBelowTarget) return Math.max(Av, (e3?.bottom ?? 0) + Ov);
    let t3 = (e3?.top ?? 0) - Ov;
    return !n2.calloutAboveContainer || a2.value === void 0 ? Math.max(Av, t3) : Math.max(Av, a2.value - Mv);
  }), y2 = F(() => {
    let e3 = Math.max(94, s2.value - Av - jv);
    return { left: `${Math.min(Math.max(_2.value, 94), e3)}px`, top: `${v2.value}px` };
  }), b2 = F(() => {
    let e3 = p2.value;
    if (n2.calloutBelowTarget) {
      let t3 = (e3?.bottom ?? 0) + Dv;
      return { left: `${_2.value}px`, top: `${t3}px`, height: `${Math.max(kv, v2.value - t3)}px` };
    }
    return { left: `${_2.value}px`, top: `${v2.value}px`, height: `${Math.max(kv, (e3?.top ?? 0) - v2.value - Dv)}px` };
  }), x2 = F(() => {
    let e3 = i2.value;
    return e3 ? { left: `${e3.left}px`, top: `${e3.top}px`, width: `${e3.width}px`, height: `${e3.height}px` } : {};
  });
  function S2() {
    if (l2 = 0, !n2.visible || !n2.target) {
      i2.value = void 0, a2.value = void 0, o2.value = 0;
      return;
    }
    let e3 = n2.target.getBoundingClientRect(), t3 = n2.target.closest(".composer-shell")?.getBoundingClientRect(), r3 = window.getComputedStyle(n2.target), u3 = Number.parseFloat(r3.borderTopLeftRadius);
    s2.value = window.innerWidth, c2.value = window.innerHeight, a2.value = t3?.top, o2.value = Number.isFinite(u3) ? u3 : 0, i2.value = { left: e3.left, top: e3.top, right: e3.right, bottom: e3.bottom, width: e3.width, height: e3.height };
  }
  function C2() {
    typeof window > "u" || l2 || (l2 = window.requestAnimationFrame(S2));
  }
  function w2() {
    r2("dismiss");
  }
  function T2() {
    n2.target?.click();
  }
  function E2() {
    typeof window < "u" && (window.removeEventListener("resize", C2), window.removeEventListener("scroll", C2, !0)), d2?.removeEventListener("click", w2), u2?.disconnect(), u2 = void 0, d2 = null, f2 = null;
  }
  function ee2() {
    E2(), i2.value = void 0, a2.value = void 0, o2.value = 0, n2.visible && n2.target && typeof window < "u" && (d2 = n2.target, f2 = n2.target.closest(".composer-shell"), d2.addEventListener("click", w2), window.addEventListener("resize", C2), window.addEventListener("scroll", C2, !0), typeof ResizeObserver < "u" && (u2 = new ResizeObserver(C2), u2.observe(d2), f2 && u2.observe(f2)), C2());
  }
  return K([() => n2.visible, () => n2.target], () => ee2(), { flush: "post", immediate: !0 }), ze(() => {
    l2 && window.cancelAnimationFrame(l2), E2();
  }), (t3, n3) => (P(), W(tt, { to: "body" }, [V(g2) ? (P(), R("div", { key: 0, class: "select-window-guide", role: "dialog", "aria-label": e2.label, style: $e(e2.zIndex === void 0 ? void 0 : { zIndex: e2.zIndex }), onTouchmove: n3[0] ||= ut(() => {
  }, ["prevent"]), onWheel: n3[1] ||= ut(() => {
  }, ["prevent"]) }, [(P(), R("svg", { class: "select-window-guide__mask", width: V(s2), height: V(c2), viewBox: `0 0 ${V(s2)} ${V(c2)}`, "aria-hidden": "true" }, [L("path", { d: V(h2), "fill-rule": "evenodd", "clip-rule": "evenodd" }, null, 8, wv)], 8, Cv)), L("div", { class: I(["select-window-guide__callout", { "select-window-guide__callout--below-target": e2.calloutBelowTarget }]), style: $e(V(y2)) }, [L("span", Tv, B(e2.label), 1), L("button", { type: "button", class: "select-window-guide__skip", onClick: ut(w2, ["stop"]) }, B(t3.$t("\u8DF3\u8FC7")), 1)], 6), L("div", { class: I(["select-window-guide__line", { "select-window-guide__line--below-target": e2.calloutBelowTarget }]), style: $e(V(b2)), "aria-hidden": "true" }, [...n3[2] ||= [L("span", null, null, -1)]], 6), e2.interactiveTarget ? (P(), R("button", { key: 0, class: "select-window-guide__target-hit-area", type: "button", "aria-label": e2.label, style: $e(V(x2)), onClick: ut(T2, ["stop"]) }, null, 12, Ev)) : U("", !0)], 44, Sv)) : U("", !0)]));
} }), [["__scopeId", "data-v-a320a8c2"]]);
var Pv = { class: "agent-console-dialog__header" };
var Fv = { class: "agent-console-dialog__title" };
var Iv = ["aria-label", "disabled"];
var Lv = { class: "agent-console-dialog__body rename-conversation-dialog__body" };
var Rv = { class: "agent-console-dialog__footer" };
var zv = { class: "agent-console-dialog__actions" };
var Bv = ["disabled"];
var Vv = ["disabled"];
var Hv = Z(M({ __name: "RenameConversationDialog", setup(e2) {
  let t2 = Ze("dialogRef"), n2 = t2?.value.data ?? {}, r2 = qe("inputRef"), i2 = N(n2.initialTitle ?? ""), a2 = N(!1), o2 = F(() => !!i2.value.trim() && !a2.value);
  function s2() {
    a2.value || t2?.value.close();
  }
  async function c2() {
    let e3 = i2.value.trim();
    if (e3 && !a2.value) {
      a2.value = !0;
      try {
        await n2.onSave?.(e3) !== !1 && t2?.value.close();
      } finally {
        a2.value = !1;
      }
    }
  }
  return He(() => {
    Me(() => r2.value?.focus());
  }), (e3, t3) => {
    let n3 = X;
    return P(), R("form", { class: "agent-console-dialog__shell rename-conversation-dialog", onSubmit: ut(c2, ["prevent"]) }, [L("header", Pv, [L("h2", Fv, B(e3.$t("\u91CD\u547D\u540D\u5BF9\u8BDD")), 1), L("button", { class: "rename-conversation-dialog__close", type: "button", "aria-label": e3.$t("\u5173\u95ED"), disabled: V(a2), onClick: s2 }, [q(n3, { name: "roxy-agent/rx-ic-close", size: "18" })], 8, Iv)]), L("main", Lv, [q(Hr, { ref_key: "inputRef", ref: r2, modelValue: V(i2), "onUpdate:modelValue": t3[0] ||= (e4) => Ke(i2) ? i2.value = e4 : null, type: "text", maxlength: "200", "aria-label": e3.$t("\u91CD\u547D\u540D\u5BF9\u8BDD"), disabled: V(a2) }, null, 8, ["modelValue", "aria-label", "disabled"])]), L("footer", Rv, [L("div", zv, [L("button", { class: "agent-console-dialog__button", type: "button", disabled: V(a2), onClick: s2 }, B(e3.$t("\u53D6\u6D88")), 9, Bv), L("button", { class: "agent-console-dialog__button dark", type: "submit", disabled: !V(o2) }, B(e3.$t("\u4FDD\u5B58")), 9, Vv)])])], 32);
  };
} }), [["__scopeId", "data-v-f48bd423"]]);
var Uv = { class: "group-copy" };
var Wv = { class: "group-copy__text" };
var Gv = { key: 0, class: "task-list" };
var Kv = { class: "task-account" };
var qv = { class: "task-user-info" };
var Jv = { class: "task-name" };
var Yv = { key: 0, class: "task-separator" };
var Xv = { key: 1, class: "task-platform-user" };
var Zv = ["title"];
var Qv = Z(M({ __name: "TaskGroupItem", props: { group: {} }, emits: ["toggle"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, i2 = qe("groupTitleRef"), a2 = N(!1), o2;
  function s2() {
    let e3 = i2.value;
    a2.value = !!(e3 && e3.scrollWidth > e3.clientWidth + 1);
  }
  K(() => n2.group.title, () => Me(s2), { flush: "post" }), He(() => {
    o2 = new ResizeObserver(s2), i2.value && o2.observe(i2.value), s2();
  }), ze(() => o2?.disconnect());
  function c2(e3) {
    return e3.windowName || e3.name;
  }
  function l2(e3) {
    return e3.countryCode ? `country-code/${e3.countryCode}` : "roxy-agent/rx-ic-browser-control";
  }
  return (t3, n3) => {
    let o3 = X;
    return P(), R("section", { class: I(["task-group", { expanded: e2.group.expanded, idle: e2.group.kind === "idle" }]) }, [q(Rr, { content: e2.group.title, disabled: !V(a2), "content-class": "task-group-title-tooltip", placement: "top-start" }, { default: H(() => [L("button", { class: "task-group-trigger", type: "button", onClick: n3[0] ||= (t4) => r2("toggle", e2.group.id) }, [L("div", Uv, [q(o3, { name: "roxy-agent/rx-ic-browser-control", class: "group-icon", size: "20", color: "var(--color-text-primary)" }), L("div", Wv, [L("div", { ref_key: "groupTitleRef", ref: i2, class: "group-title" }, B(e2.group.kind === "idle" ? t3.$t("\u7A7A\u95F2\u4E2D") : e2.group.title), 513)])]), q(o3, { name: e2.group.expanded ? "base/rx_ic_chevron_down" : "base/rx_ic_chevron_right", class: "chevron", size: "16" }, null, 8, ["name"])])]), _: 1 }, 8, ["content", "disabled"]), e2.group.expanded ? (P(), R("div", Gv, [(P(!0), R(z, null, G(e2.group.tasks, (e3) => (P(), R("article", { key: e3.id, class: "task-card" }, [L("div", Kv, [q(o3, { name: l2(e3), fallback: "base/rx_ic_earth", class: "task-flag", size: "16" }, null, 8, ["name"]), L("div", qv, [L("span", Jv, B(c2(e3)), 1), e3.platformUserName ? (P(), R("span", Yv, "\xB7")) : U("", !0), e3.platformUserName ? (P(), R("span", Xv, B(e3.platformUserName), 1)) : U("", !0)])]), e3.events?.length ? (P(), R("div", { key: 0, class: "task-current", title: e3.subtitle }, B(e3.subtitle), 9, Zv)) : U("", !0), q(Yn, { status: e3.status }, null, 8, ["status"])]))), 128))])) : U("", !0)], 2);
  };
} }), [["__scopeId", "data-v-620958b3"]]);
var $v = { class: "task-monitor-shell" };
var ey = ["aria-label", "aria-valuemax", "aria-valuemin", "aria-valuenow"];
var ty = { class: "task-monitor" };
var ny = { class: "monitor-header" };
var ry = { class: "monitor-copy" };
var iy = ["title", "aria-label"];
var ay = { key: 0, class: "task-groups" };
var oy = { key: 1, class: "task-monitor__empty" };
var sy = Z(M({ __name: "ProfileMonitorPanel", props: { groups: {}, maxWidth: {}, minWidth: {}, monitorWidth: {}, runningCount: {} }, emits: ["close", "resizeStart", "resizeStep", "toggleGroup"], setup(e2, { emit: t2 }) {
  let n2 = t2;
  return (t3, r2) => {
    let i2 = X;
    return P(), R("div", $v, [L("div", { class: "task-monitor-resize-handle", role: "separator", "aria-orientation": "vertical", "aria-label": t3.$t("\u8C03\u6574\u7A97\u53E3\u76D1\u63A7\u5BBD\u5EA6"), "aria-valuemax": e2.maxWidth, "aria-valuemin": e2.minWidth, "aria-valuenow": e2.monitorWidth, tabindex: "0", onKeydown: [r2[0] ||= ft(ut((e3) => n2("resizeStep", 16), ["prevent"]), ["left"]), r2[1] ||= ft(ut((e3) => n2("resizeStep", -16), ["prevent"]), ["right"])], onPointerdown: r2[2] ||= (e3) => n2("resizeStart", e3) }, null, 40, ey), L("aside", ty, [L("header", ny, [L("div", ry, [L("h2", null, B(t3.$t("\u7A97\u53E3\u76D1\u63A7")), 1)]), L("button", { class: "monitor-action", type: "button", title: t3.$t("\u5173\u95ED\u7A97\u53E3\u76D1\u63A7"), "aria-label": t3.$t("\u5173\u95ED\u7A97\u53E3\u76D1\u63A7"), onClick: r2[3] ||= (e3) => n2("close") }, [q(i2, { name: "base/rx_ic_chevron_right", size: "20", color: "var(--color-text-primary)" })], 8, iy)]), e2.groups.length > 0 ? (P(), R("div", ay, [(P(!0), R(z, null, G(e2.groups, (e3) => (P(), W(Qv, { key: e3.id, group: e3, onToggle: r2[4] ||= (e4) => n2("toggleGroup", e4) }, null, 8, ["group"]))), 128))])) : (P(), R("div", oy, [L("p", null, B(t3.$t("\u6CA1\u6709\u5DF2\u6253\u5F00\u7684\u6D4F\u89C8\u5668")), 1)]))])]);
  };
} }), [["__scopeId", "data-v-7206001f"]]);
var cy = { key: 0, class: "agent-settings-sidebar" };
var ly = ["href", "onClick"];
var uy = ["href", "onClick"];
var dy = ["href", "onClick"];
var fy = ["aria-label", "aria-valuemax", "aria-valuenow"];
var py = 1181;
var my = 320;
var hy = 280;
var gy = 480;
var _y = 220;
var vy = 200;
var yy = 360;
var by = 460;
var xy = 6e5;
var Sy = Z(M({ __name: "AgentConsoleShell", setup(e2) {
  let t2 = Be(() => Y(() => import("./live-chat-DNUnbM8O.js"), [])), n2 = !ae && !globalThis.isCloudPhoneApp;
  ce("agent-shell:setup:start"), He(() => {
    document.body.classList.add("agent-console-window"), ce("agent-shell:mounted");
  });
  let r2 = x();
  qn(), r2.initializeAgentBackendAuth().catch((e3) => {
    console.error("[agent-console] Failed to initialize Agent backend authentication:", e3);
  }), Pe(() => {
    document.body.classList.remove("agent-console-window");
  });
  let { activeConversation: i2, activeConversationId: a2, activeHitlRequest: o2, activeTodoProgress: s2, addPendingAttachments: c2, addPendingFolder: l2, addPendingPathAttachment: u2, cancelActiveRun: d2, conversationList: f2, conversationListHasMore: p2, conversationListLoadingMore: m2, isThinking: h2, loadMoreConversations: g2, loadEarlierMessages: _2, messageList: v2, messageHistoryHasMore: y2, messageHistoryLoading: b2, pendingAttachments: S2, pendingApprovalConversationIds: C2, profileCount: w2, prompt: T2, queuedPrompts: E2, removePendingAttachment: ee2, removeQueuedPrompt: te2, renameConversation: D2, reorderQueuedPrompt: ne2, restoreQueuedPrompt: O2, runningTaskCount: re2, taskGroupList: ie2, deleteConversation: oe2, selectConversation: se2, sendPrompt: k2, state: A2, startNewChat: le2, submitHitl: j2, toggleTaskGroup: ue2 } = mh();
  ce("agent-shell:setup-complete");
  let de2 = N(!1), fe2 = N(typeof window > "u" || window.innerWidth >= py), pe2 = F(() => fe2.value && w2.value > 0), me2 = F(() => de2.value && pe2.value), he2 = N(my), ge2 = N(_y), _e2 = N(null), ve2 = N(!1), ye2 = Ve(null), be2 = N(!1), xe2 = N(), Se2 = 0, Ce2 = F(() => ({ "--agent-sidebar-width": `${ge2.value}px`, "--task-monitor-width": `${he2.value}px` })), we2 = F(() => ie2.value.flatMap((e3) => e3.tasks.filter((e4) => e4.status === "running").map((t3) => `${e3.id}:${t3.id}`)));
  K(we2, (e3, t3) => {
    let n3 = new Set(t3);
    e3.some((e4) => !n3.has(e4)) && (de2.value = !0);
  });
  let Te2 = jt(), Ee2 = kt(), De2 = tn(), Oe2 = nn(), [, ke2] = Ct(), M2 = F(() => String(Te2.name ?? "").startsWith("agent-console-roxyclaw")), Ae2 = F(() => Te2.meta.agentConsoleLayout === "settings" || M2.value), je2 = /* @__PURE__ */ new Set(["agent-console-chat", "agent-console-conversation"]), Ne2 = /* @__PURE__ */ new Set(["agent-console-credits", "agent-console-roxyclaw", "agent-console-task-manager"]), Fe2 = /* @__PURE__ */ new Set([...Ne2, "agent-console-my-templates", "agent-console-template-store"]), Ie2 = N(null), Le2 = N(!1), Re2 = N(0), ze2 = F(() => Ie2.value?.type === "agent" && ["update", "downloaded", "failed"].includes(Ie2.value.status)), Ue2 = F(() => h2.value || re2.value > 0 || f2.value.some((e3) => e3.runningRunIds.length > 0));
  async function qe2(e3) {
    await k2({ conversationId: e3.conversationId, content: $t("\u8BF7\u4F60\u5C06\u521A\u624D\u7684\u4EFB\u52A1\u4FDD\u5B58\u4E3A\u6A21\u677F"), templateContext: { sourceReportId: e3.sourceReportId, report: e3.report } }) ? e3.resolve() : e3.reject(Error("Template save turn could not be started."));
  }
  let Je2 = F(() => a2.value ? { name: "agent-console-conversation", params: { conversationId: a2.value } } : { name: "agent-console-chat" }), Ye2 = null, Xe2 = null, z2 = null, Ze2 = null, Qe2 = null, G2 = null;
  function et2() {
    return typeof window > "u" ? gy : Math.max(hy, Math.min(gy, window.innerWidth - ge2.value - by));
  }
  function tt2(e3) {
    return Math.min(Math.max(e3, hy), et2());
  }
  function nt2(e3) {
    he2.value = tt2(he2.value + e3);
  }
  function rt2() {
    if (typeof window > "u") return yy;
    let e3 = me2.value ? he2.value : 0;
    return Math.max(vy, Math.min(yy, window.innerWidth - by - e3));
  }
  function it2(e3) {
    return Math.min(Math.max(e3, vy), rt2());
  }
  function at2(e3) {
    ge2.value = it2(ge2.value + e3);
  }
  function ot2() {
    Xe2?.(), Xe2 = null, document.body.classList.remove("agent-console-window--resizing-monitor");
  }
  function st2(e3) {
    if (e3.button !== 0) return;
    e3.preventDefault(), ot2();
    let t3 = e3.clientX, n3 = he2.value, r3 = (e4) => {
      he2.value = tt2(n3 + t3 - e4.clientX), ge2.value = it2(ge2.value);
    }, i3 = () => ot2();
    window.addEventListener("pointermove", r3), window.addEventListener("pointerup", i3), window.addEventListener("pointercancel", i3), window.addEventListener("blur", i3), document.body.classList.add("agent-console-window--resizing-monitor"), Xe2 = () => {
      window.removeEventListener("pointermove", r3), window.removeEventListener("pointerup", i3), window.removeEventListener("pointercancel", i3), window.removeEventListener("blur", i3);
    };
  }
  function ct2() {
    z2?.(), z2 = null, document.body.classList.remove("agent-console-window--resizing-sidebar");
  }
  function lt2(e3) {
    if (e3.button !== 0) return;
    e3.preventDefault(), ct2();
    let t3 = e3.clientX, n3 = ge2.value, r3 = (e4) => {
      ge2.value = it2(n3 + (e4.clientX - t3)), he2.value = tt2(he2.value);
    }, i3 = () => ct2();
    window.addEventListener("pointermove", r3), window.addEventListener("pointerup", i3), window.addEventListener("pointercancel", i3), window.addEventListener("blur", i3), document.body.classList.add("agent-console-window--resizing-sidebar"), z2 = () => {
      window.removeEventListener("pointermove", r3), window.removeEventListener("pointerup", i3), window.removeEventListener("pointercancel", i3), window.removeEventListener("blur", i3);
    };
  }
  function dt2(e3) {
    fe2.value !== e3 && (fe2.value = e3, e3 || (ot2(), de2.value = !1));
  }
  K(pe2, (e3) => {
    e3 || (de2.value = !1);
  });
  async function pt2() {
    if (globalThis.isElectron && ze2.value && !Le2.value) {
      Le2.value = !0;
      try {
        let e3 = await mt2(Te2.fullPath);
        e3.success || (ke2(-1, e3.message || $t("AI Agent \u66F4\u65B0\u5931\u8D25")), Le2.value = !1);
      } catch (e3) {
        console.error("Failed to restart agent for update:", e3), ke2(-1, e3 instanceof Error ? e3.message : $t("AI Agent \u66F4\u65B0\u5931\u8D25")), Le2.value = !1;
      }
    }
  }
  async function mt2(e3) {throw Error('Agent 随本地安装包更新，无独立云端更新器');}
  async function ht2() {
  }
  async function gt2() {return {updateAvailable:false,distribution:'local-package'};}
  function J2() {
    ze2.value && (Ue2.value ? De2.require({ header: $t("\u66F4\u65B0 AI Agent"), message: $t("\u5F53\u524D\u6709\u5BF9\u8BDD\u6B63\u5728\u8FDB\u884C\u4E2D\uFF0C\u66F4\u65B0\u4F1A\u4E2D\u65AD\u5F53\u524D\u5BF9\u8BDD\u3002\u786E\u8BA4\u7EE7\u7EED\u66F4\u65B0\u5417\uFF1F"), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u7EE7\u7EED\u66F4\u65B0") }, accept: () => {
      pt2();
    } }) : pt2());
  }
  function _t2(e3, t3) {
    return typeof e3 == "string" && t3.has(e3);
  }
  function vt2(e3) {
    return _t2(e3, je2);
  }
  function yt2(e3) {
    return _t2(e3, Ne2);
  }
  function bt2(e3) {
    return _t2(e3, Fe2);
  }
  function xt2(e3) {
    let t3 = f2.value.find((t4) => t4.id === e3);
    t3 && De2.require({ group: "agentConsoleDeleteConfirmDialog", header: $t("\u5220\u9664\u5BF9\u8BDD"), message: $t("\u5220\u9664\u540E\u65E0\u6CD5\u6062\u590D\uFF0C\u786E\u8BA4\u5220\u9664\u5BF9\u8BDD\u201C{name}\u201D\u5417\uFF1F", { name: t3.title }), acceptLabel: $t("\u5220\u9664"), rejectLabel: $t("\u53D6\u6D88"), accept: () => {
      oe2(e3);
    } });
  }
  function St2(e3) {
    let t3 = f2.value.find((t4) => t4.id === e3);
    t3 && Oe2.open(Hv, { props: { modal: !0, blockScroll: !0, dismissableMask: !1, draggable: !1, showHeader: !1, style: { width: "min(440px, calc(100vw - 32px))" }, pt: { root: "agent-console-dialog agent-console-rename-conversation-dialog", content: "!p-0 !overflow-hidden" } }, data: { initialTitle: t3.title, onSave: (t4) => D2(e3, t4) } });
  }
  function wt2() {
    ve2.value = !1, ye2.value = null;
  }
  function Tt2() {
    Se2 += 1, xe2.value = void 0, be2.value = !1;
  }
  async function Et2(e3) {
    let t3 = ++Se2;
    xe2.value = void 0, be2.value = !1, !await hh(e3, { startNewChat: le2, sendPrompt: k2, onRunStarted: ({ runId: e4 }) => {
      t3 === Se2 && (xe2.value = e4);
    } }) && t3 === Se2 && (xe2.value = void 0);
  }
  K(() => xe2.value ? A2.runsById[xe2.value]?.status : void 0, () => {
    gh(xe2.value, A2.runsById) && (xe2.value = void 0, be2.value = !0);
  }, { flush: "sync" });
  async function Dt2() {
    await Me();
    let e3 = _e2.value?.getNewChatElement() ?? null;
    e3 && (ye2.value = e3, ve2.value = !0);
  }
  async function Ot2() {
    wt2(), await le2(), Re2.value += 1;
  }
  return He(() => {
    let e3 = () => {
      dt2(window.innerWidth >= py), he2.value = tt2(he2.value), ge2.value = it2(ge2.value);
    };
    e3(), window.addEventListener("resize", e3), Ye2 = () => window.removeEventListener("resize", e3), globalThis.isElectron && (Ze2 = globalThis.electronAPI.on("mcp:navigate", (e4) => {
      e4 && Ee2.push(e4).catch(() => {
      });
    }), Qe2 = globalThis.electronAPI.on("mcp:resource-update", (e4) => {
      e4.type === "agent" && (Ie2.value = e4);
    }), ht2(), G2 = setInterval(() => {
      ht2();
    }, xy));
  }), Pe(() => {
    ot2(), ct2(), Ye2?.(), Ye2 = null, Ze2?.(), Ze2 = null, Qe2?.(), Qe2 = null, G2 &&= (clearInterval(G2), null);
  }), K(me2, () => {
    ge2.value = it2(ge2.value);
  }), Ir(de2, pe2, re2), (e3, r3) => {
    let x2 = X, w3 = We("RouterLink"), D3 = We("RouterView");
    return P(), R("div", { class: I(["agent-console", { "agent-console--monitor-open": V(me2) && !V(Ae2), "agent-console--settings": V(Ae2) }]), style: $e(V(Ce2)) }, [q(Th), V(Ae2) ? (P(), R("aside", cy, [q(w3, { custom: "", to: V(Je2) }, { default: H(({ href: t3, navigate: n3 }) => [L("a", { href: t3, class: "agent-settings-nav-item", onClick: n3 }, [q(x2, { name: "base/rx_ic_arrow_left", size: "18" }), L("span", null, B(e3.$t("\u8FD4\u56DE\u5E94\u7528")), 1)], 8, ly)]), _: 1 }, 8, ["to"]), q(w3, { custom: "", to: { name: "agent-console-roxyclaw" } }, { default: H(({ href: e4, isActive: t3, navigate: n3 }) => [L("a", { href: e4, class: I(["agent-settings-nav-item", { active: t3 }]), onClick: n3 }, [q(x2, { name: "roxy-agent/rx-ic-roxyclaw", size: "18" }), r3[8] ||= L("span", null, "Agent \u8BBE\u7F6E", -1)], 10, uy)]), _: 1 }), q(w3, { custom: "", to: { name: "agent-console-settings" } }, { default: H(({ href: t3, isExactActive: n3, navigate: r4 }) => [L("a", { href: t3, class: I(["agent-settings-nav-item", { active: n3 }]), onClick: r4 }, [q(x2, { name: "base/rx_ic_mcp", size: "18" }), L("span", null, B(e3.$t("MCP \u670D\u52A1")), 1)], 10, dy)]), _: 1 }), L("div", { class: "agent-settings-sidebar-resize-handle", role: "separator", "aria-orientation": "vertical", "aria-label": e3.$t("\u8C03\u6574\u4F1A\u8BDD\u680F\u5BBD\u5EA6"), "aria-valuemax": rt2(), "aria-valuemin": vy, "aria-valuenow": V(ge2), tabindex: "0", onKeydown: [r3[0] ||= ft(ut((e4) => at2(-16), ["prevent"]), ["left"]), r3[1] ||= ft(ut((e4) => at2(16), ["prevent"]), ["right"])], onPointerdown: lt2 }, null, 40, fy)])) : (P(), W(xv, { key: 1, ref_key: "agentSidebarRef", ref: _e2, "active-conversation-id": V(a2), conversations: V(f2), "has-more-conversations": V(p2), "loading-more-conversations": V(m2), "max-width": rt2(), "pending-approval-conversation-ids": V(C2), "min-width": vy, "sidebar-width": V(ge2), "update-info": V(Ie2), onDeleteConversation: xt2, onNewChat: Ot2, onOpenFeedback: e3.$showLiveChat, onRenameConversation: St2, onResizeStart: lt2, onResizeStep: at2, onRestartAgentForUpdate: J2, onSelectConversation: V(se2), onLoadMoreConversations: V(g2) }, null, 8, ["active-conversation-id", "conversations", "has-more-conversations", "loading-more-conversations", "max-width", "pending-approval-conversation-ids", "sidebar-width", "update-info", "onOpenFeedback", "onSelectConversation", "onLoadMoreConversations"])), q(D3, null, { default: H(({ Component: e4, route: t3 }) => [V(Ae2) ? (P(), R("main", { key: 0, class: I(["agent-settings-content-shell", { "agent-settings-content-shell--roxyclaw": V(M2) }]) }, [L("section", { class: I(["agent-settings-panel", { "agent-settings-panel--roxyclaw": V(M2) }]) }, [yt2(t3.name) ? (P(), W(Ge(e4), { key: 0, prompt: V(T2), "onUpdate:prompt": r3[2] ||= (e5) => Ke(T2) ? T2.value = e5 : null, "active-conversation-id": V(a2), "route-title": t3.meta.title, thinking: V(h2), onSend: V(k2) }, null, 40, ["prompt", "active-conversation-id", "route-title", "thinking", "onSend"])) : (P(), W(Ge(e4), { key: 1 }))], 2)], 2)) : vt2(t3.name) ? (P(), W(Ge(e4), { key: 1, prompt: V(T2), "onUpdate:prompt": r3[3] ||= (e5) => Ke(T2) ? T2.value = e5 : null, "active-conversation-id": V(a2), "conversation-title": V(i2)?.title, "composer-focus-key": V(Re2), "hitl-request": V(o2), messages: V(v2), "onboarding-completion-visible": V(be2), "has-earlier-messages": V(y2), "loading-earlier-messages": V(b2), "pending-attachments": V(S2), "queued-prompts": V(E2), "route-title": t3.meta.title, thinking: V(h2), "todo-progress": V(s2), onAddAttachments: V(c2), onAddFolder: V(l2), onAddPathAttachment: V(u2), onRemoveAttachment: V(ee2), onRemoveQueuedPrompt: V(te2), onReorderQueuedPrompt: V(ne2), onRestoreQueuedPrompt: V(O2), onLoadEarlierMessages: V(_2), onSaveTemplate: qe2, onOnboardingComplete: Dt2, onOnboardingCompletionDismiss: r3[4] ||= (e5) => be2.value = !1, onOnboardingReset: Tt2, onOnboardingRun: Et2, onSend: V(k2), onStop: V(d2), onSubmitHitl: V(j2) }, null, 40, ["prompt", "active-conversation-id", "conversation-title", "composer-focus-key", "hitl-request", "messages", "onboarding-completion-visible", "has-earlier-messages", "loading-earlier-messages", "pending-attachments", "queued-prompts", "route-title", "thinking", "todo-progress", "onAddAttachments", "onAddFolder", "onAddPathAttachment", "onRemoveAttachment", "onRemoveQueuedPrompt", "onReorderQueuedPrompt", "onRestoreQueuedPrompt", "onLoadEarlierMessages", "onSend", "onStop", "onSubmitHitl"])) : yt2(t3.name) ? (P(), W(Ge(e4), { key: 2, prompt: V(T2), "onUpdate:prompt": r3[5] ||= (e5) => Ke(T2) ? T2.value = e5 : null, "active-conversation-id": V(a2), "route-title": t3.meta.title, thinking: V(h2) }, null, 40, ["prompt", "active-conversation-id", "route-title", "thinking"])) : bt2(t3.name) ? (P(), W(Ge(e4), { key: 3, prompt: V(T2), "onUpdate:prompt": r3[6] ||= (e5) => Ke(T2) ? T2.value = e5 : null }, null, 40, ["prompt"])) : (P(), W(Ge(e4), { key: 4 }))]), _: 1 }), V(me2) && !V(Ae2) ? (P(), W(sy, { key: 2, groups: V(ie2), "max-width": et2(), "min-width": hy, "monitor-width": V(he2), "running-count": V(re2), onClose: r3[7] ||= (e4) => de2.value = !1, onResizeStart: st2, onResizeStep: nt2, onToggleGroup: V(ue2) }, null, 8, ["groups", "max-width", "monitor-width", "running-count", "onToggleGroup"])) : U("", !0), q(Nv, { "callout-below-target": "", "interactive-target": "", label: e3.$t("\u70B9\u51FB\u65B0\u5BF9\u8BDD\u7EE7\u7EED\u4F53\u9A8C"), target: V(ye2), visible: V(ve2), onDismiss: wt2 }, null, 8, ["label", "target", "visible"]), V(n2) ? (P(), W(V(t2), { key: 3 })) : U("", !0)], 6);
  };
} }), [["__scopeId", "data-v-0bb55c34"]]);
var Cy = ["src"];
var wy = { class: "agent-console-version-guard__hero" };
var Ty = { class: "agent-console-version-guard__sr-only" };
var Ey = ["src"];
var Dy = "4.0.2";
var Oy = Z(M({ __name: "index", setup(e2) {
  ce("agent-page:setup:start");
  let t2 = N(!globalThis.isElectron || !!globalThis.$appVersion), n2 = cn(), { locale: r2 } = gt(), i2 = F(() => !globalThis.isElectron || t2.value && xe()), a2 = F(() => r2.value.toLowerCase().startsWith("zh")), o2 = F(() => n2.realTheme === "dark"), s2 = F(() => k(`agent/version-guard/mesh-${o2.value ? "dark" : "light"}.svg`)), c2 = F(() => {
    let e3 = a2.value ? "zh" : "en", t3 = o2.value ? "dark" : "light";
    return k(`agent/version-guard/showcase-${e3}-${t3}.svg`);
  }), l2 = F(() => a2.value ? "\u7115\u65B0\u5347\u7EA7" : "AI Agent New Upgrade"), u2 = F(() => a2.value ? "\u66F4\u65B0 Roxy \u6D4F\u89C8\u5668\u81F3\u6700\u65B0\u7248\u672C\u4F53\u9A8C" : "Update Roxy Browser to the latest version");
  He(() => {
    document.body.classList.add("agent-console-window"), ce("agent-page:mounted");
  }), Pe(() => {
    document.body.classList.remove("agent-console-window");
  });
  async function d2() {
    if (globalThis.isElectron) try {
      let e3 = j("agent-page:resolveAppVersion"), t3 = globalThis.$appVersion || await globalThis.electronAPI.send("app:getAppVersion");
      globalThis.$appVersion = t3, e3({ version: t3 });
    } catch (e3) {
      console.warn("[agent-console] Failed to resolve app version:", e3);
    } finally {
      t2.value = !0, ce("agent-page:appVersionResolved", { supported: xe() });
    }
  }
  return d2(), (e3, n3) => V(i2) ? (P(), W(Sy, { key: 0 })) : V(t2) ? (P(), R("main", { key: 1, class: I(["agent-console-version-guard", { "agent-console-version-guard--dark": V(o2) }]) }, [L("img", { class: "agent-console-version-guard__mesh", src: V(s2), alt: "", "aria-hidden": "true" }, null, 8, Cy), q(Fl, { class: "agent-console-version-guard__brand" }), L("section", wy, [L("h1", null, [V(a2) ? (P(), R(z, { key: 0 }, [n3[0] ||= L("span", { class: "agent-console-version-guard__title-latin" }, "AI Agent\xA0", -1), L("span", null, B(V(l2)), 1)], 64)) : (P(), R(z, { key: 1 }, [Je(B(V(l2)), 1)], 64))]), L("p", null, B(V(u2)), 1), L("span", Ty, B(e3.$t("\u5F53\u524D\u7248\u672C\u4E0D\u652F\u6301 AI Agent\uFF0C\u8BF7\u66F4\u65B0\u5230 v{version} \u6216\u66F4\u9AD8\u7248\u672C\u3002", { version: Dy })), 1)]), L("img", { class: "agent-console-version-guard__showcase", src: V(c2), alt: "", "aria-hidden": "true" }, null, 8, Ey)], 2)) : U("", !0);
} }), [["__scopeId", "data-v-e391a3dd"]]);
var Ay = { "copy-editing": "copy-editing", "ad-creative": "ad-creative", "tiktok-captions": "tiktok-captions", "reddit-post": "reddit-posts" };
var Ny = { "copy-editing": [{ labels: ["\u539F\u6587", "copy", "\u0442\u0435\u043A\u0441\u0442"], values: { en: "This smart water bottle is made of 316 stainless steel, offers long-lasting insulation, supports app connectivity, and lets you check your water intake anytime. It is ideal for office workers.", ru: "\u042D\u0442\u0430 \u0443\u043C\u043D\u0430\u044F \u0431\u0443\u0442\u044B\u043B\u043A\u0430 \u0434\u043B\u044F \u0432\u043E\u0434\u044B \u0438\u0437\u0433\u043E\u0442\u043E\u0432\u043B\u0435\u043D\u0430 \u0438\u0437 \u043D\u0435\u0440\u0436\u0430\u0432\u0435\u044E\u0449\u0435\u0439 \u0441\u0442\u0430\u043B\u0438 316, \u0434\u043E\u043B\u0433\u043E \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u0442\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0443, \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043A \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044E \u0438 \u043F\u043E\u0437\u0432\u043E\u043B\u044F\u0435\u0442 \u0432 \u043B\u044E\u0431\u043E\u0439 \u043C\u043E\u043C\u0435\u043D\u0442 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0432\u044B\u043F\u0438\u0442\u043E\u0439 \u0432\u043E\u0434\u044B. \u041F\u043E\u0434\u0445\u043E\u0434\u0438\u0442 \u0434\u043B\u044F \u043E\u0444\u0438\u0441\u043D\u044B\u0445 \u0440\u0430\u0431\u043E\u0442\u043D\u0438\u043A\u043E\u0432.", zh: "\u8FD9\u6B3E\u667A\u80FD\u6C34\u676F\u91C7\u7528316\u4E0D\u9508\u94A2\u6750\u8D28\uFF0C\u957F\u6548\u4FDD\u6E29\uFF0C\u652F\u6301APP\u8FDE\u63A5\uFF0C\u968F\u65F6\u67E5\u770B\u996E\u6C34\u91CF\uFF0C\u9002\u5408\u4E0A\u73ED\u65CF\u4F7F\u7528\u3002" } }, { labels: ["\u53D7\u4F17", "audience", "\u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438"], values: { en: "Urban professionals aged 25-35 who care about their health but lead busy lives, prefer minimalist design, and often forget to drink water", ru: "\u0413\u043E\u0440\u043E\u0434\u0441\u043A\u0438\u0435 \u043E\u0444\u0438\u0441\u043D\u044B\u0435 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0438 25-35 \u043B\u0435\u0442, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0437\u0430\u0431\u043E\u0442\u044F\u0442\u0441\u044F \u043E \u0437\u0434\u043E\u0440\u043E\u0432\u044C\u0435, \u043D\u043E \u0432\u0435\u0434\u0443\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u043E\u0431\u0440\u0430\u0437 \u0436\u0438\u0437\u043D\u0438, \u043B\u044E\u0431\u044F\u0442 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u0438\u0441\u0442\u0438\u0447\u043D\u044B\u0439 \u0434\u0438\u0437\u0430\u0439\u043D \u0438 \u0447\u0430\u0441\u0442\u043E \u0437\u0430\u0431\u044B\u0432\u0430\u044E\u0442 \u043F\u0438\u0442\u044C \u0432\u043E\u0434\u0443", zh: "25-35\u5C81\u90FD\u5E02\u767D\u9886\uFF0C\u6CE8\u91CD\u5065\u5EB7\u4F46\u5FD9\u788C\uFF0C\u559C\u6B22\u7B80\u7EA6\u8BBE\u8BA1\uFF0C\u7ECF\u5E38\u5FD8\u8BB0\u559D\u6C34" } }, { labels: ["\u8BED\u6C14", "tone", "\u0442\u043E\u043D"], values: { en: "Friendly, conversational, and slightly encouraging; avoid stiff technical jargon", ru: "\u0414\u0440\u0443\u0436\u0435\u043B\u044E\u0431\u043D\u044B\u0439, \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u043D\u044B\u0439, \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u0432\u0434\u043E\u0445\u043D\u043E\u0432\u043B\u044F\u044E\u0449\u0438\u0439 \u0442\u043E\u043D; \u0438\u0437\u0431\u0435\u0433\u0430\u0442\u044C \u0441\u0443\u0445\u0438\u0445 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0442\u0435\u0440\u043C\u0438\u043D\u043E\u0432", zh: "\u4EB2\u5207\u3001\u751F\u6D3B\u5316\u3001\u5E26\u70B9\u9F13\u52B1\u611F\uFF0C\u907F\u514D\u751F\u786C\u6280\u672F\u672F\u8BED" } }], "ad-creative": [{ labels: ["\u4EA7\u54C1/\u670D\u52A1", "product or service", "\u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430 \u0438\u043B\u0438 \u0443\u0441\u043B\u0443\u0433\u0438"], values: { en: "anti-detect browser", ru: "\u0430\u043D\u0442\u0438\u0434\u0435\u0442\u0435\u043A\u0442-\u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430", zh: "\u6307\u7EB9\u6D4F\u89C8\u5668" } }, { labels: ["\u53D7\u4F17", "audience", "\u0446\u0435\u043B\u0435\u0432\u0430\u044F \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F"], values: { en: "cross-border e-commerce sellers", ru: "\u043F\u0440\u043E\u0434\u0430\u0432\u0446\u043E\u0432, \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0449\u0438\u0445 \u0432 \u0441\u0444\u0435\u0440\u0435 \u0442\u0440\u0430\u043D\u0441\u0433\u0440\u0430\u043D\u0438\u0447\u043D\u043E\u0439 \u044D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0439 \u0442\u043E\u0440\u0433\u043E\u0432\u043B\u0438", zh: "\u8DE8\u5883\u5546\u5BB6" } }, { labels: ["\u5E73\u53F0\u548C\u683C\u5F0F", "platform and format", "\u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u0438 \u0444\u043E\u0440\u043C\u0430\u0442"], values: { en: "TikTok", ru: "TikTok", zh: "TikTok" } }], "tiktok-captions": [{ labels: ["\u4EA7\u54C1\u6216\u4E3B\u9898", "product or topic", "\u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0435 \u0438\u043B\u0438 \u0442\u0435\u043C\u0435"], values: { en: "Optimum Nutrition protein powder", ru: "\u043F\u0440\u043E\u0442\u0435\u0438\u043D\u043E\u0432\u044B\u0439 \u043F\u043E\u0440\u043E\u0448\u043E\u043A Optimum Nutrition", zh: "Optimum Nutrition \u86CB\u767D\u7C89" } }, { labels: ["\u76EE\u6807\u4EBA\u7FA4", "audience", "\u0446\u0435\u043B\u0435\u0432\u043E\u0439 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438"], values: { en: "fitness enthusiasts", ru: "\u0444\u0438\u0442\u043D\u0435\u0441-\u044D\u043D\u0442\u0443\u0437\u0438\u0430\u0441\u0442\u044B", zh: "\u5065\u8EAB\u4EBA\u58EB" } }], "reddit-post": [{ labels: ["\u4E3B\u9898\u6216\u4EA7\u54C1", "Product or topic", "Product name or topic", "\u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430 \u0438\u043B\u0438 \u0442\u0435\u043C\u0430"], values: { en: "DeepSeek", ru: "DeepSeek", zh: "DeepSeek" } }, { labels: ["subreddit", "Target subreddit", "Target subreddit, e.g. r/Entrepreneur or r/Productivity", "\u0446\u0435\u043B\u0435\u0432\u043E\u0439 subreddit", "\u0446\u0435\u043B\u0435\u0432\u043E\u0439 subreddit, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 r/Entrepreneur \u0438\u043B\u0438 r/Productivity"], values: { en: "r/selfhosted", ru: "r/selfhosted", zh: "r/selfhosted" } }, { labels: ["\u53D1\u5E16\u76EE\u6807", "Posting goal", "Posting goal, e.g. get feedback/share experience/spark discussion/soft promotion", "\u0446\u0435\u043B\u044C \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438", "\u0446\u0435\u043B\u044C \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043E\u0431\u0440\u0430\u0442\u043D\u0443\u044E \u0441\u0432\u044F\u0437\u044C"], values: { en: "discuss the cost-effectiveness of the DeepSeek API and attract self-hosting enthusiasts", ru: "\u043E\u0431\u0441\u0443\u0434\u0438\u0442\u044C \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u0443\u044E \u044D\u0444\u0444\u0435\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C API DeepSeek \u0438 \u043F\u0440\u0438\u0432\u043B\u0435\u0447\u044C \u044D\u043D\u0442\u0443\u0437\u0438\u0430\u0441\u0442\u043E\u0432 \u0441\u0430\u043C\u043E\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u0445\u043E\u0441\u0442\u0438\u043D\u0433\u0430", zh: "\u8BA8\u8BBA DeepSeek API \u7684\u6210\u672C\u6548\u76CA\uFF0C\u5438\u5F15\u81EA\u90E8\u7F72\u7231\u597D\u8005\u5173\u6CE8" } }, { labels: ["Target users, e.g. independent store sellers", "\u0446\u0435\u043B\u0435\u0432\u0430\u044F \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \u043F\u0440\u043E\u0434\u0430\u0432\u0446\u044B \u043D\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043C\u044B\u0445 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432"], values: { en: "software developers", ru: "\u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u0438 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043D\u043E\u0433\u043E \u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0435\u043D\u0438\u044F" } }, { labels: ["Expressions to avoid, e.g. too salesy", "\u0444\u043E\u0440\u043C\u0443\u043B\u0438\u0440\u043E\u0432\u043A\u0438 \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0443\u0436\u043D\u043E \u0438\u0437\u0431\u0435\u0433\u0430\u0442\u044C, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0440\u0435\u043A\u043B\u0430\u043C\u043D\u044B\u0439 \u0442\u043E\u043D"], values: { en: "too salesy", ru: "\u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0440\u0435\u043A\u043B\u0430\u043C\u043D\u044B\u0439 \u0442\u043E\u043D" } }] };
function Py(e2) {
  let t2 = e2?.trim().toLowerCase();
  return t2?.startsWith("en") ? "en" : t2?.startsWith("ru") ? "ru" : "zh";
}
function Fy(e2) {
  return e2.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
function Ly(e2, t2) {
  let n2 = gr(e2).find((e3) => e3.kind === "skill" && e3.skillPath), r2 = t2.trim();
  return n2 ? `${n2.raw} ${r2}`.trim() : "";
}
function Ry(e2, t2, n2) {
  let r2 = /* @__PURE__ */ new Map(), i2 = Py(n2);
  Ny[t2].forEach((e3) => {
    let t3 = e3.values[i2];
    t3 && e3.labels.forEach((e4) => {
      r2.set(Fy(e4), t3);
    });
  });
  let a2 = 0, o2 = "";
  return gr(e2).forEach((t3) => {
    if (t3.kind !== "input" && t3.kind !== "textarea" && t3.kind !== "url") return;
    let n3 = r2.get(Fy(t3.title));
    n3 && (o2 += e2.slice(a2, t3.index), o2 += `[${t3.kind}:${t3.title}](${n3})`, a2 = t3.index + t3.raw.length);
  }), a2 ? `${o2}${e2.slice(a2)}` : e2;
}
var sS = { render: () => null };
var cS = { class: "agent-copy-notification__content" };
var lS = ["aria-label"];
var uS = 3e3;
var dS = Z(M({ __name: "AgentCopyNotification", setup(e2, { expose: t2 }) {
  let n2 = N(!1), r2 = N(0), i2;
  function a2() {
    i2 !== void 0 && (window.clearTimeout(i2), i2 = void 0);
  }
  function o2() {
    a2(), i2 = window.setTimeout(s2, uS);
  }
  function s2() {
    a2(), n2.value = !1;
  }
  function c2() {
    a2(), r2.value += 1, n2.value = !0;
  }
  return t2({ show: c2 }), ze(a2), (e3, t3) => (P(), W(tt, { to: "body" }, [q(mt, { name: "agent-copy-notification", onAfterEnter: o2 }, { default: H(() => [V(n2) ? (P(), R("div", { key: V(r2), class: "agent-copy-notification", role: "status", "aria-live": "polite" }, [L("span", cS, [t3[0] ||= L("svg", { class: "agent-copy-notification__success-icon", viewBox: "0 0 16 16", "aria-hidden": "true" }, [L("circle", { cx: "8", cy: "8", r: "7.333" }), L("path", { d: "m5 8 2 2 4-4" })], -1), L("span", null, B(e3.$t("\u5DF2\u590D\u5236")), 1)]), L("button", { class: "agent-copy-notification__close", type: "button", "aria-label": e3.$t("\u5173\u95ED"), onClick: s2 }, [...t3[1] ||= [L("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, [L("path", { d: "m4.667 4.667 6.666 6.666m0-6.666-6.666 6.666" })], -1)]], 8, lS)])) : U("", !0)]), _: 1 })]));
} }), [["__scopeId", "data-v-d8dd93db"]]);
var fS = ["tabindex", "aria-label", "onKeydown"];
var pS = Z(M({ __name: "AgentCopyControl", props: { text: { default: "" }, size: { default: 14 }, copiedDuration: { default: br }, ariaLabel: {}, tooltip: {}, copiedTooltip: {}, disabled: { type: Boolean } }, emits: ["copied", "error"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, i2 = N(!1), a2 = null, o2 = F(() => n2.disabled || !n2.text), s2 = F(() => i2.value ? n2.copiedTooltip || $t("\u5DF2\u590D\u5236") : n2.tooltip || n2.ariaLabel || $t("\u590D\u5236")), c2 = F(() => i2.value ? Dr : yr);
  async function l2() {
    if (!o2.value) try {
      if (!await Tr(n2.text)) return;
      i2.value = !0, r2("copied", n2.text), a2 && window.clearTimeout(a2), a2 = window.setTimeout(() => {
        i2.value = !1, a2 = null;
      }, n2.copiedDuration);
    } catch (e3) {
      r2("error", e3);
    }
  }
  return ze(() => {
    a2 && window.clearTimeout(a2);
  }), (t3, n3) => {
    let r3 = X;
    return P(), W(Rr, { content: V(s2), placement: "top", offset: 8, disabled: V(o2) }, { default: H(() => [L("span", { class: I(["agent-copy-control", { "is-copied": V(i2), "is-disabled": V(o2) }]), role: "button", tabindex: V(o2) ? -1 : 0, "aria-label": V(s2), onClick: ut(l2, ["stop"]), onKeydown: [ft(ut(l2, ["prevent", "stop"]), ["enter"]), ft(ut(l2, ["prevent", "stop"]), ["space"])] }, [q(r3, { name: V(c2), size: e2.size, color: "currentColor" }, null, 8, ["name", "size"])], 42, fS)]), _: 1 }, 8, ["content", "disabled"]);
  };
} }), [["__scopeId", "data-v-83965306"]]);
function mS(e2) {
  return e2.type === "tool_call" && (e2.toolName === "spawn_agent" || e2.toolName.endsWith("__spawn_agent"));
}
function hS(e2) {
  for (let t2 = e2.length - 1; t2 >= 0; t2--) {
    let n2 = e2[t2];
    if (n2.type !== "thinking") return n2;
  }
  return e2.at(-1);
}
function gS(e2, t2) {
  return e2.type === "script_log" && !!t2.toolId && e2.toolId === t2.toolId;
}
function _S(e2, t2 = "root") {
  let n2 = [], r2 = [];
  function i2() {
    r2.length !== 0 && (r2.length === 1 ? n2.push({ type: "event", event: r2[0] }) : n2.push({ type: "group", id: `event-group-${t2}-${r2[0].id}`, events: r2 }), r2 = []);
  }
  for (let t3 = 0; t3 < e2.length; ) {
    let a2 = e2[t3];
    if (a2.type === "content") i2(), a2.content.trim() && n2.push({ type: "content", event: a2 }), t3 += 1;
    else if (a2.type === "script_log") {
      let o2 = [a2], s2 = t3 + 1;
      for (; s2 < e2.length && gS(e2[s2], a2); ) o2.push(e2[s2]), s2 += 1;
      o2.length === 1 ? (r2.push(a2), t3 += 1) : (i2(), n2.push({ type: "script_logs", id: a2.id, events: o2 }), t3 = s2);
    } else mS(a2) || a2.type === "context_compacted" || a2.type === "retrying" || a2.type === "agent_lifecycle" || a2.type === "hitl" ? (i2(), n2.push({ type: "event", event: a2 }), t3 += 1) : (r2.push(a2), t3 += 1);
  }
  return i2(), n2;
}
function vS(e2, t2 = "root") {
  let n2 = [], r2 = [], i2 = 0;
  function a2() {
    r2.length !== 0 && (n2.push({ type: "events", id: `${t2}-events-${i2++}-${r2[0].id}`, events: r2 }), r2 = []);
  }
  for (let t3 of e2) t3.type === "agent_lifecycle" ? (a2(), n2.push({ type: "agent_lifecycle", id: t3.id, event: t3 })) : r2.push(t3);
  return a2(), n2;
}
var yS = 50;
var bS = 4;
var xS = 1e4;
var SS = /* @__PURE__ */ new Map();
var CS = /* @__PURE__ */ new Map();
function wS(e2) {
  return [...new Set(e2.map((e3) => e3.trim()).filter(Boolean))];
}
function TS(e2) {
  return { ...e2.windowSortNum === void 0 ? {} : { windowSortNum: e2.windowSortNum }, ...e2.workspaceName ? { workspaceName: e2.workspaceName } : {}, ...e2.lastCountry || e2.country ? { countryCode: (e2.lastCountry || e2.country)?.toUpperCase() } : {}, ...e2.platformUserName ? { platformUserName: e2.platformUserName } : {} };
}
function ES(e2) {
  if (e2.windowSortNum === void 0) return "";
  let t2 = Ft(e2.workspaceName);
  return t2 ? `${t2}-${e2.windowSortNum}` : String(e2.windowSortNum);
}
async function DS(e2) {
  let t2 = await A.window.userGetWindowInfoListList({ page_index: 1, page_size: e2.length, dirIds: e2.join(","), isDelete: 0, orderName: "createTime", orderType: "desc" });
  if (t2.code !== 0) throw Error(t2.msg || "Failed to load task report windows");
  let n2 = Date.now() + xS, r2 = new Set(e2);
  for (let e3 of t2.data?.rows ?? []) e3.dirId && r2.has(e3.dirId) && (SS.set(e3.dirId, { expiresAt: n2, info: TS(e3) }), r2.delete(e3.dirId));
  for (let e3 of r2) SS.set(e3, { expiresAt: n2 });
}
async function OS(e2) {
  let t2 = [];
  for (let n2 = 0; n2 < e2.length; n2 += yS) t2.push(e2.slice(n2, n2 + yS));
  for (let e3 = 0; e3 < t2.length; e3 += bS) await Promise.all(t2.slice(e3, e3 + bS).map(async (e4) => {
    let t3 = e4.join(","), n2 = CS.get(t3) ?? DS(e4);
    CS.set(t3, n2);
    try {
      await n2;
    } finally {
      CS.delete(t3);
    }
  }));
}
async function kS(e2) {
  let t2 = wS(e2);
  if (t2.length === 0) return /* @__PURE__ */ new Map();
  let n2 = Date.now(), r2 = t2.filter((e3) => {
    let t3 = SS.get(e3);
    return !t3 || n2 >= t3.expiresAt;
  });
  return r2.length > 0 && await OS(r2), new Map(t2.flatMap((e3) => {
    let t3 = SS.get(e3)?.info;
    return t3 ? [[e3, t3]] : [];
  }));
}
function AS(e2, t2) {
  return t2 === "done" && e2.at(-1)?.type === "task_report";
}
var jS = ["aria-hidden", "inert"];
var MS = { class: "agent-collapse__content" };
var NS = Z(M({ __name: "AgentCollapse", props: { expanded: { type: Boolean } }, setup(e2) {
  return (t2, n2) => (P(), W(mt, { name: "agent-collapse" }, { default: H(() => [e2.expanded ? (P(), R("div", { key: 0, class: "agent-collapse", "aria-hidden": !e2.expanded, inert: !e2.expanded || void 0 }, [L("div", MS, [Fe(t2.$slots, "default", {}, void 0, !0)])], 8, jS)) : U("", !0)]), _: 3 }));
} }), [["__scopeId", "data-v-cec3b461"]]);
function PS(e2) {
  return `thinking:${e2.id}`;
}
function FS(e2) {
  return `script-grid:${e2.id}`;
}
function IS(e2, t2) {
  let n2 = {};
  for (let r2 of e2) {
    if (r2.type === "event") {
      r2.event.type === "thinking" && t2[r2.event.id] === !0 && (n2[PS(r2.event)] = `${r2.event.status}:${r2.event.content.length}`);
      continue;
    }
    if (r2.type === "script_logs") {
      if (t2[r2.id] !== !0) continue;
      let e4 = r2.events.at(-1), i3 = e4?.lines.at(-1);
      n2[FS(r2)] = `${r2.events.length}:${e4?.id ?? ""}:${e4?.lines.length ?? 0}:${i3?.message.length ?? 0}`;
      continue;
    }
    if (t2[r2.id] !== !0) continue;
    let e3 = r2.events.at(-1);
    if (!e3) continue;
    let i2 = `${r2.events.length}:${e3.id}`;
    e3.type === "thinking" && (i2 = `${i2}:${e3.content.length}`), n2[r2.id] = i2;
  }
  return n2;
}
var LS = { class: "script-log-panel__title" };
var RS = ["title"];
var zS = Z(M({ __name: "AgentScriptLogPanel", props: { event: {}, windowLabel: {}, compact: { type: Boolean, default: !1 } }, setup(e2) {
  let t2 = e2, n2 = N(null), r2 = N(!0), i2 = N({ canScrollUp: !1, canScrollDown: !1 }), a2, o2 = F(() => t2.event.lines.map((e3) => e3.message).join(`
`));
  function s2() {
    let e3 = n2.value;
    if (!e3) return;
    let t3 = e3.scrollHeight - e3.clientHeight;
    i2.value = { canScrollUp: t3 > 1 && e3.scrollTop > 1, canScrollDown: t3 > 1 && e3.scrollTop < t3 - 1 }, document.activeElement === e3 && (r2.value = t3 <= 1 || e3.scrollTop >= t3 - 1);
  }
  function c2() {
    n2.value?.focus({ preventScroll: !0 });
  }
  function l2() {
    r2.value = !0, requestAnimationFrame(() => {
      let e3 = n2.value;
      e3 && (e3.scrollTop = e3.scrollHeight, s2());
    });
  }
  function u2() {
    r2.value && Me(() => {
      let e3 = n2.value;
      e3 && (e3.scrollTop = e3.scrollHeight, s2());
    });
  }
  return K(() => `${t2.event.status}:${t2.event.lines.length}:${t2.event.lines.at(-1)?.message.length ?? 0}`, u2, { flush: "post" }), He(() => {
    typeof ResizeObserver < "u" && n2.value && (a2 = new ResizeObserver(s2), a2.observe(n2.value)), u2(), Me(s2);
  }), ze(() => {
    a2?.disconnect();
  }), (t3, r3) => (P(), R("section", { class: I(["script-log-panel", { "script-log-panel--compact": e2.compact }]) }, [L("header", LS, [L("span", { class: "script-log-panel__window-label", title: e2.windowLabel }, B(e2.windowLabel), 9, RS), q(pS, { text: V(o2) }, null, 8, ["text"])]), L("pre", { ref_key: "outputElement", ref: n2, class: I(["script-log-panel__output", { "scroll-mask--top": V(i2).canScrollUp, "scroll-mask--bottom": V(i2).canScrollDown }]), tabindex: "-1", onBlur: l2, onPointerdown: c2, onScrollPassive: s2, onWheelPassive: c2 }, B(V(o2)), 35)], 2));
} }), [["__scopeId", "data-v-a27ba244"]]);
var BS = { class: "web-search-url" };
var VS = { key: 0, class: "web-search-favicon-slot" };
var HS = ["src"];
var US = { class: "web-search-url__text" };
var WS = Z(M({ __name: "WebSearchToolLabel", props: { event: {}, highlight: { type: Boolean, default: !1 } }, setup(e2) {
  let t2 = e2, n2 = F(() => du(t2.event.input)), r2 = F(() => Fu(t2.event.toolName, t2.event.status, t2.event.input, { finished: t2.event.finished })), i2 = F(() => {
    if (n2.value?.action === "open_page" || n2.value?.action === "find_in_page") return n2.value;
  }), a2 = F(() => {
    if (!i2.value) return;
    let e3 = r2.value.indexOf(i2.value.url);
    if (!(e3 < 0)) return { before: r2.value.slice(0, e3), after: r2.value.slice(e3 + i2.value.url.length) };
  }), o2 = N(!1), s2 = N(!1);
  return K(() => i2.value?.faviconUrl, () => {
    o2.value = !1, s2.value = !1;
  }, { immediate: !0 }), (t3, n3) => {
    let c2 = X;
    return V(i2) && V(a2) ? (P(), R("span", { key: 0, class: I(["web-search-label", { "process-running-text": e2.highlight }]) }, [Je(B(V(a2).before), 1), L("span", BS, [V(i2).faviconUrl ? (P(), R("span", VS, [q(c2, { class: I(["web-search-favicon web-search-favicon--fallback", { "web-search-favicon--hidden": V(o2) }]), name: V(cr), size: "14", color: "var(--color-text-tertiary)", "aria-hidden": "true" }, null, 8, ["class", "name"]), V(s2) ? U("", !0) : (P(), R("img", { key: 0, class: I(["web-search-favicon", { "web-search-favicon--loaded": V(o2) }]), src: V(i2).faviconUrl, alt: "", decoding: "async", referrerpolicy: "no-referrer", onError: n3[0] ||= (e3) => s2.value = !0, onLoad: n3[1] ||= (e3) => o2.value = !0 }, null, 42, HS))])) : U("", !0), L("span", US, B(V(i2).url), 1)]), Je(B(V(a2).after), 1)], 2)) : (P(), R("span", { key: 1, class: I({ "process-running-text": e2.highlight }) }, B(V(r2)), 3));
  };
} }), [["__scopeId", "data-v-92f0c6e7"]]);
var GS = { key: 0, class: "process-content" };
var KS = { key: 0, class: "process-event" };
var qS = ["onClick"];
var JS = { key: 1, class: "inline-event" };
var YS = { key: 2, class: "process-event" };
var XS = ["onClick"];
var ZS = { class: "event-detail-content" };
var QS = { key: 3, class: "inline-event" };
var $S = { key: 4, class: "inline-event" };
var eC = { key: 5, class: "process-event" };
var tC = ["onClick"];
var nC = { class: "event-detail-content" };
var rC = { key: 0, class: "hitl-event__answers" };
var iC = { class: "hitl-event__detail" };
var aC = { key: 0 };
var oC = { key: 1, class: "hitl-event__body" };
var sC = { key: 0, class: "hitl-event__detail" };
var cC = { key: 6, class: "inline-event" };
var lC = { key: 2, class: "process-event" };
var uC = ["onClick"];
var dC = { class: "event-detail-content" };
var fC = ["onScrollPassive"];
var pC = { class: "script-log-grid" };
var mC = { key: 3, class: "process-event-group" };
var hC = ["onClick"];
var gC = ["onScrollPassive"];
var _C = { class: "event-group-items" };
var vC = { key: 0, class: "process-event" };
var yC = ["onClick"];
var bC = { key: 1, class: "inline-event" };
var xC = { key: 1 };
var SC = { key: 2, class: "process-event" };
var CC = ["onClick"];
var wC = { class: "event-detail-content" };
var TC = { key: 3, class: "inline-event" };
var EC = { key: 4, class: "inline-event" };
var DC = 10;
var OC = Z(M({ __name: "AgentProcessEventList", props: { events: {}, running: { type: Boolean, default: !1 }, scope: { default: "events" }, compact: { type: Boolean, default: !1 } }, setup(e2) {
  let t2 = e2, n2 = "308px", r2 = N({}), i2 = N({}), a2 = /* @__PURE__ */ new Map(), o2 = /* @__PURE__ */ new WeakMap(), s2 = F(() => _S(t2.events, t2.scope)), c2 = F(() => IS(s2.value, r2.value)), l2;
  function u2(e3) {
    return e3.type === "group" || e3.type === "script_logs" ? e3.id : e3.event.id;
  }
  function d2(e3) {
    return `script-grid:${e3.id}`;
  }
  function f2(e3) {
    return r2.value[e3.id] ?? e3.expanded === !0;
  }
  function p2(e3) {
    r2.value = { ...r2.value, [e3.id]: !f2(e3) };
  }
  function m2(e3) {
    return r2.value[e3.id] ?? !1;
  }
  function h2(e3) {
    r2.value = { ...r2.value, [e3.id]: !m2(e3) };
  }
  function g2(e3) {
    return r2.value[e3.id] ?? !1;
  }
  function _2(e3) {
    r2.value = { ...r2.value, [e3.id]: !g2(e3) };
  }
  function v2(e3) {
    return e3.events.length > DC;
  }
  function y2(e3) {
    let n3 = s2.value.at(-1);
    return t2.running && !!(n3 && u2(n3) === u2(e3));
  }
  function b2(e3) {
    if (e3.label) return e3.label;
    let t3 = Fu(e3.toolName, e3.status, e3.input, { finished: e3.finished, patchType: e3.patchType, target: e3.target });
    if (au(e3.toolName, e3.input, { patchType: e3.patchType, target: e3.target })?.kind === "entries") return t3;
    let n3 = fu(e3.toolName);
    return n3 === "apply_patch" || n3 === "read_file" || n3 === "exec_command" ? t3 : `${t3}${e3.target ? ` ${e3.target}` : ""}`;
  }
  function x2(e3) {
    return e3.startsWith("/") || /^[a-z]:[\\/]/i.test(e3) || e3.startsWith("\\\\");
  }
  function S2(e3) {
    return e3.split(/[\\/]/).filter(Boolean).at(-1) || e3;
  }
  function C2(e3) {
    return x2(e3) ? S2(e3) : e3;
  }
  function w2(e3) {
    if (e3.target) return e3.target;
    if (!e3.input || typeof e3.input != "object" || Array.isArray(e3.input)) return;
    let t3 = e3.input.path;
    return typeof t3 == "string" ? t3 : void 0;
  }
  function T2(e3) {
    return e3?.type === "tool_call" && fu(e3.toolName) === "web_search" && du(e3.input) !== void 0;
  }
  function E2(e3) {
    return hS(e3.events);
  }
  function ee2(e3) {
    return fu(e3.toolName) === "read_file" && !!Ou(w2(e3));
  }
  function te2(e3) {
    return e3.scriptName ? `${$t("\u8FD0\u884C\u811A\u672C")} ${C2(e3.scriptName)}` : e3.title || $t("\u8FD0\u884C\u811A\u672C");
  }
  function D2(e3, t3) {
    return ir.value, (e3.dirId ? Pr([e3.dirId])[0] : "")?.replace(/^@+/, "") || $t("\u7A97\u53E3 {index}", { index: t3 + 1 });
  }
  function ne2(e3) {
    let t3 = e3.events[0];
    return t3 ? te2(t3) : $t("\u8FD0\u884C\u811A\u672C");
  }
  function O2(e3) {
    return e3.status === "success" ? `\u5DF2\u52A0\u8F7D skill\uFF1A${e3.skillPath}` : `\u52A0\u8F7D skill\uFF1A${e3.skillPath}`;
  }
  function re2(e3) {
    return e3.type === "tool_call" ? b2(e3) : e3.type === "script_log" ? te2(e3) : e3.type === "skill_load" ? O2(e3) : e3.type === "thinking" || e3.type === "context_compacted" || e3.type === "retrying" || e3.type === "hitl" ? e3.title : e3.title || $t("\u6267\u884C\u8FC7\u7A0B");
  }
  function ie2(e3) {
    return e3.type === "thinking" ? "roxy-agent/rx-ic-thinking" : e3.type === "script_log" ? "roxy-agent/rx-ic-scripts" : e3.type === "skill_load" || e3.type === "tool_call" && ee2(e3) ? "roxy-agent/rx-ic-skills" : e3.type === "retrying" ? Xf(e3.status) : e3.type === "hitl" ? e3.requestKind === "clarification" ? "base/rx_ic_ask" : "roxy-agent/rx-ic-ask" : T2(e3) ? "roxy-agent/rx-ic-search" : "roxy-agent/rx-ic-tool";
  }
  function ae2(e3) {
    let t3 = e3.events.filter((e4) => e4.type === "tool_call");
    if (t3.length > 0 && e3.events.every((e4) => e4.type === "thinking" || e4.type === "tool_call")) {
      let e4 = Pu(t3);
      if (e4) return e4;
    }
    let n3 = hS(e3.events);
    return n3 ? re2(n3) : $t("\u6267\u884C\u8FC7\u7A0B");
  }
  function oe2(e3) {
    let t3 = hS(e3.events);
    return t3 ? ie2(t3) : "roxy-agent/rx-ic-tool";
  }
  function se2(e3) {
    return e3.detail || e3.description || "";
  }
  function k2(e3) {
    return e3.clarificationAnswers ?? [];
  }
  function ce2(e3) {
    return i2.value[e3] ?? { canScrollUp: !1, canScrollDown: !1 };
  }
  function A2(e3) {
    let t3 = a2.get(e3);
    if (!t3) return;
    let n3 = t3.scrollHeight - t3.clientHeight, r3 = { canScrollUp: n3 > 1 && t3.scrollTop > 1, canScrollDown: n3 > 1 && t3.scrollTop < n3 - 1 }, o3 = i2.value[e3];
    (o3?.canScrollUp !== r3.canScrollUp || o3.canScrollDown !== r3.canScrollDown) && (i2.value = { ...i2.value, [e3]: r3 });
  }
  function le2(e3, t3) {
    let n3 = a2.get(e3);
    n3 !== t3 && (n3 && (l2?.unobserve(n3), o2.delete(n3)), t3 ? (a2.set(e3, t3), o2.set(t3, e3), l2?.observe(t3), requestAnimationFrame(() => {
      (e3.startsWith("thinking:") || e3.startsWith("script:")) && (t3.scrollTop = t3.scrollHeight), A2(e3);
    })) : a2.delete(e3));
  }
  return He(() => {
    if (typeof ResizeObserver < "u") {
      l2 = new ResizeObserver((e3) => {
        for (let t3 of e3) {
          let e4 = o2.get(t3.target);
          e4 && A2(e4);
        }
      });
      for (let e3 of a2.values()) l2.observe(e3);
      Me(() => {
        for (let e3 of a2.keys()) A2(e3);
      });
    }
  }), K(r2, () => {
    Me(() => {
      for (let e3 of a2.keys()) A2(e3);
    });
  }, { flush: "post" }), K(c2, (e3, t3) => {
    let n3 = Object.entries(e3).flatMap(([e4, n4]) => {
      let i3 = e4.replace(/^(?:thinking|script-grid):/, "");
      return t3[e4] !== void 0 && t3[e4] !== n4 && r2.value[i3] === !0 ? [e4] : [];
    });
    n3.length !== 0 && Me(() => {
      for (let e4 of n3) {
        let t4 = a2.get(e4);
        t4 && (t4.scrollTop = t4.scrollHeight, A2(e4));
      }
    });
  }, { flush: "post" }), ze(() => {
    l2?.disconnect(), a2.clear();
  }), (t3, r3) => {
    let i3 = X;
    return P(), R("div", { class: I(["agent-event-list", { "agent-event-list--compact": e2.compact }]) }, [(P(!0), R(z, null, G(V(s2), (r4) => (P(), R(z, { key: u2(r4) }, [r4.type === "content" ? (P(), R("div", GS, [q(Mr, { content: r4.event.content, streaming: e2.running && y2(r4), variant: "answer" }, null, 8, ["content", "streaming"])])) : r4.type === "event" ? (P(), R(z, { key: 1 }, [r4.event.type === "thinking" ? (P(), R("div", KS, [L("button", { class: "event-trigger", type: "button", onClick: (e3) => p2(r4.event) }, [q(i3, { name: "roxy-agent/rx-ic-thinking", size: "16" }), L("span", { class: I({ "process-running-text": y2(r4) }) }, B(r4.event.title), 3)], 8, qS)])) : r4.event.type === "tool_call" ? (P(), R("div", JS, [q(i3, { name: ie2(r4.event), size: "16" }, null, 8, ["name"]), T2(r4.event) ? (P(), W(WS, { key: 0, event: r4.event, highlight: y2(r4) }, null, 8, ["event", "highlight"])) : (P(), R("span", { key: 1, class: I({ "process-running-text": y2(r4) }) }, B(b2(r4.event)), 3))])) : r4.event.type === "script_log" ? (P(), R("div", YS, [L("button", { class: "event-trigger", type: "button", onClick: (e3) => p2(r4.event) }, [q(i3, { name: "roxy-agent/rx-ic-scripts", size: "16" }), L("span", { class: I({ "process-running-text": y2(r4) }) }, B(te2(r4.event)), 3), q(i3, { name: "base/rx_ic_chevron_down", size: "12", class: I({ collapsed: !f2(r4.event) }) }, null, 8, ["class"])], 8, XS), q(NS, { expanded: f2(r4.event) }, { default: H(() => [L("div", ZS, [q(zS, { class: "script-log-panel--single", compact: e2.compact, event: r4.event, "window-label": D2(r4.event, 0) }, null, 8, ["compact", "event", "window-label"])])]), _: 2 }, 1032, ["expanded"])])) : r4.event.type === "skill_load" ? (P(), R("div", QS, [q(i3, { name: "roxy-agent/rx-ic-skills", size: "16" }), L("span", { class: I({ "process-running-text": y2(r4) }) }, B(O2(r4.event)), 3)])) : r4.event.type === "context_compacted" || r4.event.type === "retrying" ? (P(), R("div", $S, [q(i3, { name: ie2(r4.event), size: "16" }, null, 8, ["name"]), L("span", { class: I({ "process-running-text": y2(r4) }) }, B(r4.event.title), 3)])) : r4.event.type === "hitl" ? (P(), R("div", eC, [L("button", { class: "event-trigger", type: "button", onClick: (e3) => p2(r4.event) }, [q(i3, { name: ie2(r4.event), size: "16" }, null, 8, ["name"]), L("span", { class: I({ "process-running-text": y2(r4) }) }, B(r4.event.title), 3), q(i3, { name: "base/rx_ic_chevron_down", size: "12", class: I({ collapsed: !f2(r4.event) }) }, null, 8, ["class"])], 8, tC), q(NS, { expanded: f2(r4.event) }, { default: H(() => [L("div", nC, [k2(r4.event).length ? (P(), R("div", rC, [(P(!0), R(z, null, G(k2(r4.event), (e3) => (P(), R("div", { key: e3.id, class: "hitl-event__answer" }, [L("p", null, B(e3.question), 1), L("p", iC, [Je(B(e3.answer), 1), e3.recommended ? (P(), R("span", aC, " (" + B(t3.$t("Recommended")) + ")", 1)) : U("", !0)])]))), 128))])) : (P(), R("div", oC, [L("p", null, B(r4.event.prompt), 1), se2(r4.event) ? (P(), R("p", sC, B(se2(r4.event)), 1)) : U("", !0)]))])]), _: 2 }, 1032, ["expanded"])])) : (P(), R("div", cC, [q(i3, { name: ie2(r4.event), size: "16" }, null, 8, ["name"]), L("span", { class: I({ "process-running-text": y2(r4) }) }, B(re2(r4.event)), 3)]))], 64)) : r4.type === "script_logs" ? (P(), R("div", lC, [L("button", { class: "event-trigger", type: "button", onClick: (e3) => _2(r4) }, [q(i3, { name: "roxy-agent/rx-ic-scripts", size: "16" }), L("span", { class: I({ "process-running-text": y2(r4) }) }, B(ne2(r4)), 3), q(i3, { name: "base/rx_ic_chevron_down", size: "12", class: I({ collapsed: !g2(r4) }) }, null, 8, ["class"])], 8, uC), q(NS, { expanded: g2(r4) }, { default: H(() => [L("div", dC, [L("div", { ref_for: !0, ref: (e3) => le2(d2(r4), e3), class: I(["script-log-grid-scroll", { "scroll-mask--top": ce2(d2(r4)).canScrollUp, "scroll-mask--bottom": ce2(d2(r4)).canScrollDown }]), style: $e({ "--event-group-max-height": n2 }), onScrollPassive: (e3) => A2(d2(r4)) }, [L("div", pC, [(P(!0), R(z, null, G(r4.events, (t4, n3) => (P(), W(zS, { key: t4.id, compact: e2.compact, event: t4, "window-label": D2(t4, n3) }, null, 8, ["compact", "event", "window-label"]))), 128))])], 46, fC)])]), _: 2 }, 1032, ["expanded"])])) : (P(), R("div", mC, [L("button", { class: "event-trigger", type: "button", onClick: (e3) => h2(r4) }, [q(i3, { name: oe2(r4), size: "16" }, null, 8, ["name"]), T2(E2(r4)) ? (P(), W(WS, { key: 0, event: E2(r4), highlight: y2(r4) }, null, 8, ["event", "highlight"])) : (P(), R("span", { key: 1, class: I({ "process-running-text": y2(r4) }) }, B(ae2(r4)), 3)), q(i3, { name: "base/rx_ic_chevron_down", size: "12", class: I({ collapsed: !m2(r4) }) }, null, 8, ["class"])], 8, hC), q(NS, { expanded: m2(r4) }, { default: H(() => [L("div", { ref_for: !0, ref: (e3) => le2(r4.id, e3), class: I(["event-group-body", { "event-group-body--scrollable": v2(r4), "scroll-mask--top": ce2(r4.id).canScrollUp, "scroll-mask--bottom": ce2(r4.id).canScrollDown }]), style: $e({ "--event-group-max-height": n2 }), onScrollPassive: (e3) => A2(r4.id) }, [L("div", _C, [(P(!0), R(z, null, G(r4.events, (t4) => (P(), R(z, { key: t4.id }, [t4.type === "thinking" ? (P(), R("div", vC, [L("button", { class: "event-trigger", type: "button", onClick: (e3) => p2(t4) }, [q(i3, { name: "roxy-agent/rx-ic-thinking", size: "16" }), L("span", null, B(t4.title), 1)], 8, yC)])) : t4.type === "tool_call" ? (P(), R("div", bC, [q(i3, { name: ie2(t4), size: "16" }, null, 8, ["name"]), T2(t4) ? (P(), W(WS, { key: 0, event: t4 }, null, 8, ["event"])) : (P(), R("span", xC, B(b2(t4)), 1))])) : t4.type === "script_log" ? (P(), R("div", SC, [L("button", { class: "event-trigger", type: "button", onClick: (e3) => p2(t4) }, [q(i3, { name: "roxy-agent/rx-ic-scripts", size: "16" }), L("span", null, B(te2(t4)), 1), q(i3, { name: "base/rx_ic_chevron_down", size: "12", class: I({ collapsed: !f2(t4) }) }, null, 8, ["class"])], 8, CC), q(NS, { expanded: f2(t4) }, { default: H(() => [L("div", wC, [q(zS, { class: "script-log-panel--single", compact: e2.compact, event: t4, "window-label": D2(t4, 0) }, null, 8, ["compact", "event", "window-label"])])]), _: 2 }, 1032, ["expanded"])])) : t4.type === "skill_load" ? (P(), R("div", TC, [q(i3, { name: "roxy-agent/rx-ic-skills", size: "16" }), L("span", null, B(O2(t4)), 1)])) : (P(), R("div", EC, [q(i3, { name: ie2(t4), size: "16" }, null, 8, ["name"]), L("span", null, B(re2(t4)), 1)]))], 64))), 128))])], 46, gC)]), _: 2 }, 1032, ["expanded"])]))], 64))), 128))], 2);
  };
} }), [["__scopeId", "data-v-0873d802"]]);
var kC = { class: "agent-node" };
var AC = ["disabled"];
var jC = { class: "agent-node__identity" };
var MC = { key: 0, class: "agent-node__result agent-node__result--error" };
var NC = { key: 1, class: "agent-node__result" };
var PC = { key: 2, class: "agent-node__children" };
var FC = Z(M({ name: "AgentLifecycleTree", __name: "AgentLifecycleTree", props: { event: {} }, setup(e2) {
  let t2 = e2, n2 = N(t2.event.expanded === !0), r2 = N(null), i2 = N(null), a2 = Ye({ scrollable: !1, canScrollUp: !1, canScrollDown: !1 }), o2 = F(() => !!(t2.event.events.length || t2.event.children.length || t2.event.report || t2.event.error)), s2 = F(() => vS(t2.event.events, t2.event.agentPath)), c2 = F(() => s2.value.filter((e3) => e3.type === "events").at(-1)?.id), l2;
  function u2() {
    if (l2?.disconnect(), l2 = void 0, typeof ResizeObserver > "u") return;
    let e3 = [r2.value, i2.value].filter((e4) => !!e4);
    if (e3.length !== 0) {
      l2 = new ResizeObserver(d2);
      for (let t3 of e3) l2.observe(t3);
    }
  }
  function d2() {
    let e3 = r2.value;
    if (!e3) return;
    let t3 = e3.scrollHeight - e3.clientHeight;
    a2.scrollable = t3 > 1, a2.canScrollUp = t3 > 1 && e3.scrollTop > 1, a2.canScrollDown = t3 > 1 && e3.scrollTop < t3 - 1;
  }
  K([r2, i2], () => {
    u2(), d2();
  }, { flush: "post" }), K(() => t2.event.renderRevision, (e3, t3) => {
    Me(() => {
      let i3 = r2.value;
      n2.value && t3 !== void 0 && e3 !== t3 && i3 && (i3.scrollTop = i3.scrollHeight), d2();
    });
  }, { flush: "post" }), ze(() => l2?.disconnect());
  function f2(e3, t3) {
    return e3 === "completed" ? $t("\u5DF2\u521B\u5EFA\u667A\u80FD\u4F53 {name}", { name: t3 }) : e3 === "failed" ? $t("\u521B\u5EFA\u667A\u80FD\u4F53 {name} \u5931\u8D25", { name: t3 }) : e3 === "cancelled" ? $t("\u521B\u5EFA\u667A\u80FD\u4F53 {name} \u5DF2\u53D6\u6D88", { name: t3 }) : $t("\u521B\u5EFA\u667A\u80FD\u4F53 {name}", { name: t3 });
  }
  return (t3, l3) => {
    let u3 = X, p2 = We("AgentLifecycleTree", !0);
    return P(), R("section", kC, [L("button", { class: "agent-node__header", type: "button", disabled: !V(o2), onClick: l3[0] ||= (e3) => n2.value = !V(n2) }, [q(u3, { name: "roxy-agent/rx-ic-tool", size: "16" }), L("span", jC, [L("strong", null, B(f2(e2.event.lifecycleStatus, e2.event.agentName)), 1)]), V(o2) ? (P(), W(u3, { key: 0, name: "base/rx_ic_chevron_down", size: "12", class: I({ collapsed: !V(n2) }) }, null, 8, ["class"])) : U("", !0)], 8, AC), q(NS, { expanded: V(n2) && V(o2) }, { default: H(() => [L("div", { ref_key: "bodyElement", ref: r2, class: I(["agent-node__body", { "agent-node__body--scrollable": V(a2).scrollable, "scroll-mask--top": V(a2).canScrollUp, "scroll-mask--bottom": V(a2).canScrollDown }]), style: $e({ "--agent-group-max-height": "308px" }), onScrollPassive: d2 }, [L("div", { ref_key: "contentElement", ref: i2, class: "agent-node__content" }, [(P(!0), R(z, null, G(V(s2), (t4) => (P(), R(z, { key: t4.id }, [t4.type === "events" ? (P(), W(OC, { key: 0, events: t4.events, running: (e2.event.lifecycleStatus === "starting" || e2.event.lifecycleStatus === "running") && t4.id === V(c2), scope: t4.id, compact: "" }, null, 8, ["events", "running", "scope"])) : Xe([t4.event.renderRevision, t4.event.lifecycleStatus], () => (P(), W(p2, { key: 1, event: t4.event }, null, 8, ["event"])), l3, 1)], 64))), 128)), e2.event.error ? (P(), R("p", MC, B(e2.event.error), 1)) : e2.event.report && !e2.event.events.length ? (P(), R("p", NC, B(e2.event.report), 1)) : U("", !0), e2.event.children.length ? (P(), R("div", PC, [(P(!0), R(z, null, G(e2.event.children, (e3, t4, n3, r3) => {
      let i3 = [e3.renderRevision, e3.lifecycleStatus];
      if (r3 && r3.el && r3.key === e3.agentPath && ke(r3, i3)) return r3;
      let a3 = (P(), W(p2, { key: e3.agentPath, event: e3 }, null, 8, ["event"]));
      return a3.memo = i3, a3;
    }, l3, 2), 128))])) : U("", !0)], 512)], 38)]), _: 1 }, 8, ["expanded"])]);
  };
} }), [["__scopeId", "data-v-ef4d61aa"]]);
function IC(e2) {
  return String(e2 ?? "").replace(/\r?\n/g, "<br>").replace(/\|/g, "\\|");
}
function LC(e2) {
  return IC(e2) || "-";
}
function RC(e2, t2, n2, r2) {
  let i2 = e2.params.length ? e2.params.map((e3) => `| ${LC(e3.name)} | ${LC(e3.key)} | ${LC(e3.value)} |`).join(`
`) : `| ${LC(r2.noParameters)} | - | - |`, a2 = t2.length ? t2.map((e3) => `| ${LC(e3.window)} | ${LC(e3.country)} | ${LC(e3.account)} | ${LC(e3.result)} | ${LC(e3.failureReason)} |`).join(`
`) : `| ${LC(r2.noParameters)} | - | - | - | - |`, o2 = r2.used ?? "", s2 = r2.unused ?? "", c2 = n2.used !== void 0 && n2.unused !== void 0 && !!(o2 && s2), l2 = c2 ? `| ${IC(r2.total)} | ${IC(o2)} | ${IC(r2.succeeded)} | ${IC(s2)} | ${IC(r2.successRate)} |` : `| ${IC(r2.total)} | ${IC(r2.succeeded)} | ${IC(r2.successRate)} |`, u2 = c2 ? "| ---: | ---: | ---: | ---: | ---: |" : "| ---: | ---: | ---: |", d2 = c2 ? `| ${LC(n2.total)} | ${LC(n2.used)} | ${LC(n2.succeeded)} | ${LC(n2.unused)} | ${LC(n2.successRate)} |` : `| ${LC(n2.total)} | ${LC(n2.succeeded)} | ${LC(n2.successRate)} |`;
  return `\uFEFF# ${IC(r2.title)}

## ${IC(r2.taskName)}

${IC(e2.taskName)}

| ${IC(r2.reportStatus)} |
| --- |
| ${IC(r2.completed)} |

## ${IC(r2.parameters)}

| ${IC(r2.parameterName)} | ${IC(r2.parameterKey)} | ${IC(r2.parameterValue)} |
| --- | --- | --- |
${i2}

## ${IC(r2.windows)}

| ${IC(r2.window)} | ${IC(r2.country)} | ${IC(r2.account)} | ${IC(r2.result)} | ${IC(r2.failureReason)} |
| --- | --- | --- | --- | --- |
${a2}

## ${IC(r2.summary)}

${l2}
${u2}
${d2}
`;
}
function zC(e2) {
  return `${[...e2.trim()].map((e3) => /[<>:"/\\|?*]/.test(e3) || e3.charCodeAt(0) < 32 ? "_" : e3).join("").replace(/\s+/g, "_").slice(0, 80) || "task-report"}.md`;
}
var BC = { class: "task-report-card" };
var VC = { class: "task-report-card__header" };
var HC = { class: "report-status report-status--accepted" };
var UC = { key: 0, class: "report-section report-section--params" };
var WC = { class: "report-section__heading" };
var GC = { class: "report-params" };
var KC = { class: "report-section report-section--windows" };
var qC = { class: "report-section__heading" };
var JC = { class: "report-windows" };
var YC = { class: "report-window__main" };
var XC = { class: "report-window__identity" };
var ZC = { class: "report-window__label" };
var QC = { class: "report-window__country" };
var $C = ["title"];
var ew = ["aria-expanded", "aria-controls", "onClick"];
var tw = ["id"];
var nw = { class: "failure-reason-panel__label" };
var rw = { class: "task-report-card__footer" };
var iw = { class: "report-actions" };
var aw = ["disabled"];
var ow = Z(M({ __name: "AgentTaskReportCard", props: { conversationId: {}, event: {}, windowInfo: {} }, emits: ["saveTemplate"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, { taskGroupList: i2 } = lm(), a2 = N("idle"), o2 = N(/* @__PURE__ */ new Set()), s2 = F(() => new Map(i2.value.flatMap((e3) => e3.tasks).flatMap((e3) => e3.dirId ? [[e3.dirId, e3]] : []))), c2 = F(() => n2.event.report.windows.length), l2 = F(() => n2.event.report.windows.filter((e3) => e3.status !== "unused")), u2 = F(() => l2.value.length), d2 = F(() => c2.value - u2.value), f2 = F(() => l2.value.filter((e3) => e3.success).length), p2 = F(() => u2.value === 0 ? 0 : Math.round(f2.value / u2.value * 100)), m2 = F(() => a2.value === "idle" || a2.value === "failed");
  function h2(e3) {
    return e3 === null ? $t("\u672A\u8BBE\u7F6E") : String(e3);
  }
  function g2(e3) {
    return { ...s2.value.get(e3), ...n2.windowInfo.get(e3) };
  }
  function _2(e3) {
    return g2(e3).countryCode || $t("\u5730\u533A\u672A\u77E5");
  }
  function v2(e3) {
    return ES(g2(e3)) || $t("\u7A97\u53E3\u4FE1\u606F\u4E0D\u53EF\u7528");
  }
  function y2(e3) {
    return g2(e3)?.platformUserName || $t("\u672A\u5173\u8054\u8D26\u53F7");
  }
  function b2(e3) {
    return e3.status === "unused";
  }
  function x2(e3) {
    let t3 = g2(e3)?.countryCode;
    return t3 ? `country-code/${t3}` : "base/rx_ic_earth";
  }
  function S2(e3) {
    return `task-report-${n2.event.id}-failure-reason-${e3}`;
  }
  function C2(e3) {
    return o2.value.has(e3);
  }
  function w2(e3) {
    let t3 = new Set(o2.value);
    t3.has(e3) ? t3.delete(e3) : t3.add(e3), o2.value = t3;
  }
  K(() => n2.event.id, () => {
    o2.value = /* @__PURE__ */ new Set();
  });
  function T2() {
    return a2.value === "sending" ? $t("\u6B63\u5728\u4FDD\u5B58\u6A21\u677F") : a2.value === "completed" ? $t("\u5DF2\u63D0\u4EA4\u4FDD\u5B58") : a2.value === "failed" ? $t("\u91CD\u8BD5\u4FDD\u5B58\u6A21\u677F") : $t("\u4FDD\u5B58\u4E3A\u6A21\u677F");
  }
  async function E2() {
    if (m2.value) {
      a2.value = "sending";
      try {
        await new Promise((e3, t3) => {
          r2("saveTemplate", { conversationId: n2.conversationId, sourceReportId: n2.event.sourceReportId, report: n2.event.report, resolve: e3, reject: t3 });
        }), a2.value = "completed";
      } catch {
        a2.value = "failed";
      }
    }
  }
  function ee2() {
    let e3 = RC(n2.event.report, n2.event.report.windows.map((e4) => ({ window: v2(e4.dirId), country: _2(e4.dirId), account: y2(e4.dirId), result: e4.status === "unused" ? $t("\u672A\u4F7F\u7528") : e4.success ? $t("\u6210\u529F") : $t("\u5931\u8D25"), failureReason: e4.status === "unused" ? $t("\u672A\u4F7F\u7528") : e4.failureReason })), { total: String(c2.value), used: String(u2.value), succeeded: String(f2.value), unused: String(d2.value), successRate: `${p2.value}%` }, { title: $t("\u6267\u884C\u62A5\u544A"), taskName: $t("\u4EFB\u52A1\u540D\u79F0"), reportStatus: $t("\u62A5\u544A\u72B6\u6001"), completed: $t("\u5DF2\u5B8C\u6210"), parameters: $t("\u4EFB\u52A1\u53C2\u6570"), noParameters: $t("\u65E0\u53C2\u6570"), parameterKey: $t("\u53C2\u6570\u952E"), parameterName: $t("\u53C2\u6570\u540D\u79F0"), parameterValue: $t("\u53C2\u6570\u503C"), windows: $t("\u6267\u884C\u7A97\u53E3"), window: $t("\u7A97\u53E3"), country: $t("\u5730\u533A"), account: $t("\u8D26\u53F7"), result: $t("\u7ED3\u679C"), failureReason: $t("\u5931\u8D25\u539F\u56E0"), summary: $t("\u6C47\u603B"), total: $t("\u603B\u6570"), used: $t("\u4F7F\u7528\u6570"), succeeded: $t("\u6210\u529F\u6570"), unused: $t("\u672A\u4F7F\u7528\u6570"), successRate: $t("\u6210\u529F\u7387") }), t3 = URL.createObjectURL(new Blob([e3], { type: "text/markdown;charset=utf-8;" })), r3 = document.createElement("a");
    r3.href = t3, r3.download = zC(n2.event.report.taskName), document.body.appendChild(r3), r3.click(), document.body.removeChild(r3), URL.revokeObjectURL(t3);
  }
  return (t3, n3) => {
    let r3 = X;
    return P(), R("section", BC, [L("header", VC, [L("div", null, [L("h3", null, B(e2.event.report.taskName), 1), L("p", null, B(t3.$t("\u6267\u884C\u62A5\u544A")), 1)]), L("span", HC, B(t3.$t("\u5DF2\u5B8C\u6210")), 1)]), e2.event.report.params.length ? (P(), R("section", UC, [L("div", WC, [L("h4", null, B(t3.$t("\u4EFB\u52A1\u53C2\u6570")), 1), L("span", null, B(t3.$t("{count} \u9879", { count: e2.event.report.params.length })), 1)]), L("dl", GC, [(P(!0), R(z, null, G(e2.event.report.params, (e3) => (P(), R("div", { key: e3.key, class: "report-param" }, [L("dt", null, B(e3.name), 1), L("dd", null, B(h2(e3.value)), 1)]))), 128))])])) : U("", !0), L("section", KC, [L("div", qC, [L("h4", null, B(t3.$t("\u6267\u884C\u7A97\u53E3")), 1), L("span", null, B(t3.$t("{count} \u4E2A\u76EE\u6807", { count: V(c2) })), 1)]), L("div", JC, [(P(!0), R(z, null, G(e2.event.report.windows, (e3, n4) => (P(), R("article", { key: e3.dirId, class: I(["report-window", { "report-window--failed": !e3.success && !b2(e3), "report-window--unused": b2(e3) }]) }, [L("div", YC, [L("div", XC, [L("span", ZC, B(v2(e3.dirId)), 1), q(r3, { name: x2(e3.dirId), fallback: "base/rx_ic_earth", size: "16", "aria-hidden": "true" }, null, 8, ["name"]), L("span", QC, B(_2(e3.dirId)), 1), L("span", { class: "report-window__account", title: y2(e3.dirId) }, B(y2(e3.dirId)), 9, $C)]), L("span", { class: I(["window-result", b2(e3) ? "window-result--unused" : e3.success ? "window-result--success" : "window-result--failed"]) }, B(b2(e3) ? t3.$t("\u672A\u4F7F\u7528") : e3.success ? t3.$t("\u6210\u529F") : t3.$t("\u5931\u8D25")), 3)]), e3.failureReason ? (P(), R("button", { key: 0, type: "button", class: "failure-reason-toggle", "aria-expanded": C2(e3.dirId), "aria-controls": S2(n4), onClick: (t4) => w2(e3.dirId) }, [L("span", null, B(C2(e3.dirId) ? t3.$t("\u6536\u8D77\u5931\u8D25\u539F\u56E0") : t3.$t("\u67E5\u770B\u5931\u8D25\u539F\u56E0")), 1), q(r3, { name: "base/rx_ic_chevron_down", size: "14", class: I({ "failure-reason-toggle__icon--expanded": C2(e3.dirId) }), "aria-hidden": "true" }, null, 8, ["class"])], 8, ew)) : U("", !0), e3.failureReason && C2(e3.dirId) ? (P(), R("div", { key: 1, id: S2(n4), class: "failure-reason-panel" }, [L("span", nw, B(t3.$t("\u5931\u8D25\u539F\u56E0")), 1), L("p", null, B(e3.failureReason), 1)], 8, tw)) : U("", !0)], 2))), 128))])]), L("footer", rw, [L("span", null, B(t3.$t("\u5171 {total} \u4E2A\u76EE\u6807\uFF0C\u4F7F\u7528 {used} \u4E2A\uFF0C\u6210\u529F {succeeded} \u4E2A\uFF0C\u672A\u4F7F\u7528 {unused} \u4E2A\uFF0C\u6210\u529F\u7387 {rate}%", { total: V(c2), used: V(u2), succeeded: V(f2), unused: V(d2), rate: V(p2) })), 1), L("div", iw, [L("button", { type: "button", onClick: ee2 }, B(t3.$t("\u5BFC\u51FA\u62A5\u544A")), 1), L("button", { type: "button", disabled: !V(m2), onClick: E2 }, B(T2()), 9, aw)])])]);
  };
} }), [["__scopeId", "data-v-69cc1cf5"]]);
var sw = { class: "agent-process" };
var cw = { key: 0, class: "process-round" };
var lw = { class: "process-events" };
var uw = { key: 0, class: "process-waiting-placeholder" };
var dw = { key: 2, class: "agent-file-list" };
var fw = Z(M({ __name: "AgentProcessTimeline", props: { conversationId: {}, hasMessageContent: { type: Boolean }, process: {}, messageStatus: {} }, emits: ["saveTemplate"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, i2 = N(n2.process.collapsed === !1 || n2.messageStatus === "thinking" || n2.messageStatus === "streaming"), a2 = N(/* @__PURE__ */ new Map()), o2 = N(Date.now()), s2 = x(), c2, l2 = F(() => n2.process.events.filter((e3) => e3.type !== "final_answer" && e3.type !== "agent_file" && e3.type !== "task_report")), u2 = F(() => vS(l2.value, "root")), d2 = F(() => u2.value.at(-1)?.id), f2 = F(() => n2.process.events.find((e3) => e3.type === "final_answer")), p2 = F(() => n2.process.events.filter((e3) => e3.type === "agent_file").flatMap((e3) => e3.files.filter((e4) => !/\.log$/i.test(e4.fileName)))), m2 = F(() => n2.process.events.filter((e3) => e3.type === "task_report" && !e3.superseded)), h2 = F(() => n2.messageStatus === "thinking" || n2.messageStatus === "streaming"), g2 = F(() => {
    let e3 = n2.messageStatus === "thinking" || n2.messageStatus === "streaming", t3 = l2.value.some((e4) => e4.type !== "content" || !!e4.content.trim()), r3 = f2.value?.type === "final_answer" && !!f2.value.content.trim();
    return e3 && !n2.hasMessageContent && !t3 && !r3 && p2.value.length === 0;
  }), _2 = F(() => {
    if (n2.messageStatus === "thinking" || n2.messageStatus === "streaming") {
      let e3 = n2.process.durationStartedAt;
      if (e3) {
        let t3 = Math.max(0, Math.floor((o2.value - e3) / 1e3));
        if (t3 < 60) return `${$t("\u4EFB\u52A1\u8017\u65F6")} ${t3}s`;
        let n3 = Math.floor(t3 / 60), r3 = t3 % 60;
        return r3 > 0 ? `${$t("\u4EFB\u52A1\u8017\u65F6")} ${n3}m${r3}s` : `${$t("\u4EFB\u52A1\u8017\u65F6")} ${n3}m`;
      }
    }
    return n2.process.durationLabel;
  });
  function v2() {
    i2.value = !i2.value;
  }
  function y2(e3) {
    return s2.getFileUrl(e3.fileId, { download: !0, fileName: e3.fileName });
  }
  function b2(e3) {
    return { fileId: e3.fileId, kind: "file", fileName: e3.fileName, mimeType: e3.mimeType, size: e3.size, uploadStatus: "uploaded" };
  }
  function S2() {
    o2.value = Date.now(), c2 &&= (window.clearTimeout(c2), void 0);
    let e3 = n2.process.durationStartedAt;
    if ((n2.messageStatus === "thinking" || n2.messageStatus === "streaming") && e3) {
      let t3 = 1e3 - Math.max(0, o2.value - e3) % 1e3;
      c2 = window.setTimeout(S2, t3);
    }
  }
  return K(() => [n2.messageStatus, n2.process.durationStartedAt], ([e3]) => {
    (e3 === "thinking" || e3 === "streaming") && (i2.value = !0), S2();
  }, { immediate: !0 }), K(m2, async (e3) => {
    let t3 = e3.flatMap((e4) => e4.report.windows.map((e5) => e5.dirId));
    if (t3.length === 0) a2.value = /* @__PURE__ */ new Map();
    else try {
      a2.value = await kS(t3);
    } catch (e4) {
      console.warn("[agent-console] Failed to load task report window info:", e4), a2.value = /* @__PURE__ */ new Map();
    }
  }, { immediate: !0 }), K([() => n2.messageStatus, () => n2.process.revision], ([e3]) => {
    AS(n2.process.events, e3) && (i2.value = !1);
  }, { immediate: !0 }), ze(() => {
    c2 && window.clearTimeout(c2);
  }), (t3, n3) => {
    let o3 = X;
    return P(), R("section", sw, [V(_2) || V(i2) ? (P(), R("div", cw, [V(_2) ? (P(), R("button", { key: 0, class: "process-duration", type: "button", onClick: v2 }, [L("span", null, B(V(_2)), 1), q(o3, { name: "base/rx_ic_chevron_down", size: "12", class: I({ collapsed: !V(i2) }) }, null, 8, ["class"])])) : U("", !0), q(NS, { expanded: V(i2) }, { default: H(() => [L("div", { class: I(["process-collapse-content", { "process-collapse-content--spaced": V(_2) }]) }, [L("div", lw, [V(g2) ? (P(), R("div", uw, [q(o3, { name: "roxy-agent/rx-ic-thinking", size: "16" }), L("span", null, B(t3.$t("\u6B63\u5728\u601D\u8003")), 1)])) : (P(!0), R(z, { key: 1 }, G(V(u2), (t4) => (P(), R(z, { key: t4.id }, [t4.type === "events" ? (P(), W(OC, { key: 0, events: t4.events, running: (e2.messageStatus === "thinking" || e2.messageStatus === "streaming") && t4.id === V(d2), scope: t4.id }, null, 8, ["events", "running", "scope"])) : Xe([t4.event.renderRevision, t4.event.lifecycleStatus], () => (P(), W(FC, { key: 1, event: t4.event }, null, 8, ["event"])), n3, 0)], 64))), 128))])], 2)]), _: 1 }, 8, ["expanded"])])) : U("", !0), V(f2)?.type === "final_answer" ? (P(), W(Mr, { key: 1, content: V(f2).content, streaming: V(h2), variant: "answer" }, null, 8, ["content", "streaming"])) : U("", !0), (P(!0), R(z, null, G(V(m2), (t4) => (P(), W(ow, { key: t4.id, "conversation-id": e2.conversationId, event: t4, "window-info": V(a2), onSaveTemplate: n3[1] ||= (e3) => r2("saveTemplate", e3) }, null, 8, ["conversation-id", "event", "window-info"]))), 128)), V(p2).length ? (P(), R("div", dw, [(P(!0), R(z, null, G(V(p2), (e3) => (P(), W(Sr, { key: e3.fileId, attachment: b2(e3), "download-label": t3.$t("\u4E0B\u8F7D"), "download-url": y2(e3), size: "reply" }, null, 8, ["attachment", "download-label", "download-url"]))), 128))])) : U("", !0)]);
  };
} }), [["__scopeId", "data-v-551e6311"]]);
var pw = { class: "agent-status-message", role: "alert" };
var mw = { class: "agent-status-message__main" };
var hw = { key: 0, class: "agent-status-message__request-id" };
var gw = Z(M({ __name: "AgentStatusMessage", props: { data: {} }, setup(e2) {
  let t2 = e2, [n2, r2] = Ct(), i2 = F(() => Pd(t2.data)), a2 = F(() => i2.value.message), o2 = F(() => i2.value.requestId);
  async function s2() {
    if (o2.value) try {
      await be(o2.value), n2(0, $t("\u590D\u5236\u6210\u529F"));
    } catch (e3) {
      console.error("[agent-console] Failed to copy request id:", e3), r2(-1, $t("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5"));
    }
  }
  return (e3, t3) => {
    let n3 = X, r3 = We("I18nT");
    return P(), R("div", pw, [L("div", mw, [q(n3, { name: "base/rx_ic_delete", size: "14" }), L("span", null, B(V(a2)), 1)]), V(o2) ? (P(), R("span", hw, [q(r3, { keypath: e3.$t("\u8BF7\u6C42 ID\uFF1A{requestId}", { requestId: "{requestId}" }) }, { requestId: H(() => [L("button", { type: "button", onClick: s2 }, B(V(o2)), 1)]), _: 1 }, 8, ["keypath"])])) : U("", !0)]);
  };
} }), [["__scopeId", "data-v-bf8d5650"]]);
var _w = { class: "message-body" };
var vw = { key: 2, class: "message-attachments" };
var yw = { key: 4, class: "message-actions" };
var bw = ["aria-label"];
var xw = ["href", "download", "aria-label"];
var Sw = ["aria-label"];
var Cw = { class: "attachment-image-preview__stage" };
var ww = ["src", "alt"];
var Tw = ["disabled"];
var Ew = ["aria-label"];
var Dw = ["disabled"];
var Ow = Z(M({ __name: "ChatMessage", props: { message: {} }, emits: ["copy", "saveTemplate"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, i2 = wt(), a2 = F(() => f2()), o2 = N(null), s2 = N(null), c2 = N(1), l2 = F(() => o2.value ? C2(o2.value) : ""), u2 = F(() => o2.value ? w2(o2.value) : ""), d2 = F(() => `${Math.round(c2.value * 100)}%`);
  function f2() {
    return n2.message.role === "user" ? n2.message.content : p2(n2.message.process) || n2.message.content;
  }
  function p2(e3) {
    return e3 ? m2(e3.events) : "";
  }
  function m2(e3) {
    for (let t3 = e3.length - 1; t3 >= 0; t3--) {
      let n3 = e3[t3];
      if (n3.type === "final_answer" && n3.content.trim()) return n3.content;
      if (n3.type === "agent_lifecycle") {
        let e4 = m2(n3.events) || m2(n3.children);
        if (e4) return e4;
      }
    }
    return "";
  }
  function h2(e3) {
    return (e3?.completed === !0 || e3?.completed === void 0 && e3?.collapsed === !0) && !!p2(e3);
  }
  function g2() {
    return n2.message.role === "assistant" && (n2.message.status === "thinking" || n2.message.status === "streaming");
  }
  function _2() {
    return n2.message.role === "assistant" ? !!(n2.message.process || n2.message.content.trim() || n2.message.errorData) : !!(n2.message.content.trim() || n2.message.attachments?.length);
  }
  function v2() {
    return _2() && !!n2.message.createdAt && !g2();
  }
  function y2() {
    return !!a2.value;
  }
  function b2() {
    return n2.message.role === "assistant" && n2.message.status === "error" && !!n2.message.errorData;
  }
  function x2(e3) {
    if (n2.message.role !== "user" || !a2.value) return;
    let t3 = e3.target;
    if (t3 instanceof HTMLElement && t3.closest("a,button,input,textarea,select")) return;
    let i3 = window.getSelection();
    i3 && !i3.isCollapsed && i3.toString().trim() || r2("copy", a2.value);
  }
  function S2(e3) {
    return e3 ? /^(?:https?:|data:|blob:)/i.test(e3) ? e3 : e3.startsWith("/api/files/") && i2.serverUrl ? `${i2.serverUrl}${e3}` : e3 : "";
  }
  function C2(e3) {
    return S2(e3.preview) || S2(e3.url) || S2(e3.localUrl) || S2(e3.fileUrl) || S2(e3.remoteUrl);
  }
  function w2(e3) {
    if (!i2.serverUrl || !e3.fileId) return C2(e3);
    let t3 = new URLSearchParams({ download: "1", filename: e3.fileName });
    return `${i2.serverUrl}/api/files/${encodeURIComponent(e3.fileId)}?${t3}`;
  }
  function T2(e3) {
    return /\.(?:png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(e3);
  }
  function E2(e3) {
    return e3.kind === "file" && (e3.mimeType.startsWith("image/") || T2(e3.fileName)) && !!C2(e3);
  }
  function ee2(e3) {
    E2(e3) && (o2.value = e3, c2.value = 1, Me(() => s2.value?.focus()));
  }
  function te2() {
    o2.value = null, c2.value = 1;
  }
  function D2(e3) {
    c2.value = Math.min(3, Math.max(0.5, Number((c2.value + e3).toFixed(2))));
  }
  function ne2() {
    c2.value = 1;
  }
  function O2(e3) {
    D2(e3.deltaY < 0 ? 0.1 : -0.1);
  }
  function re2(e3) {
    o2.value && (e3.key === "Escape" ? te2() : e3.key === "+" || e3.key === "=" ? D2(0.25) : e3.key === "-" ? D2(-0.25) : e3.key === "0" && ne2());
  }
  return He(() => document.addEventListener("keydown", re2)), Pe(() => document.removeEventListener("keydown", re2)), (t3, n3) => {
    let i3 = X;
    return P(), R(z, null, [_2() ? (P(), R("article", { key: 0, class: I(["chat-message", e2.message.role]) }, [L("div", _w, [e2.message.role === "assistant" && e2.message.process ? (P(), W(fw, { key: 0, "conversation-id": e2.message.conversationId, "has-message-content": !!e2.message.content.trim(), process: e2.message.process, "message-status": e2.message.status, onSaveTemplate: n3[0] ||= (e3) => r2("saveTemplate", e3) }, null, 8, ["conversation-id", "has-message-content", "process", "message-status"])) : U("", !0), b2() ? (P(), W(gw, { key: 1, data: e2.message.errorData }, null, 8, ["data"])) : U("", !0), e2.message.role === "user" && e2.message.attachments?.length ? (P(), R("div", vw, [(P(!0), R(z, null, G(e2.message.attachments, (e3) => (P(), W(Sr, { key: e3.fileId, attachment: e3, "preview-url": C2(e3), previewable: E2(e3), size: "message", onPreview: (t4) => ee2(e3) }, null, 8, ["attachment", "preview-url", "previewable", "onPreview"]))), 128))])) : U("", !0), e2.message.content && (e2.message.role !== "assistant" || e2.message.status !== "thinking" && !b2() && !h2(e2.message.process)) ? (P(), R("div", { key: 3, class: I(["message-bubble", { thinking: e2.message.status === "thinking" }]), onContextmenu: ut(x2, ["prevent"]) }, [q(Mr, { content: e2.message.content, "preserve-line-breaks": e2.message.role === "user" }, null, 8, ["content", "preserve-line-breaks"])], 34)) : U("", !0), v2() ? (P(), R("div", yw, [L("span", null, B(e2.message.createdAt), 1), y2() ? (P(), W(pS, { key: 0, text: V(a2) }, null, 8, ["text"])) : U("", !0)])) : U("", !0)])], 2)) : U("", !0), (P(), W(tt, { to: "body" }, [V(o2) ? (P(), R("div", { key: 0, ref_key: "previewDialogRef", ref: s2, class: "attachment-image-preview", role: "dialog", "aria-modal": "true", "aria-label": V(o2).fileName, tabindex: "-1", onClick: te2, onWheel: ut(O2, ["prevent"]) }, [L("div", { class: "attachment-image-preview__actions", onClick: n3[1] ||= ut(() => {
    }, ["stop"]) }, [L("a", { href: V(u2), download: V(o2).fileName, "aria-label": t3.$t("\u4E0B\u8F7D") }, [q(i3, { name: "base/rx_ic_download", size: "20", color: "currentColor" })], 8, xw), L("button", { type: "button", "aria-label": t3.$t("\u5173\u95ED"), onClick: te2 }, [q(i3, { name: "roxy-agent/rx-ic-close", size: "20", color: "currentColor" })], 8, Sw)]), L("div", Cw, [L("img", { src: V(l2), alt: V(o2).fileName, style: $e({ transform: `scale(${V(c2)})` }), onClick: n3[2] ||= ut(() => {
    }, ["stop"]), onDblclick: ut(ne2, ["stop"]) }, null, 44, ww)]), L("div", { class: "attachment-image-preview__zoom", onClick: n3[5] ||= ut(() => {
    }, ["stop"]) }, [L("button", { type: "button", "aria-label": "-", disabled: V(c2) <= 0.5, onClick: n3[3] ||= (e3) => D2(-0.25) }, [q(i3, { name: "base/rx_ic_minus", size: "18", color: "currentColor" })], 8, Tw), L("button", { type: "button", "aria-label": t3.$t("\u91CD\u7F6E"), class: "attachment-image-preview__zoom-label", onClick: ne2 }, B(V(d2)), 9, Ew), L("button", { type: "button", "aria-label": "+", disabled: V(c2) >= 3, onClick: n3[4] ||= (e3) => D2(0.25) }, [...n3[6] ||= [L("span", { "aria-hidden": "true" }, "+", -1)]], 8, Dw)])], 40, bw)) : U("", !0)]))], 64);
  };
} }), [["__scopeId", "data-v-bcdb277e"]]);
function kw(e2, t2) {
  let n2 = [], r2 = 0;
  for (let i2 of [...t2].sort((e3, t3) => e3.start - t3.start)) {
    let t3 = Math.max(0, i2.start), a2 = Math.min(e2.length, i2.end);
    !i2.markdown || t3 < r2 || a2 <= t3 || (n2.push(e2.slice(r2, t3), i2.markdown), r2 = a2);
  }
  return n2.push(e2.slice(r2)), n2.join("");
}
function Aw(e2, t2) {
  let n2 = e2.rangeCount ? e2.getRangeAt(0) : void 0, r2 = e2.toString();
  return !n2 || !r2 ? r2 : kw(r2, Array.from(t2.querySelectorAll("a[href]")).map((e3) => jw(n2, e3)).filter((e3) => !!e3));
}
function jw(e2, t2) {
  if (!e2.intersectsNode(t2)) return;
  let n2 = t2.ownerDocument.createRange();
  n2.selectNodeContents(t2);
  let r2 = e2.cloneRange();
  r2.compareBoundaryPoints(Range.START_TO_START, n2) < 0 && r2.setStart(n2.startContainer, n2.startOffset), r2.compareBoundaryPoints(Range.END_TO_END, n2) > 0 && r2.setEnd(n2.endContainer, n2.endOffset);
  let i2 = r2.toString();
  if (!i2) return;
  let a2 = e2.cloneRange();
  a2.setEnd(r2.startContainer, r2.startOffset);
  let o2 = a2.toString().length;
  return { start: o2, end: o2 + i2.length, markdown: Mw(t2) };
}
function Mw(e2) {
  let t2 = e2.dataset.markdownSource;
  if (t2) try {
    return decodeURIComponent(t2);
  } catch {
  }
  let n2 = e2.textContent || e2.getAttribute("href") || "", r2 = e2.getAttribute("href") || "";
  return r2 ? `[${Nw(n2)}](${Pw(r2)})` : n2;
}
function Nw(e2) {
  return e2.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]");
}
function Pw(e2) {
  return e2.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}
var Fw = class {
  host;
  frame;
  task;
  constructor(e2) {
    this.host = e2;
  }
  schedule(e2) {
    this.task = e2, this.frame === void 0 && (this.frame = this.host.requestAnimationFrame(() => {
      this.frame = void 0;
      let e3 = this.task;
      this.task = void 0, e3?.();
    }));
  }
  cancel() {
    this.frame !== void 0 && (this.host.cancelAnimationFrame(this.frame), this.frame = void 0), this.task = void 0;
  }
};
var Iw = ["aria-busy"];
var Lw = ["aria-label"];
var Rw = ["aria-label"];
var zw = 10;
var Bw = 8;
var Vw = 160;
var Hw = 96;
var Uw = 4;
var Ww = 48;
var Gw = Z(M({ __name: "ChatMessageList", props: { activeConversationId: {}, hasEarlierMessages: { type: Boolean }, hasHeader: { type: Boolean }, loadingEarlierMessages: { type: Boolean }, messages: {} }, emits: ["addToChat", "loadEarlierMessages", "saveAsPrompt", "saveTemplate"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, [, i2] = Ct(), a2 = N(null), o2 = N(null), s2 = N(null), c2 = N(!1), l2 = N(null), u2 = N(null), d2 = 0, f2 = !0, p2 = !1, m2 = n2.activeConversationId, h2 = 0, g2 = 0, _2 = 0, v2 = null, y2 = null, b2 = new Fw(window);
  function x2(e3 = !1) {
    u2.value = null, e3 && window.getSelection()?.removeAllRanges();
  }
  function S2(e3) {
    let t3 = Math.max(Bw, window.innerWidth - Vw - Bw);
    return { left: Math.min(Math.max(Bw, e3.left + e3.width / 2 - Vw / 2), t3), top: e3.bottom + zw };
  }
  function C2() {
    let e3 = window.getSelection(), t3 = s2.value;
    if (!e3 || e3.isCollapsed || !e3.anchorNode || !e3.focusNode || !t3?.contains(e3.anchorNode) || !t3.contains(e3.focusNode)) return null;
    let n3 = e3.toString();
    return n3.trim() ? { markdownText: Aw(e3, t3), rect: e3.getRangeAt(0).getBoundingClientRect(), text: n3 } : null;
  }
  function w2() {
    let e3 = C2();
    return e3 ? (u2.value = { ...S2(e3.rect), markdownText: e3.markdownText, text: e3.text }, !0) : (x2(), !1);
  }
  function T2(e3) {
    e3.button === 0 && (cancelAnimationFrame(d2), d2 = requestAnimationFrame(() => {
      w2();
    }));
  }
  function E2(e3) {
    let t3 = e3.target, n3 = s2.value;
    n3 && t3 instanceof Node && n3.contains(t3) && w2() && e3.preventDefault();
  }
  function ee2(e3) {
    l2.value?.contains(e3.target) || x2();
  }
  function te2(e3) {
    e3.key === "Escape" && x2(!0);
  }
  function D2() {
    x2();
  }
  async function ne2(e3) {
    try {
      await be(e3), a2.value?.show();
    } catch (e4) {
      console.error("Failed to copy agent chat text", e4), i2(-1, $t("\u590D\u5236\u5931\u8D25"));
    }
  }
  async function O2() {
    let e3 = u2.value?.text;
    if (e3) try {
      await ne2(e3);
    } finally {
      x2(!0);
    }
  }
  async function re2(e3) {
    await ne2(e3);
  }
  function ie2() {
    let e3 = u2.value?.markdownText;
    e3 && (x2(!0), r2("addToChat", e3));
  }
  function ae2() {
    let e3 = u2.value?.text;
    e3 && (x2(!0), r2("saveAsPrompt", e3));
  }
  let oe2 = F(() => {
    let e3 = n2.messages.at(-1);
    return [n2.activeConversationId, n2.messages.length, e3?.conversationId, e3?.id, e3?.content, e3?.status, e3?.process?.durationState, e3?.process?.durationStartedAt, e3?.process?.durationEndedAt, e3?.process?.revision, e3?.process?.events.length].join("|");
  });
  function se2() {
    let e3 = o2.value;
    return e3 ? Math.max(0, e3.scrollHeight - e3.scrollTop - e3.clientHeight) : 0;
  }
  function k2() {
    c2.value = se2() > Hw;
  }
  function ce2(e3 = 120) {
    g2 = Math.max(g2, Date.now() + e3);
  }
  function A2() {
    return Date.now() < g2;
  }
  function le2(e3 = "auto") {
    let t3 = o2.value;
    t3 && (p2 = !1, ce2(e3 === "smooth" ? 480 : 120), t3.scrollTo({ top: t3.scrollHeight, behavior: e3 }), e3 === "auto" && (c2.value = !1));
  }
  function j2() {
    b2.schedule(() => {
      f2 ? le2() : k2();
    });
  }
  function ue2() {
    let e3 = o2.value;
    e3 && !y2 && n2.hasEarlierMessages && !n2.loadingEarlierMessages && (y2 = { firstMessageId: n2.messages[0]?.id, scrollHeight: e3.scrollHeight, scrollTop: e3.scrollTop }, r2("loadEarlierMessages"));
  }
  function de2() {
    x2();
    let e3 = o2.value;
    if (e3) {
      if (!A2()) {
        let t3 = e3.scrollTop, n3 = se2(), r3 = t3 < h2 - 1;
        r3 && (p2 = !0), n3 <= Uw ? (p2 = !1, f2 = !0) : f2 = !p2 && n3 <= Hw, r3 && t3 <= Ww && ue2();
      }
      h2 = e3.scrollTop, k2();
    }
  }
  function fe2() {
    p2 = !0, f2 = !1, b2.cancel();
  }
  function pe2(e3) {
    e3.deltaY < 0 && (fe2(), (o2.value?.scrollTop ?? 0) <= Ww && ue2());
  }
  function me2(e3) {
    _2 = e3.touches[0]?.clientY ?? 0;
  }
  function he2(e3) {
    (e3.touches[0]?.clientY ?? _2) > _2 && (fe2(), (o2.value?.scrollTop ?? 0) <= Ww && ue2());
  }
  function ge2() {
    p2 = !1, f2 = !0, le2("smooth"), window.setTimeout(k2, 240);
  }
  function _e2() {
    j2();
  }
  return K(() => n2.activeConversationId, (e3) => {
    e3 !== m2 && (m2 = e3, y2 = null, p2 = !1, f2 = !0, j2());
  }), K(() => [n2.messages[0]?.id, n2.loadingEarlierMessages], async ([e3, t3]) => {
    let n3 = y2;
    if (n3)
      if (e3 !== n3.firstMessageId) {
        await Me();
        let e4 = o2.value;
        e4 && (ce2(), e4.scrollTop = n3.scrollTop + e4.scrollHeight - n3.scrollHeight, h2 = e4.scrollTop, k2()), y2 = null;
      } else t3 || (y2 = null);
  }, { flush: "post" }), K(oe2, () => {
    j2();
  }, { flush: "post" }), He(() => {
    document.addEventListener("pointerdown", ee2, !0), document.addEventListener("keydown", te2), window.addEventListener("resize", D2), p2 = !1, f2 = !0, j2(), o2.value && (v2 = new ResizeObserver(_e2), v2.observe(o2.value), s2.value && v2.observe(s2.value));
  }), ze(() => {
    document.removeEventListener("pointerdown", ee2, !0), document.removeEventListener("keydown", te2), window.removeEventListener("resize", D2), b2.cancel(), cancelAnimationFrame(d2), v2?.disconnect();
  }), (t3, n3) => {
    let i3 = X;
    return P(), R(z, null, [q(dS, { ref_key: "copyNotificationRef", ref: a2 }, null, 512), L("div", { class: I(["message-list-shell", { "message-list-shell--with-header": e2.hasHeader }]) }, [L("div", { ref_key: "listRef", ref: o2, "aria-busy": e2.loadingEarlierMessages, class: "message-list", onPointerup: T2, onContextmenu: E2, onScroll: de2, onTouchmovePassive: he2, onTouchstartPassive: me2, onWheelPassive: pe2 }, [L("div", { ref_key: "innerRef", ref: s2, class: "message-list__inner" }, [(P(!0), R(z, null, G(e2.messages, (e3) => (P(), W(Ow, { key: e3.id, message: e3, onCopy: re2, onSaveTemplate: n3[0] ||= (e4) => r2("saveTemplate", e4) }, null, 8, ["message"]))), 128))], 512)], 40, Iw), V(c2) ? (P(), R("button", { key: 0, class: "scroll-to-bottom", type: "button", "aria-label": t3.$t("\u6EDA\u52A8\u5230\u5E95\u90E8"), onClick: ge2 }, [q(i3, { name: "roxy-agent/rx-ic-arrow" })], 8, Lw)) : U("", !0)], 2), (P(), W(tt, { to: "body" }, [V(u2) ? (P(), R("div", { key: 0, ref_key: "selectionMenuRef", ref: l2, class: "selection-action-menu", role: "menu", "aria-label": t3.$t("\u9009\u4E2D\u6587\u5B57\u64CD\u4F5C"), style: $e({ left: `${V(u2).left}px`, top: `${V(u2).top}px` }), onPointerdown: n3[1] ||= ut(() => {
    }, ["prevent"]) }, [L("button", { type: "button", role: "menuitem", onClick: O2 }, B(t3.$t("\u590D\u5236")), 1), L("button", { type: "button", role: "menuitem", onClick: ie2 }, B(t3.$t("\u6DFB\u52A0\u5230\u5F53\u524D\u5BF9\u8BDD")), 1), L("button", { type: "button", role: "menuitem", onClick: ae2 }, B(t3.$t("\u4FDD\u5B58\u4E3A\u63D0\u793A\u8BCD")), 1)], 44, Rw)) : U("", !0)]))], 64);
  };
} }), [["__scopeId", "data-v-ce4627f2"]]);
var Kw = { key: 0, class: "chat-header" };
var qw = ["title"];
var Jw = { key: 1, class: "chat-home-actions" };
var Yw = ["aria-label"];
var Xw = { key: 2, class: "home-scroll-shell" };
var Zw = { class: "home-scroll" };
var Qw = { class: "home-hero" };
var $w = { class: "home-intro" };
var eT = { class: "home-brand-orb" };
var tT = { class: "home-copy" };
var nT = { key: 0, class: "template-grid" };
var rT = { key: 1, class: "template-grid" };
var iT = { class: "template-card__main" };
var aT = { class: "template-card__icon", "aria-hidden": "true" };
var oT = ["src", "alt"];
var sT = { class: "template-card__copy" };
var cT = { class: "template-card__footer" };
var lT = { class: "template-tags" };
var uT = ["disabled", "onClick"];
var dT = ["href", "onClick"];
var fT = { key: 4, class: "hitl-overlay", "aria-hidden": "true" };
var pT = { key: 5, class: "chat-drop-overlay", "aria-hidden": "true" };
var mT = { key: 6, class: "chat-drop-label", "aria-hidden": "true" };
var hT = 39;
var gT = 200;
var _T = 35;
var vT = 14;
var yT = 176;
var bT = "agent-console:recommended-template-select-window-guide:";
var xT = Z(M({ __name: "ChatWorkspace", props: Le({ activeConversationId: {}, composerFocusKey: {}, conversationTitle: {}, hitlRequest: {}, hasEarlierMessages: { type: Boolean }, loadingEarlierMessages: { type: Boolean }, messages: {}, onboardingCompletionVisible: { type: Boolean }, pendingAttachments: {}, queuedPrompts: {}, thinking: { type: Boolean }, todoProgress: {} }, { prompt: { required: !0 }, promptModifiers: {} }), emits: Le(["addAttachments", "addFolder", "addPathAttachment", "loadEarlierMessages", "onboardingComplete", "onboardingCompletionDismiss", "onboardingReset", "onboardingRun", "removeAttachment", "removeQueuedPrompt", "reorderQueuedPrompt", "restoreQueuedPrompt", "saveTemplate", "send", "stop", "submitHitl"], ["update:prompt"]), setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, i2 = et(e2, "prompt"), a2 = jt(), o2 = kt(), [s2, c2] = Ct(), l2 = N(null), u2 = Ve(null), d2 = N(0), f2 = N([]), p2 = N(!0), m2 = Ve(/* @__PURE__ */ new Map()), h2 = N(), g2 = N(!1), _2 = Ve(null), v2 = N(""), y2 = N(!1), b2 = Ve(null), S2 = N(""), C2 = N(!1), w2 = Ve(null), T2 = N(""), E2 = N(!1), ee2 = Ve(null), te2 = N(""), D2 = N(!1), ne2 = N(0), O2 = N({}), re2 = /* @__PURE__ */ new Map(), ie2 = /* @__PURE__ */ new Map(), ae2, oe2 = x(), se2 = nn(), k2 = Se(), A2 = cn(), le2 = Ee(), { height: ue2 } = _t(u2), de2, fe2 = !1, pe2 = 0, me2 = Zn()?.templates ?? [];
  me2.length && (f2.value = me2, p2.value = !1);
  let he2 = { script: { name: "roxy-agent/rx-ic-scripts", color: "var(--color-fg-tertiary)" }, skill: { name: "roxy-agent/rx-ic-skills", color: "var(--color-fg-tertiary)" }, prompt: { name: "roxy-agent/rx-ic-prompts", color: "var(--color-fg-tertiary)" } }, ge2 = F(() => !n2.activeConversationId && n2.messages.length === 0), _e2 = F(() => d2.value > 0), ve2 = F(() => n2.conversationTitle?.trim() || $t("\u65B0\u5EFA\u5BF9\u8BDD")), ye2 = F(() => Math.ceil((ue2.value || yT) + hT)), be2 = F(() => ye2.value + _T), xe2 = F(() => ye2.value + vT), Ce2 = F(() => ({ "--agent-composer-reserved-bottom": `${be2.value}px`, "--agent-scroll-button-bottom": `${xe2.value}px` })), we2 = F(() => `${n2.activeConversationId ?? "home"}:${n2.composerFocusKey ?? 0}`);
  function Te2(e3) {
    let t3 = ur(e3, k2.currentLocale), n3 = A2.realTheme === "dark", r3 = rr(t3.iconInfo?.icon, n3), i3 = r3 && er(r3) ? r3 : "", a3 = !i3 && r3 ? r3 : he2[t3.kind].name, o3 = rr(t3.iconInfo?.primaryColor, n3) || he2[t3.kind].color, s3 = rr(t3.iconInfo?.bgColor, n3) || "var(--color-bg-tertiary)";
    return { id: t3.id, slug: t3.slug, title: t3.title, description: t3.description || $t("\u6682\u65E0\u63CF\u8FF0"), iconName: a3, iconSize: r3 ? 44 : 32, imageIcon: i3, iconColor: o3, iconBackground: s3, kind: t3.kind, metadata: e3.metadata, tags: t3.labels.slice(0, 2).map((e4) => ({ id: e4.id, label: e4.label })), prompt: $n(e3, k2.currentLocale) || t3.description || t3.title };
  }
  let De2 = F(() => f2.value.slice(0, 8).map(Te2)), Oe2 = F(() => De2.value.map((e3) => {
    let t3 = m2.value.get(e3.id);
    return t3 ? _r(t3, k2.currentLocale) : Cr(e3);
  }));
  async function ke2() {
    let e3 = ++pe2, t3 = j("chat-workspace:loadTemplateCards");
    p2.value = f2.value.length === 0;
    try {
      let t4 = await oe2.templates.listOfficialTemplates({ limit: 8 }, { paramsSerializer: nr }), n3 = Or(t4, $t("\u52A0\u8F7D\u5B98\u65B9\u6A21\u677F\u5931\u8D25"));
      e3 === pe2 && (f2.value = n3, dr(n3));
    } catch (e4) {
      console.error("[agent-console] Failed to load template cards:", e4);
    } finally {
      e3 === pe2 && (p2.value = !1), t3({ templateCount: f2.value.length });
    }
  }
  function M2() {
    ke2();
  }
  async function Ae2() {
    if (!kr()) try {
      let e3 = await oe2.skillPathInfo();
      vr(e3.installedRoot);
    } catch (e3) {
      console.error("[agent-console] Failed to load Skill installed root:", e3);
    }
  }
  async function je2() {
    if (fe2) {
      ce("chat-workspace:loadRecommendedTemplates:skip-loaded");
      return;
    }
    if (de2) return ce("chat-workspace:loadRecommendedTemplates:reuse-pending"), de2;
    let e3 = j("chat-workspace:loadRecommendedTemplates"), t3 = (async () => {
      await Ae2();
      let e4 = /* @__PURE__ */ new Map(), t4 = 0, n3 = 0;
      do {
        let r3 = await oe2.userTemplates.listUserTemplates({ limit: gT, offset: t4, sortBy: "updated_at", sortOrder: "desc" }), i3 = wr(r3, $t("\u52A0\u8F7D\u63A8\u8350\u6A21\u677F\u5931\u8D25"));
        if (i3.items.forEach((t5) => {
          typeof t5.officialTemplateId == "number" && !e4.has(t5.officialTemplateId) && e4.set(t5.officialTemplateId, t5);
        }), n3 = i3.total, t4 += i3.items.length, !i3.items.length) break;
      } while (t4 < n3);
      m2.value = e4;
    })();
    de2 = t3;
    try {
      await t3, fe2 = !0;
    } catch (e4) {
      throw fe2 = !1, e4;
    } finally {
      de2 === t3 && (de2 = void 0), e3({ loaded: fe2, templateCount: m2.value.size });
    }
  }
  function Ne2(e3) {
    if (typeof e3.officialTemplateId != "number") return e3;
    let t3 = new Map(m2.value);
    return t3.set(e3.officialTemplateId, e3), m2.value = t3, e3;
  }
  async function Pe2(e3) {
    try {
      let t3 = await oe2.userTemplates.createUserTemplate(e3), n3 = Ne2(sr(t3, $t("\u83B7\u53D6\u6A21\u677F\u5931\u8D25")));
      return Nr(n3), s2(0, $t("\u6A21\u677F\u5DF2\u6DFB\u52A0\uFF0C\u70B9\u51FB\u67E5\u770B\u8BE6\u60C5"), { onClick: () => {
        o2.push({ name: "agent-console-my-templates", query: { ...a2.query, editTemplateId: String(n3.id) } });
      } }), n3;
    } catch (e4) {
      console.error("Failed to acquire recommended template", e4), c2(-1, e4 instanceof Error ? e4.message : $t("\u83B7\u53D6\u6A21\u677F\u5931\u8D25"));
      return;
    }
  }
  function Fe2(e3) {
    i2.value = e3, Me(() => {
      l2.value?.focusEditor();
    });
  }
  function Ie2(e3) {
    let t3 = i2.value && !i2.value.endsWith(`
`) ? `
` : "";
    Fe2(`${i2.value}${t3}${e3}`);
  }
  function Le2() {
    let e3 = Gr(le2.userInfo);
    e3 && (Yr(e3), Kr());
  }
  function Re2(e3) {
    se2.open(jr, { props: { modal: !0, blockScroll: !0, dismissableMask: !1, draggable: !1, showHeader: !1, style: { width: "min(540px, calc(100vw - 32px))" }, pt: { root: "agent-console-dialog agent-console-create-template-dialog", content: "!p-0 !overflow-hidden" } }, data: { initialKind: "prompt", initialPrompt: e3, lockKind: !0, submitMode: "save", onSave: async (e4) => await Pe2(Qn(e4)) ? (Le2(), !0) : !1 } });
  }
  async function Be2(e3) {
    await Ae2(), await je2();
    let t3 = m2.value.get(e3.id), n3 = Ar(e3, t3, k2.currentLocale);
    if (!n3) throw Error($t("\u6A21\u677F\u63D0\u793A\u8BCD\u4E3A\u7A7A"));
    return n3;
  }
  async function Ue2(e3) {
    if (h2.value !== void 0) return !1;
    h2.value = e3.id;
    try {
      return Fe2(await Be2(e3)), !0;
    } catch (e4) {
      return console.error("Failed to run recommended template in chat", e4), c2(-1, e4 instanceof Error ? e4.message : $t("\u52A0\u8F7D\u63A8\u8350\u6A21\u677F\u5931\u8D25")), !1;
    } finally {
      h2.value = void 0;
    }
  }
  function Ge2() {
    let e3 = le2.userInfo, t3 = e3.id ?? e3.email ?? e3.phone;
    return t3 == null || t3 === "" ? "" : `${bT}${encodeURIComponent(String(t3))}`;
  }
  function Ke2(e3) {
    try {
      return window.localStorage.getItem(e3) === "1";
    } catch {
      return !1;
    }
  }
  function qe2(e3) {
    try {
      window.localStorage.setItem(e3, "1");
    } catch {
    }
  }
  async function Ye2(e3) {
    if (typeof window > "u" || g2.value || y2.value || C2.value) return;
    let t3 = Ge2();
    if (!t3 || Ke2(t3)) return;
    await Me(), await new Promise((e4) => {
      window.requestAnimationFrame(() => e4());
    });
    let n3 = e3 === "skill", r3 = n3 ? l2.value?.getEmptyInputTokenElement() ?? null : l2.value?.getEmptyProfileTokenElement() ?? null;
    r3 && (_2.value = r3, v2.value = n3 ? $t("\u70B9\u51FB\u586B\u5199\u53C2\u6570") : $t("\u70B9\u51FB\u9009\u62E9\u7A97\u53E3"), g2.value = !0, qe2(t3));
  }
  async function Xe2(e3) {
    await Ue2(e3) && await Ye2(e3.kind);
  }
  function Ze2() {
    g2.value = !1, _2.value = null, v2.value = "", at2(), rt2(), tt2();
  }
  function Qe2() {
    return Gr(le2.userInfo);
  }
  async function tt2() {
    if (typeof window > "u" || g2.value || y2.value || C2.value || E2.value) return;
    let e3 = Qe2();
    if (!e3 || qr(e3) || !Ur(e3) || (await Me(), await new Promise((e4) => {
      window.requestAnimationFrame(() => e4());
    }), g2.value || y2.value || C2.value || E2.value) || qr(e3) || !Ur(e3)) return;
    let t3 = l2.value?.getSelectTemplateButtonElement() ?? null;
    t3 && (ee2.value = t3, te2.value = $t("\u6709\u65B0\u6A21\u677F\uFF0C\u8BD5\u8BD5\u70B9\u51FB\u8FD9\u91CC\u4F7F\u7528\u3002"), E2.value = !0, Wr(e3), Jr(e3));
  }
  function nt2() {
    E2.value = !1, ee2.value = null, te2.value = "", at2(), rt2();
  }
  async function rt2() {
    if (typeof window > "u" || !kp() || g2.value || y2.value || C2.value || E2.value) return;
    let e3 = Qe2();
    if (!e3) return;
    let t3 = Ap();
    if (!t3 && Ep(e3)) {
      jp();
      return;
    }
    if (await Me(), await new Promise((e4) => {
      window.requestAnimationFrame(() => e4());
    }), !kp() || g2.value || y2.value || C2.value || E2.value) return;
    let n3 = l2.value?.getComposerElement() ?? null;
    n3 && (b2.value = n3, S2.value = $t("\u652F\u6301\u7C98\u8D34/\u62D6\u5165\u4EE3\u7406 IP \u4FE1\u606F\u6587\u4EF6\u548C\u8D26\u53F7\u4FE1\u606F\u6587\u4EF6"), y2.value = !0, t3 || Dp(e3), jp());
  }
  function it2() {
    y2.value = !1, b2.value = null, S2.value = "", at2(), tt2();
  }
  async function at2() {
    if (typeof window > "u" || !Yp() || g2.value || y2.value || C2.value || E2.value) return;
    let e3 = Qe2();
    if (!e3) return;
    if (Kp(e3)) {
      Xp();
      return;
    }
    if (await Me(), await new Promise((e4) => {
      window.requestAnimationFrame(() => e4());
    }), !Yp() || g2.value || y2.value || C2.value || E2.value) return;
    let t3 = l2.value?.getSelectTemplateButtonElement() ?? null;
    t3 && (w2.value = t3, T2.value = $t("\u70B9\u51FB\u9009\u62E9\u8981\u6267\u884C\u7684\u81EA\u52A8\u5316\u6A21\u677F"), C2.value = !0, qp(e3), Xp());
  }
  function ot2() {
    C2.value = !1, w2.value = null, T2.value = "", rt2(), tt2();
  }
  function st2() {
    at2();
  }
  function ct2() {
    rt2();
  }
  function lt2() {
    tt2();
  }
  function ut2() {
    g2.value = !1, _2.value = null, v2.value = "", y2.value = !1, b2.value = null, S2.value = "", C2.value = !1, w2.value = null, T2.value = "", E2.value = !1, ee2.value = null, te2.value = "";
  }
  function dt2() {
    ut2(), r2("onboardingReset"), ne2.value += 1, D2.value = !0, ht2();
  }
  function ft2() {
    r2("onboardingCompletionDismiss"), r2("onboardingComplete");
  }
  function pt2() {
    dt2();
  }
  function mt2(e3) {
    if (re2.has(e3)) return Promise.resolve(re2.get(e3) ?? void 0);
    let t3 = ie2.get(e3);
    if (t3) return t3;
    let n3 = Ay[e3], r3 = (async () => {
      let t4 = await oe2.templates.listOfficialTemplates({ limit: 20, search: n3, templateType: "skill" }), r4 = Or(t4, $t("\u52A0\u8F7D\u5B98\u65B9\u6A21\u677F\u5931\u8D25")).find((e4) => e4.slug === n3);
      return re2.set(e3, r4 ?? null), r4;
    })();
    return ie2.set(e3, r3), r3.finally(() => ie2.delete(e3)).catch(() => {
    }), r3;
  }
  async function ht2() {
    if (ae2) return ae2;
    let e3 = Object.keys(Ay);
    if (!e3.every((e4) => Object.hasOwn(O2.value, e4))) return ae2 = Promise.all(e3.map(async (e4) => {
      try {
        return { scenario: e4, template: await mt2(e4) ?? null };
      } catch (t3) {
        return console.warn(`[agent-console] Failed to preload onboarding metadata: ${e4}`, t3), { scenario: e4, template: null };
      }
    })).then((e4) => {
      O2.value = Object.fromEntries(e4.map((e5) => [e5.scenario, e5.template]));
    }).finally(() => {
      ae2 = void 0;
    }), ae2;
  }
  async function gt2(e3) {
    if (D2.value) {
      D2.value = !1;
      try {
        let t3 = await mt2(e3);
        if (!t3) throw Error($t("\u5B98\u65B9\u6A21\u677F\u4E0D\u5B58\u5728\u6216\u5DF2\u4E0B\u67B6"));
        let n3 = Te2(t3), i3 = $n(t3, k2.currentLocale).trim();
        if (!i3) throw Error($t("\u6A21\u677F\u63D0\u793A\u8BCD\u4E3A\u7A7A"));
        let a3 = Ly(await Be2(n3), i3);
        if (!a3) throw Error($t("Skill \u8DEF\u5F84\u52A0\u8F7D\u5931\u8D25"));
        let o3 = Ry(a3, e3, k2.currentLocale);
        await Me(), r2("onboardingRun", o3);
      } catch (t3) {
        console.error(`[agent-console] Failed to run onboarding scenario: ${e3}`, t3), c2(-1, t3 instanceof Error ? t3.message : $t("\u52A0\u8F7D\u5B98\u65B9\u6A21\u677F\u5931\u8D25"));
      }
    }
  }
  function J2(e3) {
    return Array.from(e3.dataTransfer?.types ?? []).some((e4) => e4 === "Files");
  }
  function Y2(e3) {
    return e3.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || e3;
  }
  function vt2(e3) {
    return e3.replace(/\\/g, "/");
  }
  function yt2(e3) {
    if (!globalThis.isElectron) return "";
    try {
      return globalThis.electronAPI.getPathForFile(e3) || "";
    } catch (e4) {
      return console.error("[agent-console] Failed to get dropped file path:", e4), "";
    }
  }
  function bt2(e3, t3, n3) {
    let r3 = vt2(e3), i3 = vt2(t3).split("/").filter(Boolean), a3 = +(i3[0] === n3), o3 = i3.slice(a3).join("/");
    if (!o3) return e3;
    let s3 = `/${o3}`;
    return r3.endsWith(s3) ? e3.slice(0, -s3.length) : "";
  }
  function xt2(e3) {
    return e3.webkitGetAsEntry?.() ?? null;
  }
  function St2(e3, t3) {
    return new Promise((n3, r3) => {
      e3.file((e4) => {
        t3 && Object.defineProperty(e4, "webkitRelativePath", { configurable: !0, value: t3 }), n3(e4);
      }, r3);
    });
  }
  async function wt2(e3) {
    let t3 = e3.createReader(), n3 = [];
    for (; ; ) {
      let e4 = await new Promise((e5, n4) => {
        t3.readEntries(e5, n4);
      });
      if (!e4.length) break;
      n3.push(...e4);
    }
    return n3;
  }
  async function Tt2(e3, t3 = e3.name) {
    let n3 = [], r3 = await wt2(e3);
    for (let e4 of r3) {
      let r4 = `${t3}/${e4.name}`;
      e4.isFile ? n3.push(await St2(e4, r4)) : n3.push(...await Tt2(e4, r4));
    }
    return n3;
  }
  async function Et2(e3, t3 = e3.name) {
    let n3 = await wt2(e3);
    for (let e4 of n3) {
      let n4 = `${t3}/${e4.name}`;
      if (e4.isFile) return St2(e4, n4);
      let r3 = await Et2(e4, n4);
      if (r3) return r3;
    }
  }
  async function Dt2(e3) {
    if (globalThis.isElectron) {
      let t4 = await Et2(e3), n3 = t4 ? yt2(t4) : "", i3 = t4 ? t4.webkitRelativePath || `${e3.name}/${t4.name}` : "", a3 = n3 ? bt2(n3, i3, e3.name) : "";
      if (a3) {
        r2("addPathAttachment", { kind: "folder", name: e3.name || Y2(a3), path: a3 });
        return;
      }
    }
    let t3 = await Tt2(e3);
    t3.length && r2("addFolder", { name: e3.name, files: t3 });
  }
  function Ot2(e3) {
    if (!e3.length) return;
    if (!globalThis.isElectron) {
      r2("addAttachments", e3);
      return;
    }
    let t3 = [];
    for (let n3 of e3) {
      let e4 = yt2(n3);
      e4 ? r2("addPathAttachment", { kind: "file", name: n3.name || Y2(e4), path: e4 }) : t3.push(n3);
    }
    t3.length && r2("addAttachments", t3);
  }
  async function At2(e3) {
    let t3 = Array.from(e3.items ?? []).map((e4) => ({ entry: xt2(e4), item: e4 })).filter((e4) => !!e4.entry);
    if (!t3.length) {
      Ot2(Array.from(e3.files ?? []));
      return;
    }
    let n3 = [];
    for (let { entry: e4, item: i3 } of t3) {
      if (e4.isFile) {
        n3.push(await St2(e4));
        continue;
      }
      let t4 = i3.getAsFile(), a3 = t4 ? yt2(t4) : "";
      a3 ? r2("addPathAttachment", { kind: "folder", name: e4.name || Y2(a3), path: a3 }) : await Dt2(e4);
    }
    Ot2(n3);
  }
  function Mt2(e3) {
    J2(e3) && (e3.preventDefault(), d2.value += 1);
  }
  function Nt2(e3) {
    J2(e3) && (e3.preventDefault(), e3.dataTransfer && (e3.dataTransfer.dropEffect = "copy"));
  }
  function Pt2(e3) {
    J2(e3) && (e3.preventDefault(), d2.value = Math.max(0, d2.value - 1));
  }
  async function Ft2(e3) {
    if (J2(e3) && (e3.preventDefault(), d2.value = 0, e3.dataTransfer)) try {
      await At2(e3.dataTransfer);
    } catch (e4) {
      console.error("[agent-console] Failed to add dropped attachments:", e4);
    }
  }
  return K(l2, async () => {
    await Me(), u2.value = l2.value?.getShellElement() ?? null, at2(), rt2(), tt2();
  }, { flush: "post", immediate: !0 }), K(() => n2.activeConversationId, () => {
    at2(), rt2(), tt2();
  }), K(() => Qe2(), () => {
    at2(), rt2();
  }), He(() => {
    ce("chat-workspace:mounted"), window.addEventListener(xp, ct2), window.addEventListener(Hp, st2), window.addEventListener(Xr, lt2), ke2(), je2().catch((e3) => {
      console.error("Failed to preload recommended templates", e3);
    }), at2(), rt2(), tt2();
  }), ze(() => {
    window.removeEventListener(xp, ct2), window.removeEventListener(Hp, st2), window.removeEventListener(Xr, lt2);
  }), (t3, a3) => {
    let o3 = X, s3 = We("RouterLink");
    return P(), W(zr, { class: I(["chat-workspace", { "chat-workspace--home": V(ge2) }]), padding: "0", "show-profile-monitor-toggle": !1 }, { default: H(() => [L("div", { class: I(["chat-container", { "chat-container--conversation": !V(ge2), "chat-container--awaiting-approval": e2.hitlRequest }]), style: $e(V(Ce2)), onDragenter: Mt2, onDragleave: Pt2, onDragover: Nt2, onDrop: Ft2 }, [V(ge2) ? U("", !0) : (P(), R("header", Kw, [L("div", { class: "chat-header__title", title: V(ve2) }, B(V(ve2)), 9, qw), q(Lr, { variant: "pill" })])), V(ge2) ? (P(), R("div", Jw, [L("button", { class: "chat-home-onboarding", type: "button", "aria-label": t3.$t("\u6253\u5F00\u65B0\u624B\u5F15\u5BFC"), onClick: dt2 }, [a3[14] ||= L("span", null, "?", -1), Je(" " + B(t3.$t("\u65B0\u624B\u5F15\u5BFC")), 1)], 8, Yw), q(Lr, { class: "chat-home-monitor", variant: "pill" })])) : U("", !0), V(ge2) ? (P(), R("section", Xw, [L("div", Zw, [L("div", Qw, [L("div", $w, [L("div", eT, [q(o3, { class: "home-brand-logo", name: "roxy-agent/rx-ic-logo", size: "56" })]), L("div", tT, [L("h1", null, B(t3.$t("\u6709\u4EC0\u4E48\u6211\u80FD\u5E2E\u4F60\u7684\u5417\uFF1F")), 1), L("p", null, B(t3.$t("\u76F4\u63A5\u4E0E\u6211\u804A\u5929\uFF0C\u6216\u9009\u62E9\u6A21\u677F\u4E00\u952E\u5F00\u59CB\u3002")), 1)])]), V(p2) ? (P(), R("div", nT, [q(Al, { count: V(8) }, null, 8, ["count"])])) : V(De2).length ? (P(), R("div", rT, [(P(!0), R(z, null, G(V(De2), (e3) => (P(), R("article", { key: e3.id, class: "template-card" }, [L("div", iT, [L("div", aT, [e3.imageIcon ? (P(), R("img", { key: 0, src: e3.imageIcon, alt: e3.title }, null, 8, oT)) : (P(), W(o3, { key: 1, name: e3.iconName, size: e3.iconSize, color: e3.iconColor }, null, 8, ["name", "size", "color"]))]), L("div", sT, [L("h2", null, [q(xr, { content: e3.title, placement: "top" }, null, 8, ["content"])]), L("p", null, [q(xr, { content: e3.description, placement: "top" }, null, 8, ["content"])])])]), L("div", cT, [L("div", lT, [(P(!0), R(z, null, G(e3.tags, (e4) => (P(), R("span", { key: e4.id, class: I(["template-tag", { "template-tag--script": e4.tone === "script", "template-tag--ai": e4.tone === "ai" }]) }, B(e4.label), 3))), 128))]), L("button", { class: "template-run", type: "button", disabled: V(h2) !== void 0, onClick: (t4) => Xe2(e3) }, B(t3.$t("\u4F7F\u7528")), 9, uT)])]))), 128))])) : U("", !0), q(s3, { custom: "", to: { name: "agent-console-template-store" } }, { default: H(({ href: e3, navigate: n3 }) => [L("a", { class: "more-templates", href: e3, onClick: n3 }, [q(o3, { name: "roxy-agent/rx-ic-templates-store", size: "18" }), L("span", null, B(t3.$t("\u66F4\u591A\u6A21\u677F")), 1)], 8, dT)]), _: 1 })])])])) : (P(), W(Gw, { key: 3, "active-conversation-id": e2.activeConversationId, "has-earlier-messages": e2.hasEarlierMessages, "has-header": "", "loading-earlier-messages": e2.loadingEarlierMessages, messages: e2.messages, onAddToChat: Ie2, onSaveAsPrompt: Re2, onLoadEarlierMessages: a3[0] ||= (e3) => r2("loadEarlierMessages"), onSaveTemplate: a3[1] ||= (e3) => r2("saveTemplate", e3) }, null, 8, ["active-conversation-id", "has-earlier-messages", "loading-earlier-messages", "messages"])), a3[15] ||= L("div", { class: "composer-scroll-mask", "aria-hidden": "true" }, null, -1), e2.hitlRequest ? (P(), R("div", fT)) : U("", !0), q(Er, { ref_key: "composerRef", ref: l2, modelValue: i2.value, "onUpdate:modelValue": a3[2] ||= (e3) => i2.value = e3, "auto-focus": "", "content-key": e2.activeConversationId ?? "home", "focus-key": V(we2), "hitl-request": e2.hitlRequest, "pending-attachments": e2.pendingAttachments, "queued-prompts": e2.queuedPrompts, "recommended-template-items": V(Oe2), "show-glow": V(ge2), thinking: e2.thinking, "todo-progress": e2.todoProgress, onAddAttachments: a3[3] ||= (e3) => r2("addAttachments", e3), onAddFolder: a3[4] ||= (e3) => r2("addFolder", e3), onAddPathAttachment: a3[5] ||= (e3) => r2("addPathAttachment", e3), onOfficialTemplateTopChanged: M2, onRemoveAttachment: a3[6] ||= (e3) => r2("removeAttachment", e3), onRemoveQueuedPrompt: a3[7] ||= (e3) => r2("removeQueuedPrompt", e3), onReorderQueuedPrompt: a3[8] ||= (e3) => r2("reorderQueuedPrompt", e3), onRestoreQueuedPrompt: a3[9] ||= (e3) => r2("restoreQueuedPrompt", e3), onSend: a3[10] ||= (e3) => r2("send"), onStop: a3[11] ||= (e3) => r2("stop"), onSubmitHitl: a3[12] ||= (e3) => r2("submitHitl", e3) }, null, 8, ["modelValue", "content-key", "focus-key", "hitl-request", "pending-attachments", "queued-prompts", "recommended-template-items", "show-glow", "thinking", "todo-progress"]), q(Nv, { label: V(v2), target: V(_2), visible: V(g2), onDismiss: Ze2 }, null, 8, ["label", "target", "visible"]), q(Nv, { label: V(S2), target: V(b2), visible: V(y2), onDismiss: it2 }, null, 8, ["label", "target", "visible"]), q(Nv, { "callout-above-container": "", label: V(T2), target: V(w2), visible: V(C2), onDismiss: ot2 }, null, 8, ["label", "target", "visible"]), q(Nv, { label: V(te2), target: V(ee2), visible: V(E2), onDismiss: nt2 }, null, 8, ["label", "target", "visible"]), q(sS, { "completion-visible": n2.onboardingCompletionVisible, "scenario-templates": V(O2), "session-key": V(ne2), visible: V(D2), onClose: a3[13] ||= (e3) => D2.value = !1, onCompletionContinue: ft2, onCompletionRestart: pt2, onExperience: gt2 }, null, 8, ["completion-visible", "scenario-templates", "session-key", "visible"]), V(_e2) ? (P(), R("div", pT)) : U("", !0), V(_e2) ? (P(), R("div", mT, B(t3.$t("\u62D6\u52A8\u4E0A\u4F20")), 1)) : U("", !0)], 38)]), _: 1 }, 8, ["class"]);
  };
} }), [["__scopeId", "data-v-40ca6d1d"]]);
var ST = { class: "agent-chat-route" };
var CT = Z(M({ __name: "AgentChatRoute", props: Le({ activeConversationId: {}, composerFocusKey: {}, conversationTitle: {}, hitlRequest: {}, hasEarlierMessages: { type: Boolean }, loadingEarlierMessages: { type: Boolean }, messages: {}, onboardingCompletionVisible: { type: Boolean }, pendingAttachments: {}, queuedPrompts: {}, routeTitle: {}, thinking: { type: Boolean }, todoProgress: {} }, { prompt: { required: !0 }, promptModifiers: {} }), emits: Le(["addAttachments", "addFolder", "addPathAttachment", "loadEarlierMessages", "onboardingComplete", "onboardingCompletionDismiss", "onboardingReset", "onboardingRun", "removeAttachment", "removeQueuedPrompt", "reorderQueuedPrompt", "restoreQueuedPrompt", "saveTemplate", "send", "stop", "submitHitl"], ["update:prompt"]), setup(e2, { emit: t2 }) {
  let n2 = t2, r2 = et(e2, "prompt");
  return (t3, i2) => (P(), R("div", ST, [q(xT, { prompt: r2.value, "onUpdate:prompt": i2[0] ||= (e3) => r2.value = e3, "active-conversation-id": e2.activeConversationId, "composer-focus-key": e2.composerFocusKey, "conversation-title": e2.conversationTitle, "hitl-request": e2.hitlRequest, "has-earlier-messages": e2.hasEarlierMessages, "loading-earlier-messages": e2.loadingEarlierMessages, messages: e2.messages, "onboarding-completion-visible": e2.onboardingCompletionVisible, "pending-attachments": e2.pendingAttachments, "queued-prompts": e2.queuedPrompts, thinking: e2.thinking, "todo-progress": e2.todoProgress, onAddAttachments: i2[1] ||= (e3) => n2("addAttachments", e3), onAddFolder: i2[2] ||= (e3) => n2("addFolder", e3), onAddPathAttachment: i2[3] ||= (e3) => n2("addPathAttachment", e3), onLoadEarlierMessages: i2[4] ||= (e3) => n2("loadEarlierMessages"), onOnboardingComplete: i2[5] ||= (e3) => n2("onboardingComplete"), onOnboardingCompletionDismiss: i2[6] ||= (e3) => n2("onboardingCompletionDismiss"), onOnboardingReset: i2[7] ||= (e3) => n2("onboardingReset"), onOnboardingRun: i2[8] ||= (e3) => n2("onboardingRun", e3), onRemoveAttachment: i2[9] ||= (e3) => n2("removeAttachment", e3), onRemoveQueuedPrompt: i2[10] ||= (e3) => n2("removeQueuedPrompt", e3), onReorderQueuedPrompt: i2[11] ||= (e3) => n2("reorderQueuedPrompt", e3), onRestoreQueuedPrompt: i2[12] ||= (e3) => n2("restoreQueuedPrompt", e3), onSaveTemplate: i2[13] ||= (e3) => n2("saveTemplate", e3), onSend: i2[14] ||= (e3) => n2("send"), onStop: i2[15] ||= (e3) => n2("stop"), onSubmitHitl: i2[16] ||= (e3) => n2("submitHitl", e3) }, null, 8, ["prompt", "active-conversation-id", "composer-focus-key", "conversation-title", "hitl-request", "has-earlier-messages", "loading-earlier-messages", "messages", "onboarding-completion-visible", "pending-attachments", "queued-prompts", "thinking", "todo-progress"])]));
} }), [["__scopeId", "data-v-dacbb61d"]]);
function zT() {
  return { handleBusinessCode: async (code, fallback) => {
    if (fallback) return await fallback();
    throw Object.assign(Error("\u672C\u5730\u64CD\u4F5C\u5931\u8D25: " + code), { code });
  } };
}
async function UT(e2) {
  return globalThis.electronAPI.send("syncControl:open");
}
function WT(e2 = "/agent-console") {
  let { openRoxyAIAgent: t2 } = pE();
  t2(e2);
}
var GT = {"roxy-agent": () => WT(),"roxy-agent-task-manager": () => WT("/agent-console/task-manager"),"roxy-agent-my-templates": () => WT("/agent-console/templates"),"roxy-agent-template-store": () => WT("/agent-console/template-store"),"sync-control": UT};
var lE = Nt({ history: Mt("/index.html#"), routes: [{ path: "/synchronizer/dialog/preferences", name: "local-dialog-preferences", component: () => import("./preferences--734d_2_.js") }, { path: "/synchronizer/dialog/batch-inputs", name: "local-dialog-batch-inputs", component: () => import("./batch-inputs-B_HNTlr8.js") }, { path: "/synchronizer/dialog/open-sites", name: "local-dialog-open-sites", component: () => import("./open-sites-BUgaXFNX.js") }, { path: "/synchronizer/dialog/syncing-window-list", name: "local-dialog-syncing-window-list", component: () => import("./syncing-window-list-g5VmUz_T.js") }, { path: "/synchronizer/active", name: "local-synchronizer-active", component: () => import("./action-bar-50RAQCsf.js") }, { path: "/synchronizer", name: "local-synchronizer", component: () => import("./synchronizer-mUJbzl7S.js") }, { path: "/agent-console", name: "agent-console", component: Oy, children: [{ path: "mcp", name: "agent-console-settings", component: () => import("./AgentSettingsRoute-BB9ba93X.js") }, { path: "", name: "agent-console-chat", component: CT }, { path: "c/:conversationId", name: "agent-console-conversation", component: CT }, { path: "task-manager", name: "agent-console-task-manager", component: () => import("./TaskManagerRoute-iC4ANt4w.js") }, { path: "templates", name: "agent-console-my-templates", component: () => import("./MyTemplatesRoute-Eq3HlS6M.js") }, { path: "settings", name: "agent-console-roxyclaw", component: () => import("./local-pages.js").then((m2) => m2.AgentConfig) }, { path: "skills", name: "local-agent-skills", component: () => import("./local-pages.js").then((m2) => m2.Skills) }, { path: "template-store", name: "agent-console-template-store", component: () => import("./TemplateStoreRoute-vzcUC0bD.js") }] }, { path: "/", component: () => import("./layout-C916OUcf.js"), redirect: "/browser/list", children: [{ path: "api-keys", name: "api-keys", component: () => import("./api-keys-qLZdcspG.js"), meta: { title: "API & AI MCP" } }, { path: "extensions", name: "local-extensions", component: () => import("./extensions-DkcE60nw.js"), meta: { title: "\u6269\u5C55\u4E2D\u5FC3" } }, { path: "account", name: "local-account-root", redirect: "/account/list", children: [{ path: "list", name: "account-list", component: () => import("./list-CkXy4JN3.js"), meta: { title: "\u5E73\u53F0\u8D26\u53F7" } }, { path: "create", name: "account-create", component: () => import("./create-QG0MnZuH.js"), meta: { title: "\u6DFB\u52A0\u8D26\u53F7" } }] }, { path: "kernels", name: "local-kernels", component: () => import("./local-pages.js").then((m2) => m2.Kernels) }, { path: "templates", name: "local-templates", component: () => import("./local-pages.js").then((m2) => m2.Templates) }, { path: "projects", name: "projects", redirect: "/projects/list", children: [{ path: ":id", name: "project-item", component: () => import("./project-item-Dd4vT7Wq.js") }, { path: "list", name: "project-list", component: () => import("./projects-CN6_vL2j.js") }] }, { path: "agent/create", name: "agent-create", component: () => import("./create-DJwGZbA7.js") }, { path: "agent", name: "agent-list", component: () => import("./agent-CYnwl_KT.js") }, { path: "browser", name: "browser", redirect: "/browser/list", children: [{ path: "list", name: "browser-list", component: () => import("./list-ByevuXQD.js") }, { path: "edit", name: "browser-edit", component: () => import("./edit-IaDdchpD.js") }, { path: "create", name: "browser-create", component: () => import("./create-HSjma60V.js") }] }] }] });
async function uE(e2) {
  e2.use(lE);
}
function pE() {
  return { opening: N(!1), openRoxyAIAgent: async (route = "/agent-console") => lE.push(route) };
}
var NE = { name: "BaseTieredMenu", extends: Ht, props: { popup: { type: Boolean, default: !1 }, model: { type: Array, default: null }, appendTo: { type: [String, Object], default: "body" }, breakpoint: { type: String, default: "960px" }, autoZIndex: { type: Boolean, default: !0 }, baseZIndex: { type: Number, default: 0 }, disabled: { type: Boolean, default: !1 }, tabindex: { type: Number, default: 0 }, ariaLabelledby: { type: String, default: null }, ariaLabel: { type: String, default: null } }, style: en, provide: function() {
  return { $pcTieredMenu: this, $parentInstance: this };
} };
var PE = { name: "TieredMenuSub", hostName: "TieredMenu", extends: Ht, emits: ["item-click", "item-mouseenter", "item-mousemove"], container: null, props: { menuId: { type: String, default: null }, focusedItemId: { type: String, default: null }, items: { type: Array, default: null }, visible: { type: Boolean, default: !1 }, level: { type: Number, default: 0 }, templates: { type: Object, default: null }, activeItemPath: { type: Object, default: null }, tabindex: { type: Number, default: 0 } }, methods: { getItemId: function(e2) {
  return `${this.menuId}_${e2.key}`;
}, getItemKey: function(e2) {
  return this.getItemId(e2);
}, getItemProp: function(e2, t2, n2) {
  return e2 && e2.item ? Kt(e2.item[t2], n2) : void 0;
}, getItemLabel: function(e2) {
  return this.getItemProp(e2, "label");
}, getItemLabelId: function(e2) {
  return `${this.menuId}_${e2.key}_label`;
}, getPTOptions: function(e2, t2, n2) {
  return this.ptm(n2, { context: { item: e2.item, index: t2, active: this.isItemActive(e2), focused: this.isItemFocused(e2), disabled: this.isItemDisabled(e2) } });
}, isItemActive: function(e2) {
  return this.activeItemPath.some(function(t2) {
    return t2.key === e2.key;
  });
}, isItemVisible: function(e2) {
  return this.getItemProp(e2, "visible") !== !1;
}, isItemDisabled: function(e2) {
  return this.getItemProp(e2, "disabled");
}, isItemFocused: function(e2) {
  return this.focusedItemId === this.getItemId(e2);
}, isItemGroup: function(e2) {
  return Gt(e2.items);
}, onEnter: function() {
  Bt(this.container, this.level);
}, onItemClick: function(e2, t2) {
  this.getItemProp(t2, "command", { originalEvent: e2, item: t2.item }), this.$emit("item-click", { originalEvent: e2, processedItem: t2, isFocus: !0 });
}, onItemMouseEnter: function(e2, t2) {
  this.$emit("item-mouseenter", { originalEvent: e2, processedItem: t2 });
}, onItemMouseMove: function(e2, t2) {
  this.$emit("item-mousemove", { originalEvent: e2, processedItem: t2 });
}, getAriaSetSize: function() {
  var e2 = this;
  return this.items.filter(function(t2) {
    return e2.isItemVisible(t2) && !e2.getItemProp(t2, "separator");
  }).length;
}, getAriaPosInset: function(e2) {
  var t2 = this;
  return e2 - this.items.slice(0, e2).filter(function(e3) {
    return t2.isItemVisible(e3) && t2.getItemProp(e3, "separator");
  }).length + 1;
}, getMenuItemProps: function(e2, t2) {
  return { action: Re({ class: this.cx("itemLink"), tabindex: -1 }, this.getPTOptions(e2, t2, "itemLink")), icon: Re({ class: [this.cx("itemIcon"), this.getItemProp(e2, "icon")] }, this.getPTOptions(e2, t2, "itemIcon")), label: Re({ class: this.cx("itemLabel") }, this.getPTOptions(e2, t2, "itemLabel")), submenuicon: Re({ class: this.cx("submenuIcon") }, this.getPTOptions(e2, t2, "submenuIcon")) };
}, containerRef: function(e2) {
  this.container = e2;
} }, components: { AngleRightIcon: Vn }, directives: { ripple: rn } };
var FE = ["tabindex"];
var IE = ["id", "aria-label", "aria-disabled", "aria-expanded", "aria-haspopup", "aria-level", "aria-setsize", "aria-posinset", "data-p-active", "data-p-focused", "data-p-disabled"];
var LE = ["onClick", "onMouseenter", "onMousemove"];
var RE = ["href", "target"];
var zE = ["id"];
var BE = ["id"];
function VE(e2, t2, n2, r2, i2, a2) {
  var o2 = We("AngleRightIcon"), s2 = We("TieredMenuSub", !0), c2 = Ue("ripple");
  return P(), W(mt, Re({ name: "p-anchored-overlay", onEnter: a2.onEnter }, e2.ptm("menu.transition")), { default: H(function() {
    return [n2.level === 0 || n2.visible ? (P(), R("ul", { key: 0, ref: a2.containerRef, tabindex: n2.tabindex }, [(P(!0), R(z, null, G(n2.items, function(r3, i3) {
      return P(), R(z, { key: a2.getItemKey(r3) }, [a2.isItemVisible(r3) && !a2.getItemProp(r3, "separator") ? (P(), R("li", Re({ key: 0, id: a2.getItemId(r3), style: a2.getItemProp(r3, "style"), class: [e2.cx("item", { processedItem: r3 }), a2.getItemProp(r3, "class")], role: "menuitem", "aria-label": a2.getItemLabel(r3), "aria-disabled": a2.isItemDisabled(r3) || void 0, "aria-expanded": a2.isItemGroup(r3) ? a2.isItemActive(r3) : void 0, "aria-haspopup": a2.isItemGroup(r3) && !a2.getItemProp(r3, "to") ? "menu" : void 0, "aria-level": n2.level + 1, "aria-setsize": a2.getAriaSetSize(), "aria-posinset": a2.getAriaPosInset(i3) }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "item"), { "data-p-active": a2.isItemActive(r3), "data-p-focused": a2.isItemFocused(r3), "data-p-disabled": a2.isItemDisabled(r3) }), [L("div", Re({ class: e2.cx("itemContent"), onClick: function(e3) {
        return a2.onItemClick(e3, r3);
      }, onMouseenter: function(e3) {
        return a2.onItemMouseEnter(e3, r3);
      }, onMousemove: function(e3) {
        return a2.onItemMouseMove(e3, r3);
      } }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "itemContent")), [n2.templates.item ? (P(), W(Ge(n2.templates.item), { key: 1, item: r3.item, hasSubmenu: !!a2.getItemProp(r3, "items"), label: a2.getItemLabel(r3), props: a2.getMenuItemProps(r3, i3) }, null, 8, ["item", "hasSubmenu", "label", "props"])) : rt((P(), R("a", Re({ key: 0, href: a2.getItemProp(r3, "url"), class: e2.cx("itemLink"), target: a2.getItemProp(r3, "target"), tabindex: "-1" }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "itemLink")), [n2.templates.itemicon ? (P(), W(Ge(n2.templates.itemicon), { key: 0, item: r3.item, class: I(e2.cx("itemIcon")) }, null, 8, ["item", "class"])) : a2.getItemProp(r3, "icon") ? (P(), R("span", Re({ key: 1, class: [e2.cx("itemIcon"), a2.getItemProp(r3, "icon")] }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "itemIcon")), null, 16)) : U("", !0), L("span", Re({ id: a2.getItemLabelId(r3), class: e2.cx("itemLabel") }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "itemLabel")), B(a2.getItemLabel(r3)), 17, zE), a2.getItemProp(r3, "items") ? (P(), R(z, { key: 2 }, [n2.templates.submenuicon ? (P(), W(Ge(n2.templates.submenuicon), Re({ key: 0, class: e2.cx("submenuIcon"), active: a2.isItemActive(r3) }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "submenuIcon")), null, 16, ["class", "active"])) : (P(), W(o2, Re({ key: 1, class: e2.cx("submenuIcon") }, { ref_for: !0 }, a2.getPTOptions(r3, i3, "submenuIcon")), null, 16, ["class"]))], 64)) : U("", !0)], 16, RE)), [[c2]])], 16, LE), a2.isItemVisible(r3) && a2.isItemGroup(r3) ? (P(), W(s2, Re({ key: 0, id: a2.getItemId(r3) + "_list", class: e2.cx("submenu"), style: e2.sx("submenu", !0, { processedItem: r3 }), "aria-labelledby": a2.getItemLabelId(r3), role: "menu", menuId: n2.menuId, focusedItemId: n2.focusedItemId, items: r3.items, templates: n2.templates, activeItemPath: n2.activeItemPath, level: n2.level + 1, visible: a2.isItemActive(r3) && a2.isItemGroup(r3), pt: e2.pt, unstyled: e2.unstyled, onItemClick: t2[0] ||= function(t3) {
        return e2.$emit("item-click", t3);
      }, onItemMouseenter: t2[1] ||= function(t3) {
        return e2.$emit("item-mouseenter", t3);
      }, onItemMousemove: t2[2] ||= function(t3) {
        return e2.$emit("item-mousemove", t3);
      } }, { ref_for: !0 }, e2.ptm("submenu")), null, 16, ["id", "class", "style", "aria-labelledby", "menuId", "focusedItemId", "items", "templates", "activeItemPath", "level", "visible", "pt", "unstyled"])) : U("", !0)], 16, IE)) : U("", !0), a2.isItemVisible(r3) && a2.getItemProp(r3, "separator") ? (P(), R("li", Re({ key: 1, id: a2.getItemId(r3), style: a2.getItemProp(r3, "style"), class: [e2.cx("separator"), a2.getItemProp(r3, "class")], role: "separator" }, { ref_for: !0 }, e2.ptm("separator")), null, 16, BE)) : U("", !0)], 64);
    }), 128))], 8, FE)) : U("", !0)];
  }), _: 1 }, 16, ["onEnter"]);
}
PE.render = VE;
var HE = { name: "TieredMenu", extends: NE, inheritAttrs: !1, emits: ["focus", "blur", "before-show", "before-hide", "hide", "show"], outsideClickListener: null, matchMediaListener: null, scrollHandler: null, resizeListener: null, target: null, container: null, menubar: null, searchTimeout: null, searchValue: null, data: function() {
  return { focused: !1, focusedItemInfo: { index: -1, level: 0, parentKey: "" }, activeItemPath: [], visible: !this.popup, submenuVisible: !1, dirty: !1, query: null, queryMatches: !1 };
}, watch: { activeItemPath: function(e2) {
  this.popup || (Gt(e2) ? (this.bindOutsideClickListener(), this.bindResizeListener()) : (this.unbindOutsideClickListener(), this.unbindResizeListener()));
} }, mounted: function() {
  this.bindMatchMediaListener();
}, beforeUnmount: function() {
  this.unbindOutsideClickListener(), this.unbindResizeListener(), this.unbindMatchMediaListener(), this.scrollHandler &&= (this.scrollHandler.destroy(), null), this.container && this.autoZIndex && Yt.clear(this.container), this.target = null, this.container = null;
}, methods: { getItemProp: function(e2, t2) {
  return e2 ? Kt(e2[t2]) : void 0;
}, getItemLabel: function(e2) {
  return this.getItemProp(e2, "label");
}, isItemDisabled: function(e2) {
  return this.getItemProp(e2, "disabled");
}, isItemVisible: function(e2) {
  return this.getItemProp(e2, "visible") !== !1;
}, isItemGroup: function(e2) {
  return Gt(this.getItemProp(e2, "items"));
}, isItemSeparator: function(e2) {
  return this.getItemProp(e2, "separator");
}, getProccessedItemLabel: function(e2) {
  return e2 ? this.getItemLabel(e2.item) : void 0;
}, isProccessedItemGroup: function(e2) {
  return e2 && Gt(e2.items);
}, toggle: function(e2) {
  this.visible ? this.hide(e2, !0) : this.show(e2);
}, show: function(e2, t2) {
  this.popup && (this.$emit("before-show"), this.visible = !0, this.target = e2.currentTarget, this.relatedTarget = e2.relatedTarget || null), t2 && It(this.menubar);
}, hide: function(e2, t2) {
  this.popup && (this.$emit("before-hide"), this.visible = !1), this.activeItemPath = [], this.focusedItemInfo = { index: -1, level: 0, parentKey: "" }, t2 && It(this.relatedTarget || this.target || this.menubar), this.dirty = !1, this.target = null;
}, onFocus: function(e2) {
  this.focused = !0, this.popup || (this.focusedItemInfo = this.focusedItemInfo.index === -1 ? { index: this.findFirstFocusedItemIndex(), level: 0, parentKey: "" } : this.focusedItemInfo), this.$emit("focus", e2);
}, onBlur: function(e2) {
  this.focused = !1, this.focusedItemInfo = { index: -1, level: 0, parentKey: "" }, this.searchValue = "", this.dirty = !1, this.$emit("blur", e2);
}, onKeyDown: function(e2) {
  if (this.disabled) e2.preventDefault();
  else {
    var t2 = e2.metaKey || e2.ctrlKey;
    switch (e2.code) {
      case "ArrowDown":
        this.onArrowDownKey(e2);
        break;
      case "ArrowUp":
        this.onArrowUpKey(e2);
        break;
      case "ArrowLeft":
        this.onArrowLeftKey(e2);
        break;
      case "ArrowRight":
        this.onArrowRightKey(e2);
        break;
      case "Home":
        this.onHomeKey(e2);
        break;
      case "End":
        this.onEndKey(e2);
        break;
      case "Space":
        this.onSpaceKey(e2);
        break;
      case "Enter":
      case "NumpadEnter":
        this.onEnterKey(e2);
        break;
      case "Escape":
        this.onEscapeKey(e2);
        break;
      case "Tab":
        this.onTabKey(e2);
        break;
      case "PageDown":
      case "PageUp":
      case "Backspace":
      case "ShiftLeft":
      case "ShiftRight":
        break;
      default:
        !t2 && Jt(e2.key) && this.searchItems(e2, e2.key);
    }
  }
}, onItemChange: function(e2, t2) {
  var n2 = e2.processedItem, r2 = e2.isFocus;
  if (!Wt(n2)) {
    var i2 = n2.index, a2 = n2.key, o2 = n2.level, s2 = n2.parentKey, c2 = n2.items, l2 = Gt(c2), u2 = this.activeItemPath.filter(function(e3) {
      return e3.parentKey !== s2 && e3.parentKey !== a2;
    });
    l2 && (u2.push(n2), this.submenuVisible = !0), this.focusedItemInfo = { index: i2, level: o2, parentKey: s2 }, l2 && (this.dirty = !0), r2 && It(this.menubar), !(t2 === "hover" && this.queryMatches) && (this.activeItemPath = u2);
  }
}, onOverlayClick: function(e2) {
  pn.emit("overlay-click", { originalEvent: e2, target: this.target });
}, onItemClick: function(e2) {
  var t2 = e2.originalEvent, n2 = e2.processedItem, r2 = this.isProccessedItemGroup(n2), i2 = Wt(n2.parent);
  if (this.isSelected(n2)) {
    var a2 = n2.index, o2 = n2.key, s2 = n2.level, c2 = n2.parentKey;
    this.activeItemPath = this.activeItemPath.filter(function(e3) {
      return o2 !== e3.key && o2.startsWith(e3.key);
    }), this.focusedItemInfo = { index: a2, level: s2, parentKey: c2 }, this.dirty = !i2, It(this.menubar);
  } else if (r2) this.onItemChange(e2);
  else {
    var l2 = i2 ? n2 : this.activeItemPath.find(function(e3) {
      return e3.parentKey === "";
    });
    this.hide(t2), this.changeFocusedItemIndex(t2, l2 ? l2.index : -1), It(this.menubar);
  }
}, onItemMouseEnter: function(e2) {
  this.dirty && this.onItemChange(e2, "hover");
}, onItemMouseMove: function(e2) {
  this.focused && this.changeFocusedItemIndex(e2, e2.processedItem.index);
}, onArrowDownKey: function(e2) {
  var t2 = this.focusedItemInfo.index === -1 ? this.findFirstFocusedItemIndex() : this.findNextItemIndex(this.focusedItemInfo.index);
  this.changeFocusedItemIndex(e2, t2), e2.preventDefault();
}, onArrowUpKey: function(e2) {
  if (e2.altKey) {
    if (this.focusedItemInfo.index !== -1) {
      var t2 = this.visibleItems[this.focusedItemInfo.index];
      !this.isProccessedItemGroup(t2) && this.onItemChange({ originalEvent: e2, processedItem: t2 });
    }
    this.popup && this.hide(e2, !0), e2.preventDefault();
  } else {
    var n2 = this.focusedItemInfo.index === -1 ? this.findLastFocusedItemIndex() : this.findPrevItemIndex(this.focusedItemInfo.index);
    this.changeFocusedItemIndex(e2, n2), e2.preventDefault();
  }
}, onArrowLeftKey: function(e2) {
  var t2 = this, n2 = this.visibleItems[this.focusedItemInfo.index], r2 = this.activeItemPath.find(function(e3) {
    return e3.key === n2.parentKey;
  });
  Wt(n2.parent) || (this.focusedItemInfo = { index: -1, parentKey: r2 ? r2.parentKey : "" }, this.searchValue = "", this.onArrowDownKey(e2)), this.activeItemPath = this.activeItemPath.filter(function(e3) {
    return e3.parentKey !== t2.focusedItemInfo.parentKey;
  }), e2.preventDefault();
}, onArrowRightKey: function(e2) {
  var t2 = this.visibleItems[this.focusedItemInfo.index];
  this.isProccessedItemGroup(t2) && (this.onItemChange({ originalEvent: e2, processedItem: t2 }), this.focusedItemInfo = { index: -1, parentKey: t2.key }, this.searchValue = "", this.onArrowDownKey(e2)), e2.preventDefault();
}, onHomeKey: function(e2) {
  this.changeFocusedItemIndex(e2, this.findFirstItemIndex()), e2.preventDefault();
}, onEndKey: function(e2) {
  this.changeFocusedItemIndex(e2, this.findLastItemIndex()), e2.preventDefault();
}, onEnterKey: function(e2) {
  if (this.focusedItemInfo.index !== -1) {
    var t2 = Lt(this.menubar, `li[id="${`${this.focusedItemId}`}"]`), n2 = t2 && Lt(t2, '[data-pc-section="itemlink"]');
    if (n2 ? n2.click() : t2 && t2.click(), !this.popup) {
      var r2 = this.visibleItems[this.focusedItemInfo.index];
      !this.isProccessedItemGroup(r2) && (this.focusedItemInfo.index = this.findFirstFocusedItemIndex());
    }
  }
  e2.preventDefault();
}, onSpaceKey: function(e2) {
  this.onEnterKey(e2);
}, onEscapeKey: function(e2) {
  if (this.popup || this.focusedItemInfo.level !== 0) {
    var t2 = this.focusedItemInfo;
    this.hide(e2, !1), this.focusedItemInfo = { index: Number(t2.parentKey.split("_")[0]), level: 0, parentKey: "" }, this.popup && It(this.target);
  }
  e2.preventDefault();
}, onTabKey: function(e2) {
  if (this.focusedItemInfo.index !== -1) {
    var t2 = this.visibleItems[this.focusedItemInfo.index];
    !this.isProccessedItemGroup(t2) && this.onItemChange({ originalEvent: e2, processedItem: t2 });
  }
  this.hide();
}, onEnter: function(e2) {
  this.autoZIndex && Yt.set("menu", e2, this.baseZIndex || this.$primevue.config.zIndex.menu), Ut(e2, { position: "absolute", top: "0" }), this.alignOverlay(), It(this.menubar), this.scrollInView();
}, onAfterEnter: function() {
  this.bindOutsideClickListener(), this.bindScrollListener(), this.bindResizeListener(), this.$emit("show");
}, onLeave: function() {
  this.unbindOutsideClickListener(), this.unbindScrollListener(), this.unbindResizeListener(), this.$emit("hide"), this.container = null, this.dirty = !1;
}, onAfterLeave: function(e2) {
  this.autoZIndex && Yt.clear(e2);
}, alignOverlay: function() {
  Vt(this.container, this.target), Rt(this.target) > Rt(this.container) && (this.container.style.minWidth = Rt(this.target) + "px");
}, bindOutsideClickListener: function() {
  var e2 = this;
  this.outsideClickListener || (this.outsideClickListener = function(t2) {
    var n2 = e2.container && !e2.container.contains(t2.target), r2 = !e2.popup || !e2.target || e2.target !== t2.target && !e2.target.contains(t2.target);
    n2 && r2 && e2.hide();
  }, document.addEventListener("click", this.outsideClickListener, !0));
}, unbindOutsideClickListener: function() {
  this.outsideClickListener &&= (document.removeEventListener("click", this.outsideClickListener, !0), null);
}, bindScrollListener: function() {
  var e2 = this;
  this.scrollHandler ||= new an(this.target, function(t2) {
    e2.hide(t2, !0);
  }), this.scrollHandler.bindScrollListener();
}, unbindScrollListener: function() {
  this.scrollHandler && this.scrollHandler.unbindScrollListener();
}, bindResizeListener: function() {
  var e2 = this;
  this.resizeListener || (this.resizeListener = function(t2) {
    zt() || e2.hide(t2, !0);
  }, window.addEventListener("resize", this.resizeListener));
}, unbindResizeListener: function() {
  this.resizeListener &&= (window.removeEventListener("resize", this.resizeListener), null);
}, bindMatchMediaListener: function() {
  var e2 = this;
  if (!this.matchMediaListener) {
    var t2 = matchMedia(`(max-width: ${this.breakpoint})`);
    this.query = t2, this.queryMatches = t2.matches, this.matchMediaListener = function() {
      e2.queryMatches = t2.matches;
    }, this.query.addEventListener("change", this.matchMediaListener);
  }
}, unbindMatchMediaListener: function() {
  this.matchMediaListener &&= (this.query.removeEventListener("change", this.matchMediaListener), null);
}, isItemMatched: function(e2) {
  return this.isValidItem(e2) && this.getProccessedItemLabel(e2)?.toLocaleLowerCase().startsWith(this.searchValue.toLocaleLowerCase());
}, isValidItem: function(e2) {
  return !!e2 && !this.isItemDisabled(e2.item) && !this.isItemSeparator(e2.item) && this.isItemVisible(e2.item);
}, isValidSelectedItem: function(e2) {
  return this.isValidItem(e2) && this.isSelected(e2);
}, isSelected: function(e2) {
  return this.activeItemPath.some(function(t2) {
    return t2.key === e2.key;
  });
}, findFirstItemIndex: function() {
  var e2 = this;
  return this.visibleItems.findIndex(function(t2) {
    return e2.isValidItem(t2);
  });
}, findLastItemIndex: function() {
  var e2 = this;
  return qt(this.visibleItems, function(t2) {
    return e2.isValidItem(t2);
  });
}, findNextItemIndex: function(e2) {
  var t2 = this, n2 = e2 < this.visibleItems.length - 1 ? this.visibleItems.slice(e2 + 1).findIndex(function(e3) {
    return t2.isValidItem(e3);
  }) : -1;
  return n2 > -1 ? n2 + e2 + 1 : e2;
}, findPrevItemIndex: function(e2) {
  var t2 = this, n2 = e2 > 0 ? qt(this.visibleItems.slice(0, e2), function(e3) {
    return t2.isValidItem(e3);
  }) : -1;
  return n2 > -1 ? n2 : e2;
}, findSelectedItemIndex: function() {
  var e2 = this;
  return this.visibleItems.findIndex(function(t2) {
    return e2.isValidSelectedItem(t2);
  });
}, findFirstFocusedItemIndex: function() {
  var e2 = this.findSelectedItemIndex();
  return e2 < 0 ? this.findFirstItemIndex() : e2;
}, findLastFocusedItemIndex: function() {
  var e2 = this.findSelectedItemIndex();
  return e2 < 0 ? this.findLastItemIndex() : e2;
}, searchItems: function(e2, t2) {
  var n2 = this;
  this.searchValue = (this.searchValue || "") + t2;
  var r2 = -1, i2 = !1;
  return this.focusedItemInfo.index === -1 ? r2 = this.visibleItems.findIndex(function(e3) {
    return n2.isItemMatched(e3);
  }) : (r2 = this.visibleItems.slice(this.focusedItemInfo.index).findIndex(function(e3) {
    return n2.isItemMatched(e3);
  }), r2 = r2 === -1 ? this.visibleItems.slice(0, this.focusedItemInfo.index).findIndex(function(e3) {
    return n2.isItemMatched(e3);
  }) : r2 + this.focusedItemInfo.index), r2 !== -1 && (i2 = !0), r2 === -1 && this.focusedItemInfo.index === -1 && (r2 = this.findFirstFocusedItemIndex()), r2 !== -1 && this.changeFocusedItemIndex(e2, r2), this.searchTimeout && clearTimeout(this.searchTimeout), this.searchTimeout = setTimeout(function() {
    n2.searchValue = "", n2.searchTimeout = null;
  }, 500), i2;
}, changeFocusedItemIndex: function(e2, t2) {
  this.focusedItemInfo.index !== t2 && (this.focusedItemInfo.index = t2, this.scrollInView());
}, scrollInView: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : -1, t2 = e2 === -1 ? this.focusedItemId : `${this.$id}_${e2}`, n2 = Lt(this.menubar, `li[id="${t2}"]`);
  n2 && n2.scrollIntoView && n2.scrollIntoView({ block: "nearest", inline: "start" });
}, createProcessedItems: function(e2) {
  var t2 = this, n2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0, r2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, i2 = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "", a2 = [];
  return e2 && e2.forEach(function(e3, o2) {
    var s2 = (i2 === "" ? "" : i2 + "_") + o2, c2 = { item: e3, index: o2, level: n2, key: s2, parent: r2, parentKey: i2 };
    c2.items = t2.createProcessedItems(e3.items, n2 + 1, c2, s2), a2.push(c2);
  }), a2;
}, containerRef: function(e2) {
  this.container = e2;
}, menubarRef: function(e2) {
  this.menubar = e2 ? e2.$el : void 0;
} }, computed: { processedItems: function() {
  return this.createProcessedItems(this.model || []);
}, visibleItems: function() {
  var e2 = this, t2 = this.activeItemPath.find(function(t3) {
    return t3.key === e2.focusedItemInfo.parentKey;
  });
  return t2 ? t2.items : this.processedItems;
}, focusedItemId: function() {
  return this.focusedItemInfo.index === -1 ? null : `${this.$id}${Gt(this.focusedItemInfo.parentKey) ? "_" + this.focusedItemInfo.parentKey : ""}_${this.focusedItemInfo.index}`;
} }, components: { TieredMenuSub: PE, Portal: un } };
var UE = ["id"];
function WE(e2, t2, n2, r2, i2, a2) {
  var o2 = We("TieredMenuSub"), s2 = We("Portal");
  return P(), W(s2, { appendTo: e2.appendTo, disabled: !e2.popup }, { default: H(function() {
    return [q(mt, Re({ name: "p-anchored-overlay", onEnter: a2.onEnter, onAfterEnter: a2.onAfterEnter, onLeave: a2.onLeave, onAfterLeave: a2.onAfterLeave }, e2.ptm("transition")), { default: H(function() {
      return [i2.visible ? (P(), R("div", Re({ key: 0, ref: a2.containerRef, id: e2.$id, class: e2.cx("root"), onClick: t2[0] ||= function() {
        return a2.onOverlayClick && a2.onOverlayClick.apply(a2, arguments);
      } }, e2.ptmi("root")), [e2.$slots.start ? (P(), R("div", Re({ key: 0, class: e2.cx("start") }, e2.ptm("start")), [Fe(e2.$slots, "start")], 16)) : U("", !0), q(o2, Re({ ref: a2.menubarRef, id: e2.$id + "_list", class: e2.cx("rootList"), tabindex: e2.disabled ? -1 : e2.tabindex, role: "menubar", "aria-label": e2.ariaLabel, "aria-labelledby": e2.ariaLabelledby, "aria-disabled": e2.disabled || void 0, "aria-orientation": "vertical", "aria-activedescendant": i2.focused ? a2.focusedItemId : void 0, menuId: e2.$id, focusedItemId: i2.focused ? a2.focusedItemId : void 0, items: a2.processedItems, templates: e2.$slots, activeItemPath: i2.activeItemPath, level: 0, visible: i2.submenuVisible, pt: e2.pt, unstyled: e2.unstyled, onFocus: a2.onFocus, onBlur: a2.onBlur, onKeydown: a2.onKeyDown, onItemClick: a2.onItemClick, onItemMouseenter: a2.onItemMouseEnter, onItemMousemove: a2.onItemMouseMove }, e2.ptm("rootList")), null, 16, ["id", "class", "tabindex", "aria-label", "aria-labelledby", "aria-disabled", "aria-activedescendant", "menuId", "focusedItemId", "items", "templates", "activeItemPath", "visible", "pt", "unstyled", "onFocus", "onBlur", "onKeydown", "onItemClick", "onItemMouseenter", "onItemMousemove"]), e2.$slots.end ? (P(), R("div", Re({ key: 1, class: e2.cx("end") }, e2.ptm("end")), [Fe(e2.$slots, "end")], 16)) : U("", !0)], 16, UE)) : U("", !0)];
    }), _: 3 }, 16, ["onEnter", "onAfterEnter", "onLeave", "onAfterLeave"])];
  }), _: 3 }, 8, ["appendTo", "disabled"]);
}
HE.render = WE;
var GE = { name: "SplitButton", extends: { name: "BaseSplitButton", extends: Ht, props: { label: { type: String, default: null }, icon: { type: String, default: null }, model: { type: Array, default: null }, autoZIndex: { type: Boolean, default: !0 }, baseZIndex: { type: Number, default: 0 }, appendTo: { type: [String, Object], default: "body" }, disabled: { type: Boolean, default: !1 }, fluid: { type: Boolean, default: null }, class: { type: null, default: null }, style: { type: null, default: null }, buttonProps: { type: null, default: null }, menuButtonProps: { type: null, default: null }, menuButtonIcon: { type: String, default: void 0 }, dropdownIcon: { type: String, default: void 0 }, severity: { type: String, default: null }, raised: { type: Boolean, default: !1 }, rounded: { type: Boolean, default: !1 }, text: { type: Boolean, default: !1 }, outlined: { type: Boolean, default: !1 }, size: { type: String, default: null }, plain: { type: Boolean, default: !1 } }, style: Zt, provide: function() {
  return { $pcSplitButton: this, $parentInstance: this };
} }, inheritAttrs: !1, emits: ["click"], inject: { $pcFluid: { default: null } }, data: function() {
  return { isExpanded: !1 };
}, mounted: function() {
  var e2 = this;
  this.$watch("$refs.menu.visible", function(t2) {
    e2.isExpanded = t2;
  });
}, methods: { onDropdownButtonClick: function(e2) {
  e2 && e2.preventDefault(), this.$refs.menu.toggle({ currentTarget: this.$el, relatedTarget: this.$refs.button.$el }), this.isExpanded = this.$refs.menu.visible;
}, onDropdownKeydown: function(e2) {
  (e2.code === "ArrowDown" || e2.code === "ArrowUp") && (this.onDropdownButtonClick(), e2.preventDefault());
}, onDefaultButtonClick: function(e2) {
  this.isExpanded && this.$refs.menu.hide(e2), this.$emit("click", e2);
} }, computed: { containerClass: function() {
  return [this.cx("root"), this.class];
}, hasFluid: function() {
  return Wt(this.fluid) ? !!this.$pcFluid : this.fluid;
} }, components: { PVSButton: sn, PVSMenu: HE, ChevronDownIcon: Bn } };
var KE = ["data-p-severity"];
function qE(e2, t2, n2, r2, i2, a2) {
  var o2 = We("PVSButton"), s2 = We("PVSMenu");
  return P(), R("div", Re({ class: a2.containerClass, style: e2.style }, e2.ptmi("root"), { "data-p-severity": e2.severity }), [q(o2, Re({ type: "button", class: e2.cx("pcButton"), label: e2.label, disabled: e2.disabled, severity: e2.severity, text: e2.text, icon: e2.icon, outlined: e2.outlined, size: e2.size, fluid: e2.fluid, "aria-label": e2.label, onClick: a2.onDefaultButtonClick }, e2.buttonProps, { pt: e2.ptm("pcButton"), unstyled: e2.unstyled }), it({ default: H(function() {
    return [Fe(e2.$slots, "default")];
  }), _: 2 }, [e2.$slots.icon ? { name: "icon", fn: H(function(t3) {
    return [Fe(e2.$slots, "icon", { class: I(t3.class) }, function() {
      return [L("span", Re({ class: [e2.icon, t3.class] }, e2.ptm("pcButton").icon, { "data-pc-section": "buttonicon" }), null, 16)];
    })];
  }), key: "0" } : void 0]), 1040, ["class", "label", "disabled", "severity", "text", "icon", "outlined", "size", "fluid", "aria-label", "onClick", "pt", "unstyled"]), q(o2, Re({ ref: "button", type: "button", class: e2.cx("pcDropdown"), disabled: e2.disabled, "aria-haspopup": "true", "aria-expanded": i2.isExpanded, "aria-controls": i2.isExpanded ? e2.$id + "_overlay" : void 0, onClick: a2.onDropdownButtonClick, onKeydown: a2.onDropdownKeydown, severity: e2.severity, text: e2.text, outlined: e2.outlined, size: e2.size, unstyled: e2.unstyled }, e2.menuButtonProps, { pt: e2.ptm("pcDropdown") }), { icon: H(function(t3) {
    return [Fe(e2.$slots, e2.$slots.dropdownicon ? "dropdownicon" : "menubuttonicon", { class: I(t3.class) }, function() {
      return [(P(), W(Ge(e2.menuButtonIcon || e2.dropdownIcon ? "span" : "ChevronDownIcon"), Re({ class: [e2.dropdownIcon || e2.menuButtonIcon, t3.class] }, e2.ptm("pcDropdown").icon, { "data-pc-section": "menubuttonicon" }), null, 16, ["class"]))];
    })];
  }), _: 3 }, 16, ["class", "disabled", "aria-expanded", "aria-controls", "onClick", "onKeydown", "severity", "text", "outlined", "size", "unstyled", "pt"]), q(s2, { ref: "menu", id: e2.$id + "_overlay", model: e2.model, popup: !0, autoZIndex: e2.autoZIndex, baseZIndex: e2.baseZIndex, appendTo: e2.appendTo, unstyled: e2.unstyled, pt: e2.ptm("pcMenu") }, it({ _: 2 }, [e2.$slots.menuitemicon ? { name: "itemicon", fn: H(function(t3) {
    return [Fe(e2.$slots, "menuitemicon", { item: t3.item, class: I(t3.class) })];
  }), key: "0" } : void 0, e2.$slots.item ? { name: "item", fn: H(function(t3) {
    return [Fe(e2.$slots, "item", { item: t3.item, hasSubmenu: t3.hasSubmenu, label: t3.label, props: t3.props })];
  }), key: "1" } : void 0]), 1032, ["id", "model", "autoZIndex", "baseZIndex", "appendTo", "unstyled", "pt"])], 16, KE);
}
GE.render = qE;
export {D_ as A,$r as K,Ip as N,_p as P,lE as d,uE as f,GT as m,GE as o,HE as s,pE as u,zT as w};