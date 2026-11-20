<script setup>
import { computed, h, onMounted, ref } from 'vue';
import { h as requests, kr as delay, or as copyText, v as useConfig } from './utils-BIWenCnY.js';
import { a as I18nText } from './locales-BfKu2SD4.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { v as debounce } from './dist-ufdnm93_.js';
import { b as useRouter, y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Divider } from './rx-divider-Ci3C58Q3.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { t as ToggleSwitch } from './rx-toggle-switch-BI8eb18U.js';
import { t as Tabs } from './rx-tabs-Dp-8mudX.js';
import { t as Header } from './views-header-CcjwXPjG.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import { createApiSettingsWriter } from './workbench-api-settings.js';
import McpCode from './workbench-mcp-code.js';
import NumberFields from './workbench-number-fields.js';

const desktop = globalThis.electronAPI;
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const [showSuccess, showStatus] = useNotice();
const [openDialog] = useDialog();
const { mixpanelTrack } = useConfig();
const mcp = ref({ mcpServers: {} });
const saved = ref();
const draft = ref({ apiKey: '', port: 0, open: false, apiAllowLan: false, apiRate: 50 });
const occupied = ref(false);
const highlightToggle = ref(false);
const isElectron = globalThis.isElectron;
let configRequest = 0;
let keyRevision = 0;

const portFields = ref([
  { type: 'number', placeholder: '127.0.0.1', disabled: true },
  { separator: true },
  { type: 'number', name: 'port', placeholder: '0~65535', errorClass: 'whitespace-nowrap', onblur: submitPort },
]);
const portField = () => portFields.value[2];
const standardConfig = computed(() => JSON.stringify(mcp.value, null, 2));
const openCodeConfig = computed(() => {
  const server = mcp.value.mcpServers?.openbrowser;
  return JSON.stringify({
    mcp: { openbrowser: { type: 'local', command: [server?.command, ...(server?.args ?? [])], environment: server?.env, enabled: true } },
  }, null, 2);
});
const mcpTabs = [
  { icon: 'websites/rx_site_cursor', title: 'Cursor / Claude / Codex', value: '1' },
  { icon: 'websites/rx_site_opencode', title: 'OpenCode', value: '5' },
];

async function loadMcpConfig() {
  const ticket = ++configRequest;
  try {
    const config = await globalThis.__localRequest('api:mcp-config');
    if (ticket === configRequest) mcp.value = config;
  } catch (error) {
    if (ticket === configRequest) showStatus(-1, error.message);
  }
}

async function openDocumentation() {
  try {
    const content = await globalThis.__localRequest('api:reference');
    openDialog({
      header: 'OpenBrowser API & MCP', class: 'w-900px',
      slots: { default: () => h('pre', { class: 'whitespace-pre-wrap overflow-auto max-h-120 text-3' }, content), footer: undefined },
    });
  } catch (error) {
    showStatus(-1, error.message);
  }
}

const writeSettings = createApiSettingsWriter({
  draft: () => draft.value,
  saved: () => saved.value,
  async write(settings) {
    const revision = keyRevision;
    const result = await globalThis.__localRequest('api:set', settings);
    return revision === keyRevision ? result : { ...result, apiKey: saved.value.apiKey };
  },
  publish({ confirmed, submitted, next, accepted }) {
    saved.value = confirmed;
    draft.value = { ...draft.value, ...next, apiKey: confirmed.apiKey };
    if (Number(portField().value) === submitted.port) portField().value = next.port;
    if (accepted) {
      occupied.value = false;
      showStatus(0, '');
      void loadMcpConfig();
    }
  },
  failed: error => showStatus(-1, error.message),
});
const queueSave = debounce(() => {
  writeSettings().catch(error => showStatus(-1, error.message));
}, 300);

function submitPort() {
  const field = portField();
  const port = Number(field.value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    field.invalid = true;
    field.errorMsg = $t('端口范围 1~65535');
    return;
  }
  draft.value.port = port;
  queueSave();
}

