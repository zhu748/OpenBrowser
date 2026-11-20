<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';

defineProps({ title: String, fill: Boolean });
const collapsed = defineModel('collapsed', { type: Boolean, default: false });
</script>

<template>
  <div class="rx-preview-card flex flex-col gap-2.5" :class="{ 'is-fill': fill, 'is-collapsed': collapsed }">
    <slot v-if="!collapsed" name="before" />
    <div class="rx-preview-card__panel flex flex-col items-start justify-start gap-3 overflow-hidden rounded-xl pa-4"
      :class="{ 'min-h-0 flex-1': !collapsed }">
      <div class="rx-preview-card__header flex flex-row-reverse items-center justify-between self-stretch select-none">
        <Icon v-tooltip="$t(collapsed ? '展开' : '收起')" class="shrink-0 cursor-pointer"
          :name="collapsed ? 'base/rx_ic_show_preview' : 'base/rx_ic_hide_preview'" color="var(--colors-icon-primary)"
          @click="collapsed = !collapsed" />
        <div v-if="!collapsed"><slot name="title">{{ title }}</slot></div>
      </div>
      <template v-if="!collapsed">
        <div v-if="$slots.banner" class="w-full shrink-0"><slot name="banner" /></div>
        <div class="rx-preview-card__infos w-full">
          <div class="rx-preview-card__list">
            <slot />
            <div class="h-6 w-full invisible"></div>
          </div>
        </div>
        <div v-if="$slots.footer" class="w-full shrink-0"><slot name="footer" /></div>
      </template>
    </div>
  </div>
</template>
