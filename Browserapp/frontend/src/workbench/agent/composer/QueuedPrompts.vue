<script setup>
import { nextTick, ref, watch } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { r as Tooltip } from './AgentConsolePageLayout-CwKh-Fcw.js';
import { g as OverflowTooltip, u as Markdown, formatQueuedPrompt } from './CreateTemplateDialog-Bpq9OLTG.js';

const props = defineProps({ prompts: { type: Array, required: true } });
const emit = defineEmits(['remove', 'reorder', 'restore']);
const list = ref(null);
const source = ref();
const destination = ref();
watch(() => props.prompts.map(prompt => prompt.id), async (ids, previous) => {
  if (!ids.some(id => !previous.includes(id))) return;
  await nextTick();
  if (list.value) list.value.scrollTop = list.value.scrollHeight;
}, { flush: 'post' });
function hasFiles(event) {
  return [...(event.dataTransfer?.types ?? [])].includes('Files');
}
function start(event, id) {
  source.value = id;
  event.dataTransfer?.setData('text/plain', id);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}
function over(event, index) {
  if (hasFiles(event)) { destination.value = undefined; return; }
  event.preventDefault();
  destination.value = index;
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}
function drop(event, index) {
  if (!hasFiles(event)) {
    event.preventDefault();
    const id = source.value || event.dataTransfer?.getData('text/plain');
    if (id) emit('reorder', { promptId: id, targetIndex: index });
  }
  clearDrag();
}
function clearDrag() {
  source.value = undefined;
  destination.value = undefined;
}
</script>

<template>
  <section v-if="prompts.length" class="prompt-queue" :aria-label="$t('提示词队列')">
    <div ref="list" class="prompt-queue__list">
      <article v-for="(prompt, index) in prompts" :key="prompt.id" class="prompt-queue__item"
        :class="{ 'prompt-queue__item--dragging': source === prompt.id, 'prompt-queue__item--drop-target': destination === index && source !== prompt.id }"
        draggable="true" @dragend="clearDrag" @dragover="over($event, index)" @dragstart="start($event, prompt.id)" @drop="drop($event, index)">
        <Tooltip :content="$t('拖动排序')" placement="top" :offset="8">
          <span class="prompt-queue__handle" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
        </Tooltip>
        <div class="prompt-queue__content">
          <OverflowTooltip :content="formatQueuedPrompt(prompt)" content-class="prompt-queue__content-tooltip" overflow-target-selector=".agent-markdown" placement="top-start">
            <Markdown :content="formatQueuedPrompt(prompt)" />
          </OverflowTooltip>
        </div>
        <span class="prompt-queue__actions">
          <Tooltip :content="$t('撤回并编辑')" placement="top" :offset="8">
            <button type="button" :aria-label="$t('撤回并编辑')" @click="emit('restore', prompt.id)">
              <Icon name="base/rx_ic_agent_edit" size="16" color="currentColor" aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip :content="$t('删除')" placement="top" :offset="8">
            <button type="button" :aria-label="$t('删除')" @click="emit('remove', prompt.id)">
              <Icon name="roxy-agent/rx-ic-mcp-delete" size="16" color="currentColor" aria-hidden="true" />
            </button>
          </Tooltip>
        </span>
      </article>
    </div>
  </section>
</template>
