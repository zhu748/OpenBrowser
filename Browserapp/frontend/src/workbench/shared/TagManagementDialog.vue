<script setup>
import { computed, ref, useTemplateRef } from './workbench-vue.js';
import { h as api, mt as useWorkspace, nn as usePermissions } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { n as workspaceTitle } from './workspace-CNvgSgaH.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Empty } from './custom-empty-CChX4pJt.js';
import { t as Related } from './related-info-VU3nxvtB.js';
import { n as useProfileLabels } from './useProfileEntityLabels-BfqbVpel.js';
import { t as Table } from './table-BJcS2I0Z.js';
import { n as useTagEditor } from './use-tag-menu-DZnIrtE9.js';
import TagColorDot from './workbench-tag-color-dot.js';

const emit = defineEmits(['close']);
const confirm = useConfirm();
const { check } = usePermissions();
const workspace = useWorkspace();
const table = useTemplateRef('tagTable');
const total = ref(0);
const [edit] = useTagEditor();
const [, report] = useFeedback();
const labels = useProfileLabels();
const regions = { header: false, reload: false, paginator: false, actions: 'quick', selectionBar: true };
const columns = computed(() => [
  { header: $t('标签'), field: 'name', slot: 'tag' },
  { header: labels.value.relatedProfilesColumn, field: 'relatedProfiles', slot: 'related' },
]);
function editTag(row) {
  edit({ ...row, confirmNext: () => table.value?.refresh() });
}
function actions({ rows, row }) {
  return [
    { key: 'edit', label: $t('编辑'), icon: 'base/rx_ic_edit', power: check('Profiles_Label_edit'), quick: true, command: () => editTag(row) },
    { key: 'delete', label: $t('删除'), icon: 'base/rx_ic_bin_1', power: check('Profiles_Label_delete'), quick: true,
      multiple: { name: 'G1' }, command: () => remove(rows ?? [row]) },
  ];
}
function related(row) {
  const name = workspaceTitle(workspace.currentWorkspace?.workspaceName);
  return (row.bindWindowIds ?? []).map(number => `${name}-${number}`);
}
async function load() {
  const result = await api.window.userGetLabelInfoList({ page_index: '1', page_size: '999' });
  if (result.code !== 0) {
    report(result.code, result.msg);
    emit('close');
  } else total.value = result.data.total;
  return result;
}
function remove(rows) {
  confirm.require({
    header: $t('删除标签'), message: labels.value.deleteTagConfirmMessage,
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认'), severity: 'danger' },
    accept: async () => {
      const { code, msg } = await api.window.userDelLabelInfoCreate({ ids: rows.map(row => row.id) });
      report(code, msg);
      if (code === 0) await table.value?.refresh();
    },
  });
}
</script>

<template>
  <div class="w-180 h-50vh flex flex-col pa-6 pt-4">
    <div class="h-9 flex justify-between items-center">
      <div class="header">{{ $t('标签管理') }}</div>
      <Button class="!rounded-full" text size="md" severity="secondary" icon="base/rx_ic_delete" @click="emit('close')" />
    </div>
    <div class="flex justify-between items-center py-3 gap-2">
      <div class="flex-1 total-tags">{{ $t('新增标签') }} ({{ total }})</div>
      <Button v-if="check('Profiles_Label_add')" size="xxs" outlined severity="secondary" icon="base/rx_ic_plus"
        :label="$t('新增标签')" @click.stop="editTag()" />
    </div>
    <div class="flex-ovh-1">
      <Table ref="tagTable" class="h-full" data-key="id" selection-mode="multiple" :columns="columns"
        :model="actions" :regions="regions" :table-request="load" :actions-pinned="false">
        <template #empty><Empty :title="$t('暂无标签')" /></template>
        <template #tag="{ data }">
          <div class="flex items-center gap-2"><TagColorDot :color="data.color" /><span>{{ data.name }}</span></div>
        </template>
        <template #related="{ data }"><Related :list="related(data)" /></template>
      </Table>
    </div>
  </div>
</template>
