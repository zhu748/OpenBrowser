<script setup>
import { computed, h, nextTick, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef, watch } from 'vue';
import { En as unsupportedKernel, at as useRole, h as requests, kr as delay, ln as hostOS, mt as useWorkspace,
  nn as usePermission, or as copyText, qt as browserFamily, rn as permission, v as useConfig, vt as cache, yt as useCache } from './utils-BIWenCnY.js';
import { a as storeToRefs, n as useNotice } from './agent-BmSFI9WH.js';
import { t as requestType } from './permission-DOhNJfB3.js';
import { b as useRouter } from './rich-html-link-VdBpR3Cm.js';
import { t as Table } from './ry-table-do6kugym.js';
import { n as workspaceTitle } from './workspace-CNvgSgaH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { n as useDialog } from './usedialog-Dh0xp3r7.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as useSimplePopup } from './simplePopup-D6H7ykCr.js';
import { a as Search, i as RelatedWindows, o as useDrawer } from './useProxyFormDrawer-r-7UykRS.js';
import { o as normalizePlatforms, s as accountFields, t as AccountEditor } from './quick-kroUOSn_.js';
import { a as windowNumbers, i as formatAccount, n as linkedWindows, o as PlatformCell, r as useColumns,
  s as EditableCell } from './quick-CZrtqSCy.js';
import { n as profileLabels } from './useProfileEntityLabels-BfqbVpel.js';
import { t as Tutorial } from './tutorial-video-Cb-jkf_V.js';
import { t as Empty } from './custom-new-empty-CLCRgYs2.js';
import { t as Header } from './views-header-CcjwXPjG.js';
import { t as ProfileSelect } from './profile-select-Cn2Zq-u9.js';
import { a as Progress, i as useProfileOpenState } from './useProfileOpenState-GCrr7PDa.js';
import ExportAccounts from './workbench-account-export.js';

const router = useRouter();
const confirm = useConfirm();
const dialog = useDialog();
const drawer = useDrawer();
const { userConfig } = storeToRefs(useConfig());
const [showNotice, showStatus] = useNotice();
const { columns, updateRemarkDisplayStatus } = useColumns();
const { showSimpleDialog } = useSimplePopup();
const { check } = usePermission();
const workspace = useWorkspace();
const { invalidateCache } = useCache();
const { isViewer } = storeToRefs(useRole());
const canEdit = computed(() => !isViewer.value);
const canAdd = computed(() => canEdit.value && check(permission.Add));
const canViewPassword = computed(() => check(permission.ViewPassword));
const canExport = computed(() => check(permission.BatchExport));
const labels = profileLabels();
const {
  openMessage, listenOpenMessage, listenCloseMessage, listenCloseSyncingDataMessage,
  openBrowserBefore, syncOpenedBrowserState,
} = useProfileOpenState();
const linkedProfiles = reactive({});
const opening = reactive({});
let profileRequest = 0;
let catalogRequest;
let unsubscribers = [];
const catalog = ref([]);
const table = useTemplateRef('account');
const selection = ref([]);
const rows = ref([]);

const searchOptions = [
  { key: 'platform', label: $t('平台名称'), icon: 'base/rx_ic_keys', syntax: 'platform::' },
  { key: 'account', label: $t('账号名称'), icon: 'base/rx_ic_user_key', syntax: 'account::' },
  { key: 'remark', label: $t('备注'), icon: 'base/rx_ic_doc_article', syntax: 'note::' },
];
const rowActions = [
  { name: 'copy', label: $t('复制'), icon: 'base/rx_ic_copy', tooltip: $t('复制'), quick: true },
  { name: 'edit', label: $t('编辑'), icon: 'base/rx_ic_edit', power: check(permission.Edit), tooltip: $t('编辑'), quick: true },
  { name: 'remark', label: $t('添加备注'), icon: 'base/rx_ic_doc_add', multiple: true, multipleProps: { name: 'G1', showLabel: true } },
  { separator: true },
  { name: 'delete', label: $t('删除'), icon: 'base/rx_ic_bin_1', power: check(permission.Delete), quick: true,
    tooltip: $t('删除'), multiple: true, multipleProps: { name: 'G2', showLabel: true } },
];
watch(isViewer, readonly => {
  const column = columns.value.find(column => column.key === 'actions');
  if (column) column._visible = !readonly;
}, { immediate: true });

