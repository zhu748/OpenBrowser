import { computed, h, reactive, watch } from './workbench-vue.js';
import { ai as supportsBatchLayout, gi as compareVersion, h as api, mt as useWorkspace, oi as supportsMinimize, v as useUser } from './utils-BIWenCnY.js';
import { a as storeToRefs, n as useFeedback } from './agent-BmSFI9WH.js';
import { p as openStatus } from './useProfileProxy-Cbqapbxb.js';
import { n as workspaceTitle } from './workspace-CNvgSgaH.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { n as useRouteContext } from './useRouteContext-Cfh7KChG.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import { I as windowManager } from './CreateTemplateDialog-Bpq9OLTG.js';
import { t as useOnboarding } from './hooks-BozaoB_u.js';
import { t as profileLabels } from './useProfileEntityLabels-BfqbVpel.js';
import DiskSpaceDialog from './workbench-disk-space-dialog.js';
import BatchLaunchLayout from './workbench-batch-launch-layout.js';

function arrange(ids, layout) {
  if (layout === 'grid') return globalThis.electronAPI.send('browser:chunkBrowsersByScreen', ids);
  if (layout === 'minimize' && supportsMinimize() || ['cascade', 'lastClosed'].includes(layout) && supportsBatchLayout()) {
    return globalThis.electronAPI.send('browser:openBatchLayout', { dirIds: ids, layout });
  }
  return globalThis.electronAPI.send('browser:batchLaunch', ids);
}
function completed(dirId) {
  return { code: 0, pending: false, uploading: false,
    data: { dirId, percent: 100, message: $t('打开成功'), warningMessages: [] } };
}
function busy(message) {
  return message?.pending || message?.uploading || message?.code === 0 && message.data?.percent != null && message.data.percent < 100;
}

