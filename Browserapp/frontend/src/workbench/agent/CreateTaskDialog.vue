<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from './workbench-vue.js';
import { h as api } from './utils-BIWenCnY.js';
import { b as useRouter } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as DatePicker } from './datepicker-Bd-h5Ks4.js';
import { g as Tooltip } from './CreateTemplateDialog-Bpq9OLTG.js';
import { a as Select, n as Badge, o as Field, r as Checkbox } from './ScriptSchemaForm-z_48GvPJ.js';
import { t as Input } from './AgentInput-CVahkFed.js';
import AgentMinutePicker from './workbench-agent-minute-picker.js';
import { createScheduleDraft, defaultConcurrency, isValidCron, makeSchedule, needsWindows } from './workbench-task-operations.js';

const dialog = inject('dialogRef');
const router = useRouter();
const options = dialog?.value.data ?? {};
const initial = options.initialValues ?? {};
const editing = Boolean(initial.id);
const templateLocked = editing || Boolean(options.lockTemplate);
const templateOptions = options.templateOptions ?? [];
const windowOptions = options.windowOptions ?? [];
const name = ref(initial.name ?? '');
const template = ref(initial.userTemplateId);
const templateKind = computed(() => templateOptions.find(item => item.value === template.value)?.kind);
const windowIds = ref(new Set(initial.windowIds ?? []));
const search = ref('');
const allProjects = '__all__';
const allProjectsOption = { label: $t('全部项目'), value: allProjects };
const projectOptions = ref([allProjectsOption]);
const project = ref(allProjects);
const loadingProjects = ref(true);
const windowPage = ref(0);
const remoteWindows = ref([]);
const initializing = ref(Boolean(options.loadWindowOptions));
const loadingMore = ref(false);
const windowError = ref('');
const hasMore = ref(Boolean(options.loadWindowOptions));
const saving = ref(false);
const error = ref('');
const concurrencyEnabled = ref(initial.concurrency !== null);
const concurrency = ref(initial.concurrency ?? defaultConcurrency());
const scheduleEnabled = ref(initial.planType === 'once' || initial.planType === 'cron');
const draft = createScheduleDraft(initial, 'daily');
const enabled = ref(draft.enabled);
const frequency = ref(draft.frequency);
const time = ref(draft.scheduleTime ?? new Date());
const minute = ref(draft.hourlyMinute);
const monthDay = ref(draft.monthlyDay);
const weekday = ref(draft.weekday);
let request = 0;
let searchTimer;

const frequencyOptions = computed(() => [
  { label: $t('单次执行'), value: 'once' }, { label: $t('每小时'), value: 'hourly' }, { label: $t('每天'), value: 'daily' },
  { label: $t('每周'), value: 'weekly' }, { label: $t('每月'), value: 'monthly' },
]);
const monthOptions = computed(() => Array.from({ length: 31 }, (_, index) => ({ label: $t('每月 {day} 日', { day: index + 1 }), value: index + 1 })));
const weekdayOptions = computed(() => [$t('周一'), $t('周二'), $t('周三'), $t('周四'), $t('周五'), $t('周六'), $t('周日')]
  .map((label, index) => ({ label, value: (index + 1) % 7 })));
