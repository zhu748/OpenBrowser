import { computed, inject, provide, ref, watch } from './workbench-vue.js';
import { h as useBoundModel } from './dist-NctnpPRe.js';
import { t as merge } from './merge-B7DGYZqS.js';
import { V as any, dt as objectSchema } from './types-Cxql15JH.js';
import { t as rules } from './external-CdTk2m9u.js';
import { cloneSchema } from './workbench-clone-field-schema.js';

const formContext = Symbol('schema-form');

export function useSchemaFormContext() {
  return inject(formContext);
}

export function issues(error) {
  return error.issues ?? error.errors ?? [];
}

export function useSchemaForm(formProps, emit) {
  const formModel = formProps.modelValue
    ? useBoundModel(formProps, 'modelValue', emit, { defaultValue: { ...formProps.initialValues } })
    : ref({ ...formProps.initialValues });
  const innerFormSchemas = ref(cloneSchema(formProps.schemas));
  const originComponentPropsFnMap = new Map();
  const errors = ref({});
  const defaultFormValues = computed(() => ({
    ...formProps.initialValues,
    ...Object.fromEntries(innerFormSchemas.value
      .filter(schema => schema.defaultValue !== undefined)
      .map(schema => [schema.field, schema.defaultValue])),
  }));
  const validationSchema = computed(() => objectSchema(Object.fromEntries(
    innerFormSchemas.value.filter(schema => schema.field && schema.rule).map(schema => [
      schema.field, schema.rule.validator?.(rules, formModel) ?? any(),
    ]),
  )));
  const formState = {
    formModel, defaultFormValues, validationSchema, errors, innerFormSchemas, originComponentPropsFnMap,
  };
  provide(formContext, { formProps, formState });
  watch(innerFormSchemas, schemas => {
    for (const schema of schemas) {
      const { field, componentProps } = schema;
      if (!field) continue;
      if (!originComponentPropsFnMap.has(field) && typeof componentProps === 'function') {
        originComponentPropsFnMap.set(field, componentProps);
      }
      formModel.value[field] ??= defaultFormValues.value[field] ?? '';
    }
  }, { immediate: true });

  function setFieldsValue(values) {
    Object.assign(formModel.value, values);
  }

  function clearValidateMessages() {
    for (const field of Object.keys(errors.value)) errors.value[field] = '';
  }

  function resetFields() {
    for (const field of Object.keys(formModel.value)) {
      formModel.value[field] = defaultFormValues.value[field] ?? '';
    }
    setTimeout(clearValidateMessages);
    emit('reset');
  }

  async function handleSubmit(event) {
    event?.preventDefault();
    const result = validationSchema.value.safeParse(formModel.value);
    clearValidateMessages();
    if (result.success) {
      emit('submit', formModel.value);
      return formModel.value;
    }
    for (const issue of issues(result.error)) errors.value[issue.path[0]] = issue.message;
    throw errors.value;
  }

  async function resetSchema(schema) {
    innerFormSchemas.value = cloneSchema(Array.isArray(schema) ? schema : schema ? [schema] : []);
  }

  function insertSchema(schema, field, after) {
    const index = innerFormSchemas.value.findIndex(item => item.field === field);
    const position = index < 0 ? (after ? innerFormSchemas.value.length : 0) : index + Number(after);
    innerFormSchemas.value = innerFormSchemas.value.toSpliced(position, 0, schema);
  }

  async function removeSchemaByField(fields) {
    const removed = [fields].flat().filter(field => typeof field === 'string');
    for (const field of removed) {
      delete formModel.value[field];
      delete errors.value[field];
      originComponentPropsFnMap.delete(field);
    }
    innerFormSchemas.value = innerFormSchemas.value.filter(schema => !removed.includes(schema.field));
  }

  function getSchemaByField(field) {
    return innerFormSchemas.value.find(schema => schema.field === field);
  }

  function updateSchema(changes) {
    const updates = [changes].flat();
    if (updates.some(schema => !schema?.field && schema?.component !== 'Divider')) {
      console.error('All children of the form Schema array that need to be updated must contain the `field` field');
      return;
    }
    innerFormSchemas.value = innerFormSchemas.value.map(schema => {
      const update = updates.find(item => item.field === schema.field);
      if (!update) return schema;
      const result = merge(cloneSchema(schema), update);
      const original = originComponentPropsFnMap.get(schema.field);
      const override = update.componentProps;
      if (original) {
        result.componentProps = context => ({
          ...original(context), ...(typeof override === 'function' ? override(context) : override),
        });
      }
      return result;
    });
  }

  return {
    ...formState, setFieldsValue, resetFields, handleSubmit, submit: handleSubmit,
    resetSchema, appendSchemaByField: (schema, field) => insertSchema(schema, field, true),
    insertBeforeSchemaByField: (schema, field) => insertSchema(schema, field, false),
    removeSchemaByField, getSchemaByField, updateSchema, clearValidateMessages,
  };
}
