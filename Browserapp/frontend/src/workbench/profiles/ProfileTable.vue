<script setup>
import { profileTableRuntime } from './profile-table-compat.js';
import { useProfileTable } from './workbench-profile-table-state.js';

const props = defineProps({ currentFilter: null, isProjectProfile: Boolean });
const emit = defineEmits(['updateFilterTabs', 'switchTab']);
const { Button, Divider, FilterEmpty, ProfileEmpty, Icon, Popover, Column, Skeleton, RowActions, Table, vTooltip, Search,
  Filter, Tutorial, ProfileInfo, EditableName, OpenButton, ProjectCell, Tags, rowOptions, sort, cache,
  browsers, formatDate } = profileTableRuntime;
const { tableRef, tagsRef, columns, cacheScope, cacheMetadata, restoreCache, loadRows, runOperation, canQuickCreate, quickCreate,
  configureQuickCreate, searchOptions, search, filters, saveFilters, refresh, check, selection, automationLabel, automationBusy,
  createAutomation, testAllProxies, filtered, createProfile, workspaceName, openState, refreshRow, guideDriver, advanceGuide,
  recordFirstOpen, openProfile, toggleNotes, updateLabels, openActions, showTemporaryColumn, videoUrl } = useProfileTable(props, emit);

defineExpose({ tableRef });
</script>

