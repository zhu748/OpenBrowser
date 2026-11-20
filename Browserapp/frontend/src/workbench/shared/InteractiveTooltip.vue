<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef } from './workbench-vue.js';
import { t as alignElements } from './dist-web-BSWtPfDO.js';
import { n as motion } from './motion-BwnyBP9B.js';
import { t as AnimatePresence } from './AnimatePresence-d-29l3Fb.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  trigger: { type: String, default: 'hover' }, placement: { type: String, default: 'top' },
  offset: { type: Number, default: 4 }, delay: { type: Number, default: 200 }, tooltipContentClass: String,
});
const source = useTemplateRef('source');
const target = useTemplateRef('target');
const mounted = ref(false);
const visible = ref(false);
const placement = computed(() => ({
  top: { points: ['bc', 'tc'], offset: [0, -props.offset], y: 8 },
  bottom: { points: ['tc', 'bc'], offset: [0, props.offset], y: -8 },
  left: { points: ['cr', 'cl'], offset: [-props.offset, 0], x: 8 },
  right: { points: ['cl', 'cr'], offset: [props.offset, 0], x: -8 },
}[props.placement]));
const offset = computed(() => ({ opacity: 0, x: placement.value?.x, y: placement.value?.y }));
let showTimer;
let hideTimer;
function align() {
  nextTick(() => {
    if (!source.value || !target.value || !placement.value) return;
    alignElements(source.value, target.value, {
      points: placement.value.points, offset: placement.value.offset,
      overflow: { adjustX: true, adjustY: true }, useCssTransform: true,
    });
  });
}
function show() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  mounted.value = true;
  showTimer = setTimeout(() => { visible.value = true; align(); }, props.delay);
}
function hide() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    visible.value = false;
    nextTick(() => { mounted.value = false; });
  }, 200);
}
function hideImmediate() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  visible.value = false;
  mounted.value = false;
}
function toggle() {
  if (mounted.value) return hideImmediate();
  mounted.value = visible.value = true;
  align();
}
function keepOpen() { clearTimeout(hideTimer); }
onBeforeUnmount(hideImmediate);
defineExpose({ align, hide, hideImmediate });
</script>

<template>
  <div ref="target" class="inline-block" v-bind="$attrs"
    @click="trigger === 'click' && $slots.content && toggle()"
    @mouseenter="trigger === 'hover' && $slots.content && show()" @mouseleave="trigger === 'hover' && hide()"
    @focus="trigger === 'focus' && $slots.content && show()" @blur="trigger === 'focus' && hide()">
    <slot :hide="hide" />
  </div>
  <Teleport v-if="mounted" to="body">
    <div ref="source" class="absolute inline-block z-4000" @mouseenter="keepOpen" @mouseleave="hide">
      <AnimatePresence>
        <motion.div v-if="visible" class="rx-tooltip-content" :class="tooltipContentClass" :initial="offset"
          :animate="{ opacity: 1, y: 0, x: 0 }" :exit="offset" :transition="{ duration: 0.15 }">
          <slot name="content" :hide="hideImmediate" />
        </motion.div>
      </AnimatePresence>
    </div>
  </Teleport>
</template>
