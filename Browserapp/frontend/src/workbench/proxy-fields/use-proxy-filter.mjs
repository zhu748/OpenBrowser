import { computed, ref } from './workbench-vue.js';
import { a as Binding, m as Proxy, s as Expiry } from './proxy-D7e36h-l.js';

const all = '__all__';
function filterGroups() {
  const allOption = { label: $t('全部'), value: all };
  return [
    { key: 'proxyExpireStatus', label: $t('状态'), options: [allOption, { label: $t('使用中'), value: Expiry.using },
      { label: $t('即将到期'), value: Expiry.soon }, { label: $t('已过期'), value: Expiry.expired }] },
    { key: 'proxyBindStatus', label: $t('已关联窗口'), multiple: false, options: [allOption,
      { label: $t('已关联'), value: Binding.Bound }, { label: $t('未关联'), value: Binding.Unbound }] },
    { key: 'proxyType', label: $t('来源'), multiple: false, options: [allOption, { label: $t('已添加'), value: String(Proxy.resource) }] },
  ];
}
const same = (left, right) => left === right || String(left) === String(right);
const values = value => value == null || value === all ? [] : [].concat(value).filter(item => item !== all);
function useProxyFilter({ initialValues, filterGroups: initialGroups, multiple, onApply }) {
  const groups = (initialGroups ?? filterGroups()).map(group => ({ ...group, multiple: group.multiple ?? multiple ?? false }));
  const copy = state => Object.fromEntries(groups.map(({ key }) => [key, Array.isArray(state?.[key]) ? [...state[key]] : state?.[key] ?? all]));
  const visible = ref(false);
  const applied = ref(copy(initialValues));
  const draft = ref(copy(applied.value));
  const active = computed(() => groups.filter(({ key }) => values(applied.value[key]).length));
  const summary = computed(() => active.value.map(group => `${group.label}: ${values(applied.value[group.key])
    .map(value => group.options.find(option => same(option.value, value))?.label ?? String(value)).join(', ')}`));
  function setApplied(newValues) {
    applied.value = copy({ ...applied.value, ...newValues });
    draft.value = copy(applied.value);
  }
  function openDrawer() {
    draft.value = copy(applied.value);
    visible.value = true;
  }
  function closeDrawer() { visible.value = false; }
  function resetDraft() { draft.value = copy(); }
  function apply() {
    setApplied(draft.value);
    closeDrawer();
    onApply();
  }
  function clearApplied() {
    if (!active.value.length) return;
    resetDraft();
    apply();
  }
  function isDraftOptionSelected(key, option) {
    const selected = values(draft.value[key]);
    return option === all ? !selected.length : selected.some(value => same(value, option));
  }
  function updateDraftField(key, value) { draft.value[key] = value; }
  function toggleDraftFieldOption(key, option) {
    if (!groups.find(group => group.key === key)?.multiple || option === all) return updateDraftField(key, option);
    const current = values(draft.value[key]);
    const next = isDraftOptionSelected(key, option) ? current.filter(value => !same(value, option)) : [...current, option];
    updateDraftField(key, next.length ? next : all);
  }
  const getApiParams = () => Object.fromEntries(active.value.map(({ key }) => [key, Array.isArray(applied.value[key]) ? values(applied.value[key]).join(',') : applied.value[key]]));
  return { visible, applied, draft, filterGroups: groups, hasActiveFilters: computed(() => active.value.length > 0), activeFilterCount: computed(() => active.value.length),
    activeFilterSummary: computed(() => summary.value.join(', ')), activeFilterTooltip: computed(() => summary.value.join('\n')),
    openDrawer, closeDrawer, resetDraft, clearApplied, isDraftOptionSelected, updateDraftField, toggleDraftFieldOption, apply, setApplied, getApiParams };
}

export { useProxyFilter as n, filterGroups as t };
