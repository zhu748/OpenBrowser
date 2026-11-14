import {An as e,Cn as t,N as n,Sn as r,h as i,jn as a,kn as o,mt as s,ni as c,or as l,sn as u,wn as d,xn as f,yn as p} from "./utils-BIWenCnY.js";
import {At as m,C as h,D as g,F as _,J as v,N as y,R as ee,St as b,Tt as x,V as te,W as S,_t as ne,at as C,b as w,bt as re,d as T,en as E,f as D,h as O,i as k,in as A,jt as j,k as M,lt as N,m as P,p as F,q as I,rn as L,rt as ie,s as R,st as z,ut as ae,x as B} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {d as oe,i as se,l as V,m as H,n as U,p as W} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {c as ce} from "./dist-NctnpPRe.js";
import {n as le} from "./agent-BmSFI9WH.js";
import {b as ue} from "./rich-html-link-VdBpR3Cm.js";
import {n as G} from "./workspace-CNvgSgaH.js";
import {Z as de} from "./basecomponent-ClhuVxJN.js";
import {t as K} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as fe} from "./usedialog-Dh0xp3r7.js";
import {t as q} from "./dist-web-BSWtPfDO.js";
import {n as pe} from "./motion-BwnyBP9B.js";
import {t as me} from "./AnimatePresence-d-29l3Fb.js";
import {t as he} from "./skeleton-CcmFVUhV.js";
import {a as ge,c as _e,f as ve,h as ye,i as J,l as be,m as xe,n as Y,o as Se,r as Ce,s as we,t as Te,u as Ee} from "./ScriptSchemaForm-z_48GvPJ.js";
import {r as De} from "./AgentConsolePageLayout-CwKh-Fcw.js";
import {t as Oe} from "./AgentInput-CVahkFed.js";
import {a as ke,c as Ae,i as je,l as Me,n as Ne,o as Pe,r as Fe,s as Ie,t as Le} from "./dist-BAPiYeUN.js";
var Re = "data-agent-favicon-url";
var ze = "base/rx_ic_internet";
var Be = new URL("data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%20fill='currentColor'%20viewBox='0%200%2024%2024'%3e%3cpath%20fill-rule='evenodd'%20d='M1%2012C1%205.925%205.925%201%2012%201s11%204.925%2011%2011-4.925%2011-11%2011S1%2018.075%201%2012Zm2.055-1H7.05a16.3%2016.3%200%200%201%202.676-7.71A9.008%209.008%200%200%200%203.055%2011ZM12%203.55A14.3%2014.3%200%200%200%209.058%2011h5.884A14.3%2014.3%200%200%200%2012%203.55ZM14.942%2013A14.3%2014.3%200%200%201%2012%2020.45%2014.3%2014.3%200%200%201%209.058%2013h5.884ZM7.05%2013H3.055a9.008%209.008%200%200%200%206.67%207.71A16.3%2016.3%200%200%201%207.05%2013Zm7.224%207.71A16.3%2016.3%200%200%200%2016.95%2013h3.995a9.008%209.008%200%200%201-6.67%207.71ZM20.945%2011H16.95a16.3%2016.3%200%200%200-2.676-7.71A9.008%209.008%200%200%201%2020.945%2011Z'%20clip-rule='evenodd'/%3e%3c/svg%3e", "" + import.meta.url).toString();
function Ve() {
  return `a[${Re}] { --agent-favicon-fallback-image: url(${JSON.stringify(Be)}); }`;
}
function He(e4) {
  return `${`a[${Re}=${JSON.stringify(e4)}]`} {
  --agent-favicon-image: url(${JSON.stringify(e4)});
  --agent-favicon-fallback-opacity: 0;
  --agent-favicon-fallback-scale: 0.85;
  --agent-favicon-opacity: 1;
  --agent-favicon-scale: 1;
}`;
}
function Ue(e4) {
  if (e4?.trim()) try {
    let t2 = new URL(e4.trim());
    return t2.protocol !== "http:" && t2.protocol !== "https:" ? void 0 : new URL("/favicon.ico", t2.origin).toString();
  } catch {
    return;
  }
}
function We(e4) {
  if (!e4 || typeof MutationObserver > "u" || globalThis.Image === void 0) return () => {
  };
  let t2 = e4.ownerDocument.createElement("style"), n2 = /* @__PURE__ */ new Map(), r2 = /* @__PURE__ */ new Map(), i2 = !1;
  t2.textContent = Ve(), e4.ownerDocument.head.append(t2);
  function a2(e5) {
    let a3 = e5.dataset.agentFaviconUrl;
    if (!a3 || n2.has(a3)) return;
    n2.set(a3, "loading");
    let o3 = new globalThis.Image();
    o3.decoding = "async", o3.referrerPolicy = "no-referrer", r2.set(a3, o3);
    let s3 = (e6) => {
      i2 || r2.get(a3) !== o3 || (r2.delete(a3), n2.set(a3, e6), e6 === "loaded" && (t2.textContent += `
${He(a3)}`));
    };
    o3.addEventListener("load", () => s3("loaded"), { once: !0 }), o3.addEventListener("error", () => s3("failed"), { once: !0 }), o3.src = a3;
  }
  function o2() {
    e4?.querySelectorAll(`a[${Re}]`).forEach(a2);
  }
  o2();
  let s2 = new MutationObserver(o2);
  return s2.observe(e4, { attributes: !0, attributeFilter: [Re], childList: !0, subtree: !0 }), () => {
    i2 = !0, s2.disconnect(), r2.clear(), t2.remove();
  };
}
function Ge(e4, t2, n2 = Date.now(), r2 = {}) {
  return { id: `queued-prompt-${n2}-${Math.random().toString(16).slice(2, 8)}`, conversationId: e4, content: t2.trim(), draftContent: r2.draftContent, attachments: r2.attachments, createdAt: n2 };
}
function Ke(e4) {
  return e4.content || e4.attachments?.map((e5) => e5.fileName).join(", ") || "";
}
function qe(e4, t2) {
  let n2 = e4.findIndex((e5) => e5.id === t2);
  if (!(n2 < 0)) return e4.splice(n2, 1)[0];
}
function Je(e4, t2, n2) {
  let r2 = e4.findIndex((e5) => e5.id === t2);
  if (r2 < 0) return !1;
  let [i2] = e4.splice(r2, 1);
  return i2 ? (e4.splice(Math.max(0, Math.min(n2, e4.length)), 0, i2), !0) : !1;
}
function Ye(e4) {
  return typeof e4 == "object" && !!e4 && !Array.isArray(e4);
}
function Xe(e4) {
  if (!Ye(e4)) return;
  let t2 = typeof e4.light == "string" ? e4.light.trim() : "", n2 = typeof e4.dark == "string" ? e4.dark.trim() : "";
  if (t2 || n2) return { ...t2 ? { light: t2 } : {}, ...n2 ? { dark: n2 } : {} };
}
function Ze(e4) {
  if (!Ye(e4)) return null;
  let t2 = Xe(e4.icon), n2 = Xe(e4.primaryColor), r2 = Xe(e4.bgColor);
  return !t2 && !n2 && !r2 ? null : { ...t2 ? { icon: t2 } : {}, ...n2 ? { primaryColor: n2 } : {}, ...r2 ? { bgColor: r2 } : {} };
}
function Qe(e4, t2) {
  return e4 ? t2 ? e4.dark || e4.light || "" : e4.light || e4.dark || "" : "";
}
function $e(e4) {
  return /^(?:https?:)?\/\//.test(e4) || /^(?:data|blob|file):/.test(e4) || e4.startsWith("/") || e4.startsWith("./") || e4.startsWith("../") || /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(e4);
}
function et(e4) {
  return typeof e4 == "string" ? e4.trim() ? e4 : "" : Array.isArray(e4) ? e4.filter((e5) => typeof e5 == "string" && !!e5.trim()).join(`

`) : "";
}
function X(e4, t2) {
  let n2 = et(e4);
  if (n2) return n2;
  if (!Ye(e4)) return "";
  let r2 = t2?.split("-")[0]?.toLowerCase(), i2 = r2 === "zh" ? ["zh", "cn"] : [r2, r2 === "en" ? "us" : void 0, "en", "zh", "cn", "ru"];
  for (let t3 of i2) {
    let n3 = et(t3 ? e4[t3] : void 0);
    if (n3) return n3;
  }
  for (let t3 of Object.values(e4)) {
    let e5 = et(t3);
    if (e5) return e5;
  }
  return "";
}
function tt(e4, t2) {
  return e4 ? X(e4.templateType === "skill" ? e4.metadata.usageExample : e4.metadata.prompt, t2) : "";
}
function nt(e4, t2) {
  if (!Ye(e4)) throw Error(t2);
  if (e4.code !== 0) throw Error(typeof e4.message == "string" ? e4.message : t2);
  if (!Array.isArray(e4.data)) throw Error(t2);
  return e4.data;
}
function rt(e4, t2) {
  if (!Ye(e4) || e4.code !== 0 || !Ye(e4.data)) throw Error(Ye(e4) && typeof e4.message == "string" ? e4.message : t2);
  let { items: n2, total: r2, limit: i2, offset: a2 } = e4.data;
  if (!Array.isArray(n2) || typeof r2 != "number" || typeof i2 != "number" || typeof a2 != "number") throw Error(t2);
  return e4.data;
}
function it(e4) {
  let t2 = new URLSearchParams();
  return Object.entries(e4).forEach(([e5, n2]) => {
    n2 != null && (Array.isArray(n2) ? n2.forEach((n3) => t2.append(e5, String(n3))) : t2.append(e5, String(n2)));
  }), t2.toString();
}
function at(e4) {
  return e4 === "script" || e4 === "scripts" ? "script" : e4 === "skill" || e4 === "skills" ? "skill" : "prompt";
}
function ot(e4, t2) {
  return { id: e4.id, slug: e4.slug, title: X(e4.name, t2) || e4.slug, description: X(e4.description, t2), kind: at(e4.templateType), iconInfo: Ze(e4.iconInfo), labels: e4.labels.map((e5) => ({ id: e5.id, label: X(e5.name, t2) || e5.slug })), isHot: e4.isHot, approxPoints: typeof e4.approxPoints == "number" && Number.isFinite(e4.approxPoints) ? e4.approxPoints : void 0, version: typeof e4.metadata.version == "string" ? e4.metadata.version : void 0, official: !0 };
}
var st = "agent-console:home-official-templates:v1";
var ct = 1;
function lt(e4) {
  return typeof e4 == "object" && !!e4 && !Array.isArray(e4);
}
function ut(e4) {
  return typeof e4 == "number" && Number.isFinite(e4);
}
function dt(e4) {
  return typeof e4 == "string" || e4 === null;
}
function ft(e4) {
  return lt(e4) && ut(e4.id) && typeof e4.slug == "string" && "name" in e4 && ut(e4.sortOrder) && ut(e4.enabled);
}
function pt(e4) {
  return lt(e4) && ut(e4.id) && ut(e4.categoryId) && ft(e4.category) && typeof e4.slug == "string" && "name" in e4 && (typeof e4.color == "string" || e4.color === null) && ut(e4.sortOrder) && ut(e4.enabled);
}
function mt(e4) {
  return lt(e4) && ut(e4.id) && typeof e4.slug == "string" && typeof e4.templateType == "string" && "name" in e4 && "description" in e4 && (e4.iconInfo === null || lt(e4.iconInfo)) && ut(e4.sortOrder) && typeof e4.isHot == "boolean" && lt(e4.metadata) && Array.isArray(e4.labels) && e4.labels.every(pt) && Array.isArray(e4.labelIds) && e4.labelIds.every(ut) && dt(e4.createdAt) && dt(e4.updatedAt);
}
function ht(e4) {
  return lt(e4) && e4.version === ct && ut(e4.updatedAt) && e4.updatedAt >= 0 && Array.isArray(e4.templates) && e4.templates.every(mt);
}
function gt(e4) {
  if (e4 !== void 0) return e4 ?? void 0;
  if (typeof window < "u") try {
    return window.localStorage;
  } catch {
    return;
  }
}
function _t(e4) {
  let t2 = gt(e4);
  if (t2) try {
    let e5 = t2.getItem(st);
    if (!e5) return;
    let n2 = JSON.parse(e5);
    return ht(n2) ? { templates: n2.templates, updatedAt: n2.updatedAt } : void 0;
  } catch {
    return;
  }
}
function vt(e4, t2, n2 = Date.now()) {
  let r2 = gt(t2);
  if (!r2) return;
  let i2 = { version: ct, templates: e4.slice(0, 8), updatedAt: n2 };
  try {
    r2.setItem(st, JSON.stringify(i2));
  } catch {
  }
}
var yt = /* @__PURE__ */ new Map();
var bt = b(0);
function xt(e4) {
  let t2 = e4.trim().replace(/^@+/, "");
  return t2 ? `@${t2}` : "";
}
function St(e4) {
  let t2 = !1;
  e4.forEach(({ id: e5, label: n2 }) => {
    let r2 = xt(n2);
    e5 && r2 && yt.get(e5) !== r2 && (yt.set(e5, r2), t2 = !0);
  }), t2 && (bt.value += 1);
}
function Ct(e4) {
  return e4.map((e5) => yt.get(e5) || "");
}
function wt(e4) {
  return e4.filter((e5) => {
    let t2 = yt.get(e5);
    return !t2 || t2 === xt(e5);
  });
}
function Tt(e4) {
  let t2 = e4.profileLabels;
  if (!t2) return [];
  try {
    let e5 = JSON.parse(t2);
    return Array.isArray(e5) ? e5.filter((e6) => typeof e6 == "string").map(xt) : [];
  } catch {
    return [];
  }
}
function Et(e4, t2 = e4.length, n2 = []) {
  let r2 = Array.from({ length: Math.min(t2, Math.max(e4.length, n2.length)) }, (t3, r3) => e4[r3] || n2[r3] || "").map(xt).filter(Boolean).slice(0, 3).join(" \xB7 ");
  return !r2 || t2 <= 3 ? r2 : `${r2} ${$t("\u7B49 {count} \u4E2A", { count: t2 })}`;
}
function Dt(e4) {
  return o(e4);
}
async function Ot(e4, t2) {
  let n2 = wt(Dt(e4));
  if (!n2.length) return;
  St(await t2(n2));
  let r2 = wt(n2);
  if (r2.length) throw Error(`Failed to resolve Agent profile labels: ${r2.join(",")}`);
}
var kt = class {
  winMap = x(/* @__PURE__ */ new Map());
  constructor() {
    setInterval(() => {
      let e4 = !1;
      this.winMap.value.forEach((t2, n2) => {
        t2.closed && (this.winMap.value.delete(n2), e4 = !0);
      }), e4 && m(this.winMap);
    }, 1e3);
  }
  open(e4, t2) {
    let n2 = window.open(e4, t2);
    return n2 ? (this.winMap.value.set(t2, n2), m(this.winMap), n2) : null;
  }
  focusOrOpen(e4, t2) {
    let n2 = this.winMap.value.get(t2);
    if (n2 && !n2.closed && At(n2, e4)) return n2.focus(), n2;
    let r2 = window.open(e4, "_blank");
    return r2 ? (this.winMap.value.set(t2, r2), m(this.winMap), r2) : null;
  }
  broadcast(e4) {
    for (let t2 of this.winMap.value.values()) t2.postMessage(e4, "*");
  }
  closeAll() {
    for (let e4 of this.winMap.value.values()) e4.close();
    this.winMap.value.clear(), m(this.winMap);
  }
};
function At(e4, t2) {
  try {
    let n2 = new URL(e4.location.href), r2 = new URL(t2, window.location.href);
    return n2.origin === r2.origin && n2.pathname === r2.pathname;
  } catch {
    return !1;
  }
}
var jt = new kt();
async function Mt() {
  if (!globalThis.isElectron) return new Set([...jt.winMap.value.entries()].filter(([, e4]) => e4 && !e4.closed).map(([e4]) => String(e4)));
  try {
    let e4 = await globalThis.electronAPI.send("browser:getOpenedBrowser");
    return new Set(e4.map((e5) => e5.dirId).filter((e5) => !!e5));
  } catch (e4) {
    return console.warn("[agent-console] Failed to read opened browser state", e4), /* @__PURE__ */ new Set();
  }
}
function Nt(e4, t2) {
  return { ...e4, openStatus: !!(e4.openStatus || e4.dirId && t2.has(e4.dirId)) };
}
function Pt(e4) {
  let t2 = (e4.lastCountry || e4.country || "").trim();
  return t2 ? `country-code/${t2.toUpperCase()}` : "";
}
function Ft(e4) {
  return { iconName: Pt(e4), isOpen: !!e4.openStatus, name: e4.windowName ?? "", remark: e4.windowRemark ?? "" };
}
var It = 50;
var Lt = 4;
function Rt(e4, t2) {
  if (e4.windowSortNum == null) return "";
  let n2 = G(e4.workspaceName || t2);
  return n2 ? `${n2}-${e4.windowSortNum}` : `${e4.windowSortNum}`;
}
function zt(e4, t2, n2 = /* @__PURE__ */ new Set()) {
  return e4.flatMap((e5) => e5.dirId ? [{ id: e5.dirId, code: Rt(e5, t2), windowSortNum: e5.windowSortNum, workspaceName: e5.workspaceName || t2, projectId: e5.projectId?.toString(), projectName: e5.projectName, ...Ft(Nt(e5, n2)) }] : []);
}
function Bt(e4, t2) {
  return e4.map((e5) => ({ ...e5, code: e5.windowSortNum === void 0 ? e5.code : Rt(e5, e5.workspaceName || t2) }));
}
async function Z(e4) {
  let t2 = await i.window.userGetWindowInfoListList({ page_index: 1, page_size: e4.length, dirIds: e4.join(","), isDelete: 0, orderName: "createTime", orderType: "desc" });
  if (t2.code !== 0) throw Error(t2.msg || "Failed to load task windows");
  let n2 = new Set(e4);
  return (t2.data?.rows ?? []).filter((e5) => e5.dirId && n2.has(e5.dirId));
}
async function Vt(e4, t2) {
  let n2 = Mt(), r2 = Array.from(new Set(e4.filter(Boolean)));
  if (r2.length === 0) return [];
  let i2 = [];
  for (let e5 = 0; e5 < r2.length; e5 += It) i2.push(r2.slice(e5, e5 + It));
  let a2 = [];
  for (let e5 = 0; e5 < i2.length; e5 += Lt) {
    let t3 = await Promise.all(i2.slice(e5, e5 + Lt).map((e6) => Z(e6)));
    a2.push(...t3.flat());
  }
  return zt(a2, t2, await n2);
}
async function Ht(e4, t2) {
  let n2 = e4.pageSize ?? 10, r2 = e4.keyword?.trim() ?? "", [a2, o2] = await Promise.all([i.window.userGetWindowInfoListList({ page_index: e4.pageIndex, page_size: n2, isDelete: 0, orderName: "createTime", orderType: "desc", ...e4.projectId ? { projectIds: e4.projectId } : {}, ...r2 ? { queryKey: "name_remark", queryValue: r2 } : {} }), Mt()]);
  if (a2.code !== 0) throw Error(a2.msg || "Failed to load task windows");
  let s2 = a2.data?.rows ?? [], c2 = a2.data?.total ?? s2.length;
  return { items: zt(s2, t2, o2), total: c2, hasMore: e4.pageIndex * n2 < c2 };
}
var Ut = "agent-console-access-mode";
var Wt = "chatStream";
var Gt;
function Kt(e4) {
  return e4 === "full" ? "full" : "ask";
}
function qt() {
  if (typeof localStorage > "u") return "full";
  let e4 = localStorage.getItem(Ut);
  if (e4) return Kt(e4.replace(/^"|"$/g, ""));
  let t2 = localStorage.getItem(Wt);
  if (!t2) return "full";
  try {
    return JSON.parse(t2).fullAccess === !0 ? "full" : "ask";
  } catch {
    return "full";
  }
}
function Jt() {
  Gt ||= ce(Ut, qt(), { listenToStorageChanges: !0 });
  let e4 = T({ get: () => Kt(Gt.value), set: (e5) => {
    Gt.value = Kt(e5);
  } });
  return { accessMode: e4, fullAccess: T({ get: () => e4.value === "full", set: (t2) => {
    e4.value = t2 ? "full" : "ask";
  } }) };
}
function Yt(e4) {
  return typeof e4 == "object" && !!e4 && !Array.isArray(e4);
}
function Xt(e4) {
  return e4 === "script" || e4 === "skill" || e4 === "prompt" ? e4 : void 0;
}
function Zt(e4) {
  if (typeof e4 == "string") return e4.trim() || void 0;
}
function Qt(e4) {
  return Zt(e4)?.toLowerCase().startsWith("official-") ?? !1;
}
function en(e4, t2) {
  if (!Yt(e4) || e4.code !== 0 || !Yt(e4.data)) throw Error(Yt(e4) && typeof e4.message == "string" ? e4.message : t2);
  let { items: n2, total: r2, limit: i2, offset: a2 } = e4.data;
  if (!Array.isArray(n2) || typeof r2 != "number" || typeof i2 != "number" || typeof a2 != "number") throw Error(t2);
  return e4.data;
}
function tn(e4, t2) {
  if (!Yt(e4) || e4.code !== 0 || !Yt(e4.data)) throw Error(Yt(e4) && typeof e4.message == "string" ? e4.message : t2);
  return e4.data;
}
function nn(e4, t2) {
  if (!Yt(e4) || e4.code !== 0) throw Error(Yt(e4) && typeof e4.message == "string" ? e4.message : t2);
}
function rn(e4, t2) {
  if (!Yt(e4) || e4.code !== 0 || !Yt(e4.data)) throw Error(Yt(e4) && typeof e4.message == "string" ? e4.message : t2);
  let n2 = e4.data;
  if (typeof n2.fileId != "string" || typeof n2.ossUrl != "string" || typeof n2.sha512 != "string" || typeof n2.filename != "string") throw TypeError(t2);
  return n2;
}
function an(e4) {
  let t2 = /* @__PURE__ */ new Map();
  return e4.forEach((e5) => {
    typeof e5.officialTemplateId == "number" && !t2.has(e5.officialTemplateId) && t2.set(e5.officialTemplateId, e5);
  }), t2;
}
function on(e4) {
  return e4.officialTemplateId === void 0 ? { template_type: e4.templateType, name: e4.name, description: e4.description || null, metadata: e4.metadata } : { official_template_id: e4.officialTemplateId, name: e4.name, description: e4.description || null, metadata: e4.metadata };
}
function sn(e4) {
  return { name: e4.name, description: e4.description || null, metadata: e4.metadata };
}
function cn(e4) {
  if (!e4) return -1 / 0;
  let t2 = Date.parse(e4);
  return Number.isFinite(t2) ? t2 : -1 / 0;
}
function ln(e4) {
  return e4.map((e5, t2) => ({ item: e5, index: t2 })).sort((e5, t2) => {
    let n2 = Number(t2.item.isTopped) - Number(e5.item.isTopped);
    if (n2) return n2;
    if (e5.item.isTopped && t2.item.isTopped) {
      let n3 = cn(t2.item.toppedAt) - cn(e5.item.toppedAt);
      if (n3) return n3;
    }
    return e5.index - t2.index;
  }).map((e5) => e5.item);
}
function un(e4) {
  let t2 = Xt(e4.templateType);
  if (!t2) return;
  let n2 = Yt(e4.metadata) ? e4.metadata : {};
  return { id: e4.id, workspaceId: e4.workspaceId, kind: t2, name: e4.name, description: e4.description?.trim() ?? "", source: e4.source, officialTemplateId: e4.officialTemplateId, iconInfo: Ze(n2.iconInfo), metadata: n2, isTopped: !!e4.isTopped, toppedAt: e4.toppedAt ?? null, approxPoints: typeof e4.approxPoints == "number" && Number.isFinite(e4.approxPoints) ? e4.approxPoints : typeof n2.approxPoints == "number" && Number.isFinite(n2.approxPoints) ? n2.approxPoints : void 0 };
}
var dn = "agent-console:unread-template-keys";
var fn = "agent-console:unread-template-drawer-keys";
function pn(e4) {
  if (e4 !== void 0) return e4 ?? void 0;
  if (typeof window < "u") try {
    return window.localStorage;
  } catch {
    return;
  }
}
function mn(e4) {
  let t2 = typeof e4.workspaceId == "string" ? e4.workspaceId.trim() : "";
  if (!(!t2 || !Number.isSafeInteger(e4.id) || e4.id <= 0)) return `${t2}:${e4.id}`;
}
function hn(e4, t2) {
  let n2 = pn(t2);
  if (!n2) return /* @__PURE__ */ new Set();
  try {
    let t3 = JSON.parse(n2.getItem(e4) ?? "[]");
    return Array.isArray(t3) ? new Set(t3.filter((e5) => typeof e5 == "string" && !!e5)) : /* @__PURE__ */ new Set();
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function gn(e4) {
  return hn(dn, e4);
}
function _n(e4) {
  return hn(fn, e4);
}
function vn(e4, t2, n2) {
  let r2 = pn(n2);
  if (r2) try {
    r2.setItem(e4, JSON.stringify([...t2].slice(-500)));
  } catch {
  }
}
function yn(e4, t2, n2) {
  let r2 = hn(e4, n2), i2 = mn(t2);
  return i2 && (r2.add(i2), vn(e4, r2, n2)), r2;
}
function bn(e4, t2, n2) {
  let r2 = hn(e4, n2), i2 = mn(t2);
  return i2 && r2.delete(i2) && vn(e4, r2, n2), r2;
}
function xn(e4, t2) {
  let n2 = yn(dn, e4, t2);
  return yn(fn, e4, t2), n2;
}
function Sn(e4, t2) {
  let n2 = bn(dn, e4, t2);
  return bn(fn, e4, t2), n2;
}
function Cn(e4, t2) {
  return bn(fn, e4, t2);
}
function wn(e4, t2) {
  let n2 = mn(t2);
  return !!(n2 && e4.has(n2));
}
function Tn() {
  return /\[(@profile|@script):([^\]]*)\]\(([^)]*)\)|\[(input|textarea|url|project):([^\]]+)\](?:\(([^)]*)\))?|\[\$([^\]]+)\]\(([^)]*)\)/g;
}
var En = /\[((?:\\.|[^\]\\\n])*)\]\(((?:\\.|[^)\\\n])*)\)/g;
var Dn = /* @__PURE__ */ new Set(["\u4ECA\u5929\u65E5\u671F", "today's date", "\u0441\u0435\u0433\u043E\u0434\u043D\u044F\u0448\u043D\u044F\u044F \u0434\u0430\u0442\u0430"]);
function On(e4, t2 = /* @__PURE__ */ new Date()) {
  return Dn.has(e4.trim().toLowerCase()) ? `${t2.getFullYear()}-${String(t2.getMonth() + 1).padStart(2, "0")}-${String(t2.getDate()).padStart(2, "0")}` : e4;
}
function An(e4) {
  return typeof e4 == "string" && /^[a-z0-9][a-z0-9._-]{0,80}$/i.test(e4.trim());
}
function jn(e4) {
  let n2 = e4[1] === "@profile" ? "profile" : e4[1] === "@script" ? "script" : e4[4] === "input" || e4[4] === "textarea" || e4[4] === "url" || e4[4] === "project" ? e4[4] : "skill", r2 = e4[2] || e4[5] || e4[7] || "", i2 = e4[3] ?? e4[6] ?? e4[8] ?? "", a2 = { index: e4.index ?? 0, kind: n2, raw: e4[0], target: i2, title: r2 };
  if (n2 === "script") try {
    a2.templateRef = t(i2).value;
  } catch {
  }
  else n2 === "skill" && An(i2) && (a2.skillPath = i2.trim());
  return a2;
}
function Mn(e4) {
  return Array.from(e4.matchAll(Tn()), jn);
}
function Nn(e4) {
  return Mn(e4).some((e5) => e5.kind === "profile" || e5.kind === "input" || e5.kind === "textarea" || e5.kind === "url" || e5.kind === "project" || !!e5.templateRef || !!e5.skillPath);
}
function Pn(e4) {
  let t2 = Mn(e4);
  if (!t2.some((e5) => e5.kind === "skill" && e5.skillPath)) return [];
  let n2 = [];
  for (let e5 of t2) e5.kind !== "input" && e5.kind !== "textarea" && e5.kind !== "url" && e5.kind !== "project" || e5.target.trim() || n2.push(e5.title);
  return Array.from(new Set(n2));
}
function Fn(e4) {
  return Array.from(new Set(Mn(e4).filter((e5) => e5.kind === "script" && !e5.templateRef).map((e5) => e5.title || e5.target)));
}
function In(e4, t2) {
  let n2 = t2.trim().toLowerCase();
  return n2 ? e4.filter((e5) => [e5.title, e5.label, e5.description, e5.kind, e5.id, e5.group, e5.template?.prompt, e5.payload.dirIds, e5.payload.dirId, e5.payload.skillPath, e5.payload.skillSlug, e5.payload.templateRef].some((e6) => e6?.toLowerCase().includes(n2))) : e4;
}
function Ln(t2) {
  if (t2.kind === "input" || t2.kind === "textarea" || t2.kind === "url" || t2.kind === "project") return Bn(t2);
  if (t2.kind === "profile") return Un(Wn(t2));
  if (t2.kind === "script") {
    let n3 = Rn(t2);
    return n3 ? e(t2.title, n3) : "";
  }
  if (t2.kind === "template") return Vn(t2);
  let n2 = zn(t2);
  return n2 ? f(t2.title, n2) : "";
}
function Rn(e4) {
  let n2 = e4.payload.templateRef;
  if (n2) try {
    return t(n2).value;
  } catch {
    return;
  }
}
function zn(e4) {
  let t2 = e4.payload.skillPath?.trim();
  return t2 && An(t2) ? t2 : void 0;
}
function Bn(e4) {
  let t2 = e4.payload.value?.trim();
  return e4.kind === "url" ? `[url:${e4.title || e4.id}](${$n(t2)})` : e4.kind === "textarea" ? `[textarea:${e4.title || e4.id}](${t2 ?? ""})` : e4.kind === "project" ? `[project:${e4.title || e4.id}](${t2 ?? ""})` : `[input:${e4.title || e4.id}](${t2 ?? ""})`;
}
function Vn(e4, t2 = {}) {
  return [e4.template?.tokens.map(Ln).join(" ") ?? "", t2.includeAuxiliaryPrompt === !1 ? "" : e4.template?.prompt.trim() ?? ""].filter(Boolean).join(" ").trim();
}
function Hn(e4) {
  return Vn(e4);
}
function Un(e4) {
  return p(e4);
}
function Wn(e4) {
  return fr(e4.payload.dirIds || e4.payload.dirId || e4.id);
}
function Gn(e4) {
  let t2 = e4.flatMap(Wn), n2 = `Window \xD7 ${t2.length}`, r2 = e4.flatMap((e5) => {
    let t3 = Wn(e5), n3 = qn(e5);
    return t3.map((t4, r3) => n3[r3] || Jn(e5) || t4);
  });
  return St(t2.map((e5, t3) => ({ id: e5, label: r2[t3] || e5 }))), { id: t2.join(","), kind: "profile", title: n2, label: n2, description: "", iconName: "roxy-agent/rx-ic-token-profile", group: "Windows", payload: { dirIds: t2.join(","), count: String(t2.length), profileLabels: JSON.stringify(r2) } };
}
function Kn(e4, t2) {
  return e4.length || t2 ? Gn(e4) : void 0;
}
function qn(e4) {
  if (!e4.payload.profileLabels) return [];
  try {
    let t2 = JSON.parse(e4.payload.profileLabels);
    return Array.isArray(t2) ? t2.filter((e5) => typeof e5 == "string") : [];
  } catch {
    return [];
  }
}
function Jn(e4) {
  return xt(e4.payload.displayLabel || e4.label || e4.title);
}
function Yn(e4) {
  let { kind: n2, title: r2, target: i2, profiles: a2, slashItems: o2 } = e4;
  if (n2 === "input" || n2 === "textarea" || n2 === "url" || n2 === "project") return Zn(r2, i2, n2);
  if (n2 === "profile") {
    let e5 = a2.find((e6) => e6.id === i2 || e6.payload.dirId === i2), t2 = Ct([i2])[0];
    return e5 ?? { id: i2, kind: "profile", title: t2 || i2, label: t2 || i2, description: "", iconName: "country-code/US", group: "Windows", payload: { dirId: i2 } };
  }
  if (n2 === "script" || n2 === "skill") {
    if (n2 === "skill") {
      let e5 = An(i2) ? i2.trim() : "";
      return e5 ? o2.find((t2) => t2.kind === "skill" && t2.payload.skillPath === e5) || Xn({ kind: n2, title: r2, skillPath: e5 }) : void 0;
    }
    try {
      let e5 = t(i2).value;
      return o2.find((t2) => t2.kind === "script" && t2.payload.templateRef === e5) || Xn({ kind: n2, title: r2, templateRef: e5 });
    } catch {
      return;
    }
  }
}
function Xn(e4) {
  let { kind: t2, title: n2 } = e4;
  return { id: t2 === "skill" ? e4.skillPath ?? "" : e4.templateRef ?? "", kind: t2, title: n2, label: n2, description: "", iconName: t2 === "skill" ? "roxy-agent/rx-ic-skills" : "roxy-agent/rx-ic-scripts", group: t2 === "skill" ? "Skills" : "Scripts", payload: t2 === "skill" ? { skillPath: e4.skillPath ?? "" } : { templateRef: e4.templateRef ?? "" } };
}
function Zn(e4, t2 = "", n2 = "input") {
  let r2 = n2 === "url" ? $n(t2) : t2;
  return { id: `${n2}:${e4}`, kind: n2, title: e4, label: e4, description: "", iconName: n2 === "url" ? "roxy-agent/rx-ic-url" : "roxy-agent/rx-ic-prompts", group: "Inputs", payload: { name: e4, value: r2 } };
}
function Qn(e4) {
  let t2 = e4?.trim() ?? "", n2 = /^(https?):\/\//i.exec(t2);
  return n2 ? { protocol: n2[1].toLowerCase() === "http" ? "http://" : "https://", value: t2.slice(n2[0].length) } : { protocol: "https://", value: t2.replace(/^\/\//, "") };
}
function $n(e4) {
  let t2 = Qn(e4);
  return t2.value ? `${t2.protocol}${t2.value}` : "";
}
function er(e4, t2, n2, r2 = "input") {
  if (!e4) return e4;
  let i2 = t2.trim();
  function a2(e5) {
    return !e5 || typeof e5 != "object" ? e5 : e5.type === "agentToken" && e5.attrs?.kind === r2 && pr(e5.attrs) === i2 ? { ...e5, attrs: { ...e5.attrs, title: i2, label: e5.attrs?.label || i2, payload: { ...e5.attrs?.payload || {}, name: i2, value: r2 === "url" ? $n(n2) : n2 } } } : Array.isArray(e5.content) ? { ...e5, content: e5.content.map(a2) } : e5;
  }
  return a2(e4);
}
function tr(e4) {
  return { type: "agentToken", attrs: e4 };
}
function nr(e4, t2) {
  let n2 = rr(e4).map((e5) => ({ type: "paragraph", content: ur(e5, t2) }));
  return { type: "doc", content: n2.length ? n2 : [{ type: "paragraph" }] };
}
function rr(e4) {
  let t2 = Mn(e4), n2 = [], r2 = 0, i2 = 0;
  for (let a2 = 0; a2 < e4.length; a2++) {
    for (; t2[i2] && t2[i2].index + t2[i2].raw.length <= a2; ) i2++;
    let o2 = t2[i2], s2 = !!(o2 && a2 >= o2.index && a2 < o2.index + o2.raw.length);
    e4[a2] === `
` && !s2 && (n2.push(e4.slice(r2, a2)), r2 = a2 + 1);
  }
  return n2.push(e4.slice(r2)), n2;
}
function ir(e4) {
  let t2 = [];
  function n2(e5) {
    return e5 ? e5.type === "text" ? e5.text || "" : e5.type === "mention" ? Ln({ id: e5.attrs.id, kind: "profile", title: e5.attrs.label || e5.attrs.id, label: e5.attrs.label || e5.attrs.id, description: e5.attrs.description || "", iconName: e5.attrs.iconName || "base/rx_ic_at", group: "Windows", payload: { dirId: e5.attrs.id } }) : e5.type === "agentToken" ? Ln(e5.attrs) : e5.type === "paragraph" ? (t2.push(ar(e5.content || [])), "") : (e5.content || []).map(n2).join("") : "";
  }
  return n2(e4), t2.join(`
`).trim();
}
function ar(e4) {
  let t2 = [], n2 = [], r2 = "";
  function i2() {
    n2.length && (t2.push(Un(n2)), n2 = []);
  }
  for (let a2 = 0; a2 < e4.length; a2 += 1) {
    let o2 = e4[a2];
    if (o2.type === "mention") {
      n2.push(o2.attrs.id), r2 = "";
      continue;
    }
    if (o2.type === "text" && n2.length && /^\s+$/.test(o2.text || "")) {
      r2 = o2.text || "";
      continue;
    }
    i2(), r2 &&= (t2.push(r2), "");
    let s2 = or(o2);
    if (s2) {
      let n3 = [o2];
      for (; or(e4[a2 + 1]) === s2; ) a2 += 1, n3.push(e4[a2]);
      let r3 = lr(e4[a2 + 1]), i3 = !(!r3 || /^\s/u.test(r3));
      t2.push(cr(n3.map(lr).join(""), s2, i3, sr(o2)));
    } else t2.push(lr(o2));
  }
  return i2(), r2 && t2.push(r2), t2.join("");
}
function or(e4) {
  if (e4?.type !== "text" || !Array.isArray(e4.marks)) return "";
  let t2 = e4.marks.find((e5) => e5?.type === "link");
  return typeof t2?.attrs?.href == "string" ? t2.attrs.href.trim() : "";
}
function sr(e4) {
  if (e4?.type !== "text" || !Array.isArray(e4.marks)) return "";
  let t2 = e4.marks.find((e5) => e5?.type === "link");
  return typeof t2?.attrs?.markdownSource == "string" ? t2.attrs.markdownSource : "";
}
function cr(e4, t2, n2 = !1, r2 = "") {
  return r2 && e4 === t2 ? r2 : !e4 || e4 === t2 && !n2 ? t2 : `[${e4.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]")}](${t2.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)")})`;
}
function lr(e4) {
  return e4 ? e4.type === "text" ? e4.text || "" : e4.type === "hardBreak" ? `
` : e4.type === "agentToken" ? Ln(e4.attrs) : e4.type === "mention" ? Ln({ id: e4.attrs.id, kind: "profile", title: e4.attrs.label || e4.attrs.id, label: e4.attrs.label || e4.attrs.id, description: e4.attrs.description || "", iconName: e4.attrs.iconName || "base/rx_ic_at", group: "Windows", payload: { dirId: e4.attrs.id } }) : (e4.content || []).map(lr).join("") : "";
}
function ur(e4, t2) {
  let n2 = [], r2 = Tn(), i2 = 0;
  for (; i2 < e4.length; ) {
    r2.lastIndex = i2, En.lastIndex = i2;
    let a2 = r2.exec(e4), o2 = En.exec(e4), s2 = a2 && (!o2 || a2.index <= o2.index), c2 = s2 ? a2 : o2;
    if (!c2) break;
    let l2 = c2.index;
    if (l2 > i2 && n2.push({ type: "text", text: e4.slice(i2, l2) }), s2) {
      let e5 = jn(a2), r3 = e5.kind === "profile" ? fr(e5.target) : [e5.target];
      if (e5.kind === "input" || e5.kind === "textarea" || e5.kind === "url" || e5.kind === "project") {
        let t3 = e5.kind === "input" ? On(e5.target) : e5.target;
        n2.push(tr(Zn(e5.title, t3, e5.kind)));
      } else if (e5.kind === "profile") {
        let i3 = r3.map((n3) => Yn({ kind: e5.kind, title: e5.title, target: n3, profiles: t2.profiles, slashItems: t2.slashItems })).filter((e6) => !!e6);
        n2.push(tr(Gn(i3)));
      } else {
        let r4 = e5.kind === "skill" ? e5.skillPath : e5.templateRef, i3 = r4 ? Yn({ kind: e5.kind, title: e5.title, target: r4, profiles: t2.profiles, slashItems: t2.slashItems }) : void 0;
        i3 ? n2.push(tr(i3)) : n2.push({ type: "text", text: e5.raw });
      }
      i2 = e5.index + e5.raw.length;
      continue;
    }
    if (!o2) break;
    let u2 = dr(o2[1]), d2 = dr(o2[2]);
    u2 && d2 ? n2.push({ type: "text", text: u2, marks: [{ type: "link", attrs: { href: d2, markdownSource: o2[0] } }] }) : n2.push({ type: "text", text: o2[0] }), i2 = o2.index + o2[0].length;
  }
  return i2 < e4.length && n2.push({ type: "text", text: e4.slice(i2) }), n2;
}
function dr(e4) {
  return e4.replace(/\\(.)/g, (e5, t2) => "\\[]()".includes(t2) ? t2 : e5);
}
function fr(e4) {
  return e4.split(",").map((e5) => e5.trim()).filter(Boolean);
}
function pr(e4) {
  let t2 = typeof e4?.title == "string" ? e4.title.trim() : "", n2 = typeof e4?.label == "string" ? e4.label.trim() : "", r2 = typeof e4?.payload?.name == "string" ? e4.payload.name.trim() : "";
  return t2 || n2 || r2;
}
var mr = { class: "overflow-tooltip" };
var hr = K(h({ __name: "OverflowTooltip", props: { contentClass: {}, content: {}, fallback: { default: "-" }, overflowTargetSelector: {}, placement: { default: "top-start" }, zIndex: { default: 70 } }, setup(e4) {
  let t2 = e4, n2 = C("textRef"), r2 = b(!1), i2 = T(() => ["overflow-tooltip-content", t2.contentClass].filter(Boolean).join(" ")), a2;
  function o2() {
    let e5 = n2.value, i3 = t2.overflowTargetSelector ? e5?.querySelector(t2.overflowTargetSelector) : e5;
    r2.value = !!(i3 && i3.scrollWidth > i3.clientWidth + 1);
  }
  return z(() => t2.content, () => _(o2), { flush: "post" }), te(() => {
    a2 = new ResizeObserver(o2), n2.value && a2.observe(n2.value), o2();
  }), ee(() => a2?.disconnect()), (t3, a3) => (S(), O("span", mr, [B(De, { content: e4.content, "content-class": j(i2), disabled: !j(r2) || !e4.content, "z-index": e4.zIndex }, { default: N(() => [D("span", { ref_key: "textRef", ref: n2, class: "overflow-tooltip__text" }, [v(t3.$slots, "default", {}, () => [w(A(e4.content || e4.fallback), 1)], !0)], 512)]), _: 3 }, 8, ["content", "content-class", "disabled", "z-index"])]));
} }), [["__scopeId", "data-v-4d0d1f58"]]);
var gr = ["role", "tabindex"];
var _r = ["src", "alt"];
var vr = { key: 2, viewBox: "0 0 16 16", "fill-rule": "evenodd", "aria-hidden": "true" };
var yr = { key: 3, viewBox: "0 0 16 16", "fill-rule": "evenodd", "aria-hidden": "true" };
var br = { key: 4, viewBox: "0 0 1024 1024", "aria-hidden": "true" };
var xr = { key: 0, d: "M854.6 288.7c6 6 9.4 14.1 9.4 22.6V928c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32V96c0-17.7 14.3-32 32-32h424.7c8.5 0 16.7 3.4 22.7 9.4l215.2 215.3zM790.2 326 602 137.8V326h188.2zM575.34 477.84l-61.22 102.3L452.3 477.8a12 12 0 0 0-10.27-5.79h-38.44a12 12 0 0 0-10.15 18.41l82.34 130.42-83.45 132.78a12 12 0 0 0 10.16 18.39h34.46a12 12 0 0 0 10.21-5.7l62.7-101.47 62.3 101.45a12 12 0 0 0 10.23 5.72h37.48a12 12 0 0 0 10.1-18.48l-83.83-130.55 85.3-132.47a12 12 0 0 0-10.1-18.5h-35.7a12 12 0 0 0-10.29 5.84Z" };
var Sr = { key: 1, d: "M854.6 288.7 639.4 73.4c-6-6-14.2-9.4-22.7-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.6-9.4-22.6ZM400 402a40 40 0 1 1 0 80 40 40 0 0 1 0-80Zm296 294H328c-6.7 0-10.4-7.7-6.3-12.9l99.8-127.2a8 8 0 0 1 12.6 0l41.1 52.4 77.8-99.2a8 8 0 0 1 12.6 0l136.5 174c4.3 5.2.5 12.9-6.1 12.9Zm-94-370V137.8L790.2 326H602Z" };
var Cr = { key: 2, d: "M854.6 288.7c6 6 9.4 14.1 9.4 22.6V928c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32V96c0-17.7 14.3-32 32-32h424.7c8.5 0 16.7 3.4 22.7 9.4l215.2 215.3ZM790.2 326 602 137.8V326h188.2ZM426.13 600.93l59.11 132.97a16 16 0 0 0 14.62 9.5h24.06a16 16 0 0 0 14.63-9.51l59.1-133.35V758a16 16 0 0 0 16.01 16H641a16 16 0 0 0 16-16V486a16 16 0 0 0-16-16h-34.75a16 16 0 0 0-14.67 9.62L512.1 662.2l-79.48-182.59A16 16 0 0 0 417.95 470H383a16 16 0 0 0-16 16v272a16 16 0 0 0 16 16h27.13a16 16 0 0 0 16-16V600.93Z" };
var wr = { key: 3, d: "M854.6 288.7c6 6 9.4 14.1 9.4 22.6V928c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32V96c0-17.7 14.3-32 32-32h424.7c8.5 0 16.7 3.4 22.7 9.4l215.2 215.3ZM790.2 326 602 137.8V326h188.2Zm-157 311.26c-15.18-.5-31.32.67-49.65 2.96-24.3-14.99-40.66-35.58-52.28-65.83 6.78-27.94 11.85-52.46 7.78-82.23-3.3-18.59-16.45-29.46-33.02-30.13-15.45-.63-29.65 8-33.28 21.37-5.91 21.62-2.45 50.07 10.08 98.59-15.96 38.05-37.05 82.66-51.2 107.54-43.78 22.57-70.11 45.69-75.24 68.72-3.18 15.2 7.61 34.1 22.21 35.23 24.15 1.87 53.83-23.03 86.6-79.26 39.69-13.33 71.2-23.61 98.46-28.22 27.98 14.98 60.32 24.8 82.1 24.8 17.98 0 30.13-9.32 34.52-23.99 3.85-12.88.8-27.82-7.48-36.08-8.56-8.41-24.3-12.43-45.65-13.12Z" };
var Tr = { key: 4, d: "M854.6 288.7c6 6 9.4 14.1 9.4 22.6V928c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32V96c0-17.7 14.3-32 32-32h424.7c8.5 0 16.7 3.4 22.7 9.4l215.2 215.3ZM790.2 326 602 137.8V326h188.2ZM468.53 760v-91.54h59.27c60.57 0 100.2-39.65 100.2-98.12 0-58.22-39.58-98.34-99.98-98.34H424a12 12 0 0 0-12 12v276a12 12 0 0 0 12 12h32.53a12 12 0 0 0 12-12Zm0-139.33V520.22h52.22c31.75 0 49.87 18.07 49.87 50.12 0 37.4-19.37 50.33-67.19 50.33h-34.9Z" };
var Er = { key: 5, d: "M854.6 288.7c6 6 9.4 14.1 9.4 22.6V928c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32V96c0-17.7 14.3-32 32-32h424.7c8.5 0 16.7 3.4 22.7 9.4l215.2 215.3ZM790.2 326 602 137.8V326h188.2ZM512 566.1l52.81 197a12 12 0 0 0 11.6 8.9h31.77a12 12 0 0 0 11.6-8.88l74.37-276a12 12 0 0 0-11.6-15.12h-35.57a12 12 0 0 0-11.7 9.31l-45.78 199.1-49.76-199.32A12 12 0 0 0 528.1 472h-32.2a12 12 0 0 0-11.64 9.1L434.6 680.01 388.5 481.3a12 12 0 0 0-11.68-9.29h-35.39a12 12 0 0 0-11.58 15.11l74.17 276A12 12 0 0 0 415.6 772h31.99a12 12 0 0 0 11.59-8.9L512 566.1Z" };
var Dr = { key: 6, d: "M854.6 288.7c6 6 9.4 14.1 9.4 22.6V928c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32V96c0-17.7 14.3-32 32-32h424.7c8.5 0 16.7 3.4 22.7 9.4l215.2 215.3ZM790.2 326 602 137.8V326h188.2ZM296 136v64h64v-64h-64Zm64 64v64h64v-64h-64Zm-64 64v64h64v-64h-64Zm64 64v64h64v-64h-64Zm-64 64v64h64v-64h-64Zm64 64v64h64v-64h-64Zm-64 64v64h64v-64h-64Zm0 64v160h128V584H296Zm48 48h32v64h-32v-64Z" };
var Or = { key: 7, d: "M394.68 756.99s-34.325 19.95 24.343 26.6c71.1 8.05 107.351 7 185.632-7.874 0 0 20.665 12.949 49.385 24.149-175.475 75.074-397.184-4.375-259.36-42.875m-21.366-98.173s-38.352 28.35 20.315 34.475c75.83 7.875 135.897 8.4 239.571-11.55 0 0 14.36 14.525 36.952 22.4-212.427 62.123-448.846 5.075-296.838-45.325m180.73-166.422c43.256 49.699-11.384 94.498-11.384 94.498s109.804-56.7 59.368-127.573c-47.11-66.15-83.185-99.049 112.255-212.273.175 0-306.819 76.65-160.24 245.348M786.26 829.439s25.393 20.825-27.846 37.1c-101.397 30.625-421.7 39.9-510.664 1.225-32.048-13.825 28.02-33.25 46.934-37.275 19.613-4.2 30.997-3.5 30.997-3.5-35.551-25.025-229.94 49.175-98.771 70.35 357.605 58.1 652.165-26.075 559.35-67.9M411.142 557.144S248.1 595.818 353.35 609.818c44.482 5.95 133.095 4.55 215.58-2.275 67.423-5.6 135.196-17.85 135.196-17.85s-23.818 10.15-40.98 21.875c-165.493 43.575-485.096 23.275-393.156-21.175 77.93-37.45 141.151-33.25 141.151-33.25M703.6 720.416c168.296-87.324 90.365-171.322 36.077-159.948-13.31 2.8-19.264 5.25-19.264 5.25s4.903-7.7 14.36-11.025c107.351-37.8 190.01 111.299-34.675 170.273 0-.175 2.627-2.45 3.502-4.55M602.028 64s93.166 93.1-88.438 236.246c-145.53 114.8-33.274 180.424 0 255.148-84.936-76.65-147.28-144.024-105.425-206.848C469.634 256.672 639.68 211.873 602.028 64M427.778 957.188C589.244 967.513 837.221 951.413 843 875.113c0 0-11.208 28.875-133.445 51.975-137.824 25.9-307.87 22.925-408.567 6.3 0-.175 20.665 16.975 126.79 23.8" };
var kr = { key: 8, d: "M416 176H255.545v425.615c0 105.313-36.166 134.718-99.104 134.718-29.494 0-56.055-5.05-76.718-12.144L63 848.784C92.484 858.924 137.73 865 173.126 865 317.631 865 416 797.16 416 602.658V176Zm349.49-16C610.26 160 512 248.126 512 364.609c0 100.313 75.67 163.12 185.696 203.629 79.577 28.358 111.03 53.695 111.03 95.218 0 45.579-36.358 74.96-105.13 74.96-63.868 0-121.849-21.311-161.146-42.573v-.042L512 822.427C549.361 843.735 619.12 865 694.741 865 876.52 865 961 767.753 961 653.293c0-97.243-54.036-160.035-170.937-204.627-86.47-34.432-122.813-53.669-122.813-97.227 0-34.45 31.446-65.834 96.3-65.834 63.834 0 107.728 21.445 133.307 34.632L935.193 192.05C895.103 174.461 841.109 160 765.49 160Z" };
var Ar = { key: 9, "fill-rule": "evenodd", transform: "translate(112 112)" };
var jr = { key: 10, d: "M854.6 288.7c6 6 9.4 14.1 9.4 22.6V928c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32V96c0-17.7 14.3-32 32-32h424.7c8.5 0 16.7 3.4 22.7 9.4l215.2 215.3ZM790.2 326 602 137.8V326h188.2ZM320 482a8 8 0 0 0-8 8v48a8 8 0 0 0 8 8h384a8 8 0 0 0 8-8v-48a8 8 0 0 0-8-8H320Zm0 136a8 8 0 0 0-8 8v48a8 8 0 0 0 8 8h184a8 8 0 0 0 8-8v-48a8 8 0 0 0-8-8H320Z" };
var Mr = { class: "agent-file-card__content" };
var Nr = ["title"];
var Pr = { class: "agent-file-card__name-prefix" };
var Fr = { class: "agent-file-card__name-suffix" };
var Ir = { key: 0, class: "agent-file-card__spinner", "aria-hidden": "true" };
var Lr = ["href", "download", "aria-label"];
var Rr = { class: "agent-file-card__mask-info" };
var zr = ["aria-label"];
var Br = K(h({ __name: "AgentFileCard", props: { attachment: {}, previewUrl: { default: "" }, previewable: { type: Boolean, default: !1 }, removable: { type: Boolean, default: !1 }, removeLabel: { default: "" }, downloadUrl: { default: "" }, downloadLabel: { default: "" }, size: { default: "composer" } }, emits: ["preview", "remove"], setup(e4, { emit: t2 }) {
  let n2 = e4, r2 = t2, i2 = /* @__PURE__ */ new Set(["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg", "jfif"]), a2 = /* @__PURE__ */ new Set(["mp3", "wav", "flac", "ape", "aac", "ogg"]), o2 = /* @__PURE__ */ new Set(["mp4", "avi", "mov", "wmv", "flv", "mkv"]), s2 = { audio: "#ff6e31", default: "#8c8c8c", excel: "#22b35e", image: "#8c8c8c", java: "#1677ff", javascript: "#fab714", markdown: "#8c8c8c", pdf: "#ff4d4f", ppt: "#ff6e31", python: "#fab714", video: "#ff4d4f", word: "#1677ff", zip: "#fab714" }, c2 = T(() => n2.attachment.fileName.match(/\.([^.]+)$/)?.[1]?.toLowerCase() ?? ""), l2 = T(() => {
    let e5 = n2.attachment.fileName.match(/^(.*)\.[^.]+$/);
    return e5 ? { prefix: e5[1], suffix: n2.attachment.fileName.slice(e5[1].length) } : { prefix: n2.attachment.fileName, suffix: "" };
  }), u2 = T(() => n2.attachment.kind === "file" && !!n2.previewUrl && (n2.attachment.mimeType.startsWith("image/") || i2.has(c2.value))), d2 = T(() => ["xlsx", "xls"].includes(c2.value) ? "excel" : i2.has(c2.value) ? "image" : ["md", "mdx"].includes(c2.value) ? "markdown" : c2.value === "pdf" ? "pdf" : ["ppt", "pptx"].includes(c2.value) ? "ppt" : ["doc", "docx"].includes(c2.value) ? "word" : ["zip", "rar", "7z", "tar", "gz"].includes(c2.value) ? "zip" : o2.has(c2.value) ? "video" : a2.has(c2.value) ? "audio" : c2.value === "java" ? "java" : c2.value === "js" ? "javascript" : c2.value === "py" ? "python" : "default"), f2 = T(() => s2[d2.value]), p2 = T(() => n2.attachment.kind === "folder" ? "Folder" : c2.value.toUpperCase() || "FILE"), m2 = T(() => n2.attachment.uploadStatus === "uploading"), h2 = T(() => n2.attachment.uploadStatus === "error");
  function g2() {
    n2.previewable && r2("preview");
  }
  function _2(e5) {
    !n2.previewable || e5.key !== "Enter" && e5.key !== " " || (e5.preventDefault(), r2("preview"));
  }
  return (t3, n3) => {
    let i3 = de;
    return S(), O("article", { class: E(["agent-file-card", [`agent-file-card--${e4.size}`, { "agent-file-card--previewable": e4.previewable, "agent-file-card--uploading": j(m2) }]]) }, [D("div", { class: "agent-file-card__file", role: e4.previewable ? "button" : void 0, tabindex: e4.previewable ? 0 : void 0, onClick: g2, onKeydown: _2 }, [D("div", { class: "agent-file-card__icon", style: L({ color: j(f2) }) }, [j(u2) ? (S(), O("img", { key: 0, src: e4.previewUrl, alt: e4.attachment.fileName }, null, 8, _r)) : e4.attachment.kind === "folder" ? (S(), F(i3, { key: 1, name: "roxy-agent/rx-ic-folder", size: "32", color: "#8c8c8c" })) : j(d2) === "audio" ? (S(), O("svg", vr, [...n3[2] ||= [D("path", { d: "M14.1178571,4.0125 C14.225,4.11964286 14.2857143,4.26428571 14.2857143,4.41607143 L14.2857143,15.4285714 C14.2857143,15.7446429 14.0303571,16 13.7142857,16 L2.28571429,16 C1.96964286,16 1.71428571,15.7446429 1.71428571,15.4285714 L1.71428571,0.571428571 C1.71428571,0.255357143 1.96964286,0 2.28571429,0 L9.86964286,0 C10.0214286,0 10.1678571,0.0607142857 10.275,0.167857143 L14.1178571,4.0125 Z M10.7315824,7.11216117 C10.7428131,7.15148751 10.7485063,7.19218979 10.7485063,7.23309113 L10.7485063,8.07742614 C10.7484199,8.27364959 10.6183424,8.44607275 10.4296853,8.50003683 L8.32984514,9.09986306 L8.32984514,11.7071803 C8.32986605,12.5367078 7.67249692,13.217028 6.84345686,13.2454634 L6.79068592,13.2463395 C6.12766108,13.2463395 5.53916361,12.8217001 5.33010655,12.1924966 C5.1210495,11.563293 5.33842118,10.8709227 5.86959669,10.4741173 C6.40077221,10.0773119 7.12636292,10.0652587 7.67042486,10.4442027 L7.67020842,7.74937024 L7.68449368,7.74937024 C7.72405122,7.59919041 7.83988806,7.48101083 7.98924584,7.4384546 L10.1880418,6.81004755 C10.42156,6.74340323 10.6648954,6.87865515 10.7315824,7.11216117 Z M9.60714286,1.31785714 L12.9678571,4.67857143 L9.60714286,4.67857143 L9.60714286,1.31785714 Z" }, null, -1)]])) : j(d2) === "video" ? (S(), O("svg", yr, [...n3[3] ||= [D("path", { d: "M14.1178571,4.0125 C14.225,4.11964286 14.2857143,4.26428571 14.2857143,4.41607143 L14.2857143,15.4285714 C14.2857143,15.7446429 14.0303571,16 13.7142857,16 L2.28571429,16 C1.96964286,16 1.71428571,15.7446429 1.71428571,15.4285714 L1.71428571,0.571428571 C1.71428571,0.255357143 1.96964286,0 2.28571429,0 L9.86964286,0 C10.0214286,0 10.1678571,0.0607142857 10.275,0.167857143 L14.1178571,4.0125 Z M12.9678571,4.67857143 L9.60714286,1.31785714 L9.60714286,4.67857143 L12.9678571,4.67857143 Z M10.5379461,10.3101106 L6.68957555,13.0059749 C6.59910784,13.0693494 6.47439406,13.0473861 6.41101953,12.9569184 C6.3874624,12.9232903 6.37482581,12.8832269 6.37482581,12.8421686 L6.37482581,7.45043999 C6.37482581,7.33998304 6.46436886,7.25043999 6.57482581,7.25043999 C6.61588409,7.25043999 6.65594753,7.26307658 6.68957555,7.28663371 L10.5379461,9.98249803 C10.6284138,10.0458726 10.6503772,10.1705863 10.5870027,10.2610541 C10.5736331,10.2801392 10.5570312,10.2967411 10.5379461,10.3101106 Z" }, null, -1)]])) : (S(), O("svg", br, [j(d2) === "excel" ? (S(), O("path", xr)) : j(d2) === "image" ? (S(), O("path", Sr)) : j(d2) === "markdown" ? (S(), O("path", Cr)) : j(d2) === "pdf" ? (S(), O("path", wr)) : j(d2) === "ppt" ? (S(), O("path", Tr)) : j(d2) === "word" ? (S(), O("path", Er)) : j(d2) === "zip" ? (S(), O("path", Dr)) : j(d2) === "java" ? (S(), O("path", Or)) : j(d2) === "javascript" ? (S(), O("path", kr)) : j(d2) === "python" ? (S(), O("g", Ar, [...n3[4] ||= [D("path", { d: "M443 678.5c0 15.74 12.76 28.5 28.5 28.5s28.5-12.76 28.5-28.5-12.76-28.5-28.5-28.5-28.5 12.76-28.5 28.5M300 121.5c0 15.74 12.76 28.5 28.5 28.5s28.5-12.76 28.5-28.5S344.24 93 328.5 93 300 105.76 300 121.5" }, null, -1), D("path", { d: "M709.524 185.714h-95.238V90.476C614.286 40.571 573.714 0 523.81 0H276.19c-49.904 0-90.476 40.571-90.476 90.476v95.238H90.476C40.571 185.714 0 226.286 0 276.19v247.62c0 49.904 40.571 90.476 90.476 90.476h95.238v95.238c0 49.905 40.572 90.476 90.476 90.476h247.62c49.904 0 90.476-40.571 90.476-90.476v-95.238h95.238c49.905 0 90.476-40.572 90.476-90.476V276.19c0-49.904-40.571-90.476-90.476-90.476M90.476 557.143c-18.38 0-33.333-14.953-33.333-33.333V276.19c0-18.38 14.952-33.333 33.333-33.333h278.572c15.81 0 28.571-12.762 28.571-28.571 0-15.81-12.762-28.572-28.571-28.572h-126.19V90.476c0-18.38 14.952-33.333 33.332-33.333h247.62c18.38 0 33.333 14.952 33.333 33.333v256.476c0 13.524-10.953 24.477-24.476 24.477H267.333c-45.047 0-81.619 36.666-81.619 81.619v104.095zm652.381-33.333c0 18.38-14.952 33.333-33.333 33.333H430.952c-15.81 0-28.571 12.762-28.571 28.571 0 15.81 12.762 28.572 28.571 28.572h126.19v95.238c0 18.38-14.952 33.333-33.332 33.333H276.19c-18.38 0-33.333-14.952-33.333-33.333V453.048c0-13.524 10.953-24.477 24.476-24.477h265.334c45.047 0 81.619-36.666 81.619-81.619V242.857h95.238c18.38 0 33.333 14.953 33.333 33.333z" }, null, -1)]])) : (S(), O("path", jr))]))], 4), D("div", Mr, [D("div", { class: "agent-file-card__name", title: e4.attachment.fileName }, [D("span", Pr, A(j(l2).prefix), 1), D("span", Fr, A(j(l2).suffix), 1)], 8, Nr), D("div", { class: E(["agent-file-card__description", { "agent-file-card__description--error": j(h2) }]) }, A(j(p2)), 3)]), j(m2) ? (S(), O("span", Ir)) : P("", !0), e4.downloadUrl ? (S(), O("a", { key: 1, class: "agent-file-card__mask", href: e4.downloadUrl, download: e4.attachment.fileName, "aria-label": e4.downloadLabel, onClick: n3[0] ||= H(() => {
    }, ["stop"]) }, [D("span", Rr, [n3[5] ||= D("svg", { viewBox: "0 0 1024 1024", "aria-hidden": "true" }, [D("path", { d: "M505.7 661a8 8 0 0 0 12.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8ZM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8Z" })], -1), D("span", null, A(e4.downloadLabel), 1)])], 8, Lr)) : P("", !0)], 40, gr), e4.removable ? (S(), O("button", { key: 0, type: "button", class: "agent-file-card__remove", "aria-label": e4.removeLabel, onClick: n3[1] ||= H((e5) => r2("remove"), ["stop"]) }, [B(i3, { name: "roxy-agent/rx-ic-close2", size: "12", color: "currentColor" })], 8, zr)) : P("", !0)], 2);
  };
} }), [["__scopeId", "data-v-27a023fe"]]);
var Vr = { class: "composer-toolbar" };
var Hr = ["aria-label"];
var Ur = { class: "approval-mode__label" };
var Wr = { class: "approval-popover__header" };
var Gr = { class: "approval-popover__body" };
var Kr = ["onClick"];
var qr = { class: "approval-option__main" };
var Jr = { class: "approval-option__text" };
var Yr = { class: "approval-option__title" };
var Xr = { class: "approval-option__desc" };
var Zr = K(h({ __name: "ComposerToolbar", emits: ["select"], setup(e4, { emit: t2 }) {
  let n2 = t2, { accessMode: r2, fullAccess: i2 } = Jt(), a2 = [{ value: "ask", icon: "roxy-agent/rx-ic-ask", title: $t("\u8BF7\u6C42\u6279\u51C6"), label: $t("\u8BF7\u6C42\u6279\u51C6"), desc: $t("\u6267\u884C\u4E0D\u53EF\u9006\u64CD\u4F5C\u524D\uFF0C\u5747\u9700\u83B7\u5F97\u60A8\u7684\u786E\u8BA4") }, { value: "full", icon: "roxy-agent/rx-ic-allow", title: $t("\u5B8C\u5168\u8BBF\u95EE\u6743\u9650"), label: $t("\u5B8C\u5168\u8BBF\u95EE\u6743\u9650"), desc: $t("\u65E0\u9700\u786E\u8BA4\u76F4\u63A5\u6267\u884C\u6240\u6709\u64CD\u4F5C") }], o2 = T(() => r2.value), s2 = T(() => a2.find((e5) => e5.value === o2.value) ?? a2[0]), c2 = T(() => i2.value ? "approval-mode--full" : "");
  function l2(e5, t3) {
    r2.value = e5, t3();
  }
  function u2(e5) {
    n2("select", e5);
  }
  return (e5, t3) => {
    let n3 = de;
    return S(), O("div", Vr, [B(De, { content: e5.$t("\u70B9\u51FB\u9009\u62E9\u7A97\u53E3\uFF0C\u4E5F\u53EF\u8F93\u5165 \u201C{at}\u201D \u9009\u62E9", { at: "@" }), placement: "top", offset: 8 }, { default: N(() => [D("button", { "data-agent-select-window": "", "data-composer-suggestion-trigger": "", class: "toolbar-action", type: "button", "aria-label": "Select window", onClick: t3[0] ||= (e6) => u2("@") }, [B(n3, { class: "toolbar-action__icon", name: "roxy-agent/rx-ic-at", size: "16", color: "currentColor" }), D("span", null, A(e5.$t("\u9009\u7A97\u53E3")), 1)])]), _: 1 }, 8, ["content"]), B(De, { content: e5.$t("\u70B9\u51FB\u9009\u62E9\u4EFB\u52A1\u6A21\u677F\uFF0C\u4E5F\u53EF\u8F93\u5165 \u201C/\u201D \u9009\u62E9"), placement: "top", offset: 8 }, { default: N(() => [D("button", { "data-agent-select-template": "", "data-composer-suggestion-trigger": "", class: "toolbar-action", type: "button", "aria-label": "Call skills", onClick: t3[1] ||= (e6) => u2("/") }, [B(n3, { class: "toolbar-action__icon", name: "roxy-agent/rx-ic-slash", size: "16", color: "currentColor" }), D("span", null, A(e5.$t("\u9009\u6A21\u677F")), 1)])]), _: 1 }, 8, ["content"]), B(De, { content: e5.$t("\u70B9\u51FB\u4E0A\u4F20\u6587\u4EF6\uFF0C\u4E5F\u53EF\u76F4\u63A5\u62D6\u62FD\u4E0A\u4F20"), placement: "top", offset: 8 }, { default: N(() => [D("button", { class: "toolbar-action", type: "button", "aria-label": "Attach file", onClick: t3[2] ||= (e6) => u2("attach") }, [B(n3, { class: "toolbar-action__icon", name: "roxy-agent/rx-ic-attachment", size: "16", color: "currentColor" }), D("span", null, A(e5.$t("\u4F20\u6587\u4EF6")), 1)])]), _: 1 }, 8, ["content"]), B(De, { trigger: "click", placement: "top-start", offset: 12, "show-arrow": !1, "content-class": "approval-popover" }, { content: N(({ close: t4 }) => [D("div", Wr, A(e5.$t("\u9009\u62E9 Agent \u7684\u64CD\u4F5C\u6743\u9650\uFF1A\u6279\u51C6\u540E\u6267\u884C\uFF0C\u6216\u65E0\u9700\u786E\u8BA4\u76F4\u63A5\u6267\u884C\u3002")), 1), D("div", Gr, [(S(), O(k, null, I(a2, (e6) => D("button", { key: e6.value, type: "button", class: E(["approval-option", { "approval-option--selected": e6.value === j(o2) }]), onClick: (n4) => l2(e6.value, t4) }, [D("div", qr, [B(n3, { name: e6.icon, size: "18", color: "currentColor", class: "approval-option__icon" }, null, 8, ["name"]), D("div", Jr, [D("span", Yr, A(e6.title), 1), D("span", Xr, A(e6.desc), 1)])]), e6.value === j(o2) ? (S(), F(n3, { key: 0, name: "base/rx_ic_check", size: "16", color: "currentColor" })) : P("", !0)], 10, Kr)), 64))])]), default: N(() => [D("button", { class: E(["approval-mode", j(c2)]), type: "button", "aria-label": j(s2).label }, [B(n3, { class: "toolbar-action__icon", name: j(s2).icon, size: "16", color: "currentColor" }, null, 8, ["name"]), D("span", Ur, A(j(s2).label), 1)], 10, Hr)]), _: 1 })]);
  };
} }), [["__scopeId", "data-v-7b6abaac"]]);
function Qr() {
  return { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null };
}
var $r = Qr();
function ei(e4) {
  $r = e4;
}
var ti = { exec: () => null };
function Q(e4, t2 = "") {
  let n2 = typeof e4 == "string" ? e4 : e4.source, r2 = { replace: (e5, t3) => {
    let i2 = typeof t3 == "string" ? t3 : t3.source;
    return i2 = i2.replace(ri.caret, "$1"), n2 = n2.replace(e5, i2), r2;
  }, getRegex: () => new RegExp(n2, t2) };
  return r2;
}
var ni = (() => {
  try {
    return !0;
  } catch {
    return !1;
  }
})();
var ri = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (e4) => RegExp(`^( {0,3}${e4})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (e4) => RegExp(`^ {0,${Math.min(3, e4 - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (e4) => RegExp(`^ {0,${Math.min(3, e4 - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (e4) => RegExp(`^ {0,${Math.min(3, e4 - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (e4) => RegExp(`^ {0,${Math.min(3, e4 - 1)}}#`), htmlBeginRegex: (e4) => RegExp(`^ {0,${Math.min(3, e4 - 1)}}<(?:[a-z].*>|!--)`, "i"), blockquoteBeginRegex: (e4) => RegExp(`^ {0,${Math.min(3, e4 - 1)}}>`) };
var ii = /^(?:[ \t]*(?:\n|$))+/;
var ai = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
var oi = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
var si = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var ci = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var li = / {0,3}(?:[*+-]|\d{1,9}[.)])/;
var ui = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
var di = Q(ui).replace(/bull/g, li).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
var fi = Q(ui).replace(/bull/g, li).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
var pi = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
var mi = /^[^\n]+/;
var hi = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
var gi = Q(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", hi).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
var _i = Q(/^(bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, li).getRegex();
var vi = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var yi = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
var bi = Q("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", yi).replace("tag", vi).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
var xi = Q(pi).replace("hr", si).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vi).getRegex();
var Si = { blockquote: Q(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", xi).getRegex(), code: ai, def: gi, fences: oi, heading: ci, hr: si, html: bi, lheading: di, list: _i, newline: ii, paragraph: xi, table: ti, text: mi };
var Ci = Q("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", si).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vi).getRegex();
var wi = { ...Si, lheading: fi, table: Ci, paragraph: Q(pi).replace("hr", si).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Ci).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vi).getRegex() };
var Ti = { ...Si, html: Q(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", yi).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: ti, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: Q(pi).replace("hr", si).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", di).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() };
var Ei = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var Di = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var Oi = /^( {2,}|\\)\n(?!\s*$)/;
var ki = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var Ai = /[\p{P}\p{S}]/u;
var ji = /[\s\p{P}\p{S}]/u;
var Mi = /[^\s\p{P}\p{S}]/u;
var Ni = Q(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, ji).getRegex();
var Pi = /(?!~)[\p{P}\p{S}]/u;
var Fi = /(?!~)[\s\p{P}\p{S}]/u;
var Ii = /(?:[^\s\p{P}\p{S}]|~)/u;
var Li = Q(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", ni ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex();
var Ri = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/;
var zi = Q(Ri, "u").replace(/punct/g, Ai).getRegex();
var Bi = Q(Ri, "u").replace(/punct/g, Pi).getRegex();
var Vi = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
var Hi = Q(Vi, "gu").replace(/notPunctSpace/g, Mi).replace(/punctSpace/g, ji).replace(/punct/g, Ai).getRegex();
var Ui = Q(Vi, "gu").replace(/notPunctSpace/g, Ii).replace(/punctSpace/g, Fi).replace(/punct/g, Pi).getRegex();
var Wi = Q("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, Mi).replace(/punctSpace/g, ji).replace(/punct/g, Ai).getRegex();
var Gi = Q(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, Ai).getRegex();
var Ki = Q("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, Mi).replace(/punctSpace/g, ji).replace(/punct/g, Ai).getRegex();
var qi = Q(/\\(punct)/, "gu").replace(/punct/g, Ai).getRegex();
var Ji = Q(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
var Yi = Q(yi).replace("(?:-->|$)", "-->").getRegex();
var Xi = Q("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Yi).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
var Zi = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/;
var Qi = Q(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", Zi).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
var $i = Q(/^!?\[(label)\]\[(ref)\]/).replace("label", Zi).replace("ref", hi).getRegex();
var ea = Q(/^!?\[(ref)\](?:\[\])?/).replace("ref", hi).getRegex();
var ta = Q("reflink|nolink(?!\\()", "g").replace("reflink", $i).replace("nolink", ea).getRegex();
var na = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
var ra = { _backpedal: ti, anyPunctuation: qi, autolink: Ji, blockSkip: Li, br: Oi, code: Di, del: ti, delLDelim: ti, delRDelim: ti, emStrongLDelim: zi, emStrongRDelimAst: Hi, emStrongRDelimUnd: Wi, escape: Ei, link: Qi, nolink: ea, punctuation: Ni, reflink: $i, reflinkSearch: ta, tag: Xi, text: ki, url: ti };
var ia = { ...ra, link: Q(/^!?\[(label)\]\((.*?)\)/).replace("label", Zi).getRegex(), reflink: Q(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Zi).getRegex() };
var aa = { ...ra, emStrongRDelimAst: Ui, emStrongLDelim: Bi, delLDelim: Gi, delRDelim: Ki, url: Q(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", na).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: Q(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", na).getRegex() };
var oa = { ...aa, br: Q(Oi).replace("{2,}", "*").getRegex(), text: Q(aa.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() };
var sa = { normal: Si, gfm: wi, pedantic: Ti };
var ca = { normal: ra, gfm: aa, breaks: oa, pedantic: ia };
var la = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
var ua = (e4) => la[e4];
function da(e4, t2) {
  if (t2) {
    if (ri.escapeTest.test(e4)) return e4.replace(ri.escapeReplace, ua);
  } else if (ri.escapeTestNoEncode.test(e4)) return e4.replace(ri.escapeReplaceNoEncode, ua);
  return e4;
}
function fa(e4) {
  try {
    e4 = encodeURI(e4).replace(ri.percentDecode, "%");
  } catch {
    return null;
  }
  return e4;
}
function pa(e4, t2) {
  let n2 = e4.replace(ri.findPipe, (e5, t3, n3) => {
    let r3 = !1, i2 = t3;
    for (; --i2 >= 0 && n3[i2] === "\\"; ) r3 = !r3;
    return r3 ? "|" : " |";
  }).split(ri.splitPipe), r2 = 0;
  if (n2[0].trim() || n2.shift(), n2.length > 0 && !n2.at(-1)?.trim() && n2.pop(), t2)
    if (n2.length > t2) n2.splice(t2);
    else for (; n2.length < t2; ) n2.push("");
  for (; r2 < n2.length; r2++) n2[r2] = n2[r2].trim().replace(ri.slashPipe, "|");
  return n2;
}
function ma(e4, t2, n2) {
  let r2 = e4.length;
  if (r2 === 0) return "";
  let i2 = 0;
  for (; i2 < r2; ) {
    let a2 = e4.charAt(r2 - i2 - 1);
    if (a2 === t2 && !n2) i2++;
    else if (a2 !== t2 && n2) i2++;
    else break;
  }
  return e4.slice(0, r2 - i2);
}
function ha(e4, t2) {
  if (e4.indexOf(t2[1]) === -1) return -1;
  let n2 = 0;
  for (let r2 = 0; r2 < e4.length; r2++) if (e4[r2] === "\\") r2++;
  else if (e4[r2] === t2[0]) n2++;
  else if (e4[r2] === t2[1] && (n2--, n2 < 0)) return r2;
  return n2 > 0 ? -2 : -1;
}
function ga(e4, t2 = 0) {
  let n2 = t2, r2 = "";
  for (let t3 of e4) if (t3 === "	") {
    let e5 = 4 - n2 % 4;
    r2 += " ".repeat(e5), n2 += e5;
  } else r2 += t3, n2++;
  return r2;
}
function _a(e4, t2, n2, r2, i2) {
  let a2 = t2.href, o2 = t2.title || null, s2 = e4[1].replace(i2.other.outputLinkReplace, "$1");
  r2.state.inLink = !0;
  let c2 = { type: e4[0].charAt(0) === "!" ? "image" : "link", raw: n2, href: a2, title: o2, text: s2, tokens: r2.inlineTokens(s2) };
  return r2.state.inLink = !1, c2;
}
function va(e4, t2, n2) {
  let r2 = e4.match(n2.other.indentCodeCompensation);
  if (r2 === null) return t2;
  let i2 = r2[1];
  return t2.split(`
`).map((e5) => {
    let t3 = e5.match(n2.other.beginningSpace);
    if (t3 === null) return e5;
    let [r3] = t3;
    return r3.length >= i2.length ? e5.slice(i2.length) : e5;
  }).join(`
`);
}
var ya = class {
  options;
  rules;
  lexer;
  constructor(e4) {
    this.options = e4 || $r;
  }
  space(e4) {
    let t2 = this.rules.block.newline.exec(e4);
    if (t2 && t2[0].length > 0) return { type: "space", raw: t2[0] };
  }
  code(e4) {
    let t2 = this.rules.block.code.exec(e4);
    if (t2) {
      let e5 = t2[0].replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: t2[0], codeBlockStyle: "indented", text: this.options.pedantic ? e5 : ma(e5, `
`) };
    }
  }
  fences(e4) {
    let t2 = this.rules.block.fences.exec(e4);
    if (t2) {
      let e5 = t2[0], n2 = va(e5, t2[3] || "", this.rules);
      return { type: "code", raw: e5, lang: t2[2] ? t2[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t2[2], text: n2 };
    }
  }
  heading(e4) {
    let t2 = this.rules.block.heading.exec(e4);
    if (t2) {
      let e5 = t2[2].trim();
      if (this.rules.other.endingHash.test(e5)) {
        let t3 = ma(e5, "#");
        (this.options.pedantic || !t3 || this.rules.other.endingSpaceChar.test(t3)) && (e5 = t3.trim());
      }
      return { type: "heading", raw: t2[0], depth: t2[1].length, text: e5, tokens: this.lexer.inline(e5) };
    }
  }
  hr(e4) {
    let t2 = this.rules.block.hr.exec(e4);
    if (t2) return { type: "hr", raw: ma(t2[0], `
`) };
  }
  blockquote(e4) {
    let t2 = this.rules.block.blockquote.exec(e4);
    if (t2) {
      let e5 = ma(t2[0], `
`).split(`
`), n2 = "", r2 = "", i2 = [];
      for (; e5.length > 0; ) {
        let t3 = !1, a2 = [], o2 = 0;
        for (; o2 < e5.length; o2++) if (this.rules.other.blockquoteStart.test(e5[o2])) a2.push(e5[o2]), t3 = !0;
        else if (!t3) a2.push(e5[o2]);
        else break;
        e5 = e5.slice(o2);
        let s2 = a2.join(`
`), c2 = s2.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        n2 = n2 ? `${n2}
${s2}` : s2, r2 = r2 ? `${r2}
${c2}` : c2;
        let l2 = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(c2, i2, !0), this.lexer.state.top = l2, e5.length === 0) break;
        let u2 = i2.at(-1);
        if (u2?.type === "code") break;
        if (u2?.type === "blockquote") {
          let t4 = u2, a3 = t4.raw + `
` + e5.join(`
`), o3 = this.blockquote(a3);
          i2[i2.length - 1] = o3, n2 = n2.substring(0, n2.length - t4.raw.length) + o3.raw, r2 = r2.substring(0, r2.length - t4.text.length) + o3.text;
          break;
        }
        if (u2?.type === "list") {
          let t4 = u2, a3 = t4.raw + `
` + e5.join(`
`), o3 = this.list(a3);
          i2[i2.length - 1] = o3, n2 = n2.substring(0, n2.length - u2.raw.length) + o3.raw, r2 = r2.substring(0, r2.length - t4.raw.length) + o3.raw, e5 = a3.substring(i2.at(-1).raw.length).split(`
`);
        }
      }
      return { type: "blockquote", raw: n2, tokens: i2, text: r2 };
    }
  }
  list(e4) {
    let t2 = this.rules.block.list.exec(e4);
    if (t2) {
      let n2 = t2[1].trim(), r2 = n2.length > 1, i2 = { type: "list", raw: "", ordered: r2, start: r2 ? +n2.slice(0, -1) : "", loose: !1, items: [] };
      n2 = r2 ? `\\d{1,9}\\${n2.slice(-1)}` : `\\${n2}`, this.options.pedantic && (n2 = r2 ? n2 : "[*+-]");
      let a2 = this.rules.other.listItemRegex(n2), o2 = !1;
      for (; e4; ) {
        let n3 = !1, r3 = "", s3 = "";
        if (!(t2 = a2.exec(e4)) || this.rules.block.hr.test(e4)) break;
        r3 = t2[0], e4 = e4.substring(r3.length);
        let c2 = ga(t2[2].split(`
`, 1)[0], t2[1].length), l2 = e4.split(`
`, 1)[0], u2 = !c2.trim(), d2 = 0;
        if (this.options.pedantic ? (d2 = 2, s3 = c2.trimStart()) : u2 ? d2 = t2[1].length + 1 : (d2 = c2.search(this.rules.other.nonSpaceChar), d2 = d2 > 4 ? 1 : d2, s3 = c2.slice(d2), d2 += t2[1].length), u2 && this.rules.other.blankLine.test(l2) && (r3 += l2 + `
`, e4 = e4.substring(l2.length + 1), n3 = !0), !n3) {
          let t3 = this.rules.other.nextBulletRegex(d2), n4 = this.rules.other.hrRegex(d2), i3 = this.rules.other.fencesBeginRegex(d2), a3 = this.rules.other.headingBeginRegex(d2), o3 = this.rules.other.htmlBeginRegex(d2), f2 = this.rules.other.blockquoteBeginRegex(d2);
          for (; e4; ) {
            let p2 = e4.split(`
`, 1)[0], m2;
            if (l2 = p2, this.options.pedantic ? (l2 = l2.replace(this.rules.other.listReplaceNesting, "  "), m2 = l2) : m2 = l2.replace(this.rules.other.tabCharGlobal, "    "), i3.test(l2) || a3.test(l2) || o3.test(l2) || f2.test(l2) || t3.test(l2) || n4.test(l2)) break;
            if (m2.search(this.rules.other.nonSpaceChar) >= d2 || !l2.trim()) s3 += `
` + m2.slice(d2);
            else {
              if (u2 || c2.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || i3.test(c2) || a3.test(c2) || n4.test(c2)) break;
              s3 += `
` + l2;
            }
            u2 = !l2.trim(), r3 += p2 + `
`, e4 = e4.substring(p2.length + 1), c2 = m2.slice(d2);
          }
        }
        i2.loose || (o2 ? i2.loose = !0 : this.rules.other.doubleBlankLine.test(r3) && (o2 = !0)), i2.items.push({ type: "list_item", raw: r3, task: !!this.options.gfm && this.rules.other.listIsTask.test(s3), loose: !1, text: s3, tokens: [] }), i2.raw += r3;
      }
      let s2 = i2.items.at(-1);
      if (s2) s2.raw = s2.raw.trimEnd(), s2.text = s2.text.trimEnd();
      else return;
      i2.raw = i2.raw.trimEnd();
      for (let e5 of i2.items) {
        if (this.lexer.state.top = !1, e5.tokens = this.lexer.blockTokens(e5.text, []), e5.task) {
          if (e5.text = e5.text.replace(this.rules.other.listReplaceTask, ""), e5.tokens[0]?.type === "text" || e5.tokens[0]?.type === "paragraph") {
            e5.tokens[0].raw = e5.tokens[0].raw.replace(this.rules.other.listReplaceTask, ""), e5.tokens[0].text = e5.tokens[0].text.replace(this.rules.other.listReplaceTask, "");
            for (let e6 = this.lexer.inlineQueue.length - 1; e6 >= 0; e6--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[e6].src)) {
              this.lexer.inlineQueue[e6].src = this.lexer.inlineQueue[e6].src.replace(this.rules.other.listReplaceTask, "");
              break;
            }
          }
          let t3 = this.rules.other.listTaskCheckbox.exec(e5.raw);
          if (t3) {
            let n3 = { type: "checkbox", raw: t3[0] + " ", checked: t3[0] !== "[ ]" };
            e5.checked = n3.checked, i2.loose ? e5.tokens[0] && ["paragraph", "text"].includes(e5.tokens[0].type) && "tokens" in e5.tokens[0] && e5.tokens[0].tokens ? (e5.tokens[0].raw = n3.raw + e5.tokens[0].raw, e5.tokens[0].text = n3.raw + e5.tokens[0].text, e5.tokens[0].tokens.unshift(n3)) : e5.tokens.unshift({ type: "paragraph", raw: n3.raw, text: n3.raw, tokens: [n3] }) : e5.tokens.unshift(n3);
          }
        }
        if (!i2.loose) {
          let t3 = e5.tokens.filter((e6) => e6.type === "space");
          i2.loose = t3.length > 0 && t3.some((e6) => this.rules.other.anyLine.test(e6.raw));
        }
      }
      if (i2.loose) for (let e5 of i2.items) {
        e5.loose = !0;
        for (let t3 of e5.tokens) t3.type === "text" && (t3.type = "paragraph");
      }
      return i2;
    }
  }
  html(e4) {
    let t2 = this.rules.block.html.exec(e4);
    if (t2) return { type: "html", block: !0, raw: t2[0], pre: t2[1] === "pre" || t2[1] === "script" || t2[1] === "style", text: t2[0] };
  }
  def(e4) {
    let t2 = this.rules.block.def.exec(e4);
    if (t2) {
      let e5 = t2[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), n2 = t2[2] ? t2[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r2 = t2[3] ? t2[3].substring(1, t2[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t2[3];
      return { type: "def", tag: e5, raw: t2[0], href: n2, title: r2 };
    }
  }
  table(e4) {
    let t2 = this.rules.block.table.exec(e4);
    if (!t2 || !this.rules.other.tableDelimiter.test(t2[2])) return;
    let n2 = pa(t2[1]), r2 = t2[2].replace(this.rules.other.tableAlignChars, "").split("|"), i2 = t2[3]?.trim() ? t2[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], a2 = { type: "table", raw: t2[0], header: [], align: [], rows: [] };
    if (n2.length === r2.length) {
      for (let e5 of r2) this.rules.other.tableAlignRight.test(e5) ? a2.align.push("right") : this.rules.other.tableAlignCenter.test(e5) ? a2.align.push("center") : this.rules.other.tableAlignLeft.test(e5) ? a2.align.push("left") : a2.align.push(null);
      for (let e5 = 0; e5 < n2.length; e5++) a2.header.push({ text: n2[e5], tokens: this.lexer.inline(n2[e5]), header: !0, align: a2.align[e5] });
      for (let e5 of i2) a2.rows.push(pa(e5, a2.header.length).map((e6, t3) => ({ text: e6, tokens: this.lexer.inline(e6), header: !1, align: a2.align[t3] })));
      return a2;
    }
  }
  lheading(e4) {
    let t2 = this.rules.block.lheading.exec(e4);
    if (t2) {
      let e5 = t2[1].trim();
      return { type: "heading", raw: t2[0], depth: t2[2].charAt(0) === "=" ? 1 : 2, text: e5, tokens: this.lexer.inline(e5) };
    }
  }
  paragraph(e4) {
    let t2 = this.rules.block.paragraph.exec(e4);
    if (t2) {
      let e5 = t2[1].charAt(t2[1].length - 1) === `
` ? t2[1].slice(0, -1) : t2[1];
      return { type: "paragraph", raw: t2[0], text: e5, tokens: this.lexer.inline(e5) };
    }
  }
  text(e4) {
    let t2 = this.rules.block.text.exec(e4);
    if (t2) return { type: "text", raw: t2[0], text: t2[0], tokens: this.lexer.inline(t2[0]) };
  }
  escape(e4) {
    let t2 = this.rules.inline.escape.exec(e4);
    if (t2) return { type: "escape", raw: t2[0], text: t2[1] };
  }
  tag(e4) {
    let t2 = this.rules.inline.tag.exec(e4);
    if (t2) return !this.lexer.state.inLink && this.rules.other.startATag.test(t2[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t2[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t2[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t2[0]) && (this.lexer.state.inRawBlock = !1), { type: "html", raw: t2[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: !1, text: t2[0] };
  }
  link(e4) {
    let t2 = this.rules.inline.link.exec(e4);
    if (t2) {
      let e5 = t2[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(e5)) {
        if (!this.rules.other.endAngleBracket.test(e5)) return;
        let t3 = ma(e5.slice(0, -1), "\\");
        if ((e5.length - t3.length) % 2 == 0) return;
      } else {
        let e6 = ha(t2[2], "()");
        if (e6 === -2) return;
        if (e6 > -1) {
          let n3 = (t2[0].indexOf("!") === 0 ? 5 : 4) + t2[1].length + e6;
          t2[2] = t2[2].substring(0, e6), t2[0] = t2[0].substring(0, n3).trim(), t2[3] = "";
        }
      }
      let n2 = t2[2], r2 = "";
      if (this.options.pedantic) {
        let e6 = this.rules.other.pedanticHrefTitle.exec(n2);
        e6 && (n2 = e6[1], r2 = e6[3]);
      } else r2 = t2[3] ? t2[3].slice(1, -1) : "";
      return n2 = n2.trim(), this.rules.other.startAngleBracket.test(n2) && (n2 = this.options.pedantic && !this.rules.other.endAngleBracket.test(e5) ? n2.slice(1) : n2.slice(1, -1)), _a(t2, { href: n2 && n2.replace(this.rules.inline.anyPunctuation, "$1"), title: r2 && r2.replace(this.rules.inline.anyPunctuation, "$1") }, t2[0], this.lexer, this.rules);
    }
  }
  reflink(e4, t2) {
    let n2;
    if ((n2 = this.rules.inline.reflink.exec(e4)) || (n2 = this.rules.inline.nolink.exec(e4))) {
      let e5 = t2[(n2[2] || n2[1]).replace(this.rules.other.multipleSpaceGlobal, " ").toLowerCase()];
      if (!e5) {
        let e6 = n2[0].charAt(0);
        return { type: "text", raw: e6, text: e6 };
      }
      return _a(n2, e5, n2[0], this.lexer, this.rules);
    }
  }
  emStrong(e4, t2, n2 = "") {
    let r2 = this.rules.inline.emStrongLDelim.exec(e4);
    if (!(!r2 || !r2[1] && !r2[2] && !r2[3] && !r2[4] || r2[4] && n2.match(this.rules.other.unicodeAlphaNumeric)) && (!(r2[1] || r2[3]) || !n2 || this.rules.inline.punctuation.exec(n2))) {
      let n3 = [...r2[0]].length - 1, i2, a2, o2 = n3, s2 = 0, c2 = r2[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c2.lastIndex = 0, t2 = t2.slice(-1 * e4.length + n3); (r2 = c2.exec(t2)) !== null; ) {
        if (i2 = r2[1] || r2[2] || r2[3] || r2[4] || r2[5] || r2[6], !i2) continue;
        if (a2 = [...i2].length, r2[3] || r2[4]) {
          o2 += a2;
          continue;
        }
        if ((r2[5] || r2[6]) && n3 % 3 && !((n3 + a2) % 3)) {
          s2 += a2;
          continue;
        }
        if (o2 -= a2, o2 > 0) continue;
        a2 = Math.min(a2, a2 + o2 + s2);
        let t3 = [...r2[0]][0].length, c3 = e4.slice(0, n3 + r2.index + t3 + a2);
        if (Math.min(n3, a2) % 2) {
          let e5 = c3.slice(1, -1);
          return { type: "em", raw: c3, text: e5, tokens: this.lexer.inlineTokens(e5) };
        }
        let l2 = c3.slice(2, -2);
        return { type: "strong", raw: c3, text: l2, tokens: this.lexer.inlineTokens(l2) };
      }
    }
  }
  codespan(e4) {
    let t2 = this.rules.inline.code.exec(e4);
    if (t2) {
      let e5 = t2[2].replace(this.rules.other.newLineCharGlobal, " "), n2 = this.rules.other.nonSpaceChar.test(e5), r2 = this.rules.other.startingSpaceChar.test(e5) && this.rules.other.endingSpaceChar.test(e5);
      return n2 && r2 && (e5 = e5.substring(1, e5.length - 1)), { type: "codespan", raw: t2[0], text: e5 };
    }
  }
  br(e4) {
    let t2 = this.rules.inline.br.exec(e4);
    if (t2) return { type: "br", raw: t2[0] };
  }
  del(e4, t2, n2 = "") {
    let r2 = this.rules.inline.delLDelim.exec(e4);
    if (r2 && (!r2[1] || !n2 || this.rules.inline.punctuation.exec(n2))) {
      let n3 = [...r2[0]].length - 1, i2, a2, o2 = n3, s2 = this.rules.inline.delRDelim;
      for (s2.lastIndex = 0, t2 = t2.slice(-1 * e4.length + n3); (r2 = s2.exec(t2)) !== null; ) {
        if (i2 = r2[1] || r2[2] || r2[3] || r2[4] || r2[5] || r2[6], !i2 || (a2 = [...i2].length, a2 !== n3)) continue;
        if (r2[3] || r2[4]) {
          o2 += a2;
          continue;
        }
        if (o2 -= a2, o2 > 0) continue;
        a2 = Math.min(a2, a2 + o2);
        let t3 = [...r2[0]][0].length, s3 = e4.slice(0, n3 + r2.index + t3 + a2), c2 = s3.slice(n3, -n3);
        return { type: "del", raw: s3, text: c2, tokens: this.lexer.inlineTokens(c2) };
      }
    }
  }
  autolink(e4) {
    let t2 = this.rules.inline.autolink.exec(e4);
    if (t2) {
      let e5, n2;
      return t2[2] === "@" ? (e5 = t2[1], n2 = "mailto:" + e5) : (e5 = t2[1], n2 = e5), { type: "link", raw: t2[0], text: e5, href: n2, tokens: [{ type: "text", raw: e5, text: e5 }] };
    }
  }
  url(e4) {
    let t2;
    if (t2 = this.rules.inline.url.exec(e4)) {
      let e5, n2;
      if (t2[2] === "@") e5 = t2[0], n2 = "mailto:" + e5;
      else {
        let r2;
        do
          r2 = t2[0], t2[0] = this.rules.inline._backpedal.exec(t2[0])?.[0] ?? "";
        while (r2 !== t2[0]);
        e5 = t2[0], n2 = t2[1] === "www." ? "http://" + t2[0] : t2[0];
      }
      return { type: "link", raw: t2[0], text: e5, href: n2, tokens: [{ type: "text", raw: e5, text: e5 }] };
    }
  }
  inlineText(e4) {
    let t2 = this.rules.inline.text.exec(e4);
    if (t2) {
      let e5 = this.lexer.state.inRawBlock;
      return { type: "text", raw: t2[0], text: t2[0], escaped: e5 };
    }
  }
};
var ba = class e2 {
  tokens;
  options;
  state;
  inlineQueue;
  tokenizer;
  constructor(e4) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e4 || $r, this.options.tokenizer = this.options.tokenizer || new ya(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: !1, inRawBlock: !1, top: !0 };
    let t2 = { other: ri, block: sa.normal, inline: ca.normal };
    this.options.pedantic ? (t2.block = sa.pedantic, t2.inline = ca.pedantic) : this.options.gfm && (t2.block = sa.gfm, t2.inline = this.options.breaks ? ca.breaks : ca.gfm), this.tokenizer.rules = t2;
  }
  static get rules() {
    return { block: sa, inline: ca };
  }
  static lex(t2, n2) {
    return new e2(n2).lex(t2);
  }
  static lexInline(t2, n2) {
    return new e2(n2).inlineTokens(t2);
  }
  lex(e4) {
    e4 = e4.replace(ri.carriageReturn, `
`), this.blockTokens(e4, this.tokens);
    for (let e5 = 0; e5 < this.inlineQueue.length; e5++) {
      let t2 = this.inlineQueue[e5];
      this.inlineTokens(t2.src, t2.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e4, t2 = [], n2 = !1) {
    for (this.tokenizer.lexer = this, this.options.pedantic && (e4 = e4.replace(ri.tabCharGlobal, "    ").replace(ri.spaceLine, "")); e4; ) {
      let r2;
      if (this.options.extensions?.block?.some((n3) => (r2 = n3.call({ lexer: this }, e4, t2)) ? (e4 = e4.substring(r2.raw.length), t2.push(r2), !0) : !1)) continue;
      if (r2 = this.tokenizer.space(e4)) {
        e4 = e4.substring(r2.raw.length);
        let n3 = t2.at(-1);
        r2.raw.length === 1 && n3 !== void 0 ? n3.raw += `
` : t2.push(r2);
        continue;
      }
      if (r2 = this.tokenizer.code(e4)) {
        e4 = e4.substring(r2.raw.length);
        let n3 = t2.at(-1);
        n3?.type === "paragraph" || n3?.type === "text" ? (n3.raw += (n3.raw.endsWith(`
`) ? "" : `
`) + r2.raw, n3.text += `
` + r2.text, this.inlineQueue.at(-1).src = n3.text) : t2.push(r2);
        continue;
      }
      if ((r2 = this.tokenizer.fences(e4)) || (r2 = this.tokenizer.heading(e4)) || (r2 = this.tokenizer.hr(e4)) || (r2 = this.tokenizer.blockquote(e4)) || (r2 = this.tokenizer.list(e4)) || (r2 = this.tokenizer.html(e4))) {
        e4 = e4.substring(r2.raw.length), t2.push(r2);
        continue;
      }
      if (r2 = this.tokenizer.def(e4)) {
        e4 = e4.substring(r2.raw.length);
        let n3 = t2.at(-1);
        n3?.type === "paragraph" || n3?.type === "text" ? (n3.raw += (n3.raw.endsWith(`
`) ? "" : `
`) + r2.raw, n3.text += `
` + r2.raw, this.inlineQueue.at(-1).src = n3.text) : this.tokens.links[r2.tag] || (this.tokens.links[r2.tag] = { href: r2.href, title: r2.title }, t2.push(r2));
        continue;
      }
      if ((r2 = this.tokenizer.table(e4)) || (r2 = this.tokenizer.lheading(e4))) {
        e4 = e4.substring(r2.raw.length), t2.push(r2);
        continue;
      }
      let i2 = e4;
      if (this.options.extensions?.startBlock) {
        let t3 = 1 / 0, n3 = e4.slice(1), r3;
        this.options.extensions.startBlock.forEach((e5) => {
          r3 = e5.call({ lexer: this }, n3), typeof r3 == "number" && r3 >= 0 && (t3 = Math.min(t3, r3));
        }), t3 < 1 / 0 && t3 >= 0 && (i2 = e4.substring(0, t3 + 1));
      }
      if (this.state.top && (r2 = this.tokenizer.paragraph(i2))) {
        let a2 = t2.at(-1);
        n2 && a2?.type === "paragraph" ? (a2.raw += (a2.raw.endsWith(`
`) ? "" : `
`) + r2.raw, a2.text += `
` + r2.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = a2.text) : t2.push(r2), n2 = i2.length !== e4.length, e4 = e4.substring(r2.raw.length);
      } else if (r2 = this.tokenizer.text(e4)) {
        e4 = e4.substring(r2.raw.length);
        let n3 = t2.at(-1);
        n3?.type === "text" ? (n3.raw += (n3.raw.endsWith(`
`) ? "" : `
`) + r2.raw, n3.text += `
` + r2.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = n3.text) : t2.push(r2);
      } else if (e4) {
        let t3 = "Infinite loop on byte: " + e4.charCodeAt(0);
        if (this.options.silent) {
          console.error(t3);
          break;
        }
        throw Error(t3);
      }
    }
    return this.state.top = !0, t2;
  }
  inline(e4, t2 = []) {
    return this.inlineQueue.push({ src: e4, tokens: t2 }), t2;
  }
  inlineTokens(e4, t2 = []) {
    this.tokenizer.lexer = this;
    let n2 = e4, r2 = null;
    if (this.tokens.links) {
      let e5 = Object.keys(this.tokens.links);
      if (e5.length > 0) for (; (r2 = this.tokenizer.rules.inline.reflinkSearch.exec(n2)) !== null; ) e5.includes(r2[0].slice(r2[0].lastIndexOf("[") + 1, -1)) && (n2 = n2.slice(0, r2.index) + "[" + "a".repeat(r2[0].length - 2) + "]" + n2.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (r2 = this.tokenizer.rules.inline.anyPunctuation.exec(n2)) !== null; ) n2 = n2.slice(0, r2.index) + "++" + n2.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    let i2;
    for (; (r2 = this.tokenizer.rules.inline.blockSkip.exec(n2)) !== null; ) i2 = r2[2] ? r2[2].length : 0, n2 = n2.slice(0, r2.index + i2) + "[" + "a".repeat(r2[0].length - i2 - 2) + "]" + n2.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    n2 = this.options.hooks?.emStrongMask?.call({ lexer: this }, n2) ?? n2;
    let a2 = !1, o2 = "";
    for (; e4; ) {
      a2 || (o2 = ""), a2 = !1;
      let r3;
      if (this.options.extensions?.inline?.some((n3) => (r3 = n3.call({ lexer: this }, e4, t2)) ? (e4 = e4.substring(r3.raw.length), t2.push(r3), !0) : !1)) continue;
      if ((r3 = this.tokenizer.escape(e4)) || (r3 = this.tokenizer.tag(e4)) || (r3 = this.tokenizer.link(e4))) {
        e4 = e4.substring(r3.raw.length), t2.push(r3);
        continue;
      }
      if (r3 = this.tokenizer.reflink(e4, this.tokens.links)) {
        e4 = e4.substring(r3.raw.length);
        let n3 = t2.at(-1);
        r3.type === "text" && n3?.type === "text" ? (n3.raw += r3.raw, n3.text += r3.text) : t2.push(r3);
        continue;
      }
      if ((r3 = this.tokenizer.emStrong(e4, n2, o2)) || (r3 = this.tokenizer.codespan(e4)) || (r3 = this.tokenizer.br(e4)) || (r3 = this.tokenizer.del(e4, n2, o2)) || (r3 = this.tokenizer.autolink(e4)) || !this.state.inLink && (r3 = this.tokenizer.url(e4))) {
        e4 = e4.substring(r3.raw.length), t2.push(r3);
        continue;
      }
      let i3 = e4;
      if (this.options.extensions?.startInline) {
        let t3 = 1 / 0, n3 = e4.slice(1), r4;
        this.options.extensions.startInline.forEach((e5) => {
          r4 = e5.call({ lexer: this }, n3), typeof r4 == "number" && r4 >= 0 && (t3 = Math.min(t3, r4));
        }), t3 < 1 / 0 && t3 >= 0 && (i3 = e4.substring(0, t3 + 1));
      }
      if (r3 = this.tokenizer.inlineText(i3)) {
        e4 = e4.substring(r3.raw.length), r3.raw.slice(-1) !== "_" && (o2 = r3.raw.slice(-1)), a2 = !0;
        let n3 = t2.at(-1);
        n3?.type === "text" ? (n3.raw += r3.raw, n3.text += r3.text) : t2.push(r3);
      } else if (e4) {
        let t3 = "Infinite loop on byte: " + e4.charCodeAt(0);
        if (this.options.silent) {
          console.error(t3);
          break;
        }
        throw Error(t3);
      }
    }
    return t2;
  }
};
var xa = class {
  options;
  parser;
  constructor(e4) {
    this.options = e4 || $r;
  }
  space(e4) {
    return "";
  }
  code({ text: e4, lang: t2, escaped: n2 }) {
    let r2 = (t2 || "").match(ri.notSpaceStart)?.[0], i2 = e4.replace(ri.endingNewline, "") + `
`;
    return r2 ? '<pre><code class="language-' + da(r2) + '">' + (n2 ? i2 : da(i2, !0)) + `</code></pre>
` : "<pre><code>" + (n2 ? i2 : da(i2, !0)) + `</code></pre>
`;
  }
  blockquote({ tokens: e4 }) {
    return `<blockquote>
${this.parser.parse(e4)}</blockquote>
`;
  }
  html({ text: e4 }) {
    return e4;
  }
  def(e4) {
    return "";
  }
  heading({ tokens: e4, depth: t2 }) {
    return `<h${t2}>${this.parser.parseInline(e4)}</h${t2}>
`;
  }
  hr(e4) {
    return `<hr>
`;
  }
  list(e4) {
    let t2 = e4.ordered, n2 = e4.start, r2 = "";
    for (let t3 = 0; t3 < e4.items.length; t3++) {
      let n3 = e4.items[t3];
      r2 += this.listitem(n3);
    }
    let i2 = t2 ? "ol" : "ul", a2 = t2 && n2 !== 1 ? ' start="' + n2 + '"' : "";
    return "<" + i2 + a2 + `>
` + r2 + "</" + i2 + `>
`;
  }
  listitem(e4) {
    return `<li>${this.parser.parse(e4.tokens)}</li>
`;
  }
  checkbox({ checked: e4 }) {
    return "<input " + (e4 ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({ tokens: e4 }) {
    return `<p>${this.parser.parseInline(e4)}</p>
`;
  }
  table(e4) {
    let t2 = "", n2 = "";
    for (let t3 = 0; t3 < e4.header.length; t3++) n2 += this.tablecell(e4.header[t3]);
    t2 += this.tablerow({ text: n2 });
    let r2 = "";
    for (let t3 = 0; t3 < e4.rows.length; t3++) {
      let i2 = e4.rows[t3];
      n2 = "";
      for (let e5 = 0; e5 < i2.length; e5++) n2 += this.tablecell(i2[e5]);
      r2 += this.tablerow({ text: n2 });
    }
    return r2 &&= `<tbody>${r2}</tbody>`, `<table>
<thead>
` + t2 + `</thead>
` + r2 + `</table>
`;
  }
  tablerow({ text: e4 }) {
    return `<tr>
${e4}</tr>
`;
  }
  tablecell(e4) {
    let t2 = this.parser.parseInline(e4.tokens), n2 = e4.header ? "th" : "td";
    return (e4.align ? `<${n2} align="${e4.align}">` : `<${n2}>`) + t2 + `</${n2}>
`;
  }
  strong({ tokens: e4 }) {
    return `<strong>${this.parser.parseInline(e4)}</strong>`;
  }
  em({ tokens: e4 }) {
    return `<em>${this.parser.parseInline(e4)}</em>`;
  }
  codespan({ text: e4 }) {
    return `<code>${da(e4, !0)}</code>`;
  }
  br(e4) {
    return "<br>";
  }
  del({ tokens: e4 }) {
    return `<del>${this.parser.parseInline(e4)}</del>`;
  }
  link({ href: e4, title: t2, tokens: n2 }) {
    let r2 = this.parser.parseInline(n2), i2 = fa(e4);
    if (i2 === null) return r2;
    e4 = i2;
    let a2 = '<a href="' + e4 + '"';
    return t2 && (a2 += ' title="' + da(t2) + '"'), a2 += ">" + r2 + "</a>", a2;
  }
  image({ href: e4, title: t2, text: n2, tokens: r2 }) {
    r2 && (n2 = this.parser.parseInline(r2, this.parser.textRenderer));
    let i2 = fa(e4);
    if (i2 === null) return da(n2);
    e4 = i2;
    let a2 = `<img src="${e4}" alt="${da(n2)}"`;
    return t2 && (a2 += ` title="${da(t2)}"`), a2 += ">", a2;
  }
  text(e4) {
    return "tokens" in e4 && e4.tokens ? this.parser.parseInline(e4.tokens) : "escaped" in e4 && e4.escaped ? e4.text : da(e4.text);
  }
};
var Sa = class {
  strong({ text: e4 }) {
    return e4;
  }
  em({ text: e4 }) {
    return e4;
  }
  codespan({ text: e4 }) {
    return e4;
  }
  del({ text: e4 }) {
    return e4;
  }
  html({ text: e4 }) {
    return e4;
  }
  text({ text: e4 }) {
    return e4;
  }
  link({ text: e4 }) {
    return "" + e4;
  }
  image({ text: e4 }) {
    return "" + e4;
  }
  br() {
    return "";
  }
  checkbox({ raw: e4 }) {
    return e4;
  }
};
var Ca = class e3 {
  options;
  renderer;
  textRenderer;
  constructor(e4) {
    this.options = e4 || $r, this.options.renderer = this.options.renderer || new xa(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new Sa();
  }
  static parse(t2, n2) {
    return new e3(n2).parse(t2);
  }
  static parseInline(t2, n2) {
    return new e3(n2).parseInline(t2);
  }
  parse(e4) {
    this.renderer.parser = this;
    let t2 = "";
    for (let n2 = 0; n2 < e4.length; n2++) {
      let r2 = e4[n2];
      if (this.options.extensions?.renderers?.[r2.type]) {
        let e5 = r2, n3 = this.options.extensions.renderers[e5.type].call({ parser: this }, e5);
        if (n3 !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(e5.type)) {
          t2 += n3 || "";
          continue;
        }
      }
      let i2 = r2;
      switch (i2.type) {
        case "space":
          t2 += this.renderer.space(i2);
          break;
        case "hr":
          t2 += this.renderer.hr(i2);
          break;
        case "heading":
          t2 += this.renderer.heading(i2);
          break;
        case "code":
          t2 += this.renderer.code(i2);
          break;
        case "table":
          t2 += this.renderer.table(i2);
          break;
        case "blockquote":
          t2 += this.renderer.blockquote(i2);
          break;
        case "list":
          t2 += this.renderer.list(i2);
          break;
        case "checkbox":
          t2 += this.renderer.checkbox(i2);
          break;
        case "html":
          t2 += this.renderer.html(i2);
          break;
        case "def":
          t2 += this.renderer.def(i2);
          break;
        case "paragraph":
          t2 += this.renderer.paragraph(i2);
          break;
        case "text":
          t2 += this.renderer.text(i2);
          break;
        default: {
          let e5 = 'Token with "' + i2.type + '" type was not found.';
          if (this.options.silent) return console.error(e5), "";
          throw Error(e5);
        }
      }
    }
    return t2;
  }
  parseInline(e4, t2 = this.renderer) {
    this.renderer.parser = this;
    let n2 = "";
    for (let r2 = 0; r2 < e4.length; r2++) {
      let i2 = e4[r2];
      if (this.options.extensions?.renderers?.[i2.type]) {
        let e5 = this.options.extensions.renderers[i2.type].call({ parser: this }, i2);
        if (e5 !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i2.type)) {
          n2 += e5 || "";
          continue;
        }
      }
      let a2 = i2;
      switch (a2.type) {
        case "escape":
          n2 += t2.text(a2);
          break;
        case "html":
          n2 += t2.html(a2);
          break;
        case "link":
          n2 += t2.link(a2);
          break;
        case "image":
          n2 += t2.image(a2);
          break;
        case "checkbox":
          n2 += t2.checkbox(a2);
          break;
        case "strong":
          n2 += t2.strong(a2);
          break;
        case "em":
          n2 += t2.em(a2);
          break;
        case "codespan":
          n2 += t2.codespan(a2);
          break;
        case "br":
          n2 += t2.br(a2);
          break;
        case "del":
          n2 += t2.del(a2);
          break;
        case "text":
          n2 += t2.text(a2);
          break;
        default: {
          let e5 = 'Token with "' + a2.type + '" type was not found.';
          if (this.options.silent) return console.error(e5), "";
          throw Error(e5);
        }
      }
    }
    return n2;
  }
};
var wa = class {
  options;
  block;
  constructor(e4) {
    this.options = e4 || $r;
  }
  static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
  static passThroughHooksRespectAsync = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(e4) {
    return e4;
  }
  postprocess(e4) {
    return e4;
  }
  processAllTokens(e4) {
    return e4;
  }
  emStrongMask(e4) {
    return e4;
  }
  provideLexer(e4 = this.block) {
    return e4 ? ba.lex : ba.lexInline;
  }
  provideParser(e4 = this.block) {
    return e4 ? Ca.parse : Ca.parseInline;
  }
};
var Ta = new class {
  defaults = Qr();
  options = this.setOptions;
  parse = this.parseMarkdown(!0);
  parseInline = this.parseMarkdown(!1);
  Parser = Ca;
  Renderer = xa;
  TextRenderer = Sa;
  Lexer = ba;
  Tokenizer = ya;
  Hooks = wa;
  constructor(...e4) {
    this.use(...e4);
  }
  walkTokens(e4, t2) {
    let n2 = [];
    for (let r2 of e4) switch (n2 = n2.concat(t2.call(this, r2)), r2.type) {
      case "table": {
        let e5 = r2;
        for (let r3 of e5.header) n2 = n2.concat(this.walkTokens(r3.tokens, t2));
        for (let r3 of e5.rows) for (let e6 of r3) n2 = n2.concat(this.walkTokens(e6.tokens, t2));
        break;
      }
      case "list": {
        let e5 = r2;
        n2 = n2.concat(this.walkTokens(e5.items, t2));
        break;
      }
      default: {
        let e5 = r2;
        this.defaults.extensions?.childTokens?.[e5.type] ? this.defaults.extensions.childTokens[e5.type].forEach((r3) => {
          let i2 = e5[r3].flat(1 / 0);
          n2 = n2.concat(this.walkTokens(i2, t2));
        }) : e5.tokens && (n2 = n2.concat(this.walkTokens(e5.tokens, t2)));
      }
    }
    return n2;
  }
  use(...e4) {
    let t2 = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e4.forEach((e5) => {
      let n2 = { ...e5 };
      if (n2.async = this.defaults.async || n2.async || !1, e5.extensions && (e5.extensions.forEach((e6) => {
        if (!e6.name) throw Error("extension name required");
        if ("renderer" in e6) {
          let n3 = t2.renderers[e6.name];
          n3 ? t2.renderers[e6.name] = function(...t3) {
            let r2 = e6.renderer.apply(this, t3);
            return r2 === !1 && (r2 = n3.apply(this, t3)), r2;
          } : t2.renderers[e6.name] = e6.renderer;
        }
        if ("tokenizer" in e6) {
          if (!e6.level || e6.level !== "block" && e6.level !== "inline") throw Error("extension level must be 'block' or 'inline'");
          let n3 = t2[e6.level];
          n3 ? n3.unshift(e6.tokenizer) : t2[e6.level] = [e6.tokenizer], e6.start && (e6.level === "block" ? t2.startBlock ? t2.startBlock.push(e6.start) : t2.startBlock = [e6.start] : e6.level === "inline" && (t2.startInline ? t2.startInline.push(e6.start) : t2.startInline = [e6.start]));
        }
        "childTokens" in e6 && e6.childTokens && (t2.childTokens[e6.name] = e6.childTokens);
      }), n2.extensions = t2), e5.renderer) {
        let t3 = this.defaults.renderer || new xa(this.defaults);
        for (let n3 in e5.renderer) {
          if (!(n3 in t3)) throw Error(`renderer '${n3}' does not exist`);
          if (["options", "parser"].includes(n3)) continue;
          let r2 = n3, i2 = e5.renderer[r2], a2 = t3[r2];
          t3[r2] = (...e6) => {
            let n4 = i2.apply(t3, e6);
            return n4 === !1 && (n4 = a2.apply(t3, e6)), n4 || "";
          };
        }
        n2.renderer = t3;
      }
      if (e5.tokenizer) {
        let t3 = this.defaults.tokenizer || new ya(this.defaults);
        for (let n3 in e5.tokenizer) {
          if (!(n3 in t3)) throw Error(`tokenizer '${n3}' does not exist`);
          if (["options", "rules", "lexer"].includes(n3)) continue;
          let r2 = n3, i2 = e5.tokenizer[r2], a2 = t3[r2];
          t3[r2] = (...e6) => {
            let n4 = i2.apply(t3, e6);
            return n4 === !1 && (n4 = a2.apply(t3, e6)), n4;
          };
        }
        n2.tokenizer = t3;
      }
      if (e5.hooks) {
        let t3 = this.defaults.hooks || new wa();
        for (let n3 in e5.hooks) {
          if (!(n3 in t3)) throw Error(`hook '${n3}' does not exist`);
          if (["options", "block"].includes(n3)) continue;
          let r2 = n3, i2 = e5.hooks[r2], a2 = t3[r2];
          t3[r2] = wa.passThroughHooks.has(n3) ? (e6) => {
            if (this.defaults.async && wa.passThroughHooksRespectAsync.has(n3)) return (async () => {
              let n4 = await i2.call(t3, e6);
              return a2.call(t3, n4);
            })();
            let r3 = i2.call(t3, e6);
            return a2.call(t3, r3);
          } : (...e6) => {
            if (this.defaults.async) return (async () => {
              let n5 = await i2.apply(t3, e6);
              return n5 === !1 && (n5 = await a2.apply(t3, e6)), n5;
            })();
            let n4 = i2.apply(t3, e6);
            return n4 === !1 && (n4 = a2.apply(t3, e6)), n4;
          };
        }
        n2.hooks = t3;
      }
      if (e5.walkTokens) {
        let t3 = this.defaults.walkTokens, r2 = e5.walkTokens;
        n2.walkTokens = function(e6) {
          let n3 = [];
          return n3.push(r2.call(this, e6)), t3 && (n3 = n3.concat(t3.call(this, e6))), n3;
        };
      }
      this.defaults = { ...this.defaults, ...n2 };
    }), this;
  }
  setOptions(e4) {
    return this.defaults = { ...this.defaults, ...e4 }, this;
  }
  lexer(e4, t2) {
    return ba.lex(e4, t2 ?? this.defaults);
  }
  parser(e4, t2) {
    return Ca.parse(e4, t2 ?? this.defaults);
  }
  parseMarkdown(e4) {
    return (t2, n2) => {
      let r2 = { ...n2 }, i2 = { ...this.defaults, ...r2 }, a2 = this.onError(!!i2.silent, !!i2.async);
      if (this.defaults.async === !0 && r2.async === !1) return a2(Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof t2 > "u" || t2 === null) return a2(Error("marked(): input parameter is undefined or null"));
      if (typeof t2 != "string") return a2(Error("marked(): input parameter is of type " + Object.prototype.toString.call(t2) + ", string expected"));
      if (i2.hooks && (i2.hooks.options = i2, i2.hooks.block = e4), i2.async) return (async () => {
        let n3 = i2.hooks ? await i2.hooks.preprocess(t2) : t2, r3 = await (i2.hooks ? await i2.hooks.provideLexer(e4) : e4 ? ba.lex : ba.lexInline)(n3, i2), a3 = i2.hooks ? await i2.hooks.processAllTokens(r3) : r3;
        i2.walkTokens && await Promise.all(this.walkTokens(a3, i2.walkTokens));
        let o2 = await (i2.hooks ? await i2.hooks.provideParser(e4) : e4 ? Ca.parse : Ca.parseInline)(a3, i2);
        return i2.hooks ? await i2.hooks.postprocess(o2) : o2;
      })().catch(a2);
      try {
        i2.hooks && (t2 = i2.hooks.preprocess(t2));
        let n3 = (i2.hooks ? i2.hooks.provideLexer(e4) : e4 ? ba.lex : ba.lexInline)(t2, i2);
        i2.hooks && (n3 = i2.hooks.processAllTokens(n3)), i2.walkTokens && this.walkTokens(n3, i2.walkTokens);
        let r3 = (i2.hooks ? i2.hooks.provideParser(e4) : e4 ? Ca.parse : Ca.parseInline)(n3, i2);
        return i2.hooks && (r3 = i2.hooks.postprocess(r3)), r3;
      } catch (e5) {
        return a2(e5);
      }
    };
  }
  onError(e4, t2) {
    return (n2) => {
      if (n2.message += `
Please report this to https://github.com/markedjs/marked.`, e4) {
        let e5 = "<p>An error occurred:</p><pre>" + da(n2.message + "", !0) + "</pre>";
        return t2 ? Promise.resolve(e5) : e5;
      }
      if (t2) return Promise.reject(n2);
      throw n2;
    };
  }
}();
function $(e4, t2) {
  return Ta.parse(e4, t2);
}
($.options = $.setOptions = function(e4) {
  return Ta.setOptions(e4), $.defaults = Ta.defaults, ei($.defaults), $;
});
($.getDefaults = Qr);
($.defaults = $r);
($.use = function(...e4) {
  return Ta.use(...e4), $.defaults = Ta.defaults, ei($.defaults), $;
});
($.walkTokens = function(e4, t2) {
  return Ta.walkTokens(e4, t2);
});
($.parseInline = Ta.parseInline);
($.Parser = Ca);
($.parser = Ca.parse);
($.Renderer = xa);
($.TextRenderer = Sa);
($.Lexer = ba);
($.lexer = ba.lex);
($.Tokenizer = ya);
($.Hooks = wa);
($.parse = $);
function Ea(e4) {
  return e4.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
var Da = /\[(@profile|@script|input|textarea|url|project):|\[\$/;
var Oa = /\[(@profile|@script):([^\]]+)\]\(([^)]*)\)|\[(input|textarea|url|project):([^\]]+)\](?:\(([^)]*)\))?|\[\$([^\]]+)\]\(([^)]+)\)/g;
var ka = new xa();
$.use({ renderer: { html({ text: e4 }) {
  return Ea(e4);
}, link(e4) {
  return La(e4, this.parser);
}, code(e4) {
  return Ia(e4);
}, table(e4) {
  return Fa(e4, this.parser);
} }, extensions: [{ name: "agentToken", level: "inline", start(e4) {
  let t2 = e4.search(Da);
  return t2 === -1 ? void 0 : t2;
}, tokenizer(e4) {
  return Ma(e4);
}, renderer(e4) {
  return e4.type === "agentToken" ? Pa(e4) : "";
} }] });
function Aa(e4, t2 = {}) {
  return Ba($.parse(ja(e4), { async: !1, breaks: t2.preserveLineBreaks ?? !1 }));
}
function ja(e4) {
  return e4.replace(/(\[[^\]\n]*\]\()((?:\/[a-z]:|[a-z]:|file:\/\/\/?[a-z]:)[^)\n]*)(\))/gi, (e5, t2, n2, r2) => `${t2}${Wa(n2).replace(/\\+/g, "/")}${r2}`);
}
function Ma(e4) {
  let t2 = Oa.exec(e4);
  if (Oa.lastIndex = 0, !t2 || t2.index !== 0) return;
  let n2 = Na(t2);
  return { type: "agentToken", raw: t2[0], ...n2 };
}
function Na(e4) {
  if (e4[1]) {
    let t2 = e4[1] === "@profile" ? "profile" : "script";
    return { kind: t2, marker: t2 === "profile" ? "@" : "/", title: e4[2] || "", target: e4[3] || "" };
  }
  return e4[4] === "input" || e4[4] === "textarea" || e4[4] === "url" || e4[4] === "project" ? { kind: e4[4], marker: "", title: e4[5], target: e4[6] || "" } : { kind: "skill", marker: "/", title: e4[7] || "", target: e4[8] || "" };
}
function Pa(e4) {
  let t2 = Ga(e4), n2 = t2.count ? ` count="${Ya(t2.count)}"` : "", r2 = t2.details ? ` details="${Ya(t2.details)}"` : "";
  return `<roxy-agent-token kind="${Ya(e4.kind)}" title="${Ya(t2.title)}" target="${Ya(e4.target)}"${n2}${r2}></roxy-agent-token>`;
}
function Fa(e4, t2) {
  return ka.parser = t2, ['<div class="agent-md-table">', '<div class="agent-md-table__scroll">', ka.table(e4), "</div>", `<roxy-agent-table-copy encoded-markdown="${encodeURIComponent(e4.raw.trimEnd())}"></roxy-agent-table-copy>`, "</div>"].join("");
}
function Ia(e4) {
  return ['<div class="agent-md-code">', ka.code(e4), `<roxy-agent-code-copy encoded-code="${encodeURIComponent(e4.text)}"></roxy-agent-code-copy>`, "</div>"].join("");
}
function La(e4, t2) {
  if (!e4.href.trim()) return Ea(e4.raw);
  ka.parser = t2;
  let n2 = za(e4);
  if (n2 === -1) return Ra(ka.link(e4), e4.raw, e4.href);
  let r2 = e4.text.slice(0, n2), i2 = e4.text.slice(n2), a2 = e4.href.slice(0, e4.href.length - i2.length), o2 = { ...e4, raw: r2, text: r2, href: a2, tokens: [{ type: "text", raw: r2, text: r2 }] }, s2 = $.parseInline(i2, { async: !1 });
  return `${Ra(ka.link(o2), o2.raw, o2.href)}${s2}`;
}
function Ra(e4, t2, n2) {
  let r2 = Ue(n2), i2 = r2 ? ` data-agent-favicon-url="${Ya(r2)}"` : "";
  return e4.replace("<a ", `<a data-markdown-source="${encodeURIComponent(t2)}"${i2} `);
}
function za(e4) {
  return e4.raw !== e4.text || !/^(?:(?:https?|ftp):\/\/|www\.)/i.test(e4.text) ? -1 : e4.text.search(/[\u3001\u3002\uFF0C\uFF01\uFF1F\uFF1B\uFF1A\uFF09\uFF3D\uFF5D\u3009\u300B\u300D\u300F\u3011\u3015\u3017\u3019\u301B\u201D\u2019]/u);
}
function Ba(e4) {
  if (typeof document > "u") return e4;
  let t2 = document.createElement("template");
  return t2.innerHTML = e4, t2.content.querySelectorAll("a[href]").forEach((e5) => {
    let t3 = Va(e5.getAttribute("href"));
    if (!t3) {
      e5.setAttribute("target", "_blank"), e5.setAttribute("rel", "noopener noreferrer");
      return;
    }
    let n2 = Ka(t3);
    e5.setAttribute("href", Ha(t3)), e5.setAttribute("download", n2), e5.setAttribute("data-local-file-path", t3), e5.removeAttribute("target"), e5.classList.add("agent-md-download"), e5.textContent?.trim() || (e5.textContent = n2);
  }), t2.innerHTML;
}
function Va(e4) {
  let t2 = e4?.trim();
  if (!t2) return "";
  let n2 = Wa(Ja(t2));
  return n2 ? n2.startsWith("file://") ? Ua(n2) : /^[a-z]:[\\/]/i.test(n2) ? n2 : /^[a-z][a-z\d+.-]*:/i.test(n2) ? "" : n2.startsWith("/") && !n2.startsWith("//") && !n2.startsWith("/api/") && Ka(n2) ? Ja(n2) : "" : "";
}
function Ha(e4) {
  if (e4.startsWith("file://")) return encodeURI(e4);
  let t2 = e4.replaceAll("\\", "/");
  return /^[a-z]:\//i.test(t2) ? `file:///${qa(t2)}` : `file://${qa(t2)}`;
}
function Ua(e4) {
  let t2 = e4.slice(7);
  return /^\/[a-z]:[\\/]/i.test(t2) ? t2.slice(1) : /^[a-z]:[\\/]/i.test(t2) ? t2 : e4;
}
function Wa(e4) {
  return e4.replace(/^\/(?=[a-z]:[\\/])/i, "");
}
function Ga(e4) {
  if (e4.kind === "input" || e4.kind === "textarea" || e4.kind === "url" || e4.kind === "project") return { title: e4.target.trim() || e4.title, count: "", details: "" };
  if (e4.kind !== "profile") return { title: e4.title, count: "", details: "" };
  let t2 = Number(e4.title), n2 = e4.target.split(",").filter(Boolean).length, r2 = Number.isFinite(t2) && t2 > 0 ? t2 : n2, i2 = e4.target.split(",").map((e5) => e5.trim()).filter(Boolean);
  return { title: r2 > 0 ? $t("\u7A97\u53E3") : $t("\u9009\u62E9\u7A97\u53E3"), count: r2 > 0 ? String(r2) : "", details: r2 > 0 ? Et(Ct(i2), r2) : "" };
}
function Ka(e4) {
  return e4.split(/[\\/]/).filter(Boolean).pop() || "download";
}
function qa(e4) {
  return e4.split("/").map((e5) => encodeURIComponent(e5).replaceAll("%3A", ":")).join("/");
}
function Ja(e4) {
  try {
    return decodeURI(e4);
  } catch {
    return e4;
  }
}
function Ya(e4) {
  return Ea(e4);
}
var Xa = "base/rx_ic_copy";
var Za = "base/rx_ic_check";
var Qa = 1200;
async function $a(e4) {
  return e4 ? (await Promise.resolve(l(e4)), !0) : !1;
}
var eo = se({ props: { encodedCode: { type: String, default: "" } }, styles: [`
:host {
  display: inline-flex;
  width: 24px;
  height: 24px;
  color: var(--color-text-tertiary);
  opacity: 0.78;
  transition: opacity 0.16s ease;
}

:host(:hover),
:host(:focus-within) {
  opacity: 1;
}

.copy-control {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: currentColor;
  cursor: pointer;
  outline: none;
  transition: color 0.16s ease, transform 0.16s ease;
}

.copy-control:hover,
.copy-control:focus-visible {
  color: var(--color-text-secondary);
}

.copy-control:active {
  transform: scale(0.94);
}

.copy-control.copied {
  color: var(--color-text-success-primary);
}

roxy-svg-icon {
  display: inline-flex;
  width: 14px;
  height: 14px;
  pointer-events: none;
}
`], data() {
  return { copied: !1, copiedTimer: null };
}, unmounted() {
  this.copiedTimer && window.clearTimeout(this.copiedTimer);
}, methods: { async copyCode(e4) {
  e4.preventDefault(), e4.stopPropagation();
  let t2 = to(this.encodedCode);
  t2 && (await $a(t2), this.copied = !0, this.copiedTimer && window.clearTimeout(this.copiedTimer), this.copiedTimer = window.setTimeout(() => {
    this.copied = !1, this.copiedTimer = null;
  }, Qa));
} }, render() {
  let e4 = this.copied ? $t("\u5DF2\u590D\u5236") : $t("\u590D\u5236");
  return g("span", { role: "button", tabindex: 0, class: ["copy-control", { copied: this.copied }], title: e4, "aria-label": e4, onClick: this.copyCode, onKeydown: (e5) => {
    (e5.key === "Enter" || e5.key === " ") && (e5.preventDefault(), e5.stopPropagation(), this.copyCode(e5));
  } }, [g("roxy-svg-icon", { name: this.copied ? Za : Xa, size: 14, color: "currentColor" })]);
} });
function to(e4) {
  if (!e4) return "";
  try {
    return decodeURIComponent(e4);
  } catch {
    return e4;
  }
}
function no() {
  typeof customElements < "u" && (customElements.get("roxy-agent-code-copy") || customElements.define("roxy-agent-code-copy", eo));
}
var ro = se({ props: { encodedMarkdown: { type: String, default: "" } }, styles: [`
:host {
  display: inline-flex;
  width: 24px;
  height: 24px;
  color: var(--color-text-tertiary);
  opacity: 0.78;
  transition: opacity 0.16s ease;
}

:host(:hover),
:host(:focus-within) {
  opacity: 1;
}

.copy-control {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: currentColor;
  cursor: pointer;
  outline: none;
  transition: color 0.16s ease, transform 0.16s ease;
}

.copy-control:hover,
.copy-control:focus-visible {
  color: var(--color-text-secondary);
}

.copy-control:active {
  transform: scale(0.94);
}

.copy-control.copied {
  color: var(--color-text-success-primary);
}

roxy-svg-icon {
  display: inline-flex;
  width: 14px;
  height: 14px;
  pointer-events: none;
}
`], data() {
  return { copied: !1, copiedTimer: null };
}, unmounted() {
  this.copiedTimer && window.clearTimeout(this.copiedTimer);
}, methods: { async copyTableMarkdown(e4) {
  e4.preventDefault(), e4.stopPropagation();
  let t2 = io(this.encodedMarkdown);
  t2 && (await $a(t2), this.copied = !0, this.copiedTimer && window.clearTimeout(this.copiedTimer), this.copiedTimer = window.setTimeout(() => {
    this.copied = !1, this.copiedTimer = null;
  }, Qa));
} }, render() {
  let e4 = this.copied ? $t("\u5DF2\u590D\u5236") : $t("\u590D\u5236");
  return g("span", { role: "button", tabindex: 0, class: ["copy-control", { copied: this.copied }], title: e4, "aria-label": e4, onClick: this.copyTableMarkdown, onKeydown: (e5) => {
    (e5.key === "Enter" || e5.key === " ") && (e5.preventDefault(), e5.stopPropagation(), this.copyTableMarkdown(e5));
  } }, [g("roxy-svg-icon", { name: this.copied ? Za : Xa, size: 14, color: "currentColor" })]);
} });
function io(e4) {
  if (!e4) return "";
  try {
    return decodeURIComponent(e4);
  } catch {
    return e4;
  }
}
function ao() {
  typeof customElements < "u" && (customElements.get("roxy-agent-table-copy") || customElements.define("roxy-agent-table-copy", ro));
}
var oo = `
:host {
  display: inline-flex;
  max-width: 100%;
  vertical-align: middle;
}

:host([kind="profile"]) {
  width: max-content;
  max-width: none;
  white-space: nowrap;
}

.agent-token {
  display: inline-flex;
  max-width: 280px;
  min-height: 24px;
  align-items: center;
  box-sizing: border-box;
  gap: 4px;
  margin: 0 2px;
  padding: 2px 6px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  line-height: 18px;
  vertical-align: middle;
  white-space: nowrap;
}

.agent-token__icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: none;
  align-items: center;
  justify-content: center;
}

.agent-token__icon roxy-svg-icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
}

.agent-token__label {
  min-width: 0;
  overflow: hidden;
  pointer-events: none;
  text-overflow: ellipsis;
}

.agent-token__profile-prefix,
.agent-token__profile-detail {
  display: inline-flex;
  width: max-content;
  min-height: 24px;
  flex: none;
  align-items: center;
  box-sizing: border-box;
  gap: 4px;
  padding: 2px 6px;
}

.agent-token__profile-prefix {
  border-radius: 8px 0 0 8px;
  background: var(--color-bg-tag-purple, #ebe9fe);
}

.agent-token__profile-detail {
  min-width: 0;
  border-radius: 0 8px 8px 0;
  background: var(--color-bg-tag-purple-hover, #d9d6fe);
}

.agent-token__profile-names {
  flex: none;
  white-space: nowrap;
}

.agent-token__remove {
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: 0 0 12px;
  align-items: center;
  justify-content: center;
  color: currentColor;
}

.agent-token--profile {
  width: max-content;
  max-width: none;
  flex: none;
  color: var(--color-text-tag-purple, #5925dc);
  background: transparent;
  font-size: 14px;
  font-weight: 400;
}

.agent-token--profile .agent-token__label {
  overflow: visible;
  flex: none;
  text-overflow: clip;
  white-space: nowrap;
}

.agent-token--profile:not(.agent-token--profile-empty) {
  gap: 0;
  padding: 0;
}

.agent-token--profile-empty {
  gap: 4px;
  padding: 2px 6px;
  border: 1px dashed #7a5af8;
  background: var(--color-bg-tag-purple, #ebe9fe);
}

.agent-token--skill {
  color: var(--color-text-tag-pink, #c11574);
  background: var(--color-bg-tag-pink, #fce7f6);
}

.agent-token--script {
  color: var(--color-text-tag-blue, #175cd3);
  background: var(--color-bg-tag-blue, #d1e9ff);
}

.agent-token--input,
.agent-token--textarea,
.agent-token--url,
.agent-token--project {
  color: var(--color-text-primary);
  background: var(--color-bg-tertiary);
}

/*
 * Keep the host attribute as a styling source as well as the inner kind
 * class. This is important for tokens inserted through v-html: the host
 * attribute is the serialized source of truth, while the shadow component
 * may still be upgraded after the HTML has been inserted.
 */
:host([kind="input"]) .agent-token,
:host([kind="textarea"]) .agent-token,
:host([kind="project"]) .agent-token {
  color: var(--color-text-primary);
  background: var(--color-bg-tertiary);
}


.agent-token--input-empty {
  border: 1px dashed currentColor;
  color: #c2410c;
  background: rgba(251, 146, 60, 0.12);
}

:host([kind="input"][target=""]) .agent-token,
:host([kind="input"]:not([target])) .agent-token,
:host([kind="textarea"][target=""]) .agent-token,
:host([kind="textarea"]:not([target])) .agent-token,
:host([kind="project"][target=""]) .agent-token,
:host([kind="project"]:not([target])) .agent-token {
  border: 1px dashed currentColor;
  color: #c2410c;
  background: rgba(251, 146, 60, 0.12);
}
`;
function so(e4) {
  return e4 === "profile" || e4 === "skill" || e4 === "script" || e4 === "input" || e4 === "textarea" || e4 === "url" || e4 === "project" ? e4 : "skill";
}
function co(e4, t2, n2) {
  return (e4 === "input" || e4 === "textarea" || e4 === "url" || e4 === "project") && n2.trim() || t2;
}
var lo = se({ props: { kind: { type: String, default: "skill" }, title: { type: String, default: "" }, target: { type: String, default: "" }, count: { type: String, default: "" }, details: { type: String, default: "" } }, styles: [oo], render() {
  let e4 = so(this.kind), t2 = uo(e4), n2 = e4 === "profile" ? this.count.trim() : "", r2 = e4 === "profile" && !this.target.trim(), i2 = (e4 === "input" || e4 === "textarea" || e4 === "url" || e4 === "project") && !this.target.trim(), a2 = co(e4, this.title, this.target);
  return g("span", { class: ["agent-token", `agent-token--${e4}`, r2 ? "agent-token--profile-empty" : "", i2 ? "agent-token--input-empty" : ""].filter(Boolean).join(" "), "data-agent-token": e4, "data-kind": e4, "data-title": this.title, "data-target": this.target, "data-count": n2, "data-details": this.details }, [...n2 ? [g("span", { class: "agent-token__profile-prefix" }, [g("span", { class: "agent-token__icon" }, [g("roxy-svg-icon", { name: t2, fallback: t2, size: 16 })]), g("span", { class: "agent-token__label" }, a2)]), g("span", { class: "agent-token__profile-detail" }, [g("span", { class: "agent-token__profile-names" }, this.details)])] : [g("span", { class: "agent-token__icon" }, [g("roxy-svg-icon", { name: t2, fallback: t2, size: 16 })]), g("span", { class: "agent-token__label" }, a2)]]);
} });
function uo(e4) {
  return e4 === "profile" ? "roxy-agent/rx-ic-token-profile" : e4 === "input" || e4 === "textarea" || e4 === "project" ? "roxy-agent/rx-ic-prompts" : e4 === "url" ? "roxy-agent/rx-ic-url" : e4 === "script" ? "roxy-agent/rx-ic-scripts" : "roxy-agent/rx-ic-skills";
}
function fo() {
  typeof customElements < "u" && (customElements.get("roxy-agent-token") || customElements.define("roxy-agent-token", lo));
}
function po(e4, t2, n2) {
  return t2 ? { kind: "text", content: e4 } : { kind: "html", content: n2(e4) };
}
var mo = { class: "agent-markdown__streaming-text" };
var ho = ["innerHTML"];
var go = K(h({ __name: "MarkdownContent", props: { content: {}, preserveLineBreaks: { type: Boolean, default: !1 }, streaming: { type: Boolean, default: !1 }, variant: { default: "default" } }, setup(e4) {
  let t2 = e4;
  fo(), ao(), no();
  let [, n2] = le(), r2 = s(), i2 = b(null), a2 = () => {
  }, o2 = T(() => po(t2.content, t2.streaming, (e5) => Aa(e5, { labelVersion: bt.value, preserveLineBreaks: t2.preserveLineBreaks })));
  z(i2, (e5) => {
    a2(), a2 = We(e5);
  }, { flush: "post" }), ee(() => {
    a2();
  }), z(() => [t2.content, t2.streaming], async ([e5, t3]) => {
    if (t3) return;
    let n3 = wt(Dt(e5));
    if (n3.length) try {
      St((await Vt(n3, r2.currentWorkspace?.workspaceName)).map((e6) => ({ id: e6.id, label: e6.code || e6.name || e6.id })));
    } catch (e6) {
      console.error("Failed to load Agent profile token labels:", e6);
    }
  }, { immediate: !0 });
  function l2(e5) {
    if (!(e5.target instanceof Element)) return;
    let t3 = e5.target.closest("a[data-local-file-path]"), r3 = t3?.dataset.localFilePath;
    t3 && r3 && globalThis.electronAPI && c() && (e5.preventDefault(), globalThis.electronAPI.send("app:downloadLocalFile", { filePath: r3, fileName: t3.getAttribute("download") || t3.textContent?.trim() || void 0 }).catch((e6) => {
      console.error("Failed to download markdown local file:", e6), n2(-1, u2(e6));
    }));
  }
  function u2(e5) {
    return d2(e5) && e5.code === "ENOENT" ? $t("\u6587\u4EF6\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u79FB\u52A8") : $t("\u4E0B\u8F7D\u5931\u8D25");
  }
  function d2(e5) {
    return typeof e5 == "object" && !!e5 && "code" in e5;
  }
  return (t3, n3) => j(o2).kind === "text" ? (S(), O("div", { key: 0, ref_key: "markdownRef", ref: i2, class: E(["agent-markdown", { "agent-markdown--answer": e4.variant === "answer" }]), onClick: l2 }, [D("p", mo, A(j(o2).content), 1)], 2)) : (S(), O("div", { key: 1, ref_key: "markdownRef", ref: i2, class: E(["agent-markdown", { "agent-markdown--answer": e4.variant === "answer" }]), onClick: l2, innerHTML: j(o2).content }, null, 10, ho));
} }), [["__scopeId", "data-v-f4aaa54a"]]);
var _o = ["aria-label"];
var vo = ["onDragover", "onDragstart", "onDrop"];
var yo = { class: "prompt-queue__content" };
var bo = { class: "prompt-queue__actions" };
var xo = ["aria-label", "onClick"];
var So = ["aria-label", "onClick"];
var Co = K(h({ __name: "PromptQueue", props: { prompts: {} }, emits: ["remove", "reorder", "restore"], setup(e4, { emit: t2 }) {
  let n2 = e4, r2 = t2, i2 = b(), a2 = b(), o2 = b(null);
  z(() => n2.prompts.map((e5) => e5.id), async (e5, t3) => {
    e5.some((e6) => !t3.includes(e6)) && (await _(), o2.value && (o2.value.scrollTop = o2.value.scrollHeight));
  }, { flush: "post" });
  function s2(e5, t3) {
    i2.value = t3, e5.dataTransfer?.setData("text/plain", t3), e5.dataTransfer && (e5.dataTransfer.effectAllowed = "move");
  }
  function c2(e5) {
    return Array.from(e5.dataTransfer?.types ?? []).includes("Files");
  }
  function l2(e5, t3) {
    c2(e5) ? a2.value = void 0 : (e5.preventDefault(), a2.value = t3, e5.dataTransfer && (e5.dataTransfer.dropEffect = "move"));
  }
  function u2(e5, t3) {
    if (c2(e5)) {
      d2();
      return;
    }
    e5.preventDefault();
    let n3 = i2.value || e5.dataTransfer?.getData("text/plain");
    n3 && r2("reorder", { promptId: n3, targetIndex: t3 }), d2();
  }
  function d2() {
    i2.value = void 0, a2.value = void 0;
  }
  return (t3, n3) => {
    let c3 = de;
    return e4.prompts.length ? (S(), O("section", { key: 0, class: "prompt-queue", "aria-label": t3.$t("\u63D0\u793A\u8BCD\u961F\u5217") }, [D("div", { ref_key: "listRef", ref: o2, class: "prompt-queue__list" }, [(S(!0), O(k, null, I(e4.prompts, (e5, o3) => (S(), O("article", { key: e5.id, class: E(["prompt-queue__item", { "prompt-queue__item--dragging": j(i2) === e5.id, "prompt-queue__item--drop-target": j(a2) === o3 && j(i2) !== e5.id }]), draggable: "true", onDragend: d2, onDragover: (e6) => l2(e6, o3), onDragstart: (t4) => s2(t4, e5.id), onDrop: (e6) => u2(e6, o3) }, [B(De, { content: t3.$t("\u62D6\u52A8\u6392\u5E8F"), placement: "top", offset: 8 }, { default: N(() => [...n3[0] ||= [D("span", { class: "prompt-queue__handle", "aria-hidden": "true" }, [D("i"), D("i"), D("i"), D("i"), D("i"), D("i")], -1)]]), _: 1 }, 8, ["content"]), D("div", yo, [B(hr, { content: j(Ke)(e5), "content-class": "prompt-queue__content-tooltip", "overflow-target-selector": ".agent-markdown", placement: "top-start" }, { default: N(() => [B(go, { content: j(Ke)(e5) }, null, 8, ["content"])]), _: 2 }, 1032, ["content"])]), D("span", bo, [B(De, { content: t3.$t("\u64A4\u56DE\u5E76\u7F16\u8F91"), placement: "top", offset: 8 }, { default: N(() => [D("button", { type: "button", "aria-label": t3.$t("\u64A4\u56DE\u5E76\u7F16\u8F91"), onClick: (t4) => r2("restore", e5.id) }, [B(c3, { name: "base/rx_ic_agent_edit", size: "16", color: "currentColor", "aria-hidden": "true" })], 8, xo)]), _: 2 }, 1032, ["content"]), B(De, { content: t3.$t("\u5220\u9664"), placement: "top", offset: 8 }, { default: N(() => [D("button", { type: "button", "aria-label": t3.$t("\u5220\u9664"), onClick: (t4) => r2("remove", e5.id) }, [B(c3, { name: "roxy-agent/rx-ic-mcp-delete", size: "16", color: "currentColor", "aria-hidden": "true" })], 8, So)]), _: 2 }, 1032, ["content"])])], 42, vo))), 128))], 512)], 8, _o)) : P("", !0);
  };
} }), [["__scopeId", "data-v-6e007863"]]);
var wo = "/images/agent-console/template-unread-dot.svg";
var To = { class: "slash-command-popover" };
var Eo = { class: "slash-command-header" };
var Do = ["value", "placeholder", "onKeydown"];
var Oo = { class: "slash-command-list" };
var ko = ["onMouseenter", "onMouseleave"];
var Ao = ["onMousedown"];
var jo = { class: "slash-command-icon-wrap" };
var Mo = { key: 0, class: "slash-command-unread", src: wo, alt: "", "aria-hidden": "true" };
var No = { class: "slash-command-copy" };
var Po = { class: "slash-command-title" };
var Fo = { class: "slash-command-desc" };
var Io = ["disabled", "aria-label", "aria-pressed", "onClick"];
var Lo = { class: "slash-command-type" };
var Ro = { key: 1, class: "slash-command-empty" };
var zo = 300;
var Bo = K(h({ __name: "SlashCommandPopover", props: { activeItem: {}, items: {}, query: {} }, emits: ["choose", "hover", "navigate", "read", "search", "toggleTop"], setup(e4, { emit: t2 }) {
  let n2 = e4, r2 = t2, i2 = ue(), a2 = null, o2;
  function s2(e5) {
    r2("search", e5.target.value);
  }
  function c2() {
    i2.push({ name: "agent-console-template-store" });
  }
  function l2(e5) {
    e5 && o2 !== e5 || (a2 !== null && window.clearTimeout(a2), a2 = null, o2 = void 0);
  }
  function u2(e5) {
    r2("hover", e5), l2(), e5.unread && (o2 = e5.id, a2 = window.setTimeout(() => {
      a2 = null, o2 = void 0, r2("read", e5);
    }, zo));
  }
  function d2(e5) {
    l2(e5.id);
  }
  function f2(e5) {
    if (e5?.isComposing || e5?.keyCode === 229) return;
    let t3 = n2.activeItem ?? n2.items[0];
    t3 && r2("choose", t3);
  }
  z(() => n2.items, (e5) => {
    o2 && !e5.some((e6) => e6.id === o2 && e6.unread) && l2();
  }), ee(l2);
  function p2(e5) {
    return e5.payload.templateType === "script" ? $t("\u811A\u672C") : e5.payload.templateType === "skills" || e5.payload.templateType === "skill" ? "Skill" : e5.payload.templateType === "prompt" ? $t("\u63D0\u793A\u8BCD") : $t("\u6A21\u677F");
  }
  return (t3, n3) => {
    let i3 = de;
    return S(), O("div", To, [D("div", Eo, [D("label", { class: "slash-command-search", onMousedown: n3[2] ||= H(() => {
    }, ["stop"]) }, [B(i3, { name: "base/rx_ic_magnify", size: "16" }), D("input", { value: e4.query, placeholder: t3.$t("\u641C\u7D22\u6A21\u677F"), type: "text", onInput: s2, onKeydown: [n3[0] ||= W(H((e5) => r2("navigate", "next"), ["prevent"]), ["down"]), W(H(f2, ["prevent"]), ["enter"]), n3[1] ||= W(H((e5) => r2("navigate", "previous"), ["prevent"]), ["up"])] }, null, 40, Do)], 32), D("button", { class: "slash-command-more", type: "button", onClick: c2, onMousedown: n3[3] ||= H(() => {
    }, ["prevent", "stop"]) }, [B(i3, { name: "roxy-agent/rx-ic-templates-store", size: "18" }), D("span", null, A(t3.$t("\u66F4\u591A\u6A21\u677F")), 1)], 32)]), D("div", Oo, [e4.items.length ? (S(), F(U, { key: 0, class: "slash-command-items", name: "slash-command-item", tag: "div" }, { default: N(() => [(S(!0), O(k, null, I(e4.items, (a3) => (S(), O("div", { key: a3.id, class: E(["slash-command-item", { "slash-command-item--active": e4.activeItem?.id === a3.id }]), onMouseenter: (e5) => u2(a3), onMouseleave: (e5) => d2(a3) }, [D("button", { class: "slash-command-select", type: "button", onMousedown: H((e5) => r2("choose", a3), ["prevent"]) }, [D("span", jo, [B(i3, { class: "slash-command-icon", name: a3.iconName, size: "16" }, null, 8, ["name"]), a3.unread ? (S(), O("img", Mo)) : P("", !0)]), D("span", No, [D("span", Po, A(a3.title), 1), D("span", Fo, A(a3.description), 1)])], 40, Ao), D("button", { class: E(["slash-command-top", { "slash-command-top--active": a3.isTopped }]), type: "button", disabled: a3.isTopping, "aria-label": a3.isTopped ? t3.$t("\u53D6\u6D88\u7F6E\u9876") : t3.$t("\u7F6E\u9876"), "aria-pressed": a3.isTopped, onClick: H((e5) => r2("toggleTop", a3), ["stop"]), onMousedown: n3[4] ||= H(() => {
    }, ["prevent", "stop"]) }, [B(i3, { name: a3.isTopped ? "base/rx_ic_pin_solid" : "base/rx_ic_pin_line", size: "16", "aria-hidden": "true" }, null, 8, ["name"])], 42, Io), D("span", Lo, A(p2(a3)), 1)], 42, ko))), 128))]), _: 1 })) : (S(), O("div", Ro, A(t3.$t("\u6CA1\u6709\u627E\u5230\u6A21\u677F")), 1))])]);
  };
} }), [["__scopeId", "data-v-9a701847"]]);
var Vo = { class: "window-picker-popover" };
var Ho = { class: "window-picker-header" };
var Uo = { class: "window-picker-count" };
var Wo = { class: "window-picker-search-wrap" };
var Go = { key: 0, class: "pi pi-spin pi-spinner", "aria-hidden": "true" };
var Ko = ["value", "placeholder", "onKeydown"];
var qo = ["aria-busy"];
var Jo = { class: "window-picker-title" };
var Yo = { key: 0, class: "window-picker-title__code" };
var Xo = { key: 1, class: "window-picker-title__name" };
var Zo = { key: 2, class: "window-picker-title__remark" };
var Qo = { key: 0, class: "window-picker-list-state", role: "status" };
var $o = { key: 1, class: "window-picker-list-state window-picker-list-state--error", role: "alert" };
var es = { key: 2, class: "window-picker-list-state" };
var ts = { class: "window-picker-footer" };
var ns = { class: "window-picker-actions" };
var rs = K(h({ __name: "WindowPickerPopover", props: { allSelected: { type: Boolean }, activeItem: {}, hasMore: { type: Boolean }, items: {}, loadError: {}, loadingMore: { type: Boolean }, projectOptions: {}, query: {}, selectedCount: {}, selectedIds: {}, selectedProjectId: {}, selectAllLoading: { type: Boolean } }, emits: ["cancel", "choose", "confirm", "hover", "loadMore", "projectChange", "retry", "search", "toggleAll"], setup(e4, { emit: t2 }) {
  let n2 = e4, r2 = t2;
  function i2(e5) {
    return n2.selectedIds.has(e5.id);
  }
  function a2(e5) {
    let { workspaceName: t3, windowSortNum: n3 } = e5.payload;
    if (!n3) return e5.payload.windowName ? "" : e5.title;
    let r3 = G(t3);
    return r3 ? `${r3}-${n3}` : n3;
  }
  function o2(e5) {
    r2("search", e5.target.value);
  }
  function s2(e5) {
    let t3 = e5.currentTarget;
    n2.hasMore && !n2.loadingMore && !n2.selectAllLoading && !n2.loadError && t3.scrollHeight - t3.scrollTop - t3.clientHeight <= 24 && r2("loadMore");
  }
  function c2(e5) {
    if (e5?.isComposing || e5?.keyCode === 229) return;
    let t3 = n2.activeItem ?? n2.items[0];
    t3 && r2("choose", t3);
  }
  return (t3, n3) => {
    let l2 = de;
    return S(), O("div", Vo, [D("div", Ho, [D("span", null, A(t3.$t("\u9009\u62E9\u7A97\u53E3")), 1), D("span", Uo, A(t3.$t("\u5DF2\u9009\u62E9{count}\u9879", { count: e4.selectedCount })), 1)]), D("div", Wo, [B(Ce, { "model-value": e4.allSelected, class: "window-picker-select-all", "input-id": "window-picker-select-all", disabled: e4.selectAllLoading || !e4.items.length && !e4.hasMore, "onUpdate:modelValue": n3[0] ||= (e5) => r2("toggleAll") }, { default: N(() => [e4.selectAllLoading ? (S(), O("i", Go)) : P("", !0), D("span", null, A(t3.$t("\u5168\u9009")), 1)]), _: 1 }, 8, ["model-value", "disabled"]), B(ge, { class: "window-picker-project-select", "model-value": e4.selectedProjectId, options: e4.projectOptions, "aria-label": t3.$t("\u9879\u76EE"), onMousedown: n3[1] ||= H(() => {
    }, ["stop"]), "onUpdate:modelValue": n3[2] ||= (e5) => r2("projectChange", String(e5 ?? "")) }, null, 8, ["model-value", "options", "aria-label"]), D("label", { class: "window-picker-search", onMousedown: n3[3] ||= H(() => {
    }, ["stop"]) }, [B(l2, { name: "base/rx_ic_magnify", size: "16" }), D("input", { value: e4.query, placeholder: t3.$t("\u641C\u7D22\u7A97\u53E3"), type: "text", onInput: o2, onKeydown: W(H(c2, ["prevent"]), ["enter"]) }, null, 40, Ko)], 32)]), D("div", { class: "window-picker-list", "aria-busy": e4.loadingMore || e4.selectAllLoading, onScrollPassive: s2 }, [(S(!0), O(k, null, I(e4.items, (n4) => (S(), F(Ce, { key: n4.id, "model-value": i2(n4), class: E(["window-picker-item", { "window-picker-item--active": e4.activeItem?.id === n4.id, "window-picker-item--selected": i2(n4) }]), "input-id": `window-picker-${n4.id}`, onMouseenter: (e5) => r2("hover", n4), "onUpdate:modelValue": (e5) => r2("choose", n4) }, { default: N(() => [B(l2, { class: "window-picker-flag", name: n4.iconName || "base/rx_ic_route2", fallback: "base/rx_ic_route2", size: "16", color: "var(--colors-icon-icon-tertiary)" }, null, 8, ["name"]), D("span", Jo, [a2(n4) ? (S(), O("span", Yo, A(a2(n4)), 1)) : P("", !0), n4.payload.windowName ? (S(), O("span", Xo, A(a2(n4) ? "\xB7 " : "") + A(n4.payload.windowName), 1)) : P("", !0), n4.payload.windowRemark ? (S(), O("span", Zo, A(a2(n4) || n4.payload.windowName ? "\xB7 " : "") + A(n4.payload.windowRemark), 1)) : P("", !0)]), n4.isOpen ? (S(), F(Y, { key: 0, class: "window-open-badge", type: "open", label: t3.$t("\u7A97\u53E3\u5DF2\u6253\u5F00") }, null, 8, ["label"])) : P("", !0)]), _: 2 }, 1032, ["model-value", "class", "input-id", "onMouseenter", "onUpdate:modelValue"]))), 128)), e4.loadingMore ? (S(), O("div", Qo, [n3[7] ||= D("i", { class: "pi pi-spin pi-spinner", "aria-hidden": "true" }, null, -1), D("span", null, A(t3.$t("\u52A0\u8F7D\u4E2D...")), 1)])) : e4.loadError ? (S(), O("div", $o, [D("span", null, A(e4.loadError), 1), D("button", { type: "button", onClick: n3[4] ||= (e5) => r2("retry") }, A(t3.$t("\u91CD\u8BD5")), 1)])) : e4.items.length === 0 ? (S(), O("div", es, A(t3.$t("\u6CA1\u6709\u627E\u5230\u7ED3\u679C")), 1)) : P("", !0)], 40, qo), D("div", ts, [D("div", ns, [B(J, { icon: !1, class: "window-picker-cancel", variant: "secondary", onMousedown: n3[5] ||= H((e5) => r2("cancel"), ["prevent"]) }, { default: N(() => [w(A(t3.$t("\u53D6\u6D88")), 1)]), _: 1 }), B(J, { icon: !1, class: "window-picker-done", variant: "primary", onMousedown: n3[6] ||= H((e5) => r2("confirm"), ["prevent"]) }, { default: N(() => [w(A(t3.$t("\u5B8C\u6210")) + " (" + A(e4.selectedCount) + ") ", 1)]), _: 1 })])])]);
  };
} }), [["__scopeId", "data-v-f791c7c6"]]);
var is = ["aria-label"];
var as = { class: "slash-suggestion-skeleton__header", "aria-hidden": "true" };
var os = { class: "slash-suggestion-skeleton__list", "aria-hidden": "true" };
var ss = { key: 1, class: "suggestion-state" };
var cs = { key: 4, class: "suggestion-state" };
var ls = K(h({ __name: "SuggestionMenu", props: { allSelected: { type: Boolean }, anchor: {}, hasMore: { type: Boolean }, loadError: {}, loadingMore: { type: Boolean }, projectOptions: {}, selectedCount: {}, selectedIds: {}, selectedProjectId: {}, selectAllLoading: { type: Boolean }, state: {} }, emits: ["cancel", "choose", "confirm", "dismiss", "hover", "loadMore", "navigate", "projectChange", "read", "retry", "search", "toggleAll", "toggleTop"], setup(e4, { emit: t2 }) {
  let n2 = e4, r2 = t2, i2 = C("popoverRef"), a2 = b(800), o2 = b(320), s2 = null, c2 = T(() => n2.state.items[n2.state.activeIndex]), l2 = T(() => n2.state.items.length > 0), u2 = T(() => `agent-composer-suggestions--${n2.state.kind}`);
  function d2() {
    let e5 = n2.anchor?.getBoundingClientRect();
    e5 && (a2.value = e5.width, o2.value = Math.max(220, Math.min(420, e5.top - 24)));
  }
  function f2() {
    n2.state.open && i2.value && n2.anchor && (d2(), requestAnimationFrame(() => {
      i2.value && n2.anchor && q(i2.value, n2.anchor, { points: ["bl", "tl"], offset: [0, -12], targetOffset: [0, 0], overflow: { adjustX: !0, adjustY: !1 }, useCssTransform: !0, ignoreShake: !0 });
    }));
  }
  z(() => [n2.state.open, n2.state.kind, n2.state.items.length, n2.selectedCount, n2.anchor], () => _(f2), { flush: "post" }), z(() => i2.value, (e5) => {
    s2?.disconnect(), s2 = null, e5 && (s2 = new ResizeObserver(() => {
      f2();
    }), s2.observe(e5));
  }, { flush: "post" });
  function p2() {
    _(f2);
  }
  function m2(e5) {
    let t3 = e5.composedPath();
    if (i2.value && t3.includes(i2.value)) return !0;
    let n3 = e5.target;
    return n3 instanceof Element && !!n3.closest("[data-composer-suggestion-trigger], .agent-select-overlay");
  }
  function h2(e5) {
    n2.state.open && !m2(e5) && r2("dismiss");
  }
  function g2(e5) {
    n2.state.open && !m2(e5) && r2("dismiss");
  }
  return te(() => {
    window.addEventListener("resize", p2), window.addEventListener("scroll", p2, !0), document.addEventListener("pointerdown", h2, !0), document.addEventListener("focusin", g2, !0), _(f2);
  }), ee(() => {
    window.removeEventListener("resize", p2), window.removeEventListener("scroll", p2, !0), document.removeEventListener("pointerdown", h2, !0), document.removeEventListener("focusin", g2, !0), s2?.disconnect();
  }), (t3, n3) => {
    let s3 = he;
    return S(), F(R, { to: "body" }, [e4.state.open ? (S(), O("div", { key: 0, ref_key: "popoverRef", ref: i2, class: E(["agent-composer-suggestions", j(u2)]), style: L({ width: `${j(a2)}px`, maxHeight: `${j(o2)}px` }) }, [B(j(me), { mode: "wait" }, { default: N(() => [(S(), F(j(pe).div, { key: e4.state.kind, class: "agent-composer-suggestions__motion", initial: { opacity: 0, y: 8, scale: 0.99 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 8, scale: 0.99 }, transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] } }, { default: N(() => [e4.state.loading && e4.state.kind === "slash" ? (S(), O("div", { key: 0, class: "slash-suggestion-skeleton", "aria-busy": "true", "aria-label": t3.$t("\u52A0\u8F7D\u4E2D...") }, [D("div", as, [B(s3, { width: "100%", height: "34px", "border-radius": "8px" }), B(s3, { width: "92px", height: "34px", "border-radius": "10px" })]), D("div", os, [(S(), O(k, null, I(5, (e5) => D("div", { key: e5, class: "slash-suggestion-skeleton__row" }, [B(s3, { width: "16px", height: "16px", "border-radius": "4px" }), B(s3, { width: "30%", height: "16px", "border-radius": "4px" }), B(s3, { width: "42%", height: "14px", "border-radius": "4px" }), B(s3, { width: "44px", height: "16px", "border-radius": "4px" })])), 64))])], 8, is)) : e4.state.loading ? (S(), O("div", ss, A(t3.$t("\u52A0\u8F7D\u4E2D...")), 1)) : e4.state.kind === "mention" ? (S(), F(rs, { key: 2, "active-item": j(c2), "all-selected": e4.allSelected, "has-more": e4.hasMore, items: e4.state.items, "load-error": e4.loadError, "loading-more": e4.loadingMore, "project-options": e4.projectOptions, query: e4.state.query, "selected-count": e4.selectedCount, "selected-ids": e4.selectedIds, "selected-project-id": e4.selectedProjectId, "select-all-loading": e4.selectAllLoading, onCancel: n3[0] ||= (e5) => r2("cancel"), onChoose: n3[1] ||= (e5) => r2("choose", e5), onConfirm: n3[2] ||= (e5) => r2("confirm"), onHover: n3[3] ||= (e5) => r2("hover", e5), onLoadMore: n3[4] ||= (e5) => r2("loadMore"), onNavigate: n3[5] ||= (e5) => r2("navigate", e5), onProjectChange: n3[6] ||= (e5) => r2("projectChange", e5), onRetry: n3[7] ||= (e5) => r2("retry"), onSearch: n3[8] ||= (e5) => r2("search", e5), onToggleAll: n3[9] ||= (e5) => r2("toggleAll") }, null, 8, ["active-item", "all-selected", "has-more", "items", "load-error", "loading-more", "project-options", "query", "selected-count", "selected-ids", "selected-project-id", "select-all-loading"])) : e4.state.kind === "slash" ? (S(), F(Bo, { key: 3, "active-item": j(c2), items: e4.state.items, query: e4.state.query, onChoose: n3[10] ||= (e5) => r2("choose", e5), onHover: n3[11] ||= (e5) => r2("hover", e5), onNavigate: n3[12] ||= (e5) => r2("navigate", e5), onRead: n3[13] ||= (e5) => r2("read", e5), onSearch: n3[14] ||= (e5) => r2("search", e5), onToggleTop: n3[15] ||= (e5) => r2("toggleTop", e5) }, null, 8, ["active-item", "items", "query"])) : j(l2) ? P("", !0) : (S(), O("div", cs, A(t3.$t("\u6CA1\u6709\u627E\u5230\u7ED3\u679C")) + ' "' + A(e4.state.query) + '" ', 1))]), _: 1 }))]), _: 1 })], 6)) : P("", !0)]);
  };
} }), [["__scopeId", "data-v-692f55fe"]]);
function us(e4) {
  return e4.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || e4;
}
function ds(e4) {
  if (!e4) return [];
  let t2 = Array.from(e4.items ?? []).filter((e5) => e5.kind === "file"), n2 = Array.from(e4.files ?? []);
  return n2.length ? n2.map((e5, n3) => ({ file: e5, entry: t2[n3]?.webkitGetAsEntry?.() ?? null })) : t2.flatMap((e5) => {
    let t3 = e5.getAsFile();
    return t3 ? [{ file: t3, entry: e5.webkitGetAsEntry?.() ?? null }] : [];
  });
}
function fs(e4, t2) {
  let n2 = [], r2 = [];
  for (let i2 of e4) {
    let e5 = t2(i2);
    e5 ? n2.push({ file: i2, path: e5 }) : r2.push(i2);
  }
  return { localPathFiles: n2, uploadFiles: r2 };
}
function ps(e4, t2, n2) {
  return { kind: n2?.isDirectory ? "folder" : "file", name: n2?.name || e4 || us(t2), path: t2 };
}
var ms = 4e3;
var hs = 40;
var gs = 1e3;
function _s(e4) {
  let t2 = e4.trim();
  if (!t2) return !1;
  let n2 = t2.split(/\r?\n/);
  return t2.length >= ms || n2.length >= hs || n2.some((e5) => e5.length >= gs);
}
var vs = Ne.extend({ inclusive: !1, renderHTML({ HTMLAttributes: e4 }) {
  let t2 = Ue(e4.href), n2 = t2 ? { "data-agent-favicon-url": t2 } : {};
  return ["a", Me(this.options.HTMLAttributes, e4, n2), 0];
}, addAttributes() {
  return { ...this.parent?.(), markdownSource: { default: null, parseHTML: (e4) => e4.getAttribute("data-markdown-source"), renderHTML: (e4) => e4.markdownSource ? { "data-markdown-source": e4.markdownSource } : {} } };
} }).configure({ shouldAutoLink: (e4) => /^https?:\/\//i.test(e4) });
var ys = Ae.create({ name: "agentToken", group: "inline", inline: !0, atom: !0, selectable: !0, addAttributes() {
  return { id: { default: "" }, kind: { default: "skill" }, title: { default: "" }, label: { default: "" }, description: { default: "" }, iconName: { default: "" }, group: { default: "" }, payload: { default: {} } };
}, parseHTML() {
  return [{ tag: "span[data-agent-token]", getAttrs: (e4) => {
    let t2 = e4.getAttribute("data-payload");
    return { id: e4.getAttribute("data-id") || "", kind: e4.getAttribute("data-kind") || e4.getAttribute("data-agent-token") || "skill", title: e4.getAttribute("data-title") || e4.textContent?.trim() || "", label: e4.getAttribute("data-label") || "", description: e4.getAttribute("data-description") || "", iconName: e4.getAttribute("data-icon-name") || "", group: e4.getAttribute("data-group") || "", payload: t2 ? xs(t2) : {} };
  } }];
}, renderHTML({ node: e4 }) {
  let t2 = e4.attrs, n2 = Ss(t2.kind), r2 = t2.iconName || Cs(n2), i2 = ws(t2), a2 = Ts(t2), o2 = Et(Tt(t2.payload), a2, Es(t2)), s2 = (n2 === "input" || n2 === "textarea" || n2 === "url" || n2 === "project") && !t2.payload.value?.trim(), c2 = n2 === "profile" && a2 === 0;
  return ["span", Me({ "data-agent-token": n2, "data-id": t2.id, "data-kind": n2, "data-title": t2.title, "data-label": t2.label || "", "data-description": t2.description, "data-icon-name": t2.iconName, "data-group": t2.group, "data-payload": JSON.stringify(t2.payload || {}), class: ["agent-token", `agent-token--${n2}`, s2 ? "agent-token--input-empty" : "", c2 ? "agent-token--profile-empty" : ""].filter(Boolean).join(" ") }), ...n2 === "profile" && a2 > 0 ? [["span", { class: "agent-token__profile-prefix" }, ["span", { class: "agent-token__icon" }, ["roxy-svg-icon", { name: r2, fallback: Cs(n2), size: 16 }]], ["span", { class: "agent-token__label" }, i2]], ["span", { class: "agent-token__profile-detail" }, ["span", { class: "agent-token__profile-names" }, o2], ["span", { "aria-label": "Remove token", contenteditable: "false", "data-agent-token-remove": "", role: "button", class: "agent-token__remove" }, ["roxy-svg-icon", { name: "base/rx_ic_delete", size: 12 }]]]] : [["span", { class: "agent-token__icon" }, ["roxy-svg-icon", { name: r2, fallback: Cs(n2), size: 16 }]], ["span", { class: "agent-token__label" }, i2]], ...n2 === "input" || n2 === "textarea" || n2 === "url" || n2 === "project" || n2 === "profile" && a2 > 0 ? [] : [["span", { "aria-label": "Remove token", contenteditable: "false", "data-agent-token-remove": "", role: "button", class: "agent-token__remove" }, ["roxy-svg-icon", { name: "base/rx_ic_delete", size: 12 }]]]];
}, renderText({ node: e4 }) {
  return Ln(e4.attrs);
} });
function bs(e4) {
  return Ie.create({ name: "slashCommand", addProseMirrorPlugins() {
    return [je({ editor: this.editor, char: "/", items: ({ query: t2 }) => e4.getItems(t2), command: ({ editor: t2, range: n2, props: r2 }) => {
      e4.command({ editor: t2, range: n2, item: r2 });
    }, render: e4.render })];
  } });
}
function xs(e4) {
  try {
    return JSON.parse(e4);
  } catch {
    return {};
  }
}
function Ss(e4) {
  return e4 === "profile" || e4 === "script" || e4 === "skill" || e4 === "input" || e4 === "textarea" || e4 === "url" || e4 === "project" ? e4 : "skill";
}
function Cs(e4) {
  return e4 === "input" || e4 === "textarea" || e4 === "project" ? "roxy-agent/rx-ic-prompts" : e4 === "url" ? "roxy-agent/rx-ic-url" : e4 === "profile" ? "roxy-agent/rx-ic-token-profile" : e4 === "script" ? "roxy-agent/rx-ic-scripts" : "roxy-agent/rx-ic-skills";
}
function ws(e4) {
  return e4.kind === "profile" ? Ts(e4) > 0 ? $t("\u7A97\u53E3") : $t("\u9009\u62E9\u7A97\u53E3") : e4.kind !== "input" && e4.kind !== "textarea" && e4.kind !== "url" && e4.kind !== "project" ? e4.title : e4.payload.value?.trim() || e4.title;
}
function Ts(e4) {
  if (e4.kind !== "profile") return 0;
  let t2 = e4.payload.dirIds || e4.payload.dirId || e4.id || "";
  if (t2.trim()) return t2.split(",").map((e5) => e5.trim()).filter(Boolean).length;
  let n2 = Number(e4.payload.count);
  return Number.isFinite(n2) ? n2 : 0;
}
function Es(e4) {
  return e4.kind === "profile" ? (e4.payload.dirIds || e4.payload.dirId || e4.id || "").split(",").map((e5) => e5.trim()).filter(Boolean) : [];
}
var Ds = "agent-console:composer-project-selection";
function Os(e4) {
  if (e4 !== void 0) return e4 ?? void 0;
  if (typeof window < "u") try {
    return window.localStorage;
  } catch {
    return;
  }
}
function ks(e4) {
  let t2 = String(e4 ?? "").trim();
  return t2 ? `${Ds}:${t2}` : void 0;
}
function As(e4, t2) {
  let n2 = ks(e4), r2 = Os(t2);
  if (n2 && r2) try {
    return r2.getItem(n2)?.trim() || void 0;
  } catch {
    return;
  }
}
function js(e4, t2, n2) {
  let r2 = ks(e4), i2 = t2.trim(), a2 = Os(n2);
  if (r2 && i2 && a2) try {
    a2.setItem(r2, i2);
  } catch {
  }
}
function Ms(e4) {
  return e4 === "mention" ? { closeAfterChoose: !1, multiSelect: !0 } : { closeAfterChoose: !0, multiSelect: !1 };
}
function Ns(e4, t2, n2) {
  return t2 <= 0 ? 0 : (Math.min(Math.max(e4, 0), t2 - 1) + (n2 === "next" ? 1 : -1) + t2) % t2;
}
function Ps(e4, t2) {
  if (!e4 || !t2) return !0;
  let n2 = t2.to === t2.from + e4.nodeSize, r2 = e4.type.name === "agentToken" || e4.type.name === "mention";
  return !n2 || !r2;
}
function Fs(e4, t2) {
  let n2 = /* @__PURE__ */ new Set();
  for (let r2 of Mn(e4)) r2.kind === t2 && (t2 !== "script" || r2.templateRef) && (t2 !== "skill" || r2.skillPath) && (t2 === "profile" ? Is(r2.target) : [r2.kind === "skill" ? r2.skillPath ?? r2.target : r2.templateRef ?? r2.target]).forEach((e5) => n2.add(e5));
  return n2;
}
function Is(e4) {
  return e4.split(",").map((e5) => e5.trim()).filter(Boolean);
}
var Ls = 8;
function Rs(e4) {
  return e4.slice(0, Ls);
}
var zs = "";
function Bs(e4) {
  zs = typeof e4 == "string" ? e4.trim() : "";
}
function Vs() {
  return zs;
}
function Hs(e4) {
  return e4.trim().replace(/[^\w-]/g, "_").replace(/_+/g, "_");
}
function Us(e4) {
  let t2 = e4?.trim();
  if (!t2) return "";
  let n2 = t2.replace(/\\/g, "/");
  if (!n2 || n2.startsWith("/") || /^[a-z]:/i.test(n2)) return "";
  let r2 = n2.split("/");
  if (r2.includes("..")) return "";
  let i2 = r2.filter((e5) => e5 && e5 !== ".").join("/");
  return i2 ? Hs(i2) : "";
}
function Ws(e4) {
  return Us(e4);
}
function Gs(e4) {
  return typeof e4 == "object" && !!e4 && !Array.isArray(e4);
}
function Ks(e4) {
  return e4 === "script" || e4 === "scripts" ? "script" : e4 === "skill" || e4 === "skills" ? "skill" : e4 === "prompt" ? e4 : "prompt";
}
function qs(e4, t2) {
  return typeof e4 == "string" ? e4.trim() : X(e4, t2).trim();
}
function Js(e4, t2, n2) {
  for (let r2 of t2) {
    let t3 = qs(e4[r2], n2);
    if (t3) return t3;
  }
  return "";
}
function Ys(e4) {
  return e4.startsWith("official-") ? e4.slice(9) : e4;
}
function Xs(e4) {
  let t2 = Js(e4, ["packageSlug", "package_slug", "skillSlug", "skill_slug"]);
  if (t2) {
    let e5 = Us(Ys(t2));
    if (e5) return e5;
  }
  if (Gs(e4.skillMetadata)) {
    let t3 = Js(e4.skillMetadata, ["packageSlug", "package_slug", "skillSlug", "skill_slug"]);
    if (t3) {
      let e5 = Us(Ys(t3));
      if (e5) return e5;
    }
    let n3 = qs(e4.skillMetadata.slug);
    if (n3) return Us(Ys(n3));
  }
  let n2 = qs(e4.slug);
  return n2 ? Us(Ys(n2)) : "";
}
function Zs(e4) {
  return Xs(e4.metadata ?? {}) || Ys(e4.slug?.trim() ?? "");
}
function Qs(e4, t2) {
  return Js(e4, ["prompt", "promptText", "prompt_text", "templatePrompt", "template_prompt", "content", "text"], t2);
}
function $s(e4) {
  return Ks("kind" in e4 ? e4.kind : e4.templateType);
}
function ec(e4) {
  let t2 = d(e4.namespace, e4.id), n2 = e4.kind === "skill" ? Ws(e4.skillSlug) : "";
  return e4.kind === "skill" && console.info("[skill-template-debug] create skill template token", { id: e4.id, namespace: e4.namespace, title: e4.title, skillSlug: e4.skillSlug, installedRoot: Vs(), skillPath: n2 }), { id: n2 || t2, kind: e4.kind, title: e4.title, label: e4.title, description: e4.description, iconName: e4.kind === "skill" ? "roxy-agent/rx-ic-skills" : "roxy-agent/rx-ic-scripts", group: e4.kind === "skill" ? "Skills" : "Scripts", payload: e4.kind === "skill" ? { ...e4.skillSlug ? { skillSlug: e4.skillSlug } : {}, ...n2 ? { skillPath: n2 } : {} } : { templateRef: t2 } };
}
function tc(e4, t2) {
  let n2 = Gs(e4.metadata) ? e4.metadata : {}, r2 = $s(e4), i2 = X(e4.name, t2) || String(e4.id), a2 = Qs(n2, t2), o2 = X(e4.description, t2) || a2, s2 = r2 === "skill" ? Xs(n2) : "";
  r2 === "skill" && console.info("[skill-template-debug] map user skill template composer item", { id: e4.id, title: i2, officialTemplateId: e4.officialTemplateId, metadataKeys: Object.keys(n2), packageSlug: n2.packageSlug, skillSlug: n2.skillSlug, normalizedSkillSlug: s2, skillMdPath: n2.skillMdPath, nestedSkillSlug: Gs(n2.skillMetadata) ? n2.skillMetadata.slug : void 0, installedRoot: Vs() });
  let c2 = r2 === "script" || r2 === "skill" ? [ec({ id: e4.id, kind: r2, namespace: "user", skillSlug: r2 === "skill" ? s2 : void 0, title: i2, description: o2 })] : [], l2 = { templateType: r2 === "skill" ? "skills" : r2, userTemplateId: String(e4.id), workspaceId: e4.workspaceId };
  return typeof e4.officialTemplateId == "number" && (l2.officialTemplateId = String(e4.officialTemplateId)), { id: `user-template-${e4.id}`, kind: "template", title: i2, label: i2, description: o2, iconName: "roxy-agent/rx-ic-templates", group: "Templates", isTopped: !!e4.isTopped, toppedAt: e4.toppedAt ?? null, templateId: e4.id, templateSource: "user", payload: l2, template: { prompt: a2, tokens: c2 } };
}
function nc(e4) {
  let t2 = e4.kind === "script" || e4.kind === "skill" ? [ec({ id: e4.id, kind: e4.kind, namespace: "official", skillSlug: e4.kind === "skill" ? Zs(e4) : void 0, title: e4.title, description: e4.description })] : [];
  return { id: `recommended-template-${e4.id}`, kind: "template", title: e4.title, label: e4.title, description: e4.description, iconName: e4.iconName, group: "Templates", isTopped: !!e4.isTopped, toppedAt: e4.toppedAt ?? null, templateId: e4.id, templateSource: "official", payload: { officialTemplateId: String(e4.id), templateType: e4.kind === "skill" ? "skills" : e4.kind }, template: { prompt: e4.kind === "script" ? "" : e4.prompt, tokens: t2 } };
}
function rc(e4, t2) {
  return nc({ id: e4.id, kind: Ks(e4.templateType), metadata: e4.metadata, slug: e4.slug, title: X(e4.name, t2) || e4.slug, description: X(e4.description, t2), iconName: "roxy-agent/rx-ic-templates", prompt: tt(e4, t2), isTopped: e4.isTopped, toppedAt: e4.toppedAt });
}
function ic(e4) {
  if (!e4) return -1 / 0;
  let t2 = Date.parse(e4);
  return Number.isFinite(t2) ? t2 : -1 / 0;
}
function ac(e4) {
  return e4.map((e5, t2) => ({ item: e5, index: t2 })).sort((e5, t2) => {
    let n2 = +!!t2.item.isTopped - +!!e5.item.isTopped;
    if (n2) return n2;
    if (e5.item.isTopped && t2.item.isTopped) {
      let n3 = ic(t2.item.toppedAt) - ic(e5.item.toppedAt);
      if (n3) return n3;
    }
    return e5.index - t2.index;
  }).map((e5) => e5.item);
}
function oc(e4, t2) {
  let n2 = new Set(e4.map((e5) => e5.id)), r2 = new Set(e4.map((e5) => e5.payload.officialTemplateId).filter((e5) => !!e5)), i2 = /* @__PURE__ */ new Map();
  return t2.forEach((e5) => {
    let t3 = e5.payload.officialTemplateId;
    t3 && !i2.has(t3) && i2.set(t3, e5);
  }), ac([...e4.map((e5) => {
    let t3 = e5.payload.officialTemplateId;
    return t3 ? i2.get(t3) ?? e5 : e5;
  }), ...t2.filter((e5) => {
    if (n2.has(e5.id)) return !1;
    let t3 = e5.payload.officialTemplateId;
    return !t3 || !r2.has(t3);
  })]);
}
function sc(e4, t2) {
  return Vn(tc(e4, t2));
}
function cc(e4, t2) {
  return $s(e4) === "script" && fc(e4, t2) || sc(e4, t2);
}
function lc(e4, t2, n2) {
  return t2?.officialTemplateId === e4.id ? cc(t2, n2) : e4.kind === "script" ? dc(e4.title, d("official", e4.id)) : Vn(nc(e4));
}
function uc(e4, t2) {
  return Vn(tc(e4, t2), { includeAuxiliaryPrompt: !1 });
}
function dc(t2, n2) {
  let r2 = t2.trim();
  if (!r2) return "";
  try {
    let t3 = a(n2);
    return $t("\u5728 {profile} \u7A97\u53E3\u4E2D\u8FD0\u884C {script}", { profile: p([]), script: e(r2, t3) });
  } catch {
    return "";
  }
}
function fc(e4, t2) {
  let n2 = uc(e4, t2);
  return n2 ? $t("\u5728 {profile} \u7A97\u53E3\u4E2D\u8FD0\u884C {script}", { profile: p([]), script: n2 }) : "";
}
var pc = 10;
var mc = 100;
function hc(e4) {
  return e4.windowSortNum == null ? e4.dirId || "" : String(e4.windowSortNum);
}
function gc(e4, t2) {
  if (!e4.dirId) return;
  let n2 = Ft(e4), r2 = n2.name || hc(e4), i2 = G(e4.workspaceName || t2), a2 = e4.windowSortNum == null ? "" : i2 ? `${i2}-${e4.windowSortNum}` : String(e4.windowSortNum);
  if (r2) return { id: e4.dirId, kind: "profile", title: r2, label: r2, description: n2.remark, iconName: n2.iconName, isOpen: n2.isOpen, group: "Windows", payload: { dirId: e4.dirId, windowName: n2.name, windowRemark: n2.remark, lastCountry: e4.lastCountry || "", projectId: e4.projectId?.toString() || "", projectName: e4.projectName || "", workspaceName: e4.workspaceName || t2 || "", windowSortNum: e4.windowSortNum?.toString() || "", displayLabel: a2 || n2.name || e4.dirId } };
}
async function _c(e4) {
  let t2 = e4.pageSize ?? pc, n2 = e4.keyword?.trim() ?? "", r2 = await i.window.userGetWindowInfoListList({ page_index: e4.pageIndex, page_size: t2, isDelete: 0, orderName: "createTime", orderType: "desc", ...n2 ? { windowName: n2 } : {}, ...e4.projectId ? { projectIds: e4.projectId } : {} });
  if (r2.code !== 0) throw Error(r2.msg || "Failed to load windows");
  let a2 = r2.data?.rows ?? [], o2 = r2.data?.total ?? a2.length;
  return { rows: a2, total: o2, hasMore: e4.pageIndex * t2 < o2 && a2.length > 0 };
}
function vc(e4, t2, n2) {
  return e4.map((e5) => gc(Nt(e5, t2), n2)).filter((e5) => !!e5);
}
async function yc(e4, t2) {
  let [n2, r2] = await Promise.all([_c(e4), Mt()]);
  return { items: vc(n2.rows, r2, t2), total: n2.total, hasMore: n2.hasMore };
}
async function bc(e4 = "", t2, n2 = "") {
  let r2 = Mt(), i2 = [], a2 = 1, o2 = 0;
  do {
    let t3 = await _c({ pageIndex: a2, pageSize: mc, keyword: e4, projectId: n2 });
    if (i2.push(...t3.rows), o2 = t3.total, !t3.hasMore) break;
    a2 += 1;
  } while (i2.length < o2);
  return vc(i2, await r2, t2);
}
var xc = 200;
var Sc = 250;
var Cc = "__all__";
function wc(e4) {
  let t2 = n(), r2 = s(), a2 = u(), [, o2] = le(), c2 = b([]), l2 = /* @__PURE__ */ new Map(), d2 = b([{ label: $t("\u5168\u90E8\u9879\u76EE"), value: Cc }]), f2 = b(As(r2.currentWorkspace?.id) ?? Cc), p2 = b([]), m2 = b([]), h2 = b(_n()), g2 = re({ profile: !1, slash: !1 }), _2 = T(() => oc(g2.slash ? m2.value : e4.recommendedSlashItems?.value ?? [], p2.value).map((e5) => ({ ...e5, unread: Ec(h2.value, e5) }))), v2 = b(!1), y2 = b(/* @__PURE__ */ new Set()), x2 = b(""), te2 = b(0), S2 = b(!1), ne2 = b(!1), C2 = b(!1), w2 = b(""), E2 = b("page"), D2 = b(!1), O2 = b(), k2 = re({ open: !1, kind: "input", label: "", value: "", nodePos: 0, nodeSize: 0, anchorEl: null }), A2 = 0, j2, M2 = 0, N2, P2, F2 = 0, I2 = !1, L2 = re({ open: !1, loading: !1, kind: "mention", trigger: "@", query: "", activeIndex: 0, items: [] });
  Oe2(), ye2();
  let ie2 = e4.model.value, R2 = Pe({ autofocus: !1, editable: e4.editable?.value ?? !0, content: Dt(ie2).length ? "" : nr(ie2, { profiles: c2.value, slashItems: _2.value }), extensions: [Le.configure({ heading: !1, blockquote: !1, bulletList: !1, orderedList: !1, codeBlock: !1, horizontalRule: !1, link: !1 }), vs, ys, Fe.configure({ HTMLAttributes: { class: "agent-token agent-token--profile" }, renderText({ node: e5 }) {
    return Ln({ id: e5.attrs.id, kind: "profile", title: e5.attrs.label || e5.attrs.id, label: e5.attrs.label || e5.attrs.id, description: e5.attrs.description || "", iconName: e5.attrs.iconName || "base/rx_ic_at", group: "Windows", payload: { dirId: e5.attrs.id } });
  }, renderHTML({ node: e5, options: t3 }) {
    let n2 = e5.attrs.iconName || Cs("profile");
    return ["span", Fc(t3.HTMLAttributes, { "data-agent-token": "profile", "data-id": e5.attrs.id, "data-kind": "profile", "data-description": e5.attrs.description || "", "data-icon-name": e5.attrs.iconName || "base/rx_ic_at" }), ["span", { class: "agent-token__icon" }, ["roxy-svg-icon", { name: n2, fallback: Cs("profile"), size: 16 }]], ["span", { class: "agent-token__label" }, e5.attrs.label || e5.attrs.id], ["span", { "aria-label": "Remove token", contenteditable: "false", "data-agent-token-remove": "", role: "button", class: "agent-token__remove" }, ["roxy-svg-icon", { name: "base/rx_ic_delete", size: 12 }]]];
  }, suggestion: { char: "@", items: async ({ query: e5 }) => (await Oe2(e5), c2.value), command: ({ editor: e5, range: t3, props: n2 }) => {
    Dc(e5, n2, t3);
  }, render: se2("mention") } }), bs({ getItems: async (e5) => (await Me2(), In(_2.value, e5)), command: ({ editor: e5, range: t3, item: n2 }) => Dc(e5, n2, t3), render: se2("slash") })], editorProps: { attributes: { class: "agent-composer-editor", "aria-label": "Roxy AI Agent prompt composer" }, handleKeyDown(t3, n2) {
    return e4.editable?.value === !1 || e4.submitOnEnter === !1 || n2.key !== "Enter" || L2.open || n2.isComposing || n2.keyCode === 229 || n2.shiftKey ? !1 : !n2.altKey && (n2.preventDefault(), e4.onSend(), !0);
  }, handlePaste(t3, n2) {
    if (e4.editable?.value === !1) return !1;
    let r3 = n2.clipboardData?.getData("text/plain") ?? "";
    if (!Nn(r3)) return !1;
    let i2 = kc(r3, { profiles: c2.value, slashItems: _2.value });
    return i2.length ? (n2.preventDefault(), W2(), R2.value?.chain().focus().insertContent(i2).run(), !0) : !1;
  }, handleClickOn(t3, n2, r3, i2, a3, o3) {
    if (e4.editable?.value === !1 || !o3 || r3.type.name !== "mention" && r3.type.name !== "agentToken") return !1;
    let s2 = a3.target;
    return s2?.closest("[data-agent-token-remove]") ? (a3.preventDefault(), a3.stopPropagation(), W2(), jc(t3, i2, r3.nodeSize), !0) : r3.type.name === "agentToken" && (r3.attrs.kind === "input" || r3.attrs.kind === "textarea" || r3.attrs.kind === "url" || r3.attrs.kind === "project") ? (a3.preventDefault(), ue2(r3, i2, s2?.closest(".agent-token, .mention")), !0) : r3.type.name === "agentToken" && r3.attrs.kind !== "profile" ? !1 : (a3.preventDefault(), Ce2(r3, i2), !0);
  }, handleClick(e5, t3, n2) {
    let r3 = n2.target;
    return L2.open && !r3?.closest(".agent-token, .mention") && ce2(), !1;
  } }, onUpdate: ({ editor: t3 }) => {
    let n2 = ir(t3.getJSON());
    e4.model.value !== n2 && (e4.model.value = n2), Se2(t3);
  }, onSelectionUpdate: ({ editor: e5 }) => Se2(e5) }), ae2 = T(() => !!e4.model.value.trim()), B2 = T(() => !e4.model.value.trim());
  z(R2, (t3) => {
    if (!t3) return;
    let n2 = e4.model.value;
    ir(t3.getJSON()) !== n2 && oe2(n2);
  }, { immediate: !0 }), z(() => [e4.model.value, e4.contentKey?.value], ([e5, t3], n2) => {
    if (!R2.value) return;
    let r3 = ir(R2.value.getJSON());
    (t3 !== n2?.[1] || r3 !== e5) && oe2(e5);
  });
  async function oe2(t3) {
    let n2 = ++F2;
    try {
      await Ot(t3, async (e5) => (await Vt(e5, r2.currentWorkspace?.workspaceName)).map((e6) => ({ id: e6.id, label: e6.code || e6.name || e6.id })));
    } catch (e5) {
      console.error("Failed to load Agent composer profile labels:", e5);
      return;
    }
    n2 === F2 && e4.model.value === t3 && R2.value && R2.value.commands.setContent(nr(t3, { profiles: c2.value, slashItems: _2.value }), { emitUpdate: !1 });
  }
  z(() => e4.editable?.value, (e5) => {
    R2.value?.setEditable(e5 !== !1), e5 === !1 && (W2(), G2());
  });
  function se2(e5) {
    return () => ({ onStart: (t3) => {
      L2.activeIndex = 0, V2(t3, e5);
    }, onUpdate: (t3) => V2(t3, e5), onKeyDown: ({ event: e6 }) => L2.open ? e6.key === "ArrowDown" ? (e6.preventDefault(), me2("next"), !0) : e6.key === "ArrowUp" ? (e6.preventDefault(), me2("previous"), !0) : e6.key === "Enter" || e6.key === "Tab" ? (e6.preventDefault(), pe2(L2.items[L2.activeIndex]), !0) : e6.key === "Escape" && (e6.preventDefault(), W2(), !0) : !1, onExit: U2 });
  }
  function V2(e5, t3) {
    let n2 = e5.items ?? [], r3 = t3 === "mention" && (!L2.open || L2.kind !== "mention");
    L2.open = !0, L2.loading = !!e5.loading, L2.kind = t3, L2.trigger = t3 === "mention" ? "@" : "/", L2.query = e5.query ?? "", L2.items = n2, L2.command = e5.command, L2.range = e5.range, L2.activeIndex = Math.min(L2.activeIndex, Math.max(n2.length - 1, 0)), r3 && We2();
  }
  function H2(e5) {
    let t3 = e5.activeId ? e5.items.findIndex((t4) => t4.id === e5.activeId) : -1;
    L2.open = !0, L2.loading = !!e5.loading, L2.kind = e5.kind, L2.trigger = e5.kind === "mention" ? "@" : "/", L2.query = e5.query ?? "", L2.items = e5.items, L2.command = e5.command, L2.range = e5.range, L2.activeIndex = Math.max(t3, 0), e5.kind === "mention" && We2();
  }
  function U2() {
    v2.value && L2.kind === "mention" || W2();
  }
  function W2() {
    _e2(), L2.open = !1, L2.loading = !1, L2.items = [], L2.command = void 0, L2.range = void 0, L2.activeIndex = 0;
  }
  function ce2() {
    let e5 = R2.value;
    if (!e5 || typeof KeyboardEvent > "u") {
      W2();
      return;
    }
    let t3 = new KeyboardEvent("keydown", { key: "Escape", bubbles: !0, cancelable: !0 });
    e5.view.someProp("handleKeyDown", (n2) => n2(e5.view, t3)) || W2();
  }
  function ue2(e5, t3, n2) {
    W2(), k2.open = !0, k2.kind = e5.attrs.kind === "url" ? "url" : e5.attrs.kind === "textarea" ? "textarea" : e5.attrs.kind === "project" ? "project" : "input", k2.label = e5.attrs.title || e5.attrs.label || e5.attrs.id, k2.value = e5.attrs.payload?.value || "", k2.nodePos = t3, k2.nodeSize = e5.nodeSize, k2.anchorEl = n2 ?? null;
  }
  function G2() {
    k2.open = !1, k2.anchorEl = null;
  }
  function de2(e5) {
    let t3 = R2.value;
    if (!t3 || !k2.open) return;
    let n2 = er(t3.getJSON(), k2.label, e5.trim(), k2.kind);
    t3.commands.setContent(n2 ?? t3.getJSON()), t3.view.focus(), k2.open = !1, k2.anchorEl = null;
  }
  function K2(e5) {
    if (L2.kind !== "slash" || !e5.unread) return;
    let t3 = Tc(e5);
    t3 && (h2.value = Cn(t3));
  }
  function fe2(e5, t3, n2) {
    let r3 = e5 === "official" ? m2 : p2;
    r3.value = r3.value.map((e6) => e6.templateId === t3 ? { ...e6, ...n2 } : e6);
  }
  async function q2(n2) {
    let r3 = n2.templateSource, i2 = n2.templateId;
    if (!r3 || !i2 || n2.isTopping || I2) return;
    let a3 = m2.value.slice(), s2 = p2.value.slice(), c3 = !n2.isTopped, l3 = c3 ? (/* @__PURE__ */ new Date()).toISOString() : null;
    I2 = !0, fe2(r3, i2, { isTopped: c3, isTopping: !0, toppedAt: l3 });
    try {
      let n3 = r3 === "official" ? c3 ? await t2.templates.topOfficialTemplate(i2) : await t2.templates.untopOfficialTemplate(i2) : c3 ? await t2.userTemplates.topUserTemplate(i2) : await t2.userTemplates.untopUserTemplate(i2);
      fe2(r3, i2, { isTopped: n3.isTopped, isTopping: !1, toppedAt: n3.isTopped ? n3.toppedAt ?? l3 : null }), r3 === "official" && e4.onOfficialTemplateTopChanged?.();
    } catch (e5) {
      console.error("Failed to update template top state", e5), m2.value = a3, p2.value = s2, o2(-1, e5 instanceof Error ? e5.message : $t("\u6A21\u677F\u7F6E\u9876\u64CD\u4F5C\u5931\u8D25"));
    } finally {
      I2 = !1;
    }
  }
  function pe2(e5) {
    if (!e5 || !L2.command) return;
    K2(e5);
    let t3 = Ms(L2.kind);
    if (t3.multiSelect) {
      Ge2(e5);
      return;
    }
    let n2 = L2.command;
    n2(e5), t3.closeAfterChoose && W2();
  }
  function me2(e5) {
    L2.activeIndex = Ns(L2.activeIndex, L2.items.length, e5);
  }
  async function he2(e5) {
    let t3 = e5 === "@" ? "mention" : "slash", n2 = (e6) => Dc(R2.value, e6);
    if (t3 === "slash" && !g2.slash) {
      if (H2({ kind: t3, items: _2.value, command: n2, loading: !0 }), await Me2(), !L2.open || L2.kind !== t3 || L2.command !== n2) return;
      H2({ kind: t3, items: _2.value, command: n2 });
    } else H2({ kind: t3, items: await we2(t3), command: n2 });
  }
  async function ge2(e5) {
    L2.query = e5, L2.activeIndex = 0, L2.kind === "mention" ? ve2(e5) : L2.items = In(_2.value, e5);
  }
  function _e2() {
    j2 &&= (window.clearTimeout(j2), void 0);
  }
  function ve2(e5) {
    _e2();
    let t3 = e5.trim();
    t3 === x2.value ? L2.items = c2.value : j2 = window.setTimeout(() => {
      j2 = void 0, Oe2(e5, { showSuggestionLoading: !1 }).then(() => {
        L2.open && L2.kind === "mention" && L2.query.trim() === t3 && (L2.items = c2.value);
      });
    }, Sc);
  }
  async function ye2() {
    if (P2) return P2;
    let e5 = (async () => {
      try {
        let e6 = await i.limit.userGetProjectInfoByWorkspaceList({ default: 2 });
        if (e6.code !== 0) throw Error(e6.msg || "Failed to load projects");
        let t3 = /* @__PURE__ */ new Set();
        d2.value = [{ label: $t("\u5168\u90E8\u9879\u76EE"), value: Cc }, ...(e6.data?.rows ?? []).flatMap((e7) => {
          let n2 = e7.project_id?.toString();
          return !n2 || t3.has(n2) ? [] : (t3.add(n2), [{ label: e7.projectName || (e7.projectDefault ? $t("\u9ED8\u8BA4\u9879\u76EE") : n2), value: n2, projectName: e7.projectName?.trim() }]);
        })], d2.value.some((e7) => e7.value === f2.value) || J2(!0);
      } catch (e6) {
        console.error("Failed to load agent projects", e6), d2.value = [{ label: $t("\u5168\u90E8\u9879\u76EE"), value: Cc }], J2(!1);
      }
    })();
    P2 = e5;
    try {
      await e5;
    } finally {
      P2 === e5 && (P2 = void 0);
    }
  }
  function J2(e5) {
    f2.value !== Cc && (f2.value = Cc, e5 && js(r2.currentWorkspace?.id, Cc), xe2());
  }
  async function be2(e5) {
    f2.value = e5, js(r2.currentWorkspace?.id, e5), await xe2();
  }
  async function xe2() {
    _e2(), L2.activeIndex = 0, await Oe2(L2.query, { showSuggestionLoading: !1 }), L2.open && L2.kind === "mention" && (L2.items = c2.value);
  }
  function Y2(t3) {
    e4.editable?.value !== !1 && (t3?.target?.closest(".ProseMirror, button") || R2.value?.chain().focus("end").run());
  }
  function Se2(e5) {
    typeof window < "u" && (M2 && window.cancelAnimationFrame(M2), M2 = window.requestAnimationFrame(() => {
      if (M2 = 0, e5.isDestroyed || !e5.view.hasFocus()) return;
      let t3 = e5.view.dom, n2 = t3.getBoundingClientRect(), r3 = e5.view.coordsAtPos(e5.view.state.selection.head);
      r3.bottom > n2.bottom - 4 ? t3.scrollTop += r3.bottom - n2.bottom + 4 : r3.top < n2.top + 4 && (t3.scrollTop -= n2.top - r3.top + 4);
    }));
  }
  async function Ce2(e5, t3) {
    let n2 = e5.type.name === "mention" || e5.attrs.kind === "profile" ? "mention" : "slash";
    H2({ kind: n2, items: await we2(n2), activeId: e5.attrs.id, range: { from: t3, to: t3 + e5.nodeSize }, command: (n3) => {
      let r3 = R2.value;
      if (!r3) return;
      let { tr: i2 } = r3.view.state, a3 = r3.view.state.schema.nodeFromJSON(tr(n3));
      r3.view.dispatch(i2.replaceWith(t3, t3 + e5.nodeSize, a3)), r3.view.focus();
    } }), n2 === "mention" && (y2.value = Pc(e5));
  }
  async function we2(e5) {
    return e5 === "mention" ? (await Oe2("", { showSuggestionLoading: !1 }), c2.value) : (g2.slash || await Me2(), _2.value);
  }
  function Te2() {
    return f2.value === Cc ? "" : f2.value;
  }
  function Ee2(e5) {
    e5.forEach((e6) => l2.set(e6.id, e6));
  }
  function De2(e5) {
    let t3 = new Map(c2.value.map((e6) => [e6.id, e6]));
    return e5.forEach((e6) => t3.set(e6.id, e6)), Array.from(t3.values());
  }
  async function Oe2(e5 = "", t3 = {}) {
    let n2 = t3.showSuggestionLoading ?? !0, i2 = e5.trim(), a3 = ++A2;
    te2.value = 0, S2.value = !0, C2.value = !0, ne2.value = !1, w2.value = "", E2.value = "page", O2.value = void 0, n2 && (L2.loading = L2.kind === "mention");
    try {
      let e6 = await yc({ pageIndex: 1, keyword: i2, projectId: Te2() }, r2.currentWorkspace?.workspaceName);
      if (a3 !== A2) return;
      c2.value = e6.items, Ee2(e6.items), x2.value = i2, te2.value = 1, S2.value = e6.hasMore, O2.value = e6.hasMore ? void 0 : e6.items, g2.profile = !i2 || g2.profile;
    } catch (e6) {
      if (a3 !== A2) return;
      console.error("Failed to load agent windows", e6), c2.value = [], x2.value = i2, S2.value = !1, w2.value = e6 instanceof Error ? e6.message : $t("\u83B7\u53D6\u7A97\u53E3\u4FE1\u606F\u5931\u8D25"), g2.profile = !i2 || g2.profile;
    } finally {
      a3 === A2 && (C2.value = !1, n2 && (L2.loading = !1));
    }
  }
  async function ke2() {
    if (L2.kind !== "mention" || L2.loading || C2.value || D2.value || ne2.value || !S2.value || L2.query.trim() !== x2.value) return;
    let e5 = A2, t3 = te2.value + 1;
    ne2.value = !0, w2.value = "", E2.value = "page";
    try {
      let n2 = await yc({ pageIndex: t3, keyword: x2.value, projectId: Te2() }, r2.currentWorkspace?.workspaceName);
      if (e5 !== A2) return;
      let i2 = De2(n2.items);
      c2.value = i2, Ee2(n2.items), te2.value = t3, S2.value = n2.hasMore, !O2.value && !n2.hasMore && (O2.value = i2), L2.open && L2.kind === "mention" && (L2.items = i2);
    } catch (t4) {
      if (e5 !== A2) return;
      console.error("Failed to load more agent windows", t4), w2.value = t4 instanceof Error ? t4.message : $t("\u83B7\u53D6\u7A97\u53E3\u4FE1\u606F\u5931\u8D25");
    } finally {
      e5 === A2 && (ne2.value = !1);
    }
  }
  function Ae2() {
    E2.value === "selectAll" ? Ke2() : te2.value === 0 ? Oe2(L2.query, { showSuggestionLoading: !1 }).then(() => {
      L2.open && L2.kind === "mention" && (L2.items = c2.value);
    }) : ke2();
  }
  async function je2() {
    if (C2.value) return;
    if (O2.value) return O2.value;
    let e5 = L2.query.trim();
    e5 !== x2.value && (_e2(), await Oe2(e5, { showSuggestionLoading: !1 }));
    let t3 = A2;
    D2.value = !0, w2.value = "", E2.value = "selectAll";
    try {
      let e6 = await bc(x2.value, r2.currentWorkspace?.workspaceName, Te2());
      return t3 === A2 ? (Ee2(e6), O2.value = e6, e6) : void 0;
    } catch (e6) {
      if (t3 !== A2) return;
      console.error("Failed to load all agent windows", e6), w2.value = e6 instanceof Error ? e6.message : $t("\u83B7\u53D6\u7A97\u53E3\u4FE1\u606F\u5931\u8D25");
      return;
    } finally {
      D2.value = !1;
    }
  }
  async function Me2() {
    if (g2.slash) return;
    if (N2) return N2;
    let e5 = (async () => {
      try {
        if (!Vs()) try {
          Bs((await t2.skillPathInfo()).installedRoot);
        } catch (e6) {
          console.error("Failed to load Skill installed root", e6);
        }
        await Ne2(), g2.slash = !0;
      } catch (e6) {
        console.error("Failed to load templates", e6), m2.value = [], p2.value = [], g2.slash = !0;
      }
    })();
    N2 = e5;
    try {
      await e5;
    } finally {
      N2 === e5 && (N2 = void 0);
    }
  }
  async function Ne2(e5 = {}) {
    let [t3, n2] = await Promise.allSettled([Ie2(), Re2()]);
    t3.status === "fulfilled" ? m2.value = t3.value.map((e6) => rc(e6, a2.currentLocale)) : (console.error("Failed to load official templates", t3.reason), e5.preserveOnFailure || (m2.value = [])), n2.status === "fulfilled" ? p2.value = n2.value.map((e6) => tc(e6)) : (console.error("Failed to load user templates", n2.reason), e5.preserveOnFailure || (p2.value = []));
  }
  async function Ie2() {
    return Rs(rt(await t2.templates.listOfficialTemplates({ limit: Ls, offset: 0 }), "\u52A0\u8F7D\u5B98\u65B9\u6A21\u677F\u5931\u8D25").items);
  }
  async function Re2() {
    let e5 = [], n2 = 0, r3 = 0;
    do {
      let i2 = en(await t2.userTemplates.listUserTemplates({ limit: xc, offset: n2, sortBy: "updated_at", sortOrder: "desc" }), "\u52A0\u8F7D\u7528\u6237\u6A21\u677F\u5931\u8D25");
      if (e5.push(...i2.items), r3 = i2.total, n2 += i2.items.length, i2.items.length === 0) break;
    } while (n2 < r3);
    return e5;
  }
  z(_2, (e5) => {
    if (!L2.open || L2.kind !== "slash") return;
    let t3 = L2.items[L2.activeIndex]?.id, n2 = In(e5, L2.query), r3 = t3 ? n2.findIndex((e6) => e6.id === t3) : -1;
    L2.items = n2, L2.activeIndex = r3 >= 0 ? r3 : Math.min(L2.activeIndex, Math.max(0, n2.length - 1));
  }), ee(() => {
    _e2(), M2 && window.cancelAnimationFrame(M2), R2.value?.destroy();
  });
  let ze2 = T(() => L2.open && L2.kind === "mention" ? y2.value : He2()), Be2 = T(() => ze2.value.size), Ve2 = T(() => {
    if (!O2.value) return !1;
    let e5 = Ue2(O2.value);
    return !!e5.length && e5.every((e6) => y2.value.has(e6));
  });
  function He2() {
    return Fs(e4.model.value, "profile");
  }
  function Ue2(e5 = L2.items) {
    return e5.flatMap(Wn);
  }
  function We2() {
    y2.value = new Set(He2());
  }
  function Ge2(e5) {
    let t3 = new Set(y2.value);
    Wn(e5).forEach((e6) => {
      t3.has(e6) ? t3.delete(e6) : t3.add(e6);
    }), y2.value = t3;
  }
  async function Ke2() {
    if (D2.value) return;
    let e5 = await je2();
    if (!e5) return;
    let t3 = Ue2(e5), n2 = new Set(y2.value), r3 = !!t3.length && t3.every((e6) => n2.has(e6));
    t3.forEach((e6) => {
      r3 ? n2.delete(e6) : n2.add(e6);
    }), y2.value = n2;
  }
  function qe2() {
    We2(), ce2();
  }
  function Je2() {
    let e5 = R2.value;
    if (!e5) return;
    let t3 = Array.from(y2.value).map((e6) => l2.get(e6) ?? c2.value.find((t4) => Wn(t4).includes(e6)) ?? { id: e6, kind: "profile", title: e6, label: e6, description: "", iconName: "roxy-agent/rx-ic-token-profile", group: "Windows", payload: { dirId: e6 } });
    v2.value = !0;
    let n2 = Kn(t3, !!L2.range);
    L2.range && n2 ? Dc(e5, n2, L2.range) : L2.range ? Ac(e5, L2.range) : Mc(e5), !L2.range && n2 && Dc(e5, n2), L2.range = void 0, W2(), window.setTimeout(() => {
      v2.value = !1;
    }, 0);
  }
  return { allMentionItemsSelected: Ve2, cancelMentionSelection: qe2, canSubmit: ae2, chooseItem: pe2, closeSuggestion: W2, confirmMentionSelection: Je2, confirmInputTokenEdit: de2, cancelInputTokenEdit: G2, editor: R2, focusEditor: Y2, inputEditor: k2, isEmpty: B2, markSuggestionItemRead: K2, toggleSuggestionItemTop: q2, navigateSuggestion: me2, profileHasMore: S2, profileLoadError: w2, profileLoadingMore: ne2, profileReloading: C2, profileSelectingAll: D2, projectOptions: d2, loadMoreProfiles: ke2, selectedMentionIds: ze2, selectedProjectId: f2, selectedMentionCount: Be2, retryLoadProfiles: Ae2, selectToolbar: he2, suggestion: L2, toggleAllMentionItems: Ke2, updateSelectedProject: be2, updateSuggestionQuery: ge2 };
}
function Tc(e4) {
  let t2 = Number(e4.payload.userTemplateId), n2 = e4.payload.workspaceId?.trim();
  if (!(!n2 || !Number.isSafeInteger(t2) || t2 <= 0)) return { id: t2, workspaceId: n2 };
}
function Ec(e4, t2) {
  let n2 = Tc(t2);
  return !!(n2 && wn(e4, n2));
}
function Dc(e4, t2, n2) {
  if (!e4) return;
  if (t2.kind === "template") {
    Oc(e4, t2, n2);
    return;
  }
  let r2 = e4.chain().focus(), i2 = Ps(n2 ? e4.state.doc.nodeAt(n2.from) : void 0, n2);
  n2 && r2.deleteRange(n2), r2.insertContent([tr(t2), ...i2 ? [{ type: "text", text: " " }] : []]).run();
}
function Oc(e4, t2, n2) {
  let r2 = Hn(t2);
  if (!r2) return;
  let i2 = nr(r2, { profiles: [], slashItems: t2.template?.tokens ?? [] }).content ?? [], a2 = e4.chain().focus();
  n2 && a2.deleteRange(n2), a2.insertContent([...i2.flatMap((e5, t3) => [...t3 > 0 ? [{ type: "hardBreak" }] : [], ...e5.content ?? []]), { type: "text", text: " " }]).run();
}
function kc(e4, t2) {
  return (nr(e4, t2).content ?? []).flatMap((e5, t3) => [...t3 > 0 ? [{ type: "hardBreak" }] : [], ...e5.content ?? []]);
}
function Ac(e4, t2) {
  t2 && e4.chain().focus().deleteRange(t2).run();
}
function jc(e4, t2, n2) {
  let { doc: r2, tr: i2 } = e4.state, a2 = t2, o2 = t2 + n2, s2 = a2, c2 = o2;
  r2.textBetween(o2, Math.min(o2 + 1, r2.content.size)) === " " ? c2 = o2 + 1 : r2.textBetween(Math.max(a2 - 1, 0), a2) === " " && (s2 = a2 - 1), e4.dispatch(i2.delete(s2, c2)), e4.focus();
}
function Mc(e4) {
  let t2 = [];
  if (e4.state.doc.descendants((e5, n3) => {
    Nc(e5) && t2.push({ from: n3, to: n3 + e5.nodeSize });
  }), !t2.length) return;
  let { tr: n2 } = e4.state;
  t2.reverse().forEach((e5) => {
    n2.delete(e5.from, e5.to);
  }), e4.view.dispatch(n2), e4.view.focus();
}
function Nc(e4) {
  return e4.type.name === "mention" || e4.type.name === "agentToken" && e4.attrs.kind === "profile";
}
function Pc(e4) {
  return e4.type.name === "mention" ? new Set(e4.attrs.id ? [e4.attrs.id] : []) : e4.type.name === "agentToken" && e4.attrs.kind === "profile" ? new Set(Wn(e4.attrs)) : /* @__PURE__ */ new Set();
}
function Fc(...e4) {
  return Object.assign({}, ...e4);
}
function Ic(e4) {
  return `answer:${e4}`;
}
function Lc({ questions: e4, hitlValues: t2, selections: n2 }) {
  return Object.fromEntries(e4.map((e5) => {
    let r2 = t2[Ic(e5.id)], i2 = r2 == null ? "" : String(r2).trim();
    return [e5.id, i2 || n2[e5.id] || ""];
  }));
}
function Rc({ hitlValues: e4, selections: t2, questionId: n2, answer: r2 }) {
  let i2 = r2.trim();
  return { hitlValues: { ...e4, [Ic(n2)]: i2 }, selections: { ...t2, [n2]: i2 } };
}
var zc = ["aria-label"];
var Bc = { class: "hitl-card__header" };
var Vc = { key: 0, class: "hitl-card__clarification-nav" };
var Hc = { class: "hitl-card__clarification-position" };
var Uc = ["title", "aria-label", "disabled"];
var Wc = ["title", "aria-label", "disabled"];
var Gc = { class: "hitl-card__prompt" };
var Kc = { key: 0, class: "hitl-card__subjects" };
var qc = { class: "hitl-card__subject-title" };
var Jc = { key: 0, class: "hitl-card__diff" };
var Yc = { key: 1, class: "hitl-card__clarification" };
var Xc = ["aria-pressed", "disabled", "onClick"];
var Zc = { class: "hitl-card__badge" };
var Qc = { class: "hitl-card__suggestion-copy" };
var $c = { class: "hitl-card__suggestion-title" };
var el = { class: "hitl-card__freeform" };
var tl = { class: "hitl-card__badge hitl-card__badge--edit" };
var nl = ["value", "placeholder", "disabled"];
var rl = ["disabled"];
var il = { key: 2, class: "hitl-card__inputs" };
var al = { key: 0 };
var ol = ["value", "placeholder", "disabled", "onInput"];
var sl = ["value", "placeholder", "disabled", "onInput"];
var cl = { key: 3, class: "hitl-card__actions" };
var ll = ["disabled", "onClick"];
var ul = ["aria-readonly"];
var dl = { class: "composer-editor-area" };
var fl = ["tabindex"];
var pl = ["tabindex"];
var ml = { class: "editor-wrap" };
var hl = { key: 0, class: "composer-placeholder" };
var gl = { key: 2, class: "composer-warning" };
var _l = { key: 3, class: "composer-row" };
var vl = ["aria-busy", "aria-label", "disabled", "title"];
var yl = { key: 0, class: "send-button__pause", "aria-hidden": "true" };
var bl = { key: 1, class: "send-button__spinner", "aria-hidden": "true" };
var xl = { key: 2, xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" };
var Sl = { class: "input-token-popover__label" };
var Cl = ["aria-label"];
var wl = ["aria-selected", "onClick"];
var Tl = { key: 0, class: "input-token-popover__project-empty" };
var El = { key: 0, class: "input-token-popover__protocol" };
var Dl = ["placeholder"];
var Ol = ["placeholder"];
var kl = 30;
var Al = 52;
var jl = K(h({ __name: "ChatComposer", props: y({ autoFocus: { type: Boolean }, contentKey: {}, focusKey: {}, hitlRequest: {}, pendingAttachments: {}, queuedPrompts: {}, placeholder: {}, promptMinHeight: {}, readonly: { type: Boolean }, recommendedTemplateItems: {}, thinking: { type: Boolean }, showGlow: { type: Boolean }, todoProgress: {}, variant: {} }, { modelValue: { required: !0 }, modelModifiers: {} }), emits: y(["addAttachments", "addFolder", "addPathAttachment", "removeAttachment", "removeQueuedPrompt", "reorderQueuedPrompt", "restoreQueuedPrompt", "send", "stop", "submitHitl", "officialTemplateTopChanged"], ["update:modelValue"]), setup(e4, { expose: t2, emit: n2 }) {
  let r2 = e4, i2 = n2, a2 = ie(e4, "modelValue"), o2 = T(() => r2.recommendedTemplateItems ?? []), s2 = T(() => r2.variant === "prompt-field"), c2 = T(() => !r2.readonly), l2 = T(() => r2.placeholder ?? ""), u2 = T(() => s2.value && r2.promptMinHeight ? { "--agent-prompt-field-min-height": r2.promptMinHeight } : void 0), d2 = b(null), f2 = b(null), p2 = b(null), m2 = b(null), h2 = b(!1), g2 = b(!1), v2 = b(null), y2 = b(null), x2 = b(null), C2 = b({}), M2 = b(""), se2 = b("https://"), V2 = b(!1), U2 = b(!1), W2 = b(!1), ce2 = b(""), le2 = re({ left: "0px", top: "0px", transform: "translate(-50%, -100%)", maxWidth: "460px", zIndex: "80" }), ue2 = b("top"), G2 = b(0), K2 = b({}), fe2 = b(0), q2 = b({}), { allMentionItemsSelected: pe2, cancelMentionSelection: me2, canSubmit: he2, chooseItem: ge2, closeSuggestion: _e2, cancelInputTokenEdit: ve2, editor: ye2, focusEditor: J2, confirmMentionSelection: be2, confirmInputTokenEdit: xe2, inputEditor: Y2, isEmpty: Se2, markSuggestionItemRead: Ce2, toggleSuggestionItemTop: we2, navigateSuggestion: Te2, profileHasMore: Ee2, profileLoadError: Oe2, profileLoadingMore: Ae2, profileReloading: je2, profileSelectingAll: Me2, projectOptions: Ne2, loadMoreProfiles: Pe2, selectedMentionCount: Fe2, selectedMentionIds: Ie2, selectedProjectId: Le2, retryLoadProfiles: Re2, selectToolbar: ze2, suggestion: Be2, toggleAllMentionItems: Ve2, updateSelectedProject: He2, updateSuggestionQuery: Ue2 } = wc({ model: a2, editable: c2, contentKey: T(() => r2.contentKey), onSend: xt2, onOfficialTemplateTopChanged: () => i2("officialTemplateTopChanged"), recommendedSlashItems: o2, submitOnEnter: !s2.value }), Ge2 = T(() => {
    let e5 = /* @__PURE__ */ new Set();
    return Ne2.value.flatMap((t3) => {
      let n3 = t3.projectName?.trim() ?? "";
      return t3.value === "__all__" || !n3 || e5.has(n3) ? [] : (e5.add(n3), [{ label: n3, value: n3 }]);
    });
  }), Ke2 = T(() => r2.pendingAttachments.some((e5) => e5.uploadStatus === "uploading")), qe2 = T(() => he2.value || r2.pendingAttachments.length > 0), Je2 = T(() => !!a2.value.trim()), Ye2 = T(() => Je2.value || r2.pendingAttachments.length > 0), Xe2 = T(() => r2.thinking && !Ye2.value), Ze2 = 0, Qe2 = 0, $e2 = 0, et2 = !1, X2, tt2, nt2, rt2 = 0, it2, at2 = /* @__PURE__ */ new Map(), ot2 = () => {
  };
  function st2() {
    r2.autoFocus && !r2.hitlRequest && (typeof window > "u" ? J2() : (Ze2 && window.cancelAnimationFrame(Ze2), Ze2 = window.requestAnimationFrame(() => {
      Ze2 = 0, J2();
    })));
  }
  function ct2(e5) {
    return e5.preview || e5.url || e5.localUrl || e5.fileUrl || e5.remoteUrl || "";
  }
  function lt2(e5) {
    return e5.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || e5;
  }
  function ut2(e5) {
    let t3 = e5[0];
    return t3?.webkitRelativePath?.split("/").filter(Boolean)[0] || t3?.name || $t("\u6587\u4EF6\u5939");
  }
  async function dt2() {
    if (globalThis.isElectron) try {
      let e5 = await globalThis.electronAPI.send("dialog:selectFileOrDirInfo");
      e5?.path && i2("addPathAttachment", { kind: e5.type === "dir" ? "folder" : "file", name: e5.name || lt2(e5.path), path: e5.path });
      return;
    } catch (e5) {
      globalThis.__localUiError?.(e5.message || String(e5));
      return;
    }
    p2.value?.click();
  }
  function ft2(e5) {
    e5.length && !r2.thinking && i2("addAttachments", e5);
  }
  function pt2(e5) {
    if (!globalThis.isElectron) return "";
    try {
      return globalThis.electronAPI.getPathForFile(e5) || "";
    } catch (e6) {
      return console.error("[agent-console] Failed to get pasted file path:", e6), "";
    }
  }
  function mt2(e5) {
    if (!e5.length) return;
    let t3 = e5.map((e6) => e6.file);
    if (!globalThis.isElectron) {
      i2("addAttachments", t3);
      return;
    }
    let { localPathFiles: n3, uploadFiles: r3 } = fs(t3, pt2), a3 = new Map(e5.map((e6) => [e6.file, e6.entry])), o3 = n3.map(({ file: e6, path: t4 }) => {
      let n4 = a3.get(e6) ?? null;
      return ps(e6.name, t4, n4);
    });
    for (let e6 of o3) i2("addPathAttachment", e6);
    r3.length && i2("addAttachments", r3);
  }
  function ht2(e5) {
    G2.value += 1;
    let t3 = G2.value === 1 ? "" : `-${G2.value}`;
    return new File([e5], `pasted-text${t3}.txt`, { lastModified: Date.now(), type: "text/plain" });
  }
  function gt2(e5) {
    let t3 = ds(e5.clipboardData);
    if (s2.value || r2.readonly) return;
    if (t3.length) {
      e5.preventDefault(), e5.stopPropagation(), mt2(t3);
      return;
    }
    let n3 = e5.clipboardData?.getData("text/plain") ?? "";
    _s(n3) && (e5.preventDefault(), e5.stopPropagation(), ft2([ht2(n3)]));
  }
  function _t2(e5) {
    let t3 = e5.target;
    ft2(Array.from(t3?.files ?? [])), t3 && (t3.value = "");
  }
  function vt2(e5) {
    let t3 = e5.target, n3 = Array.from(t3?.files ?? []);
    n3.length > 0 && i2("addFolder", { name: ut2(n3), files: n3 }), t3 && (t3.value = "");
  }
  function yt2(e5) {
    let t3 = Be2.items.findIndex((t4) => t4.id === e5.id);
    t3 >= 0 && (Be2.activeIndex = t3);
  }
  function bt2() {
    Xe2.value ? i2("stop") : qe2.value && xt2();
  }
  function xt2() {
    if (!qe2.value) return;
    let e5 = Pn(a2.value);
    e5.length ? (ce2.value = $t("\u8BF7\u8865\u5145\uFF1A{items}", { items: e5.join("\u3001") }), J2()) : Fn(a2.value).length ? (ce2.value = $t("\u6A21\u677F\u5F15\u7528\u65E0\u6548\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u6A21\u677F"), J2()) : (ce2.value = "", i2("send"));
  }
  function St2(e5) {
    i2("restoreQueuedPrompt", e5), _(J2);
  }
  function Ct2() {
    V2.value = !1;
    let e5 = M2.value;
    if (Y2.kind === "url" && e5.trim()) {
      let t3 = /^https?:\/\//i.test(e5.trim()), n3 = Qn(e5);
      e5 = `${t3 ? n3.protocol : se2.value}${n3.value}`;
    }
    xe2(e5), ce2.value = "";
  }
  function wt2(e5) {
    M2.value = e5, xe2(e5), ce2.value = "";
  }
  function Tt2(e5) {
    let t3 = e5.clipboardData?.getData("text/plain")?.trim();
    if (!t3) return;
    let n3 = Qn(t3);
    se2.value = n3.protocol, M2.value = n3.value, e5.preventDefault();
  }
  function Et2(e5) {
    if (e5.stopPropagation(), !(V2.value || e5.isComposing || e5.keyCode === 229))
      if (e5.key === "Enter") {
        if (Y2.kind === "textarea") {
          (e5.metaKey || e5.ctrlKey) && (e5.preventDefault(), Ct2());
          return;
        }
        e5.preventDefault(), Ct2();
      } else e5.key === "Escape" && (e5.preventDefault(), ve2());
  }
  function Dt2() {
    Y2.open && Y2.anchorEl && (Qe2 && window.cancelAnimationFrame(Qe2), Qe2 = window.requestAnimationFrame(() => {
      Qe2 = 0, Mt2();
    }));
  }
  function Ot2() {
    if (Y2.kind !== "textarea") {
      U2.value = !1, W2.value = !1;
      return;
    }
    let e5 = v2.value;
    if (!(e5 instanceof HTMLTextAreaElement)) return;
    if (W2.value) {
      e5.style.overflowY = "auto", Dt2();
      return;
    }
    if (U2.value) {
      e5.style.height = `${Al}px`, e5.style.overflowY = "auto", Dt2();
      return;
    }
    let t3 = x2.value?.getBoundingClientRect();
    e5.style.height = `${kl}px`;
    let n3 = e5.scrollHeight > 32;
    n3 ? (U2.value = !0, e5.style.height = `${Al}px`, e5.style.overflowY = "auto") : e5.style.overflowY = "hidden", Dt2(), n3 && t3 && _(() => {
      if (U2.value !== n3) return;
      Mt2();
      let e6 = x2.value?.getBoundingClientRect();
      e6 && At2(t3, e6);
    });
  }
  function kt2(e5) {
    if (e5.button !== 0) return;
    let t3 = v2.value;
    if (!(t3 instanceof HTMLTextAreaElement)) return;
    e5.preventDefault(), nt2?.(), t3.focus(), $e2 &&= (window.cancelAnimationFrame($e2), 0), x2.value?.classList.remove("input-token-popover__actions--moving");
    let n3 = e5.pointerId, r3 = e5.clientY, i3 = t3.getBoundingClientRect().height, a3 = Math.max(kl, Math.min(window.innerHeight * 0.4, 320)), o3 = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    let s3 = (e6) => {
      if (e6.pointerId !== n3) return;
      let o4 = Math.min(a3, Math.max(kl, i3 + r3 - e6.clientY)), s4 = o4 > kl;
      W2.value = !0, t3.style.height = `${o4}px`, U2.value = s4, Dt2();
    }, c3 = (e6) => {
      e6 && e6.pointerId !== n3 || (window.removeEventListener("pointermove", s3), window.removeEventListener("pointerup", c3), window.removeEventListener("pointercancel", c3), document.body.style.userSelect = o3, nt2 = void 0);
    };
    nt2 = c3, window.addEventListener("pointermove", s3), window.addEventListener("pointerup", c3), window.addEventListener("pointercancel", c3);
  }
  function At2(e5, t3) {
    let n3 = x2.value;
    if (!n3) return;
    let r3 = e5.left - t3.left, i3 = e5.top - t3.top;
    Math.abs(r3) < 1 && Math.abs(i3) < 1 || ($e2 && window.cancelAnimationFrame($e2), n3.classList.remove("input-token-popover__actions--moving"), n3.style.setProperty("--input-token-actions-from-x", `${r3}px`), n3.style.setProperty("--input-token-actions-from-y", `${i3}px`), $e2 = window.requestAnimationFrame(() => {
      $e2 = 0, n3.classList.add("input-token-popover__actions--moving");
    }));
  }
  function jt2(e5) {
    let t3 = 80, n3 = e5;
    for (; n3; ) {
      let e6 = Number.parseInt(window.getComputedStyle(n3).zIndex, 10);
      if (Number.isFinite(e6) && (t3 = Math.max(t3, e6)), n3 === document.body) break;
      n3 = n3.parentElement;
    }
    return t3 + 1;
  }
  function Mt2() {
    let e5 = Y2.anchorEl;
    if (!Y2.open || !e5) return;
    let t3 = e5.getBoundingClientRect(), n3 = y2.value, r3 = n3?.offsetWidth || 360, i3 = n3?.offsetHeight || 120, a3 = window.innerWidth, o3 = window.innerHeight, s3 = t3.top, c3 = o3 - t3.bottom, l3 = s3 >= i3 + 16 || s3 >= c3 ? "top" : "bottom", u3 = Math.min(Math.max(t3.left + t3.width / 2, r3 / 2 + 12), a3 - r3 / 2 - 12), d3 = l3 === "top" ? t3.top - 8 : t3.bottom + 8;
    le2.left = `${u3}px`, le2.top = `${d3}px`, le2.transform = l3 === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)", le2.maxWidth = `${Math.min(460, a3 - 24)}px`, le2.zIndex = String(jt2(e5)), ue2.value = l3;
  }
  function Nt2(e5) {
    if (!Y2.open) return;
    let t3 = e5.composedPath();
    y2.value && t3.includes(y2.value) || Y2.anchorEl && t3.includes(Y2.anchorEl) || ve2();
  }
  function Pt2(e5) {
    e5.key === "Escape" && ve2();
  }
  function Ft2() {
    et2 || typeof window > "u" || (et2 = !0, document.addEventListener("pointerdown", Nt2, !0), document.addEventListener("keydown", Pt2), window.addEventListener("resize", Dt2), window.addEventListener("scroll", Dt2, !0));
  }
  function It2() {
    et2 && typeof window < "u" && (et2 = !1, document.removeEventListener("pointerdown", Nt2, !0), document.removeEventListener("keydown", Pt2), window.removeEventListener("resize", Dt2), window.removeEventListener("scroll", Dt2, !0));
  }
  function Lt2() {
    Be2.open && (Be2.kind === "mention" ? me2() : _e2());
  }
  function Rt2(e5) {
    if (e5 === "attach") {
      Lt2(), dt2();
      return;
    }
    let t3 = e5 === "@" ? "mention" : "slash";
    Be2.open && Be2.kind === t3 ? Lt2() : ze2(e5);
  }
  let zt2 = T(() => r2.hitlRequest?.controls.filter((e5) => e5.kind === "choice") ?? []), Bt2 = T(() => r2.hitlRequest?.controls.filter((e5) => e5.kind === "text" || e5.kind === "textarea") ?? []), Z2 = T(() => r2.hitlRequest?.status === "submitting"), Vt2 = T(() => {
    let e5 = r2.hitlRequest?.source?.payload;
    return !(!e5 || typeof e5 != "object" || Array.isArray(e5) || e5.requestKind !== "clarification");
  }), Ht2 = T(() => Vt2.value ? r2.hitlRequest?.clarificationQuestions ?? [] : []), Ut2 = T(() => Ht2.value.length > 0), Wt2 = T(() => Ht2.value[fe2.value]), Gt2 = T(() => {
    if (Vt2.value && !Ut2.value) return zt2.value.find((e5) => e5.id === "answer") ?? zt2.value[0];
  }), Kt2 = T(() => {
    if (Vt2.value) return zt2.value.find((e5) => e5.id === "submit");
  }), qt2 = T(() => {
    if (Vt2.value && !Ut2.value) return Bt2.value.find((e5) => e5.id === "answer") ?? Bt2.value[0];
  }), Jt2 = T(() => Wt2.value ? `answer:${Wt2.value.id}` : qt2.value?.id ?? Gt2.value?.id ?? "answer"), Yt2 = T(() => {
    let e5 = Wt2.value;
    return e5 ? e5.options.map((t3, n3) => ({ id: `${e5.id}-option-${n3 + 1}`, label: t3.label, value: t3.label, description: t3.description })) : Gt2.value?.options ?? [];
  }), Xt2 = T(() => !!(Vt2.value && r2.hitlRequest)), Zt2 = T(() => Vt2.value ? [] : zt2.value), Qt2 = T(() => Vt2.value ? [] : Bt2.value), en2 = T(() => Wt2.value ? $t("\u8F93\u5165\u4F60\u7684\u56DE\u7B54\uFF0C\u4E5F\u53EF\u4EE5\u5148\u9009\u62E9\u4E0A\u65B9\u5EFA\u8BAE") : qt2.value?.placeholder ?? $t("\u8F93\u5165\u4F60\u7684\u56DE\u7B54\uFF0C\u4E5F\u53EF\u4EE5\u5148\u9009\u62E9\u4E0A\u65B9\u5EFA\u8BAE")), tn2 = T(() => Wt2.value?.question ?? r2.hitlRequest?.prompt ?? ""), nn2 = T(() => {
    if (!r2.hitlRequest || Z2.value) return !1;
    let e5 = rn2(Jt2.value).trim();
    return Ut2.value ? !0 : !(qt2.value?.required ?? Gt2.value?.required ?? !0) || !!e5;
  });
  function rn2(e5) {
    let t3 = C2.value[e5];
    return t3 == null ? "" : String(t3);
  }
  function an2(e5, t3) {
    C2.value = { ...C2.value, [e5]: t3 };
  }
  function on2(e5, t3) {
    let n3 = t3.target;
    (n3 instanceof HTMLInputElement || n3 instanceof HTMLTextAreaElement) && an2(e5, n3.value);
  }
  function sn2(e5, t3) {
    let n3 = r2.hitlRequest;
    n3 && !Z2.value && i2("submitHitl", { requestId: n3.id, values: { ...C2.value, [e5.id]: t3 }, fullAccess: e5.id === "approval" && e5.options.find((e6) => e6.value === t3)?.id === "full-access" });
  }
  function cn2(e5, t3 = "") {
    return e5 == null ? t3 : String(e5);
  }
  function ln2() {
    return Lc({ questions: Ht2.value, hitlValues: C2.value, selections: q2.value });
  }
  function un2() {
    let e5 = r2.hitlRequest;
    e5 && !Z2.value && i2("submitHitl", { requestId: e5.id, values: { ...C2.value, answer: JSON.stringify(ln2()) } });
  }
  function dn2() {
    fe2.value = Math.max(0, fe2.value - 1);
  }
  function fn2() {
    fe2.value >= Ht2.value.length - 1 ? un2() : fe2.value += 1;
  }
  function pn2(e5) {
    let t3 = Wt2.value;
    if (t3) {
      let n3 = Rc({ hitlValues: C2.value, selections: q2.value, questionId: t3.id, answer: cn2(e5.value, e5.label) });
      C2.value = n3.hitlValues, q2.value = n3.selections, fn2();
    } else Gt2.value && !Z2.value && mn2(cn2(e5.value, e5.label));
  }
  function mn2(e5) {
    let t3 = r2.hitlRequest;
    if (!t3 || Z2.value) return;
    let n3 = Jt2.value, a3 = (e5 ?? rn2(n3)).trim();
    if (Wt2.value) {
      an2(n3, a3), fn2();
      return;
    }
    if (!a3 && !nn2.value) return;
    let o3 = { ...C2.value, answer: a3, [n3]: a3 };
    Kt2.value && (o3[Kt2.value.id] = Kt2.value.options[0]?.value ?? !0), i2("submitHitl", { requestId: t3.id, values: o3 });
  }
  function hn2() {
    let e5 = r2.hitlRequest;
    if (!e5 || Z2.value) return;
    let t3 = Jt2.value, n3 = Wt2.value;
    if (n3) {
      an2(t3, "");
      let { [n3.id]: e6, ...r3 } = q2.value;
      q2.value = r3, fn2();
      return;
    }
    let a3 = { ...C2.value, answer: "", [t3]: "" };
    Kt2.value && (a3[Kt2.value.id] = Kt2.value.options[0]?.value ?? !0), i2("submitHitl", { requestId: e5.id, values: a3 });
  }
  function gn2(e5) {
    e5.key !== "Enter" || e5.shiftKey || e5.metaKey || e5.ctrlKey || e5.altKey || (e5.preventDefault(), mn2());
  }
  function _n2(e5) {
    return Tn2(e5.label).title;
  }
  function vn2(e5) {
    return e5.description ?? Tn2(e5.label).description;
  }
  function yn2(e5) {
    let t3 = Wt2.value;
    return !!(t3 && q2.value[t3.id] === cn2(e5.value, e5.label).trim());
  }
  function bn2(e5) {
    return !!K2.value[e5];
  }
  function xn2() {
    typeof window < "u" && (rt2 && window.cancelAnimationFrame(rt2), rt2 = window.requestAnimationFrame(() => {
      rt2 = 0, wn2();
    }));
  }
  function Sn2() {
    return it2 ||= new ResizeObserver(() => {
      xn2();
    }), it2;
  }
  function Cn2(e5, t3) {
    let n3 = t3 instanceof HTMLElement ? t3 : null, r3 = at2.get(e5);
    if (r3 !== n3)
      if (r3 && it2?.unobserve(r3), !n3) {
        at2.delete(e5);
        let { [e5]: t4, ...n4 } = K2.value;
        K2.value = n4;
      } else at2.set(e5, n3), Sn2().observe(n3), xn2();
  }
  function wn2() {
    let e5 = {};
    at2.forEach((t3, n3) => {
      e5[n3] = t3.scrollWidth > t3.clientWidth + 1;
    }), K2.value = e5;
  }
  function Tn2(e5) {
    let [t3, ...n3] = e5.split(/[:：]/), r3 = n3.join("\uFF1A").trim();
    return r3 ? { title: t3.trim(), description: r3 } : { title: e5, description: "" };
  }
  function En2() {
    let e5 = m2.value;
    if (!e5) {
      h2.value = !1, g2.value = !1;
      return;
    }
    let t3 = Math.abs(e5.scrollLeft);
    h2.value = t3 >= 1, g2.value = e5.scrollWidth - e5.clientWidth - t3 >= 1;
  }
  function Dn2(e5) {
    let t3 = m2.value;
    t3?.scrollTo({ left: t3.scrollLeft + e5 * t3.clientWidth, behavior: "smooth" });
  }
  return z(m2, (e5) => {
    tt2?.disconnect(), tt2 = void 0, e5 && typeof ResizeObserver < "u" && (tt2 = new ResizeObserver(En2), tt2.observe(e5)), _(En2);
  }, { flush: "post" }), z(() => r2.pendingAttachments.length, () => {
    _(En2);
  }, { flush: "post" }), z(() => r2.hitlRequest?.id, () => {
    let e5 = { ...r2.hitlRequest?.values ?? {} };
    for (let t3 of r2.hitlRequest?.controls ?? []) (t3.kind === "text" || t3.kind === "textarea") && e5[t3.id] === void 0 && (e5[t3.id] = t3.defaultValue ?? "");
    C2.value = e5, fe2.value = 0, q2.value = {}, K2.value = {}, _(xn2);
  }, { immediate: !0 }), z(() => Yt2.value.map((e5) => e5.label).join(`
`), () => {
    _(xn2);
  }, { flush: "post" }), z(() => [r2.autoFocus, r2.focusKey, r2.hitlRequest?.id, ye2.value], async ([e5, t3, n3]) => {
    e5 && !n3 && ye2.value && (await _(), st2());
  }, { flush: "post", immediate: !0 }), z(() => [Y2.open, Y2.label, Y2.value, Y2.kind], async ([e5, t3, n3]) => {
    if (!e5) V2.value = !1, U2.value = !1, W2.value = !1, nt2?.(), It2(), X2?.disconnect(), X2 = void 0;
    else {
      if (V2.value = !1, U2.value = Y2.kind === "textarea", W2.value = !1, Y2.kind === "url") {
        let e6 = Qn(n3);
        se2.value = e6.protocol, M2.value = e6.value;
      } else M2.value = n3;
      Ft2(), await _(), typeof ResizeObserver < "u" && y2.value && (X2?.disconnect(), X2 = new ResizeObserver(() => Dt2()), X2.observe(y2.value)), v2.value?.focus(), v2.value?.select(), Ot2(), Dt2();
    }
  }), z(M2, async () => {
    Y2.open && Y2.kind === "textarea" && (await _(), Ot2());
  }), z(a2, (e5) => {
    ce2.value && (Pn(e5).length || (ce2.value = ""));
  }), te(() => {
    ot2 = We(f2.value);
  }), ee(() => {
    Ze2 && window.cancelAnimationFrame(Ze2), Qe2 && window.cancelAnimationFrame(Qe2), rt2 && window.cancelAnimationFrame(rt2), $e2 && window.cancelAnimationFrame($e2), It2(), nt2?.(), X2?.disconnect(), tt2?.disconnect(), it2?.disconnect(), ot2();
  }), t2({ getComposerElement: () => f2.value, getEmptyInputTokenElement: () => f2.value?.querySelector('[data-agent-token="input"].agent-token--input-empty, [data-agent-token="textarea"].agent-token--input-empty') ?? null, getEmptyProfileTokenElement: () => f2.value?.querySelector('[data-agent-token="profile"].agent-token--profile-empty') ?? null, getSelectWindowButtonElement: () => f2.value?.querySelector("[data-agent-select-window]") ?? null, getSelectTemplateButtonElement: () => f2.value?.querySelector("[data-agent-select-template]") ?? null, getShellElement: () => d2.value, focusEditor: J2 }), (t3, n3) => {
    let r3 = de;
    return S(), O("div", { ref_key: "shellRef", ref: d2, class: E(["composer-shell", { "composer-shell--glow": e4.showGlow, "composer-shell--inline": j(s2), "composer-shell--shadow": !e4.showGlow && !j(s2) }]), style: L(j(u2)) }, [!j(s2) && !e4.hitlRequest ? (S(), F(Co, { key: 0, prompts: e4.queuedPrompts ?? [], onRemove: n3[0] ||= (e5) => i2("removeQueuedPrompt", e5), onReorder: n3[1] ||= (e5) => i2("reorderQueuedPrompt", e5), onRestore: St2 }, null, 8, ["prompts"])) : P("", !0), e4.hitlRequest ? (S(), O("div", { key: 1, class: "hitl-card", role: "group", "aria-label": e4.hitlRequest.title }, [D("div", Bc, [D("span", null, A(e4.hitlRequest.title), 1), j(Ut2) ? (S(), O("div", Vc, [D("span", Hc, A(j(fe2) + 1) + " / " + A(j(Ht2).length), 1), D("button", { class: "hitl-card__clarification-nav-button", type: "button", title: t3.$t("\u4E0A\u4E00\u9898"), "aria-label": t3.$t("\u4E0A\u4E00\u9898"), disabled: j(Z2) || j(fe2) === 0, onClick: dn2 }, [B(r3, { name: "base/rx_ic_arrow_left", size: "16", color: "currentColor" })], 8, Uc), D("button", { class: "hitl-card__clarification-nav-button", type: "button", title: j(fe2) === j(Ht2).length - 1 ? t3.$t("\u63D0\u4EA4\u56DE\u7B54") : t3.$t("\u4E0B\u4E00\u9898"), "aria-label": j(fe2) === j(Ht2).length - 1 ? t3.$t("\u63D0\u4EA4\u56DE\u7B54") : t3.$t("\u4E0B\u4E00\u9898"), disabled: j(Z2), onClick: fn2 }, [B(r3, { name: "base/rx_ic_arrow_right_2", size: "16", color: "currentColor" })], 8, Wc)])) : P("", !0)]), D("p", Gc, A(j(tn2)), 1), e4.hitlRequest.subjects.length ? (S(), O("div", Kc, [(S(!0), O(k, null, I(e4.hitlRequest.subjects, (e5) => (S(), O("article", { key: e5.id, class: "hitl-card__subject" }, [D("div", qc, A(e5.title), 1), e5.diff ? (S(), O("pre", Jc, A(e5.diff), 1)) : P("", !0)]))), 128))])) : P("", !0), j(Xt2) ? (S(), O("div", Yc, [(S(!0), O(k, null, I(j(Yt2), (e5, t4) => (S(), O("button", { key: e5.id, class: E(["hitl-card__suggestion", { "hitl-card__suggestion--selected": yn2(e5) }]), type: "button", "aria-pressed": yn2(e5), disabled: j(Z2), onClick: (t5) => pn2(e5) }, [D("span", Zc, A(t4 + 1), 1), D("span", Qc, [D("span", $c, A(_n2(e5)), 1), vn2(e5) ? (S(), F(De, { key: 0, content: vn2(e5), disabled: !bn2(e5.id), placement: "top", "trigger-class": "hitl-card__suggestion-description-wrap" }, { default: N(() => [D("span", { ref_for: !0, ref: (t5) => Cn2(e5.id, t5), class: "hitl-card__suggestion-description" }, A(vn2(e5)), 513)]), _: 2 }, 1032, ["content", "disabled"])) : P("", !0)]), B(r3, { class: "hitl-card__suggestion-arrow", name: "base/rx_ic_arrow_right_2", size: "18", color: "currentColor" })], 10, Xc))), 128)), D("label", el, [D("span", tl, [B(r3, { name: "base/rx_ic_agent_edit", size: "14", color: "currentColor" })]), D("input", { type: "text", value: rn2(j(Jt2)), placeholder: j(en2), disabled: j(Z2), onInput: n3[2] ||= (e5) => on2(j(Jt2), e5), onKeydown: gn2 }, null, 40, nl), D("button", { class: "hitl-card__skip", type: "button", disabled: j(Z2), onClick: hn2 }, A(t3.$t("\u8DF3\u8FC7")), 9, rl)])])) : P("", !0), j(Qt2).length ? (S(), O("div", il, [(S(!0), O(k, null, I(j(Qt2), (e5) => (S(), O("label", { key: e5.id, class: "hitl-card__field" }, [e5.label ? (S(), O("span", al, A(e5.label), 1)) : P("", !0), e5.kind === "textarea" ? (S(), O("textarea", { key: 1, value: rn2(e5.id), placeholder: e5.placeholder, disabled: j(Z2), onInput: (t4) => on2(e5.id, t4) }, null, 40, ol)) : (S(), O("input", { key: 2, type: "text", value: rn2(e5.id), placeholder: e5.placeholder, disabled: j(Z2), onInput: (t4) => on2(e5.id, t4) }, null, 40, sl))]))), 128))])) : P("", !0), j(Zt2).length ? (S(), O("div", cl, [(S(!0), O(k, null, I(j(Zt2), (e5) => (S(), O(k, { key: e5.id }, [(S(!0), O(k, null, I(e5.options, (t4) => (S(), O("button", { key: t4.id, class: E(["hitl-card__button", `hitl-card__button--${t4.variant ?? "secondary"}`]), type: "button", disabled: j(Z2), onClick: (n4) => sn2(e5, t4.value) }, A(t4.label), 11, ll))), 128))], 64))), 128))])) : P("", !0)], 8, zc)) : (S(), O("div", { key: 2, ref_key: "composerShellRef", ref: f2, class: E(["composer", { "composer--prompt-field": j(s2), "composer--readonly": e4.readonly }]), "aria-readonly": e4.readonly || void 0, onClick: n3[5] ||= (...e5) => j(J2) && j(J2)(...e5), onPasteCapture: gt2 }, [j(s2) ? P("", !0) : (S(), O("input", { key: 0, ref_key: "fileInputRef", ref: p2, class: "composer-file-input", type: "file", multiple: "", onChange: _t2 }, null, 544)), j(s2) ? P("", !0) : (S(), O("input", { key: 1, class: "composer-file-input", type: "file", multiple: "", webkitdirectory: "", directory: "", onChange: vt2 }, null, 32)), D("div", dl, [!j(s2) && e4.pendingAttachments.length ? (S(), O("div", { key: 0, class: E(["attachment-strip-wrap", { "attachment-strip-wrap--ping-start": j(h2), "attachment-strip-wrap--ping-end": j(g2) }]) }, [D("div", { ref_key: "attachmentStripRef", ref: m2, class: "attachment-strip", onScroll: En2 }, [(S(!0), O(k, null, I(e4.pendingAttachments, (e5) => (S(), F(Br, { key: e5.fileId, attachment: e5, "preview-url": ct2(e5), removable: "", "remove-label": t3.$t("\u79FB\u9664\u9644\u4EF6"), size: "composer", onRemove: (t4) => i2("removeAttachment", e5.fileId) }, null, 8, ["attachment", "preview-url", "remove-label", "onRemove"]))), 128))], 544), D("button", { type: "button", class: E(["attachment-strip__scroll-button attachment-strip__scroll-button--prev", { "attachment-strip__scroll-button--visible": j(h2) }]), "aria-label": "Scroll attachments left", tabindex: j(h2) ? 0 : -1, onClick: n3[3] ||= H((e5) => Dn2(-1), ["stop"]) }, [B(r3, { name: "base/rx_ic_chevron_left", size: "14", color: "currentColor" })], 10, fl), D("button", { type: "button", class: E(["attachment-strip__scroll-button attachment-strip__scroll-button--next", { "attachment-strip__scroll-button--visible": j(g2) }]), "aria-label": "Scroll attachments right", tabindex: j(g2) ? 0 : -1, onClick: n3[4] ||= H((e5) => Dn2(1), ["stop"]) }, [B(r3, { name: "base/rx_ic_chevron_right", size: "14", color: "currentColor" })], 10, pl)], 2)) : P("", !0), D("div", ml, [j(Se2) ? (S(), O("div", hl, [j(s2) ? (S(), O(k, { key: 0 }, [w(A(j(l2)), 1)], 64)) : (S(), O(k, { key: 1 }, [w(A(t3.$t("\u76F4\u63A5\u5BF9\u6211\u8BF4\u51FA\u60A8\u7684\u9700\u6C42\uFF0C\u8F93\u5165 {at} \u9009\u62E9\u7A97\u53E3\uFF0C/ \u4F7F\u7528\u6A21\u677F", { at: "@" })), 1)], 64))])) : P("", !0), j(ye2) ? (S(), F(j(ke), { key: 1, editor: j(ye2) }, null, 8, ["editor"])) : P("", !0)])]), !j(s2) && j(ce2) ? (S(), O("div", gl, A(j(ce2)), 1)) : P("", !0), j(s2) ? P("", !0) : (S(), O("div", _l, [B(Zr, { onSelect: Rt2 }), B(De, { content: t3.$t("\u505C\u6B62"), placement: "top", disabled: !j(Xe2) }, { default: N(() => [D("button", { class: E(["send-button", { thinking: j(Xe2), loading: j(Ke2) }]), type: "button", "aria-busy": j(Ke2) || void 0, "aria-label": j(Xe2) ? t3.$t("\u505C\u6B62") : j(Ke2) ? t3.$t("\u4E0A\u4F20\u4E2D") : "Send", disabled: !j(Xe2) && !j(qe2), title: j(Xe2) ? void 0 : "Send", onClick: bt2 }, [j(Xe2) ? (S(), O("span", yl)) : j(Ke2) ? (S(), O("span", bl)) : (S(), O("svg", xl, [...n3[15] ||= [D("path", { d: "M7.33332 12.6667V4.49221C6.95089 4.8352 6.52102 5.29457 6.10806 5.7702C5.68411 6.2585 5.29087 6.74911 5.00259 7.11851C4.8588 7.30277 4.7416 7.45619 4.6608 7.56317C4.62041 7.61665 4.58874 7.65864 4.5677 7.68687C4.55723 7.70092 4.54948 7.71173 4.54426 7.71877C4.54165 7.72229 4.53964 7.72491 4.5384 7.72658L4.5371 7.72854L4.49348 7.78127C4.26672 8.03171 3.88276 8.07497 3.60481 7.87046C3.30842 7.65219 3.24476 7.23462 3.46288 6.93817H3.46353V6.93752L3.46418 6.93687C3.46462 6.93627 3.46539 6.93527 3.46614 6.93427C3.46772 6.93213 3.46979 6.92901 3.47265 6.92515C3.47863 6.91708 3.48737 6.90518 3.49869 6.88999C3.52129 6.85967 3.5542 6.81558 3.59635 6.75979C3.68076 6.64802 3.80239 6.48884 3.95116 6.2982C4.24817 5.91761 4.65733 5.40815 5.10155 4.8965C5.54288 4.3882 6.03209 3.86267 6.48892 3.459C6.71652 3.2579 6.9516 3.07257 7.18098 2.93427C7.39214 2.80697 7.68257 2.66669 7.99999 2.66669C8.31741 2.66669 8.60786 2.80698 8.819 2.93427C9.04838 3.07257 9.28347 3.25791 9.51106 3.459C9.96789 3.86266 10.4571 4.38821 10.8984 4.8965C11.3427 5.40815 11.7518 5.91762 12.0488 6.2982C12.1976 6.48884 12.3192 6.64803 12.4036 6.75979C12.4458 6.81558 12.4787 6.85967 12.5013 6.88999C12.5126 6.90517 12.5214 6.91708 12.5273 6.92515C12.5302 6.92901 12.5323 6.93213 12.5338 6.93427C12.5346 6.93528 12.5354 6.93627 12.5358 6.93687L12.5364 6.93752V6.93817H12.5371C12.7552 7.23462 12.6916 7.65218 12.3952 7.87046C12.0987 8.08858 11.6812 8.02492 11.4629 7.72854L11.4616 7.72658C11.4603 7.72491 11.4583 7.7223 11.4557 7.71877C11.4505 7.71173 11.4428 7.70092 11.4323 7.68687C11.4112 7.65864 11.3796 7.61665 11.3392 7.56317C11.2584 7.45619 11.1412 7.30277 10.9974 7.11851C10.7091 6.74911 10.3159 6.2585 9.89192 5.7702C9.47896 5.29458 9.04909 4.8352 8.66666 4.49221V12.6667C8.66666 13.0349 8.36818 13.3334 7.99999 13.3334C7.6318 13.3334 7.33332 13.0349 7.33332 12.6667Z", fill: "white" }, null, -1)]]))], 10, vl)]), _: 1 }, 8, ["content", "disabled"])]))], 42, ul)), B(ls, { anchor: j(f2), "all-selected": j(pe2), "has-more": j(Ee2), "load-error": j(Oe2), "loading-more": j(Ae2), "project-options": j(Ne2), "selected-count": j(Fe2), "selected-ids": j(Ie2), "selected-project-id": j(Le2), "select-all-loading": j(Me2) || j(je2), state: j(Be2), onCancel: j(me2), onChoose: j(ge2), onConfirm: j(be2), onDismiss: Lt2, onHover: yt2, onLoadMore: j(Pe2), onNavigate: j(Te2), onProjectChange: j(He2), onRead: j(Ce2), onRetry: j(Re2), onSearch: j(Ue2), onToggleAll: j(Ve2), onToggleTop: j(we2) }, null, 8, ["anchor", "all-selected", "has-more", "load-error", "loading-more", "project-options", "selected-count", "selected-ids", "selected-project-id", "select-all-loading", "state", "onCancel", "onChoose", "onConfirm", "onLoadMore", "onNavigate", "onProjectChange", "onRead", "onRetry", "onSearch", "onToggleAll", "onToggleTop"]), (S(), F(R, { to: "body" }, [j(Y2).open ? (S(), O("div", { key: 0, ref_key: "inputTokenPopoverRef", ref: y2, class: E(["input-token-popover", `input-token-popover--${j(ue2)}`]), style: L(j(le2)), onClick: n3[14] ||= H(() => {
    }, ["stop"]) }, [D("div", Sl, A(j(Y2).label), 1), j(Y2).kind === "project" ? (S(), O("div", { key: 0, class: "input-token-popover__project-list", role: "listbox", "aria-label": j(Y2).label }, [(S(!0), O(k, null, I(j(Ge2), (e5) => (S(), O("button", { key: e5.value, type: "button", class: E(["input-token-popover__project-option", { "input-token-popover__project-option--selected": e5.value === j(Y2).value }]), role: "option", "aria-selected": e5.value === j(Y2).value, onClick: (t4) => wt2(e5.value) }, A(e5.label), 11, wl))), 128)), j(Ge2).length ? P("", !0) : (S(), O("div", Tl, A(t3.$t("\u6682\u65E0\u9879\u76EE")), 1))], 8, Cl)) : (S(), O("div", { key: 1, class: E(["input-token-popover__row", { "input-token-popover__row--textarea": j(Y2).kind === "textarea", "input-token-popover__row--textarea-multiline": j(Y2).kind === "textarea" && j(U2) }]) }, [D("div", { class: E(["input-token-popover__input", { "input-token-popover__input--url": j(Y2).kind === "url", "input-token-popover__input--textarea": j(Y2).kind === "textarea" }]) }, [j(Y2).kind === "url" ? (S(), O("span", El, A(j(se2)), 1)) : P("", !0), j(Y2).kind === "textarea" ? (S(), O("div", { key: 1, class: "input-token-popover__resize-handle", onPointerdown: H(kt2, ["stop"]) }, null, 32)) : P("", !0), j(Y2).kind === "textarea" ? ae((S(), O("textarea", { key: 2, ref_key: "inputTokenInputRef", ref: v2, "onUpdate:modelValue": n3[6] ||= (e5) => ne(M2) ? M2.value = e5 : null, rows: "1", placeholder: t3.$t("\u8BF7\u8F93\u5165\u5185\u5BB9"), onCompositionend: n3[7] ||= (e5) => V2.value = !1, onCompositionstart: n3[8] ||= (e5) => V2.value = !0, onKeydown: Et2 }, null, 40, Dl)), [[oe, j(M2)]]) : ae((S(), O("input", { key: 3, ref_key: "inputTokenInputRef", ref: v2, "onUpdate:modelValue": n3[9] ||= (e5) => ne(M2) ? M2.value = e5 : null, type: "text", placeholder: j(Y2).kind === "url" ? "example.com" : t3.$t("\u8BF7\u8F93\u5165\u5185\u5BB9"), onCompositionend: n3[10] ||= (e5) => V2.value = !1, onCompositionstart: n3[11] ||= (e5) => V2.value = !0, onKeydown: Et2, onPaste: n3[12] ||= (e5) => j(Y2).kind === "url" && Tt2(e5) }, null, 40, Ol)), [[oe, j(M2)]])], 2), D("div", { ref_key: "inputTokenActionsRef", ref: x2, class: "input-token-popover__actions" }, [D("button", { type: "button", class: "input-token-popover__button", onClick: n3[13] ||= (...e5) => j(ve2) && j(ve2)(...e5) }, A(t3.$t("\u53D6\u6D88")), 1), D("button", { type: "button", class: "input-token-popover__button input-token-popover__button--primary", onClick: Ct2 }, A(t3.$t("\u786E\u5B9A")), 1)], 512)], 2)), n3[16] ||= D("span", { class: "input-token-popover__arrow", "aria-hidden": "true" }, null, -1)], 6)) : P("", !0)]))], 6);
  };
} }), [["__scopeId", "data-v-3c26844e"]]);
var Ml = { class: "ctf-skeleton__types" };
var Nl = { key: 1, class: "ctf-skeleton__content-panel", "aria-hidden": "true" };
var Pl = { class: "ctf-skeleton__source-row" };
var Fl = { class: "ctf-skeleton__details" };
var Il = { class: "ctf-skeleton__details-title" };
var Ll = { key: 0, class: "ctf-skeleton__parameters" };
var Rl = { class: "ctf-skeleton__details-title" };
var zl = { class: "ctf-skeleton__parameter-fields" };
var Bl = { class: "ctf-skeleton__parameter-field" };
var Vl = { class: "ctf-skeleton__parameter-field" };
var Hl = { class: "ctf-skeleton__prompt-label" };
var Ul = K(h({ __name: "CreateTemplateFormSkeleton", props: { templateType: {}, scope: { default: "content" } }, setup(e4) {
  return (t2, n2) => {
    let r2 = he;
    return S(), O(k, null, [e4.scope === "full" ? (S(), O(k, { key: 0 }, [B(Se, { label: t2.$t("\u6A21\u677F\u540D\u79F0") }, { default: N(() => [B(r2, { width: "100%", height: "32px", "border-radius": "10px" })]), _: 1 }, 8, ["label"]), B(Se, { label: t2.$t("\u6A21\u677F\u5185\u5BB9") }, { default: N(() => [D("div", Ml, [(S(), O(k, null, I(3, (e5) => B(r2, { key: e5, width: "100%", height: "32px", "border-radius": "10px" })), 64))])]), _: 1 }, 8, ["label"])], 64)) : P("", !0), e4.templateType === "prompt" ? e4.scope === "full" ? (S(), F(Se, { key: 2, label: t2.$t("\u63D0\u793A\u8BCD\u5185\u5BB9") }, { default: N(() => [B(r2, { width: "100%", height: "176px", "border-radius": "10px" })]), _: 1 }, 8, ["label"])) : P("", !0) : (S(), O("section", Nl, [B(Se, { label: e4.templateType === "script" ? t2.$t("\u9009\u62E9\u811A\u672C") : t2.$t("\u9009\u62E9 Skill") }, { default: N(() => [D("div", Pl, [B(r2, { width: "100%", height: "32px", "border-radius": "10px" }), B(r2, { width: "96px", height: "32px", "border-radius": "10px" })])]), _: 1 }, 8, ["label"]), D("div", Fl, [D("div", Il, [B(r2, { width: "80px", height: "14px", "border-radius": "4px" }), B(r2, { width: "40px", height: "12px", "border-radius": "4px" })]), B(r2, { width: "100%", height: "14px", "border-radius": "4px" }), B(r2, { width: "68%", height: "14px", "border-radius": "4px" })]), e4.templateType === "script" ? (S(), O("div", Ll, [D("div", Rl, [B(r2, { width: "64px", height: "14px", "border-radius": "4px" }), B(r2, { width: "56px", height: "12px", "border-radius": "4px" })]), D("div", zl, [D("div", Bl, [B(r2, { width: "72px", height: "14px", "border-radius": "4px" }), B(r2, { width: "100%", height: "32px", "border-radius": "10px" })]), D("div", Vl, [B(r2, { width: "56px", height: "14px", "border-radius": "4px" }), B(r2, { width: "100%", height: "32px", "border-radius": "10px" })])])])) : (S(), F(Se, { key: 1 }, { label: N(() => [D("div", Hl, [B(r2, { width: "48px", height: "14px", "border-radius": "4px" }), B(r2, { width: "120px", height: "12px", "border-radius": "4px" })])]), default: N(() => [B(r2, { width: "100%", height: "76px", "border-radius": "10px" })]), _: 1 }))]))], 64);
  };
} }), [["__scopeId", "data-v-05ffb12e"]]);
var Wl = { class: "agent-console-dialog__shell upload-script-dialog" };
var Gl = { class: "agent-console-dialog__header" };
var Kl = { class: "agent-console-dialog__title" };
var ql = ["aria-label"];
var Jl = { class: "agent-console-dialog__body upload-script-dialog__body" };
var Yl = { class: "upload-script-dialog__tools" };
var Xl = { class: "upload-script-dialog__form" };
var Zl = { class: "upload-script-dialog__field" };
var Ql = ["value", "placeholder"];
var $l = { class: "upload-script-dialog__field" };
var eu = ["aria-label"];
var tu = { class: "upload-script-dialog__field" };
var nu = ["placeholder"];
var ru = { key: 0, class: "upload-script-dialog__result" };
var iu = { key: 1 };
var au = { key: 1, class: "upload-script-dialog__error", role: "alert" };
var ou = { class: "agent-console-dialog__footer" };
var su = { class: "agent-console-dialog__actions" };
var cu = ["disabled"];
var lu = ["disabled"];
var uu = `import { defineMetadata, defineParams } from '@roxybrowser/sandbox'

defineMetadata({
  name: 'My script',
  description: 'What it does',
  version: '1.0.0',
})

defineParams({
  type: 'object',
  properties: {},
})

export async function main() {
  // Write your automation here.
}
`;
var du = K(h({ __name: "UploadScriptDialog", setup(e4) {
  let t2 = M("dialogRef"), r2 = t2?.value.data ?? {}, i2 = n(), a2 = u(), o2 = b("paste"), s2 = b(""), c2 = b(), l2 = b(), d2 = b(), f2 = b(""), p2 = b(!1), m2 = b(!1), h2 = b(!1), g2 = T(() => X(d2.value?.metadata.name, a2.currentLocale)), _2 = T(() => X(d2.value?.metadata.description, a2.currentLocale)), v2 = 0, y2 = 0;
  function ee2() {
    t2?.value.close();
  }
  function x2(e5) {
    let t3 = e5 instanceof Error ? e5.message : "";
    return t3.includes("\u811A\u672C\u8BED\u6CD5\u89E3\u6790\u5931\u8D25") ? $t("\u811A\u672C\u8BED\u6CD5\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u4EE3\u7801\u8BED\u6CD5") : t3.includes("main(options)") ? $t("\u811A\u672C\u9700\u8981\u5BFC\u51FA main(options) \u51FD\u6570") : t3.includes("defineMetadata") ? $t("\u811A\u672C\u7F3A\u5C11\u6709\u6548\u7684 defineMetadata \u914D\u7F6E") : t3.includes("defineParams") ? $t("\u811A\u672C\u7F3A\u5C11\u6709\u6548\u7684 defineParams \u914D\u7F6E") : t3.includes("\u9759\u6001") || t3.includes("\u6A21\u677F\u5B57\u7B26\u4E32") ? $t("\u81EA\u63CF\u8FF0\u914D\u7F6E\u4EC5\u652F\u6301\u9759\u6001\u5B57\u9762\u91CF") : $t("\u811A\u672C\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u811A\u672C\u683C\u5F0F");
  }
  async function te2(e5) {
    let t3 = ++v2;
    f2.value = "", p2.value = !0;
    try {
      let n2 = await i2.scriptSelfDescription(e5);
      return t3 === v2 ? (d2.value = n2, n2) : void 0;
    } catch (e6) {
      if (t3 !== v2) return;
      d2.value = void 0, f2.value = x2(e6);
      return;
    } finally {
      t3 === v2 && (p2.value = !1);
    }
  }
  async function C2(e5) {
    /\.(?:js|ts)$/i.test(e5.name) ? (c2.value = e5, d2.value = void 0, s2.value = await e5.text(), await te2(s2.value)) : f2.value = $t("\u4EC5\u652F\u6301 .js \u6216 .ts \u811A\u672C\u6587\u4EF6");
  }
  async function w2(e5) {
    let t3 = e5.target, n2 = t3.files?.[0];
    t3.value = "", n2 && await C2(n2);
  }
  function re2(e5) {
    return Array.from(e5.dataTransfer?.types ?? []).includes("Files");
  }
  function k2() {
    y2 = 0, h2.value = !1;
  }
  function N2(e5) {
    re2(e5) && (e5.preventDefault(), y2 += 1, h2.value = !0);
  }
  function I2(e5) {
    re2(e5) && (e5.preventDefault(), e5.dataTransfer && (e5.dataTransfer.dropEffect = "copy"));
  }
  function L2(e5) {
    re2(e5) && (e5.preventDefault(), y2 = Math.max(0, y2 - 1), y2 === 0 && (h2.value = !1));
  }
  async function ie2(e5) {
    e5.preventDefault();
    let t3 = e5.dataTransfer?.files?.[0];
    k2(), t3 && await C2(t3);
  }
  function R2() {
    let e5 = URL.createObjectURL(new Blob([uu], { type: "video/mp2t" })), t3 = document.createElement("a");
    t3.href = e5, t3.download = "roxy-script-template.ts", t3.click(), URL.revokeObjectURL(e5);
  }
  function se2() {
    window.open(a2.getOfficialFaqWebsite("/features/automation-script-development.html"), "_blank");
  }
  async function H2() {
    let e5 = s2.value.trim();
    if (!e5) {
      f2.value = $t("\u8BF7\u8F93\u5165\u6216\u4E0A\u4F20\u811A\u672C\u5185\u5BB9");
      return;
    }
    let t3 = d2.value ?? await te2(e5);
    if (!t3) return;
    if (Qt(t3.metadata.slug)) {
      f2.value = $t("\u811A\u672C slug \u4E0D\u80FD\u4EE5 official- \u5F00\u5934\uFF0C\u8BF7\u4FEE\u6539\u811A\u672C\u4E2D\u7684 defineMetadata.slug \u540E\u91CD\u8BD5");
      return;
    }
    let n2 = o2.value === "file" && c2.value ? c2.value.name : "custom-template.ts", i3 = new File([s2.value], n2, { type: n2.toLowerCase().endsWith(".js") ? "application/javascript" : "video/mp2t", lastModified: c2.value?.lastModified ?? Date.now() });
    m2.value = !0;
    try {
      await r2.onUpload?.(i3, t3) !== !1 && ee2();
    } finally {
      m2.value = !1;
    }
  }
  return z(s2, () => {
    o2.value === "paste" && (v2++, d2.value = void 0, p2.value = !1, f2.value = "");
  }), (e5, t3) => {
    let n2 = de;
    return S(), O("div", Wl, [D("header", Gl, [D("h2", Kl, A(e5.$t("\u4E0A\u4F20\u811A\u672C")), 1), D("button", { class: "agent-console-dialog__close", type: "button", "aria-label": e5.$t("\u5173\u95ED\u4E0A\u4F20\u811A\u672C\u5F39\u7A97"), onClick: ee2 }, null, 8, ql)]), D("main", Jl, [D("div", Yl, [B(J, { variant: "secondary", icon: "roxy-agent/rx-ic-script-doc", label: e5.$t("\u811A\u672C\u5F00\u53D1\u6587\u6863"), onClick: se2 }, null, 8, ["label"]), B(J, { variant: "secondary", icon: "base/rx_ic_download", label: e5.$t("\u4E0B\u8F7D\u811A\u672C\u6A21\u677F"), onClick: R2 }, null, 8, ["label"])]), t3[4] ||= D("div", { class: "upload-script-dialog__divider", "aria-hidden": "true" }, null, -1), D("div", Xl, [D("section", Zl, [D("label", null, A(e5.$t("\u811A\u672C\u540D\u79F0")), 1), D("input", { class: "upload-script-dialog__name-input", value: j(g2), placeholder: e5.$t("\u89E3\u6790\u811A\u672C\u540E\u81EA\u52A8\u586B\u5145"), readonly: "", "aria-readonly": "true" }, null, 8, Ql)]), D("section", $l, [D("label", null, A(e5.$t("\u4E0A\u4F20\u65B9\u5F0F")), 1), D("div", { class: "upload-script-dialog__methods", role: "radiogroup", "aria-label": e5.$t("\u4E0A\u4F20\u65B9\u5F0F") }, [D("label", { class: E({ active: j(o2) === "paste" }) }, [ae(D("input", { "onUpdate:modelValue": t3[0] ||= (e6) => ne(o2) ? o2.value = e6 : null, type: "radio", name: "upload-script-method", value: "paste" }, null, 512), [[V, j(o2)]]), D("span", null, A(e5.$t("\u7C98\u8D34\u4EE3\u7801")), 1)], 2), D("label", { class: E({ active: j(o2) === "file" }) }, [ae(D("input", { "onUpdate:modelValue": t3[1] ||= (e6) => ne(o2) ? o2.value = e6 : null, type: "radio", name: "upload-script-method", value: "file" }, null, 512), [[V, j(o2)]]), D("span", null, A(e5.$t("\u4ECE\u672C\u5730\u8BBE\u5907\u4E0A\u4F20")), 1)], 2)], 8, eu)]), D("section", tu, [D("label", null, A(j(o2) === "paste" ? e5.$t("\u7C98\u8D34\u811A\u672C\u4EE3\u7801") : e5.$t("\u811A\u672C\u6587\u4EF6")), 1), j(o2) === "paste" ? ae((S(), O("textarea", { key: 0, "onUpdate:modelValue": t3[2] ||= (e6) => ne(s2) ? s2.value = e6 : null, class: "upload-script-dialog__editor", placeholder: e5.$t("\u8BF7\u5728\u6B64\u7C98\u8D34\u7B26\u5408\u683C\u5F0F\u8981\u6C42\u7684\u811A\u672C..."), spellcheck: "false" }, null, 8, nu)), [[oe, j(s2)]]) : (S(), O("button", { key: 1, class: E(["upload-script-dialog__dropzone", { "is-dragging": j(h2) }]), type: "button", onClick: t3[3] ||= (e6) => j(l2)?.click(), onDragenter: N2, onDragleave: L2, onDragover: I2, onDrop: ie2 }, [B(n2, { name: "extension/rx_ic_upload", size: "20" }), D("span", null, A(j(c2)?.name || e5.$t("\u9009\u62E9 .js \u6216 .ts \u6587\u4EF6")), 1), D("small", null, A(e5.$t("\u70B9\u51FB\u4E0A\u4F20\u6587\u4EF6\uFF0C\u4E5F\u53EF\u76F4\u63A5\u62D6\u62FD\u4E0A\u4F20")), 1)], 34)), D("input", { ref_key: "fileInput", ref: l2, type: "file", accept: ".js,.ts,application/javascript,text/javascript,application/typescript", hidden: "", onChange: w2 }, null, 544)]), j(d2) ? (S(), O("section", ru, [D("div", null, [D("span", null, A(e5.$t("\u811A\u672C\u63CF\u8FF0")), 1), j(_2) ? (S(), F(go, { key: 0, class: "upload-script-dialog__description", content: j(_2) }, null, 8, ["content"])) : (S(), O("p", iu, A(e5.$t("\u6682\u65E0\u63CF\u8FF0")), 1))]), D("div", null, [D("span", null, A(e5.$t("\u811A\u672C\u53C2\u6570")), 1), D("pre", null, A(JSON.stringify(j(d2).paramsSchema, null, 2)), 1)])])) : P("", !0), j(f2) ? (S(), O("p", au, A(j(f2)), 1)) : P("", !0)])]), D("footer", ou, [D("div", su, [D("button", { class: "agent-console-dialog__button", type: "button", disabled: j(m2) || j(p2), onClick: ee2 }, A(e5.$t("\u53D6\u6D88")), 9, cu), D("button", { class: "agent-console-dialog__button primary", type: "button", disabled: j(m2) || j(p2), onClick: H2 }, A(j(p2) ? e5.$t("\u89E3\u6790\u4E2D...") : j(m2) ? e5.$t("\u4E0A\u4F20\u4E2D...") : e5.$t("\u4E0A\u4F20\u811A\u672C")), 9, lu)])])]);
  };
} }), [["__scopeId", "data-v-ae2d2318"]]);
var fu = { class: "agent-console-dialog__header" };
var pu = { class: "agent-console-dialog__title" };
var mu = ["aria-label"];
var hu = { class: "agent-console-dialog__body create-template-dialog__body" };
var gu = { key: 0, class: "create-template-dialog__loading", role: "status", "aria-busy": "true" };
var _u = { class: "sr-only" };
var vu = { key: 1, class: "create-template-dialog__state", role: "alert" };
var yu = { class: "create-template-dialog__types" };
var bu = ["disabled", "aria-disabled", "aria-pressed", "onClick"];
var xu = { key: 0, class: "create-template-dialog__skill-drop-prompt", "aria-hidden": "true" };
var Su = { class: "create-template-dialog__source-row" };
var Cu = ["disabled"];
var wu = { class: "create-template-dialog__details" };
var Tu = { class: "create-template-dialog__details-title" };
var Eu = { key: 1 };
var Du = { class: "create-template-dialog__parameters-title" };
var Ou = { class: "create-template-dialog__files" };
var ku = { key: 1, class: "create-template-dialog__script-parameters" };
var Au = { class: "create-template-dialog__details-title" };
var ju = { key: 0, class: "create-template-dialog__script-parameters-fields" };
var Mu = { key: 1, class: "create-template-dialog__no-parameters" };
var Nu = { class: "create-template-dialog__label" };
var Pu = { key: 3, class: "create-template-dialog__content-panel" };
var Fu = { key: 0, class: "create-template-dialog__error", role: "alert" };
var Iu = { class: "agent-console-dialog__footer" };
var Lu = { class: "agent-console-dialog__actions" };
var Ru = ["disabled"];
var zu = ["disabled"];
var Bu = ["disabled"];
var Vu = K(h({ __name: "CreateTemplateDialog", setup(e4) {
  let t2 = M("dialogRef"), i2 = t2?.value.data ?? {}, a2 = i2.template, o2 = i2.officialTemplate, s2 = !!(i2.loadDetail && a2), c2 = n(), l2 = fe(), d2 = u(), f2 = b(a2?.kind ?? Me2(o2?.templateType) ?? i2.initialKind ?? "script"), p2 = b(s2 ? "" : a2?.name ?? X(o2?.name, d2.currentLocale) ?? ""), m2 = b(s2 ? "" : a2?.description ?? X(o2?.description, d2.currentLocale) ?? ""), h2 = b(s2 ? "" : typeof a2?.metadata.prompt == "string" ? a2.metadata.prompt : i2.initialPrompt ?? tt(o2, d2.currentLocale)), g2 = b(s2 ? void 0 : a2?.officialTemplateId ?? o2?.id ?? (a2 ? "custom" : void 0)), _2 = b(o2 ? [o2] : []), v2 = b(), y2 = b({}), ee2 = b(), x2 = b(s2 ? {} : a2?.metadata.params && typeof a2.metadata.params == "object" && !Array.isArray(a2.metadata.params) ? { ...a2.metadata.params } : {}), C2 = b({}), re2 = b([]), L2 = b(!1), ie2 = b(!1), R2 = b(""), ae2 = b(!1), oe2 = b(s2), se2 = b(""), V2 = b(!1), H2 = b(!1), U2 = b(!1), W2 = b(""), ce2 = b(), le2 = 0, ue2 = 0, G2 = T(() => !!a2), K2 = T(() => !!i2.readonly), q2 = T(() => G2.value || !!i2.lockSource), pe2 = T(() => ae2.value && !q2.value && !oe2.value), me2 = T(() => !oe2.value && !se2.value), he2 = T(() => [{ value: "script", label: $t("\u811A\u672C"), tooltip: $t("\u66F4\u7A33\u5B9A\u7684\u81EA\u52A8\u5316\u64CD\u4F5C\u65B9\u5F0F\uFF0C\u9002\u5408\u517B\u53F7\u7B49\u6807\u51C6\u5316\u4EFB\u52A1") }, { value: "skill", label: "Skill", tooltip: $t("AI \u6DF1\u5EA6\u53C2\u4E0E\u7684\u81EA\u52A8\u5316\uFF0C\u9002\u5408\u8C03\u7814\u548C\u5206\u6790\u7B49\u4EFB\u52A1") }, { value: "prompt", label: $t("\u63D0\u793A\u8BCD"), tooltip: "" }]), J2 = T(() => [..._2.value.map((e5) => ({ label: X(e5.name, d2.currentLocale) || e5.slug, value: e5.id })), ...v2.value ? [{ label: v2.value.filename, value: "custom" }] : []]), Y2 = T(() => typeof g2.value == "number" ? _2.value.find((e5) => e5.id === g2.value) : void 0), Ce2 = T(() => ee2.value ? ee2.value.metadata : a2 ? a2.metadata : Y2.value?.metadata ?? y2.value), ke2 = T(() => {
    if (typeof g2.value == "number") return J2.value.find((e6) => e6.value === g2.value)?.label || `${$t("\u5B98\u65B9\u6A21\u677F")} #${g2.value}`;
    let e5 = ee2.value ?? a2;
    return (e5 && typeof e5.metadata.filename == "string" ? e5.metadata.filename : "") || $t("\u81EA\u5B9A\u4E49\u4E0A\u4F20");
  }), Ae2 = T(() => !ie2.value || f2.value !== "script" ? "" : p2.value.trim() ? !G2.value && g2.value == null ? $t("\u8BF7\u9009\u62E9\u6216\u4E0A\u4F20\u811A\u672C") : L2.value && re2.value.length ? $t("\u6709 {count} \u4E2A\u811A\u672C\u53C2\u6570\u586B\u5199\u6709\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u6807\u7EA2\u5185\u5BB9\u540E\u91CD\u8BD5\u3002", { count: re2.value.length }) : "" : $t("\u8BF7\u8F93\u5165\u6A21\u677F\u540D\u79F0")), je2 = T(() => W2.value || Ae2.value);
  function Me2(e5) {
    return e5 === "script" || e5 === "skill" || e5 === "prompt" ? e5 : void 0;
  }
  let Ne2 = T(() => {
    if (Y2.value) return X(Y2.value.description, d2.currentLocale);
    if (f2.value === "skill") {
      let e5 = Ce2.value.skillMetadata;
      if (e5 && typeof e5 == "object" && !Array.isArray(e5)) {
        let t3 = e5.description;
        if (typeof t3 == "string") return t3;
      }
    }
    return m2.value;
  }), Pe2 = T(() => {
    try {
      return xe(Ce2.value.optionsSchema);
    } catch {
      return null;
    }
  });
  function Fe2(e5 = x2.value) {
    C2.value = Pe2.value ? be(Pe2.value, e5) : {}, re2.value = [], L2.value = !1, ie2.value = !1, R2.value = "";
  }
  function Ie2(e5) {
    C2.value = ve(e5.data) ? e5.data : {}, re2.value = e5.errors ?? [];
  }
  function Le2(e5) {
    ee2.value = e5, p2.value = e5.name, m2.value = e5.description, h2.value = typeof e5.metadata.prompt == "string" ? e5.metadata.prompt : "", g2.value = e5.officialTemplateId ?? "custom", x2.value = e5.metadata.params && typeof e5.metadata.params == "object" && !Array.isArray(e5.metadata.params) ? { ...e5.metadata.params } : {}, Fe2();
  }
  async function Re2(e5) {
    oe2.value = !0, se2.value = "";
    try {
      let t3 = un(tn(await c2.userTemplates.getUserTemplate({ templateId: e5 }), $t("\u52A0\u8F7D\u6211\u7684\u6A21\u677F\u5931\u8D25")));
      if (!t3) throw Error($t("\u52A0\u8F7D\u6211\u7684\u6A21\u677F\u5931\u8D25"));
      Le2(t3);
    } catch (e6) {
      console.error("Failed to load user template detail", e6), se2.value = e6 instanceof Error ? e6.message : $t("\u52A0\u8F7D\u6211\u7684\u6A21\u677F\u5931\u8D25");
    } finally {
      oe2.value = !1;
    }
  }
  function ze2() {
    a2 && Re2(a2.id);
  }
  async function Be2(e5) {
    if (e5 === "prompt") {
      _2.value = [];
      return;
    }
    let t3 = ++le2;
    ae2.value = !0;
    try {
      let n2 = nt(await c2.templates.listOfficialTemplates({ templateType: e5 }), $t("\u52A0\u8F7D\u5B98\u65B9\u6A21\u677F\u5931\u8D25"));
      t3 === le2 && (_2.value = n2.filter((t4) => t4.templateType === e5));
    } catch (e6) {
      t3 === le2 && (_2.value = [], W2.value = e6 instanceof Error ? e6.message : $t("\u52A0\u8F7D\u5B98\u65B9\u6A21\u677F\u5931\u8D25"));
    } finally {
      t3 === le2 && (ae2.value = !1);
    }
  }
  function Ve2(e5) {
    return q2.value || U2.value || !!i2.lockKind;
  }
  function He2(e5) {
    q2.value || i2.lockKind || U2.value || f2.value === e5 || (f2.value = e5, g2.value = void 0, v2.value = void 0, y2.value = {}, x2.value = {}, m2.value = "", h2.value = "", W2.value = "", Xe2(), Fe2({}), Be2(e5));
  }
  function Ue2() {
    if (G2.value) return;
    let e5 = Y2.value;
    e5 && (p2.value = X(e5.name, d2.currentLocale) || e5.slug, m2.value = X(e5.description, d2.currentLocale), x2.value = {}, Fe2({}), f2.value === "skill" && (h2.value = tt(e5, d2.currentLocale)));
  }
  async function We2(e5, t3) {
    if (W2.value = "", Qt(t3.metadata.slug)) return W2.value = $t("\u811A\u672C slug \u4E0D\u80FD\u4EE5 official- \u5F00\u5934\uFF0C\u8BF7\u4FEE\u6539\u811A\u672C\u4E2D\u7684 defineMetadata.slug \u540E\u91CD\u8BD5"), !1;
    try {
      let n2 = rn(await c2.userTemplates.uploadUserTemplateScript({ file: e5 }), $t("\u4E0A\u4F20\u811A\u672C\u5931\u8D25")), r2 = Zt(t3.metadata.slug);
      return v2.value = n2, y2.value = { fileId: n2.fileId, ossUrl: n2.ossUrl, sha512: n2.sha512, contentType: n2.contentType, fileSize: n2.fileSize, filename: n2.filename, optionsSchema: JSON.stringify(t3.paramsSchema), ...r2 ? { slug: r2 } : {} }, x2.value = {}, g2.value = "custom", p2.value = X(t3.metadata.name, d2.currentLocale) || p2.value, m2.value = t3.metadata.description ? X(t3.metadata.description, d2.currentLocale) : "", Fe2({}), !0;
    } catch (e6) {
      return W2.value = e6 instanceof Error ? e6.message : $t("\u4E0A\u4F20\u811A\u672C\u5931\u8D25"), !1;
    }
  }
  function Ge2() {
    l2.open(du, { props: { modal: !0, blockScroll: !0, dismissableMask: !1, draggable: !1, showHeader: !1, style: { width: "min(540px, calc(100vw - 32px))" }, pt: { root: "agent-console-dialog agent-console-upload-script-dialog", content: "!p-0 !overflow-hidden" } }, data: { onUpload: We2 } });
  }
  async function Ke2(e5) {
    if (!e5.name.toLowerCase().endsWith(".zip")) W2.value = $t("\u4EC5\u652F\u6301 .zip Skill \u5305");
    else {
      V2.value = !0, W2.value = "";
      try {
        let t3 = rn(await c2.userTemplates.uploadUserTemplateSkill({ file: e5 }), $t("\u4E0A\u4F20 Skill \u5931\u8D25")), n2 = Zt(t3.packageSlug);
        v2.value = t3, y2.value = { fileId: t3.fileId, ossUrl: t3.ossUrl, sha512: t3.sha512, contentType: t3.contentType, fileSize: t3.fileSize, filename: t3.filename, ...n2 ? { slug: n2 } : {}, skillMetadata: t3.skillMetadata ?? {}, packageSlug: t3.packageSlug, fileCount: t3.fileCount, files: t3.files, skillMdPath: t3.skillMdPath }, h2.value = "", g2.value = "custom", p2.value = t3.packageName || p2.value, m2.value = t3.packageDescription || "";
      } catch (e6) {
        W2.value = e6 instanceof Error ? e6.message : $t("\u4E0A\u4F20 Skill \u5931\u8D25");
      } finally {
        V2.value = !1;
      }
    }
  }
  async function qe2(e5) {
    let t3 = e5.target, n2 = t3.files?.[0];
    t3.value = "", n2 && await Ke2(n2);
  }
  function Je2(e5) {
    return Array.from(e5.dataTransfer?.types ?? []).includes("Files");
  }
  function Ye2(e5) {
    return f2.value === "skill" && !q2.value && !K2.value && !U2.value && !V2.value && Je2(e5);
  }
  function Xe2() {
    ue2 = 0, H2.value = !1;
  }
  function Ze2(e5) {
    Ye2(e5) && (e5.preventDefault(), ue2 += 1, H2.value = !0);
  }
  function Qe2(e5) {
    Ye2(e5) && (e5.preventDefault(), e5.dataTransfer && (e5.dataTransfer.dropEffect = "copy"));
  }
  function $e2(e5) {
    Je2(e5) && (e5.preventDefault(), ue2 = Math.max(0, ue2 - 1), ue2 === 0 && (H2.value = !1));
  }
  async function et2(e5) {
    if (!Ye2(e5)) return;
    e5.preventDefault();
    let t3 = e5.dataTransfer?.files?.[0];
    Xe2(), t3 && await Ke2(t3);
  }
  async function rt2() {
    await i2.onCancel?.(), t2?.value.close();
  }
  function it2() {
    if (f2.value === "prompt") return { prompt: h2.value.trim() };
    if (f2.value === "skill") {
      let e5 = h2.value.trim();
      return G2.value ? { prompt: e5 } : { ...g2.value === "custom" ? y2.value : {}, prompt: e5 };
    }
    return { ...g2.value === "custom" ? y2.value : {}, params: x2.value };
  }
  function at2(e5) {
    let t3 = xe(Ce2.value.optionsSchema);
    if (!t3) return {};
    if (R2.value) throw new we(R2.value);
    return e5 ? (re2.value = ye(Ee(t3), C2.value, d2.currentLocale), _e(C2.value, re2.value)) : _e(C2.value);
  }
  async function ot2(e5) {
    W2.value = "", f2.value === "script" && (ie2.value = !0);
    let n2 = p2.value.trim();
    if (!n2) f2.value !== "script" && (W2.value = $t("\u8BF7\u8F93\u5165\u6A21\u677F\u540D\u79F0"));
    else if (f2.value === "prompt" && !h2.value.trim()) W2.value = $t("\u8BF7\u8F93\u5165\u63D0\u793A\u8BCD\u5185\u5BB9");
    else {
      if (f2.value === "skill" || f2.value === "prompt") {
        let e6 = r(h2.value);
        if (e6.hasProfileSelection) {
          W2.value = $t("\u6A21\u677F\u63D0\u793A\u8BCD\u4E0D\u80FD\u5305\u542B\u6D4F\u89C8\u5668\u9009\u62E9\uFF0C\u8BF7\u79FB\u9664\u540E\u4FDD\u5B58\u3002\u6D4F\u89C8\u5668\u53EF\u5728\u4F7F\u7528\u6A21\u677F\u65F6\u9009\u62E9\u3002");
          return;
        }
        if (e6.missingInputLabels.length) {
          W2.value = $t("\u8BF7\u586B\u5199\u4EE5\u4E0B\u63D0\u793A\u8BCD\u53C2\u6570\u540E\u518D\u4FDD\u5B58\uFF1A{items}", { items: e6.missingInputLabels.join("\u3001") });
          return;
        }
      }
      if (f2.value !== "prompt" && !G2.value && g2.value == null) f2.value !== "script" && (W2.value = $t("\u8BF7\u9009\u62E9\u6216\u4E0A\u4F20 Skill"));
      else {
        if (f2.value === "script") {
          L2.value = e5;
          try {
            x2.value = at2(e5);
          } catch (e6) {
            if (e6 instanceof we && re2.value.length) return;
            W2.value = e6 instanceof we ? e6.message : $t("\u811A\u672C\u53C2\u6570\u6821\u9A8C\u5931\u8D25");
            return;
          }
        }
        U2.value = !0;
        try {
          await i2.onSave?.({ templateType: f2.value, name: n2, description: m2.value.trim(), metadata: it2(), officialTemplateId: typeof g2.value == "number" ? g2.value : void 0, saveAndRun: e5 }) !== !1 && t2?.value.close();
        } finally {
          U2.value = !1;
        }
      }
    }
  }
  return z(g2, Ue2), te(() => {
    s2 && a2 ? (Re2(a2.id), i2.lockSource || Be2(f2.value)) : (Fe2(), i2.lockSource || Be2(f2.value));
  }), (e5, t3) => {
    let n2 = de;
    return S(), O("div", { class: E(["agent-console-dialog__shell create-template-dialog", { "create-template-dialog--readonly": j(K2) }]) }, [D("header", fu, [D("h2", pu, A(j(K2) ? e5.$t("\u67E5\u770B\u6A21\u677F") : j(G2) ? e5.$t("\u7F16\u8F91\u6A21\u677F") : e5.$t("\u521B\u5EFA\u6A21\u677F")), 1), D("button", { class: "agent-console-dialog__close", type: "button", "aria-label": e5.$t("\u5173\u95ED\u6A21\u677F\u5F39\u7A97"), onClick: rt2 }, null, 8, mu)]), D("main", hu, [j(oe2) ? (S(), O("div", gu, [D("span", _u, A(e5.$t("\u52A0\u8F7D\u4E2D...")), 1), B(Ul, { "template-type": j(f2), scope: "full" }, null, 8, ["template-type"])])) : j(se2) ? (S(), O("div", vu, [B(n2, { name: "roxy-agent/rx-ic-templates", size: "32" }), D("strong", null, A(e5.$t("\u52A0\u8F7D\u6211\u7684\u6A21\u677F\u5931\u8D25")), 1), D("span", null, A(j(se2)), 1), D("button", { class: "create-template-dialog__retry", type: "button", onClick: ze2 }, A(e5.$t("\u91CD\u8BD5")), 1)])) : (S(), O(k, { key: 2 }, [B(Se, { label: e5.$t("\u6A21\u677F\u540D\u79F0") }, { default: N(() => [B(Oe, { modelValue: j(p2), "onUpdate:modelValue": t3[0] ||= (e6) => ne(p2) ? p2.value = e6 : null, type: "text", placeholder: e5.$t("\u8BF7\u8F93\u5165\u6A21\u677F\u540D\u79F0"), disabled: j(K2) || j(U2) }, null, 8, ["modelValue", "placeholder", "disabled"])]), _: 1 }, 8, ["label"]), j(K2) ? P("", !0) : (S(), F(Se, { key: 0, label: e5.$t("\u6A21\u677F\u5185\u5BB9") }, { default: N(() => [D("div", yu, [(S(!0), O(k, null, I(j(he2), (e6) => (S(), F(De, { key: e6.value, content: e6.tooltip, disabled: !e6.tooltip || j(q2) || j(i2).lockKind || j(U2), "show-delay": 500, placement: "top", "z-index": 1300, "trigger-class": "create-template-dialog__type-tooltip" }, { default: N(() => [D("button", { type: "button", class: E({ active: j(f2) === e6.value }), disabled: Ve2(e6.value), "aria-disabled": Ve2(e6.value), "aria-pressed": j(f2) === e6.value, onClick: (t4) => He2(e6.value) }, [D("span", null, A(e6.label), 1)], 10, bu)]), _: 2 }, 1032, ["content", "disabled"]))), 128))])]), _: 1 }, 8, ["label"])), j(f2) !== "prompt" && j(pe2) ? (S(), F(Ul, { key: 1, "template-type": j(f2), scope: "content" }, null, 8, ["template-type"])) : j(f2) === "prompt" ? (S(), O("section", Pu, [B(Se, { label: e5.$t("\u63D0\u793A\u8BCD\u5185\u5BB9") }, { default: N(() => [B(jl, { modelValue: j(h2), "onUpdate:modelValue": t3[5] ||= (e6) => ne(h2) ? h2.value = e6 : null, class: "create-template-dialog__textarea create-template-dialog__textarea--prompt", variant: "prompt-field", placeholder: e5.$t("\u8BF7\u8F93\u5165\u63D0\u793A\u8BCD\u5185\u5BB9"), "prompt-min-height": "176px", "pending-attachments": [], readonly: j(K2) || j(U2), thinking: !1 }, null, 8, ["modelValue", "placeholder", "readonly"])]), _: 1 }, 8, ["label"])])) : (S(), O("section", { key: 2, class: E(["create-template-dialog__content-panel", { "is-skill-dragging": j(H2) }]), onDragenter: Ze2, onDragleave: $e2, onDragover: Qe2, onDrop: et2 }, [j(H2) ? (S(), O("div", xu, [B(n2, { name: "extension/rx_ic_upload", size: "20" }), D("span", null, A(e5.$t("\u62D6\u62FD\u5230\u6B64\u5904\u4E0A\u4F20 Skill")), 1), D("small", null, A(e5.$t("\u4EC5\u652F\u6301 .zip \u683C\u5F0F\u7684 Skill \u5305")), 1)])) : P("", !0), B(Se, { label: j(f2) === "script" ? e5.$t("\u9009\u62E9\u811A\u672C") : e5.$t("\u9009\u62E9 Skill") }, { default: N(() => [D("div", Su, [j(q2) ? (S(), F(Oe, { key: 0, "model-value": j(ke2), disabled: "" }, null, 8, ["model-value"])) : (S(), F(ge, { key: 1, modelValue: j(g2), "onUpdate:modelValue": t3[1] ||= (e6) => ne(g2) ? g2.value = e6 : null, options: j(J2), placeholder: j(ae2) ? e5.$t("\u6B63\u5728\u52A0\u8F7D\u5B98\u65B9\u6A21\u677F...") : j(f2) === "script" ? e5.$t("\u8BF7\u9009\u62E9\u5B98\u65B9\u811A\u672C\u6A21\u677F") : e5.$t("\u8BF7\u9009\u62E9\u5B98\u65B9 Skill \u6A21\u677F"), loading: j(ae2), disabled: j(U2) || j(ae2) }, null, 8, ["modelValue", "options", "placeholder", "loading", "disabled"])), j(q2) ? P("", !0) : (S(), O("button", { key: 2, class: "create-template-dialog__upload", type: "button", disabled: j(U2) || j(V2), onClick: t3[2] ||= (e6) => j(f2) === "script" ? Ge2() : j(ce2)?.click() }, [B(n2, { name: "extension/rx_ic_upload", size: "16" }), w(" " + A(j(V2) ? e5.$t("\u4E0A\u4F20\u4E2D...") : j(f2) === "script" ? e5.$t("\u4E0A\u4F20\u811A\u672C") : e5.$t("\u4E0A\u4F20 Skill")), 1)], 8, Cu)), D("input", { ref_key: "skillInput", ref: ce2, type: "file", accept: ".zip,application/zip", hidden: "", onChange: qe2 }, null, 544)])]), _: 1 }, 8, ["label"]), D("div", wu, [D("div", Tu, [D("span", null, A(j(f2) === "script" ? e5.$t("\u811A\u672C\u8BE6\u60C5") : e5.$t("Skill \u8BE6\u60C5")), 1), D("small", null, A(e5.$t("\u4EC5\u67E5\u770B")), 1)]), j(f2) === "script" && j(Ne2) ? (S(), F(go, { key: 0, class: "create-template-dialog__description", content: j(Ne2) }, null, 8, ["content"])) : (S(), O("p", Eu, A(j(Ne2) || e5.$t("\u9009\u62E9\u6765\u6E90\u540E\u5C55\u793A\u8BE6\u60C5")), 1)), j(f2) === "skill" && Array.isArray(j(Ce2).files) ? (S(), O(k, { key: 2 }, [D("div", Du, A(e5.$t("\u5305\u542B\u6587\u4EF6")), 1), D("p", Ou, A(j(Ce2).files.join("\u3001")), 1)], 64)) : P("", !0)]), j(f2) === "script" && (j(Y2) || j(v2) || j(G2)) ? (S(), O("section", ku, [D("div", Au, [D("span", null, A(e5.$t("\u811A\u672C\u53C2\u6570")), 1), D("small", null, A(e5.$t("\u6839\u636E\u811A\u672C\u81EA\u52A8\u751F\u6210")), 1)]), j(Pe2) ? (S(), O("div", ju, [B(Te, { schema: j(Pe2), data: j(C2), locale: j(d2).currentLocale, readonly: j(K2) || j(U2), "show-validation-errors": j(L2), onChange: Ie2, onSchemaError: t3[3] ||= (e6) => R2.value = e6 }, null, 8, ["schema", "data", "locale", "readonly", "show-validation-errors"])])) : (S(), O("p", Mu, A(e5.$t("\u6B64\u811A\u672C\u65E0\u9700\u989D\u5916\u53C2\u6570")), 1))])) : P("", !0), j(f2) === "skill" ? (S(), F(Se, { key: 2 }, { label: N(() => [D("label", Nu, [w(A(e5.$t("\u63D0\u793A\u8BCD")) + " ", 1), D("span", null, A(e5.$t("\u9009\u586B\uFF0C\u5C06\u4E0E\u6B64 Skill \u4E00\u8D77\u4F7F\u7528")), 1)])]), default: N(() => [B(jl, { modelValue: j(h2), "onUpdate:modelValue": t3[4] ||= (e6) => ne(h2) ? h2.value = e6 : null, class: "create-template-dialog__textarea", variant: "prompt-field", placeholder: e5.$t("\u8BF7\u8F93\u5165\u4F7F\u7528\u6B64 Skill \u65F6\u7684\u63D0\u793A\u8BCD"), "prompt-min-height": "76px", "pending-attachments": [], readonly: j(K2) || j(U2), thinking: !1 }, null, 8, ["modelValue", "placeholder", "readonly"])]), _: 1 })) : P("", !0)], 34))], 64))]), j(je2) ? (S(), O("p", Fu, A(j(je2)), 1)) : P("", !0), D("footer", Iu, [D("div", Lu, [D("button", { class: "agent-console-dialog__button", type: "button", disabled: j(U2), onClick: rt2 }, A(j(K2) ? e5.$t("\u5173\u95ED") : e5.$t("\u53D6\u6D88")), 9, Ru), !j(K2) && !j(i2).submitMode ? (S(), O("button", { key: 0, class: "agent-console-dialog__button", type: "button", disabled: j(U2) || !j(me2), onClick: t3[6] ||= (e6) => ot2(!1) }, A(j(U2) ? e5.$t("\u4FDD\u5B58\u4E2D...") : e5.$t("\u4EC5\u4FDD\u5B58")), 9, zu)) : P("", !0), j(K2) ? P("", !0) : (S(), O("button", { key: 1, class: "agent-console-dialog__button primary", type: "button", disabled: j(U2) || !j(me2), onClick: t3[7] ||= (e6) => ot2(j(i2).submitMode === "run" || !j(i2).submitMode) }, A(j(U2) ? e5.$t("\u4FDD\u5B58\u4E2D...") : j(i2).submitMode === "save" ? e5.$t("\u6DFB\u52A0\u6A21\u677F") : j(i2).submitMode === "run" ? e5.$t("\u6DFB\u52A0\u5E76\u521B\u5EFA\u4EFB\u52A1") : e5.$t("\u4FDD\u5B58\u5E76\u8FD0\u884C")), 9, Bu))])])], 2);
  };
} }), [["__scopeId", "data-v-c679433c"]]);
export {Ue as $,nn as A,_t as B,on as C,Xt as D,un as E,Bt as F,tt as G,$e as H,jt as I,it as J,Qe as K,bt as L,Jt as M,Vt as N,tn as O,Ht as P,ze as Q,St as R,gn as S,an as T,ot as U,vt as V,X as W,qe as X,Ge as Y,Je as Z,Mn as _,tc as a,Sn as b,Bs as c,Xa as d,Qa as f,hr as g,Br as h,nc as i,ln as j,en as k,cc as l,$a as m,jl as n,Za as p,nt as q,Vs as r,lc as s,Vu as t,go as u,Vn as v,sn as w,xn as x,wn as y,Ct as z};