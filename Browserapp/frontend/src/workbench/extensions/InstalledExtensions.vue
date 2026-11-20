<script setup>
import { computed, h, ref, toRaw, useTemplateRef } from 'vue';
import { ar as runLimited, h as api } from './utils-BIWenCnY.js';
import { t as translate } from './locales-BfKu2SD4.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { n as useDialog } from './usedialog-Dh0xp3r7.js';
import { t as usePopup } from './useDialog-BC-nc8J-.js';
import { t as useMenu } from './usePopupMenu-BRw1zJ0m.js';
import { t as useSimplePopup } from './simplePopup-D6H7ykCr.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Empty } from './custom-new-empty-CLCRgYs2.js';
import { t as Tag } from './rx-tag-BIY_xUFU.js';
import { t as Related } from './related-info-VU3nxvtB.js';
import { n as TableActions, t as Table } from './table-BJcS2I0Z.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import UploadExtension from './upload-extension.js';
import AssignExtension from './assign-extension.js';
import ExtensionInspection from './extension-inspection.js';
import ChromeExtensionHelp from './chrome-extension-help.js';
import { useExtensionText } from './extension-labels.js';

const updateAvailable = 1;
const text = useExtensionText();
const table = useTemplateRef('extensionTable');
const confirm = useConfirm();
const dialog = useDialog();
const [showInspectionPopup] = usePopup();
const { showMenu } = useMenu();
const { showSimpleDialog } = useSimplePopup();
const [feedback, report] = useFeedback();
const checking = ref({});
const updating = ref({});
const dialogProps = { showHeader: false, modal: true, blockScroll: true };
const columns = computed(() => [{
  header: text.value.infoColumn, field: 'extension', slot: 'extension',
}, {
  header: translate('来源'), field: 'source', getText: row => ({
    sys: translate('内置扩展'), local: translate('本地上传'), store: 'Chrome Web Store',
  })[row.source] || translate('未知'),
}, {
  header: text.value.installedProjectsColumn, field: 'related', slot: 'related',
}, {
  header: translate('更新信息'), field: 'pluginUpdateState', slot: 'update',
}]);

function list(parameters) {
  return api.plugins.userGetPluginListList(parameters);
}

function refresh() {
  return table.value?.refresh();
}

function openPin(event, row) {
  showMenu(event, {
    mode: { type: 'single', value: row.fixedPlugin, options: [
      { label: translate('自定义'), name: 'customize' },
      { label: translate('始终固定到工具栏'), name: 'pin' },
      { label: translate('始终不固定到工具栏'), name: 'unpin' },
    ] },
    menuProps: { onHide: async ({ value }) => {
      if (!value || value === row.fixedPlugin) return;
      try {
        const result = await api.plugins.userFixedPluginToWindowCreate({ id: row.id, fixedPlugin: value });
        if (result.code !== 0) {
          report(result.code, result.msg);
          return;
        }
        row.fixedPlugin = value;
      } catch (error) {
        report(-1, error.message);
      }
    } },
    slots: { start: () => h('div', { class: 'pl-4 pt-2' }, [translate('固定方式')]) },
  });
}

function actions({ rows, row }) {
  const selection = rows ?? row;
  const extensions = [].concat(selection);
  const canUpdate = extensions.some(extension => extension.pluginUpdateState === updateAvailable);
  return [{
    key: 'checkUpdate', label: translate('检查更新'), icon: 'base/rx_ic_clock_rotate', power: true,
    multiple: { name: 'G1', showLabel: true }, visible: false, tooltip: translate('检查更新'), quick: true,
    command: () => checkUpdates(selection),
  }, {
    key: 'update', label: translate('更新'), icon: 'base/rx_ic_renew', power: true,
    visible: canUpdate, disabled: !canUpdate, disabledTooltip: text.value.noUpdateNeeded,
    multiple: { name: 'G2', showLabel: true }, command: () => update(selection),
  }, {
    key: 'edit', label: translate('编辑'), icon: 'base/rx_ic_edit', power: true,
    visible: selection.source === 'local', command: () => openUpload(selection),
  }, {
    key: 'install', label: text.value.installToProject, icon: 'base/rx_ic_stack_install', power: true,
    command: () => openAssignment(selection),
  }, { power: true, separator: true }, {
    key: 'delete', label: translate('删除'), icon: 'base/rx_ic_bin_1',
    disabled: extensions.some(extension => !extension.canDelete),
    disabledTooltip: translate('选项中包含其他人的插件'), power: true,
    multiple: { name: 'G4', showLabel: true }, command: () => remove(extensions),
  }];
}

