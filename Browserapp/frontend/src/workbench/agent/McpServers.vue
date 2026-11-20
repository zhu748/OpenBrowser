<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as TextInput } from './AgentInput-CVahkFed.js';

const [showSuccess, showError] = useNotice();
const call = (method, payload = {}) => globalThis.__agentRequest('mcp:' + method, payload);
const modes = {
  stdio: { label: $t('通过命令行创建 MCP'), title: $t('通过命令行创建 MCP'),
    field: { key: 'command', label: $t('命令'), placeholder: 'node /path/to/server.js' }, pairs: $t('环境变量') },
  http: { label: $t('HTTP 请求'), title: $t('通过 HTTP 请求创建 MCP'),
    field: { key: 'url', label: $t('URL'), placeholder: 'https://...', wide: true }, pairs: $t('HTTP 请求头') },
  json: { label: $t('JSON'), title: $t('从剪贴板导入 JSON') },
};
const failures = [
  [/"validation":\s*"url"|invalid url|invalid_url|url is invalid/i, 'URL格式有误，必须以 http:// 或 https:// 开头'],
  [/requires "url"|url is required|missing url/i, 'URL 必须填写'],
  [/requires "command"|command is required|missing command/i, '命令必须填写'],
  [/\b401\b|unauthorized|authentication failed|invalid token|invalid api key/i, 'MCP 身份验证失败，请检查 HTTP 请求头中的认证信息'],
  [/\b403\b|forbidden|permission denied/i, 'MCP 服务拒绝访问，请检查访问权限'],
  [/\b404\b|not found/i, 'MCP 服务地址不存在，请检查 URL 是否正确'],
  [/timeout|timed out|etimedout|aborterror/i, 'MCP 服务连接超时，请稍后重试'],
  [/econnrefused|connection refused|enotfound|getaddrinfo|fetch failed|failed to fetch|network error|certificate|self signed|tls|ssl/i, 'MCP 服务无法访问，请检查 URL 和网络连接'],
  [/\b5\d{2}\b|internal server error|bad gateway|service unavailable/i, 'MCP 服务暂时不可用，请稍后重试'],
  [/unsupported protocol|unsupported transport|invalid response|unexpected response|content-type|streamable|protocol error/i, 'MCP 服务响应格式不支持，请确认服务支持 Streamable HTTP'],
];

const servers = ref([]);
const loading = ref(false);
const showEditor = ref(false);
const editing = ref(null);
const mode = ref('stdio');
const openMenu = ref(null);
const fields = reactive({ name: '', command: '', url: '' });
let nextRow = 1;
const rows = reactive({ stdio: [makeRow()], http: [makeRow()] });
const currentMode = computed(() => modes[mode.value]);
const pending = new Set();

function makeRow(key = '', value = '') {
  return { id: nextRow++, key, value };
}
function fromEntries(values) {
  const entries = Object.entries(values ?? {});
  return entries.length ? entries.map(([key, value]) => makeRow(key, value)) : [makeRow()];
}
function setPairs(id) {
  const items = rows[mode.value];
  rows[mode.value] = items.length === 1 ? [makeRow()] : items.filter(row => row.id !== id);
}
function describe(error) {
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return '';
  const nested = error.error ?? error.msg ?? error.message;
  return nested && nested !== error ? describe(nested) : JSON.stringify(error);
}
function explain(error, type, save = false) {
  const match = failures.find(([pattern]) => pattern.test(describe(error)));
  const fallback = save
    ? (type === 'http' ? 'MCP 服务保存失败，请检查名称、URL 和 HTTP 请求头后重试' : 'MCP 服务保存失败，请检查名称、命令和环境变量后重试')
    : (type === 'http' ? 'MCP 服务验证失败，请检查名称、URL 和 HTTP 请求头后重试' : 'MCP 服务验证失败，请检查名称、命令和环境变量后重试');
  showError(-1, $t(match?.[1] ?? fallback), { summary: $t(save ? '保存失败' : '验证失败') });
}

