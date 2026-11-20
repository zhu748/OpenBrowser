<script setup>
import { computed, toRef } from './workbench-vue.js';
import { En as unsupportedKernel, ln as systemInfo, mt as useWorkspace, nn as usePermissions, qt as BrowserType } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { i as useProxyData } from './useProfileProxy-Cbqapbxb.js';
import { n as workspaceTitle } from './workspace-CNvgSgaH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { n as useRouteContext } from './useRouteContext-Cfh7KChG.js';
import { t as Tooltip } from './rx-tooltip-CNCSEJGC.js';
import { n as useProxyEditor } from './profile-info-ExiJC1su.js';
import { o as useProxyDrawer } from './useProxyFormDrawer-r-7UykRS.js';
import { t as useOperationTrack } from './useOperationTrack-BXe8Vwhz.js';
import { n as useProfileLabels } from './useProfileEntityLabels-BfqbVpel.js';
import { a as Progress } from './useProfileOpenState-GCrr7PDa.js';
import { u as useBrowserOpen } from './operationHandlers-Db52Gyo7.js';

const props = defineProps({
  btnId: {}, disabled: Boolean, data: { type: Object, required: true },
  openMessage: { type: Object, default: () => ({}) }, text: {},
  icon: { default: 'base/rx_ic_chrome' }, driverObj: {}, driverNext: Function, sendFirstOpenRecord: Function,
});
const emit = defineEmits(['open']);
const workspace = useWorkspace();
const workspaceName = computed(() => workspaceTitle(workspace.currentWorkspace?.workspaceName));
const { isPublicMember } = useRouteContext();
const { check } = usePermissions();
const [, report] = useFeedback();
const { buildProxyData } = useProxyData();
const { saveLocalTrack } = useOperationTrack();
const { openProxyDrawer } = useProxyEditor({
  data: toRef(() => props.data), workspaceName, drawerInstance: useProxyDrawer(), emit() {}, onlyErrorToast: report,
});
const labels = useProfileLabels();
const label = computed(() => props.text ?? labels.value.open);
const { browser, coreInfo, isOpenLimitReached, isButtonDisabled, usePeoples, showErrorTooltip, openBrowser } = useBrowserOpen({
  data: props.data, openMessage: props.openMessage, text: label, driverObj: props.driverObj,
  driverNext: () => props.driverNext?.(), sendFirstOpenRecord: () => props.sendFirstOpenRecord?.(),
  onOpen: data => emit('open', data),
});
async function open() {
  const { osVersion, 'R-OS': host } = await systemInfo();
  const { coreType, coreVersion } = props.data;
  if (unsupportedKernel(host, osVersion, coreType, coreVersion)) {
    report(-1, $t('当前系统不支持使用{version}内核', { version: coreVersion }));
    return;
  }
  return openBrowser();
}
async function replaceProxy(close) {
  if (!check('Profiles_select_proxy')) return;
  close?.();
  saveLocalTrack('chooseProxy');
  await openProxyDrawer(buildProxyData(props.data));
}
</script>

<template>
  <div class="flex items-center gap-2" @click.stop>
    <Tooltip>
      <div class="control-group flex items-center gap-2" :class="{ 'control-group--limited': isOpenLimitReached }">
        <Button :id="btnId" class="control" :class="browser.classes" :disabled="isButtonDisabled || disabled"
          size="xxs" outlined severity="secondary" :title="openMessage[data.dirId]?.data?.detail || ''" @click.stop="open">
          <div v-if="!browser.percent || browser.completed" v-tooltip.top="{ value: isOpenLimitReached ? undefined : coreInfo, showDelay: 300 }"
            class="flex items-center justify-center">
            <Icon v-if="isOpenLimitReached" class="control-icon pointer-events-none" name="base/rx_ic_lock" />
            <Icon v-else class="control-icon pointer-events-none" :class="{ firefox: data.coreType === BrowserType.Firefox }" :name="icon" />
          </div>
          <Progress v-if="browser.percent && !browser.completed" size="16" :value="browser.percent" />
          <span class="select-none">{{ browser.completed && !browser.uploading ? $t('查看') : browser.msg }}</span>
        </Button>
      </div>
    </Tooltip>
    <Tooltip v-if="showErrorTooltip">
      <Icon name="base/rx_ic_info_fill" :class="browser.error ? 'text-red' : 'text-orange'" />
      <template #content="{ hide }">
        <i18n-t class="error" tag="div" :keypath="browser.error || browser.warning" scope="global">
          <template #link><span /></template>
          <template v-if="!isPublicMember" #replace>
            <span class="cursor-pointer error-link" @click.stop="replaceProxy(hide)">{{ $t('替换代理 IP') }}</span>
          </template>
        </i18n-t>
      </template>
    </Tooltip>
    <Icon v-if="usePeoples" v-tooltip.top="usePeoples" name="base/rx_ic_user_group" class="text-orange" />
  </div>
</template>
