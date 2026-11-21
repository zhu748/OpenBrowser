<script setup>
import { computed, onBeforeMount, ref, useTemplateRef } from './workbench-vue.js';
import { h as api, mt as useWorkspace, nn as usePermissions, o as unpackFilters, r as compact, v as configKey, xr as isEmpty } from './utils-BIWenCnY.js';
import { a as useConfig } from './agent-BmSFI9WH.js';
import { i as onWorkbenchEvent } from './rich-html-link-VdBpR3Cm.js';
import { r as ReloadButton, t as Table } from './ry-table-do6kugym.js';
import { n as workspaceTitle } from './workspace-CNvgSgaH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Divider } from './rx-divider-Ci3C58Q3.js';
import { n as useRouteContext } from './useRouteContext-Cfh7KChG.js';
import { t as EmptyState } from './custom-empty-CChX4pJt.js';
import { t as ProfileInfo } from './profile-info-ExiJC1su.js';
import { a as Search, r as useColumns } from './useProxyFormDrawer-r-7UykRS.js';
import { t as Filter } from './custom-filters-D_902RzL.js';
import { t as useLabels } from './useTutorialEntityLabels-BJzywsZZ.js';
import { t as IllustratedEmptyState } from './custom-new-empty-CLCRgYs2.js';
import { a as sortColumns, n as searchOptions, o as profileColumns, r as loadFilterMenu, s as ProfileName, t as useQuickCreate } from './useQuickCreate-DgAf1jWE.js';
import { n as ProjectTag, t as Tags } from './tags-icon-CZSs72B-.js';

const props = defineProps({ linkedProfileIds: Array, linkedWindowSortNums: { default: () => [] }, cacheKey: { default: 'account-profile-select' }, emptyTitle: {}, emptyDesc: {}, onConfirm: Function });
const emit = defineEmits(['close']);
const labels = useLabels();
const { isEcommerce } = useRouteContext();
const title = computed(() => props.emptyTitle ?? (isEcommerce.value ? $t('暂无账号') : $t('暂无窗口')));
const description = computed(() => props.emptyDesc ?? labels.value.profileSelectEmptyDesc);
const workspace = useWorkspace();
const workspaceName = computed(() => workspaceTitle(workspace.currentWorkspace?.workspaceName));
const { check } = usePermissions();
const { userConfig } = useConfig(configKey());
const { canQuickCreate, onQuickCreateMainClick, onQuickCreateSettingsClick } = useQuickCreate();
const quickCreate = computed(() => canQuickCreate() && check('Profiles_add'));
const options = searchOptions();
const { columns, updateColumns, updateRemarkDisplayStatus } = useColumns(profileColumns(), ['open', 'actions', 'createTime', 'updateTime', 'openTime', 'transferUserName']);
const picker = useTemplateRef('profileSelect');
const selection = ref([]);
const filters = ref([]);
const search = ref({});
const loading = ref(false);
const filtered = ref(false);
const omittedFilters = new Set(['isOften', 'openStatus', 'createTime', 'modfiyTime']);
const linked = computed(() => new Set((props.linkedProfileIds ?? props.linkedWindowSortNums).map(String)));
const selectionReady = ref(!linked.value.size);
const saving = ref(false);
const error = ref('');
let loadingLinked = false;

