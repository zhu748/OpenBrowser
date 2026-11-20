<script setup>
import { onBeforeMount, ref } from './workbench-vue.js';
import { h as api, xr as isEmpty } from './utils-BIWenCnY.js';
import { n as useToast } from './agent-BmSFI9WH.js';
import { o as formatCookie, r as parseCookie, t as validCookie } from './cookie-CqdL0VrU.js';
import { t as Textarea } from './m-input-textarea-33WQDaSq.js';
import { t as Message } from './message-SBZQdXpt.js';
import { t as Button } from './rx-button-DyzuUt-V.js';

const props = defineProps({ data: Object, saveCookies: Function });
const emit = defineEmits(['confirm']);
const [, showError] = useToast();
const value = ref('');
const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const invalid = ref(false);
const errorText = () => $t('Cookie 格式错误,请检查格式');
const placeholder = () => $t(`支持格式: JSON、Netscape、Name=Value
Name=Value 格式行首必须指定 domain=...; 字段值，否则无效`);
onBeforeMount(async () => {
  if (!props.data?.id) return;
  loading.value = true;
  try {
    const { data: { rows: [profile] } } = await api.window.userGetWindowInfoV2List({
      windowIds: props.data.id, isDelete: 0, page_index: 1, page_size: 1,
    });
    value.value = isEmpty(profile?.cookie) ? '' : formatCookie(profile.cookie);
  } catch (error) {
    loadFailed.value = true;
    showError(-1, error.message);
  } finally {
    loading.value = false;
  }
});

function validate(input) {
  invalid.value = !!input.trim() && !validCookie(input);
}

async function save() {
  if (saving.value || loading.value || loadFailed.value) return;
  const input = value.value.trim();
  validate(input);
  if (invalid.value) return showError(-1, errorText());
  saving.value = true;
  try {
    const cookies = input ? parseCookie(input) ?? [] : [];
    if (props.saveCookies) await props.saveCookies(cookies);
    else emit('confirm', cookies);
  } catch (error) {
    showError(-1, error.message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col pt-4 px-4 min-w-124">
    <div class="flex-1">
      <Textarea v-model="value" :field-props="{ pt: { root: 'h-full' } }" :placeholder="placeholder()"
        cols="40" :auto-resize="false" :invalid="invalid" :disabled="loading || loadFailed" :pt="{ root: 'h-full' }"
        @blur="validate($event.target.value)" />
      <Message v-if="invalid" severity="error" size="small" variant="simple">{{ errorText() }}</Message>
    </div>
    <div class="flex justify-end pt-4 pb-5">
      <Button :label="$t('保存')" :loading="saving" :disabled="loading || loadFailed" @click="save" />
    </div>
  </div>
</template>
