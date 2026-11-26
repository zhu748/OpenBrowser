<script setup>
import { computed, h, markRaw, nextTick, onBeforeMount, ref, useTemplateRef, watch } from 'vue';
import { Dr as readJson, bt as useTableCache, h as requests, hn as debounce, kr as delay, mt as useWorkspace,
  nn as usePermission, vt as cache } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Divider } from './rx-divider-Ci3C58Q3.js';
import { n as Sortable, r as Popover } from './contextmenu-BBjizTDn.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import { a as Tabs, n as TabList, t as Tab } from './tab-6bJNMvq4.js';
import { t as useSimplePopup } from './simplePopup-D6H7ykCr.js';
import { t as TagManager } from './tags-D13xnrA2.js';
import { n as ProfileTable, t as ProfileDialogs } from './renewal-reminder-drawer-C9_4HaAB.js';
import { Transfers } from './local-pages.js';
import RecycleBin from './workbench-profile-recycle.js';

const confirm = useConfirm();
const [openDialog] = useDialog();
const route = useRoute();
const workspace = useWorkspace();
const [, showStatus] = useNotice();
const { showSimpleDialog } = useSimplePopup();
const { check } = usePermission();
const tableCache = useTableCache();
const tabList = useTemplateRef('tabList');
const config = useTemplateRef('config');
const fixedTabs = [{ id: 'rx_1000', label: $t('全部窗口'), name: 'profiles' }];
const builtinFilters = [
  { id: 'rx_1002', label: $t('收藏'), name: 'favorite', _params: { isOften: true } },
  { id: 'rx_1003', label: $t('已打开'), name: 'opened', _params: { openStatus: true } },
];
const suffixTabs = computed(() => [
  { id: 'rx_1004', label: $t('转移中'), name: 'transfer', component: markRaw(Transfers) },
  { id: 'rx_1001', label: $t('回收站'), icon: 'base/rx_ic_bin_2', name: 'trash', component: markRaw(RecycleBin), visible: check('Profiles_view_recycle_bin') },
].filter(tab => tab.visible !== false));
const storageKey = 'localTabs_' + workspace.currentWorkspace?.id;
const remembered = readJson(localStorage.getItem(storageKey)) || builtinFilters.map(tab => ({ ...tab, sort: -1, isLocal: true, disabledFilter: true }));
for (const tab of remembered) {
  const builtin = builtinFilters.find(item => item.id === tab.id);
  if (builtin) tab.label = builtin.label;
}

const tabs = ref(fixedTabs);
const activeId = ref(fixedTabs[0].id);
const sortChanged = ref(false);
const reorderable = computed({
  get: () => tabs.value.slice(fixedTabs.length),
  set: value => { tabs.value.splice(fixedTabs.length, tabs.value.length - fixedTabs.length, ...value); },
});
const extraPage = computed(() => suffixTabs.value.find(tab => tab.id === activeId.value)?.component);
const activeFilter = computed(() => tabs.value.find(tab => tab.id === activeId.value));
const updateInkBar = debounce(() => tabList.value?.updateInkBar(), 100);
watch(tabs, updateInkBar);

function restoreTab() {
  const id = workspace.currentWorkspace?.id;
  if (!id) return;
  const saved = tableCache.get(cache.BROWSER_LIST, String(id), { projectId: '' })?.meta?.activeTabId;
  if (saved && [...tabs.value, ...suffixTabs.value].some(tab => tab.id === saved)) activeId.value = saved;
}
function selectFromRoute(options) {
  const selected = options.find(tab => tab.id === route.query.activeTabId);
  if (!selected) return false;
  activeId.value = selected.id;
  return true;
}

watch(() => route.query.activeTabId, () => {
  selectFromRoute([...tabs.value, ...suffixTabs.value]);
});

