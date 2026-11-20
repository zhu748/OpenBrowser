<script setup>
import { inject, ref } from 'vue';
import { o as toModule } from './rolldown-runtime-BCiCTKAo.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as formatDate } from './format-_cvrr_iF.js';
import { t as exceljs } from './exceljs.min-DfecxsXL.js';
import { a as windowNumbers, i as formatAccount } from './quick-CZrtqSCy.js';
import { t as Radio } from './rx-input-radio-BGeLgzak.js';

const dialog = inject('dialogRef');
const asWorkbook = ref(true);
const workbookType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const fileTypes = [{ label: 'Excel (.xlsx)', value: true }, { label: 'Text (.txt)', value: false }];

function close() {
  dialog?.value?.close();
}

function columns(canViewPassword, workspace) {
  const fields = [
    { key: 'platformUrl', name: $t('平台') },
    { key: 'platformUserName', name: $t('账号') },
  ];
  if (canViewPassword) fields.push({ key: 'platformPassword', name: $t('密码') });
  return fields.concat([
    { key: 'platformEfa', name: '2FA' },
    { key: 'platformRemarks', name: $t('备注') },
    { key: 'window_info', name: $t('已关联窗口'), getText: account => windowNumbers(account.window_info).map(number => workspace + '-' + number).join(', ') },
  ]);
}

async function createWorkbook(accounts, details) {
  const Workbook = toModule(exceljs(), 1).default.Workbook;
  const sheetFile = new Workbook();
  const sheet = sheetFile.addWorksheet('Accounts');
  sheet.columns = details.map(({ key, name }) => ({ key, header: name, width: 24 }));
  sheet.addRows(accounts.map(account => Object.fromEntries(details.map(({ key, getText }) => [key, getText?.(account) ?? account[key] ?? '']))));
  return new Blob([await sheetFile.xlsx.writeBuffer()], { type: workbookType });
}

async function download() {
  const { data = [], canViewPassword, workspaceName } = dialog?.value?.data?.props ?? {};
  const workbook = asWorkbook.value;
  const contents = workbook
    ? await createWorkbook(data, columns(canViewPassword, workspaceName))
    : new Blob([data.map(account => formatAccount(account, canViewPassword)).join('\n')], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(contents);
  link.download = 'accounts_' + formatDate(new Date(), 'yyyy-MM-dd HH_mm_ss') + (workbook ? '.xlsx' : '.txt');
  link.click();
  URL.revokeObjectURL(link.href);
  close();
}
</script>

<template>
  <div class="flex flex-col gap-5 pt-6 export-accounts">
    <div class="flex justify-between items-center">
      <span class="title">{{ $t('导出数据') }}</span>
      <Icon class="cursor-pointer" name="base/rx_ic_delete" size="20" color="#575D60" @click="close" />
    </div>
    <div class="desc">{{ $t('请选择您要导出的数据:') }}</div>
    <Radio v-model="asWorkbook" :options="fileTypes" />
    <div class="flex justify-end gap-2">
      <Button severity="secondary" outlined :label="$t('取消')" @click="close" />
      <Button :label="$t('导出数据')" @click="download" />
    </div>
  </div>
</template>
