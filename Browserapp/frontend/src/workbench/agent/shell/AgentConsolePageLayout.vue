<script setup>
import { computed, ref, Transition } from './workbench-vue.js';
import ProfileMonitorToggle from './workbench-profile-monitor-toggle.js';

const props = defineProps({
  contentDisplay: { type: String, default: 'block' },
  contentDirection: { type: String, default: 'column' },
  alignItems: { type: String, default: 'initial' },
  justifyContent: { type: String, default: 'initial' },
  overflow: { type: String, default: 'hidden' },
  padding: { type: String, default: '66px 23px 40px' },
  mobilePadding: String,
  title: String,
  showProfileMonitorToggle: { type: Boolean, default: true },
  profileMonitorToggleLabel: String,
  profileMonitorToggleVariant: { type: String, default: 'pill' },
});
const emit = defineEmits(['scroll']);
const panelStyle = computed(() => ({
  '--agent-console-page-padding': props.padding,
  '--agent-console-page-mobile-padding': props.mobilePadding ?? props.padding,
  '--agent-console-page-display': props.contentDisplay,
  '--agent-console-page-direction': props.contentDirection,
  '--agent-console-page-align': props.alignItems,
  '--agent-console-page-justify': props.justifyContent,
}));
const headerVisible = ref(false);

function handleScroll(event) {
  const panel = event.target;
  if (!props.title || !(panel instanceof HTMLElement) || !panel.matches('[data-agent-page-scroll]')) return;
  emit('scroll', event);
  headerVisible.value = panel.scrollHeight > panel.clientHeight + 1 && panel.scrollTop > 100;
}
</script>

<template>
  <main class="agent-console-page-layout"
    :class="[`agent-console-page-layout--${overflow}`, { 'agent-console-page-layout--with-header': title }]"
    @scroll.capture.passive="handleScroll">
    <Transition name="agent-console-page-layout__header">
      <header v-if="title && headerVisible" class="agent-console-page-layout__header">
        <h1>{{ title }}</h1>
        <ProfileMonitorToggle v-if="showProfileMonitorToggle" class="agent-console-page-layout__monitor"
          :variant="profileMonitorToggleVariant" />
      </header>
    </Transition>
    <section class="agent-console-page-layout__panel" data-agent-page-scroll :style="panelStyle">
      <ProfileMonitorToggle v-if="showProfileMonitorToggle" class="agent-console-page-layout__floating-monitor"
        :class="{ 'is-hidden': headerVisible }" :variant="profileMonitorToggleVariant" />
      <slot />
    </section>
    <slot name="overlay" />
  </main>
</template>
