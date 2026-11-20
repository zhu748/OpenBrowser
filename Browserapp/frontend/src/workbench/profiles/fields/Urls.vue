<script setup>
import { ref, watch } from 'vue';
import { t as Label } from './input-label-qeCNGFwS.js';
import { t as Textarea } from './rx-input-textarea-BWwP6OaO.js';
import { t as Message } from './message-SBZQdXpt.js';

defineOptions({ inheritAttrs: false });
const urls = defineModel({ type: Array, default: () => [] });
const invalid = defineModel('invalid', { type: Boolean });
const text = ref('');
watch(urls, value => { text.value = (value ?? []).join('\n'); }, { immediate: true });
function update() {
  const entries = text.value.split('\n').filter(Boolean);
  if (entries.some(entry => !URL.canParse(entry))) {
    invalid.value = true;
    return;
  }
  urls.value = entries;
  invalid.value = false;
}
</script>

<template>
  <div class="flex min-w-0 w-full" :class="$attrs.class">
    <Label class="shrink-0" :label="$attrs.label" :tooltip="$attrs.tooltip" />
    <div class="min-w-0 flex-1">
      <Textarea v-model="text" rows="3" :placeholder="$t('必须以 http:// 或 https:// 开头\n每行一个 URL，换行以添加多个')" :invalid="invalid" @blur="update" />
      <Message v-if="invalid" severity="error" size="small" variant="simple">{{ $t('URL格式有误，必须以 http:// 或 https:// 开头') }}</Message>
    </div>
  </div>
</template>
