<script setup>
import { h, ref, resolveComponent, useTemplateRef } from 'vue';
import { h as requests, mt as useWorkspace, nn as usePermission, v as useConfig, vt as cache, yt as useCache } from './utils-BIWenCnY.js';
import { a as storeToRefs, n as useNotice } from './agent-BmSFI9WH.js';
import { r as projectRequest } from './permission-DOhNJfB3.js';
import { n as pinStatus, t as useProjects } from './project-zUGx3yhI.js';
import { o as RowActions, t as Table } from './ry-table-do6kugym.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Divider } from './rx-divider-Ci3C58Q3.js';
import { a as Column } from './contextmenu-BBjizTDn.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import { t as usePopupMenu } from './usePopupMenu-BRw1zJ0m.js';
import { t as Empty } from './custom-empty-CChX4pJt.js';
import { t as Header } from './views-header-CcjwXPjG.js';
import { t as useProjectEditor } from './useProject-BHb2F7tC.js';
import { t as CreateProject } from './gen-project-BYIY-yxb.js';

const RouterLink = resolveComponent('RouterLink');
const table = useTemplateRef('project');
const confirm = useConfirm();
const [, showStatus] = useNotice();
const [openEditor] = useProjectEditor({ toast: false });
const [openDialog] = useDialog();
const { getProjects } = useProjects();
const { currentWorkspace } = useWorkspace();
const { userInfo } = storeToRefs(useConfig());
const { showMenu } = usePopupMenu();
const { check } = usePermission();
const { invalidateCache } = useCache();

const columns = ref([
  { title: $t('项目信息'), key: 'projectName', slot: 'projectName' },
  { title: $t('操作'), key: 'action', slot: 'action' },
  { title: $t('窗口数量'), render: ({ data }) => data.windowCount || '--' },
  { title: $t('其他'), style: 'width: 9rem', slot: 'actions' },
]);

function loadProjects(params) {
  getProjects();
  return requests.limit.userGetProjectInfoByWorkspaceList({ ...params, default: 2 });
}

function refresh() {
  invalidateCache(cache.PROJECT_LIST);
  table.value?.refresh();
}

function isPinned(project) {
  return project.user_info.find(user => user.userId === userInfo.value.id)?.pinStatus === pinStatus.pinned;
}

function rowOperations(project) {
  const pinned = isPinned(project);
  const pinLabel = $t(pinned ? '取消固定到侧边栏' : '固定到侧边栏');
  const disabled = Boolean(project.projectDefault || project.isTransfer);
  const command = ({ item }) => dispatch(item, project);
  return [
    { name: 'edit', label: $t('编辑'), icon: 'base/rx_ic_edit', power: check('Projects_edit'), disabled, command },
    { name: 'pin', label: pinLabel, icon: pinned ? 'base/rx_ic_pin_solid' : 'base/rx_ic_pin_line', iconClass: pinned ? 'text-orange' : '', tooltip: pinLabel, quick: true, command },
    { power: check('Projects_edit'), separator: true },
    { name: 'delete', label: $t('删除'), icon: 'base/rx_ic_bin_1', power: check('Projects_delete'), disabled, command },
  ];
}

function dispatch(operation, project) {
  switch (operation.name) {
    case 'pin': return togglePin(project);
    case 'edit': return openEditor({ ...project, confirmNext: refresh });
    case 'delete': return deleteProject(project);
  }
}

function createProject() {
  openDialog({
    showHeader: false, modal: true, blockScroll: true,
    slots: { container: ({ hideModal }) => h(CreateProject, {
      onSuccess: () => { hideModal(); refresh(); },
      onClose: hideModal,
    }) },
  });
}

async function reorder({ value }) {
  const params = table.value?.getParams();
  const { code, msg } = await requests.limit.userMdfProjectSortCreate({
    projectIds: value.map(project => project.project_id),
    projectSortNumList: value.map((_, index) => index + 1),
    page_index: params?.page_index ?? 1,
    page_size: params?.page_size ?? 10,
  });
  showStatus(code, msg);
  if (code === 0) {
    table.value?.updateDataList(value);
    getProjects();
    invalidateCache(cache.PROJECT_LIST);
  }
}

