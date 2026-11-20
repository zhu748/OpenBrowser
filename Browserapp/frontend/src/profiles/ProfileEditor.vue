<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { message, request } from '../desktop';
import { editProfile, readProfile } from './api';
import { changedSettings, preferenceFields, readSettings, systems } from './settings';
import { customProxy, directProxy, libraryProxy, listProxies, proxyAddress, proxyChoice, proxyFields, type ProxySummary } from '../proxies/api';

const { id, templateId, templateMode, batch, done, projectId } = defineProps<{
  id: string | null; templateId: string | null; templateMode: boolean; batch: boolean; done: () => void; projectId?: string | null;
}>();
const name = ref('');
const note = ref('');
const busy = ref(false);
const ready = ref(false);
const error = ref('');
const conflict = ref(false);
const count = ref(2);
const draft = reactive(readSettings());
const projects = ref<{ id: string; projectName: string }[]>([]);
const kernels = ref<{ engine: string; version: string }[]>([]);
const proxies = ref<ProxySummary[]>([]);
const network = ref(directProxy);
const networkError = ref('');
const versions = computed(() => {
  const engine = draft.coreType === 'Firefox' ? 'firefox' : 'chromium';
  const found = kernels.value.filter(row => row.engine === engine).map(row => row.version.split('.')[0]);
  if (draft.coreVersion !== 'latest') found.unshift(draft.coreVersion);
  return [...new Set(found)];
});
let revision = 0;
let base: Record<string, unknown> = {};
let initial = readSettings();
let initialNetwork = directProxy;
let alive = true;

async function run(operation: () => Promise<void>) {
  if (busy.value || !alive) return;
  busy.value = true;
  error.value = '';
  try { await operation(); }
  catch (failure) {
    if (!alive) return;
    conflict.value = (failure as { code?: string } | null)?.code === 'PROFILE_STALE_REV';
    error.value = conflict.value ? '窗口配置已变更。请重新读取后再编辑。' : message(failure);
  } finally {
    if (alive) busy.value = false;
  }
}

function read() {
  return run(async () => {
    ready.value = false;
    conflict.value = false;
    const [groups, installed, library] = await Promise.all([
      request<typeof projects.value>('groups:list', { default: 2 }),
      request<typeof kernels.value>('kernels:list'),
      batch ? Promise.resolve({ rows: [], failure: '' }) : listProxies()
        .then(rows => ({ rows, failure: '' }), failure => ({ rows: [], failure: message(failure) })),
    ]);
    if (!alive) return;
    projects.value = groups;
    kernels.value = installed;
    proxies.value = library.rows;
    networkError.value = library.failure;
    let source: Record<string, unknown> = {};
    if (id) {
      const profile = await readProfile(id);
      if (!alive) return;
      revision = profile.rev;
      name.value = profile.windowName;
      note.value = profile.windowRemark ?? '';
      source = { ...profile };
    } else if (templateId) {
      const templates = await request<{ id: number; templateName: string; content: string }[]>('templates:list');
      if (!alive) return;
      const template = templates.find(row => String(row.id) === templateId);
      if (!template) throw new Error('模板不存在');
      const data: unknown = JSON.parse(template.content);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('无法读取模板配置');
      base = data as Record<string, unknown>;
      source = base;
      name.value = templateMode ? template.templateName : String(base.windowName ?? template.templateName);
      note.value = String(base.windowRemark ?? '');
    }
    initial = readSettings(source);
    initialNetwork = proxyChoice(source);
    network.value = initialNetwork;
    Object.assign(draft, initial);
    if (!id && !templateId && projectId) {
      if (!groups.some(group => group.id === projectId)) throw new Error('项目不存在或已删除');
      draft.projectId = projectId;
    }
    ready.value = true;
  });
}

function save() {
  if (!name.value.trim() || !ready.value || conflict.value) return;
  return run(async () => {
    const networkChanged = network.value !== initialNetwork;
    const proxy = networkChanged ? proxyFields(network.value, proxies.value) : {};
    const fields = { ...changedSettings(initial, draft), ...proxy, windowName: name.value.trim(), windowRemark: note.value };
    if (id) {
      await editProfile(id, revision, fields);
    } else {
      const payload: Record<string, unknown> = { ...base, ...fields };
      if (networkChanged) {
        delete payload.networkMode;
        delete payload.proxyId;
        delete payload.moduleId;
      }
      if (templateMode) {
        if (typeof base.windowName === 'string') payload.windowName = base.windowName;
        await request('templates:save', { ...(templateId ? { id: Number(templateId) } : {}), templateName: name.value.trim(), content: JSON.stringify(payload) });
      } else if (batch) {
        if (!Number.isInteger(count.value) || count.value < 1 || count.value > 100) throw new Error('批量数量须为 1–100');
        await request('profiles:create-batch', { ...payload, createCount: count.value, windowNamePrefix: fields.windowName });
      } else {
        await request('profiles:create', payload);
      }
    }
    if (alive) done();
  });
}

