<script setup>
import { computed } from './workbench-vue.js';
import { t as Avatar } from './rx-avatar-h90aIpxl.js';
import { t as Tag } from './rx-tag-BIY_xUFU.js';
import { i as isMemberLabel, t as useLabels } from './use-tag-menu-DZnIrtE9.js';
import TagColorDot from './workbench-tag-color-dot.js';

const props = defineProps({ labels: Array, projectId: {}, disabled: Boolean, genTag: { type: Boolean, default: true } });
const emit = defineEmits(['update']);
const { openMenu } = useLabels({
  labels: () => props.labels, projectId: () => props.projectId, disabled: () => props.disabled, genTag: () => props.genTag,
  onUpdate: value => emit('update', value),
});
const people = computed(() => (props.labels ?? []).filter(label => isMemberLabel(label.labelId))
  .map(label => ({ ...label, color: label.labelColor, name: label.labelName, tooltip: label.labelName })));
const tags = computed(() => (props.labels ?? []).filter(label => !isMemberLabel(label.labelId)));
defineExpose({ openMenu });
</script>

<template>
  <div class="flex items-center gap-2">
    <Tag v-if="!labels?.length" class="cursor-pointer !rounded-full" icon="base/rx_ic_tag" @click.stop="openMenu" />
    <template v-else>
      <Avatar v-if="people.length" class="cursor-pointer" :list="people" :size="24" :font-size="12" :max="3" @click.stop="openMenu" />
      <div v-for="tag in tags" :key="tag.labelId" class="flex items-center select-none"
        :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'" :title="tag.labelName" @click.stop="openMenu">
        <div class="label pointer-events-none"><TagColorDot class="shrink-0" :color="tag.labelColor" /><div class="ellipsis-1">{{ tag.labelName }}</div></div>
      </div>
    </template>
  </div>
</template>
