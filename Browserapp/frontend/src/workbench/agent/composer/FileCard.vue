<script setup>
import { computed } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { fileIcons } from './workbench-agent-file-icons.js';

const props = defineProps({
  attachment: { type: Object, required: true }, previewUrl: String, previewable: Boolean, removable: Boolean,
  removeLabel: { type: String, default: '' }, downloadUrl: String, downloadLabel: { type: String, default: '' }, size: { type: String, default: 'composer' },
});
const emit = defineEmits(['preview', 'remove']);
const fileTypes = {
  audio: ['mp3', 'wav', 'flac', 'ape', 'aac', 'ogg'], video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'],
  excel: ['xlsx', 'xls'], image: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'jfif'], markdown: ['md', 'mdx'],
  pdf: ['pdf'], ppt: ['ppt', 'pptx'], word: ['doc', 'docx'], zip: ['zip', 'rar', '7z', 'tar', 'gz'],
  java: ['java'], javascript: ['js'], python: ['py'],
};
const color = { audio: '#ff6e31', default: '#8c8c8c', excel: '#22b35e', image: '#8c8c8c', java: '#1677ff',
  javascript: '#fab714', markdown: '#8c8c8c', pdf: '#ff4d4f', ppt: '#ff6e31', python: '#fab714', video: '#ff4d4f', word: '#1677ff', zip: '#fab714' };
const extension = computed(() => props.attachment.fileName.match(/\.([^.]+)$/)?.[1]?.toLowerCase() ?? '');
const displayName = computed(() => {
  const text = props.attachment.fileName;
  const prefix = text.match(/^(.*)\.[^.]+$/)?.[1];
  return prefix === undefined ? { prefix: text, suffix: '' } : { prefix, suffix: text.slice(prefix.length) };
});
const fileType = computed(() => Object.keys(fileTypes).find(type => fileTypes[type].includes(extension.value)) ?? 'default');
const isThumbnail = computed(() => props.attachment.kind === 'file' && props.previewUrl
  && (props.attachment.mimeType?.startsWith('image/') || fileType.value === 'image'));
const uploading = computed(() => props.attachment.uploadStatus === 'uploading');
const failed = computed(() => props.attachment.uploadStatus === 'error');

function openPreview() {
  if (props.previewable) emit('preview');
}
function keyboardPreview(event) {
  if (!props.previewable || !['Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  openPreview();
}
</script>

<template>
  <article class="agent-file-card" :class="['agent-file-card--' + size, { 'agent-file-card--previewable': previewable, 'agent-file-card--uploading': uploading }]">
    <div class="agent-file-card__file" :role="previewable ? 'button' : undefined" :tabindex="previewable ? 0 : undefined"
      @click="openPreview" @keydown="keyboardPreview">
      <div class="agent-file-card__icon" :style="{ color: color[fileType] }">
        <img v-if="isThumbnail" :src="previewUrl" :alt="attachment.fileName">
        <Icon v-else-if="attachment.kind === 'folder'" name="roxy-agent/rx-ic-folder" size="32" color="#8c8c8c" />
        <svg v-else-if="fileType === 'audio' || fileType === 'video'" viewBox="0 0 16 16" fill-rule="evenodd" aria-hidden="true"><path :d="fileIcons[fileType]" /></svg>
        <svg v-else viewBox="0 0 1024 1024" aria-hidden="true">
          <g v-if="fileType === 'python'" fill-rule="evenodd" transform="translate(112 112)">
            <path v-for="path in fileIcons.python" :key="path" :d="path" />
          </g>
          <path v-else :d="fileIcons[fileType]" />
        </svg>
      </div>
      <div class="agent-file-card__content">
        <div class="agent-file-card__name" :title="attachment.fileName">
          <span class="agent-file-card__name-prefix">{{ displayName.prefix }}</span><span class="agent-file-card__name-suffix">{{ displayName.suffix }}</span>
        </div>
        <div class="agent-file-card__description" :class="{ 'agent-file-card__description--error': failed }">{{ attachment.kind === 'folder' ? 'Folder' : extension.toUpperCase() || 'FILE' }}</div>
      </div>
      <span v-if="uploading" class="agent-file-card__spinner" aria-hidden="true"></span>
      <a v-if="downloadUrl" class="agent-file-card__mask" :href="downloadUrl" :download="attachment.fileName" :aria-label="downloadLabel" @click.stop>
        <span class="agent-file-card__mask-info">
          <svg viewBox="0 0 1024 1024" aria-hidden="true"><path :d="fileIcons.download" /></svg><span>{{ downloadLabel }}</span>
        </span>
      </a>
    </div>
    <button v-if="removable" type="button" class="agent-file-card__remove" :aria-label="removeLabel" @click.stop="emit('remove')">
      <Icon name="roxy-agent/rx-ic-close2" size="12" color="currentColor" />
    </button>
  </article>
</template>