onMounted(() => { void read(); });
onBeforeUnmount(() => { alive = false; });
</script>

<template>
  <section class="workspace-page" aria-labelledby="editor-title">
    <header class="page-header">
      <h1 id="editor-title">{{ id ? '编辑窗口' : batch ? '批量创建窗口' : templateMode ? templateId ? '编辑模板' : '创建模板' : '创建窗口' }}</h1>
      <a :href="templateMode ? '#/templates' : '#/profiles'">{{ templateMode ? '返回模板' : '返回窗口' }}</a>
    </header>
    <p v-if="error" class="callout danger" role="alert">{{ error }}</p>
    <button v-if="error && (conflict || !ready)" type="button" :disabled="busy" @click="read">重新读取</button>
    <p v-if="!ready && busy" role="status">正在读取配置…</p>
    <form v-if="ready" class="panel editor" @submit.prevent="save">
      <fieldset class="form-section" :disabled="busy">
        <legend>基本设置</legend>
        <label>{{ batch ? '名称前缀' : '名称' }}<input v-model="name" required :maxlength="batch ? 96 : 100"></label>
        <label v-if="batch">窗口数量<input v-model.number="count" type="number" required min="1" max="100"></label>
        <div class="form-grid">
          <label>操作系统<select v-model="draft.os" aria-label="操作系统">
            <option v-if="!systems.includes(draft.os)">{{ draft.os }}</option>
            <option v-for="system in systems" :key="system">{{ system }}</option>
          </select></label>
          <label>项目<select v-model="draft.projectId" aria-label="项目">
            <option v-if="!projects.some(row => row.id === draft.projectId)" :value="draft.projectId">当前项目</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.projectName }}</option>
          </select></label>
          <label>浏览器内核<select v-model="draft.coreType" aria-label="浏览器内核" @change="draft.coreVersion = 'latest'"><option>Chrome</option><option>Firefox</option></select></label>
          <label>内核版本<select v-model="draft.coreVersion" aria-label="内核版本"><option value="latest">自动选择最新版本</option><option v-for="version in versions" :key="version">{{ version }}</option></select></label>
        </div>
        <label>备注<textarea v-model="note" maxlength="2000" rows="2"></textarea></label>
      </fieldset>
      <fieldset v-if="!batch" class="form-section" :disabled="busy">
        <legend>网络设置</legend>
        <label>网络连接<select v-model="network" aria-label="网络连接">
          <option :value="directProxy">直连</option>
          <option v-if="initialNetwork === customProxy" :value="customProxy">当前自定义代理</option>
          <option v-if="initialNetwork.startsWith('library:') && !proxies.some(row => libraryProxy(row.id) === initialNetwork)" :value="initialNetwork">{{ networkError ? '当前代理' : '当前代理已从代理库移除' }}</option>
          <option v-for="row in proxies" :key="row.id" :value="libraryProxy(row.id)">{{ row.name }} · {{ proxyAddress(row) }}</option>
        </select></label>
        <p v-if="networkError" class="callout danger" role="alert">代理库读取失败：{{ networkError }}</p>
      </fieldset>
      <fieldset class="form-section" :disabled="busy">
        <legend>启动设置</legend>
        <label>启动网址<textarea v-model="draft.urls" maxlength="8000" placeholder="每行一个网址" rows="3"></textarea></label>
        <div class="form-grid">
          <label>窗口宽度<input v-model.number="draft.openWidth" type="number" required min="640" max="7680"></label>
          <label>窗口高度<input v-model.number="draft.openHeight" type="number" required min="480" max="4320"></label>
        </div>
        <label v-for="field in preferenceFields" :key="field.key" class="check-field">
          <input v-model="draft[field.key]" type="checkbox">{{ field.label }}
        </label>
      </fieldset>
      <div class="toolbar">
        <button class="primary" type="submit" :disabled="busy || conflict || !name.trim()">{{ id || templateMode ? '保存' : '创建' }}</button>
        <a v-if="templateMode && templateId" :href="`#/profiles/new?template=${encodeURIComponent(templateId)}`">用此模板创建窗口</a>
      </div>
    </form>
  </section>
</template>
