<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from './workbench-vue.js';
import { t as alignPopup } from './dist-web-BSWtPfDO.js';
import { n as motion } from './motion-BwnyBP9B.js';
import { t as AnimatePresence } from './AnimatePresence-d-29l3Fb.js';

const props = defineProps({
  content: String,
  trigger: { type: String, default: 'hover' },
  placement: { type: String, default: 'top' },
  offset: { type: Number, default: 8 },
  showArrow: { type: Boolean, default: true },
  disabled: Boolean,
  contentClass: null,
  triggerClass: null,
  zIndex: { type: Number, default: 70 },
  showDelay: { type: Number, default: 200 },
  hideDelay: { type: Number, default: 120 },
});
const emit = defineEmits(['openChange']);
const triggerRef = useTemplateRef('triggerRef');
const popupRef = useTemplateRef('popupRef');
const mounted = ref(false);
const visible = ref(false);
const arrowOffset = ref('50%');
let showTimer;
let hideTimer;
let listenTimer;
let alignFrame;

const above = computed(() => props.placement.startsWith('top'));
const placement = computed(() => {
  const leading = props.placement.endsWith('-start');
  return {
    points: above.value ? (leading ? ['bl', 'tl'] : ['bc', 'tc']) : (leading ? ['tl', 'bl'] : ['tc', 'bc']),
    offset: [0, above.value ? -props.offset : props.offset],
    initial: { opacity: 0, y: above.value ? 8 : -8, scale: 0.98 },
    transformOrigin: (leading ? 'left ' : 'center ') + (above.value ? 'bottom' : 'top'),
  };
});

function align() {
  const popup = popupRef.value;
  const trigger = triggerRef.value;
  if (!popup || !trigger) return;

  alignPopup(popup, trigger, {
    points: placement.value.points, offset: placement.value.offset, targetOffset: [0, 0],
    overflow: { adjustX: true, adjustY: false }, useCssTransform: true, ignoreShake: true,
  });
  const content = props.showArrow && popup.querySelector('.agent-tooltip__content');
  if (!content) return;
  const anchor = trigger.getBoundingClientRect();
  const position = anchor.left + anchor.width / 2 - popup.getBoundingClientRect().left;
  arrowOffset.value = Math.min(Math.max(position, 10), Math.max(10, content.offsetWidth - 10)) + 'px';
}

function scheduleAlignment() {
  if (!mounted.value || !visible.value) return;
  cancelAnimationFrame(alignFrame);
  alignFrame = requestAnimationFrame(align);
}

function open() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  if (props.disabled || visible.value) return;
  mounted.value = true;
  visible.value = true;
  emit('openChange', true);
  nextTick(scheduleAlignment);
}
function close() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  if (!mounted.value) return;
  visible.value = false;
  emit('openChange', false);
  hideTimer = setTimeout(() => { mounted.value = false; }, 160);
}
function onClick(event) {
  if (props.trigger !== 'click') return;
  event.stopPropagation();
  if (visible.value) close();
  else open();
}
function onEnter() {
  if (props.trigger !== 'hover') return;
  clearTimeout(hideTimer);
  if (props.disabled || visible.value) return;
  clearTimeout(showTimer);
  if (props.showDelay > 0) showTimer = setTimeout(open, props.showDelay);
  else open();
}
function onLeave() {
  if (props.trigger !== 'hover') return;
  clearTimeout(showTimer);
  if (props.hideDelay <= 0) close();
  else {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(close, props.hideDelay);
  }
}
function closeOnOutsideClick(event) {
  const path = event.composedPath();
  if (!path.includes(triggerRef.value) && !path.includes(popupRef.value)) close();
}

watch(visible, show => {
  clearTimeout(listenTimer);
  document.removeEventListener('pointerdown', closeOnOutsideClick, true);
  if (show && props.trigger === 'click') {
    listenTimer = setTimeout(() => document.addEventListener('pointerdown', closeOnOutsideClick, true));
  }
});
watch(() => props.content, scheduleAlignment, { flush: 'post' });
onMounted(() => {
  window.addEventListener('resize', scheduleAlignment);
  window.addEventListener('scroll', scheduleAlignment, true);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleAlignment);
  window.removeEventListener('scroll', scheduleAlignment, true);
  document.removeEventListener('pointerdown', closeOnOutsideClick, true);
  cancelAnimationFrame(alignFrame);
  clearTimeout(listenTimer);
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
});
defineExpose({ open, close, align });
</script>

<template>
  <span ref="triggerRef" class="agent-tooltip__trigger" :class="triggerClass" @click="onClick"
    @mouseenter="onEnter" @mouseleave="onLeave">
    <slot :open="open" :close="close" />
  </span>
  <Teleport to="body">
    <div v-if="mounted" ref="popupRef" class="agent-tooltip__popup" :style="{ zIndex }" @click.stop
      @mouseenter="onEnter" @mouseleave="onLeave">
      <AnimatePresence mode="wait">
        <motion.div v-if="visible" class="agent-tooltip__content" :class="contentClass"
          :style="{ transformOrigin: placement.transformOrigin, '--agent-tooltip-arrow-x': arrowOffset }"
          :initial="placement.initial" :animate="{ opacity: 1, y: 0, scale: 1 }" :exit="placement.initial"
          :transition="{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }">
          <slot name="content" :close="close"><span>{{ content }}</span></slot>
          <span v-if="showArrow" class="agent-tooltip__arrow"
            :class="above ? 'agent-tooltip__arrow--top' : 'agent-tooltip__arrow--bottom'" />
        </motion.div>
      </AnimatePresence>
    </div>
  </Teleport>
</template>
