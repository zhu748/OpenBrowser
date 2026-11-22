<script setup>
import { computed, getCurrentInstance } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { ProfileInputItem, PasswordField } from './useAsyncGate-D7VA7DLY.js';
const props = defineProps({ inputs: { type: Array, default: () => [] }, labelPosition: { type: String, default: 'top' } });
const fields = computed(() => props.inputs.map((field, index) => ({ field, index })).filter(({ field }) => field.visible !== false));
const formId = getCurrentInstance()?.uid;
function change(field) {
  if (field.invalid) field.invalid = false;
  field.change?.(field, props.inputs);
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent>
    <slot v-for="{ field, index } in fields" :key="[formId, field.name ?? '', index].join('_')" :name="field.slot"
      :input="field" :label-position="labelPosition">
      <div v-if="field.separator" class="w-full flex items-center gap-1.5">
        <Icon v-if="field.separatorIcon" v-bind="field.separatorIcon" class="shrink-0" size="16" />
        <div v-if="field.separatorTitle" class="shrink-0 separator-title">{{ field.separatorTitle }}</div>
        <div class="flex-1 separator-line"></div>
      </div>
      <PasswordField v-else-if="field.type === 'password'" v-model="field.value" v-bind="field" :label-position="labelPosition"
        @icon-click="field.iconClick?.(field, inputs)" @change="change(field)" />
      <ProfileInputItem v-else v-bind="field" v-model="field.value" :label-position="labelPosition"
        @change="change(field)" @icon-click="field.iconClick?.(field, inputs)" />
    </slot>
  </form>
</template>