async function togglePin(project) {
  const { code, msg } = await requests.limit.userMdfProjectInfoCreate({
    id: project.project_id, pinStatus: isPinned(project) ? pinStatus.none : pinStatus.pinned,
    requestType: projectRequest.PinProject,
  });
  if (code === 0) refresh();
  else showStatus(code, msg);
}

function deleteProject(project) {
  confirm.require({
    header: $t('删除项目'),
    message: $t('您确认要删除 {projectName} 项目吗？该操作会移除所有项目成员，且所有窗口将回归默认项目。', { projectName: project.projectName }),
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认'), severity: 'danger' },
    accept: async () => {
      await globalThis.electronAPI.send('util:removeProject', { workspaceId: currentWorkspace?.id, projectId: project.project_id });
      const { code, msg } = await requests.limit.userDelProjectInfoCreate({ projectId: project.project_id });
      showStatus(code, msg || $t('删除失败'));
      if (code === 0) {
        invalidateCache(cache.BROWSER_LIST, { projectId: String(project.project_id) });
        invalidateCache(cache.BROWSER_LIST, { projectId: '' });
        refresh();
      }
    },
  });
}

function showRowMenu({ event, operation }) {
  showMenu(event, { model: operation });
}

function projectRoute(project) {
  return { name: 'project-item', params: { id: project.project_id }, query: { title: project.projectName } };
}

function handleProjectClick() {}
</script>

<template>
  <div class="flex flex-col h-full">
    <Header class="items-center" :divider="false" :title="$t('项目管理')">
      <Button v-if="check('Projects_add')" size="xxs" icon="base/rx_ic_plus" :label="$t('创建项目')" @click.stop="createProject" />
      <Divider vertical line-only class="!h-4" />
      <Button severity="secondary" variant="outlined" size="xxs" icon="base/rx_ic_refresh" @click.stop="refresh" />
    </Header>
    <div class="flex-1 flex overflow-hidden">
      <Table ref="project" v-model:columns="columns" data-key="project_id" cache-key="project-list" list-cache-key="project-list"
        :table-request="loadProjects" :table-operation="rowOperations" :show-table-header="false" :show-gridlines="false"
        :show-actions-menu="false" :show-actions="false" @row-reorder="reorder">
        <template #table-empty>
          <Empty icon="rx_illustration_stack.svg" :title="$t('暂无项目')" :desc="$t('项目功能可以帮助您将窗口或团队成员进行分配，并更高效地管理。')">
            <template #extra>
              <div class="flex items-center gap-3">
                <Button v-if="check('Projects_add')" outlined severity="secondary" size="xs" icon="base/rx_ic_stack_add" :label="$t('创建项目')" @click.stop="createProject" />
              </div>
            </template>
          </Empty>
        </template>
        <template #column-before>
          <Column header-style="width:44px" row-reorder>
            <template #rowreordericon>
              <Icon class="cursor-grab drag-mark" data-pc-section="reorderablerowhandle" name="base/rx_ic_dots_drag" />
            </template>
          </Column>
        </template>
        <template #projectName="{ data }">
          <RouterLink class="flex items-center gap-2 name text-[var(--colors-text-text-primary)]" :to="projectRoute(data)" @click.stop.prevent="handleProjectClick">
            <Icon name="base/rx_ic_stack" /><span>{{ data.projectName }}</span>
          </RouterLink>
        </template>
        <template #action="{ data }">
          <RouterLink class="flex items-center gap-2 name" :to="projectRoute(data)" @click.stop.prevent="handleProjectClick">
            <Button :label="$t('查看详情')" outlined severity="secondary" size="xs" />
          </RouterLink>
        </template>
        <template #actions="{ data }">
          <RowActions :operation="rowOperations(data)" @quick-click="dispatch($event, data)" @more="showRowMenu" />
        </template>
      </Table>
    </div>
  </div>
</template>
