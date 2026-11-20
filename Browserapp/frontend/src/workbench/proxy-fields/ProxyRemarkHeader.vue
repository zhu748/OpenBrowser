<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as useRemarks } from './useRemarkDisplay-C7h7k7ja.js';
defineProps({ column: { type: Object, required: true } });
const { toggleRemarkDisplayStatus } = useRemarks();
</script>

<template>
  <div class="flex items-center gap-2 text-3 font-600 leading-4 text-[var(--colors-text-text-primary)]">
    <span>{{ column.title }}</span>
    <Icon v-tooltip.top="{ value: column._cache.extend ? $t('收起') : $t('展开'), showDelay: 0 }"
      class="cursor-pointer color-[#989CA0]" :name="column._cache.extend ? 'base/rx_ic_hidden' : 'base/rx_ic_eye'"
      @click.stop="toggleRemarkDisplayStatus(column._cache)" />
  </div>
</template>