function loadCatalog() {
  if (catalog.value.length) return Promise.resolve();
  catalogRequest ||= requests.platform.userGetPlatformInfoList({}).then(({ code, data }) => {
    if (code === 0) catalog.value = normalizePlatforms(data?.rows);
  }).catch(error => {
    console.error('[account-list] failed to load platform catalog', error);
  }).finally(() => { catalogRequest = undefined; });
  return catalogRequest;
}

function rowOperations(account) {
  const profile = !Array.isArray(account) && account?.id ? linkedProfiles[account.id] : undefined;
  const open = !Array.isArray(account)
    ? [{ name: 'openWindow', label: $t('打开窗口'), icon: profile?.coreType === browserFamily.Firefox ? 'base/rx_ic_firefox' : 'base/rx_ic_chrome' }]
    : [];
  return canEdit.value ? open.concat(rowActions) : open;
}
function dispatch(action, row) {
  switch (action.name) {
    case 'openWindow': return openWindow(row);
    case 'copy': return copyAccount(row);
    case 'edit': return editAccount(row);
    case 'remark': return addRemark(row);
    case 'delete': return deleteAccounts(row);
  }
}

function search({ key, value } = {}) {
  table.value?.refresh({ queryKey: value && (key || 'name_remark'), queryValue: value }, true);
}
async function loadAccounts(params) {
  const result = await requests.platform.userGetPlatformInfoV2List(params);
  if (result.code === 0) {
    rows.value = result.data.rows;
    void updateProfiles(result.data.rows);
  }
  return result;
}
function firstWindow(account) {
  return windowNumbers(account.window_info)[0];
}
function openStatus(account) {
  const id = account.id;
  if (id && opening[id]) return { msg: $t('启动中...'), percent: 0, completed: false, uploading: false, disabled: true, failed: false, notice: '' };
  const profile = id && linkedProfiles[id];
  const status = profile?.dirId ? openMessage[profile.dirId] : undefined;
  const data = status?.data;
  const failed = status?.code === 1 || Boolean(status?.error);
  const completed = data?.percent === 100;
  return {
    msg: !status || failed ? labels.value.open : data?.message ?? labels.value.open,
    percent: data?.percent || 0, completed, uploading: Boolean(status?.uploading),
    disabled: Boolean(status && (status.pending || status.uploading || !(failed || completed))),
    failed,
    notice: [failed ? status?.message || status?.error?.message : undefined, data?.warningMessages?.filter(Boolean).join('\n')].filter(Boolean).join('\n'),
  };
}

async function updateProfiles(accounts) {
  const ticket = ++profileRequest;
  const requested = accounts.flatMap(account => {
    if (!account.id) return [];
    const number = firstWindow(account);
    if (!number) {
      delete linkedProfiles[account.id];
      return [];
    }
    const profile = linkedProfiles[account.id];
    return profile?.windowSortNum === number && profile.dirId ? [] : [{ id: account.id, number }];
  });
  if (!requested.length) return;
  const numbers = [...new Set(requested.map(item => item.number))];
  try {
    const { code, data } = await requests.window.userGetWindowInfoListList({
      page_index: 1, page_size: numbers.length, sortNums: numbers.join(','), isDelete: 0,
    });
    if (ticket !== profileRequest || code !== 0 || !data) return;
    const byNumber = new Map(data.rows.map(profile => [profile.windowSortNum, profile]));
    for (const { id, number } of requested) {
      const profile = byNumber.get(number);
      if (profile?.dirId) linkedProfiles[id] = profile;
      else delete linkedProfiles[id];
    }
  } catch (error) {
    console.error('[account-list] failed to load related windows', error);
  }
}

