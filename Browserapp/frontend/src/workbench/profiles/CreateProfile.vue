<script setup>
import { Fragment, computed, h, onBeforeMount, onBeforeUnmount, reactive, ref, toRaw, watch, withModifiers } from 'vue';
import { cr as cloneField, h as requests, i as selectFields, sn as useLocale, s as readFields,
  u as writeField, vt as cache, wt as useReturnRoute, yt as useCache } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { b as useRouter, y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { P as aiCreateSource, u as useAgent, w as useBusinessCode } from './hook-CnJE4hRq.js';
import { t as usePopupMenu } from './usePopupMenu-BRw1zJ0m.js';
import { n as TabList, t as Tab } from './tab-6bJNMvq4.js';
import { t as Tabs } from './rx-tabs-Dp-8mudX.js';
import { t as useSimplePopup } from './simplePopup-D6H7ykCr.js';
import { i as defaultTemplate } from './utils-CnUy4XUk.js';
import { t as Header } from './views-header-CcjwXPjG.js';
import { a as provideProfileForm } from './useAsyncGate-D7VA7DLY.js';
import { t as useWindowCreateCore } from './useWindowCreateCore-01alf0RN.js';
import { invalidateFingerprintDraft } from './workbench-fingerprint-draft.js';
import CreateSingle from './workbench-profile-create-single.js';
import CreateBatch from './workbench-profile-create-batch.js';
import CreateFromFile from './workbench-profile-create-file.js';

const route = useRoute();
const router = useRouter();
const returnRoute = useReturnRoute();
const confirm = useConfirm();
const { handleBusinessCode } = useBusinessCode();
const { showSimpleDialog } = useSimplePopup();
const { showMenu } = usePopupMenu();
const [, showStatus] = useNotice();
const { invalidateCache } = useCache();
const locale = useLocale();
const { opening, openRoxyAIAgent } = useAgent();
const wideBadge = computed(() => /^(?:en|ru)(?:-|$)/i.test(locale.currentLocale));
const tabs = [
  { title: $t('单个创建'), value: 'single' },
  { title: $t('批量创建'), value: 'multiple' },
  { title: $t('窗口导入'), value: 'import' },
];
const tab = ref(tabs[0].value);
const isBatch = ref(false);
const createCount = ref(1);
const driver = ref();
const presetTemplate = ref();
const oneClickSettings = ref();
const rawMainSettings = ref([]);
const metadata = ref({ projectName: $t('未指定项目'), projectId: undefined, labelIds: [], windowRemark: '' });
const collapsed = ref(false);
let disposed = false;

provideProfileForm({
  isBatch, createCount, driverObj: driver, presetTemplate, oneClickSettings,
  pauseCreateGuide() {
    if (!driver.value) return false;
    clearGuide();
    return true;
  },
  continueCreateGuideAfterBuy: async () => {},
});

const core = useWindowCreateCore({
  getFingerprintInputs: state => tab.value === 'import' ? [rawMainSettings.value, ...state.extraSettings.value] : state.inputsGroup.value,
  resolveMobileVisible: () => tab.value === 'import' || undefined,
  onInputsInitialized: state => { rawMainSettings.value = state.mainSetting.value.map(field => cloneField(field)); },
});
const templateById = ref({});
const templateMenu = ref([]);
const selectedTemplate = reactive({ id: 'default', label: $t('不使用模板') });
const defaults = { proxyInfoList: [], windowPlatformList: [] };
const remembered = ref({});
const fields = computed(() => [tab.value === 'import' ? [] : core.mainSetting.value, ...core.extraSettings.value]);
const previewFields = computed(() => [tab.value === 'import' ? rawMainSettings.value : core.mainSetting.value, ...core.extraSettings.value]);

onBeforeUnmount(() => {
  disposed = true;
  core.dispose();
});

watch(tab, (next, previous) => {
  isBatch.value = next === 'multiple';
  const main = core.mainSetting.value;
  if (!main.length) return;
  if (previous === 'import' || next === 'import') {
    invalidateFingerprintDraft(previous === 'import' ? rawMainSettings.value : main);
  }
  if (previous !== 'import') {
    remembered.value[previous] = selectFields(main, Object.keys(defaults)).map(field => [field.name, cloneField(field.value)]);
  }
  if (next !== 'import') {
    for (const [name, value] of remembered.value[next] ?? Object.entries(defaults)) writeField(main, name, value);
  }
  core.syncMobileVisibility();
  if (previous === 'import') void core.ensureFingerprintPreview();
}, { flush: 'sync' });

function clearGuide() {
  document.querySelectorAll('.guide1.guide1-pulse-active').forEach(element => element.classList.remove('guide1-pulse-active'));
  if (driver.value) {
    driver.value.destroy();
    driver.value = undefined;
  }
}

function choosePreset(preset) {
  presetTemplate.value = preset;
  initialize(preset.preset);
}

function selectTemplate(option) {
  if (selectedTemplate.id === option.value) return;
  selectedTemplate.id = option.value;
  selectedTemplate.label = option.label;
  return initialize(toRaw(templateById.value[option.value] || templateById.value.default), {
    preserveSettings: option.value !== 'default',
  });
}

function initialize(profile, options) {
  return core.initialize(profile, options).catch(error => {
    if (!disposed) showStatus(-1, error.message);
  });
}

async function loadTemplates() {
  const { code, data: templates, msg } = await requests.window.userGetWindowTemplateListList();
  if (code !== 0) throw Error(msg);
  const map = { default: await defaultTemplate() };
  const options = [{ label: $t('不使用模板'), value: 'default', action: false }];
  for (const template of templates) {
    if (!template.id) continue;
    const id = String(template.id);
    map[id] = JSON.parse(template.content);
    options.push({ label: template.templateName, value: id, action: true });
  }
  templateById.value = map;
  templateMenu.value = options.map(option => ({
    ...option, command: () => selectTemplate(option),
    render: ({ item, btnPt }) => h(Button, { text: true, severity: 'secondary', class: 'w-full', pt: btnPt }, {
      default: () => h('div', { class: 'w-full flex items-center gap-2' }, [
        h('div', { class: 'flex-1 text-left' }, item.label),
        item.action && h(Fragment, null, [
          h('div', { onClick: withModifiers(() => saveTemplatePopup(null, item), ['stop']) }, [h(Icon, { name: 'base/rx_ic_edit' })]),
          h('div', { onClick: withModifiers(() => deleteTemplate(item), ['stop']) }, [h(Icon, { name: 'base/rx_ic_bin_1' })]),
        ]),
      ]),
    }),
  }));
}
function showTemplates(event) {
  showMenu(event, { model: templateMenu.value });
}
function saveTemplatePopup(_event, item) {
  showSimpleDialog({
    title: item?.value ? $t('编辑模板') : $t('保存模板'),
    inputs: [{ type: 'text', name: 'templateName', value: item?.label, required: true, props: { placeholder: $t('模板名称') } }],
    onConfirm: ({ templateName }) => saveTemplate(templateName, item?.value),
  });
}
const templateActions = computed(() => [{
  label: $t('覆盖当前模板'), disabled: selectedTemplate.id === 'default',
  command: () => {
    const option = templateMenu.value.find(item => item.value === selectedTemplate.id);
    if (option) return saveTemplate(option.label, Number(option.value));
  },
}]);
async function saveTemplate(templateName, id) {
  await core.formGate.waitUntilReady();
  if (!core.mainSetting.value.length) throw Error($t('窗口配置尚未加载，请重新打开编辑器'));
  const content = JSON.stringify(readFields(fields.value));
  const params = { templateName, content };
  const { code, msg } = id
    ? await requests.window.userMdfWindowTemplateInfoCreate({ id, ...params })
    : await requests.window.userAddWindowTemplateInfoCreate(params);
  if (code === 0) {
    if (id && Number(selectedTemplate.id) === Number(id)) selectedTemplate.label = templateName;
    return loadTemplates();
  }
  handleBusinessCode(code, () => showStatus(code, msg));
}
function deleteTemplate(item) {
  confirm.require({
    header: $t('删除模板'), message: $t('您确认要删除 ({name}) 模板吗？', { name: item.label }),
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认'), severity: 'danger' },
    accept: async () => {
      const { code, msg } = await requests.window.userDeleteWindowTemplateInfoCreate({ id: Number(item.value) });
      showStatus(code, msg);
      if (code === 0) await loadTemplates();
    },
  });
}
function onBack(profile, open = false) {
  invalidateCache(cache.BROWSER_LIST, { projectId: '' });
  if (metadata.value.projectId) invalidateCache(cache.BROWSER_LIST, { projectId: String(metadata.value.projectId) });
  const { path, query } = returnRoute;
  const destination = ['/browser', '/projects'].some(prefix => path?.startsWith(prefix)) && path !== '/browser/edit' ? path : '/browser';
  router.replace({ path: destination, query: { ...query, title: metadata.value.projectName, browser: JSON.stringify({ windowId: profile?.windowId, openBrowser: open }) } });
}
function launchAssistant() {
  globalThis.__localActionTrack('ui_action').catch(console.error);
  return openRoxyAIAgent(aiCreateSource);
}
onBeforeMount(() => {
  const templatesReady = loadTemplates().then(() => true).catch(error => {
    if (!disposed) showStatus(-1, error.message);
    return false;
  });
  if (!route.query.templateId) {
    void initialize();
    return;
  }
  void templatesReady.then(loaded => {
    if (disposed) return;
    const id = route.query.templateId;
    const template = id && templateMenu.value.find(item => item.action && item.value === String(id));
    if (template) return selectTemplate(template);
    if (id && loaded) showStatus(-1, $t('模板不存在'));
    return initialize();
  });
});
const shared = {
  ...core, collapsed, inputsGroup: fields, previewInputs: previewFields, isBatch, createCount,
  profileTemplate: selectedTemplate, showTemplates, metaData: metadata, items: templateActions, saveTemplatePopup,
  maxWindowCount: 100, clearGuide, choosePreset, onBack,
};
</script>

<template>
  <div class="relative flex min-h-0 flex-col h-full create-page">
    <Header show-back :divider="false" :title="$t('创建窗口')" />
    <Tabs v-model:value="tab" :tabs="tabs" only-tabs>
      <template #tablist>
        <TabList :pt="{ tablist: 'px-6 py-0 gap-4' }">
          <Tab v-for="item in tabs" :key="item.title" :value="item.value">
            <div class="flex items-center justify-center gap-2"><span>{{ item.title }}</span></div>
          </Tab>
          <button class="ai-batch-create-entry" :class="{ 'ai-batch-create-entry--wide-badge': wideBadge }" type="button"
            :aria-label="$t('AI 批量创建')" :disabled="opening" @click.stop="launchAssistant">
            <span class="ai-batch-create-entry__text">{{ $t('AI 批量创建') }}</span>
          </button>
        </TabList>
      </template>
    </Tabs>
    <CreateSingle v-if="tab === 'single'" :shared="shared" />
    <CreateBatch v-else-if="tab === 'multiple'" :shared="shared" />
    <CreateFromFile v-else :shared="shared" />
  </div>
</template>
