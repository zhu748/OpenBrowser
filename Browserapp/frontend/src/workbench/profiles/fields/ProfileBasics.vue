<script setup>
import { computed } from 'vue';
import { i as selectFields, or as copy } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { t as Label } from './input-label-qeCNGFwS.js';
import { t as Text } from './rx-input-text-CytLc5Og.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { i as Cookies, o as useProfileForm, s as useNameAutofill } from './useAsyncGate-D7VA7DLY.js';
import ProxySection from './workbench-profile-proxy-section.js';
import Accounts from './workbench-profile-linked-accounts.js';

const props = defineProps({
  windowInputs: { type: Array, default: () => [] }, templateLabel: { type: String, default: '' },
  showTemplate: Boolean, autofillWindowName: { type: Boolean, default: true },
});
const emit = defineEmits(['showTemplates']);
const [notice] = useNotice();
const { isBatch } = useProfileForm();
const fields = computed(() => selectFields(props.windowInputs, ['windowName', 'proxyInfoList', 'windowPlatformList', 'cookie']));
const name = computed(() => fields.value[0]);
const proxy = computed(() => fields.value[1]);
const accounts = computed(() => fields.value[2]);
const cookie = computed(() => fields.value[3]);
const urls = computed(() => (accounts.value?.value ?? []).map(account => account.platformUrl).filter(Boolean));
useNameAutofill({ enabled: () => props.autofillWindowName && !isBatch.value, getNameInput: () => name.value,
  getAccounts: () => accounts.value?.value, getProxyList: () => proxy.value?.value });
function copyId(id) {
  copy(id);
  notice(0, $t('复制成功'));
}
</script>

<template>
  <section class="mx-4 mb-2 p-4 basic-info">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="subtitle">{{ $t('窗口基础信息') }}</h2>
      <Button v-if="showTemplate" text severity="secondary" icon="base/rx_ic_template" :label="templateLabel" @click.stop="emit('showTemplates', $event)" />
    </div>
    <div class="flex flex-col gap-4">
      <div v-if="name" class="flex min-w-0 w-full flex-col gap-2">
        <div v-if="name.dirId" class="flex items-center justify-end gap-2.5">
          <span class="text-3 font-[JetBrains_Mono]">ID:{{ name.dirId }}</span>
          <span class="text-3 font-[JetBrains_Mono] color-blue cursor-pointer" @click="copyId(name.dirId)">{{ $t('复制') }}</span>
        </div>
        <div class="flex min-w-0 w-full items-start">
          <Label class="shrink-0" :label="name.label" />
          <div class="min-w-0 flex-1 flex flex-col gap-1">
            <Text v-model="name.value" :placeholder="name.placeholder" />
            <span class="text-2.75 tt-inactive">{{ $t('* 系统自动生成窗口名称，也可手动修改。') }}</span>
          </div>
        </div>
      </div>
      <ProxySection v-if="proxy" v-model="proxy.value" />
      <Accounts v-if="accounts" v-model="accounts.value" />
      <Cookies v-if="cookie" v-model="cookie.value" v-model:invalid="cookie.invalid" :platform-urls="urls" v-bind="cookie" />
    </div>
  </section>
</template>