function reset() {
  mode.value = 'stdio';
  Object.assign(fields, { name: '', command: '', url: '' });
  rows.stdio = [makeRow()];
  rows.http = [makeRow()];
  editing.value = null;
  openMenu.value = null;
}
function create() {
  reset();
  showEditor.value = true;
}
function close() {
  showEditor.value = false;
  reset();
}
function serverType(config) {
  return config.type === 'http' || config.url ? 'http' : 'stdio';
}
function edit(server) {
  reset();
  const config = server.config;
  editing.value = server;
  mode.value = serverType(config);
  fields.name = server.name;
  fields.command = config.command ? [config.command, ...(config.args ?? [])].map(value => JSON.stringify(value)).join(' ') : '';
  fields.url = config.url ?? '';
  rows.stdio = fromEntries(config.env);
  rows.http = fromEntries(config.headers);
  showEditor.value = true;
}
function hideMenu(event) {
  if (event.target instanceof Element && !event.target.closest('[data-mcp-server-menu]')) openMenu.value = null;
}
async function load() {
  loading.value = true;
  const message = $t('MCP 服务加载失败，请稍后重试');
  try {
    const result = await call('list');
    if (result.code !== 0) return showError(result.code, message);
    servers.value = (result.data || []).map(server => ({ ...server, config: server.config || {} }));
    openMenu.value = null;
  } catch (error) {
    console.error('Failed to load MCP servers:', error);
    showError(-1, message);
  } finally { loading.value = false; }
}
function isHttp(url) {
  try { return ['http:', 'https:'].includes(new URL(url).protocol); }
  catch { return false; }
}
function draft() {
  if (mode.value === 'json') return;
  const name = fields.name.trim();
  if (!name) return showError(-1, $t('名称必须填写'));
  const type = mode.value;
  const pairs = Object.fromEntries(rows[type].filter(row => row.key).map(row => [row.key, row.value]));
  if (type === 'stdio') {
    const command = fields.command.trim();
    if (!command) return showError(-1, $t('命令必须填写'));
    return { name, config: { type, command, env: pairs } };
  }
  const url = fields.url.trim();
  if (!url) return showError(-1, $t('URL 必须填写'));
  if (!isHttp(url)) return showError(-1, $t('URL格式有误，必须以 http:// 或 https:// 开头'));
  return { name, config: { type, url, headers: pairs } };
}
async function submit(save) {
  const payload = draft();
  if (!payload?.config) return;
  const type = payload.config.type;
  const action = save ? 'upsert' : 'test';
  if (pending.has(action)) return;
  pending.add(action);
  try {
    const result = await call(action, save ? { ...payload, oldName: editing.value?.name } : payload);
    if (save && result.code === 0) {
      await load();
      close();
    } else if (!save && result.code === 0 && result.data?.success) {
      showSuccess(0, $t('验证成功'));
    } else explain(save ? result : result.data?.error || result.msg || result.message, type, save);
  } catch (error) {
    explain(error, type, save);
  } finally { pending.delete(action); }
}
async function toggle(server) {
  const message = $t('MCP 服务状态更新失败，请稍后重试');
  if (pending.has(server.name)) return;
  pending.add(server.name);
  try {
    if (server.enabled) {
      if ((await call('disable', { name: server.name })).code !== 0) return showError(-1, message);
      server.enabled = false;
      return;
    }
    const result = await call('enable', { name: server.name });
    if (result.code !== 0) return explain(result, serverType(server.config));
    server.enabled = Boolean(result.data?.success);
    server.status = result.data;
    if (!server.enabled) explain(result.data?.error, serverType(server.config));
  } catch (error) {
    console.error('Failed to toggle server:', error);
    showError(-1, message);
  } finally { pending.delete(server.name); }
}
async function remove(server) {
  const message = $t('MCP 服务删除失败，请稍后重试');
  try {
    if ((await call('delete', { name: server.name })).code !== 0) return showError(-1, message);
    await load();
  } catch (error) {
    console.error('Failed to delete server:', error);
    showError(-1, message);
  }
}

function strings(fields) {
  return Object.fromEntries(Object.entries(fields ?? {}).filter(([, value]) => typeof value === 'string'));
}
async function importClipboard() {
  const message = $t('MCP 服务导入失败，请检查 JSON 配置后重试');
  try {
    const json = JSON.parse(await navigator.clipboard.readText());
    if (!json || typeof json !== 'object') return showError(-1, $t('剪贴板内容不是有效的 JSON'));
    const configs = json.mcpServers || json;
    if (!configs || typeof configs !== 'object') return showError(-1, $t('剪贴板内容格式不正确'));
    const mcpServers = Object.fromEntries(Object.entries(configs).flatMap(([name, config]) => {
      if (!name || !config || typeof config !== 'object') return [];
      const stdio = typeof config.command === 'string';
      const http = typeof config.url === 'string';
      if (!stdio && !http) return [];
      const type = config.type === 'http' || config.type === 'stdio' ? config.type : stdio ? 'stdio' : 'http';
      const args = Array.isArray(config.args) ? config.args.filter(value => typeof value === 'string') : [];
      const command = stdio ? [config.command, ...args].map(value => value.includes(' ') ? JSON.stringify(value) : value).join(' ') : undefined;
      return [[name, { type, command, url: http ? config.url : undefined, env: config.env && strings(config.env), headers: config.headers && strings(config.headers) }]];
    }));
    if (!Object.keys(mcpServers).length) return showError(-1, $t('剪贴板内容格式不正确'));
    if ((await call('import', { mcpServers })).code !== 0) return showError(-1, message);
    await load();
    close();
  } catch (error) {
    console.error('Failed to import MCP servers:', error);
    showError(-1, message);
  }
}
watch(mode, value => { if (value !== 'json' && !rows[value].length) rows[value] = [makeRow()]; });
onMounted(() => { void load(); document.addEventListener('click', hideMenu, true); });
onUnmounted(() => document.removeEventListener('click', hideMenu, true));
</script>

