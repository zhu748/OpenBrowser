<script setup>
import {
  computed,
  inject,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from "./workbench-vue.js";
import { Cr as isFunction } from "./utils-BIWenCnY.js";
import { m as useScrollLock, o as useEventListener } from "./dist-NctnpPRe.js";
import { Z as Icon } from "./basecomponent-ClhuVxJN.js";
import { t as TextInput } from "./m-input-text-JVbCgVJP.js";
import {
  FormFieldIsolate,
  nextEnabledIndex,
} from "./workbench-form-providers.js";
import { createSelectOptionModel, indexOfSelectedOption } from "./workbench-select-options.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: {},
  defaultValue: {},
  name: {},
  options: {},
  optionLabel: { type: [String, Function], default: "label" },
  optionValue: {},
  optionDisabled: {},
  placeholder: {},
  disabled: { type: Boolean },
  invalid: { type: Boolean },
  showClear: { type: Boolean, default: false },
  showDropdownIcon: { type: Boolean, default: true },
  checkmark: { type: Boolean, default: false },
  highlightOnSelect: { type: Boolean, default: true },
  emptyMessage: {},
  scrollHeight: { default: "14rem" },
  appendTo: {},
  inputId: {},
  tabindex: {},
  ariaLabel: {},
  ariaLabelledby: {},
  overlayStyle: {},
  overlayClass: {},
  panelStyle: {},
  panelClass: {},
  overlayAutoWidth: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  filter: { type: Boolean, default: false },
  filterPlaceholder: {},
  filterMatchMode: { default: "contains" },
  filterFields: {},
  filterLocale: {},
  icon: {},
  iconColor: { default: "var(--colors-text-text-primary, #171c1f)" },
  size: { default: "sm" },
  fluid: { type: Boolean },
  darkMode: { type: Boolean, default: false },
  getOptions: {},
  onChange: {},
});
const emit = defineEmits([
  "update:modelValue",
  "focus",
  "blur",
  "beforeShow",
  "beforeHide",
  "show",
  "hide",
]);
const baseOverlayZIndex = 1100;
const { labelOf, valueOf, optionDisabled, valuesEqual, findSelectedOption, findTypedOption, filterOptions } =
  createSelectOptionModel(props);

let attrs = useAttrs(),
  root = useTemplateRef("root"),
  trigger = useTemplateRef("trigger"),
  input = useTemplateRef("input"),
  overlay = useTemplateRef("overlay"),
  searchInput = useTemplateRef("searchInput"),
  parentField = inject("$pcFormField", null),
  fluidContext = inject("$pcFluid", null),
  scrollLocked = useScrollLock(document.body),
  fluidEnabled = computed(() =>
    typeof props.fluid == "boolean"
      ? props.fluid
      : typeof fluidContext != "boolean" || fluidContext,
  ),
  loadedOptions = ref(props.options),
  uncontrolledValue = ref(props.defaultValue),
  opened = ref(false),
  showingAll = ref(false),
  inputText = ref(""),
  query = ref(""),
  focusedIndex = ref(-1),
  focused = ref(false),
  positioned = ref({}),
  zIndex = ref(),
  measuring = ref(false),
  measuredWidth = ref(),
  maxWidthSeen = ref(),
  panelId = `m-select-${useId()}`,
  searchable = computed(() => !!props.editable),
  separateFilter = computed(() => !!props.filter && !searchable.value),
  choices = computed(() => props.options ?? loadedOptions.value ?? []),
  fieldState = computed(() => parentField?.field?.states),
  fieldBindings = computed(() => parentField?.field?.props ?? {}),
  value = computed(() =>
    props.modelValue === undefined
      ? fieldState.value?.value === undefined
        ? uncontrolledValue.value
        : fieldState.value.value
      : props.modelValue,
  ),
  hasValue = computed(
    () =>
      value.value !== null && value.value !== undefined && value.value !== "",
  ),
  showChevron = computed(
    () => props.showDropdownIcon && !(props.showClear && hasValue.value),
  ),
  rootAttrs = computed(() =>
    Object.fromEntries(
      Object.entries(attrs).filter(
        ([e2]) => e2 !== "class" && e2 !== "style" && !e2.startsWith("on"),
      ),
    ),
  ),
  teleportTarget = computed(() =>
    props.appendTo && props.appendTo !== "self" ? props.appendTo : "body",
  ),
  teleported = computed(() => props.appendTo !== "self"),
  panelStyle = computed(() => ({
    maxHeight: props.scrollHeight,
    ...(teleported.value
      ? { position: "fixed", ...positioned.value }
      : { width: "100%" }),
    ...(zIndex.value == null ? {} : { zIndex: zIndex.value }),
    ...(props.overlayStyle ?? props.panelStyle ?? {}),
  }));
