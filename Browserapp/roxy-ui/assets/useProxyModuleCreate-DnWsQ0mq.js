import {h as e} from "./utils-BIWenCnY.js";
import {C as t,D as n,W as r,f as i,h as a,in as o,jt as s,m as c,p as l,x as u} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as d} from "./agent-BmSFI9WH.js";
import {b as f} from "./rich-html-link-VdBpR3Cm.js";
import {t as p} from "./proxy-create-mode-BCcLAAf5.js";
import {Z as m} from "./basecomponent-ClhuVxJN.js";
import {t as h} from "./rx-button-DyzuUt-V.js";
import {t as g} from "./useDialog-BC-nc8J-.js";
import {t as _} from "./rx-tag-BIY_xUFU.js";
import {t as v} from "./table-BJcS2I0Z.js";
var y = { class: "duplicate-proxies-modal !w-[960px] flex flex-col gap-6 pa-6 pt-4 rounded-2" };
var b = { class: "duplicate-proxies-modal__header h-9 flex items-center justify-between" };
var x = { class: "text-4 font-600 leading-normal text-[var(--colors-text-text-primary)]" };
var S = { class: "flex flex-col gap-6" };
var C = { class: "text-[var(--colors-text-text-error)] text-14px font-400 leading-14px" };
var w = { class: "flex gap-10px justify-end" };
var T = t({ __name: "duplicate-proxies-modal", props: { title: {}, labels: {}, columns: {}, dataList: {}, isAllExist: { type: Boolean }, okText: {} }, emits: ["close", "cancel", "confirm"], setup(e2, { emit: t2 }) {
  let n2 = t2;
  return (t3, d2) => {
    let f2 = m;
    return r(), a("div", y, [i("div", b, [i("div", x, o(e2.title), 1), u(f2, { class: "cursor-pointer", name: "base/rx_ic_delete", size: "20", color: "var(--colors-icon-icon-secondary)", onClick: d2[0] ||= (e3) => n2("close") })]), i("div", S, [i("p", C, o(e2.labels.duplicateDesc), 1), u(v, { columns: e2.columns, "data-list": e2.dataList, regions: { header: !1, paginator: !1, actions: !1 } }, null, 8, ["columns", "data-list"]), i("div", w, [e2.isAllExist ? c("", !0) : (r(), l(s(h), { key: 0, severity: "secondary", outlined: "", label: t3.$t("\u53D6\u6D88"), onClick: d2[1] ||= (e3) => n2("cancel") }, null, 8, ["label"])), u(s(h), { label: e2.okText, onClick: d2[2] ||= (e3) => n2("confirm") }, null, 8, ["label"])])])]);
  };
} });
function E(e2 = p("proxy")) {
  let t2 = [{ field: "protocol", header: e2.protocolColumnTitle, getText: (e3) => e3.protocol || "--" }, { field: "host", header: e2.host, getText: (e3) => e3.host || "--" }, { field: "port", header: e2.port, getText: (e3) => e3.port || "--" }, { field: "proxyUserName", header: e2.username, getText: (e3) => e3.proxyUserName || "--" }, { field: "proxyPassword", header: e2.password, getText: (e3) => e3.proxyPassword || "--" }], n2 = { field: "riskRating", header: $t("\u98CE\u9669\u8BC4\u7EA7"), slot: "riskRating" }, r2 = [...e2.mode === "device" ? [] : [{ field: "refreshUrl", header: e2.refreshUrl, props: { headerStyle: { width: "100px" } }, getText: (e3) => e3.refreshUrl || "--" }], { field: "remark", header: $t("\u5907\u6CE8"), props: { headerStyle: { width: "100px" } }, getText: (e3) => e3.remark || "--" }, { field: "outbound", header: $t("\u51FA\u53E3 IP"), slot: "outbound" }, { header: $t("IP \u67E5\u8BE2\u6E20\u9053"), field: "ipChecker", render: ({ data: e3 }) => u(_, { icon: "base/rx_ic_network", label: e3.checkChannelValue, disabled: !0 }, null) }];
  return e2.mode === "device" ? [...t2, n2, ...r2] : [...t2, ...r2];
}
function D() {
  let t2 = f(), [r2, i2] = d(), [a2] = g();
  async function o2(t3) {
    let { code: n2, msg: r3 } = await e.proxy.userMdfProxyModuleCreate(t3);
    return i2(n2, r3), n2 === 0;
  }
  async function s2(r3, o3) {
    let { labels: c2, extraParams: l2 } = o3, u2 = r3.reverse(), { code: d2, msg: f2, data: p2 } = await e.proxy.userAddProxyModuleV2Create({ ...l2, proxyList: u2 });
    if (d2 === 0)
      if (o3.onSuccess) await o3.onSuccess();
      else {
        let e2 = c2.successRouteName === "agent-list" ? { name: "list" } : void 0;
        t2.replace({ name: c2.successRouteName, query: e2 });
      }
    else if (d2 === 101 && p2) {
      let e2 = u2.length === p2?.length, t3 = e2 ? $t("\u77E5\u9053\u4E86") : $t("\u7EE7\u7EED\u5E76\u4FDD\u5B58"), r4 = ["protocol", "host", "port", "proxyUserName", "proxyPassword", "refreshUrl", "remark"], i3 = E(c2).filter((e3) => r4.includes(e3.field)), l3 = (e2 ? u2 : u2.filter((e3, t4) => p2.some((e4) => e4.index === t4))).reverse();
      a2({ showHeader: !1, modal: !0, blockScroll: !0, slots: { container: ({ hideModal: r5 }) => n(T, { title: e2 ? c2.duplicateTitleAll : c2.duplicateTitlePartial, labels: c2, columns: i3, dataList: l3, isAllExist: e2, okText: t3, onClose: r5, onCancel: r5, onConfirm: () => d3(r5) }) } });
      async function d3(t4) {
        e2 || await s2(u2.filter((e3, t5) => !p2?.some((e4) => e4.index === t5)).reverse(), o3), t4();
      }
    } else i2(d2, f2);
  }
  return { saveProxyModules: s2, updateProxyModules: o2 };
}
export {E as n,D as t};