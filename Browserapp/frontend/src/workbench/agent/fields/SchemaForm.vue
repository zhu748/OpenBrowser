<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, useTemplateRef, watch } from './workbench-vue.js';
import { t as translate } from './locales-BfKu2SD4.js';
import { localizeSchema, normalizeSchema, createUiSchema, createValidator, JsonForms } from './ScriptSchemaForm-z_48GvPJ.js';
import { createRenderers, createStyles } from './workbench-agent-schema-renderers.js';

const props = defineProps({
  schema: Object,
  data: Object,
  draft: Boolean,
  locale: { type: String, default: 'en' },
  readonly: Boolean,
  showValidationErrors: Boolean,
});
const emit = defineEmits(['change', 'schemaError']);
const root = useTemplateRef('formRoot');
const renderers = createRenderers();
const config = Object.freeze({ showUnfocusedDescription: true });
provide('styles', createStyles());

const localized = computed(() => localizeSchema(props.schema, props.locale));
const schema = computed(() => normalizeSchema(localized.value));
const uiSchema = computed(() => createUiSchema(localized.value));
const validation = computed(() => {
  const ajv = createValidator(schema.value);
  if (props.draft) return { ajv, error: '' };
  try {
    ajv.compile(schema.value);
    return { ajv, error: '' };
  } catch (error) {
    return { ajv, error: error instanceof Error ? error.message : translate('脚本入参 Schema 无效') };
  }
});
watch(() => validation.value.error, error => emit('schemaError', error), { immediate: true });

const labels = {
  addTooltip: '添加',
  addAriaLabel: '添加参数项',
  removeTooltip: '删除',
  removeAriaLabel: '删除参数项',
  upAriaLabel: '上移参数项',
  downAriaLabel: '下移参数项',
  noDataMessage: '暂无数据',
  clearDialogTitle: '切换参数类型',
  clearDialogMessage: '切换类型会清空当前参数，是否继续？',
  clearDialogAccept: '继续',
  clearDialogDecline: '取消',
};
const errors = {
  required: '此项为必填项',
  type: '参数类型不正确',
  format: '参数格式不正确',
  enum: '请选择有效选项',
  const: '参数值不正确',
  minimum: '参数值低于允许范围',
  maximum: '参数值超出允许范围',
  minLength: '输入内容过短',
  maxLength: '输入内容过长',
  minItems: '列表项数量不足',
  maxItems: '列表项数量过多',
  pattern: '输入内容格式不正确',
  additionalProperties: '包含不支持的参数',
};
const i18n = computed(() => ({
  locale: props.locale,
  translate(key, fallback) {
    const name = key.split('.').at(-1) || key;
    return Object.hasOwn(labels, name) ? translate(labels[name]) : fallback;
  },
  translateError(error) {
    if (Object.hasOwn(errors, error.keyword)) return translate(errors[error.keyword]);
    return error.message || translate('参数校验失败');
  },
}));

function updateDescriptionTitles() {
  return nextTick(() => {
    root.value?.querySelectorAll('.script-jsonforms__description').forEach(description => {
      const text = description.textContent?.trim();
      if (text && description.scrollWidth > description.clientWidth + 1) description.title = text;
      else description.removeAttribute('title');
    });
  });
}

function getControl(target) {
  if (!(target instanceof HTMLElement)) return;
  const control = target.closest('.script-jsonforms__control');
  if (control && root.value?.contains(control)) return control;
}

function markTouched(control) {
  control.classList.add('script-jsonforms__control--touched');
}

function handleBlur(event) {
  const control = getControl(event.target);
  if (control && !(event.relatedTarget instanceof Node && control.contains(event.relatedTarget))) markTouched(control);
}

function handleInput(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) || event.isComposing) return;
  const control = getControl(input);
  if (!control) return;
  markTouched(control);
  if (['number', 'checkbox', 'radio'].includes(input.type)) return;
  if (input.validity.badInput) return;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function handleWheel(event) {
  const input = event.target;
  if (input instanceof HTMLInputElement && input.type === 'number' && document.activeElement === input) {
    event.preventDefault();
  }
}

let resizeObserver;
let mutationObserver;
onMounted(() => {
  if (!root.value) return;
  resizeObserver = new ResizeObserver(updateDescriptionTitles);
  resizeObserver.observe(root.value);
  mutationObserver = new MutationObserver(updateDescriptionTitles);
  mutationObserver.observe(root.value, { childList: true, characterData: true, subtree: true });
  updateDescriptionTitles();
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  mutationObserver?.disconnect();
});
watch(localized, updateDescriptionTitles, { flush: 'post' });
watch(() => props.schema, () => nextTick(() => {
  root.value?.querySelectorAll('.script-jsonforms__control--touched').forEach(control => {
    control.classList.remove('script-jsonforms__control--touched');
  });
}));

function handleChange({ data, errors }) {
  emit('change', { data, errors: errors ?? [] });
}
</script>

<template>
  <div ref="formRoot" class="script-jsonforms" :class="{ 'script-jsonforms--show-errors': showValidationErrors }"
    @input="handleInput" @focusout="handleBlur" @wheel="handleWheel">
    <p v-if="validation.error" class="script-jsonforms__schema-error" role="alert">
      {{ $t('脚本入参 Schema 无效') }}：{{ validation.error }}
    </p>
    <JsonForms v-else :data="data" :schema="schema" :uischema="uiSchema" :renderers="renderers" :config="config"
      :readonly="readonly" :ajv="validation.ajv" :i18n="i18n"
      :validation-mode="draft ? 'NoValidation' : 'ValidateAndShow'" @change="handleChange" />
  </div>
</template>
