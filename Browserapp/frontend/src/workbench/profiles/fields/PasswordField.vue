<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Label } from './input-label-qeCNGFwS.js';
import { n as IconField, t as InputIcon } from './inputicon-Bn1KerIx.js';
import { t as Password } from './password-CRxCSpUp.js';
import { t as Textarea } from './textarea-DvuriTzI.js';
import { t as Text } from './inputtext-Crzvb5jQ.js';
import { t as NumberField } from './inputnumber-BD6BwCgc.js';

defineOptions({ inheritAttrs: false });
defineProps({ name: String, type: { type: String, default: 'text' }, labelPosition: { type: String, default: 'top' }, icon: String, leftIcon: String });
const emit = defineEmits(['iconClick', 'change']);
</script>

<template>
  <div class="rx-input" :class="{ 'rx-label-left': labelPosition === 'left' }">
    <slot>
      <slot name="label"><Label :name="name" v-bind="$attrs" /></slot>
      <div class="flex-1">
        <Password v-if="type === 'password'" :id="name" class="w-full" :feedback="false" toggle-mask v-bind="$attrs" @input="emit('change')" />
        <IconField v-else class="w-full">
          <InputIcon v-if="leftIcon"><Icon :name="leftIcon" class="rx-icon cursor-pointer" @click="emit('iconClick')" /></InputIcon>
          <Textarea v-if="type === 'textarea'" :id="name" class="w-full" rows="5" cols="30" auto-resize v-bind="$attrs" @input="emit('change')" />
          <Text v-if="type === 'text'" :id="name" class="w-full" v-bind="$attrs" @input="emit('change')" />
          <NumberField v-if="type === 'number'" :id="name" class="w-full" v-bind="$attrs" @input="emit('change')" />
          <InputIcon v-if="icon" :class="{ 'textarea-icon': type === 'textarea' }"><Icon :name="icon" class="rx-icon cursor-pointer" @click="emit('iconClick')" /></InputIcon>
        </IconField>
        <small v-if="$attrs.invalid" class="rx-input-help">{{ $attrs.errorMsg || $attrs.placeholder }}</small>
        <small v-if="$attrs.help" class="rx-input-help">{{ $attrs.help }}</small>
      </div>
    </slot>
  </div>
</template>