<template>
  <div class="agent-settings">
    <header v-if="!showEditor" class="agent-settings__header">
      <h1>{{ $t('MCP 服务') }}</h1>
      <button class="agent-settings-button agent-settings-button--primary" type="button" @click="create">
        <Icon name="base/rx_ic_plus" size="18" /><span>{{ $t('新建') }}</span>
      </button>
    </header>
    <section v-if="showEditor" class="mcp-create">
      <button class="mcp-back-button" type="button" @click="close">
        <Icon name="base/rx_ic_arrow_left" size="18" /><span>{{ $t('返回 MCP 列表') }}</span>
      </button>
      <div class="mcp-create__intro">
        <div class="mcp-create__copy">
          <h2>{{ $t(editing ? '编辑 MCP Server' : '新建') }}</h2>
          <p>{{ $t('关于 MCP 的信息与配置方法，请访问 {MCP}', { MCP: 'MCP' }) }}</p>
        </div>
        <div class="mcp-mode-tabs" role="tablist" :aria-label="$t('MCP 服务类型')">
          <button v-for="(item, key) in modes" :key="key" class="mcp-mode-tabs__item" :class="{ active: mode === key }"
            type="button" role="tab" :aria-selected="mode === key" @click="mode = key">{{ item.label }}</button>
        </div>
      </div>
      <form class="mcp-create-card" @submit.prevent="submit(true)">
        <h3>{{ currentMode.title }}</h3>
        <div v-if="mode === 'json'" class="mcp-json-import">
          <button class="agent-settings-button agent-settings-button--primary" type="button" @click="importClipboard">{{ $t('从剪贴板导入 JSON') }}</button>
        </div>
        <template v-else>
          <div class="mcp-create-card__fields">
            <label class="mcp-field mcp-field--narrow">
              <span class="mcp-field__label">{{ $t('名称（帮助你识别工具）') }} <b>*</b></span>
              <TextInput v-model="fields.name" :placeholder="$t('输入服务名称')" />
            </label>
            <label class="mcp-field" :class="{ 'mcp-field--narrow': !currentMode.field.wide }">
              <span class="mcp-field__label">{{ currentMode.field.label }}<b>*</b></span>
              <TextInput v-model="fields[currentMode.field.key]" :placeholder="currentMode.field.placeholder" />
            </label>
            <div class="mcp-field mcp-field--wide">
              <div class="mcp-field__label mcp-field__label--split">
                <span>{{ currentMode.pairs }}</span>
                <button type="button" @click="rows[mode].push(makeRow())">{{ $t('+ 添加') }}</button>
              </div>
              <div v-for="row in rows[mode]" :key="row.id" class="mcp-pair-row">
                <TextInput v-model="row.key" :placeholder="$t('键')" />
                <TextInput v-model="row.value" :placeholder="$t('值')" />
                <button class="mcp-delete-button" type="button" :aria-label="$t('移除此行')" @click="setPairs(row.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><path d="M9.5 16.5V10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><path d="M14.5 16.5V10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>
                </button>
              </div>
            </div>
          </div>
          <div class="mcp-create-card__actions">
            <button class="agent-settings-button agent-settings-button--secondary" type="button" @click="close">{{ $t('取消') }}</button>
            <button class="agent-settings-button agent-settings-button--secondary" type="button" @click="submit(false)">{{ $t('验证') }}</button>
            <button class="agent-settings-button agent-settings-button--primary" type="submit">{{ $t('保存') }}</button>
          </div>
        </template>
      </form>
    </section>
    <section v-else class="mcp-server-list" :aria-label="$t('MCP 服务列表')">
      <article v-for="server in servers" :key="server.name" class="mcp-server-row">
        <span>{{ server.name }}</span>
        <div v-if="!server.builtin" class="mcp-server-row__actions">
          <button class="mcp-icon-button" type="button" :aria-label="$t('更多操作')" data-mcp-server-menu
            @click="openMenu = openMenu === server.name ? null : server.name"><Icon name="base/rx_ic_more-h" size="18" /></button>
          <button class="mcp-switch" :class="{ 'mcp-switch--checked': server.enabled }" type="button"
            role="switch" :aria-checked="server.enabled" @click="toggle(server)"><span></span></button>
        </div>
        <div v-if="!server.builtin && openMenu === server.name" class="mcp-server-menu" data-mcp-server-menu>
          <button type="button" @click="edit(server)"><Icon name="base/rx_ic_agent_edit" size="16" aria-hidden="true" /><span>{{ $t('编辑') }}</span></button>
          <button type="button" class="danger" @click="remove(server)"><Icon name="roxy-agent/rx-ic-mcp-delete" size="16" aria-hidden="true" /><span>{{ $t('删除') }}</span></button>
        </div>
      </article>
      <div v-if="loading" class="mcp-server-state">{{ $t('加载中...') }}</div>
      <div v-else-if="!servers.length" class="mcp-server-state">{{ $t('暂无 MCP') }}</div>
    </section>
  </div>
</template>