<template>
  <Table ref="tableRef" v-model:columns="columns" cache-key="browser-list" :list-cache-key="cache.BROWSER_LIST"
    :list-cache-scope="cacheScope" :list-cache-meta="cacheMetadata" :list-cache-should-restore="restoreCache" :immediate="false"
    skeleton :table-sort="sort" :table-request="loadRows" :table-operation="rowOptions" :operation-handler="runOperation"
    selection-mode="multiple" :show-actions="false" :virtual-scroller-options="{ itemSize: 60 }" class="window-table" removable-sort>
    <template #filter-after>
      <div class="w-full flex items-start gap-2">
        <div v-if="canQuickCreate" class="quick-create-entry flex shrink-0 items-stretch">
          <Button class="!h-6.5 quick-create-entry__main" size="xxs" outlined severity="primary" icon="base/rx_ic_browser_flash" :label="$t('快速创建')" @click.stop="quickCreate" />
          <Button v-tooltip.top="{ value: $t('配置快速创建偏好') }" class="!h-6.5 quick-create-entry__gear" size="xxs" outlined
            severity="primary" icon="base/rx_ic_gear" @click.stop="configureQuickCreate" />
        </div>
        <Search :options="searchOptions" :search="search" :clear="search" />
        <Divider class="py-1" vertical line-only />
        <Filter :current-filter="currentFilter" :filters-menu="filters" :enabled-filter-save="!isProjectProfile" :video-url="videoUrl('profile-filter.mp4')"
          :save-filters="saveFilters" @filter-change="refresh" />
        <span v-if="check('Roxy_AI_Agent_All')" v-tooltip.top="{ value: selection.length ? '' : $t('请先勾选窗口') }" class="inline-flex">
          <Button class="create-automation-button" size="xxs" outlined icon="roxy-agent/rx-ic-create-automation" :label="automationLabel"
            :disabled="!selection.length || automationBusy" @click.stop="createAutomation()" />
        </span>
        <Button v-if="check('Profiles_speed_test_proxy')" size="xxs" outlined severity="secondary" icon="base/rx_ic_speed_test"
          :label="$t('测试全部代理 IP')" @click.stop="testAllProxies()" />
      </div>
    </template>
    <template #table-empty>
      <FilterEmpty v-if="filtered" icon="rx_illustration_filter.svg" :title="$t('暂无查询结果')" :desc="$t('当前条件下没有匹配的结果，请尝试更换其他筛选条件。')" />
      <ProfileEmpty v-else icon="base/rx_ic_browser" img="empty-profiles.png" :title="$t('暂无窗口')"
        :desc="$t('窗口是 Roxy浏览器的核心功能，可以帮助您管理多个浏览器窗口，并为它们设置不同的项目、平台账号、代理 IP 等，以方便您更好地执行业务操作。')">
        <template #extra>
          <div class="flex gap-3">
            <Button v-if="check('Profiles_add')" severity="secondary" size="md" icon="base/rx_ic_browser_add"
              variant="outlined" :label="$t('创建窗口')" @click.stop="createProfile" />
            <Tutorial video-type="create_profile" :autoplay="false" />
          </div>
        </template>
      </ProfileEmpty>
    </template>
    <template #profile="{ data }">
      <ProfileInfo v-if="data.id" :workspace-name="workspaceName" :data="data" :open-message="openState" @refresh="refreshRow" />
      <div v-else class="flex items-center gap-[16px]">
        <Skeleton width="44px" height="16px" />
        <div class="flex items-center gap-[1px]">
          <template v-for="index in 3" :key="index">
            <div v-if="index > 1" class="dotted-line"></div><Skeleton width="24px" height="24px" border-radius="4px" />
          </template>
        </div>
      </div>
    </template>
    <template #profileName="{ data }">
      <EditableName v-if="data.id" :data="data" :readonly="!check('Profiles_edit')" @refresh="refreshRow" />
      <Skeleton v-else width="160px" height="24px" border-radius="4px" />
    </template>
    <template #open="{ data, index }">
      <OpenButton v-if="data.id" :btn-id="'OPEN_' + index" :data="data" :open-message="openState" :driver-obj="guideDriver" :driver-next="advanceGuide"
        :send-first-open-record="recordFirstOpen" :icon="data.coreType === browsers.Firefox ? 'base/rx_ic_firefox' : 'base/rx_ic_chrome'" @open="openProfile" />
      <Skeleton v-else width="70px" height="24px" border-radius="4px" />
    </template>
    <template #noteHeader="{ column: { title, _cache } }">
      <div class="flex items-center gap-2 note-header">
        <span>{{ title }}</span>
        <Icon v-tooltip.top="{ value: _cache.extend ? $t('收起') : $t('展开'), showDelay: 0 }" class="cursor-pointer color-[#989CA0]"
          :name="_cache.extend ? 'base/rx_ic_hidden' : 'base/rx_ic_eye'" @click.stop="toggleNotes(_cache)" />
      </div>
    </template>
    <template #note="{ data, column: { _cache } }">
      <div v-if="data.id" class="inline-flex items-center gap-1" @click.stop="runOperation({ name: 'addNotes' }, data)">
        <Button v-tooltip.top="{ value: data.windowRemark, showDelay: 0 }" class="shrink-0" :class="{ 'note-light': data.windowRemark }"
          text severity="secondary" size="xxs" :icon="data.windowRemark ? 'base/rx_ic_doc_fill' : 'base/rx_ic_doc_add'" />
        <div v-if="_cache.extend" :title="data.windowRemark" class="min-w-50 whitespace-pre-wrap note-content">{{ data.windowRemark }}</div>
      </div>
      <Skeleton v-else width="24px" height="24px" border-radius="4px" />
    </template>
    <template #project="{ data }">
      <ProjectCell v-if="data.id" :disabled="!check('Profiles_move_project')" :labels="data.labelInfo" :project-id="data.projectId"
        :project-name="data.projectName" @update="updateLabels($event, data)" />
      <Skeleton v-else width="100px" height="20px" border-radius="4px" />
    </template>
    <template #tags="{ data }">
      <Tags v-if="data.id" :labels="data.labelInfo" :project-id="data.projectId" :gen-tag="check('Profiles_Label_add')"
        :disabled="!check('Profiles_select_label')" @update="updateLabels($event, data, 'single')" />
      <Skeleton v-else width="70px" height="24px" border-radius="12px" />
    </template>
    <template #actions="{ data }">
      <div class="flex items-center gap-2">
        <RowActions v-if="data.id" :operation="rowOptions(data)" :loading-operation-map="data.loadingOperationMap"
          @quick-click="runOperation($event, data)" @more="openActions($event, data)" />
        <template v-else><Skeleton v-for="index in 3" :key="index" width="24px" height="24px" border-radius="4px" /></template>
      </div>
    </template>
    <template v-if="showTemporaryColumn" #column-before="{ ptProps }">
      <Column :pt="{ ...ptProps, bodycell: ptProps.bodycell + ' !pr-0' }" header-style="width:0%" body-style="width:0%">
        <template #body="{ data }">
          <Popover v-if="data.isTemporary">
            <Icon class="pointer-events-none" name="base/rx_ic_sand_glass" color="var(--colors-icon-icon-warning)" />
            <template #content>
              <div class="flex flex-col gap-1 w-50">
                <div class="temporary-title">{{ $t('过期时间: {expires}', { expires: formatDate(data.expireTime, 'yyyy/MM/dd') }) }}</div>
                <div class="temporary-desc">{{ $t('临时窗口在过期前不占用您的窗口用量，可以正常使用。过期后将会占用您的窗口用量。用量不足将无法打开窗口。') }}</div>
              </div>
            </template>
          </Popover>
        </template>
      </Column>
    </template>
  </Table>
  <Tags ref="tagsRef" :labels="[]" :show-create-tag="false" @update="updateLabels($event, tableRef?.selectionData)" />
</template>
