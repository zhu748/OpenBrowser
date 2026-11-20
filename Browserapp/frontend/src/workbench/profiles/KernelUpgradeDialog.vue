<script setup>
import { ref } from './workbench-vue.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';

const props = defineProps({ messages: { type: Array, default: () => [] }, confirmUpgrade: Function, close: Function });
const busy = ref(false);
async function confirm() {
  if (busy.value) return;
  busy.value = true;
  try {
    await props.confirmUpgrade();
    props.close();
  } catch (error) {
    console.warn('[upgradeCore] update failed', error);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-3 w-120 px-6 pt-4 pb-6">
    <div class="text-14px font-medium text-[var(--colors-text-text-primary)]">{{ $t('升级内核') }}</div>
    <div class="flex flex-col gap-1">
      <div v-for="(message, index) in messages" :key="index" class="text-12px leading-18px text-[var(--colors-text-text-secondary)] break-all">{{ message }}</div>
    </div>
    <Alert class="!w-full" type="warn" :closable="false" :content="$t('修改内核可能导致缓存不兼容，从而使账号登录信息失效，请谨慎操作。')" />
    <div class="flex justify-end items-center gap-3">
      <Button size="sm" text severity="secondary" :label="$t('取消')" :disabled="busy" @click="close" />
      <Button size="sm" :label="$t('确认')" :loading="busy" @click="confirm" />
    </div>
  </div>
</template>
