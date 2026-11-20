<script setup>
import { Teleport, computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { t as useAgentConnection } from './agent-BmSFI9WH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { h as Attachment, u as Markdown } from './CreateTemplateDialog-Bpq9OLTG.js';
import { chatMessageRuntime } from './hook-CnJE4hRq.js';

const props = defineProps({ message: { type: Object, required: true } });
const emit = defineEmits(['copy', 'saveTemplate']);
const { CopyButton, Timeline, StatusMessage } = chatMessageRuntime;
const connection = useAgentConnection();
const preview = ref(null);
const previewDialog = useTemplateRef('previewDialog');
const zoom = ref(1);
const zoomLabel = computed(() => Math.round(zoom.value * 100) + '%');
const assistant = computed(() => props.message.role === 'assistant');
const busy = computed(() => assistant.value && ['thinking', 'streaming'].includes(props.message.status));
const error = computed(() => assistant.value && props.message.status === 'error' && props.message.errorData);
const hasMessage = computed(() => assistant.value ? Boolean(props.message.process || props.message.content.trim() || props.message.errorData)
  : Boolean(props.message.content.trim() || props.message.attachments?.length));
const finalAnswer = computed(() => findAnswer(props.message.process?.events));
const copyable = computed(() => assistant.value && finalAnswer.value ? finalAnswer.value : props.message.content);
const showBody = computed(() => {
  const { content, process, status } = props.message;
  const timelineHasAnswer = Boolean(finalAnswer.value) && (process.completed === true || (process.completed === undefined && process.collapsed === true));
  return Boolean(content && (!assistant.value || (status !== 'thinking' && !error.value && !timelineHasAnswer)));
});

function findAnswer(events = []) {
  for (let index = events.length - 1; index >= 0; index--) {
    const event = events[index];
    if (event.type === 'final_answer' && event.content.trim()) return event.content;
    if (event.type === 'agent_lifecycle') {
      const answer = findAnswer(event.events) || findAnswer(event.children);
      if (answer) return answer;
    }
  }
  return '';
}
function onBubbleMenu(event) {
  if (assistant.value || !copyable.value) return;
  if (event.target instanceof HTMLElement && event.target.closest('a,button,input,textarea,select')) return;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) emit('copy', copyable.value);
}
function absoluteUrl(url) {
  if (!url) return '';
  if (url.startsWith('/api/files/') && connection.serverUrl) return connection.serverUrl + url;
  return url;
}
function imageUrl(file) {
  return [file.preview, file.url, file.localUrl, file.fileUrl, file.remoteUrl].map(absoluteUrl).find(Boolean) || '';
}
function downloadUrl(file) {
  if (!connection.serverUrl || !file.fileId) return imageUrl(file);
  const query = new URLSearchParams({ download: '1', filename: file.fileName });
  return connection.serverUrl + '/api/files/' + encodeURIComponent(file.fileId) + '?' + query;
}
function previewable(file) {
  return file.kind === 'file' && (file.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(file.fileName)) && Boolean(imageUrl(file));
}
function openPreview(file) {
  if (!previewable(file)) return;
  preview.value = file;
  zoom.value = 1;
  nextTick(() => previewDialog.value?.focus());
}
function closePreview() {
  preview.value = null;
  zoom.value = 1;
}
function changeZoom(delta) {
  zoom.value = Math.min(3, Math.max(0.5, Number((zoom.value + delta).toFixed(2))));
}
function previewKeys(event) {
  if (!preview.value) return;
  switch (event.key) {
    case 'Escape': closePreview(); break;
    case '+':
    case '=': changeZoom(0.25); break;
    case '-': changeZoom(-0.25); break;
    case '0': zoom.value = 1; break;
  }
}
onMounted(() => document.addEventListener('keydown', previewKeys));
onUnmounted(() => document.removeEventListener('keydown', previewKeys));
</script>

<template>
  <article v-if="hasMessage" class="chat-message" :class="message.role">
    <div class="message-body">
      <Timeline v-if="assistant && message.process" :conversation-id="message.conversationId" :has-message-content="Boolean(message.content.trim())"
        :process="message.process" :message-status="message.status" @save-template="emit('saveTemplate', $event)" />
      <StatusMessage v-if="error" :data="message.errorData" />
      <div v-if="message.role === 'user' && message.attachments?.length" class="message-attachments">
        <Attachment v-for="file in message.attachments" :key="file.fileId" :attachment="file" :preview-url="imageUrl(file)"
          :previewable="previewable(file)" size="message" @preview="openPreview(file)" />
      </div>
      <div v-if="showBody" class="message-bubble" :class="{ thinking: message.status === 'thinking' }" @contextmenu.prevent="onBubbleMenu">
        <Markdown :content="message.content" :preserve-line-breaks="message.role === 'user'" />
      </div>
      <div v-if="message.createdAt && !busy" class="message-actions">
        <span>{{ message.createdAt }}</span><CopyButton v-if="copyable" :text="copyable" />
      </div>
    </div>
  </article>
  <Teleport to="body">
    <div v-if="preview" ref="previewDialog" class="attachment-image-preview" role="dialog" aria-modal="true" :aria-label="preview.fileName"
      tabindex="-1" @click="closePreview" @wheel.prevent="changeZoom($event.deltaY < 0 ? 0.1 : -0.1)">
      <div class="attachment-image-preview__actions" @click.stop>
        <a :href="downloadUrl(preview)" :download="preview.fileName" :aria-label="$t('下载')">
          <Icon name="base/rx_ic_download" size="20" color="currentColor" />
        </a>
        <button type="button" :aria-label="$t('关闭')" @click="closePreview"><Icon name="roxy-agent/rx-ic-close" size="20" color="currentColor" /></button>
      </div>
      <div class="attachment-image-preview__stage">
        <img :src="imageUrl(preview)" :alt="preview.fileName" :style="{ transform: 'scale(' + zoom + ')' }" @click.stop @dblclick.stop="zoom = 1">
      </div>
      <div class="attachment-image-preview__zoom" @click.stop>
        <button type="button" aria-label="-" :disabled="zoom <= 0.5" @click="changeZoom(-0.25)">
          <Icon name="base/rx_ic_minus" size="18" color="currentColor" />
        </button>
        <button type="button" :aria-label="$t('重置')" class="attachment-image-preview__zoom-label" @click="zoom = 1">{{ zoomLabel }}</button>
        <button type="button" aria-label="+" :disabled="zoom >= 3" @click="changeZoom(0.25)"><span aria-hidden="true">+</span></button>
      </div>
    </div>
  </Teleport>
</template>
