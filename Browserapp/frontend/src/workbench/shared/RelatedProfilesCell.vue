<script setup>
import { computed } from './workbench-vue.js';
import { t as RelatedInfo } from './related-info-VU3nxvtB.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { n as useProfileLabels } from './useProfileEntityLabels-BfqbVpel.js';

const props = defineProps({ list: Array, showAdd: Boolean, addTooltip: String });
const emit = defineEmits(['add']);
const labels = useProfileLabels();
const tooltip = computed(() => props.addTooltip ?? labels.value.selectEntityTooltip);
</script>

<template>
  <div class="flex items-center gap-1.5 min-h-6">
    <RelatedInfo :list="list" disabled>
      <template #empty><span class="row-hover-empty">--</span></template>
    </RelatedInfo>
    <Button v-if="showAdd" v-tooltip.top="{ value: tooltip, showDelay: 500 }" class="shrink-0 row-hover-action"
      text severity="secondary" size="xxs" icon="base/rx_ic_plus" :aria-label="tooltip" @click.stop="emit('add')" />
  </div>
</template>