async function loadTabs() {
  const { code, data, msg } = await requests.window.userGetWindowFilterNameListList();
  if (code === 0) {
    const filters = data.map((tab, index) => ({ ...tab, id: String(index), name: tab.filter_name, label: tab.filter_name }));
    tabs.value = [...fixedTabs, ...filters.concat(remembered).sort((left, right) => left.sort - right.sort)];
    if (!selectFromRoute(tabs.value)) restoreTab();
    setTimeout(() => tabList.value?.updateInkBar(), 1000);
  }
  showStatus(code, msg);
}
async function reloadTabs(keepSelection = false) {
  await loadTabs();
  if (!keepSelection) activeId.value = tabs.value.at(-1).id;
}
function rename(tab) {
  const prompt = $t('请输入筛选器名称');
  showSimpleDialog({
    title: $t('编辑筛选器名称'),
    inputs: [{ type: 'text', name: 'filter_name', value: tab.label, props: { placeholder: prompt },
      resolver: schema => schema.string({ invalid_type_error: prompt }).min(1, prompt) }],
    async onConfirm({ filter_name }) {
      const { code, msg } = await requests.window.userUpdateWindowFilterNameCreate({ ...tab, old_filter_name: tab.filter_name, new_filter_name: filter_name });
      if (code === 0) Object.assign(tab, { name: filter_name, label: filter_name, filter_name });
      showStatus(code, msg);
    },
  });
}
function remove(tab) {
  confirm.require({
    header: $t('删除筛选器'), message: $t('您确认要删除所选筛选器吗？'),
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认'), severity: 'danger' },
    accept: async () => {
      try {
        const { code, msg } = await requests.window.userDeleteWindowFilterNameCreate({ filter_name: tab.label });
        showStatus(code, msg);
        if (code !== 0) return;
        if (activeId.value === tab.id) {
          activeId.value = tabs.value.find(item => item.id !== tab.id).id;
          await delay(300);
        }
        tabs.value = tabs.value.filter(item => item.id !== tab.id);
      } catch (error) {
        showStatus(-1, error.message);
      }
    },
  });
}
function manageTags() {
  openDialog({ showHeader: false, modal: true, blockScroll: true, pt: { content: '!pa-0' },
    slots: { container: ({ hideModal }) => h(TagManager, { onClose: hideModal }) } });
}
async function saveSort() {
  if (!sortChanged.value) return;
  sortChanged.value = false;
  const locals = [];
  const sort_data = [];
  reorderable.value.forEach((tab, sort) => {
    if (tab.isLocal) locals.push({ ...tab, sort });
    else sort_data.push({ name: tab.label, sort });
  });
  localStorage.setItem(storageKey, JSON.stringify(locals));
  const { code, msg } = await requests.window.userUpdateWindowFilterSortCreate({ sort_data });
  showStatus(code, msg);
}

onBeforeMount(() => {
  if (!selectFromRoute([...tabs.value, ...suffixTabs.value])) restoreTab();
  void nextTick(loadTabs);
});
</script>

<template>
  <div class="flex flex-col h-full w-full relative">
    <div class="flex items-center justify-between tabs">
      <Tabs v-model:value="activeId" class="overflow-hidden" scrollable>
        <TabList ref="tabList">
          <Tab v-for="tab in tabs" :key="tab.id || tab.label" :value="tab.id">
            <div class="flex items-center text-inherit font-[Inter]">{{ tab.label }}</div>
          </Tab>
          <Tab v-for="tab in suffixTabs" :key="tab.id" class="!pa-0 opacity-0" :value="tab.id" />
        </TabList>
      </Tabs>
      <div class="inline-flex justify-start flex-1 suffix">
        <div v-for="tab in suffixTabs" :key="tab.id" class="flex items-center cursor-pointer break-keep suffix-tab"
          :class="{ active: tab.id === activeId }" @click="activeId = tab.id">
          <Icon :name="tab.icon" color="var(--colors-icon-icon-note)" /><span>{{ tab.label }}</span>
        </div>
      </div>
      <Button text severity="secondary" size="xs" icon="base/rx_ic_gear" @click="config?.show($event)" />
      <template v-if="check('Profiles_Label_view_page')">
        <Divider class="mx-1 !h-4" vertical line-only />
        <Button v-tooltip.top="{ value: $t('标签管理') }" text severity="secondary" size="xs" icon="base/rx_ic_tag" @click="manageTags" />
      </template>
    </div>
    <div class="flex flex-1 overflow-hidden">
      <component :is="extraPage" v-if="extraPage" />
      <div v-show="!extraPage" class="flex-1 overflow-hidden">
        <ProfileTable :current-filter="activeFilter" :inactive="!!extraPage" @update-filter-tabs="reloadTabs" @switch-tab="activeId = $event" />
      </div>
    </div>
    <ProfileDialogs />
  </div>
  <Popover ref="config" @hide="saveSort">
    <div v-for="tab in fixedTabs" :key="tab.name" class="sort-item">
      <Icon name="base/rx_ic_dots_drag" class="invisible" /><span>{{ tab.label }}</span>
    </div>
    <Sortable v-model="reorderable" :animation="150" @change="sortChanged = true">
      <div v-for="tab in reorderable" :key="tab.id" class="sort-item">
        <Icon name="base/rx_ic_dots_drag" class="cursor-grab handle" /><span class="flex-auto">{{ tab.label }}</span>
        <template v-if="!tab.isLocal">
          <Icon name="base/rx_ic_edit" class="cursor-pointer" @click="rename(tab)" />
          <Icon name="base/rx_ic_bin_1" class="cursor-pointer" @click="remove(tab)" />
        </template>
      </div>
    </Sortable>
    <div v-for="tab in suffixTabs" :key="tab.id" class="sort-item">
      <Icon name="base/rx_ic_dots_drag" class="invisible" /><span>{{ tab.label }}</span>
    </div>
  </Popover>
</template>
