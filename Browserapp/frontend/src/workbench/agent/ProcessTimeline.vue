<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { N as useAgentApi } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { h as FileCard, u as Markdown } from './CreateTemplateDialog-Bpq9OLTG.js';
import { processTimelineRuntime } from './hook-CnJE4hRq.js';

const props = defineProps({ conversationId: String, hasMessageContent: Boolean, process: { type: Object, required: true }, messageStatus: String });
const emit = defineEmits(['saveTemplate']);
const { Collapse, EventList, LifecycleTree, ReportCard, splitProcessSteps, shouldCollapse, loadWindowInfo } = processTimelineRuntime;
const agent = useAgentApi();
const isRunning = status => status === 'thinking' || status === 'streaming';
const running = computed(() => isRunning(props.messageStatus));
const expanded = ref(props.process.collapsed === false || running.value);
const now = ref(Date.now());
const reportWindowInfo = ref(new Map());
let timer;
const steps = computed(() => props.process.events.filter(event => !['final_answer', 'agent_file', 'task_report'].includes(event.type)));
const sections = computed(() => splitProcessSteps(steps.value, 'root'));
const lastSection = computed(() => sections.value.at(-1)?.id);
const finalAnswer = computed(() => props.process.events.find(event => event.type === 'final_answer'));
const files = computed(() => props.process.events.filter(event => event.type === 'agent_file')
  .flatMap(event => event.files.filter(file => !/\.log$/i.test(file.fileName))));
const reports = computed(() => props.process.events.filter(event => event.type === 'task_report' && !event.superseded));
const waiting = computed(() => running.value && !props.hasMessageContent && !steps.value.some(event => event.type !== 'content' || event.content.trim())
  && !finalAnswer.value?.content.trim() && !files.value.length);
const duration = computed(() => {
  if (!running.value || !props.process.durationStartedAt) return props.process.durationLabel;
  const seconds = Math.max(0, Math.floor((now.value - props.process.durationStartedAt) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  const label = minutes ? `${minutes}m${remainder ? `${remainder}s` : ''}` : `${seconds}s`;
  return `${$t('任务耗时')} ${label}`;
});

function updateTime() {
  now.value = Date.now();
  clearTimeout(timer);
  const startedAt = props.process.durationStartedAt;
  if (running.value && startedAt) timer = setTimeout(updateTime, 1000 - Math.max(0, now.value - startedAt) % 1000);
}
function attachment(file) {
  const { fileId, fileName, mimeType, size } = file;
  return { fileId, fileName, mimeType, size, kind: 'file', uploadStatus: 'uploaded' };
}
function download(file) {
  return agent.getFileUrl(file.fileId, { download: true, fileName: file.fileName });
}
watch(() => [props.messageStatus, props.process.durationStartedAt], () => {
  if (running.value) expanded.value = true;
  updateTime();
}, { immediate: true });
watch(reports, async (currentReports, _previous, onCleanup) => {
  let current = true;
  onCleanup(() => { current = false; });
  const ids = currentReports.flatMap(event => event.report.windows.map(window => window.dirId));
  try {
    const info = ids.length ? await loadWindowInfo(ids) : new Map();
    if (current) reportWindowInfo.value = info;
  } catch (error) {
    if (!current) return;
    console.warn('[agent-console] Failed to load task report window info:', error);
    reportWindowInfo.value = new Map();
  }
}, { immediate: true });
watch(() => [props.messageStatus, props.process.revision], () => {
  if (shouldCollapse(props.process.events, props.messageStatus)) expanded.value = false;
}, { immediate: true });
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <section class="agent-process">
    <div v-if="duration || expanded" class="process-round">
      <button v-if="duration" class="process-duration" type="button" @click="expanded = !expanded">
        <span>{{ duration }}</span><Icon name="base/rx_ic_chevron_down" size="12" :class="{ collapsed: !expanded }" />
      </button>
      <Collapse :expanded="expanded">
        <div class="process-collapse-content" :class="{ 'process-collapse-content--spaced': duration }">
          <div class="process-events">
            <div v-if="waiting" class="process-waiting-placeholder">
              <Icon name="roxy-agent/rx-ic-thinking" size="16" /><span>{{ $t('正在思考') }}</span>
            </div>
            <template v-else>
              <template v-for="section in sections" :key="section.id">
                <EventList v-if="section.type === 'events'" :events="section.events" :running="running && section.id === lastSection" :scope="section.id" />
                <LifecycleTree v-else :event="section.event" />
              </template>
            </template>
          </div>
        </div>
      </Collapse>
    </div>
    <Markdown v-if="finalAnswer" :content="finalAnswer.content" :streaming="running" variant="answer" />
    <ReportCard v-for="report in reports" :key="report.id" :conversation-id="conversationId" :event="report"
      :window-info="reportWindowInfo" @save-template="emit('saveTemplate', $event)" />
    <div v-if="files.length" class="agent-file-list">
      <FileCard v-for="file in files" :key="file.fileId" :attachment="attachment(file)" :download-label="$t('下载')" :download-url="download(file)" size="reply" />
    </div>
  </section>
</template>
