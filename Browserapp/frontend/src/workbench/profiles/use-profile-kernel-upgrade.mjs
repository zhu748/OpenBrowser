import { h } from './workbench-vue.js';
import { En as unsupportedKernel, ln as systemInfo, m as loadSystemOptions, qt as BrowserType } from './utils-BIWenCnY.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import KernelUpgradeDialog from './workbench-kernel-upgrade-dialog.js';

const legacyChromium = '109';
const previewLimit = 10;
const chromium = BrowserType.Chrome;
const firefox = BrowserType.Firefox;
const typeOf = row => row.coreType === firefox ? firefox : chromium;
const major = version => Number.parseInt(version, 10);

function installedVersions(options, installed, type, catalogKey) {
  const versions = new Set(installed.filter(kernel => typeOf(kernel) === type).map(kernel => String(kernel.coreVersion ?? '')).filter(Boolean));
  const known = (options[catalogKey] ?? []).map(kernel => kernel.value).filter(Boolean);
  return versions.size ? known.filter(version => versions.has(String(version))) : known;
}
async function inventory() {
  const [options, installed, system] = await Promise.all([loadSystemOptions(), globalThis.electronAPI.send('app:getCoreList'), systemInfo()]);
  return {
    [chromium]: installedVersions(options, installed ?? [], chromium, 'coreVersion'),
    [firefox]: installedVersions(options, installed ?? [], firefox, 'firefoxCoreVersion'),
    host: system['R-OS'], hostVersion: system.osVersion,
  };
}
function newestCompatible(row, kernels) {
  const type = typeOf(row);
  let versions = kernels[type];
  if (type === chromium) {
    const legacyWindows = row.os?.toLowerCase() === 'windows' && /^[78]/.test(row.osVersion ?? '');
    versions = versions.filter(version => (!legacyWindows || String(version) === legacyChromium)
      && !unsupportedKernel(kernels.host, kernels.hostVersion, type, version));
  }
  return versions.reduce((latest, version) => !latest || major(version) > major(latest) ? version : latest, undefined);
}
function planUpgrade(rows, kernels) {
  let available = false;
  const groups = new Map();
  for (const row of rows) {
    if (row.id == null) continue;
    const version = newestCompatible(row, kernels);
    if (!Number.isFinite(major(version))) continue;
    available = true;
    if (Number.isFinite(major(row.coreVersion)) && major(row.coreVersion) >= major(version)) continue;
    const type = typeOf(row);
    const key = `${type}:${version}`;
    if (!groups.has(key)) groups.set(key, { type, version, ids: [], rows: [] });
    const group = groups.get(key);
    group.ids.push(row.id);
    group.rows.push(row);
  }
  return { available, groups: [...groups.values()] };
}

function previewNames(workspace, rows) {
  const names = rows.slice(0, previewLimit)
    .map(row => row.windowSortNum == null ? row.windowName : `${workspace}-${row.windowSortNum}`).filter(Boolean);
  return names.join(', ') + (rows.length > previewLimit ? '...' : '');
}

export function useProfileKernelUpgrade({ onlyErrorToast, showToast, getWorkspaceName }) {
  const [openDialog] = useDialog();
  async function onUpgradeCore(rows) {
    const { available, groups } = planUpgrade(rows, await inventory());
    if (!groups.length) {
      onlyErrorToast(-1, available ? $t('所选窗口已是最新内核') : $t('当前没有可升级的内核版本'));
      return;
    }
    const workspace = getWorkspaceName();
    const messages = groups.map(group => $t('[{names}]窗口将升级到 {version} 内核版本', {
      names: previewNames(workspace, group.rows), version: `${group.type} ${group.version}`,
    }));
    async function confirmUpgrade() {
      try {
        await globalThis.__localRequest('profiles:upgrade-kernels', {
          groups: groups.map(({ ids, version }) => ({ ids: ids.map(String), version })),
        });
      } catch (error) {
        onlyErrorToast(-1, error.message);
        throw error;
      }
      for (const group of groups) {
        for (const row of group.rows) row.coreVersion = group.version;
      }
      showToast(0, $t('升级成功'));
    }
    openDialog({
      uniqueKey: 'upgrade-core', showHeader: false, modal: true, blockScroll: true, pt: { content: '!pa-0' },
      slots: { container: ({ hideModal }) => h(KernelUpgradeDialog, { messages, close: hideModal, confirmUpgrade }) },
    });
  }
  return { onUpgradeCore };
}
