<script setup>
import { computed, unref } from './workbench-vue.js';
import { t as Divider } from './rx-divider-Ci3C58Q3.js';
import { useForm } from './workbench-form-providers.js';
import FieldLabel from './workbench-form-label.js';
import FormField from './workbench-form-field.js';

const props = defineProps({ input: { type: Object, required: true } });
const form = useForm();
const heights = { xxs: 24, xs: 28, sm: 32, md: 36, lg: 40 };
const position = computed(() => props.input.labelPosition ?? unref(form?.position) ?? 'top');
const labels = computed(() => ({ ...unref(form?.labelProps), ...props.input.labelProps }));
const hasLabel = computed(() => Boolean(props.input.labelRender || props.input.label));
const labelStyle = computed(() => {
  const { class: labelClass, width, style, ...other } = labels.value;
  if (position.value !== 'left') return { ...style, ...other };
  const { input } = props;
  const firstSize = input.type === 'group' && input.items?.find(item => item?.props?.size)?.props.size;
  const height = heights[firstSize || input.props?.size] ?? heights.sm;
  return {
    '--form-label-padding-top': (height - 20) / 2 + 'px', ...style, ...other,
    ...(width && { '--form-label-width': width }),
  };
});
</script>

<template>
  <Divider v-if="input.separator" line-only v-bind="input.separatorProps" />
  <div v-else class="item" :class="position === 'left' ? 'item--left' : 'item--top'">
    <div v-if="hasLabel" class="item__label" :class="labels.class" :style="labelStyle">
      <component :is="input.labelRender" v-if="input.labelRender" />
      <FieldLabel v-else :label="input.label" :tooltip="input.tooltip" :required="input.required" />
    </div>
    <div class="item__content" :class="{ 'item__content--full': !hasLabel }">
      <div v-if="input.type === 'group'" class="flex items-start _content_p6yjw_1">
        <FormField v-for="field in input.items" :key="field.name" :class="field.itemClass" :input="field" />
      </div>
      <FormField v-else :input="input" />
    </div>
  </div>
</template>