export function useProfileOpenState() {
  const [dialog] = useDialog();
  const confirm = useConfirm();
  const workspace = useWorkspace();
  const user = useUser();
  const { userInfo, userConfig } = storeToRefs(user);
  const { updateOnboardingTaskStatus } = useOnboarding();
  const [, report] = useFeedback();
  const { isEcommerce } = useRouteContext();
  const labels = computed(() => profileLabels(isEcommerce.value));
  const workspaceName = computed(() => workspaceTitle(workspace.currentWorkspace?.workspaceName));
  const openMessage = reactive({});

  function showDiskWarning() {
    dialog({
      header: $t('磁盘空间不足'), showHeader: false, modal: true, blockScroll: true, pt: { content: '!pa-0' },
      slots: { container: ({ hideModal }) => h(DiskSpaceDialog, { onClose: hideModal }) },
    });
  }
  function syncWebWindows() {
    const windows = windowManager.winMap.value;
    for (const [id, window] of windows) {
      if (window && !window.closed) openMessage[id] = completed(String(id));
    }
    for (const id of Object.keys(openMessage)) {
      const window = windows.get(id);
      if ((!window || window.closed) && !busy(openMessage[id])) delete openMessage[id];
    }
  }
  function listenWebWindowManager() {
    if (globalThis.isElectron) return () => {};
    return watch(windowManager.winMap, syncWebWindows, { immediate: true });
  }
  function sendFirstOpenRecord() {
    if (userInfo.value.onboardingTaskStatus?.firstOpenWindowStatus === false) {
      updateOnboardingTaskStatus({ firstOpenWindowStatus: true });
    }
  }
  function listenOpenMessage(callbacks) {
    return globalThis.electronAPI.on('browser:launch-process-message', message => {
      if (message.code === 1 && message.message?.includes('ERR101')) showDiskWarning();
      const { data } = message;
      const id = typeof data === 'object' ? data?.dirId : typeof data === 'string' || typeof data === 'number' ? data : undefined;
      if (id == null) return;
      openMessage[String(id)] = message;
      if (message.code !== 0) {
        callbacks?.onOpenFailed?.(id);
      } else if (typeof data === 'object' && data.percent === 100 && !message.uploading && !data.statusUpdate) {
        sendFirstOpenRecord();
        callbacks?.onOpenSuccess?.(id);
        const warnings = data.warningMessages?.filter(Boolean) ?? [];
        if (warnings.length) callbacks?.onProxyDetectWarning?.(id, warnings);
      }
    });
  }
  function listenCloseMessage() {
    return globalThis.electronAPI.on('browser:on-close', ids => {
      for (const id of ids) delete openMessage[id];
    });
  }
  function listenCloseSyncingDataMessage() {
    return globalThis.electronAPI.on('browser:on-close-syncing-data', ids => {
      for (const id of ids) {
        const message = openMessage[id];
        if (!message?.data) continue;
        message.uploading = true;
        message.data.message = $t('同步中…');
      }
    });
  }
  function clearMessage(rows) {
    for (const row of rows) delete openMessage[row.dirId];
  }
  async function checkProfileStatus(rows) {
    try {
      const { code, data, msg } = await api.window.userGetWindowStatusInfoCreate({ ids: rows.map(row => row.id) });
      if (code === 0) return (data ?? []).filter(row => row.openStatus === openStatus.opened);
      report(code, msg);
    } catch (error) {
      report(-1, error.message || labels.value.getStatusFailed);
    }
    return [];
  }
  async function onOpenBrowser(rows, options) {
    const ids = rows.map(row => row.dirId);
    if (!ids.length) return;
    if (ids.length === 1 || compareVersion(user.appVersion, '3.8.7', '<')) {
      const focus = options?.focusUrlByDirId;
      return globalThis.electronAPI.send('browser:batchLaunch', ids, focus && { focusUrlByDirId: focus });
    }
    if (userInfo.value.onboardingTaskStatus?.batchOpenWindowNoPromptStatus !== false) {
      return arrange(ids, userConfig.value.batchOpenLayout);
    }
    dialog({
      showHeader: false, modal: true, blockScroll: true, closeOnEscape: false,
      slots: { container: ({ hideModal }) => h(BatchLaunchLayout, {
        count: ids.length, onClose() { clearMessage(rows); hideModal(); },
        onConfirm(layout) { arrange(ids, layout); hideModal(); },
      }) },
    });
  }
  async function openBrowserBefore(selection, options) {
    if (!globalThis.isElectron) return globalThis.electronAPI.send('browser:batchRelaunch', []);
    const rows = [].concat(selection).filter(row => row.openLimitStatus)
      .sort((left, right) => left.windowSortNum - right.windowSortNum);
    if (!rows.length) return;
    for (const [index, row] of rows.entries()) {
      openMessage[row.dirId] = { pending: true, data: { message: index ? $t('等待中...') : $t('启动中...') } };
    }
    const used = (await checkProfileStatus(rows)).filter(row =>
      !row.statusInfo?.some(status => status.openUserId === userInfo.value.id));
    if (!used.length) return onOpenBrowser(rows, options);
    let accepted = false;
    confirm.require({
      header: $t('警告'),
      message: $t('[{names}] 已被其他成员打开，是否继续打开？', {
        names: used.map(row => `${workspaceName.value}-${row.sortNum}`).join(', '),
      }),
      rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
      acceptProps: { label: $t('确认'), severity: 'info' },
      accept() { accepted = true; return onOpenBrowser(rows, options); },
      reject() { clearMessage(rows); },
      onHide() { if (!accepted) clearMessage(rows); },
    });
  }
  async function getNotUsedProfiles(rows) {
    if (!rows.some(row => Object.hasOwn(openMessage, row.dirId))) return rows;
    const running = await globalThis.electronAPI.send('browser:isProcessExists', rows.map(row => row.dirId));
    return rows.filter((_, index) => !running[index]);
  }
  async function syncOpenedBrowserState() {
    const messages = await globalThis.electronAPI.send('browser:getOpenedBrowserMessage');
    for (const data of messages ?? []) {
      openMessage[data.dirId] = { data, uploading: Boolean(data.uploading), code: data.code || 0, message: data.errorMessage };
    }
  }
  return {
    openMessage, workspaceName, listenOpenMessage, listenCloseMessage, listenCloseSyncingDataMessage, listenWebWindowManager,
    openBrowserBefore, clearMessage, checkProfileStatus, onOpenBrowser, getNotUsedProfiles, syncOpenedBrowserState, sendFirstOpenRecord,
  };
}
