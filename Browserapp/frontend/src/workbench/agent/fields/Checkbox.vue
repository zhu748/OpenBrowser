<script setup>
import { computed, useId } from './workbench-vue.js';
import { t as Checkbox } from './checkbox-DozTKB5Z.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({ label: String, inputId: String, disabled: Boolean });
const checked = defineModel({ type: Boolean, default: false });
const generatedId = 'agent-checkbox-' + useId();
const id = computed(() => props.inputId || generatedId);
</script>

<template>
  <label class="agent-checkbox" :class="{ 'agent-checkbox--disabled': disabled }" :for="id" v-bind="$attrs">
    <Checkbox v-model="checked" class="agent-checkbox__control" binary :input-id="id" :disabled="disabled">
      <template #icon="state">
        <slot name="icon" v-bind="state">
          <Icon v-if="state.checked" :class="state.class" name="roxy-agent/rx-ic-check"
            color="var(--color-text-primary-inverse)" size="12" />
        </slot>
      </template>
    </Checkbox>
    <span v-if="label || $slots.default" class="agent-checkbox__label"><slot>{{ label }}</slot></span>
  </label>
</template>
