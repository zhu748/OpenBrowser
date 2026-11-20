<script setup>
import { computed, h, nextTick, onBeforeUnmount, ref, toRaw, useTemplateRef, watch } from './workbench-vue.js';
import { a as findFilter, d as applyFilterValues, l as setFilterProperty, v as configKey, xr as isEmpty } from './utils-BIWenCnY.js';
import { a as useConfig } from './agent-BmSFI9WH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vRipple } from './ripple-DKjDc6yC.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Checkbox } from './rx-checkbox-BrC0MzoD.js';
import { o as SplitButton, s as TieredMenu } from './hook-CnJE4hRq.js';
import { t as formatDate } from './format-_cvrr_iF.js';
import { t as Input } from './m-input-text-JVbCgVJP.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import { t as usePreventMask } from './usePreventMask-Cud6gNnu.js';
import { n as GuideDialog, t as useOnboarding } from './hooks-BozaoB_u.js';
import { t as Avatar } from './rx-avatar-h90aIpxl.js';
import { o as Fuse } from './form-BQBA_XzO.js';
import { t as useSimpleDialog } from './simplePopup-D6H7ykCr.js';

const props = defineProps({ currentFilter: Object, filtersMenu: { type: Array, default: () => [] }, enabledFilterSave: Boolean, videoUrl: String, saveFilters: Function });
const emit = defineEmits(['filterChange']);
const [showDialog] = useDialog();
const { showSimpleDialog } = useSimpleDialog();
const { updateOnboardingTaskStatus } = useOnboarding();
const { userInfo } = useConfig(configKey());
const { showPreventMask, hidePreventMask } = usePreventMask();
const menu = useTemplateRef('tmenu');
const searchInput = useTemplateRef('checkboxSearch');
const search = ref('');
const query = ref('');
const newFilter = ref(true);
const dirty = ref(false);
const list = ref(null);
const selected = ref([]);
const selectedAtOpen = new Map();
let checkboxChanged = false;
let live = 0;
let searchTimer;
const menuStyle = { root: '_content_1n5qc_1', separator: '_separator_1n5qc_11', menu: { transition: '_list_1n5qc_7' } };
const itemClass = '_item_1n5qc_15';
const saveActions = [{ label: $t('保存为新筛选器'), command: saveNew }];
const rootOptions = computed(() => props.filtersMenu.flatMap(item => item.type === 'switchGroup' && item.options?.length
  ? item.options.map(option => ({ ...option, parentName: item.name, type: item.type })) : [item]));
const items = computed(() => {
  if (!list.value) return rootOptions.value;
  const { options, searchRow, fuse, label } = list.value;
  const visible = query.value && fuse ? fuse.search(query.value).map(match => match.item) : options;
  return [...(searchRow ? [searchRow] : []), ...(visible.length ? visible : [{ rowType: 'empty', text: options.length ? $t('暂无数据') : `${$t('暂无')} ${label}` }])];
});
const chips = computed(() => props.filtersMenu.flatMap(item => {
  if (isEmpty(item.value)) return [];
  const value = Array.isArray(item.value) ? (item.type === 'date'
    ? item.value.map(date => formatDate(new Date(date), 'yyyy-MM-dd')).join(' ~ ')
    : item.value.map(option => option.label).join(', ')) : item.value;
  return [{ ...toRaw(item), value }];
}));
watch(search, value => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { query.value = value.trim(); }, 200);
});
watch(() => props.currentFilter?.id, id => {
  dirty.value = false;
  newFilter.value = id === 'rx_1000';
});
onBeforeUnmount(() => {
  clearTimeout(searchTimer);
  live++;
});
function notify() {
  dirty.value = !newFilter.value || chips.value.length > 0;
  emit('filterChange');
}
function open(event) {
  if (props.videoUrl && userInfo.value.onboardingTaskStatus?.saveFilterGuideStatus === false) {
    showDialog({ showHeader: false, modal: true, blockScroll: true,
      handleCancel: () => updateOnboardingTaskStatus({ saveFilterGuideStatus: true }),
      slots: { container: ({ handleCancel }) => h(GuideDialog, { title: $t('高级筛选'),
        desc: $t('希望快速通过条件定位相应窗口？试试"高级筛选"功能，其亦可被保存为常驻"分组"！'),
        video: props.videoUrl, onClose: handleCancel, onConfirm: handleCancel,
      }) },
    });
  } else menu.value?.show(event);
}
function edit(item) {
  if (item.type === 'Checkbox') return enterCheckboxList(item);
  if (item.type === 'switch' || item.type === 'switchGroup') {
    const filter = item.type === 'switchGroup' ? findFilter(props.filtersMenu, item.parentName) : item;
    if (filter) {
      filter.value = item.type === 'switch' || item.value;
      if (item.type === 'switchGroup') filter._text = item.text;
    }
    menu.value?.hide();
    return notify();
  }
  if (!['text', 'number', 'textarea', 'date'].includes(item.type)) return;
  menu.value?.hide();
  const { type, name, label, value, icon: _icon, ...attributes } = item;
  showSimpleDialog({ inputs: [{ type, name, label, value, props: attributes }], onConfirm: values => {
    applyFilterValues(props.filtersMenu, values);
    notify();
  } });
}
async function enterCheckboxList(item) {
  if (typeof item.getOptions !== 'function') return menu.value?.hide();
  const request = ++live;
  let options;
  try {
    options = await item.getOptions();
  } catch (error) {
    console.error('[Module:custom-filters] Failed to load checkbox options', error);
  }
  if (request !== live) return;
  options = Array.isArray(options) ? options : [];
  selectedAtOpen.clear();
  for (const option of Array.isArray(item.value) ? item.value : []) if (option?.value != null) selectedAtOpen.set(option.value, option);
  selected.value = [...selectedAtOpen.keys()];
  search.value = query.value = '';
  const searchable = options.length && item.search;
  list.value = { name: item.name, label: item.label, options,
    searchRow: searchable ? { rowType: 'search', placeholder: item.searchPlaceholder || $t('搜索') } : undefined,
    fuse: searchable ? new Fuse(options, { threshold: 0.3, ignoreLocation: true, keys: item.searchKeys?.length ? item.searchKeys : ['label'] }) : null,
  };
  await nextTick();
  searchInput.value?.focus();
}
function updateSelections() {
  if (!list.value) return;
  const { name, options } = list.value;
  const filter = findFilter(props.filtersMenu, name);
  if (!filter) return;
  const values = new Set(selected.value);
  const matching = options.filter(option => option.value != null && values.delete(option.value));
  for (const id of values) if (selectedAtOpen.has(id)) matching.push(selectedAtOpen.get(id));
  filter.value = matching.length ? matching.map(toRaw) : null;
  checkboxChanged = true;
}
function hide() {
  const request = ++live;
  if (list.value) {
    if (checkboxChanged) notify();
    checkboxChanged = false;
    selected.value = [];
    setTimeout(() => {
      if (request === live) {
        list.value = null;
        search.value = query.value = '';
      }
    }, 20);
  }
  hidePreventMask();
}
function clear(chip) {
  setFilterProperty(props.filtersMenu, chip.name, 'value', null);
  notify();
}
function reset() {
  const filters = { ...props.currentFilter?.filter_condition };
  for (const key of ['createTime', 'modfiyTime']) filters[key] = Array.isArray(filters[key]) ? filters[key].map(value => new Date(value)) : undefined;
  for (const item of props.filtersMenu) {
    item.value = filters[item.name];
    for (const option of item.items ?? []) option.value = item.value;
  }
  dirty.value = false;
  emit('filterChange');
}
function saveNew() {
  showSimpleDialog({ title: $t('保存筛选器'), inputs: [{ type: 'text', name: 'filter_name', props: { placeholder: $t('请输入筛选器名称') },
    resolver: schema => schema.string({ invalid_type_error: $t('请输入筛选器名称') }).min(1, $t('请输入筛选器名称')) }],
    onConfirm: values => props.saveFilters?.(values) });
}
async function saveCurrent() {
  await props.saveFilters?.(props.currentFilter);
  dirty.value = false;
}
</script>

