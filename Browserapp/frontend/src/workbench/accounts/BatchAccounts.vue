<script setup>
import { computed, ref, toRaw, watch } from 'vue';
import { h as requests, vt as cache, yt as useCache } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { b as useRouter } from './rich-html-link-VdBpR3Cm.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { n as useTheme } from './theme-mq6SsndU.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as PlatformSelect } from './m-input-select-C8pih1gY.js';
import { t as Empty } from './custom-empty-CChX4pJt.js';
import { t as useSimplePopup } from './simplePopup-D6H7ykCr.js';
import { o as normalizePlatforms, s as accountFields } from './quick-kroUOSn_.js';
import { u as parseAccountLine } from './utils-CnUy4XUk.js';
import { t as Table } from './table-BJcS2I0Z.js';
import { n as RulesPicture, t as Textarea } from './parse-textarea-Dia3ayaD.js';

const router = useRouter();
const confirm = useConfirm();
const theme = useTheme();
const [showSuccess, showStatus] = useNotice();
const { showSimpleDialog } = useSimplePopup();
const { invalidateCache } = useCache();
const input = ref('');
const rows = ref([]);
const platformUrl = ref('');
const catalog = ref([]);
const platforms = ref([]);

function options() {
  return catalog.value.map(item => ({
    image: theme.realTheme === 'dark' ? item.platformIconDark : item.platformIcon,
    platformIconDark: item.platformIconDark, platformIcon: item.platformIcon,
    label: item.platformUrl, value: item.platformUrl,
  }));
}
const platformOptions = ref({
  placeholder: $t('请输入或选择平台网址'), optionValue: 'value', editable: true, size: 'xxs',
  getOptions: async () => {
    const { data } = await requests.platform.userGetPlatformInfoList({});
    catalog.value = data.rows;
    platforms.value = normalizePlatforms(catalog.value);
    return options();
  },
});
watch(() => theme.realTheme, () => { platformOptions.value.options = options(); });

const columns = computed(() => {
  const { account, password } = accountFields({ platformUrl: String(platformUrl.value ?? '') }, platforms.value);
  return [
    { field: 'platformUrl', header: $t('平台'), getText: row => row.platformUrl || '--' },
    { field: 'platformUserName', header: account, getText: row => row.platformUserName || '--' },
    { field: 'platformPassword', header: password, getText: row => row.platformPassword || '--' },
    { field: 'platformEfa', header: $t('2FA 密钥'), getText: row => row.platformEfa || '--' },
    { field: 'platformRemarks', header: $t('备注'), slot: 'remark' },
  ];
});
const regions = { header: false, paginator: false, actions: 'quick' };

function rowActions({ row }) {
  return [{
    key: 'delete', label: $t('删除'), icon: 'base/rx_ic_bin_1', quick: true,
    command: () => { rows.value = rows.value.filter(account => account.id !== row?.id); },
  }];
}

function parse() {
  if (!platformUrl.value) {
    showStatus(-1, $t('请输入或选择平台网址'));
    return;
  }
  const lines = input.value.split('\n').map(line => line.replace(/\s/g, '').replace(/：/g, ':')).filter(Boolean);
  if (!lines.length) {
    showStatus(-1, $t('请先输入账号'));
    return;
  }
  const { platformIcon = '', platformIconDark = '' } = catalog.value.find(item => item.platformUrl === platformUrl.value) ?? {};
  rows.value = [...new Set(lines)].map((line, id) => {
    const { platform, username, password, twoFactor, remark } = parseAccountLine(line);
    return {
      id, platformUrl: platform || platformUrl.value, platformIcon, platformIconDark,
      platformUserName: username ?? '', platformPassword: password ?? '', platformEfa: twoFactor ?? '', platformRemarks: remark ?? '',
    };
  });
  const duplicates = lines.length - rows.value.length;
  if (duplicates) showSuccess(0, $t('{count} 重复账号已过滤。', { count: duplicates }));
}

