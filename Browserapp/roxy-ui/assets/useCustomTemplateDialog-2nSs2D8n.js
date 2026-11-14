import {N as e,mt as t} from "./utils-BIWenCnY.js";
import {n as p} from "./agent-BmSFI9WH.js";
import {n as g} from "./usedialog-Dh0xp3r7.js";
import {P as v} from "./CreateTemplateDialog-Bpq9OLTG.js";
import {a as y,h as b,r as x,v as S} from "./useTemplateTaskExecution-yGKXS9Rw.js";
function C() {
  let n2 = g(), r2 = t(), i2 = e(), [a2, o2] = p();
  async function s2(e2, t2) {
    try {
      let n3 = { name: e2.name, user_template_id: e2.userTemplateId, window_ids: e2.windowIds, plan_type: S(e2.planType), cron: e2.cron, timezone: e2.timezone, execute_at: e2.executeAt, enabled: e2.enabled, metadata: y(e2.concurrency) }, r3 = await i2.userTasks.createUserTask(n3), s3 = b(r3, $t("\u521B\u5EFA\u4EFB\u52A1\u5931\u8D25"));
      a2(0, $t("\u4EFB\u52A1\u5DF2\u521B\u5EFA"));
      try {
        await i2.syncTasks();
      } catch (e3) {
        console.warn("Failed to sync local task scheduler", e3), o2(-1, $t("\u4EFB\u52A1\u5DF2\u4FDD\u5B58\uFF0C\u672C\u5730\u8BA1\u5212\u540C\u6B65\u5931\u8D25\uFF0C\u5C06\u81EA\u52A8\u91CD\u8BD5"));
      }
      return await t2.onCreated?.(s3), !0;
    } catch (e3) {
      return console.error("Failed to create user task", e3), o2(-1, e3 instanceof Error ? e3.message : $t("\u521B\u5EFA\u4EFB\u52A1\u5931\u8D25")), !1;
    }
  }
  async function c2(e2, t2 = {}) {
    try {
      let i3 = r2.currentWorkspace?.workspaceName;
      return n2.open(x, { props: { modal: !0, blockScroll: !0, dismissableMask: !1, draggable: !1, showHeader: !1, style: { width: "min(440px, calc(100vw - 32px))" }, pt: { root: "agent-console-dialog agent-console-create-task-dialog", content: "!p-0 !overflow-hidden" } }, data: { initialValues: { name: e2.name, userTemplateId: e2.id, windowIds: [], planType: "manual", cron: null, timezone: null, executeAt: null, enabled: !0, concurrency: e2.kind === "script" ? void 0 : null }, templateOptions: [{ kind: e2.kind, label: e2.name, value: e2.id }], windowOptions: [], loadWindowOptions: (e3, t3, n3) => v({ pageIndex: e3, pageSize: 10, keyword: t3, projectId: n3 }, i3), lockTemplate: !0, onSave: (e3) => s2(e3, t2) } }), !0;
    } catch (e3) {
      return console.error("Failed to prepare task dialog", e3), o2(-1, e3 instanceof Error ? e3.message : $t("\u52A0\u8F7D\u4EFB\u52A1\u521B\u5EFA\u4FE1\u606F\u5931\u8D25")), !1;
    }
  }
  return { openCreateTaskDialog: c2 };
}
export {C as n};