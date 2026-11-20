<script setup>
import { onMounted, ref } from './workbench-vue.js';
import { h as api } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { m as Proxy, o as Status } from './proxy-D7e36h-l.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as useProxyTests } from './hooks-Jw3GridD.js';
import DeviceDetectFeedback from './workbench-device-detect-feedback.js';

const props = defineProps({ formData: { type: Object, required: true }, isDirect: Boolean, onConfirm: Function });
const emit = defineEmits(['close']);
const { testProxy } = useProxyTests();
const [, notify] = useFeedback();
const phase = ref('checking');
const checkResult = ref(null);
const historyMatched = ref(false);
const saving = ref(false);
let running = false;

async function run() {
  if (running) return;
  running = true;
  phase.value = 'checking';
  checkResult.value = null;
  historyMatched.value = false;
  const config = props.formData;
  try {
    const id = config.id != null && !['', '0'].includes(String(config.id)) ? config.id : undefined;
    const result = await testProxy({ ...config, id, isDirect: props.isDirect ?? config.isDirect, apiCheck: config.proxyType === Proxy.buy && Boolean(id) });
    checkResult.value = result;
    if (result.error || result.checkStatus !== Status.success) {
      phase.value = 'connectivity-failed';
      return;
    }
    const tempId = Date.now().toString(32);
    const { code, data } = await api.proxy.userBatchCheckProxyImportCreate({ items: [{ tempId, host: String(config.host ?? ''),
      port: String(config.port ?? ''), proxyUserName: config.proxyUserName, proxyPassword: config.proxyPassword }] });
    const record = data?.items?.find(item => item.tempId === tempId) ?? data?.items?.[0];
    historyMatched.value = code !== 0 || !record || Boolean(record.hasImportRecord);
    phase.value = historyMatched.value ? 'history-risk' : 'success';
  } catch (error) {
    phase.value = 'connectivity-failed';
    notify(-1, error.message);
  } finally {
    running = false;
  }
}
async function confirm() {
  if (!checkResult.value || saving.value) return;
  saving.value = true;
  try {
    await props.onConfirm?.(checkResult.value);
  } catch (error) {
    notify(-1, error.message);
  } finally {
    saving.value = false;
  }
}
onMounted(run);
</script>

<template>
  <div class="device-detect-modal w-120 flex flex-col gap-6 pa-6 pt-4 rounded-2">
    <div class="h-9 flex items-center justify-between">
      <div class="tt-primary text-4 font-600 leading-normal">{{ $t('检测结果') }}</div>
      <Icon class="cursor-pointer" name="base/rx_ic_delete" size="20" color="var(--colors-icon-icon-secondary)" @click="emit('close')" />
    </div>
    <DeviceDetectFeedback :phase="phase" :check-result="checkResult" :history-matched="historyMatched" />
    <div v-if="phase !== 'checking'" class="flex gap-2.5 justify-end">
      <Button v-if="phase === 'success'" size="md" class="w-full" :label="$t('完成导入')" :loading="saving" @click="confirm" />
      <template v-else>
        <Button size="md" severity="secondary" outlined :label="$t('取消')" @click="emit('close')" />
        <Button v-if="phase === 'connectivity-failed'" size="md" :label="$t('重新检测')" @click="run" />
        <Button v-else size="md" :label="$t('仍要导入')" :loading="saving" @click="confirm" />
      </template>
    </div>
  </div>
</template>
