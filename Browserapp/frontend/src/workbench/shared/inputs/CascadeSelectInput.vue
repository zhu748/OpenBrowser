<script setup>
import {
  computed, inject, nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref,
  useAttrs, useId, useTemplateRef, watch,
} from './workbench-vue.js';
import { m as useScrollLock, o as useEventListener } from './dist-NctnpPRe.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as TextInput } from './m-input-text-JVbCgVJP.js';
import Fuse from './workbench-fuse.js';
import { FormFieldIsolate, nextEnabledIndex } from './workbench-form-providers.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: {}, defaultValue: {}, name: {}, options: {}, getOptions: Function,
  optionLabel: { type: [String, Function], default: 'label' }, optionValue: {}, optionDisabled: {},
  optionGroupLabel: { type: [String, Function], default: 'label' }, optionGroupChildren: {}, optionLeaf: {},
  dataKey: {}, placeholder: {}, breakpoint: {}, invalid: Boolean, disabled: Boolean, variant: {},
  showClear: Boolean, clearIcon: {}, inputId: {}, inputStyle: {}, inputClass: {}, inputProps: {},
  panelStyle: {}, panelClass: {}, panelProps: {}, overlayStyle: {}, overlayClass: {}, overlayProps: {}, appendTo: {},
  loading: Boolean, dropdownIcon: {}, loadingIcon: {}, optionGroupIcon: {}, autoOptionFocus: Boolean, selectOnFocus: Boolean,
  focusOnHover: { type: Boolean, default: true }, searchLocale: {}, filter: Boolean, filterFields: {}, searchMessage: {},
  selectionMessage: {}, emptySelectionMessage: {}, emptySearchMessage: {}, emptyMessage: {}, tabindex: {},
  fluid: Boolean, ariaLabelledby: {}, ariaLabel: {}, formControl: {}, dt: {}, pt: {}, ptOptions: {}, unstyled: Boolean,
  icon: {}, iconColor: { default: 'var(--colors-text-text-primary, #171c1f)' }, size: { default: 'sm' },
  darkMode: Boolean, onChange: Function, pathSeparator: {},
});
const emit = defineEmits([
  'update:modelValue', 'valueChange', 'change', 'groupChange', 'beforeShow', 'beforeHide', 'show', 'hide', 'focus', 'blur', 'click',
]);
const attrs = useAttrs();
const root = useTemplateRef('root');
const trigger = useTemplateRef('trigger');
const overlay = useTemplateRef('overlay');
const searchInput = useTemplateRef('searchInput');
const parentField = inject('$pcFormField', null);
const scrollLocked = useScrollLock(document.body);
const localOptions = ref(props.options);
const localValue = ref(props.defaultValue);
const opened = ref(false);
const activePath = ref([]);
const query = ref('');
const focus = ref({ level: 0, index: -1 });
const searchFocus = ref(-1);
const coordinates = ref({});
const panelId = 'm-cascade-' + useId();
const choices = computed(() => props.options ?? localOptions.value ?? []);
const field = computed(() => parentField?.field?.states);
const fieldProps = computed(() => parentField?.field?.props ?? {});
const selected = computed(() => {
  if (props.modelValue !== undefined) return props.modelValue;
  return field.value?.value === undefined ? localValue.value : field.value.value;
});
const hasValue = computed(() => selected.value != null && selected.value !== '');
const valuePath = computed(() => locatePath(choices.value, selected.value));
const valueOption = computed(() => valuePath.value.at(-1));
const valueSegments = computed(() => segments(valuePath.value));
const shownValue = computed(() => props.pathSeparator
  ? valueSegments.value.map(segment => segment.label).filter(Boolean).join(props.pathSeparator)
  : labelOf(valueOption.value));
const columns = computed(() => [{ options: choices.value, level: 0 }, ...activePath.value.flatMap((parent, index) => {
  const options = childrenOf(parent, index);
  return options.length ? [{ options, parent, level: index + 1 }] : [];
})]);
const inSearch = computed(() => props.filter && query.value.trim().length > 0);
const searchIndex = computed(() => new Fuse(collectLeaves(choices.value), {
  threshold: 0.3, keys: props.filterFields?.length ? props.filterFields : ['pathLabels'], ignoreLocation: true,
}));
const results = computed(() => inSearch.value ? searchIndex.value.search(query.value.trim()).map(match => match.item) : []);
const teleported = computed(() => props.appendTo !== 'self');
const target = computed(() => teleported.value && props.appendTo ? props.appendTo : 'body');
const overlayStyle = computed(() => ({
  ...(teleported.value && { position: 'fixed', ...coordinates.value }),
  ...(props.overlayStyle ?? props.panelStyle ?? {}),
}));
const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([key]) =>
  key !== 'class' && key !== 'style' && !key.startsWith('on'))));
