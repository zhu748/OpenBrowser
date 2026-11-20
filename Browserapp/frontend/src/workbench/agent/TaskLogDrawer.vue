<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { u as Markdown } from './CreateTemplateDialog-Bpq9OLTG.js';
import { d as elapsedTime, l as formatTime } from './useTemplateTaskExecution-yGKXS9Rw.js';

const props = defineProps({
  log: { type: Object, required: true }, detail: Object, detailReady: Boolean,
  endReason: String, windowLabels: Object, deletedWindowLabels: Object, windowLabelsReady: Boolean,
  fileUrl: { type: Function, required: true },
});
const emit = defineEmits(['close']);
const statuses = {
  preparing: $t('准备中'), running: $t('执行中'), success: $t('成功'), partial_failed: $t('部分失败'),
  failed: $t('失败'), interrupted: $t('已停止'), skipped: $t('已跳过'),
};
const key = ref('');
const now = ref(Date.now());
const logViewer = useTemplateRef('logViewer');
const conversation = useTemplateRef('conversationPanel');
const windows = computed(() => props.detail?.scriptWindows ?? []);
const current = computed(() => windows.value.find(window => window.key === key.value) ?? windows.value[0]);
const duration = computed(() => {
  const elapsed = elapsedTime(props.log, now.value);
  if (elapsed === null) return '-';
  const total = Math.floor(elapsed / 1000);
  const parts = { hours: Math.floor(total / 3600), minutes: Math.floor(total % 3600 / 60), seconds: total % 60 };
  return $t(parts.hours ? '{hours} 小时 {minutes} 分 {seconds} 秒' : '{minutes} 分 {seconds} 秒', parts);
});
const boundWindows = computed(() => {
  const ids = props.log.windowDirIds;
  if (!ids.length) return '-';
  if (ids.some(id => !props.windowLabels[id] && !props.deletedWindowLabels[id])) return $t('加载中...');
  const labels = ids.map(id => props.windowLabels[id]).filter(Boolean);
  return labels.length ? labels.join('、') : $t('窗口不可用或无权限');
});
const details = computed(() => [
  { label: '模板', value: props.log.templateName }, { label: '窗口', value: boundWindows.value },
  { label: '开始时间', value: formatTime(props.log.startedAt) }, { label: '结束时间', value: formatTime(props.log.endedAt) },
  { label: '执行时长', value: duration.value },
]);
let timer;

function tabLabel(item) {
  const { key, label, dirId } = item;
  if (!dirId) return label || key;
  if (props.windowLabels[dirId]) return props.windowLabels[dirId];
  if (props.deletedWindowLabels[dirId]) return $t('窗口不可用或无权限');
  return label && label !== dirId && label !== key ? label : $t('加载中...');
}
function fileSize(size) {
  if (size === null) return '-';
  if (size < 1024) return size + ' B';
  if (size < 1048576) return (size / 1024).toFixed(1) + ' KB';
  return (size / 1048576).toFixed(1) + ' MB';
}
function download(file) {
  return props.fileUrl(file.fileId, { download: true, fileName: file.fileName });
}
function baseName(path) { return path.split(/[\\/]/).at(-1) || path; }
function escape(event) { if (event.key === 'Escape') emit('close'); }
async function scrollToEnd(view) {
  await nextTick();
  if (view.value) view.value.scrollTop = view.value.scrollHeight;
}
watch(windows, value => {
  if (!value.some(window => window.key === key.value)) key.value = value[0]?.key ?? '';
}, { immediate: true });
watch([key, () => current.value?.log], () => scrollToEnd(logViewer), { immediate: true });
watch(() => {
  const messages = props.detail?.messages ?? [];
  const last = messages.at(-1);
  return [messages.length, last?.id, last?.content.length].join(':');
}, () => scrollToEnd(conversation), { immediate: true });
onMounted(() => {
  window.addEventListener('keydown', escape);
  timer = setInterval(() => { now.value = Date.now(); }, 1000);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', escape);
  clearInterval(timer);
});
</script>

