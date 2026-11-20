<script setup>
import { computed, inject, ref, watch } from 'vue';
import { N as useAgentApi, sn as useLocale } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { i as Button } from './ScriptSchemaForm-z_48GvPJ.js';
import { templateDialogRuntime } from './CreateTemplateDialog-Bpq9OLTG.js';
import Markdown from './workbench-agent-markdown.js';

const scriptTemplate = `import { defineMetadata, defineParams } from '@openbrowser/sandbox'

defineMetadata({
  name: 'My script',
  description: 'My local template',
  version: '1.0.0',
})

defineParams({
  type: 'object',
  properties: {},
})

export async function main() {
  return { ok: true }
}
`;
const { localizedText, reservedSlug } = templateDialogRuntime;
const dialog = inject('dialogRef');
const options = dialog?.value.data ?? {};
const api = useAgentApi();
const locale = useLocale();
const method = ref('paste');
const source = ref(options.initialSource || '');
const file = ref();
const fileInput = ref();
const parsed = ref();
const issue = ref('');
const parsing = ref(false);
const uploading = ref(false);
const dragging = ref(false);
const localHelp = ref(false);
const name = computed(() => localizedText(parsed.value?.metadata.name, locale.currentLocale));
const description = computed(() => localizedText(parsed.value?.metadata.description, locale.currentLocale));
const uploadLabel = computed(() => $t(parsing.value ? '解析中...' : uploading.value ? '上传中...' : '上传脚本'));
let revision = 0;
let dragDepth = 0;