const windows = computed(() => {
  const text = search.value.trim().toLocaleLowerCase();
  const filtered = windowOptions.filter(item => (project.value === allProjects || item.projectId === project.value)
    && (!text || `${item.code} ${item.name} ${item.remark}`.toLocaleLowerCase().includes(text)));
  return [...new Map([...filtered, ...remoteWindows.value].map(item => [item.id, item])).values()];
});
const windowLabel = item => [item.code, item.name, item.remark].filter(Boolean).join(' · ');
function selectWindow(id, checked) {
  if (checked) windowIds.value.add(id);
  else windowIds.value.delete(id);
}
async function loadProjects() {
  try {
    const response = await api.limit.userGetProjectInfoByWorkspaceList({ default: 2 });
    if (response.code !== 0) throw Error(response.msg || $t('获取项目信息失败'));
    const seen = new Set();
    projectOptions.value = [allProjectsOption, ...(response.data?.rows ?? []).flatMap(item => {
      const id = item.project_id?.toString();
      if (!id || seen.has(id)) return [];
      seen.add(id);
      return [{ label: item.projectName || (item.projectDefault ? $t('默认项目') : id), value: id }];
    })];
  } catch (failure) {
    console.error('Failed to load task projects', failure);
  } finally {
    loadingProjects.value = false;
  }
}
async function loadWindows(reset = false) {
  if (!options.loadWindowOptions || (!reset && (initializing.value || loadingMore.value || !hasMore.value))) return;
  const activeRequest = reset ? ++request : request;
  const page = reset ? 1 : windowPage.value + 1;
  windowError.value = '';
  if (reset) {
    initializing.value = true;
    loadingMore.value = false;
    windowPage.value = 0;
    remoteWindows.value = [];
    hasMore.value = true;
  } else loadingMore.value = true;
  try {
    const result = await options.loadWindowOptions(page, search.value.trim(), project.value === allProjects ? '' : project.value);
    if (activeRequest !== request) return;
    remoteWindows.value = reset ? result.items : [...new Map([...remoteWindows.value, ...result.items].map(item => [item.id, item])).values()];
    windowPage.value = page;
    hasMore.value = result.hasMore;
  } catch (failure) {
    if (activeRequest === request) windowError.value = failure?.message || $t('获取窗口信息失败');
  } finally {
    if (activeRequest === request) initializing.value = loadingMore.value = false;
  }
}
function onScroll({ currentTarget }) {
  if (currentTarget.scrollHeight - currentTarget.scrollTop - currentTarget.clientHeight <= 24) loadWindows();
}
const retry = () => loadWindows(windowPage.value === 0);
async function close() {
  await options.onCancel?.();
  dialog?.value.close();
}
async function moreTemplates() {
  await close();
  await router.push({ name: 'agent-console-template-store' });
}
async function save() {
  if (initializing.value || saving.value) return;
  error.value = '';
  const title = name.value.trim();
  if (!title) return void (error.value = $t('请输入任务名称'));
  if (!template.value) return void (error.value = $t('请选择任务模板'));
  if (!needsWindows(templateKind.value, windowIds.value.size)) return void (error.value = $t('脚本任务至少需要选择一个浏览器窗口'));
  const parallel = templateKind.value === 'script' && concurrencyEnabled.value ? Number(concurrency.value) : null;
  if (parallel !== null && (!Number.isSafeInteger(parallel) || parallel < 1 || parallel > 8)) return void (error.value = $t('请输入 1 至 8 之间的并发数量'));
  const schedule = makeSchedule({ frequency: frequency.value, hourlyMinute: minute.value, scheduleDate: time.value,
    scheduleTime: time.value, monthlyDay: monthDay.value, weekday: weekday.value, enabled: enabled.value }, scheduleEnabled.value);
  if (schedule.planType === 'once' && !schedule.executeAt) return void (error.value = $t('请选择有效的单次执行时间'));
  if (schedule.planType === 'cron' && (!schedule.cron || !isValidCron(schedule.cron))) return void (error.value = $t('请输入有效的五段 cron 表达式'));
  saving.value = true;
  try {
    const result = await options.onSave?.({ name: title, userTemplateId: template.value, windowIds: [...windowIds.value], concurrency: parallel, ...schedule });
    if (result !== false) dialog?.value.close();
  } catch (failure) {
    error.value = failure?.message || $t('保存失败');
  } finally {
    saving.value = false;
  }
}
watch(search, () => {
  if (!options.loadWindowOptions) return;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadWindows(true), 300);
});
watch(project, () => { clearTimeout(searchTimer); loadWindows(true); });
onMounted(() => { loadProjects(); loadWindows(true); });
onBeforeUnmount(() => { clearTimeout(searchTimer); request++; });
</script>

