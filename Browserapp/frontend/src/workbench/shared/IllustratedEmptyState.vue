<script setup>
import { computed } from './workbench-vue.js';
import { n as useTheme } from './theme-mq6SsndU.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { emptyIllustration } from './workbench-empty-illustrations.js';

const props = defineProps({ icon: {}, title: {}, desc: {}, img: {} });
const theme = useTheme();
const image = computed(() => emptyIllustration(props.img, theme.realTheme !== 'light'));
</script>

<template>
  <div class="w-full flex justify-center items-center text-left">
    <div class="flex items-center w-192 h-95.5 pl-8 gap-8 rounded-xl overflow-hidden select-none content">
      <div class="flex flex-col w-83.5 gap-4">
        <slot name="icon"><Icon v-if="icon" :name="icon" size="24" color="var(--colors-icon-icon-primary)" /></slot>
        <div v-if="title" class="title">{{ title }}</div>
        <div v-if="$slots.desc || desc" class="desc"><slot name="desc">{{ desc }}</slot></div>
        <slot name="extra" />
      </div>
      <div class="h-full flex-1 pt-11 overflow-hidden">
        <slot name="img"><img v-if="image" class="pointer-events-none h-87.5" :src="image" alt="" /></slot>
      </div>
    </div>
  </div>
</template>
