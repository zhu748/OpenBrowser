<script setup>
import { computed, resolveComponent } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { or as copy } from './utils-BIWenCnY.js';
import { n as useAgentNotices } from './agent-BmSFI9WH.js';
import { parseAgentStatus } from './hook-CnJE4hRq.js';

const props = defineProps({ data: { type: Object, required: true } });
const I18nT = resolveComponent('I18nT');
const [notifySuccess, notifyError] = useAgentNotices();
const status = computed(() => parseAgentStatus(props.data));

async function copyRequestId() {
  if (!status.value.requestId) return;
  try {
    await copy(status.value.requestId);
    notifySuccess(0, $t('复制成功'));
  } catch (error) {
    console.error('[agent-console] Failed to copy request id:', error);
    notifyError(-1, $t('复制失败，请重试'));
  }
}
</script>

<template>
  <div class="agent-status-message" role="alert">
    <div class="agent-status-message__main"><Icon name="base/rx_ic_delete" size="14" /><span>{{ status.message }}</span></div>
    <span v-if="status.requestId" class="agent-status-message__request-id">
      <I18nT :keypath="$t('请求 ID：{requestId}', { requestId: '{requestId}' })">
        <template #requestId><button type="button" @click="copyRequestId">{{ status.requestId }}</button></template>
      </I18nT>
    </span>
  </div>
</template>
