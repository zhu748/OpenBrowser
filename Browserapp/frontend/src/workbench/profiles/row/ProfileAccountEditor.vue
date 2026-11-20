<script setup>
import {
  cr as cloneAccount,
  h as api,
  mn as accountsEqual,
} from './utils-BIWenCnY.js';
import { ref, onMounted, useTemplateRef, watch } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { n as useTheme } from './theme-mq6SsndU.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Form } from './form-BQBA_XzO.js';
import { t as PlatformIcon } from './platform-icon-Cvcj894X.js';
import {
  c as PlatformUrl,
  o as platformLabels,
  s as fieldLabelsFor,
  u as platformOptions,
} from './quick-kroUOSn_.js';

const props = defineProps({ datas: { type: Array, default: () => [] } });
const emit = defineEmits(['confirm']);

let notify = emit,
  confirm = useConfirm(),
  accounts = ref(
    props.datas.map((e3, t3) => ({
      ...e3,
      tid: (Date.now() + t3 ** 2).toString(32),
      invalid: false,
    })),
  ),
  originalAccounts = Object.fromEntries(
    accounts.value
      .filter((e3) => !!e3.id)
      .map((e3) => [e3.id, cloneAccount(e3)]),
  ),
  activeAccount = ref(accounts.value[0]),
  removedIds = ref([]),
  accountForm = useTemplateRef('account'),
  theme = useTheme(),
  labels = ref([]);
function setIcons(e3) {
  if (!activeAccount.value) return;
  ((activeAccount.value.platformIcon = e3.platformIcon),
    (activeAccount.value.platformIconDark = e3.platformIconDark));
  let t3 = activeAccount.value.id
    ? originalAccounts[activeAccount.value.id]
    : undefined;
  !e3.fromUser &&
    t3 &&
    ((t3.platformIcon = e3.platformIcon),
    (t3.platformIconDark = e3.platformIconDark));
}
function setAccountLabels(e3) {
  let t3 = activeAccount.value,
    n3 =
      e3 ??
      String(
        accountForm.value?.getFieldState('platformUrl')?.value ??
          t3?.platformUrl ??
          '',
      ),
    r2 = String(t3?.platformUrl ?? ''),
    i3 = fieldLabelsFor(
      {
        platformUrl: n3,
        platformAbbr: n3 === r2 ? t3?.platformAbbr : undefined,
      },
      labels.value,
    );
  accountForm.value?.setInputsProps({
    platformUserName: { label: i3.account },
    platformPassword: { label: i3.password },
  });
}
let fields = [
  {
    label: $t('平台'),
    name: 'platformUrl',
    render: PlatformUrl,
    props: {
      placeholder: $t('请输入或选择平台网址'),
      darkMode: theme.realTheme === 'dark',
      icon: activeAccount.value?.platformIcon || '',
      iconDark: activeAccount.value?.platformIconDark || '',
      syncKey: activeAccount.value?.tid || '',
      options: [],
      onIcons: setIcons,
      onUrlChange: setAccountLabels,
    },
    resolver: (e3) => e3.string().url($t('请输入正确的平台网址')),
  },
  {
    type: 'text',
    label: $t('平台登录账号'),
    name: 'platformUserName',
    props: { placeholder: $t('请输入账号') },
  },
  {
    type: 'password',
    label: $t('平台登录密码'),
    name: 'platformPassword',
    props: { placeholder: $t('请输入密码') },
  },
  {
    type: 'text',
    label: $t('2FA 密钥'),
    tooltip: $t(
      '仅当平台账号已开启双重验证时填写，填写后可用于自动生成验证码。',
    ),
    name: 'platformEfa',
    props: { placeholder: $t('请输入 2FA 密钥') },
  },
];
(watch(
  () => theme.realTheme,
  () => {
    accountForm.value?.setInputsProps({
      platformUrl: { darkMode: theme.realTheme === 'dark' },
    });
  },
),
  onMounted(async () => {
    populateForm(activeAccount.value);
    let {
      data: { rows: e3 },
    } = await api.platform.userGetPlatformInfoList({});
    ((labels.value = platformLabels(e3)),
      accountForm.value?.setInputsProps({
        platformUrl: { options: platformOptions(e3) },
      }),
      setAccountLabels());
  }));