function close() {
  dialog?.value.close();
}
function problem(error) {
  const reason = error instanceof Error ? error.message : '';
  if (reason.includes('脚本语法解析失败')) return $t('脚本语法解析失败，请检查代码语法');
  if (reason.includes('main(options)')) return $t('脚本需要导出 main(options) 函数');
  if (reason.includes('defineMetadata')) return $t('脚本缺少有效的 defineMetadata 配置');
  if (reason.includes('defineParams')) return $t('脚本缺少有效的 defineParams 配置');
  if (reason.includes('静态') || reason.includes('模板字符串')) return $t('自描述配置仅支持静态字面量');
  return $t('脚本解析失败，请检查脚本格式');
}
function filename() {
  return method.value === 'file' && file.value ? file.value.name : options.initialFilename || 'custom-template.ts';
}
function resetValidation() {
  revision++;
  parsed.value = undefined;
  issue.value = '';
  parsing.value = false;
}
async function inspect(code) {
  const turn = ++revision;
  issue.value = '';
  parsing.value = true;
  try {
    const result = await api.scriptSelfDescription(code, filename());
    if (turn !== revision) return;
    parsed.value = result;
    return result;
  } catch (error) {
    if (turn !== revision) return;
    parsed.value = undefined;
    issue.value = problem(error);
  } finally {
    if (turn === revision) parsing.value = false;
  }
}
async function chooseFile(nextFile) {
  resetValidation();
  const turn = revision;
  file.value = undefined;
  source.value = '';
  if (!/\.(?:js|ts)$/i.test(nextFile.name) || nextFile.size > 256 * 1024) {
    issue.value = $t('请选择不超过 256 KiB 的 .js 或 .ts 脚本文件');
    return;
  }
  parsing.value = true;
  try {
    const text = await nextFile.text();
    if (turn !== revision || method.value !== 'file') return;
    file.value = nextFile;
    source.value = text;
    await inspect(text);
  } catch (error) {
    if (turn === revision) issue.value = problem(error);
  } finally {
    if (turn === revision) parsing.value = false;
  }
}
function change(event) {
  const selected = event.target.files?.[0];
  event.target.value = '';
  if (selected) chooseFile(selected);
}
function isFileDrag(event) {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}
function dragEnter(event) {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  dragging.value = ++dragDepth > 0;
}
function dragLeave(event) {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  dragging.value = dragDepth > 0;
}
function dragOver(event) {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
}
function drop(event) {
  event.preventDefault();
  dragging.value = false;
  dragDepth = 0;
  const selected = event.dataTransfer?.files?.[0];
  if (selected) chooseFile(selected);
}
function download() {
  const url = URL.createObjectURL(new Blob([scriptTemplate], { type: 'video/mp2t' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'roxy-script-template.ts';
  link.click();
  URL.revokeObjectURL(url);
}
async function upload() {
  if (parsing.value || uploading.value) return;
  const code = source.value.trim();
  if (!code) {
    issue.value = $t('请输入或上传脚本内容');
    return;
  }
  const details = parsed.value ?? await inspect(code);
  if (!details) return;
  if (reservedSlug(details.metadata.slug)) {
    issue.value = $t('脚本 slug 不能以 official- 开头，请修改脚本中的 defineMetadata.slug 后重试');
    return;
  }
  const fileName = filename();
  const script = new File([source.value], fileName, { type: fileName.toLowerCase().endsWith('.js') ? 'application/javascript' : 'video/mp2t',
    lastModified: file.value?.lastModified ?? Date.now() });
  uploading.value = true;
  try {
    if (await options.onUpload?.(script, details) !== false) close();
  } finally {
    uploading.value = false;
  }
}
watch(method, resetValidation);
watch(source, () => { if (method.value === 'paste') resetValidation(); });
</script>

<template>
  <div class="agent-console-dialog__shell upload-script-dialog">
    <header class="agent-console-dialog__header">
      <h2 class="agent-console-dialog__title">{{ $t('上传脚本') }}</h2>
      <button class="agent-console-dialog__close" type="button" :aria-label="$t('关闭上传脚本弹窗')" @click="close"></button>
    </header>
    <main class="agent-console-dialog__body upload-script-dialog__body">
      <div class="upload-script-dialog__tools">
        <Button variant="secondary" icon="roxy-agent/rx-ic-script-doc" :label="$t('脚本开发文档')" :aria-expanded="localHelp" @click="localHelp = !localHelp" />
        <Button variant="secondary" icon="base/rx_ic_download" :label="$t('下载脚本模板')" @click="download" />
      </div>
      <div class="upload-script-dialog__divider" aria-hidden="true"></div>
      <div class="upload-script-dialog__form">
        <p v-if="localHelp" class="upload-script-dialog__description">
          {{ $t('使用 defineMetadata 和 defineParams 声明模板，再导出 main(options)。从任务管理选择窗口后运行。窗口操作可从 {module} 导入 browser，需要对应 Chromium 窗口已启动。', { module: '@openbrowser/sandbox' }) }}
        </p>
        <section class="upload-script-dialog__field">
          <label>{{ $t('脚本名称') }}</label>
          <input class="upload-script-dialog__name-input" :value="name" :placeholder="$t('解析脚本后自动填写')" readonly aria-readonly="true">
        </section>
        <section class="upload-script-dialog__field">
          <label>{{ $t('上传方式') }}</label>
          <div class="upload-script-dialog__methods" role="radiogroup" :aria-label="$t('上传方式')">
            <label :class="{ active: method === 'paste' }"><input v-model="method" type="radio" name="upload-script-method" value="paste"><span>{{ $t('粘贴代码') }}</span></label>
            <label :class="{ active: method === 'file' }"><input v-model="method" type="radio" name="upload-script-method" value="file"><span>{{ $t('从本地设备上传') }}</span></label>
          </div>
        </section>
        <section class="upload-script-dialog__field">
          <label>{{ $t(method === 'paste' ? '粘贴脚本代码' : '脚本文件') }}</label>
          <textarea v-if="method === 'paste'" v-model="source" class="upload-script-dialog__editor" :placeholder="$t('请在此粘贴符合格式要求的脚本...')" spellcheck="false"></textarea>
          <button v-else class="upload-script-dialog__dropzone" :class="{ 'is-dragging': dragging }" type="button" @click="fileInput?.click()"
            @dragenter="dragEnter" @dragleave="dragLeave" @dragover="dragOver" @drop="drop">
            <Icon name="extension/rx_ic_upload" size="20" /><span>{{ file?.name || $t('选择 .js 或 .ts 文件') }}</span>
            <small>{{ $t('点击上传文件，也可直接拖拽上传') }}</small>
          </button>
          <input ref="fileInput" type="file" accept=".js,.ts,application/javascript,text/javascript,application/typescript" hidden @change="change">
        </section>
        <section v-if="parsed" class="upload-script-dialog__result">
          <div>
            <span>{{ $t('脚本描述') }}</span>
            <Markdown v-if="description" class="upload-script-dialog__description" :content="description" /><p v-else>{{ $t('暂无描述') }}</p>
          </div>
          <div><span>{{ $t('脚本参数') }}</span><pre>{{ JSON.stringify(parsed.paramsSchema, null, 2) }}</pre></div>
        </section>
        <p v-if="issue" class="upload-script-dialog__error" role="alert">{{ issue }}</p>
      </div>
    </main>
    <footer class="agent-console-dialog__footer">
      <div class="agent-console-dialog__actions">
        <button class="agent-console-dialog__button" type="button" :disabled="uploading || parsing" @click="close">{{ $t('取消') }}</button>
        <button class="agent-console-dialog__button primary" type="button" :disabled="uploading || parsing" @click="upload">{{ uploadLabel }}</button>
      </div>
    </footer>
  </div>
</template>