<template>
  <div class="flex flex-1 justify-between">
    <div class="flex flex-1 items-center flex-wrap mr-2 gap-2">
      <div v-for="(chip, index) in chips" :key="index" class="labels-item">
        <Icon class="mr-1 cursor-pointer" :size="14" name="base/rx_ic_delete" @click.stop="clear(chip)" />
        <span class="select-none">{{ chip.label }}</span>
        <span v-if="chip.type !== 'switch'" class="cursor-pointer">{{ ': ' + (chip._text || chip.value) }}</span>
      </div>
      <Button severity="secondary" size="xxs" text icon="base/rx_ic_filter" :label="chips.length ? '' : $t('筛选')"
        :disabled="currentFilter?.disabledFilter" @click="open" />
    </div>
    <div v-show="enabledFilterSave && dirty" class="flex items-start">
      <div class="labels-actions">
        <Button text severity="secondary" size="xxs" :label="$t('重置')" @click="reset" />
        <template v-if="chips.length">
          <Button v-if="newFilter" size="xxs" :label="$t('保存')" @click="saveNew" />
          <SplitButton v-else :label="$t('保存')" :model="saveActions" @click="saveCurrent" />
        </template>
        <div>|</div>
      </div>
    </div>
  </div>
  <TieredMenu ref="tmenu" popup :model="items" :pt="menuStyle" @hide="hide" @show="showPreventMask">
    <template #item="{ item, props: attributes }">
      <div v-if="item.rowType === 'empty'" class="max-w-60 cursor-default text-3.25 text-[var(--colors-text-text-secondary)]" :class="itemClass">{{ item.text }}</div>
      <div v-else-if="item.rowType === 'search'" class="w-60 px-1.5 py-1" @click.stop @mousedown.stop @keydown="$event.key !== 'Escape' && $event.stopPropagation()">
        <Input ref="checkboxSearch" v-model="search" class="w-full" size="xxs" pre-icon="base/rx_ic_magnify" autocomplete="off" :placeholder="item.placeholder" />
      </div>
      <a v-else v-ripple class="max-w-60 cursor-pointer !p-0" v-bind="attributes.action">
        <label v-if="list" class="cursor-pointer" :class="itemClass" :for="item.value" @click.stop>
          <Checkbox v-model="selected" :name="item.parentName" :input-id="item.value" :value="item.value" @change="nextTick(updateSelections)" />
          <div v-if="typeof item.value === 'string' && item.value.startsWith('u_')" class="flex items-center gap-2">
            <Avatar :avatar="item.avatar" :name="item.label?.slice(0, 2)" :color="item.avatarColor" :size="24" :font-size="12" />
            <span class="text-3.25">{{ item.label }}</span>
          </div>
          <span v-else class="ellipsis-1 text-3.25" :title="item.label">{{ item.label }}</span>
        </label>
        <div v-else :class="itemClass" @click.stop="edit(item)">
          <Icon v-if="item.icon" :name="item.icon" />
          <span class="text-3.25">{{ item.label }}</span>
        </div>
      </a>
    </template>
  </TieredMenu>
</template>
