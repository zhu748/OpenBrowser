<script setup>
import { computed } from './workbench-vue.js';
import { s as useCssVars, t as Transition } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  type: { default: 'success' }, title: {}, content: {}, closable: { type: Boolean, default: true },
  announcement: Boolean, breathing: Boolean, breathingDuration: { default: 2400 },
});
const visible = defineModel('visible', { type: Boolean, default: true });
const emit = defineEmits(['close']);
const variants = { success: 'status/rx_ic_check_fill', error: 'base/rx_ic_delete_fill', info: 'base/rx_ic_info_fill', warn: 'base/rx_ic_warn_fill' };
const variant = computed(() => Object.hasOwn(variants, props.type) ? props.type : 'info');
const status = computed(() => variant.value === 'warn' ? 'warning' : variant.value);
const tone = computed(() => `var(--colors-icon-icon-${status.value})`);
const breathingStyle = computed(() => props.breathing ? {
  '--rx-alert-breath-color': tone.value, '--rx-alert-breath-thickness': '1.5px', '--rx-alert-breath-glow': '14px',
  '--rx-alert-breath-duration': typeof props.breathingDuration === 'number' ? props.breathingDuration + 'ms' : props.breathingDuration,
} : undefined);
useCssVars(() => ({
  v0360f984: props.announcement ? 'center' : 'flex-start',
  v94fbd616: `var(--component-alert-bg-${variant.value})`,
  v407441ee: props.announcement ? `var(--component-alert-announcement-border-${status.value})` : `var(--component-alert-bg-${variant.value})`,
  v50fe5c98: props.announcement ? `var(--component-alert-announcement-text-${status.value})` : 'var(--colors-text-text-primary)',
}));
function close() {
  visible.value = false;
  emit('close');
}
</script>

<template>
  <Transition>
    <div v-if="visible" class="rx-alert" :class="{ 'rx-alert--breathing': breathing, 'rx-alert--announcement': announcement }"
      :style="breathingStyle" v-bind="$attrs">
      <slot name="tips-icon"><Icon class="mt-0.25" :name="variants[variant]" :color="tone" /></slot>
      <div class="rx-alert-body">
        <div v-if="title || $slots.title" class="rx-alert__title"><slot name="title">{{ title }}</slot></div>
        <div v-if="content || $slots.content" class="rx-alert__content"><slot name="content">{{ content }}</slot></div>
      </div>
      <button v-if="closable" type="button" class="rx-alert-close" :aria-label="$t('关闭')" @click="close">
        <slot name="close-icon"><Icon name="base/rx_ic_delete" aria-hidden="true" /></slot>
      </button>
      <template v-if="breathing">
        <span class="rx-alert__breath rx-alert__breath-ring" aria-hidden="true"></span>
        <span class="rx-alert__breath rx-alert__breath-glow" aria-hidden="true"></span>
      </template>
    </div>
  </Transition>
</template>
