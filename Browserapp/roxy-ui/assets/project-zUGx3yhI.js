import {h as e} from "./utils-BIWenCnY.js";
import {St as t} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {i as n} from "./agent-BmSFI9WH.js";
var r = (function(e2) {
  return e2[e2.none = 0] = "none", e2[e2.pinned = 1] = "pinned", e2;
})({});
var i = n("project", () => {
  let n2 = t([]), r2 = null;
  return { projects: n2, getProjects: async () => {
    r2 ??= e.limit.userGetTopProjectInfoList();
    let t2 = await r2.finally(() => {
      r2 = null;
    });
    return n2.value = t2.data?.rows || [], t2;
  } };
});
export {r as n,i as t};