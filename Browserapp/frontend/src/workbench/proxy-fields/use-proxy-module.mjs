import { h, ref } from './workbench-vue.js';
import { h as api } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { b as useRouter } from './rich-html-link-VdBpR3Cm.js';
import { t as getLabels } from './proxy-create-mode-BCcLAAf5.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import { t as Tag } from './rx-tag-BIY_xUFU.js';
import DuplicateProxyDialog from './workbench-duplicate-proxy-dialog.js';

function columns(labels = getLabels('proxy')) {
  const text = (field, header, props) => ({ field, header, getText: row => row[field] || '--', ...(props && { props }) });
  const width = { headerStyle: { width: '100px' } };
  return [
    text('protocol', labels.protocolColumnTitle), text('host', labels.host), text('port', labels.port),
    text('proxyUserName', labels.username), text('proxyPassword', labels.password),
    ...(labels.mode === 'device' ? [{ field: 'riskRating', header: $t('风险评级'), slot: 'riskRating' }] : [text('refreshUrl', labels.refreshUrl, width)]),
    text('remark', $t('备注'), width), { field: 'outbound', header: $t('出口 IP'), slot: 'outbound' },
    { field: 'ipChecker', header: $t('IP 查询渠道'), render: ({ data }) => h(Tag, { icon: 'base/rx_ic_network', label: data.checkChannelValue, disabled: true }) },
  ];
}

function useProxyModule() {
  const router = useRouter();
  const [, notify] = useFeedback();
  const [showDialog] = useDialog();
  async function updateProxyModules(values) {
    const { code, msg } = await api.proxy.userMdfProxyModuleCreate(values);
    notify(code, msg);
    return code === 0;
  }
  async function saveProxyModules(rows, options) {
    const { labels, extraParams, onSuccess } = options;
    const proxyList = [...rows].reverse();
    const { code, msg, data } = await api.proxy.userAddProxyModuleV2Create({ ...extraParams, proxyList });
    if (code === 0) {
      if (onSuccess) await onSuccess();
      else await router.replace({ name: labels.successRouteName, query: labels.successRouteName === 'agent-list' ? { name: 'list' } : undefined });
      return;
    }
    if (code !== 101 || !Array.isArray(data)) {
      notify(code, msg);
      return;
    }
    const duplicates = new Set(data.map(item => Number(item.index)));
    const duplicateRows = rows.filter((_row, index) => duplicates.has(rows.length - 1 - index));
    const newRows = rows.filter((_row, index) => !duplicates.has(rows.length - 1 - index));
    if (!duplicateRows.length) {
      notify(code, msg);
      return;
    }
    const allExisting = newRows.length === 0;
    const fields = new Set(['protocol', 'host', 'port', 'proxyUserName', 'proxyPassword', 'refreshUrl', 'remark']);
    const duplicateColumns = columns(labels).filter(column => fields.has(column.field));
    const saving = ref(false);
    showDialog({ showHeader: false, modal: true, blockScroll: true, slots: { container: ({ hideModal }) => h(DuplicateProxyDialog, {
      title: allExisting ? labels.duplicateTitleAll : labels.duplicateTitlePartial, labels, columns: duplicateColumns, dataList: duplicateRows,
      isAllExist: allExisting, okText: allExisting ? $t('知道了') : $t('继续并保存'), saving: saving.value,
      onClose: hideModal, onCancel: hideModal,
      async onConfirm() {
        if (saving.value) return;
        saving.value = true;
        try {
          if (!allExisting) await saveProxyModules(newRows, options);
          hideModal();
        } catch (error) {
          notify(-1, error.message);
        } finally {
          saving.value = false;
        }
      },
    }) } });
  }
  return { saveProxyModules, updateProxyModules };
}

export { columns as n, useProxyModule as t };
