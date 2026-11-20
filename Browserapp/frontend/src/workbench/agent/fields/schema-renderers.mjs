import { defineComponent, h } from './workbench-vue.js';
import Select from './workbench-agent-select.js';
import {
  rendererProps,
  useControl,
  useEnumControl,
  useNumericControl,
  rankWith,
  isEnumControl,
  isNumericControl,
  ControlWrapper,
  resolveSchema,
  defaultRenderers,
  composeStyles,
  defaultStyles,
} from './ScriptSchemaForm-z_48GvPJ.js';

function renderControl(field, renderInput) {
  return h(
    ControlWrapper,
    {
      ...field.controlWrapper.value,
      styles: field.styles,
      isFocused: field.isFocused.value,
      appliedOptions: field.appliedOptions.value,
    },
    { default: renderInput },
  );
}

function focusHandlers(field) {
  return {
    onFocus: () => {
      field.isFocused.value = true;
    },
    onBlur: () => {
      field.isFocused.value = false;
    },
  };
}

function wrapDescription(entry) {
  const name = entry.renderer.name;
  if (!name?.endsWith('ControlRenderer')) return entry;

  const Control = entry.renderer;
  const renderer = defineComponent({
    name: name + 'WithPersistentDescription',
    props: rendererProps(),
    setup(props) {
      return () => {
        const { description } = resolveSchema(
          props.schema,
          props.uischema.scope,
          props.schema,
        );
        const detail =
          typeof description === 'string' && description
            ? h('div', { class: 'script-jsonforms__description' }, description)
            : null;
        return h('div', { class: 'script-jsonforms__control-shell' }, [
          h(Control, { ...props }),
          detail,
        ]);
      };
    },
  });
  return { ...entry, renderer };
}

export function createRenderers() {
  const enumRenderer = {
    tester: rankWith(3, isEnumControl),
    renderer: defineComponent({
      name: 'ScriptSchemaEnumControlRenderer',
      props: rendererProps(),
      setup(props) {
        const field = useControl(useEnumControl(props));
        return () => {
          const control = field.control.value;
          return renderControl(field, () =>
            h(Select, {
              id: control.id + '-input',
              modelValue: control.data,
              options: control.options,
              optionLabel: 'label',
              optionValue: 'value',
              disabled: !control.enabled,
              autofocus: !!field.appliedOptions.value.focus,
              'onUpdate:modelValue': (value) =>
                field.handleChange(control.path, value ?? undefined),
              ...focusHandlers(field),
            }),
          );
        };
      },
    }),
  };
  const numberRenderer = {
    tester: rankWith(3, isNumericControl),
    renderer: defineComponent({
      name: 'ScriptSchemaNumberControlRenderer',
      props: rendererProps(),
      setup(props) {
        const field = useControl(useNumericControl(props), (input) =>
          input.value === '' ? undefined : Number(input.value),
        );
        return () => {
          const control = field.control.value;
          return renderControl(field, () =>
            h('input', {
              id: control.id + '-input',
              type: 'number',
              step: 'any',
              class: field.styles.control.input,
              value: control.data,
              disabled: !control.enabled,
              autofocus: !!field.appliedOptions.value.focus,
              placeholder: field.appliedOptions.value.placeholder,
              onChange: field.onChange,
              ...focusHandlers(field),
            }),
          );
        };
      },
    }),
  };
  return Object.freeze(
    [enumRenderer, numberRenderer, ...defaultRenderers].map(wrapDescription),
  );
}

export function createStyles() {
  return composeStyles(defaultStyles, {
    control: {
      root: 'script-jsonforms__control',
      wrapper: 'script-jsonforms__wrapper',
      label: 'script-jsonforms__label',
      description: 'script-jsonforms__description',
      error: 'script-jsonforms__error',
      input: 'script-jsonforms__input',
      textarea: 'script-jsonforms__textarea',
      select: 'script-jsonforms__select',
      option: 'script-jsonforms__option',
      asterisk: 'script-jsonforms__asterisk',
    },
    verticalLayout: {
      root: 'script-jsonforms__vertical-layout',
      item: 'script-jsonforms__layout-item',
    },
    horizontalLayout: {
      root: 'script-jsonforms__horizontal-layout',
      item: 'script-jsonforms__layout-item',
    },
    group: {
      root: 'script-jsonforms__group',
      label: 'script-jsonforms__group-label',
      item: 'script-jsonforms__group-item',
    },
    arrayList: {
      root: 'script-jsonforms__array',
      legend: 'script-jsonforms__array-legend',
      addButton: 'script-jsonforms__array-add',
      label: 'script-jsonforms__array-label',
      itemWrapper: 'script-jsonforms__array-item-wrapper',
      noData: 'script-jsonforms__array-empty',
      item: 'script-jsonforms__array-item',
      itemToolbar: 'script-jsonforms__array-toolbar',
      itemLabel: 'script-jsonforms__array-item-label',
      itemContent: 'script-jsonforms__array-content',
      itemExpanded: 'script-jsonforms__array-content--expanded',
      itemMoveUp:
        'script-jsonforms__array-action script-jsonforms__array-action--up',
      itemMoveDown:
        'script-jsonforms__array-action script-jsonforms__array-action--down',
      itemDelete:
        'script-jsonforms__array-action script-jsonforms__array-action--delete',
    },
    oneOf: { root: 'script-jsonforms__one-of' },
    dialog: {
      root: 'script-jsonforms__dialog',
      title: 'script-jsonforms__dialog-title',
      body: 'script-jsonforms__dialog-body',
      actions: 'script-jsonforms__dialog-actions',
      buttonPrimary:
        'script-jsonforms__dialog-button script-jsonforms__dialog-button--primary',
      buttonSecondary: 'script-jsonforms__dialog-button',
    },
  });
}
