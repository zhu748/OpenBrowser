<script setup>
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
defineProps({ remark: {}, extend: Boolean });
</script>

<template>
  <div class="inline-flex items-center gap-1 shrink-0" :class="{ 'note-light': remark }">
    <Button v-tooltip.top="{ value: remark, showDelay: 0 }" class="shrink-0" text severity="secondary" size="xxs"
      :icon="remark ? 'base/rx_ic_doc_fill' : 'base/rx_ic_doc_add'" />
    <div v-if="extend" :title="remark" class="whitespace-pre-wrap note-content">{{ remark }}</div>
  </div>
</template>