function populateForm(e3 = {}) {
  let t3 = Object.fromEntries(fields.map((t4) => [t4.name, e3[t4.name]]));
  (accountForm.value?.setValues(t3),
    accountForm.value?.setInputsProps({
      platformUrl: {
        icon: e3.platformIcon || '',
        iconDark: e3.platformIconDark || '',
        syncKey: e3.tid || '',
      },
    }),
    setAccountLabels(String(e3.platformUrl ?? '')));
}
function captureAccount() {
  if (!activeAccount.value || !accountForm.value?.instance.states) return;
  let e3 = Object.entries(accountForm.value?.instance.states).map(
    ([e4, t3]) => [e4, t3.value],
  );
  e3.some(([e4, t3]) => !!t3) &&
    e3.forEach(([e4, t3]) => {
      (e4 === 'platformUrl' && Reflect.set(activeAccount.value, 'invalid', !t3),
        Reflect.set(activeAccount.value, e4, t3));
    });
}
function selectAccount(e3) {
  (captureAccount(), (activeAccount.value = e3), populateForm(e3));
}
function temporaryId() {
  return `${Date.now().toString(32)}${Math.random().toString(16).slice(2, 8)}`;
}
function addAccount() {
  captureAccount();
  let e3 = {
    ...Object.fromEntries(fields.map((e4) => [e4.name, ''])),
    tid: temporaryId(),
    invalid: false,
  };
  (accounts.value.push(e3),
    (activeAccount.value = accounts.value[accounts.value.length - 1]),
    accountForm.value?.reset(),
    populateForm(activeAccount.value));
}
function removeAccount() {
  confirm.require({
    header: $t('删除账号'),
    message: $t('您确认要删除该账号吗？'),
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认'), severity: 'danger' },
    accept: () => {
      if (!accounts.value.length) return;
      activeAccount.value.id && removedIds.value.push(activeAccount.value.id);
      let e3 = accounts.value.findIndex(
        (e4) => e4.tid === activeAccount.value.tid,
      );
      (accounts.value.splice(e3, 1),
        (activeAccount.value = accounts.value[Math.max(e3 - 1, 0)] || {}),
        populateForm(activeAccount.value));
    },
  });
}
function save() {
  captureAccount();
  let e3 = accounts.value.find((e4) => e4.invalid);
  if (e3) {
    (selectAccount(e3), accountForm.value?.submit());
    return;
  }
  let t3 = accounts.value.reduce((e4, t4) => {
    let { tid: n3, invalid: r2, platformUrl: i3, ...a2 } = t4;
    if (r2 || !i3) return e4;
    if (a2.id && !accountsEqual(originalAccounts[a2.id], t4)) {
      let { id: t5, ...r3 } = a2;
      (e4.push({ _tempId: n3, platformUrl: i3, ...r3 }),
        removedIds.value.push(t5));
    } else e4.push({ platformUrl: i3, ...a2 });
    return e4;
  }, []);
  notify('confirm', {
    windowPlatformList: t3,
    platformUrlIds: [...new Set(removedIds.value)],
  });
}
</script>

<template>
  <div class="flex flex-col h-full content">
    <div class="flex flex-1 overflow-y-auto">
      <div class="flex flex-col select-none sidebar">
        <div
          v-for="item in accounts"
          :key="item.tid"
          class="relative flex items-center justify-center sidebar-item"
          :class="{ active: activeAccount?.tid === item.tid }"
          @click="selectAccount(item)"
        >
          <PlatformIcon
            v-if="item.platformIcon"
            :platform-icon-dark="item.platformIconDark"
            :platform-icon="item.platformIcon"
            class="sidebar-item-icon"
          />
          <Icon v-else name="base/rx_ic_user_key" size="24" />
          <Icon
            v-if="item.invalid"
            class="absolute top-2 right-4"
            name="base/rx_ic_warn_fill"
            color="var(--colors-icon-icon-error, #F53838)"
          />
        </div>
        <div class="flex-1 flex justify-center sidebar-item">
          <div
            v-tooltip="$t('添加新账号')"
            class="flex justify-center items-center sidebar-add"
            @click="addAccount"
          >
            <Icon name="base/rx_ic_plus" />
          </div>
        </div>
      </div>
      <div v-if="accounts.length" class="flex flex-col flex-1 py-4 px-6 gap-6">
        <div class="flex items-center justify-between">
          <div class="subtitle">{{ $t('编辑账号') }}</div>
          <div
            class="flex items-center justify-end gap-1 select-none cursor-pointer remove"
            @click="removeAccount"
          >
            <Icon name="base/rx_ic_bin_1" /><span>{{ $t('移除') }}</span>
          </div>
        </div>
        <Form ref="account" :inputs="fields" />
      </div>
    </div>
    <div class="flex items-end">
      <div class="w-full flex justify-end gap-3 button-group">
        <Button size="sm" :label="$t('保存')" @click="save" />
      </div>
    </div>
  </div>
</template>
