<script setup>
import { useForm } from './workbench-form-providers.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({ field: Object, input: Object });
const form = useForm();
function update(value) { form.setFieldValue(props.input.name, value); }
function updateMany(values) { form.setValues(values); }
</script>

<template>
  <input :value="field.value" type="hidden" />
  <component :is="input.render" :name="input.name" v-bind="{ ...input.props, ...$attrs }"
    @update="update" @updates="updateMany" />
</template>