async function openWindow(account) {
  const number = firstWindow(account);
  if (!number) {
    if (canEdit.value && check('Profiles_select_platform')) {
      bindWindows(account);
      await delay(200);
      showNotice(0, '', { severity: 'warn', summary: $t('请先关联窗口，再进行操作') });
    } else showNotice(0, '', { severity: 'warn', summary: $t('该账号尚未关联窗口') });
    return;
  }
  const id = account.id;
  if (!id || openStatus(account).disabled) return;
  opening[id] = true;
  try {
    const { code, data, msg } = await requests.window.userGetWindowInfoListList({
      page_index: 1, page_size: 1, sortNums: String(number), isDelete: 0,
    });
    if (code !== 0) return showStatus(code, msg);
    const profile = data.rows.find(row => row.windowSortNum === number);
    if (!profile?.dirId) {
      delete linkedProfiles[id];
      return showStatus(-1, $t('窗口/数据不存在，请刷新页面后重试'));
    }
    linkedProfiles[id] = profile;
    const { osVersion, 'R-OS': os } = await hostOS();
    if (unsupportedKernel(os, osVersion, profile.coreType, profile.coreVersion)) {
      return showStatus(-1, $t('当前系统不支持使用{version}内核', { version: profile.coreVersion }));
    }
    if (!profile.openLimitStatus) return showStatus(-1, $t('通用窗口额度不足，无法打开'));
    const url = account.platformUrl?.trim();
    await openBrowserBefore(profile, url ? { focusUrlByDirId: { [profile.dirId]: url } } : undefined);
  } catch (error) {
    console.error('[account-list] failed to open related window', error);
    showStatus(-1, $t('获取窗口信息失败'));
  } finally {
    delete opening[id];
  }
}

