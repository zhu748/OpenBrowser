<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { mt as useWorkspace, ni as inDesktop } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { markdownRuntime } from './CreateTemplateDialog-Bpq9OLTG.js';

const props = defineProps({ content: { type: String, default: '' }, preserveLineBreaks: Boolean, streaming: Boolean, variant: { type: String, default: 'default' } });
const { registerToken, registerCodeCopy, registerTableCopy, renderMarkdown, labelsRevision, watchContainer,
  parsePromptTokens, referencedProfileIds, resolveProfiles, updateProfileLabels } = markdownRuntime;
registerToken();
registerCodeCopy();
registerTableCopy();
const [, notifyError] = useNotice();
const workspace = useWorkspace();
const contentElement = ref(null);
const html = computed(() => props.streaming ? '' : renderMarkdown(props.content, { labelVersion: labelsRevision.value, preserveLineBreaks: props.preserveLineBreaks }));
let stopWatching = () => {};
watch(contentElement, container => {
  stopWatching();
  stopWatching = watchContainer(container);
}, { flush: 'post' });
onBeforeUnmount(() => stopWatching());
watch(() => [props.content, props.streaming], async ([content, streaming]) => {
  if (streaming) return;
  const ids = referencedProfileIds(parsePromptTokens(content));
  if (!ids.length) return;
  try {
    const profiles = await resolveProfiles(ids, workspace.currentWorkspace?.workspaceName);
    updateProfileLabels(profiles.map(profile => ({ id: profile.id, label: profile.code || profile.name || profile.id })));
  } catch (error) {
    console.error('Failed to load Agent profile token labels:', error);
  }
}, { immediate: true });
async function onClick(event) {
  const link = event.target instanceof Element ? event.target.closest('a[data-local-file-path]') : null;
  const filePath = link?.dataset.localFilePath;
  if (!filePath || !globalThis.electronAPI || !inDesktop()) return;
  event.preventDefault();
  try {
    await globalThis.electronAPI.send('app:downloadLocalFile', {
      filePath, fileName: link.getAttribute('download') || link.textContent?.trim() || undefined,
    });
  } catch (error) {
    console.error('Failed to download markdown local file:', error);
    notifyError(-1, $t(error?.code === 'ENOENT' ? '文件不存在或已被移动' : '下载失败'));
  }
}
</script>

<template>
  <div v-if="streaming" ref="contentElement" class="agent-markdown" :class="{ 'agent-markdown--answer': variant === 'answer' }" @click="onClick">
    <p class="agent-markdown__streaming-text">{{ content }}</p>
  </div>
  <div v-else ref="contentElement" class="agent-markdown" :class="{ 'agent-markdown--answer': variant === 'answer' }" @click="onClick" v-html="html"></div>
</template>
