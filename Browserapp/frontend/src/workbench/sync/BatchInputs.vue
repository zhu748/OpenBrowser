<script setup>
import { markRaw, onMounted, ref, watch } from 'vue';
import { t as translate } from './locales-BfKu2SD4.js';
import { n as useToast } from './usetoast-DphSlejX.js';
import { y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Checkbox } from './rx-checkbox-BrC0MzoD.js';
import { a as Tabs, i as TabPanels, n as TabList, r as TabPanel, t as Tab } from './tab-6bJNMvq4.js';
import { t as Dialog } from './base-dialog-Bet1oNF8.js';
import { watchNativeDialogTab } from './workbench-dialog-tabs.js';
import SameText from './sync-same-text.js';
import DifferentText from './sync-different-text.js';
import RandomText from './sync-random-text.js';

const toast = useToast();
const route = useRoute();
const desktop = globalThis.electronAPI;
const forms = ref({});
const windows = ref([]);
const append = ref(true);
const tabs = [
  { id: 'same', label: translate('相同文本'), component: markRaw(SameText) },
  { id: 'diff', label: translate('差异文本'), component: markRaw(DifferentText) },
  { id: 'random', label: translate('随机数字'), component: markRaw(RandomText) },
];
const hasTab = tab => tabs.some(option => option.id === tab);
const activeTab = ref(hasTab(route.query.tab) ? route.query.tab : tabs[0].id);
let submitting = false;

function notify(error) {
  toast.add({ severity: 'error', summary: error.message, life: 5000 });
}

watchNativeDialogTab(tab => { if (hasTab(tab)) activeTab.value = tab; });
watch(() => activeTab.value === 'diff' ? Math.min(60 * windows.value.length + 220, 660)
  : activeTab.value === 'random' ? 340 : 366, height => {
  void desktop.send('syncControl:resizeBatchInputsDialog', { width: 480, height }).catch(notify);
}, { immediate: true });

function close() {
  return desktop.send('syncControl:closeBatchInputsDialog');
}

async function submit(mode) {
  const form = forms.value[mode];
  if (submitting || !form) return;
  const data = form.formData;
  if (mode === 'same' && !data?.trim()) {
    toast.add({ severity: 'warn', summary: translate('操作失败'), detail: translate('请输入文本'), life: 1500 });
    return;
  }
  submitting = true;
  try { await desktop.send('syncControl:batchInputText', { mode, data, append: append.value }); }
  catch (error) { notify(error); }
  finally { submitting = false; }
}

async function refresh() {
  try { windows.value = await desktop.send('syncControl:getAllSyncingWindows'); }
  catch (error) { notify(error); }
}
desktop.on('browser:on-close', refresh);
onMounted(refresh);
</script>

<template>
  <Dialog :header="translate('批量输入')" @hide="close">
    <Tabs v-model:value="activeTab">
      <TabList :pt="{ root: 'overflow-visible!' }">
        <Tab v-for="tab in tabs" :key="tab.id" :value="tab.id">{{ tab.label }}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel v-for="tab in tabs" :key="tab.id" :value="tab.id">
          <component :is="tab.component" :ref="element => forms[tab.id] = element" :sync-windows="windows" />
          <div class="footer">
            <div class="flex items-center gap-2">
              <Checkbox v-model="append" input-id="append" binary size="small" :true-value="false" :false-value="true" />
              <label for="append">{{ translate('输入前清空内容') }}</label>
            </div>
            <Button class="save-button" @click="submit(tab.id)">{{ translate('输入') }}</Button>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </Dialog>
</template>