<template>
  <div class="task-detail-overlay" role="presentation" @mousedown.self="emit('close')">
    <aside class="task-detail-drawer" role="dialog" aria-modal="true" :aria-label="$t('任务详情')">
      <header class="drawer-header">
        <div class="drawer-title"><span>{{ $t('任务详情') }}</span><strong :title="log.taskName">{{ log.taskName }}</strong></div>
        <button class="close-button" type="button" :aria-label="$t('关闭')" @click="emit('close')"><Icon name="roxy-agent/rx-ic-close" size="20" /></button>
      </header>
      <div class="drawer-content">
        <section class="detail-section">
          <h3>{{ $t('执行信息') }}</h3>
          <div class="detail-card">
            <dl>
              <div v-for="field in details" :key="field.label"><dt>{{ $t(field.label) }}</dt><dd>{{ field.value }}</dd></div>
              <div><dt>{{ $t('状态') }}</dt><dd><span class="detail-status" :class="log.status"><i></i>{{ statuses[log.status] }}</span></dd></div>
              <div v-if="endReason"><dt>{{ $t('结束原因') }}</dt><dd class="error-text">{{ endReason }}</dd></div>
            </dl>
          </div>
        </section>
        <section v-if="log.templateType === 'script'" class="detail-section execution-section">
          <div class="section-heading"><h3>{{ $t('运行日志') }}</h3><p>{{ $t('并行执行时，可点击不同窗口查看对应的运行日志。') }}</p></div>
          <div v-if="!windowLabelsReady" class="detail-placeholder">{{ $t('正在加载窗口编号...') }}</div>
          <div v-else-if="!detailReady" class="detail-placeholder">{{ $t('正在加载运行日志...') }}</div>
          <div v-else-if="!windows.length" class="detail-placeholder">{{ $t('暂无运行日志') }}</div>
          <template v-else>
            <div class="window-tabs" role="tablist" :aria-label="$t('执行窗口')">
              <button v-for="item in windows" :key="item.key" type="button" role="tab" :aria-selected="current?.key === item.key"
                :class="{ active: current?.key === item.key }" @click="key = item.key"><i :class="item.status"></i> {{ tabLabel(item) }}</button>
            </div>
            <pre ref="logViewer" class="log-viewer">{{ current?.log || $t('暂无运行日志') }}</pre>
            <div v-if="current?.failedFiles.length" class="upload-warning">
              <svg width="1em" height="1em" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3.11328C10.6367 3.11328 11.23 3.42461 11.5934 3.94461L11.6634 4.05128L17.0727 13.0833C17.2371 13.368 17.3265 13.6898 17.3327 14.0185C17.3388 14.3472 17.2614 14.6721 17.1077 14.9627C16.954 15.2534 16.7291 15.5003 16.454 15.6803C16.1789 15.8603 15.8626 15.9675 15.5347 15.9919L15.4047 15.9973H4.58804C4.25985 15.9936 3.93793 15.9068 3.65236 15.745C3.36678 15.5832 3.12685 15.3517 2.95496 15.0721C2.78306 14.7925 2.68482 14.4739 2.66938 14.1461C2.65395 13.8182 2.72184 13.4918 2.86671 13.1973L2.93271 13.0739L8.33938 4.04861C8.51249 3.76316 8.75624 3.52713 9.04712 3.36329C9.338 3.19946 9.6662 3.11335 10 3.11328ZM10.0067 11.9999L9.92204 12.0046C9.76001 12.0239 9.61067 12.1019 9.50232 12.2239C9.39396 12.3459 9.33412 12.5034 9.33412 12.6666C9.33412 12.8298 9.39396 12.9873 9.50232 13.1093C9.61067 13.2313 9.76001 13.3093 9.92204 13.3286L10 13.3333L10.0847 13.3286C10.2467 13.3093 10.3961 13.2313 10.5044 13.1093C10.6128 12.9873 10.6726 12.8298 10.6726 12.6666C10.6726 12.5034 10.6128 12.3459 10.5044 12.2239C10.3961 12.1019 10.2467 12.0239 10.0847 12.0046L10.0067 11.9999ZM10 7.33328C9.83675 7.3333 9.67915 7.39325 9.55713 7.50176C9.4351 7.61026 9.35715 7.75978 9.33804 7.92195L9.33338 7.99995V10.6666L9.33804 10.7446C9.35732 10.9066 9.43535 11.056 9.55735 11.1643C9.67936 11.2727 9.83687 11.3325 10 11.3325C10.1632 11.3325 10.3207 11.2727 10.4427 11.1643C10.5647 11.056 10.6428 10.9066 10.662 10.7446L10.6667 10.6666V7.99995L10.662 7.92195C10.6429 7.75978 10.565 7.61026 10.443 7.50176C10.3209 7.39325 10.1633 7.3333 10 7.33328Z" fill="#FD9F12" /></svg>
              <span>{{ $t('以下文件上传失败：{files}', { files: current.failedFiles.map(baseName).join('、') }) }}</span>
            </div>
            <div class="output-block">
              <h3>{{ $t('产出文件') }}</h3>
              <div v-if="!current?.artifacts.length" class="detail-placeholder compact">{{ $t('暂无产出文件') }}</div>
              <a v-for="file in current?.artifacts" :key="file.fileId" class="artifact-row" :href="download(file)" download>
                <span class="file-icon"><Icon name="roxy-agent/rx-ic-prompts" size="16" /></span>
                <span class="artifact-name" :title="file.fileName">{{ file.fileName }}</span>
                <span class="artifact-size">{{ fileSize(file.size) }}</span><Icon name="base/rx_ic_download" size="16" />
              </a>
            </div>
          </template>
        </section>
        <template v-else>
          <section class="detail-section">
            <h3>{{ $t('产出文件') }}</h3>
            <div v-if="!detail?.artifacts.length" class="detail-placeholder compact">{{ $t('暂无产出文件') }}</div>
            <a v-for="file in detail?.artifacts" :key="file.fileId" class="artifact-row" :href="download(file)" download>
              <span class="file-icon"><Icon name="roxy-agent/rx-ic-prompts" size="16" /></span>
              <span class="artifact-name" :title="file.fileName">{{ file.fileName }}</span>
              <span class="artifact-size">{{ fileSize(file.size) }}</span><Icon name="base/rx_ic_download" size="16" />
            </a>
          </section>
          <section class="detail-section execution-section">
            <h3>{{ $t('会话记录') }}</h3>
            <div v-if="!detailReady" class="detail-placeholder">{{ $t('正在加载会话记录...') }}</div>
            <div v-else-if="!detail?.messages.length" class="detail-placeholder">{{ $t('暂无会话记录') }}</div>
            <div v-else ref="conversationPanel" class="conversation-panel" role="log" :aria-label="$t('会话记录')" aria-live="polite">
              <article v-for="message in detail.messages" :key="message.id" class="conversation-message" :class="message.role">
                <div class="conversation-message__content"><Markdown :content="message.content || $t('暂无内容')" /></div>
                <time>{{ formatTime(message.createdAt) }}</time>
              </article>
            </div>
          </section>
        </template>
      </div>
    </aside>
  </div>
</template>
