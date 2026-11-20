<script>
let nextPopLayoutId = 0;
</script>
<script setup>
import { computed, onMounted, onUnmounted } from './workbench-vue.js';
import { n as TransitionGroup, t as Transition } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { i as useMotionConfig, o as animationFrame, r as providePresence } from './motion-BwnyBP9B.js';

const props = defineProps({
  mode: { default: 'sync' }, initial: { type: Boolean, default: true }, as: {}, custom: {},
  onExitComplete: Function, anchorX: { default: 'left' },
});
const bindings = computed(() => props.mode === 'wait' ? { mode: 'out-in' } : { tag: props.as });
const motion = useMotionConfig();
const registered = new Set();
const exits = new Map();
let mounted = false;

providePresence({
  get initial() { return mounted ? undefined : props.initial; },
  get custom() { return props.custom; },
  register: feature => registered.add(feature),
  unregister: feature => registered.delete(feature),
});
onMounted(() => { mounted = true; });
function states(element) {
  return [...registered].filter(feature => feature.element && (feature.element === element || element.contains(feature.element)));
}
function popLayout(element) {
  if (props.mode !== 'popLayout' || !(element instanceof HTMLElement)) return;
  const id = 'pop-' + nextPopLayoutId++;
  const style = document.createElement('style');
  if (motion.value.nonce) style.nonce = motion.value.nonce;
  element.dataset.motionPopId = id;
  const { offsetHeight: height, offsetWidth: width, offsetTop: top, offsetLeft: left } = element;
  const right = (element.offsetParent?.offsetWidth ?? 0) - width - left;
  const anchor = props.anchorX === 'left' ? 'left: ' + left : 'right: ' + right;
  document.head.append(style);
  style.sheet?.insertRule(`
    [data-motion-pop-id="${id}"] { position:absolute!important; width:${width}px!important;
      height:${height}px!important; top:${top}px!important; ${anchor}px!important; }
  `);
  return style;
}
function release(exit) {
  if (exit?.style) animationFrame.render(() => exit.style.remove());
}
function enter(element, done) {
  release(exits.get(element));
  exits.delete(element);
  for (const feature of states(element)) feature.getFeature('exit')?.reenter();
  done();
}
async function leave(element, done) {
  const active = states(element);
  if (!active.length) {
    done();
    props.onExitComplete?.();
    return;
  }
  const exit = { active, style: popLayout(element) };
  exits.set(element, exit);
  await Promise.allSettled(active.map(feature => feature.getFeature('exit')?.exit()));
  if (exits.get(element) !== exit) return;
  exits.delete(element);
  release(exit);
  for (const feature of active) feature.getSnapshot(false);
  done();
  if (!element.isConnected) for (const feature of active) feature.unmount();
  props.onExitComplete?.();
}
onUnmounted(() => {
  for (const exit of exits.values()) {
    release(exit);
    for (const feature of exit.active) feature.unmount();
  }
  exits.clear();
});
</script>

<template>
  <component :is="mode === 'wait' ? Transition : TransitionGroup" v-bind="bindings" appear :css="false" @enter="enter" @leave="leave">
    <slot />
  </component>
</template>
