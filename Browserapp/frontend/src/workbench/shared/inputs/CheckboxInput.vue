<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Checkbox } from './checkbox-DozTKB5Z.js';
defineOptions({ inheritAttrs: false });
defineProps({ size: { default: 'sm' }, iconClass: {} });
</script>

<template>
  <Checkbox v-bind="$attrs">
    <template #icon="parts">
      <slot name="icon" v-bind="parts">
        <Icon v-if="parts.checked" :class="iconClass" name="base/rx_ic_checkmark" color="#ffffff" />
      </slot>
    </template>
  </Checkbox>
</template>
