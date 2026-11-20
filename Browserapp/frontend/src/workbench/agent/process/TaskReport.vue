<script setup>
import { computed, ref, watch } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { reportCardRuntime } from './hook-CnJE4hRq.js';
import { buildReportMarkdown, reportFilename } from './workbench-agent-report-markdown.js';

const props = defineProps({ conversationId: String, event: { type: Object, required: true }, windowInfo: { type: Map, required: true } });
const emit = defineEmits(['saveTemplate']);
const { useTaskMonitor, formatWindowTitle } = reportCardRuntime;
const { taskGroupList } = useTaskMonitor();
const displayedFailures = ref(new Set());
const saveState = ref('idle');
const canSave = computed(() => saveState.value === 'idle' || saveState.value === 'failed');
const saveLabel = computed(() => $t(({ sending: '正在保存模板', completed: '已提交保存', failed: '重试保存模板' })[saveState.value] || '保存为模板'));
const taskWindows = computed(() => new Map(taskGroupList.value.flatMap(group => group.tasks)
  .filter(task => task.dirId).map(task => [task.dirId, task])));
const windows = computed(() => props.event.report.windows.map(window => {
  const info = { ...taskWindows.value.get(window.dirId), ...props.windowInfo.get(window.dirId) };
  const unused = window.status === 'unused';
  return {
    ...window, unused, name: formatWindowTitle(info) || $t('窗口信息不可用'), country: info.countryCode || $t('地区未知'),
    account: info.platformUserName || $t('未关联账号'), icon: info.countryCode ? 'country-code/' + info.countryCode : 'base/rx_ic_earth',
    result: $t(unused ? '未使用' : window.success ? '成功' : '失败'),
  };
}));
const counts = computed(() => {
  const used = windows.value.filter(window => !window.unused);
  const total = windows.value.length;
  const succeeded = used.filter(window => window.success).length;
  const rate = used.length ? Math.round(succeeded / used.length * 100) : 0;
  return { total, used: used.length, unused: total - used.length, succeeded, rate };
});
watch(() => props.event.id, () => { displayedFailures.value.clear(); });

function failureId(index) {
  return 'task-report-' + props.event.id + '-failure-reason-' + index;
}
function toggleFailure(id) {
  if (displayedFailures.value.has(id)) displayedFailures.value.delete(id);
  else displayedFailures.value.add(id);
}
async function saveTemplate() {
  if (!canSave.value) return;
  saveState.value = 'sending';
  try {
    await new Promise((resolve, reject) => emit('saveTemplate', { conversationId: props.conversationId,
      sourceReportId: props.event.sourceReportId, report: props.event.report, resolve, reject }));
    saveState.value = 'completed';
  } catch {
    saveState.value = 'failed';
  }
}
function download() {
  const rows = windows.value.map(window => ({ ...window, reason: window.unused ? $t('未使用') : window.failureReason }));
  const markdown = buildReportMarkdown(props.event.report, rows, { ...counts.value, successRate: counts.value.rate + '%' }, {
    title: $t('执行报告'), taskName: $t('任务名称'), reportStatus: $t('报告状态'), completed: $t('已完成'),
    parameters: $t('任务参数'), noParameters: $t('无参数'), parameterKey: $t('参数键'), parameterName: $t('参数名称'), parameterValue: $t('参数值'),
    windows: $t('执行窗口'), window: $t('窗口'), country: $t('地区'), account: $t('账号'), result: $t('结果'), reason: $t('失败原因'),
    summary: $t('汇总'), total: $t('总数'), used: $t('使用数'), succeeded: $t('成功数'), unused: $t('未使用数'), successRate: $t('成功率'),
  });
  const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = reportFilename(props.event.report.taskName);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <section class="task-report-card">
    <header class="task-report-card__header">
      <div><h3>{{ event.report.taskName }}</h3><p>{{ $t('执行报告') }}</p></div>
      <span class="report-status report-status--accepted">{{ $t('已完成') }}</span>
    </header>
    <section v-if="event.report.params.length" class="report-section report-section--params">
      <div class="report-section__heading"><h4>{{ $t('任务参数') }}</h4><span>{{ $t('{count} 项', { count: event.report.params.length }) }}</span></div>
      <dl class="report-params">
        <div v-for="param in event.report.params" :key="param.key" class="report-param">
          <dt>{{ param.name }}</dt><dd>{{ param.value === null ? $t('未设置') : String(param.value) }}</dd>
        </div>
      </dl>
    </section>
    <section class="report-section report-section--windows">
      <div class="report-section__heading"><h4>{{ $t('执行窗口') }}</h4><span>{{ $t('{count} 个目标', { count: counts.total }) }}</span></div>
      <div class="report-windows">
        <article v-for="(window, index) in windows" :key="window.dirId" class="report-window"
          :class="{ 'report-window--failed': !window.success && !window.unused, 'report-window--unused': window.unused }">
          <div class="report-window__main">
            <div class="report-window__identity">
              <span class="report-window__label">{{ window.name }}</span>
              <Icon :name="window.icon" fallback="base/rx_ic_earth" size="16" aria-hidden="true" />
              <span class="report-window__country">{{ window.country }}</span>
              <span class="report-window__account" :title="window.account">{{ window.account }}</span>
            </div>
            <span class="window-result" :class="window.unused ? 'window-result--unused' : window.success ? 'window-result--success' : 'window-result--failed'">{{ window.result }}</span>
          </div>
          <button v-if="window.failureReason" type="button" class="failure-reason-toggle" :aria-expanded="displayedFailures.has(window.dirId)"
            :aria-controls="failureId(index)" @click="toggleFailure(window.dirId)">
            <span>{{ $t(displayedFailures.has(window.dirId) ? '收起失败原因' : '查看失败原因') }}</span>
            <Icon name="base/rx_ic_chevron_down" size="14" :class="{ 'failure-reason-toggle__icon--expanded': displayedFailures.has(window.dirId) }" aria-hidden="true" />
          </button>
          <div v-if="window.failureReason && displayedFailures.has(window.dirId)" :id="failureId(index)" class="failure-reason-panel">
            <span class="failure-reason-panel__label">{{ $t('失败原因') }}</span><p>{{ window.failureReason }}</p>
          </div>
        </article>
      </div>
    </section>
    <footer class="task-report-card__footer">
      <span>{{ $t('共 {total} 个目标，使用 {used} 个，成功 {succeeded} 个，未使用 {unused} 个，成功率 {rate}%', counts) }}</span>
      <div class="report-actions">
        <button type="button" @click="download">{{ $t('导出报告') }}</button>
        <button type="button" :disabled="!canSave" @click="saveTemplate">{{ saveLabel }}</button>
      </div>
    </footer>
  </section>
</template>
