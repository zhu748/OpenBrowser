<script setup>
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Checkbox } from './rx-checkbox-BrC0MzoD.js';
import { i as RadioGroup } from './form-BQBA_XzO.js';
defineProps({ filter: { type: Object, required: true } });
const emit = defineEmits(['apply']);
</script>

<template>
  <div class="proxy-filter-drawer flex flex-col h-full min-w-120">
    <div class="proxy-filter-drawer__body flex-1 overflow-y-auto">
      <div v-for="group in filter.filterGroups" :key="group.key" class="proxy-filter-drawer__group">
        <div class="proxy-filter-drawer__group-label">{{ group.label }}</div>
        <div v-if="group.multiple" class="proxy-filter-drawer__checkbox-group md">
          <label v-for="option in group.options" :key="option.value" :for="group.key + '_' + option.value"
            class="proxy-filter-drawer__checkbox-item" :class="{ 'is-checked': filter.isDraftOptionSelected(group.key, option.value) }">
            <Checkbox icon-class="font-500 !size-4" :input-id="group.key + '_' + option.value" :name="group.key"
              binary :model-value="filter.isDraftOptionSelected(group.key, option.value)"
              @update:model-value="filter.toggleDraftFieldOption(group.key, option.value)" />
            <div class="proxy-filter-drawer__checkbox-text">{{ option.label }}</div>
          </label>
        </div>
        <RadioGroup v-else :model-value="filter.draft.value[group.key]" :name="group.key" size="md" :options="group.options"
          @update:model-value="filter.updateDraftField(group.key, $event)" />
      </div>
    </div>
    <div class="proxy-filter-drawer__footer flex items-center justify-between gap-3 shrink-0">
      <Button size="sm" variant="outlined" severity="secondary" :label="$t('重置')" @click="filter.resetDraft()" />
      <Button size="sm" :label="$t('应用筛选')" @click="emit('apply')" />
    </div>
  </div>
</template>
