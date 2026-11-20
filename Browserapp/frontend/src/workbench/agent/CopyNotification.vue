<script setup>
import { onBeforeUnmount, ref, Teleport, Transition } from 'vue';

const visible = ref(false);
const sequence = ref(0);
let timer;
function hide() {
  clearTimeout(timer);
  visible.value = false;
}
function hideSoon() {
  clearTimeout(timer);
  timer = setTimeout(hide, 3000);
}
function show() {
  clearTimeout(timer);
  sequence.value++;
  visible.value = true;
}
defineExpose({ show });
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <Teleport to="body">
    <Transition name="agent-copy-notification" @after-enter="hideSoon">
      <div v-if="visible" :key="sequence" class="agent-copy-notification" role="status" aria-live="polite">
        <span class="agent-copy-notification__content">
          <svg class="agent-copy-notification__success-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.333" /><path d="m5 8 2 2 4-4" /></svg>
          <span>{{ $t('已复制') }}</span>
        </span>
        <button class="agent-copy-notification__close" type="button" :aria-label="$t('关闭')" @click="hide">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.667 4.667 6.666 6.666m0-6.666-6.666 6.666" /></svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>