function refresh() {
  invalidateCache(cache.ACCOUNT_LIST);
  table.value?.refresh();
}
function invalidateWindows() {
  invalidateCache(cache.BROWSER_LIST);
}
function addAccount() {
  return router.push({ name: 'account-create' });
}
async function readAccount(row) {
  const result = await globalThis.__localRequest('accounts:list', { id: row.id });
  return result.rows[0];
}
async function editAccount(row) {
  const account = { ...row, ...await readAccount(row) };
  drawer.showDrawer({
    title: $t('编辑平台账号'),
    slots: { container: () => h(AccountEditor, {
      data: account, onClose: () => drawer.hideDrawer(),
      onConfirm: updated => updateAccounts([updated]),
    }) },
  });
}
async function updateAccounts(platformList, options = {}) {
  const { code, msg } = await requests.platform.userMdfPlatformInfoCreate({ platformList, ...options });
  showStatus(code, msg);
  if (code === 0) refresh();
}
async function editField(account, key, title, type = 'text') {
  const hideValue = key === 'platformPassword' && !canViewPassword.value;
  if (key === 'platformUserName' || key === 'platformPassword') await loadCatalog();
  const fields = accountFields({ platformUrl: account.platformUrl }, catalog.value);
  const label = key === 'platformUserName' ? fields.account : key === 'platformPassword' ? fields.password : undefined;
  showSimpleDialog({
    title,
    inputs: [{ type, name: key, label, value: hideValue ? '' : account?.[key], props: { placeholder: title, rows: type === 'textarea' ? 6 : undefined } }],
    onConfirm: values => updateAccounts([{ ...account, [key]: values[key]?.trim?.() ?? values[key] }]),
  });
}
async function copyAccount(row) {
  const account = canViewPassword.value ? await readAccount(row) : row;
  copyText(formatAccount(account, canViewPassword.value));
  showNotice(0, $t('已复制'));
}
function addRemark(accounts) {
  const { promise, resolve } = Promise.withResolvers();
  showSimpleDialog({
    title: $t('为所选账号添加备注'),
    inputs: [{ type: 'textarea', name: 'platformRemarks', value: accounts?.platformRemarks, props: { placeholder: $t('请输入备注'), rows: 6 } }],
    onConfirm: ({ platformRemarks }) => updateAccounts([].concat(accounts).map(row => ({ ...row, platformRemarks })), { requestType: requestType.EditRemark }),
    onHide: resolve,
  });
  return promise;
}
function toggleRemarks(column) {
  column.extend = !column.extend;
  updateRemarkDisplayStatus(column.extend);
}
async function togglePassword(id, column) {
  if (!column.visible[id]) {
    const row = rows.value.find(account => String(account.id) === String(id));
    if (row) Object.assign(row, await readAccount(row));
  }
  if (Object.hasOwn(column.visible, id)) delete column.visible[id];
  else column.visible[id] = true;
}
function bindWindows(account) {
  drawer.showDrawer({
    title: $t('选择窗口'),
    slots: { container: () => h(ProfileSelect, {
      linkedWindowSortNums: windowNumbers(account.window_info),
      onClose: () => drawer.hideDrawer(),
      onConfirm: async windows => {
        if (!account.id) return;
        const { code, msg } = await requests.window.userMdfPlatformBindWindowCreate({
          platformId: account.id, windowIds: windows.map(window => window.id),
        });
        showStatus(code, msg);
        if (code === 0) { refresh(); invalidateWindows(); }
      },
    }) },
  });
}
async function exportAccounts() {
  const selected = selection.value?.length ? selection.value : rows.value;
  const data = canViewPassword.value ? await Promise.all(selected.map(readAccount)) : selected;
  dialog.open(ExportAccounts, { props: { showHeader: false, modal: true, blockScroll: true },
    data: { props: { data, workspaceName: workspaceTitle(workspace.currentWorkspace?.workspaceName), canViewPassword: canViewPassword.value } } });
}
function deleteAccounts(accounts) {
  const { promise, resolve } = Promise.withResolvers();
  confirm.require({
    header: $t('删除平台账号'),
    message: $t('您确认要删除所选平台账号吗？删除后，将会与所有绑定的窗口解绑，但已有的登陆状态不会丢失'),
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认'), severity: 'danger' },
    accept: async () => {
      const { code, msg } = await requests.platform.userDelPlatformInfoCreate({ ids: [].concat(accounts).map(row => row.id) });
      showStatus(code, msg);
      if (code === 0) { refresh(); invalidateWindows(); }
      resolve();
    },
    reject: resolve, onHide: resolve,
  });
  return promise;
}

