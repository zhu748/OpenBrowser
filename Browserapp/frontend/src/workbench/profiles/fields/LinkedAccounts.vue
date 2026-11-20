<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { h as requests } from './utils-BIWenCnY.js';
import { a as storeToRefs, n as useNotice } from './agent-BmSFI9WH.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { n as useTheme } from './theme-mq6SsndU.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Label } from './input-label-qeCNGFwS.js';
import { t as Input } from './m-input-text-JVbCgVJP.js';
import { t as Password } from './m-input-password-IOnajQ90.js';
import { t as Picker } from './m-input-select-C8pih1gY.js';
import { t as PlatformIcon } from './platform-icon-Cvcj894X.js';
import { l as PlatformUrl, o as extractLabels, s as fieldLabels, u as extractPlatforms } from './quick-kroUOSn_.js';

defineOptions({ inheritAttrs: false });
const accounts = defineModel({ type: Array, default: () => [] });
const [_, notifyError] = useNotice();
const confirm = useConfirm();
const { realTheme } = storeToRefs(useTheme());
const platforms = ref([]);
const labels = ref([]);
const savedAccounts = ref([]);
const loading = ref(false);
let revision = 0;

const fields = ['platformUrl', 'platformUserName', 'platformPassword', 'platformEfa', 'platformIcon', 'platformIconDark'];
const selected = computed(() => new Set((accounts.value ?? []).map(account => account?.id).filter(id => id != null && !['0', ''].includes(String(id))).map(String)));
const available = computed(() => savedAccounts.value.filter(account => !selected.value.has(String(account.id))));
const searchFields = ['searchText', 'label', 'platformUserName', 'platformName', 'platformUrl', 'platformRemarks'];
const securityHelp = () => $t('仅当平台账号已开启双重验证时填写，填写后可用于自动生成验证码。');

