import { onBeforeUnmount, ref, watch } from './workbench-vue.js';
import { F as Plan, N as useAgentTasks, P as TaskKind, yn as windowMentions } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { b as useRouter, y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { D as templateKind, a as makeTemplateInvocation, c as setSkillRoot, r as skillRoot, v as invocationText } from './CreateTemplateDialog-Bpq9OLTG.js';

const isDate = value => value instanceof Date && !Number.isNaN(value.getTime());
const clock = () => { const now = new Date(); now.setSeconds(0, 0); return now; };
function integer(value, minimum, maximum) {
  const number = Number(value);
  return /^\d+$/.test(value) && number >= minimum && number <= maximum ? number : undefined;
}
function localTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
  catch { return 'UTC'; }
}
function readCron(draft, cron, next) {
  const parts = cron?.trim().split(/\s+/);
  if (parts?.length !== 5) return;
  const [minuteText, hourText, day, month, weekday] = parts;
  const minute = integer(minuteText, 0, 59);
  if (minute === undefined) return;
  if (hourText === '*' && day === '*' && month === '*' && weekday === '*') {
    Object.assign(draft, { frequency: 'hourly', hourlyMinute: minute });
    return;
  }
  const hour = integer(hourText, 0, 23);
  if (hour === undefined) return;
  const time = new Date(next ?? draft.scheduleTime ?? clock());
  if (!next) time.setHours(hour, minute, 0, 0);
  draft.scheduleTime = time;
  if (month !== '*') return;
  if (day === '*' && weekday === '*') draft.frequency = 'daily';
  else if (day === '*' && integer(weekday, 0, 6) !== undefined) {
    Object.assign(draft, { frequency: 'weekly', weekday: next?.getDay() ?? Number(weekday) });
  } else if (weekday === '*' && integer(day, 1, 31) !== undefined) {
    Object.assign(draft, { frequency: 'monthly', monthlyDay: next?.getDate() ?? Number(day) });
  }
}
function createScheduleDraft(task = {}, frequency = 'daily') {
  const now = clock();
  const draft = { frequency, hourlyMinute: now.getMinutes(), scheduleDate: new Date(now), scheduleTime: new Date(now),
    monthlyDay: 1, weekday: 1, enabled: task.enabled ?? true };
  if (task.planType === 'once') {
    const time = new Date(task.nextExecuteAt ?? task.executeAt ?? '');
    draft.frequency = 'once';
    if (isDate(time)) Object.assign(draft, { scheduleDate: new Date(time), scheduleTime: new Date(time) });
  } else if (task.planType === 'cron') {
    const next = new Date(task.nextExecuteAt ?? '');
    readCron(draft, task.cron, isDate(next) ? next : undefined);
  }
  return draft;
}
function writeCron(draft) {
  if (draft.frequency === 'hourly') {
    const minute = draft.hourlyMinute;
    return Number.isInteger(minute) && minute >= 0 && minute <= 59 ? `${minute} * * * *` : null;
  }
  if (!isDate(draft.scheduleTime)) return null;
  const prefix = `${draft.scheduleTime.getMinutes()} ${draft.scheduleTime.getHours()}`;
  if (draft.frequency === 'weekly') return `${prefix} * * ${draft.weekday}`;
  if (draft.frequency === 'monthly') return `${prefix} ${draft.monthlyDay} * *`;
  return `${prefix} * * *`;
}
function onceTime(draft) {
  if (!isDate(draft.scheduleDate) || !isDate(draft.scheduleTime)) return null;
  const date = new Date(draft.scheduleDate);
  date.setHours(draft.scheduleTime.getHours(), draft.scheduleTime.getMinutes(), 0, 0);
  return date.toISOString();
}
function makeSchedule(draft, scheduled = true) {
  if (!scheduled) return { planType: 'manual', cron: null, timezone: null, executeAt: null, enabled: true };
  if (draft.frequency === 'once') return { planType: 'once', cron: null, timezone: null, executeAt: onceTime(draft), enabled: draft.enabled };
  return { planType: 'cron', cron: writeCron(draft), timezone: localTimezone(), executeAt: null, enabled: draft.enabled };
}
function isValidCron(cron) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [minute, hour, day, month, weekday] = parts;
  if (integer(minute, 0, 59) === undefined || month !== '*') return false;
  if (hour === '*') return day === '*' && weekday === '*';
  if (integer(hour, 0, 23) === undefined) return false;
  if (day === '*') return weekday === '*' || integer(weekday, 0, 6) !== undefined;
  return weekday === '*' && integer(day, 1, 31) !== undefined;
}
const needsWindows = (kind, count) => kind !== 'script' || count > 0;
function defaultConcurrency() {
  const available = navigator.hardwareConcurrency;
  return Number.isSafeInteger(available) && available >= 1 && Number.isSafeInteger(available + 2) ? Math.min(available + 2, 8) : 4;
}
const taskPlan = { cron: Plan.Cron, manual: Plan.Manual, once: Plan.Once };
const executionKind = { cron: TaskKind.Cron, manual: TaskKind.Manual, once: TaskKind.Once };
const isObject = data => data !== null && typeof data === 'object' && !Array.isArray(data);
function readPage(result, fallback) {
  const data = readData(result, fallback);
  if (!isObject(data) || !Array.isArray(data.items) || [data.total, data.limit, data.offset].some(value => typeof value !== 'number')) throw TypeError(fallback);
  return data;
}
function readData(result, fallback) {
  if (!isObject(result) || result.code !== 0) throw Error(typeof result?.message === 'string' ? result.message : fallback);
  return result.data;
}
function canSchedule(task, user, admin) {
  return admin || (user != null && String(user) !== '' && task.creatorUserId != null && String(task.creatorUserId) === String(user));
}
function readConcurrency(task) {
  return Number.isSafeInteger(task.concurrency) && task.concurrency >= 1 ? task.concurrency : undefined;
}
const concurrencyOptions = concurrency => concurrency === null ? null : { concurrency };
function latestRun(logs, id) {
  return logs.reduce((latest, log) => log.taskId === id && (!latest || Date.parse(log.startedAt) > Date.parse(latest.startedAt)) ? log : latest, undefined);
}
const runId = (task, log) => log?.id ?? task.runtimeTaskLogId;
function timestamp(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (!isDate(date)) return value;
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function elapsed(log, now = Date.now()) {
  if (log.status === 'preparing' || log.status === 'running') {
    const start = Date.parse(log.startedAt);
    return Number.isFinite(start) ? Math.max(0, now - start) : null;
  }
  return Number.isFinite(log.durationMs) ? Math.max(0, log.durationMs) : null;
}
const planOf = type => taskPlan[type];
const kindOf = type => executionKind[type];
function statusOf(task, now = Date.now()) {
  if (task.planType === 'manual') return 'manual';
  if (!task.enabled) return 'paused';
  return task.planType === 'once' && task.executeAt && Date.parse(task.executeAt) <= now ? 'expired' : 'scheduled';
}
function effectiveStatus(current, status, logStatus) {
  return status === 'preparing' || status === 'running' ? status : logStatus === 'running' ? 'running' : current;
}
function listTemplateOptions(templates) {
  return templates.map(template => ({ kind: templateKind(template.templateType), label: template.name, value: template.id }));
}
function taskDetails(task, templates, windows, unknown) {
  const template = templates.get(task.userTemplateId);
  return { ...task, templateKind: templateKind(template?.templateType), templateName: template?.name || unknown,
    windowNumbers: task.windowIds.map(id => windows.get(id)).filter(Boolean).join(', '), status: statusOf(task) };
}
function loadingAfterDelay(active, wait = 200) {
  const delayed = ref(false);
  let timer;
  watch(active, loading => {
    clearTimeout(timer);
    if (loading) timer = setTimeout(() => { delayed.value = true; }, wait);
    else delayed.value = false;
  }, { immediate: true });
  onBeforeUnmount(() => clearTimeout(timer));
  return delayed;
}
const executionError = {
  TASK_INTERRUPTED: () => $t('任务执行已中断'), TASK_WORKSPACE_MISMATCH: () => $t('任务或模板不属于当前工作区'),
  TASK_TEMPLATE_MISMATCH: () => $t('任务引用的模板不匹配'), TASK_ALREADY_RUNNING: () => $t('该任务正在运行'),
  MISSED_TRIGGER: () => $t('计划触发延迟超过五分钟，本次执行已跳过'), AGENT_SHUTDOWN: () => $t('Agent 关闭期间任务执行被中断'),
  AGENT_RESTARTED: () => $t('Agent 重启导致任务执行中断'), TASK_ASSET_INVALID: () => $t('任务资源无效或已损坏'),
  WINDOW_STATE_UNAVAILABLE: () => $t('无法读取任务窗口状态'), NO_AVAILABLE_WINDOWS: () => $t('配置的浏览器窗口均不可用'),
  LEASE_SERVICE_UNAVAILABLE: () => $t('任务执行协调服务暂时不可用'), TASK_DISABLED: () => $t('任务已被禁用'),
  TASK_EXECUTED_BY_OTHER_USER: () => $t('任务已被其他客户端抢占'), TASK_SCHEDULE_FORBIDDEN: () => $t('计划任务仅允许创建者账号执行'),
  TASK_OCCURRENCE_CLAIMED: () => $t('本次计划已被执行，请勿重复触发'), TASK_EXECUTION_FAILED: () => $t('任务执行失败，请稍后重试'),
  AGENT_EXECUTION_FAILED: () => $t('任务执行失败，请稍后重试'), SCRIPT_EXECUTION_FAILED: () => $t('所有脚本执行均失败'),
  PARTIAL_WINDOW_FAILURE: () => $t('部分窗口的脚本执行失败'), ARTIFACT_UPLOAD_PARTIAL_FAILURE: () => $t('部分任务产物上传失败'),
  LEASE_LOST: () => $t('任务执行租约已失效'), HEARTBEAT_REJECTED: () => $t('任务心跳请求被拒绝'), HEARTBEAT_FAILED: () => $t('任务心跳连续失败'),
};
const errorText = code => code ? (Object.hasOwn(executionError, code) ? executionError[code]() : $t('任务执行失败，请稍后重试')) : '';
function useTaskExecution(composer) {
  const tasks = useAgentTasks();
  const route = useRoute();
  const router = useRouter();
  const [notify, error] = useFeedback();
  async function findTaskByUserTemplateId(id) {
    let offset = 0;
    for (;;) {
      const page = readPage(await tasks.userTasks.listUserTasks({ limit: 200, offset, sortBy: 'created_at', sortOrder: 'desc' }), $t('加载任务失败'));
      const found = page.items.find(task => task.userTemplateId === id);
      if (found) return found;
      offset += page.items.length;
      if (!page.items.length || offset >= page.total) return;
    }
  }
  async function executeTemplateTask(task, template) {
    try {
      const kind = 'kind' in template ? template.kind : templateKind(template.templateType);
      if (!kind) throw Error($t('任务模板类型不受支持'));
      if (kind === 'script') {
        await tasks.runTask(task.id);
        notify(0, $t('任务已开始'));
        await router.push({ name: 'agent-console-task-manager', query: route.query });
      } else {
        if (kind === 'skill' && !skillRoot()) {
          try { setSkillRoot((await tasks.skillPathInfo()).installedRoot); }
          catch (failure) { console.error('Failed to load Skill installed root', failure); }
        }
        const prompt = typeof task.metadata?.prompt === 'string' ? task.metadata.prompt.trim()
          : typeof template.metadata?.prompt === 'string' ? template.metadata.prompt.trim() : '';
        const content = invocationText(makeTemplateInvocation({ ...template, metadata: { ...template.metadata, prompt } }));
        const text = [content, task.windowIds?.length ? windowMentions(task.windowIds) : ''].filter(Boolean).join(' ').trim();
        if (!text) throw Error($t('任务提示词为空'));
        composer.value = text;
        await router.push({ name: 'agent-console-chat', query: route.query });
      }
      return true;
    } catch (failure) {
      console.error('Failed to execute template task', failure);
      error(-1, failure?.message || $t('启动任务失败'));
      return false;
    }
  }
  return { executeTemplateTask, findTaskByUserTemplateId };
}

export { createScheduleDraft, defaultConcurrency, isValidCron, makeSchedule, needsWindows };
export { isValidCron as S, runId as _, concurrencyOptions as a, makeSchedule as b, latestRun as c, elapsed as d, errorText as f,
  readPage as g, readData as h, timestamp as l, readConcurrency as m, loadingAfterDelay as n, listTemplateOptions as o,
  taskDetails as p, canSchedule as s, useTaskExecution as t, effectiveStatus as u, planOf as v, createScheduleDraft as x, kindOf as y };
