<script setup>
import { computed, useTemplateRef } from './workbench-vue.js';
import { yr as sortIcon } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { n as Draggable, r as Popover } from './contextmenu-BBjizTDn.js';
import { t as Toggle } from './rx-toggle-switch-BI8eb18U.js';

const props = defineProps({ size: { type: String, default: 'xxs' } });
const columns = defineModel('columns', { type: Array, default: () => [] });
const sortField = defineModel('sortField');
const sortOrder = defineModel('sortOrder');
const popover = useTemplateRef('popover');
const hiddenSort = computed(() => sortField.value && !columns.value.find(column => column.key === sortField.value)?._visible);
</script>
<template>
  <slot name="before" />
  <div class="position-relative flex">
    <Button v-tooltip.top="$t('自定义排版')" severity="secondary" :size="props.size" outlined icon="base/rx_ic_slider_v"
      @click="popover?.instance?.toggle($event)" />
    <div v-if="hiddenSort" class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 size-8px rounded-full bg-[var(--colors-background-bg-brand)]"></div>
  </div>
  <Popover ref="popover">
    <div class="_content_5less_1">
      <Draggable v-model="columns" :animation="150" handle=".handle">
        <div v-for="column in columns" :key="column.key" class="flex items-center _column_5less_9">
          <Icon name="base/rx_ic_dots_drag" class="cursor-grab handle" />
          <span class="flex-auto _label_5less_5" :class="{ 'color-[var(--colors-text-text-brand)]': sortField === column.key }">
            {{ column.title }}
            <Icon v-if="sortField === column.key" :name="sortIcon(sortOrder)" size="12px" color="var(--colors-icon-icon-note)" />
          </span>
          <Toggle v-if="!column.disabledToggle" v-model="column._visible" />
        </div>
      </Draggable>
    </div>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </Popover>
</template>
