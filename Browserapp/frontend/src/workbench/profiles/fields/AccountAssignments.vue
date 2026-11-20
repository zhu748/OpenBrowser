<script setup>
import { computed, h } from 'vue';
import { cr as clone, nn as usePermissions } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Select } from './m-input-select-C8pih1gY.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { t as Card } from './rx-card-De8gGY1x.js';
import { t as PlatformIcon } from './platform-icon-Cvcj894X.js';
import { o as useDrawer } from './useProxyFormDrawer-r-7UykRS.js';
import { t as AccountList } from './quick-CZrtqSCy.js';
import { t as AccountEditor } from './quick-kroUOSn_.js';
import { t as AssignmentType } from './account-2bDq0W_G.js';
import { o as useProfileForm } from './useAsyncGate-D7VA7DLY.js';

defineOptions({ inheritAttrs: false });
const accounts = defineModel();
const type = defineModel('type', { default: AssignmentType.Order });
const { isBatch, createCount } = useProfileForm();
const { check } = usePermissions();
const drawer = useDrawer();
const count = computed(() => accounts.value?.length ?? 0);
const options = computed(() => [
  { label: $t('顺序分配'), value: AssignmentType.Order },
  { label: $t('应用于所有窗口'), value: AssignmentType.MultiWindow },
]);
const hint = $t('顺序分配: 账号顺序分配给窗口，一个窗口应用一个账号\n应用于所有窗口: 将账号应用到所有窗口');
function selectAccount(mode, account) {
  const selecting = mode === 'list';
  const title = $t(selecting ? '平台账号列表' : '添加平台账号');
  const component = selecting ? AccountList : AccountEditor;
  const data = selecting ? { windowPlatformList: accounts.value?.filter(item => item.id) } : clone(account);
  drawer.showDrawer({ title, slots: { container: () => h(component, { data, isBatch: isBatch.value,
    createCount: createCount.value, accountType: type.value, showRemark: false, onClose: () => drawer.hideDrawer(), onConfirm: apply }) } });
}
function apply(selection) {
  const current = accounts.value ?? [];
  if (selection._tempId) {
    const index = current.findIndex(account => account._tempId === selection._tempId);
    if (index >= 0) current[index] = selection;
  } else if (!Array.isArray(selection) && !selection.id) {
    accounts.value = [...current, { ...selection, _tempId: Date.now().toString(32) }];
  } else accounts.value = current.filter(account => !account.id).concat(selection);
}
function edit(account) {
  if (check('Profiles_edit_platform_outside')) selectAccount(account.id ? 'list' : 'create', account);
}
function remove(account) {
  const id = account._tempId || account.id;
  accounts.value = accounts.value.filter(item => (item._tempId || item.id) !== id);
}
</script>

<template>
  <div class="w-full flex flex-col gap-3">
    <div class="flex items-center self-stretch gap-2">
      <div class="flex-1 items-center flex gap-2">
        <div class="title">{{ $attrs.label }}</div>
        <div v-if="isBatch" class="flex items-center gap-2">
          <Select v-model="type" :placeholder="$t('请输入或选择平台网址')" option-value="value" :options="options" overlay-auto-width />
          <Icon v-tooltip="{ value: hint, showDelay: 300, pt: { root: '!max-w-65' } }" name="base/rx_ic_info" color="var(--colors-icon-icon-note)" />
        </div>
      </div>
      <Button v-if="check('Profiles_select_platform')" text size="xxs" severity="secondary" icon="base/rx_ic_exchange" :label="$t('选择')" @click="selectAccount('list')" />
      <Button v-if="check('Profiles_add_platform_outside')" text size="xxs" severity="secondary" icon="base/rx_ic_plus" :label="$t('添加')" @click="selectAccount('create')" />
    </div>
    <Alert v-if="isBatch && type === AssignmentType.Order && count > createCount" class="w-full" type="warn" :closable="false"
      :title="$t('{count} 个窗口将会绑定账号。您创建的窗口数为：{max}。{message}', { count, max: createCount, message: $t('当前选择绑定的账号数量已超出创建窗口数。') })" />
    <div v-if="accounts?.length">
      <div v-if="isBatch" class="mb-2 subtitle">{{ $t('账号列表 ({count})', { count }) }}</div>
      <div class="pl-27 grid gap-2 list">
        <Card v-for="(account, index) in accounts" :key="account._tempId || account.id || index"
          class="flex gap-2 items-start overflow-hidden" :closable="false" @click="edit(account)">
          <div class="mt-0.5">
            <PlatformIcon v-if="account.platformIcon" class="icon" :platform-icon="account.platformIcon" :platform-icon-dark="account.platformIconDark" />
            <Icon v-else name="base/rx_ic_user_key" color="var(--colors-icon-icon-tertiary, #7C8387)" />
          </div>
          <div class="flex-1 flex flex-col gap-1 overflow-hidden">
            <div class="ellipsis-1 region min-w-0">{{ account.platformUrl }}</div><div class="flex items-center gap-1.5 info">{{ account.platformUserName || '--' }}</div>
          </div>
          <div class="mt-0.5 flex gap-2">
            <Icon v-if="check('Profiles_edit_platform_outside')" class="cursor-pointer" name="base/rx_ic_delete"
              color="var(--colors-icon-icon-tertiary)" @click.stop="remove(account)" />
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