<template>
  <div class="agent-console-dialog__shell create-task-dialog">
    <header class="agent-console-dialog__header">
      <h2 class="agent-console-dialog__title">{{ editing ? $t('编辑任务') : $t('创建任务') }}</h2>
      <button class="agent-console-dialog__close" type="button" :aria-label="$t('关闭任务弹窗')" @click="close"></button>
    </header>
    <main class="agent-console-dialog__body create-task-dialog__body">
      <Field :label="$t('任务名称')"><Input v-model="name" type="text" :placeholder="$t('请输入任务名称')" :disabled="saving" /></Field>
      <Field :label="$t('任务模板')">
        <div class="template-picker-row">
          <Select v-model="template" class="template-select" :options="templateOptions" :placeholder="$t('请选择任务模板')" :disabled="templateLocked || saving" />
          <button v-if="!editing" class="template-more-button" type="button" @click="moreTemplates">
            <Icon name="roxy-agent/rx-ic-templates-store" size="18" /><span>{{ $t('更多模板') }}</span>
          </button>
        </div>
        <p v-if="editing" class="field-hint">{{ $t('任务创建后不可更换来源模板。') }}</p>
        <p v-else-if="templateLocked" class="field-hint">{{ $t('此任务将使用已选择的模板。') }}</p>
      </Field>
      <Field :label="$t('关联窗口')">
        <div class="window-picker">
          <div class="window-filter-row">
            <Select v-model="project" class="window-project-select" :options="projectOptions" :aria-label="$t('项目')" :disabled="saving || loadingProjects" />
            <Input v-model="search" class="window-search" type="search" pre-icon="base/rx_ic_magnify" :placeholder="$t('搜索窗口')" :disabled="saving" />
          </div>
          <div class="window-list" :aria-busy="initializing || loadingMore" @scroll.passive="onScroll">
            <div v-if="initializing" class="window-loading" role="status">
              <i class="pi pi-spin pi-spinner" aria-hidden="true"></i><span>{{ $t('加载中...') }}</span>
            </div>
            <div v-else-if="windowError && !windowPage" class="window-load-error" role="alert">
              <span>{{ windowError }}</span><button type="button" :disabled="saving" @click="retry">{{ $t('重试') }}</button>
            </div>
            <template v-else>
              <Checkbox v-for="item in windows" :key="item.id" :model-value="windowIds.has(item.id)" class="window-row" :class="{ selected: windowIds.has(item.id) }"
                :input-id="`create-task-window-${item.id}`" :disabled="saving" @update:model-value="selectWindow(item.id, $event)">
                <Icon class="window-flag" :name="item.iconName || 'base/rx_ic_route2'" fallback="base/rx_ic_route2" size="16"
                  color="var(--colors-icon-icon-tertiary)" aria-hidden="true" />
                <Tooltip class="window-info" :content="windowLabel(item)" :z-index="1300">
                  <span v-if="item.code" class="window-code">{{ item.code }}</span>
                  <span v-if="item.name" class="window-display-name">{{ (item.code ? ' · ' : '') + item.name }}</span>
                  <span v-if="item.remark" class="window-remark">{{ (item.code || item.name ? ' · ' : '') + item.remark }}</span>
                </Tooltip>
                <Badge v-if="item.isOpen" class="window-open-badge" type="open" :label="$t('窗口已打开')" />
              </Checkbox>
              <p v-if="!windows.length" class="window-empty">{{ $t('暂无匹配窗口') }}</p>
              <div v-if="loadingMore" class="window-loading window-loading--more" role="status">
                <i class="pi pi-spin pi-spinner" aria-hidden="true"></i><span>{{ $t('加载中...') }}</span>
              </div>
              <div v-else-if="windowError" class="window-load-error window-load-error--more" role="alert">
                <span>{{ windowError }}</span><button type="button" :disabled="saving" @click="retry">{{ $t('重试') }}</button>
              </div>
            </template>
          </div>
        </div>
      </Field>
      <Field v-if="templateKind === 'script'">
        <div class="concurrency-control">
          <Checkbox v-model="concurrencyEnabled" class="concurrency-toggle" :disabled="saving">{{ $t('并发数量') }}</Checkbox>
          <Input v-if="concurrencyEnabled" v-model="concurrency" class="concurrency-input" type="number" min="1" max="8" step="1"
            :aria-label="$t('并发数量')" :placeholder="$t('请输入并发数量')" :disabled="saving" />
        </div>
      </Field>
      <Field>
        <Checkbox v-model="scheduleEnabled" class="schedule-toggle" :disabled="saving">
          <span>{{ $t('计划执行') }} <em>{{ $t('（可选）') }}</em></span>
        </Checkbox>
        <div v-if="scheduleEnabled" class="schedule-controls">
          <p class="m-0 text-3 leading-5 text-[var(--color-text-tertiary)]">{{ $t('计划任务仅由创建者账号登录的客户端执行，请保持客户端在线。') }}</p>
          <div class="schedule-control-row">
            <Select v-model="frequency" class="schedule-frequency-select" :options="frequencyOptions" :disabled="saving" />
            <AgentMinutePicker v-if="frequency === 'hourly'" v-model="minute" class="schedule-datepicker" :disabled="saving" />
            <Select v-else-if="frequency === 'weekly'" v-model="weekday" class="schedule-detail-select" overlay-class="agent-schedule-select-overlay" :options="weekdayOptions" :disabled="saving" />
            <Select v-else-if="frequency === 'monthly'" v-model="monthDay" class="schedule-detail-select" overlay-class="agent-schedule-select-overlay" :options="monthOptions" :disabled="saving" />
            <DatePicker v-if="frequency !== 'hourly'" v-model="time" class="schedule-datepicker" panel-class="agent-schedule-datepicker-panel"
              date-format="yy/mm/dd" :time-only="frequency !== 'once'" :show-time="frequency === 'once'" hour-format="24"
              show-icon icon-display="input" fluid :disabled="saving" :manual-input="false">
              <template #inputicon="slot"><Icon name="base/rx_ic_chevron_down" size="12" :class="slot.class" @click.stop="slot.clickCallback" /></template>
            </DatePicker>
          </div>
          <Checkbox v-model="enabled" class="plan-enabled" :disabled="saving">{{ $t('启用此计划') }}</Checkbox>
        </div>
      </Field>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    </main>
    <footer class="agent-console-dialog__footer">
      <div class="agent-console-dialog__actions">
        <button class="agent-console-dialog__button" type="button" :disabled="saving" @click="close">{{ $t('取消') }}</button>
        <button class="agent-console-dialog__button dark" type="button" :disabled="saving || initializing" @click="save">{{ saving ? $t('保存中...') : $t('保存') }}</button>
      </div>
    </footer>
  </div>
</template>