const internalSlots = [
  'default', 'dropdownicon', 'clearicon', 'loadingicon', 'optiongroupicon', 'option', 'value',
  'value-extra', 'option-extra', 'header', 'footer',
];
watch(() => props.options, options => { if (options) localOptions.value = options; });
watch(query, value => {
  searchFocus.value = -1;
  if (!value.trim()) activePath.value = valuePath.value.slice(0, -1);
});
onBeforeMount(async () => { if (props.getOptions) localOptions.value = await props.getOptions(); });
onMounted(() => {
  useEventListener(document, 'pointerdown', outside, true);
  useEventListener(window, 'resize', position);
  useEventListener(window, 'scroll', position, { capture: true, passive: true });
});
onBeforeUnmount(() => { scrollLocked.value = false; });

function optionField(option, field, fallback = option) {
  if (!field) return fallback;
  return typeof field === 'function' ? field(option) : option?.[field];
}
function labelOf(option, group = false) {
  if (option == null) return '';
  return String(optionField(option, group ? props.optionGroupLabel : props.optionLabel, option?.label ?? option));
}
function childrenOf(option, level) {
  const getter = props.optionGroupChildren;
  const property = Array.isArray(getter) ? getter[level] : getter;
  const children = typeof property === 'function' ? property(option, level)
    : property ? option?.[property] : getter === undefined ? option?.children : undefined;
  return Array.isArray(children) ? children : [];
}
function leaf(option, level) {
  const children = childrenOf(option, level);
  if (!children.length) return true;
  const getter = props.optionLeaf;
  return (typeof getter === 'function' ? getter(option, { level, children }) : option?.[getter]) === true;
}
const group = (option, level) => !leaf(option, level);
const disabledOption = option => Boolean(optionField(option, props.optionDisabled, false));
function matches(option, value) {
  if (props.dataKey && option && value && typeof value === 'object') return option[props.dataKey] === value[props.dataKey];
  return optionField(option, props.optionValue) === value;
}
function locatePath(options, value, level = 0) {
  for (const option of options) {
    if (leaf(option, level)) {
      if (matches(option, value)) return [option];
      continue;
    }
    const path = locatePath(childrenOf(option, level), value, level + 1);
    if (path.length) return [option, ...path];
  }
  return [];
}
function segments(path) {
  return path.map((option, index) => ({
    option, label: labelOf(option, index < path.length - 1), visual: option?.image
      ? { image: option.image, darkImage: option.darkImage || option.image } : { icon: option?.icon },
  }));
}
function collectLeaves(options, level = 0, parents = []) {
  return options.flatMap(option => {
    const path = [...parents, option];
    if (group(option, level)) return collectLeaves(childrenOf(option, level), level + 1, path);
    const pathSegments = segments(path);
    return [{ option, level, path, pathSegments, pathLabels: pathSegments.map(segment => segment.label).filter(Boolean).join(props.pathSeparator ?? ' / ') }];
  });
}
function highlights(label) {
  const text = String(label ?? '');
  const token = query.value.trim();
  if (!text || !token) return [{ text }];
  const source = text.toLocaleLowerCase(props.searchLocale);
  const needle = token.toLocaleLowerCase(props.searchLocale);
  const parts = [];
  let offset = 0;
  for (let start = source.indexOf(needle); start >= 0; start = source.indexOf(needle, offset)) {
    if (start > offset) parts.push({ text: text.slice(offset, start) });
    parts.push({ text: text.slice(start, start + token.length), matched: true });
    offset = start + token.length;
  }
  if (offset < text.length) parts.push({ text: text.slice(offset) });
  return parts;
}
function passThrough(name, context = {}) {
  const options = { props, state: { overlayVisible: opened.value }, ...context };
  const all = typeof props.pt === 'function' ? props.pt(options) : props.pt;
  const part = typeof all?.[name] === 'function' ? all[name](options) : all?.[name];
  return typeof part === 'string' ? { class: part } : part ?? {};
}
function changeProps() {
  const { optionLabel, optionValue, optionGroupLabel, optionGroupChildren, optionLeaf } = props;
  return {
    options: choices.value, optionLabel, optionValue, optionGroupLabel, optionGroupChildren, optionLeaf,
    ...Object.fromEntries(Object.entries(attrs).filter(([, value]) => typeof value !== 'function')),
  };
}
function update(value, originalEvent) {
  localValue.value = value;
  emit('update:modelValue', value);
  emit('valueChange', value);
  const event = { originalEvent, value, props: changeProps() };
  fieldProps.value.onChange?.(event);
  props.onChange?.(event);
  if (field.value?.invalid && parentField?.name) parentField.$pcForm?.validate?.(parentField.name);
}
function show(event) {
  if (props.disabled || opened.value) return;
  emit('beforeShow');
  query.value = '';
  searchFocus.value = -1;
  activePath.value = valuePath.value.slice(0, -1);
  opened.value = true;
  scrollLocked.value = true;
  nextTick(() => {
    position();
    if (props.filter) searchInput.value?.focus();
    else if (props.autoOptionFocus) focusColumn(0);
    emit('show');
  });
  if (event) emit('click', event);
}
function hide() {
  if (!opened.value) return;
  emit('beforeHide');
  opened.value = false;
  scrollLocked.value = false;
  query.value = '';
  focus.value = { level: 0, index: -1 };
  searchFocus.value = -1;
  emit('hide');
}
function setGroup(option, level, originalEvent) {
  if (disabledOption(option) || leaf(option, level)) return;
  activePath.value = [...activePath.value.slice(0, level), option];
  emit('groupChange', { originalEvent, value: optionField(option, props.optionValue), props: changeProps() });
}
function hoverOption(option, level, index) {
  if (props.focusOnHover) focus.value = { level, index };
  if (group(option, level)) setGroup(option, level);
}
function choose(option, level, event) {
  if (disabledOption(option)) return;
  if (group(option, level)) {
    setGroup(option, level, event);
    nextTick(() => focusColumn(level + 1));
    return;
  }
  update(optionField(option, props.optionValue), event);
  hide();
  trigger.value?.focus();
}
function clear(event) {
  update(null, event);
  hide();
  trigger.value?.focus();
}
function focusColumn(level, index = -1, direction = 1) {
  const options = columns.value[level]?.options ?? [];
  const next = nextEnabledIndex(options, index, direction, disabledOption);
  focus.value = { level, index: next };
  if (next >= 0) nextTick(() => overlay.value?.querySelector(`[data-level="${level}"][data-index="${next}"]`)?.focus());
}
function focusSearch(direction) {
  const next = nextEnabledIndex(results.value, searchFocus.value, direction, item => disabledOption(item.option));
  searchFocus.value = next;
  if (next >= 0) nextTick(() => overlay.value?.querySelector(`[data-search-index="${next}"]`)?.focus());
}
function triggerKey(event) {
  if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    show(event);
  } else if (event.key === 'Escape' && opened.value) {
    event.preventDefault();
    hide();
  }
}
function panelKey(event) {
  if (event.key === 'Escape' || event.key === 'Tab') {
    hide();
    trigger.value?.focus();
    return;
  }
  const { level, index } = focus.value;
  const selected = inSearch.value ? results.value[searchFocus.value]?.option : columns.value[level]?.options[index];
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    if (inSearch.value) focusSearch(direction);
    else focusColumn(level, index, direction);
  } else if (selected && ['Enter', ' '].includes(event.key)) {
    event.preventDefault();
    choose(selected, inSearch.value ? results.value[searchFocus.value].level : level, event);
  } else if (!inSearch.value && event.key === 'ArrowRight' && selected && group(selected, level)) {
    setGroup(selected, level, event);
    nextTick(() => focusColumn(level + 1));
  } else if (!inSearch.value && event.key === 'ArrowLeft' && level > 0) {
    activePath.value = activePath.value.slice(0, -1);
    nextTick(() => focusColumn(level - 1));
  }
}
function searchKey(event) {
  if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault();
    focusSearch(searchFocus.value < 0 ? 1 : event.key === 'ArrowDown' ? 1 : -1);
  } else if (['Enter', ' ', 'Escape', 'Tab'].includes(event.key)) panelKey(event);
}
function inside(node) { return node && (root.value?.contains(node) || overlay.value?.contains(node)); }
function outside(event) { if (!inside(event.target)) hide(); }
function position() {
  if (!opened.value || !teleported.value || !root.value) return;
  const bounds = root.value.getBoundingClientRect();
  const width = overlay.value?.offsetWidth ?? 224;
  const height = overlay.value?.offsetHeight ?? 400;
  const top = bounds.bottom + 4 + height > innerHeight && bounds.top > height + 4 ? bounds.top - height - 4 : bounds.bottom + 4;
  coordinates.value = { top: Math.max(8, top) + 'px', left: Math.min(Math.max(8, bounds.left), Math.max(8, innerWidth - width - 8)) + 'px' };
}
function blur(event) {
  nextTick(() => {
    if (!opened.value && !inside(event.relatedTarget) && !inside(document.activeElement)) fieldProps.value.onBlur?.(event);
  });
  emit('blur', event);
}
function keepFocus(event) {
  if (opened.value && (inside(event.relatedTarget) || inside(document.activeElement))) event.stopPropagation();
}
function panelFocusOut(event) {
  if (opened.value && (!event.relatedTarget || inside(event.relatedTarget) || inside(document.activeElement))) event.stopPropagation();
}
function optionContext(option, level, index) {
  return { option, index, level, optionGroup: group(option, level), leaf: leaf(option, level),
    active: activePath.value[level] === option, disabled: disabledOption(option) };
}
</script>

