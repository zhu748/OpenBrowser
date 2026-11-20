<script setup>
import { h as api, ti as isFirefoxSupported } from './utils-BIWenCnY.js';
import { computed, inject, onMounted, ref } from './workbench-vue.js';
import { n as normalizeCookies } from './cookie-CqdL0VrU.js';
import { n as useToast } from './agent-BmSFI9WH.js';
import { t as formatDate } from './format-_cvrr_iF.js';
import { n as useProxyLabels } from './proxy-shop-labels-nJaBS4W_.js';
import { t as exportWorkbook } from './utils-CnUy4XUk.js';
import { n as useLabels } from './useProfileEntityLabels-BfqbVpel.js';
import { t as Radio } from './rx-input-radio-BGeLgzak.js';
import { t as Table } from './table-BJcS2I0Z.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
const previewLength = 5;
const saving = ref(false);

let dialog = inject('dialogRef'),
  [notify, showError] = useToast(),
  labels = useLabels(),
  proxyLabels = useProxyLabels(),
  input = ref(),
  onConfirm = ref(),
  onCancel = ref(),
  names = ref(),
  excel = ref(true),
  columns = [{ header: 'All', field: 'name' }],
  fields = computed(() =>
    [
      { key: 'windowName', name: labels.value.entityName },
      {
        key: 'os',
        name: $t('操作系统'),
        getText: (e3) => (e3.os === 'IOS' ? 'iOS' : e3.os),
      },
      ...(isFirefoxSupported()
        ? [
            { key: 'coreType', name: $t('浏览器内核') },
            { key: 'coreVersion', name: $t('内核版本') },
          ]
        : []),
      { key: 'osVersion', name: $t('系统版本') },
      {
        key: 'proxyCategory',
        name: proxyLabels.value.entityTypeColumn,
        getText: (e3) =>
          e3.proxyCategory === 'noproxy'
            ? '直连'
            : e3.proxyCategory?.toLocaleUpperCase(),
      },
      {
        key: 'proxyInfo',
        name: proxyLabels.value.entityInfoColumn,
        getText: (e3) => {
          if (!e3.host) return '';
          let t3 =
              String(e3.ipType ?? 'ipv4').toLocaleLowerCase() === 'ipv4'
                ? ''
                : 'ipv6:',
            n3 = e3.proxyUserName
              ? `:${e3.proxyUserName}:${e3.proxyPassword}`
              : '',
            r3 = e3.refreshUrl ? `[${e3.refreshUrl}]` : '';
          return `${t3}${e3.host}:${e3.port}${n3}${r3}`;
        },
      },
      {
        key: 'windowPlatformList',
        name: $t('平台账号'),
        getText: (e3) => {
          let t3 = e3.windowPlatformList?.map((e4) =>
            [
              e4.platformUrl,
              e4.platformUserName,
              e4.platformPassword,
              e4.platformEfa,
            ]
              .filter(Boolean)
              .join(':'),
          );
          return excel.value ? JSON.stringify(t3, null, 2) : JSON.stringify(t3);
        },
      },
      {
        key: 'defaultOpenUrl',
        name: $t('自定义打开 URL'),
        getText: (e3) => JSON.stringify(e3.defaultOpenUrl || '[]'),
      },
      {
        key: 'cookie',
        name: 'Cookie',
        getText: (e3) => {
          let t3 = normalizeCookies(e3.cookie),
            n3 = t3.length ? JSON.stringify(t3) : '';
          if (excel.value && n3.length >= 32767) {
            let t4 = $t(
              '[{name}] 的 cookies 长度超过 Excel 文档限制，请使用 txt 格式进行导出。',
              { name: `${input.value.workspaceName}-${e3.windowSortNum}` },
            );
            throw (
              showError(-1, t4, { severity: 'warn', life: 5e3 }),
              Error(t4)
            );
          }
          return n3;
        },
      },
      { key: 'windowRemark', name: $t('备注') },
      { key: 'userAgent', name: 'User-Agent' },
      { key: 'searchEngine', name: $t('搜索引擎') },
      { key: 'dirId', name: labels.value.entityId },
    ].map((e3, t3) => ({ ...e3, _index: t3 })),
  ),
  selected = ref([]);
