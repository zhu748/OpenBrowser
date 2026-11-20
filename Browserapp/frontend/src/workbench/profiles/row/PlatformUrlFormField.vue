<script setup>
import { computed, watch } from './workbench-vue.js';
import { r as useForm } from './form-BQBA_XzO.js';
import PlatformUrlSelect from './workbench-platform-url-select.js';

const props = defineProps({
  name: { default: 'platformUrl' }, options: { type: Array, default: () => [] }, darkMode: Boolean,
  placeholder: { default: '' }, icon: { default: '' }, iconDark: { default: '' }, syncKey: { default: '' },
  onIcons: Function, onUrlChange: Function,
});
const emit = defineEmits(['update']);
const form = useForm();
const url = computed(() => String(form?.getFieldState(props.name)?.value ?? ''));
watch(url, value => props.onUrlChange?.(value));
</script>

<template>
  <PlatformUrlSelect :url="url" :icon="icon" :icon-dark="iconDark" :options="options"
    :dark-mode="darkMode" :placeholder="placeholder" :sync-key="syncKey"
    @update:url="emit('update', $event)" @icons="onIcons?.($event)" />
</template>
