<script setup>
import { computed, inject, nextTick, onMounted, ref, useTemplateRef } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Input } from './AgentInput-CVahkFed.js';

const dialog = inject('dialogRef');
const data = dialog?.value.data ?? {};
const input = useTemplateRef('input');
const title = ref(data.initialTitle ?? '');
const saving = ref(false);
const canSave = computed(() => Boolean(title.value.trim()) && !saving.value);

function close() {
  if (!saving.value) dialog?.value.close();
}
async function save() {
  if (!canSave.value) return;
  saving.value = true;
  try {
    if (await data.onSave?.(title.value.trim()) !== false) dialog?.value.close();
  } finally {
    saving.value = false;
  }
}
onMounted(() => nextTick(() => input.value?.focus()));
</script>

<template>
  <form class="agent-console-dialog__shell rename-conversation-dialog" @submit.prevent="save">
    <header class="agent-console-dialog__header">
      <h2 class="agent-console-dialog__title">{{ $t('重命名对话') }}</h2>
      <button class="rename-conversation-dialog__close" type="button" :aria-label="$t('关闭')" :disabled="saving" @click="close">
        <Icon name="roxy-agent/rx-ic-close" size="18" />
      </button>
    </header>
    <main class="agent-console-dialog__body rename-conversation-dialog__body">
      <Input ref="input" v-model="title" type="text" maxlength="200" :aria-label="$t('重命名对话')" :disabled="saving" />
    </main>
    <footer class="agent-console-dialog__footer">
      <div class="agent-console-dialog__actions">
        <button class="agent-console-dialog__button" type="button" :disabled="saving" @click="close">{{ $t('取消') }}</button>
        <button class="agent-console-dialog__button dark" type="submit" :disabled="!canSave">{{ $t('保存') }}</button>
      </div>
    </footer>
  </form>
</template>