async function readRows() {
  let e3 = input.value.data.map((e4) => e4.id),
    {
      data: { rows: t3 },
    } = await api.window.userGetWindowInfoV2List({
      windowIds: e3.join(','),
      isDelete: 0,
      page_index: 1,
      page_size: e3.length,
    }),
    n3 = [...selected.value].sort((e4, t4) => e4._index - t4._index);
  return t3.map((e4) =>
    n3.reduce(
      (t4, n4) => (
        t4[n4.key] || (t4[n4.key] = n4.getText?.(e4) ?? e4[n4.key] ?? ''),
        t4
      ),
      {},
    ),
  );
}
async function exportExcel() {
  let e3 = await readRows(),
    t3 = e3.some((e4) => e4.dirId);
  await exportWorkbook({
    afterAddColumns: (e4) =>
      t3
        ? [...e4, { header: labels.value.entityIdExportOnly, key: 'dirId' }]
        : e4,
    afterAddExplain: (t4) => {
      t4.addRows(e3);
    },
  });
}
async function exportText() {
  let e3 = (await readRows()).map((e4) =>
      Object.entries(e4).map(([e5, t4]) => `${e5}=${t4}`).join(`
`),
    ).join(`

${'#'.repeat(40)}

`),
    t3 = new Blob([e3], { type: 'text/plain' }),
    n3 = document.createElement('a');
  const url = URL.createObjectURL(t3);
  n3.href = url;
  ((n3.download = `rx_profiles_${formatDate(new Date(), 'yyyy-MM-dd HH_mm_ss')}.txt`),
    document.body.appendChild(n3),
    n3.click(),
    document.body.removeChild(n3));
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
function close() {
  (dialog.value.close(), onCancel.value?.());
}
async function submit() {
  if (saving.value || !selected.value.length) return;
  saving.value = true;
  try {
    if (excel.value) await exportExcel();
    else await exportText();
    close();
  } catch (error) {
    console.warn(error);
  } finally {
    saving.value = false;
  }
}
onMounted(() => {
  let { props: e3, onConfirm: n3, onCancel: r3 } = dialog.value.data;
  ((input.value = e3),
    (onConfirm.value = n3),
    (onCancel.value = r3),
    (names.value =
      e3.data
        .slice(0, previewLength)
        .map((e4) => `${input.value.workspaceName}-${e4.windowSortNum}`)
        .join(', ') +
      (e3.data.length > previewLength
        ? `, ...(${e3.data.length - previewLength} more)`
        : '')),
    (selected.value = fields.value.slice(0, -1)));
});
</script>

<template>
  <div class="flex flex-col popup">
    <div class="flex flex-col popup-content">
      <div class="flex flex-col popup-block">
        <div class="popup-block__title">{{ labels.exportEntities }}</div>
        <div class="popup-block__description">{{ names }}</div>
      </div>
      <div class="flex flex-col popup-block">
        <div class="popup-block__title">{{ $t('请选择您的文件格式:') }}</div>
        <Radio
          v-model="excel"
          size="xs"
          name="proxySwitch"
          :options="[
            { label: 'Excel (.xls)', value: true },
            { label: 'Text (.txt)', value: false },
          ]"
        />
        <div class="popup-block__tip">{{ labels.exportCookieTip }}</div>
      </div>
      <div class="h-80 flex flex-col popup-block">
        <div class="popup-block__title">{{ $t('请选择您要导出的数据:') }}</div>
        <div class="flex-ovh-1 table-container">
          <Table
            v-model:selection="selected"
            data-key="key"
            :columns="columns"
            :data-list="fields"
            :regions="{
              header: false,
              paginator: false,
              actions: false,
              selectionBar: false,
            }"
            selection-mode="multiple"
            size="small"
          />
        </div>
      </div>
    </div>
    <div class="footer">
      <Button
        size="sm"
        :label="$t('取消')"
        text
        severity="secondary"
        :disabled="saving"
        @click.stop="close"
      />
      <Button
        size="sm"
        :label="$t('导出数据')"
        :loading="saving"
        :disabled="!selected.length"
        @click.stop="submit"
      />
    </div>
  </div>
</template>
