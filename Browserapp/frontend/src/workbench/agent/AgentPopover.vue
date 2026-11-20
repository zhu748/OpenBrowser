<script setup>
import { computed, nextTick, onBeforeUnmount, useTemplateRef, watch } from './workbench-vue.js';
import { t as alignElements } from './dist-web-BSWtPfDO.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  placement: { default: 'bottom-end' }, offset: { default: 8 }, triggerClass: {}, contentClass: {},
  zIndex: { default: 1200 }, disabled: Boolean,
});
const opened = defineModel('open', { type: Boolean, default: false });
const emit = defineEmits(['openChange']);
const trigger = useTemplateRef('triggerRef');
const popup = useTemplateRef('popupRef');
const placements = {
  top: [['bc', 'tc'], 0, -1], 'top-start': [['bl', 'tl'], 0, -1], 'top-end': [['br', 'tr'], 0, -1],
  bottom: [['tc', 'bc'], 0, 1], 'bottom-start': [['tl', 'bl'], 0, 1], 'bottom-end': [['tr', 'br'], 0, 1],
  left: [['cr', 'cl'], -1, 0], 'left-start': [['tr', 'tl'], -1, 0], 'left-end': [['br', 'bl'], -1, 0],
  right: [['cl', 'cr'], 1, 0], 'right-start': [['tl', 'tr'], 1, 0], 'right-end': [['bl', 'br'], 1, 0],
};
const placement = computed(() => {
  const [points, x, y] = placements[props.placement] ?? placements['bottom-end'];
  return { points, offset: [x * props.offset, y * props.offset] };
});
let observer;
let listeners;
let frame;
function align() {
  if (!opened.value || !popup.value || !trigger.value || frame != null) return;
  frame = requestAnimationFrame(() => {
    frame = undefined;
    if (opened.value && popup.value && trigger.value) alignElements(popup.value, trigger.value, {
      ...placement.value, targetOffset: [0, 0], overflow: { adjustX: true, adjustY: true },
      useCssTransform: true, ignoreShake: true,
    });
  });
}
function open() { if (!props.disabled) opened.value = true; }
function close() { opened.value = false; }
function toggle() { if (opened.value) close(); else open(); }
function outside(event) {
  const path = event.composedPath();
  if (!path.includes(trigger.value) && !path.includes(popup.value)) close();
}
function escape(event) { if (event.key === 'Escape') close(); }
function onKey(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
  toggle();
}
function unbind() {
  observer?.disconnect();
  listeners?.abort();
  observer = undefined;
  listeners = undefined;
}
async function bind() {
  if (listeners) return;
  listeners = new AbortController();
  const { signal } = listeners;
  document.addEventListener('pointerdown', outside, { capture: true, signal });
  document.addEventListener('keydown', escape, { signal });
  window.addEventListener('resize', align, { signal });
  window.addEventListener('scroll', align, { capture: true, signal });
  await nextTick();
  if (signal.aborted || !popup.value) return;
  align();
  observer = new ResizeObserver(align);
  observer.observe(popup.value);
}
watch(opened, value => {
  emit('openChange', value);
  if (value) bind();
  else unbind();
}, { flush: 'post' });
watch(placement, align);
onBeforeUnmount(() => {
  unbind();
  if (frame != null) cancelAnimationFrame(frame);
});
defineExpose({ open, close, toggle, align });
</script>

<template>
  <span ref="triggerRef" v-bind="$attrs" class="agent-popover__trigger" :class="triggerClass" @click.stop.prevent="toggle" @keydown="onKey">
    <slot :open="open" :close="close" :toggle="toggle" :is-open="opened" />
  </span>
  <Teleport to="body">
    <div v-if="opened" ref="popupRef" class="agent-popover__content" :class="contentClass" :style="{ zIndex }" @click.stop>
      <slot name="content" :close="close" />
    </div>
  </Teleport>
</template>
