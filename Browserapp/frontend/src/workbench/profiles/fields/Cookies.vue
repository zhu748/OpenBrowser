<script setup>
import { ref, watch } from 'vue';
import { a as importCookies, s as validateCookies } from './cookie-CqdL0VrU.js';
import { t as Label } from './input-label-qeCNGFwS.js';
import { t as Textarea } from './rx-input-textarea-BWwP6OaO.js';
import { t as Message } from './message-SBZQdXpt.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({ platformUrls: Array });
const model = defineModel();
const invalid = defineModel('invalid', { type: Boolean });
const issue = ref('');
async function readFile() {
  const file = await importCookies();
  if (!file) return;
  if (file.data) {
    model.value = file.data;
    invalid.value = false;
  } else {
    invalid.value = true;
    issue.value = file.message;
  }
}
function validate(text) {
  const result = validateCookies(text?.trim() ?? '', { platformUrls: props.platformUrls });
  invalid.value = !result.valid;
  issue.value = result.valid ? '' : result.message;
}
watch(() => props.platformUrls, () => { if (model.value) validate(model.value); }, { deep: true });
</script>

<template>
  <div class="flex min-w-0 w-full">
    <Label class="shrink-0 max-w-25 !min-w-25 text-right" :label="$attrs.label"
      :tooltip="$t('Cookies 用于保存网站的登录状态和会话信息。导入后将在打开窗口时自动写入，可用于迁移或恢复网站登录状态。')" />
    <div class="min-w-0 flex-1">
      <Textarea v-model="model" rows="3" icon="base/rx_ic_attachment" :auto-resize="false" :invalid="invalid"
        :placeholder="$attrs.placeholder || $t('选填\n支持格式: JSON、Netscape、Name=Value\nName=Value 未写 domain 时，将按行从平台账号的网址自动填充')"
        @icon-click="readFile" @blur="validate($event.target.value)" />
      <Message v-if="invalid" severity="error" size="small" variant="simple">{{ issue }}</Message>
    </div>
  </div>
</template>