onBeforeMount(() => {
  unsubscribers = [listenOpenMessage(), listenCloseMessage(), listenCloseSyncingDataMessage()];
  syncOpenedBrowserState();
});
onMounted(() => nextTick(() => {
  const entry = table.value?.getCachedEntry?.();
  if (entry?.rows) {
    rows.value = entry.rows;
    void updateProfiles(entry.rows);
  }
}));
onBeforeUnmount(() => {
  profileRequest++;
  unsubscribers.forEach(stop => stop?.());
});
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <Header :title="$route.meta.title">
      <Button v-if="canAdd" size="xxs" icon="base/rx_ic_add_keys" :label="$t('添加账号')" @click.stop="addAccount" />
    </Header>
    <div class="flex flex-1 overflow-hidden">
      <Table ref="account" v-model:columns="columns" v-model:selection="selection" cache-key="account-list" list-cache-key="account-list"
        selection-mode="multiple" class="account-table" :table-request="loadAccounts" :table-operation="rowOperations"
        :operation-handler="dispatch" :virtual-scroller-options="{ itemSize: 60 }" :show-gridlines="false" context-menu
        :show-actions="canEdit" :show-actions-menu="false">
        <template #display-before>
          <Button v-if="canExport" severity="secondary" outlined size="xxs" icon="base/rx_ic_export" :label="$t('导出数据')" @click.stop="exportAccounts" />
        </template>
        <template #filter-after>
          <Search :options="searchOptions" :search="search" :clear="search" />
        </template>
        <template #table-empty>
          <Empty icon="base/rx_ic_keys" img="empty-accounts.png" :title="$t('暂无平台账号')" :desc="$t('在此添加平台账号以管理，并更方便地与窗口进行绑定。')">
            <template #extra>
              <div class="flex gap-3">
                <Button v-if="canAdd" outlined severity="secondary" size="md" icon="base/rx_ic_add_keys" :label="$t('添加账号')" @click.stop="addAccount" />
                <Tutorial video-type="account_management" :autoplay="false" />
              </div>
            </template>
          </Empty>
        </template>
        <template #platformInfo="{ data }"><PlatformCell :data="data" :readonly="isViewer" @click.stop="!isViewer && editAccount(data)" /></template>
        <template #userName="{ data }">
          <EditableCell :value="data.platformUserName" show-copy :show-edit="canEdit" @edit="editField(data, 'platformUserName', $t('修改账号'), 'textarea')" />
        </template>
        <template #password="{ data, column: { _cache } }">
          <EditableCell :value="data.platformPassword ?? (data.hasPassword ? '********' : '')" :masked="!canViewPassword || !_cache.visible[data.id]"
            show-masked :show-copy="canViewPassword" :show-edit="canEdit && check(permission.Edit)"
            @edit="editField(data, 'platformPassword', $t('修改密码'), 'textarea')" @toggle-masked="togglePassword(data.id, _cache)" />
        </template>
        <template #remarkHeader="{ column: { title, _cache } }">
          <div class="flex items-center gap-2 note-header w-full">
            <span>{{ title }}</span>
            <Icon v-tooltip.top="{ value: _cache.extend ? $t('收起') : $t('展开'), showDelay: 0 }" class="cursor-pointer color-[#989CA0]"
              :name="_cache.extend ? 'base/rx_ic_hidden' : 'base/rx_ic_eye'" @click.stop="toggleRemarks(_cache)" />
          </div>
        </template>
        <template #remark="{ data, column: { _cache } }">
          <div class="inline-flex items-center gap-1" :class="{ 'cursor-pointer': canEdit }" @click.stop="canEdit && addRemark(data)">
            <Button v-tooltip.top="{ value: data.platformRemarks, showDelay: 0 }" class="shrink-0" :class="{ 'note-light': data.platformRemarks }"
              text severity="secondary" size="xxs" :icon="data.platformRemarks ? 'base/rx_ic_doc_fill' : 'base/rx_ic_doc_add'" />
            <div v-if="_cache.extend" :title="data.platformRemarks" class="min-w-50 whitespace-pre-wrap note-content">{{ data.platformRemarks }}</div>
          </div>
        </template>
        <template #related="{ data }">
          <RelatedWindows :list="linkedWindows(data)" :show-add="canEdit && check('Profiles_select_platform')" @add="bindWindows(data)" />
        </template>
        <template #open="{ data }">
          <div class="flex items-center gap-1" @click.stop>
            <Button class="related-open" size="xxs" outlined severity="secondary" :disabled="Boolean(firstWindow(data)) && openStatus(data).disabled" @click.stop="openWindow(data)">
              <Progress v-if="openStatus(data).percent && !openStatus(data).completed" size="16" :value="openStatus(data).percent" />
              <span class="select-none">{{ openStatus(data).completed && !openStatus(data).uploading ? $t('查看') : openStatus(data).msg }}</span>
            </Button>
            <Icon v-if="openStatus(data).notice" v-tooltip.top="openStatus(data).notice" name="base/rx_ic_info_fill" :class="openStatus(data).failed ? 'text-red' : 'text-orange'" />
          </div>
        </template>
      </Table>
    </div>
  </div>
</template>
