import { onBeforeMount } from './workbench-vue.js';
import { mt as useWorkspace, v as useUser } from './utils-BIWenCnY.js';
import { a as storeToRefs } from './agent-BmSFI9WH.js';
import { n as workspaceTitle } from './workspace-CNvgSgaH.js';
import { n as configureColumns, r as useColumnPreferences } from './useProxyFormDrawer-r-7UykRS.js';

export function parseWindowNumbers(value) {
  if (!value) return [];
  try {
    const numbers = Array.isArray(value) ? value : JSON.parse(String(value));
    return Array.isArray(numbers) ? numbers.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}
export function copyableAccount(account, includePassword = true) {
  const { platformUrl, platformUserName, platformPassword, platformEfa } = account;
  return [platformUrl, platformUserName, includePassword && platformPassword, platformEfa].filter(Boolean).join(':');
}
export function accountColumns(options) {
  return configureColumns([
    { title: $t('平台'), key: 'status', disabledToggle: true, slot: 'platformInfo', style: { minWidth: '220px' } },
    { title: $t('账号'), key: 'platformUserName', slot: 'userName', style: { minWidth: '130px' } },
    { title: $t('密码'), key: 'platformPassword', slot: 'password', style: { minWidth: '130px' }, _cache: { visible: {} } },
    { title: $t('备注'), key: 'remark', headerSlot: 'remarkHeader', slot: 'remark', style: { minWidth: '75px' }, _cache: { extend: false } },
    { title: $t('已关联窗口'), key: 'related', slot: 'related', style: { minWidth: '120px' } },
    { title: $t('打开窗口'), key: 'open', disabledToggle: true, slot: 'open', style: { minWidth: '120px' } },
  ], options);
}
export function useAccountColumns(options) {
  const { userConfig } = storeToRefs(useUser());
  const { columns, updateColumns, updateRemarkDisplayStatus } = useColumnPreferences({ key: 'platform.list', data: accountColumns(options) });
  onBeforeMount(() => updateColumns(items => {
    const remark = items.find(item => item.key === 'remark');
    if (remark?._cache) remark._cache.extend = userConfig.value.remarkDisplayStatus;
  }));
  return { columns, updateRemarkDisplayStatus };
}
export function relatedWindows(account) {
  const workspace = workspaceTitle(useWorkspace().currentWorkspace?.workspaceName);
  return parseWindowNumbers(account.window_info).map(number => `${workspace}-${number}`);
}
