<script setup>
import { reactive, resolveComponent } from 'vue';
import { h as requests, hr as extensionOf } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { t as usePopupMenu } from './usePopupMenu-BRw1zJ0m.js';
import { c as readText, n as downloadText, s as readWorkbook, t as downloadWorkbook } from './utils-CnUy4XUk.js';
import { n as workbookTypes, t as textTypes } from './constants-DLlGaEfk.js';

const props = defineProps({ error: String });
const emit = defineEmits(['update:error', 'importSuccess', 'invalidate']);
const I18nText = resolveComponent('i18n-t');
const { showMenu } = usePopupMenu();
const [, showStatus] = useNotice();
const fileTypes = { ...textTypes, ...workbookTypes };
const icons = { xlsx: 'base/rx_ic_file_xls', txt: 'base/rx_ic_file_txt' };
const fileInfo = reactive({ valid: false, icon: '', name: '', size: '', count: 0 });
const maxRows = 200;
let loadRevision = 0;

function resetUpload() {
  loadRevision += 1;
  Object.assign(fileInfo, { valid: false, icon: '', name: '', size: '', count: 0 });
  emit('invalidate');
  emit('update:error', null);
  return loadRevision;
}

function drop(event) {
  const file = event.dataTransfer?.files[0];
  if (!file) return;
  if (!Object.hasOwn(fileTypes, file.type)) {
    resetUpload();
    return showStatus(-1, $t('仅支持Excel类型文件'));
  }
  return load(file);
}

async function choose() {
  try {
    const file = await globalThis.__localRequest('profiles:choose-import');
    if (file) await load(new File([file.bytes], file.name, { type: file.type }));
  } catch (error) {
    showStatus(-1, error.message);
  }
}

async function load(file) {
  const revision = resetUpload();
  if (file.size > 5 * 1024 * 1024) return showStatus(-1, $t('文件大小不能超过 5MB'));
  try {
    const extension = extensionOf(file.name);
    const rows = extension === 'txt' ? await readText(file) : await readWorkbook(file);
    if (revision !== loadRevision) return;
    if (!rows.length) throw Error($t('导入的内容不能为空'));
    const payload = { fileName: file.name, excelData: rows };
    const { code, msg } = await requests.window.userAnalysisWindowInfoCreate(payload);
    if (revision !== loadRevision) return;
    if (code !== 0) throw Error(Array.isArray(msg) ? msg.join('\n') : msg);
    Object.assign(fileInfo, { valid: true, icon: icons[extension], name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB', count: rows.length });
    emit('importSuccess', payload);
  } catch (error) {
    if (revision === loadRevision) emit('update:error', error.message);
  }
}
function showTemplates(event) {
  showMenu(event, { model: [
    { label: $t('{type} 模板', { type: 'excel' }), command: () => downloadWorkbook() },
    { label: $t('{type} 模板', { type: 'txt' }), command: () => downloadText() },
  ] });
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <Alert v-if="fileInfo.valid && !props.error" class="w-full" type="success" :title="$t('{count} 个窗口已成功导入', { count: fileInfo.count })" :closable="false" />
    <Alert v-if="props.error" class="w-full" type="error" @close="emit('update:error', null)">
      <template #content><div class="whitespace-pre-wrap">{{ props.error }}</div></template>
    </Alert>
    <div v-if="fileInfo.name" class="pa-4 rounded-xl file">
      <div class="flex items-center gap-3">
        <Icon class="font-size-6" :name="fileInfo.icon" color="var(--colors-icon-icon-success)" />
        <span class="flex-1 file-name">{{ fileInfo.name }}</span>
        <Icon class="font-size-6" name="base/rx_ic_check_fill" color="var(--colors-icon-icon-success)" />
      </div>
      <div class="px-9 file-size">{{ fileInfo.size }}</div>
    </div>
    <div class="pa-4 rounded-xl upload">
      <div class="flex flex-col items-center gap-4 py-8 rounded-lg upload-area" @dragover.prevent @drop.prevent="drop">
        <Icon v-if="!fileInfo.name" name="base/rx_ic_doc_fill" :size="48" color="var(--colors-icon-icon-note)" />
        <div class="text-center">
          <div v-if="!fileInfo.name" class="mb-1.5 upload-title">{{ $t('请拖拽到此处或点击上传') }}</div>
          <div class="w-60 mx-auto upload-desc">{{ $t('请将编辑好的文件在此处上传，仅支持 {type} 类型文件, 最大不超过 5MB.', { type: '.xlsx .txt' }) }}</div>
        </div>
        <Button icon="base/rx_ic_export" :label="fileInfo.valid ? $t('重新上传') : $t('上传文件')" outlined severity="secondary" @click="choose" />
      </div>
    </div>
    <div class="help">
      <I18nText scope="global" :keypath="$t('请点击下载 {templateFile}，本次最多可导入 {maxCreateWindowCount} 个窗口。', { templateFile: '{templateFile}', maxCreateWindowCount: '{maxCreateWindowCount}' })">
        <template #templateFile><span class="help-link" @click="showTemplates">{{ $t('窗口导入模板') }}</span></template>
        <template #maxCreateWindowCount>{{ maxRows }}</template>
      </I18nText>
    </div>
  </div>
</template>
