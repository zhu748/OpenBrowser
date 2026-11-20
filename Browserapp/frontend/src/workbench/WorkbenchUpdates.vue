<script setup>
import { computed, onMounted, ref, useTemplateRef } from './workbench-vue.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as OverlayBadge } from './overlaybadge-B-go4u-h.js';
import { a as Tabs, i as TabPanels, n as TabList, r as TabPanel, t as Tab } from './tab-6bJNMvq4.js';
import { r as Popover } from './contextmenu-BBjizTDn.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import ClientUpdatePanel from './workbench-client-update-panel.js';
import KernelUpdatePanel from './workbench-kernel-update-panel.js';

const props = defineProps({ clientOnly: Boolean });
const current = ref(props.clientOnly ? 'client' : 'kernel');
const kernels = ref([]);
const changes = computed(() => kernels.value.flatMap(group => group.list).filter(row => row.status === 'update').length);
const popover = useTemplateRef('popover');
const [, report] = useFeedback();
async function load() {
  try {
    const installed = await globalThis.__localRequest('kernels:list');
    kernels.value = [{
      title: $t('内核列表'),
      list: installed.map(row => ({
        coreType: row.engine === 'firefox' ? 'Firefox' : 'Chrome',
        coreVersion: String(row.version).split('.')[0], status: 'downloaded',
        _light: false, _desc: row.version, _engine: row.engine, _version: row.version, primary: row.primary,
      })),
    }];
  } catch (error) {
    report(-1, error.message);
  }
}
async function toggle(event) {
  const target = event.currentTarget;
  await load();
  popover.value?.instance?.toggle(event, target);
}
onMounted(load);
</script>

<template>
  <div v-tooltip.left="{ value: $t('更新'), showDelay: 600 }" class="flex justify-center" data-force-upgrade="false">
    <OverlayBadge :value="changes" severity="danger" size="small" :class="{ 'no-message': !changes }">
      <Button :aria-label="$t('更新')" severity="secondary" outlined size="xs" @click="toggle">
        <template #icon><Icon name="base/rx_ic_upgrade" size="17" color="var(--colors-icon-icon-secondary)" /></template>
      </Button>
    </OverlayBadge>
    <Popover ref="popover" class="_content_15zc5_1">
      <div class="header"><div class="title">{{ $t('更新') }}</div></div>
      <Tabs v-model:value="current">
        <TabList v-if="!clientOnly" :pt="{ tablist: 'px-4 gap-4 h-[40px] !border-[var(--colors-border-border-subtle)]', activeBar: '!h-[2px]' }">
          <Tab value="client" class="flex flex-1 justify-center items-center gap-1.5">{{ $t('客户端升级') + ' ' }}</Tab>
          <Tab value="kernel" class="flex flex-1 justify-center items-center gap-1.5">{{ $t('内核升级') + ' ' }}</Tab>
        </TabList>
        <TabPanels class="!pa-0 min-h-25 max-h-90 overflow-auto">
          <TabPanel value="client" class="overflow-hidden"><ClientUpdatePanel /></TabPanel>
          <TabPanel v-if="!clientOnly" value="kernel" class="overflow-hidden">
            <KernelUpdatePanel :upgrade-list="kernels" @on-download-click="load" />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Popover>
  </div>
</template>
