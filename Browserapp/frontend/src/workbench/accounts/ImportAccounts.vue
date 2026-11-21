<script setup>
import { ref, resolveComponent, toRaw } from 'vue';
import { o as toModule } from './rolldown-runtime-BCiCTKAo.js';
import { h as requests, vt as cache, yt as useCache } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { b as useRouter } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as exceljs } from './exceljs.min-DfecxsXL.js';

const I18nText = resolveComponent('i18n-t');
const Workbook = toModule(exceljs(), 1).default.Workbook;
const router = useRouter();
const [showSuccess, showStatus] = useNotice();
const { invalidateCache } = useCache();
const maxFileSize = 5 * 1024 * 1024;
const maxRows = 500;
const filename = ref('');
const rows = ref([]);
const saving = ref(false);
const reading = ref(false);

async function selectFile(file) {
  if (reading.value || saving.value) return;
  reading.value = true;
  try {
    if (file && file.size > maxFileSize) throw Error($t('文件大小不能超过 5MB'));
    const payload = file ? { filename: file.name, bytes: await file.arrayBuffer() } : {};
    const result = await globalThis.__localRequest('accounts:import-preview', payload);
    if (result.canceled) return;
    rows.value = result.values;
    filename.value = result.filename;
  } catch (error) {
    rows.value = [];
    filename.value = '';
    showStatus(-1, error.message);
  } finally {
    reading.value = false;
  }
}

function drop(event) {
  const file = event.dataTransfer?.files?.[0];
  if (file) return selectFile(file);
}

function workbookColumns() {
  return [
    { header: $t('平台'), key: 'platformUrl', width: 30 },
    { header: $t('账号'), key: 'platformUserName', width: 20 },
    { header: $t('密码'), key: 'platformPassword', width: 20 },
    { header: '2FA', key: 'platformEfa', width: 20 },
    { header: $t('备注'), key: 'platformRemarks', width: 20 },
  ];
}

async function save(continueAdding) {
  if (saving.value || reading.value) return;
  if (!rows.value.length) {
    showStatus(-1, $t('请先上传账号文件'));
    return;
  }
  saving.value = true;
  try {
    const { code, msg } = await requests.platform.userAddPlatformInfoBatchCreate(toRaw(rows.value));
    if (code !== 0) {
      showStatus(code, msg);
      return;
    }
    showSuccess(0, $t('导入成功'));
    invalidateCache(cache.ACCOUNT_LIST);
    if (continueAdding) {
      rows.value = [];
      filename.value = '';
    } else await router.replace({ name: 'account-list' });
  } catch (error) {
    showStatus(-1, error.message);
  } finally {
    saving.value = false;
  }
}

async function downloadTemplate() {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Accounts');
  sheet.columns = workbookColumns();
  sheet.addRow({
    platformUrl: 'https://www.facebook.com/', platformUserName: 'example@gmail.com', platformPassword: 'password123', platformEfa: '', platformRemarks: '',
  });
  const file = await workbook.xlsx.writeBuffer();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([file], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  link.download = 'account_import_template.xlsx';
  link.click();
  URL.revokeObjectURL(link.href);
}
</script>

<template>
  <div class="flex flex-col h-full pt-4 px-4 content">
    <div class="template-import">
      <div class="upload-card" @dragover.prevent @drop.prevent="drop">
        <div class="upload-card__dropzone">
          <Icon name="base/rx_ic_doc_fill" size="48" color="var(--colors-icon-icon-note)" />
          <div class="upload-card__text">
            <div class="upload-card__title">{{ $t('选择文件并拖拽到此处') }}</div>
            <div class="upload-card__desc">{{ $t('在此上传编辑后的文件，仅支持 .xlsx .txt 文件，最大 5MB。') }}</div>
          </div>
          <Button icon="base/rx_ic_export" :label="filename ? $t('重新上传') : $t('上传文件')" outlined severity="secondary" :disabled="reading || saving" @click="selectFile()" />
          <div v-if="filename" class="upload-card__filename">{{ filename }}</div>
        </div>
      </div>
      <I18nText tag="div" class="template-tip" :keypath="$t('点击下载 {link}。一次最多可导入 {count} 个账号。', { link: '{link}', count: maxRows })" scope="global">
        <template #link><span class="template-link" @click="downloadTemplate">{{ $t('账号导入模板') }}</span></template>
      </I18nText>
    </div>
    <div class="flex flex-1 items-end">
      <div class="w-full flex justify-end gap-3 pt-4 pb-5">
        <Button severity="secondary" outlined :loading="saving" :disabled="reading" :label="$t('保存 & 继续添加')" @click="save(true)" />
        <Button :loading="saving" :disabled="reading" :label="$t('保存')" @click="save(false)" />
      </div>
    </div>
  </div>
</template>
