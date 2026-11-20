<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { message, request } from '../desktop';
import { listProxies, protocols, proxyAddress, type ProxyRecord, type ProxySummary } from './api';
import ProxyForm from './ProxyForm.vue';

const rows = ref<ProxySummary[]>([]);
const query = ref('');
const protocol = ref('');
const page = ref(1);
const pageSize = 20;
const ready = ref(false);
const busy = ref(false);
const error = ref('');
const notice = ref('');
const editor = ref<{ record: ProxyRecord | null } | null>(null);
const bulk = ref(false);
const addresses = ref('');
const pendingDelete = ref<string | null>(null);
let active = true;

const filtered = computed(() => {
  const term = query.value.trim().toLowerCase();
  return rows.value.filter(row => (!protocol.value || row.protocol === protocol.value)
    && (!term || [row.name, proxyAddress(row), row.remark, row.lastIp].some(value => value?.toLowerCase().includes(term))));
});
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)));
const visible = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize));
watch([query, protocol], () => { page.value = 1; pendingDelete.value = null; });
watch(pages, max => { if (page.value > max) page.value = max; });

async function run(operation: () => Promise<void>) {
  if (!active || busy.value) return;
  busy.value = true;
  error.value = '';
  notice.value = '';
  try { await operation(); }
  catch (failure) { if (active) error.value = message(failure); }
  finally { if (active) busy.value = false; }
}

async function load() {
  const result = await listProxies();
  if (active) { rows.value = result; ready.value = true; }
}

function cancelEditor() {
  editor.value = null;
  bulk.value = false;
  error.value = '';
  notice.value = '';
}

function newProxy() {
  cancelEditor();
  pendingDelete.value = null;
  editor.value = { record: null };
}

function newBulk() {
  cancelEditor();
  pendingDelete.value = null;
  addresses.value = '';
  bulk.value = true;
}

function edit(row: ProxySummary) {
  return run(async () => {
    const record = await request<ProxyRecord>('proxies:read', { id: row.id });
    if (active) { editor.value = { record }; bulk.value = false; pendingDelete.value = null; }
  });
}

function save(fields: Record<string, unknown>) {
  return run(async () => {
    const id = editor.value?.record?.id;
    await request(id ? 'proxies:update' : 'proxies:create', { ...fields, ...(id ? { id } : {}) });
    if (active) { editor.value = null; notice.value = '代理已保存'; await load(); }
  });
}

function saveBulk() {
  return run(async () => {
    const items = addresses.value.split(/\r?\n/).map(raw => raw.trim()).filter(Boolean).map(raw => ({ raw }));
    if (!items.length || items.length > 500) throw new Error('一次可新增 1–500 条代理');
    await request('proxies:create-many', { items });
    if (active) { bulk.value = false; notice.value = `已新增 ${items.length} 条代理`; await load(); }
  });
}

function remove(row: ProxySummary) {
  return run(async () => {
    await request('proxies:delete', { ids: [row.id] });
    if (active) { pendingDelete.value = null; notice.value = '代理已删除'; await load(); }
  });
}

function check(row: ProxySummary) {
  return run(async () => {
    const result = await request<{ ip?: string; ok?: boolean }>('proxies:detect', { id: row.id });
    if (active) {
      notice.value = result.ip ? `检测完成，出口 IP 为 ${result.ip}` : '检测完成，请查看代理状态';
      await load();
    }
  });
}

function exportProxy(row: ProxySummary) {
  return run(async () => {
    const result = await request<{ count?: number; canceled?: boolean }>('proxies:export', { ids: [row.id] });
    if (active && !result.canceled) notice.value = `已导出 ${result.count} 条代理`;
  });
}

onMounted(() => { void run(load); });
onBeforeUnmount(() => { active = false; });
</script>

<template>
  <section class="workspace-page proxy-page" aria-labelledby="proxy-title">
    <header class="page-header">
      <h1 id="proxy-title">代理库</h1>
      <div class="toolbar">
        <button type="button" :disabled="busy || !!editor || bulk" @click="run(load)">刷新列表</button>
        <button type="button" :disabled="busy || !!editor || bulk" @click="newBulk">批量新增</button>
        <button type="button" class="primary" :disabled="busy || !!editor || bulk" @click="newProxy">新增代理</button>
      </div>
    </header>
    <p v-if="error" class="callout danger" role="alert">{{ error }}</p>
    <p v-if="notice" class="callout" role="status">{{ notice }}</p>
    <ProxyForm v-if="editor" :key="editor.record?.id ?? 'new'" :initial="editor.record" :busy="busy" :save="save" :cancel="cancelEditor" />
    <form v-else-if="bulk" class="panel editor proxy-form" aria-labelledby="proxy-bulk-title" @submit.prevent="saveBulk">
      <h2 id="proxy-bulk-title">批量新增代理</h2>
      <label>代理地址<textarea v-model="addresses" :disabled="busy" required rows="5" placeholder="每行一个代理 URL"></textarea></label>
      <div class="toolbar"><button type="submit" class="primary" :disabled="busy || !addresses.trim()">保存代理</button><button type="button" :disabled="busy" @click="cancelEditor">取消</button></div>
    </form>
    <template v-else>
      <div class="toolbar proxy-filters">
        <input v-model="query" aria-label="搜索代理" placeholder="搜索名称、地址或备注">
        <select v-model="protocol" aria-label="筛选协议"><option value="">所有协议</option><option v-for="item in protocols" :key="item" :value="item">{{ item.toUpperCase() }}</option></select>
      </div>
      <div class="panel proxy-inventory" :aria-busy="busy">
        <p v-if="!ready && busy" class="empty-state" role="status">正在读取代理…</p>
        <p v-else-if="ready && !visible.length" class="empty-state">{{ rows.length ? '没有匹配的代理' : '暂无代理' }}</p>
        <ul v-else-if="visible.length" class="proxy-list" aria-label="代理列表">
          <li v-for="row in visible" :key="row.id" class="proxy-row">
            <div class="proxy-identity"><strong>{{ row.name }}</strong><span>{{ row.protocol.toUpperCase() }} · {{ proxyAddress(row) }}</span><small v-if="row.remark">{{ row.remark }}</small></div>
            <div class="proxy-metadata"><span>{{ row.windowCount }} 个窗口</span><small>{{ row.lastCheckOk === true ? row.lastIp || '检测通过' : row.lastCheckOk === false ? '检测失败' : '未检测' }}</small></div>
            <div v-if="pendingDelete === row.id" class="toolbar proxy-row-actions">
              <span>删除这条代理？</span>
              <button type="button" :disabled="busy" @click="pendingDelete = null">取消</button>
              <button type="button" class="danger" :disabled="busy" @click="remove(row)">确认删除</button>
            </div>
            <div v-else class="toolbar proxy-row-actions">
              <button type="button" :disabled="busy" @click="check(row)">检测</button>
              <button type="button" :disabled="busy" @click="edit(row)">编辑</button>
              <button type="button" :disabled="busy" @click="exportProxy(row)">导出（含认证）</button>
              <button type="button" class="danger" :disabled="busy" @click="pendingDelete = row.id">删除</button>
            </div>
          </li>
        </ul>
        <footer v-if="ready && pages > 1" class="toolbar table-footer">
          <span>{{ page }} / {{ pages }}</span>
          <button type="button" :disabled="page <= 1 || busy" @click="page--">上一页</button>
          <button type="button" :disabled="page >= pages || busy" @click="page++">下一页</button>
        </footer>
      </div>
    </template>
  </section>
</template>