let selectedOption = computed(() => findSelectedOption(choices.value, value.value)),
  displayLabel = computed(() =>
    selectedOption.value
      ? labelOf(selectedOption.value)
      : hasValue.value
        ? typeof value.value == "object"
          ? labelOf(value.value)
          : String(value.value)
        : "",
  ),
  selectedIcon = computed(() => {
    let e2 = selectedOption.value;
    if (!e2 || typeof e2 != "object") return null;
    if (e2.image || e2.darkImage)
      return {
        type: "image",
        src: (props.darkMode && e2.darkImage) || e2.image,
      };
    let t2 = e2.icon || props.icon;
    return t2 ? { type: "icon", name: t2 } : null;
  });
let filterText = computed(() =>
    separateFilter.value
      ? query.value.trim()
      : searchable.value && !showingAll.value
        ? inputText.value.trim()
        : "",
  ),
  filteredOptions = computed(() => filterOptions(choices.value, filterText.value));
(watch(choices, () => {
  opened.value &&
    props.overlayAutoWidth &&
    ((measuredWidth.value = undefined), nextTick(() => positionOverlay()));
}),
  watch(
    () => props.options,
    (e2) => {
      e2 && (loadedOptions.value = e2);
    },
  ),
  watch(query, () => {
    opened.value &&
      separateFilter.value &&
      ((focusedIndex.value = filteredOptions.value.findIndex(
        (e2) => !optionDisabled(e2),
      )),
      nextTick(() => positionOverlay()));
  }),
  watch(
    [value, selectedOption, searchable],
    () => {
      searchable.value &&
        (!opened.value || showingAll.value) &&
        (inputText.value = displayLabel.value);
    },
    { immediate: true },
  ),
  onBeforeMount(async () => {
    props.getOptions &&
      isFunction(props.getOptions) &&
      (loadedOptions.value = await props.getOptions());
  }),
  onMounted(() => {
    (useEventListener(document, "pointerdown", clickOutside, true),
      useEventListener(window, "resize", resizeOverlay),
      useEventListener(window, "scroll", positionOverlay, {
        capture: true,
        passive: true,
      }));
  }),
  onBeforeUnmount(() => {
    ((scrollLocked.value = false), (zIndex.value = undefined));
  }));
