<script setup>
import { computed, onBeforeUnmount, ref, watch, Teleport } from 'vue';

const props = defineProps({ calloutAboveContainer: Boolean, calloutBelowTarget: Boolean, interactiveTarget: Boolean,
  label: String, zIndex: Number, target: null, visible: Boolean });
const emit = defineEmits(['dismiss']);
const targetBox = ref();
const containerTop = ref();
const borderRadius = ref(0);
const width = ref(0);
const height = ref(0);
const padding = 5;
const gap = 37;
const margin = 12;
let frame = 0;
let observer;
let observedTarget;

const hole = computed(() => {
  if (!targetBox.value) return;
  const left = Math.max(0, targetBox.value.left - padding);
  const top = Math.max(0, targetBox.value.top - padding);
  const right = Math.min(width.value, targetBox.value.right + padding);
  const bottom = Math.min(height.value, targetBox.value.bottom + padding);
  return { left, top, right, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
});
const shown = computed(() => props.visible && Boolean(hole.value?.width && hole.value.height));
const mask = computed(() => {
  if (!hole.value) return '';
  const { left, right, top, bottom, width: regionWidth, height: regionHeight } = hole.value;
  const radius = Math.min(borderRadius.value, regionWidth / 2, regionHeight / 2);
  return [
    `M 0 0 H ${width.value} V ${height.value} H 0 Z`, `M ${left + radius} ${top}`,
    `H ${right - radius}`, `A ${radius} ${radius} 0 0 1 ${right} ${top + radius}`,
    `V ${bottom - radius}`, `A ${radius} ${radius} 0 0 1 ${right - radius} ${bottom}`,
    `H ${left + radius}`, `A ${radius} ${radius} 0 0 1 ${left} ${bottom - radius}`,
    `V ${top + radius}`, `A ${radius} ${radius} 0 0 1 ${left + radius} ${top}`, 'Z',
  ].join(' ');
});
const mid = computed(() => targetBox.value ? targetBox.value.left + targetBox.value.width / 2 : 0);
const calloutTop = computed(() => {
  if (props.calloutBelowTarget) return Math.max(margin, (hole.value?.bottom ?? 0) + gap);
  if (props.calloutAboveContainer && containerTop.value !== undefined) return Math.max(margin, containerTop.value - margin);
  return Math.max(margin, (hole.value?.top ?? 0) - gap);
});
const callout = computed(() => ({ left: Math.min(Math.max(mid.value, 94), Math.max(94, width.value - margin - 82)) + 'px', top: calloutTop.value + 'px' }));
const line = computed(() => {
  const top = props.calloutBelowTarget ? (hole.value?.bottom ?? 0) + padding : calloutTop.value;
  const length = props.calloutBelowTarget ? calloutTop.value - top : (hole.value?.top ?? 0) - top - padding;
  return { left: mid.value + 'px', top: top + 'px', height: Math.max(32, length) + 'px' };
});
const hitArea = computed(() => targetBox.value ? Object.fromEntries(['left', 'top', 'width', 'height'].map(key => [key, targetBox.value[key] + 'px'])) : {});

function dismiss() {
  emit('dismiss');
}
function measure() {
  frame = 0;
  if (!props.visible || !props.target) return;
  targetBox.value = props.target.getBoundingClientRect();
  containerTop.value = props.target.closest('.composer-shell')?.getBoundingClientRect().top;
  borderRadius.value = Number.parseFloat(window.getComputedStyle(props.target).borderTopLeftRadius) || 0;
  width.value = window.innerWidth;
  height.value = window.innerHeight;
}
function schedule() {
  if (!frame) frame = window.requestAnimationFrame(measure);
}
function detach() {
  if (frame) window.cancelAnimationFrame(frame);
  frame = 0;
  window.removeEventListener('resize', schedule);
  window.removeEventListener('scroll', schedule, true);
  observedTarget?.removeEventListener('click', dismiss);
  observedTarget = undefined;
  observer?.disconnect();
  observer = undefined;
}
watch(() => [props.visible, props.target], () => {
  detach();
  targetBox.value = undefined;
  containerTop.value = undefined;
  borderRadius.value = 0;
  if (!props.visible || !props.target) return;
  observedTarget = props.target;
  observedTarget.addEventListener('click', dismiss);
  window.addEventListener('resize', schedule);
  window.addEventListener('scroll', schedule, true);
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(schedule);
    observer.observe(observedTarget);
    const container = observedTarget.closest('.composer-shell');
    if (container) observer.observe(container);
  }
  schedule();
}, { flush: 'post', immediate: true });
onBeforeUnmount(detach);
</script>

<template>
  <Teleport to="body">
    <div v-if="shown" class="select-window-guide" role="dialog" :aria-label="label" :style="zIndex === undefined ? undefined : { zIndex }" @touchmove.prevent @wheel.prevent>
      <svg class="select-window-guide__mask" :width="width" :height="height" :viewBox="'0 0 ' + width + ' ' + height" aria-hidden="true">
        <path :d="mask" fill-rule="evenodd" clip-rule="evenodd" />
      </svg>
      <div class="select-window-guide__callout" :class="{ 'select-window-guide__callout--below-target': calloutBelowTarget }" :style="callout">
        <span class="select-window-guide__label">{{ label }}</span><button type="button" class="select-window-guide__skip" @click.stop="dismiss">{{ $t('跳过') }}</button>
      </div>
      <div class="select-window-guide__line" :class="{ 'select-window-guide__line--below-target': calloutBelowTarget }" :style="line" aria-hidden="true"><span></span></div>
      <button v-if="interactiveTarget" class="select-window-guide__target-hit-area" type="button" :aria-label="label" :style="hitArea" @click.stop="target?.click()"></button>
    </div>
  </Teleport>
</template>
