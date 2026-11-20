<script setup>
import { nextTick, useTemplateRef } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { a as Tabs, i as TabPanels, n as TabList, r as TabPanel, t as Tab } from './tab-6bJNMvq4.js';

defineProps({ tabs: { type: Array, default: () => [] }, onlyTabs: Boolean, headTabs: Boolean });
const list = useTemplateRef('list');
defineExpose({ updateInkBar: () => nextTick(() => list.value?.updateInkBar()) });
function panelData({ slot, render, panelProps, ...data }) { return data; }
</script>

<template>
  <Tabs :class="{ 'head-tabs': headTabs }">
    <template #default>
    <slot name="tablist">
      <TabList ref="list" :pt="{ tablist: 'px-6 py-0 gap-4' }">
        <Tab v-for="tab in tabs" :key="tab.title" :value="tab.value">
          <slot name="tab" :data="tab">
            <div class="flex items-center justify-center gap-1.5">
              <Icon v-if="tab.icon" :name="tab.icon" :size="16" />
              <img v-if="tab.image" class="w-4 object-contain" :src="tab.image" alt="" />
              <span>{{ tab.title }}</span>
            </div>
          </slot>
        </Tab>
      </TabList>
    </slot>
    <slot v-if="!onlyTabs" name="tabpanels">
      <TabPanels class="flex flex-1 !pa-0 overflow-hidden">
        <TabPanel v-for="tab in tabs" :key="tab.title" class="flex flex-1 overflow-hidden" :value="tab.value" v-bind="tab.panelProps">
          <slot :name="tab.slot || 'content'" :tab="panelData(tab)">
            <component :is="tab.render" v-if="tab.render" />
            <template v-else>{{ tab.content }}</template>
          </slot>
        </TabPanel>
      </TabPanels>
    </slot>
    </template>
    <template v-for="name in Object.keys($slots).filter(key => key !== 'tablist' && key !== 'tabpanels')" #[name]="scope">
      <slot :name="name" v-bind="scope ?? {}" />
    </template>
  </Tabs>
</template>
