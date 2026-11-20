<script setup>
import { useTemplateRef } from 'vue';
import { h as requests, mt as useWorkspace, nn as usePermission } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { n as requestType } from './permission-DOhNJfB3.js';
import { r as Note } from './proxy-create-mode-BCcLAAf5.js';
import { t as Table } from './ry-table-do6kugym.js';
import { n as workspaceTitle } from './workspace-CNvgSgaH.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { t as Empty } from './custom-empty-CChX4pJt.js';
import { t as ProfileInfo } from './profile-info-ExiJC1su.js';
import { a as Search } from './useProxyFormDrawer-r-7UykRS.js';
import { t as Tags } from './tags-icon-CZSs72B-.js';

const table = useTemplateRef('recycleTable');
const confirm = useConfirm();
const [, showStatus] = useNotice();
const workspace = useWorkspace();
const { check } = usePermission();
const columns = [
  { title: $t('窗口信息'), key: 'profile', slot: 'profile', style: { width: '0%', minWidth: '180px' } },
  { title: $t('窗口名称'), key: 'windowName', style: { width: '10%', minWidth: '200px' } },
  { title: $t('备注'), key: 'note', slot: 'note', style: { minWidth: '120px' } },
  { title: $t('标签'), slot: 'tags', style: { minWidth: '95px' } },
  { title: $t('删除记录'), key: 'group', slot: 'log', style: { minWidth: '140px' } },
  { title: $t('剩余时间'), key: 'remaining', slot: 'remaining', style: { minWidth: '140px' } },
];
const operations = [
  { name: 'restore', label: $t('恢复'), tooltip: $t('恢复窗口'), icon: 'base/rx_ic_refresh', iconClass: 'text-gray-500',
    power: check('Profiles_restore'), quick: true, multiple: true, multipleProps: { name: 'G1' } },
  { name: 'delete', label: $t('彻底删除'), tooltip: $t('彻底删除'), icon: 'base/rx_ic_shredder', iconClass: 'text-red',
    power: check('Profiles_permanent_delete'), quick: true, multiple: true, multipleProps: { name: 'G1' } },
];
const filters = [
  { key: 'name', label: $t('窗口名称'), icon: 'base/rx_ic_browser', syntax: 'name::' },
  { key: 'remark', label: $t('备注'), icon: 'base/rx_ic_doc_article', syntax: 'note::' },
  { key: 'tag', label: $t('标签'), icon: 'base/rx_ic_tag', syntax: 'tag::' },
  { key: 'sortNum', label: ' ID', icon: 'base/rx_ic_id', syntax: 'id::' },
];

function getRows(params) {
  return requests.window.userGetWindowInfoListList({ ...params, isDelete: 1, requestType: requestType.Recycle });
}
function search({ key, value } = {}) {
  table.value?.refresh({ queryKey: value && (key || 'name_remark'), queryValue: value }, true);
}
async function finish(operation) {
  try {
    const { code, msg } = await operation();
    showStatus(code, msg);
    if (code === 0) await table.value?.refresh();
  } catch (error) {
    showStatus(-1, error.message);
  }
}
function operate(action, selection) {
  const ids = [].concat(selection).map(row => row.id);
  if (action.name === 'restore') {
    return finish(() => requests.window.userMdfWindowInfoBatchV2Create({ ids, isDelete: false }));
  }
  if (action.name === 'delete') {
    confirm.require({
      header: $t('彻底删除所选窗口'), message: $t('您确认要彻底删除所选窗口吗？'),
      rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
      acceptProps: { label: $t('确认'), severity: 'danger' },
      accept: () => finish(() => requests.window.userDelWindowInfoRecycleCreate({ ids })),
    });
  }
}
function remainingClass(days) {
  if (days < 3) return '_error_mwda6_1';
  if (days < 7) return '_warning_mwda6_5';
}
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <Table ref="recycleTable" cache-key="browser-recycle-list" selection-mode="multiple" :columns="columns"
      :table-request="getRows" :operation="operations" :operation-handler="operate" :virtual-scroller-options="{ itemSize: 60 }"
      :show-gridlines="false" :show-display="false" :show-actions-menu="false">
      <template #filter-after><Search :options="filters" :search="search" :clear="search" /></template>
      <template #table-empty>
        <Empty icon="rx_illustration_bin.svg" :title="$t('回收站暂无数据')" :desc="$t('删除的窗口将展示在此处。如在回收站继续清除，窗口将无法再恢复。')" />
      </template>
      <template #profile="{ data }"><ProfileInfo :workspace-name="workspaceTitle(workspace.currentWorkspace?.workspaceName)" :data="data" disabled /></template>
      <template #note="{ data }">
        <div class="inline-flex items-center gap-2">
          <Note :value="data.windowRemark" disabled />
          <div :title="data.windowRemark" class="min-w-30 whitespace-pre-wrap note-content">{{ data.windowRemark }}</div>
        </div>
      </template>
      <template #tags="{ data }"><Tags :labels="data.labelInfo" :project-id="data.projectId" disabled /></template>
      <template #log="{ data }"><div class="email">{{ data.email }}</div><div class="time">{{ data.updateTime }}</div></template>
      <template #remaining="{ data }"><div :class="remainingClass(data.remaining)">{{ data.remaining }}</div></template>
    </Table>
  </div>
</template>
