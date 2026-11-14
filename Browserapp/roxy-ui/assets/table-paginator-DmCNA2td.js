import {C as e,N as t,W as n,d as r,f as i,in as a,jt as o,lt as s,p as c,rt as l,x as u} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as d} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {i as f} from "./contextmenu-BBjizTDn.js";
import {t as p} from "./paginator-vnwyVxKC.js";
var m = { class: "flex flex-1 items-center paginator-jump" };
var h = { class: "flex-1 flex items-center gap-2 justify-end" };
var g = d(e({ __name: "table-paginator", props: t({ cacheKey: { default: "" }, totalRecords: { default: 0 }, rowOptions: { default: () => [5, 10, 20, 50, 100, 500] } }, { first: { default: 0 }, firstModifiers: {}, rows: { default: 10 }, rowsModifiers: {} }), emits: t(["update"], ["update:first", "update:rows"]), setup(e2, { emit: t2 }) {
  let d2 = t2, g2 = l(e2, "first"), _ = l(e2, "rows"), v = r(() => e2.rowOptions.map((e3) => ({ label: $t("{count} \u6761/\u9875", { count: e3 }), value: e3 })));
  function y(e3) {
    d2("update");
  }
  function b(t3) {
    e2.cacheKey && t3.value && localStorage.setItem(`table:${e2.cacheKey}`, t3.value), g2.value = 0, d2("update");
  }
  return (t3, r2) => {
    let l2 = f, d3 = p;
    return n(), c(d3, { first: g2.value, "onUpdate:first": r2[1] ||= (e3) => g2.value = e3, class: "paginator", rows: _.value, "total-records": e2.totalRecords, "page-link-size": 5, template: "JumpToPageInput PrevPageLink PageLinks NextPageLink", onPage: y }, { start: s(() => [i("div", m, [i("div", null, a(t3.$t("\u603B\u8BA1 {total} \u4E2A", { total: e2.totalRecords })), 1), u(l2, { modelValue: _.value, "onUpdate:modelValue": r2[0] ||= (e3) => _.value = e3, class: "!w-fit", name: "rowsPerPage", options: o(v), "option-value": "value", size: "xxs", filter: !1, onChange: b }, null, 8, ["modelValue", "options"]), i("div", h, a(t3.$t("\u8DF3\u8F6C\u9875\u6570\u81F3")), 1)])]), _: 1 }, 8, ["first", "rows", "total-records"]);
  };
} }), [["__scopeId", "data-v-6eeceda2"]]);
export {g as t};