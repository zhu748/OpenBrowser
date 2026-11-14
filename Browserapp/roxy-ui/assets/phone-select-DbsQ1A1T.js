import {C as e,F as t,L as n,St as r,W as i,_t as a,at as o,f as s,h as c,in as l,jt as u,lt as d,x as f} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as p,p as m} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as h} from "./agent-BmSFI9WH.js";
import {t as g} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as _} from "./rx-button-DyzuUt-V.js";
import {t as v} from "./m-input-text-JVbCgVJP.js";
import {t as y} from "./custom-empty-CChX4pJt.js";
import {t as b} from "./ui-DTZutfuE.js";
import {t as x} from "./id-Bjy_bMW8.js";
import {t as S} from "./actionMessage-f0W4sNUi.js";
import {_ as C} from "./phoneDisplay-DDMDXeMy.js";
import {t as w} from "./ry-table-B9vARMiu.js";
import {i as T,n as E,t as D} from "./relatedPhones-BgFrJS53.js";
var O = { class: "phone-select" };
var k = { class: "phone-select__body" };
var A = { class: "phone-select__table" };
var j = { class: "ellipsis-1" };
var M = { class: "ellipsis-1" };
var N = { class: "phone-select__footer" };
var P = g(e({ __name: "phone-select", props: { proxyId: {} }, emits: ["confirm", "close"], setup(e2, { emit: g2 }) {
  let P2 = e2, F = g2, [I, L] = h(), R = b(), z = o("phoneSelect"), B = r([]), V = r([]), H = r(""), U = r(!1), W = r(!1), G = r([{ title: $t("\u540D\u79F0"), key: "name", slot: "name", style: { minWidth: "160px" } }, { title: $t("ID"), key: "id", style: { minWidth: "100px" } }, { title: $t("\u5206\u7EC4"), key: "group", slot: "group", style: { minWidth: "120px" } }, { title: $t("\u5907\u6CE8"), key: "remark", style: { minWidth: "140px" } }]);
  n(() => {
    K();
  });
  async function K() {
    try {
      let e3 = x(P2.proxyId);
      V.value = e3 ? await D(e3) : [], B.value = [...V.value];
    } catch (e3) {
      console.error("[CloudPhone] preload bound phones failed", e3);
    }
  }
  function q(e3) {
    if (!V.value.length) return;
    let t2 = new Set(V.value.map((e4) => String(e4.id || ""))), n2 = new Set(B.value.map((e4) => String(e4.id || ""))), r2 = [...B.value];
    for (let i2 of e3) {
      let e4 = String(i2.id || "");
      e4 && t2.has(e4) && !n2.has(e4) && (r2.push(i2), n2.add(e4));
    }
    r2.length !== B.value.length && (B.value = r2);
  }
  async function J(e3) {
    let n2 = Number(e3.page_index) || 1, r2 = Number(e3.page_size) || 20, i2 = H.value.trim();
    U.value = !!i2;
    try {
      let { items: e4, total: a2 } = await E({ page: n2, pageSize: r2, ...i2 ? { serialName: i2 } : {} });
      return await t(), q(e4), { data: { rows: e4, total: a2 } };
    } catch (e4) {
      return console.error("[CloudPhone] list phones for proxy bind failed", e4), L(-1, $t("\u52A0\u8F7D\u4E91\u624B\u673A\u5217\u8868\u5931\u8D25")), { data: { rows: [], total: 0 } };
    }
  }
  function Y() {
    z.value?.refresh({}, !0);
  }
  async function X() {
    if (!W.value) {
      W.value = !0;
      try {
        let { ok: e3, errors: t2 } = await T({ proxyId: P2.proxyId, selected: B.value, previouslyBound: V.value });
        if (!e3) {
          R.toast(-1, S(t2[0], $t("\u4EE3\u7406 IP \u7ED1\u5B9A\u5931\u8D25")));
          return;
        }
        R.toast(0, $t("\u4EE3\u7406 IP \u7ED1\u5B9A\u5DF2\u66F4\u65B0")), F("confirm"), F("close");
      } catch (e3) {
        console.error("[CloudPhone] sync proxy bound phones failed", e3), R.toast(-1, $t("\u4EE3\u7406 IP \u7ED1\u5B9A\u5931\u8D25"));
      } finally {
        W.value = !1;
      }
    }
  }
  return (e3, t2) => {
    let n2 = y, r2 = _;
    return i(), c("div", O, [s("div", k, [f(v, { modelValue: u(H), "onUpdate:modelValue": t2[0] ||= (e4) => a(H) ? H.value = e4 : null, size: "sm", "pre-icon": "base/rx_ic_magnify", "field-props": { class: "!w-60 shrink-0" }, placeholder: e3.$t("\u641C\u7D22"), onPreIconClick: Y, onKeyup: m(Y, ["enter"]) }, null, 8, ["modelValue", "placeholder"]), s("div", A, [f(u(w), { ref: "phoneSelect", columns: u(G), "onUpdate:columns": t2[1] ||= (e4) => a(G) ? G.value = e4 : null, selection: u(B), "onUpdate:selection": t2[2] ||= (e4) => a(B) ? B.value = e4 : null, "cache-key": "cloud-phone-proxy-phone-select", "data-key": "id", "selection-mode": "multiple", "clear-selection-on-request": !1, "multiple-operation": !1, "table-request": J, "show-table-header": !1, "show-display": !1, "show-reload": !1, "show-actions": !1, "context-menu": !1, class: "phone-select-table" }, { "table-empty": d(() => [f(n2, { icon: "rx_illustration_filter.svg", title: u(U) ? e3.$t("\u6682\u65E0\u67E5\u8BE2\u7ED3\u679C") : e3.$t("\u6682\u65E0\u4E91\u624B\u673A"), desc: u(U) ? e3.$t("\u5F53\u524D\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u7ED3\u679C\uFF0C\u8BF7\u5C1D\u8BD5\u66F4\u6362\u5176\u4ED6\u7B5B\u9009\u6761\u4EF6\u3002") : void 0 }, null, 8, ["title", "desc"])]), name: d(({ data: e4 }) => [s("span", j, l(u(C)(e4)), 1)]), group: d(({ data: e4 }) => [s("span", M, l(e4.group?.name || "--"), 1)]), _: 1 }, 8, ["columns", "selection"])])]), s("div", N, [f(r2, { size: "md", severity: "secondary", outlined: "", label: e3.$t("\u53D6\u6D88"), onClick: t2[3] ||= p((e4) => F("close"), ["stop"]) }, null, 8, ["label"]), f(r2, { size: "md", loading: u(W), label: e3.$t("\u786E\u8BA4\u5E76\u4FDD\u5B58"), onClick: p(X, ["stop"]) }, null, 8, ["loading", "label"])])]);
  };
} }), [["__scopeId", "data-v-6dc0ed7d"]]);
export {P as default};