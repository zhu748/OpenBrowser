<script setup>
import { computed, createTextVNode, onMounted, watch, useId } from './workbench-vue.js';
import { an as toHandlerKey, j as isVNode } from './runtime-core.esm-bundler-CBj16o9G.js';
import { t as InputText } from './inputtext-Crzvb5jQ.js';
import { t as RadioButton } from './radiobutton-B3i1EP5M.js';
import { t as Select } from './select-Cc8zLK4m.js';
import { t as MultiSelect } from './multiselect-DS9bwX-7.js';
import { t as Password } from './password-CRxCSpUp.js';
import { t as Textarea } from './textarea-DvuriTzI.js';
import { t as Message } from './message-SBZQdXpt.js';
import RxRadioButton from './workbench-schema-radio.js';
import { issues, useSchemaFormContext } from './workbench-schema-form-state.js';

const props = defineProps({
  schema: { type: Object, required: true },
  validationSchema: { type: Object, required: true },
});
const model = defineModel();
const errors = defineModel('errors', { type: Object, default: () => ({}) });
const { formProps, formState: { formModel } } = useSchemaFormContext();
const id = useId();
const inputId = computed(() => props.schema.field + '-' + id);
const field = computed(() => props.schema.field);
const widgets = { InputText, Password, RadioButton, Select, Textarea, RxRadioButton, MultiSelect };
const fieldContext = computed(() => ({ field: field.value, formModel, schema: props.schema }));

function resolveWidget(render, context = fieldContext.value) {
  if (typeof render === 'string') return createTextVNode(render);
  if (isVNode(render)) return render;
  if (typeof render === 'function') return resolveWidget(render(context));
  if (!render || typeof render !== 'object') return render;
  const keys = Object.keys(render);
  if (keys.some(key => key.startsWith('_') || key === 'setup' || key === 'render')) return render;
  return Object.fromEntries(keys.map(key => [key, (...args) => resolveWidget(render[key], ...args)]));
}

const widget = computed(() => widgets[props.schema.component] ?? resolveWidget(props.schema.component));
const label = computed(() => typeof props.schema.label === 'function' ? props.schema.label : () => props.schema.label);
const error = computed(() => errors.value[field.value]);
const options = computed(() => ({
  inputClass: 'w-full', invalid: !!error.value,
  ...(typeof props.schema.componentProps === 'function' ? props.schema.componentProps(fieldContext.value) : props.schema.componentProps),
}));
const placeholder = computed(() => typeof options.value.placeholder === 'function' ? options.value.placeholder() : options.value.placeholder);
const events = computed(() => ({ [toHandlerKey(props.schema.rule?.trigger || 'change')]: validate }));
const styles = computed(() => ({
  '--v6503a4a1': formProps.layout === 'horizontal' && formProps.labelAlign === 'right' ? 'flex-end' : '',
  '--v76281784': formProps.labelWidth,
}));

function validate() {
  if (!props.validationSchema.shape?.[field.value]) return;
  const result = props.validationSchema.pick({ [field.value]: true }).safeParse({ [field.value]: model.value });
  errors.value[field.value] = result.success ? '' : issues(result.error)[0]?.message ?? '';
}

watch(model, validate);
onMounted(async () => {
  const settings = props.schema.componentProps;
  if (settings?.request) settings.options = await settings.request();
});
</script>

<template>
  <div class="field" :style="styles">
    <slot :name="'before-field-' + field" />
    <div class="form-item-row" :class="formProps.layout">
      <label v-if="schema.label" :for="inputId" :class="{ colon: formProps.colon }"><component :is="label" /></label>
      <div class="form-item-control">
        <component :is="widget" v-model="model" v-bind="{ ...options, ...events }" :id="inputId"
          :placeholder="placeholder" class="w-full" :class="{ 'p-invalid': error }" />
        <Message v-if="error || !schema.label" severity="error" size="small" variant="simple" class="error-message">{{ error }}</Message>
        <component v-if="schema.description" :is="schema.description" />
      </div>
    </div>
    <slot :name="'after-field-' + field" />
  </div>
</template>
