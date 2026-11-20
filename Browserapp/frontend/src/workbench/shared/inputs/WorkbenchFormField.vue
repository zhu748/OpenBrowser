<script setup>
import { n as FormField } from './zod-CkMKsh1h.js';
import { t as Message } from './message-SBZQdXpt.js';
import { t as TextInput } from './m-input-text-JVbCgVJP.js';
import { t as NumberInput } from './m-input-number-BOH1hUUB.js';
import { t as PasswordInput } from './m-input-password-IOnajQ90.js';
import { t as TextareaInput } from './m-input-textarea-33WQDaSq.js';
import { t as SelectInput } from './m-input-select-C8pih1gY.js';
import { t as MultiSelectInput } from './m-input-multi-select-B7lX5Cnm.js';
import { t as DateInput } from './m-input-date-picker-CPwsZFnI.js';
import FormRadioInput from './workbench-form-radio.js';
import CascadeInput from './workbench-cascade-input.js';
import CustomFormField from './workbench-custom-form-field.js';

defineProps({ input: { type: Object, required: true } });
const inputs = {
  text: TextInput, number: NumberInput, password: PasswordInput, textarea: TextareaInput,
  select: SelectInput, mselect: MultiSelectInput, cascade: CascadeInput, date: DateInput, radio: FormRadioInput,
};
</script>

<template>
  <FormField v-slot="field" class="flex flex-col gap-1" :name="input.name">
    <CustomFormField v-if="input.render" :field="field" :input="input" />
    <component :is="inputs[input.type] ?? TextInput" v-else v-bind="input.props">
      <template v-for="(renderSlot, name) in input.slots ?? {}" #[name]="scope">
        <component :is="renderSlot(scope)" />
      </template>
    </component>
    <component :is="input.afterRender" v-if="input.afterRender" :field="field" :input="input" />
    <Message v-if="field?.invalid" severity="error" size="small" variant="simple">{{ field.error?.message }}</Message>
  </FormField>
</template>
