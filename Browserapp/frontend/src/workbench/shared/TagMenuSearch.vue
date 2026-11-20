<script setup>
import { ref, useTemplateRef } from './workbench-vue.js';
import { t as Input } from './m-input-text-JVbCgVJP.js';

const props = defineProps({ empty: Boolean, filterOptions: Function, placeholder: {} });
const input = useTemplateRef('input');
const query = ref('');
const empty = ref(props.empty);
function update(value) {
  query.value = value ?? '';
  empty.value = props.filterOptions?.(query.value) ?? props.empty;
}
defineExpose({ focus: () => input.value?.focus() });
</script>

<template>
  <div class="min-w-60" @click.stop @keydown.stop>
    <div class="px-2.5 pt-2.5 pb-2" :class="{ 'border-0 border-b-1 border-solid border-[var(--component-dropdown-divider)]': !empty }">
      <Input ref="input" :model-value="query" size="xs" pre-icon="base/rx_ic_magnify" autocomplete="off"
        :placeholder="placeholder || $t('搜索标签或成员')" @update:model-value="update" />
    </div>
    <div v-if="empty" class="px-3 py-6 text-center text-3 text-[var(--colors-text-text-secondary)]">{{ $t('暂无数据') }}</div>
  </div>
</template>