function changeLanAccess(value) {
  if (!value) {
    draft.value.apiAllowLan = false;
    queueSave();
    return;
  }
  confirm.require({
    header: $t('允许局域网访问'),
    message: document.documentElement.lang.toLowerCase().startsWith('en')
      ? 'This option sends API requests and keys over unencrypted HTTP. For remote access over HTTPS, keep this option off and follow the reverse proxy instructions in API Docs.'
      : '开启后，局域网内的 API 请求和密钥会通过未加密的 HTTP 传输。需要通过 HTTPS 远程访问时，请保持此选项关闭，并按 API 文档配置反向代理。',
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认开启'), severity: 'danger' },
    accept: () => {
      draft.value.apiAllowLan = true;
      queueSave();
    },
  });
}

function resetKey() {
  if (!isElectron) return desktop.send('util:genApiKey');
  confirm.require({
    header: $t('重置 API 密钥'),
    message: $t('您确认要重置 API 密钥吗？此操作会导致所有使用原 API 密钥的客户端无法正常工作'),
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认'), severity: 'danger' },
    accept: async () => {
      try {
        const apiKey = await desktop.send('util:genApiKey');
        keyRevision++;
        saved.value = { ...saved.value, apiKey };
        draft.value = { ...draft.value, apiKey };
        await loadMcpConfig();
      } catch (error) {
        showStatus(-1, error.message);
      }
    },
  });
}

function copy(content, event) {
  copyText(content);
  showSuccess(0, $t('复制成功'));
  if (event) mixpanelTrack(event);
}

async function initialize() {
  const { data } = await requests.base.userGetUserApiList();
  const settings = { ...data, apiAllowLan: Boolean(data.apiAllowLan) };
  saved.value = { ...settings };
  draft.value = settings;
  const port = Number(settings.port);
  portField().value = port;
  const available = await desktop.send('util:checkPort', port);
  occupied.value = isElectron && available !== port;
  if (route.query.highlight) {
    highlightToggle.value = true;
    await delay(1500);
    highlightToggle.value = false;
    if (route.name === 'api-keys') router.replace({ name: 'api-keys' });
  }
}

onMounted(() => {
  void initialize().catch(error => showStatus(-1, error.message));
  void loadMcpConfig();
  mixpanelTrack('api_mcp_open');
});
</script>

