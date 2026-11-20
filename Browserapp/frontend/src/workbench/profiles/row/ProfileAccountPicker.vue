<script setup>
import { computed, ref, useTemplateRef } from './workbench-vue.js';
import { h as api } from './utils-BIWenCnY.js';
import { t as Table } from './ry-table-do6kugym.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { t as Empty } from './custom-empty-CChX4pJt.js';
import { a as Search, i as Related } from './useProxyFormDrawer-r-7UykRS.js';
import { t as AccountType } from './account-2bDq0W_G.js';
import { accountColumns, relatedWindows } from './workbench-profile-account-options.js';
import AccountFieldCell from './workbench-profile-account-cell.js';
import PlatformInfoCell from './workbench-platform-info-cell.js';

const props = defineProps({ data: Object, isBatch: Boolean, createCount: { default: 1 }, accountType: { default: () => AccountType.Order } });
const emit = defineEmits(['confirm', 'close']);
const table = useTemplateRef('quick');
const columns = ref(accountColumns({ filters: ['actions', 'open'] }));
const selection = ref(props.data?.windowPlatformList?.filter(row => row?.id != null && row.id !== 0) ?? []);
const count = computed(() => selection.value?.length ?? 0);
const overLimit = computed(() => count.value > props.createCount);
const searchOptions = [
  { key: 'platform', label: $t('平台名称'), icon: 'base/rx_ic_keys', syntax: 'platform::' },
  { key: 'account', label: $t('账号名称'), icon: 'base/rx_ic_user_key', syntax: 'account::' },
  { key: 'remark', label: $t('备注'), icon: 'base/rx_ic_doc_article', syntax: 'note::' },
];
function search({ key, value } = {}) {
  table.value?.refresh({ queryKey: value && (key || 'name_remark'), queryValue: value }, true);
}
async function load(query) {
  const result = await api.platform.userGetPlatformInfoV2List(query);
  if (result.code === 0 && selection.value?.length) {
    const byId = new Map((result.data?.rows ?? []).map(row => [row.id, row]));
    selection.value = selection.value.map(row => byId.get(row.id) ?? row);
  }
  return result;
}
function save() {
  emit('confirm', selection.value ?? []);
  emit('close');
}
</script>

<template>
  <div class="flex flex-col gap-3 h-full account-content">
    <Alert class="w-full" :visible="isBatch && accountType === AccountType.Order" :closable="false"
      :type="overLimit ? 'warn' : 'info'" :title="$t('{count} 个窗口将会绑定账号。您创建的窗口数为：{max}。{message}', {
        count, max: createCount, message: overLimit ? $t('当前选择绑定的账号数量已超过创建窗口数。') : '',
      })" />
    <Search :options="searchOptions" :search="search" :clear="search" />
    <div class="flex-ovh-1">
      <Table ref="quick" v-model:selection="selection" v-model:columns="columns" :multiple-operation="false"
        selection-mode="multiple" :table-request="load" :clear-selection-on-request="false" :virtual-scroller-options="{ itemSize: 60 }"
        :show-table-header="false" :show-display="false" :context-menu="false" :show-actions="false">
        <template #table-empty><Empty icon="rx_illustration_lock.svg" :title="$t('暂无平台账号')" /></template>
        <template #platformInfo="{ data: row }"><PlatformInfoCell :data="row" /></template>
        <template #userName="{ data: row }"><AccountFieldCell :value="row.platformUserName" /></template>
        <template #password="{ data: row, column }">
          <AccountFieldCell :value="row.platformPassword" :masked="!column._cache?.visible?.[row.id]" />
        </template>
        <template #remark="{ data: row }">
          <Icon v-tooltip.top="{ value: row.platformRemarks, showDelay: 500 }"
            :name="row.platformRemarks ? 'base/rx_ic_doc_fill' : 'base/rx_ic_doc_add'" :class="{ 'color-[#12A3FC]': row.platformRemarks }" />
        </template>
        <template #related="{ data: row }"><Related :list="relatedWindows(row)" /></template>
      </Table>
    </div>
    <div class="w-full flex justify-end gap-3 button-group">
      <Button size="sm" :label="$t('保存')" @click.stop="save" />
    </div>
  </div>
</template>