function editRemark(row) {
  showSimpleDialog({
    title: $t('为所选账号添加备注'),
    inputs: [{
      type: 'textarea', name: 'platformRemarks', value: row?.platformRemarks,
      props: { placeholder: $t('请输入备注'), rows: 6 },
    }],
    async onConfirm(values) { row.platformRemarks = values.platformRemarks; },
  });
}

function clear() {
  confirm.require({
    header: $t('清空账号'), message: $t('您确认清空所有账号吗?'),
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认'), severity: 'danger' },
    accept: () => { rows.value = []; },
  });
}

async function save(continueAdding) {
  const { code, msg } = await requests.platform.userAddPlatformInfoBatchCreate(toRaw(rows.value));
  showStatus(code, msg);
  if (code !== 0) return;
  invalidateCache(cache.ACCOUNT_LIST);
  if (continueAdding) {
    showSuccess(0, msg);
    input.value = '';
    platformUrl.value = '';
    rows.value = [];
  } else {
    await router.replace({ name: 'account-list' });
  }
}
</script>

<template>
  <div class="flex-1 overflow-auto flex-col content">
    <div class="grid grid-cols-10 gap-3 w-full mb-[1px]">
      <div class="col-span-6 flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <div class="subtitle">{{ $t('账号信息') }}</div>
          <PlatformSelect v-model="platformUrl" class="!w-80" v-bind="platformOptions" />
        </div>
        <div class="information">
          <Textarea v-model="input" :placeholder="$t('请在此处输入账号信息')" />
          <div class="flex justify-end information-actions">
            <Button outlined severity="secondary" size="xxs" :label="$t('解析')" icon="base/rx_ic_play" @click.stop="parse" />
          </div>
        </div>
      </div>
      <div class="col-span-4 flex flex-col gap-1 relative z-10">
        <div class="subtitle">{{ $t('导入规则') }}</div>
        <div class="relative overflow-hidden flex-1">
          <div class="rules relative z-10">
            <div class="rules-example"> USERNAME1:PASSWORD1 </div>
            <div class="rules-example"> USERNAME2:PASSWORD2<span class="text-green">:2FA</span><span class="text-blue break-all">{{ '{' + $t('备注') + '}' }}</span></div>
            <br>
            <div class="rules-help">{{ $t('1.支持已有平台和其他平台；对于其他平台，需要手动输入URL。') }}</div>
            <div class="rules-help">{{ $t('2.每行一个账号，一次最多添加{count}个账号。', { count: 500 }) }}</div>
          </div>
          <RulesPicture class="z-9" />
        </div>
      </div>
    </div>
    <div class="flex flex-col flex-1">
      <div class="flex items-center justify-between pt-6 pb-3 table-toolbar">
        <div class="subtitle">{{ $t('已解析账号') }}</div>
        <div class="flex gap-2">
          <Button text severity="secondary" size="xxs" icon="base/rx_ic_bin_1" :label="$t('清空账号')" :disabled="!rows.length" @click.stop="clear" />
        </div>
      </div>
      <Table :columns="columns" :data-list="rows" :model="rowActions" :regions="regions" :actions-pinned="false">
        <template #empty><Empty icon="rx_illustration_lock.svg" :title="$t('暂未添加账号')" class="min-h-262px" /></template>
        <template #remark="{ data }">
          <div class="flex items-center gap-1" @click.stop="editRemark(data)">
            <Button v-tooltip.top="{ value: data.platformRemarks, showDelay: 0 }" class="shrink-0" :class="{ 'note-light': data.platformRemarks }"
              text severity="secondary" size="xxs" :icon="data.platformRemarks ? 'base/rx_ic_doc_fill' : 'base/rx_ic_doc_add'" />
            <div :title="data.platformRemarks" class="min-w-50 whitespace-pre-wrap note-content">{{ data.platformRemarks }}</div>
          </div>
        </template>
      </Table>
    </div>
    <div class="flex justify-end gap-3 footer">
      <Button :label="$t('保存 & 继续添加')" :disabled="!rows.length" severity="secondary" outlined @click.stop="save(true)" />
      <Button :label="$t('保存')" :disabled="!rows.length" @click.stop="save(false)" />
    </div>
  </div>
</template>