function changeProps() {
  return {
    options: choices.value,
    optionLabel: props.optionLabel,
    optionValue: props.optionValue,
    editable: props.editable,
    filter: props.filter,
    ...Object.fromEntries(
      Object.entries(attrs).filter(([t2, n2]) => !isFunction(n2)),
    ),
  };
}
function update(nextValue, originalEvent) {
  ((uncontrolledValue.value = nextValue), emit("update:modelValue", nextValue));
  let change = {
    originalEvent: originalEvent,
    value: nextValue,
    props: changeProps(),
  };
  (fieldBindings.value.onChange?.(change),
    props.onChange?.(change),
    fieldState.value?.invalid &&
      parentField?.$pcForm?.validate &&
      parentField?.name &&
      parentField.$pcForm.validate(parentField.name));
}
function open(request) {
  props.disabled ||
    (request?.showAll === true
      ? (showingAll.value = true)
      : request?.showAll === false && (showingAll.value = false),
    (focused.value = true),
    opened.value
      ? nextTick(() => positionOverlay())
      : (emit("beforeShow"),
        (opened.value = true),
        (scrollLocked.value = true),
        (query.value = ""),
        (focusedIndex.value = indexOfSelectedOption(filteredOptions.value, selectedOption.value)),
        nextTick(() => {
          emit("show");
        })));
}
function close() {
  opened.value &&
    (emit("beforeHide"),
    (opened.value = false),
    (scrollLocked.value = false),
    (showingAll.value = false),
    (focusedIndex.value = -1),
    (query.value = ""),
    (measuredWidth.value = undefined),
    (maxWidthSeen.value = undefined),
    (measuring.value = false),
    emit("hide"),
    nextTick(() => {
      focusInside() || (focused.value = false);
    }));
}
function toggle(event, showAll = false) {
  opened.value && !showAll
    ? close()
    : opened.value && showAll
      ? open({ showAll: true, event: event })
      : open({ showAll: showAll, event: event });
}
function choose(option, event) {
  if (optionDisabled(option)) return;
  let chosenValue = valueOf(option);
  ((inputText.value = labelOf(option)),
    (showingAll.value = false),
    update(chosenValue, event),
    close(),
    searchable.value ? input.value?.focus() : trigger.value?.focus());
}
function clear(event) {
  (event?.stopPropagation(),
    (inputText.value = ""),
    (showingAll.value = false),
    update(null, event),
    close(),
    searchable.value ? input.value?.focus() : trigger.value?.focus());
}
function clearCallback(event) {
  clear(event);
}
function commitInput(event) {
  if (!searchable.value) return;
  let text = inputText.value.trim();
  if (!text) {
    hasValue.value && update(null, event);
    return;
  }
  const matchedOption = findTypedOption(choices.value, text);
  matchedOption !== undefined
    ? (update(valueOf(matchedOption), event),
      (inputText.value = labelOf(matchedOption)))
    : update(text, event);
}
function typeInput(event) {
  let text = event.target.value;
  ((inputText.value = text),
    (showingAll.value = false),
    open({ event: event }),
    update(text, event),
    (focusedIndex.value = filteredOptions.value.findIndex(
      (e3) => !optionDisabled(e3),
    )));
}
function focusInput(event) {
  ((focused.value = true), emit("focus", event));
}
function openInput(event) {
  (event.stopPropagation(), open({ showAll: true, event: event }));
}
function focusTrigger(event) {
  ((focused.value = true), emit("focus", event));
}
function triggerClick(event) {
  props.disabled ||
    (searchable.value
      ? (open({ showAll: true, event: event }), input.value?.focus())
      : toggle(event));
}
function dropdownClick(event) {
  (event.preventDefault(),
    event.stopPropagation(),
    !props.disabled &&
      (searchable.value
        ? (opened.value && showingAll.value
            ? close()
            : open({ showAll: true, event: event }),
          input.value?.focus())
        : toggle(event)));
}
function moveFocus(direction) {
  focusedIndex.value = nextEnabledIndex(
    filteredOptions.value,
    focusedIndex.value,
    direction,
    optionDisabled,
  );
  nextTick(scrollToFocused);
}
function scrollToFocused() {
  focusedIndex.value < 0 ||
    overlay.value
      ?.querySelector(`[data-option-index="${focusedIndex.value}"]`)
      ?.scrollIntoView({ block: "nearest" });
}
function handleKey(event) {
  if (!props.disabled)
    switch (event.key) {
      case "ArrowDown":
        (event.preventDefault(),
          opened.value
            ? moveFocus(1)
            : open({ showAll: searchable.value, event: event }));
        break;
      case "ArrowUp":
        (event.preventDefault(),
          opened.value
            ? moveFocus(-1)
            : open({ showAll: searchable.value, event: event }));
        break;
      case "Home":
        opened.value &&
          (event.preventDefault(),
          (focusedIndex.value = filteredOptions.value.findIndex(
            (e3) => !optionDisabled(e3),
          )),
          nextTick(() => scrollToFocused()));
        break;
      case "End":
        if (opened.value) {
          event.preventDefault();
          for (let e3 = filteredOptions.value.length - 1; e3 >= 0; e3--)
            if (!optionDisabled(filteredOptions.value[e3])) {
              focusedIndex.value = e3;
              break;
            }
          nextTick(() => scrollToFocused());
        }
        break;
      case "Enter":
        (event.preventDefault(),
          opened.value && focusedIndex.value >= 0
            ? choose(filteredOptions.value[focusedIndex.value], event)
            : searchable.value
              ? (commitInput(event), close())
              : opened.value || open({ event: event }));
        break;
      case "Escape":
        opened.value &&
          (event.preventDefault(),
          close(),
          searchable.value && (inputText.value = displayLabel.value));
        break;
      case "Tab":
        (searchable.value && commitInput(event), close());
        break;
      case " ":
        !searchable.value &&
          !editableElement(event.target) &&
          (event.preventDefault(),
          opened.value && focusedIndex.value >= 0
            ? choose(filteredOptions.value[focusedIndex.value], event)
            : open({ event: event }));
    }
}
function editableElement(element) {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  );
}
function clickOutside(event) {
  if (!opened.value) return;
  let target = event.target;
  !root.value?.contains(target) &&
    !overlay.value?.contains(target) &&
    (searchable.value && commitInput(event),
    close(),
    searchable.value && (inputText.value = displayLabel.value));
}
function computeZIndex() {
  let largest = baseOverlayZIndex,
    element = root.value;
  for (; element && element !== document.documentElement; ) {
    let n2 = Number.parseInt(getComputedStyle(element).zIndex, 10);
    (Number.isNaN(n2) || (largest = Math.max(largest, n2)),
      (element = element.parentElement));
  }
  return largest + 1;
}
function enterOverlay() {
  ((zIndex.value = computeZIndex()),
    (measuredWidth.value = undefined),
    (maxWidthSeen.value = undefined),
    nextTick(() => {
      (positionOverlay(),
        scrollToFocused(),
        separateFilter.value && searchInput.value?.focus());
    }));
}
function resizeOverlay() {
  ((measuredWidth.value = undefined), positionOverlay());
}
function finishMeasuring() {
  let panel = overlay.value,
    anchor = root.value;
  if (!opened.value || !panel || !anchor) {
    measuring.value = false;
    return;
  }
  let anchorWidth = anchor.getBoundingClientRect().width,
    limit = Math.max(anchorWidth, window.innerWidth - 16),
    width = Math.min(Math.max(panel.offsetWidth, 0), limit);
  ((maxWidthSeen.value = Math.max(maxWidthSeen.value ?? 0, width)),
    (measuredWidth.value = Math.min(maxWidthSeen.value, limit)),
    (measuring.value = false),
    positionOverlay());
}
function leaveOverlay() {
  zIndex.value = undefined;
}
function positionOverlay() {
  if (!opened.value || !root.value || !teleported.value) return;
  let bounds = root.value.getBoundingClientRect(),
    panel = overlay.value,
    anchorWidth = bounds.width,
    autoWidth = props.overlayAutoWidth;
  if (autoWidth && measuring.value) return;
  if (autoWidth && measuredWidth.value == null) {
    ((measuring.value = true),
      (positioned.value = {
        top: `${bounds.bottom + 4}px`,
        left: `${Math.max(8, bounds.left)}px`,
        width: "max-content",
        maxWidth: "none",
      }),
      nextTick(() => finishMeasuring()));
    return;
  }
  let limit = Math.max(anchorWidth, window.innerWidth - 16),
    width = autoWidth ? (measuredWidth.value ?? anchorWidth) : anchorWidth,
    height = panel?.offsetHeight ?? 200,
    top =
      bounds.bottom + 4 + height > window.innerHeight && bounds.top > height + 4
        ? bounds.top - height - 4
        : bounds.bottom + 4,
    left = Math.min(
      Math.max(8, bounds.left),
      Math.max(8, window.innerWidth - width - 8),
    );
  positioned.value = {
    top: `${Math.max(8, top)}px`,
    left: `${left}px`,
    ...(autoWidth
      ? { width: `${width}px`, maxWidth: `${limit}px` }
      : { width: `${anchorWidth}px` }),
  };
}
function containsFocusTarget(node) {
  return node
    ? !!(root.value?.contains(node) || overlay.value?.contains(node))
    : false;
}
function focusInside(relatedTarget, activeElement = document.activeElement) {
  return (
    containsFocusTarget(relatedTarget) || containsFocusTarget(activeElement)
  );
}
function blur(event) {
  (nextTick(() => {
    opened.value ||
      focusInside(event.relatedTarget) ||
      ((focused.value = false),
      searchable.value &&
        (commitInput(event), (inputText.value = displayLabel.value)),
      fieldBindings.value.onBlur?.(event));
  }),
    emit("blur", event));
}
function rootFocusOut(event) {
  opened.value && focusInside(event.relatedTarget) && event.stopPropagation();
}
function overlayFocusOut(event) {
  if (!opened.value) return;
  let target = event.relatedTarget;
  (focusInside(target) || !target) && event.stopPropagation();
}
function isSelected(option) {
  return props.highlightOnSelect
    ? selectedOption.value
      ? option === selectedOption.value
      : props.optionValue
        ? valueOf(option) === value.value
        : valuesEqual(option, value.value)
    : false;
}
function optionClasses(option, index) {
  return [
    "m-input-select-option",
    {
      "is-selected": isSelected(option),
      "is-focused": focusedIndex.value === index,
      "is-disabled": optionDisabled(option),
    },
  ];
}
defineExpose({ open, close });
</script>

