<script setup>
import { computed } from './workbench-vue.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import SchemaField from './workbench-schema-field.js';
import { useSchemaForm } from './workbench-schema-form-state.js';

const props = defineProps({
  modelValue: Object,
  schemas: { type: Array, required: true },
  initialValues: { type: Object, default: () => ({}) },
  layout: { type: String, default: 'horizontal' },
  colon: { type: Boolean, default: true },
  labelWidth: { type: String, default: '110px' },
  labelAlign: { type: String, default: 'right' },
  footer: { type: Boolean, default: true },
});
const emit = defineEmits(['update:modelValue', 'reset', 'submit']);
const form = useSchemaForm(props, emit);
const { formModel, validationSchema, errors, innerFormSchemas, handleSubmit, resetFields } = form;
const visibleSchemas = computed(() => innerFormSchemas.value.filter(schema => !schema.vIf || schema.vIf({ formModel })));
defineExpose(form);
</script>

<template>
  <form class="rx-form" :style="{ '--e03bf8ca': labelWidth }" @submit="handleSubmit($event).catch(() => {})">
    <SchemaField v-for="schema in visibleSchemas" :key="schema.field" v-model="formModel[schema.field]"
      v-model:errors="errors" :schema="schema" :validation-schema="validationSchema">
      <template v-for="(_, name) in $slots" #[name]><slot :name="name" /></template>
    </SchemaField>
    <div v-if="footer" class="footer">
      <slot name="footer">
        <div class="label"></div>
        <div class="buttons">
          <Button label="Submit" type="submit" />
          <Button label="Reset" type="button" class="p-button-secondary" @click="resetFields" />
        </div>
      </slot>
    </div>
  </form>
</template>
