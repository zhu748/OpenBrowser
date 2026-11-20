import { N as useAgentApi, at as useRole, mt as useWorkspace, sn as useLocale, v as useConfig } from "./utils-BIWenCnY.js";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "./workbench-vue.js";
import { n as useNotice } from "./agent-BmSFI9WH.js";
import { n as useConfirm } from "./useconfirm-CV4GTWBW.js";
import { n as useDialog } from "./usedialog-Dh0xp3r7.js";
import { r as useTaskLogStore } from "./TaskStatusBadge-fl9VE7c_.js";
import { E as ge, F as _e, N as ve, P as ye, k as be, t as xe } from "./CreateTemplateDialog-Bpq9OLTG.js";
import { _ as Ee, a as De, c as ke, f as je, g as Me, h as Ne, m as Fe, n as showSkeletonAfterDelay, o as Le, p as Re, r as ze, s as Be, t as useTaskExecution, u as He, v as Ue, y as Ge } from "./useTemplateTaskExecution-yGKXS9Rw.js";
import TaskScheduleDialog from './workbench-task-schedule.js';

const fetchSize = 200;
export const defaultPageSize = 10;
const refreshIntervalMs = 5000;

export function useTaskManager(prompt) {
  const pageSizes = [10, 20, 50, 100], tabs = computed(() => [{ id: "tasks", label: $t("任务列表") }, { id: "activity", label: $t("执行日志") }]), taskStatuses = computed(() => ({ manual: $t("未计划"), paused: $t("已暂停"), preparing: $t("准备中"), running: $t("执行中"), scheduled: $t("已计划"), expired: $t("已过期") })), logStatuses = computed(() => ({ preparing: $t("准备中"), failed: $t("失败"), interrupted: $t("已停止"), partial_failed: $t("部分失败"), running: $t("执行中"), skipped: $t("已跳过"), success: $t("成功") })), stoppingLabel = computed(() => $t("停止中...").replace(/\.\.\.$/, "")), activeTab = ref("tasks"), api = useAgentApi(), logStore = useTaskLogStore(), locale = useLocale(), workspace = useWorkspace(), role = useRole(), user = useConfig(), dialog = useDialog(), confirm = useConfirm(), localeClass = computed(() => `task-manager-content--${locale.siteLocale}`), [showSuccess, showError] = useNotice(), { executeTemplateTask: executeTask } = useTaskExecution(prompt), canManageAll = computed(() => role.isOwner || role.isManager);
  function canManage(e2) {
    return Be(e2, user.userInfo.id, canManageAll.value);
  }
  let allTasks = ref([]), loadedTasks = ref(!1), tasks = computed(() => allTasks.value.filter(canManage)), taskById = computed(() => new Map(allTasks.value.map((e2) => [e2.id, e2])));
  function canViewLog(e2) {
    let t2 = taskById.value.get(e2.taskId);
    return canManageAll.value || loadedTasks.value && (!t2 || canManage(t2));
  }
  let visibleLogs = computed(() => logStore.taskLogs.value.filter(canViewLog)), templates = ref([]), taskWindows = ref([]), logWindows = ref([]), taskCount = computed(() => tasks.value.length), tasksLoading = ref(!1), showTaskSkeleton = showSkeletonAfterDelay(tasksLoading), tasksFailed = ref(!1), logOffset = ref(0), logPageSize = ref(defaultPageSize), logCount = computed(() => visibleLogs.value.length), logPageSizes = computed(() => pageSizes.map((e2) => ({ label: $t("{count} 条/页", { count: e2 }), value: e2 }))), pageLogs = computed(() => visibleLogs.value.slice(logOffset.value, logOffset.value + logPageSize.value)), logsLoading = computed(() => !logStore.taskLogsReady.value && !logStore.lastError.value), showLogSkeleton = showSkeletonAfterDelay(logsLoading), logsFailed = computed(() => !logStore.taskLogsReady.value && !!logStore.lastError.value), startingTasks = ref(/* @__PURE__ */ new Set()), stoppingLogs = ref(/* @__PURE__ */ new Set()), deletingLogs = ref(/* @__PURE__ */ new Set()), selectedLogId = ref(), dt2 = ref(), ft2 = ref(!1), pt2 = ref(), mt2 = ref(!1), taskScroll = ref(null), activityScroll = ref(null), taskOverlap = ref(!1), activityOverlap = ref(!1), taskRequestRevision = 0, refreshTimer, tableObserver, previousLogStatuses = /* @__PURE__ */ new Map(), initialized = !1, pollingStarted = !1, mounted = !1, pendingTaskWindows = /* @__PURE__ */ new Map(), pendingLogWindows = /* @__PURE__ */ new Map(), missingTaskWindows = ref(/* @__PURE__ */ new Set()), missingLogWindows = ref(/* @__PURE__ */ new Set()), templateOptions = computed(() => Le(templates.value)), taskWindowOptions = computed(() => taskWindows.value), logWindowOptions = computed(() => logWindows.value), taskWindowNames = computed(() => new Map(taskWindowOptions.value.map((e2) => [e2.id, e2.code]))), logWindowNames = computed(() => new Map(logWindowOptions.value.map((e2) => [e2.id, e2.code]))), drawerWindowNames = computed(() => Object.fromEntries(logWindowNames.value)), drawerMissingWindows = computed(() => Object.fromEntries(Array.from(missingLogWindows.value).map((e2) => [e2, !0]))), openLog = computed(() => visibleLogs.value.find((e2) => e2.id === selectedLogId.value)), logDetail = computed(() => openLog.value ? logStore.taskExecutionDetails.value[openLog.value.id] : void 0), drawerWindowIds = computed(() => {
    let e2 = openLog.value;
    if (!e2) return [];
    let t2 = logDetail.value?.scriptWindows.map((e3) => e3.dirId).filter((e3) => !!e3) ?? [];
    return uniqueWindowIds([e2.windowDirIds, t2]);
  }), drawerWindowsReady = computed(() => hasLogWindowLabels(drawerWindowIds.value)), canCreate = computed(() => !tasksLoading.value && templateOptions.value.length > 0);
  function canStopTask(e2) {
    return !role.isOwner && Be(e2, user.userInfo.id, !1);
  }
  function canStopLog(e2) {
    let t2 = taskById.value.get(e2.taskId);
    return canViewLog(e2) && (t2 ? canStopTask(t2) : !role.isOwner);
  }
  watch([canManageAll, () => role.isOwner, () => user.userInfo.id], () => {
    closeTaskMenu(), closeLogMenu(), logOffset.value = 0, lookupTaskWindows(tasks.value);
  });
  function resetLogPage() {
    logOffset.value = 0;
  }
  watch([logCount, logPageSize], ([e2, t2]) => {
    let n2 = e2 > 0 ? Math.floor((e2 - 1) / t2) * t2 : 0;
    logOffset.value > n2 && (logOffset.value = n2);
  });
  function hasScrollOverlap(e2) {
    if (!e2) return !1;
    let t2 = e2.scrollWidth - e2.clientWidth;
    return t2 > 1 && e2.scrollLeft < t2 - 1;
  }
  function measureTables() {
    taskOverlap.value = hasScrollOverlap(taskScroll.value), activityOverlap.value = hasScrollOverlap(activityScroll.value);
  }
  function onTaskScroll() {
    taskOverlap.value = hasScrollOverlap(taskScroll.value);
  }
  function onActivityScroll() {
    activityOverlap.value = hasScrollOverlap(activityScroll.value);
  }
  watch(() => [taskScroll.value, activityScroll.value], (e2, t2) => {
    t2?.forEach((e3) => {
      e3 && tableObserver?.unobserve(e3);
    }), e2.forEach((e3) => {
      e3 && tableObserver?.observe(e3);
    }), nextTick(measureTables);
  }, { flush: "post" }), watch([tasks, pageLogs, activeTab], () => {
    nextTick(measureTables);
  }, { flush: "post" });
  async function loadPages(fetchPage) {
    const rows = [];
    let total = 0;
    do {
      const page = await fetchPage(rows.length);
      total = page.total;
      if (!page.items.length) break;
      rows.push(...page.items);
    } while (rows.length < total);
    return { rows, total };
  }

  function fetchTasks() {
    return loadPages(async offset => {
      const response = await api.userTasks.listUserTasks({
        limit: fetchSize, offset, sortBy: "created_at", sortOrder: "desc",
      });
      return Me(response, $t("加载任务失败"));
    });
  }

  async function fetchTemplates() {
    const { rows } = await loadPages(async offset => {
      const response = await api.userTemplates.listUserTemplates({
        limit: fetchSize, offset, sortBy: "name", sortOrder: "asc",
      });
      return be(response, $t("加载任务模板失败"));
    });
    return rows;
  }
  function workspaceName() {
    return workspace.currentWorkspace?.workspaceName;
  }
  function mergeWindowOptions(e2, t2) {
    if (t2.length === 0) return;
    let n2 = new Map(e2.value.map((e3) => [e3.id, e3]));
    t2.forEach((e3) => n2.set(e3.id, e3)), e2.value = _e(Array.from(n2.values()), workspaceName());
  }
  function mergeTaskWindows(e2) {
    mergeWindowOptions(taskWindows, e2);
  }
  function mergeLogWindows(e2) {
    mergeWindowOptions(logWindows, e2);
  }
  function uniqueWindowIds(e2) {
    return Array.from(new Set(e2.flatMap((e3) => e3 ?? []).filter(Boolean)));
  }
  function updateMissingWindows(e2, t2, n2 = []) {
    if (t2.length === 0 && n2.length === 0) return;
    let r2 = new Set(e2.value);
    t2.forEach((e3) => r2.add(e3)), n2.forEach((e3) => r2.delete(e3)), e2.value = r2;
  }
  function knowsWindow(e2, t2, n2) {
    return t2.has(e2) || n2.has(e2);
  }
  async function lookupWindows(e2, t2) {
    let n2 = Array.from(new Set(e2.filter(Boolean)));
    if (n2.length === 0) return;
    let r2 = new Set(t2.options.value.map((e3) => e3.id)), i2 = [], a3 = [];
    for (let e3 of n2) {
      if (r2.has(e3) || t2.deletedIds.value.has(e3)) continue;
      let n3 = t2.pendingLookups.get(e3);
      n3 ? i2.push(n3) : a3.push(e3);
    }
    if (a3.length > 0) {
      let e3 = (async () => {
        try {
          let e4 = await ve(a3, workspaceName());
          t2.mergeOptions(e4);
          let n3 = new Set(e4.map((e5) => e5.id));
          updateMissingWindows(t2.deletedIds, a3.filter((e5) => !n3.has(e5)), Array.from(n3));
        } catch (e4) {
          console.warn("Failed to load referenced task windows", e4);
        } finally {
          a3.forEach((e4) => {
            t2.pendingLookups.delete(e4);
          });
        }
      })();
      a3.forEach((n3) => t2.pendingLookups.set(n3, e3)), i2.push(e3);
    }
    i2.length > 0 && await Promise.allSettled(Array.from(new Set(i2)));
  }
  function lookupTaskWindows(e2) {
    return lookupWindows(uniqueWindowIds(e2.map((e3) => e3.windowIds)), { options: taskWindows, deletedIds: missingTaskWindows, pendingLookups: pendingTaskWindows, mergeOptions: mergeTaskWindows });
  }
  function hasLogWindowLabels(e2) {
    return e2.every((e3) => knowsWindow(e3, logWindowNames.value, missingLogWindows.value));
  }
  function lookupLogDetailWindows(e2) {
    return lookupWindows(e2, { options: logWindows, deletedIds: missingLogWindows, pendingLookups: pendingLogWindows, mergeOptions: mergeLogWindows });
  }
  function lookupLogTableWindows(e2) {
    return lookupLogDetailWindows(uniqueWindowIds(e2.map((e3) => e3.windowDirIds)));
  }
  function normalizeTasks(e2, t2, n2) {
    let r2 = new Map(t2.map((e3) => [e3.id, e3])), i2 = new Map(n2.map((e3) => [e3.id, e3.code]));
    return e2.map((e3) => Re(e3, r2, i2, $t("模板不可用")));
  }
  async function loadTasks() {
    let e2 = ++taskRequestRevision;
    tasksLoading.value = !0, tasksFailed.value = !1;
    try {
      let [t2, n2] = await Promise.all([fetchTasks(), fetchTemplates()]);
      return e2 === taskRequestRevision && (templates.value = n2, allTasks.value = normalizeTasks(t2.rows, n2, taskWindowOptions.value), initialized = !0, loadedTasks.value = !0, lookupTaskWindows(tasks.value), !0);
    } catch (t2) {
      return e2 === taskRequestRevision && (console.error("Failed to load user tasks", t2), allTasks.value = [], loadedTasks.value = !1, tasksFailed.value = !0), !1;
    } finally {
      e2 === taskRequestRevision && (tasksLoading.value = !1);
    }
  }
  function formatSchedule(e2) {
    if (e2.planType === "manual") return $t("手动执行");
    if (e2.planType === "once") {
      let t3 = e2.nextExecuteAt ?? e2.executeAt;
      if (!t3) return $t("单次执行");
      let n3 = new Date(t3);
      return Number.isNaN(n3.getTime()) ? t3 : new Intl.DateTimeFormat(void 0, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: !1 }).format(n3);
    }
    if (!e2.cron) return "-";
    let t2 = e2.cron.trim().split(/\s+/);
    if (t2.length !== 5) return e2.cron;
    let [n2, r2, i2, a3, o2] = t2;
    if (r2 === "*" && i2 === "*" && a3 === "*" && o2 === "*") return $t("每小时第 {minute} 分钟", { minute: n2 });
    let s3 = new Date(e2.nextExecuteAt ?? ""), c2 = !Number.isNaN(s3.getTime()), l2 = c2 ? new Intl.DateTimeFormat(void 0, { hour: "2-digit", minute: "2-digit", hour12: !1 }).format(s3) : `${r2.padStart(2, "0")}:${n2.padStart(2, "0")}`;
    if (i2 === "*" && a3 === "*" && o2 === "*") return $t("每天 {time}", { time: l2 });
    if (i2 === "*" && a3 === "*" && o2 !== "*") {
      let e3 = c2 ? new Intl.DateTimeFormat(void 0, { weekday: "long" }).format(s3) : o2;
      return $t("每周 {weekday} {time}", { weekday: e3, time: l2 });
    }
    if (i2 !== "*" && a3 === "*" && o2 === "*") {
      let e3 = c2 ? s3.getDate() : i2;
      return $t("每月 {day} 日 {time}", { day: e3, time: l2 });
    }
    return e2.cron;
  }
  function isActiveStatus(e2) {
    return e2 === "preparing" || e2 === "running";
  }
  let locallyRunningTasks = computed(() => {
    let e2 = logStore.taskLogs.value.filter((e3) => isActiveStatus(e3.status));
    return new Map(e2.map((e3) => [e3.taskId, e3]));
  });
  function taskStatus(e2) {
    return He(e2.status, locallyRunningTasks.value.get(e2.id)?.status, e2.runtimeStatus);
  }
  function canAddPlan(e2) {
    return taskStatus(e2) === "manual";
  }
  function isRunning(e2) {
    let t2 = taskStatus(e2);
    return t2 === "preparing" || t2 === "running";
  }
  function runningLogId(e2) {
    return Ee(e2, locallyRunningTasks.value.get(e2.id));
  }
  function isStopping(e2) {
    let t2 = runningLogId(e2);
    return !!(t2 && stoppingLogs.value.has(t2));
  }
  function formatWindows(e2, t2, n2) {
    if (e2.length === 0) return "-";
    if (!e2.every((e3) => knowsWindow(e3, t2, n2))) return $t("加载中...");
    let r2 = e2.map((e3) => t2.get(e3)).filter((e3) => !!e3);
    return r2.length > 0 ? r2.join("、") : $t("窗口不可用或无权限");
  }
  function taskWindowLabel(e2) {
    return formatWindows(e2.windowIds, taskWindowNames.value, missingTaskWindows.value);
  }
  function logWindowLabel(e2) {
    return formatWindows(e2.windowDirIds, logWindowNames.value, missingLogWindows.value);
  }
  function endReason(e2) {
    return je(e2.endReasonCode);
  }
  function viewLog(e2) {
    if (canViewLog(e2))
      return logStore.loadTaskExecution(e2.id).then((value) => {
        value && canViewLog(e2) && (selectedLogId.value = e2.id, lookupLogTableWindows([e2]));
      }).catch((error) => {
        globalThis.__localUiError?.(error.message), console.error(error);
      });
  }
  function closeLog() {
    logStore.clearTaskExecution(), selectedLogId.value = void 0;
  }
  function goToLogs(e2) {
    if (!canManage(e2)) return;
    closeTaskMenu(), activeTab.value = "activity";
    let t2 = ke(visibleLogs.value, e2.id);
    selectedLogId.value = t2?.id, t2 && lookupLogTableWindows([t2]);
    let n2 = t2 ? visibleLogs.value.findIndex((e3) => e3.id === t2.id) : -1;
    n2 >= 0 && (logOffset.value = Math.floor(n2 / logPageSize.value) * logPageSize.value);
  }
  function taskEditValues(e2) {
    return { id: e2.id, name: e2.name, userTemplateId: e2.userTemplateId, windowIds: [...e2.windowIds], planType: e2.planType, cron: e2.cron ?? null, timezone: e2.timezone ?? null, executeAt: e2.executeAt ?? null, nextExecuteAt: e2.nextExecuteAt ?? null, enabled: e2.enabled, concurrency: Fe(e2.metadata) };
  }
  async function saveTask(e2, t2) {
    if (t2 && !canManage(t2)) return showError(-1, $t("没有权限操作该任务")), !1;
    try {
      if (t2) {
        let n2 = { name: e2.name, window_ids: e2.windowIds, plan_type: Ge(e2.planType), cron: e2.cron, timezone: e2.timezone, execute_at: e2.executeAt, enabled: e2.enabled, metadata: De(e2.concurrency) }, r2 = await api.userTasks.updateUserTask({ taskId: t2.id }, n2);
        Ne(r2, $t("保存任务失败")), showSuccess(0, $t("任务已更新"));
      } else {
        let t3 = { name: e2.name, user_template_id: e2.userTemplateId, window_ids: e2.windowIds, plan_type: Ue(e2.planType), cron: e2.cron, timezone: e2.timezone, execute_at: e2.executeAt, enabled: e2.enabled, metadata: De(e2.concurrency) }, n2 = await api.userTasks.createUserTask(t3);
        Ne(n2, $t("创建任务失败"));
      }
      return await refreshTemplates(), await refreshTasks(), !0;
    } catch (e3) {
      return console.error("Failed to save user task", e3), showError(-1, e3 instanceof Error ? e3.message : $t("保存任务失败")), !1;
    }
  }
  function openTaskEditor(e2) {
    if (e2 && !canManage(e2)) {
      showError(-1, $t("没有权限操作该任务"));
      return;
    }
    if (!e2 && !canCreate.value) {
      showError(-1, $t("请先创建一个用户模板"));
      return;
    }
    let t2 = workspaceName(), n2 = e2 ? taskWindowOptions.value.filter((t3) => e2.windowIds.includes(t3.id)) : [];
    dialog.open(ze, { props: { modal: !0, blockScroll: !0, dismissableMask: !1, draggable: !1, showHeader: !1, style: { width: "min(440px, calc(100vw - 32px))" }, pt: { root: "agent-console-dialog agent-console-create-task-dialog", content: "!p-0 !overflow-hidden" } }, data: { initialValues: e2 ? taskEditValues(e2) : void 0, templateOptions: templateOptions.value, windowOptions: n2, loadWindowOptions: (e3, n3, r2) => ye({ pageIndex: e3, pageSize: 10, keyword: n3, projectId: r2 }, t2), onSave: (t3) => saveTask(t3, e2) } });
  }
  async function saveSchedule(e2, t2) {
    if (!canManage(e2)) return showError(-1, $t("没有权限操作该任务")), !1;
    try {
      let n2 = { plan_type: Ge(t2.planType), cron: t2.cron, timezone: t2.timezone, execute_at: t2.executeAt, enabled: t2.enabled }, r2 = await api.userTasks.updateUserTask({ taskId: e2.id }, n2);
      return Ne(r2, $t("保存计划失败")), showSuccess(0, $t("计划已更新")), await refreshTemplates(), await refreshTasks(), !0;
    } catch (e3) {
      return console.error("Failed to save task schedule", e3), showError(-1, e3 instanceof Error ? e3.message : $t("保存计划失败")), !1;
    }
  }
  function openSchedule(e2) {
    canManage(e2) ? (closeTaskMenu(), dialog.open(TaskScheduleDialog, { props: { modal: !0, blockScroll: !0, dismissableMask: !1, draggable: !1, showHeader: !1, style: { width: "min(440px, calc(100vw - 32px))" }, pt: { root: "agent-console-dialog agent-console-task-schedule-dialog", content: "!p-0 !overflow-hidden" } }, data: { initialValues: { planType: e2.planType, cron: e2.cron, executeAt: e2.executeAt, nextExecuteAt: e2.nextExecuteAt, enabled: e2.enabled }, onSave: (t2) => saveSchedule(e2, t2) } })) : showError(-1, $t("没有权限操作该任务"));
  }
  async function toggleSchedule(e2) {
    if (!canManage(e2)) showError(-1, $t("没有权限操作该任务"));
    else {
      closeTaskMenu();
      try {
        let t2 = await api.userTasks.updateUserTask({ taskId: e2.id }, { enabled: !e2.enabled });
        Ne(t2, $t("更新计划状态失败")), showSuccess(0, e2.enabled ? $t("计划已暂停") : $t("计划已启用")), await refreshTemplates(), await refreshTasks();
      } catch (e3) {
        console.error("Failed to toggle task plan", e3), showError(-1, e3 instanceof Error ? e3.message : $t("更新计划状态失败"));
      }
    }
  }
  function removeTask(e2) {
    canManage(e2) ? (closeTaskMenu(), confirm.require({ group: "agentConsoleDeleteConfirmDialog", header: $t("删除任务"), message: $t("删除后无法恢复，确认删除任务“{name}”吗？", { name: e2.name }), acceptLabel: $t("删除"), rejectLabel: $t("取消"), accept: async () => {
      if (canManage(e2)) try {
        let t2 = await api.userTasks.deleteUserTask({ taskId: e2.id });
        Ne(t2, $t("删除任务失败")), await refreshTemplates(), await refreshTasks();
      } catch (e3) {
        console.error("Failed to delete user task", e3), showError(-1, e3 instanceof Error ? e3.message : $t("删除任务失败"));
      }
    } })) : showError(-1, $t("没有权限操作该任务"));
  }
  function taskMenuOpen(e2) {
    return ft2.value && dt2.value?.id === e2.id;
  }
  function setTaskMenu(e2, t2) {
    ft2.value = e2, dt2.value = e2 ? t2 : void 0;
  }
  function closeTaskMenu() {
    ft2.value = !1, dt2.value = void 0;
  }
  function logMenuOpen(e2) {
    return mt2.value && pt2.value?.id === e2.id;
  }
  function setLogMenu(e2, t2) {
    mt2.value = e2, pt2.value = e2 ? t2 : void 0;
  }
  function closeLogMenu() {
    mt2.value = !1, pt2.value = void 0;
  }
  async function refreshTemplates() {
    try {
      await api.syncTasks();
    } catch (e2) {
      console.warn("Failed to sync local task scheduler", e2), showError(-1, $t("任务已保存，本地计划同步失败，将自动重试"));
    }
  }
  function setStarting(e2, t2) {
    let n2 = new Set(startingTasks.value);
    t2 ? n2.add(e2) : n2.delete(e2), startingTasks.value = n2;
  }
  async function refreshTasks(quiet = true) {
    if (!initialized) return;
    const revision = ++taskRequestRevision;
    const reportFailure = !quiet || tasksLoading.value;
    if (!quiet) {
      tasksLoading.value = true;
      tasksFailed.value = false;
    }
    try {
      const { rows } = await fetchTasks();
      if (revision !== taskRequestRevision) return;
      allTasks.value = normalizeTasks(rows, templates.value, taskWindowOptions.value);
      lookupTaskWindows(tasks.value);
      pruneStoppedLogs();
      tasksFailed.value = false;
    } catch (error) {
      if (revision !== taskRequestRevision) return;
      console.error("Failed to refresh user task statuses", error);
      if (reportFailure) tasksFailed.value = true;
    } finally {
      if (revision === taskRequestRevision) tasksLoading.value = false;
    }
  }
  async function startTask(e2) {
    if (!canManage(e2)) showError(-1, $t("没有权限操作该任务"));
    else if (!(startingTasks.value.has(e2.id) || isRunning(e2))) {
      setStarting(e2.id, !0);
      try {
        let t2 = templates.value.find((t3) => t3.id === e2.userTemplateId);
        if (!t2) {
          showError(-1, $t("任务模板不存在或不可用"));
          return;
        }
        await executeTask(e2, t2);
      } finally {
        setStarting(e2.id, !1);
      }
    }
  }
  function inspectTemplate(e2) {
    if (!canManage(e2)) return;
    let t2 = templates.value.find((t3) => t3.id === e2.userTemplateId), n2 = t2 ? ge(t2) : void 0;
    !t2 || !n2 ? showError(-1, $t("任务模板不存在或不可用")) : dialog.open(xe, { props: { modal: !0, blockScroll: !0, dismissableMask: !1, draggable: !1, showHeader: !1, style: { width: "min(540px, calc(100vw - 32px))" }, pt: { root: "agent-console-dialog agent-console-create-template-dialog", content: "!p-0 !overflow-hidden" } }, data: { template: n2, loadDetail: !0, readonly: !0 } });
  }
  function cancelPolling() {
    refreshTimer && clearTimeout(refreshTimer), refreshTimer = void 0;
  }
  function schedulePolling() {
    cancelPolling(), document.visibilityState === "visible" && (refreshTimer = setTimeout(async () => {
      await refreshTasks(), schedulePolling();
    }, refreshIntervalMs));
  }
  function startPolling() {
    mounted && !pollingStarted && (pollingStarted = !0, window.addEventListener("focus", onFocusChange), document.addEventListener("visibilitychange", onFocusChange), schedulePolling());
  }
  async function retryTasks() {
    await loadTasks() && startPolling();
  }
  function onFocusChange() {
    document.visibilityState === "visible" ? refreshTasks().finally(schedulePolling) : cancelPolling();
  }
  watch(pageLogs, (e2) => {
    lookupLogTableWindows(e2);
  }, { immediate: !0 }), watch(drawerWindowIds, (e2) => {
    lookupLogDetailWindows(e2);
  }, { immediate: !0 }), watch(logStore.taskLogs, (e2) => {
    let t2 = new Map(e2.map((e3) => [e3.id, e3.status])), n2 = e2.some((e3) => {
      let t3 = previousLogStatuses.get(e3.id);
      return t3 !== void 0 && isActiveStatus(t3) && !isActiveStatus(e3.status);
    });
    previousLogStatuses = t2, n2 && initialized && refreshTasks();
  }, { immediate: !0 });
  function updateBusySet(e2, t2, n2) {
    let r2 = new Set(e2.value);
    n2 ? r2.add(t2) : r2.delete(t2), e2.value = r2;
  }
  function pruneStoppedLogs() {
    if (stoppingLogs.value.size === 0) return;
    let e2 = new Map(tasks.value.map((e3) => [e3.id, e3])), t2 = logStore.taskLogs.value.filter((t3) => {
      if (!stoppingLogs.value.has(t3.id) || isActiveStatus(t3.status)) return !1;
      let n3 = e2.get(t3.taskId);
      return !n3 || !isRunning(n3);
    }).map((e3) => e3.id);
    if (t2.length === 0) return;
    let n2 = new Set(stoppingLogs.value);
    t2.forEach((e3) => n2.delete(e3)), stoppingLogs.value = n2;
  }
  async function stopTask(e2) {
    if (!canStopTask(e2)) {
      showError(-1, $t("任务执行中不可停止，空间所有者可在任务结束后继续管理"));
      return;
    }
    if (!canManage(e2)) {
      showError(-1, $t("没有权限操作该任务"));
      return;
    }
    if (!isRunning(e2)) return;
    let t2 = runningLogId(e2);
    if (!t2) showError(-1, $t("停止任务失败"));
    else if (!stoppingLogs.value.has(t2)) {
      updateBusySet(stoppingLogs, t2, !0);
      try {
        await api.stopTaskLog(t2), showSuccess(0, $t("停止请求已发送")), await refreshTasks();
      } catch (e3) {
        updateBusySet(stoppingLogs, t2, !1), console.error("Failed to stop task", e3), showError(-1, e3 instanceof Error ? e3.message : $t("停止任务失败"));
      }
    }
  }
  async function stopLog(e2) {
    closeLogMenu();
    let t2 = taskById.value.get(e2.taskId);
    if (!canStopLog(e2)) showError(-1, $t("任务执行中不可停止，空间所有者可在任务结束后继续管理"));
    else if (t2 && !canManage(t2)) showError(-1, $t("没有权限操作该任务"));
    else if (isActiveStatus(e2.status) && !stoppingLogs.value.has(e2.id)) {
      updateBusySet(stoppingLogs, e2.id, !0);
      try {
        await api.stopTaskLog(e2.id), showSuccess(0, $t("停止请求已发送"));
      } catch (t3) {
        updateBusySet(stoppingLogs, e2.id, !1), console.error("Failed to stop task log", t3), showError(-1, t3 instanceof Error ? t3.message : $t("停止任务失败"));
      }
    }
  }
  function removeLog(e2) {
    closeLogMenu();
    let t2 = taskById.value.get(e2.taskId);
    t2 && !canManage(t2) ? showError(-1, $t("没有权限操作该任务")) : isActiveStatus(e2.status) || deletingLogs.value.has(e2.id) || confirm.require({ group: "agentConsoleDeleteConfirmDialog", header: $t("删除记录"), message: $t("删除后无法恢复，确认删除任务“{name}”的这条执行记录吗？", { name: e2.taskName }), acceptLabel: $t("删除"), rejectLabel: $t("取消"), accept: async () => {
      if (canViewLog(e2)) {
        updateBusySet(deletingLogs, e2.id, !0);
        try {
          await api.deleteTaskLog(e2.id), showSuccess(0, $t("执行记录已删除"));
        } catch (e3) {
          console.error("Failed to delete task log", e3), showError(-1, e3 instanceof Error ? e3.message : $t("删除执行记录失败"));
        } finally {
          updateBusySet(deletingLogs, e2.id, !1);
        }
      }
    } });
  }
  onMounted(() => {
    mounted = !0, tableObserver = new ResizeObserver(measureTables);
    for (let e2 of [taskScroll.value, activityScroll.value]) e2 && tableObserver.observe(e2);
    measureTables(), loadTasks().then((e2) => {
      e2 && startPolling();
    });
  }), onBeforeUnmount(() => {
    mounted = !1, tableObserver?.disconnect(), tableObserver = void 0, taskRequestRevision++, cancelPolling(), window.removeEventListener("focus", onFocusChange), document.removeEventListener("visibilitychange", onFocusChange);
  });
  return {
    tabs,
    taskStatuses,
    logStatuses,
    stoppingLabel,
    activeTab,
    api,
    logStore,
    localeClass,
    canManage,
    tasks,
    taskCount,
    tasksLoading,
    showTaskSkeleton,
    tasksFailed,
    logOffset,
    logPageSize,
    logCount,
    logPageSizes,
    pageLogs,
    logsLoading,
    showLogSkeleton,
    logsFailed,
    startingTasks,
    stoppingLogs,
    deletingLogs,
    taskScroll,
    activityScroll,
    taskOverlap,
    activityOverlap,
    drawerWindowNames,
    drawerMissingWindows,
    openLog,
    logDetail,
    drawerWindowsReady,
    canCreate,
    canStopTask,
    canStopLog,
    resetLogPage,
    onTaskScroll,
    onActivityScroll,
    formatSchedule,
    isActiveStatus,
    locallyRunningTasks,
    taskStatus,
    canAddPlan,
    isRunning,
    isStopping,
    taskWindowLabel,
    logWindowLabel,
    endReason,
    viewLog,
    closeLog,
    goToLogs,
    openTaskEditor,
    openSchedule,
    toggleSchedule,
    removeTask,
    taskMenuOpen,
    setTaskMenu,
    closeTaskMenu,
    logMenuOpen,
    setLogMenu,
    startTask,
    inspectTemplate,
    retryTasks,
    stopTask,
    stopLog,
    removeLog,
  };
}