onBeforeMount(async () => {
  updateColumns(items => {
    const note = items.find(column => column.key === 'note');
    if (note?._cache) note._cache.extend = userConfig.value.remarkDisplayStatus;
  });
  try {
    filters.value = pruneFilters(await loadFilterMenu());
  } catch (error) {
    console.error('[Profile:select] load window filters failed', error);
  }
});
async function loadLinked() {
  if (selectionReady.value || loadingLinked) return;
  loadingLinked = true;
  try {
    const field = props.linkedProfileIds ? 'dirIds' : 'sortNums';
    const ids = [...linked.value];
    const rows = [];
    for (let offset = 0; offset < ids.length; offset += 500) {
      const batch = ids.slice(offset, offset + 500);
      const { code, data, msg } = await api.window.userGetWindowInfoListList({
        page_index: 1, page_size: batch.length, [field]: batch, isDelete: 0,
      });
      if (code !== 0 || !Array.isArray(data?.rows)) throw Error(msg || $t('窗口加载失败'));
      rows.push(...data.rows);
    }
    selection.value = rows;
    selectionReady.value = true;
    error.value = '';
  } catch (cause) {
    error.value = cause.message;
  } finally {
    loadingLinked = false;
  }
}
onBeforeMount(loadLinked);
function pruneFilters(menu) {
  const items = [];
  for (const item of menu) {
    if (!omittedFilters.has(item.name) && (!item.separator || (items.length && !items.at(-1).separator))) items.push(item);
  }
  if (items.at(-1)?.separator) items.pop();
  return items;
}
function query(overrides) {
  return compact({ ...search.value, ...overrides, ...unpackFilters(filters.value) });
}
function refresh(overrides = {}, firstPage = false) {
  const params = query(overrides);
  filtered.value = !isEmpty(params);
  return picker.value?.refresh(params, firstPage);
}
async function reload() {
  if (loading.value) return;
  loading.value = true;
  try {
    await loadLinked();
    await refresh();
  } finally {
    loading.value = false;
  }
}
onWorkbenchEvent('refreshProfileList', reload);
function onSearch({ key, value } = {}) {
  search.value = value ? { queryKey: key || 'name_remark', queryValue: value } : {};
  return refresh({}, true);
}
function setSelection(rows) {
  if (selectionReady.value && !saving.value) selection.value = rows;
}
function load(params) {
  return api.window.userGetWindowInfoListList({ ...params, isDelete: 0 });
}
function toggleRemark(cache) {
  cache.extend = !cache.extend;
  updateRemarkDisplayStatus(cache.extend);
}
async function confirm() {
  if (!selectionReady.value || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    if (await props.onConfirm?.(selection.value) !== false) emit('close');
  } catch (cause) {
    error.value = cause.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="profile-select">
    <div class="profile-select__body">
      <div class="flex shrink-0 items-start gap-2">
        <div class="flex min-w-0 flex-1 items-start gap-2">
          <div v-if="quickCreate" class="quick-create-entry flex shrink-0 items-stretch">
            <Button class="!h-6.5 quick-create-entry__main" size="xxs" outlined severity="primary" icon="base/rx_ic_browser_flash"
              :label="$t('快速创建')" @click.stop="onQuickCreateMainClick" />
            <Button v-tooltip.top="{ value: $t('配置快速创建偏好') }" class="!h-6.5 quick-create-entry__gear" size="xxs" outlined severity="primary"
              icon="base/rx_ic_gear" @click.stop="onQuickCreateSettingsClick" />
          </div>
          <Search class="shrink-0" :options="options" :search="onSearch" :clear="onSearch" />
          <Divider class="shrink-0 py-1" vertical line-only />
          <Filter :filters-menu="filters" :enabled-filter-save="false" @filter-change="refresh" />
        </div>
        <ReloadButton class="shrink-0" :loading="loading" @click="reload" />
      </div>
      <div class="profile-select__table">
        <Table ref="profileSelect" v-model:columns="columns" :selection="selection" @update:selection="setSelection" :cache-key="cacheKey"
          selection-mode="multiple" :multiple-operation="false" :clear-selection-on-request="false" :table-request="load" :table-sort="sortColumns"
          :show-table-header="false" :show-display="false" :show-reload="false" :show-actions="false" :context-menu="false"
          :virtual-scroller-options="{ itemSize: 60 }" removable-sort class="profile-select-table">
          <template #table-empty>
            <EmptyState v-if="filtered" icon="rx_illustration_filter.svg" :title="$t('暂无查询结果')"
              :desc="$t('当前条件下没有匹配的结果，请尝试更换其他筛选条件。')" />
            <IllustratedEmptyState v-else icon="base/rx_ic_browser" img="empty-profiles.png" :title="title" :desc="description" />
          </template>
          <template #profile="{ data }"><ProfileInfo :workspace-name="workspaceName" :data="data" readonly /></template>
          <template #profileName="{ data }"><ProfileName :data="data" readonly /></template>
          <template #noteHeader="{ column }">
            <div class="flex items-center gap-2 note-header">
              <span>{{ column.title }}</span>
              <Icon v-tooltip.top="{ value: column._cache.extend ? $t('收起') : $t('展开'), showDelay: 0 }" class="cursor-pointer color-[#989CA0]"
                :name="column._cache.extend ? 'base/rx_ic_hidden' : 'base/rx_ic_eye'" @click.stop="toggleRemark(column._cache)" />
            </div>
          </template>
          <template #note="{ data, column }">
            <div class="inline-flex items-center gap-1">
              <Button v-tooltip.top="{ value: data.windowRemark, showDelay: 0 }" class="shrink-0" :class="{ 'note-light': data.windowRemark }"
                text severity="secondary" size="xxs" :icon="data.windowRemark ? 'base/rx_ic_doc_fill' : 'base/rx_ic_doc_add'" />
              <div v-if="column._cache.extend" :title="data.windowRemark" class="min-w-50 whitespace-pre-wrap note-content">{{ data.windowRemark }}</div>
            </div>
          </template>
          <template #project="{ data }"><ProjectTag disabled :labels="data.labelInfo" :project-id="data.projectId" :project-name="data.projectName" /></template>
          <template #tags="{ data }"><Tags disabled :labels="data.labelInfo" :project-id="data.projectId" :gen-tag="false" /></template>
        </Table>
      </div>
    </div>
    <div v-if="error" role="alert" class="px-4 pt-2">{{ error }}</div>
    <div class="profile-select__footer">
      <Button size="md" severity="secondary" outlined :label="$t('取消')" :disabled="saving" @click.stop="emit('close')" />
      <Button size="md" :label="$t('确认保存')" :loading="saving" :disabled="!selectionReady || saving" @click.stop="confirm" />
    </div>
  </div>
</template>
