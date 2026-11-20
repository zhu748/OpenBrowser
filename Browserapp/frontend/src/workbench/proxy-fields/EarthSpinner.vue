<script setup>
import { computed } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
const props = defineProps({
  duration: { default: 3.5 }, size: { default: 24 }, autoplay: { type: Boolean, default: true }, hoverPause: Boolean, color: {},
});
const frames = 7;
const styles = computed(() => ({
  '--erh-size': typeof props.size === 'number' ? props.size + 'px' : props.size,
  '--erh-frames': frames, '--erh-duration': props.duration + 's',
}));
</script>

<template>
  <div class="erh" :class="{ 'is-paused': !autoplay, 'is-hover-pause': hoverPause }" :style="styles">
    <div class="erh-track">
      <Icon v-for="frame in frames" :key="frame" :name="'other/earth' + frame" :size="size" :color="color" />
    </div>
  </div>
</template>
