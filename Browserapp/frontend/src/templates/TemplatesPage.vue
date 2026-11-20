<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { TemplateActions, TemplateRow } from './api';

const { actions } = defineProps<{ actions: TemplateActions }>();
const rows = ref<TemplateRow[]>([]);
const pending = ref<'load' | 'remove' | 'import' | 'editor' | null>(null);
const confirming = ref<number | null>(null);
const loaded = ref(false);
const error = ref('');
const status = ref('');
let active = true;

onBeforeUnmount(() => { active = false; });

async function run(action: NonNullable<typeof pending.value>, work: () => Promise<void>) {
  if (!active || pending.value) return;
  pending.value = action;
  error.value = '';
  status.value = '';
  try {
    await work();
  } catch (failure) {
    if (active) error.value = failure instanceof Error ? failure.message : String(failure);
  } finally {
    if (active) pending.value = null;
  }
}

async function load() {
  const next = await actions.list();
  if (!active) return;
  rows.value = next;
  loaded.value = true;
}

function remove(row: TemplateRow) {
  return run('remove', async () => {
    await actions.remove(row.id);
    if (!active) return;
    confirming.value = null;
    rows.value = rows.value.filter((item) => item.id !== row.id);
    status.value = `已删除「${row.templateName}」`;
    await load();
  });
}

function importFile() {
  return run('import', async () => {
    const result = await actions.importFile();
    if (!active || 'canceled' in result) return;
    status.value = `已导入 ${result.count} 个窗口`;
    await load();
  });
}

function openEditor(id?: number) {
  return run('editor', () => actions.openEditor(id));
}

onMounted(() => run('load', load));
</script>

<template>
  <section class="page" aria-labelledby="page-title">
    <header class="heading">
      <div>
        <h1 id="page-title">窗口模板</h1>
        <p>在创建窗口时保存配置，之后可从模板重新使用。</p>
      </div>
      <div class="actions">
        <button type="button" :disabled="!!pending" @click="importFile">导入窗口文件</button>
        <button type="button" class="primary" :disabled="!!pending" @click="openEditor()">创建模板</button>
      </div>
    </header>

    <div v-if="error" class="message error" role="alert">{{ error }}</div>
    <p v-if="status" class="message" role="status">{{ status }}</p>

    <section class="collection" aria-labelledby="collection-title" :aria-busy="!!pending">
      <header class="collection-heading">
        <h2 id="collection-title">已保存的模板</h2>
        <button type="button" class="quiet" :disabled="!!pending" @click="run('load', load)">刷新列表</button>
      </header>
      <p v-if="pending === 'load' && !loaded" class="empty" role="status">正在读取模板…</p>
      <p v-else-if="loaded && !rows.length" class="empty">暂无模板</p>
      <ul v-if="rows.length" aria-label="模板列表">
        <li v-for="row in rows" :key="row.id">
          <span class="template-name">{{ row.templateName }}</span>
          <div v-if="confirming === row.id" class="actions" :aria-label="`删除「${row.templateName}」`">
            <span class="confirm-text">确认删除此模板？</span>
            <button type="button" :disabled="!!pending" @click="confirming = null">取消</button>
            <button type="button" class="danger" :disabled="!!pending" @click="remove(row)">确认删除</button>
          </div>
          <div v-else class="actions">
            <button type="button" class="quiet" :disabled="!!pending" @click="openEditor(row.id)">使用 / 修改</button>
            <button type="button" class="quiet danger" :disabled="!!pending" @click="confirming = row.id">删除</button>
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>
