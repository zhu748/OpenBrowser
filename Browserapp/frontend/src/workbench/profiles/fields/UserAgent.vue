<script setup>
import { computed, nextTick, ref } from 'vue';
import { a as findUaPolicyField } from './utils-BIWenCnY.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { n as IconField } from './inputicon-Bn1KerIx.js';
import { t as Textarea } from './rx-input-textarea-BWwP6OaO.js';

const props = defineProps({ input: { type: Object, required: true }, inputsGroup: { type: Array, default: () => [] } });
const expanded = ref(false);
const textarea = ref(null);
const controls = ref(null);
const trimmedValue = computed(() => typeof props.input.value === 'string' ? props.input.value.trim() : '');
const fixedByKernel = computed(() => findUaPolicyField(props.inputsGroup[0] ?? [], 'coreType')?.value?.value === 'Firefox');

function change() {
  if (props.input.invalid) props.input.invalid = false;
  props.input.change?.(props.input, props.inputsGroup);
}
function blur(event) {
  if (!event.relatedTarget || !controls.value?.contains(event.relatedTarget)) expanded.value = false;
}
async function open() {
  expanded.value = true;
  await nextTick();
  textarea.value?.$el?.querySelector('textarea')?.focus();
}
async function shuffle() {
  try {
    await props.input.iconClick?.(props.input, props.inputsGroup);
  } catch {
    return;
  }
  await open();
}
</script>

<template>
  <div class="user-agent-field flex min-w-0 w-full">
    <div class="mr-2 shrink-0 tt-primary text-3.25 leading-32px rx-label">{{ input.label }}</div>
    <div ref="controls" class="ua-control-row flex min-w-0 flex-1 items-start gap-2">
      <div class="ua-field-slot min-w-0 flex-1 overflow-hidden">
        <Textarea v-if="expanded" ref="textarea" v-model="input.value" class="min-w-0 max-w-full" v-bind="input" @blur="blur" @change="change" />
        <IconField v-else class="ua-collapsed-iconfield min-w-0 w-full max-w-full" :pt="{ root: 'sm' }">
          <button type="button" class="ua-collapsed-trigger cursor-text text-left transition-[box-shadow]" @click="open">
            <span class="ua-collapsed-text block min-w-0 max-w-full truncate font-[Inter] text-3 leading-5"
              :class="{ 'ua-collapsed-trigger--empty': !trimmedValue }">{{ trimmedValue || '\u00a0' }}</span>
          </button>
        </IconField>
      </div>
      <Button severity="secondary" variant="outlined" icon="base/rx_ic_shuffle" :label="$t('随机')" class="shrink-0"
        :disabled="fixedByKernel" :title="fixedByKernel ? input.randomHelp : undefined" @click="shuffle" />
    </div>
  </div>
</template>
