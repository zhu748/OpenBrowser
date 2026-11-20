<script setup>
import { computed } from 'vue';
import { t as Skeleton } from './skeleton-CcmFVUhV.js';

const props = defineProps({ rows: { type: Number, default: 5 }, variant: { type: String, default: 'tasks' } });
const tasks = [
  ['15%', '56px', '78%'], ['15%', '56px', '72%', 'badge'], ['14%', '56px', '60%'], ['12%', '56px', '84%'],
  ['16%', '56px', '70%'], ['13%', '28px', '64px', 'status'], ['15%', '28px', '68px', 'actions'],
];
const activity = [
  ['13%', '28px', '80%'], ['12%', '28px', '86%', 'badge'], ['13%', '28px', '58%'], ['16%', '28px', '76%'],
  ['11%', '56px', '88%'], ['11%', '56px', '88%'], ['12%', '28px', '64px', 'status'], ['12%', '28px', '68px', 'actions'],
];
const columns = computed(() => props.variant === 'activity' ? activity : tasks);
</script>

<template>
  <div class="task-table-skeleton" :class="'task-table-skeleton--' + variant" role="status" aria-busy="true">
    <span class="sr-only">{{ $t('加载中...') }}</span>
    <table class="task-table-skeleton__table" aria-hidden="true">
      <colgroup><col v-for="([width], index) in columns" :key="index" :style="{ width }"></colgroup>
      <thead><tr><th v-for="([, width], index) in columns" :key="index" scope="col"><Skeleton :width="width" height="14px" border-radius="4px" /></th></tr></thead>
      <tbody>
        <tr v-for="row in rows" :key="row">
          <td v-for="([, , width, kind], index) in columns" :key="index">
            <div v-if="kind === 'actions'" class="task-table-skeleton__actions">
              <Skeleton :width="width" height="32px" border-radius="10px" /><Skeleton width="28px" height="28px" border-radius="8px" />
            </div>
            <Skeleton v-else-if="kind === 'status'" :width="width" height="24px" border-radius="999px" />
            <Skeleton v-else-if="kind === 'badge'" :width="width" height="24px" border-radius="8px" />
            <Skeleton v-else :width="width" height="14px" border-radius="4px" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
