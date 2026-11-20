<script setup>
import { ref } from 'vue';
import { h as requests, vt as cache, yt as useCache } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { b as useRouter } from './rich-html-link-VdBpR3Cm.js';
import { t as Tabs } from './rx-tabs-Dp-8mudX.js';
import { t as SingleAccount } from './quick-kroUOSn_.js';
import { t as Header } from './views-header-CcjwXPjG.js';
import BatchAccounts from './workbench-account-batch.js';
import ImportAccounts from './workbench-account-import.js';

const router = useRouter();
const [showStatus] = useNotice();
const { invalidateCache } = useCache();
const tab = ref('single');
const tabs = [
  { title: $t('单个添加'), value: 'single' },
  { title: $t('批量添加'), value: 'batch' },
  { title: $t('模板导入'), value: 'template' },
];

async function save(values) {
  const { code, msg } = await requests.platform.userAddPlatformInfoCreate(values);
  showStatus(code, msg);
  if (code === 0) invalidateCache(cache.ACCOUNT_LIST);
}
</script>

<template>
  <div class="flex flex-col h-full w-full overflow-hidden">
    <Header show-back :divider="false" :title="$t('添加账号')" />
    <Tabs v-model:value="tab" :tabs="tabs" />
    <div class="flex-1 flex overflow-hidden">
      <SingleAccount v-show="tab === 'single'" class="mx-auto w-128" @confirm="save" @close="router.replace({ name: 'account-list' })" />
      <BatchAccounts v-show="tab === 'batch'" />
      <ImportAccounts v-show="tab === 'template'" class="mx-auto w-152" />
    </div>
  </div>
</template>
