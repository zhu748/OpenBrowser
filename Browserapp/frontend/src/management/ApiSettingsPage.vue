<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { message, request } from '../desktop';

interface ApiState {
  open: boolean;
  port: number;
  apiAllowLan: boolean;
  apiKey: string;
}

const state = ref<ApiState | null>(null);
const draft = reactive({ open: false, port: 50325, apiAllowLan: false });
const busy = ref(false);
const error = ref('');
const notice = ref('');
const showKey = ref(false);
const rotating = ref(false);
const activePanel = ref<'mcp' | 'reference' | null>(null);
const panelContents = ref('');
const dirty = computed(() => state.value && (
  state.value.open !== draft.open || state.value.port !== draft.port || state.value.apiAllowLan !== draft.apiAllowLan
));
let alive = true;

function adopt(next: ApiState) {
  state.value = next;
  Object.assign(draft, { open: next.open, port: next.port, apiAllowLan: next.apiAllowLan });
}

async function run(action: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true;
  error.value = notice.value = '';
  try { await action(); }
  catch (failure) { if (alive) error.value = message(failure); }
  finally { if (alive) busy.value = false; }
}

function refresh() {
  return run(async () => {
    const info = await request<ApiState>('api:get');
    if (alive) adopt(info);
  });
}

function save() {
  return run(async () => {
    const info = await request<ApiState>('api:set', { ...draft });
    if (!alive) return;
    adopt(info);
    if (activePanel.value === 'mcp') { activePanel.value = null; panelContents.value = ''; }
    notice.value = 'API 设置已保存';
  });
}

function checkPort() {
  return run(async () => {
    const port = await request<number>('api:check-port', { port: draft.port });
    if (alive) notice.value = port ? '端口可用' : '端口已被占用或不可用';
  });
}

function rotate() {
  return run(async () => {
    const next = await window.ops.rotateApiKey();
    if (!alive || !state.value) return;
    state.value.apiKey = next.apiKey;
    rotating.value = false;
    activePanel.value = null;
    panelContents.value = '';
    notice.value = '密钥已更新';
  });
}

function showPanel(panel: 'mcp' | 'reference') {
  panelContents.value = '';
  if (activePanel.value === panel) { activePanel.value = null; return; }
  activePanel.value = panel;
  return run(async () => {
    const value = await request<unknown>(panel === 'mcp' ? 'api:mcp-config' : 'api:reference');
    if (alive && activePanel.value === panel)
      panelContents.value = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  });
}

async function copy(value: string) {
  await run(async () => {
    await navigator.clipboard.writeText(value);
    if (alive) notice.value = '已复制';
  });
}

onMounted(() => { void refresh(); });
onBeforeUnmount(() => { alive = false; state.value = null; panelContents.value = ''; });
</script>

<template>
  <section class="workspace-page" aria-labelledby="api-title">
    <header class="page-header">
      <h1 id="api-title">API &amp; MCP</h1>
      <span v-if="state" role="status">{{ state.open ? '服务运行中' : '服务已关闭' }}</span>
    </header>
    <p v-if="error" role="alert" class="callout danger">{{ error }}</p>
    <p v-if="notice" role="status" class="callout">{{ notice }}</p>
    <template v-if="state">
      <form class="panel editor" @submit.prevent="save">
        <h2>连接设置</h2>
        <label class="check-field"><input v-model="draft.open" type="checkbox" :disabled="busy"> 启用本地 API</label>
        <label>端口<input v-model.number="draft.port" type="number" required min="1" max="65535" :disabled="busy"></label>
        <label class="check-field"><input v-model="draft.apiAllowLan" type="checkbox" :disabled="busy"> 允许局域网访问</label>
        <div class="toolbar">
          <button type="submit" class="primary" :disabled="busy || !dirty">保存设置</button>
          <button type="button" :disabled="busy" @click="checkPort">检查端口</button>
          <button type="button" :disabled="busy || !dirty" @click="adopt(state)">撤销未保存的修改</button>
        </div>
      </form>
      <div class="panel editor">
        <h2>API 密钥</h2>
        <output v-if="showKey" class="text-break">{{ state.apiKey }}</output>
        <div class="toolbar">
          <button type="button" :disabled="busy" @click="showKey = !showKey">{{ showKey ? '隐藏密钥' : '显示密钥' }}</button>
          <button type="button" :disabled="busy" @click="copy(state.apiKey)">复制密钥</button>
          <button type="button" class="danger" :disabled="busy" @click="rotating = true">重置密钥</button>
        </div>
        <div v-if="rotating" class="toolbar" role="group" aria-label="确认重置密钥">
          <span>重置后，使用旧密钥的客户端需要更新配置。</span>
          <button type="button" :disabled="busy" @click="rotating = false">取消</button>
          <button type="button" class="danger" :disabled="busy" @click="rotate">确认重置</button>
        </div>
      </div>
      <div class="panel editor">
        <h2>开发接入</h2>
        <div class="toolbar">
          <button type="button" :disabled="busy" :aria-expanded="activePanel === 'mcp'" @click="showPanel('mcp')">MCP 配置</button>
          <button type="button" :disabled="busy" :aria-expanded="activePanel === 'reference'" @click="showPanel('reference')">本地文档</button>
          <button v-if="activePanel === 'mcp' && panelContents" type="button" :disabled="busy" @click="copy(panelContents)">复制 MCP 配置</button>
        </div>
        <textarea v-if="activePanel && panelContents" readonly :value="panelContents" rows="13" :aria-label="activePanel === 'mcp' ? 'MCP 配置内容' : '本地 API 文档'"></textarea>
      </div>
    </template>
    <p v-else-if="busy" role="status">正在读取本地 API 配置…</p>
    <button v-else type="button" @click="refresh">重新读取</button>
  </section>
</template>
