<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { message } from '../desktop';
import { queryProfiles, type ProfileRow } from '../profiles/api';

const props = defineProps<{ disabled?: boolean }>();
const selection = defineModel<string[]>({ required: true });
const rows = ref<ProfileRow[]>([]);
const query = ref('');
const term = ref('');
const currentPage = ref(1);
const total = ref(0);
const loading = ref(false);
const error = ref('');
const size = 20;
let revision = 0;

async function load(page: number) {
  const version = ++revision;
  loading.value = true;
  error.value = '';
  try {
    const result = await queryProfiles(page, size, term.value, false);
    if (version !== revision) return;
    rows.value = result.rows;
    total.value = result.total;
    currentPage.value = page;
  } catch (failure) {
    if (version === revision) error.value = message(failure);
  } finally {
    if (version === revision) loading.value = false;
  }
}

function filter() {
  term.value = query.value.trim();
  void load(1);
}

onMounted(() => { void load(1); });
onBeforeUnmount(() => { revision++; });
</script>

<template>
  <div class="toolbar">
    <input v-model="query" aria-label="搜索关联窗口" placeholder="搜索窗口名称" :disabled="props.disabled" @keydown.enter.prevent="filter">
    <button type="button" :disabled="props.disabled || loading" @click="filter">搜索窗口</button>
    <span role="status">已选择 {{ selection.length }} 个窗口</span>
  </div>
  <p v-if="error" role="alert" class="danger">{{ error }}</p>
  <fieldset class="checklist" :disabled="props.disabled">
    <legend>关联窗口</legend>
    <p v-if="loading" role="status">正在加载窗口…</p>
    <p v-else-if="!rows.length">暂无匹配窗口</p>
    <label v-for="row in rows" :key="row.id">
      <input v-model="selection" type="checkbox" :value="row.id"
        :disabled="selection.length >= 200 && !selection.includes(row.id)">
      <span>{{ row.windowName }}<small v-if="row.windowSortNum"> · OPE-{{ row.windowSortNum }}</small></span>
    </label>
  </fieldset>
  <div class="toolbar">
    <button type="button" :disabled="props.disabled || loading || currentPage <= 1" @click="load(currentPage - 1)">上一页窗口</button>
    <button type="button" :disabled="props.disabled || loading || currentPage * size >= total" @click="load(currentPage + 1)">下一页窗口</button>
  </div>
</template>