<template>
  <div class="flex flex-col w-full h-full api">
    <Header :title="$route.meta.title" />
    <div class="flex-1 w-full pb-4 overflow-auto api-body">
      <div class="w-3/4 mx-auto">
        <div class="w-full grid grid-cols-18">
          <div class="pt-4 col-span-6">
            <div class="py-2 api-title">{{ $t('API 设置') }}</div>
            <div class="api-desc">{{ $t('用户可以使用 API 快速创建、打开和管理窗口，并且还可以使用像 Selenium、Puppeteer 和 Playwright 这样的工具来自动化浏览器操作。') }}</div>
          </div>
          <div class="col-span-11 col-start-8">
            <div class="flex justify-between items-center px-3 py-4 api-usage" :class="{ foucs: highlightToggle }">
              <div>{{ $t('API 启用状态') }}</div>
              <ToggleSwitch v-model="draft.open" :label="draft.open ? $t('启用') : $t('关闭')" @change="queueSave" />
            </div>
            <div v-if="draft.open" class="api-content">
              <div class="api-content-reset">
                <div>{{ $t('API 密钥') }}</div>
                <Button severity="secondary" outlined size="xxs" icon="base/rx_ic_refresh" :label="$t('重置 API 密钥')" @click="resetKey" />
              </div>
              <div class="api-content-key _copy_osijo_32">
                <div class="flex items-center justify-between">
                  <div class="api-content-key-value">{{ draft.apiKey }}</div>
                  <Button class="_copy-btn_osijo_32" text size="xxs" icon="base/rx_ic_copy" :label="$t('复制')" @click="copy(draft.apiKey, 'api_key_copy')" />
                </div>
                <div class="api-content-key-desc">{{ $t('* 请确保您的 API 密钥安全保存') }}</div>
              </div>
              <div class="flex items-center justify-between mt-6 px-3 api-content-proxy">
                <div>{{ $t('端口设置') }}</div>
                <NumberFields class="api-content-proxy-port" :inputs="portFields" />
              </div>
              <Alert v-model:visible="occupied" class="!w-full mt-4" type="error" :closable="false" :title="$t('端口已被占用')"
                :content="$t('我们检测到你当前设置的端口 {port} 已被占用，请修改端口以正常使用 API 服务', { port: draft.port })" />
              <div v-if="isElectron" class="flex items-center justify-between mt-6 px-3 api-content-proxy">
                <div class="flex flex-col">
                  <div>{{ $t('允许局域网访问') }}</div>
                  <div class="api-desc">{{ $t('默认仅本机可访问。开启后，同一局域网内的设备可通过本机 IP 访问') }}</div>
                </div>
                <ToggleSwitch :model-value="draft.apiAllowLan" :label="draft.apiAllowLan ? $t('启用') : $t('关闭')" @update:model-value="changeLanAccess" />
              </div>
            </div>
            <div class="flex flex-col gap-8 py-6 px-3">
              <div class="flex flex-col gap-3">
                <div class="api-illustrate-title">{{ $t('API 文档') }}</div>
                <div class="api-illustrate-content">
                  <div class="grid grid-cols-2 gap-2.5">
                    <Button class="flex-1 !h-11" severity="secondary" outlined size="lg" @click="openDocumentation">
                      <div class="w-full flex items-center justify-start gap-1.5">
                        <Icon name="base/rx_ic_doc_api" color="var(--colors-icon-icon-brand)" />
                        <div class="flex-1 text-left _text_osijo_1">{{ $t('API 文档') }}</div>
                        <Icon name="base/rx_ic_arrow_top_right" color="var(--colors-icon-icon-brand)" />
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-3">
                <div class="api-illustrate-title">{{ $t('集成代码示例') }}</div>
                <div class="api-illustrate-content">
                  <div class="grid grid-cols-2 gap-2.5">
                    <Button class="flex-1 !h-11" severity="secondary" outlined size="lg" label="OpenBrowser Local API" @click="openDocumentation" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Divider line-only />
        <div class="w-full grid grid-cols-18">
          <div class="col-span-6">
            <div class="pt-6 pb-2 api-title"> AI MCP </div>
            <div class="api-desc">{{ $t('模型上下文协议（MCP）就像一个通用的 AI 插件系统——它让 AI 助手可以轻松连接和使用不同的应用程序、工具和数据，就像给你的浏览器添加扩展程序一样。') }}</div>
            <br>
            <I18nText class="api-desc" tag="div" scope="global" :keypath="$t('了解更多关于 {link}.', { link: '{link}' })">
              <template #link><a class="cursor-pointer _link_osijo_7" role="button" @click="openDocumentation">MCP</a></template>
            </I18nText>
          </div>
          <div class="col-span-11 col-start-8 flex flex-col gap-9 py-6 px-3">
            <Alert v-if="!draft.open" class="!w-full" type="warn" :title="$t('您需要开启 API 才能正常使用 MCP 功能')" :closable="false" />
            <div class="flex flex-col gap-3">
              <div class="api-illustrate-title">{{ $t('环境依赖') }}</div>
              <div class="api-illustrate-content"><div class="flex flex-col gap-1.5">OpenBrowser 内置运行时；无需安装远程 npm 包。</div></div>
            </div>
            <div class="flex flex-col gap-3">
              <div class="api-illustrate-title">{{ $t('安装') }}</div>
              <div class="api-illustrate-content">
                <div class="flex flex-col gap-1.5">
                  <div>{{ $t('标准配置适用于大多数工具') }}</div>
                  <McpCode :value="standardConfig" @copy="copy($event, 'mcp_config_copy')" />
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-3">
              <div class="api-illustrate-title">{{ $t('特定的客户端配置') }}</div>
              <div class="api-illustrate-content">
                <Tabs :tabs="mcpTabs" value="1">
                  <template #content="{ tab }">
                    <div class="w-full flex flex-col">
                      <div v-if="tab.value === '1'" class="pa-3 _platform_osijo_17">将上方标准配置添加到客户端 MCP 配置。</div>
                      <div v-else class="pa-3">{{ $t('更新您的 ~/.config/opencode/opencode.json') }}</div>
                      <McpCode :value="tab.value === '1' ? standardConfig : openCodeConfig" @copy="copy($event)" />
                    </div>
                  </template>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
