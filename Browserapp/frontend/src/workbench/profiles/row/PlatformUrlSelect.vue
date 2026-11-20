<script setup>
import { computed, provide, ref, watch } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Select } from './m-input-select-C8pih1gY.js';
import { matchPlatform, optionsWithIcons } from './workbench-platform-account-fields.js';

const props = defineProps({
  url: { default: '' }, icon: { default: '' }, iconDark: { default: '' }, options: { type: Array, default: () => [] },
  darkMode: Boolean, placeholder: { default: '' }, syncKey: { default: '' },
});
const emit = defineEmits(['update:url', 'icons']);
provide('$pcFormField', null);
const selected = ref('');
const pendingOptions = ref(false);
const customIcon = ref(false);
const iconOptions = computed(() => optionsWithIcons(props.options));
const selectedOption = computed(() => iconOptions.value.find(option => option.value === selected.value));
function image(option) {
  return (props.darkMode && option?.darkImage) || option?.image || '';
}
const activeImage = computed(() => customIcon.value
  ? props.darkMode ? props.iconDark || props.icon : props.icon || props.iconDark
  : image(selectedOption.value));
function existingIcon() {
  return iconOptions.value.find(option => props.icon && option.image === props.icon || props.iconDark && option.darkImage === props.iconDark);
}
function matchingIcon(url) {
  const option = matchPlatform(url, props.options);
  return option?.value && (option.image || option.darkImage) ? option.value : '';
}
function iconPayload(value, fromUser) {
  const option = props.options.find(item => item.value === value);
  return { platformIcon: option?.image || '', platformIconDark: option?.darkImage || '', fromUser };
}
function sync() {
  if (!props.options.length) return;
  if (pendingOptions.value) {
    pendingOptions.value = false;
    selectIcon(matchingIcon(props.url));
    return;
  }
  const option = existingIcon();
  if ((props.icon || props.iconDark) && !option) {
    customIcon.value = true;
    selected.value = '';
    return;
  }
  customIcon.value = false;
  selected.value = option?.value || matchingIcon(props.url);
  const update = iconPayload(selected.value, false);
  if (update.platformIcon !== props.icon || update.platformIconDark !== props.iconDark) emit('icons', update);
}
watch(() => props.options, sync, { immediate: true });
watch(() => props.syncKey, sync);
function selectIcon(value) {
  customIcon.value = false;
  selected.value = typeof value === 'string' ? value : '';
  emit('icons', iconPayload(selected.value, true));
}
function onUrl(value) {
  const url = typeof value === 'string' ? value : '';
  emit('update:url', url);
  if (props.options.length) selectIcon(matchingIcon(url));
  else pendingOptions.value = true;
}
</script>

<template>
  <div class="platform-url-select">
    <Select class="platform-url-select__icon" :model-value="selected" :options="iconOptions" option-value="value"
      :show-dropdown-icon="false" :dark-mode="darkMode" @update:model-value="selectIcon">
      <template #placeholder>
        <span class="inline-flex w-full items-center justify-center"><Icon name="base/rx_ic_user_key" color="var(--colors-icon-icon-tertiary)" /></span>
      </template>
      <template #value>
        <span class="inline-flex w-full items-center justify-center">
          <img v-if="activeImage" class="selectitem__image" :src="activeImage" alt="" />
          <Icon v-else name="base/rx_ic_user_key" color="var(--colors-icon-icon-tertiary)" />
        </span>
      </template>
      <template #option="{ option }">
        <span class="inline-flex w-full items-center justify-center">
          <img v-if="image(option)" class="selectitem__image" :src="image(option)" alt="" />
        </span>
      </template>
    </Select>
    <Select class="platform-url-select__url" :model-value="url" :options="options" option-value="value" editable
      :dark-mode="darkMode" :placeholder="placeholder" @update:model-value="onUrl" />
  </div>
</template>
