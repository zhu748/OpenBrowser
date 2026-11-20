<script setup>
import { computed, inject, toRef } from './workbench-vue.js';
import { nn as usePermissions } from './utils-BIWenCnY.js';
import { n as useToast } from './agent-BmSFI9WH.js';
import { i as useProxyData, t as proxyDrawerKey } from './useProfileProxy-Cbqapbxb.js';
import { t as usePopupMenu } from './usePopupMenu-BRw1zJ0m.js';
import { o as useDrawer } from './useProxyFormDrawer-r-7UykRS.js';
import { t as useTracking } from './useOperationTrack-BXe8Vwhz.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Divider } from './rx-divider-Ci3C58Q3.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Popover } from './rx-tooltip-BnCRxqlH.js';
import { t as PlatformIcon } from './platform-icon-Cvcj894X.js';
import { n as ProxyTooltip, t as ProxySpinner } from './earth-DQKkazIm.js';
import AccountTooltip from './workbench-profile-account-tooltip.js';
import ProfileActivityLine from './workbench-profile-activity-line.js';
import { useProfileProxyOperations, useAccountMenu, useProxyMenu, useProfileStatus } from './profile-info-ExiJC1su.js';

const props = defineProps({
  workspaceName: String,
  data: { type: Object, required: true },
  openMessage: Object,
  showSort: { type: Boolean, default: true },
  disabled: Boolean,
  readonly: Boolean,
  filterKeys: { type: Array, default: () => ['os', 'proxy', 'account'] },
});
const emit = defineEmits(['refresh']);
const data = toRef(props, 'data');
const workspaceName = toRef(props, 'workspaceName');
const drawerInstance = useDrawer();
const { showMenu } = usePopupMenu();
const [showToast, onlyErrorToast] = useToast();
const { buildProxyData, confirmDeleteProxy } = useProxyData();
const { saveLocalTrack } = useTracking();
const { check } = usePermissions();
const proxyDrawer = inject(proxyDrawerKey, null);
const { hasProxy, isOpenBrowser, list } = useProfileStatus(data, toRef(props, 'openMessage'), toRef(props, 'filterKeys'));
const { updateProfile, addCustomProxy, editProxy, openProxyDrawer } = useProfileProxyOperations({
  data, workspaceName, drawerInstance, emit, onlyErrorToast,
});
const { getProxyModel } = useProxyMenu({
  data, hasProxy, buildProxyData, confirmDeleteProxy, check, showToast,
  openAddProxy: () => proxyDrawer?.openProxyBuyAddDrawer({ onAddConfirm: addCustomProxy }),
  editProxy, openProxyDrawer, saveLocalTrack,
});
const { getAccountModel } = useAccountMenu({
  data, workspaceName, drawerInstance, onlyErrorToast, check, updateProfile, saveLocalTrack,
});
const checkingProxy = computed(() => props.data.loadingOperationMap?.checkProxy);
const sortCode = computed(() => String(props.data.windowSortNum).padStart(String(props.data.maxWindowSort || 0).length, '0'));

function openMenu(event, kind) {
  if (props.disabled || props.readonly || kind === 'os') return;
  if (kind === 'proxy' && checkingProxy.value) return;
  const model = kind === 'proxy' ? getProxyModel() : getAccountModel();
  if (model.some(item => item.visible)) showMenu(event, { model });
}
</script>

<template>
  <div class="position-relative flex h-full items-center gap-3" :class="{ grayscale: disabled }">
    <div v-if="showSort" class="font-[JetBrains_Mono] text-3 font-500 leading-4">
      <span class="tt-tertiary">{{ workspaceName }}-</span><span class="tt-primary">{{ sortCode }}</span>
    </div>
    <div class="position-relative flex justify-between state" :class="{ 'w-34': list.length > 1 }">
      <div v-for="item in list" :key="item.key" class="relative" @click.stop="openMenu($event, item.key)">
        <div v-if="item.key === 'os'" v-tooltip.top="{ value: item.tooltip, showDelay: 500 }"
          class="relative flex-cc cursor-pointer pa-1 state-icons" :class="item.classes">
          <Icon class="w-4 h-4 pointer-events-none" fallback="base/rx_ic_earth" :name="item.svg" :color="item.svgColor" />
        </div>
        <Popover v-else-if="item.key === 'proxy'">
          <template #default="{ hide }">
            <div class="relative flex-cc cursor-pointer pa-1 state-icons" :class="[item.classes, { checking: checkingProxy }]"
              @click="hide">
              <ProxySpinner v-if="checkingProxy" :size="16" color="var(--colors-icon-icon-inactive)" />
              <Icon v-else class="w-4 h-4 pointer-events-none" fallback="base/rx_ic_earth" :name="item.svg"
                :color="item.checkedColor || item.svgColor" />
              <div v-if="item.checkedColor" class="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                :style="{ background: item.checkedColor }"></div>
            </div>
          </template>
          <template v-if="item.showTooltip" #content><ProxyTooltip v-bind="item.data" /></template>
        </Popover>
        <Popover v-else-if="item.key === 'account'">
          <template #default="{ hide }">
            <div @click="hide">
              <div class="relative flex-cc cursor-pointer pa-1 state-icons" :class="item.classes">
                <PlatformIcon v-if="item.platformAccount?.platformIcon" :platform-icon="item.platformAccount.platformIcon"
                  :platform-icon-dark="item.platformAccount.platformIconDark" class="block w-4 h-4 pointer-events-none" />
                <Icon v-else class="w-4 h-4 pointer-events-none" fallback="base/rx_ic_earth" :name="item.svg" :color="item.svgColor" />
              </div>
              <div v-if="item.showSub" class="absolute top-0.5 right-0 -translate-y-1/2 translate-1/2 flex-cc cursor-pointer pa-0.5 state-icons"
                :class="item.classes">
                <PlatformIcon v-if="item.subPlatformAccount?.platformIcon" :platform-icon="item.subPlatformAccount.platformIcon"
                  :platform-icon-dark="item.subPlatformAccount.platformIconDark" class="block w-3 h-3 pointer-events-none" />
                <Icon v-else class="w-3 h-3 pointer-events-none" fallback="base/rx_ic_earth" name="base/rx_ic_more-h"
                  :color="item.svgColor" />
              </div>
            </div>
          </template>
          <template v-if="item.data?.length" #content><AccountTooltip :platform-list="item.data" /></template>
        </Popover>
      </div>
      <div v-if="list.length > 1" class="state-line">
        <ProfileActivityLine v-if="isOpenBrowser" :wave-width="1.2" :blur="0" speed="fast" :wave-opacity="1" />
        <Divider v-else class="!w-25" line-only line-style="dashed" line-color="var(--colors-border-divider-dashed)" />
      </div>
    </div>
  </div>
</template>
