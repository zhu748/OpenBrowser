<script setup>
import { computed, ref } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as SelectButton } from './rx-select-button-DQtmZ0kT.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { t as Tooltip } from './rx-tooltip-CNCSEJGC.js';

const props = defineProps({ upgradeList: { type: Array, default: () => [] } });
const emit = defineEmits(['onDownloadClick']);
const confirm = useConfirm();
const [, report] = useFeedback();
const family = ref('All');
const rows = computed(() => props.upgradeList.flatMap(group => group.list));
const pendingUpdates = computed(() => rows.value.filter(row => row.status === 'update'));
const groups = computed(() => props.upgradeList.map(group => ({
  ...group, list: group.list.filter(row => family.value === 'All' || row.coreType === family.value),
})).filter(group => group.list.length));
const filters = computed(() => ['All', 'Chrome', 'Firefox'].map(value => ({
  value, name: value === 'All' ? $t('全部') : value,
  disabled: value === 'Firefox' && !rows.value.some(row => row.coreType === value),
})));
const active = new Set();
const identity = row => row.coreType + ':' + (row._version ?? row.coreVersion);
function logo(row) {
  return row.coreType === 'Firefox' ? '/assets/workbench-kernel-firefox.png' : '/assets/workbench-kernel-chrome.png';
}
async function install(row) {
  const id = identity(row);
  if (active.has(id)) return;
  active.add(id);
  const previous = row.status;
  row.status = 'downloading';
  try {
    await globalThis.ops.kernelInstallVersion(row._engine, row._version);
    emit('onDownloadClick', row);
  } catch (error) {
    row.status = previous;
    report(-1, error.message);
  } finally {
    active.delete(id);
  }
}
async function installAll() {
  for (const row of [...pendingUpdates.value]) await install(row);
}
function remove(event, row) {
  confirm.require({
    target: event.currentTarget, message: $t('确定删除该内核吗？'), group: 'popup',
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确定'), severity: 'danger' },
    accept: async () => {
      try {
        await globalThis.ops.kernelDelete(row._engine, row._version);
        row.status = 'uninstalled';
      } catch (error) {
        report(-1, error.message);
      }
    },
  });
}
</script>

<template>
  <div class="flex flex-col items-start gap-3">
    <div class="-mb-3 flex items-center justify-between pa-3 w-full">
      <SelectButton v-model="family" :options="filters" option-disabled="disabled" option-label="name" option-value="value"
        data-key="value" :pt="{ root: '_bg_12mtn_1', pcToggleButton: { root: '_btn_12mtn_5' } }" />
      <Button v-if="pendingUpdates.length" severity="secondary" variant="text" size="xxs" icon="base/rx_ic_renew"
        :label="$t('更新全部({count})', { count: pendingUpdates.length })" @click="installAll" />
    </div>
    <div v-for="group in groups" :key="group.title" class="w-full">
      <div v-if="groups.length > 1" class="py-2 px-4 title">{{ group.title }}</div>
      <div v-for="row in group.list" :id="'kernel_' + row.coreType + ':' + row.coreVersion" :key="identity(row)"
        class="w-full flex flex-col items-start item" :class="{ 'cursor-pointer light': row._light }">
        <div class="w-full flex justify-between items-center self-stretch">
          <div class="flex-1 flex items-center gap-1.5 py-3 pl-4" @click="row._light = false">
            <div class="relative">
              <img class="block w-8 h-8" :src="logo(row)" alt="" />
              <div v-if="row._light" class="absolute top-0 right-0 w-2 h-2 bg-red rounded-full"></div>
            </div>
            <div>
              <div class="version">{{ row.coreType === 'Firefox' ? 'RoxyFirefox' : 'RoxyChrome' }} {{ row.coreVersion }}</div>
              <div v-if="row._desc" class="mt-0.5 desc">{{ row._desc }}</div>
            </div>
          </div>
          <div class="shrink-0 flex items-center gap-2 pr-4">
            <component :is="row.status === 'downloading' ? Tooltip : 'div'" tooltip-content-class="py-1 px-2">
              <Button severity="secondary" variant="outlined" size="xxs" :class="{ group: row.status === 'downloading' }"
                :disabled="row.status === 'downloaded' || row.status === 'downloading'" @click="install(row)">
                <Icon class="group-hover:hidden" :class="{ 'loading-circle': row.status === 'downloading' }"
                  :name="row.status === 'downloaded' ? 'base/rx_ic_check' : 'base/rx_ic_download'" color="var(--colors-icon-icon-secondary)" />
                <Icon class="hidden group-hover:block" name="base/rx_ic_pause" color="var(--colors-icon-icon-secondary)" />
                <span>{{ row.status === 'downloaded' ? $t('下载完成') : $t('下载') }}</span>
              </Button>
            </component>
            <Button text severity="secondary" size="xxs" icon="base/rx_ic_bin_1"
              :disabled="!['downloaded', 'update'].includes(row.status)" @click="remove($event, row)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
