<script setup>
import { computed, onMounted, ref, toRaw } from 'vue';
import { pi as isWindows } from './utils-BIWenCnY.js';
import { t as upperFirst } from './upperFirst-BFdaJQ3h.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as TextInput } from './inputtext-Crzvb5jQ.js';
import { t as Message } from './message-SBZQdXpt.js';

const props = defineProps({ modelValue: { type: Object, required: true } });
defineEmits(['update:modelValue']);
defineExpose({ valid });

const platform = isWindows ? 'windows' : 'mac';
const shortcuts = computed(() => props.modelValue[platform]);
const conflicts = ref({});
const pending = new Map();
const modifiers = [
  ['metaKey', 'Cmd'], ['ctrlKey', 'Ctrl'], ['shiftKey', 'Shift'], ['altKey', 'Alt'],
];
const supported = new Set([
  ...Array.from({ length: 24 }, (_, index) => 'F' + (index + 1)),
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ',
  ...'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()-_=+[]{}\\|;:\'" ,<>./?'.replace(' ', ''),
]);
const actions = [
  { key: 'stopSync', label: '停止同步' },
  { key: 'showAllWindows', label: '显示所有窗口' },
  { key: 'gridLayout', label: '宫格布局' },
  { key: 'stackLayout', label: '堆叠布局' },
  { key: 'openBatchInputDialog', label: '批量输入' },
  { key: 'unifiedTabs', label: '统一标签页' },
  { key: 'closeOtherTabs', label: '关闭其他标签页' },
  { key: 'closeCurrentTab', label: '关闭当前标签页' },
  { key: 'closeBlankTabs', label: '关闭空白标签页' },
  { key: 'openSites', label: '打开网址' },
  { key: 'openSyncWindowList', label: '同步窗口列表' },
  { key: 'openPreferenceSettings', label: '同步偏好设置' },
];
const duplicates = computed(() => {
  const values = Object.values(shortcuts.value);
  return new Set(values.filter((value, index) => value && values.indexOf(value) !== index));
});

function clear(key) {
  shortcuts.value[key] = '';
  delete conflicts.value[key];
}

function updateShortcut(event, key) {
  event.preventDefault();
  const input = upperFirst(event.key);
  if (!supported.has(input)) return;
  const prefix = modifiers.filter(([property]) => event[property]).map(([, label]) => label);
  const accelerator = [...prefix, input === ' ' ? 'Space' : input].join(' + ');
  shortcuts.value[key] = accelerator;
  void check({ [platform]: { [key]: accelerator } }).catch(error => console.warn(error));
}

function check(settings) {
  const expected = { ...settings[platform] };
  const operation = globalThis.electronAPI.send('syncControl:checkShortcutKeysIsOccupied', settings);
  for (const key of Object.keys(expected)) pending.set(key, operation);
  return operation.then(result => {
    for (const [key, conflict] of Object.entries(result ?? {})) {
      if (pending.get(key) === operation && shortcuts.value[key] === expected[key]) {
        conflicts.value[key] = conflict;
      }
    }
  }).finally(() => {
    for (const key of Object.keys(expected)) {
      if (pending.get(key) === operation) pending.delete(key);
    }
  });
}

function occupied(key) {
  const conflict = conflicts.value[key];
  return Boolean(conflict?.accelerator && conflict?.status === false);
}

async function valid() {
  if (duplicates.value.size || Object.values(shortcuts.value).some(value => value.endsWith(' + '))) return false;
  try {
    await check(toRaw(props.modelValue));
    return !duplicates.value.size && !Object.keys(shortcuts.value).some(occupied);
  } catch (error) {
    console.warn(error);
    return false;
  }
}

onMounted(() => {
  if (Object.values(shortcuts.value).every(value => !value.endsWith(' + '))) {
    void check(toRaw(props.modelValue)).catch(error => console.warn(error));
  }
});
</script>

<template>
  <div class="keyboard-shortcut">
    <div v-for="action in actions" :key="action.key" class="form-item">
      <label class="form-item-label">{{ $t(action.label) }}</label>
      <div class="form-item-content">
        <div class="form-item-content-input">
          <TextInput v-model="shortcuts[action.key]" type="text" :placeholder="$t('设置快捷键')" size="small" :invalid="occupied(action.key)" @keydown="updateShortcut($event, action.key)" />
          <Button icon="base/rx_ic_delete" severity="secondary" size="xxs" outlined @click="clear(action.key)" />
        </div>
        <Message v-if="occupied(action.key)" size="small" severity="error" variant="simple" class="error-message">
          {{ $t('和系统快捷键冲突，请调整') }}
        </Message>
        <Message v-else-if="duplicates.has(shortcuts[action.key])" size="small" severity="error" variant="simple" class="error-message">
          {{ $t('和其他快捷键冲突，请调整') }}
        </Message>
      </div>
    </div>
  </div>
</template>
