<script setup>
import { reactive, toRef, useId, useTemplateRef } from './workbench-vue.js';
import { V as stringSchema, dt as objectSchema } from './types-Cxql15JH.js';
import { t as validation } from './external-CdTk2m9u.js';
import { r as Form, t as schemaResolver } from './zod-CkMKsh1h.js';
import { provideForm } from './workbench-form-providers.js';
import FormItem from './workbench-form-item.js';

const props = defineProps({
  id: {}, position: { default: 'top' }, labelProps: {}, inputs: { type: Array, default: () => [] },
});
const formId = useId();
const emit = defineEmits(['submit']);
const instance = useTemplateRef('tsform');
function getFieldState(name) { return instance.value?.getFieldState(name); }
function setFieldValue(name, value) { instance.value?.setFieldValue(name, value); }
function setValues(values) { instance.value?.setValues(values); }
provideForm({ setValues, setFieldValue, getFieldState, position: toRef(() => props.position), labelProps: toRef(() => props.labelProps) });

function leafFields(inputs) {
  return inputs.flatMap(field => field.items?.length ? leafFields(field.items) : field.name ? [field] : []);
}
const fields = leafFields(props.inputs);
const initialValues = reactive(Object.fromEntries(fields.map(field => [field.name, field.value ?? (field.type === 'number' ? 0 : '')])));
const rules = {};
for (const field of fields) {
  const custom = typeof field.resolver === 'function' && field.resolver(validation);
  if (custom) rules[field.name] = custom;
  else if (field.required) {
    rules[field.name] = stringSchema().refine(Boolean, $t('"{name}" 是必填项', { name: field.label || field.props?.placeholder }));
  }
}
const resolver = schemaResolver(objectSchema(rules));
function values(states) {
  return Object.fromEntries(Object.entries(states ?? {}).map(([name, state]) => [name, state.value]));
}
function submit(event) {
  if (event.valid) emit('submit', values(event.states));
}
function setInputsProps(patches) {
  for (const field of leafFields(props.inputs)) {
    if (!Object.hasOwn(patches, field.name)) continue;
    const { value, label, ...attributes } = patches[field.name] ?? {};
    if (label !== undefined) field.label = label;
    if (Object.keys(attributes).length) field.props = { ...field.props, ...attributes };
    if (value !== undefined) {
      initialValues[field.name] = value;
      setFieldValue(field.name, value);
    }
  }
}
defineExpose({
  instance, setInputsProps, getFieldState, setValues, getValues: () => values(instance.value?.states),
  reset: () => instance.value?.reset(), submit: () => instance.value?.submit(), validateField: name => instance.value?.validate(name),
});
</script>

<template>
  <Form :id="id ?? formId" ref="tsform" :initial-values="initialValues" :resolver="resolver"
    class="flex flex-col gap-4 self-stretch" @submit="submit">
    <slot :inputs="inputs" :position="position" :label-props="labelProps">
      <FormItem v-for="(input, index) in inputs" :key="input.name ?? index" :input="input" />
    </slot>
  </Form>
</template>
