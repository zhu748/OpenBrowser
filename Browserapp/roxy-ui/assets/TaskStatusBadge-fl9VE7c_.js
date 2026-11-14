import {C as ne,W as d,d as f,en as oe,f as se,h as p,in as ce,jt as m,p as le} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as de} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as fe} from "./grid-loader-BbJvp9z6.js";
function Ot(e2) {
  return Array.from(new Set([...e2.taskLogs.map((e3) => e3.conversationId), ...Object.values(e2.taskExecutionDetails).map((e3) => e3.conversationId)].filter((e3) => !!e3)));
}
function $() {
  return globalThis.__localAgentChannel();
}
function Zt() {
  return globalThis.__localAgentChannel();
}
var Qt = { key: 1, class: "status-icon", "aria-hidden": "true" };
var en = { class: "status-label" };
var tn = de(ne({ __name: "TaskStatusBadge", props: { status: {} }, setup(e2) {
  let t2 = f(() => ({ running: $t("\u6267\u884C\u4E2D"), idle: $t("\u7A7A\u95F2\u4E2D"), queued: "Queued", completed: "Completed", failed: "Failed" }));
  return (n2, r2) => (d(), p("span", { class: oe(["status-badge", e2.status]) }, [e2.status === "running" ? (d(), le(m(fe), { key: 0, class: "status-icon", "aria-hidden": "true" })) : (d(), p("span", Qt)), se("span", en, ce(m(t2)[e2.status]), 1)], 2));
} }), [["__scopeId", "data-v-a7d5a81e"]]);
export {Ot as i,Zt as n,$ as r,tn as t};