async function readExtension(pluginId) {
  const result = await api.plugins.userGetPluginInfoByIdList({ pluginId });
  if (result.code !== 0) throw Error(result.msg || translate('扩展读取失败'));
  return result.data.rows[0];
}

function openStore() {
  showSimpleDialog({
    title: text.value.addGoogle, confirmText: translate('确认添加'),
    inputs: [{ name: 'url', type: 'text', props: { placeholder: text.value.googleStoreUrlPlaceholder, preIcon: 'base/rx_ic_link' } }],
    onConfirm: async payload => {
      try {
        const { code, data, msg } = await api.plugins.userUploadChromePluginsV2Create(payload);
        if (code !== 0 && code !== 421) {
          report(code, msg);
          return false;
        }
        refresh();
        openAssignment(code === 421 ? data : await readExtension(data.plugin_id));
      } catch (error) {
        if (!error.localUiNotified) globalThis.__localUiError?.(error.message);
        return false;
      }
    },
    afterRender: () => h(ChromeExtensionHelp),
  });
}

function openUpload(extension = {}) {
  const { pluginDir, localKey } = extension;
  dialog.open(UploadExtension, {
    props: dialogProps,
    data: {
      localKey, pluginDir,
      onConfirm: async payload => {
        const { code, data, msg } = await api.plugins.userUploadPluginInfoCreate({
          ...payload, pluginDir: pluginDir || payload.pluginDir,
        });
        if (code !== 0) throw Error(msg);
        report(code, msg);
        refresh();
        if (!pluginDir) openAssignment(await readExtension(data.plugin_id));
      },
    },
  });
}

function openAssignment(extension) {
  if (!extension) return;
  dialog.open(AssignExtension, {
    props: dialogProps,
    data: {
      props: extension,
      onConfirm: async payload => {
        const { code, msg } = await api.plugins.userAddPluginToWindowCreate({ ...payload, pluginId: extension.id });
        if (code !== 0) throw Error(msg);
        const finished = globalThis.electronAPI.send('extension:download', [toRaw(extension)]);
        void finished.catch(error => report(-1, error.message));
        report(code, msg);
        refresh();
      },
    },
  });
}

async function checkUpdates(selection) {
  const extensions = [].concat(selection).filter(row => !checking.value[row.pluginDir]);
  const outcomes = await runLimited(extensions.map(row => async () => {
    checking.value[row.pluginDir] = true;
    try {
      const result = await api.plugins.userCheckAllPluginsVersionList({ pluginDir: row.pluginDir, pluginID: row.id });
      if (result.code !== 0) {
        report(result.code, result.msg);
        return false;
      }
      const version = result.data?.pluginUpdateStates?.[0];
      if (version) Object.assign(row, version);
      return version?.pluginUpdateState === updateAvailable;
    } catch (error) {
      report(-1, error.message);
      return false;
    } finally { delete checking.value[row.pluginDir]; }
  }), 2);
  const count = outcomes.filter(Boolean).length;
  if (extensions.length) feedback(0, extensions.length > 1
    ? text.value.formatCheckUpdateWithCount(count) : translate('检查更新完成'));
}

async function update(selection) {
  const extensions = [].concat(selection).filter(row =>
    row.pluginUpdateState === updateAvailable && !updating.value[row.pluginDir]);
  await runLimited(extensions.map(row => async () => {
    updating.value[row.pluginDir] = true;
    try {
      const { code, msg } = await api.plugins.userUpgradePluginsCreate({
        pluginDir: row.pluginDir, pluginName: row.pluginName, pluginID: row.id,
      });
      report(code, row.pluginName + ': ' + msg);
    } catch (error) {
      report(-1, error.message);
    } finally { delete updating.value[row.pluginDir]; }
  }), 2);
  refresh();
}

