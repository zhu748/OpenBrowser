<script setup>
import { ref, watch } from './workbench-vue.js';
import { h as api } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { a as profileNamePrefix } from './utils-CnUy4XUk.js';
import { t as Inplace } from './inplace-DdcGL3G8.js';
import { t as InputText } from './inputtext-Crzvb5jQ.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as vFocustrap } from './focustrap-DJJkEqE8.js';

const props = defineProps({ data: { type: Object, required: true }, disabled: Boolean, readonly: Boolean });
defineEmits(['refresh']);
const [, showFeedback] = useFeedback();
const name = ref(props.data.windowName);
const prefix = profileNamePrefix();
let revision = 0;
watch(() => props.data.windowName, value => { name.value = value; });

async function save(close) {
  const row = props.data;
  const previousName = row.windowName;
  const nextName = String(name.value ?? '').trim();
  if (previousName === nextName) {
    name.value = previousName;
    close();
    return;
  }
  const request = ++revision;
  row.windowName = nextName;
  close();
  try {
    const { code, msg } = await api.window.userMdfWindowInfoSingleV2Create({ id: row.id, windowName: nextName });
    showFeedback(code, msg);
    if (code === 0) return;
  } catch (error) {
    showFeedback(-1, error.message);
  }
  if (revision === request && row.windowName === nextName) row.windowName = previousName;
}
function onFocus() {
  if (name.value?.startsWith(prefix)) name.value = '';
}
function stopOrPass(event) {
  if (!props.disabled && !props.readonly) event.stopPropagation();
}
</script>

<template>
  <div>
    <Inplace v-focustrap :disabled="disabled || readonly" @click="stopOrPass">
      <template #display>
        <div v-tooltip.top="{ value: name, showDelay: 300, class: 'profile-name-tooltip' }" class="profile-name-content">{{ name }}</div>
      </template>
      <template #content="{ closeCallback }">
        <InputText v-model="name" autofocus size="small" class="window-name-input"
          @blur="save(closeCallback)" @focus="onFocus" @keydown.enter="save(closeCallback)" />
      </template>
    </Inplace>
  </div>
</template>
