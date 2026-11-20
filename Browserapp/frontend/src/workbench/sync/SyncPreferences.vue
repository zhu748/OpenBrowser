<script setup>
import { onMounted, ref, toRaw } from 'vue';
import { v as useConfig } from './utils-BIWenCnY.js';
import { t as merge } from './merge-B7DGYZqS.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { a as Tabs, i as TabPanels, n as TabList, r as TabPanel, t as Tab } from './tab-6bJNMvq4.js';
import { r as defaultSettings } from './main-types-DreniZN2.js';
import { t as savePreferences } from './util-C5rl6Moc.js';
import { t as Dialog } from './base-dialog-Bet1oNF8.js';
import BaseSettings from './sync-preferences-base.js';
import CustomLayout from './custom-layout-C32t9VHy.js';
import SimulationSettings from './sync-preferences-simulation.js';
import ShortcutSettings from './sync-preferences-shortcuts.js';
import { watchNativeDialogTab } from './workbench-dialog-tabs.js';

const route = useRoute();
const { getUserConfig } = useConfig();
const [showNotice, showError] = useNotice();
const api = globalThis.electronAPI;
const loaded = ref(false);
const formRefs = ref({});
const values = ref(structuredClone(defaultSettings));
let saving = false;

function close() {
  return api.send("syncControl:closePreferencesDialog");
}

async function save(beforeSave) {
  if (saving) return;
  saving = true;
  try {
    if (beforeSave) await beforeSave();
    const { code, msg } = await savePreferences(values.value);
    if (code !== 0) {
      showError(code, msg);
      return;
    }
    showNotice(code, msg, { life: 1200 });
    await close();
  } catch (error) {
    showError(-1, error.message);
  } finally {
    saving = false;
  }
}

async function saveShortcuts() {
  if (!await formRefs.value.shortcutKey?.valid()) {
    showError(-1, $t("快捷键设置冲突"));
    return;
  }
  return save(() => api.send("syncControl:registerShortcut", toRaw(values.value.shortcutKey)));
}

const options = [
  { id: "base", label: $t("基础设置"), component: BaseSettings, onSave: () => save() },
  { id: "customLayout", label: $t("自定义布局"), component: CustomLayout,
    onSave: () => save(() => api.send("syncControl:doLayout", toRaw(values.value.customLayout))) },
  { id: "simulate", label: $t("仿真参数设置"), component: SimulationSettings, onSave: () => save() },
  { id: "shortcutKey", label: $t("快捷键设置"), component: ShortcutSettings, onSave: saveShortcuts },
];
const hasTab = tab => options.some(option => option.id === tab);
const activeTab = ref(hasTab(route.query.tab) ? route.query.tab : options[0].id);

watchNativeDialogTab(tab => { if (hasTab(tab)) activeTab.value = tab; });
onMounted(async () => {
  try {
    const config = await getUserConfig();
    if (config?.preferenceSettings) {
      for (const [key, value] of Object.entries(values.value)) {
        if (Object.hasOwn(config.preferenceSettings, key)) merge(value, config.preferenceSettings[key]);
      }
    }
    loaded.value = true;
    setTimeout(() => {
      const tabs = document.querySelector(".p-tablist");
      if (!tabs) return;
      const width = window.innerWidth + tabs.scrollWidth - tabs.clientWidth;
      void api.send("app:resizeWindow", { width, height: window.innerHeight }).catch(error => showError(-1, error.message));
    }, 60);
  } catch (error) {
    showError(-1, error.message);
  }
});
</script>

<template>
  <Dialog :header="$t('偏好设置')" @hide="close">
    <Tabs v-model:value="activeTab">
      <TabList :pt="{ root: 'flex-shrink-0' }">
        <Tab v-for="option in options" :key="option.id" :value="option.id">{{ option.label }}</Tab>
      </TabList>
      <TabPanels v-if="loaded">
        <TabPanel v-for="option in options" :key="option.id" :value="option.id">
          <component :is="option.component" :ref="element => formRefs[option.id] = element" v-model="values[option.id]" class="form-container" />
          <Button class="save-button" @click="option.onSave">{{ $t('保存并生效') }}</Button>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </Dialog>
</template>
