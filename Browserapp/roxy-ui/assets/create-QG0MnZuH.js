import {o as e} from "./rolldown-runtime-BCiCTKAo.js";
import {h as t,hr as n,vt as r,yt as i} from "./utils-BIWenCnY.js";
import {C as a,Et as o,P as s,St as c,W as l,Y as u,_t as d,b as f,bt as p,d as m,en as h,f as g,h as _,in as v,jt as y,lt as b,m as x,st as S,ut as C,x as w} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {f as T,m as E} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as D} from "./agent-BmSFI9WH.js";
import {b as O} from "./rich-html-link-VdBpR3Cm.js";
import {Z as k} from "./basecomponent-ClhuVxJN.js";
import {t as A} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as j} from "./useconfirm-CV4GTWBW.js";
import {t as M} from "./tooltip-BYYKWrvu.js";
import {n as N} from "./theme-mq6SsndU.js";
import {t as P} from "./rx-button-DyzuUt-V.js";
import {t as F} from "./m-input-select-C8pih1gY.js";
import {t as I} from "./custom-empty-CChX4pJt.js";
import {t as L} from "./rx-tabs-Dp-8mudX.js";
import {t as ee} from "./simplePopup-D6H7ykCr.js";
import {o as te,s as ne,t as R} from "./quick-kroUOSn_.js";
import {t as z} from "./exceljs.min-DfecxsXL.js";
import {l as B,u as V} from "./utils-CnUy4XUk.js";
import {t as re} from "./table-BJcS2I0Z.js";
import {t as H} from "./views-header-CcjwXPjG.js";
import {n as U,t as W} from "./constants-DLlGaEfk.js";
import {n as ie,t as ae} from "./parse-textarea-Dia3ayaD.js";
var oe = { class: "flex-1 overflow-auto flex-col content" };
var G = { class: "grid grid-cols-10 gap-3 w-full mb-[1px]" };
var K = { class: "col-span-6 flex flex-col gap-1" };
var q = { class: "flex items-center justify-between" };
var se = { class: "subtitle" };
var ce = { class: "information" };
var le = { class: "flex justify-end information-actions" };
var ue = { class: "col-span-4 flex flex-col gap-1 relative z-10" };
var de = { class: "subtitle" };
var fe = { class: "relative overflow-hidden flex-1" };
var pe = { class: "rules relative z-10" };
var me = { class: "rules-example" };
var J = { class: "text-blue break-all" };
var he = { class: "rules-help" };
var ge = { class: "rules-help" };
var _e = { class: "flex flex-col flex-1" };
var ve = { class: "flex items-center justify-between pt-6 pb-3 table-toolbar" };
var ye = { class: "subtitle" };
var be = { class: "flex gap-2" };
var xe = ["onClick"];
var Se = ["title"];
var Ce = { class: "flex justify-end gap-3 footer" };
var Y = A(a({ __name: "batch-account", setup(e2) {
  let n2 = O(), a2 = j(), u2 = N(), [p2, x2] = D(), { showSimpleDialog: T2 } = ee(), { invalidateCache: k2 } = i(), A2 = c(""), L2 = c([]), R2 = c([]), z2 = c({ type: "select", name: "platformUrl", props: { placeholder: $t("\u8BF7\u8F93\u5165\u6216\u9009\u62E9\u5E73\u53F0\u7F51\u5740"), optionValue: "value", editable: !0, size: "xxs", getOptions: async () => {
    let { data: { rows: e3 } } = await t.platform.userGetPlatformInfoList({});
    return z2.value._rows = e3, R2.value = te(e3), U2(e3);
  } } });
  S(() => u2.realTheme, () => {
    z2.value.props.options = U2(z2.value._rows);
  });
  let B2 = m(() => {
    let e3 = ne({ platformUrl: String(z2.value.value ?? "") }, R2.value);
    return [{ field: "platformUrl", header: $t("\u5E73\u53F0"), getText: (e4) => e4.platformUrl || "--" }, { field: "platformUserName", header: e3.account, getText: (e4) => e4.platformUserName || "--" }, { field: "platformPassword", header: e3.password, getText: (e4) => e4.platformPassword || "--" }, { field: "platformEfa", header: $t("2FA \u5BC6\u94A5"), getText: (e4) => e4.platformEfa || "--" }, { field: "platformRemarks", header: $t("\u5907\u6CE8"), slot: "remark" }];
  }), H2 = { header: !1, paginator: !1, actions: "quick" };
  function U2(e3) {
    return e3.map((e4) => ({ image: u2.realTheme === "dark" ? e4.platformIconDark : e4.platformIcon, platformIconDark: e4.platformIconDark, platformIcon: e4.platformIcon, label: e4.platformUrl, value: e4.platformUrl }));
  }
  function W2(e3) {
    return [{ key: "delete", label: $t("\u5220\u9664"), icon: "base/rx_ic_bin_1", quick: !0, command: () => {
      L2.value = L2.value.filter((t2) => t2.id !== e3.row?.id);
    } }];
  }
  function Y2() {
    if (!z2.value.value) {
      x2(-1, $t("\u8BF7\u8F93\u5165\u6216\u9009\u62E9\u5E73\u53F0\u7F51\u5740"));
      return;
    }
    let e3 = A2.value.split(`
`).map((e4) => e4.replace(/\s/g, "").replace(/：/g, ":")).filter(Boolean);
    if (!e3.length) {
      x2(-1, $t("\u8BF7\u5148\u8F93\u5165\u8D26\u53F7"));
      return;
    }
    let { platformIcon: t2 = "", platformIconDark: n3 = "" } = z2.value._rows.find((e4) => e4.platformUrl === z2.value.value) || {};
    L2.value = [...new Set(e3)].map((e4, r3) => {
      let { platform: i2, username: a3, password: o2, twoFactor: s2, remark: c2 } = V(e4);
      return { id: r3, platformUrl: i2 || z2.value.value, platformIcon: t2, platformIconDark: n3, platformUserName: a3 ?? "", platformPassword: o2 ?? "", platformEfa: s2 ?? "", platformRemarks: c2 ?? "" };
    });
    let r2 = e3.length - L2.value.length;
    r2 > 0 && p2(0, $t("{count} \u91CD\u590D\u8D26\u53F7\u5DF2\u8FC7\u6EE4\u3002", { count: r2 }));
  }
  function X2(e3) {
    T2({ title: $t("\u4E3A\u6240\u9009\u8D26\u53F7\u6DFB\u52A0\u5907\u6CE8"), inputs: [{ type: "textarea", name: "platformRemarks", value: e3?.platformRemarks, props: { placeholder: $t("\u8BF7\u8F93\u5165\u5907\u6CE8"), rows: 6 } }], onConfirm: async (t2) => {
      e3.platformRemarks = t2.platformRemarks;
    } });
  }
  function Z2() {
    a2.require({ header: $t("\u6E05\u7A7A\u8D26\u53F7"), message: $t("\u60A8\u786E\u8BA4\u6E05\u7A7A\u6240\u6709\u8D26\u53F7\u5417?"), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: () => {
      L2.value = [];
    } });
  }
  async function Q2(e3) {
    let { code: i2, msg: a3 } = await t.platform.userAddPlatformInfoBatchCreate(o(L2.value));
    x2(i2, a3), i2 === 0 && (k2(r.ACCOUNT_LIST), e3 ? (p2(0, a3), A2.value = "", z2.value.value = "", L2.value = []) : n2.replace({ name: "account-list" }));
  }
  return (e3, t2) => {
    let n3 = P, r2 = ie, i2 = I, a3 = M;
    return l(), _("div", oe, [g("div", G, [g("div", K, [g("div", q, [g("div", se, v(e3.$t("\u8D26\u53F7\u4FE1\u606F")), 1), w(F, s({ modelValue: y(z2).value, "onUpdate:modelValue": t2[0] ||= (e4) => y(z2).value = e4, class: "!w-80" }, y(z2).props), null, 16, ["modelValue"])]), g("div", ce, [w(ae, { modelValue: y(A2), "onUpdate:modelValue": t2[1] ||= (e4) => d(A2) ? A2.value = e4 : null, placeholder: e3.$t("\u8BF7\u5728\u6B64\u5904\u8F93\u5165\u8D26\u53F7\u4FE1\u606F") }, null, 8, ["modelValue", "placeholder"]), g("div", le, [w(n3, { outlined: "", severity: "secondary", size: "xxs", label: e3.$t("\u89E3\u6790"), icon: "base/rx_ic_play", onClick: E(Y2, ["stop"]) }, null, 8, ["label"])])])]), g("div", ue, [g("div", de, v(e3.$t("\u5BFC\u5165\u89C4\u5219")), 1), g("div", fe, [g("div", pe, [t2[6] ||= g("div", { class: "rules-example" }, " USERNAME1:PASSWORD1 ", -1), g("div", me, [t2[4] ||= f(" USERNAME2:PASSWORD2", -1), t2[5] ||= g("span", { class: "text-green" }, ":2FA", -1), g("span", J, v(`{${e3.$t("\u5907\u6CE8")}}`), 1)]), t2[7] ||= g("br", null, null, -1), g("div", he, v(e3.$t("1.\u652F\u6301\u5DF2\u6709\u5E73\u53F0\u548C\u5176\u4ED6\u5E73\u53F0\uFF1B\u5BF9\u4E8E\u5176\u4ED6\u5E73\u53F0\uFF0C\u9700\u8981\u624B\u52A8\u8F93\u5165URL\u3002")), 1), g("div", ge, v(e3.$t("2.\u6BCF\u884C\u4E00\u4E2A\u8D26\u53F7\uFF0C\u4E00\u6B21\u6700\u591A\u6DFB\u52A0{count}\u4E2A\u8D26\u53F7\u3002", { count: 500 })), 1)]), w(r2, { class: "z-9" })])])]), g("div", _e, [g("div", ve, [g("div", ye, v(e3.$t("\u5DF2\u89E3\u6790\u8D26\u53F7")), 1), g("div", be, [w(n3, { text: "", severity: "secondary", size: "xxs", icon: "base/rx_ic_bin_1", label: e3.$t("\u6E05\u7A7A\u8D26\u53F7"), disabled: !y(L2)?.length, onClick: E(Z2, ["stop"]) }, null, 8, ["label", "disabled"])])]), w(re, { columns: y(B2), "data-list": y(L2), model: W2, regions: H2, "actions-pinned": !1 }, { empty: b(() => [w(i2, { icon: "rx_illustration_lock.svg", title: e3.$t("\u6682\u672A\u6DFB\u52A0\u8D26\u53F7"), class: "min-h-262px" }, null, 8, ["title"])]), remark: b(({ data: e4 }) => [g("div", { class: "flex items-center gap-1", onClick: E((t3) => X2(e4), ["stop"]) }, [C(w(n3, { class: h(["shrink-0", { "note-light": e4.platformRemarks }]), text: "", severity: "secondary", size: "xxs", icon: e4.platformRemarks ? "base/rx_ic_doc_fill" : "base/rx_ic_doc_add" }, null, 8, ["class", "icon"]), [[a3, { value: e4.platformRemarks, showDelay: 0 }, void 0, { top: !0 }]]), g("div", { title: e4.platformRemarks, class: "min-w-50 whitespace-pre-wrap note-content" }, v(e4.platformRemarks), 9, Se)], 8, xe)]), _: 1 }, 8, ["columns", "data-list"])]), g("div", Ce, [w(n3, { label: e3.$t("\u4FDD\u5B58 & \u7EE7\u7EED\u6DFB\u52A0"), disabled: !y(L2)?.length, severity: "secondary", outlined: "", onClick: t2[2] ||= E((e4) => Q2(!0), ["stop"]) }, null, 8, ["label", "disabled"]), w(n3, { label: e3.$t("\u4FDD\u5B58"), disabled: !y(L2)?.length, onClick: t2[3] ||= E((e4) => Q2(!1), ["stop"]) }, null, 8, ["label", "disabled"])])]);
  };
} }), [["__scopeId", "data-v-b2abcec5"]]);
var X = e(z(), 1);
var Z = { class: "flex flex-col h-full pt-4 px-4 content" };
var Q = { class: "template-import" };
var we = { class: "upload-card__dropzone" };
var Te = { class: "upload-card__text" };
var Ee = { class: "upload-card__title" };
var De = { class: "upload-card__desc" };
var Oe = { key: 0, class: "upload-card__filename" };
var ke = { class: "flex flex-1 items-end" };
var Ae = { class: "w-full flex justify-end gap-3 pt-4 pb-5" };
var je = 5242880;
var $ = 200;
var Me = A(a({ __name: "template-import", setup(e2) {
  let a2 = O(), [s2, d2] = D(), { invalidateCache: f2 } = i(), m2 = Object.freeze({ ...W, ...U }), h2 = p({ status: !1, name: "" }), S2 = c([]), C2 = c(!1);
  async function T2() {
    let e3 = await window.showOpenFilePicker({ types: [{ description: "Account Files", accept: m2 }], excludeAcceptAllOption: !0, multiple: !1 }).then((e4) => e4[0]?.getFile());
    e3 && await j2(e3);
  }
  function E2(e3) {
    e3.preventDefault();
  }
  async function A2(e3) {
    e3.preventDefault();
    let t2 = e3.dataTransfer?.files?.[0];
    t2 && await j2(t2);
  }
  async function j2(e3) {
    if (e3.size > je) {
      d2(-1, $t("\u6587\u4EF6\u5927\u5C0F\u4E0D\u80FD\u8D85\u8FC7 5MB"));
      return;
    }
    let t2 = n(e3.name) === "txt" ? await M2(e3) : await N2(e3);
    t2.length ? t2.length > $ ? d2(-1, $t("\u6700\u591A\u4E00\u6B21\u5BFC\u5165 {count} \u4E2A\u8D26\u53F7", { count: $ })) : (h2.status = !0, h2.name = e3.name, S2.value = t2) : d2(-1, $t("\u672A\u89E3\u6790\u5230\u6709\u6548\u8D26\u53F7\u6570\u636E"));
  }
  async function M2(e3) {
    let n2 = await e3.text(), { data: { rows: r2 } } = await t.platform.userGetPlatformInfoList({}), i2 = r2[0];
    return n2.split(`
`).map((e4) => e4.trim()).filter(Boolean).map((e4) => {
      let t2 = V(e4);
      return { platformIcon: i2?.platformIcon ?? "", platformIconDark: i2?.platformIconDark ?? "", platformUrl: i2?.platformUrl ?? "", platformUserName: t2.username ?? "", platformPassword: t2.password ?? "", platformEfa: t2.twoFactor ?? "", platformRemarks: t2.remark ?? "", platformName: "" };
    });
  }
  async function N2(e3) {
    let t2 = new X.default.Workbook();
    await t2.xlsx.load(await e3.arrayBuffer());
    let n2 = t2.worksheets[0];
    if (!n2) return [];
    let r2 = n2.getRow(1).values, i2 = { [$t("\u5E73\u53F0")]: "platformUrl", platformUrl: "platformUrl", [$t("\u8D26\u53F7")]: "platformUserName", platformUserName: "platformUserName", [$t("\u5BC6\u7801")]: "platformPassword", platformPassword: "platformPassword", "2FA": "platformEfa", platformEfa: "platformEfa", [$t("\u5907\u6CE8")]: "platformRemarks", platformRemarks: "platformRemarks" }, a3 = [];
    return n2.eachRow((e4, t3) => {
      if (t3 === 1) return;
      let n3 = { platformIcon: "", platformIconDark: "", platformName: "" };
      e4.eachCell((e5, t4) => {
        let a4 = r2[t4], o2 = i2[a4];
        o2 && (n3[o2] = B(e5.value));
      }), (n3.platformUrl || n3.platformUserName) && a3.push(n3);
    }), a3;
  }
  async function F2(e3 = !1) {
    if (!S2.value.length) {
      d2(-1, $t("\u8BF7\u5148\u4E0A\u4F20\u8D26\u53F7\u6587\u4EF6"));
      return;
    }
    C2.value = !0;
    let { code: n2, msg: i2 } = await t.platform.userAddPlatformInfoBatchCreate(o(S2.value));
    C2.value = !1, n2 === 0 ? (s2(0, $t("\u5BFC\u5165\u6210\u529F")), f2(r.ACCOUNT_LIST), e3 ? (S2.value = [], h2.status = !1, h2.name = "") : a2.replace({ name: "account-list" })) : d2(n2, i2);
  }
  async function I2() {
    let e3 = new X.default.Workbook(), t2 = e3.addWorksheet("Accounts");
    t2.columns = [{ header: $t("\u5E73\u53F0"), key: "platformUrl", width: 30 }, { header: $t("\u8D26\u53F7"), key: "platformUserName", width: 20 }, { header: $t("\u5BC6\u7801"), key: "platformPassword", width: 20 }, { header: "2FA", key: "platformEfa", width: 20 }, { header: $t("\u5907\u6CE8"), key: "platformRemarks", width: 20 }], t2.addRow({ platformUrl: "https://www.facebook.com/", platformUserName: "example@gmail.com", platformPassword: "password123", platformEfa: "", platformRemarks: "" });
    let n2 = await e3.xlsx.writeBuffer(), r2 = new Blob([n2], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), i2 = document.createElement("a");
    i2.href = URL.createObjectURL(r2), i2.download = "account_import_template.xlsx", i2.click(), URL.revokeObjectURL(i2.href);
  }
  return (e3, t2) => {
    let n2 = k, r2 = P, i2 = u("i18n-t");
    return l(), _("div", Z, [g("div", Q, [g("div", { class: "upload-card", onDragover: E2, onDrop: A2 }, [g("div", we, [w(n2, { name: "base/rx_ic_doc_fill", size: "48", color: "var(--colors-icon-icon-note)" }), g("div", Te, [g("div", Ee, v(e3.$t("\u9009\u62E9\u6587\u4EF6\u5E76\u62D6\u62FD\u5230\u6B64\u5904")), 1), g("div", De, v(e3.$t("\u5728\u6B64\u4E0A\u4F20\u7F16\u8F91\u540E\u7684\u6587\u4EF6\uFF0C\u4EC5\u652F\u6301 .xlsx .txt \u6587\u4EF6\uFF0C\u6700\u5927 5MB\u3002")), 1)]), w(r2, { icon: "base/rx_ic_export", label: y(h2).status ? e3.$t("\u91CD\u65B0\u4E0A\u4F20") : e3.$t("\u4E0A\u4F20\u6587\u4EF6"), outlined: "", severity: "secondary", onClick: T2 }, null, 8, ["label"]), y(h2).status ? (l(), _("div", Oe, v(y(h2).name), 1)) : x("", !0)])], 32), w(i2, { tag: "div", class: "template-tip", keypath: e3.$t("\u70B9\u51FB\u4E0B\u8F7D {link}\u3002\u4E00\u6B21\u6700\u591A\u53EF\u5BFC\u5165 {count} \u4E2A\u8D26\u53F7\u3002", { link: "{link}", count: $ }), scope: "global" }, { link: b(() => [g("span", { class: "template-link", onClick: I2 }, v(e3.$t("\u8D26\u53F7\u5BFC\u5165\u6A21\u677F")), 1)]), _: 1 }, 8, ["keypath"])]), g("div", ke, [g("div", Ae, [w(r2, { severity: "secondary", outlined: "", loading: y(C2), label: e3.$t("\u4FDD\u5B58 & \u7EE7\u7EED\u6DFB\u52A0"), onClick: t2[0] ||= (e4) => F2(!0) }, null, 8, ["loading", "label"]), w(r2, { loading: y(C2), label: e3.$t("\u4FDD\u5B58"), onClick: t2[1] ||= (e4) => F2(!1) }, null, 8, ["loading", "label"])])])]);
  };
} }), [["__scopeId", "data-v-d5818ccc"]]);
var Ne = { class: "flex flex-col h-full w-full overflow-hidden" };
var Pe = { class: "flex-1 flex overflow-hidden" };
var Fe = a({ __name: "index", setup(e2) {
  let n2 = O(), [a2] = D(), { invalidateCache: o2 } = i(), s2 = c([{ title: $t("\u5355\u4E2A\u6DFB\u52A0"), value: "single" }, { title: $t("\u6279\u91CF\u6DFB\u52A0"), value: "batch" }, { title: $t("\u6A21\u677F\u5BFC\u5165"), value: "template" }]), u2 = c("single");
  async function f2(e3) {
    let { code: n3, msg: i2 } = await t.platform.userAddPlatformInfoCreate(e3);
    a2(n3, i2), n3 === 0 && o2(r.ACCOUNT_LIST);
  }
  return (e3, t2) => {
    let r2 = H, i2 = L;
    return l(), _("div", Ne, [w(r2, { "show-back": "", divider: !1, title: e3.$t("\u6DFB\u52A0\u8D26\u53F7") }, null, 8, ["title"]), w(i2, { value: y(u2), "onUpdate:value": t2[0] ||= (e4) => d(u2) ? u2.value = e4 : null, tabs: y(s2) }, null, 8, ["value", "tabs"]), g("div", Pe, [C(w(R, { class: "mx-auto w-128", onConfirm: f2, onClose: t2[1] ||= (e4) => y(n2).replace({ name: "account-list" }) }, null, 512), [[T, y(u2) === "single"]]), C(w(Y, null, null, 512), [[T, y(u2) === "batch"]]), C(w(Me, { class: "mx-auto w-152" }, null, 512), [[T, y(u2) === "template"]])])]);
  };
} });
export {Fe as default};