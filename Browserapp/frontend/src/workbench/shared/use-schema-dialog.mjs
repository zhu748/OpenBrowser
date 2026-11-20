import { Fragment, h, mergeProps, nextTick, ref } from './workbench-vue.js';
import { n as SchemaForm } from './rx-form-A3sc3aGh.js';
import { t as useWorkbenchDialog } from './useDialog-BC-nc8J-.js';

const forms = new WeakMap();

function useSchemaDialog() {
  const [showDialog] = useWorkbenchDialog();
  async function open(options) {
    const { dialogSlots, formProps, schemas, handleOk, ...attributes } = options;
    const formRef = ref();
    const controls = showDialog({
      ...attributes,
      async handleOk() {
        const form = formRef.value;
        if (!form) return false;
        let values;
        try { values = await form.submit(); }
        catch (error) {
          if (error === form.errors) return false;
          throw error;
        }
        return handleOk?.(values);
      },
      slots: {
        default: () => h(Fragment, null, [dialogSlots?.beforeForm?.(),
          h(SchemaForm, mergeProps({ ref: formRef }, formProps, { schemas, footer: false }))]),
        ...dialogSlots,
      },
    });
    if (!forms.has(controls)) forms.set(controls, formRef);
    await nextTick();
    return { ...controls, formRef: forms.get(controls) };
  }
  return [open];
}

export { useSchemaDialog as t };
