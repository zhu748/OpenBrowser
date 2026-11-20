<script setup>
import { ref, resolveComponent, toRaw } from 'vue';
import { o as toModule } from './rolldown-runtime-BCiCTKAo.js';
import { h as requests, hr as extensionOf, vt as cache, yt as useCache } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { b as useRouter } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as exceljs } from './exceljs.min-DfecxsXL.js';
import { l as cellText, u as parseAccountLine } from './utils-CnUy4XUk.js';
import { n as spreadsheetTypes, t as textTypes } from './constants-DLlGaEfk.js';

const I18nText = resolveComponent('i18n-t');
const Workbook = toModule(exceljs(), 1).default.Workbook;
const router = useRouter();
const [showSuccess, showStatus] = useNotice();
const { invalidateCache } = useCache();
const accept = Object.freeze({ ...textTypes, ...spreadsheetTypes });
const maxFileSize = 5 * 1024 * 1024;
const maxRows = 200;
const filename = ref('');
const rows = ref([]);
const saving = ref(false);

async function selectFile() {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'Account Files', accept }], excludeAcceptAllOption: true, multiple: false,
    });
    if (handle) await readFile(await handle.getFile());
  } catch (error) {
    if (error.name !== 'AbortError') showStatus(-1, error.message);
  }
}

function drop(event) {
  const file = event.dataTransfer?.files?.[0];
  if (file) return readFile(file);
}

async function readFile(file) {
  if (file.size > maxFileSize) {
    showStatus(-1, $t('文件大小不能超过 5MB'));
    return;
  }
  try {
    const accounts = extensionOf(file.name) === 'txt' ? await readText(file) : await readWorkbook(file);
    if (!accounts.length) showStatus(-1, $t('未解析到有效账号数据'));
    else if (accounts.length > maxRows) showStatus(-1, $t('最多一次导入 {count} 个账号', { count: maxRows }));
    else {
      rows.value = accounts;
      filename.value = file.name;
    }
  } catch (error) {
    showStatus(-1, error.message);
  }
}

async function readText(file) {
  const text = await file.text();
  const { data } = await requests.platform.userGetPlatformInfoList({});
  const platform = data.rows[0];
  return text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const { username, password, twoFactor, remark } = parseAccountLine(line);
    return {
      platformIcon: platform?.platformIcon ?? '', platformIconDark: platform?.platformIconDark ?? '',
      platformUrl: platform?.platformUrl ?? '', platformUserName: username ?? '', platformPassword: password ?? '',
      platformEfa: twoFactor ?? '', platformRemarks: remark ?? '', platformName: '',
    };
  });
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

async function readWorkbook(file) {
  const workbook = new Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const header = sheet.getRow(1).values;
  const keys = new Map(workbookColumns().flatMap(({ key, header }) => [[key, key], [header, key]]));
  const accounts = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const account = { platformIcon: '', platformIconDark: '', platformName: '' };
    row.eachCell((cell, column) => {
      const key = keys.get(header[column]);
      if (key) account[key] = cellText(cell.value);
    });
    if (account.platformUrl || account.platformUserName) accounts.push(account);
  });
  return accounts;
}

async function save(continueAdding) {
  if (saving.value) return;
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
          <Button icon="base/rx_ic_export" :label="filename ? $t('重新上传') : $t('上传文件')" outlined severity="secondary" @click="selectFile" />
          <div v-if="filename" class="upload-card__filename">{{ filename }}</div>
        </div>
      </div>
      <I18nText tag="div" class="template-tip" :keypath="$t('点击下载 {link}。一次最多可导入 {count} 个账号。', { link: '{link}', count: maxRows })" scope="global">
        <template #link><span class="template-link" @click="downloadTemplate">{{ $t('账号导入模板') }}</span></template>
      </I18nText>
    </div>
    <div class="flex flex-1 items-end">
      <div class="w-full flex justify-end gap-3 pt-4 pb-5">
        <Button severity="secondary" outlined :loading="saving" :label="$t('保存 & 继续添加')" @click="save(true)" />
        <Button :loading="saving" :label="$t('保存')" @click="save(false)" />
      </div>
    </div>
  </div>
</template>