<template>
  <div
    ref="root"
    v-bind="rootAttrs"
    class="m-input-select"
    :style="$attrs.style"
    :class="[
      size,
      {
        'is-fluid': fluidEnabled,
        'is-open': opened,
        'is-searchable': searchable,
        'p-invalid': invalid || fieldState?.invalid,
        'p-disabled': disabled,
      },
      $attrs.class,
    ]"
    @focusout="rootFocusOut"
  >
    <div
      v-if="searchable"
      class="m-input-select-trigger"
      :class="{ 'p-focus': focused || opened, 'p-disabled': disabled }"
      @click="triggerClick"
    >
      <div class="selectitem m-input-select-editable">
        <template v-if="selectedIcon">
          <img
            v-if="selectedIcon.type === 'image'"
            class="selectitem__image"
            :src="selectedIcon.src"
            alt=""
          />
          <Icon
            v-else
            :name="selectedIcon.name"
            :color="iconColor"
            fallback="base/rx_ic_earth"
          />
        </template>
        <div class="m-input-select-field">
          <input
            :id="inputId"
            ref="input"
            type="text"
            class="m-input-select-input"
            :class="{
              'is-custom-placeholder': $slots.placeholder && !inputText,
            }"
            :value="inputText"
            :placeholder="placeholder"
            :disabled="disabled"
            :tabindex="tabindex ?? 0"
            role="combobox"
            :aria-expanded="opened"
            :aria-controls="panelId"
            :aria-label="ariaLabel"
            :aria-labelledby="ariaLabelledby"
            autocomplete="off"
            @focus="focusInput"
            @blur="blur"
            @input="typeInput"
            @keydown="handleKey"
            @click="openInput"
          />
          <span
            v-if="$slots.placeholder && !inputText"
            class="m-input-select-placeholder m-input-select-placeholder--overlay"
            ><slot name="placeholder"
          /></span>
        </div>
      </div>
      <span
        v-if="showClear && hasValue"
        class="m-input-select-clear"
        role="button"
        tabindex="-1"
        @mousedown.prevent
        @click="clear"
      >
        <slot name="clearicon" :clear-callback="clearCallback"
          ><Icon
            name="base/rx_ic_delete"
            size="16"
            color="var(--colors-icon-icon-secondary)"
        /></slot>
      </span>
      <span
        v-if="showChevron"
        class="m-input-select-dropdown-icon"
        @mousedown.prevent
        @click="dropdownClick"
      >
        <slot name="dropdownicon"
          ><Icon
            name="base/rx_ic_chevron_down"
            size="16"
            color="var(--colors-icon-icon-secondary)"
        /></slot>
      </span>
    </div>
    <button
      v-else
      :id="inputId"
      ref="trigger"
      type="button"
      class="m-input-select-trigger"
      :class="{ 'p-focus': focused || opened, 'p-disabled': disabled }"
      :disabled="disabled"
      :tabindex="tabindex ?? 0"
      :name="name"
      role="combobox"
      :aria-expanded="opened"
      :aria-controls="panelId"
      :aria-label="ariaLabel"
      :aria-labelledby="ariaLabelledby"
      @click="triggerClick"
      @keydown="handleKey"
      @focus="focusTrigger"
      @blur="blur"
    >
      <span
        class="m-input-select-value"
        :class="{
          'is-placeholder': !hasValue,
          'is-custom-placeholder': !hasValue && !!$slots.placeholder,
        }"
      >
        <slot
          name="value"
          :value="selectedOption ?? value"
          :placeholder="placeholder"
        >
          <template v-if="hasValue">
            <div v-if="selectedOption" class="selectitem">
              <Icon
                v-if="selectedOption.icon || icon"
                :name="selectedOption.icon || icon"
                :color="iconColor"
                fallback="base/rx_ic_earth"
              />
              <img
                v-if="selectedOption.image"
                class="selectitem__image"
                :src="
                  darkMode ? selectedOption.darkImage : selectedOption.image
                "
                alt=""
              />
              <div>{{ displayLabel }}</div>
              <slot name="value-extra" :value="selectedOption" />
            </div>
            <template v-else>{{ displayLabel }}</template>
          </template>
          <span v-else class="m-input-select-placeholder">
            <slot name="placeholder"
              ><span class="m-input-select-placeholder-text">{{
                placeholder
              }}</span></slot
            >
          </span>
        </slot>
      </span>
      <span
        v-if="showClear && hasValue"
        class="m-input-select-clear"
        role="button"
        tabindex="-1"
        @mousedown.prevent
        @click="clear"
      >
        <slot name="clearicon" :clear-callback="clearCallback"
          ><Icon
            name="base/rx_ic_delete"
            size="16"
            color="var(--colors-icon-icon-secondary)"
        /></slot>
      </span>
      <span v-if="showChevron" class="m-input-select-dropdown-icon">
        <slot name="dropdownicon"
          ><Icon
            name="base/rx_ic_chevron_down"
            size="16"
            color="var(--colors-icon-icon-secondary)"
        /></slot>
      </span>
    </button>
    <Teleport :to="teleportTarget" :disabled="!teleported">
      <Transition
        name="m-select-fade"
        @enter="enterOverlay"
        @after-leave="leaveOverlay"
      >
        <div
          v-if="opened"
          :id="panelId"
          ref="overlay"
          class="m-input-select-panel"
          :class="[overlayClass, panelClass, { 'is-measuring': measuring }]"
          :style="panelStyle"
          role="presentation"
          @focusout="overlayFocusOut"
          @keydown="handleKey"
        >
          <slot
            name="header"
            :value="value"
            :options="choices"
            :close="close"
          />
          <div
            v-if="separateFilter"
            class="m-input-select-filter"
            @click.stop
            @mousedown.stop
          >
            <FormFieldIsolate>
              <TextInput
                ref="searchInput"
                v-model="query"
                size="xs"
                pre-icon="base/rx_ic_magnify"
                :placeholder="filterPlaceholder ?? $t('搜索内容')"
                :form-control="{ novalidate: true }"
              />
            </FormFieldIsolate>
          </div>
          <div class="m-input-select-options" role="listbox">
            <div v-if="!filteredOptions.length" class="m-input-select-empty">
              <slot name="empty">{{ emptyMessage ?? $t("暂无数据") }}</slot>
            </div>
            <button
              v-for="(option, index) in filteredOptions"
              :key="optionValue ? String(valueOf(option)) : index"
              type="button"
              :data-option-index="index"
              :class="optionClasses(option, index)"
              :disabled="optionDisabled(option)"
              role="option"
              :aria-selected="isSelected(option)"
              tabindex="-1"
              @mousedown.prevent
              @mouseenter="focusedIndex = index"
              @click="choose(option, $event)"
            >
              <Icon
                v-if="checkmark && isSelected(option)"
                class="m-input-select-check"
                name="base/rx_ic_check"
                size="14"
                color="var(--colors-icon-icon-brand, var(--colors-text-text-brand))"
              />
              <span
                v-else-if="checkmark"
                class="m-input-select-check-spacer"
              ></span>
              <span class="m-input-select-option-content">
                <slot
                  name="option"
                  :option="option"
                  :selected="isSelected(option)"
                  :index="index"
                >
                  <div class="selectitem">
                    <Icon
                      v-if="option?.icon || icon"
                      :name="option?.icon || icon"
                      :color="iconColor"
                      fallback="base/rx_ic_earth"
                    />
                    <img
                      v-if="option?.image"
                      class="selectitem__image"
                      :src="darkMode ? option.darkImage : option.image"
                      alt=""
                    />
                    <div>{{ labelOf(option) }}</div>
                    <slot name="option-extra" :option="option" />
                  </div>
                </slot>
              </span>
            </button>
          </div>
          <div
            v-if="$slots.footer"
            class="m-input-select-footer"
            @mousedown.stop
          >
            <slot
              name="footer"
              :value="value"
              :options="choices"
              :close="close"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
