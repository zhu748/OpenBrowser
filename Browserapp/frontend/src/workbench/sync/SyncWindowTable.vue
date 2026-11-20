<script setup>
import { computed } from 'vue';
import { t as translate } from './locales-BfKu2SD4.js';
import { useSyncWindowSelection } from './sync-window-selection.js';
import { t as Table } from './ry-table-do6kugym.js';
import { n as workspaceName } from './workspace-CNvgSgaH.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { t as Search } from './m-input-text-JVbCgVJP.js';
import { t as Empty } from './custom-empty-CChX4pJt.js';
import { t as Filter } from './m-input-multi-select-B7lX5Cnm.js';
import { t as Avatar } from './rx-avatar-h90aIpxl.js';
import { t as ProfileInfo } from './profile-info-ExiJC1su.js';
import { t as Tutorial } from './tutorial-video-Cb-jkf_V.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  selectionMode: String,
  showType: { type: String, default: 'opened' },
  mainControlWindowDirId: { type: String, default: '' },
});
const {
  filters, windows, master, columns, tableSort, selection, eligible, syncing,
  startDisabled, filterOptions, visible, start, openWindow, normalizeSelectedRows, setMaster, updateTableOrder,
} = useSyncWindowSelection(props);
const startLabel = computed(() => eligible.value.length
  ? translate('开始同步 {count} 个窗口', { count: eligible.value.length })
  : translate('开始同步'));
const firefoxHint = () => translate('Firefox 内核的窗口暂不支持窗口同步功能');
</script>

<template>
  <Table ref="syncControlTable" v-model:selection="selection" :multiple-operation="false"
    :data-list="visible" :columns="columns" :selection-mode="selectionMode"
    :paginator="false" :show-actions="false" :show-display="false" :show-reload="false"
    :context-menu="false" :table-sort="tableSort"
    :class="['sync-control-table', { syncing, 'no-data': !visible.length }]"
    v-bind="$attrs" @row-select-all="normalizeSelectedRows" @value-change="updateTableOrder">
    <template #table-empty>
      <Empty v-if="windows.length && !visible.length" icon="rx_illustration_filter.svg"
        :title="translate('暂无查询结果')" :desc="translate('当前条件下没有匹配的结果，请尝试更换其他筛选条件。')" />
      <Empty v-else icon="rx_illustration_roxybrowser.png" :title="translate('请先打开至少两个窗口')">
        <template #desc>
          <div class="whitespace-pre-wrap text-[var(--colors-text-text-tertiary)] text-3.5">{{ translate('窗口同步：即窗口群控，可同时控制多个窗口，实现鼠标同步，键盘同步，大幅提高工作效率。') }}</div>
          <div>
            <div class="whitespace-pre-wrap tt-tertiary text-3.5">{{ translate('注意:') }}</div>
            <ol class="ma-0 mt-1 pl-8 flex flex-col gap-1">
              <li class="whitespace-pre-wrap tt-tertiary text-3.5">{{ translate('不同操作系统的窗口无法进行同步，相同系统但内核不一致的窗口，有概率出现同步失败的情况。') }}</li>
              <li class="whitespace-pre-wrap tt-tertiary text-3.5">{{ firefoxHint() }}</li>
            </ol>
          </div>
        </template>
        <template #extra>
          <Tutorial variant="outlined" size="xs" video-type="synchronizer" :autoplay="false" />
        </template>
      </Empty>
    </template>
    <template #profile="{ data }">
      <ProfileInfo :workspace-name="workspaceName(data?.workspaceName)" :data="data" :filter-keys="['os']"
        readonly :class="{ 'can-use-sync-control': data.$canUseSyncControl }" />
    </template>
    <template #windowName="{ data }">
      <div v-tooltip.top="{ value: data.windowName }" class="ellipsis-1 max-w-150px">{{ data.windowName }}</div>
    </template>
    <template #status="{ data }">
      <div v-if="data.dirId === master" class="main-control-status select-none">{{ translate('主控窗口') }}</div>
      <div v-else class="status" :class="{ action: !syncing }">
        <span class="status-text">--</span>
        <Button class="status-btn" size="xxs" severity="secondary" icon="base/rx_ic_cursor"
          :label="translate('设为主控')" @click.stop="setMaster(data)" />
      </div>
    </template>
    <template #actions="{ data }">
      <Button size="xxs" variant="text" severity="secondary" icon="base/rx_ic_show_profile"
        :label="translate('查看')" @click.stop="openWindow(data.dirId)" />
    </template>
    <template v-if="!syncing && windows.length" #table-header>
      <div class="w-full flex flex-col gap-2">
        <div class="w-full flex gap-2.5">
          <Filter v-for="{ name, ...options } in filterOptions" :key="name" v-model="filters[name]"
            class="flex-1 min-w-0" v-bind="options" size="xxs"
            :max-selected-labels="1" :show-toggle-all="false" :filter="false">
            <template #option="{ option }">
              <template v-if="name === 'labelIds'">
                <div v-if="option.value.startsWith?.('u_')" class="flex items-center gap-2">
                  <Avatar :avatar="option.avatar" :name="option.label?.slice(0, 2)"
                    :color="option.labelColor" :size="18" :font-size="10" />
                  <span class="text-3.25">{{ option.label }}</span>
                </div>
                <div v-else class="flex items-center">
                  <svg class="shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M5 8C5 6.34315 6.34315 5 8 5C9.65685 5 11 6.34315 11 8C11 9.65685 9.65685 11 8 11C6.34315 11 5 9.65685 5 8Z" :fill="option.labelColor" />
                  </svg>
                  <div class="text-3.25 ellipsis-1">{{ option.labelName }}</div>
                </div>
              </template>
              <div v-else class="flex items-center"><div class="text-3.25">{{ option.label }}</div></div>
            </template>
          </Filter>
          <Search v-model="filters.windowName" :field-props="{ class: 'flex-1 min-w-0' }"
            pre-icon="base/rx_ic_magnify" size="xxs" :placeholder="translate('搜索窗口')" />
        </div>
        <Alert class="!w-full" type="info" :title="firefoxHint()" :closable="false" />
      </div>
    </template>
  </Table>
  <Button v-if="showType === 'opened'" :disabled="startDisabled" :label="startLabel" class="start-sync-btn" @click.stop="start" />
</template>
