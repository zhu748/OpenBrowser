<script setup>
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from './workbench-vue.js';
import { ui as mac } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Input } from './m-input-text-JVbCgVJP.js';

const props = defineProps({
  options: { type: Array, default: () => [] }, search: Function, clear: Function,
  query: { type: String, default: '' },
});
const options = computed(() => props.options.map(option => ({
  ...option, text: $t('搜索{label} {value}', { value: '{value}', label: option.label }),
})));
const input = useTemplateRef('input');
const query = ref(props.query);
const active = ref(null);
const expanded = ref(false);
const loading = ref(false);
const focused = ref(false);
const applied = ref(!!props.query.trim());
const highlighted = ref(0);
let blurTimer;
const shortcut = mac ? '⌘ + F' : 'Ctrl + F';
const displayedValue = computed(() => stripPrefix(query.value) || query.value);

function stripPrefix(value) {
  return value.match(/^\w+::(.*)$/)?.[1] ?? value;
}

function optionFrom(value) {
  const prefix = value.match(/^\w+::/)?.[0];
  return options.value.find(option => option.syntax === prefix);
}

watch(query, value => {
  const index = options.value.indexOf(optionFrom(value));
  highlighted.value = Math.max(0, index + 1);
});

function onShortcut(event) {
  if ((mac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === 'f') {
    event.preventDefault();
    input.value?.focus();
  }
}
onMounted(() => {
  document.addEventListener('keydown', onShortcut);
  if (props.query) active.value = optionFrom(props.query);
});
onUnmounted(() => {
  clearTimeout(blurTimer);
  document.removeEventListener('keydown', onShortcut);
});

function reset() {
  query.value = '';
  active.value = null;
  expanded.value = false;
  if (!applied.value) return;
  applied.value = false;
  props.clear?.();
}

async function submit() {
  input.value?.blur();
  loading.value = true;
  applied.value = true;
  const syntax = active.value?.syntax;
  const value = syntax && query.value.startsWith(syntax) ? query.value.slice(syntax.length) : query.value;
  try {
    await props.search?.({ ...active.value, value });
  } finally {
    loading.value = false;
  }
}

function choose(option) {
  const value = stripPrefix(query.value);
  active.value = option;
  query.value = (option?.syntax ?? '') + value;
  expanded.value = false;
  return submit();
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    expanded.value = false;
    return;
  }
  const size = options.value.length + 1;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    expanded.value = true;
    const step = event.key === 'ArrowDown' ? 1 : -1;
    highlighted.value = (highlighted.value + step + size) % size;
  } else if (event.key === 'Enter') {
    event.preventDefault();
    choose(options.value[highlighted.value - 1]);
  }
}

function focus() {
  clearTimeout(blurTimer);
  focused.value = true;
  expanded.value = true;
}
function blur() {
  clearTimeout(blurTimer);
  blurTimer = setTimeout(() => { expanded.value = false; focused.value = false; }, 150);
}
</script>

<template>
  <div class="relative transition-all duration-300 ease" :class="query || focused ? 'w-50' : 'w-35'">
    <Input ref="input" v-model="query" class="!h-6.5" size="xxs" pre-icon="base/rx_ic_magnify"
      :placeholder="$t('搜索 {shortcut}', { shortcut })" :disabled="loading" @focus="focus" @blur="blur" @keydown="onKeydown">
      <template v-if="query" #icon><Icon class="cursor-pointer" name="base/rx_ic_delete" size="16" @click="reset" /></template>
    </Input>
    <div v-if="expanded && query" class="absolute z-50 min-w-100 w-full mt-2 overflow-hidden pa-1 dropdown">
      <div class="flex justify-between py-2 pl-2.5 pr-1.5 option" :class="{ hover: highlighted === 0 }"
        @mousedown="choose()" @mouseenter="highlighted = 0">
        <i18n-t tag="div" class="text select-none" scope="global" :keypath="$t('搜索 {value}', { value: '{value}' })">
          <template #value><span class="primary">'{{ displayedValue }}'</span></template>
        </i18n-t>
      </div>
      <template v-if="options.length">
        <div class="py-2 px-2.5 header">{{ $t('高级搜索') }}</div>
        <div v-for="(option, index) in options" :key="option.key" class="flex justify-between py-2 pl-2.5 pr-1.5 option"
          :class="active?.key === option.key ? 'active' : highlighted === index + 1 ? 'hover' : ''"
          @mousedown="choose(option)" @mouseenter="highlighted = index + 1">
          <div class="flex items-center gap-2">
            <Icon :name="option.icon" color="var(--colors-icon-icon-inactive)" size="14" />
            <i18n-t tag="div" class="text select-none" scope="global" :keypath="option.text">
              <template #value><span class="primary">'{{ displayedValue }}'</span></template>
            </i18n-t>
          </div>
          <div class="syntax">{{ option.syntax }}</div>
        </div>
      </template>
    </div>
  </div>
</template>
