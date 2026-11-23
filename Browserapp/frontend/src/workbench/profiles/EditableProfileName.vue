<script setup>
import { ref } from './workbench-vue.js';
import { h as api } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { a as profileNamePrefix } from './utils-CnUy4XUk.js';
import { t as Inplace } from './inplace-DdcGL3G8.js';
import { t as InputText } from './inputtext-Crzvb5jQ.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as vFocustrap } from './focustrap-DJJkEqE8.js';

const props = defineProps({ data: { type: Object, required: true }, disabled: Boolean, readonly: Boolean });
const emit = defineEmits(['refresh']);
const [, showFeedback] = useFeedback();
const draft = ref('');
const saving = ref(false);
const prefix = profileNamePrefix();
let edit;

function startEdit() {
  const { id, windowName } = props.data;
  draft.value = windowName?.startsWith(prefix) ? '' : windowName;
  // The list does not include the revision. Capture it once on activation,
  // never at submit, and keep an asynchronous result scoped to this edit.
  const baseline = api.window.userGetWindowInfoList({ id })
    .then(({ code, data, msg }) => ({ code, msg, rev: data?.rev, name: data?.windowName }))
    .catch(error => ({ error }));
  edit = { id, name: windowName, baseline };
}
function closeEdit() {
  edit = undefined;
}
function showConflict() {
  showFeedback(-1, $t('窗口已在别处更新，请重新编辑名称。'));
  emit('refresh');
}
async function save(close) {
  const current = edit;
  if (!current || saving.value) return;
  closeEdit();
  const nextName = String(draft.value ?? '').trim();
  if (current.name === nextName || props.data.id !== current.id) return close();
  saving.value = true;
  try {
    close();
    const { code: readCode, msg: readMessage, rev, name, error } = await current.baseline;
    if (error) throw error;
    if (readCode !== 0) return showFeedback(readCode, readMessage);
    if (!Number.isSafeInteger(rev) || rev < 0) return showFeedback(-1, $t('操作失败，请刷新后重试'));
    if (current.name !== name) return showConflict();
    const { code, msg } = await api.window.userMdfWindowInfoSingleV2Create({ id: current.id, windowName: nextName, rev });
    // If a refresh supplied a different name during the save, leave it alone.
    if (code === 0 && props.data.id === current.id && props.data.windowName === current.name)
      props.data.windowName = nextName;
    showFeedback(code, msg);
  } catch (error) {
    if (error.code === 'PROFILE_STALE_REV') showConflict();
    else showFeedback(-1, error.message);
  } finally {
    saving.value = false;
  }
}
function stopOrPass(event) {
  if (!props.disabled && !props.readonly) event.stopPropagation();
}
</script>

<template>
  <div>
    <Inplace v-focustrap :disabled="disabled || readonly || saving" @click="stopOrPass" @open="startEdit" @close="closeEdit">
      <template #display>
        <div v-tooltip.top="{ value: props.data.windowName, showDelay: 300, class: 'profile-name-tooltip' }" class="profile-name-content">{{ props.data.windowName }}</div>
      </template>
      <template #content="{ closeCallback }">
        <InputText v-model="draft" autofocus size="small" class="window-name-input"
          @blur="save(closeCallback)" @keydown.enter="save(closeCallback)" />
      </template>
    </Inplace>
  </div>
</template>