onMounted(() => {
  loadPlatforms();
  loadAccounts();
});
async function loadPlatforms() {
  try {
    const { data } = await requests.platform.userGetPlatformInfoList({});
    platforms.value = extractPlatforms(data.rows);
    labels.value = extractLabels(data.rows);
  } catch (error) {
    notifyError(-1, error.message || $t('平台账号加载失败'));
  }
}
function option(account) {
  const domain = (account.platformUrl || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const platform = account.platformName || domain;
  const label = account.platformUrl || platform || '--';
  const searchText = [account.platformUserName, account.platformName, account.platformUrl, String(account.platformRemarks ?? '').trim(), platform, label]
    .filter(Boolean).join(' ');
  return { ...account, image: account.platformIcon, darkImage: account.platformIconDark, label, searchText };
}
function meta(account) {
  return [account.platformUserName, account.platformRemarks].map(value => String(value ?? '').trim()).filter(Boolean).join(' · ');
}
async function loadAccounts() {
  const turn = ++revision;
  loading.value = true;
  try {
    const { code, data } = await requests.platform.userGetPlatformInfoV2List({ page_index: 1, page_size: 200 });
    if (turn === revision && code === 0) savedAccounts.value = (data?.rows ?? []).map(option);
  } catch (error) {
    if (turn === revision) notifyError(-1, error.message || $t('平台账号加载失败'));
  } finally {
    if (turn === revision) loading.value = false;
  }
}
function draftId() {
  return Date.now().toString(32) + Math.random().toString(16).slice(2, 6);
}
function snapshot(account = {}) {
  return Object.fromEntries(fields.map(field => [field, account[field] ?? '']));
}
function add() {
  accounts.value = [...(accounts.value ?? []), { ...snapshot(), _tempId: draftId() }];
}
function choose(id) {
  const account = available.value.find(item => String(item.id) === String(id));
  if (account) accounts.value = [...(accounts.value ?? []), { ...account, _tempId: draftId(), _linkedSnapshot: snapshot(account) }];
}
watch(accounts, rows => {
  for (const account of rows ?? []) {
    if (!account?.id || account._linkedSnapshot) continue;
    account._tempId ??= draftId();
    account._linkedSnapshot = snapshot(account);
  }
}, { immediate: true });
function detachIfEdited(account) {
  if (!account.id || !account._linkedSnapshot) return;
  if (fields.every(field => account[field] === account._linkedSnapshot[field])) return;
  delete account.id;
  delete account._linkedSnapshot;
}
function update(account, field, value) {
  account[field] = value;
  detachIfEdited(account);
}
function iconsChanged(account, { platformIcon, platformIconDark, fromUser }) {
  Object.assign(account, { platformIcon, platformIconDark });
  if (fromUser) detachIfEdited(account);
  else if (account._linkedSnapshot) Object.assign(account._linkedSnapshot, { platformIcon, platformIconDark });
}
function remove(account) {
  const key = account._tempId || account.id;
  const apply = () => { accounts.value = accounts.value.filter(item => (item._tempId || item.id) !== key); };
  if (!account.platformUrl && !account.platformUserName && !account.platformPassword && !account.platformEfa) {
    apply();
    return;
  }
  confirm.require({ header: $t('删除账号'), message: $t('您确认要删除该账号吗？'),
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认'), severity: 'danger' }, accept: apply });
}
</script>

<template>
  <div class="w-full flex items-start account-platform">
    <Label class="shrink-0 max-w-25 !min-w-25 text-right" :label="$t('平台账号')"
      :tooltip="$t('用于将平台登录账号与当前窗口关联，方便区分和管理不同业务账号。不绑定平台账号也可正常创建窗口。')" />
    <div class="min-w-0 flex-1 flex flex-col gap-3">
      <div v-for="(account, index) in accounts" :key="account._tempId || account.id || index" class="flex items-center pa-4 gap-4 rounded-2 panel">
        <div class="flex-1 min-w-0 grid gap-x-3 gap-y-3 items-center account-fields">
          <div class="tt-tertiary text-3 text-right">{{ $t('待绑定平台') }}</div>
          <PlatformUrl class="min-w-0" :url="account.platformUrl" :icon="account.platformIcon" :icon-dark="account.platformIconDark"
            :options="platforms" :dark-mode="realTheme === 'dark'" :placeholder="$t('请选择或输入平台网址')"
            @update:url="update(account, 'platformUrl', $event)" @icons="iconsChanged(account, $event)" />
          <div class="tt-tertiary text-3 text-right">{{ fieldLabels(account, labels).account }}</div>
          <Input :model-value="account.platformUserName" class="min-w-0" :placeholder="$t('请输入账号')"
            @update:model-value="update(account, 'platformUserName', $event)" />
          <div class="tt-tertiary text-3 text-right">{{ fieldLabels(account, labels).password }}</div>
          <Password :model-value="account.platformPassword" class="min-w-0" :placeholder="$t('请输入密码')"
            @update:model-value="update(account, 'platformPassword', $event)" />
          <div class="flex items-center justify-end gap-1">
            <span class="tt-tertiary text-3 text-right">{{ $t('2FA 密钥') }}</span>
            <Icon v-tooltip="securityHelp()" name="base/rx_ic_info" size="12" color="var(--colors-icon-icon-note)" />
          </div>
          <Input :model-value="account.platformEfa" class="min-w-0" :placeholder="$t('请输入 2FA 密钥 （选填）')"
            @update:model-value="update(account, 'platformEfa', $event)" />
        </div>
        <Icon class="mt-2 shrink-0 cursor-pointer" name="base/rx_ic_bin_1" color="var(--colors-icon-icon-tertiary)" @click="remove(account)" />
      </div>
      <div class="flex items-center gap-2">
        <Button severity="secondary" outlined icon="base/rx_ic_add_keys" :label="$t('添加账号')" @click="add" />
        <Picker :model-value="null" class="flex-1 min-w-0" :options="available" option-value="id" option-label="label" filter
          :highlight-on-select="false" :dark-mode="realTheme === 'dark'" :filter-fields="searchFields"
          :filter-placeholder="$t('搜索账号 / 平台 / 备注')" :placeholder="$t('选择已有账号')"
          :empty-message="$t(loading ? '加载中...' : '暂无平台账号')" overlay-class="account-picker-panel" scroll-height="20rem"
          @before-show="loadAccounts" @update:model-value="choose">
          <template #option="{ option: item }">
            <div class="account-option">
              <PlatformIcon v-if="item.platformIcon" class="account-option__icon" :platform-icon="item.platformIcon" :platform-icon-dark="item.platformIconDark" />
              <Icon v-else class="account-option__icon" name="base/rx_ic_user_key" :size="16" color="var(--colors-icon-icon-tertiary)" />
              <div class="account-option__body">
                <div class="account-option__title">{{ item.label }}</div><div v-if="meta(item)" class="account-option__meta">{{ meta(item) }}</div>
              </div>
            </div>
          </template>
          <template #footer="{ close }">
            <div class="pa-1"><Button class="w-full" text icon="base/rx_ic_add_keys" :label="$t('添加账号')" @click="close(); add()" /></div>
          </template>
        </Picker>
      </div>
    </div>
  </div>
</template>
