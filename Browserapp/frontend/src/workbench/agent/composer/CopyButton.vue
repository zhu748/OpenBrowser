<script setup>
import { computed, ref, onBeforeUnmount } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { r as Tooltip } from './AgentConsolePageLayout-CwKh-Fcw.js';
import { d as copyIcon, f as resetDelay, m as copyText, p as successIcon } from './CreateTemplateDialog-Bpq9OLTG.js';

const props = defineProps({ text: { type: String, default: '' }, size: { default: 14 }, copiedDuration: { type: Number, default: resetDelay },
  ariaLabel: String, tooltip: String, copiedTooltip: String, disabled: Boolean });
const emit = defineEmits(['copied', 'error']);
const copied = ref(false);
const inactive = computed(() => props.disabled || !props.text);
const label = computed(() => copied.value ? props.copiedTooltip || $t('已复制') : props.tooltip || props.ariaLabel || $t('复制'));
let timer;
async function copy() {
  if (inactive.value) return;
  try {
    if (!await copyText(props.text)) return;
    copied.value = true;
    emit('copied', props.text);
    clearTimeout(timer);
    timer = setTimeout(() => { copied.value = false; }, props.copiedDuration);
  } catch (error) {
    emit('error', error);
  }
}
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <Tooltip :content="label" placement="top" :offset="8" :disabled="inactive">
    <span class="agent-copy-control" :class="{ 'is-copied': copied, 'is-disabled': inactive }" role="button" :tabindex="inactive ? -1 : 0"
      :aria-label="label" @click.stop="copy" @keydown.enter.stop.prevent="copy" @keydown.space.stop.prevent="copy">
      <Icon :name="copied ? successIcon : copyIcon" :size="size" color="currentColor" />
    </span>
  </Tooltip>
</template>