<template>
  <div ref="root" v-bind="{ ...rootAttrs, ...passThrough('root') }" class="m-input-cascade-select w-full"
    :class="[size, { 'is-open': opened, 'p-invalid': invalid, 'p-disabled': disabled }, $attrs.class]" :style="$attrs.style" @focusout="keepFocus">
    <button :id="inputId" ref="trigger" type="button" class="m-input-cascade-select-trigger" :class="inputClass" :style="inputStyle"
      :disabled="disabled" :tabindex="tabindex ?? 0" :name="name" role="combobox" :aria-expanded="opened" :aria-controls="panelId"
      :aria-label="ariaLabel" :aria-labelledby="ariaLabelledby" :aria-disabled="disabled || undefined"
      v-bind="{ ...inputProps, ...passThrough('input') }" @click="opened ? hide() : show($event)"
      @keydown="triggerKey" @focus="emit('focus', $event)" @blur="blur">
      <span class="m-input-cascade-select-value" :class="{ 'tt-inactive opacity-80': !hasValue }">
        <slot name="value" :value="valueOption" :placeholder="placeholder" :path="valuePath" :path-segments="valueSegments">
          <span v-if="valueOption" class="selectitem">
            <span>{{ shownValue }}</span><slot name="value-extra" :value="valueOption" />
          </span>
          <span v-else class="tt-secondary opacity-54">{{ placeholder }}</span>
        </slot>
      </span>
      <span v-if="showClear && hasValue" class="m-input-cascade-select-clear" role="button" tabindex="-1" @mousedown.stop @click.stop="clear">
        <slot name="clearicon" :clear-callback="clear">
          <Icon name="base/rx_ic_delete" :size="16" color="var(--cascadeselect-clear-icon-color, var(--colors-icon-icon-secondary))" />
        </slot>
      </span>
      <span class="m-input-cascade-select-dropdown-icon" :class="{ 'is-open': opened }">
        <slot v-if="loading" name="loadingicon"><i class="pi pi-spinner pi-spin" aria-hidden="true"></i></slot>
        <slot v-else name="dropdownicon">
          <Icon name="base/rx_ic_chevron_down" :size="16" color="var(--cascadeselect-dropdown-color, var(--colors-icon-icon-secondary))" />
        </slot>
      </span>
    </button>
    <input v-if="name" type="hidden" :name="name" :value="typeof selected === 'object' ? '' : selected ?? ''" />
    <Teleport :to="target" :disabled="!teleported">
      <Transition name="m-cascade-fade">
        <div v-if="opened" :id="panelId" ref="overlay" class="m-input-cascade-select-panel" :class="[overlayClass, panelClass]"
          :style="overlayStyle" role="presentation" v-bind="{ ...panelProps, ...overlayProps, ...passThrough('overlay') }"
          @wheel.stop @touchmove.stop @focusout="panelFocusOut">
          <slot name="header" :value="selected" :options="choices" />
          <div class="m-input-cascade-select-body">
            <div v-if="filter" class="m-input-cascade-select-filter" @click.stop @mousedown.stop>
              <FormFieldIsolate>
                <TextInput ref="searchInput" v-model="query" size="xs" pre-icon="base/rx_ic_magnify"
                  :placeholder="searchMessage ?? $t('搜索内容')" :form-control="{ novalidate: true }" @keydown="searchKey" />
              </FormFieldIsolate>
            </div>
            <div v-if="inSearch" class="m-input-cascade-select-search-results" role="listbox" @keydown="panelKey">
              <div v-if="!results.length" class="m-input-cascade-select-empty">{{ emptySearchMessage ?? $t('暂无查询结果') }}</div>
              <button v-for="(item, index) in results" :key="dataKey ? item.option[dataKey] : 'search-' + index"
                type="button" :data-search-index="index" class="m-input-cascade-select-option m-input-cascade-select-search-option"
                :class="{ 'is-selected': valueOption === item.option, 'is-focused': searchFocus === index, 'is-disabled': disabledOption(item.option) }"
                :disabled="disabledOption(item.option)" role="option" tabindex="-1" @mousedown.prevent
                @mouseenter="searchFocus = index" @click="choose(item.option, item.level, $event)">
                <span class="m-input-cascade-select-option-content">
                  <slot name="option" :option="item.option" :selected="valueOption === item.option" :level="item.level"
                    :option-group="false" :leaf="true" :disabled="disabledOption(item.option)" :path="item.path">
                    <span class="selectitem selectitem--path">
                      <template v-for="(segment, idx) in item.pathSegments" :key="dataKey ? segment.option?.[dataKey] ?? idx : idx">
                        <span v-if="idx > 0" class="selectitem__separator" aria-hidden="true">{{ pathSeparator ?? '/' }}</span>
                        <span class="selectitem__segment">
                          <img v-if="segment.visual.image" class="selectitem__image" :src="darkMode ? segment.visual.darkImage : segment.visual.image" alt="" />
                          <Icon v-else-if="segment.visual.icon" :name="segment.visual.icon" :color="iconColor" fallback="base/rx_ic_earth" />
                          <span class="selectitem__label">
                            <template v-for="(part, partIndex) in highlights(segment.label)" :key="partIndex">
                              <mark v-if="part.matched" class="selectitem__match">{{ part.text }}</mark>
                              <template v-else>{{ part.text }}</template>
                            </template>
                          </span>
                        </span>
                      </template>
                      <slot name="option-extra" :option="item.option" />
                    </span>
                  </slot>
                </span>
              </button>
            </div>
            <div v-else class="m-input-cascade-select-columns" role="menu" @keydown="panelKey">
              <div v-for="column in columns" :key="column.level" class="m-input-cascade-select-column"
                :class="passThrough('optionList', { level: column.level })" @wheel.stop @touchmove.stop>
                <div v-if="!column.options.length" class="m-input-cascade-select-empty">{{ emptyMessage ?? 'No available options' }}</div>
                <button v-for="(option, index) in column.options" :key="dataKey ? option[dataKey] : column.level + '-' + index"
                  type="button" :data-level="column.level" :data-index="index" class="m-input-cascade-select-option"
                  :class="[{ 'is-selected': valueOption === option, 'is-focused': focus.level === column.level && focus.index === index,
                    'is-active': activePath[column.level] === option, 'is-disabled': disabledOption(option), 'is-group': group(option, column.level) },
                    passThrough('option', { option, context: optionContext(option, column.level, index) }).class]"
                  :disabled="disabledOption(option)" role="menuitem" :aria-haspopup="group(option, column.level) || undefined"
                  :aria-expanded="group(option, column.level) ? activePath[column.level] === option : undefined" tabindex="-1"
                  @mousedown.prevent @mouseenter="hoverOption(option, column.level, index)"
                  @click="leaf(option, column.level) && choose(option, column.level, $event)">
                  <span class="m-input-cascade-select-option-content">
                    <slot name="option" :option="option" :selected="valueOption === option" :level="column.level"
                      :option-group="group(option, column.level)" :leaf="leaf(option, column.level)" :disabled="disabledOption(option)">
                      <span class="selectitem">
                        <Icon v-if="option.icon || icon" :name="option.icon || icon" :color="iconColor" fallback="base/rx_ic_earth" />
                        <img v-if="option.image" class="selectitem__image" :src="darkMode ? option.darkImage : option.image" alt="" />
                        <span>{{ labelOf(option, group(option, column.level)) }}</span>
                        <slot name="option-extra" :option="option" />
                      </span>
                    </slot>
                  </span>
                  <span v-if="group(option, column.level)" class="m-input-cascade-select-group-icon">
                    <slot name="optiongroupicon">
                      <Icon name="base/rx_ic_chevron_down" size="var(--cascadeselect-option-icon-size, 0.875rem)"
                        color="var(--cascadeselect-option-icon-color, var(--colors-icon-icon-secondary))" />
                    </slot>
                  </span>
                </button>
              </div>
            </div>
          </div>
          <slot name="footer" :value="selected" :options="choices" />
        </div>
      </Transition>
    </Teleport>
    <template v-for="name in Object.keys($slots).filter(name => !internalSlots.includes(name))" :key="name">
      <slot :name="name" />
    </template>
  </div>
</template>
