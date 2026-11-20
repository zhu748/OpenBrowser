<script setup>
import { computed } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Checkbox } from './rx-checkbox-BrC0MzoD.js';
import { t as RadioButton } from './radiobutton-B3i1EP5M.js';

const props = defineProps({ item: Object, type: String, field: String });
const model = defineModel();
const value = computed(() => props.item[props.field ?? 'name']);
</script>

<template>
  <a class="max-w-80 !pa-0">
    <label class="flex items-center py-2 pl-2.5 pr-2.5 gap-2 cursor-pointer w-full" :for="value">
      <RadioButton v-if="type === 'single'" v-model="model" name="radio" :input-id="value" :value="value" />
      <Checkbox v-if="type === 'multiple'" v-model="model" name="checkbox" :input-id="value" :value="value" />
      <slot>
        <Icon v-if="item.icon" :name="item.icon" />
        <span class="ellipsis-1 text-3.25" :title="item.label">{{ item.label }}</span>
      </slot>
    </label>
  </a>
</template>
