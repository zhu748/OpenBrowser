<script setup>
import { computed } from './workbench-vue.js';
import { i as Select } from './contextmenu-BBjizTDn.js';
import { t as Paginator } from './paginator-vnwyVxKC.js';

const props = defineProps({
  cacheKey: { default: '' }, totalRecords: { default: 0 }, rowOptions: { default: () => [5, 10, 20, 50, 100, 500] },
});
const first = defineModel('first', { default: 0 });
const rows = defineModel('rows', { default: 10 });
const emit = defineEmits(['update']);
const options = computed(() => props.rowOptions.map(count => ({ label: $t('{count} 条/页', { count }), value: count })));
function changeSize({ value }) {
  if (props.cacheKey && value) localStorage.setItem('table:' + props.cacheKey, value);
  first.value = 0;
  emit('update');
}
</script>

<template>
  <Paginator v-model:first="first" class="paginator" :rows="rows" :total-records="totalRecords" :page-link-size="5"
    template="JumpToPageInput PrevPageLink PageLinks NextPageLink" @page="emit('update')">
    <template #start>
      <div class="flex flex-1 items-center paginator-jump">
        <div>{{ $t('总计 {total} 个', { total: totalRecords }) }}</div>
        <Select v-model="rows" class="!w-fit" name="rowsPerPage" :options="options" option-value="value" size="xxs" :filter="false" @change="changeSize" />
        <div class="flex-1 flex items-center gap-2 justify-end">{{ $t('跳转页数至') }}</div>
      </div>
    </template>
  </Paginator>
</template>
