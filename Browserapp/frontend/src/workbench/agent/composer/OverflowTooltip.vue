<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { r as Tooltip } from './AgentConsolePageLayout-CwKh-Fcw.js';

const props = defineProps({ contentClass: String, content: null, fallback: { default: '-' }, overflowTargetSelector: String,
  placement: { default: 'top-start' }, zIndex: { default: 70 } });
const text = ref(null);
const clipped = ref(false);
const classes = computed(() => ['overflow-tooltip-content', props.contentClass].filter(Boolean).join(' '));
let observer;
function measure() {
  const target = props.overflowTargetSelector ? text.value?.querySelector(props.overflowTargetSelector) : text.value;
  clipped.value = Boolean(target && target.scrollWidth > target.clientWidth + 1);
}
watch(() => props.content, () => nextTick(measure), { flush: 'post' });
onMounted(() => {
  if (text.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure);
    observer.observe(text.value);
  }
  measure();
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <span class="overflow-tooltip">
    <Tooltip :content="content" :content-class="classes" :disabled="!clipped || !content" :z-index="zIndex">
      <span ref="text" class="overflow-tooltip__text"><slot>{{ content || fallback }}</slot></span>
    </Tooltip>
  </span>
</template>
