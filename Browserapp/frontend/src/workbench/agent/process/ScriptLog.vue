<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { chatMessageRuntime } from './hook-CnJE4hRq.js';
const props = defineProps({ event: { type: Object, required: true }, windowLabel: String, compact: Boolean });
const { CopyButton } = chatMessageRuntime;
const output = ref(null);
const followsTail = ref(true);
const scroll = ref({ canScrollUp: false, canScrollDown: false });
const text = computed(() => props.event.lines.map(line => line.message).join('\n'));
let observer;

function measure() {
  const element = output.value;
  if (!element) return;
  const limit = element.scrollHeight - element.clientHeight;
  scroll.value = { canScrollUp: limit > 1 && element.scrollTop > 1, canScrollDown: limit > 1 && element.scrollTop < limit - 1 };
  if (document.activeElement === element) followsTail.value = limit <= 1 || element.scrollTop >= limit - 1;
}
function focus() {
  output.value?.focus({ preventScroll: true });
}
function toEnd() {
  if (!output.value) return;
  output.value.scrollTop = output.value.scrollHeight;
  measure();
}
function onBlur() {
  followsTail.value = true;
  requestAnimationFrame(toEnd);
}
function followOutput() {
  if (followsTail.value) nextTick(toEnd);
}
watch(() => [props.event.status, props.event.lines.length, props.event.lines.at(-1)?.message.length], followOutput, { flush: 'post' });
onMounted(() => {
  if (output.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure);
    observer.observe(output.value);
  }
  followOutput();
  nextTick(measure);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <section class="script-log-panel" :class="{ 'script-log-panel--compact': compact }">
    <header class="script-log-panel__title">
      <span class="script-log-panel__window-label" :title="windowLabel">{{ windowLabel }}</span>
      <CopyButton :text="text" />
    </header>
    <pre ref="output" class="script-log-panel__output" tabindex="-1"
      :class="{ 'scroll-mask--top': scroll.canScrollUp, 'scroll-mask--bottom': scroll.canScrollDown }"
      @blur="onBlur" @pointerdown="focus" @scroll.passive="measure" @wheel.passive="focus">{{ text }}</pre>
  </section>
</template>
