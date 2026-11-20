import { defineComponent, inject, provide } from './workbench-vue.js';

const formContext = Symbol('workbench form');
export function provideForm(context) { provide(formContext, context); }
export function useForm() { return inject(formContext); }

export const FormFieldIsolate = defineComponent({
  setup(_, { slots }) {
    provide('$pcFormField', null);
    return () => slots.default?.();
  },
});

export function nextEnabledIndex(options, index, direction, disabled) {
  if (index < 0 && direction < 0) index = 0;
  for (let offset = 0; offset < options.length; offset++) {
    index = (index + direction + options.length) % options.length;
    if (!disabled(options[index])) return index;
  }
  return -1;
}