function remove(extensions) {
  const { promise, resolve } = Promise.withResolvers();
  confirm.require({
    header: text.value.deleteHeader, message: text.value.deleteMessage,
    rejectProps: { label: translate('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: translate('确认'), severity: 'danger' },
    reject: resolve, onHide: resolve,
    accept: async () => {
      try {
        const result = await api.plugins.userBatchDelPluginInfoCreate({ ids: extensions.map(row => row.id) });
        report(result.code, result.msg);
        if (result.code === 0) {
          refresh();
          await globalThis.electronAPI.send('extension:remove', extensions.map(row => row.pluginDir));
        }
      } catch (error) {
        report(-1, error.message);
      } finally { resolve(); }
    },
  });
  return promise;
}

function inspect(extensionInfo) {
  showInspectionPopup({
    header: text.value.securityCheck, class: 'w-480px',
    slots: { default: () => h(ExtensionInspection, { extensionInfo }), footer: undefined },
  });
}
</script>

<template>
  <Table ref="extensionTable" cache-key="extension-list" remember="extension-list" scrollable
    selection-mode="multiple" :model="actions" :table-request="list" :columns="columns"
    :virtual-scroller-options="{ itemSize: 60 }" :show-gridlines="false">
    <template #filter-after>
      <div class="flex items-start justify-between w-full">
        <div class="group-button">
          <Button size="xxs" icon="base/rx_ic_download_cloud" :label="text.addGoogle" @click.stop="openStore" />
          <Button outlined severity="secondary" size="xxs" icon="base/rx_ic_export"
            :label="translate('本地上传')" @click.stop="openUpload()" />
        </div>
      </div>
    </template>
    <template #empty>
      <Empty icon="base/rx_ic_extension_store" img="empty-extensions.png" :title="text.emptyTitle" :desc="text.emptyDesc">
        <template #extra>
          <div class="flex gap-3">
            <Button outlined severity="secondary" size="md" icon="base/rx_ic_magnify"
              :label="text.searchButton" @click.stop="openUpload()" />
          </div>
        </template>
      </Empty>
    </template>
    <template #extension="{ data }">
      <div class="flex items-center gap-3 w-75">
        <img class="extension-image" :src="data.pluginIcon">
        <div class="flex flex-col justify-center items-start w-full extension-info">
          <div class="w-full ellipsis-1 extension-info-name">{{ data.pluginName }}</div>
          <div class="extension-info-version"> v{{ data.pluginVersion }}</div>
        </div>
      </div>
    </template>
    <template #related="{ data }">
      <div @click.stop="openAssignment(data)">
        <Related class="cursor-pointer" icon="base/rx_ic_stack" :list="data.bindPlugin">
          <template #empty>
            <div class="flex items-center gap-1.5">
              <Tag class="cursor-pointer" icon="base/rx_ic_stack" />
              <span class="not-installed">{{ translate('尚未安装') }}</span>
            </div>
          </template>
        </Related>
      </div>
    </template>
    <template #update="{ data }">
      <span v-if="checking[data.pluginDir]" class="flex items-end gap-1">
        <span>{{ translate('检查中') }}</span><span class="dots"></span>
      </span>
      <div v-else-if="data.pluginUpdateState === updateAvailable" class="flex items-center gap-3">
        <Button severity="success" icon="base/rx_ic_renew" :loading="updating[data.pluginDir]"
          :label="translate('更新')" size="xxs" @click.stop="update(data)" />
        <Icon v-tooltip.top="{ value: 'latest: ' + data.pluginNewVersion, showDelay: 500 }"
          name="base/rx_ic_info" color="var(--colors-icon-icon-note)" />
      </div>
      <div v-else class="update-info"> -- </div>
    </template>
    <template #actions="{ data, isPending, model, openMenu }">
      <div class="flex items-center">
        <Button v-tooltip.top="{ value: translate('固定'), showDelay: 500 }" text severity="secondary" size="xxs"
          @click.stop="openPin($event, data)">
          <template #icon>
            <Icon class="block pointer-events-none" :class="{ pinned: data.fixedPlugin === 'pin' }"
              :name="data.fixedPlugin === 'pin' ? 'base/rx_ic_pin_solid_02' : 'base/rx_ic_pin_line_02'"
              color="var(--colors-icon-icon-secondary)" />
          </template>
        </Button>
        <Button v-tooltip.top="{ value: translate('安全检测'), showDelay: 500 }" severity="secondary" size="xxs"
          icon="base/rx_ic_shield" text @click.stop="inspect(data)" />
        <TableActions :model="model" :data="data" :is-pending="isPending" @more="openMenu" />
      </div>
    </template>
  </Table>
</template>
