<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { message } from '../desktop';
import type { Family, KernelActions, KernelRow } from './api';

const { actions } = defineProps<{ actions: KernelActions }>();
const rows = ref<KernelRow[]>([]);
const loaded = ref(false);
const family = ref<Family>('chromium');
const versions = ref<string[]>([]);
const version = ref('');
const custom = ref('');
const busy = ref<'read' | 'change' | 'download' | null>(null);
const finding = ref(false);
const cancelling = ref(false);
const error = ref('');
const catalogError = ref('');
const status = ref('');
const confirmDelete = ref<KernelRow | null>(null);
let active = true;
let catalogRequest = 0;
let inventoryChanged = false;
let unsubscribe: (() => void) | undefined;

watch(family, () => {
  catalogRequest += 1;
  finding.value = false;
  catalogError.value = '';
  versions.value = [];
  version.value = '';
}, { flush: 'sync' });

async function findVersions() {
  if (finding.value) return;
  const id = ++catalogRequest;
  finding.value = true;
  catalogError.value = '';
  try {
    const result = await actions.versions(family.value);
    if (active && id === catalogRequest) {
      versions.value = result;
      version.value = result[0] ?? '';
      if (!result.length) catalogError.value = '没有可下载的版本';
    }
  } catch (failure) {
    if (active && id === catalogRequest) catalogError.value = message(failure);
  } finally {
    if (active && id === catalogRequest) finding.value = false;
  }
}

async function load() {
  const result = await actions.list();
  if (!active) return;
  rows.value = result;
  loaded.value = true;
}

async function run(kind: NonNullable<typeof busy.value>, operation: () => Promise<unknown>) {
  if (!active || busy.value) return;
  busy.value = kind;
  error.value = '';
  if (kind !== 'read') status.value = '';
  try { await operation(); }
  catch (failure) { if (active) error.value = message(failure); }
  finally {
    if (active) {
      busy.value = null;
      refreshAfterEvent();
    }
  }
}

function refreshAfterEvent() {
  if (!inventoryChanged || busy.value) return;
  inventoryChanged = false;
  void run('read', load);
}

function change(kind: 'change' | 'download', operation: () => Promise<unknown>, success: string) {
  return run(kind, async () => {
    await operation();
    if (!active) return;
    status.value = success;
    await load();
  });
}

function choose() {
  return run('change', async () => {
    const result = await actions.choose();
    if (!active || result.canceled) return;
    status.value = '已添加本地内核';
    await load();
  });
}

async function cancel() {
  if (cancelling.value) return;
  cancelling.value = true;
  try {
    const result = await actions.cancel();
    if (active) status.value = result.canceled ? '已请求取消下载' : '当前没有正在进行的下载';
  } catch (failure) {
    if (active) error.value = message(failure);
  } finally {
    if (active) cancelling.value = false;
  }
}

function check(row: KernelRow) {
  return run('change', async () => {
    const result = await actions.check(row.engine, row.version);
    if (active) status.value = `${result.version ?? row.version} 内核检测通过`;
  });
}

function remove(row: KernelRow) {
  return change('change', async () => {
    await actions.remove(row.engine, row.version);
    if (active) confirmDelete.value = null;
  }, `已删除 ${row.version}`);
}

onMounted(() => {
  unsubscribe = actions.subscribe(event => {
    if (!active || !['kernel-progress', 'kernel-status', 'kernel-ready'].includes(event.type ?? '')) return;
    if (event.message) status.value = event.message;
    if (event.type === 'kernel-ready' || ['installed', 'done', 'deleted'].includes(event.phase ?? '')) {
      inventoryChanged = true;
      refreshAfterEvent();
    }
  });
  void run('read', load);
});
onBeforeUnmount(() => { active = false; unsubscribe?.(); });
</script>

<template>
  <section class="kernel-page" aria-labelledby="kernel-title">
    <header class="kernel-heading">
      <h1 id="kernel-title">内核管理</h1>
      <button type="button" :disabled="!!busy" @click="run('read', load)">刷新</button>
    </header>
    <p v-if="error" class="kernel-alert" role="alert">{{ error }}</p>
    <p v-if="status" class="kernel-status" role="status">{{ status }}</p>

    <section class="kernel-section" aria-labelledby="download-title">
      <h2 id="download-title">下载内核</h2>
      <div class="kernel-actions">
        <button type="button" class="kernel-primary" :disabled="!!busy" @click="change('download', actions.download, 'Chrome 内核已就绪')">下载 Chrome Stable</button>
        <button type="button" :disabled="cancelling" @click="cancel">取消下载</button>
      </div>
      <div class="kernel-actions">
        <select v-model="family" aria-label="内核类型" :disabled="busy === 'download'">
          <option value="chromium">Chrome</option>
          <option value="firefox">Firefox</option>
        </select>
        <button type="button" :disabled="finding || !!busy" @click="findVersions">获取可下载版本</button>
        <select v-model="version" aria-label="内核版本" :disabled="finding || !!busy || !versions.length">
          <option v-for="value in versions" :key="value" :value="value">{{ value }}</option>
        </select>
        <button type="button" :disabled="!!busy || finding || !version" @click="change('download', () => actions.install(family, version), '所选内核已安装')">安装所选版本</button>
      </div>
      <p v-if="catalogError" class="kernel-alert" role="alert">{{ catalogError }}</p>
    </section>

    <section class="kernel-section" aria-labelledby="local-title">
      <h2 id="local-title">添加本地可执行文件</h2>
      <div class="kernel-actions">
        <input v-model="custom" aria-label="内核路径" placeholder="选择或输入 Chrome / Firefox 可执行文件路径">
        <button type="button" :disabled="!!busy" @click="choose">选择文件</button>
        <button type="button" :disabled="!!busy || !custom.trim()" @click="change('change', () => actions.setCustom(custom.trim()), '已添加本地内核')">使用此内核</button>
      </div>
    </section>

    <section class="kernel-section" aria-labelledby="installed-title" :aria-busy="!!busy">
      <h2 id="installed-title">已安装内核</h2>
      <p v-if="!loaded && !error" role="status">正在读取内核列表…</p>
      <p v-else-if="loaded && !rows.length">尚无可用内核。请下载内核，或选择本地可执行文件。</p>
      <ul v-else-if="rows.length" class="kernel-list">
        <li v-for="row in rows" :key="row.id ?? row.path ?? `${row.engine}:${row.version}`">
          <div><strong>{{ row.engine === 'firefox' ? 'Firefox' : 'Chrome' }} {{ row.version }}</strong>
            <span class="kernel-source">{{ row.primary ? '默认内核' : row.source }}</span></div>
          <div v-if="confirmDelete === row" class="kernel-actions">
            <span>确认删除此版本？</span>
            <button type="button" :disabled="!!busy" @click="confirmDelete = null">取消</button>
            <button type="button" :disabled="!!busy" @click="remove(row)">确认删除</button>
          </div>
          <div v-else class="kernel-actions">
            <button type="button" :disabled="!!busy" @click="check(row)">检测</button>
            <button type="button" :disabled="!!busy || row.primary" @click="change('change', () => actions.pin(row.engine, row.version), '默认内核已更新')">设为默认</button>
            <button type="button" :disabled="!!busy || row.primary" @click="confirmDelete = row">删除</button>
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>
