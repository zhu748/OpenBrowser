<script setup>
import { computed } from './workbench-vue.js';
import { n as useTheme } from './theme-mq6SsndU.js';
import { emptyIllustration } from './workbench-empty-illustrations.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({ title: {}, icon: {}, desc: {}, center: Boolean });
const theme = useTheme();
const image = computed(() => emptyIllustration(props.icon, theme.realTheme !== 'light'));
</script>

<template>
  <div class="flex justify-center items-center w-full" v-bind="$attrs">
    <div class="empty-content" :class="{ 'is-center': center }">
      <img v-if="image" class="empty-img" :src="image" alt="" />
      <div class="empty-info" :class="{ 'pl-5': icon && !center, 'is-center': center }">
        <div v-if="title" class="empty-info-title">{{ title }}</div>
        <slot name="desc"><div v-if="desc" class="empty-info-desc"><div v-html="desc"></div></div></slot>
        <slot name="extra" />
      </div>
    </div>
  </div>
</template>
