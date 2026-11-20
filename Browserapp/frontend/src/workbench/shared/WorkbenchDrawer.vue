<script setup>
import { computed } from './workbench-vue.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { DrawerHost } from './useProxyFormDrawer-r-7UykRS.js';

const props = defineProps({ title: String, position: { type: String, default: 'right' }, pt: Object });
const parts = computed(() => ({
  mask: 'pa-3', root: 'overflow-hidden rounded-2 border-0.5 !w-auto max-w-full', ...props.pt,
}));
</script>

<template>
  <DrawerHost :position="position" :pt="parts">
    <template #container="{ closeCallback }">
      <div class="flex flex-col h-full min-h-0 overflow-hidden">
        <slot name="header" :close-callback="closeCallback">
          <div class="flex justify-between items-center self-stretch gap-3 py-2 pl-4 pr-3 shrink-0 _header_12u5y_1">
            <div class="tt-primary text-3.5 font-600 leading-4.5">{{ title }}</div>
            <Button text severity="secondary" size="xxs" icon="base/rx_ic_delete" :aria-label="$t('关闭')" @click="closeCallback" />
          </div>
        </slot>
        <div class="flex-1 min-h-0 overflow-hidden"><slot name="container" /></div>
      </div>
    </template>
  </DrawerHost>
</template>
