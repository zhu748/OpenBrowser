import {Dt as e,Ot as t,Pt as n,Ut as r,at as i,mt as a,tn as o} from "./utils-BIWenCnY.js";
import {d as s} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {a as c} from "./agent-BmSFI9WH.js";
function l(i2) {
  let a2 = t(i2.workspaceType), s2 = i2.isOwner ?? i2.role === r.OWNER;
  return { workspaceType: a2, workspaceId: i2.workspaceId, isOwner: s2, isEcommerce: a2 === o.ECommerce, isNormal: e(a2), isPublicMember: n(a2, i2.role) };
}
function u() {
  let { isOwner: e2 } = c(i()), { currentWorkspace: t2 } = c(a()), n2 = s(() => l({ workspaceType: t2.value?.workspaceType, workspaceId: t2.value?.id, role: t2.value?.role, isOwner: e2.value }));
  return { ctx: n2, workspaceType: s(() => n2.value.workspaceType), isEcommerce: s(() => n2.value.isEcommerce), isNormal: s(() => n2.value.isNormal), isPublicMember: s(() => n2.value.isPublicMember) };
}
export {u as n};